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

import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as through2 from 'through2';

import * as proto from '../protos/firestore_proto_api';
import * as Firestore from '../src';
import {DocumentReference, FieldPath, Transaction} from '../src';
import {ApiOverride, createInstance, InvalidApiUsage} from './util/helpers';

import api = proto.google.firestore.v1;

use(chaiAsPromised);

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const COLLECTION_ROOT = `${DATABASE_ROOT}/documents/collectionId`;
const DOCUMENT_NAME = `${COLLECTION_ROOT}/documentId`;

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

/** Helper to create a transaction ID from either a string or a Uint8Array. */
function transactionId(transaction?: Uint8Array|string): Uint8Array {
  if (transaction === undefined) {
    return new Buffer('foo');
  } else if (typeof transaction === 'string') {
    return new Buffer(transaction);
  } else {
    return transaction;
  }
}

/**
 * The format the transaction tests use to verify transaction behavior. The
 * format defines an expected request and its expected response or error code.
 */
interface TransactionStep {
  type: 'begin'|'getDocument'|'query'|'commit'|'rollback';
  request: api.ICommitRequest|api.IBeginTransactionRequest|api.IRunQueryRequest;
  error?: Error;
  response?: api.ICommitResponse|api.IBeginTransactionResponse;
  stream?: NodeJS.ReadableStream;
}

function commit(
    transaction?: Uint8Array|string, writes?: api.IWrite[],
    err?: Error): TransactionStep {
  const proto: api.ICommitRequest = {
    database: DATABASE_ROOT,
    transaction: transactionId(transaction),
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

function rollback(
    transaction?: Uint8Array|string, err?: Error): TransactionStep {
  const proto = {
    database: DATABASE_ROOT,
    transaction: transactionId(transaction),
  };

  return {
    type: 'rollback',
    request: proto,
    error: err,
    response: {},
  };
}

function begin(
    transaction?: Uint8Array|string, prevTransaction?: Uint8Array|string,
    err?: Error): TransactionStep {
  const proto: api.IBeginTransactionRequest = {database: DATABASE_ROOT};

  if (prevTransaction) {
    proto.options = {
      readWrite: {
        retryTransaction: transactionId(prevTransaction),
      },
    };
  }

  const response = {
    transaction: transactionId(transaction),
  };

  return {
    type: 'begin',
    request: proto,
    error: err,
    response,
  };
}

function getDocument(transaction?: Uint8Array|string): TransactionStep {
  const request = {
    database: DATABASE_ROOT,
    documents: [DOCUMENT_NAME],
    transaction: transactionId(transaction),
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

function getAll(docs: string[], fieldMask?: string[]): TransactionStep {
  const request: api.IBatchGetDocumentsRequest = {
    database: DATABASE_ROOT,
    documents: [],
    transaction: new Buffer('foo'),
  };

  if (fieldMask) {
    request.mask = {fieldPaths: fieldMask};
  }

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

function query(transaction?: Uint8Array): TransactionStep {
  const request = {
    parent: `${DATABASE_ROOT}/documents`,
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
          op: 'EQUAL',
          value: {
            stringValue: 'bar',
          },
        },
      },
    },
    transaction: transaction || new Buffer('foo'),
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
    transactionCallback: (
        transaction: Transaction, docRef: DocumentReference) => Promise<T>,
    ...expectedRequests: TransactionStep[]) {
  const overrides: ApiOverride = {
    beginTransaction: (actual, _, callback) => {
      const request = expectedRequests.shift()!;
      expect(request.type).to.equal('begin');
      expect(actual).to.deep.eq(request.request);
      callback(
          request.error, request.response as api.IBeginTransactionResponse);
    },
    commit: (actual, _, callback) => {
      const request = expectedRequests.shift()!;
      expect(request.type).to.equal('commit');
      expect(actual).to.deep.eq(request.request);
      callback(request.error, request.response as api.ICommitResponse);
    },
    rollback: (actual, _, callback) => {
      const request = expectedRequests.shift()!;
      expect(request.type).to.equal('rollback');
      expect(actual).to.deep.eq(request.request);
      callback(request.error);
    },
    batchGetDocuments: (actual) => {
      const request = expectedRequests.shift()!;
      expect(request.type).to.equal('getDocument');
      expect(actual).to.deep.eq(request.request);
      return request.stream!;
    },
    runQuery: (actual) => {
      const request = expectedRequests.shift()!;
      expect(request.type).to.equal('query');
      expect(actual).to.deep.eq(request.request);
      return request.stream!;
    }
  };

  return createInstance(overrides).then(firestore => {
    return firestore
        .runTransaction(transaction => {
          const docRef = firestore.doc('collectionId/documentId');
          return transactionCallback(transaction, docRef);
        })
        .then(val => {
          expect(expectedRequests.length).to.equal(0);
          return val;
        })
        .catch(err => {
          expect(expectedRequests.length).to.equal(0);
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
      expect(val).to.equal('bar');
    });
  });
});

describe('failed transactions', () => {
  it('requires update function', () => {
    const overrides: ApiOverride = {
      beginTransaction: () => {
        expect.fail();
      }
    };

    return createInstance(overrides).then(firestore => {
      expect(() => (firestore as InvalidApiUsage).runTransaction())
          .to.throw('Argument "updateFunction" is not a valid function.');
    });
  });

  it('requires valid retry number', () => {
    const overrides: ApiOverride = {
      beginTransaction: () => {
        expect.fail();
      }
    };

    return createInstance(overrides).then(firestore => {
      expect(
          () => firestore.runTransaction(
              () => Promise.resolve(), {maxAttempts: 'foo' as InvalidApiUsage}))
          .to.throw(
              'Argument "transactionOptions.maxAttempts" is not a valid integer.');

      expect(
          () => firestore.runTransaction(
              () => Promise.resolve(), {maxAttempts: 0}))
          .to.throw(
              'Value for argument "transactionOptions.maxAttempts" must be within [1, Infinity] inclusive, but was: 0');
    });
  });

  it('requires a promise', () => {
    return expect(runTransaction(
                      (() => {}) as InvalidApiUsage, begin(), rollback('foo')))
        .to.eventually.be.rejectedWith(
            'You must return a Promise in your transaction()-callback.');
  });

  it('handles exception', () => {
    return createInstance().then(firestore => {
      firestore.request = () => {
        return Promise.reject(new Error('Expected exception'));
      };

      return expect(firestore.runTransaction(() => {
               return Promise.resolve();
             }))
          .to.eventually.be.rejectedWith('Expected exception');
    });
  });

  it('doesn\'t retry on callback failure', () => {
    return expect(runTransaction(
                      () => {
                        return Promise.reject('request exception');
                      },
                      begin(), rollback('foo')))
        .to.eventually.be.rejectedWith('request exception');
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
          expect(red).to.equal('success');
        });
  });

  it('limits the retry attempts', () => {
    const err = new Error('Retryable error');

    return expect(runTransaction(
                      () => {
                        return Promise.resolve('success');
                      },
                      begin('foo1'), commit('foo1', [], err),
                      begin('foo2', 'foo1'), commit('foo2', [], err),
                      begin('foo3', 'foo2'), commit('foo3', [], err),
                      begin('foo4', 'foo3'), commit('foo4', [], err),
                      begin('foo5', 'foo4'),
                      commit('foo5', [], new Error('Final exception'))))
        .to.eventually.be.rejectedWith('Final exception');
  });

  it('fails on beginTransaction', () => {
    return expect(runTransaction(
                      () => {
                        return Promise.resolve('success');
                      },
                      begin(
                          'foo', undefined,
                          new Error('Fails (1) on beginTransaction')),
                      begin(
                          'foo', undefined,
                          new Error('Fails (2) on beginTransaction')),
                      begin(
                          'foo', undefined,
                          new Error('Fails (3) on beginTransaction')),
                      begin(
                          'foo', undefined,
                          new Error('Fails (4) on beginTransaction')),
                      begin(
                          'foo', undefined,
                          new Error('Fails (5) on beginTransaction'))))
        .to.eventually.be.rejectedWith('Fails (5) on beginTransaction');
  });

  it('fails on rollback', () => {
    return expect(runTransaction(
                      () => {
                        return Promise.reject();
                      },
                      begin(), rollback('foo', new Error('Fails on rollback'))))
        .to.eventually.be.rejectedWith('Fails on rollback');
  });
});

describe('transaction operations', () => {
  it('support get with document ref', () => {
    return runTransaction((transaction, docRef) => {
      return transaction.get(docRef).then(doc => {
        expect(doc.id).to.equal('documentId');
      });
    }, begin(), getDocument(), commit());
  });

  it('requires a query or document for get', () => {
    return runTransaction((transaction: InvalidApiUsage) => {
      expect(() => transaction.get())
          .to.throw('Argument "refOrQuery" must be a DocumentRef or a Query.');

      expect(() => transaction.get('foo'))
          .to.throw('Argument "refOrQuery" must be a DocumentRef or a Query.');

      return Promise.resolve();
    }, begin(), commit());
  });

  it('enforce that gets come before writes', () => {
    return expect(runTransaction(
                      (transaction, docRef) => {
                        transaction.set(docRef, {foo: 'bar'});
                        return transaction.get(docRef);
                      },
                      begin()))
        .to.eventually.be.rejectedWith(
            'Firestore transactions require all reads to be executed before all writes.');
  });

  it('support get with query', () => {
    return runTransaction((transaction, docRef) => {
      const query = docRef.parent.where('foo', '==', 'bar');
      return transaction.get(query).then(results => {
        expect(results.docs[0].id).to.equal('documentId');
      });
    }, begin(), query(), commit());
  });

  it('support getAll', () => {
    return runTransaction((transaction, docRef) => {
      const firstDoc = docRef.parent.doc('firstDocument');
      const secondDoc = docRef.parent.doc('secondDocument');

      return transaction.getAll(firstDoc, secondDoc).then(docs => {
        expect(docs.length).to.equal(2);
        expect(docs[0].id).to.equal('firstDocument');
        expect(docs[1].id).to.equal('secondDocument');
      });
    }, begin(), getAll(['firstDocument', 'secondDocument']), commit());
  });

  it('support getAll with field mask', () => {
    return runTransaction((transaction, docRef) => {
      const doc = docRef.parent.doc('doc');

      return transaction.getAll(
          doc, {fieldMask: ['a.b', new FieldPath('a.b')]});
    }, begin(), getAll(['doc'], ['a.b', '`a.b`']), commit());
  });

  it('enforce that getAll come before writes', () => {
    return expect(runTransaction(
                      (transaction, docRef) => {
                        transaction.set(docRef, {foo: 'bar'});
                        return transaction.getAll(docRef);
                      },
                      begin()))
        .to.eventually.be.rejectedWith(
            'Firestore transactions require all reads to be executed before all writes.');
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
    }, begin(), commit(undefined, [create]));
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
    }, begin(), commit(undefined, [update, update, update]));
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
    }, begin(), commit(undefined, [set]));
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
    }, begin(), commit(undefined, [set]));
  });

  it('support delete', () => {
    const remove = {
      delete: DOCUMENT_NAME,
    };

    return runTransaction((transaction, docRef) => {
      transaction.delete(docRef);
      return Promise.resolve();
    }, begin(), commit(undefined, [remove]));
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
    }, begin(), commit(undefined, [remove, set]));
  });
});
