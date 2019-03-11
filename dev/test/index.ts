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
import * as extend from 'extend';
import * as gax from 'google-gax';

import {google} from '../protos/firestore_proto_api';

import * as Firestore from '../src';
import {DocumentSnapshot, FieldPath} from '../src';
import {QualifiedResourcePath} from '../src/path';
import {GrpcError} from '../src/types';
import {ApiOverride, createInstance, document, DOCUMENT_NAME, found, InvalidApiUsage, missing, stream} from './util/helpers';

import api = google.firestore.v1;

const {grpc} = new gax.GrpcClient({});

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const DEFAULT_SETTINGS = {
  projectId: PROJECT_ID,
  sslCreds: grpc.credentials.createInsecure(),
  keyFilename: __dirname + '/fake-certificate.json'
};

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

const bytesData = Buffer.from('AQI=', 'base64');

const allSupportedTypesProtobufJs = document(
    'documentId', 'arrayValue', {
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
    'emptyArray', {
      arrayValue: {},
    },
    'dateValue', {
      timestampValue: {
        nanos: 123000000,
        seconds: 479978400,
      }
    },
    'timestampValue', {
      timestampValue: {
        nanos: 123000000,
        seconds: 479978400,
      }
    },
    'doubleValue', {
      doubleValue: 0.1,
    },
    'falseValue', {
      booleanValue: false,
    },
    'infinityValue', {
      doubleValue: Infinity,
    },
    'integerValue', {
      integerValue: 0,
    },
    'negativeInfinityValue', {
      doubleValue: -Infinity,
    },
    'nilValue', {
      nullValue: 'NULL_VALUE',
    },
    'objectValue', {
      mapValue: {
        fields: {
          foo: {
            stringValue: 'bar',
          },
        },
      },
    },
    'emptyObject', {
      mapValue: {},
    },
    'pathValue', {
      referenceValue: `${DATABASE_ROOT}/documents/collection/document`,
    },
    'stringValue', {
      stringValue: 'a',
    },
    'trueValue', {
      booleanValue: true,
    },
    'geoPointValue', {
      geoPointValue: {
        latitude: 50.1430847,
        longitude: -122.947778,
      },
    },
    'bytesValue', {
      bytesValue: Buffer.from('AQI=', 'base64'),
    });

const allSupportedTypesJson = {
  name: `${DOCUMENT_NAME}`,
  fields: {
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
  },
  createTime: {seconds: 1, nanos: 2},
  updateTime: {seconds: 3, nanos: 4},
};

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
      {
        formattedName: DATABASE_ROOT,
        _getProjectId: () =>
            ({projectId: PROJECT_ID, databaseId: '(default)'})
      } as any,  // tslint:disable-line no-any
      new QualifiedResourcePath(
          PROJECT_ID, '(default)', 'collection', 'document')),
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
      {
        formattedName: DATABASE_ROOT,
        _getProjectId: () =>
            ({projectId: PROJECT_ID, databaseId: '(default)'})
      } as any,  // tslint:disable-line no-any
      new QualifiedResourcePath(
          PROJECT_ID, '(default)', 'collection', 'document')),
  arrayValue: ['foo', 42, 'bar'],
  emptyArray: [],
  nilValue: null,
  geoPointValue: new Firestore.GeoPoint(50.1430847, -122.947778),
  bytesValue: Buffer.from([0x1, 0x2]),
};

describe('instantiation', () => {
  it('creates instance', () => {
    const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
    expect(firestore).to.be.an.instanceOf(Firestore.Firestore);
  });

  it('merges settings', () => {
    const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
    firestore.settings({foo: 'bar'});

    expect(firestore._settings.projectId).to.equal(PROJECT_ID);
    expect(firestore._settings.foo).to.equal('bar');
  });

  it('can only call settings() once', () => {
    const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
    firestore.settings({});

    expect(() => firestore.settings({}))
        .to.throw(
            'Firestore has already been initialized. You can only call settings() once, and only before calling any other methods on a Firestore object.');
  });

  it('cannot change settings after client initialized', async () => {
    const firestore = new Firestore.Firestore(DEFAULT_SETTINGS);
    await firestore.initializeIfNeeded();

    expect(() => firestore.settings({}))
        .to.throw(
            'Firestore has already been initialized. You can only call settings() once, and only before calling any other methods on a Firestore object.');
  });

  it('validates project ID is string', () => {
    expect(() => {
      const settings = Object.assign({}, DEFAULT_SETTINGS, {
        projectId: 1337,
      });
      new Firestore.Firestore(settings);
    }).to.throw('Argument "settings.projectId" is not a valid string.');

    expect(() => {
      new Firestore.Firestore(DEFAULT_SETTINGS).settings({
        projectId: 1337
      } as InvalidApiUsage);
    }).to.throw('Argument "settings.projectId" is not a valid string.');
  });

  it('validates timestampsInSnapshots is boolean', () => {
    expect(() => {
      const settings = Object.assign({}, DEFAULT_SETTINGS, {
        timestampsInSnapshots: 1337,
      });
      new Firestore.Firestore(settings);
    })
        .to.throw(
            'Argument "settings.timestampsInSnapshots" is not a valid boolean.');

    expect(() => {
      new Firestore.Firestore(DEFAULT_SETTINGS).settings({
        timestampsInSnapshots: 1337 as InvalidApiUsage
      });
    })
        .to.throw(
            'Argument "settings.timestampsInSnapshots" is not a valid boolean.');
  });

  it('uses project id from constructor', () => {
    const firestore = new Firestore.Firestore({projectId: 'foo'});

    return expect(firestore.formattedName)
        .to.equal(`projects/foo/databases/(default)`);
  });

  it('uses project id from gapic client', async () => {
    return createInstance(
               {
                 getProjectId: (callback => {
                   callback(null, 'foo');
                 })
               },
               {projectId: undefined})
        .then(async firestore => {
          await firestore.initializeIfNeeded();
          expect(firestore.projectId).to.equal('foo');
          expect(firestore.formattedName)
              .to.equal(`projects/foo/databases/(default)`);
        });
  });

  it('uses project ID from settings()', () => {
    const firestore = new Firestore.Firestore({
      sslCreds: grpc.credentials.createInsecure(),
      keyFilename: './test/fake-certificate.json',
    });

    firestore.settings({projectId: PROJECT_ID});

    expect(firestore.formattedName)
        .to.equal(`projects/${PROJECT_ID}/databases/(default)`);
  });

  it('handles error from project ID detection', () => {
    return createInstance(
               {
                 getProjectId: (callback => {
                   callback(new Error('Injected Error'), null);
                 })
               },
               {projectId: undefined})
        .then(firestore => {
          return expect(firestore.collection('foo').add({}))
              .to.eventually.be.rejectedWith('Injected Error');
        });
  });

  it('exports all types', () => {
    // Ordering as per firestore.d.ts
    expect((Firestore.Firestore)).to.exist;
    expect(Firestore.Firestore.name).to.equal('Firestore');
    expect((Firestore.Timestamp)).to.exist;
    expect(Firestore.Timestamp.name).to.equal('Timestamp');
    expect((Firestore.GeoPoint)).to.exist;
    expect(Firestore.GeoPoint.name).to.equal('GeoPoint');
    expect((Firestore.Transaction)).to.exist;
    expect(Firestore.Transaction.name).to.equal('Transaction');
    expect((Firestore.WriteBatch)).to.exist;
    expect(Firestore.WriteBatch.name).to.equal('WriteBatch');
    expect((Firestore.DocumentReference)).to.exist;
    expect(Firestore.DocumentReference.name).to.equal('DocumentReference');
    expect((Firestore.WriteResult)).to.exist;
    expect(Firestore.WriteResult.name).to.equal('WriteResult');
    expect((Firestore.DocumentSnapshot)).to.exist;
    expect(Firestore.DocumentSnapshot.name).to.equal('DocumentSnapshot');
    expect((Firestore.QueryDocumentSnapshot)).to.exist;
    expect(Firestore.QueryDocumentSnapshot.name)
        .to.equal('QueryDocumentSnapshot');
    expect((Firestore.Query)).to.exist;
    expect(Firestore.Query.name).to.equal('Query');
    expect(Firestore.QuerySnapshot).to.exist;
    expect(Firestore.QuerySnapshot.name).to.equal('QuerySnapshot');
    expect((Firestore.CollectionReference)).to.exist;
    expect(Firestore.CollectionReference.name).to.equal('CollectionReference');
    expect((Firestore.FieldValue)).to.exist;
    expect(Firestore.FieldValue.name).to.equal('FieldValue');
    expect((Firestore.FieldPath)).to.exist;
    expect(Firestore.Firestore.name).to.equal('Firestore');
    expect(Firestore.FieldValue.serverTimestamp().isEqual(
               Firestore.FieldValue.delete()))
        .to.be.false;
  });
});

describe('serializer', () => {
  it('supports all types', () => {
    const overrides: ApiOverride = {
      commit: (request, options, callback) => {
        expect(allSupportedTypesProtobufJs.fields)
            .to.deep.eq(request.writes![0].update!.fields);
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
  let firestore: Firestore.Firestore;

  function verifyAllSupportedTypes(actualObject: DocumentSnapshot) {
    const expected = extend(true, {}, allSupportedTypesOutput);
    // Deep Equal doesn't support matching instances of DocumentRefs, so we
    // compare them manually and remove them from the resulting object.
    expect(actualObject.get('pathValue').formattedName)
        .to.equal(expected.pathValue.formattedName);
    const data = actualObject.data()!;
    delete data.pathValue;
    delete expected.pathValue;
    expect(data).to.deep.eq(expected);

    // We specifically test the GeoPoint properties to ensure 100% test
    // coverage.
    expect(data.geoPointValue.latitude).to.equal(50.1430847);
    expect(data.geoPointValue.longitude).to.equal(-122.947778);
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
      keyFilename: './test/fake-certificate.json',
    });
  });

  it('handles ProtobufJS', () => {
    const doc = firestore.snapshot_(
        document('doc', 'foo', {bytesValue: bytesData}),
        {seconds: 5, nanos: 6});

    expect(doc.exists).to.be.true;
    expect({foo: bytesData}).to.deep.eq(doc.data());
    expect(doc.createTime!.isEqual(new Firestore.Timestamp(1, 2))).to.be.true;
    expect(doc.updateTime!.isEqual(new Firestore.Timestamp(3, 4))).to.be.true;
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

    expect(doc.exists).to.be.true;
    expect(doc.data()).to.deep.eq({
      a: bytesData,
      b: Firestore.Timestamp.fromDate(new Date('1985-03-18T07:20:00.000Z')),
      c: bytesData,
    });
    expect(doc.createTime!.isEqual(new Firestore.Timestamp(1, 2000000)))
        .to.be.true;
    expect(doc.updateTime!.isEqual(new Firestore.Timestamp(3, 4000)))
        .to.be.true;
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
    expect(() => {
      firestore.snapshot_(
          {
            name: `${DATABASE_ROOT}/documents/collectionId/doc`,
            fields: {foo: {}},
            createTime: '1970-01-01T00:00:01.000000002Z',
            updateTime: '1970-01-01T00:00:03.000000004Z',
          },
          '1970-01-01T00:00:05.000000006Z', 'json');
    }).to.throw('Unable to infer type value fom \'{}\'.');

    expect(() => {
      firestore.snapshot_(
          {
            name: `${DATABASE_ROOT}/documents/collectionId/doc`,
            fields: {foo: {stringValue: 'bar', integerValue: 42}},
            createTime: '1970-01-01T00:00:01.000000002Z',
            updateTime: '1970-01-01T00:00:03.000000004Z',
          },
          '1970-01-01T00:00:05.000000006Z', 'json');
    })
        .to.throw(
            'Unable to infer type value fom \'{"stringValue":"bar","integerValue":42}\'.');

    expect(() => {
      firestore.snapshot_(
          {
            name: `${DATABASE_ROOT}/documents/collectionId/doc`,
            fields: {foo: {stringValue: 'bar'}},
            createTime: '1970-01-01T00:00:01.NaNZ',
            updateTime: '1970-01-01T00:00:03.000000004Z',
          },
          '1970-01-01T00:00:05.000000006Z', 'json');
    })
        .to.throw(
            'Specify a valid ISO 8601 timestamp for "documentOrName.createTime".');
  });

  it('handles missing document ', () => {
    const doc = firestore.snapshot_(
        `${DATABASE_ROOT}/documents/collectionId/doc`,
        '1970-01-01T00:00:05.000000006Z', 'json');

    expect(doc.exists).to.be.false;
    expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6))).to.be.true;
  });

  it('handles invalid encoding format ', () => {
    expect(() => {
      firestore.snapshot_(
          `${DATABASE_ROOT}/documents/collectionId/doc`,
          '1970-01-01T00:00:05.000000006Z', 'ascii' as InvalidApiUsage);
    })
        .to.throw(
            'Unsupported encoding format. Expected "json" or "protobufJS", but was "ascii".');
  });
});

describe('doc() method', () => {
  let firestore: Firestore.Firestore;

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
    expect(() => (firestore as InvalidApiUsage).doc())
        .to.throw(
            'Argument "documentPath" is not a valid resource path. Path must be a non-empty string.');
  });

  it('doesn\'t accept empty components', () => {
    expect(() => firestore.doc('coll//doc'))
        .to.throw(
            'Argument "documentPath" is not a valid resource path. Paths must not contain //.');
  });

  it('must point to document', () => {
    expect(() => firestore.doc('collectionId'))
        .to.throw(
            'Argument "documentPath" must point to a document, but was "collectionId". Your path does not contain an even number of components.');
  });

  it('exposes properties', () => {
    const documentRef = firestore.doc('collectionId/documentId');
    expect(documentRef.id).to.equal('documentId');
    expect(documentRef.firestore).to.equal(firestore);
  });
});

describe('collection() method', () => {
  let firestore: Firestore.Firestore;

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
    expect(() => (firestore as InvalidApiUsage).collection())
        .to.throw(
            'Argument "collectionPath" is not a valid resource path. Path must be a non-empty string.');
  });


  it('must point to a collection', () => {
    expect(() => firestore.collection('collectionId/documentId'))
        .to.throw(
            'Argument "collectionPath" must point to a collection, but was "collectionId/documentId". Your path does not contain an odd number of components.');
  });

  it('exposes properties', () => {
    const collection = firestore.collection('collectionId');
    expect(collection.id).to.exist;
    expect(collection.doc).to.exist;
    expect(collection.id).to.equal('collectionId');
  });
});

describe('listCollections() method', () => {
  it('returns collections', () => {
    const overrides: ApiOverride = {
      listCollectionIds: (request, options, callback) => {
        expect(request).to.deep.eq({
          parent: `projects/${PROJECT_ID}/databases/(default)/documents`,
        });

        callback(null, ['first', 'second']);
      }
    };

    return createInstance(overrides).then(firestore => {
      // We are using `getCollections()` to ensure 100% code coverage
      return firestore.getCollections().then(collections => {
        expect(collections[0].path).to.equal('first');
        expect(collections[1].path).to.equal('second');
      });
    });
  });
});

describe('getAll() method', () => {
  function resultEquals(
      result: DocumentSnapshot[], ...docs: api.IBatchGetDocumentsResponse[]) {
    expect(result.length).to.equal(arguments.length - 1);

    for (let i = 0; i < result.length; ++i) {
      const doc = arguments[i + 1];

      if (doc.found) {
        expect(result[i].exists).to.be.true;
        expect(result[i].ref.formattedName).to.equal(doc.found.name);
      } else {
        expect(result[i].exists).to.be.false;
        expect(result[i].ref.formattedName).to.equal(doc.missing);
      }
    }
  }

  it('accepts single document', () => {
    const overrides: ApiOverride = {
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
    const overrides: ApiOverride = {
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
            expect(err.message)
                .to.equal(
                    'Did not receive document for "collectionId/documentId".');
          });
    });
  });

  it('handles stream exception during initialization', () => {
    const overrides: ApiOverride = {
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
            expect(err.message).to.equal('Expected exception');
          });
    });
  });

  it('handles stream exception after initialization', () => {
    const overrides: ApiOverride = {
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
            expect(err.message).to.equal('Expected exception');
          });
    });
  });

  it('handles serialization error', () => {
    const overrides: ApiOverride = {
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
            expect(err.message).to.equal('Expected exception');
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

    const actualErrorAttempts: {[k: number]: number} = {};

    const overrides: ApiOverride = {
      batchGetDocuments: request => {
        const errorCode = Number(request.documents![0].split('/').pop());
        actualErrorAttempts[errorCode] =
            (actualErrorAttempts[errorCode] || 0) + 1;
        const error = new GrpcError('Expected exception');
        error.code = errorCode;
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
                            expect(err.code).to.equal(Number(errorCode));
                          }));
      });

      return Promise.all(promises).then(() => {
        expect(actualErrorAttempts).to.deep.eq(expectedErrorAttempts);
      });
    });
  });

  it('requires at least one argument', () => {
    return createInstance().then(firestore => {
      expect(() => (firestore as InvalidApiUsage).getAll())
          .to.throw(
              'Function "Firestore.getAll()" requires at least 1 argument.');
    });
  });

  it('validates document references', () => {
    return createInstance().then(firestore => {
      expect(() => firestore.getAll(null as InvalidApiUsage))
          .to.throw('Argument at index 0 is not a valid DocumentReference.');
    });
  });

  it('accepts array', () => {
    const overrides:
        ApiOverride = {batchGetDocuments: () => stream(found('documentId'))};

    return createInstance(overrides).then(firestore => {
      return (firestore as InvalidApiUsage)
          .getAll([firestore.doc('collectionId/documentId')])
          .then((result: DocumentSnapshot[]) => {
            resultEquals(result, found('documentId'));
          });
    });
  });

  it('returns not found for missing documents', () => {
    const overrides: ApiOverride = {
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
    const overrides: ApiOverride = {
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
                found(document(('fourth'))));
          });
    });
  });

  it('accepts same document multiple times', () => {
    const overrides: ApiOverride = {
      batchGetDocuments: request => {
        expect(request.documents!.length).to.equal(2);
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

  it('applies field mask', () => {
    const overrides: ApiOverride = {
      batchGetDocuments: request => {
        expect(request.mask!.fieldPaths).to.have.members([
          'foo.bar', '`foo.bar`'
        ]);
        return stream(found('a'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore.getAll(
          firestore.doc('collectionId/a'),
          {fieldMask: ['foo.bar', new FieldPath('foo.bar')]});
    });
  });

  it('validates field mask', () => {
    return createInstance().then(firestore => {
      expect(() => firestore.getAll(firestore.doc('collectionId/a'), {
        fieldMask: null
      } as InvalidApiUsage))
          .to.throw(
              'Argument "options" is not a valid read option. "fieldMask" is not an array.');

      expect(() => firestore.getAll(firestore.doc('collectionId/a'), {
        fieldMask: ['a', new FieldPath('b'), null]
      } as InvalidApiUsage))
          .to.throw(
              'Argument "options" is not a valid read option. "fieldMask" is not valid: Argument at index 2 is not a valid field path. Paths can only be specified as strings or via a FieldPath object.');
    });
  });
});
