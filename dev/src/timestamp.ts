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


import {google} from '../protos/firestore_proto_api';
import {validateInteger} from './validate';

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
export class Timestamp {
  private readonly _seconds: number;
  private readonly _nanoseconds: number;

  /**
   * Creates a new timestamp with the current date, with millisecond precision.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({ updateTime:Firestore.Timestamp.now() });
   *
   * @return {Timestamp} A new `Timestamp` representing the current date.
   */
  static now() {
    return Timestamp.fromMillis(Date.now());
  }

  /**
   * Creates a new timestamp from the given date.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * let date = Date.parse('01 Jan 2000 00:00:00 GMT');
   * documentRef.set({ startTime:Firestore.Timestamp.fromDate(date) });
   *
   * @param {Date} date The date to initialize the `Timestamp` from.
   * @return {Timestamp} A new `Timestamp` representing the same point in time
   * as the given date.
   */
  static fromDate(date: Date) {
    return Timestamp.fromMillis(date.getTime());
  }

  /**
   * Creates a new timestamp from the given number of milliseconds.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({ startTime:Firestore.Timestamp.fromMillis(42) });
   *
   * @param {number} milliseconds Number of milliseconds since Unix epoch
   * 1970-01-01T00:00:00Z.
   * @return {Timestamp}  A new `Timestamp` representing the same point in time
   * as the given number of milliseconds.
   */
  static fromMillis(milliseconds: number) {
    const seconds = Math.floor(milliseconds / 1000);
    const nanos = (milliseconds - seconds * 1000) * MS_TO_NANOS;
    return new Timestamp(seconds, nanos);
  }

  /**
   * Generates a `Timestamp` object from a Timestamp proto.
   *
   * @private
   * @param {Object} timestamp The `Timestamp` Protobuf object.
   */
  static fromProto(timestamp: google.protobuf.ITimestamp) {
    return new Timestamp(
        Number(timestamp.seconds || 0), Number(timestamp.nanos || 0));
  }

  /**
   * Creates a new timestamp.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({ startTime:new Firestore.Timestamp(42, 0) });
   *
   * @param {number} seconds The number of seconds of UTC time since Unix epoch
   * 1970-01-01T00:00:00Z. Must be from 0001-01-01T00:00:00Z to
   * 9999-12-31T23:59:59Z inclusive.
   * @param {number} nanoseconds The non-negative fractions of a second at
   * nanosecond resolution. Negative second values with fractions must still
   * have non-negative nanoseconds values that count forward in time. Must be
   * from 0 to 999,999,999 inclusive.
   */
  constructor(seconds: number, nanoseconds: number) {
    validateInteger('seconds', seconds);
    validateInteger(
        'nanoseconds', nanoseconds, {minValue: 0, maxValue: 999999999});

    this._seconds = seconds;
    this._nanoseconds = nanoseconds;
  }

  /**
   * The number of seconds of UTC time since Unix epoch 1970-01-01T00:00:00Z.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(snap => {
   *   let updated = snap.updateTime;
   *   console.log(`Updated at ${updated.seconds}s ${updated.nanoseconds}ns`);
   * });
   *
   * @type {number}
   */
  get seconds() {
    return this._seconds;
  }

  /**
   * The non-negative fractions of a second at nanosecond resolution.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(snap => {
   *   let updated = snap.updateTime;
   *   console.log(`Updated at ${updated.seconds}s ${updated.nanoseconds}ns`);
   * });
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
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(snap => {
   *   console.log(`Document updated at: ${snap.updateTime.toDate()}`);
   * });
   *
   * @return {Date} JavaScript `Date` object representing the same point in time
   * as this `Timestamp`, with millisecond precision.
   */
  toDate() {
    return new Date(
        this._seconds * 1000 + Math.round(this._nanoseconds / MS_TO_NANOS));
  }

  /**
   * Returns the number of milliseconds since Unix epoch 1970-01-01T00:00:00Z.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(snap => {
   *   let startTime = snap.get('startTime');
   *   let endTime = snap.get('endTime');
   *   console.log(`Duration: ${endTime - startTime}`);
   * });
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
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(snap => {
   *   if (snap.createTime.isEqual(snap.updateTime)) {
   *     console.log('Document is in its initial state.');
   *   }
   * });
   *
   * @param {any} other The `Timestamp` to compare against.
   * @return {boolean} 'true' if this `Timestamp` is equal to the provided one.
   */
  isEqual(other: Timestamp): boolean {
    return (
        this === other ||
        (other instanceof Timestamp && this._seconds === other.seconds &&
         this._nanoseconds === other.nanoseconds));
  }

  /**
   * Generates the Protobuf `Timestamp` object for this timestamp.
   *
   * @private
   * @returns {Object} The `Timestamp` Protobuf object.
   */
  toProto() {
    const timestamp: google.protobuf.ITimestamp = {};

    if (this.seconds) {
      timestamp.seconds = this.seconds;
    }

    if (this.nanoseconds) {
      timestamp.nanos = this.nanoseconds;
    }

    return {timestampValue: timestamp};
  }
}
