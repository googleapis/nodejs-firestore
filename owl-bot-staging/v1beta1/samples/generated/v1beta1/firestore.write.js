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
  // [START firestore_v1beta1_generated_Firestore_Write_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The database name. In the format:
   *  `projects/{project_id}/databases/{database_id}`.
   *  This is only required in the first message.
   */
  // const database = 'abc123'
  /**
   *  The ID of the write stream to resume.
   *  This may only be set in the first message. When left empty, a new write
   *  stream will be created.
   */
  // const streamId = 'abc123'
  /**
   *  The writes to apply.
   *  Always executed atomically and in order.
   *  This must be empty on the first request.
   *  This may be empty on the last request.
   *  This must not be empty on all other requests.
   */
  // const writes = 1234
  /**
   *  A stream token that was previously sent by the server.
   *  The client should set this field to the token from the most recent
   *  WriteResponse google.firestore.v1beta1.WriteResponse  it has received. This acknowledges that the client has
   *  received responses up to this token. After sending this token, earlier
   *  tokens may not be used anymore.
   *  The server may close the stream if there are too many unacknowledged
   *  responses.
   *  Leave this field unset when creating a new stream. To resume a stream at
   *  a specific point, set this field and the `stream_id` field.
   *  Leave this field unset when creating a new stream.
   */
  // const streamToken = 'Buffer.from('string')'
  /**
   *  Labels associated with this write request.
   */
  // const labels = 1234

  // Imports the Firestore library
  const {FirestoreClient} = require('firestore').v1beta1;

  // Instantiates a client
  const firestoreClient = new FirestoreClient();

  async function callWrite() {
    // Construct request
    const request = {
      database,
    };

    // Run request
    const stream = await firestoreClient.write();
    stream.on('data', (response) => { console.log(response) });
    stream.on('error', (err) => { throw(err) });
    stream.on('end', () => { /* API call completed */ });
    stream.write(request);
    stream.end(); 
  }

  callWrite();
  // [END firestore_v1beta1_generated_Firestore_Write_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
