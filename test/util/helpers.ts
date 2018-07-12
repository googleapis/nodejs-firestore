/**
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

import {GrpcClient} from 'google-gax';

import Firestore from '../../src';

/* tslint:disable:no-any */
const grpc = new GrpcClient({} as any).grpc;
const SSL_CREDENTIALS = (grpc.credentials as any).createInsecure();
/* tslint:enable:no-any */

const PROJECT_ID = 'test-project';

/**
 * Interface that defines the request handlers used by Firestore.
 */
export interface ApiOverride {
  beginTransaction(request, options, callback): void;
  commit(request, options, callback): void;
  rollback(request, options, callback): void;
  listCollectionIds(request, options, callback): void;
  batchGetDocuments(request): NodeJS.ReadableStream;
  runQuery(request): NodeJS.ReadableStream;
  listen(): NodeJS.ReadWriteStream;
}

/**
 * Creates a new Firestore instance for testing. Request handlers can be
 * overridden by providing `apiOverrides`.
 *
 * @param {ApiOverride} apiOverrides An object with the request handlers to
 * override.
 * @param {Object} firestoreSettings Firestore Settings to configure the client.
 * @return {Firestore} A new Firestore client.
 */
export function createInstance(
    apiOverrides?: ApiOverride, firestoreSettings?: {}): Promise<Firestore> {
  const initializationOptions = Object.assign(
      {
        projectId: PROJECT_ID,
        sslCreds: SSL_CREDENTIALS,
        timestampsInSnapshots: true,
        keyFilename: './test/fake-certificate.json',
      },
      firestoreSettings);

  const firestore = new Firestore();
  firestore.settings(initializationOptions);

  return firestore._ensureClient().then(() => {
    if (apiOverrides) {
      Object.keys(apiOverrides).forEach(override => {
        firestore._firestoreClient._innerApiCalls[override] =
            apiOverrides[override];
      });
    }
    return firestore;
  });
}
