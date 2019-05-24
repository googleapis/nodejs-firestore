/**
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

import {expect} from 'chai';

import {DocumentReference, Firestore, setLogFunction} from '../src';
import {
  ApiOverride,
  createInstance,
  DATABASE_ROOT,
  document,
  InvalidApiUsage,
  verifyInstance,
} from './util/helpers';

// Change the argument to 'console.log' to enable debug output.
setLogFunction(() => {});

describe('Collection interface', () => {
  let firestore: Firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  afterEach(() => verifyInstance(firestore));

  it('has doc() method', () => {
    const collectionRef = firestore.collection('colId');
    expect(collectionRef.doc);

    let documentRef = collectionRef.doc('docId');
    expect(documentRef).to.be.an.instanceOf(DocumentReference);
    expect(collectionRef.id).to.equal('colId');
    expect(documentRef.id).to.equal('docId');

    expect(() => collectionRef.doc(false as InvalidApiUsage)).to.throw(
      'Value for argument "documentPath" is not a valid resource path. Path must be a non-empty string.'
    );
    expect(() => collectionRef.doc(null as InvalidApiUsage)).to.throw(
      'Value for argument "documentPath" is not a valid resource path. Path must be a non-empty string.'
    );
    expect(() => collectionRef.doc('')).to.throw(
      'Value for argument "documentPath" is not a valid resource path. Path must be a non-empty string.'
    );
    expect(() => collectionRef.doc('doc/coll')).to.throw(
      'Value for argument "documentPath" must point to a document, but was "doc/coll". Your path does not contain an even number of components.'
    );

    documentRef = collectionRef.doc('docId/colId/docId');
    expect(documentRef).to.be.an.instanceOf(DocumentReference);
  });

  it('has parent() method', () => {
    const collection = firestore.collection('col1/doc/col2');
    expect(collection.path).to.equal('col1/doc/col2');
    const document = collection.parent;
    expect(document.path).to.equal('col1/doc');
  });

  it('supports auto-generated ids', () => {
    const collectionRef = firestore.collection('collectionId');
    const documentRef = collectionRef.doc();
    expect(documentRef).to.be.an.instanceOf(DocumentReference);
    expect(collectionRef.id).to.equal('collectionId');
    expect(documentRef.id).to.have.length(20);
    
    const documentRefUndefined = collectionRef.doc(undefined);
    expect(documentRefUndefined).to.be.an.instanceOf(DocumentReference);
    expect(documentRefUndefined.id).to.have.length(20);
  });

  it('has add() method', () => {
    const overrides: ApiOverride = {
      commit: (request, options, callback) => {
        // Verify that the document name uses an auto-generated id.
        const docIdRe = /^projects\/test-project\/databases\/\(default\)\/documents\/collectionId\/[a-zA-Z0-9]{20}$/;
        expect(request.writes![0].update!.name).to.match(docIdRe);
        delete request.writes![0].update!.name;

        // Verify that the rest of the protobuf matches.
        expect(request).to.deep.equal({
          database: DATABASE_ROOT,
          writes: [
            {
              update: {
                fields: {},
              },
              currentDocument: {
                exists: false,
              },
            },
          ],
        });

        callback(null, {
          commitTime: {
            nanos: 0,
            seconds: 0,
          },
          writeResults: [
            {
              updateTime: {
                nanos: 0,
                seconds: 0,
              },
            },
          ],
        });
      },
    };

    return createInstance(overrides).then(firestore => {
      const collectionRef = firestore.collection('collectionId');
      const promise = collectionRef.add({});
      expect(promise).to.be.an.instanceOf(Promise);

      return promise.then(documentRef => {
        expect(documentRef).to.be.an.instanceOf(DocumentReference);
        expect(collectionRef.id).to.equal('collectionId');
        expect(documentRef.id).to.have.length(20);
      });
    });
  });

  it('has list() method', () => {
    const overrides: ApiOverride = {
      listDocuments: (request, options, callback) => {
        expect(request).to.deep.eq({
          parent: `${DATABASE_ROOT}/documents/a/b`,
          collectionId: 'c',
          showMissing: true,
          mask: {fieldPaths: []},
        });

        callback(null, [document('first'), document('second')]);
      },
    };

    return createInstance(overrides).then(firestore => {
      return firestore
        .collection('a/b/c')
        .listDocuments()
        .then(documentRefs => {
          expect(documentRefs[0].id).to.equal('first');
          expect(documentRefs[1].id).to.equal('second');
        });
    });
  });

  it('has isEqual() method', () => {
    const coll1 = firestore.collection('coll1');
    const coll1Equals = firestore.collection('coll1');
    const coll2 = firestore.collection('coll2');
    expect(coll1.isEqual(coll1Equals)).to.be.ok;
    expect(coll1.isEqual(coll2)).to.not.be.ok;
  });
});
