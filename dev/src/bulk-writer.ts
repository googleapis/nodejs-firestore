/*!
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as assert from 'assert';

import {FieldPath, Firestore} from '.';
import {delayExecution} from './backoff';
import {DocumentReference} from './reference';
import {Timestamp} from './timestamp';
import {
  BulkWriterOptions,
  DocumentData,
  Precondition,
  SetOptions,
  UpdateData,
} from './types';
import {Deferred} from './util';
import {BatchWriteResult, WriteBatch, WriteResult} from './write-batch';

/**
 * The default maximum number of writes that can be in a single batch.
 */
const DEFAULT_BULK_WRITER_MAX_BATCH_SIZE = 500;

/**
 * The starting maximum number of operations per second as allowed by the
 * 5/5/5 rule.
 */
const STARTING_MAXIMUM_OPS_PER_SECOND = 500;

/**
 * Used to represent a batch on the BatchQueue.
 *
 * @private
 */
class BulkCommitBatch {
  // The set of references present in the WriteBatch.
  readonly refsInBatch = new Set<DocumentReference>();

  // Whether the batch is ready to be sent. Writes cannot be added once a batch
  // is marked as pending.
  private _pending = false;

  // When the batch was sent. Writes cannot be added to batches that have
  // already been sent.
  private _sendTime: Timestamp | null = null;

  // A deferred promise that is resolved after the batch has been sent, and a
  // response is received.
  private completedDeferred = new Deferred<void>();

  // A map from each WriteBatch operation to its corresponding result.
  private resultsMap = new Map<number, Deferred<BatchWriteResult>>();

  constructor(
    readonly id: number,
    private readonly writeBatch: WriteBatch,
    private readonly maxBatchSize: number
  ) {}

  get sendTime(): Timestamp | null {
    return this._sendTime;
  }

  get opCount(): number {
    return this.writeBatch.opCount;
  }

  get pending(): boolean {
    return this._pending;
  }

  /**
   * Adds a `create` operation to the WriteBatch. Returns a promise that
   * resolves with the result of the write.
   */
  create(
    documentRef: DocumentReference,
    data: DocumentData
  ): Promise<WriteResult> {
    this.refsInBatch.add(documentRef);
    this.writeBatch.create(documentRef, data);
    this.resultsMap.set(
      this.writeBatch.opCount,
      new Deferred<BatchWriteResult>()
    );
    return this.getResult(this.writeBatch.opCount);
  }

  /**
   * Adds a `delete` operation to the WriteBatch. Returns a promise that
   * resolves with the result of the delete.
   */
  delete(
    documentRef: DocumentReference,
    precondition?: Precondition
  ): Promise<WriteResult> {
    this.refsInBatch.add(documentRef);
    this.writeBatch.delete(documentRef, precondition);
    this.resultsMap.set(
      this.writeBatch.opCount,
      new Deferred<BatchWriteResult>()
    );
    return this.getResult(this.writeBatch.opCount);
  }

  /**
   * Adds a `set` operation to the WriteBatch. Returns a promise that
   * resolves with the result of the write.
   */
  set(
    documentRef: DocumentReference,
    data: DocumentData,
    options?: SetOptions
  ): Promise<WriteResult> {
    this.refsInBatch.add(documentRef);
    this.writeBatch.set(documentRef, data, options);
    this.resultsMap.set(
      this.writeBatch.opCount,
      new Deferred<BatchWriteResult>()
    );
    return this.getResult(this.writeBatch.opCount);
  }

  /**
   * Adds an `update` operation to the WriteBatch. Returns a promise that
   * resolves with the result of the write.
   */
  update(
    documentRef: DocumentReference,
    dataOrField: UpdateData | string | FieldPath,
    ...preconditionOrValues: Array<
      {lastUpdateTime?: Timestamp} | unknown | string | FieldPath
    >
  ): Promise<WriteResult> {
    this.refsInBatch.add(documentRef);
    this.writeBatch.update(documentRef, dataOrField, ...preconditionOrValues);
    this.resultsMap.set(
      this.writeBatch.opCount,
      new Deferred<BatchWriteResult>()
    );
    return this.getResult(this.writeBatch.opCount);
  }

  /**
   * Returns whether a write containing the provided document reference can be
   * added to this batch.
   */
  canAddDoc(documentRef: DocumentReference): boolean {
    return (
      !this.pending &&
      this.writeBatch.opCount < this.maxBatchSize &&
      !this.refsInBatch.has(documentRef)
    );
  }

  /**
   * Commits the batch and returns a promise that resolves with the result of
   * all writes in this batch.
   */
  bulkCommit(): Promise<BatchWriteResult[]> {
    assert(this._sendTime === null, 'The batch should not have been sent yet.');
    this._sendTime = Timestamp.now();
    return this.writeBatch.bulkCommit();
  }

  /**
   * Returns the a promise that resolves with the result for the write in the
   * WriteBatch at the provided index.
   */
  getResult(opCount: number): Promise<WriteResult> {
    return this.resultsMap.get(opCount)!.promise.then(result => {
      if (result.writeTime) {
        return new WriteResult(result.writeTime);
      } else {
        throw result.status;
      }
    });
  }

  /**
   * Resolves the individual operations in the batch with the results.
   */
  resolveResults(results: BatchWriteResult[]): void {
    results.map((result, index) => {
      this.resultsMap.get(index + 1)!.resolve(result);
    });
    this.completedDeferred.resolve();
  }

  /**
   * Returns a promise that resolves when the batch has been sent, and a
   * response is received.
   */
  awaitBatch(): Promise<void> {
    this._pending = true;
    return this.completedDeferred.promise;
  }
}

/**
 * A Firestore BulkWriter than can be used to perform large amounts of writes in
 * parallel. Writes to the same document will be executed sequentially.
 *
 * @class
 */
export class BulkWriter {
  // The maximum number of writes that can be in a single batch.
  private maxBatchSize = DEFAULT_BULK_WRITER_MAX_BATCH_SIZE;

  /**
   * A queue of batches to be written.
   */
  private batchQueue: BulkCommitBatch[] = [];

  /**
   * A set of all document references that are currently in flight.
   */
  private refsInFlight = new Set<DocumentReference>();

  /**
   * Counter used to generate ids for batches.
   */
  private currentId = 0;

  /**
   * Whether this BulkWriter instance is closed. Once closed, it cannot be
   * opened again.
   */
  private closed = false;

  /**
   * The maximum number of operations per second as determined by the 500/50/5
   * rule. This value gradually increases with time.
   */
  private maxOpsPerSecond = STARTING_MAXIMUM_OPS_PER_SECOND;

  constructor(
    private readonly firestore: Firestore,
    private readonly options?: BulkWriterOptions
  ) {
    if (options && !options.disableThrottling) {
      this.rampMaxOps();
    }
  }

  /**
   * Create a document with the provided data. This single operation will fail
   * if a document exists at its location.
   *
   * @param {DocumentReference} documentRef A reference to the document to be
   * created.
   * @param {T} data The object to serialize as the document.
   * @returns {Promise<WriteResult>} A promise that resolves with the result of
   * the write. Throws an error if the write fails.
   *
   * @example
   * let bulkWriter = firestore.bulkWriter();
   * let documentRef = firestore.collection('col').doc();
   *
   * bulkWriter
   *  .create(documentRef, {foo: 'bar'})
   *  .then(result => {
   *    console.log('Successfully executed write at: ', result);
   *  })
   *  .catch(err => {
   *    console.log('Write failed with: ', err);
   *  });
   * });
   */
  create(
    documentRef: DocumentReference,
    data: DocumentData
  ): Promise<WriteResult> {
    this.verifyNotClosed();
    const bulkCommitBatch = this.getEligibleBatch(documentRef);
    return bulkCommitBatch.create(documentRef, data);
  }

  /**
   * Delete a document from the database.
   *
   * @param {DocumentReference} documentRef A reference to the document to be
   * deleted.
   * @param {Precondition=} precondition A precondition to enforce for this
   * delete.
   * @param {Timestamp=} precondition.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime. Fails the batch if the
   * document doesn't exist or was last updated at a different time.
   * @returns {Promise<WriteResult>} A promise that resolves with the result of
   * the write. Throws an error if the write fails.
   *
   * @example
   * let bulkWriter = firestore.bulkWriter();
   * let documentRef = firestore.collection('col').doc();
   *
   * bulkWriter
   *  .delete(documentRef)
   *  .then(result => {
   *    console.log('Successfully delete document at: ', result);
   *  })
   *  .catch(err => {
   *    console.log('Delete failed with: ', err);
   *  });
   * });
   */
  delete(
    documentRef: DocumentReference,
    precondition?: Precondition
  ): Promise<WriteResult> {
    this.verifyNotClosed();
    const bulkCommitBatch = this.getEligibleBatch(documentRef);
    return bulkCommitBatch.delete(documentRef, precondition);
  }

  /**
   * Write to the document referred to by the provided
   * [DocumentReference]{@link DocumentReference}. If the document does not
   * exist yet, it will be created. If you pass [SetOptions]{@link SetOptions}.,
   * the provided data can be merged into the existing document.
   *
   * @param {DocumentReference} documentRef A reference to the document to be
   * set.
   * @param {T} data The object to serialize as the document.
   * @param {SetOptions=} options An object to configure the set behavior.
   * @param {boolean=} options.merge - If true, set() merges the values
   * specified in its data argument. Fields omitted from this set() call remain
   * untouched.
   * @param {Array.<string|FieldPath>=} options.mergeFields - If provided, set()
   * only replaces the specified field paths. Any field path that is not
   * specified is ignored and remains untouched.
   * @returns {Promise<WriteResult>} A promise that resolves with the result of
   * the write. Throws an error if the write fails.
   *
   *
   * @example
   * let bulkWriter = firestore.bulkWriter();
   * let documentRef = firestore.collection('col').doc();
   *
   * bulkWriter
   *  .set(documentRef, {foo: 'bar'})
   *  .then(result => {
   *    console.log('Successfully executed write at: ', result);
   *  })
   *  .catch(err => {
   *    console.log('Write failed with: ', err);
   *  });
   * });
   */
  set(
    documentRef: DocumentReference,
    data: DocumentData,
    options?: SetOptions
  ): Promise<WriteResult> {
    this.verifyNotClosed();
    const bulkCommitBatch = this.getEligibleBatch(documentRef);
    return bulkCommitBatch.set(documentRef, data, options);
  }

  /**
   * Update fields of the document referred to by the provided
   * [DocumentReference]{@link DocumentReference}. If the document doesn't yet
   * exist, the update fails and the entire batch will be rejected.
   *
   * The update() method accepts either an object with field paths encoded as
   * keys and field values encoded as values, or a variable number of arguments
   * that alternate between field paths and field values. Nested fields can be
   * updated by providing dot-separated field path strings or by providing
   * FieldPath objects.
   *
   *
   * A Precondition restricting this update can be specified as the last
   * argument.
   *
   * @param {DocumentReference} documentRef A reference to the document to be
   * updated.
   * @param {UpdateData|string|FieldPath} dataOrField An object containing the
   * fields and values with which to update the document or the path of the
   * first field to update.
   * @param {...(Precondition|*|string|FieldPath)} preconditionOrValues - An
   * alternating list of field paths and values to update or a Precondition to
   * restrict this update
   * @returns {Promise<WriteResult>} A promise that resolves with the result of
   * the write. Throws an error if the write fails.
   *
   *
   * @example
   * let bulkWriter = firestore.bulkWriter();
   * let documentRef = firestore.collection('col').doc();
   *
   * bulkWriter
   *  .update(documentRef, {foo: 'bar'})
   *  .then(result => {
   *    console.log('Successfully executed write at: ', result);
   *  })
   *  .catch(err => {
   *    console.log('Write failed with: ', err);
   *  });
   * });
   */
  update(
    documentRef: DocumentReference,
    dataOrField: UpdateData | string | FieldPath,
    ...preconditionOrValues: Array<
      {lastUpdateTime?: Timestamp} | unknown | string | FieldPath
    >
  ): Promise<WriteResult> {
    this.verifyNotClosed();
    const bulkCommitBatch = this.getEligibleBatch(documentRef);
    return bulkCommitBatch.update(
      documentRef,
      dataOrField,
      preconditionOrValues
    );
  }

  /**
   * Commits all writes that have been enqueued up to this point in parallel.
   *
   * Returns a Promise that resolves when there are no more pending writes. It
   * never fails.
   *
   * The promise resolves immediately if there are no pending writes. Otherwise,
   * the Promise waits for all previously issued writes, but it does not wait
   * for writes that were added after the method is called. If you want to wait
   * for additional writes, call `flush()` again.
   *
   * @return {Promise<void>} A promise that resolves when there are no more
   * pending writes.
   *
   * @example
   * let bulkWriter = firestore.bulkWriter();
   *
   * bulkWriter.create(documentRef, {foo: 'bar'});
   * bulkWriter.update(documentRef2, {foo: 'bar'});
   * bulkWriter.delete(documentRef3);
   * await flush().then(() => {
   *   console.log('Successfully executed all writes');
   * });
   */
  flush(): Promise<void> {
    this.verifyNotClosed();
    return this._flush();
  }

  /**
   * Commits all enqueued writes and marks the BulkWriter instance as closed.
   *
   * After calling `close()`, calling any method wil throw an error.
   *
   * Returns a Promise that resolves when there are no more pending writes. It
   * never fails. Calling this method will send all requests. The promise
   * resolves immediately if there are no pending writes.
   *
   * @return {Promise<void>} A promise that resolves when there are no more
   * pending writes.
   *
   * @example
   * let bulkWriter = firestore.bulkWriter();
   *
   * bulkWriter.create(documentRef, {foo: 'bar'});
   * bulkWriter.update(documentRef2, {foo: 'bar'});
   * bulkWriter.delete(documentRef3);
   * await close().then(() => {
   *   console.log('Successfully executed all writes');
   * });
   */
  close(): Promise<void> {
    this.verifyNotClosed();
    this.closed = true;
    return this._flush();
  }

  private async _flush(): Promise<void> {
    const trackedBatches = this.batchQueue;
    const writePromises = trackedBatches.map(batch => batch.awaitBatch());
    this.sendBatches();
    await Promise.all(writePromises);
  }

  private verifyNotClosed(): void {
    if (this.closed) {
      throw new Error('BulkWriter has already been closed.');
    }
  }

  /**
   * Gradually ramps up the maximum number of operations per second by 50%
   * every 5 minutes in line with the 500/50/5 rule.
   */
  private rampMaxOps(): void {
    delayExecution(() => {
      this.maxOpsPerSecond = this.maxOpsPerSecond * 1.5;
      this.rampMaxOps();
    }, 5 * 60 * 1000);
  }

  /**
   * Return the first eligible batch that can hold a write to the provided
   * reference, or creates one if no eligible batches are found.
   */
  private getEligibleBatch(ref: DocumentReference): BulkCommitBatch {
    let batch = null;
    let logWarning = this.batchQueue.length > 0;
    for (const bulkBatch of this.batchQueue) {
      if (!bulkBatch.refsInBatch.has(ref)) {
        logWarning = false;
      }
      if (bulkBatch.canAddDoc(ref)) {
        batch = bulkBatch;
      }
    }

    if (batch === null) {
      if (logWarning) {
        console.warn(
          '[BulkWriter]',
          'Writing to the same document multiple times will slow down BulkWriter. ' +
            'Write to unique documents in order to maximize throughput.'
        );
      }
      return this.createNewBatch();
    } else {
      return batch;
    }
  }

  private createNewBatch(): BulkCommitBatch {
    const newBatch = new BulkCommitBatch(
      this.getId(),
      this.firestore.batch(),
      this.maxBatchSize
    );

    this.batchQueue.push(newBatch);
    return newBatch;
  }

  private getId(): number {
    const id = this.currentId;
    if (this.currentId === Number.MAX_SAFE_INTEGER) {
      this.currentId = 0;
    } else {
      this.currentId++;
    }
    return id;
  }

  /**
   * Attempts to send batches starting from the front of the BatchQueue until a
   * batch cannot be sent.
   *
   * After a batch is complete, try sending batches again.
   */
  private sendBatches(): void {
    if (this.batchQueue.length === 0) {
      return;
    }

    let index = 0;
    const unsentBatches = this.batchQueue.filter(
      batch => batch.sendTime === null
    );

    while (
      unsentBatches.length > index &&
      this.isBatchSendable(unsentBatches[index])
    ) {
      const batch = unsentBatches[index];
      batch.refsInBatch.forEach(batch => {
        this.refsInFlight.add(batch);
      });

      batch.bulkCommit().then(results => {
        batch.resolveResults(results);

        const batchIndex = this.batchQueue.indexOf(batch);
        assert(batchIndex !== -1, 'The batch should be in the BatchQueue');
        this.batchQueue.splice(batchIndex, 1);

        // Remove references that are no longer in flight.
        batch.refsInBatch.forEach(batch => {
          this.refsInFlight.delete(batch);
        });

        this.sendBatches();
      });

      index++;
    }
  }

  /**
   * Checks that the provided batch is sendable. To be sendable, a batch must:
   * (1) be marked as pending
   * (2) not write to references that are currently in flight
   * (3) stays under the operations rate limit if sent
   */
  private isBatchSendable(batch: BulkCommitBatch): boolean {
    if (!batch.pending) {
      return false;
    }

    for (const ref of batch.refsInBatch) {
      if (this.refsInFlight.has(ref)) {
        return false;
      }
    }

    if (this.options && this.options.disableThrottling) {
      return true;
    }

    // Get the number of operations sent in the past second.
    const cutoffMillis = Timestamp.now().toMillis() - 1 * 1000;
    const opCount = this.batchQueue
      .filter(batch => {
        batch.sendTime !== null && batch.sendTime.toMillis() > cutoffMillis;
      })
      .map(batch => batch.opCount)
      .reduce((acc, val) => {
        return acc + val;
      }, 0);

    if (opCount + batch.opCount > this.maxOpsPerSecond) {
      return false;
    }

    return true;
  }

  /**
   * Sets the maximum number of allowed operations per second.
   *
   * @private
   */
  // Visible for testing.
  setMaxOpsPerSecond(maxOps: number): void {
    this.maxOpsPerSecond = maxOps;
  }

  /**
   * Sets the maximum number of allowed operations in a batch.
   *
   * @private
   */
  // Visible for testing.
  setMaxBatchSize(size: number): void {
    this.maxBatchSize = size;
  }
}
