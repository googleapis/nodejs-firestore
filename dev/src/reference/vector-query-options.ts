/**
 * Copyright 2024 Google LLC. All Rights Reserved.
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
import * as firestore from '@google-cloud/firestore';

export class VectorQueryOptions {
  constructor(
    readonly distanceResultField?: string | firestore.FieldPath,
    readonly distanceThreshold?: number
  ) {}

  isEqual(other: VectorQueryOptions): boolean {
    if (this === other) {
      return true;
    }
    if (!(other instanceof VectorQueryOptions)) {
      return false;
    }

    return (
      this.distanceThreshold === other.distanceThreshold &&
      this._rawDistanceResultField === other._rawDistanceResultField
    );
  }

  /**
   * @private
   * @internal
   */
  private get _rawDistanceResultField(): string | undefined {
    if (typeof this.distanceResultField === 'undefined') return undefined;

    return typeof this.distanceResultField === 'string'
      ? this.distanceResultField
      : this.distanceResultField.toString();
  }
}
