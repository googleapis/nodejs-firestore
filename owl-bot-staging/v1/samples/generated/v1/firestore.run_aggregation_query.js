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

function main(parent) {
  // [START firestore_v1_generated_Firestore_RunAggregationQuery_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
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
   *  An aggregation query.
   */
  // const structuredAggregationQuery = {}
  /**
   *  Run the aggregation within an already active transaction.
   *  The value here is the opaque transaction ID to execute the query in.
   */
  // const transaction = Buffer.from('string')
  /**
   *  Starts a new transaction as part of the query, defaulting to read-only.
   *  The new transaction ID will be returned as the first response in the
   *  stream.
   */
  // const newTransaction = {}
  /**
   *  Executes the query at the given timestamp.
   *  This must be a microsecond precision timestamp within the past one hour,
   *  or if Point-in-Time Recovery is enabled, can additionally be a whole
   *  minute timestamp within the past 7 days.
   */
  // const readTime = {}
  /**
   *  Optional. Explain options for the query. If set, additional query
   *  statistics will be returned. If not, only query results will be returned.
   */
  // const explainOptions = {}

  // Imports the Firestore library
  const {FirestoreClient} = require('@google-cloud/firestore').v1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function callRunAggregationQuery() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const stream = await firestoreClient.runAggregationQuery(request);
    stream.on('data', (response) => { console.log(response) });
    stream.on('error', (err) => { throw(err) });
    stream.on('end', () => { /* API call completed */ });
  }

  callRunAggregationQuery();
  // [END firestore_v1_generated_Firestore_RunAggregationQuery_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
