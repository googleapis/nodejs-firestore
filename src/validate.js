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

/*!
 * @module firestore/validate
 */

'use strict';

let is = require('is');

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
 * @package
 * @param {Object.<string, function>} validators Mapping from types to
 * validator validators.
 * @return {Object.<string, function>} Map with validators following the naming
 * convention is{Type} and isOptional{Type}.
 */
module.exports = (validators) => {
  validators = Object.assign({
    function: is.function,
    integer:  (value, min, max) => {
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
  }, validators);

  let exports = {};

  let register = (type) => {
    let camelCase = type.substring(0,1).toUpperCase() + type.substring(1);
    exports[`is${camelCase}`] = function(argumentName, value) {
      let valid = false;
      let message = is.number(argumentName) ?
          `Argument at index ${argumentName} is not a valid ${type}.` :
          `Argument "${argumentName}" is not a valid ${type}.`;

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

  return exports;
};
