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

/**
 * Converts an ISO 8601 or Protobuf JS 'timestampValue' into Protobuf JS.
 *
 * @private
 * @param {*=} timestampValue - The value to convert.
 * @return {{nanos,seconds}|undefined} The value as expected by Protobuf JS or
 * undefined if no input was provided.
 */
function convertTimestamp(timestampValue) {
  let timestampProto = undefined;

  if (is.string(timestampValue)) {
    let date = new Date(timestampValue);
    let seconds = Math.floor(date.getTime() / 1000);
    let nanos = null;

    let nanoString = timestampValue.substring(20, timestampValue.length - 1);

    if (nanoString.length === 3) {
      nanoString = `${nanoString}000000`;
    } else if (nanoString.length === 6) {
      nanoString = `${nanoString}000`;
    }

    if (nanoString.length === 9) {
      nanos = parseInt(nanoString);
    }

    if (isNaN(seconds) || isNaN(nanos)) {
      // This error should only ever be thrown if the end-user specifies an
      // invalid 'lastUpdateTime'.
      throw new Error(
        'Specify a valid ISO 8601 timestamp for "lastUpdateTime".'
      );
    }

    timestampProto = {
      seconds: seconds,
      nanos: nanos,
    };
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
 * Converts an API JSON or Protobuf JS 'bytesValue' field into Protobuf JS.
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
 * Detects 'valueType' from an API JSON or Protobuf JS 'Field' proto.
 *
 * @private
 * @param {object} proto - The 'field' proto.
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
 * Converts an API JSON or Protobuf JS 'Field' proto into Protobuf JS.
 *
 * @private
 * @param {object} fieldValue - The 'Field' value in API JSON or Protobuf JS
 * format.
 * @return The 'Field' proto in Protobuf JS format.
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
 * Converts an API JSON or Protobuf JS 'Document' into Protobuf JS. This
 * conversion creates a copy of underlying document.
 *
 * @private
 * @param {object} document - The 'Document' in API JSON or Protobuf JS format.
 * @return {object} The 'Document' in Protobuf JS format.
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
  convertDocument,
  convertTimestamp,
};
