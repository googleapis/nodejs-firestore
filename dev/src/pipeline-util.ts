// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as firestore from '@google-cloud/firestore';
import {GoogleError} from 'google-gax';
import {Duplex, Transform} from 'stream';
import {google} from '../protos/firestore_v1_proto_api';

import * as protos from '../protos/firestore_v1_proto_api';
import {
  Expr,
  BooleanExpr,
  and,
  or,
  Field,
  not,
  ExprWithAlias,
  field as createField,
  constant,
} from './expression';
import Firestore, {DocumentReference, Timestamp} from './index';
import {logger} from './logger';
import {QualifiedResourcePath} from './path';
import {Pipeline, PipelineResult} from './pipeline';
import {CompositeFilterInternal} from './reference/composite-filter-internal';
import {NOOP_MESSAGE} from './reference/constants';
import {FieldFilterInternal} from './reference/field-filter-internal';
import {FilterInternal} from './reference/filter-internal';
import {PipelineResponse, PipelineStreamElement} from './reference/types';
import {Serializer} from './serializer';
import {
  Deferred,
  getTotalTimeout,
  isObject,
  isPermanentRpcError,
  requestTag,
  wrapError,
} from './util';
import api = protos.google.firestore.v1;

/**
 * Returns a builder for DocumentSnapshot and QueryDocumentSnapshot instances.
 * Invoke `.build()' to assemble the final snapshot.
 *
 * @private
 * @internal
 */
export class ExecutionUtil {
  constructor(
    /** @private */
    readonly _firestore: Firestore,
    /** @private */
    readonly _serializer: Serializer
  ) {}

  _getResponse(
    pipeline: Pipeline,
    transactionOrReadTime?: Uint8Array | Timestamp | api.ITransactionOptions,
    explainOptions?: firestore.ExplainOptions
  ): Promise<PipelineResponse> {
    // Capture the error stack to preserve stack tracing across async calls.
    const stack = Error().stack!;

    return new Promise((resolve, reject) => {
      const result: Array<PipelineResult> = [];
      const output: PipelineResponse = {};

      this._stream(pipeline, transactionOrReadTime, explainOptions)
        .on('error', err => {
          reject(wrapError(err, stack));
        })
        .on('data', (data: PipelineStreamElement[]) => {
          for (const element of data) {
            if (element.transaction) {
              output.transaction = element.transaction;
            }
            if (element.executionTime) {
              output.executionTime = element.executionTime;
            }
            if (element.explainMetrics) {
              output.explainMetrics = element.explainMetrics;
            }
            if (element.result) {
              result.push(element.result);
            }
          }
        })
        .on('end', () => {
          output.result = result;
          resolve(output);
        });
    });
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

  stream(pipeline: Pipeline): NodeJS.ReadableStream {
    const responseStream = this._stream(pipeline);
    const transform = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        callback(undefined, chunk.result);
      },
    });

    responseStream.pipe(transform);
    responseStream.on('error', e => transform.destroy(e));
    return transform;
  }

  _stream(
    pipeline: Pipeline,
    transactionOrReadTime?: Uint8Array | Timestamp | api.ITransactionOptions,
    explainOptions?: firestore.ExplainOptions
  ): NodeJS.ReadableStream {
    const tag = requestTag();

    let backendStream: Duplex;
    const stream = new Transform({
      objectMode: true,
      transform: (
        proto: api.ExecutePipelineResponse | typeof NOOP_MESSAGE,
        enc,
        callback
      ) => {
        if (proto === NOOP_MESSAGE) {
          callback(undefined);
          return;
        }

        if (proto.results && proto.results.length === 0) {
          const output: PipelineStreamElement = {};
          if (proto.transaction?.length) {
            output.transaction = proto.transaction;
          }
          if (proto.executionTime) {
            output.executionTime = Timestamp.fromProto(proto.executionTime);
          }
          callback(undefined, [output]);
        } else {
          callback(
            undefined,
            proto.results.map(result => {
              const output: PipelineStreamElement = {};
              if (proto.transaction?.length) {
                output.transaction = proto.transaction;
              }
              if (proto.executionTime) {
                output.executionTime = Timestamp.fromProto(proto.executionTime);
              }

              const ref = result.name
                ? new DocumentReference(
                    this._firestore,
                    QualifiedResourcePath.fromSlashSeparatedString(result.name)
                  )
                : undefined;
              output.result = new PipelineResult(
                this._serializer,
                ref,
                result.fields || undefined,
                Timestamp.fromProto(proto.executionTime!),
                result.createTime
                  ? Timestamp.fromProto(result.createTime!)
                  : undefined,
                result.updateTime
                  ? Timestamp.fromProto(result.updateTime!)
                  : undefined
              );
              return output;
            })
          );
        }
      },
    });

    this._firestore
      .initializeIfNeeded(tag)
      .then(async () => {
        // `toProto()` might throw an exception. We rely on the behavior of an
        // async function to convert this exception into the rejected Promise we
        // catch below.
        const request: api.IExecutePipelineRequest = {
          database: this._firestore.formattedName,
          structuredPipeline: {
            pipeline: pipeline._toProto(),
          },
        };

        if (transactionOrReadTime instanceof Uint8Array) {
          request.transaction = transactionOrReadTime;
        } else if (transactionOrReadTime instanceof Timestamp) {
          request.readTime = transactionOrReadTime.toProto().timestampValue;
        } else if (transactionOrReadTime) {
          request.newTransaction = transactionOrReadTime;
        }

        let streamActive: Deferred<boolean>;
        do {
          streamActive = new Deferred<boolean>();
          const methodName = 'executePipeline';
          backendStream = await this._firestore.requestStream(
            methodName,
            /* bidirectional= */ false,
            request,
            tag
          );
          backendStream.on('error', err => {
            backendStream.unpipe(stream);

            logger(
              'PipelineUtil._stream',
              tag,
              'Pipeline failed with stream error:',
              err
            );
            stream.destroy(err);
            streamActive.resolve(/* active= */ false);
          });
          backendStream.on('end', () => {
            streamActive.resolve(/* active= */ false);
          });
          backendStream.resume();
          backendStream.pipe(stream);
        } while (await streamActive.promise);
      })
      .catch(e => {
        logger(
          'PipelineUtil._stream',
          tag,
          'Pipeline failed with stream error:',
          e
        );
        stream.destroy(e);
      });

    return stream;
  }
}

function isITimestamp(obj: any): obj is google.protobuf.ITimestamp {
  if (typeof obj !== 'object' || obj === null) {
    return false; // Must be a non-null object
  }
  if (
    'seconds' in obj &&
    (obj.seconds === null ||
      typeof obj.seconds === 'number' ||
      typeof obj.seconds === 'string') &&
    'nanos' in obj &&
    (obj.nanos === null || typeof obj.nanos === 'number')
  ) {
    return true;
  }

  return false;
}
function isILatLng(obj: any): obj is google.type.ILatLng {
  if (typeof obj !== 'object' || obj === null) {
    return false; // Must be a non-null object
  }
  if (
    'latitude' in obj &&
    (obj.latitude === null || typeof obj.latitude === 'number') &&
    'longitude' in obj &&
    (obj.longitude === null || typeof obj.longitude === 'number')
  ) {
    return true;
  }

  return false;
}
function isIArrayValue(obj: any): obj is api.IArrayValue {
  if (typeof obj !== 'object' || obj === null) {
    return false; // Must be a non-null object
  }
  if ('values' in obj && (obj.values === null || Array.isArray(obj.values))) {
    return true;
  }

  return false;
}
function isIMapValue(obj: any): obj is api.IMapValue {
  if (typeof obj !== 'object' || obj === null) {
    return false; // Must be a non-null object
  }
  if ('fields' in obj && (obj.fields === null || isObject(obj.fields))) {
    return true;
  }

  return false;
}
function isIFunction(obj: any): obj is api.IFunction {
  if (typeof obj !== 'object' || obj === null) {
    return false; // Must be a non-null object
  }
  if (
    'name' in obj &&
    (obj.name === null || typeof obj.name === 'string') &&
    'args' in obj &&
    (obj.args === null || Array.isArray(obj.args))
  ) {
    return true;
  }

  return false;
}

function isIPipeline(obj: any): obj is api.IPipeline {
  if (typeof obj !== 'object' || obj === null) {
    return false; // Must be a non-null object
  }
  if ('stages' in obj && (obj.stages === null || Array.isArray(obj.stages))) {
    return true;
  }

  return false;
}

export function isFirestoreValue(obj: any): obj is api.IValue {
  if (typeof obj !== 'object' || obj === null) {
    return false; // Must be a non-null object
  }

  // Check optional properties and their types
  if (
    ('nullValue' in obj &&
      (obj.nullValue === null || obj.nullValue === 'NULL_VALUE')) ||
    ('booleanValue' in obj &&
      (obj.booleanValue === null || typeof obj.booleanValue === 'boolean')) ||
    ('integerValue' in obj &&
      (obj.integerValue === null ||
        typeof obj.integerValue === 'number' ||
        typeof obj.integerValue === 'string')) ||
    ('doubleValue' in obj &&
      (obj.doubleValue === null || typeof obj.doubleValue === 'number')) ||
    ('timestampValue' in obj &&
      (obj.timestampValue === null || isITimestamp(obj.timestampValue))) ||
    ('stringValue' in obj &&
      (obj.stringValue === null || typeof obj.stringValue === 'string')) ||
    ('bytesValue' in obj &&
      (obj.bytesValue === null || obj.bytesValue instanceof Uint8Array)) ||
    ('referenceValue' in obj &&
      (obj.referenceValue === null ||
        typeof obj.referenceValue === 'string')) ||
    ('geoPointValue' in obj &&
      (obj.geoPointValue === null || isILatLng(obj.geoPointValue))) ||
    ('arrayValue' in obj &&
      (obj.arrayValue === null || isIArrayValue(obj.arrayValue))) ||
    ('mapValue' in obj &&
      (obj.mapValue === null || isIMapValue(obj.mapValue))) ||
    ('fieldReferenceValue' in obj &&
      (obj.fieldReferenceValue === null ||
        typeof obj.fieldReferenceValue === 'string')) ||
    ('functionValue' in obj &&
      (obj.functionValue === null || isIFunction(obj.functionValue))) ||
    ('pipelineValue' in obj &&
      (obj.pipelineValue === null || isIPipeline(obj.pipelineValue)))
  ) {
    return true;
  }

  return false;
}

export function selectableToExpr(
  selectable: firestore.Selectable | string
): Expr {
  if (typeof selectable === 'string') {
    return createField(selectable);
  } else if (selectable instanceof Field) {
    return selectable;
  } else if (selectable instanceof ExprWithAlias) {
    return selectable.expr;
  } else {
    throw new Error('unexpected selectable: ' + selectable);
  }
}

export function toPipelineBooleanExpr(
  f: FilterInternal,
  serializer: Serializer
): BooleanExpr {
  if (f instanceof FieldFilterInternal) {
    const field = createField(f.field);
    if (f.isNanChecking()) {
      if (f.nanOp() === 'IS_NAN') {
        return and(field.exists(), field.isNan());
      } else {
        return and(field.exists(), not(field.isNan()));
      }
    } else if (f.isNullChecking()) {
      if (f.nullOp() === 'IS_NULL') {
        return and(field.exists(), field.eq(null));
      } else {
        return and(field.exists(), not(field.eq(null)));
      }
    } else {
      // Comparison filters
      const value = isFirestoreValue(f.value)
        ? f.value
        : serializer.encodeValue(f.value);
      switch (f.op) {
        case 'LESS_THAN':
          return and(field.exists(), field.lt(value));
        case 'LESS_THAN_OR_EQUAL':
          return and(field.exists(), field.lte(value));
        case 'GREATER_THAN':
          return and(field.exists(), field.gt(value));
        case 'GREATER_THAN_OR_EQUAL':
          return and(field.exists(), field.gte(value));
        case 'EQUAL':
          return and(field.exists(), field.eq(value));
        case 'NOT_EQUAL':
          return and(field.exists(), field.neq(value));
        case 'ARRAY_CONTAINS':
          return and(field.exists(), field.arrayContains(value));
        case 'IN': {
          const values = value?.arrayValue?.values?.map(val => constant(val));
          return and(field.exists(), field.eqAny(values!));
        }
        case 'ARRAY_CONTAINS_ANY': {
          const values = value?.arrayValue?.values?.map(val => constant(val));
          return and(field.exists(), field.arrayContainsAny(values!));
        }
        case 'NOT_IN': {
          const values = value?.arrayValue?.values?.map(val => constant(val));
          return and(field.exists(), field.notEqAny(values!));
        }
      }
    }
  } else if (f instanceof CompositeFilterInternal) {
    switch (f._getOperator()) {
      case 'AND': {
        const conditions = f
          .getFilters()
          .map(f => toPipelineBooleanExpr(f, serializer));
        return and(conditions[0], conditions[1], ...conditions.slice(2));
      }
      case 'OR': {
        const conditions = f
          .getFilters()
          .map(f => toPipelineBooleanExpr(f, serializer));
        return or(conditions[0], conditions[1], ...conditions.slice(2));
      }
    }
  }

  throw new Error(
    `Failed to convert filter to pipeline conditions: ${f.toProto()}`
  );
}
