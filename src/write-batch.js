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

const assert = require('assert');
const is = require('is');

/*!
 * Injected.
 *
 * @see DocumentSnapshot
 */
let DocumentSnapshot;

/*!
 * Injected.
 *
 * @see DocumentMask
 */
let DocumentMask;

/*!
 * Injected.
 *
 * @see DocumentTransform
 */
let DocumentTransform;

/*
 * @see FieldPath
 */
const FieldPath = require('./path').FieldPath;

/*!
 * Injected.
 *
 * @see Firestore
 */
let Firestore;

/*!
 * Injected.
 *
 * @see Precondition
 */
let Precondition;

/*! Injected. */
let validate;

/*!
 * Google Cloud Functions terminates idle connections after two minutes. After
 * longer periods of idleness, we issue transactional commits to allow for
 * retries.
 *
 * @type {number}
 */
const GCF_IDLE_TIMEOUT_MS = 110 * 1000;

/**
 * A WriteResult wraps the write time set by the Firestore servers on sets(),
 * updates(), and creates().
 *
 * @class
 */
class WriteResult {
  /**
   * @private
   * @hideconstructor
   *
   * @param {string} writeTime - The ISO 8601 write time.
   */
  constructor(writeTime) {
    this._writeTime = writeTime;
  }

  /**
   * The write time as set by the Firestore servers. Formatted as an ISO-8601
   * string.
   *
   * @type {string}
   * @name WriteResult#writeTime
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({foo: 'bar'}).then(writeResult => {
   *   console.log(`Document written at: ${writeResult.writeTime}`);
   * });
   */
  get writeTime() {
    return this._writeTime;
  }
}

/**
 * A Firestore WriteBatch that can be used to atomically commit multiple write
 * operations at once.
 *
 * @class
 */
class WriteBatch {
  /**
   * @private
   * @hideconstructor
   *
   * @param {Firestore} firestore - The Firestore Database client.
   */
  constructor(firestore) {
    this._firestore = firestore;
    this._api = firestore.api;
    this._writes = [];
  }

  /**
   * Checks if this write batch has any pending operations.
   *
   * @private
   * @returns {boolean}
   */
  get isEmpty() {
    return this._writes.length === 0;
  }

  /**
   * Create a document with the provided object values. This will fail the batch
   * if a document exists at its location.
   *
   * @param {DocumentReference} documentRef - A reference to the
   * document to be created.
   * @param {DocumentData} data - The object to serialize as the document.
   * @returns {WriteBatch} This WriteBatch instance. Used for chaining
   * method calls.
   *
   * @example
   * let writeBatch = firestore.batch();
   * let documentRef = firestore.collection('col').doc();
   *
   * writeBatch.create(documentRef, {foo: 'bar'});
   *
   * writeBatch.commit().then(() => {
   *   console.log('Successfully executed batch.');
   * });
   */
  create(documentRef, data) {
    validate.isDocumentReference('documentRef', documentRef);
    validate.isDocument('data', data);

    let fields = DocumentSnapshot.encodeFields(data);

    let write = {
      update: new DocumentSnapshot(documentRef, fields).toProto(),
      currentDocument: new Precondition({exists: false}).toProto(),
    };

    this._writes.push(write);

    let documentTransform = DocumentTransform.fromObject(documentRef, data);

    if (!documentTransform.isEmpty) {
      this._writes.push({transform: documentTransform.toProto()});
    }

    return this;
  }

  /**
   * Deletes a document from the database.
   *
   * @param {DocumentReference} documentRef - A reference to the
   * document to be deleted.
   * @param {Precondition=} precondition - A precondition to enforce for this
   * delete.
   * @param {string=} precondition.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * batch if the document doesn't exist or was last updated at a different
   * time.
   * @returns {WriteBatch} This WriteBatch instance. Used for chaining
   * method calls.
   *
   * @example
   * let writeBatch = firestore.batch();
   * let documentRef = firestore.doc('col/doc');
   *
   * writeBatch.delete(documentRef);
   *
   * writeBatch.commit().then(() => {
   *   console.log('Successfully executed batch.');
   * });
   */
  delete(documentRef, precondition) {
    validate.isDocumentReference('documentRef', documentRef);
    validate.isOptionalPrecondition('precondition', precondition);

    let write = {
      delete: documentRef.formattedName,
    };

    if (precondition) {
      write.currentDocument = new Precondition(precondition).toProto();
    }

    this._writes.push(write);

    return this;
  }

  /**
   * Write to the document referred to by the provided
   * [DocumentReference]{@link DocumentReference}.
   * If the document does not exist yet, it will be created. If you pass
   * [SetOptions]{@link SetOptions}., the provided data can be merged
   * into the existing document.
   *
   * @param {DocumentReference} documentRef - A reference to the
   * document to be set.
   * @param {DocumentData} data - The object to serialize as the document.
   * @param {SetOptions=} options - An object to configure the set behavior.
   * @param {boolean=} options.merge - If true, set() only replaces the
   * values specified in its data argument. Fields omitted from this set() call
   * remain untouched.
   * @returns {WriteBatch} This WriteBatch instance. Used for chaining
   * method calls.
   *
   * @example
   * let writeBatch = firestore.batch();
   * let documentRef = firestore.doc('col/doc');
   *
   * writeBatch.set(documentRef, {foo: 'bar'});
   *
   * writeBatch.commit().then(() => {
   *   console.log('Successfully executed batch.');
   * });
   */
  set(documentRef, data, options) {
    validate.isDocumentReference('documentRef', documentRef);
    validate.isDocument('data', data);
    validate.isOptionalSetOptions('options', options);

    let fields = DocumentSnapshot.encodeFields(data);

    let write = {
      update: new DocumentSnapshot(documentRef, fields).toProto(),
    };

    if (options && options.merge) {
      write.updateMask = DocumentMask.fromObject(data).toProto();
    }

    this._writes.push(write);

    let documentTransform = DocumentTransform.fromObject(documentRef, data);

    if (!documentTransform.isEmpty) {
      this._writes.push({transform: documentTransform.toProto()});
    }

    return this;
  }

  /**
   * Update fields of the document referred to by the provided
   * [DocumentReference]{@link DocumentReference}. If the document
   * doesn't yet exist, the update fails and the entire batch will be rejected.
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
   * to restrict this update.
   * @returns {WriteBatch} This WriteBatch instance. Used for chaining
   * method calls.
   *
   * @example
   * let writeBatch = firestore.batch();
   * let documentRef = firestore.doc('col/doc');
   *
   * writeBatch.update(documentRef, {foo: 'bar'});
   *
   * writeBatch.commit().then(() => {
   *   console.log('Successfully executed batch.');
   * });
   */
  update(documentRef, dataOrField, preconditionOrValues) {
    validate.isDocumentReference('documentRef', documentRef);

    const updateMap = new Map();
    let precondition = new Precondition({exists: true});

    const argumentError =
      'Update() requires either a single JavaScript ' +
      'object or an alternating list of field/value pairs that can be ' +
      'followed by an optional Precondition';

    let usesVarargs =
      is.string(dataOrField) || is.instance(dataOrField, FieldPath);

    if (usesVarargs) {
      try {
        for (let i = 1; i < arguments.length; i += 2) {
          if (is.string(arguments[i]) || is.instance(arguments[i], FieldPath)) {
            validate.isFieldPath(i, arguments[i]);
            validate.minNumberOfArguments('update', arguments, i + 1);
            updateMap.set(
              FieldPath.fromArgument(arguments[i]),
              arguments[i + 1]
            );
          } else {
            validate.isPrecondition(i, arguments[i]);
            validate.maxNumberOfArguments('update', arguments, i + 1);
            precondition = new Precondition(arguments[i]);
          }
        }
      } catch (err) {
        Firestore.log('WriteBatch.update', 'Varargs validation failed:', err);
        // We catch the validation error here and re-throw to provide a better
        // error message.
        throw new Error(`${argumentError}.`);
      }
    } else {
      try {
        validate.isDocument('dataOrField', dataOrField, true);
        validate.maxNumberOfArguments('update', arguments, 3);

        Object.keys(dataOrField).forEach(key => {
          updateMap.set(FieldPath.fromArgument(key), dataOrField[key]);
        });

        if (is.defined(preconditionOrValues)) {
          validate.isPrecondition('preconditionOrValues', preconditionOrValues);
          precondition = new Precondition(preconditionOrValues);
        }
      } catch (err) {
        Firestore.log(
          'WriteBatch.update',
          'Non-varargs validation failed:',
          err
        );
        // We catch the validation error here and prefix the error with a custom
        // message to describe the usage of update() better.
        throw new Error(`${argumentError}: ${err.message}`);
      }
    }

    let documentMask = DocumentMask.fromMap(updateMap);
    let expandedObject = DocumentSnapshot.expandMap(updateMap);
    let document = new DocumentSnapshot(
      documentRef,
      DocumentSnapshot.encodeFields(expandedObject)
    );

    let write = {
      update: document.toProto(),
      updateMask: documentMask.toProto(),
      currentDocument: precondition.toProto(),
    };

    this._writes.push(write);

    let documentTransform = DocumentTransform.fromObject(
      documentRef,
      expandedObject
    );

    if (!documentTransform.isEmpty) {
      this._writes.push({transform: documentTransform.toProto()});
    }

    return this;
  }

  /**
   * Atomically commits all pending operations to the database and verifies all
   * preconditions. Fails the entire write if any precondition is not met.
   *
   * @returns {Promise.<Array.<WriteResult>>} A Promise that resolves
   * when this batch completes.
   *
   * @example
   * let writeBatch = firestore.batch();
   * let documentRef = firestore.doc('col/doc');
   *
   * writeBatch.set(documentRef, {foo: 'bar'});
   *
   * writeBatch.commit().then(() => {
   *   console.log('Successfully executed batch.');
   * });
   */
  commit() {
    return this.commit_();
  }

  /**
   * Commit method that takes an optional transaction ID.
   *
   * @private
   * @param {object=} commitOptions Options to use for this commit.
   * @param {bytes=} commitOptions.transactionId The transaction ID of this
   * commit.
   * @returns {Promise.<Array.<WriteResult>>} A Promise that resolves
   * when this batch completes.
   */
  commit_(commitOptions) {
    let explicitTransaction = commitOptions && commitOptions.transactionId;

    let request = {
      database: this._firestore.formattedName,
    };

    // On GCF, we periodically force transactional commits to allow for
    // request retries in case GCF closes our backend connection.
    if (!explicitTransaction && this._shouldCreateTransaction()) {
      Firestore.log('WriteBatch.commit', 'Using transaction for commit');
      return this._firestore
        .request(
          this._api.Firestore.beginTransaction.bind(this._api.Firestore),
          request,
          /* allowRetries= */ true
        )
        .then(resp => {
          return this.commit_({transactionId: resp.transaction});
        });
    }

    // We create our own copy of this array since we need to access it when
    // processing the response.
    let writeRequests = this._writes.slice();

    request.writes = writeRequests;

    Firestore.log(
      'WriteBatch.commit',
      'Sending %d writes',
      writeRequests.length
    );

    if (explicitTransaction) {
      request.transaction = explicitTransaction;
    }

    return this._firestore
      .request(this._api.Firestore.commit.bind(this._api.Firestore), request)
      .then(resp => {
        const commitTime = DocumentSnapshot.toISOTime(resp.commitTime);
        const writeResults = [];

        if (resp.writeResults) {
          assert(
            writeRequests.length === resp.writeResults.length,
            `Expected one write result per operation, but got ${resp
              .writeResults
              .length} results for ${writeRequests.length} operations.`
          );

          for (let i = 0; i < resp.writeResults.length; ++i) {
            let writeRequest = writeRequests[i];
            let writeResult = resp.writeResults[i];

            // Don't return write results for document transforms, as the fact
            // that we have to split one write operation into two distinct
            // write requests is an implementation detail.
            if (writeRequest.update || writeRequest.delete) {
              writeResults.push(
                new WriteResult(
                  DocumentSnapshot.toISOTime(writeResult.updateTime) ||
                    commitTime
                )
              );
            }
          }
        }

        return writeResults;
      });
  }

  /**
   * Determines whether we should issue a transactional commit. On GCF, this
   * happens after two minutes of idleness.
   *
   * @private
   * @returns {boolean} Whether to use a transaction.
   */
  _shouldCreateTransaction() {
    if (!this._firestore._preferTransactions) {
      return false;
    }

    if (this._firestore._lastSuccessfulRequest) {
      let now = new Date().getTime();
      return now - this._firestore._lastSuccessfulRequest > GCF_IDLE_TIMEOUT_MS;
    }

    return true;
  }
}

module.exports = (
  FirestoreType,
  DocumentReferenceType,
  validateDocumentReference
) => {
  let document = require('./document')(DocumentReferenceType);
  Firestore = FirestoreType;
  DocumentMask = document.DocumentMask;
  DocumentSnapshot = document.DocumentSnapshot;
  DocumentTransform = document.DocumentTransform;
  Precondition = document.Precondition;
  validate = require('./validate')({
    Document: document.validateDocumentData,
    DocumentReference: validateDocumentReference,
    FieldPath: FieldPath.validateFieldPath,
    Precondition: document.validatePrecondition,
    SetOptions: document.validateSetOptions,
  });
  return {
    WriteBatch,
    WriteResult,
  };
};
