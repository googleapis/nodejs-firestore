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

import {FieldPath, Firestore, Timestamp} from '.';
import {DocumentReference} from './reference';
import {DocumentData, Precondition, SetOptions, UpdateData} from './types';
import {Deferred} from './util';
import {BatchWriteResult, WriteBatch, WriteResult} from './write-batch';

/**
 * The default maximum number of writes that can be in a single batch.
 */
const DEFAULT_BULK_WRITER_MAX_BATCH_SIZE = 500;

/**
 * Used to represent a batch on the BatchQueue.
 *
 * @private
 */
class BulkCommitBatch {
  // The maximum number of writes that can be in a single batch.
  private maxBatchSize = DEFAULT_BULK_WRITER_MAX_BATCH_SIZE;

  // The set of references present in the WriteBatch.
  readonly refsInBatch = new Set<DocumentReference>();

  // Whether the batch has been marked to be sent. Writes cannot be added to
  // pending batches.
  private pending = false;

  // A deferred promise that is resolved after the batch has been sent, and a
  // response is received.
  private completedDeferred = new Deferred<void>();

  // A map from each WriteBatch operation to its corresponding result.
  private resultsMap = new Map<number, Deferred<BatchWriteResult>>();

  constructor(readonly id: number, private readonly writeBatch: WriteBatch) {}

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
    precondition: Precondition
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
      this.pending === false &&
      this.writeBatch.opCount < this.maxBatchSize &&
      !this.refsInBatch.has(documentRef)
    );
  }

  /**
   * Commits the batch and returns a promise that resolves with the result of
   * all writes in this batch.
   */
  bulkCommit(): Promise<BatchWriteResult[]> {
    this.pending = true;
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
    return this.completedDeferred.promise;
  }

  // Visible for testing.
  setMaxBatchSize(size: number): void {
    this.maxBatchSize = size;
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

  constructor(
    private readonly firestore: Firestore,
    private readonly maxBatchSize = DEFAULT_BULK_WRITER_MAX_BATCH_SIZE
  ) {}

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
  async create(
    documentRef: DocumentReference,
    data: DocumentData
  ): Promise<WriteResult> {
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
    precondition: Precondition
  ): Promise<WriteResult> {
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
    const bulkCommitBatch = this.getEligibleBatch(documentRef);
    return bulkCommitBatch.update(
      documentRef,
      dataOrField,
      preconditionOrValues
    );
  }

  /**
   * Returns a Promise that resolves when there are no more pending writes. It
   * never fails. Calling this method will send all requests.
   *
   * The promise resolves immediately if there are no pending writes. Otherwise,
   * the Promise waits for all previously issued writes, but it does not wait
   * for writes that were added after the method is called. If you want to wait
   * for additional writes, call `waitForPendingWrites()` again.
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
   * await waitForPendingWrites().then(() => {
   *   console.log('Successfully executed all writes');
   * });
   */
  async waitForPendingWrites(): Promise<void> {
    const trackedBatches = this.batchQueue;
    const writePromises = trackedBatches.map(batch => batch.awaitBatch());
    this.sendBatches();
    await Promise.all(writePromises);
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
    const newBatch = new BulkCommitBatch(this.getId(), this.firestore.batch());

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
    let counter = 0;
    for (const batch of this.batchQueue) {
      // Only send up until the first batch that cannot be sent.
      if (!this.isBatchSendable(batch)) {
        break;
      }

      this.refsInFlight = new Set([...this.refsInFlight, ...batch.refsInBatch]);

      batch.bulkCommit().then(async results => {
        batch.resolveResults(results);

        // Remove references that are no longer in flight.
        this.refsInFlight = new Set(
          [...this.refsInFlight].filter(ref => !batch.refsInBatch.has(ref))
        );

        this.sendBatches();
      });
      counter++;
    }

    // Remove batches that were successfully sent.
    this.batchQueue = this.batchQueue.slice(counter);
  }

  /**
   * Checks that the provided batch does not write to references that are
   * currently in flight.
   */
  private isBatchSendable(batch: BulkCommitBatch): boolean {
    for (const ref of batch.refsInBatch) {
      if (this.refsInFlight.has(ref)) {
        return false;
      }
    }
    return true;
  }
}
