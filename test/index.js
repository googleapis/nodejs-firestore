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

const assert = require('assert');
const duplexify = require('duplexify');
const extend = require('extend');
const grpc = require('grpc');
const GrpcService = require('@google-cloud/common').GrpcService;
const proxyquire = require('proxyquire');
const util = require('@google-cloud/common').util;
const is = require('is');
const through = require('through2');

const Firestore = require('../');
const reference = require('../src/reference')(Firestore);
const DocumentReference = reference.DocumentReference;
const CollectionReference = reference.CollectionReference;

const DATABASE_ROOT = 'projects/test-project/databases/(default)';

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

function createInstance() {
  return new Firestore({
    projectId: 'test-project',
    sslCreds: grpc.credentials.createInsecure(),
  });
}

function found(name) {
  return {
    found: {
      name: `${DATABASE_ROOT}/documents/collectionId/${name}`,
      createTime: {seconds: 1, nanos: 2},
      updateTime: {seconds: 3, nanos: 4},
    },
    readTime: {seconds: 5, nanos: 6},
  };
}

function missing(name) {
  return {
    missing: `${DATABASE_ROOT}/documents/collectionId/${name}`,
    readTime: {seconds: 5, nanos: 6},
  };
}

function stream() {
  let stream = through.obj();
  let args = arguments;

  setImmediate(function() {
    for (let arg of args) {
      if (is.instance(arg, Error)) {
        stream.destroy(arg);
        return;
      }
      stream.push(arg);
    }
    stream.push(null);
  });

  return stream;
}

describe('instantiation', function() {
  function FakeGrpcService() {
    this.calledWith_ = arguments;
  }

  let fakeUtil = extend({}, util, {});
  extend(FakeGrpcService, GrpcService);

  let Firestore;

  before(function() {
    Firestore = proxyquire('../', {
      '@google-cloud/common': {
        util: fakeUtil,
      },
      '@google-cloud/common-grpc': {
        Service: FakeGrpcService,
      },
    });
  });

  beforeEach(function() {
    extend(FakeGrpcService, GrpcService);
  });

  it('creates instance', function() {
    let firestore = new Firestore({
      projectId: 'test-project',
      sslCreds: grpc.credentials.createInsecure(),
    });
    assert(firestore instanceof Firestore);
    assert.strictEqual(firestore.calledWith_[1].projectId, 'test-project');
  });

  it('detects project id', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure(),
    });

    firestore.api.Firestore._commit = function(request, options, callback) {
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
        ],
      });
    };

    firestore.api.Firestore.getProjectId = function(callback) {
      callback(null, 'test-project');
    };

    assert.equal(
      firestore.formattedName,
      'projects/{{projectId}}/databases/(default)'
    );

    return firestore
      .doc('foo/bar')
      .set({})
      .then(() => {
        assert.equal(firestore.formattedName, DATABASE_ROOT);
      });
  });

  it('accepts get() without project ID', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure(),
    });

    firestore.api.Firestore._batchGetDocuments = function(request) {
      let expectedRequest = {
        database: DATABASE_ROOT,
        documents: [`${DATABASE_ROOT}/documents/collectionId/documentId`],
      };
      assert.deepEqual(request, expectedRequest);

      return stream(found('documentId'));
    };

    let projectIdDetected = false;

    firestore.api.Firestore.getProjectId = function(callback) {
      projectIdDetected = true;
      callback(null, 'test-project');
    };

    let doc = firestore.doc('collectionId/documentId');
    assert.equal(projectIdDetected, false);

    return doc.get().then(result => {
      assert.equal(projectIdDetected, true);
      assert.equal(result.exists, true);
    });
  });

  it('accepts onSnapshot() without project ID', function(done) {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure(),
    });

    let readStream = through.obj();
    let writeStream = through.obj();

    firestore.api.Firestore._listen = function() {
      return duplexify.obj(readStream, writeStream);
    };

    let projectIdDetected = false;

    firestore.api.Firestore.getProjectId = function(callback) {
      projectIdDetected = true;
      callback(null, 'test-project');
    };

    let collection = firestore.collection('collectionId');
    assert.equal(projectIdDetected, false);

    let unsubscribe = collection.onSnapshot(() => {});
    readStream.on('data', data => {
      assert.equal(projectIdDetected, true);
      assert.equal(data.database, DATABASE_ROOT);
      unsubscribe();
      done();
    });
  });

  it('errors out on project id', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure(),
    });

    firestore.api.Firestore.getProjectId = function(callback) {
      callback(new Error('Expected error'));
    };

    return firestore
      .doc('foo/bar')
      .set({})
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Expected error');
        return Promise.resolve();
      });
  });

  describe('handles error from project ID detection', function() {
    it('for streaming requests', function() {
      let firestore = new Firestore({
        sslCreds: grpc.credentials.createInsecure(),
      });

      firestore._decorateRequest = function() {
        return Promise.reject(new Error('Expected error'));
      };

      return firestore
        .getAll(firestore.doc('foo/bar'))
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(err.message, 'Expected error');
          return Promise.resolve();
        });
    });

    it('for non-streaming requests', function() {
      let firestore = new Firestore({
        sslCreds: grpc.credentials.createInsecure(),
      });

      firestore._decorateRequest = function() {
        return Promise.reject(new Error('Expected error'));
      };

      return firestore
        .doc('foo/bar')
        .set({})
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          assert.equal(err.message, 'Expected error');
          return Promise.resolve();
        });
    });
  });

  it('inherits from GrpcService', function() {
    let firestore = new Firestore({
      projectId: 'test-project',
      sslCreds: grpc.credentials.createInsecure(),
    });
    assert(firestore instanceof FakeGrpcService);

    let calledWith = firestore.calledWith_[0];

    assert.equal(calledWith.service, 'firestore');
  });
});

describe('doc() method', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('returns DocumentReference', function() {
    let documentRef = firestore.doc('collectionId/documentId');
    assert.ok(documentRef instanceof DocumentReference);
  });

  it('requires document path', function() {
    assert.throws(function() {
      firestore.doc();
    }, new RegExp(
      'Argument "documentPath" is not a valid ResourcePath. ' +
        'Path is not a string.'
    ));
  });

  it("doesn't accept empty components", function() {
    assert.throws(function() {
      firestore.doc('coll//doc');
    }, new RegExp(
      'Argument "documentPath" is not a valid ResourcePath. ' +
        'Paths must not contain //.'
    ));
  });

  it('must point to document', function() {
    assert.throws(function() {
      firestore.doc('collectionId');
    }, /Argument "documentPath" must point to a document\./);
  });

  it('exposes properties', function() {
    let documentRef = firestore.doc('collectionId/documentId');
    assert.equal(documentRef.id, 'documentId');
    assert.equal(documentRef.firestore, firestore);
  });
});

describe('collection() method', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('returns collection', function() {
    let collection = firestore.collection('col1/doc1/col2');
    assert.ok(is.instance(collection, CollectionReference));
  });

  it('requires collection id', function() {
    assert.throws(function() {
      firestore.collection();
    }, new RegExp(
      'Argument "collectionPath" is not a valid ResourcePath. ' +
        'Path is not a string.'
    ));
  });

  it('must point to a collection', function() {
    assert.throws(function() {
      firestore.collection('collectionId/documentId');
    }, /Argument "collectionPath" must point to a collection\./);
  });

  it('exposes properties', function() {
    let collection = firestore.collection('collectionId');
    assert.ok(collection.id);
    assert.ok(collection.doc);
    assert.equal(collection.id, 'collectionId');
  });
});

describe('getCollections() method', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('returns collections', function() {
    firestore.api.Firestore._listCollectionIds = function(
      request,
      options,
      callback
    ) {
      assert.deepEqual(request, {
        parent: 'projects/test-project/databases/(default)',
      });

      callback(null, ['first', 'second']);
    };

    return firestore.getCollections().then(collections => {
      assert.equal(collections[0].path, 'first');
      assert.equal(collections[1].path, 'second');
    });
  });
});

describe('getAll() method', function() {
  let firestore;

  function resultEquals(result, doc) {
    assert.equal(result.length, arguments.length - 1);

    for (let i = 0; i < result.length; ++i) {
      doc = arguments[i + 1];

      if (doc.found) {
        assert.ok(result[i].exists);
        assert.equal(result[i].ref.formattedName, doc.found.name);
      } else {
        assert.ok(!result[i].exists);
        assert.equal(result[i].ref.formattedName, doc.missing);
      }
    }
  }

  beforeEach(function() {
    firestore = createInstance();
  });

  it('accepts empty list', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream();
    };

    return firestore.getAll().then(result => {
      resultEquals(result);
    });
  });

  it('accepts single document', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found('documentId'));
    };

    return firestore
      .getAll(firestore.doc('collectionId/documentId'))
      .then(result => {
        resultEquals(result, found('documentId'));
      });
  });

  it('verifies response', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found('documentId2'));
    };

    return firestore
      .getAll(firestore.doc('collectionId/documentId'))
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(
          err.message,
          'Did not receive document for' + ' "collectionId/documentId".'
        );
      });
  });

  it('handles stream exception during initialization', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(new Error('Expected exception'));
    };

    return firestore
      .getAll(firestore.doc('collectionId/documentId'))
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Expected exception');
      });
  });

  it('handles stream exception after initialization', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found('documentId'), new Error('Expected exception'));
    };

    return firestore
      .getAll(firestore.doc('collectionId/documentId'))
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Expected exception');
      });
  });

  it('handles serialization error', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found('documentId'));
    };

    firestore.snapshot_ = function() {
      throw new Error('Expected exception');
    };

    return firestore
      .getAll(firestore.doc('collectionId/documentId'))
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Expected exception');
      });
  });

  it('only retries on GRPC unavailable', function() {
    let coll = firestore.collection('collectionId');

    let expectedErrorAttempts = {
      /* Cancelled */ 1: 1,
      /* Unknown */ 2: 1,
      /* InvalidArgument */ 3: 1,
      /* DeadlineExceeded */ 4: 1,
      /* NotFound */ 5: 1,
      /* AlreadyExists */ 6: 1,
      /* PermissionDenied */ 7: 1,
      /* FailedPrecondition */ 9: 1,
      /* Aborted */ 10: 1,
      /* OutOfRange */ 11: 1,
      /* Unimplemented */ 12: 1,
      /* Internal */ 13: 1,
      /* Unavailable */ 14: 5,
      /* DataLoss */ 15: 1,
      /* Unauthenticated */ 16: 1,
    };

    let actualErrorAttempts = {};

    firestore.api.Firestore._batchGetDocuments = function(request) {
      let errorCode = Number(request.documents[0].split('/').pop());
      actualErrorAttempts[errorCode] =
        (actualErrorAttempts[errorCode] || 0) + 1;
      let error = new Error('Expected exception');
      error.code = errorCode;
      return stream(error);
    };

    let promises = [];

    Object.keys(expectedErrorAttempts).forEach(errorCode => {
      promises.push(
        firestore
          .getAll(coll.doc(`${errorCode}`))
          .then(() => {
            throw new Error('Unexpected success in Promise');
          })
          .catch(err => {
            assert.equal(err.code, errorCode);
          })
      );
    });

    return Promise.all(promises).then(() => {
      assert.deepEqual(actualErrorAttempts, expectedErrorAttempts);
    });
  });

  it('requires document reference', function() {
    assert.throws(() => {
      firestore.getAll({});
    }, /Argument at index 0 is not a valid DocumentReference\./);
  });

  it('accepts array', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found('documentId'));
    };

    return firestore
      .getAll([firestore.doc('collectionId/documentId')])
      .then(result => {
        resultEquals(result, found('documentId'));
      });
  });

  it('returns not found for missing documents', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found('exists'), missing('missing'));
    };

    return firestore
      .getAll(
        firestore.doc('collectionId/exists'),
        firestore.doc('collectionId/missing')
      )
      .then(result => {
        resultEquals(result, found('exists'), missing('missing'));
      });
  });

  it('returns results in order', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(
        // Note that these are out of order.
        found('second'),
        found('first'),
        found('fourth'),
        found('third')
      );
    };

    return firestore
      .getAll(
        firestore.doc('collectionId/first'),
        firestore.doc('collectionId/second'),
        firestore.doc('collectionId/third'),
        firestore.doc('collectionId/fourth')
      )
      .then(result => {
        resultEquals(
          result,
          found('first'),
          found('second'),
          found('third'),
          found('fourth')
        );
      });
  });

  it('accepts same document multiple times', function() {
    firestore.api.Firestore._batchGetDocuments = function(request) {
      assert.equal(request.documents.length, 2);
      return stream(found('a'), found('b'));
    };

    return firestore
      .getAll(
        firestore.doc('collectionId/a'),
        firestore.doc('collectionId/a'),
        firestore.doc('collectionId/b'),
        firestore.doc('collectionId/a')
      )
      .then(result => {
        resultEquals(result, found('a'), found('a'), found('b'), found('a'));
      });
  });
});

describe('FieldPath', function() {
  it('encodes field names', function() {
    let components = [['foo'], ['foo', 'bar'], ['.', '`'], ['\\']];

    let results = ['foo', 'foo.bar', '`.`.`\\``', '`\\\\`'];

    for (let i = 0; i < components.length; ++i) {
      assert.equal(
        new Firestore.FieldPath(components[i]).toString(),
        results[i]
      );
    }
  });

  it("doesn't accept empty path", function() {
    assert.throws(() => {
      new Firestore.FieldPath();
    }, /Function 'FieldPath\(\)' requires at least 1 argument\./);
  });

  it('only accepts strings', function() {
    assert.throws(() => {
      new Firestore.FieldPath('foo', 'bar', 0);
    }, /Argument at index 2 is not a valid string\./);
  });
});
