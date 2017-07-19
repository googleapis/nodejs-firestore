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

let assert = require('assert');
let extend = require('extend');
let grpc = require('grpc');
let is = require('is');
let through = require('through2');

let Firestore = require('../');
let reference = require('../src/reference')(Firestore);
let DocumentReference = reference.DocumentReference;
let DocumentSnapshot = require('../src/document')(
  Firestore, DocumentReference).DocumentSnapshot;
let Path = require('../src/path');

const databaseRoot = 'projects/test-project/databases/(default)';

function createInstance() {
  return new Firestore({
    projectId: 'test-project',
    sslCreds: grpc.credentials.createInsecure()
  });
}

function snapshot(relativePath, data) {
  const snapshot = new DocumentSnapshot.Builder();
  let path = Path.fromName(`${databaseRoot}/documents/${relativePath}`);
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
      op: op
    };

    if (is.object(value)) {
      filter.value = value;
    } else {
      filter.value = {
        stringValue: value,
        value_type: 'stringValue'
      };
    }

    filters.push({ fieldFilter: filter });
  }

  return {
    where: {
      compositeFilter: {
        op: 'AND',
        filters: filters
      }
    }
  };
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
        op: equals
      }
    });
  }

  return {
    where: {
      compositeFilter: {
        op: 'AND',
        filters: filters
      }
    }
  };
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
      direction: direction
    });
  }

  return { orderBy: orderBy };
}

function limit(n) {
  return {
    limit: {
      value: n
    }
  };
}

function offset(n) {
  return {
    offset: n
  };
}

function select(field) {
  let select = {
    fields: []
  };

  for (field of arguments) {
    select.fields.push({fieldPath: field});
  }

  return { select: select };
}

function startAt(value, before) {
  return {
    startAt: {
      before: before,
      values: [{
        stringValue: value,
        value_type: 'stringValue'
      }]
    }
  };
}

function endAt(value, before) {
  return {
    endAt: {
      before: before,
      values: [{
        stringValue: value,
        value_type: 'stringValue'
      }]
    }
  };
}

function buildQuery(protoComponent) {
  let query = {
    parent: databaseRoot,
    structuredQuery: {
      from: [{
        collectionId: 'collectionId'
      }]
    }
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
    updateTime: {seconds: 3, nanos: 4}
  };

  document.fields[name] = {
    stringValue: name,
    value_type: 'stringValue'
  };

  document.name = `${databaseRoot}/documents/collectionId/${name}`;

  return { document: document, readTime: {seconds: 5, nanos: 6} };
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

  beforeEach(function() {
    firestore = createInstance();
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

  it('accepts all variations', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
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
    return query.get().then((results) => {
      assert.equal(query, results.query);
      assert.equal(0, results.size);
      assert.equal(true, results.empty);
    });
  });

  it('supports empty gets', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request);
      return stream({ readTime: {seconds: 5, nanos: 6} });
    };

    let query = firestore.collection('collectionId');
    return query.get().then((results) => {
      assert.equal(0, results.size);
      assert.equal(true, results.empty);
      assert.equal('1970-01-01T00:00:05.000000006Z', results.readTime);
    });
  });

  it('supports empty streams', function(callback) {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request);
      return stream({ readTime: {seconds: 5, nanos: 6} });
    };

    let query = firestore.collection('collectionId');
    query.stream().on('data', () => {
      throw new Error('Unexpected document');
    }).on('end', () => {
      callback();
    });
  });

  it('returns results', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request);
      return stream(document('first'), document('second'));
    };

    let query = firestore.collection('collectionId');
    return query.get().then((results) => {
      assert.equal(2, results.size);
      assert.equal(false, results.empty);
      assert.equal('1970-01-01T00:00:05.000000006Z', results.readTime);
      assert.equal('first', results.docs[0].get('first'));
      assert.equal('second', results.docs[1].get('second'));

      let count = 0;

      results.forEach((doc) => {
        assert.ok(is.instanceof(doc, DocumentSnapshot));
        assert.equal('1970-01-01T00:00:01.000000002Z', doc.createTime);
        assert.equal('1970-01-01T00:00:03.000000004Z', doc.updateTime);
        assert.equal('1970-01-01T00:00:05.000000006Z', doc.readTime);
        ++count;
      });

      assert.equal(2, count);
    });
  });

  it('handles stream exception', function() {
    firestore.api.Firestore._runQuery = function() {
      return stream(new Error('Expected error'));
    };

    return firestore.collection('collectionId').get().then(() => {
      throw new Error('Unexpected success in Promise');
    }).catch((err) => {
      assert.equal(err.message, 'Expected error');
    });
  });

  it('returns error', function() {
    let query = firestore.collection('collectionId');

    query._stream = function() {
      throw new Error('Expected error');
    };

    return query.get().then(() => {
      throw new Error('Unexpected success in Promise');
    }).catch((err) => {
      assert.equal(err.message, 'Expected error');
    });
  });

  it('streams results', function(callback) {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request);
      return stream(document('first'), document('second'));
    };

    let query = firestore.collection('collectionId');
    let received = 0;

    query.stream().on('data', (doc) => {
      assert.ok(is.instanceof(doc, DocumentSnapshot));
      ++received;
    }).on('end', () => {
      assert.equal(received, 2);
      callback();
    });
  });
});

describe('where() interface', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('generates proto', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, fieldFilters('foo', 'EQUAL', 'bar'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where('foo', '==', 'bar');
    return query.get();
  });

  it('concatenates all accepted filters', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, fieldFilters(
        'fooSmaller', 'LESS_THAN', 'barSmaller',
        'fooSmallerOrEquals', 'LESS_THAN_OR_EQUAL', 'barSmallerOrEquals',
        'fooEquals', 'EQUAL', 'barEquals',
        'fooEqualsLong', 'EQUAL', 'barEqualsLong',
        'fooGreaterOrEquals', 'GREATER_THAN_OR_EQUAL', 'barGreaterOrEquals',
        'fooGreater', 'GREATER_THAN', 'barGreater')
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
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        fieldFilters(
          'foo',
          'EQUAL',
          {
            mapValue: {
              fields: {
                foo: {
                  stringValue: 'bar',
                  value_type: 'stringValue'
                }
              },
            },
            value_type: 'mapValue'
          }
        )
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where('foo', '=', { foo: 'bar' });
    return query.get();
  });

  it('accepts field path', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, fieldFilters('foo.bar', 'EQUAL', 'foobar'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.where('foo.bar', '=', 'foobar');
    return query.get();
  });

  it('supports unary filters', function() {
    firestore.api.Firestore._runQuery = function(request) {
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
    }, new RegExp('Argument "fieldPath" is not a valid FieldPath. Field ' +
        '"foo." was not encoded using Firestore.fieldPath()\.'));
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

  beforeEach(function() {
    firestore = createInstance();
  });

  it('accepts empty string', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, orderBy('foo', 'ASCENDING'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo');
    return query.get();
  });

  it('accepts asc', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, orderBy('foo', 'ASCENDING'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo', 'asc');
    return query.get();
  });

  it('accepts desc', function() {
    firestore.api.Firestore._runQuery = function(request) {
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
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, orderBy('foo.bar', 'ASCENDING'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo.bar');
    return query.get();
  });

  it('verifies field path', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query = query.orderBy('foo.');
    }, new RegExp('Argument "fieldPath" is not a valid FieldPath. Field ' +
        '"foo." was not encoded using Firestore.fieldPath().'));
  });

  it('concatenates orders', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,  orderBy(
        'foo', 'ASCENDING',
        'bar', 'DESCENDING',
        'foobar', 'ASCENDING'
      ));

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo', 'asc').orderBy('bar', 'desc')
      .orderBy('foobar');
    return query.get();
  });
});

describe('limit() interface', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('generates proto', function() {
    firestore.api.Firestore._runQuery = function(request) {
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
    }, /Argument "n" is not a valid integer./);
  });

  it('uses latest limit', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, limit(3));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.limit(1).limit(2).limit(3);
    return query.get();
  });
});

describe('offset() interface', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('generates proto', function() {
    firestore.api.Firestore._runQuery = function(request) {
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
    }, /Argument "n" is not a valid integer\./);
  });

  it('uses latest offset', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, offset(3));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.offset(1).offset(2).offset(3);
    return query.get();
  });
});

describe('select() interface', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('generates proto', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, select('a', 'b.c'));
      return stream();
    };

    let collection = firestore.collection('collectionId');
    let query = collection.select('a', 'b.c');

    return query.get().then(() => {
      return collection.select(['a', 'b.c']).get();
    });
  });

  it('validates field path', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.select(1);
    },  new RegExp('Argument at index 0 is not a valid FieldPath. ' +
        'Input is not a string.'));

    assert.throws(function() {
      query.select('.');
    },  new RegExp('Argument at index 0 is not a valid FieldPath. Field "\." ' +
        'was not encoded using Firestore.fieldPath().'));
  });

  it('uses latest field mask', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request, select('bar'));
      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.select('foo').select('bar');
    return query.get();
  });

  it('supports __name__', function() {
    firestore.api.Firestore._runQuery = function(request) {
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

  beforeEach(function() {
    firestore = createInstance();
  });

  it('accepts object', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        startAt('bar', true)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').startAt({foo: 'bar'});
    return query.get();
  });

  it('requires order by', function() {
    let query = firestore.collection('collectionId');
    query = query.orderBy('foo');

    assert.throws(() => {
      query.startAt({foo: 'bar', bar: 'foo'});
    }, /Field "bar" does not have a corresponding OrderBy constraint\./);
  });

  it('can overspecify order by', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING', 'bar', 'ASCENDING'),
        startAt('bar', true)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').orderBy('bar').startAt({foo: 'bar'});
    return query.get();
  });

  it('accepts document', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        startAt('bar', true)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').startAt(snapshot('col/doc', {foo: 'bar'}));
    return query.get();
  });

  it('validates input', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.startAt(123);
    }, /Specify either a valid Document or JavaScript object as your.*\./);
  });

  it('uses latest value', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        startAt('bar', true)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').startAt({foo: 'foo'}).startAt({foo: 'bar'});
    return query.get();
  });
});

describe('startAfter() interface', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('accepts object', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        startAt('bar', false)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').startAfter({foo: 'bar'});
    return query.get();
  });

  it('accepts document', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        startAt('bar', false)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').startAfter(snapshot('col/doc', {foo: 'bar'}));
    return query.get();
  });

  it('validates input', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.startAfter(123);
    }, /Specify either a valid Document or JavaScript object as your Query.*/);
  });

  it('uses latest value', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        startAt('bar', false)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').startAfter({foo: 'foo'})
      .startAfter({foo: 'bar'});
    return query.get();
  });
});

describe('endAt() interface', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('accepts object', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        endAt('bar', false)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').endAt({foo: 'bar'});
    return query.get();
  });

  it('accepts document', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        endAt('bar', false)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').endAt(snapshot('col/doc', {foo: 'bar'}));
    return query.get();
  });

  it('validates input', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.endAt(123);
    }, /Specify either a valid Document or JavaScript object as your Query.*/);
  });

  it('uses latest value', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        endAt('bar', false)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').endAt({foo: 'foo'}).endAt({foo: 'bar'});
    return query.get();
  });
});

describe('endBefore() interface', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('accepts object', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        endAt('bar', true)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').endBefore({foo: 'bar'});
    return query.get();
  });

  it('accepts document', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        endAt('bar', true)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').endBefore(snapshot('col/doc', {foo: 'bar'}));
    return query.get();
  });

  it('validates input', function() {
    let query = firestore.collection('collectionId');
    assert.throws(function() {
      query.endBefore(123);
    }, /Specify either a valid Document or JavaScript object as your Query.*/);
  });

  it('uses latest value', function() {
    firestore.api.Firestore._runQuery = function(request) {
      requestEquals(request,
        orderBy('foo', 'ASCENDING'),
        endAt('bar', true)
      );

      return stream();
    };

    let query = firestore.collection('collectionId');
    query = query.orderBy('foo').endBefore({foo: 'foo'})
      .endBefore({foo: 'bar'});
    return query.get();
  });

  it('is immutable', function() {
    let expectedResult = buildQuery(limit(10));

    firestore.api.Firestore._runQuery = function(request) {
      assert.deepEqual(request, expectedResult);
      return stream();
    };

    let query = firestore.collection('collectionId').limit(10);
    let adjustedQuery = query.orderBy('foo').endBefore({foo: 'foo'});

    return query.get().then(() => {
      expectedResult = buildQuery(limit(10), orderBy('foo', 'ASCENDING'),
        endAt('foo', true));
      return adjustedQuery.get();
    });
  });
});

