/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/*!
 * Sentinel value for a field delete.
 *
 */
let DELETE_SENTINEL;

/*!
 * Sentinel value for a server timestamp.
 *
 */
let SERVER_TIMESTAMP_SENTINEL;

/**
 * Sentinel values that can be used when writing documents with set() or
 * update().
 *
 * @class
 */
class FieldValue {
  /**
   * @private
   * @hideconstructor
   */
  constructor() {}

  /**
   * Returns a sentinel used with update() to mark a field for deletion.
   *
   * @returns {*} The sentinel value to use in your objects.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   * let data = { a: 'b', c: 'd' };
   *
   * documentRef.set(data).then(() => {
   *   return documentRef.update({a: Firestore.FieldValue.delete()});
   * }).then(() => {
   *   // Document now only contains { c: 'd' }
   * });
   */
  static delete() {
    return DELETE_SENTINEL;
  }

  /**
   * Returns a sentinel used with set(), create() or update() to include a
   * server-generated timestamp in the written data.
   *
   * @returns {*} The sentinel value to use in your objects.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({
   *   time: Firestore.FieldValue.serverTimestamp()
   * }).then(() => {
   *   return documentRef.get();
   * }).then(doc => {
   *   console.log(`Server time set to ${doc.get('time')}`);
   * });
   */
  static serverTimestamp() {
    return SERVER_TIMESTAMP_SENTINEL;
  }

  /**
   * Returns true if this `FieldValue` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `FieldValue` is equal to the provided value.
   */
  isEqual(other) {
    return this === other;
  }
}

/**
 * An internal interface shared by all field transforms.
 *
 * A 'FieldTransform` subclass should implement '.includeInDocumentMask',
 * '.includeInDocumentTransform' and 'toProto' (if '.includeInDocumentTransform'
 * is 'true').
 *
 * @private
 * @abstract
 */
class FieldTransform extends FieldValue {}

/**
 * A transform that deletes a field from a Firestore document.
 *
 * @private
 */
class DeleteTransform extends FieldTransform {
  /**
   * Deletes are included in document masks.
   *
   * @private
   */
  get includeInDocumentMask() {
    return true;
  }

  /**
   * Deletes are are omitted from document transforms.
   *
   * @private
   */
  get includeInDocumentTransform() {
    return false;
  }
}

DELETE_SENTINEL = new DeleteTransform();

/**
 * A transform that sets a field to the Firestore server time.
 *
 * @private
 */
class ServerTimestampTransform extends FieldTransform {
  /**
   * Server timestamps are omitted from document masks.
   *
   * @private
   */
  get includeInDocumentMask() {
    return false;
  }

  /**
   * Server timestamps are included in document transforms.
   *
   * @private
   */
  get includeInDocumentTransform() {
    return true;
  }

  /**
   * The proto representation for this field transform.
   *
   * @private
   * @param {FieldPath} fieldPath The field path to apply this transformation
   * to.
   * @return {object} The 'FieldTransform' proto message.
   */
  toProto(fieldPath) {
    return {
      fieldPath: fieldPath.formattedName,
      setToServerValue: 'REQUEST_TIME',
    };
  }
}

SERVER_TIMESTAMP_SENTINEL = new ServerTimestampTransform();

module.exports = {
  FieldValue: FieldValue,
  FieldTransform: FieldTransform,
  DeleteTransform: DeleteTransform,
  ServerTimestampTransform: ServerTimestampTransform,
};
