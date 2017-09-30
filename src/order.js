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

const is = require('is');

/*!
 * @see ResourcePath
 */
const ResourcePath = require('./path').ResourcePath;

/*!
 * The type order as defined by the backend.
 */
const types = {
  NULL: 0,
  BOOLEAN: 1,
  NUMBER: 2,
  TIMESTAMP: 3,
  STRING: 4,
  BLOB: 5,
  REF: 6,
  GEOPOINT: 7,
  ARRAY: 8,
  OBJECT: 9,
};

/*!
 * @private
 */
function typeOrder(val) {
  switch (val.valueType) {
    case 'nullValue': {
      return types.NULL;
    }
    case 'integerValue': {
      return types.NUMBER;
    }
    case 'doubleValue': {
      return types.NUMBER;
    }
    case 'stringValue': {
      return types.STRING;
    }
    case 'booleanValue': {
      return types.BOOLEAN;
    }
    case 'arrayValue': {
      return types.ARRAY;
    }
    case 'timestampValue': {
      return types.TIMESTAMP;
    }
    case 'geoPointValue': {
      return types.GEOPOINT;
    }
    case 'bytesValue': {
      return types.BLOB;
    }
    case 'referenceValue': {
      return types.REF;
    }
    case 'mapValue': {
      return types.OBJECT;
    }
    default: {
      throw new Error(
        'Cannot use type (' +
          val +
          ': ' +
          JSON.stringify(val) +
          ') as a Firestore value.'
      );
    }
  }
}

/*!
 * @private
 */
function primitiveComparator(left, right) {
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
function compareNumbers(left, right) {
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
function compareNumberProtos(left, right) {
  let leftValue, rightValue;
  if (left.valueType === 'integerValue') {
    leftValue = parseInt(left.integerValue, 10);
  } else {
    leftValue = parseFloat(left.doubleValue, 10);
  }
  if (right.valueType === 'integerValue') {
    rightValue = parseInt(right.integerValue, 10);
  } else {
    rightValue = parseFloat(right.doubleValue, 10);
  }
  return compareNumbers(leftValue, rightValue);
}

/*!
 * @private
 */
function compareTimestamps(left, right) {
  let seconds = primitiveComparator(left.seconds, right.seconds);
  if (seconds !== 0) {
    return seconds;
  }
  return primitiveComparator(left.nanos, right.nanos);
}

/*!
 * @private
 */
function compareBlobs(left, right) {
  if (!is.instanceof(left, Buffer) || !is.instanceof(right, Buffer)) {
    throw new Error('Blobs can only be compared if they are Buffers.');
  }
  return Buffer.compare(left, right);
}

/*!
 * @private
 */
function compareReferenceProtos(left, right) {
  const leftPath = ResourcePath.fromSlashSeparatedString(left.referenceValue);
  const rightPath = ResourcePath.fromSlashSeparatedString(right.referenceValue);
  return leftPath.compareTo(rightPath);
}

/*!
 * @private
 */
function compareGeoPoints(left, right) {
  return (
    primitiveComparator(left.latitude, right.latitude) ||
    primitiveComparator(left.longitude, right.longitude)
  );
}

/*!
 * @private
 */
function compareArrays(left, right) {
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
function compareObjects(left, right) {
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
function compare(left, right) {
  // First compare the types.
  const leftType = typeOrder(left);
  const rightType = typeOrder(right);
  const typeComparison = primitiveComparator(leftType, rightType);
  if (typeComparison !== 0) {
    return typeComparison;
  }

  // So they are the same type.
  switch (leftType) {
    case types.NULL: {
      // Nulls are all equal.
      return 0;
    }
    case types.BOOLEAN: {
      return primitiveComparator(left.booleanValue, right.booleanValue);
    }
    case types.STRING: {
      return primitiveComparator(left.stringValue, right.stringValue);
    }
    case types.NUMBER: {
      return compareNumberProtos(left, right);
    }
    case types.TIMESTAMP: {
      return compareTimestamps(left.timestampValue, right.timestampValue);
    }
    case types.BLOB: {
      return compareBlobs(left.bytesValue, right.bytesValue);
    }
    case types.REF: {
      return compareReferenceProtos(left, right);
    }
    case types.GEOPOINT: {
      return compareGeoPoints(left.geoPointValue, right.geoPointValue);
    }
    case types.ARRAY: {
      return compareArrays(left.arrayValue.values, right.arrayValue.values);
    }
    case types.OBJECT: {
      return compareObjects(left.mapValue.fields, right.mapValue.fields);
    }
  }
}

module.exports = {compare, primitiveComparator};
