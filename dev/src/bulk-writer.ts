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
const MAX_BATCH_SIZE = 500;

/**
 * The starting maximum number of operations per second as allowed by the
 * 500/50/5 rule.
 *
 * https://cloud.google.com/datastore/docs/best-practices#ramping_up_traffic.
 */
const STARTING_MAXIMUM_OPS_PER_SECOND = 500;

/**
 * Used to represent a batch on the BatchQueue.
 *
 * @private
 */
class BulkCommitBatch {
  // Whether the batch is ready to be sent. Writes cannot be added once a batch
  // is marked as ready to send.
  readyToSend = false;

  // When the batch was sent. Writes cannot be added to batches that have
  // already been sent.
  sendTime: Timestamp | null = null;

  // The set of document reference ids present in the WriteBatch.
  readonly docPaths = new Set<string>();

  // A deferred promise that is resolved after the batch has been sent, and a
  // response is received.
  private completedDeferred = new Deferred<void>();

  // A map from each WriteBatch operation to its corresponding result.
  private resultsMap = new Map<number, Deferred<BatchWriteResult>>();

  constructor(
    private readonly writeBatch: WriteBatch,
    private readonly maxBatchSize: number
  ) {}

  /**
   * The number of writes in this batch.
   *
   * @property
   */
  get opCount(): number {
    return this.resultsMap.size;
  }

  /**
   * Adds a `create` operation to the WriteBatch. Returns a promise that
   * resolves with the result of the write.
   */
  create(
    documentRef: DocumentReference,
    data: DocumentData
  ): Promise<WriteResult> {
    this.writeBatch.create(documentRef, data);
    return this.processOperation(documentRef);
  }

  /**
   * Adds a `delete` operation to the WriteBatch. Returns a promise that
   * resolves with the result of the delete.
   */
  delete(
    documentRef: DocumentReference,
    precondition?: Precondition
  ): Promise<WriteResult> {
    this.writeBatch.delete(documentRef, precondition);
    return this.processOperation(documentRef);
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
    this.writeBatch.set(documentRef, data, options);
    return this.processOperation(documentRef);
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
    this.writeBatch.update(documentRef, dataOrField, ...preconditionOrValues);
    return this.processOperation(documentRef);
  }

  /**
   * Helper to update data structures associated with the operation and
   * return the result.
   */
  private processOperation(
    documentRef: DocumentReference
  ): Promise<WriteResult> {
    assert(
      !this.docPaths.has(documentRef.path),
      'Batch should not contain writes to the same document'
    );
    this.docPaths.add(documentRef.path);
    this.resultsMap.set(this.opCount, new Deferred<BatchWriteResult>());

    return this.resultsMap.get(this.opCount - 1)!.promise.then(result => {
      if (result.writeTime) {
        return new WriteResult(result.writeTime);
      } else {
        throw result.status;
      }
    });
  }

  /**
   * Returns whether a write containing the provided document reference can be
   * added to this batch.
   */
  canAddDoc(documentRef: DocumentReference): boolean {
    return (
      !this.readyToSend &&
      this.opCount < this.maxBatchSize &&
      !this.docPaths.has(documentRef.path)
    );
  }

  /**
   * Commits the batch and returns a promise that resolves with the result of
   * all writes in this batch.
   */
  bulkCommit(): Promise<BatchWriteResult[]> {
    assert(this.sendTime === null, 'The batch should not have been sent yet.');
    this.sendTime = Timestamp.now();
    return this.writeBatch.bulkCommit();
  }

  /**
   * Resolves the individual operations in the batch with the results.
   */
  processResults(results: BatchWriteResult[]): void {
    results.map((result, index) => {
      this.resultsMap.get(index)!.resolve(result);
    });
    this.completedDeferred.resolve();
  }

  /**
   * Returns a promise that resolves when the batch has been sent, and a
   * response is received.
   */
  awaitBatch(): Promise<void> {
    this.readyToSend = true;
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
  /**
   * The maximum number of writes that can be in a single batch.
   */
  private maxBatchSize = MAX_BATCH_SIZE;

  /**
   * A queue of batches to be written.
   */
  private batchQueue: BulkCommitBatch[] = [];

  /**
   * Whether this BulkWriter instance is closed. Once closed, it cannot be
   * opened again.
   */
  private closed = false;

  /**
   * When the BulkWriter instance was created. Used in calculating the rate
   * limits for the 500/50/5 rule.
   */
  private startTime = Timestamp.now();

  private readonly options: BulkWriterOptions = {};

  constructor(
    private readonly firestore: Firestore,
    options?: BulkWriterOptions
  ) {
    this.options = {...options};
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
    const resultPromise = bulkCommitBatch.create(documentRef, data);
    this.sendBatchIfFull(bulkCommitBatch);
    return resultPromise;
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
   * let documentRef = firestore.doc('col/doc');
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
    const resultPromise = bulkCommitBatch.delete(documentRef, precondition);
    this.sendBatchIfFull(bulkCommitBatch);
    return resultPromise;
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
    const resultPromise = bulkCommitBatch.set(documentRef, data, options);
    this.sendBatchIfFull(bulkCommitBatch);
    return resultPromise;
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
   * let documentRef = firestore.doc('col/doc');
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
    const resultPromise = bulkCommitBatch.update(
      documentRef,
      dataOrField,
      preconditionOrValues
    );
    this.sendBatchIfFull(bulkCommitBatch);
    return resultPromise;
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
   *   console.log('Executed all writes');
   * });
   */
  async flush(): Promise<void> {
    this.verifyNotClosed();
    const trackedBatches = this.batchQueue;
    const writePromises = trackedBatches.map(batch => batch.awaitBatch());
    this.sendBatches();
    await Promise.all(writePromises);
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
   *   console.log('Executed all writes');
   * });
   */
  close(): Promise<void> {
    const flushPromise = this.flush();
    this.closed = true;
    return flushPromise;
  }

  private verifyNotClosed(): void {
    if (this.closed) {
      throw new Error('BulkWriter has already been closed.');
    }
  }

  /**
   * Return the first eligible batch that can hold a write to the provided
   * reference, or creates one if no eligible batches are found.
   */
  private getEligibleBatch(ref: DocumentReference): BulkCommitBatch {
    let batch = null;
    let logWarning = this.batchQueue.length > 0;
    for (const bulkBatch of this.batchQueue) {
      if (!bulkBatch.docPaths.has(ref.path)) {
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
      this.firestore.batch(),
      this.maxBatchSize
    );

    this.batchQueue.push(newBatch);
    return newBatch;
  }

  /**
   * Attempts to send batches starting from the front of the BatchQueue until a
   * batch cannot be sent.
   *
   * After a batch is complete, try sending batches again.
   */
  private sendBatches(): void {
    const unsentBatches = this.batchQueue.filter(
      batch => batch.readyToSend === true && batch.sendTime === null
    );

    let index = 0;
    while (
      unsentBatches.length > index &&
      this.isBatchSendable(unsentBatches[index])
    ) {
      const batch = unsentBatches[index];

      batch.bulkCommit().then(results => {
        batch.processResults(results);

        const batchIndex = this.batchQueue.indexOf(batch);
        assert(batchIndex !== -1, 'The batch should be in the BatchQueue');
        this.batchQueue.splice(batchIndex, 1);

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
    if (!batch.readyToSend) {
      return false;
    }

    for (const path of batch.docPaths) {
      if (this.isRefInFlight(path)) {
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

    if (
      opCount + batch.opCount >
      BulkWriter.calculateMaxOps(Timestamp.now(), this.startTime)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Whether the provided document reference path is currently in flight.
   */
  private isRefInFlight(docPath: string): boolean {
    const refsInFlight = new Set<string>();
    this.batchQueue
      .filter(batch => batch.sendTime !== null)
      .map(batch => batch.docPaths.forEach(path => refsInFlight.add(path)));
    return refsInFlight.has(docPath);
  }

  /**
   * Sends the batch if it is at the maximum allowed size.
   */
  private sendBatchIfFull(batch: BulkCommitBatch): void {
    if (batch.opCount === this.maxBatchSize) {
      batch.readyToSend = true;
      this.sendBatches();
    }
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

  /**
   * Calculates the number of allowed operations per second according to the
   * 500/50/5 rule based on the startTime and currentTime.
   *
   * @private
   */
  // Visible for testing.
  static calculateMaxOps(currentTime: Timestamp, startTime: Timestamp): number {
    assert(currentTime.valueOf() >= startTime.valueOf(), 'startTime cannot be after currentTime');
    const minutesElapsed = Math.floor(
      (currentTime.toMillis() - startTime.toMillis()) / (60 * 1000)
    );
    const operationsPerSecond = Math.floor(
      Math.pow(1.5, Math.floor(minutesElapsed / 5)) *
        STARTING_MAXIMUM_OPS_PER_SECOND
    );
    return operationsPerSecond;
  }
}
