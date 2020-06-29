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

import {DocumentData} from '@google-cloud/firestore';

import {afterEach, beforeEach, describe, it} from 'mocha';
import {expect} from 'chai';
import {GoogleError, Status} from 'google-gax';

import * as proto from '../protos/firestore_v1_proto_api';
import {Firestore, setLogFunction, Timestamp, WriteResult} from '../src';
import {setTimeoutHandler} from '../src/backoff';
import {BulkWriter} from '../src/bulk-writer';
import {Deferred} from '../src/util';
import {
  ApiOverride,
  create,
  createInstance,
  document,
  remove,
  response,
  set,
  update,
  updateMask,
  verifyInstance,
} from './util/helpers';

import api = proto.google.firestore.v1;

// Change the argument to 'console.log' to enable debug output.
setLogFunction(() => {});

const PROJECT_ID = 'test-project';

interface RequestResponse {
  request: api.IBatchWriteRequest;
  response: api.IBatchWriteResponse;
}

describe('BulkWriter', () => {
  let firestore: Firestore;
  let requestCounter: number;
  let opCount: number;
  let activeRequestDeferred: Deferred<void>;
  let activeRequestCounter = 0;
  let timeoutHandlerCounter = 0;

  beforeEach(() => {
    activeRequestDeferred = new Deferred<void>();
    requestCounter = 0;
    opCount = 0;
    timeoutHandlerCounter = 0;
    setTimeoutHandler((fn, timeout) => {
      // Since a call to the backoff is made before each batchWrite, only
      // increment the counter if the timeout is non-zero, which indicates a
      // retry from an error.
      if (timeout > 0) {
        timeoutHandlerCounter++;
      }
      fn();
    });
  });

  function incrementOpCount(): void {
    opCount++;
  }

  function verifyOpCount(expected: number): void {
    expect(opCount).to.equal(expected);
  }

  function setOp(doc: string, value: string): api.IWrite {
    return set({
      document: document(doc, 'foo', value),
    }).writes![0];
  }

  function updateOp(doc: string, value: string): api.IWrite {
    return update({
      document: document(doc, 'foo', value),
      mask: updateMask('foo'),
    }).writes![0];
  }

  function createOp(doc: string, value: string): api.IWrite {
    return create({
      document: document(doc, 'foo', value),
    }).writes![0];
  }

  function deleteOp(doc: string): api.IWrite {
    return remove(doc).writes![0];
  }

  function createRequest(requests: api.IWrite[]): api.IBatchWriteRequest {
    return {
      writes: requests,
    };
  }

  function successResponse(updateTimeSeconds: number): api.IBatchWriteResponse {
    return {
      writeResults: [
        {
          updateTime: {
            nanos: 0,
            seconds: updateTimeSeconds,
          },
        },
      ],
      status: [{code: Status.OK}],
    };
  }

  function failedResponse(
    code = Status.DEADLINE_EXCEEDED
  ): api.IBatchWriteResponse {
    return {
      writeResults: [
        {
          updateTime: null,
        },
      ],
      status: [{code}],
    };
  }

  function mergeResponses(
    responses: api.IBatchWriteResponse[]
  ): api.IBatchWriteResponse {
    return {
      writeResults: responses.map(v => v.writeResults![0]),
      status: responses.map(v => v.status![0]),
    };
  }

  /**
   * Creates an instance with the mocked objects.
   *
   * @param enforceSingleConcurrentRequest Whether to check that there is only
   * one active request at a time. If true, the `activeRequestDeferred` must be
   * manually resolved for the response to return.
   */
  function instantiateInstance(
    mock: RequestResponse[],
    enforceSingleConcurrentRequest = false
  ): Promise<BulkWriter> {
    const overrides: ApiOverride = {
      batchWrite: async (request, options) => {
        expect(options!.retry!.retryCodes).contains(Status.ABORTED);

        expect(request).to.deep.eq({
          database: `projects/${PROJECT_ID}/databases/(default)`,
          writes: mock[requestCounter].request.writes,
        });
        if (enforceSingleConcurrentRequest) {
          activeRequestCounter++;

          // This expect statement is used to test that only one request is
          // made at a time.
          expect(activeRequestCounter).to.equal(1);
          await activeRequestDeferred.promise;
          activeRequestCounter--;
        }

        const responsePromise = response({
          writeResults: mock[requestCounter].response.writeResults,
          status: mock[requestCounter].response.status,
        });
        requestCounter++;
        return responsePromise;
      },
    };
    return createInstance(overrides).then(firestoreClient => {
      firestore = firestoreClient;
      return firestore._bulkWriter();
    });
  }

  afterEach(() => {
    verifyInstance(firestore);
    expect(timeoutHandlerCounter).to.equal(0);
    setTimeoutHandler(setTimeout);
  });

  it('has a set() method', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([setOp('doc', 'bar')]),
        response: successResponse(2),
      },
    ]);
    const doc = firestore.doc('collectionId/doc');
    let writeResult: WriteResult;
    bulkWriter.set(doc, {foo: 'bar'}).then(result => {
      incrementOpCount();
      writeResult = result;
    });
    return bulkWriter.close().then(async () => {
      verifyOpCount(1);
      expect(writeResult.writeTime.isEqual(new Timestamp(2, 0))).to.be.true;
    });
  });

  it('has an update() method', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([updateOp('doc', 'bar')]),
        response: successResponse(2),
      },
    ]);
    const doc = firestore.doc('collectionId/doc');
    let writeResult: WriteResult;
    bulkWriter.update(doc, {foo: 'bar'}).then(result => {
      incrementOpCount();
      writeResult = result;
    });
    return bulkWriter.close().then(async () => {
      verifyOpCount(1);
      expect(writeResult.writeTime.isEqual(new Timestamp(2, 0))).to.be.true;
    });
  });

  it('has a delete() method', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([deleteOp('doc')]),
        response: successResponse(2),
      },
    ]);
    const doc = firestore.doc('collectionId/doc');
    let writeResult: WriteResult;
    bulkWriter.delete(doc).then(result => {
      incrementOpCount();
      writeResult = result;
    });
    return bulkWriter.close().then(async () => {
      verifyOpCount(1);
      expect(writeResult.writeTime.isEqual(new Timestamp(2, 0))).to.be.true;
    });
  });

  it('has a create() method', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([createOp('doc', 'bar')]),
        response: successResponse(2),
      },
    ]);
    const doc = firestore.doc('collectionId/doc');
    let writeResult: WriteResult;
    bulkWriter.create(doc, {foo: 'bar'}).then(result => {
      incrementOpCount();
      writeResult = result;
    });
    return bulkWriter.close().then(async () => {
      verifyOpCount(1);
      expect(writeResult.writeTime.isEqual(new Timestamp(2, 0))).to.be.true;
    });
  });

  it('surfaces errors', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([setOp('doc', 'bar')]),
        response: failedResponse(),
      },
    ]);

    const doc = firestore.doc('collectionId/doc');
    bulkWriter.set(doc, {foo: 'bar'}).catch(err => {
      incrementOpCount();
      expect(err.code).to.equal(Status.DEADLINE_EXCEEDED);
    });

    return bulkWriter.close().then(async () => verifyOpCount(1));
  });

  it('flush() resolves immediately if there are no writes', async () => {
    const bulkWriter = await instantiateInstance([]);
    return bulkWriter.flush().then(() => verifyOpCount(0));
  });

  it('adds writes to a new batch after calling flush()', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([createOp('doc', 'bar')]),
        response: successResponse(2),
      },
      {
        request: createRequest([setOp('doc2', 'bar1')]),
        response: successResponse(2),
      },
    ]);
    bulkWriter
      .create(firestore.doc('collectionId/doc'), {foo: 'bar'})
      .then(incrementOpCount);
    bulkWriter.flush();
    bulkWriter
      .set(firestore.doc('collectionId/doc2'), {foo: 'bar1'})
      .then(incrementOpCount);
    await bulkWriter.close().then(async () => {
      verifyOpCount(2);
    });
  });

  it('close() sends all writes', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([createOp('doc', 'bar')]),
        response: successResponse(2),
      },
    ]);
    const doc = firestore.doc('collectionId/doc');
    bulkWriter.create(doc, {foo: 'bar'}).then(incrementOpCount);
    return bulkWriter.close().then(async () => {
      verifyOpCount(1);
    });
  });

  it('close() resolves immediately if there are no writes', async () => {
    const bulkWriter = await instantiateInstance([]);
    return bulkWriter.close().then(() => verifyOpCount(0));
  });

  it('cannot call methods after close() is called', async () => {
    const bulkWriter = await instantiateInstance([]);

    const expected = 'BulkWriter has already been closed.';
    const doc = firestore.doc('collectionId/doc');
    await bulkWriter.close();
    expect(() => bulkWriter.set(doc, {})).to.throw(expected);
    expect(() => bulkWriter.create(doc, {})).to.throw(expected);
    expect(() => bulkWriter.update(doc, {})).to.throw(expected);
    expect(() => bulkWriter.delete(doc)).to.throw(expected);
    expect(bulkWriter.flush()).to.eventually.be.rejectedWith(expected);
    expect(() => bulkWriter.close()).to.throw(expected);
  });

  it('sends writes to the same document in separate batches', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([setOp('doc', 'bar')]),
        response: successResponse(1),
      },
      {
        request: createRequest([updateOp('doc', 'bar1')]),
        response: successResponse(2),
      },
    ]);

    // Create two document references pointing to the same document.
    const doc = firestore.doc('collectionId/doc');
    const doc2 = firestore.doc('collectionId/doc');
    bulkWriter.set(doc, {foo: 'bar'}).then(incrementOpCount);
    bulkWriter.update(doc2, {foo: 'bar1'}).then(incrementOpCount);

    return bulkWriter.close().then(async () => {
      verifyOpCount(2);
    });
  });

  it('sends writes to different documents in the same batch', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([setOp('doc1', 'bar'), updateOp('doc2', 'bar')]),
        response: mergeResponses([successResponse(1), successResponse(2)]),
      },
    ]);

    const doc1 = firestore.doc('collectionId/doc1');
    const doc2 = firestore.doc('collectionId/doc2');
    bulkWriter.set(doc1, {foo: 'bar'}).then(incrementOpCount);
    bulkWriter.update(doc2, {foo: 'bar'}).then(incrementOpCount);

    return bulkWriter.close().then(async () => {
      verifyOpCount(2);
    });
  });

  it('splits into multiple batches after exceeding maximum batch size', async () => {
    const arrayRange = Array.from(new Array(6), (_, i) => i);
    const requests = arrayRange.map(i => setOp('doc' + i, 'bar'));
    const responses = arrayRange.map(i => successResponse(i));
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([requests[0], requests[1]]),
        response: mergeResponses([responses[0], responses[1]]),
      },
      {
        request: createRequest([requests[2], requests[3]]),
        response: mergeResponses([responses[2], responses[3]]),
      },
      {
        request: createRequest([requests[4], requests[5]]),
        response: mergeResponses([responses[4], responses[5]]),
      },
    ]);

    bulkWriter._setMaxBatchSize(2);
    for (let i = 0; i < 6; i++) {
      bulkWriter
        .set(firestore.doc('collectionId/doc' + i), {foo: 'bar'})
        .then(incrementOpCount);
    }

    return bulkWriter.close().then(async () => {
      verifyOpCount(6);
    });
  });

  it('sends existing batches when a new batch is created', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([setOp('doc', 'bar')]),
        response: successResponse(1),
      },
      {
        request: createRequest([
          updateOp('doc', 'bar1'),
          createOp('doc2', 'bar1'),
        ]),
        response: mergeResponses([successResponse(1), successResponse(2)]),
      },
    ]);

    bulkWriter._setMaxBatchSize(2);

    const doc = firestore.doc('collectionId/doc');
    const doc2 = firestore.doc('collectionId/doc2');

    // Create a new batch by writing to the same document.
    const setPromise = bulkWriter.set(doc, {foo: 'bar'}).then(incrementOpCount);
    const updatePromise = bulkWriter
      .update(doc, {foo: 'bar1'})
      .then(incrementOpCount);
    await setPromise;

    // Create a new batch by reaching the batch size limit.
    const createPromise = bulkWriter
      .create(doc2, {foo: 'bar1'})
      .then(incrementOpCount);

    await updatePromise;
    await createPromise;
    verifyOpCount(3);
    return bulkWriter.close();
  });

  it('sends batches automatically when the batch size limit is reached', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([
          setOp('doc1', 'bar'),
          updateOp('doc2', 'bar'),
          createOp('doc3', 'bar'),
        ]),
        response: mergeResponses([
          successResponse(1),
          successResponse(2),
          successResponse(3),
        ]),
      },
      {
        request: createRequest([deleteOp('doc4')]),
        response: successResponse(3),
      },
    ]);

    bulkWriter._setMaxBatchSize(3);
    const promise1 = bulkWriter
      .set(firestore.doc('collectionId/doc1'), {foo: 'bar'})
      .then(incrementOpCount);
    const promise2 = bulkWriter
      .update(firestore.doc('collectionId/doc2'), {foo: 'bar'})
      .then(incrementOpCount);
    const promise3 = bulkWriter
      .create(firestore.doc('collectionId/doc3'), {foo: 'bar'})
      .then(incrementOpCount);

    // The 4th write should not sent because it should be in a new batch.
    bulkWriter
      .delete(firestore.doc('collectionId/doc4'))
      .then(incrementOpCount);

    await Promise.all([promise1, promise2, promise3]).then(() => {
      verifyOpCount(3);
    });

    return bulkWriter.close().then(async () => {
      verifyOpCount(4);
    });
  });

  it('uses timeout for batches that exceed the rate limit', async () => {
    const bulkWriter = await instantiateInstance(
      [
        {
          request: createRequest([setOp('doc1', 'bar'), setOp('doc2', 'bar')]),
          response: mergeResponses([successResponse(1), successResponse(2)]),
        },
        {
          request: createRequest([setOp('doc1', 'bar')]),
          response: successResponse(3),
        },
      ],
      /* enforceSingleConcurrentRequest= */ true
    );
    bulkWriter.set(firestore.doc('collectionId/doc1'), {foo: 'bar'});
    bulkWriter.set(firestore.doc('collectionId/doc2'), {foo: 'bar'});
    const flush1 = bulkWriter.flush();
    // The third write will be placed in a new batch
    bulkWriter.set(firestore.doc('collectionId/doc1'), {foo: 'bar'});
    const flush2 = bulkWriter.flush();
    activeRequestDeferred.resolve();
    await flush1;
    await flush2;
    return bulkWriter.close();
  });

  it('supports different type converters', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([setOp('doc1', 'boo'), setOp('doc2', 'moo')]),
        response: mergeResponses([successResponse(1), successResponse(2)]),
      },
    ]);

    class Boo {}
    const booConverter = {
      toFirestore(): DocumentData {
        return {foo: 'boo'};
      },
      fromFirestore(): Boo {
        return new Boo();
      },
    };

    class Moo {}
    const mooConverter = {
      toFirestore(): DocumentData {
        return {foo: 'moo'};
      },
      fromFirestore(): Moo {
        return new Moo();
      },
    };

    const doc1 = firestore.doc('collectionId/doc1').withConverter(booConverter);
    const doc2 = firestore.doc('collectionId/doc2').withConverter(mooConverter);
    bulkWriter.set(doc1, new Boo()).then(incrementOpCount);
    bulkWriter.set(doc2, new Moo()).then(incrementOpCount);
    return bulkWriter.close().then(() => verifyOpCount(2));
  });

  it('retries individual rites that fail with ABORTED errors', async () => {
    setTimeoutHandler(setImmediate);
    // Create mock responses that simulate one successful write followed by
    // failed responses.
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([
          setOp('doc1', 'bar'),
          setOp('doc2', 'bar'),
          setOp('doc3', 'bar'),
        ]),
        response: mergeResponses([
          failedResponse(),
          failedResponse(Status.UNAVAILABLE),
          failedResponse(Status.ABORTED),
        ]),
      },
      {
        request: createRequest([setOp('doc2', 'bar'), setOp('doc3', 'bar')]),
        response: mergeResponses([
          successResponse(2),
          failedResponse(Status.ABORTED),
        ]),
      },
      {
        request: createRequest([setOp('doc3', 'bar')]),
        response: mergeResponses([successResponse(3)]),
      },
    ]);

    bulkWriter
      .set(firestore.doc('collectionId/doc1'), {
        foo: 'bar',
      })
      .catch(incrementOpCount);
    const set2 = bulkWriter.set(firestore.doc('collectionId/doc2'), {
      foo: 'bar',
    });
    const set3 = bulkWriter.set(firestore.doc('collectionId/doc3'), {
      foo: 'bar',
    });
    await bulkWriter.close();
    expect((await set2).writeTime).to.deep.equal(new Timestamp(2, 0));
    expect((await set3).writeTime).to.deep.equal(new Timestamp(3, 0));

    // Check that set1 was not retried
    verifyOpCount(1);
  });

  describe('Timeout handler tests', () => {
    // Return success responses for all requests.
    function instantiateInstance(): Promise<BulkWriter> {
      const overrides: ApiOverride = {
        batchWrite: request => {
          const requestLength = request.writes?.length || 0;
          const responses = mergeResponses(
            Array.from(new Array(requestLength), (_, i) => successResponse(i))
          );
          return response({
            writeResults: responses.writeResults,
            status: responses.status,
          });
        },
      };
      return createInstance(overrides).then(firestoreClient => {
        firestore = firestoreClient;
        return firestore._bulkWriter();
      });
    }

    it('does not send batches if doing so exceeds the rate limit', done => {
      instantiateInstance().then(bulkWriter => {
        let timeoutCalled = false;
        setTimeoutHandler((_, timeout) => {
          if (!timeoutCalled && timeout > 0) {
            timeoutCalled = true;
            done();
          }
        });

        for (let i = 0; i < 600; i++) {
          bulkWriter.set(firestore.doc('collectionId/doc' + i), {foo: 'bar'});
        }
        // The close() promise will never resolve. Since we do not call the
        // callback function in the overridden handler, subsequent requests
        // after the timeout will not be made. The close() call is used to
        // ensure that the final batch is sent.
        bulkWriter.close();
      });
    });
  });

  it('retries batchWrite when the RPC fails with retryable error', async () => {
    setTimeoutHandler(setImmediate);
    let retryAttempts = 0;
    function instantiateInstance(): Promise<BulkWriter> {
      const overrides: ApiOverride = {
        batchWrite: () => {
          retryAttempts++;
          if (retryAttempts < 5) {
            const error = new GoogleError('Mock batchWrite failed in test');
            error.code = Status.ABORTED;
            throw error;
          } else {
            const mockResponse = successResponse(1);
            return response({
              writeResults: mockResponse.writeResults,
              status: mockResponse.status,
            });
          }
        },
      };
      return createInstance(overrides).then(firestoreClient => {
        firestore = firestoreClient;
        return firestore._bulkWriter();
      });
    }
    const bulkWriter = await instantiateInstance();
    let writeResult: WriteResult;
    bulkWriter
      .create(firestore.doc('collectionId/doc'), {
        foo: 'bar',
      })
      .then(result => {
        incrementOpCount();
        writeResult = result;
      });
    return bulkWriter.close().then(async () => {
      expect(writeResult.writeTime.isEqual(new Timestamp(1, 0))).to.be.true;
    });
  });

  it('fails writes after all retry attempts failed', async () => {
    setTimeoutHandler(setImmediate);
    function instantiateInstance(): Promise<BulkWriter> {
      const overrides: ApiOverride = {
        batchWrite: () => {
          const error = new GoogleError('Mock batchWrite failed in test');
          error.code = Status.ABORTED;
          throw error;
        },
      };
      return createInstance(overrides).then(firestoreClient => {
        firestore = firestoreClient;
        return firestore._bulkWriter();
      });
    }
    const bulkWriter = await instantiateInstance();
    bulkWriter
      .create(firestore.doc('collectionId/doc'), {
        foo: 'bar',
      })
      .catch(err => {
        expect(err instanceof GoogleError && err.code === Status.ABORTED).to.be
          .true;
        incrementOpCount();
      });
    return bulkWriter.close().then(() => verifyOpCount(1));
  });

  describe('if bulkCommit() fails', async () => {
    function instantiateInstance(): Promise<BulkWriter> {
      const overrides: ApiOverride = {
        batchWrite: () => {
          throw new Error('Mock batchWrite failed in test');
        },
      };
      return createInstance(overrides).then(firestoreClient => {
        firestore = firestoreClient;
        return firestore._bulkWriter();
      });
    }
    it('flush() should not fail', async () => {
      const bulkWriter = await instantiateInstance();
      bulkWriter
        .create(firestore.doc('collectionId/doc'), {foo: 'bar'})
        .catch(incrementOpCount);
      bulkWriter
        .set(firestore.doc('collectionId/doc2'), {foo: 'bar'})
        .catch(incrementOpCount);
      await bulkWriter.flush();
      verifyOpCount(2);

      return bulkWriter.close();
    });

    it('close() should not fail', async () => {
      const bulkWriter = await instantiateInstance();
      bulkWriter
        .create(firestore.doc('collectionId/doc'), {foo: 'bar'})
        .catch(incrementOpCount);
      bulkWriter
        .set(firestore.doc('collectionId/doc2'), {foo: 'bar'})
        .catch(incrementOpCount);

      return bulkWriter.close().then(() => verifyOpCount(2));
    });

    it('all individual writes are rejected', async () => {
      const bulkWriter = await instantiateInstance();
      bulkWriter
        .create(firestore.doc('collectionId/doc'), {foo: 'bar'})
        .catch(err => {
          expect(err.message).to.equal('Mock batchWrite failed in test');
          incrementOpCount();
        });

      bulkWriter
        .set(firestore.doc('collectionId/doc2'), {foo: 'bar'})
        .catch(err => {
          expect(err.message).to.equal('Mock batchWrite failed in test');
          incrementOpCount();
        });

      return bulkWriter.close().then(() => verifyOpCount(2));
    });
  });
});
