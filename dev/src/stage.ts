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
  AggregateFunction,
  Expr,
  Field,
  Ordering,
  field,
  BooleanExpr,
} from './expression';
import {VectorValue} from './field-value';
import {DocumentReference} from './reference/document-reference';
import {ProtoSerializable, Serializer} from './serializer';
import {Pipeline} from './pipeline';

/**
 * @beta
 */
export interface Stage extends ProtoSerializable<api.Pipeline.IStage> {
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
    private accumulators: Map<string, AggregateFunction>,
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

  _toProto(_: Serializer): api.Pipeline.IStage {
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

  _toProto(_: Serializer): api.Pipeline.IStage {
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

  static of(refs: Array<string | DocumentReference>): DocumentsSource {
    return new DocumentsSource(
      refs.map(ref =>
        ref instanceof DocumentReference
          ? '/' + ref.path
          : ref.startsWith('/')
            ? ref
            : '/' + ref
      )
    );
  }

  _toProto(_: Serializer): api.Pipeline.IStage {
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

  constructor(private condition: BooleanExpr) {}

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
      options.distance_field = field(this._options.distanceField)._toProto(
        serializer
      );
    }

    return {
      name: this.name,
      args: [
        (typeof this._options.field === 'string'
          ? field(this._options.field)
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

  constructor(private _other: Pipeline) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this._other)],
    };
  }
}

/**
 * @beta
 */
export interface UnnestOptions {
  expr: Expr;
  alias: Field;
  indexField?: string;
}

/**
 * @beta
 */
export class Unnest implements Stage {
  name = 'unnest';

  constructor(private options: UnnestOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    const args: api.IValue[] = [
      this.options.expr._toProto(serializer),
      this.options.alias._toProto(serializer),
    ];
    const indexField = this.options?.indexField;
    if (indexField) {
      return {
        name: this.name,
        args: args,
        options: {
          indexField: serializer.encodeValue(indexField),
        },
      };
    } else {
      return {
        name: this.name,
        args: args,
      };
    }
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
export class ReplaceWith implements Stage {
  name = 'replace_with';

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
  /**
   * @private
   * @internal
   */
  constructor(
    public name: string,
    private params: Array<AggregateFunction | Expr>
  ) {}

  /**
   * @internal
   * @private
   */
  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: this.params.map(o => o._toProto(serializer)),
    };
  }
}
