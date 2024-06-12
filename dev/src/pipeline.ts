import {
  Accumulator,
  AggregateTarget,
  Expr,
  Field,
  Fields,
  FilterCondition,
  Ordering,
  Selectable,
} from './expression';
import {VectorValue} from './field-value';
import {DocumentReference} from './reference/document-reference';
import {
  AddField,
  Aggregate,
  Collection,
  CollectionGroup,
  Database,
  Documents,
  Filter,
  FindNearest,
  FindNearestOptions,
  GenerateStage,
  Limit,
  Offset,
  Select,
  Sort,
  Stage,
} from './stage';

export class Pipeline {
  private constructor(private stages: Stage[]) {}

  static fromCollection(collectionPath: string): Pipeline {
    return new Pipeline([new Collection(collectionPath)]);
  }

  static fromCollectionGroup(collectionId: string): Pipeline {
    return new Pipeline([new CollectionGroup(collectionId)]);
  }

  static fromDatabase(): Pipeline {
    return new Pipeline([new Database()]);
  }

  static fromDocuments(docs: DocumentReference[]): Pipeline {
    return new Pipeline([Documents.of(docs)]);
  }

  addFields(...fields: Selectable[]): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new AddField(this.selectablesToMap(fields)));
    return new Pipeline(copy);
  }

  select(...fields: string[]): Pipeline;
  select(...fields: Selectable[]): Pipeline;
  select(...fields: (Selectable | string)[]): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new Select(this.selectablesToMap(fields)));
    return new Pipeline(copy);
  }

  private selectablesToMap(
    selectables: (Selectable | string)[]
  ): Map<string, Expr> {
    const result = new Map<string, Expr>();
    for (const selectable of selectables) {
      if (typeof selectable === 'string') {
        result.set(selectable as string, Field.of(selectable));
      } else if (selectable instanceof Field) {
        result.set((selectable as Field).fieldName(), selectable);
      } else if (selectable instanceof AggregateTarget) {
        const target = selectable as AggregateTarget;
        result.set(target.field.fieldName(), target.accumulator);
      } else if (selectable instanceof Fields) {
        const fields = selectable as Fields;
        for (const field of fields.fieldList()) {
          result.set(field.fieldName(), field);
        }
      }
    }
    return result;
  }

  filter(condition: FilterCondition): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new Filter(condition));
    return new Pipeline(copy);
  }

  offset(offset: number): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new Offset(offset));
    return new Pipeline(copy);
  }

  limit(limit: number): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new Limit(limit));
    return new Pipeline(copy);
  }

  aggregate(...targets: AggregateTarget[]): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(
      new Aggregate(
        new Map<string, Expr>(),
        new Map<string, Accumulator>(
          targets.map(target => [target.field.fieldName(), target.accumulator])
        )
      )
    );
    return new Pipeline(copy);
  }

  findNearest(
    field: string,
    vector: number[],
    options: FindNearestOptions
  ): Pipeline;
  findNearest(
    field: Field,
    vector: VectorValue,
    options: FindNearestOptions
  ): Pipeline;
  findNearest(
    field: string | Field,
    vector: number[] | VectorValue,
    options: FindNearestOptions
  ): Pipeline {
    const copy = this.stages.map(s => s);
    const fieldExpr = typeof field === 'string' ? Field.of(field) : field;
    copy.push(new FindNearest(fieldExpr, vector, options));
    return new Pipeline(copy);
  }

  sort(orderings: Ordering[]): Pipeline;
  sort(
    orderings: Ordering[],
    density?: 'unspecified' | 'required',
    truncation?: 'unspecified' | 'disabled'
  ): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(
      new Sort(orderings, density ?? 'unspecified', truncation ?? 'unspecified')
    );
    return new Pipeline(copy);
  }

  paginate(pageSize: number, orderings: Ordering[]): PaginatingPipeline {
    const copy = this.stages.map(s => s);
    return new PaginatingPipeline(new Pipeline(copy), pageSize, orderings);
  }

  genericStage(name: string, params: any[]): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new GenerateStage(name, params));
    return new Pipeline(copy);
  }
}

class PaginatingPipeline {
  constructor(
    private pipeline: Pipeline,
    private pageSize: number,
    private orderings: Ordering[]
  ) {}

  firstPage(): Pipeline {
    return this.pipeline;
  }

  lastPage(): Pipeline {
    return this.pipeline;
  }

  offset(): PaginatingPipeline {
    return this;
  }

  limit(): PaginatingPipeline {
    return this;
  }

  startAt(result: PipelineResult): PaginatingPipeline {
    return this;
  }

  startAfter(result: PipelineResult): PaginatingPipeline {
    return this;
  }

  endAt(result: PipelineResult): PaginatingPipeline {
    return this;
  }

  endBefore(result: PipelineResult): PaginatingPipeline {
    return this;
  }
}

export class PipelineResult {}
