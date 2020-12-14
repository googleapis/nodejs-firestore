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

import {google} from '../protos/firestore_v1_proto_api';
import {FieldPath, Firestore} from '.';
import {delayExecution, MAX_RETRY_ATTEMPTS} from './backoff';
import {RateLimiter} from './rate-limiter';
import {DocumentReference} from './reference';
import {Timestamp} from './timestamp';
import {
  Deferred,
  getRetryCodes,
  isObject,
  silencePromise,
  wrapError,
} from './util';
import {WriteBatch, WriteResult} from './write-batch';
import {
  invalidArgumentMessage,
  validateInteger,
  validateOptional,
} from './validate';
import {logger} from './logger';
import {GoogleError, Status} from 'google-gax';

// eslint-disable-next-line no-undef
import GrpcStatus = FirebaseFirestore.GrpcStatus;
import api = google.firestore.v1;

type BulkWriterOperation = (bulkCommitBatch: BulkCommitBatch) => void;

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

/**
 * Used to represent a batch on the BatchQueue.
 *
 * @private
 */
class BulkCommitBatch extends WriteBatch {
  /**
   * The state of the batch.
   */
  private state = BatchState.OPEN;

  // The set of document reference paths present in the WriteBatch.
  readonly docPaths = new Set<string>();

  // An array of pending write operations. Only contains writes that have not
  // been resolved.
  private pendingOps: Array<Deferred<WriteResult>> = [];
  
  private retryBatch?: BulkCommitBatch;
  
  constructor(firestore: Firestore, readonly maxBatchSize: number) {
    super(firestore);
  }

  has(documentRef: firestore.DocumentReference): boolean {
    return this.docPaths.has(documentRef.path);
  }

  markReadyToSend(): void {
    if (this.state === BatchState.OPEN) {
      this.state = BatchState.READY_TO_SEND;
    }
  }

  markSent(): void {
    if (this.state === BatchState.READY_TO_SEND) {
      this.state = BatchState.SENT;
    }
  }

  isOpen(): boolean {
    return this.state === BatchState.OPEN;
  }

  isReadyToSend(): boolean {
    return this.state === BatchState.READY_TO_SEND;
  }

  async bulkCommit(): Promise<void> {
    assert(
      this.state === BatchState.READY_TO_SEND,
      'The batch should be marked as READY_TO_SEND before committing'
    );

    // Capture the error stack to preserve stack tracing across async calls.
    const stack = Error().stack!;

    let response: api.IBatchWriteResponse;
    try {
      const retryCodes = getRetryCodes('batchWrite');
      response = await this._commit<
        api.BatchWriteRequest,
        api.BatchWriteResponse
      >({retryCodes, methodName: 'batchWrite'});
    } catch (err) {
      // Map the failure to each individual write's result.
      response = {
        status: Array.from({length: this.pendingOps.length}).map(() => err),
      };
    }
    
    for (let i = 0; i < (response.writeResults || []).length; ++i) {
      const op = this.pendingOps.shift()!;
      
      // Since delete operations currently do not have write times, use a
      // sentinel Timestamp value.
      // TODO(b/158502664): Use actual delete timestamp.
      const DELETE_TIMESTAMP_SENTINEL = Timestamp.fromMillis(0);

      const status = (response.status || [])[i];
      if (status.code === Status.OK) {
        const updateTime =Timestamp.fromProto(
                response.writeResults![i].updateTime || DELETE_TIMESTAMP_SENTINEL
                );
        op.resolve(new WriteResult(updateTime));
      } else {
        const error = new GoogleError(status.message || undefined);
        error.code = status.code as Status;
        op.reject(wrapError(error, stack));
      }
    }
  }

  /**
   * Helper to update data structures associated with the operation and returns
   * the result.
   */
  processLastOperation(
    documentRef: firestore.DocumentReference,
    onError: (error: GoogleError) => boolean,
    onSuccess: (result:WriteResult) => void
  ): void {
    assert(
      !this.docPaths.has(documentRef.path),
      'Batch should not contain writes to the same document'
    );
    this.docPaths.add(documentRef.path);
    assert(
      this.state === BatchState.OPEN,
      'Batch should be OPEN when adding writes'
    );
    const deferred = new Deferred<WriteResult>();
    this.pendingOps.push(deferred);

    if (this._remainingOpCount === this.maxBatchSize) {
      this.state = BatchState.READY_TO_SEND;
    }

    deferred.promise.then(result => onSuccess(result),  error => onError(error));
  }
}

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
  private _batchQueue: BulkCommitBatch[] = [];

  /**
   * A list of promises that represent pending BulkWriter operations. Each
   * promise is resolved when the BulkWriter operation resolves. This set
   * includes retries. Each retry's promise is added, attempted, and removed
   * from this set before scheduling the next retry.
   */
  private _pendingOps: Set<Promise<WriteResult>> = new Set();

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
   * @private
   */
  private _successFn: (
    document: firestore.DocumentReference,
    result: WriteResult
  ) => void = () => {};

  /**
   * The user-provided callback to be run every time a BulkWriter operation
   * fails.
   * @private
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

  private async _flush(pendingOps: Array<Promise<WriteResult>>): Promise<void> {
    const batchQueue = this._batchQueue;
    batchQueue.forEach(batch => batch.markReadyToSend());

    // Send all scheduled operations on the BatchQueue first.
    const pendingBatches = this.sendReadyBatches();
    await Promise.all(pendingBatches);

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
   * @private
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
    documentRef: firestore.DocumentReference
  ): BulkCommitBatch {
    if (this._batchQueue.length > 0) {
      const lastBatch = this._batchQueue[this._batchQueue.length - 1];
      if (lastBatch.isOpen() && !lastBatch.has(documentRef)) {
        return lastBatch;
      }
    }
    return this.createNewBatch();
  }

  /**
   * Creates a new batch and adds it to the appropriate batch queue. If there
   * is already a batch enqueued, sends the batch after a new one is created.
   *
   * @private
   */
  private createNewBatch(): BulkCommitBatch {
    const newBatch = new BulkCommitBatch(this.firestore, this._maxBatchSize);

    if (this._batchQueue.length > 0) {
      this._batchQueue[this._batchQueue.length - 1].markReadyToSend();
      this.sendReadyBatches();
    }

    this._batchQueue.push(newBatch);
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
  private sendReadyBatches(): Array<Promise<void>> {
    const pendingCommits: Array<Promise<void>> = [];
    let batch: BulkCommitBatch | undefined;

    while ((batch = this._batchQueue.shift())) {
      if (!batch.isReadyToSend()) {
        break;
      }

      // Deferred promise that resolves when the current batch or its
      // scheduling attempt completes.
      const batchCompletedDeferred = new Deferred<void>();
      pendingCommits.push(batchCompletedDeferred.promise);
      this.sendBatch(batch).then(() => batchCompletedDeferred.resolve());
    }

    return pendingCommits;
  }

  /**
   * Sends the provided batch and processes the results. After the batch is
   * committed, sends the next group of ready batches.
   *
   * @private
   */
  private async sendBatch(batch: BulkCommitBatch): Promise<void> {
    // Send the batch if it is under the rate limit, or schedule another
    // attempt after the appropriate timeout.
    const delayMs = this._rateLimiter.getNextRequestDelayMs(batch._remainingOpCount);

    if (delayMs > 0) {
      const delayedExecution = new Deferred<void>();
      delayExecution(() => {
        delayedExecution.resolve();
      }, delayMs);
      await delayedExecution;
    }

    const success = this._rateLimiter.tryMakeRequest(batch._remainingOpCount);
    assert(success, 'Batch should be under rate limit to be sent.');

    await batch.bulkCommit();
    if (batch._remainingOpCount) {
      await this.sendBatch(batch);
    }
    batch.markSent();

    this.sendReadyBatches();
  }

  /**
   * Schedules and runs the provided operation.
   * @private
   */
  private _executeWrite(
    documentRef: firestore.DocumentReference,
    operationType: 'create' | 'set' | 'update' | 'delete',
    operationFn: BulkWriterOperation
  ): Promise<WriteResult> {
    // A deferred promise that resolves when operationFn completes.
    const operationCompletedDeferred = new Deferred<WriteResult>();
    this._pendingOps.add(operationCompletedDeferred.promise);
    
    let failedAttempts = 0;
    
    const bulkCommitBatch = this.getEligibleBatch(documentRef);
    operationFn(bulkCommitBatch);

    const onError = (error:GoogleError) => {
      ++failedAttempts;
      const bulkWriterError = new BulkWriterError(
          (error.code as number) as GrpcStatus,
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
      if (shouldRetry) {
        operationFn(bulkCommitBatch);
        bulkCommitBatch.processLastOperation(
            documentRef,
            onError,
            onSuccess);
      } else {
        operationCompletedDeferred.reject(bulkWriterError);
        this._pendingOps.delete(operationCompletedDeferred.promise);
      }
      return shouldRetry;
    };
    
    const onSuccess = (writeResult:WriteResult) => {
      this._successFn(documentRef, writeResult);
      operationCompletedDeferred.resolve(writeResult);
      this._pendingOps.delete(operationCompletedDeferred.promise);
    }
    
    bulkCommitBatch.processLastOperation(
        documentRef,
        onError,
        onSuccess);
    
    return operationCompletedDeferred.promise;
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
