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

import {google} from '../protos/firestore_proto_api';
import api = google.firestore.v1beta1;

import {detectValueType} from './convert';
import {ResourcePath} from './path';
import {customObjectError} from './validate';
import {ApiMapValue} from './types';

/*!
 * The type order as defined by the backend.
 */
enum TypeOrder {
  NULL = 0,
  BOOLEAN = 1,
  NUMBER = 2,
  TIMESTAMP = 3,
  STRING = 4,
  BLOB = 5,
  REF = 6,
  GEO_POINT = 7,
  ARRAY = 8,
  OBJECT = 9
}

/*!
 * @private
 */
function typeOrder(val: api.IValue): TypeOrder {
  const valueType = detectValueType(val);

  switch (valueType) {
    case 'nullValue':
      return TypeOrder.NULL;
    case 'integerValue':
      return TypeOrder.NUMBER;
    case 'doubleValue':
      return TypeOrder.NUMBER;
    case 'stringValue':
      return TypeOrder.STRING;
    case 'booleanValue':
      return TypeOrder.BOOLEAN;
    case 'arrayValue':
      return TypeOrder.ARRAY;
    case 'timestampValue':
      return TypeOrder.TIMESTAMP;
    case 'geoPointValue':
      return TypeOrder.GEO_POINT;
    case 'bytesValue':
      return TypeOrder.BLOB;
    case 'referenceValue':
      return TypeOrder.REF;
    case 'mapValue':
      return TypeOrder.OBJECT;
    default:
      throw new Error('Unexpected value type: ' + valueType);
  }
}

/*!
 * @private
 */
export function primitiveComparator(
    left: string|boolean|number, right: string|boolean|number): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

/*!
 * Utility function to compare doubles (using Firestore semantics for NaN).
 * @private
 */
function compareNumbers(left: number, right: number): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  if (left === right) {
    return 0;
  }
  // one or both are NaN.
  if (isNaN(left)) {
    return isNaN(right) ? 0 : -1;
  }
  return 1;
}

/*!
 * @private
 */
function compareNumberProtos(left: api.IValue, right: api.IValue): number {
  let leftValue, rightValue;
  if (left.integerValue !== undefined) {
    leftValue = Number(left.integerValue!);
  } else {
    leftValue = Number(left.doubleValue!);
  }
  if (right.integerValue !== undefined) {
    rightValue = Number(right.integerValue);
  } else {
    rightValue = Number(right.doubleValue!);
  }
  return compareNumbers(leftValue, rightValue);
}

/*!
 * @private
 */
function compareTimestamps(
    left: google.protobuf.ITimestamp,
    right: google.protobuf.ITimestamp): number {
  const seconds = primitiveComparator(left.seconds || 0, right.seconds || 0);
  if (seconds !== 0) {
    return seconds;
  }
  return primitiveComparator(left.nanos || 0, right.nanos || 0);
}

/*!
 * @private
 */
function compareBlobs(left: Uint8Array, right: Uint8Array): number {
  if (!(left instanceof Buffer) || !(right instanceof Buffer)) {
    throw new Error('Blobs can only be compared if they are Buffers.');
  }
  return Buffer.compare(left, right);
}

/*!
 * @private
 */
function compareReferenceProtos(left: api.IValue, right: api.IValue): number {
  const leftPath = ResourcePath.fromSlashSeparatedString(left.referenceValue!);
  const rightPath =
      ResourcePath.fromSlashSeparatedString(right.referenceValue!);
  return leftPath.compareTo(rightPath);
}

/*!
 * @private
 */
function compareGeoPoints(
    left: google.type.ILatLng, right: google.type.ILatLng): number {
  return (
      primitiveComparator(left.latitude || 0, right.latitude || 0) ||
      primitiveComparator(left.longitude || 0, right.longitude || 0));
}

/*!
 * @private
 */
function compareArrays(left: api.IValue[], right: api.IValue[]): number {
  for (let i = 0; i < left.length && i < right.length; i++) {
    const valueComparison = compare(left[i], right[i]);
    if (valueComparison !== 0) {
      return valueComparison;
    }
  }
  // If all the values matched so far, just check the length.
  return primitiveComparator(left.length, right.length);
}

/*!
 * @private
 */
function compareObjects(left: ApiMapValue, right: ApiMapValue): number {
  // This requires iterating over the keys in the object in order and doing a
  // deep comparison.
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  leftKeys.sort();
  rightKeys.sort();
  for (let i = 0; i < leftKeys.length && i < rightKeys.length; i++) {
    const keyComparison = primitiveComparator(leftKeys[i], rightKeys[i]);
    if (keyComparison !== 0) {
      return keyComparison;
    }
    const key = leftKeys[i];
    const valueComparison = compare(left[key], right[key]);
    if (valueComparison !== 0) {
      return valueComparison;
    }
  }
  // If all the keys matched so far, just check the length.
  return primitiveComparator(leftKeys.length, rightKeys.length);
}

/*!
 * @private
 */
export function compare(left: api.IValue, right: api.IValue): number {
  // First compare the types.
  const leftType = typeOrder(left);
  const rightType = typeOrder(right);
  const typeComparison = primitiveComparator(leftType, rightType);
  if (typeComparison !== 0) {
    return typeComparison;
  }

  // So they are the same type.
  switch (leftType) {
    case TypeOrder.NULL:
      // Nulls are all equal.
      return 0;
    case TypeOrder.BOOLEAN:
      return primitiveComparator(left.booleanValue!, right.booleanValue!);
    case TypeOrder.STRING:
      return primitiveComparator(left.stringValue!, right.stringValue!);
    case TypeOrder.NUMBER:
      return compareNumberProtos(left, right);
    case TypeOrder.TIMESTAMP:
      return compareTimestamps(left.timestampValue!, right.timestampValue!);
    case TypeOrder.BLOB:
      return compareBlobs(left.bytesValue!, right.bytesValue!);
    case TypeOrder.REF:
      return compareReferenceProtos(left, right);
    case TypeOrder.GEO_POINT:
      return compareGeoPoints(left.geoPointValue!, right.geoPointValue!);
    case TypeOrder.ARRAY:
      return compareArrays(
          left.arrayValue!.values || [], right.arrayValue!.values || []);
    case TypeOrder.OBJECT:
      return compareObjects(
          left.mapValue!.fields || {}, right.mapValue!.fields || {});
    default:
      throw new Error(`Encountered unknown type order: ${leftType}`);
  }
}
