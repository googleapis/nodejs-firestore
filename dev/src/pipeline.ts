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
  Function,
  Ordering,
  Selectable,
} from './expression';
import Firestore, {FieldPath, QueryDocumentSnapshot, Timestamp} from './index';
import {validateFieldPath} from './path';
import {ExecutionUtil} from './pipeline-util';
import {DocumentReference} from './reference/document-reference';
import {Serializer} from './serializer';
import {
  AddFields, Aggregate,
  CollectionSource, Distinct,
  Select,
  Stage,
} from './stage';
import {ApiMapValue, defaultConverter, defaultPipelineConverter} from './types';
import * as protos from '../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;
import IStructuredPipeline = google.firestore.v1.IStructuredPipeline;
import IStage = google.firestore.v1.Pipeline.IStage;
import {QueryCursor} from './reference/types';
import {isOptionalEqual} from './util';

/**
 * Represents the source of a Firestore {@link Pipeline}.
 * @beta
 */
export class PipelineSource implements firestore.PipelineSource{
  constructor(private db: Firestore) {}

  collection(collectionPath: string): Pipeline {
    return new Pipeline(this.db, [new CollectionSource(collectionPath)]);
  }
}

/**
 * @beta
 *
 * The Pipeline class provides a flexible and expressive framework for building complex data
 * transformation and query pipelines for Firestore.
 *
 * A pipeline takes data sources, such as Firestore collections or collection groups, and applies
 * a series of stages that are chained together. Each stage takes the output from the previous stage
 * (or the data source) and produces an output for the next stage (or as the final output of the
 * pipeline).
 *
 * Expressions can be used within each stage to filter and transform data through the stage.
 *
 * NOTE: The chained stages do not prescribe exactly how Firestore will execute the pipeline.
 * Instead, Firestore only guarantees that the result is the same as if the chained stages were
 * executed in order.
 *
 * Usage Examples:
 *
 * ```typescript
 * const db: Firestore; // Assumes a valid firestore instance.
 *
 * // Example 1: Select specific fields and rename 'rating' to 'bookRating'
 * const results1 = await db.pipeline()
 *     .collection("books")
 *     .select("title", "author", Field.of("rating").as("bookRating"))
 *     .execute();
 *
 * // Example 2: Filter documents where 'genre' is "Science Fiction" and 'published' is after 1950
 * const results2 = await db.pipeline()
 *     .collection("books")
 *     .where(and(Field.of("genre").eq("Science Fiction"), Field.of("published").gt(1950)))
 *     .execute();
 *
 * // Example 3: Calculate the average rating of books published after 1980
 * const results3 = await db.pipeline()
 *     .collection("books")
 *     .where(Field.of("published").gt(1980))
 *     .aggregate(avg(Field.of("rating")).as("averageRating"))
 *     .execute();
 * ```
 */
export class Pipeline<AppModelType = firestore.DocumentData> implements firestore.Pipeline<AppModelType>{
  constructor(
    private db: Firestore,
    private stages: Stage[],
    private converter: firestore.FirestorePipelineConverter<AppModelType> = defaultPipelineConverter()
  ) {}

  addFields(...fields: firestore.Selectable[]): Pipeline<AppModelType> {
    const copy = this.stages.map(s => s);
    copy.push(new AddFields(this.selectablesToMap(fields)));
    return new Pipeline(this.db, copy, this.converter);
  }

  select(...fields: (firestore.Selectable | string)[]): Pipeline<AppModelType> {
    const copy = this.stages.map(s => s);
    copy.push(new Select(this.selectablesToMap(fields)));
    return new Pipeline(this.db, copy, this.converter);
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

  distinct(...groups: (string | firestore.Selectable)[]): Pipeline<AppModelType> {
    const copy = this.stages.map(s => s);
    copy.push(new Distinct(this.selectablesToMap(groups || [])));
    return new Pipeline(this.db, copy, this.converter);
  }

  aggregate(...accumulators: firestore.AccumulatorTarget[]): Pipeline<AppModelType>;
  aggregate(options: {
    accumulators: firestore.AccumulatorTarget[];
    groups?: (string | Selectable)[];
  }): Pipeline<AppModelType>;
  aggregate(
      optionsOrTarget:
          | firestore.AccumulatorTarget
          | {accumulators: firestore.AccumulatorTarget[]; groups?: (string | firestore.Selectable)[]},
      ...rest: firestore.AccumulatorTarget[]
  ): Pipeline<AppModelType> {
    const copy = this.stages.map(s => s);
    if ('accumulators' in optionsOrTarget) {
      copy.push(
          new Aggregate(
              new Map<string, Accumulator>(
                  optionsOrTarget.accumulators.map((target: firestore.AccumulatorTarget) => [
                    (target as unknown as AccumulatorTarget).alias,
                    (target as unknown as AccumulatorTarget).expr,
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
                    (target as unknown as AccumulatorTarget).alias,
                    (target as unknown as AccumulatorTarget).expr,
                  ])
              ),
              new Map<string, Expr>()
          )
      );
    }
    return new Pipeline(this.db, copy, this.converter);
  }

  withConverter(converter: null): Pipeline;
  withConverter<NewAppModelType>(
    converter: firestore.FirestorePipelineConverter<NewAppModelType>
  ): Pipeline<NewAppModelType>;
  /**
   * Applies a custom data converter to this Query, allowing you to use your
   * own custom model objects with Firestore. When you call get() on the
   * returned Query, the provided converter will convert between Firestore
   * data of type `NewDbModelType` and your custom type `NewAppModelType`.
   *
   * Using the converter allows you to specify generic type arguments when
   * storing and retrieving objects from Firestore.
   *
   * Passing in `null` as the converter parameter removes the current
   * converter.
   *
   * @example
   * ```
   * class Post {
   *   constructor(readonly title: string, readonly author: string) {}
   *
   *   toString(): string {
   *     return this.title + ', by ' + this.author;
   *   }
   * }
   *
   * const postConverter = {
   *   toFirestore(post: Post): FirebaseFirestore.DocumentData {
   *     return {title: post.title, author: post.author};
   *   },
   *   fromFirestore(
   *     snapshot: FirebaseFirestore.QueryDocumentSnapshot
   *   ): Post {
   *     const data = snapshot.data();
   *     return new Post(data.title, data.author);
   *   }
   * };
   *
   * const postSnap = await Firestore()
   *   .collection('posts')
   *   .withConverter(postConverter)
   *   .doc().get();
   * const post = postSnap.data();
   * if (post !== undefined) {
   *   post.title; // string
   *   post.toString(); // Should be defined
   *   post.someNonExistentProperty; // TS error
   * }
   *
   * ```
   * @param {FirestoreDataConverter | null} converter Converts objects to and
   * from Firestore. Passing in `null` removes the current converter.
   * @return A Query that uses the provided converter.
   */
  withConverter<NewAppModelType>(
    converter: firestore.FirestorePipelineConverter<NewAppModelType> | null
  ): Pipeline<NewAppModelType> {
    const copy = this.stages.map(s => s);
    return new Pipeline<NewAppModelType>(
      this.db,
      copy,
      converter ?? defaultPipelineConverter()
    );
  }

  /**
   * Executes this pipeline and returns a Promise to represent the asynchronous operation.
   *
   * <p>The returned Promise can be used to track the progress of the pipeline execution
   * and retrieve the results (or handle any errors) asynchronously.
   *
   * <p>The pipeline results are returned as a list of {@link PipelineResult} objects. Each {@link
   * PipelineResult} typically represents a single key/value map that has passed through all the
   * stages of the pipeline, however this might differ depending on the stages involved in the
   * pipeline. For example:
   *
   * <ul>
   *   <li>If there are no stages or only transformation stages, each {@link PipelineResult}
   *       represents a single document.</li>
   *   <li>If there is an aggregation, only a single {@link PipelineResult} is returned,
   *       representing the aggregated results over the entire dataset .</li>
   *   <li>If there is an aggregation stage with grouping, each {@link PipelineResult} represents a
   *       distinct group and its associated aggregated values.</li>
   * </ul>
   *
   * <p>Example:
   *
   * ```typescript
   * const futureResults = await firestore.pipeline().collection("books")
   *     .where(gt(Field.of("rating"), 4.5))
   *     .select("title", "author", "rating")
   *     .execute();
   * ```
   *
   * @return A Promise representing the asynchronous pipeline execution.
   */
  execute(): Promise<Array<PipelineResult<AppModelType>>> {
    const util = new ExecutionUtil<AppModelType>(
      this.db,
      this.db._serializer!,
      this.converter
    );
    return util._getResponse(this).then(result => result!);
  }

  /**
   * Executes this pipeline and streams the results as {@link PipelineResult}s.
   *
   * @returns {Stream.<PipelineResult>} A stream of
   * PipelineResult.
   *
   * @example
   * ```typescript
   * firestore.pipeline().collection("books")
   *     .where(gt(Field.of("rating"), 4.5))
   *     .select("title", "author", "rating")
   *     .stream()
   *     .on('data', (pipelineResult) => {})
   *     .on('end', () => {});
   * ```
   */
  stream(): NodeJS.ReadableStream {
    const util = new ExecutionUtil<AppModelType>(
      this.db,
      this.db._serializer!,
      this.converter
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

/**
 * @beta
 *
 * A PipelineResult contains data read from a Firestore Pipeline. The data can be extracted with the
 * {@link #data()} or {@link #get(String)} methods.
 *
 * <p>If the PipelineResult represents a non-document result, `ref` will return a undefined
 * value.
 */
export class PipelineResult<AppModelType = firestore.DocumentData>
  implements firestore.PipelineResult<AppModelType>
{
  private readonly _ref: DocumentReference | undefined;
  private _serializer: Serializer;
  public readonly _executionTime: Timestamp | undefined;
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
   * @param readTime The time when this result was read  (or undefined if
   * the document exists only locally).
   * @param createTime The time when the document was created if the result is a document, undefined otherwise.
   * @param updateTime The time when the document was last updated if the result is a document, undefined otherwise.
   */
  constructor(
    serializer: Serializer,
    ref?: DocumentReference,
    /**
     * @internal
     * @private
     **/
    readonly _fieldsProto?: ApiMapValue,
    readTime?: Timestamp,
    createTime?: Timestamp,
    updateTime?: Timestamp,
    readonly converter: firestore.FirestorePipelineConverter<AppModelType> = defaultPipelineConverter()
  ) {
    this._ref = ref;
    this._serializer = serializer;
    this._executionTime = readTime;
    this._createTime = createTime;
    this._updateTime = updateTime;
  }

  /**
   * The reference of the document, if it is a document; otherwise `undefined`.
   */
  get ref(): DocumentReference | undefined {
    return this._ref;
  }

  /**
   * The ID of the document for which this PipelineResult contains data, if it is a document; otherwise `undefined`.
   *
   * @type {string}
   * @readonly
   *
   */
  get id(): string | undefined {
    return this._ref?.id;
  }

  /**
   * The time the document was created. Undefined if this result is not a document.
   *
   * @type {Timestamp|undefined}
   * @readonly
   */
  get createTime(): Timestamp | undefined {
    return this._createTime;
  }

  /**
   * The time the document was last updated (at the time the snapshot was
   * generated). Undefined if this result is not a document.
   *
   * @type {Timestamp|undefined}
   * @readonly
   */
  get updateTime(): Timestamp | undefined {
    return this._updateTime;
  }

  /**
   * The time at which the pipeline producing this result is executed.
   *
   * @type {Timestamp}
   * @readonly
   *
   */
  get executionTime(): Timestamp {
    if (this._executionTime === undefined) {
      throw new Error(
        "'executionTime' is expected to exist, but it is undefined"
      );
    }
    return this._executionTime;
  }

  /**
   * Retrieves all fields in the result as an object. Returns 'undefined' if
   * the document doesn't exist.
   *
   * @returns {T|undefined} An object containing all fields in the document or
   * 'undefined' if the document doesn't exist.
   *
   * @example
   * ```
   * let p = firestore.pipeline().collection('col');
   *
   * p.execute().then(results => {
   *   let data = results[0].data();
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
    if (!!this.converter && this.converter !== defaultPipelineConverter()) {
      return this.converter.fromFirestore(
        new PipelineResult<firestore.DocumentData>(
          this._serializer,
          this.ref,
          this._fieldsProto,
          this._executionTime,
          this.createTime,
          this.updateTime,
          defaultPipelineConverter()
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
   * let p = firestore.pipeline().collection('col');
   *
   * p.execute().then(results => {
   *   let field = results[0].get('a.b');
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
   * Returns true if the document's data and path in this `PipelineResult` is
   * equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `PipelineResult` is equal to the provided
   * value.
   */
  isEqual(other: PipelineResult<AppModelType>): boolean {
    return (
      this === other ||
      (isOptionalEqual(this._ref, other._ref) &&
        deepEqual(this._fieldsProto, other._fieldsProto))
    );
  }
}
