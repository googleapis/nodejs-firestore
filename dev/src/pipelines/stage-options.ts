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
import {DocumentReference} from '../reference/document-reference';
import {Expr, Field} from './expression';
import {Pipeline} from './pipelines';
import {isPlainObject} from '../util';

/**
 * Options defining how a Stage is evaluated.
 */
export type StageOptions = {
  /**
   * An escape hatch to set options not known at SDK build time. These values
   * will be passed directly to the Firestore backend and not used by the SDK.
   *
   * The option name will be used as provided. And must match the name
   * format used by the backend (hint: use a snake_case_name).
   *
   * Custom option values can be any type supported
   * by Firestore (for example: string, boolean, number, map, …). Value types
   * not known to the SDK will be rejected.
   *
   * Values specified in customOptions will take precedence over any options
   * with the same name set by the SDK.
   *
   * `customOptions` supports dot notation, if you want to override
   * a nested option.
   */
  customOptions?: {
    [name: string]: unknown;
  };
};

/**
 * Options defining how a CollectionStage is evaluated. See {@link PipelineSource.collection}.
 */
export type CollectionStageOptions = StageOptions & {
  /**
   * Name or reference to the collection that will be used as the Pipeline source.
   */
  collection: string | firestore.CollectionReference;
};

export function isCollectionStageOptions(
  val: unknown
): val is CollectionStageOptions {
  return isPlainObject(val) && 'collection' in val;
}

/**
 * Options defining how a CollectionGroupStage is evaluated. See {@link PipelineSource.collectionGroup}.
 */
export type CollectionGroupStageOptions = StageOptions & {
  /**
   * ID of the collection group to use as the Pipeline source.
   */
  collectionId: string;
};

/**
 * Options defining how a DatabaseStage is evaluated. See {@link PipelineSource.database}.
 */
export type DatabaseStageOptions = StageOptions & {};

/**
 * Options defining how a DocumentsStage is evaluated. See {@link PipelineSource.documents}.
 */
export type DocumentsStageOptions = StageOptions & {
  /**
   * An array of paths and DocumentReferences specifying the individual documents that will be the source of this pipeline.
   * The converters for these DocumentReferences will be ignored and not have an effect on this pipeline.
   * There must be at least one document specified in the array.
   */
  docs: Array<string | DocumentReference>;
};

/**
 * Options defining how an AddFieldsStage is evaluated. See {@link Pipeline.addFields}.
 */
export type AddFieldsStageOptions = StageOptions & {
  /**
   *  The fields to add to each document, specified as a {@link Selectable}.
   *  At least one field is required.
   */
  fields: firestore.Pipelines.Selectable[];
};

/**
 * Options defining how a RemoveFieldsStage is evaluated. See {@link Pipeline.removeFields}.
 */
export type RemoveFieldsStageOptions = StageOptions & {
  /**
   * The fields to remove from each document.
   */
  fields: Array<firestore.Pipelines.Field | string>;
};

/**
 * Options defining how a SelectStage is evaluated. See {@link Pipeline.select}.
 */
export type SelectStageOptions = StageOptions & {
  /**
   * The fields to include in the output documents, specified as {@link Selectable} expression
   * or as a string value indicating the field name.
   */
  selections: Array<firestore.Pipelines.Selectable | string>;
};

/**
 * Options defining how a WhereStage is evaluated. See {@link Pipeline.where}.
 */
export type WhereStageOptions = StageOptions & {
  /**
   * The {@link BooleanExpr} to apply as a filter for each input document to this stage.
   */
  condition: firestore.Pipelines.BooleanExpr;
};

/**
 * Options defining how an OffsetStage is evaluated. See {@link Pipeline.offset}.
 */
export type OffsetStageOptions = StageOptions & {
  /**
   * The number of documents to skip.
   */
  offset: number;
};

/**
 * Options defining how a LimitStage is evaluated. See {@link Pipeline.limit}.
 */
export type LimitStageOptions = StageOptions & {
  /**
   * The maximum number of documents to return.
   */
  limit: number;
};

/**
 * Options defining how a DistinctStage is evaluated. See {@link Pipeline.distinct}.
 */
export type DistinctStageOptions = StageOptions & {
  /**
   * The {@link Selectable} expressions or field names to consider when determining
   * distinct value combinations (groups).
   */
  groups: Array<string | firestore.Pipelines.Selectable>;
};

/**
 * Options defining how an AggregateStage is evaluated. See {@link Pipeline.aggregate}.
 */
export type AggregateStageOptions = StageOptions & {
  /**
   * The {@link AggregateWithAlias} values specifying aggregate operations to
   * perform on the input documents.
   */
  accumulators: firestore.Pipelines.AggregateWithAlias[];

  /**
   * The {@link Selectable} expressions or field names to consider when determining
   * distinct value combinations (groups), which will be aggregated over.
   */
  groups?: Array<string | firestore.Pipelines.Selectable>;
};

/**
 * Options defining how a FindNearestStage is evaluated. See {@link Pipeline.findNearest}.
 */
export type FindNearestStageOptions = StageOptions & {
  /**
   * Specifies the field on the source documents to which the vector distance will be computed against the query vector.
   */
  field: Field | string;
  /**
   * Specifies the query vector value, to which the vector distance will be computed.
   */
  vectorValue: firestore.VectorValue | number[];
  /**
   * Specifies how the distance is computed.
   */
  distanceMeasure: 'euclidean' | 'cosine' | 'dot_product';
  /**
   * The maximum number of documents to return from the FindNearest stage.
   */
  limit?: number;
  /**
   * If set, specifies the field on the output documents that will contain
   * the computed vector distance for the document. If not set, the computed
   * vector distance will not be returned.
   */
  distanceField?: string;
};

/**
 * Options defining how a ReplaceWithStage is evaluated. See {@link Pipeline.replaceWith}.
 */
export type ReplaceWithStageOptions = StageOptions & {
  /**
   * The name of a field that contains a map or an {@link Expr} that
   * evaluates to a map.
   */
  map: Expr | string;
};

/**
 * Options defining how a SampleStage is evaluated. See {@link Pipeline.findNearest}.
 */
export type SampleStageOptions = StageOptions &
  firestore.OneOf<{
    /**
     * If set, specifies the sample rate as a percentage of the
     * input documents.
     *
     * Cannot be set when `documents: number` is set.
     */
    percentage: number;
    /**
     * If set, specifies the sample rate as a total number of
     * documents to sample from the input documents.
     *
     * Cannot be set when `percentage: number` is set.
     */
    documents: number;
  }>;

/**
 * Options defining how a UnionStage is evaluated. See {@link Pipeline.union}.
 */
export type UnionStageOptions = StageOptions & {
  /**
   * Specifies the other Pipeline to union with.
   */
  other: Pipeline;
};

/**
 * Options defining how an UnnestStage is evaluated. See {@link Pipeline.findNearest}.
 */
export type UnnestStageOptions = StageOptions & {
  /**
   * Specifies the expression evaluating to an array of elements, which will be un-nested
   * into the field specified by `selectable.alias`.
   */
  selectable: firestore.Pipelines.Selectable;
  /**
   * If set, specifies the field on the output documents that will contain the
   * offset (starting at zero) that the element is from the original array.
   */
  indexField?: string;
};

/**
 * Options defining how a SortStage is evaluated. See {@link Pipeline.sort}.
 */
export type SortStageOptions = StageOptions & {
  /**
   * Orderings specify how the input documents are sorted.
   * One or more ordering are required.
   */
  orderings: firestore.Pipelines.Ordering[];
};
