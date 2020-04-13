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

import {fail} from 'assert';
import {expect} from 'chai';
import {Status} from 'google-gax';

import {Firestore, setLogFunction, Timestamp, WriteResult} from '../src';
import {setTimeoutHandler} from '../src/backoff';
import {BulkWriter} from '../src/bulk-writer';
import {Deferred} from '../src/util';
import {
  ApiOverride,
  createInstance,
  response,
  verifyInstance,
} from './util/helpers';

// Change the argument to 'console.log' to enable debug output.
setLogFunction(() => {});

const PROJECT_ID = 'test-project';

interface BulkWriterRequest {
  writes: Array<{[key: string]: {} | undefined}>;
}

interface BulkWriterResponse {
  writeResults: Array<{[key: string]: {} | null}>;
  status: Array<{[key: string]: {}}>;
}

interface RequestResponse {
  request: BulkWriterRequest;
  response: BulkWriterResponse;
}

describe.only('BulkWriter', () => {
  const documentNameRoot = `projects/${PROJECT_ID}/databases/(default)/documents/`;

  let firestore: Firestore;
  let bulkWriter: BulkWriter;
  let requestCounter: number;
  let opCount: number;
  let flushDeferred = new Deferred<void>();

  beforeEach(() => {
    requestCounter = -1;
    opCount = 0;
  });

  function incrementOpCount(): void {
    opCount++;
  }

  function verifyOpCount(expected: number): void {
    expect(opCount).to.equal(expected);
  }

  function setOp(doc: string, value: string): {[key: string]: {}} {
    return {
      update: {
        fields: {
          foo: {
            stringValue: value,
          },
        },
        name: documentNameRoot + doc,
      },
    };
  }

  function createOp(doc: string, value: string): {[key: string]: {}} {
    return {
      currentDocument: {
        exists: false,
      },
      update: {
        fields: {
          foo: {
            stringValue: value,
          },
        },
        name: documentNameRoot + doc,
      },
    };
  }

  function updateOp(doc: string, value: string): {[key: string]: {}} {
    return {
      update: {
        fields: {
          foo: {
            stringValue: value,
          },
        },
        name: documentNameRoot + doc,
      },
      updateMask: {
        fieldPaths: ['foo'],
      },
    };
  }

  function deleteOp(doc: string): {[key: string]: {}} {
    return {
      delete: documentNameRoot + doc,
    };
  }

  function createRequest(
    requests: Array<{[key: string]: {}}>
  ): BulkWriterRequest {
    return {
      writes: requests,
    };
  }

  function successResponse(seconds: number): {[key: string]: {}} {
    return {
      updateTime: {
        nanos: 0,
        seconds,
      },
      code: Status.OK,
    };
  }

  function failResponse(): {[key: string]: {} | null} {
    return {
      updateTime: null,
      code: Status.UNAVAILABLE,
    };
  }

  function createResponse(
    responses: Array<{[key: string]: {} | null}>
  ): BulkWriterResponse {
    const writeResults = responses.map(response => ({
      updateTime: response.updateTime,
    }));
    const status = responses.map(response => ({code: response.code!}));
    return {
      writeResults,
      status,
    };
  }

  function instantiateInstance(
    mock: RequestResponse[],
    manualFlush = false
  ): Promise<void> {
    const overrides: ApiOverride = {
      batchWrite: async request => {
        requestCounter++;
        expect(request).to.deep.eq({
          database: `projects/${PROJECT_ID}/databases/(default)`,
          writes: mock[requestCounter].request.writes,
        });
        if (manualFlush) {
          return Promise.resolve().then(async () => {
            await flushDeferred.promise;
            flushDeferred = new Deferred<void>();
            return response({
              writeResults: mock[requestCounter].response.writeResults,
              status: mock[requestCounter].response.status,
            });
          });
        }
        return response({
          writeResults: mock[requestCounter].response.writeResults,
          status: mock[requestCounter].response.status,
        });
      },
    };
    return createInstance(overrides).then(firestoreClient => {
      firestore = firestoreClient;
      bulkWriter = firestore.bulkWriter();
    });
  }

  afterEach(() => verifyInstance(firestore));

  it('has a set() method', async () => {
    await instantiateInstance([
      {
        request: createRequest([setOp('col/doc', 'bar')]),
        response: createResponse([successResponse(2)]),
      },
    ]);
    const doc = firestore.doc('col/doc');
    let writeResult: WriteResult;
    bulkWriter.set(doc, {foo: 'bar'}).then(result => {
      incrementOpCount();
      writeResult = result;
    });
    return bulkWriter.flush().then(async () => {
      verifyOpCount(1);
      expect(writeResult.writeTime.isEqual(new Timestamp(2, 0))).to.be.true;
    });
  });

  it('has an update() method', async () => {
    await instantiateInstance([
      {
        request: createRequest([updateOp('col/doc', 'bar')]),
        response: createResponse([successResponse(2)]),
      },
    ]);
    const doc = firestore.doc('col/doc');
    let writeResult: WriteResult;
    bulkWriter.update(doc, {foo: 'bar'}).then(result => {
      incrementOpCount();
      writeResult = result;
    });
    return bulkWriter.flush().then(async () => {
      verifyOpCount(1);
      expect(writeResult.writeTime.isEqual(new Timestamp(2, 0))).to.be.true;
    });
  });

  it('has a delete() method', async () => {
    await instantiateInstance([
      {
        request: createRequest([deleteOp('col/doc')]),
        response: createResponse([successResponse(2)]),
      },
    ]);
    const doc = firestore.doc('col/doc');
    let writeResult: WriteResult;
    bulkWriter.delete(doc).then(result => {
      incrementOpCount();
      writeResult = result;
    });
    return bulkWriter.flush().then(async () => {
      verifyOpCount(1);
      expect(writeResult.writeTime.isEqual(new Timestamp(2, 0))).to.be.true;
    });
  });

  it('has a create() method', async () => {
    await instantiateInstance([
      {
        request: createRequest([createOp('col/doc', 'bar')]),
        response: createResponse([successResponse(2)]),
      },
    ]);
    const doc = firestore.doc('col/doc');
    let writeResult: WriteResult;
    bulkWriter.create(doc, {foo: 'bar'}).then(result => {
      incrementOpCount();
      writeResult = result;
    });
    return bulkWriter.flush().then(async () => {
      verifyOpCount(1);
      expect(writeResult.writeTime.isEqual(new Timestamp(2, 0))).to.be.true;
    });
  });

  // TODO: Do I need to include other tests similar to the ones in WriteBatch
  // that check for adding preconditions, passing in null values, etc? OR can I
  // assume that WriteBatch will handle them?

  it('surfaces errors', async () => {
    await instantiateInstance([
      {
        request: createRequest([setOp('col/doc', 'bar')]),
        response: createResponse([failResponse()]),
      },
    ]);

    const doc = firestore.doc('col/doc');
    bulkWriter.set(doc, {foo: 'bar'}).catch(err => {
      incrementOpCount();
      expect(err.code).to.equal(Status.UNAVAILABLE);
    });

    return bulkWriter.flush().then(async () => verifyOpCount(1));
  });

  it('flush() resolves immediately if there are no writes', async () => {
    await instantiateInstance([]);
    return bulkWriter.flush().then(() => verifyOpCount(0));
  });

  it('close() resolves immediately if there are no writes', async () => {
    await instantiateInstance([]);
    return bulkWriter.close().then(() => verifyOpCount(0));
  });

  it('cannot call methods after close() is called', async () => {
    await instantiateInstance([]);

    const expected = 'BulkWriter has already been closed.';
    await bulkWriter.close();
    expect(() => bulkWriter.set(firestore.doc('col/doc'), {})).to.throw(
      expected
    );
    expect(() => bulkWriter.create(firestore.doc('col/doc'), {})).to.throw(
      expected
    );
    expect(() => bulkWriter.update(firestore.doc('col/doc'), {})).to.throw(
      expected
    );
    expect(() => bulkWriter.delete(firestore.doc('col/doc'))).to.throw(
      expected
    );
    expect(bulkWriter.flush()).to.eventually.be.rejectedWith(expected);
    expect(bulkWriter.close()).to.eventually.be.rejectedWith(expected);
  });

  it('sends writes to the same document in separate batches', async () => {
    await instantiateInstance([
      {
        request: createRequest([setOp('col/doc', 'bar')]),
        response: createResponse([successResponse(0)]),
      },
      {
        request: createRequest([updateOp('col/doc', 'bar1')]),
        response: createResponse([successResponse(1)]),
      },
    ]);

    const doc = firestore.doc('col/doc');
    bulkWriter.set(doc, {foo: 'bar'}).then(incrementOpCount);
    bulkWriter.update(doc, {foo: 'bar1'}).then(incrementOpCount);

    return bulkWriter.flush().then(async () => {
      verifyOpCount(2);
    });
  });

  it('sends writes to different documents in the same batch', async () => {
    await instantiateInstance([
      {
        request: createRequest([
          setOp('col/doc', 'bar'),
          updateOp('col/doc2', 'bar'),
        ]),
        response: createResponse([successResponse(0), successResponse(1)]),
      },
    ]);

    const doc1 = firestore.doc('col/doc');
    const doc2 = firestore.doc('col/doc2');
    bulkWriter.set(doc1, {foo: 'bar'}).then(incrementOpCount);
    bulkWriter.update(doc2, {foo: 'bar'}).then(incrementOpCount);

    return bulkWriter.flush().then(async () => {
      verifyOpCount(2);
    });
  });

  it('splits into multiple batches after exceeding maximum batch size', async () => {
    const arrayRange = Array.from(new Array(6), (_, i) => i);
    const requests = arrayRange.map(i => setOp('col/doc' + i, 'bar'));
    const responses = arrayRange.map(i => successResponse(i));
    await instantiateInstance([
      {
        request: createRequest([requests[0], requests[1]]),
        response: createResponse([responses[0], responses[1]]),
      },
      {
        request: createRequest([requests[2], requests[3]]),
        response: createResponse([responses[2], responses[3]]),
      },
      {
        request: createRequest([requests[4], requests[5]]),
        response: createResponse([responses[4], responses[5]]),
      },
    ]);

    bulkWriter.setMaxBatchSize(2);
    for (let i = 0; i < 6; i++) {
      bulkWriter
        .set(firestore.doc('col/doc' + i), {foo: 'bar'})
        .then(incrementOpCount);
    }

    return bulkWriter.flush().then(async () => {
      verifyOpCount(6);
    });
  });

  it('sends batches automatically when they are are full', async () => {
    await instantiateInstance([
      {
        request: createRequest([
          setOp('col/doc', 'bar'),
          updateOp('col/doc2', 'bar'),
          createOp('col/doc3', 'bar'), 
          deleteOp('col/doc4')
        ]),
        response: createResponse([successResponse(0), successResponse(1), successResponse(2), successResponse(3)]),
      },
    ]);

    bulkWriter.setMaxBatchSize(4);
    const promise1 = bulkWriter.set(firestore.doc('col/doc'), {foo: 'bar'}).then(incrementOpCount);
    const promise2 = bulkWriter.update(firestore.doc('col/doc2'), {foo: 'bar'}).then(incrementOpCount);
    const promise3 =bulkWriter.create(firestore.doc('col/doc3'), {foo: 'bar'}).then(incrementOpCount); 
    const promise4 = bulkWriter.delete(firestore.doc('col/doc4')).then(incrementOpCount);

    await Promise.all([promise1, promise2, promise3, promise4]).then(() => {
      verifyOpCount(4);
    })
  });

  it('throttles writes', async () => {
    await instantiateInstance(
      [
        {
          request: createRequest([
            setOp('col/doc1', 'bar'),
            setOp('col/doc2', 'bar'),
          ]),
          response: createResponse([successResponse(1), successResponse(2)]),
        },
        {
          request: createRequest([setOp('col/doc3', 'bar')]),
          response: createResponse([successResponse(3)]),
        },
      ],
      /** manualFlush= */ true
    );

    // TODO: figure out how to properly create barrier to check for throttling
    // in order to test for requests that are in flight.
    // GOAL: flush1 runs, 1st batch commits, flush2 runs
    // ACTUAL: flush1 runs, flush 2 runs, 1st batch commits
    bulkWriter.setMaxBatchSize(2);
    bulkWriter.set(firestore.doc('col/doc1'), {foo: 'bar'});
    bulkWriter.set(firestore.doc('col/doc2'), {foo: 'bar'});
    const flush1 = bulkWriter.flush();
    // The third write will be added to a new batch that should not be allowed
    // in the same request because it would exceed the rate limit.
    bulkWriter.set(firestore.doc('col/doc3'), {foo: 'bar'});
    const flush2 = bulkWriter.flush();
    flushDeferred.resolve();
  });

  it('does not add writes to batches that are already in flight', () => {});

  describe('555 support', () => {
    let observedMax: number[] = [];

    before(() => {
      setTimeoutHandler((callback, timeout) => {
        observedMax.push(timeout);
        callback();
      });
    });

    beforeEach(() => {
      observedMax = [];
    });

    afterEach(() => setTimeoutHandler(setTimeout));

    it('calculates the maximum number of operations correctly', async () => {
      await instantiateInstance([]);
      const currentTime = new Timestamp(0, 0);
      expect(
        BulkWriter.calculateMaxOps(new Timestamp(1, 0), currentTime)
      ).to.equal(500);
      expect(
        BulkWriter.calculateMaxOps(new Timestamp(5 * 60, 0), currentTime)
      ).to.equal(750);
      expect(
        BulkWriter.calculateMaxOps(new Timestamp(10 * 60, 0), currentTime)
      ).to.equal(1125);
      expect(
        BulkWriter.calculateMaxOps(new Timestamp(15 * 60, 0), currentTime)
      ).to.equal(1687);
      expect(
        BulkWriter.calculateMaxOps(new Timestamp(90 * 60, 0), currentTime)
      ).to.equal(738945);
    });

    it('gradually ramps up the maximum operations per second', () => {
      const nop = () => {};
      bulkWriter.set(firestore.doc('col/doc'), {});

      // TODO: Should I finish the test and add hooks to monitor that the maxOps
      // increases by 50% each time? It seems like a quite a bit of boilerplate to test
      // something pretty simple. On the other hand, it feels bad to not test it at all.
    });
  });
});
