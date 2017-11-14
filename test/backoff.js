/**
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

const assert = require('assert');

const Firestore = require('../src');
const backoff = require('../src/backoff')(Firestore);

const ExponentialBackoff = backoff.ExponentialBackoff;
const setTimeoutHandler = backoff.setTimeoutHandler;

const nop = () => {};

describe('ExponentialBackoff', function() {
  const observedDelays = [];

  before(() => {
    setTimeoutHandler((callback, timeout) => observedDelays.push(timeout));
  });

  beforeEach(() => {
    observedDelays.length = 0;
  });

  after(() => {
    setTimeoutHandler(setTimeout);
  });

  function assertDelayEquals(expected) {
    assert.equal(observedDelays.shift(), expected);
  }

  function assertDelayBetween(low, high) {
    let actual = observedDelays.shift();
    assert.ok(actual >= low);
    assert.ok(actual <= high);
  }

  it("doesn't delay first attempt", () => {
    const backoff = new ExponentialBackoff();
    backoff.backoffAndWait(nop);
    assertDelayEquals(0);
  });

  it('respects the initial retry delay', () => {
    const backoff = new ExponentialBackoff({
      initialDelayMs: 10,
      jitterFactor: 0,
    });
    backoff.backoffAndWait(nop);
    assertDelayEquals(0);
    backoff.backoffAndWait(nop);
    assertDelayEquals(10);
  });

  it('exponentially increases the delay', () => {
    const backoff = new ExponentialBackoff({
      initialDelayMs: 10,
      backoffFactor: 2,
      jitterFactor: 0,
    });
    backoff.backoffAndWait(nop);
    assertDelayEquals(0);
    backoff.backoffAndWait(nop);
    assertDelayEquals(10);
    backoff.backoffAndWait(nop);
    assertDelayEquals(20);
    backoff.backoffAndWait(nop);
    assertDelayEquals(40);
  });

  it('increases until maximum', () => {
    const backoff = new ExponentialBackoff({
      initialDelayMs: 10,
      backoffFactor: 2,
      maxDelayMs: 35,
      jitterFactor: 0,
    });
    backoff.backoffAndWait(nop);
    assertDelayEquals(0);
    backoff.backoffAndWait(nop);
    assertDelayEquals(10);
    backoff.backoffAndWait(nop);
    assertDelayEquals(20);
    backoff.backoffAndWait(nop);
    assertDelayEquals(35);
    backoff.backoffAndWait(nop);
    assertDelayEquals(35);
  });

  it('can reset delay', () => {
    const backoff = new ExponentialBackoff({
      initialDelayMs: 10,
      backoffFactor: 2,
      maxDelayMs: 35,
      jitterFactor: 0,
    });
    backoff.backoffAndWait(nop);
    assertDelayEquals(0);
    backoff.backoffAndWait(nop);
    assertDelayEquals(10);
    backoff.reset();
    backoff.backoffAndWait(nop);
    assertDelayEquals(0);
    backoff.backoffAndWait(nop);
    assertDelayEquals(10);
  });

  it('can reset delay to maximum', () => {
    const backoff = new ExponentialBackoff({
      initialDelayMs: 10,
      maxDelayMs: 35,
      jitterFactor: 0,
    });
    backoff.resetToMax();
    backoff.backoffAndWait(nop);
    assertDelayEquals(35);
  });

  it('applies jitter', () => {
    const backoff = new ExponentialBackoff({
      initialDelayMs: 10,
      backoffFactor: 2,
      jitterFactor: 0.1,
    });
    backoff.backoffAndWait(nop);
    assertDelayEquals(0);
    backoff.backoffAndWait(nop);
    assertDelayBetween(9, 11);
    backoff.backoffAndWait(nop);
    assertDelayBetween(18, 22);
    backoff.backoffAndWait(nop);
    assertDelayBetween(36, 44);
  });
});
