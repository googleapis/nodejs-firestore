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
    this._committed = false;
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
   * Throws an error if this batch has already been committed.
   *
   * @private
   */
  verifyNotCommitted() {
    if (this._committed) {
      throw new Error('Cannot modify a WriteBatch that has been committed.');
    }
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

    this.verifyNotCommitted();

    const document = DocumentSnapshot.fromObject(documentRef, data);
    const transform = DocumentTransform.fromObject(documentRef, data);
    const precondition = new Precondition({exists: false});

    this._writes.push({
      write: !document.isEmpty || transform.isEmpty ? document.toProto() : null,
      transform: transform.isEmpty ? null : transform.toProto(),
      precondition: precondition.toProto(),
    });

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
    validate.isOptionalDeletePrecondition('precondition', precondition);

    this.verifyNotCommitted();

    const conditions = new Precondition(precondition);

    this._writes.push({
      write: {
        delete: documentRef.formattedName,
      },
      precondition: conditions.isEmpty ? null : conditions.toProto(),
    });

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
    const merge = options && options.merge;

    validate.isDocumentReference('documentRef', documentRef);
    validate.isDocument('data', data, {
      allowNestedDeletes: merge,
      allowEmpty: !merge,
    });
    validate.isOptionalSetOptions('options', options);

    this.verifyNotCommitted();

    const document = DocumentSnapshot.fromObject(documentRef, data);
    const transform = DocumentTransform.fromObject(documentRef, data);
    const documentMask = DocumentMask.fromObject(data);

    let write;

    if (!merge) {
      write = document.toProto();
    } else if (!document.isEmpty || !documentMask.isEmpty) {
      write = document.toProto();
      write.updateMask = documentMask.toProto();
    }

    this._writes.push({
      write,
      transform: transform.isEmpty ? null : transform.toProto(),
    });

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
    validate.minNumberOfArguments('update', arguments, 2);
    validate.isDocumentReference('documentRef', documentRef);

    this.verifyNotCommitted();

    const updateMap = new Map();
    let precondition = new Precondition({exists: true});

    const argumentError =
      'Update() requires either a single JavaScript ' +
      'object or an alternating list of field/value pairs that can be ' +
      'followed by an optional precondition.';

    let usesVarargs =
      is.string(dataOrField) || is.instance(dataOrField, FieldPath);

    if (usesVarargs) {
      try {
        for (let i = 1; i < arguments.length; i += 2) {
          if (is.string(arguments[i]) || is.instance(arguments[i], FieldPath)) {
            validate.isFieldPath(i, arguments[i]);
            validate.minNumberOfArguments('update', arguments, i + 1);
            validate.isFieldValue(i, arguments[i + 1], {
              allowDeletes: true,
            });
            updateMap.set(
              FieldPath.fromArgument(arguments[i]),
              arguments[i + 1]
            );
          } else {
            validate.isUpdatePrecondition(i, arguments[i]);
            validate.maxNumberOfArguments('update', arguments, i + 1);
            precondition = new Precondition(arguments[i]);
          }
        }
      } catch (err) {
        Firestore.log('WriteBatch.update', 'Varargs validation failed:', err);
        // We catch the validation error here and re-throw to provide a better
        // error message.
        throw new Error(`${argumentError} ${err.message}`);
      }
    } else {
      try {
        validate.isDocument('dataOrField', dataOrField, {
          allowDeletes: true,
          allowEmpty: false,
        });
        validate.maxNumberOfArguments('update', arguments, 3);

        Object.keys(dataOrField).forEach(key => {
          validate.isFieldPath(key, key);
          validate.isFieldValue(key, dataOrField[key], {
            allowDeletes: true,
          });
          updateMap.set(FieldPath.fromArgument(key), dataOrField[key]);
        });

        if (is.defined(preconditionOrValues)) {
          validate.isUpdatePrecondition(
            'preconditionOrValues',
            preconditionOrValues
          );
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
        throw new Error(`${argumentError} ${err.message}`);
      }
    }

    validate.isUpdateMap('dataOrField', updateMap);

    let document = DocumentSnapshot.fromUpdateMap(documentRef, updateMap);
    let documentMask = DocumentMask.fromUpdateMap(updateMap);

    let write = null;

    if (!document.isEmpty || !documentMask.isEmpty) {
      write = document.toProto();
      write.updateMask = documentMask.toProto();
    }

    let transform = DocumentTransform.fromUpdateMap(documentRef, updateMap);

    this._writes.push({
      write: write,
      transform: transform.isEmpty ? null : transform.toProto(),
      precondition: precondition.toProto(),
    });

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
    // Note: We don't call `verifyNotCommitted()` to allow for retries.

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

    request.writes = [];

    for (let req of this._writes) {
      assert(
        req.write || req.transform,
        'Either a write or transform must be set'
      );

      if (req.precondition) {
        (req.write || req.transform).currentDocument = req.precondition;
      }

      if (req.write) {
        request.writes.push(req.write);
      }

      if (req.transform) {
        request.writes.push(req.transform);
      }
    }

    Firestore.log(
      'WriteBatch.commit',
      'Sending %d writes',
      request.writes.length
    );

    if (explicitTransaction) {
      request.transaction = explicitTransaction;
    }

    this._committed = true;

    return this._firestore
      .request(this._api.Firestore.commit.bind(this._api.Firestore), request)
      .then(resp => {
        const commitTime = DocumentSnapshot.toISOTime(resp.commitTime);
        const writeResults = [];

        if (resp.writeResults) {
          assert(
            request.writes.length === resp.writeResults.length,
            `Expected one write result per operation, but got ${
              resp.writeResults.length
            } results for ${request.writes.length} operations.`
          );

          let offset = 0;

          for (let i = 0; i < this._writes.length; ++i) {
            let writeRequest = this._writes[i];

            // Don't return two write results for a write that contains a
            // transform, as the fact that we have to split one write operation
            // into two distinct write requests is an implementation detail.
            if (writeRequest.write && writeRequest.transform) {
              // The document transform is always sent last and produces the
              // latest update time.
              ++offset;
            }

            let writeResult = resp.writeResults[i + offset];

            writeResults.push(
              new WriteResult(
                DocumentSnapshot.toISOTime(writeResult.updateTime) || commitTime
              )
            );
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

/*!
 * Validates that the update data does not contain any ambiguous field
 * definitions (such as 'a.b' and 'a').
 *
 * @param {Map.<FieldPath, *>} data - An update map with field/value pairs.
 * @returns {boolean} 'true' if the input is a valid update map.
 */
function validateUpdateMap(data) {
  const fields = [];
  data.forEach((value, key) => {
    fields.push(key);
  });

  fields.sort((left, right) => left.compareTo(right));

  for (let i = 1; i < fields.length; ++i) {
    if (fields[i - 1].isPrefixOf(fields[i])) {
      throw new Error(`Field "${fields[i - 1]}" has conflicting definitions.`);
    }
  }

  return true;
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
    FieldValue: document.validateFieldValue,
    FieldPath: FieldPath.validateFieldPath,
    UpdatePrecondition: precondition =>
      document.validatePrecondition(precondition, /* allowExists= */ false),
    DeletePrecondition: precondition =>
      document.validatePrecondition(precondition, /* allowExists= */ true),
    SetOptions: document.validateSetOptions,
    UpdateMap: validateUpdateMap,
  });
  return {
    WriteBatch,
    WriteResult,
  };
};
