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

import {replaceProjectIdToken} from '@google-cloud/projectify';
import * as assert from 'assert';
import * as bun from 'bun';
import * as extend from 'extend';
import * as is from 'is';
import * as through2 from 'through2';
import {google} from '../protos/firestore_proto_api';
import * as convert from './convert';
import {DocumentSnapshot, DocumentSnapshotBuilder, validatePrecondition, validateSetOptions} from './document';
import {DeleteTransform, FieldTransform} from './field-value';
import {GeoPoint} from './geo-point';
import {logger, setLibVersion} from './logger';
import {FieldPath} from './path';
import {ResourcePath} from './path';
import {ClientPool} from './pool';
import {CollectionReference, validateComparisonOperator, validateDocumentReference, validateFieldOrder} from './reference';
import {DocumentReference} from './reference';
import {isPlainObject, Serializer} from './serializer';
import {Timestamp} from './timestamp';
import {Transaction} from './transaction';
import {DocumentData, GapicClient, ReadOptions, Settings, ValidationOptions} from './types';
import {AnyDuringMigration, AnyJs} from './types';
import {parseGetAllArguments, requestTag} from './util';
import {customObjectError, Validator} from './validate';
import {WriteBatch} from './write-batch';
import {validateUpdateMap} from './write-batch';

import api = google.firestore.v1beta1;

export {CollectionReference, DocumentReference, QuerySnapshot, Query} from './reference';
export {DocumentSnapshot, QueryDocumentSnapshot} from './document';
export {FieldValue} from './field-value';
export {WriteBatch, WriteResult} from './write-batch';
export {Transaction} from './transaction';
export {Timestamp} from './timestamp';
export {DocumentChange} from './document-change';
export {FieldPath} from './path';
export {GeoPoint} from './geo-point';
export {setLogFunction} from './logger';
export {UpdateData, DocumentData, Settings, Precondition, SetOptions} from './types';

const libVersion = require('../../package.json').version;
setLibVersion(libVersion);

/*!
 * DO NOT REMOVE THE FOLLOWING NAMESPACE DEFINITIONS
 */

/**
 * @namespace google.protobuf
 */

/**
 * @namespace google.rpc
 */

/**
 * @namespace google.firestore.v1beta1
 */

/*!
 * @see v1beta1
 */
let v1beta1;  // Lazy-loaded in `_runRequest()`

/*!
 * HTTP header for the resource prefix to improve routing and project isolation
 * by the backend.
 */
const CLOUD_RESOURCE_HEADER = 'google-cloud-resource-prefix';

/*!
 * The maximum number of times to retry idempotent requests.
 */
const MAX_REQUEST_RETRIES = 5;

/*!
 * The maximum number of concurrent requests supported by a single GRPC channel,
 * as enforced by Google's Frontend. If the SDK issues more than 100 concurrent
 * operations, we need to use more than one GAPIC client since these clients
 * multiplex all requests over a single channel.
 */
const MAX_CONCURRENT_REQUESTS_PER_CLIENT = 100;

/*!
 * GRPC Error code for 'UNAVAILABLE'.
 */
const GRPC_UNAVAILABLE = 14;

/*!
 * The maximum depth of a Firestore object.
 */
const MAX_DEPTH = 20;

/**
 * Document data (e.g. for use with
 * [set()]{@link DocumentReference#set}) consisting of fields mapped
 * to values.
 *
 * @typedef {Object.<string, *>} DocumentData
 */

/**
 * Update data (for use with [update]{@link DocumentReference#update})
 * that contains paths (e.g. 'foo' or 'foo.baz') mapped to values. Fields that
 * contain dots reference nested fields within the document.
 *
 * @typedef {Object.<string, *>} UpdateData
 */

/**
 * An options object that configures conditional behavior of
 * [update()]{@link DocumentReference#update} and
 * [delete()]{@link DocumentReference#delete} calls in
 * [DocumentReference]{@link DocumentReference},
 * [WriteBatch]{@link WriteBatch}, and
 * [Transaction]{@link Transaction}. Using Preconditions, these calls
 * can be restricted to only apply to documents that match the specified
 * conditions.
 *
 * @property {string} lastUpdateTime The update time to enforce (specified as
 * an ISO 8601 string).
 * @typedef {Object} Precondition
 */

/**
 * An options object that configures the behavior of
 * [set()]{@link DocumentReference#set} calls in
 * [DocumentReference]{@link DocumentReference},
 * [WriteBatch]{@link WriteBatch}, and
 * [Transaction]{@link Transaction}. These calls can be
 * configured to perform granular merges instead of overwriting the target
 * documents in their entirety by providing a SetOptions object with
 * { merge : true }.
 *
 * @property {boolean} merge Changes the behavior of a set() call to only
 * replace the values specified in its data argument. Fields omitted from the
 * set() call remain untouched.
 * @property {Array<(string|FieldPath)>} mergeFields Changes the behavior of
 * set() calls to only replace the specified field paths. Any field path that is
 * not specified is ignored and remains untouched.
 * It is an error to pass a SetOptions object to a set() call that is missing a
 * value for any of the fields specified here.
 * @typedef {Object} SetOptions
 */

/**
 * An options object that can be used to configure the behavior of
 * [getAll()]{@link Firestore#getAll} calls. By providing a `fieldMask`, these
 * calls can be configured to only return a subset of fields.
 *
 * @property {Array<(string|FieldPath)>} fieldMask Specifies the set of fields
 * to return and reduces the amount of data transmitted by the backend.
 * Adding a field mask does not filter results. Documents do not need to
 * contain values for all the fields in the mask to be part of the result set.
 * @typedef {Object} ReadOptions
 */

/**
 * The Firestore client represents a Firestore Database and is the entry point
 * for all Firestore operations.
 *
 * @see [Firestore Documentation]{@link https://firebase.google.com/docs/firestore/}
 *
 * @class
 *
 * @example <caption>Install the client library with <a
 * href="https://www.npmjs.com/">npm</a>:</caption> npm install --save
 * @google-cloud/firestore
 *
 * @example <caption>Import the client library</caption>
 * var Firestore = require('@google-cloud/firestore');
 *
 * @example <caption>Create a client that uses <a
 * href="https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application">Application
 * Default Credentials (ADC)</a>:</caption> var firestore = new Firestore();
 *
 * @example <caption>Create a client with <a
 * href="https://cloud.google.com/docs/authentication/production#obtaining_and_providing_service_account_credentials_manually">explicit
 * credentials</a>:</caption> var firestore = new Firestore({ projectId:
 * 'your-project-id', keyFilename: '/path/to/keyfile.json'
 * });
 *
 * @example <caption>include:samples/quickstart.js</caption>
 * region_tag:firestore_quickstart
 * Full quickstart example:
 */
export class Firestore {
  /** @private */
  readonly _validator;

  /**
   * A client pool to distribute requests over multiple GAPIC clients in order
   * to work around a connection limit of 100 concurrent requests per client.
   * @private
   */
  private _clientPool: ClientPool<GapicClient>|null = null;

  /**
   * The configuration options for the GAPIC client.
   * @private
   */
  _settings: Settings = {};

  /**
   * Whether the initialization settings can still be changed by invoking
   * `settings()`.
   * @private
   */
  private _settingsFrozen = false;

  /**
   * A Promise that resolves when client initialization completes. Can be
   * 'null' if initialization hasn't started yet.
   * @private
   */
  private _clientInitialized: Promise<void>|null = null;

  /**
   * The serializer to use for the Protobuf transformation.
   * @private
   */
  private _serializer: Serializer|null = null;

  private _referencePath: ResourcePath|null = null;

  // GCF currently tears down idle connections after two minutes. Requests
  // that are issued after this period may fail. On GCF, we therefore issue
  // these requests as part of a transaction so that we can safely retry until
  // the network link is reestablished.
  //
  // The environment variable FUNCTION_TRIGGER_TYPE is used to detect the GCF
  // environment.
  /** @private */
  _preferTransactions: boolean;
  /** @private */
  _lastSuccessfulRequest = 0;

  /**
   * @param {Object=} settings [Configuration object](#/docs).
   * @param {string=} settings.projectId The project ID from the Google
   * Developer's Console, e.g. 'grape-spaceship-123'. We will also check the
   * environment variable GCLOUD_PROJECT for your project ID.  Can be omitted in
   * environments that support
   * {@link https://cloud.google.com/docs/authentication Application Default
   * Credentials}
   * @param {string=} settings.keyFilename Local file containing the Service
   * Account credentials as downloaded from the Google Developers Console. Can
   * be omitted in environments that support
   * {@link https://cloud.google.com/docs/authentication Application Default
   * Credentials}. To configure Firestore with custom credentials, use
   * `settings.credentials` and provide the `client_email` and `private_key` of
   * your service account.
   * @param {{client_email:string=, private_key:string=}=} settings.credentials
   * The `client_email` and `private_key` properties of the service account
   * to use with your Firestore project. Can be omitted in environments that
   * support {@link https://cloud.google.com/docs/authentication Application
   * Default Credentials}. If your credentials are stored in a JSON file, you
   * can specify a `keyFilename` instead.
   * @param {boolean=} settings.timestampsInSnapshots Enables the use of
   * `Timestamp`s for timestamp fields in `DocumentSnapshots`.<br/>
   * Currently, Firestore returns timestamp fields as `Date` but `Date` only
   * supports millisecond precision, which leads to truncation and causes
   * unexpected behavior when using a timestamp from a snapshot as a part
   * of a subsequent query.
   * <br/>Setting `timestampsInSnapshots` to true will cause Firestore to return
   * `Timestamp` values instead of `Date` avoiding this kind of problem. To
   * make this work you must also change any code that uses `Date` to use
   * `Timestamp` instead.
   * <br/>NOTE: in the future `timestampsInSnapshots: true` will become the
   * default and this option will be removed so you should change your code to
   * use `Timestamp` now and opt-in to this new behavior as soon as you can.
   */
  constructor(settings?: Settings) {
    this._validator = new Validator({
      ArrayElement: (name, value) => validateFieldValue(
          name, value, /*path=*/undefined, /*level=*/0,
          /*inArray=*/true),
      DeletePrecondition: precondition =>
          validatePrecondition(precondition, /* allowExists= */ true),
      Document: validateDocumentData,
      DocumentReference: validateDocumentReference,
      FieldPath: FieldPath.validateFieldPath,
      FieldValue: validateFieldValue,
      FieldOrder: validateFieldOrder,
      QueryComparison: validateComparisonOperator,
      QueryValue: validateFieldValue,
      ResourcePath: ResourcePath.validateResourcePath,
      SetOptions: validateSetOptions,
      ReadOptions: validateReadOptions,
      UpdateMap: validateUpdateMap,
      UpdatePrecondition: precondition =>
          validatePrecondition(precondition, /* allowExists= */ false),
    } as AnyDuringMigration);


    const libraryHeader = {
      libName: 'gccl',
      libVersion,
    };

    if (settings && settings.firebaseVersion) {
      libraryHeader.libVersion += ' fire/' + settings.firebaseVersion;
    }

    this.validateAndApplySettings(Object.assign({}, settings, libraryHeader));

    // GCF currently tears down idle connections after two minutes. Requests
    // that are issued after this period may fail. On GCF, we therefore issue
    // these requests as part of a transaction so that we can safely retry until
    // the network link is reestablished.
    //
    // The environment variable FUNCTION_TRIGGER_TYPE is used to detect the GCF
    // environment.
    this._preferTransactions = process.env.FUNCTION_TRIGGER_TYPE !== undefined;
    this._lastSuccessfulRequest = 0;

    if (this._preferTransactions) {
      logger('Firestore', null, 'Detected GCF environment');
    }

    logger('Firestore', null, 'Initialized Firestore');
  }

  /**
   * Specifies custom settings to be used to configure the `Firestore`
   * instance. Can only be invoked once and before any other Firestore method.
   *
   * If settings are provided via both `settings()` and the `Firestore`
   * constructor, both settings objects are merged and any settings provided via
   * `settings()` take precedence.
   *
   * @param {object} settings The settings to use for all Firestore operations.
   */
  settings(settings: Settings): void {
    this._validator.isObject('settings', settings);
    this._validator.isOptionalString('settings.projectId', settings.projectId);
    this._validator.isOptionalBoolean(
        'settings.timestampsInSnapshots', settings.timestampsInSnapshots);

    if (this._clientInitialized) {
      throw new Error(
          'Firestore has already been started and its settings can no longer ' +
          'be changed. You can only call settings() before calling any other ' +
          'methods on a Firestore object.');
    }

    if (this._settingsFrozen) {
      throw new Error(
          'Firestore.settings() has already be called. You can only call ' +
          'settings() once, and only before calling any other methods on a ' +
          'Firestore object.');
    }

    const mergedSettings = Object.assign({}, this._settings, settings);
    this.validateAndApplySettings(mergedSettings);
    this._settingsFrozen = true;
  }

  private validateAndApplySettings(settings: Settings): void {
    this._validator.isOptionalBoolean(
        'settings.timestampsInSnapshots', settings.timestampsInSnapshots);

    if (settings && settings.projectId) {
      this._validator.isString('settings.projectId', settings.projectId);
      this._referencePath = new ResourcePath(settings.projectId, '(default)');
    } else {
      // Initialize a temporary reference path that will be overwritten during
      // project ID detection.
      this._referencePath = new ResourcePath('{{projectId}}', '(default)');
    }

    this._settings = settings;
    this._serializer = new Serializer(this);
  }

  /**
   * The root path to the database.
   *
   * @private
   */
  get formattedName(): string {
    return this._referencePath!.formattedName;
  }

  /**
   * Gets a [DocumentReference]{@link DocumentReference} instance that
   * refers to the document at the specified path.
   *
   * @param {string} documentPath A slash-separated path to a document.
   * @returns {DocumentReference} The
   * [DocumentReference]{@link DocumentReference} instance.
   *
   * @example
   * let documentRef = firestore.doc('collection/document');
   * console.log(`Path of document is ${documentRef.path}`);
   */
  doc(documentPath: string): DocumentReference {
    this._validator.isResourcePath('documentPath', documentPath);

    const path = this._referencePath!.append(documentPath);
    if (!path.isDocument) {
      throw new Error(`Argument "documentPath" must point to a document, but was "${
          documentPath}". Your path does not contain an even number of components.`);
    }

    return new DocumentReference(this, path);
  }

  /**
   * Gets a [CollectionReference]{@link CollectionReference} instance
   * that refers to the collection at the specified path.
   *
   * @param {string} collectionPath A slash-separated path to a collection.
   * @returns {CollectionReference} The
   * [CollectionReference]{@link CollectionReference} instance.
   *
   * @example
   * let collectionRef = firestore.collection('collection');
   *
   * // Add a document with an auto-generated ID.
   * collectionRef.add({foo: 'bar'}).then((documentRef) => {
   *   console.log(`Added document at ${documentRef.path})`);
   * });
   */
  collection(collectionPath: string): CollectionReference {
    this._validator.isResourcePath('collectionPath', collectionPath);

    const path = this._referencePath!.append(collectionPath);
    if (!path.isCollection) {
      throw new Error(`Argument "collectionPath" must point to a collection, but was "${
          collectionPath}". Your path does not contain an odd number of components.`);
    }

    return new CollectionReference(this, path);
  }

  /**
   * Creates a [WriteBatch]{@link WriteBatch}, used for performing
   * multiple writes as a single atomic operation.
   *
   * @returns {WriteBatch} A WriteBatch that operates on this Firestore
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
  batch(): WriteBatch {
    return new WriteBatch(this);
  }

  /**
   * Creates a [DocumentSnapshot]{@link DocumentSnapshot} or a
   * [QueryDocumentSnapshot]{@link QueryDocumentSnapshot} from a
   * `firestore.v1beta1.Document` proto (or from a resource name for missing
   * documents).
   *
   * This API is used by Google Cloud Functions and can be called with both
   * 'Proto3 JSON' and 'Protobuf JS' encoded data.
   *
   * @private
   * @param documentOrName The Firestore 'Document' proto or the resource name
   * of a missing document.
   * @param readTime A 'Timestamp' proto indicating the time this document was
   * read.
   * @param encoding One of 'json' or 'protobufJS'. Applies to both the
   * 'document' Proto and 'readTime'. Defaults to 'protobufJS'.
   * @returns A QueryDocumentSnapshot for existing documents, otherwise a
   * DocumentSnapshot.
   */
  private snapshot_(
      documentOrName: api.IDocument|string,
      readTime?: google.protobuf.ITimestamp,
      encoding?: 'json'|'protobufJS'): DocumentSnapshot {
    // TODO: Assert that Firestore Project ID is valid.

    let convertTimestamp;
    let convertDocument;

    if (encoding === undefined || encoding === 'protobufJS') {
      convertTimestamp = data => data;
      convertDocument = data => data;
    } else if (encoding === 'json') {
      // Google Cloud Functions calls us with Proto3 JSON format data, which we
      // must convert to Protobuf JS.
      convertTimestamp = convert.timestampFromJson;
      convertDocument = convert.documentFromJson;
    } else {
      throw new Error(
          `Unsupported encoding format. Expected "json" or "protobufJS", ` +
          `but was "${encoding}".`);
    }

    const document = new DocumentSnapshotBuilder();

    if (typeof documentOrName === 'string') {
      document.ref = new DocumentReference(
          this, ResourcePath.fromSlashSeparatedString(documentOrName));
    } else {
      document.ref = new DocumentReference(
          this, ResourcePath.fromSlashSeparatedString(documentOrName.name!));
      document.fieldsProto =
          documentOrName.fields ? convertDocument(documentOrName.fields) : {};
      document.createTime = Timestamp.fromProto(convertTimestamp(
          documentOrName.createTime, 'documentOrName.createTime'));
      document.updateTime = Timestamp.fromProto(convertTimestamp(
          documentOrName.updateTime, 'documentOrName.updateTime'));
    }

    if (readTime) {
      document.readTime =
          Timestamp.fromProto(convertTimestamp(readTime, 'readTime'));
    }

    return document.build();
  }

  /**
   * Executes the given updateFunction and commits the changes applied within
   * the transaction.
   *
   * You can use the transaction object passed to 'updateFunction' to read and
   * modify Firestore documents under lock. Transactions are committed once
   * 'updateFunction' resolves and attempted up to five times on failure.
   *
   * @param {function(Transaction)} updateFunction The function to execute
   * within the transaction context.
   * @param {object=} transactionOptions Transaction options.
   * @param {number=} transactionOptions.maxAttempts - The maximum number of
   * attempts for this transaction.
   * @returns {Promise} If the transaction completed successfully or was
   * explicitly aborted (by the updateFunction returning a failed Promise), the
   * Promise returned by the updateFunction will be returned here. Else if the
   * transaction failed, a rejected Promise with the corresponding failure
   * error will be returned.
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
  runTransaction<T>(
      updateFunction: (transaction: Transaction) => Promise<T>,
      transactionOptions?: {maxAttempts?: number}): Promise<T> {
    this._validator.isFunction('updateFunction', updateFunction);

    if (transactionOptions) {
      this._validator.isObject('transactionOptions', transactionOptions);
      this._validator.isOptionalInteger(
          'transactionOptions.maxAttempts', transactionOptions.maxAttempts, 1);
    }

    return this._runTransaction(updateFunction, transactionOptions);
  }

  _runTransaction<T>(
      updateFunction: (transaction: Transaction) => Promise<T>,
      transactionOptions?:
          {maxAttempts?: number; previousTransaction?: Transaction;}):
      Promise<T> {
    const defaultAttempts = 5;

    let attemptsRemaining = defaultAttempts;
    let previousTransaction;

    if (transactionOptions) {
      attemptsRemaining = transactionOptions.maxAttempts || attemptsRemaining;
      previousTransaction = transactionOptions.previousTransaction;
    }

    const transaction = new Transaction(this, previousTransaction);
    const requestTag = transaction.requestTag;
    let result;

    --attemptsRemaining;

    return transaction.begin()
        .then(() => {
          const promise = updateFunction(transaction);
          result = promise instanceof Promise ?
              promise :
              Promise.reject(new Error(
                  'You must return a Promise in your transaction()-callback.'));
          return result.catch(err => {
            logger(
                'Firestore.runTransaction', requestTag,
                'Rolling back transaction after callback error:', err);
            // Rollback the transaction and return the failed result.
            return transaction.rollback().then(() => {
              return result;
            });
          });
        })
        .then(() => {
          return transaction.commit().then(() => result).catch(err => {
            if (attemptsRemaining > 0) {
              logger(
                  'Firestore.runTransaction', requestTag,
                  `Retrying transaction after error: ${JSON.stringify(err)}.`);
              return this._runTransaction(updateFunction, {
                previousTransaction: transaction,
                maxAttempts: attemptsRemaining,
              });
            }
            logger(
                'Firestore.runTransaction', requestTag,
                'Exhausted transaction retries, returning error: %s', err);
            return Promise.reject(err);
          });
        });
  }

  /**
   * Fetches the root collections that are associated with this Firestore
   * database.
   *
   * @returns {Promise.<Array.<CollectionReference>>} A Promise that resolves
   * with an array of CollectionReferences.
   *
   * @example
   * firestore.listCollections().then(collections => {
   *   for (let collection of collections) {
   *     console.log(`Found collection with id: ${collection.id}`);
   *   }
   * });
   */
  listCollections() {
    const rootDocument = new DocumentReference(this, this._referencePath!);
    return rootDocument.listCollections();
  }

  /**
   * Fetches the root collections that are associated with this Firestore
   * database.
   *
   * @deprecated Use `.listCollections()`.
   *
   * @returns {Promise.<Array.<CollectionReference>>} A Promise that resolves
   * with an array of CollectionReferences.
   */
  getCollections() {
    return this.listCollections();
  }

  /**
   * Retrieves multiple documents from Firestore.
   *
   * @param {DocumentReference} documentRef A `DocumentReference` to receive.
   * @param {Array.<DocumentReference|ReadOptions>} moreDocumentRefsOrReadOptions
   * Additional `DocumentReferences` to receive, followed by an optional field
   * mask.
   * @returns {Promise<Array.<DocumentSnapshot>>} A Promise that
   * contains an array with the resulting document snapshots.
   *
   * @example
   * let docRef1 = firestore.doc('col/doc1');
   * let docRef2 = firestore.doc('col/doc2');
   *
   * firestore.getAll(docRef1, docRef2, { fieldMask: ['user'] }).then(docs => {
   *   console.log(`First document: ${JSON.stringify(docs[0])}`);
   *   console.log(`Second document: ${JSON.stringify(docs[1])}`);
   * });
   */
  getAll(
      documentRef: DocumentReference,
      ...moreDocumentRefsOrReadOptions: Array<DocumentReference|ReadOptions>):
      Promise<DocumentSnapshot[]> {
    this._validator.minNumberOfArguments('Firestore.getAll', arguments, 1);

    const {documents, fieldMask} = parseGetAllArguments(
        this._validator, [documentRef, ...moreDocumentRefsOrReadOptions]);
    return this.getAll_(documents, fieldMask, requestTag());
  }

  /**
   * Internal method to retrieve multiple documents from Firestore, optionally
   * as part of a transaction.
   *
   * @private
   * @param docRefs The documents to receive.
   * @param fieldMask An optional field mask to apply to this read.
   * @param requestTag A unique client-assigned identifier for this request.
   * @param transactionId The transaction ID to use for this read.
   * @returns A Promise that contains an array with the resulting documents.
   */
  getAll_(
      docRefs: DocumentReference[], fieldMask: FieldPath[]|null,
      requestTag: string,
      transactionId?: Uint8Array): Promise<DocumentSnapshot[]> {
    const requestedDocuments = new Set();
    const retrievedDocuments = new Map();

    for (const docRef of docRefs) {
      requestedDocuments.add(docRef.formattedName);
    }

    const request: api.IBatchGetDocumentsRequest = {
      database: this.formattedName,
      transaction: transactionId,
      documents: Array.from(requestedDocuments)
    };

    if (fieldMask) {
      const fieldPaths = fieldMask.map(fieldPath => fieldPath.formattedName);
      request.mask = {fieldPaths};
    }

    const self = this;

    return self.readStream('batchGetDocuments', request, requestTag, true)
        .then(stream => {
          return new Promise<DocumentSnapshot[]>((resolve, reject) => {
            stream
                .on('error',
                    err => {
                      logger(
                          'Firestore.getAll_', requestTag,
                          'GetAll failed with error:', err);
                      reject(err);
                    })
                .on('data',
                    (response: api.IBatchGetDocumentsResponse) => {
                      try {
                        let document;

                        if (response.found) {
                          logger(
                              'Firestore.getAll_', requestTag,
                              'Received document: %s', response.found.name!);
                          document = self.snapshot_(
                              response.found, response.readTime!);
                        } else {
                          logger(
                              'Firestore.getAll_', requestTag,
                              'Document missing: %s', response.missing!);
                          document = self.snapshot_(
                              response.missing!, response.readTime!);
                        }

                        const path = document.ref.path;
                        retrievedDocuments.set(path, document);
                      } catch (err) {
                        logger(
                            'Firestore.getAll_', requestTag,
                            'GetAll failed with exception:', err);
                        reject(err);
                      }
                    })
                .on('end', () => {
                  logger(
                      'Firestore.getAll_', requestTag, 'Received %d results',
                      retrievedDocuments.size);

                  // BatchGetDocuments doesn't preserve document order. We use
                  // the request order to sort the resulting documents.
                  const orderedDocuments: DocumentSnapshot[] = [];
                  for (const docRef of docRefs) {
                    const document = retrievedDocuments.get(docRef.path);
                    if (document === undefined) {
                      reject(new Error(
                          `Did not receive document for "${docRef.path}".`));
                    }
                    orderedDocuments.push(document);
                  }
                  resolve(orderedDocuments);
                });
            stream.resume();
          });
        });
  }

  /**
   * Executes a new request using the first available GAPIC client.
   *
   * @private
   */
  private _runRequest<T>(op: (client: GapicClient) => Promise<T>): Promise<T> {
    // Initialize the client pool if this is the first request.
    if (!this._clientInitialized) {
      if (!this._settings.timestampsInSnapshots) {
        console.error(`
The behavior for Date objects stored in Firestore is going to change
AND YOUR APP MAY BREAK.
To hide this warning and ensure your app does not break, you need to add the
following code to your app before calling any other Cloud Firestore methods:

  const firestore = new Firestore();
  const settings = {/* your settings... */ timestampsInSnapshots: true};
  firestore.settings(settings);

With this change, timestamps stored in Cloud Firestore will be read back as
Firebase Timestamp objects instead of as system Date objects. So you will also
need to update code expecting a Date to instead expect a Timestamp. For example:

  // Old:
  const date = snapshot.get('created_at');
  // New:
  const timestamp = snapshot.get('created_at');
  const date = timestamp.toDate();

Please audit all existing usages of Date when you enable the new behavior. In a
future release, the behavior will change to the new behavior, so if you do not
follow these steps, YOUR APP MAY BREAK.`);
      }

      this._clientInitialized = this._initClientPool().then(clientPool => {
        this._clientPool = clientPool;
      });
    }

    return this._clientInitialized!.then(() => this._clientPool!.run(op));
  }

  /**
   * Initializes the client pool and invokes Project ID detection. Returns a
   * Promise on completion.
   *
   * @private
   */
  private _initClientPool(): Promise<ClientPool<GapicClient>> {
    assert(!this._clientInitialized, 'Client pool already initialized');

    const clientPool =
        new ClientPool(MAX_CONCURRENT_REQUESTS_PER_CLIENT, () => {
          const client = new module.exports.v1beta1(this._settings);
          logger('Firestore', null, 'Initialized Firestore GAPIC Client');
          return client;
        });

    const projectIdProvided =
        this._referencePath!.projectId !== '{{projectId}}';

    if (projectIdProvided) {
      return Promise.resolve(clientPool);
    } else {
      return clientPool.run(client => this._detectProjectId(client))
          .then(projectId => {
            this._referencePath =
                new ResourcePath(projectId, this._referencePath!.databaseId);
            return clientPool;
          });
    }
  }

  /**
   * Auto-detects the Firestore Project ID.
   *
   * @private
   * @param gapicClient The Firestore GAPIC client.
   * @return A Promise that resolves with the Project ID.
   */
  private _detectProjectId(gapicClient: GapicClient): Promise<string> {
    return new Promise((resolve, reject) => {
      gapicClient.getProjectId((err, projectId) => {
        if (err) {
          logger(
              'Firestore._detectProjectId', null,
              'Failed to detect project ID: %s', err);
          reject(err);
        } else {
          logger(
              'Firestore._detectProjectId', null, 'Detected project ID: %s',
              projectId);
          resolve(projectId);
        }
      });
    });
  }

  /**
   * Decorate the request options of an API request. This is used to replace
   * any `{{projectId}}` placeholders with the value detected from the user's
   * environment, if one wasn't provided manually.
   *
   * @private
   */
  _decorateRequest<T>(request: T): {request: T, gax: {}} {
    let decoratedRequest = extend(true, {}, request);
    decoratedRequest =
        replaceProjectIdToken(decoratedRequest, this._referencePath!.projectId);
    const decoratedGax = {otherArgs: {headers: {}}};
    decoratedGax.otherArgs.headers[CLOUD_RESOURCE_HEADER] = this.formattedName;

    return {request: decoratedRequest, gax: decoratedGax};
  }

  /**
   * A function returning a Promise that can be retried.
   *
   * @private
   * @callback retryFunction
   * @returns {Promise} A Promise indicating the function's success.
   */

  /**
   * Helper method that retries failed Promises.
   *
   * If 'delayMs' is specified, waits 'delayMs' between invocations. Otherwise,
   * schedules the first attempt immediately, and then waits 100 milliseconds
   * for further attempts.
   *
   * @private
   * @param attemptsRemaining The number of available attempts.
   * @param requestTag A unique client-assigned identifier for this request.
   * @param func Method returning a Promise than can be retried.
   * @param delayMs How long to wait before issuing a this retry. Defaults to
   * zero.
   * @returns  - A Promise with the function's result if successful within
   * `attemptsRemaining`. Otherwise, returns the last rejected Promise.
   */
  private _retry<T>(
      attemptsRemaining: number, requestTag: string, func: () => Promise<T>,
      delayMs = 0): Promise<T> {
    const self = this;

    const currentDelay = delayMs;
    const nextDelay = delayMs || 100;

    --attemptsRemaining;

    return new Promise(resolve => {
             setTimeout(resolve, currentDelay);
           })
        .then(func)
        .then(result => {
          self._lastSuccessfulRequest = new Date().getTime();
          return result;
        })
        .catch(err => {
          if (err.code !== undefined && err.code !== GRPC_UNAVAILABLE) {
            logger(
                'Firestore._retry', requestTag,
                'Request failed with unrecoverable error:', err);
            return Promise.reject(err);
          }
          if (attemptsRemaining === 0) {
            logger(
                'Firestore._retry', requestTag,
                'Request failed with error:', err);
            return Promise.reject(err);
          }
          logger(
              'Firestore._retry', requestTag,
              'Retrying request that failed with error:', err);
          return self._retry(attemptsRemaining, requestTag, func, nextDelay);
        });
  }

  /**
   * Opens the provided stream and waits for it to become healthy. If an error
   * occurs before the first byte is read, the method rejects the returned
   * Promise.
   *
   * @private
   * @param resultStream The Node stream to monitor.
   * @param requestTag A unique client-assigned identifier for this request.
   * @param request If specified, the request that should be written to the
   * stream after it opened.
   * @returns The given Stream once it is considered healthy.
   */
  private _initializeStream(
      resultStream: NodeJS.ReadableStream,
      requestTag: string): Promise<NodeJS.ReadableStream>;
  private _initializeStream(
      resultStream: NodeJS.ReadWriteStream, requestTag: string,
      request: {}): Promise<NodeJS.ReadWriteStream>;
  private _initializeStream(
      resultStream: NodeJS.ReadableStream|NodeJS.ReadWriteStream,
      requestTag: string,
      request?: {}): Promise<NodeJS.ReadableStream|NodeJS.ReadWriteStream> {
    /** The last error we received and have not forwarded yet. */
    let errorReceived: Error|null = null;

    /**
     * Whether we have resolved the Promise and returned the stream to the
     * caller.
     */
    let streamReleased = false;

    /**
     * Whether the stream end has been reached. This has to be forwarded to the
     * caller..
     */
    let endCalled = false;

    return new Promise((resolve, reject) => {
      const releaseStream = () => {
        if (errorReceived) {
          logger(
              'Firestore._initializeStream', requestTag,
              'Emit error:', errorReceived);
          resultStream.emit('error', errorReceived);
          errorReceived = null;
        } else if (!streamReleased) {
          logger('Firestore._initializeStream', requestTag, 'Releasing stream');
          streamReleased = true;
          resultStream.pause();

          // Calling 'stream.pause()' only holds up 'data' events and not the
          // 'end' event we intend to forward here. We therefore need to wait
          // until the API consumer registers their listeners (in the .then()
          // call) before emitting any further events.
          resolve(resultStream);

          // We execute the forwarding of the 'end' event via setTimeout() as
          // V8 guarantees that the above the Promise chain is resolved before
          // any calls invoked via setTimeout().
          setTimeout(() => {
            if (endCalled) {
              logger(
                  'Firestore._initializeStream', requestTag,
                  'Forwarding stream close');
              resultStream.emit('end');
            }
          }, 0);
        }
      };

      // We capture any errors received and buffer them until the caller has
      // registered a listener. We register our event handler as early as
      // possible to avoid the default stream behavior (which is just to log and
      // continue).
      resultStream.on('readable', () => {
        releaseStream();
      });

      resultStream.on('end', () => {
        logger(
            'Firestore._initializeStream', requestTag, 'Received stream end');
        endCalled = true;
        releaseStream();
      });

      resultStream.on('error', err => {
        logger(
            'Firestore._initializeStream', requestTag,
            'Received stream error:', err);
        // If we receive an error before we were able to receive any data,
        // reject this stream.
        if (!streamReleased) {
          logger(
              'Firestore._initializeStream', requestTag,
              'Received initial error:', err);
          streamReleased = true;
          reject(err);
        } else {
          errorReceived = err;
        }
      });

      if (request) {
        logger(
            'Firestore._initializeStream', requestTag, 'Sending request: %j',
            request);
        (resultStream as NodeJS.ReadWriteStream)
            .write(request as AnyDuringMigration, 'utf-8', () => {
              logger(
                  'Firestore._initializeStream', requestTag,
                  'Marking stream as healthy');
              releaseStream();
            });
      }
    });
  }

  /**
   * A funnel for all non-streaming API requests, assigning a project ID where
   *  necessary within the request options.
   *
   * @private
   * @param methodName Name of the veneer API endpoint that takes a request
   * and GAX options.
   * @param request The Protobuf request to send.
   * @param requestTag A unique client-assigned identifier for this request.
   * @param allowRetries Whether this is an idempotent request that can be
   * retried.
   * @returns A Promise with the request result.
   */
  request<T>(
      methodName: string, request: {}, requestTag: string,
      allowRetries: boolean): Promise<T> {
    const attempts = allowRetries ? MAX_REQUEST_RETRIES : 1;

    return this._runRequest(gapicClient => {
      const decorated = this._decorateRequest(request);
      return this._retry(attempts, requestTag, () => {
        return new Promise((resolve, reject) => {
          logger(
              'Firestore.request', requestTag, 'Sending request: %j',
              decorated.request);
          gapicClient[methodName](
              decorated.request, decorated.gax, (err, result) => {
                if (err) {
                  logger(
                      'Firestore.request', requestTag, 'Received error:', err);
                  reject(err);
                } else {
                  logger(
                      'Firestore.request', requestTag, 'Received response: %j',
                      result);
                  resolve(result);
                }
              });
        });
      });
    });
  }

  /**
   * A funnel for read-only streaming API requests, assigning a project ID where
   * necessary within the request options.
   *
   * The stream is returned in paused state and needs to be resumed once all
   * listeners are attached.
   *
   * @private
   * @param methodName Name of the streaming Veneer API endpoint that
   * takes a request and GAX options.
   * @param request The Protobuf request to send.
   * @param requestTag A unique client-assigned identifier for this request.
   * @param {boolean} allowRetries Whether this is an idempotent request that
   * can be retried.
   * @returns A Promise with the resulting read-only stream.
   */
  readStream(
      methodName: string, request: {}, requestTag: string,
      allowRetries: boolean): Promise<NodeJS.ReadableStream> {
    const attempts = allowRetries ? MAX_REQUEST_RETRIES : 1;

    return this._runRequest(gapicClient => {
      const decorated = this._decorateRequest(request);
      return this._retry(attempts, requestTag, () => {
        return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
                 try {
                   logger(
                       'Firestore.readStream', requestTag,
                       'Sending request: %j', decorated.request);
                   const stream = gapicClient[methodName](
                       decorated.request, decorated.gax);
                   const logStream = through2.obj(function(
                       this: AnyDuringMigration, chunk, enc, callback) {
                     logger(
                         'Firestore.readStream', requestTag,
                         'Received response: %j', chunk);
                     this.push(chunk);
                     callback();
                   });
                   resolve(bun([stream, logStream]));
                 } catch (err) {
                   logger(
                       'Firestore.readStream', requestTag,
                       'Received error:', err);
                   reject(err);
                 }
               })
            .then(stream => this._initializeStream(stream, requestTag));
      });
    });
  }

  /**
   * A funnel for read-write streaming API requests, assigning a project ID
   * where necessary for all writes.
   *
   * The stream is returned in paused state and needs to be resumed once all
   * listeners are attached.
   *
   * @private
   * @param methodName Name of the streaming Veneer API endpoint that takes
   * GAX options.
   * @param request The Protobuf request to send as the first stream message.
   * @param requestTag A unique client-assigned identifier for this request.
   * @param allowRetries Whether this is an idempotent request that can be
   * retried.
   * @returns A Promise with the resulting read/write stream.
   */
  readWriteStream(
      methodName: string, request: {}, requestTag: string,
      allowRetries: boolean): Promise<NodeJS.ReadWriteStream> {
    const self = this;
    const attempts = allowRetries ? MAX_REQUEST_RETRIES : 1;

    return this._runRequest(gapicClient => {
      const decorated = this._decorateRequest(request);
      return this._retry(attempts, requestTag, () => {
        return Promise.resolve().then(() => {
          logger('Firestore.readWriteStream', requestTag, 'Opening stream');
          const requestStream = gapicClient[methodName](decorated.gax);

          // The transform stream to assign the project ID.
          const transform = through2.obj((chunk, encoding, callback) => {
            const decoratedChunk = extend(true, {}, chunk);
            replaceProjectIdToken(
                decoratedChunk, self._referencePath!.projectId);
            logger(
                'Firestore.readWriteStream', requestTag,
                'Streaming request: %j', decoratedChunk);
            requestStream.write(decoratedChunk, encoding, callback);
          });

          const logStream = through2.obj(function(
              this: AnyDuringMigration, chunk, enc, callback) {
            logger(
                'Firestore.readWriteStream', requestTag,
                'Received response: %j', chunk);
            this.push(chunk);
            callback();
          });

          const resultStream = bun([transform, requestStream, logStream]);
          return this._initializeStream(resultStream, requestTag, request);
        });
      });
    });
  }
}

/**
 * Validates a JavaScript value for usage as a Firestore value.
 *
 * @private
 * @param val JavaScript value to validate.
 * @param path The field path to validate.
 * @param options Validation options
 * @param level The current depth of the traversal. This is used to decide
 * whether deletes are allowed in conjunction with `allowDeletes: root`.
 * @param inArray Whether we are inside an array.
 * @returns 'true' when the object is valid.
 * @throws when the object is invalid.
 */
function validateFieldValue(
    val: AnyJs, options: ValidationOptions, path?: FieldPath, level?: number,
    inArray?: boolean): boolean {
  if (path && path.size > MAX_DEPTH) {
    throw new Error(
        `Input object is deeper than ${MAX_DEPTH} levels or contains a cycle.`);
  }

  level = level || 0;
  inArray = inArray || false;

  const fieldPathMessage = path ? ` (found in field ${path.toString()})` : '';

  if (Array.isArray(val)) {
    const arr = val as AnyDuringMigration[];
    for (let i = 0; i < arr.length; ++i) {
      validateFieldValue(
          arr[i]!, options,
          path ? path.append(String(i)) : new FieldPath(String(i)), level + 1,
          /* inArray= */ true);
    }
  } else if (isPlainObject(val)) {
    const obj = val as object;
    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        validateFieldValue(
            obj[prop]!, options,
            path ? path.append(new FieldPath(prop)) : new FieldPath(prop),
            level + 1, inArray);
      }
    }
  } else if (val === undefined) {
    throw new Error(
        `Cannot use "undefined" as a Firestore value${fieldPathMessage}.`);
  } else if (val instanceof DeleteTransform) {
    if (inArray) {
      throw new Error(`${val.methodName}() cannot be used inside of an array${
          fieldPathMessage}.`);
    } else if (
        (options.allowDeletes === 'root' && level !== 0) ||
        options.allowDeletes === 'none') {
      throw new Error(`${
          val.methodName}() must appear at the top-level and can only be used in update() or set() with {merge:true}${
          fieldPathMessage}.`);
    }
  } else if (val instanceof FieldTransform) {
    if (inArray) {
      throw new Error(`${val.methodName}() cannot be used inside of an array${
          fieldPathMessage}.`);
    } else if (!options.allowTransforms) {
      throw new Error(
          `${val.methodName}() can only be used in set(), create() or update()${
              fieldPathMessage}.`);
    }
  } else if (val instanceof DocumentReference) {
    return true;
  } else if (val instanceof GeoPoint) {
    return true;
  } else if (val instanceof Timestamp) {
    return true;
  } else if (val instanceof FieldPath) {
    throw new Error(
        `Cannot use object of type "FieldPath" as a Firestore value${
            fieldPathMessage}.`);
  } else if (is.object(val)) {
    throw customObjectError(val, path);
  }

  return true;
}

/**
 * Validates a JavaScript object for usage as a Firestore document.
 *
 * @private
 * @param obj JavaScript object to validate.
 * @param options Validation options
 * @returns 'true' when the object is valid.
 * @throws when the object is invalid.
 */
function validateDocumentData(
    obj: DocumentData, options: ValidationOptions): boolean {
  if (!isPlainObject(obj)) {
    throw customObjectError(obj);
  }

  options = options || {};

  let isEmpty = true;

  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      isEmpty = false;
      validateFieldValue(obj[prop], options, new FieldPath(prop));
    }
  }

  if (options.allowEmpty === false && isEmpty) {
    throw new Error('At least one field must be updated.');
  }

  return true;
}

/**
 * Validates the use of 'options' as ReadOptions and enforces that 'fieldMask'
 * is an array of strings or field paths.
 *
 * @private
 * @param options.fieldMask - The subset of fields to return from a read
 * operation.
 */
export function validateReadOptions(options: ReadOptions): boolean {
  if (!is.object(options)) {
    throw new Error('Input is not an object.');
  }

  if (options.fieldMask === undefined) {
    return true;
  }

  if (!Array.isArray(options.fieldMask)) {
    throw new Error('"fieldMask" is not an array.');
  }

  for (let i = 0; i < options.fieldMask.length; ++i) {
    try {
      FieldPath.validateFieldPath(options.fieldMask[i]);
    } catch (err) {
      throw new Error(
          `Element at index ${i} is not a valid FieldPath. ${err.message}`);
    }
  }

  return true;
}

/**
 * A logging function that takes a single string.
 *
 * @callback Firestore~logFunction
 * @param {string} Log message
 */

// tslint:disable-next-line:no-default-export
/**
 * The default export of the `@google-cloud/firestore` package is the
 * {@link Firestore} class.
 *
 * See {@link Firestore} and {@link ClientConfig} for client methods and
 * configuration options.
 *
 * @module {Firestore} @google-cloud/firestore
 * @alias nodejs-firestore
 *
 * @example <caption>Install the client library with <a
 * href="https://www.npmjs.com/">npm</a>:</caption> npm install --save
 * @google-cloud/firestore
 *
 * @example <caption>Import the client library</caption>
 * var Firestore = require('@google-cloud/firestore');
 *
 * @example <caption>Create a client that uses <a
 * href="https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application">Application
 * Default Credentials (ADC)</a>:</caption> var firestore = new Firestore();
 *
 * @example <caption>Create a client with <a
 * href="https://cloud.google.com/docs/authentication/production#obtaining_and_providing_service_account_credentials_manually">explicit
 * credentials</a>:</caption> var firestore = new Firestore({ projectId:
 * 'your-project-id', keyFilename: '/path/to/keyfile.json'
 * });
 *
 * @example <caption>include:samples/quickstart.js</caption>
 * region_tag:firestore_quickstart
 * Full quickstart example:
 */
// tslint:disable-next-line:no-default-export
export default Firestore;

// Horrible hack to ensure backwards compatibility with <= 17.0, which allows
// users to call the default constructor via
// `const Fs = require(`@google-cloud/firestore`); new Fs()`;
const existingExports = module.exports;
module.exports = Firestore;
module.exports = Object.assign(module.exports, existingExports);

/**
 * {@link v1beta1} factory function.
 *
 * @private
 * @name Firestore.v1beta1
 * @see v1beta1
 * @type {function}
 */
Object.defineProperty(module.exports, 'v1beta1', {
  // The v1beta1 module is very large. To avoid pulling it in from static
  // scope, we lazy-load and cache the module.
  get: () => {
    if (!v1beta1) {
      v1beta1 = require('./v1beta1');
    }
    return v1beta1;
  },
});
