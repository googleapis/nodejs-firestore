/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as firestore from '@google-cloud/firestore';
import * as protos from '../protos/firestore_v1_proto_api';

import {QueryPartition} from './query-partition';
import {requestTag} from './util';
import {logger} from './logger';
import {Query, QueryOptions} from './reference';
import {FieldPath} from './path';
import {Firestore} from './index';
import {validateInteger} from './validate';

import api = protos.google.firestore.v1;
import {defaultConverter} from './types';
import {compareArrays} from './order';

/**
 * A `CollectionGroup` refers to all documents that are contained in a
 * collection or subcollection with a specific collection ID.
 *
 * @class CollectionGroup
 */
export class CollectionGroup<T = firestore.DocumentData>
  extends Query<T>
  implements firestore.CollectionGroup<T>
{
  /** @private */
  constructor(
    firestore: Firestore,
    collectionId: string,
    converter: firestore.FirestoreDataConverter<T> | undefined
  ) {
    super(
      firestore,
      QueryOptions.forCollectionGroupQuery(collectionId, converter)
    );
  }

  /**
   * Partitions a query by returning partition cursors that can be used to run
   * the query in parallel. The returned cursors are split points that can be
   * used as starting and end points for individual query invocations.
   *
   * @example
   * ```
   * const query = firestore.collectionGroup('collectionId');
   * for await (const partition of query.getPartitions(42)) {
   *   const partitionedQuery = partition.toQuery();
   *   const querySnapshot = await partitionedQuery.get();
   *   console.log(`Partition contained ${querySnapshot.length} documents`);
   * }
   *
   * ```
   * @param {number} desiredPartitionCount The desired maximum number of
   * partition points. The number must be strictly positive. The actual number
   * of partitions returned may be fewer.
   * @return {AsyncIterable<QueryPartition>} An AsyncIterable of
   * `QueryPartition`s.
   */
  async *getPartitions(
    desiredPartitionCount: number
  ): AsyncIterable<QueryPartition<T>> {
    validateInteger('desiredPartitionCount', desiredPartitionCount, {
      minValue: 1,
    });

    const tag = requestTag();
    await this.firestore.initializeIfNeeded(tag);

    const partitions: Array<api.IValue>[] = [];

    if (desiredPartitionCount > 1) {
      // Partition queries require explicit ordering by __name__.
      const queryWithDefaultOrder = this.orderBy(FieldPath.documentId());
      const request: api.IPartitionQueryRequest =
        queryWithDefaultOrder.toProto();

      // Since we are always returning an extra partition (with an empty endBefore
      // cursor), we reduce the desired partition count by one.
      request.partitionCount = desiredPartitionCount - 1;

      const stream = await this.firestore.requestStream(
        'partitionQueryStream',
        /* bidirectional= */ false,
        request,
        tag
      );
      stream.resume();

      for await (const currentCursor of stream) {
        partitions.push(currentCursor.values ?? []);
      }
    }

    logger(
      'Firestore.getPartitions',
      tag,
      'Received %d partitions',
      partitions.length
    );

    // Sort the partitions as they may not be ordered if responses are paged.
    partitions.sort((l, r) => compareArrays(l, r));

    for (let i = 0; i < partitions.length; ++i) {
      yield new QueryPartition(
        this._firestore,
        this._queryOptions.collectionId,
        this._queryOptions.converter,
        i > 0 ? partitions[i - 1] : undefined,
        partitions[i]
      );
    }

    // Return the extra partition with the empty cursor.
    yield new QueryPartition(
      this._firestore,
      this._queryOptions.collectionId,
      this._queryOptions.converter,
      partitions.pop(),
      undefined
    );
  }

  /**
   * Applies a custom data converter to this `CollectionGroup`, allowing you
   * to use your own custom model objects with Firestore. When you call get()
   * on the returned `CollectionGroup`, the provided converter will convert
   * between Firestore data and your custom type U.
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
   * const querySnapshot = await Firestore()
   *   .collectionGroup('posts')
   *   .withConverter(postConverter)
   *   .get();
   * for (const doc of querySnapshot.docs) {
   *   const post = doc.data();
   *   post.title; // string
   *   post.toString(); // Should be defined
   *   post.someNonExistentProperty; // TS error
   * }
   *
   * ```
   * @param {FirestoreDataConverter | null} converter Converts objects to and
   * from Firestore. Passing in `null` removes the current converter.
   * @return {CollectionGroup} A `CollectionGroup<U>` that uses the provided
   * converter.
   */
  withConverter(converter: null): CollectionGroup<firestore.DocumentData>;
  withConverter<U>(
    converter: firestore.FirestoreDataConverter<U>
  ): CollectionGroup<U>;
  withConverter<U>(
    converter: firestore.FirestoreDataConverter<U> | null
  ): CollectionGroup<U> {
    return new CollectionGroup<U>(
      this.firestore,
      this._queryOptions.collectionId,
      converter ?? defaultConverter()
    );
  }
}
