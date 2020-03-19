// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

import assert = require('assert');
import {FieldPath, Firestore, Timestamp} from '.';
import {logger} from './logger';
import {DocumentReference} from './reference';
import {DocumentData, Precondition, SetOptions, UpdateData} from './types';
import {Deferred, requestTag} from './util';
import {BatchWriteResult, WriteBatch, WriteResult} from './write-batch';

/**
 * The maximum number of writes that be in a single batch.
 */
const BULK_WRITER_MAX_BATCH_SIZE = 500;

/**
 * Used to represent a batch on the BatchQueue.
 *
 * @private
 */
interface BulkCommitBatch {
  // The underlying WriteBatch used for making writes.
  writeBatch: WriteBatch;

  // The set of references present in the WriteBatch.
  refsInBatch: Set<DocumentReference>;

  // A unique identifier for the batch.
  tag: string;

  // Whether the batch has been marked to be sent. Writes cannot be added to
  // pending batches.
  pending: boolean;

  // A deferred promise that will return the result of writing the batch.
  result: Deferred<BatchWriteResult[]>;
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
   * A mapping of each batch's unique tag to a promise that will resolve with
   * the result of writing the batch.
   */
  private resultsMap = new Map<string, Deferred<BatchWriteResult[]>>();

  /**
   * A set of all document references that are currently in flight.
   */
  private refsInFlight = new Set<DocumentReference>();
  constructor(
    private readonly firestore: Firestore,
    private readonly maxBatchSize = BULK_WRITER_MAX_BATCH_SIZE
  ) {}

  /**
   * Create a document with the provided object values. This will fail the batch
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
    bulkCommitBatch.refsInBatch.add(documentRef);
    bulkCommitBatch.writeBatch.create(documentRef, data);

    return this.getResult(
      bulkCommitBatch.tag,
      bulkCommitBatch.writeBatch.opCount
    );
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
   *    console.log('Successfully executed write at: ', result);
   *  })
   *  .catch(err => {
   *    console.log('Write failed with: ', err);
   *  });
   * });
   */
  delete(
    documentRef: DocumentReference,
    precondition: Precondition
  ): Promise<WriteResult> {
    const bulkCommitBatch = this.getEligibleBatch(documentRef);
    bulkCommitBatch.refsInBatch.add(documentRef);
    bulkCommitBatch.writeBatch.delete(documentRef, precondition);

    return this.getResult(
      bulkCommitBatch.tag,
      bulkCommitBatch.writeBatch.opCount
    );
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
    bulkCommitBatch.refsInBatch.add(documentRef);
    bulkCommitBatch.writeBatch.set(documentRef, data, options);

    return this.getResult(
      bulkCommitBatch.tag,
      bulkCommitBatch.writeBatch.opCount
    );
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
    bulkCommitBatch.refsInBatch.add(documentRef);
    bulkCommitBatch.writeBatch.update(
      documentRef,
      dataOrField,
      preconditionOrValues
    );

    return this.getResult(
      bulkCommitBatch.tag,
      bulkCommitBatch.writeBatch.opCount
    );
  }

  /**
   * Returns a Promise that resolves when there are no more pending writes. It
   * never fails.
   *
   * The promise resolves immediately if there no pending writes. Otherwise, the
   * Promise waits for all previously issued writes, but it does not wait for
   * writes that were added after the method is called. If you want to wait for
   * additional writes, call `waitForPendingWrites()` again.
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
    this.sendBatches();
    const writePromises = trackedBatches.map(batch => {
      batch.pending = true;
      return this.resultsMap.get(batch.tag)!.promise;
    });
    await Promise.all(writePromises);
  }

  /**
   * Return the first eligible batch that can hold a write to the provided
   * reference, or creates one if no eligible batches are found.
   */
  private getEligibleBatch(ref: DocumentReference): BulkCommitBatch {
    let batch = null;
    let logWarning = true;
    for (const bulkBatch of this.batchQueue) {
      if (bulkBatch.refsInBatch.has(ref)) {
        logWarning = false;
      }

      if (
        bulkBatch.pending === false &&
        bulkBatch.writeBatch.opCount < BULK_WRITER_MAX_BATCH_SIZE &&
        !bulkBatch.refsInBatch.has(ref)
      ) {
        batch = bulkBatch;
      }
    }

    if (batch === null) {
      if (logWarning) {
        logger(
          'BulkWriter',
          null,
          'Writing to the same document multiple times will slow down BulkWriter. ' +
            'Write to unique documents in order to maximize throughput.'
        );
      }
      return this.createNewBatch();
    } else {
      return batch;
    }
  }

  /**
   * Create a new batch on the BatchQueue and a mapping from the batch to its
   * result.
   */
  private createNewBatch(): BulkCommitBatch {
    const tag = requestTag();
    const deferred = new Deferred<BatchWriteResult[]>();
    const newBatch = {
      writeBatch: this.firestore.batch(),
      refsInBatch: new Set(),
      tag,
      pending: false,
      result: deferred,
    } as BulkCommitBatch;

    this.batchQueue.push(newBatch);
    this.resultsMap.set(tag, deferred);
    return newBatch;
  }

  /**
   * Return the result of the write at the given batch tag and operation count.
   */
  private getResult(tag: string, opCount: number): Promise<WriteResult> {
    assert(this.resultsMap.has(tag), 'requestTag not found');
    return this.resultsMap.get(tag)!.promise.then(results => {
      assert(
        results.length >= opCount,
        'opCount invalid' + results.length + opCount
      );
      const result = results[opCount - 1];
      if (result.writeTime) {
        return new WriteResult(result.writeTime);
      } else {
        throw result.status;
      }
    });
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
      batch.pending = true;

      batch.writeBatch.bulkCommit().then(async results => {
        this.broadcastResults(results, batch.tag);

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

  /**
   * Broadcasts the result of a BatchWrite to the appropriate promise.
   */
  private broadcastResults(results: BatchWriteResult[], tag: string): void {
    this.resultsMap.get(tag)!.resolve(results);
    this.resultsMap.delete(tag);
  }
}
