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
const proxyquire = require(`proxyquire`).noPreserveCache();
const sinon = require(`sinon`);
const test = require(`ava`);

const cmd = `node quickstart.js`;
const cwd = path.join(__dirname, `..`);

test(`should make some API calls`, (t) => {
  const docMock = {
    set: sinon.stub().returns(Promise.resolve()),
    update: sinon.stub().returns(Promise.resolve()),
    get: sinon.stub().returns(Promise.resolve()),
    delete: sinon.stub().returns(Promise.resolve()),
  };

  function FirestoreMock() {}
  FirestoreMock.prototype.doc = sinon.stub().returns(docMock);

  proxyquire(`../quickstart`, {
    '@google-cloud/firestore': FirestoreMock,
  });

  t.is(docMock.set.callCount, 1);
  t.is(docMock.update.callCount, 1);
  t.is(docMock.get.callCount, 1);
  t.is(docMock.delete.callCount, 1);
});
