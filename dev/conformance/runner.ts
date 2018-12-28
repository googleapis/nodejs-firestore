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
const duplexify = require('duplexify');

import * as is from 'is';
import * as path from 'path';
import * as protobufjs from 'protobufjs';
import * as through2 from 'through2';

import * as proto from '../protos/firestore_proto_api';
import api = proto.google.firestore.v1beta1;

import * as Firestore from '../src';

import {ResourcePath} from '../src/path';
import * as convert from '../src/convert';

import {createInstance as createInstanceHelper} from '../test/util/helpers';
import {AnyDuringMigration} from '../src/types';
import {DocumentChangeType} from '../src/document-change';

const REQUEST_TIME = 'REQUEST_TIME';

/** List of test cases that are ignored. */
const ignoredRe: RegExp[] = [];

/** If non-empty, list the test cases to run exclusively. */
const exclusiveRe: RegExp[] = [];

// The project ID used in the conformance test protos.
const CONFORMANCE_TEST_PROJECT_ID = 'projectID';

// Load Protobuf definition and types
const protobufRoot = new protobufjs.Root();
protobufRoot.resolvePath = (origin, target) => {
  if (/^google\/.*/.test(target)) {
    target = path.join(__dirname, '../protos', target);
  }
  return target;
};
const protoDefinition =
    protobufRoot.loadSync(path.join(__dirname, 'test-definition.proto'));

const TEST_SUITE_TYPE = protoDefinition.lookupType('tests.TestSuite');
const STRUCTURED_QUERY_TYPE =
    protoDefinition.lookupType('google.firestore.v1beta1.StructuredQuery');
const COMMIT_REQUEST_TYPE =
    protoDefinition.lookupType('google.firestore.v1beta1.CommitRequest');

// Firestore instance initialized by the test runner.
let firestore;

const docRef = path => {
  const relativePath = ResourcePath.fromSlashSeparatedString(path).relativeName;
  return firestore.doc(relativePath);
};

const collRef = path => {
  const relativePath = ResourcePath.fromSlashSeparatedString(path).relativeName;
  return firestore.collection(relativePath);
};

const watchQuery = () => {
  return firestore.collection('C').orderBy('a');
};

const createInstance = overrides => {
  return createInstanceHelper(
             overrides, {projectId: CONFORMANCE_TEST_PROJECT_ID})
      .then(firestoreClient => {
        firestore = firestoreClient;
      });
};


/** Converts JSON test data into JavaScript types suitable for the Node API. */
const convertInput = {
  argument: json => {
    const obj = JSON.parse(json);
    function convertValue(value) {
      if (isObject(value)) {
        return convertObject(value);
      } else if (Array.isArray(value)) {
        return convertArray(value);
      } else if (value === 'NaN') {
        return NaN;
      } else if (value === 'Delete') {
        return Firestore.FieldValue.delete();
      } else if (value === 'ServerTimestamp') {
        return Firestore.FieldValue.serverTimestamp();
      }

      return value;
    }
    function convertArray(arr) {
      if (arr.length > 0 && arr[0] === 'ArrayUnion') {
        return Firestore.FieldValue.arrayUnion(...convertArray(arr.slice(1)));
      } else if (arr.length > 0 && arr[0] === 'ArrayRemove') {
        return Firestore.FieldValue.arrayRemove(...convertArray(arr.slice(1)));
      } else {
        for (let i = 0; i < arr.length; ++i) {
          arr[i] = convertValue(arr[i]);
        }
        return arr;
      }
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
      deepCopy.lastUpdateTime =
          Firestore.Timestamp.fromProto(deepCopy.updateTime);
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
    const convertedPaths: Array<{}> = [];
    if (fields) {
      for (const field of fields) {
        convertedPaths.push(convertInput.path(field));
      }
    } else {
      convertedPaths.push(Firestore.FieldPath.documentId());
    }
    return convertedPaths;
  },
  cursor: cursor => {
    const args: Array<{}> = [];
    if (cursor.docSnapshot) {
      args.push(Firestore.DocumentSnapshot.fromObject(
          docRef(cursor.docSnapshot.path),
          convertInput.argument(cursor.docSnapshot.jsonData)));
    } else {
      for (const jsonValue of cursor.jsonValues) {
        args.push(convertInput.argument(jsonValue));
      }
    }
    return args;
  },
  snapshot: snapshot => {
    const docs: Firestore.QueryDocumentSnapshot[] = [];
    const changes: Firestore.DocumentChange[] = [];
    const readTime = Firestore.Timestamp.fromProto(snapshot.readTime);

    for (const doc of snapshot.docs) {
      const deepCopy = JSON.parse(JSON.stringify(doc));
      deepCopy.fields = convert.documentFromJson(deepCopy.fields);
      docs.push(
          firestore.snapshot_(deepCopy, readTime, 'json') as
          Firestore.QueryDocumentSnapshot);
    }

    for (const change of snapshot.changes) {
      const deepCopy = JSON.parse(JSON.stringify(change.doc));
      deepCopy.fields = convert.documentFromJson(deepCopy.fields);
      const doc = firestore.snapshot_(deepCopy, readTime, 'json');
      const type =
          (['unspecified', 'added', 'removed', 'modified'][change.kind] as
           DocumentChangeType);
      changes.push(new Firestore.DocumentChange(
          type, doc, change.oldIndex, change.newIndex));
    }

    return new Firestore.QuerySnapshot(
        watchQuery(), readTime, docs.length, () => docs, () => changes);
  },
};

/** Converts Firestore Protobuf types in Proto3 JSON format to Protobuf JS. */
const convertProto = {
  targetChange: type => type || 'NO_CHANGE',
  listenResponse: listenRequest => {
    const deepCopy = JSON.parse(JSON.stringify(listenRequest));
    if (deepCopy.targetChange) {
      deepCopy.targetChange.targetChangeType =
          convertProto.targetChange(deepCopy.targetChange.targetChangeType);
    }
    if (deepCopy.documentChange) {
      deepCopy.documentChange.document.fields =
          convert.documentFromJson(deepCopy.documentChange.document.fields);
    }
    return deepCopy;
  },
};

/** Request handler for _commit. */
function commitHandler(spec) {
  return (request, options, callback) => {
    try {
      const actualCommit = COMMIT_REQUEST_TYPE.fromObject(request);
      const expectedCommit = COMMIT_REQUEST_TYPE.fromObject(spec.request);
      expect(actualCommit).to.deep.equal(expectedCommit);
      const res: api.IWriteResponse = {
        commitTime: {},
        writeResults: [],
      };
      for (let i = 1; i <= request.writes.length; ++i) {
        res.writeResults!.push({
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
    const actualQuery =
        STRUCTURED_QUERY_TYPE.fromObject(request.structuredQuery);
    const expectedQuery = STRUCTURED_QUERY_TYPE.fromObject(spec.query);
    expect(actualQuery).to.deep.equal(expectedQuery);
    const stream = through2.obj();
    setImmediate(() => stream.push(null));
    return stream;
  };
}

/** Request handler for _batchGetDocuments. */
function getHandler(spec) {
  return request => {
    const getDocument = spec.request;
    expect(request.documents[0]).to.equal(getDocument.name);
    const stream = through2.obj();
    setImmediate(() => {
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
  console.log(`Running Spec:\n${JSON.stringify(spec, null, 2)}\n`);

  const updateTest = spec => {
    const overrides = {commit: commitHandler(spec)};
    return createInstance(overrides).then(() => {
      const varargs: Array<{}> = [];

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

  const queryTest = spec => {
    const overrides = {runQuery: queryHandler(spec)};
    const applyClause = (query, clause) => {
      if (clause.select) {
        query =
            query.select.apply(query, convertInput.paths(clause.select.fields));
      } else if (clause.where) {
        const fieldPath = convertInput.path(clause.where.path);
        const value = convertInput.argument(clause.where.jsonValue);
        query = query.where(fieldPath, clause.where.op, value);
      } else if (clause.orderBy) {
        const fieldPath = convertInput.path(clause.orderBy.path);
        query = query.orderBy(fieldPath, clause.orderBy.direction);
      } else if (clause.offset) {
        query = query.offset(clause.offset);
      } else if (clause.limit) {
        query = query.limit(clause.limit);
      } else if (clause.startAt) {
        query = query.startAt.apply(query, convertInput.cursor(clause.startAt));
      } else if (clause.startAfter) {
        query = query.startAfter.apply(
            query, convertInput.cursor(clause.startAfter));
      } else if (clause.endAt) {
        query = query.endAt.apply(query, convertInput.cursor(clause.endAt));
      } else if (clause.endBefore) {
        query =
            query.endBefore.apply(query, convertInput.cursor(clause.endBefore));
      }

      return query;
    };

    return createInstance(overrides).then(() => {
      let query = collRef(spec.collPath);
      for (const clause of spec.clauses) {
        query = applyClause(query, clause);
      }
      return query.get();
    });
  };

  const deleteTest = spec => {
    const overrides = {commit: commitHandler(spec)};
    return createInstance(overrides).then(() => {
      if (spec.precondition) {
        const precondition = convertInput.precondition(deleteSpec.precondition);
        return docRef(spec.docRefPath).delete(precondition);
      } else {
        return docRef(spec.docRefPath).delete();
      }
    });
  };

  const setTest = spec => {
    const overrides = {commit: commitHandler(spec)};
    return createInstance(overrides).then(() => {
      const setOption: AnyDuringMigration = {};
      if (spec.option && spec.option.all) {
        setOption.merge = true;
      } else if (spec.option && spec.option.fields) {
        setOption.mergeFields = [];
        for (const fieldPath of spec.option.fields) {
          setOption.mergeFields.push(new Firestore.FieldPath(fieldPath.field));
        }
      }
      return docRef(setSpec.docRefPath)
          .set(convertInput.argument(spec.jsonData), setOption);
    });
  };

  const createTest = spec => {
    const overrides = {commit: commitHandler(spec)};
    return createInstance(overrides).then(() => {
      return docRef(spec.docRefPath)
          .create(convertInput.argument(spec.jsonData));
    });
  };

  const getTest = spec => {
    const overrides = {batchGetDocuments: getHandler(spec)};
    return createInstance(overrides).then(() => {
      return docRef(spec.docRefPath).get();
    });
  };

  const watchTest = spec => {
    const expectedSnapshots = spec.snapshots;
    const writeStream = through2.obj();
    const overrides = {
      listen: () => duplexify.obj(through2.obj(), writeStream)
    };

    return createInstance(overrides).then(() => {
      return new Promise((resolve, reject) => {
        const unlisten = watchQuery().onSnapshot(
            actualSnap => {
              const expectedSnapshot = expectedSnapshots.shift();
              if (expectedSnapshot) {
                if (!actualSnap.isEqual(
                        convertInput.snapshot(expectedSnapshot))) {
                  reject(
                      new Error('Expected and actual snapshots do not match.'));
                }

                if (expectedSnapshots.length === 0 || !spec.isError) {
                  unlisten();
                  resolve();
                }
              } else {
                reject(new Error('Received unexpected snapshot'));
              }
            },
            err => {
              expect(expectedSnapshots).to.have.length(0);
              unlisten();
              reject(err);
            });

        for (const response of spec.responses) {
          writeStream.write(convertProto.listenResponse(response));
        }
      });
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
  const listenSpec = spec.listen;

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
  } else if (listenSpec) {
    testSpec = listenSpec;
    testPromise = watchTest(listenSpec);
  } else {
    return Promise.reject(new Error(`Unhandled Spec: ${JSON.stringify(spec)}`));
  }

  return testPromise.then(
      () => {
        expect(testSpec.isError || false).to.be.false;
      },
      err => {
        if (!testSpec.isError) {
          throw err;
        }
      });
}

describe('Conformance Tests', () => {
  const loadTestCases = () => {
    const binaryProtoData =
        require('fs').readFileSync(path.join(__dirname, 'test-suite.binproto'));

    // tslint:disable-next-line:no-any
    const testSuite: any = TEST_SUITE_TYPE.decode(binaryProtoData);

    return testSuite.tests;
  };

  for (const testCase of loadTestCases()) {
    const isIgnored = ignoredRe.find(re => re.test(testCase.description));
    const isExclusive = exclusiveRe.find(re => re.test(testCase.description));

    if (isIgnored || (exclusiveRe.length > 0 && !isExclusive)) {
      xit(`${testCase.description}`, () => {});
    } else {
      it(`${testCase.description}`, () => runTest(testCase));
    }
  }
});
