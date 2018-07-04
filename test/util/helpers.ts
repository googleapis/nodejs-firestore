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
import {ClientPool} from '../../src/pool';
import v1beta1 from '../../src/v1beta1';

/* tslint:disable:no-any */
type GapicClient = any;
const grpc = new GrpcClient({} as any).grpc;
const SSL_CREDENTIALS = (grpc.credentials as any).createInsecure();
/* tslint:enable:no-any */

const PROJECT_ID = 'test-project';

/** A Promise implementation that supports deferred resolution. */
export class Deferred<R> {
  promise: Promise<R>;
  resolve: (value?: R|Promise<R>) => void = () => {};
  reject: (reason?: Error) => void = () => {};

  constructor() {
    this.promise = new Promise(
        (resolve: (value?: R|Promise<R>) => void,
         reject: (reason?: Error) => void) => {
          this.resolve = resolve;
          this.reject = reject;
        });
  }
}

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
    apiOverrides?: ApiOverride, firestoreSettings?: {}) {
  const initializationOptions = Object.assign(
      {
        projectId: PROJECT_ID,
        sslCreds: SSL_CREDENTIALS,
        timestampsInSnapshots: true,
        keyFilename: './test/fake-certificate.json',
      },
      firestoreSettings);

  const firestore = new Firestore(initializationOptions);

  const clientPool = new ClientPool(/* concurrentRequestLimit= */ 1, () => {
    const veneerClient: GapicClient = v1beta1(initializationOptions);
    if (apiOverrides) {
      Object.keys(apiOverrides).forEach(override => {
        veneerClient._innerApiCalls[override] = apiOverrides[override];
      });
    }
    return veneerClient;
  });

  firestore._initClientPool = () => clientPool;

  return firestore;
}