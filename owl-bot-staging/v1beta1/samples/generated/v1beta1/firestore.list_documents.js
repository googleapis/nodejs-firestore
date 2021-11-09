// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


'use strict';

function main(parent, collectionId) {
  // [START firestore_v1beta1_generated_Firestore_ListDocuments_async]
  /**
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
   *  Required. The collection ID, relative to `parent`, to list. For example: `chatrooms`
   *  or `messages`.
   */
  // const collectionId = 'abc123'
  /**
   *  The maximum number of documents to return.
   */
  // const pageSize = 1234
  /**
   *  The `next_page_token` value returned from a previous List request, if any.
   */
  // const pageToken = 'abc123'
  /**
   *  The order to sort results by. For example: `priority desc, name`.
   */
  // const orderBy = 'abc123'
  /**
   *  The fields to return. If not set, returns all fields.
   *  If a document has a field that is not present in this mask, that field
   *  will not be returned in the response.
   */
  // const mask = {}
  /**
   *  Reads documents in a transaction.
   */
  // const transaction = 'Buffer.from('string')'
  /**
   *  Reads documents as they were at the given time.
   *  This may not be older than 270 seconds.
   */
  // const readTime = {}
  /**
   *  If the list should show missing documents. A missing document is a
   *  document that does not exist but has sub-documents. These documents will
   *  be returned with a key but will not have fields, Document.create_time google.firestore.v1beta1.Document.create_time,
   *  or Document.update_time google.firestore.v1beta1.Document.update_time  set.
   *  Requests with `show_missing` may not specify `where` or
   *  `order_by`.
   */
  // const showMissing = true

  // Imports the Firestore library
  const {FirestoreClient} = require('firestore').v1beta1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function callListDocuments() {
    // Construct request
    const request = {
      parent,
      collectionId,
    };

    // Run request
    const iterable = await firestoreClient.listDocumentsAsync(request);
    for await (const response of iterable) {
        console.log(response);
    }
  }

  callListDocuments();
  // [END firestore_v1beta1_generated_Firestore_ListDocuments_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
