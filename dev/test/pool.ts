// Copyright 2018 Google LLC
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

import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {ClientPool} from '../src/pool';
import {Deferred} from '../src/util';

use(chaiAsPromised);

const REQUEST_TAG = 'tag';

function deferredPromises(count: number): Array<Deferred<void>> {
  const deferred: Array<Deferred<void>> = [];
  for (let i = 0; i < count; ++i) {
    deferred.push(new Deferred<void>());
  }
  return deferred;
}

describe('Client pool', () => {
  it('creates new instances as needed', () => {
    const clientPool = new ClientPool<{}>(3, () => {
      return {};
    });

    expect(clientPool.size).to.equal(0);

    const operationPromises = deferredPromises(4);

    clientPool.run(REQUEST_TAG, () => operationPromises[0].promise);
    expect(clientPool.size).to.equal(1);
    clientPool.run(REQUEST_TAG, () => operationPromises[1].promise);
    expect(clientPool.size).to.equal(1);
    clientPool.run(REQUEST_TAG, () => operationPromises[2].promise);
    expect(clientPool.size).to.equal(1);

    clientPool.run(REQUEST_TAG, () => operationPromises[3].promise);
    expect(clientPool.size).to.equal(2);
  });

  it('re-uses idle instances', () => {
    const clientPool = new ClientPool<{}>(2, () => {
      return {};
    });

    expect(clientPool.size).to.equal(0);

    const operationPromises = deferredPromises(5);

    const completionPromise = clientPool.run(
      REQUEST_TAG,
      () => operationPromises[0].promise
    );
    expect(clientPool.size).to.equal(1);
    clientPool.run(REQUEST_TAG, () => operationPromises[1].promise);
    expect(clientPool.size).to.equal(1);
    clientPool.run(REQUEST_TAG, () => operationPromises[2].promise);
    expect(clientPool.size).to.equal(2);
    clientPool.run(REQUEST_TAG, () => operationPromises[3].promise);
    expect(clientPool.size).to.equal(2);

    operationPromises[0].resolve();

    return completionPromise.then(() => {
      clientPool.run(REQUEST_TAG, () => operationPromises[4].promise);
      expect(clientPool.size).to.equal(2);
    });
  });

  it('garbage collects after success', () => {
    const clientPool = new ClientPool<{}>(2, () => {
      return {};
    });

    expect(clientPool.size).to.equal(0);

    const operationPromises = deferredPromises(4);
    const completionPromises: Array<Promise<void>> = [];

    completionPromises.push(
      clientPool.run(REQUEST_TAG, () => operationPromises[0].promise)
    );
    expect(clientPool.size).to.equal(1);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, () => operationPromises[1].promise)
    );
    expect(clientPool.size).to.equal(1);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, () => operationPromises[2].promise)
    );
    expect(clientPool.size).to.equal(2);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, () => operationPromises[3].promise)
    );
    expect(clientPool.size).to.equal(2);

    operationPromises.forEach(deferred => deferred.resolve());

    return Promise.all(completionPromises).then(() => {
      expect(clientPool.size).to.equal(1);
    });
  });

  it('garbage collects after error', () => {
    const clientPool = new ClientPool<{}>(2, () => {
      return {};
    });

    expect(clientPool.size).to.equal(0);

    const operationPromises = deferredPromises(4);
    const completionPromises: Array<Promise<void>> = [];

    completionPromises.push(
      clientPool.run(REQUEST_TAG, () => operationPromises[0].promise)
    );
    expect(clientPool.size).to.equal(1);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, () => operationPromises[1].promise)
    );
    expect(clientPool.size).to.equal(1);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, () => operationPromises[2].promise)
    );
    expect(clientPool.size).to.equal(2);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, () => operationPromises[3].promise)
    );
    expect(clientPool.size).to.equal(2);

    operationPromises.forEach(deferred => deferred.reject());

    return Promise.all(completionPromises.map(p => p.catch(() => {}))).then(
      () => {
        expect(clientPool.size).to.equal(1);
      }
    );
  });

  it('garbage collection calls destructor', () => {
    const garbageCollect = new Deferred();

    const clientPool = new ClientPool<{}>(
      1,
      () => {
        return {};
      },
      () => garbageCollect.resolve()
    );

    const operationPromises = deferredPromises(2);

    clientPool.run(REQUEST_TAG, () => operationPromises[0].promise);
    clientPool.run(REQUEST_TAG, () => operationPromises[1].promise);

    operationPromises.forEach(deferred => deferred.resolve());

    return garbageCollect.promise;
  });

  it('forwards success', () => {
    const clientPool = new ClientPool<{}>(1, () => {
      return {};
    });

    const op = clientPool.run(REQUEST_TAG, () => Promise.resolve('Success'));
    return expect(op).to.become('Success');
  });

  it('forwards failure', () => {
    const clientPool = new ClientPool<{}>(1, () => {
      return {};
    });

    const op = clientPool.run(REQUEST_TAG, () =>
      Promise.reject('Generated error')
    );
    return expect(op).to.eventually.be.rejectedWith('Generated error');
  });
});
