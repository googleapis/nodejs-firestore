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

import assert from 'power-assert';
import extend from 'extend';
import is from 'is';
import through2 from 'through2';

import {Firestore} from '../src/index';
import {referencePkg} from '../src/reference';
import {ResourcePath} from '../src/path';
import {createInstance} from '../test/util/helpers';

const gax = require('google-gax');
const grpc = new gax.GrpcClient().grpc;

const reference = referencePkg(Firestore);
const DocumentReference = reference.DocumentReference;
const CollectionReference = reference.CollectionReference;

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const DEFAULT_SETTINGS = {
  projectId: PROJECT_ID,
  sslCreds: grpc.credentials.createInsecure(),
  keyFilename: './test/fake-certificate.json',
  timestampsInSnapshots: true
};

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

const bytesData = Buffer.from('AQI=', 'base64');

const allSupportedTypesProtobufJs = document('documentId', {
  arrayValue: {
    arrayValue: {
      values: [
        {
          stringValue: 'foo',
        },
        {
          integerValue: 42,
        },
        {
          stringValue: 'bar',
        },
      ],
    },
  },
  emptyArray: {
    arrayValue: {},
  },
  dateValue: {
    timestampValue: {
      nanos: 123000000,
      seconds: 479978400,
    },
  },
  timestampValue: {
    timestampValue: {
      nanos: 123000000,
      seconds: 479978400,
    },
  },
  doubleValue: {
    doubleValue: 0.1,
  },
  falseValue: {
    booleanValue: false,
  },
  infinityValue: {
    doubleValue: Infinity,
  },
  integerValue: {
    integerValue: 0,
  },
  negativeInfinityValue: {
    doubleValue: -Infinity,
  },
  nilValue: {
    nullValue: 'NULL_VALUE',
  },
  objectValue: {
    mapValue: {
      fields: {
        foo: {
          stringValue: 'bar',
        },
      },
    },
  },
  emptyObject: {
    mapValue: {},
  },
  pathValue: {
    referenceValue: `${DATABASE_ROOT}/documents/collection/document`,
  },
  stringValue: {
    stringValue: 'a',
  },
  trueValue: {
    booleanValue: true,
  },
  geoPointValue: {
    geoPointValue: {
      latitude: 50.1430847,
      longitude: -122.947778,
    },
  },
  bytesValue: {
    bytesValue: Buffer.from('AQI=', 'base64'),
  },
});

const allSupportedTypesJson = document('documentId', {
  arrayValue: {
    arrayValue: {
      values: [
        {
          stringValue: 'foo',
        },
        {
          integerValue: 42,
        },
        {
          stringValue: 'bar',
        },
      ],
    },
  },
  emptyArray: {
    arrayValue: {},
  },
  dateValue: {
    timestampValue: '1985-03-18T07:20:00.123000000Z',
  },
  timestampValue: {
    timestampValue: '1985-03-18T07:20:00.123000000Z',
  },
  doubleValue: {
    doubleValue: 0.1,
  },
  falseValue: {
    booleanValue: false,
  },
  infinityValue: {
    doubleValue: Infinity,
  },
  integerValue: {
    integerValue: 0,
  },
  negativeInfinityValue: {
    doubleValue: -Infinity,
  },
  nilValue: {
    nullValue: 'NULL_VALUE',
  },
  objectValue: {
    mapValue: {
      fields: {
        foo: {
          stringValue: 'bar',
        },
      },
    },
  },
  emptyObject: {
    mapValue: {},
  },
  pathValue: {
    referenceValue: `${DATABASE_ROOT}/documents/collection/document`,
  },
  stringValue: {
    stringValue: 'a',
  },
  trueValue: {
    booleanValue: true,
  },
  geoPointValue: {
    geoPointValue: {
      latitude: 50.1430847,
      longitude: -122.947778,
    },
  },
  bytesValue: {
    bytesValue: 'AQI=',
  },
});

const allSupportedTypesInput = {
  stringValue: 'a',
  trueValue: true,
  falseValue: false,
  integerValue: 0,
  doubleValue: 0.1,
  infinityValue: Infinity,
  negativeInfinityValue: -Infinity,
  objectValue: {foo: 'bar'},
  emptyObject: {},
  dateValue: new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)'),
  timestampValue: Firestore.Timestamp.fromDate(
      new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)')),
  pathValue: new DocumentReference(
      {formattedName: DATABASE_ROOT},
      new ResourcePath(PROJECT_ID, '(default)', 'collection', 'document')),
  arrayValue: ['foo', 42, 'bar'],
  emptyArray: [],
  nilValue: null,
  geoPointValue: new Firestore.GeoPoint(50.1430847, -122.947778),
  bytesValue: Buffer.from([0x1, 0x2]),
};

const allSupportedTypesOutput = {
  stringValue: 'a',
  trueValue: true,
  falseValue: false,
  integerValue: 0,
  doubleValue: 0.1,
  infinityValue: Infinity,
  negativeInfinityValue: -Infinity,
  objectValue: {foo: 'bar'},
  emptyObject: {},
  dateValue: Firestore.Timestamp.fromDate(
      new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)')),
  timestampValue: Firestore.Timestamp.fromDate(
      new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)')),
  pathValue: new DocumentReference(
      {formattedName: DATABASE_ROOT},
      new ResourcePath(PROJECT_ID, '(default)', 'collection', 'document')),
  arrayValue: ['foo', 42, 'bar'],
  emptyArray: [],
  nilValue: null,
  geoPointValue: new Firestore.GeoPoint(50.1430847, -122.947778),
  bytesValue: Buffer.from([0x1, 0x2]),
};

function document(name, fields) {
  return {
    name: `${DATABASE_ROOT}/documents/collectionId/${name}`,
    fields: fields,
    createTime: {seconds: 1, nanos: 2},
    updateTime: {seconds: 3, nanos: 4},
  };
}

function found(name) {
  return {
    found: document(name),
    readTime: {seconds: 5, nanos: 6},
  };
}

function missing(name) {
  return {
    missing: `${DATABASE_ROOT}/documents/collectionId/${name}`,
    readTime: {seconds: 5, nanos: 6},
  };
}

function stream() {
  let stream = through2.obj();
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

describe('instantiation', function() {
  it('creates instance', function() {
    let firestore = new Firestore(DEFAULT_SETTINGS);
    assert(firestore instanceof Firestore);
  });

  it('merges settings', function() {
    let firestore = new Firestore(DEFAULT_SETTINGS);
    firestore.settings({foo: 'bar'});

    assert.equal(firestore._initalizationSettings.projectId, PROJECT_ID);
    assert.equal(firestore._initalizationSettings.foo, 'bar');
  });

  it('can only call settings() once', function() {
    let firestore = new Firestore(DEFAULT_SETTINGS);
    firestore.settings({timestampsInSnapshots: true});

    assert.throws(
        () => firestore.settings({}),
        /Firestore.settings\(\) has already be called. You can only call settings\(\) once, and only before calling any other methods on a Firestore object./);
  });

  it('cannot change settings after client initialized', function() {
    let firestore = new Firestore(DEFAULT_SETTINGS);
    firestore._runRequest(() => Promise.resolve());

    assert.throws(
        () => firestore.settings({}),
        /Firestore has already been started and its settings can no longer be changed. You can only call settings\(\) before calling any other methods on a Firestore object./);
  });

  it('validates project ID is string', function() {
    assert.throws(() => {
      const settings = Object.assign({}, DEFAULT_SETTINGS, {
        projectId: 1337,
      });
      new Firestore(settings);
    }, /Argument "settings.projectId" is not a valid string/);

    assert.throws(() => {
      new Firestore(DEFAULT_SETTINGS).settings({projectId: 1337});
    }, /Argument "settings.projectId" is not a valid string/);
  });

  it('validates timestampsInSnapshots is boolean', function() {
    assert.throws(() => {
      const settings = Object.assign({}, DEFAULT_SETTINGS, {
        timestampsInSnapshots: 1337,
      });
      new Firestore(settings);
    }, /Argument "settings.timestampsInSnapshots" is not a valid boolean/);

    assert.throws(() => {
      new Firestore(DEFAULT_SETTINGS).settings({timestampsInSnapshots: 1337});
    }, /Argument "settings.timestampsInSnapshots" is not a valid boolean/);
  });

  it('uses project id from constructor', () => {
    let firestore = new Firestore(DEFAULT_SETTINGS);

    return firestore._runRequest(() => {
      assert.equal(
          firestore.formattedName,
          `projects/${PROJECT_ID}/databases/(default)`);
      return Promise.resolve();
    });
  });

  it('detects project id', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: './test/fake-certificate.json',
    });

    assert.equal(
        firestore.formattedName, 'projects/{{projectId}}/databases/(default)');

    firestore._detectProjectId = () => Promise.resolve(PROJECT_ID);

    return firestore._runRequest(() => {
      assert.equal(
          firestore.formattedName,
          `projects/${PROJECT_ID}/databases/(default)`);
      return Promise.resolve();
    });
  });

  it('uses project id from gapic client', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: './test/fake-certificate.json',
    });

    assert.equal(
        firestore.formattedName, 'projects/{{projectId}}/databases/(default)');

    let gapicClient = {getProjectId: callback => callback(null, PROJECT_ID)};

    return firestore._detectProjectId(gapicClient).then(projectId => {
      assert.equal(projectId, PROJECT_ID);
    });
  });

  it('uses project ID from settings()', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: './test/fake-certificate.json',
    });

    firestore.settings({projectId: PROJECT_ID});

    assert.equal(
        firestore.formattedName, `projects/${PROJECT_ID}/databases/(default)`);
  });

  it('handles error from project ID detection', function() {
    let firestore = new Firestore({
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: './test/fake-certificate.json',
    });

    let gapicClient = {
      getProjectId: callback => callback(new Error('Injected Error'))
    };

    return firestore._detectProjectId(gapicClient)
        .then(() => assert.fail('Error ignored'))
        .catch(err => assert.equal('Injected Error', err.message))
  });

  it('exports all types', function() {
    // Ordering as per firestore.d.ts
    assert.ok(is.defined(Firestore.Firestore));
    assert.equal(Firestore.Firestore.name, 'Firestore');
    assert.ok(is.defined(Firestore.Timestamp));
    assert.equal(Firestore.Timestamp.name, 'Timestamp');
    assert.ok(is.defined(Firestore.GeoPoint));
    assert.equal(Firestore.GeoPoint.name, 'GeoPoint');
    assert.ok(is.defined(Firestore.Transaction));
    assert.equal(Firestore.Transaction.name, 'Transaction');
    assert.ok(is.defined(Firestore.WriteBatch));
    assert.equal(Firestore.WriteBatch.name, 'WriteBatch');
    assert.ok(is.defined(Firestore.DocumentReference));
    assert.equal(Firestore.DocumentReference.name, 'DocumentReference');
    assert.ok(is.defined(Firestore.WriteResult));
    assert.equal(Firestore.WriteResult.name, 'WriteResult');
    assert.ok(is.defined(Firestore.DocumentSnapshot));
    assert.equal(Firestore.DocumentSnapshot.name, 'DocumentSnapshot');
    assert.ok(is.defined(Firestore.QueryDocumentSnapshot));
    assert.equal(Firestore.QueryDocumentSnapshot.name, 'QueryDocumentSnapshot');
    assert.ok(is.defined(Firestore.Query));
    assert.equal(Firestore.Query.name, 'Query');
    assert.ok(is.defined(Firestore.QuerySnapshot));
    assert.equal(Firestore.QuerySnapshot.name, 'QuerySnapshot');
    assert.ok(is.defined(Firestore.CollectionReference));
    assert.equal(Firestore.CollectionReference.name, 'CollectionReference');
    assert.ok(is.defined(Firestore.FieldValue));
    assert.equal(Firestore.FieldValue.name, 'FieldValue');
    assert.ok(is.defined(Firestore.FieldPath));
    assert.equal(Firestore.Firestore.name, 'Firestore');
    assert.ok(!Firestore.FieldValue.serverTimestamp().isEqual(
        Firestore.FieldValue.delete()));
  });
});

describe('serializer', function() {
  it('supports all types', function() {
    const overrides = {
      commit: (request, options, callback) => {
        assert.deepStrictEqual(
            allSupportedTypesProtobufJs.fields,
            request.writes[0].update.fields);
        callback(null, {
          commitTime: {},
          writeResults: [
            {
              updateTime: {},
            },
          ],
        });
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.collection('coll').add(allSupportedTypesInput);
    });
  });
});

describe('snapshot_() method', function() {
  let firestore;

  function verifyAllSupportedTypes(actualObject) {
    let expected = extend(true, {}, allSupportedTypesOutput);
    // Deep Equal doesn't support matching instances of DocumentRefs, so we
    // compare them manually and remove them from the resulting object.
    assert.equal(
        actualObject.get('pathValue').formattedName,
        expected.pathValue.formattedName);
    let data = actualObject.data();
    delete data.pathValue;
    delete expected.pathValue;
    assert.deepStrictEqual(data, expected);

    // We specifically test the GeoPoint properties to ensure 100% test
    // coverage.
    assert.equal(data.geoPointValue.latitude, 50.1430847);
    assert.equal(data.geoPointValue.longitude, -122.947778);
    assert.equal(
        data.geoPointValue.toString(),
        'GeoPoint { latitude: 50.1430847, longitude: -122.947778 }');
    assert.ok(data.geoPointValue.isEqual(
        new Firestore.GeoPoint(50.1430847, -122.947778)));
  }

  beforeEach(() => {
    // Unlike most other tests, we don't call `ensureClient` since the
    // `snapshot_` method does not require a GAPIC client.
    firestore = new Firestore({
      projectId: PROJECT_ID,
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: './test/fake-certificate.json',
    });
  });

  it('handles ProtobufJS', function() {
    let doc = firestore.snapshot_(
        document('doc', {
          foo: {valueType: 'bytesValue', bytesValue: bytesData},
        }),
        {seconds: 5, nanos: 6});

    assert.equal(true, doc.exists);
    assert.deepStrictEqual({foo: bytesData}, doc.data());
    assert.ok(doc.createTime.isEqual(new Firestore.Timestamp(1, 2)));
    assert.ok(doc.updateTime.isEqual(new Firestore.Timestamp(3, 4)));
    assert.ok(doc.readTime.isEqual(new Firestore.Timestamp(5, 6)));
  });

  it('handles Proto3 JSON together with existing types', function() {
    // Google Cloud Functions must be able to call snapshot_() with Proto3 JSON
    // data.
    let doc = firestore.snapshot_(
        {
          name: `${DATABASE_ROOT}/documents/collectionId/doc`,
          fields: {
            a: {bytesValue: 'AQI='},
            b: {timestampValue: '1985-03-18T07:20:00.000Z'},
            c: {
              valueType: 'bytesValue',
              bytesValue: Buffer.from('AQI=', 'base64'),
            },
          },
          createTime: '1970-01-01T00:00:01.002Z',
          updateTime: '1970-01-01T00:00:03.000004Z',
        },
        '1970-01-01T00:00:05.000000006Z', 'json');

    assert.equal(true, doc.exists);
    assert.deepStrictEqual(doc.data(), {
      a: bytesData,
      b: Firestore.Timestamp.fromDate(new Date('1985-03-18T07:20:00.000Z')),
      c: bytesData,
    });
    assert.ok(doc.createTime.isEqual(new Firestore.Timestamp(1, 2000000)));
    assert.ok(doc.updateTime.isEqual(new Firestore.Timestamp(3, 4000)));
    assert.ok(doc.readTime.isEqual(new Firestore.Timestamp(5, 6)));
  });

  it('deserializes all supported types from Protobuf JS', function() {
    let doc = firestore.snapshot_(allSupportedTypesProtobufJs, {
      seconds: 5,
      nanos: 6,
    });

    verifyAllSupportedTypes(doc);
  });

  it('deserializes all supported types from Proto3 JSON', function() {
    let doc = firestore.snapshot_(
        allSupportedTypesJson, '1970-01-01T00:00:05.000000006Z', 'json');

    verifyAllSupportedTypes(doc);
  });

  it('handles invalid Proto3 JSON', function() {
    assert.throws(() => {
      firestore.snapshot_(
          {
            name: `${DATABASE_ROOT}/documents/collectionId/doc`,
            fields: {foo: {}},
            createTime: '1970-01-01T00:00:01.000000002Z',
            updateTime: '1970-01-01T00:00:03.000000004Z',
          },
          '1970-01-01T00:00:05.000000006Z', 'json');
    }, /Unable to infer type value fom '{}'./);

    assert.throws(() => {
      firestore.snapshot_(
          {
            name: `${DATABASE_ROOT}/documents/collectionId/doc`,
            fields: {foo: {stringValue: 'bar', integerValue: 42}},
            createTime: '1970-01-01T00:00:01.000000002Z',
            updateTime: '1970-01-01T00:00:03.000000004Z',
          },
          '1970-01-01T00:00:05.000000006Z', 'json');
    }, /Unable to infer type value fom '{"stringValue":"bar","integerValue":42}'./);

    assert.throws(() => {
      firestore.snapshot_(
          {
            name: `${DATABASE_ROOT}/documents/collectionId/doc`,
            fields: {foo: {stringValue: 'bar'}},
            createTime: '1970-01-01T00:00:01.NaNZ',
            updateTime: '1970-01-01T00:00:03.000000004Z',
          },
          '1970-01-01T00:00:05.000000006Z', 'json');
    }, /Specify a valid ISO 8601 timestamp for "documentOrName.createTime"./);
  });

  it('handles missing document ', function() {
    let doc = firestore.snapshot_(
        `${DATABASE_ROOT}/documents/collectionId/doc`,
        '1970-01-01T00:00:05.000000006Z', 'json');

    assert.equal(false, doc.exists);
    assert.ok(doc.readTime.isEqual(new Firestore.Timestamp(5, 6)));
  });

  it('handles invalid encoding format ', function() {
    assert.throws(() => {
      firestore.snapshot_(
          `${DATABASE_ROOT}/documents/collectionId/doc`,
          '1970-01-01T00:00:05.000000006Z', 'ascii');
    }, /Unsupported encoding format. Expected 'json' or 'protobufJS', but was 'ascii'./);
  });
});

describe('doc() method', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('returns DocumentReference', function() {
    let documentRef = firestore.doc('collectionId/documentId');
    assert.ok(documentRef instanceof DocumentReference);
  });

  it('requires document path', function() {
    assert.throws(function() {
      firestore.doc();
    }, /Argument "documentPath" is not a valid ResourcePath. Path must be a non-empty string./);
  });

  it('doesn\'t accept empty components', function() {
    assert.throws(function() {
      firestore.doc('coll//doc');
    }, /Argument "documentPath" is not a valid ResourcePath. Paths must not contain \/\/./);
  });

  it('must point to document', function() {
    assert.throws(function() {
      firestore.doc('collectionId');
    }, /Argument "documentPath" must point to a document, but was "collectionId". Your path does not contain an even number of components\./);
  });

  it('exposes properties', function() {
    let documentRef = firestore.doc('collectionId/documentId');
    assert.equal(documentRef.id, 'documentId');
    assert.equal(documentRef.firestore, firestore);
  });
});

describe('collection() method', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('returns collection', function() {
    let collection = firestore.collection('col1/doc1/col2');
    assert.ok(is.instance(collection, CollectionReference));
  });

  it('requires collection id', function() {
    assert.throws(function() {
      firestore.collection();
    }, /Argument "collectionPath" is not a valid ResourcePath. Path must be a non-empty string./);
  });

  it('must point to a collection', function() {
    assert.throws(function() {
      firestore.collection('collectionId/documentId');
    }, /Argument "collectionPath" must point to a collection, but was "collectionId\/documentId". Your path does not contain an odd number of components\./);
  });

  it('exposes properties', function() {
    let collection = firestore.collection('collectionId');
    assert.ok(collection.id);
    assert.ok(collection.doc);
    assert.equal(collection.id, 'collectionId');
  });
});

describe('getCollections() method', function() {
  it('returns collections', function() {
    const overrides = {
      listCollectionIds: (request, options, callback) => {
        assert.deepStrictEqual(request, {
          parent: `projects/${PROJECT_ID}/databases/(default)`,
        });

        callback(null, ['first', 'second']);
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.getCollections().then(collections => {
        assert.equal(collections[0].path, 'first');
        assert.equal(collections[1].path, 'second');
      });
    });
  });
});

describe('getAll() method', function() {
  function resultEquals(result, doc) {
    assert.equal(result.length, arguments.length - 1);

    for (let i = 0; i < result.length; ++i) {
      doc = arguments[i + 1];

      if (doc.found) {
        assert.ok(result[i].exists);
        assert.equal(result[i].ref.formattedName, doc.found.name);
      } else {
        assert.ok(!result[i].exists);
        assert.equal(result[i].ref.formattedName, doc.missing);
      }
    }
  }

  it('accepts empty list', function() {
    const overrides = {
      batchGetDocuments: () => {
        return stream();
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.getAll().then(result => {
        resultEquals(result);
      });
    });
  });

  it('accepts single document', function() {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found('documentId'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.getAll(firestore.doc('collectionId/documentId'))
          .then(result => {
            resultEquals(result, found('documentId'));
          });
    });
  });

  it('verifies response', function() {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found('documentId2'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.getAll(firestore.doc('collectionId/documentId'))
          .then(() => {
            throw new Error('Unexpected success in Promise');
          })
          .catch(err => {
            assert.equal(
                err.message,
                'Did not receive document for "collectionId/documentId".');
          });
    });
  });

  it('handles stream exception during initialization', function() {
    const overrides = {
      batchGetDocuments: () => {
        return stream(new Error('Expected exception'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.getAll(firestore.doc('collectionId/documentId'))
          .then(() => {
            throw new Error('Unexpected success in Promise');
          })
          .catch(err => {
            assert.equal(err.message, 'Expected exception');
          });
    });
  });

  it('handles stream exception after initialization', function() {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found('documentId'), new Error('Expected exception'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.getAll(firestore.doc('collectionId/documentId'))
          .then(() => {
            throw new Error('Unexpected success in Promise');
          })
          .catch(err => {
            assert.equal(err.message, 'Expected exception');
          });
    });
  });

  it('handles serialization error', function() {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found('documentId'));
      }
    };

    return createInstance(overrides).then(firestore => {
      firestore.snapshot_ = function() {
        throw new Error('Expected exception');
      };

      return firestore.getAll(firestore.doc('collectionId/documentId'))
          .then(() => {
            throw new Error('Unexpected success in Promise');
          })
          .catch(err => {
            assert.equal(err.message, 'Expected exception');
          });
    });
  });

  it('only retries on GRPC unavailable', function() {
    let expectedErrorAttempts = {
      /* Cancelled */ 1: 1,
      /* Unknown */ 2: 1,
      /* InvalidArgument */ 3: 1,
      /* DeadlineExceeded */ 4: 1,
      /* NotFound */ 5: 1,
      /* AlreadyExists */ 6: 1,
      /* PermissionDenied */ 7: 1,
      /* ResourceExhausted */ 8: 1,
      /* FailedPrecondition */ 9: 1,
      /* Aborted */ 10: 1,
      /* OutOfRange */ 11: 1,
      /* Unimplemented */ 12: 1,
      /* Internal */ 13: 1,
      /* Unavailable */ 14: 5,
      /* DataLoss */ 15: 1,
      /* Unauthenticated */ 16: 1,
    };

    let actualErrorAttempts = {};

    const overrides = {
      batchGetDocuments: request => {
        let errorCode = Number(request.documents[0].split('/').pop());
        actualErrorAttempts[errorCode] =
            (actualErrorAttempts[errorCode] || 0) + 1;
        let error = new Error('Expected exception');
        error.code = errorCode;
        return stream(error);
      }
    };

    return createInstance(overrides).then(firestore => {
      let coll = firestore.collection('collectionId');

      let promises = [];

      Object.keys(expectedErrorAttempts).forEach(errorCode => {
        promises.push(firestore.getAll(coll.doc(`${errorCode}`))
                          .then(() => {
                            throw new Error('Unexpected success in Promise');
                          })
                          .catch(err => {
                            assert.equal(err.code, errorCode);
                          }));
      });

      return Promise.all(promises).then(() => {
        assert.deepStrictEqual(actualErrorAttempts, expectedErrorAttempts);
      });
    });
  });

  it('requires document reference', function() {
    return createInstance().then(firestore => {
      assert.throws(() => {
        firestore.getAll({});
      }, /Argument at index 0 is not a valid DocumentReference\./);
    });
  });

  it('accepts array', function() {
    const overrides = {batchGetDocuments: () => stream(found('documentId'))};

    return createInstance(overrides).then(firestore => {
      return firestore.getAll([firestore.doc('collectionId/documentId')])
          .then(result => {
            resultEquals(result, found('documentId'));
          });
    });
  });

  it('returns not found for missing documents', function() {
    const overrides = {
      batchGetDocuments: () => stream(found('exists'), missing('missing'))
    };

    return createInstance(overrides).then(firestore => {
      return firestore
          .getAll(
              firestore.doc('collectionId/exists'),
              firestore.doc('collectionId/missing'))
          .then(result => {
            resultEquals(result, found('exists'), missing('missing'));
          });
    });
  });

  it('returns results in order', function() {
    const overrides = {
      batchGetDocuments: () => {
        return stream(
            // Note that these are out of order.
            found('second'), found('first'), found('fourth'), found('third'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore
          .getAll(
              firestore.doc('collectionId/first'),
              firestore.doc('collectionId/second'),
              firestore.doc('collectionId/third'),
              firestore.doc('collectionId/fourth'))
          .then(result => {
            resultEquals(
                result, found('first'), found('second'), found('third'),
                found('fourth'));
          });
    });
  });

  it('accepts same document multiple times', function() {
    const overrides = {
      batchGetDocuments: request => {
        assert.equal(request.documents.length, 2);
        return stream(found('a'), found('b'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore
          .getAll(
              firestore.doc('collectionId/a'), firestore.doc('collectionId/a'),
              firestore.doc('collectionId/b'), firestore.doc('collectionId/a'))
          .then(result => {
            resultEquals(
                result, found('a'), found('a'), found('b'), found('a'));
          });
    });
  });
});
