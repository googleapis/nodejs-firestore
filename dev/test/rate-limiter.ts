// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {expect} from 'chai';

import {Timestamp} from '../src';
import {RateLimiter} from '../src/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(500, 1.5, 5 * 60 * 1000, new Timestamp(0, 0));
  });

  it('accepts and rejects requests based on capacity', () => {
    expect(limiter._tryMakeRequest(250, new Timestamp(0, 0))).to.be.true;
    expect(limiter._tryMakeRequest(250, new Timestamp(0, 0))).to.be.true;

    // Once tokens have been used, further requests should fail.
    expect(limiter._tryMakeRequest(1, new Timestamp(0, 0))).to.be.false;

    // Tokens will only refill up to max capacity.
    expect(limiter._tryMakeRequest(501, new Timestamp(1, 0))).to.be.false;
    expect(limiter._tryMakeRequest(500, new Timestamp(1, 0))).to.be.true;

    // Tokens will refill incrementally based on the number of ms elapsed.
    expect(limiter._tryMakeRequest(251, new Timestamp(1, 500 * 1e6))).to.be
      .false;
    expect(limiter._tryMakeRequest(250, new Timestamp(1, 500 * 1e6))).to.be
      .true;

    // Scales with multiplier.
    expect(limiter._tryMakeRequest(751, new Timestamp(5 * 60 - 1, 0))).to.be
      .false;
    expect(limiter._tryMakeRequest(751, new Timestamp(5 * 60, 0))).to.be.false;
    expect(limiter._tryMakeRequest(750, new Timestamp(5 * 60, 0))).to.be.true;
  });

  it('calculates the number of ms needed to place the next request', () => {
    // Should return 0 if there are enough tokens for the request to be made.
    let timestamp = new Timestamp(0, 0);
    expect(limiter._getNextRequestDelayMs(500, timestamp)).to.equal(0);

    // Should factor in remaining tokens when calculating the time.
    expect(limiter._tryMakeRequest(250, timestamp));
    expect(limiter._getNextRequestDelayMs(500, timestamp)).to.equal(500);

    // Once tokens have been used, should calculate time before next request.
    timestamp = new Timestamp(1, 0);
    expect(limiter._tryMakeRequest(500, timestamp)).to.be.true;
    expect(limiter._getNextRequestDelayMs(100, timestamp)).to.equal(200);
    expect(limiter._getNextRequestDelayMs(250, timestamp)).to.equal(500);
    expect(limiter._getNextRequestDelayMs(500, timestamp)).to.equal(1000);
    expect(limiter._getNextRequestDelayMs(501, timestamp)).to.equal(-1);

    // Scales with multiplier.
    timestamp = new Timestamp(5 * 60, 0);
    expect(limiter._tryMakeRequest(750, timestamp)).to.be.true;
    expect(limiter._getNextRequestDelayMs(250, timestamp)).to.equal(334);
    expect(limiter._getNextRequestDelayMs(500, timestamp)).to.equal(667);
    expect(limiter._getNextRequestDelayMs(750, timestamp)).to.equal(1000);
    expect(limiter._getNextRequestDelayMs(751, timestamp)).to.equal(-1);
  });

  it('calculates the maximum number of operations correctly', async () => {
    const currentTime = new Timestamp(0, 0);
    expect(
      limiter.calculateCapacity(new Timestamp(1, 0), currentTime)
    ).to.equal(500);
    expect(
      limiter.calculateCapacity(new Timestamp(5 * 60, 0), currentTime)
    ).to.equal(750);
    expect(
      limiter.calculateCapacity(new Timestamp(10 * 60, 0), currentTime)
    ).to.equal(1125);
    expect(
      limiter.calculateCapacity(new Timestamp(15 * 60, 0), currentTime)
    ).to.equal(1687);
    expect(
      limiter.calculateCapacity(new Timestamp(90 * 60, 0), currentTime)
    ).to.equal(738945);
  });
});
