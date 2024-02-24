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
  // [START firestore_v1_generated_FirestoreAdmin_ListFields_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. A parent name of the form
   *  `projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}`
   */
  // const parent = 'abc123'
  /**
   *  The filter to apply to list results. Currently,
   *  FirestoreAdmin.ListFields google.firestore.admin.v1.FirestoreAdmin.ListFields 
   *  only supports listing fields that have been explicitly overridden. To issue
   *  this query, call
   *  FirestoreAdmin.ListFields google.firestore.admin.v1.FirestoreAdmin.ListFields 
   *  with a filter that includes `indexConfig.usesAncestorConfig:false` .
   */
  // const filter = 'abc123'
  /**
   *  The number of results to return.
   */
  // const pageSize = 1234
  /**
   *  A page token, returned from a previous call to
   *  FirestoreAdmin.ListFields google.firestore.admin.v1.FirestoreAdmin.ListFields,
   *  that may be used to get the next page of results.
   */
  // const pageToken = 'abc123'

  // Imports the Admin library
  const {FirestoreAdminClient} = require('@google-cloud/firestore-admin').v1;

  // Instantiates a client
  const adminClient = new FirestoreAdminClient();

  async function callListFields() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const iterable = adminClient.listFieldsAsync(request);
    for await (const response of iterable) {
        console.log(response);
    }
  }

  callListFields();
  // [END firestore_v1_generated_FirestoreAdmin_ListFields_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));