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

function main(parent, database, databaseId) {
  // [START firestore_v1_generated_FirestoreAdmin_CreateDatabase_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. A parent name of the form
   *  `projects/{project_id}`
   */
  // const parent = 'abc123'
  /**
   *  Required. The Database to create.
   */
  // const database = {}
  /**
   *  Required. The ID to use for the database, which will become the final
   *  component of the database's resource name.
   *  This value should be 4-63 characters. Valid characters are /[a-z][0-9]-/
   *  with first character a letter and the last a letter or a number. Must not
   *  be UUID-like /[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/.
   *  "(default)" database ID is also valid.
   */
  // const databaseId = 'abc123'

  // Imports the Admin library
  const {FirestoreAdminClient} = require('@google-cloud/firestore-admin').v1;

  // Instantiates a client
  const adminClient = new FirestoreAdminClient();

  async function callCreateDatabase() {
    // Construct request
    const request = {
      parent,
      database,
      databaseId,
    };

    // Run request
    const [operation] = await adminClient.createDatabase(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  callCreateDatabase();
  // [END firestore_v1_generated_FirestoreAdmin_CreateDatabase_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
