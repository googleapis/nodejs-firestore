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

'use strict';

import assert from 'power-assert';
import is from 'is';

import {Firestore} from '../src/index';
import {referencePkg} from '../src/reference';
import {createInstance} from '../test/util/helpers';

const reference = referencePkg(Firestore);
const DocumentReference = reference.DocumentReference;

// Change the argument to 'console.log' to enable debug output.
Firestore.setLogFunction(() => {});

const PROJECT_ID = 'test-project';

describe('Collection interface', function() {
  let firestore;

  beforeEach(() => {
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  it('has doc() method', function() {
    let collectionRef = firestore.collection('colId');
    assert.ok(collectionRef.doc);

    let documentRef = collectionRef.doc('docId');
    assert.ok(is.instance(documentRef, DocumentReference));
    assert.equal(collectionRef.id, 'colId');
    assert.equal(documentRef.id, 'docId');

    assert.throws(() => {
      collectionRef.doc(false);
    }, /Argument "documentPath" is not a valid ResourcePath. Path must be a non-empty string./);

    assert.throws(() => {
      collectionRef.doc(null);
    }, /Argument "documentPath" is not a valid ResourcePath. Path must be a non-empty string./);

    assert.throws(() => {
      collectionRef.doc('');
    }, /Argument "documentPath" is not a valid ResourcePath. Path must be a non-empty string./);

    assert.throws(() => {
      collectionRef.doc(undefined);
    }, /Argument "documentPath" is not a valid ResourcePath. Path must be a non-empty string./);

    assert.throws(function() {
      collectionRef.doc('doc/coll');
    }, /Argument "documentPath" must point to a document, but was "doc\/coll". Your path does not contain an even number of components\./);

    documentRef = collectionRef.doc('docId/colId/docId');
    assert.ok(is.instance(documentRef, DocumentReference));
  });

  it('has parent() method', function() {
    let collection = firestore.collection('col1/doc/col2');
    assert.equal(collection.path, 'col1/doc/col2');
    let document = collection.parent;
    assert.equal(document.path, 'col1/doc');
  });

  it('supports auto-generated ids', function() {
    let collectionRef = firestore.collection('collectionId');
    let documentRef = collectionRef.doc();
    assert.ok(is.instance(documentRef, DocumentReference));
    assert.equal(collectionRef.id, 'collectionId');
    assert.ok(documentRef.id.length, 20);
  });

  it('has add() method', function() {
    const dbPrefix = `projects/${PROJECT_ID}/databases`;

    const overrides = {
      commit: (request, options, callback) => {
        // Verify that the document name uses an auto-generated id.
        let docIdRe = new RegExp(
            `${dbPrefix}/\\(default\\)/documents/collectionId/[a-zA-Z0-9]{20}`);
        assert.ok(docIdRe.test(request.writes[0].update.name));
        delete request.writes[0].update.name;

        // Verify that the rest of the protobuf matches.
        assert.deepEqual(request, {
          database: dbPrefix + '/(default)',
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
      }
    };

    return createInstance(overrides).then(firestore => {
      let collectionRef = firestore.collection('collectionId');
      assert.ok(collectionRef.add);
      let promise = collectionRef.add({});
      assert.ok(is.instance(promise, Promise));

      return promise.then(documentRef => {
        assert.ok(is.instance(documentRef, DocumentReference));
        assert.equal(collectionRef.id, 'collectionId');
        assert.ok(documentRef.id.length, 20);
      });
    });
  });

  it('has isEqual() method', function() {
    let coll1 = firestore.collection('coll1');
    let coll1Equals = firestore.collection('coll1');
    let coll2 = firestore.collection('coll2');
    assert.ok(coll1.isEqual(coll1Equals));
    assert.ok(!coll1.isEqual(coll2));
  });
});
