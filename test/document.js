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

'use strict';

const assert = require('assert');
const extend = require('extend');
const grpc = require('grpc');
const is = require('is');
const through = require('through2');

const Firestore = require('../');
const reference = require('../src/reference')(Firestore);
const DocumentReference = reference.DocumentReference;
const ResourcePath = require('../src/path').ResourcePath;

const DATABASE_ROOT = 'projects/test-project/databases/(default)';

const INVALID_ARGUMENTS_TO_UPDATE = new RegExp('Update\\(\\) requires either ' +
    'a single JavaScript object or an alternating list of field/value pairs ' +
    'that can be followed by an optional Precondition');

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

function createInstance() {
  return new Firestore({
    projectId: 'test-project',
    sslCreds: grpc.credentials.createInsecure()
  });
}

function buildWrite_(document, mask, transform, precondition) {
  let update = extend(true, {}, document);
  delete update.updateTime;
  delete update.createTime;

  let writes = [{ update: update }];

  if (mask) {
    writes[0].updateMask = mask;
  }

  if (precondition) {
    writes[0].currentDocument = precondition;
  }

  if (transform) {
    writes.push({transform: transform});
  }

  return { writes: writes };
}

function set(document, mask, transform, precondition) {
  return buildWrite_(document, mask, transform, precondition);
}

function update(document, mask, transform, precondition) {
  precondition = precondition || { exists: true };
  mask = mask || updateMask();
  return buildWrite_(document, mask , transform, precondition);
}

function create(document, transform) {
  return buildWrite_(document, /* updateMask */ null, transform,
    { exists: false });
}

function retrieve() {
  return { documents: [`${DATABASE_ROOT}/documents/collectionId/documentId`] };
}

function remove(document, precondition) {
  let writes = [
    { delete: `${DATABASE_ROOT}/documents/collectionId/${document}` }
  ];

  if (precondition) {
    writes[0].currentDocument = precondition;
  }

  return { writes: writes };
}

function document(field, value) {
  let document = {
    name: `${DATABASE_ROOT}/documents/collectionId/documentId`,
    fields: {},
    createTime: {seconds: 1, nanos: 2},
    updateTime: {seconds: 3, nanos: 4}
  };

  for (let i = 0; i < arguments.length; i += 2) {
    field = arguments[i];
    value = arguments[i + 1];

    if (is.string(value)) {
      document.fields[field] = {
        value_type: 'stringValue',
        stringValue: value
      };
    } else {
      document.fields[field] = value;
    }
  }

  return document;
}

function updateMask(/* field */) {
  return { fieldPaths: Array.prototype.slice.call(arguments)};
}

function found(document) {
  return { found: document, readTime: {seconds: 5, nanos: 6} };
}

function missing(document) {
  return { missing: document.name, readTime: {seconds: 5, nanos: 6} };
}

function fieldTransform(field, transform) {
  let proto = [];

  for (let i = 0; i < arguments.length; i += 2) {
    field = arguments[i];
    transform = arguments[i + 1];

    proto.push({
      fieldPath: field,
      setToServerValue: transform
    });
  }

  return {
    document: `${DATABASE_ROOT}/documents/collectionId/documentId`,
    fieldTransforms: proto
  };
}

function requestEquals(actual, protoOperation) {
  let proto = {
    database: DATABASE_ROOT,
  };

  for (protoOperation of Array.prototype.slice.call(arguments, 1)) {
    for (let key in protoOperation) {
      if (protoOperation.hasOwnProperty(key)) {
        if (proto[key]) {
          proto[key] = proto[key].concat(protoOperation[key]);
        } else {
          proto[key] = protoOperation[key];
        }
      }
    }
  }

  assert.deepEqual(actual, proto);
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

const allSupportedTypesJson = document(
  'arrayValue', {
    value_type: 'arrayValue',
    arrayValue: {
      values: [
        {
          value_type: 'stringValue',
          stringValue: 'foo'
        },
        {
          value_type: 'integerValue',
          integerValue: 42
        },
        {
          value_type: 'stringValue',
          stringValue: 'bar'
        }
      ]
    }
  },
  'dateValue', {
    value_type: 'timestampValue',
    timestampValue: {
      nanos: 123000000,
      seconds: 479978400
    }
  },
  'doubleValue', {
    value_type: 'doubleValue',
    doubleValue: 0.1
  },
  'falseValue', {
    value_type: 'booleanValue',
    booleanValue: false
  },
  'infinityValue', {
    value_type: 'doubleValue',
    doubleValue: Infinity
  },
  'integerValue', {
    value_type: 'integerValue',
    integerValue: 0
  },
  'negativeInfinityValue', {
    value_type: 'doubleValue',
    doubleValue: -Infinity
  },
  'nilValue', {
    value_type: 'nullValue',
    nullValue: 'NULL_VALUE'
  },
  'objectValue', {
    value_type: 'mapValue',
    mapValue: {
      fields: {
        foo: {
          value_type: 'stringValue',
          stringValue: 'bar'
        }
      }
    }
  },
  'pathValue', {
    value_type: 'referenceValue',
    referenceValue: `${DATABASE_ROOT}/documents/collection/document`
  },
  'stringValue', {
    value_type: 'stringValue',
    stringValue: 'a'
  },
  'trueValue', {
    value_type: 'booleanValue',
    booleanValue: true
  },
  'geoPointValue', {
    value_type: 'geoPointValue',
    geoPointValue: {
      latitude: 50.1430847,
      longitude: -122.9477780
    }
  },
  'bytesValue', {
    value_type: 'bytesValue',
    bytesValue: new Buffer([0x1, 0x2])
  });

const allSupportedTypesObject = {
  stringValue: 'a',
  trueValue: true,
  falseValue: false,
  integerValue: 0,
  doubleValue: 0.1,
  infinityValue: Infinity,
  negativeInfinityValue: -Infinity,
  objectValue: {foo: 'bar'},
  dateValue: new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)'),
  pathValue: new DocumentReference({formattedName: DATABASE_ROOT},
    new ResourcePath('test-project', '(default)', 'collection', 'document')),
  arrayValue: ['foo', 42, 'bar'],
  nilValue: null,
  geoPointValue: new Firestore.GeoPoint(50.1430847, -122.9477780),
  bytesValue: new Buffer([0x1, 0x2])
};

const defaultWriteResult = {
  commitTime: {
    nanos: 3,
    seconds: 4
  },
  writeResults: [
    {
      updateTime: {
        nanos: 3,
        seconds: 4
      }
    }
  ]
};

describe('DocumentReference interface', function() {
  let firestore;
  let documentRef;

  beforeEach(function() {
    firestore = createInstance();
    documentRef = firestore.doc('collectionId/documentId');
  });

  it('has collection() method', function() {
    assert.throws(() => {
      documentRef.collection(42);
    }, new RegExp('Argument "collectionPath" is not a valid ResourcePath. ' +
        'Path is not a string.'));

    let collection = documentRef.collection('col');
    assert.equal(collection.id, 'col');

    assert.throws(() => {
      documentRef.collection('col/doc');
    }, /Argument "collectionPath" must point to a collection\./);

    collection = documentRef.collection('col/doc/col');
    assert.equal(collection.id, 'col');
  });

  it('has path property', function() {
    assert.equal(documentRef.path, 'collectionId/documentId');
  });

  it('has parent property', function() {
    assert.equal(documentRef.parent.path, 'collectionId');
  });
});

describe('serialize document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('serializes all supported types', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, set(allSupportedTypesJson));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').set(
      allSupportedTypesObject);
  });

  it('doesn\'t serialize unsupported types', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: undefined});
    }, /Cannot encode type/);
  });

  it('doesn\'t serialize inherited properties', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(
        document('member', 'bar'),
        updateMask('member')
      ));
      callback(null, defaultWriteResult);
    };

    let base = {inherited: 'foo'};
    let instance = Object.create(base);
    instance.member = 'bar';

    return firestore.doc('collectionId/documentId').update(instance);
  });

  it('serializes date before 1970', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, set(document('moonLanding', {
        value_type: 'timestampValue',
        timestampValue: {
          nanos: 123000000,
          seconds: -14182920
        }
      })));

      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').set({
      moonLanding: new Date('Jul 20 1969 20:18:00.123 UTC')
    });
  });

  it('serializes unicode keys', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, set(document('😀', '😜')));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').set({
      '😀': '😜'
    });
  });

  it('accepts both blob formats', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, set(document(
        'blob1',
        { value_type: 'bytesValue', bytesValue: new Uint8Array([0, 1, 2]) },
        'blob2',
        { value_type: 'bytesValue', bytesValue: new Buffer([0, 1, 2])
      })));

      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').set({
      blob1: new Uint8Array([0, 1, 2]),
      blob2: new Buffer([0, 1, 2])
    });
  });

  it('supports NaN and Infinity', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      let fields = request.writes[0].update.fields;
      assert.ok(typeof fields.nanValue.doubleValue === 'number' &&
        isNaN(fields.nanValue.doubleValue));
      assert.equal(fields.posInfinity.doubleValue, Infinity);
      assert.equal(fields.negInfinity.doubleValue, -Infinity);

      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').set({
      nanValue: NaN,
      posInfinity: Infinity,
      negInfinity: -Infinity
    });
  });

  it('supports server timestamps', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, set(document('map', {
          mapValue: {
            fields: {}
          },
          value_type: 'mapValue'
        }),/* updateMask= */ null,
        fieldTransform('field', 'REQUEST_TIME', 'map.field', 'REQUEST_TIME')));

      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').set({
      field: Firestore.FieldValue.serverTimestamp(),
      map: {field: Firestore.FieldValue.serverTimestamp()}
    });
  });

  it('doesn\'t support server timestamp in array', function() {
    const expectedErr = /Server timestamps are not supported as array values./;

    assert.throws(() => {
      return firestore.doc('collectionId/documentId').set({
        array: [Firestore.FieldValue.serverTimestamp()]
      });
    }, expectedErr);

    assert.throws(() => {
      return firestore.doc('collectionId/documentId').set({
        map: {
          array: [Firestore.FieldValue.serverTimestamp()]
        }
      });
    }, expectedErr);

    assert.throws(() => {
      return firestore.doc('collectionId/documentId').set({
        array: [
          { map: Firestore.FieldValue.serverTimestamp() }
        ]
      });
    }, expectedErr);

    assert.throws(() => {
      return firestore.doc('collectionId/documentId').set({
        array: {
          map: {
            array: [Firestore.FieldValue.serverTimestamp()]
          }
        }
      });
    }, expectedErr);
  });

  it('with invalid geopoint', function() {
    const expectedErr = /Argument ".*" is not a valid number\./;

    assert.throws(() => {
      new Firestore.GeoPoint('57.2999988','INVALID');
    }, expectedErr);

    assert.throws(() => {
      new Firestore.GeoPoint('INVALID','-4.4499982');
    }, expectedErr);

    assert.throws(() => {
      new Firestore.GeoPoint();
    }, expectedErr);
  });

  it('resolves infinite nesting', function() {
    let obj = {};
    obj.foo = obj;

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update(obj);
    }, new RegExp('Argument "dataOrField" is not a valid Document. Input ' +
        'object is deeper than 20 levels or contains a cycle\.'));
  });
});

describe('deserialize document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('deserializes all supported types', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found(allSupportedTypesJson));
    };

    return firestore.doc('collectionId/documentId').get().then(
      (result) => {
        let expected = extend(true, {}, allSupportedTypesObject);
        // Deep Equal doesn't support matching instances of DocumentRefs, so we
        // compare them manually and remove them from the resulting object.
        assert.equal(result.get('pathValue').formattedName,
                     expected.pathValue.formattedName);
        let data = result.data();
        delete data.pathValue;
        delete expected.pathValue;
        assert.deepEqual(data, expected);
        assert.equal(50.1430847, data.geoPointValue.latitude);
        assert.equal(-122.9477780, data.geoPointValue.longitude);
      });
  });

  it('ignores intermittent stream failures', function() {
    let attempts = 1;

    firestore.api.Firestore._batchGetDocuments = function() {
      if (attempts < 3) {
        ++attempts;
        throw new Error('Expected error');
      } else {
        return stream(found(document()));
      }
    };

    return firestore.doc('collectionId/documentId').get().then(() => {
      assert.equal(3, attempts);
    });
  });

  it('deserializes date before 1970', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found(document('moonLanding', {
        value_type: 'timestampValue',
        timestampValue: {
          nanos: 123000000,
          seconds: -14182920
        }
      })));
    };

    return firestore.doc('collectionId/documentId').get().then((res) => {
      assert.equal(res.get('moonLanding').getTime(),
        new Date('Jul 20 1969 20:18:00.123 UTC').getTime());
    });
  });

  it('returns undefined for unknown fields', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found(document()));
    };

    return firestore.doc('collectionId/documentId').get().then((res) => {
      assert.equal(res.get('bar'), undefined);
      assert.equal(res.get('bar.foo'), undefined);
    });
  });

  it('supports NaN and Infinity', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found(document(
        'nanValue', { value_type: 'doubleValue', doubleValue: 'NaN' },
        'posInfinity',  { value_type: 'doubleValue', doubleValue: 'Infinity' },
        'negInfinity',  { value_type: 'doubleValue', doubleValue: '-Infinity' }
      )));
    };

    return firestore.doc('collectionId/documentId').get().then((res) => {
      assert.ok(typeof res.get('nanValue') === 'number' &&
        isNaN(res.get('nanValue')));
      assert.equal(res.get('posInfinity'), Infinity);
      assert.equal(res.get('negInfinity'), -Infinity);
    });
  });

  it('doesn\'t deserialize unsupported types', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found(document('moonLanding', { value_type: 'foo' })));
    };

    return firestore.doc('collectionId/documentId').get().then((doc) => {
      assert.throws(() => {
        doc.data();
      }, /Cannot decode type from Firestore Value: {"value_type":"foo"}/);
    });
  });

  it('doesn\'t deserialize invalid latitude', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found(document('geoPointValue', {
        value_type: 'geoPointValue',
        geoPointValue: {
          latitude: 'foo',
          longitude: -122.9477780
        }
      })));
    };

    return firestore.doc('collectionId/documentId').get().then(doc => {
      assert.throws(() => {
        doc.data();
      }, /Argument "latitude" is not a valid number\./);
    });
  });

  it('doesn\'t deserialize invalid longitude', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found(document('geoPointValue', {
        value_type: 'geoPointValue',
        geoPointValue: {
          latitude: 50.1430847,
          longitude: 'foo'
        }
      })));
    };

    return firestore.doc('collectionId/documentId').get().then(doc => {
      assert.throws(() => {
        doc.data();
      }, /Argument "longitude" is not a valid number\./);
    });
  });
});

describe('get document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('returns document', function() {
    firestore.api.Firestore._batchGetDocuments = function(request) {
      requestEquals(request, retrieve());

      return stream(found(document('foo', {
        value_type: 'mapValue',
        mapValue: {
          fields: {
            bar: {
              value_type: 'stringValue',
              stringValue: 'foobar'
            }
          }
        }
      })));
    };

    return firestore.doc('collectionId/documentId').get().then(
      (result) => {
        assert.deepEqual(result.data(), {foo: {bar: 'foobar'}});
        assert.deepEqual(result.get('foo'), {bar: 'foobar'});
        assert.equal(result.get('foo.bar'), 'foobar');
        assert.equal(
            result.get(new Firestore.FieldPath('foo', 'bar')), 'foobar');
        assert.equal(result.ref.id, 'documentId');
      });
  });

  it('returns read, update and create times', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found(document()));
    };

    return firestore.doc('collectionId/documentId').get().then(
        (result) => {
          assert.equal(result.createTime, '1970-01-01T00:00:01.000000002Z');
          assert.equal(result.updateTime, '1970-01-01T00:00:03.000000004Z');
          assert.equal(result.readTime, '1970-01-01T00:00:05.000000006Z');
        });
  });

  it('returns not found', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(missing(document()));
    };

    return firestore.doc('collectionId/documentId').get().then((result) => {
      assert.equal(result.exists, false);
      assert.equal(result.readTime, '1970-01-01T00:00:05.000000006Z');

      assert.throws(() => {
        result.data();
      }, /The data for ".*" does not exist./);

      assert.throws(() => {
        result.get('foo');
      }, /The data for ".*" does not exist./);
    });
  });

  it('throws error', function(done) {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(new Error('RPC Error'));
    };

    firestore.doc('collectionId/documentId').get().catch(err => {
      assert.equal(err.message, 'RPC Error');
      done();
    });
  });

  it('requires field path', function() {
    firestore.api.Firestore._batchGetDocuments = function() {
      return stream(found(document('foo', {
        value_type: 'mapValue',
        mapValue: {
          fields: {
            bar: {
              value_type: 'stringValue',
              stringValue: 'foobar'
            }
          }
        }
      })));
    };

    return firestore.doc('collectionId/documentId').get().then(doc => {
      assert.throws(() => {
        doc.get();
      }, new RegExp('Argument "field" is not a valid FieldPath. ' +
          'Paths must be strings or FieldPath objects\.'));
    });
  });
});

describe('delete document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('generates proto', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, remove('documentId'));

      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').delete();
  });

  it('returns update time', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, remove('documentId'));

      callback(null, {
        commitTime: {
          nanos: 123000000,
          seconds: 479978400
        },
        writeResults: [{}]
      });
    };

    return firestore.doc('collectionId/documentId').delete().then((res) => {
      assert.equal(res.writeTime, '1985-03-18T07:20:00.123000000Z');
    });
  });

  it('with last update time precondition', function() {
    let docRef = firestore.doc('collectionId/documentId');

    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, remove('documentId', {
        updateTime: {
          nanos: 123000000,
          seconds: 479978400
        }
      }));

      callback(null, defaultWriteResult);
    };

    return Promise.all([
      docRef.delete({ lastUpdateTime: '1985-03-18T07:20:00.123Z' }),
      docRef.delete({ lastUpdateTime: '1985-03-18T07:20:00.123000Z' }),
      docRef.delete({ lastUpdateTime: '1985-03-18T07:20:00.123000000Z' }),
    ]);
  });

  it('with invalid last update time precondition', function() {
    assert.throws(() => {
      return firestore.doc('collectionId/documentId')
        .delete({lastUpdateTime: 1337});
    }, new RegExp('Argument "precondition" is not a valid Precondition\. ' +
        '"lastUpdateTime" is not a string\.'));
  });
});

describe('set document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('sets document', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, set(document()));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').set({});
  });

  it('supports document merges', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, set(document('a', 'b', 'c', {
          mapValue: {
            fields: {
              d: {
                stringValue: 'e',
                value_type: 'stringValue'
              }
            }
          },
          value_type: 'mapValue'
        }), updateMask('a', 'c.d')));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').set(
        { a: 'b' , c: { d: 'e'}},
        { merge: true });
  });

  it('doesn\'t split on dots', function()  {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, set(document('a.b', 'c')));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').set({ 'a.b': 'c'});
  });

  it('validates merge option', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set(
          { foo: 'bar'}, 'foo');
    }, new RegExp('Argument "options" is not a valid SetOptions. Input ' +
        'is not an object.'));

    assert.throws(() => {
      firestore.doc('collectionId/documentId').set(
          { foo: 'bar'}, { merge: 42 });
    }, new RegExp('Argument "options" is not a valid SetOptions. "merge" ' +
        'is not a boolean.'));
  });

  it('requires an object', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set(null);
    }, new RegExp('Argument "data" is not a valid Document. Input is not a ' +
        'JavaScript object\.'));
  });

  it('doesn\'t accept arrays', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set([42]);
    }, new RegExp('Argument "data" is not a valid Document. Input is not a ' +
        'JavaScript object\.'));
  });
});

describe('create document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('creates document', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, create(document()));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').create({});
  });

  it('returns update time', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, create(document()));

      callback(null, {
        commitTime: {
          nanos: 0,
          seconds: 0
        },
        writeResults: [
          {
            updateTime: {
              nanos: 123000000,
              seconds: 479978400
            }
          }
        ]
      });
    };

    return firestore.doc('collectionId/documentId').create({}).then((res) => {
      assert.equal(res.writeTime, '1985-03-18T07:20:00.123000000Z');
    });
  });

  it('supports server timestamps', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, create(document('map', {
          mapValue: {
            fields: {}
          },
          value_type: 'mapValue'
        }),
        fieldTransform('field', 'REQUEST_TIME', 'map.field', 'REQUEST_TIME')));

      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').create({
      field: Firestore.FieldValue.serverTimestamp(),
      map: {field: Firestore.FieldValue.serverTimestamp()}
    });
  });

  it('requires an object', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').create(null);
    }, new RegExp('Argument "data" is not a valid Document. Input is not a ' +
        'JavaScript object\.'));
  });

  it('doesn\'t accept arrays', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').create([42]);
    }, new RegExp('Argument "data" is not a valid Document. Input is not a ' +
        'JavaScript object\.'));
  });
});

describe('update document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('generates proto', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(document()));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').update({});
  });

  it('supports nested server timestamps', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(
          document('a', {
              value_type: 'mapValue',
              mapValue: {
                fields: {}
              }
            }, 'c', {
            value_type: 'mapValue',
            mapValue: {
              fields: {}
            }
          }),
          updateMask('a'),
          fieldTransform('a.b', 'REQUEST_TIME', 'c.d', 'REQUEST_TIME')));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').update({
      a: { b: Firestore.FieldValue.serverTimestamp() },
      'c.d': Firestore.FieldValue.serverTimestamp()
    }, {exists: true});
  });

  it('returns update time', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(document()));

      callback(null, {
        commitTime: {
          nanos: 0,
          seconds: 0
        },
        writeResults: [
          {
            updateTime: {
              nanos: 123000000,
              seconds: 479978400
            }
          }
        ]
      });
    };

    return firestore.doc('collectionId/documentId').update({}).then(res => {
      assert.equal(res.writeTime, '1985-03-18T07:20:00.123000000Z');
    });
  });

  it('with last update time precondition', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(document('foo',  'bar'), updateMask('foo'),
        /*transform */ null, {
          updateTime: {
            nanos: 123000000,
            seconds: 479978400
          }
        }));
      callback(null, defaultWriteResult);
    };

    return Promise.all([
        firestore.doc('collectionId/documentId').update(
          { foo: 'bar' },
          {lastUpdateTime: '1985-03-18T07:20:00.123000000Z'}),
        firestore.doc('collectionId/documentId').update(
          'foo' ,'bar',
          {lastUpdateTime: '1985-03-18T07:20:00.123000000Z'})
    ]);
  });

  it('with invalid last update time precondition', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update(
          {},
          {lastUpdateTime: 'foo'});
    }, /Specify a valid ISO 8601 timestamp for "lastUpdateTime"\./);
  });

  it('with top-level document', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(document('foo', 'bar'), updateMask('foo')));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').update({
      foo: 'bar'
    });
  });

  it('with nested document', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(document(
        'a', {
          value_type: 'mapValue',
          mapValue: {
            fields: {
              b: {
                value_type: 'mapValue',
                mapValue: {
                  fields: {
                    c: {
                      value_type: 'stringValue',
                      stringValue: 'foobar'
                    }
                  }
                }
              }
            }
          }
        },
        'foo', {
          value_type: 'mapValue',
          mapValue: {
            fields: {
              bar: {
                value_type: 'stringValue',
                stringValue: 'foobar'
              }
            }
          }
        }), updateMask('foo.bar', 'a.b.c')));

      callback(null, defaultWriteResult);
    };

    return Promise.all([
      firestore.doc('collectionId/documentId').update({
        'foo.bar': 'foobar',
        'a.b.c': 'foobar'
      }),
      firestore.doc('collectionId/documentId').update(
        'foo.bar', 'foobar',
        new Firestore.FieldPath('a', 'b', 'c'), 'foobar'
      )
    ]);
  });

  it('with two nested fields ', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(document(
        'foo', {
          mapValue: {
            fields: {
              bar: {
                stringValue: 'two',
                value_type: 'stringValue'
              },
              deep: {
                mapValue: {
                  fields: {
                    bar: {
                      stringValue: 'two',
                      value_type: 'stringValue'
                    },
                    foo: {
                      stringValue: 'one',
                      value_type: 'stringValue'
                    }
                  }
                },
                value_type: 'mapValue'
              },
              foo: {
                stringValue: 'one',
                value_type: 'stringValue'
              }
            }
          },
          value_type: 'mapValue'
        }), updateMask('foo.foo', 'foo.bar', 'foo.deep.foo', 'foo.deep.bar')));

      callback(null, defaultWriteResult);
    };
    return Promise.all([
      firestore.doc('collectionId/documentId').update({
        'foo.foo': 'one',
        'foo.bar': 'two',
        'foo.deep.foo': 'one',
        'foo.deep.bar': 'two',
      }),
      firestore.doc('collectionId/documentId').update(
        'foo.foo', 'one',
        'foo.bar', 'two',
        'foo.deep.foo', 'one',
        'foo.deep.bar', 'two'
      ),
    ]);
  });

  it('with field with dot ', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(document(
          'a.b', 'c'), updateMask('`a.b`')));

      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').update(
        new Firestore.FieldPath('a.b'), 'c'
    );
  });

  it('with conflicting update', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        foo: 'foobar',
        'foo.bar': 'foobar'
      });
    }, /Field "foo" has conflicting definitions\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        foo: 'foobar',
        'foo.bar.foobar': 'foobar'
      });
    }, /Field "foo" has conflicting definitions\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        'foo.bar': 'foobar',
        foo: 'foobar',
      });
    }, /Field "foo" has conflicting definitions\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        'foo.bar': 'foobar',
        'foo.bar.foo': 'foobar',
      });
    }, /Field "foo.bar" has conflicting definitions\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        'foo.bar': { foo: 'foobar'},
        'foo.bar.foo': 'foobar'
      });
    }, /Field "foo.bar.foo" has conflicting definitions\./);
  });

  it('with valid field paths', function() {
    let validFields = [
      'foo.bar',
      '_',
      'foo.bar.foobar',
      '\n`'
    ];

    for (let i = 0; i < validFields.length; ++i) {
      firestore.collection('col').select(validFields[i]);
    }
  });

  it('with invalid field paths', function() {
    let invalidFields = [
      '',
      '.a',
      'a.',
      '.a.',
      'a..a',
      'a*a',
      'a/a',
      'a[a' ,
      'a]a'
    ];

    for (let i = 0; i < invalidFields.length; ++i) {
      try {
        firestore.collection('col').select(invalidFields[i]);
      } catch (err) {
        assert.ok(err.message.match(
            /Argument at index 0 is not a valid FieldPath. .*/));
      }
    }
  });

  it('doesn\'t accept argument after precondition', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update(
          'foo', 'bar', {exists: true}, 'foo');
    }, INVALID_ARGUMENTS_TO_UPDATE);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update(
          { foo: 'bar'}, {exists: true}, 'foo');
    }, INVALID_ARGUMENTS_TO_UPDATE);
  });

  it('accepts an object', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update(null);
    }, new RegExp('Argument "dataOrField" is not a valid Document. Input is ' +
        'not a JavaScript object\.'));
  });

  it('doesn\'t accept arrays', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update([42]);
    }, new RegExp('Argument "dataOrField" is not a valid Document. Input is ' +
        'not a JavaScript object.'));
  });

  it('with field delete', function() {
    firestore.api.Firestore._commit = function(request, options, callback) {
      requestEquals(request, update(document('bar', 'foobar'),
        updateMask('foo', 'bar')));
      callback(null, defaultWriteResult);
    };

    return firestore.doc('collectionId/documentId').update({
      foo: Firestore.FieldValue.delete(),
      bar: 'foobar'
    });
  });
});

describe('getCollections() method', function() {
  let firestore;
  let documentRef;

  beforeEach(function() {
    firestore = createInstance();
    documentRef = firestore.doc('coll/doc');
  });

  it('sorts results', function() {
    firestore.api.Firestore._listCollectionIds = function(
        request, options, callback) {
      assert.deepEqual(request, {
        parent: 'projects/test-project/databases/(default)/documents/coll/doc',
      });

      callback(null, ['second', 'first']);
    };

    return documentRef.getCollections().then(collections => {
      assert.equal(collections[0].path, 'coll/doc/first');
      assert.equal(collections[1].path, 'coll/doc/second');
    });
  });
});
