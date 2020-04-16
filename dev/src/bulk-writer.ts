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
import {DocumentReference} from './reference';
import {Timestamp} from './timestamp';
import {DocumentData, Precondition, SetOptions, UpdateData} from './types';
import {Deferred} from './util';
import {BatchWriteResult, WriteBatch, WriteResult} from './write-batch';

/**
 * The maximum number of writes that can be in a single batch.
 */
const MAX_BATCH_SIZE = 500;

/**
 * Used to represent the state of batch.
 *
 * Writes can only be added while the batch is OPEN. For a batch to be sent,
 * the batch must be READY_TO_SEND. After a batch is sent, it is marked as SENT.
 */
enum BatchState {
  OPEN,
  READY_TO_SEND,
  SENT,
}

/**
 * Used to represent a batch on the BatchQueue.
 *
 * @private
 */
class BulkCommitBatch {
  /**
   * The state of the batch.
   */
  state = BatchState.OPEN;

  // The set of document reference paths present in the WriteBatch.
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
    const deferred = new Deferred<BatchWriteResult>();
    this.resultsMap.set(this.opCount, deferred);

    if (this.opCount === this.maxBatchSize) {
      this.state = BatchState.READY_TO_SEND;
    }

    return deferred.promise.then(result => {
      if (result.writeTime) {
        return new WriteResult(result.writeTime);
      } else {
        throw result.status;
      }
    });
  }

  /**
   * Commits the batch and returns a promise that resolves with the result of
   * all writes in this batch.
   */
  bulkCommit(): Promise<BatchWriteResult[]> {
    assert(
      this.state === BatchState.READY_TO_SEND,
      'The batch should be marked as READY_TO_SEND before committing'
    );
    this.state = BatchState.SENT;
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
    this.markReadyToSend();
    return this.completedDeferred.promise;
  }

  markReadyToSend(): void {
    if (this.state === BatchState.OPEN) {
      this.state = BatchState.READY_TO_SEND;
    }
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

  constructor(private readonly firestore: Firestore) {}

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
    this.sendReadyBatches();
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
   *    console.log('Successfully deleted document at: ', result);
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
    this.sendReadyBatches();
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
    this.sendReadyBatches();
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
    this.sendReadyBatches();
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
    this.sendReadyBatches();
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
    let eligibleBatch = null;
    let logWarning = false;
    if (this.batchQueue.length > 0) {
      const lastBatch = this.batchQueue[this.batchQueue.length - 1];
      if (lastBatch.state === BatchState.OPEN) {
        if (!lastBatch.docPaths.has(ref.path)) {
          eligibleBatch = lastBatch;
        } else {
          logWarning = true;
        }
      }
    }

    if (eligibleBatch === null) {
      if (logWarning) {
        console.warn(
          '[BulkWriter]',
          `Duplicate write to document "${ref.path}" detected.`,
          'Writing to the same document multiple times will slow down BulkWriter. ' +
            'Write to unique documents in order to maximize throughput.'
        );
      }
      return this.createNewBatch();
    } else {
      return eligibleBatch;
    }
  }

  private createNewBatch(): BulkCommitBatch {
    const newBatch = new BulkCommitBatch(
      this.firestore.batch(),
      this.maxBatchSize
    );

    if (this.batchQueue.length > 0) {
      this.batchQueue[this.batchQueue.length - 1].markReadyToSend();
      this.sendReadyBatches();
    }
    this.batchQueue.push(newBatch);
    return newBatch;
  }

  /**
   * Attempts to send batches starting from the front of the BatchQueue until a
   * batch cannot be sent.
   *
   * After a batch is complete, try sending batches again.
   */
  private sendReadyBatches(): void {
    const unsentBatches = this.batchQueue.filter(
      batch => batch.state === BatchState.READY_TO_SEND
    );

    let index = 0;
    while (
      index < unsentBatches.length &&
      this.isBatchSendable(unsentBatches[index])
    ) {
      const batch = unsentBatches[index];

      batch.bulkCommit().then(results => {
        batch.processResults(results);

        // Remove the batch from the BatchQueue after it has been processed.
        const batchIndex = this.batchQueue.indexOf(batch);
        assert(batchIndex !== -1, 'The batch should be in the BatchQueue');
        this.batchQueue.splice(batchIndex, 1);

        this.sendReadyBatches();
      });

      index++;
    }
  }

  /**
   * Checks that the provided batch is sendable. To be sendable, a batch must:
   * (1) be marked as READY_TO_SEND
   * (2) not write to references that are currently in flight
   */
  private isBatchSendable(batch: BulkCommitBatch): boolean {
    if (batch.state !== BatchState.READY_TO_SEND) {
      return false;
    }

    for (const path of batch.docPaths) {
      const isRefInFlight =
        this.batchQueue
          .filter(batch => batch.state === BatchState.SENT)
          .find(batch => batch.docPaths.has(path)) !== undefined;
      if (isRefInFlight) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sets the maximum number of allowed operations in a batch.
   *
   * @private
   */
  // Visible for testing.
  _setMaxBatchSize(size: number): void {
    this.maxBatchSize = size;
  }
}
