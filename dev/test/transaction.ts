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

import assert from 'power-assert';
import through2 from 'through2';

import {google} from '../protos/firestore_proto_api';

import * as Firestore from '../src';
import {createInstance, InvalidApiUsage} from '../test/util/helpers';

import api = google.firestore.v1beta1;
import {AnyDuringMigration} from '../src/types';
import firestore = google.firestore;

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const COLLECTION_ROOT = `${DATABASE_ROOT}/documents/collectionId`;
const DOCUMENT_NAME = `${COLLECTION_ROOT}/documentId`;

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

function commit(transaction?, writes?, err?) {
  const proto: api.ICommitRequest = {
    database: DATABASE_ROOT,
    transaction: transaction || 'foo',
  };

  proto.writes = writes || [];

  const response: api.ICommitResponse = {
    commitTime: {
      nanos: 0,
      seconds: 0,
    },
    writeResults: [],
  };

  for (let i = 0; i < proto.writes!.length; ++i) {
    response.writeResults!.push({
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
    response,
  };
}

function rollback(transaction?, err?) {
  const proto = {
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

function begin(transaction?, prevTransaction?, err?) {
  const proto: api.IBeginTransactionRequest = {database: DATABASE_ROOT};

  if (prevTransaction) {
    proto.options = {
      readWrite: {
        retryTransaction: prevTransaction,
      },
    };
  }

  const response = {
    transaction: transaction || 'foo',
  };

  return {
    type: 'begin',
    request: proto,
    error: err,
    response,
  };
}

function getDocument(transaction?) {
  const request = {
    database: DATABASE_ROOT,
    documents: [DOCUMENT_NAME],
    transaction: transaction || 'foo',
  };

  const stream = through2.obj();

  setImmediate(() => {
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
    request,
    stream,
  };
}

function getAll(docs) {
  const request: api.IBatchGetDocumentsRequest = {
    database: DATABASE_ROOT,
    documents: [],
    transaction: 'foo' as AnyDuringMigration,
  };

  const stream = through2.obj();

  for (const doc of docs) {
    const name = `${COLLECTION_ROOT}/${doc}`;
    request.documents!.push(name);

    setImmediate(() => {
      stream.push({
        found: {
          name,
          createTime: {seconds: 1, nanos: 2},
          updateTime: {seconds: 3, nanos: 4},
        },
        readTime: {seconds: 5, nanos: 6},
      });
    });
  }

  setImmediate(() => {
    stream.push(null);
  });

  return {
    type: 'getDocument',
    request,
    stream,
  };
}

function query(transaction?) {
  const request = {
    parent: DATABASE_ROOT,
    structuredQuery: {
      from: [
        {
          collectionId: 'collectionId',
        },
      ],
      where: {
        fieldFilter: {
          field: {
            fieldPath: 'foo',
          },
          op: api.StructuredQuery.FieldFilter.Operator.EQUAL,
          value: {
            stringValue: 'bar',
          },
        },
      },
    },
    transaction: transaction || 'foo',
  };

  const stream = through2.obj();

  setImmediate(() => {
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
    request,
    stream,
  };
}

/**
 * Asserts that the given transaction function issues the expected requests.
 */
function runTransaction<T>(
    transactionCallback: (transaction, docRef) => Promise<T>,
    ...expectedRequests) {
  const overrides = {
    beginTransaction: (actual, options, callback) => {
      const request = expectedRequests.shift();
      assert.equal(request.type, 'begin');
      assert.deepStrictEqual(actual, request.request);
      callback(request.error, request.response);
    },
    commit: (actual, options, callback) => {
      const request = expectedRequests.shift();
      assert.equal(request.type, 'commit');
      assert.deepStrictEqual(actual, request.request);
      callback(request.error, request.response);
    },
    rollback: (actual, options, callback) => {
      const request = expectedRequests.shift();
      assert.equal(request.type, 'rollback');
      assert.deepStrictEqual(actual, request.request);
      callback(request.error, request.response);
    },
    batchGetDocuments: (actual) => {
      const request = expectedRequests.shift();
      assert.equal(request.type, 'getDocument');
      assert.deepStrictEqual(actual, request.request);
      return request.stream;
    },
    runQuery: (actual) => {
      const request = expectedRequests.shift();
      assert.equal(request.type, 'query');
      assert.deepStrictEqual(actual, request.request);
      return request.stream;
    }
  };

  return createInstance(overrides).then(firestore => {
    return firestore
        .runTransaction(transaction => {
          const docRef = firestore.doc('collectionId/documentId');
          return transactionCallback(transaction, docRef);
        })
        .then(val => {
          assert.equal(expectedRequests.length, 0);
          return val;
        })
        .catch(err => {
          assert.equal(expectedRequests.length, 0);
          return Promise.reject(err);
        });
  });
}

describe('successful transactions', () => {
  it('empty transaction', () => {
    return runTransaction(() => {
      return Promise.resolve();
    }, begin(), commit());
  });

  it('returns value', () => {
    return runTransaction(() => {
             return Promise.resolve('bar');
           }, begin(), commit()).then(val => {
      assert.equal(val, 'bar');
    });
  });
});

describe('failed transactions', () => {
  it('requires update function', () => {
    const overrides = {
      beginTransaction: () => {
        assert.fail();
      }
    };

    return createInstance(overrides).then(firestore => {
      assert.throws(
          () => (firestore as InvalidApiUsage).runTransaction(),
          /Argument "updateFunction" is not a valid function\./);
    });
  });

  it('requires valid retry number', () => {
    const overrides = {
      beginTransaction: () => {
        assert.fail();
      }
    };

    return createInstance(overrides).then(firestore => {
      assert.throws(
          () => firestore.runTransaction(
              () => Promise.resolve(), {maxAttempts: 'foo' as InvalidApiUsage}),
          /Argument "transactionOptions.maxAttempts" is not a valid integer\./);

      assert.throws(
          () => firestore.runTransaction(
              () => Promise.resolve(), {maxAttempts: 0}),
          /Argument "transactionOptions.maxAttempts" is not a valid integer\./);
    });
  });

  it('requires a promise', () => {
    return runTransaction(
               (() => {}) as AnyDuringMigration, begin(), rollback('foo'))
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(
              err.message,
              'You must return a Promise in your transaction()-callback.');
        });
  });

  it('handles exception', () => {
    return createInstance().then(firestore => {
      firestore.request = () => {
        return Promise.reject(new Error('Expected exception'));
      };

      return firestore
          .runTransaction(() => {
            return Promise.resolve();
          })
          .then(() => {
            throw new Error('Unexpected success in Promise');
          })
          .catch(err => {
            assert.equal(err.message, 'Expected exception');
          });
    });
  });

  it('doesn\'t retry on callback failure', () => {
    return runTransaction(
               () => {
                 return Promise.reject('request exception');
               },
               begin(), rollback('foo'))
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(err, 'request exception');
        });
  });

  it('retries on commit failure', () => {
    const userResult = ['failure', 'failure', 'success'];
    const serverError = new Error('Retryable error');

    return runTransaction(
               () => {
                 return Promise.resolve(userResult.shift());
               },
               begin('foo1'), commit('foo1', [], serverError),
               begin('foo2', 'foo1'), commit('foo2', [], serverError),
               begin('foo3', 'foo2'), commit('foo3'))
        .then(red => {
          assert.equal(red, 'success');
        });
  });

  it('limits the retry attempts', () => {
    const err = new Error('Retryable error');

    return runTransaction(
               () => {
                 return Promise.resolve('success');
               },
               begin('foo1'), commit('foo1', [], err), begin('foo2', 'foo1'),
               commit('foo2', [], err), begin('foo3', 'foo2'),
               commit('foo3', [], err), begin('foo4', 'foo3'),
               commit('foo4', [], err), begin('foo5', 'foo4'),
               commit('foo5', [], new Error('Final exception')))
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(err.message, 'Final exception');
        });
  });

  it('fails on beginTransaction', () => {
    return runTransaction(
               () => {
                 return Promise.resolve('success');
               },
               begin('foo', null, new Error('Fails (1) on beginTransaction')),
               begin('foo', null, new Error('Fails (2) on beginTransaction')),
               begin('foo', null, new Error('Fails (3) on beginTransaction')),
               begin('foo', null, new Error('Fails (4) on beginTransaction')),
               begin('foo', null, new Error('Fails (5) on beginTransaction')))
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(err.message, 'Fails (5) on beginTransaction');
        });
  });

  it('fails on rollback', () => {
    return runTransaction(
               () => {
                 return Promise.reject();
               },
               begin(), rollback('foo', new Error('Fails on rollback')))
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(err.message, 'Fails on rollback');
        });
  });
});

describe('transaction operations', () => {
  it('support get with document ref', () => {
    return runTransaction((transaction, docRef) => {
      return transaction.get(docRef).then(doc => {
        assert.equal(doc.id, 'documentId');
      });
    }, begin(), getDocument(), commit());
  });

  it('requires a query or document for get', () => {
    return runTransaction(transaction => {
      assert.throws(
          () => transaction.get(),
          /Argument "refOrQuery" must be a DocumentRef or a Query\./);

      assert.throws(
          () => transaction.get('foo'),
          /Argument "refOrQuery" must be a DocumentRef or a Query\./);

      return Promise.resolve();
    }, begin(), commit());
  });

  it('enforce that gets come before writes', () => {
    return runTransaction(
               (transaction, docRef) => {
                 transaction.set(docRef, {foo: 'bar'});
                 return transaction.get(docRef);
               },
               begin())
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(
              err.message,
              'Firestore transactions require all reads to ' +
                  'be executed before all writes.');
        });
  });

  it('support get with query', () => {
    return runTransaction((transaction, docRef) => {
      const query = docRef.parent.where('foo', '==', 'bar');
      return transaction.get(query).then(results => {
        assert.equal(results.docs[0].id, 'documentId');
      });
    }, begin(), query(), commit());
  });

  it('support getAll', () => {
    return runTransaction((transaction, docRef) => {
      const firstDoc = docRef.parent.doc('firstDocument');
      const secondDoc = docRef.parent.doc('secondDocument');

      return transaction.getAll(firstDoc, secondDoc).then(docs => {
        assert.equal(docs.length, 2);
        assert.equal(docs[0].id, 'firstDocument');
        assert.equal(docs[1].id, 'secondDocument');
      });
    }, begin(), getAll(['firstDocument', 'secondDocument']), commit());
  });

  it('enforce that getAll come before writes', () => {
    return runTransaction(
               (transaction, docRef) => {
                 transaction.set(docRef, {foo: 'bar'});
                 return transaction.getAll(docRef);
               },
               begin())
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(
              err.message,
              'Firestore transactions require all reads to ' +
                  'be executed before all writes.');
        });
  });

  it('support create', () => {
    const create = {
      currentDocument: {
        exists: false,
      },
      update: {
        fields: {},
        name: DOCUMENT_NAME,
      },
    };

    return runTransaction((transaction, docRef) => {
      transaction.create(docRef, {});
      return Promise.resolve();
    }, begin(), commit(null, [create]));
  });

  it('support update', () => {
    const update = {
      currentDocument: {
        exists: true,
      },
      update: {
        fields: {
          a: {
            mapValue: {
              fields: {
                b: {
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

    return runTransaction((transaction, docRef) => {
      transaction.update(docRef, {'a.b': 'c'});
      transaction.update(docRef, 'a.b', 'c');
      transaction.update(docRef, new Firestore.FieldPath('a', 'b'), 'c');
      return Promise.resolve();
    }, begin(), commit(null, [update, update, update]));
  });

  it('support set', () => {
    const set = {
      update: {
        fields: {
          'a.b': {
            stringValue: 'c',
          },
        },
        name: DOCUMENT_NAME,
      },
    };

    return runTransaction((transaction, docRef) => {
      transaction.set(docRef, {'a.b': 'c'});
      return Promise.resolve();
    }, begin(), commit(null, [set]));
  });

  it('support set with merge', () => {
    const set = {
      update: {
        fields: {
          'a.b': {
            stringValue: 'c',
          },
        },
        name: DOCUMENT_NAME,
      },
      updateMask: {
        fieldPaths: ['`a.b`'],
      },
    };

    return runTransaction((transaction, docRef) => {
      transaction.set(docRef, {'a.b': 'c'}, {merge: true});
      return Promise.resolve();
    }, begin(), commit(null, [set]));
  });

  it('support delete', () => {
    const remove = {
      delete: DOCUMENT_NAME,
    };

    return runTransaction((transaction, docRef) => {
      transaction.delete(docRef);
      return Promise.resolve();
    }, begin(), commit(null, [remove]));
  });

  it('support multiple writes', () => {
    const remove = {
      delete: DOCUMENT_NAME,
    };

    const set = {
      update: {
        fields: {},
        name: DOCUMENT_NAME,
      },
    };

    return runTransaction((transaction, docRef) => {
      transaction.delete(docRef).set(docRef, {});
      return Promise.resolve();
    }, begin(), commit(null, [remove, set]));
  });
});
