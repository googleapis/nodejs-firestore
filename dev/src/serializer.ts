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

import * as proto from '../protos/firestore_proto_api';

import {detectValueType} from './convert';
import {FieldTransform} from './field-value';
import {DeleteTransform} from './field-value';
import {GeoPoint} from './geo-point';
import {DocumentReference, Firestore} from './index';
import {FieldPath, QualifiedResourcePath} from './path';
import {Timestamp} from './timestamp';
import {ApiMapValue, DocumentData, ValidationOptions} from './types';
import {isEmpty, isObject} from './util';
import {customObjectMessage, invalidArgumentMessage} from './validate';

import api = proto.google.firestore.v1;

/**
 * The maximum depth of a Firestore object.
 *
 * @private
 */
const MAX_DEPTH = 20;

/**
 * An interface for Firestore types that can be serialized to Protobuf.
 *
 * @private
 */
export interface Serializable {
  toProto(): api.IValue;
}

/**
 * Serializer that is used to convert between JavaScript types and their
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
    // tslint:disable-next-line deprecation
    if (firestore._settings.timestampsInSnapshots === undefined) {
      this.timestampsInSnapshots = true;
    } else {
      // tslint:disable-next-line deprecation
      this.timestampsInSnapshots = firestore._settings.timestampsInSnapshots;
    }
  }

  /**
   * Encodes a JavaScript object into the Firestore 'Fields' representation.
   *
   * @private
   * @param obj The object to encode.
   * @returns The Firestore 'Fields' representation
   */
  encodeFields(obj: DocumentData): ApiMapValue {
    const fields: ApiMapValue = {};

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
  encodeValue(val: unknown): api.IValue | null {
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

    if (typeof val === 'number') {
      if (Number.isSafeInteger(val)) {
        return {
          integerValue: val as number,
        };
      } else {
        return {
          doubleValue: val as number,
        };
      }
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

    if (isObject(val)) {
      const toProto = val['toProto'];
      if (typeof toProto === 'function') {
        return toProto.bind(val)();
      }
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
        if (isEmpty(map.mapValue!.fields!)) {
          return null;
        }
      }

      return map;
    }

    throw new Error(`Cannot encode value: ${val}`);
  }

  /**
   * Decodes a single Firestore 'Value' Protobuf.
   *
   * @private
   * @param proto A Firestore 'Value' Protobuf.
   * @returns The converted JS type.
   */
  decodeValue(proto: api.IValue): unknown {
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
        const timestamp = Timestamp.fromProto(proto.timestampValue!);
        return this.timestampsInSnapshots ? timestamp : timestamp.toDate();
      }
      case 'referenceValue': {
        const resourcePath = QualifiedResourcePath.fromSlashSeparatedString(
          proto.referenceValue!
        );
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
        const obj: DocumentData = {};
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
          'Cannot decode type from Firestore Value: ' + JSON.stringify(proto)
        );
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
export function isPlainObject(input: unknown): input is DocumentData {
  return (
    isObject(input) &&
    (Object.getPrototypeOf(input) === Object.prototype ||
      Object.getPrototypeOf(input) === null)
  );
}

/**
 * Validates a JavaScript value for usage as a Firestore value.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value JavaScript value to validate.
 * @param desc A description of the expected type.
 * @param path The field path to validate.
 * @param options Validation options
 * @param level The current depth of the traversal. This is used to decide
 * whether deletes are allowed in conjunction with `allowDeletes: root`.
 * @param inArray Whether we are inside an array.
 * @throws when the object is invalid.
 */
export function validateUserInput(
  arg: string | number,
  value: unknown,
  desc: string,
  options: ValidationOptions,
  path?: FieldPath,
  level?: number,
  inArray?: boolean
): void {
  if (path && path.size > MAX_DEPTH) {
    throw new Error(
      `${invalidArgumentMessage(
        arg,
        desc
      )} Input object is deeper than ${MAX_DEPTH} levels or contains a cycle.`
    );
  }

  options = options || {};
  level = level || 0;
  inArray = inArray || false;

  const fieldPathMessage = path ? ` (found in field ${path})` : '';

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; ++i) {
      validateUserInput(
        arg,
        value[i]!,
        desc,
        options,
        path ? path.append(String(i)) : new FieldPath(String(i)),
        level + 1,
        /* inArray= */ true
      );
    }
  } else if (isPlainObject(value)) {
    for (const prop in value) {
      if (value.hasOwnProperty(prop)) {
        validateUserInput(
          arg,
          value[prop]!,
          desc,
          options,
          path ? path.append(new FieldPath(prop)) : new FieldPath(prop),
          level + 1,
          inArray
        );
      }
    }
  } else if (value === undefined) {
    throw new Error(
      `${invalidArgumentMessage(
        arg,
        desc
      )} Cannot use "undefined" as a Firestore value${fieldPathMessage}.`
    );
  } else if (value instanceof DeleteTransform) {
    if (inArray) {
      throw new Error(
        `${invalidArgumentMessage(arg, desc)} ${
          value.methodName
        }() cannot be used inside of an array${fieldPathMessage}.`
      );
    } else if (
      (options.allowDeletes === 'root' && level !== 0) ||
      options.allowDeletes === 'none'
    ) {
      throw new Error(
        `${invalidArgumentMessage(arg, desc)} ${
          value.methodName
        }() must appear at the top-level and can only be used in update() or set() with {merge:true}${fieldPathMessage}.`
      );
    }
  } else if (value instanceof FieldTransform) {
    if (inArray) {
      throw new Error(
        `${invalidArgumentMessage(arg, desc)} ${
          value.methodName
        }() cannot be used inside of an array${fieldPathMessage}.`
      );
    } else if (!options.allowTransforms) {
      throw new Error(
        `${invalidArgumentMessage(arg, desc)} ${
          value.methodName
        }() can only be used in set(), create() or update()${fieldPathMessage}.`
      );
    }
  } else if (value instanceof FieldPath) {
    throw new Error(
      `${invalidArgumentMessage(
        arg,
        desc
      )} Cannot use object of type "FieldPath" as a Firestore value${fieldPathMessage}.`
    );
  } else if (value instanceof DocumentReference) {
    // Ok.
  } else if (value instanceof GeoPoint) {
    // Ok.
  } else if (value instanceof Timestamp || value instanceof Date) {
    // Ok.
  } else if (value instanceof Buffer || value instanceof Uint8Array) {
    // Ok.
  } else if (value === null) {
    // Ok.
  } else if (typeof value === 'object') {
    throw new Error(customObjectMessage(arg, value, path));
  }
}
