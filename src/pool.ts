/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import assert from 'assert';

/**
 * An auto-resizing pool that distributes concurrent operations over multiple
 * clients of type `T`.
 *
 * ClientPool is used within Firestore to manage a pool of GAPIC clients and
 * automatically initializes multiple clients if we issue more than 100
 * concurrent operations.
 */
export class ClientPool<T> {
  private activeClients: Map<T, number> = new Map();

  /**
   * @param {number} concurrentOperationLimit - The number of operations that
   * each client can handle.
   * @param {() => T} clientFactory - A factory function called as needed when
   * new clients are required.
   */
  constructor(
      private readonly concurrentOperationLimit: number,
      private readonly clientFactory: () => T) {}

  /**
   * Returns an already existing client if it has less than the maximum number
   * of concurrent operations or initializes and returns a new client.
   */
  private acquire(): T {
    let selectedClient: T|null = null;
    let currentRequestCount = 0;

    this.activeClients.forEach((requestCount, client) => {
      if (!selectedClient && requestCount < this.concurrentOperationLimit) {
        selectedClient = client;
        currentRequestCount = requestCount;
      }
    });

    if (!selectedClient) {
      selectedClient = this.clientFactory();
      assert(
          !this.activeClients.has(selectedClient),
          'The provided client factory returned an existing instance');
    }

    this.activeClients.set(selectedClient, currentRequestCount + 1);

    return selectedClient!;
  }

  /**
   * Reduces the number of operation for the provided client, potentially
   * removing it from the pool of active clients.
   */
  private release(client: T): void {
    let currentRequestCount = this.activeClients.get(client);
    assert(currentRequestCount! > 0, 'Active client not found');

    currentRequestCount = currentRequestCount! - 1;
    this.activeClients.set(client, currentRequestCount);

    if (currentRequestCount === 0) {
      this.garbageCollect();
    }
  }

  /**
   * The number of currently registered clients.
   *
   * @return {number} Number of currently registered clients.
   */
  // Visible for testing.
  get size(): number {
    return this.activeClients.size;
  }

  /**
   * Runs the provided operation in this pool. This function may create an
   * additional client if all existing clients already operate at the concurrent
   * operation limit.
   *
   * @param {(client: T) => Promise<V>} op - A callback function that returns a
   * Promise. The client T will be returned to the pool when callback finishes.
   * @return {Promise<V>} A Promise that resolves with the result of `op`.
   */
  run<V>(op: (client: T) => Promise<V>): Promise<V> {
    const client = this.acquire();

    return op(client)
        .catch(err => {
          this.release(client);
          return Promise.reject(err);
        })
        .then(res => {
          this.release(client);
          return res;
        });
  }

  /**
   * Deletes clients that are no longer executing operations. Keeps up to one
   * idle client to reduce future initialization costs.
   */
  private garbageCollect(): void {
    let idleClients = 0;
    this.activeClients.forEach((requestCount, client) => {
      if (requestCount === 0) {
        ++idleClients;

        if (idleClients > 1) {
          this.activeClients.delete(client);
        }
      }
    });
  }
}
