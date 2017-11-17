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
const through = require('through2');
const googleProtoFiles = require('google-proto-files');
const varint = require('varint');
const protobufjs = require('protobufjs');
const grpc = require('grpc');

const Firestore = require('../');
const reference = require('../src/reference')(Firestore);
const document = require('../src/document')(reference.DocumentReference);
const DocumentSnapshot = document.DocumentSnapshot;
const convert = require('../src/convert');
const ResourcePath = require('../src/path').ResourcePath;

/** Loads the Protobuf definition and the binary test data. */
function loadTestCases() {
  const protobufRoot = new protobufjs.Root();

  protobufRoot.resolvePath = function(origin, target) {
    if (/^google\/.*/.test(target)) {
      target = path.join(googleProtoFiles(), target.substr('google/'.length));
    }
    return target;
  };

  const protoDefinition = protobufRoot.loadSync(
    path.join(__dirname, 'test_definition.proto')
  );

  const binaryProtoData = require('fs').readFileSync(
    path.join(__dirname, 'test_data.binprotos')
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

/** Converts a test object into a JS Object suitable for the Node API. */
function convertInput(json) {
  const obj = JSON.parse(json);

  function convertValue(value) {
    if (is.object(value)) {
      return convertObject(value);
    } else if (is.array(value)) {
      return convertArray(value);
    } else if (value === 'Delete') {
      return Firestore.FieldValue.delete();
    } else if (value === 'ServerTimestamp') {
      return Firestore.FieldValue.serverTimestamp();
    }

    return value;
  }

  function convertArray(arr) {
    for (let i = 0; i < arr.length; ++i) {
      arr[i] = convertValue(arr[i]);
    }
    return arr;
  }

  function convertObject(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = convertValue(obj[key]);
      }
    }
    return obj;
  }

  return convertValue(obj);
}

/** Converts a CommitRequest in Proto3 JSON to Protobuf JS format. */
function convertCommit(commitRequest) {
  const deepCopy = JSON.parse(JSON.stringify(commitRequest));
  for (let write of deepCopy.writes) {
    if (write.update) {
      write.update.fields = convert.documentFromJson(write.update.fields);
    }
  }

  return deepCopy;
}

/** Converts a Protobuf Precondition to the expected user input. */
function convertPrecondition(precondition) {
  const result = JSON.parse(JSON.stringify(precondition));
  if (result.updateTime) {
    result.lastUpdateTime = DocumentSnapshot.toISOTime(result.updateTime);
    delete result.updateTime;
  }
  return result;
}

/** List of test cases that are ignored. */
const ignoredRe = [
  // The test data fails to include an empty write request
  /set: ServerTimestamp alone/,

  // Node doesn't support field masks for set().
  /^set-merge: .*$/,
];

/** If non-empty, list the test cases to run exclusively. */
const exclusiveRe = [];

function runTest(spec) {
  console.log(`Running Spec:\n${JSON.stringify(spec, null, 2)}\n`); // eslint-disable-line no-console

  const firestore = new Firestore({
    projectId: 'projectID',
    sslCreds: grpc.credentials.createInsecure(),
  });

  const docRef = function(path) {
    const relativePath = ResourcePath.fromSlashSeparatedString(path)
      .relativeName;
    return firestore.doc(relativePath);
  };

  const updateTest = function(spec) {
    firestore.api.Firestore._commit = function(request) {
      const expected = convertCommit(spec.request);
      try {
        assert.deepEqual(request, expected);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    let varargs = [];

    if (spec.jsonData) {
      varargs[0] = convertInput(spec.jsonData);
    } else {
      for (let i = 0; i < spec.fieldPaths.length; ++i) {
        varargs[2 * i] = new Firestore.FieldPath(spec.fieldPaths[i].field);
      }
      for (let i = 0; i < spec.jsonValues.length; ++i) {
        varargs[2 * i + 1] = convertInput(spec.jsonValues[i]);
      }
    }

    if (spec.precondition) {
      varargs.push(convertPrecondition(spec.precondition));
    }

    const document = docRef(spec.docRefPath);
    document.update.apply(document, varargs);
  };

  const deleteTest = function(spec) {
    firestore.api.Firestore._commit = function(request) {
      const expected = convertCommit(spec.request);
      try {
        assert.deepEqual(request, expected);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    if (spec.precondition) {
      const precondition = convertPrecondition(deleteSpec.precondition);
      docRef(spec.docRefPath).delete(precondition);
    } else {
      docRef(spec.docRefPath).delete();
    }
  };

  const setTest = function(spec) {
    firestore.api.Firestore._commit = function(request) {
      const expected = convertCommit(spec.request);
      try {
        assert.deepEqual(request, expected);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    const isMerge = !!(spec.option && spec.option.all);

    docRef(setSpec.docRefPath).set(convertInput(spec.jsonData), {
      merge: isMerge,
    });
  };

  const createTest = function(spec) {
    firestore.api.Firestore._commit = function(request) {
      const expected = convertCommit(spec.request);
      try {
        assert.deepEqual(request, expected);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    docRef(spec.docRefPath).create(convertInput(spec.jsonData));
  };

  const getTest = function(spec) {
    firestore.api.Firestore._batchGetDocuments = function(request) {
      const getDocument = spec.request;
      assert.equal(request.documents[0], getDocument.name);
      resolve();
      return through();
    };

    docRef(spec.docRefPath).get();
  };

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
    getTest(getSpec);
  } else if (createSpec) {
    if (createSpec.isError) {
      assert.throws(() => {
        createTest(createSpec);
      });
      resolve();
    } else {
      createTest(createSpec);
    }
  } else if (setSpec) {
    if (setSpec.isError) {
      assert.throws(() => {
        setTest(setSpec);
      });
      resolve();
    } else {
      setTest(setSpec);
    }
  } else if (updateSpec) {
    if (updateSpec.isError) {
      assert.throws(() => {
        updateTest(updateSpec);
      });
      resolve();
    } else {
      updateTest(updateSpec);
    }
  } else if (deleteSpec) {
    if (deleteSpec.isError) {
      assert.throws(() => {
        deleteTest(deleteSpec);
      });
      resolve();
    } else {
      deleteTest(deleteSpec);
    }
  } else {
    reject(new Error(`Unhandled Spec: ${JSON.stringify(spec)}`));
  }

  return deferred;
}

describe('Conformance Tests', function() {
  for (let testCase of loadTestCases()) {
    const isIgnored = ignoredRe.find(re => re.test(testCase.description));
    const isExclusive = exclusiveRe.find(re => re.test(testCase.description));

    if (isIgnored || (exclusiveRe.length > 0 && !isExclusive)) {
      xit(`${testCase.description}`, () => {});
    } else {
      it(`${testCase.description}`, () => runTest(testCase));
    }
  }
});
