/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import {FieldValue} from '../src';

import {ApiOverride, arrayTransform, createInstance, document, requestEquals, serverTimestamp, set, writeResult} from './util/helpers';

function genericFieldValueTests(methodName: string, sentinel: FieldValue) {
  it('can\'t be used inside arrays', () => {
    return createInstance().then(firestore => {
      const docRef = firestore.doc('coll/doc');
      const expectedErr =
          new RegExp(`${methodName}\\(\\) cannot be used inside of an array`);
      expect(() => docRef.set({a: [sentinel]})).to.throw(expectedErr);
      expect(() => docRef.set({a: {b: [sentinel]}})).to.throw(expectedErr);
      expect(() => docRef.set({
        a: [{b: sentinel}],
      })).to.throw(expectedErr);
      expect(() => docRef.set({a: {b: {c: [sentinel]}}})).to.throw(expectedErr);
    });
  });

  it('can\'t be used inside arrayUnion()', () => {
    return createInstance().then(firestore => {
      const docRef = firestore.doc('collectionId/documentId');
      expect(() => docRef.set({foo: FieldValue.arrayUnion(sentinel)}))
          .to.throw(`Argument at index 0 is not a valid array element. ${
              methodName}() cannot be used inside of an array.`);
    });
  });

  it('can\'t be used inside arrayRemove()', () => {
    return createInstance().then(firestore => {
      const docRef = firestore.doc('collectionId/documentId');
      expect(() => docRef.set({foo: FieldValue.arrayRemove(sentinel)}))
          .to.throw(`Argument at index 0 is not a valid array element. ${
              methodName}() cannot be used inside of an array.`);
    });
  });

  it('can\'t be used with queries', () => {
    return createInstance().then(firestore => {
      const collRef = firestore.collection('coll');
      expect(() => collRef.where('a', '==', sentinel))
          .to.throw(`Argument "value" is not a valid query constraint. ${
              methodName}() can only be used in set(), create() or update().`);
      expect(() => collRef.orderBy('a').startAt(sentinel))
          .to.throw(`Argument at index 0 is not a valid query constraint. ${
              methodName}() can only be used in set(), create() or update().`);
    });
  });
}

describe('FieldValue.arrayUnion()', () => {
  it('requires one argument', () => {
    expect(() => FieldValue.arrayUnion())
        .to.throw(
            'Function "FieldValue.arrayUnion()" requires at least 1 argument.');
  });

  it('supports isEqual()', () => {
    const arrayUnionFoo1 = FieldValue.arrayUnion('foo');
    const arrayUnionFoo2 = FieldValue.arrayUnion('foo');
    const arrayUnionBar = FieldValue.arrayUnion('bar');
    expect(arrayUnionFoo1.isEqual(arrayUnionFoo2)).to.be.true;
    expect(arrayUnionFoo1.isEqual(arrayUnionBar)).to.be.false;
  });

  it('can be used with set()', () => {
    const overrides: ApiOverride = {
      commit: (request, options, callback) => {
        const expectedRequest = set({
          document: document('documentId', 'foo', 'bar'),
          transforms: [
            arrayTransform('field', 'appendMissingElements', 'foo', 'bar'),
            arrayTransform('map.field', 'appendMissingElements', 'foo', 'bar')
          ]
        });

        requestEquals(request, expectedRequest);

        callback(null, writeResult(2));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({
        foo: 'bar',
        field: FieldValue.arrayUnion('foo', 'bar'),
        map: {field: FieldValue.arrayUnion('foo', 'bar')},
      });
    });
  });

  genericFieldValueTests('FieldValue.arrayUnion', FieldValue.arrayUnion('foo'));
});

describe('FieldValue.arrayRemove()', () => {
  it('requires one argument', () => {
    expect(() => FieldValue.arrayRemove())
        .to.throw(
            'Function "FieldValue.arrayRemove()" requires at least 1 argument.');
  });

  it('supports isEqual()', () => {
    const arrayRemoveFoo1 = FieldValue.arrayUnion('foo');
    const arrayRemoveFoo2 = FieldValue.arrayUnion('foo');
    const arrayRemoveBar = FieldValue.arrayUnion('bar');
    expect(arrayRemoveFoo1.isEqual(arrayRemoveFoo2)).to.be.true;
    expect(arrayRemoveFoo1.isEqual(arrayRemoveBar)).to.be.false;
  });

  it('can be used with set()', () => {
    const overrides: ApiOverride = {
      commit: (request, options, callback) => {
        const expectedRequest = set({
          document: document('documentId', 'foo', 'bar'),
          transforms: [
            arrayTransform('field', 'removeAllFromArray', 'foo', 'bar'),
            arrayTransform('map.field', 'removeAllFromArray', 'foo', 'bar')
          ]
        });
        requestEquals(request, expectedRequest);

        callback(null, writeResult(2));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({
        foo: 'bar',
        field: FieldValue.arrayRemove('foo', 'bar'),
        map: {field: FieldValue.arrayRemove('foo', 'bar')},
      });
    });
  });

  genericFieldValueTests(
      'FieldValue.arrayRemove', FieldValue.arrayRemove('foo'));
});

describe('FieldValue.serverTimestamp()', () => {
  it('supports isEqual()', () => {
    const firstTimestamp = FieldValue.serverTimestamp();
    const secondTimestamp = FieldValue.serverTimestamp();
    expect(firstTimestamp.isEqual(secondTimestamp)).to.be.true;
  });

  it('can be used with set()', () => {
    const overrides: ApiOverride = {
      commit: (request, options, callback) => {
        const expectedRequest = set({
          document: document('documentId', 'foo', 'bar'),
          transforms:
              [serverTimestamp('field'), serverTimestamp('map.field')]
        });
        requestEquals(request, expectedRequest);

        callback(null, writeResult(2));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({
        foo: 'bar',
        field: FieldValue.serverTimestamp(),
        map: {field: FieldValue.serverTimestamp()},
      });
    });
  });

  genericFieldValueTests(
      'FieldValue.serverTimestamp', FieldValue.serverTimestamp());
});
