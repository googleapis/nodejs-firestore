/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
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

import {GoogleError} from 'google-gax';
import * as proto from '../protos/firestore_v1_proto_api';

import {ExponentialBackoff} from './backoff';
import {DocumentSnapshot} from './document';
import {DEFAULT_MAX_TRANSACTION_ATTEMPTS, Firestore, WriteBatch} from './index';
import {Timestamp} from './timestamp';
import {logger} from './logger';
import {FieldPath, validateFieldPath} from './path';
import {StatusCode} from './status-code';
import {
  AggregateQuery,
  AggregateQuerySnapshot,
  DocumentReference,
  Query,
  QuerySnapshot,
  validateDocumentReference,
} from './reference';
import {isObject, isPlainObject} from './util';
import {
  invalidArgumentMessage,
  RequiredArgumentOptions,
  validateMinNumberOfArguments,
  validateOptional,
} from './validate';
import {DocumentReader} from './document-reader';
import api = proto.google.firestore.v1;

/*!
 * Error message for transactional reads that were executed after performing
 * writes.
 */
const READ_AFTER_WRITE_ERROR_MSG =
  'Firestore transactions require all reads to be executed before all writes.';

const READ_ONLY_WRITE_ERROR_MSG =
  'Firestore read-only transactions cannot execute writes.';

/**
 * A reference to a transaction.
 *
 * The Transaction object passed to a transaction's updateFunction provides
 * the methods to read and write data within the transaction context. See
 * [runTransaction()]{@link Firestore#runTransaction}.
 *
 * @class Transaction
 */
export class Transaction implements firestore.Transaction {
  private readonly _firestore: Firestore;
  private readonly _maxAttempts: number = DEFAULT_MAX_TRANSACTION_ATTEMPTS;
  private readonly _requestTag: string;

  /** Optional, could be set only if transaction is read only */
  private readonly _readOnlyReadTime: Timestamp | undefined;
  /** `undefined` if transaction is read only */
  private readonly _writeBatch: WriteBatch | undefined;
  /** `undefined` if transaction is read only */
  private readonly _backoff: ExponentialBackoff | undefined;

  /**
   * Promise that resolves to the transaction ID of the current attempt.
   * It is lazily initialised upon the first read. Upon retry, it is reset and
   * `_prevTransactionId` is set
   */
  private _transactionIdPromise?: Promise<Uint8Array>;
  private _prevTransactionId?: Uint8Array;

  /**
   * @private
   *
   * @param firestore The Firestore Database client.
   * @param requestTag A unique client-assigned identifier for the scope of
   * this transaction.
   * @param transactionOptions The user-defined options for this transaction.
   */
  constructor(
    firestore: Firestore,
    requestTag: string,
    transactionOptions?:
      | firestore.ReadWriteTransactionOptions
      | firestore.ReadOnlyTransactionOptions
  ) {
    this._firestore = firestore;
    this._requestTag = requestTag;
    if (transactionOptions?.readOnly) {
      // Avoid initialising write batch and backoff unnecessarily for read-only transactions
      this._maxAttempts = 1;
      this._readOnlyReadTime = transactionOptions.readTime as
        | Timestamp
        | undefined;
    } else {
      this._maxAttempts =
        transactionOptions?.maxAttempts || DEFAULT_MAX_TRANSACTION_ATTEMPTS;
      this._writeBatch = firestore.batch();
      this._backoff = new ExponentialBackoff();
    }
  }

  /**
   * Retrieves a query result. Holds a pessimistic lock on all returned
   * documents.
   *
   * @param {Query} query A query to execute.
   * @return {Promise<QuerySnapshot>} A QuerySnapshot for the retrieved data.
   */
  get<AppModelType, DbModelType extends firestore.DocumentData>(
    query: firestore.Query<AppModelType, DbModelType>
  ): Promise<QuerySnapshot<AppModelType, DbModelType>>;

  /**
   * Reads the document referenced by the provided `DocumentReference.`
   * Holds a pessimistic lock on the returned document.
   *
   * @param {DocumentReference} documentRef A reference to the document to be read.
   * @return {Promise<DocumentSnapshot>}  A DocumentSnapshot for the read data.
   */
  get<AppModelType, DbModelType extends firestore.DocumentData>(
    documentRef: firestore.DocumentReference<AppModelType, DbModelType>
  ): Promise<DocumentSnapshot<AppModelType, DbModelType>>;

  /**
   * Retrieves an aggregate query result. Holds a pessimistic lock on all
   * documents that were matched by the underlying query.
   *
   * @param aggregateQuery An aggregate query to execute.
   * @return An AggregateQuerySnapshot for the retrieved data.
   */
  get<
    AppModelType,
    DbModelType extends firestore.DocumentData,
    AggregateSpecType extends firestore.AggregateSpec,
  >(
    aggregateQuery: firestore.AggregateQuery<
      AggregateSpecType,
      AppModelType,
      DbModelType
    >
  ): Promise<
    AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
  >;

  /**
   * Retrieve a document or a query result from the database. Holds a
   * pessimistic lock on all returned documents.
   *
   * @param {DocumentReference|Query} refOrQuery The document or query to
   * return.
   * @returns {Promise} A Promise that resolves with a DocumentSnapshot or
   * QuerySnapshot for the returned documents.
   *
   * @example
   * ```
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   return transaction.get(documentRef).then(doc => {
   *     if (doc.exists) {
   *       transaction.update(documentRef, { count: doc.get('count') + 1 });
   *     } else {
   *       transaction.create(documentRef, { count: 1 });
   *     }
   *   });
   * });
   * ```
   */
  get<
    AppModelType,
    DbModelType extends firestore.DocumentData,
    AggregateSpecType extends firestore.AggregateSpec,
  >(
    refOrQuery:
      | firestore.DocumentReference<AppModelType, DbModelType>
      | firestore.Query<AppModelType, DbModelType>
      | firestore.AggregateQuery<AggregateSpecType, AppModelType, DbModelType>
  ): Promise<
    | DocumentSnapshot<AppModelType, DbModelType>
    | QuerySnapshot<AppModelType, DbModelType>
    | AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
  > {
    if (this._writeBatch && !this._writeBatch.isEmpty) {
      throw new Error(READ_AFTER_WRITE_ERROR_MSG);
    }

    if (refOrQuery instanceof DocumentReference) {
      return this.withLazyStartedTransaction(refOrQuery, this.getSingleFn);
    }

    if (refOrQuery instanceof Query || refOrQuery instanceof AggregateQuery) {
      return this.withLazyStartedTransaction(refOrQuery, this.getQueryFn);
    }

    throw new Error(
      'Value for argument "refOrQuery" must be a DocumentReference, Query, or AggregateQuery.'
    );
  }

  /**
   * Retrieves multiple documents from Firestore. Holds a pessimistic lock on
   * all returned documents.
   *
   * The first argument is required and must be of type `DocumentReference`
   * followed by any additional `DocumentReference` documents. If used, the
   * optional `ReadOptions` must be the last argument.
   *
   * @param {...DocumentReference|ReadOptions} documentRefsOrReadOptions The
   * `DocumentReferences` to receive, followed by an optional field mask.
   * @returns {Promise<Array.<DocumentSnapshot>>} A Promise that
   * contains an array with the resulting document snapshots.
   *
   * @example
   * ```
   * let firstDoc = firestore.doc('col/doc1');
   * let secondDoc = firestore.doc('col/doc2');
   * let resultDoc = firestore.doc('col/doc3');
   *
   * firestore.runTransaction(transaction => {
   *   return transaction.getAll(firstDoc, secondDoc).then(docs => {
   *     transaction.set(resultDoc, {
   *       sum: docs[0].get('count') + docs[1].get('count')
   *     });
   *   });
   * });
   * ```
   */
  getAll<AppModelType, DbModelType extends firestore.DocumentData>(
    ...documentRefsOrReadOptions: Array<
      | firestore.DocumentReference<AppModelType, DbModelType>
      | firestore.ReadOptions
    >
  ): Promise<Array<DocumentSnapshot<AppModelType, DbModelType>>> {
    if (this._writeBatch && !this._writeBatch.isEmpty) {
      throw new Error(READ_AFTER_WRITE_ERROR_MSG);
    }

    validateMinNumberOfArguments(
      'Transaction.getAll',
      documentRefsOrReadOptions,
      1
    );

    return this.withLazyStartedTransaction(
      parseGetAllArguments(documentRefsOrReadOptions),
      this.getBatchFn
    );
  }

  /**
   * Create the document referred to by the provided
   * [DocumentReference]{@link DocumentReference}. The operation will
   * fail the transaction if a document exists at the specified location.
   *
   * @param {DocumentReference} documentRef A reference to the document to be
   * created.
   * @param {DocumentData} data The object data to serialize as the document.
   * @returns {Transaction} This Transaction instance. Used for
   * chaining method calls.
   *
   * @example
   * ```
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   return transaction.get(documentRef).then(doc => {
   *     if (!doc.exists) {
   *       transaction.create(documentRef, { foo: 'bar' });
   *     }
   *   });
   * });
   * ```
   */
  create<AppModelType, DbModelType extends firestore.DocumentData>(
    documentRef: firestore.DocumentReference<AppModelType, DbModelType>,
    data: firestore.WithFieldValue<AppModelType>
  ): Transaction {
    if (!this._writeBatch) {
      throw new Error(READ_ONLY_WRITE_ERROR_MSG);
    }
    this._writeBatch.create(documentRef, data);
    return this;
  }

  set<AppModelType, DbModelType extends firestore.DocumentData>(
    documentRef: firestore.DocumentReference<AppModelType, DbModelType>,
    data: firestore.PartialWithFieldValue<AppModelType>,
    options: firestore.SetOptions
  ): Transaction;
  set<AppModelType, DbModelType extends firestore.DocumentData>(
    documentRef: firestore.DocumentReference<AppModelType, DbModelType>,
    data: firestore.WithFieldValue<AppModelType>
  ): Transaction;
  /**
   * Writes to the document referred to by the provided
   * [DocumentReference]{@link DocumentReference}. If the document
   * does not exist yet, it will be created. If you pass
   * [SetOptions]{@link SetOptions}, the provided data can be merged into the
   * existing document.
   *
   * @param {DocumentReference} documentRef A reference to the document to be
   * set.
   * @param {T|Partial<T>} data The object to serialize as the document.
   * @param {SetOptions=} options An object to configure the set behavior.
   * @param {boolean=} options.merge - If true, set() merges the values
   * specified in its data argument. Fields omitted from this set() call remain
   * untouched. If your input sets any field to an empty map, all nested fields
   * are overwritten.
   * @param {Array.<string|FieldPath>=} options.mergeFields - If provided,
   * set() only replaces the specified field paths. Any field path that is not
   * specified is ignored and remains untouched. If your input sets any field to
   * an empty map, all nested fields are overwritten.
   * @throws {Error} If the provided input is not a valid Firestore document.
   * @returns {Transaction} This Transaction instance. Used for
   * chaining method calls.
   *
   * @example
   * ```
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   transaction.set(documentRef, { foo: 'bar' });
   *   return Promise.resolve();
   * });
   * ```
   */
  set<AppModelType, DbModelType extends firestore.DocumentData>(
    documentRef: firestore.DocumentReference<AppModelType, DbModelType>,
    data: firestore.PartialWithFieldValue<AppModelType>,
    options?: firestore.SetOptions
  ): Transaction {
    if (!this._writeBatch) {
      throw new Error(READ_ONLY_WRITE_ERROR_MSG);
    }
    if (options) {
      this._writeBatch.set(documentRef, data, options);
    } else {
      this._writeBatch.set(
        documentRef,
        data as firestore.WithFieldValue<AppModelType>
      );
    }
    return this;
  }

  /**
   * Updates fields in the document referred to by the provided
   * [DocumentReference]{@link DocumentReference}. The update will
   * fail if applied to a document that does not exist.
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
   * @param {UpdateData|string|FieldPath} dataOrField An object
   * containing the fields and values with which to update the document
   * or the path of the first field to update.
   * @param {
   * ...(Precondition|*|string|FieldPath)} preconditionOrValues -
   * An alternating list of field paths and values to update or a Precondition
   * to to enforce on this update.
   * @throws {Error} If the provided input is not valid Firestore data.
   * @returns {Transaction} This Transaction instance. Used for
   * chaining method calls.
   *
   * @example
   * ```
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   return transaction.get(documentRef).then(doc => {
   *     if (doc.exists) {
   *       transaction.update(documentRef, { count: doc.get('count') + 1 });
   *     } else {
   *       transaction.create(documentRef, { count: 1 });
   *     }
   *   });
   * });
   * ```
   */
  update<AppModelType, DbModelType extends firestore.DocumentData>(
    documentRef: firestore.DocumentReference<AppModelType, DbModelType>,
    dataOrField:
      | firestore.UpdateData<DbModelType>
      | string
      | firestore.FieldPath,
    ...preconditionOrValues: Array<
      firestore.Precondition | unknown | string | firestore.FieldPath
    >
  ): Transaction {
    if (!this._writeBatch) {
      throw new Error(READ_ONLY_WRITE_ERROR_MSG);
    }

    // eslint-disable-next-line prefer-rest-params
    validateMinNumberOfArguments('Transaction.update', arguments, 2);

    this._writeBatch.update(documentRef, dataOrField, ...preconditionOrValues);
    return this;
  }

  /**
   * Deletes the document referred to by the provided [DocumentReference]
   * {@link DocumentReference}.
   *
   * @param {DocumentReference} documentRef A reference to the document to be
   * deleted.
   * @param {Precondition=} precondition A precondition to enforce for this
   * delete.
   * @param {Timestamp=} precondition.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime. Fails the transaction if the
   * document doesn't exist or was last updated at a different time.
   * @param {boolean=} precondition.exists If set, enforces that the target
   * document must or must not exist.
   * @returns {Transaction} This Transaction instance. Used for
   * chaining method calls.
   *
   * @example
   * ```
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   transaction.delete(documentRef);
   *   return Promise.resolve();
   * });
   * ```
   */
  delete(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documentRef: DocumentReference<any, any>,
    precondition?: firestore.Precondition
  ): this {
    if (!this._writeBatch) {
      throw new Error(READ_ONLY_WRITE_ERROR_MSG);
    }
    this._writeBatch.delete(documentRef, precondition);
    return this;
  }

  /**
   * Commits all queued-up changes in this transaction and releases all locks.
   *
   * @private
   * @internal
   */
  async commit(): Promise<void> {
    if (!this._writeBatch) {
      throw new Error(READ_ONLY_WRITE_ERROR_MSG);
    }

    // If we have not performed any reads in this particular attempt
    // then the writes will be atomically committed without a transaction ID
    let transactionId: Uint8Array | undefined;
    if (this._transactionIdPromise) {
      transactionId = await this._transactionIdPromise;
    } else if (this._writeBatch.isEmpty) {
      // If we have not started a transaction (no reads) and we have no writes
      // then the commit is a no-op (success)
      return;
    }

    await this._writeBatch._commit({
      transactionId,
      requestTag: this._requestTag,
    });
    this._transactionIdPromise = undefined;
    this._prevTransactionId = transactionId;
  }

  /**
   * Releases all locks and rolls back this transaction.
   *
   * @private
   * @internal
   */
  async rollback(): Promise<void> {
    // No need to roll back if we have not lazily started the transaction
    // or if we are read only
    if (!this._transactionIdPromise || !this._writeBatch) {
      return;
    }

    let transactionId: Uint8Array | undefined;
    try {
      transactionId = await this._transactionIdPromise;
    } catch {
      // This means the initial read operation rejected
      // and we do not have a transaction ID to roll back
      this._transactionIdPromise = undefined;
      return;
    }

    const request = {
      database: this._firestore.formattedName,
      transaction: transactionId,
    };
    this._transactionIdPromise = undefined;
    this._prevTransactionId = transactionId;

    try {
      await this._firestore.request('rollback', request, this._requestTag);
    } catch (reason) {
      logger(
        'Firestore.runTransaction',
        this._requestTag,
        'Best effort to rollback failed with error:',
        reason
      );
    }
  }

  /**
   * Executes `updateFunction()` and commits the transaction with retry.
   *
   * @private
   * @internal
   * @param updateFunction The user function to execute within the transaction
   * context.
   */
  async runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    // No backoff is set for readonly transactions (i.e. attempts == 1)
    if (!this._backoff) {
      return this.runTransactionOnce(updateFunction);
    }

    let lastError: GoogleError | undefined = undefined;
    for (let attempt = 0; attempt < this._maxAttempts; ++attempt) {
      try {
        if (lastError) {
          logger(
            'Firestore.runTransaction',
            this._requestTag,
            'Retrying transaction after error:',
            lastError
          );
        }

        this._writeBatch!._reset();

        await maybeBackoff(this._backoff, lastError);

        return await this.runTransactionOnce(updateFunction);
      } catch (err) {
        lastError = err;

        // We may or may not have a previous transaction ID
        // For example, the initial read operation could have failed with a
        // retry-able error meaning we did not obtain the ID of the lazy-started
        // transaction so we will retry without the ID of the previous attempt
        if (!isRetryableTransactionError(err)) {
          break;
        }
      }
    }

    logger(
      'Firestore.runTransaction',
      this._requestTag,
      'Transaction not eligible for retry, returning error: %s',
      lastError
    );

    return Promise.reject(lastError);
  }

  /**
   * Make single attempt to execute `updateFunction()` and commit the
   * transaction. Will rollback upon error.
   *
   * @private
   * @internal
   * @param updateFunction The user function to execute within the transaction
   * context.
   */
  async runTransactionOnce<T>(
    updateFunction: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    try {
      const promise = updateFunction(this);
      if (!(promise instanceof Promise)) {
        throw new Error(
          'You must return a Promise in your transaction()-callback.'
        );
      }
      const result = await promise;
      if (this._writeBatch) {
        await this.commit();
      }
      return result;
    } catch (err) {
      logger(
        'Firestore.runTransaction',
        this._requestTag,
        'Rolling back transaction after callback error:',
        err
      );
      await this.rollback();
      return Promise.reject(err);
    }
  }

  /**
   * Given a function that performs a read operation, ensures that the first one
   * is provided with new transaction options and all subsequent ones are queued
   * upon the resulting transaction ID.
   */
  private withLazyStartedTransaction<TParam, TResult>(
    param: TParam,
    resultFn: (
      this: typeof this,
      param: TParam,
      opts: Uint8Array | api.ITransactionOptions | Timestamp
    ) => Promise<{transaction?: Uint8Array; result: TResult}>
  ): Promise<TResult> {
    if (this._transactionIdPromise) {
      // Simply queue this subsequent read operation after the first read
      // operation has resolved and we don't expect a transaction ID in the
      // response because we are not starting a new transaction
      return this._transactionIdPromise.then(async opts => {
        const r = await resultFn.call(this, param, opts);
        return r.result;
      });
    } else {
      if (this._readOnlyReadTime) {
        // We do not start a transaction for read-only transactions
        // do not set _prevTransactionId
        return resultFn
          .call(this, param, this._readOnlyReadTime)
          .then(resolveResult);
      } else {
        // This is the first read of the transaction so we create the appropriate
        // options for lazily starting the transaction inside this first read op
        let opts: api.ITransactionOptions;
        if (this._writeBatch) {
          opts = this._prevTransactionId
            ? {readWrite: {retryTransaction: this._prevTransactionId}}
            : {readWrite: {}};
        } else {
          opts = {readOnly: {}};
        }

        const resultPromise = resultFn.call(this, param, opts);

        // Ensure the _transactionIdPromise is set synchronously so that
        // subsequent operations will not race to start another transaction
        this._transactionIdPromise = resultPromise.then(async r => {
          if (!r.transaction) {
            // Illegal state
            // The read operation was provided with new transaction options but did not return a transaction ID
            // Rejecting here will cause all queued reads to reject
            throw new Error('Transaction ID was missing from server response');
          }
          return r.transaction;
        });

        return resultPromise.then(resolveResult);
      }
    }
  }

  private async getSingleFn<
    AppModelType,
    DbModelType extends firestore.DocumentData,
  >(
    document: DocumentReference<AppModelType, DbModelType>,
    opts: Uint8Array | api.ITransactionOptions | Timestamp
  ): Promise<{
    transaction?: Uint8Array;
    result: DocumentSnapshot<AppModelType, DbModelType>;
  }> {
    const documentReader = new DocumentReader(this._firestore, [document]);
    if (opts instanceof Timestamp) {
      documentReader.readTime = opts;
    } else {
      documentReader.transactionIdOrNewTransaction = opts;
    }
    const {
      transaction,
      result: [result],
    } = await documentReader.getResponse(this._requestTag);
    return {transaction, result};
  }

  private async getBatchFn<
    AppModelType,
    DbModelType extends firestore.DocumentData,
  >(
    {
      documents,
      fieldMask,
    }: {
      documents: Array<DocumentReference<AppModelType, DbModelType>>;
      fieldMask?: FieldPath[] | null;
    },
    opts: Uint8Array | api.ITransactionOptions | Timestamp
  ): Promise<{
    transaction?: Uint8Array;
    result: DocumentSnapshot<AppModelType, DbModelType>[];
  }> {
    const documentReader = new DocumentReader(this._firestore, documents);
    documentReader.fieldMask = fieldMask || undefined;
    if (opts instanceof Timestamp) {
      documentReader.readTime = opts;
    } else {
      documentReader.transactionIdOrNewTransaction = opts;
    }
    return documentReader.getResponse(this._requestTag);
  }

  private async getQueryFn<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TQuery extends Query<any, any> | AggregateQuery<any, any>,
  >(
    query: TQuery,
    opts: Uint8Array | api.ITransactionOptions | Timestamp
  ): Promise<{
    transaction?: Uint8Array;
    result: Awaited<ReturnType<TQuery['_getResponse']>>['result'];
  }> {
    return query._getResponse(opts);
  }
}

/**
 * Parses the arguments for the `getAll()` call supported by both the Firestore
 * and Transaction class.
 *
 * @private
 * @internal
 * @param documentRefsOrReadOptions An array of document references followed by
 * an optional ReadOptions object.
 */
export function parseGetAllArguments<
  AppModelType,
  DbModelType extends firestore.DocumentData,
>(
  documentRefsOrReadOptions: Array<
    | firestore.DocumentReference<AppModelType, DbModelType>
    | firestore.ReadOptions
  >
): {
  documents: Array<DocumentReference<AppModelType, DbModelType>>;
  fieldMask: FieldPath[] | null;
} {
  let documents: Array<DocumentReference<AppModelType, DbModelType>>;
  let readOptions: firestore.ReadOptions | undefined = undefined;

  if (Array.isArray(documentRefsOrReadOptions[0])) {
    throw new Error(
      'getAll() no longer accepts an array as its first argument. ' +
        'Please unpack your array and call getAll() with individual arguments.'
    );
  }

  if (
    documentRefsOrReadOptions.length > 0 &&
    isPlainObject(
      documentRefsOrReadOptions[documentRefsOrReadOptions.length - 1]
    )
  ) {
    readOptions = documentRefsOrReadOptions.pop() as firestore.ReadOptions;
    documents = documentRefsOrReadOptions as Array<
      DocumentReference<AppModelType, DbModelType>
    >;
  } else {
    documents = documentRefsOrReadOptions as Array<
      DocumentReference<AppModelType, DbModelType>
    >;
  }

  for (let i = 0; i < documents.length; ++i) {
    validateDocumentReference<AppModelType, DbModelType>(i, documents[i]);
  }

  validateReadOptions('options', readOptions, {optional: true});
  const fieldMask =
    readOptions && readOptions.fieldMask
      ? readOptions.fieldMask.map(fieldPath =>
          FieldPath.fromArgument(fieldPath)
        )
      : null;
  return {fieldMask, documents};
}

/**
 * Validates the use of 'options' as ReadOptions and enforces that 'fieldMask'
 * is an array of strings or field paths.
 *
 * @private
 * @internal
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The input to validate.
 * @param options Options that specify whether the ReadOptions can be omitted.
 */
function validateReadOptions(
  arg: number | string,
  value: unknown,
  options?: RequiredArgumentOptions
): void {
  if (!validateOptional(value, options)) {
    if (!isObject(value)) {
      throw new Error(
        `${invalidArgumentMessage(arg, 'read option')} Input is not an object.'`
      );
    }

    const options = value as {[k: string]: unknown};

    if (options.fieldMask !== undefined) {
      if (!Array.isArray(options.fieldMask)) {
        throw new Error(
          `${invalidArgumentMessage(
            arg,
            'read option'
          )} "fieldMask" is not an array.`
        );
      }

      for (let i = 0; i < options.fieldMask.length; ++i) {
        try {
          validateFieldPath(i, options.fieldMask[i]);
        } catch (err) {
          throw new Error(
            `${invalidArgumentMessage(
              arg,
              'read option'
            )} "fieldMask" is not valid: ${err.message}`
          );
        }
      }
    }
  }
}

function isRetryableTransactionError(error: GoogleError): boolean {
  if (error.code !== undefined) {
    // This list is based on https://github.com/firebase/firebase-js-sdk/blob/master/packages/firestore/src/core/transaction_runner.ts#L112
    switch (error.code as number) {
      case StatusCode.ABORTED:
      case StatusCode.CANCELLED:
      case StatusCode.UNKNOWN:
      case StatusCode.DEADLINE_EXCEEDED:
      case StatusCode.INTERNAL:
      case StatusCode.UNAVAILABLE:
      case StatusCode.UNAUTHENTICATED:
      case StatusCode.RESOURCE_EXHAUSTED:
        return true;
      case StatusCode.INVALID_ARGUMENT:
        // The Firestore backend uses "INVALID_ARGUMENT" for transactions
        // IDs that have expired. While INVALID_ARGUMENT is generally not
        // retryable, we retry this specific case.
        return !!error.message.match(/transaction has expired/);
      default:
        return false;
    }
  }
  return false;
}

/**
 * Delays further operations based on the provided error.
 *
 * @private
 * @internal
 * @return A Promise that resolves after the delay expired.
 */
async function maybeBackoff(
  backoff: ExponentialBackoff,
  error?: GoogleError
): Promise<void> {
  if ((error?.code as number | undefined) === StatusCode.RESOURCE_EXHAUSTED) {
    backoff.resetToMax();
  }
  await backoff.backoffAndWait();
}

function resolveResult<TResult>({result}: {result: TResult}): TResult {
  return result;
}
