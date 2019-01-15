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

import * as is from 'is';

import {FieldPath} from './path';
import {AnyDuringMigration} from './types';

/**
 * Formats the given word as plural conditionally given the preceding number.
 *
 * @private
 */
function formatPlural(num, str) {
  return `${num} ${str}` + (num === 1 ? '' : 's');
}

type Validators = {
  [k: string]: () => boolean
};

/**
 * Provides argument validation for the Firestore Public API. Exposes validators
 * for strings, integers, numbers, objects and functions by default and can be
 * extended to provide custom validators.
 *
 * The exported validation functions follow the naming convention is{Type} and
 * isOptional{Type}, such as "isString" and "isOptionalString".
 *
 * To register custom validators, invoke the constructor with with a mapping
 * from type names to validation functions. Validation functions return 'true'
 * for valid inputs and may throw errors with custom validation messages for
 * easier diagnosis.
 *
 * @private
 */
export class Validator {
  /**
   * Create a new Validator, optionally registering the custom validators as
   * provided.
   *
   * @param customValidators A list of custom validators to register.
   */
  constructor(customValidators?: Validators) {
    const validators = Object.assign(
        {
          function: is.function,
          integer: (value, min, max) => {
            min = is.defined(min) ? min : -Infinity;
            max = is.defined(max) ? max : Infinity;
            if (!is.integer(value)) {
              return false;
            }
            if (value < min || value > max) {
              throw new Error(`Value must be within [${min}, ${
                  max}] inclusive, but was: ${value}`);
            }
            return true;
          },
          number: (value, min, max) => {
            min = is.defined(min) ? min : -Infinity;
            max = is.defined(max) ? max : Infinity;
            if (!is.number(value) || is.nan(value)) {
              return false;
            }
            if (value < min || value > max) {
              throw new Error(`Value must be within [${min}, ${
                  max}] inclusive, but was: ${value}`);
            }
            return true;
          },
          object: is.object,
          string: is.string,
          boolean: is.boolean
        },
        customValidators);

    const register = type => {
      const camelCase = type.substring(0, 1).toUpperCase() + type.substring(1);
      this[`is${camelCase}`] = (argumentName, ...values) => {
        let valid = false;
        let message = is.number(argumentName) ?
            `Argument at index ${argumentName} is not a valid ${type}.` :
            `Argument "${argumentName}" is not a valid ${type}.`;

        try {
          // tslint:disable-next-line no-any
          valid = (validators[type] as any).call(null, ...values);
        } catch (err) {
          message += ` ${err.message}`;
        }

        if (valid !== true) {
          throw new Error(message);
        }
      };
      this[`isOptional${camelCase}`] = function(argumentName, value) {
        if (is.defined(value)) {
          this[`is${camelCase}`].apply(null, arguments);
        }
      };
    };

    for (const type in validators) {
      if (validators.hasOwnProperty(type)) {
        register(type);
      }
    }
  }

  /**
   * Verifies that 'args' has at least 'minSize' elements.
   *
   * @param {string} funcName The function name to use in the error message.
   * @param {Array.<*>} args The array (or array-like structure) to verify.
   * @param {number} minSize The minimum number of elements to enforce.
   * @throws if the expectation is not met.
   * @returns {boolean} 'true' when the minimum number of elements is available.
   * @private
   */
  minNumberOfArguments(funcName, args, minSize): boolean {
    if (args.length < minSize) {
      throw new Error(
          `Function "${funcName}()" requires at least ` +
          `${formatPlural(minSize, 'argument')}.`);
    }

    return true;
  }

  /**
   * Verifies that 'args' has at most 'maxSize' elements.
   *
   * @param {string} funcName The function name to use in the error message.
   * @param {Array.<*>} args The array (or array-like structure) to verify.
   * @param {number} maxSize The maximum number of elements to enforce.
   * @throws if the expectation is not met.
   * @returns {boolean} 'true' when only the maximum number of elements is
   * specified.
   * @private
   */
  maxNumberOfArguments(funcName, args, maxSize): boolean {
    if (args.length > maxSize) {
      throw new Error(
          `Function "${funcName}()" accepts at most ` +
          `${formatPlural(maxSize, 'argument')}.`);
    }

    return true;
  }
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
