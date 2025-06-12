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
import * as deepEqual from 'fast-deep-equal';
import {google} from '../../protos/firestore_v1_proto_api';
import Firestore, {
  CollectionReference,
  FieldPath,
  Query,
  Timestamp,
} from '../index';
import {validateFieldPath} from '../path';
import {
  ExecutionUtil,
  fieldOrExpression,
  isAggregateWithAlias,
  isBooleanExpr,
  isCollectionReference,
  isExpr,
  isField,
  isNumber,
  isOrdering,
  isPipeline,
  isSelectable,
  isString,
  toField,
  vectorToExpr,
} from './pipeline-util';
import {PipelineOptions} from './pipeline-options';
import {DocumentReference} from '../reference/document-reference';
import {PipelineResponse} from '../reference/types';
import {HasUserData, hasUserData, Serializer} from '../serializer';
import {ApiMapValue} from '../types';
import * as protos from '../../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;
import IStage = google.firestore.v1.Pipeline.IStage;
import {isOptionalEqual, isPlainObject} from '../util';

import {
  AggregateFunction,
  AggregateWithAlias,
  Expr,
  ExprWithAlias,
  Field,
  BooleanExpr,
  Ordering,
  constant,
  _mapValue,
  field,
} from './expression';
import {
  AddFields,
  Aggregate,
  CollectionSource,
  CollectionGroupSource,
  DatabaseSource,
  DocumentsSource,
  Where,
  FindNearest,
  GenericStage,
  Limit,
  Offset,
  Select,
  Sort,
  Stage,
  Distinct,
  RemoveFields,
  ReplaceWith,
  Sample,
  Union,
  Unnest,
  InternalWhereStageOptions,
  InternalOffsetStageOptions,
  InternalLimitStageOptions,
  InternalDistinctStageOptions,
  InternalAggregateStageOptions,
  InternalFindNearestStageOptions,
  InternalReplaceWithStageOptions,
  InternalSampleStageOptions,
  InternalUnionStageOptions,
  InternalUnnestStageOptions,
  InternalSortStageOptions,
  InternalDocumentsStageOptions,
  InternalCollectionGroupStageOptions,
  InternalCollectionStageOptions,
} from './stage';
import {StructuredPipeline} from './structured-pipeline';
import Selectable = FirebaseFirestore.Pipelines.Selectable;

/**
 * Represents the source of a Firestore {@link Pipeline}.
 */
export class PipelineSource implements firestore.Pipelines.PipelineSource {
  constructor(private db: Firestore) {}

  /**
   * Returns all documents from the entire collection. The collection can be nested.
   * @param collection - Name or reference to the collection that will be used as the Pipeline source.
   */
  collection(collection: string | firestore.CollectionReference): Pipeline;
  /**
   * Returns all documents from the entire collection. The collection can be nested.
   * @param options - Options defining how this CollectionStage is evaluated.
   */
  collection(options: firestore.Pipelines.CollectionStageOptions): Pipeline;
  collection(
    collectionOrOptions:
      | string
      | firestore.CollectionReference
      | firestore.Pipelines.CollectionStageOptions
  ): Pipeline {
    const options =
      isString(collectionOrOptions) ||
      isCollectionReference(collectionOrOptions)
        ? {}
        : collectionOrOptions;

    const collection =
      isString(collectionOrOptions) ||
      isCollectionReference(collectionOrOptions)
        ? collectionOrOptions
        : collectionOrOptions.collection;

    // Validate that a user provided reference is for the same Firestore DB
    if (isCollectionReference(collection)) {
      this._validateReference(collection);
    }

    const normalizedCollection = isString(collection)
      ? this.db.collection(collection)
      : (collection as CollectionReference);

    const internalOptions: InternalCollectionStageOptions = {
      ...options,
      collection: normalizedCollection,
    };

    return new Pipeline(this.db, [new CollectionSource(internalOptions)]);
  }

  /**
   * Returns all documents from a collection ID regardless of the parent.
   * @param collectionId - ID of the collection group to use as the Pipeline source.
   */
  collectionGroup(collectionId: string): Pipeline;

  /**
   * Returns all documents from a collection ID regardless of the parent.
   * @param options - Options defining how this CollectionGroupStage is evaluated.
   */
  collectionGroup(
    options: firestore.Pipelines.CollectionGroupStageOptions
  ): Pipeline;
  collectionGroup(
    collectionIdOrOptions:
      | string
      | firestore.Pipelines.CollectionGroupStageOptions
  ): Pipeline {
    const options: InternalCollectionGroupStageOptions = isString(
      collectionIdOrOptions
    )
      ? {collectionId: collectionIdOrOptions}
      : {...collectionIdOrOptions};
    return new Pipeline(this.db, [new CollectionGroupSource(options)]);
  }

  /**
   * Returns all documents from the entire database.
   */
  database(): Pipeline;
  /**
   * Returns all documents from the entire database.
   * @param options - Options defining how a DatabaseStage is evaluated.
   */
  database(options: firestore.Pipelines.DatabaseStageOptions): Pipeline;
  database(options?: firestore.Pipelines.DatabaseStageOptions): Pipeline {
    return new Pipeline(this.db, [new DatabaseSource(options ?? {})]);
  }

  /**
   * Set the pipeline's source to the documents specified by the given paths and DocumentReferences.
   *
   * @param docs An array of paths and DocumentReferences specifying the individual documents that will be the source of this pipeline.
   * The converters for these DocumentReferences will be ignored and not have an effect on this pipeline.
   *
   * @throws {@FirestoreError} Thrown if any of the provided DocumentReferences target a different project or database than the pipeline.
   */
  documents(docs: Array<string | DocumentReference>): Pipeline;

  /**
   * Set the pipeline's source to the documents specified by the given paths and DocumentReferences.
   *
   * @param options - Options defining how this DocumentsStage is evaluated.
   *
   * @throws {@FirestoreError} Thrown if any of the provided DocumentReferences target a different project or database than the pipeline.
   */
  documents(options: firestore.Pipelines.DocumentsStageOptions): Pipeline;
  documents(
    docsOrOptions:
      | Array<string | DocumentReference>
      | firestore.Pipelines.DocumentsStageOptions
  ): Pipeline {
    const options = Array.isArray(docsOrOptions) ? {} : docsOrOptions;
    const docs = Array.isArray(docsOrOptions)
      ? docsOrOptions
      : docsOrOptions.docs;

    // Validate that all user provided references are for the same Firestore DB
    docs
      .filter(v => v instanceof DocumentReference)
      .forEach(dr =>
        this._validateReference(dr as firestore.DocumentReference)
      );

    const normalizedDocs: Array<DocumentReference> = docs.map(doc =>
      isString(doc) ? this.db.doc(doc) : (doc as DocumentReference)
    );

    const internalOptions: InternalDocumentsStageOptions = {
      ...options,
      docs: normalizedDocs,
    };
    return new Pipeline(this.db, [new DocumentsSource(internalOptions)]);
  }

  /**
   * Convert the given Query into an equivalent Pipeline.
   *
   * @param query A Query to be converted into a Pipeline.
   *
   * @throws {@FirestoreError} Thrown if any of the provided DocumentReferences target a different project or database than the pipeline.
   */
  createFrom(query: firestore.Query): Pipeline {
    return (query as unknown as Query)._pipeline();
  }

  _validateReference(
    reference: firestore.CollectionReference | firestore.DocumentReference
  ): reference is CollectionReference | DocumentReference {
    if (
      !(
        reference instanceof CollectionReference ||
        reference instanceof DocumentReference
      )
    ) {
      throw new Error(
        'Invalid reference. The value may not be a CollectionReference or DocumentReference. Or, it may be an object from a different SDK build.'
      );
    }

    const refDbId = reference.firestore.formattedName;
    if (refDbId !== this.db.formattedName) {
      throw new Error(
        `Invalid ${
          reference instanceof CollectionReference
            ? 'CollectionReference'
            : 'DocumentReference'
        }. ` +
          `The database name ("${refDbId}") of this reference does not match ` +
          `the database name ("${this.db.formattedName}") of the target database of this Pipeline.`
      );
    }

    return true;
  }
}

/**
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
 *     .select('title', 'author', field('rating').as('bookRating'))
 *     .execute();
 *
 * // Example 2: Filter documents where 'genre' is 'Science Fiction' and 'published' is after 1950
 * const results2 = await db.pipeline()
 *     .collection('books')
 *     .where(and(field('genre').eq('Science Fiction'), field('published').gt(1950)))
 *     .execute();
 *
 * // Example 3: Calculate the average rating of books published after 1980
 * const results3 = await db.pipeline()
 *     .collection('books')
 *     .where(field('published').gt(1980))
 *     .aggregate(avg(field('rating')).as('averageRating'))
 *     .execute();
 * ```
 */
export class Pipeline implements firestore.Pipelines.Pipeline {
  constructor(
    private db: Firestore,
    private stages: Stage[]
  ) {}

  private _addStage(stage: Stage): Pipeline {
    const copy = this.stages.map(s => s);
    copy.push(stage);
    return new Pipeline(this.db, copy);
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
   * - {@link Expr}: Either a literal value (see {@link Constant}) or a computed value
   *   (see {@FunctionExpr}) with an assigned alias using {@link Expr#as}.
   *
   * Example:
   *
   * ```typescript
   * firestore.pipeline().collection("books")
   *   .addFields(
   *     field("rating").as("bookRating"), // Rename 'rating' to 'bookRating'
   *     add(5, field("quantity")).as("totalCost")  // Calculate 'totalCost'
   *   );
   * ```
   *
   * @param field The first field to add to the documents, specified as a {@link Selectable}.
   * @param additionalFields Optional additional fields to add to the documents, specified as {@link Selectable}s.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  addFields(
    field: firestore.Pipelines.Selectable,
    ...additionalFields: firestore.Pipelines.Selectable[]
  ): Pipeline;
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
   * - {@link Expr}: Either a literal value (see {@link Constant}) or a computed value
   *   (see {@FunctionExpr}) with an assigned alias using {@link Expr#as}.
   *
   * Example:
   *
   * ```typescript
   * firestore.pipeline().collection("books")
   *   .addFields(
   *     field("rating").as("bookRating"), // Rename 'rating' to 'bookRating'
   *     add(5, field("quantity")).as("totalCost")  // Calculate 'totalCost'
   *   );
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  addFields(options: firestore.Pipelines.AddFieldsStageOptions): Pipeline;
  addFields(
    fieldOrOptions:
      | firestore.Pipelines.Selectable
      | firestore.Pipelines.AddFieldsStageOptions,
    ...additionalFields: firestore.Pipelines.Selectable[]
  ): Pipeline {
    const options = isSelectable(fieldOrOptions) ? {} : fieldOrOptions;
    const fields: firestore.Pipelines.Selectable[] = isSelectable(
      fieldOrOptions
    )
      ? [fieldOrOptions, ...additionalFields]
      : fieldOrOptions.fields;
    const normalizedFields: Map<string, Expr> = selectablesToMap(fields);

    this._validateUserData('select', normalizedFields);

    const internalOptions = {
      ...options,
      fields: normalizedFields,
    };
    return this._addStage(new AddFields(internalOptions));
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
   *     field('rating'),
   *     'cost'
   *   );
   * ```
   *
   * @param fieldValue The first field to remove.
   * @param additionalFields Optional additional fields to remove.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  removeFields(
    fieldValue: firestore.Pipelines.Field | string,
    ...additionalFields: Array<firestore.Pipelines.Field | string>
  ): Pipeline;
  /**
   * Remove fields from outputs of previous stages.
   *
   * Example:
   *
   * ```typescript
   * firestore.pipeline().collection('books')
   *   // removes field 'rating' and 'cost' from the previous stage outputs.
   *   .removeFields(
   *     field('rating'),
   *     'cost'
   *   );
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  removeFields(options: firestore.Pipelines.RemoveFieldsStageOptions): Pipeline;
  removeFields(
    fieldValueOrOptions:
      | firestore.Pipelines.Field
      | string
      | firestore.Pipelines.RemoveFieldsStageOptions,
    ...additionalFields: Array<firestore.Pipelines.Field | string>
  ): Pipeline {
    const options =
      isField(fieldValueOrOptions) || isString(fieldValueOrOptions)
        ? {}
        : fieldValueOrOptions;

    const fields: Array<firestore.Pipelines.Field | string> =
      isField(fieldValueOrOptions) || isString(fieldValueOrOptions)
        ? [fieldValueOrOptions, ...additionalFields]
        : fieldValueOrOptions.fields;
    const convertedFields: Array<Field> = fields.map(f =>
      isString(f) ? field(f) : (f as Field)
    );
    this._validateUserData('removeFields', convertedFields);

    const innerOptions = {
      ...options,
      fields: convertedFields,
    };

    return this._addStage(new RemoveFields(innerOptions));
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
   * Pipeline#addFields} instead if only additions are
   * desired.
   *
   * <p>Example:
   *
   * ```typescript
   * db.pipeline().collection("books")
   *   .select(
   *     "firstName",
   *     field("lastName"),
   *     field("address").toUppercase().as("upperAddress"),
   *   );
   * ```
   *
   * @param selection The first field to include in the output documents, specified as {@link
   *     Selectable} expression or string value representing the field name.
   * @param additionalSelections Optional additional fields to include in the output documents, specified as {@link
   *     Selectable} expressions or {@code string} values representing field names.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  select(
    selection: firestore.Pipelines.Selectable | string,
    ...additionalSelections: Array<firestore.Pipelines.Selectable | string>
  ): Pipeline;
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
   * Pipeline#addFields} instead if only additions are
   * desired.
   *
   * <p>Example:
   *
   * ```typescript
   * db.pipeline().collection("books")
   *   .select(
   *     "firstName",
   *     field("lastName"),
   *     field("address").toUppercase().as("upperAddress"),
   *   );
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  select(options: firestore.Pipelines.SelectStageOptions): Pipeline;
  select(
    selectionOrOptions:
      | firestore.Pipelines.Selectable
      | string
      | firestore.Pipelines.SelectStageOptions,
    ...additionalSelections: Array<firestore.Pipelines.Selectable | string>
  ): Pipeline {
    const options =
      isSelectable(selectionOrOptions) || isString(selectionOrOptions)
        ? {}
        : selectionOrOptions;

    const selections: Array<firestore.Pipelines.Selectable | string> =
      isSelectable(selectionOrOptions) || isString(selectionOrOptions)
        ? [selectionOrOptions, ...additionalSelections]
        : selectionOrOptions.selections;
    const normalizedSelections: Map<string, Expr> =
      selectablesToMap(selections);

    this._validateUserData('select', normalizedSelections);

    const internalOptions = {
      ...options,
      selections: normalizedSelections,
    };
    return this._addStage(new Select(internalOptions));
  }

  /**
   * Filters the documents from previous stages to only include those matching the specified {@link
   * BooleanExpr}.
   *
   * <p>This stage allows you to apply conditions to the data, similar to a "WHERE" clause in SQL.
   * You can filter documents based on their field values, using implementations of {@link
   * BooleanExpr}, typically including but not limited to:
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
   * firestore.pipeline().collection("books")
   *   .where(
   *     and(
   *         gt(field("rating"), 4.0),   // Filter for ratings greater than 4.0
   *         field("genre").eq("Science Fiction") // Equivalent to gt("genre", "Science Fiction")
   *     )
   *   );
   * ```
   *
   * @param condition The {@link BooleanExpr} to apply.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  where(condition: firestore.Pipelines.BooleanExpr): Pipeline;
  /**
   * Filters the documents from previous stages to only include those matching the specified {@link
   * BooleanExpr}.
   *
   * <p>This stage allows you to apply conditions to the data, similar to a "WHERE" clause in SQL.
   * You can filter documents based on their field values, using implementations of {@link
   * BooleanExpr}, typically including but not limited to:
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
   * firestore.pipeline().collection("books")
   *   .where(
   *     and(
   *         gt(field("rating"), 4.0),   // Filter for ratings greater than 4.0
   *         field("genre").eq("Science Fiction") // Equivalent to gt("genre", "Science Fiction")
   *     )
   *   );
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  where(options: firestore.Pipelines.WhereStageOptions): Pipeline;
  where(
    conditionOrOptions:
      | firestore.Pipelines.BooleanExpr
      | firestore.Pipelines.WhereStageOptions
  ): Pipeline {
    const options = isBooleanExpr(conditionOrOptions) ? {} : conditionOrOptions;

    const condition: firestore.Pipelines.BooleanExpr = isBooleanExpr(
      conditionOrOptions
    )
      ? conditionOrOptions
      : conditionOrOptions.condition;
    const convertedCondition: BooleanExpr = condition as BooleanExpr;
    this._validateUserData('where', convertedCondition);

    const internalOptions: InternalWhereStageOptions = {
      ...options,
      condition: convertedCondition,
    };

    return this._addStage(new Where(internalOptions));
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
   *     .sort(field('published').descending())
   *     .offset(20)  // Skip the first 20 results
   *     .limit(20);   // Take the next 20 results
   * ```
   *
   * @param offset The number of documents to skip.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  offset(offset: number): Pipeline;
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
   *     .sort(field('published').descending())
   *     .offset(20)  // Skip the first 20 results
   *     .limit(20);   // Take the next 20 results
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  offset(options: firestore.Pipelines.OffsetStageOptions): Pipeline;
  offset(
    offsetOrOptions: number | firestore.Pipelines.OffsetStageOptions
  ): Pipeline {
    const options = isNumber(offsetOrOptions) ? {} : offsetOrOptions;

    const offset: number = isNumber(offsetOrOptions)
      ? offsetOrOptions
      : offsetOrOptions.offset;

    const internalOptions: InternalOffsetStageOptions = {
      ...options,
      offset,
    };
    return this._addStage(new Offset(internalOptions));
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
   *     .sort(field('rating').descending())
   *     .limit(10);
   * ```
   *
   * @param limit The maximum number of documents to return.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  limit(limit: number): Pipeline;
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
   *     .sort(field('rating').descending())
   *     .limit(10);
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  limit(options: firestore.Pipelines.LimitStageOptions): Pipeline;
  limit(
    limitOrOptions: number | firestore.Pipelines.LimitStageOptions
  ): Pipeline {
    const options = isNumber(limitOrOptions) ? {} : limitOrOptions;

    const limit: number = isNumber(limitOrOptions)
      ? limitOrOptions
      : limitOrOptions.limit;

    const internalOptions: InternalLimitStageOptions = {
      ...options,
      limit,
    };
    return this._addStage(new Limit(internalOptions));
  }

  /**
   * Returns a set of distinct values from the inputs to this stage.
   *
   * This stage runs through the results from previous stages to include only results with
   * unique combinations of {@link Expr} values ({@link Field}, {@link Function}, etc).
   *
   * The parameters to this stage are defined using {@link Selectable} expressions or strings:
   *
   * - {@code string}: Name of an existing field
   * - {@link Field}: References an existing document field.
   * - {@link ExprWithAlias}: Represents the result of a function with an assigned alias name
   *   using {@link Expr#as}.
   *
   * Example:
   *
   * ```typescript
   * // Get a list of unique author names in uppercase and genre combinations.
   * firestore.pipeline().collection("books")
   *     .distinct(toUppercase(field("author")).as("authorName"), field("genre"), "publishedAt")
   *     .select("authorName");
   * ```
   *
   * @param group The {@link Selectable} expression or field name to consider when determining
   *     distinct value combinations.
   * @param additionalGroups Optional additional {@link Selectable} expressions to consider when determining distinct
   *     value combinations or strings representing field names.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  distinct(
    group: string | firestore.Pipelines.Selectable,
    ...additionalGroups: Array<string | firestore.Pipelines.Selectable>
  ): Pipeline;
  /**
   * Returns a set of distinct values from the inputs to this stage.
   *
   * This stage runs through the results from previous stages to include only results with
   * unique combinations of {@link Expr} values ({@link Field}, {@link Function}, etc).
   *
   * The parameters to this stage are defined using {@link Selectable} expressions or strings:
   *
   * - {@code string}: Name of an existing field
   * - {@link Field}: References an existing document field.
   * - {@link ExprWithAlias}: Represents the result of a function with an assigned alias name
   *   using {@link Expr#as}.
   *
   * Example:
   *
   * ```typescript
   * // Get a list of unique author names in uppercase and genre combinations.
   * firestore.pipeline().collection("books")
   *     .distinct(toUppercase(field("author")).as("authorName"), field("genre"), "publishedAt")
   *     .select("authorName");
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  distinct(options: firestore.Pipelines.DistinctStageOptions): Pipeline;
  distinct(
    groupOrOptions:
      | string
      | firestore.Pipelines.Selectable
      | firestore.Pipelines.DistinctStageOptions,
    ...additionalGroups: Array<string | firestore.Pipelines.Selectable>
  ): Pipeline {
    const options =
      isString(groupOrOptions) || isSelectable(groupOrOptions)
        ? {}
        : groupOrOptions;

    const groups: Array<string | Selectable> =
      isString(groupOrOptions) || isSelectable(groupOrOptions)
        ? [groupOrOptions, ...additionalGroups]
        : groupOrOptions.groups;
    const convertedGroups: Map<string, Expr> = selectablesToMap(groups);
    this._validateUserData('distinct', convertedGroups);

    const internalOptions: InternalDistinctStageOptions = {
      ...options,
      groups: convertedGroups,
    };

    return this._addStage(new Distinct(internalOptions));
  }

  /**
   * Performs aggregation operations on the documents from previous stages.
   *
   * <p>This stage allows you to calculate aggregate values over a set of documents. You define the
   * aggregations to perform using {@link AggregateWithAlias} expressions which are typically results of
   * calling {@link Expr#as} on {@link AggregateFunction} instances.
   *
   * <p>Example:
   *
   * ```typescript
   * // Calculate the average rating and the total number of books
   * firestore.pipeline().collection("books")
   *     .aggregate(
   *         field("rating").avg().as("averageRating"),
   *         countAll().as("totalBooks")
   *     );
   * ```
   *
   * @param accumulator The first {@link AggregateWithAlias}, wrapping an {@link AggregateFunction}
   *     and providing a name for the accumulated results.
   * @param additionalAccumulators Optional additional {@link AggregateWithAlias}, each wrapping an {@link AggregateFunction}
   *     and providing a name for the accumulated results.
   * @return A new Pipeline object with this stage appended to the stage list.
   */
  aggregate(
    accumulator: firestore.Pipelines.AggregateWithAlias,
    ...additionalAccumulators: firestore.Pipelines.AggregateWithAlias[]
  ): Pipeline;
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
   *       are defined using {@link AggregateWithAlias} expressions, which are typically created by
   *       calling {@link Expr#as} on {@link AggregateFunction} instances. Each aggregation
   *       calculates a value (e.g., sum, average, count) based on the documents within its group.</li>
   * </ul>
   *
   * <p>Example:
   *
   * ```typescript
   * // Calculate the average rating for each genre.
   * firestore.pipeline().collection("books")
   *   .aggregate({
   *       accumulators: [avg(field("rating")).as("avg_rating")]
   *       groups: ["genre"]
   *       });
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new {@code Pipeline} object with this stage appended to the stage
   * list.
   */
  aggregate(options: firestore.Pipelines.AggregateStageOptions): Pipeline;
  aggregate(
    targetOrOptions:
      | firestore.Pipelines.AggregateWithAlias
      | firestore.Pipelines.AggregateStageOptions,
    ...rest: firestore.Pipelines.AggregateWithAlias[]
  ): Pipeline {
    const options = isAggregateWithAlias(targetOrOptions)
      ? {}
      : targetOrOptions;

    const accumulators: Array<firestore.Pipelines.AggregateWithAlias> =
      isAggregateWithAlias(targetOrOptions)
        ? [targetOrOptions, ...rest]
        : targetOrOptions.accumulators;
    const convertedAccumulators: Map<string, AggregateFunction> =
      aggregateWithAliasToMap(accumulators);
    const groups: Array<firestore.Pipelines.Selectable | string> =
      isAggregateWithAlias(targetOrOptions) ? [] : targetOrOptions.groups ?? [];
    const convertedGroups: Map<string, Expr> = selectablesToMap(groups);
    this._validateUserData('aggregate', convertedGroups);

    const internalOptions: InternalAggregateStageOptions = {
      ...options,
      accumulators: convertedAccumulators,
      groups: convertedGroups,
    };

    return this._addStage(new Aggregate(internalOptions));
  }

  /**
   * Performs a vector proximity search on the documents from the previous stage, returning the
   * K-nearest documents based on the specified query `vectorValue` and `distanceMeasure`. The
   * returned documents will be sorted in order from nearest to furthest from the query `vectorValue`.
   *
   * <p>Example:
   *
   * ```typescript
   * // Find the 10 most similar books based on the book description.
   * const bookDescription = "Lorem ipsum...";
   * const queryVector: number[] = ...; // compute embedding of `bookDescription`
   *
   * firestore.pipeline().collection("books")
   *     .findNearest({
   *       field: 'embedding',
   *       vectorValue: queryVector,
   *       distanceMeasure: 'euclidean',
   *       limit: 10,                        // optional
   *       distanceField: 'computedDistance' // optional
   *     });
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  findNearest(options: firestore.Pipelines.FindNearestStageOptions): Pipeline {
    const field = toField(options.field);
    const vectorValue = vectorToExpr(options.vectorValue);
    const distanceField = options.distanceField
      ? toField(options.distanceField)
      : undefined;

    this._validateUserData('findNearest', field);

    this._validateUserData('findNearest', vectorValue);

    const internalOptions: InternalFindNearestStageOptions = {
      ...options,
      field,
      vectorValue,
      distanceField,
    };

    return this._addStage(new FindNearest(internalOptions));
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
   * firestore.pipeline().collection('people').replaceWith('parents');
   *
   * // Output
   * // {
   * //  'father': 'John Doe Sr.',
   * //  'mother': 'Jane Doe'
   * // }
   * ```
   *
   * @param fieldName The {@link Field} field containing the nested map.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  replaceWith(fieldName: string): Pipeline;
  /**
   * Fully overwrites all fields in a document with those coming from a map.
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
   * firestore.pipeline().collection('people').replaceWith(map({
   *   foo: 'bar',
   *   info: {
   *     name: field('name')
   *   }
   * }));
   *
   * // Output
   * // {
   * //  'father': 'John Doe Sr.',
   * //  'mother': 'Jane Doe'
   * // }
   * ```
   *
   * @param expr An {@link Expr} that when returned evaluates to a map.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  replaceWith(expr: firestore.Pipelines.Expr): Pipeline;
  /**
   * Fully overwrites all fields in a document with those coming from a map.
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
   * firestore.pipeline().collection('people').replaceWith(map({
   *   foo: 'bar',
   *   info: {
   *     name: field('name')
   *   }
   * }));
   *
   * // Output
   * // {
   * //  'father': 'John Doe Sr.',
   * //  'mother': 'Jane Doe'
   * // }
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  replaceWith(options: firestore.Pipelines.ReplaceWithStageOptions): Pipeline;
  replaceWith(
    valueOrOptions:
      | firestore.Pipelines.Expr
      | string
      | firestore.Pipelines.ReplaceWithStageOptions
  ): Pipeline {
    const options =
      isString(valueOrOptions) || isExpr(valueOrOptions) ? {} : valueOrOptions;

    const fieldNameOrExpr: string | firestore.Pipelines.Expr =
      isString(valueOrOptions) || isExpr(valueOrOptions)
        ? valueOrOptions
        : valueOrOptions.map;
    const mapExpr = fieldOrExpression(fieldNameOrExpr);
    this._validateUserData('replaceWith', mapExpr);

    const internalOptions: InternalReplaceWithStageOptions = {
      ...options,
      map: mapExpr,
    };
    return this._addStage(new ReplaceWith(internalOptions));
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
   * @param documents The number of documents to sample.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  sample(documents: number): Pipeline;

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
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  sample(options: firestore.Pipelines.SampleStageOptions): Pipeline;
  sample(
    documentsOrOptions: number | firestore.Pipelines.SampleStageOptions
  ): Pipeline {
    const options = isNumber(documentsOrOptions) ? {} : documentsOrOptions;

    let rate: number;
    let mode: 'documents' | 'percent';
    if (isNumber(documentsOrOptions)) {
      rate = documentsOrOptions;
      mode = 'documents';
    } else if (isNumber(documentsOrOptions.documents)) {
      rate = documentsOrOptions.documents;
      mode = 'documents';
    } else {
      rate = documentsOrOptions.percentage!;
      mode = 'percent';
    }

    const internalOptions: InternalSampleStageOptions = {
      ...options,
      rate,
      mode,
    };

    return this._addStage(new Sample(internalOptions));
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
  union(other: Pipeline): Pipeline;
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
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  union(options: firestore.Pipelines.UnionStageOptions): Pipeline;
  union(
    otherOrOptions: Pipeline | firestore.Pipelines.UnionStageOptions
  ): Pipeline {
    const options = isPipeline(otherOrOptions) ? {} : otherOrOptions;

    const otherPipeline: firestore.Pipelines.Pipeline = isPipeline(
      otherOrOptions
    )
      ? otherOrOptions
      : otherOrOptions.other;
    const normalizedOtherPipeline = otherPipeline as Pipeline;

    const internalOptions: InternalUnionStageOptions = {
      ...options,
      other: normalizedOtherPipeline,
    };
    return this._addStage(new Union(internalOptions));
  }

  /**
   * Produces a document for each element in an input array.
   *
   * For each previous stage document, this stage will emit zero or more augmented documents. The
   * input array specified by the `selectable` parameter, will emit an augmented document for each input array element. The input array element will
   * augment the previous stage document by setting the `alias` field  with the array element value.
   *
   * When `selectable` evaluates to a non-array value (ex: number, null, absent), then the stage becomes a no-op for
   * the current input document, returning it as is with the `alias` field absent.
   *
   * No documents are emitted when `selectable` evaluates to an empty array.
   *
   * Example:
   *
   * ```typescript
   * // Input:
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tags": [ "comedy", "space", "adventure" ], ... }
   *
   * // Emit a book document for each tag of the book.
   * firestore.pipeline().collection("books")
   *     .unnest(field("tags").as('tag'), 'tagIndex');
   *
   * // Output:
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "comedy", "tagIndex": 0, ... }
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "space", "tagIndex": 1, ... }
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "adventure", "tagIndex": 2, ... }
   * ```
   *
   * @param selectable A selectable expression defining the field to unnest and the alias to use for each un-nested element in the output documents.
   * @param indexField An optional string value specifying the field path to write the offset (starting at zero) into the array the un-nested element is from
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  unnest(
    selectable: firestore.Pipelines.Selectable,
    indexField?: string
  ): Pipeline;
  /**
   * Produces a document for each element in an input array.
   *
   * For each previous stage document, this stage will emit zero or more augmented documents. The
   * input array specified by the `selectable` parameter, will emit an augmented document for each input array element. The input array element will
   * augment the previous stage document by setting the `alias` field  with the array element value.
   *
   * When `selectable` evaluates to a non-array value (ex: number, null, absent), then the stage becomes a no-op for
   * the current input document, returning it as is with the `alias` field absent.
   *
   * No documents are emitted when `selectable` evaluates to an empty array.
   *
   * Example:
   *
   * ```typescript
   * // Input:
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tags": [ "comedy", "space", "adventure" ], ... }
   *
   * // Emit a book document for each tag of the book.
   * firestore.pipeline().collection("books")
   *     .unnest(field("tags").as('tag'), 'tagIndex');
   *
   * // Output:
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "comedy", "tagIndex": 0, ... }
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "space", "tagIndex": 1, ... }
   * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "adventure", "tagIndex": 2, ... }
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  unnest(options: firestore.Pipelines.UnnestStageOptions): Pipeline;
  unnest(
    selectableOrOptions:
      | firestore.Pipelines.Selectable
      | firestore.Pipelines.UnnestStageOptions,
    indexField?: string
  ): Pipeline {
    const options = isSelectable(selectableOrOptions)
      ? {}
      : selectableOrOptions;

    const selectable: firestore.Pipelines.Selectable = isSelectable(
      selectableOrOptions
    )
      ? selectableOrOptions
      : selectableOrOptions.selectable;
    const alias = selectable.alias;
    const expr = selectable.expr as Expr;

    const indexFieldName = isSelectable(selectableOrOptions)
      ? indexField
      : selectableOrOptions.indexField;
    const normalizedIndexField = indexFieldName
      ? field(indexFieldName)
      : undefined;

    const internalOptions: InternalUnnestStageOptions = {
      ...options,
      alias,
      expr,
      indexField: normalizedIndexField,
    };
    return this._addStage(new Unnest(internalOptions));
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
   * firestore.pipeline().collection("books")
   *     .sort(
   *         Ordering.of(field("rating")).descending(),
   *         Ordering.of(field("title"))  // Ascending order is the default
   *     );
   * ```
   *
   * @param ordering The first {@link Ordering} instance specifying the sorting criteria.
   * @param additionalOrderings Optional additional {@link Ordering} instances specifying the additional sorting criteria.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  sort(
    ordering: firestore.Pipelines.Ordering,
    ...additionalOrderings: firestore.Pipelines.Ordering[]
  ): Pipeline;
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
   * firestore.pipeline().collection("books")
   *     .sort(
   *         Ordering.of(field("rating")).descending(),
   *         Ordering.of(field("title"))  // Ascending order is the default
   *     );
   * ```
   *
   * @param options - An object that specifies required and optional parameters for the stage.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  sort(options: firestore.Pipelines.SortStageOptions): Pipeline;
  sort(
    orderingOrOptions:
      | firestore.Pipelines.Ordering
      | firestore.Pipelines.SortStageOptions,
    ...additionalOrderings: firestore.Pipelines.Ordering[]
  ): Pipeline {
    const options = isOrdering(orderingOrOptions) ? {} : orderingOrOptions;

    const orderings: Array<firestore.Pipelines.Ordering> = isOrdering(
      orderingOrOptions
    )
      ? [orderingOrOptions, ...additionalOrderings]
      : orderingOrOptions.orderings;
    const normalizedOrderings = orderings as Array<Ordering>;
    this._validateUserData('sort', normalizedOrderings);

    const internalOptions: InternalSortStageOptions = {
      ...options,
      orderings: normalizedOrderings,
    };

    return this._addStage(new Sort(internalOptions));
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
   *     .genericStage('where', [field('published').lt(1900)]) // Custom 'where' stage
   *     .select('title', 'author');
   * ```
   *
   * @param name - The unique name of the generic stage to add.
   * @param params - A list of parameters to configure the generic stage's behavior.
   * @param options - An object of key value pairs that specifies optional parameters for the stage.
   * @return A new {@code Pipeline} object with this stage appended to the stage list.
   */
  genericStage(
    name: string,
    params: unknown[],
    options?: {[key: string]: Expr | unknown}
  ): Pipeline {
    // Convert input values to Expressions.
    // We treat objects as mapValues and arrays as arrayValues,
    // this is unlike the default conversion for objects and arrays
    // passed to an expression.
    const expressionParams = params.map((value: unknown) => {
      if (value instanceof Expr) {
        return value;
      } else if (value instanceof AggregateFunction) {
        return value;
      } else if (isPlainObject(value)) {
        return _mapValue(value as Record<string, unknown>);
      } else {
        return constant(value);
      }
    });

    expressionParams.forEach(param => {
      if (hasUserData(param)) {
        param._validateUserData(!!this.db._settings.ignoreUndefinedProperties);
      }
    });
    return this._addStage(
      new GenericStage(name, expressionParams, options ?? {})
    );
  }

  /**
   * Executes this pipeline and returns a Promise to represent the asynchronous operation.
   *
   * <p>The returned Promise can be used to track the progress of the pipeline execution
   * and retrieve the results (or handle any errors) asynchronously.
   *
   * <p>The pipeline results are returned in a {@link PipelineSnapshot} object, which contains a list of
   * {@link PipelineResult} objects. Each {@link PipelineResult} typically represents a single key/value map that
   * has passed through all the stages of the pipeline, however this might differ depending on the stages involved
   * in the pipeline. For example:
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
   *     .where(gt(field('rating'), 4.5))
   *     .select('title', 'author', 'rating')
   *     .execute();
   * ```
   *
   * @param pipelineOptions - Optionally specify pipeline execution behavior.
   * @return A Promise representing the asynchronous pipeline execution.
   */
  execute(pipelineOptions?: PipelineOptions): Promise<PipelineSnapshot> {
    return this._execute(undefined, pipelineOptions).then(response => {
      const results = response.result || [];
      const executionTime = response.executionTime;

      return new PipelineSnapshot(this, results, executionTime);
    });
  }

  _execute(
    transactionOrReadTime?: Uint8Array | Timestamp | api.ITransactionOptions,
    pipelineOptions?: PipelineOptions
  ): Promise<PipelineResponse> {
    const util = new ExecutionUtil(this.db, this.db._serializer!);
    const structuredPipeline = this._toStructuredPipeline(pipelineOptions);
    return util
      ._getResponse(structuredPipeline, transactionOrReadTime)
      .then(result => result!);
  }

  _toStructuredPipeline(pipelineOptions?: PipelineOptions): StructuredPipeline {
    const structuredPipelineOptions = pipelineOptions ?? {};
    const optionsOverride = pipelineOptions?.customOptions ?? {};
    return new StructuredPipeline(
      this,
      structuredPipelineOptions,
      optionsOverride
    );
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
   *     .where(gt(field('rating'), 4.5))
   *     .select('title', 'author', 'rating')
   *     .stream()
   *     .on('data', (pipelineResult) => {})
   *     .on('end', () => {});
   * ```
   */
  stream(): NodeJS.ReadableStream {
    const util = new ExecutionUtil(this.db, this.db._serializer!);
    return util.stream(this);
  }

  _toProto(): api.IPipeline {
    const stages: IStage[] = this.stages.map(stage =>
      stage._toProto(this.db._serializer!)
    );
    return {stages};
  }

  /**
   * Validates user data for each expression in the expressionMap.
   * @param name Name of the calling function. Used for error messages when invalid user data is encountered.
   * @param val
   * @return the expressionMap argument.
   * @private
   */
  _validateUserData<
    T extends Map<string, HasUserData> | HasUserData[] | HasUserData,
  >(name: string, val: T): T {
    const ignoreUndefinedProperties =
      !!this.db._settings.ignoreUndefinedProperties;
    if (hasUserData(val)) {
      val._validateUserData(ignoreUndefinedProperties);
    } else if (Array.isArray(val)) {
      val.forEach(readableData => {
        readableData._validateUserData(ignoreUndefinedProperties);
      });
    } else {
      val.forEach(expr => expr._validateUserData(ignoreUndefinedProperties));
    }
    return val;
  }
}

function selectablesToMap(
  selectables: (firestore.Pipelines.Selectable | string)[]
): Map<string, Expr> {
  const result = new Map<string, Expr>();
  for (const selectable of selectables) {
    if (typeof selectable === 'string') {
      result.set(
        selectable as string,
        new Field(FieldPath.fromArgument(selectable))
      );
    } else if (selectable instanceof Field) {
      result.set((selectable as Field).fieldName(), selectable);
    } else if (selectable instanceof ExprWithAlias) {
      const expr = selectable as ExprWithAlias;
      result.set(expr.alias, expr.expr as unknown as Expr);
    } else {
      throw new Error('unexpected selectable: ' + JSON.stringify(selectable));
    }
  }
  return result;
}

function aggregateWithAliasToMap(
  aggregateWithAliases: firestore.Pipelines.AggregateWithAlias[]
): Map<string, AggregateFunction> {
  return aggregateWithAliases.reduce(
    (
      map: Map<string, AggregateFunction>,
      selectable: firestore.Pipelines.AggregateWithAlias
    ) => {
      map.set(selectable.alias, selectable.aggregate as AggregateFunction);
      return map;
    },
    new Map() as Map<string, AggregateFunction>
  );
}

/**
 * TODO(docs)
 */
export class PipelineSnapshot {
  private readonly _pipeline: Pipeline;
  private readonly _executionTime: Timestamp | undefined;
  private readonly _results: PipelineResult[];

  constructor(
    pipeline: Pipeline,
    results: PipelineResult[],
    executionTime?: Timestamp
  ) {
    this._pipeline = pipeline;
    this._executionTime = executionTime;
    this._results = results;
  }

  /**
   * The Pipeline on which you called `execute()` in order to get this
   * `PipelineSnapshot`.
   */
  get pipeline(): Pipeline {
    return this._pipeline;
  }

  /** An array of all the results in the `PipelineSnapshot`. */
  get results(): PipelineResult[] {
    return this._results;
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
}

/**
 * A PipelineResult contains data read from a Firestore Pipeline. The data can be extracted with the
 * {@link #data()} or {@link #get(String)} methods.
 *
 * <p>If the PipelineResult represents a non-document result, `ref` will return a undefined
 * value.
 */
export class PipelineResult implements firestore.Pipelines.PipelineResult {
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
    updateTime?: Timestamp
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
  data(): firestore.DocumentData | undefined {
    const fields = this._fieldsProto;

    if (fields === undefined) {
      return undefined;
    }

    const obj: firestore.DocumentData = {};
    for (const prop of Object.keys(fields)) {
      obj[prop] = this._serializer.decodeValue(fields[prop]);
    }
    return obj;
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
  isEqual(other: PipelineResult): boolean {
    return (
      this === other ||
      (isOptionalEqual(this.ref, other.ref) &&
        deepEqual(this._fieldsProto, other._fieldsProto))
    );
  }
}
