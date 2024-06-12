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

export interface Stage {
  name: string;
  _toProto(serializer: Serializer): api.Pipeline.IStage;
}

export class AddField implements Stage {
  name = 'add_field';

  constructor(private fields: Map<string, Expr>) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [serializer.encodeValue(this.fields)!],
    };
  }
}

export class Aggregate implements Stage {
  name = 'aggregate';

  constructor(
    private groups: Map<string, Expr>,
    private accumulators: Map<string, Accumulator>
  ) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [
        serializer.encodeValue(this.groups)!,
        serializer.encodeValue(this.accumulators)!,
      ],
    };
  }
}

export class Collection implements Stage {
  name = 'collection';

  constructor(private collectionPath: string) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [{referenceValue: this.collectionPath}],
    };
  }
}

export class CollectionGroup implements Stage {
  name = 'collection_group';

  constructor(private collectionId: string) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [{referenceValue: ''}, serializer.encodeValue(this.collectionId)!],
    };
  }
}

export class Database implements Stage {
  name = 'database';

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
    };
  }
}

export class Documents implements Stage {
  name = 'documents';

  constructor(private docPaths: string[]) {}

  static of(refs: DocumentReference[]): Documents {
    return new Documents(refs.map(ref => '/' + ref.path));
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

export class Filter implements Stage {
  name = 'filter';

  constructor(private condition: FilterCondition & Expr) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: [this.condition._toProto(serializer)],
    };
  }
}

export interface FindNearestOptions {
  limit: number;
  distanceMeasure: 'euclidean' | 'cosine' | 'dot_product';
  distanceField?: string;
}

export class FindNearest implements Stage {
  name = 'find_nearest';

  constructor(
    private property: Field,
    private vector: FirebaseFirestore.VectorValue | number[],
    private options: FindNearestOptions
  ) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    const options: {[k: string]: api.IValue} = {
      limit: serializer.encodeValue(this.options.limit)!,
    };
    if (this.options.distanceField) {
      options.distance_field = Field.of(this.options.distanceField)._toProto(
        serializer
      );
    }

    return {
      name: this.name,
      args: [
        this.property._toProto(serializer),
        this.vector instanceof FirebaseFirestore.VectorValue
          ? serializer.encodeValue(this.vector)!
          : serializer.encodeVector(this.vector),
        serializer.encodeValue(this.options.distanceMeasure)!,
      ],
      options,
    };
  }
}

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

export class Sort implements Stage {
  name = 'filter';

  constructor(
    private orders: Ordering[],
    private density: 'unspecified' | 'required',
    private truncation: 'unspecified' | 'disabled'
  ) {}

  _toProto(serializer: Serializer): api.Pipeline.IStage {
    return {
      name: this.name,
      args: this.orders.map(o => o._toProto(serializer)),
      options: {
        density: serializer.encodeValue(this.density)!,
        truncation: serializer.encodeValue(this.truncation)!,
      },
    };
  }
}

export class GenerateStage implements Stage {
  constructor(
    public name: string,
    params: any[]
  ) {}

  _toProto(serializer: Serializer): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}
