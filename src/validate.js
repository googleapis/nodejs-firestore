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

/**
 * Formats the given word as plural conditionally given the preceding number.
 *
 * @private
 */
function formatPlural(num, str) {
  return `${num} ${str}` + (num === 1 ? '' : 's');
}

/**
 * Provides argument validation for the Firestore Public API. Exposes validators
 * for strings, integers, numbers, objects and functions by default and can be
 * extended to provide custom validators.
 *
 * The exported validation functions follow the naming convention is{Type} and
 * isOptional{Type}, such as "isString" and "isOptionalString".
 *
 * To register custom validators, provide an object with a mapping from a type
 * name to a validation function. Validation functions return 'true' for valid
 * inputs and may throw errors with custom validation messages for easier
 * diagnosis.
 *
 * @param {Object.<string, function>} validators Mapping from types to
 * validator validators.
 * @returns {Object.<string, function>} Map with validators following the naming
 * convention is{Type} and isOptional{Type}.
 */
module.exports = validators => {
  validators = Object.assign(
    {
      function: is.function,
      integer: (value, min, max) => {
        min = is.defined(min) ? min : -Infinity;
        max = is.defined(max) ? max : Infinity;
        return is.integer(value) && value >= min && value <= max;
      },
      number: (value, min, max) => {
        min = is.defined(min) ? min : -Infinity;
        max = is.defined(max) ? max : Infinity;
        return is.number(value) && value >= min && value <= max;
      },
      object: is.object,
      string: is.string,
    },
    validators
  );

  let exports = {};

  let register = type => {
    let camelCase = type.substring(0, 1).toUpperCase() + type.substring(1);
    exports[`is${camelCase}`] = function(argumentName, value) {
      let valid = false;
      let message = is.number(argumentName)
        ? `Argument at index ${argumentName} is not a valid ${type}.`
        : `Argument "${argumentName}" is not a valid ${type}.`;

      try {
        value = [].slice.call(arguments, 1);
        valid = validators[type].apply(null, value);
      } catch (err) {
        message += ` ${err.message}`;
      }

      if (valid !== true) {
        throw new Error(message);
      }
    };
    exports[`isOptional${camelCase}`] = function(argumentName, value) {
      if (is.defined(value)) {
        exports[`is${camelCase}`].apply(null, arguments);
      }
    };
  };

  for (let type in validators) {
    if (validators.hasOwnProperty(type)) {
      register(type);
    }
  }

  /**
   * Verifies that 'args' has at least 'minSize' elements.
   *
   * @param {string} funcName - The function name to use in the error message.
   * @param {Array.<*>} args - The array (or array-like structure) to verify.
   * @param {number} minSize - The minimum number of elements to enforce.
   * @throws if the expectation is not met.
   * @returns {boolean} 'true' when the minimum number of elements is available.
   */
  exports.minNumberOfArguments = (funcName, args, minSize) => {
    if (args.length < minSize) {
      throw new Error(
        `Function '${funcName}()' requires at least ` +
          `${formatPlural(minSize, 'argument')}.`
      );
    }

    return true;
  };

  /**
   * Verifies that 'args' has at most 'maxSize' elements.
   *
   * @param {string} funcName - The function name to use in the error message.
   * @param {Array.<*>} args - The array (or array-like structure) to verify.
   * @param {number} maxSize - The maximum number of elements to enforce.
   * @throws if the expectation is not met.
   * @returns {boolean} 'true' when only the maximum number of elements is
   * specified.
   */
  exports.maxNumberOfArguments = (funcName, args, maxSize) => {
    if (args.length > maxSize) {
      throw new Error(
        `Function '${funcName}()' accepts at most ` +
          `${formatPlural(maxSize, 'argument')}.`
      );
    }

    return true;
  };

  exports.customObjectError = val => {
    let typeName = is.object(val) ? val.constructor.name : typeof val;

    switch (typeName) {
      case 'DocumentReference':
      case 'FieldPath':
      case 'FieldValue':
      case 'GeoPoint':
        return new Error(
          `Detected an object of type "${typeName}" that doesn't match the expected instance. Please ensure that ` +
            'the Firestore types you are using are from the same NPM package.'
        );
      default:
        return new Error(
          `Cannot use custom type "${typeName}" as a Firestore type.`
        );
    }
  };

  return exports;
};
