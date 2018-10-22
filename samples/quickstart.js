/**
 * Copyright 2017, Google, Inc.
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

// [START firestore_quickstart]
const Firestore = require('@google-cloud/firestore');
async function main() {
    const firestore = new Firestore({
      projectId: process.env.GCLOUD_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    
    const document = firestore.doc('posts/intro-to-firestore');
    console.log('Document created');
    
    // Enter new data into the document.
    await document.set({
      title: 'Welcome to Firestore',
      body: 'Hello World',
    });
    console.log('Entered new data into the document');
    
    // Update an existing document.
    await document.update({
      body: 'My first Firestore app',
    });
    console.log('Updated an existing document');
    
    // Read the document.
    let doc = await document.get();
    console.log('Read the document');
    
    // Delete the document.
    await document.delete();
    console.log('Deleted the document');
  
};

main().catch(console.error);
// [END firestore_quickstart]