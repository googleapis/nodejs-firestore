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
import is from 'is';
import * as assert from 'power-assert';

// tslint:disable-next-line variable-name
const Firestore = require('../src');
import {autoId} from '../src/util';
import {DocumentSnapshot} from '../src/document';

const version = require('../../package.json').version;

class DeferredPromise {
  resolve: Function;
  reject: Function;
  promise: Promise<{}>;

  constructor() {
    this.resolve = () => {
      throw new Error('DeferredPromise.resolve has not been initialized');
    };
    this.reject = () => {
      throw new Error('DeferredPromise.reject has not been initialized');
    };
    this.promise =
        Promise.resolve('DeferredPromise.promise has not been initialized');
  }
}

if (process.env.NODE_ENV === 'DEBUG') {
  Firestore.setLogFunction(console.log);
}

function getTestRoot(firestore) {
  return firestore.collection(`node_${version}_${autoId()}`);
}

describe('Firestore class', () => {
  let firestore;
  let randomCol;

  beforeEach(() => {
    firestore = new Firestore({timestampsInSnapshots: true});
    randomCol = getTestRoot(firestore);
  });

  it('has collection() method', () => {
    const ref = firestore.collection('col');
    assert.equal(ref.id, 'col');
  });

  it('has doc() method', () => {
    const ref = firestore.doc('col/doc');
    assert.equal(ref.id, 'doc');
  });

  it('has getAll() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');
    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'a'})])
        .then(() => {
          return firestore.getAll(ref1, ref2);
        })
        .then(docs => {
          assert.equal(docs.length, 2);
        });
  });
});

describe('CollectionReference class', () => {
  let firestore;
  let randomCol;

  beforeEach(() => {
    firestore = new Firestore({timestampsInSnapshots: true});
    randomCol = getTestRoot(firestore);
  });

  it('has firestore property', () => {
    const ref = firestore.collection('col');
    assert.ok(ref.firestore instanceof Firestore);
  });

  it('has id property', () => {
    const ref = firestore.collection('col');
    assert.equal(ref.id, 'col');
  });

  it('has parent property', () => {
    const ref = firestore.collection('col/doc/col');
    assert.equal(ref.parent.id, 'doc');
  });

  it('has path property', () => {
    const ref = firestore.collection('col/doc/col');
    assert.equal(ref.path, 'col/doc/col');
  });

  it('has doc() method', () => {
    let ref = firestore.collection('col').doc('doc');
    assert.equal(ref.id, 'doc');
    ref = firestore.collection('col').doc();
    assert.equal(ref.id.length, 20);
  });

  it('has add() method', () => {
    return randomCol.add({foo: 'a'})
        .then(ref => {
          return ref.get();
        })
        .then(doc => {
          assert.equal(doc.get('foo'), 'a');
        });
  });

  it('lists missing documents', async () => {
    const batch = firestore.batch();

    batch.set(randomCol.doc('a'), {});
    batch.set(randomCol.doc('b/b/b'), {});
    batch.set(randomCol.doc('c'), {});
    await batch.commit();

    const documentRefs = await randomCol.listDocuments();
    const documents = await firestore.getAll(documentRefs);

    const existingDocs = documents.filter(doc => doc.exists);
    const missingDocs = documents.filter(doc => !doc.exists);

    expect(existingDocs.map(doc => doc.id)).to.have.members(['a', 'c']);
    expect(missingDocs.map(doc => doc.id)).to.have.members(['b']);
  });
});

describe('DocumentReference class', () => {
  let firestore;
  let randomCol;

  beforeEach(() => {
    firestore = new Firestore({timestampsInSnapshots: true});
    randomCol = getTestRoot(firestore);
  });

  it('has firestore property', () => {
    const ref = firestore.doc('col/doc');
    assert.ok(ref.firestore instanceof Firestore);
  });

  it('has id property', () => {
    const ref = firestore.doc('col/doc');
    assert.equal(ref.id, 'doc');
  });

  it('has parent property', () => {
    const ref = firestore.doc('col/doc');
    assert.equal(ref.parent.id, 'col');
  });

  it('has path property', () => {
    const ref = firestore.doc('col/doc');
    assert.equal(ref.path, 'col/doc');
  });

  it('has collection() method', () => {
    const ref = firestore.doc('col/doc').collection('subcol');
    assert.equal(ref.id, 'subcol');
  });

  it('has create()/get() method', () => {
    const ref = randomCol.doc();
    return ref.create({foo: 'a'})
        .then(() => {
          return ref.get();
        })
        .then(doc => {
          assert.equal(doc.get('foo'), 'a');
        });
  });

  it('has set() method', () => {
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
      dateValue: new Firestore.Timestamp(479978400, 123000000),
      zeroDateValue: new Firestore.Timestamp(0, 0),
      pathValue: firestore.doc('col1/ref1'),
      arrayValue: ['foo', 42, 'bar'],
      emptyArray: [],
      nilValue: null,
      geoPointValue: new Firestore.GeoPoint(50.1430847, -122.947778),
      zeroGeoPointValue: new Firestore.GeoPoint(0, 0),
      bytesValue: Buffer.from([0x01, 0x02]),
    };
    const ref = randomCol.doc('doc');
    return ref.set(allSupportedTypesObject)
        .then(() => {
          return ref.get();
        })
        .then(doc => {
          const data = doc.data();
          assert.equal(
              data.pathValue.path, allSupportedTypesObject.pathValue.path);
          delete data.pathValue;
          delete allSupportedTypesObject.pathValue;
          assert.deepStrictEqual(data, allSupportedTypesObject);
        });
  });

  it('supports NaNs', () => {
    const nanObject = {
      nanValue: NaN,
    };
    const ref = randomCol.doc('doc');
    return ref.set(nanObject)
        .then(() => {
          return ref.get();
        })
        .then(doc => {
          const actualValue = doc.data().nanValue;
          assert.equal(typeof actualValue, 'number');
          assert(isNaN(actualValue));
        });
  });

  it('supports server timestamps', () => {
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

    const ref = randomCol.doc('doc');
    let setTimestamp;

    return ref.set(baseObject)
        .then(() => {
          return ref.get();
        })
        .then(doc => {
          setTimestamp = doc.get('f');
          assert.ok(is.instanceof(setTimestamp, Firestore.Timestamp));
          assert.deepStrictEqual(doc.data(), {
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
          assert.ok(is.instanceof(updateTimestamp, Firestore.Timestamp));
          assert.deepStrictEqual(doc.data(), {
            a: updateTimestamp,
            b: {c: updateTimestamp},
            d: {e: updateTimestamp, keep: 'bar'},
            f: setTimestamp,
          });
        });
  });

  it('supports arrayUnion()', () => {
    const baseObject = {
      a: [],
      b: ['foo'],
      c: {d: ['foo']},
    };
    const updateObject = {
      a: Firestore.FieldValue.arrayUnion('foo', 'bar'),
      b: Firestore.FieldValue.arrayUnion('foo', 'bar'),
      'c.d': Firestore.FieldValue.arrayUnion('foo', 'bar')
    };
    const expectedObject = {
      a: ['foo', 'bar'],
      b: ['foo', 'bar'],
      c: {d: ['foo', 'bar']},
    };

    const ref = randomCol.doc('doc');

    return ref.set(baseObject)
        .then(() => ref.update(updateObject))
        .then(() => ref.get())
        .then(doc => {
          assert.deepStrictEqual(doc.data(), expectedObject);
        });
  });

  it('supports arrayRemove()', () => {
    const baseObject = {
      a: [],
      b: ['foo', 'foo', 'baz'],
      c: {d: ['foo', 'bar', 'baz']},
    };
    const updateObject = {
      a: Firestore.FieldValue.arrayRemove('foo'),
      b: Firestore.FieldValue.arrayRemove('foo'),
      'c.d': Firestore.FieldValue.arrayRemove('foo', 'bar')
    };
    const expectedObject = {
      a: [],
      b: ['baz'],
      c: {d: ['baz']},
    };

    const ref = randomCol.doc('doc');

    return ref.set(baseObject)
        .then(() => ref.update(updateObject))
        .then(() => ref.get())
        .then(doc => {
          assert.deepStrictEqual(doc.data(), expectedObject);
        });
  });

  it('supports set() with merge', () => {
    const ref = randomCol.doc('doc');
    return ref.set({'a.1': 'foo', nested: {'b.1': 'bar'}})
        .then(
            () =>
                ref.set({'a.2': 'foo', nested: {'b.2': 'bar'}}, {merge: true}))
        .then(() => ref.get())
        .then(doc => {
          const data = doc.data();
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

  it('supports server timestamps for merge', () => {
    const ref = randomCol.doc('doc');
    return ref.set({a: 'b'})
        .then(
            () => ref.set(
                {c: Firestore.FieldValue.serverTimestamp()}, {merge: true}))
        .then(() => ref.get())
        .then(doc => {
          const updateTimestamp = doc.get('c');
          assert.ok(is.instanceof(updateTimestamp, Firestore.Timestamp));
          assert.deepStrictEqual(doc.data(), {
            a: 'b',
            c: updateTimestamp,
          });
        });
  });

  it('has update() method', () => {
    const ref = randomCol.doc('doc');
    return ref.set({foo: 'a'})
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

  it('enforces that updated document exists', () => {
    return randomCol.doc().update({foo: 'b'}).catch(err => {
      assert.ok(err.message.match(/No document to update/));
    });
  });

  it('has delete() method', () => {
    let deleted = false;

    const ref = randomCol.doc('doc');
    return ref.set({foo: 'a'})
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

  it('can delete() a non-existing document', () => {
    const ref = firestore.collection('col').doc();
    return ref.delete();
  });

  it('supports non-alphanumeric field names', () => {
    const ref = randomCol.doc('doc');
    return ref.set({'!.\\`': {'!.\\`': 'value'}})
        .then(() => {
          return ref.get();
        })
        .then(doc => {
          assert.deepStrictEqual(doc.data(), {'!.\\`': {'!.\\`': 'value'}});
          return ref.update(
              new Firestore.FieldPath('!.\\`', '!.\\`'), 'new-value');
        })
        .then(() => {
          return ref.get();
        })
        .then(doc => {
          assert.deepStrictEqual(doc.data(), {'!.\\`': {'!.\\`': 'new-value'}});
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
          assert.equal(response.length, collections.length);
          for (let i = 0; i < response.length; ++i) {
            assert.equal(response[i].id, collections[i]);
          }
        });
  });

  // tslint:disable-next-line:only-arrow-function
  it('can add and delete fields sequentially', function() {
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
      () => ref.set({a: {d: Firestore.FieldValue.delete()}}, {merge: true}),
      () => ref.set({a: {b: Firestore.FieldValue.delete()}}, {merge: true}),
      () => ref.set({a: {e: 'foo'}}, {merge: true}),
      () => ref.set({f: 'foo'}, {merge: true}),
      () => ref.set({f: {g: 'foo'}}, {merge: true}),
      () => ref.update({'f.h': 'foo'}),
      () => ref.update({'f.g': Firestore.FieldValue.delete()}),
      () => ref.update({'f.h': Firestore.FieldValue.delete()}),
      () => ref.update({f: Firestore.FieldValue.delete()}),
      () => ref.update({'i.j': {}}),
      () => ref.update({'i.j': {k: 'foo'}}),
      () => ref.update({'i.j': {l: {}}}),
      () => ref.update({i: Firestore.FieldValue.delete()}),
      () => ref.update({a: Firestore.FieldValue.delete()}),
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
      promise = promise.then(() => actions[i]())
                    .then(() => {
                      return ref.get();
                    })
                    .then(snap => {
                      if (!snap.exists) {
                        assert.equal(null, expectedState[i]);
                      } else {
                        assert.deepStrictEqual(snap.data(), expectedState[i]);
                      }
                    });
    }

    return promise;
  });

  // tslint:disable-next-line:only-arrow-function
  it('can add and delete fields with server timestamps', function() {
    this.timeout(10 * 1000);

    const ref = randomCol.doc('doc');

    const actions = [
      () => ref.create({
        time: Firestore.FieldValue.serverTimestamp(),
        a: {b: Firestore.FieldValue.serverTimestamp()},
      }),
      () => ref.set({
        time: Firestore.FieldValue.serverTimestamp(),
        a: {c: Firestore.FieldValue.serverTimestamp()},
      }),
      () => ref.set(
          {
            time: Firestore.FieldValue.serverTimestamp(),
            a: {d: Firestore.FieldValue.serverTimestamp()},
          },
          {merge: true}),
      () => ref.set(
          {
            time: Firestore.FieldValue.serverTimestamp(),
            e: Firestore.FieldValue.serverTimestamp(),
          },
          {merge: true}),
      () => ref.set(
          {
            time: Firestore.FieldValue.serverTimestamp(),
            e: {f: Firestore.FieldValue.serverTimestamp()},
          },
          {merge: true}),
      () => ref.update({
        time: Firestore.FieldValue.serverTimestamp(),
        'g.h': Firestore.FieldValue.serverTimestamp(),
      }),
      () => ref.update({
        time: Firestore.FieldValue.serverTimestamp(),
        'g.j': {k: Firestore.FieldValue.serverTimestamp()},
      }),
    ];

    const expectedState = [
      times => {
        return {time: times[0], a: {b: times[0]}};
      },
      times => {
        return {time: times[1], a: {c: times[1]}};
      },
      times => {
        return {time: times[2], a: {c: times[1], d: times[2]}};
      },
      times => {
        return {time: times[3], a: {c: times[1], d: times[2]}, e: times[3]};
      },
      times => {
        return {
          time: times[4],
          a: {c: times[1], d: times[2]},
          e: {f: times[4]},
        };
      },
      times => {
        return {
          time: times[5],
          a: {c: times[1], d: times[2]},
          e: {f: times[4]},
          g: {h: times[5]},
        };
      },
      times => {
        return {
          time: times[6],
          a: {c: times[1], d: times[2]},
          e: {f: times[4]},
          g: {h: times[5], j: {k: times[6]}},
        };
      },
    ];

    let promise = Promise.resolve();
    const times: Array<{}> = [];

    for (let i = 0; i < actions.length; ++i) {
      promise =
          promise.then(() => actions[i]())
              .then(() => {
                return ref.get();
              })
              .then(snap => {
                times.push(snap.get('time'));
                assert.deepStrictEqual(snap.data(), expectedState[i](times));
              });
    }

    return promise;
  });

  describe('watch', () => {
    const currentDeferred = new DeferredPromise();


    function resetPromise() {
      currentDeferred.promise = new Promise((resolve, reject) => {
        currentDeferred.resolve = resolve;
        currentDeferred.reject = reject;
      });
    }

    function waitForSnapshot(): Promise<DocumentSnapshot> {
      return currentDeferred.promise.then(snapshot => {
        resetPromise();
        return snapshot as DocumentSnapshot;
      });
    }

    beforeEach(() => resetPromise());

    it('handles changing a doc', () => {
      const ref = randomCol.doc('doc');
      let readTime, createTime, updateTime;

      const unsubscribe = ref.onSnapshot(
          snapshot => {
            currentDeferred.resolve(snapshot);
          },
          err => {
            currentDeferred.reject(err);
          });

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
            assert.ok(snapshot.createTime.isEqual(createTime));
            assert.ok(snapshot.readTime.toMillis() > readTime.toMillis());
            assert.ok(snapshot.updateTime.toMillis() > updateTime.toMillis());
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
          });

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

    it('handles multiple docs', done => {
      const doc1 = randomCol.doc();
      const doc2 = randomCol.doc();

      let unsubscribe1, unsubscribe2;

      // Documents transition from non-existent to existent to non-existent.
      const exists1 = [false, true, false];
      const exists2 = [false, true, false];

      // Code blocks to run after each step.
      const run = [
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

      const maybeRun = () => {
        if (exists1.length === exists2.length) {
          run.shift()!();
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

    it('handles multiple streams on same doc', done => {
      const doc = randomCol.doc();

      let unsubscribe1, unsubscribe2;

      // Document transitions from non-existent to existent to non-existent.
      const exists1 = [false, true, false];
      const exists2 = [false, true, false];

      // Code blocks to run after each step.
      const run = [
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

      const maybeRun = () => {
        if (exists1.length === exists2.length) {
          run.shift()!();
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

describe('Query class', () => {
  let firestore;
  let randomCol;

  const paginateResults = (query, startAfter?) => {
    return (startAfter ? query.startAfter(startAfter) : query)
        .get()
        .then(snapshot => {
          if (snapshot.empty) {
            return {pages: 0, docs: []};
          } else {
            const docs = snapshot.docs;
            return paginateResults(query, docs[docs.length - 1])
                .then(nextPage => {
                  return {
                    pages: nextPage.pages + 1,
                    docs: docs.concat(nextPage.docs),
                  };
                });
          }
        });
  };

  beforeEach(() => {
    firestore = new Firestore({timestampsInSnapshots: true});
    randomCol = getTestRoot(firestore);
  });

  it('has firestore property', () => {
    const ref = randomCol.limit(0);
    assert.ok(ref.firestore instanceof Firestore);
  });

  it('has select() method', () => {
    const ref = randomCol.doc('doc');
    return ref.set({foo: 'bar', bar: 'foo'})
        .then(() => {
          return randomCol.select('foo').get();
        })
        .then(res => {
          assert.deepStrictEqual(res.docs[0].data(), {foo: 'bar'});
        });
  });

  it('select() supports empty fields', () => {
    const ref = randomCol.doc('doc');
    return ref.set({foo: 'bar', bar: 'foo'})
        .then(() => {
          return randomCol.select().get();
        })
        .then(res => {
          assert.deepStrictEqual(res.docs[0].ref.id, 'doc');
          assert.deepStrictEqual(res.docs[0].data(), {});
        });
  });

  it('has where() method', () => {
    const ref = randomCol.doc('doc');
    return ref.set({foo: 'bar'})
        .then(() => {
          return randomCol.where('foo', '==', 'bar').get();
        })
        .then(res => {
          assert.deepStrictEqual(res.docs[0].data(), {foo: 'bar'});
        });
  });

  it('supports NaN and Null', () => {
    const ref = randomCol.doc('doc');
    return ref.set({foo: NaN, bar: null})
        .then(() => {
          return randomCol.where('foo', '==', NaN)
              .where('bar', '==', null)
              .get();
        })
        .then(res => {
          assert.ok(
              typeof res.docs[0].get('foo') === 'number' &&
              isNaN(res.docs[0].get('foo')));
          assert.equal(res.docs[0].get('bar'), null);
        });
  });

  it('supports array-contains', () => {
    return Promise
        .all([randomCol.add({foo: ['bar']}), randomCol.add({foo: []})])
        .then(() => randomCol.where('foo', 'array-contains', 'bar').get())
        .then(res => {
          assert.ok(res.size, 1);
          assert.deepStrictEqual(res.docs[0].get('foo'), ['bar']);
        });
  });


  it('can query by FieldPath.documentId()', () => {
    const ref = randomCol.doc('foo');

    return ref.set({})
        .then(() => {
          return randomCol.where(Firestore.FieldPath.documentId(), '>=', 'bar')
              .get();
        })
        .then(res => {
          assert.equal(res.docs.length, 1);
        });
  });

  it('has orderBy() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

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

  it('can order by FieldPath.documentId()', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
        .then(() => {
          return randomCol.orderBy(Firestore.FieldPath.documentId()).get();
        })
        .then(res => {
          assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
          assert.deepStrictEqual(res.docs[1].data(), {foo: 'b'});
        });
  });

  it('has limit() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
        .then(() => {
          return randomCol.orderBy('foo').limit(1).get();
        })
        .then(res => {
          assert.equal(res.size, 1);
          assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
        });
  });

  it('has offset() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
        .then(() => {
          return randomCol.orderBy('foo').offset(1).get();
        })
        .then(res => {
          assert.equal(res.size, 1);
          assert.deepStrictEqual(res.docs[0].data(), {foo: 'b'});
        });
  });

  it('has startAt() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
        .then(() => {
          return randomCol.orderBy('foo').startAt('a').get();
        })
        .then(res => {
          assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
        });
  });

  it('supports pagination', () => {
    const batch = firestore.batch();

    for (let i = 0; i < 10; ++i) {
      batch.set(randomCol.doc('doc' + i), {val: i});
    }

    const query = randomCol.orderBy('val').limit(3);

    return batch.commit().then(() => paginateResults(query)).then(results => {
      assert.equal(results.pages, 4);
      assert.equal(results.docs.length, 10);
    });
  });

  it('supports pagination with where() clauses', () => {
    const batch = firestore.batch();

    for (let i = 0; i < 10; ++i) {
      batch.set(randomCol.doc('doc' + i), {val: i});
    }

    const query = randomCol.where('val', '>=', 1).limit(3);

    return batch.commit().then(() => paginateResults(query)).then(results => {
      assert.equal(results.pages, 3);
      assert.equal(results.docs.length, 9);
    });
  });

  it('supports pagination with array-contains filter', () => {
    const batch = firestore.batch();

    for (let i = 0; i < 10; ++i) {
      batch.set(randomCol.doc('doc' + i), {array: ['foo']});
    }

    const query = randomCol.where('array', 'array-contains', 'foo').limit(3);

    return batch.commit().then(() => paginateResults(query)).then(results => {
      assert.equal(results.pages, 4);
      assert.equal(results.docs.length, 10);
    });
  });

  it('has startAfter() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
        .then(() => {
          return randomCol.orderBy('foo').startAfter('a').get();
        })
        .then(res => {
          assert.deepStrictEqual(res.docs[0].data(), {foo: 'b'});
        });
  });

  it('has endAt() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
        .then(() => {
          return randomCol.orderBy('foo').endAt('b').get();
        })
        .then(res => {
          assert.equal(res.size, 2);
          assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
          assert.deepStrictEqual(res.docs[1].data(), {foo: 'b'});
        });
  });

  it('has endBefore() method', () => {
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    return Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})])
        .then(() => {
          return randomCol.orderBy('foo').endBefore('b').get();
        })
        .then(res => {
          assert.equal(res.size, 1);
          assert.deepStrictEqual(res.docs[0].data(), {foo: 'a'});
        });
  });

  it('has stream() method', done => {
    let received = 0;
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    Promise.all([ref1.set({foo: 'a'}), ref2.set({foo: 'b'})]).then(() => {
      return randomCol.stream()
          .on('data',
              () => {
                ++received;
              })
          .on('end', () => {
            assert.equal(received, 2);
            done();
          });
    });
  });

  describe('watch', () => {
    const currentDeferred = new DeferredPromise();

    const snapshot = (id, data) => {
      const ref = randomCol.doc(id);
      return randomCol.firestore.snapshot_({
        name: ref.formattedName,
        fields: ref.firestore._serializer.encodeFields(data),
        createTime: {seconds: 0, nanos: 0},
        updateTime: {seconds: 0, nanos: 0},
      });
    };

    const docChange = (type, id, data) => {
      return {
        type,
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

    function snapshotsEqual(actual, expected) {
      let i;
      assert.equal(actual.size, expected.docs.length);
      for (i = 0; i < expected.docs.length && i < actual.size; i++) {
        assert.equal(actual.docs[i].ref.id, expected.docs[i].ref.id);
        assert.deepStrictEqual(actual.docs[i].data(), expected.docs[i].data());
      }
      const actualDocChanges = actual.docChanges();
      assert.equal(actualDocChanges.length, expected.docChanges.length);
      for (i = 0; i < expected.docChanges.length; i++) {
        assert.equal(actualDocChanges[i].type, expected.docChanges[i].type);
        assert.equal(
            actualDocChanges[i].doc.ref.id, expected.docChanges[i].doc.ref.id);
        assert.deepStrictEqual(
            actualDocChanges[i].doc.data(), expected.docChanges[i].doc.data());
        assert.ok(is.defined(actualDocChanges[i].doc.readTime));
        assert.ok(is.defined(actualDocChanges[i].doc.createTime));
        assert.ok(is.defined(actualDocChanges[i].doc.updateTime));
      }
      assert.ok(is.defined(actual.readTime));
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
          });

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
              docs:
                  [snapshot('doc1', {foo: 'a'}), snapshot('doc2', {foo: 'b'})],
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
              docs:
                  [snapshot('doc1', {foo: 'a'}), snapshot('doc2', {bar: 'c'})],
              docChanges: [modified('doc2', {bar: 'c'})],
            });
            unsubscribe();
          });
    });

    it('handles changing a doc so it doesn\'t match', () => {
      const ref1 = randomCol.doc('doc1');
      const ref2 = randomCol.doc('doc2');

      const query = randomCol.where('included', '==', 'yes');
      const unsubscribe = query.onSnapshot(
          snapshot => {
            currentDeferred.resolve(snapshot);
          },
          err => {
            currentDeferred.reject(err);
          });

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
          });

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

describe('Transaction class', () => {
  let firestore;
  let randomCol;

  beforeEach(() => {
    firestore = new Firestore({timestampsInSnapshots: true});
    randomCol = getTestRoot(firestore);
  });

  it('has get() method', () => {
    const ref = randomCol.doc('doc');
    return ref.set({foo: 'bar'})
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
          assert.equal(2, res);
        });
  });

  it('has get() with query', () => {
    const ref = randomCol.doc('doc');
    const query = randomCol.where('foo', '==', 'bar');
    return ref.set({foo: 'bar'})
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
          assert.equal('foobar', doc.get('foo'));
        });
  });

  it('has update() method', () => {
    const ref = randomCol.doc('doc');
    return ref.set({foo: 'bar'})
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

  it('enforces that updated document exists', () => {
    const ref = firestore.collection('col').doc();
    return firestore
        .runTransaction(updateFunction => {
          updateFunction.update(ref, {foo: 'b'});
          return Promise.resolve();
        })
        .then(() => {
          assert.fail();
        })
        .catch(err => {
          assert.ok(err.message.match(/No document to update/));
        });
  });

  it('has delete() method', () => {
    let success;
    const ref = randomCol.doc('doc');
    return ref.set({foo: 'bar'})
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
          assert.equal(success, true);
          assert.equal(result.exists, false);
        });
  });
});

describe('WriteBatch class', () => {
  let firestore;
  let randomCol;

  beforeEach(() => {
    firestore = new Firestore({timestampsInSnapshots: true});
    randomCol = getTestRoot(firestore);
  });

  it('supports empty batches', () => {
    return firestore.batch().commit();
  });

  it('has create() method', () => {
    const ref = randomCol.doc();
    const batch = firestore.batch();
    batch.create(ref, {foo: 'a'});
    return batch.commit()
        .then(() => {
          return ref.get();
        })
        .then(doc => {
          assert.equal(doc.get('foo'), 'a');
        });
  });

  it('has set() method', () => {
    const ref = randomCol.doc('doc');
    const batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    return batch.commit()
        .then(() => {
          return ref.get();
        })
        .then(doc => {
          assert.equal(doc.get('foo'), 'a');
        });
  });

  it('has update() method', () => {
    const ref = randomCol.doc('doc');
    const batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    batch.update(ref, {foo: 'b'});
    return batch.commit()
        .then(() => {
          return ref.get();
        })
        .then(doc => {
          assert.equal(doc.get('foo'), 'b');
        });
  });

  it('omits document transforms from write results', () => {
    const batch = firestore.batch();
    batch.set(randomCol.doc(), {foo: 'a'});
    batch.set(randomCol.doc(), {foo: Firestore.FieldValue.serverTimestamp()});
    return batch.commit().then(writeResults => {
      assert.equal(writeResults.length, 2);
    });
  });

  it('enforces that updated document exists', () => {
    const ref = randomCol.doc();
    const batch = firestore.batch();
    batch.update(ref, {foo: 'b'});
    return batch.commit()
        .then(() => {
          assert.fail();
        })
        .catch(err => {
          assert.ok(err.message.match(/No document to update/));
        });
  });

  it('has delete() method', () => {
    let success;

    const ref = randomCol.doc('doc');
    const batch = firestore.batch();
    batch.set(ref, {foo: 'a'});
    batch.delete(ref);
    return batch.commit()
        .then(() => {
          success = true;
          return ref.get();
        })
        .then(result => {
          assert.equal(success, true);
          assert.equal(result.exists, false);
        });
  });
});

describe('QuerySnapshot class', () => {
  let firestore;
  let querySnapshot;

  beforeEach(() => {
    firestore = new Firestore({timestampsInSnapshots: true});

    const randomCol = getTestRoot(firestore);
    const ref1 = randomCol.doc('doc1');
    const ref2 = randomCol.doc('doc2');

    querySnapshot = Promise
                        .all([
                          ref1.set({foo: 'a'}),
                          ref2.set({foo: 'a'}),
                        ])
                        .then(() => {
                          return randomCol.get();
                        });
  });

  it('has query property', () => {
    return querySnapshot
        .then(snapshot => {
          return snapshot.query.get();
        })
        .then(snapshot => {
          assert.equal(snapshot.size, 2);
        });
  });

  it('has empty property', () => {
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

  it('has size property', () => {
    return querySnapshot.then(snapshot => {
      assert.ok(snapshot.size, 2);
    });
  });

  it('has docs property', () => {
    return querySnapshot.then(snapshot => {
      assert.ok(snapshot.docs.length, 2);
      assert.equal(snapshot.docs[0].get('foo'), 'a');
    });
  });

  it('has forEach() method', () => {
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
