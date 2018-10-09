/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Firestore from '../src/index';
import is from 'is';
import through2 from 'through2';
import assert from 'assert';

import {createInstance as createInstanceHelper} from '../test/util/helpers';

function createInstance(opts, document) {
  const overrides = {
    batchGetDocuments: () => {
      const stream = through2.obj();
      setImmediate(() => {
        stream.push({found: document, readTime: {seconds: 5, nanos: 6}});
        stream.push(null);
      });

      return stream;
    }
  };

  return createInstanceHelper(overrides, opts);
}

function document(field, value) {
  const document = {
    name: `projects/test-project/databases/(default)/documents/coll/doc`,
    fields: {},
    createTime: {},
    updateTime: {},
  };

  for (let i = 0; i < arguments.length; i += 2) {
    field = arguments[i];
    value = arguments[i + 1];
    document.fields[field] = value;
  }

  return document;
}

const DOCUMENT_WITH_TIMESTAMP = document('moonLanding', {
  valueType: 'timestampValue',
  timestampValue: {
    nanos: 123000123,
    seconds: -14182920,
  },
});

const DOCUMENT_WITH_EMPTY_TIMESTAMP = document('moonLanding', {
  valueType: 'timestampValue',
  timestampValue: {},
});

describe('timestamps', () => {
  it('returned when enabled', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_TIMESTAMP)
        .then(firestore => {
          const expected = new Firestore.Timestamp(-14182920, 123000123);
          return firestore.doc('coll/doc').get().then(res => {
            assert.ok(res.data()!['moonLanding'].isEqual(expected));
            assert.ok(res.get('moonLanding')!.isEqual(expected));
          });
        });
  });

  it('converted to dates when disabled', () => {
    const oldErrorLog = console.error;
    // Prevent error message that prompts to enable `timestampsInSnapshots`
    // behavior.
    console.error = () => {};

    return createInstance(
               {timestampsInSnapshots: false}, DOCUMENT_WITH_TIMESTAMP)
        .then(firestore => {
          return firestore.doc('coll/doc').get().then(res => {
            assert.ok(is.date(res.data()!['moonLanding']));
            assert.ok(is.date(res.get('moonLanding')));
            console.error = oldErrorLog;
          });
        });
  });

  it('retain seconds and nanoseconds', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_TIMESTAMP)
        .then(firestore => {
          return firestore.doc('coll/doc').get().then(res => {
            const timestamp = res.get('moonLanding');
            assert.equal(timestamp.seconds, -14182920);
            assert.equal(timestamp.nanoseconds, 123000123);
          });
        });
  });

  it('convert to date', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_TIMESTAMP)
        .then(firestore => {
          return firestore.doc('coll/doc').get().then(res => {
            const timestamp = res.get('moonLanding');
            assert.equal(
                new Date(-14182920 * 1000 + 123).getTime(),
                timestamp.toDate().getTime());
          });
        });
  });

  it('convert to millis', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_TIMESTAMP)
        .then(firestore => {
          return firestore.doc('coll/doc').get().then(res => {
            const timestamp = res.get('moonLanding');
            assert.equal(-14182920 * 1000 + 123, timestamp.toMillis());
          });
        });
  });

  it('support missing values', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_EMPTY_TIMESTAMP)
        .then(firestore => {
          const expected = new Firestore.Timestamp(0, 0);

          return firestore.doc('coll/doc').get().then(res => {
            assert.ok(res.get('moonLanding').isEqual(expected));
          });
        });
  });

  it('constructed using helper', () => {
    assert.ok(is.instance(Firestore.Timestamp.now(), Firestore.Timestamp));

    let actual = Firestore.Timestamp.fromDate(new Date(123123));
    let expected = new Firestore.Timestamp(123, 123000000);
    assert.ok(actual.isEqual(expected));

    actual = Firestore.Timestamp.fromMillis(123123);
    expected = new Firestore.Timestamp(123, 123000000);
    assert.ok(actual.isEqual(expected));
  });

  it('validates nanoseconds', () => {
    assert.throws(
        () => new Firestore.Timestamp(0.1, 0),
        /Argument "seconds" is not a valid integer./);

    assert.throws(
        () => new Firestore.Timestamp(0, 0.1),
        /Argument "nanoseconds" is not a valid integer./);

    assert.throws(
        () => new Firestore.Timestamp(0, -1),
        /Argument "nanoseconds" is not a valid integer. Value must be within \[0, 999999999] inclusive, but was: -1/);

    assert.throws(
        () => new Firestore.Timestamp(0, 1000000000),
        /Argument "nanoseconds" is not a valid integer. Value must be within \[0, 999999999] inclusive, but was: 1000000000/);
  });
});
