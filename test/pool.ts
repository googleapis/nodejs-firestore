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

import {use, expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {ClientPool} from '../src/pool';
import {Deferred} from './util/helpers';

use(chaiAsPromised.default);

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

    expect(clientPool.size).to.eq(0);

    const deferred = deferredPromises(4);

    clientPool.run(() => deferred[0].promise);
    expect(clientPool.size).to.eq(1);
    clientPool.run(() => deferred[1].promise);
    expect(clientPool.size).to.eq(1);
    clientPool.run(() => deferred[2].promise);
    expect(clientPool.size).to.eq(1);

    clientPool.run(() => deferred[3].promise);
    expect(clientPool.size).to.eq(2);
  });

  it('re-uses idle instances', () => {
    const clientPool = new ClientPool<{}>(2, () => {
      return {};
    });

    expect(clientPool.size).to.eq(0);

    const deferred = deferredPromises(5);

    const operationComplete = clientPool.run(() => deferred[0].promise);
    expect(clientPool.size).to.eq(1);
    clientPool.run(() => deferred[1].promise);
    expect(clientPool.size).to.eq(1);
    clientPool.run(() => deferred[2].promise);
    expect(clientPool.size).to.eq(2);
    clientPool.run(() => deferred[3].promise);
    expect(clientPool.size).to.eq(2);

    deferred[0].resolve();

    return operationComplete.then(() => {
      clientPool.run(() => deferred[4].promise);
      expect(clientPool.size).to.eq(2);
    });
  });

  it('garbage collects after success', () => {
    const clientPool = new ClientPool<{}>(2, () => {
      return {};
    });

    expect(clientPool.size).to.eq(0);

    const operationPromises = deferredPromises(4);
    const completionPromises: Array<Promise<void>> = [];

    completionPromises.push(clientPool.run(() => operationPromises[0].promise));
    expect(clientPool.size).to.eq(1);
    completionPromises.push(clientPool.run(() => operationPromises[1].promise));
    expect(clientPool.size).to.eq(1);
    completionPromises.push(clientPool.run(() => operationPromises[2].promise));
    expect(clientPool.size).to.eq(2);
    completionPromises.push(clientPool.run(() => operationPromises[3].promise));
    expect(clientPool.size).to.eq(2);

    operationPromises[0].resolve();
    operationPromises[1].resolve();
    operationPromises[2].resolve();
    operationPromises[3].resolve();

    return Promise.all(completionPromises).then(() => {
      expect(clientPool.size).to.eq(1);
    });
  });

  it('garbage collects after error', () => {
    const clientPool = new ClientPool<{}>(2, () => {
      return {};
    });

    expect(clientPool.size).to.eq(0);

    const operationPromises = deferredPromises(4);
    const completionPromises: Array<Promise<void>> = [];

    completionPromises.push(clientPool.run(() => operationPromises[0].promise));
    expect(clientPool.size).to.eq(1);
    completionPromises.push(clientPool.run(() => operationPromises[1].promise));
    expect(clientPool.size).to.eq(1);
    completionPromises.push(clientPool.run(() => operationPromises[2].promise));
    expect(clientPool.size).to.eq(2);
    completionPromises.push(clientPool.run(() => operationPromises[3].promise));
    expect(clientPool.size).to.eq(2);

    operationPromises[0].reject();
    operationPromises[1].reject();
    operationPromises[2].reject();
    operationPromises[3].reject();

    return Promise.all(completionPromises.map(p => p.catch(() => {})))
        .then(() => {
          expect(clientPool.size).to.eq(1);
        });
  });

  it('forwards success', () => {
    const clientPool = new ClientPool<{}>(1, () => {
      return {};
    });

    const op = clientPool.run(() => Promise.resolve('Success'));
    return expect(op).to.become('Success');
  });

  it('forwards failure', () => {
    const clientPool = new ClientPool<{}>(1, () => {
      return {};
    });

    const op = clientPool.run(() => Promise.reject('Generated error'));
    return expect(op).to.eventually.be.rejectedWith('Generated error');
  });
});
