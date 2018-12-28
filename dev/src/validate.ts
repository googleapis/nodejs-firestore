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
