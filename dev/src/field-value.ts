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

import * as firestore from '@google-cloud/firestore';

import * as deepEqual from 'fast-deep-equal';

import * as proto from '../protos/firestore_v1_proto_api';

import {FieldPath} from './path';
import {Serializer, validateUserInput} from './serializer';
import {isPrimitiveArrayEqual} from './util';
import {
  invalidArgumentMessage,
  validateMinNumberOfArguments,
  validateNumber,
} from './validate';

import api = proto.google.firestore.v1;
import {
  RESERVED_BSON_BINARY_KEY,
  RESERVED_INT32_KEY,
  RESERVED_BSON_OBJECT_ID_KEY,
  RESERVED_REGEX_KEY,
  RESERVED_REGEX_OPTIONS_KEY,
  RESERVED_REGEX_PATTERN_KEY,
  RESERVED_BSON_TIMESTAMP_INCREMENT_KEY,
  RESERVED_BSON_TIMESTAMP_KEY,
  RESERVED_BSON_TIMESTAMP_SECONDS_KEY,
} from './map-type';

/**
 * Represent a vector type in Firestore documents.
 * Create an instance with {@link FieldValue.vector}.
 *
 * @class VectorValue
 */
export class VectorValue implements firestore.VectorValue {
  private readonly _values: number[];

  /**
   * @private
   * @internal
   */
  constructor(values: number[] | undefined) {
    // Making a copy of the parameter.
    this._values = (values || []).map(n => n);
  }

  /**
   * Returns a copy of the raw number array form of the vector.
   */
  public toArray(): number[] {
    return this._values.map(n => n);
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return serializer.encodeVector(this._values);
  }

  /**
   * @private
   * @internal
   */
  static _fromProto(valueArray: api.IValue): VectorValue {
    const values = valueArray.arrayValue?.values?.map(v => {
      return v.doubleValue!;
    });
    return new VectorValue(values);
  }

  /**
   * Returns `true` if the two VectorValue has the same raw number arrays, returns `false` otherwise.
   */
  isEqual(other: VectorValue): boolean {
    return isPrimitiveArrayEqual(this._values, other._values);
  }
}

/**
 * Represents the Firestore "Min Key" data type.
 *
 * @class MinKey
 */
export class MinKey implements firestore.MinKey {
  private static MIN_KEY_VALUE_INSTANCE = new MinKey();
  readonly type = 'MinKey';

  private constructor() {}

  /**
   * @private
   * @internal
   */
  static instance(): MinKey {
    return MinKey.MIN_KEY_VALUE_INSTANCE;
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return serializer.encodeMinKey();
  }
}

/**
 * Represents the Firestore "Max Key" data type.
 *
 * @class MaxKey
 */
export class MaxKey implements firestore.MaxKey {
  private static MAX_KEY_VALUE_INSTANCE = new MaxKey();
  readonly type = 'MaxKey';

  /**
   * @private
   * @internal
   */
  private constructor() {}

  /**
   * @private
   * @internal
   */
  static instance(): MaxKey {
    return MaxKey.MAX_KEY_VALUE_INSTANCE;
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return serializer.encodeMaxKey();
  }
}

/**
 * Represents a regular expression type in Firestore documents.
 * Create an instance with {@link FieldValue.regex}.
 *
 * @class RegexValue
 */
export class RegexValue implements firestore.RegexValue {
  /**
   * @private
   * @internal
   */
  constructor(
    readonly pattern: string,
    readonly options: string
  ) {}

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return serializer.encodeRegex(this.pattern, this.options);
  }

  /**
   * @private
   * @internal
   */
  static _fromProto(proto: api.IValue): RegexValue {
    const fields = proto.mapValue!.fields;
    const pattern =
      fields?.[RESERVED_REGEX_KEY]?.mapValue?.fields?.[
        RESERVED_REGEX_PATTERN_KEY
      ]?.stringValue ?? '';
    const options =
      fields?.[RESERVED_REGEX_KEY]?.mapValue?.fields?.[
        RESERVED_REGEX_OPTIONS_KEY
      ]?.stringValue ?? '';
    return new RegexValue(pattern, options);
  }

  /**
   * Returns `true` if the two regex values have the same pattern and options, returns `false` otherwise.
   */
  isEqual(other: RegexValue): boolean {
    return this.pattern === other.pattern && this.options === other.options;
  }
}

/**
 * Represents a BSON ObjectId type in Firestore documents.
 * Create an instance with {@link FieldValue.bsonObjectId}.
 *
 * @class BsonObjectId
 */
export class BsonObjectId implements firestore.BsonObjectId {
  /**
   * @private
   * @internal
   */
  constructor(readonly value: string) {}

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return serializer.encodeBsonObjectId(this.value);
  }

  /**
   * @private
   * @internal
   */
  static _fromProto(proto: api.IValue): BsonObjectId {
    const oid =
      proto.mapValue!.fields?.[RESERVED_BSON_OBJECT_ID_KEY]?.stringValue ?? '';
    return new BsonObjectId(oid);
  }

  /**
   * Returns `true` if the two regex values have the same pattern and options, returns `false` otherwise.
   */
  isEqual(other: BsonObjectId): boolean {
    return this.value === other.value;
  }
}

/** Represents a 32-bit integer type in Firestore documents. */
export class Int32Value implements firestore.Int32Value {
  /**
   * @private
   * @internal
   */
  constructor(readonly value: number) {}

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return serializer.encodeInt32(this.value);
  }

  /**
   * @private
   * @internal
   */
  static _fromProto(proto: api.IValue): Int32Value {
    const value = Number(
      proto.mapValue!.fields?.[RESERVED_INT32_KEY]?.integerValue
    );
    return new Int32Value(value);
  }

  /**
   * Returns true if this `Int32Value` is equal to the provided one.
   *
   * @param other The `Int32Value` to compare against.
   * @return 'true' if this `Int32Value` is equal to the provided one.
   */
  isEqual(other: Int32Value): boolean {
    return this.value === other.value;
  }
}

/** Represents a Request Timestamp type in Firestore documents. */
export class BsonTimestamp implements firestore.BsonTimestamp {
  /**
   * @private
   * @internal
   */
  constructor(
    readonly seconds: number,
    readonly increment: number
  ) {
    if (seconds < 0 || seconds > 4294967295) {
      throw new Error(
        "BsonTimestamp 'seconds' must be in the range of a 32-bit unsigned integer."
      );
    }
    if (increment < 0 || increment > 4294967295) {
      throw new Error(
        "BsonTimestamp 'increment' must be in the range of a 32-bit unsigned integer."
      );
    }
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return serializer.encodeBsonTimestamp(this.seconds, this.increment);
  }

  /**
   * @private
   * @internal
   */
  static _fromProto(proto: api.IValue): BsonTimestamp {
    const fields = proto.mapValue!.fields?.[RESERVED_BSON_TIMESTAMP_KEY];
    const seconds = Number(
      fields?.mapValue?.fields?.[RESERVED_BSON_TIMESTAMP_SECONDS_KEY]
        ?.integerValue
    );
    const increment = Number(
      fields?.mapValue?.fields?.[RESERVED_BSON_TIMESTAMP_INCREMENT_KEY]
        ?.integerValue
    );
    return new BsonTimestamp(seconds, increment);
  }

  /**
   * Returns true if this `BsonTimestamp` is equal to the provided one.
   *
   * @param other The `BsonTimestamp` to compare against.
   * @return 'true' if this `BsonTimestamp` is equal to the provided one.
   */
  isEqual(other: BsonTimestamp): boolean {
    return this.seconds === other.seconds && this.increment === other.increment;
  }
}

/** Represents a BSON Binary Data type in Firestore documents. */
export class BsonBinaryData implements firestore.BsonBinaryData {
  /**
   * @private
   * @internal
   */
  constructor(
    readonly subtype: number,
    readonly data: Uint8Array
  ) {
    // By definition the subtype should be 1 byte and should therefore
    // have a value between 0 and 255
    if (subtype < 0 || subtype > 255) {
      throw new Error(
        'The subtype for BsonBinaryData must be a value in the inclusive [0, 255] range.'
      );
    }
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return serializer.encodeBsonBinaryData(this.subtype, this.data);
  }

  /**
   * @private
   * @internal
   */
  static _fromProto(proto: api.IValue): BsonBinaryData {
    const fields = proto.mapValue!.fields?.[RESERVED_BSON_BINARY_KEY];
    const subtypeAndData = fields?.bytesValue;
    if (!subtypeAndData) {
      throw new Error('Received incorrect bytesValue for BsonBinaryData');
    }
    if (subtypeAndData.length === 0) {
      throw new Error('Received empty bytesValue for BsonBinaryData');
    }
    const subtype = subtypeAndData[0];
    const data = subtypeAndData.slice(1);
    return new BsonBinaryData(subtype, data);
  }

  /**
   * Returns true if this `BsonBinaryData` is equal to the provided one.
   *
   * @param other The `BsonBinaryData` to compare against.
   * @return 'true' if this `BsonBinaryData` is equal to the provided one.
   */
  isEqual(other: BsonBinaryData): boolean {
    return (
      this.subtype === other.subtype &&
      Buffer.from(this.data).equals(other.data)
    );
  }
}

/**
 * Sentinel values that can be used when writing documents with set(), create()
 * or update().
 *
 * @class FieldValue
 */
export class FieldValue implements firestore.FieldValue {
  /** @private */
  constructor() {}

  /**
   * Creates a new `VectorValue` constructed with a copy of the given array of numbers.
   *
   * @param values - Create a `VectorValue` instance with a copy of this array of numbers.
   *
   * @returns A new `VectorValue` constructed with a copy of the given array of numbers.
   */
  static vector(values?: number[]): VectorValue {
    return new VectorValue(values);
  }

  /**
   * Returns a `MinKey` instance.
   *
   * @returns The `MinKey` instance.
   */
  static minKey(): MinKey {
    return MinKey.instance();
  }

  /**
   * Returns a `MaxKey` instance.
   *
   * @returns The `MaxKey` instance.
   */
  static maxKey(): MaxKey {
    return MaxKey.instance();
  }

  /**
   * Creates a new regular expression value with the given pattern and options.
   *
   * @param pattern - The pattern to use for this regex value.
   * @param options - The options to use for this regex value.
   *
   * @returns The regular expression value.
   */
  static regex(pattern: string, options: string): RegexValue {
    return new RegexValue(pattern, options);
  }

  /**
   * Creates a new BSON ObjectId value with the given value.
   *
   * @param value - The 24-character hex string representing the ObjectId.
   *
   * @returns The new BSON ObjectId instance.
   */
  static bsonObjectId(value: string): BsonObjectId {
    return new BsonObjectId(value);
  }

  /**
   * Returns a new 32-bit signed integer value.
   *
   * @param value - The number whose 32-bit representation will be used.
   *
   * Note: values larger than the largest 32-bit signed integer,
   * or smaller than the smallest 32-bit signed integer are invalid
   * and will get rejected.
   *
   * @return A new 32-bit integer value.
   */
  static int32(value: number): Int32Value {
    return new Int32Value(value);
  }

  /**
   * Creates a new BSON Timestamp from the given values.
   *
   * @param seconds - The seconds value to be used for this BSON timestamp.
   * @param increment - The increment value to be used for this BSON timestamp.
   *
   *  Note: negative values and values larger than the largest 32-bit
   *  unsigned integer are invalid and will get rejected.
   *
   * @return A new BSON Timestamp value.
   */
  static bsonTimestamp(seconds: number, increment: number): BsonTimestamp {
    return new BsonTimestamp(seconds, increment);
  }

  /**
   * Creates a new BSON Binary Data from the given values.
   *
   * @param subtype - The subtype of the data.
   * @param data - The byte array that contains the data.
   *
   * @return A new BsonBinaryData value.
   */
  static bsonBinaryData(subtype: number, data: Uint8Array): BsonBinaryData {
    return new BsonBinaryData(subtype, data);
  }

  /**
   * Returns a sentinel for use with update() or set() with {merge:true} to mark
   * a field for deletion.
   *
   * @returns {FieldValue} The sentinel value to use in your objects.
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   * let data = { a: 'b', c: 'd' };
   *
   * documentRef.set(data).then(() => {
   *   return documentRef.update({a: Firestore.FieldValue.delete()});
   * }).then(() => {
   *   // Document now only contains { c: 'd' }
   * });
   * ```
   */
  static delete(): FieldValue {
    return DeleteTransform.DELETE_SENTINEL;
  }

  /**
   * Returns a sentinel used with set(), create() or update() to include a
   * server-generated timestamp in the written data.
   *
   * @return {FieldValue} The FieldValue sentinel for use in a call to set(),
   * create() or update().
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({
   *   time: Firestore.FieldValue.serverTimestamp()
   * }).then(() => {
   *   return documentRef.get();
   * }).then(doc => {
   *   console.log(`Server time set to ${doc.get('time')}`);
   * });
   * ```
   */
  static serverTimestamp(): FieldValue {
    return ServerTimestampTransform.SERVER_TIMESTAMP_SENTINEL;
  }

  /**
   * Returns a special value that can be used with set(), create() or update()
   * that tells the server to increment the the field's current value by the
   * given value.
   *
   * If either current field value or the operand uses floating point
   * precision, both values will be interpreted as floating point numbers and
   * all arithmetic will follow IEEE 754 semantics. Otherwise, integer
   * precision is kept and the result is capped between -2^63 and 2^63-1.
   *
   * If the current field value is not of type 'number', or if the field does
   * not yet exist, the transformation will set the field to the given value.
   *
   * @param {number} n The value to increment by.
   * @return {FieldValue} The FieldValue sentinel for use in a call to set(),
   * create() or update().
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.update(
   *   'counter', Firestore.FieldValue.increment(1)
   * ).then(() => {
   *   return documentRef.get();
   * }).then(doc => {
   *   // doc.get('counter') was incremented
   * });
   * ```
   */
  static increment(n: number): FieldValue {
    // eslint-disable-next-line prefer-rest-params
    validateMinNumberOfArguments('FieldValue.increment', arguments, 1);
    return new NumericIncrementTransform(n);
  }

  /**
   * Returns a special value that can be used with set(), create() or update()
   * that tells the server to union the given elements with any array value that
   * already exists on the server. Each specified element that doesn't already
   * exist in the array will be added to the end. If the field being modified is
   * not already an array it will be overwritten with an array containing
   * exactly the specified elements.
   *
   * @param {...*} elements The elements to union into the array.
   * @return {FieldValue} The FieldValue sentinel for use in a call to set(),
   * create() or update().
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.update(
   *   'array', Firestore.FieldValue.arrayUnion('foo')
   * ).then(() => {
   *   return documentRef.get();
   * }).then(doc => {
   *   // doc.get('array') contains field 'foo'
   * });
   * ```
   */
  static arrayUnion(...elements: unknown[]): FieldValue {
    validateMinNumberOfArguments('FieldValue.arrayUnion', elements, 1);
    return new ArrayUnionTransform(elements);
  }

  /**
   * Returns a special value that can be used with set(), create() or update()
   * that tells the server to remove the given elements from any array value
   * that already exists on the server. All instances of each element specified
   * will be removed from the array. If the field being modified is not already
   * an array it will be overwritten with an empty array.
   *
   * @param {...*} elements The elements to remove from the array.
   * @return {FieldValue} The FieldValue sentinel for use in a call to set(),
   * create() or update().
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.update(
   *   'array', Firestore.FieldValue.arrayRemove('foo')
   * ).then(() => {
   *   return documentRef.get();
   * }).then(doc => {
   *   // doc.get('array') no longer contains field 'foo'
   * });
   * ```
   */
  static arrayRemove(...elements: unknown[]): FieldValue {
    validateMinNumberOfArguments('FieldValue.arrayRemove', elements, 1);
    return new ArrayRemoveTransform(elements);
  }

  /**
   * Returns true if this `FieldValue` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `FieldValue` is equal to the provided value.
   *
   * @example
   * ```
   * let fieldValues = [
   *   Firestore.FieldValue.increment(-1.0),
   *   Firestore.FieldValue.increment(-1),
   *   Firestore.FieldValue.increment(-0.0),
   *   Firestore.FieldValue.increment(-0),
   *   Firestore.FieldValue.increment(0),
   *   Firestore.FieldValue.increment(0.0),
   *   Firestore.FieldValue.increment(1),
   *   Firestore.FieldValue.increment(1.0)
   * ];
   *
   * let equal = 0;
   * for (let i = 0; i < fieldValues.length; ++i) {
   *   for (let j = i + 1; j < fieldValues.length; ++j) {
   *     if (fieldValues[i].isEqual(fieldValues[j])) {
   *       ++equal;
   *     }
   *   }
   * }
   * console.log(`Found ${equal} equalities.`);
   * ```
   */
  isEqual(other: firestore.FieldValue): boolean {
    return this === other;
  }
}

/**
 * An internal interface shared by all field transforms.
 *
 * A 'FieldTransform` subclass should implement '.includeInDocumentMask',
 * '.includeInDocumentTransform' and 'toProto' (if '.includeInDocumentTransform'
 * is 'true').
 *
 * @private
 * @internal
 * @abstract
 */
export abstract class FieldTransform extends FieldValue {
  /** Whether this FieldTransform should be included in the document mask. */
  abstract get includeInDocumentMask(): boolean;

  /**
   * Whether this FieldTransform should be included in the list of document
   * transforms.
   */
  abstract get includeInDocumentTransform(): boolean;

  /** The method name used to obtain the field transform. */
  abstract get methodName(): string;

  /**
   * Performs input validation on the values of this field transform.
   *
   * @param allowUndefined Whether to allow nested properties that are `undefined`.
   */
  abstract validate(allowUndefined: boolean): void;

  /***
   * The proto representation for this field transform.
   *
   * @param serializer The Firestore serializer.
   * @param fieldPath The field path to apply this transformation to.
   * @return The 'FieldTransform' proto message.
   */
  abstract toProto(
    serializer: Serializer,
    fieldPath: FieldPath
  ): api.DocumentTransform.IFieldTransform;
}

/**
 * A transform that deletes a field from a Firestore document.
 *
 * @private
 * @internal
 */
export class DeleteTransform extends FieldTransform {
  /**
   * Sentinel value for a field delete.
   * @private
   * @internal
   */
  static DELETE_SENTINEL = new DeleteTransform();

  private constructor() {
    super();
  }

  /**
   * Deletes are included in document masks.
   * @private
   * @internal
   */
  get includeInDocumentMask(): true {
    return true;
  }

  /**
   * Deletes are are omitted from document transforms.
   * @private
   * @internal
   */
  get includeInDocumentTransform(): false {
    return false;
  }

  get methodName(): string {
    return 'FieldValue.delete';
  }

  validate(): void {}

  toProto(): never {
    throw new Error(
      'FieldValue.delete() should not be included in a FieldTransform'
    );
  }
}

/**
 * A transform that sets a field to the Firestore server time.
 *
 * @private
 * @internal
 */
class ServerTimestampTransform extends FieldTransform {
  /**
   * Sentinel value for a server timestamp.
   *
   * @private
   * @internal
   */
  static SERVER_TIMESTAMP_SENTINEL = new ServerTimestampTransform();

  private constructor() {
    super();
  }

  /**
   * Server timestamps are omitted from document masks.
   *
   * @private
   * @internal
   */
  get includeInDocumentMask(): false {
    return false;
  }

  /**
   * Server timestamps are included in document transforms.
   *
   * @private
   * @internal
   */
  get includeInDocumentTransform(): true {
    return true;
  }

  get methodName(): string {
    return 'FieldValue.serverTimestamp';
  }

  validate(): void {}

  toProto(
    serializer: Serializer,
    fieldPath: FieldPath
  ): api.DocumentTransform.IFieldTransform {
    return {
      fieldPath: fieldPath.formattedName,
      setToServerValue: 'REQUEST_TIME',
    };
  }
}

/**
 * Increments a field value on the backend.
 *
 * @private
 * @internal
 */
class NumericIncrementTransform extends FieldTransform {
  constructor(private readonly operand: number) {
    super();
  }

  /**
   * Numeric transforms are omitted from document masks.
   *
   * @private
   * @internal
   */
  get includeInDocumentMask(): false {
    return false;
  }

  /**
   * Numeric transforms are included in document transforms.
   *
   * @private
   * @internal
   */
  get includeInDocumentTransform(): true {
    return true;
  }

  get methodName(): string {
    return 'FieldValue.increment';
  }

  validate(): void {
    validateNumber('FieldValue.increment()', this.operand);
  }

  toProto(
    serializer: Serializer,
    fieldPath: FieldPath
  ): api.DocumentTransform.IFieldTransform {
    const encodedOperand = serializer.encodeValue(this.operand)!;
    return {fieldPath: fieldPath.formattedName, increment: encodedOperand};
  }

  isEqual(other: firestore.FieldValue): boolean {
    return (
      this === other ||
      (other instanceof NumericIncrementTransform &&
        this.operand === other.operand)
    );
  }
}

/**
 * Transforms an array value via a union operation.
 *
 * @private
 * @internal
 */
class ArrayUnionTransform extends FieldTransform {
  constructor(private readonly elements: unknown[]) {
    super();
  }

  /**
   * Array transforms are omitted from document masks.
   * @private
   * @internal
   */
  get includeInDocumentMask(): false {
    return false;
  }

  /**
   * Array transforms are included in document transforms.
   * @private
   * @internal
   */
  get includeInDocumentTransform(): true {
    return true;
  }

  get methodName(): string {
    return 'FieldValue.arrayUnion';
  }

  validate(allowUndefined: boolean): void {
    for (let i = 0; i < this.elements.length; ++i) {
      validateArrayElement(i, this.elements[i], allowUndefined);
    }
  }

  toProto(
    serializer: Serializer,
    fieldPath: FieldPath
  ): api.DocumentTransform.IFieldTransform {
    const encodedElements = serializer.encodeValue(this.elements)!.arrayValue!;
    return {
      fieldPath: fieldPath.formattedName,
      appendMissingElements: encodedElements,
    };
  }

  isEqual(other: firestore.FieldValue): boolean {
    return (
      this === other ||
      (other instanceof ArrayUnionTransform &&
        deepEqual(this.elements, other.elements))
    );
  }
}

/**
 * Transforms an array value via a remove operation.
 *
 * @private
 * @internal
 */
class ArrayRemoveTransform extends FieldTransform {
  constructor(private readonly elements: unknown[]) {
    super();
  }

  /**
   * Array transforms are omitted from document masks.
   * @private
   * @internal
   */
  get includeInDocumentMask(): false {
    return false;
  }

  /**
   * Array transforms are included in document transforms.
   * @private
   * @internal
   */
  get includeInDocumentTransform(): true {
    return true;
  }

  get methodName(): string {
    return 'FieldValue.arrayRemove';
  }

  validate(allowUndefined: boolean): void {
    for (let i = 0; i < this.elements.length; ++i) {
      validateArrayElement(i, this.elements[i], allowUndefined);
    }
  }

  toProto(
    serializer: Serializer,
    fieldPath: FieldPath
  ): api.DocumentTransform.IFieldTransform {
    const encodedElements = serializer.encodeValue(this.elements)!.arrayValue!;
    return {
      fieldPath: fieldPath.formattedName,
      removeAllFromArray: encodedElements,
    };
  }

  isEqual(other: firestore.FieldValue): boolean {
    return (
      this === other ||
      (other instanceof ArrayRemoveTransform &&
        deepEqual(this.elements, other.elements))
    );
  }
}

/**
 * Validates that `value` can be used as an element inside of an array. Certain
 * field values (such as ServerTimestamps) are rejected. Nested arrays are also
 * rejected.
 *
 * @private
 * @internal
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The value to validate.
 * @param allowUndefined Whether to allow nested properties that are `undefined`.
 */
function validateArrayElement(
  arg: string | number,
  value: unknown,
  allowUndefined: boolean
): void {
  if (Array.isArray(value)) {
    throw new Error(
      `${invalidArgumentMessage(
        arg,
        'array element'
      )} Nested arrays are not supported.`
    );
  }
  validateUserInput(
    arg,
    value,
    'array element',
    /*path=*/ {allowDeletes: 'none', allowTransforms: false, allowUndefined},
    /*path=*/ undefined,
    /*level=*/ 0,
    /*inArray=*/ true
  );
}
