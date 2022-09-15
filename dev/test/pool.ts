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

import {describe, it} from 'mocha';
import {expect, use} from 'chai';
import {GoogleError} from 'google-gax';
import * as chaiAsPromised from 'chai-as-promised';

import {ClientPool, CLIENT_TERMINATED_ERROR_MSG} from '../src/pool';
import {Deferred} from '../src/util';

use(chaiAsPromised);

const REQUEST_TAG = 'tag';
const USE_REST = false;
const USE_GRPC = true;

function deferredPromises(count: number): Array<Deferred<void>> {
  const deferred: Array<Deferred<void>> = [];
  for (let i = 0; i < count; ++i) {
    deferred.push(new Deferred<void>());
  }
  return deferred;
}

describe('Client pool', () => {
  it('creates new instances as needed', () => {
    const clientPool = new ClientPool<{}>(3, 0, () => {
      return {};
    });

    expect(clientPool.size).to.equal(0);

    const operationPromises = deferredPromises(4);

    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[0].promise);
    expect(clientPool.size).to.equal(1);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[1].promise);
    expect(clientPool.size).to.equal(1);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[2].promise);
    expect(clientPool.size).to.equal(1);

    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[3].promise);
    expect(clientPool.size).to.equal(2);
  });

  it('re-uses instances with remaining capacity', () => {
    const clientPool = new ClientPool<{}>(2, 0, () => {
      return {};
    });

    expect(clientPool.size).to.equal(0);

    const operationPromises = deferredPromises(5);

    const completionPromise = clientPool.run(
      REQUEST_TAG,
      USE_REST,
      () => operationPromises[0].promise
    );
    expect(clientPool.size).to.equal(1);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[1].promise);
    expect(clientPool.size).to.equal(1);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[2].promise);
    expect(clientPool.size).to.equal(2);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[3].promise);
    expect(clientPool.size).to.equal(2);

    operationPromises[0].resolve();

    return completionPromise.then(() => {
      clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[4].promise);
      expect(clientPool.size).to.equal(2);
    });
  });

  it('re-uses idle instances', async () => {
    let instanceCount = 0;
    const clientPool = new ClientPool<{}>(1, 1, () => {
      ++instanceCount;
      return {};
    });

    const operationPromises = deferredPromises(2);

    let completionPromise = clientPool.run(
      REQUEST_TAG,
      USE_REST,
      () => operationPromises[0].promise
    );
    expect(clientPool.size).to.equal(1);
    operationPromises[0].resolve();
    await completionPromise;

    completionPromise = clientPool.run(
      REQUEST_TAG,
      USE_REST,
      () => operationPromises[1].promise
    );
    expect(clientPool.size).to.equal(1);
    operationPromises[1].resolve();
    await completionPromise;

    expect(instanceCount).to.equal(1);
  });

  it('does not re-use rest instance for grpc call', async () => {
    const clientPool = new ClientPool<{}>(10, 1, () => {
      return {};
    });

    const operationPromises = deferredPromises(2);

    void clientPool.run(
      REQUEST_TAG,
      USE_REST,
      () => operationPromises[0].promise
    );
    void clientPool.run(
      REQUEST_TAG,
      USE_GRPC,
      () => operationPromises[1].promise
    );
    expect(clientPool.size).to.equal(2);

    operationPromises[0].resolve();
    operationPromises[1].resolve();
  });

  it('re-uses grpc instance for rest calls', async () => {
    const clientPool = new ClientPool<{}>(10, 1, () => {
      return {};
    });

    const operationPromises = deferredPromises(2);

    void clientPool.run(
      REQUEST_TAG,
      USE_GRPC,
      () => operationPromises[0].promise
    );
    void clientPool.run(
      REQUEST_TAG,
      USE_REST,
      () => operationPromises[1].promise
    );
    expect(clientPool.size).to.equal(1);

    operationPromises[0].resolve();
    operationPromises[1].resolve();
  });

  it('bin packs operations', async () => {
    let clientCount = 0;
    const clientPool = new ClientPool<number>(2, 0, () => {
      return ++clientCount;
    });

    expect(clientPool.size).to.equal(0);

    // Create 5 operations, which should schedule 2 operations on the first
    // client, 2 on the second and 1 on the third.
    const operationPromises = deferredPromises(7);
    clientPool.run(REQUEST_TAG, USE_REST, client => {
      expect(client).to.be.equal(1);
      return operationPromises[0].promise;
    });
    clientPool.run(REQUEST_TAG, USE_REST, client => {
      expect(client).to.be.equal(1);
      return operationPromises[1].promise;
    });
    const thirdOperation = clientPool.run(REQUEST_TAG, USE_REST, client => {
      expect(client).to.be.equal(2);
      return operationPromises[2].promise;
    });
    clientPool.run(REQUEST_TAG, USE_REST, client => {
      expect(client).to.be.equal(2);
      return operationPromises[3].promise;
    });
    clientPool.run(REQUEST_TAG, USE_REST, client => {
      expect(client).to.be.equal(3);
      return operationPromises[4].promise;
    });

    // Free one slot on the second client.
    operationPromises[2].resolve();
    await thirdOperation;

    // A newly scheduled operation should use the first client that has a free
    // slot.
    clientPool.run(REQUEST_TAG, USE_REST, async client => {
      expect(client).to.be.equal(2);
    });
  });

  it('garbage collects after success', () => {
    const clientPool = new ClientPool<{}>(2, 0, () => {
      return {};
    });

    expect(clientPool.size).to.equal(0);

    const operationPromises = deferredPromises(4);
    const completionPromises: Array<Promise<void>> = [];

    completionPromises.push(
      clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[0].promise)
    );
    expect(clientPool.size).to.equal(1);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[1].promise)
    );
    expect(clientPool.size).to.equal(1);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[2].promise)
    );
    expect(clientPool.size).to.equal(2);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[3].promise)
    );
    expect(clientPool.size).to.equal(2);

    operationPromises.forEach(deferred => deferred.resolve());

    return Promise.all(completionPromises).then(() => {
      expect(clientPool.size).to.equal(0);
    });
  });

  it('garbage collects after error', () => {
    const clientPool = new ClientPool<{}>(2, 0, () => {
      return {};
    });

    expect(clientPool.size).to.equal(0);

    const operationPromises = deferredPromises(4);
    const completionPromises: Array<Promise<void>> = [];

    completionPromises.push(
      clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[0].promise)
    );
    expect(clientPool.size).to.equal(1);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[1].promise)
    );
    expect(clientPool.size).to.equal(1);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[2].promise)
    );
    expect(clientPool.size).to.equal(2);
    completionPromises.push(
      clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[3].promise)
    );
    expect(clientPool.size).to.equal(2);

    operationPromises.forEach(deferred => deferred.reject(new Error()));

    return Promise.all(completionPromises.map(p => p.catch(() => {}))).then(
      () => expect(clientPool.size).to.equal(0)
    );
  });

  it('garbage collection calls destructor', () => {
    const garbageCollect = new Deferred<void>();

    const clientPool = new ClientPool<{}>(
      1,
      0,
      () => ({}),
      () => Promise.resolve(garbageCollect.resolve())
    );

    const operationPromises = deferredPromises(2);

    // Create two pending operations that each spawn their own client
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[0].promise);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[1].promise);

    operationPromises.forEach(deferred => deferred.resolve());

    return garbageCollect.promise;
  });

  it('forwards success', () => {
    const clientPool = new ClientPool<{}>(1, 0, () => {
      return {};
    });

    const op = clientPool.run(REQUEST_TAG, USE_REST, () =>
      Promise.resolve('Success')
    );
    return expect(op).to.become('Success');
  });

  it('forwards failure', () => {
    const clientPool = new ClientPool<{}>(1, 0, () => {
      return {};
    });

    const op = clientPool.run(REQUEST_TAG, USE_REST, () =>
      Promise.reject('Generated error')
    );
    return expect(op).to.eventually.be.rejectedWith('Generated error');
  });

  it('does not re-use clients after RST_STREAM', async () => {
    let instanceCount = 0;
    const clientPool = new ClientPool<{}>(1, 1, () => {
      ++instanceCount;
      return {};
    });

    const op = clientPool.run(REQUEST_TAG, USE_REST, () =>
      Promise.reject(
        new GoogleError('13 INTERNAL: Received RST_STREAM with code 2')
      )
    );
    await op.catch(() => {});

    await clientPool.run(REQUEST_TAG, USE_REST, async () => {});

    expect(instanceCount).to.equal(2);
  });

  it('garbage collects after RST_STREAM', async () => {
    const clientPool = new ClientPool<{}>(1, 1, () => {
      return {};
    });

    const op = clientPool.run(REQUEST_TAG, USE_REST, () =>
      Promise.reject(
        new GoogleError('13 INTERNAL: Received RST_STREAM with code 2')
      )
    );
    await op.catch(() => {});

    expect(clientPool.size).to.equal(0);
  });

  it('garbage collects rest clients after GRPC', async () => {
    const clientPool = new ClientPool<{}>(10, 1, () => {
      return {};
    });

    await clientPool.run(REQUEST_TAG, USE_REST, () => Promise.resolve());
    await clientPool.run(REQUEST_TAG, USE_GRPC, () => Promise.resolve());

    expect(clientPool.size).to.equal(1);
  });

  it('keeps pool of idle clients', async () => {
    const clientPool = new ClientPool<{}>(
      /* concurrentOperationLimit= */ 1,
      /* maxIdleClients= */ 3,
      () => {
        return {};
      }
    );

    const operationPromises = deferredPromises(4);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[0].promise);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[1].promise);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[2].promise);
    const lastOp = clientPool.run(
      REQUEST_TAG,
      USE_REST,
      () => operationPromises[3].promise
    );
    expect(clientPool.size).to.equal(4);

    // Resolve all pending operations. Note that one client is removed, while
    // 3 are kept for further usage.
    operationPromises.forEach(deferred => deferred.resolve());
    await lastOp;
    expect(clientPool.size).to.equal(3);
  });

  it('default setting keeps at least one idle client', async () => {
    const clientPool = new ClientPool<{}>(
      1,
      /* maxIdleClients= git c*/ 1,
      () => {
        return {};
      }
    );

    const operationPromises = deferredPromises(2);
    clientPool.run(REQUEST_TAG, USE_REST, () => operationPromises[0].promise);
    const completionPromise = clientPool.run(
      REQUEST_TAG,
      USE_REST,
      () => operationPromises[1].promise
    );
    expect(clientPool.size).to.equal(2);

    operationPromises[0].resolve();
    operationPromises[1].resolve();
    await completionPromise;
    expect(clientPool.size).to.equal(1);
  });

  it('rejects subsequent operations after being terminated', () => {
    const clientPool = new ClientPool<{}>(1, 0, () => {
      return {};
    });

    return clientPool
      .terminate()
      .then(() => {
        return clientPool.run(REQUEST_TAG, USE_REST, () =>
          Promise.reject('Call to run() should have failed')
        );
      })
      .catch((err: Error) => {
        expect(err.message).to.equal(CLIENT_TERMINATED_ERROR_MSG);
      });
  });

  it('waits for existing operations to complete before releasing clients', done => {
    const clientPool = new ClientPool<{}>(1, 0, () => {
      return {};
    });
    const deferred = new Deferred<void>();
    let terminated = false;

    // Run operation that completes after terminate() is called.
    clientPool.run(REQUEST_TAG, USE_REST, () => {
      return deferred.promise;
    });
    const terminateOp = clientPool.terminate().then(() => {
      terminated = true;
    });

    expect(terminated).to.be.false;
    // Mark the mock operation as "complete".
    deferred.resolve();
    terminateOp.then(() => {
      expect(terminated).to.be.true;
      done();
    });
  });
});
