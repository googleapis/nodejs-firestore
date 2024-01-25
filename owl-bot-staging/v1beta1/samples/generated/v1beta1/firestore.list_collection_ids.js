// Copyright 2024 Google LLC
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
  // [START firestore_v1beta1_generated_Firestore_ListCollectionIds_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The parent document. In the format:
   *  `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
   *  For example:
   *  `projects/my-project/databases/my-database/documents/chatrooms/my-chatroom`
   */
  // const parent = 'abc123'
  /**
   *  The maximum number of results to return.
   */
  // const pageSize = 1234
  /**
   *  A page token. Must be a value from
   *  ListCollectionIdsResponse google.firestore.v1beta1.ListCollectionIdsResponse.
   */
  // const pageToken = 'abc123'

  // Imports the Firestore library
  const {FirestoreClient} = require('@google-cloud/firestore').v1beta1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function callListCollectionIds() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const iterable = await firestoreClient.listCollectionIdsAsync(request);
    for await (const response of iterable) {
        console.log(response);
    }
  }

  callListCollectionIds();
  // [END firestore_v1beta1_generated_Firestore_ListCollectionIds_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
