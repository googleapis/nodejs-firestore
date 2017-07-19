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

let assert = require('assert');
let duplexify = require('duplexify');
let extend = require('extend');
let grpc = require('grpc');
let GrpcService = require('@google-cloud/common').GrpcService;
let proxyquire = require('proxyquire');
let util = require('@google-cloud/common').util;
let is = require('is');
let through = require('through2');

let Firestore = require('../');
let reference = require('../src/reference')(Firestore);
let DocumentReference = reference.DocumentReference;
let CollectionReference = reference.CollectionReference;

const databaseRoot = 'projects/test-project/databases/(default)';

function createInstance() {
  return new Firestore({
    projectId: 'test-project',
    sslCreds: grpc.credentials.createInsecure()
  });
}

function found(name) {
  return {
    found: {
      name: `${databaseRoot}/documents/collectionId/${name}`,
      createTime: { seconds: 1, nanos: 2},
      updateTime: { seconds: 3, nanos: 4}
    },
    readTime:  { seconds: 5, nanos: 6}
  };
}

function missing(name) {
  return {
    missing: `${databaseRoot}/documents/collectionId/${name}`,
    readTime:  { seconds: 5, nanos: 6}
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
        util: fakeUtil
      },
      '@google-cloud/common-grpc': {
        Service: FakeGrpcService
      }
    });
  });

  beforeEach(function() {
    extend(FakeGrpcService, GrpcService);
  });

  it('creates instance', function() {
    let firestore = new Firestore({
      projectId: 'test-project',
      sslCreds: grpc.credentials.createInsecure()
    });
    assert(firestore instanceof Firestore);
    assert.strictEqual(firestore.calledWith_[1].projectId, 'test-project');
  });

  it('detects project id', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure()
    });

    firestore.api.Firestore._commit = function(request, options, callback) {
      callback(null, { commitTime: {
        nanos: 0,
        seconds: 0
      },
        writeResults: [
          {
            updateTime: {
              nanos: 0,
              seconds: 0
            }
          }
        ]});
    };

    firestore.api.Firestore.getProjectId = function(callback) {
      callback(null, 'test-project');
    };

    assert.equal(firestore.formattedName,
      'projects/{{projectId}}/databases/(default)');

    return firestore.doc('foo/bar').set({}).then(() => {
      assert.equal(firestore.formattedName, databaseRoot);
    });
  });

  it('accepts get() without project ID', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure()
    });

    firestore.api.Firestore._batchGetDocuments = function(request) {
      let expectedRequest = {
        database: databaseRoot,
        documents: [`${databaseRoot}/documents/collectionId/documentId`]
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

    return doc.get().then(
      (result) => {
        assert.equal(projectIdDetected, true);
        assert.equal(result.exists, true);
      });
  });

  it('accepts onSnapshot() without project ID', function(done) {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure()
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
      assert.equal(data.database, databaseRoot);
      unsubscribe();
      done();
    });
  });

  it('errors out on project id', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure()
    });

    firestore.api.Firestore.getProjectId = function(callback) {
      callback(new Error('Expected error'));
    };

    return firestore.doc('foo/bar').set({}).then(() => {
      throw new Error('Unexpected success in Promise');
    }).catch(err => {
      assert.equal(err.message, 'Expected error');
      return Promise.resolve();
    });
  });

  describe('handles error from project ID detection', function() {
    it('for streaming requests', function() {
      let firestore = new Firestore({
        sslCreds: grpc.credentials.createInsecure()
      });

      firestore._decorateRequest = function() {
        return Promise.reject(new Error('Expected error'));
      };

      return firestore.getAll(firestore.doc('foo/bar')).then(() => {
        throw new Error('Unexpected success in Promise');
      }).catch(err => {
        assert.equal(err.message, 'Expected error');
        return Promise.resolve();
      });
    });

    it('for non-streaming requests', function() {
      let firestore = new Firestore({
        sslCreds: grpc.credentials.createInsecure()
      });

      firestore._decorateRequest = function() {
        return Promise.reject(new Error('Expected error'));
      };

      return firestore.doc('foo/bar').set({}).then(() => {
        throw new Error('Unexpected success in Promise');
      }).catch(err => {
        assert.equal(err.message, 'Expected error');
        return Promise.resolve();
      });
    });
  });

  it('inherits from GrpcService', function() {
    let firestore = new Firestore({
      projectId: 'test-project',
      sslCreds: grpc.credentials.createInsecure()
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
    }, /Argument "documentPath" is not a valid string\./);
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
    }, /Argument "collectionPath" is not a valid string\./);
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

    return firestore.getAll().then((result) => {
      resultEquals(result);
    });
  });

  it('accepts single document', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found('documentId'));
    };

    return firestore.getAll(firestore.doc('collectionId/documentId')).then(
      (result) => {
        resultEquals(result, found('documentId'));
      });
  });

  it('verifies response', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found('documentId2'));
    };

    return firestore.getAll(firestore.doc('collectionId/documentId')).then(
      () => {
        throw new Error('Unexpected success in Promise');
      }).catch((err) => {
        assert.equal(err.message, 'Could not detect input order for' +
          ' "collectionId/documentId2".');
      });
  });

  it('handles stream exception', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(new Error('Expected exception'));
    };

    return firestore.getAll(firestore.doc('collectionId/documentId')).then(
      () => {
        throw new Error('Unexpected success in Promise');
      }).catch((err) => {
        assert.equal(err.message, 'Expected exception');
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

    return firestore.getAll([firestore.doc('collectionId/documentId')]).then(
      (result) => {
        resultEquals(result, found('documentId'));
      });
  });

  it('returns not found for missing documents', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found('exists'), missing('missing'));
    };

    return firestore.getAll(
      firestore.doc('collectionId/exists'),
      firestore.doc('collectionId/missing')).then((result) => {
        resultEquals(result, found('exists'), missing('missing'));
      });
  });

  it('returns results in order', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(
        // Note that these are out of order.
        found('second'), found('first'), found('fourth'), found('third')
      );
    };

    return firestore.getAll(
      firestore.doc('collectionId/first'),
      firestore.doc('collectionId/second'),
      firestore.doc('collectionId/third'),
      firestore.doc('collectionId/fourth')).then((result) => {
        resultEquals(result,
          found('first'), found('second'), found('third'), found('fourth'));
      });
  });
});

describe('fieldPath() method', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('encodes field names', function() {
    let components = [
      [],
      ['foo'],
      ['foo', 'bar'],
    ];

    let results = [
      '',
      'foo',
      'foo.bar'
    ];

    for (let i = 0; i < components.length; ++i) {
      assert.equal(Firestore.fieldPath(components[i]), results[i]);
    }
  });

  it('accepts field name arguments', function() {
    assert.equal(Firestore.fieldPath(), '');
    assert.equal(Firestore.fieldPath('foo', 'bar'), 'foo.bar');
  });

  it('only accepts strings', function() {
    assert.throws(() => {
      Firestore.fieldPath('foo', 'bar', 0);
    }, /Argument at index 2 is not a valid string\./);
  });

  it('escapes field names', function() {
    let components = [
      ['.'],
      ['foo', '.', '\\'],
      ['.\\.\\.'],
    ];

    let results = [
      '`.`',
      'foo.`.`.`\\\\`',
      '`.\\\\.\\\\.`'
    ];

    for (let i = 0; i < components.length; ++i) {
      assert.equal(Firestore.fieldPath(components[i]), results[i]);
    }
  });
});
