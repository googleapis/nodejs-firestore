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

import assert from 'power-assert';
import extend from 'extend';
import is from 'is';
import through2 from 'through2';

import {google} from '../protos/firestore_proto_api';
import * as Firestore from '../src';
import {createInstance, InvalidApiUsage} from './util/helpers';
import {AnyDuringMigration, AnyJs} from '../src/types';
import {DocumentSnapshot, QueryDocumentSnapshot} from '../src';

const REQUEST_TIME = google.firestore.v1beta1.DocumentTransform.FieldTransform
                         .ServerValue.REQUEST_TIME;

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;

const INVALID_ARGUMENTS_TO_UPDATE = new RegExp(
    'Update\\(\\) requires either ' +
    'a single JavaScript object or an alternating list of field/value pairs ' +
    'that can be followed by an optional precondition.');

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

function buildWrite_(document?, mask?, transform?, precondition?) {
  const writes: AnyDuringMigration[] = [];

  if (document) {
    const update = extend(true, {}, document);
    delete update.updateTime;
    delete update.createTime;

    writes.push({update});

    if (mask) {
      writes[0].updateMask = mask;
    }
  }

  if (transform) {
    writes.push({transform});
  }

  if (precondition) {
    writes[0].currentDocument = precondition;
  }

  return {writes};
}

function set(document, mask?, transform?, precondition?) {
  return buildWrite_(document, mask, transform, precondition);
}

function update(document, mask?, transform?, precondition?) {
  precondition = precondition || {exists: true};
  mask = mask || updateMask();
  return buildWrite_(document, mask, transform, precondition);
}

function create(document, transform?) {
  return buildWrite_(document, /* updateMask */ null, transform, {
    exists: false,
  });
}

function retrieve() {
  return {documents: [`${DATABASE_ROOT}/documents/collectionId/documentId`]};
}

function remove(document, precondition?) {
  const writes: AnyDuringMigration[] = [
    {delete: `${DATABASE_ROOT}/documents/collectionId/${document}`},
  ];

  if (precondition) {
    writes[0].currentDocument = precondition;
  }

  return {writes};
}

function document(...fieldsAndValues) {
  const document = {
    name: `${DATABASE_ROOT}/documents/collectionId/documentId`,
    fields: {},
    createTime: {seconds: 1, nanos: 2},
    updateTime: {seconds: 3, nanos: 4},
  };

  for (let i = 0; i < arguments.length; i += 2) {
    const field = arguments[i];
    const value = arguments[i + 1];

    if (is.string(value)) {
      document.fields[field] = {
        stringValue: value,
      };
    } else {
      document.fields[field] = value;
    }
  }

  return document;
}

function updateMask(...fields) {
  return arguments.length === 0 ?
      {} :
      {fieldPaths: Array.prototype.slice.call(arguments)};
}

function found(document) {
  return {found: document, readTime: {seconds: 5, nanos: 6}};
}

function missing(document) {
  return {missing: document.name, readTime: {seconds: 5, nanos: 6}};
}

function fieldTransform(...fieldsAndTransforms) {
  const proto: AnyDuringMigration[] = [];

  for (let i = 0; i < arguments.length; i += 2) {
    const field = arguments[i];
    const transform = arguments[i + 1];

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
  const proto = {
    database: DATABASE_ROOT,
  };

  for (protoOperation of Array.prototype.slice.call(arguments, 1)) {
    for (const key in protoOperation) {
      if (protoOperation.hasOwnProperty(key)) {
        if (proto[key]) {
          proto[key] = proto[key].concat(protoOperation[key]);
        } else {
          proto[key] = protoOperation[key];
        }
      }
    }
  }

  assert.deepStrictEqual(actual, proto);
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

function writeResult(count) {
  const res: AnyDuringMigration = {
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

describe('DocumentReference interface', () => {
  let firestore;
  let documentRef;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
      documentRef = firestore.doc('collectionId/documentId');
    });
  });

  it('has collection() method', () => {
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

  it('has path property', () => {
    assert.equal(documentRef.path, 'collectionId/documentId');
  });

  it('has parent property', () => {
    assert.equal(documentRef.parent.path, 'collectionId');
  });

  it('has isEqual() method', () => {
    const doc1 = firestore.doc('coll/doc1');
    const doc1Equals = firestore.doc('coll/doc1');
    const doc2 = firestore.doc('coll/doc1/coll/doc1');
    assert.ok(doc1.isEqual(doc1Equals));
    assert.ok(!doc1.isEqual(doc2));
  });
});

describe('serialize document', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('serializes to Protobuf JS', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, set(document('bytes', {
                        bytesValue: Buffer.from('AG=', 'base64'),
                      })));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({
        bytes: Buffer.from('AG=', 'base64')
      });
    });
  });

  it('doesn\'t serialize unsupported types', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: undefined});
    }, /Invalid use of type "undefined" as a Firestore argument./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({
        foo: Firestore.FieldPath.documentId()
      });
    }, /Cannot use object of type "FieldPath" as a Firestore value./);

    assert.throws(() => {
      class Foo {}
      firestore.doc('collectionId/documentId').set({foo: new Foo()});
    }, /Argument "data" is not a valid Document. Couldn't serialize object of type "Foo". Firestore doesn't support JavaScript objects with custom prototypes \(i.e. objects that were created via the 'new' operator\)./);
  });

  it('serializes date before 1970', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, set(document('moonLanding', {
                        timestampValue: {
                          nanos: 123000000,
                          seconds: -14182920,
                        },
                      })));

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({
        moonLanding: new Date('Jul 20 1969 20:18:00.123 UTC'),
      });
    });
  });

  it('serializes unicode keys', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, set(document('😀', '😜')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({
        '😀': '😜',
      });
    });
  });

  it('accepts both blob formats', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            set(document(
                'blob1', {bytesValue: new Uint8Array([0, 1, 2])}, 'blob2', {
                  bytesValue: Buffer.from([0, 1, 2]),
                })));

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({
        blob1: new Uint8Array([0, 1, 2]),
        blob2: Buffer.from([0, 1, 2]),
      });
    });
  });

  it('supports NaN and Infinity', () => {
    const overrides = {
      commit: (request, options, callback) => {
        const fields = request.writes[0].update.fields;
        assert.ok(
            typeof fields.nanValue.doubleValue === 'number' &&
            isNaN(fields.nanValue.doubleValue));
        assert.equal(fields.posInfinity.doubleValue, Infinity);
        assert.equal(fields.negInfinity.doubleValue, -Infinity);

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({
        nanValue: NaN,
        posInfinity: Infinity,
        negInfinity: -Infinity,
      });
    });
  });

  it('with invalid geopoint', () => {
    assert.throws(() => {
      new Firestore.GeoPoint(57.2999988, 'INVALID' as InvalidApiUsage);
    }, /Argument "longitude" is not a valid number/);

    assert.throws(() => {
      new Firestore.GeoPoint('INVALID' as InvalidApiUsage, -4.4499982);
    }, /Argument "latitude" is not a valid number/);

    assert.throws(() => {
      new (Firestore as InvalidApiUsage).GeoPoint();
    }, /Argument "latitude" is not a valid number/);

    assert.throws(() => {
      new Firestore.GeoPoint(NaN as InvalidApiUsage, 0);
    }, /Argument "latitude" is not a valid number/);

    assert.throws(() => {
      new Firestore.GeoPoint(Infinity as InvalidApiUsage, 0);
    }, /Argument "latitude" is not a valid number/);

    assert.throws(() => {
      new Firestore.GeoPoint(91, 0);
    }, /Argument "latitude" is not a valid number. Value must be within \[-90, 90] inclusive, but was: 91/);

    assert.throws(() => {
      new Firestore.GeoPoint(90, 181);
    }, /Argument "longitude" is not a valid number. Value must be within \[-180, 180] inclusive, but was: 181/);
  });

  it('resolves infinite nesting', () => {
    const obj: AnyDuringMigration = {};
    obj.foo = obj;

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update(obj);
    }, /Argument "dataOrField" is not a valid Document. Input object is deeper than 20 levels or contains a cycle./);
  });

  it('is able to write a document reference with cycles', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request, set(document('ref', {
              referenceValue: `projects/${
                  PROJECT_ID}/databases/(default)/documents/collectionId/documentId`,
            })));

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      // The Firestore Admin SDK adds a cyclic reference to the 'Firestore'
      // member of 'DocumentReference'. We emulate this behavior in this
      // test to verify that we can properly serialize DocumentReference
      // instances, even if they have cyclic references (we shouldn't try to
      // validate them beyond the instanceof check).
      const ref = firestore.doc('collectionId/documentId');
      ref.firestore.firestore = firestore;
      return ref.set({ref});
    });
  });
});

describe('deserialize document', () => {
  it('deserializes Protobuf JS', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found(document('foo', {
          valueType: 'bytesValue',
          bytesValue: Buffer.from('AG=', 'base64'),
        })));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(res => {
        assert.deepStrictEqual(res.data(), {foo: Buffer.from('AG=', 'base64')});
      });
    });
  });

  it('ignores intermittent stream failures', () => {
    let attempts = 1;

    const overrides = {
      batchGetDocuments: () => {
        if (attempts < 3) {
          ++attempts;
          throw new Error('Expected error');
        } else {
          return stream(found(document()));
        }
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(() => {
        assert.equal(3, attempts);
      });
    });
  });

  it('deserializes date before 1970', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found(document('moonLanding', {
          valueType: 'timestampValue',
          timestampValue: {
            nanos: 123000000,
            seconds: -14182920,
          },
        })));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(res => {
        assert.equal(
            res.get('moonLanding').toMillis(),
            new Date('Jul 20 1969 20:18:00.123 UTC').getTime());
      });
    });
  });

  it('returns undefined for unknown fields', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found(document()));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(res => {
        assert.equal(res.get('bar'), undefined);
        assert.equal(res.get('bar.foo'), undefined);
      });
    });
  });

  it('supports NaN and Infinity', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found(document(
            'nanValue', {valueType: 'doubleValue', doubleValue: 'NaN'},
            'posInfinity', {valueType: 'doubleValue', doubleValue: 'Infinity'},
            'negInfinity',
            {valueType: 'doubleValue', doubleValue: '-Infinity'})));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(res => {
        assert.ok(
            typeof res.get('nanValue') === 'number' &&
            isNaN(res.get('nanValue')));
        assert.equal(res.get('posInfinity'), Infinity);
        assert.equal(res.get('negInfinity'), -Infinity);
      });
    });
  });

  it('doesn\'t deserialize unsupported types', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found(document('moonLanding', {valueType: 'foo'})));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(doc => {
        assert.throws(() => {
          doc.data();
        }, /Cannot decode type from Firestore Value: {"valueType":"foo"}/);
      });
    });
  });

  it('doesn\'t deserialize invalid latitude', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found(document('geoPointValue', {
          valueType: 'geoPointValue',
          geoPointValue: {
            latitude: 'foo',
            longitude: -122.947778,
          },
        })));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(doc => {
        assert.throws(() => {
          doc.data();
        }, /Argument "latitude" is not a valid number\./);
      });
    });
  });

  it('doesn\'t deserialize invalid longitude', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found(document('geoPointValue', {
          valueType: 'geoPointValue',
          geoPointValue: {
            latitude: 50.1430847,
            longitude: 'foo',
          },
        })));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(doc => {
        assert.throws(() => {
          doc.data();
        }, /Argument "longitude" is not a valid number\./);
      });
    });
  });
});

describe('get document', () => {
  it('returns document', () => {
    const overrides = {
      batchGetDocuments: request => {
        requestEquals(request, retrieve());

        return stream(found(document('foo', {
          valueType: 'mapValue',
          mapValue: {
            fields: {
              bar: {
                valueType: 'stringValue',
                stringValue: 'foobar',
              },
            },
          },
        })));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(result => {
        assert.deepStrictEqual(result.data(), {foo: {bar: 'foobar'}});
        assert.deepStrictEqual(result.get('foo'), {bar: 'foobar'});
        assert.equal(result.get('foo.bar'), 'foobar');
        assert.equal(
            result.get(new Firestore.FieldPath('foo', 'bar')), 'foobar');
        assert.equal(result.ref.id, 'documentId');
      });
    });
  });

  it('returns read, update and create times', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found(document()));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId')
          .get()
          .then((result) => {
            assert.ok(result.createTime!.isEqual(new Firestore.Timestamp(1, 2)));
            assert.ok(result.updateTime!.isEqual(new Firestore.Timestamp(3, 4)));
            assert.ok(result.readTime.isEqual(new Firestore.Timestamp(5, 6)));
          });
    });
  });

  it('returns not found', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(missing(document()));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(result => {
        assert.equal(result.exists, false);
        assert.ok(result.readTime.isEqual(new Firestore.Timestamp(5, 6)));
        assert.equal(null, result.data());
        assert.equal(null, result.get('foo'));
      });
    });
  });

  it('throws error', (done) => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(new Error('RPC Error'));
      }
    };

    createInstance(overrides).then(firestore => {
      firestore.doc('collectionId/documentId').get().catch(err => {
        assert.equal(err.message, 'RPC Error');
        done();
      });
    });
  });

  it('requires field path', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found(document('foo', {
          valueType: 'mapValue',
          mapValue: {
            fields: {
              bar: {
                valueType: 'stringValue',
                stringValue: 'foobar',
              },
            },
          },
        })));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').get().then(doc => {
        assert.throws(() => {
          (doc as InvalidApiUsage).get();
        }, /Argument "field" is not a valid FieldPath. Invalid use of type "undefined" as a Firestore argument./);
      });
    });
  });
});

describe('delete document', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
    });
  });

  it('generates proto', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, remove('documentId'));

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').delete();
    });
  });

  it('returns update time', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, remove('documentId'));

        callback(null, {
          commitTime: {
            nanos: 123000000,
            seconds: 479978400,
          },
          writeResults: [{}],
        });
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').delete().then(res => {
        assert.ok(res.writeTime.isEqual(
            new Firestore.Timestamp(479978400, 123000000)));
      });
    });
  });

  it('with last update time precondition', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, remove('documentId', {
                        updateTime: {
                          nanos: 123000000,
                          seconds: 479978400,
                        },
                      }));

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      const docRef = firestore.doc('collectionId/documentId');

      return Promise.all([
        docRef.delete({
          lastUpdateTime: new Firestore.Timestamp(479978400, 123000000),
        }),
        docRef.delete({
          lastUpdateTime: Firestore.Timestamp.fromMillis(479978400123),
        }),
        docRef.delete({
          lastUpdateTime: Firestore.Timestamp.fromDate(new Date(479978400123)),
        }),
      ]);
    });
  });

  it('with invalid last update time precondition', () => {
    assert.throws(() => {
      return firestore.doc('collectionId/documentId').delete({
        lastUpdateTime: 1337
      });
    }, /"lastUpdateTime" is not a Firestore Timestamp./);
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
      return firestore.doc('collectionId/documentId')
          .delete({exists: false, lastUpdateTime: Firestore.Timestamp.now()});
    }, /Input contains more than one condition./);
  });
});

describe('set document', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
    });
  });

  it('supports empty map', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, set(document()));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({});
    });
  });

  it('supports nested empty map', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, set(document('a', {
                        mapValue: {},
                      })));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({a: {}});
    });
  });

  it('skips merges with just field transform', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            set(null, null,
                fieldTransform('a', REQUEST_TIME, 'b.c', REQUEST_TIME)));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId')
          .set(
              {
                a: Firestore.FieldValue.serverTimestamp(),
                b: {c: Firestore.FieldValue.serverTimestamp()},
              },
              {merge: true});
    });
  });

  it('sends empty non-merge write even with just field transform', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            set(document(),  // The empty write clears the data on the
                             // server.
                null, fieldTransform('a', REQUEST_TIME, 'b.c', REQUEST_TIME)));
        callback(null, writeResult(2));
      }
    };

    firestore = createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({
        a: Firestore.FieldValue.serverTimestamp(),
        b: {c: Firestore.FieldValue.serverTimestamp()},
      });
    });
  });

  it('supports document merges', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            set(document('a', 'b', 'c', {
                  mapValue: {
                    fields: {
                      d: {
                        stringValue: 'e',
                      },
                    },
                  },
                }),
                updateMask('a', 'c.d', 'f')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId')
          .set(
              {a: 'b', c: {d: 'e'}, f: Firestore.FieldValue.delete()},
              {merge: true});
    });
  });

  it('supports document merges with field mask', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            set(document(
                    'a', 'foo', 'b', {
                      mapValue: {
                        fields: {
                          c: {
                            stringValue: 'foo',
                          },
                        },
                      },
                    },
                    'd', {
                      mapValue: {
                        fields: {
                          e: {
                            stringValue: 'foo',
                          },
                        },
                      },
                    }),
                updateMask('a', 'b', 'd.e', 'f')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId')
          .set(
              {
                a: 'foo',
                b: {c: 'foo'},
                d: {e: 'foo', ignore: 'foo'},
                f: Firestore.FieldValue.delete(),
                ignore: 'foo',
                ignoreMap: {a: 'foo'},
              },
              {mergeFields: ['a', new Firestore.FieldPath('b'), 'd.e', 'f']});
    });
  });

  it('supports document merges with empty field mask', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, set(document(), updateMask()));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({}, {
        mergeFields: []
      });
    });
  });

  it('supports document merges with field mask and empty maps', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            set(document(
                    'a', {
                      mapValue: {
                        fields: {
                          b: {
                            mapValue: {},
                          },
                        },
                      },
                    },
                    'c', {
                      mapValue: {
                        fields: {
                          d: {
                            mapValue: {},
                          },
                        },
                      },
                    }),
                updateMask('a', 'c.d')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId')
          .set(
              {
                a: {b: {}},
                c: {d: {}},
              },
              {mergeFields: ['a', new Firestore.FieldPath('c', 'd')]});
    });
  });

  it('supports document merges with field mask and field transform', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            set(document(), updateMask('b', 'f'),
                fieldTransform(
                    'a', REQUEST_TIME, 'b.c', REQUEST_TIME, 'd.e',
                    REQUEST_TIME)));
        callback(null, writeResult(2));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId')
          .set(
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
              {mergeFields: ['a', new Firestore.FieldPath('b'), 'd.e', 'f']});
    });
  });


  it('supports empty merge', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, set(document(), updateMask()));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({}, {merge: true});
    });
  });

  it('supports nested empty merge', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            set(document('a', {
                  mapValue: {},
                }),
                updateMask('a')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({a: {}}, {
        merge: true
      });
    });
  });

  it('doesn\'t split on dots', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, set(document('a.b', 'c')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').set({'a.b': 'c'});
    });
  });

  it('validates merge option', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: 'bar'}, 'foo');
    }, /Argument "options" is not a valid SetOptions. Input is not an object./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: 'bar'}, {merge: 42});
    }, /Argument "options" is not a valid SetOptions. "merge" is not a boolean./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: 'bar'}, {
        mergeFields: 42
      });
    }, /Argument "options" is not a valid SetOptions. "mergeFields" is not an array./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: 'bar'}, {
        mergeFields: [null]
      });
    }, /Argument "options" is not a valid SetOptions. Argument at index 0 is not a valid FieldPath./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({foo: 'bar'}, {
        mergeFields: ['foobar']
      });
    }, /Input data is missing for field 'foobar'./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId')
          .set({foo: 'bar'}, {merge: true, mergeFields: []});
    }, /Argument "options" is not a valid SetOptions. You cannot specify both "merge" and "mergeFields"./);
  });

  it('requires an object', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set(null);
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it('doesn\'t support non-merge deletes', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set({
        foo: Firestore.FieldValue.delete()
      });
    }, /FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);
  });

  it('doesn\'t accept arrays', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').set([42]);
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });
});

describe('create document', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
    });
  });

  it('creates document', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, create(document()));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').create({});
    });
  });

  it('returns update time', () => {
    const overrides = {
      commit: (request, options, callback) => {
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
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').create({}).then(res => {
        assert.ok(res.writeTime.isEqual(
            new Firestore.Timestamp(479978400, 123000000)));
      });
    });
  });

  it('supports field transform', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            create(
                null,
                fieldTransform(
                    'field', REQUEST_TIME, 'map.field', REQUEST_TIME)));

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').create({
        field: Firestore.FieldValue.serverTimestamp(),
        map: {field: Firestore.FieldValue.serverTimestamp()},
      });
    });
  });

  it('supports nested empty map', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, create(document('a', {
                        mapValue: {
                          fields: {
                            b: {
                              mapValue: {},
                            },
                          },
                        },
                      })));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').create({a: {b: {}}});
    });
  });

  it('requires an object', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').create(null);
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it('doesn\'t accept arrays', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').create([42]);
    }, /Argument "data" is not a valid Document. Input is not a plain JavaScript object./);
  });
});

describe('update document', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreClient => {
      firestore = firestoreClient;
    });
  });

  it('generates proto', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request, update(document('foo', 'bar'), updateMask('foo')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').update({foo: 'bar'});
    });
  });

  it('supports nested field transform', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            update(
                document('foo', {
                  mapValue: {},
                }),
                updateMask('a', 'foo'),
                fieldTransform('a.b', REQUEST_TIME, 'c.d', REQUEST_TIME)));
        callback(null, writeResult(2));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').update({
        foo: {},
        a: {b: Firestore.FieldValue.serverTimestamp()},
        'c.d': Firestore.FieldValue.serverTimestamp(),
      });
    });
  });

  it('skips write for single field transform', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request, update(null, null, fieldTransform('a', REQUEST_TIME)));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId')
          .update('a', Firestore.FieldValue.serverTimestamp());
    });
  });

  it('supports nested empty map', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            update(
                document('a', {
                  mapValue: {},
                }),
                updateMask('a')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').update({a: {}});
    });
  });

  it('supports nested delete', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(request, update(document(), updateMask('a.b')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').update({
        'a.b': Firestore.FieldValue.delete()
      });
    });
  });

  it('returns update time', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request, update(document('foo', 'bar'), updateMask('foo')));

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
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId')
          .update({foo: 'bar'})
          .then(res => {
            assert.ok(res.writeTime.isEqual(
                new Firestore.Timestamp(479978400, 123000000)));
          });
    });
  });

  it('with last update time precondition', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            update(
                document('foo', 'bar'), updateMask('foo'),
                /*transform */ null, {
                  updateTime: {
                    nanos: 123000000,
                    seconds: 479978400,
                  },
                }));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return Promise.all([
        firestore.doc('collectionId/documentId').update({foo: 'bar'}, {
          lastUpdateTime: new Firestore.Timestamp(479978400, 123000000)
        }),
        firestore.doc('collectionId/documentId').update('foo', 'bar', {
          lastUpdateTime: new Firestore.Timestamp(479978400, 123000000),
        }),
      ]);
    });
  });

  it('with invalid last update time precondition', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({foo: 'bar'}, {
        lastUpdateTime: 'foo'
      });
    }, /"lastUpdateTime" is not a Firestore Timestamp\./);
  });

  it('requires at least one field', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({});
    }, /At least one field must be updated./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update();
    }, /Function 'update\(\)' requires at least 1 argument./);
  });

  it('rejects nested deletes', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update({
        a: {b: Firestore.FieldValue.delete()}
      });
    }, /FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId').update('a', {
        b: Firestore.FieldValue.delete()
      });
    }, /FieldValue.delete\(\) must appear at the top-level and can only be used in update\(\) or set\(\) with {merge:true}./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId')
          .update(
              'a',
              Firestore.FieldValue.arrayUnion(Firestore.FieldValue.delete()));
    }, /FieldValue.delete\(\) cannot be used inside of an array./);
  });

  it('with top-level document', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request, update(document('foo', 'bar'), updateMask('foo')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').update({
        foo: 'bar',
      });
    });
  });

  it('with nested document', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            update(
                document(
                    'a', {
                      mapValue: {
                        fields: {
                          b: {
                            mapValue: {
                              fields: {
                                c: {
                                  stringValue: 'foobar',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    'foo', {
                      mapValue: {
                        fields: {
                          bar: {
                            stringValue: 'foobar',
                          },
                        },
                      },
                    }),
                updateMask('a.b.c', 'foo.bar')));

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return Promise.all([
        firestore.doc('collectionId/documentId').update({
          'foo.bar': 'foobar',
          'a.b.c': 'foobar',
        }),
        firestore.doc('collectionId/documentId')
            .update(
                'foo.bar', 'foobar', new Firestore.FieldPath('a', 'b', 'c'),
                'foobar'),
      ]);
    });
  });

  it('with two nested fields ', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            update(
                document('foo', {
                  mapValue: {
                    fields: {
                      bar: {stringValue: 'two'},
                      deep: {
                        mapValue: {
                          fields: {
                            bar: {stringValue: 'two'},
                            foo: {stringValue: 'one'},
                          },
                        }
                      },
                      foo: {stringValue: 'one'},
                    },
                  }
                }),
                updateMask(
                    'foo.bar', 'foo.deep.bar', 'foo.deep.foo', 'foo.foo')));

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return Promise.all([
        firestore.doc('collectionId/documentId').update({
          'foo.foo': 'one',
          'foo.bar': 'two',
          'foo.deep.foo': 'one',
          'foo.deep.bar': 'two',
        }),
        firestore.doc('collectionId/documentId')
            .update(
                'foo.foo', 'one', 'foo.bar', 'two', 'foo.deep.foo', 'one',
                'foo.deep.bar', 'two'),
      ]);
    });
  });

  it('with nested field and document transform ', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            update(
                document('a', {
                  mapValue: {
                    fields: {
                      b: {
                        mapValue: {
                          fields: {
                            keep: {
                              stringValue: 'keep',
                            },
                          },
                        },
                      },
                      c: {
                        mapValue: {
                          fields: {
                            keep: {
                              stringValue: 'keep',
                            },
                          },
                        },
                      },
                    },
                  },
                }),
                updateMask(
                    'a.b.delete', 'a.b.keep', 'a.c.delete', 'a.c.keep')));

        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').update({
        'a.b.delete': Firestore.FieldValue.delete(),
        'a.b.keep': 'keep',
        'a.c.delete': Firestore.FieldValue.delete(),
        'a.c.keep': 'keep',
      });
    });
  });

  it('with field with dot ', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request, update(document('a.b', 'c'), updateMask('`a.b`')));

        callback(null, writeResult(1));
      }
    };
    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId')
          .update(new Firestore.FieldPath('a.b'), 'c');
    });
  });

  it('with conflicting update', () => {
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
      firestore.doc('collectionId/documentId')
          .update('foo.bar', 'foobar', 'foo', 'foobar');
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo" was specified multiple times\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId')
          .update('foo', {foobar: 'foobar'}, 'foo.bar', {foobar: 'foobar'});
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo" was specified multiple times\./);

    assert.throws(() => {
      firestore.doc('collectionId/documentId')
          .update('foo', {foobar: 'foobar'}, 'foo.bar', {foobar: 'foobar'});
    }, /Argument "dataOrField" is not a valid UpdateMap. Field "foo" was specified multiple times\./);
  });

  it('with valid field paths', () => {
    const validFields = ['foo.bar', '_', 'foo.bar.foobar', '\n`'];

    for (let i = 0; i < validFields.length; ++i) {
      firestore.collection('col').select(validFields[i]);
    }
  });

  it('with invalid field paths', () => {
    const invalidFields = [
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

  it('doesn\'t accept argument after precondition', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update('foo', 'bar', {
        exists: true
      });
    }, INVALID_ARGUMENTS_TO_UPDATE);

    assert.throws(() => {
      firestore.doc('collectionId/documentId')
          .update({foo: 'bar'}, {exists: true}, 'foo');
    }, INVALID_ARGUMENTS_TO_UPDATE);
  });

  it('accepts an object', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update(null);
    }, /Argument "dataOrField" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it('doesn\'t accept arrays', () => {
    assert.throws(() => {
      firestore.doc('collectionId/documentId').update([42]);
    }, /Argument "dataOrField" is not a valid Document. Input is not a plain JavaScript object./);
  });

  it('with field delete', () => {
    const overrides = {
      commit: (request, options, callback) => {
        requestEquals(
            request,
            update(document('bar', 'foobar'), updateMask('bar', 'foo')));
        callback(null, writeResult(1));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.doc('collectionId/documentId').update({
        foo: Firestore.FieldValue.delete(),
        bar: 'foobar',
      });
    });
  });
});

describe('listCollections() method', () => {
  it('sorts results', () => {
    const overrides = {
      listCollectionIds: (request, options, callback) => {
        assert.deepStrictEqual(request, {
          parent:
              `projects/${PROJECT_ID}/databases/(default)/documents/coll/doc`,
        });

        callback(null, ['second', 'first']);
      }
    };

    return createInstance(overrides).then(firestore => {
      // We are using `getCollections()` to ensure 100% code coverage
      return firestore.doc('coll/doc').getCollections().then(collections => {
        assert.equal(collections[0].path, 'coll/doc/first');
        assert.equal(collections[1].path, 'coll/doc/second');
      });
    });
  });
});
