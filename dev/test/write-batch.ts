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

import assert from 'power-assert';

import {google} from '../protos/firestore_proto_api';
import * as Firestore from '../src';
import {createInstance} from '../test/util/helpers';

const REQUEST_TIME = google.firestore.v1beta1.DocumentTransform.FieldTransform
                         .ServerValue.REQUEST_TIME;

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

const PROJECT_ID = 'test-project';

describe('set() method', () => {
  let firestore;
  let writeBatch;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', () => {
    assert.throws(
        () => writeBatch.set(),
        /Argument "documentRef" is not a valid DocumentReference\./);
  });

  it('requires object', () => {
    assert.throws(
        () => writeBatch.set(firestore.doc('sub/doc')),
        /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it('accepts preconditions', () => {
    writeBatch.set(firestore.doc('sub/doc'), {exists: false});
  });
});

describe('delete() method', () => {
  let firestore;
  let writeBatch;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', () => {
    assert.throws(
        () => writeBatch.delete(),
        /Argument "documentRef" is not a valid DocumentReference\./);
  });

  it('accepts preconditions', () => {
    writeBatch.delete(firestore.doc('sub/doc'), {
      lastUpdateTime: new Firestore.Timestamp(479978400, 123000000),
    });
  });
});

describe('update() method', () => {
  let firestore;
  let writeBatch;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', () => {
    assert.throws(
        () => writeBatch.update({}, {}),
        /Argument "documentRef" is not a valid DocumentReference\./);
  });

  it('requires object', () => {
    assert.throws(() => {
      writeBatch.update(firestore.doc('sub/doc'), firestore.doc('sub/doc'));
    }, /Argument "dataOrField" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it('accepts preconditions', () => {
    writeBatch.update(
        firestore.doc('sub/doc'), {foo: 'bar'},
        {lastUpdateTime: new Firestore.Timestamp(479978400, 123000000)});
  });
});

describe('create() method', () => {
  let firestore;
  let writeBatch;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', () => {
    assert.throws(
        () => writeBatch.create(),
        /Argument "documentRef" is not a valid DocumentReference\./);
  });

  it('requires object', () => {
    assert.throws(() => {
      writeBatch.create(firestore.doc('sub/doc'));
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });
});

describe('batch support', () => {
  const documentName =
      `projects/${PROJECT_ID}/databases/(default)/documents/col/doc`;

  let firestore;
  let writeBatch;

  beforeEach(() => {
    const overrides = {
      commit: (request, options, callback) => {
        assert.deepStrictEqual(request, {
          database: `projects/${PROJECT_ID}/databases/(default)`,
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
                    setToServerValue: REQUEST_TIME,
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
            // This write result conforms to the Write +
            // DocumentTransform and won't be returned in the response.
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
      }
    };
    return createInstance(overrides).then(firestoreClient => {
      firestore = firestoreClient;
      writeBatch = firestore.batch();
    });
  });

  function verifyResponse(writeResults) {
    assert.ok(writeResults[0].writeTime.isEqual(new Firestore.Timestamp(0, 0)));
    assert.ok(writeResults[1].writeTime.isEqual(new Firestore.Timestamp(1, 1)));
    assert.ok(writeResults[2].writeTime.isEqual(new Firestore.Timestamp(2, 2)));
    assert.ok(writeResults[3].writeTime.isEqual(new Firestore.Timestamp(3, 3)));
  }

  it('accepts multiple operations', () => {
    const documentName = firestore.doc('col/doc');

    writeBatch.set(documentName, {foo: Firestore.FieldValue.serverTimestamp()});
    writeBatch.update(documentName, {foo: 'bar'});
    writeBatch.create(documentName, {});
    writeBatch.delete(documentName);

    return writeBatch.commit().then(resp => {
      verifyResponse(resp);
    });
  });

  it('chains multiple operations', () => {
    const documentName = firestore.doc('col/doc');

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

  it('handles exception', () => {
    firestore.request = () => {
      return Promise.reject(new Error('Expected exception'));
    };

    return firestore.batch()
        .commit()
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(err.message, 'Expected exception');
        });
  });

  it('cannot append to committed batch', () => {
    const documentName = firestore.doc('col/doc');

    const batch = firestore.batch();
    batch.set(documentName, {foo: Firestore.FieldValue.serverTimestamp()});
    batch.update(documentName, {foo: 'bar'});
    batch.create(documentName, {});
    batch.delete(documentName);
    const promise = batch.commit();

    assert.throws(() => {
      batch.set(documentName, {});
    }, /Cannot modify a WriteBatch that has been committed./);

    return promise;
  });

  it('can commit an unmodified batch multiple times', () => {
    const documentName = firestore.doc('col/doc');

    const batch = firestore.batch();
    batch.set(documentName, {foo: Firestore.FieldValue.serverTimestamp()});
    batch.update(documentName, {foo: 'bar'});
    batch.create(documentName, {});
    batch.delete(documentName);
    return batch.commit().then(() => batch.commit);
  });

  it('can return same write result', () => {
    const overrides = {
      commit: (request, options, callback) => {
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
      }
    };

    return createInstance(overrides).then(firestore => {
      const documentName = firestore.doc('col/doc');

      const batch = firestore.batch();
      batch.set(documentName, {});
      batch.set(documentName, {});

      return batch.commit().then(results => {
        assert.ok(results[0].isEqual(results[1]));
      });
    });
  });

  it('uses transactions on GCF', () => {
    // We use this environment variable during initialization to detect whether
    // we are running on GCF.
    process.env.FUNCTION_TRIGGER_TYPE = 'http-trigger';

    let beginCalled = 0;
    let commitCalled = 0;

    const overrides = {
      beginTransaction: (actual, options, callback) => {
        ++beginCalled;
        callback(null, {transaction: 'foo'});
      },
      commit: (actual, options, callback) => {
        ++commitCalled;
        callback(null, {
          commitTime: {
            nanos: 0,
            seconds: 0,
          },
        });
      }
    };

    return createInstance(overrides).then(firestore => {
      firestore['_preferTransactions'] = true;
      firestore['_lastSuccessfulRequest'] = 0;

      return firestore.batch()
          .commit()
          .then(() => {
            // The first commit always uses a transcation.
            assert.equal(1, beginCalled);
            assert.equal(1, commitCalled);
            return firestore.batch().commit();
          })
          .then(() => {
            // The following commits don't use transactions if they happen
            // within two minutes.
            assert.equal(1, beginCalled);
            assert.equal(2, commitCalled);
            firestore['_lastSuccessfulRequest'] = 1337;
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
