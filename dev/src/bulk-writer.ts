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

import * as assert from 'assert';

import {FieldPath, Firestore, WriteBatch} from '.';
import {delayExecution, MAX_RETRY_ATTEMPTS} from './backoff';
import {RateLimiter} from './rate-limiter';
import {DocumentReference} from './reference';
import {Timestamp} from './timestamp';
import {Deferred, getRetryCodes, isObject, silencePromise} from './util';
import {WriteResult} from './write-batch';
import {
  invalidArgumentMessage,
  validateInteger,
  validateOptional,
} from './validate';
import {logger} from './logger';

// eslint-disable-next-line no-undef
import GrpcStatus = FirebaseFirestore.GrpcStatus;

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
export const DEFAULT_STARTING_MAXIMUM_OPS_PER_SECOND = 500;

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

/**
 * The error thrown when a BulkWriter operation fails.
 *
 * @class BulkWriterError
 */
export class BulkWriterError extends Error {
  /** @hideconstructor */
  constructor(
    /** The status code of the error. */
    readonly code: GrpcStatus,

    /** The error message of the error. */
    readonly message: string,

    /** The document reference the operation was performed on. */
    readonly documentRef: firestore.DocumentReference,

    /** The type of operation performed. */
    readonly operationType: 'create' | 'set' | 'update' | 'delete',

    /** How many times this operation has been attempted unsuccessfully. */
    readonly failedAttempts: number
  ) {
    super(message);
  }
}

/**
 * A Firestore BulkWriter than can be used to perform a large number of writes
 * in parallel. Writes to the same document will be executed sequentially.
 *
 * @class BulkWriter
 */
export class BulkWriter {
  /**
   * The maximum number of writes that can be in a single batch.
   */
  private _maxBatchSize = MAX_BATCH_SIZE;

  /**
   * A queue of batches to be written.
   */
  private _batchQueue: WriteBatch[] = [];

  /**
   * A queue of batches containing operations that need to be retried.
   */
  private _retryBatchQueue: WriteBatch[] = [];

  /**
   * A list of promises that represent sent batches. Each promise is resolved
   * when the batch's response is received. This includes batches from both the
   * batchQueue and retryBatchQueue.
   */
  private _pendingBatches: Set<Promise<void>> = new Set();

  /**
   * A list of promises that represent pending BulkWriter operations. Each
   * promise is resolved when the BulkWriter operation resolves. This set
   * includes retries. Each retry's promise is added, attempted, and removed
   * from this set before scheduling the next retry.
   */
  private _pendingOps: Set<Promise<void>> = new Set();

  /**
   * Whether this BulkWriter instance has started to close. Afterwards, no
   * new operations can be enqueued, except for retry operations scheduled by
   * the error handler.
   */
  private _closing = false;

  /**
   * Rate limiter used to throttle requests as per the 500/50/5 rule.
   */
  private readonly _rateLimiter: RateLimiter;

  /**
   * The user-provided callback to be run every time a BulkWriter operation
   * successfully completes.
   */
  private _successFn: (
    document: firestore.DocumentReference,
    result: WriteResult
  ) => void = () => {};

  /**
   * The user-provided callback to be run every time a BulkWriter operation
   * fails.
   */
  private _errorFn: (error: BulkWriterError) => boolean = error => {
    const retryCodes = getRetryCodes('batchWrite');
    return (
      error.code !== undefined &&
      retryCodes.includes(error.code) &&
      error.failedAttempts < MAX_RETRY_ATTEMPTS
    );
  };

  /** @hideconstructor */
  constructor(
    private readonly firestore: Firestore,
    options?: firestore.BulkWriterOptions
  ) {
    this.firestore._incrementBulkWritersCount();
    validateBulkWriterOptions(options);

    if (options?.throttling === false) {
      this._rateLimiter = new RateLimiter(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY
      );
    } else {
      let startingRate = DEFAULT_STARTING_MAXIMUM_OPS_PER_SECOND;
      let maxRate = Number.POSITIVE_INFINITY;

      if (typeof options?.throttling !== 'boolean') {
        if (options?.throttling?.maxOpsPerSecond !== undefined) {
          maxRate = options.throttling.maxOpsPerSecond;
        }

        if (options?.throttling?.initialOpsPerSecond !== undefined) {
          startingRate = options.throttling.initialOpsPerSecond;
        }

        // The initial validation step ensures that the maxOpsPerSecond is
        // greater than initialOpsPerSecond. If this inequality is true, that
        // means initialOpsPerSecond was not set and maxOpsPerSecond is less
        // than the default starting rate.
        if (maxRate < startingRate) {
          startingRate = maxRate;
        }

        // Ensure that the batch size is not larger than the number of allowed
        // operations per second.
        if (startingRate < this._maxBatchSize) {
          this._maxBatchSize = startingRate;
        }
      }

      this._rateLimiter = new RateLimiter(
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
   * the write. If the write fails, the promise is rejected with a
   * [BulkWriterError]{@link BulkWriterError}.
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
    const op = this._executeWrite(documentRef, 'create', bulkCommitBatch =>
      bulkCommitBatch.create(documentRef, data)
    );
    silencePromise(op);
    return op;
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
   * the delete. If the delete fails, the promise is rejected with a
   * [BulkWriterError]{@link BulkWriterError}.
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
    const op = this._executeWrite(documentRef, 'delete', bulkCommitBatch =>
      bulkCommitBatch.delete(documentRef, precondition)
    );
    silencePromise(op);
    return op;
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
   * the write. If the write fails, the promise is rejected with a
   * [BulkWriterError]{@link BulkWriterError}.
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
    const op = this._executeWrite(documentRef, 'set', bulkCommitBatch =>
      bulkCommitBatch.set(documentRef, data, options)
    );
    silencePromise(op);
    return op;
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
   * the write. If the write fails, the promise is rejected with a
   * [BulkWriterError]{@link BulkWriterError}.
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
    const op = this._executeWrite(documentRef, 'update', bulkCommitBatch =>
      bulkCommitBatch.update(documentRef, dataOrField, ...preconditionOrValues)
    );
    silencePromise(op);
    return op;
  }

  /**
   * Attaches a listener that is run every time a BulkWriter operation
   * successfully completes.
   *
   * @param callback A callback to be called every time a BulkWriter operation
   * successfully completes.
   * @example
   * let bulkWriter = firestore.bulkWriter();
   *
   * bulkWriter
   *   .onWriteResult((documentRef, result) => {
   *     console.log(
   *       'Successfully executed write on document: ',
   *       documentRef,
   *       ' at: ',
   *       result
   *     );
   *   });
   */
  onWriteResult(
    callback: (
      documentRef: firestore.DocumentReference,
      result: WriteResult
    ) => void
  ): void {
    this._successFn = callback;
  }

  /**
   * Attaches an error handler listener that is run every time a BulkWriter
   * operation fails.
   *
   * BulkWriter has a default error handler that retries UNAVAILABLE and
   * ABORTED errors up to a maximum of 10 failed attempts. When an error
   * handler is specified, the default error handler will be overwritten.
   *
   * @param shouldRetryCallback A callback to be called every time a BulkWriter
   * operation fails. Returning `true` will retry the operation. Returning
   * `false` will stop the retry loop.
   * @example
   * let bulkWriter = firestore.bulkWriter();
   *
   * bulkWriter
   *   .onWriteError((error) => {
   *     if (
   *       error.code === GrpcStatus.UNAVAILABLE &&
   *       error.failedAttempts < MAX_RETRY_ATTEMPTS
   *     ) {
   *       return true;
   *     } else {
   *       console.log('Failed write at document: ', error.documentRef);
   *       return false;
   *     }
   *   });
   */
  onWriteError(shouldRetryCallback: (error: BulkWriterError) => boolean): void {
    this._errorFn = shouldRetryCallback;
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
  flush(): Promise<void> {
    this.verifyNotClosed();

    // Copy the pending ops at the time flush() was called.
    return this._flush(Array.from(this._pendingOps));
  }

  private async _flush(pendingOps: Array<Promise<void>>): Promise<void> {
    let batchQueue = this._batchQueue;
    batchQueue.forEach(batch => batch._markReadyToSend());

    // Send all scheduled operations on the BatchQueue first.
    this.sendReadyBatches(batchQueue);
    await Promise.all(this._pendingBatches);

    // Afterwards, send all accumulated retry operations. Wait until the
    // retryBatchQueue is cleared. This way, operations scheduled after
    // flush() will not be sent until the retries are completed.
    batchQueue = this._retryBatchQueue;
    if (batchQueue.length > 0) {
      batchQueue.forEach(batch => batch._markReadyToSend());
      this.sendReadyBatches(batchQueue);
    }
    // Make sure user promises resolve before flush() resolves.
    return silencePromise(Promise.all(pendingOps));
  }

  /**
   * Commits all enqueued writes and marks the BulkWriter instance as closed.
   *
   * After calling `close()`, calling any method wil throw an error. Any
   * retries scheduled as part of an `onWriteError()` handler will be run
   * before the `close()` promise resolves.
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
    this._closing = true;
    return flushPromise;
  }

  /**
   * Throws an error if the BulkWriter instance has been closed.
   */
  private verifyNotClosed(): void {
    if (this._closing) {
      throw new Error('BulkWriter has already been closed.');
    }
  }

  /**
   * Return the first eligible batch that can hold a write to the provided
   * reference, or creates one if no eligible batches are found.
   *
   * @private
   */
  private getEligibleBatch<T>(
    documentRef: firestore.DocumentReference,
    batchQueue: WriteBatch[]
  ): WriteBatch {
    if (batchQueue.length > 0) {
      const lastBatch = batchQueue[batchQueue.length - 1];
      if (lastBatch._isOpen() && !lastBatch._has(documentRef)) {
        return lastBatch;
      }
    }

    return this.createNewBatch(batchQueue);
  }

  /**
   * Creates a new batch and adds it to the appropriate batch queue. If there
   * is already a batch enqueued, sends the batch after a new one is created.
   *
   * @private
   */
  private createNewBatch(batchQueue: WriteBatch[]): WriteBatch {
    const newBatch = new WriteBatch(this.firestore, this._maxBatchSize);

    if (batchQueue.length > 0) {
      batchQueue[batchQueue.length - 1]._markReadyToSend();
      this.sendReadyBatches(batchQueue);
    }

    batchQueue.push(newBatch);
    return newBatch;
  }

  /**
   * Attempts to send batches starting from the front of the provided batch
   * queue until a batch cannot be sent.
   *
   * After a batch is complete, try sending batches again.
   *
   * @private
   */
  private sendReadyBatches(batchQueue: WriteBatch[]): void {
    let index = 0;
    while (index < batchQueue.length && batchQueue[index]._isReadyToSend()) {
      const batch = batchQueue[index];

      // Deferred promise that resolves when the current batch or its
      // scheduling attempt completes.
      const batchCompletedDeferred = new Deferred<void>();
      this._pendingBatches.add(batchCompletedDeferred.promise);

      // Send the batch if it is under the rate limit, or schedule another
      // attempt after the appropriate timeout.
      const delayMs = this._rateLimiter.getNextRequestDelayMs(batch._opCount);
      assert(delayMs !== -1, 'Batch size should be under capacity');
      if (delayMs === 0) {
        this.sendBatch(batch, batchQueue, batchCompletedDeferred);
      } else {
        delayExecution(() => {
          this.sendReadyBatches(batchQueue);
          batchCompletedDeferred.resolve();
          this._pendingBatches.delete(batchCompletedDeferred.promise);
        }, delayMs);
        break;
      }
      index++;
    }
  }

  /**
   * Sends the provided batch and processes the results. After the batch is
   * committed, sends the next group of ready batches.
   *
   * @param batchCompletedDeferred A deferred promise that resolves when the
   * batch has been sent and received.
   * @private
   */
  private sendBatch(
    batch: WriteBatch,
    batchQueue: WriteBatch[],
    batchCompletedDeferred: Deferred<void>
  ): Promise<void> {
    const success = this._rateLimiter.tryMakeRequest(batch._opCount);
    assert(success, 'Batch should be under rate limit to be sent.');
    return batch.bulkCommit().then(() => {
      // Remove the batch from the BatchQueue after it has been processed.
      const batchIndex = batchQueue.indexOf(batch);
      assert(batchIndex !== -1, 'The batch should be in the BatchQueue');
      batchQueue.splice(batchIndex, 1);

      if (batchQueue === this._retryBatchQueue) {
        batchQueue.forEach(batch => batch._markReadyToSend());
      }

      batchCompletedDeferred.resolve();
      this._pendingBatches.delete(batchCompletedDeferred.promise);

      this.sendReadyBatches(batchQueue);
    });
  }

  /**
   * Schedules and runs the provided operation.
   */
  private async _executeWrite(
    documentRef: firestore.DocumentReference,
    operationType: 'create' | 'set' | 'update' | 'delete',
    operationFn: (bulkCommitBatch: WriteBatch) => void
  ): Promise<WriteResult> {
    // A deferred promise that resolves when operationFn completes.
    const operationCompletedDeferred = new Deferred<void>();
    this._pendingOps.add(operationCompletedDeferred.promise);
    try {
      for (let failedAttempts = 0; ; ++failedAttempts) {
        const batchQueue =
          failedAttempts > 0 ? this._retryBatchQueue : this._batchQueue;
        const bulkCommitBatch = this.getEligibleBatch(documentRef, batchQueue);

        // Send ready batches if this is the first attempt. Subsequent retry
        // batches are scheduled after the initial batch returns.
        if (failedAttempts === 0) {
          this.sendReadyBatches(batchQueue);
        }

        try {
          operationFn(bulkCommitBatch);
          const operationResult = await bulkCommitBatch._processLastOperation(
            documentRef
          );
          this._successFn(documentRef, operationResult);
          return operationResult;
        } catch (error) {
          const bulkWriterError = new BulkWriterError(
            error.code,
            error.message,
            documentRef,
            operationType,
            failedAttempts
          );
          const shouldRetry = this._errorFn(bulkWriterError);
          logger(
            'BulkWriter.errorFn',
            null,
            'Running error callback on error code:',
            error.code,
            ', shouldRetry:',
            shouldRetry
          );
          if (!shouldRetry) {
            throw bulkWriterError;
          }
        }
      }
    } finally {
      operationCompletedDeferred.resolve();
      this._pendingOps.delete(operationCompletedDeferred.promise);
    }
  }

  /**
   * Sets the maximum number of allowed operations in a batch.
   *
   * @private
   */
  // Visible for testing.
  _setMaxBatchSize(size: number): void {
    this._maxBatchSize = size;
  }

  /**
   * Returns the rate limiter for testing.
   *
   * @private
   */
  // Visible for testing.
  _getRateLimiter(): RateLimiter {
    return this._rateLimiter;
  }
}

/**
 * Validates the use of 'value' as BulkWriterOptions.
 *
 * @private
 * @param value The BulkWriterOptions object to validate.
 * @throws if the input is not a valid BulkWriterOptions object.
 */
function validateBulkWriterOptions(value: unknown): void {
  if (validateOptional(value, {optional: true})) {
    return;
  }
  const argName = 'options';

  if (!isObject(value)) {
    throw new Error(
      `${invalidArgumentMessage(
        argName,
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

  if (options.throttling.initialOpsPerSecond !== undefined) {
    validateInteger(
      'initialOpsPerSecond',
      options.throttling.initialOpsPerSecond,
      {
        minValue: 1,
      }
    );
  }

  if (options.throttling.maxOpsPerSecond !== undefined) {
    validateInteger('maxOpsPerSecond', options.throttling.maxOpsPerSecond, {
      minValue: 1,
    });

    if (
      options.throttling.initialOpsPerSecond !== undefined &&
      options.throttling.initialOpsPerSecond >
        options.throttling.maxOpsPerSecond
    ) {
      throw new Error(
        `${invalidArgumentMessage(
          argName,
          'bulkWriter() options argument'
        )} "maxOpsPerSecond" cannot be less than "initialOpsPerSecond".`
      );
    }
  }
}
