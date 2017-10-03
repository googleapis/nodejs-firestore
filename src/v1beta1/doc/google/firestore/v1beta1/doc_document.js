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
 * A Firestore document.
 *
 * Must not exceed 1 MiB - 4 bytes.
 *
 * @property {string} name
 *   The resource name of the document, for example
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *
 * @property {Object.<string, Object>} fields
 *   The document's fields.
 *
 *   The map keys represent field names.
 *
 *   A simple field name contains only characters `a` to `z`, `A` to `Z`,
 *   `0` to `9`, or `_`, and must not start with `0` to `9` or `_`. For example,
 *   `foo_bar_17`.
 *
 *   Field names matching the regular expression `__.*__` are reserved. Reserved
 *   field names are forbidden except in certain documented contexts. The map
 *   keys, represented as UTF-8, must not exceed 1,500 bytes and cannot be
 *   empty.
 *
 *   Field paths may be used in other contexts to refer to structured fields
 *   defined here. For `map_value`, the field path is represented by the simple
 *   or quoted field names of the containing fields, delimited by `.`. For
 *   example, the structured field
 *   `"foo" : { map_value: { "x&y" : { string_value: "hello" }}}` would be
 *   represented by the field path `foo.x&y`.
 *
 *   Within a field path, a quoted field name starts and ends with `` ` `` and
 *   may contain any character. Some characters, including `` ` ``, must be
 *   escaped using a `\`. For example, `` `x&y` `` represents `x&y` and
 *   `` `bak\`tik` `` represents `` bak`tik ``.
 *
 * @property {Object} createTime
 *   Output only. The time at which the document was created.
 *
 *   This value increases monotonically when a document is deleted then
 *   recreated. It can also be compared to values from other documents and
 *   the `read_time` of a query.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} updateTime
 *   Output only. The time at which the document was last changed.
 *
 *   This value is initally set to the `create_time` then increases
 *   monotonically with each change to the document. It can also be
 *   compared to values from other documents and the `read_time` of a query.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef Document
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.Document definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/document.proto}
 */
var Document = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A message that can hold any of the supported value types.
 *
 * @property {number} nullValue
 *   A null value.
 *
 *   The number should be among the values of [NullValue]{@link google.protobuf.NullValue}
 *
 * @property {boolean} booleanValue
 *   A boolean value.
 *
 * @property {number} integerValue
 *   An integer value.
 *
 * @property {number} doubleValue
 *   A double value.
 *
 * @property {Object} timestampValue
 *   A timestamp value.
 *
 *   Precise only to microseconds. When stored, any additional precision is
 *   rounded down.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {string} stringValue
 *   A string value.
 *
 *   The string, represented as UTF-8, must not exceed 1 MiB - 89 bytes.
 *   Only the first 1,500 bytes of the UTF-8 representation are considered by
 *   queries.
 *
 * @property {string} bytesValue
 *   A bytes value.
 *
 *   Must not exceed 1 MiB - 89 bytes.
 *   Only the first 1,500 bytes are considered by queries.
 *
 * @property {string} referenceValue
 *   A reference to a document. For example:
 *   `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
 *
 * @property {Object} geoPointValue
 *   A geo point value representing a point on the surface of Earth.
 *
 *   This object should have the same structure as [LatLng]{@link google.type.LatLng}
 *
 * @property {Object} arrayValue
 *   An array value.
 *
 *   Cannot contain another array value.
 *
 *   This object should have the same structure as [ArrayValue]{@link google.firestore.v1beta1.ArrayValue}
 *
 * @property {Object} mapValue
 *   A map value.
 *
 *   This object should have the same structure as [MapValue]{@link google.firestore.v1beta1.MapValue}
 *
 * @typedef Value
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.Value definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/document.proto}
 */
var Value = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * An array value.
 *
 * @property {Object[]} values
 *   Values in the array.
 *
 *   This object should have the same structure as [Value]{@link google.firestore.v1beta1.Value}
 *
 * @typedef ArrayValue
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.ArrayValue definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/document.proto}
 */
var ArrayValue = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A map value.
 *
 * @property {Object.<string, Object>} fields
 *   The map's fields.
 *
 *   The map keys represent field names. Field names matching the regular
 *   expression `__.*__` are reserved. Reserved field names are forbidden except
 *   in certain documented contexts. The map keys, represented as UTF-8, must
 *   not exceed 1,500 bytes and cannot be empty.
 *
 * @typedef MapValue
 * @memberof google.firestore.v1beta1
 * @see [google.firestore.v1beta1.MapValue definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/firestore/v1beta1/document.proto}
 */
var MapValue = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};