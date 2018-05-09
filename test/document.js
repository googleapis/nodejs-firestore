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

const assert = require('power-assert');
const Buffer = require('safe-buffer').Buffer;
const extend = require('extend');
const grpc = require('google-gax').grpc().grpc;
const is = require('is');
const through = require('through2');

const Firestore = require('../');

const DATABASE_ROOT = 'projects/test-project/databases/(default)';

const INVALID_ARGUMENTS_TO_UPDATE = new RegExp(
  'Update\\(\\) requires either ' +
    'a single JavaScript object or an alternating list of field/value pairs ' +
    'that can be followed by an optional precondition.'
);

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

function createInstance() {
  return new Firestore({
    projectId: 'test-project',
    sslCreds: grpc.credentials.createInsecure(),
  });
}

function buildWrite_(document, mask, transform, precondition) {
  let writes = [];

  if (document) {
    let update = extend(true, {}, document);
    delete update.updateTime;
    delete update.createTime;

    writes.push({update});

    if (mask) {
      writes[0].updateMask = mask;
    }
  }

  if (transform) {
    writes.push({transform: transform});
  }

  if (precondition) {
    writes[0].currentDocument = precondition;
  }

  return {writes: writes};
}

function set(document, mask, transform, precondition) {
  return buildWrite_(document, mask, transform, precondition);
}

function update(document, mask, transform, precondition) {
  precondition = precondition || {exists: true};
  mask = mask || updateMask();
  return buildWrite_(document, mask, transform, precondition);
}

function create(document, transform) {
  return buildWrite_(document, /* updateMask */ null, transform, {
    exists: false,
  });
}

function retrieve() {
  return {documents: [`${DATABASE_ROOT}/documents/collectionId/documentId`]};
}

function remove(document, precondition) {
  let writes = [
    {delete: `${DATABASE_ROOT}/documents/collectionId/${document}`},
  ];

  if (precondition) {
    writes[0].currentDocument = precondition;
  }

  return {writes: writes};
}

function document(field, value) {
  let document = {
    name: `${DATABASE_ROOT}/documents/collectionId/documentId`,
    fields: {},
    createTime: {seconds: 1, nanos: 2},
    updateTime: {seconds: 3, nanos: 4},
  };

  for (let i = 0; i < arguments.length; i += 2) {
    field = arguments[i];
    value = arguments[i + 1];

    if (is.string(value)) {
      document.fields[field] = {
        valueType: 'stringValue',
        stringValue: value,
      };
    } else {
      document.fields[field] = value;
    }
  }

  return document;
}

function updateMask(/* field */) {
  return arguments.length === 0
    ? {}
    : {fieldPaths: Array.prototype.slice.call(arguments)};
}

function found(document) {
  return {found: document, readTime: {seconds: 5, nanos: 6}};
}

function missing(document) {
  return {missing: document.name, readTime: {seconds: 5, nanos: 6}};
}

function fieldTransform(field, transform) {
  let proto = [];

  for (let i = 0; i < arguments.length; i += 2) {
    field = arguments[i];
    transform = arguments[i + 1];

    proto.push({
      fieldPath: field,
      setToServerValue: transform,
    });
  }

  return {
    document: `${DATABASE_ROOT}/documents/collectionId/documentId`,
    fieldTransforms: proto,
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

function writeResult(count) {
  const res = {
    commitTime: {
      nanos: 0,
      seconds: 1,
    },
  };

  if (count > 0) {
    res.writeResults = [];

    for (let i = 1; i <= count; ++i) {
      res.writeResults.push({
        updateTime: {
          nanos: i * 2,
          seconds: i * 2 + 1,
        },
      });
    }
  }

  return res;
}

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
    }, /Argument "collectionPath" is not a valid ResourcePath. Path must be a non-empty string./);

    let collection = documentRef.collection('col');
    assert.equal(collection.id, 'col');

    assert.throws(() => {
      documentRef.collection('col/doc');
    }, /Argument "collectionPath" must point to a collection, but was "col\/doc". Your path does not contain an odd number of components\./);

    collection = documentRef.collection('col/doc/col');
    assert.equal(collection.id, 'col');
  });

  it('has path property', function() {
    assert.equal(documentRef.path, 'collectionId/documentId');
  });

  it('has parent property', function() {
    assert.equal(documentRef.parent.path, 'collectionId');
  });

  it('has isEqual() method', function() {
    let doc1 = firestore.doc('coll/doc1');
    let doc1Equals = firestore.doc('coll/doc1');
    let doc2 = firestore.doc('coll/doc1/coll/doc1');
    assert.ok(doc1.isEqual(doc1Equals));
    assert.ok(!doc1.isEqual(doc2));
  });
});

describe('serialize document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('serializes to Protobuf JS', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document('bytes', {
            valueType: 'bytesValue',
            bytesValue: Buffer.from('AG=', 'base64'),
          })
        )
      );
      callback(null, writeResult(1));
    };

    return firestore
      .doc('collectionId/documentId')
      .set({bytes: Buffer.from('AG=', 'base64')});
  });

  it("doesn't serialize unsupported types", function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: undefined});
    }, /Invalid use of type "undefined" as a Firestore argument./);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .set({foo: Firestore.FieldPath.documentId()});
    }, /Cannot use object of type "FieldPath" as a Firestore value./);

    assert.throws(() => {
      class Foo {}
      firestore.doc('collectionId/documentId').set({foo: new Foo()});
    }, /Argument "data" is not a valid Document. Couldn't serialize object of type "Foo". Firestore doesn't support JavaScript objects with custom prototypes \(i.e. objects that were created via the 'new' operator\)./);
  });

  it('serializes date before 1970', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document('moonLanding', {
            valueType: 'timestampValue',
            timestampValue: {
              nanos: 123000000,
              seconds: -14182920,
            },
          })
        )
      );

      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({
      moonLanding: new Date('Jul 20 1969 20:18:00.123 UTC'),
    });
  });

  it('serializes unicode keys', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, set(document('😀', '😜')));
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({
      '😀': '😜',
    });
  });

  it('accepts both blob formats', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document(
            'blob1',
            {valueType: 'bytesValue', bytesValue: new Uint8Array([0, 1, 2])},
            'blob2',
            {
              valueType: 'bytesValue',
              bytesValue: Buffer.from([0, 1, 2]),
            }
          )
        )
      );

      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({
      blob1: new Uint8Array([0, 1, 2]),
      blob2: Buffer.from([0, 1, 2]),
    });
  });

  it('supports NaN and Infinity', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      let fields = request.writes[0].update.fields;
      assert.ok(
        typeof fields.nanValue.doubleValue === 'number' &&
          isNaN(fields.nanValue.doubleValue)
      );
      assert.equal(fields.posInfinity.doubleValue, Infinity);
      assert.equal(fields.negInfinity.doubleValue, -Infinity);

      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({
      nanValue: NaN,
      posInfinity: Infinity,
      negInfinity: -Infinity,
    });
  });

  it('supports server timestamps', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document('foo', 'bar'),
          /* updateMask= */ null,
          fieldTransform('field', 'REQUEST_TIME', 'map.field', 'REQUEST_TIME')
        )
      );

      callback(null, writeResult(2));
    };

    return firestore.doc('collectionId/documentId').set({
      foo: 'bar',
      field: Firestore.FieldValue.serverTimestamp(),
      map: {field: Firestore.FieldValue.serverTimestamp()},
    });
  });

  it("doesn't support server timestamp in array", function() {
    const expectedErr = /FieldValue transformations are not supported inside of array values./;

    assert.throws(() => {
      return firestore.doc('collectionId/documentId').set({
        array: [Firestore.FieldValue.serverTimestamp()],
      });
    }, expectedErr);

    assert.throws(() => {
      return firestore.doc('collectionId/documentId').set({
        map: {
          array: [Firestore.FieldValue.serverTimestamp()],
        },
      });
    }, expectedErr);

    assert.throws(() => {
      return firestore.doc('collectionId/documentId').set({
        array: [{map: Firestore.FieldValue.serverTimestamp()}],
      });
    }, expectedErr);

    assert.throws(() => {
      return firestore.doc('collectionId/documentId').set({
        array: {
          map: {
            array: [Firestore.FieldValue.serverTimestamp()],
          },
        },
      });
    }, expectedErr);
  });

  it('with invalid geopoint', function() {
    const expectedErr = /Argument ".*" is not a valid number\./;

    assert.throws(() => {
      new Firestore.GeoPoint('57.2999988', 'INVALID');
    }, expectedErr);

    assert.throws(() => {
      new Firestore.GeoPoint('INVALID', '-4.4499982');
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
    }, /Argument "dataOrField" is not a valid Document. Input object is deeper than 20 levels or contains a cycle./);
  });

  it('is able to write a document reference with cycles', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document('ref', {
            referenceValue:
              'projects/test-project/databases/(default)/documents/collectionId/documentId',
            valueType: 'referenceValue',
          })
        )
      );

      callback(null, writeResult(1));
    };

    // The Firestore Admin SDK adds a cyclic reference to the 'Firestore' member
    // of 'DocumentReference'. We emulate this behavior in this test to verify
    // that we can properly serialize DocumentReference instances, even if they
    // have cyclic references (we shouldn't try to validate them beyond the
    // instanceof check).
    let ref = firestore.doc('collectionId/documentId');
    ref.firestore.firestore = firestore;
    return ref.set({ref});
  });
});

describe('deserialize document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('deserializes Protobuf JS', function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(
        found(
          document('foo', {
            valueType: 'bytesValue',
            bytesValue: Buffer.from('AG=', 'base64'),
          })
        )
      );
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(res => {
        assert.deepEqual(res.data(), {foo: Buffer.from('AG=', 'base64')});
      });
  });

  it('ignores intermittent stream failures', function() {
    let attempts = 1;

    firestore._firestoreClient._batchGetDocuments = function() {
      if (attempts < 3) {
        ++attempts;
        throw new Error('Expected error');
      } else {
        return stream(found(document()));
      }
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(() => {
        assert.equal(3, attempts);
      });
  });

  it('deserializes date before 1970', function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(
        found(
          document('moonLanding', {
            valueType: 'timestampValue',
            timestampValue: {
              nanos: 123000000,
              seconds: -14182920,
            },
          })
        )
      );
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(res => {
        assert.equal(
          res.get('moonLanding').getTime(),
          new Date('Jul 20 1969 20:18:00.123 UTC').getTime()
        );
      });
  });

  it('returns undefined for unknown fields', function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(found(document()));
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(res => {
        assert.equal(res.get('bar'), undefined);
        assert.equal(res.get('bar.foo'), undefined);
      });
  });

  it('supports NaN and Infinity', function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(
        found(
          document(
            'nanValue',
            {valueType: 'doubleValue', doubleValue: 'NaN'},
            'posInfinity',
            {valueType: 'doubleValue', doubleValue: 'Infinity'},
            'negInfinity',
            {valueType: 'doubleValue', doubleValue: '-Infinity'}
          )
        )
      );
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(res => {
        assert.ok(
          typeof res.get('nanValue') === 'number' && isNaN(res.get('nanValue'))
        );
        assert.equal(res.get('posInfinity'), Infinity);
        assert.equal(res.get('negInfinity'), -Infinity);
      });
  });

  it("doesn't deserialize unsupported types", function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(found(document('moonLanding', {valueType: 'foo'})));
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(doc => {
        assert.throws(() => {
          doc.data();
        }, /Cannot decode type from Firestore Value: {"valueType":"foo"}/);
      });
  });

  it("doesn't deserialize invalid latitude", function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(
        found(
          document('geoPointValue', {
            valueType: 'geoPointValue',
            geoPointValue: {
              latitude: 'foo',
              longitude: -122.947778,
            },
          })
        )
      );
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(doc => {
        assert.throws(() => {
          doc.data();
        }, /Argument "latitude" is not a valid number\./);
      });
  });

  it("doesn't deserialize invalid longitude", function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(
        found(
          document('geoPointValue', {
            valueType: 'geoPointValue',
            geoPointValue: {
              latitude: 50.1430847,
              longitude: 'foo',
            },
          })
        )
      );
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(doc => {
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
    firestore._firestoreClient._batchGetDocuments = function(request) {
      requestEquals(request, retrieve());

      return stream(
        found(
          document('foo', {
            valueType: 'mapValue',
            mapValue: {
              fields: {
                bar: {
                  valueType: 'stringValue',
                  stringValue: 'foobar',
                },
              },
            },
          })
        )
      );
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(result => {
        assert.deepEqual(result.data(), {foo: {bar: 'foobar'}});
        assert.deepEqual(result.get('foo'), {bar: 'foobar'});
        assert.equal(result.get('foo.bar'), 'foobar');
        assert.equal(
          result.get(new Firestore.FieldPath('foo', 'bar')),
          'foobar'
        );
        assert.equal(result.ref.id, 'documentId');
      });
  });

  it('returns read, update and create times', function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(found(document()));
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(result => {
        assert.equal(result.createTime, '1970-01-01T00:00:01.000000002Z');
        assert.equal(result.updateTime, '1970-01-01T00:00:03.000000004Z');
        assert.equal(result.readTime, '1970-01-01T00:00:05.000000006Z');
      });
  });

  it('returns not found', function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(missing(document()));
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(result => {
        assert.equal(result.exists, false);
        assert.equal(result.readTime, '1970-01-01T00:00:05.000000006Z');
        assert.equal(null, result.data());
        assert.equal(null, result.get('foo'));
      });
  });

  it('throws error', function(done) {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(new Error('RPC Error'));
    };

    firestore
      .doc('collectionId/documentId')
      .get()
      .catch(err => {
        assert.equal(err.message, 'RPC Error');
        done();
      });
  });

  it('requires field path', function() {
    firestore._firestoreClient._batchGetDocuments = function() {
      return stream(
        found(
          document('foo', {
            valueType: 'mapValue',
            mapValue: {
              fields: {
                bar: {
                  valueType: 'stringValue',
                  stringValue: 'foobar',
                },
              },
            },
          })
        )
      );
    };

    return firestore
      .doc('collectionId/documentId')
      .get()
      .then(doc => {
        assert.throws(() => {
          doc.get();
        }, /Argument "field" is not a valid FieldPath. Invalid use of type "undefined" as a Firestore argument./);
      });
  });
});

describe('delete document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('generates proto', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, remove('documentId'));

      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').delete();
  });

  it('returns update time', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, remove('documentId'));

      callback(null, {
        commitTime: {
          nanos: 123000000,
          seconds: 479978400,
        },
        writeResults: [{}],
      });
    };

    return firestore
      .doc('collectionId/documentId')
      .delete()
      .then(res => {
        assert.equal(res.writeTime, '1985-03-18T07:20:00.123000000Z');
      });
  });

  it('with last update time precondition', function() {
    let docRef = firestore.doc('collectionId/documentId');

    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        remove('documentId', {
          updateTime: {
            nanos: 123000000,
            seconds: 479978400,
          },
        })
      );

      callback(null, writeResult(1));
    };

    return Promise.all([
      docRef.delete({lastUpdateTime: '1985-03-18T07:20:00.123Z'}),
      docRef.delete({lastUpdateTime: '1985-03-18T07:20:00.123000Z'}),
      docRef.delete({lastUpdateTime: '1985-03-18T07:20:00.123000000Z'}),
    ]);
  });

  it('with invalid last update time precondition', function() {
    assert.throws(() => {
      return firestore
        .doc('collectionId/documentId')
        .delete({lastUpdateTime: 1337});
    }, /"lastUpdateTime" is not a string./);
  });

  it('throws if "exists" is not a boolean', () => {
    assert.throws(() => {
      return firestore.doc('collectionId/documentId').delete({exists: 42});
    }, /"exists" is not a boolean./);
  });

  it('throws if no delete conditions are provided', () => {
    assert.throws(() => {
      return firestore.doc('collectionId/documentId').delete(42);
    }, /Input is not an object./);
  });

  it('throws if more than one condition is provided', () => {
    assert.throws(() => {
      return firestore
        .doc('collectionId/documentId')
        .delete({exists: false, lastUpdateTime: '1985-03-18T07:20:00.123Z'});
    }, /Input contains more than one condition./);
  });
});

describe('set document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('supports empty map', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, set(document()));
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({});
  });

  it('supports nested empty map', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document('a', {
            mapValue: {},
            valueType: 'mapValue',
          })
        )
      );
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({a: {}});
  });

  it('skips merges with just server timestamps', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          null,
          null,
          fieldTransform('a', 'REQUEST_TIME', 'b.c', 'REQUEST_TIME')
        )
      );
      callback(null, writeResult(1));
    };
    return firestore.doc('collectionId/documentId').set(
      {
        a: Firestore.FieldValue.serverTimestamp(),
        b: {c: Firestore.FieldValue.serverTimestamp()},
      },
      {merge: true}
    );
  });

  it('sends empty non-merge write even with just server timestamps', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document(), // The empty write clears the data on the server.
          null,
          fieldTransform('a', 'REQUEST_TIME', 'b.c', 'REQUEST_TIME')
        )
      );
      callback(null, writeResult(2));
    };

    return firestore.doc('collectionId/documentId').set({
      a: Firestore.FieldValue.serverTimestamp(),
      b: {c: Firestore.FieldValue.serverTimestamp()},
    });
  });

  it('supports document merges', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document('a', 'b', 'c', {
            mapValue: {
              fields: {
                d: {
                  stringValue: 'e',
                  valueType: 'stringValue',
                },
              },
            },
            valueType: 'mapValue',
          }),
          updateMask('a', 'c.d', 'f')
        )
      );
      callback(null, writeResult(1));
    };

    return firestore
      .doc('collectionId/documentId')
      .set(
        {a: 'b', c: {d: 'e'}, f: Firestore.FieldValue.delete()},
        {merge: true}
      );
  });

  it('supports document merges with field mask', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document(
            'a',
            'foo',
            'b',
            {
              mapValue: {
                fields: {
                  c: {
                    stringValue: 'foo',
                    valueType: 'stringValue',
                  },
                },
              },
              valueType: 'mapValue',
            },
            'd',
            {
              mapValue: {
                fields: {
                  e: {
                    stringValue: 'foo',
                    valueType: 'stringValue',
                  },
                },
              },
              valueType: 'mapValue',
            }
          ),
          updateMask('a', 'b', 'd.e', 'f')
        )
      );
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set(
      {
        a: 'foo',
        b: {c: 'foo'},
        d: {e: 'foo', ignore: 'foo'},
        f: Firestore.FieldValue.delete(),
        ignore: 'foo',
        ignoreMap: {a: 'foo'},
      },
      {mergeFields: ['a', new Firestore.FieldPath('b'), 'd.e', 'f']}
    );
  });

  it('supports document merges with empty field mask', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, set(document(), updateMask()));
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({}, {mergeFields: []});
  });

  it('supports document merges with field mask and empty maps', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document(
            'a',
            {
              mapValue: {
                fields: {
                  b: {
                    mapValue: {},
                    valueType: 'mapValue',
                  },
                },
              },
              valueType: 'mapValue',
            },
            'c',
            {
              mapValue: {
                fields: {
                  d: {
                    mapValue: {},
                    valueType: 'mapValue',
                  },
                },
              },
              valueType: 'mapValue',
            }
          ),
          updateMask('a', 'c.d')
        )
      );
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set(
      {
        a: {b: {}},
        c: {d: {}},
      },
      {mergeFields: ['a', new Firestore.FieldPath('c', 'd')]}
    );
  });

  it('supports document merges with field mask and server timestamps', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document(),
          updateMask('b', 'f'),
          fieldTransform(
            'a',
            'REQUEST_TIME',
            'b.c',
            'REQUEST_TIME',
            'd.e',
            'REQUEST_TIME'
          )
        )
      );
      callback(null, writeResult(2));
    };

    return firestore.doc('collectionId/documentId').set(
      {
        a: Firestore.FieldValue.serverTimestamp(),
        b: {c: Firestore.FieldValue.serverTimestamp()},
        d: {
          e: Firestore.FieldValue.serverTimestamp(),
          ignore: Firestore.FieldValue.serverTimestamp(),
        },
        f: Firestore.FieldValue.delete(),
        ignore: Firestore.FieldValue.serverTimestamp(),
        ignoreMap: {a: Firestore.FieldValue.serverTimestamp()},
      },
      {mergeFields: ['a', new Firestore.FieldPath('b'), 'd.e', 'f']}
    );
  });

  it('supports empty merge', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, set(document(), updateMask()));
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({}, {merge: true});
  });

  it('supports nested empty merge', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        set(
          document('a', {
            mapValue: {},
            valueType: 'mapValue',
          }),
          updateMask('a')
        )
      );
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({a: {}}, {merge: true});
  });

  it("doesn't split on dots", function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, set(document('a.b', 'c')));
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').set({'a.b': 'c'});
  });

  it('validates merge option', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: 'bar'}, 'foo');
    }, /Argument "options" is not a valid SetOptions. Input is not an object./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: 'bar'}, {merge: 42});
    }, /Argument "options" is not a valid SetOptions. "merge" is not a boolean./);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .set({foo: 'bar'}, {mergeFields: 42});
    }, /Argument "options" is not a valid SetOptions. "mergeFields" is not an array./);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .set({foo: 'bar'}, {mergeFields: [null]});
    }, /Argument "options" is not a valid SetOptions. Argument at index 0 is not a valid FieldPath./);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .set({foo: 'bar'}, {mergeFields: ['foobar']});
    }, /Input data is missing for field 'foobar'./);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .set({foo: 'bar'}, {merge: true, mergeFields: []});
    }, /Argument "options" is not a valid SetOptions. You cannot specify both "merge" and "mergeFields"./);
  });

  it('requires an object', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set(null);
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it("doesn't support non-merge deletes", function() {
    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .set({foo: Firestore.FieldValue.delete()});
    }, /FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);
  });

  it("doesn't accept arrays", function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set([42]);
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });
});

describe('create document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('creates document', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, create(document()));
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').create({});
  });

  it('returns update time', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, create(document()));

      callback(null, {
        commitTime: {
          nanos: 0,
          seconds: 0,
        },
        writeResults: [
          {
            updateTime: {
              nanos: 123000000,
              seconds: 479978400,
            },
          },
        ],
      });
    };

    return firestore
      .doc('collectionId/documentId')
      .create({})
      .then(res => {
        assert.equal(res.writeTime, '1985-03-18T07:20:00.123000000Z');
      });
  });

  it('supports server timestamps', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        create(
          null,
          fieldTransform('field', 'REQUEST_TIME', 'map.field', 'REQUEST_TIME')
        )
      );

      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').create({
      field: Firestore.FieldValue.serverTimestamp(),
      map: {field: Firestore.FieldValue.serverTimestamp()},
    });
  });

  it('supports nested empty map', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        create(
          document('a', {
            mapValue: {
              fields: {
                b: {
                  mapValue: {},
                  valueType: 'mapValue',
                },
              },
            },
            valueType: 'mapValue',
          })
        )
      );
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').create({a: {b: {}}});
  });

  it('requires an object', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').create(null);
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it("doesn't accept arrays", function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').create([42]);
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });
});

describe('update document', function() {
  let firestore;

  beforeEach(function() {
    firestore = createInstance();
  });

  it('generates proto', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, update(document('foo', 'bar'), updateMask('foo')));
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').update({foo: 'bar'});
  });

  it('supports nested server timestamps', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        update(
          document('foo', {
            valueType: 'mapValue',
            mapValue: {},
          }),
          updateMask('a', 'foo'),
          fieldTransform('a.b', 'REQUEST_TIME', 'c.d', 'REQUEST_TIME')
        )
      );
      callback(null, writeResult(2));
    };

    return firestore.doc('collectionId/documentId').update({
      foo: {},
      a: {b: Firestore.FieldValue.serverTimestamp()},
      'c.d': Firestore.FieldValue.serverTimestamp(),
    });
  });

  it('skips write for single server timestamp', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        update(null, null, fieldTransform('a', 'REQUEST_TIME'))
      );
      callback(null, writeResult(1));
    };

    return firestore
      .doc('collectionId/documentId')
      .update('a', Firestore.FieldValue.serverTimestamp());
  });

  it('supports nested empty map', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        update(
          document('a', {
            mapValue: {},
            valueType: 'mapValue',
          }),
          updateMask('a')
        )
      );
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').update({a: {}});
  });

  it('supports nested delete', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, update(document(), updateMask('a.b')));
      callback(null, writeResult(1));
    };

    return firestore
      .doc('collectionId/documentId')
      .update({'a.b': Firestore.FieldValue.delete()});
  });

  it('returns update time', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, update(document('foo', 'bar'), updateMask('foo')));

      callback(null, {
        commitTime: {
          nanos: 0,
          seconds: 0,
        },
        writeResults: [
          {
            updateTime: {
              nanos: 123000000,
              seconds: 479978400,
            },
          },
        ],
      });
    };

    return firestore
      .doc('collectionId/documentId')
      .update({foo: 'bar'})
      .then(res => {
        assert.equal(res.writeTime, '1985-03-18T07:20:00.123000000Z');
      });
  });

  it('with last update time precondition', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        update(document('foo', 'bar'), updateMask('foo'), /*transform */ null, {
          updateTime: {
            nanos: 123000000,
            seconds: 479978400,
          },
        })
      );
      callback(null, writeResult(1));
    };

    return Promise.all([
      firestore
        .doc('collectionId/documentId')
        .update(
          {foo: 'bar'},
          {lastUpdateTime: '1985-03-18T07:20:00.123000000Z'}
        ),
      firestore.doc('collectionId/documentId').update('foo', 'bar', {
        lastUpdateTime: '1985-03-18T07:20:00.123000000Z',
      }),
    ]);
  });

  it('with invalid last update time precondition', function() {
    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .update({foo: 'bar'}, {lastUpdateTime: 'foo'});
    }, /Specify a valid ISO 8601 timestamp for "lastUpdateTime"\./);
  });

  it('requires at least one field', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({});
    }, /At least one field must be updated./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update();
    }, /Function 'update\(\)' requires at least 1 argument./);
  });

  it('rejects nested deletes', function() {
    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .update({a: {b: Firestore.FieldValue.delete()}});
    }, /FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .update('a', {b: Firestore.FieldValue.delete()});
    }, /FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);
  });

  it('with top-level document', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, update(document('foo', 'bar'), updateMask('foo')));
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').update({
      foo: 'bar',
    });
  });

  it('with nested document', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        update(
          document(
            'a',
            {
              valueType: 'mapValue',
              mapValue: {
                fields: {
                  b: {
                    valueType: 'mapValue',
                    mapValue: {
                      fields: {
                        c: {
                          valueType: 'stringValue',
                          stringValue: 'foobar',
                        },
                      },
                    },
                  },
                },
              },
            },
            'foo',
            {
              valueType: 'mapValue',
              mapValue: {
                fields: {
                  bar: {
                    valueType: 'stringValue',
                    stringValue: 'foobar',
                  },
                },
              },
            }
          ),
          updateMask('a.b.c', 'foo.bar')
        )
      );

      callback(null, writeResult(1));
    };

    return Promise.all([
      firestore.doc('collectionId/documentId').update({
        'foo.bar': 'foobar',
        'a.b.c': 'foobar',
      }),
      firestore
        .doc('collectionId/documentId')
        .update(
          'foo.bar',
          'foobar',
          new Firestore.FieldPath('a', 'b', 'c'),
          'foobar'
        ),
    ]);
  });

  it('with two nested fields ', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        update(
          document('foo', {
            mapValue: {
              fields: {
                bar: {
                  stringValue: 'two',
                  valueType: 'stringValue',
                },
                deep: {
                  mapValue: {
                    fields: {
                      bar: {
                        stringValue: 'two',
                        valueType: 'stringValue',
                      },
                      foo: {
                        stringValue: 'one',
                        valueType: 'stringValue',
                      },
                    },
                  },
                  valueType: 'mapValue',
                },
                foo: {
                  stringValue: 'one',
                  valueType: 'stringValue',
                },
              },
            },
            valueType: 'mapValue',
          }),
          updateMask('foo.bar', 'foo.deep.bar', 'foo.deep.foo', 'foo.foo')
        )
      );

      callback(null, writeResult(1));
    };
    return Promise.all([
      firestore.doc('collectionId/documentId').update({
        'foo.foo': 'one',
        'foo.bar': 'two',
        'foo.deep.foo': 'one',
        'foo.deep.bar': 'two',
      }),
      firestore
        .doc('collectionId/documentId')
        .update(
          'foo.foo',
          'one',
          'foo.bar',
          'two',
          'foo.deep.foo',
          'one',
          'foo.deep.bar',
          'two'
        ),
    ]);
  });

  it('with nested field and document transform ', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        update(
          document('a', {
            mapValue: {
              fields: {
                b: {
                  valueType: 'mapValue',
                  mapValue: {
                    fields: {
                      keep: {
                        stringValue: 'keep',
                        valueType: 'stringValue',
                      },
                    },
                  },
                },
                c: {
                  valueType: 'mapValue',
                  mapValue: {
                    fields: {
                      keep: {
                        stringValue: 'keep',
                        valueType: 'stringValue',
                      },
                    },
                  },
                },
              },
            },
            valueType: 'mapValue',
          }),
          updateMask('a.b.delete', 'a.b.keep', 'a.c.delete', 'a.c.keep')
        )
      );

      callback(null, writeResult(1));
    };
    return firestore.doc('collectionId/documentId').update({
      'a.b.delete': Firestore.FieldValue.delete(),
      'a.b.keep': 'keep',
      'a.c.delete': Firestore.FieldValue.delete(),
      'a.c.keep': 'keep',
    });
  });

  it('with field with dot ', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(request, update(document('a.b', 'c'), updateMask('`a.b`')));

      callback(null, writeResult(1));
    };

    return firestore
      .doc('collectionId/documentId')
      .update(new Firestore.FieldPath('a.b'), 'c');
  });

  it('with conflicting update', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        foo: 'foobar',
        'foo.bar': 'foobar',
      });
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo" was specified multiple times\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        foo: 'foobar',
        'foo.bar.foobar': 'foobar',
      });
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo" was specified multiple times\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        'foo.bar': 'foobar',
        foo: 'foobar',
      });
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo" was specified multiple times\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        'foo.bar': 'foobar',
        'foo.bar.foo': 'foobar',
      });
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo.bar" was specified multiple times\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        'foo.bar': {foo: 'foobar'},
        'foo.bar.foo': 'foobar',
      });
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo.bar" was specified multiple times\./);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .update('foo.bar', 'foobar', 'foo', 'foobar');
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo" was specified multiple times\./);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .update('foo', {foobar: 'foobar'}, 'foo.bar', {foobar: 'foobar'});
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo" was specified multiple times\./);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .update('foo', {foobar: 'foobar'}, 'foo.bar', {foobar: 'foobar'});
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo" was specified multiple times\./);
  });

  it('with valid field paths', function() {
    let validFields = ['foo.bar', '_', 'foo.bar.foobar', '\n`'];

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
      'a[a',
      'a]a',
    ];

    for (let i = 0; i < invalidFields.length; ++i) {
      assert.throws(() => {
        const doc = {};
        doc[invalidFields[i]] = 'foo';
        firestore.doc('col/doc').update(doc);
      }, /.*Argument ".*" is not a valid FieldPath.*/);
    }
  });

  it("doesn't accept argument after precondition", function() {
    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .update('foo', 'bar', {exists: true});
    }, INVALID_ARGUMENTS_TO_UPDATE);

    assert.throws(() => {
      firestore
        .doc('collectionId/documentId')
        .update({foo: 'bar'}, {exists: true}, 'foo');
    }, INVALID_ARGUMENTS_TO_UPDATE);
  });

  it('accepts an object', function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update(null);
    }, /Argument "dataOrField" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it("doesn't accept arrays", function() {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update([42]);
    }, /Argument "dataOrField" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it('with field delete', function() {
    firestore._firestoreClient._commit = function(request, options, callback) {
      requestEquals(
        request,
        update(document('bar', 'foobar'), updateMask('bar', 'foo'))
      );
      callback(null, writeResult(1));
    };

    return firestore.doc('collectionId/documentId').update({
      foo: Firestore.FieldValue.delete(),
      bar: 'foobar',
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
    firestore._firestoreClient._listCollectionIds = function(
      request,
      options,
      callback
    ) {
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
