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

import {expect} from 'chai';

import {FieldPath, ResourcePath} from '../src/path';
import {InvalidApiUsage} from './util/helpers';

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;

describe('ResourcePath', () => {
  it('has id property', () => {
    expect(new ResourcePath(PROJECT_ID, '(default)', 'foo').id).to.equal('foo');
    expect(new ResourcePath(PROJECT_ID, '(default)').id).to.be.null;
  });

  it('has append() method', () => {
    let path = new ResourcePath(PROJECT_ID, '(default)');
    expect(path.formattedName()).to.equal(`${DATABASE_ROOT}/documents`);
    path = path.append('foo');
    expect(path.formattedName()).to.equal(`${DATABASE_ROOT}/documents/foo`);
  });

  it('has parent() method', () => {
    let path = new ResourcePath(PROJECT_ID, '(default)', 'foo');
    expect(path.formattedName()).to.equal(`${DATABASE_ROOT}/documents/foo`);
    path = path.parent()!;
    expect(path.formattedName()).to.equal(`${DATABASE_ROOT}/documents`);
    expect(path.parent()).to.be.null;
  });

  it('parses strings', () => {
    let path = ResourcePath.fromSlashSeparatedString(DATABASE_ROOT);
    expect(path.formattedName()).to.equal(`${DATABASE_ROOT}/documents`);
    path =
        ResourcePath.fromSlashSeparatedString(`${DATABASE_ROOT}/documents/foo`);
    expect(path.formattedName()).to.equal(`${DATABASE_ROOT}/documents/foo`);
    expect(() => {
      path =
          ResourcePath.fromSlashSeparatedString('projects/project/databases');
    }).to.throw('Resource name \'projects\/project\/databases\' is not valid');
  });

  it('accepts newlines', () => {
    const path = ResourcePath.fromSlashSeparatedString(
        `${DATABASE_ROOT}/documents/foo\nbar`);
    expect(path.formattedName())
        .to.equal(`${DATABASE_ROOT}/documents/foo\nbar`);
  });
});

describe('FieldPath', () => {
  it('encodes field names', () => {
    const components = [['foo'], ['foo', 'bar'], ['.', '`'], ['\\']];

    const results = ['foo', 'foo.bar', '`.`.`\\``', '`\\\\`'];

    for (let i = 0; i < components.length; ++i) {
      expect(new FieldPath(...components[i]).toString()).to.equal(results[i]);
    }
  });

  it('doesn\'t accept empty path', () => {
    expect(() => {
      new FieldPath();
    }).to.throw('Function "FieldPath()" requires at least 1 argument.');
  });

  it('only accepts strings', () => {
    expect(() => {
      new FieldPath('foo', 'bar', 0 as InvalidApiUsage);
    }).to.throw('Argument at index 2 is not a valid string.');
  });

  it('has append() method', () => {
    let path = new FieldPath('foo');
    path = path.append('bar');
    expect(path.formattedName()).to.equal('foo.bar');
  });

  it('has parent() method', () => {
    let path = new FieldPath('foo', 'bar');
    path = path.parent()!;
    expect(path.formattedName()).to.equal('foo');
  });

  it('escapes special characters', () => {
    const path = new FieldPath('f.o.o');
    expect(path.formattedName()).to.equal('`f.o.o`');
  });

  it('doesn\'t allow empty components', () => {
    expect(() => {
      new FieldPath('foo', '');
    }).to.throw('Element at index 1 should not be an empty string.');
  });

  it('has isEqual() method', () => {
    const path = new FieldPath('a');
    const equals = new FieldPath('a');
    const notEquals = new FieldPath('a', 'b', 'a');
    expect(path.isEqual(equals)).to.be.true;
    expect(path.isEqual(notEquals)).to.be.false;
  });
});
