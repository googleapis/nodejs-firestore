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

import * as bun from 'bun';
import {CallOptions} from 'google-gax';
import * as through2 from 'through2';

import {google} from '../protos/firestore_proto_api';
import {fieldsFromJson, timestampFromJson} from './convert';
import {
  DocumentSnapshot,
  DocumentSnapshotBuilder,
  QueryDocumentSnapshot,
} from './document';
import {logger, setLibVersion} from './logger';
import {
  DEFAULT_DATABASE_ID,
  FieldPath,
  QualifiedResourcePath,
  ResourcePath,
  validateResourcePath,
} from './path';
import {ClientPool} from './pool';
import {CollectionReference, Query, QueryOptions} from './reference';
import {DocumentReference} from './reference';
import {Serializer} from './serializer';
import {Timestamp} from './timestamp';
import {parseGetAllArguments, Transaction} from './transaction';
import {
  ApiMapValue,
  GapicClient,
  GrpcError,
  ReadOptions,
  Settings,
} from './types';
import {Deferred, requestTag} from './util';
import {
  validateBoolean,
  validateFunction,
  validateInteger,
  validateMinNumberOfArguments,
  validateObject,
  validateString,
} from './validate';
import {WriteBatch} from './write-batch';

import api = google.firestore.v1;

export {
  CollectionReference,
  DocumentReference,
  QuerySnapshot,
  Query,
} from './reference';
export {DocumentSnapshot, QueryDocumentSnapshot} from './document';
export {FieldValue} from './field-value';
export {WriteBatch, WriteResult} from './write-batch';
export {Transaction} from './transaction';
export {Timestamp} from './timestamp';
export {DocumentChange} from './document-change';
export {FieldPath} from './path';
export {GeoPoint} from './geo-point';
export {setLogFunction} from './logger';
export {
  UpdateData,
  DocumentData,
  Settings,
  Precondition,
  SetOptions,
} from './types';

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
 * @namespace google.longrunning
 */
/**
 * @namespace google.firestore.v1
 */
/**
 * @namespace google.firestore.v1beta1
 */
/**
 * @namespace google.firestore.admin.v1
 */

/*!
 * @see v1
 */
let v1: unknown; // Lazy-loaded in `_runRequest()`

/*!
 * @see v1beta1
 */
let v1beta1: unknown; // Lazy-loaded upon access.

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
 * @example
 * const documentRef = firestore.doc('coll/doc');
 *
 * documentRef.get().then(snapshot => {
 *   const updateTime = snapshot.updateTime;
 *
 *   console.log(`Deleting document at update time: ${updateTime.toDate()}`);
 *   return documentRef.delete({ lastUpdateTime: updateTime });
 * });
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
  /**
   * A client pool to distribute requests over multiple GAPIC clients in order
   * to work around a connection limit of 100 concurrent requests per client.
   * @private
   */
  private _clientPool: ClientPool<GapicClient>;

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
   * The serializer to use for the Protobuf transformation.
   * @private
   */
  _serializer: Serializer | null = null;

  /**
   * The project ID for this client.
   *
   * The project ID is auto-detected during the first request unless a project
   * ID is passed to the constructor (or provided via `.settings()`).
   * @private
   */
  private _projectId: string | undefined = undefined;

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
   * @param {boolean=} settings.timestampsInSnapshots Specifies whether to use
   * `Timestamp` objects for timestamp fields in `DocumentSnapshot`s. This is
   * enabled by default and should not be disabled.
   * <br/>Previously, Firestore returned timestamp fields as `Date` but `Date`
   * only supports millisecond precision, which leads to truncation and causes
   * unexpected behavior when using a timestamp from a snapshot as a part of a
   * subsequent query.
   * <br/>So now Firestore returns `Timestamp` values instead of `Date`,
   * avoiding this kind of problem.
   * <br/>To opt into the old behavior of returning `Date` objects, you can
   * temporarily set `timestampsInSnapshots` to false.
   * <br/>WARNING: This setting will be removed in a future release. You should
   * update your code to expect `Timestamp` objects and stop using the
   * `timestampsInSnapshots` setting.
   */
  constructor(settings?: Settings) {
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

    this._clientPool = new ClientPool(
      MAX_CONCURRENT_REQUESTS_PER_CLIENT,
      () => {
        const client = new module.exports.v1(this._settings);
        logger('Firestore', null, 'Initialized Firestore GAPIC Client');
        return client;
      }
    );

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
    validateObject('settings', settings);
    validateString('settings.projectId', settings.projectId, {optional: true});
    validateBoolean(
      'settings.timestampsInSnapshots',
      // tslint:disable-next-line deprecation
      settings.timestampsInSnapshots,
      {optional: true}
    );

    if (this._settingsFrozen) {
      throw new Error(
        'Firestore has already been initialized. You can only call ' +
          'settings() once, and only before calling any other methods on a ' +
          'Firestore object.'
      );
    }

    const mergedSettings = Object.assign({}, this._settings, settings);
    this.validateAndApplySettings(mergedSettings);
    this._settingsFrozen = true;
  }

  private validateAndApplySettings(settings: Settings): void {
    validateBoolean(
      'settings.timestampsInSnapshots',
      // tslint:disable-next-line deprecation
      settings.timestampsInSnapshots,
      {optional: true}
    );

    if (settings && settings.projectId) {
      validateString('settings.projectId', settings.projectId);
      this._projectId = settings.projectId;
    }

    this._settings = settings;
    this._serializer = new Serializer(this);
  }

  /**
   * Returns the Project ID for this Firestore instance. Validates that
   * `initializeIfNeeded()` was called before.
   *
   * @private
   */
  get projectId(): string {
    if (this._projectId === undefined) {
      throw new Error(
        'INTERNAL ERROR: Client is not yet ready to issue requests.'
      );
    }
    return this._projectId;
  }

  /**
   * Returns the root path of the database. Validates that
   * `initializeIfNeeded()` was called before.
   *
   * @private
   */
  get formattedName(): string {
    return `projects/${this.projectId}/databases/${DEFAULT_DATABASE_ID}`;
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
    validateResourcePath('documentPath', documentPath);

    const path = ResourcePath.EMPTY.append(documentPath);
    if (!path.isDocument) {
      throw new Error(
        `Value for argument "documentPath" must point to a document, but was "${documentPath}". Your path does not contain an even number of components.`
      );
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
    validateResourcePath('collectionPath', collectionPath);

    const path = ResourcePath.EMPTY.append(collectionPath);
    if (!path.isCollection) {
      throw new Error(
        `Value for argument "collectionPath" must point to a collection, but was "${collectionPath}". Your path does not contain an odd number of components.`
      );
    }

    return new CollectionReference(this, path);
  }

  /**
   * Creates and returns a new Query that includes all documents in the
   * database that are contained in a collection or subcollection with the
   * given collectionId.
   *
   * @param {string} collectionId Identifies the collections to query over.
   * Every collection or subcollection with this ID as the last segment of its
   * path will be included. Cannot contain a slash.
   * @returns {Query} The created Query.
   *
   * @example
   * let docA = firestore.doc('mygroup/docA').set({foo: 'bar'});
   * let docB = firestore.doc('abc/def/mygroup/docB').set({foo: 'bar'});
   *
   * Promise.all([docA, docB]).then(() => {
   *    let query = firestore.collectionGroup('mygroup');
   *    query = query.where('foo', '==', 'bar');
   *    return query.get().then(snapshot => {
   *       console.log(`Found ${snapshot.size} documents.`);
   *    });
   * });
   */
  collectionGroup(collectionId: string): Query {
    if (collectionId.indexOf('/') !== -1) {
      throw new Error(
        `Invalid collectionId '${collectionId}'. Collection IDs must not contain '/'.`
      );
    }

    return new Query(this, QueryOptions.forCollectionGroupQuery(collectionId));
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
   * `firestore.v1.Document` proto (or from a resource name for missing
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
  snapshot_(
    documentName: string,
    readTime?: google.protobuf.ITimestamp,
    encoding?: 'protobufJS'
  ): DocumentSnapshot;
  snapshot_(
    documentName: string,
    readTime: string,
    encoding: 'json'
  ): DocumentSnapshot;
  snapshot_(
    document: api.IDocument,
    readTime: google.protobuf.ITimestamp,
    encoding?: 'protobufJS'
  ): QueryDocumentSnapshot;
  snapshot_(
    document: {[k: string]: unknown},
    readTime: string,
    encoding: 'json'
  ): QueryDocumentSnapshot;
  snapshot_(
    documentOrName: api.IDocument | {[k: string]: unknown} | string,
    readTime?: google.protobuf.ITimestamp | string,
    encoding?: 'json' | 'protobufJS'
  ): DocumentSnapshot {
    // TODO: Assert that Firestore Project ID is valid.

    let convertTimestamp: (
      timestampValue?: string | google.protobuf.ITimestamp,
      argumentName?: string
    ) => google.protobuf.ITimestamp | undefined;
    let convertFields: (data: ApiMapValue) => ApiMapValue;

    if (encoding === undefined || encoding === 'protobufJS') {
      convertTimestamp = data => data as google.protobuf.ITimestamp;
      convertFields = data => data;
    } else if (encoding === 'json') {
      // Google Cloud Functions calls us with Proto3 JSON format data, which we
      // must convert to Protobuf JS.
      convertTimestamp = timestampFromJson;
      convertFields = fieldsFromJson;
    } else {
      throw new Error(
        `Unsupported encoding format. Expected "json" or "protobufJS", ` +
          `but was "${encoding}".`
      );
    }

    const document = new DocumentSnapshotBuilder();

    if (typeof documentOrName === 'string') {
      document.ref = new DocumentReference(
        this,
        QualifiedResourcePath.fromSlashSeparatedString(documentOrName)
      );
    } else {
      document.ref = new DocumentReference(
        this,
        QualifiedResourcePath.fromSlashSeparatedString(
          documentOrName.name as string
        )
      );
      document.fieldsProto = documentOrName.fields
        ? convertFields(documentOrName.fields as ApiMapValue)
        : {};
      document.createTime = Timestamp.fromProto(
        convertTimestamp(
          documentOrName.createTime as string | google.protobuf.ITimestamp,
          'documentOrName.createTime'
        )!
      );
      document.updateTime = Timestamp.fromProto(
        convertTimestamp(
          documentOrName.updateTime as string | google.protobuf.ITimestamp,
          'documentOrName.updateTime'
        )!
      );
    }

    if (readTime) {
      document.readTime = Timestamp.fromProto(
        convertTimestamp(readTime, 'readTime')!
      );
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
    transactionOptions?: {maxAttempts?: number}
  ): Promise<T> {
    validateFunction('updateFunction', updateFunction);

    if (transactionOptions) {
      validateObject('transactionOptions', transactionOptions);
      validateInteger(
        'transactionOptions.maxAttempts',
        transactionOptions.maxAttempts,
        {optional: true, minValue: 1}
      );
    }

    return this.initializeIfNeeded().then(() =>
      this._runTransaction(updateFunction, transactionOptions)
    );
  }

  _runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>,
    transactionOptions?: {
      maxAttempts?: number;
      previousTransaction?: Transaction;
    }
  ): Promise<T> {
    const defaultAttempts = 5;

    let attemptsRemaining = defaultAttempts;
    let previousTransaction;

    if (transactionOptions) {
      attemptsRemaining = transactionOptions.maxAttempts || attemptsRemaining;
      previousTransaction = transactionOptions.previousTransaction;
    }

    const transaction = new Transaction(this, previousTransaction);
    const requestTag = transaction.requestTag;
    let result: Promise<T>;

    --attemptsRemaining;

    return transaction
      .begin()
      .then(() => {
        const promise = updateFunction(transaction);
        result =
          promise instanceof Promise
            ? promise
            : Promise.reject(
                new Error(
                  'You must return a Promise in your transaction()-callback.'
                )
              );
        return result.catch(err => {
          logger(
            'Firestore.runTransaction',
            requestTag,
            'Rolling back transaction after callback error:',
            err
          );
          // Rollback the transaction and return the failed result.
          return transaction.rollback().then(() => {
            return result;
          });
        });
      })
      .then(() => {
        return transaction
          .commit()
          .then(() => result)
          .catch(err => {
            if (attemptsRemaining > 0) {
              logger(
                'Firestore.runTransaction',
                requestTag,
                `Retrying transaction after error: ${JSON.stringify(err)}.`
              );
              return this._runTransaction(updateFunction, {
                previousTransaction: transaction,
                maxAttempts: attemptsRemaining,
              });
            }
            logger(
              'Firestore.runTransaction',
              requestTag,
              'Exhausted transaction retries, returning error: %s',
              err
            );
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
    const rootDocument = new DocumentReference(this, ResourcePath.EMPTY);
    return rootDocument.listCollections();
  }

  /**
   * Retrieves multiple documents from Firestore.
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
   * let docRef1 = firestore.doc('col/doc1');
   * let docRef2 = firestore.doc('col/doc2');
   *
   * firestore.getAll(docRef1, docRef2, { fieldMask: ['user'] }).then(docs => {
   *   console.log(`First document: ${JSON.stringify(docs[0])}`);
   *   console.log(`Second document: ${JSON.stringify(docs[1])}`);
   * });
   */
  getAll(
    ...documentRefsOrReadOptions: Array<DocumentReference | ReadOptions>
  ): Promise<DocumentSnapshot[]> {
    validateMinNumberOfArguments('Firestore.getAll', arguments, 1);

    const {documents, fieldMask} = parseGetAllArguments(
      documentRefsOrReadOptions
    );
    return this.initializeIfNeeded().then(() =>
      this.getAll_(documents, fieldMask, requestTag())
    );
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
    docRefs: DocumentReference[],
    fieldMask: FieldPath[] | null,
    requestTag: string,
    transactionId?: Uint8Array
  ): Promise<DocumentSnapshot[]> {
    const requestedDocuments = new Set();
    const retrievedDocuments = new Map();

    for (const docRef of docRefs) {
      requestedDocuments.add(docRef.formattedName);
    }

    const request: api.IBatchGetDocumentsRequest = {
      database: this.formattedName,
      transaction: transactionId,
      documents: Array.from(requestedDocuments),
    };

    if (fieldMask) {
      const fieldPaths = fieldMask.map(fieldPath => fieldPath.formattedName);
      request.mask = {fieldPaths};
    }

    const self = this;

    return self
      .readStream('batchGetDocuments', request, requestTag, true)
      .then(stream => {
        return new Promise<DocumentSnapshot[]>((resolve, reject) => {
          stream
            .on('error', err => {
              logger(
                'Firestore.getAll_',
                requestTag,
                'GetAll failed with error:',
                err
              );
              reject(err);
            })
            .on('data', (response: api.IBatchGetDocumentsResponse) => {
              try {
                let document;

                if (response.found) {
                  logger(
                    'Firestore.getAll_',
                    requestTag,
                    'Received document: %s',
                    response.found.name!
                  );
                  document = self.snapshot_(response.found, response.readTime!);
                } else {
                  logger(
                    'Firestore.getAll_',
                    requestTag,
                    'Document missing: %s',
                    response.missing!
                  );
                  document = self.snapshot_(
                    response.missing!,
                    response.readTime!
                  );
                }

                const path = document.ref.path;
                retrievedDocuments.set(path, document);
              } catch (err) {
                logger(
                  'Firestore.getAll_',
                  requestTag,
                  'GetAll failed with exception:',
                  err
                );
                reject(err);
              }
            })
            .on('end', () => {
              logger(
                'Firestore.getAll_',
                requestTag,
                'Received %d results',
                retrievedDocuments.size
              );

              // BatchGetDocuments doesn't preserve document order. We use
              // the request order to sort the resulting documents.
              const orderedDocuments: DocumentSnapshot[] = [];
              for (const docRef of docRefs) {
                const document = retrievedDocuments.get(docRef.path);
                if (document === undefined) {
                  reject(
                    new Error(`Did not receive document for "${docRef.path}".`)
                  );
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
   * Initializes the client if it is not already initialized. All methods in the
   * SDK can be used after this method completes.
   *
   * @private
   * @return A Promise that resolves when the client is initialized.
   */
  async initializeIfNeeded(): Promise<void> {
    if (!this._settingsFrozen) {
      // Nobody should set timestampsInSnapshots anymore, but the error depends
      // on whether they set it to true or false...
      // tslint:disable-next-line deprecation
      if (this._settings.timestampsInSnapshots === true) {
        console.error(`
  The timestampsInSnapshots setting now defaults to true and you no
  longer need to explicitly set it. In a future release, the setting
  will be removed entirely and so it is recommended that you remove it
  from your firestore.settings() call now.`);
        // tslint:disable-next-line deprecation
      } else if (this._settings.timestampsInSnapshots === false) {
        console.error(`
  The timestampsInSnapshots setting will soon be removed. YOU MUST UPDATE
  YOUR CODE.

  To hide this warning, stop using the timestampsInSnapshots setting in your
  firestore.settings({ ... }) call.

  Once you remove the setting, Timestamps stored in Cloud Firestore will be
  read back as Firebase Timestamp objects instead of as system Date objects.
  So you will also need to update code expecting a Date to instead expect a
  Timestamp. For example:

  // Old:
  const date = snapshot.get('created_at');
  // New:
  const timestamp = snapshot.get('created_at');
  const date = timestamp.toDate();

  Please audit all existing usages of Date when you enable the new
  behavior.`);
      }
    }

    this._settingsFrozen = true;

    if (this._projectId === undefined) {
      this._projectId = await this._clientPool.run(gapicClient => {
        return new Promise((resolve, reject) => {
          gapicClient.getProjectId((err: Error, projectId: string) => {
            if (err) {
              logger(
                'Firestore._detectProjectId',
                null,
                'Failed to detect project ID: %s',
                err
              );
              reject(err);
            } else {
              logger(
                'Firestore._detectProjectId',
                null,
                'Detected project ID: %s',
                projectId
              );
              resolve(projectId);
            }
          });
        });
      });
    }
  }

  /**
   * Returns GAX call options that set the cloud resource header.
   * @private
   */
  private createCallOptions(): CallOptions {
    const gaxHeaders: CallOptions = {otherArgs: {headers: {}}};
    gaxHeaders.otherArgs!.headers[CLOUD_RESOURCE_HEADER] = this.formattedName;
    return gaxHeaders;
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
    attemptsRemaining: number,
    requestTag: string,
    func: () => Promise<T>,
    delayMs = 0
  ): Promise<T> {
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
            'Firestore._retry',
            requestTag,
            'Request failed with unrecoverable error:',
            err
          );
          return Promise.reject(err);
        }
        if (attemptsRemaining === 0) {
          logger(
            'Firestore._retry',
            requestTag,
            'Request failed with error:',
            err
          );
          return Promise.reject(err);
        }
        logger(
          'Firestore._retry',
          requestTag,
          'Retrying request that failed with error:',
          err
        );
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
    requestTag: string
  ): Promise<void>;
  private _initializeStream(
    resultStream: NodeJS.ReadWriteStream,
    requestTag: string,
    request: {}
  ): Promise<void>;
  private _initializeStream(
    resultStream: NodeJS.ReadableStream | NodeJS.ReadWriteStream,
    requestTag: string,
    request?: {}
  ): Promise<void> {
    /** The last error we received and have not forwarded yet. */
    let errorReceived: Error | null = null;

    /**
     * Whether we have resolved the Promise and returned the stream to the
     * caller.
     */
    let streamInitialized = false;

    /**
     * Whether the stream end has been reached. This has to be forwarded to the
     * caller..
     */
    let endCalled = false;

    return new Promise((resolve, reject) => {
      const streamReady = () => {
        if (errorReceived) {
          logger(
            'Firestore._initializeStream',
            requestTag,
            'Emit error:',
            errorReceived
          );
          resultStream.emit('error', errorReceived);
          errorReceived = null;
        } else if (!streamInitialized) {
          logger('Firestore._initializeStream', requestTag, 'Releasing stream');
          streamInitialized = true;
          resultStream.pause();

          // Calling 'stream.pause()' only holds up 'data' events and not the
          // 'end' event we intend to forward here. We therefore need to wait
          // until the API consumer registers their listeners (in the .then()
          // call) before emitting any further events.
          resolve();

          // We execute the forwarding of the 'end' event via setTimeout() as
          // V8 guarantees that the above the Promise chain is resolved before
          // any calls invoked via setTimeout().
          setTimeout(() => {
            if (endCalled) {
              logger(
                'Firestore._initializeStream',
                requestTag,
                'Forwarding stream close'
              );
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
        streamReady();
      });

      resultStream.on('end', () => {
        logger(
          'Firestore._initializeStream',
          requestTag,
          'Received stream end'
        );
        endCalled = true;
        streamReady();
      });

      resultStream.on('error', err => {
        logger(
          'Firestore._initializeStream',
          requestTag,
          'Received stream error:',
          err
        );
        // If we receive an error before we were able to receive any data,
        // reject this stream.
        if (!streamInitialized) {
          logger(
            'Firestore._initializeStream',
            requestTag,
            'Received initial error:',
            err
          );
          streamInitialized = true;
          reject(err);
        } else {
          errorReceived = err;
        }
      });

      if (request) {
        logger(
          'Firestore._initializeStream',
          requestTag,
          'Sending request: %j',
          request
        );
        (resultStream as NodeJS.WritableStream)
          // The stream returned by the Gapic library accepts Protobuf
          // messages, but the type information does not expose this.
          // tslint:disable-next-line no-any
          .write(request as any, 'utf-8', () => {
            logger(
              'Firestore._initializeStream',
              requestTag,
              'Marking stream as healthy'
            );
            streamReady();
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
    methodName: string,
    request: {},
    requestTag: string,
    allowRetries: boolean
  ): Promise<T> {
    const attempts = allowRetries ? MAX_REQUEST_RETRIES : 1;
    const callOptions = this.createCallOptions();

    return this._clientPool.run(gapicClient => {
      return this._retry(attempts, requestTag, () => {
        return new Promise((resolve, reject) => {
          logger(
            'Firestore.request',
            requestTag,
            'Sending request: %j',
            request
          );
          gapicClient[methodName](
            request,
            callOptions,
            (err: GrpcError, result: T) => {
              if (err) {
                logger('Firestore.request', requestTag, 'Received error:', err);
                reject(err);
              } else {
                logger(
                  'Firestore.request',
                  requestTag,
                  'Received response: %j',
                  result
                );
                resolve(result);
              }
            }
          );
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
   * @param allowRetries Whether this is an idempotent request that can be
   * retried.
   * @returns A Promise with the resulting read-only stream.
   */
  readStream(
    methodName: string,
    request: {},
    requestTag: string,
    allowRetries: boolean
  ): Promise<NodeJS.ReadableStream> {
    const attempts = allowRetries ? MAX_REQUEST_RETRIES : 1;
    const callOptions = this.createCallOptions();

    const result = new Deferred<NodeJS.ReadableStream>();

    this._clientPool.run(gapicClient => {
      // While we return the stream to the callee early, we don't want to
      // release the GAPIC client until the callee has finished processing the
      // stream.
      const lifetime = new Deferred<void>();

      this._retry(attempts, requestTag, async () => {
        logger(
          'Firestore.readStream',
          requestTag,
          'Sending request: %j',
          request
        );
        const stream = gapicClient[methodName](request, callOptions);
        const logStream = through2.obj(function(this, chunk, enc, callback) {
          logger(
            'Firestore.readStream',
            requestTag,
            'Received response: %j',
            chunk
          );
          this.push(chunk);
          callback();
        });

        const resultStream = bun([stream, logStream]);
        resultStream.on('close', lifetime.resolve);
        resultStream.on('end', lifetime.resolve);
        resultStream.on('error', lifetime.resolve);

        await this._initializeStream(resultStream, requestTag);
        result.resolve(resultStream);
      }).catch(err => {
        lifetime.resolve();
        result.reject(err);
      });

      return lifetime.promise;
    });

    return result.promise;
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
    methodName: string,
    request: {},
    requestTag: string,
    allowRetries: boolean
  ): Promise<NodeJS.ReadWriteStream> {
    const attempts = allowRetries ? MAX_REQUEST_RETRIES : 1;
    const callOptions = this.createCallOptions();

    const result = new Deferred<NodeJS.ReadWriteStream>();

    this._clientPool.run(gapicClient => {
      // While we return the stream to the callee early, we don't want to
      // release the GAPIC client until the callee has finished processing the
      // stream.
      const lifetime = new Deferred<void>();

      this._retry(attempts, requestTag, async () => {
        logger('Firestore.readWriteStream', requestTag, 'Opening stream');
        const requestStream = gapicClient[methodName](callOptions);

        const logStream = through2.obj(function(this, chunk, enc, callback) {
          logger(
            'Firestore.readWriteStream',
            requestTag,
            'Received response: %j',
            chunk
          );
          this.push(chunk);
          callback();
        });

        const resultStream = bun([requestStream, logStream]);
        resultStream.on('close', lifetime.resolve);
        resultStream.on('finish', lifetime.resolve);
        resultStream.on('end', lifetime.resolve);
        resultStream.on('error', lifetime.resolve);

        await this._initializeStream(resultStream, requestTag, request);
        result.resolve(resultStream);
      }).catch(err => {
        lifetime.resolve();
        result.reject(err);
      });

      return lifetime.promise;
    });

    return result.promise;
  }
}

/**
 * A logging function that takes a single string.
 *
 * @callback Firestore~logFunction
 * @param {string} Log message
 */

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

/**
 * {@link v1} factory function.
 *
 * @private
 * @name Firestore.v1
 * @see v1
 * @type {function}
 */
Object.defineProperty(module.exports, 'v1', {
  // The v1 module is very large. To avoid pulling it in from static
  // scope, we lazy-load and cache the module.
  get: () => {
    if (!v1) {
      v1 = require('./v1');
    }
    return v1;
  },
});
