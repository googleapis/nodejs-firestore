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
  try{
    const firestore = new Firestore({
      projectId: 'YOUR_PROJECT_ID',
      keyFilename: '/path/to/keyfile.json',
    });
    
    const document = firestore.doc('posts/intro-to-firestore');
    
    // Enter new data into the document.
    await document.set({
      title: 'Welcome to Firestore',
      body: 'Hello World',
    });
    
    // Update an existing document.
    await document.update({
      body: 'My first Firestore app',
    });
    
    // Read the document.
    let doc = await document.get();
    
    // Delete the document.
    await document.delete();
        
  } catch (error){
    console.error('Something went wrong:', error);
  }
};

main().catch(console.error);
// [END firestore_quickstart]