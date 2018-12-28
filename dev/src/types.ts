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

import {google} from '../protos/firestore_proto_api';
import {FieldPath} from './path';
import {Timestamp} from './timestamp';

import api = google.firestore.v1beta1;

/**
 * A union of all of the standard JS types, useful for cases where the type is
 * unknown. Unlike "any" this doesn't lose all type-safety, since the consuming
 * code must still cast to a particular type before using it.
 */
export type AnyJs = null|undefined|boolean|number|string|object;

// tslint:disable-next-line:no-any
export type AnyDuringMigration = any;

// A map in the format of the Proto API
export type ApiMapValue = {
  [k: string]: google.firestore.v1beta1.IValue
};

/**
 * @private
 * JavaScript input from the API layer.
 */
// tslint:disable-next-line:no-any
export type UserInput = any;

// tslint:disable-next-line:no-any
export type GapicClient = any;

export class GrpcError extends Error {
  code?: number;
}

/**
 * Settings used to directly configure a `Firestore` instance.
 */
export interface Settings {
  /**
   * The Firestore Project ID. Can be omitted in environments that support
   * `Application Default Credentials` {@see https://cloud.google.com/docs/authentication}
   */
  projectId?: string;

  /**
   * Local file containing the Service Account credentials. Can be omitted
   * in environments that support `Application Default Credentials`
   * {@see https://cloud.google.com/docs/authentication}
   */
  keyFilename?: string;

  /**
   * Enables the use of `Timestamp`s for timestamp fields in
   * `DocumentSnapshot`s.
   *
   * Currently, Firestore returns timestamp fields as `Date` but `Date` only
   * supports millisecond precision, which leads to truncation and causes
   * unexpected behavior when using a timestamp from a snapshot as a part
   * of a subsequent query.
   *
   * Setting `timestampsInSnapshots` to true will cause Firestore to return
   * `Timestamp` values instead of `Date` avoiding this kind of problem. To
   * make this work you must also change any code that uses `Date` to use
   * `Timestamp` instead.
   *
   * NOTE: in the future `timestampsInSnapshots: true` will become the
   * default and this option will be removed so you should change your code to
   * use `Timestamp` now and opt-in to this new behavior as soon as you can.
   */
  timestampsInSnapshots?: boolean;

  // tslint:disable-next-line:no-any
  [key: string]: any;  // Accept other properties, such as GRPC settings.
}

/**
 * Document data (for use with `DocumentReference.set()`) consists of fields
 * mapped to values.
 */
export type DocumentData = {
  [field: string]: UserInput
};

/**
 * Update data (for use with `DocumentReference.update()`) consists of field
 * paths (e.g. 'foo' or 'foo.baz') mapped to values. Fields that contain dots
 * reference nested fields within the document.
 */
export type UpdateData = {
  [fieldPath: string]: UserInput
};

/**
 * An options object that configures conditional behavior of `update()` and
 * `delete()` calls in `DocumentReference`, `WriteBatch`, and `Transaction`.
 * Using Preconditions, these calls can be restricted to only apply to
 * documents that match the specified restrictions.
 */
export interface Precondition {
  /**
   * If set, the last update time to enforce.
   */
  readonly lastUpdateTime?: Timestamp;
}

/**
 * An options object that configures the behavior of `set()` calls in
 * `DocumentReference`, `WriteBatch` and `Transaction`. These calls can be
 * configured to perform granular merges instead of overwriting the target
 * documents in their entirety.
 */
export interface SetOptions {
  /**
   * Changes the behavior of a set() call to only replace the values specified
   * in its data argument. Fields omitted from the set() call remain
   * untouched.
   */
  readonly merge?: boolean;

  /**
   * Changes the behavior of set() calls to only replace the specified field
   * paths. Any field path that is not specified is ignored and remains
   * untouched.
   *
   * It is an error to pass a SetOptions object to a set() call that is
   * missing a value for any of the fields specified here.
   */
  readonly mergeFields?: Array<string|FieldPath>;
}

/**
 * An options object that can be used to configure the behavior of `getAll()`
 * calls. By providing a `fieldMask`, these calls can be configured to only
 * return a subset of fields.
 */
export interface ReadOptions {
  /**
   * Specifies the set of fields to return and reduces the amount of data
   * transmitted by the backend.
   *
   * Adding a field mask does not filter results. Documents do not need to
   * contain values for all the fields in the mask to be part of the result set.
   */
  readonly fieldMask?: Array<string|FieldPath>;
}

/**
 * Internal user data validation options.
 * @private
 */
export interface ValidationOptions {
  /** At what level field deletes are supported. */
  allowDeletes: 'none'|'root'|'all';

  /** Whether server transforms are supported. */
  allowTransforms: boolean;
}

/**
 * A Firestore Proto value in ProtoJs format.
 * @private
 */
export interface ProtobufJsValue extends api.IValue {
  valueType?: string;
}
