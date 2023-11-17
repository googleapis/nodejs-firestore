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

import * as firestore from '@google-cloud/firestore';
import * as assert from 'assert';
import {Duplex, Readable, Transform} from 'stream';
import * as deepEqual from 'fast-deep-equal';
import {GoogleError} from 'google-gax';

import * as protos from '../protos/firestore_v1_proto_api';

import {
  DocumentSnapshot,
  DocumentSnapshotBuilder,
  QueryDocumentSnapshot,
} from './document';
import {DocumentChange} from './document-change';
import {Firestore} from './index';
import {logger} from './logger';
import {compare} from './order';
import {
  FieldPath,
  QualifiedResourcePath,
  ResourcePath,
  validateFieldPath,
  validateResourcePath,
} from './path';
import {Serializable, Serializer, validateUserInput} from './serializer';
import {Timestamp} from './timestamp';
import {defaultConverter} from './types';
import {
  autoId,
  Deferred,
  getTotalTimeout,
  isPermanentRpcError,
  mapToArray,
  requestTag,
  wrapError,
} from './util';
import {
  invalidArgumentMessage,
  validateEnumValue,
  validateFunction,
  validateInteger,
  validateMinNumberOfArguments,
} from './validate';
import {DocumentWatch, QueryWatch} from './watch';
import {validateDocumentData, WriteBatch, WriteResult} from './write-batch';
import api = protos.google.firestore.v1;
import {CompositeFilter, Filter, UnaryFilter} from './filter';
import {AggregateField, Aggregate, AggregateSpec} from './aggregate';

/**
 * The direction of a `Query.orderBy()` clause is specified as 'desc' or 'asc'
 * (descending or ascending).
 *
 * @private
 * @internal
 */
const directionOperators: {[k: string]: api.StructuredQuery.Direction} = {
  asc: 'ASCENDING',
  desc: 'DESCENDING',
};

/**
 * Filter conditions in a `Query.where()` clause are specified using the
 * strings '<', '<=', '==', '!=', '>=', '>', 'array-contains', 'in', 'not-in',
 * and 'array-contains-any'.
 *
 * @private
 * @internal
 */
const comparisonOperators: {
  [k: string]: api.StructuredQuery.FieldFilter.Operator;
} = {
  '<': 'LESS_THAN',
  '<=': 'LESS_THAN_OR_EQUAL',
  '==': 'EQUAL',
  '!=': 'NOT_EQUAL',
  '>': 'GREATER_THAN',
  '>=': 'GREATER_THAN_OR_EQUAL',
  'array-contains': 'ARRAY_CONTAINS',
  in: 'IN',
  'not-in': 'NOT_IN',
  'array-contains-any': 'ARRAY_CONTAINS_ANY',
};

const NOOP_MESSAGE = Symbol('a noop message');

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
 * @class DocumentReference
 */
export class DocumentReference<
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData,
  >
  implements
    Serializable,
    firestore.DocumentReference<AppModelType, DbModelType>
{
  /**
   * @private
   *
   * @private
   * @param _firestore The Firestore Database client.
   * @param _path The Path of this reference.
   * @param _converter The converter to use when serializing data.
   */
  constructor(
    private readonly _firestore: Firestore,
    /** @private */
    readonly _path: ResourcePath,
    /** @private */
    readonly _converter = defaultConverter<AppModelType, DbModelType>()
  ) {}

  /**
   * The string representation of the DocumentReference's location.
   * @private
   * @internal
   * @type {string}
   * @name DocumentReference#formattedName
   */
  get formattedName(): string {
    const projectId = this.firestore.projectId;
    const databaseId = this.firestore.databaseId;
    return this._path.toQualifiedResourcePath(projectId, databaseId)
      .formattedName;
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
   * ```
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   let firestore = documentReference.firestore;
   *   console.log(`Root location for document is ${firestore.formattedName}`);
   * });
   * ```
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
   * ```
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   console.log(`Added document at '${documentReference.path}'`);
   * });
   * ```
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
   * ```
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   console.log(`Added document with name '${documentReference.id}'`);
   * });
   * ```
   */
  get id(): string {
    return this._path.id!;
  }

  /**
   * Returns a resource path for this document.
   * @private
   * @internal
   */
  get _resourcePath(): ResourcePath {
    return this._path;
  }

  /**
   * A reference to the collection to which this DocumentReference belongs.
   *
   * @name DocumentReference#parent
   * @type {CollectionReference}
   * @readonly
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   * let collectionRef = documentRef.parent;
   *
   * collectionRef.where('foo', '==', 'bar').get().then(results => {
   *   console.log(`Found ${results.size} matches in parent collection`);
   * }):
   * ```
   */
  get parent(): CollectionReference<AppModelType, DbModelType> {
    return new CollectionReference<AppModelType, DbModelType>(
      this._firestore,
      this._path.parent()!,
      this._converter
    );
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
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   if (documentSnapshot.exists) {
   *     console.log('Document retrieved successfully.');
   *   }
   * });
   * ```
   */
  get(): Promise<DocumentSnapshot<AppModelType, DbModelType>> {
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
   * ```
   * let documentRef = firestore.doc('col/doc');
   * let subcollection = documentRef.collection('subcollection');
   * console.log(`Path to subcollection: ${subcollection.path}`);
   * ```
   */
  collection(collectionPath: string): CollectionReference {
    validateResourcePath('collectionPath', collectionPath);

    const path = this._path.append(collectionPath);
    if (!path.isCollection) {
      throw new Error(
        `Value for argument "collectionPath" must point to a collection, but was "${collectionPath}". Your path does not contain an odd number of components.`
      );
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
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.listCollections().then(collections => {
   *   for (let collection of collections) {
   *     console.log(`Found subcollection with id: ${collection.id}`);
   *   }
   * });
   * ```
   */
  listCollections(): Promise<Array<CollectionReference>> {
    const tag = requestTag();
    return this.firestore.initializeIfNeeded(tag).then(() => {
      const request: api.IListCollectionIdsRequest = {
        parent: this.formattedName,
        // Setting `pageSize` to an arbitrarily large value lets the backend cap
        // the page size (currently to 300). Note that the backend rejects
        // MAX_INT32 (b/146883794).
        pageSize: Math.pow(2, 16) - 1,
      };
      return this._firestore
        .request<api.IListCollectionIdsRequest, string[]>(
          'listCollectionIds',
          request,
          tag
        )
        .then(collectionIds => {
          const collections: Array<CollectionReference> = [];

          // We can just sort this list using the default comparator since it
          // will only contain collection ids.
          collectionIds.sort();

          for (const collectionId of collectionIds) {
            collections.push(this.collection(collectionId));
          }

          return collections;
        });
    });
  }

  /**
   * Create a document with the provided object values. This will fail the write
   * if a document exists at its location.
   *
   * @param {DocumentData} data An object that contains the fields and data to
   * serialize as the document.
   * @throws {Error} If the provided input is not a valid Firestore document or if the document already exists.
   * @returns {Promise.<WriteResult>} A Promise that resolves with the
   * write time of this create.
   *
   * @example
   * ```
   * let documentRef = firestore.collection('col').doc();
   *
   * documentRef.create({foo: 'bar'}).then((res) => {
   *   console.log(`Document created at ${res.updateTime}`);
   * }).catch((err) => {
   *   console.log(`Failed to create document: ${err}`);
   * });
   * ```
   */
  create(data: firestore.WithFieldValue<AppModelType>): Promise<WriteResult> {
    const writeBatch = new WriteBatch(this._firestore);
    return writeBatch
      .create(this, data)
      .commit()
      .then(([writeResult]) => writeResult);
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
   * @param {boolean=} precondition.exists If set, enforces that the target
   * document must or must not exist.
   * @returns {Promise.<WriteResult>} A Promise that resolves with the
   * delete time.
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.delete().then(() => {
   *   console.log('Document successfully deleted.');
   * });
   * ```
   */
  delete(precondition?: firestore.Precondition): Promise<WriteResult> {
    const writeBatch = new WriteBatch(this._firestore);
    return writeBatch
      .delete(this, precondition)
      .commit()
      .then(([writeResult]) => writeResult);
  }

  set(
    data: firestore.PartialWithFieldValue<AppModelType>,
    options: firestore.SetOptions
  ): Promise<WriteResult>;
  set(data: firestore.WithFieldValue<AppModelType>): Promise<WriteResult>;
  /**
   * Writes to the document referred to by this DocumentReference. If the
   * document does not yet exist, it will be created. If you pass
   * [SetOptions]{@link SetOptions}, the provided data can be merged into an
   * existing document.
   *
   * @param {T|Partial<AppModelType>} data A map of the fields and values for
   * the document.
   * @param {SetOptions=} options An object to configure the set behavior.
   * @param {boolean=} options.merge If true, set() merges the values specified
   * in its data argument. Fields omitted from this set() call remain untouched.
   * If your input sets any field to an empty map, all nested fields are
   * overwritten.
   * @param {Array.<string|FieldPath>=} options.mergeFields If provided,
   * set() only replaces the specified field paths. Any field path that is not
   * specified is ignored and remains untouched. If your input sets any field to
   * an empty map, all nested fields are overwritten.
   * @throws {Error} If the provided input is not a valid Firestore document.
   * @returns {Promise.<WriteResult>} A Promise that resolves with the
   * write time of this set.
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({foo: 'bar'}).then(res => {
   *   console.log(`Document written at ${res.updateTime}`);
   * });
   * ```
   */
  set(
    data: firestore.PartialWithFieldValue<AppModelType>,
    options?: firestore.SetOptions
  ): Promise<WriteResult> {
    let writeBatch = new WriteBatch(this._firestore);
    if (options) {
      writeBatch = writeBatch.set(this, data, options);
    } else {
      writeBatch = writeBatch.set(
        this,
        data as firestore.WithFieldValue<AppModelType>
      );
    }
    return writeBatch.commit().then(([writeResult]) => writeResult);
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
   * @throws {Error} If the provided input is not valid Firestore data.
   * @returns {Promise.<WriteResult>} A Promise that resolves once the
   * data has been successfully written to the backend.
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.update({foo: 'bar'}).then(res => {
   *   console.log(`Document updated at ${res.updateTime}`);
   * });
   * ```
   */
  update(
    dataOrField:
      | firestore.UpdateData<DbModelType>
      | string
      | firestore.FieldPath,
    ...preconditionOrValues: Array<
      unknown | string | firestore.FieldPath | firestore.Precondition
    >
  ): Promise<WriteResult> {
    // eslint-disable-next-line prefer-rest-params
    validateMinNumberOfArguments('DocumentReference.update', arguments, 1);

    const writeBatch = new WriteBatch(this._firestore);
    return writeBatch
      .update(this, dataOrField, ...preconditionOrValues)
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
   * ```
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
   * ```
   */
  onSnapshot(
    onNext: (
      snapshot: firestore.DocumentSnapshot<AppModelType, DbModelType>
    ) => void,
    onError?: (error: Error) => void
  ): () => void {
    validateFunction('onNext', onNext);
    validateFunction('onError', onError, {optional: true});

    const watch: DocumentWatch<AppModelType, DbModelType> =
      new (require('./watch').DocumentWatch)(this.firestore, this);
    return watch.onSnapshot((readTime, size, docs) => {
      for (const document of docs()) {
        if (document.ref.path === this.path) {
          onNext(document);
          return;
        }
      }

      // The document is missing.
      const ref = new DocumentReference(
        this._firestore,
        this._path,
        this._converter
      );
      const document = new DocumentSnapshotBuilder<AppModelType, DbModelType>(
        ref
      );
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
  isEqual(
    other: firestore.DocumentReference<AppModelType, DbModelType>
  ): boolean {
    return (
      this === other ||
      (other instanceof DocumentReference &&
        this._firestore === other._firestore &&
        this._path.isEqual(other._path) &&
        this._converter === other._converter)
    );
  }

  /**
   * Converts this DocumentReference to the Firestore Proto representation.
   *
   * @private
   * @internal
   */
  toProto(): api.IValue {
    return {referenceValue: this.formattedName};
  }

  withConverter(converter: null): DocumentReference;
  withConverter<
    NewAppModelType,
    NewDbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    converter: firestore.FirestoreDataConverter<NewAppModelType, NewDbModelType>
  ): DocumentReference<NewAppModelType, NewDbModelType>;
  /**
   * Applies a custom data converter to this DocumentReference, allowing you to
   * use your own custom model objects with Firestore. When you call set(),
   * get(), etc. on the returned DocumentReference instance, the provided
   * converter will convert between Firestore data of type `NewDbModelType` and
   * your custom type `NewAppModelType`.
   *
   * Using the converter allows you to specify generic type arguments when
   * storing and retrieving objects from Firestore.
   *
   * Passing in `null` as the converter parameter removes the current
   * converter.
   *
   * @example
   * ```
   * class Post {
   *   constructor(readonly title: string, readonly author: string) {}
   *
   *   toString(): string {
   *     return this.title + ', by ' + this.author;
   *   }
   * }
   *
   * const postConverter = {
   *   toFirestore(post: Post): FirebaseFirestore.DocumentData {
   *     return {title: post.title, author: post.author};
   *   },
   *   fromFirestore(
   *     snapshot: FirebaseFirestore.QueryDocumentSnapshot
   *   ): Post {
   *     const data = snapshot.data();
   *     return new Post(data.title, data.author);
   *   }
   * };
   *
   * const postSnap = await Firestore()
   *   .collection('posts')
   *   .withConverter(postConverter)
   *   .doc().get();
   * const post = postSnap.data();
   * if (post !== undefined) {
   *   post.title; // string
   *   post.toString(); // Should be defined
   *   post.someNonExistentProperty; // TS error
   * }
   *
   * ```
   * @param {FirestoreDataConverter | null} converter Converts objects to and
   * from Firestore. Passing in `null` removes the current converter.
   * @return A DocumentReference that uses the provided converter.
   */
  withConverter<
    NewAppModelType,
    NewDbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    converter: firestore.FirestoreDataConverter<
      NewAppModelType,
      NewDbModelType
    > | null
  ): DocumentReference<NewAppModelType, NewDbModelType> {
    return new DocumentReference<NewAppModelType, NewDbModelType>(
      this.firestore,
      this._path,
      converter ?? defaultConverter()
    );
  }
}

/**
 * A Query order-by field.
 *
 * @private
 * @internal
 * @class
 */
export class FieldOrder {
  /**
   * @param field The name of a document field (member) on which to order query
   * results.
   * @param direction One of 'ASCENDING' (default) or 'DESCENDING' to
   * set the ordering direction to ascending or descending, respectively.
   */
  constructor(
    readonly field: FieldPath,
    readonly direction: api.StructuredQuery.Direction = 'ASCENDING'
  ) {}

  /**
   * Generates the proto representation for this field order.
   * @private
   * @internal
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

abstract class FilterInternal {
  /** Returns a list of all field filters that are contained within this filter */
  abstract getFlattenedFilters(): FieldFilterInternal[];

  /** Returns a list of all filters that are contained within this filter */
  abstract getFilters(): FilterInternal[];

  /** Returns the proto representation of this filter */
  abstract toProto(): Filter;

  abstract isEqual(other: FilterInternal): boolean;
}

class CompositeFilterInternal extends FilterInternal {
  constructor(
    private filters: FilterInternal[],
    private operator: api.StructuredQuery.CompositeFilter.Operator
  ) {
    super();
  }

  // Memoized list of all field filters that can be found by traversing the tree of filters
  // contained in this composite filter.
  private memoizedFlattenedFilters: FieldFilterInternal[] | null = null;

  public getFilters(): FilterInternal[] {
    return this.filters;
  }

  public isConjunction(): boolean {
    return this.operator === 'AND';
  }

  public getFlattenedFilters(): FieldFilterInternal[] {
    if (this.memoizedFlattenedFilters !== null) {
      return this.memoizedFlattenedFilters;
    }

    this.memoizedFlattenedFilters = this.filters.reduce(
      (allFilters: FieldFilterInternal[], subfilter: FilterInternal) =>
        allFilters.concat(subfilter.getFlattenedFilters()),
      []
    );

    return this.memoizedFlattenedFilters;
  }

  public toProto(): api.StructuredQuery.IFilter {
    if (this.filters.length === 1) {
      return this.filters[0].toProto();
    }

    const proto: api.StructuredQuery.IFilter = {
      compositeFilter: {
        op: this.operator,
        filters: this.filters.map(filter => filter.toProto()),
      },
    };

    return proto;
  }

  isEqual(other: FilterInternal): boolean {
    if (other instanceof CompositeFilterInternal) {
      const otherFilters = other.getFilters();
      return (
        this.operator === other.operator &&
        this.getFilters().length === other.getFilters().length &&
        this.getFilters().every((filter, index) =>
          filter.isEqual(otherFilters[index])
        )
      );
    } else {
      return false;
    }
  }
}

/**
 * A field constraint for a Query where clause.
 *
 * @private
 * @internal
 * @class
 */
class FieldFilterInternal extends FilterInternal {
  public getFlattenedFilters(): FieldFilterInternal[] {
    return [this];
  }

  public getFilters(): FilterInternal[] {
    return [this];
  }

  /**
   * @param serializer The Firestore serializer
   * @param field The path of the property value to compare.
   * @param op A comparison operation.
   * @param value The value to which to compare the field for inclusion in a
   * query.
   */
  constructor(
    private readonly serializer: Serializer,
    readonly field: FieldPath,
    private readonly op: api.StructuredQuery.FieldFilter.Operator,
    private readonly value: unknown
  ) {
    super();
  }

  /**
   * Returns whether this FieldFilter uses an equals comparison.
   *
   * @private
   * @internal
   */
  isInequalityFilter(): boolean {
    switch (this.op) {
      case 'GREATER_THAN':
      case 'GREATER_THAN_OR_EQUAL':
      case 'LESS_THAN':
      case 'LESS_THAN_OR_EQUAL':
      case 'NOT_EQUAL':
      case 'NOT_IN':
        return true;
      default:
        return false;
    }
  }

  /**
   * Generates the proto representation for this field filter.
   *
   * @private
   * @internal
   */
  toProto(): api.StructuredQuery.IFilter {
    if (typeof this.value === 'number' && isNaN(this.value)) {
      return {
        unaryFilter: {
          field: {
            fieldPath: this.field.formattedName,
          },
          op: this.op === 'EQUAL' ? 'IS_NAN' : 'IS_NOT_NAN',
        },
      };
    }

    if (this.value === null) {
      return {
        unaryFilter: {
          field: {
            fieldPath: this.field.formattedName,
          },
          op: this.op === 'EQUAL' ? 'IS_NULL' : 'IS_NOT_NULL',
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

  isEqual(other: FilterInternal): boolean {
    return (
      other instanceof FieldFilterInternal &&
      this.field.isEqual(other.field) &&
      this.op === other.op &&
      deepEqual(this.value, other.value)
    );
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
export class QuerySnapshot<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> implements firestore.QuerySnapshot<AppModelType, DbModelType>
{
  private _materializedDocs: Array<
    QueryDocumentSnapshot<AppModelType, DbModelType>
  > | null = null;
  private _materializedChanges: Array<
    DocumentChange<AppModelType, DbModelType>
  > | null = null;
  private _docs:
    | (() => Array<QueryDocumentSnapshot<AppModelType, DbModelType>>)
    | null = null;
  private _changes:
    | (() => Array<DocumentChange<AppModelType, DbModelType>>)
    | null = null;

  /**
   * @private
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
    private readonly _query: Query<AppModelType, DbModelType>,
    private readonly _readTime: Timestamp,
    private readonly _size: number,
    docs: () => Array<QueryDocumentSnapshot<AppModelType, DbModelType>>,
    changes: () => Array<DocumentChange<AppModelType, DbModelType>>
  ) {
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
   * ```
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.limit(10).get().then(querySnapshot => {
   *   console.log(`Returned first batch of results`);
   *   let query = querySnapshot.query;
   *   return query.offset(10).get();
   * }).then(() => {
   *   console.log(`Returned second batch of results`);
   * });
   * ```
   */
  get query(): Query<AppModelType, DbModelType> {
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
   * ```
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   let docs = querySnapshot.docs;
   *   for (let doc of docs) {
   *     console.log(`Document found at path: ${doc.ref.path}`);
   *   }
   * });
   * ```
   */
  get docs(): Array<QueryDocumentSnapshot<AppModelType, DbModelType>> {
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
   * ```
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   if (querySnapshot.empty) {
   *     console.log('No documents found.');
   *   }
   * });
   * ```
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
   * ```
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   console.log(`Found ${querySnapshot.size} documents.`);
   * });
   * ```
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
   * ```
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then((querySnapshot) => {
   *   let readTime = querySnapshot.readTime;
   *   console.log(`Query results returned at '${readTime.toDate()}'`);
   * });
   * ```
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
   * ```
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.onSnapshot(querySnapshot => {
   *   let changes = querySnapshot.docChanges();
   *   for (let change of changes) {
   *     console.log(`A document was ${change.type}.`);
   *   }
   * });
   * ```
   */
  docChanges(): Array<DocumentChange<AppModelType, DbModelType>> {
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
   * ```
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Document found at path: ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  forEach(
    callback: (
      result: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>
    ) => void,
    thisArg?: unknown
  ): void {
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
  isEqual(other: firestore.QuerySnapshot<AppModelType, DbModelType>): boolean {
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
        isArrayEqual(this.docChanges(), other.docChanges())
      );
    }

    // Otherwise, we compare the changes first as we expect there to be fewer.
    return (
      isArrayEqual(this.docChanges(), other.docChanges()) &&
      isArrayEqual(this.docs, other.docs)
    );
  }
}

/** Internal representation of a query cursor before serialization. */
interface QueryCursor {
  before: boolean;
  values: api.IValue[];
}

/*!
 * Denotes whether a provided limit is applied to the beginning or the end of
 * the result set.
 */
enum LimitType {
  First,
  Last,
}

/**
 * Internal class representing custom Query options.
 *
 * These options are immutable. Modified options can be created using `with()`.
 * @private
 * @internal
 */
export class QueryOptions<
  AppModelType,
  DbModelType extends firestore.DocumentData,
> {
  constructor(
    readonly parentPath: ResourcePath,
    readonly collectionId: string,
    readonly converter: firestore.FirestoreDataConverter<
      AppModelType,
      DbModelType
    >,
    readonly allDescendants: boolean,
    readonly filters: FilterInternal[],
    readonly fieldOrders: FieldOrder[],
    readonly startAt?: QueryCursor,
    readonly endAt?: QueryCursor,
    readonly limit?: number,
    readonly limitType?: LimitType,
    readonly offset?: number,
    readonly projection?: api.StructuredQuery.IProjection,
    // Whether to select all documents under `parentPath`. By default, only
    // collections that match `collectionId` are selected.
    readonly kindless = false,
    // Whether to require consistent documents when restarting the query. By
    // default, restarting the query uses the readTime offset of the original
    // query to provide consistent results.
    readonly requireConsistency = true
  ) {}

  /**
   * Returns query options for a collection group query.
   * @private
   * @internal
   */
  static forCollectionGroupQuery<
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    collectionId: string,
    converter = defaultConverter<AppModelType, DbModelType>()
  ): QueryOptions<AppModelType, DbModelType> {
    return new QueryOptions<AppModelType, DbModelType>(
      /*parentPath=*/ ResourcePath.EMPTY,
      collectionId,
      converter,
      /*allDescendants=*/ true,
      /*fieldFilters=*/ [],
      /*fieldOrders=*/ []
    );
  }

  /**
   * Returns query options for a single-collection query.
   * @private
   * @internal
   */
  static forCollectionQuery<
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    collectionRef: ResourcePath,
    converter = defaultConverter<AppModelType, DbModelType>()
  ): QueryOptions<AppModelType, DbModelType> {
    return new QueryOptions<AppModelType, DbModelType>(
      collectionRef.parent()!,
      collectionRef.id!,
      converter,
      /*allDescendants=*/ false,
      /*fieldFilters=*/ [],
      /*fieldOrders=*/ []
    );
  }

  /**
   * Returns query options for a query that fetches all descendants under the
   * specified reference.
   *
   * @private
   * @internal
   */
  static forKindlessAllDescendants(
    parent: ResourcePath,
    id: string,
    requireConsistency = true
  ): QueryOptions<firestore.DocumentData, firestore.DocumentData> {
    let options = new QueryOptions<
      firestore.DocumentData,
      firestore.DocumentData
    >(
      parent,
      id,
      defaultConverter(),
      /*allDescendants=*/ true,
      /*fieldFilters=*/ [],
      /*fieldOrders=*/ []
    );

    options = options.with({
      kindless: true,
      requireConsistency,
    });
    return options;
  }

  /**
   * Returns the union of the current and the provided options.
   * @private
   * @internal
   */
  with(
    settings: Partial<
      Omit<QueryOptions<AppModelType, DbModelType>, 'converter'>
    >
  ): QueryOptions<AppModelType, DbModelType> {
    return new QueryOptions(
      coalesce(settings.parentPath, this.parentPath)!,
      coalesce(settings.collectionId, this.collectionId)!,
      this.converter,
      coalesce(settings.allDescendants, this.allDescendants)!,
      coalesce(settings.filters, this.filters)!,
      coalesce(settings.fieldOrders, this.fieldOrders)!,
      coalesce(settings.startAt, this.startAt),
      coalesce(settings.endAt, this.endAt),
      coalesce(settings.limit, this.limit),
      coalesce(settings.limitType, this.limitType),
      coalesce(settings.offset, this.offset),
      coalesce(settings.projection, this.projection),
      coalesce(settings.kindless, this.kindless),
      coalesce(settings.requireConsistency, this.requireConsistency)
    );
  }

  withConverter<
    NewAppModelType,
    NewDbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    converter: firestore.FirestoreDataConverter<NewAppModelType, NewDbModelType>
  ): QueryOptions<NewAppModelType, NewDbModelType> {
    return new QueryOptions<NewAppModelType, NewDbModelType>(
      this.parentPath,
      this.collectionId,
      converter,
      this.allDescendants,
      this.filters,
      this.fieldOrders,
      this.startAt,
      this.endAt,
      this.limit,
      this.limitType,
      this.offset,
      this.projection
    );
  }

  hasFieldOrders(): boolean {
    return this.fieldOrders.length > 0;
  }

  isEqual(other: QueryOptions<AppModelType, DbModelType>): boolean {
    if (this === other) {
      return true;
    }

    return (
      other instanceof QueryOptions &&
      this.parentPath.isEqual(other.parentPath) &&
      this.filtersEqual(other.filters) &&
      this.collectionId === other.collectionId &&
      this.converter === other.converter &&
      this.allDescendants === other.allDescendants &&
      this.limit === other.limit &&
      this.offset === other.offset &&
      deepEqual(this.fieldOrders, other.fieldOrders) &&
      deepEqual(this.startAt, other.startAt) &&
      deepEqual(this.endAt, other.endAt) &&
      deepEqual(this.projection, other.projection) &&
      this.kindless === other.kindless &&
      this.requireConsistency === other.requireConsistency
    );
  }

  private filtersEqual(other: FilterInternal[]): boolean {
    if (this.filters.length !== other.length) {
      return false;
    }

    for (let i = 0; i < other.length; i++) {
      if (!this.filters[i].isEqual(other[i])) {
        return false;
      }
    }
    return true;
  }
}

/**
 * A Query refers to a query which you can read or stream from. You can also
 * construct refined Query objects by adding filters and ordering.
 *
 * @class Query
 */
export class Query<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> implements firestore.Query<AppModelType, DbModelType>
{
  private readonly _serializer: Serializer;
  /** @private */
  protected readonly _allowUndefined: boolean;

  /**
   * @private
   *
   * @param _firestore The Firestore Database client.
   * @param _queryOptions Options that define the query.
   */
  constructor(
    /** @private */
    readonly _firestore: Firestore,
    /** @private */
    protected readonly _queryOptions: QueryOptions<AppModelType, DbModelType>
  ) {
    this._serializer = new Serializer(_firestore);
    this._allowUndefined =
      !!this._firestore._settings.ignoreUndefinedProperties;
  }

  /**
   * Extracts field values from the DocumentSnapshot based on the provided
   * field order.
   *
   * @private
   * @internal
   * @param documentSnapshot The document to extract the fields from.
   * @param fieldOrders The field order that defines what fields we should
   * extract.
   * @return {Array.<*>} The field values to use.
   * @private
   * @internal
   */
  static _extractFieldValues(
    documentSnapshot: DocumentSnapshot,
    fieldOrders: FieldOrder[]
  ): unknown[] {
    const fieldValues: unknown[] = [];

    for (const fieldOrder of fieldOrders) {
      if (FieldPath.documentId().isEqual(fieldOrder.field)) {
        fieldValues.push(documentSnapshot.ref);
      } else {
        const fieldValue = documentSnapshot.get(fieldOrder.field);
        if (fieldValue === undefined) {
          throw new Error(
            `Field "${fieldOrder.field}" is missing in the provided DocumentSnapshot. ` +
              'Please provide a document that contains values for all specified ' +
              'orderBy() and where() constraints.'
          );
        } else {
          fieldValues.push(fieldValue);
        }
      }
    }
    return fieldValues;
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
   * ```
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   let firestore = documentReference.firestore;
   *   console.log(`Root location for document is ${firestore.formattedName}`);
   * });
   * ```
   */
  get firestore(): Firestore {
    return this._firestore;
  }

  /**
   * Creates and returns a new [Query]{@link Query} with the additional filter
   * that documents must contain the specified field and that its value should
   * satisfy the relation constraint provided.
   *
   * This function returns a new (immutable) instance of the Query (rather than
   * modify the existing instance) to impose the filter.
   *
   * @param {string|FieldPath} fieldPath The name of a property value to compare.
   * @param {string} opStr A comparison operation in the form of a string.
   * Acceptable operator strings are "<", "<=", "==", "!=", ">=", ">", "array-contains",
   * "in", "not-in", and "array-contains-any".
   * @param {*} value The value to which to compare the field for inclusion in
   * a query.
   * @returns {Query} The created Query.
   *
   * @example
   * ```
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.where('foo', '==', 'bar').get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  where(
    fieldPath: string | FieldPath,
    opStr: firestore.WhereFilterOp,
    value: unknown
  ): Query<AppModelType, DbModelType>;

  /**
   * Creates and returns a new [Query]{@link Query} with the additional filter
   * that documents should satisfy the relation constraint(s) provided.
   *
   * This function returns a new (immutable) instance of the Query (rather than
   * modify the existing instance) to impose the filter.
   *
   * @param {Filter} filter A unary or composite filter to apply to the Query.
   * @returns {Query} The created Query.
   *
   * @example
   * ```
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.where(Filter.and(Filter.where('foo', '==', 'bar'), Filter.where('foo', '!=', 'baz'))).get()
   *   .then(querySnapshot => {
   *     querySnapshot.forEach(documentSnapshot => {
   *       console.log(`Found document at ${documentSnapshot.ref.path}`);
   *     });
   * });
   * ```
   */
  where(filter: Filter): Query<AppModelType, DbModelType>;

  where(
    fieldPathOrFilter: string | firestore.FieldPath | Filter,
    opStr?: firestore.WhereFilterOp,
    value?: unknown
  ): Query<AppModelType, DbModelType> {
    let filter: Filter;

    if (fieldPathOrFilter instanceof Filter) {
      filter = fieldPathOrFilter;
    } else {
      filter = Filter.where(fieldPathOrFilter, opStr!, value);
    }

    if (this._queryOptions.startAt || this._queryOptions.endAt) {
      throw new Error(
        'Cannot specify a where() filter after calling startAt(), ' +
          'startAfter(), endBefore() or endAt().'
      );
    }

    const parsedFilter = this._parseFilter(filter);

    if (parsedFilter.getFilters().length === 0) {
      // Return the existing query if not adding any more filters (e.g. an empty composite filter).
      return this;
    }

    const options = this._queryOptions.with({
      filters: this._queryOptions.filters.concat(parsedFilter),
    });
    return new Query(this._firestore, options);
  }

  _parseFilter(filter: Filter): FilterInternal {
    if (filter instanceof UnaryFilter) {
      return this._parseFieldFilter(filter);
    }
    return this._parseCompositeFilter(filter as CompositeFilter);
  }

  _parseFieldFilter(fieldFilterData: UnaryFilter): FieldFilterInternal {
    let value = fieldFilterData._getValue();
    let operator = fieldFilterData._getOperator();
    const fieldPath = fieldFilterData._getField();

    validateFieldPath('fieldPath', fieldPath);

    operator = validateQueryOperator('opStr', operator, value);
    validateQueryValue('value', value, this._allowUndefined);

    const path = FieldPath.fromArgument(fieldPath);

    if (FieldPath.documentId().isEqual(path)) {
      if (operator === 'array-contains' || operator === 'array-contains-any') {
        throw new Error(
          `Invalid Query. You can't perform '${operator}' ` +
            'queries on FieldPath.documentId().'
        );
      } else if (operator === 'in' || operator === 'not-in') {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error(
            `Invalid Query. A non-empty array is required for '${operator}' filters.`
          );
        }
        value = value.map(el => this.validateReference(el));
      } else {
        value = this.validateReference(value);
      }
    }

    return new FieldFilterInternal(
      this._serializer,
      path,
      comparisonOperators[operator],
      value
    );
  }

  _parseCompositeFilter(compositeFilterData: CompositeFilter): FilterInternal {
    const parsedFilters = compositeFilterData
      ._getFilters()
      .map(filter => this._parseFilter(filter))
      .filter(parsedFilter => parsedFilter.getFilters().length > 0);

    // For composite filters containing 1 filter, return the only filter.
    // For example: AND(FieldFilter1) == FieldFilter1
    if (parsedFilters.length === 1) {
      return parsedFilters[0];
    }
    return new CompositeFilterInternal(
      parsedFilters,
      compositeFilterData._getOperator() === 'AND' ? 'AND' : 'OR'
    );
  }

  /**
   * Creates and returns a new [Query]{@link Query} instance that applies a
   * field mask to the result and returns only the specified subset of fields.
   * You can specify a list of field paths to return, or use an empty list to
   * only return the references of matching documents.
   *
   * Queries that contain field masks cannot be listened to via `onSnapshot()`
   * listeners.
   *
   * This function returns a new (immutable) instance of the Query (rather than
   * modify the existing instance) to impose the field mask.
   *
   * @param {...(string|FieldPath)} fieldPaths The field paths to return.
   * @returns {Query} The created Query.
   *
   * @example
   * ```
   * let collectionRef = firestore.collection('col');
   * let documentRef = collectionRef.doc('doc');
   *
   * return documentRef.set({x:10, y:5}).then(() => {
   *   return collectionRef.where('x', '>', 5).select('y').get();
   * }).then((res) => {
   *   console.log(`y is ${res.docs[0].get('y')}.`);
   * });
   * ```
   */
  select(...fieldPaths: Array<string | FieldPath>): Query {
    const fields: api.StructuredQuery.IFieldReference[] = [];

    if (fieldPaths.length === 0) {
      fields.push({fieldPath: FieldPath.documentId().formattedName});
    } else {
      for (let i = 0; i < fieldPaths.length; ++i) {
        validateFieldPath(i, fieldPaths[i]);
        fields.push({
          fieldPath: FieldPath.fromArgument(fieldPaths[i]).formattedName,
        });
      }
    }

    // By specifying a field mask, the query result no longer conforms to type
    // `T`. We there return `Query<DocumentData>`;
    const options = this._queryOptions.with({
      projection: {fields},
    }) as QueryOptions<firestore.DocumentData, firestore.DocumentData>;
    return new Query(this._firestore, options);
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
   * ```
   * let query = firestore.collection('col').where('foo', '>', 42);
   *
   * query.orderBy('foo', 'desc').get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  orderBy(
    fieldPath: string | firestore.FieldPath,
    directionStr?: firestore.OrderByDirection
  ): Query<AppModelType, DbModelType> {
    validateFieldPath('fieldPath', fieldPath);
    directionStr = validateQueryOrder('directionStr', directionStr);

    if (this._queryOptions.startAt || this._queryOptions.endAt) {
      throw new Error(
        'Cannot specify an orderBy() constraint after calling ' +
          'startAt(), startAfter(), endBefore() or endAt().'
      );
    }

    const newOrder = new FieldOrder(
      FieldPath.fromArgument(fieldPath),
      directionOperators[directionStr || 'asc']
    );

    const options = this._queryOptions.with({
      fieldOrders: this._queryOptions.fieldOrders.concat(newOrder),
    });
    return new Query(this._firestore, options);
  }

  /**
   * Creates and returns a new [Query]{@link Query} that only returns the
   * first matching documents.
   *
   * This function returns a new (immutable) instance of the Query (rather than
   * modify the existing instance) to impose the limit.
   *
   * @param {number} limit The maximum number of items to return.
   * @returns {Query} The created Query.
   *
   * @example
   * ```
   * let query = firestore.collection('col').where('foo', '>', 42);
   *
   * query.limit(1).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  limit(limit: number): Query<AppModelType, DbModelType> {
    validateInteger('limit', limit);

    const options = this._queryOptions.with({
      limit,
      limitType: LimitType.First,
    });
    return new Query(this._firestore, options);
  }

  /**
   * Creates and returns a new [Query]{@link Query} that only returns the
   * last matching documents.
   *
   * You must specify at least one orderBy clause for limitToLast queries,
   * otherwise an exception will be thrown during execution.
   *
   * Results for limitToLast queries cannot be streamed via the `stream()` API.
   *
   * @param limit The maximum number of items to return.
   * @return The created Query.
   *
   * @example
   * ```
   * let query = firestore.collection('col').where('foo', '>', 42);
   *
   * query.limitToLast(1).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Last matching document is ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  limitToLast(limit: number): Query<AppModelType, DbModelType> {
    validateInteger('limitToLast', limit);

    const options = this._queryOptions.with({limit, limitType: LimitType.Last});
    return new Query(this._firestore, options);
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
   * ```
   * let query = firestore.collection('col').where('foo', '>', 42);
   *
   * query.limit(10).offset(20).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  offset(offset: number): Query<AppModelType, DbModelType> {
    validateInteger('offset', offset);

    const options = this._queryOptions.with({offset});
    return new Query(this._firestore, options);
  }

  /**
   * Returns a query that counts the documents in the result set of this
   * query.
   *
   * The returned query, when executed, counts the documents in the result set
   * of this query without actually downloading the documents.
   *
   * Using the returned query to count the documents is efficient because only
   * the final count, not the documents' data, is downloaded. The returned
   * query can even count the documents if the result set would be
   * prohibitively large to download entirely (e.g. thousands of documents).
   *
   * @return a query that counts the documents in the result set of this
   * query. The count can be retrieved from `snapshot.data().count`, where
   * `snapshot` is the `AggregateQuerySnapshot` resulting from running the
   * returned query.
   */
  count(): AggregateQuery<
    {count: firestore.AggregateField<number>},
    AppModelType,
    DbModelType
  > {
    return this.aggregate({
      count: AggregateField.count(),
    });
  }

  /**
   * Returns a query that can perform the given aggregations.
   *
   * The returned query, when executed, calculates the specified aggregations
   * over the documents in the result set of this query, without actually
   * downloading the documents.
   *
   * Using the returned query to perform aggregations is efficient because only
   * the final aggregation values, not the documents' data, is downloaded. The
   * returned query can even perform aggregations of the documents if the result set
   * would be prohibitively large to download entirely (e.g. thousands of documents).
   *
   * @param aggregateSpec An `AggregateSpec` object that specifies the aggregates
   * to perform over the result set. The AggregateSpec specifies aliases for each
   * aggregate, which can be used to retrieve the aggregate result.
   * @example
   * ```typescript
   * const aggregateQuery = col.aggregate(query, {
   *   countOfDocs: count(),
   *   totalHours: sum('hours'),
   *   averageScore: average('score')
   * });
   *
   * const aggregateSnapshot = await aggregateQuery.get();
   * const countOfDocs: number = aggregateSnapshot.data().countOfDocs;
   * const totalHours: number = aggregateSnapshot.data().totalHours;
   * const averageScore: number | null = aggregateSnapshot.data().averageScore;
   * ```
   */
  aggregate<T extends firestore.AggregateSpec>(
    aggregateSpec: T
  ): AggregateQuery<T, AppModelType, DbModelType> {
    return new AggregateQuery<T, AppModelType, DbModelType>(
      this,
      aggregateSpec
    );
  }

  /**
   * Returns true if this `Query` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `Query` is equal to the provided value.
   */
  isEqual(other: firestore.Query<AppModelType, DbModelType>): boolean {
    if (this === other) {
      return true;
    }

    return (
      other instanceof Query && this._queryOptions.isEqual(other._queryOptions)
    );
  }

  /**
   * Returns the sorted array of inequality filter fields used in this query.
   *
   * @return An array of inequality filter fields sorted lexicographically by FieldPath.
   */
  private getInequalityFilterFields(): FieldPath[] {
    const inequalityFields: FieldPath[] = [];

    for (const filter of this._queryOptions.filters) {
      for (const subFilter of filter.getFlattenedFilters()) {
        if (subFilter.isInequalityFilter()) {
          inequalityFields.push(subFilter.field);
        }
      }
    }

    return inequalityFields.sort((a, b) => a.compareTo(b));
  }

  /**
   * Computes the backend ordering semantics for DocumentSnapshot cursors.
   *
   * @private
   * @internal
   * @param cursorValuesOrDocumentSnapshot The snapshot of the document or the
   * set of field values to use as the boundary.
   * @returns The implicit ordering semantics.
   */
  private createImplicitOrderBy(
    cursorValuesOrDocumentSnapshot: Array<
      DocumentSnapshot<AppModelType, DbModelType> | unknown
    >
  ): FieldOrder[] {
    // Add an implicit orderBy if the only cursor value is a DocumentSnapshot.
    if (
      cursorValuesOrDocumentSnapshot.length !== 1 ||
      !(cursorValuesOrDocumentSnapshot[0] instanceof DocumentSnapshot)
    ) {
      return this._queryOptions.fieldOrders;
    }

    const fieldOrders = this._queryOptions.fieldOrders.slice();
    const fieldsNormalized = new Set([
      ...fieldOrders.map(item => item.field.toString()),
    ]);

    /** The order of the implicit ordering always matches the last explicit order by. */
    const lastDirection =
      fieldOrders.length === 0
        ? directionOperators.ASC
        : fieldOrders[fieldOrders.length - 1].direction;

    /**
     * Any inequality fields not explicitly ordered should be implicitly ordered in a
     * lexicographical order. When there are multiple inequality filters on the same field, the
     * field should be added only once.
     * Note: getInequalityFilterFields function sorts the key field before
     * other fields. However, we want the key field to be sorted last.
     */
    const inequalityFields = this.getInequalityFilterFields();
    for (const field of inequalityFields) {
      if (
        !fieldsNormalized.has(field.toString()) &&
        !field.isEqual(FieldPath.documentId())
      ) {
        fieldOrders.push(new FieldOrder(field, lastDirection));
        fieldsNormalized.add(field.toString());
      }
    }

    // Add the document key field to the last if it is not explicitly ordered.
    if (!fieldsNormalized.has(FieldPath.documentId().toString())) {
      fieldOrders.push(new FieldOrder(FieldPath.documentId(), lastDirection));
    }

    return fieldOrders;
  }

  /**
   * Builds a Firestore 'Position' proto message.
   *
   * @private
   * @internal
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
    cursorValuesOrDocumentSnapshot: Array<DocumentSnapshot | unknown>,
    before: boolean
  ): QueryCursor {
    let fieldValues;

    if (
      cursorValuesOrDocumentSnapshot.length === 1 &&
      cursorValuesOrDocumentSnapshot[0] instanceof DocumentSnapshot
    ) {
      fieldValues = Query._extractFieldValues(
        cursorValuesOrDocumentSnapshot[0] as DocumentSnapshot,
        fieldOrders
      );
    } else {
      fieldValues = cursorValuesOrDocumentSnapshot;
    }

    if (fieldValues.length > fieldOrders.length) {
      throw new Error(
        'Too many cursor values specified. The specified ' +
          'values must match the orderBy() constraints of the query.'
      );
    }

    const options: QueryCursor = {values: [], before};

    for (let i = 0; i < fieldValues.length; ++i) {
      let fieldValue = fieldValues[i];

      if (FieldPath.documentId().isEqual(fieldOrders[i].field)) {
        fieldValue = this.validateReference(fieldValue);
      }

      validateQueryValue(i, fieldValue, this._allowUndefined);
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
   * @param val The value to validate.
   * @throws If the value cannot be used for this query.
   * @return If valid, returns a DocumentReference that can be used with the
   * query.
   * @private
   * @internal
   */
  private validateReference(
    val: unknown
  ): DocumentReference<AppModelType, DbModelType> {
    const basePath = this._queryOptions.allDescendants
      ? this._queryOptions.parentPath
      : this._queryOptions.parentPath.append(this._queryOptions.collectionId);
    let reference: DocumentReference<AppModelType, DbModelType>;

    if (typeof val === 'string') {
      const path = basePath.append(val);

      if (this._queryOptions.allDescendants) {
        if (!path.isDocument) {
          throw new Error(
            'When querying a collection group and ordering by ' +
              'FieldPath.documentId(), the corresponding value must result in ' +
              `a valid document path, but '${val}' is not because it ` +
              'contains an odd number of segments.'
          );
        }
      } else if (val.indexOf('/') !== -1) {
        throw new Error(
          'When querying a collection and ordering by FieldPath.documentId(), ' +
            `the corresponding value must be a plain document ID, but '${val}' ` +
            'contains a slash.'
        );
      }

      reference = new DocumentReference(
        this._firestore,
        basePath.append(val),
        this._queryOptions.converter
      );
    } else if (val instanceof DocumentReference) {
      reference = val;
      if (!basePath.isPrefixOf(reference._path)) {
        throw new Error(
          `"${reference.path}" is not part of the query result set and ` +
            'cannot be used as a query boundary.'
        );
      }
    } else {
      throw new Error(
        'The corresponding value for FieldPath.documentId() must be a ' +
          `string or a DocumentReference, but was "${val}".`
      );
    }

    if (
      !this._queryOptions.allDescendants &&
      reference._path.parent()!.compareTo(basePath) !== 0
    ) {
      throw new Error(
        'Only a direct child can be used as a query boundary. ' +
          `Found: "${reference.path}".`
      );
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
   * ```
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').startAt(42).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  startAt(
    ...fieldValuesOrDocumentSnapshot: Array<unknown>
  ): Query<AppModelType, DbModelType> {
    validateMinNumberOfArguments(
      'Query.startAt',
      fieldValuesOrDocumentSnapshot,
      1
    );

    const fieldOrders = this.createImplicitOrderBy(
      fieldValuesOrDocumentSnapshot
    );
    const startAt = this.createCursor(
      fieldOrders,
      fieldValuesOrDocumentSnapshot,
      true
    );

    const options = this._queryOptions.with({fieldOrders, startAt});
    return new Query(this._firestore, options);
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
   * ```
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').startAfter(42).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  startAfter(
    ...fieldValuesOrDocumentSnapshot: Array<unknown>
  ): Query<AppModelType, DbModelType> {
    validateMinNumberOfArguments(
      'Query.startAfter',
      fieldValuesOrDocumentSnapshot,
      1
    );

    const fieldOrders = this.createImplicitOrderBy(
      fieldValuesOrDocumentSnapshot
    );
    const startAt = this.createCursor(
      fieldOrders,
      fieldValuesOrDocumentSnapshot,
      false
    );

    const options = this._queryOptions.with({fieldOrders, startAt});
    return new Query(this._firestore, options);
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
   * ```
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').endBefore(42).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  endBefore(
    ...fieldValuesOrDocumentSnapshot: Array<unknown>
  ): Query<AppModelType, DbModelType> {
    validateMinNumberOfArguments(
      'Query.endBefore',
      fieldValuesOrDocumentSnapshot,
      1
    );

    const fieldOrders = this.createImplicitOrderBy(
      fieldValuesOrDocumentSnapshot
    );
    const endAt = this.createCursor(
      fieldOrders,
      fieldValuesOrDocumentSnapshot,
      true
    );

    const options = this._queryOptions.with({fieldOrders, endAt});
    return new Query(this._firestore, options);
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
   * ```
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').endAt(42).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  endAt(
    ...fieldValuesOrDocumentSnapshot: Array<unknown>
  ): Query<AppModelType, DbModelType> {
    validateMinNumberOfArguments(
      'Query.endAt',
      fieldValuesOrDocumentSnapshot,
      1
    );

    const fieldOrders = this.createImplicitOrderBy(
      fieldValuesOrDocumentSnapshot
    );
    const endAt = this.createCursor(
      fieldOrders,
      fieldValuesOrDocumentSnapshot,
      false
    );

    const options = this._queryOptions.with({fieldOrders, endAt});
    return new Query(this._firestore, options);
  }

  /**
   * Executes the query and returns the results as a
   * [QuerySnapshot]{@link QuerySnapshot}.
   *
   * @returns {Promise.<QuerySnapshot>} A Promise that resolves with the results
   * of the Query.
   *
   * @example
   * ```
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   * ```
   */
  get(): Promise<QuerySnapshot<AppModelType, DbModelType>> {
    return this._get();
  }

  /**
   * Internal get() method that accepts an optional transaction id.
   *
   * @private
   * @internal
   * @param {bytes=} transactionId A transaction ID.
   */
  _get(
    transactionId?: Uint8Array
  ): Promise<QuerySnapshot<AppModelType, DbModelType>> {
    const docs: Array<QueryDocumentSnapshot<AppModelType, DbModelType>> = [];

    // Capture the error stack to preserve stack tracing across async calls.
    const stack = Error().stack!;

    return new Promise((resolve, reject) => {
      let readTime: Timestamp;

      this._stream(transactionId)
        .on('error', err => {
          reject(wrapError(err, stack));
        })
        .on('data', result => {
          readTime = result.readTime;
          if (result.document) {
            docs.push(result.document);
          }
        })
        .on('end', () => {
          if (this._queryOptions.limitType === LimitType.Last) {
            // The results for limitToLast queries need to be flipped since
            // we reversed the ordering constraints before sending the query
            // to the backend.
            docs.reverse();
          }

          resolve(
            new QuerySnapshot(
              this,
              readTime,
              docs.length,
              () => docs,
              () => {
                const changes: Array<
                  DocumentChange<AppModelType, DbModelType>
                > = [];
                for (let i = 0; i < docs.length; ++i) {
                  changes.push(new DocumentChange('added', docs[i], -1, i));
                }
                return changes;
              }
            )
          );
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
   * ```
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
   * ```
   */
  stream(): NodeJS.ReadableStream {
    if (this._queryOptions.limitType === LimitType.Last) {
      throw new Error(
        'Query results for queries that include limitToLast() ' +
          'constraints cannot be streamed. Use Query.get() instead.'
      );
    }

    const responseStream = this._stream();
    const transform = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        callback(undefined, chunk.document);
      },
    });

    responseStream.pipe(transform);
    responseStream.on('error', e => transform.destroy(e));
    return transform;
  }

  /**
   * Converts a QueryCursor to its proto representation.
   *
   * @param cursor The original cursor value
   * @private
   * @internal
   */
  private toCursor(cursor: QueryCursor | undefined): api.ICursor | undefined {
    if (cursor) {
      return cursor.before
        ? {before: true, values: cursor.values}
        : {values: cursor.values};
    }

    return undefined;
  }

  /**
   * Internal method for serializing a query to its RunQuery proto
   * representation with an optional transaction id or read time.
   *
   * @param transactionIdOrReadTime A transaction ID or the read time at which
   * to execute the query.
   * @private
   * @internal
   * @returns Serialized JSON for the query.
   */
  toProto(
    transactionIdOrReadTime?: Uint8Array | Timestamp
  ): api.IRunQueryRequest {
    const projectId = this.firestore.projectId;
    const databaseId = this.firestore.databaseId;
    const parentPath = this._queryOptions.parentPath.toQualifiedResourcePath(
      projectId,
      databaseId
    );

    const structuredQuery = this.toStructuredQuery();

    // For limitToLast queries, the structured query has to be translated to a version with
    // reversed ordered, and flipped startAt/endAt to work properly.
    if (this._queryOptions.limitType === LimitType.Last) {
      if (!this._queryOptions.hasFieldOrders()) {
        throw new Error(
          'limitToLast() queries require specifying at least one orderBy() clause.'
        );
      }

      structuredQuery.orderBy = this._queryOptions.fieldOrders!.map(order => {
        // Flip the orderBy directions since we want the last results
        const dir =
          order.direction === 'DESCENDING' ? 'ASCENDING' : 'DESCENDING';
        return new FieldOrder(order.field, dir).toProto();
      });

      // Swap the cursors to match the now-flipped query ordering.
      structuredQuery.startAt = this._queryOptions.endAt
        ? this.toCursor({
            values: this._queryOptions.endAt.values,
            before: !this._queryOptions.endAt.before,
          })
        : undefined;
      structuredQuery.endAt = this._queryOptions.startAt
        ? this.toCursor({
            values: this._queryOptions.startAt.values,
            before: !this._queryOptions.startAt.before,
          })
        : undefined;
    }

    const runQueryRequest: api.IRunQueryRequest = {
      parent: parentPath.formattedName,
      structuredQuery,
    };

    if (transactionIdOrReadTime instanceof Uint8Array) {
      runQueryRequest.transaction = transactionIdOrReadTime;
    } else if (transactionIdOrReadTime instanceof Timestamp) {
      runQueryRequest.readTime =
        transactionIdOrReadTime.toProto().timestampValue;
    }

    return runQueryRequest;
  }

  /**
   * Converts current Query to an IBundledQuery.
   *
   * @private
   * @internal
   */
  _toBundledQuery(): protos.firestore.IBundledQuery {
    const projectId = this.firestore.projectId;
    const databaseId = this.firestore.databaseId;
    const parentPath = this._queryOptions.parentPath.toQualifiedResourcePath(
      projectId,
      databaseId
    );
    const structuredQuery = this.toStructuredQuery();

    const bundledQuery: protos.firestore.IBundledQuery = {
      parent: parentPath.formattedName,
      structuredQuery,
    };
    if (this._queryOptions.limitType === LimitType.First) {
      bundledQuery.limitType = 'FIRST';
    } else if (this._queryOptions.limitType === LimitType.Last) {
      bundledQuery.limitType = 'LAST';
    }

    return bundledQuery;
  }

  private toStructuredQuery(): api.IStructuredQuery {
    const structuredQuery: api.IStructuredQuery = {
      from: [{}],
    };

    if (this._queryOptions.allDescendants) {
      structuredQuery.from![0].allDescendants = true;
    }

    // Kindless queries select all descendant documents, so we remove the
    // collectionId field.
    if (!this._queryOptions.kindless) {
      structuredQuery.from![0].collectionId = this._queryOptions.collectionId;
    }

    if (this._queryOptions.filters.length >= 1) {
      structuredQuery.where = new CompositeFilterInternal(
        this._queryOptions.filters,
        'AND'
      ).toProto();
    }

    if (this._queryOptions.hasFieldOrders()) {
      structuredQuery.orderBy = this._queryOptions.fieldOrders.map(o =>
        o.toProto()
      );
    }

    structuredQuery.startAt = this.toCursor(this._queryOptions.startAt);
    structuredQuery.endAt = this.toCursor(this._queryOptions.endAt);

    if (this._queryOptions.limit) {
      structuredQuery.limit = {value: this._queryOptions.limit};
    }

    structuredQuery.offset = this._queryOptions.offset;
    structuredQuery.select = this._queryOptions.projection;

    return structuredQuery;
  }

  // This method exists solely to enable unit tests to mock it.
  _isPermanentRpcError(err: GoogleError, methodName: string): boolean {
    return isPermanentRpcError(err, methodName);
  }

  _hasRetryTimedOut(methodName: string, startTime: number): boolean {
    const totalTimeout = getTotalTimeout(methodName);
    if (totalTimeout === 0) {
      return false;
    }

    return Date.now() - startTime >= totalTimeout;
  }

  /**
   * Internal streaming method that accepts an optional transaction ID.
   *
   * @param transactionId A transaction ID.
   * @private
   * @internal
   * @returns A stream of document results.
   */
  _stream(transactionId?: Uint8Array): NodeJS.ReadableStream {
    const tag = requestTag();
    const startTime = Date.now();

    let lastReceivedDocument: QueryDocumentSnapshot<
      AppModelType,
      DbModelType
    > | null = null;

    let backendStream: Duplex;
    const stream = new Transform({
      objectMode: true,
      transform: (proto, enc, callback) => {
        if (proto === NOOP_MESSAGE) {
          callback(undefined);
          return;
        }
        const readTime = Timestamp.fromProto(proto.readTime);
        if (proto.document) {
          const document = this.firestore.snapshot_(
            proto.document,
            proto.readTime
          );
          const finalDoc = new DocumentSnapshotBuilder<
            AppModelType,
            DbModelType
          >(document.ref.withConverter(this._queryOptions.converter));
          // Recreate the QueryDocumentSnapshot with the DocumentReference
          // containing the original converter.
          finalDoc.fieldsProto = document._fieldsProto;
          finalDoc.readTime = document.readTime;
          finalDoc.createTime = document.createTime;
          finalDoc.updateTime = document.updateTime;
          lastReceivedDocument = finalDoc.build() as QueryDocumentSnapshot<
            AppModelType,
            DbModelType
          >;
          callback(undefined, {document: lastReceivedDocument, readTime});
          if (proto.done) {
            logger('Query._stream', tag, 'Trigger Logical Termination.');
            backendStream.unpipe(stream);
            backendStream.resume();
            backendStream.end();
            stream.end();
          }
        } else {
          callback(undefined, {readTime});
        }
      },
    });

    this.firestore
      .initializeIfNeeded(tag)
      .then(async () => {
        // `toProto()` might throw an exception. We rely on the behavior of an
        // async function to convert this exception into the rejected Promise we
        // catch below.
        let request = this.toProto(transactionId);

        let streamActive: Deferred<boolean>;
        do {
          streamActive = new Deferred<boolean>();
          const methodName = 'runQuery';
          backendStream = await this._firestore.requestStream(
            methodName,
            /* bidirectional= */ false,
            request,
            tag
          );
          backendStream.on('error', err => {
            backendStream.unpipe(stream);

            // If a non-transactional query failed, attempt to restart.
            // Transactional queries are retried via the transaction runner.
            if (!transactionId && !this._isPermanentRpcError(err, 'runQuery')) {
              logger(
                'Query._stream',
                tag,
                'Query failed with retryable stream error:',
                err
              );

              // Enqueue a "no-op" write into the stream and wait for it to be
              // read by the downstream consumer. This ensures that all enqueued
              // results in the stream are consumed, which will give us an accurate
              // value for `lastReceivedDocument`.
              stream.write(NOOP_MESSAGE, () => {
                if (this._hasRetryTimedOut(methodName, startTime)) {
                  logger(
                    'Query._stream',
                    tag,
                    'Query failed with retryable stream error but the total retry timeout has exceeded.'
                  );
                  stream.destroy(err);
                  streamActive.resolve(/* active= */ false);
                } else if (lastReceivedDocument) {
                  logger(
                    'Query._stream',
                    tag,
                    'Query failed with retryable stream error and progress was made receiving ' +
                      'documents, so the stream is being retried.'
                  );

                  // Restart the query but use the last document we received as
                  // the query cursor. Note that we do not use backoff here. The
                  // call to `requestStream()` will backoff should the restart
                  // fail before delivering any results.
                  if (this._queryOptions.requireConsistency) {
                    request = this.startAfter(lastReceivedDocument).toProto(
                      lastReceivedDocument.readTime
                    );
                  } else {
                    request = this.startAfter(lastReceivedDocument).toProto();
                  }

                  // Set lastReceivedDocument to null before each retry attempt to ensure the retry makes progress
                  lastReceivedDocument = null;

                  streamActive.resolve(/* active= */ true);
                } else {
                  logger(
                    'Query._stream',
                    tag,
                    'Query failed with retryable stream error however no progress was made receiving ' +
                      'documents, so the stream is being closed.'
                  );
                  stream.destroy(err);
                  streamActive.resolve(/* active= */ false);
                }
              });
            } else {
              logger(
                'Query._stream',
                tag,
                'Query failed with stream error:',
                err
              );
              stream.destroy(err);
              streamActive.resolve(/* active= */ false);
            }
          });
          backendStream.on('end', () => {
            streamActive.resolve(/* active= */ false);
          });
          backendStream.resume();
          backendStream.pipe(stream);
        } while (await streamActive.promise);
      })
      .catch(e => stream.destroy(e));

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
   * ```
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
   * ```
   */
  onSnapshot(
    onNext: (snapshot: QuerySnapshot<AppModelType, DbModelType>) => void,
    onError?: (error: Error) => void
  ): () => void {
    validateFunction('onNext', onNext);
    validateFunction('onError', onError, {optional: true});

    const watch: QueryWatch<AppModelType, DbModelType> =
      new (require('./watch').QueryWatch)(
        this.firestore,
        this,
        this._queryOptions.converter
      );

    return watch.onSnapshot((readTime, size, docs, changes) => {
      onNext(new QuerySnapshot(this, readTime, size, docs, changes));
    }, onError || console.error);
  }

  /**
   * Returns a function that can be used to sort QueryDocumentSnapshots
   * according to the sort criteria of this query.
   *
   * @private
   * @internal
   */
  comparator(): (
    s1: QueryDocumentSnapshot<AppModelType, DbModelType>,
    s2: QueryDocumentSnapshot<AppModelType, DbModelType>
  ) => number {
    return (doc1, doc2) => {
      // Add implicit sorting by name, using the last specified direction.
      const lastDirection = this._queryOptions.hasFieldOrders()
        ? this._queryOptions.fieldOrders[
            this._queryOptions.fieldOrders.length - 1
          ].direction
        : 'ASCENDING';
      const orderBys = this._queryOptions.fieldOrders.concat(
        new FieldOrder(FieldPath.documentId(), lastDirection)
      );

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
                "don't exist. Please include the fields you are ordering on " +
                'in your select() call.'
            );
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

  withConverter(converter: null): Query;
  withConverter<
    NewAppModelType,
    NewDbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    converter: firestore.FirestoreDataConverter<NewAppModelType, NewDbModelType>
  ): Query<NewAppModelType, NewDbModelType>;
  /**
   * Applies a custom data converter to this Query, allowing you to use your
   * own custom model objects with Firestore. When you call get() on the
   * returned Query, the provided converter will convert between Firestore
   * data of type `NewDbModelType` and your custom type `NewAppModelType`.
   *
   * Using the converter allows you to specify generic type arguments when
   * storing and retrieving objects from Firestore.
   *
   * Passing in `null` as the converter parameter removes the current
   * converter.
   *
   * @example
   * ```
   * class Post {
   *   constructor(readonly title: string, readonly author: string) {}
   *
   *   toString(): string {
   *     return this.title + ', by ' + this.author;
   *   }
   * }
   *
   * const postConverter = {
   *   toFirestore(post: Post): FirebaseFirestore.DocumentData {
   *     return {title: post.title, author: post.author};
   *   },
   *   fromFirestore(
   *     snapshot: FirebaseFirestore.QueryDocumentSnapshot
   *   ): Post {
   *     const data = snapshot.data();
   *     return new Post(data.title, data.author);
   *   }
   * };
   *
   * const postSnap = await Firestore()
   *   .collection('posts')
   *   .withConverter(postConverter)
   *   .doc().get();
   * const post = postSnap.data();
   * if (post !== undefined) {
   *   post.title; // string
   *   post.toString(); // Should be defined
   *   post.someNonExistentProperty; // TS error
   * }
   *
   * ```
   * @param {FirestoreDataConverter | null} converter Converts objects to and
   * from Firestore. Passing in `null` removes the current converter.
   * @return A Query that uses the provided converter.
   */
  withConverter<
    NewAppModelType,
    NewDbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    converter: firestore.FirestoreDataConverter<
      NewAppModelType,
      NewDbModelType
    > | null
  ): Query<NewAppModelType, NewDbModelType> {
    return new Query<NewAppModelType, NewDbModelType>(
      this.firestore,
      this._queryOptions.withConverter(converter ?? defaultConverter())
    );
  }
}

/**
 * A CollectionReference object can be used for adding documents, getting
 * document references, and querying for documents (using the methods
 * inherited from [Query]{@link Query}).
 *
 * @class CollectionReference
 * @extends Query
 */
export class CollectionReference<
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData,
  >
  extends Query<AppModelType, DbModelType>
  implements firestore.CollectionReference<AppModelType, DbModelType>
{
  /**
   * @private
   *
   * @param firestore The Firestore Database client.
   * @param path The Path of this collection.
   */
  constructor(
    firestore: Firestore,
    path: ResourcePath,
    converter?: firestore.FirestoreDataConverter<AppModelType, DbModelType>
  ) {
    super(firestore, QueryOptions.forCollectionQuery(path, converter));
  }

  /**
   * Returns a resource path for this collection.
   * @private
   * @internal
   */
  get _resourcePath(): ResourcePath {
    return this._queryOptions.parentPath.append(
      this._queryOptions.collectionId
    );
  }

  /**
   * The last path element of the referenced collection.
   *
   * @type {string}
   * @name CollectionReference#id
   * @readonly
   *
   * @example
   * ```
   * let collectionRef = firestore.collection('col/doc/subcollection');
   * console.log(`ID of the subcollection: ${collectionRef.id}`);
   * ```
   */
  get id(): string {
    return this._queryOptions.collectionId;
  }

  /**
   * A reference to the containing Document if this is a subcollection, else
   * null.
   *
   * @type {DocumentReference|null}
   * @name CollectionReference#parent
   * @readonly
   *
   * @example
   * ```
   * let collectionRef = firestore.collection('col/doc/subcollection');
   * let documentRef = collectionRef.parent;
   * console.log(`Parent name: ${documentRef.path}`);
   * ```
   */
  get parent(): DocumentReference | null {
    if (this._queryOptions.parentPath.isDocument) {
      return new DocumentReference(
        this.firestore,
        this._queryOptions.parentPath
      );
    }

    return null;
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
   * ```
   * let collectionRef = firestore.collection('col/doc/subcollection');
   * console.log(`Path of the subcollection: ${collectionRef.path}`);
   * ```
   */
  get path(): string {
    return this._resourcePath.relativeName;
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
   * ```
   * let collectionRef = firestore.collection('col');
   *
   * return collectionRef.listDocuments().then(documentRefs => {
   *    return firestore.getAll(...documentRefs);
   * }).then(documentSnapshots => {
   *    for (let documentSnapshot of documentSnapshots) {
   *       if (documentSnapshot.exists) {
   *         console.log(`Found document with data: ${documentSnapshot.id}`);
   *       } else {
   *         console.log(`Found missing document: ${documentSnapshot.id}`);
   *       }
   *    }
   * });
   * ```
   */
  listDocuments(): Promise<
    Array<DocumentReference<AppModelType, DbModelType>>
  > {
    const tag = requestTag();
    return this.firestore.initializeIfNeeded(tag).then(() => {
      const parentPath = this._queryOptions.parentPath.toQualifiedResourcePath(
        this.firestore.projectId,
        this.firestore.databaseId
      );

      const request: api.IListDocumentsRequest = {
        parent: parentPath.formattedName,
        collectionId: this.id,
        showMissing: true,
        // Setting `pageSize` to an arbitrarily large value lets the backend cap
        // the page size (currently to 300). Note that the backend rejects
        // MAX_INT32 (b/146883794).
        pageSize: Math.pow(2, 16) - 1,
        mask: {fieldPaths: []},
      };

      return this.firestore
        .request<api.IListDocumentsRequest, api.IDocument[]>(
          'listDocuments',
          request,
          tag
        )
        .then(documents => {
          // Note that the backend already orders these documents by name,
          // so we do not need to manually sort them.
          return documents.map(doc => {
            const path = QualifiedResourcePath.fromSlashSeparatedString(
              doc.name!
            );
            return this.doc(path.id!);
          });
        });
    });
  }

  doc(): DocumentReference<AppModelType, DbModelType>;
  doc(documentPath: string): DocumentReference<AppModelType, DbModelType>;
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
   * ```
   * let collectionRef = firestore.collection('col');
   * let documentRefWithName = collectionRef.doc('doc');
   * let documentRefWithAutoId = collectionRef.doc();
   * console.log(`Reference with name: ${documentRefWithName.path}`);
   * console.log(`Reference with auto-id: ${documentRefWithAutoId.path}`);
   * ```
   */
  doc(documentPath?: string): DocumentReference<AppModelType, DbModelType> {
    if (arguments.length === 0) {
      documentPath = autoId();
    } else {
      validateResourcePath('documentPath', documentPath!);
    }

    const path = this._resourcePath.append(documentPath!);
    if (!path.isDocument) {
      throw new Error(
        `Value for argument "documentPath" must point to a document, but was "${documentPath}". Your path does not contain an even number of components.`
      );
    }

    return new DocumentReference(
      this.firestore,
      path,
      this._queryOptions.converter
    );
  }

  /**
   * Add a new document to this collection with the specified data, assigning
   * it a document ID automatically.
   *
   * @param {DocumentData} data An Object containing the data for the new
   * document.
   * @throws {Error} If the provided input is not a valid Firestore document.
   * @returns {Promise.<DocumentReference>} A Promise resolved with a
   * [DocumentReference]{@link DocumentReference} pointing to the
   * newly created document.
   *
   * @example
   * ```
   * let collectionRef = firestore.collection('col');
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   console.log(`Added document with name: ${documentReference.id}`);
   * });
   * ```
   */
  add(
    data: firestore.WithFieldValue<AppModelType>
  ): Promise<DocumentReference<AppModelType, DbModelType>> {
    const firestoreData = this._queryOptions.converter.toFirestore(data);
    validateDocumentData(
      'data',
      firestoreData,
      /*allowDeletes=*/ false,
      this._allowUndefined
    );

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
  isEqual(
    other: firestore.CollectionReference<AppModelType, DbModelType>
  ): boolean {
    return (
      this === other ||
      (other instanceof CollectionReference && super.isEqual(other))
    );
  }

  withConverter(converter: null): CollectionReference;
  withConverter<
    NewAppModelType,
    NewDbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    converter: firestore.FirestoreDataConverter<NewAppModelType, NewDbModelType>
  ): CollectionReference<NewAppModelType, NewDbModelType>;
  /**
   * Applies a custom data converter to this CollectionReference, allowing you
   * to use your own custom model objects with Firestore. When you call add() on
   * the returned CollectionReference instance, the provided converter will
   * convert between Firestore data of type `NewDbModelType` and your custom
   * type `NewAppModelType`.
   *
   * Using the converter allows you to specify generic type arguments when
   * storing and retrieving objects from Firestore.
   *
   * Passing in `null` as the converter parameter removes the current
   * converter.
   *
   * @example
   * ```
   * class Post {
   *   constructor(readonly title: string, readonly author: string) {}
   *
   *   toString(): string {
   *     return this.title + ', by ' + this.author;
   *   }
   * }
   *
   * const postConverter = {
   *   toFirestore(post: Post): FirebaseFirestore.DocumentData {
   *     return {title: post.title, author: post.author};
   *   },
   *   fromFirestore(
   *     snapshot: FirebaseFirestore.QueryDocumentSnapshot
   *   ): Post {
   *     const data = snapshot.data();
   *     return new Post(data.title, data.author);
   *   }
   * };
   *
   * const postSnap = await Firestore()
   *   .collection('posts')
   *   .withConverter(postConverter)
   *   .doc().get();
   * const post = postSnap.data();
   * if (post !== undefined) {
   *   post.title; // string
   *   post.toString(); // Should be defined
   *   post.someNonExistentProperty; // TS error
   * }
   *
   * ```
   * @param {FirestoreDataConverter | null} converter Converts objects to and
   * from Firestore. Passing in `null` removes the current converter.
   * @return A CollectionReference that uses the provided converter.
   */
  withConverter<
    NewAppModelType,
    NewDbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    converter: firestore.FirestoreDataConverter<
      NewAppModelType,
      NewDbModelType
    > | null
  ): CollectionReference<NewAppModelType, NewDbModelType> {
    return new CollectionReference<NewAppModelType, NewDbModelType>(
      this.firestore,
      this._resourcePath,
      converter ?? defaultConverter()
    );
  }
}

/**
 * A query that calculates aggregations over an underlying query.
 */
export class AggregateQuery<
  AggregateSpecType extends AggregateSpec,
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> implements
    firestore.AggregateQuery<AggregateSpecType, AppModelType, DbModelType>
{
  private readonly clientAliasToServerAliasMap: Record<string, string> = {};
  private readonly serverAliasToClientAliasMap: Record<string, string> = {};

  /**
   * @private
   * @internal
   *
   * @param _query The query whose aggregations will be calculated by this
   * object.
   * @param _aggregates The aggregations that will be performed by this query.
   */
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly _query: Query<AppModelType, DbModelType>,
    private readonly _aggregates: AggregateSpecType
  ) {
    // Client-side aliases may be too long and exceed the 1500-byte string size limit.
    // Such long strings do not need to be transferred over the wire either.
    // The client maps the user's alias to a short form alias and send that to the server.
    let aggregationNum = 0;
    for (const clientAlias in this._aggregates) {
      if (Object.prototype.hasOwnProperty.call(this._aggregates, clientAlias)) {
        const serverAlias = `aggregate_${aggregationNum++}`;
        this.clientAliasToServerAliasMap[clientAlias] = serverAlias;
        this.serverAliasToClientAliasMap[serverAlias] = clientAlias;
      }
    }
  }

  /** The query whose aggregations will be calculated by this object. */
  get query(): Query<AppModelType, DbModelType> {
    return this._query;
  }

  /**
   * Executes this query.
   *
   * @return A promise that will be resolved with the results of the query.
   */
  get(): Promise<
    AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
  > {
    return this._get();
  }

  /**
   * Internal get() method that accepts an optional transaction id.
   *
   * @private
   * @internal
   * @param {bytes=} transactionId A transaction ID.
   */
  _get(
    transactionId?: Uint8Array
  ): Promise<
    AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
  > {
    // Capture the error stack to preserve stack tracing across async calls.
    const stack = Error().stack!;

    return new Promise((resolve, reject) => {
      const stream = this._stream(transactionId);
      stream.on('error', err => {
        reject(wrapError(err, stack));
      });
      stream.once('data', result => {
        stream.destroy();
        resolve(result);
      });
      stream.on('end', () => {
        reject('No AggregateQuery results');
      });
    });
  }

  /**
   * Internal streaming method that accepts an optional transaction ID.
   *
   * @private
   * @internal
   * @param transactionId A transaction ID.
   * @returns A stream of document results.
   */
  _stream(transactionId?: Uint8Array): Readable {
    const tag = requestTag();
    const firestore = this._query.firestore;

    const stream: Transform = new Transform({
      objectMode: true,
      transform: (proto: api.IRunAggregationQueryResponse, enc, callback) => {
        if (proto.result) {
          const readTime = Timestamp.fromProto(proto.readTime!);
          const data = this.decodeResult(proto.result);
          callback(undefined, new AggregateQuerySnapshot(this, readTime, data));
        } else {
          callback(Error('RunAggregationQueryResponse is missing result'));
        }
      },
    });

    firestore
      .initializeIfNeeded(tag)
      .then(async () => {
        // `toProto()` might throw an exception. We rely on the behavior of an
        // async function to convert this exception into the rejected Promise we
        // catch below.
        const request = this.toProto(transactionId);

        const backendStream = await firestore.requestStream(
          'runAggregationQuery',
          /* bidirectional= */ false,
          request,
          tag
        );
        stream.on('close', () => {
          backendStream.resume();
          backendStream.end();
        });
        backendStream.on('error', err => {
          // TODO(group-by) When group-by queries are supported for aggregates
          // consider implementing retries if the stream is making progress
          // receiving results for groups. See the use of lastReceivedDocument
          // in the retry strategy for runQuery.

          backendStream.unpipe(stream);
          logger(
            'AggregateQuery._stream',
            tag,
            'AggregateQuery failed with stream error:',
            err
          );
          stream.destroy(err);
        });
        backendStream.resume();
        backendStream.pipe(stream);
      })
      .catch(e => stream.destroy(e));

    return stream;
  }

  /**
   * Internal method to decode values within result.
   * @private
   */
  private decodeResult(
    proto: api.IAggregationResult
  ): firestore.AggregateSpecData<AggregateSpecType> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    const fields = proto.aggregateFields;
    if (fields) {
      const serializer = this._query.firestore._serializer!;
      for (const prop of Object.keys(fields)) {
        const alias = this.serverAliasToClientAliasMap[prop];
        assert(
          alias !== null && alias !== undefined,
          `'${prop}' not present in server-client alias mapping.`
        );
        if (this._aggregates[alias] === undefined) {
          throw new Error(
            `Unexpected alias [${prop}] in result aggregate result`
          );
        }
        data[alias] = serializer.decodeValue(fields[prop]);
      }
    }
    return data;
  }

  /**
   * Internal method for serializing a query to its RunAggregationQuery proto
   * representation with an optional transaction id.
   *
   * @private
   * @internal
   * @returns Serialized JSON for the query.
   */
  toProto(transactionId?: Uint8Array): api.IRunAggregationQueryRequest {
    const queryProto = this._query.toProto();
    const runQueryRequest: api.IRunAggregationQueryRequest = {
      parent: queryProto.parent,
      structuredAggregationQuery: {
        structuredQuery: queryProto.structuredQuery,
        aggregations: mapToArray(this._aggregates, (aggregate, clientAlias) => {
          const serverAlias = this.clientAliasToServerAliasMap[clientAlias];
          assert(
            serverAlias !== null && serverAlias !== undefined,
            `'${clientAlias}' not present in client-server alias mapping.`
          );
          return new Aggregate(
            serverAlias,
            aggregate.aggregateType,
            aggregate._field
          ).toProto();
        }),
      },
    };

    if (transactionId instanceof Uint8Array) {
      runQueryRequest.transaction = transactionId;
    }

    return runQueryRequest;
  }

  /**
   * Compares this object with the given object for equality.
   *
   * This object is considered "equal" to the other object if and only if
   * `other` performs the same aggregations as this `AggregateQuery` and
   * the underlying Query of `other` compares equal to that of this object
   * using `Query.isEqual()`.
   *
   * @param other The object to compare to this object for equality.
   * @return `true` if this object is "equal" to the given object, as
   * defined above, or `false` otherwise.
   */
  isEqual(
    other: firestore.AggregateQuery<
      AggregateSpecType,
      AppModelType,
      DbModelType
    >
  ): boolean {
    if (this === other) {
      return true;
    }
    if (!(other instanceof AggregateQuery)) {
      return false;
    }
    if (!this.query.isEqual(other.query)) {
      return false;
    }
    return deepEqual(this._aggregates, other._aggregates);
  }
}

/**
 * The results of executing an aggregation query.
 */
export class AggregateQuerySnapshot<
  AggregateSpecType extends firestore.AggregateSpec,
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> implements
    firestore.AggregateQuerySnapshot<
      AggregateSpecType,
      AppModelType,
      DbModelType
    >
{
  /**
   * @private
   * @internal
   *
   * @param _query The query that was executed to produce this result.
   * @param _readTime The time this snapshot was read.
   * @param _data The results of the aggregations performed over the underlying
   * query.
   */
  constructor(
    private readonly _query: AggregateQuery<
      AggregateSpecType,
      AppModelType,
      DbModelType
    >,
    private readonly _readTime: Timestamp,
    private readonly _data: firestore.AggregateSpecData<AggregateSpecType>
  ) {}

  /** The query that was executed to produce this result. */
  get query(): AggregateQuery<AggregateSpecType, AppModelType, DbModelType> {
    return this._query;
  }

  /** The time this snapshot was read. */
  get readTime(): Timestamp {
    return this._readTime;
  }

  /**
   * Returns the results of the aggregations performed over the underlying
   * query.
   *
   * The keys of the returned object will be the same as those of the
   * `AggregateSpec` object specified to the aggregation method, and the
   * values will be the corresponding aggregation result.
   *
   * @returns The results of the aggregations performed over the underlying
   * query.
   */
  data(): firestore.AggregateSpecData<AggregateSpecType> {
    return this._data;
  }

  /**
   * Compares this object with the given object for equality.
   *
   * Two `AggregateQuerySnapshot` instances are considered "equal" if they
   * have the same data and their underlying queries compare "equal" using
   * `AggregateQuery.isEqual()`.
   *
   * @param other The object to compare to this object for equality.
   * @return `true` if this object is "equal" to the given object, as
   * defined above, or `false` otherwise.
   */
  isEqual(
    other: firestore.AggregateQuerySnapshot<
      AggregateSpecType,
      AppModelType,
      DbModelType
    >
  ): boolean {
    if (this === other) {
      return true;
    }
    if (!(other instanceof AggregateQuerySnapshot)) {
      return false;
    }
    // Since the read time is different on every read, we explicitly ignore all
    // document metadata in this comparison, just like
    // `DocumentSnapshot.isEqual()` does.
    if (!this.query.isEqual(other.query)) {
      return false;
    }

    return deepEqual(this._data, other._data);
  }
}

/**
 * Validates the input string as a field order direction.
 *
 * @private
 * @internal
 * @param arg The argument name or argument index (for varargs methods).
 * @param op Order direction to validate.
 * @throws when the direction is invalid
 * @return a validated input value, which may be different from the provided
 * value.
 */
export function validateQueryOrder(
  arg: string,
  op: unknown
): firestore.OrderByDirection | undefined {
  // For backwards compatibility, we support both lower and uppercase values.
  op = typeof op === 'string' ? op.toLowerCase() : op;
  validateEnumValue(arg, op, Object.keys(directionOperators), {optional: true});
  return op as firestore.OrderByDirection | undefined;
}

/**
 * Validates the input string as a field comparison operator.
 *
 * @private
 * @internal
 * @param arg The argument name or argument index (for varargs methods).
 * @param op Field comparison operator to validate.
 * @param fieldValue Value that is used in the filter.
 * @throws when the comparison operation is invalid
 * @return a validated input value, which may be different from the provided
 * value.
 */
export function validateQueryOperator(
  arg: string | number,
  op: unknown,
  fieldValue: unknown
): firestore.WhereFilterOp {
  // For backwards compatibility, we support both `=` and `==` for "equals".
  if (op === '=') {
    op = '==';
  }

  validateEnumValue(arg, op, Object.keys(comparisonOperators));

  if (
    typeof fieldValue === 'number' &&
    isNaN(fieldValue) &&
    op !== '==' &&
    op !== '!='
  ) {
    throw new Error(
      "Invalid query. You can only perform '==' and '!=' comparisons on NaN."
    );
  }

  if (fieldValue === null && op !== '==' && op !== '!=') {
    throw new Error(
      "Invalid query. You can only perform '==' and '!=' comparisons on Null."
    );
  }

  return op as firestore.WhereFilterOp;
}

/**
 * Validates that 'value' is a DocumentReference.
 *
 * @private
 * @internal
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The argument to validate.
 * @return the DocumentReference if valid
 */
export function validateDocumentReference<
  AppModelType,
  DbModelType extends firestore.DocumentData,
>(
  arg: string | number,
  value: firestore.DocumentReference<AppModelType, DbModelType>
): DocumentReference<AppModelType, DbModelType> {
  if (!(value instanceof DocumentReference)) {
    throw new Error(invalidArgumentMessage(arg, 'DocumentReference'));
  }
  return value;
}

/**
 * Validates that 'value' can be used as a query value.
 *
 * @private
 * @internal
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The argument to validate.
 * @param allowUndefined Whether to allow nested properties that are `undefined`.
 */
function validateQueryValue(
  arg: string | number,
  value: unknown,
  allowUndefined: boolean
): void {
  validateUserInput(arg, value, 'query constraint', {
    allowDeletes: 'none',
    allowTransforms: false,
    allowUndefined,
  });
}

/**
 * Verifies equality for an array of objects using the `isEqual` interface.
 *
 * @private
 * @internal
 * @param left Array of objects supporting `isEqual`.
 * @param right Array of objects supporting `isEqual`.
 * @return True if arrays are equal.
 */
function isArrayEqual<T extends {isEqual: (t: T) => boolean}>(
  left: T[],
  right: T[]
): boolean {
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

/**
 * Returns the first non-undefined value or `undefined` if no such value exists.
 * @private
 * @internal
 */
function coalesce<T>(...values: Array<T | undefined>): T | undefined {
  return values.find(value => value !== undefined);
}
