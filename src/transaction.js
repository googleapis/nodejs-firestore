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

/*!
 * @module firestore/transaction
 */

'use strict';

let is = require('is');

/**
 * Injected.
 *
 * @private
 * @type firestore.DocumentReference
 */
let DocumentReference;

/**
 * Injected.
 *
 * @private
 * @type firestore.Query
 */
let Query;

/**
 * Injected.
 *
 * @private
 */
let validate;


/**
 *
 * The Transaction object passed to a transaction's updateFunction provides
 * the methods to read and write data within the transaction context. See
 * [runTransaction()]{@link firestore.Firestore#runTransaction}.
 *
 * @public
 * @alias firestore.Transaction
 */
class Transaction {
  /**
   * @package
   * @hideconstructor
   *
   * @param {firestore.Firestore} firestore - The Firestore Database client.
   * @param {firestore.Transaction=} previousTransaction - If
   * available, the failed transaction that is being retried.
   */
  constructor(firestore, previousTransaction) {
    this._firestore = firestore;
    this._api = firestore.api;
    this._previousTransaction = previousTransaction;
    this._writeBatch = firestore.batch();
  }

  /**
   * The Firestore instance for the Firestore database.
   *
   * @public
   * @type firestore.Firestore
   * @name firestore.Transaction#firestore
   * @readonly
   *
   * @example
   * firestore.runTransaction(transaction => {
   *   let client = transaction.firestore;
   *   console.log(`Root reference is: ${client.formattedName}`);
   *   return Promise.resolve();
   * });
   */
  get firestore() {
    return this._firestore;
  }

  /**
   * Retrieve a document or a query result from the database. Holds a
   * pessimistic lock on all returned documents.
   *
   * @public
   * @param {firestore.DocumentReference|firestore.Query} refOrQuery
   * - The document or query to return.
   * @return {Promise} A Promise that resolves with a DocumentSnapshot or
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
      throw new Error('Firestore transactions require all reads to be ' +
          'executed before all writes.');
    }

    if (is.instance(refOrQuery, DocumentReference)) {
      return this.firestore.getAll_(
          [refOrQuery], { transactionId: this._transactionId }).then((res) => {
            return Promise.resolve(res[0]);
          });
    }

    if (is.instance(refOrQuery, Query)) {
      return refOrQuery._get({ transactionId: this._transactionId});
    }

    throw new Error('Argument "refOrQuery" must be a DocumentRef or a Query.');
  }

  /**
   * Create a document with the provided object values. This will fail the
   * transaction if a document exists at its location.
   *
   * @public
   * @param {firestore.DocumentReference} documentRef - The location of the
   * document to create.
   * @param {object.<string, *>} data - The object data to serialize as the
   * document.
   * @return {firestore.Transaction} The Transaction instance for chaining.
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
    validate.isDocumentReference('documentRef', documentRef);
    validate.isDocument('data', data);

    this._writeBatch.create(documentRef, data);
    return this;
  }

  /**
   * Overwrites the document referred to by this DocumentReference. If no
   * document exists yet, it will be created. If a document already exists, it
   * will be overwritten
   *
   * @public
   * @param {firestore.DocumentReference} documentRef The location of the
   * document to set.
   * @param {object<string, *>} data - The object data to serialize as the
   * document.
   * @param {object=} writeOptions - The preconditions for this set.
   * @param {boolean=} writeOptions.createIfMissing Whether the document should
   * be created if it doesn't yet exists. Defaults to true.
   * @param {string=} writeOptions.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * transaction if the document doesn't exist or was last updated at a
   * different time.
   * @return {firestore.Transaction} The Transaction instance for chaining.
   *
   * @example
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   transaction.set(documentRef, { foo: 'bar' });
   *   return Promise.resolve();
   * });
   */
  set(documentRef, data, writeOptions) {
    validate.isDocumentReference('documentRef', documentRef);
    validate.isDocument('data', data);
    validate.isOptionalPrecondition('writeOptions', writeOptions);

    this._writeBatch.set(documentRef, data, writeOptions);
    return this;
  }

  /**
   * Update the fields of an existing document.
   *
   * Replaces the specified fields of an existing document with a new
   * collection of field values.
   *
   * @public
   * @param {firestore.DocumentReference} documentRef The location of the
   * document to update.
   * @param {object<string, *>} data - A collection of fields to modify in a
   * document.
   * @param {object=} updateOptions - The preconditions for this update.
   * @param {boolean=} updateOptions.createIfMissing Whether the document should
   * be created if it doesn't yet exists. Defaults to false.
   * @param {string=} updateOptions.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * transaction if the document doesn't exist or was last updated at a
   * different time.
   * @return {firestore.Transaction} The Transaction instance for chaining.
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
  update(documentRef, data, updateOptions) {
    validate.isDocumentReference('documentRef', documentRef);
    validate.isDocument('data', data, true);
    validate.isOptionalPrecondition('updateOptions', updateOptions);

    this._writeBatch.update(documentRef, data, updateOptions);
    return this;
  }

  /**
   * Deletes the document referred to by the provided `DocumentReference`.
   *
   * @public
   * @param {firestore.DocumentReference} documentRef - A reference to
   * the document to be deleted.
   * @param {object=} deleteOptions - The preconditions for this delete.
   * @param {string=} deleteOptions.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * transaction if the document doesn't exist or was last updated at a
   * different time.
   * @return {firestore.Transaction} The Transaction instance for chaining.
   *
   * @example
   * firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   transaction.delete(documentRef);
   *   return Promise.resolve();
   * });
   */
  delete(documentRef, deleteOptions) {
    validate.isDocumentReference('documentRef', documentRef);
    validate.isOptionalPrecondition('deleteOptions', deleteOptions);

    this._writeBatch.delete(documentRef, deleteOptions);
    return this;
  }

  /**
   * Starts a transaction and obtains the transaction id from the server.
   *
   * @package
   * @return {Promise} An empty Promise.
   */
  begin() {
    let request = {
      database: this.firestore.formattedName,
    };

    if (this._previousTransaction) {
      request.options = {
        readWrite: {
          retryTransaction: this._previousTransaction._transactionId
        }
      };
    }

    return this.firestore.request(
        this._api.Firestore.beginTransaction.bind(this._api.Firestore),
        request
    ).then((resp) => {
      this._transactionId = resp.transaction;
    });
  }

  /**
   * Commits all queued-up changes in this transaction and releases all locks.
   *
   * @package
   * @return {Promise} An empty Promise.
   */
  commit() {
    return this._writeBatch.commit({ transactionId: this._transactionId });
  }

  /**
   * Releases all locks and rolls back this transaction.
   *
   * @package
   * @return {Promise} An empty Promise.
   */
  rollback() {
    let request = {
      database: this.firestore.formattedName,
      transaction: this._transactionId
    };

    return this.firestore.request(
        this._api.Firestore.rollback.bind(this._api.Firestore),
        request
    );
  }
}


module.exports = (FirestoreType) => {
  let reference = require('./reference')(FirestoreType);
  DocumentReference = reference.DocumentReference;
  Query = reference.Query;
  let document = require('./document.js')(
      FirestoreType, DocumentReference
  );
  validate = require('./validate.js')({
    Document: document.validateDocumentData,
    DocumentReference: reference.validateDocumentReference,
    Precondition: document.validatePrecondition
  });
  return Transaction;
};
