// Copyright 2024 Google LLC
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

import {DocumentData} from '@google-cloud/firestore';

import {
  BooleanExpr,
  constant,
  constantVector,
  map,
  GeoPoint,
  FieldValue,
  array,
  Timestamp,
  bitNot,
  field,
  xor,
  AggregateFunction,
  rand,
  arrayOffset,
  timestampToUnixMicros,
  timestampToUnixSeconds,
  unixMicrosToTimestamp,
  timestampToUnixMillis,
  timestampSub,
  timestampAdd,
  byteLength,
  bitAnd,
  multiply,
  PipelineSnapshot,
  sum,
  maximum,
  descending,
  FunctionExpr,
  minimum,
  count,
  countIf,
  arrayLength,
  strContains,
  charLength,
  divide,
  mod,
  reverse,
  trim,
  toUpper,
  toLower,
  vectorLength,
  isNotNan,
  exists,
  isNotNull,
  isAbsent,
  ifError,
  isError,
  isNan,
  arrayConcat,
  substr,
  documentId,
  isNull,
  arrayContainsAll,
  FindNearestOptions,
  replaceFirst,
  replaceAll,
  mapRemove,
  mapMerge,
  unixSecondsToTimestamp,
  unixMillisToTimestamp,
  bitOr,
  bitXor,
  bitLeftShift,
  bitRightShift,
  add,
  and,
  arrayContains,
  arrayContainsAny,
  avg,
  countAll,
  endsWith,
  eq,
  gt,
  like,
  lt,
  neq,
  ascending,
  not,
  or,
  regexContains,
  regexMatch,
  startsWith,
  strConcat,
  subtract,
  cosineDistance,
  dotProduct,
  euclideanDistance,
  mapGet,
  lte,
  eqAny,
  PipelineResult,
  notEqAny,
  logicalMinimum,
  logicalMaximum,
  cond,
  CollectionReference,
  FieldPath,
  Firestore,
} from '../src';

import {expect} from 'chai';
import {afterEach, describe, it} from 'mocha';
import {itIf, verifyInstance} from '../test/util/helpers';
import {getTestDb, getTestRoot} from './firestore';

import {Firestore as InternalFirestore} from '../src';

const testUnsupportedFeatures: boolean | 'only' = false;
const timestampDeltaMS = 1000;

describe.only('Pipeline class', () => {
  let firestore: Firestore;
  let randomCol: CollectionReference;
  let beginDocCreation = 0;
  let endDocCreation = 0;

  async function testCollectionWithDocs(docs: {
    [id: string]: DocumentData;
  }): Promise<CollectionReference<DocumentData>> {
    beginDocCreation = new Date().valueOf();
    for (const id in docs) {
      const ref = randomCol.doc(id);
      await ref.set(docs[id]);
    }
    endDocCreation = new Date().valueOf();
    return randomCol;
  }

  function expectResults(result: PipelineSnapshot, ...docs: string[]): void;
  function expectResults(
    result: PipelineSnapshot,
    ...data: DocumentData[]
  ): void;
  function expectResults(
    result: PipelineSnapshot,
    ...data: DocumentData[] | string[]
  ): void {
    if (data.length > 0) {
      if (typeof data[0] === 'string') {
        const actualIds = result.results.map(result => result.id);
        expect(actualIds).to.deep.equal(data);
      } else {
        result.results.forEach(r => {
          expect(r.data()).to.deep.equal(data.shift());
        });
      }
    } else {
      expect(result.results.length).to.equal(data.length);
    }
  }

  async function setupBookDocs(): Promise<CollectionReference<DocumentData>> {
    const bookDocs: {[id: string]: DocumentData} = {
      book1: {
        title: "The Hitchhiker's Guide to the Galaxy",
        author: 'Douglas Adams',
        genre: 'Science Fiction',
        published: 1979,
        rating: 4.2,
        tags: ['comedy', 'space', 'adventure'],
        awards: {
          hugo: true,
          nebula: false,
          others: {unknown: {year: 1980}},
        },
        nestedField: {'level.1': {'level.2': true}},
        embedding: FieldValue.vector([10, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      },
      book2: {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        genre: 'Romance',
        published: 1813,
        rating: 4.5,
        tags: ['classic', 'social commentary', 'love'],
        awards: {none: true},
        embedding: FieldValue.vector([1, 10, 1, 1, 1, 1, 1, 1, 1, 1]),
      },
      book3: {
        title: 'One Hundred Years of Solitude',
        author: 'Gabriel García Márquez',
        genre: 'Magical Realism',
        published: 1967,
        rating: 4.3,
        tags: ['family', 'history', 'fantasy'],
        awards: {nobel: true, nebula: false},
        embedding: FieldValue.vector([1, 1, 10, 1, 1, 1, 1, 1, 1, 1]),
      },
      book4: {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        published: 1954,
        rating: 4.7,
        tags: ['adventure', 'magic', 'epic'],
        awards: {hugo: false, nebula: false},
        remarks: null,
        cost: NaN,
        embedding: FieldValue.vector([1, 1, 1, 10, 1, 1, 1, 1, 1, 1]),
      },
      book5: {
        title: "The Handmaid's Tale",
        author: 'Margaret Atwood',
        genre: 'Dystopian',
        published: 1985,
        rating: 4.1,
        tags: ['feminism', 'totalitarianism', 'resistance'],
        awards: {'arthur c. clarke': true, 'booker prize': false},
        embedding: FieldValue.vector([1, 1, 1, 1, 10, 1, 1, 1, 1, 1]),
      },
      book6: {
        title: 'Crime and Punishment',
        author: 'Fyodor Dostoevsky',
        genre: 'Psychological Thriller',
        published: 1866,
        rating: 4.3,
        tags: ['philosophy', 'crime', 'redemption'],
        awards: {none: true},
        embedding: FieldValue.vector([1, 1, 1, 1, 1, 10, 1, 1, 1, 1]),
      },
      book7: {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Southern Gothic',
        published: 1960,
        rating: 4.2,
        tags: ['racism', 'injustice', 'coming-of-age'],
        awards: {pulitzer: true},
        embedding: FieldValue.vector([1, 1, 1, 1, 1, 1, 10, 1, 1, 1]),
      },
      book8: {
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian',
        published: 1949,
        rating: 4.2,
        tags: ['surveillance', 'totalitarianism', 'propaganda'],
        awards: {prometheus: true},
        embedding: FieldValue.vector([1, 1, 1, 1, 1, 1, 1, 10, 1, 1]),
      },
      book9: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Modernist',
        published: 1925,
        rating: 4.0,
        tags: ['wealth', 'american dream', 'love'],
        awards: {none: true},
        embedding: FieldValue.vector([1, 1, 1, 1, 1, 1, 1, 1, 10, 1]),
      },
      book10: {
        title: 'Dune',
        author: 'Frank Herbert',
        genre: 'Science Fiction',
        published: 1965,
        rating: 4.6,
        tags: ['politics', 'desert', 'ecology'],
        awards: {hugo: true, nebula: true},
        embedding: FieldValue.vector([1, 1, 1, 1, 1, 1, 1, 1, 1, 10]),
      },
    };
    return testCollectionWithDocs(bookDocs);
  }

  before(async () => {
    randomCol = getTestRoot();
    await setupBookDocs();
    firestore = randomCol.firestore;
  });

  afterEach(() => verifyInstance(firestore as unknown as InternalFirestore));

  describe('pipeline results', () => {
    it('empty snapshot as expected', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(0)
        .execute();
      expect(snapshot.results.length).to.equal(0);
    });

    it('full snapshot as expected', async () => {
      const ppl = firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(ascending('__name__'));
      const snapshot = await ppl.execute();
      expect(snapshot.results.length).to.equal(10);
      expect(snapshot.pipeline).to.equal(ppl);
      expectResults(
        snapshot,
        'book1',
        'book10',
        'book2',
        'book3',
        'book4',
        'book5',
        'book6',
        'book7',
        'book8',
        'book9'
      );
    });

    it('result equals works', async () => {
      const ppl = firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(ascending('title'))
        .limit(1);
      const snapshot1 = await ppl.execute();
      const snapshot2 = await ppl.execute();
      expect(snapshot1.results.length).to.equal(1);
      expect(snapshot2.results.length).to.equal(1);
      expect(snapshot1.results[0].isEqual(snapshot2.results[0])).to.be.true;
    });

    it('returns execution time', async () => {
      const start = new Date().valueOf();
      const pipeline = firestore.pipeline().collection(randomCol.path);

      const snapshot = await pipeline.execute();
      const end = new Date().valueOf();

      expect(snapshot.executionTime.toDate().valueOf()).to.approximately(
        (start + end) / 2,
        timestampDeltaMS
      );
    });

    it('returns execution time for an empty query', async () => {
      const start = new Date().valueOf();
      const pipeline = firestore.pipeline().collection(randomCol.path).limit(0);

      const snapshot = await pipeline.execute();
      const end = new Date().valueOf();

      expect(snapshot.results.length).to.equal(0);

      expect(snapshot.executionTime.toDate().valueOf()).to.approximately(
        (start + end) / 2,
        timestampDeltaMS
      );
    });

    it('returns create and update time for each document', async () => {
      const pipeline = firestore.pipeline().collection(randomCol.path);

      let snapshot = await pipeline.execute();
      expect(snapshot.results.length).to.equal(10);
      snapshot.results.forEach(doc => {
        expect(doc.createTime).to.not.be.null;
        expect(doc.updateTime).to.not.be.null;

        expect(doc.createTime!.toDate().valueOf()).to.approximately(
          (beginDocCreation + endDocCreation) / 2,
          timestampDeltaMS
        );
        expect(doc.updateTime!.toDate().valueOf()).to.approximately(
          (beginDocCreation + endDocCreation) / 2,
          timestampDeltaMS
        );
        expect(doc.createTime?.valueOf()).to.equal(doc.updateTime?.valueOf());
      });

      const wb = firestore.batch();
      snapshot.results.forEach(doc => {
        wb.update(doc.ref!, {newField: 'value'});
      });
      await wb.commit();

      snapshot = await pipeline.execute();
      expect(snapshot.results.length).to.equal(10);
      snapshot.results.forEach(doc => {
        expect(doc.createTime).to.not.be.null;
        expect(doc.updateTime).to.not.be.null;
        expect(doc.createTime!.toDate().valueOf()).to.be.lessThan(
          doc.updateTime!.toDate().valueOf()
        );
      });
    });

    it('returns execution time for an aggregate query', async () => {
      const start = new Date().valueOf();
      const pipeline = firestore
        .pipeline()
        .collection(randomCol.path)
        .aggregate(avg('rating').as('avgRating'));

      const snapshot = await pipeline.execute();
      const end = new Date().valueOf();

      expect(snapshot.results.length).to.equal(1);

      expect(snapshot.executionTime.toDate().valueOf()).to.approximately(
        (start + end) / 2,
        timestampDeltaMS
      );
    });

    it('returns undefined create and update time for each result in an aggregate query', async () => {
      const pipeline = firestore
        .pipeline()
        .collection(randomCol.path)
        .aggregate({
          accumulators: [avg('rating').as('avgRating')],
          groups: ['genre'],
        });

      const snapshot = await pipeline.execute();

      expect(snapshot.results.length).to.equal(8);

      snapshot.results.forEach(doc => {
        expect(doc.updateTime).to.be.undefined;
        expect(doc.createTime).to.be.undefined;
      });
    });
  });

  describe('pipeline sources', () => {
    it('supports CollectionReference as source', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol)
        .execute();
      expect(snapshot.results.length).to.equal(10);
    });

    it('supports list of documents as source', async () => {
      const collName = randomCol.id;

      const snapshot = await firestore
        .pipeline()
        .documents([
          `${collName}/book1`,
          randomCol.doc('book2'),
          randomCol.doc('book3').path,
        ])
        .execute();
      expect(snapshot.results.length).to.equal(3);
    });

    it('reject CollectionReference for another DB', async () => {
      const db2 = getTestDb({databaseId: 'notDefault', projectId: 'random'});

      expect(() => {
        firestore.pipeline().collection(db2.collection('foo'));
      }).to.throw(/Invalid CollectionReference/);

      await db2.terminate();
    });

    it('reject DocumentReference for another DB', async () => {
      const db2 = getTestDb({databaseId: 'notDefault', projectId: 'random'});

      expect(() => {
        firestore.pipeline().documents([db2.doc('foo/bar')]);
      }).to.throw(/Invalid DocumentReference/);

      await db2.terminate();
    });

    // Subcollections not currently supported in DBE
    itIf(testUnsupportedFeatures)(
      'supports collection group as source',
      async () => {
        const randomSubCollectionId = Math.random().toString(16).slice(2);
        const doc1 = await randomCol
          .doc('book1')
          .collection(randomSubCollectionId)
          .add({order: 1});
        const doc2 = await randomCol
          .doc('book2')
          .collection(randomSubCollectionId)
          .add({order: 2});
        const snapshot = await firestore
          .pipeline()
          .collectionGroup(randomSubCollectionId)
          .sort(ascending('order'))
          .execute();
        expectResults(snapshot, doc1.id, doc2.id);
      }
    );

    // subcollections not currently supported in dbe
    itIf(testUnsupportedFeatures)('supports database as source', async () => {
      const randomId = Math.random().toString(16).slice(2);
      const doc1 = await randomCol.doc('book1').collection('sub').add({
        order: 1,
        randomId,
      });
      const doc2 = await randomCol.doc('book2').collection('sub').add({
        order: 2,
        randomId,
      });
      const snapshot = await firestore
        .pipeline()
        .database()
        .where(eq('randomId', randomId))
        .sort(ascending('order'))
        .execute();
      expectResults(snapshot, doc1.id, doc2.id);
    });
  });

  describe('supported data types', () => {
    it('accepts and returns all data types', async () => {
      const refDate = new Date();
      const refTimestamp = Timestamp.now();
      const constants = [
        constant(1).as('number'),
        constant('a string').as('string'),
        constant(true).as('boolean'),
        constant(null).as('null'),
        constant(new GeoPoint(0.1, 0.2)).as('geoPoint'),
        constant(refTimestamp).as('timestamp'),
        constant(refDate).as('date'),
        constant(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 0])).as('bytes'),
        constant(firestore.doc('foo/bar')).as('documentReference'),
        constantVector(FieldValue.vector([1, 2, 3])).as('vectorValue'),
        constantVector([1, 2, 3]).as('vectorValue2'),
        map({
          number: 1,
          string: 'a string',
          boolean: true,
          null: null,
          geoPoint: new GeoPoint(0.1, 0.2),
          timestamp: refTimestamp,
          date: refDate,
          uint8Array: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 0]),
          documentReference: firestore.doc('foo/bar'),
          vectorValue: FieldValue.vector([1, 2, 3]),
          map: {
            number: 2,
            string: 'b string',
          },
          array: [1, 'c string'],
        }).as('map'),
        array([
          1,
          'a string',
          true,
          null,
          new GeoPoint(0.1, 0.2),
          refTimestamp,
          refDate,
          new Uint8Array([1, 2, 3, 4, 5, 6, 7, 0]),
          firestore.doc('foo/bar'),
          FieldValue.vector([1, 2, 3]),
          {
            number: 2,
            string: 'b string',
          },
        ]).as('array'),
      ];

      const snapshots = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(constants[0], ...constants.slice(1))
        .execute();

      expectResults(snapshots, {
        number: 1,
        string: 'a string',
        boolean: true,
        null: null,
        geoPoint: new GeoPoint(0.1, 0.2),
        timestamp: refTimestamp,
        date: Timestamp.fromDate(refDate),
        bytes: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 0]),
        documentReference: firestore.collection('foo').doc('bar'),
        vectorValue: FieldValue.vector([1, 2, 3]),
        vectorValue2: FieldValue.vector([1, 2, 3]),
        map: {
          number: 1,
          string: 'a string',
          boolean: true,
          null: null,
          geoPoint: new GeoPoint(0.1, 0.2),
          timestamp: refTimestamp,
          date: Timestamp.fromDate(refDate),
          uint8Array: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 0]),
          documentReference: firestore.collection('foo').doc('bar'),
          vectorValue: FieldValue.vector([1, 2, 3]),
          map: {
            number: 2,
            string: 'b string',
          },
          array: [1, 'c string'],
        },
        array: [
          1,
          'a string',
          true,
          null,
          new GeoPoint(0.1, 0.2),
          refTimestamp,
          Timestamp.fromDate(refDate),
          new Uint8Array([1, 2, 3, 4, 5, 6, 7, 0]),
          firestore.collection('foo').doc('bar'),
          FieldValue.vector([1, 2, 3]),
          {
            number: 2,
            string: 'b string',
          },
        ],
      });
    });

    it('throws on undefined in a map', async () => {
      try {
        await firestore
          .pipeline()
          .collection(randomCol.path)
          .limit(1)
          .select(
            map({
              number: 1,
              bad: undefined,
            }).as('foo')
          )
          .execute();
        expect.fail('The statement above was expected to throw.');
      } catch (e: any) {
        console.log(e.message);
        expect(e.message).to.contain(
          'Value for argument "value" is not a valid map value. Cannot use "undefined" as a Firestore value (found in field "bad").'
        );
      }
    });

    it('throws on undefined in an array', async () => {
      try {
        await firestore
          .pipeline()
          .collection(randomCol.path)
          .limit(1)
          .select(array([1, undefined]).as('foo'))
          .execute();
        expect.fail('The statement above was expected to throw.');
      } catch (e: any) {
        console.log(e.message);
        expect(e.message).to.contain(
          'Value for argument "value" is not a valid array value. Cannot use "undefined" as a Firestore value'
        );
      }
    });

    it('ignores undefined in a map if ignoreUndefinedProperties is true', async () => {
      const customFirestore = getTestDb({
        ignoreUndefinedProperties: true,
      });

      const snapshot = await customFirestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(
          map({
            number: 1,
            bad: undefined,
          }).as('foo')
        )
        .execute();

      const data = snapshot.results[0].data();
      expect(data).to.deep.equal({foo: {number: 1}});
      await customFirestore.terminate();
    });

    it('ignores undefined in an array if ignoreUndefinedProperties is true', async () => {
      const customFirestore = getTestDb({
        ignoreUndefinedProperties: true,
      });

      const snapshot = await customFirestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(array([1, undefined, 3]).as('foo'))
        .execute();

      const data = snapshot.results[0].data();
      expect(data).to.deep.equal({foo: [1, 3]});
      await customFirestore.terminate();
    });

    it('converts arrays and plain objects to functionValues if the customer intent is unspecified', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(
          'title',
          'author',
          'genre',
          'rating',
          'published',
          'tags',
          'awards'
        )
        .addFields(
          array([
            1,
            2,
            field('genre'),
            multiply('rating', 10),
            [field('title')],
            {
              published: field('published'),
            },
          ]).as('metadataArray'),
          map({
            genre: field('genre'),
            rating: multiply('rating', 10),
            nestedArray: [field('title')],
            nestedMap: {
              published: field('published'),
            },
          }).as('metadata')
        )
        .where(
          and(
            eq('metadataArray', [
              1,
              2,
              field('genre'),
              multiply('rating', 10),
              [field('title')],
              {
                published: field('published'),
              },
            ]),
            eq('metadata', {
              genre: field('genre'),
              rating: multiply('rating', 10),
              nestedArray: [field('title')],
              nestedMap: {
                published: field('published'),
              },
            })
          )
        )
        .execute();

      expect(snapshot.results.length).to.equal(1);

      expectResults(snapshot, {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        published: 1954,
        rating: 4.7,
        tags: ['adventure', 'magic', 'epic'],
        awards: {hugo: false, nebula: false},
        metadataArray: [
          1,
          2,
          'Fantasy',
          47,
          ['The Lord of the Rings'],
          {
            published: 1954,
          },
        ],
        metadata: {
          genre: 'Fantasy',
          rating: 47,
          nestedArray: ['The Lord of the Rings'],
          nestedMap: {
            published: 1954,
          },
        },
      });
    });
  });

  describe('stages', () => {
    describe('aggregate stage', () => {
      it('supports aggregate', async () => {
        let snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .aggregate(countAll().as('count'))
          .execute();
        expectResults(snapshot, {count: 10});

        snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(eq('genre', 'Science Fiction'))
          .aggregate(
            countAll().as('count'),
            avg('rating').as('avgRating'),
            maximum('rating').as('maxRating'),
            sum('rating').as('sumRating')
          )
          .execute();
        expectResults(snapshot, {
          count: 2,
          avgRating: 4.4,
          maxRating: 4.6,
          sumRating: 8.8,
        });
      });

      it('rejects groups without accumulators', async () => {
        expect(
          firestore
            .pipeline()
            .collection(randomCol.path)
            .where(lt('published', 1900))
            .aggregate({
              accumulators: [],
              groups: ['genre'],
            })
            .execute()
        ).to.be.rejected;
      });

      it('returns group and accumulate results', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(lt(field('published'), 1984))
          .aggregate({
            accumulators: [avg('rating').as('avgRating')],
            groups: ['genre'],
          })
          .where(gt('avgRating', 4.3))
          .sort(field('avgRating').descending())
          .execute();
        expectResults(
          snapshot,
          {avgRating: 4.7, genre: 'Fantasy'},
          {avgRating: 4.5, genre: 'Romance'},
          {avgRating: 4.4, genre: 'Science Fiction'}
        );
      });

      it('returns min, max, count, and countAll accumulations', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .aggregate(
            count('cost').as('booksWithCost'),
            countAll().as('count'),
            maximum('rating').as('maxRating'),
            minimum('published').as('minPublished')
          )
          .execute();
        expectResults(snapshot, {
          booksWithCost: 1,
          count: 10,
          maxRating: 4.7,
          minPublished: 1813,
        });
      });

      it('returns countif accumulation', async () => {
        let snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .aggregate(countIf(field('rating').gt(4.3)).as('count'))
          .execute();
        const expectedResults = {
          count: 3,
        };
        expectResults(snapshot, expectedResults);

        snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .aggregate(field('rating').gt(4.3).countIf().as('count'))
          .execute();
        expectResults(snapshot, expectedResults);
      });
    });

    describe('distinct stage', () => {
      it('returns distinct values as expected', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .distinct('genre', 'author')
          .sort(field('genre').ascending(), field('author').ascending())
          .execute();
        expectResults(
          snapshot,
          {genre: 'Dystopian', author: 'George Orwell'},
          {genre: 'Dystopian', author: 'Margaret Atwood'},
          {genre: 'Fantasy', author: 'J.R.R. Tolkien'},
          {genre: 'Magical Realism', author: 'Gabriel García Márquez'},
          {genre: 'Modernist', author: 'F. Scott Fitzgerald'},
          {genre: 'Psychological Thriller', author: 'Fyodor Dostoevsky'},
          {genre: 'Romance', author: 'Jane Austen'},
          {genre: 'Science Fiction', author: 'Douglas Adams'},
          {genre: 'Science Fiction', author: 'Frank Herbert'},
          {genre: 'Southern Gothic', author: 'Harper Lee'}
        );
      });
    });

    describe('select stage', () => {
      it('can select fields', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .select('title', 'author')
          .sort(field('author').ascending())
          .execute();
        expectResults(
          snapshot,
          {
            title: "The Hitchhiker's Guide to the Galaxy",
            author: 'Douglas Adams',
          },
          {title: 'The Great Gatsby', author: 'F. Scott Fitzgerald'},
          {title: 'Dune', author: 'Frank Herbert'},
          {title: 'Crime and Punishment', author: 'Fyodor Dostoevsky'},
          {
            title: 'One Hundred Years of Solitude',
            author: 'Gabriel García Márquez',
          },
          {title: '1984', author: 'George Orwell'},
          {title: 'To Kill a Mockingbird', author: 'Harper Lee'},
          {title: 'The Lord of the Rings', author: 'J.R.R. Tolkien'},
          {title: 'Pride and Prejudice', author: 'Jane Austen'},
          {title: "The Handmaid's Tale", author: 'Margaret Atwood'}
        );
      });
    });

    describe('addField stage', () => {
      it('can add fields', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .select('title', 'author')
          .addFields(constant('bar').as('foo'))
          .sort(field('author').ascending())
          .execute();
        expectResults(
          snapshot,
          {
            title: "The Hitchhiker's Guide to the Galaxy",
            author: 'Douglas Adams',
            foo: 'bar',
          },
          {
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            foo: 'bar',
          },
          {title: 'Dune', author: 'Frank Herbert', foo: 'bar'},
          {
            title: 'Crime and Punishment',
            author: 'Fyodor Dostoevsky',
            foo: 'bar',
          },
          {
            title: 'One Hundred Years of Solitude',
            author: 'Gabriel García Márquez',
            foo: 'bar',
          },
          {title: '1984', author: 'George Orwell', foo: 'bar'},
          {
            title: 'To Kill a Mockingbird',
            author: 'Harper Lee',
            foo: 'bar',
          },
          {
            title: 'The Lord of the Rings',
            author: 'J.R.R. Tolkien',
            foo: 'bar',
          },
          {title: 'Pride and Prejudice', author: 'Jane Austen', foo: 'bar'},
          {
            title: "The Handmaid's Tale",
            author: 'Margaret Atwood',
            foo: 'bar',
          }
        );
      });
    });

    describe('removeFields stage', () => {
      it('can remove fields', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .select('title', 'author')
          .sort(field('author').ascending())
          .removeFields(field('author'))
          .sort(field('author').ascending())
          .execute();
        expectResults(
          snapshot,
          {
            title: "The Hitchhiker's Guide to the Galaxy",
          },
          {
            title: 'The Great Gatsby',
          },
          {title: 'Dune'},
          {
            title: 'Crime and Punishment',
          },
          {
            title: 'One Hundred Years of Solitude',
          },
          {title: '1984'},
          {
            title: 'To Kill a Mockingbird',
          },
          {
            title: 'The Lord of the Rings',
          },
          {title: 'Pride and Prejudice'},
          {
            title: "The Handmaid's Tale",
          }
        );
      });
    });

    describe('where stage', () => {
      it('where with and (2 conditions)', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(
            and(
              gt('rating', 4.5),
              eqAny('genre', ['Science Fiction', 'Romance', 'Fantasy'])
            )
          )
          .execute();
        expectResults(snapshot, 'book10', 'book4');
      });
      it('where with and (3 conditions)', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(
            and(
              gt('rating', 4.5),
              eqAny('genre', ['Science Fiction', 'Romance', 'Fantasy']),
              lt('published', 1965)
            )
          )
          .execute();
        expectResults(snapshot, 'book4');
      });
      it('where with or', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(
            or(
              eq('genre', 'Romance'),
              eq('genre', 'Dystopian'),
              eq('genre', 'Fantasy')
            )
          )
          .sort(ascending('title'))
          .select('title')
          .execute();
        expectResults(
          snapshot,
          {title: '1984'},
          {title: 'Pride and Prejudice'},
          {title: "The Handmaid's Tale"},
          {title: 'The Lord of the Rings'}
        );
      });

      it('where with xor', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(
            xor(
              eq('genre', 'Romance'),
              eq('genre', 'Dystopian'),
              eq('genre', 'Fantasy'),
              eq('published', 1949)
            )
          )
          .select('title')
          .execute();
        expectResults(
          snapshot,
          {title: 'Pride and Prejudice'},
          {title: 'The Lord of the Rings'},
          {title: "The Handmaid's Tale"}
        );
      });
    });

    describe('sort, offset, and limit stages', () => {
      it('supports sort, offset, and limits', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .sort(field('author').ascending())
          .offset(5)
          .limit(3)
          .select('title', 'author')
          .execute();
        expectResults(
          snapshot,
          {title: '1984', author: 'George Orwell'},
          {title: 'To Kill a Mockingbird', author: 'Harper Lee'},
          {title: 'The Lord of the Rings', author: 'J.R.R. Tolkien'}
        );
      });
    });

    describe('generic stage', () => {
      it('can select fields', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .genericStage('select', [
            {
              title: field('title'),
              metadata: {
                author: field('author'),
              },
            },
          ])
          .sort(field('author').ascending())
          .limit(1)
          .execute();
        expectResults(snapshot, {
          metadata: {
            author: 'Frank Herbert',
          },
          title: 'Dune',
        });
      });

      it('can add fields', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .sort(field('author').ascending())
          .limit(1)
          .select('title', 'author')
          .genericStage('add_fields', [
            {
              display: strConcat('title', ' - ', field('author')),
            },
          ])
          .execute();
        expectResults(snapshot, {
          title: "The Hitchhiker's Guide to the Galaxy",
          author: 'Douglas Adams',
          display: "The Hitchhiker's Guide to the Galaxy - Douglas Adams",
        });
      });

      it('can filter with where', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .select('title', 'author')
          .genericStage('where', [field('author').eq('Douglas Adams')])
          .execute();
        expectResults(snapshot, {
          title: "The Hitchhiker's Guide to the Galaxy",
          author: 'Douglas Adams',
        });
      });

      it('can limit, offset, and sort', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .select('title', 'author')
          .genericStage('sort', [
            {
              direction: 'ascending',
              expression: field('author'),
            },
          ])
          .genericStage('offset', [3])
          .genericStage('limit', [1])
          .execute();
        expectResults(snapshot, {
          author: 'Fyodor Dostoevsky',
          title: 'Crime and Punishment',
        });
      });

      it('can perform aggregate query', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .select('title', 'author', 'rating')
          .genericStage('aggregate', [
            {averageRating: field('rating').avg()},
            {},
          ])
          .execute();
        expectResults(snapshot, {
          averageRating: 4.3100000000000005,
        });
      });

      it('can perform distinct query', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .select('title', 'author', 'rating')
          .genericStage('distinct', [{rating: field('rating')}])
          .sort(field('rating').descending())
          .execute();
        expectResults(
          snapshot,
          {
            rating: 4.7,
          },
          {
            rating: 4.6,
          },
          {
            rating: 4.5,
          },
          {
            rating: 4.3,
          },
          {
            rating: 4.2,
          },
          {
            rating: 4.1,
          },
          {
            rating: 4.0,
          }
        );
      });
    });

    describe('replaceWith stage', () => {
      it('run pipeline with replaceWith field name', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(eq('title', "The Hitchhiker's Guide to the Galaxy"))
          .replaceWith('awards')
          .execute();
        expectResults(snapshot, {
          hugo: true,
          nebula: false,
          others: {unknown: {year: 1980}},
        });
      });

      it('run pipeline with replaceWith Expr result', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(eq('title', "The Hitchhiker's Guide to the Galaxy"))
          .replaceWith(
            map({
              foo: 'bar',
              baz: {
                title: field('title'),
              },
            })
          )
          .execute();
        expectResults(snapshot, {
          foo: 'bar',
          baz: {title: "The Hitchhiker's Guide to the Galaxy"},
        });
      });
    });

    describe('sample stage', () => {
      it('run pipeline with sample limit of 3', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .sample(3)
          .execute();
        expect(snapshot.results.length).to.equal(3);
      });

      it('run pipeline with sample limit of {documents: 3}', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .sample({documents: 3})
          .execute();
        expect(snapshot.results.length).to.equal(3);
      });

      it('run pipeline with sample limit of {percentage: 0.6}', async () => {
        let avgSize = 0;
        const numIterations = 30;
        for (let i = 0; i < numIterations; i++) {
          const snapshot = await firestore
            .pipeline()
            .collection(randomCol.path)
            .sample({percentage: 0.6})
            .execute();

          avgSize += snapshot.results.length;
        }
        avgSize /= numIterations;
        expect(avgSize).to.be.closeTo(6, 1);
      });
    });

    describe('union stage', () => {
      it('run pipeline with union', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .union(firestore.pipeline().collection(randomCol.path))
          .sort(field(FieldPath.documentId()).ascending())
          .execute();
        expectResults(
          snapshot,
          'book1',
          'book1',
          'book10',
          'book10',
          'book2',
          'book2',
          'book3',
          'book3',
          'book4',
          'book4',
          'book5',
          'book5',
          'book6',
          'book6',
          'book7',
          'book7',
          'book8',
          'book8',
          'book9',
          'book9'
        );
      });
    });

    describe('unnest stage', () => {
      it('run pipeline with unnest', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(eq('title', "The Hitchhiker's Guide to the Galaxy"))
          .unnest(field('tags').as('tag'))
          .select(
            'title',
            'author',
            'genre',
            'published',
            'rating',
            'tags',
            'tag',
            'awards',
            'nestedField'
          )
          .execute();
        expectResults(
          snapshot,
          {
            title: "The Hitchhiker's Guide to the Galaxy",
            author: 'Douglas Adams',
            genre: 'Science Fiction',
            published: 1979,
            rating: 4.2,
            tags: ['comedy', 'space', 'adventure'],
            tag: 'comedy',
            awards: {
              hugo: true,
              nebula: false,
              others: {unknown: {year: 1980}},
            },
            nestedField: {'level.1': {'level.2': true}},
          },
          {
            title: "The Hitchhiker's Guide to the Galaxy",
            author: 'Douglas Adams',
            genre: 'Science Fiction',
            published: 1979,
            rating: 4.2,
            tags: ['comedy', 'space', 'adventure'],
            tag: 'space',
            awards: {
              hugo: true,
              nebula: false,
              others: {unknown: {year: 1980}},
            },
            nestedField: {'level.1': {'level.2': true}},
          },
          {
            title: "The Hitchhiker's Guide to the Galaxy",
            author: 'Douglas Adams',
            genre: 'Science Fiction',
            published: 1979,
            rating: 4.2,
            tags: ['comedy', 'space', 'adventure'],
            tag: 'adventure',
            awards: {
              hugo: true,
              nebula: false,
              others: {unknown: {year: 1980}},
            },
            nestedField: {'level.1': {'level.2': true}},
          }
        );
      });
      it('unnest an expr', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(eq('title', "The Hitchhiker's Guide to the Galaxy"))
          .unnest(array([1, 2, 3]).as('copy'))
          .select(
            'title',
            'author',
            'genre',
            'published',
            'rating',
            'tags',
            'copy',
            'awards',
            'nestedField'
          )
          .execute();
        expectResults(
          snapshot,
          {
            title: "The Hitchhiker's Guide to the Galaxy",
            author: 'Douglas Adams',
            genre: 'Science Fiction',
            published: 1979,
            rating: 4.2,
            tags: ['comedy', 'space', 'adventure'],
            copy: 1,
            awards: {
              hugo: true,
              nebula: false,
              others: {unknown: {year: 1980}},
            },
            nestedField: {'level.1': {'level.2': true}},
          },
          {
            title: "The Hitchhiker's Guide to the Galaxy",
            author: 'Douglas Adams',
            genre: 'Science Fiction',
            published: 1979,
            rating: 4.2,
            tags: ['comedy', 'space', 'adventure'],
            copy: 2,
            awards: {
              hugo: true,
              nebula: false,
              others: {unknown: {year: 1980}},
            },
            nestedField: {'level.1': {'level.2': true}},
          },
          {
            title: "The Hitchhiker's Guide to the Galaxy",
            author: 'Douglas Adams',
            genre: 'Science Fiction',
            published: 1979,
            rating: 4.2,
            tags: ['comedy', 'space', 'adventure'],
            copy: 3,
            awards: {
              hugo: true,
              nebula: false,
              others: {unknown: {year: 1980}},
            },
            nestedField: {'level.1': {'level.2': true}},
          }
        );
      });
    });

    describe('findNearest stage', () => {
      it('run pipeline with findNearest', async () => {
        const measures: Array<FindNearestOptions['distanceMeasure']> = [
          'euclidean',
          'dot_product',
          'cosine',
        ];
        for (const measure of measures) {
          const snapshot = await firestore
            .pipeline()
            .collection(randomCol)
            .findNearest({
              field: 'embedding',
              vectorValue: FieldValue.vector([10, 1, 3, 1, 2, 1, 1, 1, 1, 1]),
              limit: 3,
              distanceMeasure: measure,
            })
            .select('title')
            .execute();
          expectResults(
            snapshot,
            {
              title: "The Hitchhiker's Guide to the Galaxy",
            },
            {
              title: 'One Hundred Years of Solitude',
            },
            {
              title: "The Handmaid's Tale",
            }
          );
        }
      });

      it('optionally returns the computed distance', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol)
          .findNearest({
            field: 'embedding',
            vectorValue: FieldValue.vector([10, 1, 2, 1, 1, 1, 1, 1, 1, 1]),
            limit: 2,
            distanceMeasure: 'euclidean',
            distanceField: 'computedDistance',
          })
          .select('title', 'computedDistance')
          .execute();
        expectResults(
          snapshot,
          {
            title: "The Hitchhiker's Guide to the Galaxy",
            computedDistance: 1,
          },
          {
            title: 'One Hundred Years of Solitude',
            computedDistance: 12.041594578792296,
          }
        );
      });
    });
  });

  describe('function expressions', () => {
    it('logical max works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(
          'title',
          logicalMaximum(constant(1960), field('published'), 1961).as(
            'published-safe'
          )
        )
        .sort(field('title').ascending())
        .limit(3)
        .execute();
      expectResults(
        snapshot,
        {title: '1984', 'published-safe': 1961},
        {title: 'Crime and Punishment', 'published-safe': 1961},
        {title: 'Dune', 'published-safe': 1965}
      );
    });

    it('logical min works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(
          'title',
          logicalMinimum(constant(1960), field('published'), 1961).as(
            'published-safe'
          )
        )
        .sort(field('title').ascending())
        .limit(3)
        .execute();
      expectResults(
        snapshot,
        {title: '1984', 'published-safe': 1949},
        {title: 'Crime and Punishment', 'published-safe': 1866},
        {title: 'Dune', 'published-safe': 1960}
      );
    });

    it('cond works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(
          'title',
          cond(
            lt(field('published'), 1960),
            constant(1960),
            field('published')
          ).as('published-safe')
        )
        .sort(field('title').ascending())
        .limit(3)
        .execute();
      expectResults(
        snapshot,
        {title: '1984', 'published-safe': 1960},
        {title: 'Crime and Punishment', 'published-safe': 1960},
        {title: 'Dune', 'published-safe': 1965}
      );
    });

    it('eqAny works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(eqAny('published', [1979, 1999, 1967]))
        .sort(descending('title'))
        .select('title')
        .execute();
      expectResults(
        snapshot,
        {title: "The Hitchhiker's Guide to the Galaxy"},
        {title: 'One Hundred Years of Solitude'}
      );
    });

    it('notEqAny works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(
          notEqAny(
            'published',
            [1965, 1925, 1949, 1960, 1866, 1985, 1954, 1967, 1979]
          )
        )
        .select('title')
        .execute();
      expectResults(snapshot, {title: 'Pride and Prejudice'});
    });

    it('arrayContains works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(arrayContains('tags', 'comedy'))
        .select('title')
        .execute();
      expectResults(snapshot, {
        title: "The Hitchhiker's Guide to the Galaxy",
      });
    });

    it('arrayContainsAny works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(arrayContainsAny('tags', ['comedy', 'classic']))
        .sort(descending('title'))
        .select('title')
        .execute();
      expectResults(
        snapshot,
        {title: "The Hitchhiker's Guide to the Galaxy"},
        {title: 'Pride and Prejudice'}
      );
    });

    it('arrayContainsAll works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(arrayContainsAll('tags', ['adventure', 'magic']))
        .select('title')
        .execute();
      expectResults(snapshot, {title: 'The Lord of the Rings'});
    });

    it('arrayLength works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(arrayLength('tags').as('tagsCount'))
        .where(eq('tagsCount', 3))
        .execute();
      expect(snapshot.results.length).to.equal(10);
    });

    it('testStrConcat', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(ascending('author'))
        .select(field('author').strConcat(' - ', field('title')).as('bookInfo'))
        .limit(1)
        .execute();
      expectResults(snapshot, {
        bookInfo: "Douglas Adams - The Hitchhiker's Guide to the Galaxy",
      });
    });

    it('testStartsWith', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(startsWith('title', 'The'))
        .select('title')
        .sort(field('title').ascending())
        .execute();
      expectResults(
        snapshot,
        {title: 'The Great Gatsby'},
        {title: "The Handmaid's Tale"},
        {title: "The Hitchhiker's Guide to the Galaxy"},
        {title: 'The Lord of the Rings'}
      );
    });

    it('testEndsWith', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(endsWith('title', 'y'))
        .select('title')
        .sort(field('title').descending())
        .execute();
      expectResults(
        snapshot,
        {title: "The Hitchhiker's Guide to the Galaxy"},
        {title: 'The Great Gatsby'}
      );
    });

    it('testStrContains', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(strContains('title', "'s"))
        .select('title')
        .sort(field('title').ascending())
        .execute();
      expectResults(
        snapshot,
        {title: "The Handmaid's Tale"},
        {title: "The Hitchhiker's Guide to the Galaxy"}
      );
    });

    it('testLength', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(charLength('title').as('titleLength'), field('title'))
        .where(gt('titleLength', 20))
        .sort(field('title').ascending())
        .execute();

      expectResults(
        snapshot,

        {
          titleLength: 29,
          title: 'One Hundred Years of Solitude',
        },
        {
          titleLength: 36,
          title: "The Hitchhiker's Guide to the Galaxy",
        },
        {
          titleLength: 21,
          title: 'The Lord of the Rings',
        },
        {
          titleLength: 21,
          title: 'To Kill a Mockingbird',
        }
      );
    });

    it('testLike', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(like('title', '%Guide%'))
        .select('title')
        .execute();
      expectResults(snapshot, {
        title: "The Hitchhiker's Guide to the Galaxy",
      });
    });

    it('testRegexContains', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(regexContains('title', '(?i)(the|of)'))
        .execute();
      expect(snapshot.results.length).to.equal(5);
    });

    it('testRegexMatches', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(regexMatch('title', '.*(?i)(the|of).*'))
        .execute();
      expect(snapshot.results.length).to.equal(5);
    });

    it('testArithmeticOperations', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(eq('title', 'To Kill a Mockingbird'))
        .select(
          add(field('rating'), 1).as('ratingPlusOne'),
          subtract(field('published'), 1900).as('yearsSince1900'),
          field('rating').multiply(10).as('ratingTimesTen'),
          divide('rating', 2).as('ratingDividedByTwo'),
          multiply('rating', 10, 2).as('ratingTimes20'),
          add('rating', 1, 2).as('ratingPlus3'),
          mod('rating', 2).as('ratingMod2')
        )
        .limit(1)
        .execute();
      expectResults(snapshot, {
        ratingPlusOne: 5.2,
        yearsSince1900: 60,
        ratingTimesTen: 42,
        ratingDividedByTwo: 2.1,
        ratingTimes20: 84,
        ratingPlus3: 7.2,
        ratingMod2: 0.20000000000000018,
      });
    });

    it('testComparisonOperators', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(
          and(
            gt('rating', 4.2),
            lte(field('rating'), 4.5),
            neq('genre', 'Science Fiction')
          )
        )
        .select('rating', 'title')
        .sort(field('title').ascending())
        .execute();
      expectResults(
        snapshot,
        {rating: 4.3, title: 'Crime and Punishment'},
        {
          rating: 4.3,
          title: 'One Hundred Years of Solitude',
        },
        {rating: 4.5, title: 'Pride and Prejudice'}
      );
    });

    it('testLogicalOperators', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(
          or(
            and(gt('rating', 4.5), eq('genre', 'Science Fiction')),
            lt('published', 1900)
          )
        )
        .select('title')
        .sort(field('title').ascending())
        .execute();
      expectResults(
        snapshot,
        {title: 'Crime and Punishment'},
        {title: 'Dune'},
        {title: 'Pride and Prejudice'}
      );
    });

    it('testChecks', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(
          isNull('rating').as('ratingIsNull'),
          isNan('rating').as('ratingIsNaN'),
          isError(arrayOffset('title', 0)).as('isError'),
          ifError(arrayOffset('title', 0), constant('was error')).as('ifError'),
          isAbsent('foo').as('isAbsent'),
          isNotNull('title').as('titleIsNotNull'),
          isNotNan('cost').as('costIsNotNan'),
          exists('fooBarBaz').as('fooBarBazExists'),
          field('title').exists().as('titleExists')
        )
        .execute();
      expectResults(snapshot, {
        ratingIsNull: false,
        ratingIsNaN: false,
        isError: true,
        ifError: 'was error',
        isAbsent: true,
        titleIsNotNull: true,
        costIsNotNan: false,
        fooBarBazExists: false,
        titleExists: true,
      });

      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(
          field('rating').isNull().as('ratingIsNull'),
          field('rating').isNan().as('ratingIsNaN'),
          arrayOffset('title', 0).isError().as('isError'),
          arrayOffset('title', 0).ifError(constant('was error')).as('ifError'),
          field('foo').isAbsent().as('isAbsent'),
          field('title').isNotNull().as('titleIsNotNull'),
          field('cost').isNotNan().as('costIsNotNan')
        )
        .execute();
      expectResults(snapshot, {
        ratingIsNull: false,
        ratingIsNaN: false,
        isError: true,
        ifError: 'was error',
        isAbsent: true,
        titleIsNotNull: true,
        costIsNotNan: false,
      });
    });

    it('testMapGet', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('published').descending())
        .select(
          field('awards').mapGet('hugo').as('hugoAward'),
          field('awards').mapGet('others').as('others'),
          field('title')
        )
        .where(eq('hugoAward', true))
        .execute();
      expectResults(
        snapshot,
        {
          hugoAward: true,
          title: "The Hitchhiker's Guide to the Galaxy",
          others: {unknown: {year: 1980}},
        },
        {hugoAward: true, title: 'Dune', others: null}
      );
    });

    it('testDistanceFunctions', async () => {
      const sourceVector = [0.1, 0.1];
      const targetVector = [0.5, 0.8];
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(
          cosineDistance(constantVector(sourceVector), targetVector).as(
            'cosineDistance'
          ),
          dotProduct(constantVector(sourceVector), targetVector).as(
            'dotProductDistance'
          ),
          euclideanDistance(constantVector(sourceVector), targetVector).as(
            'euclideanDistance'
          )
        )
        .limit(1)
        .execute();

      expectResults(snapshot, {
        cosineDistance: 0.02560880430538015,
        dotProductDistance: 0.13,
        euclideanDistance: 0.806225774829855,
      });

      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(
          constantVector(sourceVector)
            .cosineDistance(targetVector)
            .as('cosineDistance'),
          constantVector(sourceVector)
            .dotProduct(targetVector)
            .as('dotProductDistance'),
          constantVector(sourceVector)
            .euclideanDistance(targetVector)
            .as('euclideanDistance')
        )
        .limit(1)
        .execute();

      expectResults(snapshot, {
        cosineDistance: 0.02560880430538015,
        dotProductDistance: 0.13,
        euclideanDistance: 0.806225774829855,
      });
    });

    it('testVectorLength', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(vectorLength(constantVector([1, 2, 3])).as('vectorLength'))
        .execute();
      expectResults(snapshot, {
        vectorLength: 3,
      });
    });

    it('testNestedFields', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(eq('awards.hugo', true))
        .sort(descending('title'))
        .select('title', 'awards.hugo')
        .execute();
      expectResults(
        snapshot,
        {
          title: "The Hitchhiker's Guide to the Galaxy",
          'awards.hugo': true,
        },
        {title: 'Dune', 'awards.hugo': true}
      );
    });

    it('test mapGet with field name including . notation', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(eq('awards.hugo', true))
        .select(
          'title',
          field('nestedField.level.1'),
          mapGet('nestedField', 'level.1').mapGet('level.2').as('nested')
        )
        .sort(descending('title'))
        .execute();
      expectResults(
        snapshot,
        {
          title: "The Hitchhiker's Guide to the Galaxy",
          'nestedField.level.`1`': null,
          nested: true,
        },
        {title: 'Dune', 'nestedField.level.`1`': null, nested: null}
      );
    });

    describe('genericFunction', () => {
      it('add selectable', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .sort(descending('rating'))
          .limit(1)
          .select(
            new FunctionExpr('add', [field('rating'), constant(1)]).as('rating')
          )
          .execute();
        expectResults(snapshot, {
          rating: 5.7,
        });
      });

      it('and (variadic) selectable', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(
            new BooleanExpr('and', [
              field('rating').gt(0),
              field('title').charLength().lt(5),
              field('tags').arrayContains('propaganda'),
            ])
          )
          .select('title')
          .execute();
        expectResults(snapshot, {
          title: '1984',
        });
      });

      it('array contains any', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .where(
            new BooleanExpr('array_contains_any', [
              field('tags'),
              array(['politics']),
            ])
          )
          .select('title')
          .execute();
        expectResults(snapshot, {
          title: 'Dune',
        });
      });

      it('countif aggregate', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .aggregate(
            new AggregateFunction('count_if', [field('rating').gte(4.5)]).as(
              'countOfBest'
            )
          )
          .execute();
        expectResults(snapshot, {
          countOfBest: 3,
        });
      });

      it('sort by char_len', async () => {
        const snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .sort(
            new FunctionExpr('char_length', [field('title')]).ascending(),
            descending('__name__')
          )
          .limit(3)
          .select('title')
          .execute();
        expectResults(
          snapshot,
          {
            title: '1984',
          },
          {
            title: 'Dune',
          },
          {
            title: 'The Great Gatsby',
          }
        );
      });
    });

    itIf(testUnsupportedFeatures)('testReplaceFirst', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(eq('title', 'The Lord of the Rings'))
        .limit(1)
        .select(replaceFirst('title', 'o', '0').as('newName'))
        .execute();
      expectResults(snapshot, {newName: 'The L0rd of the Rings'});
    });

    itIf(testUnsupportedFeatures)('testReplaceAll', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(eq('title', 'The Lord of the Rings'))
        .limit(1)
        .select(replaceAll('title', 'o', '0').as('newName'))
        .execute();
      expectResults(snapshot, {newName: 'The L0rd 0f the Rings'});
    });

    it('supports Rand', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(10)
        .select(rand().as('result'))
        .execute();
      expect(snapshot.results.length).to.equal(10);
      snapshot.results.forEach((d: PipelineResult) => {
        expect(d.get('result')).to.be.lt(1);
        expect(d.get('result')).to.be.gte(0);
      });
    });

    it('supports array', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(array([1, 2, 3, 4]).as('metadata'))
        .execute();
      expect(snapshot.results.length).to.equal(1);
      expectResults(snapshot, {
        metadata: [1, 2, 3, 4],
      });
    });

    it('evaluates expression in array', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(
          array([1, 2, field('genre'), multiply('rating', 10)]).as('metadata')
        )
        .execute();
      expect(snapshot.results.length).to.equal(1);
      expectResults(snapshot, {
        metadata: [1, 2, 'Fantasy', 47],
      });
    });

    it('supports arrayOffset', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(3)
        .select(arrayOffset('tags', 0).as('firstTag'))
        .execute();
      const expectedResults = [
        {
          firstTag: 'adventure',
        },
        {
          firstTag: 'politics',
        },
        {
          firstTag: 'classic',
        },
      ];
      expectResults(snapshot, ...expectedResults);

      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(3)
        .select(field('tags').arrayOffset(0).as('firstTag'))
        .execute();
      expectResults(snapshot, ...expectedResults);
    });

    it('supports map', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(
          map({
            foo: 'bar',
          }).as('metadata')
        )
        .execute();

      expect(snapshot.results.length).to.equal(1);
      expectResults(snapshot, {
        metadata: {
          foo: 'bar',
        },
      });
    });

    it('evaluates expression in map', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(
          map({
            genre: field('genre'),
            rating: field('rating').multiply(10),
          }).as('metadata')
        )
        .execute();

      expect(snapshot.results.length).to.equal(1);
      expectResults(snapshot, {
        metadata: {
          genre: 'Fantasy',
          rating: 47,
        },
      });
    });

    it('supports mapRemove', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(mapRemove('awards', 'hugo').as('awards'))
        .execute();
      expectResults(snapshot, {
        awards: {nebula: false},
      });
      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(field('awards').mapRemove('hugo').as('awards'))
        .execute();
      expectResults(snapshot, {
        awards: {nebula: false},
      });
    });

    it('supports mapMerge', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(mapMerge('awards', {fakeAward: true}).as('awards'))
        .execute();
      expectResults(snapshot, {
        awards: {nebula: false, hugo: false, fakeAward: true},
      });
      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(field('awards').mapMerge({fakeAward: true}).as('awards'))
        .execute();
      expectResults(snapshot, {
        awards: {nebula: false, hugo: false, fakeAward: true},
      });
    });

    it('supports timestamp conversions', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(
          unixSecondsToTimestamp(constant(1741380235)).as(
            'unixSecondsToTimestamp'
          ),
          unixMillisToTimestamp(constant(1741380235123)).as(
            'unixMillisToTimestamp'
          ),
          unixMicrosToTimestamp(constant(1741380235123456)).as(
            'unixMicrosToTimestamp'
          ),
          timestampToUnixSeconds(
            constant(new Timestamp(1741380235, 123456789))
          ).as('timestampToUnixSeconds'),
          timestampToUnixMicros(
            constant(new Timestamp(1741380235, 123456789))
          ).as('timestampToUnixMicros'),
          timestampToUnixMillis(
            constant(new Timestamp(1741380235, 123456789))
          ).as('timestampToUnixMillis')
        )
        .execute();
      expectResults(snapshot, {
        unixMicrosToTimestamp: new Timestamp(1741380235, 123456000),
        unixMillisToTimestamp: new Timestamp(1741380235, 123000000),
        unixSecondsToTimestamp: new Timestamp(1741380235, 0),
        timestampToUnixSeconds: 1741380235,
        timestampToUnixMicros: 1741380235123456,
        timestampToUnixMillis: 1741380235123,
      });
    });

    it('supports timestamp math', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(constant(new Timestamp(1741380235, 0)).as('timestamp'))
        .select(
          timestampAdd('timestamp', 'day', 10).as('plus10days'),
          timestampAdd('timestamp', 'hour', 10).as('plus10hours'),
          timestampAdd('timestamp', 'minute', 10).as('plus10minutes'),
          timestampAdd('timestamp', 'second', 10).as('plus10seconds'),
          timestampAdd('timestamp', 'microsecond', 10).as('plus10micros'),
          timestampAdd('timestamp', 'millisecond', 10).as('plus10millis'),
          timestampSub('timestamp', 'day', 10).as('minus10days'),
          timestampSub('timestamp', 'hour', 10).as('minus10hours'),
          timestampSub('timestamp', 'minute', 10).as('minus10minutes'),
          timestampSub('timestamp', 'second', 10).as('minus10seconds'),
          timestampSub('timestamp', 'microsecond', 10).as('minus10micros'),
          timestampSub('timestamp', 'millisecond', 10).as('minus10millis')
        )
        .execute();
      expectResults(snapshot, {
        plus10days: new Timestamp(1742244235, 0),
        plus10hours: new Timestamp(1741416235, 0),
        plus10minutes: new Timestamp(1741380835, 0),
        plus10seconds: new Timestamp(1741380245, 0),
        plus10micros: new Timestamp(1741380235, 10000),
        plus10millis: new Timestamp(1741380235, 10000000),
        minus10days: new Timestamp(1740516235, 0),
        minus10hours: new Timestamp(1741344235, 0),
        minus10minutes: new Timestamp(1741379635, 0),
        minus10seconds: new Timestamp(1741380225, 0),
        minus10micros: new Timestamp(1741380234, 999990000),
        minus10millis: new Timestamp(1741380234, 990000000),
      });
    });

    it('supports byteLength', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol)
        .limit(1)
        .select(constant(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 0])).as('bytes'))
        .select(byteLength('bytes').as('byteLength'))
        .execute();

      expectResults(snapshot, {
        byteLength: 8,
      });
    });

    it('supports not', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol)
        .limit(1)
        .select(constant(true).as('trueField'))
        .select('trueField', not(eq('trueField', true)).as('falseField'))
        .execute();

      expectResults(snapshot, {
        trueField: true,
        falseField: false,
      });
    });
  });

  describe('not yet implemented in backend', () => {
    itIf(testUnsupportedFeatures)('supports Bit_and', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(bitAnd(constant(5), 12).as('result'))
        .execute();
      expectResults(snapshot, {
        result: 4,
      });
    });

    itIf(testUnsupportedFeatures)('supports Bit_and', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(constant(5).bitAnd(12).as('result'))
        .execute();
      expectResults(snapshot, {
        result: 4,
      });
    });

    itIf(testUnsupportedFeatures)('supports Bit_or', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(bitOr(constant(5), 12).as('result'))
        .execute();
      expectResults(snapshot, {
        result: 13,
      });
      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(constant(5).bitOr(12).as('result'))
        .execute();
      expectResults(snapshot, {
        result: 13,
      });
    });

    itIf(testUnsupportedFeatures)('supports Bit_xor', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(bitXor(constant(5), 12).as('result'))
        .execute();
      expectResults(snapshot, {
        result: 9,
      });
      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(constant(5).bitXor(12).as('result'))
        .execute();
      expectResults(snapshot, {
        result: 9,
      });
    });

    itIf(testUnsupportedFeatures)('supports Bit_not', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(bitNot(constant(Uint8Array.of(0xfd))).as('result'))
        .execute();
      expectResults(snapshot, {
        result: Uint8Array.of(0x02),
      });
      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(constant(Uint8Array.of(0xfd)).bitNot().as('result'))
        .execute();
      expectResults(snapshot, {
        result: Uint8Array.of(0x02),
      });
    });

    itIf(testUnsupportedFeatures)('supports Bit_left_shift', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(bitLeftShift(constant(Uint8Array.of(0x02)), 2).as('result'))
        .execute();
      expectResults(snapshot, {
        result: Uint8Array.of(0x04),
      });
      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(constant(Uint8Array.of(0x02)).bitLeftShift(2).as('result'))
        .execute();
      expectResults(snapshot, {
        result: Uint8Array.of(0x04),
      });
    });

    itIf(testUnsupportedFeatures)('supports Bit_right_shift', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(bitRightShift(constant(Uint8Array.of(0x02)), 2).as('result'))
        .execute();
      expectResults(snapshot, {
        result: Uint8Array.of(0x01),
      });
      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .limit(1)
        .select(constant(Uint8Array.of(0x02)).bitRightShift(2).as('result'))
        .execute();
      expectResults(snapshot, {
        result: Uint8Array.of(0x01),
      });
    });

    itIf(testUnsupportedFeatures)('supports Document_id', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(documentId(field('__path__')).as('docId'))
        .execute();
      expectResults(snapshot, {
        docId: 'book4',
      });
      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(field('__path__').documentId().as('docId'))
        .execute();
      expectResults(snapshot, {
        docId: 'book4',
      });
    });

    itIf(testUnsupportedFeatures)('supports Substr', async () => {
      let snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(substr('title', 9, 2).as('of'))
        .execute();
      expectResults(snapshot, {
        of: 'of',
      });
      snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .sort(field('rating').descending())
        .limit(1)
        .select(field('title').substr(9, 2).as('of'))
        .execute();
      expectResults(snapshot, {
        of: 'of',
      });
    });

    itIf(testUnsupportedFeatures)(
      'supports Substr without length',
      async () => {
        let snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .sort(field('rating').descending())
          .limit(1)
          .select(substr('title', 9).as('of'))
          .execute();
        expectResults(snapshot, {
          of: 'of the Rings',
        });
        snapshot = await firestore
          .pipeline()
          .collection(randomCol.path)
          .sort(field('rating').descending())
          .limit(1)
          .select(field('title').substr(9).as('of'))
          .execute();
        expectResults(snapshot, {
          of: 'of the Rings',
        });
      }
    );

    itIf(testUnsupportedFeatures)('arrayConcat works', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(
          arrayConcat('tags', ['newTag1', 'newTag2'], field('tags'), [null]).as(
            'modifiedTags'
          )
        )
        .limit(1)
        .execute();
      expectResults(snapshot, {
        modifiedTags: [
          'comedy',
          'space',
          'adventure',
          'newTag1',
          'newTag2',
          'comedy',
          'space',
          'adventure',
          null,
        ],
      });
    });

    itIf(testUnsupportedFeatures)('testToLowercase', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(toLower('title').as('lowercaseTitle'))
        .limit(1)
        .execute();
      expectResults(snapshot, {
        lowercaseTitle: "the hitchhiker's guide to the galaxy",
      });
    });

    itIf(testUnsupportedFeatures)('testToUppercase', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .select(toUpper('author').as('uppercaseAuthor'))
        .limit(1)
        .execute();
      expectResults(snapshot, {uppercaseAuthor: 'DOUGLAS ADAMS'});
    });

    itIf(testUnsupportedFeatures)('testTrim', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .addFields(
          constant(" The Hitchhiker's Guide to the Galaxy ").as('spacedTitle')
        )
        .select(trim('spacedTitle').as('trimmedTitle'), field('spacedTitle'))
        .limit(1)
        .execute();
      expectResults(snapshot, {
        spacedTitle: " The Hitchhiker's Guide to the Galaxy ",
        trimmedTitle: "The Hitchhiker's Guide to the Galaxy",
      });
    });

    itIf(testUnsupportedFeatures)('test reverse', async () => {
      const snapshot = await firestore
        .pipeline()
        .collection(randomCol.path)
        .where(eq('title', '1984'))
        .limit(1)
        .select(reverse('title').as('reverseTitle'))
        .execute();
      expectResults(snapshot, {title: '4891'});
    });
  });

  describe('pagination', () => {
    /**
     * Adds several books to the test collection. These
     * additional books support pagination test scenarios
     * that would otherwise not be possible with the original
     * set of books.
     * @param collectionReference
     */
    async function addBooks(
      collectionReference: CollectionReference
    ): Promise<void> {
      await collectionReference.doc('book11').set({
        title: 'Jonathan Strange & Mr Norrell',
        author: 'Susanna Clarke',
        genre: 'Fantasy',
        published: 2004,
        rating: 4.6,
        tags: ['historical fantasy', 'magic', 'alternate history', 'england'],
        awards: {hugo: false, nebula: false},
      });
      await collectionReference.doc('book12').set({
        title: 'The Master and Margarita',
        author: 'Mikhail Bulgakov',
        genre: 'Satire',
        published: 1967, // Though written much earlier
        rating: 4.6,
        tags: [
          'russian literature',
          'supernatural',
          'philosophy',
          'dark comedy',
        ],
        awards: {},
      });
      await collectionReference.doc('book13').set({
        title: 'A Long Way to a Small, Angry Planet',
        author: 'Becky Chambers',
        genre: 'Science Fiction',
        published: 2014,
        rating: 4.6,
        tags: ['space opera', 'found family', 'character-driven', 'optimistic'],
        awards: {hugo: false, nebula: false, kitschies: true},
      });
    }

    // sort on __name__ is not working, see b/409358591
    itIf(testUnsupportedFeatures)(
      'supports pagination with filters',
      async () => {
        await addBooks(randomCol);
        const pageSize = 2;
        const pipeline = firestore
          .pipeline()
          .collection(randomCol.path)
          .select('title', 'rating', '__name__')
          .sort(field('rating').descending(), field('__name__').ascending());

        let snapshot = await pipeline.limit(pageSize).execute();
        expectResults(
          snapshot,
          {title: 'The Lord of the Rings', rating: 4.7},
          {title: 'Jonathan Strange & Mr Norrell', rating: 4.6}
        );

        const lastDoc = snapshot.results[snapshot.results.length - 1];

        snapshot = await pipeline
          .where(
            or(
              and(
                field('rating').eq(lastDoc.get('rating')),
                field('__path__').gt(lastDoc.ref?.id)
              ),
              field('rating').lt(lastDoc.get('rating'))
            )
          )
          .limit(pageSize)
          .execute();
        expectResults(
          snapshot,
          {title: 'Pride and Prejudice', rating: 4.5},
          {title: 'Crime and Punishment', rating: 4.3}
        );
      }
    );

    // sort on __name__ is not working, see b/409358591
    itIf(testUnsupportedFeatures)(
      'supports pagination with offsets',
      async () => {
        await addBooks(randomCol);

        const secondFilterField = '__path__';

        const pipeline = firestore
          .pipeline()
          .collection(randomCol.path)
          .select('title', 'rating', secondFilterField)
          .sort(
            field('rating').descending(),
            field(secondFilterField).ascending()
          );

        const pageSize = 2;
        let currPage = 0;

        let snapshot = await pipeline
          .offset(currPage++ * pageSize)
          .limit(pageSize)
          .execute();

        expectResults(
          snapshot,
          {
            title: 'The Lord of the Rings',
            rating: 4.7,
          },
          {title: 'Dune', rating: 4.6}
        );

        snapshot = await pipeline
          .offset(currPage++ * pageSize)
          .limit(pageSize)
          .execute();
        expectResults(
          snapshot,
          {
            title: 'Jonathan Strange & Mr Norrell',
            rating: 4.6,
          },
          {title: 'The Master and Margarita', rating: 4.6}
        );

        snapshot = await pipeline
          .offset(currPage++ * pageSize)
          .limit(pageSize)
          .execute();
        expectResults(
          snapshot,
          {
            title: 'A Long Way to a Small, Angry Planet',
            rating: 4.6,
          },
          {
            title: 'Pride and Prejudice',
            rating: 4.5,
          }
        );
      }
    );
  });
});
