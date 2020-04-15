/*!
 * Copyright 2020 Google LLC
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
import * as assert from 'assert';

import {Timestamp} from './timestamp';

/**
 * A helper that uses the Token Bucket algorithm to rate limit the number of
 * operations that can be made in a second.
 *
 * Before a given request containing a number of operations can proceed,
 * RateLimiter determines doing so stays under the provided rate limits. It can
 * also determine how much time is required before a request can be made.
 *
 * RateLimiter can also implement a gradually increasing rate limit. This is
 * used to enforce the 500/50/5 rule
 * (https://cloud.google.com/datastore/docs/best-practices#ramping_up_traffic).
 *
 * @private
 */
export class RateLimiter {
  // Number of tokens available. Each operation consumes one token.
  availableTokens: number;

  // When the token bucket was last refilled.
  lastRefillTime = Timestamp.now();

  /**
   * @param initialCapacity Initial maximum number of operations per second.
   * @param multiplier Rate by which to increase the capacity.
   * @param multiplierMillis How often the capacity should increase in
   * milliseconds.
   * @param startTime Used for testing the limiter.
   */
  constructor(
    private readonly initialCapacity: number,
    private readonly multiplier: number,
    private readonly multiplierMillis: number,
    private readonly startTime = Timestamp.now()
  ) {
    this.availableTokens = initialCapacity;
    this.lastRefillTime = startTime;
  }

  /**
   * Tries to make the number of operations. Returns true if the request succeeded
   * and false otherwise.
   *
   * @param currentTime Used for testing the limiter.
   * @private
   */
  tryMakeRequest(numOperations: number) {
    return this._tryMakeRequest(numOperations, Timestamp.now());
  }

  /**
   * Used in testing for different timestamps.
   *
   * @private
   */
  // Visible for testing.
  _tryMakeRequest(numOperations: number, currentTime: Timestamp): boolean {
    this.refillTokens(currentTime);
    if (numOperations <= this.availableTokens) {
      this.availableTokens -= numOperations;
      return true;
    }
    return false;
  }

  /**
   * Returns the number of ms needed to make a request with the provided number
   * of operations. Returns 0 if the request can be made with the existing
   * capacity. Returns -1 if the request is not possible with the current
   * capacity.
   *
   * @private
   */
  getNextRequestDelayMs(numOperations: number) {
    return this._getNextRequestDelayMs(numOperations, Timestamp.now());
  }

  /**
   * Used in testing for different timestamps.
   *
   * @private
   */
  // Visible for testing.
  _getNextRequestDelayMs(
    numOperations: number,
    currentTime: Timestamp
  ): number {
    if (numOperations < this.availableTokens) {
      return 0;
    }

    const capacity = this.calculateCapacity(currentTime, this.startTime);
    if (capacity < numOperations) {
      return -1;
    }

    const requiredTokens = numOperations - this.availableTokens;
    return Math.ceil((requiredTokens * 1000) / capacity);
  }

  /**
   * Refills the number of available tokens based on how much time has elapsed
   * since the last time the tokens were refilled.
   *
   * @private
   */
  private refillTokens(currentTime = Timestamp.now()): void {
    if (currentTime.toMillis() > this.lastRefillTime.toMillis()) {
      const elapsedTime =
        currentTime.toMillis() - this.lastRefillTime.toMillis();
      const capacity = this.calculateCapacity(currentTime, this.startTime);
      const tokensToAdd = Math.floor((elapsedTime * capacity) / 1000);
      if (tokensToAdd > 0) {
        this.availableTokens = Math.min(
          capacity,
          this.availableTokens + tokensToAdd
        );
        this.lastRefillTime = currentTime;
      }
    }
  }

  /**
   * Calculates the maximum capacity based on the two provided timestamps.
   *
   * @private
   */
  // Visible for testing.
  calculateCapacity(currentTime: Timestamp, startTime: Timestamp): number {
    assert(
      currentTime.valueOf() >= startTime.valueOf(),
      'startTime cannot be after currentTime'
    );
    const millisElapsed = currentTime.toMillis() - startTime.toMillis();
    const operationsPerSecond = Math.floor(
      Math.pow(
        this.multiplier,
        Math.floor(millisElapsed / this.multiplierMillis)
      ) * this.initialCapacity
    );
    return operationsPerSecond;
  }
}
