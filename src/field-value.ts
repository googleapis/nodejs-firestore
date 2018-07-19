/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import * as api from '../protos/firestore_proto_api';

/**
 * Sentinel values that can be used when writing documents with set() or
 * update().
 *
 * @class
 */
export class FieldValue {
  /**
   * @private
   * @hideconstructor
   */
  constructor() {}

  /**
   * Returns a sentinel used with update() to mark a field for deletion.
   *
   * @returns {FieldValue} The sentinel value to use in your objects.
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
  static delete(): FieldValue {
    return DeleteTransform.DELETE_SENTINEL;
  }

  /**
   * Returns a sentinel used with set(), create() or update() to include a
   * server-generated timestamp in the written data.
   *
   * @returns {FieldValue} The sentinel value to use in your objects.
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
  static serverTimestamp(): FieldValue {
    return ServerTimestampTransform.SERVER_TIMESTAMP_SENTINEL;
  }

  /**
   * Returns true if this `FieldValue` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `FieldValue` is equal to the provided value.
   */
  isEqual(other: any): boolean {
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
export abstract class FieldTransform extends FieldValue {
  /** Whether this FieldTransform should be included in the document mask. */
  abstract get includeInDocumentMask(): boolean;

  /**
   * Whether this FieldTransform should be included in the list of document
   * transforms.
   */
  abstract get includeInDocumentTransform(): boolean;
}

/**
 * A transform that deletes a field from a Firestore document.
 *
 * @private
 */
export class DeleteTransform extends FieldTransform {
  /**
   * Sentinel value for a field delete.
   *
   * @private
   */
  static DELETE_SENTINEL = new DeleteTransform();

  private constructor() {
    super();
  }

  /**
   * Deletes are included in document masks.
   *
   * @private
   */
  get includeInDocumentMask(): true {
    return true;
  }

  /**
   * Deletes are are omitted from document transforms.
   *
   * @private
   */
  get includeInDocumentTransform(): false {
    return false;
  }
}

/**
 * A transform that sets a field to the Firestore server time.
 *
 * @private
 */
export class ServerTimestampTransform extends FieldTransform {
  /**
   * Sentinel value for a server timestamp.
   *
   * @private
   */
  static SERVER_TIMESTAMP_SENTINEL = new ServerTimestampTransform();

  private constructor() {
    super();
  }

  /**
   * Server timestamps are omitted from document masks.
   *
   * @private
   */
  get includeInDocumentMask(): false {
    return false;
  }

  /**
   * Server timestamps are included in document transforms.
   *
   * @private
   */
  get includeInDocumentTransform(): true {
    return true;
  }

  /**
   * The proto representation for this field transform.
   *
   * @private
   * @param fieldPath - The field path to apply this transformation to.
   * @return The 'FieldTransform' proto message.
   */
  toProto(fieldPath): api.FieldTransform {
    return {
      fieldPath: fieldPath.formattedName,
      setToServerValue: 'REQUEST_TIME',
    };
  }
}
