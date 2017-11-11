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

const assert = require('assert');
const path = require('path');
const is = require('is');
const googleProtoFiles = require('google-proto-files');
const varint = require('varint');
const protobufjs = require('protobufjs');
const grpc = require('grpc');
const Firestore = require('../');

let reference = require('../src/reference')(Firestore);
const document = require('../src/document')(reference.DocumentReference);
const DocumentSnapshot = document.DocumentSnapshot;

const convert = require('../src/convert');
const ResourcePath = require('../src/path').ResourcePath;

function loadTestCases() {
  const protobufRoot = new protobufjs.Root();

  protobufRoot.resolvePath = function(origin, target) {
    if (/^google\/.*/.test(target)) {
      target = path.join(googleProtoFiles(), target.substr('google/'.length));
    }
    return target;
  };

  const protoDefinition = protobufRoot.loadSync(
    path.join(__dirname, '../protos/test.proto')
  );

  const binaryProtoData = require('fs').readFileSync(
    path.join(__dirname, 'testdata/tests.binprotos')
  );

  const testType = protoDefinition.lookupType('tests.Test');

  const testCases = [];

  for (let offset = 0; offset < binaryProtoData.length; ) {
    const messageLength = varint.decode(binaryProtoData, offset);
    offset += varint.encodingLength(messageLength);

    let testCase = testType.decode(
      binaryProtoData.slice(offset, offset + messageLength)
    );
    testCases.push(testCase);

    offset = offset + messageLength;
  }

  return testCases;
}

const ignored = [
  'ServerTimestamp alone',
  'nested ServerTimestamp field',
  'multiple ServerTimestamp fields',
  "ServerTimestamp with dotted field",

    // Bug:
  'Delete cannot be nested',

  // No field support
  'Merge with a field',
  'Merge with a nested field',
  'Merge field is not a leaf',
  'Merge with FieldPaths',
  'ServerTimestamp with Merge of both fields',
  'If is ServerTimestamp not in Merge, no transform',
  'If no ordinary values in Merge, no write',
  'Merge fields must all be present in data',
];

describe('Conformance runner', function() {
  function createInstance() {
    return new Firestore({
      projectId: 'projectID',
      sslCreds: grpc.credentials.createInsecure(),
    });
  }

  function runTest(spec) {
    if (ignored.find(val => val === spec.description)) {
      console.log(`Skipping: ${spec.description}`);
      return Promise.resolve();
    }

    console.log(`Running test: ${spec.description}`);

    const firestore = createInstance();

    function docRef(path) {
      const relativePath = ResourcePath.fromSlashSeparatedString(path)
        .relativeName;
      return firestore.doc(relativePath);
    }

    function convertInput(json) {
      const obj = JSON.parse(json);

      function convertArray(arr) {
        for (let i = 0; i < arr.length; ++i) {
          if (is.object(arr[i])) {
            arr[i] = convertObject(arr[i]);
          } else if (is.array(arr[i])) {
            arr[i] = convertArray(arr[i]);
          } else if (arr[i] === 'Delete') {
            arr[i] = Firestore.FieldValue.delete();
          } else if (arr[i] === 'ServerTimestamp') {
            arr[i] = Firestore.FieldValue.serverTimestamp();
          }
        }
        return arr;
      }

      function convertObject(obj) {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (is.object(obj[key])) {
              obj[key] = convertObject(obj[key]);
            } else if (is.array(obj[key])) {
              obj[key] = convertArray(obj[key]);
            } else if (obj[key] === 'Delete') {
              obj[key] = Firestore.FieldValue.delete();
            } else if (obj[key] === 'ServerTimestamp') {
              obj[key] = Firestore.FieldValue.serverTimestamp();
            }
          }
        }
        return obj;
      }

      convertObject(obj);

      return obj;
    }

    function convertCommit(commitRequest) {
      const deepCopy = JSON.parse(JSON.stringify(commitRequest));
      for (let write of deepCopy.writes) {
        if (write.update) {
          write.update.fields = convert.documentFromJson(write.update.fields);
        }
      }

      return deepCopy;
    }

    // TODO: use second precondition from test

    function convertPrecondition(precondition) {
      const result = JSON.parse(JSON.stringify(precondition));
      if (result.updateTime) {
        result.lastUpdateTime = DocumentSnapshot.toISOTime(result.updateTime);
        delete result.updateTime;
      }
      return result;
      // ...
    }

    let resolve;
    let reject;

    const deferred = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const getSpec = spec.get;
    const createSpec = spec.create;
    const setSpec = spec.set;
    const updateSpec = spec.update || spec.updatePaths;
    const deleteSpec = spec.delete;

    if (getSpec) {
      firestore.api.Firestore._batchGetDocuments = function(request) {
        const getDocument = getSpec.request;
        assert.equal(request.documents[0], getDocument.name);
        resolve();
      };
      docRef(getSpec.docRefPath).get();
    } else if (createSpec) {
      firestore.api.Firestore._commit = function(request) {
        const expected = convertCommit(createSpec.request);
        try {
          assert.deepEqual(request, expected);
        } catch (err) {
          console.log('Expceted: ');
          console.log(JSON.stringify(expected));
          console.log('Actual: ');
          console.log(JSON.stringify(request));
          reject();
        }
        resolve();
      };

      if (createSpec.isError) {
        assert.throws(() => {
          docRef(createSpec.docRefPath).create(
            convertInput(createSpec.jsonData)
          );
        });
        resolve();
      } else {
        docRef(createSpec.docRefPath).create(convertInput(createSpec.jsonData));
      }
    } else if (setSpec) {
      firestore.api.Firestore._commit = function(request) {
        const expected = convertCommit(setSpec.request);
        try {
          assert.deepEqual(request, expected);
        } catch (err) {
          console.log('Expceted: ');
          console.log(JSON.stringify(expected));
          console.log('Actual: ');
          console.log(JSON.stringify(request));
          reject();
        }
        resolve();
      };

      const isMerge = !!(setSpec.option && setSpec.option.all);

      if (setSpec.isError) {
        assert.throws(() => {
          docRef(setSpec.docRefPath).set(convertInput(setSpec.jsonData), {
            merge: isMerge,
          });
        });
        resolve();
      } else {
        docRef(setSpec.docRefPath).set(convertInput(setSpec.jsonData), {
          merge: isMerge,
        });
      }
    } else if (updateSpec) {
      firestore.api.Firestore._commit = function(request) {
        const expected = convertCommit(updateSpec.request);
        try {
          assert.deepEqual(request, expected);
        } catch (err) {
          console.log('Expceted: ');
          console.log(JSON.stringify(expected));
          console.log('Actual: ');
          console.log(JSON.stringify(request));
          reject();
        }
        resolve();
      };

      // message UpdatePathsTest {
      //   string doc_ref_path = 1; // path of doc
      //   google.firestore.v1beta1.Precondition precondition = 2; // precondition in call, if any
      //   // parallel sequences: field_paths[i] corresponds to json_values[i]
      //   repeated FieldPath field_paths = 3; // the argument field paths
      //   repeated string json_values = 4;    // the argument values, as JSON
      //   google.firestore.v1beta1.CommitRequest request = 5; // expected rquest
      //   bool is_error = 6; // call signals an error
      // }

      let varargs = [];

      if (updateSpec.jsonData) {
        varargs[0] = convertInput(updateSpec.jsonData);
      } else {
        for (let i = 0; i < updateSpec.fieldPaths; ++i) {
          varargs[2 * i] = new Firestore.FieldPath(
            updateSpec.fieldPaths[i].fields
          );
        }

        for (let i = 0; i < updateSpec.jsonValues; ++i) {
          varargs[2 * i + 1] = convertInput(updateSpec.jsonValues[i]);
        }
      }

      if (updateSpec.precondition) {
        varargs.push(convertPrecondition(updateSpec.precondition));
      }

      var document = docRef(updateSpec.docRefPath);

      if (updateSpec.isError) {
        assert.throws(() => {
          document.update.apply(document, varargs);
        });
        resolve();
      } else {
        document.update.apply(document, varargs);
      }
    } else {
      reject(new Error(`Unhandled Spec: ${JSON.stringify(spec)}`));
    }

    return deferred;
  }

  it('runs all tests', function() {
    let result = Promise.resolve();

    for (let testCase of loadTestCases()) {
      result = result.then(() => runTest(testCase));
    }

    return result;
  });
});
