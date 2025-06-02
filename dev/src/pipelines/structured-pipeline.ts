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

import {ApiMapValue} from '../types';
import {ObjectValue, ProtoSerializable, Serializer} from '../serializer';
import {google} from '../../protos/firestore_v1_proto_api';
import IStructuredPipeline = google.firestore.v1.IStructuredPipeline;
import {ObjectValueFieldPath} from '../path';
import {mapToArray} from '../util';
import IPipeline = google.firestore.v1.IPipeline;

export interface StructuredPipelineOptions {
  indexMode?: 'recommended';
}

export class StructuredPipeline
  implements ProtoSerializable<IStructuredPipeline>
{
  constructor(
    private pipeline: ProtoSerializable<IPipeline>,
    private options: StructuredPipelineOptions,
    private optionsOverride: ApiMapValue
  ) {}

  /**
   * @private
   * @internal for testing
   */
  _getKnownOptions(): ObjectValue {
    const options: ObjectValue = ObjectValue.empty();

    // SERIALIZE KNOWN OPTIONS
    if (typeof this.options.indexMode === 'string') {
      options.set(new ObjectValueFieldPath('index_mode'), {
        stringValue: this.options.indexMode,
      });
    }

    return options;
  }

  private getOptionsProto(): ApiMapValue {
    const options: ObjectValue = this._getKnownOptions();

    // APPLY OPTIONS OVERRIDES
    const optionsMap = new Map(
      mapToArray(this.optionsOverride, (value, key) => [
        ObjectValueFieldPath.fromDotNotation(key),
        value,
      ])
    );
    options.setAll(optionsMap);

    return options.value.mapValue.fields ?? {};
  }

  _toProto(serializer: Serializer): IStructuredPipeline {
    return {
      pipeline: this.pipeline._toProto(serializer),
      options: this.getOptionsProto(),
    };
  }
}
