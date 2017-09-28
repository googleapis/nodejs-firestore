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
 * https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1beta1/firestore_admin.proto,
 * and updates to that file get reflected here through a refresh process.
 * For the short term, the refresh process will only be runnable by Google
 * engineers.
 *
 * The only allowed edits are to method and file documentation. A 3-way
 * merge preserves those additions if the generated source changes.
 */
/* TODO: introduce line-wrapping so that it never exceeds the limit. */
/* jscs: disable maximumLineLength */
'use strict';

var configData = require('./firestore_admin_client_config');
var extend = require('extend');
var gax = require('google-gax');
var googleProtoFiles = require('google-proto-files');
var path = require('path');
var protobuf = require('protobufjs');

var SERVICE_ADDRESS = 'firestore.googleapis.com';

var DEFAULT_SERVICE_PORT = 443;

var CODE_GEN_NAME_VERSION = 'gapic/0.0.5';

var PAGE_DESCRIPTORS = {
  listIndexes: new gax.PageDescriptor(
      'pageToken',
      'nextPageToken',
      'indexes')
};

/**
 * The scopes needed to make gRPC calls to all of the methods defined in
 * this service.
 */
var ALL_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/datastore'
];

/**
 * The Cloud Firestore Admin API.
 *
 * This API provides several administrative services for Cloud Firestore.
 *
 * # Concepts
 *
 * Project, Database, Namespace, Collection, and Document are used as defined in
 * the Google Cloud Firestore API.
 *
 * Operation: An Operation represents work being performed in the background.
 *
 *
 * # Services
 *
 * ## Index
 *
 * The index service manages Cloud Firestore indexes.
 *
 * Index creation is performed asynchronously.
 * An Operation resource is created for each such asynchronous operation.
 * The state of the operation (including any errors encountered)
 * may be queried via the Operation resource.
 *
 * ## Metadata
 *
 * Provides metadata and statistical information about data in Cloud Firestore.
 * The data provided as part of this API may be stale.
 *
 * ## Operation
 *
 * The Operations collection provides a record of actions performed for the
 * specified Project (including any Operations in progress). Operations are not
 * created directly but through calls on other collections or resources.
 *
 * An Operation that is not yet done may be cancelled. The request to cancel is
 * asynchronous and the Operation may continue to run for some time after the
 * request to cancel is made.
 *
 * An Operation that is done may be deleted so that it is no longer listed as
 * part of the Operation collection.
 *
 * Operations are created by service `FirestoreAdmin`, but are accessed via
 * service `google.longrunning.Operations`.
 *
 *
 * @class
 */
function FirestoreAdminClient(gaxGrpc, loadedProtos, opts) {
  opts = extend({
    servicePath: SERVICE_ADDRESS,
    port: DEFAULT_SERVICE_PORT,
    clientConfig: {}
  }, opts);

  var googleApiClient = [
    'gl-node/' + process.versions.node
  ];
  if (opts.libName && opts.libVersion) {
    googleApiClient.push(opts.libName + '/' + opts.libVersion);
  }
  googleApiClient.push(
    CODE_GEN_NAME_VERSION,
    'gax/' + gax.version,
    'grpc/' + gaxGrpc.grpcVersion
  );

  var defaults = gaxGrpc.constructSettings(
      'google.firestore.admin.v1beta1.FirestoreAdmin',
      configData,
      opts.clientConfig,
      {'x-goog-api-client': googleApiClient.join(' ')});

  var self = this;

  this.auth = gaxGrpc.auth;
  var firestoreAdminStub = gaxGrpc.createStub(
      loadedProtos.google.firestore.admin.v1beta1.FirestoreAdmin,
      opts);
  var firestoreAdminStubMethods = [
    'createIndex',
    'listIndexes',
    'getIndex',
    'deleteIndex'
  ];
  firestoreAdminStubMethods.forEach(function(methodName) {
    self['_' + methodName] = gax.createApiCall(
      firestoreAdminStub.then(function(firestoreAdminStub) {
        return function() {
          var args = Array.prototype.slice.call(arguments, 0);
          return firestoreAdminStub[methodName].apply(firestoreAdminStub, args);
        };
      }),
      defaults[methodName],
      PAGE_DESCRIPTORS[methodName]);
  });
}

// Path templates

var DATABASE_PATH_TEMPLATE = new gax.PathTemplate(
    'projects/{project}/databases/{database}');

var INDEX_PATH_TEMPLATE = new gax.PathTemplate(
    'projects/{project}/databases/{database}/indexes/{index}');

/**
 * Returns a fully-qualified database resource name string.
 * @param {String} project
 * @param {String} database
 * @returns {String}
 */
FirestoreAdminClient.prototype.databasePath = function(project, database) {
  return DATABASE_PATH_TEMPLATE.render({
    project: project,
    database: database
  });
};

/**
 * Returns a fully-qualified index resource name string.
 * @param {String} project
 * @param {String} database
 * @param {String} index
 * @returns {String}
 */
FirestoreAdminClient.prototype.indexPath = function(project, database, index) {
  return INDEX_PATH_TEMPLATE.render({
    project: project,
    database: database,
    index: index
  });
};

/**
 * Parses the databaseName from a database resource.
 * @param {String} databaseName
 *   A fully-qualified path representing a database resources.
 * @returns {String} - A string representing the project.
 */
FirestoreAdminClient.prototype.matchProjectFromDatabaseName = function(databaseName) {
  return DATABASE_PATH_TEMPLATE.match(databaseName).project;
};

/**
 * Parses the databaseName from a database resource.
 * @param {String} databaseName
 *   A fully-qualified path representing a database resources.
 * @returns {String} - A string representing the database.
 */
FirestoreAdminClient.prototype.matchDatabaseFromDatabaseName = function(databaseName) {
  return DATABASE_PATH_TEMPLATE.match(databaseName).database;
};

/**
 * Parses the indexName from a index resource.
 * @param {String} indexName
 *   A fully-qualified path representing a index resources.
 * @returns {String} - A string representing the project.
 */
FirestoreAdminClient.prototype.matchProjectFromIndexName = function(indexName) {
  return INDEX_PATH_TEMPLATE.match(indexName).project;
};

/**
 * Parses the indexName from a index resource.
 * @param {String} indexName
 *   A fully-qualified path representing a index resources.
 * @returns {String} - A string representing the database.
 */
FirestoreAdminClient.prototype.matchDatabaseFromIndexName = function(indexName) {
  return INDEX_PATH_TEMPLATE.match(indexName).database;
};

/**
 * Parses the indexName from a index resource.
 * @param {String} indexName
 *   A fully-qualified path representing a index resources.
 * @returns {String} - A string representing the index.
 */
FirestoreAdminClient.prototype.matchIndexFromIndexName = function(indexName) {
  return INDEX_PATH_TEMPLATE.match(indexName).index;
};

/**
 * Get the project ID used by this class.
 * @param {function(Error, string)} callback - the callback to be called with
 *   the current project Id.
 */
FirestoreAdminClient.prototype.getProjectId = function(callback) {
  return this.auth.getProjectId(callback);
};

// Service calls

/**
 * Creates the specified index.
 * A newly created index's initial state is `CREATING`. On completion of the
 * returned {@link google.longrunning.Operation}, the state will be `READY`.
 * If the index already exists, the call will return an `ALREADY_EXISTS`
 * status.
 *
 * During creation, the process could result in an error, in which case the
 * index will move to the `ERROR` state. The process can be recovered by
 * fixing the data that caused the error, removing the index with
 * {@link delete}, then re-creating the index with
 * {@link create}.
 *
 * Indexes with a single field cannot be created.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.parent
 *   The name of the database this index will apply to. For example:
 *   `projects/{project_id}/databases/{database_id}`
 * @param {Object} request.index
 *   The index to create. The name and state should not be specified.
 *   Certain single field indexes cannot be created or deleted.
 *
 *   This object should have the same structure as [Index]{@link Index}
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error, ?Object)=} callback
 *   The function which will be called with the result of the API call.
 *
 *   The second parameter to the callback is an object representing [google.longrunning.Operation]{@link external:"google.longrunning.Operation"}.
 * @return {Promise} - The promise which resolves to an array.
 *   The first element of the array is an object representing [google.longrunning.Operation]{@link external:"google.longrunning.Operation"}.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1.firestoreAdmin({
 *   // optional auth parameters.
 * });
 *
 * var formattedParent = client.databasePath("[PROJECT]", "[DATABASE]");
 * var index = {};
 * var request = {
 *     parent: formattedParent,
 *     index: index
 * };
 * client.createIndex(request).then(function(responses) {
 *     var response = responses[0];
 *     // doThingsWith(response)
 * })
 * .catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreAdminClient.prototype.createIndex = function(request, options, callback) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._createIndex(request, options, callback);
};

/**
 * Lists the indexes that match the specified filters.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.parent
 *   The database name. For example:
 *   `projects/{project_id}/databases/{database_id}`
 * @param {string=} request.filter
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
 *   The second parameter to the callback is Array of [Index]{@link Index}.
 *
 *   When autoPaginate: false is specified through options, it contains the result
 *   in a single response. If the response indicates the next page exists, the third
 *   parameter is set to be used for the next request object. The fourth parameter keeps
 *   the raw response object of an object representing [ListIndexesResponse]{@link ListIndexesResponse}.
 * @return {Promise} - The promise which resolves to an array.
 *   The first element of the array is Array of [Index]{@link Index}.
 *
 *   When autoPaginate: false is specified through options, the array has three elements.
 *   The first element is Array of [Index]{@link Index} in a single response.
 *   The second element is the next request object if the response
 *   indicates the next page exists, or null. The third element is
 *   an object representing [ListIndexesResponse]{@link ListIndexesResponse}.
 *
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1.firestoreAdmin({
 *   // optional auth parameters.
 * });
 *
 * // Iterate over all elements.
 * var formattedParent = client.databasePath("[PROJECT]", "[DATABASE]");
 *
 * client.listIndexes({parent: formattedParent}).then(function(responses) {
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
 * var formattedParent = client.databasePath("[PROJECT]", "[DATABASE]");
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
 *         return client.listIndexes(nextRequest, options).then(callback);
 *     }
 * }
 * client.listIndexes({parent: formattedParent}, options)
 *     .then(callback)
 *     .catch(function(err) {
 *         console.error(err);
 *     });
 */
FirestoreAdminClient.prototype.listIndexes = function(request, options, callback) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._listIndexes(request, options, callback);
};

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
 *   The database name. For example:
 *   `projects/{project_id}/databases/{database_id}`
 * @param {string=} request.filter
 * @param {number=} request.pageSize
 *   The maximum number of resources contained in the underlying API
 *   response. If page streaming is performed per-resource, this
 *   parameter does not affect the return value. If page streaming is
 *   performed per-page, this determines the maximum number of
 *   resources in a page.
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @return {Stream}
 *   An object stream which emits an object representing [Index]{@link Index} on 'data' event.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1.firestoreAdmin({
 *   // optional auth parameters.
 * });
 *
 * var formattedParent = client.databasePath("[PROJECT]", "[DATABASE]");
 * client.listIndexesStream({parent: formattedParent})
 * .on('data', function(element) {
 *     // doThingsWith(element)
 * }).on('error', function(err) {
 *     console.log(err);
 * });
 */
FirestoreAdminClient.prototype.listIndexesStream = function(request, options) {
  if (options === undefined) {
    options = {};
  }

  return PAGE_DESCRIPTORS.listIndexes.createStream(this._listIndexes, request, options);
};

/**
 * Gets an index.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.name
 *   The name of the index. For example:
 *   `projects/{project_id}/databases/{database_id}/indexes/{index_id}`
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error, ?Object)=} callback
 *   The function which will be called with the result of the API call.
 *
 *   The second parameter to the callback is an object representing [Index]{@link Index}.
 * @return {Promise} - The promise which resolves to an array.
 *   The first element of the array is an object representing [Index]{@link Index}.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1.firestoreAdmin({
 *   // optional auth parameters.
 * });
 *
 * var formattedName = client.indexPath("[PROJECT]", "[DATABASE]", "[INDEX]");
 * client.getIndex({name: formattedName}).then(function(responses) {
 *     var response = responses[0];
 *     // doThingsWith(response)
 * })
 * .catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreAdminClient.prototype.getIndex = function(request, options, callback) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._getIndex(request, options, callback);
};

/**
 * Deletes an index.
 *
 * @param {Object} request
 *   The request object that will be sent.
 * @param {string} request.name
 *   The index name. For example:
 *   `projects/{project_id}/databases/{database_id}/indexes/{index_id}`
 * @param {Object=} options
 *   Optional parameters. You can override the default settings for this call, e.g, timeout,
 *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
 * @param {function(?Error)=} callback
 *   The function which will be called with the result of the API call.
 * @return {Promise} - The promise which resolves when API call finishes.
 *   The promise has a method named "cancel" which cancels the ongoing API call.
 *
 * @example
 *
 * var firestore = require('firestore.v1beta1');
 *
 * var client = firestore.v1beta1.firestoreAdmin({
 *   // optional auth parameters.
 * });
 *
 * var formattedName = client.indexPath("[PROJECT]", "[DATABASE]", "[INDEX]");
 * client.deleteIndex({name: formattedName}).catch(function(err) {
 *     console.error(err);
 * });
 */
FirestoreAdminClient.prototype.deleteIndex = function(request, options, callback) {
  if (options instanceof Function && callback === undefined) {
    callback = options;
    options = {};
  }
  if (options === undefined) {
    options = {};
  }

  return this._deleteIndex(request, options, callback);
};

function FirestoreAdminClientBuilder(gaxGrpc) {
  if (!(this instanceof FirestoreAdminClientBuilder)) {
    return new FirestoreAdminClientBuilder(gaxGrpc);
  }

  var firestoreAdminStubProtos = gaxGrpc.loadProto(
    path.join(__dirname, '..', '..', 'protos'), 'google/firestore/admin/v1beta1/firestore_admin.proto');
  extend(this, firestoreAdminStubProtos.google.firestore.admin.v1beta1);


  /**
   * Build a new instance of {@link FirestoreAdminClient}.
   *
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
  this.firestoreAdminClient = function(opts) {
    return new FirestoreAdminClient(gaxGrpc, firestoreAdminStubProtos, opts);
  };
  extend(this.firestoreAdminClient, FirestoreAdminClient);
}
module.exports = FirestoreAdminClientBuilder;
module.exports.SERVICE_ADDRESS = SERVICE_ADDRESS;
module.exports.ALL_SCOPES = ALL_SCOPES;