/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as firestore from '@google-cloud/firestore';

/**
 * Plan contains information about the planning stage of a query.
 */
export class Plan implements firestore.Plan {
  constructor(readonly indexesUsed: Record<string, unknown>) {}

  static fromProto(): Plan {
    return new Plan({});
  }
}

/** ExecutionStats contains information about the execution of a query. */
export class ExecutionStats implements firestore.ExecutionStats {
  constructor(
    readonly resultsReturned: number,
    readonly bytesReturned: number,
    readonly executionDuration: firestore.Duration,
    readonly readOperations: number,
    readonly debugStats: Record<string, unknown>
  ) {}

  static fromProto(): ExecutionStats {
    return new ExecutionStats(0, 0, {seconds: 0, nanoseconds: 0}, 0, {});
  }
}

/**
 * ExplainResults contains information about planning, execution, and results
 * of a query.
 */
export class ExplainResults<T> implements firestore.ExplainResults<T> {
  constructor(
    readonly plan: Plan,
    readonly executionStats: ExecutionStats | null,
    readonly snapshot: T | null
  ) {}
}
