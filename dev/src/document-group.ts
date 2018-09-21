/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import deepEqual from 'deep-equal';
import * as through2 from 'through2';

import {google} from '../protos/firestore_proto_api';
import api = google.firestore.v1beta1;

import {DocumentSnapshot} from './document';
import {logger} from './logger';
import {FieldPath} from './path';
import {DocumentReference, QuerySnapshot} from './reference';
import {AnyDuringMigration} from './types';
import {requestTag} from './util';
import {Watch} from './watch';

/**
 * A `DocumentGroup` combines read operations for multiple documents and
 * supports efficient retrieval for groups of documents from a Firestore
 * database.
 *
 * @class DocumentGroup
 */
export class DocumentGroup {
  private readonly validator: AnyDuringMigration;

  /**
   * @private
   * @hideconstructor
   *
   * @param {Firestore} _firestore - The Firestore Database client.
   * @param {DocumentReference[]} documents The documents to combine in this
   * document group.
   * @param {{}=} options - Read options such as transaction ID and field mask.
   */
  constructor(
      private readonly _firestore: AnyDuringMigration,
      private readonly documents: DocumentReference[],
      private readonly options:
          {transactionId?: Uint8Array, fieldMask?: FieldPath[]} = {}) {
    this.validator = _firestore._validator;
  }

  /**
   * The [Firestore]{@link Firestore} instance for the Firestore
   * database (useful for performing transactions, etc.).
   *
   * @type {Firestore}
   * @name Query#firestore
   * @readonly
   *
   * @example
   * let docA = firestore.doc('coll/a');
   * let docB = firestore.doc('coll/b');
   *
   * let documentGroup = firestore.documentGroup(docA, docB);
   *
   * let firestore = documentGroup.firestore;
   */
  get firestore() {
    return this._firestore;
  }

  /**
   * Creates and returns a new DocumentGroup instance that applies a field
   * mask to the result and returns only the specified subset of fields. You can
   * specify a list of field paths to return, or use an empty list to only
   * return the references of matching documents.
   *
   * Adding a field mask to a DocumentGroup does not filter results. Documents
   * that do not contain values for all or any of the fields in the mask will
   * continue be returned by this DocumentGroup.
   *
   * This function returns a new (immutable) instance of the DocumentGroup
   * (rather than modify the existing instance) to impose the field mask.
   * DocumentGroups that impose a field mask no longer supports real-time
   * updates via `.onSnapshot()`.
   *
   * @param  {...(string|FieldPath)} fieldPaths - The field paths to return.
   * @return {DocumentGroup} The created DocumentGroup.
   *
   * @example
   * let docA = firestore.doc('coll/a');
   * let docB = firestore.doc('coll/b');
   * let documentGroup = firestore.documentGroup(docA, docB);
   *
   * documentGroup = documentGroup.select('fieldA');
   *
   * documentGroup.get().then(snapshot => {
   *   // Only field 'fieldA' will be returned for all documents.
   * });
   */
  select(...fieldPaths: Array<string|FieldPath>) {
    const fieldMask: FieldPath[] = [];

    if (fieldPaths.length === 0) {
      fieldMask.push(FieldPath.documentId());
    } else {
      for (let i = 0; i < fieldPaths.length; ++i) {
        this.validator.isFieldPath(i, fieldPaths[i]);
        fieldMask.push(FieldPath.fromArgument(fieldPaths[i]));
      }
    }

    return new DocumentGroup(
        this._firestore, this.documents,
        {transactionId: this.options.transactionId, fieldMask});
  }

  /**
   * Retrieves the documents in this DocumentGroup. The results are ordered
   * to match the order of the references passed to `documentGroup(...)`.
   *
   * @returns {Promise.<DocumentSnapshot[]>} A Promise that will be resolved
   * with an array of DocumentSnapshots.
   *
   * @example
   * let docA = firestore.doc('coll/a');
   * let docB = firestore.doc('coll/b');
   *
   * let documentGroup = firestore.documentGroup(docA, docB);
   *
   * documentGroup.get().then(snapshot => {
   *   let dataA = snapshot.docs[0].data();
   *   let dataB = snapshot.docs[1].data();
   * });
   */
  get(): Promise<DocumentSnapshot[]> {
    const result = new Map<string, DocumentSnapshot>();
    const tag = requestTag();

    const stream = this.stream();

    return new Promise<DocumentSnapshot[]>((resolve, reject) => {
      stream
          .on('error',
              err => {
                logger(
                    'DocumentGroup.get', tag, 'Get() failed with error:', err);
                reject(err);
              })
          .on('data',
              (snapshot: DocumentSnapshot) => {
                const path = snapshot.ref.path;
                result.set(path, snapshot);
              })
          .on('end', () => {
            logger(
                'DocumentGroup.get', tag, 'Received %d results',
                String(result.size));

            // BatchGetDocuments doesn't preserve document order. We use the
            // request order to sort the resulting documents.
            const orderedDocuments: DocumentSnapshot[] = [];
            for (const docRef of this.documents) {
              const document = result.get(docRef.path);
              if (document) {
                orderedDocuments.push(document);
              } else {
                reject(new Error(
                    `Did not receive document for "${docRef.path}".`));
                return;
              }
            }
            resolve(orderedDocuments);
          });
    });
  }

  /**
   * Retrieves the documents in this DocumentGroup and returns the results as
   * Node Stream.
   *
   * Unlike `.get()`, the original input order is not preserved.
   *
   * @return {Stream.<DocumentSnapshot>} A stream of DocumentSnapshots.
   *
   * @example
   * let docA = firestore.doc('coll/a');
   * let docB = firestore.doc('coll/b');
   * let documentGroup = firestore.documentGroup(docA, docB);
   *
   * let count = 0;
   *
   * query.stream().on('data', (documentSnapshot) => {
   *   console.log(`Retrieved document with name '${documentSnapshot.id}'`);
   *   ++count;
   * }).on('end', () => {
   *   console.log(`Total count is ${count}`);
   * });
   */
  stream(): NodeJS.ReadableStream {
    const uniqueDocuments =
        removeDuplicates(this.documents.map(docRef => docRef.formattedName));

    const request: api.IBatchGetDocumentsRequest = {
      database: this.firestore.formattedName,
      transaction: this.options.transactionId,
      documents: uniqueDocuments
    };

    if (this.options.fieldMask) {
      const fieldPaths =
          this.options.fieldMask.map(fieldPath => fieldPath.formattedName);
      request.mask = {fieldPaths};
    }

    const tag = requestTag();
    const responseStream: NodeJS.ReadStream = through2.obj();

    this._firestore.readStream('batchGetDocuments', request, tag, true)
        .then(backendStream => {
          backendStream.on('error', err => {
            logger(
                'DocumentGroup.stream', tag,
                'BatchGetDocumentsRequest failed with stream error:', err);
            responseStream.destroy(err);
          });
          backendStream.on(
              'data', (response: api.BatchGetDocumentsResponse) => {
                let snapshot: DocumentSnapshot;

                try {
                  if (response.found) {
                    logger(
                        'DocumentGroup.stream', tag, 'Received document: %s',
                        response.found.name!);
                    snapshot = this._firestore.snapshot_(
                        response.found, response.readTime);
                  } else {
                    logger(
                        'DocumentGroup.stream', tag, 'Document missing: %s',
                        response.missing);
                    snapshot = this._firestore.snapshot_(
                        response.missing, response.readTime);
                  }
                  responseStream.push(snapshot);
                } catch (err) {
                  logger(
                      'DocumentGroup.stream', tag,
                      'Failed to deserialize document: %s', err);
                  backendStream.end();
                  responseStream.destroy(err);
                }
              });
          backendStream.on('end', () => {
            responseStream.end();
          });
          backendStream.resume();
        })
        .catch(err => {
          responseStream.destroy(err);
        });


    return responseStream;
  }

  /**
   * Attaches a listener to retrieve real-time change events for the document
   * in this document group.
   *
   * The results are ordered by document name and missing documents are
   * omitted. If you specified the same document reference multiple times,
   * only one copy will be included in the QuerySnapshot.
   *
   * @param {querySnapshotCallback} onNext - A callback to be called every time
   * new document data is available.
   * @param {errorCallback=} onError - A callback to be called if the listen
   * fails or is cancelled. No further callbacks will occur.
   * @return {function()} An unsubscribe function that can be called to cancel
   * the snapshot listener.
   *
   * @example
   * let docA = firestore.doc('coll/a');
   * let docB = firestore.doc('coll/b');
   * let documentGroup = firestore.documentGroup(docA, docB);
   *
   * let unsubscribe = query.onSnapshot(snapshot => {
   *   console.log(`Received document group snapshot of size ${snapshot.size}`);
   * }, err => {
   *   console.log(`Encountered error: ${err}`);
   * });
   *
   * // Remove this listener.
   * unsubscribe();
   */
  onSnapshot(
      onNext: (snapshot: QuerySnapshot) => void,
      onError?: (error: Error) => void): () => void {
    if (this.options.fieldMask) {
      throw new Error(
          'Firestore doesn\'t yet support FieldMasks with Snapshot Listeners. Calls to `select()` can only be combined with `get()` and `stream()`.');
    }

    this.validator.isFunction('onNext', onNext);
    this.validator.isOptionalFunction('onError', onError);

    onError = onError || console.error;

    const uniqueDocuments = removeDuplicates(this.documents);
    const watch = Watch.forDocuments(uniqueDocuments);

    return watch.onSnapshot((readTime, size, docs, changes) => {
      onNext(new QuerySnapshot(null, readTime, size, docs, changes));
    }, onError);
  }


  /**
   * Returns 'true' if this `DocumentGroup` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `DocumentGroup` is equal to the provided
   * value.
   */
  isEqual(other) {
    if (this === other) {
      return true;
    }

    return (
        other instanceof DocumentGroup &&
        deepEqual(this.documents, other.documents, {strict: true}) &&
        deepEqual(this.options, other.options, {strict: true}));
  }
}

function removeDuplicates<T>(array: T[]): T[] {
  return array.filter((value, index) => array.indexOf(value) === index);
}
