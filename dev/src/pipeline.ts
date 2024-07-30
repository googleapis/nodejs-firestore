import * as firestore from '@google-cloud/firestore';
import * as deepEqual from 'fast-deep-equal';
import {google} from '../protos/firestore_v1_proto_api';
import {
  Accumulator,
  AccumulatorTarget,
  Expr,
  ExprWithAlias,
  Field,
  Fields,
  FilterCondition,
  Ordering,
  Selectable,
} from './expression';
import Firestore, {FieldPath, QueryDocumentSnapshot, Timestamp} from './index';
import {validateFieldPath} from './path';
import {ExecutionUtil} from './pipeline-util';
import {DocumentReference} from './reference/document-reference';
import {Serializer} from './serializer';
import {
  AddField,
  Aggregate,
  Collection,
  CollectionGroup,
  Database,
  Documents,
  Where,
  FindNearest,
  FindNearestOptions,
  GenerateStage,
  Limit,
  Offset,
  Select,
  Sort,
  Stage,
  Distinct,
} from './stage';
import {ApiMapValue, defaultConverter} from './types';
import * as protos from '../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;
import IStructuredPipeline = google.firestore.v1.IStructuredPipeline;
import IStage = google.firestore.v1.Pipeline.IStage;
import {QueryCursor} from './reference/types';
import {isOptionalEqual} from './util';

export class PipelineSource {
  constructor(private db: Firestore) {}

  collection(collectionPath: string): Pipeline {
    return new Pipeline(this.db, [new Collection(collectionPath)]);
  }

  collectionGroup(collectionId: string): Pipeline {
    return new Pipeline(this.db, [new CollectionGroup(collectionId)]);
  }

  database(): Pipeline {
    return new Pipeline(this.db, [new Database()]);
  }

  documents(docs: DocumentReference[]): Pipeline {
    return new Pipeline(this.db, [Documents.of(docs)]);
  }
}

export class Pipeline<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> {
  constructor(
    private db: Firestore,
    private stages: Stage[]
  ) {}

  addFields(...fields: Selectable[]): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new AddField(this.selectablesToMap(fields)));
    return new Pipeline(this.db, copy);
  }

  select(...fields: string[]): Pipeline;
  select(...fields: Selectable[]): Pipeline;
  select(...fields: (Selectable | string)[]): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new Select(this.selectablesToMap(fields)));
    return new Pipeline(this.db, copy);
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
      } else if (selectable instanceof Fields) {
        const fields = selectable as Fields;
        for (const field of fields.fieldList()) {
          result.set(field.fieldName(), field);
        }
      } else if (selectable instanceof ExprWithAlias) {
        const expr = selectable as ExprWithAlias<Expr>;
        result.set(expr.alias, expr.expr);
      }
    }
    return result;
  }

  where(condition: FilterCondition & Expr): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new Where(condition));
    return new Pipeline(this.db, copy);
  }

  offset(offset: number): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new Offset(offset));
    return new Pipeline(this.db, copy);
  }

  limit(limit: number): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new Limit(limit));
    return new Pipeline(this.db, copy);
  }

  distinct(...groups: (string | Selectable)[]): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new Distinct(this.selectablesToMap(groups || [])));
    return new Pipeline(this.db, copy);
  }

  aggregate(...accumulators: AccumulatorTarget[]): Pipeline;
  aggregate(options: {
    accumulators: AccumulatorTarget[];
    groups?: (string | Selectable)[];
  }): Pipeline;
  aggregate(
    optionsOrTarget:
      | AccumulatorTarget
      | {accumulators: AccumulatorTarget[]; groups?: (string | Selectable)[]},
    ...rest: AccumulatorTarget[]
  ): Pipeline {
    const copy = this.stages.map(s => s);
    if ('accumulators' in optionsOrTarget) {
      copy.push(
        new Aggregate(
          new Map<string, Accumulator>(
            optionsOrTarget.accumulators.map((target: AccumulatorTarget) => [
              target.alias,
              target.expr,
            ])
          ),
          this.selectablesToMap(optionsOrTarget.groups || [])
        )
      );
    } else {
      copy.push(
        new Aggregate(
          new Map<string, Accumulator>(
            [optionsOrTarget, ...rest].map(target => [
              target.alias,
              target.expr,
            ])
          ),
          new Map<string, Expr>()
        )
      );
    }
    return new Pipeline(this.db, copy);
  }

  findNearest(
    field: string,
    vector: number[],
    options: FindNearestOptions
  ): Pipeline;
  findNearest(
    field: Field,
    vector: FirebaseFirestore.VectorValue,
    options: FindNearestOptions
  ): Pipeline;
  findNearest(
    field: string | Field,
    vector: FirebaseFirestore.VectorValue | number[],
    options: FindNearestOptions
  ): Pipeline;
  findNearest(
    field: string | Field,
    vector: number[] | FirebaseFirestore.VectorValue,
    options: FindNearestOptions
  ): Pipeline {
    const copy = this.stages.map(s => s);
    const fieldExpr = typeof field === 'string' ? Field.of(field) : field;
    copy.push(new FindNearest(fieldExpr, vector, options));
    return new Pipeline(this.db, copy);
  }

  sort(...orderings: Ordering[]): Pipeline;
  sort(options: {
    orderings: Ordering[];
    density?: 'unspecified' | 'required';
    truncation?: 'unspecified' | 'disabled';
  }): Pipeline;
  sort(
    optionsOrOrderings:
      | Ordering
      | {
          orderings: Ordering[];
          density?: 'unspecified' | 'required';
          truncation?: 'unspecified' | 'disabled';
        },
    ...rest: Ordering[]
  ): Pipeline {
    const copy = this.stages.map(s => s);
    // Option object
    if ('orderings' in optionsOrOrderings) {
      copy.push(
        new Sort(
          optionsOrOrderings.orderings,
          optionsOrOrderings.density ?? 'unspecified',
          optionsOrOrderings.truncation ?? 'unspecified'
        )
      );
    } else {
      // Ordering object
      copy.push(
        new Sort([optionsOrOrderings, ...rest], 'unspecified', 'unspecified')
      );
    }

    return new Pipeline(this.db, copy);
  }

  paginate(pageSize: number, orderings?: Ordering[]): PaginatingPipeline {
    const copy = this.stages.map(s => s);
    return new PaginatingPipeline(
      new Pipeline(this.db, copy),
      pageSize,
      orderings
    );
  }

  genericStage(name: string, params: any[]): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(new GenerateStage(name, params));
    return new Pipeline(this.db, copy);
  }

  execute(): Promise<Array<PipelineResult<AppModelType, DbModelType>>> {
    const util = new ExecutionUtil<AppModelType, DbModelType>(
      this.db,
      this.db._serializer!
    );
    return util._getResponse(this).then(result => result!);
  }

  stream(): NodeJS.ReadableStream {
    const util = new ExecutionUtil<AppModelType, DbModelType>(
      this.db,
      this.db._serializer!
    );
    return util.stream(this);
  }

  _toProto(
    transactionOrReadTime?: Uint8Array | Timestamp | api.ITransactionOptions,
    explainOptions?: FirebaseFirestore.ExplainOptions
  ): api.IExecutePipelineRequest {
    const stages: IStage[] = this.stages.map(stage =>
      stage._toProto(this.db._serializer!)
    );
    const structuredPipeline: IStructuredPipeline = {pipeline: {stages}};
    return {
      database: this.db.formattedName,
      structuredPipeline,
    };
  }
}

class PaginatingPipeline {
  constructor(
    private pipeline: Pipeline,
    private pageSize: number,
    private orderings?: Ordering[]
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

  /**
   * @internal
   * @private
   */
  withEndCursor(arg0: QueryCursor): PaginatingPipeline {
    throw new Error('Method not implemented.');
  }
  /**
   * @internal
   * @private
   */
  withStartCursor(arg0: QueryCursor): PaginatingPipeline {
    throw new Error('Method not implemented.');
  }
}

export class PipelineResult<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> {
  private readonly _ref:
    | DocumentReference<AppModelType, DbModelType>
    | undefined;
  private _serializer: Serializer;
  public readonly _readTime: Timestamp | undefined;
  public readonly _createTime: Timestamp | undefined;
  public readonly _updateTime: Timestamp | undefined;

  /**
   * @private
   * @internal
   *
   * @param serializer The serializer used to encode/decode protobuf.
   * @param ref The reference to the document.
   * @param _fieldsProto The fields of the Firestore `Document` Protobuf backing
   * this document (or undefined if the document does not exist).
   * @param readTime The time when this snapshot was read  (or undefined if
   * the document exists only locally).
   * @param createTime The time when the document was created (or undefined if
   * the document does not exist).
   * @param updateTime The time when the document was last updated (or undefined
   * if the document does not exist).
   */
  constructor(
    serializer: Serializer,
    ref?: DocumentReference<AppModelType, DbModelType>,
    /**
     * @internal
     * @private
     **/
    readonly _fieldsProto?: ApiMapValue,
    readTime?: Timestamp,
    createTime?: Timestamp,
    updateTime?: Timestamp
  ) {
    this._ref = ref;
    this._serializer = serializer;
    this._readTime = readTime;
    this._createTime = createTime;
    this._updateTime = updateTime;
  }

  get ref(): DocumentReference<AppModelType, DbModelType> | undefined {
    return this._ref;
  }

  /**
   * The ID of the document for which this DocumentSnapshot contains data.
   *
   * @type {string}
   * @name DocumentSnapshot#id
   * @readonly
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then((documentSnapshot) => {
   *   if (documentSnapshot.exists) {
   *     console.log(`Document found with name '${documentSnapshot.id}'`);
   *   }
   * });
   * ```
   */
  get id(): string | undefined {
    return this._ref?.id;
  }

  /**
   * The time the document was created. Undefined for documents that don't
   * exist.
   *
   * @type {Timestamp|undefined}
   * @name DocumentSnapshot#createTime
   * @readonly
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   if (documentSnapshot.exists) {
   *     let createTime = documentSnapshot.createTime;
   *     console.log(`Document created at '${createTime.toDate()}'`);
   *   }
   * });
   * ```
   */
  get createTime(): Timestamp | undefined {
    return this._createTime;
  }

  /**
   * The time the document was last updated (at the time the snapshot was
   * generated). Undefined for documents that don't exist.
   *
   * @type {Timestamp|undefined}
   * @name DocumentSnapshot#updateTime
   * @readonly
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   if (documentSnapshot.exists) {
   *     let updateTime = documentSnapshot.updateTime;
   *     console.log(`Document updated at '${updateTime.toDate()}'`);
   *   }
   * });
   * ```
   */
  get updateTime(): Timestamp | undefined {
    return this._updateTime;
  }

  /**
   * The time this snapshot was read.
   *
   * @type {Timestamp}
   * @name DocumentSnapshot#readTime
   * @readonly
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   let readTime = documentSnapshot.readTime;
   *   console.log(`Document read at '${readTime.toDate()}'`);
   * });
   * ```
   */
  get readTime(): Timestamp {
    if (this._readTime === undefined) {
      throw new Error("Called 'readTime' on a local document");
    }
    return this._readTime;
  }

  /**
   * Retrieves all fields in the document as an object. Returns 'undefined' if
   * the document doesn't exist.
   *
   * @returns {T|undefined} An object containing all fields in the document or
   * 'undefined' if the document doesn't exist.
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   let data = documentSnapshot.data();
   *   console.log(`Retrieved data: ${JSON.stringify(data)}`);
   * });
   * ```
   */
  data(): AppModelType | undefined {
    const fields = this._fieldsProto;

    if (fields === undefined) {
      return undefined;
    }

    // We only want to use the converter and create a new QueryDocumentSnapshot
    // if a converter has been provided.
    if (!!this.ref && this.ref._converter !== defaultConverter()) {
      const untypedReference = new DocumentReference(
        this.ref.firestore,
        this.ref._path
      );
      return this.ref._converter.fromFirestore(
        new QueryDocumentSnapshot(
          untypedReference,
          this._fieldsProto!,
          this.readTime,
          this.createTime!,
          this.updateTime!
        )
      );
    } else {
      const obj: firestore.DocumentData = {};
      for (const prop of Object.keys(fields)) {
        obj[prop] = this._serializer.decodeValue(fields[prop]);
      }
      return obj as AppModelType;
    }
  }

  /**
   * Retrieves the field specified by `field`.
   *
   * @param {string|FieldPath} field The field path
   * (e.g. 'foo' or 'foo.bar') to a specific field.
   * @returns {*} The data at the specified field location or undefined if no
   * such field exists.
   *
   * @example
   * ```
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({ a: { b: 'c' }}).then(() => {
   *   return documentRef.get();
   * }).then(documentSnapshot => {
   *   let field = documentSnapshot.get('a.b');
   *   console.log(`Retrieved field value: ${field}`);
   * });
   * ```
   */
  // We deliberately use `any` in the external API to not impose type-checking
  // on end users.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(field: string | FieldPath): any {
    validateFieldPath('field', field);

    const protoField = this.protoField(field);

    if (protoField === undefined) {
      return undefined;
    }

    return this._serializer.decodeValue(protoField);
  }

  /**
   * Retrieves the field specified by 'fieldPath' in its Protobuf JS
   * representation.
   *
   * @private
   * @internal
   * @param field The path (e.g. 'foo' or 'foo.bar') to a specific field.
   * @returns The Protobuf-encoded data at the specified field location or
   * undefined if no such field exists.
   */
  protoField(field: string | FieldPath): api.IValue | undefined {
    let fields: ApiMapValue | api.IValue | undefined = this._fieldsProto;

    if (fields === undefined) {
      return undefined;
    }

    const components = FieldPath.fromArgument(field).toArray();
    while (components.length > 1) {
      fields = (fields as ApiMapValue)[components.shift()!];

      if (!fields || !fields.mapValue) {
        return undefined;
      }

      fields = fields.mapValue.fields!;
    }

    return (fields as ApiMapValue)[components[0]];
  }

  /**
   * Returns true if the document's data and path in this `DocumentSnapshot` is
   * equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `DocumentSnapshot` is equal to the provided
   * value.
   */
  isEqual(other: PipelineResult<AppModelType, DbModelType>): boolean {
    return (
      this === other ||
      (isOptionalEqual(this._ref, other._ref) &&
        deepEqual(this._fieldsProto, other._fieldsProto))
    );
  }
}
