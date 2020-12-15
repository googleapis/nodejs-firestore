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

enum OperationState {
  READY_TO_SEND,
  SENT,
  FAILED,
  SUCCESS,
}

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
 * Represents a single write for BulkWriter. A write can be in one of four
 * states (READY_TO_SEND, SENT, FAILED, SUCCESS). A SENT write can
 * transition back to READY_TO_SEND if it is scheduled for retry.
 *
 * @private
 */
class BulkWriterOperation {
  private deferred = new Deferred<WriteResult>();
  private _state: OperationState = OperationState.READY_TO_SEND;
  private failedAttempts = 0;

  constructor(
    readonly ref: firestore.DocumentReference<unknown>,
    private type: 'create' | 'set' | 'update' | 'delete',
    private op: (bulkCommitBatch: BulkCommitBatch) => void,
    private _onError: (error: BulkWriterError) => boolean,
    private _onSuccess: (result: WriteResult) => void
  ) {}

  get promise(): Promise<WriteResult> {
    return this.deferred.promise;
  }

  get state(): OperationState {
    return this._state;
  }

  /** Determines whether the operation is still pending a server response. */
  get isActive(): boolean {
    return (
      this._state === OperationState.READY_TO_SEND ||
      this._state === OperationState.SENT
    );
  }

  /** Enqueues the operation on the provided batch. */
  enqueue(batch: BulkCommitBatch): void {
    this.op(batch);
    batch.processLastOperation(this);
    this._state = OperationState.SENT;
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
      const shouldRetry = this._onError(bulkWriterError);
      logger(
        'BulkWriter.errorFn',
        null,
        'Running error callback on error code:',
        error.code,
        ', shouldRetry:',
        shouldRetry,
        ' for document: ',
        this.ref.path
      );

      if (!shouldRetry) {
        throw bulkWriterError;
      }

      this._state = OperationState.READY_TO_SEND;
    } catch (error) {
      this._state = OperationState.FAILED;
      this.deferred.reject(error);
    }
  }

  onSuccess(result: WriteResult): void {
    this._state = OperationState.SUCCESS;
    try {
      this._onSuccess(result);
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
   * The batch that is currently used to schedule operations. Once this batch
   * reached maximum capacity, a new batch is created.
   */
  private _bulkCommitBatch = new BulkCommitBatch(this.firestore);

  /**
   * A list of promises that represent pending BulkWriter operations. Each
   * promise is resolved when the BulkWriter operation resolves. This set
   * includes retries. Each retry's promise is added, attempted, and removed
   * from this set before scheduling the next retry.
   */
  private _pendingOps: Array<BulkWriterOperation> = [];

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
    document: firestore.DocumentReference<unknown>,
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
    documentRef: firestore.DocumentReference,
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
    const pendingOps = this._pendingOps.slice();
    this._sendOps(pendingOps, /* flush= */ true);
    return silencePromise(Promise.all(pendingOps.map(op => op.promise)));
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
   * Schedules the specified operations on the next number of BulkCommitBatches.
   * Sends BulkCommitBatches as they reach maximum capacity. If `flush` is
   * provided, also sends the final batch even if it hasn't reached capacity.
   *
   * @private
   */
  private _sendOps(ops: Array<BulkWriterOperation>, flush = false): void {
    const commits: Array<Promise<void>> = [];
    for (const op of ops) {
      if (op.state === OperationState.READY_TO_SEND) {
        if (this._bulkCommitBatch.has(op.ref)) {
          // A batch cannot contain two writes for the same document. We
          // therefore split up the batch.
          commits.push(this._sendCurrentBatch());
        }

        op.enqueue(this._bulkCommitBatch);
        if (this._bulkCommitBatch._opCount === this._maxBatchSize) {
          commits.push(this._sendCurrentBatch());
        }
      }
    }

    if (flush && this._bulkCommitBatch._opCount > 0) {
      commits.push(this._sendCurrentBatch());
    }

    if (commits.length > 0) {
      // Wait for all commits to finish and then potentially resend any
      // operations that are marked for retry.
      Promise.all(commits).then(() => this._sendOps(ops, flush));
    }
  }

  /**
   * Sends the current batch and resets `this._bulkCommitBatch`.
   *
   * @private
   */
  private _sendCurrentBatch(): Promise<void> {
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
        'BulkWriter.sendNextBatch',
        tag,
        `Backing off for ${delayMs} seconds`
      );
      delayExecution(() => delayedExecution.resolve(), delayMs);
    }

    return delayedExecution.promise.then(async () => {
      await pendingBatch.bulkCommit({requestTag: tag});
      this._pendingOps = this._pendingOps.filter(op => op.isActive);
    });
  }

  /**
   * Schedules and runs the provided operation on the next available batch.
   * @private
   */
  private _enqueue(
    ref: firestore.DocumentReference<unknown>,
    type: 'create' | 'set' | 'update' | 'delete',
    op: (bulkCommitBatch: BulkCommitBatch) => void
  ): Promise<WriteResult> {
    const bulkWriterOp = new BulkWriterOperation(
      ref,
      type,
      op,
      error => this._errorFn(error),
      writeResult => this._successFn(ref, writeResult)
    );
    this._pendingOps.push(bulkWriterOp);
    this._sendOps(this._pendingOps);
    return bulkWriterOp.promise;
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
