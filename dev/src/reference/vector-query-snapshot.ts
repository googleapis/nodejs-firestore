/**
 * Copyright 2024 Google LLC. All Rights Reserved.
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
import {QueryDocumentSnapshot} from '../document';
import {DocumentChange} from '../document-change';
import {Timestamp} from '../timestamp';
import {validateFunction} from '../validate';
import {isArrayEqual} from '../util';
import {VectorQuery} from './vector-query';

/**
 * A `VectorQuerySnapshot` contains zero or more `QueryDocumentSnapshot` objects
 * representing the results of a query. The documents can be accessed as an
 * array via the `docs` property or enumerated using the `forEach` method. The
 * number of documents can be determined via the `empty` and `size`
 * properties.
 */
export class VectorQuerySnapshot<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> implements firestore.VectorQuerySnapshot<AppModelType, DbModelType>
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
   * @internal
   *
   * @param _query - The originating query.
   * @param _readTime - The time when this query snapshot was obtained.
   * @param _size - The number of documents in the result set.
   * @param docs - A callback returning a sorted array of documents matching
   * this query
   * @param changes - A callback returning a sorted array of document change
   * events for this snapshot.
   */
  constructor(
    private readonly _query: VectorQuery<AppModelType, DbModelType>,
    private readonly _readTime: Timestamp,
    private readonly _size: number,
    docs: () => Array<QueryDocumentSnapshot<AppModelType, DbModelType>>,
    changes: () => Array<DocumentChange<AppModelType, DbModelType>>
  ) {
    this._docs = docs;
    this._changes = changes;
  }

  /**
   * The `VectorQuery` on which you called get() in order to get this
   * `VectorQuerySnapshot`.
   *
   * @readonly
   *
   * @example
   * ```
   * let query = firestore.collection('col').where('foo', '==', 'bar');
   *
   * query.findNearest("embedding", [0, 0], {limit: 10, distanceMeasure: "EUCLIDEAN"})
   *   .get().then(querySnapshot => {
   *     console.log(`Returned first batch of results`);
   *     let query = querySnapshot.query;
   *     return query.offset(10).get();
   *   }).then(() => {
   *   console.log(`Returned second batch of results`);
   *   });
   * ```
   */
  get query(): VectorQuery<AppModelType, DbModelType> {
    return this._query;
  }

  /**
   * An array of all the documents in this `VectorQuerySnapshot`.
   *
   * @readonly
   *
   * @example
   * ```
   * let query = firestore.collection('col')
   *   .findNearest("embedding", [0, 0], {limit: 10, distanceMeasure: "EUCLIDEAN"});
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
   * `true` if there are no documents in the `VectorQuerySnapshot`.
   *
   * @readonly
   *
   * @example
   * ```
   * let query = firestore.collection('col')
   *   .findNearest("embedding", [0, 0], {limit: 10, distanceMeasure: "EUCLIDEAN"});
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
   * The number of documents in the `VectorQuerySnapshot`.
   *
   * @readonly
   *
   * @example
   * ```
   * let query = firestore.collection('col')
   *   .findNearest("embedding", [0, 0], {limit: 10, distanceMeasure: "EUCLIDEAN"});
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
   * The time this `VectorQuerySnapshot` was obtained.
   *
   * @example
   * ```
   * let query = firestore.collection('col')
   *   .findNearest("embedding", [0, 0], {limit: 10, distanceMeasure: "EUCLIDEAN"});
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
   * @returns An array of the documents changes since the last snapshot.
   *
   * @example
   * ```
   * let query = firestore.collection('col')
   *   .findNearest("embedding", [0, 0], {limit: 10, distanceMeasure: "EUCLIDEAN"});
   *
   * query.get().then(querySnapshot => {
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
   * Enumerates all of the documents in the `VectorQuerySnapshot`. This is a convenience
   * method for running the same callback on each {@link QueryDocumentSnapshot}
   * that is returned.
   *
   * @param callback - A callback to be called with a
   * {@link QueryDocumentSnapshot} for each document in
   * the snapshot.
   * @param thisArg - The `this` binding for the callback..
   *
   * @example
   * ```
   * let query = firestore.collection('col')
   *   .findNearest("embedding", [0, 0], {limit: 10, distanceMeasure: "EUCLIDEAN"});
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
   * Returns true if the document data in this `VectorQuerySnapshot` is equal to the
   * provided value.
   *
   * @param other - The value to compare against.
   * @returns true if this `VectorQuerySnapshot` is equal to the provided
   * value.
   */
  isEqual(
    other: firestore.VectorQuerySnapshot<AppModelType, DbModelType>
  ): boolean {
    // Since the read time is different on every query read, we explicitly
    // ignore all metadata in this comparison.

    if (this === other) {
      return true;
    }

    if (!(other instanceof VectorQuerySnapshot)) {
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
