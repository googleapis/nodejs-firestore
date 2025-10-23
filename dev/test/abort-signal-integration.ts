/*!
 * Copyright 2024 Google Inc. All Rights Reserved.
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

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {Duplex} from 'stream';

import {Firestore} from '../src';
import {createInstance} from './util/helpers';

describe('AbortSignal Integration', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  afterEach(() => firestore.terminate());

  describe('Document operations with AbortSignal', () => {
    it('should support AbortSignal in get() operation', async () => {
      const controller = new AbortController();

      // Mock the batchGetDocuments to return a stream that can be cancelled
      const overrides = {
        batchGetDocuments: () => {
          const stream = new Duplex({
            objectMode: true,
            read() {
              // Required _read implementation
            },
            write(chunk, encoding, callback) {
              callback();
            }
          });
          (stream as any).cancel = () => {
            stream.destroy();
          };
          
          // Simulate a slow response
          setTimeout(() => {
            stream.push({
              missing: 'projects/test-project/databases/(default)/documents/coll/doc',
              readTime: {seconds: 0, nanos: 0},
            });
            stream.push(null);
          }, 100);
          
          return stream;
        },
      };

      return createInstance(overrides).then(async firestoreInstance => {
        const testDocRef = firestoreInstance.doc('coll/doc');
        
        // Start the get operation with AbortSignal
        const getPromise = testDocRef.get({abortSignal: controller.signal});
        
        // Abort after a short delay
        setTimeout(() => controller.abort(), 10);
        
        try {
          await getPromise;
          expect.fail('Should have thrown due to abort');
        } catch (error) {
          expect(error.message).to.equal('The operation was aborted');
        }
        
        await firestoreInstance.terminate();
      });
    });
  });

  describe('Query operations with AbortSignal', () => {
    it('should support AbortSignal in query get() operation', async () => {
      const controller = new AbortController();

      // Mock the runQuery to return a stream that can be cancelled
      const overrides = {
        runQuery: () => {
          const stream = new Duplex({
            objectMode: true,
            read() {
              // Required _read implementation
            },
            write(chunk, encoding, callback) {
              callback();
            }
          });
          (stream as any).cancel = () => {
            stream.destroy();
          };
          
          // Simulate a slow response
          setTimeout(() => {
            stream.push({readTime: {seconds: 0, nanos: 0}});
            stream.push(null);
          }, 100);
          
          return stream;
        },
      };

      return createInstance(overrides).then(async firestoreInstance => {
        const query = firestoreInstance.collection('coll').where('field', '==', 'value');
        
        // Start the query operation with AbortSignal
        const queryPromise = query.get({abortSignal: controller.signal});
        
        // Abort after a short delay
        setTimeout(() => controller.abort(), 10);
        
        try {
          await queryPromise;
          expect.fail('Should have thrown due to abort');
        } catch (error) {
          expect(error.message).to.equal('The operation was aborted');
        }
        
        await firestoreInstance.terminate();
      });
    });
  });

  describe('Batch operations with AbortSignal', () => {
    it('should support AbortSignal in getAll() operation', async () => {
      const controller = new AbortController();

      // Mock the batchGetDocuments to return a stream that can be cancelled
      const overrides = {
        batchGetDocuments: () => {
          const stream = new Duplex({
            objectMode: true,
            read() {
              // Required _read implementation
            },
            write(chunk, encoding, callback) {
              callback();
            }
          });
          (stream as any).cancel = () => {
            stream.destroy();
          };
          
          // Simulate a slow response
          setTimeout(() => {
            stream.push({
              missing: 'projects/test-project/databases/(default)/documents/coll/doc1',
              readTime: {seconds: 0, nanos: 0},
            });
            stream.push({
              missing: 'projects/test-project/databases/(default)/documents/coll/doc2',
              readTime: {seconds: 0, nanos: 0},
            });
            stream.push(null);
          }, 100);
          
          return stream;
        },
      };

      return createInstance(overrides).then(async firestoreInstance => {
        const doc1 = firestoreInstance.doc('coll/doc1');
        const doc2 = firestoreInstance.doc('coll/doc2');
        
        // Start the getAll operation with AbortSignal
        const getAllPromise = firestoreInstance.getAll(doc1, doc2, {abortSignal: controller.signal});
        
        // Abort after a short delay
        setTimeout(() => controller.abort(), 10);
        
        try {
          await getAllPromise;
          expect.fail('Should have thrown due to abort');
        } catch (error) {
          expect(error.message).to.equal('The operation was aborted');
        }
        
        await firestoreInstance.terminate();
      });
    });
  });
});