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

const assert = require('power-assert');
const path = require('path');
const is = require('is');
const through = require('through2');
const googleProtoFiles = require('google-proto-files');
const protobufjs = require('protobufjs');
const grpc = require('google-gax').grpc().grpc;

const Firestore = require('../');
const reference = require('../src/reference')(Firestore);
const document = require('../src/document')(reference.DocumentReference);
const DocumentSnapshot = document.DocumentSnapshot;
const convert = require('../src/convert');
const ResourcePath = require('../src/path').ResourcePath;

const firestore = new Firestore({
  projectId: 'projectID',
  sslCreds: grpc.credentials.createInsecure(),
});

/** List of test cases that are ignored. */
const ignoredRe = [
  // Node doesn't support field masks for set().
  /^set-merge: .*$/,
];

/** If non-empty, list the test cases to run exclusively. */
const exclusiveRe = [
  /set: MergeAll cannot be specified with empty data./, // b/73495873
];

const docRef = function(path) {
  const relativePath = ResourcePath.fromSlashSeparatedString(path).relativeName;
  return firestore.doc(relativePath);
};

const collRef = function(path) {
  const relativePath = ResourcePath.fromSlashSeparatedString(path).relativeName;
  return firestore.collection(relativePath);
};

/** Converts JSON test data into JavaScript types suitable for the Node API. */
const convertInput = {
  argument: json => {
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
  },
  precondition: precondition => {
    const deepCopy = JSON.parse(JSON.stringify(precondition));
    if (deepCopy.updateTime) {
      deepCopy.lastUpdateTime = DocumentSnapshot.toISOTime(deepCopy.updateTime);
      delete deepCopy.updateTime;
    }
    return deepCopy;
  },
  path: path => {
    if (path.field.length === 1 && path.field[0] === '__name__') {
      return Firestore.FieldPath.documentId();
    }
    return new Firestore.FieldPath(path.field);
  },
  paths: fields => {
    const convertedPaths = [];
    if (fields) {
      for (let field of fields) {
        convertedPaths.push(convertInput.path(field));
      }
    } else {
      convertedPaths.push(Firestore.FieldPath.documentId());
    }
    return convertedPaths;
  },
  cursor: cursor => {
    const args = [];
    if (cursor.docSnapshot) {
      args.push(
        DocumentSnapshot.fromObject(
          docRef(cursor.docSnapshot.path),
          convertInput.argument(cursor.docSnapshot.jsonData)
        )
      );
    } else {
      for (let jsonValue of cursor.jsonValues) {
        args.push(convertInput.argument(jsonValue));
      }
    }
    return args;
  },
};

/** Converts Firestore Protobuf types in Proto3 JSON format to Protobuf JS. */
const convertProto = {
  commitRequest: commitRequest => {
    const deepCopy = JSON.parse(JSON.stringify(commitRequest));
    for (let write of deepCopy.writes) {
      if (write.update) {
        write.update.fields = convert.documentFromJson(write.update.fields);
      }
    }

    return deepCopy;
  },
  position: position => {
    const deepCopy = JSON.parse(JSON.stringify(position));
    const values = [];
    for (let value of position.values) {
      values.push(convert.valueFromJson(value));
    }
    deepCopy.values = values;
    return deepCopy;
  },
  structuredQuery: queryRequest => {
    const deepCopy = JSON.parse(JSON.stringify(queryRequest));
    if (deepCopy.where && deepCopy.where.fieldFilter) {
      deepCopy.where.fieldFilter.value = convert.valueFromJson(
        deepCopy.where.fieldFilter.value
      );
    }
    if (deepCopy.where && deepCopy.where.compositeFilter) {
      for (let filter of deepCopy.where.compositeFilter.filters) {
        filter.fieldFilter.value = convert.valueFromJson(
          filter.fieldFilter.value
        );
      }
    }
    if (deepCopy.startAt) {
      deepCopy.startAt = convertProto.position(deepCopy.startAt);
    }
    if (deepCopy.endAt) {
      deepCopy.endAt = convertProto.position(deepCopy.endAt);
    }
    return deepCopy;
  },
};

/** Request handler for _commit. */
function commitHandler(spec) {
  return (request, options, callback) => {
    try {
      assert.deepEqual(request, convertProto.commitRequest(spec.request));

      const res = {
        commitTime: {},
        writeResults: [],
      };

      for (let i = 1; i <= request.writes.length; ++i) {
        res.writeResults.push({
          updateTime: {},
        });
      }

      callback(null, res);
    } catch (err) {
      callback(err);
    }
  };
}

/** Request handler for _runQuery. */
function queryHandler(spec) {
  return request => {
    assert.deepEqual(
      request.structuredQuery,
      convertProto.structuredQuery(spec.query)
    );

    let stream = through.obj();
    setImmediate(function() {
      stream.push(null);
    });
    return stream;
  };
}

/** Request handler for _batchGetDocuments. */
function getHandler(spec) {
  return request => {
    const getDocument = spec.request;
    assert.equal(request.documents[0], getDocument.name);

    let stream = through.obj();

    setImmediate(function() {
      stream.push({
        missing: getDocument.name,
        readTime: {seconds: 0, nanos: 0},
      });
      stream.push(null);
    });

    return stream;
  };
}

function runTest(spec) {
  console.log(`Running Spec:\n${JSON.stringify(spec, null, 2)}\n`); // eslint-disable-line no-console

  const updateTest = function(spec) {
    firestore.api.Firestore._commit = commitHandler(spec);

    return Promise.resolve().then(() => {
      let varargs = [];

      if (spec.jsonData) {
        varargs[0] = convertInput.argument(spec.jsonData);
      } else {
        for (let i = 0; i < spec.fieldPaths.length; ++i) {
          varargs[2 * i] = new Firestore.FieldPath(spec.fieldPaths[i].field);
        }
        for (let i = 0; i < spec.jsonValues.length; ++i) {
          varargs[2 * i + 1] = convertInput.argument(spec.jsonValues[i]);
        }
      }

      if (spec.precondition) {
        varargs.push(convertInput.precondition(spec.precondition));
      }

      const document = docRef(spec.docRefPath);
      return document.update.apply(document, varargs);
    });
  };

  const queryTest = function(spec) {
    firestore.api.Firestore._runQuery = queryHandler(spec);

    const applyClause = function(query, clause) {
      if (clause.select) {
        query = query.select.apply(
          query,
          convertInput.paths(clause.select.fields)
        );
      } else if (clause.where) {
        let fieldPath = convertInput.path(clause.where.path);
        let value = convertInput.argument(clause.where.jsonValue);
        query = query.where(fieldPath, clause.where.op, value);
      } else if (clause.orderBy) {
        let fieldPath = convertInput.path(clause.orderBy.path);
        query = query.orderBy(fieldPath, clause.orderBy.direction);
      } else if (clause.offset) {
        query = query.offset(clause.offset);
      } else if (clause.limit) {
        query = query.limit(clause.limit);
      } else if (clause.startAt) {
        query = query.startAt.apply(query, convertInput.cursor(clause.startAt));
      } else if (clause.startAfter) {
        query = query.startAfter.apply(
          query,
          convertInput.cursor(clause.startAfter)
        );
      } else if (clause.endAt) {
        query = query.endAt.apply(query, convertInput.cursor(clause.endAt));
      } else if (clause.endBefore) {
        query = query.endBefore.apply(
          query,
          convertInput.cursor(clause.endBefore)
        );
      }

      return query;
    };

    let query = collRef(spec.collPath);

    return Promise.resolve().then(() => {
      for (let clause of spec.clauses) {
        query = applyClause(query, clause);
      }
      return query.get();
    });
  };

  const deleteTest = function(spec) {
    firestore.api.Firestore._commit = commitHandler(spec);

    return Promise.resolve().then(() => {
      if (spec.precondition) {
        const precondition = convertInput.precondition(deleteSpec.precondition);
        return docRef(spec.docRefPath).delete(precondition);
      } else {
        return docRef(spec.docRefPath).delete();
      }
    });
  };

  const setTest = function(spec) {
    firestore.api.Firestore._commit = commitHandler(spec);

    return Promise.resolve().then(() => {
      const isMerge = !!(spec.option && spec.option.all);

      return docRef(setSpec.docRefPath).set(
        convertInput.argument(spec.jsonData),
        {
          merge: isMerge,
        }
      );
    });
  };

  const createTest = function(spec) {
    firestore.api.Firestore._commit = commitHandler(spec);

    return Promise.resolve().then(() => {
      return docRef(spec.docRefPath).create(
        convertInput.argument(spec.jsonData)
      );
    });
  };

  const getTest = function(spec) {
    firestore.api.Firestore._batchGetDocuments = getHandler(spec);

    return Promise.resolve().then(() => {
      return docRef(spec.docRefPath).get();
    });
  };

  let testSpec;
  let testPromise;

  const getSpec = spec.get;
  const createSpec = spec.create;
  const setSpec = spec.set;
  const updateSpec = spec.update || spec.updatePaths;
  const deleteSpec = spec.delete;
  const querySpec = spec.query;

  if (getSpec) {
    testSpec = getSpec;
    testPromise = getTest(getSpec);
  } else if (createSpec) {
    testSpec = createSpec;
    testPromise = createTest(createSpec);
  } else if (setSpec) {
    testSpec = setSpec;
    testPromise = setTest(setSpec);
  } else if (updateSpec) {
    testSpec = updateSpec;
    testPromise = updateTest(updateSpec);
  } else if (deleteSpec) {
    testSpec = deleteSpec;
    testPromise = deleteTest(deleteSpec);
  } else if (querySpec) {
    testSpec = querySpec;
    testPromise = queryTest(querySpec);
  } else {
    return Promise.reject(new Error(`Unhandled Spec: ${JSON.stringify(spec)}`));
  }

  return testPromise.then(
    () => {
      assert.ok(!testSpec.isError, 'Expected test to fail, but test succeeded');
    },
    err => {
      if (!testSpec.isError) {
        throw err;
      }
    }
  );
}

describe('Conformance Tests', function() {
  const loadTestCases = () => {
    const protobufRoot = new protobufjs.Root();

    protobufRoot.resolvePath = function(origin, target) {
      if (/^google\/.*/.test(target)) {
        target = path.join(googleProtoFiles(), target.substr('google/'.length));
      }
      return target;
    };

    const protoDefinition = protobufRoot.loadSync(
      path.join(__dirname, 'test-definition.proto')
    );

    const binaryProtoData = require('fs').readFileSync(
      path.join(__dirname, 'test-suite.binproto')
    );

    const testType = protoDefinition.lookupType('tests.TestSuite');
    const testSuite = testType.decode(binaryProtoData);

    return testSuite.tests;
  };

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
