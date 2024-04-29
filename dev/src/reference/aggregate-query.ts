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

import * as protos from '../../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;

import * as assert from 'assert';
import * as deepEqual from 'fast-deep-equal';

import * as firestore from '@google-cloud/firestore';
import {Aggregate, AggregateSpec} from '../aggregate';
import {Timestamp} from '../timestamp';
import {mapToArray, requestTag, wrapError} from '../util';
import {ExplainMetrics, ExplainResults} from '../query-profile';
import {logger} from '../logger';
import {AggregateQuerySnapshot} from './aggregate-query-snapshot';
import {Query} from './query';
import {Readable, Transform} from 'stream';

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
   * @internal
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
    transactionIdOrReadTime?: Uint8Array | Timestamp
  ): Promise<
    AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
  > {
    // Capture the error stack to preserve stack tracing across async calls.
    const stack = Error().stack!;

    let result: AggregateQuerySnapshot<
      AggregateSpecType,
      AppModelType,
      DbModelType
    > | null = null;

    return new Promise((resolve, reject) => {
      const stream = this._stream(transactionIdOrReadTime);
      stream.on('error', err => {
        reject(wrapError(err, stack));
      });
      stream.on('data', data => {
        if (data.aggregationResult) {
          result = data.aggregationResult;
        }
      });
      stream.on('end', () => {
        stream.destroy();
        if (result === null) {
          reject(Error('RunAggregationQueryResponse is missing result'));
        }
        resolve(result!);
      });
    });
  }

  /**
   * Internal streaming method that accepts an optional transaction ID.
   *
   * @private
   * @internal
   * @param transactionIdOrReadTime A transaction ID or the read time at which
   * to execute the query.
   * @param explainOptions Options to use for explaining the query (if any).
   * @returns A stream of document results.
   */
  _stream(
    transactionIdOrReadTime?: Uint8Array | Timestamp,
    explainOptions?: firestore.ExplainOptions
  ): Readable {
    const tag = requestTag();
    const firestore = this._query.firestore;

    const stream: Transform = new Transform({
      objectMode: true,
      transform: (proto: api.IRunAggregationQueryResponse, enc, callback) => {
        const output: {
          aggregationResult?: AggregateQuerySnapshot<
            AggregateSpecType,
            AppModelType,
            DbModelType
          >;
          explainMetrics?: ExplainMetrics;
        } = {};

        if (proto.result) {
          const readTime = Timestamp.fromProto(proto.readTime!);
          const data = this.decodeResult(proto.result);
          output.aggregationResult = new AggregateQuerySnapshot(
            this,
            readTime,
            data
          );
        }

        if (proto.explainMetrics) {
          output.explainMetrics = ExplainMetrics._fromProto(
            proto.explainMetrics,
            firestore._serializer!
          );
        }

        callback(undefined, output);
      },
    });

    firestore
      .initializeIfNeeded(tag)
      .then(async () => {
        // `toProto()` might throw an exception. We rely on the behavior of an
        // async function to convert this exception into the rejected Promise we
        // catch below.
        const request = this.toProto(transactionIdOrReadTime, explainOptions);

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
          // Also note that explain queries should not be retried.

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
  toProto(
    transactionIdOrReadTime?: Uint8Array | Timestamp,
    explainOptions?: firestore.ExplainOptions
  ): api.IRunAggregationQueryRequest {
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

    if (transactionIdOrReadTime instanceof Uint8Array) {
      runQueryRequest.transaction = transactionIdOrReadTime;
    } else if (transactionIdOrReadTime instanceof Timestamp) {
      runQueryRequest.readTime = transactionIdOrReadTime;
    }

    if (explainOptions) {
      runQueryRequest.explainOptions = explainOptions;
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

  /**
   * Plans and optionally executes this query. Returns a Promise that will be
   * resolved with the planner information, statistics from the query
   * execution (if any), and the query results (if any).
   *
   * @return A Promise that will be resolved with the planner information,
   * statistics from the query execution (if any), and the query results (if any).
   */
  explain(
    options?: firestore.ExplainOptions
  ): Promise<
    ExplainResults<
      AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
    >
  > {
    if (options === undefined) {
      options = {};
    }
    // Capture the error stack to preserve stack tracing across async calls.
    const stack = Error().stack!;

    let metrics: ExplainMetrics | null = null;
    let aggregationResult: AggregateQuerySnapshot<
      AggregateSpecType,
      AppModelType,
      DbModelType
    > | null = null;

    return new Promise((resolve, reject) => {
      const stream = this._stream(undefined, options);
      stream.on('error', err => {
        reject(wrapError(err, stack));
      });
      stream.on('data', data => {
        if (data.aggregationResult) {
          aggregationResult = data.aggregationResult;
        }

        if (data.explainMetrics) {
          metrics = data.explainMetrics;
        }
      });
      stream.on('end', () => {
        stream.destroy();
        if (metrics === null) {
          reject('No explain results.');
        }
        resolve(
          new ExplainResults<
            AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
          >(metrics!, aggregationResult)
        );
      });
    });
  }
}
