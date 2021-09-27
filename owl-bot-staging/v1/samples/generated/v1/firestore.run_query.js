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

function main(parent) {
  // [START firestore_v1_generated_Firestore_RunQuery_async]
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
   *  A structured query.
   */
  // const structuredQuery = ''
  /**
   *  Reads documents in a transaction.
   */
  // const transaction = 'Buffer.from('string')'
  /**
   *  Starts a new transaction and reads the documents.
   *  Defaults to a read-only transaction.
   *  The new transaction ID will be returned as the first response in the
   *  stream.
   */
  // const newTransaction = ''
  /**
   *  Reads documents as they were at the given time.
   *  This may not be older than 270 seconds.
   */
  // const readTime = ''

  // Imports the Firestore library
  const {FirestoreClient} = require('@google-cloud/firestore').v1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function runQuery() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const stream = await firestoreClient.runQuery(request);
    stream.on('data', (response) => { console.log(response) });
    stream.on('error', (err) => { throw(err) });
    stream.on('end', () => { /* API call completed */ });
  }

  runQuery();
  // [END firestore_v1_generated_Firestore_RunQuery_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
