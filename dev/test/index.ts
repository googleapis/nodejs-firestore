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

import {expect} from 'chai';
import extend from 'extend';
import * as gax from 'google-gax';
import is from 'is';
import assert from 'power-assert';
import through2 from 'through2';

import * as Firestore from '../src';
import {ResourcePath} from '../src/path';
import {AnyDuringMigration} from '../src/types';
import {createInstance, InvalidApiUsage} from '../test/util/helpers';

const {grpc} = new gax.GrpcClient({} as AnyDuringMigration);

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const DEFAULT_SETTINGS = {
  projectId: PROJECT_ID,
  sslCreds: grpc.credentials.createInsecure(),
  keyFilename: __dirname + '/fake-certificate.json',
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
    nullValue: 0,
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
  pathValue: new Firestore.DocumentReference(
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
  pathValue: new Firestore.DocumentReference(
      {formattedName: DATABASE_ROOT},
      new ResourcePath(PROJECT_ID, '(default)', 'collection', 'document')),
  arrayValue: ['foo', 42, 'bar'],
  emptyArray: [],
  nilValue: null,
  geoPointValue: new Firestore.GeoPoint(50.1430847, -122.947778),
  bytesValue: Buffer.from([0x1, 0x2]),
};

function document(name, fields?) {
  return {
    name: `${DATABASE_ROOT}/documents/collectionId/${name}`,
    fields,
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

describe('instantiation', () => {
  it('creates instance', () => {
    const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
    assert(firestore instanceof Firestore.Firestore);
  });

  it('merges settings', () => {
    const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
    firestore.settings({foo: 'bar'});

    assert.equal(firestore['_initializationSettings'].projectId, PROJECT_ID);
    assert.equal(firestore['_initializationSettings'].foo, 'bar');
  });

  it('can only call settings() once', () => {
    const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
    firestore.settings({timestampsInSnapshots: true});

    assert.throws(
        () => firestore.settings({}),
        /Firestore.settings\(\) has already be called. You can only call settings\(\) once, and only before calling any other methods on a Firestore object./);
  });

  it('cannot change settings after client initialized', () => {
    const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
    firestore['_runRequest'](() => Promise.resolve());

    assert.throws(
        () => firestore.settings({}),
        /Firestore has already been started and its settings can no longer be changed. You can only call settings\(\) before calling any other methods on a Firestore object./);
  });

  it('validates project ID is string', () => {
    assert.throws(() => {
      const settings = Object.assign({}, DEFAULT_SETTINGS, {
        projectId: 1337,
      });
      new Firestore.Firestore(settings);
    }, /Argument "settings.projectId" is not a valid string/);

    assert.throws(() => {
      new Firestore.Firestore(DEFAULT_SETTINGS).settings({
        projectId: 1337
      } as InvalidApiUsage);
    }, /Argument "settings.projectId" is not a valid string/);
  });

  it('validates timestampsInSnapshots is boolean', () => {
    assert.throws(() => {
      const settings = Object.assign({}, DEFAULT_SETTINGS, {
        timestampsInSnapshots: 1337,
      });
      new Firestore.Firestore(settings);
    }, /Argument "settings.timestampsInSnapshots" is not a valid boolean/);

    assert.throws(() => {
      new Firestore.Firestore(DEFAULT_SETTINGS).settings({
        timestampsInSnapshots: 1337
      } as AnyDuringMigration);
    }, /Argument "settings.timestampsInSnapshots" is not a valid boolean/);
  });

  it('uses project id from constructor', () => {
    const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);

    return firestore['_runRequest'](() => {
      assert.equal(
          firestore.formattedName,
          `projects/${PROJECT_ID}/databases/(default)`);
      return Promise.resolve();
    });
  });

  it('detects project id', () => {
    const firestore = new Firestore.Firestore({
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: __dirname + '/fake-certificate.json',
    });

    assert.equal(
        firestore.formattedName, 'projects/{{projectId}}/databases/(default)');

    firestore['_detectProjectId'] = () => Promise.resolve(PROJECT_ID);

    return firestore['_runRequest'](() => {
      assert.equal(
          firestore.formattedName,
          `projects/${PROJECT_ID}/databases/(default)`);
      return Promise.resolve();
    });
  });

  it('uses project id from gapic client', () => {
    const firestore = new Firestore.Firestore({
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: './test/fake-certificate.json',
    });

    assert.equal(
        firestore.formattedName, 'projects/{{projectId}}/databases/(default)');

    const gapicClient = {getProjectId: callback => callback(null, PROJECT_ID)};

    return firestore['_detectProjectId'](gapicClient).then(projectId => {
      assert.equal(projectId, PROJECT_ID);
    });
  });

  it('uses project ID from settings()', () => {
    const firestore = new Firestore.Firestore({
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: './test/fake-certificate.json',
    });

    firestore.settings({projectId: PROJECT_ID});

    assert.equal(
        firestore.formattedName, `projects/${PROJECT_ID}/databases/(default)`);
  });

  it('handles error from project ID detection', () => {
    const firestore = new Firestore.Firestore({
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: './test/fake-certificate.json',
    });

    const gapicClient = {
      getProjectId: callback => callback(new Error('Injected Error'))
    };

    return firestore['_detectProjectId'](gapicClient)
        .then(() => assert.fail('Error ignored'))
        .catch(err => assert.equal('Injected Error', err.message));
  });

  it('exports all types', () => {
    // Ordering as per firestore.d.ts
    expect((Firestore.Firestore)).to.exist;
    assert.equal(Firestore.Firestore.name, 'Firestore');
    expect((Firestore.Timestamp)).to.exist;
    assert.equal(Firestore.Timestamp.name, 'Timestamp');
    expect((Firestore.GeoPoint)).to.exist;
    assert.equal(Firestore.GeoPoint.name, 'GeoPoint');
    expect((Firestore.Transaction)).to.exist;
    assert.equal(Firestore.Transaction.name, 'Transaction');
    expect((Firestore.WriteBatch)).to.exist;
    assert.equal(Firestore.WriteBatch.name, 'WriteBatch');
    expect((Firestore.DocumentReference)).to.exist;
    assert.equal(Firestore.DocumentReference.name, 'DocumentReference');
    expect((Firestore.WriteResult)).to.exist;
    assert.equal(Firestore.WriteResult.name, 'WriteResult');
    expect((Firestore.DocumentSnapshot)).to.exist;
    assert.equal(Firestore.DocumentSnapshot.name, 'DocumentSnapshot');
    expect((Firestore.QueryDocumentSnapshot)).to.exist;
    assert.equal(Firestore.QueryDocumentSnapshot.name, 'QueryDocumentSnapshot');
    expect((Firestore.Query)).to.exist;
    assert.equal(Firestore.Query.name, 'Query');
    expect(Firestore.QuerySnapshot).to.exist;
    assert.equal(Firestore.QuerySnapshot.name, 'QuerySnapshot');
    expect((Firestore.CollectionReference)).to.exist;
    assert.equal(Firestore.CollectionReference.name, 'CollectionReference');
    expect((Firestore.FieldValue)).to.exist;
    assert.equal(Firestore.FieldValue.name, 'FieldValue');
    expect((Firestore.FieldPath)).to.exist;
    assert.equal(Firestore.Firestore.name, 'Firestore');
    expect(Firestore.FieldValue.serverTimestamp().isEqual(
               Firestore.FieldValue.delete()))
        .to.be.false;
  });
});

describe('serializer', () => {
  it('supports all types', () => {
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

describe('snapshot_() method', () => {
  let firestore;

  function verifyAllSupportedTypes(actualObject) {
    const expected = extend(true, {}, allSupportedTypesOutput);
    // Deep Equal doesn't support matching instances of DocumentRefs, so we
    // compare them manually and remove them from the resulting object.
    assert.equal(
        actualObject.get('pathValue').formattedName,
        expected.pathValue.formattedName);
    const data = actualObject.data();
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
    expect(data.geoPointValue.isEqual(
               new Firestore.GeoPoint(50.1430847, -122.947778)))
        .to.be.true;
  }

  beforeEach(() => {
    // Unlike most other tests, we don't call `ensureClient` since the
    // `snapshot_` method does not require a GAPIC client.
    firestore = new Firestore.Firestore({
      projectId: PROJECT_ID,
      sslCreds: grpc.credentials.createInsecure(),
      timestampsInSnapshots: true,
      keyFilename: './test/fake-certificate.json',
    });
  });

  it('handles ProtobufJS', () => {
    const doc = firestore.snapshot_(
        document('doc', {
          foo: {valueType: 'bytesValue', bytesValue: bytesData},
        }),
        {seconds: 5, nanos: 6});

    assert.equal(true, doc.exists);
    assert.deepStrictEqual({foo: bytesData}, doc.data());
    expect(doc.createTime.isEqual(new Firestore.Timestamp(1, 2))).to.be.true;
    expect(doc.updateTime.isEqual(new Firestore.Timestamp(3, 4))).to.be.true;
    expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6))).to.be.true;
  });

  it('handles Proto3 JSON together with existing types', () => {
    // Google Cloud Functions must be able to call snapshot_() with Proto3 JSON
    // data.
    const doc = firestore.snapshot_(
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
    expect(doc.createTime.isEqual(new Firestore.Timestamp(1, 2000000)))
        .to.be.true;
    expect(doc.updateTime.isEqual(new Firestore.Timestamp(3, 4000))).to.be.true;
    expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6))).to.be.true;
  });

  it('deserializes all supported types from Protobuf JS', () => {
    const doc = firestore.snapshot_(allSupportedTypesProtobufJs, {
      seconds: 5,
      nanos: 6,
    });

    verifyAllSupportedTypes(doc);
  });

  it('deserializes all supported types from Proto3 JSON', () => {
    const doc = firestore.snapshot_(
        allSupportedTypesJson, '1970-01-01T00:00:05.000000006Z', 'json');
    verifyAllSupportedTypes(doc);
  });

  it('handles invalid Proto3 JSON', () => {
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

  it('handles missing document ', () => {
    const doc = firestore.snapshot_(
        `${DATABASE_ROOT}/documents/collectionId/doc`,
        '1970-01-01T00:00:05.000000006Z', 'json');

    assert.equal(false, doc.exists);
    expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6))).to.be.true;
  });

  it('handles invalid encoding format ', () => {
    assert.throws(() => {
      firestore.snapshot_(
          `${DATABASE_ROOT}/documents/collectionId/doc`,
          '1970-01-01T00:00:05.000000006Z', 'ascii');
    }, /Unsupported encoding format. Expected 'json' or 'protobufJS', but was 'ascii'./);
  });
});

describe('doc() method', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('returns DocumentReference', () => {
    const documentRef = firestore.doc('collectionId/documentId');
    expect(documentRef).to.be.an.instanceOf(Firestore.DocumentReference);
  });

  it('requires document path', () => {
    assert.throws(
        () => firestore.doc(),
        /Argument "documentPath" is not a valid ResourcePath. Path must be a non-empty string./);
  });

  it('doesn\'t accept empty components', () => {
    assert.throws(
        () => firestore.doc('coll//doc'),
        /Argument "documentPath" is not a valid ResourcePath. Paths must not contain \/\/./);
  });

  it('must point to document', () => {
    assert.throws(
        () => firestore.doc('collectionId'),
        /Argument "documentPath" must point to a document, but was "collectionId". Your path does not contain an even number of components\./);
  });

  it('exposes properties', () => {
    const documentRef = firestore.doc('collectionId/documentId');
    assert.equal(documentRef.id, 'documentId');
    assert.equal(documentRef.firestore, firestore);
  });
});

describe('collection() method', () => {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('returns collection', () => {
    const collection = firestore.collection('col1/doc1/col2');
    expect(collection).to.be.an.instanceOf(Firestore.CollectionReference);
  });

  it('requires collection id', () => {
    assert.throws(
        () => firestore.collection(),
        /Argument "collectionPath" is not a valid ResourcePath. Path must be a non-empty string./);
  });


  it('must point to a collection', () => {
    assert.throws(
        () => firestore.collection('collectionId/documentId'),
        /Argument "collectionPath" must point to a collection, but was "collectionId\/documentId". Your path does not contain an odd number of components\./);
  });

  it('exposes properties', () => {
    const collection = firestore.collection('collectionId');
    expect(collection.id).to.exist;
    expect(collection.doc).to.exist;
    assert.equal(collection.id, 'collectionId');
  });
});

describe('listCollections() method', () => {
  it('returns collections', () => {
    const overrides = {
      listCollectionIds: (request, options, callback) => {
        assert.deepStrictEqual(request, {
          parent: `projects/${PROJECT_ID}/databases/(default)`,
        });

        callback(null, ['first', 'second']);
      }
    };

    return createInstance(overrides).then(firestore => {
      // We are using `getCollections()` to ensure 100% code coverage
      return firestore.getCollections().then(collections => {
        assert.equal(collections[0].path, 'first');
        assert.equal(collections[1].path, 'second');
      });
    });
  });
});

describe('getAll() method', () => {
  function resultEquals(result, ...docs) {
    assert.equal(result.length, arguments.length - 1);

    for (let i = 0; i < result.length; ++i) {
      const doc = arguments[i + 1];

      if (doc.found) {
        expect(result[i].exists).to.be.true;
        assert.equal(result[i].ref.formattedName, doc.found.name);
      } else {
        expect(result[i].exists).to.be.false;
        assert.equal(result[i].ref.formattedName, doc.missing);
      }
    }
  }

  it('accepts empty list', () => {
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

  it('accepts single document', () => {
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

  it('verifies response', () => {
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

  it('handles stream exception during initialization', () => {
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

  it('handles stream exception after initialization', () => {
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

  it('handles serialization error', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found('documentId'));
      }
    };

    return createInstance(overrides).then(firestore => {
      firestore['snapshot_'] = () => {
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

  it('only retries on GRPC unavailable', () => {
    const expectedErrorAttempts = {
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

    const actualErrorAttempts = {};

    const overrides = {
      batchGetDocuments: request => {
        const errorCode = Number(request.documents[0].split('/').pop());
        actualErrorAttempts[errorCode] =
            (actualErrorAttempts[errorCode] || 0) + 1;
        const error = new Error('Expected exception');
        // tslint:disable-next-line:no-any
        (error as any).code = errorCode;
        return stream(error);
      }
    };

    return createInstance(overrides).then(firestore => {
      const coll = firestore.collection('collectionId');

      const promises: Array<Promise<void>> = [];

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

  it('requires document reference', () => {
    return createInstance().then(firestore => {
      assert.throws(() => {
        (firestore as InvalidApiUsage).getAll({});
      }, /Argument at index 0 is not a valid DocumentReference\./);
    });
  });

  it('accepts array', () => {
    const overrides = {batchGetDocuments: () => stream(found('documentId'))};

    return createInstance(overrides).then(firestore => {
      return firestore.getAll(firestore.doc('collectionId/documentId'))
          .then(result => {
            resultEquals(result, found('documentId'));
          });
    });
  });

  it('returns not found for missing documents', () => {
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

  it('returns results in order', () => {
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

  it('accepts same document multiple times', () => {
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
