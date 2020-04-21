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
import {Status} from 'google-gax';

import * as proto from '../protos/firestore_v1_proto_api';
import {Firestore, setLogFunction, Timestamp, WriteResult} from '../src';
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
import {setTimeoutHandler} from '../src/backoff';

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
  const activeRequestDeferred = new Deferred<void>();
  let activeRequestCounter = 0;

  beforeEach(() => {
    requestCounter = 0;
    opCount = 0;
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

  function successResponse(seconds: number): api.IBatchWriteResponse {
    return {
      writeResults: [
        {
          updateTime: {
            nanos: 0,
            seconds,
          },
        },
      ],
      status: [{code: Status.OK}],
    };
  }

  function failResponse(): api.IBatchWriteResponse {
    return {
      writeResults: [
        {
          updateTime: null,
        },
      ],
      status: [{code: Status.UNAVAILABLE}],
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
      batchWrite: async request => {
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
      return firestore.bulkWriter();
    });
  }

  afterEach(() => verifyInstance(firestore));

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
        response: failResponse(),
      },
    ]);

    const doc = firestore.doc('collectionId/doc');
    bulkWriter.set(doc, {foo: 'bar'}).catch(err => {
      incrementOpCount();
      expect(err.code).to.equal(Status.UNAVAILABLE);
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
    expect(bulkWriter.close()).to.eventually.be.rejectedWith(expected);
  });

  it('sends writes to the same document in separate batches', async () => {
    const bulkWriter = await instantiateInstance([
      {
        request: createRequest([setOp('doc', 'bar')]),
        response: successResponse(0),
      },
      {
        request: createRequest([updateOp('doc', 'bar1')]),
        response: successResponse(1),
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
        response: mergeResponses([successResponse(0), successResponse(1)]),
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
        response: successResponse(0),
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
          successResponse(0),
          successResponse(1),
          successResponse(2),
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

  it('does not send batches if a document containing the same write is in flight', async () => {
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

  describe('500/50/5 support', () => {
    afterEach(() => setTimeoutHandler(setTimeout));

    it('does not send batches if doing so exceeds the rate limit', done => {
      // The test is considered a success if BulkWriter tries to send the second
      // batch again after a timeout.

      const arrayRange = Array.from(new Array(500), (_, i) => i);
      const requests1 = arrayRange.map(i => setOp('doc' + i, 'bar'));
      const responses1 = arrayRange.map(i => successResponse(i));
      const arrayRange2 = [500, 501, 502, 503, 504];
      const requests2 = arrayRange2.map(i => setOp('doc' + i, 'bar'));
      const responses2 = arrayRange2.map(i => successResponse(i));

      instantiateInstance([
        {
          request: createRequest(requests1),
          response: mergeResponses(responses1),
        },
        {
          request: createRequest(requests2),
          response: mergeResponses(responses2),
        },
      ]).then(bulkWriter => {
        setTimeoutHandler(() =>
          done(new Error('This batch should not have a timeout'))
        );
        for (let i = 0; i < 500; i++) {
          bulkWriter
            .set(firestore.doc('collectionId/doc' + i), {foo: 'bar'})
            .then(incrementOpCount);
        }
        bulkWriter.flush();

        // Sending this next batch would go over the 500/50/5 capacity, so
        // check that BulkWriter doesn't send this batch until the first batch
        // is resolved.
        setTimeoutHandler((_, timeout) => {
          // Check that BulkWriter has not yet sent the 2nd batch.
          expect(requestCounter).to.equal(0);
          expect(timeout).to.be.greaterThan(0);
          done();
        });
        for (let i = 500; i < 505; i++) {
          bulkWriter
            .set(firestore.doc('collectionId/doc' + i), {foo: 'bar'})
            .then(incrementOpCount);
        }
        return bulkWriter.flush();
      });
    });
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
        return firestore.bulkWriter();
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
