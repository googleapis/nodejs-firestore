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

import * as proto from '../protos/firestore_proto_api';

import {DocumentSnapshot, Precondition} from './document';
import {Firestore, WriteBatch} from './index';
import {FieldPath} from './path';
import {DocumentReference, Query, QuerySnapshot} from './reference';
import {AnyDuringMigration, AnyJs, DocumentData, Precondition as PublicPrecondition, ReadOptions, SetOptions, UpdateData} from './types';
import {parseGetAllArguments} from './util';
import {requestTag} from './util';

import api = proto.google.firestore.v1beta1;

/*!
 * Error message for transactional reads that were executed after performing
 * writes.
 */
const READ_AFTER_WRITE_ERROR_MSG =
    'Firestore transactions require all reads to be executed before all writes.';

/*!
 * Transactions can be retried if the initial stream opening errors out.
 */
const ALLOW_RETRIES = true;

/**
 * A reference to a transaction.
 *
 * The Transaction object passed to a transaction's updateFunction provides
 * the methods to read and write data within the transaction context. See
 * [runTransaction()]{@link Firestore#runTransaction}.
 *
 * @class
 */
export class Transaction {
  private _firestore: Firestore;
  private _validator: AnyDuringMigration;
  private _previousTransaction?: Transaction;
  private _writeBatch: WriteBatch;
  private _requestTag: string;
  private _transactionId?: Uint8Array;
  /**
   * @private
   * @hideconstructor
   *
   * @param firestore The Firestore Database client.
   * @param previousTransaction If available, the failed transaction that is
   * being retried.
   */
  constructor(firestore: Firestore, previousTransaction?: Transaction) {
    this._firestore = firestore;
    this._validator = firestore._validator;
    this._previousTransaction = previousTransaction;
    this._writeBatch = firestore.batch();
    this._requestTag =
        previousTransaction ? previousTransaction.requestTag : requestTag();
  }

  /**
   * Retrieves a query result. Holds a pessimistic lock on all returned
   * documents.
   *
   * @param {Query} query A query to execute.
   * @return {Promise<QuerySnapshot>} A QuerySnapshot for the retrieved data.
   */
  get(query: Query): Promise<QuerySnapshot>;

  /**
   * Reads the document referenced by the provided `DocumentReference.`
   * Holds a pessimistic lock on the returned document.
   *
   * @param {DocumentReference} documentRef A reference to the document to be read.
   * @return {Promise<DocumentSnapshot>}  A DocumentSnapshot for the read data.
   */
  get(documentRef: DocumentReference): Promise<DocumentSnapshot>;

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
   */
  get(refOrQuery: DocumentReference|
      Query): Promise<DocumentSnapshot|QuerySnapshot> {
    if (!this._writeBatch.isEmpty) {
      throw new Error(READ_AFTER_WRITE_ERROR_MSG);
    }

    if (refOrQuery instanceof DocumentReference) {
      return this._firestore
          .getAll_(
              [refOrQuery], /* fieldMask= */ null, this._requestTag,
              this._transactionId)
          .then(res => {
            return Promise.resolve(res[0]);
          });
    }

    if (refOrQuery instanceof Query) {
      return refOrQuery._get(this._transactionId);
    }

    throw new Error('Argument "refOrQuery" must be a DocumentRef or a Query.');
  }

  /**
   * Retrieves multiple documents from Firestore. Holds a pessimistic lock on
   * all returned documents.
   *
   * @param {DocumentReference} documentRef A `DocumentReference` to receive.
   * @param {Array.<DocumentReference|ReadOptions>} moreDocumentRefsOrReadOptions
   * Additional `DocumentReferences` to receive, followed by an optional field
   * mask.
   * @returns {Promise<Array.<DocumentSnapshot>>} A Promise that
   * contains an array with the resulting document snapshots.
   *
   * @example
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
   */
  getAll(
      documentRef: DocumentReference,
      ...moreDocumentRefsOrReadOptions: Array<DocumentReference|ReadOptions>):
      Promise<DocumentSnapshot[]> {
    if (!this._writeBatch.isEmpty) {
      throw new Error(READ_AFTER_WRITE_ERROR_MSG);
    }

    validateMinNumberOfArguments('Transaction.getAll', arguments, 1);

    const {documents, fieldMask} = parseGetAllArguments(
        this._validator, [documentRef, ...moreDocumentRefsOrReadOptions]);

    return this._firestore.getAll_(
        documents, fieldMask, this._requestTag, this._transactionId);
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
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   return transaction.get(documentRef).then(doc => {
   *     if (!doc.exists) {
   *       transaction.create(documentRef, { foo: 'bar' });
   *     }
   *   });
   * });
   */
  create(documentRef: DocumentReference, data: DocumentData): Transaction {
    this._writeBatch.create(documentRef, data);
    return this;
  }

  /**
   * Writes to the document referred to by the provided
   * [DocumentReference]{@link DocumentReference}. If the document
   * does not exist yet, it will be created. If you pass
   * [SetOptions]{@link SetOptions}, the provided data can be merged into the
   * existing document.
   *
   * @param {DocumentReference} documentRef A reference to the document to be
   * set.
   * @param {DocumentData} data The object to serialize as the document.
   * @param {SetOptions=} options An object to configure the set behavior.
   * @param {boolean=} options.merge - If true, set() merges the values
   * specified in its data argument. Fields omitted from this set() call
   * remain untouched.
   * @param {Array.<string|FieldPath>=} options.mergeFields - If provided,
   * set() only replaces the specified field paths. Any field path that is not
   * specified is ignored and remains untouched.
   * @returns {Transaction} This Transaction instance. Used for
   * chaining method calls.
   *
   * @example
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   transaction.set(documentRef, { foo: 'bar' });
   *   return Promise.resolve();
   * });
   */
  set(documentRef: DocumentReference, data: DocumentData,
      options?: SetOptions): Transaction {
    this._writeBatch.set(documentRef, data, options);
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
   * @returns {Transaction} This Transaction instance. Used for
   * chaining method calls.
   *
   * @example
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
   */
  update(
      documentRef: DocumentReference, dataOrField: UpdateData|string|FieldPath,
      ...preconditionOrValues: Array<Precondition|AnyJs|string|FieldPath>):
      Transaction {
    validateMinNumberOfArguments('Transaction.update', arguments, 2);

    preconditionOrValues = Array.prototype.slice.call(arguments, 2);
    this._writeBatch.update.apply(this._writeBatch, [
      documentRef, dataOrField
    ].concat(preconditionOrValues) as [DocumentReference, string]);
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
   * @returns {Transaction} This Transaction instance. Used for
   * chaining method calls.
   *
   * @example
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   transaction.delete(documentRef);
   *   return Promise.resolve();
   * });
   */
  delete(documentRef: DocumentReference, precondition?: PublicPrecondition):
      this {
    this._writeBatch.delete(documentRef, precondition);
    return this;
  }

  /**
   * Starts a transaction and obtains the transaction id from the server.
   *
   * @private
   */
  begin(): Promise<void> {
    const request = {
      database: this._firestore.formattedName,
    };

    if (this._previousTransaction) {
      // tslint:disable-next-line no-any
      (request as any).options = {
        readWrite: {
          retryTransaction: this._previousTransaction._transactionId,
        },
      };
    }

    return this._firestore
        .request<api.IBeginTransactionResponse>(
            'beginTransaction', request, this._requestTag, ALLOW_RETRIES)
        .then(resp => {
          this._transactionId = resp.transaction!;
        });
  }

  /**
   * Commits all queued-up changes in this transaction and releases all locks.
   *
   * @private
   */
  commit(): Promise<void> {
    return this._writeBatch
        .commit_({
          transactionId: this._transactionId,
          requestTag: this._requestTag,
        })
        .then(() => {});
  }

  /**
   * Releases all locks and rolls back this transaction.
   *
   * @private
   */
  rollback(): Promise<void> {
    const request = {
      database: this._firestore.formattedName,
      transaction: this._transactionId,
    };

    return this._firestore.request(
        'rollback', request, this._requestTag, /* allowRetries= */ false);
  }

  /**
   * Returns the tag to use with with all request for this Transaction.
   * @private
   * @return A unique client-generated identifier for this transaction.
   */
  get requestTag(): string {
    return this._requestTag;
  }
}
