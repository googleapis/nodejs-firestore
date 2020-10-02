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

import api = protos.google.firestore.v1;

/**
 * A `CollectionGroup` refers to all documents that are contained in a
 * collection or subcollection with a specific collection ID.
 */
export class CollectionGroup<T = firestore.DocumentData>
  extends Query<T>
  implements firestore.CollectionGroup<T> {
  /** @hideconstructor */
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
   * @param {number} desiredPartitionCount The desired maximum number of
   * partition points. The number must be strictly positive. The actual number
   * of partitions returned may be fewer.
   * @return {AsyncIterable<QueryPartition>} An AsyncIterable of
   * `QueryPartition`s.
   */
  async *getPartitionsAsync(
    desiredPartitionCount: number
  ): AsyncIterable<QueryPartition<T>> {
    const tag = requestTag();
    await this.firestore.initializeIfNeeded(tag);

    // Partition queries require explicit ordering by __name__.
    const queryWithDefaultOrder = this.orderBy(FieldPath.documentId());
    const request: api.IPartitionQueryRequest = queryWithDefaultOrder.toProto();

    // Since we are always returning an extra partition (with en empty endBefore
    // cursor), we reduce the desired partition count by one.
    request.partitionCount = desiredPartitionCount - 1;

    const stream = await this.firestore.requestStream(
      'partitionQueryStream',
      request,
      tag
    );
    stream.resume();

    let lastValues: api.IValue[] | undefined = undefined;
    let partitionCount = 0;

    for await (const currentCursor of stream) {
      ++partitionCount;
      const currentValues = currentCursor.values ?? [];
      yield new QueryPartition(
        this._firestore,
        this._queryOptions.collectionId,
        this._queryOptions.converter,
        lastValues,
        currentValues
      );
      lastValues = currentValues;
    }

    logger(
      'Firestore.getPartitionsAsync',
      tag,
      'Received %d partitions',
      partitionCount
    );

    // Return the extra partition with the empty cursor.
    yield new QueryPartition(
      this._firestore,
      this._queryOptions.collectionId,
      this._queryOptions.converter,
      lastValues,
      undefined
    );
  }

  /**
   * Partitions a query by returning partition cursors that can be used to run
   * the query in parallel. The returned cursors are split points that can be
   * used as starting and end points for individual query invocations.
   *
   * @param {number} desiredPartitionCount The desired maximum number of
   * partition points. The number must be strictly positive. The actual number
   * of partitions returned may be fewer.
   * @return {Promise<QueryPartition[]>} A Promise with the `QueryPartition`s
   * returned as an array.
   */
  async getPartitions(
    desiredPartitionCount: number
  ): Promise<QueryPartition<T>[]> {
    const result: QueryPartition<T>[] = [];
    for await (const partition of this.getPartitionsAsync(
      desiredPartitionCount
    )) {
      result.push(partition);
    }
    return result;
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
   * @example
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
   *   .collectionGroup('posts')
   *   .withConverter(postConverter)
   *   .doc().get();
   * const post = postSnap.data();
   * if (post !== undefined) {
   *   post.title; // string
   *   post.toString(); // Should be defined
   *   post.someNonExistentProperty; // TS error
   * }
   *
   * @param {FirestoreDataConverter} converter Converts objects to and from
   * Firestore.
   * @return {CollectionGroup} A `CollectionGroup<U>` that uses the provided
   * converter.
   */
  withConverter<U>(
    converter: firestore.FirestoreDataConverter<U>
  ): CollectionGroup<U> {
    return new CollectionGroup<U>(
      this.firestore,
      this._queryOptions.collectionId,
      converter
    );
  }
}
