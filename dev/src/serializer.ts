/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import * as is from 'is';

import * as proto from '../protos/firestore_proto_api';
import api = proto.google.firestore.v1beta1;

import {Timestamp} from './timestamp';
import {FieldTransform} from './field-value';

import {customObjectError} from './validate';
import {ResourcePath} from './path';
import {detectValueType} from './convert';
import {AnyDuringMigration, AnyJs, UserInput} from './types';
import {GeoPoint} from './geo-point';
import {DocumentReference, Firestore} from './index';

/** An interface for Firestore types that can be serialized to Protobuf. */
export interface Serializable {
  toProto(): api.IValue;
}

/**
 * Serializer that is used to convert between JavaScripts types and their
 * Firestore Protobuf representation.
 *
 * @private
 */
export class Serializer {
  private timestampsInSnapshots: boolean;
  private createReference: (path: string) => DocumentReference;

  constructor(firestore: Firestore) {
    // Instead of storing the `firestore` object, we store just a reference to
    // its `.doc()` method. This avoid a circular reference, which breaks
    // JSON.stringify().
    this.createReference = path => firestore.doc(path);
    this.timestampsInSnapshots = !!firestore._settings.timestampsInSnapshots;
  }

  /**
   * Encodes a JavaScrip object into the Firestore 'Fields' representation.
   *
   * @private
   * @param obj The object to encode.
   * @returns The Firestore 'Fields' representation
   */
  encodeFields(obj: object): {[k: string]: api.IValue} {
    const fields = {};

    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        const val = this.encodeValue(obj[prop]);

        if (val) {
          fields[prop] = val;
        }
      }
    }

    return fields;
  }

  /**
   * Encodes a JavaScript value into the Firestore 'Value' representation.
   *
   * @private
   * @param val The object to encode
   * @returns The Firestore Proto or null if we are deleting a field.
   */
  encodeValue(val: AnyJs|AnyJs[]|Serializable): api.IValue|null {
    if (val instanceof FieldTransform) {
      return null;
    }

    if (typeof val === 'string') {
      return {
        stringValue: val as string,
      };
    }

    if (typeof val === 'boolean') {
      return {
        booleanValue: val as boolean,
      };
    }

    if (typeof val === 'number' && !isNaN(val) && val % 1 === 0) {
      return {
        integerValue: val as number,
      };
    }

    // Integers are handled above, the remaining numbers are treated as doubles
    if (typeof val === 'number') {
      return {
        doubleValue: val as number,
      };
    }

    if (val instanceof Date) {
      const timestamp = Timestamp.fromDate(val as Date);
      return {
        timestampValue: {
          seconds: timestamp.seconds,
          nanos: timestamp.nanoseconds,
        },
      };
    }

    if (val === null) {
      return {
        nullValue: 'NULL_VALUE',
      };
    }


    if (val instanceof Buffer || val instanceof Uint8Array) {
      return {
        bytesValue: val,
      };
    }


    if (isObject(val) && 'toProto' in val &&
        typeof (val as Serializable).toProto === 'function') {
      return (val as Serializable).toProto();
    }

    if (val instanceof Array) {
      const array: api.IValue = {
        arrayValue: {},
      };

      if (val.length > 0) {
        array.arrayValue!.values = [];
        for (let i = 0; i < val.length; ++i) {
          const enc = this.encodeValue(val[i]);
          if (enc) {
            array.arrayValue!.values!.push(enc);
          }
        }
      }

      return array;
    }

    if (typeof val === 'object' && isPlainObject(val)) {
      const map: api.IValue = {
        mapValue: {},
      };

      // If we encounter an empty object, we always need to send it to make sure
      // the server creates a map entry.
      if (!isEmpty(val)) {
        map.mapValue!.fields = this.encodeFields(val);
        if (isEmpty(map.mapValue!.fields)) {
          return null;
        }
      }

      return map;
    }

    throw customObjectError(val);
  }

  /**
   * Decodes a single Firestore 'Value' Protobuf.
   *
   * @private
   * @param proto A Firestore 'Value' Protobuf.
   * @returns The converted JS type.
   */
  decodeValue(proto: api.IValue): AnyJs {
    const valueType = detectValueType(proto);

    switch (valueType) {
      case 'stringValue': {
        return proto.stringValue;
      }
      case 'booleanValue': {
        return proto.booleanValue;
      }
      case 'integerValue': {
        return Number(proto.integerValue);
      }
      case 'doubleValue': {
        return Number(proto.doubleValue);
      }
      case 'timestampValue': {
        const timestamp = Timestamp.fromProto(proto.timestampValue);
        return this.timestampsInSnapshots ? timestamp : timestamp.toDate();
      }
      case 'referenceValue': {
        const resourcePath =
            ResourcePath.fromSlashSeparatedString(proto.referenceValue!);
        return this.createReference(resourcePath.relativeName);
      }
      case 'arrayValue': {
        const array: unknown[] = [];
        if (Array.isArray(proto.arrayValue!.values)) {
          for (const value of proto.arrayValue!.values!) {
            array.push(this.decodeValue(value));
          }
        }
        return array;
      }
      case 'nullValue': {
        return null;
      }
      case 'mapValue': {
        const obj = {};
        const fields = proto.mapValue!.fields!;

        for (const prop in fields) {
          if (fields.hasOwnProperty(prop)) {
            obj[prop] = this.decodeValue(fields[prop]);
          }
        }

        return obj;
      }
      case 'geoPointValue': {
        return GeoPoint.fromProto(proto.geoPointValue!);
      }
      case 'bytesValue': {
        return proto.bytesValue;
      }
      default: {
        throw new Error(
            'Cannot decode type from Firestore Value: ' +
            JSON.stringify(proto));
      }
    }
  }
}


/**
 * Verifies that 'obj' is a plain JavaScript object that can be encoded as a
 * 'Map' in Firestore.
 *
 * @private
 * @param input The argument to verify.
 * @returns 'true' if the input can be a treated as a plain object.
 */
export function isPlainObject(input: UserInput): boolean {
  return (
      typeof input === 'object' && input !== null &&
      (Object.getPrototypeOf(input) === Object.prototype ||
       Object.getPrototypeOf(input) === null));
}
