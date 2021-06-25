/*!
 * Copyright 2021 Google LLC. All Rights Reserved.
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

import {DocumentSnapshot, DocumentSnapshotBuilder} from './document';
import {DocumentReference} from './reference';
import {FieldPath} from './path';
import {isPermanentRpcError} from './util';
import {google} from '../protos/firestore_v1_proto_api';
import {logger} from './logger';
import {Firestore} from './index';
import {DocumentData} from '@google-cloud/firestore';
import api = google.firestore.v1;

/**
 * A wrapper around BatchGetDocumentsRequest that retries request upon stream
 * failure and returns ordered results.
 *
 * @private
 */
export class DocumentReader<T> {
  /** An optional field mask to apply to this read. */
  fieldMask?: FieldPath[];
  /** An optional transaction ID to use for this read. */
  transactionId?: Uint8Array;

  private outstandingDocuments = new Set<string>();
  private retrievedDocuments = new Map<string, DocumentSnapshot>();

  /**
   * Internal method to retrieve multiple documents from Firestore, optionally
   * as part of a transaction.
   *
   * @param firestore The Firestore instance to use.
   * @param allDocuments The documents to get.
   * @returns A Promise that contains an array with the resulting documents.
   */
  constructor(
    private firestore: Firestore,
    private allDocuments: Array<DocumentReference<T>>
  ) {
    for (const docRef of this.allDocuments) {
      this.outstandingDocuments.add(docRef.formattedName);
    }
  }

  /**
   * Invokes the BatchGetDocuments RPC and returns the results.
   *
   * @param requestTag A unique client-assigned identifier for this request.
   */
  async get(requestTag: string): Promise<Array<DocumentSnapshot<T>>> {
    await this.fetchDocuments(requestTag);

    // BatchGetDocuments doesn't preserve document order. We use the request
    // order to sort the resulting documents.
    const orderedDocuments: Array<DocumentSnapshot<T>> = [];

    for (const docRef of this.allDocuments) {
      const document = this.retrievedDocuments.get(docRef.formattedName);
      if (document !== undefined) {
        // Recreate the DocumentSnapshot with the DocumentReference
        // containing the original converter.
        const finalDoc = new DocumentSnapshotBuilder(
          docRef as DocumentReference<T>
        );
        finalDoc.fieldsProto = document._fieldsProto;
        finalDoc.readTime = document.readTime;
        finalDoc.createTime = document.createTime;
        finalDoc.updateTime = document.updateTime;
        orderedDocuments.push(finalDoc.build());
      } else {
        throw new Error(`Did not receive document for "${docRef.path}".`);
      }
    }

    return orderedDocuments;
  }

  private async fetchDocuments(requestTag: string): Promise<void> {
    if (!this.outstandingDocuments.size) {
      return;
    }

    const request: api.IBatchGetDocumentsRequest = {
      database: this.firestore.formattedName,
      transaction: this.transactionId,
      documents: Array.from(this.outstandingDocuments),
    };

    if (this.fieldMask) {
      const fieldPaths = this.fieldMask.map(
        fieldPath => fieldPath.formattedName
      );
      request.mask = {fieldPaths};
    }

    const responses: api.BatchGetDocumentsResponse[] = [];
    try {
      const stream = await this.firestore.requestStream(
        'batchGetDocuments',
        request,
        requestTag
      );
      stream.resume();

      // Gather results in a temporary array since Node12 does not handle
      // exceptions thrown within a `for await` loop.
      for await (const response of stream) {
        responses.push(response);
      }

      for (const response of responses) {
        let snapshot: DocumentSnapshot<DocumentData>;

        if (response.found) {
          logger(
            'DocumentReader.fetchDocuments',
            requestTag,
            'Received document: %s',
            response.found.name!
          );
          snapshot = this.firestore.snapshot_(
            response.found,
            response.readTime!
          );
        } else {
          logger(
            'DocumentReader.fetchDocuments',
            requestTag,
            'Document missing: %s',
            response.missing!
          );
          snapshot = this.firestore.snapshot_(
            response.missing!,
            response.readTime!
          );
        }

        const path = snapshot.ref.formattedName;
        this.outstandingDocuments.delete(path);
        this.retrievedDocuments.set(path, snapshot);
      }
    } catch (error) {
      const shouldRetry =
        // Transactional reads are retried via the transaction runner.
        !this.transactionId &&
        // Only retry if we made progress.
        responses.length > 0 &&
        // Don't retry permanent errors.
        error.code !== undefined &&
        !isPermanentRpcError(error, 'batchGetDocuments');

      logger(
        'DocumentReader.fetchDocuments',
        requestTag,
        'BatchGetDocuments failed with error: %s. Retrying: %s',
        error,
        shouldRetry
      );
      if (shouldRetry) {
        return this.fetchDocuments(requestTag);
      } else {
        throw error;
      }
    } finally {
      logger(
        'DocumentReader.fetchDocuments',
        requestTag,
        'Received %d results',
        responses.length
      );
    }
  }
}
