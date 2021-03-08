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
  requestTag,
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

/*!
 * The maximum number of writes that can be in a single batch.
 */
const MAX_BATCH_SIZE = 20;

/*!
 * The starting maximum number of operations per second as allowed by the
 * 500/50/5 rule.
 *
 * https://firebase.google.com/docs/firestore/best-practices#ramping_up_traffic.
 */
export const DEFAULT_INITIAL_OPS_PER_SECOND_LIMIT = 500;

/*!
 * The maximum number of operations per second as allowed by the 500/50/5 rule.
 * By default the rate limiter will not exceed this value.
 *
 * https://firebase.google.com/docs/firestore/best-practices#ramping_up_traffic.
 */
export const DEFAULT_MAXIMUM_OPS_PER_SECOND_LIMIT = 10000;

/*!
 * The rate by which to increase the capacity as specified by the 500/50/5 rule.
 */
const RATE_LIMITER_MULTIPLIER = 1.5;

/*!
 * How often the operations per second capacity should increase in milliseconds
 * as specified by the 500/50/5 rule.
 */
const RATE_LIMITER_MULTIPLIER_MILLIS = 5 * 60 * 1000;

/**
 * Represents a single write for BulkWriter, encapsulating operation dispatch
 * and error handling.
 * @private
 */
class BulkWriterOperation {
  private deferred = new Deferred<WriteResult>();
  private failedAttempts = 0;

  /**
   * @param ref The document reference being written to.
   * @param type The type of operation that created this write.
   * @param sendFn A callback to invoke when the operation should be sent.
   * @param errorFn The user provided global error callback.
   * @param successFn The user provided global success callback.
   */
  constructor(
    readonly ref: firestore.DocumentReference<unknown>,
    private readonly type: 'create' | 'set' | 'update' | 'delete',
    private readonly sendFn: (op: BulkWriterOperation) => void,
    private readonly errorFn: (error: BulkWriterError) => boolean,
    private readonly successFn: (
      ref: firestore.DocumentReference<unknown>,
      result: WriteResult
    ) => void
  ) {}

  get promise(): Promise<WriteResult> {
    return this.deferred.promise;
  }

  onError(error: GoogleError): void {
    ++this.failedAttempts;

    try {
      const bulkWriterError = new BulkWriterError(
        (error.code as number) as GrpcStatus,
        error.message,
        this.ref,
        this.type,
        this.failedAttempts
      );
      const shouldRetry = this.errorFn(bulkWriterError);
      logger(
        'BulkWriter.errorFn',
        null,
        'Ran error callback on error code:',
        error.code,
        ', shouldRetry:',
        shouldRetry,
        ' for document:',
        this.ref.path
      );

      if (shouldRetry) {
        this.sendFn(this);
      } else {
        this.deferred.reject(bulkWriterError);
      }
    } catch (userCallbackError) {
      this.deferred.reject(userCallbackError);
    }
  }

  onSuccess(result: WriteResult): void {
    try {
      this.successFn(this.ref, result);
      this.deferred.resolve(result);
    } catch (userCallbackError) {
      this.deferred.reject(userCallbackError);
    }
  }
}

/**
 * Used to represent a batch on the BatchQueue.
 *
 * @private
 */
class BulkCommitBatch extends WriteBatch {
  // The set of document reference paths present in the WriteBatch.
  readonly docPaths = new Set<string>();

  // An array of pending write operations. Only contains writes that have not
  // been resolved.
  private pendingOps: Array<BulkWriterOperation> = [];

  has(documentRef: firestore.DocumentReference<unknown>): boolean {
    return this.docPaths.has(documentRef.path);
  }

  async bulkCommit(options: {requestTag?: string} = {}): Promise<void> {
    const tag = options?.requestTag ?? requestTag();

    // Capture the error stack to preserve stack tracing across async calls.
    const stack = Error().stack!;

    let response: api.IBatchWriteResponse;
    try {
      logger(
        'BulkCommitBatch.bulkCommit',
        tag,
        `Sending next batch with ${this._opCount} writes`
      );
      const retryCodes = getRetryCodes('batchWrite');
      response = await this._commit<
        api.BatchWriteRequest,
        api.BatchWriteResponse
      >({retryCodes, methodName: 'batchWrite', requestTag: tag});
    } catch (err) {
      // Map the failure to each individual write's result.
      const ops = Array.from({length: this.pendingOps.length});
      response = {
        writeResults: ops.map(() => {
          return {};
        }),
        status: ops.map(() => err),
      };
    }

    for (let i = 0; i < (response.writeResults || []).length; ++i) {
      // Since delete operations currently do not have write times, use a
      // sentinel Timestamp value.
      // TODO(b/158502664): Use actual delete timestamp.
      const DELETE_TIMESTAMP_SENTINEL = Timestamp.fromMillis(0);

      const status = (response.status || [])[i];
      if (status.code === Status.OK) {
        const updateTime = Timestamp.fromProto(
          response.writeResults![i].updateTime || DELETE_TIMESTAMP_SENTINEL
        );
        this.pendingOps[i].onSuccess(new WriteResult(updateTime));
      } else {
        const error = new GoogleError(status.message || undefined);
        error.code = status.code as Status;
        this.pendingOps[i].onError(wrapError(error, stack));
      }
    }
  }

  /**
   * Helper to update data structures associated with the operation and returns
   * the result.
   */
  processLastOperation(op: BulkWriterOperation): void {
    assert(
      !this.docPaths.has(op.ref.path),
      'Batch should not contain writes to the same document'
    );
    this.docPaths.add(op.ref.path);
    this.pendingOps.push(op);
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
    readonly documentRef: firestore.DocumentReference<unknown>,

    /** The type of operation performed. */
    readonly operationType: 'create' | 'set' | 'update' | 'delete',

    /** How many times this operation has been attempted unsuccessfully. */
    readonly failedAttempts: number
  ) {
    super(message);
  }
}

/**
 * A Firestore BulkWriter that can be used to perform a large number of writes
 * in parallel.
 *
 * @class BulkWriter
 */
export class BulkWriter {
  /**
   * The maximum number of writes that can be in a single batch.
   * Visible for testing.
   * @private
   */
  _maxBatchSize = MAX_BATCH_SIZE;

  /**
   * The batch that is currently used to schedule operations. Once this batch
   * reaches maximum capacity, a new batch is created.
   * @private
   */
  private _bulkCommitBatch = new BulkCommitBatch(this.firestore);

  /**
   * A pointer to the tail of all active BulkWriter applications. This pointer
   * is advanced every time a new write is enqueued.
   * @private
   */
  private _lastOp: Promise<void> = Promise.resolve();

  /**
   * Whether this BulkWriter instance has started to close. Afterwards, no
   * new operations can be enqueued, except for retry operations scheduled by
   * the error handler.
   * @private
   */
  private _closing = false;

  /**
   * Rate limiter used to throttle requests as per the 500/50/5 rule.
   * Visible for testing.
   * @private
   */
  readonly _rateLimiter: RateLimiter;

  /**
   * The user-provided callback to be run every time a BulkWriter operation
   * successfully completes.
   * @private
   */
  private _successFn: (
    document: firestore.DocumentReference<unknown>,
    result: WriteResult
  ) => void = () => {};

  /**
   * The user-provided callback to be run every time a BulkWriter operation
   * fails.
   * @private
   */
  private _errorFn: (error: BulkWriterError) => boolean = error => {
    const isRetryableDeleteError =
      error.operationType === 'delete' &&
      (error.code as number) === Status.INTERNAL;
    const retryCodes = getRetryCodes('batchWrite');
    return (
      error.code !== undefined &&
      (retryCodes.includes(error.code) || isRetryableDeleteError) &&
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
      let startingRate = DEFAULT_INITIAL_OPS_PER_SECOND_LIMIT;
      let maxRate = DEFAULT_MAXIMUM_OPS_PER_SECOND_LIMIT;

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
    this._verifyNotClosed();
    const op = this._enqueue(documentRef, 'create', bulkCommitBatch =>
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
    this._verifyNotClosed();
    const op = this._enqueue(documentRef, 'delete', bulkCommitBatch =>
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
    this._verifyNotClosed();
    const op = this._enqueue(documentRef, 'set', bulkCommitBatch =>
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
    documentRef: firestore.DocumentReference<T>,
    dataOrField: firestore.UpdateData | string | FieldPath,
    ...preconditionOrValues: Array<
      {lastUpdateTime?: Timestamp} | unknown | string | FieldPath
    >
  ): Promise<WriteResult> {
    this._verifyNotClosed();
    const op = this._enqueue(documentRef, 'update', bulkCommitBatch =>
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
      documentRef: firestore.DocumentReference<unknown>,
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
    this._verifyNotClosed();
    this._sendCurrentBatch(/* flush= */ true);
    return this._lastOp;
  }

  /**
   * Commits all enqueued writes and marks the BulkWriter instance as closed.
   *
   * After calling `close()`, calling any method will throw an error. Any
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
    this._verifyNotClosed();
    this.firestore._decrementBulkWritersCount();
    const flushPromise = this.flush();
    this._closing = true;
    return flushPromise;
  }

  /**
   * Throws an error if the BulkWriter instance has been closed.
   * @private
   */
  private _verifyNotClosed(): void {
    if (this._closing) {
      throw new Error('BulkWriter has already been closed.');
    }
  }

  /**
   * Sends the current batch and resets `this._bulkCommitBatch`.
   *
   * @param flush If provided, keeps re-sending operations until no more
   * operations are enqueued. This allows retries to resolve as part of a
   * `flush()` or `close()` call.
   * @private
   */
  private _sendCurrentBatch(flush = false): void {
    if (this._bulkCommitBatch._opCount === 0) return;

    const tag = requestTag();
    const pendingBatch = this._bulkCommitBatch;

    this._bulkCommitBatch = new BulkCommitBatch(this.firestore);

    // Send the batch if it is under the rate limit, or schedule another
    // attempt after the appropriate timeout.
    const underRateLimit = this._rateLimiter.tryMakeRequest(
      pendingBatch._opCount
    );

    const delayedExecution = new Deferred<void>();
    if (underRateLimit) {
      delayedExecution.resolve();
    } else {
      const delayMs = this._rateLimiter.getNextRequestDelayMs(
        pendingBatch._opCount
      );
      logger(
        'BulkWriter._sendCurrentBatch',
        tag,
        `Backing off for ${delayMs} seconds`
      );
      delayExecution(() => delayedExecution.resolve(), delayMs);
    }

    delayedExecution.promise.then(async () => {
      await pendingBatch.bulkCommit({requestTag: tag});
      if (flush) this._sendCurrentBatch(flush);
    });
  }

  /**
   * Schedules and runs the provided operation on the next available batch.
   * @private
   */
  private _enqueue(
    ref: firestore.DocumentReference<unknown>,
    type: 'create' | 'set' | 'update' | 'delete',
    enqueueOnBatchCallback: (bulkCommitBatch: BulkCommitBatch) => void
  ): Promise<WriteResult> {
    const bulkWriterOp = new BulkWriterOperation(
      ref,
      type,
      this._sendFn.bind(this, enqueueOnBatchCallback),
      this._errorFn.bind(this),
      this._successFn.bind(this)
    );
    this._sendFn(enqueueOnBatchCallback, bulkWriterOp);
    return bulkWriterOp.promise;
  }

  /**
   * Schedules the provided operations on current BulkCommitBatch.
   * Sends the BulkCommitBatch if it reaches maximum capacity.
   *
   * @private
   */
  _sendFn(
    enqueueOnBatchCallback: (bulkCommitBatch: BulkCommitBatch) => void,
    op: BulkWriterOperation
  ): void {
    if (this._bulkCommitBatch.has(op.ref)) {
      // Create a new batch since the backend doesn't support batches with two
      // writes to the same document.
      this._sendCurrentBatch();
    }

    // Run the operation on the current batch and advance the `_lastOp` pointer.
    // This ensures that `_lastOp` only resolves when both the previous and the
    // current write resolves.
    enqueueOnBatchCallback(this._bulkCommitBatch);
    this._bulkCommitBatch.processLastOperation(op);
    this._lastOp = this._lastOp.then(() => silencePromise(op.promise));

    if (this._bulkCommitBatch._opCount === this._maxBatchSize) {
      this._sendCurrentBatch();
    }
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
