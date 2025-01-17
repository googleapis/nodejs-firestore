// Copyright 2025 Google LLC
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
//
// ** This file is automatically generated by gapic-generator-typescript. **
// ** https://github.com/googleapis/gapic-generator-typescript **
// ** All changes to this file may be overwritten. **



'use strict';

function main(parent) {
  // [START firestore_v1_generated_Firestore_ListDocuments_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The parent resource name. In the format:
   *  `projects/{project_id}/databases/{database_id}/documents` or
   *  `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
   *  For example:
   *  `projects/my-project/databases/my-database/documents` or
   *  `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
   */
  // const parent = 'abc123'
  /**
   *  Optional. The collection ID, relative to `parent`, to list.
   *  For example: `chatrooms` or `messages`.
   *  This is optional, and when not provided, Firestore will list documents
   *  from all collections under the provided `parent`.
   */
  // const collectionId = 'abc123'
  /**
   *  Optional. The maximum number of documents to return in a single response.
   *  Firestore may return fewer than this value.
   */
  // const pageSize = 1234
  /**
   *  Optional. A page token, received from a previous `ListDocuments` response.
   *  Provide this to retrieve the subsequent page. When paginating, all other
   *  parameters (with the exception of `page_size`) must match the values set
   *  in the request that generated the page token.
   */
  // const pageToken = 'abc123'
  /**
   *  Optional. The optional ordering of the documents to return.
   *  For example: `priority desc, __name__ desc`.
   *  This mirrors the `ORDER BY` google.firestore.v1.StructuredQuery.order_by 
   *  used in Firestore queries but in a string representation. When absent,
   *  documents are ordered based on `__name__ ASC`.
   */
  // const orderBy = 'abc123'
  /**
   *  Optional. The fields to return. If not set, returns all fields.
   *  If a document has a field that is not present in this mask, that field
   *  will not be returned in the response.
   */
  // const mask = {}
  /**
   *  Perform the read as part of an already active transaction.
   */
  // const transaction = Buffer.from('string')
  /**
   *  Perform the read at the provided time.
   *  This must be a microsecond precision timestamp within the past one hour,
   *  or if Point-in-Time Recovery is enabled, can additionally be a whole
   *  minute timestamp within the past 7 days.
   */
  // const readTime = {}
  /**
   *  If the list should show missing documents.
   *  A document is missing if it does not exist, but there are sub-documents
   *  nested underneath it. When true, such missing documents will be returned
   *  with a key but will not have fields,
   *  `create_time` google.firestore.v1.Document.create_time, or
   *  `update_time` google.firestore.v1.Document.update_time  set.
   *  Requests with `show_missing` may not specify `where` or `order_by`.
   */
  // const showMissing = true

  // Imports the Firestore library
  const {FirestoreClient} = require('@google-cloud/firestore').v1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function callListDocuments() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const iterable = firestoreClient.listDocumentsAsync(request);
    for await (const response of iterable) {
        console.log(response);
    }
  }

  callListDocuments();
  // [END firestore_v1_generated_Firestore_ListDocuments_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
