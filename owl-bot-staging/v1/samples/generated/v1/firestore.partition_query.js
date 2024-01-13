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
  // [START firestore_v1_generated_Firestore_PartitionQuery_async]
  /**
   * This snippet has been automatically generated and should be regarded as a code template only.
   * It will require modifications to work.
   * It may require correct/in-range values for request initialization.
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The parent resource name. In the format:
   *  `projects/{project_id}/databases/{database_id}/documents`.
   *  Document resource names are not supported; only database resource names
   *  can be specified.
   */
  // const parent = 'abc123'
  /**
   *  A structured query.
   *  Query must specify collection with all descendants and be ordered by name
   *  ascending. Other filters, order bys, limits, offsets, and start/end
   *  cursors are not supported.
   */
  // const structuredQuery = {}
  /**
   *  The desired maximum number of partition points.
   *  The partitions may be returned across multiple pages of results.
   *  The number must be positive. The actual number of partitions
   *  returned may be fewer.
   *  For example, this may be set to one fewer than the number of parallel
   *  queries to be run, or in running a data pipeline job, one fewer than the
   *  number of workers or compute instances available.
   */
  // const partitionCount = 1234
  /**
   *  The `next_page_token` value returned from a previous call to
   *  PartitionQuery that may be used to get an additional set of results.
   *  There are no ordering guarantees between sets of results. Thus, using
   *  multiple sets of results will require merging the different result sets.
   *  For example, two subsequent calls using a page_token may return:
   *   * cursor B, cursor M, cursor Q
   *   * cursor A, cursor U, cursor W
   *  To obtain a complete result set ordered with respect to the results of the
   *  query supplied to PartitionQuery, the results sets should be merged:
   *  cursor A, cursor B, cursor M, cursor Q, cursor U, cursor W
   */
  // const pageToken = 'abc123'
  /**
   *  The maximum number of partitions to return in this call, subject to
   *  `partition_count`.
   *  For example, if `partition_count` = 10 and `page_size` = 8, the first call
   *  to PartitionQuery will return up to 8 partitions and a `next_page_token`
   *  if more results exist. A second call to PartitionQuery will return up to
   *  2 partitions, to complete the total of 10 specified in `partition_count`.
   */
  // const pageSize = 1234
  /**
   *  Reads documents as they were at the given time.
   *  This must be a microsecond precision timestamp within the past one hour,
   *  or if Point-in-Time Recovery is enabled, can additionally be a whole
   *  minute timestamp within the past 7 days.
   */
  // const readTime = {}

  // Imports the Firestore library
  const {FirestoreClient} = require('@google-cloud/firestore').v1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function callPartitionQuery() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const iterable = await firestoreClient.partitionQueryAsync(request);
    for await (const response of iterable) {
        console.log(response);
    }
  }

  callPartitionQuery();
  // [END firestore_v1_generated_Firestore_PartitionQuery_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
