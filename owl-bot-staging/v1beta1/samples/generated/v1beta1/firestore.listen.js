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
  // [START firestore_v1beta1_generated_Firestore_Listen_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The database name. In the format:
   *  `projects/{project_id}/databases/{database_id}`.
   */
  // const database = 'abc123'
  /**
   *  A target to add to this stream.
   */
  // const addTarget = {}
  /**
   *  The ID of a target to remove from this stream.
   */
  // const removeTarget = 1234
  /**
   *  Labels associated with this target change.
   */
  // const labels = 1234

  // Imports the Firestore library
  const {FirestoreClient} = require('firestore').v1beta1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function callListen() {
    // Construct request
    const request = {
      database,
    };

    // Run request
    const stream = await firestoreClient.listen();
    stream.on('data', (response) => { console.log(response) });
    stream.on('error', (err) => { throw(err) });
    stream.on('end', () => { /* API call completed */ });
    stream.write(request);
    stream.end(); 
  }

  callListen();
  // [END firestore_v1beta1_generated_Firestore_Listen_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
