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

const assert = require('power-assert');

const path = require('../src/path');
const ResourcePath = path.ResourcePath;
const FieldPath = path.FieldPath;

var PROJECT_ID = process.env.PROJECT_ID;
if (!PROJECT_ID) {
  PROJECT_ID = 'test-project';
}

const DATABASE_ROOT = 'projects/' + PROJECT_ID + '/databases/(default)';

describe('ResourcePath', function() {
  it('has id property', function() {
    assert.equal(
      new ResourcePath(PROJECT_ID, '(default)', 'foo').id,
      'foo'
    );
    assert.equal(new ResourcePath(PROJECT_ID, '(default)').id, null);
  });

  it('has append() method', function() {
    let path = new ResourcePath(PROJECT_ID, '(default)');
    assert.equal(path.formattedName, DATABASE_ROOT);
    path = path.append('foo');
    assert.equal(path.formattedName, `${DATABASE_ROOT}/documents/foo`);
  });

  it('has parent() method', function() {
    let path = new ResourcePath(PROJECT_ID, '(default)', 'foo');
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

  it('accepts newlines', function() {
    const path = ResourcePath.fromSlashSeparatedString(
      `${DATABASE_ROOT}/documents/foo\nbar`
    );
    assert.equal(path.formattedName, `${DATABASE_ROOT}/documents/foo\nbar`);
  });
});

describe('FieldPath', function() {
  it('encodes field names', function() {
    let components = [['foo'], ['foo', 'bar'], ['.', '`'], ['\\']];

    let results = ['foo', 'foo.bar', '`.`.`\\``', '`\\\\`'];

    for (let i = 0; i < components.length; ++i) {
      assert.equal(new FieldPath(components[i]).toString(), results[i]);
    }
  });

  it("doesn't accept empty path", function() {
    assert.throws(() => {
      new FieldPath();
    }, /Function 'FieldPath\(\)' requires at least 1 argument\./);
  });

  it('only accepts strings', function() {
    assert.throws(() => {
      new FieldPath('foo', 'bar', 0);
    }, /Argument at index 2 is not a valid string\./);
  });

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

  it('has isEqual() method', function() {
    let path = new FieldPath('a');
    let equals = new FieldPath('a');
    let notEquals = new FieldPath('a', 'b', 'a');
    assert.ok(path.isEqual(equals));
    assert.ok(!path.isEqual(notEquals));
  });
});
