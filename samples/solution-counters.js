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
const {Firestore, FieldValue} = require('@google-cloud/firestore');

async function main() {
  // [START firestore_solution_sharded_counter_increment]
  function incrementCounter(docRef, numShards) {
    const shardId = Math.floor(Math.random() * numShards);
    const shardRef = docRef.collection('shards').doc(shardId.toString());
    return shardRef.set({count: FieldValue.increment(1)}, {merge: true});
  }
  // [END firestore_solution_sharded_counter_increment]

  // [START firestore_solution_sharded_counter_get]
  async function getCount(docRef) {
    const querySnapshot = await docRef.collection('shards').get();
    const documents = querySnapshot.docs;

    let count = 0;
    for (const doc of documents) {
      count += doc.get('count');
    }
    return count;
  }
  // [END firestore_solution_sharded_counter_get]

  // [START firestore_data_delete_doc]
  async function deleteDocs(docRef) {
    const shardsCollectionRef = docRef.collection('shards');
    const shardDocs = await shardsCollectionRef.select('id').get();
    const promises = [];
    shardDocs.forEach(async doc => {
      promises.push(shardsCollectionRef.doc(doc.id).delete());
    });
    return Promise.all(promises);
  }
  // [END firestore_data_delete_doc]

  // Create a new client
  const firestore = new Firestore();
  const docRef = firestore.doc(
    'distributed_counter_samples/distributed_counter'
  );
  // Clean up documents from potential prior test runs
  await deleteDocs(docRef);
  const numberOfShards = 10;
  // Increase the document count
  return incrementCounter(docRef, numberOfShards).then(async () => {
    console.log('counter increased');
    // Get document count
    const count = await getCount(docRef);
    console.log(`new count is : ${count}`);
    // Delete the document
    await deleteDocs(docRef);
    console.log('Deleted the document');
  });
}

main();
