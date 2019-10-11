/**
 * Copyright 2019, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
const { Firestore } = require('@google-cloud/firestore');

// [START create_counter]
async function createCounter(docRef, numShards) {
  const colRef = docRef.collection("shards");
  for (let count = 0; count < numShards; count++) {
    const newDoc = colRef.doc(count.toString());
    await newDoc.set({ count: 0 });
  }
}
// [END create_counter]

// [START increment_counter]
async function incrementCounter(docRef, numShards) {
  const shardId = Math.floor(Math.random() * numShards);
  const shardRef = docRef.collection("shards").doc(shardId.toString());
  return shardRef.update({ count: FieldValue.increment(1) });
}
// [END increment_counter]

// [START get_count]
async function getCount(docRef) {
  const snapshotList = await docRef.collection("shards").get();

  return snapshotList.docs.reduce((count, documentSnapshot) => {
    return count + documentSnapshot.data().count;
  }, 0)
}
// [END get_count]

async function solutionCounter() {
  // Create a new client
  const firestore = new Firestore();
  const docRef = firestore.doc('distributed_counter_samples/distributed_counter');
  const numberOfshard = 10;
  // Create Counter
  await createCounter(docRef, numberOfshard);
  // Increate the document count
  await incrementCounter(docRef, numberOfshard);
  // Get document count
  const count = await getCount(docRef);
  console.log(count);
  // Delete the document
  await docRef.delete();
  console.log('Deleted the document');
}

solutionCounter().catch(console.error);