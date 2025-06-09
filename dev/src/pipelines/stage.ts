// Copyright 2025 Google LLC
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
import * as protos from '../../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;

import {DocumentReference} from '../reference/document-reference';
import {ProtoSerializable, Serializer} from '../serializer';

import {
  AggregateFunction,
  BooleanExpr,
  Expr,
  Field,
  field,
  Ordering,
} from './expression';
import {
  AddFieldsStageOptions,
  AggregateStageOptions,
  CollectionGroupStageOptions,
  CollectionStageOptions,
  DatabaseStageOptions,
  DistinctStageOptions,
  DocumentsStageOptions,
  FindNearestStageOptions,
  LimitStageOptions,
  OffsetStageOptions,
  RemoveFieldsStageOptions,
  ReplaceWithStageOptions,
  SampleStageOptions,
  SelectStageOptions,
  SortStageOptions,
  UnionStageOptions,
  UnnestStageOptions,
  WhereStageOptions,
} from './stage-options';
import {isString} from './pipeline-util';
import {OptionsUtil} from './options-util';

/**
 *
 */
export interface Stage extends ProtoSerializable<api.Pipeline.IStage> {
  name: string;

  _toProto(serializer: Serializer): api.Pipeline.IStage;
}

export type InternalRemoveFieldsStageOptions = Omit<
  RemoveFieldsStageOptions,
  'fields'
> & {
  fields: Array<Field>;
};

/**
 *
 */
export class RemoveFields implements Stage {
  name = 'remove_fields';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalRemoveFieldsStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: this.options.fields.map(f => serializer.encodeValue(f)!),
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalAggregateStageOptions = Omit<
  AggregateStageOptions,
  'groups' | 'accumulators'
> & {
  groups: Map<string, Expr>;
  accumulators: Map<string, AggregateFunction>;
};

/**
 */
export class Aggregate implements Stage {
  name = 'aggregate';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalAggregateStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeValue(this.options.accumulators)!,
        serializer.encodeValue(this.options.groups)!,
      ],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalDistinctStageOptions = Omit<
  DistinctStageOptions,
  'groups'
> & {
  groups: Map<string, Expr>;
};

/**
 * @beta
 */
export class Distinct implements Stage {
  name = 'distinct';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalDistinctStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.options.groups)!],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

/**
 * @beta
 */
export class CollectionSource implements Stage {
  name = 'collection';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: CollectionStageOptions) {
    // Convert collection reference to string
    if (!isString(this.options.collection)) {
      this.options.collection = this.options.collection.path;
    }
    // prepend slash to collection string
    if (!this.options.collection.startsWith('/')) {
      this.options.collection = '/' + this.options.collection;
    }
  }

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeReference(this.options.collection)],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalCollectionGroupStageOptions = CollectionGroupStageOptions;

/**
 * @beta
 */
export class CollectionGroupSource implements Stage {
  name = 'collection_group';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalCollectionGroupStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeReference(''),
        serializer.encodeValue(this.options.collectionId)!,
      ],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalDatabaseStageOptions = DatabaseStageOptions;

/**
 * @beta
 */
export class DatabaseSource implements Stage {
  name = 'database';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalDatabaseStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalDocumentsStageOptions = Omit<
  DocumentsStageOptions,
  'docs'
> & {
  docs: Array<DocumentReference>;
};

/**
 * @beta
 */
export class DocumentsSource implements Stage {
  name = 'documents';
  readonly optionsUtil = new OptionsUtil({});
  readonly formattedPaths: string[];

  constructor(private options: InternalDocumentsStageOptions) {
    this.formattedPaths = options.docs.map(ref => '/' + ref.path);
  }

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: this.formattedPaths.map(p => serializer.encodeReference(p)!),
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalWhereStageOptions = Omit<WhereStageOptions, 'condition'> & {
  condition: BooleanExpr;
};

/**
 * @beta
 */
export class Where implements Stage {
  name = 'where';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalWhereStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [this.options.condition._toProto(serializer)],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalFindNearestStageOptions = Omit<
  FindNearestStageOptions,
  'vectorValue' | 'field' | 'distanceField'
> & {
  vectorValue: Expr;
  field: Field;
  distanceField?: Field;
};

/**
 * @beta
 */
export class FindNearest implements Stage {
  name = 'find_nearest';
  readonly optionsUtil = new OptionsUtil({
    limit: {
      serverName: 'limit',
      supportedTypes: {
        number: true,
      },
    },
    distanceField: {
      serverName: 'distance_field',
      supportedTypes: {
        field: true,
      },
    },
  });

  constructor(private _options: InternalFindNearestStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeValue(this._options.field)!,
        serializer.encodeValue(this._options.vectorValue)!,
        serializer.encodeValue(this._options.distanceMeasure)!,
      ],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this._options,
        this._options.customOptions
      ),
    };
  }
}

export type InternalSampleStageOptions = Omit<
  SampleStageOptions,
  'percentage' | 'documents'
> & {
  rate: number;
  mode: 'percent' | 'documents';
};

/**
 * @beta
 */
export class Sample implements Stage {
  name = 'sample';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalSampleStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeValue(this.options.rate)!,
        serializer.encodeValue(this.options.mode)!,
      ],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalUnionStageOptions = UnionStageOptions;

/**
 * @beta
 */
export class Union implements Stage {
  name = 'union';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalUnionStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.options.other)!],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalUnnestStageOptions = Omit<
  UnnestStageOptions,
  'selectable'
> & {
  alias: string;
  expr: Expr;
};

/**
 * @beta
 */
export class Unnest implements Stage {
  name = 'unnest';
  readonly optionsUtil = new OptionsUtil({
    indexField: {
      serverName: 'indexField',
      supportedTypes: {
        string: true,
      },
    },
  });

  constructor(private options: InternalUnnestStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeValue(this.options.expr)!,
        serializer.encodeValue(field(this.options.alias))!,
      ],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalLimitStageOptions = LimitStageOptions;

/**
 * @beta
 */
export class Limit implements Stage {
  name = 'limit';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalLimitStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.options.limit)!],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalOffsetStageOptions = OffsetStageOptions;

/**
 * @beta
 */
export class Offset implements Stage {
  name = 'offset';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalOffsetStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.options.offset)!],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalReplaceWithStageOptions = Omit<
  ReplaceWithStageOptions,
  'map'
> & {
  map: Expr;
};

/**
 * @beta
 */
export class ReplaceWith implements Stage {
  name = 'replace_with';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalReplaceWithStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeValue(this.options.map)!,
        serializer.encodeValue('full_replace'),
      ],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalSelectStageOptions = Omit<
  SelectStageOptions,
  'selections'
> & {
  selections: Map<string, Expr>;
};

/**
 * @beta
 */
export class Select implements Stage {
  name = 'select';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalSelectStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.options.selections)!],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalAddFieldsStageOptions = Omit<
  AddFieldsStageOptions,
  'fields'
> & {
  fields: Map<string, Expr>;
};

/**
 *
 */
export class AddFields implements Stage {
  name = 'add_fields';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalAddFieldsStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.options.fields)!],
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

export type InternalSortStageOptions = Omit<SortStageOptions, 'orderings'> & {
  orderings: Array<Ordering>;
};

/**
 * @beta
 */
export class Sort implements Stage {
  name = 'sort';
  readonly optionsUtil = new OptionsUtil({});

  constructor(private options: InternalSortStageOptions) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: this.options.orderings.map(o => serializer.encodeValue(o)!),
      options: this.optionsUtil.getOptionsProto(
        serializer,
        this.options,
        this.options.customOptions
      ),
    };
  }
}

/**
 * @beta
 */
export class GenericStage implements Stage {
  readonly optionsUtil = new OptionsUtil({});

  /**
   * @private
   * @internal
   */
  constructor(
    public name: string,
    private params: Array<AggregateFunction | Expr>,
    private rawOptions: Record<string, unknown>
  ) {}

  /**
   * @internal
   * @private
   */
  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: this.params.map(o => o._toProto(serializer)),
      options: this.optionsUtil.getOptionsProto(
        serializer,
        {},
        this.rawOptions
      ),
    };
  }
}
