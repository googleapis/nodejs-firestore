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

const { execSync } = require('child_process');
const { assert } = require('chai');
const exec = cmd => execSync(cmd, { encoding: 'utf8' });

describe('distributed counter', () => {
    it('should increase, get counter and delete the docs', () => {
        const output = exec('node solution-counters.js');
        assert.include(output, 'counter increased');
        assert.include(output, 'new count is : 1');
        assert.include(output, 'Deleted the document');
    });
});
