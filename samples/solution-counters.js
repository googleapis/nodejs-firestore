// Copyright 2019 Google LLC
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
const { Firestore, FieldValue } = require('@google-cloud/firestore');

async function main() {
  // [START increment_counter]
  function incrementCounter(docRef, numShards) {
    const shardId = Math.floor(Math.random() * numShards);
    const shardRef = docRef.collection("shards").doc(shardId.toString());
    return shardRef.set({ count: FieldValue.increment(1) }, { merge: true });
  }
  // [END increment_counter]

  // [START get_count]
  async function getCount(docRef) {
    const snapshotList = await docRef.collection("shards").select('count').get();

    return snapshotList.docs.reduce((count, documentSnapshot) => {
      return count + documentSnapshot.data().count;
    }, 0)
  }
  // [END get_count]

  // [START delete_Docs]
  async function deleteDocs(docRef) {
    const shardsCollectionRef = docRef.collection('shards');
    const shardDocs = await shardsCollectionRef.select('id').get();
    let promises = [];
    shardDocs.forEach(async (doc) => {
      promises.push(shardsCollectionRef.doc(doc.id).delete());
    });
    return Promise.all(promises);
  }
  // [END delete_Docs]

  // Create a new client
  const firestore = new Firestore();
  const docRef = firestore.doc('distributed_counter_samples/distributed_counter');
  const numberOfShards = 10;
  // Increase the document count
  return incrementCounter(docRef, numberOfShards).then(async () => {
    console.log('counter increased');
    // Get document count
    let count = await getCount(docRef);
    console.log(`new count is : ${count}`);
    // Delete the document
    await deleteDocs(docRef);
    console.log('Deleted the document');
  });
}

main();
