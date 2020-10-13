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
import {
  Deferred,
  getRetryCodes,
  isObject,
  voidPromise,
  wrapError,
} from './util';
import {BatchWriteResult, WriteBatch, WriteResult} from './write-batch';
import {
  invalidArgumentMessage,
  validateInteger,
  validateOptional,
} from './validate';
// TODO(chenbrian): Figure some way to get rid of this.
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

  // An array of pending write operations. Only contains writes that have not
  // been resolved.
  private pendingOps: Array<PendingOp> = [];

  private readonly backoff: ExponentialBackoff;

  constructor(
    private readonly firestore: Firestore,
    private writeBatch: WriteBatch,
    private readonly maxBatchSize: number,
    readonly retryCount: number
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
    return this.processLastOperation();
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
    return this.processLastOperation();
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
    return this.processLastOperation();
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
    return this.processLastOperation();
  }

  /**
   * Helper to update data structures associated with the operation and
   * return the result.
   */
  private processLastOperation<T>(): Promise<WriteResult> {
    assert(
      this.state === BatchState.OPEN,
      'Batch should be OPEN when adding writes'
    );
    const deferred = new Deferred<BatchWriteResult>();
    this.pendingOps.push({
      writeBatchIndex: this.opCount,
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
    try {
      results = await this.writeBatch.bulkCommit();
    } catch (err) {
      // Map the failure to each individual write's result.
      results = this.pendingOps.map(() => {
        return {
          writeTime: null,
          status: wrapError(err, stack),
        };
      });
    }
    return this.processResults(results);
  }

  /**
   * Resolves the individual operations in the batch with the results.
   */
  private async processResults(results: BatchWriteResult[]): Promise<void> {
    return Promise.all(
      results.map((result, i) => {
        const op = this.pendingOps[i];
        if (result.status.code === Status.OK) {
          op.deferred.resolve(result);
        } else {
          op.deferred.reject(result.status);
        }
        return op.deferred.promise.then(
          () => {},
          () => {}
        );
      })
    ).then(() => {});
  }

  markReadyToSend(): void {
    if (this.state === BatchState.OPEN) {
      this.state = BatchState.READY_TO_SEND;
    }
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

    /** How many times this operation has been retried. */
    readonly retryCount: number
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

  private _retryBatchQueue: BulkCommitBatch[] = [];

  /**
   * A list of promises that represent sent batches. Each promise is resolved
   * when the batch's response is received.
   */
  private _pendingBatches: Set<Promise<void>> = new Set();

  /**
   * A list of promises that represent pending BulkWriter operations. Each
   * promise is resolved when the BulkWriter operation resolves.
   */
  private _pendingOps: Set<Promise<void>> = new Set();

  /**
   * Whether this BulkWriter instance has started to close. Afterwards, no
   * new operations can be enqueued, except for retry operations scheduled by
   * the error handler.
   */
  private closed = false;

  /**
   * Rate limiter used to throttle requests as per the 500/50/5 rule.
   */
  private readonly rateLimiter: RateLimiter;

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
      error.retryCount < MAX_RETRY_ATTEMPTS
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
      this.rateLimiter = new RateLimiter(
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
   * the write.
   * @throws {BulkWriterError} if the write fails.
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
    const op = this._create(documentRef, data);
    this.sendReadyBatches();
    this._pendingOps.add(voidPromise(op));
    return op;
  }

  private _create<T>(
    documentRef: FirebaseFirestore.DocumentReference<T>,
    data: T,
    retryCount = 0
  ): Promise<WriteResult> {
    const bulkCommitBatch = this.getEligibleBatch(retryCount);
    const retryFn = (): Promise<WriteResult> =>
      this._create(documentRef, data, retryCount + 1);
    return this.wrapRetry(
      bulkCommitBatch.create(documentRef, data),
      documentRef,
      retryCount,
      'create',
      retryFn
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
   * @returns {Promise<WriteResult>} A promise that resolves with a sentinel
   * Timestamp indicating that the delete was successful.
   * @throws {BulkWriterError} if the delete fails.
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
    const op = this._delete(documentRef, precondition);
    this.sendReadyBatches();
    this._pendingOps.add(voidPromise(op));
    return op;
  }

  private _delete<T>(
    documentRef: FirebaseFirestore.DocumentReference<T>,
    precondition: FirebaseFirestore.Precondition | undefined,
    retryCount = 0
  ): Promise<WriteResult> {
    const bulkCommitBatch = this.getEligibleBatch(retryCount);
    const retryFn = (): Promise<WriteResult> =>
      this._delete(documentRef, precondition, retryCount + 1);
    return this.wrapRetry(
      bulkCommitBatch.delete(documentRef, precondition),
      documentRef,
      retryCount,
      'delete',
      retryFn
    );
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
   * the write.
   * @throws {BulkWriterError} if the write fails.
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
    const op = this._set(documentRef, data, options);
    this.sendReadyBatches();
    return op;
  }

  private _set<T>(
    documentRef: FirebaseFirestore.DocumentReference<T>,
    data: Partial<T> | T,
    options: FirebaseFirestore.SetOptions | undefined,
    retryCount = 0
  ): Promise<WriteResult> {
    const bulkCommitBatch = this.getEligibleBatch(retryCount);
    const retryFn = (): Promise<WriteResult> =>
      this._set(documentRef, data, options, retryCount + 1);
    return this.wrapRetry(
      bulkCommitBatch.set(documentRef, data, options),
      documentRef,
      retryCount,
      'set',
      retryFn
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
   * the write.
   * @throws {BulkWriterError} if the write fails.
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
    const op = this._update(documentRef, dataOrField, preconditionOrValues);
    this.sendReadyBatches();
    this._pendingOps.add(voidPromise(op));
    return op;
  }

  private _update(
    documentRef: FirebaseFirestore.DocumentReference,
    dataOrField: FirebaseFirestore.UpdateData | string | FieldPath,
    preconditionOrValues: (
      | {lastUpdateTime?: Timestamp}
      | unknown
      | string
      | FieldPath
    )[],
    retryCount = 0
  ): Promise<WriteResult> {
    const bulkCommitBatch = this.getEligibleBatch(retryCount);
    const retryFn = (): Promise<WriteResult> =>
      this._update(
        documentRef,
        dataOrField,
        preconditionOrValues,
        retryCount + 1
      );
    return this.wrapRetry(
      bulkCommitBatch.update(documentRef, dataOrField, ...preconditionOrValues),
      documentRef,
      retryCount,
      'update',
      retryFn
    );
  }

  /**
   * Attaches a listener that is run every time a BulkWriter operation
   * successfully completes.
   *
   * @param callback A callback to be called every time a BulkWriter operation
   * successfully completes.
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
   * Attaches a listener that is run every time a BulkWriter operation fails.
   *
   * @param shouldRetryError A callback to be called every time a BulkWriter
   * operation fails. Returning `true` will retry the operation. Returning
   * `false` will stop the retry loop.
   */
  onWriteError(shouldRetryError: (error: BulkWriterError) => boolean): void {
    this._errorFn = shouldRetryError;
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
    await this._flush();
  }

  private async _flush(): Promise<void> {
    const trackedBatches = this._batchQueue;
    trackedBatches.map(batch => batch.markReadyToSend());
    let retriesCompleted = false;
    while (!retriesCompleted) {
      const before = this._pendingBatches.size;
      this.sendReadyBatches();
      const after = this._pendingBatches.size;
      await Promise.all(this._pendingBatches);

      // If no new batches were created from the pending batches, then those
      // batches did not create more retries, which means we're done.
      if (before === after) {
        retriesCompleted = true;
      }
    }
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
  async close(): Promise<void> {
    this.verifyNotClosed();
    this.firestore._decrementBulkWritersCount();
    const flushPromise = this.flush();
    this.closed = true;
    await flushPromise;

    // Make sure user promises resolve before close() resolves.
    await Promise.all(this._pendingOps);
  }

  /**
   * Throws an error if the BulkWriter instance has been closed.
   */
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
  private getEligibleBatch<T>(retryCount: number): BulkCommitBatch {
    const batchQueue =
      retryCount > 0 ? this._retryBatchQueue : this._batchQueue;

    if (batchQueue.length > 0) {
      const lastBatch = batchQueue[batchQueue.length - 1];
      if (
        lastBatch.retryCount === retryCount &&
        lastBatch.state === BatchState.OPEN
      ) {
        return lastBatch;
      }
    }

    return this.createNewBatch(retryCount);
  }

  /**
   * Creates a new batch and adds it to the BatchQueue. If there is already a
   * batch enqueued, sends the batch after a new one is created.
   *
   * @private
   */
  private createNewBatch(retryCount: number): BulkCommitBatch {
    const newBatch = new BulkCommitBatch(
      this.firestore,
      this.firestore.batch(),
      this._maxBatchSize,
      retryCount
    );

    const batchQueue =
      retryCount > 0 ? this._retryBatchQueue : this._batchQueue;

    if (batchQueue.length > 0) {
      batchQueue[batchQueue.length - 1].markReadyToSend();
      this.sendReadyBatches();
    }

    batchQueue.push(newBatch);
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
    // Always send retry batches first if the retryBatchQueue isn't empty.
    const sendRetries = this._retryBatchQueue.length > 0;
    const unsentBatches = sendRetries
      ? this._retryBatchQueue
      : this._batchQueue;
    for (let index = 0; index < unsentBatches.length; ++index) {
      const batch = unsentBatches[index];

      // Send all retries whenever possible.
      if (sendRetries) {
        batch.markReadyToSend();
      }

      if (batch.state !== BatchState.READY_TO_SEND) {
        continue;
      }

      const batchDeferred = new Deferred<void>();
      this._pendingBatches.add(batchDeferred.promise);

      // Send the batch if it is under the rate limit, or schedule another
      // attempt after the appropriate timeout.
      const delayMs = this.rateLimiter.getNextRequestDelayMs(batch.opCount);
      assert(delayMs !== -1, 'Batch size should be under capacity');
      if (delayMs === 0) {
        this.sendBatch(batch, sendRetries)
          .then(batchDeferred.resolve, batchDeferred.reject)
          .then(() => {
            this._pendingBatches.delete(batchDeferred.promise);
          });
      } else {
        delayExecution(() => {
          batchDeferred.resolve();
          this._pendingBatches.delete(batchDeferred.promise);
          this.sendReadyBatches();
        }, delayMs);
        break;
      }
    }
  }

  /**
   * Sends the provided batch and processes the results. After the batch is
   * committed, sends the next group of ready batches.
   *
   * @private
   */
  private sendBatch(
    batch: BulkCommitBatch,
    isRetryBatch = false
  ): Promise<void> {
    const success = this.rateLimiter.tryMakeRequest(batch.opCount);
    assert(success, 'Batch should be under rate limit to be sent.');
    return batch.bulkCommit().then(() => {
      // Remove the batch from the BatchQueue after it has been processed.
      const batchQueue = isRetryBatch
        ? this._retryBatchQueue
        : this._batchQueue;
      const batchIndex = batchQueue.indexOf(batch);
      assert(batchIndex !== -1, 'The batch should be in the BatchQueue');
      batchQueue.splice(batchIndex, 1);

      this.sendReadyBatches();
    });
  }

  private wrapRetry(
    promise: Promise<WriteResult>,
    documentRef: firestore.DocumentReference,
    retryCount: number,
    operationType: 'create' | 'set' | 'update' | 'delete',
    retryFn: () => Promise<WriteResult>
  ): Promise<WriteResult> {
    // eslint-disable-next-line prefer-const
    let voidOperationPromise: Promise<void>;
    const operation = promise
      .then(res => {
        this._successFn(documentRef, res);
        this._pendingOps.delete(voidOperationPromise);
        return res;
      })
      .catch(error => {
        const bulkWriterError = new BulkWriterError(
          error.code,
          error.message,
          documentRef,
          operationType,
          retryCount
        );
        const shouldRetry = this._errorFn(bulkWriterError);
        this._pendingOps.delete(voidOperationPromise);
        if (shouldRetry) {
          return retryFn();
        } else {
          throw bulkWriterError;
        }
      });
    voidOperationPromise = voidPromise(operation);
    this._pendingOps.add(voidOperationPromise);
    return operation;
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
    return this.rateLimiter;
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
