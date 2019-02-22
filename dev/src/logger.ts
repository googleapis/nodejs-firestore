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

import * as util from 'util';

import {validateFunction} from './validate';

/*! The Firestore library version */
let libVersion: string;

/*! The external function used to emit logs. */
let logFunction = (msg: string) => {};

/**
 * Log function to use for debug output. By default, we don't perform any
 * logging.
 *
 * @private
 */
export function logger(
    methodName: string, requestTag: string|null, logMessage: string,
    ...additionalArgs: Array<unknown>): void {
  requestTag = requestTag || '#####';

  const formattedMessage = util.format(logMessage, ...additionalArgs);
  const time = new Date().toISOString();
  logFunction(
      `Firestore (${libVersion}) ${time} ${requestTag} [${methodName}]: ` +
      formattedMessage);
}

/**
 * Sets the log function for all active Firestore instances.
 *
 * @private
 */
export function setLogFunction(logger: (msg: string) => void): void {
  validateFunction('logger', logger);
  logFunction = logger;
}

/**
 * Sets the log function for all active Firestore instances.
 *
 * @private
 */
export function setLibVersion(version: string): void {
  libVersion = version;
}
