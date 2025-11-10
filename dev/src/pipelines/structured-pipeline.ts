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

import {ProtoSerializable, Serializer} from '../serializer';
import {google} from '../../protos/firestore_v1_proto_api';
import IStructuredPipeline = google.firestore.v1.IStructuredPipeline;
import IPipeline = google.firestore.v1.IPipeline;
import {OptionsUtil} from './options-util';

export type StructuredPipelineOptions = {
  indexMode?: 'recommended';
  explainOptions?: {
    mode?: 'execute' | 'explain' | 'analyze';
    outputFormat?: 'text';
  };
};

export class StructuredPipeline
  implements ProtoSerializable<IStructuredPipeline>
{
  readonly optionsUtil = new OptionsUtil({
    indexMode: {
      serverName: 'index_mode',
    },
    explainOptions: {
      serverName: 'explain_options',
      nestedOptions: {
        mode: {
          serverName: 'mode',
        },
        outputFormat: {
          serverName: 'output_format',
        },
      },
    },
  });

  constructor(
    private pipeline: ProtoSerializable<IPipeline>,
    private options: StructuredPipelineOptions,
    private optionsOverride: Record<string, unknown>,
  ) {}

  _toProto(serializer: Serializer): IStructuredPipeline {
    return {
      pipeline: this.pipeline._toProto(serializer),
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.optionsOverride,
      ),
    };
  }
}
