// Copyright 2020 Google LLC
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

import {expect} from 'chai';
import {isPlainObject} from '../src/util';

describe('util', () => {
  it('isPlainObject supports Object.create()', () => {
    expect(isPlainObject(Object.create({}))).to.be.true;
    expect(isPlainObject(Object.create(Object.prototype))).to.be.true;
    expect(isPlainObject(Object.create(null))).to.be.true;
  });

  it('isPlainObject supports plain types', () => {
    expect(isPlainObject({foo: 'bar'})).to.be.true;
    expect(isPlainObject({})).to.be.true;
  });

  it('isPlainObject rejects custom types', () => {
    class Foo {}
    expect(isPlainObject(new Foo())).to.be.false;
  });
});
