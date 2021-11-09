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

function main(name) {
  // [START firestore_v1beta1_generated_Firestore_GetDocument_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The resource name of the Document to get. In the format:
   *  `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
   */
  // const name = 'abc123'
  /**
   *  The fields to return. If not set, returns all fields.
   *  If the document has a field that is not present in this mask, that field
   *  will not be returned in the response.
   */
  // const mask = {}
  /**
   *  Reads the document in a transaction.
   */
  // const transaction = 'Buffer.from('string')'
  /**
   *  Reads the version of the document at the given time.
   *  This may not be older than 270 seconds.
   */
  // const readTime = {}

  // Imports the Firestore library
  const {FirestoreClient} = require('firestore').v1beta1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function callGetDocument() {
    // Construct request
    const request = {
      name,
    };

    // Run request
    const response = await firestoreClient.getDocument(request);
    console.log(response);
  }

  callGetDocument();
  // [END firestore_v1beta1_generated_Firestore_GetDocument_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
