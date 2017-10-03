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
 * A Firestore query.
 *
 * @property {Object} select
 *   The projection to return.
 *
 *   This object should have the same structure as [Projection]{@link google.firestore.v1beta1.Projection}
 *
 * @property {Object[]} from
 *   The collections to query.
 *
 *   This object should have the same structure as [CollectionSelector]{@link google.firestore.v1beta1.CollectionSelector}
 *
 * @property {Object} where
 *   The filter to apply.
 *
 *   This object should have the same structure as [Filter]{@link google.firestore.v1beta1.Filter}
 *
 * @property {Object[]} orderBy
 *   The order to apply to the query results.
 *
 *   Firestore guarantees a stable ordering through the following rules:
 *
 *    * Any field required to appear in `order_by`, that is not already
 *      specified in `order_by`, is appended to the order in field name order
 *      by default.
 *    * If an order on `__name__` is not specified, it is appended by default.
 *
 *   Fields are appended with the same sort direction as the last order
 *   specified, or 'ASCENDING' if no order was specified. For example:
 *
 *    * `SELECT * FROM Foo ORDER BY A` becomes
 *      `SELECT * FROM Foo ORDER BY A, __name__`
 *    * `SELECT * FROM Foo ORDER BY A DESC` becomes
 *      `SELECT * FROM Foo ORDER BY A DESC, __name__ DESC`
 *    * `SELECT * FROM Foo WHERE A > 1` becomes
 *      `SELECT * FROM Foo WHERE A > 1 ORDER BY A, __name__`
 *
 *   This object should have the same structure as [Order]{@link google.firestore.v1beta1.Order}
 *
 * @property {Object} startAt
 *   A starting point for the query results.
 *
 *   This object should have the same structure as [Cursor]{@link google.firestore.v1beta1.Cursor}
 *
 * @property {Object} endAt
 *   A end point for the query results.
 *
 *   This object should have the same structure as [Cursor]{@link google.firestore.v1beta1.Cursor}
 *
 * @property {number} offset
 *   The number of results to skip.
 *
 *   Applies before limit, but after all other constraints. Must be >= 0 if
 *   specified.
 *
 * @property {Object} limit
 *   The maximum number of results to return.
 *
 *   Applies after all other constraints.
 *   Must be >= 0 if specified.
 *
 *   This object should have the same structure as [Int32Value]{@link google.protobuf.Int32Value}
 *
 * @typedef StructuredQuery
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.StructuredQuery definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
 */
var StructuredQuery = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * A selection of a collection, such as `messages as m1`.
   *
   * @property {string} collectionId
   *   The collection ID.
   *   When set, selects only collections with this ID.
   *
   * @property {boolean} allDescendants
   *   When false, selects only collections that are immediate children of
   *   the `parent` specified in the containing `RunQueryRequest`.
   *   When true, selects all descendant collections.
   *
   * @typedef CollectionSelector
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.StructuredQuery.CollectionSelector definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
   */
  CollectionSelector: {
    // This is for documentation. Actual contents will be loaded by gRPC.
  },

  /**
   * A filter.
   *
   * @property {Object} compositeFilter
   *   A composite filter.
   *
   *   This object should have the same structure as [CompositeFilter]{@link google.firestore.v1beta1.CompositeFilter}
   *
   * @property {Object} fieldFilter
   *   A filter on a document field.
   *
   *   This object should have the same structure as [FieldFilter]{@link google.firestore.v1beta1.FieldFilter}
   *
   * @property {Object} unaryFilter
   *   A filter that takes exactly one argument.
   *
   *   This object should have the same structure as [UnaryFilter]{@link google.firestore.v1beta1.UnaryFilter}
   *
   * @typedef Filter
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.StructuredQuery.Filter definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
   */
  Filter: {
    // This is for documentation. Actual contents will be loaded by gRPC.
  },

  /**
   * A filter that merges multiple other filters using the given operator.
   *
   * @property {number} op
   *   The operator for combining multiple filters.
   *
   *   The number should be among the values of [Operator]{@link google.firestore.v1beta1.Operator}
   *
   * @property {Object[]} filters
   *   The list of filters to combine.
   *   Must contain at least one filter.
   *
   *   This object should have the same structure as [Filter]{@link google.firestore.v1beta1.Filter}
   *
   * @typedef CompositeFilter
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.StructuredQuery.CompositeFilter definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
   */
  CompositeFilter: {
    // This is for documentation. Actual contents will be loaded by gRPC.

    /**
     * A composite filter operator.
     *
     * @enum {number}
     */
    Operator: {

      /**
       * Unspecified. This value must not be used.
       */
      OPERATOR_UNSPECIFIED: 0,

      /**
       * The results are required to satisfy each of the combined filters.
       */
      AND: 1
    }
  },

  /**
   * A filter on a specific field.
   *
   * @property {Object} field
   *   The field to filter by.
   *
   *   This object should have the same structure as [FieldReference]{@link google.firestore.v1beta1.FieldReference}
   *
   * @property {number} op
   *   The operator to filter by.
   *
   *   The number should be among the values of [Operator]{@link google.firestore.v1beta1.Operator}
   *
   * @property {Object} value
   *   The value to compare to.
   *
   *   This object should have the same structure as [Value]{@link google.firestore.v1beta1.Value}
   *
   * @typedef FieldFilter
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.StructuredQuery.FieldFilter definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
   */
  FieldFilter: {
    // This is for documentation. Actual contents will be loaded by gRPC.

    /**
     * A field filter operator.
     *
     * @enum {number}
     */
    Operator: {

      /**
       * Unspecified. This value must not be used.
       */
      OPERATOR_UNSPECIFIED: 0,

      /**
       * Less than. Requires that the field come first in `order_by`.
       */
      LESS_THAN: 1,

      /**
       * Less than or equal. Requires that the field come first in `order_by`.
       */
      LESS_THAN_OR_EQUAL: 2,

      /**
       * Greater than. Requires that the field come first in `order_by`.
       */
      GREATER_THAN: 3,

      /**
       * Greater than or equal. Requires that the field come first in
       * `order_by`.
       */
      GREATER_THAN_OR_EQUAL: 4,

      /**
       * Equal.
       */
      EQUAL: 5
    }
  },

  /**
   * A filter with a single operand.
   *
   * @property {number} op
   *   The unary operator to apply.
   *
   *   The number should be among the values of [Operator]{@link google.firestore.v1beta1.Operator}
   *
   * @property {Object} field
   *   The field to which to apply the operator.
   *
   *   This object should have the same structure as [FieldReference]{@link google.firestore.v1beta1.FieldReference}
   *
   * @typedef UnaryFilter
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.StructuredQuery.UnaryFilter definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
   */
  UnaryFilter: {
    // This is for documentation. Actual contents will be loaded by gRPC.

    /**
     * A unary operator.
     *
     * @enum {number}
     */
    Operator: {

      /**
       * Unspecified. This value must not be used.
       */
      OPERATOR_UNSPECIFIED: 0,

      /**
       * Test if a field is equal to NaN.
       */
      IS_NAN: 2,

      /**
       * Test if an exprestion evaluates to Null.
       */
      IS_NULL: 3
    }
  },

  /**
   * An order on a field.
   *
   * @property {Object} field
   *   The field to order by.
   *
   *   This object should have the same structure as [FieldReference]{@link google.firestore.v1beta1.FieldReference}
   *
   * @property {number} direction
   *   The direction to order by. Defaults to `ASCENDING`.
   *
   *   The number should be among the values of [Direction]{@link google.firestore.v1beta1.Direction}
   *
   * @typedef Order
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.StructuredQuery.Order definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
   */
  Order: {
    // This is for documentation. Actual contents will be loaded by gRPC.
  },

  /**
   * A reference to a field, such as `max(messages.time) as max_time`.
   *
   * @property {string} fieldPath
   *
   * @typedef FieldReference
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.StructuredQuery.FieldReference definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
   */
  FieldReference: {
    // This is for documentation. Actual contents will be loaded by gRPC.
  },

  /**
   * The projection of document's fields to return.
   *
   * @property {Object[]} fields
   *   The fields to return.
   *
   *   If empty, all fields are returned. To only return the name
   *   of the document, use `['__name__']`.
   *
   *   This object should have the same structure as [FieldReference]{@link google.firestore.v1beta1.FieldReference}
   *
   * @typedef Projection
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.StructuredQuery.Projection definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
   */
  Projection: {
    // This is for documentation. Actual contents will be loaded by gRPC.
  },

  /**
   * A sort direction.
   *
   * @enum {number}
   */
  Direction: {

    /**
     * Unspecified.
     */
    DIRECTION_UNSPECIFIED: 0,

    /**
     * Ascending.
     */
    ASCENDING: 1,

    /**
     * Descending.
     */
    DESCENDING: 2
  }
};

/**
 * A position in a query result set.
 *
 * @property {Object[]} values
 *   The values that represent a position, in the order they appear in
 *   the order by clause of a query.
 *
 *   Can contain fewer values than specified in the order by clause.
 *
 *   This object should have the same structure as [Value]{@link google.firestore.v1beta1.Value}
 *
 * @property {boolean} before
 *   If the position is just before or just after the given values, relative
 *   to the sort order defined by the query.
 *
 * @typedef Cursor
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.Cursor definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/query.proto}
 */
var Cursor = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};