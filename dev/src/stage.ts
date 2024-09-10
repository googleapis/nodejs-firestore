// Copyright 2024 Google LLC
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

import * as firestore from '@google-cloud/firestore';
import * as protos from '../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;

import {
  Accumulator,
  Expr,
  Field,
  FilterCondition,
  Ordering,
} from './expression';
import {VectorValue} from './field-value';
import {DocumentReference} from './reference/document-reference';
import {Serializer} from './serializer';

/**
 * @beta
 */
export interface Stage {
  name: string;
  _toProto(serializer: Serializer): api.Pipeline.IStage;
}

/**
 * @beta
 */
export class CollectionSource implements Stage {
  name = 'collection';

  constructor(private collectionPath: string) {
    if (!this.collectionPath.startsWith('/')) {
      this.collectionPath = '/' + this.collectionPath;
    }
  }

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [{referenceValue: this.collectionPath}],
    };
  }
}

/**
 * @beta
 */
export class Select implements Stage {
  name = 'select';

  constructor(private projections: Map<string, Expr>) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.projections)!],
    };
  }
}
