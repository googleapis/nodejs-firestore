// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {expect} from 'chai';
import {afterEach, beforeEach, describe, it} from 'mocha';
import {firestore} from '../protos/firestore_v1_proto_api';
import {Firestore, Timestamp} from '../src';
import {
  bundleToElementArray,
  createInstance,
  DATABASE_ROOT,
  verifyInstance,
} from './util/helpers';
import IBundleElement = firestore.IBundleElement;

describe.only('Bundle Buidler', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  afterEach(() => verifyInstance(firestore));

  // Tests the testing helper function bundleToElementArray works as expected.
  it('succeeds to read length prefixed json with testing function', async () => {
    const bundleString =
      '20{"a":"string value"}9{"b":123}26{"c":{"d":"nested value"}}';
    const elements = await bundleToElementArray(Buffer.from(bundleString));
    expect(elements).to.deep.equal([
      {a: 'string value'},
      {b: 123},
      {c: {d: 'nested value'}},
    ]);
  });

  it('succeeds with document snapshots', async () => {
    const bundle = firestore.bundle('test-bundle');
    const snap1 = firestore.snapshot_(
      {
        name: `${DATABASE_ROOT}/documents/collectionId/doc1`,
        fields: {foo: {stringValue: 'value'}, bar: {integerValue: 42}},
        createTime: '1970-01-01T00:00:01.002Z',
        updateTime: '1970-01-01T00:00:03.000004Z',
      },
      // This should be the bundle read time.
      '2020-01-01T00:00:05.000000006Z',
      'json'
    );
    // Same document but older read time.
    const snap2 = firestore.snapshot_(
      {
        name: `${DATABASE_ROOT}/documents/collectionId/doc1`,
        fields: {foo: {stringValue: 'value'}, bar: {integerValue: -42}},
        createTime: '1970-01-01T00:00:01.002Z',
        updateTime: '1970-01-01T00:00:03.000004Z',
      },
      '1970-01-01T00:00:05.000000006Z',
      'json'
    );

    bundle.add(snap1);
    bundle.add(snap2);
    // Bundle is expected to be [bundleMeta, snap2Meta, snap2] because `snap2` is added later.
    const elements = await bundleToElementArray(bundle.build());
    expect(elements.length).to.equal(3);

    const meta = (elements[0] as IBundleElement).metadata;
    expect(meta).to.deep.equal({
      id: 'test-bundle',
      // `snap1.readTime` is the bundle createTime, because it is larger than `snap2.readTime`.
      createTime: snap1.readTime.toProto().timestampValue,
    });

    // Verify doc1Meta and doc1Snap
    const docMeta = (elements[1] as IBundleElement).documentMetadata;
    const docSnap = (elements[2] as IBundleElement).document;
    expect(docMeta).to.deep.equal({
      documentKey: snap2.toDocumentProto().name,
      readTime: snap2.readTime.toProto().timestampValue,
    });
    expect(docSnap).to.deep.equal(snap2.toDocumentProto());
  });

  it('succeeds with multiple calls to build()', async () => {
    const bundle = firestore.bundle('test-bundle');
    const snap1 = firestore.snapshot_(
      {
        name: `${DATABASE_ROOT}/documents/collectionId/doc1`,
        fields: {foo: {stringValue: 'value'}, bar: {integerValue: 42}},
        createTime: '1970-01-01T00:00:01.002Z',
        updateTime: '1970-01-01T00:00:03.000004Z',
      },
      // This should be the bundle read time.
      '2020-01-01T00:00:05.000000006Z',
      'json'
    );
    bundle.add(snap1);
    // Bundle is expected to be [bundleMeta, doc1Meta, doc1Snap].
    const elements = await bundleToElementArray(bundle.build());

    expect(elements.length).to.equal(3);

    const meta = (elements[0] as IBundleElement).metadata;
    expect(meta).to.deep.equal({
      id: 'test-bundle',
      // `snap1.readTime` is the bundle createTime, because it is larger than `snap2.readTime`.
      createTime: snap1.readTime.toProto().timestampValue,
    });

    // Verify doc1Meta and doc1Snap
    const doc1Meta = (elements[1] as IBundleElement).documentMetadata;
    const doc1Snap = (elements[2] as IBundleElement).document;
    expect(doc1Meta).to.deep.equal({
      documentKey: snap1.toDocumentProto().name,
      readTime: snap1.readTime.toProto().timestampValue,
    });
    expect(doc1Snap).to.deep.equal(snap1.toDocumentProto());

    // Add another document
    const snap2 = firestore.snapshot_(
      {
        name: `${DATABASE_ROOT}/documents/collectionId/doc2`,
        fields: {foo: {stringValue: 'value'}, bar: {integerValue: -42}},
        createTime: '1970-01-01T00:00:01.002Z',
        updateTime: '1970-01-01T00:00:03.000004Z',
      },
      '1970-01-01T00:00:05.000000006Z',
      'json'
    );
    bundle.add(snap2);

    // Bundle is expected to be [bundleMeta, doc1Meta, doc1Snap, doc2Meta, doc2Snap].
    const newElements = await bundleToElementArray(bundle.build());

    expect(newElements.length).to.equal(5);
    expect(newElements.slice(0, 3)).to.deep.equal(elements);

    // Verify doc2Meta and doc2Snap
    const doc2Meta = (newElements[3] as IBundleElement).documentMetadata;
    const doc2Snap = (newElements[4] as IBundleElement).document;
    expect(doc2Meta).to.deep.equal({
      documentKey: snap2.toDocumentProto().name,
      readTime: snap2.readTime.toProto().timestampValue,
    });
    expect(doc2Snap).to.deep.equal(snap2.toDocumentProto());
  });

  it('succeeds when nothing is added', async () => {
    const bundle = firestore.bundle('test-bundle');

    // `elements` is expected to be [bundleMeta].
    const elements = await bundleToElementArray(bundle.build());
    expect(elements.length).to.equal(1);

    const meta = (elements[0] as IBundleElement).metadata;
    expect(meta).to.deep.equal({
      id: 'test-bundle',
      createTime: new Timestamp(0, 0).toProto().timestampValue,
    });
  });
});
