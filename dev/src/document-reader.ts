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

  private remainingDocuments = new Set<string>();
  private retrievedDocuments = new Map<string, DocumentSnapshot>();

  /**
   * Internal method to retrieve multiple documents from Firestore, optionally
   * as part of a transaction.
   *
   * @param firestore The Firestore instance to use.
   * @param allDocuments The documents to receive.
   * @returns A Promise that contains an array with the resulting documents.
   */
  constructor(
    private firestore: Firestore,
    private allDocuments: Array<DocumentReference<T>>
  ) {
    for (const docRef of this.allDocuments) {
      this.remainingDocuments.add(docRef.formattedName);
    }
  }

  /**
   * Invokes the BatchGetDocuments RPC and returns the results.
   *
   * @param requestTag A unique client-assigned identifier for this request.
   */
  async get(requestTag: string): Promise<Array<DocumentSnapshot<T>>> {
    await this.fetchAllDocuments(requestTag);

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

  private async fetchAllDocuments(requestTag: string): Promise<void> {
    while (this.remainingDocuments.size > 0) {
      try {
        return await this.fetchMoreDocuments(requestTag);
      } catch (err) {
        // If a non-transactional read failed, attempt to restart.
        // Transactional reads are retried via the transaction runner.
        if (
          this.transactionId ||
          isPermanentRpcError(err, 'batchGetDocuments')
        ) {
          logger(
            'DocumentReader.fetchAllDocuments',
            requestTag,
            'BatchGetDocuments failed with non-retryable stream error:',
            err
          );
          throw err;
        } else {
          logger(
            'DocumentReader.fetchAllDocuments',
            requestTag,
            'BatchGetDocuments failed with retryable stream error:',
            err
          );
        }
      }
    }
  }

  private fetchMoreDocuments(requestTag: string): Promise<void> {
    const request: api.IBatchGetDocumentsRequest = {
      database: this.firestore.formattedName,
      transaction: this.transactionId,
      documents: Array.from(this.remainingDocuments),
    };

    if (this.fieldMask) {
      const fieldPaths = this.fieldMask.map(
        fieldPath => (fieldPath as FieldPath).formattedName
      );
      request.mask = {fieldPaths};
    }

    let resultCount = 0;

    return this.firestore
      .requestStream('batchGetDocuments', request, requestTag)
      .then(stream => {
        return new Promise<void>((resolve, reject) => {
          stream
            .on('error', err => reject(err))
            .on('data', (response: api.IBatchGetDocumentsResponse) => {
              try {
                let document;

                if (response.found) {
                  logger(
                    'DocumentReader.fetchMoreDocuments',
                    requestTag,
                    'Received document: %s',
                    response.found.name!
                  );
                  document = this.firestore.snapshot_(
                    response.found,
                    response.readTime!
                  );
                } else {
                  logger(
                    'DocumentReader.fetchMoreDocuments',
                    requestTag,
                    'Document missing: %s',
                    response.missing!
                  );
                  document = this.firestore.snapshot_(
                    response.missing!,
                    response.readTime!
                  );
                }

                const path = document.ref.formattedName;
                this.remainingDocuments.delete(path);
                this.retrievedDocuments.set(path, document);
                ++resultCount;
              } catch (err) {
                reject(err);
              }
            })
            .on('end', () => {
              logger(
                'DocumentReader.fetchMoreDocuments',
                requestTag,
                'Received %d results',
                resultCount
              );
              resolve();
            });
          stream.resume();
        });
      });
  }
}
