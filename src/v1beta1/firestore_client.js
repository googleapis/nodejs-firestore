/*
 * Copyright 2017, Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * EDITING INSTRUCTIONS
 * This file was generated from the file
 * https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto,
 * and updates to that file get reflected here through a refresh process.
 * For the short term, the refresh process will only be runnable by Google
 * engineers.
 *
 * The only allowed edits are to method and file documentation. A 3-way
 * merge preserves those additions if the generated source changes.
 */
'use strict';

var configData = require('./firestore_client_config');
var extend = require('extend');
var gax = require('google-gax');
var path = require('path');

var SERVICE_ADDRESS = 'firestore.googleapis.com';

var DEFAULT_SERVICE_PORT = 443;

var CODE_GEN_NAME_VERSION = 'gapic/0.0.5';

var PAGE_DESCRIPTORS = {
  listDocuments: new gax.PageDescriptor(
    'pageToken',
    'nextPageToken',
    'documents'
  ),
  listCollectionIds: new gax.PageDescriptor(
    'pageToken',
    'nextPageToken',
    'collectionIds'
  ),
};

var STREAM_DESCRIPTORS = {
  batchGetDocuments: new gax.StreamDescriptor(gax.StreamType.SERVER_STREAMING),
  runQuery: new gax.StreamDescriptor(gax.StreamType.SERVER_STREAMING),
  write: new gax.StreamDescriptor(gax.StreamType.BIDI_STREAMING),
  listen: new gax.StreamDescriptor(gax.StreamType.BIDI_STREAMING),
};

/*!
 * The scopes needed to make gRPC calls to all of the methods defined in
 * this service.
 */
var ALL_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/datastore',
];

/**
 * The Cloud Firestore service.
 *
 * This service exposes several types of comparable timestamps:
 *
 * *    `create_time` - The time at which a document was created. Changes only
 *      when a document is deleted, then re-created. Increases in a strict
 *       monotonic fashion.
 * *    `update_time` - The time at which a document was last updated. Changes
 *      every time a document is modified. Does not change when a write results
 *      in no modifications. Increases in a strict monotonic fashion.
 * *    `read_time` - The time at which a particular state was observed. Used
 *      to denote a consistent snapshot of the database or the time at which a
 *      Document was observed to not exist.
 * *    `commit_time` - The time at which the writes in a transaction were
 *      committed. Any read with an equal or greater `read_time` is guaranteed
 *      to see the effects of the transaction.
 *
 *
 * @class
 */
function FirestoreClient(gaxGrpc, loadedProtos, opts) {
  opts = extend(
    {
      servicePath: SERVICE_ADDRESS,
      port: DEFAULT_SERVICE_PORT,
      clientConfig: {},
    },
    opts
  );

  var googleApiClient = ['gl-node/' + process.versions.node];
  if (opts.libName && opts.libVersion) {
    googleApiClient.push(opts.libName + '/' + opts.libVersion);
  }
  googleApiClient.push(
    CODE_GEN_NAME_VERSION,
    'gax/' + gax.version,
    'grpc/' + gaxGrpc.grpcVersion
  );

  var defaults = gaxGrpc.constructSettings(
    'google.firestore.v1beta1.Firestore',
    configData,
    opts.clientConfig,
    {'x-goog-api-client': googleApiClient.join(' ')}
  );

  var self = this;

  this.auth = gaxGrpc.auth;
  var firestoreStub = gaxGrpc.createStub(
    loadedProtos.google.firestore.v1beta1.Firestore,
    opts
  );
  var firestoreStubMethods = [
    'getDocument',
    'listDocuments',
    'createDocument',
    'updateDocument',
    'deleteDocument',
    'batchGetDocuments',
    'beginTransaction',
    'commit',
    'rollback',
    'runQuery',
    'write',
    'listen',
    'listCollectionIds',
  ];
  firestoreStubMethods.forEach(function(methodName) {
    self['_' + methodName] = gax.createApiCall(
      firestoreStub.then(function(firestoreStub) {
        return function() {
          var args = Array.prototype.slice.call(arguments, 0);
          return firestoreStub[methodName].apply(firestoreStub, args);
        };
      }),
      defaults[methodName],
      PAGE_DESCRIPTORS[methodName] || STREAM_DESCRIPTORS[methodName]
    );
  });
}

// Path templates

var DATABASE_ROOT_PATH_TEMPLATE = new gax.PathTemplate(
  'projects/{project}/databases/{database}'
);

var DOCUMENT_ROOT_PATH_TEMPLATE = new gax.PathTemplate(
  'projects/{project}/databases/{database}/documents'
);

var DOCUMENT_PATH_PATH_TEMPLATE = new gax.PathTemplate(
  'projects/{project}/databases/{database}/documents/{document_path=**}'
);

var ANY_PATH_PATH_TEMPLATE = new gax.PathTemplate(
  'projects/{project}/databases/{database}/documents/{document}/{any_path=**}'
);

/**
 * Returns a fully-qualified database_root resource name string.
 * @param {String} project
 * @param {String} database
 * @returns {String}
 */
FirestoreClient.prototype.databaseRootPath = function(project, database) {
  return DATABASE_ROOT_PATH_TEMPLATE.render({
    project: project,
    database: database,
  });
};

/**
 * Returns a fully-qualified document_root resource name string.
 * @param {String} project
 * @param {String} database
 * @returns {String}
 */
FirestoreClient.prototype.documentRootPath = function(project, database) {
  return DOCUMENT_ROOT_PATH_TEMPLATE.render({
    project: project,
    database: database,
  });
};

/**
 * Returns a fully-qualified document_path resource name string.
 * @param {String} project
 * @param {String} database
 * @param {String} documentPath
 * @returns {String}
 */
FirestoreClient.prototype.documentPathPath = function(
  project,
  database,
  documentPath
) {
  return DOCUMENT_PATH_PATH_TEMPLATE.render({
    project: project,
    database: database,
    document_path: documentPath,
  });
};

/**
 * Returns a fully-qualified any_path resource name string.
 * @param {String} project
 * @param {String} database
 * @param {String} document
 * @param {String} anyPath
 * @returns {String}
 */
FirestoreClient.prototype.anyPathPath = function(
  project,
  database,
  document,
  anyPath
) {
  return ANY_PATH_PATH_TEMPLATE.render({
    project: project,
    database: database,
    document: document,
    any_path: anyPath,
  });
};

/**
 * Parses the databaseRootName from a database_root resource.
 * @param {String} databaseRootName
 *   A fully-qualified path representing a database_root resources.
 * @returns {String} - A string representing the project.
 */
FirestoreClient.prototype.matchProjectFromDatabaseRootName = function(
  databaseRootName
) {
  return DATABASE_ROOT_PATH_TEMPLATE.match(databaseRootName).project;
};

/**
 * Parses the databaseRootName from a database_root resource.
 * @param {String} databaseRootName
 *   A fully-qualified path representing a database_root resources.
 * @returns {String} - A string representing the database.
 */
FirestoreClient.prototype.matchDatabaseFromDatabaseRootName = function(
  databaseRootName
) {
  return DATABASE_ROOT_PATH_TEMPLATE.match(databaseRootName).database;
};

/**
 * Parses the documentRootName from a document_root resource.
 * @param {String} documentRootName
 *   A fully-qualified path representing a document_root resources.
 * @returns {String} - A string representing the project.
 */
FirestoreClient.prototype.matchProjectFromDocumentRootName = function(
  documentRootName
) {
  return DOCUMENT_ROOT_PATH_TEMPLATE.match(documentRootName).project;
};

/**
 * Parses the documentRootName from a document_root resource.
 * @param {String} documentRootName
 *   A fully-qualified path representing a document_root resources.
 * @returns {String} - A string representing the database.
 */
FirestoreClient.prototype.matchDatabaseFromDocumentRootName = function(
  documentRootName
) {
  return DOCUMENT_ROOT_PATH_TEMPLATE.match(documentRootName).database;
};

/**
 * Parses the documentPathName from a document_path resource.
 * @param {String} documentPathName
 *   A fully-qualified path representing a document_path resources.
 * @returns {String} - A string representing the project.
 */
FirestoreClient.prototype.matchProjectFromDocumentPathName = function(
  documentPathName
) {
  return DOCUMENT_PATH_PATH_TEMPLATE.match(documentPathName).project;
};

/**
 * Parses the documentPathName from a document_path resource.
 * @param {String} documentPathName
 *   A fully-qualified path representing a document_path resources.
 * @returns {String} - A string representing the database.
 */
FirestoreClient.prototype.matchDatabaseFromDocumentPathName = function(
  documentPathName
) {
  return DOCUMENT_PATH_PATH_TEMPLATE.match(documentPathName).database;
};

/**
 * Parses the documentPathName from a document_path resource.
 * @param {String} documentPathName
 *   A fully-qualified path representing a document_path resources.
 * @returns {String} - A string representing the document_path.
 */
FirestoreClient.prototype.matchDocumentPathFromDocumentPathName = function(
  documentPathName
) {
  return DOCUMENT_PATH_PATH_TEMPLATE.match(documentPathName).document_path;
};

/**
 * Parses the anyPathName from a any_path resource.
 * @param {String} anyPathName
 *   A fully-qualified path representing a any_path resources.
 * @returns {String} - A string representing the project.
 */
FirestoreClient.prototype.matchProjectFromAnyPathName = function(anyPathName) {
  return ANY_PATH_PATH_TEMPLATE.match(anyPathName).project;
};

/**
 * Parses the anyPathName from a any_path resource.
 * @param {String} anyPathName
 *   A fully-qualified path representing a any_path resources.
 * @returns {String} - A string representing the database.
 */
FirestoreClient.prototype.matchDatabaseFromAnyPathName = function(anyPathName) {
  return ANY_PATH_PATH_TEMPLATE.match(anyPathName).database;
};

/**
 * Parses the anyPathName from a any_path resource.
 * @param {String} anyPathName
 *   A fully-qualified path representing a any_path resources.
 * @returns {String} - A string representing the document.
 */
FirestoreClient.prototype.matchDocumentFromAnyPathName = function(anyPathName) {
  return ANY_PATH_PATH_TEMPLATE.match(anyPathName).document;
};

/**
 * Parses the anyPathName from a any_path resource.
 * @param {String} anyPathName
 *   A fully-qualified path representing a any_path resources.
 * @returns {String} - A string representing the any_path.
 */
FirestoreClient.prototype.matchAnyPathFromAnyPathName = function(anyPathName) {
  return ANY_PATH_PATH_TEMPLATE.match(anyPathName).any_path;
};

/**
 * Get the project ID used by this class.
 * @param {function(Error, string)} callback - the callback to be called with
 *   the current project Id.
 */
FirestoreClient.prototype.getProjectId = function(callback) {
  return this.auth.getProjectId(callback);
};

// Service calls

/**
 * Gets a single document.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.name
 *   The resource name of the Document to get. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 * @param {Object=} request.mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If the document has a field that is not present in this mask, that field
 *   will not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 * @param {string=} request.transaction
 *   Reads the document in a transaction.
 * @param {Object=} request.readTime
 *   Reads the version of the document at the given time.
 *   This may not be older than 60 seconds.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error, ?Object)=} callback
 *   The function which will be called with the result of the API call.
 *
 *   The second parameter to the callback is an object representing [Document]{@link google.firestore.v1beta1.Document}.
 * @returns {Promise} - The promise which resolves to an array.
 *   The first element of the array is an object representing [Document]{@link google.firestore.v1beta1.Document}.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedName = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 * client.getDocument({name: formattedName}).then(function(responses) {
 *     var response = responses[0];
 *     // doThingsWith(response)
 * })
 * .catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreClient.prototype.getDocument = function(request, options, callback) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._getDocument(request, options, callback);
};

/**
 * Lists documents.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.parent
 *   The parent resource name. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents` or
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   For example:
 *   `projects/my-project/databases/my-database/documents` or
 *   `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
 * @param {string} request.collectionId
 *   The collection ID, relative to `parent`, to list. For example: `chatrooms`
 *   or `messages`.
 * @param {number=} request.pageSize
 *   The maximum number of resources contained in the underlying API
 *   response. If page streaming is performed per-resource, this
 *   parameter does not affect the return value. If page streaming is
 *   performed per-page, this determines the maximum number of
 *   resources in a page.
 * @param {string=} request.orderBy
 *   The order to sort results by. For example: `priority desc, name`.
 * @param {Object=} request.mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If a document has a field that is not present in this mask, that field
 *   will not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 * @param {string=} request.transaction
 *   Reads documents in a transaction.
 * @param {Object=} request.readTime
 *   Reads documents as they were at the given time.
 *   This may not be older than 60 seconds.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 * @param {boolean=} request.showMissing
 *   If the list should show missing documents. A missing document is a
 *   document that does not exist but has sub-documents. These documents will
 *   be returned with a key but will not have fields, {@link Document.create_time},
 *   or {@link Document.update_time} set.
 *
 *   Requests with `show_missing` may not specify `where` or
 *   `order_by`.
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error, ?Array, ?Object, ?Object)=} callback
 *   The function which will be called with the result of the API call.
 *
 *   The second parameter to the callback is Array of [Document]{@link google.firestore.v1beta1.Document}.
 *
 *   When autoPaginate: false is specified through options, it contains the result
 *   in a single response. If the response indicates the next page exists, the third
 *   parameter is set to be used for the next request object. The fourth parameter keeps
 *   the raw response object of an object representing [ListDocumentsResponse]{@link google.firestore.v1beta1.ListDocumentsResponse}.
 * @returns {Promise} - The promise which resolves to an array.
 *   The first element of the array is Array of [Document]{@link google.firestore.v1beta1.Document}.
 *
 *   When autoPaginate: false is specified through options, the array has three elements.
 *   The first element is Array of [Document]{@link google.firestore.v1beta1.Document} in a single response.
 *   The second element is the next request object if the response
 *   indicates the next page exists, or null. The third element is
 *   an object representing [ListDocumentsResponse]{@link google.firestore.v1beta1.ListDocumentsResponse}.
 *
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * // Iterate over all elements.
 * var formattedParent = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 * var collectionId = '';
 * var request = {
 *     parent: formattedParent,
 *     collectionId: collectionId
 * };
 *
 * client.listDocuments(request).then(function(responses) {
 *     var resources = responses[0];
 *     for (var i = 0; i < resources.length; ++i) {
 *         // doThingsWith(resources[i])
 *     }
 * })
 * .catch(function(err) {
 *     console.error(err);
 * });
 *
 * // Or obtain the paged response.
 * var formattedParent = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 * var collectionId = '';
 * var request = {
 *     parent: formattedParent,
 *     collectionId: collectionId
 * };
 *
 *
 * var options = {autoPaginate: false};
 * function callback(responses) {
 *     // The actual resources in a response.
 *     var resources = responses[0];
 *     // The next request if the response shows there's more responses.
 *     var nextRequest = responses[1];
 *     // The actual response object, if necessary.
 *     // var rawResponse = responses[2];
 *     for (var i = 0; i < resources.length; ++i) {
 *         // doThingsWith(resources[i]);
 *     }
 *     if (nextRequest) {
 *         // Fetch the next page.
 *         return client.listDocuments(nextRequest, options).then(callback);
 *     }
 * }
 * client.listDocuments(request, options)
 *     .then(callback)
 *     .catch(function(err) {
 *         console.error(err);
 *     });
 */
FirestoreClient.prototype.listDocuments = function(request, options, callback) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._listDocuments(request, options, callback);
};

/**
 * Equivalent to {@link listDocuments}, but returns a NodeJS Stream object.
 *
 * This fetches the paged responses for {@link listDocuments} continuously
 * and invokes the callback registered for 'data' event for each element in the
 * responses.
 *
 * The returned object has 'end' method when no more elements are required.
 *
 * autoPaginate option will be ignored.
 *
 * @see {@link https://nodejs.org/api/stream.html}
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.parent
 *   The parent resource name. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents` or
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   For example:
 *   `projects/my-project/databases/my-database/documents` or
 *   `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
 * @param {string} request.collectionId
 *   The collection ID, relative to `parent`, to list. For example: `chatrooms`
 *   or `messages`.
 * @param {number=} request.pageSize
 *   The maximum number of resources contained in the underlying API
 *   response. If page streaming is performed per-resource, this
 *   parameter does not affect the return value. If page streaming is
 *   performed per-page, this determines the maximum number of
 *   resources in a page.
 * @param {string=} request.orderBy
 *   The order to sort results by. For example: `priority desc, name`.
 * @param {Object=} request.mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If a document has a field that is not present in this mask, that field
 *   will not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 * @param {string=} request.transaction
 *   Reads documents in a transaction.
 * @param {Object=} request.readTime
 *   Reads documents as they were at the given time.
 *   This may not be older than 60 seconds.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 * @param {boolean=} request.showMissing
 *   If the list should show missing documents. A missing document is a
 *   document that does not exist but has sub-documents. These documents will
 *   be returned with a key but will not have fields, {@link Document.create_time},
 *   or {@link Document.update_time} set.
 *
 *   Requests with `show_missing` may not specify `where` or
 *   `order_by`.
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @returns {Stream}
 *   An object stream which emits an object representing [Document]{@link google.firestore.v1beta1.Document} on 'data' event.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedParent = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 * var collectionId = '';
 * var request = {
 *     parent: formattedParent,
 *     collectionId: collectionId
 * };
 * client.listDocumentsStream(request)
 * .on('data', function(element) {
 *     // doThingsWith(element)
 * }).on('error', function(err) {
 *     console.log(err);
 * });
 */
FirestoreClient.prototype.listDocumentsStream = function(request, options) {
  if (options === undefined) {
    options = {};
  }

  return PAGE_DESCRIPTORS.listDocuments.createStream(
    this._listDocuments,
    request,
    options
  );
};

/**
 * Creates a new document.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.parent
 *   The parent resource. For example:
 *   `projects/{project_id}/databases/{database_id}/documents` or
 *   `projects/{project_id}/databases/{database_id}/documents/chatrooms/{chatroom_id}`
 * @param {string} request.collectionId
 *   The collection ID, relative to `parent`, to list. For example: `chatrooms`.
 * @param {string} request.documentId
 *   The client-assigned document ID to use for this document.
 *
 *   Optional. If not specified, an ID will be assigned by the service.
 * @param {Object} request.document
 *   The document to create. `name` must not be set.
 *
 *   This object should have the same structure as [Document]{@link google.firestore.v1beta1.Document}
 * @param {Object=} request.mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If the document has a field that is not present in this mask, that field
 *   will not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error, ?Object)=} callback
 *   The function which will be called with the result of the API call.
 *
 *   The second parameter to the callback is an object representing [Document]{@link google.firestore.v1beta1.Document}.
 * @returns {Promise} - The promise which resolves to an array.
 *   The first element of the array is an object representing [Document]{@link google.firestore.v1beta1.Document}.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedParent = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 * var collectionId = '';
 * var documentId = '';
 * var document = {};
 * var request = {
 *     parent: formattedParent,
 *     collectionId: collectionId,
 *     documentId: documentId,
 *     document: document
 * };
 * client.createDocument(request).then(function(responses) {
 *     var response = responses[0];
 *     // doThingsWith(response)
 * })
 * .catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreClient.prototype.createDocument = function(
  request,
  options,
  callback
) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._createDocument(request, options, callback);
};

/**
 * Updates or inserts a document.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {Object} request.document
 *   The updated document.
 *   Creates the document if it does not already exist.
 *
 *   This object should have the same structure as [Document]{@link google.firestore.v1beta1.Document}
 * @param {Object} request.updateMask
 *   The fields to update.
 *   None of the field paths in the mask may contain a reserved name.
 *
 *   If the document exists on the server and has fields not referenced in the
 *   mask, they are left unchanged.
 *   Fields referenced in the mask, but not present in the input document, are
 *   deleted from the document on the server.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 * @param {Object=} request.mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If the document has a field that is not present in this mask, that field
 *   will not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 * @param {Object=} request.currentDocument
 *   An optional precondition on the document.
 *   The request will fail if this is set and not met by the target document.
 *
 *   This object should have the same structure as [Precondition]{@link google.firestore.v1beta1.Precondition}
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error, ?Object)=} callback
 *   The function which will be called with the result of the API call.
 *
 *   The second parameter to the callback is an object representing [Document]{@link google.firestore.v1beta1.Document}.
 * @returns {Promise} - The promise which resolves to an array.
 *   The first element of the array is an object representing [Document]{@link google.firestore.v1beta1.Document}.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var document = {};
 * var updateMask = {};
 * var request = {
 *     document: document,
 *     updateMask: updateMask
 * };
 * client.updateDocument(request).then(function(responses) {
 *     var response = responses[0];
 *     // doThingsWith(response)
 * })
 * .catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreClient.prototype.updateDocument = function(
  request,
  options,
  callback
) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._updateDocument(request, options, callback);
};

/**
 * Deletes a document.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.name
 *   The resource name of the Document to delete. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 * @param {Object=} request.currentDocument
 *   An optional precondition on the document.
 *   The request will fail if this is set and not met by the target document.
 *
 *   This object should have the same structure as [Precondition]{@link google.firestore.v1beta1.Precondition}
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error)=} callback
 *   The function which will be called with the result of the API call.
 * @returns {Promise} - The promise which resolves when API call finishes.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedName = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 * client.deleteDocument({name: formattedName}).catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreClient.prototype.deleteDocument = function(
  request,
  options,
  callback
) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._deleteDocument(request, options, callback);
};

/**
 * Gets multiple documents.
 *
 * Documents returned by this method are not guaranteed to be returned in the
 * same order that they were requested.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 * @param {string[]} request.documents
 *   The names of the documents to retrieve. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   The request will fail if any of the document is not a child resource of the
 *   given `database`. Duplicate names will be elided.
 * @param {Object=} request.mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If a document has a field that is not present in this mask, that field will
 *   not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 * @param {string=} request.transaction
 *   Reads documents in a transaction.
 * @param {Object=} request.newTransaction
 *   Starts a new transaction and reads the documents.
 *   Defaults to a read-only transaction.
 *   The new transaction ID will be returned as the first response in the
 *   stream.
 *
 *   This object should have the same structure as [TransactionOptions]{@link google.firestore.v1beta1.TransactionOptions}
 * @param {Object=} request.readTime
 *   Reads documents as they were at the given time.
 *   This may not be older than 60 seconds.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @returns {Stream}
 *   An object stream which emits [BatchGetDocumentsResponse]{@link google.firestore.v1beta1.BatchGetDocumentsResponse} on 'data' event.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedDatabase = client.databaseRootPath("[PROJECT]", "[DATABASE]");
 * var documents = [];
 * var request = {
 *     database: formattedDatabase,
 *     documents: documents
 * };
 * client.batchGetDocuments(request).on('data', function(response) {
 *   // doThingsWith(response)
 * });
 */
FirestoreClient.prototype.batchGetDocuments = function(request, options) {
  if (options === undefined) {
    options = {};
  }

  return this._batchGetDocuments(request, options);
};

/**
 * Starts a new transaction.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 * @param {Object=} request.options
 *   The options for the transaction.
 *   Defaults to a read-write transaction.
 *
 *   This object should have the same structure as [TransactionOptions]{@link google.firestore.v1beta1.TransactionOptions}
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error, ?Object)=} callback
 *   The function which will be called with the result of the API call.
 *
 *   The second parameter to the callback is an object representing [BeginTransactionResponse]{@link google.firestore.v1beta1.BeginTransactionResponse}.
 * @returns {Promise} - The promise which resolves to an array.
 *   The first element of the array is an object representing [BeginTransactionResponse]{@link google.firestore.v1beta1.BeginTransactionResponse}.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedDatabase = client.databaseRootPath("[PROJECT]", "[DATABASE]");
 * client.beginTransaction({database: formattedDatabase}).then(function(responses) {
 *     var response = responses[0];
 *     // doThingsWith(response)
 * })
 * .catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreClient.prototype.beginTransaction = function(
  request,
  options,
  callback
) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._beginTransaction(request, options, callback);
};

/**
 * Commits a transaction, while optionally updating documents.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 * @param {Object[]} request.writes
 *   The writes to apply.
 *
 *   Always executed atomically and in order.
 *
 *   This object should have the same structure as [Write]{@link google.firestore.v1beta1.Write}
 * @param {string=} request.transaction
 *   If set, applies all writes in this transaction, and commits it.
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error, ?Object)=} callback
 *   The function which will be called with the result of the API call.
 *
 *   The second parameter to the callback is an object representing [CommitResponse]{@link google.firestore.v1beta1.CommitResponse}.
 * @returns {Promise} - The promise which resolves to an array.
 *   The first element of the array is an object representing [CommitResponse]{@link google.firestore.v1beta1.CommitResponse}.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedDatabase = client.databaseRootPath("[PROJECT]", "[DATABASE]");
 * var writes = [];
 * var request = {
 *     database: formattedDatabase,
 *     writes: writes
 * };
 * client.commit(request).then(function(responses) {
 *     var response = responses[0];
 *     // doThingsWith(response)
 * })
 * .catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreClient.prototype.commit = function(request, options, callback) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._commit(request, options, callback);
};

/**
 * Rolls back a transaction.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 * @param {string} request.transaction
 *   The transaction to roll back.
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error)=} callback
 *   The function which will be called with the result of the API call.
 * @returns {Promise} - The promise which resolves when API call finishes.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedDatabase = client.databaseRootPath("[PROJECT]", "[DATABASE]");
 * var transaction = '';
 * var request = {
 *     database: formattedDatabase,
 *     transaction: transaction
 * };
 * client.rollback(request).catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreClient.prototype.rollback = function(request, options, callback) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._rollback(request, options, callback);
};

/**
 * Runs a query.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.parent
 *   The parent resource name. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents` or
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   For example:
 *   `projects/my-project/databases/my-database/documents` or
 *   `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
 * @param {Object=} request.structuredQuery
 *   A structured query.
 *
 *   This object should have the same structure as [StructuredQuery]{@link google.firestore.v1beta1.StructuredQuery}
 * @param {string=} request.transaction
 *   Reads documents in a transaction.
 * @param {Object=} request.newTransaction
 *   Starts a new transaction and reads the documents.
 *   Defaults to a read-only transaction.
 *   The new transaction ID will be returned as the first response in the
 *   stream.
 *
 *   This object should have the same structure as [TransactionOptions]{@link google.firestore.v1beta1.TransactionOptions}
 * @param {Object=} request.readTime
 *   Reads documents as they were at the given time.
 *   This may not be older than 60 seconds.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @returns {Stream}
 *   An object stream which emits [RunQueryResponse]{@link google.firestore.v1beta1.RunQueryResponse} on 'data' event.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedParent = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 * client.runQuery({parent: formattedParent}).on('data', function(response) {
 *   // doThingsWith(response)
 * });
 */
FirestoreClient.prototype.runQuery = function(request, options) {
  if (options === undefined) {
    options = {};
  }

  return this._runQuery(request, options);
};

/**
 * Streams batches of document updates and deletes, in order.
 *
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @returns {Stream}
 *   An object stream which is both readable and writable. It accepts objects
 *   representing [WriteRequest]{@link google.firestore.v1beta1.WriteRequest} for write() method, and
 *   will emit objects representing [WriteResponse]{@link google.firestore.v1beta1.WriteResponse} on 'data' event asynchronously.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var stream = client.write().on('data', function(response) {
 *     // doThingsWith(response)
 * });
 * var formattedDatabase = client.databaseRootPath("[PROJECT]", "[DATABASE]");
 * var request = {
 *     database : formattedDatabase
 * };
 * // Write request objects.
 * stream.write(request);
 */
FirestoreClient.prototype.write = function(options) {
  if (options === undefined) {
    options = {};
  }

  return this._write(options);
};

/**
 * Listens to changes.
 *
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @returns {Stream}
 *   An object stream which is both readable and writable. It accepts objects
 *   representing [ListenRequest]{@link google.firestore.v1beta1.ListenRequest} for write() method, and
 *   will emit objects representing [ListenResponse]{@link google.firestore.v1beta1.ListenResponse} on 'data' event asynchronously.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var stream = client.listen().on('data', function(response) {
 *     // doThingsWith(response)
 * });
 * var formattedDatabase = client.databaseRootPath("[PROJECT]", "[DATABASE]");
 * var request = {
 *     database : formattedDatabase
 * };
 * // Write request objects.
 * stream.write(request);
 */
FirestoreClient.prototype.listen = function(options) {
  if (options === undefined) {
    options = {};
  }

  return this._listen(options);
};

/**
 * Lists all the collection IDs underneath a document.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.parent
 *   The parent document. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   For example:
 *   `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
 * @param {number=} request.pageSize
 *   The maximum number of resources contained in the underlying API
 *   response. If page streaming is performed per-resource, this
 *   parameter does not affect the return value. If page streaming is
 *   performed per-page, this determines the maximum number of
 *   resources in a page.
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error, ?Array, ?Object, ?Object)=} callback
 *   The function which will be called with the result of the API call.
 *
 *   The second parameter to the callback is Array of string.
 *
 *   When autoPaginate: false is specified through options, it contains the result
 *   in a single response. If the response indicates the next page exists, the third
 *   parameter is set to be used for the next request object. The fourth parameter keeps
 *   the raw response object of an object representing [ListCollectionIdsResponse]{@link google.firestore.v1beta1.ListCollectionIdsResponse}.
 * @returns {Promise} - The promise which resolves to an array.
 *   The first element of the array is Array of string.
 *
 *   When autoPaginate: false is specified through options, the array has three elements.
 *   The first element is Array of string in a single response.
 *   The second element is the next request object if the response
 *   indicates the next page exists, or null. The third element is
 *   an object representing [ListCollectionIdsResponse]{@link google.firestore.v1beta1.ListCollectionIdsResponse}.
 *
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * // Iterate over all elements.
 * var formattedParent = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 *
 * client.listCollectionIds({parent: formattedParent}).then(function(responses) {
 *     var resources = responses[0];
 *     for (var i = 0; i < resources.length; ++i) {
 *         // doThingsWith(resources[i])
 *     }
 * })
 * .catch(function(err) {
 *     console.error(err);
 * });
 *
 * // Or obtain the paged response.
 * var formattedParent = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 *
 *
 * var options = {autoPaginate: false};
 * function callback(responses) {
 *     // The actual resources in a response.
 *     var resources = responses[0];
 *     // The next request if the response shows there's more responses.
 *     var nextRequest = responses[1];
 *     // The actual response object, if necessary.
 *     // var rawResponse = responses[2];
 *     for (var i = 0; i < resources.length; ++i) {
 *         // doThingsWith(resources[i]);
 *     }
 *     if (nextRequest) {
 *         // Fetch the next page.
 *         return client.listCollectionIds(nextRequest, options).then(callback);
 *     }
 * }
 * client.listCollectionIds({parent: formattedParent}, options)
 *     .then(callback)
 *     .catch(function(err) {
 *         console.error(err);
 *     });
 */
FirestoreClient.prototype.listCollectionIds = function(
  request,
  options,
  callback
) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._listCollectionIds(request, options, callback);
};

/**
 * Equivalent to {@link listCollectionIds}, but returns a NodeJS Stream object.
 *
 * This fetches the paged responses for {@link listCollectionIds} continuously
 * and invokes the callback registered for 'data' event for each element in the
 * responses.
 *
 * The returned object has 'end' method when no more elements are required.
 *
 * autoPaginate option will be ignored.
 *
 * @see {@link https://nodejs.org/api/stream.html}
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.parent
 *   The parent document. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   For example:
 *   `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
 * @param {number=} request.pageSize
 *   The maximum number of resources contained in the underlying API
 *   response. If page streaming is performed per-resource, this
 *   parameter does not affect the return value. If page streaming is
 *   performed per-page, this determines the maximum number of
 *   resources in a page.
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @returns {Stream}
 *   An object stream which emits a string on 'data' event.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1({
 *   // optional auth parameters.
 * });
 *
 * var formattedParent = client.anyPathPath("[PROJECT]", "[DATABASE]", "[DOCUMENT]", "[ANY_PATH]");
 * client.listCollectionIdsStream({parent: formattedParent})
 * .on('data', function(element) {
 *     // doThingsWith(element)
 * }).on('error', function(err) {
 *     console.log(err);
 * });
 */
FirestoreClient.prototype.listCollectionIdsStream = function(request, options) {
  if (options === undefined) {
    options = {};
  }

  return PAGE_DESCRIPTORS.listCollectionIds.createStream(
    this._listCollectionIds,
    request,
    options
  );
};

/**
 * @class
 * @param {*} gaxGrpc
 */
function FirestoreClientBuilder(gaxGrpc) {
  if (!(this instanceof FirestoreClientBuilder)) {
    return new FirestoreClientBuilder(gaxGrpc);
  }

  var firestoreStubProtos = gaxGrpc.loadProto(
    path.join(__dirname, '..', '..', 'protos'),
    'google/firestore/v1beta1/firestore.proto'
  );
  extend(this, firestoreStubProtos.google.firestore.v1beta1);

  /**
   * Build a new instance of {@link FirestoreClient}.
   *
   * @method FirestoreClientBuilder#firestoreClient
   * @param {Object=} opts - The optional parameters.
   * @param {String=} opts.servicePath
   *   The domain name of the API remote host.
   * @param {number=} opts.port
   *   The port on which to connect to the remote host.
   * @param {grpc.ClientCredentials=} opts.sslCreds
   *   A ClientCredentials for use with an SSL-enabled channel.
   * @param {Object=} opts.clientConfig
   *   The customized config to build the call settings. See
   *   {@link gax.constructSettings} for the format.
   */
  this.firestoreClient = function(opts) {
    return new FirestoreClient(gaxGrpc, firestoreStubProtos, opts);
  };
  extend(this.firestoreClient, FirestoreClient);
}
module.exports = FirestoreClientBuilder;
module.exports.SERVICE_ADDRESS = SERVICE_ADDRESS;
module.exports.ALL_SCOPES = ALL_SCOPES;
