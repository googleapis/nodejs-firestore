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

const gapicConfig = require('./firestore_client_config');
const gax = require('google-gax');
const merge = require('lodash.merge');
const path = require('path');

const VERSION = require('../../package.json').version;

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
 * @class
 * @memberof v1beta1
 */
class FirestoreClient {
  /**
   * Construct an instance of FirestoreClient.
   *
   * @param {object} [options] - The configuration object. See the subsequent
   *   parameters for more details.
   * @param {object} [options.credentials] - Credentials object.
   * @param {string} [options.credentials.client_email]
   * @param {string} [options.credentials.private_key]
   * @param {string} [options.email] - Account email address. Required when
   *     using a .pem or .p12 keyFilename.
   * @param {string} [options.keyFilename] - Full path to the a .json, .pem, or
   *     .p12 key downloaded from the Google Developers Console. If you provide
   *     a path to a JSON file, the projectId option below is not necessary.
   *     NOTE: .pem and .p12 require you to specify options.email as well.
   * @param {number} [options.port] - The port on which to connect to
   *     the remote host.
   * @param {string} [options.projectId] - The project ID from the Google
   *     Developer's Console, e.g. 'grape-spaceship-123'. We will also check
   *     the environment variable GCLOUD_PROJECT for your project ID. If your
   *     app is running in an environment which supports
   *     {@link https://developers.google.com/identity/protocols/application-default-credentials Application Default Credentials},
   *     your project ID will be detected automatically.
   * @param {function} [options.promise] - Custom promise module to use instead
   *     of native Promises.
   * @param {string} [options.servicePath] - The domain name of the
   *     API remote host.
   */
  constructor(opts) {
    this._descriptors = {};

    // Ensure that options include the service address and port.
    opts = Object.assign(
      {
        clientConfig: {},
        port: this.constructor.port,
        servicePath: this.constructor.servicePath,
      },
      opts
    );

    // Create a `gaxGrpc` object, with any grpc-specific options
    // sent to the client.
    opts.scopes = this.constructor.scopes;
    var gaxGrpc = new gax.GrpcClient(opts);

    // Save the auth object to the client, for use by other methods.
    this.auth = gaxGrpc.auth;

    // Determine the client header string.
    var clientHeader = [
      `gl-node/${process.version}`,
      `grpc/${gaxGrpc.grpcVersion}`,
      `gax/${gax.version}`,
      `gapic/${VERSION}`,
    ];
    if (opts.libName && opts.libVersion) {
      clientHeader.push(`${opts.libName}/${opts.libVersion}`);
    }

    // Load the applicable protos.
    var protos = merge(
      {},
      gaxGrpc.loadProto(
        path.join(__dirname, '..', '..', 'protos'),
        'google/firestore/v1beta1/firestore.proto'
      )
    );

    // This API contains "path templates"; forward-slash-separated
    // identifiers to uniquely identify resources within the API.
    // Create useful helper objects for these.
    this._pathTemplates = {
      databaseRootPathTemplate: new gax.PathTemplate(
        'projects/{project}/databases/{database}'
      ),
      documentRootPathTemplate: new gax.PathTemplate(
        'projects/{project}/databases/{database}/documents'
      ),
      documentPathPathTemplate: new gax.PathTemplate(
        'projects/{project}/databases/{database}/documents/{document_path=**}'
      ),
      anyPathPathTemplate: new gax.PathTemplate(
        'projects/{project}/databases/{database}/documents/{document}/{any_path=**}'
      ),
    };

    // Some of the methods on this service return "paged" results,
    // (e.g. 50 results at a time, with tokens to get subsequent
    // pages). Denote the keys used for pagination and results.
    this._descriptors.page = {
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

    // Some of the methods on this service provide streaming responses.
    // Provide descriptors for these.
    this._descriptors.stream = {
      batchGetDocuments: new gax.StreamDescriptor(gax.StreamType.SERVER_STREAMING),
      runQuery: new gax.StreamDescriptor(gax.StreamType.SERVER_STREAMING),
      write: new gax.StreamDescriptor(gax.StreamType.BIDI_STREAMING),
      listen: new gax.StreamDescriptor(gax.StreamType.BIDI_STREAMING),
    };

    // Put together the default options sent with requests.
    var defaults = gaxGrpc.constructSettings(
      'google.firestore.v1beta1.Firestore',
      gapicConfig,
      opts.clientConfig,
      {'x-goog-api-client': clientHeader.join(' ')}
    );

    // Set up a dictionary of "inner API calls"; the core implementation
    // of calling the API is handled in `google-gax`, with this code
    // merely providing the destination and request information.
    this._innerApiCalls = {};

    // Put together the "service stub" for
    // google.firestore.v1beta1.Firestore.
    var firestoreStub = gaxGrpc.createStub(
      protos.google.firestore.v1beta1.Firestore,
      opts
    );

    // Iterate over each of the methods that the service provides
    // and create an API call method for each.
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
    for (let methodName of firestoreStubMethods) {
      this._innerApiCalls[methodName] = gax.createApiCall(
        firestoreStub.then(
          stub =>
            function() {
              var args = Array.prototype.slice.call(arguments, 0);
              return stub[methodName].apply(stub, args);
            }
        ),
        defaults[methodName],
        this._descriptors.page[methodName] || this._descriptors.stream[methodName]
      );
    }
  }

  /**
   * The DNS address for this API service.
   */
  static get servicePath() {
    return 'firestore.googleapis.com';
  }

  /**
   * The port for this API service.
   */
  static get port() {
    return 443;
  }

  /**
   * The scopes needed to make gRPC calls for every method defined
   * in this service.
   */
  static get scopes() {
    return [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/datastore',
    ];
  }

  /**
   * Return the project ID used by this class.
   * @param {function(Error, string)} callback - the callback to
   *   be called with the current project Id.
   */
  getProjectId(callback) {
    return this.auth.getProjectId(callback);
  }

  // -------------------
  // -- Service calls --
  // -------------------

  /**
   * Gets a single document.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   The resource name of the Document to get. In the format:
   *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
   * @param {Object} [request.mask]
   *   The fields to return. If not set, returns all fields.
   *
   *   If the document has a field that is not present in this mask, that field
   *   will not be returned in the response.
   *
   *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
   * @param {string} [request.transaction]
   *   Reads the document in a transaction.
   * @param {Object} [request.readTime]
   *   Reads the version of the document at the given time.
   *   This may not be older than 60 seconds.
   *
   *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Document]{@link google.firestore.v1beta1.Document}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Document]{@link google.firestore.v1beta1.Document}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedName = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   * client.getDocument({name: formattedName})
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getDocument(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.getDocument(request, options, callback);
  }

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
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {string} [request.orderBy]
   *   The order to sort results by. For example: `priority desc, name`.
   * @param {Object} [request.mask]
   *   The fields to return. If not set, returns all fields.
   *
   *   If a document has a field that is not present in this mask, that field
   *   will not be returned in the response.
   *
   *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
   * @param {string} [request.transaction]
   *   Reads documents in a transaction.
   * @param {Object} [request.readTime]
   *   Reads documents as they were at the given time.
   *   This may not be older than 60 seconds.
   *
   *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
   * @param {boolean} [request.showMissing]
   *   If the list should show missing documents. A missing document is a
   *   document that does not exist but has sub-documents. These documents will
   *   be returned with a key but will not have fields, Document.create_time,
   *   or Document.update_time set.
   *
   *   Requests with `show_missing` may not specify `where` or
   *   `order_by`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
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
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * var formattedParent = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   * var collectionId = '';
   * var request = {
   *   parent: formattedParent,
   *   collectionId: collectionId,
   * };
   *
   * client.listDocuments(request)
   *   .then(responses => {
   *     var resources = responses[0];
   *     for (let i = 0; i < resources.length; i += 1) {
   *       // doThingsWith(resources[i])
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * var formattedParent = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   * var collectionId = '';
   * var request = {
   *   parent: formattedParent,
   *   collectionId: collectionId,
   * };
   *
   *
   * var options = {autoPaginate: false};
   * var callback = responses => {
   *   // The actual resources in a response.
   *   var resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   var nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // var rawResponse = responses[2];
   *   for (let i = 0; i < resources.length; i += 1) {
   *     // doThingsWith(resources[i]);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listDocuments(nextRequest, options).then(callback);
   *   }
   * }
   * client.listDocuments(request, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listDocuments(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.listDocuments(request, options, callback);
  }

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
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {string} [request.orderBy]
   *   The order to sort results by. For example: `priority desc, name`.
   * @param {Object} [request.mask]
   *   The fields to return. If not set, returns all fields.
   *
   *   If a document has a field that is not present in this mask, that field
   *   will not be returned in the response.
   *
   *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
   * @param {string} [request.transaction]
   *   Reads documents in a transaction.
   * @param {Object} [request.readTime]
   *   Reads documents as they were at the given time.
   *   This may not be older than 60 seconds.
   *
   *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
   * @param {boolean} [request.showMissing]
   *   If the list should show missing documents. A missing document is a
   *   document that does not exist but has sub-documents. These documents will
   *   be returned with a key but will not have fields, Document.create_time,
   *   or Document.update_time set.
   *
   *   Requests with `show_missing` may not specify `where` or
   *   `order_by`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [Document]{@link google.firestore.v1beta1.Document} on 'data' event.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedParent = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   * var collectionId = '';
   * var request = {
   *   parent: formattedParent,
   *   collectionId: collectionId,
   * };
   * client.listDocumentsStream(request)
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listDocumentsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listDocuments.createStream(
      this._innerApiCalls.listDocuments,
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
   * @param {Object} [request.mask]
   *   The fields to return. If not set, returns all fields.
   *
   *   If the document has a field that is not present in this mask, that field
   *   will not be returned in the response.
   *
   *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Document]{@link google.firestore.v1beta1.Document}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Document]{@link google.firestore.v1beta1.Document}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedParent = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   * var collectionId = '';
   * var documentId = '';
   * var document = {};
   * var request = {
   *   parent: formattedParent,
   *   collectionId: collectionId,
   *   documentId: documentId,
   *   document: document,
   * };
   * client.createDocument(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  createDocument(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.createDocument(request, options, callback);
  }

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
   * @param {Object} [request.mask]
   *   The fields to return. If not set, returns all fields.
   *
   *   If the document has a field that is not present in this mask, that field
   *   will not be returned in the response.
   *
   *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
   * @param {Object} [request.currentDocument]
   *   An optional precondition on the document.
   *   The request will fail if this is set and not met by the target document.
   *
   *   This object should have the same structure as [Precondition]{@link google.firestore.v1beta1.Precondition}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Document]{@link google.firestore.v1beta1.Document}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Document]{@link google.firestore.v1beta1.Document}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var document = {};
   * var updateMask = {};
   * var request = {
   *   document: document,
   *   updateMask: updateMask,
   * };
   * client.updateDocument(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  updateDocument(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.updateDocument(request, options, callback);
  }

  /**
   * Deletes a document.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   The resource name of the Document to delete. In the format:
   *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
   * @param {Object} [request.currentDocument]
   *   An optional precondition on the document.
   *   The request will fail if this is set and not met by the target document.
   *
   *   This object should have the same structure as [Precondition]{@link google.firestore.v1beta1.Precondition}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error)} [callback]
   *   The function which will be called with the result of the API call.
   * @returns {Promise} - The promise which resolves when API call finishes.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedName = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   * client.deleteDocument({name: formattedName}).catch(err => {
   *   console.error(err);
   * });
   */
  deleteDocument(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.deleteDocument(request, options, callback);
  }

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
   * @param {Object} [request.mask]
   *   The fields to return. If not set, returns all fields.
   *
   *   If a document has a field that is not present in this mask, that field will
   *   not be returned in the response.
   *
   *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
   * @param {string} [request.transaction]
   *   Reads documents in a transaction.
   * @param {Object} [request.newTransaction]
   *   Starts a new transaction and reads the documents.
   *   Defaults to a read-only transaction.
   *   The new transaction ID will be returned as the first response in the
   *   stream.
   *
   *   This object should have the same structure as [TransactionOptions]{@link google.firestore.v1beta1.TransactionOptions}
   * @param {Object} [request.readTime]
   *   Reads documents as they were at the given time.
   *   This may not be older than 60 seconds.
   *
   *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits [BatchGetDocumentsResponse]{@link google.firestore.v1beta1.BatchGetDocumentsResponse} on 'data' event.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedDatabase = client.databaseRootPath('[PROJECT]', '[DATABASE]');
   * var documents = [];
   * var request = {
   *   database: formattedDatabase,
   *   documents: documents,
   * };
   * client.batchGetDocuments(request).on('data', response => {
   *   // doThingsWith(response)
   * });
   */
  batchGetDocuments(request, options) {
    options = options || {};

    return this._innerApiCalls.batchGetDocuments(request, options);
  }

  /**
   * Starts a new transaction.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.database
   *   The database name. In the format:
   *   `projects/{project_id}/databases/{database_id}`.
   * @param {Object} [request.options]
   *   The options for the transaction.
   *   Defaults to a read-write transaction.
   *
   *   This object should have the same structure as [TransactionOptions]{@link google.firestore.v1beta1.TransactionOptions}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [BeginTransactionResponse]{@link google.firestore.v1beta1.BeginTransactionResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [BeginTransactionResponse]{@link google.firestore.v1beta1.BeginTransactionResponse}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedDatabase = client.databaseRootPath('[PROJECT]', '[DATABASE]');
   * client.beginTransaction({database: formattedDatabase})
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  beginTransaction(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.beginTransaction(request, options, callback);
  }

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
   * @param {string} [request.transaction]
   *   If set, applies all writes in this transaction, and commits it.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [CommitResponse]{@link google.firestore.v1beta1.CommitResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [CommitResponse]{@link google.firestore.v1beta1.CommitResponse}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedDatabase = client.databaseRootPath('[PROJECT]', '[DATABASE]');
   * var writes = [];
   * var request = {
   *   database: formattedDatabase,
   *   writes: writes,
   * };
   * client.commit(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  commit(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.commit(request, options, callback);
  }

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
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error)} [callback]
   *   The function which will be called with the result of the API call.
   * @returns {Promise} - The promise which resolves when API call finishes.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedDatabase = client.databaseRootPath('[PROJECT]', '[DATABASE]');
   * var transaction = '';
   * var request = {
   *   database: formattedDatabase,
   *   transaction: transaction,
   * };
   * client.rollback(request).catch(err => {
   *   console.error(err);
   * });
   */
  rollback(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.rollback(request, options, callback);
  }

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
   * @param {Object} [request.structuredQuery]
   *   A structured query.
   *
   *   This object should have the same structure as [StructuredQuery]{@link google.firestore.v1beta1.StructuredQuery}
   * @param {string} [request.transaction]
   *   Reads documents in a transaction.
   * @param {Object} [request.newTransaction]
   *   Starts a new transaction and reads the documents.
   *   Defaults to a read-only transaction.
   *   The new transaction ID will be returned as the first response in the
   *   stream.
   *
   *   This object should have the same structure as [TransactionOptions]{@link google.firestore.v1beta1.TransactionOptions}
   * @param {Object} [request.readTime]
   *   Reads documents as they were at the given time.
   *   This may not be older than 60 seconds.
   *
   *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits [RunQueryResponse]{@link google.firestore.v1beta1.RunQueryResponse} on 'data' event.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedParent = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   * client.runQuery({parent: formattedParent}).on('data', response => {
   *   // doThingsWith(response)
   * });
   */
  runQuery(request, options) {
    options = options || {};

    return this._innerApiCalls.runQuery(request, options);
  }

  /**
   * Streams batches of document updates and deletes, in order.
   *
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which is both readable and writable. It accepts objects
   *   representing [WriteRequest]{@link google.firestore.v1beta1.WriteRequest} for write() method, and
   *   will emit objects representing [WriteResponse]{@link google.firestore.v1beta1.WriteResponse} on 'data' event asynchronously.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var stream = client.write().on('data', response => {
   *   // doThingsWith(response)
   * });
   * var formattedDatabase = client.databaseRootPath('[PROJECT]', '[DATABASE]');
   * var request = {
   *   database: formattedDatabase,
   * };
   * // Write request objects.
   * stream.write(request);
   */
  write(options) {
    options = options || {};

    return this._innerApiCalls.write(options);
  }

  /**
   * Listens to changes.
   *
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which is both readable and writable. It accepts objects
   *   representing [ListenRequest]{@link google.firestore.v1beta1.ListenRequest} for write() method, and
   *   will emit objects representing [ListenResponse]{@link google.firestore.v1beta1.ListenResponse} on 'data' event asynchronously.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var stream = client.listen().on('data', response => {
   *   // doThingsWith(response)
   * });
   * var formattedDatabase = client.databaseRootPath('[PROJECT]', '[DATABASE]');
   * var request = {
   *   database: formattedDatabase,
   * };
   * // Write request objects.
   * stream.write(request);
   */
  listen(options) {
    options = options || {};

    return this._innerApiCalls.listen(options);
  }

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
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
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
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * var formattedParent = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   *
   * client.listCollectionIds({parent: formattedParent})
   *   .then(responses => {
   *     var resources = responses[0];
   *     for (let i = 0; i < resources.length; i += 1) {
   *       // doThingsWith(resources[i])
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * var formattedParent = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   *
   *
   * var options = {autoPaginate: false};
   * var callback = responses => {
   *   // The actual resources in a response.
   *   var resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   var nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // var rawResponse = responses[2];
   *   for (let i = 0; i < resources.length; i += 1) {
   *     // doThingsWith(resources[i]);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listCollectionIds(nextRequest, options).then(callback);
   *   }
   * }
   * client.listCollectionIds({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listCollectionIds(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.listCollectionIds(request, options, callback);
  }

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
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits a string on 'data' event.
   *
   * @example
   *
   * const firestore = require('firestore.v1beta1');
   *
   * var client = new firestore.v1beta1.FirestoreClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedParent = client.anyPathPath('[PROJECT]', '[DATABASE]', '[DOCUMENT]', '[ANY_PATH]');
   * client.listCollectionIdsStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listCollectionIdsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listCollectionIds.createStream(
      this._innerApiCalls.listCollectionIds,
      request,
      options
    );
  };

  // --------------------
  // -- Path templates --
  // --------------------

  /**
   * Return a fully-qualified database_root resource name string.
   *
   * @param {String} project
   * @param {String} database
   * @returns {String}
   */
  databaseRootPath(project, database) {
    return this._pathTemplates.databaseRootPathTemplate.render({
      project: project,
      database: database,
    });
  }

  /**
   * Return a fully-qualified document_root resource name string.
   *
   * @param {String} project
   * @param {String} database
   * @returns {String}
   */
  documentRootPath(project, database) {
    return this._pathTemplates.documentRootPathTemplate.render({
      project: project,
      database: database,
    });
  }

  /**
   * Return a fully-qualified document_path resource name string.
   *
   * @param {String} project
   * @param {String} database
   * @param {String} documentPath
   * @returns {String}
   */
  documentPathPath(project, database, documentPath) {
    return this._pathTemplates.documentPathPathTemplate.render({
      project: project,
      database: database,
      document_path: documentPath,
    });
  }

  /**
   * Return a fully-qualified any_path resource name string.
   *
   * @param {String} project
   * @param {String} database
   * @param {String} document
   * @param {String} anyPath
   * @returns {String}
   */
  anyPathPath(project, database, document, anyPath) {
    return this._pathTemplates.anyPathPathTemplate.render({
      project: project,
      database: database,
      document: document,
      any_path: anyPath,
    });
  }

  /**
   * Parse the databaseRootName from a database_root resource.
   *
   * @param {String} databaseRootName
   *   A fully-qualified path representing a database_root resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromDatabaseRootName(databaseRootName) {
    return this._pathTemplates.databaseRootPathTemplate
      .match(databaseRootName)
      .project;
  }

  /**
   * Parse the databaseRootName from a database_root resource.
   *
   * @param {String} databaseRootName
   *   A fully-qualified path representing a database_root resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromDatabaseRootName(databaseRootName) {
    return this._pathTemplates.databaseRootPathTemplate
      .match(databaseRootName)
      .database;
  }

  /**
   * Parse the documentRootName from a document_root resource.
   *
   * @param {String} documentRootName
   *   A fully-qualified path representing a document_root resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromDocumentRootName(documentRootName) {
    return this._pathTemplates.documentRootPathTemplate
      .match(documentRootName)
      .project;
  }

  /**
   * Parse the documentRootName from a document_root resource.
   *
   * @param {String} documentRootName
   *   A fully-qualified path representing a document_root resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromDocumentRootName(documentRootName) {
    return this._pathTemplates.documentRootPathTemplate
      .match(documentRootName)
      .database;
  }

  /**
   * Parse the documentPathName from a document_path resource.
   *
   * @param {String} documentPathName
   *   A fully-qualified path representing a document_path resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromDocumentPathName(documentPathName) {
    return this._pathTemplates.documentPathPathTemplate
      .match(documentPathName)
      .project;
  }

  /**
   * Parse the documentPathName from a document_path resource.
   *
   * @param {String} documentPathName
   *   A fully-qualified path representing a document_path resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromDocumentPathName(documentPathName) {
    return this._pathTemplates.documentPathPathTemplate
      .match(documentPathName)
      .database;
  }

  /**
   * Parse the documentPathName from a document_path resource.
   *
   * @param {String} documentPathName
   *   A fully-qualified path representing a document_path resources.
   * @returns {String} - A string representing the document_path.
   */
  matchDocumentPathFromDocumentPathName(documentPathName) {
    return this._pathTemplates.documentPathPathTemplate
      .match(documentPathName)
      .document_path;
  }

  /**
   * Parse the anyPathName from a any_path resource.
   *
   * @param {String} anyPathName
   *   A fully-qualified path representing a any_path resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromAnyPathName(anyPathName) {
    return this._pathTemplates.anyPathPathTemplate
      .match(anyPathName)
      .project;
  }

  /**
   * Parse the anyPathName from a any_path resource.
   *
   * @param {String} anyPathName
   *   A fully-qualified path representing a any_path resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromAnyPathName(anyPathName) {
    return this._pathTemplates.anyPathPathTemplate
      .match(anyPathName)
      .database;
  }

  /**
   * Parse the anyPathName from a any_path resource.
   *
   * @param {String} anyPathName
   *   A fully-qualified path representing a any_path resources.
   * @returns {String} - A string representing the document.
   */
  matchDocumentFromAnyPathName(anyPathName) {
    return this._pathTemplates.anyPathPathTemplate
      .match(anyPathName)
      .document;
  }

  /**
   * Parse the anyPathName from a any_path resource.
   *
   * @param {String} anyPathName
   *   A fully-qualified path representing a any_path resources.
   * @returns {String} - A string representing the any_path.
   */
  matchAnyPathFromAnyPathName(anyPathName) {
    return this._pathTemplates.anyPathPathTemplate
      .match(anyPathName)
      .any_path;
  }
}


module.exports = FirestoreClient;
