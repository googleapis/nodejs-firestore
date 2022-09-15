// Copyright 2022 Google LLC
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

import {afterEach, beforeEach, it} from 'mocha';
import {
  ApiOverride,
  createInstance,
  stream,
  streamWithoutEnd,
  verifyInstance,
} from './util/helpers';
import {Firestore, Query, Timestamp} from '../src';
import {expect, use} from 'chai';
import {google} from '../protos/firestore_v1_proto_api';
import api = google.firestore.v1;
import * as chaiAsPromised from 'chai-as-promised';
import {setTimeoutHandler} from '../src/backoff';
use(chaiAsPromised);

describe('aggregate query interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    setTimeoutHandler(setImmediate);
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  afterEach(async () => {
    await verifyInstance(firestore);
    setTimeoutHandler(setTimeout);
  });

  it('has isEqual() method', () => {
    const queryA = firestore.collection('collectionId');
    const queryB = firestore.collection('collectionId');

    const queryEquals = (equals: Query[], notEquals: Query[]) => {
      for (const equal1 of equals) {
        const equal1count = equal1.count();
        for (const equal2 of equals) {
          const equal2count = equal2.count();
          expect(equal1count.isEqual(equal2count)).to.be.true;
          expect(equal2count.isEqual(equal1count)).to.be.true;
        }

        for (const notEqual of notEquals) {
          const notEqual2count = notEqual.count();
          expect(equal1count.isEqual(notEqual2count)).to.be.false;
          expect(notEqual2count.isEqual(equal1count)).to.be.false;
        }
      }
    };

    queryEquals(
      [
        queryA.orderBy('foo').endBefore('a'),
        queryB.orderBy('foo').endBefore('a'),
      ],
      [
        queryA.orderBy('foo').endBefore('b'),
        queryB.orderBy('bar').endBefore('a'),
      ]
    );
  });

  it('returns results', async () => {
    const result: api.IRunAggregationQueryResponse = {
      result: {
        aggregateFields: {
          count: {integerValue: '99'},
        },
      },
      readTime: {seconds: 5, nanos: 6},
    };
    const overrides: ApiOverride = {
      runAggregationQuery: () => stream(result),
    };

    firestore = await createInstance(overrides);

    const query = firestore.collection('collectionId').count();
    return query.get().then(results => {
      expect(results.getCount()).to.be.equal(99);
      expect(results.readTime.isEqual(new Timestamp(5, 6))).to.be.true;
      expect(results.query).to.be.equal(query);
    });
  });

  it('successful return without ending the stream on get()', async () => {
    const result: api.IRunAggregationQueryResponse = {
      result: {
        aggregateFields: {
          count: {integerValue: '99'},
        },
      },
      readTime: {seconds: 5, nanos: 6},
    };
    const overrides: ApiOverride = {
      runAggregationQuery: () => streamWithoutEnd(result),
    };

    firestore = await createInstance(overrides);

    const query = firestore.collection('collectionId').count();
    return query.get().then(results => {
      expect(results.getCount()).to.be.equal(99);
      expect(results.readTime.isEqual(new Timestamp(5, 6))).to.be.true;
      expect(results.query).to.be.equal(query);
    });
  });

  it('handles stream exception at initialization', () => {
    const query = firestore.collection('collectionId').count();

    query._stream = () => {
      throw new Error('Expected error');
    };

    return expect(query.get()).to.eventually.rejectedWith('Expected error');
  });

  it('handles stream exception during initialization', async () => {
    const overrides: ApiOverride = {
      runAggregationQuery: () => {
        return stream(new Error('Expected error'));
      },
    };
    firestore = await createInstance(overrides);

    const query = firestore.collection('collectionId').count();
    await query
      .get()
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        expect(err.message).to.equal('Expected error');
      });
  });

  it('handles stream exception after initialization (with get())', () => {
    //Not required without retry logic.
    //TODO(tomandersen)
  });
});
