/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {FieldPath} from './path';
import {google} from '../protos/firestore_v1_proto_api';

import * as firestore from '@google-cloud/firestore';
import IAggregation = google.firestore.v1.StructuredAggregationQuery.IAggregation;
import * as assert from 'assert';

/**
 * Concrete implementation of the Aggregate type.
 */
export class Aggregate {
  constructor(
    readonly alias: string,
    readonly aggregateType: firestore.AggregateType,
    readonly fieldPath?: string | firestore.FieldPath
  ) {}

  /**
   * Converts this object to the proto representation of an Aggregate.
   * @internal
   */
  toProto(): IAggregation {
    const proto: IAggregation = {};
    if (this.aggregateType === 'count') {
      proto.count = {};
    } else if (this.aggregateType === 'sum') {
      assert(
        this.fieldPath !== undefined,
        'Missing field path for sum aggregation.'
      );
      proto.sum = {
        field: {
          fieldPath: FieldPath.fromArgument(this.fieldPath!).formattedName,
        },
      };
    } else if (this.aggregateType === 'avg') {
      assert(
        this.fieldPath !== undefined,
        'Missing field path for average aggregation.'
      );
      proto.avg = {
        field: {
          fieldPath: FieldPath.fromArgument(this.fieldPath!).formattedName,
        },
      };
    } else {
      throw new Error(`Aggregate type ${this.aggregateType} unimplemented.`);
    }
    proto.alias = this.alias;
    return proto;
  }
}

/**
 * Represents an aggregation that can be performed by Firestore.
 */
export class AggregateField<T> implements firestore.AggregateField<T> {
  /** A type string to uniquely identify instances of this class. */
  readonly type = 'AggregateField';

  /**
   * Create a new AggregateField<T>
   * @param aggregateType Specifies the type of aggregation operation to perform.
   * @param field Optionally specifies the field that is aggregated.
   * @internal
   */
  private constructor(
    public readonly aggregateType: firestore.AggregateType,
    public readonly field?: string | firestore.FieldPath
  ) {}

  /**
   * Compares this object with the given object for equality.
   *
   * This object is considered "equal" to the other object if and only if
   * `other` performs the same kind of aggregation on the same field (if any).
   *
   * @param other The object to compare to this object for equality.
   * @return `true` if this object is "equal" to the given object, as
   * defined above, or `false` otherwise.
   */
  isEqual(other: firestore.AggregateField<T>): boolean {
    return (
      other instanceof AggregateField &&
      this.aggregateType === other.aggregateType &&
      ((this.field === undefined && other.field === undefined) ||
        (this.field !== undefined &&
          other.field !== undefined &&
          FieldPath.fromArgument(this.field).isEqual(
            FieldPath.fromArgument(other.field)
          )))
    );
  }

  /**
   * Create an AggregateField object that can be used to compute the count of
   * documents in the result set of a query.
   */
  static count(): AggregateField<number> {
    return new AggregateField<number>('count');
  }

  /**
   * Create an AggregateField object that can be used to compute the average of
   * a specified field over a range of documents in the result set of a query.
   * @param field Specifies the field to average across the result set.
   */
  static average(
    field: string | firestore.FieldPath
  ): AggregateField<number | null> {
    return new AggregateField<number | null>('avg', field);
  }

  /**
   * Create an AggregateField object that can be used to compute the sum of
   * a specified field over a range of documents in the result set of a query.
   * @param field Specifies the field to sum across the result set.
   */
  static sum(field: string | firestore.FieldPath): AggregateField<number> {
    return new AggregateField<number>('sum', field);
  }
}
