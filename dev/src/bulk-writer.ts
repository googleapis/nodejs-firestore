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
import * as firestore from '@google-cloud/firestore';
import {Status} from 'google-gax';

import * as assert from 'assert';

import {FieldPath, Firestore} from '.';
import {
  delayExecution,
  ExponentialBackoff,
  MAX_RETRY_ATTEMPTS,
} from './backoff';
import {RateLimiter} from './rate-limiter';
import {DocumentReference} from './reference';
import {Timestamp} from './timestamp';
import {Deferred, getRetryCodes, isObject, wrapError} from './util';
import {BatchWriteResult, WriteBatch, WriteResult} from './write-batch';
import {logger} from './logger';
import {
  invalidArgumentMessage,
  validateInteger,
  validateOptional,
} from './validate';

/*!
 * The maximum number of writes that can be in a single batch.
 */
const MAX_BATCH_SIZE = 20;

/*!
 * The starting maximum number of operations per second as allowed by the
 * 500/50/5 rule.
 *
 * https://cloud.google.com/datastore/docs/best-practices#ramping_up_traffic.
 */
const STARTING_MAXIMUM_OPS_PER_SECOND = 500;

/*!
 * The rate by which to increase the capacity as specified by the 500/50/5 rule.
 *
 * https://cloud.google.com/datastore/docs/best-practices#ramping_up_traffic.
 */
const RATE_LIMITER_MULTIPLIER = 1.5;

/*!
 * How often the operations per second capacity should increase in milliseconds
 * as specified by the 500/50/5 rule.
 *
 * https://cloud.google.com/datastore/docs/best-practices#ramping_up_traffic.
 */
const RATE_LIMITER_MULTIPLIER_MILLIS = 5 * 60 * 1000;

/*!
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

/*!
 * Used to represent a pending write operation.
 *
 * Contains a pending write's WriteBatch index, document path, and the
 * corresponding result.
 */
interface PendingOp {
  writeBatchIndex: number;
  key: string;
  deferred: Deferred<BatchWriteResult>;
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

  // A deferred promise that is resolved after the batch has been sent, and a
  // response is received.
  private completedDeferred = new Deferred<void>();

  // An array of pending write operations. Only contains writes that have not
  // been resolved.
  private pendingOps: Array<PendingOp> = [];

  private readonly backoff: ExponentialBackoff;

  constructor(
    private readonly firestore: Firestore,
    private writeBatch: WriteBatch,
    private readonly maxBatchSize: number
  ) {
    this.backoff = new ExponentialBackoff();
  }

  /**
   * The number of writes in this batch.
   */
  get opCount(): number {
    return this.pendingOps.length;
  }

  /**
   * Adds a `create` operation to the WriteBatch. Returns a promise that
   * resolves with the result of the write.
   */
  create<T>(
    documentRef: firestore.DocumentReference<T>,
    data: T
  ): Promise<WriteResult> {
    this.writeBatch.create(documentRef, data);
    return this.processOperation(documentRef);
  }

  /**
   * Adds a `delete` operation to the WriteBatch. Returns a promise that
   * resolves with the sentinel value (Timestamp(0)) for the delete operation.
   */
  delete<T>(
    documentRef: firestore.DocumentReference<T>,
    precondition?: firestore.Precondition
  ): Promise<WriteResult> {
    this.writeBatch.delete(documentRef, precondition);
    return this.processOperation(documentRef);
  }

  set<T>(
    documentRef: firestore.DocumentReference<T>,
    data: Partial<T>,
    options: firestore.SetOptions
  ): Promise<WriteResult>;
  set<T>(
    documentRef: firestore.DocumentReference<T>,
    data: T
  ): Promise<WriteResult>;
  set<T>(
    documentRef: firestore.DocumentReference<T>,
    data: T | Partial<T>,
    options?: firestore.SetOptions
  ): Promise<WriteResult>;
  /**
   * Adds a `set` operation to the WriteBatch. Returns a promise that
   * resolves with the result of the write.
   */
  set<T>(
    documentRef: firestore.DocumentReference<T>,
    data: T | Partial<T>,
    options?: firestore.SetOptions
  ): Promise<WriteResult> {
    this.writeBatch.set(documentRef, data, options);
    return this.processOperation(documentRef);
  }

  /**
   * Adds an `update` operation to the WriteBatch. Returns a promise that
   * resolves with the result of the write.
   */
  update<T>(
    documentRef: firestore.DocumentReference<T>,
    dataOrField: firestore.UpdateData | string | firestore.FieldPath,
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
  private processOperation<T>(
    documentRef: firestore.DocumentReference<T>
  ): Promise<WriteResult> {
    assert(
      this.state === BatchState.OPEN,
      'Batch should be OPEN when adding writes'
    );
    const deferred = new Deferred<BatchWriteResult>();
    this.pendingOps.push({
      writeBatchIndex: this.opCount,
      key: documentRef.path,
      deferred: deferred,
    });

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
   * Commits the batch and returns a promise that resolves when all the writes
   * in the batch have finished.
   *
   * If any writes in the batch fail with a retryable error, this method will
   * retry the failed writes.
   */
  async bulkCommit(): Promise<void> {
    assert(
      this.state === BatchState.READY_TO_SEND,
      'The batch should be marked as READY_TO_SEND before committing'
    );
    this.state = BatchState.SENT;

    // Capture the error stack to preserve stack tracing across async calls.
    const stack = Error().stack!;

    let results: BatchWriteResult[] = [];
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      await this.backoff.backoffAndWait();

      try {
        results = await this.writeBatch.bulkCommit();
      } catch (err) {
        // Map the failure to each individual write's result.
        results = this.pendingOps.map(op => {
          return {key: op.key, writeTime: null, status: wrapError(err, stack)};
        });
      }
      this.processResults(results, /* allowRetry= */ true);

      if (this.pendingOps.length > 0) {
        logger(
          'BulkWriter.bulkCommit',
          null,
          `Current batch failed at retry #${attempt}. Num failures: ` +
            `${this.pendingOps.length}.`
        );

        this.writeBatch = new WriteBatch(
          this.firestore,
          this.writeBatch,
          new Set(this.pendingOps.map(op => op.writeBatchIndex))
        );
      } else {
        this.completedDeferred.resolve();
        return;
      }
    }

    this.processResults(results);
    this.completedDeferred.resolve();
  }

  /**
   * Resolves the individual operations in the batch with the results.
   */
  private processResults(
    results: BatchWriteResult[],
    allowRetry = false
  ): void {
    const newPendingOps: Array<PendingOp> = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const op = this.pendingOps[i];
      if (result.status.code === Status.OK) {
        op.deferred.resolve(result);
      } else if (!allowRetry || !this.shouldRetry(result.status.code)) {
        op.deferred.reject(result.status);
      } else {
        // Retry the operation if it has not been processed.
        // Store the current index of pendingOps to preserve the mapping of
        // this operation's index in the underlying WriteBatch.
        newPendingOps.push({
          writeBatchIndex: i,
          key: op.key,
          deferred: op.deferred,
        });
      }
    }

    this.pendingOps = newPendingOps;
  }

  private shouldRetry(code: Status | undefined): boolean {
    const retryCodes = getRetryCodes('batchWrite');
    return code !== undefined && retryCodes.includes(code);
  }

  /**
   * Returns a promise that resolves when the batch has been sent, and a
   * response is received.
   */
  awaitBulkCommit(): Promise<void> {
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
 * A Firestore BulkWriter than can be used to perform a large number of writes
 * in parallel. Writes to the same document will be executed sequentially.
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
   * Rate limiter used to throttle requests as per the 500/50/5 rule.
   */
  private rateLimiter: RateLimiter;

  constructor(
    private readonly firestore: Firestore,
    private readonly options?: firestore.BulkWriterOptions
  ) {
    this.firestore._incrementBulkWritersCount();
    validateBulkWriterOptions('options', options);

    if (options?.throttling === false) {
      this.rateLimiter = new RateLimiter(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY
      );
    } else {
      const startingRate =
        typeof options?.throttling !== 'boolean' &&
        options?.throttling?.initialOpsPerSecond !== undefined
          ? options.throttling.initialOpsPerSecond
          : STARTING_MAXIMUM_OPS_PER_SECOND;
      const maxRate =
        typeof options?.throttling !== 'boolean' &&
        options?.throttling?.maxOpsPerSecond !== undefined
          ? options.throttling.maxOpsPerSecond
          : Number.POSITIVE_INFINITY;

      this.rateLimiter = new RateLimiter(
        startingRate,
        RATE_LIMITER_MULTIPLIER,
        RATE_LIMITER_MULTIPLIER_MILLIS,
        maxRate
      );
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
  create<T>(
    documentRef: firestore.DocumentReference<T>,
    data: T
  ): Promise<WriteResult> {
    this.verifyNotClosed();
    const bulkCommitBatch = this.getEligibleBatch();
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
   * @returns {Promise<WriteResult>} A promise that resolves with a sentinel
   * Timestamp indicating that the delete was successful. Throws an error if
   * the write fails.
   *
   * @example
   * let bulkWriter = firestore.bulkWriter();
   * let documentRef = firestore.doc('col/doc');
   *
   * bulkWriter
   *  .delete(documentRef)
   *  .then(result => {
   *    console.log('Successfully deleted document');
   *  })
   *  .catch(err => {
   *    console.log('Delete failed with: ', err);
   *  });
   * });
   */
  delete<T>(
    documentRef: firestore.DocumentReference<T>,
    precondition?: firestore.Precondition
  ): Promise<WriteResult> {
    this.verifyNotClosed();
    const bulkCommitBatch = this.getEligibleBatch();
    const resultPromise = bulkCommitBatch.delete(documentRef, precondition);
    this.sendReadyBatches();
    return resultPromise;
  }

  set<T>(
    documentRef: firestore.DocumentReference<T>,
    data: Partial<T>,
    options: firestore.SetOptions
  ): Promise<WriteResult>;
  set<T>(
    documentRef: firestore.DocumentReference<T>,
    data: T
  ): Promise<WriteResult>;
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
  set<T>(
    documentRef: firestore.DocumentReference<T>,
    data: T | Partial<T>,
    options?: firestore.SetOptions
  ): Promise<WriteResult> {
    this.verifyNotClosed();
    const bulkCommitBatch = this.getEligibleBatch();
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
  update<T>(
    documentRef: firestore.DocumentReference,
    dataOrField: firestore.UpdateData | string | FieldPath,
    ...preconditionOrValues: Array<
      {lastUpdateTime?: Timestamp} | unknown | string | FieldPath
    >
  ): Promise<WriteResult> {
    this.verifyNotClosed();
    const bulkCommitBatch = this.getEligibleBatch();
    const resultPromise = bulkCommitBatch.update(
      documentRef,
      dataOrField,
      ...preconditionOrValues
    );
    this.sendReadyBatches();
    return resultPromise;
  }

  /**
   * Commits all writes that have been enqueued up to this point in parallel.
   *
   * Returns a Promise that resolves when all currently queued operations have
   * been committed. The Promise will never be rejected since the results for
   * each individual operation are conveyed via their individual Promises.
   *
   * The Promise resolves immediately if there are no pending writes. Otherwise,
   * the Promise waits for all previously issued writes, but it does not wait
   * for writes that were added after the method is called. If you want to wait
   * for additional writes, call `flush()` again.
   *
   * @return {Promise<void>} A promise that resolves when all enqueued writes
   * up to this point have been committed.
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
    const writePromises = trackedBatches.map(batch => batch.awaitBulkCommit());
    this.sendReadyBatches();
    await Promise.all(writePromises);
  }

  /**
   * Commits all enqueued writes and marks the BulkWriter instance as closed.
   *
   * After calling `close()`, calling any method wil throw an error.
   *
   * Returns a Promise that resolves when there are no more pending writes. The
   * Promise will never be rejected. Calling this method will send all requests.
   * The promise resolves immediately if there are no pending writes.
   *
   * @return {Promise<void>} A promise that resolves when all enqueued writes
   * up to this point have been committed.
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
    this.verifyNotClosed();
    this.firestore._decrementBulkWritersCount();
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
   *
   * @private
   */
  private getEligibleBatch<T>(): BulkCommitBatch {
    if (this.batchQueue.length > 0) {
      const lastBatch = this.batchQueue[this.batchQueue.length - 1];
      if (lastBatch.state === BatchState.OPEN) {
        return lastBatch;
      }
    }
    return this.createNewBatch();
  }

  /**
   * Creates a new batch and adds it to the BatchQueue. If there is already a
   * batch enqueued, sends the batch after a new one is created.
   *
   * @private
   */
  private createNewBatch(): BulkCommitBatch {
    const newBatch = new BulkCommitBatch(
      this.firestore,
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
   *
   * @private
   */
  private sendReadyBatches(): void {
    const unsentBatches = this.batchQueue.filter(
      batch => batch.state === BatchState.READY_TO_SEND
    );

    let index = 0;
    while (
      index < unsentBatches.length &&
      unsentBatches[index].state === BatchState.READY_TO_SEND
    ) {
      const batch = unsentBatches[index];

      // Send the batch if it is under the rate limit, or schedule another
      // attempt after the appropriate timeout.
      const delayMs = this.rateLimiter.getNextRequestDelayMs(batch.opCount);
      assert(delayMs !== -1, 'Batch size should be under capacity');
      if (delayMs === 0) {
        this.sendBatch(batch);
      } else {
        delayExecution(() => this.sendReadyBatches(), delayMs);
        break;
      }

      index++;
    }
  }

  /**
   * Sends the provided batch and processes the results. After the batch is
   * committed, sends the next group of ready batches.
   *
   * @private
   */
  private sendBatch(batch: BulkCommitBatch): void {
    const success = this.rateLimiter.tryMakeRequest(batch.opCount);
    assert(success, 'Batch should be under rate limit to be sent.');
    batch.bulkCommit().then(() => {
      // Remove the batch from the BatchQueue after it has been processed.
      const batchIndex = this.batchQueue.indexOf(batch);
      assert(batchIndex !== -1, 'The batch should be in the BatchQueue');
      this.batchQueue.splice(batchIndex, 1);

      this.sendReadyBatches();
    });
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

/**
 * Validates the use of 'value' as BulkWriterOptions.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The object to validate.
 * @throws if the input is not a valid BulkWriterOptions object.
 */
function validateBulkWriterOptions(arg: string | number, value: unknown): void {
  if (validateOptional(value, {optional: true})) {
    return;
  }

  if (!isObject(value)) {
    throw new Error(
      `${invalidArgumentMessage(
        arg,
        'bulkWriter() options argument'
      )} Input is not an object.`
    );
  }

  const options = value as firestore.BulkWriterOptions;

  if (
    options.throttling === undefined ||
    typeof options.throttling === 'boolean'
  ) {
    return;
  }

  if ('initialOpsPerSecond' in options.throttling) {
    validateInteger(
      'initialOpsPerSecond',
      options.throttling.initialOpsPerSecond,
      {
        minValue: 0,
      }
    );
  }

  if ('maxOpsPerSecond' in options.throttling) {
    validateInteger('maxOpsPerSecond', options.throttling.maxOpsPerSecond, {
      minValue: 0,
    });

    if (
      'initialOpsPerSecond' in options.throttling &&
      options.throttling.initialOpsPerSecond! >
        options.throttling.maxOpsPerSecond!
    ) {
      throw new Error(
        `${invalidArgumentMessage(
          arg,
          'bulkWriter() options argument'
        )} "maxOpsPerSecond" cannot be less than "initialOpsPerSecond".`
      );
    }

    if (
      !('initialOpsPerSecond' in options.throttling) &&
      STARTING_MAXIMUM_OPS_PER_SECOND > options.throttling.maxOpsPerSecond!
    ) {
      throw new Error(
        `${invalidArgumentMessage(
          arg,
          'bulkWriter() options argument'
        )} "maxOpsPerSecond" must be greater than the default value of ${STARTING_MAXIMUM_OPS_PER_SECOND}.`
      );
    }
  }
}
