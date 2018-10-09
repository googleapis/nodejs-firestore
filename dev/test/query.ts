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
import extend from 'extend';
import is from 'is';
import assert from 'power-assert';
import through2 from 'through2';

import {google} from '../protos/firestore_proto_api';
import * as Firestore from '../src';
import {Query, Timestamp} from '../src';
import {DocumentSnapshot} from '../src/document';
import {ResourcePath} from '../src/path';
import {DocumentReference} from '../src/reference';
import {AnyDuringMigration} from '../src/types';
import {createInstance, InvalidApiUsage} from '../test/util/helpers';

import api = google.firestore.v1beta1;

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;


// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

function snapshot(relativePath, data) {
  return createInstance().then(firestore => {
    const snapshot = new DocumentSnapshot.Builder();
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

function fieldFilters(fieldPath, op, value, ...fieldPathOpAndValues) {
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

    if (is.object(value)) {
      filter.value = value;
    } else {
      filter.value = {stringValue: value};
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
          op: api.StructuredQuery.CompositeFilter.Operator.AND,
          filters,
        },
      },
    };
  }
}

function unaryFilters(fieldPath, equals, ...fieldPathsAndEquals) {
  const filters: api.StructuredQuery.IFilter[] = [];

  for (let i = 0; i < arguments.length; i += 2) {
    fieldPath = arguments[i];
    equals = arguments[i + 1];

    filters.push({
      unaryFilter: {
        field: {
          fieldPath,
        },
        op: equals,
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
          op: api.StructuredQuery.CompositeFilter.Operator.AND,
          filters,
        },
      },
    };
  }
}

function orderBy(fieldPath, direction, ...fieldPathAndOrderBys) {
  const orderBy: AnyDuringMigration[] = [];

  for (let i = 0; i < arguments.length; i += 2) {
    fieldPath = arguments[i];
    direction = arguments[i + 1];
    orderBy.push({
      field: {
        fieldPath,
      },
      direction,
    });
  }

  return {orderBy};
}

function limit(n) {
  return {
    limit: {
      value: n,
    },
  };
}

function offset(n) {
  return {
    offset: n,
  };
}

function select(...fields) {
  const select = {
    fields: [] as AnyDuringMigration[],
  };

  for (const field of fields) {
    select.fields.push({fieldPath: field});
  }

  return {select};
}

function startAt(before, ...values) {
  const cursor: AnyDuringMigration = {
    startAt: {
      values: [],
    },
  };

  if (before) {
    cursor.startAt.before = true;
  }

  for (const value of values) {
    if (is.string(value)) {
      cursor.startAt.values.push({
        stringValue: value,
      });
    } else {
      cursor.startAt.values.push(value);
    }
  }

  return cursor;
}

function endAt(before, ...values) {
  const cursor: AnyDuringMigration = {
    endAt: {
      values: [],
    },
  };

  if (before) {
    cursor.endAt.before = true;
  }

  for (const value of values) {
    if (is.string(value)) {
      cursor.endAt.values.push({
        stringValue: value,
      });
    } else {
      cursor.endAt.values.push(value);
    }
  }

  return cursor;
}

function buildQuery(...protoComponents) {
  const query = {
    parent: DATABASE_ROOT,
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

  return query;
}

function requestEquals(actual, ...protoComponents) {
  assert.deepStrictEqual(actual, buildQuery.apply(null, protoComponents));
}

function document(name) {
  const document: api.IDocument = {
    fields: {},
    createTime: {seconds: 1, nanos: 2},
    updateTime: {seconds: 3, nanos: 4},
  };

  document.fields![name] = {stringValue: name};

  document.name = `${DATABASE_ROOT}/documents/collectionId/${name}`;

  return {document, readTime: {seconds: 5, nanos: 6}};
}

function stream(...elements) {
  const stream = through2.obj();
  const args = arguments;

  setImmediate(() => {
    for (const arg of args) {
      if (is.instance(arg, Error)) {
        stream.destroy(arg);
        return;
      }
      stream.push(arg);
    }
    stream.push(null);
  });

  return stream;
}

describe('query interface', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('has isEqual() method', () => {
    const query = firestore.collection('collectionId');

    const queryEquals = (equals, notEquals) => {
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
        [query.where('a', '=', '1'), query.where('a', '=', '1')],
        [query.where('a', '=', 1)]);

    queryEquals(
        [
          query.orderBy('__name__'),
          query.orderBy('__name__', 'asc'),
          query.orderBy('__name__', 'ASC'),
          query.orderBy(Firestore.FieldPath.documentId()),
        ],
        [
          query.orderBy('foo'),
          query.orderBy(Firestore.FieldPath.documentId(), 'desc'),
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
          query.orderBy('foo').orderBy('__name__').startAt('foo', 'foo'),
          query.orderBy('foo').startAt(
              firestore.snapshot_(document('foo').document, {})),
        ],
        []);
  });

  it('accepts all variations', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            fieldFilters(
                'foo', api.StructuredQuery.FieldFilter.Operator.EQUAL, 'bar'),
            orderBy('foo', api.StructuredQuery.Direction.ASCENDING), limit(10));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '=', 'bar');
      query = query.orderBy('foo');
      query = query.limit(10);
      return query.get().then(results => {
        assert.equal(query, results.query);
        assert.equal(0, results.size);
        assert.equal(true, results.empty);
      });
    });
  });

  it('supports empty gets', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request);
        return stream({readTime: {seconds: 5, nanos: 6}});
      }
    };

    return createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId');
      return query.get().then(results => {
        assert.equal(0, results.size);
        assert.equal(true, results.empty);
        expect(results.readTime.isEqual(new Firestore.Timestamp(5, 6)))
            .to.be.true;
      });
    });
  });

  it('retries on stream failure', () => {
    let attempts = 0;
    const overrides = {
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
            assert.equal(5, attempts);
          });
    });
  });

  it('supports empty streams', (callback) => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request);
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
    const overrides = {
      runQuery: (request) => {
        requestEquals(request);
        return stream(document('first'), document('second'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId');
      return query.get().then(results => {
        assert.equal(2, results.size);
        assert.equal(false, results.empty);
        expect(results.readTime.isEqual(new Firestore.Timestamp(5, 6)))
            .to.be.true;
        assert.equal('first', results.docs[0].get('first'));
        assert.equal('second', results.docs[1].get('second'));
        assert.equal(2, results.docChanges().length);

        let count = 0;

        results.forEach(doc => {
          expect(is.instanceof(doc, DocumentSnapshot)).to.be.true;
          expect(doc.createTime.isEqual(new Firestore.Timestamp(1, 2)))
              .to.be.true;
          expect(doc.updateTime.isEqual(new Firestore.Timestamp(3, 4)))
              .to.be.true;
          expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6)))
              .to.be.true;
          ++count;
        });

        assert.equal(2, count);
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
          assert.equal(err.message, 'Expected error');
        });
  });

  it('handles stream exception during initialization', () => {
    const overrides = {
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
            assert.equal(err.message, 'Expected error');
          });
    });
  });

  it('handles stream exception after initialization', () => {
    const overrides = {
      runQuery: () => {
        return stream(document('first'), new Error('Expected error'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.collection('collectionId')
          .get()
          .then(() => {
            throw new Error('Unexpected success in Promise');
          })
          .catch(err => {
            assert.equal(err.message, 'Expected error');
          });
    });
  });

  it('streams results', (callback) => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request);
        return stream(document('first'), document('second'));
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
            assert.equal(received, 2);
            callback();
          });
    });
  });

  it('throws if QuerySnapshot.docChanges() is used as a property', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request);
        return stream(document('first'), document('second'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId');
      return query.get().then((snapshot: AnyDuringMigration) => {
        assert.throws(() => {
          snapshot.docChanges.forEach(() => {});
        }, /QuerySnapshot.docChanges has been changed from a property into a method/);

        assert.throws(() => {
          for (const doc of snapshot.docChanges) {
          }
        }, /QuerySnapshot.docChanges has been changed from a property into a method/);
      });
    });
  });
});

describe('where() interface', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            fieldFilters(
                'foo', api.StructuredQuery.FieldFilter.Operator.EQUAL, 'bar'));
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
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            fieldFilters(
                'fooSmaller',
                api.StructuredQuery.FieldFilter.Operator.LESS_THAN,
                'barSmaller', 'fooSmallerOrEquals',
                api.StructuredQuery.FieldFilter.Operator.LESS_THAN_OR_EQUAL,
                'barSmallerOrEquals', 'fooEquals',
                api.StructuredQuery.FieldFilter.Operator.EQUAL, 'barEquals',
                'fooEqualsLong', api.StructuredQuery.FieldFilter.Operator.EQUAL,
                'barEqualsLong', 'fooGreaterOrEquals',
                api.StructuredQuery.FieldFilter.Operator.GREATER_THAN_OR_EQUAL,
                'barGreaterOrEquals', 'fooGreater',
                api.StructuredQuery.FieldFilter.Operator.GREATER_THAN,
                'barGreater', 'fooContains',
                api.StructuredQuery.FieldFilter.Operator.ARRAY_CONTAINS,
                'barContains'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('fooSmaller', '<', 'barSmaller');
      query = query.where('fooSmallerOrEquals', '<=', 'barSmallerOrEquals');
      query = query.where('fooEquals', '=', 'barEquals');
      query = query.where('fooEqualsLong', '==', 'barEqualsLong');
      query = query.where('fooGreaterOrEquals', '>=', 'barGreaterOrEquals');
      query = query.where('fooGreater', '>', 'barGreater');
      query = query.where('fooContains', 'array-contains', 'barContains');
      return query.get();
    });
  });

  it('accepts object', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            fieldFilters(
                'foo', api.StructuredQuery.FieldFilter.Operator.EQUAL, {
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
      query = query.where('foo', '=', {foo: 'bar'});
      return query.get();
    });
  });

  it('supports field path objects for field paths', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            fieldFilters(
                'foo.bar', api.StructuredQuery.FieldFilter.Operator.EQUAL,
                'foobar', 'bar.foo',
                api.StructuredQuery.FieldFilter.Operator.EQUAL, 'foobar'));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo.bar', '=', 'foobar');
      query = query.where(new Firestore.FieldPath('bar', 'foo'), '=', 'foobar');
      return query.get();
    });
  });

  it('supports strings for FieldPath.documentId()', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            fieldFilters(
                '__name__', api.StructuredQuery.FieldFilter.Operator.EQUAL, {
                  referenceValue:
                      `projects/${PROJECT_ID}/databases/(default)/` +
                      'documents/collectionId/foo',
                }));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where(Firestore.FieldPath.documentId(), '==', 'foo');
      return query.get();
    });
  });

  it('rejects custom objects for field paths', () => {
    assert.throws(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where({} as InvalidApiUsage, '=', 'bar');
      return query.get();
    }, /Argument "fieldPath" is not a valid FieldPath. Invalid use of type "object" as a Firestore argument/);

    class FieldPath {}
    assert.throws(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where(new FieldPath() as InvalidApiUsage, '=', 'bar');
      return query.get();
    }, /Detected an object of type "FieldPath" that doesn't match the expected instance./);
  });

  it('rejects field paths as value', () => {
    assert.throws(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '=', new Firestore.FieldPath('bar'));
      return query.get();
    }, /Argument "value" is not a valid QueryValue. Cannot use object of type "FieldPath" as a Firestore value./);
  });

  it('rejects field delete as value', () => {
    assert.throws(() => {
      let query = firestore.collection('collectionId');
      query = query.where('foo', '=', Firestore.FieldValue.delete());
      return query.get();
    }, /FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);
  });

  it('rejects custom classes as value', () => {
    class Foo {}
    class FieldPath {}
    class FieldValue {}
    class GeoPoint {}
    class DocumentReference {}

    const query = firestore.collection('collectionId');

    assert.throws(() => {
      query.where('foo', '=', new Foo()).get();
    }, /Argument "value" is not a valid QueryValue. Couldn't serialize object of type "Foo". Firestore doesn't support JavaScript objects with custom prototypes \(i.e. objects that were created via the 'new' operator\)./);

    assert.throws(() => {
      query.where('foo', '=', new FieldPath()).get();
    }, /Detected an object of type "FieldPath" that doesn't match the expected instance./);

    assert.throws(() => {
      query.where('foo', '=', new FieldValue()).get();
    }, /Detected an object of type "FieldValue" that doesn't match the expected instance./);

    assert.throws(() => {
      query.where('foo', '=', new DocumentReference()).get();
    }, /Detected an object of type "DocumentReference" that doesn't match the expected instance./);

    assert.throws(() => {
      query.where('foo', '=', new GeoPoint()).get();
    }, /Detected an object of type "GeoPoint" that doesn't match the expected instance./);
  });

  it('supports unary filters', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            unaryFilters(
                'foo', api.StructuredQuery.UnaryFilter.Operator.IS_NAN, 'bar',
                api.StructuredQuery.UnaryFilter.Operator.IS_NULL));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '==', NaN);
      query = query.where('bar', '=', null);
      return query.get();
    });
  });

  it('rejects invalid NaN filter', () => {
    assert.throws(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '>', NaN);
      return query.get();
    }, /Invalid query. You can only perform equals comparisons on NaN\./);
  });

  it('rejects invalid Null filter', () => {
    assert.throws(() => {
      let query: Query = firestore.collection('collectionId');
      query = query.where('foo', '>', null);
      return query.get();
    }, /Invalid query. You can only perform equals comparisons on Null\./);
  });

  it('verifies field path', () => {
    let query: Query = firestore.collection('collectionId');
    assert.throws(() => {
      query = query.where('foo.', '=', 'foobar');
    }, /Argument "fieldPath" is not a valid FieldPath. Paths must not start or end with '.'./);
  });

  it('verifies operator', () => {
    let query = firestore.collection('collectionId');
    assert.throws(() => {
      query = query.where('foo', '@', 'foobar');
    }, /Operator must be one of "<", "<=", "==", ">", or ">="\./);
  });
});

describe('orderBy() interface', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts empty string', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request, orderBy('foo', api.StructuredQuery.Direction.ASCENDING));
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
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request, orderBy('foo', api.StructuredQuery.Direction.ASCENDING));
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
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request, orderBy('foo', api.StructuredQuery.Direction.DESCENDING));
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
    assert.throws(() => {
      query = query.orderBy('foo', 'foo');
    }, /Order must be one of "asc" or "desc"\./);
  });

  it('accepts field path', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'foo.bar', api.StructuredQuery.Direction.ASCENDING, 'bar.foo',
                api.StructuredQuery.Direction.ASCENDING));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      let query: Query = firestore.collection('collectionId');
      query = query.orderBy('foo.bar');
      query = query.orderBy(new Firestore.FieldPath('bar', 'foo'));
      return query.get();
    });
  });

  it('verifies field path', () => {
    let query: Query = firestore.collection('collectionId');
    assert.throws(() => {
      query = query.orderBy('foo.');
    }, /Argument "fieldPath" is not a valid FieldPath. Paths must not start or end with '.'./);
  });

  it('rejects call after cursor', () => {
    let query: Query = firestore.collection('collectionId');

    return snapshot('collectionId/doc', {foo: 'bar'}).then(snapshot => {
      assert.throws(() => {
        query = query.orderBy('foo').startAt('foo').orderBy('foo');
      }, /Cannot specify an orderBy\(\) constraint after calling startAt\(\), startAfter\(\), endBefore\(\) or endAt\(\)./);

      assert.throws(() => {
        query = query.where('foo', '>', 'bar')
                    .startAt(snapshot)
                    .where('foo', '>', 'bar');
      }, /Cannot specify a where\(\) filter after calling startAt\(\), startAfter\(\), endBefore\(\) or endAt\(\)./);

      assert.throws(() => {
        query = query.orderBy('foo').endAt('foo').orderBy('foo');
      }, /Cannot specify an orderBy\(\) constraint after calling startAt\(\), startAfter\(\), endBefore\(\) or endAt\(\)./);

      assert.throws(() => {
        query = query.where('foo', '>', 'bar')
                    .endAt(snapshot)
                    .where('foo', '>', 'bar');
      }, /Cannot specify a where\(\) filter after calling startAt\(\), startAfter\(\), endBefore\(\) or endAt\(\)./);
    });
  });

  it('concatenates orders', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'foo', api.StructuredQuery.Direction.ASCENDING, 'bar',
                api.StructuredQuery.Direction.DESCENDING, 'foobar',
                api.StructuredQuery.Direction.ASCENDING));

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
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request, limit(10));
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
    assert.throws(() => {
      query.limit(Infinity);
    }, /Argument "limit" is not a valid integer./);
  });

  it('uses latest limit', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request, limit(3));
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
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request, offset(10));
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
    assert.throws(() => {
      query.offset(Infinity);
    }, /Argument "offset" is not a valid integer\./);
  });

  it('uses latest offset', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request, offset(3));
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
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request, select('a', 'b.c'));
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      const collection = firestore.collection('collectionId');
      const query = collection.select('a', new Firestore.FieldPath('b', 'c'));

      return query.get().then(() => {
        return collection.select('a', 'b.c').get();
      });
    });
  });

  it('validates field path', () => {
    const query = firestore.collection('collectionId');
    assert.throws(
        () => query.select(1),
        /Argument at index 0 is not a valid FieldPath. Invalid use of type "number" as a Firestore argument./);

    assert.throws(
        () => query.select('.'),
        /Argument at index 0 is not a valid FieldPath. Paths must not start or end with '.'./);
  });

  it('uses latest field mask', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(request, select('bar'));
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
    const overrides = {
      runQuery: (request) => {
        requestEquals(request, select('__name__'));
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
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'foo', api.StructuredQuery.Direction.ASCENDING, 'bar',
                api.StructuredQuery.Direction.ASCENDING),
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
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy('__name__', api.StructuredQuery.Direction.ASCENDING),
            startAt(true, {
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
          query.orderBy(Firestore.FieldPath.documentId()).startAt(doc.id).get(),
          query.orderBy(Firestore.FieldPath.documentId())
              .startAt(doc.ref)
              .get(),
        ]);
      });
    });
  });

  it('validates value for FieldPath.documentId()', () => {
    const query = firestore.collection('coll/doc/coll');

    assert.throws(() => {
      query.orderBy(Firestore.FieldPath.documentId()).startAt(42);
    }, /The corresponding value for FieldPath.documentId\(\) must be a string or a DocumentReference./);

    assert.throws(() => {
      query.orderBy(Firestore.FieldPath.documentId())
          .startAt(firestore.doc('coll/doc/other/doc'));
    }, /'coll\/doc\/other\/doc' is not part of the query result set and cannot be used as a query boundary./);

    assert.throws(() => {
      query.orderBy(Firestore.FieldPath.documentId())
          .startAt(firestore.doc('coll/doc/coll_suffix/doc'));
    }, /'coll\/doc\/coll_suffix\/doc' is not part of the query result set and cannot be used as a query boundary./);

    assert.throws(() => {
      query.orderBy(Firestore.FieldPath.documentId())
          .startAt(firestore.doc('coll/doc'));
    }, /'coll\/doc' is not part of the query result set and cannot be used as a query boundary./);

    assert.throws(() => {
      query.orderBy(Firestore.FieldPath.documentId())
          .startAt(firestore.doc('coll/doc/coll/doc/coll/doc'));
    }, /Only a direct child can be used as a query boundary. Found: 'coll\/doc\/coll\/doc\/coll\/doc'./);

    // Validate that we can't pass a reference to a collection.
    assert.throws(() => {
      query.orderBy(Firestore.FieldPath.documentId()).startAt('doc/coll');
    }, /Only a direct child can be used as a query boundary. Found: 'coll\/doc\/coll\/doc\/coll'./);
  });

  it('can specify document snapshot', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy('__name__', api.StructuredQuery.Direction.ASCENDING),
            startAt(true, {
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
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy('__name__', api.StructuredQuery.Direction.ASCENDING),
            startAt(true, {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {}).then(doc => {
        const query = firestore.collection('collectionId')
                          .orderBy(Firestore.FieldPath.documentId())
                          .startAt(doc);
        return query.get();
      });
    });
  });

  it('can extract implicit direction for document snapshot', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'foo', api.StructuredQuery.Direction.ASCENDING, '__name__',
                api.StructuredQuery.Direction.ASCENDING),
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
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'foo', api.StructuredQuery.Direction.DESCENDING, '__name__',
                api.StructuredQuery.Direction.DESCENDING),
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
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'c', api.StructuredQuery.Direction.ASCENDING, '__name__',
                api.StructuredQuery.Direction.ASCENDING),
            startAt(true, 'c', {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }),
            fieldFilters(
                'a', api.StructuredQuery.FieldFilter.Operator.EQUAL, 'a', 'b',
                api.StructuredQuery.FieldFilter.Operator.ARRAY_CONTAINS, 'b',
                'c',
                api.StructuredQuery.FieldFilter.Operator.GREATER_THAN_OR_EQUAL,
                'c', 'd', api.StructuredQuery.FieldFilter.Operator.EQUAL, 'd'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {c: 'c'}).then(doc => {
        const query = firestore.collection('collectionId')
                          .where('a', '=', 'a')
                          .where('b', 'array-contains', 'b')
                          .where('c', '>=', 'c')
                          .where('d', '=', 'd')
                          .startAt(doc);
        return query.get();
      });
    });
  });

  it('ignores equality filter with document snapshot cursor', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy('__name__', api.StructuredQuery.Direction.ASCENDING),
            startAt(true, {
              referenceValue: `projects/${PROJECT_ID}/databases/(default)/` +
                  'documents/collectionId/doc',
            }),
            fieldFilters(
                'foo', api.StructuredQuery.FieldFilter.Operator.EQUAL, 'bar'));

        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return snapshot('collectionId/doc', {foo: 'bar'}).then(doc => {
        const query = firestore.collection('collectionId')
                          .where('foo', '=', 'bar')
                          .startAt(doc);
        return query.get();
      });
    });
  });

  it('validates field exists in document snapshot', () => {
    const query = firestore.collection('collectionId').orderBy('foo', 'desc');

    return snapshot('collectionId/doc', {}).then(doc => {
      assert.throws(() => {
        query.startAt(doc);
      }, /Field 'foo' is missing in the provided DocumentSnapshot. Please provide a document that contains values for all specified orderBy\(\) and where\(\) constraints./);
    });
  });

  it('does not accept field deletes', () => {
    const query = firestore.collection('collectionId').orderBy('foo');

    assert.throws(() => {
      query.orderBy('foo').startAt('foo', Firestore.FieldValue.delete());
    }, /Argument at index 1 is not a valid QueryValue. FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);
  });

  it('requires order by', () => {
    let query: Query = firestore.collection('collectionId');
    query = query.orderBy('foo');

    assert.throws(() => {
      query.startAt('foo', 'bar');
    }, /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('can overspecify order by', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'foo', api.StructuredQuery.Direction.ASCENDING, 'bar',
                api.StructuredQuery.Direction.ASCENDING),
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
    assert.throws(
        () => query.startAt(123),
        /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('uses latest value', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request, orderBy('foo', api.StructuredQuery.Direction.ASCENDING),
            startAt(true, 'bar'));

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
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'foo', api.StructuredQuery.Direction.ASCENDING, 'bar',
                api.StructuredQuery.Direction.ASCENDING),
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
    assert.throws(
        () => query.startAfter(123),
        /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('uses latest value', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request, orderBy('foo', api.StructuredQuery.Direction.ASCENDING),
            startAt(false, 'bar'));

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
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'foo', api.StructuredQuery.Direction.ASCENDING, 'bar',
                api.StructuredQuery.Direction.ASCENDING),
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
    assert.throws(
        () => query.endAt(123),
        /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('uses latest value', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request, orderBy('foo', api.StructuredQuery.Direction.ASCENDING),
            endAt(false, 'bar'));

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
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request,
            orderBy(
                'foo', api.StructuredQuery.Direction.ASCENDING, 'bar',
                api.StructuredQuery.Direction.ASCENDING),
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
    assert.throws(
        () => query.endBefore(123),
        /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('uses latest value', () => {
    const overrides = {
      runQuery: (request) => {
        requestEquals(
            request, orderBy('foo', api.StructuredQuery.Direction.ASCENDING),
            endAt(true, 'bar'));

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
    let expectedResult = buildQuery(limit(10));

    const overrides = {
      runQuery: (request) => {
        assert.deepStrictEqual(request, expectedResult);
        return stream();
      }
    };
    return createInstance(overrides).then(firestore => {
      const query = firestore.collection('collectionId').limit(10);
      const adjustedQuery = query.orderBy('foo').endBefore('foo');

      return query.get().then(() => {
        expectedResult = buildQuery(
            limit(10), orderBy('foo', api.StructuredQuery.Direction.ASCENDING),
            endAt(true, 'foo'));
        return adjustedQuery.get();
      });
    });
  });
});
