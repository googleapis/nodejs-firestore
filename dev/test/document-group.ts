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

import {use, expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {google} from '../protos/firestore_proto_api';
import api = google.firestore.v1beta1;

// TODO: This should be a TypeScript import after the full migration.
import Firestore = require('../src');
import {COLLECTION_ROOT, createInstance, found, missing, stream} from './util/helpers';
import {AnyDuringMigration} from '../src/types';

use(chaiAsPromised.default);

type DocumentSnapshot = AnyDuringMigration;

describe('DocumentGroup', () => {
  function requestedDocumentsEqual(
      request: api.IBatchGetDocumentsRequest, ...docs: string[]): void {
    expect(request.documents!.length).to.eq(docs.length);

    for (let i = 0; i < request.documents!.length; ++i) {
      expect(request.documents![i]).to.eq(`${COLLECTION_ROOT}/${docs[i]}`);
    }
  }

  function requestedFieldMaskEquals(
      request: api.IBatchGetDocumentsRequest, ...fields: string[]): void {
    const actualMask = request.mask!.fieldPaths!;
    expect(actualMask.length).to.eq(fields.length);

    for (let i = 0; i < actualMask.length; ++i) {
      expect(actualMask[i]).to.eq(fields[i]);
    }
  }

  function responseEquals(
      result: DocumentSnapshot[],
      ...docs: api.IBatchGetDocumentsResponse[]): void {
    expect(result.length).to.eq(docs.length);

    for (let i = 0; i < result.length; ++i) {
      const doc = docs[i];

      if (doc.found) {
        expect(result[i].exists).to.be.ok;
        expect(result[i].ref.formattedName).to.eq(doc.found.name);
      } else {
        expect(result[i].exists).to.not.be.ok;
        expect(result[i].ref.formattedName).to.eq(doc.missing);
      }
    }
  }

  it('requires at least one document', () => {
    return createInstance().then(firestore => {
      // tslint:disable-next-line:no-any Intentional argument misuse
      expect(() => (firestore as any).documentGroup())
          .to.throw(
              /Function 'documentGroup\(\)' requires at least 1 argument./);
    });
  });

  it('validates arguments', () => {
    return createInstance().then(firestore => {
      // tslint:disable-next-line:no-any Intentional argument misuse
      expect(() => (firestore as any).documentGroup('foo'))
          .to.throw(
              /Argument at index 0 is not a valid DocumentReference. Invalid use of type "string" as a Firestore argument./);
    });
  });

  it('supports get()', () => {
    const overrides = {
      batchGetDocuments: request => {
        requestedDocumentsEqual(request, 'doc1', 'doc2');
        return stream(found('doc1'), found('doc2'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const docA = firestore.doc('collectionId/doc1');
      const docB = firestore.doc('collectionId/doc2');
      return firestore.documentGroup(docA, docB).get().then(result => {
        responseEquals(result, found('doc1'), found('doc2'));
      });
    });
  });

  it('supports stream()', done => {
    const overrides = {
      batchGetDocuments: request => {
        requestedDocumentsEqual(request, 'doc1', 'doc2');
        return stream(found('doc1'), found('doc2'));
      }
    };

    createInstance(overrides).then(firestore => {
      const docA = firestore.doc('collectionId/doc1');
      const docB = firestore.doc('collectionId/doc2');

      const results: api.IBatchGetDocumentsResponse[] = [];
      const stream = firestore.documentGroup(docA, docB).stream();

      stream.on('data', doc => results.push(doc));
      stream.on('end', () => {
        responseEquals(results, found('doc1'), found('doc2'));
        done();
      });
    });
  });

  it('supports field mask', () => {
    const overrides = {
      batchGetDocuments: request => {
        requestedFieldMaskEquals(request, 'a', 'b');
        return stream(found('documentId'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const docRef = firestore.doc('collectionId/documentId');
      return firestore.documentGroup(docRef)
          .select('a', new Firestore.FieldPath('b'))
          .get()
          .then(result => {
            responseEquals(result, found('documentId'));
          });
    });
  });

  it('supports empty field mask', () => {
    const overrides = {
      batchGetDocuments: request => {
        requestedFieldMaskEquals(request, '__name__');
        return stream(found('documentId'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const docRef = firestore.doc('collectionId/documentId');
      return firestore.documentGroup(docRef).select().get().then(result => {
        responseEquals(result, found('documentId'));
      });
    });
  });

  it('verifies response', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found('invalid'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const docRef = firestore.doc('collectionId/documentId');
      return expect(firestore.documentGroup(docRef).get())
          .to.eventually.be.rejectedWith(
              'Did not receive document for "collectionId/documentId".');
    });
  });

  it('handles stream exception during initialization', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(new Error('Expected exception'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const docRef = firestore.doc('collectionId/documentId');
      return expect(firestore.documentGroup(docRef).get())
          .to.eventually.be.rejectedWith('Expected exception');
    });
  });

  it('handles stream exception after initialization', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found('documentId'), new Error('Expected exception'));
      }
    };

    return createInstance(overrides).then(firestore => {
      const docRef = firestore.doc('collectionId/documentId');
      return expect(firestore.documentGroup(docRef).get())
          .to.eventually.be.rejectedWith('Expected exception');
    });
  });

  it('handles serialization error', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(found('documentId'));
      }
    };

    return createInstance(overrides).then(firestore => {
      firestore.snapshot_ = () => {
        throw new Error('Expected exception');
      };

      const docRef = firestore.doc('collectionId/documentId');
      return expect(firestore.documentGroup(docRef).get())
          .to.eventually.be.rejectedWith('Expected exception');
    });
  });

  it('only retries on GRPC unavailable', () => {
    const expectedErrorAttempts = {
      /* Cancelled */ 1: 1,
      /* Unknown */ 2: 1,
      /* InvalidArgument */ 3: 1,
      /* DeadlineExceeded */ 4: 1,
      /* NotFound */ 5: 1,
      /* AlreadyExists */ 6: 1,
      /* PermissionDenied */ 7: 1,
      /* ResourceExhausted */ 8: 1,
      /* FailedPrecondition */ 9: 1,
      /* Aborted */ 10: 1,
      /* OutOfRange */ 11: 1,
      /* Unimplemented */ 12: 1,
      /* Internal */ 13: 1,
      /* Unavailable */ 14: 5,
      /* DataLoss */ 15: 1,
      /* Unauthenticated */ 16: 1,
    };

    const actualErrorAttempts = {};

    const overrides = {
      batchGetDocuments: request => {
        const errorCode = Number(request.documents[0].split('/').pop());
        actualErrorAttempts[errorCode] =
            (actualErrorAttempts[errorCode] || 0) + 1;
        const error = new Error('Expected exception');
        (error as any).code = errorCode;  // tslint:disable-line:no-any
        return stream(error);
      }
    };

    return createInstance(overrides).then(firestore => {
      const promises: Array<Promise<void>> = [];
      Object.keys(expectedErrorAttempts).forEach(errorCode => {
        const docRef = firestore.doc(`collectionId/${errorCode}`);
        promises.push(expect(firestore.documentGroup(docRef).get())
                          .to.eventually.be.rejected);
      });
      return Promise.all(promises).then(() => {
        expect(actualErrorAttempts).to.deep.equal(expectedErrorAttempts);
      });
    });
  });


  it('returns not found for missing documents', () => {
    const overrides = {
      batchGetDocuments: () => stream(found('exists'), missing('missing'))
    };

    return createInstance(overrides).then(firestore => {
      return firestore
          .documentGroup(
              firestore.doc('collectionId/exists'),
              firestore.doc('collectionId/missing'))
          .get()
          .then(result => {
            responseEquals(result, found('exists'), missing('missing'));
          });
    });
  });

  it('returns results in order', () => {
    const overrides = {
      batchGetDocuments: () => {
        return stream(
            // Note that these are out of order.
            found('second'), found('first'), found('fourth'), found('third'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore
          .documentGroup(
              firestore.doc('collectionId/first'),
              firestore.doc('collectionId/second'),
              firestore.doc('collectionId/third'),
              firestore.doc('collectionId/fourth'))
          .get()
          .then(result => {
            responseEquals(
                result, found('first'), found('second'), found('third'),
                found('fourth'));
          });
    });
  });

  it('accepts same document multiple times', () => {
    const overrides = {
      batchGetDocuments: request => {
        expect(request.documents.length).to.eq(2);
        return stream(found('a'), found('b'));
      }
    };

    return createInstance(overrides).then(firestore => {
      return firestore
          .documentGroup(
              firestore.doc('collectionId/a'), firestore.doc('collectionId/a'),
              firestore.doc('collectionId/b'), firestore.doc('collectionId/a'))
          .get()
          .then(result => {
            responseEquals(
                result, found('a'), found('a'), found('b'), found('a'));
          });
    });
  });

  it('compares document references in isEqual', () => {
    return createInstance().then(firestore => {
      const docA = firestore.doc('collectionId/a');
      const docB = firestore.doc('collectionId/b');

      const referenceGroup = firestore.documentGroup(docA, docB);

      expect(referenceGroup.isEqual(referenceGroup)).to.eq(true);
      expect(referenceGroup.isEqual(firestore.documentGroup(docA, docB)))
          .to.eq(true);
      expect(referenceGroup.isEqual(firestore.documentGroup(docA)))
          .to.eq(false);
      expect(referenceGroup.isEqual(firestore.documentGroup(docB, docA)))
          .to.eq(false);
      expect(referenceGroup.isEqual(firestore.documentGroup(docA, docA, docB)))
          .to.eq(false);
    });
  });

  it('compares field masks in isEqual', () => {
    return createInstance().then(firestore => {
      const doc = firestore.doc('collectionId/a');

      expect(firestore.documentGroup(doc).select().isEqual(
                 firestore.documentGroup(doc).select()))
          .to.eq(true);
      expect(firestore.documentGroup(doc).select().isEqual(
                 firestore.documentGroup(doc)))
          .to.eq(false);
      expect(firestore.documentGroup(doc).select('a').isEqual(
                 firestore.documentGroup(doc).select('a')))
          .to.eq(true);
      expect(firestore.documentGroup(doc).select('a', 'b').isEqual(
                 firestore.documentGroup(doc).select('a')))
          .to.eq(false);
      expect(firestore.documentGroup(doc).select('a').isEqual(
                 firestore.documentGroup(doc).select(
                     new Firestore.FieldPath('a'))))
          .to.eq(true);
    });
  });
});