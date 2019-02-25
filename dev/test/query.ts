/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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
import * as extend from 'extend';

import {google} from '../protos/firestore_proto_api';
import {FieldPath, FieldValue, Firestore, setLogFunction} from '../src';
import {DocumentData, DocumentReference, Query, Timestamp} from '../src';
import {DocumentSnapshot, DocumentSnapshotBuilder} from '../src/document';
import {ResourcePath} from '../src/path';
import {ApiOverride, createInstance, document, InvalidApiUsage, stream} from './util/helpers';

import api = google.firestore.v1;

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;

// Change the argument to 'console.log' to enable debug output.
setLogFunction(() => {});

function snapshot(
    relativePath: string, data: DocumentData): Promise<DocumentSnapshot> {
  return createInstance().then(firestore => {
    const snapshot = new DocumentSnapshotBuilder();
    const path = ResourcePath.fromSlashSeparatedString(
        `${DATABASE_ROOT}/documents/${relativePath}`);
    snapshot.ref = new DocumentReference(firestore, path);
    snapshot.fieldsProto = firestore['_serializer']!.encodeFields(data);
    snapshot.readTime = Timestamp.fromMillis(0);
    snapshot.createTime = Timestamp.fromMillis(0);
    snapshot.updateTime = Timestamp.fromMillis(0);
    return snapshot.build();
  });
}

function fieldFilters(
    fieldPath: string, op: api.StructuredQuery.FieldFilter.Operator,
    value: (string|api.IValue),
    ...fieldPathOpAndValues:
        Array<string|api.StructuredQuery.FieldFilter.Operator|string|
              api.IValue>): api.IStructuredQuery {
  const filters: api.StructuredQuery.IFilter[] = [];

  for (let i = 0; i < arguments.length; i += 3) {
    fieldPath = arguments[i];
    op = arguments[i + 1];
    value = arguments[i + 2];

    const filter: api.StructuredQuery.IFieldFilter = {
      field: {
        fieldPath,
      },
      op,
    };

    if (typeof value === 'string') {
      filter.value = {stringValue: value};
    } else {
      filter.value = value;
    }

    filters.push({fieldFilter: filter});
  }

  if (filters.length === 1) {
    return {
      where: {
        fieldFilter: filters[0].fieldFilter,
      },
    };
  } else {
    return {
      where: {
        compositeFilter: {
          op: 'AND',
          filters,
        },
      },
    };
  }
}

function unaryFilters(
    fieldPath: string, equals: 'IS_NAN'|'IS_NULL',
    ...fieldPathsAndEquals: string[]): api.IStructuredQuery {
  const filters: api.StructuredQuery.IFilter[] = [];

  fieldPathsAndEquals.unshift(fieldPath, equals);

  for (let i = 0; i < fieldPathsAndEquals.length; i += 2) {
    const fieldPath = fieldPathsAndEquals[i];
    const equals = fieldPathsAndEquals[i + 1];

    expect(equals).to.be.oneOf(['IS_NAN', 'IS_NULL']);

    filters.push({
      unaryFilter: {
        field: {
          fieldPath,
        },
        op: equals as 'IS_NAN' | 'IS_NULL',
      },
    });
  }

  if (filters.length === 1) {
    return {
      where: {
        unaryFilter: filters[0].unaryFilter,
      },
    };
  } else {
    return {
      where: {
        compositeFilter: {
          op: 'AND',
          filters,
        },
      },
    };
  }
}

function orderBy(
    fieldPath: string, direction: api.StructuredQuery.Direction,
    ...fieldPathAndOrderBys: Array<string|api.StructuredQuery.Direction>):
    api.IStructuredQuery {
  const orderBy: api.StructuredQuery.IOrder[] = [];

  fieldPathAndOrderBys.unshift(fieldPath, direction);

  for (let i = 0; i < fieldPathAndOrderBys.length; i += 2) {
    const fieldPath = fieldPathAndOrderBys[i] as string;
    const direction =
        fieldPathAndOrderBys[i + 1] as api.StructuredQuery.Direction;
    orderBy.push({
      field: {
        fieldPath,
      },
      direction,
    });
  }

  return {orderBy};
}

function limit(n: number): api.IStructuredQuery {
  return {
    limit: {
      value: n,
    },
  };
}

function offset(n: number): api.IStructuredQuery {
  return {
    offset: n,
  };
}

function select(...fields: string[]): api.IStructuredQuery {
  const select: api.StructuredQuery.IProjection = {
    fields: [],
  };

  for (const field of fields) {
    select.fields!.push({fieldPath: field});
  }

  return {select};
}

function startAt(before: boolean, ...values: Array<string|api.IValue>):
    api.IStructuredQuery {
  const cursor: api.ICursor = {
    values: [],
  };

  if (before) {
    cursor.before = true;
  }

  for (const value of values) {
    if (typeof value === 'string') {
      cursor.values!.push({
        stringValue: value,
      });
    } else {
      cursor.values!.push(value);
    }
  }

  return {startAt: cursor};
}

function endAt(before: boolean, ...values: Array<string|api.IValue>):
    api.IStructuredQuery {
  const cursor: api.ICursor = {
    values: [],
  };

  if (before) {
    cursor.before = true;
  }

  for (const value of values) {
    if (typeof value === 'string') {
      cursor.values!.push({
        stringValue: value,
      });
    } else {
      cursor.values!.push(value);
    }
  }

  return {endAt: cursor};
}

function queryEquals(
    actual: api.IRunQueryRequest, ...protoComponents: api.IStructuredQuery[]) {
  const query: api.IRunQueryRequest = {
    parent: DATABASE_ROOT + '/documents',
    structuredQuery: {
      from: [
        {
          collectionId: 'collectionId',
        },
      ],
    },
  };

  for (const protoComponent of protoComponents) {
    extend(true, query.structuredQuery, protoComponent);
  }

  expect(actual).to.deep.eq(query);
}

export function result(documentId: string): api.IRunQueryResponse {
  return {document: document(documentId), readTime: {seconds: 5, nanos: 6}};
}

describe('query interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('has isEqual() method', () => {
    const query = firestore.collection('collectionId');

    const queryEquals = (equals: Query[], notEquals: Query[]) => {
      for (let i = 0; i < equals.length; ++i) {
        for (const equal of equals) {
          expect(equals[i].isEqual(equal)).to.be.true;
          expect(equal.isEqual(equals[i])).to.be.true;
        }

        for (const notEqual of notEquals) {
          expect(equals[i].isEqual(notEqual)).to.be.false;
          expect(notEqual.isEqual(equals[i])).to.be.false;
        }
      }
    };

    queryEquals(
        [query.where('a', '==', '1'), query.where('a', '==', '1')],
        [query.where('a', '=' as InvalidApiUsage, 1)]);

    queryEquals(
        [
          query.orderBy('__name__'),
          query.orderBy('__name__', 'asc'),
          query.orderBy('__name__', 'ASC' as InvalidApiUsage),
          query.orderBy(FieldPath.documentId()),
        ],
        [
          query.orderBy('foo'),
          query.orderBy(FieldPath.documentId(), 'desc'),
        ]);

    queryEquals(
        [query.limit(0), query.limit(0).limit(0)], [query, query.limit(10)]);

    queryEquals(
        [query.offset(0), query.offset(0).offset(0)],
        [query, query.offset(10)]);

    queryEquals(
        [query.orderBy('foo').startAt('a'), query.orderBy('foo').startAt('a')],
        [
          query.orderBy('foo').startAfter('a'),
          query.orderBy('foo').endAt('a'),
          query.orderBy('foo').endBefore('a'),
          query.orderBy('foo').startAt('b'),
          query.orderBy('bar').startAt('a'),
        ]);

    queryEquals(
        [
          query.orderBy('foo').startAfter('a'),
          query.orderBy('foo').startAfter('a'),
        ],
        [
          query.orderBy('foo').startAfter('b'),
          query.orderBy('bar').startAfter('a'),
        ]);

    queryEquals(
        [
          query.orderBy('foo').endBefore('a'),
          query.orderBy('foo').endBefore('a'),
        ],
        [
          query.orderBy('foo').endBefore('b'),
          query.orderBy('bar').endBefore('a')
        ]);

    queryEquals(
        [query.orderBy('foo').endAt('a'), query.orderBy('foo').endAt('a')],
        [query.orderBy('foo').endAt('b'), query.orderBy('bar').endAt('a')]);

    queryEquals(
        [
          query.orderBy('foo').orderBy('__name__').startAt('b', 'c'),
          query.orderBy('foo').startAt(
              firestore.snapshot_(document('c', 'foo', 'b'), {})),
        ],
        []);
  });

  it('accepts all variations', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, fieldFilters('foo', 'EQUAL', 'bar'),
            orderBy('foo', 'ASCENDING'), limit(10));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '==', 'bar');
      query = query.orderBy('foo');
      query = query.limit(10);
      return query.get().then(results => {
        expect(results.query).to.equal(query);
        expect(results.size).to.equal(0);
        expect(results.empty).to.be.true;
      });
    });
  });

  it('supports empty gets', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request);
        return stream({readTime: {seconds: 5, nanos: 6}});
      }
    };

    return createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId');
      return query.get().then(results => {
        expect(results.size).to.equal(0);
        expect(results.empty).to.be.true;
        expect(results.readTime.isEqual(new Timestamp(5, 6))).to.be.true;
      });
    });
  });

  it('retries on stream failure', () => {
    let attempts = 0;
    const overrides: ApiOverride = {
      runQuery: (request) => {
        ++attempts;
        throw new Error('Expected error');
      }
    };

    return createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId');
      return query.get()
          .then(() => {
            throw new Error('Unexpected success');
          })
          .catch(() => {
            expect(attempts).to.equal(5);
          });
    });
  });

  it('supports empty streams', (callback) => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request);
        return stream({readTime: {seconds: 5, nanos: 6}});
      }
    };

    createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId');
      query.stream()
          .on('data',
              () => {
                throw new Error('Unexpected document');
              })
          .on('end', () => {
            callback();
          });
    });
  });

  it('returns results', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request);
        return stream(result('first'), result('second'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId');
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

  it('handles stream exception at initialization', () => {
    const query = firestore.collection('collectionId');

    query._stream = () => {
      throw new Error('Expected error');
    };

    return query.get()
        .then(() => {
          throw new Error('Unexpected success in Promise');
        })
        .catch(err => {
          expect(err.message).to.equal('Expected error');
        });
  });

  it('handles stream exception during initialization', () => {
    const overrides: ApiOverride = {
      runQuery: () => {
        return stream(new Error('Expected error'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.collection('collectionId')
          .get()
          .then(() => {
            throw new Error('Unexpected success in Promise');
          })
          .catch(err => {
            expect(err.message).to.equal('Expected error');
          });
    });
  });

  it('handles stream exception after initialization', () => {
    const overrides: ApiOverride = {
      runQuery: () => {
        return stream(result('first'), new Error('Expected error'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.collection('collectionId')
          .get()
          .then(() => {
            throw new Error('Unexpected success in Promise');
          })
          .catch(err => {
            expect(err.message).to.equal('Expected error');
          });
    });
  });

  it('streams results', (callback) => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request);
        return stream(result('first'), result('second'));
      }
    };

    createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId');
      let received = 0;

      query.stream()
          .on('data',
              doc => {
                expect(doc).to.be.an.instanceOf(DocumentSnapshot);
                ++received;
              })
          .on('end', () => {
            expect(received).to.equal(2);
            callback();
          });
    });
  });

  it('throws if QuerySnapshot.docChanges() is used as a property', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request);
        return stream(result('first'), result('second'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId');
      return query.get().then(snapshot => {
        expect(() => {
          (snapshot.docChanges as InvalidApiUsage).forEach(() => {});
        })
            .to.throw(
                'QuerySnapshot.docChanges has been changed from a property into a method');

        expect(() => {
          for (const doc of (snapshot.docChanges as InvalidApiUsage)) {
          }
        })
            .to.throw(
                'QuerySnapshot.docChanges has been changed from a property into a method');
      });
    });
  });
});

describe('where() interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, fieldFilters('foo', 'EQUAL', 'bar'));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '==', 'bar');
      return query.get();
    });
  });

  it('concatenates all accepted filters', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request,
            fieldFilters(
                'fooSmaller', 'LESS_THAN', 'barSmaller', 'fooSmallerOrEquals',
                'LESS_THAN_OR_EQUAL', 'barSmallerOrEquals', 'fooEquals',
                'EQUAL', 'barEquals', 'fooEqualsLong', 'EQUAL', 'barEqualsLong',
                'fooGreaterOrEquals', 'GREATER_THAN_OR_EQUAL',
                'barGreaterOrEquals', 'fooGreater', 'GREATER_THAN',
                'barGreater', 'fooContains', 'ARRAY_CONTAINS', 'barContains'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('fooSmaller', '<', 'barSmaller');
      query = query.where('fooSmallerOrEquals', '<=', 'barSmallerOrEquals');
      query = query.where('fooEquals', '=' as InvalidApiUsage, 'barEquals');
      query = query.where('fooEqualsLong', '==', 'barEqualsLong');
      query = query.where('fooGreaterOrEquals', '>=', 'barGreaterOrEquals');
      query = query.where('fooGreater', '>', 'barGreater');
      query = query.where('fooContains', 'array-contains', 'barContains');
      return query.get();
    });
  });

  it('accepts object', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, fieldFilters('foo', 'EQUAL', {
                      mapValue: {
                        fields: {
                          foo: {stringValue: 'bar'},
                        },
                      }
                    }));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '==', {foo: 'bar'});
      return query.get();
    });
  });

  it('supports field path objects for field paths', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request,
            fieldFilters(
                'foo.bar', 'EQUAL', 'foobar', 'bar.foo', 'EQUAL', 'foobar'));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo.bar', '==', 'foobar');
      query = query.where(new FieldPath('bar', 'foo'), '==', 'foobar');
      return query.get();
    });
  });

  it('supports strings for FieldPath.documentId()', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, fieldFilters('__name__', 'EQUAL', {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/foo',
            }));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where(FieldPath.documentId(), '==', 'foo');
      return query.get();
    });
  });

  it('rejects custom objects for field paths', () => {
    expect(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where({} as InvalidApiUsage, '==', 'bar');
      return query.get();
    })
        .to.throw(
            'Argument "fieldPath" is not a valid field path. Paths can only be specified as strings or via a FieldPath object.');

    class FieldPath {}
    expect(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where(new FieldPath() as InvalidApiUsage, '==', 'bar');
      return query.get();
    })
        .to.throw(
            'Detected an object of type "FieldPath" that doesn\'t match the expected instance.');
  });

  it('rejects field paths as value', () => {
    expect(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '==', new FieldPath('bar'));
      return query.get();
    })
        .to.throw(
            'Argument "value" is not a valid query constraint. Cannot use object of type "FieldPath" as a Firestore value.');
  });

  it('rejects field delete as value', () => {
    expect(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '==', FieldValue.delete());
      return query.get();
    })
        .to.throw(
            'FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}.');
  });

  it('rejects custom classes as value', () => {
    class Foo {}
    class FieldPath {}
    class FieldValue {}
    class GeoPoint {}
    class DocumentReference {}

    const query = firestore.collection('collectionId');

    expect(() => {
      query.where('foo', '==', new Foo()).get();
    })
        .to.throw(
            'Argument "value" is not a valid Firestore document. Couldn\'t serialize object of type "Foo". Firestore doesn\'t support JavaScript objects with custom prototypes (i.e. objects that were created via the "new" operator).');

    expect(() => {
      query.where('foo', '==', new FieldPath()).get();
    })
        .to.throw(
            'Detected an object of type "FieldPath" that doesn\'t match the expected instance.');

    expect(() => {
      query.where('foo', '==', new FieldValue()).get();
    })
        .to.throw(
            'Detected an object of type "FieldValue" that doesn\'t match the expected instance.');

    expect(() => {
      query.where('foo', '==', new DocumentReference()).get();
    })
        .to.throw(
            'Detected an object of type "DocumentReference" that doesn\'t match the expected instance.');

    expect(() => {
      query.where('foo', '==', new GeoPoint()).get();
    })
        .to.throw(
            'Detected an object of type "GeoPoint" that doesn\'t match the expected instance.');
  });

  it('supports unary filters', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, unaryFilters('foo', 'IS_NAN', 'bar', 'IS_NULL'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '==', NaN);
      query = query.where('bar', '==', null);
      return query.get();
    });
  });

  it('rejects invalid NaN filter', () => {
    expect(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '>', NaN);
      return query.get();
    })
        .to.throw(
            'Invalid query. You can only perform equals comparisons on NaN.');
  });

  it('rejects invalid Null filter', () => {
    expect(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '>', null);
      return query.get();
    })
        .to.throw(
            'Invalid query. You can only perform equals comparisons on Null.');
  });

  it('verifies field path', () => {
    let query: Query = firestore.collection('collectionId');
    expect(() => {
      query = query.where('foo.', '==', 'foobar');
    })
        .to.throw(
            'Argument "fieldPath" is not a valid field path. Paths must not start or end with ".".');
  });

  it('verifies operator', () => {
    let query: Query = firestore.collection('collectionId');
    expect(() => {
      query = query.where('foo', '@' as InvalidApiUsage, 'foobar');
    })
        .to.throw(
            'Invalid value for argument "opStr". Acceptable values are: <, <=, ==, >, >=, array-contains');
  });
});

describe('orderBy() interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts empty string', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, orderBy('foo', 'ASCENDING'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo');
      return query.get();
    });
  });

  it('accepts asc', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, orderBy('foo', 'ASCENDING'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo', 'asc');
      return query.get();
    });
  });

  it('accepts desc', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, orderBy('foo', 'DESCENDING'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo', 'desc');
      return query.get();
    });
  });

  it('verifies order', () => {
    let query: Query = firestore.collection('collectionId');
    expect(() => {
      query = query.orderBy('foo', 'foo' as InvalidApiUsage);
    })
        .to.throw(
            'Invalid value for argument "directionStr". Acceptable values are: asc, desc');
  });

  it('accepts field path', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('foo.bar', 'ASCENDING', 'bar.foo', 'ASCENDING'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo.bar');
      query = query.orderBy(new FieldPath('bar', 'foo'));
      return query.get();
    });
  });

  it('verifies field path', () => {
    let query: Query = firestore.collection('collectionId');
    expect(() => {
      query = query.orderBy('foo.');
    })
        .to.throw(
            'Argument "fieldPath" is not a valid field path. Paths must not start or end with ".".');
  });

  it('rejects call after cursor', () => {
    let query: Query = firestore.collection('collectionId');

    return snapshot('collectionId/doc', {foo: 'bar'}).then(snapshot => {
      expect(() => {
        query = query.orderBy('foo').startAt('foo').orderBy('foo');
      })
          .to.throw(
              'Cannot specify an orderBy() constraint after calling startAt(), startAfter(), endBefore() or endAt().');

      expect(() => {
        query = query.where('foo', '>', 'bar')
                    .startAt(snapshot)
                    .where('foo', '>', 'bar');
      })
          .to.throw(
              'Cannot specify a where() filter after calling startAt(), startAfter(), endBefore() or endAt().');

      expect(() => {
        query = query.orderBy('foo').endAt('foo').orderBy('foo');
      })
          .to.throw(
              'Cannot specify an orderBy() constraint after calling startAt(), startAfter(), endBefore() or endAt().');

      expect(() => {
        query = query.where('foo', '>', 'bar')
                    .endAt(snapshot)
                    .where('foo', '>', 'bar');
      })
          .to.throw(
              'Cannot specify a where() filter after calling startAt(), startAfter(), endBefore() or endAt().');
    });
  });

  it('concatenates orders', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request,
            orderBy(
                'foo', 'ASCENDING', 'bar', 'DESCENDING', 'foobar',
                'ASCENDING'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query =
          query.orderBy('foo', 'asc').orderBy('bar', 'desc').orderBy('foobar');
      return query.get();
    });
  });
});

describe('limit() interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, limit(10));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.limit(10);
      return query.get();
    });
  });

  it('expects number', () => {
    const query = firestore.collection('collectionId');
    expect(() => query.limit(Infinity))
        .to.throw('Argument "limit" is not a valid integer.');
  });

  it('uses latest limit', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, limit(3));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.limit(1).limit(2).limit(3);
      return query.get();
    });
  });
});

describe('offset() interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, offset(10));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.offset(10);
      return query.get();
    });
  });

  it('expects number', () => {
    const query = firestore.collection('collectionId');
    expect(() => query.offset(Infinity))
        .to.throw('Argument "offset" is not a valid integer.');
  });

  it('uses latest offset', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, offset(3));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.offset(1).offset(2).offset(3);
      return query.get();
    });
  });
});

describe('select() interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, select('a', 'b.c'));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      const collection = firestore.collection('collectionId');
      const query = collection.select('a', new FieldPath('b', 'c'));

      return query.get().then(() => {
        return collection.select('a', 'b.c').get();
      });
    });
  });

  it('validates field path', () => {
    const query = firestore.collection('collectionId');
    expect(() => query.select(1 as InvalidApiUsage))
        .to.throw(
            'Argument at index 0 is not a valid field path. Paths can only be specified as strings or via a FieldPath object.');

    expect(() => query.select('.'))
        .to.throw(
            'Argument at index 0 is not a valid field path. Paths must not start or end with ".".');
  });

  it('uses latest field mask', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, select('bar'));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.select('foo').select('bar');
      return query.get();
    });
  });

  it('implicitly adds FieldPath.documentId()', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, select('__name__'));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.select();
      return query.get();
    });
  });
});

describe('startAt() interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
            startAt(true, 'foo', 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo').orderBy('bar').startAt('foo', 'bar');
      return query.get();
    });
  });

  it('accepts FieldPath.documentId()', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('__name__', 'ASCENDING'), startAt(true, {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {foo: 'bar'}).then(doc => {
        const query = firestore.collection('collectionId');

        return Promise.all([
          query.orderBy(FieldPath.documentId()).startAt(doc.id).get(),
          query.orderBy(FieldPath.documentId()).startAt(doc.ref).get(),
        ]);
      });
    });
  });

  it('validates value for FieldPath.documentId()', () => {
    const query = firestore.collection('coll/doc/coll');

    expect(() => {
      query.orderBy(FieldPath.documentId()).startAt(42);
    })
        .to.throw(
            'The corresponding value for FieldPath.documentId\(\) must be a string or a DocumentReference.');

    expect(() => {
      query.orderBy(FieldPath.documentId())
          .startAt(firestore.doc('coll/doc/other/doc'));
    })
        .to.throw(
            '"coll/doc/other/doc" is not part of the query result set and cannot be used as a query boundary.');

    expect(() => {
      query.orderBy(FieldPath.documentId())
          .startAt(firestore.doc('coll/doc/coll_suffix/doc'));
    })
        .to.throw(
            '"coll/doc/coll_suffix/doc" is not part of the query result set and cannot be used as a query boundary.');

    expect(() => {
      query.orderBy(FieldPath.documentId()).startAt(firestore.doc('coll/doc'));
    })
        .to.throw(
            '"coll/doc" is not part of the query result set and cannot be used as a query boundary.');

    expect(() => {
      query.orderBy(FieldPath.documentId())
          .startAt(firestore.doc('coll/doc/coll/doc/coll/doc'));
    })
        .to.throw(
            'Only a direct child can be used as a query boundary. Found: "coll/doc/coll/doc/coll/doc".');

    // Validate that we can't pass a reference to a collection.
    expect(() => {
      query.orderBy(FieldPath.documentId()).startAt('doc/coll');
    })
        .to.throw(
            'Only a direct child can be used as a query boundary. Found: "coll/doc/coll/doc/coll".');
  });

  it('requires at least one value', () => {
    const query = firestore.collection('coll/doc/coll');

    expect(() => {
      query.startAt();
    }).to.throw('Function "Query.startAt()" requires at least 1 argument.');
  });

  it('can specify document snapshot', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('__name__', 'ASCENDING'), startAt(true, {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {}).then(doc => {
        const query = firestore.collection('collectionId').startAt(doc);
        return query.get();
      });
    });
  });

  it('doesn\'t append documentId() twice', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('__name__', 'ASCENDING'), startAt(true, {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {}).then(doc => {
        const query = firestore.collection('collectionId')
                          .orderBy(FieldPath.documentId())
                          .startAt(doc);
        return query.get();
      });
    });
  });

  it('can extract implicit direction for document snapshot', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('foo', 'ASCENDING', '__name__', 'ASCENDING'),
            startAt(true, 'bar', {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {foo: 'bar'}).then(doc => {
        let query: Query = firestore.collection('collectionId').orderBy('foo');
        query = query.startAt(doc);
        return query.get();
      });
    });
  });

  it('can extract explicit direction for document snapshot', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('foo', 'DESCENDING', '__name__', 'DESCENDING'),
            startAt(true, 'bar', {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {foo: 'bar'}).then(doc => {
        let query: Query =
            firestore.collection('collectionId').orderBy('foo', 'desc');
        query = query.startAt(doc);
        return query.get();
      });
    });
  });

  it('can specify document snapshot with inequality filter', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('c', 'ASCENDING', '__name__', 'ASCENDING'),
            startAt(true, 'c', {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }),
            fieldFilters(
                'a', 'EQUAL', 'a', 'b', 'ARRAY_CONTAINS', 'b', 'c',
                'GREATER_THAN_OR_EQUAL', 'c', 'd', 'EQUAL', 'd'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {c: 'c'}).then(doc => {
        const query = firestore.collection('collectionId')
                          .where('a', '==', 'a')
                          .where('b', 'array-contains', 'b')
                          .where('c', '>=', 'c')
                          .where('d', '==', 'd')
                          .startAt(doc);
        return query.get();
      });
    });
  });

  it('ignores equality filter with document snapshot cursor', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('__name__', 'ASCENDING'), startAt(true, {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }),
            fieldFilters('foo', 'EQUAL', 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {foo: 'bar'}).then(doc => {
        const query = firestore.collection('collectionId')
                          .where('foo', '==', 'bar')
                          .startAt(doc);
        return query.get();
      });
    });
  });

  it('validates field exists in document snapshot', () => {
    const query = firestore.collection('collectionId').orderBy('foo', 'desc');

    return snapshot('collectionId/doc', {}).then(doc => {
      expect(() => query.startAt(doc))
          .to.throw(
              'Field "foo" is missing in the provided DocumentSnapshot. Please provide a document that contains values for all specified orderBy() and where() constraints.');
    });
  });

  it('does not accept field deletes', () => {
    const query = firestore.collection('collectionId').orderBy('foo');

    expect(() => {
      query.orderBy('foo').startAt('foo', FieldValue.delete());
    })
        .to.throw(
            'Argument at index 1 is not a valid query constraint. FieldValue.delete\(\) must appear at the top-level and can only be used in update() or set() with {merge:true}.');
  });

  it('requires order by', () => {
    let query: Query = firestore.collection('collectionId');
    query = query.orderBy('foo');

    expect(() => query.startAt('foo', 'bar'))
        .to.throw(
            'Too many cursor values specified. The specified values must match the orderBy() constraints of the query.');
  });

  it('can overspecify order by', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
            startAt(true, 'foo'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo').orderBy('bar').startAt('foo');
      return query.get();
    });
  });

  it('validates input', () => {
    const query = firestore.collection('collectionId');
    expect(() => query.startAt(123))
        .to.throw(
            'Too many cursor values specified. The specified values must match the orderBy() constraints of the query.');
  });

  it('uses latest value', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, orderBy('foo', 'ASCENDING'), startAt(true, 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo').startAt('foo').startAt('bar');
      return query.get();
    });
  });
});

describe('startAfter() interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
            startAt(false, 'foo', 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo').orderBy('bar').startAfter('foo', 'bar');
      return query.get();
    });
  });

  it('validates input', () => {
    const query = firestore.collection('collectionId');
    expect(() => query.startAfter(123))
        .to.throw(
            'Too many cursor values specified. The specified values must match the orderBy() constraints of the query.');
  });

  it('uses latest value', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('foo', 'ASCENDING'), startAt(false, 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo').startAfter('foo').startAfter('bar');
      return query.get();
    });
  });
});

describe('endAt() interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
            endAt(false, 'foo', 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo').orderBy('bar').endAt('foo', 'bar');
      return query.get();
    });
  });

  it('validates input', () => {
    const query = firestore.collection('collectionId');
    expect(() => query.endAt(123))
        .to.throw(
            'Too many cursor values specified. The specified values must match the orderBy() constraints of the query.');
  });

  it('uses latest value', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, orderBy('foo', 'ASCENDING'), endAt(false, 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo').endAt('foo').endAt('bar');
      return query.get();
    });
  });
});

describe('endBefore() interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(
            request, orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
            endAt(true, 'foo', 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo').orderBy('bar').endBefore('foo', 'bar');
      return query.get();
    });
  });

  it('validates input', () => {
    const query = firestore.collection('collectionId');
    expect(() => query.endBefore(123))
        .to.throw(
            'Too many cursor values specified. The specified values must match the orderBy() constraints of the query.');
  });

  it('uses latest value', () => {
    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, orderBy('foo', 'ASCENDING'), endAt(true, 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo').endBefore('foo').endBefore('bar');
      return query.get();
    });
  });

  it('is immutable', () => {
    let expectedComponents = [limit(10)];

    const overrides: ApiOverride = {
      runQuery: (request) => {
        queryEquals(request, ...expectedComponents);
        return stream();
      }
    };
    return createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId').limit(10);
      const adjustedQuery = query.orderBy('foo').endBefore('foo');

      return query.get().then(() => {
        expectedComponents =
            [limit(10), orderBy('foo', 'ASCENDING'), endAt(true, 'foo')];

        return adjustedQuery.get();
      });
    });
  });
});
