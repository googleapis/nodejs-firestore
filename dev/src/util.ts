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

// Untyped Number alias we can use to check for ES6 methods / properties.
// tslint:disable-next-line:no-any variable-name
const NumberAsAny = Number as any;

/**
 * Minimum safe integer in Javascript because of floating point precision.
 * Added to not rely on ES6 features.
 */
export let MIN_SAFE_INTEGER: number =
  NumberAsAny.MIN_SAFE_INTEGER || -(Math.pow(2, 53) - 1);

/**
 * Maximum safe integer in Javascript because of floating point precision.
 * Added to not rely on ES6 features.
 */
export let MAX_SAFE_INTEGER: number =
  NumberAsAny.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

/** A Promise implementation that supports deferred resolution. */
export class Deferred<R> {
  promise: Promise<R>;
  resolve: (value?: R | Promise<R>) => void = () => {};
  reject: (reason?: Error) => void = () => {};

  constructor() {
    this.promise = new Promise(
      (
        resolve: (value?: R | Promise<R>) => void,
        reject: (reason?: Error) => void
      ) => {
        this.resolve = resolve;
        this.reject = reject;
      }
    );
  }
}

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
 * Determines whether `value` is a JavaScript object.
 *
 * @private
 */
export function isObject(value: unknown): value is {[k: string]: unknown} {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Returns whether `value` has no custom properties.
 *
 * @private
 */
export function isEmpty(value: {}): boolean {
  return Object.keys(value).length === 0;
}

/**
 * Determines whether `value` is a JavaScript function.
 *
 * @private
 */
export function isFunction(value: unknown): boolean {
  return typeof value === 'function';
}

/**
 * Returns whether an number is an integer, uses native implementation if
 * available.
 * Added to not rely on ES6 features.
 * @param value The value to test for being an integer
 */
export let isInteger: (value: unknown) => boolean =
  NumberAsAny.isInteger ||
  (value =>
    typeof value === 'number' &&
    isFinite(value) &&
    Math.floor(value) === value);

/**
 * Returns whether a value is an integer and in the safe integer range
 * @param value The value to test for being an integer and in the safe range
 */
export function isSafeInteger(value: unknown): boolean {
  return (
    isInteger(value) &&
    (value as number) <= MAX_SAFE_INTEGER &&
    (value as number) >= MIN_SAFE_INTEGER
  );
}
