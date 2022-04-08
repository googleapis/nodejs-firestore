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

import {
  QuerySnapshot,
  DocumentData,
  WithFieldValue,
  PartialWithFieldValue,
  SetOptions,
  Settings,
} from '@google-cloud/firestore';

import {describe, it, before, beforeEach, afterEach} from 'mocha';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as extend from 'extend';
import {firestore} from '../protos/firestore_v1_proto_api';

import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  FieldValue,
  Firestore,
  GeoPoint,
  Query,
  QueryDocumentSnapshot,
  setLogFunction,
  Timestamp,
  WriteResult,
} from '../src';
import {autoId, Deferred} from '../src/util';
import {TEST_BUNDLE_ID, verifyMetadata} from '../test/bundle';
import {
  bundleToElementArray,
  Post,
  postConverter,
  postConverterMerge,
  verifyInstance,
} from '../test/util/helpers';
import {BulkWriter} from '../src/bulk-writer';
import {Status} from 'google-gax';
import {QueryPartition} from '../src/query-partition';
import {CollectionGroup} from '../src/collection-group';

import IBundleElement = firestore.IBundleElement;

use(chaiAsPromised);

const version = require('../../package.json').version;

class DeferredPromise<T> {
  resolve: Function;
  reject: Function;
  promise: Promise<T> | null;

  constructor() {
    this.resolve = () => {
      throw new Error('DeferredPromise.resolve has not been initialized');
    };
    this.reject = () => {
      throw new Error('DeferredPromise.reject has not been initialized');
    };
    this.promise = null;
  }
}

if (process.env.NODE_ENV === 'DEBUG') {
  setLogFunction(console.log);
}

function getTestRoot(settings: Settings = {}) {
  const firestore = new Firestore({
    ...settings,
    preferRest: !!process.env.USE_REST_FALLBACK,
  });
  return firestore.collection(`node_${version}_${autoId()}`);
}

describe('Firestore class', () => {
  let firestore: Firestore;
  let randomCol: CollectionReference;

  beforeEach(() => {
    randomCol = getTestRoot();
    firestore = randomCol.firestore;
  });

  afterEach(() => verifyInstance(firestore));

  it('has collection() method', () => {
    const ref = firestore.collection('col');
    expect(ref.id).to.equal('col');
  });

  it('has doc() method', () => {
    const ref = firestore.doc('col/doc');
    expect(ref.id).to.equal('doc');
  });

  it('has getAll() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');
    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'a'})])
      .then(() => {
        return firestore.getAll(ref1, ref2);
      })
      .then(docs => {
        expect(docs.length).to.equal(2);
      });
  });

  it('getAll() supports array destructuring', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');
    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'a'})])
      .then(() => {
        return firestore.getAll(...[ref1, ref2]);
      })
      .then(docs => {
        expect(docs.length).to.equal(2);
      });
  });

  it('getAll() supports field mask', () => {
    const ref1 = randomCol.doc('doc1');
    return ref1
      .set({foo: 'a', bar: 'b'})
      .then(() => {
        return firestore.getAll(ref1, {fieldMask: ['foo']});
      })
      .then(docs => {
        expect(docs[0].data()).to.deep.equal({foo: 'a'});
      });
  });

  it('getAll() supports array destructuring with field mask', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');
    return Promise.all([ref1.set({f: 'a', b: 'b'}), ref2.set({f: 'a', b: 'b'})])
      .then(() => {
        return firestore.getAll(...[ref1, ref2], {fieldMask: ['f']});
      })
      .then(docs => {
        expect(docs[0].data()).to.deep.equal({f: 'a'});
        expect(docs[1].data()).to.deep.equal({f: 'a'});
      });
  });

  it('getAll() supports generics', async () => {
    const ref1 = randomCol.doc('doc1').withConverter(postConverter);
    const ref2 = randomCol.doc('doc2').withConverter(postConverter);
    await ref1.set(new Post('post1', 'author1'));
    await ref2.set(new Post('post2', 'author2'));

    const docs = await firestore.getAll(ref1, ref2);
    expect(docs[0].data()!.toString()).to.deep.equal('post1, by author1');
    expect(docs[1].data()!.toString()).to.deep.equal('post2, by author2');
  });

  it('cannot make calls after the client has been terminated', () => {
    const ref1 = randomCol.doc('doc1');
    return firestore
      .terminate()
      .then(() => {
        return ref1.set({foo: 100});
      })
      .then(() => Promise.reject('set() should have failed'))
      .catch(err => {
        expect(err.message).to.equal('The client has already been terminated');
      });
  });

  it('throws an error if terminate() is called with active listeners', async () => {
    const ref = randomCol.doc('doc-1');
    const unsubscribe = ref.onSnapshot(() => {
      // No-op
    });

    await expect(firestore.terminate()).to.eventually.be.rejectedWith(
      'All onSnapshot() listeners must be unsubscribed, and all BulkWriter ' +
        'instances must be closed before terminating the client. There are 1 ' +
        'active listeners and 0 open BulkWriter instances.'
    );
    unsubscribe();
  });

  it('throws an error if terminate() is called with pending BulkWriter operations', async () => {
    const writer = firestore.bulkWriter();
    const ref = randomCol.doc('doc-1');
    writer.set(ref, {foo: 'bar'});
    await expect(firestore.terminate()).to.eventually.be.rejectedWith(
      'All onSnapshot() listeners must be unsubscribed, and all BulkWriter ' +
        'instances must be closed before terminating the client. There are 0 ' +
        'active listeners and 1 open BulkWriter instances.'
    );
  });
});

describe('CollectionGroup class', () => {
  const desiredPartitionCount = 3;
  const documentCount = 2 * 128 + 127; // Minimum partition size is 128.

  let firestore: Firestore;
  let randomColl: CollectionReference;
  let collectionGroup: CollectionGroup;

  before(async () => {
    randomColl = getTestRoot();
    firestore = randomColl.firestore;
    collectionGroup = firestore.collectionGroup(randomColl.id);

    const batch = firestore.batch();
    for (let i = 0; i < documentCount; ++i) {
      batch.create(randomColl.doc(), {title: 'post', author: 'author'});
    }
    await batch.commit();
  });

  async function getPartitions<T>(
    collectionGroup: CollectionGroup<T>,
    desiredPartitionsCount: number
  ): Promise<QueryPartition<T>[]> {
    const partitions: QueryPartition<T>[] = [];
    for await (const partition of collectionGroup.getPartitions(
      desiredPartitionsCount
    )) {
      partitions.push(partition);
    }
    return partitions;
  }

  async function verifyPartitions<T>(
    partitions: QueryPartition<T>[]
  ): Promise<QueryDocumentSnapshot<T>[]> {
    expect(partitions.length).to.not.be.greaterThan(desiredPartitionCount);

    expect(partitions[0].startAt).to.be.undefined;
    for (let i = 0; i < partitions.length - 1; ++i) {
      // The cursor value is a single DocumentReference
      expect(
        (partitions[i].endBefore![0] as DocumentReference<T>).isEqual(
          partitions[i + 1].startAt![0] as DocumentReference<T>
        )
      ).to.be.true;
    }
    expect(partitions[partitions.length - 1].endBefore).to.be.undefined;

    // Validate that we can use the partitions to read the original documents.
    const documents: QueryDocumentSnapshot<T>[] = [];
    for (const partition of partitions) {
      documents.push(...(await partition.toQuery().get()).docs);
    }
    expect(documents.length).to.equal(documentCount);

    return documents;
  }

  it('partition query', async () => {
    const partitions = await getPartitions(
      collectionGroup,
      desiredPartitionCount
    );
    await verifyPartitions(partitions);
  });

  it('partition query with manual cursors', async () => {
    const partitions = await getPartitions(
      collectionGroup,
      desiredPartitionCount
    );

    const documents: QueryDocumentSnapshot<DocumentData>[] = [];
    for (const partition of partitions) {
      let partitionedQuery: Query = collectionGroup;
      if (partition.startAt) {
        partitionedQuery = partitionedQuery.startAt(...partition.startAt);
      }
      if (partition.endBefore) {
        partitionedQuery = partitionedQuery.endBefore(...partition.endBefore);
      }
      documents.push(...(await partitionedQuery.get()).docs);
    }

    expect(documents.length).to.equal(documentCount);
  });

  it('partition query with converter', async () => {
    const collectionGroupWithConverter =
      collectionGroup.withConverter(postConverter);
    const partitions = await getPartitions(
      collectionGroupWithConverter,
      desiredPartitionCount
    );
    const documents = await verifyPartitions(partitions);

    for (const document of documents) {
      expect(document.data()).to.be.an.instanceOf(Post);
    }
  });

  it('empty partition query', async () => {
    const desiredPartitionCount = 3;

    const collectionGroupId = randomColl.doc().id;
    const collectionGroup = firestore.collectionGroup(collectionGroupId);
    const partitions = await getPartitions(
      collectionGroup,
      desiredPartitionCount
    );

    expect(partitions.length).to.equal(1);
    expect(partitions[0].startAt).to.be.undefined;
    expect(partitions[0].endBefore).to.be.undefined;
  });
});

describe('CollectionReference class', () => {
  let firestore: Firestore;
  let randomCol: CollectionReference;

  beforeEach(() => {
    randomCol = getTestRoot();
    firestore = randomCol.firestore;
  });

  afterEach(() => verifyInstance(firestore));

  it('has firestore property', () => {
    const ref = firestore.collection('col');
    expect(ref.firestore).to.be.an.instanceOf(Firestore);
  });

  it('has id property', () => {
    const ref = firestore.collection('col');
    expect(ref.id).to.equal('col');
  });

  it('has parent property', () => {
    const ref = firestore.collection('col/doc/col');
    expect(ref.parent!.id).to.equal('doc');
  });

  it('has path property', () => {
    const ref = firestore.collection('col/doc/col');
    expect(ref.path).to.equal('col/doc/col');
  });

  it('has doc() method', () => {
    let ref = firestore.collection('col').doc('doc');
    expect(ref.id).to.equal('doc');
    ref = firestore.collection('col').doc();
    expect(ref.id).to.have.length(20);
  });

  it('has add() method', () => {
    return randomCol
      .add({foo: 'a'})
      .then(ref => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.get('foo')).to.equal('a');
      });
  });

  it('lists missing documents', async () => {
    const batch = firestore.batch();

    batch.set(randomCol.doc('a'), {});
    batch.set(randomCol.doc('b/b/b'), {});
    batch.set(randomCol.doc('c'), {});
    await batch.commit();

    const documentRefs = await randomCol.listDocuments();
    const documents = await firestore.getAll(...documentRefs);

    const existingDocs = documents.filter(doc => doc.exists);
    const missingDocs = documents.filter(doc => !doc.exists);

    expect(existingDocs.map(doc => doc.id)).to.have.members(['a', 'c']);
    expect(missingDocs.map(doc => doc.id)).to.have.members(['b']);
  });

  it('supports withConverter()', async () => {
    const ref = await firestore
      .collection('col')
      .withConverter(postConverter)
      .add(new Post('post', 'author'));
    const postData = await ref.get();
    const post = postData.data();
    expect(post).to.not.be.undefined;
    expect(post!.toString()).to.equal('post, by author');
  });
});

describe('DocumentReference class', () => {
  let firestore: Firestore;
  let randomCol: CollectionReference;

  beforeEach(() => {
    randomCol = getTestRoot();
    firestore = randomCol.firestore;
  });

  afterEach(() => verifyInstance(firestore));

  it('has firestore property', () => {
    const ref = firestore.doc('col/doc');
    expect(ref.firestore).to.be.an.instanceOf(Firestore);
  });

  it('has id property', () => {
    const ref = firestore.doc('col/doc');
    expect(ref.id).to.equal('doc');
  });

  it('has parent property', () => {
    const ref = firestore.doc('col/doc');
    expect(ref.parent.id).to.equal('col');
  });

  it('has path property', () => {
    const ref = firestore.doc('col/doc');
    expect(ref.path).to.equal('col/doc');
  });

  it('has collection() method', () => {
    const ref = firestore.doc('col/doc').collection('subcol');
    expect(ref.id).to.equal('subcol');
  });

  it('has create()/get() method', () => {
    const ref = randomCol.doc();
    return ref
      .create({foo: 'a'})
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.get('foo')).to.equal('a');
      });
  });

  it('has set() method', () => {
    const allSupportedTypesObject: {[field: string]: unknown} = {
      stringValue: 'a',
      trueValue: true,
      falseValue: false,
      integerValue: 10,
      largeIntegerValue: 1234567890000,
      doubleValue: 0.1,
      infinityValue: Infinity,
      negativeInfinityValue: -Infinity,
      objectValue: {foo: 'bar', '😀': '😜'},
      emptyObject: {},
      dateValue: new Timestamp(479978400, 123000000),
      zeroDateValue: new Timestamp(0, 0),
      pathValue: firestore.doc('col1/ref1'),
      arrayValue: ['foo', 42, 'bar'],
      emptyArray: [],
      nilValue: null,
      geoPointValue: new GeoPoint(50.1430847, -122.947778),
      zeroGeoPointValue: new GeoPoint(0, 0),
      bytesValue: Buffer.from([0x01, 0x02]),
    };
    const ref = randomCol.doc('doc');
    return ref
      .set(allSupportedTypesObject)
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        const data = doc.data()!;
        expect(data.pathValue.path).to.equal(
          (allSupportedTypesObject.pathValue as DocumentReference).path
        );
        delete data.pathValue;
        delete allSupportedTypesObject.pathValue;
        expect(data).to.deep.equal(allSupportedTypesObject);
      });
  });

  it('supports NaNs', () => {
    const nanObject = {
      nanValue: NaN,
    };
    const ref = randomCol.doc('doc');
    return ref
      .set(nanObject)
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        const actualValue = doc.data()!.nanValue;
        expect(actualValue).to.be.a('number');
        expect(actualValue).to.be.NaN;
      });
  });

  it('round-trips BigInts', () => {
    const bigIntValue = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);

    const randomCol = getTestRoot({useBigInt: true});
    const ref = randomCol.doc('doc');
    return ref
      .set({bigIntValue})
      .then(() => ref.get())
      .then(doc => ref.set(doc.data()!))
      .then(() => ref.get())
      .then(doc => {
        const actualValue = doc.data()!.bigIntValue;
        expect(actualValue).to.be.a('bigint');
        expect(actualValue).to.equal(bigIntValue);
      });
  });

  it('supports server timestamps', () => {
    const baseObject = {
      a: 'bar',
      b: {remove: 'bar'},
      d: {keep: 'bar'},
      f: FieldValue.serverTimestamp(),
    };
    const updateObject = {
      a: FieldValue.serverTimestamp(),
      b: {c: FieldValue.serverTimestamp()},
      'd.e': FieldValue.serverTimestamp(),
    };

    const ref = randomCol.doc('doc');
    let setTimestamp: Timestamp;

    return ref
      .set(baseObject)
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        setTimestamp = doc.get('f');
        expect(setTimestamp).to.be.an.instanceOf(Timestamp);
        expect(doc.data()).to.deep.equal({
          a: 'bar',
          b: {remove: 'bar'},
          d: {keep: 'bar'},
          f: setTimestamp,
        });
        return ref.update(updateObject);
      })
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        const updateTimestamp = doc.get('a');
        expect(setTimestamp).to.be.an.instanceOf(Timestamp);
        expect(doc.data()).to.deep.equal({
          a: updateTimestamp,
          b: {c: updateTimestamp},
          d: {e: updateTimestamp, keep: 'bar'},
          f: setTimestamp,
        });
      });
  });

  it('supports increment()', () => {
    const baseData = {sum: 1};
    const updateData = {sum: FieldValue.increment(1)};
    const expectedData = {sum: 2};

    const ref = randomCol.doc('doc');
    return ref
      .set(baseData)
      .then(() => ref.update(updateData))
      .then(() => ref.get())
      .then(doc => {
        expect(doc.data()).to.deep.equal(expectedData);
      });
  });

  it('supports increment() with set() with merge', () => {
    const baseData = {sum: 1};
    const updateData = {sum: FieldValue.increment(1)};
    const expectedData = {sum: 2};

    const ref = randomCol.doc('doc');
    return ref
      .set(baseData)
      .then(() => ref.set(updateData, {merge: true}))
      .then(() => ref.get())
      .then(doc => {
        expect(doc.data()).to.deep.equal(expectedData);
      });
  });

  it('supports arrayUnion()', () => {
    const baseObject = {
      a: [],
      b: ['foo'],
      c: {d: ['foo']},
    };
    const updateObject = {
      a: FieldValue.arrayUnion('foo', 'bar'),
      b: FieldValue.arrayUnion('foo', 'bar'),
      'c.d': FieldValue.arrayUnion('foo', 'bar'),
    };
    const expectedObject = {
      a: ['foo', 'bar'],
      b: ['foo', 'bar'],
      c: {d: ['foo', 'bar']},
    };

    const ref = randomCol.doc('doc');

    return ref
      .set(baseObject)
      .then(() => ref.update(updateObject))
      .then(() => ref.get())
      .then(doc => {
        expect(doc.data()).to.deep.equal(expectedObject);
      });
  });

  it('supports arrayRemove()', () => {
    const baseObject = {
      a: [],
      b: ['foo', 'foo', 'baz'],
      c: {d: ['foo', 'bar', 'baz']},
    };
    const updateObject = {
      a: FieldValue.arrayRemove('foo'),
      b: FieldValue.arrayRemove('foo'),
      'c.d': FieldValue.arrayRemove('foo', 'bar'),
    };
    const expectedObject = {
      a: [],
      b: ['baz'],
      c: {d: ['baz']},
    };

    const ref = randomCol.doc('doc');

    return ref
      .set(baseObject)
      .then(() => ref.update(updateObject))
      .then(() => ref.get())
      .then(doc => {
        expect(doc.data()).to.deep.equal(expectedObject);
      });
  });

  it('supports set() with merge', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({'a.1': 'foo', nested: {'b.1': 'bar'}})
      .then(() =>
        ref.set({'a.2': 'foo', nested: {'b.2': 'bar'}}, {merge: true})
      )
      .then(() => ref.get())
      .then(doc => {
        const data = doc.data();
        expect(data).to.deep.equal({
          'a.1': 'foo',
          'a.2': 'foo',
          nested: {
            'b.1': 'bar',
            'b.2': 'bar',
          },
        });
      });
  });

  it('supports server timestamps for merge', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({a: 'b'})
      .then(() => ref.set({c: FieldValue.serverTimestamp()}, {merge: true}))
      .then(() => ref.get())
      .then(doc => {
        const updateTimestamp = doc.get('c');
        expect(updateTimestamp).to.be.an.instanceOf(Timestamp);
        expect(doc.data()).to.deep.equal({
          a: 'b',
          c: updateTimestamp,
        });
      });
  });

  it('has update() method', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({foo: 'a'})
      .then(res => {
        return ref.update({foo: 'b'}, {lastUpdateTime: res.writeTime});
      })
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.get('foo')).to.equal('b');
      });
  });

  it('enforces that updated document exists', () => {
    return randomCol
      .doc()
      .update({foo: 'b'})
      .catch(err => {
        expect(err.message).to.match(/No document to update/);
      });
  });

  it('has delete() method', () => {
    let deleted = false;

    const ref = randomCol.doc('doc');
    return ref
      .set({foo: 'a'})
      .then(() => {
        return ref.delete();
      })
      .then(() => {
        deleted = true;
        return ref.get();
      })
      .then(result => {
        expect(deleted).to.be.true;
        expect(result.exists).to.be.false;
      });
  });

  it('can delete() a non-existing document', () => {
    const ref = firestore.collection('col').doc();
    return ref.delete();
  });

  it('will fail to delete document with exists: true if doc does not exist', () => {
    const ref = randomCol.doc();
    return ref
      .delete({exists: true})
      .then(() => Promise.reject('Delete should have failed'))
      .catch((err: Error) => {
        expect(err.message).to.contain('No document to update');
      });
  });

  it('supports non-alphanumeric field names', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({'!.\\`': {'!.\\`': 'value'}})
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.data()).to.deep.equal({'!.\\`': {'!.\\`': 'value'}});
        return ref.update(new FieldPath('!.\\`', '!.\\`'), 'new-value');
      })
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.data()).to.deep.equal({'!.\\`': {'!.\\`': 'new-value'}});
      });
  });

  it('has listCollections() method', () => {
    const collections = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const promises: Array<Promise<{}>> = [];

    for (const collection of collections) {
      promises.push(randomCol.doc(`doc/${collection}/doc`).create({}));
    }

    return Promise.all(promises)
      .then(() => {
        return randomCol.doc('doc').listCollections();
      })
      .then(response => {
        expect(response).to.have.length(collections.length);
        for (let i = 0; i < response.length; ++i) {
          expect(response[i].id).to.equal(collections[i]);
        }
      });
  });

  // tslint:disable-next-line:only-arrow-function
  it('can add and delete fields sequentially', function () {
    this.timeout(30 * 1000);

    const ref = randomCol.doc('doc');

    const actions = [
      () => ref.create({}),
      () => ref.delete(),
      () => ref.create({a: {b: 'c'}}),
      () => ref.set({}, {merge: true}),
      () => ref.set({}),
      () => ref.set({a: {b: 'c'}}),
      () => ref.set({a: {d: 'e'}}, {merge: true}),
      () => ref.set({a: {d: FieldValue.delete()}}, {merge: true}),
      () => ref.set({a: {b: FieldValue.delete()}}, {merge: true}),
      () => ref.set({a: {e: 'foo'}}, {merge: true}),
      () => ref.set({f: 'foo'}, {merge: true}),
      () => ref.set({f: {g: 'foo'}}, {merge: true}),
      () => ref.update({'f.h': 'foo'}),
      () => ref.update({'f.g': FieldValue.delete()}),
      () => ref.update({'f.h': FieldValue.delete()}),
      () => ref.update({f: FieldValue.delete()}),
      () => ref.update({'i.j': {}}),
      () => ref.update({'i.j': {k: 'foo'}}),
      () => ref.update({'i.j': {l: {}}}),
      () => ref.update({i: FieldValue.delete()}),
      () => ref.update({a: FieldValue.delete()}),
    ];

    const expectedState = [
      {},
      null,
      {a: {b: 'c'}},
      {a: {b: 'c'}},
      {},
      {a: {b: 'c'}},
      {a: {b: 'c', d: 'e'}},
      {a: {b: 'c'}},
      {a: {}},
      {a: {e: 'foo'}},
      {a: {e: 'foo'}, f: 'foo'},
      {a: {e: 'foo'}, f: {g: 'foo'}},
      {a: {e: 'foo'}, f: {g: 'foo', h: 'foo'}},
      {a: {e: 'foo'}, f: {h: 'foo'}},
      {a: {e: 'foo'}, f: {}},
      {a: {e: 'foo'}},
      {a: {e: 'foo'}, i: {j: {}}},
      {a: {e: 'foo'}, i: {j: {k: 'foo'}}},
      {a: {e: 'foo'}, i: {j: {l: {}}}},
      {a: {e: 'foo'}},
      {},
    ];

    let promise = Promise.resolve();

    for (let i = 0; i < actions.length; ++i) {
      promise = promise
        .then(() => actions[i]())
        .then(() => {
          return ref.get();
        })
        .then(snap => {
          if (!snap.exists) {
            expect(expectedState[i]).to.be.null;
          } else {
            expect(snap.data()).to.deep.equal(expectedState[i]);
          }
        });
    }

    return promise;
  });

  // tslint:disable-next-line:only-arrow-function
  it('can add and delete fields with server timestamps', function () {
    this.timeout(10 * 1000);

    const ref = randomCol.doc('doc');

    const actions = [
      () =>
        ref.create({
          time: FieldValue.serverTimestamp(),
          a: {b: FieldValue.serverTimestamp()},
        }),
      () =>
        ref.set({
          time: FieldValue.serverTimestamp(),
          a: {c: FieldValue.serverTimestamp()},
        }),
      () =>
        ref.set(
          {
            time: FieldValue.serverTimestamp(),
            a: {d: FieldValue.serverTimestamp()},
          },
          {merge: true}
        ),
      () =>
        ref.set(
          {
            time: FieldValue.serverTimestamp(),
            e: FieldValue.serverTimestamp(),
          },
          {merge: true}
        ),
      () =>
        ref.set(
          {
            time: FieldValue.serverTimestamp(),
            e: {f: FieldValue.serverTimestamp()},
          },
          {merge: true}
        ),
      () =>
        ref.update({
          time: FieldValue.serverTimestamp(),
          'g.h': FieldValue.serverTimestamp(),
        }),
      () =>
        ref.update({
          time: FieldValue.serverTimestamp(),
          'g.j': {k: FieldValue.serverTimestamp()},
        }),
    ];

    const expectedState = [
      (times: number[]) => {
        return {time: times[0], a: {b: times[0]}};
      },
      (times: number[]) => {
        return {time: times[1], a: {c: times[1]}};
      },
      (times: number[]) => {
        return {time: times[2], a: {c: times[1], d: times[2]}};
      },
      (times: number[]) => {
        return {time: times[3], a: {c: times[1], d: times[2]}, e: times[3]};
      },
      (times: number[]) => {
        return {
          time: times[4],
          a: {c: times[1], d: times[2]},
          e: {f: times[4]},
        };
      },
      (times: number[]) => {
        return {
          time: times[5],
          a: {c: times[1], d: times[2]},
          e: {f: times[4]},
          g: {h: times[5]},
        };
      },
      (times: number[]) => {
        return {
          time: times[6],
          a: {c: times[1], d: times[2]},
          e: {f: times[4]},
          g: {h: times[5], j: {k: times[6]}},
        };
      },
    ];

    let promise = Promise.resolve();
    const times: number[] = [];

    for (let i = 0; i < actions.length; ++i) {
      promise = promise
        .then(() => actions[i]())
        .then(() => {
          return ref.get();
        })
        .then(snap => {
          times.push(snap.get('time'));
          expect(snap.data()).to.deep.equal(expectedState[i](times));
        });
    }

    return promise;
  });

  describe('watch', () => {
    const currentDeferred = new DeferredPromise<DocumentSnapshot>();

    function resetPromise() {
      currentDeferred.promise = new Promise((resolve, reject) => {
        currentDeferred.resolve = resolve;
        currentDeferred.reject = reject;
      });
    }

    function waitForSnapshot(): Promise<DocumentSnapshot> {
      return currentDeferred.promise!.then(snapshot => {
        resetPromise();
        return snapshot as DocumentSnapshot;
      });
    }

    beforeEach(() => resetPromise());

    it('handles changing a doc', () => {
      const ref = randomCol.doc('doc');
      let readTime: Timestamp;
      let createTime: Timestamp;
      let updateTime: Timestamp;

      const unsubscribe = ref.onSnapshot(
        snapshot => {
          currentDeferred.resolve(snapshot);
        },
        err => {
          currentDeferred.reject(err);
        }
      );

      return waitForSnapshot()
        .then(snapshot => {
          expect(snapshot.exists).to.be.false;

          // Add the document.
          return ref.set({foo: 'a'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(snapshot => {
          expect(snapshot.exists).to.be.true;
          expect(snapshot.get('foo')).to.equal('a');
          readTime = snapshot.readTime;
          createTime = snapshot.createTime!;
          updateTime = snapshot.updateTime!;

          // Update documents.
          return ref.set({foo: 'b'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(snapshot => {
          expect(snapshot.exists).to.be.true;
          expect(snapshot.get('foo')).to.equal('b');
          expect(snapshot.createTime!.isEqual(createTime)).to.be.true;
          expect(snapshot.readTime.toMillis()).to.be.greaterThan(
            readTime.toMillis()
          );
          expect(snapshot.updateTime!.toMillis()).to.be.greaterThan(
            updateTime.toMillis()
          );
          unsubscribe();
        });
    });

    it('handles deleting a doc', () => {
      const ref = randomCol.doc('doc');

      const unsubscribe = ref.onSnapshot(
        snapshot => {
          currentDeferred.resolve(snapshot);
        },
        err => {
          currentDeferred.reject(err);
        }
      );

      return waitForSnapshot()
        .then(snapshot => {
          expect(snapshot.exists).to.be.false;

          // Add the document.
          return ref.set({foo: 'a'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(snapshot => {
          expect(snapshot.exists).to.be.true;

          // Delete the document.
          return ref.delete();
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(snapshot => {
          expect(snapshot.exists).to.be.false;
          unsubscribe();
        });
    });

    it('handles multiple docs', done => {
      const doc1 = randomCol.doc();
      const doc2 = randomCol.doc();

      // Documents transition from non-existent to existent to non-existent.
      const exists1 = [false, true, false];
      const exists2 = [false, true, false];

      const promises: Array<Promise<WriteResult>> = [];

      // Code blocks to run after each step.
      const run = [
        () => {
          promises.push(doc1.set({foo: 'foo'}));
          promises.push(doc2.set({foo: 'foo'}));
        },
        () => {
          promises.push(doc1.delete());
          promises.push(doc2.delete());
        },
        () => {
          unsubscribe1();
          unsubscribe2();
          Promise.all(promises).then(() => done());
        },
      ];

      const maybeRun = () => {
        if (exists1.length === exists2.length) {
          run.shift()!();
        }
      };
      const unsubscribe1 = doc1.onSnapshot(snapshot => {
        expect(snapshot.exists).to.equal(exists1.shift());
        maybeRun();
      });

      const unsubscribe2 = doc2.onSnapshot(snapshot => {
        expect(snapshot.exists).to.equal(exists2.shift());
        maybeRun();
      });
    });

    it('handles multiple streams on same doc', done => {
      const doc = randomCol.doc();

      // Document transitions from non-existent to existent to non-existent.
      const exists1 = [false, true, false];
      const exists2 = [false, true, false];

      const promises: Array<Promise<WriteResult>> = [];

      // Code blocks to run after each step.
      const run = [
        () => {
          promises.push(doc.set({foo: 'foo'}));
        },
        () => {
          promises.push(doc.delete());
        },
        () => {
          unsubscribe1();
          unsubscribe2();
          Promise.all(promises).then(() => done());
        },
      ];

      const maybeRun = () => {
        if (exists1.length === exists2.length) {
          run.shift()!();
        }
      };

      const unsubscribe1 = doc.onSnapshot(snapshot => {
        expect(snapshot.exists).to.equal(exists1.shift());
        maybeRun();
      });

      const unsubscribe2 = doc.onSnapshot(snapshot => {
        expect(snapshot.exists).to.equal(exists2.shift());
        maybeRun();
      });
    });

    it('handles more than 100 concurrent listeners', async () => {
      const ref = randomCol.doc('doc');

      const emptyResults: Array<Deferred<void>> = [];
      const documentResults: Array<Deferred<void>> = [];
      const unsubscribeCallbacks: Array<() => void> = [];

      // A single GAPIC client can only handle 100 concurrent streams. We set
      // up 100+ long-lived listeners to verify that Firestore pools requests
      // across multiple clients.
      for (let i = 0; i < 150; ++i) {
        emptyResults[i] = new Deferred<void>();
        documentResults[i] = new Deferred<void>();

        unsubscribeCallbacks[i] = randomCol
          .where('i', '>', i)
          .onSnapshot(snapshot => {
            if (snapshot.size === 0) {
              emptyResults[i].resolve();
            } else if (snapshot.size === 1) {
              documentResults[i].resolve();
            }
          });
      }

      await Promise.all(emptyResults.map(d => d.promise));
      await ref.set({i: 1337});
      await Promise.all(documentResults.map(d => d.promise));
      unsubscribeCallbacks.forEach(c => c());
    });

    it('handles query snapshots with converters', async () => {
      const setupDeferred = new Deferred<void>();
      const resultsDeferred = new Deferred<QuerySnapshot<Post>>();
      const ref = randomCol.doc('doc').withConverter(postConverter);
      const unsubscribe = randomCol
        .where('title', '==', 'post')
        .withConverter(postConverter)
        .onSnapshot(snapshot => {
          if (snapshot.size === 0) {
            setupDeferred.resolve();
          }
          if (snapshot.size === 1) {
            resultsDeferred.resolve(snapshot);
          }
        });

      await setupDeferred.promise;
      await ref.set(new Post('post', 'author'));
      const snapshot = await resultsDeferred.promise;
      expect(snapshot.docs[0].data().toString()).to.equal('post, by author');
      unsubscribe();
    });
  });

  it('supports withConverter()', async () => {
    const ref = firestore
      .collection('col')
      .doc('doc')
      .withConverter(postConverter);
    await ref.set(new Post('post', 'author'));
    const postData = await ref.get();
    const post = postData.data();
    expect(post).to.not.be.undefined;
    expect(post!.toString()).to.equal('post, by author');
  });

  it('supports primitive types with valid converter', async () => {
    type Primitive = number;
    const primitiveConverter = {
      toFirestore(value: Primitive): DocumentData {
        return {value};
      },
      fromFirestore(snapshot: QueryDocumentSnapshot): Primitive {
        const data = snapshot.data();
        return data.value;
      },
    };

    type ArrayValue = number[];
    const arrayConverter = {
      toFirestore(value: ArrayValue): DocumentData {
        return {values: value};
      },
      fromFirestore(snapshot: QueryDocumentSnapshot): ArrayValue {
        const data = snapshot.data();
        return data.values;
      },
    };

    const coll = firestore.collection('tests');
    const ref = coll.doc('number').withConverter(primitiveConverter);
    await ref.set(3);
    const result = await ref.get();
    expect(result.data()).to.equal(3);

    const ref2 = coll.doc('array').withConverter(arrayConverter);
    await ref2.set([1, 2, 3]);
    const result2 = await ref2.get();
    expect(result2.data()).to.deep.equal([1, 2, 3]);
  });
});

describe('Query class', () => {
  interface PaginatedResults {
    pages: number;
    docs: QueryDocumentSnapshot[];
  }

  let firestore: Firestore;
  let randomCol: CollectionReference;

  const paginateResults = (
    query: Query,
    startAfter?: unknown
  ): Promise<PaginatedResults> => {
    return (startAfter ? query.startAfter(startAfter) : query)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          return {pages: 0, docs: []};
        } else {
          const docs = snapshot.docs;
          return paginateResults(query, docs[docs.length - 1]).then(
            nextPage => {
              return {
                pages: nextPage.pages + 1,
                docs: docs.concat(nextPage.docs),
              };
            }
          );
        }
      });
  };

  async function addDocs(
    ...docs: DocumentData[]
  ): Promise<DocumentReference[]> {
    let id = 0; // Guarantees consistent ordering for the first documents
    const refs: DocumentReference[] = [];
    for (const doc of docs) {
      const ref = randomCol.doc('doc' + id++);
      await ref.set(doc);
      refs.push(ref);
    }
    return refs;
  }

  function expectDocs(result: QuerySnapshot, ...data: DocumentData[]) {
    expect(result.size).to.equal(data.length);
    result.forEach(doc => {
      expect(doc.data()).to.deep.equal(data.shift());
    });
  }

  beforeEach(() => {
    randomCol = getTestRoot();
    firestore = randomCol.firestore;
  });

  afterEach(() => verifyInstance(firestore));

  it('has firestore property', () => {
    const ref = randomCol.limit(0);
    expect(ref.firestore).to.be.an.instanceOf(Firestore);
  });

  it('has select() method', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({foo: 'bar', bar: 'foo'})
      .then(() => {
        return randomCol.select('foo').get();
      })
      .then(res => {
        expect(res.docs[0].data()).to.deep.equal({foo: 'bar'});
      });
  });

  it('select() supports empty fields', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({foo: 'bar', bar: 'foo'})
      .then(() => {
        return randomCol.select().get();
      })
      .then(res => {
        expect(res.docs[0].ref.id).to.deep.equal('doc');
        expect(res.docs[0].data()).to.deep.equal({});
      });
  });

  it('has where() method', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({foo: 'bar'})
      .then(() => {
        return randomCol.where('foo', '==', 'bar').get();
      })
      .then(res => {
        expect(res.docs[0].data()).to.deep.equal({foo: 'bar'});
      });
  });

  it('supports NaN and Null', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({foo: NaN, bar: null})
      .then(() => {
        return randomCol.where('foo', '==', NaN).where('bar', '==', null).get();
      })
      .then(res => {
        expect(
          typeof res.docs[0].get('foo') === 'number' &&
            isNaN(res.docs[0].get('foo'))
        );
        expect(res.docs[0].get('bar')).to.equal(null);
      });
  });

  it('supports array-contains', () => {
    return Promise.all([
      randomCol.add({foo: ['bar']}),
      randomCol.add({foo: []}),
    ])
      .then(() => randomCol.where('foo', 'array-contains', 'bar').get())
      .then(res => {
        expect(res.size).to.equal(1);
        expect(res.docs[0].get('foo')).to.deep.equal(['bar']);
      });
  });

  it('supports !=', async () => {
    await addDocs(
      {zip: NaN},
      {zip: 91102},
      {zip: 98101},
      {zip: 98103},
      {zip: [98101]},
      {zip: ['98101', {zip: 98101}]},
      {zip: {zip: 98101}},
      {zip: null}
    );

    let res = await randomCol.where('zip', '!=', 98101).get();
    expectDocs(
      res,
      {zip: NaN},
      {zip: 91102},
      {zip: 98103},
      {zip: [98101]},
      {zip: ['98101', {zip: 98101}]},
      {zip: {zip: 98101}}
    );

    res = await randomCol.where('zip', '!=', NaN).get();
    expectDocs(
      res,
      {zip: 91102},
      {zip: 98101},
      {zip: 98103},
      {zip: [98101]},
      {zip: ['98101', {zip: 98101}]},
      {zip: {zip: 98101}}
    );

    res = await randomCol.where('zip', '!=', null).get();
    expectDocs(
      res,
      {zip: NaN},
      {zip: 91102},
      {zip: 98101},
      {zip: 98103},
      {zip: [98101]},
      {zip: ['98101', {zip: 98101}]},
      {zip: {zip: 98101}}
    );
  });

  it('supports != with document ID', async () => {
    const refs = await addDocs({count: 1}, {count: 2}, {count: 3});
    const res = await randomCol
      .where(FieldPath.documentId(), '!=', refs[0].id)
      .get();
    expectDocs(res, {count: 2}, {count: 3});
  });

  it('supports not-in', async () => {
    await addDocs(
      {zip: 98101},
      {zip: 91102},
      {zip: 98103},
      {zip: [98101]},
      {zip: ['98101', {zip: 98101}]},
      {zip: {zip: 98101}}
    );
    let res = await randomCol.where('zip', 'not-in', [98101, 98103]).get();
    expectDocs(
      res,
      {zip: 91102},
      {zip: [98101]},
      {zip: ['98101', {zip: 98101}]},
      {zip: {zip: 98101}}
    );

    res = await randomCol.where('zip', 'not-in', [NaN]).get();
    expectDocs(
      res,
      {zip: 91102},
      {zip: 98101},
      {zip: 98103},
      {zip: [98101]},
      {zip: ['98101', {zip: 98101}]},
      {zip: {zip: 98101}}
    );

    res = await randomCol.where('zip', 'not-in', [null]).get();
    expect(res.size).to.equal(0);
  });

  it('supports not-in with document ID array', async () => {
    const refs = await addDocs({count: 1}, {count: 2}, {count: 3});
    const res = await randomCol
      .where(FieldPath.documentId(), 'not-in', [refs[0].id, refs[1]])
      .get();
    expectDocs(res, {count: 3});
  });

  it('supports "in"', async () => {
    await addDocs(
      {zip: 98101},
      {zip: 91102},
      {zip: 98103},
      {zip: [98101]},
      {zip: ['98101', {zip: 98101}]},
      {zip: {zip: 98101}}
    );
    const res = await randomCol.where('zip', 'in', [98101, 98103]).get();
    expectDocs(res, {zip: 98101}, {zip: 98103});
  });

  it('supports "in" with document ID array', async () => {
    const refs = await addDocs({count: 1}, {count: 2}, {count: 3});
    const res = await randomCol
      .where(FieldPath.documentId(), 'in', [refs[0].id, refs[1]])
      .get();
    expectDocs(res, {count: 1}, {count: 2});
  });

  it('supports array-contains-any', async () => {
    await addDocs(
      {array: [42]},
      {array: ['a', 42, 'c']},
      {array: [41.999, '42', {a: [42]}]},
      {array: [42], array2: ['sigh']},
      {array: [43]},
      {array: [{a: 42}]},
      {array: 42}
    );

    const res = await randomCol
      .where('array', 'array-contains-any', [42, 43])
      .get();

    expectDocs(
      res,
      {array: [42]},
      {array: ['a', 42, 'c']},
      {
        array: [42],
        array2: ['sigh'],
      },
      {array: [43]}
    );
  });

  it('can query by FieldPath.documentId()', () => {
    const ref = randomCol.doc('foo');

    return ref
      .set({})
      .then(() => {
        return randomCol.where(FieldPath.documentId(), '>=', 'bar').get();
      })
      .then(res => {
        expect(res.docs.length).to.equal(1);
      });
  });

  it('has orderBy() method', async () => {
    await addDocs({foo: 'a'}, {foo: 'b'});

    let res = await randomCol.orderBy('foo').get();
    expectDocs(res, {foo: 'a'}, {foo: 'b'});

    res = await randomCol.orderBy('foo', 'desc').get();
    expectDocs(res, {foo: 'b'}, {foo: 'a'});
  });

  it('can order by FieldPath.documentId()', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
      .then(() => {
        return randomCol.orderBy(FieldPath.documentId()).get();
      })
      .then(res => {
        expect(res.docs[0].data()).to.deep.equal({foo: 'a'});
        expect(res.docs[1].data()).to.deep.equal({foo: 'b'});
      });
  });

  it('has limit() method', async () => {
    await addDocs({foo: 'a'}, {foo: 'b'});
    const res = await randomCol.orderBy('foo').limit(1).get();
    expectDocs(res, {foo: 'a'});
  });

  it('has limitToLast() method', async () => {
    await addDocs({doc: 1}, {doc: 2}, {doc: 3});
    const res = await randomCol.orderBy('doc').limitToLast(2).get();
    expectDocs(res, {doc: 2}, {doc: 3});
  });

  it('limitToLast() supports Query cursors', async () => {
    await addDocs({doc: 1}, {doc: 2}, {doc: 3}, {doc: 4}, {doc: 5});
    const res = await randomCol
      .orderBy('doc')
      .startAt(2)
      .endAt(4)
      .limitToLast(5)
      .get();
    expectDocs(res, {doc: 2}, {doc: 3}, {doc: 4});
  });

  it('has offset() method', async () => {
    await addDocs({foo: 'a'}, {foo: 'b'});
    const res = await randomCol.orderBy('foo').offset(1).get();
    expectDocs(res, {foo: 'b'});
  });

  it('supports Unicode in document names', async () => {
    const collRef = randomCol.doc('доброеутро').collection('coll');
    await collRef.add({});
    const snapshot = await collRef.get();
    expect(snapshot.size).to.equal(1);
  });

  it('supports pagination', () => {
    const batch = firestore.batch();

    for (let i = 0; i < 10; ++i) {
      batch.set(randomCol.doc('doc' + i), {val: i});
    }

    const query = randomCol.orderBy('val').limit(3);

    return batch
      .commit()
      .then(() => paginateResults(query))
      .then(results => {
        expect(results.pages).to.equal(4);
        expect(results.docs).to.have.length(10);
      });
  });

  it('supports pagination with where() clauses', () => {
    const batch = firestore.batch();

    for (let i = 0; i < 10; ++i) {
      batch.set(randomCol.doc('doc' + i), {val: i});
    }

    const query = randomCol.where('val', '>=', 1).limit(3);

    return batch
      .commit()
      .then(() => paginateResults(query))
      .then(results => {
        expect(results.pages).to.equal(3);
        expect(results.docs).to.have.length(9);
      });
  });

  it('supports pagination with array-contains filter', () => {
    const batch = firestore.batch();

    for (let i = 0; i < 10; ++i) {
      batch.set(randomCol.doc('doc' + i), {array: ['foo']});
    }

    const query = randomCol.where('array', 'array-contains', 'foo').limit(3);

    return batch
      .commit()
      .then(() => paginateResults(query))
      .then(results => {
        expect(results.pages).to.equal(4);
        expect(results.docs).to.have.length(10);
      });
  });

  it('has startAt() method', async () => {
    await addDocs({foo: 'a'}, {foo: 'b'});
    const res = await randomCol.orderBy('foo').startAt('b').get();
    expectDocs(res, {foo: 'b'});
  });

  it('startAt() adds implicit order by for DocumentReference', async () => {
    const references = await addDocs({foo: 'a'}, {foo: 'b'});
    const res = await randomCol.startAt(references[1]).get();
    expectDocs(res, {foo: 'b'});
  });

  it('has startAfter() method', async () => {
    await addDocs({foo: 'a'}, {foo: 'b'});
    const res = await randomCol.orderBy('foo').startAfter('a').get();
    expectDocs(res, {foo: 'b'});
  });

  it('has endAt() method', async () => {
    await addDocs({foo: 'a'}, {foo: 'b'});
    const res = await randomCol.orderBy('foo').endAt('b').get();
    expectDocs(res, {foo: 'a'}, {foo: 'b'});
  });

  it('has endBefore() method', async () => {
    await addDocs({foo: 'a'}, {foo: 'b'});
    const res = await randomCol.orderBy('foo').endBefore('b').get();
    expectDocs(res, {foo: 'a'});
  });

  it('has stream() method', done => {
    let received = 0;
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})]).then(() => {
      return randomCol
        .stream()
        .on('data', d => {
          expect(d).to.be.an.instanceOf(DocumentSnapshot);
          ++received;
        })
        .on('end', () => {
          expect(received).to.equal(2);
          done();
        });
    });
  });

  it('stream() supports readable[Symbol.asyncIterator]()', async () => {
    let received = 0;
    await randomCol.doc().set({foo: 'bar'});
    await randomCol.doc().set({foo: 'bar'});

    const stream = randomCol.stream();
    for await (const doc of stream) {
      expect(doc).to.be.an.instanceOf(QueryDocumentSnapshot);
      ++received;
    }

    expect(received).to.equal(2);
  });

  it('can query collection groups', async () => {
    // Use `randomCol` to get a random collection group name to use but ensure
    // it starts with 'b' for predictable ordering.
    const collectionGroup = 'b' + randomCol.id;

    const docPaths = [
      `abc/123/${collectionGroup}/cg-doc1`,
      `abc/123/${collectionGroup}/cg-doc2`,
      `${collectionGroup}/cg-doc3`,
      `${collectionGroup}/cg-doc4`,
      `def/456/${collectionGroup}/cg-doc5`,
      `${collectionGroup}/virtual-doc/nested-coll/not-cg-doc`,
      `x${collectionGroup}/not-cg-doc`,
      `${collectionGroup}x/not-cg-doc`,
      `abc/123/${collectionGroup}x/not-cg-doc`,
      `abc/123/x${collectionGroup}/not-cg-doc`,
      `abc/${collectionGroup}`,
    ];
    const batch = firestore.batch();
    for (const docPath of docPaths) {
      batch.set(firestore.doc(docPath), {x: 1});
    }
    await batch.commit();

    const querySnapshot = await firestore
      .collectionGroup(collectionGroup)
      .get();
    expect(querySnapshot.docs.map(d => d.id)).to.deep.equal([
      'cg-doc1',
      'cg-doc2',
      'cg-doc3',
      'cg-doc4',
      'cg-doc5',
    ]);
  });

  it('can query collection groups with startAt / endAt by arbitrary documentId', async () => {
    // Use `randomCol` to get a random collection group name to use but
    // ensure it starts with 'b' for predictable ordering.
    const collectionGroup = 'b' + randomCol.id;

    const docPaths = [
      `a/a/${collectionGroup}/cg-doc1`,
      `a/b/a/b/${collectionGroup}/cg-doc2`,
      `a/b/${collectionGroup}/cg-doc3`,
      `a/b/c/d/${collectionGroup}/cg-doc4`,
      `a/c/${collectionGroup}/cg-doc5`,
      `${collectionGroup}/cg-doc6`,
      'a/b/nope/nope',
    ];
    const batch = firestore.batch();
    for (const docPath of docPaths) {
      batch.set(firestore.doc(docPath), {x: 1});
    }
    await batch.commit();

    let querySnapshot = await firestore
      .collectionGroup(collectionGroup)
      .orderBy(FieldPath.documentId())
      .startAt('a/b')
      .endAt('a/b0')
      .get();
    expect(querySnapshot.docs.map(d => d.id)).to.deep.equal([
      'cg-doc2',
      'cg-doc3',
      'cg-doc4',
    ]);

    querySnapshot = await firestore
      .collectionGroup(collectionGroup)
      .orderBy(FieldPath.documentId())
      .startAfter('a/b')
      .endBefore(`a/b/${collectionGroup}/cg-doc3`)
      .get();
    expect(querySnapshot.docs.map(d => d.id)).to.deep.equal(['cg-doc2']);
  });

  it('can query collection groups with where filters on arbitrary documentId', async () => {
    // Use `randomCol` to get a random collection group name to use but
    // ensure it starts with 'b' for predictable ordering.
    const collectionGroup = 'b' + randomCol.id;

    const docPaths = [
      `a/a/${collectionGroup}/cg-doc1`,
      `a/b/a/b/${collectionGroup}/cg-doc2`,
      `a/b/${collectionGroup}/cg-doc3`,
      `a/b/c/d/${collectionGroup}/cg-doc4`,
      `a/c/${collectionGroup}/cg-doc5`,
      `${collectionGroup}/cg-doc6`,
      'a/b/nope/nope',
    ];
    const batch = firestore.batch();
    for (const docPath of docPaths) {
      batch.set(firestore.doc(docPath), {x: 1});
    }
    await batch.commit();

    let querySnapshot = await firestore
      .collectionGroup(collectionGroup)
      .where(FieldPath.documentId(), '>=', 'a/b')
      .where(FieldPath.documentId(), '<=', 'a/b0')
      .get();
    expect(querySnapshot.docs.map(d => d.id)).to.deep.equal([
      'cg-doc2',
      'cg-doc3',
      'cg-doc4',
    ]);

    querySnapshot = await firestore
      .collectionGroup(collectionGroup)
      .where(FieldPath.documentId(), '>', 'a/b')
      .where(FieldPath.documentId(), '<', `a/b/${collectionGroup}/cg-doc3`)
      .get();
    expect(querySnapshot.docs.map(d => d.id)).to.deep.equal(['cg-doc2']);
  });

  it('can query large collections', async () => {
    // @grpc/grpc-js v0.4.1 failed to deliver the full set of query results for
    // larger collections (https://github.com/grpc/grpc-node/issues/895);
    const batch = firestore.batch();
    for (let i = 0; i < 100; ++i) {
      batch.create(randomCol.doc(), {});
    }
    await batch.commit();

    const snapshot = await randomCol.get();
    expect(snapshot.size).to.equal(100);
  });

  describe('watch', () => {
    interface ExpectedChange {
      type: string;
      doc: DocumentSnapshot;
    }

    const currentDeferred = new DeferredPromise<QuerySnapshot>();

    const snapshot = (id: string, data: DocumentData) => {
      const ref = randomCol.doc(id);
      const fields = ref.firestore._serializer!.encodeFields(data);
      return randomCol.firestore.snapshot_(
        {
          name:
            'projects/ignored/databases/(default)/documents/' +
            ref._path.relativeName,
          fields,
          createTime: {seconds: 0, nanos: 0},
          updateTime: {seconds: 0, nanos: 0},
        },
        {seconds: 0, nanos: 0}
      );
    };

    const docChange = (
      type: string,
      id: string,
      data: DocumentData
    ): ExpectedChange => {
      return {
        type,
        doc: snapshot(id, data),
      };
    };

    const added = (id: string, data: DocumentData) =>
      docChange('added', id, data);
    const modified = (id: string, data: DocumentData) =>
      docChange('modified', id, data);
    const removed = (id: string, data: DocumentData) =>
      docChange('removed', id, data);

    function resetPromise() {
      currentDeferred.promise = new Promise((resolve, reject) => {
        currentDeferred.resolve = resolve;
        currentDeferred.reject = reject;
      });
    }

    function waitForSnapshot(): Promise<QuerySnapshot> {
      return currentDeferred.promise!.then(snapshot => {
        resetPromise();
        return snapshot;
      });
    }

    function snapshotsEqual(
      actual: QuerySnapshot,
      expected: {docs: DocumentSnapshot[]; docChanges: ExpectedChange[]}
    ) {
      let i;
      expect(actual.size).to.equal(expected.docs.length);
      for (i = 0; i < expected.docs.length && i < actual.size; i++) {
        expect(actual.docs[i].ref.id).to.equal(expected.docs[i].ref.id);
        expect(actual.docs[i].data()).to.deep.equal(expected.docs[i].data());
      }
      const actualDocChanges = actual.docChanges();
      expect(actualDocChanges.length).to.equal(expected.docChanges.length);
      for (i = 0; i < expected.docChanges.length; i++) {
        expect(actualDocChanges[i].type).to.equal(expected.docChanges[i].type);
        expect(actualDocChanges[i].doc.ref.id).to.equal(
          expected.docChanges[i].doc.ref.id
        );
        expect(actualDocChanges[i].doc.data()).to.deep.equal(
          expected.docChanges[i].doc.data()
        );
        expect(actualDocChanges[i].doc.readTime).to.exist;
        expect(actualDocChanges[i].doc.createTime).to.exist;
        expect(actualDocChanges[i].doc.updateTime).to.exist;
      }
      expect(actual.readTime).to.exist;
    }

    beforeEach(() => resetPromise());

    it('handles changing a doc', () => {
      const ref1 = randomCol.doc('doc1');
      const ref2 = randomCol.doc('doc2');

      const unsubscribe = randomCol.onSnapshot(
        snapshot => {
          currentDeferred.resolve(snapshot);
        },
        err => {
          currentDeferred.reject!(err);
        }
      );

      return waitForSnapshot()
        .then(results => {
          snapshotsEqual(results, {docs: [], docChanges: []});
          // Add a result.
          return ref1.set({foo: 'a'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(results => {
          snapshotsEqual(results, {
            docs: [snapshot('doc1', {foo: 'a'})],
            docChanges: [added('doc1', {foo: 'a'})],
          });
          // Add another result.
          return ref2.set({foo: 'b'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(results => {
          snapshotsEqual(results, {
            docs: [snapshot('doc1', {foo: 'a'}), snapshot('doc2', {foo: 'b'})],
            docChanges: [added('doc2', {foo: 'b'})],
          });
          // Change a result.
          return ref2.set({bar: 'c'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(results => {
          snapshotsEqual(results, {
            docs: [snapshot('doc1', {foo: 'a'}), snapshot('doc2', {bar: 'c'})],
            docChanges: [modified('doc2', {bar: 'c'})],
          });
          unsubscribe();
        });
    });

    it("handles changing a doc so it doesn't match", () => {
      const ref1 = randomCol.doc('doc1');
      const ref2 = randomCol.doc('doc2');

      const query = randomCol.where('included', '==', 'yes');
      const unsubscribe = query.onSnapshot(
        snapshot => {
          currentDeferred.resolve(snapshot);
        },
        err => {
          currentDeferred.reject(err);
        }
      );

      return waitForSnapshot()
        .then(results => {
          snapshotsEqual(results, {docs: [], docChanges: []});
          // Add a result.
          return ref1.set({included: 'yes'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(results => {
          snapshotsEqual(results, {
            docs: [snapshot('doc1', {included: 'yes'})],
            docChanges: [added('doc1', {included: 'yes'})],
          });
          // Add another result.
          return ref2.set({included: 'yes'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(results => {
          snapshotsEqual(results, {
            docs: [
              snapshot('doc1', {included: 'yes'}),
              snapshot('doc2', {included: 'yes'}),
            ],
            docChanges: [added('doc2', {included: 'yes'})],
          });
          // Change a result.
          return ref2.set({included: 'no'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(results => {
          snapshotsEqual(results, {
            docs: [snapshot('doc1', {included: 'yes'})],
            docChanges: [removed('doc2', {included: 'yes'})],
          });
          unsubscribe();
        });
    });

    it('handles deleting a doc', () => {
      const ref1 = randomCol.doc('doc1');
      const ref2 = randomCol.doc('doc2');

      const unsubscribe = randomCol.onSnapshot(
        snapshot => {
          currentDeferred.resolve(snapshot);
        },
        err => {
          currentDeferred.reject(err);
        }
      );

      return waitForSnapshot()
        .then(results => {
          snapshotsEqual(results, {docs: [], docChanges: []});
          // Add a result.
          return ref1.set({included: 'yes'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(results => {
          snapshotsEqual(results, {
            docs: [snapshot('doc1', {included: 'yes'})],
            docChanges: [added('doc1', {included: 'yes'})],
          });
          // Add another result.
          return ref2.set({included: 'yes'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(results => {
          snapshotsEqual(results, {
            docs: [
              snapshot('doc1', {included: 'yes'}),
              snapshot('doc2', {included: 'yes'}),
            ],
            docChanges: [added('doc2', {included: 'yes'})],
          });
          // Delete a result.
          return ref2.delete();
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(results => {
          snapshotsEqual(results, {
            docs: [snapshot('doc1', {included: 'yes'})],
            docChanges: [removed('doc2', {included: 'yes'})],
          });
          unsubscribe();
        });
    });

    it('orders limitToLast() correctly', async () => {
      const ref1 = randomCol.doc('doc1');
      const ref2 = randomCol.doc('doc2');
      const ref3 = randomCol.doc('doc3');

      await ref1.set({doc: 1});
      await ref2.set({doc: 2});
      await ref3.set({doc: 3});

      const unsubscribe = randomCol
        .orderBy('doc')
        .limitToLast(2)
        .onSnapshot(snapshot => currentDeferred.resolve(snapshot));

      const results = await waitForSnapshot();
      snapshotsEqual(results, {
        docs: [snapshot('doc2', {doc: 2}), snapshot('doc3', {doc: 3})],
        docChanges: [added('doc2', {doc: 2}), added('doc3', {doc: 3})],
      });

      unsubscribe();
    });
  });
});

describe('Transaction class', () => {
  let firestore: Firestore;
  let randomCol: CollectionReference;

  beforeEach(() => {
    randomCol = getTestRoot();
    firestore = randomCol.firestore;
  });

  afterEach(() => verifyInstance(firestore));

  it('has get() method', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({foo: 'bar'})
      .then(() => {
        return firestore.runTransaction(updateFunction => {
          return updateFunction.get(ref).then(doc => {
            return Promise.resolve(doc.get('foo'));
          });
        });
      })
      .then(res => {
        expect(res).to.equal('bar');
      });
  });

  it('has getAll() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');
    return Promise.all([ref1.set({}), ref2.set({})])
      .then(() => {
        return firestore.runTransaction(updateFunction => {
          return updateFunction.getAll(ref1, ref2).then(docs => {
            return Promise.resolve(docs.length);
          });
        });
      })
      .then(res => {
        expect(res).to.equal(2);
      });
  });

  it('getAll() supports array destructuring', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');
    return Promise.all([ref1.set({}), ref2.set({})])
      .then(() => {
        return firestore.runTransaction(updateFunction => {
          return updateFunction.getAll(...[ref1, ref2]).then(docs => {
            return Promise.resolve(docs.length);
          });
        });
      })
      .then(res => {
        expect(res).to.equal(2);
      });
  });

  it('getAll() supports field mask', () => {
    const ref1 = randomCol.doc('doc1');
    return ref1.set({foo: 'a', bar: 'b'}).then(() => {
      return firestore
        .runTransaction(updateFunction => {
          return updateFunction
            .getAll(ref1, {fieldMask: ['foo']})
            .then(([doc]) => doc);
        })
        .then(doc => {
          expect(doc.data()).to.deep.equal({foo: 'a'});
        });
    });
  });

  it('getAll() supports array destructuring with field mask', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');
    return Promise.all([
      ref1.set({f: 'a', b: 'b'}),
      ref2.set({f: 'a', b: 'b'}),
    ]).then(() => {
      return firestore
        .runTransaction(updateFunction => {
          return updateFunction
            .getAll(...[ref1, ref2], {fieldMask: ['f']})
            .then(docs => docs);
        })
        .then(docs => {
          expect(docs[0].data()).to.deep.equal({f: 'a'});
          expect(docs[1].data()).to.deep.equal({f: 'a'});
        });
    });
  });

  it('getAll() supports withConverter()', async () => {
    const ref1 = randomCol.doc('doc1').withConverter(postConverter);
    const ref2 = randomCol.doc('doc2').withConverter(postConverter);
    await ref1.set(new Post('post1', 'author1'));
    await ref2.set(new Post('post2', 'author2'));

    const docs = await firestore.runTransaction(updateFunction => {
      return updateFunction.getAll(ref1, ref2);
    });

    expect(docs[0].data()!.toString()).to.equal('post1, by author1');
    expect(docs[1].data()!.toString()).to.equal('post2, by author2');
  });

  it('set() and get() support withConverter()', async () => {
    const ref = randomCol.doc('doc1').withConverter(postConverter);
    await ref.set(new Post('post', 'author'));
    await firestore.runTransaction(async txn => {
      await txn.get(ref);
      await txn.set(ref, new Post('new post', 'author'));
    });
    const doc = await ref.get();
    expect(doc.data()!.toString()).to.equal('new post, by author');
  });

  it('has get() with query', () => {
    const ref = randomCol.doc('doc');
    const query = randomCol.where('foo', '==', 'bar');
    return ref
      .set({foo: 'bar'})
      .then(() => {
        return firestore.runTransaction(updateFunction => {
          return updateFunction.get(query).then(res => {
            return Promise.resolve(res.docs[0].get('foo'));
          });
        });
      })
      .then(res => {
        expect(res).to.equal('bar');
      });
  });

  it('has set() method', () => {
    const ref = randomCol.doc('doc');
    return firestore
      .runTransaction(updateFunction => {
        updateFunction.set(ref, {foo: 'foobar'});
        return Promise.resolve();
      })
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.get('foo')).to.equal('foobar');
      });
  });

  it('has update() method', () => {
    const ref = randomCol.doc('doc');
    return ref
      .set({
        boo: ['ghost', 'sebastian'],
        moo: 'chicken',
      })
      .then(() => {
        return firestore.runTransaction(updateFunction => {
          return updateFunction.get(ref).then(() => {
            updateFunction.update(ref, {
              boo: FieldValue.arrayRemove('sebastian'),
              moo: 'cow',
            });
          });
        });
      })
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.data()).to.deep.equal({
          boo: ['ghost'],
          moo: 'cow',
        });
      });
  });

  it('has delete() method', () => {
    let success = false;
    const ref = randomCol.doc('doc');
    return ref
      .set({foo: 'bar'})
      .then(() => {
        return firestore.runTransaction(updateFunction => {
          updateFunction.delete(ref);
          return Promise.resolve();
        });
      })
      .then(() => {
        success = true;
        return ref.get();
      })
      .then(result => {
        expect(success).to.be.true;
        expect(result.exists).to.be.false;
      });
  });

  it('does not retry transaction that fail with FAILED_PRECONDITION', async () => {
    const ref = firestore.collection('col').doc();

    let attempts = 0;

    await expect(
      firestore.runTransaction(async transaction => {
        ++attempts;
        transaction.update(ref, {foo: 'b'});
      })
    ).to.eventually.be.rejectedWith('No document to update');

    expect(attempts).to.equal(1);
  });

  it('retries transactions that fail with contention', async () => {
    const ref = randomCol.doc('doc');

    let attempts = 0;

    // Create two transactions that both read and update the same document.
    // `contentionPromise` is used to ensure that both transactions are active
    // on commit, which causes one of transactions to fail with Code ABORTED
    // and be retried.
    const contentionPromise = [new Deferred<void>(), new Deferred<void>()];

    const firstTransaction = firestore.runTransaction(async transaction => {
      ++attempts;
      await transaction.get(ref);
      contentionPromise[0].resolve();
      await contentionPromise[1].promise;
      transaction.set(ref, {first: true}, {merge: true});
    });

    const secondTransaction = firestore.runTransaction(async transaction => {
      ++attempts;
      await transaction.get(ref);
      contentionPromise[1].resolve();
      await contentionPromise[0].promise;
      transaction.set(ref, {second: true}, {merge: true});
    });

    await firstTransaction;
    await secondTransaction;

    expect(attempts).to.equal(3);

    const finalSnapshot = await ref.get();
    expect(finalSnapshot.data()).to.deep.equal({first: true, second: true});
  });

  it('supports read-only transactions', async () => {
    const ref = randomCol.doc('doc');
    await ref.set({foo: 'bar'});
    const snapshot = await firestore.runTransaction(
      updateFunction => updateFunction.get(ref),
      {readOnly: true}
    );
    expect(snapshot.exists).to.be.true;
  });

  it('supports read-only transactions with custom read-time', async () => {
    const ref = randomCol.doc('doc');
    const writeResult = await ref.set({foo: 1});
    await ref.set({foo: 2});
    const snapshot = await firestore.runTransaction(
      updateFunction => updateFunction.get(ref),
      {readOnly: true, readTime: writeResult.writeTime}
    );
    expect(snapshot.exists).to.be.true;
    expect(snapshot.get('foo')).to.equal(1);
  });

  it('fails read-only with writes', async () => {
    let attempts = 0;

    const ref = randomCol.doc('doc');
    try {
      await firestore.runTransaction(
        async updateFunction => {
          ++attempts;
          updateFunction.set(ref, {});
        },
        {readOnly: true}
      );
      expect.fail();
    } catch (e) {
      expect(attempts).to.equal(1);
      expect(e.code).to.equal(Status.INVALID_ARGUMENT);
    }
  });
});

describe('WriteBatch class', () => {
  let firestore: Firestore;
  let randomCol: CollectionReference;

  beforeEach(() => {
    randomCol = getTestRoot();
    firestore = randomCol.firestore;
  });

  afterEach(() => verifyInstance(firestore));

  it('supports empty batches', () => {
    return firestore.batch().commit();
  });

  it('has create() method', () => {
    const ref = randomCol.doc();
    const batch = firestore.batch();
    batch.create(ref, {foo: 'a'});
    return batch
      .commit()
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.get('foo')).to.equal('a');
      });
  });

  it('has set() method', () => {
    const ref = randomCol.doc('doc');
    const batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    return batch
      .commit()
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.get('foo')).to.equal('a');
      });
  });

  it('set supports partials', async () => {
    const ref = randomCol.doc('doc').withConverter(postConverterMerge);
    await ref.set(new Post('walnut', 'author'));
    const batch = firestore.batch();
    batch.set(ref, {title: 'olive'}, {merge: true});
    return batch
      .commit()
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.get('title')).to.equal('olive');
        expect(doc.get('author')).to.equal('author');
      });
  });

  it('set()', () => {
    const ref = randomCol.doc('doc');
    const batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    return batch
      .commit()
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.get('foo')).to.equal('a');
      });
  });

  it('has a full stack trace if set() errors', () => {
    // Use an invalid document name that the backend will reject.
    const ref = randomCol.doc('__doc__');
    const batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    return batch
      .commit()
      .then(() => Promise.reject('commit() should have failed'))
      .catch((err: Error) => {
        expect(err.stack).to.contain('WriteBatch.commit');
      });
  });

  it('has update() method', () => {
    const ref = randomCol.doc('doc');
    const batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    batch.update(ref, {foo: 'b'});
    return batch
      .commit()
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        expect(doc.get('foo')).to.equal('b');
      });
  });

  it('omits document transforms from write results', () => {
    const batch = firestore.batch();
    batch.set(randomCol.doc(), {foo: 'a'});
    batch.set(randomCol.doc(), {foo: FieldValue.serverTimestamp()});
    return batch.commit().then(writeResults => {
      expect(writeResults).to.have.length(2);
    });
  });

  it('enforces that updated document exists', () => {
    const ref = randomCol.doc();
    const batch = firestore.batch();
    batch.update(ref, {foo: 'b'});
    return batch
      .commit()
      .then(() => {
        expect.fail();
      })
      .catch(err => {
        expect(err.message.match(/No document to update/));
      });
  });

  it('has delete() method', () => {
    let success = false;

    const ref = randomCol.doc('doc');
    const batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    batch.delete(ref);
    return batch
      .commit()
      .then(() => {
        success = true;
        return ref.get();
      })
      .then(result => {
        expect(success).to.be.true;
        expect(result.exists).to.be.false;
      });
  });
});

describe('QuerySnapshot class', () => {
  let firestore: Firestore;
  let querySnapshot: Promise<QuerySnapshot>;

  beforeEach(() => {
    const randomCol = getTestRoot();
    firestore = randomCol.firestore;

    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    querySnapshot = Promise.all([
      ref1.set({foo: 'a'}),
      ref2.set({foo: 'a'}),
    ]).then(() => {
      return randomCol.get();
    });
  });

  afterEach(() => verifyInstance(firestore));

  it('has query property', () => {
    return querySnapshot
      .then(snapshot => {
        return snapshot.query.get();
      })
      .then(snapshot => {
        expect(snapshot.size).to.equal(2);
      });
  });

  it('has empty property', () => {
    return querySnapshot
      .then(snapshot => {
        expect(snapshot.empty).to.be.false;
        expect(snapshot.readTime).to.exist;
        return snapshot.query.where('foo', '==', 'bar').get();
      })
      .then(snapshot => {
        expect(snapshot.empty).to.be.true;
        expect(snapshot.readTime).to.exist;
      });
  });

  it('has size property', () => {
    return querySnapshot.then(snapshot => {
      expect(snapshot.size).to.equal(2);
    });
  });

  it('has docs property', () => {
    return querySnapshot.then(snapshot => {
      expect(snapshot.docs).to.have.length(2);
      expect(snapshot.docs[0].get('foo')).to.equal('a');
    });
  });

  it('has forEach() method', () => {
    let count = 0;

    return querySnapshot.then(snapshot => {
      snapshot.forEach(doc => {
        expect(doc.get('foo')).to.equal('a');
        ++count;
      });
      expect(count).to.equal(2);
    });
  });
});

describe('BulkWriter class', () => {
  let firestore: Firestore;
  let randomCol: CollectionReference;
  let writer: BulkWriter;

  beforeEach(() => {
    randomCol = getTestRoot();
    firestore = randomCol.firestore;
    writer = firestore.bulkWriter();
  });

  afterEach(() => verifyInstance(firestore));

  it('has create() method', async () => {
    const ref = randomCol.doc('doc1');
    const singleOp = writer.create(ref, {foo: 'bar'});
    await writer.close();
    const result = await ref.get();
    expect(result.data()).to.deep.equal({foo: 'bar'});
    const writeTime = (await singleOp).writeTime;
    expect(writeTime).to.not.be.null;
  });

  it('has set() method', async () => {
    const ref = randomCol.doc('doc1');
    const singleOp = writer.set(ref, {foo: 'bar'});
    await writer.close();
    const result = await ref.get();
    expect(result.data()).to.deep.equal({foo: 'bar'});
    const writeTime = (await singleOp).writeTime;
    expect(writeTime).to.not.be.null;
  });

  it('has update() method', async () => {
    const ref = randomCol.doc('doc1');
    await ref.set({foo: 'bar'});
    const singleOp = writer.update(ref, {foo: 'bar2'});
    await writer.close();
    const result = await ref.get();
    expect(result.data()).to.deep.equal({foo: 'bar2'});
    const writeTime = (await singleOp).writeTime;
    expect(writeTime).to.not.be.null;
  });

  it('has delete() method', async () => {
    const ref = randomCol.doc('doc1');
    await ref.set({foo: 'bar'});
    const singleOp = writer.delete(ref);
    await writer.close();
    const result = await ref.get();
    expect(result.exists).to.be.false;
    // TODO(b/158502664): Remove this check once we can get write times.
    const deleteResult = await singleOp;
    expect(deleteResult.writeTime).to.deep.equal(new Timestamp(0, 0));
  });

  it('can write to the same document twice', async () => {
    const ref = randomCol.doc('doc1');
    const op1 = writer.set(ref, {foo: 'bar'});
    const op2 = writer.set(ref, {foo: 'bar2'});
    await writer.close();
    const result = await ref.get();
    // The order of writes is not guaranteed.
    expect(result.get('foo')).to.not.be.undefined;
    const writeTime1 = (await op1).writeTime;
    const writeTime2 = (await op2).writeTime;
    expect(writeTime1).to.not.be.null;
    expect(writeTime2).to.not.be.null;
  });

  it('can terminate once BulkWriter is closed', async () => {
    const ref = randomCol.doc('doc1');
    writer.set(ref, {foo: 'bar'});
    await writer.close();
    return firestore.terminate();
  });

  describe('recursiveDelete()', () => {
    async function countDocumentChildren(
      ref: DocumentReference
    ): Promise<number> {
      let count = 0;
      const collections = await ref.listCollections();
      for (const collection of collections) {
        count += await countCollectionChildren(collection);
      }
      return count;
    }

    async function countCollectionChildren(
      ref: CollectionReference
    ): Promise<number> {
      let count = 0;
      const docs = await ref.listDocuments();
      for (const doc of docs) {
        count += (await countDocumentChildren(doc)) + 1;
      }
      return count;
    }

    beforeEach(async () => {
      // ROOT-DB
      // └── randomCol
      //     ├── anna
      //     └── bob
      //         └── parentsCol
      //             ├── charlie
      //             └── daniel
      //                 └── childCol
      //                     ├── ernie
      //                     └── francis
      const batch = firestore.batch();
      batch.set(randomCol.doc('anna'), {name: 'anna'});
      batch.set(randomCol.doc('bob'), {name: 'bob'});
      batch.set(randomCol.doc('bob/parentsCol/charlie'), {name: 'charlie'});
      batch.set(randomCol.doc('bob/parentsCol/daniel'), {name: 'daniel'});
      batch.set(randomCol.doc('bob/parentsCol/daniel/childCol/ernie'), {
        name: 'ernie',
      });
      batch.set(randomCol.doc('bob/parentsCol/daniel/childCol/francis'), {
        name: 'francis',
      });
      await batch.commit();
    });

    it('on top-level collection', async () => {
      await firestore.recursiveDelete(randomCol);
      expect(await countCollectionChildren(randomCol)).to.equal(0);
    });

    it('on nested collection', async () => {
      const coll = randomCol.doc('bob').collection('parentsCol');
      await firestore.recursiveDelete(coll);

      expect(await countCollectionChildren(coll)).to.equal(0);
      expect(await countCollectionChildren(randomCol)).to.equal(2);
    });

    it('on nested document', async () => {
      const doc = randomCol.doc('bob/parentsCol/daniel');
      await firestore.recursiveDelete(doc);

      const docSnap = await doc.get();
      expect(docSnap.exists).to.be.false;
      expect(await countDocumentChildren(randomCol.doc('bob'))).to.equal(1);
      expect(await countCollectionChildren(randomCol)).to.equal(3);
    });

    it('on leaf document', async () => {
      const doc = randomCol.doc('bob/parentsCol/daniel/childCol/ernie');
      await firestore.recursiveDelete(doc);

      const docSnap = await doc.get();
      expect(docSnap.exists).to.be.false;
      expect(await countCollectionChildren(randomCol)).to.equal(5);
    });

    it('does not affect other collections', async () => {
      // Add other nested collection that shouldn't be deleted.
      const collB = firestore.collection('doggos');
      await collB.doc('doggo').set({name: 'goodboi'});

      await firestore.recursiveDelete(collB);
      expect(await countCollectionChildren(randomCol)).to.equal(6);
      expect(await countCollectionChildren(collB)).to.equal(0);
    });

    it('with custom BulkWriter instance', async () => {
      const bulkWriter = firestore.bulkWriter();
      let callbackCount = 0;
      bulkWriter.onWriteResult(() => {
        callbackCount++;
      });
      await firestore.recursiveDelete(randomCol, bulkWriter);
      expect(callbackCount).to.equal(6);
    });
  });

  it('can retry failed writes with a provided callback', async () => {
    let retryCount = 0;
    let code: Status = -1;
    writer.onWriteError(error => {
      retryCount = error.failedAttempts;
      return error.failedAttempts < 3;
    });

    // Use an invalid document name that the backend will reject.
    const ref = randomCol.doc('__doc__');
    writer.create(ref, {foo: 'bar'}).catch(err => {
      code = err.code;
    });
    await writer.close();
    expect(retryCount).to.equal(3);
    expect(code).to.equal(Status.INVALID_ARGUMENT);
  });
});

describe('Client initialization', () => {
  const ops: Array<[string, (coll: CollectionReference) => Promise<unknown>]> =
    [
      ['CollectionReference.get()', randomColl => randomColl.get()],
      ['CollectionReference.add()', randomColl => randomColl.add({})],
      [
        'CollectionReference.stream()',
        randomColl => {
          const deferred = new Deferred<void>();
          randomColl.stream().on('finish', () => {
            deferred.resolve();
          });
          return deferred.promise;
        },
      ],
      [
        'CollectionReference.listDocuments()',
        randomColl => randomColl.listDocuments(),
      ],
      [
        'CollectionReference.onSnapshot()',
        randomColl => {
          const deferred = new Deferred<void>();
          const unsubscribe = randomColl.onSnapshot(() => {
            unsubscribe();
            deferred.resolve();
          });
          return deferred.promise;
        },
      ],
      ['DocumentReference.get()', randomColl => randomColl.doc().get()],
      ['DocumentReference.create()', randomColl => randomColl.doc().create({})],
      ['DocumentReference.set()', randomColl => randomColl.doc().set({})],
      [
        'DocumentReference.update()',
        async randomColl => {
          const update = randomColl.doc().update('foo', 'bar');
          await expect(update).to.eventually.be.rejectedWith(
            'No document to update'
          );
        },
      ],
      ['DocumentReference.delete()', randomColl => randomColl.doc().delete()],
      [
        'DocumentReference.listCollections()',
        randomColl => randomColl.doc().listCollections(),
      ],
      [
        'DocumentReference.onSnapshot()',
        randomColl => {
          const deferred = new Deferred<void>();
          const unsubscribe = randomColl.doc().onSnapshot(() => {
            unsubscribe();
            deferred.resolve();
          });
          return deferred.promise;
        },
      ],
      [
        'CollectionGroup.getPartitions()',
        async randomColl => {
          const partitions = randomColl.firestore
            .collectionGroup('id')
            .getPartitions(2);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for await (const _ of partitions);
        },
      ],
      [
        'Firestore.runTransaction()',
        randomColl =>
          randomColl.firestore.runTransaction(t => t.get(randomColl)),
      ],
      [
        'Firestore.getAll()',
        randomColl => randomColl.firestore.getAll(randomColl.doc()),
      ],
      [
        'Firestore.batch()',
        randomColl => randomColl.firestore.batch().commit(),
      ],
      ['Firestore.terminate()', randomColl => randomColl.firestore.terminate()],
    ];

  for (const [description, op] of ops) {
    it(`succeeds for ${description}`, () => {
      const randomCol = getTestRoot();
      return op(randomCol);
    });
  }
});

describe('Bundle building', () => {
  let firestore: Firestore;
  let testCol: CollectionReference;

  beforeEach(async () => {
    testCol = getTestRoot();
    firestore = testCol.firestore;

    const ref1 = testCol.doc('doc1');
    const ref2 = testCol.doc('doc2');
    const ref3 = testCol.doc('doc3');
    const ref4 = testCol.doc('doc4');

    await Promise.all([
      ref1.set({name: '1', sort: 1, value: 'string value'}),
      ref2.set({name: '2', sort: 2, value: 42}),
      ref3.set({name: '3', sort: 3, value: {nested: 'nested value'}}),
      ref4.set({
        name: '4',
        sort: 4,
        value: FieldValue.serverTimestamp(),
      }),
    ]);
  });

  afterEach(() => verifyInstance(firestore));

  it('succeeds when there are no results', async () => {
    const bundle = firestore.bundle(TEST_BUNDLE_ID);
    const query = testCol.where('value', '==', '42');
    const snap = await query.get();

    bundle.add('query', snap);
    // `elements` is expected to be [bundleMeta, query].
    const elements = await bundleToElementArray(bundle.build());

    const meta = (elements[0] as IBundleElement).metadata;
    verifyMetadata(meta!, snap.readTime.toProto().timestampValue!, 0);

    const namedQuery = (elements[1] as IBundleElement).namedQuery;
    // Verify saved query.
    expect(namedQuery).to.deep.equal({
      name: 'query',
      readTime: snap.readTime.toProto().timestampValue,
      // TODO(wuandy): Fix query.toProto to skip undefined fields, so we can stop using `extend` here.
      bundledQuery: extend(
        true,
        {},
        {
          parent: query.toProto().parent,
          structuredQuery: query.toProto().structuredQuery,
        }
      ),
    });
  });

  it('succeeds when added document does not exist', async () => {
    const bundle = firestore.bundle(TEST_BUNDLE_ID);
    const snap = await testCol.doc('doc5-not-exist').get();

    bundle.add(snap);
    // `elements` is expected to be [bundleMeta, docMeta].
    const elements = await bundleToElementArray(bundle.build());
    expect(elements.length).to.equal(2);

    const meta = (elements[0] as IBundleElement).metadata;
    verifyMetadata(meta!, snap.readTime.toProto().timestampValue!, 1);

    const docMeta = (elements[1] as IBundleElement).documentMetadata;
    expect(docMeta).to.deep.equal({
      name: snap.toDocumentProto().name,
      readTime: snap.readTime.toProto().timestampValue,
      exists: false,
    });
  });

  it('succeeds to save limit and limitToLast queries', async () => {
    const bundle = firestore.bundle(TEST_BUNDLE_ID);
    const limitQuery = testCol.orderBy('sort', 'desc').limit(1);
    const limitSnap = await limitQuery.get();
    const limitToLastQuery = testCol.orderBy('sort', 'asc').limitToLast(1);
    const limitToLastSnap = await limitToLastQuery.get();

    bundle.add('limitQuery', limitSnap);
    bundle.add('limitToLastQuery', limitToLastSnap);
    // `elements` is expected to be [bundleMeta, limitQuery, limitToLastQuery, doc4Meta, doc4Snap].
    const elements = await bundleToElementArray(await bundle.build());

    const meta = (elements[0] as IBundleElement).metadata;
    verifyMetadata(
      meta!,
      limitToLastSnap.readTime.toProto().timestampValue!,
      1
    );

    let namedQuery1 = (elements[1] as IBundleElement).namedQuery;
    let namedQuery2 = (elements[2] as IBundleElement).namedQuery;
    // We might need to swap them.
    if (namedQuery1!.name === 'limitToLastQuery') {
      const temp = namedQuery2;
      namedQuery2 = namedQuery1;
      namedQuery1 = temp;
    }

    // Verify saved limit query.
    expect(namedQuery1).to.deep.equal({
      name: 'limitQuery',
      readTime: limitSnap.readTime.toProto().timestampValue,
      bundledQuery: extend(
        true,
        {},
        {
          parent: limitQuery.toProto().parent,
          structuredQuery: limitQuery.toProto().structuredQuery,
          limitType: 'FIRST',
        }
      ),
    });

    // `limitToLastQuery`'s structured query should be the same as this one. This together with
    // `limitType` can re-construct a limitToLast client query by client SDKs.
    const q = testCol.orderBy('sort', 'asc').limit(1);
    // Verify saved limitToLast query.
    expect(namedQuery2).to.deep.equal({
      name: 'limitToLastQuery',
      readTime: limitToLastSnap.readTime.toProto().timestampValue,
      bundledQuery: extend(
        true,
        {},
        {
          parent: q.toProto().parent,
          structuredQuery: q.toProto().structuredQuery,
          limitType: 'LAST',
        }
      ),
    });

    // Verify bundled document
    const docMeta = (elements[3] as IBundleElement).documentMetadata;
    expect(docMeta).to.deep.equal({
      name: limitToLastSnap.docs[0].toDocumentProto().name,
      readTime: limitToLastSnap.readTime.toProto().timestampValue,
      exists: true,
      queries: ['limitQuery', 'limitToLastQuery'],
    });

    const bundledDoc = (elements[4] as IBundleElement).document;
    // The `valueType` is auxiliary and does not exist in proto.
    const expected = limitToLastSnap.docs[0].toDocumentProto();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (expected.fields!.name as any).valueType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (expected.fields!.sort as any).valueType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (expected.fields!.value as any).valueType;
    expect(bundledDoc).to.deep.equal(expected);
  });
});

describe('Types test', () => {
  let firestore: Firestore;
  let randomCol: CollectionReference;
  let doc: DocumentReference;

  class TestObject {
    constructor(
      readonly outerString: string,
      readonly outerArr: string[],
      readonly nested: {
        innerNested: {
          innerNestedNum: number;
        };
        innerArr: number[];
        timestamp: Timestamp;
      }
    ) {}
  }

  const testConverter = {
    toFirestore(testObj: WithFieldValue<TestObject>) {
      return {...testObj};
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): TestObject {
      const data = snapshot.data();
      return new TestObject(data.outerString, data.outerArr, data.nested);
    },
  };

  const initialData = {
    outerString: 'foo',
    outerArr: [],
    nested: {
      innerNested: {
        innerNestedNum: 2,
      },
      innerArr: FieldValue.arrayUnion(2),
      timestamp: FieldValue.serverTimestamp(),
    },
  };

  beforeEach(async () => {
    randomCol = getTestRoot();
    firestore = randomCol.firestore;
    doc = randomCol.doc();

    await doc.set(initialData);
  });

  afterEach(() => verifyInstance(firestore));

  describe('Nested partial support', () => {
    const testConverterMerge = {
      toFirestore(
        testObj: PartialWithFieldValue<TestObject>,
        options?: SetOptions
      ) {
        if (options) {
          expect(testObj).to.not.be.an.instanceOf(TestObject);
        } else {
          expect(testObj).to.be.an.instanceOf(TestObject);
        }
        return {...testObj};
      },
      fromFirestore(snapshot: QueryDocumentSnapshot): TestObject {
        const data = snapshot.data();
        return new TestObject(data.outerString, data.outerArr, data.nested);
      },
    };

    it('supports FieldValues', async () => {
      const ref = doc.withConverter(testConverterMerge);

      // Allow Field Values in nested partials.
      await ref.set(
        {
          outerString: FieldValue.delete(),
          nested: {
            innerNested: {
              innerNestedNum: FieldValue.increment(1),
            },
            innerArr: FieldValue.arrayUnion(2),
            timestamp: FieldValue.serverTimestamp(),
          },
        },
        {merge: true}
      );

      // Allow setting FieldValue on entire object field.
      await ref.set(
        {
          nested: FieldValue.delete(),
        },
        {merge: true}
      );
    });

    it('validates types in outer and inner fields', async () => {
      const ref = doc.withConverter(testConverterMerge);

      // Check top-level fields.
      await ref.set(
        {
          // @ts-expect-error Should fail to transpile.
          outerString: 3,
          // @ts-expect-error Should fail to transpile.
          outerArr: null,
        },
        {merge: true}
      );

      // Check nested fields.
      await ref.set(
        {
          nested: {
            innerNested: {
              // @ts-expect-error Should fail to transpile.
              innerNestedNum: 'string',
            },
            // @ts-expect-error Should fail to transpile.
            innerArr: null,
          },
        },
        {merge: true}
      );
      await ref.set(
        {
          // @ts-expect-error Should fail to transpile.
          nested: 3,
        },
        {merge: true}
      );
    });

    it('checks for nonexistent properties', async () => {
      const ref = doc.withConverter(testConverterMerge);
      // Top-level property.
      await ref.set(
        {
          // @ts-expect-error Should fail to transpile.
          nonexistent: 'foo',
        },
        {merge: true}
      );

      // Nested property
      await ref.set(
        {
          nested: {
            // @ts-expect-error Should fail to transpile.
            nonexistent: 'foo',
          },
        },
        {merge: true}
      );
    });

    it('allows omitting fields', async () => {
      const ref = doc.withConverter(testConverterMerge);
      // Omit outer fields.
      await ref.set(
        {
          outerString: '',
          nested: {
            innerNested: {
              innerNestedNum: FieldValue.increment(1),
            },
            innerArr: FieldValue.arrayUnion(2),
            timestamp: FieldValue.serverTimestamp(),
          },
        },
        {merge: true}
      );

      // Omit inner fields
      await ref.set(
        {
          outerString: '',
          outerArr: [],
          nested: {
            innerNested: {
              innerNestedNum: FieldValue.increment(1),
            },
            timestamp: FieldValue.serverTimestamp(),
          },
        },
        {merge: true}
      );
    });
  });

  describe('NestedPartial', () => {
    const testConverterMerge = {
      toFirestore(
        testObj: PartialWithFieldValue<TestObject>,
        options?: SetOptions
      ) {
        if (options) {
          expect(testObj).to.not.be.an.instanceOf(TestObject);
        } else {
          expect(testObj).to.be.an.instanceOf(TestObject);
        }
        return {...testObj};
      },
      fromFirestore(snapshot: QueryDocumentSnapshot): TestObject {
        const data = snapshot.data();
        return new TestObject(data.outerString, data.outerArr, data.nested);
      },
    };

    it('supports FieldValues', async () => {
      const ref = doc.withConverter(testConverterMerge);

      // Allow Field Values in nested partials.
      await ref.set(
        {
          outerString: FieldValue.delete(),
          nested: {
            innerNested: {
              innerNestedNum: FieldValue.increment(1),
            },
            innerArr: FieldValue.arrayUnion(2),
            timestamp: FieldValue.serverTimestamp(),
          },
        },
        {merge: true}
      );

      // Allow setting FieldValue on entire object field.
      await ref.set(
        {
          nested: FieldValue.delete(),
        },
        {merge: true}
      );
    });

    it('validates types in outer and inner fields', async () => {
      const ref = doc.withConverter(testConverterMerge);

      // Check top-level fields.
      await ref.set(
        {
          // @ts-expect-error Should fail to transpile.
          outerString: 3,
          // @ts-expect-error Should fail to transpile.
          outerArr: null,
        },
        {merge: true}
      );

      // Check nested fields.
      await ref.set(
        {
          nested: {
            innerNested: {
              // @ts-expect-error Should fail to transpile.
              innerNestedNum: 'string',
            },
            // @ts-expect-error Should fail to transpile.
            innerArr: null,
          },
        },
        {merge: true}
      );
      await ref.set(
        {
          // @ts-expect-error Should fail to transpile.
          nested: 3,
        },
        {merge: true}
      );
    });

    it('checks for nonexistent properties', async () => {
      const ref = doc.withConverter(testConverterMerge);
      // Top-level property.
      await ref.set(
        {
          // @ts-expect-error Should fail to transpile.
          nonexistent: 'foo',
        },
        {merge: true}
      );

      // Nested property
      await ref.set(
        {
          nested: {
            // @ts-expect-error Should fail to transpile.
            nonexistent: 'foo',
          },
        },
        {merge: true}
      );
    });
  });

  describe('WithFieldValue', () => {
    it('supports FieldValues', async () => {
      const ref = doc.withConverter(testConverter);

      // Allow Field Values and nested partials.
      await ref.set({
        outerString: 'foo',
        outerArr: [],
        nested: {
          innerNested: {
            innerNestedNum: FieldValue.increment(1),
          },
          innerArr: FieldValue.arrayUnion(2),
          timestamp: FieldValue.serverTimestamp(),
        },
      });
    });

    it('requires all outer fields to be present', async () => {
      const ref = doc.withConverter(testConverter);

      // @ts-expect-error Should fail to transpile.
      await ref.set({
        outerArr: [],
        nested: {
          innerNested: {
            innerNestedNum: FieldValue.increment(1),
          },
          innerArr: FieldValue.arrayUnion(2),
          timestamp: FieldValue.serverTimestamp(),
        },
      });
    });

    it('requires all inner fields to be present', async () => {
      const ref = doc.withConverter(testConverter);

      await ref.set({
        outerString: '',
        outerArr: [],
        // @ts-expect-error Should fail to transpile.
        nested: {
          innerNested: {
            innerNestedNum: FieldValue.increment(1),
          },
          timestamp: FieldValue.serverTimestamp(),
        },
      });
    });

    it('validates inner and outer fields', async () => {
      const ref = doc.withConverter(testConverter);

      await ref.set({
        outerString: 'foo',
        // @ts-expect-error Should fail to transpile.
        outerArr: 2,
        nested: {
          innerNested: {
            // @ts-expect-error Should fail to transpile.
            innerNestedNum: 'string',
          },
          innerArr: FieldValue.arrayUnion(2),
          timestamp: FieldValue.serverTimestamp(),
        },
      });
    });

    it('checks for nonexistent properties', async () => {
      const ref = doc.withConverter(testConverter);

      // Top-level nonexistent fields should error
      await ref.set({
        outerString: 'foo',
        // @ts-expect-error Should fail to transpile.
        outerNum: 3,
        outerArr: [],
        nested: {
          innerNested: {
            innerNestedNum: 2,
          },
          innerArr: FieldValue.arrayUnion(2),
          timestamp: FieldValue.serverTimestamp(),
        },
      });

      // Nested nonexistent fields should error
      await ref.set({
        outerString: 'foo',
        outerNum: 3,
        outerArr: [],
        nested: {
          innerNested: {
            // @ts-expect-error Should fail to transpile.
            nonexistent: 'string',
            innerNestedNum: 2,
          },
          innerArr: FieldValue.arrayUnion(2),
          timestamp: FieldValue.serverTimestamp(),
        },
      });
    });

    it('allows certain types for not others', async () => {
      const withTryCatch = async (
        fn: () => Promise<WriteResult>
      ): Promise<void> => {
        try {
          await fn();
        } catch {
          // This is expected.
        }
      };

      // These tests exist to establish which object types are allowed to be
      // passed in by default when `T = DocumentData`. Some objects extend
      // the Javascript `{}`, which is why they're allowed whereas others
      // throw an error.
      // @ts-expect-error This should fail to transpile.
      await withTryCatch(() => doc.set(1));
      // @ts-expect-error This should fail to transpile.
      await withTryCatch(() => doc.set('foo'));
      // @ts-expect-error This should fail to transpile.
      await withTryCatch(() => doc.set(false));
      // @ts-expect-error This should fail to transpile.
      await withTryCatch(() => doc.set(undefined));
      // @ts-expect-error This should fail to transpile.
      await withTryCatch(() => doc.set(null));
      await withTryCatch(() => doc.set([0]));
      await withTryCatch(() => doc.set(new Set<string>()));
      await withTryCatch(() => doc.set(new Map<string, number>()));
    });

    describe('used as a type', () => {
      class ObjectWrapper<T> {
        withFieldValueT(value: WithFieldValue<T>): WithFieldValue<T> {
          return value;
        }

        withPartialFieldValueT(
          value: PartialWithFieldValue<T>
        ): PartialWithFieldValue<T> {
          return value;
        }

        // Wrapper to avoid having Firebase types in non-Firebase code.
        withT(value: T): void {
          this.withFieldValueT(value);
        }

        // Wrapper to avoid having Firebase types in non-Firebase code.
        withPartialT(value: Partial<T>): void {
          this.withPartialFieldValueT(value);
        }
      }

      it('supports passing in the object as `T`', () => {
        interface Foo {
          id: string;
          foo: number;
        }
        const foo = new ObjectWrapper<Foo>();
        foo.withFieldValueT({id: '', foo: FieldValue.increment(1)});
        foo.withPartialFieldValueT({foo: FieldValue.increment(1)});
        foo.withT({id: '', foo: 1});
        foo.withPartialT({foo: 1});
      });

      it('does not allow primitive types to use FieldValue', () => {
        type Bar = number;
        const bar = new ObjectWrapper<Bar>();
        // @ts-expect-error This should fail to transpile.
        bar.withFieldValueT(FieldValue.increment(1));
        // @ts-expect-error This should fail to transpile.
        bar.withPartialFieldValueT(FieldValue.increment(1));
      });
    });
  });

  describe('UpdateData', () => {
    it('supports FieldValues', async () => {
      const ref = doc.withConverter(testConverter);
      await ref.update({
        outerString: FieldValue.delete(),
        nested: {
          innerNested: {
            innerNestedNum: FieldValue.increment(2),
          },
          innerArr: FieldValue.arrayUnion(3),
        },
      });
    });

    it('validates inner and outer fields', async () => {
      const ref = doc.withConverter(testConverter);
      await ref.update({
        // @ts-expect-error Should fail to transpile.
        outerString: 3,
        nested: {
          innerNested: {
            // @ts-expect-error Should fail to transpile.
            innerNestedNum: 'string',
          },
          // @ts-expect-error Should fail to transpile.
          innerArr: 2,
        },
      });
    });

    it('supports string-separated fields', async () => {
      const ref = doc.withConverter(testConverter);
      await ref.update({
        // @ts-expect-error Should fail to transpile.
        outerString: 3,
        // @ts-expect-error Should fail to transpile.
        'nested.innerNested.innerNestedNum': 'string',
        // @ts-expect-error Should fail to transpile.
        'nested.innerArr': 3,
        'nested.timestamp': FieldValue.serverTimestamp(),
      });

      // String comprehension works in nested fields.
      await ref.update({
        nested: {
          innerNested: {
            // @ts-expect-error Should fail to transpile.
            innerNestedNum: 'string',
          },
          // @ts-expect-error Should fail to transpile.
          innerArr: 3,
        },
      });
    });

    it('supports optional fields', async () => {
      interface TestObjectOptional {
        optionalStr?: string;
        nested?: {
          requiredStr: string;
        };
      }

      const testConverterOptional = {
        toFirestore(testObj: WithFieldValue<TestObjectOptional>) {
          return {...testObj};
        },
        fromFirestore(snapshot: QueryDocumentSnapshot): TestObjectOptional {
          const data = snapshot.data();
          return {
            optionalStr: data.optionalStr,
            nested: data.nested,
          };
        },
      };

      const ref = doc.withConverter(testConverterOptional);

      await ref.update({
        optionalStr: 'foo',
      });
      await ref.update({
        optionalStr: 'foo',
      });

      await ref.update({
        nested: {
          requiredStr: 'foo',
        },
      });
      await ref.update({
        'nested.requiredStr': 'foo',
      });
    });

    it('supports null fields', async () => {
      interface TestObjectOptional {
        optionalStr?: string;
        nested?: {
          strOrNull: string | null;
        };
      }

      const testConverterOptional = {
        toFirestore(testObj: WithFieldValue<TestObjectOptional>) {
          return {...testObj};
        },
        fromFirestore(snapshot: QueryDocumentSnapshot): TestObjectOptional {
          const data = snapshot.data();
          return {
            optionalStr: data.optionalStr,
            nested: data.nested,
          };
        },
      };
      const ref = doc.withConverter(testConverterOptional);

      await ref.update({
        nested: {
          strOrNull: null,
        },
      });
      await ref.update({
        'nested.strOrNull': null,
      });
    });

    it('supports union fields', async () => {
      interface TestObjectUnion {
        optionalStr?: string;
        nested?:
          | {
              requiredStr: string;
            }
          | {requiredNumber: number};
      }

      const testConverterUnion = {
        toFirestore(testObj: WithFieldValue<TestObjectUnion>) {
          return {...testObj};
        },
        fromFirestore(snapshot: QueryDocumentSnapshot): TestObjectUnion {
          const data = snapshot.data();
          return {
            optionalStr: data.optionalStr,
            nested: data.nested,
          };
        },
      };

      const ref = doc.withConverter(testConverterUnion);

      await ref.update({
        nested: {
          requiredStr: 'foo',
        },
      });

      await ref.update({
        'nested.requiredStr': 'foo',
      });
      await ref.update({
        // @ts-expect-error Should fail to transpile.
        'nested.requiredStr': 1,
      });

      await ref.update({
        'nested.requiredNumber': 1,
      });

      await ref.update({
        // @ts-expect-error Should fail to transpile.
        'nested.requiredNumber': 'foo',
      });
      await ref.update({
        // @ts-expect-error Should fail to transpile.
        'nested.requiredNumber': null,
      });
    });

    it('checks for nonexistent fields', async () => {
      const ref = doc.withConverter(testConverter);

      // Top-level fields.
      await ref.update({
        // @ts-expect-error Should fail to transpile.
        nonexistent: 'foo',
      });

      // Nested Fields.
      await ref.update({
        nested: {
          // @ts-expect-error Should fail to transpile.
          nonexistent: 'foo',
        },
      });

      // String fields.
      await ref.update({
        // @ts-expect-error Should fail to transpile.
        nonexistent: 'foo',
      });
      await ref.update({
        // @ts-expect-error Should fail to transpile.
        'nested.nonexistent': 'foo',
      });
    });
  });

  describe('methods', () => {
    it('CollectionReference.add()', async () => {
      const ref = randomCol.withConverter(testConverter);

      // Requires all fields to be present
      // @ts-expect-error Should fail to transpile.
      await ref.add({
        outerArr: [],
        nested: {
          innerNested: {
            innerNestedNum: 2,
          },
          innerArr: [],
          timestamp: FieldValue.serverTimestamp(),
        },
      });
    });

    it('WriteBatch.set()', () => {
      const ref = doc.withConverter(testConverter);
      const batch = firestore.batch();

      // Requires full object if {merge: true} is not set.
      // @ts-expect-error Should fail to transpile.
      batch.set(ref, {
        outerArr: [],
        nested: {
          innerNested: {
            innerNestedNum: FieldValue.increment(1),
          },
          innerArr: FieldValue.arrayUnion(2),
          timestamp: FieldValue.serverTimestamp(),
        },
      });

      batch.set(
        ref,
        {
          outerArr: [],
          nested: {
            innerNested: {
              innerNestedNum: FieldValue.increment(1),
            },
            innerArr: FieldValue.arrayUnion(2),
            timestamp: FieldValue.serverTimestamp(),
          },
        },
        {merge: true}
      );
    });

    it('WriteBatch.update()', () => {
      const ref = doc.withConverter(testConverter);
      const batch = firestore.batch();

      batch.update(ref, {
        outerArr: [],
        nested: {
          'innerNested.innerNestedNum': FieldValue.increment(1),
          innerArr: FieldValue.arrayUnion(2),
          timestamp: FieldValue.serverTimestamp(),
        },
      });
    });

    it('Transaction.set()', async () => {
      const ref = doc.withConverter(testConverter);

      return firestore.runTransaction(async tx => {
        // Requires full object if {merge: true} is not set.
        // @ts-expect-error Should fail to transpile.
        tx.set(ref, {
          outerArr: [],
          nested: {
            innerNested: {
              innerNestedNum: FieldValue.increment(1),
            },
            innerArr: FieldValue.arrayUnion(2),
            timestamp: FieldValue.serverTimestamp(),
          },
        });

        tx.set(
          ref,
          {
            outerArr: [],
            nested: {
              innerNested: {
                innerNestedNum: FieldValue.increment(1),
              },
              innerArr: FieldValue.arrayUnion(2),
              timestamp: FieldValue.serverTimestamp(),
            },
          },
          {merge: true}
        );
      });
    });

    it('Transaction.update()', async () => {
      const ref = doc.withConverter(testConverter);

      return firestore.runTransaction(async tx => {
        tx.update(ref, {
          outerArr: [],
          nested: {
            innerNested: {
              innerNestedNum: FieldValue.increment(1),
            },
            innerArr: FieldValue.arrayUnion(2),
            timestamp: FieldValue.serverTimestamp(),
          },
        });
      });
    });
  });
});
