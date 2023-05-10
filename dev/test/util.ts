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

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {isPlainObject, tryGetPreferRestEnvironmentVariable} from '../src/util';
import * as sinon from 'sinon';

describe('isPlainObject()', () => {
  it('allows Object.create()', () => {
    expect(isPlainObject(Object.create({}))).to.be.true;
    expect(isPlainObject(Object.create(Object.prototype))).to.be.true;
    expect(isPlainObject(Object.create(null))).to.be.true;
  });

  it(' allows plain types', () => {
    expect(isPlainObject({foo: 'bar'})).to.be.true;
    expect(isPlainObject({})).to.be.true;
  });

  it('rejects custom types', () => {
    class Foo {}
    expect(isPlainObject(new Foo())).to.be.false;
    expect(isPlainObject(Object.create(new Foo()))).to.be.false;
  });

  describe('tryGetPreferRestEnvironmentVariable', () => {
    const sandbox = sinon.createSandbox();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let warnSpy: any;

    beforeEach(() => {
      warnSpy = sandbox.spy(console, 'warn');
    });

    afterEach(() => {
      delete process.env.FIRESTORE_PREFER_REST;
      sandbox.restore();
    });

    it('reads true', async () => {
      process.env.FIRESTORE_PREFER_REST = 'true';
      const [prevSet, prevValue] = tryGetPreferRestEnvironmentVariable();
      expect(prevSet).to.be.true;
      expect(prevValue).to.be.true;
    });

    it('reads 1', async () => {
      process.env.FIRESTORE_PREFER_REST = '1';
      const [prevSet, prevValue] = tryGetPreferRestEnvironmentVariable();
      expect(prevSet).to.be.true;
      expect(prevValue).to.be.true;
    });

    it('reads false', async () => {
      process.env.FIRESTORE_PREFER_REST = 'false';
      const [prevSet, prevValue] = tryGetPreferRestEnvironmentVariable();
      expect(prevSet).to.be.true;
      expect(prevValue).to.be.false;
    });

    it('reads 0', async () => {
      process.env.FIRESTORE_PREFER_REST = '0';
      const [prevSet, prevValue] = tryGetPreferRestEnvironmentVariable();
      expect(prevSet).to.be.true;
      expect(prevValue).to.be.false;
    });

    it('ignores case', async () => {
      process.env.FIRESTORE_PREFER_REST = 'True';
      const [prevSet, prevValue] = tryGetPreferRestEnvironmentVariable();
      expect(prevSet).to.be.true;
      expect(prevValue).to.be.true;
    });

    it('indicates when the environment variable is not set', async () => {
      const [prevSet, prevValue] = tryGetPreferRestEnvironmentVariable();
      expect(prevSet).to.be.false;
      expect(prevValue).to.be.undefined;
      expect(warnSpy.calledOnce).to.be.false;
    });

    it('indicates when the environment variable is set to an unsupported value', async () => {
      process.env.FIRESTORE_PREFER_REST = 'enable';
      const [prevSet, prevValue] = tryGetPreferRestEnvironmentVariable();
      expect(prevSet).to.be.false;
      expect(prevValue).to.be.undefined;
      expect(warnSpy.calledOnce).to.be.true;
      expect(warnSpy.getCall(0).args[0]).to.match(
        /unsupported value.*FIRESTORE_PREFER_REST/
      );
    });
  });
});
