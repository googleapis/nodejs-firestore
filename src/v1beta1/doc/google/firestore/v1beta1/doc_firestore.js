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
 */

/*
 * Note: this file is purely for documentation. Any contents are not expected
 * to be loaded as the JS file.
 */

/**
 * The request for {@link Firestore.GetDocument}.
 *
 * @property {string} name
 *   The resource name of the Document to get. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *
 * @property {Object} mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If the document has a field that is not present in this mask, that field
 *   will not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 *
 * @property {string} transaction
 *   Reads the document in a transaction.
 *
 * @property {Object} readTime
 *   Reads the version of the document at the given time.
 *   This may not be older than 60 seconds.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef GetDocumentRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.GetDocumentRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var GetDocumentRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.ListDocuments}.
 *
 * @property {string} parent
 *   The parent resource name. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents` or
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   For example:
 *   `projects/my-project/databases/my-database/documents` or
 *   `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
 *
 * @property {string} collectionId
 *   The collection ID, relative to `parent`, to list. For example: `chatrooms`
 *   or `messages`.
 *
 * @property {number} pageSize
 *   The maximum number of documents to return.
 *
 * @property {string} pageToken
 *   The `next_page_token` value returned from a previous List request, if any.
 *
 * @property {string} orderBy
 *   The order to sort results by. For example: `priority desc, name`.
 *
 * @property {Object} mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If a document has a field that is not present in this mask, that field
 *   will not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 *
 * @property {string} transaction
 *   Reads documents in a transaction.
 *
 * @property {Object} readTime
 *   Reads documents as they were at the given time.
 *   This may not be older than 60 seconds.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {boolean} showMissing
 *   If the list should show missing documents. A missing document is a
 *   document that does not exist but has sub-documents. These documents will
 *   be returned with a key but will not have fields, {@link Document.create_time},
 *   or {@link Document.update_time} set.
 *
 *   Requests with `show_missing` may not specify `where` or
 *   `order_by`.
 *
 * @typedef ListDocumentsRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.ListDocumentsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var ListDocumentsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for {@link Firestore.ListDocuments}.
 *
 * @property {Object[]} documents
 *   The Documents found.
 *
 *   This object should have the same structure as [Document]{@link google.firestore.v1beta1.Document}
 *
 * @property {string} nextPageToken
 *   The next page token.
 *
 * @typedef ListDocumentsResponse
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.ListDocumentsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var ListDocumentsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.CreateDocument}.
 *
 * @property {string} parent
 *   The parent resource. For example:
 *   `projects/{project_id}/databases/{database_id}/documents` or
 *   `projects/{project_id}/databases/{database_id}/documents/chatrooms/{chatroom_id}`
 *
 * @property {string} collectionId
 *   The collection ID, relative to `parent`, to list. For example: `chatrooms`.
 *
 * @property {string} documentId
 *   The client-assigned document ID to use for this document.
 *
 *   Optional. If not specified, an ID will be assigned by the service.
 *
 * @property {Object} document
 *   The document to create. `name` must not be set.
 *
 *   This object should have the same structure as [Document]{@link google.firestore.v1beta1.Document}
 *
 * @property {Object} mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If the document has a field that is not present in this mask, that field
 *   will not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 *
 * @typedef CreateDocumentRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.CreateDocumentRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var CreateDocumentRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.UpdateDocument}.
 *
 * @property {Object} document
 *   The updated document.
 *   Creates the document if it does not already exist.
 *
 *   This object should have the same structure as [Document]{@link google.firestore.v1beta1.Document}
 *
 * @property {Object} updateMask
 *   The fields to update.
 *   None of the field paths in the mask may contain a reserved name.
 *
 *   If the document exists on the server and has fields not referenced in the
 *   mask, they are left unchanged.
 *   Fields referenced in the mask, but not present in the input document, are
 *   deleted from the document on the server.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 *
 * @property {Object} mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If the document has a field that is not present in this mask, that field
 *   will not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 *
 * @property {Object} currentDocument
 *   An optional precondition on the document.
 *   The request will fail if this is set and not met by the target document.
 *
 *   This object should have the same structure as [Precondition]{@link google.firestore.v1beta1.Precondition}
 *
 * @typedef UpdateDocumentRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.UpdateDocumentRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var UpdateDocumentRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.DeleteDocument}.
 *
 * @property {string} name
 *   The resource name of the Document to delete. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *
 * @property {Object} currentDocument
 *   An optional precondition on the document.
 *   The request will fail if this is set and not met by the target document.
 *
 *   This object should have the same structure as [Precondition]{@link google.firestore.v1beta1.Precondition}
 *
 * @typedef DeleteDocumentRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.DeleteDocumentRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var DeleteDocumentRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.BatchGetDocuments}.
 *
 * @property {string} database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 *
 * @property {string[]} documents
 *   The names of the documents to retrieve. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   The request will fail if any of the document is not a child resource of the
 *   given `database`. Duplicate names will be elided.
 *
 * @property {Object} mask
 *   The fields to return. If not set, returns all fields.
 *
 *   If a document has a field that is not present in this mask, that field will
 *   not be returned in the response.
 *
 *   This object should have the same structure as [DocumentMask]{@link google.firestore.v1beta1.DocumentMask}
 *
 * @property {string} transaction
 *   Reads documents in a transaction.
 *
 * @property {Object} newTransaction
 *   Starts a new transaction and reads the documents.
 *   Defaults to a read-only transaction.
 *   The new transaction ID will be returned as the first response in the
 *   stream.
 *
 *   This object should have the same structure as [TransactionOptions]{@link google.firestore.v1beta1.TransactionOptions}
 *
 * @property {Object} readTime
 *   Reads documents as they were at the given time.
 *   This may not be older than 60 seconds.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef BatchGetDocumentsRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.BatchGetDocumentsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var BatchGetDocumentsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The streamed response for {@link Firestore.BatchGetDocuments}.
 *
 * @property {Object} found
 *   A document that was requested.
 *
 *   This object should have the same structure as [Document]{@link google.firestore.v1beta1.Document}
 *
 * @property {string} missing
 *   A document name that was requested but does not exist. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *
 * @property {string} transaction
 *   The transaction that was started as part of this request.
 *   Will only be set in the first response, and only if
 *   {@link BatchGetDocumentsRequest.new_transaction} was set in the request.
 *
 * @property {Object} readTime
 *   The time at which the document was read.
 *   This may be monotically increasing, in this case the previous documents in
 *   the result stream are guaranteed not to have changed between their
 *   read_time and this one.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef BatchGetDocumentsResponse
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.BatchGetDocumentsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var BatchGetDocumentsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.BeginTransaction}.
 *
 * @property {string} database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 *
 * @property {Object} options
 *   The options for the transaction.
 *   Defaults to a read-write transaction.
 *
 *   This object should have the same structure as [TransactionOptions]{@link google.firestore.v1beta1.TransactionOptions}
 *
 * @typedef BeginTransactionRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.BeginTransactionRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var BeginTransactionRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for {@link Firestore.BeginTransaction}.
 *
 * @property {string} transaction
 *   The transaction that was started.
 *
 * @typedef BeginTransactionResponse
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.BeginTransactionResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var BeginTransactionResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.Commit}.
 *
 * @property {string} database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 *
 * @property {Object[]} writes
 *   The writes to apply.
 *
 *   Always executed atomically and in order.
 *
 *   This object should have the same structure as [Write]{@link google.firestore.v1beta1.Write}
 *
 * @property {string} transaction
 *   If set, applies all writes in this transaction, and commits it.
 *
 * @typedef CommitRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.CommitRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var CommitRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for {@link Firestore.Commit}.
 *
 * @property {Object[]} writeResults
 *   The result of applying the writes.
 *
 *   This i-th write result corresponds to the i-th write in the
 *   request.
 *
 *   This object should have the same structure as [WriteResult]{@link google.firestore.v1beta1.WriteResult}
 *
 * @property {Object} commitTime
 *   The time at which the commit occurred.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef CommitResponse
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.CommitResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var CommitResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.Rollback}.
 *
 * @property {string} database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 *
 * @property {string} transaction
 *   The transaction to roll back.
 *
 * @typedef RollbackRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.RollbackRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var RollbackRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.RunQuery}.
 *
 * @property {string} parent
 *   The parent resource name. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents` or
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   For example:
 *   `projects/my-project/databases/my-database/documents` or
 *   `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
 *
 * @property {Object} structuredQuery
 *   A structured query.
 *
 *   This object should have the same structure as [StructuredQuery]{@link google.firestore.v1beta1.StructuredQuery}
 *
 * @property {string} transaction
 *   Reads documents in a transaction.
 *
 * @property {Object} newTransaction
 *   Starts a new transaction and reads the documents.
 *   Defaults to a read-only transaction.
 *   The new transaction ID will be returned as the first response in the
 *   stream.
 *
 *   This object should have the same structure as [TransactionOptions]{@link google.firestore.v1beta1.TransactionOptions}
 *
 * @property {Object} readTime
 *   Reads documents as they were at the given time.
 *   This may not be older than 60 seconds.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef RunQueryRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.RunQueryRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var RunQueryRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for {@link Firestore.RunQuery}.
 *
 * @property {string} transaction
 *   The transaction that was started as part of this request.
 *   Can only be set in the first response, and only if
 *   {@link RunQueryRequest.new_transaction} was set in the request.
 *   If set, no other fields will be set in this response.
 *
 * @property {Object} document
 *   A query result.
 *   Not set when reporting partial progress.
 *
 *   This object should have the same structure as [Document]{@link google.firestore.v1beta1.Document}
 *
 * @property {Object} readTime
 *   The time at which the document was read. This may be monotonically
 *   increasing; in this case, the previous documents in the result stream are
 *   guaranteed not to have changed between their `read_time` and this one.
 *
 *   If the query returns no results, a response with `read_time` and no
 *   `document` will be sent, and this represents the time at which the query
 *   was run.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {number} skippedResults
 *   The number of results that have been skipped due to an offset between
 *   the last response and the current response.
 *
 * @typedef RunQueryResponse
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.RunQueryResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var RunQueryResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for {@link Firestore.Write}.
 *
 * The first request creates a stream, or resumes an existing one from a token.
 *
 * When creating a new stream, the server replies with a response containing
 * only an ID and a token, to use in the next request.
 *
 * When resuming a stream, the server first streams any responses later than the
 * given token, then a response containing only an up-to-date token, to use in
 * the next request.
 *
 * @property {string} database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 *   This is only required in the first message.
 *
 * @property {string} streamId
 *   The ID of the write stream to resume.
 *   This may only be set in the first message. When left empty, a new write
 *   stream will be created.
 *
 * @property {Object[]} writes
 *   The writes to apply.
 *
 *   Always executed atomically and in order.
 *   This must be empty on the first request.
 *   This may be empty on the last request.
 *   This must not be empty on all other requests.
 *
 *   This object should have the same structure as [Write]{@link google.firestore.v1beta1.Write}
 *
 * @property {string} streamToken
 *   A stream token that was previously sent by the server.
 *
 *   The client should set this field to the token from the most recent
 *   {@link WriteResponse} it has received. This acknowledges that the client has
 *   received responses up to this token. After sending this token, earlier
 *   tokens may not be used anymore.
 *
 *   The server may close the stream if there are too many unacknowledged
 *   responses.
 *
 *   Leave this field unset when creating a new stream. To resume a stream at
 *   a specific point, set this field and the `stream_id` field.
 *
 *   Leave this field unset when creating a new stream.
 *
 * @property {Object.<string, string>} labels
 *   Labels associated with this write request.
 *
 * @typedef WriteRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.WriteRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var WriteRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for {@link Firestore.Write}.
 *
 * @property {string} streamId
 *   The ID of the stream.
 *   Only set on the first message, when a new stream was created.
 *
 * @property {string} streamToken
 *   A token that represents the position of this response in the stream.
 *   This can be used by a client to resume the stream at this point.
 *
 *   This field is always set.
 *
 * @property {Object[]} writeResults
 *   The result of applying the writes.
 *
 *   This i-th write result corresponds to the i-th write in the
 *   request.
 *
 *   This object should have the same structure as [WriteResult]{@link google.firestore.v1beta1.WriteResult}
 *
 * @property {Object} commitTime
 *   The time at which the commit occurred.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef WriteResponse
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.WriteResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var WriteResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A request for {@link Firestore.Listen}
 *
 * @property {string} database
 *   The database name. In the format:
 *   `projects/{project_id}/databases/{database_id}`.
 *
 * @property {Object} addTarget
 *   A target to add to this stream.
 *
 *   This object should have the same structure as [Target]{@link google.firestore.v1beta1.Target}
 *
 * @property {number} removeTarget
 *   The ID of a target to remove from this stream.
 *
 * @property {Object.<string, string>} labels
 *   Labels associated with this target change.
 *
 * @typedef ListenRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.ListenRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var ListenRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for {@link Firestore.Listen}.
 *
 * @property {Object} targetChange
 *   Targets have changed.
 *
 *   This object should have the same structure as [TargetChange]{@link google.firestore.v1beta1.TargetChange}
 *
 * @property {Object} documentChange
 *   A {@link Document} has changed.
 *
 *   This object should have the same structure as [DocumentChange]{@link google.firestore.v1beta1.DocumentChange}
 *
 * @property {Object} documentDelete
 *   A {@link Document} has been deleted.
 *
 *   This object should have the same structure as [DocumentDelete]{@link google.firestore.v1beta1.DocumentDelete}
 *
 * @property {Object} documentRemove
 *   A {@link Document} has been removed from a target (because it is no longer
 *   relevant to that target).
 *
 *   This object should have the same structure as [DocumentRemove]{@link google.firestore.v1beta1.DocumentRemove}
 *
 * @property {Object} filter
 *   A filter to apply to the set of documents previously returned for the
 *   given target.
 *
 *   Returned when documents may have been removed from the given target, but
 *   the exact documents are unknown.
 *
 *   This object should have the same structure as [ExistenceFilter]{@link google.firestore.v1beta1.ExistenceFilter}
 *
 * @typedef ListenResponse
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.ListenResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var ListenResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A specification of a set of documents to listen to.
 *
 * @property {Object} query
 *   A target specified by a query.
 *
 *   This object should have the same structure as [QueryTarget]{@link google.firestore.v1beta1.QueryTarget}
 *
 * @property {Object} documents
 *   A target specified by a set of document names.
 *
 *   This object should have the same structure as [DocumentsTarget]{@link google.firestore.v1beta1.DocumentsTarget}
 *
 * @property {string} resumeToken
 *   A resume token from a prior {@link TargetChange} for an identical target.
 *
 *   Using a resume token with a different target is unsupported and may fail.
 *
 * @property {Object} readTime
 *   Start listening after a specific `read_time`.
 *
 *   The client must know the state of matching documents at this time.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {number} targetId
 *   A client provided target ID.
 *
 *   If not set, the server will assign an ID for the target.
 *
 *   Used for resuming a target without changing IDs. The IDs can either be
 *   client-assigned or be server-assigned in a previous stream. All targets
 *   with client provided IDs must be added before adding a target that needs
 *   a server-assigned id.
 *
 * @property {boolean} once
 *   If the target should be removed once it is current and consistent.
 *
 * @typedef Target
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.Target definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var Target = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * A target specified by a set of documents names.
   *
   * @property {string[]} documents
   *   The names of the documents to retrieve. In the format:
   *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
   *   The request will fail if any of the document is not a child resource of
   *   the given `database`. Duplicate names will be elided.
   *
   * @typedef DocumentsTarget
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.Target.DocumentsTarget definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
   */
  DocumentsTarget: {
    // This is for documentation. Actual contents will be loaded by gRPC.
  },

  /**
   * A target specified by a query.
   *
   * @property {string} parent
   *   The parent resource name. In the format:
   *   `projects/{project_id}/databases/{database_id}/documents` or
   *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
   *   For example:
   *   `projects/my-project/databases/my-database/documents` or
   *   `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
   *
   * @property {Object} structuredQuery
   *   A structured query.
   *
   *   This object should have the same structure as [StructuredQuery]{@link google.firestore.v1beta1.StructuredQuery}
   *
   * @typedef QueryTarget
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.Target.QueryTarget definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
   */
  QueryTarget: {
    // This is for documentation. Actual contents will be loaded by gRPC.
  }
};

/**
 * Targets being watched have changed.
 *
 * @property {number} targetChangeType
 *   The type of change that occurred.
 *
 *   The number should be among the values of [TargetChangeType]{@link google.firestore.v1beta1.TargetChangeType}
 *
 * @property {number[]} targetIds
 *   The target IDs of targets that have changed.
 *
 *   If empty, the change applies to all targets.
 *
 *   For `target_change_type=ADD`, the order of the target IDs matches the order
 *   of the requests to add the targets. This allows clients to unambiguously
 *   associate server-assigned target IDs with added targets.
 *
 *   For other states, the order of the target IDs is not defined.
 *
 * @property {Object} cause
 *   The error that resulted in this change, if applicable.
 *
 *   This object should have the same structure as [Status]{@link google.rpc.Status}
 *
 * @property {string} resumeToken
 *   A token that can be used to resume the stream for the given `target_ids`,
 *   or all targets if `target_ids` is empty.
 *
 *   Not set on every target change.
 *
 * @property {Object} readTime
 *   The consistent `read_time` for the given `target_ids` (omitted when the
 *   target_ids are not at a consistent snapshot).
 *
 *   The stream is guaranteed to send a `read_time` with `target_ids` empty
 *   whenever the entire stream reaches a new consistent snapshot. ADD,
 *   CURRENT, and RESET messages are guaranteed to (eventually) result in a
 *   new consistent snapshot (while NO_CHANGE and REMOVE messages are not).
 *
 *   For a given stream, `read_time` is guaranteed to be monotonically
 *   increasing.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef TargetChange
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.TargetChange definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var TargetChange = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * The type of change.
   *
   * @enum {number}
   */
  TargetChangeType: {

    /**
     * No change has occurred. Used only to send an updated `resume_token`.
     */
    NO_CHANGE: 0,

    /**
     * The targets have been added.
     */
    ADD: 1,

    /**
     * The targets have been removed.
     */
    REMOVE: 2,

    /**
     * The targets reflect all changes committed before the targets were added
     * to the stream.
     *
     * This will be sent after or with a `read_time` that is greater than or
     * equal to the time at which the targets were added.
     *
     * Listeners can wait for this change if read-after-write semantics
     * are desired.
     */
    CURRENT: 3,

    /**
     * The targets have been reset, and a new initial state for the targets
     * will be returned in subsequent changes.
     *
     * After the initial state is complete, `CURRENT` will be returned even
     * if the target was previously indicated to be `CURRENT`.
     */
    RESET: 4
  }
};

/**
 * The request for {@link Firestore.ListCollectionIds}.
 *
 * @property {string} parent
 *   The parent document. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *   For example:
 *   `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
 *
 * @property {number} pageSize
 *   The maximum number of results to return.
 *
 * @property {string} pageToken
 *   A page token. Must be a value from
 *   {@link ListCollectionIdsResponse}.
 *
 * @typedef ListCollectionIdsRequest
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.ListCollectionIdsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var ListCollectionIdsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response from {@link Firestore.ListCollectionIds}.
 *
 * @property {string[]} collectionIds
 *   The collection ids.
 *
 * @property {string} nextPageToken
 *   A page token that may be used to continue the list.
 *
 * @typedef ListCollectionIdsResponse
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.ListCollectionIdsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/firestore.proto}
 */
var ListCollectionIdsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};