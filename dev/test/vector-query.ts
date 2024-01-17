// Copyright 2024 Google LLC
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
import {fieldFiltersQuery, queryEquals, result} from './query';
import {
  ApiOverride,
  createInstance,
  stream,
  streamWithoutEnd,
  verifyInstance,
} from './util/helpers';
import {
  DocumentSnapshot,
  FieldValue,
  Firestore,
  Query,
  Timestamp,
} from '../src';
import {expect, use} from 'chai';
import {google} from '../protos/firestore_v1_proto_api';
import api = google.firestore.v1;
import * as chaiAsPromised from 'chai-as-promised';
import {setTimeoutHandler} from '../src/backoff';
use(chaiAsPromised);

export function findNearestQuery(
  fieldPath: string,
  queryVector: Array<number>,
  limit: number,
  measure: api.StructuredQuery.FindNearest.DistanceMeasure
): api.IStructuredQuery {
  return {
    findNearest: {
      vectorField: {fieldPath},
      queryVector: {
        mapValue: {
          fields: {
            __type__: {stringValue: '__vector__'},
            value: {
              arrayValue: {
                values: queryVector.map(n => {
                  return {doubleValue: n};
                }),
              },
            },
          },
        },
      },
      limit: {value: limit},
      distanceMeasure: measure,
    },
  };
}

describe('Vector(findNearest) query interface', () => {
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
    const queryA = firestore.collection('collectionId').where('foo', '==', 42);
    const queryB = firestore.collection('collectionId').where('foo', '==', 42);

    expect(
      queryA
        .findNearest('embedding', [40, 41, 42], {
          limit: 10,
          distanceMeasure: 'COSINE',
        })
        .isEqual(
          queryA.findNearest('embedding', [40, 41, 42], {
            distanceMeasure: 'COSINE',
            limit: 10,
          })
        )
    ).to.be.true;
    expect(
      queryA
        .findNearest('embedding', [40, 41, 42], {
          limit: 10,
          distanceMeasure: 'COSINE',
        })
        .isEqual(
          queryB.findNearest('embedding', [40, 41, 42], {
            distanceMeasure: 'COSINE',
            limit: 10,
          })
        )
    ).to.be.true;

    expect(
      queryA
        .findNearest('embedding', [40, 41, 42], {
          limit: 10,
          distanceMeasure: 'COSINE',
        })
        .isEqual(
          firestore
            .collection('collectionId')
            .findNearest('embedding', [40, 41, 42], {
              distanceMeasure: 'COSINE',
              limit: 10,
            })
        )
    ).to.be.false;
    expect(
      queryA
        .findNearest('embedding', [40, 41, 42], {
          limit: 10,
          distanceMeasure: 'COSINE',
        })
        .isEqual(
          queryB.findNearest('embedding', [40, 42], {
            distanceMeasure: 'COSINE',
            limit: 10,
          })
        )
    ).to.be.false;
    expect(
      queryA
        .findNearest('embedding', [40, 41, 42], {
          limit: 10,
          distanceMeasure: 'COSINE',
        })
        .isEqual(
          queryB.findNearest('embedding', [40, 42], {
            distanceMeasure: 'COSINE',
            limit: 1000,
          })
        )
    ).to.be.false;
    expect(
      queryA
        .findNearest('embedding', [40, 41, 42], {
          limit: 10,
          distanceMeasure: 'COSINE',
        })
        .isEqual(
          queryB.findNearest('embedding', [40, 42], {
            distanceMeasure: 'EUCLIDEAN',
            limit: 1000,
          })
        )
    ).to.be.false;
  });

  it('generates proto', async () => {
    const overrides: ApiOverride = {
      runQuery: request => {
        queryEquals(
          request,
          fieldFiltersQuery('foo', 'EQUAL', 'bar'),
          findNearestQuery('embedding', [3, 4, 5], 100, 'COSINE')
        );
        return stream();
      },
    };

    return createInstance(overrides).then(firestoreInstance => {
      firestore = firestoreInstance;
      const query: Query = firestore.collection('collectionId');
      const vectorQuery = query
        .where('foo', '==', 'bar')
        .findNearest('embedding', FieldValue.vector([3, 4, 5]), {
          limit: 100,
          distanceMeasure: 'COSINE',
        });
      return vectorQuery.get();
    });
  });

  it('validates inputs', async () => {
    const query: Query = firestore.collection('collectionId');
    expect(() => {
      query.findNearest('embedding', [], {
        limit: 10,
        distanceMeasure: 'EUCLIDEAN',
      });
    }).to.throw('not a valid vector size larger than 0');
    expect(() => {
      query.findNearest('embedding', [10, 1000], {
        limit: 0,
        distanceMeasure: 'EUCLIDEAN',
      });
    }).to.throw('not a valid positive limit number');
  });

  it('returns results', async () => {
    const overrides: ApiOverride = {
      runQuery: request => {
        queryEquals(
          request,
          findNearestQuery('embedding', [1], 2, 'EUCLIDEAN')
        );
        return stream(result('first'), result('second'));
      },
    };

    return createInstance(overrides).then(firestoreInstance => {
      firestore = firestoreInstance;
      const query = firestore
        .collection('collectionId')
        .findNearest('embedding', [1], {
          limit: 2,
          distanceMeasure: 'EUCLIDEAN',
        });
      return query.get().then(results => {
        expect(results.size).to.equal(2);
        expect(results.empty).to.be.false;
        expect(results.readTime.isEqual(new Timestamp(5, 6))).to.be.true;
        expect(results.docs[0].id).to.equal('first');
        expect(results.docs[1].id).to.equal('second');
        expect(results.docChanges()).to.have.length(2);

        let count = 0;

        results.forEach(doc => {
          expect(doc instanceof DocumentSnapshot).to.be.true;
          expect(doc.createTime.isEqual(new Timestamp(1, 2))).to.be.true;
          expect(doc.updateTime.isEqual(new Timestamp(3, 4))).to.be.true;
          expect(doc.readTime.isEqual(new Timestamp(5, 6))).to.be.true;
          ++count;
        });

        expect(2).to.equal(count);
      });
    });
  });

  it('successful return without ending the stream on get()', async () => {
    const overrides: ApiOverride = {
      runQuery: request => {
        queryEquals(request, findNearestQuery('vector', [1], 10, 'COSINE'));
        return streamWithoutEnd(result('first'), result('second', true));
      },
    };

    let counter = 0;
    return createInstance(overrides).then(firestoreInstance => {
      firestore = firestoreInstance;
      const query = firestore
        .collection('collectionId')
        .findNearest('vector', [1], {limit: 10, distanceMeasure: 'COSINE'});
      return query.get().then(results => {
        expect(++counter).to.equal(1);
        expect(results.size).to.equal(2);
        expect(results.empty).to.be.false;
        expect(results.readTime.isEqual(new Timestamp(5, 6))).to.be.true;
        expect(results.docs[0].id).to.equal('first');
        expect(results.docs[1].id).to.equal('second');
        expect(results.docChanges()).to.have.length(2);
      });
    });
  });

  it('handles stream exception at initialization', async () => {
    let attempts = 0;
    const query = firestore
      .collection('collectionId')
      .findNearest('embedding', [1], {
        limit: 100,
        distanceMeasure: 'EUCLIDEAN',
      });

    query._queryUtil._stream = () => {
      ++attempts;
      throw new Error('Expected error');
    };

    return query
      .get()
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        expect(err.message).to.equal('Expected error');
        expect(attempts).to.equal(1);
      });
  });

  it('handles stream exception during initialization', async () => {
    let attempts = 0;

    const overrides: ApiOverride = {
      runQuery: () => {
        ++attempts;
        return stream(new Error('Expected error'));
      },
    };

    return createInstance(overrides).then(firestoreInstance => {
      firestore = firestoreInstance;
      return firestore
        .collection('collectionId')
        .findNearest('embedding', [1], {limit: 10, distanceMeasure: 'COSINE'})
        .get()
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          expect(err.message).to.equal('Expected error');
          expect(attempts).to.equal(5);
        });
    });
  });
});
