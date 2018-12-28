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

import {FieldPath} from './path';
import {isFunction, isObject} from './util';

/**
 * Options to allow argument omission.
 *
 * @private
 */
export interface AllowOptional {
  optional?: boolean;
}

/**
 * Options to limit the range of numbers.
 *
 * @private
 */
export interface AllowRange {
  minValue?: number;
  maxValue?: number;
}

export function customObjectError(val, path?: FieldPath): Error {
  const fieldPathMessage = path ? ` (found in field ${path.toString()})` : '';

  if (is.object(val) && val.constructor.name !== 'Object') {
    const typeName = val.constructor.name;
    switch (typeName) {
      case 'DocumentReference':
      case 'FieldPath':
      case 'FieldValue':
      case 'GeoPoint':
      case 'Timestamp':
        return new Error(
            `Detected an object of type "${typeName}" that doesn't match the ` +
            `expected instance${fieldPathMessage}. Please ensure that the ` +
            'Firestore types you are using are from the same NPM package.');
      default:
        return new Error(
            `Couldn't serialize object of type "${typeName}"${
                fieldPathMessage}. Firestore doesn't support JavaScript ` +
            'objects with custom prototypes (i.e. objects that were created ' +
            'via the "new" operator).');
    }
  } else if (!is.object(val)) {
    throw new Error(
        `Input is not a plain JavaScript object${fieldPathMessage}.`);
  } else {
    return new Error(`Invalid use of type "${
        typeof val}" as a Firestore argument${fieldPathMessage}.`);
  }
}

/**
 * Validates that 'value' is a function.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The input to validate.
 * @param options Options that specify whether the function can be omitted.
 */
export function validateFunction(
    arg: string|number, value: unknown, options?: AllowOptional): void {
  if (!validateOptional(value, options)) {
    if (!isFunction(value)) {
      throw new Error(invalidArgumentMessage(arg, 'function'));
    }
  }
}

/**
 * Validates that 'value' is an object.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The input to validate.
 * @param options Options that specify whether the object can be omitted.
 */
export function validateObject(
    arg: string|number, value: unknown, options?: AllowOptional): void {
  if (!validateOptional(value, options)) {
    if (!isObject(value)) {
      throw new Error(invalidArgumentMessage(arg, 'object'));
    }
  }
}

/**
 * Validates that 'value' is a string.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The input to validate.
 * @param options Options that specify whether the string can be omitted.
 */
export function validateString(
    arg: string|number, value: unknown, options?: AllowOptional): void {
  if (!validateOptional(value, options)) {
    if (typeof value !== 'string') {
      throw new Error(invalidArgumentMessage(arg, 'string'));
    }
  }
}

/**
 * Validates that 'value' is a boolean.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The input to validate.
 * @param options Options that specify whether the boolean can be omitted.
 */
export function validateBoolean(
    arg: string|number, value: unknown, options?: AllowOptional): void {
  if (!validateOptional(value, options)) {
    if (typeof value !== 'boolean') {
      throw new Error(invalidArgumentMessage(arg, 'boolean'));
    }
  }
}

/**
 * Validates that 'value' is a number.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The input to validate.
 * @param options Options that specify whether the number can be omitted.
 */
export function validateNumber(
    arg: string|number, value: unknown,
    options?: AllowOptional&AllowRange): void {
  const min = options !== undefined && options.minValue !== undefined ?
      options.minValue :
      -Infinity;
  const max = options !== undefined && options.maxValue !== undefined ?
      options.maxValue :
      Infinity;

  if (!validateOptional(value, options)) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(invalidArgumentMessage(arg, 'number'));
    } else if (value < min || value > max) {
      throw new Error(
          `Value for argument ${formatArgumentName(arg)} must be within [${
              min}, ${max}] inclusive, but was: ${value}`);
    }
  }
}

/**
 * Validates that 'value' is a integer.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The input to validate.
 * @param options Options that specify whether the integer can be omitted.
 */
export function validateInteger(
    arg: string|number, value: unknown,
    options?: AllowOptional&AllowRange): void {
  const min = options !== undefined && options.minValue !== undefined ?
      options.minValue :
      -Infinity;
  const max = options !== undefined && options.maxValue !== undefined ?
      options.maxValue :
      Infinity;

  if (!validateOptional(value, options)) {
    if (typeof value !== 'number' || isNaN(value) || value % 1 !== 0) {
      throw new Error(invalidArgumentMessage(arg, 'integer'));
    } else if (value < min || value > max) {
      throw new Error(
          `Value for argument ${formatArgumentName(arg)} must be within [${
              min}, ${max}] inclusive, but was: ${value}`);
    }
  }
}


/**
 * Generates an error message to use with invalid arguments
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param expectedType The expected input type.
 */
export function invalidArgumentMessage(
    arg: string|number, expectedType: string) {
  return `Argument ${formatArgumentName(arg)} is not a valid ${expectedType}.`;
}

/**
 * Enforces the 'options.optional' constraint for 'value'.
 *
 * @private
 * @param value The input to validate.
 * @param options Whether the function can be omitted.
 * @return Whether the object is omitted and is allowed to be omitted.
 */
export function validateOptional(
    value: unknown, options?: AllowOptional): boolean {
  return value === undefined && options !== undefined &&
      options.optional === true;
}

/**
 * Formats the given word as plural conditionally given the preceding number.
 *
 * @private
 * @param num The number to use for formatting.
 * @param str The string to format.
 */
function formatPlural(num: number, str: string) {
  return `${num} ${str}` + (num === 1 ? '' : 's');
}

/**
 * Creates a descriptive name for the provided argument name or index.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @return Either the argument name or its index description.
 */
function formatArgumentName(arg: string|number) {
  return typeof arg === 'string' ? `"${arg}"` : `at index ${arg}`;
}

/**
 * Create a new Validator, optionally registering the custom validators as
 * provided.
 *
 * @private
 * @param customValidators A list of custom validators to register.
 */
export function createValidator(customValidators?: Validators):
    AnyDuringMigration {
  // This function exists to change the type of `Validator` to `any` so that
  // consumers can call the custom validator functions.
  return new Validator(customValidators);
}

/**
 * Verifies that 'args' has at least 'minSize' elements.
 *
 * @private
 * @param funcName The function name to use in the error message.
 * @param args The array (or array-like structure) to verify.
 * @param minSize The minimum number of elements to enforce.
 * @throws if the expectation is not met.
 */
export function validateMinNumberOfArguments(
    funcName: string, args: IArguments, minSize: number): void {
  if (args.length < minSize) {
    throw new Error(
        `Function "${funcName}()" requires at least ` +
        `${formatPlural(minSize, 'argument')}.`);
  }
}

/**
 * Verifies that 'args' has at most 'maxSize' elements.
 *
 * @private
 * @param funcName The function name to use in the error message.
 * @param args The array (or array-like structure) to verify.
 * @param maxSize The maximum number of elements to enforce.
 * @throws if the expectation is not met.
 */
export function validateMaxNumberOfArguments(
    funcName: string, args: IArguments, maxSize: number): void {
  if (args.length > maxSize) {
    throw new Error(
        `Function "${funcName}()" accepts at most ` +
        `${formatPlural(maxSize, 'argument')}.`);
  }
}
