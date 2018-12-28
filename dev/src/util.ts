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

import {FieldPath} from './path';
import {DocumentReference} from './reference';
import {isPlainObject} from './serializer';
import {AnyDuringMigration, ReadOptions} from './types';

/**
 * Generate a unique client-side identifier.
 *
 * Used for the creation of new documents.
 *
 * @private
 * @returns {string} A unique 20-character wide identifier.
 */
export function autoId(): string {
  const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}

/**
 * Generate a short and semi-random client-side identifier.
 *
 * Used for the creation of request tags.
 *
 * @private
 * @returns {string} A random 5-character wide identifier.
 */
export function requestTag(): string {
  return autoId().substr(0, 5);
}

/**
 * Determines whether `val` is a JavaScript object.
 *
 * @private
 */
export function isObject(val: unknown): val is object {
  return Object.prototype.toString.call(val) === '[object Object]';
}


/**
 * Returns whether `val` has no custom properties.
 *
 * @private
 */
export function isEmpty(val: {}): boolean {
  return Object.keys(val).length === 0;
}

/**
 * Determines whether `val` is a JavaScript function.
 *
 * @private
 */
export function isFunction(val: unknown): boolean {
  return val && {}.toString.call(val) === '[object Function]';
}
