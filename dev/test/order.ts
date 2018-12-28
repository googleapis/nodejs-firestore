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

import * as Firestore from '../src';
import {DocumentSnapshot} from '../src/document';
import {GeoPoint} from '../src/geo-point';
import * as order from '../src/order';
import {ResourcePath} from '../src/path';
import {DocumentReference} from '../src/reference';
import {createInstance, InvalidApiUsage} from '../test/util/helpers';

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

describe('Order', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  /** Converts a value into its proto representation. */
  function wrap(value) {
    return firestore['_serializer']!.encodeValue(value);
  }

  function blob(data) {
    return wrap(Buffer.from(data));
  }

  function resource(pathString) {
    return wrap(new DocumentReference(
        firestore, ResourcePath.fromSlashSeparatedString(pathString)));
  }

  function geopoint(lat, lng) {
    return wrap(new GeoPoint(lat, lng));
  }

  function int(n: number) {
    return {
      integerValue: '' + n,
    };
  }

  function double(n: number) {
    return {
      doubleValue: '' + n,
    };
  }

  it('throws on invalid value', () => {
    expect(() => {
      order.compare(
          {valueType: 'foo'} as InvalidApiUsage,
          {valueType: 'foo'} as InvalidApiUsage);
    }).to.throw('Unexpected value type: foo');
  });

  it('throws on invalid blob', () => {
    expect(() => {
      order.compare(
          {
            bytesValue: new Uint8Array([1, 2, 3]),
          },
          {
            bytesValue: new Uint8Array([1, 2, 3]),
          });
    }).to.throw('Blobs can only be compared if they are Buffers');
  });

  it('compares document snapshots by name', () => {
    const docs = [
      new DocumentSnapshot(firestore.doc('col/doc3')),
      new DocumentSnapshot(firestore.doc('col/doc2')),
      new DocumentSnapshot(firestore.doc('col/doc2')),
      new DocumentSnapshot(firestore.doc('col/doc1')),
    ];

    docs.sort(firestore.collection('col').comparator());

    expect(docs.map(doc => doc.id)).to.deep.eq([
      'doc1', 'doc2', 'doc2', 'doc3'
    ]);
  });

  it('is correct', () => {
    const groups = [
      // null first
      [wrap(null)],

      // booleans
      [wrap(false)],
      [wrap(true)],

      // numbers
      [double(NaN), double(NaN)],
      [double(-Infinity)],
      [double(-Number.MAX_VALUE)],
      [int(Number.MIN_SAFE_INTEGER - 1)],
      [int(Number.MIN_SAFE_INTEGER)],
      [double(-1.1)],
      // Integers and Doubles order the same.
      [int(-1), double(-1.0)],
      [double(-Number.MIN_VALUE)],
      // zeros all compare the same.
      [int(0), double(0.0), double(-0)],
      [double(Number.MIN_VALUE)],
      [int(1), double(1.0)],
      [double(1.1)],
      [int(2)],
      [int(10)],
      [int(Number.MAX_SAFE_INTEGER)],
      [int(Number.MAX_SAFE_INTEGER + 1)],
      [double(Infinity)],

      // timestamps
      [wrap(new Date(2016, 5, 20, 10, 20))],
      [wrap(new Date(2016, 10, 21, 15, 32))],

      // strings
      [wrap('')],
      [wrap('\u0000\ud7ff\ue000\uffff')],
      [wrap('(╯°□°）╯︵ ┻━┻')],
      [wrap('a')],
      [wrap('abc def')],
      // latin small letter e + combining acute accent + latin small letter b
      [wrap('e\u0301b')],
      [wrap('æ')],
      // latin small letter e with acute accent + latin small letter a
      [wrap('\u00e9a')],

      // blobs
      [blob([])],
      [blob([0])],
      [blob([0, 1, 2, 3, 4])],
      [blob([0, 1, 2, 4, 3])],
      [blob([255])],

      // resource names
      [resource('projects/p1/databases/d1/documents/c1/doc1')],
      [resource('projects/p1/databases/d1/documents/c1/doc2')],
      [resource('projects/p1/databases/d1/documents/c1/doc2/c2/doc1')],
      [resource('projects/p1/databases/d1/documents/c1/doc2/c2/doc2')],
      [resource('projects/p1/databases/d1/documents/c10/doc1')],
      [resource('projects/p1/databases/d1/documents/c2/doc1')],
      [resource('projects/p2/databases/d2/documents/c1/doc1')],
      [resource('projects/p2/databases/d2/documents/c1-/doc1')],
      [resource('projects/p2/databases/d3/documents/c1-/doc1')],

      // geo points
      [geopoint(-90, -180)],
      [geopoint(-90, 0)],
      [geopoint(-90, 180)],
      [geopoint(0, -180)],
      [geopoint(0, 0)],
      [geopoint(0, 180)],
      [geopoint(1, -180)],
      [geopoint(1, 0)],
      [geopoint(1, 180)],
      [geopoint(90, -180)],
      [geopoint(90, 0)],
      [geopoint(90, 180)],

      // arrays
      [wrap([])],
      [wrap(['bar'])],
      [wrap(['foo'])],
      [wrap(['foo', 1])],
      [wrap(['foo', 2])],
      [wrap(['foo', '0'])],

      // objects
      [wrap({bar: 0})],
      [wrap({bar: 0, foo: 1})],
      [wrap({foo: 1})],
      [wrap({foo: 2})],
      [wrap({foo: '0'})],
    ];

    for (let i = 0; i < groups.length; i++) {
      for (const left of groups[i]) {
        for (let j = 0; j < groups.length; j++) {
          for (const right of groups[j]) {
            let expected = order.primitiveComparator(i, j);
            expect(order.compare(left, right))
                .to.equal(
                    expected,
                    'comparing ' + left + ' (' + JSON.stringify(left) +
                        ') to ' + right + ' (' + JSON.stringify(right) +
                        ') at (' + i + ', ' + j + ')');

            expected = order.primitiveComparator(j, i);
            expect(order.compare(right, left))
                .to.equal(
                    expected,
                    'comparing ' + right + ' (' + JSON.stringify(right) +
                        ') to ' + left + ' (' + JSON.stringify(left) +
                        ') at (' + j + ', ' + i + ')');
          }
        }
      }
    }
  });
});
