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

import {DocumentData} from '@google-cloud/firestore';

import {randomBytes} from 'crypto';
import {
  CallSettings,
  ClientConfig,
  constructSettings,
  createDefaultBackoffSettings,
  GoogleError,
  Status,
} from 'google-gax';
import {BackoffSettings} from 'google-gax/build/src/gax';
import * as gapicConfig from './v1/firestore_client_config.json';

const serviceConfig = constructSettings(
  'google.firestore.v1.Firestore',
  gapicConfig as ClientConfig,
  {},
  Status
) as {[k: string]: CallSettings};

/**
 * A Promise implementation that supports deferred resolution.
 * @private
 */
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
  while (autoId.length < 20) {
    const bytes = randomBytes(40);
    bytes.forEach(b => {
      // Length of `chars` is 62. We only take bytes between 0 and 62*4-1
      // (both inclusive). The value is then evenly mapped to indices of `char`
      // via a modulo operation.
      const maxValue = 62 * 4 - 1;
      if (autoId.length < 20 && b <= maxValue) {
        autoId += chars.charAt(b % 62);
      }
    });
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
      Object.getPrototypeOf(input) === null ||
      input.constructor.name === 'Object')
  );
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
 * Determines whether the provided error is considered permanent for the given
 * RPC.
 *
 * @private
 */
export function isPermanentRpcError(
  err: GoogleError,
  methodName: string
): boolean {
  console.log('BCHEN retry code: ', err.code);
  if (err.code !== undefined) {
    const retryCodes = getRetryCodes(methodName);
    console.log('retry codes:', getRetryCodes(methodName));
    return retryCodes.indexOf(err.code) === -1;
  } else {
    return false;
  }
}

/**
 * Returns the list of retryable error codes specified in the service
 * configuration.
 * @private
 */
export function getRetryCodes(methodName: string): number[] {
  return serviceConfig[methodName]?.retry?.retryCodes ?? [];
}

/**
 * Returns the backoff setting from the service configuration.
 * @private
 */
export function getRetryParams(methodName: string): BackoffSettings {
  return (
    serviceConfig[methodName]?.retry?.backoffSettings ??
    createDefaultBackoffSettings()
  );
}

/**
 * Returns a promise with a void return type. The returned promise swallows all
 * errors and never throws.
 *
 * This is primarily used to wait for a promise to complete when the result of
 * the promise will be discarded.
 *
 * @private
 */
export function silencePromise(promise: Promise<unknown>): Promise<void> {
  return promise.then(
    () => {},
    () => {}
  );
}

/**
 * Wraps the provided error in a new error that includes the provided stack.
 *
 * Used to preserve stack traces across async calls.
 * @private
 */
export function wrapError(err: Error, stack: string): Error {
  err.stack += '\nCaused by: ' + stack;
  return err;
}
