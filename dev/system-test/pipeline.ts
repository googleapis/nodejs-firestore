import {
  AggregateQuery,
  DocumentData,
  QuerySnapshot,
  VectorValue,
} from '@google-cloud/firestore';

import {expect} from 'chai';
import {afterEach, beforeEach, describe, it} from 'mocha';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  FieldValue,
  Filter,
  Firestore,
  Query,
  QueryDocumentSnapshot,
} from '../src';
import {verifyInstance} from '../test/util/helpers';
import {DeferredPromise, getTestRoot} from './firestore';
import {IndexTestHelper} from './index_test_helper';

describe('Pipeline class', () => {
  let firestore: Firestore;
  let randomCol: CollectionReference;

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

  async function testCollectionWithDocs(docs: {
    [id: string]: DocumentData;
  }): Promise<CollectionReference<DocumentData>> {
    for (const id in docs) {
      const ref = randomCol.doc(id);
      await ref.set(docs[id]);
    }
    return randomCol;
  }

  function expectDocs(result: QuerySnapshot, ...docs: string[]): void;
  function expectDocs(result: QuerySnapshot, ...data: DocumentData[]): void;

  function expectDocs(
    result: QuerySnapshot,
    ...data: DocumentData[] | string[]
  ): void {
    expect(result.size).to.equal(data.length);

    if (data.length > 0) {
      if (typeof data[0] === 'string') {
        const actualIds = result.docs.map(docSnapshot => docSnapshot.id);
        expect(actualIds).to.deep.equal(data);
      } else {
        result.forEach(doc => {
          expect(doc.data()).to.deep.equal(data.shift());
        });
      }
    }
  }

  async function compareQueryAndPipeline(query: Query): Promise<QuerySnapshot> {
    const queryResults = await query.get();
    const pipeline = query.toPipeline();
    const pipelineResults = await pipeline.execute();

    expect(queryResults.docs.map(s => s._fieldsProto)).to.deep.equal(
      pipelineResults.map(r => r._fieldsProto)
    );
    return queryResults;
  }

  beforeEach(() => {
    randomCol = getTestRoot();
    firestore = randomCol.firestore;
  });

  afterEach(() => verifyInstance(firestore));

  it('basic collection', async () => {
    const result = await firestore
      .pipeline()
      .collection(randomCol.path)
      .limit(0)
      .execute();
    expect(result).to.be.empty;
  });
});
