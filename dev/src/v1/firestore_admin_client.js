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

const gapicConfig = require('./firestore_admin_client_config.json');
const gax = require('google-gax');
const path = require('path');

const VERSION = require('../../../package.json').version;

/**
 * Operations are created by service `FirestoreAdmin`, but are accessed via
 * service `google.longrunning.Operations`.
 *
 * @class
 * @memberof v1
 */
class FirestoreAdminClient {
  /**
   * Construct an instance of FirestoreAdminClient.
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
    const gaxGrpc = new gax.GrpcClient(opts);

    // Save the auth object to the client, for use by other methods.
    this.auth = gaxGrpc.auth;

    // Determine the client header string.
    const clientHeader = [
      `gl-node/${process.version}`,
      `grpc/${gaxGrpc.grpcVersion}`,
      `gax/${gax.version}`,
      `gapic/${VERSION}`,
    ];
    if (opts.libName && opts.libVersion) {
      clientHeader.push(`${opts.libName}/${opts.libVersion}`);
    }

    // Load the applicable protos.
    const protos = gaxGrpc.loadProto(
      path.join(__dirname, '..', '..', 'protos'),
      ['google/firestore/admin/v1/firestore_admin.proto']
    );

    // This API contains "path templates"; forward-slash-separated
    // identifiers to uniquely identify resources within the API.
    // Create useful helper objects for these.
    this._pathTemplates = {
      databasePathTemplate: new gax.PathTemplate(
        'projects/{project}/databases/{database}'
      ),
      fieldPathTemplate: new gax.PathTemplate(
        'projects/{project}/databases/{database}/collectionGroups/{collection_id}/fields/{field_id}'
      ),
      indexPathTemplate: new gax.PathTemplate(
        'projects/{project}/databases/{database}/collectionGroups/{collection_id}/indexes/{index_id}'
      ),
      parentPathTemplate: new gax.PathTemplate(
        'projects/{project}/databases/{database}/collectionGroups/{collection_id}'
      ),
    };

    // Some of the methods on this service return "paged" results,
    // (e.g. 50 results at a time, with tokens to get subsequent
    // pages). Denote the keys used for pagination and results.
    this._descriptors.page = {
      listIndexes: new gax.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'indexes'
      ),
      listFields: new gax.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'fields'
      ),
    };

    // Put together the default options sent with requests.
    const defaults = gaxGrpc.constructSettings(
      'google.firestore.admin.v1.FirestoreAdmin',
      gapicConfig,
      opts.clientConfig,
      {'x-goog-api-client': clientHeader.join(' ')}
    );

    // Set up a dictionary of "inner API calls"; the core implementation
    // of calling the API is handled in `google-gax`, with this code
    // merely providing the destination and request information.
    this._innerApiCalls = {};

    // Put together the "service stub" for
    // google.firestore.admin.v1.FirestoreAdmin.
    const firestoreAdminStub = gaxGrpc.createStub(
      protos.google.firestore.admin.v1.FirestoreAdmin,
      opts
    );

    // Iterate over each of the methods that the service provides
    // and create an API call method for each.
    const firestoreAdminStubMethods = [
      'createIndex',
      'listIndexes',
      'getIndex',
      'deleteIndex',
      'importDocuments',
      'exportDocuments',
      'getField',
      'listFields',
      'updateField',
    ];
    for (const methodName of firestoreAdminStubMethods) {
      this._innerApiCalls[methodName] = gax.createApiCall(
        firestoreAdminStub.then(
          stub =>
            function() {
              const args = Array.prototype.slice.call(arguments, 0);
              return stub[methodName].apply(stub, args);
            },
          err =>
            function() {
              throw err;
            }
        ),
        defaults[methodName],
        this._descriptors.page[methodName]
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
   * Creates a composite index. This returns a google.longrunning.Operation
   * which may be used to track the status of the creation. The metadata for
   * the operation will be the type IndexOperationMetadata.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   A parent name of the form
   *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}`
   * @param {Object} request.index
   *   The composite index to create.
   *
   *   This object should have the same structure as [Index]{@link google.firestore.admin.v1.Index}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Operation]{@link google.longrunning.Operation}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Operation]{@link google.longrunning.Operation}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedParent = client.parentPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]');
   * const index = {};
   * const request = {
   *   parent: formattedParent,
   *   index: index,
   * };
   * client.createIndex(request)
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  createIndex(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      parent: request.parent,
    });

    return this._innerApiCalls.createIndex(request, options, callback);
  }

  /**
   * Lists composite indexes.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   A parent name of the form
   *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}`
   * @param {string} [request.filter]
   *   The filter to apply to list results.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of [Index]{@link google.firestore.admin.v1.Index}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListIndexesResponse]{@link google.firestore.admin.v1.ListIndexesResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Index]{@link google.firestore.admin.v1.Index}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Index]{@link google.firestore.admin.v1.Index} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListIndexesResponse]{@link google.firestore.admin.v1.ListIndexesResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * const formattedParent = client.parentPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]');
   *
   * client.listIndexes({parent: formattedParent})
   *   .then(responses => {
   *     const resources = responses[0];
   *     for (const resource of resources) {
   *       // doThingsWith(resource)
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * const formattedParent = client.parentPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]');
   *
   *
   * const options = {autoPaginate: false};
   * const callback = responses => {
   *   // The actual resources in a response.
   *   const resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   const nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // const rawResponse = responses[2];
   *   for (const resource of resources) {
   *     // doThingsWith(resource);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listIndexes(nextRequest, options).then(callback);
   *   }
   * }
   * client.listIndexes({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listIndexes(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      parent: request.parent,
    });

    return this._innerApiCalls.listIndexes(request, options, callback);
  }

  /**
   * Equivalent to {@link listIndexes}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listIndexes} continuously
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
   *   A parent name of the form
   *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}`
   * @param {string} [request.filter]
   *   The filter to apply to list results.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [Index]{@link google.firestore.admin.v1.Index} on 'data' event.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedParent = client.parentPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]');
   * client.listIndexesStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listIndexesStream(request, options) {
    options = options || {};

    return this._descriptors.page.listIndexes.createStream(
      this._innerApiCalls.listIndexes,
      request,
      options
    );
  }

  /**
   * Gets a composite index.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   A name of the form
   *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{index_id}`
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Index]{@link google.firestore.admin.v1.Index}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Index]{@link google.firestore.admin.v1.Index}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.indexPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]', '[INDEX_ID]');
   * client.getIndex({name: formattedName})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getIndex(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      name: request.name,
    });

    return this._innerApiCalls.getIndex(request, options, callback);
  }

  /**
   * Deletes a composite index.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   A name of the form
   *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{index_id}`
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error)} [callback]
   *   The function which will be called with the result of the API call.
   * @returns {Promise} - The promise which resolves when API call finishes.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.indexPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]', '[INDEX_ID]');
   * client.deleteIndex({name: formattedName}).catch(err => {
   *   console.error(err);
   * });
   */
  deleteIndex(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      name: request.name,
    });

    return this._innerApiCalls.deleteIndex(request, options, callback);
  }

  /**
   * Imports documents into Google Cloud Firestore. Existing documents with the
   * same name are overwritten. The import occurs in the background and its
   * progress can be monitored and managed via the Operation resource that is
   * created. If an ImportDocuments operation is cancelled, it is possible
   * that a subset of the data has already been imported to Cloud Firestore.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Database to import into. Should be of the form:
   *   `projects/{project_id}/databases/{database_id}`.
   * @param {string[]} [request.collectionIds]
   *   Which collection ids to import. Unspecified means all collections included
   *   in the import.
   * @param {string} [request.inputUriPrefix]
   *   Location of the exported files.
   *   This must match the output_uri_prefix of an ExportDocumentsResponse from
   *   an export that has completed successfully.
   *   See:
   *   google.firestore.admin.v1.ExportDocumentsResponse.output_uri_prefix.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Operation]{@link google.longrunning.Operation}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Operation]{@link google.longrunning.Operation}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.databasePath('[PROJECT]', '[DATABASE]');
   * client.importDocuments({name: formattedName})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  importDocuments(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      name: request.name,
    });

    return this._innerApiCalls.importDocuments(request, options, callback);
  }

  /**
   * Exports a copy of all or a subset of documents from Google Cloud Firestore
   * to another storage system, such as Google Cloud Storage. Recent updates to
   * documents may not be reflected in the export. The export occurs in the
   * background and its progress can be monitored and managed via the
   * Operation resource that is created. The output of an export may only be
   * used once the associated operation is done. If an export operation is
   * cancelled before completion it may leave partial data behind in Google
   * Cloud Storage.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Database to export. Should be of the form:
   *   `projects/{project_id}/databases/{database_id}`.
   * @param {string[]} [request.collectionIds]
   *   Which collection ids to export. Unspecified means all collections.
   * @param {string} [request.outputUriPrefix]
   *   The output URI. Currently only supports Google Cloud Storage URIs of the
   *   form: `gs://BUCKET_NAME[/NAMESPACE_PATH]`, where `BUCKET_NAME` is the name
   *   of the Google Cloud Storage bucket and `NAMESPACE_PATH` is an optional
   *   Google Cloud Storage namespace path. When
   *   choosing a name, be sure to consider Google Cloud Storage naming
   *   guidelines: https://cloud.google.com/storage/docs/naming.
   *   If the URI is a bucket (without a namespace path), a prefix will be
   *   generated based on the start time.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Operation]{@link google.longrunning.Operation}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Operation]{@link google.longrunning.Operation}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.databasePath('[PROJECT]', '[DATABASE]');
   * client.exportDocuments({name: formattedName})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  exportDocuments(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      name: request.name,
    });

    return this._innerApiCalls.exportDocuments(request, options, callback);
  }

  /**
   * Gets the metadata and configuration for a Field.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   A name of the form
   *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/fields/{field_id}`
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Field]{@link google.firestore.admin.v1.Field}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Field]{@link google.firestore.admin.v1.Field}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.fieldPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]', '[FIELD_ID]');
   * client.getField({name: formattedName})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getField(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      name: request.name,
    });

    return this._innerApiCalls.getField(request, options, callback);
  }

  /**
   * Lists the field configuration and metadata for this database.
   *
   * Currently, FirestoreAdmin.ListFields only supports listing fields
   * that have been explicitly overridden. To issue this query, call
   * FirestoreAdmin.ListFields with the filter set to
   * `indexConfig.usesAncestorConfig:false`.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   A parent name of the form
   *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}`
   * @param {string} [request.filter]
   *   The filter to apply to list results. Currently,
   *   FirestoreAdmin.ListFields only supports listing fields
   *   that have been explicitly overridden. To issue this query, call
   *   FirestoreAdmin.ListFields with the filter set to
   *   `indexConfig.usesAncestorConfig:false`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of [Field]{@link google.firestore.admin.v1.Field}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListFieldsResponse]{@link google.firestore.admin.v1.ListFieldsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Field]{@link google.firestore.admin.v1.Field}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Field]{@link google.firestore.admin.v1.Field} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListFieldsResponse]{@link google.firestore.admin.v1.ListFieldsResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * const formattedParent = client.parentPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]');
   *
   * client.listFields({parent: formattedParent})
   *   .then(responses => {
   *     const resources = responses[0];
   *     for (const resource of resources) {
   *       // doThingsWith(resource)
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * const formattedParent = client.parentPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]');
   *
   *
   * const options = {autoPaginate: false};
   * const callback = responses => {
   *   // The actual resources in a response.
   *   const resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   const nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // const rawResponse = responses[2];
   *   for (const resource of resources) {
   *     // doThingsWith(resource);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listFields(nextRequest, options).then(callback);
   *   }
   * }
   * client.listFields({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listFields(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      parent: request.parent,
    });

    return this._innerApiCalls.listFields(request, options, callback);
  }

  /**
   * Equivalent to {@link listFields}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listFields} continuously
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
   *   A parent name of the form
   *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}`
   * @param {string} [request.filter]
   *   The filter to apply to list results. Currently,
   *   FirestoreAdmin.ListFields only supports listing fields
   *   that have been explicitly overridden. To issue this query, call
   *   FirestoreAdmin.ListFields with the filter set to
   *   `indexConfig.usesAncestorConfig:false`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [Field]{@link google.firestore.admin.v1.Field} on 'data' event.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedParent = client.parentPath('[PROJECT]', '[DATABASE]', '[COLLECTION_ID]');
   * client.listFieldsStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listFieldsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listFields.createStream(
      this._innerApiCalls.listFields,
      request,
      options
    );
  }

  /**
   * Updates a field configuration. Currently, field updates apply only to
   * single field index configuration. However, calls to
   * FirestoreAdmin.UpdateField should provide a field mask to avoid
   * changing any configuration that the caller isn't aware of. The field mask
   * should be specified as: `{ paths: "index_config" }`.
   *
   * This call returns a google.longrunning.Operation which may be used to
   * track the status of the field update. The metadata for
   * the operation will be the type FieldOperationMetadata.
   *
   * To configure the default field settings for the database, use
   * the special `Field` with resource name:
   * `projects/{project_id}/databases/{database_id}/collectionGroups/__default__/fields/*`.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {Object} request.field
   *   The field to be updated.
   *
   *   This object should have the same structure as [Field]{@link google.firestore.admin.v1.Field}
   * @param {Object} [request.updateMask]
   *   A mask, relative to the field. If specified, only configuration specified
   *   by this field_mask will be updated in the field.
   *
   *   This object should have the same structure as [FieldMask]{@link google.protobuf.FieldMask}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Operation]{@link google.longrunning.Operation}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Operation]{@link google.longrunning.Operation}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const firestore = require('@google-cloud/firestore');
   *
   * const client = new firestore.v1.FirestoreAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const field = {};
   * client.updateField({field: field})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  updateField(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      'field.name': request.field.name,
    });

    return this._innerApiCalls.updateField(request, options, callback);
  }

  // --------------------
  // -- Path templates --
  // --------------------

  /**
   * Return a fully-qualified database resource name string.
   *
   * @param {String} project
   * @param {String} database
   * @returns {String}
   */
  databasePath(project, database) {
    return this._pathTemplates.databasePathTemplate.render({
      project: project,
      database: database,
    });
  }

  /**
   * Return a fully-qualified field resource name string.
   *
   * @param {String} project
   * @param {String} database
   * @param {String} collectionId
   * @param {String} fieldId
   * @returns {String}
   */
  fieldPath(project, database, collectionId, fieldId) {
    return this._pathTemplates.fieldPathTemplate.render({
      project: project,
      database: database,
      collection_id: collectionId,
      field_id: fieldId,
    });
  }

  /**
   * Return a fully-qualified index resource name string.
   *
   * @param {String} project
   * @param {String} database
   * @param {String} collectionId
   * @param {String} indexId
   * @returns {String}
   */
  indexPath(project, database, collectionId, indexId) {
    return this._pathTemplates.indexPathTemplate.render({
      project: project,
      database: database,
      collection_id: collectionId,
      index_id: indexId,
    });
  }

  /**
   * Return a fully-qualified parent resource name string.
   *
   * @param {String} project
   * @param {String} database
   * @param {String} collectionId
   * @returns {String}
   */
  parentPath(project, database, collectionId) {
    return this._pathTemplates.parentPathTemplate.render({
      project: project,
      database: database,
      collection_id: collectionId,
    });
  }

  /**
   * Parse the databaseName from a database resource.
   *
   * @param {String} databaseName
   *   A fully-qualified path representing a database resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromDatabaseName(databaseName) {
    return this._pathTemplates.databasePathTemplate.match(databaseName).project;
  }

  /**
   * Parse the databaseName from a database resource.
   *
   * @param {String} databaseName
   *   A fully-qualified path representing a database resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromDatabaseName(databaseName) {
    return this._pathTemplates.databasePathTemplate.match(databaseName)
      .database;
  }

  /**
   * Parse the fieldName from a field resource.
   *
   * @param {String} fieldName
   *   A fully-qualified path representing a field resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromFieldName(fieldName) {
    return this._pathTemplates.fieldPathTemplate.match(fieldName).project;
  }

  /**
   * Parse the fieldName from a field resource.
   *
   * @param {String} fieldName
   *   A fully-qualified path representing a field resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromFieldName(fieldName) {
    return this._pathTemplates.fieldPathTemplate.match(fieldName).database;
  }

  /**
   * Parse the fieldName from a field resource.
   *
   * @param {String} fieldName
   *   A fully-qualified path representing a field resources.
   * @returns {String} - A string representing the collection_id.
   */
  matchCollectionIdFromFieldName(fieldName) {
    return this._pathTemplates.fieldPathTemplate.match(fieldName).collection_id;
  }

  /**
   * Parse the fieldName from a field resource.
   *
   * @param {String} fieldName
   *   A fully-qualified path representing a field resources.
   * @returns {String} - A string representing the field_id.
   */
  matchFieldIdFromFieldName(fieldName) {
    return this._pathTemplates.fieldPathTemplate.match(fieldName).field_id;
  }

  /**
   * Parse the indexName from a index resource.
   *
   * @param {String} indexName
   *   A fully-qualified path representing a index resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromIndexName(indexName) {
    return this._pathTemplates.indexPathTemplate.match(indexName).project;
  }

  /**
   * Parse the indexName from a index resource.
   *
   * @param {String} indexName
   *   A fully-qualified path representing a index resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromIndexName(indexName) {
    return this._pathTemplates.indexPathTemplate.match(indexName).database;
  }

  /**
   * Parse the indexName from a index resource.
   *
   * @param {String} indexName
   *   A fully-qualified path representing a index resources.
   * @returns {String} - A string representing the collection_id.
   */
  matchCollectionIdFromIndexName(indexName) {
    return this._pathTemplates.indexPathTemplate.match(indexName).collection_id;
  }

  /**
   * Parse the indexName from a index resource.
   *
   * @param {String} indexName
   *   A fully-qualified path representing a index resources.
   * @returns {String} - A string representing the index_id.
   */
  matchIndexIdFromIndexName(indexName) {
    return this._pathTemplates.indexPathTemplate.match(indexName).index_id;
  }

  /**
   * Parse the parentName from a parent resource.
   *
   * @param {String} parentName
   *   A fully-qualified path representing a parent resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromParentName(parentName) {
    return this._pathTemplates.parentPathTemplate.match(parentName).project;
  }

  /**
   * Parse the parentName from a parent resource.
   *
   * @param {String} parentName
   *   A fully-qualified path representing a parent resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromParentName(parentName) {
    return this._pathTemplates.parentPathTemplate.match(parentName).database;
  }

  /**
   * Parse the parentName from a parent resource.
   *
   * @param {String} parentName
   *   A fully-qualified path representing a parent resources.
   * @returns {String} - A string representing the collection_id.
   */
  matchCollectionIdFromParentName(parentName) {
    return this._pathTemplates.parentPathTemplate.match(parentName)
      .collection_id;
  }
}

module.exports = FirestoreAdminClient;
