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

import assert from 'assert';
import is from 'is';

import {logger} from './logger';
import {documentPkg} from './document';
import {validatePkg} from './validate';
import {FieldPath} from './path';
import {Timestamp} from './timestamp';

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

/*!
 * @see FieldPath
 */

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
   * @param {Timestamp} writeTime - The time of the corresponding document
   * write.
   */
  constructor(writeTime) {
    this._writeTime = writeTime;
  }

  /**
   * The write time as set by the Firestore servers.
   *
   * @type {Timestamp}
   * @name WriteResult#writeTime
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({foo: 'bar'}).then(writeResult => {
   *   console.log(`Document written at: ${writeResult.toDate()}`);
   * });
   */
  get writeTime() {
    return this._writeTime;
  }

  /**
   * Returns true if this `WriteResult` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return true if this `WriteResult` is equal to the provided value.
   */
  isEqual(other) {
    return (
        this === other ||
        (is.instanceof(other, WriteResult) &&
         this._writeTime.isEqual(other._writeTime)));
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
    validate.isDocument('data', data, {
      allowEmpty: true,
      allowDeletes: 'none',
      allowTransforms: true,
    });

    this.verifyNotCommitted();

    const document = DocumentSnapshot.fromObject(documentRef, data);
    const transform = DocumentTransform.fromObject(documentRef, data);
    const precondition = new Precondition({exists: false});

    this._writes.push({
      write: !document.isEmpty || transform.isEmpty ? document.toProto() : null,
      transform: transform.toProto(),
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
   * @param {Timestamp=} precondition.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime. Fails the batch if the
   * document doesn't exist or was last updated at a different time.
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
      precondition: conditions.toProto(),
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
   * @param {boolean=} options.merge - If true, set() merges the values
   * specified in its data argument. Fields omitted from this set() call
   * remain untouched.
   * @param {Array.<string|FieldPath>=} options.mergeFields - If provided,
   * set() only replaces the specified field paths. Any field path that is not
   * specified is ignored and remains untouched.
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
    validate.isOptionalSetOptions('options', options);
    const mergeLeaves = options && options.merge === true;
    const mergePaths = options && options.mergeFields;

    validate.isDocumentReference('documentRef', documentRef);
    validate.isDocument('data', data, {
      allowEmpty: true,
      allowDeletes: mergePaths || mergeLeaves ? 'all' : 'none',
      allowTransforms: true,
    });

    this.verifyNotCommitted();

    let documentMask;

    if (mergePaths) {
      documentMask = DocumentMask.fromFieldMask(options.mergeFields);
      data = documentMask.applyTo(data);
    }

    const document = DocumentSnapshot.fromObject(documentRef, data);
    const transform = DocumentTransform.fromObject(documentRef, data);

    if (mergePaths) {
      documentMask.removeFields(transform.fields);
    } else {
      documentMask = DocumentMask.fromObject(data);
    }

    const hasDocumentData = !document.isEmpty || !documentMask.isEmpty;

    let write;

    if (!mergePaths && !mergeLeaves) {
      write = document.toProto();
    } else if (hasDocumentData || transform.isEmpty) {
      write = document.toProto();
      write.updateMask = documentMask.toProto();
    }

    this._writes.push({
      write,
      transform: transform.toProto(),
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

    const argumentError = 'Update() requires either a single JavaScript ' +
        'object or an alternating list of field/value pairs that can be ' +
        'followed by an optional precondition.';

    let usesVarargs = is.string(
                          dataOrField) || is.instance(dataOrField, FieldPath);

    if (usesVarargs) {
      try {
        for (let i = 1; i < arguments.length; i += 2) {
          if (i === arguments.length - 1) {
            validate.isUpdatePrecondition(i, arguments[i]);
            precondition = new Precondition(arguments[i]);
          } else {
            validate.isFieldPath(i, arguments[i]);
            validate.minNumberOfArguments('update', arguments, i + 1);
            validate.isFieldValue(i, arguments[i + 1], {
              allowDeletes: 'root',
              allowTransforms: true,
            });
            updateMap.set(
                FieldPath.fromArgument(arguments[i]), arguments[i + 1]);
          }
        }
      } catch (err) {
        logger('WriteBatch.update', null, 'Varargs validation failed:', err);
        // We catch the validation error here and re-throw to provide a better
        // error message.
        throw new Error(`${argumentError} ${err.message}`);
      }
    } else {
      try {
        validate.isDocument('dataOrField', dataOrField, {
          allowEmpty: false,
          allowDeletes: 'root',
          allowTransforms: true,
        });
        validate.maxNumberOfArguments('update', arguments, 3);

        Object.keys(dataOrField).forEach(key => {
          validate.isFieldPath(key, key);
          updateMap.set(FieldPath.fromArgument(key), dataOrField[key]);
        });

        if (is.defined(preconditionOrValues)) {
          validate.isUpdatePrecondition(
              'preconditionOrValues', preconditionOrValues);
          precondition = new Precondition(preconditionOrValues);
        }
      } catch (err) {
        logger(
            'WriteBatch.update', null, 'Non-varargs validation failed:', err);
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
      transform: transform.toProto(),
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
   * @param {string=} commitOptions.requestTag A unique client-assigned
   * identifier for this request.
   * @returns {Promise.<Array.<WriteResult>>} A Promise that resolves
   * when this batch completes.
   */
  commit_(commitOptions) {
    // Note: We don't call `verifyNotCommitted()` to allow for retries.

    let explicitTransaction = commitOptions && commitOptions.transactionId;

    let requestTag =
        (commitOptions && commitOptions.requestTag) || Firestore.requestTag();
    let request = {
      database: this._firestore.formattedName,
    };

    // On GCF, we periodically force transactional commits to allow for
    // request retries in case GCF closes our backend connection.
    if (!explicitTransaction && this._shouldCreateTransaction()) {
      logger('WriteBatch.commit', requestTag, 'Using transaction for commit');
      return this._firestore
          .request('beginTransaction', request, requestTag, true)
          .then(resp => {
            return this.commit_({transactionId: resp.transaction});
          });
    }

    request.writes = [];

    for (let req of this._writes) {
      assert(
          req.write || req.transform,
          'Either a write or transform must be set');

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

    logger(
        'WriteBatch.commit', requestTag, 'Sending %d writes',
        request.writes.length);

    if (explicitTransaction) {
      request.transaction = explicitTransaction;
    }

    this._committed = true;

    return this._firestore.request('commit', request, requestTag).then(resp => {
      const writeResults = [];

      if (request.writes.length > 0) {
        assert(
            resp.writeResults instanceof Array &&
                request.writes.length === resp.writeResults.length,
            `Expected one write result per operation, but got ${
                resp.writeResults.length} results for ${
                request.writes.length} operations.`);

        const commitTime = Timestamp.fromProto(resp.commitTime);

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

          writeResults.push(new WriteResult(
              writeResult.updateTime ?
                  Timestamp.fromProto(writeResult.updateTime) :
                  commitTime));
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
      throw new Error(`Field "${fields[i - 1]}" was specified multiple times.`);
    }
  }

  return true;
}

export function writeBatchPkg(
    FirestoreType, DocumentReferenceType, validateDocumentReference) {
  let document = documentPkg(DocumentReferenceType);
  Firestore = FirestoreType;
  DocumentMask = document.DocumentMask;
  DocumentSnapshot = document.DocumentSnapshot;
  DocumentTransform = document.DocumentTransform;
  Precondition = document.Precondition;
  validate = validatePkg({
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
}
