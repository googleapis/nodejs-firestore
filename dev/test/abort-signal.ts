/*!
 * Copyright 2024 Google Inc. All Rights Reserved.
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

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {AbortUtil, Cancellable} from '../src/abort-util';

describe('AbortUtil', () => {
  describe('throwIfAborted', () => {
    it('should not throw if signal is null', () => {
      expect(() => AbortUtil.throwIfAborted(null)).to.not.throw();
    });

    it('should not throw if signal is not aborted', () => {
      const controller = new AbortController();
      expect(() => AbortUtil.throwIfAborted(controller.signal)).to.not.throw();
    });

    it('should throw if signal is aborted', () => {
      const controller = new AbortController();
      controller.abort();
      expect(() => AbortUtil.throwIfAborted(controller.signal)).to.throw('The operation was aborted');
    });
  });

  describe('makeCancellable', () => {
    it('should return original promise if no signal provided', async () => {
      const originalPromise = Promise.resolve('test');
      const cancellable: Cancellable = { cancel: () => {} };
      
      const result = await AbortUtil.makeCancellable(originalPromise, cancellable, null);
      expect(result).to.equal('test');
    });

    it('should return original promise if signal is not aborted', async () => {
      const controller = new AbortController();
      const originalPromise = Promise.resolve('test');
      const cancellable: Cancellable = { cancel: () => {} };
      
      const result = await AbortUtil.makeCancellable(originalPromise, cancellable, controller.signal);
      expect(result).to.equal('test');
    });

    it('should throw if signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      const originalPromise = Promise.resolve('test');
      const cancellable: Cancellable = { cancel: () => {} };
      
      try {
        await AbortUtil.makeCancellable(originalPromise, cancellable, controller.signal);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).to.equal('The operation was aborted');
      }
    });

    it('should cancel and reject when signal is aborted during operation', async () => {
      const controller = new AbortController();
      let cancelCalled = false;
      const cancellable: Cancellable = { 
        cancel: () => { cancelCalled = true; } 
      };
      
      // Create a promise that never resolves
      const originalPromise = new Promise(() => {});
      
      const cancellablePromise = AbortUtil.makeCancellable(originalPromise, cancellable, controller.signal);
      
      // Abort after a short delay
      setTimeout(() => controller.abort(), 10);
      
      try {
        await cancellablePromise;
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).to.equal('The operation was aborted');
        expect(cancelCalled).to.be.true;
      }
    });

    it('should resolve normally if promise completes before abort', async () => {
      const controller = new AbortController();
      const cancellable: Cancellable = { cancel: () => {} };
      
      // Create a promise that resolves quickly
      const originalPromise = new Promise(resolve => setTimeout(() => resolve('success'), 10));
      
      const cancellablePromise = AbortUtil.makeCancellable(originalPromise, cancellable, controller.signal);
      
      // Abort after a longer delay
      setTimeout(() => controller.abort(), 50);
      
      const result = await cancellablePromise;
      expect(result).to.equal('success');
    });
  });
});