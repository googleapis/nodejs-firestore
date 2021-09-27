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
  // [START firestore_v1_generated_FirestoreAdmin_ExportDocuments_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. Database to export. Should be of the form:
   *  `projects/{project_id}/databases/{database_id}`.
   */
  // const name = 'abc123'
  /**
   *  Which collection ids to export. Unspecified means all collections.
   */
  // const collectionIds = 'abc123'
  /**
   *  The output URI. Currently only supports Google Cloud Storage URIs of the
   *  form: `gs://BUCKET_NAME[/NAMESPACE_PATH]`, where `BUCKET_NAME` is the name
   *  of the Google Cloud Storage bucket and `NAMESPACE_PATH` is an optional
   *  Google Cloud Storage namespace path. When
   *  choosing a name, be sure to consider Google Cloud Storage naming
   *  guidelines: https://cloud.google.com/storage/docs/naming.
   *  If the URI is a bucket (without a namespace path), a prefix will be
   *  generated based on the start time.
   */
  // const outputUriPrefix = 'abc123'

  // Imports the Admin library
  const {FirestoreAdminClient} = require('admin').v1;

  // Instantiates a client
  const adminClient = new FirestoreAdminClient();

  async function exportDocuments() {
    // Construct request
    const request = {
      name,
    };

    // Run request
    const [operation] = await adminClient.exportDocuments(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  exportDocuments();
  // [END firestore_v1_generated_FirestoreAdmin_ExportDocuments_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
