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

/*!
 * @module firestore/watch
 */

'use strict';

let assert = require('assert');
let immutable = require('immutable');
let is = require('is');
let through = require('through2');

/**
 * Injected.
 *
 * @private
 * @type firestore.DocumentChange
 */
let DocumentChange;

/**
 * Injected.
 *
 * @private
 * @type firestore.DocumentReference
 */
let DocumentReference;

/**
 * Injected.
 *
 * @private
 * @type firestore.DocumentSnapshot
 */
let DocumentSnapshot;

/**
 * @private
 * @type firestore.Path
 */
let Path = require('./path');

/**
 * Target ID used by watch. Watch uses a fixed target id since we only support
 * one target per stream.
 *
 * @private
 * @type number
 */
const WATCH_TARGET_ID = 0xF0;

/**
 * The change type for document change events.
 *
 * @package
 */
const ChangeType =  {
  added: 'added',
  modified: 'modified',
  removed: 'removed'
};

/**
 * onSnapshot_() callback that receives a DocumentSnapshot.
 *
 * @package
 * @callback watchSnapshotCallback
 *
 * @param {string} readTime - The ISO 8601 time at which this snapshot was
 * obtained.
 * @param {Immutable.Map<string,firestore.DocumentSnapshot>} docMap - A
 * map (stored as a mapping from document key => DocumentSnapshot) of all
 * documents that match this watch.
 * @param {Map.<string,firestore.DocumentChange>} changeMap - A map
 * (stored as a mapping from document key => DocumentChange) of changed
 * documents since the last snapshot delivered for the watch.
 */


/**
 * Watch provides listen functionality and exposes the 'onSnapshot' observer. It
 * can be used with a valid Firestore Listen target.
 *
 * @package
 * @alias firestore.Watch
 */
class Watch {
  /*
   * @proctected
   * @param {firestore.Firestore} firestore The Firestore Database client.
   * @param {Object} targetChange - A Firestore 'TargetChange' proto denoting
   * the target to listen on.
   */
  constructor(firestore, targetChange) {
    this._firestore = firestore;
    this._api = firestore.api;
    this._targetChange = targetChange;
  }

  /**
   * Creates a new Watch instance to listen on DocumentReferences.
   *
   * @package
   *
   * @param {firestore.DocumentReference} documentRef - The document
   * reference for this watch.
   * @return {firestore.Watch} A newly created Watch instance.
   */
  static forDocument(documentRef) {
    return new Watch(documentRef.firestore, {
      documents: {
        documents: [documentRef.formattedName]
      },
      targetId: WATCH_TARGET_ID
    });
  }

  /**
   * Creates a new Watch instance to listen on Queries.
   *
   * @package
   *
   * @param {firestore.Query} query - The query used for this watch.
   * @return {firestore.Watch} A newly created Watch instance.
   */
  static forQuery(query) {
    return new Watch(query.firestore, {
      query: query.toProto(),
      targetId: WATCH_TARGET_ID
    });
  }


  /**
   * Starts a watch and attaches a listener for document change events.
   *
   * @package
   *
   * @param {watchSnapshotCallback} onNext - A callback to be called every time
   * a new snapshot is available.
   * @param {function(Error)} onError - A callback to be called if the listen
   * fails or is cancelled. No further callbacks will occur.
   *
   * @return {function()} An unsubscribe function that can be called to cancel
   * the snapshot listener.
   */
  onSnapshot(onNext, onError) {
    let self = this;

    // The current state of the query results.
    let docMap = immutable.Map();
    let current = false;
    let changeMap = new Map();
    // We need this to track whether we've pushed an initial set of changes,
    // since we should push those even when there are no changes, if there \
    // aren't docs.
    let hasPushed = false;
    // The server assigns and updates the resume token.
    let resumeToken = null;

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
      changeMap.clear();

      docMap.forEach((value, key) => {
        // Mark each document as deleted. If documents are not deleted, they
        // will be send again by the server.
        changeMap.set(key, REMOVED);
      });

      current = false;
    };

    /** Calls onError() and closes the stream. */
    const sendError = function(errMessage) {
      stream.end();
      if (currentStream) {
        currentStream.unpipe(stream);
        currentStream.end();
        currentStream = null;
      }
      onError(new Error(errMessage));
    };

    /** Helper to restart the outgoing stream to the backend. */
    const resetStream = function() {
      if (currentStream) {
        currentStream.unpipe(stream);
        currentStream.end();
        currentStream = null;
      }
      self._firestore.readWriteStream(
          self._api.Firestore.listen.bind(self._api.Firestore)
      ).then(backendStream => {
        currentStream = backendStream;
        currentStream.on('error', (err) => {
          if (!is.null(resumeToken)) {
            request.addTarget.resumeToken = resumeToken;
            resumeToken = null;
            resetStream();
          } else {
            sendError(err);
          }
        });
        currentStream.pipe(stream);
        currentStream.write(request);
      });
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

    /**
     * Updates the documents in mutableMap and mutableChanges to match the
     * current in-memory state.
     */
    const computeChanges = function(mutableMap, mutableChanges, readTime) {
      mutableChanges = mutableChanges || [];
      changeMap.forEach((value, name) => {
        let oldDocument = mutableMap.get(name);

        if (value === REMOVED) {
          if (is.defined(oldDocument)) {
            mutableChanges.push(
                new DocumentChange(ChangeType.removed, oldDocument));
            mutableMap.delete(name);
          }
        } else {
          value.readTime = readTime;
          let newDocument = value.build();

          if (!is.defined(oldDocument)) {
            mutableChanges.push(new DocumentChange(ChangeType.added,
                newDocument));
            mutableMap.set(name, newDocument);
          } else if (newDocument.updateTime !== oldDocument.updateTime) {
            mutableChanges.push(
                new DocumentChange(ChangeType.modified, newDocument));
            mutableMap.set(name, newDocument);
          }
        }
      });
    };

    /**
     * Assembles a new snapshot from the current set of changes and invokes the
     * user's callback. Clears the current changes on completion.
     */
    const push = function(readTime) {
      let changes = [];

      docMap = docMap.withMutations(mutableMap => {
        computeChanges(mutableMap, changes, readTime);
      });

      if (!hasPushed || changes.length > 0) {
        onNext(readTime, docMap, changes);
        hasPushed = true;
      }

      changeMap.clear();
    };

    /**
     * Returns the current count of all documents, including the changes from
     * the current changeMap.
     */
    const currentSize = function() {
      return docMap.withMutations(mutableMap => {
        computeChanges(mutableMap);
      }).size;
    };

    resetStream();

    stream.on('data', proto => {
      if (proto.targetChange) {
        const change = proto.targetChange;
        const noTargetIds = !change.targetIds || change.targetIds.length === 0;
        if (change.targetChangeType === 'NO_CHANGE') {
          if (noTargetIds && change.readTime && current) {
            // This means everything is up-to-date, so emit the current set of
            // docs as a snapshot, if there were changes.
            push(DocumentSnapshot.toISOTime(change.readTime));
          }
        } else if (change.targetChangeType === 'ADD') {
          assert(WATCH_TARGET_ID === change.targetIds[0],
              'Unexpected target ID sent by server');
        } else if (change.targetChangeType === 'REMOVE') {
          // TODO(klimt): Wrap this error up nicely.
          let code = 13;
          let message = 'internal error';
          if (change.cause) {
            code = change.cause.code;
            message = change.cause.message;
          }
          // @todo: Surface a .code property on the exception.
          sendError('Error ' + code + ': ' + message);
          return;
        } else if (change.targetChangeType === 'RESET') {
          // Whatever changes have happened so far no longer matter.
          resetDocs();
        } else if (change.targetChangeType === 'CURRENT') {
          current = true;
        } else {
          sendError('Unknown target change type: ' + JSON.stringify(change));
          return;
        }

        if (change.resumeToken &&
            affectsTarget(change.targetIds, WATCH_TARGET_ID)) {
          resumeToken = change.resumeToken;
        }
      } else if (proto.documentChange) {
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
          const snapshot = new DocumentSnapshot.Builder();
          snapshot.ref = new DocumentReference(
              self.firestore, Path.fromName(name));
          snapshot.fieldsProto = document.fields  || {};
          snapshot.createTime = DocumentSnapshot.toISOTime(document.createTime);
          snapshot.updateTime = DocumentSnapshot.toISOTime(document.updateTime);
          changeMap.set(name, snapshot);
        } else if (removed) {
          changeMap.set(name, REMOVED);
        }
      } else if (proto.documentDelete || proto.documentRemove) {
        const name = (proto.documentDelete || proto.documentRemove).document;
        changeMap.set(name, REMOVED);
      } else if (proto.filter) {
        if (proto.filter.count !== currentSize()) {
          // We need to remove all the current results.
          resetDocs();
          // The filter didn't match, so re-issue the query.
          resetStream();
        }
      } else {
        sendError('Unknown listen response type: ' + JSON.stringify(proto));
      }
    }).on('end', () => {
      if (currentStream) {
        // Pass the event on to the underlying stream.
        currentStream.end();
      }
    });

    return () => {
      // Prevent further callbacks.
      onNext = () => {};
      onError = console.error;
      stream.end();
    };
  }
}

module.exports = (DocumentChangeType, DocumentReferenceType,
                  DocumentSnapshotType) => {
                    DocumentChange = DocumentChangeType;
                    DocumentReference = DocumentReferenceType;
                    DocumentSnapshot = DocumentSnapshotType;
                    return Watch;
                  };
