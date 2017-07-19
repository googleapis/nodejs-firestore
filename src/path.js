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

/*!
 * @module firestore/path
 */

'use strict';

/**
 * An immutable representation of a Firestore path to a Document or Collection.
 *
 * @constructor
 * @alias firestore.Path
 * @package
 */
class Path {
  /**
   * @param {string} projectId - The Firestore project id.
   * @param {string} databaseId - The Firestore database id.
   * @param {Array.<string>} pathComponents - Sequence of names of the parts of
   * a path.
   */
  constructor(projectId, databaseId, pathComponents) {
    this._projectId = projectId;
    this._databaseId = databaseId;
    this._parts = pathComponents;
  }


  /**
   * @package
   * @type boolean
   */
  get isDocument() {
    return this._parts.length > 0 && this._parts.length % 2 === 0;
  }

  /**
   * @package
   * @type boolean
   */
  get isCollection() {
    return this._parts.length % 2 === 1;
  }

  /**
   * The last component of the path.
   *
   * @package
   * @type string|null
   */
  get id() {
    if (this._parts.length > 0) {
      return this._parts[this._parts.length - 1];
    }
    return null;
  }

  /**
   * The project ID of this path.
   *
   * @package
   * @type string
   */
  get projectId() {
    return this._projectId;
  }

  /**
   * The database ID of this path.
   *
   * @package
   * @type string
   */
  get databaseId() {
    return this._databaseId;
  }

  /**
   * String representation as expected by the API.
   *
   * @package
   * @type string
   */
  get formattedName() {
    let components = ['projects', this._projectId, 'databases',
      this._databaseId];
    if (this._parts.length > 0) {
      components = components.concat('documents', this._parts);
    }
    return components.join('/');
  }

  /**
   * String representation of the path relative to the database root.
   *
   * @package
   * @type string
   */
  get relativeName() {
    return this._parts.join('/');
  }


  /**
   * Create a child path beneath the current level.
   *
   * @package
   * @param {string} relativePath - Slash-separated path to append to the
   * current path.
   * @return {firestore.Path} The new path.
   */
  child(relativePath) {
    return new Path(this._projectId, this._databaseId,
        this._parts.concat(relativePath.split('/')));
  }

  /**
   * Returns the path of the parent node.
   *
   * @package
   * @return {firestore.Path|null} The new path or null if we are already at the
   * root.
   */
  parent() {
    if (this._parts.length === 0) {
      return null;
    }

    return new Path(this._projectId, this._databaseId,
        this._parts.slice(0, this._parts.length - 1));
  }

  /**
   * Returns the Path from its string representation.
   *
   * @package
   * @param {string} name The Firestore resource name of this path.
   * @return {Path} The Path for this resource name.
   */
  static fromName(name) {
    let parts = name.split('/');

    if (parts.length >= 6 &&
        parts[0] === 'projects' &&
        parts[2] === 'databases' &&
        parts[4] === 'documents') {
      return new Path(parts[1], parts[3], parts.slice(5));
    }

    if (parts.length >= 4 &&
        parts[0] === 'projects' &&
        parts[2] === 'databases') {
      return new Path(parts[1], parts[3], []);
    }

    throw new Error('Provided resource name is not valid.');
  }

  /**
   * Compares two paths.
   *
   * @package
   * @return {number} - -1 if left < right, 1 if right > left, 0 if equal
   */
  static compare(left, right) {
    if (left._projectId < right._projectId) {
      return -1;
    }
    if (left._projectId > right._projectId) {
      return 1;
    }

    if (left._databaseId < right._databaseId) {
      return -1;
    }
    if (left._databaseId > right._databaseId) {
      return 1;
    }

    const len = Math.min(left._parts.length, right._parts.length);
    for (let i = 0; i < len; i++) {
      if (left._parts[i] < right._parts[i]) {
        return -1;
      }
      if (left._parts[i] > right._parts[i]) {
        return 1;
      }
    }
    if (left._parts.length < right._parts.length) {
      return -1;
    }
    if (left._parts.length > right._parts.length) {
      return 1;
    }
    return 0;
  }
}

module.exports = Path;
