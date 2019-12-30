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

import {google} from '../protos/firestore_v1_proto_api';
import {FieldPath} from './path';
import {Timestamp} from './timestamp';

import api = google.firestore.v1;

/*!
 * List of GRPC Error Codes.
 *
 * This corresponds to
 * {@link https://github.com/grpc/grpc/blob/master/doc/statuscodes.md}.
 */
export const GRPC_STATUS_CODE: {[k: string]: number} = {
  // Not an error; returned on success.
  OK: 0,

  // The operation was cancelled (typically by the caller).
  CANCELLED: 1,

  // Unknown error. An example of where this error may be returned is if a
  // Status value received from another address space belongs to an error-space
  // that is not known in this address space. Also errors raised by APIs that
  // do not return enough error information may be converted to this error.
  UNKNOWN: 2,

  // Client specified an invalid argument. Note that this differs from
  // FAILED_PRECONDITION. INVALID_ARGUMENT indicates arguments that are
  // problematic regardless of the state of the system (e.g., a malformed file
  // name).
  INVALID_ARGUMENT: 3,

  // Deadline expired before operation could complete. For operations that
  // change the state of the system, this error may be returned even if the
  // operation has completed successfully. For example, a successful response
  // from a server could have been delayed long enough for the deadline to
  // expire.
  DEADLINE_EXCEEDED: 4,

  // Some requested entity (e.g., file or directory) was not found.
  NOT_FOUND: 5,

  // Some entity that we attempted to create (e.g., file or directory) already
  // exists.
  ALREADY_EXISTS: 6,

  // The caller does not have permission to execute the specified operation.
  // PERMISSION_DENIED must not be used for rejections caused by exhausting
  // some resource (use RESOURCE_EXHAUSTED instead for those errors).
  // PERMISSION_DENIED must not be used if the caller can not be identified
  // (use UNAUTHENTICATED instead for those errors).
  PERMISSION_DENIED: 7,

  // The request does not have valid authentication credentials for the
  // operation.
  UNAUTHENTICATED: 16,

  // Some resource has been exhausted, perhaps a per-user quota, or perhaps the
  // entire file system is out of space.
  RESOURCE_EXHAUSTED: 8,

  // Operation was rejected because the system is not in a state required for
  // the operation's execution. For example, directory to be deleted may be
  // non-empty, an rmdir operation is applied to a non-directory, etc.
  //
  // A litmus test that may help a service implementor in deciding
  // between FAILED_PRECONDITION, ABORTED, and UNAVAILABLE:
  //  (a) Use UNAVAILABLE if the client can retry just the failing call.
  //  (b) Use ABORTED if the client should retry at a higher-level
  //      (e.g., restarting a read-modify-write sequence).
  //  (c) Use FAILED_PRECONDITION if the client should not retry until
  //      the system state has been explicitly fixed. E.g., if an "rmdir"
  //      fails because the directory is non-empty, FAILED_PRECONDITION
  //      should be returned since the client should not retry unless
  //      they have first fixed up the directory by deleting files from it.
  //  (d) Use FAILED_PRECONDITION if the client performs conditional
  //      REST Get/Update/Delete on a resource and the resource on the
  //      server does not match the condition. E.g., conflicting
  //      read-modify-write on the same resource.
  FAILED_PRECONDITION: 9,

  // The operation was aborted, typically due to a concurrency issue like
  // sequencer check failures, transaction aborts, etc.
  //
  // See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
  // and UNAVAILABLE.
  ABORTED: 10,

  // Operation was attempted past the valid range. E.g., seeking or reading
  // past end of file.
  //
  // Unlike INVALID_ARGUMENT, this error indicates a problem that may be fixed
  // if the system state changes. For example, a 32-bit file system will
  // generate INVALID_ARGUMENT if asked to read at an offset that is not in the
  // range [0,2^32-1], but it will generate OUT_OF_RANGE if asked to read from
  // an offset past the current file size.
  //
  // There is a fair bit of overlap between FAILED_PRECONDITION and
  // OUT_OF_RANGE. We recommend using OUT_OF_RANGE (the more specific error)
  // when it applies so that callers who are iterating through a space can
  // easily look for an OUT_OF_RANGE error to detect when they are done.
  OUT_OF_RANGE: 11,

  // Operation is not implemented or not supported/enabled in this service.
  UNIMPLEMENTED: 12,

  // Internal errors. Means some invariants expected by underlying System has
  // been broken. If you see one of these errors, Something is very broken.
  INTERNAL: 13,

  // The service is currently unavailable. This is a most likely a transient
  // condition and may be corrected by retrying with a backoff.
  //
  // See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
  // and UNAVAILABLE.
  UNAVAILABLE: 14,

  // Unrecoverable data loss or corruption.
  DATA_LOSS: 15,

  // Force users to include a default branch:
  DO_NOT_USE: -1,
};

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

  /** Whether to use SSL when connecting. */
  ssl?: boolean;

  /**
   * The maximum number of idle GRPC channels to keep. A smaller number of idle
   * channels reduces memory usage but increases request latency for clients
   * with fluctuating request rates. If set to 0, shuts down all GRPC channels
   * when the client becomes idle. Defaults to 1.
   */
  maxIdleChannels?: number;

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
