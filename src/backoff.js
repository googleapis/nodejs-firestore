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

/*!
 * Injected.
 *
 * @see Firestore
 */
let Firestore;

/*
 * @module firestore/backoff
 * @private
 *
 * Contains backoff logic to facilitate RPC error handling. This class derives
 * its implementation from the Firestore Mobile Web Client.
 *
 * @see https://github.com/firebase/firebase-js-sdk/blob/master/packages/firestore/src/remote/backoff.ts
 */

/*!
 * The default initial backoff time in milliseconds after an error.
 * Set to 1s according to https://cloud.google.com/apis/design/errors.
 */
const DEFAULT_BACKOFF_INITIAL_DELAY_MS = 1000;

/*!
 * The default maximum backoff time in milliseconds.
 */
const DEFAULT_BACKOFF_MAX_DELAY_MS = 60 * 1000;

/*!
 * The default factor to increase the backup by after each failed attempt.
 */
const DEFAULT_BACKOFF_FACTOR = 1.5;

/*!
 * The default jitter to distribute the backoff attempts by (0 means no
 * randomization, 1.0 means +/-50% randomization).
 */
const DEFAULT_JITTER_FACTOR = 1.0;

/*!
 * The timeout handler used by `ExponentialBackoff`.
 */
let delayExecution = setTimeout;

/**
 * Allows overriding of the timeout handler used by the exponential backoff
 * implementation. If not invoked, we default to `setTimeout()`.
 *
 * Used only in testing.
 *
 * @private
 * @param {function} handler A handler than matches the API of `setTimeout()`.
 */
function setTimeoutHandler(handler) {
  delayExecution = handler;
}

/**
 * A helper for running delayed tasks following an exponential backoff curve
 * between attempts.
 *
 * Each delay is made up of a "base" delay which follows the exponential
 * backoff curve, and a "jitter" (+/- 50% by default)  that is calculated and
 * added to the base delay. This prevents clients from accidentally
 * synchronizing their delays causing spikes of load to the backend.
 *
 * @private
 */
class ExponentialBackoff {
  /**
   * @param {number=} options.initialDelayMs Optional override for the initial
   * retry delay.
   * @param {number=} options.backoffFactor Optional override for the
   * exponential backoff factor.
   * @param {number=} options.maxDelayMs Optional override for the maximum
   * retry delay.
   * @param {number=} options.jitterFactor Optional override to control the
   * jitter factor by which to randomize attempts (0 means no randomization,
   * 1.0 means +/-50% randomization). It is suggested not to exceed this range.
   */
  constructor(options) {
    options = options || {};

    /**
     * The initial delay (used as the base delay on the first retry attempt).
     * Note that jitter will still be applied, so the actual delay could be as
     * little as 0.5*initialDelayMs (based on a jitter factor of 1.0).
     *
     * @type {number}
     * @private
     */
    this._initialDelayMs =
      options.initialDelayMs !== undefined
        ? options.initialDelayMs
        : DEFAULT_BACKOFF_INITIAL_DELAY_MS;

    /**
     * The multiplier to use to determine the extended base delay after each
     * attempt.
     * @type {number}
     * @private
     */
    this._backoffFactor =
      options.backoffFactor !== undefined
        ? options.backoffFactor
        : DEFAULT_BACKOFF_FACTOR;

    /**
     * The maximum base delay after which no further backoff is performed.
     * Note that jitter will still be applied, so the actual delay could be as
     * much as 1.5*maxDelayMs (based on a jitter factor of 1.0).
     *
     * @type {number}
     * @private
     */
    this._maxDelayMs =
      options.maxDelayMs !== undefined
        ? options.maxDelayMs
        : DEFAULT_BACKOFF_MAX_DELAY_MS;

    /**
     * The jitter factor that controls the random distribution of the backoff
     * points.
     *
     * @type {number}
     * @private
     */
    this._jitterFactor =
      options.jitterFactor !== undefined
        ? options.jitterFactor
        : DEFAULT_JITTER_FACTOR;

    /**
     * The backoff delay of the current attempt.
     * @type {number}
     * @private
     */
    this._currentBaseMs = 0;
  }

  /**
   * Resets the backoff delay.
   *
   * The very next backoffAndWait() will have no delay. If it is called again
   * (i.e. due to an error), initialDelayMs (plus jitter) will be used, and
   * subsequent ones will increase according to the backoffFactor.
   *
   * @private
   */
  reset() {
    this._currentBaseMs = 0;
  }

  /**
   * Resets the backoff delay to the maximum delay (e.g. for use after a
   * RESOURCE_EXHAUSTED error).
   *
   * @private
   */
  resetToMax() {
    this._currentBaseMs = this._maxDelayMs;
  }

  /**
   * Returns a promise that resolves after currentDelayMs, and increases the
   * delay for any subsequent attempts.
   *
   * @private
   * @return {Promise.<void>} A Promise that resolves when the current delay
   * elapsed.
   */
  backoffAndWait() {
    // First schedule using the current base (which may be 0 and should be
    // honored as such).
    const delayWithJitterMs = this._currentBaseMs + this._jitterDelayMs();
    if (this._currentBaseMs > 0) {
      Firestore.log(
        'ExponentialBackoff.backoffAndWait',
        `Backing off for ${delayWithJitterMs} ms ` +
          `(base delay: ${this._currentBaseMs} ms)`
      );
    }

    // Apply backoff factor to determine next delay and ensure it is within
    // bounds.
    this._currentBaseMs *= this._backoffFactor;
    if (this._currentBaseMs < this._initialDelayMs) {
      this._currentBaseMs = this._initialDelayMs;
    }
    if (this._currentBaseMs > this._maxDelayMs) {
      this._currentBaseMs = this._maxDelayMs;
    }

    return new Promise(resolve => {
      delayExecution(resolve, delayWithJitterMs);
    });
  }

  /**
   * Returns a randomized "jitter" delay based on the current base and jitter
   * factor.
   *
   * @private
   * @returns {number} The jitter to apply based on the current delay.
   */
  _jitterDelayMs() {
    return (Math.random() - 0.5) * this._jitterFactor * this._currentBaseMs;
  }
}

module.exports = FirestoreType => {
  Firestore = FirestoreType;
  return {
    ExponentialBackoff,
    setTimeoutHandler,
  };
};
