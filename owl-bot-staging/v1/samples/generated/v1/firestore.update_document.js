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

function main(document) {
  // [START firestore_v1_generated_Firestore_UpdateDocument_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The updated document.
   *  Creates the document if it does not already exist.
   */
  // const document = ''
  /**
   *  The fields to update.
   *  None of the field paths in the mask may contain a reserved name.
   *  If the document exists on the server and has fields not referenced in the
   *  mask, they are left unchanged.
   *  Fields referenced in the mask, but not present in the input document, are
   *  deleted from the document on the server.
   */
  // const updateMask = ''
  /**
   *  The fields to return. If not set, returns all fields.
   *  If the document has a field that is not present in this mask, that field
   *  will not be returned in the response.
   */
  // const mask = ''
  /**
   *  An optional precondition on the document.
   *  The request will fail if this is set and not met by the target document.
   */
  // const currentDocument = ''

  // Imports the Firestore library
  const {FirestoreClient} = require('@google-cloud/firestore').v1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function updateDocument() {
    // Construct request
    const request = {
      document,
    };

    // Run request
    const response = await firestoreClient.updateDocument(request);
    console.log(response);
  }

  updateDocument();
  // [END firestore_v1_generated_Firestore_UpdateDocument_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
