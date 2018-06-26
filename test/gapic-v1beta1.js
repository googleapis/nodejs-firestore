// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const assert = require('assert');
const through2 = require('through2');

const firestoreModule = require('../src');

var FAKE_STATUS_CODE = 1;
var error = new Error();
error.code = FAKE_STATUS_CODE;

describe('FirestoreClient', () => {
  describe('getDocument', () => {
    it('invokes getDocument without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var request = {
        name: formattedName,
      };

      // Mock response
      var name2 = 'name2-1052831874';
      var expectedResponse = {
        name: name2,
      };

      // Mock Grpc layer
      client._innerApiCalls.getDocument = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.getDocument(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getDocument with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.getDocument = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.getDocument(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('listDocuments', () => {
    it('invokes listDocuments without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var collectionId = 'collectionId-821242276';
      var request = {
        parent: formattedParent,
        collectionId: collectionId,
      };

      // Mock response
      var nextPageToken = '';
      var documentsElement = {};
      var documents = [documentsElement];
      var expectedResponse = {
        nextPageToken: nextPageToken,
        documents: documents,
      };

      // Mock Grpc layer
      client._innerApiCalls.listDocuments = (
        actualRequest,
        options,
        callback
      ) => {
        assert.deepStrictEqual(actualRequest, request);
        callback(null, expectedResponse.documents);
      };

      client.listDocuments(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.documents);
        done();
      });
    });

    it('invokes listDocuments with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var collectionId = 'collectionId-821242276';
      var request = {
        parent: formattedParent,
        collectionId: collectionId,
      };

      // Mock Grpc layer
      client._innerApiCalls.listDocuments = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.listDocuments(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('createDocument', () => {
    it('invokes createDocument without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var collectionId = 'collectionId-821242276';
      var documentId = 'documentId506676927';
      var document = {};
      var request = {
        parent: formattedParent,
        collectionId: collectionId,
        documentId: documentId,
        document: document,
      };

      // Mock response
      var name = 'name3373707';
      var expectedResponse = {
        name: name,
      };

      // Mock Grpc layer
      client._innerApiCalls.createDocument = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.createDocument(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes createDocument with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var collectionId = 'collectionId-821242276';
      var documentId = 'documentId506676927';
      var document = {};
      var request = {
        parent: formattedParent,
        collectionId: collectionId,
        documentId: documentId,
        document: document,
      };

      // Mock Grpc layer
      client._innerApiCalls.createDocument = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.createDocument(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('updateDocument', () => {
    it('invokes updateDocument without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var document = {};
      var updateMask = {};
      var request = {
        document: document,
        updateMask: updateMask,
      };

      // Mock response
      var name = 'name3373707';
      var expectedResponse = {
        name: name,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateDocument = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.updateDocument(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes updateDocument with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var document = {};
      var updateMask = {};
      var request = {
        document: document,
        updateMask: updateMask,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateDocument = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.updateDocument(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('deleteDocument', () => {
    it('invokes deleteDocument without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.deleteDocument = mockSimpleGrpcMethod(request);

      client.deleteDocument(request, err => {
        assert.ifError(err);
        done();
      });
    });

    it('invokes deleteDocument with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.deleteDocument = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.deleteDocument(request, err => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        done();
      });
    });
  });

  describe('batchGetDocuments', () => {
    it('invokes batchGetDocuments without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var documents = [];
      var request = {
        database: formattedDatabase,
        documents: documents,
      };

      // Mock response
      var missing = 'missing1069449574';
      var transaction = '-34';
      var expectedResponse = {
        missing: missing,
        transaction: transaction,
      };

      // Mock Grpc layer
      client._innerApiCalls.batchGetDocuments = mockServerStreamingGrpcMethod(
        request,
        expectedResponse
      );

      var stream = client.batchGetDocuments(request);
      stream.on('data', response => {
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
      stream.on('error', err => {
        done(err);
      });

      stream.write();
    });

    it('invokes batchGetDocuments with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var documents = [];
      var request = {
        database: formattedDatabase,
        documents: documents,
      };

      // Mock Grpc layer
      client._innerApiCalls.batchGetDocuments = mockServerStreamingGrpcMethod(
        request,
        null,
        error
      );

      var stream = client.batchGetDocuments(request);
      stream.on('data', () => {
        assert.fail();
      });
      stream.on('error', err => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        done();
      });

      stream.write();
    });
  });

  describe('beginTransaction', () => {
    it('invokes beginTransaction without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock response
      var transaction = '-34';
      var expectedResponse = {
        transaction: transaction,
      };

      // Mock Grpc layer
      client._innerApiCalls.beginTransaction = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.beginTransaction(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes beginTransaction with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.beginTransaction = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.beginTransaction(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('commit', () => {
    it('invokes commit without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var writes = [];
      var request = {
        database: formattedDatabase,
        writes: writes,
      };

      // Mock response
      var expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.commit = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.commit(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes commit with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var writes = [];
      var request = {
        database: formattedDatabase,
        writes: writes,
      };

      // Mock Grpc layer
      client._innerApiCalls.commit = mockSimpleGrpcMethod(request, null, error);

      client.commit(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('rollback', () => {
    it('invokes rollback without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var transaction = '-34';
      var request = {
        database: formattedDatabase,
        transaction: transaction,
      };

      // Mock Grpc layer
      client._innerApiCalls.rollback = mockSimpleGrpcMethod(request);

      client.rollback(request, err => {
        assert.ifError(err);
        done();
      });
    });

    it('invokes rollback with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var transaction = '-34';
      var request = {
        database: formattedDatabase,
        transaction: transaction,
      };

      // Mock Grpc layer
      client._innerApiCalls.rollback = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.rollback(request, err => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        done();
      });
    });
  });

  describe('runQuery', () => {
    it('invokes runQuery without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var request = {
        parent: formattedParent,
      };

      // Mock response
      var transaction = '-34';
      var skippedResults = 880286183;
      var expectedResponse = {
        transaction: transaction,
        skippedResults: skippedResults,
      };

      // Mock Grpc layer
      client._innerApiCalls.runQuery = mockServerStreamingGrpcMethod(
        request,
        expectedResponse
      );

      var stream = client.runQuery(request);
      stream.on('data', response => {
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
      stream.on('error', err => {
        done(err);
      });

      stream.write();
    });

    it('invokes runQuery with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var request = {
        parent: formattedParent,
      };

      // Mock Grpc layer
      client._innerApiCalls.runQuery = mockServerStreamingGrpcMethod(
        request,
        null,
        error
      );

      var stream = client.runQuery(request);
      stream.on('data', () => {
        assert.fail();
      });
      stream.on('error', err => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        done();
      });

      stream.write();
    });
  });

  describe('write', () => {
    it('invokes write without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock response
      var streamId = 'streamId-315624902';
      var streamToken = '122';
      var expectedResponse = {
        streamId: streamId,
        streamToken: streamToken,
      };

      // Mock Grpc layer
      client._innerApiCalls.write = mockBidiStreamingGrpcMethod(
        request,
        expectedResponse
      );

      var stream = client
        .write()
        .on('data', response => {
          assert.deepStrictEqual(response, expectedResponse);
          done();
        })
        .on('error', err => {
          done(err);
        });

      stream.write(request);
    });

    it('invokes write with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.write = mockBidiStreamingGrpcMethod(
        request,
        null,
        error
      );

      var stream = client
        .write()
        .on('data', () => {
          assert.fail();
        })
        .on('error', err => {
          assert(err instanceof Error);
          assert.equal(err.code, FAKE_STATUS_CODE);
          done();
        });

      stream.write(request);
    });
  });

  describe('listen', () => {
    it('invokes listen without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock response
      var expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.listen = mockBidiStreamingGrpcMethod(
        request,
        expectedResponse
      );

      var stream = client
        .listen()
        .on('data', response => {
          assert.deepStrictEqual(response, expectedResponse);
          done();
        })
        .on('error', err => {
          done(err);
        });

      stream.write(request);
    });

    it('invokes listen with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databaseRootPath(
        '[PROJECT]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.listen = mockBidiStreamingGrpcMethod(
        request,
        null,
        error
      );

      var stream = client
        .listen()
        .on('data', () => {
          assert.fail();
        })
        .on('error', err => {
          assert(err instanceof Error);
          assert.equal(err.code, FAKE_STATUS_CODE);
          done();
        });

      stream.write(request);
    });
  });

  describe('listCollectionIds', () => {
    it('invokes listCollectionIds without error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var request = {
        parent: formattedParent,
      };

      // Mock response
      var nextPageToken = '';
      var collectionIdsElement = 'collectionIdsElement1368994900';
      var collectionIds = [collectionIdsElement];
      var expectedResponse = {
        nextPageToken: nextPageToken,
        collectionIds: collectionIds,
      };

      // Mock Grpc layer
      client._innerApiCalls.listCollectionIds = (
        actualRequest,
        options,
        callback
      ) => {
        assert.deepStrictEqual(actualRequest, request);
        callback(null, expectedResponse.collectionIds);
      };

      client.listCollectionIds(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.collectionIds);
        done();
      });
    });

    it('invokes listCollectionIds with error', done => {
      var client = new firestoreModule.v1beta1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.anyPathPath(
        '[PROJECT]',
        '[DATABASE]',
        '[DOCUMENT]',
        '[ANY_PATH]'
      );
      var request = {
        parent: formattedParent,
      };

      // Mock Grpc layer
      client._innerApiCalls.listCollectionIds = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.listCollectionIds(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });
});

function mockSimpleGrpcMethod(expectedRequest, response, error) {
  return function(actualRequest, options, callback) {
    assert.deepStrictEqual(actualRequest, expectedRequest);
    if (error) {
      callback(error);
    } else if (response) {
      callback(null, response);
    } else {
      callback(null);
    }
  };
}

function mockServerStreamingGrpcMethod(expectedRequest, response, error) {
  return actualRequest => {
    assert.deepStrictEqual(actualRequest, expectedRequest);
    var mockStream = through2.obj((chunk, enc, callback) => {
      if (error) {
        callback(error);
      } else {
        callback(null, response);
      }
    });
    return mockStream;
  };
}

function mockBidiStreamingGrpcMethod(expectedRequest, response, error) {
  return () => {
    var mockStream = through2.obj((chunk, enc, callback) => {
      assert.deepStrictEqual(chunk, expectedRequest);
      if (error) {
        callback(error);
      } else {
        callback(null, response);
      }
    });
    return mockStream;
  };
}
