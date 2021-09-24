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

function main(field) {
  // [START admin_v1_generated_FirestoreAdmin_UpdateField_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The field to be updated.
   */
  // const field = ''
  /**
   *  A mask, relative to the field. If specified, only configuration specified
   *  by this field_mask will be updated in the field.
   */
  // const updateMask = ''

  // Imports the Admin library
  const {FirestoreAdminClient} = require('admin').v1;

  // Instantiates a client
  const adminClient = new FirestoreAdminClient();

  async function updateField() {
    // Construct request
    const request = {
      field,
    };

    // Run request
    const [operation] = await adminClient.updateField(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  updateField();
  // [END admin_v1_generated_FirestoreAdmin_UpdateField_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
