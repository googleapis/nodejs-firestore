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

import {expect} from 'chai';
import * as is from 'is';
import * as through2 from 'through2';

import * as Firestore from '../src/index';
import {createInstance as createInstanceHelper, document} from '../test/util/helpers';

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

const DOCUMENT_WITH_TIMESTAMP = document('documentId', 'moonLanding', {
  timestampValue: {
    nanos: 123000123,
    seconds: -14182920,
  },
});

const DOCUMENT_WITH_EMPTY_TIMESTAMP = document('documentId', 'moonLanding', {
  timestampValue: {},
});

describe('timestamps', () => {
  it('returned when enabled', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_TIMESTAMP)
        .then(firestore => {
          const expected = new Firestore.Timestamp(-14182920, 123000123);
          return firestore.doc('collectionId/documentId').get().then(res => {
            expect(res.data()!['moonLanding'].isEqual(expected)).to.be.true;
            expect(res.get('moonLanding')!.isEqual(expected)).to.be.true;
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
          return firestore.doc('collectionId/documentId').get().then(res => {
            expect(res.data()!['moonLanding']).to.be.instanceOf(Date);
            expect(res.get('moonLanding')).to.be.instanceOf(Date);
            console.error = oldErrorLog;
          });
        });
  });

  it('retain seconds and nanoseconds', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_TIMESTAMP)
        .then(firestore => {
          return firestore.doc('collectionId/documentId').get().then(res => {
            const timestamp = res.get('moonLanding');
            expect(timestamp.seconds).to.equal(-14182920);
            expect(timestamp.nanoseconds).to.equal(123000123);
          });
        });
  });

  it('convert to date', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_TIMESTAMP)
        .then(firestore => {
          return firestore.doc('collectionId/documentId').get().then(res => {
            const timestamp = res.get('moonLanding');
            expect(new Date(-14182920 * 1000 + 123).getTime())
                .to.equal(timestamp.toDate().getTime());
          });
        });
  });

  it('convert to millis', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_TIMESTAMP)
        .then(firestore => {
          return firestore.doc('collectionId/documentId').get().then(res => {
            const timestamp = res.get('moonLanding');
            expect(-14182920 * 1000 + 123).to.equal(timestamp.toMillis());
          });
        });
  });

  it('support missing values', () => {
    return createInstance(
               {timestampsInSnapshots: true}, DOCUMENT_WITH_EMPTY_TIMESTAMP)
        .then(firestore => {
          const expected = new Firestore.Timestamp(0, 0);

          return firestore.doc('collectionId/documentId').get().then(res => {
            expect(res.get('moonLanding').isEqual(expected)).to.be.true;
          });
        });
  });

  it('constructed using helper', () => {
    expect(Firestore.Timestamp.now()).to.be.an.instanceOf(Firestore.Timestamp);

    let actual = Firestore.Timestamp.fromDate(new Date(123123));
    let expected = new Firestore.Timestamp(123, 123000000);
    expect(actual.isEqual(expected)).to.be.true;

    actual = Firestore.Timestamp.fromMillis(123123);
    expected = new Firestore.Timestamp(123, 123000000);
    expect(actual.isEqual(expected)).to.be.true;
  });

  it('validates nanoseconds', () => {
    expect(() => new Firestore.Timestamp(0.1, 0))
        .to.throw('Argument "seconds" is not a valid integer.');

    expect(() => new Firestore.Timestamp(0, 0.1))
        .to.throw('Argument "nanoseconds" is not a valid integer.');

    expect(() => new Firestore.Timestamp(0, -1))
        .to.throw(
            'Argument "nanoseconds" is not a valid integer. Value must be within \[0, 999999999] inclusive, but was: -1');

    expect(() => new Firestore.Timestamp(0, 1000000000))
        .to.throw(
            'Argument "nanoseconds" is not a valid integer. Value must be within \[0, 999999999] inclusive, but was: 1000000000');
  });
});
