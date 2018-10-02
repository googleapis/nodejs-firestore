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

import {GrpcClient} from 'google-gax';

import {google} from '../../protos/firestore_proto_api';
import api = google.firestore.v1beta1;

const v1beta1 = require('../../src/v1beta1');

// TODO: This should be a TypeScript import after the full migration.
import Firestore = require('../../src');
import {ClientPool} from '../../src/pool';

/* tslint:disable:no-any */
type GapicClient = any;
const grpc = new GrpcClient({} as any).grpc;
const SSL_CREDENTIALS = (grpc.credentials as any).createInsecure();
/* tslint:enable:no-any */

export const PROJECT_ID = 'test-project';
export const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
export const COLLECTION_ROOT = `${DATABASE_ROOT}/documents/collectionId`;
export const DOCUMENT_NAME = `${COLLECTION_ROOT}/documentId`;

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
export type ApiOverride = {
  beginTransaction?: (request, options, callback) => void;
  commit?: (request, options, callback) => void;
  rollback?: (request, options, callback) => void;
  listCollectionIds?: (request, options, callback) => void;
  listDocuments?: (request, options, callback) => void;
  batchGetDocuments?: (request) => NodeJS.ReadableStream;
  runQuery?: (request) => NodeJS.ReadableStream;
  listen?: () => NodeJS.ReadWriteStream;
};

/**
 * Creates a new Firestore instance for testing. Request handlers can be
 * overridden by providing `apiOverrides`.
 *
 * @param {ApiOverride} apiOverrides An object with the request handlers to
 * override.
 * @param {Object} firestoreSettings Firestore Settings to configure the client.
 * @return {Promise<Firestore>} A Promise that resolves with the new Firestore
 * client.
 */
export function createInstance(
    apiOverrides?: ApiOverride, firestoreSettings?: {}): Promise<Firestore> {
  const initializationOptions = Object.assign(
      {
        projectId: PROJECT_ID,
        sslCreds: SSL_CREDENTIALS,
        timestampsInSnapshots: true,
        keyFilename: __dirname + '/../fake-certificate.json',
      },
      firestoreSettings);

  const firestore = new Firestore();
  firestore.settings(initializationOptions);

  const clientPool = new ClientPool(/* concurrentRequestLimit= */ 1, () => {
    const gapicClient: GapicClient = new v1beta1(initializationOptions);
    if (apiOverrides) {
      Object.keys(apiOverrides).forEach(override => {
        gapicClient._innerApiCalls[override] = apiOverrides[override];
      });
    }
    return gapicClient;
  });

  firestore._initClientPool = () => Promise.resolve(clientPool);

  return Promise.resolve(firestore);
}

export function commitRequest(writes: api.IWrite[]): api.ICommitRequest {
  return {database: DATABASE_ROOT, writes};
}

function write(
    document: api.IDocument|null, mask: api.IDocumentMask|null,
    transforms: api.DocumentTransform.IFieldTransform[]|null,
    precondition: api.IPrecondition|null): api.IWrite[] {
  const writes: api.IWrite[] = [];

  if (document) {
    const update = Object.assign({}, document);
    delete update.updateTime;
    delete update.createTime;
    writes.push({update});
    if (mask) {
      writes[0].updateMask = mask;
    }
  }

  if (transforms) {
    writes.push(
        {transform: {document: DOCUMENT_NAME, fieldTransforms: transforms}});
  }

  if (precondition) {
    writes[0].currentDocument = precondition;
  }

  return writes;
}

export function set(
    document: api.IDocument,
    transforms?: api.DocumentTransform.IFieldTransform[]): api.IWrite[] {
  return write(document, null, transforms || null, null);
}

function value(value: string|api.IValue): api.IValue {
  if (typeof value === 'string') {
    return {
      stringValue: value,
    };
  } else {
    return value;
  }
}

export function document(
    id: string, field?: string, value?: string|api.IValue,
    ...fieldOrValue: Array<string|api.IValue>): api.IDocument {
  const document: api.IDocument = {
    name: `${DATABASE_ROOT}/documents/collectionId/${id}`,
    fields: {},
    createTime: {seconds: 1, nanos: 2},
    updateTime: {seconds: 3, nanos: 4},
  };

  for (let i = 1; i < arguments.length; i += 2) {
    const field: string = arguments[i];
    const value: string|api.Value = arguments[i + 1];

    if (typeof value === 'string') {
      document.fields![field] = {
        stringValue: value,
      };
    } else {
      document.fields![field] = value;
    }
  }

  return document;
}

export function serverTimestamp(field: string):
    api.DocumentTransform.IFieldTransform {
  return {
    fieldPath: field,
    setToServerValue:
        api.DocumentTransform.FieldTransform.ServerValue.REQUEST_TIME
  };
}

export function arrayTransform(
    field: string, transform: 'appendMissingElements'|'removeAllFromArray',
    ...values: Array<string|api.IValue>):
    api.DocumentTransform.IFieldTransform {
  const fieldTransform:
      api.DocumentTransform.IFieldTransform = {fieldPath: field};

  fieldTransform[transform] = {values: values.map(val => value(val))};

  return fieldTransform;
}

export function writeResult(count: number): api.IWriteResponse {
  const response: api.IWriteResponse = {
    commitTime: {
      nanos: 0,
      seconds: 1,
    },
  };

  if (count > 0) {
    response.writeResults = [];

    for (let i = 1; i <= count; ++i) {
      response.writeResults.push({
        updateTime: {
          nanos: i * 2,
          seconds: i * 2 + 1,
        },
      });
    }
  }

  return response;
}
