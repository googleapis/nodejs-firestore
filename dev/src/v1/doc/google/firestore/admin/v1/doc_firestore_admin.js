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

// Note: this file is purely for documentation. Any contents are not expected
// to be loaded as the JS file.

/**
 * The request for FirestoreAdmin.CreateIndex.
 *
 * @property {string} parent
 *   A parent name of the form
 *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}`
 *
 * @property {Object} index
 *   The composite index to create.
 *
 *   This object should have the same structure as [Index]{@link
 * google.firestore.admin.v1.Index}
 *
 * @typedef CreateIndexRequest
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.CreateIndexRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const CreateIndexRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for FirestoreAdmin.ListIndexes.
 *
 * @property {string} parent
 *   A parent name of the form
 *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}`
 *
 * @property {string} filter
 *   The filter to apply to list results.
 *
 * @property {number} pageSize
 *   The number of results to return.
 *
 * @property {string} pageToken
 *   A page token, returned from a previous call to
 *   FirestoreAdmin.ListIndexes, that may be used to get the next
 *   page of results.
 *
 * @typedef ListIndexesRequest
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.ListIndexesRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const ListIndexesRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for FirestoreAdmin.ListIndexes.
 *
 * @property {Object[]} indexes
 *   The requested indexes.
 *
 *   This object should have the same structure as [Index]{@link
 * google.firestore.admin.v1.Index}
 *
 * @property {string} nextPageToken
 *   A page token that may be used to request another page of results. If blank,
 *   this is the last page.
 *
 * @typedef ListIndexesResponse
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.ListIndexesResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const ListIndexesResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for FirestoreAdmin.GetIndex.
 *
 * @property {string} name
 *   A name of the form
 *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{index_id}`
 *
 * @typedef GetIndexRequest
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.GetIndexRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const GetIndexRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for FirestoreAdmin.DeleteIndex.
 *
 * @property {string} name
 *   A name of the form
 *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{index_id}`
 *
 * @typedef DeleteIndexRequest
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.DeleteIndexRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const DeleteIndexRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for FirestoreAdmin.UpdateField.
 *
 * @property {Object} field
 *   The field to be updated.
 *
 *   This object should have the same structure as [Field]{@link
 * google.firestore.admin.v1.Field}
 *
 * @property {Object} updateMask
 *   A mask, relative to the field. If specified, only configuration specified
 *   by this field_mask will be updated in the field.
 *
 *   This object should have the same structure as [FieldMask]{@link
 * google.protobuf.FieldMask}
 *
 * @typedef UpdateFieldRequest
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.UpdateFieldRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const UpdateFieldRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for FirestoreAdmin.GetField.
 *
 * @property {string} name
 *   A name of the form
 *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/fields/{field_id}`
 *
 * @typedef GetFieldRequest
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.GetFieldRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const GetFieldRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for FirestoreAdmin.ListFields.
 *
 * @property {string} parent
 *   A parent name of the form
 *   `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}`
 *
 * @property {string} filter
 *   The filter to apply to list results. Currently,
 *   FirestoreAdmin.ListFields only supports listing fields
 *   that have been explicitly overridden. To issue this query, call
 *   FirestoreAdmin.ListFields with the filter set to
 *   `indexConfig.usesAncestorConfig:false`.
 *
 * @property {number} pageSize
 *   The number of results to return.
 *
 * @property {string} pageToken
 *   A page token, returned from a previous call to
 *   FirestoreAdmin.ListFields, that may be used to get the next
 *   page of results.
 *
 * @typedef ListFieldsRequest
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.ListFieldsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const ListFieldsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for FirestoreAdmin.ListFields.
 *
 * @property {Object[]} fields
 *   The requested fields.
 *
 *   This object should have the same structure as [Field]{@link
 * google.firestore.admin.v1.Field}
 *
 * @property {string} nextPageToken
 *   A page token that may be used to request another page of results. If blank,
 *   this is the last page.
 *
 * @typedef ListFieldsResponse
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.ListFieldsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const ListFieldsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for FirestoreAdmin.ExportDocuments.
 *
 * @property {string} name
 *   Database to export. Should be of the form:
 *   `projects/{project_id}/databases/{database_id}`.
 *
 * @property {string[]} collectionIds
 *   Which collection ids to export. Unspecified means all collections.
 *
 * @property {string} outputUriPrefix
 *   The output URI. Currently only supports Google Cloud Storage URIs of the
 *   form: `gs://BUCKET_NAME[/NAMESPACE_PATH]`, where `BUCKET_NAME` is the name
 *   of the Google Cloud Storage bucket and `NAMESPACE_PATH` is an optional
 *   Google Cloud Storage namespace path. When
 *   choosing a name, be sure to consider Google Cloud Storage naming
 *   guidelines: https://cloud.google.com/storage/docs/naming.
 *   If the URI is a bucket (without a namespace path), a prefix will be
 *   generated based on the start time.
 *
 * @typedef ExportDocumentsRequest
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.ExportDocumentsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const ExportDocumentsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for FirestoreAdmin.ImportDocuments.
 *
 * @property {string} name
 *   Database to import into. Should be of the form:
 *   `projects/{project_id}/databases/{database_id}`.
 *
 * @property {string[]} collectionIds
 *   Which collection ids to import. Unspecified means all collections included
 *   in the import.
 *
 * @property {string} inputUriPrefix
 *   Location of the exported files.
 *   This must match the output_uri_prefix of an ExportDocumentsResponse from
 *   an export that has completed successfully.
 *   See:
 *   google.firestore.admin.v1.ExportDocumentsResponse.output_uri_prefix.
 *
 * @typedef ImportDocumentsRequest
 * @memberof google.firestore.admin.v1
 * @see [google.firestore.admin.v1.ImportDocumentsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/firestore_admin.proto}
 */
const ImportDocumentsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};
