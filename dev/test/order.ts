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

import {google} from '../protos/firestore_proto_api';

import {Firestore, QueryDocumentSnapshot, setLogFunction, Timestamp} from '../src';
import {GeoPoint} from '../src';
import {DocumentReference} from '../src';
import * as order from '../src/order';
import {ResourcePath} from '../src/path';
import {createInstance, InvalidApiUsage} from './util/helpers';

import api = google.firestore.v1;

// Change the argument to 'console.log' to enable debug output.
setLogFunction(() => {});

describe('Order', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  /** Converts a value into its proto representation. */
  async function wrap(value: unknown): Promise<api.IValue> {
    const val = await firestore._serializer!.encodeValue(value);
    expect(val).to.not.be.null;
    return val!;
  }

  function blob(data: number[]): Promise<api.IValue> {
    return wrap(Buffer.from(data));
  }

  function resource(pathString: string): Promise<api.IValue> {
    return wrap(new DocumentReference(
        firestore, ResourcePath.fromSlashSeparatedString(pathString)));
  }

  function geopoint(lat: number, lng: number): Promise<api.IValue> {
    return wrap(new GeoPoint(lat, lng));
  }

  function int(n: number): api.IValue {
    return {
      integerValue: n,
    };
  }

  function double(n: number): api.IValue {
    return {
      doubleValue: n,
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
      new QueryDocumentSnapshot(
          firestore.doc('col/doc3'), {}, Timestamp.now(), Timestamp.now(),
          Timestamp.now()),
      new QueryDocumentSnapshot(
          firestore.doc('col/doc2'), {}, Timestamp.now(), Timestamp.now(),
          Timestamp.now()),
      new QueryDocumentSnapshot(
          firestore.doc('col/doc2'), {}, Timestamp.now(), Timestamp.now(),
          Timestamp.now()),
      new QueryDocumentSnapshot(
          firestore.doc('col/doc1'), {}, Timestamp.now(), Timestamp.now(),
          Timestamp.now()),
    ];

    docs.sort(firestore.collection('col').comparator());

    expect(docs.map(doc => doc.id)).to.deep.eq([
      'doc1', 'doc2', 'doc2', 'doc3'
    ]);
  });

  it('is correct', async () => {
    const groups = [
      // null first
      [await wrap(null)],

      // booleans
      [await wrap(false)],
      [await wrap(true)],

      // numbers
      [await double(NaN), double(NaN)],
      [await double(-Infinity)],
      [await double(-Number.MAX_VALUE)],
      [await int(Number.MIN_SAFE_INTEGER - 1)],
      [await int(Number.MIN_SAFE_INTEGER)],
      [await double(-1.1)],
      // Integers and Doubles order the same.
      [await int(-1), double(-1.0)],
      [await double(-Number.MIN_VALUE)],
      // zeros all compare the same.
      [await int(0), double(0.0), double(-0)],
      [await double(Number.MIN_VALUE)],
      [await int(1), double(1.0)],
      [await double(1.1)],
      [await int(2)],
      [await int(10)],
      [await int(Number.MAX_SAFE_INTEGER)],
      [await int(Number.MAX_SAFE_INTEGER + 1)],
      [await double(Infinity)],

      // timestamps
      [await wrap(new Date(2016, 5, 20, 10, 20))],
      [await wrap(new Date(2016, 10, 21, 15, 32))],

      // strings
      [await wrap('')],
      [await wrap('\u0000\ud7ff\ue000\uffff')],
      [await wrap('(╯°□°）╯︵ ┻━┻')],
      [await wrap('a')],
      [await wrap('abc def')],
      // latin small letter e + combining acute accent + latin small letter b
      [await wrap('e\u0301b')],
      [await wrap('æ')],
      // latin small letter e with acute accent + latin small letter a
      [await wrap('\u00e9a')],

      // blobs
      [await blob([])],
      [await blob([0])],
      [await blob([0, 1, 2, 3, 4])],
      [await blob([0, 1, 2, 4, 3])],
      [await blob([255])],

      // resource names
      [await resource('projects/p1/databases/d1/documents/c1/doc1')],
      [await resource('projects/p1/databases/d1/documents/c1/doc2')],
      [await resource('projects/p1/databases/d1/documents/c1/doc2/c2/doc1')],
      [await resource('projects/p1/databases/d1/documents/c1/doc2/c2/doc2')],
      [await resource('projects/p1/databases/d1/documents/c10/doc1')],
      [await resource('projects/p1/databases/d1/documents/c2/doc1')],
      [await resource('projects/p2/databases/d2/documents/c1/doc1')],
      [await resource('projects/p2/databases/d2/documents/c1-/doc1')],
      [await resource('projects/p2/databases/d3/documents/c1-/doc1')],

      // geo points
      [await geopoint(-90, -180)],
      [await geopoint(-90, 0)],
      [await geopoint(-90, 180)],
      [await geopoint(0, -180)],
      [await geopoint(0, 0)],
      [await geopoint(0, 180)],
      [await geopoint(1, -180)],
      [await geopoint(1, 0)],
      [await geopoint(1, 180)],
      [await geopoint(90, -180)],
      [await geopoint(90, 0)],
      [await geopoint(90, 180)],

      // arrays
      [await wrap([])],
      [await wrap(['bar'])],
      [await wrap(['foo'])],
      [await wrap(['foo', 1])],
      [await wrap(['foo', 2])],
      [await wrap(['foo', '0'])],

      // objects
      [await wrap({bar: 0})],
      [await wrap({bar: 0, foo: 1})],
      [await wrap({foo: 1})],
      [await wrap({foo: 2})],
      [await wrap({foo: '0'})],
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
