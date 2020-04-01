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

import {FieldValue, Firestore, setLogFunction, Timestamp} from '../src';
import {BulkWriter} from '../src/bulk-writer';
import {
  ApiOverride,
  createInstance,
  response,
  verifyInstance,
} from './util/helpers';

const REQUEST_TIME = 'REQUEST_TIME';

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

describe('BulkWriter', () => {
  const documentNameRoot = `projects/${PROJECT_ID}/databases/(default)/documents/`;

  let firestore: Firestore;
  let bulkWriter: BulkWriter;
  let counter: number;

  beforeEach(() => {
    counter = -1;
  });

  function instantiateInstance(
    requests: BulkWriterRequest[],
    responses: BulkWriterResponse[]
  ): Promise<void> {
    const overrides: ApiOverride = {
      batchWrite: request => {
        counter++;
        expect(request).to.deep.eq({
          database: `projects/${PROJECT_ID}/databases/(default)`,
          writes: requests[counter].writes,
        });
        return response({
          writeResults: responses[counter].writeResults,
          status: responses[counter].status,
          // tslint:disable-next-line:no-any
        }) as any;
      },
    };
    return createInstance(overrides).then(firestoreClient => {
      firestore = firestoreClient;
      bulkWriter = firestore.bulkWriter();
    });
  }

  function createResponse(
    timestamps: Array<Timestamp | null>,
    statusCodes: number[]
  ): BulkWriterResponse {
    const writeResults = timestamps.map(timestamp => {
      return {
        updateTime:
          timestamp === null
            ? null
            : {
                nanos: timestamp.nanoseconds,
                seconds: timestamp.seconds,
              },
      };
    });
    const status = statusCodes.map(code => {
      return {code};
    });
    return {
      writeResults,
      status,
    };
  }

  afterEach(() => verifyInstance(firestore));

  it('sends writes to the same document in separate batches', async () => {
    const requests = [
      {
        writes: [
          {
            update: {
              fields: {},
              name: documentNameRoot + 'col/doc',
            },
            updateTransforms: [
              {
                fieldPath: 'foo',
                setToServerValue: REQUEST_TIME,
              },
            ],
          },
        ],
      },
      {
        writes: [
          {
            update: {
              fields: {
                foo: {
                  stringValue: 'bar',
                },
              },
              name: documentNameRoot + 'col/doc',
            },
            updateMask: {
              fieldPaths: ['foo'],
            },
          },
        ],
      },
    ];
    const responses: BulkWriterResponse[] = [
      createResponse([new Timestamp(0, 0)], [Status.OK]),
      createResponse([null], [Status.UNAVAILABLE]),
    ];
    await instantiateInstance(requests, responses);

    let completed = 0;
    const doc = firestore.doc('col/doc');
    bulkWriter.set(doc, {foo: FieldValue.serverTimestamp()}).then(result => {
      completed++;
      expect(result.writeTime!.isEqual(new Timestamp(0, 0))).to.be.true;
    });
    bulkWriter
      .update(doc, {foo: 'bar'})
      .then(() => {
        fail('Update should have failed');
      })
      .catch(err => {
        completed++;
        expect(err.code).to.equal(Status.UNAVAILABLE);
      });

    return bulkWriter.waitForPendingWrites().then(async () => {
      expect(completed).to.equal(2);
    });
  });

  it('sends writes to different documents in the same batch', async () => {
    const requests = [
      {
        writes: [
          {
            update: {
              fields: {},
              name: documentNameRoot + 'col/doc',
            },
            updateTransforms: [
              {
                fieldPath: 'foo',
                setToServerValue: REQUEST_TIME,
              },
            ],
          },
          {
            update: {
              fields: {
                foo: {
                  stringValue: 'bar',
                },
              },
              name: documentNameRoot + 'col/doc2',
            },
            updateMask: {
              fieldPaths: ['foo'],
            },
          },
        ],
      },
    ];
    const responses: BulkWriterResponse[] = [
      createResponse(
        [new Timestamp(0, 0), null],
        [Status.OK, Status.UNAVAILABLE]
      ),
    ];
    await instantiateInstance(requests, responses);

    let completed = 0;
    const doc1 = firestore.doc('col/doc');
    const doc2 = firestore.doc('col/doc2');
    bulkWriter.set(doc1, {foo: FieldValue.serverTimestamp()}).then(result => {
      completed++;
      expect(result.writeTime!.isEqual(new Timestamp(0, 0))).to.be.true;
    });
    bulkWriter
      .update(doc2, {foo: 'bar'})
      .then(() => {
        fail('Update should have failed');
      })
      .catch(err => {
        completed++;
        expect(err.code).to.equal(Status.UNAVAILABLE);
      });

    return bulkWriter.waitForPendingWrites().then(async () => {
      expect(completed).to.equal(2);
    });
  });
});
