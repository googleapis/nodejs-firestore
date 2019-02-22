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

import {expect} from 'chai';

import {FieldValue, Firestore, setLogFunction, Timestamp, WriteBatch, WriteResult} from '../src';
import {ApiOverride, createInstance, InvalidApiUsage} from './util/helpers';

const REQUEST_TIME = 'REQUEST_TIME';

// Change the argument to 'console.log' to enable debug output.
setLogFunction(() => {});

const PROJECT_ID = 'test-project';

describe('set() method', () => {
  let firestore: Firestore;
  let writeBatch: WriteBatch;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', () => {
    expect(() => (writeBatch as InvalidApiUsage).set())
        .to.throw('Argument "documentRef" is not a valid DocumentReference.');
  });

  it('requires object', () => {
    expect(() => (writeBatch as InvalidApiUsage).set(firestore.doc('sub/doc')))
        .to.throw(
            'Argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.');
  });

  it('accepts preconditions', () => {
    writeBatch.set(firestore.doc('sub/doc'), {exists: false});
  });
});

describe('delete() method', () => {
  let firestore: Firestore;
  let writeBatch: WriteBatch;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', () => {
    expect(() => (writeBatch as InvalidApiUsage).delete())
        .to.throw('Argument "documentRef" is not a valid DocumentReference.');
  });

  it('accepts preconditions', () => {
    writeBatch.delete(firestore.doc('sub/doc'), {
      lastUpdateTime: new Timestamp(479978400, 123000000),
    });
  });
});

describe('update() method', () => {
  let firestore: Firestore;
  let writeBatch: WriteBatch;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', () => {
    expect(() => writeBatch.update({} as InvalidApiUsage, {}))
        .to.throw('Argument "documentRef" is not a valid DocumentReference.');
  });

  it('requires object', () => {
    expect(() => {
      writeBatch.update(firestore.doc('sub/doc'), firestore.doc('sub/doc'));
    })
        .to.throw(
            'Update() requires either a single JavaScript object or an alternating list of field/value pairs that can be followed by an optional precondition. Argument "dataOrField" is not a valid Firestore document. Detected an object of type "DocumentReference" that doesn\'t match the expected instance. Please ensure that the Firestore types you are using are from the same NPM package.');
  });

  it('accepts preconditions', () => {
    writeBatch.update(
        firestore.doc('sub/doc'), {foo: 'bar'},
        {lastUpdateTime: new Timestamp(479978400, 123000000)});
  });
});

describe('create() method', () => {
  let firestore: Firestore;
  let writeBatch: WriteBatch;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
      writeBatch = firestore.batch();
    });
  });

  it('requires document name', () => {
    expect(() => (writeBatch as InvalidApiUsage).create())
        .to.throw('Argument "documentRef" is not a valid DocumentReference.');
  });

  it('requires object', () => {
    expect(() => {
      (writeBatch as InvalidApiUsage).create(firestore.doc('sub/doc'));
    })
        .to.throw(
            'Argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.');
  });
});

describe('batch support', () => {
  const documentName =
      `projects/${PROJECT_ID}/databases/(default)/documents/col/doc`;

  let firestore: Firestore;
  let writeBatch: WriteBatch;

  beforeEach(() => {
    const overrides: ApiOverride = {
      commit: (request, options, callback) => {
        expect(request).to.deep.eq({
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

  function verifyResponse(writeResults: WriteResult[]) {
    expect(writeResults[0].writeTime.isEqual(new Timestamp(0, 0))).to.be.true;
    expect(writeResults[1].writeTime.isEqual(new Timestamp(1, 1))).to.be.true;
    expect(writeResults[2].writeTime.isEqual(new Timestamp(2, 2))).to.be.true;
    expect(writeResults[3].writeTime.isEqual(new Timestamp(3, 3))).to.be.true;
  }

  it('accepts multiple operations', () => {
    const documentName = firestore.doc('col/doc');

    writeBatch.set(documentName, {foo: FieldValue.serverTimestamp()});
    writeBatch.update(documentName, {foo: 'bar'});
    writeBatch.create(documentName, {});
    writeBatch.delete(documentName);

    return writeBatch.commit().then(resp => {
      verifyResponse(resp);
    });
  });

  it('chains multiple operations', () => {
    const documentName = firestore.doc('col/doc');

    return writeBatch.set(documentName, {foo: FieldValue.serverTimestamp()})
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
          expect(err.message).to.equal('Expected exception');
        });
  });

  it('cannot append to committed batch', () => {
    const documentName = firestore.doc('col/doc');

    const batch = firestore.batch();
    batch.set(documentName, {foo: FieldValue.serverTimestamp()});
    batch.update(documentName, {foo: 'bar'});
    batch.create(documentName, {});
    batch.delete(documentName);
    const promise = batch.commit();

    expect(() => {
      batch.set(documentName, {});
    }).to.throw('Cannot modify a WriteBatch that has been committed.');

    return promise;
  });

  it('can commit an unmodified batch multiple times', () => {
    const documentName = firestore.doc('col/doc');

    const batch = firestore.batch();
    batch.set(documentName, {foo: FieldValue.serverTimestamp()});
    batch.update(documentName, {foo: 'bar'});
    batch.create(documentName, {});
    batch.delete(documentName);
    return batch.commit().then(() => batch.commit);
  });

  it('can return same write result', () => {
    const overrides: ApiOverride = {
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
        expect(results[0].isEqual(results[1])).to.be.true;
      });
    });
  });

  it('uses transactions on GCF', () => {
    // We use this environment variable during initialization to detect whether
    // we are running on GCF.
    process.env.FUNCTION_TRIGGER_TYPE = 'http-trigger';

    let beginCalled = 0;
    let commitCalled = 0;

    const overrides: ApiOverride = {
      beginTransaction: (actual, options, callback) => {
        ++beginCalled;
        callback(null, {transaction: Buffer.from('foo')});
      },
      commit: (request, options, callback) => {
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
            expect(beginCalled).to.equal(1);
            expect(commitCalled).to.equal(1);
            return firestore.batch().commit();
          })
          .then(() => {
            // The following commits don't use transactions if they happen
            // within two minutes.
            expect(beginCalled).to.equal(1);
            expect(commitCalled).to.equal(2);
            firestore['_lastSuccessfulRequest'] = 1337;
            return firestore.batch().commit();
          })
          .then(() => {
            expect(beginCalled).to.equal(2);
            expect(commitCalled).to.equal(3);
            delete process.env.FUNCTION_TRIGGER_TYPE;
          });
    });
  });
});
