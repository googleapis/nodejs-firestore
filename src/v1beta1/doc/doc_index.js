/*
 * Copyright 2017, Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Note: this file is purely for documentation. Any contents are not expected
 * to be loaded as the JS file.
 */

/**
 * A field of an index.
 *
 * @property {string} fieldPath
 *   The path of the field. Must match the field path specification described
 *   by {@link google.firestore.v1beta1.Document.fields}.
 *   Special field path `__name__` may be used by itself or at the end of a
 *   path. `__type__` may be used only at the end of path.
 *
 * @property {number} mode
 *   The field's mode.
 *
 *   The number should be among the values of [Mode]{@link Mode}
 *
 * @class
 * @see [google.firestore.admin.v1beta1.IndexField definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1beta1/index.proto}
 */
var IndexField = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * The mode determines how a field is indexed.
   *
   * @enum {number}
   */
  Mode: {

    /**
     * The mode is unspecified.
     */
    MODE_UNSPECIFIED: 0,

    /**
     * The field's values are indexed so as to support sequencing in
     * ascending order and also query by <, >, <=, >=, and =.
     */
    ASCENDING: 2,

    /**
     * The field's values are indexed so as to support sequencing in
     * descending order and also query by <, >, <=, >=, and =.
     */
    DESCENDING: 3
  }
};

/**
 * An index definition.
 *
 * @property {string} name
 *   The resource name of the index.
 *
 * @property {string} collectionId
 *   The collection ID to which this index applies. Required.
 *
 * @property {Object[]} fields
 *   The fields to index.
 *
 *   This object should have the same structure as [IndexField]{@link IndexField}
 *
 * @property {number} state
 *   The state of the index.
 *   The state is read-only.
 *   @OutputOnly
 *
 *   The number should be among the values of [State]{@link State}
 *
 * @class
 * @see [google.firestore.admin.v1beta1.Index definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1beta1/index.proto}
 */
var Index = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * The state of an index. During index creation, an index will be in the
   * `CREATING` state. If the index is created successfully, it will transition
   * to the `READY` state. If the index is not able to be created, it will
   * transition to the `ERROR` state.
   *
   * @enum {number}
   */
  State: {

    /**
     * The state is unspecified.
     */
    STATE_UNSPECIFIED: 0,

    /**
     * The index is being created.
     * There is an active long-running operation for the index.
     * The index is updated when writing a document.
     * Some index data may exist.
     */
    CREATING: 3,

    /**
     * The index is ready to be used.
     * The index is updated when writing a document.
     * The index is fully populated from all stored documents it applies to.
     */
    READY: 2,

    /**
     * The index was being created, but something went wrong.
     * There is no active long-running operation for the index,
     * and the most recently finished long-running operation failed.
     * The index is not updated when writing a document.
     * Some index data may exist.
     */
    ERROR: 5
  }
};