/*!
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const { execSync } = require('child_process');
const { assert } = require('chai');
const exec = cmd => execSync(cmd, { encoding: 'utf8' });

describe('distributed counter', () => {
    it('should create, increase and get counter', () => {
        const output = exec('node solution-counters.js');
        let outputs = output.split('\n');
        assert.include(outputs[0], 'counter created');
        assert.include(outputs[1], 'counter increased');
        assert.include(outputs[2], 'new count is : 1');
        assert.include(outputs[3], 'counter increased again');
        assert.include(outputs[4], 'new count is : 2');
        assert.include(outputs[5], 'Deleted the document');
    });
});
