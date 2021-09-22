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

function main(parent, collectionId, document) {
  // [START firestore_create_document_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The parent resource. For example:
   *  `projects/{project_id}/databases/{database_id}/documents` or
   *  `projects/{project_id}/databases/{database_id}/documents/chatrooms/{chatroom_id}`
   */
  // const parent = 'abc123'
  /**
   *  Required. The collection ID, relative to `parent`, to list. For example: `chatrooms`.
   */
  // const collectionId = 'abc123'
  /**
   *  The client-assigned document ID to use for this document.
   *  Optional. If not specified, an ID will be assigned by the service.
   */
  // const documentId = 'abc123'
  /**
   *  Required. The document to create. `name` must not be set.
   */
  // const document = ''
  /**
   *  The fields to return. If not set, returns all fields.
   *  If the document has a field that is not present in this mask, that field
   *  will not be returned in the response.
   */
  // const mask = ''

  // Imports the Firestore library
  const {FirestoreClient} = require('@google-cloud/firestore').v1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function createDocument() {
    // Construct request
    const request = {
      parent,
      collectionId,
      document,
    };

    // Run request
    const response = await firestoreClient.createDocument(request);
    console.log(response);
  }

  createDocument();
  // [END firestore_create_document_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
