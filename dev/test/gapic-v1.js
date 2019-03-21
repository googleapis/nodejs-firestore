// Copyright 2019 Google LLC
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

const FAKE_STATUS_CODE = 1;
const error = new Error();
error.code = FAKE_STATUS_CODE;

describe('FirestoreClient', () => {
  describe('getDocument', () => {
    it('invokes getDocument without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const request = {
        name: formattedName,
      };

      // Mock response
      const name2 = 'name2-1052831874';
      const expectedResponse = {
        name: name2,
      };

      // Mock Grpc layer
      client._innerApiCalls.getDocument =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.getDocument(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getDocument with error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.getDocument =
          mockSimpleGrpcMethod(request, null, error);

      client.getDocument(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('listDocuments', () => {
    it('invokes listDocuments without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const collectionId = 'collectionId-821242276';
      const request = {
        parent: formattedParent,
        collectionId: collectionId,
      };

      // Mock response
      const nextPageToken = '';
      const documentsElement = {};
      const documents = [documentsElement];
      const expectedResponse = {
        nextPageToken: nextPageToken,
        documents: documents,
      };

      // Mock Grpc layer
      client._innerApiCalls.listDocuments =
          (actualRequest, options, callback) => {
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
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const collectionId = 'collectionId-821242276';
      const request = {
        parent: formattedParent,
        collectionId: collectionId,
      };

      // Mock Grpc layer
      client._innerApiCalls.listDocuments =
          mockSimpleGrpcMethod(request, null, error);

      client.listDocuments(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('createDocument', () => {
    it('invokes createDocument without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const collectionId = 'collectionId-821242276';
      const documentId = 'documentId506676927';
      const document = {};
      const request = {
        parent: formattedParent,
        collectionId: collectionId,
        documentId: documentId,
        document: document,
      };

      // Mock response
      const name = 'name3373707';
      const expectedResponse = {
        name: name,
      };

      // Mock Grpc layer
      client._innerApiCalls.createDocument =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.createDocument(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes createDocument with error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const collectionId = 'collectionId-821242276';
      const documentId = 'documentId506676927';
      const document = {};
      const request = {
        parent: formattedParent,
        collectionId: collectionId,
        documentId: documentId,
        document: document,
      };

      // Mock Grpc layer
      client._innerApiCalls.createDocument =
          mockSimpleGrpcMethod(request, null, error);

      client.createDocument(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('updateDocument', () => {
    it('invokes updateDocument without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const document = {};
      const updateMask = {};
      const request = {
        document: document,
        updateMask: updateMask,
      };

      // Mock response
      const name = 'name3373707';
      const expectedResponse = {
        name: name,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateDocument =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.updateDocument(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes updateDocument with error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const document = {};
      const updateMask = {};
      const request = {
        document: document,
        updateMask: updateMask,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateDocument =
          mockSimpleGrpcMethod(request, null, error);

      client.updateDocument(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('deleteDocument', () => {
    it('invokes deleteDocument without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const request = {
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
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.deleteDocument =
          mockSimpleGrpcMethod(request, null, error);

      client.deleteDocument(request, err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });
    });
  });

  describe('batchGetDocuments', () => {
    it('invokes batchGetDocuments without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const documents = [];
      const request = {
        database: formattedDatabase,
        documents: documents,
      };

      // Mock response
      const missing = 'missing1069449574';
      const transaction = '-34';
      const expectedResponse = {
        missing: missing,
        transaction: transaction,
      };

      // Mock Grpc layer
      client._innerApiCalls.batchGetDocuments =
          mockServerStreamingGrpcMethod(request, expectedResponse);

      const stream = client.batchGetDocuments(request);
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
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const documents = [];
      const request = {
        database: formattedDatabase,
        documents: documents,
      };

      // Mock Grpc layer
      client._innerApiCalls.batchGetDocuments =
          mockServerStreamingGrpcMethod(request, null, error);

      const stream = client.batchGetDocuments(request);
      stream.on('data', () => {
        assert.fail();
      });
      stream.on('error', err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });

      stream.write();
    });
  });

  describe('beginTransaction', () => {
    it('invokes beginTransaction without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock response
      const transaction = '-34';
      const expectedResponse = {
        transaction: transaction,
      };

      // Mock Grpc layer
      client._innerApiCalls.beginTransaction =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.beginTransaction(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes beginTransaction with error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.beginTransaction =
          mockSimpleGrpcMethod(request, null, error);

      client.beginTransaction(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('commit', () => {
    it('invokes commit without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const writes = [];
      const request = {
        database: formattedDatabase,
        writes: writes,
      };

      // Mock response
      const expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.commit =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.commit(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes commit with error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const writes = [];
      const request = {
        database: formattedDatabase,
        writes: writes,
      };

      // Mock Grpc layer
      client._innerApiCalls.commit = mockSimpleGrpcMethod(request, null, error);

      client.commit(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('rollback', () => {
    it('invokes rollback without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const transaction = '-34';
      const request = {
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
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const transaction = '-34';
      const request = {
        database: formattedDatabase,
        transaction: transaction,
      };

      // Mock Grpc layer
      client._innerApiCalls.rollback =
          mockSimpleGrpcMethod(request, null, error);

      client.rollback(request, err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });
    });
  });

  describe('runQuery', () => {
    it('invokes runQuery without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const request = {
        parent: formattedParent,
      };

      // Mock response
      const transaction = '-34';
      const skippedResults = 880286183;
      const expectedResponse = {
        transaction: transaction,
        skippedResults: skippedResults,
      };

      // Mock Grpc layer
      client._innerApiCalls.runQuery =
          mockServerStreamingGrpcMethod(request, expectedResponse);

      const stream = client.runQuery(request);
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
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const request = {
        parent: formattedParent,
      };

      // Mock Grpc layer
      client._innerApiCalls.runQuery =
          mockServerStreamingGrpcMethod(request, null, error);

      const stream = client.runQuery(request);
      stream.on('data', () => {
        assert.fail();
      });
      stream.on('error', err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });

      stream.write();
    });
  });

  describe('write', () => {
    it('invokes write without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock response
      const streamId = 'streamId-315624902';
      const streamToken = '122';
      const expectedResponse = {
        streamId: streamId,
        streamToken: streamToken,
      };

      // Mock Grpc layer
      client._innerApiCalls.write =
          mockBidiStreamingGrpcMethod(request, expectedResponse);

      const stream =
          client.write()
              .on('data',
                  response => {
                    assert.deepStrictEqual(response, expectedResponse);
                    done();
                  })
              .on('error', err => {
                done(err);
              });

      stream.write(request);
    });

    it('invokes write with error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.write =
          mockBidiStreamingGrpcMethod(request, null, error);

      const stream = client.write()
                         .on('data',
                             () => {
                               assert.fail();
                             })
                         .on('error', err => {
                           assert(err instanceof Error);
                           assert.strictEqual(err.code, FAKE_STATUS_CODE);
                           done();
                         });

      stream.write(request);
    });
  });

  describe('listen', () => {
    it('invokes listen without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock response
      const expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.listen =
          mockBidiStreamingGrpcMethod(request, expectedResponse);

      const stream =
          client.listen()
              .on('data',
                  response => {
                    assert.deepStrictEqual(response, expectedResponse);
                    done();
                  })
              .on('error', err => {
                done(err);
              });

      stream.write(request);
    });

    it('invokes listen with error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databaseRootPath('[PROJECT]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.listen =
          mockBidiStreamingGrpcMethod(request, null, error);

      const stream = client.listen()
                         .on('data',
                             () => {
                               assert.fail();
                             })
                         .on('error', err => {
                           assert(err instanceof Error);
                           assert.strictEqual(err.code, FAKE_STATUS_CODE);
                           done();
                         });

      stream.write(request);
    });
  });

  describe('listCollectionIds', () => {
    it('invokes listCollectionIds without error', done => {
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const request = {
        parent: formattedParent,
      };

      // Mock response
      const nextPageToken = '';
      const collectionIdsElement = 'collectionIdsElement1368994900';
      const collectionIds = [collectionIdsElement];
      const expectedResponse = {
        nextPageToken: nextPageToken,
        collectionIds: collectionIds,
      };

      // Mock Grpc layer
      client._innerApiCalls.listCollectionIds =
          (actualRequest, options, callback) => {
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
      const client = new firestoreModule.v1.FirestoreClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.anyPathPath(
          '[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
      const request = {
        parent: formattedParent,
      };

      // Mock Grpc layer
      client._innerApiCalls.listCollectionIds =
          mockSimpleGrpcMethod(request, null, error);

      client.listCollectionIds(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
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
    const mockStream = through2.obj((chunk, enc, callback) => {
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
    const mockStream = through2.obj((chunk, enc, callback) => {
      assert.deepStrictEqual(chunk, expectedRequest);
      if (error) {
        callback(error);
      } else {
        callback(null, response);
      }
    });
    return mockStream;
  }
}
