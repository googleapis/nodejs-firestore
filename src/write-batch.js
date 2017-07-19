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
 * @module firestore/writebatch
 */

'use strict';

/**
 * Injected.
 *
 * @private
 * @type firestore.DocumentSnapshot
 */
let DocumentSnapshot;

/**
 * Injected.
 *
 * @private
 * @type firestore.DocumentMask
 */
let DocumentMask;

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
 * @type firestore.DocumentTransform
 */
let DocumentTransform;

/**
 * Injected.
 *
 * @private
 * @type firestore.Precondition
 */
let Precondition;

/**
 * Injected.
 *
 * @private
 */
let validate;

/**
 * A WriteResult wraps the write time set by the Firestore servers on sets(),
 * updates(), and creates().
 *
 * @public
 * @alias firestore.WriteResult
 */
class WriteResult {
  /**
   * @package
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
   * @public
   * @type string
   * @name firestore.WriteResult#writeTime
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
 * @public
 * @alias firestore.WriteBatch
 * @hideconstructor
 *
 */
class WriteBatch {
  /**
   * @package
   * @hideconstructor
   *
   * @param {firestore.Firestore} firestore - The Firestore Database client.
   */
  constructor(firestore) {
    this._firestore = firestore;
    this._api = firestore.api;
    this._writes = [];
  }

  /**
   * The Firestore instance for the Firestore database (useful for performing
   * transactions, etc.).
   *
   * @public
   * @type firestore.Firestore
   * @name firestore.WriteBatch#firestore
   * @readonly
   *
   * @example
   * let writeBatch = firestore.batch();
   *
   * let client = writeBatch.firestore;
   * console.log(`Root location for document is ${client.formattedName}`);
   */
  get firestore() {
    return this._firestore;
  }

  /**
   * Checks if this write batch has any pending operations.
   *
   * @return {boolean}
   * @package
   */
  get isEmpty() {
    return this._writes.length === 0;
  }

  /**
   * Create a document with the provided object values. This will fail the batch
   * if a document exists at its location.
   *
   * @public
   * @param {firestore.DocumentReference} docRef The location of the
   *   document.
   * @param {Object} data - The object to serialize as the document.
   * @return {firestore.WriteBatch} The WriteBatch instance for chaining.
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
  create(docRef, data) {
    validate.isDocumentReference('docRef', docRef);
    validate.isDocument('data', data);

    let document = new DocumentSnapshot(docRef,
        DocumentSnapshot.encodeFields(data));
    let precondition = new Precondition({ exists: false });

    let write = {
      update: document.toProto(),
      currentDocument: precondition.toProto()
    };

    this._writes.push(write);

    return this;
  }

  /**
   * Deletes a document from the database.
   *
   * @public
   * @param {firestore.DocumentReference} docRef The location of the
   *   document.
   * @param {object=} deleteOptions - The preconditions for this delete.
   * @param {string=} deleteOptions.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * batch if the document doesn't exist or was last updated at a different
   * time.
   * @return {firestore.WriteBatch} The WriteBatch instance for chaining.
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
  delete(docRef, deleteOptions) {
    validate.isDocumentReference('docRef', docRef);
    validate.isOptionalPrecondition('deleteOptions', deleteOptions);

    let write = {
      delete: docRef.formattedName,
    };

    if (deleteOptions) {
      write.currentDocument = new Precondition({
        lastUpdateTime: deleteOptions.lastUpdateTime
      }).toProto();
    }

    this._writes.push(write);

    return this;
  }

  /**
   * Write a document with the provided object values. By default, this will
   * create or overwrite existing documents.
   *
   * @public
   * @param {firestore.DocumentReference} docRef The location of the
   *   document.
   * @param {Object} data - The object to serialize as the document.
   * @param {object=} writeOptions - The preconditions for this set.
   * @param {boolean=} writeOptions.createIfMissing Whether the document should
   * be created if it doesn't yet exist. Defaults to true.
   * @param {string=} writeOptions.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * batch if the document doesn't exist or was last updated at a different
   * time.
   * @return {firestore.WriteBatch} The WriteBatch instance for chaining.
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
  set(docRef, data, writeOptions) {
    validate.isDocumentReference('docRef', docRef);
    validate.isDocument('data', data);
    validate.isOptionalPrecondition('writeOptions', writeOptions);

    let fields = DocumentSnapshot.encodeFields(data);

    let write = {
      update: new DocumentSnapshot(docRef, fields).toProto()
    };

    if (writeOptions) {
      let options = {};

      if (writeOptions.lastUpdateTime) {
        options.lastUpdateTime = writeOptions.lastUpdateTime;
      }

      if (writeOptions.createIfMissing === false) {
        options.exists = true;
      }

      write.currentDocument = new Precondition(options).toProto();
    }

    this._writes.push(write);

    let documentTransform = DocumentTransform.fromObject(docRef, data);

    if (!documentTransform.isEmpty) {
      this._writes.push({transform: documentTransform.toProto()});
    }

    return this;
  }

  /**
   * Update the fields of an existing document.
   *
   * Replaces the specified fields of an existing document with a new
   * collection of field values.
   *
   * @public
   * @param {firestore.DocumentReference} docRef The location of the
   *   document.
   * @param {object<string, *>} data A collection of fields to modify in a
   * document.
   * @param {object=} updateOptions - The preconditions for this update.
   * @param {boolean=} updateOptions.createIfMissing Whether the should be
   * created if it doesn't yet exist. Defaults to false.
   * @param {string=} updateOptions.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * batch if the document doesn't exist or was last updated at a different
   * time.
   * @return {firestore.WriteBatch} The WriteBatch instance for chaining.
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
  update(docRef, data, updateOptions) {
    validate.isDocumentReference('docRef', docRef);
    validate.isDocument('data', data, true);
    validate.isOptionalPrecondition('updateOptions', updateOptions);

    let documentMask = DocumentMask.fromObject(data);
    let expandedObject = DocumentSnapshot.expandObject(data);
    let document = new DocumentSnapshot(docRef,
        DocumentSnapshot.encodeFields(expandedObject));
    let precondition;

    if (updateOptions) {
      let options = {};

      if (updateOptions.lastUpdateTime) {
        options.lastUpdateTime =  updateOptions.lastUpdateTime;
      }

      if (updateOptions.createIfMissing !== true) {
        options.exists = true;
      }

      precondition = new Precondition(options);
    } else {
      precondition = new Precondition({exists: true});
    }

    let write = {
      update: document.toProto(),
      updateMask: documentMask.toProto(),
      currentDocument: precondition.toProto()
    };

    this._writes.push(write);

    let documentTransform = DocumentTransform.fromObject(
        docRef, expandedObject);

    if (!documentTransform.isEmpty) {
      this._writes.push({transform: documentTransform.toProto()});
    }

    return this;
  }

  /**
   * Verifies preconditions with the database and enforces constraints on the
   * batch.
   *
   * @private
   *
   * @todo Expose when server adds support.
   *
   * @param {firestore.DocumentReference} docRef The location of the
   *   document.
   * @param {object=} verifyOptions - The preconditions for this verification.
   * @param {boolean=} verifyOptions.exists Whether the document should exist.
   * @param {string=} verifyOptions.lastUpdateTime If set, verifies that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * batch if the document doesn't exist or was last updated at a different
   * time.
   * @return {firestore.WriteBatch} The WriteBatch instance for chaining.
   */
  verify_(docRef, verifyOptions) {
    validate.isDocumentReference('docRef', docRef);
    validate.isPrecondition('verifyOptions', verifyOptions);

    let write = {
      verify: docRef.formattedName,
      currentDocument: new Precondition({
        exists: verifyOptions.exists,
        lastUpdateTime: verifyOptions.lastUpdateTime
      }).toProto()
    };

    this._writes.push(write);

    return this;
  }

  /**
   * Atomically commits all pending operations to the database and verifies all
   * preconditions. Fails the entire batch if any precondition is not met.
   *
   * @public
   * @param {object=} commitOptions Options to use for this commit.
   * @param {bytes=} commitOptions.transactionId The transaction ID of this
   * commit.
   * @return {Promise.<Array.<firestore.WriteResult>>} A Promise that resolves
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
  commit(commitOptions) {
    let request = {
      database: this._firestore.formattedName,
      writes: this._writes
    };

    if (commitOptions && commitOptions.transactionId) {
      request.transaction = commitOptions.transactionId;
    }

    let self = this;

    return self.firestore.request(
        self._api.Firestore.commit.bind(self._api.Firestore), request
    ).then(resp => {
      let commitTime = DocumentSnapshot.toISOTime(resp.commitTime);
      let result = {
        writeResults: []
      };

      for (let writeResult of resp.writeResults) {
        result.writeResults.push(new WriteResult(
            DocumentSnapshot.toISOTime(writeResult.updateTime) || commitTime));
      }

      return result;
    });
  }
}


module.exports = (Firestore, DocumentRef, validateDocumentReference) => {
  let document = require('./document.js')(Firestore, DocumentRef);
  DocumentReference = DocumentRef;
  DocumentMask = document.DocumentMask;
  DocumentSnapshot = document.DocumentSnapshot;
  DocumentTransform = document.DocumentTransform;
  Precondition = document.Precondition;
  validate = require('./validate')({
    Document: document.validateDocumentData,
    DocumentReference: validateDocumentReference,
    Precondition: document.validatePrecondition
  });
  return {
    WriteBatch, WriteResult
  };
};
