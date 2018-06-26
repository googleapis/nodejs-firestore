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

'use strict';

const assert = require('power-assert');
const extend = require('extend');
const gax = require('google-gax');
const grpc = new gax.GrpcClient().grpc;
const is = require('is');
const through = require('through2');

const Firestore = require('../');
const reference = require('../src/reference')(Firestore);
const DocumentReference = reference.DocumentReference;
const DocumentSnapshot = require('../src/document')(DocumentReference)
  .DocumentSnapshot;
const ResourcePath = require('../src/path').ResourcePath;

let PROJECT_ID = process.env.PROJECT_ID;
if (!PROJECT_ID) {
  PROJECT_ID = 'test-project';
}

const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

function createInstance() {
  let firestore = new Firestore({
    projectId: PROJECT_ID,
    sslCreds: grpc.credentials.createInsecure(),
    timestampsInSnapshots: true,
  });

  return firestore._ensureClient().then(() => firestore);
}

function snapshot(relativePath, data) {
  const snapshot = new DocumentSnapshot.Builder();
  let path = ResourcePath.fromSlashSeparatedString(
    `${DATABASE_ROOT}/documents/${relativePath}`
  );
  snapshot.ref = new DocumentReference({}, path);
  snapshot.fieldsProto = DocumentSnapshot.encodeFields(data);
  snapshot.readTime = '1970-01-01T00:00:00.000000000Z';
  snapshot.createTime = '1970-01-01T00:00:00.000000000Z';
  snapshot.updateTime = '1970-01-01T00:00:00.000000000Z';
  return snapshot.build();
}

function fieldFilters(fieldPath, op, value) {
  let filters = [];

  for (let i = 0; i < arguments.length; i += 3) {
    fieldPath = arguments[i];
    op = arguments[i + 1];
    value = arguments[i + 2];

    let filter = {
      field: {
        fieldPath: fieldPath,
      },
      op: op,
    };

    if (is.object(value)) {
      filter.value = value;
    } else {
      filter.value = {
        stringValue: value,
        valueType: 'stringValue',
      };
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
          filters: filters,
        },
      },
    };
  }
}

function unaryFilters(fieldPath, equals) {
  let filters = [];

  for (let i = 0; i < arguments.length; i += 2) {
    fieldPath = arguments[i];
    equals = arguments[i + 1];

    filters.push({
      unaryFilter: {
        field: {
          fieldPath: fieldPath,
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
          op: 'AND',
          filters: filters,
        },
      },
    };
  }
}

function orderBy(fieldPath, direction) {
  let orderBy = [];

  for (let i = 0; i < arguments.length; i += 2) {
    fieldPath = arguments[i];
    direction = arguments[i + 1];
    orderBy.push({
      field: {
        fieldPath: fieldPath,
      },
      direction: direction,
    });
  }

  return {orderBy: orderBy};
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

function select(field) {
  let select = {
    fields: [],
  };

  for (field of arguments) {
    select.fields.push({fieldPath: field});
  }

  return {select: select};
}

function startAt(before, value) {
  let cursor = {
    startAt: {
      values: [],
    },
  };

  if (before) {
    cursor.startAt.before = true;
  }

  let values = [].slice.call(arguments, 1);

  for (value of values) {
    if (is.string(value)) {
      cursor.startAt.values.push({
        stringValue: value,
        valueType: 'stringValue',
      });
    } else {
      cursor.startAt.values.push(value);
    }
  }

  return cursor;
}

function endAt(before, value) {
  let cursor = {
    endAt: {
      values: [],
    },
  };

  if (before) {
    cursor.endAt.before = true;
  }

  let values = [].slice.call(arguments, 1);

  for (value of values) {
    if (is.string(value)) {
      cursor.endAt.values.push({
        stringValue: value,
        valueType: 'stringValue',
      });
    } else {
      cursor.endAt.values.push(value);
    }
  }

  return cursor;
}

function buildQuery(protoComponent) {
  let query = {
    parent: DATABASE_ROOT,
    structuredQuery: {
      from: [
        {
          collectionId: 'collectionId',
        },
      ],
    },
  };

  for (protoComponent of arguments) {
    extend(true, query.structuredQuery, protoComponent);
  }

  return query;
}

function requestEquals(actual, protoComponents) {
  protoComponents = Array.prototype.slice.call(arguments, 1);
  assert.deepEqual(actual, buildQuery.apply(null, protoComponents));
}

function document(name) {
  let document = {
    fields: {},
    createTime: {seconds: 1, nanos: 2},
    updateTime: {seconds: 3, nanos: 4},
  };

  document.fields[name] = {
    stringValue: name,
    valueType: 'stringValue',
  };

  document.name = `${DATABASE_ROOT}/documents/collectionId/${name}`;

  return {document: document, readTime: {seconds: 5, nanos: 6}};
}

function stream() {
  let stream = through.obj();
  let args = arguments;

  setImmediate(function() {
    for (let arg of args) {
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

describe('query interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('has limit() method', function() {
    let query = firestore.collection('collectionId');
    assert.ok(query.limit);
  });

  it('has orderBy() method', function() {
    let query = firestore.collection('collectionId');
    assert.ok(query.orderBy);
  });

  it('has where() method', function() {
    let query = firestore.collection('collectionId');
    assert.ok(query.where);
  });

  it('has stream() method', function() {
    let query = firestore.collection('collectionId');
    assert.ok(query.stream);
  });

  it('has get() method', function() {
    let query = firestore.collection('collectionId');
    assert.ok(query.get);
  });

  it('has isEqual() method', function() {
    const query = firestore.collection('collectionId');

    const queryEquals = (equals, notEquals) => {
      for (let i = 0; i < equals.length; ++i) {
        for (const equal of equals) {
          assert.ok(equals[i].isEqual(equal));
          assert.ok(equal.isEqual(equals[i]));
        }

        for (const notEqual of notEquals) {
          assert.ok(!equals[i].isEqual(notEqual));
          assert.ok(!notEqual.isEqual(equals[i]));
        }
      }
    };

    queryEquals(
      [query.where('a', '=', '1'), query.where('a', '=', '1')],
      [query.where('a', '=', 1)]
    );

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
      ]
    );

    queryEquals(
      [query.limit(0), query.limit(0).limit(0)],
      [query, query.limit(10)]
    );

    queryEquals(
      [query.offset(0), query.offset(0).offset(0)],
      [query, query.offset(10)]
    );

    queryEquals(
      [query.orderBy('foo').startAt('a'), query.orderBy('foo').startAt('a')],
      [
        query.orderBy('foo').startAfter('a'),
        query.orderBy('foo').endAt('a'),
        query.orderBy('foo').endBefore('a'),
        query.orderBy('foo').startAt('b'),
        query.orderBy('bar').startAt('a'),
      ]
    );

    queryEquals(
      [
        query.orderBy('foo').startAfter('a'),
        query.orderBy('foo').startAfter('a'),
      ],
      [
        query.orderBy('foo').startAfter('b'),
        query.orderBy('bar').startAfter('a'),
      ]
    );

    queryEquals(
      [
        query.orderBy('foo').endBefore('a'),
        query.orderBy('foo').endBefore('a'),
      ],
      [query.orderBy('foo').endBefore('b'), query.orderBy('bar').endBefore('a')]
    );

    queryEquals(
      [query.orderBy('foo').endAt('a'), query.orderBy('foo').endAt('a')],
      [query.orderBy('foo').endAt('b'), query.orderBy('bar').endAt('a')]
    );

    queryEquals(
      [
        query
          .orderBy('foo')
          .orderBy('__name__')
          .startAt('foo', 'foo'),
        query
          .orderBy('foo')
          .startAt(firestore.snapshot_(document('foo').document, {})),
      ],
      []
    );
  });

  it('accepts all variations', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        fieldFilters('foo', 'EQUAL', 'bar'),
        orderBy('foo', 'ASCENDING'),
        limit(10)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where('foo', '=', 'bar');
    query = query.orderBy('foo');
    query = query.limit(10);
    return query.get().then(results => {
      assert.equal(query, results.query);
      assert.equal(0, results.size);
      assert.equal(true, results.empty);
    });
  });

  it('supports empty gets', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request);
      return stream({readTime: {seconds: 5, nanos: 6}});
    };

    let query = firestore.collection('collectionId');
    return query.get().then(results => {
      assert.equal(0, results.size);
      assert.equal(true, results.empty);
      assert.equal('1970-01-01T00:00:05.000000006Z', results.readTime);
    });
  });

  it('retries on stream failure', function() {
    let attempts = 0;
    firestore._firestoreClient._innerApiCalls.runQuery = function() {
      ++attempts;
      throw new Error('Expected error');
    };

    let query = firestore.collection('collectionId');
    return query
      .get()
      .then(() => {
        throw new Error('Unexpected success');
      })
      .catch(() => {
        assert.equal(5, attempts);
      });
  });

  it('supports empty streams', function(callback) {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request);
      return stream({readTime: {seconds: 5, nanos: 6}});
    };

    let query = firestore.collection('collectionId');
    query
      .stream()
      .on('data', () => {
        throw new Error('Unexpected document');
      })
      .on('end', () => {
        callback();
      });
  });

  it('returns results', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request);
      return stream(document('first'), document('second'));
    };

    let query = firestore.collection('collectionId');
    return query.get().then(results => {
      assert.equal(2, results.size);
      assert.equal(false, results.empty);
      assert.equal('1970-01-01T00:00:05.000000006Z', results.readTime);
      assert.equal('first', results.docs[0].get('first'));
      assert.equal('second', results.docs[1].get('second'));
      assert.equal(2, results.docChanges.length);

      let count = 0;

      results.forEach(doc => {
        assert.ok(is.instanceof(doc, DocumentSnapshot));
        assert.equal('1970-01-01T00:00:01.000000002Z', doc.createTime);
        assert.equal('1970-01-01T00:00:03.000000004Z', doc.updateTime);
        assert.equal('1970-01-01T00:00:05.000000006Z', doc.readTime);
        ++count;
      });

      assert.equal(2, count);
    });
  });

  it('handles stream exception at initialization', function() {
    let query = firestore.collection('collectionId');

    query._stream = function() {
      throw new Error('Expected error');
    };

    return query
      .get()
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Expected error');
      });
  });

  it('handles stream exception during initialization', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function() {
      return stream(new Error('Expected error'));
    };

    return firestore
      .collection('collectionId')
      .get()
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Expected error');
      });
  });

  it('handles stream exception after initialization', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function() {
      return stream(document('first'), new Error('Expected error'));
    };

    return firestore
      .collection('collectionId')
      .get()
      .then(() => {
        throw new Error('Unexpected success in Promise');
      })
      .catch(err => {
        assert.equal(err.message, 'Expected error');
      });
  });

  it('streams results', function(callback) {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request);
      return stream(document('first'), document('second'));
    };

    let query = firestore.collection('collectionId');
    let received = 0;

    query
      .stream()
      .on('data', doc => {
        assert.ok(is.instanceof(doc, DocumentSnapshot));
        ++received;
      })
      .on('end', () => {
        assert.equal(received, 2);
        callback();
      });
  });
});

describe('where() interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, fieldFilters('foo', 'EQUAL', 'bar'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where('foo', '==', 'bar');
    return query.get();
  });

  it('concatenates all accepted filters', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        fieldFilters(
          'fooSmaller',
          'LESS_THAN',
          'barSmaller',
          'fooSmallerOrEquals',
          'LESS_THAN_OR_EQUAL',
          'barSmallerOrEquals',
          'fooEquals',
          'EQUAL',
          'barEquals',
          'fooEqualsLong',
          'EQUAL',
          'barEqualsLong',
          'fooGreaterOrEquals',
          'GREATER_THAN_OR_EQUAL',
          'barGreaterOrEquals',
          'fooGreater',
          'GREATER_THAN',
          'barGreater'
        )
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where('fooSmaller', '<', 'barSmaller');
    query = query.where('fooSmallerOrEquals', '<=', 'barSmallerOrEquals');
    query = query.where('fooEquals', '=', 'barEquals');
    query = query.where('fooEqualsLong', '==', 'barEqualsLong');
    query = query.where('fooGreaterOrEquals', '>=', 'barGreaterOrEquals');
    query = query.where('fooGreater', '>', 'barGreater');
    return query.get();
  });

  it('accepts object', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        fieldFilters('foo', 'EQUAL', {
          mapValue: {
            fields: {
              foo: {
                stringValue: 'bar',
                valueType: 'stringValue',
              },
            },
          },
          valueType: 'mapValue',
        })
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where('foo', '=', {foo: 'bar'});
    return query.get();
  });

  it('supports field path objects for field paths', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        fieldFilters('foo.bar', 'EQUAL', 'foobar', 'bar.foo', 'EQUAL', 'foobar')
      );
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where('foo.bar', '=', 'foobar');
    query = query.where(new Firestore.FieldPath('bar', 'foo'), '=', 'foobar');
    return query.get();
  });

  it('supports strings for FieldPath.documentId()', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        fieldFilters('__name__', 'EQUAL', {
          valueType: 'referenceValue',
          referenceValue:
            `projects/${PROJECT_ID}/databases/(default)/` +
            'documents/collectionId/foo',
        })
      );
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where(Firestore.FieldPath.documentId(), '==', 'foo');
    return query.get();
  });

  it('rejects custom objects for field paths', function() {
    assert.throws(() => {
      let query = firestore.collection('collectionId');
      query = query.where({}, '=', 'bar');
      return query.get();
    }, /Argument "fieldPath" is not a valid FieldPath. Invalid use of type "object" as a Firestore argument/);

    class FieldPath {}
    assert.throws(() => {
      let query = firestore.collection('collectionId');
      query = query.where(new FieldPath(), '=', 'bar');
      return query.get();
    }, /Detected an object of type "FieldPath" that doesn't match the expected instance./);
  });

  it('rejects field paths as value', function() {
    assert.throws(() => {
      let query = firestore.collection('collectionId');
      query = query.where('foo', '=', new Firestore.FieldPath('bar'));
      return query.get();
    }, /Argument "value" is not a valid FieldValue. Cannot use object of type "FieldPath" as a Firestore value./);
  });

  it('rejects field transforms as value', function() {
    assert.throws(() => {
      let query = firestore.collection('collectionId');
      query = query.where('foo', '=', Firestore.FieldValue.delete());
      return query.get();
    }, /FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);

    assert.throws(() => {
      let query = firestore.collection('collectionId');
      query = query.where('foo', '=', Firestore.FieldValue.serverTimestamp());
      return query.get();
    }, /FieldValue.serverTimestamp\(\) can only be used in update\(\), set\(\) and create\(\)./);
  });

  it('rejects custom classes as value', function() {
    class Foo {}
    class FieldPath {}
    class FieldValue {}
    class GeoPoint {}
    class DocumentReference {}

    let query = firestore.collection('collectionId');

    assert.throws(() => {
      query.where('foo', '=', new Foo()).get();
    }, /Argument "value" is not a valid FieldValue. Couldn't serialize object of type "Foo". Firestore doesn't support JavaScript objects with custom prototypes \(i.e. objects that were created via the 'new' operator\)./);

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

  it('supports unary filters', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, unaryFilters('foo', 'IS_NAN', 'bar', 'IS_NULL'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where('foo', '==', NaN);
    query = query.where('bar', '=', null);
    return query.get();
  });

  it('rejects invalid NaN filter', function() {
    assert.throws(() => {
      let query = firestore.collection('collectionId');
      query = query.where('foo', '>', NaN);
      return query.get();
    }, /Invalid query. You can only perform equals comparisons on NaN\./);
  });

  it('rejects invalid Null filter', function() {
    assert.throws(() => {
      let query = firestore.collection('collectionId');
      query = query.where('foo', '>', null);
      return query.get();
    }, /Invalid query. You can only perform equals comparisons on Null\./);
  });

  it('verifies field path', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query = query.orderBy('foo.', '=', 'foobar');
    }, /Argument "fieldPath" is not a valid FieldPath. Paths must not start or end with '.'./);
  });

  it('verifies operator', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query = query.where('foo', '@', 'foobar');
    }, /Operator must be one of "<", "<=", "==", ">", or ">="\./);
  });
});

describe('orderBy() interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts empty string', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, orderBy('foo', 'ASCENDING'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo');
    return query.get();
  });

  it('accepts asc', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, orderBy('foo', 'ASCENDING'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo', 'asc');
    return query.get();
  });

  it('accepts desc', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, orderBy('foo', 'DESCENDING'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo', 'desc');
    return query.get();
  });

  it('verifies order', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query = query.orderBy('foo', 'foo');
    }, /Order must be one of "asc" or "desc"\./);
  });

  it('accepts field path', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo.bar', 'ASCENDING', 'bar.foo', 'ASCENDING')
      );
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo.bar');
    query = query.orderBy(new Firestore.FieldPath('bar', 'foo'));
    return query.get();
  });

  it('verifies field path', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query = query.orderBy('foo.');
    }, /Argument "fieldPath" is not a valid FieldPath. Paths must not start or end with '.'./);
  });

  it('rejects call after cursor', function() {
    let query = firestore.collection('collectionId');

    assert.throws(function() {
      query = query
        .orderBy('foo')
        .startAt('foo')
        .orderBy('foo');
    }, /Cannot specify an orderBy\(\) constraint after calling startAt\(\), startAfter\(\), endBefore\(\) or endAt\(\)./);

    assert.throws(function() {
      query = query
        .where('foo', '>', 'bar')
        .startAt(snapshot('collectionId/doc', {foo: 'bar'}))
        .where('foo', '>', 'bar');
    }, /Cannot specify a where\(\) filter after calling startAt\(\), startAfter\(\), endBefore\(\) or endAt\(\)./);

    assert.throws(function() {
      query = query
        .orderBy('foo')
        .endAt('foo')
        .orderBy('foo');
    }, /Cannot specify an orderBy\(\) constraint after calling startAt\(\), startAfter\(\), endBefore\(\) or endAt\(\)./);

    assert.throws(function() {
      query = query
        .where('foo', '>', 'bar')
        .endAt(snapshot('collectionId/doc', {foo: 'bar'}))
        .where('foo', '>', 'bar');
    }, /Cannot specify a where\(\) filter after calling startAt\(\), startAfter\(\), endBefore\(\) or endAt\(\)./);
  });

  it('concatenates orders', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo', 'ASCENDING', 'bar', 'DESCENDING', 'foobar', 'ASCENDING')
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo', 'asc')
      .orderBy('bar', 'desc')
      .orderBy('foobar');
    return query.get();
  });
});

describe('limit() interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, limit(10));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.limit(10);
    return query.get();
  });

  it('expects number', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.limit(Infinity);
    }, /Argument "limit" is not a valid integer./);
  });

  it('uses latest limit', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, limit(3));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .limit(1)
      .limit(2)
      .limit(3);
    return query.get();
  });
});

describe('offset() interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, offset(10));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.offset(10);
    return query.get();
  });

  it('expects number', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.offset(Infinity);
    }, /Argument "offset" is not a valid integer\./);
  });

  it('uses latest offset', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, offset(3));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .offset(1)
      .offset(2)
      .offset(3);
    return query.get();
  });
});

describe('select() interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('generates proto', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, select('a', 'b.c'));
      return stream();
    };

    let collection = firestore.collection('collectionId');
    let query = collection.select('a', new Firestore.FieldPath('b', 'c'));

    return query.get().then(() => {
      return collection.select('a', 'b.c').get();
    });
  });

  it('validates field path', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.select(1);
    }, /Argument at index 0 is not a valid FieldPath. Invalid use of type "number" as a Firestore argument./);

    assert.throws(function() {
      query.select('.');
    }, /Argument at index 0 is not a valid FieldPath. Paths must not start or end with '.'./);
  });

  it('uses latest field mask', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, select('bar'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.select('foo').select('bar');
    return query.get();
  });

  it('implicitly adds FieldPath.documentId()', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, select('__name__'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.select();
    return query.get();
  });
});

describe('startAt() interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
        startAt(true, 'foo', 'bar')
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo')
      .orderBy('bar')
      .startAt('foo', 'bar');
    return query.get();
  });

  it('accepts FieldPath.documentId()', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('__name__', 'ASCENDING'),
        startAt(true, {
          valueType: 'referenceValue',
          referenceValue:
            `projects/${PROJECT_ID}/databases/(default)/` +
            'documents/collectionId/doc',
        })
      );

      return stream();
    };

    let doc = snapshot('collectionId/doc', {foo: 'bar'});
    let query = firestore.collection('collectionId');

    return Promise.all([
      query
        .orderBy(Firestore.FieldPath.documentId())
        .startAt(doc.id)
        .get(),
      query
        .orderBy(Firestore.FieldPath.documentId())
        .startAt(doc.ref)
        .get(),
    ]);
  });

  it('validates value for FieldPath.documentId()', function() {
    let query = firestore.collection('coll/doc/coll');

    assert.throws(() => {
      query.orderBy(Firestore.FieldPath.documentId()).startAt(42);
    }, /The corresponding value for FieldPath.documentId\(\) must be a string or a DocumentReference./);

    assert.throws(() => {
      query
        .orderBy(Firestore.FieldPath.documentId())
        .startAt(firestore.doc('coll/doc/other/doc'));
    }, /'coll\/doc\/other\/doc' is not part of the query result set and cannot be used as a query boundary./);

    assert.throws(() => {
      query
        .orderBy(Firestore.FieldPath.documentId())
        .startAt(firestore.doc('coll/doc/coll_suffix/doc'));
    }, /'coll\/doc\/coll_suffix\/doc' is not part of the query result set and cannot be used as a query boundary./);

    assert.throws(() => {
      query
        .orderBy(Firestore.FieldPath.documentId())
        .startAt(firestore.doc('coll/doc'));
    }, /'coll\/doc' is not part of the query result set and cannot be used as a query boundary./);

    assert.throws(() => {
      query
        .orderBy(Firestore.FieldPath.documentId())
        .startAt(firestore.doc('coll/doc/coll/doc/coll/doc'));
    }, /Only a direct child can be used as a query boundary. Found: 'coll\/doc\/coll\/doc\/coll\/doc'./);

    // Validate that we can't pass a reference to a collection.
    assert.throws(() => {
      query.orderBy(Firestore.FieldPath.documentId()).startAt('doc/coll');
    }, /Only a direct child can be used as a query boundary. Found: 'coll\/doc\/coll\/doc\/coll'./);
  });

  it('can specify document snapshot', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('__name__', 'ASCENDING'),
        startAt(true, {
          valueType: 'referenceValue',
          referenceValue:
            `projects/${PROJECT_ID}/databases/(default)/` +
            'documents/collectionId/doc',
        })
      );

      return stream();
    };

    let query = firestore
      .collection('collectionId')
      .startAt(snapshot('collectionId/doc', {}));
    return query.get();
  });

  it("doesn't append documentId() twice", function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('__name__', 'ASCENDING'),
        startAt(true, {
          valueType: 'referenceValue',
          referenceValue:
            `projects/${PROJECT_ID}/databases/(default)/` +
            'documents/collectionId/doc',
        })
      );

      return stream();
    };

    let query = firestore
      .collection('collectionId')
      .orderBy(Firestore.FieldPath.documentId())
      .startAt(snapshot('collectionId/doc', {}));
    return query.get();
  });

  it('can extract implicit direction for document snapshot', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo', 'ASCENDING', '__name__', 'ASCENDING'),
        startAt(true, 'bar', {
          valueType: 'referenceValue',
          referenceValue:
            `projects/${PROJECT_ID}/databases/(default)/` +
            'documents/collectionId/doc',
        })
      );

      return stream();
    };

    let query = firestore.collection('collectionId').orderBy('foo');
    query = query.startAt(snapshot('collectionId/doc', {foo: 'bar'}));
    return query.get();
  });

  it('can extract explicit direction for document snapshot', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo', 'DESCENDING', '__name__', 'DESCENDING'),
        startAt(true, 'bar', {
          valueType: 'referenceValue',
          referenceValue:
            `projects/${PROJECT_ID}/databases/(default)/` +
            'documents/collectionId/doc',
        })
      );

      return stream();
    };

    let query = firestore.collection('collectionId').orderBy('foo', 'desc');
    query = query.startAt(snapshot('collectionId/doc', {foo: 'bar'}));
    return query.get();
  });

  it('can specify document snapshot with inequality filter', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('b', 'ASCENDING', '__name__', 'ASCENDING'),
        startAt(true, 'b', {
          valueType: 'referenceValue',
          referenceValue:
            `projects/${PROJECT_ID}/databases/(default)/` +
            'documents/collectionId/doc',
        }),
        fieldFilters(
          'a',
          'EQUAL',
          'a',
          'b',
          'GREATER_THAN_OR_EQUAL',
          'b',
          'c',
          'EQUAL',
          'c'
        )
      );

      return stream();
    };

    let query = firestore
      .collection('collectionId')
      .where('a', '=', 'a')
      .where('b', '>=', 'b')
      .where('c', '=', 'c')
      .startAt(snapshot('collectionId/doc', {b: 'b'}));
    return query.get();
  });

  it('ignores equality filter with document snapshot cursor', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('__name__', 'ASCENDING'),
        startAt(true, {
          valueType: 'referenceValue',
          referenceValue:
            `projects/${PROJECT_ID}/databases/(default)/` +
            'documents/collectionId/doc',
        }),
        fieldFilters('foo', 'EQUAL', 'bar')
      );

      return stream();
    };

    let query = firestore
      .collection('collectionId')
      .where('foo', '=', 'bar')
      .startAt(snapshot('collectionId/doc', {foo: 'bar'}));
    return query.get();
  });

  it('validates field exists in document snapshot', function() {
    let query = firestore.collection('collectionId').orderBy('foo', 'desc');

    assert.throws(() => {
      query.startAt(snapshot('collectionId/doc'));
    }, /Field 'foo' is missing in the provided DocumentSnapshot. Please provide a document that contains values for all specified orderBy\(\) and where\(\) constraints./);
  });

  it('does not accept field transforms', function() {
    let query = firestore
      .collection('collectionId')
      .orderBy('foo', 'desc')
      .orderBy('bar', 'asc');

    assert.throws(() => {
      query.startAt(Firestore.FieldValue.serverTimestamp());
    }, /Argument at index 0 is not a valid FieldValue. FieldValue.serverTimestamp\(\) can only be used in update\(\), set\(\) and create\(\)./);

    assert.throws(() => {
      query.startAt('foo', Firestore.FieldValue.delete());
    }, /Argument at index 1 is not a valid FieldValue. FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);
  });

  it('requires order by', function() {
    let query = firestore.collection('collectionId');
    query = query.orderBy('foo');

    assert.throws(() => {
      query.startAt('foo', 'bar');
    }, /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('can overspecify order by', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
        startAt(true, 'foo')
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo')
      .orderBy('bar')
      .startAt('foo');
    return query.get();
  });

  it('validates input', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.startAt(123);
    }, /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('uses latest value', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, orderBy('foo', 'ASCENDING'), startAt(true, 'bar'));

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo')
      .startAt('foo')
      .startAt('bar');
    return query.get();
  });
});

describe('startAfter() interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
        startAt(false, 'foo', 'bar')
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo')
      .orderBy('bar')
      .startAfter('foo', 'bar');
    return query.get();
  });

  it('validates input', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.startAfter(123);
    }, /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('uses latest value', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo', 'ASCENDING'),
        startAt(false, 'bar')
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo')
      .startAfter('foo')
      .startAfter('bar');
    return query.get();
  });
});

describe('endAt() interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
        endAt(false, 'foo', 'bar')
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo')
      .orderBy('bar')
      .endAt('foo', 'bar');
    return query.get();
  });

  it('validates input', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.endAt(123);
    }, /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('uses latest value', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, orderBy('foo', 'ASCENDING'), endAt(false, 'bar'));

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo')
      .endAt('foo')
      .endAt('bar');
    return query.get();
  });
});

describe('endBefore() interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('accepts fields', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(
        request,
        orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
        endAt(true, 'foo', 'bar')
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo')
      .orderBy('bar')
      .endBefore('foo', 'bar');
    return query.get();
  });

  it('validates input', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.endBefore(123);
    }, /Too many cursor values specified. The specified values must match the orderBy\(\) constraints of the query./);
  });

  it('uses latest value', function() {
    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      requestEquals(request, orderBy('foo', 'ASCENDING'), endAt(true, 'bar'));

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query
      .orderBy('foo')
      .endBefore('foo')
      .endBefore('bar');
    return query.get();
  });

  it('is immutable', function() {
    let expectedResult = buildQuery(limit(10));

    firestore._firestoreClient._innerApiCalls.runQuery = function(request) {
      assert.deepEqual(request, expectedResult);
      return stream();
    };

    let query = firestore.collection('collectionId').limit(10);
    let adjustedQuery = query.orderBy('foo').endBefore('foo');

    return query.get().then(() => {
      expectedResult = buildQuery(
        limit(10),
        orderBy('foo', 'ASCENDING'),
        endAt(true, 'foo')
      );
      return adjustedQuery.get();
    });
  });
});
