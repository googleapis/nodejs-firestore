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
  FilterCondition,
  Function,
  Ordering,
  Selectable,
} from './expression';
import Firestore, {FieldPath, QueryDocumentSnapshot, Timestamp} from './index';
import {validateFieldPath} from './path';
import {ExecutionUtil, selectableToExpr} from './pipeline-util';
import {DocumentReference} from './reference/document-reference';
import {PipelineResponse} from './reference/types';
import {Serializer} from './serializer';
import {
  AddFields,
  Aggregate,
  CollectionSource,
  CollectionGroupSource,
  DatabaseSource,
  DocumentsSource,
  Where,
  FindNearest,
  FindNearestOptions,
  GenericStage,
  Limit,
  Offset,
  Select,
  Sort,
  Stage,
  Distinct,
  RemoveFields,
  Replace,
  Sample,
  SampleOptions,
  Union,
  Unnest,
  UnnestOptions,
} from './stage';
import {ApiMapValue, defaultPipelineConverter} from './types';
import * as protos from '../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;
import IStructuredPipeline = google.firestore.v1.IStructuredPipeline;
import IStage = google.firestore.v1.Pipeline.IStage;
import {isOptionalEqual} from './util';

/**
 * Represents the source of a Firestore {@link Pipeline}.
 * @beta
 */
export class PipelineSource implements firestore.PipelineSource {
  constructor(private db: Firestore) {}

  collection(collectionPath: string): Pipeline {
    return new Pipeline(this.db, [new CollectionSource(collectionPath)]);
  }

  collectionGroup(collectionId: string): Pipeline {
    return new Pipeline(this.db, [new CollectionGroupSource(collectionId)]);
  }

  database(): Pipeline {
    return new Pipeline(this.db, [new DatabaseSource()]);
  }

  documents(docs: DocumentReference[]): Pipeline {
    return new Pipeline(this.db, [DocumentsSource.of(docs)]);
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
 *     .collection('books')
 *     .select('title', 'author', Field.of('rating').as('bookRating'))
 *     .execute();
 *
 * // Example 2: Filter documents where 'genre' is 'Science Fiction' and 'published' is after 1950
 * const results2 = await db.pipeline()
 *     .collection('books')
 *     .where(and(Field.of('genre').eq('Science Fiction'), Field.of('published').gt(1950)))
 *     .execute();
 *
 * // Example 3: Calculate the average rating of books published after 1980
 * const results3 = await db.pipeline()
 *     .collection('books')
 *     .where(Field.of('published').gt(1980))
 *     .aggregate(avg(Field.of('rating')).as('averageRating'))
 *     .execute();
 * ```
 */
export class Pipeline<AppModelType = firestore.DocumentData>
  implements firestore.Pipeline<AppModelType>
{
  constructor(
    private db: Firestore,
    private stages: Stage[],
    private converter: firestore.FirestorePipelineConverter<AppModelType> = defaultPipelineConverter()
  ) {}

  private _addStage(stage: Stage): Pipeline<AppModelType> {
    const copy = this.stages.map(s => s);
    copy.push(stage);
    return new Pipeline(this.db, copy, this.converter);
  }

  /**
   * Adds new fields to outputs from previous stages.
   *
   * This stage allows you to compute values on-the-fly based on existing data from previous
   * stages or constants. You can use this to create new fields or overwrite existing ones (if there
   * is name overlaps).
   *
   * The added fields are defined using {@link Selectable}s, which can be:
   *
   * - {@link Field}: References an existing document field.
   * - {@link Function}: Performs a calculation using functions like `add`, `multiply` with
   *   assigned aliases using {@link Expr#as}.
   *
   * Example:
   *
   * ```typescript
   * firestore.pipeline().collection('books')
   *   .addFields(
   *     Field.of('rating').as('bookRating'), // Rename 'rating' to 'bookRating'
   *     add(5, Field.of('quantity')).as('totalCost')  // Calculate 'totalCost'
   *   );
   * ```
   *
   * @param fields The fields to add to the documents, specified as {@link Selectable}s.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  addFields(...fields: firestore.Selectable[]): Pipeline<AppModelType> {
    return this._addStage(new AddFields(this.selectablesToMap(fields)));
  }

  /**
   * Remove fields from outputs of previous stages.
   *
   * Example:
   *
   * ```typescript
   * firestore.pipeline().collection('books')
   *   // removes field 'rating' and 'cost' from the previous stage outputs.
   *   .removeFields(
   *     Field.of('rating'),
   *     'cost'
   *   );
   * ```
   *
   * @param fields The fields to remove.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  removeFields(
    ...fields: (firestore.Field | string)[]
  ): Pipeline<AppModelType> {
    return this._addStage(
      new RemoveFields(
        fields.map(f => (typeof f === 'string' ? Field.of(f) : (f as Field)))
      )
    );
  }

  /**
   * Selects or creates a set of fields from the outputs of previous stages.
   *
   * <p>The selected fields are defined using {@link Selectable} expressions, which can be:
   *
   * <ul>
   *   <li>{@code string}: Name of an existing field</li>
   *   <li>{@link Field}: References an existing field.</li>
   *   <li>{@link Function}: Represents the result of a function with an assigned alias name using
   *       {@link Expr#as}</li>
   * </ul>
   *
   * <p>If no selections are provided, the output of this stage is empty. Use {@link
   * com.google.cloud.firestore.Pipeline#addFields} instead if only additions are
   * desired.
   *
   * <p>Example:
   *
   * ```typescript
   * firestore.pipeline().collection('books')
   *   .select(
   *     'firstName',
   *     Field.of('lastName'),
   *     Field.of('address').toUppercase().as('upperAddress'),
   *   );
   * ```
   *
   * @param selections The fields to include in the output documents, specified as {@link
   *     Selectable} expressions or {@code string} values representing field names.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  select(
    ...selections: (firestore.Selectable | string)[]
  ): Pipeline<AppModelType> {
    return this._addStage(new Select(this.selectablesToMap(selections)));
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
      } else if (selectable instanceof ExprWithAlias) {
        const expr = selectable as ExprWithAlias<Expr>;
        result.set(expr.alias, expr.expr);
      } else {
        throw new Error('unexpected selectable: ' + selectable);
      }
    }
    return result;
  }

  /**
   * Filters the documents from previous stages to only include those matching the specified {@link
   * FilterCondition}.
   *
   * <p>This stage allows you to apply conditions to the data, similar to a 'WHERE' clause in SQL.
   * You can filter documents based on their field values, using implementations of {@link
   * FilterCondition}, typically including but not limited to:
   *
   * <ul>
   *   <li>field comparators: {@link Function#eq}, {@link Function#lt} (less than), {@link
   *       Function#gt} (greater than), etc.</li>
   *   <li>logical operators: {@link Function#and}, {@link Function#or}, {@link Function#not}, etc.</li>
   *   <li>advanced functions: {@link Function#regexMatch}, {@link
   *       Function#arrayContains}, etc.</li>
   * </ul>
   *
   * <p>Example:
   *
   * ```typescript
   * firestore.pipeline().collection('books')
   *   .where(
   *     and(
   *         gt(Field.of('rating'), 4.0),   // Filter for ratings greater than 4.0
   *         Field.of('genre').eq('Science Fiction') // Equivalent to gt('genre', 'Science Fiction')
   *     )
   *   );
   * ```
   *
   * @param condition The {@link FilterCondition} to apply.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  where(condition: FilterCondition & firestore.Expr): Pipeline<AppModelType> {
    return this._addStage(new Where(condition));
  }

  /**
   * Skips the first `offset` number of documents from the results of previous stages.
   *
   * <p>This stage is useful for implementing pagination in your pipelines, allowing you to retrieve
   * results in chunks. It is typically used in conjunction with {@link #limit} to control the
   * size of each page.
   *
   * <p>Example:
   *
   * ```typescript
   * // Retrieve the second page of 20 results
   * firestore.pipeline().collection('books')
   *     .sort(Field.of('published').descending())
   *     .offset(20)  // Skip the first 20 results
   *     .limit(20);   // Take the next 20 results
   * ```
   *
   * @param offset The number of documents to skip.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  offset(offset: number): Pipeline<AppModelType> {
    return this._addStage(new Offset(offset));
  }

  /**
   * Limits the maximum number of documents returned by previous stages to `limit`.
   *
   * <p>This stage is particularly useful when you want to retrieve a controlled subset of data from
   * a potentially large result set. It's often used for:
   *
   * <ul>
   *   <li>**Pagination:** In combination with {@link #offset} to retrieve specific pages of
   *       results.</li>
   *   <li>**Limiting Data Retrieval:** To prevent excessive data transfer and improve performance,
   *       especially when dealing with large collections.</li>
   * </ul>
   *
   * <p>Example:
   *
   * ```typescript
   * // Limit the results to the top 10 highest-rated books
   * firestore.pipeline().collection('books')
   *     .sort(Field.of('rating').descending())
   *     .limit(10);
   * ```
   *
   * @param limit The maximum number of documents to return.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  limit(limit: number): Pipeline<AppModelType> {
    return this._addStage(new Limit(limit));
  }

  /**
   * Returns a set of distinct {@link Expr} values from the inputs to this stage.
   *
   * <p>This stage run through the results from previous stages to include only results with unique
   * combinations of {@link Expr} values ({@link Field}, {@link Function}, etc).
   *
   * <p>The parameters to this stage are defined using {@link Selectable} expressions or {@code string}s:
   *
   * <ul>
   *   <li>{@code string}: Name of an existing field</li>
   *   <li>{@link Field}: References an existing document field.</li>
   *   <li>{@link Function}: Represents the result of a function with an assigned alias name using
   *       {@link Expr#as}</li>
   * </ul>
   *
   * <p>Example:
   *
   * ```typescript
   * // Get a list of unique author names in uppercase and genre combinations.
   * firestore.pipeline().collection('books')
   *     .distinct(toUppercase(Field.of('author')).as('authorName'), Field.of('genre'), 'publishedAt')
   *     .select('authorName');
   * ```
   *
   * @param groups The {@link Selectable} expressions to consider when determining distinct
   *     value combinations or {@code string}s representing field names.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  distinct(
    ...groups: (string | firestore.Selectable)[]
  ): Pipeline<AppModelType> {
    return this._addStage(new Distinct(this.selectablesToMap(groups || [])));
  }

  /**
   * Performs aggregation operations on the documents from previous stages.
   *
   * <p>This stage allows you to calculate aggregate values over a set of documents. You define the
   * aggregations to perform using {@link AccumulatorTarget} expressions which are typically results of
   * calling {@link Expr#as} on {@link Accumulator} instances.
   *
   * <p>Example:
   *
   * ```typescript
   * // Calculate the average rating and the total number of books
   * firestore.pipeline().collection('books')
   *     .aggregate(
   *         Field.of('rating').avg().as('averageRating'),
   *         countAll().as('totalBooks')
   *     );
   * ```
   *
   * @param accumulators The {@link AccumulatorTarget} expressions, each wrapping an {@link Accumulator}
   *     and provide a name for the accumulated results.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  aggregate(
    ...accumulators: firestore.AccumulatorTarget[]
  ): Pipeline<AppModelType>;
  /**
   * Performs optionally grouped aggregation operations on the documents from previous stages.
   *
   * <p>This stage allows you to calculate aggregate values over a set of documents, optionally
   * grouped by one or more fields or functions. You can specify:
   *
   * <ul>
   *   <li>**Grouping Fields or Functions:** One or more fields or functions to group the documents
   *       by. For each distinct combination of values in these fields, a separate group is created.
   *       If no grouping fields are provided, a single group containing all documents is used. Not
   *       specifying groups is the same as putting the entire inputs into one group.</li>
   *   <li>**Accumulators:** One or more accumulation operations to perform within each group. These
   *       are defined using {@link AccumulatorTarget} expressions, which are typically created by
   *       calling {@link Expr#as} on {@link Accumulator} instances. Each aggregation
   *       calculates a value (e.g., sum, average, count) based on the documents within its group.</li>
   * </ul>
   *
   * <p>Example:
   *
   * ```typescript
   * // Calculate the average rating for each genre.
   * firestore.pipeline().collection('books')
   *   .aggregate({
   *       accumulators: [avg(Field.of('rating')).as('avg_rating')],
   *       groups: ['genre']
   *       });
   * ```
   *
   * @param aggregate An {@link Aggregate} object that specifies the grouping fields (if any) and
   *     the aggregation operations to perform.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  aggregate(options: {
    accumulators: firestore.AccumulatorTarget[];
    groups?: (string | Selectable)[];
  }): Pipeline<AppModelType>;
  aggregate(
    optionsOrTarget:
      | firestore.AccumulatorTarget
      | {
          accumulators: firestore.AccumulatorTarget[];
          groups?: (string | firestore.Selectable)[];
        },
    ...rest: firestore.AccumulatorTarget[]
  ): Pipeline<AppModelType> {
    if ('accumulators' in optionsOrTarget) {
      return this._addStage(
        new Aggregate(
          new Map<string, Accumulator>(
            optionsOrTarget.accumulators.map(
              (target: firestore.AccumulatorTarget) => [
                (target as unknown as AccumulatorTarget).alias,
                (target as unknown as AccumulatorTarget).expr,
              ]
            )
          ),
          this.selectablesToMap(optionsOrTarget.groups || [])
        )
      );
    } else {
      return this._addStage(
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
  }

  findNearest(options: firestore.FindNearestOptions): Pipeline<AppModelType> {
    return this._addStage(new FindNearest(options));
  }

  /**
   * Fully overwrites all fields in a document with those coming from a nested map.
   *
   * <p>This stage allows you to emit a map value as a document. Each key of the map becomes a field
   * on the document that contains the corresponding value.
   *
   * <p>Example:
   *
   * ```typescript
   * // Input.
   * // {
   * //  'name': 'John Doe Jr.',
   * //  'parents': {
   * //    'father': 'John Doe Sr.',
   * //    'mother': 'Jane Doe'
   * //   }
   * // }
   *
   * // Emit parents as document.
   * firestore.pipeline().collection('people').replace(Field.of('parents'));
   *
   * // Output
   * // {
   * //  'father': 'John Doe Sr.',
   * //  'mother': 'Jane Doe'
   * // }
   * ```
   *
   * @param field The {@link Selectable} field containing the nested map.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  replace(field: firestore.Selectable | string): Pipeline<AppModelType> {
    return this._addStage(new Replace(selectableToExpr(field), 'full_replace'));
  }

  /**
   * Performs a pseudo-random sampling of the documents from the previous stage.
   *
   * <p>This stage will filter documents pseudo-randomly. The parameter specifies how number of
   * documents to be returned.
   *
   * <p>Examples:
   *
   * ```typescript
   * // Sample 25 books, if available.
   * firestore.pipeline().collection('books')
   *     .sample(25);
   * ```
   *
   * @param documents The number of documents to sample..
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  sample(documents: number): Pipeline<AppModelType>;

  /**
   * Performs a pseudo-random sampling of the documents from the previous stage.
   *
   * <p>This stage will filter documents pseudo-randomly. The 'options' parameter specifies how
   * sampling will be performed. See {@code SampleOptions} for more information.
   *
   * <p>Examples:
   *
   * // Sample 10 books, if available.
   * firestore.pipeline().collection("books")
   *     .sample({ documents: 10 });
   *
   * // Sample 50% of books.
   * firestore.pipeline().collection("books")
   *     .sample({ percentage: 0.5 });
   * }
   * </pre>
   *
   * @param options The {@code SampleOptions} specifies how sampling is performed.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  sample(
    options: {percentage: number} | {documents: number}
  ): Pipeline<AppModelType>;
  sample(
    documentsOrOptions: number | {percentage: number} | {documents: number}
  ): Pipeline<AppModelType> {
    if (typeof documentsOrOptions === 'number') {
      return this._addStage(
        new Sample({limit: documentsOrOptions, mode: 'documents'})
      );
    } else if ('percentage' in documentsOrOptions) {
      return this._addStage(
        new Sample({limit: documentsOrOptions.percentage, mode: 'percent'})
      );
    } else {
      return this._addStage(
        new Sample({limit: documentsOrOptions.documents, mode: 'documents'})
      );
    }
  }

  /**
   * Performs union of all documents from two pipelines, including duplicates.
   *
   * <p>This stage will pass through documents from previous stage, and also pass through documents
   * from previous stage of the `other` {@code Pipeline} given in parameter. The order of documents
   * emitted from this stage is undefined.
   *
   * <p>Example:
   *
   * ```typescript
   * // Emit documents from books collection and magazines collection.
   * firestore.pipeline().collection('books')
   *     .union(firestore.pipeline().collection('magazines'));
   * ```
   *
   * @param other The other {@code Pipeline} that is part of union.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  union(other: Pipeline<AppModelType>): Pipeline<AppModelType> {
    return this._addStage(new Union(other));
  }

  /**
   * Produces a document for each element in array found in previous stage document.
   *
   * <p>For each previous stage document, this stage will emit zero or more augmented documents. The
   * input array found in the previous stage document field specified by the `fieldName` parameter,
   * will emit an augmented document for each input array element. The input array element will
   * augment the previous stage document by setting the `alias` field  with the array element value.
   *
   * <p>When `fieldName` evaluates to a non-array value (ex: number, null, absent), then the stage becomes a no-op for
   * the current input document, returning it as is with the `alias` field absent.
   *
   * <p>No documents are emitted when `fieldName` evaluates to an empty array.
   *
   * <p>Example:
   *
   * ```typescript
   * // Input:
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tags": [ "comedy", "space", "adventure" ], ... }
   *
   * // Emit a book document for each tag of the book.
   * firestore.pipeline().collection("books")
   *     .unnest("tags");
   *
   * // Output:
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "comedy", ... }
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "space", ... }
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "adventure", ... }
   * ```
   *
   * @param field The name of the field containing the array.
   * @param alias The alias field is used as the field name for each element within the output array. The alias does
   * not overwrite the original field unless the field names match.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  unnest(
    field: firestore.Selectable | string,
    alias: Field | string
  ): Pipeline<AppModelType>;

  /**
   * Produces a document for each element in array found in previous stage document.
   *
   * <p>For each previous stage document, this stage will emit zero or more augmented documents. The
   * input array found in the previous stage document field specified by the `fieldName` parameter,
   * will emit an augmented document for each input array element. The input array element will
   * augment the previous stage document by setting the `alias` field  with the array element value.
   *
   * <p>When `fieldName` evaluates to a non-array value (ex: number, null, absent), then the stage becomes a no-op for
   * the current input document, returning it as is with the `alias` field absent and `indexField` set to null.
   *
   * <p>No documents are emitted when `fieldName` evaluates to an empty array.
   *
   * <p>Example:
   *
   * ```typescript
   * // Input:
   * // { 'title': 'The Hitchhiker's Guide to the Galaxy', 'tags': [ 'comedy', 'space', 'adventure' ], ... }
   *
   * // Emit a book document for each tag of the book.
   * firestore.pipeline().collection('books')
   *     .unnest({ field: 'tags', alias: 'tag', UnnestOptions.indexField('tagIndex')});
   *
   * // Output:
   * // { 'title': 'The Hitchhiker's Guide to the Galaxy', 'tagIndex': 0, 'tag': 'comedy', ... }
   * // { 'title': 'The Hitchhiker's Guide to the Galaxy', 'tagIndex': 1, 'tag': 'space', ... }
   * // { 'title': 'The Hitchhiker's Guide to the Galaxy', 'tagIndex': 2, 'tag': 'adventure', ... }
   * ```
   *
   * @param options The {@code UnnestOptions} options.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  unnest(options: UnnestOptions): Pipeline<AppModelType>;
  unnest(
    fieldOrOptions: firestore.Selectable | string | UnnestOptions,
    alias?: Field | string
  ): Pipeline<AppModelType> {
    if (alias) {
      return this._addStage(
        new Unnest({
          field: <firestore.Selectable | string>fieldOrOptions,
          alias: alias,
        })
      );
    } else {
      return this._addStage(new Unnest(<UnnestOptions>fieldOrOptions));
    }
  }

  /**
   * Sorts the documents from previous stages based on one or more {@link Ordering} criteria.
   *
   * <p>This stage allows you to order the results of your pipeline. You can specify multiple {@link
   * Ordering} instances to sort by multiple fields in ascending or descending order. If documents
   * have the same value for a field used for sorting, the next specified ordering will be used. If
   * all orderings result in equal comparison, the documents are considered equal and the order is
   * unspecified.
   *
   * <p>Example:
   *
   * ```typescript
   * // Sort books by rating in descending order, and then by title in ascending order for books
   * // with the same rating
   * firestore.pipeline().collection('books')
   *     .sort(
   *         Field.of('rating').descending(),
   *         Field.of('title').ascending()
   *     );
   * ```
   *
   * @param orders One or more {@link Ordering} instances specifying the sorting criteria.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  sort(...orderings: Ordering[]): Pipeline<AppModelType>;
  sort(options: {orderings: Ordering[]}): Pipeline<AppModelType>;
  sort(
    optionsOrOrderings:
      | Ordering
      | {
          orderings: Ordering[];
        },
    ...rest: Ordering[]
  ): Pipeline<AppModelType> {
    // Option object
    if ('orderings' in optionsOrOrderings) {
      return this._addStage(new Sort(optionsOrOrderings.orderings));
    } else {
      // Ordering object
      return this._addStage(new Sort([optionsOrOrderings, ...rest]));
    }
  }

  /**
   * Adds a generic stage to the pipeline.
   *
   * <p>This method provides a flexible way to extend the pipeline's functionality by adding custom
   * stages. Each generic stage is defined by a unique `name` and a set of `params` that control its
   * behavior.
   *
   * <p>Example (Assuming there is no 'where' stage available in SDK):
   *
   * ```typescript
   * // Assume we don't have a built-in 'where' stage
   * firestore.pipeline().collection('books')
   *     .genericStage('where', [Field.of('published').lt(1900)]) // Custom 'where' stage
   *     .select('title', 'author');
   * ```
   *
   * @param name The unique name of the generic stage to add.
   * @param params A list of parameters to configure the generic stage's behavior.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  genericStage(name: string, params: any[]): Pipeline<AppModelType> {
    return this._addStage(new GenericStage(name, params));
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
   * const futureResults = await firestore.pipeline().collection('books')
   *     .where(gt(Field.of('rating'), 4.5))
   *     .select('title', 'author', 'rating')
   *     .execute();
   * ```
   *
   * @return A Promise representing the asynchronous pipeline execution.
   */
  execute(): Promise<Array<PipelineResult<AppModelType>>> {
    return this._execute().then(response => response.result || []);
  }

  _execute(
    transactionOrReadTime?: Uint8Array | Timestamp | api.ITransactionOptions,
    explainOptions?: FirebaseFirestore.ExplainOptions
  ): Promise<PipelineResponse<AppModelType>> {
    const util = new ExecutionUtil<AppModelType>(
      this.db,
      this.db._serializer!,
      this.converter
    );
    return util
      ._getResponse(this, transactionOrReadTime, explainOptions)
      .then(result => result!);
  }

  /**
   * Executes this pipeline and streams the results as {@link PipelineResult}s.
   *
   * @returns {Stream.<PipelineResult>} A stream of
   * PipelineResult.
   *
   * @example
   * ```typescript
   * firestore.pipeline().collection('books')
   *     .where(gt(Field.of('rating'), 4.5))
   *     .select('title', 'author', 'rating')
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

  _toProto(): api.IPipeline {
    const stages: IStage[] = this.stages.map(stage =>
      stage._toProto(this.db._serializer!)
    );
    return {stages};
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
