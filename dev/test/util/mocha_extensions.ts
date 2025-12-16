/**
 * @license
 * Copyright 2025 Google LLC
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

/* eslint-disable no-restricted-properties */

import {describe, it} from 'mocha';

// Helper to make a type itselt (T) and optionally union that with (T['skip'])
type tOrSkipT<T> = T | (T extends {skip: unknown} ? T['skip'] : T);

interface ExtendMochaTypeWithHelpers<T> {
  // Declare helpers
  skipEnterprise: tOrSkipT<T>;
  skipEmulator: tOrSkipT<T>;
  skipClassic: tOrSkipT<T>;
}

declare module 'mocha' {
  type TestFunction = ExtendMochaTypeWithHelpers<TestFunction>;
  type PendingTestFunction = ExtendMochaTypeWithHelpers<PendingTestFunction>;
  type SuiteFunction = ExtendMochaTypeWithHelpers<SuiteFunction>;
  type PendingSuiteFunction = ExtendMochaTypeWithHelpers<PendingSuiteFunction>;
}

// Define helpers
export function mixinSkipImplementations(obj: unknown): void {
  Object.defineProperty(obj, 'skipEnterprise', {
    get(): unknown {
      if (this === it.skip) {
        return this;
      }
      if (this === describe.skip) {
        return this;
      }
      if (process.env.RUN_ENTERPRISE_TESTS) {
        return this.skip;
      }
      return this;
    },
  });

  Object.defineProperty(obj, 'skipEmulator', {
    get(): unknown {
      if (this === it.skip) {
        return this;
      }
      if (this === describe.skip) {
        return this;
      }
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        return this.skip;
      }
      return this;
    },
  });

  Object.defineProperty(obj, 'skipClassic', {
    get(): unknown {
      if (this === it.skip) {
        return this;
      }
      if (this === describe.skip) {
        return this;
      }
      if (!process.env.RUN_ENTERPRISE_TESTS) {
        return this.skip;
      }
      return this;
    },
  });
}

// TODO add mocha functions that must be extended
[it, it.skip, describe, describe.skip].forEach(mixinSkipImplementations);
