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

'use strict';

const is = require('is');

const validate = require('./validate')();

/*!
 * Injected.
 *
 * @see DocumentReference
 */
let DocumentReference;

/*!
 * Injected.
 *
 * @see Query
 */
let Query;

/**
 * A reference to a transaction.
 *
 * The Transaction object passed to a transaction's updateFunction provides
 * the methods to read and write data within the transaction context. See
 * [runTransaction()]{@link Firestore#runTransaction}.
 *
 * @class
 */
class Transaction {
  /**
   * @private
   * @hideconstructor
   *
   * @param {Firestore} firestore - The Firestore Database client.
   * @param {Transaction=} previousTransaction - If
   * available, the failed transaction that is being retried.
   */
  constructor(firestore, previousTransaction) {
    this._firestore = firestore;
    this._api = firestore.api;
    this._previousTransaction = previousTransaction;
    this._writeBatch = firestore.batch();
  }

  /**
   * Retrieve a document or a query result from the database. Holds a
   * pessimistic lock on all returned documents.
   *
   * @param {DocumentReference|Query} refOrQuery - The
   * document or query to return.
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
  get(refOrQuery) {
    if (!this._writeBatch.isEmpty) {
      throw new Error(
        'Firestore transactions require all reads to be ' +
          'executed before all writes.'
      );
    }

    if (is.instance(refOrQuery, DocumentReference)) {
      return this._firestore
        .getAll_([refOrQuery], {transactionId: this._transactionId})
        .then(res => {
          return Promise.resolve(res[0]);
        });
    }

    if (is.instance(refOrQuery, Query)) {
      return refOrQuery._get({transactionId: this._transactionId});
    }

    throw new Error('Argument "refOrQuery" must be a DocumentRef or a Query.');
  }

  /**
   * Create the document referred to by the provided
   * [DocumentReference]{@link DocumentReference}. The operation will
   * fail the transaction if a document exists at the specified location.
   *
   * @param {DocumentReference} documentRef - A reference to the
   * document to be created.
   * @param {DocumentData} data - The object data to serialize as the document.
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
  create(documentRef, data) {
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
   * @param {DocumentReference} documentRef - A reference to the
   * document to be set.
   * @param {DocumentData} data - The object to serialize as the document.
   * @param {SetOptions=} options - An object to configure the set behavior.
   * @param {boolean=} options.merge - If true, set() only replaces the
   * values specified in its data argument. Fields omitted from this set() call
   * remain untouched.
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
  set(documentRef, data, options) {
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
   * @param {DocumentReference} documentRef - A reference to the
   * document to be updated.
   * @param {UpdateData|string|FieldPath} dataOrField - An object
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
  update(documentRef, dataOrField, preconditionOrValues) {
    validate.minNumberOfArguments('update', arguments, 2);

    preconditionOrValues = Array.prototype.slice.call(arguments, 2);
    this._writeBatch.update.apply(
      this._writeBatch,
      [documentRef, dataOrField].concat(preconditionOrValues)
    );
    return this;
  }

  /**
   * Deletes the document referred to by the provided [DocumentReference]
   * {@link DocumentReference}.
   *
   * @param {DocumentReference} documentRef - A reference to the
   * document to be deleted.
   * @param {Precondition=} precondition - A precondition to enforce for this
   * delete.
   * @param {string=} precondition.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * transaction if the document doesn't exist or was last updated at a
   * different time.
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
  delete(documentRef, precondition) {
    this._writeBatch.delete(documentRef, precondition);
    return this;
  }

  /**
   * Starts a transaction and obtains the transaction id from the server.
   *
   * @private
   * @returns {Promise} An empty Promise.
   */
  begin() {
    let request = {
      database: this._firestore.formattedName,
    };

    if (this._previousTransaction) {
      request.options = {
        readWrite: {
          retryTransaction: this._previousTransaction._transactionId,
        },
      };
    }

    return this._firestore
      .request(
        this._api.Firestore.beginTransaction.bind(this._api.Firestore),
        request,
        /* allowRetries= */ true
      )
      .then(resp => {
        this._transactionId = resp.transaction;
      });
  }

  /**
   * Commits all queued-up changes in this transaction and releases all locks.
   *
   * @private
   * @returns {Promise} An empty Promise.
   */
  commit() {
    return this._writeBatch.commit_({transactionId: this._transactionId});
  }

  /**
   * Releases all locks and rolls back this transaction.
   *
   * @private
   * @returns {Promise} An empty Promise.
   */
  rollback() {
    let request = {
      database: this._firestore.formattedName,
      transaction: this._transactionId,
    };

    return this._firestore.request(
      this._api.Firestore.rollback.bind(this._api.Firestore),
      request
    );
  }
}

module.exports = FirestoreType => {
  let reference = require('./reference')(FirestoreType);
  DocumentReference = reference.DocumentReference;
  Query = reference.Query;
  let document = require('./document')(DocumentReference);
  require('./validate')({
    Document: document.validateDocumentData,
    DocumentReference: reference.validateDocumentReference,
    Precondition: document.validatePrecondition,
  });
  return Transaction;
};
