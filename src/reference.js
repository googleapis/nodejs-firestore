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

const bun = require('bun');
const extend = require('extend');
const is = require('is');
const order = require('./order');
const through = require('through2');

/*!
 * Injected.
 *
 * @see Firestore
 */
let Firestore;

/*!
 * Injected.
 *
 * @see DocumentSnapshot
 */
let DocumentSnapshot;

/*!
 * Injected.
 */
let validate;

/*!
 * Injected.
 *
 * @see Watch
 */
let Watch;

/*!
 * Injected.
 *
 * @see WriteBatch
 */
let WriteBatch;

const path = require('./path');

/*!
 * @private
 * @see ResourcePath
 */
const ResourcePath = path.ResourcePath;

/*!
 * @private
 * @see FieldPath
 */
const FieldPath = path.FieldPath;

/*!
 * The direction of a `Query.orderBy()` clause is specified as 'desc' or 'asc'
 * (descending or ascending).
 *
 * @private
 */
const directionOperators = {
  asc: 'ASCENDING',
  ASC: 'ASCENDING',
  desc: 'DESCENDING',
  DESC: 'DESCENDING',
};

/*!
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
  '>=': 'GREATER_THAN_OR_EQUAL',
};

/**
 * onSnapshot() callback that receives a QuerySnapshot.
 *
 * @callback querySnapshotCallback
 * @param {QuerySnapshot} snapshot - A query snapshot.
 */

/**
 * onSnapshot() callback that receives a DocumentSnapshot.
 *
 * @callback documentSnapshotCallback
 * @param {DocumentSnapshot} snapshot - A document snapshot.
 */

/**
 * onSnapshot() callback that receives an error.
 *
 * @callback errorCallback
 * @param {Error} err - An error from a listen.
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
class DocumentReference {
  /**
   * @private
   * @hideconstructor
   *
   * @param {Firestore} firestore - The Firestore Database client.
   * @param {ResourcePath} path - The Path of this reference.
   */
  constructor(firestore, path) {
    this._firestore = firestore;
    this._referencePath = path;
  }

  /**
   * The string representation of the DocumentReference's location.
   * @private
   * @type {string}
   * @name DocumentReference#formattedName
   */
  get formattedName() {
    return this._referencePath.formattedName;
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
  get firestore() {
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
  get path() {
    return this._referencePath.relativeName;
  }

  /**
   * The last path document of the referenced document.
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
  get id() {
    return this._referencePath.id;
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
  get parent() {
    return createCollectionReference(
      this._firestore,
      this._referencePath.parent()
    );
  }

  /**
   * Returns the [ResourcePath]{@link ResourcePath} for this
   * DocumentReference.
   *
   * @private
   * @type {ResourcePath}
   * @readonly
   */
  get ref() {
    return this._referencePath;
  }

  /**
   * Retrieve a document from the database. Fails the Promise if the document is
   * not found.
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
  get() {
    return this._firestore.getAll_([this]).then(result => {
      return result[0];
    });
  }

  /**
   * Gets a [CollectionReference]{@link CollectionReference} instance
   * that refers to the collection at the specified path.
   *
   * @param {string} collectionPath - A slash-separated path to a collection.
   * @returns {CollectionReference} A reference to the new
   * subcollection.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   * let subcollection = documentRef.collection('subcollection');
   * console.log(`Path to subcollection: ${subcollection.path}`);
   */
  collection(collectionPath) {
    validate.isResourcePath('collectionPath', collectionPath);

    let path = this._referencePath.append(collectionPath);
    if (!path.isCollection) {
      throw new Error('Argument "collectionPath" must point to a collection.');
    }

    return createCollectionReference(this._firestore, path);
  }

  /**
   * Fetches the subcollections that are direct children of this document.
   *
   * @returns {Promise.<Array.<CollectionReference>>} A Promise that
   * contains an array with CollectionReferences.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.getCollections().then(collections => {
   *   for (let collection of collections) {
   *     console.log(`Found subcollection with id: ${collection.id}`);
   *   }
   * });
   */
  getCollections() {
    let request = {
      parent: this._referencePath.formattedName,
    };

    let api = this._firestore.api.Firestore;

    return this._firestore
      .request(api.listCollectionIds.bind(api), request)
      .then(collectionIds => {
        let collections = [];

        // We can just sort this list using the default comparator since it will
        // only contain collection ids.
        collectionIds.sort();

        for (let collectionId of collectionIds) {
          collections.push(this.collection(collectionId));
        }

        return collections;
      });
  }

  /**
   * Create a document with the provided object values. This will fail the write
   * if a document exists at its location.
   *
   * @param {DocumentData} data - An object that contains the fields and data to
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
  create(data) {
    let writeBatch = new WriteBatch(this._firestore);
    return writeBatch
      .create(this, data)
      .commit()
      .then(writeResults => {
        return Promise.resolve(writeResults[0]);
      });
  }

  /**
   * Deletes the document referred to by this `DocumentReference`.
   *
   * A delete for a non-existing document is treated as a success (unless
   * lastUptimeTime is provided).
   *
   * @param {Precondition=} precondition - A precondition to enforce for this
   * delete.
   * @param {string=} precondition.lastUpdateTime If set, enforces that the
   * document was last updated at lastUpdateTime (as ISO 8601 string). Fails the
   * delete if the document was last updated at a different time.
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
  delete(precondition) {
    let writeBatch = new WriteBatch(this._firestore);
    return writeBatch
      .delete(this, precondition)
      .commit()
      .then(writeResults => {
        return Promise.resolve(writeResults[0]);
      });
  }

  /**
   * Writes to the document referred to by this DocumentReference. If the
   * document does not yet exist, it will be created. If you pass
   * [SetOptions]{@link SetOptions}, the provided data can be merged into an
   * existing document.
   *
   * @param {DocumentData} data - A map of the fields and values for the
   * document.
   * @param {SetOptions=} options - An object to configure the set behavior.
   * @param {boolean=} options.merge - If true, set() only replaces the
   * values specified in its data argument. Fields omitted from this set() call
   * remain untouched.
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
  set(data, options) {
    let writeBatch = new WriteBatch(this._firestore);
    return writeBatch
      .set(this, data, options)
      .commit()
      .then(writeResults => {
        return Promise.resolve(writeResults[0]);
      });
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
   * @param {UpdateData|string|FieldPath} dataOrField - An object
   * containing the fields and values with which to update the document
   * or the path of the first field to update.
   * @param {
   * ...(*|string|FieldPath|Precondition)} preconditionOrValues -
   * An alternating list of field paths and values to update or a Precondition
   * to restrict this update.
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
  update(dataOrField, preconditionOrValues) {
    let writeBatch = new WriteBatch(this._firestore);
    preconditionOrValues = Array.prototype.slice.call(arguments, 1);
    return writeBatch.update
      .apply(writeBatch, [this, dataOrField].concat(preconditionOrValues))
      .commit()
      .then(writeResults => {
        return Promise.resolve(writeResults[0]);
      });
  }

  /**
   * Attaches a listener for DocumentSnapshot events.
   *
   * @param {documentSnapshotCallback} onNext - A callback to be called every
   * time a new `DocumentSnapshot` is available.
   * @param {errorCallback=} onError - A callback to be called if the listen
   * fails or is cancelled. No further callbacks will occur. If unset, errors
   * will be logged to the console.
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
  onSnapshot(onNext, onError) {
    validate.isFunction('onNext', onNext);
    validate.isOptionalFunction('onError', onError);

    if (!is.defined(onError)) {
      onError = console.error; // eslint-disable-line no-console
    }

    let watch = Watch.forDocument(this);

    return watch.onSnapshot((readTime, docs) => {
      for (let document of docs()) {
        if (document.ref.path === this.path) {
          onNext(document);
          return;
        }
      }

      // The document is missing.
      let document = new DocumentSnapshot.Builder();
      document.ref = this._referencePath;
      document.readTime = readTime;
      onNext(document.build());
    }, onError);
  }
}

/**
 * A DocumentChange represents a change to the documents matching a query.
 * It contains the document affected and the type of change that occurred.
 *
 * @class
 */
class DocumentChange {
  /**
   * @private
   * @hideconstructor
   *
   * @param {string} type - 'added' | 'removed' | 'modified'.
   * @param {DocumentSnapshot} document - The document.
   * @param {number} oldIndex - The index in the documents array prior to this
   * change.
   * @param {number} newIndex - The index in the documents array after this
   * change.
   */
  constructor(type, document, oldIndex, newIndex) {
    this._type = type;
    this._document = document;
    this._oldIndex = oldIndex;
    this._newIndex = newIndex;
  }

  /**
   * The type of change ('added', 'modified', or 'removed').
   *
   * @type {string}
   * @name DocumentChange#type
   * @readonly
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   * let docsArray = [];
   *
   * let unsubscribe = query.onSnapshot(querySnapshot => {
   *   for (let change of querySnapshot.docChanges) {
   *     console.log(`Type of change is ${change.type}`);
   *   }
   * });
   *
   * // Remove this listener.
   * unsubscribe();
   */
  get type() {
    return this._type;
  }

  /**
   * The document affected by this change.
   *
   * @type {DocumentSnapshot}
   * @name DocumentChange#doc
   * @readonly
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * let unsubscribe = query.onSnapshot(querySnapshot => {
   *   for (let change of querySnapshot.docChanges) {
   *     console.log(change.doc.data());
   *   }
   * });
   *
   * // Remove this listener.
   * unsubscribe();
   */
  get doc() {
    return this._document;
  }

  /**
   * The index of the changed document in the result set immediately prior to
   * this DocumentChange (i.e. supposing that all prior DocumentChange objects
   * have been applied). Is -1 for 'added' events.
   *
   * @type {number}
   * @name DocumentChange#oldIndex
   * @readonly
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   * let docsArray = [];
   *
   * let unsubscribe = query.onSnapshot(querySnapshot => {
   *   for (let change of querySnapshot.docChanges) {
   *     if (change.oldIndex !== -1) {
   *       docsArray.splice(change.oldIndex, 1);
   *     }
   *     if (change.newIndex !== -1) {
   *       docsArray.splice(change.newIndex, 0, change.doc);
   *     }
   *   }
   * });
   *
   * // Remove this listener.
   * unsubscribe();
   */
  get oldIndex() {
    return this._oldIndex;
  }

  /**
   * The index of the changed document in the result set immediately after
   * this DocumentChange (i.e. supposing that all prior DocumentChange
   * objects and the current DocumentChange object have been applied).
   * Is -1 for 'removed' events.
   *
   * @type {number}
   * @name DocumentChange#newIndex
   * @readonly
   *
   * @example
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   * let docsArray = [];
   *
   * let unsubscribe = query.onSnapshot(querySnapshot => {
   *   for (let change of querySnapshot.docChanges) {
   *     if (change.oldIndex !== -1) {
   *       docsArray.splice(change.oldIndex, 1);
   *     }
   *     if (change.newIndex !== -1) {
   *       docsArray.splice(change.newIndex, 0, change.doc);
   *     }
   *   }
   * });
   *
   * // Remove this listener.
   * unsubscribe();
   */
  get newIndex() {
    return this._newIndex;
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
   * @private
   * @hideconstructor
   *
   * @param {FieldPath} field - The name of a document field (member)
   * on which to order query results.
   * @param {string=} direction One of 'ASCENDING' (default) or 'DESCENDING' to
   * set the ordering direction to ascending or descending, respectively.
   */
  constructor(field, direction) {
    this._field = field;
    this._direction = direction || directionOperators.ASC;
  }

  /**
   * The path of the field on which to order query results.
   *
   * @private
   * @type {FieldPath}
   */
  get field() {
    return this._field;
  }

  /**
   * One of 'ASCENDING' (default) or 'DESCENDING'.
   *
   * @private
   * @type {string}
   */
  get direction() {
    return this._direction;
  }

  /**
   * Generates the proto representation for this field order.
   *
   * @private
   * @returns {Object}
   */
  toProto() {
    return {
      field: {
        fieldPath: this._field.formattedName,
      },
      direction: this._direction,
    };
  }
}

/*!
 * A field constraint for a Query where clause.
 *
 * @private
 * @class
 */
class FieldFilter {
  /**
   * @private
   * @hideconstructor
   *
   * @param {FieldPath} field - The path of the property value to
   * compare.
   * @param {string} opString - A comparison operation.
   * @param {*} value The value to which to compare the
   * field for inclusion in a query.
   */
  constructor(field, opString, value) {
    this._field = field;
    this._opString = opString;
    this._value = value;
  }

  /**
   * Generates the proto representation for this field filter.
   *
   * @private
   * @returns {Object}
   */
  toProto() {
    if (typeof this._value === 'number' && isNaN(this._value)) {
      return {
        unaryFilter: {
          field: {
            fieldPath: this._field.formattedName,
          },
          op: 'IS_NAN',
        },
      };
    }

    if (this._value === null) {
      return {
        unaryFilter: {
          field: {
            fieldPath: this._field.formattedName,
          },
          op: 'IS_NULL',
        },
      };
    }

    return {
      fieldFilter: {
        field: {
          fieldPath: this._field.formattedName,
        },
        op: this._opString,
        value: DocumentSnapshot.encodeValue(this._value),
      },
    };
  }
}

/**
 * A QuerySnapshot contains zero or more
 * [DocumentSnapshot]{@link DocumentSnapshot} objects
 * representing the results of a query. The documents can be accessed as an
 * array via the [documents]{@link QuerySnapshot#documents} property
 * or enumerated using the [forEach]{@link QuerySnapshot#forEach}
 * method. The number of documents can be determined via the
 * [empty]{@link QuerySnapshot#empty} and
 * [size]{@link QuerySnapshot#size} properties.
 *
 * @class QuerySnapshot
 */
class QuerySnapshot {
  /**
   * @private
   * @hideconstructor
   *
   * @param {Query} query - The originating query.
   * @param {string} readTime - The ISO 8601 time when this query snapshot was
   * current.
   *
   * @param {function} docs - A callback returning a sorted array of documents
   * matching this query
   * @param {function} changes - A callback returning a sorted array of
   * document change events for this snapshot.
   */
  constructor(query, readTime, docs, changes) {
    this._query = query;
    this._comparator = query.comparator();
    this._readTime = readTime;
    this._docs = docs;
    this._changes = changes;
  }

  /**
   * The query on which you called `get` or `onSnapshot` in order to get this
   * `QuerySnapshot`.
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
  get query() {
    return this._query;
  }

  /**
   * An array of all the documents in this QuerySnapshot.
   *
   * @type {Array.<DocumentSnapshot>}
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
  get docs() {
    if (this._materializedDocs) {
      return this._materializedDocs;
    }
    this._materializedDocs = this._docs();
    return this._materializedDocs;
  }

  /**
   * An array of all changes in this QuerySnapshot.
   *
   * @type {Array.<DocumentChange>}
   * @name QuerySnapshot#docChanges
   * @readonly
   */
  get docChanges() {
    if (this._materializedChanges) {
      return this._materializedChanges;
    }
    this._materializedChanges = this._changes();
    return this._materializedChanges;
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
  get empty() {
    return this.docs.length === 0;
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
  get size() {
    return this.docs.length;
  }

  /**
   * The time this query snapshot was obtained.
   *
   * @type {string}
   * @name QuerySnapshot#readTime
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
   * [DocumentSnapshot]{@link DocumentSnapshot} for each document in
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
  forEach(callback, thisArg) {
    validate.isFunction('callback', callback);

    for (let doc of this.docs) {
      callback.call(thisArg, doc);
    }
  }
}

/**
 * A Query refers to a query which you can read or stream from. You can also
 * construct refined `Query` objects by adding filters and ordering.
 *
 * @class Query
 */
class Query {
  /**
   * @private
   * @hideconstructor
   *
   * @param {Firestore} firestore - The Firestore Database client.
   * @param {ResourcePath} path Path of the collection to be queried.
   * @param {Array.<FieldOrder>=} fieldOrders - Sequence of fields to
   * control the order of results.
   * @param {Array.<FieldFilter>=} fieldFilters - Sequence of fields
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
   * @private
   * @type {string}
   * @name Query#formattedName
   */
  get formattedName() {
    return this._referencePath.formattedName;
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
   * This function returns a new (immutable) instance of the
   * [Query]{@link Query} (rather than modify the existing instance)
   * to impose the filter.
   *
   * @param {string|FieldPath} fieldPath - The name of a property
   * value to compare.
   * @param {string} opStr - A comparison operation in the form of a string
   * (e.g., "<").
   * @param {*} value - The value to which to compare the field for inclusion in
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
  where(fieldPath, opStr, value) {
    validate.isFieldPath('fieldPath', fieldPath);
    validate.isFieldComparison('opStr', opStr, value);

    let newFilter = new FieldFilter(
      FieldPath.fromArgument(fieldPath),
      comparisonOperators[opStr],
      value
    );
    let combinedFilters = this._fieldFilters.concat(newFilter);
    return new Query(
      this._firestore,
      this._referencePath,
      combinedFilters,
      this._fieldOrders,
      this._queryOptions
    );
  }

  /**
   * Creates and returns a new Query instance that applies a field mask to the
   * result and returns only the specified subset of fields. You can specify a
   * list of field paths to return, or use an empty list to only return the
   * references of matching documents.
   *
   * This function returns a new (immutable) instance of the
   * [Query]{@link Query} (rather than modify the existing instance)
   * to impose the field mask.
   *
   * @param {...(string|FieldPath)} fieldPaths - The field paths to
   * return.
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
  select(fieldPaths) {
    fieldPaths = [].slice.call(arguments);

    let result = [];

    if (fieldPaths.length === 0) {
      result.push({fieldPath: FieldPath._DOCUMENT_ID.formattedName});
    } else {
      for (let i = 0; i < fieldPaths.length; ++i) {
        validate.isFieldPath(i, fieldPaths[i]);
        result.push({
          fieldPath: FieldPath.fromArgument(fieldPaths[i]).formattedName,
        });
      }
    }

    let options = extend(true, {}, this._queryOptions);
    options.selectFields = {fields: result};

    return new Query(
      this._firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  /**
   * Creates and returns a new Query that's additionally sorted by the
   * specified field, optionally in descending order instead of ascending.
   *
   * This function returns a new (immutable) instance of the
   * [Query]{@link Query} (rather than modify the existing instance)
   * to impose the field mask.
   *
   * @param {string|FieldPath} fieldPath - The field to sort by.
   * @param {string=} directionStr - Optional direction to sort by ('asc' or
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
  orderBy(fieldPath, directionStr) {
    validate.isFieldPath('fieldPath', fieldPath);
    validate.isOptionalFieldOrder('directionStr', directionStr);

    if (this._queryOptions.startAt || this._queryOptions.endAt) {
      throw new Error(
        'Cannot specify an orderBy() constraint after calling ' +
          'startAt(), startAfter(), endBefore() or endAt().'
      );
    }

    let newOrder = new FieldOrder(
      FieldPath.fromArgument(fieldPath),
      directionOperators[directionStr]
    );
    let combinedOrders = this._fieldOrders.concat(newOrder);
    return new Query(
      this._firestore,
      this._referencePath,
      this._fieldFilters,
      combinedOrders,
      this._queryOptions
    );
  }

  /**
   * Creates and returns a new Query that's additionally limited to only
   * return up to the specified number of documents.
   *
   * This function returns a new (immutable) instance of the
   * [Query]{@link Query} (rather than modify the existing instance)
   * to impose the limit.
   *
   * @param {number} limit - The maximum number of items to return.
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
  limit(limit) {
    validate.isInteger('limit', limit);

    let options = extend(true, {}, this._queryOptions);
    options.limit = limit;
    return new Query(
      this._firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  /**
   * Specifies the offset of the returned results.
   *
   * This function returns a new (immutable) instance of the
   * [Query]{@link Query} (rather than modify the existing instance)
   * to impose the offset.
   *
   * @param {number} offset - The offset to apply to the Query results
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
  offset(offset) {
    validate.isInteger('offset', offset);

    let options = extend(true, {}, this._queryOptions);
    options.offset = offset;
    return new Query(
      this._firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  /**
   * Builds a Firestore 'Position' proto message.
   *
   * @private
   *
   * @param {Array.<*>} fieldValues - The set of field values to use as the
   * boundary.
   * @param before - Whether the query boundary lies just before or after the
   * provided data.
   * @returns {Object} The proto message.
   */
  _buildPosition(fieldValues, before) {
    let options = {
      before: before,
      values: [],
    };

    if (fieldValues.length > this._fieldOrders.length) {
      throw new Error(
        'Too many cursor values specified. The specified ' +
          'values must match the orderBy() constraints of the query.'
      );
    }

    for (let i = 0; i < fieldValues.length; ++i) {
      let fieldValue = fieldValues[i];

      if (this._fieldOrders[i].field === FieldPath._DOCUMENT_ID) {
        if (is.string(fieldValue)) {
          fieldValue = this._referencePath.append(fieldValues[i]);
        } else if (is.instance(fieldValue, DocumentReference)) {
          if (!this._referencePath.isPrefixOf(fieldValue.ref)) {
            throw new Error(
              `'${fieldValue.path}' is not part of the query ` +
                'result set and cannot be used as a query boundary.'
            );
          }
        } else {
          throw new Error(
            'The corresponding value for FieldPath.documentId() must be a ' +
              'string or a DocumentReference.'
          );
        }
      }

      options.values.push(DocumentSnapshot.encodeValue(fieldValue));
    }

    return options;
  }

  /**
   * Creates and returns a new Query that starts at the provided set of field
   * values relative to the order of the query. The order of the provided values
   * must match the order of the order by clauses of the query.
   *
   * @param {...*} fieldValues - The set of field values to start the query at.
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
  startAt(fieldValues) {
    let options = extend(true, {}, this._queryOptions);

    fieldValues = [].slice.call(arguments);

    options.startAt = this._buildPosition(fieldValues, true);

    return new Query(
      this._firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  /**
   * Creates and returns a new Query that starts after the provided set of field
   * values relative to the order of the query. The order of the provided values
   * must match the order of the order by clauses of the query.
   *
   * @param {...*} fieldValues - The set of field values to start the query
   * after.
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
  startAfter(fieldValues) {
    let options = extend(true, {}, this._queryOptions);

    fieldValues = [].slice.call(arguments);

    options.startAt = this._buildPosition(fieldValues, false);

    return new Query(
      this._firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  /**
   * Creates and returns a new Query that ends before the set of field values
   * relative to the order of the query. The order of the provided values must
   * match the order of the order by clauses of the query.
   *
   * @param {...*} fieldValues - The set of field values to end the query
   * before.
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
  endBefore(fieldValues) {
    let options = extend(true, {}, this._queryOptions);

    fieldValues = [].slice.call(arguments);

    options.endAt = this._buildPosition(fieldValues, true);

    return new Query(
      this._firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  /**
   * Creates and returns a new Query that ends at the provided set of field
   * values relative to the order of the query. The order of the provided values
   * must match the order of the order by clauses of the query.
   *
   * @param {...*} fieldValues - The set of field values to end the query at.
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
  endAt(fieldValues) {
    let options = extend(true, {}, this._queryOptions);

    fieldValues = [].slice.call(arguments);

    options.endAt = this._buildPosition(fieldValues, false);

    return new Query(
      this._firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
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
  get() {
    return this._get();
  }

  /**
   * Internal get() method that accepts an optional transaction id.
   *
   * @private
   * @param {bytes=} queryOptions.transactionId - A transaction ID.
   */
  _get(queryOptions) {
    let self = this;
    let docs = [];
    let changes = [];

    return new Promise((resolve, reject) => {
      let readTime;

      self
        ._stream(queryOptions)
        .on('error', err => {
          reject(err);
        })
        .on('data', result => {
          readTime = result.readTime;
          if (result.document) {
            let document = result.document;
            changes.push(
              new DocumentChange(
                DocumentChange.ADDED,
                document,
                -1,
                docs.length
              )
            );
            docs.push(document);
          }
        })
        .on('end', () => {
          resolve(new QuerySnapshot(this, readTime, () => docs, () => changes));
        });
    });
  }

  /**
   * Executes the query and streams the results as
   * [DocumentSnapshots]{@link DocumentSnapshot}.
   *
   * @returns {Stream.<DocumentSnapshot>} A stream of DocumentSnapshots.
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
   * @param {bytes=} queryOptions.transactionId - A transaction ID.
   * @private
   * @returns Serialized JSON for the query.
   */
  toProto(queryOptions) {
    let reqOpts = {
      parent: this._referencePath.parent().formattedName,
      structuredQuery: {
        from: [
          {
            collectionId: this._referencePath.id,
          },
        ],
      },
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
          filters: filters,
        },
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
      structuredQuery.limit = {value: this._queryOptions.limit};
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
   * @param {bytes=} queryOptions.transactionId - A transaction ID.
   * @private
   * @returns {stream} A stream of Documents.
   */
  _stream(queryOptions) {
    let request = this.toProto(queryOptions);
    let self = this;

    let stream = through.obj(function(proto, enc, callback) {
      let readTime = DocumentSnapshot.toISOTime(proto.readTime);
      if (proto.document) {
        let document = self.firestore.snapshot_(proto.document, proto.readTime);
        this.push({document, readTime});
      } else {
        this.push({readTime});
      }
      callback();
    });

    this._firestore
      .readStream(
        this._api.Firestore.runQuery.bind(this._api.Firestore),
        request,
        /* allowRetries= */ true
      )
      .then(backendStream => {
        backendStream.on('error', err => {
          Firestore.log(
            'Query._stream',
            'Query failed with stream error:',
            err
          );
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
   * @param {querySnapshotCallback} onNext - A callback to be called every time
   * a new [QuerySnapshot]{@link QuerySnapshot} is available.
   * @param {errorCallback=} onError - A callback to be called if the listen
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
  onSnapshot(onNext, onError) {
    validate.isFunction('onNext', onNext);
    validate.isOptionalFunction('onError', onError);

    if (!is.defined(onError)) {
      onError = console.error; // eslint-disable-line no-console
    }

    let watch = Watch.forQuery(this);

    return watch.onSnapshot((readTime, docs, changes) => {
      onNext(new QuerySnapshot(this, readTime, docs, changes));
    }, onError);
  }

  /**
   * Returns a function that can be used to sort DocumentSnapshots according to
   * the sort criteria of this query.
   *
   * @private
   */
  comparator() {
    return (doc1, doc2) => {
      // Add implicit sorting by name, using the last specified direction.
      let lastDirection =
        this._fieldOrders.length === 0
          ? directionOperators.ASC
          : this._fieldOrders[this._fieldOrders.length - 1].direction;
      let orderBys = this._fieldOrders.concat(
        new FieldOrder(FieldPath._DOCUMENT_ID, lastDirection)
      );

      for (let orderBy of orderBys) {
        let comp;
        if (orderBy.field === FieldPath._DOCUMENT_ID) {
          comp = doc1.ref._referencePath.compareTo(doc2.ref._referencePath);
        } else {
          const v1 = doc1.protoField(orderBy.field);
          const v2 = doc2.protoField(orderBy.field);
          if (!is.defined(v1) || !is.defined(v2)) {
            throw new Error(
              'Trying to compare documents on fields that ' +
                "don't exist. Please include the fields you are ordering on " +
                'in your select() call.'
            );
          }
          comp = order.compare(v1, v2);
        }

        if (comp !== 0) {
          const direction =
            orderBy.direction === directionOperators.ASC ? 1 : -1;
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
class CollectionReference extends Query {
  /**
   * @private
   * @hideconstructor
   *
   * @param {Firestore} firestore - The Firestore Database client.
   * @param {ResourcePath} path - The Path of this collection.
   */
  constructor(firestore, path) {
    super(firestore, path);
  }

  /**
   * ID of the referenced collection.
   *
   * @type {string}
   * @name CollectionReference#id
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
   * @type {DocumentReference}
   * @name CollectionReference#parent
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
   * @type {string}
   * @name CollectionReference#path
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
   * Gets a [DocumentReference]{@link DocumentReference} instance that
   * refers to the document at the specified path. If no path is specified, an
   * automatically-generated unique ID will be used for the returned
   * DocumentReference.
   *
   * @param {string=} documentPath - A slash-separated path to a document.
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
  doc(documentPath) {
    if (arguments.length === 0) {
      documentPath = Firestore.autoId();
    } else {
      validate.isResourcePath('documentPath', documentPath);
    }

    let path = this._referencePath.append(documentPath);
    if (!path.isDocument) {
      throw new Error('Argument "documentPath" must point to a document.');
    }

    return new DocumentReference(this._firestore, path);
  }

  /**
   * Add a new document to this collection with the specified data, assigning
   * it a document ID automatically.
   *
   * @param {DocumentData} data - An Object containing the data for the new
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
  add(data) {
    validate.isDocument('data', data);

    let documentRef = this.doc();
    return documentRef.set(data).then(() => {
      return Promise.resolve(documentRef);
    });
  }
}
/*!
 * Creates a new CollectionReference. Invoked by DocumentReference to avoid
 * invalid declaration order.
 *
 * @param {Firestore} firestore - The Firestore Database client.
 * @param {ResourcePath} path - The path of this collection.
 * @returns {CollectionReference}
 */
function createCollectionReference(firestore, path) {
  return new CollectionReference(firestore, path);
}

/*!
 * Validates the input string as a field order direction.
 *
 * @param {string=} str Order direction to validate.
 * @throws {Error} when the direction is invalid
 */
function validateFieldOrder(str) {
  if (!is.string(str) || !is.defined(directionOperators[str])) {
    throw new Error('Order must be one of "asc" or "desc".');
  }

  return true;
}

/*!
 * Validates the input string as a field comparison operator.
 *
 * @param {string} str Field comparison operator to validate.
 * @param {*} val Value that is used in the filter.
 * @throws {Error} when the comparison operation is invalid
 */
function validateComparisonOperator(str, val) {
  if (is.string(str) && comparisonOperators[str]) {
    let op = comparisonOperators[str];

    if (typeof val === 'number' && isNaN(val) && op !== 'EQUAL') {
      throw new Error(
        'Invalid query. You can only perform equals ' + 'comparisons on NaN.'
      );
    }

    if (val === null && op !== 'EQUAL') {
      throw new Error(
        'Invalid query. You can only perform equals ' + 'comparisons on Null.'
      );
    }

    return true;
  }

  throw new Error('Operator must be one of "<", "<=", "==", ">", or ">=".');
}

/*!
 * Validates that 'value' is a DocumentReference.
 *
 * @param {*} value The argument to validate.
 * @returns 'true' is value is an instance of DocumentReference.
 */
function validateDocumentReference(value) {
  return is.instanceof(value, DocumentReference);
}

module.exports = FirestoreType => {
  Firestore = FirestoreType;
  let document = require('./document')(DocumentReference);
  DocumentSnapshot = document.DocumentSnapshot;
  Watch = require('./watch')(
    FirestoreType,
    DocumentChange,
    DocumentReference,
    DocumentSnapshot
  );
  WriteBatch = require('./write-batch')(
    FirestoreType,
    DocumentReference,
    validateDocumentReference
  ).WriteBatch;
  validate = require('./validate')({
    Document: document.validateDocumentData,
    FieldPath: FieldPath.validateFieldPath,
    FieldComparison: validateComparisonOperator,
    FieldOrder: validateFieldOrder,
    Precondition: document.validatePrecondition,
    ResourcePath: ResourcePath.validateResourcePath,
  });
  return {
    CollectionReference,
    DocumentReference,
    Query,
    QuerySnapshot,
    validateDocumentReference,
  };
};
