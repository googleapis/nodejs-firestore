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

import * as assert from 'assert';
import * as rbtree from 'functional-red-black-tree';

import {google} from '../protos/firestore_proto_api';
import {ExponentialBackoff} from './backoff';
import {DocumentSnapshotBuilder, QueryDocumentSnapshot} from './document';
import {DocumentChange, DocumentChangeType} from './document-change';
import {DocumentReference, Firestore, Query} from './index';
import {logger} from './logger';
import {QualifiedResourcePath} from './path';
import {Timestamp} from './timestamp';
import {GrpcError, RBTree} from './types';
import {requestTag} from './util';

import api = google.firestore.v1;

/*!
 * Target ID used by watch. Watch uses a fixed target id since we only support
 * one target per stream.
 * @type {number}
 */
const WATCH_TARGET_ID = 0x1;

/*!
 * Sentinel value for a document remove.
 */
const REMOVED = {} as DocumentSnapshotBuilder;

/*!
 * The change type for document change events.
 */
// tslint:disable-next-line:variable-name
const ChangeType: {[k: string]: DocumentChangeType} = {
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
const GRPC_STATUS_CODE: {[k: string]: number} = {
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
const DOCUMENT_WATCH_COMPARATOR = (
  doc1: QueryDocumentSnapshot,
  doc2: QueryDocumentSnapshot
) => {
  assert(doc1 === doc2, 'Document watches only support one document.');
  return 0;
};

const EMPTY_FUNCTION = () => {};

/**
 * @private
 * @callback docsCallback
 * @returns {Array.<QueryDocumentSnapshot>} An ordered list of documents.
 */

/**
 * @private
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
 * @param {Timestamp} readTime The time at which this snapshot was obtained.
 * @param {number} size The number of documents in the result set.
 * @param {docsCallback} docs A callback that returns the ordered list of
 * documents stored in this snapshot.
 * @param {changeCallback} changes A callback that returns the list of
 * changed documents since the last snapshot delivered for this watch.
 */

type DocumentComparator = (
  l: QueryDocumentSnapshot,
  r: QueryDocumentSnapshot
) => number;

interface DocumentChangeSet {
  deletes: string[];
  adds: QueryDocumentSnapshot[];
  updates: QueryDocumentSnapshot[];
}

/**
 * Watch provides listen functionality and exposes the 'onSnapshot' observer. It
 * can be used with a valid Firestore Listen target.
 *
 * @class
 * @private
 */
abstract class Watch {
  protected readonly firestore: Firestore;
  private readonly backoff: ExponentialBackoff;
  private readonly requestTag: string;

  /**
   * Indicates whether we are interested in data from the stream. Set to false in the
   * 'unsubscribe()' callback.
   * @private
   */
  private isActive = true;

  /**
   * The current stream to the backend.
   * @private
   */
  private currentStream: NodeJS.ReadWriteStream | null = null;

  /**
   * The server assigns and updates the resume token.
   * @private
   */
  private resumeToken: Uint8Array | undefined = undefined;

  /**
   * A map of document names to QueryDocumentSnapshots for the last sent snapshot.
   * @private
   */
  private docMap = new Map<string, QueryDocumentSnapshot>();

  /**
   * The accumulated map of document changes (keyed by document name) for the
   * current snapshot.
   * @private
   */
  private changeMap = new Map<string, DocumentSnapshotBuilder>();

  /**
   * The current state of the query results. *
   * @private
   */
  private current = false;

  /**
   * The sorted tree of QueryDocumentSnapshots as sent in the last snapshot.
   * We only look at the keys.
   * @private
   */
  private docTree: RBTree | undefined;

  /**
   * We need this to track whether we've pushed an initial set of changes,
   * since we should push those even when there are no changes, if there
   * aren't docs.
   * @private
   */
  private hasPushed = false;

  private onNext: (
    readTime: Timestamp,
    size: number,
    docs: () => QueryDocumentSnapshot[],
    changes: () => DocumentChange[]
  ) => void;

  private onError: (error: Error) => void;

  /**
   * @private
   * @hideconstructor
   *
   * @param firestore The Firestore Database client.
   */
  constructor(firestore: Firestore) {
    this.firestore = firestore;
    this.backoff = new ExponentialBackoff();
    this.requestTag = requestTag();
    this.onNext = EMPTY_FUNCTION;
    this.onError = EMPTY_FUNCTION;
  }

  /**  Returns a 'Target' proto denoting the target to listen on. */
  protected abstract getTarget(resumeToken?: Uint8Array): api.ITarget;

  /**
   * Returns a comparator for QueryDocumentSnapshots that is used to order the
   * document snapshots returned by this watch.
   */
  protected abstract getComparator(): DocumentComparator;

  /**
   * Starts a watch and attaches a listener for document change events.
   *
   * @private
   * @param onNext A callback to be called every time a new snapshot is
   * available.
   * @param onError A callback to be called if the listen fails or is cancelled.
   * No further callbacks will occur.
   *
   * @returns An unsubscribe function that can be called to cancel the snapshot
   * listener.
   */
  onSnapshot(
    onNext: (
      readTime: Timestamp,
      size: number,
      docs: () => QueryDocumentSnapshot[],
      changes: () => DocumentChange[]
    ) => void,
    onError: (error: Error) => void
  ): () => void {
    assert(
      this.onNext === EMPTY_FUNCTION,
      'onNext should not already be defined.'
    );
    assert(
      this.onError === EMPTY_FUNCTION,
      'onError should not already be defined.'
    );
    assert(
      this.docTree === undefined,
      'docTree should not already be defined.'
    );
    this.onNext = onNext;
    this.onError = onError;
    this.docTree = rbtree(this.getComparator());

    this.initStream();

    return () => {
      logger('Watch.onSnapshot', this.requestTag, 'Ending stream');
      // Prevent further callbacks.
      this.isActive = false;
      this.onNext = () => {};
      this.onError = () => {};
      if (this.currentStream) {
        this.currentStream.end();
      }
    };
  }

  /**
   * Returns the current count of all documents, including the changes from
   * the current changeMap.
   * @private
   */
  private currentSize(): number {
    const changes = this.extractCurrentChanges(Timestamp.now());
    return this.docMap.size + changes.adds.length - changes.deletes.length;
  }

  /**
   * Splits up document changes into removals, additions, and updates.
   * @private
   */
  private extractCurrentChanges(readTime: Timestamp): DocumentChangeSet {
    const deletes: string[] = [];
    const adds: QueryDocumentSnapshot[] = [];
    const updates: QueryDocumentSnapshot[] = [];

    this.changeMap.forEach((value, name) => {
      if (value === REMOVED) {
        if (this.docMap.has(name)) {
          deletes.push(name);
        }
      } else if (this.docMap.has(name)) {
        value.readTime = readTime;
        updates.push(value.build() as QueryDocumentSnapshot);
      } else {
        value.readTime = readTime;
        adds.push(value.build() as QueryDocumentSnapshot);
      }
    });

    return {deletes, adds, updates};
  }

  /**
   * Helper to clear the docs on RESET or filter mismatch.
   * @private
   */
  private resetDocs(): void {
    logger('Watch.resetDocs', this.requestTag, 'Resetting documents');
    this.changeMap.clear();
    this.resumeToken = undefined;

    this.docTree.forEach((snapshot: QueryDocumentSnapshot) => {
      // Mark each document as deleted. If documents are not deleted, they
      // will be send again by the server.
      this.changeMap.set(snapshot.ref.path, REMOVED);
    });

    this.current = false;
  }

  /**
   * Closes the stream and calls onError() if the stream is still active.
   * @private
   */
  private closeStream(err: GrpcError): void {
    if (this.currentStream) {
      this.currentStream.end();
      this.currentStream = null;
    }

    if (this.isActive) {
      this.isActive = false;
      logger('Watch.closeStream', this.requestTag, 'Invoking onError: ', err);
      this.onError(err);
    }
  }

  /**
   * Re-opens the stream unless the specified error is considered permanent.
   * Clears the change map.
   * @private
   */
  private maybeReopenStream(err: GrpcError): void {
    if (this.currentStream) {
      this.currentStream = null;
    }

    if (this.isActive && !this.isPermanentError(err)) {
      logger(
        'Watch.maybeReopenStream',
        this.requestTag,
        'Stream ended, re-opening after retryable error: ',
        err
      );
      this.changeMap.clear();

      if (this.isResourceExhaustedError(err)) {
        this.backoff.resetToMax();
      }

      this.initStream();
    } else {
      this.closeStream(err);
    }
  }

  /**
   * Helper to restart the outgoing stream to the backend.
   * @private
   */
  private resetStream(): void {
    logger('Watch.resetStream', this.requestTag, 'Restarting stream');
    if (this.currentStream) {
      this.currentStream.end();
      this.currentStream = null;
    }
    this.initStream();
  }

  /**
   * Initializes a new stream to the backend with backoff.
   * @private
   */
  private initStream(): void {
    this.backoff
      .backoffAndWait()
      .then(async () => {
        if (!this.isActive) {
          logger(
            'Watch.initStream',
            this.requestTag,
            'Not initializing inactive stream'
          );
          return;
        }

        await this.firestore.initializeIfNeeded();

        const request: api.IListenRequest = {};
        request.database = this.firestore.formattedName;
        request.addTarget = this.getTarget(this.resumeToken);

        // Note that we need to call the internal _listen API to pass additional
        // header values in readWriteStream.
        return this.firestore
          .readWriteStream('listen', request, this.requestTag, true)
          .then(backendStream => {
            if (!this.isActive) {
              logger(
                'Watch.initStream',
                this.requestTag,
                'Closing inactive stream'
              );
              backendStream.end();
              return;
            }
            logger('Watch.initStream', this.requestTag, 'Opened new stream');
            this.currentStream = backendStream;
            this.currentStream!.on('data', (proto: api.IListenResponse) => {
              this.onData(proto);
            })
              .on('error', err => {
                this.maybeReopenStream(err);
              })
              .on('end', () => {
                const err = new GrpcError('Stream ended unexpectedly');
                err.code = GRPC_STATUS_CODE.UNKNOWN;
                this.maybeReopenStream(err);
              });
            this.currentStream!.resume();
          });
      })
      .catch(err => {
        this.closeStream(err);
      });
  }

  /**
   * Handles 'data' events and closes the stream if the response type is
   * invalid.
   * @private
   */
  private onData(proto: api.IListenResponse): void {
    if (proto.targetChange) {
      logger('Watch.onData', this.requestTag, 'Processing target change');
      const change = proto.targetChange;
      const noTargetIds = !change.targetIds || change.targetIds.length === 0;
      if (change.targetChangeType === 'NO_CHANGE') {
        if (noTargetIds && change.readTime && this.current) {
          // This means everything is up-to-date, so emit the current
          // set of docs as a snapshot, if there were changes.
          this.pushSnapshot(
            Timestamp.fromProto(change.readTime),
            change.resumeToken!
          );
        }
      } else if (change.targetChangeType === 'ADD') {
        if (WATCH_TARGET_ID !== change.targetIds![0]) {
          this.closeStream(Error('Unexpected target ID sent by server'));
        }
      } else if (change.targetChangeType === 'REMOVE') {
        let code = 13;
        let message = 'internal error';
        if (change.cause) {
          code = change.cause.code!;
          message = change.cause.message!;
        }
        // @todo: Surface a .code property on the exception.
        this.closeStream(new Error('Error ' + code + ': ' + message));
      } else if (change.targetChangeType === 'RESET') {
        // Whatever changes have happened so far no longer matter.
        this.resetDocs();
      } else if (change.targetChangeType === 'CURRENT') {
        this.current = true;
      } else {
        this.closeStream(
          new Error('Unknown target change type: ' + JSON.stringify(change))
        );
      }

      if (
        change.resumeToken &&
        this.affectsTarget(change.targetIds!, WATCH_TARGET_ID)
      ) {
        this.backoff.reset();
      }
    } else if (proto.documentChange) {
      logger('Watch.onData', this.requestTag, 'Processing change event');

      // No other targetIds can show up here, but we still need to see
      // if the targetId was in the added list or removed list.
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

      const document = proto.documentChange.document!;
      const name = document.name!;
      const relativeName = QualifiedResourcePath.fromSlashSeparatedString(name)
        .relativeName;

      if (changed) {
        logger('Watch.onData', this.requestTag, 'Received document change');
        const snapshot = new DocumentSnapshotBuilder();
        snapshot.ref = this.firestore.doc(relativeName);
        snapshot.fieldsProto = document.fields || {};
        snapshot.createTime = Timestamp.fromProto(document.createTime!);
        snapshot.updateTime = Timestamp.fromProto(document.updateTime!);
        this.changeMap.set(relativeName, snapshot);
      } else if (removed) {
        logger('Watch.onData', this.requestTag, 'Received document remove');
        this.changeMap.set(relativeName, REMOVED);
      }
    } else if (proto.documentDelete || proto.documentRemove) {
      logger('Watch.onData', this.requestTag, 'Processing remove event');
      const name = (proto.documentDelete || proto.documentRemove)!.document!;
      const relativeName = QualifiedResourcePath.fromSlashSeparatedString(name)
        .relativeName;
      this.changeMap.set(relativeName, REMOVED);
    } else if (proto.filter) {
      logger('Watch.onData', this.requestTag, 'Processing filter update');
      if (proto.filter.count !== this.currentSize()) {
        // We need to remove all the current results.
        this.resetDocs();
        // The filter didn't match, so re-issue the query.
        this.resetStream();
      }
    } else {
      this.closeStream(
        new Error('Unknown listen response type: ' + JSON.stringify(proto))
      );
    }
  }

  /**
   * Checks if the current target id is included in the list of target ids.
   * If no targetIds are provided, returns true.
   * @private
   */
  private affectsTarget(
    targetIds: number[] | undefined,
    currentId: number
  ): boolean {
    if (targetIds === undefined || targetIds.length === 0) {
      return true;
    }

    for (const targetId of targetIds) {
      if (targetId === currentId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Assembles a new snapshot from the current set of changes and invokes the
   * user's callback. Clears the current changes on completion.
   * @private
   */
  private pushSnapshot(
    readTime: Timestamp,
    nextResumeToken?: Uint8Array
  ): void {
    const appliedChanges = this.computeSnapshot(readTime);

    if (!this.hasPushed || appliedChanges.length > 0) {
      logger(
        'Watch.pushSnapshot',
        this.requestTag,
        'Sending snapshot with %d changes and %d documents',
        String(appliedChanges.length),
        this.docTree.length
      );
      // We pass the current set of changes, even if `docTree` is modified later.
      const currentTree = this.docTree;
      this.onNext(
        readTime,
        currentTree.length,
        () => currentTree.keys,
        () => appliedChanges
      );
      this.hasPushed = true;
    }

    this.changeMap.clear();
    this.resumeToken = nextResumeToken;
  }

  /**
   * Applies a document delete to the document tree and the document map.
   * Returns the corresponding DocumentChange event.
   * @private
   */
  private deleteDoc(name: string): DocumentChange {
    assert(this.docMap.has(name), 'Document to delete does not exist');
    const oldDocument = this.docMap.get(name)!;
    const existing = this.docTree.find(oldDocument);
    const oldIndex = existing.index;
    this.docTree = existing.remove();
    this.docMap.delete(name);
    return new DocumentChange(ChangeType.removed, oldDocument, oldIndex, -1);
  }

  /**
   * Applies a document add to the document tree and the document map. Returns
   * the corresponding DocumentChange event.
   * @private
   */
  private addDoc(newDocument: QueryDocumentSnapshot): DocumentChange {
    const name = newDocument.ref.path;
    assert(!this.docMap.has(name), 'Document to add already exists');
    this.docTree = this.docTree.insert(newDocument, null);
    const newIndex = this.docTree.find(newDocument).index;
    this.docMap.set(name, newDocument);
    return new DocumentChange(ChangeType.added, newDocument, -1, newIndex);
  }

  /**
   * Applies a document modification to the document tree and the document map.
   * Returns the DocumentChange event for successful modifications.
   * @private
   */
  private modifyDoc(newDocument: QueryDocumentSnapshot): DocumentChange | null {
    const name = newDocument.ref.path;
    assert(this.docMap.has(name), 'Document to modify does not exist');
    const oldDocument = this.docMap.get(name)!;
    if (!oldDocument.updateTime.isEqual(newDocument.updateTime)) {
      const removeChange = this.deleteDoc(name);
      const addChange = this.addDoc(newDocument);
      return new DocumentChange(
        ChangeType.modified,
        newDocument,
        removeChange.oldIndex,
        addChange.newIndex
      );
    }
    return null;
  }

  /**
   * Applies the mutations in changeMap to both the document tree and the
   * document lookup map. Modified docMap in-place and returns the updated
   * state.
   * @private
   */
  private computeSnapshot(readTime: Timestamp): DocumentChange[] {
    const changeSet = this.extractCurrentChanges(readTime);
    const appliedChanges: DocumentChange[] = [];

    // Process the sorted changes in the order that is expected by our clients
    // (removals, additions, and then modifications). We also need to sort the
    // individual changes to assure that oldIndex/newIndex keep incrementing.
    changeSet.deletes.sort((name1, name2) => {
      // Deletes are sorted based on the order of the existing document.
      return this.getComparator()(
        this.docMap.get(name1)!,
        this.docMap.get(name2)!
      );
    });
    changeSet.deletes.forEach(name => {
      const change = this.deleteDoc(name);
      appliedChanges.push(change);
    });

    changeSet.adds.sort(this.getComparator());
    changeSet.adds.forEach(snapshot => {
      const change = this.addDoc(snapshot);
      appliedChanges.push(change);
    });

    changeSet.updates.sort(this.getComparator());
    changeSet.updates.forEach(snapshot => {
      const change = this.modifyDoc(snapshot);
      if (change) {
        appliedChanges.push(change);
      }
    });

    assert(
      this.docTree.length === this.docMap.size,
      'The update document ' +
        'tree and document map should have the same number of entries.'
    );

    return appliedChanges;
  }

  /**
   * Determines whether an error is considered permanent and should not be
   * retried. Errors that don't provide a GRPC error code are always considered
   * transient in this context.
   *
   * @private
   * @param error An error object.
   * @return Whether the error is permanent.
   */
  private isPermanentError(error: GrpcError): boolean {
    if (error.code === undefined) {
      logger(
        'Watch.isPermanentError',
        this.requestTag,
        'Unable to determine error code: ',
        error
      );
      return false;
    }

    switch (error.code) {
      case GRPC_STATUS_CODE.ABORTED:
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
   * @param error A GRPC Error object that exposes an error code.
   * @return Whether we need to back off our retries.
   */
  private isResourceExhaustedError(error: GrpcError): boolean {
    return error.code === GRPC_STATUS_CODE.RESOURCE_EXHAUSTED;
  }
}

/**
 * Creates a new Watch instance to listen on DocumentReferences.
 *
 * @private
 */
export class DocumentWatch extends Watch {
  constructor(firestore: Firestore, private readonly ref: DocumentReference) {
    super(firestore);
  }

  getComparator(): DocumentComparator {
    return DOCUMENT_WATCH_COMPARATOR;
  }

  getTarget(resumeToken?: Uint8Array): google.firestore.v1.ITarget {
    const formattedName = this.ref.formattedName;
    return {
      documents: {
        documents: [formattedName],
      },
      targetId: WATCH_TARGET_ID,
      resumeToken,
    };
  }
}

/**
 * Creates a new Watch instance to listen on Queries.
 *
 * @private
 */
export class QueryWatch extends Watch {
  private comparator: DocumentComparator;

  constructor(firestore: Firestore, private readonly query: Query) {
    super(firestore);
    this.comparator = query.comparator();
  }

  getComparator(): DocumentComparator {
    return this.query.comparator();
  }

  getTarget(resumeToken?: Uint8Array): google.firestore.v1.ITarget {
    const query = this.query.toProto();
    return {query, targetId: WATCH_TARGET_ID, resumeToken};
  }
}
