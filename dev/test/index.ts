// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {describe, it, beforeEach, before, afterEach, after} from 'mocha';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as extend from 'extend';

import * as Firestore from '../src';
import {DocumentSnapshot} from '../src';
import {QualifiedResourcePath} from '../src/path';

use(chaiAsPromised);

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(null);

const bytesData = Buffer.from('AQI=', 'base64');

const allSupportedTypesJson = {
  name: 'fdsg',
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
    new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)')
  ),
  pathValue: new Firestore.DocumentReference(
    {
      formattedName: DATABASE_ROOT,
      _getProjectId: () => ({projectId: PROJECT_ID, databaseId: '(default)'}),
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    new QualifiedResourcePath(PROJECT_ID, '(default)', 'collection', 'document')
  ),
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
    new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)')
  ),
  timestampValue: Firestore.Timestamp.fromDate(
    new Date('Mar 18, 1985 08:20:00.123 GMT+0100 (CET)')
  ),
  pathValue: new Firestore.DocumentReference(
    {
      formattedName: DATABASE_ROOT,
      _getProjectId: () => ({projectId: PROJECT_ID, databaseId: '(default)'}),
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    new QualifiedResourcePath(PROJECT_ID, '(default)', 'collection', 'document')
  ),
  arrayValue: ['foo', 42, 'bar'],
  emptyArray: [],
  nilValue: null,
  geoPointValue: new Firestore.GeoPoint(50.1430847, -122.947778),
  bytesValue: Buffer.from([0x1, 0x2]),
};

describe('snapshot_() method', () => {
  let firestore: Firestore.Firestore;

  function verifyAllSupportedTypes(actualObject: DocumentSnapshot) {
    const expected = extend(true, {}, allSupportedTypesOutput);
    // Deep Equal doesn't support matching instances of DocumentRefs, so we
    // compare them manually and remove them from the resulting object.
    expect(actualObject.get('pathValue').formattedName).to.equal(
      expected.pathValue.formattedName
    );
    const data = actualObject.data()!;
    delete data.pathValue;
    delete expected.pathValue;
    expect(data).to.deep.eq(expected);

    // We specifically test the GeoPoint properties to ensure 100% test
    // coverage.
    expect(data.geoPointValue.latitude).to.equal(50.1430847);
    expect(data.geoPointValue.longitude).to.equal(-122.947778);
    expect(
      data.geoPointValue.isEqual(
        new Firestore.GeoPoint(50.1430847, -122.947778)
      )
    ).to.be.true;
  }

  beforeEach(() => {
    // Unlike most other tests, we don't call `ensureClient` since the
    // `snapshot_` method does not require a GAPIC client.
    firestore = new Firestore.Firestore();
  });

  //afterEach(() => verifyInstance(firestore));

  it('handles ProtobufJS', () => {
    const doc = firestore.snapshot_({}, {seconds: 5, nanos: 6});

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
      '1970-01-01T00:00:05.000000006Z',
      'json'
    );

    expect(doc.exists).to.be.true;
    expect(doc.data()).to.deep.eq({
      a: bytesData,
      b: Firestore.Timestamp.fromDate(new Date('1985-03-18T07:20:00.000Z')),
      c: bytesData,
    });
    expect(doc.createTime!.isEqual(new Firestore.Timestamp(1, 2000000))).to.be
      .true;
    expect(doc.updateTime!.isEqual(new Firestore.Timestamp(3, 4000))).to.be
      .true;
    expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6))).to.be.true;
  });

  it('deserializes all supported types from Protobuf JS', () => {
    const doc = firestore.snapshot_(
      {},
      {
        seconds: 5,
        nanos: 6,
      }
    );

    verifyAllSupportedTypes(doc);
  });

  it('deserializes all supported types from Proto3 JSON', () => {
    const doc = firestore.snapshot_(
      allSupportedTypesJson,
      '1970-01-01T00:00:05.000000006Z',
      'json'
    );
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
        '1970-01-01T00:00:05.000000006Z',
        'json'
      );
    }).to.throw("Unable to infer type value fom '{}'.");

    expect(() => {
      firestore.snapshot_(
        {
          name: `${DATABASE_ROOT}/documents/collectionId/doc`,
          fields: {foo: {stringValue: 'bar', integerValue: 42}},
          createTime: '1970-01-01T00:00:01.000000002Z',
          updateTime: '1970-01-01T00:00:03.000000004Z',
        },
        '1970-01-01T00:00:05.000000006Z',
        'json'
      );
    }).to.throw(
      'Unable to infer type value fom \'{"stringValue":"bar","integerValue":42}\'.'
    );

    expect(() => {
      firestore.snapshot_(
        {
          name: `${DATABASE_ROOT}/documents/collectionId/doc`,
          fields: {foo: {stringValue: 'bar'}},
          createTime: '1970-01-01T00:00:01.NaNZ',
          updateTime: '1970-01-01T00:00:03.000000004Z',
        },
        '1970-01-01T00:00:05.000000006Z',
        'json'
      );
    }).to.throw(
      'Specify a valid ISO 8601 timestamp for "documentOrName.createTime".'
    );
  });

  it('handles missing document ', () => {
    const doc = firestore.snapshot_(
      `${DATABASE_ROOT}/documents/collectionId/doc`,
      '1970-01-01T00:00:05.000000006Z',
      'json'
    );

    expect(doc.exists).to.be.false;
    expect(doc.readTime.isEqual(new Firestore.Timestamp(5, 6))).to.be.true;
  });
});
