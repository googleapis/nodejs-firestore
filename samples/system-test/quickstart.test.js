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

const path = require(`path`);
const tools = require('@google-cloud/nodejs-repo-tools');
const assert = require('assert');

const cmd = `node quickstart.js`;
const cwd = path.join(__dirname, `..`);


describe('should make some API calls',function(){
 
  it('firestore_inspect_string', async function() {
      const output =  await tools.runAsync(cmd,cwd);

      assert.strictEqual(output.includes('Document created'), true);
      assert.strictEqual(output.includes('Entered new data into the document'), true);
      assert.strictEqual(output.includes('Updated an existing document'), true);
      assert.strictEqual(output.includes('Read the document'), true);
      assert.strictEqual(output.includes('Deleted the document'), true);

    });

});