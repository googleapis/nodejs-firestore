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

const deepEqual = require('deep-equal');

import * as bun from 'bun';
import * as extend from 'extend';
import * as through2 from 'through2';

import * as proto from '../protos/firestore_proto_api';

import {DocumentSnapshot, DocumentSnapshotBuilder, QueryDocumentSnapshot} from './document';
import {DocumentChange} from './document-change';
import {Firestore} from './index';
import {logger} from './logger';
import {compare} from './order';
import {FieldPath, ResourcePath, validateFieldPath, validateResourcePath} from './path';
import {Serializer, validateUserInput} from './serializer';
import {Timestamp} from './timestamp';
import {DocumentData, OrderByDirection, Precondition, SetOptions, UpdateData, WhereFilterOp} from './types';
import {autoId, requestTag} from './util';
import {invalidArgumentMessage, validateEnumValue, validateFunction, validateInteger, validateMinNumberOfArguments} from './validate';
import {Watch} from './watch';
import {validateDocumentData, WriteBatch, WriteResult} from './write-batch';

import api = proto.google.firestore.v1;

/**
 * The direction of a `Query.orderBy()` clause is specified as 'desc' or 'asc'
 * (descending or ascending).
 *
 * @private
 */
const directionOperators: {[k: string]: api.StructuredQuery.Direction} = {
  asc: 'ASCENDING',
  desc: 'DESCENDING',
};

/**
 * Filter conditions in a `Query.where()` clause are specified using the
 * strings '<', '<=', '==', '>=', and '>'.
 *
 * @private
 */
const comparisonOperators:
    {[k: string]: api.StructuredQuery.FieldFilter.Operator} = {
      '<': 'LESS_THAN',
      '<=': 'LESS_THAN_OR_EQUAL',
      '==': 'EQUAL',
      '>': 'GREATER_THAN',
      '>=': 'GREATER_THAN_OR_EQUAL',
      'array-contains': 'ARRAY_CONTAINS'
    };

/**
 * onSnapshot() callback that receives a QuerySnapshot.
 *
 * @callback querySnapshotCallback
 * @param {QuerySnapshot} snapshot A query snapshot.
 */

/**
 * onSnapshot() callback that receives a DocumentSnapshot.
 *
 * @callback documentSnapshotCallback
 * @param {DocumentSnapshot} snapshot A document snapshot.
 */

/**
 * onSnapshot() callback that receives an error.
 *
 * @callback errorCallback
 * @param {Error} err An error from a listen.
 */

/**
 * A DocumentReference refers to a document location in a Firestore database
 * and can be used to write, read, or listen to the location. The document at
 * the referenced location may or may not exist. A DocumentReference can
 * also be used to create a
 * [CollectionReference]{@link CollectionReference} to a
 * subcollection.
 *
 * @class
 */
export class DocumentReference {
  /**
   * @private
   * @hideconstructor
   *
   * @param _firestore The Firestore Database client.
   * @param _path The Path of this reference.
   */
  constructor(
      private readonly _firestore: Firestore, readonly _path: ResourcePath) {}

  /**
   * The string representation of the DocumentReference's location.
   * @private
   * @type {string}
   * @name DocumentReference#formattedName
   */
  get formattedName(): string {
    return this._path.formattedName;
  }

  /**
   * The [Firestore]{@link Firestore} instance for the Firestore
   * database (useful for performing transactions, etc.).
   *
   * @type {Firestore}
   * @name DocumentReference#firestore
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   let firestore = documentReference.firestore;
   *   console.log(`Root location for document is ${firestore.formattedName}`);
   * });
   */
  get firestore(): Firestore {
    return this._firestore;
  }

  /**
   * A string representing the path of the referenced document (relative
   * to the root of the database).
   *
   * @type {string}
   * @name DocumentReference#path
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   console.log(`Added document at '${documentReference.path}'`);
   * });
   */
  get path(): string {
    return this._path.relativeName;
  }

  /**
   * The last path element of the referenced document.
   *
   * @type {string}
   * @name DocumentReference#id
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   console.log(`Added document with name '${documentReference.id}'`);
   * });
   */
  get id(): string {
    return this._path.id!;
  }

  /**
   * A reference to the collection to which this DocumentReference belongs.
   *
   * @name DocumentReference#parent
   * @type {CollectionReference}
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   * let collectionRef = documentRef.parent;
   *
   * collectionRef.where('foo', '==', 'bar').get().then(results => {
   *   console.log(`Found ${results.size} matches in parent collection`);
   * }):
   */
  get parent(): CollectionReference {
    return new CollectionReference(this._firestore, this._path.parent()!);
  }

  /**
   * Reads the document referred to by this DocumentReference.
   *
   * @returns {Promise.<DocumentSnapshot>} A Promise resolved with a
   * DocumentSnapshot for the retrieved document on success. For missing
   * documents, DocumentSnapshot.exists will be false. If the get() fails for
   * other reasons, the Promise will be rejected.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   if (documentSnapshot.exists) {
   *     console.log('Document retrieved successfully.');
   *   }
   * });
   */
  get(): Promise<DocumentSnapshot> {
    return this._firestore.getAll(this).then(([result]) => result);
  }

  /**
   * Gets a [CollectionReference]{@link CollectionReference} instance
   * that refers to the collection at the specified path.
   *
   * @param {string} collectionPath A slash-separated path to a collection.
   * @returns {CollectionReference} A reference to the new
   * subcollection.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   * let subcollection = documentRef.collection('subcollection');
   * console.log(`Path to subcollection: ${subcollection.path}`);
   */
  collection(collectionPath: string): CollectionReference {
    validateResourcePath('collectionPath', collectionPath);

    const path = this._path.append(collectionPath);
    if (!path.isCollection) {
      throw new Error(`Argument "collectionPath" must point to a collection, but was "${
          collectionPath}". Your path does not contain an odd number of components.`);
    }

    return new CollectionReference(this._firestore, path);
  }

  /**
   * Fetches the subcollections that are direct children of this document.
   *
   * @returns {Promise.<Array.<CollectionReference>>} A Promise that resolves
   * with an array of CollectionReferences.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.listCollections().then(collections => {
   *   for (let collection of collections) {
   *     console.log(`Found subcollection with id: ${collection.id}`);
   *   }
   * });
   */
  listCollections(): Promise<CollectionReference[]> {
    const request = {parent: this._path.formattedName};

    return this._firestore
        .request<string[]>(
            'listCollectionIds', request, requestTag(),
            /* allowRetries= */ true)
        .then(collectionIds => {
          const collections: CollectionReference[] = [];

          // We can just sort this list using the default comparator since it
          // will only contain collection ids.
          collectionIds.sort();

          for (const collectionId of collectionIds) {
            collections.push(this.collection(collectionId));
          }

          return collections;
        });
  }

  /**
   * Fetches the subcollections that are direct children of this document.
   *
   * @deprecated Use `.listCollections()`.
   *
   * @returns {Promise.<Array.<CollectionReference>>} A Promise that resolves
   * with an array of CollectionReferences.
   */
  getCollections(): Promise<CollectionReference[]> {
    return this.listCollections();
  }

  /**
   * Create a document with the provided object values. This will fail the write
   * if a document exists at its location.
   *
   * @param {DocumentData} data An object that contains the fields and data to
   * serialize as the document.
   * @returns {Promise.<WriteResult>} A Promise that resolves with the
   * write time of this create.
   *
   * @example
   * let documentRef = firestore.collection('col').doc();
   *
   * documentRef.create({foo: 'bar'}).then((res) => {
   *   console.log(`Document created at ${res.updateTime}`);
   * }).catch((err) => {
   *   console.log(`Failed to create document: ${err}`);
   * });
   */
  create(data: DocumentData): Promise<WriteResult> {
    const writeBatch = new WriteBatch(this._firestore);
    return writeBatch.create(this, data).commit().then(([
                                                         writeResult
                                                       ]) => writeResult);
  }

  /**
   * Deletes the document referred to by this `DocumentReference`.
   *
   * A delete for a non-existing document is treated as a success (unless
   * lastUptimeTime is provided).
   *
   * @param {Precondition=} precondition A precondition to enforce for this
   * delete.
   * @param {Timestamp=} precondition.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime. Fails the delete if the
   * document was last updated at a different time.
   * @returns {Promise.<WriteResult>} A Promise that resolves with the
   * delete time.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.delete().then(() => {
   *   console.log('Document successfully deleted.');
   * });
   */
  delete(precondition?: Precondition): Promise<WriteResult> {
    const writeBatch = new WriteBatch(this._firestore);
    return writeBatch.delete(this, precondition)
        .commit()
        .then(([writeResult]) => writeResult);
  }

  /**
   * Writes to the document referred to by this DocumentReference. If the
   * document does not yet exist, it will be created. If you pass
   * [SetOptions]{@link SetOptions}, the provided data can be merged into an
   * existing document.
   *
   * @param {DocumentData} data A map of the fields and values for the document.
   * @param {SetOptions=} options An object to configure the set behavior.
   * @param {boolean=} options.merge If true, set() merges the values specified
   * in its data argument. Fields omitted from this set() call remain untouched.
   * @param {Array.<string|FieldPath>=} options.mergeFields If provided,
   * set() only replaces the specified field paths. Any field path that is not
   * specified is ignored and remains untouched.
   * @returns {Promise.<WriteResult>} A Promise that resolves with the
   * write time of this set.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({foo: 'bar'}).then(res => {
   *   console.log(`Document written at ${res.updateTime}`);
   * });
   */
  set(data: DocumentData, options?: SetOptions): Promise<WriteResult> {
    const writeBatch = new WriteBatch(this._firestore);
    return writeBatch.set(this, data, options).commit().then(([
                                                               writeResult
                                                             ]) => writeResult);
  }

  /**
   * Updates fields in the document referred to by this DocumentReference.
   * If the document doesn't yet exist, the update fails and the returned
   * Promise will be rejected.
   *
   * The update() method accepts either an object with field paths encoded as
   * keys and field values encoded as values, or a variable number of arguments
   * that alternate between field paths and field values.
   *
   * A Precondition restricting this update can be specified as the last
   * argument.
   *
   * @param {UpdateData|string|FieldPath} dataOrField An object containing the
   * fields and values with which to update the document or the path of the
   * first field to update.
   * @param {
   * ...(*|string|FieldPath|Precondition)} preconditionOrValues An alternating
   * list of field paths and values to update or a Precondition to restrict
   * this update.
   * @returns Promise.<WriteResult> A Promise that resolves once the
   * data has been successfully written to the backend.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.update({foo: 'bar'}).then(res => {
   *   console.log(`Document updated at ${res.updateTime}`);
   * });
   */
  update(
      dataOrField: (UpdateData|string|FieldPath),
      ...preconditionOrValues: Array<unknown|string|FieldPath|Precondition>):
      Promise<WriteResult> {
    validateMinNumberOfArguments('DocumentReference.update', arguments, 1);

    const writeBatch = new WriteBatch(this._firestore);
    return writeBatch.update
        .apply(
            writeBatch,
            [this, dataOrField].concat(
                preconditionOrValues) as [DocumentReference, string])
        .commit()
        .then(([writeResult]) => writeResult);
  }

  /**
   * Attaches a listener for DocumentSnapshot events.
   *
   * @param {documentSnapshotCallback} onNext A callback to be called every
   * time a new `DocumentSnapshot` is available.
   * @param {errorCallback=} onError A callback to be called if the listen fails
   * or is cancelled. No further callbacks will occur. If unset, errors will be
   * logged to the console.
   *
   * @returns {function()} An unsubscribe function that can be called to cancel
   * the snapshot listener.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * let unsubscribe = documentRef.onSnapshot(documentSnapshot => {
   *   if (documentSnapshot.exists) {
   *     console.log(documentSnapshot.data());
   *   }
   * }, err => {
   *   console.log(`Encountered error: ${err}`);
   * });
   *
   * // Remove this listener.
   * unsubscribe();
   */
  onSnapshot(
      onNext: (snapshot: DocumentSnapshot) => void,
      onError?: (error: Error) => void): () => void {
    validateFunction('onNext', onNext);
    validateFunction('onError', onError, {optional: true});

    const watch = Watch.forDocument(this);

    return watch.onSnapshot((readTime, size, docs) => {
      for (const document of docs()) {
        if (document.ref.path === this.path) {
          onNext(document);
          return;
        }
      }

      // The document is missing.
      const document = new DocumentSnapshotBuilder();
      document.ref = new DocumentReference(this._firestore, this._path);
      document.readTime = readTime;
      onNext(document.build());
    }, onError || console.error);
  }

  /**
   * Returns true if this `DocumentReference` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `DocumentReference` is equal to the provided
   * value.
   */
  isEqual(other: DocumentReference): boolean {
    return (
        this === other ||
        (other instanceof DocumentReference &&
         this._firestore === other._firestore &&
         this._path.isEqual(other._path)));
  }

  /**
   * Converts this DocumentReference to the Firestore Proto representation.
   *
   * @private
   */
  toProto(): api.IValue {
    return {referenceValue: this.formattedName};
  }
}

/**
 * A Query order-by field.
 *
 * @private
 * @class
 */
class FieldOrder {
  /**
   * @param field The name of a document field (member) on which to order query
   * results.
   * @param direction One of 'ASCENDING' (default) or 'DESCENDING' to
   * set the ordering direction to ascending or descending, respectively.
   */
  constructor(
      readonly field: FieldPath,
      readonly direction: api.StructuredQuery.Direction = 'ASCENDING') {}

  /**
   * Generates the proto representation for this field order.
   * @private
   */
  toProto(): api.StructuredQuery.IOrder {
    return {
      field: {
        fieldPath: this.field.formattedName,
      },
      direction: this.direction,
    };
  }
}

/**
 * A field constraint for a Query where clause.
 *
 * @private
 * @class
 */
class FieldFilter {
  /**
   * @param serializer The Firestore serializer
   * @param field The path of the property value to compare.
   * @param op A comparison operation.
   * @param value The value to which to compare the field for inclusion in a
   * query.
   */
  constructor(
      private readonly serializer: Serializer, readonly field: FieldPath,
      private readonly op: api.StructuredQuery.FieldFilter.Operator,
      private readonly value: unknown) {}

  /**
   * Returns whether this FieldFilter uses an equals comparison.
   *
   * @private
   */
  isInequalityFilter(): boolean {
    switch (this.op) {
      case 'GREATER_THAN':
      case 'GREATER_THAN_OR_EQUAL':
      case 'LESS_THAN':
      case 'LESS_THAN_OR_EQUAL':
        return true;
      default:
        return false;
    }
  }

  /**
   * Generates the proto representation for this field filter.
   *
   * @private
   */
  toProto(): api.StructuredQuery.IFilter {
    if (typeof this.value === 'number' && isNaN(this.value)) {
      return {
        unaryFilter: {
          field: {
            fieldPath: this.field.formattedName,
          },
          op: 'IS_NAN'
        },
      };
    }

    if (this.value === null) {
      return {
        unaryFilter: {
          field: {
            fieldPath: this.field.formattedName,
          },
          op: 'IS_NULL',
        },
      };
    }

    return {
      fieldFilter: {
        field: {
          fieldPath: this.field.formattedName,
        },
        op: this.op,
        value: this.serializer.encodeValue(this.value),
      },
    };
  }
}

/**
 * A QuerySnapshot contains zero or more
 * [QueryDocumentSnapshot]{@link QueryDocumentSnapshot} objects
 * representing the results of a query. The documents can be accessed as an
 * array via the [documents]{@link QuerySnapshot#documents} property
 * or enumerated using the [forEach]{@link QuerySnapshot#forEach}
 * method. The number of documents can be determined via the
 * [empty]{@link QuerySnapshot#empty} and
 * [size]{@link QuerySnapshot#size} properties.
 *
 * @class QuerySnapshot
 */
export class QuerySnapshot {
  private _materializedDocs: QueryDocumentSnapshot[]|null = null;
  private _materializedChanges: DocumentChange[]|null = null;
  private _docs: (() => QueryDocumentSnapshot[])|null = null;
  private _changes: (() => DocumentChange[])|null = null;

  /**
   * @private
   * @hideconstructor
   *
   * @param _query The originating query.
   * @param _readTime The time when this query snapshot was obtained.
   * @param _size The number of documents in the result set.
   * @param docs A callback returning a sorted array of documents matching
   * this query
   * @param changes A callback returning a sorted array of document change
   * events for this snapshot.
   */
  constructor(
      private readonly _query: Query, private readonly _readTime: Timestamp,
      private readonly _size: number, docs: () => QueryDocumentSnapshot[],
      changes: () => DocumentChange[]) {
    this._docs = docs;
    this._changes = changes;
  }

  /**
   * The query on which you called get() or onSnapshot() in order to get this
   * QuerySnapshot.
   *
   * @type {Query}
   * @name QuerySnapshot#query
   * @readonly
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.limit(10).get().then(querySnapshot => {
   *   console.log(`Returned first batch of results`);
   *   let query = querySnapshot.query;
   *   return query.offset(10).get();
   * }).then(() => {
   *   console.log(`Returned second batch of results`);
   * });
   */
  get query(): Query {
    return this._query;
  }

  /**
   * An array of all the documents in this QuerySnapshot.
   *
   * @type {Array.<QueryDocumentSnapshot>}
   * @name QuerySnapshot#docs
   * @readonly
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   let docs = querySnapshot.docs;
   *   for (let doc of docs) {
   *     console.log(`Document found at path: ${doc.ref.path}`);
   *   }
   * });
   */
  get docs(): QueryDocumentSnapshot[] {
    if (this._materializedDocs) {
      return this._materializedDocs!;
    }
    this._materializedDocs = this._docs!();
    this._docs = null;
    return this._materializedDocs!;
  }

  /**
   * True if there are no documents in the QuerySnapshot.
   *
   * @type {boolean}
   * @name QuerySnapshot#empty
   * @readonly
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   if (querySnapshot.empty) {
   *     console.log('No documents found.');
   *   }
   * });
   */
  get empty(): boolean {
    return this._size === 0;
  }

  /**
   * The number of documents in the QuerySnapshot.
   *
   * @type {number}
   * @name QuerySnapshot#size
   * @readonly
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   console.log(`Found ${querySnapshot.size} documents.`);
   * });
   */
  get size(): number {
    return this._size;
  }

  /**
   * The time this query snapshot was obtained.
   *
   * @type {Timestamp}
   * @name QuerySnapshot#readTime
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then((querySnapshot) => {
   *   let readTime = querySnapshot.readTime;
   *   console.log(`Query results returned at '${readTime.toDate()}'`);
   * });
   */
  get readTime(): Timestamp {
    return this._readTime;
  }

  /**
   * Returns an array of the documents changes since the last snapshot. If
   * this is the first snapshot, all documents will be in the list as added
   * changes.
   *
   * @return {Array.<DocumentChange>}
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.onSnapshot(querySnapshot => {
   *   let changes = querySnapshot.docChanges();
   *   for (let change of changes) {
   *     console.log(`A document was ${change.type}.`);
   *   }
   * });
   */
  docChanges(): DocumentChange[] {
    if (this._materializedChanges) {
      return this._materializedChanges!;
    }
    this._materializedChanges = this._changes!();
    this._changes = null;
    return this._materializedChanges!;
  }

  /**
   * Enumerates all of the documents in the QuerySnapshot. This is a convenience
   * method for running the same callback on each {@link QueryDocumentSnapshot}
   * that is returned.
   *
   * @param {function} callback A callback to be called with a
   * [QueryDocumentSnapshot]{@link QueryDocumentSnapshot} for each document in
   * the snapshot.
   * @param {*=} thisArg The `this` binding for the callback..
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Document found at path: ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  forEach(callback: (result: QueryDocumentSnapshot) => void, thisArg?: unknown):
      void {
    validateFunction('callback', callback);

    for (const doc of this.docs) {
      callback.call(thisArg, doc);
    }
  }

  /**
   * Returns true if the document data in this `QuerySnapshot` is equal to the
   * provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `QuerySnapshot` is equal to the provided
   * value.
   */
  isEqual(other: QuerySnapshot): boolean {
    // Since the read time is different on every query read, we explicitly
    // ignore all metadata in this comparison.

    if (this === other) {
      return true;
    }

    if (!(other instanceof QuerySnapshot)) {
      return false;
    }

    if (this._size !== other._size) {
      return false;
    }

    if (!this._query.isEqual(other._query)) {
      return false;
    }

    if (this._materializedDocs && !this._materializedChanges) {
      // If we have only materialized the documents, we compare them first.
      return (
          isArrayEqual(this.docs, other.docs) &&
          isArrayEqual(this.docChanges(), other.docChanges()));
    }

    // Otherwise, we compare the changes first as we expect there to be fewer.
    return (
        isArrayEqual(this.docChanges(), other.docChanges()) &&
        isArrayEqual(this.docs, other.docs));
  }
}

// TODO: As of v0.17.0, we're changing docChanges from an array into a method.
// Because this is a runtime breaking change and somewhat subtle (both Array and
// Function have a .length, etc.), we'll replace commonly-used properties
// (including Symbol.iterator) to throw a custom error message. By our v1.0
// release, we should remove this code.
function throwDocChangesMethodError() {
  throw new Error(
      'QuerySnapshot.docChanges has been changed from a property into a ' +
      'method, so usages like "querySnapshot.docChanges" should become ' +
      '"querySnapshot.docChanges()"');
}

const docChangesPropertiesToOverride = [
  'length', 'forEach', 'map',
  ...(typeof Symbol !== 'undefined' ? [Symbol.iterator] : [])
];
docChangesPropertiesToOverride.forEach(property => {
  Object.defineProperty(
      QuerySnapshot.prototype.docChanges, property,
      {get: () => throwDocChangesMethodError()});
});

/** Internal options to customize the Query class. */
interface QueryOptions {
  startAt?: api.ICursor;
  startAfter?: api.ICursor;
  endAt?: api.ICursor;
  endBefore?: api.ICursor;
  limit?: number;
  offset?: number;
  projection?: api.StructuredQuery.IProjection;
}

/**
 * A Query refers to a query which you can read or stream from. You can also
 * construct refined Query objects by adding filters and ordering.
 *
 * @class Query
 */
export class Query {
  private readonly _serializer: Serializer;

  /**
   * @private
   * @hideconstructor
   *
   * @param _firestore The Firestore Database client.
   * @param _path Path of the collection to be queried.
   * @param _fieldFilters Sequence of fields constraining the results of the
   * query.
   * @param _fieldOrders Sequence of fields to control the order of results.
   * @param _queryOptions Additional query options.
   */
  constructor(
      private readonly _firestore: Firestore, readonly _path: ResourcePath,
      private readonly _fieldFilters: FieldFilter[] = [],
      private readonly _fieldOrders: FieldOrder[] = [],
      private readonly _queryOptions: QueryOptions = {}) {
    this._serializer = new Serializer(_firestore);
  }

  /**
   * Detects the argument type for Firestore cursors.
   *
   * @private
   * @param fieldValuesOrDocumentSnapshot A snapshot of the document or a set
   * of field values.
   * @returns 'true' if the input is a single DocumentSnapshot..
   */
  static _isDocumentSnapshot(fieldValuesOrDocumentSnapshot:
                                 Array<DocumentSnapshot|unknown>): boolean {
    return (
        fieldValuesOrDocumentSnapshot.length === 1 &&
        (fieldValuesOrDocumentSnapshot[0] instanceof DocumentSnapshot));
  }

  /**
   * Extracts field values from the DocumentSnapshot based on the provided
   * field order.
   *
   * @private
   * @param documentSnapshot The document to extract the fields from.
   * @param fieldOrders The field order that defines what fields we should
   * extract.
   * @return {Array.<*>} The field values to use.
   * @private
   */
  static _extractFieldValues(
      documentSnapshot: DocumentSnapshot, fieldOrders: FieldOrder[]) {
    const fieldValues: Array<unknown> = [];

    for (const fieldOrder of fieldOrders) {
      if (FieldPath.documentId().isEqual(fieldOrder.field)) {
        fieldValues.push(documentSnapshot.ref);
      } else {
        const fieldValue = documentSnapshot.get(fieldOrder.field);
        if (fieldValue === undefined) {
          throw new Error(
              `Field "${
                  fieldOrder
                      .field}" is missing in the provided DocumentSnapshot. ` +
              'Please provide a document that contains values for all specified ' +
              'orderBy() and where() constraints.');
        } else {
          fieldValues.push(fieldValue);
        }
      }
    }
    return fieldValues;
  }

  /**
   * The string representation of the Query's location.
   * @private
   */
  get formattedName(): string {
    return this._path.formattedName;
  }

  /**
   * The [Firestore]{@link Firestore} instance for the Firestore
   * database (useful for performing transactions, etc.).
   *
   * @type {Firestore}
   * @name Query#firestore
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   let firestore = documentReference.firestore;
   *   console.log(`Root location for document is ${firestore.formattedName}`);
   * });
   */
  get firestore(): Firestore {
    return this._firestore;
  }

  /**
   * Creates and returns a new [Query]{@link Query} with the additional filter
   * that documents must contain the specified field and that its value should
   * satisfy the relation constraint provided.
   *
   * Returns a new Query that constrains the value of a Document property.
   *
   * This function returns a new (immutable) instance of the Query (rather than
   * modify the existing instance) to impose the filter.
   *
   * @param {string|FieldPath} fieldPath The name of a property value to compare.
   * @param {string} opStr A comparison operation in the form of a string
   * (e.g., "<").
   * @param {*} value The value to which to compare the field for inclusion in
   * a query.
   * @returns {Query} The created Query.
   *
   * @example
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.where('foo', '==', 'bar').get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  where(fieldPath: string|FieldPath, opStr: WhereFilterOp, value: unknown):
      Query {
    validateFieldPath('fieldPath', fieldPath);
    opStr = validateQueryOperator('opStr', opStr, value);
    validateQueryValue('value', value);

    if (this._queryOptions.startAt || this._queryOptions.endAt) {
      throw new Error(
          'Cannot specify a where() filter after calling startAt(), ' +
          'startAfter(), endBefore() or endAt().');
    }

    fieldPath = FieldPath.fromArgument(fieldPath);

    if (FieldPath.documentId().isEqual(fieldPath)) {
      value = this.convertReference(value);
    }

    const combinedFilters = this._fieldFilters.concat(new FieldFilter(
        this._serializer, fieldPath, comparisonOperators[opStr], value));

    return new Query(
        this._firestore, this._path, combinedFilters, this._fieldOrders,
        this._queryOptions);
  }

  /**
   * Creates and returns a new [Query]{@link Query} instance that applies a
   * field mask to the result and returns only the specified subset of fields.
   * You can specify a list of field paths to return, or use an empty list to
   * only return the references of matching documents.
   *
   * This function returns a new (immutable) instance of the Query (rather than
   * modify the existing instance) to impose the field mask.
   *
   * @param {...(string|FieldPath)} fieldPaths The field paths to return.
   * @returns {Query} The created Query.
   *
   * @example
   * let collectionRef = firestore.collection('col');
   * let documentRef = collectionRef.doc('doc');
   *
   * return documentRef.set({x:10, y:5}).then(() => {
   *   return collectionRef.where('x', '>', 5).select('y').get();
   * }).then((res) => {
   *   console.log(`y is ${res.docs[0].get('y')}.`);
   * });
   */
  select(...fieldPaths: Array<string|FieldPath>): Query {
    const fields: api.StructuredQuery.IFieldReference[] = [];

    if (fieldPaths.length === 0) {
      fields.push({fieldPath: FieldPath.documentId().formattedName});
    } else {
      for (let i = 0; i < fieldPaths.length; ++i) {
        validateFieldPath(i, fieldPaths[i]);
        fields.push(
            {fieldPath: FieldPath.fromArgument(fieldPaths[i]).formattedName});
      }
    }

    const options = extend(true, {}, this._queryOptions);
    options.projection = {fields};

    return new Query(
        this._firestore, this._path, this._fieldFilters, this._fieldOrders,
        options);
  }

  /**
   * Creates and returns a new [Query]{@link Query} that's additionally sorted
   * by the specified field, optionally in descending order instead of
   * ascending.
   *
   * This function returns a new (immutable) instance of the Query (rather than
   * modify the existing instance) to impose the field mask.
   *
   * @param {string|FieldPath} fieldPath The field to sort by.
   * @param {string=} directionStr Optional direction to sort by ('asc' or
   * 'desc'). If not specified, order will be ascending.
   * @returns {Query} The created Query.
   *
   * @example
   * let query = firestore.collection('col').where('foo', '>', 42);
   *
   * query.orderBy('foo', 'desc').get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  orderBy(fieldPath: string|FieldPath, directionStr?: OrderByDirection): Query {
    validateFieldPath('fieldPath', fieldPath);
    directionStr = validateQueryOrder('directionStr', directionStr);

    if (this._queryOptions.startAt || this._queryOptions.endAt) {
      throw new Error(
          'Cannot specify an orderBy() constraint after calling ' +
          'startAt(), startAfter(), endBefore() or endAt().');
    }

    const newOrder = new FieldOrder(
        FieldPath.fromArgument(fieldPath),
        directionOperators[directionStr || 'asc']);
    const combinedOrders = this._fieldOrders.concat(newOrder);
    return new Query(
        this._firestore, this._path, this._fieldFilters, combinedOrders,
        this._queryOptions);
  }

  /**
   * Creates and returns a new [Query]{@link Query} that's additionally limited
   * to only return up to the specified number of documents.
   *
   * This function returns a new (immutable) instance of the Query (rather than
   * modify the existing instance) to impose the limit.
   *
   * @param {number} limit The maximum number of items to return.
   * @returns {Query} The created Query.
   *
   * @example
   * let query = firestore.collection('col').where('foo', '>', 42);
   *
   * query.limit(1).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  limit(limit: number): Query {
    validateInteger('limit', limit);

    const options = extend(true, {}, this._queryOptions);
    options.limit = limit;
    return new Query(
        this._firestore, this._path, this._fieldFilters, this._fieldOrders,
        options);
  }

  /**
   * Specifies the offset of the returned results.
   *
   * This function returns a new (immutable) instance of the
   * [Query]{@link Query} (rather than modify the existing instance)
   * to impose the offset.
   *
   * @param {number} offset The offset to apply to the Query results
   * @returns {Query} The created Query.
   *
   * @example
   * let query = firestore.collection('col').where('foo', '>', 42);
   *
   * query.limit(10).offset(20).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  offset(offset: number): Query {
    validateInteger('offset', offset);

    const options = extend(true, {}, this._queryOptions);
    options.offset = offset;
    return new Query(
        this._firestore, this._path, this._fieldFilters, this._fieldOrders,
        options);
  }

  /**
   * Returns true if this `Query` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `Query` is equal to the provided value.
   */
  isEqual(other: Query): boolean {
    if (this === other) {
      return true;
    }

    return (
        other instanceof Query && this._path.isEqual(other._path) &&
        deepEqual(this._fieldFilters, other._fieldFilters, {strict: true}) &&
        deepEqual(this._fieldOrders, other._fieldOrders, {strict: true}) &&
        deepEqual(this._queryOptions, other._queryOptions, {strict: true}));
  }

  /**
   * Computes the backend ordering semantics for DocumentSnapshot cursors.
   *
   * @private
   * @param cursorValuesOrDocumentSnapshot The snapshot of the document or the
   * set of field values to use as the boundary.
   * @returns The implicit ordering semantics.
   */
  private createImplicitOrderBy(cursorValuesOrDocumentSnapshot:
                                    Array<DocumentSnapshot|unknown>):
      FieldOrder[] {
    if (!Query._isDocumentSnapshot(cursorValuesOrDocumentSnapshot)) {
      return this._fieldOrders;
    }

    const fieldOrders = this._fieldOrders.slice();
    let hasDocumentId = false;

    if (fieldOrders.length === 0) {
      // If no explicit ordering is specified, use the first inequality to
      // define an implicit order.
      for (const fieldFilter of this._fieldFilters) {
        if (fieldFilter.isInequalityFilter()) {
          fieldOrders.push(new FieldOrder(fieldFilter.field));
          break;
        }
      }
    } else {
      for (const fieldOrder of fieldOrders) {
        if (FieldPath.documentId().isEqual(fieldOrder.field)) {
          hasDocumentId = true;
        }
      }
    }

    if (!hasDocumentId) {
      // Add implicit sorting by name, using the last specified direction.
      const lastDirection = fieldOrders.length === 0 ?
          directionOperators.ASC :
          fieldOrders[fieldOrders.length - 1].direction;

      fieldOrders.push(new FieldOrder(FieldPath.documentId(), lastDirection));
    }

    return fieldOrders;
  }

  /**
   * Builds a Firestore 'Position' proto message.
   *
   * @private
   * @param {Array.<FieldOrder>} fieldOrders The field orders to use for this
   * cursor.
   * @param {Array.<DocumentSnapshot|*>} cursorValuesOrDocumentSnapshot The
   * snapshot of the document or the set of field values to use as the boundary.
   * @param before Whether the query boundary lies just before or after the
   * provided data.
   * @returns {Object} The proto message.
   */
  private createCursor(
      fieldOrders: FieldOrder[],
      cursorValuesOrDocumentSnapshot: Array<DocumentSnapshot|unknown>,
      before: boolean): api.ICursor {
    let fieldValues;

    if (Query._isDocumentSnapshot(cursorValuesOrDocumentSnapshot)) {
      fieldValues = Query._extractFieldValues(
          cursorValuesOrDocumentSnapshot[0] as DocumentSnapshot, fieldOrders);
    } else {
      fieldValues = cursorValuesOrDocumentSnapshot;
    }

    if (fieldValues.length > fieldOrders.length) {
      throw new Error(
          'Too many cursor values specified. The specified ' +
          'values must match the orderBy() constraints of the query.');
    }

    const options: api.ICursor = {
      values: [],
    };

    if (before) {
      options.before = true;
    }

    for (let i = 0; i < fieldValues.length; ++i) {
      let fieldValue = fieldValues[i];

      if (FieldPath.documentId().isEqual(fieldOrders[i].field)) {
        fieldValue = this.convertReference(fieldValue);
      }

      validateQueryValue(i, fieldValue);
      options.values!.push(this._serializer.encodeValue(fieldValue)!);
    }

    return options;
  }

  /**
   * Validates that a value used with FieldValue.documentId() is either a
   * string or a DocumentReference that is part of the query`s result set.
   * Throws a validation error or returns a DocumentReference that can
   * directly be used in the Query.
   *
   * @param reference The value to validate.
   * @throws If the value cannot be used for this query.
   * @return If valid, returns a DocumentReference that can be used with the
   * query.
   * @private
   */
  private convertReference(val: unknown): DocumentReference {
    let reference: DocumentReference;

    if (typeof val === 'string') {
      reference =
          new DocumentReference(this._firestore, this._path.append(val));
    } else if (val instanceof DocumentReference) {
      reference = val;
      if (!this._path.isPrefixOf(reference._path)) {
        throw new Error(
            `"${reference.path}" is not part of the query result set and ` +
            'cannot be used as a query boundary.');
      }
    } else {
      throw new Error(
          'The corresponding value for FieldPath.documentId() must be a ' +
          'string or a DocumentReference.');
    }

    if (reference._path.parent()!.compareTo(this._path) !== 0) {
      throw new Error(
          'Only a direct child can be used as a query boundary. ' +
          `Found: "${reference.path}".`);
    }
    return reference;
  }

  /**
   * Creates and returns a new [Query]{@link Query} that starts at the provided
   * set of field values relative to the order of the query. The order of the
   * provided values must match the order of the order by clauses of the query.
   *
   * @param {...*|DocumentSnapshot} fieldValuesOrDocumentSnapshot The snapshot
   * of the document the query results should start at or the field values to
   * start this query at, in order of the query's order by.
   * @returns {Query} A query with the new starting point.
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').startAt(42).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  startAt(...fieldValuesOrDocumentSnapshot: Array<DocumentSnapshot|unknown>):
      Query {
    validateMinNumberOfArguments('Query.startAt', arguments, 1);

    const options = extend(true, {}, this._queryOptions);

    const fieldOrders =
        this.createImplicitOrderBy(fieldValuesOrDocumentSnapshot);
    options.startAt =
        this.createCursor(fieldOrders, fieldValuesOrDocumentSnapshot, true);

    return new Query(
        this._firestore, this._path, this._fieldFilters, fieldOrders, options);
  }

  /**
   * Creates and returns a new [Query]{@link Query} that starts after the
   * provided set of field values relative to the order of the query. The order
   * of the provided values must match the order of the order by clauses of the
   * query.
   *
   * @param {...*|DocumentSnapshot} fieldValuesOrDocumentSnapshot The snapshot
   * of the document the query results should start after or the field values to
   * start this query after, in order of the query's order by.
   * @returns {Query} A query with the new starting point.
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').startAfter(42).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  startAfter(...fieldValuesOrDocumentSnapshot: Array<DocumentSnapshot|unknown>):
      Query {
    validateMinNumberOfArguments('Query.startAfter', arguments, 1);

    const options = extend(true, {}, this._queryOptions);

    const fieldOrders =
        this.createImplicitOrderBy(fieldValuesOrDocumentSnapshot);
    options.startAt =
        this.createCursor(fieldOrders, fieldValuesOrDocumentSnapshot, false);

    return new Query(
        this._firestore, this._path, this._fieldFilters, fieldOrders, options);
  }

  /**
   * Creates and returns a new [Query]{@link Query} that ends before the set of
   * field values relative to the order of the query. The order of the provided
   * values must match the order of the order by clauses of the query.
   *
   * @param {...*|DocumentSnapshot} fieldValuesOrDocumentSnapshot The snapshot
   * of the document the query results should end before or the field values to
   * end this query before, in order of the query's order by.
   * @returns {Query} A query with the new ending point.
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').endBefore(42).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  endBefore(...fieldValuesOrDocumentSnapshot: Array<DocumentSnapshot|unknown>):
      Query {
    validateMinNumberOfArguments('Query.endBefore', arguments, 1);

    const options = extend(true, {}, this._queryOptions);

    const fieldOrders =
        this.createImplicitOrderBy(fieldValuesOrDocumentSnapshot);
    options.endAt =
        this.createCursor(fieldOrders, fieldValuesOrDocumentSnapshot, true);

    return new Query(
        this._firestore, this._path, this._fieldFilters, fieldOrders, options);
  }

  /**
   * Creates and returns a new [Query]{@link Query} that ends at the provided
   * set of field values relative to the order of the query. The order of the
   * provided values must match the order of the order by clauses of the query.
   *
   * @param {...*|DocumentSnapshot} fieldValuesOrDocumentSnapshot The snapshot
   * of the document the query results should end at or the field values to end
   * this query at, in order of the query's order by.
   * @returns {Query} A query with the new ending point.
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').endAt(42).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  endAt(...fieldValuesOrDocumentSnapshot: Array<DocumentSnapshot|unknown>):
      Query {
    validateMinNumberOfArguments('Query.endAt', arguments, 1);

    const options = extend(true, {}, this._queryOptions);

    const fieldOrders =
        this.createImplicitOrderBy(fieldValuesOrDocumentSnapshot);
    options.endAt =
        this.createCursor(fieldOrders, fieldValuesOrDocumentSnapshot, false);

    return new Query(
        this._firestore, this._path, this._fieldFilters, fieldOrders, options);
  }

  /**
   * Executes the query and returns the results as a
   * [QuerySnapshot]{@link QuerySnapshot}.
   *
   * @returns {Promise.<QuerySnapshot>} A Promise that resolves with the results
   * of the Query.
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  get(): Promise<QuerySnapshot> {
    return this._get();
  }

  /**
   * Internal get() method that accepts an optional transaction id.
   *
   * @private
   * @param {bytes=} transactionId A transaction ID.
   */
  _get(transactionId?: Uint8Array): Promise<QuerySnapshot> {
    const self = this;
    const docs: QueryDocumentSnapshot[] = [];

    return new Promise((resolve, reject) => {
      let readTime: Timestamp;

      self._stream(transactionId)
          .on('error',
              err => {
                reject(err);
              })
          .on('data',
              result => {
                readTime = result.readTime;
                if (result.document) {
                  const document = result.document;
                  docs.push(document);
                }
              })
          .on('end', () => {
            resolve(new QuerySnapshot(
                this, readTime, docs.length, () => docs, () => {
                  const changes: DocumentChange[] = [];
                  for (let i = 0; i < docs.length; ++i) {
                    changes.push(new DocumentChange('added', docs[i], -1, i));
                  }
                  return changes;
                }));
          });
    });
  }

  /**
   * Executes the query and streams the results as
   * [QueryDocumentSnapshots]{@link QueryDocumentSnapshot}.
   *
   * @returns {Stream.<QueryDocumentSnapshot>} A stream of
   * QueryDocumentSnapshots.
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * let count = 0;
   *
   * query.stream().on('data', (documentSnapshot) => {
   *   console.log(`Found document with name '${documentSnapshot.id}'`);
   *   ++count;
   * }).on('end', () => {
   *   console.log(`Total count is ${count}`);
   * });
   */
  stream(): NodeJS.ReadableStream {
    const responseStream = this._stream();

    const transform = through2.obj(function(this, chunk, encoding, callback) {
      // Only send chunks with documents.
      if (chunk.document) {
        this.push(chunk.document);
      }
      callback();
    });

    return bun([responseStream, transform]);
  }

  /**
   * Internal method for serializing a query to its RunQuery proto
   * representation with an optional transaction id.
   *
   * @param transactionId A transaction ID.
   * @private
   * @returns Serialized JSON for the query.
   */
  toProto(transactionId?: Uint8Array): api.IRunQueryRequest {
    const reqOpts: api.IRunQueryRequest = {
      parent: this._path.parent()!.formattedName,
      structuredQuery: {
        from: [
          {
            collectionId: this._path.id,
          },
        ],
      },
    };

    const structuredQuery = reqOpts.structuredQuery!;

    if (this._fieldFilters.length === 1) {
      structuredQuery.where = this._fieldFilters[0].toProto();
    } else if (this._fieldFilters.length > 1) {
      const filters: api.StructuredQuery.IFilter[] = [];
      for (const fieldFilter of this._fieldFilters) {
        filters.push(fieldFilter.toProto());
      }
      structuredQuery.where = {
        compositeFilter: {
          op: 'AND',
          filters,
        },
      };
    }

    if (this._fieldOrders.length) {
      const orderBy: api.StructuredQuery.IOrder[] = [];
      for (const fieldOrder of this._fieldOrders) {
        orderBy.push(fieldOrder.toProto());
      }
      structuredQuery.orderBy = orderBy;
    }

    if (this._queryOptions.limit) {
      structuredQuery.limit = {value: this._queryOptions.limit};
    }

    structuredQuery.offset = this._queryOptions.offset;
    structuredQuery.startAt = this._queryOptions.startAt;
    structuredQuery.endAt = this._queryOptions.endAt;
    structuredQuery.select = this._queryOptions.projection;

    reqOpts.transaction = transactionId;

    return reqOpts;
  }

  /**
   * Internal streaming method that accepts an optional transaction id.
   *
   * @param transactionId A transaction ID.
   * @private
   * @returns A stream of document results.
   */
  _stream(transactionId?: Uint8Array): NodeJS.ReadableStream {
    const request = this.toProto(transactionId);
    const tag = requestTag();
    const self = this;

    const stream = through2.obj(function(this, proto, enc, callback) {
      const readTime = Timestamp.fromProto(proto.readTime);
      if (proto.document) {
        const document =
            self.firestore.snapshot_(proto.document, proto.readTime);
        this.push({document, readTime});
      } else {
        this.push({readTime});
      }
      callback();
    });

    this._firestore.readStream('runQuery', request, tag, true)
        .then(backendStream => {
          backendStream.on('error', err => {
            logger(
                'Query._stream', tag, 'Query failed with stream error:', err);
            stream.destroy(err);
          });
          backendStream.resume();
          backendStream.pipe(stream);
        })
        .catch(err => {
          stream.destroy(err);
        });

    return stream;
  }

  /**
   * Attaches a listener for QuerySnapshot events.
   *
   * @param {querySnapshotCallback} onNext A callback to be called every time
   * a new [QuerySnapshot]{@link QuerySnapshot} is available.
   * @param {errorCallback=} onError A callback to be called if the listen
   * fails or is cancelled. No further callbacks will occur.
   *
   * @returns {function()} An unsubscribe function that can be called to cancel
   * the snapshot listener.
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * let unsubscribe = query.onSnapshot(querySnapshot => {
   *   console.log(`Received query snapshot of size ${querySnapshot.size}`);
   * }, err => {
   *   console.log(`Encountered error: ${err}`);
   * });
   *
   * // Remove this listener.
   * unsubscribe();
   */
  onSnapshot(
      onNext: (snapshot: QuerySnapshot) => void,
      onError?: (error: Error) => void): () => void {
    validateFunction('onNext', onNext);
    validateFunction('onError', onError, {optional: true});

    const watch = Watch.forQuery(this);

    return watch.onSnapshot((readTime, size, docs, changes) => {
      onNext(new QuerySnapshot(this, readTime, size, docs, changes));
    }, onError || console.error);
  }

  /**
   * Returns a function that can be used to sort QueryDocumentSnapshots
   * according to the sort criteria of this query.
   *
   * @private
   */
  comparator():
      (s1: QueryDocumentSnapshot, s2: QueryDocumentSnapshot) => number {
    return (doc1, doc2) => {
      // Add implicit sorting by name, using the last specified direction.
      const lastDirection: api.StructuredQuery.Direction =
          this._fieldOrders.length === 0 ?
          'ASCENDING' :
          this._fieldOrders[this._fieldOrders.length - 1].direction;
      const orderBys = this._fieldOrders.concat(
          new FieldOrder(FieldPath.documentId(), lastDirection));

      for (const orderBy of orderBys) {
        let comp;
        if (FieldPath.documentId().isEqual(orderBy.field)) {
          comp = doc1.ref._path.compareTo(doc2.ref._path);
        } else {
          const v1 = doc1.protoField(orderBy.field);
          const v2 = doc2.protoField(orderBy.field);
          if (v1 === undefined || v2 === undefined) {
            throw new Error(
                'Trying to compare documents on fields that ' +
                'don\'t exist. Please include the fields you are ordering on ' +
                'in your select() call.');
          }
          comp = compare(v1, v2);
        }

        if (comp !== 0) {
          const direction = orderBy.direction === 'ASCENDING' ? 1 : -1;
          return direction * comp;
        }
      }

      return 0;
    };
  }
}

/**
 * A CollectionReference object can be used for adding documents, getting
 * document references, and querying for documents (using the methods
 * inherited from [Query]{@link Query}).
 *
 * @class
 * @extends Query
 */
export class CollectionReference extends Query {
  /**
   * @private
   * @hideconstructor
   *
   * @param firestore The Firestore Database client.
   * @param path The Path of this collection.
   */
  constructor(firestore: Firestore, path: ResourcePath) {
    super(firestore, path);
  }

  /**
   * The last path element of the referenced collection.
   *
   * @type {string}
   * @name CollectionReference#id
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col/doc/subcollection');
   * console.log(`ID of the subcollection: ${collectionRef.id}`);
   */
  get id(): string {
    return this._path.id!;
  }

  /**
   * A reference to the containing Document if this is a subcollection, else
   * null.
   *
   * @type {DocumentReference}
   * @name CollectionReference#parent
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col/doc/subcollection');
   * let documentRef = collectionRef.parent;
   * console.log(`Parent name: ${documentRef.path}`);
   */
  get parent(): DocumentReference {
    return new DocumentReference(this.firestore, this._path.parent()!);
  }

  /**
   * A string representing the path of the referenced collection (relative
   * to the root of the database).
   *
   * @type {string}
   * @name CollectionReference#path
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col/doc/subcollection');
   * console.log(`Path of the subcollection: ${collectionRef.path}`);
   */
  get path(): string {
    return this._path.relativeName;
  }

  /**
   * Retrieves the list of documents in this collection.
   *
   * The document references returned may include references to "missing
   * documents", i.e. document locations that have no document present but
   * which contain subcollections with documents. Attempting to read such a
   * document reference (e.g. via `.get()` or `.onSnapshot()`) will return a
   * `DocumentSnapshot` whose `.exists` property is false.
   *
   * @return {Promise<DocumentReference[]>} The list of documents in this
   * collection.
   *
   * @example
   * let collectionRef = firestore.collection('col');
   *
   * return collectionRef.listDocuments().then(documentRefs => {
   *    return firestore.getAll(documentRefs);
   * }).then(documentSnapshots => {
   *    for (let documentSnapshot of documentSnapshots) {
   *       if (documentSnapshot.exists) {
   *         console.log(`Found document with data: ${documentSnapshot.id}`);
   *       } else {
   *         console.log(`Found missing document: ${documentSnapshot.id}`);
   *       }
   *    }
   * });
   */
  listDocuments(): Promise<DocumentReference[]> {
    const request: api.IListDocumentsRequest = {
      parent: this._path.parent()!.formattedName,
      collectionId: this.id,
      showMissing: true,
      mask: {fieldPaths: []}
    };

    return this.firestore
        .request<api.IDocument[]>(
            'listDocuments', request, requestTag(), /*allowRetries=*/true)
        .then(documents => {
          // Note that the backend already orders these documents by name,
          // so we do not need to manually sort them.
          return documents.map(doc => {
            const path = ResourcePath.fromSlashSeparatedString(doc.name!);
            return this.doc(path.id!);
          });
        });
  }


  /**
   * Gets a [DocumentReference]{@link DocumentReference} instance that
   * refers to the document at the specified path. If no path is specified, an
   * automatically-generated unique ID will be used for the returned
   * DocumentReference.
   *
   * @param {string=} documentPath A slash-separated path to a document.
   * @returns {DocumentReference} The `DocumentReference`
   * instance.
   *
   * @example
   * let collectionRef = firestore.collection('col');
   * let documentRefWithName = collectionRef.doc('doc');
   * let documentRefWithAutoId = collectionRef.doc();
   * console.log(`Reference with name: ${documentRefWithName.path}`);
   * console.log(`Reference with auto-id: ${documentRefWithAutoId.path}`);
   */
  doc(documentPath?: string): DocumentReference {
    if (arguments.length === 0) {
      documentPath = autoId();
    } else {
      validateResourcePath('documentPath', documentPath!);
    }

    const path = this._path.append(documentPath!);
    if (!path.isDocument) {
      throw new Error(`Argument "documentPath" must point to a document, but was "${
          documentPath}". Your path does not contain an even number of components.`);
    }

    return new DocumentReference(this.firestore, path);
  }

  /**
   * Add a new document to this collection with the specified data, assigning
   * it a document ID automatically.
   *
   * @param {DocumentData} data An Object containing the data for the new
   * document.
   * @returns {Promise.<DocumentReference>} A Promise resolved with a
   * [DocumentReference]{@link DocumentReference} pointing to the
   * newly created document.
   *
   * @example
   * let collectionRef = firestore.collection('col');
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   console.log(`Added document with name: ${documentReference.id}`);
   * });
   */
  add(data: DocumentData): Promise<DocumentReference> {
    validateDocumentData('data', data, /*allowDeletes=*/false);

    const documentRef = this.doc();
    return documentRef.create(data).then(() => documentRef);
  }

  /**
   * Returns true if this `CollectionReference` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `CollectionReference` is equal to the
   * provided value.
   */
  isEqual(other: CollectionReference): boolean {
    return (
        this === other ||
        (other instanceof CollectionReference && super.isEqual(other)));
  }
}

/**
 * Validates the input string as a field order direction.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param op Order direction to validate.
 * @throws when the direction is invalid
 * @return a validated input value, which may be different from the provided
 * value.
 */
export function validateQueryOrder(arg: string, op: unknown): OrderByDirection|
    undefined {
  // For backwards compatibility, we support both lower and uppercase values.
  op = typeof op === 'string' ? op.toLowerCase() : op;
  validateEnumValue(arg, op, Object.keys(directionOperators), {optional: true});
  return op as OrderByDirection | undefined;
}

/**
 * Validates the input string as a field comparison operator.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param op Field comparison operator to validate.
 * @param fieldValue Value that is used in the filter.
 * @throws when the comparison operation is invalid
 * @return a validated input value, which may be different from the provided
 * value.
 */
export function validateQueryOperator(
    arg: string|number, op: unknown, fieldValue: unknown): WhereFilterOp {
  // For backwards compatibility, we support both `=` and `==` for "equals".
  op = op === '=' ? '==' : op;

  validateEnumValue(arg, op, Object.keys(comparisonOperators));

  if (typeof fieldValue === 'number' && isNaN(fieldValue) && op !== '==') {
    throw new Error(
        'Invalid query. You can only perform equals comparisons on NaN.');
  }

  if (fieldValue === null && op !== '==') {
    throw new Error(
        'Invalid query. You can only perform equals comparisons on Null.');
  }

  return op as WhereFilterOp;
}

/**
 * Validates that 'value' is a DocumentReference.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The argument to validate.
 */
export function validateDocumentReference(
    arg: string|number, value: unknown): void {
  if (!(value instanceof DocumentReference)) {
    throw new Error(invalidArgumentMessage(arg, 'DocumentReference'));
  }
}

/**
 * Validates that 'value' can be used as a query value.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The argument to validate.
 */
function validateQueryValue(arg: string|number, value: unknown): void {
  validateUserInput(
      arg, value, 'query constraint',
      {allowDeletes: 'none', allowTransforms: false});
}

/**
 * Verifies euqality for an array of objects using the `isEqual` interface.
 *
 * @private
 * @param left Array of objects supporting `isEqual`.
 * @param right Array of objects supporting `isEqual`.
 * @return True if arrays are equal.
 */
function isArrayEqual<T extends {isEqual: (t: T) => boolean}>(
    left: T[], right: T[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; ++i) {
    if (!left[i].isEqual(right[i])) {
      return false;
    }
  }

  return true;
}
