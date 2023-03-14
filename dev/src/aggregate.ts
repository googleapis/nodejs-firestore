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

import {AggregateAlias} from './aggregate_alias';
import {FieldPath} from './path';
import {google} from '../protos/firestore_v1_proto_api';

import * as firestore from '@google-cloud/firestore';
import IAggregation = google.firestore.v1.StructuredAggregationQuery.IAggregation;

/**
 * Concrete implementation of the Aggregate type.
 */
export class AggregateImpl implements firestore.Aggregate {
  constructor(
    readonly alias: AggregateAlias,
    readonly aggregateType: firestore.AggregateType,
    readonly fieldPath?: string
  ) {}

  toProto(): IAggregation {
    const proto: IAggregation = {};
    if (this.aggregateType === 'count') {
      proto.count = {};
    } else if (this.aggregateType === 'sum') {
      proto.sum = {
        field: {
          fieldPath: this.fieldPath,
        },
      };
    } else if (this.aggregateType === 'avg') {
      proto.avg = {
        field: {
          fieldPath: this.fieldPath,
        },
      };
    } else {
      throw new Error(`Aggregate type ${this.aggregateType} unimplemented.`);
    }
    proto.alias = this.alias.canonicalString();
    return proto;
  }
}

/**
 * Represents an aggregation that can be performed by Firestore.
 */
export class AggregateField<T> implements firestore.AggregateField<T> {
  /** A type string to uniquely identify instances of this class. */
  readonly type = 'AggregateField';

  readonly _aggregateType: firestore.AggregateType;
  readonly _internalFieldPath: FieldPath | undefined;

  /**
   * Create a new AggregateField<T>
   * @param aggregateType Specifies the type of aggregation operation to perform.
   * @param fieldPath Optionally specifies the field that is aggregated.
   * @internal
   */
  constructor(
    aggregateType: firestore.AggregateType = 'count',
    fieldPath?: firestore.FieldPath
  ) {
    this._aggregateType = aggregateType;
    if (fieldPath) {
      this._internalFieldPath = FieldPath.fromArgument(fieldPath);
    }
  }

  getType(): firestore.AggregateType {
    return this._aggregateType;
  }
  getPath(): string | undefined {
    return this._internalFieldPath?.formattedName;
  }

  isEqual(other: firestore.AggregateField<T>): boolean {
    return (
      other instanceof AggregateField &&
      this._aggregateType === other._aggregateType &&
      ((this._internalFieldPath === undefined &&
        other._internalFieldPath === undefined) ||
        (this._internalFieldPath !== undefined &&
          other._internalFieldPath !== undefined &&
          this._internalFieldPath.isEqual(other._internalFieldPath)))
    );
  }

  public static count(): AggregateField<number> {
    return new AggregateField<number>('count');
  }
  public static avg(
    fieldPath: string | firestore.FieldPath
  ): AggregateField<number | null> {
    return new AggregateField<number | null>(
      'avg',
      FieldPath.fromArgument(fieldPath)
    );
  }
  public static sum(
    fieldPath: string | firestore.FieldPath
  ): AggregateField<number> {
    return new AggregateField<number>('sum', FieldPath.fromArgument(fieldPath));
  }
}
