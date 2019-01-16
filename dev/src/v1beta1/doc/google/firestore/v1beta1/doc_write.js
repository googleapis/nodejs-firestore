// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Note: this file is purely for documentation. Any contents are not expected
// to be loaded as the JS file.

/**
 * A write on a document.
 *
 * @property {Object} update
 *   A document to write.
 *
 *   This object should have the same structure as [Document]{@link
 * google.firestore.v1beta1.Document}
 *
 * @property {string} delete
 *   A document name to delete. In the format:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *
 * @property {Object} transform
 *   Applies a tranformation to a document.
 *   At most one `transform` per document is allowed in a given request.
 *   An `update` cannot follow a `transform` on the same document in a given
 *   request.
 *
 *   This object should have the same structure as [DocumentTransform]{@link
 * google.firestore.v1beta1.DocumentTransform}
 *
 * @property {Object} updateMask
 *   The fields to update in this write.
 *
 *   This field can be set only when the operation is `update`.
 *   If the mask is not set for an `update` and the document exists, any
 *   existing data will be overwritten.
 *   If the mask is set and the document on the server has fields not covered by
 *   the mask, they are left unchanged.
 *   Fields referenced in the mask, but not present in the input document, are
 *   deleted from the document on the server.
 *   The field paths in this mask must not contain a reserved field name.
 *
 *   This object should have the same structure as [DocumentMask]{@link
 * google.firestore.v1beta1.DocumentMask}
 *
 * @property {Object} currentDocument
 *   An optional precondition on the document.
 *
 *   The write will fail if this is set and not met by the target document.
 *
 *   This object should have the same structure as [Precondition]{@link
 * google.firestore.v1beta1.Precondition}
 *
 * @typedef Write
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.Write definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/write.proto}
 */
const Write = {
    // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A transformation of a document.
 *
 * @property {string} document
 *   The name of the document to transform.
 *
 * @property {Object[]} fieldTransforms
 *   The list of transformations to apply to the fields of the document, in
 *   order.
 *   This must not be empty.
 *
 *   This object should have the same structure as [FieldTransform]{@link
 * google.firestore.v1beta1.FieldTransform}
 *
 * @typedef DocumentTransform
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.DocumentTransform definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/write.proto}
 */
const DocumentTransform = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * A transformation of a field of the document.
   *
   * @property {string} fieldPath
   *   The path of the field. See Document.fields for the field path syntax
   *   reference.
   *
   * @property {number} setToServerValue
   *   Sets the field to the given server value.
   *
   *   The number should be among the values of [ServerValue]{@link
   * google.firestore.v1beta1.ServerValue}
   *
   * @property {Object} increment
   *   Adds the given value to the field's current value.
   *
   *   This must be an integer or a double value.
   *   If the field is not an integer or double, or if the field does not yet
   *   exist, the transformation will set the field to the given value.
   *   If either of the given value or the current field value are doubles,
   *   both values will be interpreted as doubles. Double arithmetic and
   *   representation of double values follow IEEE 754 semantics.
   *   If there is positive/negative integer overflow, the field is resolved
   *   to the largest magnitude positive/negative integer.
   *
   *   This object should have the same structure as [Value]{@link
   * google.firestore.v1beta1.Value}
   *
   * @property {Object} maximum
   *   Sets the field to the maximum of its current value and the given value.
   *
   *   This must be an integer or a double value.
   *   If the field is not an integer or double, or if the field does not yet
   *   exist, the transformation will set the field to the given value.
   *   If a maximum operation is applied where the field and the input value
   *   are of mixed types (that is - one is an integer and one is a double)
   *   the field takes on the type of the larger operand. If the operands are
   *   equivalent (e.g. 3 and 3.0), the field does not change.
   *   0, 0.0, and -0.0 are all zero. The maximum of a zero stored value and
   *   zero input value is always the stored value.
   *   The maximum of any numeric value x and NaN is NaN.
   *
   *   This object should have the same structure as [Value]{@link
   * google.firestore.v1beta1.Value}
   *
   * @property {Object} minimum
   *   Sets the field to the minimum of its current value and the given value.
   *
   *   This must be an integer or a double value.
   *   If the field is not an integer or double, or if the field does not yet
   *   exist, the transformation will set the field to the input value.
   *   If a minimum operation is applied where the field and the input value
   *   are of mixed types (that is - one is an integer and one is a double)
   *   the field takes on the type of the smaller operand. If the operands are
   *   equivalent (e.g. 3 and 3.0), the field does not change.
   *   0, 0.0, and -0.0 are all zero. The minimum of a zero stored value and
   *   zero input value is always the stored value.
   *   The minimum of any numeric value x and NaN is NaN.
   *
   *   This object should have the same structure as [Value]{@link
   * google.firestore.v1beta1.Value}
   *
   * @property {Object} appendMissingElements
   *   Append the given elements in order if they are not already present in
   *   the current field value.
   *   If the field is not an array, or if the field does not yet exist, it is
   *   first set to the empty array.
   *
   *   Equivalent numbers of different types (e.g. 3L and 3.0) are
   *   considered equal when checking if a value is missing.
   *   NaN is equal to NaN, and Null is equal to Null.
   *   If the input contains multiple equivalent values, only the first will
   *   be considered.
   *
   *   The corresponding transform_result will be the null value.
   *
   *   This object should have the same structure as [ArrayValue]{@link
   * google.firestore.v1beta1.ArrayValue}
   *
   * @property {Object} removeAllFromArray
   *   Remove all of the given elements from the array in the field.
   *   If the field is not an array, or if the field does not yet exist, it is
   *   set to the empty array.
   *
   *   Equivalent numbers of the different types (e.g. 3L and 3.0) are
   *   considered equal when deciding whether an element should be removed.
   *   NaN is equal to NaN, and Null is equal to Null.
   *   This will remove all equivalent values if there are duplicates.
   *
   *   The corresponding transform_result will be the null value.
   *
   *   This object should have the same structure as [ArrayValue]{@link
   * google.firestore.v1beta1.ArrayValue}
   *
   * @typedef FieldTransform
   * @memberof google.firestore.v1beta1
   * @see [google.firestore.v1beta1.DocumentTransform.FieldTransform definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/write.proto}
   */
  FieldTransform: {
    // This is for documentation. Actual contents will be loaded by gRPC.

    /**
     * A value that is calculated by the server.
     *
     * @enum {number}
     * @memberof google.firestore.v1beta1
     */
    ServerValue: {

      /**
       * Unspecified. This value must not be used.
       */
      SERVER_VALUE_UNSPECIFIED: 0,

      /**
       * The time at which the server processed the request, with millisecond
       * precision.
       */
      REQUEST_TIME: 1
    }
  }
};

/**
 * The result of applying a write.
 *
 * @property {Object} updateTime
 *   The last update time of the document after applying the write. Not set
 *   after a `delete`.
 *
 *   If the write did not actually change the document, this will be the
 *   previous update_time.
 *
 *   This object should have the same structure as [Timestamp]{@link
 * google.protobuf.Timestamp}
 *
 * @property {Object[]} transformResults
 *   The results of applying each DocumentTransform.FieldTransform, in the
 *   same order.
 *
 *   This object should have the same structure as [Value]{@link
 * google.firestore.v1beta1.Value}
 *
 * @typedef WriteResult
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.WriteResult definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/write.proto}
 */
const WriteResult = {
    // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A Document has changed.
 *
 * May be the result of multiple writes, including deletes, that
 * ultimately resulted in a new value for the Document.
 *
 * Multiple DocumentChange messages may be returned for the same logical
 * change, if multiple targets are affected.
 *
 * @property {Object} document
 *   The new state of the Document.
 *
 *   If `mask` is set, contains only fields that were updated or added.
 *
 *   This object should have the same structure as [Document]{@link
 * google.firestore.v1beta1.Document}
 *
 * @property {number[]} targetIds
 *   A set of target IDs of targets that match this document.
 *
 * @property {number[]} removedTargetIds
 *   A set of target IDs for targets that no longer match this document.
 *
 * @typedef DocumentChange
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.DocumentChange definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/write.proto}
 */
const DocumentChange = {
    // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A Document has been deleted.
 *
 * May be the result of multiple writes, including updates, the
 * last of which deleted the Document.
 *
 * Multiple DocumentDelete messages may be returned for the same logical
 * delete, if multiple targets are affected.
 *
 * @property {string} document
 *   The resource name of the Document that was deleted.
 *
 * @property {number[]} removedTargetIds
 *   A set of target IDs for targets that previously matched this entity.
 *
 * @property {Object} readTime
 *   The read timestamp at which the delete was observed.
 *
 *   Greater or equal to the `commit_time` of the delete.
 *
 *   This object should have the same structure as [Timestamp]{@link
 * google.protobuf.Timestamp}
 *
 * @typedef DocumentDelete
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.DocumentDelete definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/write.proto}
 */
const DocumentDelete = {
    // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A Document has been removed from the view of the targets.
 *
 * Sent if the document is no longer relevant to a target and is out of view.
 * Can be sent instead of a DocumentDelete or a DocumentChange if the server
 * can not send the new value of the document.
 *
 * Multiple DocumentRemove messages may be returned for the same logical
 * write or delete, if multiple targets are affected.
 *
 * @property {string} document
 *   The resource name of the Document that has gone out of view.
 *
 * @property {number[]} removedTargetIds
 *   A set of target IDs for targets that previously matched this document.
 *
 * @property {Object} readTime
 *   The read timestamp at which the remove was observed.
 *
 *   Greater or equal to the `commit_time` of the change/delete/remove.
 *
 *   This object should have the same structure as [Timestamp]{@link
 * google.protobuf.Timestamp}
 *
 * @typedef DocumentRemove
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.DocumentRemove definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/write.proto}
 */
const DocumentRemove = {
    // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A digest of all the documents that match a given target.
 *
 * @property {number} targetId
 *   The target ID to which this filter applies.
 *
 * @property {number} count
 *   The total count of documents that match target_id.
 *
 *   If different from the count of documents in the client that match, the
 *   client must manually determine which documents no longer match the target.
 *
 * @typedef ExistenceFilter
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.ExistenceFilter definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/write.proto}
 */
const ExistenceFilter = {
    // This is for documentation. Actual contents will be loaded by gRPC.
};