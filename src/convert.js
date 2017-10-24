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

const Buffer = require('safe-buffer').Buffer;
const is = require('is');

const validate = require('./validate')();

/*!
 * @module firestore/convert
 * @private
 *
 * This module contains utility functions to convert
 * `firestore.v1beta1.Documents` from Proto3 JSON to their equivalent
 * representation in Protobuf JS. Protobuf JS is the only encoding supported by
 * this client, and dependencies that use Proto3 JSON (such as the Google Cloud
 * Functions SDK) are supported through this conversion and its usage in
 * {@see Firestore#snapshot_}.
 */

/**
 * Converts an ISO 8601 or google.protobuf.Timestamp proto into Protobuf JS.
 *
 * @private
 * @param {*=} timestampValue - The value to convert.
 * @param {string=} argumentName - The argument name to use in the error message
 * if the conversion fails. If omitted, 'timestampValue' is used.
 * @return {{nanos,seconds}|undefined} The value as expected by Protobuf JS or
 * undefined if no input was provided.
 */
function convertTimestamp(timestampValue, argumentName) {
  let timestampProto = undefined;

  if (is.string(timestampValue)) {
    let date = new Date(timestampValue);
    let seconds = Math.floor(date.getTime() / 1000);
    let nanos = 0;

    if (timestampValue.length > 20) {
      const nanoString = timestampValue.substring(
        20,
        timestampValue.length - 1
      );
      const trailingZeroes = 9 - nanoString.length;
      nanos = parseInt(nanoString, 10) * Math.pow(10, trailingZeroes);
    }

    if (isNaN(seconds) || isNaN(nanos)) {
      argumentName = argumentName || 'timestampValue';
      throw new Error(
        `Specify a valid ISO 8601 timestamp for "${argumentName}".`
      );
    }

    timestampProto = {seconds, nanos};
  } else if (is.defined(timestampValue)) {
    validate.isObject('timestampValue', timestampValue);
    timestampProto = {
      seconds: timestampValue.seconds || 0,
      nanos: timestampValue.nanos || 0,
    };
  }

  return timestampProto;
}

/**
 * Converts a Proto3 JSON 'bytesValue' field into Protobuf JS.
 *
 * @private
 * @param {*} bytesValue - The value to convert.
 * @return {Buffer} The value as expected by Protobuf JS.
 */
function convertBytes(bytesValue) {
  if (typeof bytesValue === 'string') {
    return Buffer.from(bytesValue, 'base64');
  } else {
    return bytesValue;
  }
}

/**
 * Detects 'valueType' from a Proto3 JSON `firestore.v1beta1.Value` proto.
 *
 * @private
 * @param {object} proto - The `firestore.v1beta1.Value` proto.
 * @return {string} - The string value for 'valueType'.
 */
function detectValueType(proto) {
  if (proto.valueType) {
    return proto.valueType;
  }

  let detectedValues = [];

  if (is.defined(proto.stringValue)) {
    detectedValues.push('stringValue');
  }
  if (is.defined(proto.booleanValue)) {
    detectedValues.push('booleanValue');
  }
  if (is.defined(proto.integerValue)) {
    detectedValues.push('integerValue');
  }
  if (is.defined(proto.doubleValue)) {
    detectedValues.push('doubleValue');
  }
  if (is.defined(proto.timestampValue)) {
    detectedValues.push('timestampValue');
  }
  if (is.defined(proto.referenceValue)) {
    detectedValues.push('referenceValue');
  }
  if (is.defined(proto.arrayValue)) {
    detectedValues.push('arrayValue');
  }
  if (is.defined(proto.nullValue)) {
    detectedValues.push('nullValue');
  }
  if (is.defined(proto.mapValue)) {
    detectedValues.push('mapValue');
  }
  if (is.defined(proto.geoPointValue)) {
    detectedValues.push('geoPointValue');
  }
  if (is.defined(proto.bytesValue)) {
    detectedValues.push('bytesValue');
  }

  if (detectedValues.length !== 1) {
    throw new Error(
      `Unable to infer type value fom '${JSON.stringify(proto)}'.`
    );
  }

  return detectedValues[0];
}

/**
 * Converts a `firestore.v1beta1.Value` in Proto3 JSON encoding into the
 * Protobuf JS format expected by this client.
 *
 * @private
 * @param {object} fieldValue - The `firestore.v1beta1.Value` in Proto3 JSON
 * format.
 * @return {object} The `firestore.v1beta1.Value` in Protobuf JS format.
 */
function convertValue(fieldValue) {
  let valueType = detectValueType(fieldValue);

  switch (valueType) {
    case 'timestampValue':
      return {
        valueType: 'timestampValue',
        timestampValue: convertTimestamp(fieldValue.timestampValue),
      };
    case 'bytesValue':
      return {
        valueType: 'bytesValue',
        bytesValue: convertBytes(fieldValue.bytesValue),
      };
    case 'arrayValue': {
      let arrayValue = [];
      for (let value of fieldValue.arrayValue.values) {
        arrayValue.push(convertValue(value));
      }
      return {
        valueType: 'arrayValue',
        arrayValue: {
          values: arrayValue,
        },
      };
    }
    case 'mapValue': {
      let mapValue = {};
      for (let prop in fieldValue.mapValue.fields) {
        if (fieldValue.mapValue.fields.hasOwnProperty(prop)) {
          mapValue[prop] = convertValue(fieldValue.mapValue.fields[prop]);
        }
      }
      return {
        valueType: 'mapValue',
        mapValue: {
          fields: mapValue,
        },
      };
    }
    default:
      return Object.assign({valueType}, fieldValue);
  }
}

/**
 * Converts a `firestore.v1beta1.Document` in Proto3 JSON encoding into the
 * Protobuf JS format expected by this client. This conversion creates a copy of
 * the underlying document.
 *
 * @private
 * @param {object} document - The `firestore.v1beta1.Document` in Proto3 JSON
 * format.
 * @return {object} The `firestore.v1beta1.Document` in Protobuf JS format.
 */
function convertDocument(document) {
  let result = {};

  for (let prop in document) {
    if (document.hasOwnProperty(prop)) {
      result[prop] = convertValue(document[prop]);
    }
  }

  return result;
}

module.exports = {
  documentFromJson: convertDocument,
  timestampFromJson: convertTimestamp,
};
