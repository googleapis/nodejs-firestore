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

import duplexify from 'duplexify';
import googleProtoFiles from 'google-proto-files';
import is from 'is';
import path from 'path';
import assert from 'power-assert';
import protobufjs from 'protobufjs';
import through2 from 'through2';

import {google} from '../protos/firestore_proto_api';

import api = google.firestore.v1beta1;

import * as Firestore from '../src';

import {ResourcePath} from '../src/path';
import * as convert from '../src/convert';

import {createInstance as createInstanceHelper} from '../test/util/helpers';
import {AnyDuringMigration} from '../src/types';
import {DocumentChangeType} from '../src/document-change';

const REQUEST_TIME =
    api.DocumentTransform.FieldTransform.ServerValue.REQUEST_TIME;


/** List of test cases that are ignored. */
const ignoredRe: RegExp[] = [];

/** If non-empty, list the test cases to run exclusively. */
const exclusiveRe: RegExp[] = [];

// The project ID used in the conformance test protos.
const CONFORMANCE_TEST_PROJECT_ID = 'projectID';

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
      if (is.object(value)) {
        return convertObject(value);
      } else if (is.array(value)) {
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
  operator: op => api.StructuredQuery.FieldFilter.Operator[op] ||
      api.StructuredQuery.UnaryFilter.Operator[op],
  direction: dir => dir === 'DESCENDING' ?
      api.StructuredQuery.Direction.DESCENDING :
      api.StructuredQuery.Direction.ASCENDING,
  targetChange: type => type ? type : 'NO_CHANGE',
  commitRequest: commitRequest => {
    const deepCopy = JSON.parse(JSON.stringify(commitRequest));
    for (const write of deepCopy.writes) {
      if (write.update) {
        write.update.fields = convert.documentFromJson(write.update.fields);
      }
      if (write.transform) {
        write.transform.fieldTransforms = write.transform.fieldTransforms.map(
            transform => convertProto.transform(transform));
      }
    }

    return deepCopy;
  },
  transform: transform => {
    const deepCopy = JSON.parse(JSON.stringify(transform));
    if (deepCopy.setToServerValue === 'REQUEST_TIME') {
      deepCopy.setToServerValue = REQUEST_TIME;
    }
    return deepCopy;
  },
  position: position => {
    const deepCopy = JSON.parse(JSON.stringify(position));
    const values: Array<{}> = [];
    for (const value of position.values) {
      values.push(convert.valueFromJson(value));
    }
    deepCopy.values = values;
    return deepCopy;
  },
  structuredQuery: queryRequest => {
    const deepCopy = JSON.parse(JSON.stringify(queryRequest));
    if (deepCopy.where && deepCopy.where.fieldFilter) {
      deepCopy.where.fieldFilter.op =
          convertProto.operator(deepCopy.where.fieldFilter.op);
      deepCopy.where.fieldFilter.value =
          convert.valueFromJson(deepCopy.where.fieldFilter.value);
    }
    if (deepCopy.where && deepCopy.where.compositeFilter) {
      deepCopy.where.compositeFilter.op =
          api.StructuredQuery.CompositeFilter.Operator.AND;
      for (const filter of deepCopy.where.compositeFilter.filters) {
        filter.fieldFilter.op = convertProto.operator(filter.fieldFilter.op);
        filter.fieldFilter.value =
            convert.valueFromJson(filter.fieldFilter.value);
      }
    }
    if (deepCopy.where && deepCopy.where.unaryFilter) {
      deepCopy.where.unaryFilter.op =
          convertProto.operator(deepCopy.where.unaryFilter.op);
    }
    if (deepCopy.orderBy) {
      for (const orderBy of deepCopy.orderBy) {
        orderBy.direction = convertProto.direction(orderBy.direction);
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
  listenRequest: listenRequest => {
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
      assert.deepEqual(request, convertProto.commitRequest(spec.request));
      const res: google.firestore.v1beta1.IWriteResponse = {
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
    assert.deepEqual(
        request.structuredQuery, convertProto.structuredQuery(spec.query));
    const stream = through2.obj();
    setImmediate(() => stream.push(null));
    return stream;
  };
}

/** Request handler for _batchGetDocuments. */
function getHandler(spec) {
  return request => {
    const getDocument = spec.request;
    assert.equal(request.documents[0], getDocument.name);
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
              assert.equal(expectedSnapshots.length, 0);
              unlisten();
              reject(err);
            });

        for (const response of spec.responses) {
          writeStream.write(convertProto.listenRequest(response));
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
        assert.ok(
            !testSpec.isError, 'Expected test to fail, but test succeeded');
      },
      err => {
        if (!testSpec.isError) {
          throw err;
        }
      });
}

describe('Conformance Tests', () => {
  const loadTestCases = () => {
    const protobufRoot = new protobufjs.Root();

    protobufRoot.resolvePath = (origin, target) => {
      if (/^google\/.*/.test(target)) {
        target = path.join(googleProtoFiles(), target.substr('google/'.length));
      }
      return target;
    };

    const protoDefinition =
        protobufRoot.loadSync(path.join(__dirname, 'test-definition.proto'));

    const binaryProtoData =
        require('fs').readFileSync(path.join(__dirname, 'test-suite.binproto'));

    const testType = protoDefinition.lookupType('tests.TestSuite');
    // tslint:disable-next-line:no-any
    const testSuite: any = testType.decode(binaryProtoData);

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
