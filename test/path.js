/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

let assert = require('assert');

let Path = require('../src/path');

const databaseRoot = 'projects/test-project/databases/(default)';

describe('Path', function() {
  it('has id property', function() {
    assert.equal(
      new Path('test-project', '(default)', ['foo']).id, 'foo');
    assert.equal(new Path('test-project', '(default)', []).id, null);
  });

  it('has child() method', function() {
    let path = new Path('test-project', '(default)', []);
    assert.equal(path.formattedName, databaseRoot);
    path = path.child('foo');
    assert.equal(path.formattedName,`${databaseRoot}/documents/foo`);
  });

  it('has parent() method', function() {
    let path = new Path('test-project', '(default)', ['foo']);
    assert.equal(path.formattedName, `${databaseRoot}/documents/foo`);
    path = path.parent();
    assert.equal(path.formattedName, databaseRoot);
    assert.equal(path.parent(), null);
  });

  it('parses strings', function() {
    let path = Path.fromName(databaseRoot);
    assert.equal(path.formattedName, databaseRoot);
    path = Path.fromName(`${databaseRoot}/documents/foo`);
    assert.equal(path.formattedName, `${databaseRoot}/documents/foo`);
    assert.throws(() => {
      path = Path.fromName('projects/project/databases');
    }, /Provided resource name is not valid\./);
  });
});

