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

const assert = require('assert');

const path = require('../src/path');
const ResourcePath = path.ResourcePath;
const FieldPath = path.FieldPath;

const DATABASE_ROOT = 'projects/test-project/databases/(default)';

describe('ResourcePath', function() {
  it('has id property', function() {
    assert.equal(
      new ResourcePath('test-project', '(default)', 'foo').id,
      'foo'
    );
    assert.equal(new ResourcePath('test-project', '(default)').id, null);
  });

  it('has append() method', function() {
    let path = new ResourcePath('test-project', '(default)');
    assert.equal(path.formattedName, DATABASE_ROOT);
    path = path.append('foo');
    assert.equal(path.formattedName, `${DATABASE_ROOT}/documents/foo`);
  });

  it('has parent() method', function() {
    let path = new ResourcePath('test-project', '(default)', 'foo');
    assert.equal(path.formattedName, `${DATABASE_ROOT}/documents/foo`);
    path = path.parent();
    assert.equal(path.formattedName, DATABASE_ROOT);
    assert.equal(path.parent(), null);
  });

  it('parses strings', function() {
    let path = ResourcePath.fromSlashSeparatedString(DATABASE_ROOT);
    assert.equal(path.formattedName, DATABASE_ROOT);
    path = ResourcePath.fromSlashSeparatedString(
      `${DATABASE_ROOT}/documents/foo`
    );
    assert.equal(path.formattedName, `${DATABASE_ROOT}/documents/foo`);
    assert.throws(() => {
      path = ResourcePath.fromSlashSeparatedString(
        'projects/project/databases'
      );
    }, /Resource name 'projects\/project\/databases' is not valid\./);
  });
});

describe('FieldPath', function() {
  it('has append() method', function() {
    let path = new FieldPath('foo');
    path = path.append('bar');
    assert.equal(path.formattedName, 'foo.bar');
  });

  it('has parent() method', function() {
    let path = new FieldPath('foo', 'bar');
    path = path.parent();
    assert.equal(path.formattedName, 'foo');
  });

  it('escapes special characters', function() {
    let path = new FieldPath('f.o.o');
    assert.equal(path.formattedName, '`f.o.o`');
  });

  it("doesn't allow empty components", function() {
    assert.throws(() => {
      new FieldPath('foo', '');
    }, /Argument at index 1 should not be empty./);
  });
});
