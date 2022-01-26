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

function main(database) {
  // [START firestore_v1beta1_generated_Firestore_BatchWrite_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The database name. In the format:
   *  `projects/{project_id}/databases/{database_id}`.
   */
  // const database = 'abc123'
  /**
   *  The writes to apply.
   *  Method does not apply writes atomically and does not guarantee ordering.
   *  Each write succeeds or fails independently. You cannot write to the same
   *  document more than once per request.
   */
  // const writes = 1234
  /**
   *  Labels associated with this batch write.
   */
  // const labels = 1234

  // Imports the Firestore library
  const {FirestoreClient} = require('firestore').v1beta1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function callBatchWrite() {
    // Construct request
    const request = {
      database,
    };

    // Run request
    const response = await firestoreClient.batchWrite(request);
    console.log(response);
  }

  callBatchWrite();
  // [END firestore_v1beta1_generated_Firestore_BatchWrite_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
