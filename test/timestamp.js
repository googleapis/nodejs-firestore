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

'use strict';

const gax = require('google-gax');
const grpc = new gax.GrpcClient().grpc;
const Firestore = require('../');
const is = require('is');
const through = require('through2');
const assert = require('assert');

function createInstance(opts, document) {
  let firestore = new Firestore(
    Object.assign({}, opts, {
      projectId: 'test-project',
      sslCreds: grpc.credentials.createInsecure(),
    })
  );

  return firestore._ensureClient().then(() => {
    firestore._firestoreClient._innerApiCalls.batchGetDocuments = function() {
      const stream = through.obj();
      setImmediate(function() {
        stream.push({found: document, readTime: {seconds: 5, nanos: 6}});
        stream.push(null);
      });

      return stream;
    };

    return firestore;
  });
}

function document(field, value) {
  let document = {
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

describe('timestamps', function() {
  it('returned when enabled', function() {
    return createInstance(
      {timestampsInSnapshots: true,
        keyFilename: './test/fake.json'},
      DOCUMENT_WITH_TIMESTAMP
    ).then(firestore => {
      const expected = new Firestore.Timestamp(-14182920, 123000123);
      return firestore
        .doc('coll/doc')
        .get()
        .then(res => {
          assert.ok(res.data()['moonLanding'].isEqual(expected));
          assert.ok(res.get('moonLanding').isEqual(expected));
        });
    });
  });

  it('converted to dates when disabled', function() {
    /* eslint-disable no-console */
   const oldErrorLog = console.error;
    // Prevent error message that prompts to enable `timestampsInSnapshots`
    // behavior.
    console.error = () => {}

    return createInstance(
      {timestampsInSnapshots: false},
      DOCUMENT_WITH_TIMESTAMP
    ).then(firestore => {
      return firestore
        .doc('coll/doc')
        .get()
        .then(res => {
          assert.ok(is.date(res.data()['moonLanding']));
          assert.ok(is.date(res.get('moonLanding')));
          console.error = oldErrorLog;
        });
    });
    /* eslint-enable no-console */
  });

  it('retain seconds and nanoseconds', function() {
    return createInstance(
      {timestampsInSnapshots: true,
        keyFilename: './test/fake.json'},
      DOCUMENT_WITH_TIMESTAMP
    ).then(firestore => {
      return firestore
        .doc('coll/doc')
        .get()
        .then(res => {
          const timestamp = res.get('moonLanding');
          assert.equal(timestamp.seconds, -14182920);
          assert.equal(timestamp.nanoseconds, 123000123);
        });
    });
  });

  it('convert to date', function() {
    return createInstance(
      {timestampsInSnapshots: true,
        keyFilename: './test/fake.json'},
      DOCUMENT_WITH_TIMESTAMP
    ).then(firestore => {
      return firestore
        .doc('coll/doc')
        .get()
        .then(res => {
          const timestamp = res.get('moonLanding');
          assert.equal(
            new Date(-14182920 * 1000 + 123).getTime(),
            timestamp.toDate().getTime()
          );
        });
    });
  });

  it('convert to millis', function() {
    return createInstance(
      {timestampsInSnapshots: true,
        keyFilename: './test/fake.json'},
      DOCUMENT_WITH_TIMESTAMP
    ).then(firestore => {
      return firestore
        .doc('coll/doc')
        .get()
        .then(res => {
          const timestamp = res.get('moonLanding');
          assert.equal(-14182920 * 1000 + 123, timestamp.toMillis());
        });
    });
  });

  it('support missing values', function() {
    return createInstance(
      {timestampsInSnapshots: true,
        keyFilename: './test/fake.json'},
      DOCUMENT_WITH_EMPTY_TIMESTAMP
    ).then(firestore => {
      const expected = new Firestore.Timestamp(0, 0);

      return firestore
        .doc('coll/doc')
        .get()
        .then(res => {
          assert.ok(res.get('moonLanding').isEqual(expected));
        });
    });
  });

  it('constructed using helper', function() {
    assert.ok(is.instance(Firestore.Timestamp.now(), Firestore.Timestamp));

    let actual = Firestore.Timestamp.fromDate(new Date(123123));
    let expected = new Firestore.Timestamp(123, 123000000);
    assert.ok(actual.isEqual(expected));

    actual = Firestore.Timestamp.fromMillis(123123);
    expected = new Firestore.Timestamp(123, 123000000);
    assert.ok(actual.isEqual(expected));
  });

  it('validates nanoseconds', function() {
    assert.throws(
      () => new Firestore.Timestamp(0.1, 0),
      /Argument "seconds" is not a valid integer./
    );

    assert.throws(
      () => new Firestore.Timestamp(0, 0.1),
      /Argument "nanoseconds" is not a valid integer./
    );

    assert.throws(
      () => new Firestore.Timestamp(0, -1),
      /Argument "nanoseconds" is not a valid integer. Value must be within \[0, 999999999] inclusive, but was: -1/
    );

    assert.throws(
      () => new Firestore.Timestamp(0, 1000000000),
      /Argument "nanoseconds" is not a valid integer. Value must be within \[0, 999999999] inclusive, but was: 1000000000/
    );
  });
});
