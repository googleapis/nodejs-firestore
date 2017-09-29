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

let assert = require('assert');
let Buffer = require('safe-buffer').Buffer;
let is = require('is');

let DocumentReference = require('../src/reference').DocumentReference;
let DocumentSnapshot = require('../src/document')(DocumentReference)
  .DocumentSnapshot;

let version = require('../package.json').version;
let env = require('../../../system-test/env.js');
let Firestore = require('../');

Firestore.setLogFunction(console.log);

function getTestRoot(firestore) {
  return firestore.collection(`node_${version}_${Firestore.autoId(firestore)}`);
}

describe('Firestore class', function() {
  let firestore;
  let randomCol;

  beforeEach(function() {
    firestore = new Firestore(env);
    randomCol = getTestRoot(firestore);
  });

  it('has collection() method', function() {
    let ref = firestore.collection('col');
    assert.equal(ref.id, 'col');
  });

  it('has doc() method', function() {
    let ref = firestore.doc('col/doc');
    assert.equal(ref.id, 'doc');
  });

  it('has getAll() method', function() {
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');
    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'a'})])
      .then(() => {
        return firestore.getAll(ref1, ref2);
      })
      .then(docs => {
        assert.equal(docs.length, 2);
      });
  });
});

describe('CollectionReference class', function() {
  let firestore;
  let randomCol;

  beforeEach(function() {
    firestore = new Firestore(env);
    randomCol = getTestRoot(firestore);
  });

  it('has firestore property', function() {
    let ref = firestore.collection('col');
    assert.ok(ref.firestore instanceof Firestore);
  });

  it('has id property', function() {
    let ref = firestore.collection('col');
    assert.equal(ref.id, 'col');
  });

  it('has parent property', function() {
    let ref = firestore.collection('col/doc/col');
    assert.equal(ref.parent.id, 'doc');
  });

  it('has path property', function() {
    let ref = firestore.collection('col/doc/col');
    assert.equal(ref.path, 'col/doc/col');
  });

  it('has doc() method', function() {
    let ref = firestore.collection('col').doc('doc');
    assert.equal(ref.id, 'doc');
    ref = firestore.collection('col').doc();
    assert.equal(ref.id.length, 20);
  });

  it('has add() method', function() {
    return randomCol
      .add({foo: 'a'})
      .then(ref => {
        return ref.get();
      })
      .then(doc => {
        assert.equal(doc.get('foo'), 'a');
      });
  });
});

describe('DocumentReference class', function() {
  let firestore;
  let randomCol;

  beforeEach(function() {
    firestore = new Firestore(env);
    randomCol = getTestRoot(firestore);
  });

  it('has firestore property', function() {
    let ref = firestore.doc('col/doc');
    assert.ok(ref.firestore instanceof Firestore);
  });

  it('has id property', function() {
    let ref = firestore.doc('col/doc');
    assert.equal(ref.id, 'doc');
  });

  it('has parent property', function() {
    let ref = firestore.doc('col/doc');
    assert.equal(ref.parent.id, 'col');
  });

  it('has path property', function() {
    let ref = firestore.doc('col/doc');
    assert.equal(ref.path, 'col/doc');
  });

  it('has collection() method', function() {
    let ref = firestore.doc('col/doc').collection('subcol');
    assert.equal(ref.id, 'subcol');
  });

  it('has create()/get() method', function() {
    let ref = randomCol.doc();
    return ref
      .create({foo: 'a'})
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        assert.equal(doc.get('foo'), 'a');
      });
  });

  it('has set() method', function() {
    const allSupportedTypesObject = {
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
      dateValue: new Date('Mar 18, 1985 08:20:00.123 GMT+1000 (CET)'),
      pathValue: firestore.doc('col1/ref1'),
      arrayValue: ['foo', 42, 'bar'],
      emptyArray: [],
      nilValue: null,
      geoPointValue: new Firestore.GeoPoint(50.1430847, -122.947778),
      bytesValue: Buffer.from([0x01, 0x02]),
    };
    let ref = randomCol.doc('doc');
    return ref
      .set(allSupportedTypesObject)
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        let data = doc.data();
        assert.equal(
          data.pathValue.formattedName,
          allSupportedTypesObject.pathValue.formattedName
        );
        assert.deepStrictEqual(data, allSupportedTypesObject);
      });
  });

  it('supports NaNs', function() {
    const nanObject = {
      nanValue: NaN,
    };
    let ref = randomCol.doc('doc');
    return ref
      .set(nanObject)
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        const actualValue = doc.data().nanValue;
        assert.equal(typeof actualValue, 'number');
        assert(isNaN(actualValue));
      });
  });

  it('supports server timestamps', function() {
    const baseObject = {
      a: 'bar',
      b: {remove: 'bar'},
      d: {keep: 'bar'},
      f: Firestore.FieldValue.serverTimestamp(),
    };
    const updateObject = {
      a: Firestore.FieldValue.serverTimestamp(),
      b: {c: Firestore.FieldValue.serverTimestamp()},
      'd.e': Firestore.FieldValue.serverTimestamp(),
    };

    let ref = randomCol.doc('doc');
    let setTimestamp;

    return ref
      .set(baseObject)
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        setTimestamp = doc.get('f');
        assert.ok(is.instanceof(setTimestamp, Date));
        assert.deepEqual(doc.data(), {
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
        let updateTimestamp = doc.get('a');
        assert.ok(is.instanceof(updateTimestamp, Date));
        assert.deepEqual(doc.data(), {
          a: updateTimestamp,
          b: {c: updateTimestamp},
          d: {e: updateTimestamp, keep: 'bar'},
          f: setTimestamp,
        });
      });
  });

  it('supports set() with merge', function() {
    let ref = randomCol.doc('doc');
    return ref
      .set({'a.1': 'foo', nested: {'b.1': 'bar'}})
      .then(() =>
        ref.set({'a.2': 'foo', nested: {'b.2': 'bar'}}, {merge: true})
      )
      .then(() => ref.get())
      .then(doc => {
        let data = doc.data();
        assert.deepStrictEqual(data, {
          'a.1': 'foo',
          'a.2': 'foo',
          nested: {
            'b.1': 'bar',
            'b.2': 'bar',
          },
        });
      });
  });

  it('supports server timestamps for merge', function() {
    let ref = randomCol.doc('doc');
    return ref
      .set({a: 'b'})
      .then(() =>
        ref.set({c: Firestore.FieldValue.serverTimestamp()}, {merge: true})
      )
      .then(() => ref.get())
      .then(doc => {
        let updateTimestamp = doc.get('c');
        assert.ok(is.instanceof(updateTimestamp, Date));
        assert.deepEqual(doc.data(), {
          a: 'b',
          c: updateTimestamp,
        });
      });
  });

  it('has update() method', function() {
    let ref = randomCol.doc('doc');
    return ref
      .set({foo: 'a'})
      .then(res => {
        return ref.update({foo: 'b'}, {lastUpdateTime: res.updateTime});
      })
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        assert.equal(doc.get('foo'), 'b');
      });
  });

  it('enforces that updated document exists', function() {
    return randomCol
      .doc()
      .update({foo: 'b'})
      .catch(err => {
        assert.ok(err.message.match(/no entity to update/));
      });
  });

  it('has delete() method', function() {
    let deleted = false;

    let ref = randomCol.doc('doc');
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
        assert.equal(deleted, true);
        assert.equal(result.exists, false);
      });
  });

  it('can delete() a non-existing document', function() {
    let ref = firestore.collection('col').doc();
    return ref.delete();
  });

  it('supports non-alphanumeric field names', function() {
    const ref = randomCol.doc('doc');
    return ref
      .set({'!.\\`': {'!.\\`': 'value'}})
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        assert.deepStrictEqual(doc.data(), {'!.\\`': {'!.\\`': 'value'}});
        return ref.update(
          new Firestore.FieldPath('!.\\`', '!.\\`'),
          'new-value'
        );
      })
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        assert.deepStrictEqual(doc.data(), {'!.\\`': {'!.\\`': 'new-value'}});
      });
  });

  it('has getCollections() method', function() {
    let collections = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    let promises = [];

    for (let collection of collections) {
      promises.push(randomCol.doc(`doc/${collection}/doc`).create({}));
    }

    return Promise.all(promises)
      .then(() => {
        return randomCol.doc('doc').getCollections();
      })
      .then(response => {
        assert.equal(response.length, collections.length);
        for (let i = 0; i < response.length; ++i) {
          assert.equal(response[i].id, collections[i]);
        }
      });
  });

  describe('watch', function() {
    let currentDeferred = {promise: null};

    function resetPromise() {
      currentDeferred.promise = new Promise((resolve, reject) => {
        currentDeferred.resolve = resolve;
        currentDeferred.reject = reject;
      });
    }

    function waitForSnapshot() {
      return currentDeferred.promise.then(snapshot => {
        resetPromise();
        return snapshot;
      });
    }

    beforeEach(function() {
      resetPromise();
    });

    it('handles changing a doc', function() {
      let ref = randomCol.doc('doc');
      let readTime, createTime, updateTime;

      let unsubscribe = ref.onSnapshot(
        snapshot => {
          currentDeferred.resolve(snapshot);
        },
        err => {
          currentDeferred.reject(err);
        }
      );

      return waitForSnapshot()
        .then(snapshot => {
          assert.equal(snapshot.exists, false);

          // Add the document.
          return ref.set({foo: 'a'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(snapshot => {
          assert.equal(snapshot.exists, true);
          assert.equal(snapshot.get('foo'), 'a');
          readTime = snapshot.readTime;
          createTime = snapshot.createTime;
          updateTime = snapshot.updateTime;

          // Update documents.
          return ref.set({foo: 'b'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(snapshot => {
          assert.equal(snapshot.exists, true);
          assert.equal(snapshot.get('foo'), 'b');
          assert.equal(snapshot.createTime, createTime);
          assert.ok(snapshot.readTime > readTime);
          assert.ok(snapshot.updateTime > updateTime);
          unsubscribe();
        });
    });

    it('handles deleting a doc', function() {
      let ref = randomCol.doc('doc');

      let unsubscribe = ref.onSnapshot(
        snapshot => {
          currentDeferred.resolve(snapshot);
        },
        err => {
          currentDeferred.reject(err);
        }
      );

      return waitForSnapshot()
        .then(snapshot => {
          assert.equal(snapshot.exists, false);

          // Add the document.
          return ref.set({foo: 'a'});
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(snapshot => {
          assert.equal(snapshot.exists, true);

          // Delete the document.
          return ref.delete();
        })
        .then(() => {
          return waitForSnapshot();
        })
        .then(snapshot => {
          assert.equal(snapshot.exists, false);
          unsubscribe();
        });
    });

    it('handles multiple docs', function(done) {
      let doc1 = randomCol.doc();
      let doc2 = randomCol.doc();

      let unsubscribe1, unsubscribe2;

      // Documents transition from non-existent to existent to non-existent.
      let exists1 = [false, true, false];
      let exists2 = [false, true, false];

      // Code blocks to run after each step.
      let run = [
        () => {
          doc1.set({foo: 'foo'});
          doc2.set({foo: 'foo'});
        },
        () => {
          doc1.delete();
          doc2.delete();
        },
        () => {
          unsubscribe1();
          unsubscribe2();
          done();
        },
      ];

      let maybeRun = function() {
        if (exists1.length === exists2.length) {
          run.shift()();
        }
      };
      unsubscribe1 = doc1.onSnapshot(snapshot => {
        assert.equal(snapshot.exists, exists1.shift());
        maybeRun();
      });

      unsubscribe2 = doc2.onSnapshot(snapshot => {
        assert.equal(snapshot.exists, exists2.shift());
        maybeRun();
      });
    });

    it('handles multiple streams on same doc', function(done) {
      let doc = randomCol.doc();

      let unsubscribe1, unsubscribe2;

      // Document transitions from non-existent to existent to non-existent.
      let exists1 = [false, true, false];
      let exists2 = [false, true, false];

      // Code blocks to run after each step.
      let run = [
        () => {
          doc.set({foo: 'foo'});
        },
        () => {
          doc.delete();
        },
        () => {
          unsubscribe1();
          unsubscribe2();
          done();
        },
      ];

      let maybeRun = function() {
        if (exists1.length === exists2.length) {
          run.shift()();
        }
      };

      unsubscribe1 = doc.onSnapshot(snapshot => {
        assert.equal(snapshot.exists, exists1.shift());
        maybeRun();
      });

      unsubscribe2 = doc.onSnapshot(snapshot => {
        assert.equal(snapshot.exists, exists2.shift());
        maybeRun();
      });
    });
  });
});

describe('Query class', function() {
  let firestore;
  let randomCol;

  beforeEach(function() {
    firestore = new Firestore(env);
    randomCol = getTestRoot(firestore);
  });

  it('has firestore property', function() {
    let ref = randomCol.limit(0);
    assert.ok(ref.firestore instanceof Firestore);
  });

  it('has select() method', function() {
    let ref = randomCol.doc('doc');
    return ref
      .set({foo: 'bar', bar: 'foo'})
      .then(() => {
        return randomCol.select('foo').get();
      })
      .then(res => {
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'bar'});
      });
  });

  it('select() supports empty fields', function() {
    let ref = randomCol.doc('doc');
    return ref
      .set({foo: 'bar', bar: 'foo'})
      .then(() => {
        return randomCol.select().get();
      })
      .then(res => {
        assert.deepStrictEqual(res.docs[0].ref.id, 'doc');
        assert.deepStrictEqual(res.docs[0].data(), {});
      });
  });

  it('has where() method', function() {
    let ref = randomCol.doc('doc');
    return ref
      .set({foo: 'bar'})
      .then(() => {
        return randomCol.where('foo', '==', 'bar').get();
      })
      .then(res => {
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'bar'});
      });
  });

  it('supports NaN and Null', function() {
    let ref = randomCol.doc('doc');
    return ref
      .set({foo: NaN, bar: null})
      .then(() => {
        return randomCol
          .where('foo', '==', NaN)
          .where('bar', '==', null)
          .get();
      })
      .then(res => {
        assert.ok(
          typeof res.docs[0].get('foo') === 'number' &&
            isNaN(res.docs[0].get('foo'))
        );
        assert.equal(res.docs[0].get('bar'), null);
      });
  });

  it('has orderBy() method', function() {
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
      .then(() => {
        return randomCol.orderBy('foo').get();
      })
      .then(res => {
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
        assert.deepStrictEqual(res.docs[1].data(), {foo: 'b'});
        return randomCol.orderBy('foo', 'desc').get();
      })
      .then(res => {
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'b'});
        assert.deepStrictEqual(res.docs[1].data(), {foo: 'a'});
      });
  });

  it('can order by FieldPath.documentId()', function() {
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
      .then(() => {
        return randomCol.orderBy(Firestore.FieldPath.documentId()).get();
      })
      .then(res => {
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
        assert.deepStrictEqual(res.docs[1].data(), {foo: 'b'});
      });
  });

  it('has limit() method', function() {
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
      .then(() => {
        return randomCol
          .orderBy('foo')
          .limit(1)
          .get();
      })
      .then(res => {
        assert.equal(res.size, 1);
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
      });
  });

  it('has offset() method', function() {
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
      .then(() => {
        return randomCol
          .orderBy('foo')
          .offset(1)
          .get();
      })
      .then(res => {
        assert.equal(res.size, 1);
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'b'});
      });
  });

  it('has startAt() method', function() {
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
      .then(() => {
        return randomCol
          .orderBy('foo')
          .startAt('a')
          .get();
      })
      .then(res => {
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
      });
  });

  it('has startAfter() method', function() {
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
      .then(() => {
        return randomCol
          .orderBy('foo')
          .startAfter('a')
          .get();
      })
      .then(res => {
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'b'});
      });
  });

  it('has endAt() method', function() {
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
      .then(() => {
        return randomCol
          .orderBy('foo')
          .endAt('b')
          .get();
      })
      .then(res => {
        assert.equal(res.size, 2);
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
        assert.deepStrictEqual(res.docs[1].data(), {foo: 'b'});
      });
  });

  it('has endBefore() method', function() {
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
      .then(() => {
        return randomCol
          .orderBy('foo')
          .endBefore('b')
          .get();
      })
      .then(res => {
        assert.equal(res.size, 1);
        assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
      });
  });

  it('has stream() method', function(done) {
    let received = 0;
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})]).then(() => {
      return randomCol
        .stream()
        .on('data', () => {
          ++received;
        })
        .on('end', () => {
          assert.equal(received, 2);
          done();
        });
    });
  });

  describe('watch', function() {
    let currentDeferred = {promise: null};

    const snapshot = function(id, data) {
      const ref = randomCol.doc(id);
      return randomCol.firestore.snapshot_({
        name: ref.formattedName,
        fields: DocumentSnapshot.encodeFields(data),
        createTime: {seconds: 0, nanos: 0},
        updateTime: {seconds: 0, nanos: 0},
      });
    };

    const docChange = function(type, id, data) {
      return {
        type: type,
        doc: snapshot(id, data),
      };
    };

    const added = (id, data) => docChange('added', id, data);
    const modified = (id, data) => docChange('modified', id, data);
    const removed = (id, data) => docChange('removed', id, data);

    function resetPromise() {
      currentDeferred.promise = new Promise((resolve, reject) => {
        currentDeferred.resolve = resolve;
        currentDeferred.reject = reject;
      });
    }

    function waitForSnapshot() {
      return currentDeferred.promise.then(snapshot => {
        resetPromise();
        return snapshot;
      });
    }

    const snapshotsEqual = function(actual, expected) {
      let i;
      assert.equal(actual.size, expected.docs.length);
      for (i = 0; i < expected.docs.length && i < actual.size; i++) {
        assert.equal(actual.docs[i].ref.id, expected.docs[i].ref.id);
        assert.deepEqual(actual.docs[i].data(), expected.docs[i].data());
      }
      assert.equal(actual.docChanges.length, expected.docChanges.length);
      for (i = 0; i < expected.docChanges.length; i++) {
        assert.equal(actual.docChanges[i].type, expected.docChanges[i].type);
        assert.equal(
          actual.docChanges[i].doc.ref.id,
          expected.docChanges[i].doc.ref.id
        );
        assert.deepEqual(
          actual.docChanges[i].doc.data(),
          expected.docChanges[i].doc.data()
        );
        assert.ok(is.defined(actual.docChanges[i].doc.readTime));
        assert.ok(is.defined(actual.docChanges[i].doc.createTime));
        assert.ok(is.defined(actual.docChanges[i].doc.updateTime));
      }
      assert.ok(is.defined(actual.readTime));
    };

    beforeEach(function() {
      resetPromise();
    });

    it('handles changing a doc', function() {
      let ref1 = randomCol.doc('doc1');
      let ref2 = randomCol.doc('doc2');

      let unsubscribe = randomCol.onSnapshot(
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

    it("handles changing a doc so it doesn't match", function() {
      let ref1 = randomCol.doc('doc1');
      let ref2 = randomCol.doc('doc2');

      let query = randomCol.where('included', '==', 'yes');
      let unsubscribe = query.onSnapshot(
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

    it('handles deleting a doc', function() {
      let ref1 = randomCol.doc('doc1');
      let ref2 = randomCol.doc('doc2');

      let unsubscribe = randomCol.onSnapshot(
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
  });
});

describe('Transaction class', function() {
  let firestore;
  let randomCol;

  beforeEach(function() {
    firestore = new Firestore(env);
    randomCol = getTestRoot(firestore);
  });

  it('has get() method', function() {
    let ref = randomCol.doc('doc');
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
        assert.equal('bar', res);
      });
  });

  it('has get() with query', function() {
    let ref = randomCol.doc('doc');
    let query = randomCol.where('foo', '==', 'bar');
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
        assert.equal('bar', res);
      });
  });

  it('has set() method', function() {
    let ref = randomCol.doc('doc');
    return firestore
      .runTransaction(updateFunction => {
        updateFunction.set(ref, {foo: 'foobar'});
        return Promise.resolve();
      })
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        assert.equal('foobar', doc.get('foo'));
      });
  });

  it('has update() method', function() {
    let ref = randomCol.doc('doc');
    return ref
      .set({foo: 'bar'})
      .then(() => {
        return firestore.runTransaction(updateFunction => {
          return updateFunction.get(ref).then(() => {
            updateFunction.update(ref, {foo: 'foobar'});
          });
        });
      })
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        assert.equal('foobar', doc.get('foo'));
      });
  });

  it('enforces that updated document exists', function() {
    let ref = firestore.collection('col').doc();
    return firestore
      .runTransaction(updateFunction => {
        updateFunction.update(ref, {foo: 'b'});
        return Promise.resolve();
      })
      .then(() => {
        assert.fail();
      })
      .catch(err => {
        assert.ok(err.message.match(/no entity to update/));
      });
  });

  it('has delete() method', function() {
    let success;
    let ref = randomCol.doc('doc');
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
        assert.equal(result.exists, false);
      });
  });
});

describe('WriteBatch class', function() {
  let firestore;
  let randomCol;

  beforeEach(function() {
    firestore = new Firestore(env);
    randomCol = getTestRoot(firestore);
  });

  it('has create() method', function() {
    let ref = randomCol.doc();
    let batch = firestore.batch();
    batch.create(ref, {foo: 'a'});
    return batch
      .commit()
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        assert.equal(doc.get('foo'), 'a');
      });
  });

  it('has set() method', function() {
    let ref = randomCol.doc('doc');
    let batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    return batch
      .commit()
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        assert.equal(doc.get('foo'), 'a');
      });
  });

  it('has update() method', function() {
    let ref = randomCol.doc('doc');
    let batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    batch.update(ref, {foo: 'b'});
    return batch
      .commit()
      .then(() => {
        return ref.get();
      })
      .then(doc => {
        assert.equal(doc.get('foo'), 'b');
      });
  });

  it('enforces that updated document exists', function() {
    let ref = randomCol.doc();
    let batch = firestore.batch();
    batch.update(ref, {foo: 'b'});
    return batch
      .commit()
      .then(() => {
        assert.fail();
      })
      .catch(err => {
        assert.ok(err.message.match(/no entity to update/));
      });
  });

  // @todo: Uncomment when server supports verify()
  // Throws 'java.lang.UnsupportedOperationException: not implemented yet'
  // it('has verify() method', function() {
  //   let ref = firestore.doc('col/doc');
  //   let batch = firestore.batch();
  //   batch.set(ref, {foo: 'a'});
  //   return batch.commit().then(() => {
  //     return firestore.batch().verify_(ref, {exists:true}).commit();
  //   });
  // });

  it('has delete() method', function() {
    let success;

    let ref = randomCol.doc('doc');
    let batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    batch.delete(ref);
    return batch
      .commit()
      .then(() => {
        success = true;
        return ref.get();
      })
      .then(result => {
        assert.equal(result.exists, false);
      });
  });
});

describe('QuerySnapshot class', function() {
  let firestore;
  let querySnapshot;

  beforeEach(function() {
    firestore = new Firestore(env);

    let randomCol = getTestRoot(firestore);
    let ref1 = randomCol.doc('doc1');
    let ref2 = randomCol.doc('doc2');

    querySnapshot = Promise.all([
      ref1.set({foo: 'a'}),
      ref2.set({foo: 'a'}),
    ]).then(() => {
      return randomCol.get();
    });
  });

  it('has query property', function() {
    return querySnapshot
      .then(snapshot => {
        return snapshot.query.get();
      })
      .then(snapshot => {
        assert.equal(snapshot.size, 2);
      });
  });

  it('has empty property', function() {
    return querySnapshot
      .then(snapshot => {
        assert.ok(!snapshot.empty);
        assert.ok(is.defined(snapshot.readTime));
        return snapshot.query.where('foo', '==', 'bar').get();
      })
      .then(snapshot => {
        assert.ok(snapshot.empty);
        assert.ok(is.defined(snapshot.readTime));
      });
  });

  it('has size property', function() {
    return querySnapshot.then(snapshot => {
      assert.ok(snapshot.size, 2);
    });
  });

  it('has docs property', function() {
    return querySnapshot.then(snapshot => {
      assert.ok(snapshot.docs.length, 2);
      assert.equal(snapshot.docs[0].get('foo'), 'a');
    });
  });

  it('has forEach() method', function() {
    let count = 0;

    return querySnapshot.then(snapshot => {
      snapshot.forEach(doc => {
        assert.equal(doc.get('foo'), 'a');
        ++count;
      });
      assert.equal(count, 2);
    });
  });
});
