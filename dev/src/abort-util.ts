/*!
 * Copyright 2024 Google Inc. All Rights Reserved.
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

/**
 * Interface for objects that can be cancelled.
 */
export interface Cancellable {
  cancel(): void;
}

/**
 * Utility class for working with AbortSignal and cancellable operations.
 */
export class AbortUtil {
  /**
   * Throws an error if the AbortSignal is already aborted.
   */
  static throwIfAborted(signal: AbortSignal | null): void {
    if (signal?.aborted) {
      throw new Error('The operation was aborted');
    }
  }

  /**
   * Creates a Promise that rejects when the AbortSignal is aborted.
   */
  static createAbortPromise<T>(
    signal: AbortSignal,
    cancellable: Cancellable
  ): Promise<T> {
    return new Promise<T>((_, reject) => {
      const onAbort = () => {
        cancellable.cancel();
        reject(new Error('The operation was aborted'));
      };

      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }

  /**
   * Makes a Promise cancellable with an AbortSignal.
   */
  static async makeCancellable<T>(
    promise: Promise<T>,
    cancellable: Cancellable,
    signal: AbortSignal | null
  ): Promise<T> {
    if (!signal) {
      return promise;
    }

    // Check if already aborted
    AbortUtil.throwIfAborted(signal);

    // Race the original promise against the abort promise
    return Promise.race([
      promise,
      AbortUtil.createAbortPromise<T>(signal, cancellable)
    ]);
  }
}