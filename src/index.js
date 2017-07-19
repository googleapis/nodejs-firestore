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
 * @module firestore
 */

'use strict';

let bun = require('bun');
let common = require('@google-cloud/common');
let commonGrpc = require('@google-cloud/common-grpc');
let extend = require('extend');
let is = require('is');
let through = require('through2');

let v1beta1 = require('./v1beta1');

/**
 * @type firestore.CollectionReference
 * @private
 */
let CollectionReference;

/**
 * @type firestore.DocumentReference
 * @private
 */
let DocumentReference;

/**
 * @type firestore.DocumentSnapshot
 * @private
 */
let DocumentSnapshot;

/**
 * @type firestore.GeoPoint
 * @private
 */
let GeoPoint;

/**
 * @type firestore.Path
 * @private
 */
let Path = require('./path');

/**
 * @private
 */
let validate;

/**
 * @type firestore.WriteBatch
 * @private
 */
let WriteBatch;

/**
 * @type firestore.Transaction
 * @private
 */
let Transaction;

/**
 * HTTP header for the resource prefix to improve routing and project isolation
 * by the backend.
 * @type string
 * @private
 */
const CLOUD_RESOURCE_HEADER = 'google-cloud-resource-prefix';

/**
 * The Firestore client represents a Firestore Database and is the entry point
 * for all Firestore operations.
 *
 * @resource [Firestore Documentation]{@link https://firebase.google.com/docs/firestore/}
 *
 * @public
 * @alias firestore.Firestore
 */
class Firestore extends commonGrpc.Service{
  /**
   * @param {Object=} options - [Configuration object](#/docs).
   */
  constructor(options) {
    let config = {
      service: 'firestore',
      apiVersion: 'v1beta1',
      // @todo: Pass in proto services via googleprotofiles once v1beta1 protos
      // are publicly available:
      //
      // protoServices: {
      //    Firestore:  googleProtoFiles('firestore', 'v1beta1',
      //                'firestore.proto'),
      // }
      protoServices: {},
      packageJson: require('../package.json')
    };

    options = extend({}, options, {
      libName: 'gccl',
      libVersion: require('../package.json').version
    });

    super(config, options);

    /**
     * The Firestore GAPIC client.
     * @package
     */
    this.api = {
      Firestore: v1beta1(options).firestoreClient(options)
    };

    if (options && options.projectId) {
      this._referencePath = new Path(options.projectId, '(default)', []);
    } else {
      this._referencePath = new Path('{{projectId}}', '(default)', []);
    }
  }

  /**
   * The root path to the database.
   * @package
   * @type string
   */
  get formattedName() {
    return this._referencePath.formattedName;
  }

  /**
   * Gets a [DocumentReference]{@link firestore.DocumentReference} instance that
   * refers to the document at the specified path.
   *
   * @public
   *
   * @param {string} documentPath - A slash-separated path to a document.
   * @return {firestore.DocumentReference} A reference to the specified
   * document.
   *
   * @example
   * let documentRef = firestore.doc('collection/document');
   * console.log(`Path of document is ${documentRef.path}`);
   */
  doc(documentPath) {
    validate.isString('documentPath', documentPath);

    let path = this._referencePath.child(documentPath);
    if (!path.isDocument) {
      throw new Error('Argument "documentPath" must point to a document.');
    }

    return new DocumentReference(this, path);
  }

  /**
   * Gets a [CollectionReference]{@link firestore.CollectionReference} instance
   * that refers to the collection at the specified path.
   *
   * @public
   *
   * @param {string} collectionPath - A slash-separated path to a collection.
   * @return {firestore.CollectionReference} A reference to the specified
   * collection.
   *
   * @example
   * let collectionRef = firestore.collection('collection');
   *
   * // Add a document with an auto-generated ID.
   * collectionRef.add({foo: 'bar'}).then((documentRef) => {
   *   console.log(`Added document at ${documentRef.path})`);
   * });
   */
   collection(collectionPath) {
    validate.isString('collectionPath', collectionPath);

    let path = this._referencePath.child(collectionPath);
    if (!path.isCollection) {
      throw new Error('Argument "collectionPath" must point to a collection.');
    }

    return new CollectionReference(this, path);
  }

  /**
   * Creates a [WriteBatch]{@link firestore.WriteBatch} instance that can be
   * used to atomically commit multiple writes.
   *
   * @public
   *
   * @return {firestore.WriteBatch} A WriteBatch that operates on this Firestore
   * client.
   *
   * @example
   * let writeBatch = firestore.batch();
   *
   * // Add two documents in an atomic batch.
   * let data = { foo: 'bar' };
   * writeBatch.set(firestore.doc('col/doc1'), data);
   * writeBatch.set(firestore.doc('col/doc2'), data);
   *
   * writeBatch.commit().then(res => {
   *   console.log(`Added document at ${res.writeResults[0].updateTime}`);
   * });
   */
  batch() {
    return new WriteBatch(this);
  }

  /**
   * Executes the given updateFunction and then attempts to commit the
   * changes applied within the transaction.
   *
   * You can use the transaction object passed to 'updateFunction' to read and
   * modify Firestore documents under lock. Transactions are committed once
   * 'updateFunction' resolves and attempted up to five times on failure.
   *
   * @public
   *
   * @param {function(firestore.Transaction)} updateFunction - The
   * function to execute within the transaction
   * context.
   * @param {object=} transactionOptions - Transaction options.
   * @param {number=} transactionOptions.maxAttempts - The maximum number of
   * attempts for this transaction.
   * @return {Promise} The promise returned from the updateFunction.
   *
   * @example
   * let counterTransaction = firestore.runTransaction(transaction => {
   *   let documentRef = firestore.doc('col/doc');
   *   return transaction.get(documentRef).then(doc => {
   *     if (doc.exists) {
   *       let count =  doc.get('count') || 0;
   *       if (count > 10) {
   *         return Promise.reject('Reached maximum count');
   *       }
   *       transaction.update(documentRef, { count: ++count });
   *       return Promise.resolve(count);
   *     }
   *
   *     transaction.create(documentRef, { count: 1 });
   *     return Promise.resolve(1);
   *   });
   * });
   *
   * counterTransaction.then(res => {
   *   console.log(`Count updated to ${res}`);
   * });
   */
  runTransaction(updateFunction, transactionOptions) {
    validate.isFunction('updateFunction', updateFunction);

    const defaultAttempts = 5;

    let attemptsRemaining = defaultAttempts;
    let previousTransaction;

    if (is.defined(transactionOptions)) {
      validate.isObject('transactionOptions', transactionOptions);
      validate.isOptionalInteger('transactionOptions.maxAttempts',
          transactionOptions.maxAttempts, 1);

      attemptsRemaining = transactionOptions.maxAttempts || attemptsRemaining;
      previousTransaction = transactionOptions.previousTransaction;
    }

    let transaction = new Transaction(this, previousTransaction);
    let result;

    --attemptsRemaining;

    return transaction.begin().then(() => {
      let promise = updateFunction(transaction);
      result = is.instanceof(promise, Promise) ? promise : Promise.reject(
          new Error(
              'You must return a Promise in your transaction()-callback.'));

      return result.catch(() => {
        // Rollback the transaction and return the failed result.
        return transaction.rollback().then(() => { return result; });
      });
    }).then(() => {
      return transaction.commit().catch((err) => {
        if (attemptsRemaining > 0) {
          return this.runTransaction(updateFunction, {
            previousTransaction: transaction,
            maxAttempts: attemptsRemaining
          });
        }
        return Promise.reject(err);
      });
    }).then(() => {
      return result;
    });
  }

  /**
   * Retrieves multiple documents from Firestore.
   *
   * @public
   *
   * @param {
   * Array.<firestore.DocumentReference>|...firestore.DocumentReference} varArgs
   * The document references to receive.
   * @return {Promise<Array.<firestore.DocumentSnapshot>>} A Promise that
   * contains an array with the resulting document snapshots.
   *
   * @example
   * let documentRef1 = firestore.doc('col/doc1');
   * let documentRef2 = firestore.doc('col/doc2');
   *
   * firestore.getAll([documentRef1, documentRef2]).then(docs => {
   *   console.log(`First document: ${JSON.stringify(docs[0])}`);
   *   console.log(`Second document: ${JSON.stringify(docs[1])}`);
   * });
   */
  getAll(varArgs) {
    let documents = [];

    varArgs = is.array(arguments[0]) ? arguments[0] : [].slice.call(arguments);

    for (let i = 0; i < varArgs.length; ++i) {
      validate.isDocumentReference(i, varArgs[i]);
      documents.push(varArgs[i]);
    }

    return this.getAll_(documents, null);
  }


  /**
   * Internal method to retrieve multiple documents from Firestore, optionally
   * as part of a transaction.
   *
   * @package
   * @param {Array.<firestore.DocumentReference>} docRefs - The documents
   * to receive.
   * @param {object=} readOptions - The options to use for this request.
   * @param {bytes|null} readOptions.transactionId - The transaction ID to use
   * for this read.
   * @return {Array.<firestore.DocumentSnapshot|null>} A Promise that
   * contains an array with the resulting documents (or null for each missing
   * document).
   */
  getAll_(docRefs, readOptions) {
    let request = {
      database: this.formattedName,
      documents: []
    };

    let inputOrder = {};

    // BatchGetDocuments doesn't preserve document order. We persist the
    // request order and restore it when we receive the result.
    for (let i = 0; i < docRefs.length; ++i) {
      inputOrder[docRefs[i].path] = i;
      request.documents.push(docRefs[i].formattedName);
    }

    if (readOptions && readOptions.transactionId) {
      request.transaction = readOptions.transactionId;
    }

    let self = this;
    let documents = [];

    return self.readStream(
        this.api.Firestore.batchGetDocuments.bind(this.api.Firestore),
        request
    ).then(stream => {
      return new Promise((resolve, reject) => {
        stream.on('error', (err) => {
          reject(err);
        }).on('data', response => {
          try {
            let document = new DocumentSnapshot.Builder();

            if (response.found) {
              let found = response.found;
              document.ref = new DocumentReference(self,
                  Path.fromName(found.name));
              document.fieldsProto = found.fields || {};
              document.createTime =
                  DocumentSnapshot.toISOTime(found.createTime);
              document.updateTime =
                  DocumentSnapshot.toISOTime(found.updateTime);
            } else {
              document.ref = new DocumentReference(self,
                  Path.fromName(response.missing));
            }

            document.readTime = DocumentSnapshot.toISOTime(response.readTime);

            let path = document.ref.path;
            if (!is.defined(inputOrder[path])) {
              throw new Error(`Could not detect input order for "${path}".`);
            }

            documents[inputOrder[path]] = document.build();
          } catch (err) {
            reject(err);
          }
        }).on('end', () => {
          resolve(documents);
        });
      });
    });
  }

  /**
   * Generate a unique client-side identifier.
   *
   * Used for the creation of new documents.
   *
   * @package
   * @return {string} A unique 20-character wide identifier.
   */
  static autoId() {
    let chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    for (let i = 0; i < 20; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
  }

  /**
   * Decorate all request options before being sent with to an API request. This
   * is used to replace any `{{projectId}}` placeholders with the value detected
   * from the user's environment, if one wasn't provided manually.
   *
   * @private
   */
  _decorateRequest(request) {
    let self = this;

    function decorate() {
      return new Promise((resolve) => {
        let decoratedRequest = extend(true, {}, request);
        decoratedRequest = common.util.replaceProjectIdToken(decoratedRequest,
            self._referencePath.projectId);

        let decoratedGax = {otherArgs: {headers: {}}};
        decoratedGax.otherArgs.headers[CLOUD_RESOURCE_HEADER] =
            self.formattedName;

        resolve({ request: decoratedRequest,  gax: decoratedGax });
      });
    }

    if (this._referencePath.projectId !== '{{projectId}}') {
      return decorate();
    }

    return new Promise((resolve, reject) => {
      this.api.Firestore.getProjectId((err, projectId) => {
        if (err) {
          reject(err);
        } else {
          self._referencePath = new Path(
              projectId, self._referencePath.databaseId, []);
          decorate().then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * A funnel for all non-streaming API requests, assigning a project ID where
   * necessary within the request options.
   *
   * @package
   *
   * @param {function} method - Veneer API endpoint that takes a request and
   * GAX options.
   * @param {Object} request - The Protobuf request to send.
   * @return {Object} A Promise with the request result.
   */
  request(method, request) {
    return this._decorateRequest(request).then(decorated => {
      return new Promise((resolve, reject) => {
        method(decorated.request, decorated.gax, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    });
  }

  /**
   * A funnel for read-only streaming API requests, assigning a project ID where
   * necessary within the request options.
   *
   * @package
   *
   * @param {function} method - Streaming Veneer API endpoint that takes a
   * request and GAX options.
   * @param {Object} request - The Protobuf request to send.
   * @return {Stream} A Promise with the resulting read-only stream.
   */
  readStream(method, request) {
    let self = this;

    return self._decorateRequest(request).then((decorated) => {
      return method(decorated.request, decorated.gax);
    });
  }

  /**
   * A funnel for read-write streaming API requests, assigning a project ID
   * where necessary for all writes.
   *
   * @package
   *
   * @param {function} method - Streaming Veneer API endpoint that takes GAX
   * options.
   * @return {Stream} A Promise with the resulting read/write stream.
   */
  readWriteStream(method) {
    let self = this;

    return self._decorateRequest({}).then((decorated) => {
      let requestStream = method(decorated.gax);

      let transform = through.obj(function(chunk, encoding, callback) {
        let decoratedChunk = extend(true, {}, chunk);
        common.util.replaceProjectIdToken(decoratedChunk,
            self._referencePath.projectId);
        this.push(decoratedChunk);
        callback();
      });

      return bun([transform, requestStream]);
    });
  }

  /**
   * Creates a [GeoPoint]{@link firestore.GeoPoint}.
   *
   * @param {number} latitude The latitude as a number between -90 and 90.
   * @param {number} longitude The longitude as a number between -180 and 180.
   * @return {firestore.GeoPoint} The GeoPoint pointing to the provided
   * location.
   *
   * @example
   * let data = {
   *   google: Firestore.geoPoint(37.422, 122.084)
   * };
   *
   * firestore.doc('col/doc').set(data).then(() => {
   *   console.log(`Location is ${data.google.latitude}, ` +
   *     `${data.google.longitude}`);
   * });
   */
  static geoPoint(latitude, longitude) {
    validate.isNumber('latitude', latitude);
    validate.isNumber('longitude', longitude);

    return new GeoPoint(latitude, longitude);
  }

  /**
   * Creates an escaped field path from a list of field name components.
   *
   * @public
   *
   * @param {Array.<string>|...string} varArgs The unescaped components to
   * encode into the field path.
   * @return {string} A Firestore field path.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   * let data = { outer: { inner1: 'foo', inner2: 'bar' }};
   * let fieldPath = Firestore.fieldPath('outer', 'inner1');
   *
   * documentRef.set(data).then(() => {
   *   return documentRef.get();
   * }).then((document) => {
   *   console.log(`Inner1 is defined: ${document.get(fieldPath)}`);
   *   return documentRef.update({ fieldPath: Firestore.FieldValue.delete() });
   * }).then(() => {
   *   return documentRef.get();
   * }).then((document) => {
   *   console.log(`Inner1 is undefined: ${document.get(fieldPath)}`);
   * });
   */
  static fieldPath(varArgs) {
    varArgs = is.array(arguments[0]) ? arguments[0] : [].slice.call(arguments);

    for (let i = 0; i < varArgs.length; ++i) {
      validate.isString(i, varArgs[i]);
    }

    return DocumentSnapshot.encodeFieldPath(varArgs);
  }
}

/**
 * @package
 */
Firestore.deleteSentinel = {};

/**
 * @package
 */
Firestore.serverTimestampSentinel = {};

/**
 * Sentinel values that can be used when writing documents with set() or
 * update().
 *
 * @public
 */
Firestore.FieldValue = {};

/**
 * Returns a sentinel used with update() to mark a field for deletion.
 *
 * @public
 *
 * @return {*} The sentinel value to use in your objects.
 *
 * @example
 * let documentRef = firestore.doc('col/doc');
 * let data = { a: 'b', c: 'd' };
 *
 * documentRef.set(data).then(() => {
 *   return documentRef.update({a: Firestore.FieldValue.delete()});
 * }).then(() => {
 *   // Document now only contains { c: 'd' }
 * });
 */
Firestore.FieldValue.delete = function() {
  return Firestore.deleteSentinel;
};

/**
 * Returns a sentinel used with set(), create() or update() to include a
 * server-generated timestamp in the written data.
 *
 * @public
 *
 * @return {*} The sentinel value to use in your objects.
 *
 * @example
 * let documentRef = firestore.doc('col/doc');
 *
 * documentRef.set({
 *   time: Firestore.FieldValue.serverTimestamp()
 * }).then(() => {
 *   return documentRef.get();
 * }).then(doc => {
 *   console.log(`Server time set to ${doc.get('time')}`);
 * });
  */
Firestore.FieldValue.serverTimestamp = function() {
  return Firestore.serverTimestampSentinel;
};

// Initializing dependencies that require that Firestore class type.
let reference = require('./reference')(Firestore);
CollectionReference = reference.CollectionReference;
DocumentReference = reference.DocumentReference;
let document = require('./document')(Firestore, DocumentReference);
DocumentSnapshot = document.DocumentSnapshot;
GeoPoint = document.GeoPoint;
validate = require('./validate.js')({
  DocumentReference: reference.validateDocumentReference
});
WriteBatch = require('./write-batch')(Firestore, DocumentReference).WriteBatch;
Transaction = require('./transaction')(Firestore);

module.exports = Firestore;
module.exports.v1beta1 = v1beta1;
