/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

let assert = require('assert');
let duplexify = require('duplexify');
let grpc = require('grpc');
let immutable = require('immutable');
let is = require('is');
let through = require('through2');

let Firestore = require('../');
let reference = require('../src/reference')(Firestore);
let DocumentReference = reference.DocumentReference;
let QuerySnapshot = reference.QuerySnapshot;
let DocumentSnapshot = require('../src/document')(
  Firestore, DocumentReference).DocumentSnapshot;

function createInstance() {
  return new Firestore({
    projectId: 'test-project',
    sslCreds: grpc.credentials.createInsecure()
  });
}

/**
 * Asserts that the given query snapshot matches the expected results.
 * @param version The snapshot version to use for the comparison.
 * @param actual A QuerySnapshot with results.
 * @param expected Array of DocumentSnapshot.
 */
const snapshotsEqual = function(version, actual, expected) {
  let i;
  assert.equal(actual.size, expected.docs.length);
  for (i = 0; i < expected.docs.length && i < actual.size; i++) {
    assert.equal(actual.docs[i].ref.id, expected.docs[i].ref.id);
    assert.deepEqual(actual.docs[i].data(), expected.docs[i].data());
    assert.ok(is.string(expected.docs[i].createTime));
    assert.ok(is.string(expected.docs[i].updateTime));
  }
  assert.equal(actual.docChanges.length, expected.docChanges.length);
  for (i = 0; i < expected.docChanges.length; i++) {
    assert.equal(actual.docChanges[i].type, expected.docChanges[i].type);
    assert.equal(actual.docChanges[i].doc.ref.id,
      expected.docChanges[i].doc.ref.id);
    assert.deepEqual(actual.docChanges[i].doc.data(),
      expected.docChanges[i].doc.data());
    let readVersion = actual.docChanges[i].type === 'removed' ?
        version - 1: version;
    assert.equal(actual.docChanges[i].doc.readTime,
        `1970-01-01T00:00:00.00000000${readVersion}Z`);
  }
  assert.equal(actual.readTime, `1970-01-01T00:00:00.00000000${version}Z`);
};

/*
 * Helper for constructing a snapshot.
 */
const snapshot = function(ref, data) {
  const snapshot = new DocumentSnapshot.Builder();
  snapshot.ref = ref;
  snapshot.fieldsProto = DocumentSnapshot.encodeFields(data);
  snapshot.readTime = '1970-01-01T00:00:00.000000000Z';
  snapshot.createTime = '1970-01-01T00:00:00.000000000Z';
  snapshot.updateTime = '1970-01-01T00:00:00.000000000Z';
  return snapshot.build();
};

/*
 * Helpers for constructing document changes.
 */
const docChange = function(type, ref, data) {
  return {
    type: type,
    doc: snapshot(ref, data)
  };
};

const added = (ref, data) => docChange('added', ref, data);
const modified = (ref, data) => docChange('modified', ref, data);
const removed = (ref, data) => docChange('removed', ref, data);

/**
 * Handles stream operations for the Firestore Listen API. StreamHelper
 * supports one stream at a time, but multiple streams can be processed through
 * sequential invocations of the Listen API.
 */
class StreamHelper {
  /**
   * @param firestore The Firestore client.
   */
  constructor(firestore) {
    this.streamCount = 0;

    /** A deferred promise that waits for the next stream. */
    this.deferredStream = {
      promise: null
    };

    this.reset();

    // Create a mock backend whose stream we can return.
    let self = this;
    firestore.api.Firestore._listen = function() {
      if (self.streamCount++) {
        self.reset();
      }
      self.readStream = through.obj();
      self.writeStream = through.obj();
      const stream = duplexify.obj(self.readStream, self.writeStream);
      stream.pause();
      self.deferredStream.resolve(self.readStream, self.writeStream);
      return stream;
    };
  }


  /**
   * Resets the deferred promise to wait for the next stream.
   */
  reset() {
    this.deferredStream.promise = new Promise ((resolve, reject) => {
      this.deferredStream.resolve = resolve;
      this.deferredStream.reject = reject;
    });
  }

  /**
   * Takes a stream and returns a promise that will be resolved when the stream
   * gets the next chunk of data. If 'expectedChunk' is set, verifies that the
   * chunk matches the provided argument.
   *
   * @param {String=} expectedChunk Optional JSON chunk for verification.
   */
  waitForData(expectedChunk) {
    return this.deferredStream.promise.then((readStream) => {
      return new Promise((resolve, reject) => {
        let resolved = false;
        readStream.once('data', (result) => {
          readStream.pause();
          resolved = true;

          if (is.defined(expectedChunk)) {
            assert.deepEqual(result, expectedChunk);
          }
          resolve(result);
        });
        readStream.on('error', (err) => {
          if (!resolved) {
            reject(err);
          }
        });
        readStream.on('end', () => {
          if (!resolved) {
            reject(new Error('Stream ended while waiting for event.'));
          }
        });
        readStream.on('close', () => {
          if (!resolved) {
            reject(new Error('Stream closed while waiting for event.'));
          }
        });

        if (readStream.isPaused()) {
          readStream.resume();
        }
      });
    });
  }

  /**
   * Takes a stream and returns a promise that will be resolved when the stream
   * ends.
   */
  waitForEnd() {
    return this.deferredStream.promise.then((readStream) => {
      return new Promise((resolve, reject) => {
        readStream.once('data', (result) => {
          reject(new Error('Unexpected event waiting for end: ' +
              JSON.stringify(result)));
        });
        readStream.on('error', (err) => {
          reject(new Error('Unexpected error waiting for end: ' + err));
        });
        readStream.on('end', () => {
          resolve();
        });
        readStream.on('close', () => {
          reject(new Error('Unexpected close waiting for end.'));
        });
        if (readStream.isPaused()) {
          readStream.resume();
        }
      });
    });
  }

  /**
   * Takes a stream and returns a promise that will be resolved when the stream
   * receives an error.
   */
  waitForError() {
    return this.deferredStream.promise.then((readStream) => {
      return new Promise((resolve, reject) => {
        readStream.once('data', (result) => {
          reject(new Error('Unexpected event waiting for error: ' +
              JSON.stringify(result)));
        });
        readStream.on('error', (err) => {
          resolve(err);
        });
        readStream.on('end', () => {
          reject(new Error('Unexpected end waiting for error.'));
        });
        readStream.on('close', () => {
          reject(new Error('Unexpected close waiting for error.'));
        });
        if (readStream.isPaused()) {
          readStream.resume();
        }
      });
    });
  }

  /**
   * Sends a message to the currently active stream.
   */
  write(data) {
    this.writeStream.write(data);
  }

  /**
   * Destroys the currently active stream.
   */
  destroyStream() {
    this.readStream.destroy(new Error('Server disconnect'));
  }
}

/**
 * Encapsulates the stream logic for the Watch API.
 */
class WatchHelper {
  /**
   * @param streamHelper The StreamHelper base class for this Watch operation.
   * @param reference The CollectionReference or DocumentReference that is being
   * watched.
   * @param targetId The target ID of the watch stream.
   */
  constructor(streamHelper, reference, targetId) {
    /** A deferred promise that waits for the next snapshot. */
    this.currentDeferred = {
      promise: null
    };

    this.reference = reference;
    this.streamHelper = streamHelper;
    this.targetId = targetId;
    this.snapshotVersion = 0;
    this.reset();
  }


  /**
   * Prepares WatchHelper for the next chunk.
   */
  reset() {
    this.currentDeferred.promise = new Promise ((resolve, reject) => {
      this.currentDeferred.resolve = resolve;
      this.currentDeferred.reject = reject;
    });
  }

  /**
   * Creates a watch, starts a listen, and asserts that the request got
   * processed.
   *
   * @return A Promise that will be fulfilled when the request has been
   * acknowledged.
   */
  startWatch(requestJSON) {
    this.unsubscribe = this.reference.onSnapshot((snapshot) => {
      this.currentDeferred.resolve(snapshot);
    }, (err) => {
      this.currentDeferred.reject(err);
    });

    // Wait for the SDK to send the query to the backend.
    return this.streamHelper.waitForData(requestJSON);
  }

  /**
   * Returns a promise that resolves when a snapshot is sent from the backend.
   */
  waitForSnapshot() {
    return this.currentDeferred.promise.then((snapshot) => {
      this.reset();
      return snapshot;
    });
  }

  /**
   * Ends the listen stream.
   *
   * @return A Promise that will be fulfilled when the backend saw the end.
   */
  endWatch() {
    this.unsubscribe();
    return this.streamHelper.waitForEnd();
  }

  /**
   * Sends a target change from the backend simulating adding the query target.
   */
  sendAddTarget() {
    this.streamHelper.write({
      targetChange: {
        targetChangeType: 'ADD',
        targetIds: [this.targetId]
      }
    });
  }

  /**
   * Sends a target change from the backend simulating removing a query target.
   *
   * @param cause The optional code indicating why the target was removed.
   */
  sendRemoveTarget(cause) {
    const proto = {
      targetChange: {
        targetChangeType: 'REMOVE',
        targetIds: [this.targetId],
      }
    };
    if (cause) {
      proto.targetChange.cause = {
        code: cause,
        message: 'test remove',
      };
    }
    this.streamHelper.write(proto);
  }

  /**
   * Sends a target change from the backend of type 'NO_CHANGE'. If specified,
   * includes a resume token.
   */
  sendSnapshot(version, resumeToken) {
    this.snapshotVersion = version;

    let proto = {
      targetChange: {
        targetChangeType: 'NO_CHANGE',
        targetIds: [],
        readTime: { seconds: 0, nanos: version },
      }
    };

    if (resumeToken) {
      proto.targetChange.resumeToken = resumeToken;
    }

    this.streamHelper.write(proto);
  }

  /**
   * Sends a target change from the backend of type 'CURRENT'.
   */
  sendCurrent(resumeToken) {
    let proto = ({
      targetChange: {
        targetChangeType: 'CURRENT',
        targetIds: [this.targetId],
      }
    });

    if (resumeToken) {
      proto.targetChange.resumeToken = resumeToken;
    }

    this.streamHelper.write(proto);
  }

  /**
   * Sends a doc change from the backend to the client.
   *
   * @param ref The document reference.
   * @param data The data for the doc in proto JSON format.
   */
  sendDoc(ref, data) {
    this.streamHelper.write({
      documentChange: {
        document: {
          name: ref.formattedName,
          fields: DocumentSnapshot.encodeFields(data),
          createTime: {seconds: 1, nanos: 2},
          updateTime: {seconds: 3, nanos: this.snapshotVersion}
        },
        targetIds: [this.targetId],
      },
    });
  }

  /**
   * Sends a doc removal from the backend to the client.
   *
   * @param ref The document reference.
   * @param data The data for the doc in proto JSON format.
   */
  sendDocRemove(ref, data) {
    this.streamHelper.write({
      documentChange: {
        document: {
          name: ref.formattedName,
          fields: DocumentSnapshot.encodeFields(data),
        },
        removedTargetIds: [this.targetId],
      },
    });
  }

  /**
   * Sends a doc delete from the backend to the client.
   *
   * @param ref The document reference.
   */
  sendDocDelete(ref) {
    this.streamHelper.write({
      documentDelete: {
        document: ref.formattedName,
        removedTargetIds: [this.targetId]
      }
    });
  }

  /**
   * A wrapper for writing tests that successfully run a watch.
   */
  runTest(requestJSON, func) {
    return this.startWatch(requestJSON).then(() => {
      return func();
    }).then(() => {
      return this.endWatch();
    });
  }

    /**
     * A wrapper for writing tests that fail to run a watch.
     */
     runFailedTest(requestJSON, func, expectedMessage) {
    let fail = false;
    return this.startWatch(requestJSON).then(() => {
      return func();
    }).then(() => {
      fail = true;
      throw new Error('Expected Exception');
    }).catch((err) => {
      assert.equal(fail, false, 'Should not have executed the previous block.');
      assert.equal(err.message, expectedMessage);
      return this.endWatch();
    });
  }
}


describe('Query watch', function() {
  // The collection to query.
  let colRef;

  // The documents used in this query.
  let doc1, doc2, doc3, doc4;

  let firestore;
  let targetId;
  let watchHelper;
  let streamHelper;

  // The proto JSON that should be sent for the query.
  const collQueryJSON = () => {
    return {
      database: 'projects/test-project/databases/(default)',
      addTarget: {
        query: {
          parent: 'projects/test-project/databases/(default)',
          structuredQuery: {
            from: [{collectionId: 'col'}],
          },
        },
        targetId: targetId
      }
    };
  };

  const includeQuery = () => {
    return colRef.where('included', '==', 'yes');
  };

  // The proto JSON that should be sent for the query.
  const includeQueryJSON = () => {
    return {
      database: 'projects/test-project/databases/(default)',
      addTarget: {
        query: {
          parent: 'projects/test-project/databases/(default)',
          structuredQuery: {
            from: [{collectionId: 'col'}],
            where: {
              compositeFilter: {
                filters: [{
                  fieldFilter: {
                    field: {
                      fieldPath: 'included',
                    },
                    op: 'EQUAL',
                    value: {
                      stringValue: 'yes',
                      value_type: 'stringValue',
                    },
                  },
                }],
                op: 'AND',
              },
            },
          }
        },
        targetId: targetId
      },
    };
  };

  // The proto JSON that should be sent for a resumed query.
  const resumeTokenQuery = (resumeToken) => {
    return {
      database: 'projects/test-project/databases/(default)',
      addTarget: {
        query: {
          parent: 'projects/test-project/databases/(default)',
          structuredQuery: {
            from: [{collectionId: 'col'}],
          },
        },
        targetId: targetId,
        resumeToken: resumeToken
      },
    };
  };

  const sortedQuery = () => {
    return colRef.orderBy('foo', 'desc');
  };

  // The proto JSON that should be sent for the query.
  const sortedQueryJSON = () => {
    return {
      database: 'projects/test-project/databases/(default)',
      addTarget: {
        query: {
          parent: 'projects/test-project/databases/(default)',
          structuredQuery: {
            from: [{collectionId: 'col'}],
            orderBy: [{direction: 'DESCENDING', field: {fieldPath: 'foo'}}]
          }
        },
        targetId: targetId
      },
    };
  };

  beforeEach(function() {
    firestore = createInstance();

    targetId = 0xF0;

    streamHelper = new StreamHelper(firestore);
    watchHelper = new WatchHelper(streamHelper,
      firestore.collection('col'), targetId);

    colRef = firestore.collection('col');

    doc1 = firestore.doc('col/doc1');
    doc2 = firestore.doc('col/doc2');
    doc3 = firestore.doc('col/doc3');
    doc4 = firestore.doc('col/doc4');
  });

  it('with invalid callbacks', function() {
    assert.throws(() => {
      colRef.onSnapshot('foo');
    }, /Argument "onNext" is not a valid function./);

    assert.throws(() => {
      colRef.onSnapshot(() => {}, 'foo');
    }, /Argument "onError" is not a valid function./);
  });

  it('without error callback', function(done) {
    let unsubscribe = colRef.onSnapshot(() => {
      unsubscribe();
      done();
    });

    streamHelper.waitForData().then(() => {
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
    });
  });

  it('handles invalid listen protos', function() {
    return watchHelper.runFailedTest(collQueryJSON(), () => {
      // Mock the server responding to the query with an invalid proto.
      streamHelper.write({invalid: true});
      return watchHelper.waitForSnapshot();
    }, 'Unknown listen response type: {"invalid":true}');
  });

  it('handles invalid target change protos', function() {
    return watchHelper.runFailedTest(collQueryJSON(), () => {
      // Mock the server responding to the query with an invalid proto.
      streamHelper.write({
        targetChange: {
          targetChangeType: 'INVALID',
          targetIds: [0xFEED],
        }
      });
      return watchHelper.waitForSnapshot();
    }, 'Unknown target change type: {"targetChangeType":"INVALID",' +
      '"targetIds":[65261]}');
  });

  it('handles remove target change protos', function() {
    return watchHelper.runFailedTest(collQueryJSON(), () => {
      watchHelper.sendRemoveTarget();
      return watchHelper.waitForSnapshot();
    }, 'Error 13: internal error');
  });

  it('handles remove target change with code', function() {
    return watchHelper.runFailedTest(collQueryJSON(), () => {
      watchHelper.sendRemoveTarget(7);
      return watchHelper.waitForSnapshot();
    }, 'Error 7: test remove');
  });

  it('handles changing a doc', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1, {foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        // Add another result.
        watchHelper.sendDoc(doc2, {foo: 'b'});
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [
            snapshot(doc1, {foo: 'a'}),
            snapshot(doc2, {foo: 'b'})
          ],
          docChanges: [added(doc2, {foo: 'b'})]
        });

        // Change a result.
        watchHelper.sendDoc(doc2, {bar: 'c'});
        watchHelper.sendSnapshot(4);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(4, results, {
          docs: [
            snapshot(doc1, {foo: 'a'}),
            snapshot(doc2, {bar: 'c'})
          ],
          docChanges: [modified(doc2, {bar: 'c'})]
        });
      });
    });
  });

  it('reconnects after error', function() {
    let resumeToken = [0xABCD];

    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent(resumeToken);
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendSnapshot(2, resumeToken);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });
        assert.equal(1, streamHelper.streamCount);
        streamHelper.destroyStream();
        return streamHelper.waitForError();
      }).then(() => {
        return streamHelper.waitForData(resumeTokenQuery(resumeToken));
      }).then(() => {
        watchHelper.sendAddTarget();
        watchHelper.sendDoc(doc2,{foo: 'b'});

        resumeToken = [0xBCDE];
        watchHelper.sendSnapshot(3, resumeToken);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [
            snapshot(doc1, {foo: 'a'}),
            snapshot(doc2, {foo: 'b'})
          ],
          docChanges: [added(doc2, {foo: 'b'})]
        });
        streamHelper.destroyStream();
        return streamHelper.waitForError();
      }).then(() => {
        return streamHelper.waitForData(resumeTokenQuery(resumeToken));
      }).then(() => {
        watchHelper.sendAddTarget();
        watchHelper.sendDoc(doc3, {foo: 'c'});
        watchHelper.sendSnapshot(4, resumeToken);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        assert.equal(3, streamHelper.streamCount);
        snapshotsEqual(4, results, {
          docs: [
            snapshot(doc1, {foo: 'a'}),
            snapshot(doc2, {foo: 'b'}),
            snapshot(doc3, {foo: 'c'})
          ],
          docChanges: [added(doc3, {foo: 'c'})]
        });
      });
    });
  });

  it('ignores non-matching tokens', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();

      watchHelper.sendCurrent();
      let resumeToken = [0xABCD];
      watchHelper.sendSnapshot(1, resumeToken);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});

        // Send snapshot with non-matching target id.
        streamHelper.write({
          targetChange: {
            targetChangeType: 'NO_CHANGE',
            targetIds: [0xFEED],
            readTime: { seconds: 0, nanos: 0 },
            resumeToken: [0xBCDE]
          }
        });

        // Send snapshot with matching target id but no resume token.
        // The old token continues to be used.
        streamHelper.write({
          targetChange: {
            targetChangeType: 'NO_CHANGE',
            targetIds: [],
            readTime: { seconds: 0, nanos: 0 },
          }
        });

        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(0, results, {
          docs: [
            snapshot(doc1, {foo: 'a'})
          ],
          docChanges: [added(doc1, {foo: 'a'})]
        });
        streamHelper.destroyStream();
        return streamHelper.waitForError();
      }).then(() => {
        return streamHelper.waitForData(resumeTokenQuery(resumeToken));
      }).then(() => {
        assert.equal(streamHelper.streamCount, 2);
      });
    });
  });

  it('only reconnects after progress', function() {
    return watchHelper.startWatch(collQueryJSON()).then(() => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      let resumeToken = [0xABCD];
      watchHelper.sendSnapshot(1, resumeToken);
      return watchHelper.waitForSnapshot();
    }).then((results) => {
      snapshotsEqual(1, results, {docs: [], docChanges: [] });
      assert.equal(streamHelper.streamCount, 1);
      streamHelper.destroyStream();
      return streamHelper.waitForError();
    }).then(() => {
      return streamHelper.waitForData();
    }).then(() => {
      assert.equal(streamHelper.streamCount, 2);
      // This second stream doesn't get re-opened because the server did not
      // send any data.
      streamHelper.destroyStream();
      return streamHelper.waitForError();
    }).then(() => {
      return watchHelper.waitForSnapshot();
    }).catch((err) => {
      assert.equal(err.message, 'Error: Server disconnect');
      assert.equal(streamHelper.streamCount, 2);
    });
  });

  it('sorts docs', function() {
    watchHelper = new WatchHelper(streamHelper, sortedQuery(), targetId);

    return watchHelper.runTest(sortedQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, {docs: [], docChanges: []});

        // Add two result.
        watchHelper.sendDoc(doc1,{foo: 'b'});
        watchHelper.sendDoc(doc2,{foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [
            snapshot(doc1, {foo: 'b'}),
            snapshot(doc2, {foo: 'a'})
          ],
          docChanges: [
            added(doc1, {foo: 'b'}),
            added(doc2, {foo: 'a'}),
          ]
        });

        // Change the results so they sort in a different order.
        watchHelper.sendDoc(doc1,{foo: 'c'});
        watchHelper.sendDoc(doc2,{foo: 'd'});
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [
            snapshot(doc2, {foo: 'd'}),
            snapshot(doc1, {foo: 'c'})
          ],
          docChanges: [
            modified(doc2, {foo: 'd'}),
            modified(doc1, {foo: 'c'})
          ]
        });
      });
    });
  });

  it('combines multiple change events for the same doc', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();

      // Add a result.
      watchHelper.sendDoc(doc1,{foo: 'a'});
      // Modify it.
      watchHelper.sendDoc(doc1,{foo: 'b'});
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, {
          docs: [snapshot(doc1, {foo: 'b'})],
          docChanges: [added(doc1, {foo: 'b'})]
        });

        // Modify it two more times.
        watchHelper.sendDoc(doc1,{foo: 'c'});
        watchHelper.sendDoc(doc1,{foo: 'd'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'd'})],
          docChanges: [modified(doc1, {foo: 'd'})]
        });

        // Remove it, delete it, and then add it again.
        watchHelper.sendDocRemove(doc1,{foo: 'e'});
        watchHelper.sendDocDelete(doc1);
        watchHelper.sendDoc(doc1,{foo: 'f'});
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [snapshot(doc1, {foo: 'f'})],
          docChanges: [modified(doc1, {foo: 'f'})]
        });
      });
    });
  });

  it('can sort by __name__', function() {
    let query = sortedQuery();
    let expectedJson = sortedQueryJSON();

    // Add __name__ sorting
    query = query.orderBy('__name__', 'desc');
    expectedJson.addTarget.query.structuredQuery.orderBy.push({
      direction: 'DESCENDING',
      field: { fieldPath: '__name__' }
    });

    watchHelper = new WatchHelper(streamHelper, query, targetId);

    return watchHelper.runTest(expectedJson, () => {
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then(() => {
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendDoc(doc2,{foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [
            snapshot(doc2, {foo: 'a'}),
            snapshot(doc1, {foo: 'a'})
          ],
          docChanges: [
            added(doc2, {foo: 'a'}),
            added(doc1, {foo: 'a'})
          ]
        });
      });
    });
  });

  it('sorts document changes in the right order', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();

      watchHelper.sendDoc(doc1,{foo: 'a'});
      watchHelper.sendDoc(doc2,{foo: 'a'});
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, {
          docs: [
            snapshot(doc1, {foo: 'a'}),
            snapshot(doc2, {foo: 'a'})
          ],
          docChanges: [
            added(doc1, {foo: 'a'}),
            added(doc2, {foo: 'a'})
          ]});

        watchHelper.sendDoc(doc2,{foo: 'b'});
        watchHelper.sendDoc(doc3,{foo: 'b'});
        watchHelper.sendDocDelete(doc1);
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [
            snapshot(doc2, {foo: 'b'}),
            snapshot(doc3, {foo: 'b'})
          ],
          docChanges: [
            removed(doc1, {foo: 'a'}),
            added(doc3, {foo: 'b'}),
            modified(doc2, {foo: 'b'})
          ]});
      });
    });
  });

  it('handles changing a doc so it doesn\'t match', function() {
    watchHelper = new WatchHelper(streamHelper, includeQuery(), targetId);

    return watchHelper.runTest(includeQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, {docs: [], docChanges: []});

        // Add a result.
        watchHelper.sendDoc(doc1,{included: 'yes'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {included: 'yes'})],
          docChanges: [added(doc1, {included: 'yes'})]
        });

        // Add another result.
        watchHelper.sendDoc(doc2,{included: 'yes'});
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [
            snapshot(doc1, {included: 'yes'}),
            snapshot(doc2, {included: 'yes'})
          ],
          docChanges: [added(doc2, {included: 'yes'})]
        });

        // Change a result.
        watchHelper.sendDocRemove(doc2,{included: 'no'});
        watchHelper.sendSnapshot(4);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(4, results, {
          docs: [snapshot(doc1, {included: 'yes'})],
          docChanges: [removed(doc2, {included: 'yes'})]
        });
      });
    });
  });

  it('handles deleting a doc', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        // Add another result.
        watchHelper.sendDoc(doc2,{foo: 'b'});
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [
            snapshot(doc1, {foo: 'a'}),
            snapshot(doc2, {foo: 'b'})
          ],
          docChanges: [added(doc2, {foo: 'b'})]
        });

        // Delete a result.
        watchHelper.sendDocDelete(doc2);
        watchHelper.sendSnapshot(4);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(4, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [removed(doc2, {foo: 'b'})]
        });
      });
    });
  });

  it('handles removing a doc', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        // Add another result.
        watchHelper.sendDoc(doc2,{foo: 'b'});
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [
            snapshot(doc1, {foo: 'a'}),
            snapshot(doc2, {foo: 'b'})
          ],
          docChanges: [added(doc2, {foo: 'b'})]
        });

        // Delete a result.
        watchHelper.sendDocRemove(doc2);
        watchHelper.sendSnapshot(4);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(4, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [removed(doc2, {foo: 'b'})]
        });
      });
    });
  });

  it('handles deleting a non-existent doc', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        // Delete a different doc.
        watchHelper.sendDocDelete(doc2);
        watchHelper.sendSnapshot(3);
      });
    });
  });

  it('handles reset', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add three results.
        watchHelper.sendDoc(doc1, {foo: 'a'});
        watchHelper.sendDoc(doc2, {foo: 'b'});
        watchHelper.sendDoc(doc3, {foo: 'c'});

        // Send the snapshot. Note that we do not increment the snapshot version
        // to keep the update time the same.
        watchHelper.sendSnapshot(1);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(1, results, {
          docs: [
            snapshot(doc1, {foo: 'a'}),
            snapshot(doc2, {foo: 'b'}),
            snapshot(doc3, {foo: 'c'})
          ],
          docChanges: [
            added(doc1, {foo: 'a'}),
            added(doc2, {foo: 'b'}),
            added(doc3, {foo: 'c'})
          ]
        });

        // Send a RESET.
        streamHelper.write({
          targetChange: {
            targetChangeType: 'RESET',
            targetIds: [],
          }
        });

        // Send the same doc1, a modified doc2, no doc3, and a new doc4.
        // Send a different result.
        watchHelper.sendDoc(doc1, {foo: 'a'});
        watchHelper.snapshotVersion = 2;
        watchHelper.sendDoc(doc2, {foo: 'bb'});
        watchHelper.sendDoc(doc4, {foo: 'd'});
        watchHelper.sendCurrent();
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [
            snapshot(doc1, {foo: 'a'}),
            snapshot(doc2, {foo: 'bb'}),
            snapshot(doc4, {foo: 'd'})
          ],
          docChanges: [
            removed(doc3, {foo: 'c'}),
            added(doc4, {foo: 'd'}),
            modified(doc2, {foo: 'bb'})
          ]
        });
      });
    });
  });

  it('handles reset with phantom doc', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        // Change the first doc.
        watchHelper.sendDoc(doc1,{foo: 'b'});
        // Send a doc change that should be ignored after reset.
        watchHelper.sendDoc(doc2,{foo: 'c'});

        // Send a RESET.
        streamHelper.write({
          targetChange: {
            targetChangeType: 'RESET',
            targetIds: [],
          }
        });

        // Change the first doc again.
        watchHelper.sendDoc(doc1,{foo: 'd'});

        // Take a snapshot.
        watchHelper.sendCurrent();
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [snapshot(doc1, {foo: 'd'})],
          docChanges: [modified(doc1, {foo: 'd'})]
        });
      });
    });
  });

  it('handles sending the snapshot version multiple times', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendSnapshot(2);
        watchHelper.sendSnapshot(3);
        watchHelper.sendSnapshot(4);
        watchHelper.sendSnapshot(5);
        watchHelper.sendSnapshot(6);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });
      });
    });
  });

  it('handles filter mismatch', function() {
    let oldRequestStream;

    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        // Send a filter that doesn't match. Make sure the stream gets reopened.
        oldRequestStream = streamHelper.writeStream;
        streamHelper.write({filter: {count: 0}});
        return streamHelper.waitForEnd();
      }).then(() => {
        return streamHelper.waitForData();
      }).then((request) => {
        assert.equal(streamHelper.streamCount, 2);
        assert.notEqual(oldRequestStream, streamHelper.writeStream);
        assert.deepEqual(collQueryJSON(), request);

        watchHelper.sendAddTarget();
        watchHelper.sendCurrent();
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [],
          docChanges: [removed(doc1, {foo: 'a'})]
        });
      });
    });
  });

  it('handles filter match', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      watchHelper.sendAddTarget();
      // Add a result.
      watchHelper.sendDoc(doc1,{foo: 'a'});
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        // Send the filter count for the previously added documents.
        streamHelper.write({filter: {count: 1}});

        // Even sending a new snapshot version should be a no-op.
        watchHelper.sendCurrent();
        watchHelper.sendSnapshot(2);

        watchHelper.sendDoc(doc2,{foo: 'b'});
        watchHelper.sendCurrent();
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        assert.equal(streamHelper.streamCount, 1);
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'}), snapshot(doc2, {foo: 'b'})],
          docChanges: [added(doc2, {foo: 'b'})]
        });
      });
    });
  });

  it('handles resets with pending updates', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      watchHelper.sendAddTarget();
      // Add a result.
      watchHelper.sendDoc(doc1,{foo: 'a'});
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        watchHelper.sendDoc(doc1,{foo: 'b'});
        watchHelper.sendDoc(doc2,{foo: 'c'});
        watchHelper.sendDoc(doc3,{foo: 'd'});
        streamHelper.write({filter: {count: 3}});

        watchHelper.sendDoc(doc1,{foo: 'd'});
        watchHelper.sendDoc(doc2,{foo: 'e'});
        watchHelper.sendDocDelete(doc3);
        streamHelper.write({filter: {count: 2}});

        watchHelper.sendCurrent();
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        assert.equal(streamHelper.streamCount, 1);
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'd'}), snapshot(doc2, {foo: 'e'})],
          docChanges: [added(doc2, {foo: 'e'}), modified(doc1, {foo: 'd'})]
        });
      });
    });
  });

  it('handles add and delete in same snapshot', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendDocDelete(doc1);
        watchHelper.sendDoc(doc2,{foo: 'b'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc2, {foo: 'b'})],
          docChanges: [added(doc2, {foo: 'b'})]
        });
      });
    });
  });

  it('handles non-changing modify', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        // Send the snapshot. Note that we do not increment the snapshot version
        // to keep the update time the same.
        watchHelper.sendSnapshot(1);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(1, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendDoc(doc1,{foo: 'b'});
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendDoc(doc2,{foo: 'c'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'}), snapshot(doc2, {foo: 'c'})],
          docChanges: [added(doc2, {foo: 'c'})]
        });
      });
    });
  });

  it('handles update time change', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        // Send the same document but with a different update time
        streamHelper.write({
          documentChange: {
            document: {
              name: doc1.formattedName,
              fields: DocumentSnapshot.encodeFields({foo: 'a'}),
              createTime: {seconds: 1, nanos: 2},
              updateTime: {seconds: 3, nanos: 5}
            },
            targetIds: [targetId],
          },
        });
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(3, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [modified(doc1, {foo: 'a'})]
        });
      });
    });
  });

  it('handles delete and re-add in same snapshot', function() {
    return watchHelper.runTest(collQueryJSON(), () => {
      // Mock the server responding to the query.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((results) => {
        snapshotsEqual(1, results, { docs: [], docChanges: [] });

        // Add a result.
        watchHelper.sendDoc(doc1,{foo: 'a'});
        watchHelper.sendSnapshot(1);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(1, results, {
          docs: [snapshot(doc1, {foo: 'a'})],
          docChanges: [added(doc1, {foo: 'a'})]
        });

        // Delete a doc and send the same doc again. Note that we did not
        // increment the snapshot version to keep the update time the same.
        watchHelper.sendDocDelete(doc1);
        watchHelper.sendDoc(doc1,{foo: 'a'});

        watchHelper.sendDoc(doc2,{foo: 'b'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();
      }).then((results) => {
        snapshotsEqual(2, results, {
          docs: [snapshot(doc1, {foo: 'a'}), snapshot(doc2, {foo: 'b'})],
          docChanges: [added(doc2, {foo: 'b'})]
        });
      });
    });
  });
});

describe('DocumentReference watch', function() {
  // The document to query.
  let doc;

  let firestore;
  let targetId;
  let watchHelper;
  let streamHelper;

  // The proto JSON that should be sent for the watch.
  const watchJSON = () => {
    return {
      database: 'projects/test-project/databases/(default)',
      addTarget: {
        documents: {
          documents: [doc.formattedName]
        },
        targetId: targetId
      }
    };
  };

  // The proto JSON that should be sent for a resumed query.
  const resumeTokenJSON = (resumeToken) => {
    return {
      database: 'projects/test-project/databases/(default)',
      addTarget: {
        documents: {
          documents: [doc.formattedName]
        },
        targetId: targetId,
        resumeToken: resumeToken
      },
    };
  };

  beforeEach(function() {
    firestore = createInstance();
    targetId = 0xF0;
    doc = firestore.doc('col/doc');
    streamHelper = new StreamHelper(firestore);
    watchHelper = new WatchHelper(streamHelper, doc, targetId);
  });

  it('with invalid callbacks', function() {
    assert.throws(() => {
      doc.onSnapshot('foo');
    }, /Argument "onNext" is not a valid function./);

    assert.throws(() => {
      doc.onSnapshot(() => {}, 'foo');
    }, /Argument "onError" is not a valid function./);
  });

  it('without error callback', function(done) {
    let unsubscribe = doc.onSnapshot(() => {
      unsubscribe();
      done();
    });

    streamHelper.waitForData().then(() => {
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
    });
  });

  it('handles invalid listen protos', function() {
    return watchHelper.runFailedTest(watchJSON(), () => {
      // Mock the server responding to the watch with an invalid proto.
      streamHelper.write({invalid: true});
      return watchHelper.waitForSnapshot();
    }, 'Unknown listen response type: {"invalid":true}');
  });

  it('handles invalid target change protos', function() {
    return watchHelper.runFailedTest(watchJSON(), () => {
      // Mock the server responding to the watch with an invalid proto.
      streamHelper.write({
        targetChange: {
          targetChangeType: 'INVALID',
          targetIds: [0xFEED],
        }
      });
      return watchHelper.waitForSnapshot();
    }, 'Unknown target change type: {"targetChangeType":"INVALID",' +
      '"targetIds":[65261]}');
  });

  it('handles remove target change protos', function() {
    return watchHelper.runFailedTest(watchJSON(), () => {
      watchHelper.sendRemoveTarget();
      return watchHelper.waitForSnapshot();
    }, 'Error 13: internal error');
  });

  it('handles remove target change with code', function() {
    return watchHelper.runFailedTest(watchJSON(), () => {
      watchHelper.sendRemoveTarget(7);
      return watchHelper.waitForSnapshot();
    }, 'Error 7: test remove');
  });

  it('handles changing a doc', function() {
    return watchHelper.runTest(watchJSON(), () => {
      // Mock the server responding to the watch.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then(snapshot => {
        assert.equal(snapshot.exists, false);

        // Add a result.
        watchHelper.sendDoc(doc, {foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then(snapshot => {
        assert.equal(snapshot.exists, true);
        assert.equal(snapshot.createTime, '1970-01-01T00:00:01.000000002Z');
        assert.equal(snapshot.updateTime, '1970-01-01T00:00:03.000000001Z');
        assert.equal(snapshot.get('foo'), 'a');

        // Change the document.
        watchHelper.sendDoc(doc, {foo: 'b'});
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();
      }).then(snapshot => {
        assert.equal(snapshot.exists, true);
        assert.equal(snapshot.get('foo'), 'b');
      });
    });
  });

  it('ignores non-matching  doc', function() {
    return watchHelper.runTest(watchJSON(), () => {
      // Mock the server responding to the watch.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then(snapshot => {
        assert.equal(snapshot.exists, false);

        streamHelper.write({
          documentChange: {
            document: {
              name: doc.parent.formattedName + '/wrong',
              fields: {},
              createTime: {seconds: 1, nanos: 2},
              updateTime: {seconds: 3, nanos: 4},
            },
            targetIds: [targetId],
          },
        });

        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then(snapshot => {
        assert.equal(snapshot.exists, false);
      });
    });
  });

  it('reconnects after error', function() {
    let resumeToken = [0xABCD];

    return watchHelper.runTest(watchJSON(), () => {
      // Mock the server responding to the watch.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then(snapshot => {
        assert.equal(snapshot.exists, false);

        // Add a result.
        watchHelper.sendDoc(doc, {foo: 'a'});
        watchHelper.sendSnapshot(2, resumeToken);
        return watchHelper.waitForSnapshot();

      }).then(snapshot => {
        assert.equal(snapshot.exists, true);
        assert.equal(snapshot.get('foo'), 'a');

        streamHelper.destroyStream();
        return streamHelper.waitForError();
      }).then(() => {
        return streamHelper.waitForData(resumeTokenJSON(resumeToken));
      }).then(() => {
        // Change the document.
        watchHelper.sendDoc(doc, {foo: 'b'});
        watchHelper.sendSnapshot(3, resumeToken);
        return watchHelper.waitForSnapshot();
      }).then(snapshot => {
        assert.equal(snapshot.exists, true);
        assert.equal(snapshot.get('foo'), 'b');

        // Remove the document.
        watchHelper.sendDocDelete(doc);
        watchHelper.sendSnapshot(4);
        return watchHelper.waitForSnapshot();
      }).then(snapshot => {
        assert.equal(snapshot.exists, false);
        assert.equal(streamHelper.streamCount, 2);
      });
    });
  });

  it('combines multiple change events for the same doc', function() {
    return watchHelper.runTest(watchJSON(), () => {
      // Mock the server responding to the watch.
      watchHelper.sendAddTarget();

      // Add a result.
      watchHelper.sendDoc(doc, {foo: 'a'});
      // Modify it.
      watchHelper.sendDoc(doc, {foo: 'b'});
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then((snapshot) => {
        assert.equal(snapshot.get('foo'), 'b');

        // Modify it two more times.
        watchHelper.sendDoc(doc, {foo: 'c'});
        watchHelper.sendDoc(doc, {foo: 'd'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((snapshot) => {
        assert.equal(snapshot.get('foo'), 'd');

        // Remove it, delete it, and then add it again.
        watchHelper.sendDocRemove(doc, {foo: 'e'});
        watchHelper.sendDocDelete(doc);
        watchHelper.sendDoc(doc, {foo: 'f'});
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((snapshot) => {
        assert.equal(snapshot.get('foo'), 'f');
      });
    });
  });

  it('handles deleting a doc', function() {
    return watchHelper.runTest(watchJSON(), () => {
      // Mock the server responding to the watch.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then(snapshot => {
        assert.equal(snapshot.exists, false);

        // Add a result.
        watchHelper.sendDoc(doc, {foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();
      }).then(snapshot => {
        assert.equal(snapshot.exists, true);

        // Delete the document.
        watchHelper.sendDocDelete(doc);
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();
      }).then(snapshot => {
        assert.equal(snapshot.exists, false);
      });
    });
  });

  it('handles removing a doc', function() {
    return watchHelper.runTest(watchJSON(), () => {
      // Mock the server responding to the watch.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then(snapshot => {
        assert.equal(snapshot.exists, false);

        // Add a result.
        watchHelper.sendDoc(doc, {foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();
      }).then(snapshot => {
        assert.equal(snapshot.exists, true);

        // Remove the document.
        watchHelper.sendDocRemove(doc);
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();
      }).then(snapshot => {
        assert.equal(snapshot.exists, false);
      });
    });
  });

  it('handles reset', function() {
    return watchHelper.runTest(watchJSON(), () => {
      // Mock the server responding to the watch.
      watchHelper.sendAddTarget();
      watchHelper.sendCurrent();
      watchHelper.sendSnapshot(1);
      return watchHelper.waitForSnapshot().then(() => {
        // Add three results.
        watchHelper.sendDoc(doc, {foo: 'a'});
        watchHelper.sendSnapshot(2);
        return watchHelper.waitForSnapshot();

      }).then((snapshot) => {
        assert.equal(snapshot.get('foo'), 'a');

        // Send a RESET.
        streamHelper.write({
          targetChange: {
            targetChangeType: 'RESET',
            targetIds: [],
          }
        });

        // Send the modified doc.
        watchHelper.sendDoc(doc, {foo: 'b'});
        watchHelper.sendCurrent();
        watchHelper.sendSnapshot(3);
        return watchHelper.waitForSnapshot();

      }).then((snapshot) => {
        assert.equal(snapshot.get('foo'), 'b');
      });
    });
  });
});

describe('Query comparator', function() {
  let firestore;
  let colRef;
  let doc1, doc2, doc3, doc4;

  beforeEach(function() {
    firestore = createInstance();

    colRef = firestore.collection('col');

    doc1 = firestore.doc('col/doc1');
    doc2 = firestore.doc('col/doc2');
    doc3 = firestore.doc('col/doc3');
    doc4 = firestore.doc('col/doc4');
  });

  function testSort(query, input, expected) {
    const comparator = query.comparator();
    input.sort(comparator);
    const actual = new QuerySnapshot(query, '1970-01-01T00:00:00.000000001Z',
        immutable.List(input).toMap(), []);
    snapshotsEqual(1, actual, { docs: expected, docChanges: [] });
  }

  it('handles basic case', function() {
    const query = colRef.orderBy('foo');

    const input = [
      snapshot(doc3, { foo: 2 }),
      snapshot(doc4, { foo: 1 }),
      snapshot(doc2, { foo: 2 }),
    ];

    const expected = [
      snapshot(doc4, { foo: 1 }),
      snapshot(doc2, { foo: 2 }),
      snapshot(doc3, { foo: 2 }),
    ];

    testSort(query, input, expected);
  });

  it('handles descending case', function() {
    const query = colRef.orderBy('foo', 'desc');

    const input = [
      snapshot(doc3, { foo: 2 }),
      snapshot(doc4, { foo: 1 }),
      snapshot(doc2, { foo: 2 }),
    ];

    const expected = [
      snapshot(doc3, { foo: 2 }),
      snapshot(doc2, { foo: 2 }),
      snapshot(doc4, { foo: 1 }),
    ];

    testSort(query, input, expected);
  });

  it('handles nested fields', function() {
    const query = colRef.orderBy('foo.bar');

    const input = [
      snapshot(doc1, { foo: { bar: 1 } }),
      snapshot(doc2, { foo: { bar: 2 } }),
      snapshot(doc3, { foo: { bar: 2 } }),
    ];

    const expected = [
      snapshot(doc1, { foo: { bar: 1 } }),
      snapshot(doc2, { foo: { bar: 2 } }),
      snapshot(doc3, { foo: { bar: 2 } }),
    ];

    testSort(query, input, expected);
  });

  it('fails on missing fields', function() {
    const query = colRef.orderBy('bar');

    const input = [
      snapshot(doc3, { foo: 2 }),
      snapshot(doc1, { foo: 1 }),
      snapshot(doc2, { foo: 2 }),
    ];

    const comparator = query.comparator();
    assert.throws(() => {
      input.sort(comparator);
    }, /Trying to compare documents on fields that don't exist/);
  });

  // TODO(klimt): Add this test back when we add implicit ordering.
  /*
   it('handles implicit ordering', function() {
   const query = coll.where('foo', '<=', 5);

   const input = [
   snapshot(doc3, { foo: 2 }),
   snapshot(doc4, { foo: 1 }),
   snapshot(doc2, { foo: 2 }),
   ];

   const expected = [
   snapshot(doc4, { foo: 1 }),
   snapshot(doc2, { foo: 2 }),
   snapshot(doc3, { foo: 2 }),
   ];

   testSort(query, input, expected);
   });
   */
});
