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
 * @module firestore/reference
 */

'use strict';

let bun = require('bun');
let extend = require('extend');
let immutable = require('immutable');
let is = require('is');
let order = require('./order');
let through = require('through2');

/**
 * Injected.
 *
 * @private
 * @type firestore.Firestore
 */
let Firestore;

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
 */
let validate;

/**
 * Injected.
 *
 * @private
 * @type firestore.Watch
 */
let Watch;

/**
 * Injected.
 *
 * @private
 * @type firestore.WriteBatch
 */
let WriteBatch;

/**
 * @private
 * @type firestore.Path
 */
let Path = require('./path');

/**
 * The direction of a `Query.orderBy()` clause is specified as 'desc' or 'asc'
 * (descending or ascending).
 *
 * @private
 */
const directionOperators = {
  asc: 'ASCENDING',
  ASC: 'ASCENDING',
  desc: 'DESCENDING',
  DESC: 'DESCENDING'
};

/**
 * Filter conditions in a `Query.where()` clause are specified using the
 * strings '<', '<=', '==', '>=', and '>'.
 *
 * @private
 */
const comparisonOperators = {
  '<': 'LESS_THAN',
  '<=': 'LESS_THAN_OR_EQUAL',
  '=': 'EQUAL',
  '==': 'EQUAL',
  '>': 'GREATER_THAN',
  '>=': 'GREATER_THAN_OR_EQUAL'
};

/**
 * Pseudo field name for a document's path.
 *
 * @private
 * @type string
 */
const DOCUMENT_NAME_FIELD = '__name__';

/**
 * The order in which document change events will be returned to the user.
 *
 * @private
 */
const documentChangeOrder = {
  removed: 0,
  added: 1,
  modified: 2
};

/**
 * onSnapshot() callback that receives a QuerySnapshot.
 *
 * @callback querySnapshotCallback
 * @param {firestore.QuerySnapshot} snapshot - A query snapshot.
 */

/**
 * onSnapshot() callback that receives a DocumentSnapshot.
 *
 * @callback documentSnapshotCallback
 * @param {firestore.DocumentSnapshot} snapshot - A document snapshot.
 */

/**
 * onSnapshot() callback that receives an error.
 *
 * @callback errorCallback
 * @param {Error} err - An error from a listen.
 */

/**
 * A DcumentReference refers to a document location in a Firestore database
 * and can be used to write, read, or listen to the location. The document at
 * the referenced location may or may not exist. A DocumentReference can
 * also be used to create a
 * [CollectionReference]{@link firestore.CollectionReference} to a
 * subcollection.
 *
 * @public
 * @alias firestore.DocumentReference
 */
class DocumentReference {
  /**
   * @protected
   * @hideconstructor
   *
   * @param {firestore.Firestore} firestore - The Firestore Database client.
   * @param {firestore.Path} path - The Path of this reference.
   */
  constructor(firestore, path) {
    this._firestore = firestore;
    this._referencePath = path;
  }

  /**
   * The string representation of the DocumentReference's location.
   * @package
   * @return {string}
   */
  get formattedName() {
    return this._referencePath.formattedName;
  }

  /**
   * The [Firestore]{@link firestore.Firestore} instance for the Firestore
   * database (useful for performing transactions, etc.).
   *
   * @public
   * @name firestore.DocumentReference#firestore
   * @type firestore.Firestore
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
  get firestore() {
    return this._firestore;
  }

  /**
   * A string representing the path of the referenced document (relative
   * to the root of the database).
   *
   * @public
   * @name firestore.DocumentReference#path
   * @type string
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   console.log(`Added document at '${documentReference.path}'`);
   * });
   */
  get path() {
    return this._referencePath.relativeName;
  }

  /**
   * The last path document of the referenced document.
   *
   * @public
   * @name firestore.DocumentReference#id
   * @type string
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col');
   *
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   console.log(`Added document with name '${documentReference.id}'`);
   * });
   */
  get id() {
    return this._referencePath.id;
  }

  /**
   * A reference to the collection to which this DocumentReference belongs.
   *
   * @public
   * @name firestore.DocumentReference#parent
   * @type firestore.CollectionReference
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
  get parent() {
    return createCollectionReference(
        this._firestore, this._referencePath.parent());
  }

  /**
   * Retrieve a document from the database. Fails the Promise if the document is
   * not found.
   *
   * @public
   * @return {Promise.<firestore.DocumentSnapshot>} A Promise resolved with a
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
  get() {
    return this.firestore.getAll_([this]).then((result) =>  {
      return result[0];
    });
  }

  /**
   * Gets a [CollectionReference]{@link firestore.CollectionReference} instance
   * that refers to the collection at the specified path.
   *
   * @public
   * @param {string} collectionPath - A slash-separated path to a collection.
   * @return {firestore.CollectionReference} A reference to the new
   * subcollection.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   * let subcollection = documentRef.collection('subcollection');
   * console.log(`Path to subcollection: ${subcollection.path}`);
   */
  collection(collectionPath) {
    validate.isString('collectionPath', collectionPath);

    let path = this._referencePath.child(collectionPath);
    if (!path.isCollection) {
      throw new Error('Argument "collectionPath" must point to a collection.');
    }

    return createCollectionReference(this.firestore, path);
  }

  /**
   * Create a document with the provided object values. This will fail the write
   * if a document exists at its location.
   *
   * @public
   * @param {object.<string, *>} data - An object that contains the fields and
   * data to serialize as the document.
   * @return Promise.<firestore.WriteResult> A Promise that resolves once the
   * document has been successfully written to the backend.
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
  create(data) {
    validate.isDocument('data', data);

    let writeBatch = new WriteBatch(this.firestore);
    return writeBatch.create(this, data).commit().then((res) => {
      return Promise.resolve(res.writeResults[0]);
    });
  }

  /**
   * Deletes the document referred to by this `DocumentReference`.
   *
   * A delete for a non-existing document is treated as a success (unless
   * lastUptimeTime is provided).
   *
   * @public
   * @param {object=} deleteOptions - The preconditions for this delete.
   * @param {string=} deleteOptions.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * delete if the document was last updated at a different time.
   * @return Promise.<firestore.WriteResult> A Promise that resolves once the
   * document has been successfully deleted from the backend.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.delete().then(() => {
   *   console.log('Document successfully deleted.');
   * });
   */
  delete(deleteOptions) {
    validate.isOptionalPrecondition('deleteOptions', deleteOptions);

    let writeBatch = new WriteBatch(this.firestore);
    return writeBatch.delete(this, deleteOptions).commit().then((res) => {
      return Promise.resolve(res.writeResults[0]);
    });
  }

  /**
   * Writes to the document referred to by this DocumentReference. If the
   * document doesn't yet exist, this method creates it and then sets the
   * data. If the document exists, this method overwrites the document data
   * with the new value.
   *
   * @public
   * @param {object<string, *>} data - An object that contains the fields and
   * data to write to the document.
   * @param {object=} writeOptions - The preconditions for this set.
   * @param {boolean=} writeOptions.createIfMissing Whether the document should
   * be created if it doesn't yet exist. Defaults to true.
   * @param {string=} writeOptions.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * set if the document doesn't exist or was last updated at a different time.
   * @return Promise.<firestore.WriteResult> A Promise that resolves once the
   * data has been successfully written to the backend.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({foo: 'bar'}).then(res => {
   *   console.log(`Document written at ${res.updateTime}`);
   * });
   */
   set(data, writeOptions) {
    validate.isDocument('data', data);
    validate.isOptionalPrecondition('writeOptions', writeOptions);

    let writeBatch = new WriteBatch(this.firestore);
    return writeBatch.set(this, data, writeOptions).commit().then((res) => {
      return Promise.resolve(res.writeResults[0]);
    });
  }

  /**
   * Updates fields in the document referred to by this DocumentReference.
   * If no document exists yet, the update fails and the returned Promise will
   * be rejected.
   *
   * @public
   * @param {object<string, *>} data - An object containing the fields and
   * values with which to update the document.
   * @param {object=} updateOptions - The preconditions for this update.
   * @param {boolean=} updateOptions.createIfMissing Whether the document should
   * be created if it doesn't yet exist. Defaults to false.
   * @param {string=} updateOptions.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * update if the document doesn't exist or was last updated at a different
   * time.
   * @return Promise.<firestore.WriteResult> A Promise that resolves once the
   * data has been successfully written to the backend.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.update({foo: 'bar'}).then(res => {
   *   console.log(`Document updated at ${res.updateTime}`);
   * });
   */
  update(data, updateOptions) {
    validate.isDocument('data', data, true);
    validate.isOptionalPrecondition('updateOptions', updateOptions);

    let writeBatch = new WriteBatch(this.firestore);
    return writeBatch.update(this, data, updateOptions).commit().then((res) => {
      return Promise.resolve(res.writeResults[0]);
    });
  }

  /**
   * Attaches a listener for DocumentSnapshot events.
   *
   * @public
   * @param {documentSnapshotCallback} onNext - A callback to be called every
   * time a new `DocumentSnapshot` is available.
   * @param {errorCallback=} onError - A callback to be called if the listen
   * fails or is cancelled. No further callbacks will occur. If unset, errors
   * will be logged to the console.
   *
   * @return {function()} An unsubscribe function that can be called to cancel
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
  onSnapshot(onNext, onError) {
    validate.isFunction('onNext', onNext);
    validate.isOptionalFunction('onError', onError);

    if (!is.defined(onError)) {
      onError = console.error;
    }

    let watch = Watch.forDocument(this);

    return watch.onSnapshot(
        (readTime, docMap) => {
          if (docMap.has(this.formattedName)) {
            onNext(docMap.get(this.formattedName));
          } else {
            let document = new DocumentSnapshot.Builder();
            document.ref = this._referencePath;
            document.readTime = readTime;
            onNext(document.build());
          }
        }, onError);
  }
}

/**
 * A DocumentChange represents a change to the documents matching a query.
 * It contains the document affected and the type of change that occurred.
 *
 * @public
 * @alias firestore.DocumentChange
 */
class DocumentChange {
  /**
   * @package
   * @hideconstructor
   *
   * @param {string} type - 'added' | 'removed' | 'modified'.
   * @param {firestore.DocumentSnapshot} document - The document.
   */
  constructor(type, document) {
    this._type = type;
    this._document = document;
  }

  /**
   * The type of change ('added', 'modified', or 'removed').
   *
   * @public
   * @type string
   * @name firestore.DocumentChange#type
   * @readonly
   */
  get type() {
    return this._type;
  }

  /**
   * The document affected by this change.
   *
   * @public
   * @type firestore.DocumentSnapshot
   * @name firestore.DocumentChange#type
   * @readonly
   */
  get doc() {
    return this._document;
  }
}

/**
 * A Query order-by field.
 *
 * @package
 * @alias firestore.FieldOrder
 */
class FieldOrder {
  /**
   * @package
   *
   * @param {string} fieldPath The name of a document field (member) on which to
   * order query results.
   * @param {string=} direction One of 'ASCENDING' (default) or 'DESCENDING' to
   * set the ordering direction to ascending or descending, respectively.
   */
  constructor(fieldPath, direction) {
    this._field = fieldPath;
    this._direction = direction || directionOperators.ASC;
  }

  /**
   * The name of a document field on which to order query results.
   *
   * @package
   * @type string
   */
  get field() {
    return this._field;
  }


  /**
   * One of 'ASCENDING' (default) or 'DESCENDING'.
   *
   * @package
   * @type string
   */
  get direction() {
    return this._direction;
  }

  /**
   * Generates the proto representation for this field order.
   *
   * @package
   * @return {Object}
   */
  toProto() {
    return {
      field: {
        fieldPath: this._field
      },
      direction: this._direction
    };
  }
}

/**
 * A field constraint for a Query where clause.
 *
 * @package
 * @alias firestore.FieldFilter
 */
class FieldFilter {
  /**
   * @package
   *
   * @param {string} fieldPath The path of the property value to compare.
   * @param {string} opString A comparison operation.
   * @param {*} value The value to which to compare the
   * field for inclusion in a query.
   */
  constructor(fieldPath, opString, value) {
    this._field = fieldPath;
    this._opString = opString;
    this._value = value;
  }

  /**
   * Generates the proto representation for this field filter.
   *
   * @package
   * @return {Object}
   */
  toProto() {
    if (typeof this._value === 'number' && isNaN(this._value)) {
      return {
        unaryFilter: {
          field: {
            fieldPath: this._field,
          },
          op: 'IS_NAN',
        }
      };
    }

    if (this._value === null) {
      return {
        unaryFilter: {
          field: {
            fieldPath: this._field,
          },
          op: 'IS_NULL'
        }
      };
    }

    return {
      fieldFilter: {
        field: {
          fieldPath: this._field,
        },
        op: this._opString,
        value: DocumentSnapshot.encodeValue(this._value)
      }
    };
  }
}

/**
 * A QuerySnapshot contains zero or more
 * [DocumentSnapshot]{@link firestore.DocumentSnapshot} objects
 * representing the results of a query. The documents can be accessed as an
 * array via the [documents]{@link firestore.QuerySnapshot#documents} property
 * or enumerated using the [forEach]{@link firestore.QuerySnapshot#forEach}
 * method. The number of documents can be determined via the
 * [empty]{@link firestore.QuerySnapshot#empty} and
 * [size]{@link firestore.QuerySnapshot#size} properties.
 *
 * @public
 * @alias firestore.QuerySnapshot
 */
class QuerySnapshot {
  /**
   * @package
   * @hideconstructor
   *
   * @param {firestore.Query} query - The originating query.
   * @param {string} readTime - The ISO 8601 time when this query snapshot was
   * current.
   * @param {Immutable.Map<string,firestore.DocumentSnapshot>} docMap -
   * The documents retrieved by this query keyed by their name.
   * @param {Array.<firestore.DocumentChange>} docChanges - The changes
   * from the previous snapshot.
   */
  constructor(query, readTime, docMap, docChanges) {
    this._query = query;
    this._comparator = query.comparator();
    this._readTime = readTime;
    this._docMap = docMap;
    this._docChanges = docChanges;
  }

  /**
   * The query on which you called `get` or `onSnapshot` in order to get this
   * `QuerySnapshot`.
   *
   * @public
   * @type firestore.Query
   * @name firestore.QuerySnapshot#query
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
  get query() {
    return this._query;
  }

  /**
   * An array of all the documents in this QuerySnapshot.
   *
   * @public
   * @type Array.<firestore.DocumentSnapshot>
   * @name firestore.QuerySnapshot#docs
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
  get docs() {
    if (this._docs) {
      return this._docs;
    }
    this._docs = this._docMap.toList().toJS();
    this._docs.sort(this._comparator);
    return this._docs;
  }

  /**
   * An array of all changes in this QuerySnapshot.
   *
   * @public
   * @type Array.<firestore.DocumentChange>
   * @name firestore.QuerySnapshot#docChanges
   * @readonly
   */
  get docChanges() {
    if (this._changes) {
      return this._changes;
    }
    this._changes = this._docChanges;
    this._changes.sort((c1, c2) => {
      let typeOrder = order.primitiveComparator(documentChangeOrder[c1.type],
          documentChangeOrder[c2.type]);
      return typeOrder || this._comparator(c1.doc, c2.doc);
    });
    return this._changes;
  }

  /**
   * True if there are no documents in the QuerySnapshot.
   *
   * @public
   * @type boolean
   * @name firestore.QuerySnapshot#empty
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
  get empty() {
    return this._docMap.size === 0;
  }

  /**
   * The number of documents in the QuerySnapshot.
   *
   * @public
   * @type number
   * @name firestore.QuerySnapshot#size
   * @readonly
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then(querySnapshot => {
   *   console.log(`Found ${querySnapshot.size} documents.`);
   * });
   */
  get size() {
    return this._docMap.size;
  }

  /**
   * The time this query snapshot was obtained.
   *
   * @type {string}
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.get().then((querySnapshot) => {
   *   console.log(`Query results returned at '${querySnapshot.readTime}'`);
   * });
   */
  get readTime() {
    return this._readTime;
  }

  /**
   * Enumerates all of the documents in the QuerySnapshot.
   *
   * @param {function} callback - A callback to be called with a
   * [DocumentSnapshot]{@link firestore.DocumentSnapshot} for each document in
   * the snapshot.
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
  forEach(callback) {
    validate.isFunction('callback', callback);

    for (let doc of this.docs) {
      callback(doc);
    }
  }
}

/**
 * A Query refers to a Query which you can read ore stream from You can also
 * construct refined `Query` objects by adding filters and ordering.
 *
 * @public
 * @alias firestore.Query
 */
class Query {
  /**
   * @protected
   * @hideconstructor
   *
   * @param {firestore.Firestore} firestore - The Firestore Database client.
   * @param {firestore.Path} path Path to the collection to be queried.
   * @param {Array.<firestore.FieldOrder>=} fieldOrders - Sequence of fields to
   * control the order of results.
   * @param {Array.<firestore.FieldFilter>=} fieldFilters - Sequence of fields
   * constraining the results of the query.
   * @param {object=} queryOptions Additional query options.
   */
  constructor(firestore, path, fieldFilters, fieldOrders, queryOptions) {
    this._firestore = firestore;
    this._api = firestore.api;
    this._referencePath = path;
    this._fieldFilters = fieldFilters || [];
    this._fieldOrders = fieldOrders || [];
    this._queryOptions = queryOptions || {};
  }

  /**
   * The string representation of the Query's location.
   * @package
   * @return {string}
   */
  get formattedName() {
    return this._referencePath.formattedName;
  }

  /**
   * The [Firestore]{@link firestore.Firestore] instance for the Firestore
   * database (useful for performing transactions, etc.).
   *
   * @public
   * @type firestore.Firestore
   * @name firestore.Query#firestore
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
  get firestore() {
    return this._firestore;
  }

  /**
   * Creates and returns a new Query with the additional filter that documents
   * must contain the specified field and the value should satisfy the
   * relation constraint provided.
   *
   * Returns a new Query that constrains the value of a Document property.
   *
   * This function returns a new (immutable) instance of the ``Query``
   * (rather than modify the existing ``Query``) to impose the filter.
   *
   * @public
   * @param {string} fieldPath - The name of a property value to compare.
   * @param {string} opStr - A comparison operation in the form of a string
   * (e.g., "<").
   * @param {*} value - The value to which to compare the field for inclusion in
   * a query.
   * @return {firestore.Query} The created Query.
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
  where(fieldPath, opStr, value) {
    validate.isFieldPath('fieldPath', fieldPath);
    validate.isFieldFilter('fieldFilter', opStr, value);

    let newFilter = new FieldFilter(
        fieldPath, comparisonOperators[opStr], value);
    let combinedFilters = this._fieldFilters.concat(newFilter);
    return new Query(this.firestore, this._referencePath, combinedFilters,
        this._fieldOrders, this._queryOptions);
  }

  /**
   * Creates and returns a new Query instance that applies a field mask to the
   * result and returns the specified subset of fields. You can specify a list
   * of field paths to return, or use an empty list to only return the
   * references of matching documents.
   *
   * This function returns a new (immutable) instance of the ``Query``
   * (rather than modify the existing ``Query``) to impose the field mask.
   *
   * @public
   * @param {Array.<string>|...string} varArgs The field paths to return.
   * @return {firestore.Query} The new Query with the field mask applied.
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
  select(varArgs) {
    varArgs = is.array(arguments[0]) ? arguments[0] : [].slice.call(arguments);
    let fieldReferences = [];

    if (varArgs.length === 0) {
      fieldReferences.push({fieldPath: DOCUMENT_NAME_FIELD});
    } else {
      for (let i = 0; i < varArgs.length; ++i) {
        validate.isFieldPath(i, varArgs[i]);
        fieldReferences.push({
          fieldPath: varArgs[i]
        });
      }
    }

    let options = extend(true, {}, this._queryOptions);
    options.selectFields = {fields: fieldReferences};

    return new Query(this.firestore, this._referencePath, this._fieldFilters,
        this._fieldOrders, options);
  }

  /**
   * Creates and returns a new Query that's additionally sorted by the
   * specified field, optionally in descending order instead of ascending.
   *
   * @public
   * @param {string} fieldPath - The field to sort by.
   * @param {string=} directionStr - Optional direction to sort by ('asc' or
   * 'desc'). If not specified, order will be ascending.
   * @return {firestore.Query} The created Query.
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
  orderBy(fieldPath, directionStr) {
    validate.isFieldPath('fieldPath', fieldPath);
    validate.isOptionalFieldOrder('directionStr', directionStr);

    let newOrder = new FieldOrder(fieldPath, directionOperators[directionStr]);
    let combinedOrders = this._fieldOrders.concat(newOrder);
    return new Query(this.firestore, this._referencePath, this._fieldFilters,
        combinedOrders, this._queryOptions);
  }

  /**
   * Creates and returns a new Query that's additionally limited to only
   * return up to the specified number of documents.
   *
   * @public
   * @param {number} n - The maximum number of items to return.
   * @return {firestore.Query} The created Query.
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
  limit(n) {
    validate.isInteger('n', n);

    let options = extend(true, {}, this._queryOptions);
    options.limit = n;
    return new Query(this.firestore, this._referencePath, this._fieldFilters,
        this._fieldOrders, options);
  }

  /**
   * Specifies the offset for the returned results.
   *
   * @public
   * @param {number} n - The offset to apply to the Query results
   * @return {firestore.Query} A query with the offset.
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
  offset(n) {
    validate.isInteger('n', n);

    let options = extend(true, {}, this._queryOptions);
    options.offset = n;
    return new Query(this.firestore, this._referencePath, this._fieldFilters,
        this._fieldOrders, options);
  }

  /**
   * Builds a Firestore 'Position' proto message.
   *
   * @private
   *
   * @param fieldsOrDocument fieldsOrDocument The document or
   * set of fields to use as the boundary.
   * @param before Whether the query boundary lies just before or after the
   * provided data.
   * @return {Object} The proto message.
   */
  _buildPosition(fieldsOrDocument, before) {
    let options = {
      before: before
    };

    let fields;

    if (is.instanceof(fieldsOrDocument, DocumentSnapshot)) {
      fields = extend(true, {}, fieldsOrDocument.data());
    } else if (is.object(fieldsOrDocument)) {
      validate.isDocument('fieldsOrDocument', fieldsOrDocument);
      fields = fieldsOrDocument;
    } else {
      throw new Error('Specify either a valid Document or JavaScript object ' +
          'as your Query boundary.');
    }

    options.values = [];

    let found = {};

    for (let i = 0; i < this._fieldOrders.length; ++i) {
      let fieldName = this._fieldOrders[i].field;

      if (!is.defined(fields[fieldName])) {
        break;
      }

      found[fieldName] = true;
      options.values.push(DocumentSnapshot.encodeValue(fields[fieldName]));
    }

    for (let prop in fields) {
      if (fields.hasOwnProperty(prop) && !found[prop]) {
        throw new Error(`Field "${prop}" does not have a corresponding ` +
            'OrderBy constraint.');
      }
    }

    return options;
  }

  /**
   * Creates and returns a new Query that starts at the provided document
   * or set of fields (inclusive). The provided fields or the contents of the
   * provided document must be a covering prefix of the
   * [orderBy]{@link firestore.Query#orderBy}. For example, if the query is
   * ordered by fields a, b, c and finally by key, then if the fields contain c
   * it must also contain b and a; if they contain b, they must also contain a.
   *
   * The starting position is relative to the order of the query.
   *
   * @public
   * @param {object|firestore.DocumentSnapshot} fieldsOrDocument - The
   * document or set of fields to start the query at.
   * @returns {firestore.Query} A query with the new starting point.
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').startAt({foo: 42}).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  startAt(fieldsOrDocument) {
    let options = extend(true, {}, this._queryOptions);

    options.startAt = this._buildPosition(fieldsOrDocument, true);

    return new Query(this.firestore, this._referencePath, this._fieldFilters,
        this._fieldOrders, options);
  }

  /**
   * Creates and returns a new Query that starts after the provided document
   * or set of fields (exclusive). The provided fields or the contents of the
   * provided document must be a covering prefix of the
   * [orderBy]{@link firestore.Query#orderBy}. For example, if the query is
   * ordered by fields a, b, c and finally by key, then if the fields contain c
   * it must also contain b and a; if they contain b, they must also contain a.
   *
   * The starting position is relative to the order of the query.
   *
   * @public
   * @param {object|firestore.DocumentSnapshot} fieldsOrDocument - The
   * document or set of fields to start the query after.
   * @returns {firestore.Query} A query with the new starting point.
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').startAfter({foo: 42}).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  startAfter(fieldsOrDocument) {
    let options = extend(true, {}, this._queryOptions);

    options.startAt = this._buildPosition(fieldsOrDocument, false);

    return new Query(this.firestore, this._referencePath, this._fieldFilters,
        this._fieldOrders, options);
  }

  /**
   * Creates and returns a new Query that ends before the provided document
   * or set of fields (exclusive). The provided fields or the contents of the
   * provided document must be a covering prefix of the
   * [orderBy]{@link firestore.Query#orderBy}. For example, if the query is
   * ordered by fields a, b, c and finally by key, then if the fields contain c
   * it must also contain b and a; if they contain b, they must also contain a.
   *
   * The ending position is relative to the order of the query.
   *
   * @public
   * @param {object|firestore.DocumentSnapshot} fieldsOrDocument - The
   * document or set of fields to end the query before.
   * @returns {firestore.Query} A query with the new ending point.
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').endBefore({foo: 42}).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  endBefore(fieldsOrDocument) {
    let options = extend(true, {}, this._queryOptions);

    options.endAt = this._buildPosition(fieldsOrDocument, true);

    return new Query(this.firestore, this._referencePath, this._fieldFilters,
        this._fieldOrders, options);
  }

  /**
   * Creates and returns a new Query that ends at the provided document
   * or set of fields (inclusive). The provided fields or the contents of the
   * provided document must be a covering prefix of the
   * [orderBy]{@link firestore.Query#orderBy}. For example, if the query is
   * ordered by fields a, b, c and finally by key, then if the fields contain
   * c it must also contain b and a; if they contain b, they must also contain
   * a.
   *
   * The ending position is relative to the order of the query.
   *
   * @public
   * @param {object|firestore.DocumentSnapshot} fieldsOrDocument - The
   * document or set of fields to end the query at.
   * @returns {firestore.Query} A query with the new ending point.
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.orderBy('foo').endAt({foo: 42}).get().then(querySnapshot => {
   *   querySnapshot.forEach(documentSnapshot => {
   *     console.log(`Found document at ${documentSnapshot.ref.path}`);
   *   });
   * });
   */
  endAt(fieldsOrDocument) {
    let options = extend(true, {}, this._queryOptions);

    options.endAt = this._buildPosition(fieldsOrDocument, false);

    return new Query(this.firestore, this._referencePath, this._fieldFilters,
        this._fieldOrders, options);
  }

  /**
   * Executes the query and returns the results as a
   * [QuerySnapshot]{@link firestore.QuerySnapshot}.
   *
   * @public
   * @return {Promise.<QuerySnapshot>} A Promise that resolves with the results
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
  get() {
    return this._get();
  }

  /**
   * Internal get() method that accepts an optional transaction id.
   *
   * @package
   * @param {bytes=} queryOptions.transactionId - A transaction ID.
   */
  _get(queryOptions) {
    let self = this;
    let docs = {};
    let changes = [];

    return new Promise((resolve, reject) => {
      let readTime;

      self._stream(queryOptions)
          .on('error', err => { reject(err); })
          .on('data', result => {
            readTime = result.readTime;
            if (result.document) {
              let document = result.document;
              docs[document.ref.formattedName] = document;
              changes.push(new DocumentChange(DocumentChange.ADDED, document));
            }
          })
          .on('end', () => {
            resolve(new QuerySnapshot(
                this, readTime, immutable.Map(docs), changes));
          });
    });
  }

  /**
   * Executes the query and streams the results as
   * [DocumentSnapshot]{@link firestore.DocumentSnapshot}.
   *
   * @public
   * @return {Stream.<firestore.DocumentSnapshot>} A stream of Documents.
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
  stream() {
    let responseStream = this._stream();

    let transform = through.obj(function(chunk, encoding, callback) {
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
   * @package
   * @param {bytes=} queryOptions.transactionId - A transaction ID.
   * @return Serialized JSON for the query.
   */
  toProto(queryOptions) {
    let reqOpts = {
      parent: this._referencePath.parent().formattedName,
      structuredQuery: {
        from: [{
          collectionId: this._referencePath.id
        }]
      }
    };

    let structuredQuery = reqOpts.structuredQuery;

    if (this._fieldFilters.length) {
      let filters = [];
      for (let fieldFilter of this._fieldFilters) {
        filters.push(fieldFilter.toProto());
      }
      structuredQuery.where = {
        compositeFilter: {
          op: 'AND',
          filters: filters
        }
      };
    }

    if (this._fieldOrders.length) {
      let orderBy = [];
      for (let fieldOrder of this._fieldOrders) {
        orderBy.push(fieldOrder.toProto());
      }
      structuredQuery.orderBy = orderBy;
    }

    if (this._queryOptions.limit) {
      structuredQuery.limit = { value: this._queryOptions.limit };
    }

    if (this._queryOptions.offset) {
      structuredQuery.offset = this._queryOptions.offset;
    }

    if (this._queryOptions.startAt) {
      structuredQuery.startAt = this._queryOptions.startAt;
    }

    if (this._queryOptions.endAt) {
      structuredQuery.endAt = this._queryOptions.endAt;
    }

    if (this._queryOptions.selectFields) {
      structuredQuery.select = this._queryOptions.selectFields;
    }

    if (queryOptions && queryOptions.transactionId) {
      reqOpts.transaction = queryOptions.transactionId;
    }

    return reqOpts;
  }

  /**
   * Internal streaming method that accepts an optional transaction id.
   *
   * @package
   * @param {bytes=} queryOptions.transactionId - A transaction ID.
   * @return {stream} A stream of Documents.
   */
  _stream(queryOptions) {
    let request = this.toProto(queryOptions);
    let self = this;

    let stream = through.obj(function(proto, enc, callback) {
      let readTime = DocumentSnapshot.toISOTime(proto.readTime);

      if (proto.document) {
        let response = proto.document;
        let document = new DocumentSnapshot.Builder();
        document.ref = new DocumentReference(
            self.firestore, Path.fromName(response.name));
        document.fieldsProto = response.fields || {};
        document.readTime = readTime ;
        document.createTime = DocumentSnapshot.toISOTime(response.createTime);
        document.updateTime =  DocumentSnapshot.toISOTime(response.updateTime);
        this.push({ document: document.build(), readTime: readTime });
      } else {
        this.push({ readTime: readTime });
      }
      callback();
    });

    this.firestore.readStream(
        this._api.Firestore.runQuery.bind(this._api.Firestore), request
    ).then(backendStream => {
      backendStream.on('error', err => {
        stream.destroy(err);
      });
      backendStream.pipe(stream);
    });

    return stream;
  }

  /**
   * Attaches a listener for QuerySnapshot events.
   *
   * @public
   * @param {querySnapshotCallback} onNext - A callback to be called every time
   * a new [QuerySnapshot]{@link firestore.QuerySnapshot} is available.
   * @param {errorCallback=} onError - A callback to be called if the listen
   * fails or is cancelled. No further callbacks will occur.
   *
   * @return {function()} An unsubscribe function that can be called to cancel
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
  onSnapshot(onNext, onError) {
    validate.isFunction('onNext', onNext);
    validate.isOptionalFunction('onError', onError);

    if (!is.defined(onError)) {
      onError = console.error;
    }

    let watch = Watch.forQuery(this);

    return watch.onSnapshot(
        (readTime, docs, changes) => {
          onNext(new QuerySnapshot(this, readTime, docs, changes));
        }, onError);
  }

  /**
   * Returns a function that can be used to sort DocumentSnapshots according to
   * the sort criteria of this query.
   *
   * @package
   */
  comparator() {
    return (doc1, doc2) => {
      // Add implicit sorting by name, using the last specified direction.
      let lastDirection = this._fieldOrders.length === 0 ?
          directionOperators.ASC :
          this._fieldOrders[this._fieldOrders.length - 1].direction;
      let orderBys = this._fieldOrders.concat(
          new FieldOrder(DOCUMENT_NAME_FIELD, lastDirection));

      for (let orderBy of orderBys) {
        let comp;
        if (orderBy.field === DOCUMENT_NAME_FIELD) {
          comp = Path.compare(doc1.ref._referencePath, doc2.ref._referencePath);
        } else {
          const v1 = doc1.protoField(orderBy.field);
          const v2 = doc2.protoField(orderBy.field);
          if (!is.defined(v1) || !is.defined(v2)) {
            throw new Error(
                'Trying to compare documents on fields that don\'t exist.');
          }
          comp = order.compare(v1, v2);
        }

        if (comp !== 0) {
          const direction =
              (orderBy.direction === directionOperators.ASC) ? 1 : -1;
          return direction * comp;
        }
      }

      // TODO(klimt): Add an implicit sort for any inequality filters that don't
      // have explicit orders.
      // The server augments the explicit sort order in certain documented
      // cases. In these cases, the client's sort order and server's sort order
      // may not match. This is considered acceptable behavior for now, since a)
      // the client did not specify an explicit sort order, so the sort order is
      // technically undefined, and b) it does not affect the actual results,
      // because the client does not do any filtering based on sort order.

      return 0;
    };
  }
}

/**
 * @class
 *
 * A CollectionReference object can be used for adding documents, getting
 * document references, and querying for documents (using the methods
 * inherited from [Query]{@link firestore.Query}).
 *
 * @alias firestore.CollectionReference
 * @hideconstructor
 * @extends firestore.Query
 *
 */
class CollectionReference extends Query {
  /**
   * @protected
   * @hideconstructor
   *
   * @param {firestore.Firestore} firestore - The Firestore Database client.
   * @param {firestore.Path} path - The Path of this collection.
   */
  constructor(firestore, path) {
    super(firestore, path);
  }

  /**
   * ID of the referenced collection.
   *
   * @public
   * @type string
   * @name firestore.CollectionReference#id
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col/doc/subcollection');
   * console.log(`ID of the subcollection: ${collectionRef.id}`);
   */
  get id() {
    return this._referencePath.id;
  }

  /**
   * A reference to the containing Document if this is a subcollection, else
   * null.
   *
   * @public
   * @type firestore.DocumentReference
   * @name firestore.CollectionReference#parent
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col/doc/subcollection');
   * let documentRef = collectionRef.parent;
   * console.log(`Parent name: ${documentRef.path}`);
   */
  get parent() {
    return new DocumentReference(this._firestore, this._referencePath.parent());
  }

  /**
   * A string representing the path of the referenced collection (relative
   * to the root of the database).
   *
   * @public
   * @type string
   * @name firestore.CollectionReference#path
   * @readonly
   *
   * @example
   * let collectionRef = firestore.collection('col/doc/subcollection');
   * console.log(`Path of the subcollection: ${collectionRef.path}`);
   */
  get path() {
    return this._referencePath.relativeName;
  }

  /**
   * Gets a [DocumentReference]{@link firestore.DocumentReference} instance that
   * refers to the document at the specified path. If no path is specified, an
   * automatically-generated unique ID will be used for the returned
   * DocumentReference.
   *
   * @public
   * @param {string=} documentPath - A slash-separated path to a document.
   * @returns {firestore.DocumentReference} The `DocumentReference`
   * instance.
   *
   * @example
   * let collectionRef = firestore.collection('col');
   * let documentRefWithName = collectionRef.doc('doc');
   * let documentRefWithAutoId = collectionRef.doc();
   * console.log(`Reference with name: ${documentRefWithName.path}`);
   * console.log(`Reference with auto-id: ${documentRefWithAutoId.path}`);
   */
  doc(documentPath) {
    validate.isOptionalString('documentPath', documentPath);

    if (!is.defined(documentPath)) {
      documentPath = Firestore.autoId();
    }

    let path = this._referencePath.child(documentPath);
    if (!path.isDocument) {
      throw new Error('Argument "documentPath" must point to a document.');
    }

    return new DocumentReference(this._firestore, path);
  }

  /**
   * Add a new document to this collection with the specified data, assigning
   * it a document ID automatically.
   *
   * @public
   * @param {object<string, *>} data - An Object containing the data for the new
   * document.
   * @return {Promise.<firestore.DocumentReference>} A Promise resolved with a
   * [DocumentReference]{@link firestore.DocumentReference} pointing to the
   * newly created document.
   *
   * @example
   * let collectionRef = firestore.collection('col');
   * collectionRef.add({foo: 'bar'}).then(documentReference => {
   *   console.log(`Added document with name: ${documentReference.id}`);
   * });
   */
  add(data) {
    validate.isDocument('data', data);

    let documentRef = this.doc();
    return documentRef.set(data).then(() => {
      return Promise.resolve(documentRef);
    });
  }
}
/**
 * Creates a new CollectionReference. Invoked by DocumentReference to avoid
 * invalid declaration order.
 *
 * @param {firestore.Firestore} firestore - The Firestore Database client.
 * @param {firestore.Path} path - The Path of this collection.
 * @return {firestore.CollectionReference}
 */
function createCollectionReference(firestore, path) {
  return new CollectionReference(firestore, path);
}

/**
 * Validates the input string as a field order direction.
 *
 * @package
 * @param {string=} str Order direction to validate.
 * @throws {Error} when the direction is invalid
 */
function validateFieldOrder(str) {
  if (!is.string(str) || !is.defined(directionOperators[str])) {
    throw new Error('Order must be one of "asc" or "desc".');
  }

  return true;
}

/**
 * Validates the input string as a field comparison operator.
 *
 * @package
 * @param {string} str Field comparison operator to validate.
 * @param {*} val Value that is used in the filter.
 * @throws {Error} when the comparison operation is invalid
 */
function validateFieldFilter(str, val) {
  if (is.string(str) && comparisonOperators[str]) {
    let op = comparisonOperators[str];

    if (typeof val === 'number' && isNaN(val) && op !== 'EQUAL') {
      throw new Error('Invalid query. You can only perform equals ' +
          'comparisons on NaN.');
    }

    if (val === null && op !== 'EQUAL') {
      throw new Error('Invalid query. You can only perform equals ' +
          'comparisons on Null.');
    }

    return true;
  }

  throw new Error('Operator must be one of "<", "<=", "==", ">", or ">=".');
}

/**
 * Validates that 'value' is a DocumentReference.
 *
 * @package
 * @param {*} value The argument to validate.
 * @return 'true' is value is an instance of DocumentReference.
 */
function validateDocumentReference(value) {
  return is.instanceof(value, DocumentReference);
}


module.exports = (FirestoreType) => {
  Firestore = FirestoreType;
  let document = require('./document.js')(
      FirestoreType, DocumentReference
  );
  DocumentSnapshot = document.DocumentSnapshot;
  Watch = require('./watch.js')(
    DocumentChange, DocumentReference, DocumentSnapshot);
  WriteBatch = require('./write-batch.js')(FirestoreType, DocumentReference,
      validateDocumentReference).WriteBatch;
  validate = require('./validate')({
    Document: document.validateDocumentData,
    FieldFilter: validateFieldFilter,
    FieldOrder: validateFieldOrder,
    FieldPath: document.validateFieldPath,
    Precondition: document.validatePrecondition,
  });
  return {
    CollectionReference, DocumentReference, Query, QuerySnapshot,
    validateDocumentReference
  };
};
