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
  // [START admin_import_documents_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. Database to import into. Should be of the form:
   *  `projects/{project_id}/databases/{database_id}`.
   */
  // const name = 'abc123'
  /**
   *  Which collection ids to import. Unspecified means all collections included
   *  in the import.
   */
  // const collectionIds = 'abc123'
  /**
   *  Location of the exported files.
   *  This must match the output_uri_prefix of an ExportDocumentsResponse from
   *  an export that has completed successfully.
   *  See:
   *  [google.firestore.admin.v1.ExportDocumentsResponse.output_uri_prefix][google.firestore.admin.v1.ExportDocumentsResponse.output_uri_prefix].
   */
  // const inputUriPrefix = 'abc123'

  // Imports the Admin library
  const {FirestoreAdminClient} = require('admin').v1;

  // Instantiates a client
  const adminClient = new FirestoreAdminClient();

  async function importDocuments() {
    // Construct request
    const request = {
      name,
    };

    // Run request
    const [operation] = await adminClient.importDocuments(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  importDocuments();
  // [END admin_import_documents_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
