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

'use strict';

const is = require('is');
const validate = require('./validate')();

/*!
 * Number of nanoseconds in a millisecond.
 *
 * @type {number}
 */
const MS_TO_NANOS = 1000000;

/**
 * A Timestamp represents a point in time independent of any time zone or
 * calendar, represented as seconds and fractions of seconds at nanosecond
 * resolution in UTC Epoch time. It is encoded using the Proleptic Gregorian
 * Calendar which extends the Gregorian calendar backwards to year one. It is
 * encoded assuming all minutes are 60 seconds long, i.e. leap seconds are
 * "smeared" so that no leap second table is needed for interpretation. Range is
 * from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z.
 *
 * @see https://github.com/google/protobuf/blob/master/src/google/protobuf/timestamp.proto
 */
class Timestamp {
  /**
   * Creates a new timestamp with the current date, with millisecond precision.
   *
   * @return {Timestamp} A new `Timestamp` representing the current date.
   */
  static now() {
    return Timestamp.fromMillis(Date.now());
  }

  /**
   * Creates a new timestamp from the given date.
   *
   * @param {Date} date The date to initialize the `Timestamp` from.
   * @return {Timestamp} A new `Timestamp` representing the same point in time
   * as the given date.
   */
  static fromDate(date) {
    return Timestamp.fromMillis(date.getTime());
  }

  /**
   * Creates a new timestamp from the given number of milliseconds.
   *
   * @param {number} milliseconds Number of milliseconds since Unix epoch
   * 1970-01-01T00:00:00Z.
   * @return {Timestamp}  A new `Timestamp` representing the same point in time
   * as the given number of milliseconds.
   */
  static fromMillis(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const nanos = (milliseconds - seconds * 1000) * MS_TO_NANOS;
    return new Timestamp(seconds, nanos);
  }

  /**
   * Creates a new timestamp.
   *
   * @param {number} seconds The number of seconds of UTC time since Unix epoch
   * 1970-01-01T00:00:00Z. Must be from 0001-01-01T00:00:00Z to
   * 9999-12-31T23:59:59Z inclusive.
   * @param {number} nanoseconds The non-negative fractions of a second at
   * nanosecond resolution. Negative second values with fractions must still
   * have non-negative nanoseconds values that count forward in time. Must be
   * from 0 to 999,999,999 inclusive.
   */
  constructor(seconds, nanoseconds) {
    validate.isInteger('seconds', seconds);
    validate.isInteger('nanoseconds', nanoseconds, 0, 999999999);

    this._seconds = seconds;
    this._nanoseconds = nanoseconds;
  }

  /**
   * The number of seconds of UTC time since Unix epoch 1970-01-01T00:00:00Z.
   *
   * @type {number}
   */
  get seconds() {
    return this._seconds;
  }

  /**
   * The non-negative fractions of a second at nanosecond resolution.
   *
   * @type {number}
   */
  get nanoseconds() {
    return this._nanoseconds;
  }

  /**
   * Returns a new `Date` corresponding to this timestamp. This may lose
   * precision.
   *
   * @return {Date} JavaScript `Date` object representing the same point in time
   * as this `Timestamp`, with millisecond precision.
   */
  toDate() {
    return new Date(
      this._seconds * 1000 + Math.round(this._nanoseconds / MS_TO_NANOS)
    );
  }

  /**
   * Returns the number of milliseconds since Unix epoch 1970-01-01T00:00:00Z.
   *
   * @return {number} The point in time corresponding to this timestamp,
   * represented as the number of milliseconds since Unix epoch
   * 1970-01-01T00:00:00Z.
   */
  toMillis() {
    return this._seconds * 1000 + Math.floor(this._nanoseconds / MS_TO_NANOS);
  }

  /**
   * Returns 'true' if this `Timestamp` is equal to the provided one.
   *
   * @param {any} other The `Timestamp` to compare against.
   * @return {boolean} 'true' if this `Timestamp` is equal to the provided one.
   */
  isEqual(other) {
    return (
      this === other ||
      (is.instanceof(other, Timestamp) &&
        this._seconds === other.seconds &&
        this._nanoseconds === other.nanoseconds)
    );
  }
}

module.exports = Timestamp;
