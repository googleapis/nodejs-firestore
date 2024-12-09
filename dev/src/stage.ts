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
export class AddFields implements Stage {
  name = 'add_fields';

  constructor(private fields: Map<string, Expr>) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.fields)!],
    };
  }
}

/**
 * @beta
 */
export class RemoveFields implements Stage {
  name = 'remove_fields';

  constructor(private fields: Field[]) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: this.fields.map(f => serializer.encodeValue(f)!),
    };
  }
}

/**
 * @beta
 */
export class Aggregate implements Stage {
  name = 'aggregate';

  constructor(
    private accumulators: Map<string, Accumulator>,
    private groups: Map<string, Expr>
  ) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeValue(this.accumulators)!,
        serializer.encodeValue(this.groups)!,
      ],
    };
  }
}

/**
 * @beta
 */
export class Distinct implements Stage {
  name = 'distinct';

  constructor(private groups: Map<string, Expr>) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.groups)!],
    };
  }
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
export class CollectionGroupSource implements Stage {
  name = 'collection_group';

  constructor(private collectionId: string) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [{referenceValue: ''}, serializer.encodeValue(this.collectionId)!],
    };
  }
}

/**
 * @beta
 */
export class DatabaseSource implements Stage {
  name = 'database';

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
    };
  }
}

/**
 * @beta
 */
export class DocumentsSource implements Stage {
  name = 'documents';

  constructor(private docPaths: string[]) {}

  static of(refs: DocumentReference[]): DocumentsSource {
    return new DocumentsSource(refs.map(ref => '/' + ref.path));
  }

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: this.docPaths.map(p => {
        return {referenceValue: p};
      }),
    };
  }
}

/**
 * @beta
 */
export class Where implements Stage {
  name = 'where';

  constructor(private condition: firestore.FilterCondition & firestore.Expr) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [(this.condition as unknown as Expr)._toProto(serializer)],
    };
  }
}

/**
 * @beta
 */
export interface FindNearestOptions {
  field: firestore.Field | string;
  vectorValue: firestore.VectorValue | number[];
  distanceMeasure: 'euclidean' | 'cosine' | 'dot_product';
  limit?: number;
  distanceField?: string;
}

/**
 * @beta
 */
export class FindNearest implements Stage {
  name = 'find_nearest';

  constructor(private _options: FindNearestOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    const options: {[k: string]: api.IValue} = {
      limit: serializer.encodeValue(this._options.limit)!,
    };
    if (this._options.distanceField) {
      options.distance_field = Field.of(this._options.distanceField)._toProto(
        serializer
      );
    }

    return {
      name: this.name,
      args: [
        (typeof this._options.field === 'string'
          ? Field.of(this._options.field)
          : (this._options.field as unknown as Field)
        )._toProto(serializer),
        this._options.vectorValue instanceof VectorValue
          ? serializer.encodeValue(this._options.vectorValue)!
          : serializer.encodeVector(this._options.vectorValue as number[]),
        serializer.encodeValue(this._options.distanceMeasure)!,
      ],
      options,
    };
  }
}

/**
 * @beta
 */
export interface SampleOptions {
  limit: number;
  mode: 'documents' | 'percent';
}

/**
 * @beta
 */
export class Sample implements Stage {
  name = 'sample';

  constructor(private _options: SampleOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeValue(this._options.limit)!,
        serializer.encodeValue(this._options.mode)!,
      ],
    };
  }
}

/**
 * @beta
 */
export class Union implements Stage {
  name = 'union';

  constructor(private _other: FirebaseFirestore.Pipeline<unknown>) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this._other)!],
    };
  }
}

/**
 * @beta
 */
export interface UnnestOptions {
  field: firestore.Selectable | string;
  indexField?: string;
}

/**
 * @beta
 */
export class Unnest implements Stage {
  name = 'unnest';

  constructor(private options: UnnestOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    const args = [serializer.encodeValue(this.options.field)!];
    const indexField = this.options.indexField;
    if (indexField) {
      args.push(serializer.encodeValue(indexField));
    }
    return {
      name: this.name,
      args: args,
    };
  }
}

/**
 * @beta
 */
export class Limit implements Stage {
  name = 'limit';

  constructor(private limit: number) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.limit)!],
    };
  }
}

/**
 * @beta
 */
export class Offset implements Stage {
  name = 'offset';

  constructor(private offset: number) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.offset)!],
    };
  }
}

/**
 * @beta
 */
export class Replace implements Stage {
  name = 'replace';

  constructor(
    private field: Expr,
    private mode:
      | 'full_replace'
      | 'merge_prefer_nest'
      | 'merge_prefer_parent' = 'full_replace'
  ) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeValue(this.field)!,
        serializer.encodeValue(this.mode),
      ],
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

/**
 * @beta
 */
export class Sort implements Stage {
  name = 'sort';

  constructor(private orders: Ordering[]) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: this.orders.map(o => o._toProto(serializer)),
    };
  }
}

/**
 * @beta
 */
export class GenericStage implements Stage {
  constructor(
    public name: string,
    params: any[]
  ) {}

  _toProto(serializer: Serializer): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}
