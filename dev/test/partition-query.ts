// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {describe, it, beforeEach, afterEach} from 'mocha';
import {expect} from 'chai';

import * as extend from 'extend';

import {google} from '../protos/firestore_v1_proto_api';
import {Firestore} from '../src';
import {setTimeoutHandler} from '../src/backoff';
import {
  ApiOverride,
  createInstance,
  document,
  stream,
  verifyInstance,
} from './util/helpers';

import api = google.firestore.v1;

const PROJECT_ID = 'test-project';
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;

export function partitionQueryEquals(
  actual: api.IPartitionQueryRequest | undefined,
  partitionCount: number
) {
  expect(actual).to.not.be.undefined;

  const query: api.IPartitionQueryRequest = {
    parent: DATABASE_ROOT + '/documents',
    structuredQuery: {
      from: [
        {
          allDescendants: true,
          collectionId: 'collectionId',
        },
      ],
      orderBy: [
        {
          direction: 'ASCENDING',
          field: {
            fieldPath: '__name__',
          },
        },
      ],
    },
    partitionCount,
  };

  // 'extend' removes undefined fields in the request object. The backend
  // ignores these fields, but we need to manually strip them before we compare
  // the expected and the actual request.
  actual = extend(true, {}, actual);
  expect(actual).to.deep.eq(query);
}

export function result(documentId: string): api.IRunQueryResponse {
  return {document: document(documentId), readTime: {seconds: 5, nanos: 6}};
}

describe('Partition Query', () => {
  let firestore: Firestore;

  beforeEach(() => {
    setTimeoutHandler(setImmediate);
    return createInstance().then(firestoreInstance => {
      firestore = firestoreInstance;
    });
  });

  afterEach(() => {
    verifyInstance(firestore);
    setTimeoutHandler(setTimeout);
  });

  it('requests one less than desired partitions', () => {
    const desiredPartitionsCount = 1;

    const overrides: ApiOverride = {
      partitionQueryStream: request => {
        partitionQueryEquals(
          request,
          /* partitionCount= */ desiredPartitionsCount - 1
        );

        return stream();
      },
    };
    return createInstance(overrides).then(async firestore => {
      const query = firestore.collectionGroup('collectionId');

      const result = await query.getPartitions(desiredPartitionsCount);
      expect(result.length).to.equal(1);
      expect(result[0].startAt).to.be.undefined;
      expect(result[0].endBefore).to.be.undefined;
    });
  });

  it("doesn't truncate large numbers", () => {
    // JavaScript by default truncates large numbers. If partition data were
    // to include truncated numbers, using them as cursors could skip or
    // duplicate results. Note that the backend API currently only returns
    // DocumentReferences as partitions, but this may change in the future.
    const bigIntValue = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
    const desiredPartitionsCount = 2;

    const overrides: ApiOverride = {
      partitionQueryStream: request => {
        partitionQueryEquals(
          request,
          /* partitionCount= */ desiredPartitionsCount - 1
        );

        return stream<api.ICursor>({
          values: [{integerValue: bigIntValue.toString()}],
        });
      },
      runQuery: request => {
        expect(
          request!.structuredQuery!.endAt!.values![0].integerValue
        ).to.equal(bigIntValue.toString());
        return stream();
      },
    };
    return createInstance(overrides).then(async firestore => {
      const query = firestore.collectionGroup('collectionId');

      const result = await query.getPartitions(desiredPartitionsCount);
      expect(result.length).to.equal(2);

      // If the user uses the cursor directly, we follow the `useBigInt`
      // setting. By default, we return a truncated number.
      expect(result[0].endBefore![0]).to.be.a('number');
      expect(result[1].startAt![0]).to.be.a('number');
      return result[0].toQuery().get();
    });
  });
});
