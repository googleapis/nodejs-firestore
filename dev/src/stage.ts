import {google} from '../protos/firestore_v1_proto_api';
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

export interface Stage {
  name: string;
  _toProto(): api.Pipeline.Stage;
}

export class AddField implements Stage {
  name = 'add_field';

  constructor(private fields: Map<string, Expr>) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class Aggregate implements Stage {
  name = 'aggregate';

  constructor(
    private groups: Map<string, Expr>,
    private accumulators: Map<string, Accumulator>
  ) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class Collection implements Stage {
  name = 'collection';

  constructor(private collectionPath: string) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class CollectionGroup implements Stage {
  name = 'collection_group';

  constructor(private collectionId: string) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class Database implements Stage {
  name = 'database';

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class Documents implements Stage {
  name = 'documents';

  constructor(private docPaths: string[]) {}

  static of(refs: DocumentReference[]): Documents {
    return new Documents(refs.map(ref => '/' + ref.path));
  }

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class Filter implements Stage {
  name = 'filter';

  constructor(private condition: FilterCondition) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export interface FindNearestOptions {
  limit: number;
  distanceMeasure: 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT';
  output: string;
}

export class FindNearest implements Stage {
  name = 'find_nearest';

  constructor(
    property: Field,
    vector: VectorValue | number[],
    options: FindNearestOptions
  ) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class Limit implements Stage {
  name = 'limit';

  constructor(private limit: number) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class Offset implements Stage {
  name = 'offset';

  constructor(private offset: number) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class Select implements Stage {
  name = 'select';

  constructor(private projections: Map<string, Expr>) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class Sort implements Stage {
  name = 'filter';

  constructor(
    private orders: Ordering[],
    private density: 'unspecified' | 'required',
    private truncation: 'unspecified' | 'disabled'
  ) {}

  _toProto(): api.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}

export class GenerateStage implements Stage {
  constructor(
    public name: string,
    params: any[]
  ) {}

  _toProto(): google.firestore.v1.Pipeline.Stage {
    return new api.Pipeline.Stage();
  }
}
