/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const assert = require('power-assert');
const gax = require('google-gax');
const grpc = new gax.GrpcClient().grpc;
const through = require('through2');

const Firestore = require('../');
let firestore;

let PROJECT_ID = process.env.PROJECT_ID;
if (!PROJECT_ID) {
  PROJECT_ID = 'test-project';
}

const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const COLLECTION_ROOT = `${DATABASE_ROOT}/documents/collectionId`;
const DOCUMENT_NAME = `${COLLECTION_ROOT}/documentId`;

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});


function createInstance() {
  let firestore = new Firestore({
    projectId: PROJECT_ID,
    sslCreds: grpc.credentials.createInsecure(),
    timestampsInSnapshots: true,
  });

  return firestore._ensureClient().then(() => firestore);
}

function commit(transaction, writes, err) {
  let proto = {
    database: DATABASE_ROOT,
    transaction: transaction || 'foo',
  };

  proto.writes = writes || [];

  let response = {
    commitTime: {
      nanos: 0,
      seconds: 0,
    },
    writeResults: [],
  };

  for (let i = 0; i < proto.writes.length; ++i) {
    response.writeResults.push({
      updateTime: {
        nanos: 0,
        seconds: 0,
      },
    });
  }

  return {
    type: 'commit',
    request: proto,
    error: err,
    response: response,
  };
}

function rollback(transaction, err) {
  let proto = {
    database: DATABASE_ROOT,
    transaction: transaction || 'foo',
  };

  return {
    type: 'rollback',
    request: proto,
    error: err,
    response: {},
  };
}

function begin(transaction, prevTransaction, err) {
  let proto = {database: DATABASE_ROOT};

  if (prevTransaction) {
    proto.options = {
      readWrite: {
        retryTransaction: prevTransaction,
      },
    };
  }

  let response = {
    transaction: transaction || 'foo',
  };

  return {
    type: 'begin',
    request: proto,
    error: err,
    response: response,
  };
}

function getDocument(transaction) {
  let request = {
    database: DATABASE_ROOT,
    documents: [DOCUMENT_NAME],
    transaction: transaction || 'foo',
  };

  let stream = through.obj();

  setImmediate(function() {
    stream.push({
      found: {
        name: DOCUMENT_NAME,
        createTime: {seconds: 1, nanos: 2},
        updateTime: {seconds: 3, nanos: 4},
      },
      readTime: {seconds: 5, nanos: 6},
    });
    stream.push(null);
  });

  return {
    type: 'getDocument',
    request: request,
    stream: stream,
  };
}

function getAll(docs) {
  let request = {
    database: DATABASE_ROOT,
    documents: [],
    transaction: 'foo',
  };

  let stream = through.obj();

  for (const doc of docs) {
    const name = `${COLLECTION_ROOT}/${doc}`;
    request.documents.push(name);

    setImmediate(() => {
      stream.push({
        found: {
          name: name,
          createTime: {seconds: 1, nanos: 2},
          updateTime: {seconds: 3, nanos: 4},
        },
        readTime: {seconds: 5, nanos: 6},
      });
    });
  }

  setImmediate(function() {
    stream.push(null);
  });

  return {
    type: 'getDocument',
    request: request,
    stream: stream,
  };
}

function query(transaction) {
  let request = {
    parent: DATABASE_ROOT,
    structuredQuery: {
      from: [
        {
          collectionId: 'col',
        },
      ],
      where: {
        fieldFilter: {
          field: {
            fieldPath: 'foo',
          },
          op: 'EQUAL',
          value: {
            stringValue: 'bar',
            valueType: 'stringValue',
          },
        },
      },
    },
    transaction: transaction || 'foo',
  };

  let stream = through.obj();

  setImmediate(function() {
    stream.push({
      document: {
        name: DOCUMENT_NAME,
        createTime: {seconds: 1, nanos: 2},
        updateTime: {seconds: 3, nanos: 4},
      },
      readTime: {seconds: 5, nanos: 6},
    });

    stream.push(null);
  });

  return {
    type: 'query',
    request: request,
    stream: stream,
  };
}

function runTransaction(callback, request) {
  let requests = Array.prototype.slice.call(arguments, 1);

  firestore._firestoreClient._innerApiCalls.beginTransaction = function(
    actual,
    options,
    callback
  ) {
    request = requests.shift();
    assert.equal(request.type, 'begin');
    assert.deepEqual(actual, request.request);
    callback(request.error, request.response);
  };

  firestore._firestoreClient._innerApiCalls.commit = function(actual, options, callback) {
    request = requests.shift();
    assert.equal(request.type, 'commit');
    assert.deepEqual(actual, request.request);
    callback(request.error, request.response);
  };

  firestore._firestoreClient._innerApiCalls.rollback = function(actual, options, callback) {
    request = requests.shift();
    assert.equal(request.type, 'rollback');
    assert.deepEqual(actual, request.request);
    callback(request.error, request.response);
  };

  firestore._firestoreClient._innerApiCalls.batchGetDocuments = function(actual) {
    request = requests.shift();
    assert.equal(request.type, 'getDocument');
    assert.deepEqual(actual, request.request);
    return request.stream;
  };

  firestore._firestoreClient._innerApiCalls.runQuery = function(actual) {
    request = requests.shift();
    assert.equal(request.type, 'query');
    assert.deepEqual(actual, request.request);
    return request.stream;
  };

  return firestore
    .runTransaction(callback)
    .then(val => {
      assert.equal(requests.length, 0);
      return val;
    })
    .catch(err => {
      assert.equal(requests.length, 0);
      return Promise.reject(err);
    });
}

describe('successful transactions', function() {
  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('empty transaction', function() {
    return runTransaction(
      () => {
        return Promise.resolve();
      },
      begin(),
      commit()
    );
  });

  it('returns value', function() {
    return runTransaction(
      () => {
        return Promise.resolve('bar');
      },
      begin(),
      commit()
    ).then(val => {
      assert.equal(val, 'bar');
    });
  });
});

describe('failed transactions', function() {
  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('requires update function', function() {
    assert.throws(function() {
      return runTransaction();
    }, /Argument "updateFunction" is not a valid function\./);
  });

  it('requires valid retry number', function() {
    firestore._firestoreClient._innerApiCalls.beginTransaction = function() {
      assert.fail();
    };

    assert.throws(function() {
      firestore.runTransaction(() => {}, {maxAttempts: 'foo'});
    }, /Argument "transactionOptions.maxAttempts" is not a valid integer\./);

    assert.throws(function() {
      firestore.runTransaction(() => {}, {maxAttempts: 0});
    }, /Argument "transactionOptions.maxAttempts" is not a valid integer\./);
  });

  it('requires a promise', function() {
    return runTransaction(() => {}, begin(), rollback('foo'))
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(
          err.message,
          'You must return a Promise in your transaction()-callback.'
        );
      });
  });

  it('handles exception', function() {
    firestore.request = function() {
      return Promise.reject(new Error('Expected exception'));
    };

    return runTransaction(() => {
      return Promise.resolve();
    })
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Expected exception');
      });
  });

  it("doesn't retry on callback failure", function() {
    return runTransaction(
      () => {
        return Promise.reject('request exception');
      },
      begin(),
      rollback('foo')
    )
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err, 'request exception');
      });
  });

  it('retries on commit failure', function() {
    let userResult = ['failure', 'failure', 'success'];
    let serverError = new Error('Retryable error');

    return runTransaction(
      () => {
        return Promise.resolve(userResult.shift());
      },
      begin('foo1'),
      commit('foo1', [], serverError),
      begin('foo2', 'foo1'),
      commit('foo2', [], serverError),
      begin('foo3', 'foo2'),
      commit('foo3')
    ).then(red => {
      assert.equal(red, 'success');
    });
  });

  it('limits the retry attempts', function() {
    let err = new Error('Retryable error');

    return runTransaction(
      () => {
        return Promise.resolve('success');
      },
      begin('foo1'),
      commit('foo1', [], err),
      begin('foo2', 'foo1'),
      commit('foo2', [], err),
      begin('foo3', 'foo2'),
      commit('foo3', [], err),
      begin('foo4', 'foo3'),
      commit('foo4', [], err),
      begin('foo5', 'foo4'),
      commit('foo5', [], new Error('Final exception'))
    )
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Final exception');
      });
  });

  it('fails on beginTransaction', function() {
    return runTransaction(
      () => {
        return Promise.resolve('success');
      },
      begin('foo', null, new Error('Fails (1) on beginTransaction')),
      begin('foo', null, new Error('Fails (2) on beginTransaction')),
      begin('foo', null, new Error('Fails (3) on beginTransaction')),
      begin('foo', null, new Error('Fails (4) on beginTransaction')),
      begin('foo', null, new Error('Fails (5) on beginTransaction'))
    )
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Fails (5) on beginTransaction');
      });
  });

  it('fails on rollback', function() {
    return runTransaction(
      () => {
        return Promise.reject();
      },
      begin(),
      rollback('foo', new Error('Fails on rollback'))
    )
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Fails on rollback');
      });
  });
});

describe('transaction operations', function() {
  let docRef;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
      docRef = firestore.doc('collectionId/documentId');
    });
  });

  it('support get with document ref', function() {
    return runTransaction(
      transaction => {
        return transaction.get(docRef).then(doc => {
          assert.equal(doc.id, 'documentId');
        });
      },
      begin(),
      getDocument(),
      commit()
    );
  });

  it('requires a query or document for get', function() {
    return runTransaction(
      transaction => {
        assert.throws(() => {
          transaction.get();
        }, /Argument "refOrQuery" must be a DocumentRef or a Query\./);

        assert.throws(() => {
          transaction.get('foo');
        }, /Argument "refOrQuery" must be a DocumentRef or a Query\./);

        return Promise.resolve();
      },
      begin(),
      commit()
    );
  });

  it('enforce that gets come before writes', function() {
    return runTransaction(transaction => {
      transaction.set(docRef, {foo: 'bar'});
      return transaction.get(docRef);
    }, begin())
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(
          err.message,
          'Firestore transactions require all reads to ' +
            'be executed before all writes.'
        );
      });
  });

  it('support get with query', function() {
    return runTransaction(
      transaction => {
        let query = firestore.collection('col').where('foo', '==', 'bar');
        return transaction.get(query).then(results => {
          assert.equal(results.docs[0].id, 'documentId');
        });
      },
      begin(),
      query(),
      commit()
    );
  });

  it('support getAll', function() {
    const firstDoc = firestore.doc('collectionId/firstDocument');
    const secondDoc = firestore.doc('collectionId/secondDocument');

    return runTransaction(
      transaction => {
        return transaction.getAll(firstDoc, secondDoc).then(docs => {
          assert.equal(docs.length, 2);
          assert.equal(docs[0].id, 'firstDocument');
          assert.equal(docs[1].id, 'secondDocument');
        });
      },
      begin(),
      getAll(['firstDocument', 'secondDocument']),
      commit()
    );
  });

  it('enforce that getAll come before writes', function() {
    return runTransaction(transaction => {
      transaction.set(docRef, {foo: 'bar'});
      return transaction.getAll(docRef);
    }, begin())
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(
          err.message,
          'Firestore transactions require all reads to ' +
            'be executed before all writes.'
        );
      });
  });

  it('support create', function() {
    let create = {
      currentDocument: {
        exists: false,
      },
      update: {
        fields: {},
        name: DOCUMENT_NAME,
      },
    };

    return runTransaction(
      transaction => {
        transaction.create(docRef, {});
        return Promise.resolve();
      },
      begin(),
      commit(null, [create])
    );
  });

  it('support update', function() {
    let update = {
      currentDocument: {
        exists: true,
      },
      update: {
        fields: {
          a: {
            valueType: 'mapValue',
            mapValue: {
              fields: {
                b: {
                  valueType: 'stringValue',
                  stringValue: 'c',
                },
              },
            },
          },
        },
        name: DOCUMENT_NAME,
      },
      updateMask: {
        fieldPaths: ['a.b'],
      },
    };

    return runTransaction(
      transaction => {
        transaction.update(docRef, {'a.b': 'c'});
        transaction.update(docRef, 'a.b', 'c');
        transaction.update(docRef, new Firestore.FieldPath('a', 'b'), 'c');
        return Promise.resolve();
      },
      begin(),
      commit(null, [update, update, update])
    );
  });

  it('support set', function() {
    let set = {
      update: {
        fields: {
          'a.b': {
            valueType: 'stringValue',
            stringValue: 'c',
          },
        },
        name: DOCUMENT_NAME,
      },
    };

    return runTransaction(
      transaction => {
        transaction.set(docRef, {'a.b': 'c'});
        return Promise.resolve();
      },
      begin(),
      commit(null, [set])
    );
  });

  it('support set with merge', function() {
    let set = {
      update: {
        fields: {
          'a.b': {
            valueType: 'stringValue',
            stringValue: 'c',
          },
        },
        name: DOCUMENT_NAME,
      },
      updateMask: {
        fieldPaths: ['`a.b`'],
      },
    };

    return runTransaction(
      transaction => {
        transaction.set(docRef, {'a.b': 'c'}, {merge: true});
        return Promise.resolve();
      },
      begin(),
      commit(null, [set])
    );
  });

  it('support delete', function() {
    let remove = {
      delete: DOCUMENT_NAME,
    };

    return runTransaction(
      transaction => {
        transaction.delete(docRef);
        return Promise.resolve();
      },
      begin(),
      commit(null, [remove])
    );
  });

  it('support multiple writes', function() {
    let remove = {
      delete: DOCUMENT_NAME,
    };

    let set = {
      update: {
        fields: {},
        name: DOCUMENT_NAME,
      },
    };

    return runTransaction(
      transaction => {
        transaction.delete(docRef).set(docRef, {});
        return Promise.resolve();
      },
      begin(),
      commit(null, [remove, set])
    );
  });
});
