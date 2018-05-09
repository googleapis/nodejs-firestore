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
 * @see ExponentialBackoff
 */
let ExponentialBackoff;

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
const WATCH_TARGET_ID = 0x1;

/*!
 * The change type for document change events.
 */
const ChangeType = {
  added: 'added',
  modified: 'modified',
  removed: 'removed',
};

/*!
 * List of GRPC Error Codes.
 *
 * This corresponds to
 * {@link https://github.com/grpc/grpc/blob/master/doc/statuscodes.md}.
 */
const GRPC_STATUS_CODE = {
  // Not an error; returned on success.
  OK: 0,

  // The operation was cancelled (typically by the caller).
  CANCELLED: 1,

  // Unknown error. An example of where this error may be returned is if a
  // Status value received from another address space belongs to an error-space
  // that is not known in this address space. Also errors raised by APIs that
  // do not return enough error information may be converted to this error.
  UNKNOWN: 2,

  // Client specified an invalid argument. Note that this differs from
  // FAILED_PRECONDITION. INVALID_ARGUMENT indicates arguments that are
  // problematic regardless of the state of the system (e.g., a malformed file
  // name).
  INVALID_ARGUMENT: 3,

  // Deadline expired before operation could complete. For operations that
  // change the state of the system, this error may be returned even if the
  // operation has completed successfully. For example, a successful response
  // from a server could have been delayed long enough for the deadline to
  // expire.
  DEADLINE_EXCEEDED: 4,

  // Some requested entity (e.g., file or directory) was not found.
  NOT_FOUND: 5,

  // Some entity that we attempted to create (e.g., file or directory) already
  // exists.
  ALREADY_EXISTS: 6,

  // The caller does not have permission to execute the specified operation.
  // PERMISSION_DENIED must not be used for rejections caused by exhausting
  // some resource (use RESOURCE_EXHAUSTED instead for those errors).
  // PERMISSION_DENIED must not be used if the caller can not be identified
  // (use UNAUTHENTICATED instead for those errors).
  PERMISSION_DENIED: 7,

  // The request does not have valid authentication credentials for the
  // operation.
  UNAUTHENTICATED: 16,

  // Some resource has been exhausted, perhaps a per-user quota, or perhaps the
  // entire file system is out of space.
  RESOURCE_EXHAUSTED: 8,

  // Operation was rejected because the system is not in a state required for
  // the operation's execution. For example, directory to be deleted may be
  // non-empty, an rmdir operation is applied to a non-directory, etc.
  //
  // A litmus test that may help a service implementor in deciding
  // between FAILED_PRECONDITION, ABORTED, and UNAVAILABLE:
  //  (a) Use UNAVAILABLE if the client can retry just the failing call.
  //  (b) Use ABORTED if the client should retry at a higher-level
  //      (e.g., restarting a read-modify-write sequence).
  //  (c) Use FAILED_PRECONDITION if the client should not retry until
  //      the system state has been explicitly fixed. E.g., if an "rmdir"
  //      fails because the directory is non-empty, FAILED_PRECONDITION
  //      should be returned since the client should not retry unless
  //      they have first fixed up the directory by deleting files from it.
  //  (d) Use FAILED_PRECONDITION if the client performs conditional
  //      REST Get/Update/Delete on a resource and the resource on the
  //      server does not match the condition. E.g., conflicting
  //      read-modify-write on the same resource.
  FAILED_PRECONDITION: 9,

  // The operation was aborted, typically due to a concurrency issue like
  // sequencer check failures, transaction aborts, etc.
  //
  // See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
  // and UNAVAILABLE.
  ABORTED: 10,

  // Operation was attempted past the valid range. E.g., seeking or reading
  // past end of file.
  //
  // Unlike INVALID_ARGUMENT, this error indicates a problem that may be fixed
  // if the system state changes. For example, a 32-bit file system will
  // generate INVALID_ARGUMENT if asked to read at an offset that is not in the
  // range [0,2^32-1], but it will generate OUT_OF_RANGE if asked to read from
  // an offset past the current file size.
  //
  // There is a fair bit of overlap between FAILED_PRECONDITION and
  // OUT_OF_RANGE. We recommend using OUT_OF_RANGE (the more specific error)
  // when it applies so that callers who are iterating through a space can
  // easily look for an OUT_OF_RANGE error to detect when they are done.
  OUT_OF_RANGE: 11,

  // Operation is not implemented or not supported/enabled in this service.
  UNIMPLEMENTED: 12,

  // Internal errors. Means some invariants expected by underlying System has
  // been broken. If you see one of these errors, Something is very broken.
  INTERNAL: 13,

  // The service is currently unavailable. This is a most likely a transient
  // condition and may be corrected by retrying with a backoff.
  //
  // See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
  // and UNAVAILABLE.
  UNAVAILABLE: 14,

  // Unrecoverable data loss or corruption.
  DATA_LOSS: 15,

  // Force users to include a default branch:
  DO_NOT_USE: -1,
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
 * Determines whether an error is considered permanent and should not be
 * retried. Errors that don't provide a GRPC error code are always considered
 * transient in this context.
 *
 * @private
 * @param {Error} error An error object.
 * @return {boolean} Whether the error is permanent.
 */
function isPermanentError(error) {
  if (error.code === undefined) {
    Firestore.log(
      'Watch.onSnapshot',
      'Unable to determine error code: ',
      error
    );
    return false;
  }

  switch (error.code) {
    case GRPC_STATUS_CODE.CANCELLED:
    case GRPC_STATUS_CODE.UNKNOWN:
    case GRPC_STATUS_CODE.DEADLINE_EXCEEDED:
    case GRPC_STATUS_CODE.RESOURCE_EXHAUSTED:
    case GRPC_STATUS_CODE.INTERNAL:
    case GRPC_STATUS_CODE.UNAVAILABLE:
    case GRPC_STATUS_CODE.UNAUTHENTICATED:
      return false;
    default:
      return true;
  }
}

/**
 * Determines whether we need to initiate a longer backoff due to system
 * overload.
 *
 * @private
 * @param {Error} error A GRPC Error object that exposes an error code.
 * @return {boolean} Whether we need to back off our retries.
 */
function isResourceExhaustedError(error) {
  return error.code === GRPC_STATUS_CODE.RESOURCE_EXHAUSTED;
}

/**
 * @callback docsCallback
 * @returns {Array.<QueryDocumentSnapshot>} An ordered list of documents.
 */

/**
 * @callback changeCallback
 * @returns {Array.<DocumentChange>} An ordered list of document
 * changes.
 */

/**
 * onSnapshot() callback that receives the updated query state.
 *
 * @private
 * @callback watchSnapshotCallback
 *
 * @param {string} readTime - The ISO 8601 time at which this snapshot was
 * obtained.
 * @param {number} size - The number of documents in the result set.
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
   * @param {Object} target - A Firestore 'Target' proto denoting the target to
   * listen on.
   * @param {function} comparator - A comparator for QueryDocumentSnapshots that
   * is used to order the document snapshots returned by this watch.
   */
  constructor(firestore, target, comparator) {
    this._firestore = firestore;
    this._targets = target;
    this._comparator = comparator;
    this._backoff = new ExponentialBackoff();
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

    // The sorted tree of QueryDocumentSnapshots as sent in the last snapshot.
    // We only look at the keys.
    let docTree = rbtree(this._comparator);
    // A map of document names to QueryDocumentSnapshots for the last sent
    // snapshot.
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
    // in the 'unsubscribe()' callback.
    let isActive = true;

    // Sentinel value for a document remove.
    const REMOVED = {};

    const request = {
      database: this._firestore.formattedName,
      addTarget: this._targets,
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

    /** Closes the stream and calls onError() if the stream is still active. */
    const closeStream = function(err) {
      if (currentStream) {
        currentStream.unpipe(stream);
        currentStream.end();
        currentStream = null;
      }
      stream.end();

      if (isActive) {
        isActive = false;
        Firestore.log('Watch.onSnapshot', 'Invoking onError: ', err);
        onError(err);
      }
    };

    /**
     * Re-opens the stream unless the specified error is considered permanent.
     * Clears the change map.
     */
    const maybeReopenStream = function(err) {
      if (isActive && !isPermanentError(err)) {
        Firestore.log(
          'Watch.onSnapshot',
          'Stream ended, re-opening after retryable error: ',
          err
        );
        request.addTarget.resumeToken = resumeToken;
        changeMap.clear();

        if (isResourceExhaustedError(err)) {
          self._backoff.resetToMax();
        }

        resetStream();
      } else {
        Firestore.log('Watch.onSnapshot', 'Stream ended, sending error: ', err);
        closeStream(err);
      }
    };

    /** Helper to restart the outgoing stream to the backend. */
    const resetStream = function() {
      Firestore.log('Watch.onSnapshot', 'Opening new stream');
      if (currentStream) {
        currentStream.unpipe(stream);
        currentStream.end();
        currentStream = null;
        initStream();
      }
    };

    /**
     * Initializes a new stream to the backend with backoff.
     */
    const initStream = function() {
      self._backoff.backoffAndWait().then(() => {
        if (!isActive) {
          Firestore.log('Watch.onSnapshot', 'Not initializing inactive stream');
          return;
        }

        // Note that we need to call the internal _listen API to pass additional
        // header values in readWriteStream.
        self._firestore
          .readWriteStream('listen', request, /* allowRetries= */ true)
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
              const err = new Error('Stream ended unexpectedly');
              err.code = GRPC_STATUS_CODE.UNKNOWN;
              maybeReopenStream(err);
            });
            currentStream.pipe(stream);
            currentStream.resume();
          })
          .catch(closeStream);
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
          diff.updatedTree.length,
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

    initStream();

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
            if (WATCH_TARGET_ID !== change.targetIds[0]) {
              closeStream(Error('Unexpected target ID sent by server'));
            }
          } else if (change.targetChangeType === 'REMOVE') {
            let code = 13;
            let message = 'internal error';
            if (change.cause) {
              code = change.cause.code;
              message = change.cause.message;
            }
            // @todo: Surface a .code property on the exception.
            closeStream(new Error('Error ' + code + ': ' + message));
          } else if (change.targetChangeType === 'RESET') {
            // Whatever changes have happened so far no longer matter.
            resetDocs();
          } else if (change.targetChangeType === 'CURRENT') {
            current = true;
          } else {
            closeStream(
              new Error('Unknown target change type: ' + JSON.stringify(change))
            );
          }

          if (
            change.resumeToken &&
            affectsTarget(change.targetIds, WATCH_TARGET_ID)
          ) {
            this._backoff.reset();
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
          closeStream(
            new Error('Unknown listen response type: ' + JSON.stringify(proto))
          );
        }
      })
      .on('end', () => {
        Firestore.log('Watch.onSnapshot', 'Processing stream end');
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

  const backoff = require('./backoff')(FirestoreType);
  ExponentialBackoff = backoff.ExponentialBackoff;

  return Watch;
};
