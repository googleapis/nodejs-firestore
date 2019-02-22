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

import {google} from '../protos/firestore_proto_api';

import {isObject} from './util';
import {customObjectMessage, invalidArgumentMessage, validateMinNumberOfArguments, validateString} from './validate';

import api = google.firestore.v1;

/*!
 * A regular expression to verify an absolute Resource Path in Firestore. It
 * extracts the project ID, the database name and the relative resource path
 * if available.
 *
 * @type {RegExp}
 */
const RESOURCE_PATH_RE =
    // Note: [\s\S] matches all characters including newlines.
    /^projects\/([^/]*)\/databases\/([^/]*)(?:\/documents\/)?([\s\S]*)$/;

/*!
 * A regular expression to verify whether a field name can be passed to the
 * backend without escaping.
 *
 * @type {RegExp}
 */
const UNESCAPED_FIELD_NAME_RE = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

/*!
 * A regular expression to verify field paths that are passed to the API as
 * strings. Field paths that do not match this expression have to be provided
 * as a [FieldPath]{@link FieldPath} object.
 *
 * @type {RegExp}
 */
const FIELD_PATH_RE = /^[^*~/[\]]+$/;

/**
 * An abstract class representing a Firestore path.
 *
 * Subclasses have to implement `split()` and `canonicalString()`.
 *
 * @private
 * @class
 */
abstract class Path<T> {
  /**
   * Creates a new Path with the given segments.
   *
   * @private
   * @hideconstructor
   * @param segments Sequence of parts of a path.
   */
  constructor(protected readonly segments: string[]) {}

  /**
   * String representation as expected by the proto API.
   *
   * @private
   */
  get formattedName(): string {
    return this.canonicalString()!;
  }

  /**
   * Returns the number of segments of this field path.
   *
   * @private
   */
  get size(): number {
    return this.segments.length;
  }

  abstract construct(segments: string[]|string): T;
  abstract canonicalString(): string;
  abstract split(relativePath: string): string[];

  /**
   * Create a child path beneath the current level.
   *
   * @private
   * @param relativePath Relative path to append to the current path.
   * @returns The new path.
   */
  append(relativePath: Path<T>|string): T {
    if (relativePath instanceof Path) {
      return this.construct(this.segments.concat(relativePath.segments));
    }
    return this.construct(this.segments.concat(this.split(relativePath)));
  }

  /**
   * Returns the path of the parent node.
   *
   * @private
   * @returns The new path or null if we are already at the root.
   */
  parent(): T|null {
    if (this.segments.length === 0) {
      return null;
    }

    return this.construct(this.segments.slice(0, this.segments.length - 1));
  }

  /**
   * Checks whether the current path is a prefix of the specified path.
   *
   * @private
   * @param other The path to check against.
   * @returns 'true' iff the current path is a prefix match with 'other'.
   */
  isPrefixOf(other: Path<T>): boolean {
    if (other.segments.length < this.segments.length) {
      return false;
    }

    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i] !== other.segments[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns a string representation of this path.
   *
   * @private
   * @returns A string representing this path.
   */
  toString(): string {
    return this.formattedName;
  }

  /**
   * Compare the current path against another Path object.
   *
   * @private
   * @param other The path to compare to.
   * @returns -1 if current < other, 1 if current > other, 0 if equal
   */
  compareTo(other: Path<T>): number {
    const len = Math.min(this.segments.length, other.segments.length);
    for (let i = 0; i < len; i++) {
      if (this.segments[i] < other.segments[i]) {
        return -1;
      }
      if (this.segments[i] > other.segments[i]) {
        return 1;
      }
    }
    if (this.segments.length < other.segments.length) {
      return -1;
    }
    if (this.segments.length > other.segments.length) {
      return 1;
    }
    return 0;
  }

  /**
   * Returns a copy of the underlying segments.
   *
   * @private
   * @returns A copy of the segments that make up this path.
   */
  toArray(): string[] {
    return this.segments.slice();
  }

  /**
   * Returns true if this `Path` is equal to the provided value.
   *
   * @private
   * @param other The value to compare against.
   * @return true if this `Path` is equal to the provided value.
   */
  isEqual(other: Path<T>): boolean {
    return (
        this === other ||
        (other instanceof this.constructor && this.compareTo(other) === 0));
  }
}

/**
 * A slash-separated path for navigating resources (documents and collections)
 * within Firestore.
 *
 * @private
 * @class
 */
export class ResourcePath extends Path<ResourcePath> {
  /**
   * The project ID of this path.
   */
  readonly projectId: string;

  /**
   * The database ID of this path.
   */
  readonly databaseId: string;

  /**
   * Constructs a Firestore Resource Path.
   *
   * @private
   * @hideconstructor
   *
   * @param projectId The Firestore project id.
   * @param databaseId The Firestore database id.
   * @param segments Sequence of names of the parts of the path.
   */
  constructor(projectId: string, databaseId: string, ...segments: string[]) {
    super(segments);

    this.projectId = projectId;
    this.databaseId = databaseId;
  }

  /**
   * String representation of the path relative to the database root.
   *
   * @private
   * @type {string}
   */
  get relativeName(): string {
    return this.segments.join('/');
  }

  /**
   * Indicates whether this ResourcePath points to a document.
   *
   * @private
   * @type {boolean}
   */
  get isDocument(): boolean {
    return this.segments.length > 0 && this.segments.length % 2 === 0;
  }

  /**
   * Indicates whether this ResourcePath points to a collection.
   *
   * @private
   * @type {boolean}
   */
  get isCollection(): boolean {
    return this.segments.length % 2 === 1;
  }

  /**
   * The last component of the path.
   *
   * @private
   * @type {string|null}
   */
  get id(): string|null {
    if (this.segments.length > 0) {
      return this.segments[this.segments.length - 1];
    }
    return null;
  }

  /**
   * Creates a resource path from an absolute Firestore path.
   *
   * @private
   * @param {string} absolutePath A string representation of a Resource Path.
   * @returns {ResourcePath} The new ResourcePath.
   */
  static fromSlashSeparatedString(absolutePath: string): ResourcePath {
    const elements = RESOURCE_PATH_RE.exec(absolutePath);

    if (elements) {
      const project = elements[1];
      const database = elements[2];
      const path = elements[3];
      return new ResourcePath(project, database).append(path);
    }

    throw new Error(`Resource name '${absolutePath}' is not valid.`);
  }

  /**
   * Splits a string into path segments, using slashes as separators.
   *
   * @private
   * @override
   * @param {string} relativePath The path to split.
   * @returns {Array.<string>} - The split path segments.
   */
  split(relativePath: string): string[] {
    // We may have an empty segment at the beginning or end if they had a
    // leading or trailing slash (which we allow).
    return relativePath.split('/').filter(segment => segment.length > 0);
  }

  /**
   * String representation of a ResourcePath as expected by the API.
   *
   * @private
   * @override
   * @returns {string} The representation as expected by the API.
   */
  canonicalString(): string {
    const components = [
      'projects', this.projectId, 'databases', this.databaseId, 'documents',
      ...this.segments
    ];
    return components.join('/');
  }

  /**
   * Constructs a new instance of ResourcePath. We need this instead of using
   * the normal constructor because polymorphic 'this' doesn't work on static
   * methods.
   *
   * @private
   * @override
   * @param {Array.<string>} segments Sequence of names of the parts of the
   * path.
   * @returns {ResourcePath} The newly created ResourcePath.
   */
  construct(segments: string[]): ResourcePath {
    return new ResourcePath(this.projectId, this.databaseId, ...segments);
  }

  /**
   * Compare the current path against another ResourcePath object.
   *
   * @private
   * @override
   * @param {ResourcePath} other The path to compare to.
   * @returns {number} -1 if current < other, 1 if current > other, 0 if equal
   */
  compareTo(other: ResourcePath): number {
    // Ignore DocumentReference with {{projectId}} placeholders and assume that
    // the resolved IDs match the provided ResourcePath. We could alternatively
    // try to resolve the Project ID here, but this is asynchronous as it
    // requires Disk I/O.
    if (this.projectId !== '{{projectId}}' &&
        other.projectId !== '{{projectId}}') {
      if (this.projectId < other.projectId) {
        return -1;
      }
      if (this.projectId > other.projectId) {
        return 1;
      }
    }

    if (this.databaseId < other.databaseId) {
      return -1;
    }
    if (this.databaseId > other.databaseId) {
      return 1;
    }

    return super.compareTo(other);
  }

  /**
   * Converts this ResourcePath to the Firestore Proto representation.
   *
   * @private
   */
  toProto(): api.IValue {
    return {
      referenceValue: this.formattedName,
    };
  }
}

/**
 * Validates that the given string can be used as a relative or absolute
 * resource path.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param resourcePath The path to validate.
 * @throws if the string can't be used as a resource path.
 */
export function validateResourcePath(
    arg: string|number, resourcePath: string): void {
  if (typeof resourcePath !== 'string' || resourcePath === '') {
    throw new Error(`${
        invalidArgumentMessage(
            arg, 'resource path')} Path must be a non-empty string.`);
  }

  if (resourcePath.indexOf('//') >= 0) {
    throw new Error(`${
        invalidArgumentMessage(
            arg, 'resource path')} Paths must not contain //.`);
  }
}

/**
 * A dot-separated path for navigating sub-objects within a document.
 *
 * @class
 */
export class FieldPath extends Path<FieldPath> {
  /**
   * A special sentinel value to refer to the ID of a document.
   *
   * @private
   */
  private static _DOCUMENT_ID = new FieldPath('__name__');

  /**
   * Constructs a Firestore Field Path.
   *
   * @param {...string|string[]} segments Sequence of field names that form
   * this path.
   *
   * @example
   * let query = firestore.collection('col');
   * let fieldPath = new FieldPath('f.o.o', 'bar');
   *
   * query.where(fieldPath, '==', 42).get().then(snapshot => {
   *   snapshot.forEach(document => {
   *     console.log(`Document contains {'f.o.o' : {'bar' : 42}}`);
   *   });
   * });
   */
  constructor(...segments: string[]) {
    validateMinNumberOfArguments('FieldPath', arguments, 1);

    const elements: string[] = Array.isArray(segments[0]) ?
        (segments[0] as unknown) as string[] :
        segments;

    for (let i = 0; i < elements.length; ++i) {
      validateString(i, elements[i]);
      if (elements[i].length === 0) {
        throw new Error(`Element at index ${i} should not be an empty string.`);
      }
    }

    super(elements);
  }

  /**
   * A special FieldPath value to refer to the ID of a document. It can be used
   * in queries to sort or filter by the document ID.
   *
   * @returns {FieldPath}
   */
  static documentId() {
    return FieldPath._DOCUMENT_ID;
  }

  /**
   * Turns a field path argument into a [FieldPath]{@link FieldPath}.
   * Supports FieldPaths as input (which are passed through) and dot-separated
   * strings.
   *
   * @private
   * @param {string|FieldPath} fieldPath The FieldPath to create.
   * @returns {FieldPath} A field path representation.
   */
  static fromArgument(fieldPath: string|FieldPath) {
    // validateFieldPath() is used in all public API entry points to validate
    // that fromArgument() is only called with a Field Path or a string.
    return fieldPath instanceof FieldPath ?
        fieldPath :
        new FieldPath(...fieldPath.split('.'));
  }

  /**
   * String representation of a FieldPath as expected by the API.
   *
   * @private
   * @override
   * @returns {string} The representation as expected by the API.
   */
  canonicalString(): string {
    return this.segments
        .map(str => {
          return UNESCAPED_FIELD_NAME_RE.test(str) ?
              str :
              '`' + str.replace('\\', '\\\\').replace('`', '\\`') + '`';
        })
        .join('.');
  }

  /**
   * Splits a string into path segments, using dots as separators.
   *
   * @private
   * @override
   * @param {string} fieldPath The path to split.
   * @returns {Array.<string>} - The split path segments.
   */
  split(fieldPath: string): string[] {
    return fieldPath.split('.');
  }

  /**
   * Constructs a new instance of FieldPath. We need this instead of using
   * the normal constructor because polymorphic 'this' doesn't work on static
   * methods.
   *
   * @private
   * @override
   * @param {Array.<string>} segments Sequence of field names.
   * @returns {ResourcePath} The newly created FieldPath.
   */
  construct(segments: string[]) {
    return new FieldPath(...segments);
  }

  /**
   * Returns true if this `FieldPath` is equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `FieldPath` is equal to the provided value.
   */
  isEqual(other: FieldPath): boolean {
    return super.isEqual(other);
  }
}

/**
 * Validates that the provided value can be used as a field path argument.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param fieldPath The value to verify.
 * @throws if the string can't be used as a field path.
 */
export function validateFieldPath(
    arg: string|number, fieldPath: unknown): void {
  if (fieldPath instanceof FieldPath) {
    return;
  }

  if (fieldPath === undefined) {
    throw new Error(
        invalidArgumentMessage(arg, 'field path') +
        ' The path cannot be omitted.');
  }

  if (isObject(fieldPath) && fieldPath.constructor.name === 'FieldPath') {
    throw new Error(customObjectMessage(arg, fieldPath));
  }

  if (typeof fieldPath !== 'string') {
    throw new Error(`${
        invalidArgumentMessage(
            arg,
            'field path')} Paths can only be specified as strings or via a FieldPath object.`);
  }

  if (fieldPath.indexOf('..') >= 0) {
    throw new Error(`${
        invalidArgumentMessage(
            arg, 'field path')} Paths must not contain ".." in them.`);
  }

  if (fieldPath.startsWith('.') || fieldPath.endsWith('.')) {
    throw new Error(`${
        invalidArgumentMessage(
            arg, 'field path')} Paths must not start or end with ".".`);
  }

  if (!FIELD_PATH_RE.test(fieldPath)) {
    throw new Error(`${
        invalidArgumentMessage(
            arg, 'field path')} Paths can't be empty and must not contain
    "*~/[]".`);
  }
}
