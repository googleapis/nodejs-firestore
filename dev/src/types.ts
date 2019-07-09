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

import api = google.firestore.v1;

/**
 * A map in the format of the Proto API
 */
export interface ApiMapValue {
  [k: string]: google.firestore.v1.IValue;
}

// We don't have type information for the JavaScript GapicClient.
// tslint:disable-next-line:no-any
export type GapicClient = any;

// We don't have type information for the npm package
// `functional-red-black-tree`.
// tslint:disable-next-line:no-any
export type RBTree = any;

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

  /** The host to connect to. */
  host?: string;

  /**
   * Local file containing the Service Account credentials. Can be omitted
   * in environments that support `Application Default Credentials`
   * {@see https://cloud.google.com/docs/authentication}
   */
  keyFilename?: string;

  /**
   * The 'client_email' and 'private_key' properties of the service account
   * to use with your Firestore project. Can be omitted in environments that
   * support {@link https://cloud.google.com/docs/authentication Application
   * Default Credentials}. If your credentials are stored in a JSON file, you
   * can specify a `keyFilename` instead.
   */
  credentials?: {client_email?: string; private_key?: string};

  /**
   * Specifies whether to use `Timestamp` objects for timestamp fields in
   * `DocumentSnapshot`s. This is enabled by default and should not be disabled.
   *
   * Previously, Firestore returned timestamp fields as `Date` but `Date` only
   * supports millisecond precision, which leads to truncation and causes
   * unexpected behavior when using a timestamp from a snapshot as a part of a
   * subsequent query.
   *
   * So now Firestore returns `Timestamp` values instead of `Date`, avoiding
   * this kind of problem.
   *
   * To opt into the old behavior of returning `Date` objects, you can
   * temporarily set `timestampsInSnapshots` to false.
   *
   * @deprecated This setting will be removed in a future release. You should
   * update your code to expect `Timestamp` objects and stop using the
   * `timestampsInSnapshots` setting.
   */
  timestampsInSnapshots?: boolean;

  /** Whether to use SSL when connecting. */
  ssl?: boolean;

  // tslint:disable-next-line:no-any
  [key: string]: any; // Accept other properties, such as GRPC settings.
}

/**
 * Document data (for use with `DocumentReference.set()`) consists of fields
 * mapped to values.
 */
export interface DocumentData {
  [field: string]: unknown;
}

/**
 * Update data (for use with `DocumentReference.update()`) consists of field
 * paths (e.g. 'foo' or 'foo.baz') mapped to values. Fields that contain dots
 * reference nested fields within the document.
 */
export interface UpdateData {
  [fieldPath: string]: unknown;
}

/**
 * Update data that has been resolved to a mapping of FieldPaths to values.
 */
export type UpdateMap = Map<FieldPath, unknown>;

/**
 * The direction of a `Query.orderBy()` clause is specified as 'desc' or 'asc'
 * (descending or ascending).
 */
export type OrderByDirection = 'desc' | 'asc';

/**
 * Filter conditions in a `Query.where()` clause are specified using the
 * strings '<', '<=', '==', '>=', '>','array-contains', 'in', and
 * 'array-contains-any'.
 */
export type WhereFilterOp =
  | '<'
  | '<='
  | '=='
  | '>='
  | '>'
  | 'array-contains'
  | 'in'
  | 'array-contains-any';

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
  readonly mergeFields?: Array<string | FieldPath>;
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
  readonly fieldMask?: Array<string | FieldPath>;
}

/**
 * Internal user data validation options.
 * @private
 */
export interface ValidationOptions {
  /** At what level field deletes are supported. */
  allowDeletes: 'none' | 'root' | 'all';

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
