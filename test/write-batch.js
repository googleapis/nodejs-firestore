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

const assert = require('power-assert');
const gax = require('google-gax');
const grpc = new gax.GrpcClient().grpc;

const Firestore = require('../');

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

function createInstance() {
  let firestore = new Firestore({
    projectId: 'test-project',
    sslCreds: grpc.credentials.createInsecure(),
  });

  return firestore._ensureClient().then(() => firestore);
}

describe('set() method', function() {
  let firestore;
  let writeBatch;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', function() {
    assert.throws(function() {
      writeBatch.set();
    }, /Argument "documentRef" is not a valid DocumentReference\./);
  });

  it('requires object', function() {
    assert.throws(function() {
      writeBatch.set(firestore.doc('sub/doc'));
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it('accepts preconditions', function() {
    writeBatch.set(firestore.doc('sub/doc'), {exists: false});
  });
});

describe('delete() method', function() {
  let firestore;
  let writeBatch;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', function() {
    assert.throws(function() {
      writeBatch.delete();
    }, /Argument "documentRef" is not a valid DocumentReference\./);
  });

  it('accepts preconditions', function() {
    writeBatch.delete(firestore.doc('sub/doc'), {
      lastUpdateTime: '1985-03-17T22:20:00.123000000Z',
    });
  });
});

describe('update() method', function() {
  let firestore;
  let writeBatch;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', function() {
    assert.throws(() => {
      writeBatch.update({}, {});
    }, /Argument "documentRef" is not a valid DocumentReference\./);
  });

  it('requires object', function() {
    assert.throws(() => {
      writeBatch.update(firestore.doc('sub/doc'), firestore.doc('sub/doc'));
    }, /Argument "dataOrField" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it('accepts preconditions', function() {
    writeBatch.update(
      firestore.doc('sub/doc'),
      {foo: 'bar'},
      {lastUpdateTime: '1985-03-17T22:20:00.123000000Z'}
    );
  });
});

describe('create() method', function() {
  let firestore;
  let writeBatch;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', function() {
    assert.throws(function() {
      writeBatch.create();
    }, /Argument "documentRef" is not a valid DocumentReference\./);
  });

  it('requires object', function() {
    assert.throws(function() {
      writeBatch.create(firestore.doc('sub/doc'));
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });
});

describe('batch support', function() {
  const documentName =
    'projects/test-project/databases/(default)/documents/col/doc';

  let firestore;
  let writeBatch;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
      writeBatch = firestore.batch();

      firestore._firestoreClient._commit = function(
        request,
        options,
        callback
      ) {
        assert.deepEqual(request, {
          database: 'projects/test-project/databases/(default)',
          writes: [
            {
              update: {
                fields: {},
                name: documentName,
              },
            },
            {
              transform: {
                document: documentName,
                fieldTransforms: [
                  {
                    fieldPath: 'foo',
                    setToServerValue: 'REQUEST_TIME',
                  },
                ],
              },
            },
            {
              currentDocument: {
                exists: true,
              },
              update: {
                fields: {
                  foo: {
                    stringValue: 'bar',
                    valueType: 'stringValue',
                  },
                },
                name: documentName,
              },
              updateMask: {
                fieldPaths: ['foo'],
              },
            },
            {
              currentDocument: {
                exists: false,
              },
              update: {
                fields: {},
                name: documentName,
              },
            },
            {
              delete: documentName,
            },
          ],
        });
        callback(null, {
          commitTime: {
            nanos: 0,
            seconds: 0,
          },
          writeResults: [
            // This write result conforms to the Write + DocumentTransform and
            // won't be returned in the response.
            {
              updateTime: {
                nanos: 1337,
                seconds: 1337,
              },
            },
            {
              updateTime: {
                nanos: 0,
                seconds: 0,
              },
            },
            {
              updateTime: {
                nanos: 1,
                seconds: 1,
              },
            },
            {
              updateTime: {
                nanos: 2,
                seconds: 2,
              },
            },
            {
              updateTime: {
                nanos: 3,
                seconds: 3,
              },
            },
          ],
        });
      };
    });
  });

  function verifyResponse(writeResults) {
    assert.equal(writeResults[0].writeTime, '1970-01-01T00:00:00.000000000Z');
    assert.equal(writeResults[1].writeTime, '1970-01-01T00:00:01.000000001Z');
    assert.equal(writeResults[2].writeTime, '1970-01-01T00:00:02.000000002Z');
    assert.equal(writeResults[3].writeTime, '1970-01-01T00:00:03.000000003Z');
  }

  it('accepts multiple operations', function() {
    let documentName = firestore.doc('col/doc');

    writeBatch.set(documentName, {foo: Firestore.FieldValue.serverTimestamp()});
    writeBatch.update(documentName, {foo: 'bar'});
    writeBatch.create(documentName, {});
    writeBatch.delete(documentName);

    return writeBatch.commit().then(resp => {
      verifyResponse(resp);
    });
  });

  it('chains multiple operations', function() {
    let documentName = firestore.doc('col/doc');

    return writeBatch
      .set(documentName, {foo: Firestore.FieldValue.serverTimestamp()})
      .update(documentName, {foo: 'bar'})
      .create(documentName, {})
      .delete(documentName)
      .commit()
      .then(resp => {
        verifyResponse(resp);
      });
  });

  it('handles exception', function() {
    firestore.request = function() {
      return Promise.reject(new Error('Expected exception'));
    };

    return firestore
      .batch()
      .commit()
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Expected exception');
      });
  });

  it('cannot append to committed batch', function() {
    let documentName = firestore.doc('col/doc');

    let batch = firestore.batch();
    batch.set(documentName, {foo: Firestore.FieldValue.serverTimestamp()});
    batch.update(documentName, {foo: 'bar'});
    batch.create(documentName, {});
    batch.delete(documentName);
    let promise = batch.commit();

    assert.throws(() => {
      batch.set(documentName, {});
    }, /Cannot modify a WriteBatch that has been committed./);

    return promise;
  });

  it('can commit an unmodified batch multiple times', function() {
    let documentName = firestore.doc('col/doc');

    let batch = firestore.batch();
    batch.set(documentName, {foo: Firestore.FieldValue.serverTimestamp()});
    batch.update(documentName, {foo: 'bar'});
    batch.create(documentName, {});
    batch.delete(documentName);
    return batch.commit().then(() => batch.commit);
  });

  it('can return same write result', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      callback(null, {
        commitTime: {
          nanos: 0,
          seconds: 0,
        },
        writeResults: [
          {
            updateTime: {
              nanos: 0,
              seconds: 0,
            },
          },
          {
            updateTime: {},
          },
        ],
      });
    };

    let documentName = firestore.doc('col/doc');

    let batch = firestore.batch();
    batch.set(documentName, {});
    batch.set(documentName, {});

    return batch.commit().then(results => {
      assert.ok(results[0].isEqual(results[1]));
    });
  });

  it('uses transactions on GCF', function() {
    // We use this environment variable during initialization to detect whether
    // we are running on GCF.
    process.env.FUNCTION_TRIGGER_TYPE = 'http-trigger';

    return createInstance().then(firestore => {
      firestore._preferTransactions = true;
      firestore._lastSuccessfulRequest = null;

      let beginCalled = 0;
      let commitCalled = 0;

      firestore._firestoreClient._beginTransaction = function(
        actual,
        options,
        callback
      ) {
        ++beginCalled;
        callback(null, {transaction: 'foo'});
      };

      firestore._firestoreClient._commit = function(actual, options, callback) {
        ++commitCalled;
        callback(null, {
          commitTime: {
            nanos: 0,
            seconds: 0,
          },
        });
      };

      return firestore
        .batch()
        .commit()
        .then(() => {
          // The first commit always uses a transcation.
          assert.equal(1, beginCalled);
          assert.equal(1, commitCalled);
          return firestore.batch().commit();
        })
        .then(() => {
          // The following commits don't use transactions if they happen within two
          // minutes.
          assert.equal(1, beginCalled);
          assert.equal(2, commitCalled);
          firestore._lastSuccessfulRequest = new Date(1337);
          return firestore.batch().commit();
        })
        .then(() => {
          assert.equal(2, beginCalled);
          assert.equal(3, commitCalled);
          delete process.env.FUNCTION_TRIGGER_TYPE;
        });
    });
  });
});
