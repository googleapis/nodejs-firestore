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

const is = require('is');

const validate = require('./validate')();

/*!
 * A regular expression to verify an absolute Resource Path in Firestore. It
 * extracts the project ID, the database name and the relative resource path
 * if available.
 *
 * @type {RegExp}
 */
const RESOURCE_PATH_RE = /^projects\/([^/]*)\/databases\/([^/]*)(?:\/documents\/)?(.*)$/;

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
class Path {
  /**
   * Creates a new Path with the given segments.
   *
   * @private
   * @hideconstructor
   * @param {...string|string[]} segments - Sequence of parts of a path.
   */
  constructor(segments) {
    segments = is.array(segments)
      ? segments
      : Array.prototype.slice.call(arguments);

    /**
     * @private
     */
    this.segments = segments;

    /**
     * @private
     * @type {string|undefined}
     */
    this._formattedName = undefined;
  }

  /**
   * String representation as expected by the proto API.
   *
   * @private
   * @type {string}
   */
  get formattedName() {
    if (is.undefined(this._formattedName)) {
      this._formattedName = this.canonicalString();
    }

    return this._formattedName;
  }

  /**
   * Create a child path beneath the current level.
   *
   * @private
   * @param {string|T} relativePath - Relative path to append to the current
   * path.
   * @returns {T} The new path.
   * @template T
   */
  append(relativePath) {
    if (is.instanceof(relativePath, Path)) {
      return this.construct(this.segments.concat(relativePath.segments));
    }
    return this.construct(this.segments.concat(this.split(relativePath)));
  }

  /**
   * Returns the path of the parent node.
   *
   * @private
   * @returns {T|null} The new path or null if we are already at the root.
   * @returns {T} The new path.
   * @template T
   */
  parent() {
    if (this.segments.length === 0) {
      return null;
    }

    return this.construct(this.segments.slice(0, this.segments.length - 1));
  }

  /**
   * Checks whether the current path is a prefix of the specified path.
   *
   * @private
   * @param {Path} other - The path to check against.
   * @returns {boolean} 'true' iff the current path is a prefix match with
   * 'other'.
   */
  isPrefixOf(other) {
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
   * @returns {string} A string representing this path.
   */
  toString() {
    return this.formattedName;
  }

  /**
   * Compare the current path against another Path object.
   *
   * @private
   * @param {Path} other - The path to compare to.
   * @returns {number} -1 if current < other, 1 if current > other, 0 if equal
   */
  compareTo(other) {
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
   * @returns {Array.<string>} A copy of the segments that make up this path.
   */
  toArray() {
    return this.segments.slice();
  }
}

/**
 * A slash-separated path for navigating resources (documents and collections)
 * within Firestore.
 *
 * @private
 * @class
 */
class ResourcePath extends Path {
  /**
   * Constructs a Firestore Resource Path.
   *
   * @private
   * @hideconstructor
   *
   * @param {string} projectId - The Firestore project id.
   * @param {string} databaseId - The Firestore database id.
   * @param {...string|string[]} segments - Sequence of names of the parts of
   * the path.
   */
  constructor(projectId, databaseId, segments) {
    segments = is.array(segments)
      ? segments
      : Array.prototype.slice.call(arguments, 2);

    super(segments);

    /**
     * @type {string}
     * @private
     */
    this._projectId = projectId;

    /**
     * @type {string}
     * @private
     */
    this._databaseId = databaseId;
  }

  /**
   * String representation of the path relative to the database root.
   *
   * @private
   * @type {string}
   */
  get relativeName() {
    return this.segments.join('/');
  }

  /**
   * Indicates whether this ResourcePath points to a document.
   *
   * @private
   * @type {boolean}
   */
  get isDocument() {
    return this.segments.length > 0 && this.segments.length % 2 === 0;
  }

  /**
   * Indicates whether this ResourcePath points to a collection.
   *
   * @private
   * @type {boolean}
   */
  get isCollection() {
    return this.segments.length % 2 === 1;
  }

  /**
   * The last component of the path.
   *
   * @private
   * @type {string|null}
   */
  get id() {
    if (this.segments.length > 0) {
      return this.segments[this.segments.length - 1];
    }
    return null;
  }

  /**
   * The project ID of this path.
   *
   * @private
   * @type {string}
   */
  get projectId() {
    return this._projectId;
  }

  /**
   * The database ID of this path.
   *
   * @private
   * @type {string}
   */
  get databaseId() {
    return this._databaseId;
  }
  /**
   * Returns true if the given string can be used as a relative or absolute
   * resource path.
   *
   * @private
   * @param {string} resourcePath - The path to validate.
   * @throws if the string can't be used as a resource path.
   * @returns {boolean} 'true' when the path is valid.
   */
  static validateResourcePath(resourcePath) {
    if (!is.string(resourcePath) || resourcePath === '') {
      throw new Error(`Path must be a non-empty string.`);
    }

    if (resourcePath.indexOf('//') >= 0) {
      throw new Error('Paths must not contain //.');
    }

    return true;
  }

  /**
   * Creates a resource path from an absolute Firestore path.
   *
   * @private
   * @param {string} absolutePath - A string representation of a Resource Path.
   * @returns {ResourcePath} The new ResourcePath.
   */
  static fromSlashSeparatedString(absolutePath) {
    let elements = RESOURCE_PATH_RE.exec(absolutePath);

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
   * @param {string} relativePath - The path to split.
   * @returns {Array.<string>} - The split path segments.
   */
  split(relativePath) {
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
  canonicalString() {
    let components = [
      'projects',
      this._projectId,
      'databases',
      this._databaseId,
    ];
    if (this.segments.length > 0) {
      components = components.concat('documents', this.segments);
    }
    return components.join('/');
  }

  /**
   * Constructs a new instance of ResourcePath. We need this instead of using
   * the normal constructor because polymorphic 'this' doesn't work on static
   * methods.
   *
   * @private
   * @override
   * @param {Array.<string>} segments - Sequence of names of the parts of the
   * path.
   * @returns {ResourcePath} The newly created ResourcePath.
   */
  construct(segments) {
    return new ResourcePath(this._projectId, this._databaseId, segments);
  }

  /**
   * Compare the current path against another ResourcePath object.
   *
   * @private
   * @override
   * @param {ResourcePath} other - The path to compare to.
   * @returns {number} -1 if current < other, 1 if current > other, 0 if equal
   */
  compareTo(other) {
    if (this._projectId < other._projectId) {
      return -1;
    }
    if (this._projectId > other._projectId) {
      return 1;
    }

    if (this._databaseId < other._databaseId) {
      return -1;
    }
    if (this._databaseId > other._databaseId) {
      return 1;
    }

    return super.compareTo(other);
  }
}

/**
 * A dot-separated path for navigating sub-objects within a document.
 *
 * @class
 */
class FieldPath extends Path {
  /**
   * Constructs a Firestore Field Path.
   *
   * @param {...string|string[]} segments - Sequence of field names that form
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
  constructor(segments) {
    validate.minNumberOfArguments('FieldPath', arguments, 1);

    segments = is.array(segments)
      ? segments
      : Array.prototype.slice.call(arguments);

    for (let i = 0; i < segments.length; ++i) {
      validate.isString(i, segments[i]);
      if (segments[i].length === 0) {
        throw new Error(`Argument at index ${i} should not be empty.`);
      }
    }

    super(segments);
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
   * Returns true if the provided value can be used as a field path argument.
   *
   * @private
   * @param {string|FieldPath} fieldPath - The value to verify.
   * @throws if the string can't be used as a field path.
   * @returns {boolean} 'true' when the path is valid.
   */
  static validateFieldPath(fieldPath) {
    if (!is.instanceof(fieldPath, FieldPath)) {
      if (!is.string(fieldPath)) {
        throw new Error(`Paths must be strings or FieldPath objects.`);
      }

      if (fieldPath.indexOf('..') >= 0) {
        throw new Error(`Paths must not contain '..' in them.`);
      }

      if (fieldPath.startsWith('.') || fieldPath.endsWith('.')) {
        throw new Error(`Paths must not start or end with '.'.`);
      }

      if (!FIELD_PATH_RE.test(fieldPath)) {
        throw new Error(`Paths can't be empty and must not contain '*~/[]'.`);
      }
    }

    return true;
  }

  /**
   * Turns a field path argument into a [FieldPath]{@link FieldPath}.
   * Supports FieldPaths as input (which are passed through) and dot-seperated
   * strings.
   *
   * @private
   * @param {string|FieldPath} fieldPath - The FieldPath to create.
   * @returns {FieldPath} A field path representation.
   */
  static fromArgument(fieldPath) {
    // validateFieldPath() is used in all public API entry points to validate
    // that fromArgument() is only called with a Field Path or a string.
    return fieldPath instanceof FieldPath
      ? fieldPath
      : new FieldPath(fieldPath.split('.'));
  }

  /**
   * String representation of a FieldPath as expected by the API.
   *
   * @private
   * @override
   * @returns {string} The representation as expected by the API.
   */
  canonicalString() {
    return this.segments
      .map(str => {
        return UNESCAPED_FIELD_NAME_RE.test(str)
          ? str
          : '`' + str.replace('\\', '\\\\').replace('`', '\\`') + '`';
      })
      .join('.');
  }

  /**
   * Splits a string into path segments, using dots as separators.
   *
   * @private
   * @override
   * @param {string} fieldPath - The path to split.
   * @returns {Array.<string>} - The split path segments.
   */
  split(fieldPath) {
    return fieldPath.split('.');
  }

  /**
   * Constructs a new instance of FieldPath. We need this instead of using
   * the normal constructor because polymorphic 'this' doesn't work on static
   * methods.
   *
   * @private
   * @override
   * @param {Array.<string>} segments - Sequence of field names.
   * @returns {ResourcePath} The newly created FieldPath.
   */
  construct(segments) {
    return new FieldPath(segments);
  }
}

/**
 * A special sentinel value to refer to the ID of a document.
 *
 * @type {FieldPath}
 * @private
 */
FieldPath._DOCUMENT_ID = new FieldPath('__name__');

module.exports = {FieldPath, ResourcePath};
