/*!
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

const assert = require('assert');
const rbtree = require('functional-red-black-tree');
const through = require('through2');

/*!
 * Injected.
 *
 * @see DocumentChange
 */
let DocumentChange;

/*!
 * Injected.
 *
 * @see DocumentReference
 */
let DocumentReference;

/*!
 * Injected.
 *
 * @see DocumentSnapshot
 */
let DocumentSnapshot;

/*!
 * Injected.
 *
 * @see Firestore
 */
let Firestore;

/*!
 * @see ResourcePath
 */
let ResourcePath = require('./path').ResourcePath;

/*!
 * Target ID used by watch. Watch uses a fixed target id since we only support
 * one target per stream.
 *
 * @private
 * @type {number}
 */
const WATCH_TARGET_ID = 0xf0;

/*!
 * The change type for document change events.
 */
const ChangeType = {
  added: 'added',
  modified: 'modified',
  removed: 'removed',
};

/*!
 * The comparator used for document watches (which should always get called with
 * the same document).
 */
const DOCUMENT_WATCH_COMPARATOR = (doc1, doc2) => {
  assert(doc1 === doc2, 'Document watches only support one document.');
  return 0;
};

/**
 * @callback docsCallback
 * @returns {Array.<DocumentSnapshot>} An ordered list of documents.
 */

/**
 * @callback changeCallback
 * @returns {Array.<DocumentChange>} An ordered list of document
 * changes.
 */

/**
 * onSnapshot() callback that receives a DocumentSnapshot.
 *
 * @callback watchSnapshotCallback
 *
 * @param {string} readTime - The ISO 8601 time at which this snapshot was
 * obtained.
 * @param {docsCallback} docs - A callback that returns the ordered list of
 * documents stored in this snapshot.
 * @param {changeCallback} changes - A callback that returns the list of
 * changed documents since the last snapshot delivered for this watch.
 */

/**
 * Watch provides listen functionality and exposes the 'onSnapshot' observer. It
 * can be used with a valid Firestore Listen target.
 *
 * @class
 * @private
 */
class Watch {
  /**
   * @private
   * @hideconstructor
   *
   * @param {Firestore} firestore The Firestore Database client.
   * @param {Object} targetChange - A Firestore 'TargetChange' proto denoting
   * the target to listen on.
   * @param {function} comparator - A comparator for DocumentSnapshots that
   * is used to order the document snapshots returned by this watch.
   */
  constructor(firestore, targetChange, comparator) {
    this._firestore = firestore;
    this._api = firestore.api;
    this._targetChange = targetChange;
    this._comparator = comparator;
  }

  /**
   * Creates a new Watch instance to listen on DocumentReferences.
   *
   * @private
   * @param {DocumentReference} documentRef - The document
   * reference for this watch.
   * @returns {Watch} A newly created Watch instance.
   */
  static forDocument(documentRef) {
    return new Watch(
      documentRef.firestore,
      {
        documents: {
          documents: [documentRef.formattedName],
        },
        targetId: WATCH_TARGET_ID,
      },
      DOCUMENT_WATCH_COMPARATOR
    );
  }

  /**
   * Creates a new Watch instance to listen on Queries.
   *
   * @private
   * @param {Query} query - The query used for this watch.
   * @returns {Watch} A newly created Watch instance.
   */
  static forQuery(query) {
    return new Watch(
      query.firestore,
      {
        query: query.toProto(),
        targetId: WATCH_TARGET_ID,
      },
      query.comparator()
    );
  }

  /**
   * Starts a watch and attaches a listener for document change events.
   *
   * @private
   * @param {watchSnapshotCallback} onNext - A callback to be called every time
   * a new snapshot is available.
   * @param {function(Error)} onError - A callback to be called if the listen
   * fails or is cancelled. No further callbacks will occur.
   *
   * @returns {function()} An unsubscribe function that can be called to cancel
   * the snapshot listener.
   */
  onSnapshot(onNext, onError) {
    let self = this;

    // The sorted tree of DocumentSnapshots as sent in the last snapshot. We
    // only look at the keys.
    let docTree = rbtree(this._comparator);
    // A map of document names to DocumentSnapshots for the last sent snapshot.
    let docMap = new Map();
    // The accumulates map of document changes (keyed by document name) for the
    // current snapshot.
    let changeMap = new Map();

    // The current state of the query results.
    let current = false;
    // We need this to track whether we've pushed an initial set of changes,
    // since we should push those even when there are no changes, if there \
    // aren't docs.
    let hasPushed = false;
    // The server assigns and updates the resume token.
    let resumeToken = undefined;

    // Indicates whether we are interested in data from the stream. Set to false
    // in the the 'unsubscribe()' callback.
    let isActive = true;

    // Set to true when we have received a data message from the stream.
    let isHealthy = false;

    // Sentinel value for a document remove.
    const REMOVED = {};

    const request = {
      database: this._firestore.formattedName,
      addTarget: this._targetChange,
    };

    // We may need to replace the underlying stream on reset events.
    // This is the one that will be returned and proxy the current one.
    const stream = through.obj();
    // The current stream to the backend.
    let currentStream = null;

    /** Helper to clear the docs on RESET or filter mismatch. */
    const resetDocs = function() {
      Firestore.log('Watch.onSnapshot', 'Resetting documents');
      changeMap.clear();
      resumeToken = undefined;

      docTree.forEach(snapshot => {
        // Mark each document as deleted. If documents are not deleted, they
        // will be send again by the server.
        changeMap.set(snapshot.ref.formattedName, REMOVED);
      });

      current = false;
    };

    /** Calls onError() and closes the stream. */
    const sendError = function(errMessage) {
      if (currentStream) {
        currentStream.unpipe(stream);
        currentStream.end();
        currentStream = null;
      }
      isActive = false;
      stream.end();
      Firestore.log(
        'Watch.onSnapshot',
        'Invoking onError with: %s',
        errMessage
      );
      onError(new Error(errMessage));
    };

    /**
     * If the stream was previously healthy, we'll retry once and then give up.
     */
    const maybeReopenStream = function(err) {
      if (isActive && isHealthy) {
        Firestore.log('Watch.onSnapshot', 'Stream ended, re-opening');
        request.addTarget.resumeToken = resumeToken;
        changeMap.clear();
        resetStream();
      } else if (err) {
        Firestore.log('Watch.onSnapshot', 'Stream ended, sending error: ', err);
        sendError(err);
      }
    };

    /** Helper to restart the outgoing stream to the backend. */
    const resetStream = function() {
      Firestore.log('Watch.onSnapshot', 'Opening new stream');
      if (currentStream) {
        currentStream.unpipe(stream);
        currentStream.end();
        currentStream = null;
      }

      isHealthy = false;

      // Note that we need to call the internal _listen API to pass additional
      // header values in readWriteStream.
      self._firestore
        .readWriteStream(
          self._api.Firestore._listen.bind(self._api.Firestore),
          request,
          /* allowRetries= */ true
        )
        .then(backendStream => {
          if (!isActive) {
            Firestore.log('Watch.onSnapshot', 'Closing inactive stream');
            backendStream.end();
            return;
          }

          Firestore.log('Watch.onSnapshot', 'Opened new stream');
          currentStream = backendStream;
          currentStream.on('error', err => {
            maybeReopenStream(err);
          });
          currentStream.on('end', () => {
            maybeReopenStream();
          });
          currentStream.pipe(stream);
          currentStream.resume();
        })
        .catch(sendError);
    };

    /**
     * Checks if the current target id is included in the list of target ids.
     * If no targetIds are provided, returns true.
     */
    const affectsTarget = function(targetIds, currentId) {
      if (targetIds === undefined || targetIds.length === 0) {
        return true;
      }

      for (let targetId of targetIds) {
        if (targetId === currentId) {
          return true;
        }
      }

      return false;
    };

    /** Splits up document changes into removals, additions, and updates. */
    const extractChanges = function(docMap, changes, readTime) {
      let deletes = [];
      let adds = [];
      let updates = [];

      changes.forEach((value, name) => {
        if (value === REMOVED) {
          if (docMap.has(name)) {
            deletes.push(name);
          }
        } else if (docMap.has(name)) {
          value.readTime = readTime;
          updates.push(value.build());
        } else {
          value.readTime = readTime;
          adds.push(value.build());
        }
      });

      return {deletes, adds, updates};
    };

    /**
     * Applies the mutations in changeMap to both the document tree and the
     * document lookup map. Modified docMap in-place and returns the updated
     * state.
     */
    const computeSnapshot = function(docTree, docMap, changes) {
      let updatedTree = docTree;
      let updatedMap = docMap;

      assert(
        docTree.length === docMap.size,
        'The document tree and document ' +
          'map should have the same number of entries.'
      );

      /**
       * Applies a document delete to the document tree and the document map.
       * Returns the corresponding DocumentChange event.
       */
      const deleteDoc = function(name) {
        assert(updatedMap.has(name), 'Document to delete does not exist');
        let oldDocument = updatedMap.get(name);
        let existing = updatedTree.find(oldDocument);
        let oldIndex = existing.index;
        updatedTree = existing.remove();
        updatedMap.delete(name);
        return new DocumentChange(
          ChangeType.removed,
          oldDocument,
          oldIndex,
          -1
        );
      };

      /**
       * Applies a document add to the document tree and the document map.
       * Returns the corresponding DocumentChange event.
       */
      const addDoc = function(newDocument) {
        let name = newDocument.ref.formattedName;
        assert(!updatedMap.has(name), 'Document to add already exists');
        updatedTree = updatedTree.insert(newDocument, null);
        let newIndex = updatedTree.find(newDocument).index;
        updatedMap.set(name, newDocument);
        return new DocumentChange(ChangeType.added, newDocument, -1, newIndex);
      };

      /**
       * Applies a document modification to the document tree and the document
       * map. Returns the DocumentChange event for successful modifications.
       */
      const modifyDoc = function(newDocument) {
        let name = newDocument.ref.formattedName;
        assert(updatedMap.has(name), 'Document to modify does not exist');
        let oldDocument = updatedMap.get(name);
        if (oldDocument.updateTime !== newDocument.updateTime) {
          let removeChange = deleteDoc(name);
          let addChange = addDoc(newDocument);
          return new DocumentChange(
            ChangeType.modified,
            newDocument,
            removeChange.oldIndex,
            addChange.newIndex
          );
        }
        return null;
      };

      // Process the sorted changes in the order that is expected by our
      // clients (removals, additions, and then modifications). We also need to
      // sort the individual changes to assure that oldIndex/newIndex keep
      // incrementing.
      let appliedChanges = [];

      changes.deletes.sort((name1, name2) => {
        // Deletes are sorted based on the order of the existing document.
        return self._comparator(updatedMap.get(name1), updatedMap.get(name2));
      });
      changes.deletes.forEach(name => {
        let change = deleteDoc(name);
        if (change) {
          appliedChanges.push(change);
        }
      });

      changes.adds.sort(self._comparator);
      changes.adds.forEach(snapshot => {
        let change = addDoc(snapshot);
        if (change) {
          appliedChanges.push(change);
        }
      });

      changes.updates.sort(self._comparator);
      changes.updates.forEach(snapshot => {
        let change = modifyDoc(snapshot);
        if (change) {
          appliedChanges.push(change);
        }
      });

      assert(
        updatedTree.length === updatedMap.size,
        'The update document ' +
          'tree and document map should have the same number of entries.'
      );

      return {updatedTree, updatedMap, appliedChanges};
    };

    /**
     * Assembles a new snapshot from the current set of changes and invokes the
     * user's callback. Clears the current changes on completion.
     */
    const push = function(readTime, nextResumeToken) {
      let changes = extractChanges(docMap, changeMap, readTime);
      let diff = computeSnapshot(docTree, docMap, changes);

      if (!hasPushed || diff.appliedChanges.length > 0) {
        Firestore.log(
          'Watch.onSnapshot',
          'Sending snapshot with %d changes and %d documents',
          diff.appliedChanges.length,
          diff.updatedTree.length
        );
        onNext(
          readTime,
          () => diff.updatedTree.keys,
          () => diff.appliedChanges
        );
        hasPushed = true;
      }

      docTree = diff.updatedTree;
      docMap = diff.updatedMap;
      changeMap.clear();
      resumeToken = nextResumeToken;
    };

    /**
     * Returns the current count of all documents, including the changes from
     * the current changeMap.
     */
    const currentSize = function() {
      let changes = extractChanges(docMap, changeMap);
      return docMap.size + changes.adds.length - changes.deletes.length;
    };

    resetStream();

    stream
      .on('data', proto => {
        if (proto.targetChange) {
          Firestore.log('Watch.onSnapshot', 'Processing target change');
          const change = proto.targetChange;
          const noTargetIds =
            !change.targetIds || change.targetIds.length === 0;
          if (change.targetChangeType === 'NO_CHANGE') {
            if (noTargetIds && change.readTime && current) {
              // This means everything is up-to-date, so emit the current set of
              // docs as a snapshot, if there were changes.
              push(
                DocumentSnapshot.toISOTime(change.readTime),
                change.resumeToken
              );
            }
          } else if (change.targetChangeType === 'ADD') {
            assert(
              WATCH_TARGET_ID === change.targetIds[0],
              'Unexpected target ID sent by server'
            );
          } else if (change.targetChangeType === 'REMOVE') {
            let code = 13;
            let message = 'internal error';
            if (change.cause) {
              code = change.cause.code;
              message = change.cause.message;
            }
            // @todo: Surface a .code property on the exception.
            sendError('Error ' + code + ': ' + message);
          } else if (change.targetChangeType === 'RESET') {
            // Whatever changes have happened so far no longer matter.
            resetDocs();
          } else if (change.targetChangeType === 'CURRENT') {
            current = true;
          } else {
            sendError('Unknown target change type: ' + JSON.stringify(change));
          }

          if (
            change.resumeToken &&
            affectsTarget(change.targetIds, WATCH_TARGET_ID)
          ) {
            isHealthy = true;
          }
        } else if (proto.documentChange) {
          Firestore.log('Watch.onSnapshot', 'Processing change event');

          // No other targetIds can show up here, but we still need to see if the
          // targetId was in the added list or removed list.
          const targetIds = proto.documentChange.targetIds || [];
          const removedTargetIds = proto.documentChange.removedTargetIds || [];
          let changed = false;
          let removed = false;
          for (let i = 0; i < targetIds.length; i++) {
            if (targetIds[i] === WATCH_TARGET_ID) {
              changed = true;
            }
          }
          for (let i = 0; i < removedTargetIds.length; i++) {
            if (removedTargetIds[i] === WATCH_TARGET_ID) {
              removed = true;
            }
          }

          const document = proto.documentChange.document;
          const name = document.name;

          if (changed) {
            Firestore.log('Watch.onSnapshot', 'Received document change');
            const snapshot = new DocumentSnapshot.Builder();
            snapshot.ref = new DocumentReference(
              self._firestore,
              ResourcePath.fromSlashSeparatedString(name)
            );
            snapshot.fieldsProto = document.fields || {};
            snapshot.createTime = DocumentSnapshot.toISOTime(
              document.createTime
            );
            snapshot.updateTime = DocumentSnapshot.toISOTime(
              document.updateTime
            );
            changeMap.set(name, snapshot);
          } else if (removed) {
            Firestore.log('Watch.onSnapshot', 'Received document remove');
            changeMap.set(name, REMOVED);
          }
        } else if (proto.documentDelete || proto.documentRemove) {
          Firestore.log('Watch.onSnapshot', 'Processing remove event');
          const name = (proto.documentDelete || proto.documentRemove).document;
          changeMap.set(name, REMOVED);
        } else if (proto.filter) {
          Firestore.log('Watch.onSnapshot', 'Processing filter update');
          if (proto.filter.count !== currentSize()) {
            // We need to remove all the current results.
            resetDocs();
            // The filter didn't match, so re-issue the query.
            resetStream();
          }
        } else {
          sendError('Unknown listen response type: ' + JSON.stringify(proto));
        }
      })
      .on('end', () => {
        Firestore.log('Watch.onSnapshot', 'Processing stream end');
        isActive = false;
        if (currentStream) {
          // Pass the event on to the underlying stream.
          currentStream.end();
        }
      });

    return () => {
      Firestore.log('Watch.onSnapshot', 'Ending stream');
      // Prevent further callbacks.
      isActive = false;
      onNext = () => {};
      onError = () => {};
      stream.end();
    };
  }
}

module.exports = (
  FirestoreType,
  DocumentChangeType,
  DocumentReferenceType,
  DocumentSnapshotType
) => {
  Firestore = FirestoreType;
  DocumentChange = DocumentChangeType;
  DocumentReference = DocumentReferenceType;
  DocumentSnapshot = DocumentSnapshotType;
  return Watch;
};
