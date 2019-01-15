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

import * as assert from 'assert';
const deepEqual = require('deep-equal');
import * as is from 'is';

import {google} from '../protos/firestore_proto_api';
import {FieldTransform} from './field-value';
import {FieldPath} from './path';
import {DocumentReference} from './reference';
import {isPlainObject, Serializer} from './serializer';
import {Timestamp} from './timestamp';
import {AnyDuringMigration, AnyJs, ApiMapValue, DocumentData, UpdateData, UserInput} from './types';

import api = google.firestore.v1;

/**
 * Returns a builder for DocumentSnapshot and QueryDocumentSnapshot instances.
 * Invoke `.build()' to assemble the final snapshot.
 *
 * @private
 */
export class DocumentSnapshotBuilder {
  /** The reference to the document. */
  ref?: DocumentReference;

  /** The fields of the Firestore `Document` Protobuf backing this document. */
  fieldsProto?: ApiMapValue;

  /** The time when this document was read. */
  readTime?: Timestamp;

  /** The time when this document was created. */
  createTime?: Timestamp;

  /** The time when this document was last updated. */
  updateTime?: Timestamp;

  /**
   * Builds the DocumentSnapshot.
   *
   * @private
   * @returns Returns either a QueryDocumentSnapshot (if `fieldsProto` was
   * provided) or a DocumentSnapshot.
   */
  build(): QueryDocumentSnapshot|DocumentSnapshot {
    assert(
        (this.fieldsProto !== undefined) === (this.createTime !== undefined),
        'Create time should be set iff document exists.');
    assert(
        (this.fieldsProto !== undefined) === (this.updateTime !== undefined),
        'Update time should be set iff document exists.');
    return this.fieldsProto ?
        new QueryDocumentSnapshot(
            this.ref!, this.fieldsProto!, this.readTime!, this.createTime!,
            this.updateTime!) :
        new DocumentSnapshot(this.ref!, undefined, this.readTime!);
  }
}

/**
 * A DocumentSnapshot is an immutable representation for a document in a
 * Firestore database. The data can be extracted with
 * [data()]{@link DocumentSnapshot#data} or
 * [get(fieldPath)]{@link DocumentSnapshot#get} to get a
 * specific field.
 *
 * <p>For a DocumentSnapshot that points to a non-existing document, any data
 * access will return 'undefined'. You can use the
 * [exists]{@link DocumentSnapshot#exists} property to explicitly verify a
 * document's existence.
 *
 * @class
 */
export class DocumentSnapshot {
  private _ref: DocumentReference;
  private _fieldsProto: ApiMapValue|undefined;
  private _serializer: Serializer;
  private _validator: AnyDuringMigration;
  private _readTime: Timestamp|undefined;
  private _createTime: Timestamp|undefined;
  private _updateTime: Timestamp|undefined;

  /**
   * @private
   * @hideconstructor
   *
   * @param ref The reference to the document.
   * @param fieldsProto The fields of the Firestore `Document` Protobuf backing
   * this document (or undefined if the document does not exist).
   * @param readTime The time when this snapshot was read  (or undefined if
   * the document exists only locally).
   * @param createTime The time when the document was created (or undefined if
   * the document does not exist).
   * @param updateTime The time when the document was last updated (or undefined
   * if the document does not exist).
   */
  constructor(
      ref: DocumentReference, fieldsProto?: ApiMapValue, readTime?: Timestamp,
      createTime?: Timestamp, updateTime?: Timestamp) {
    this._ref = ref;
    this._fieldsProto = fieldsProto;
    this._serializer = ref.firestore._serializer;
    this._validator = ref.firestore._validator;
    this._readTime = readTime;
    this._createTime = createTime;
    this._updateTime = updateTime;
  }

  /**
   * Creates a DocumentSnapshot from an object.
   *
   * @private
   * @param ref The reference to the document.
   * @param obj The object to store in the DocumentSnapshot.
   * @return The created DocumentSnapshot.
   */
  static fromObject(ref: DocumentReference, obj: {}): DocumentSnapshot {
    const serializer = ref.firestore._serializer;
    return new DocumentSnapshot(ref, serializer.encodeFields(obj));
  }
  /**
   * Creates a DocumentSnapshot from an UpdateMap.
   *
   * This methods expands the top-level field paths in a JavaScript map and
   * turns { foo.bar : foobar } into { foo { bar : foobar }}
   *
   * @private
   * @param ref The reference to the document.
   * @param data The field/value map to expand.
   * @return The created DocumentSnapshot.
   */
  static fromUpdateMap(ref: DocumentReference, data: UpdateData):
      DocumentSnapshot {
    const serializer = ref.firestore._serializer;

    /**
     * Merges 'value' at the field path specified by the path array into
     * 'target'.
     */
    function merge(
        target: ApiMapValue, value: AnyJs, path: string[], pos: number) {
      const key = path[pos];
      const isLast = pos === path.length - 1;

      if (target[key] === undefined) {
        if (isLast) {
          if (value instanceof FieldTransform) {
            // If there is already data at this path, we need to retain it.
            // Otherwise, we don't include it in the DocumentSnapshot.
            return !is.empty(target) ? target : null;
          }
          // The merge is done.
          const leafNode = serializer.encodeValue(value);
          if (leafNode) {
            target[key] = leafNode;
          }
          return target;
        } else {
          // We need to expand the target object.
          const childNode = {
            mapValue: {
              fields: {},
            },
          };

          const nestedValue =
              merge(childNode.mapValue.fields, value, path, pos + 1);

          if (nestedValue) {
            childNode.mapValue.fields = nestedValue;
            target[key] = childNode;
            return target;
          } else {
            return !is.empty(target) ? target : null;
          }
        }
      } else {
        assert(!isLast, 'Can\'t merge current value into a nested object');
        target[key].mapValue!.fields =
            merge(target[key].mapValue!.fields!, value, path, pos + 1);
        return target;
      }
    }

    const res: ApiMapValue = {};

    data.forEach((value, key) => {
      const components = key.toArray();
      merge(res, value, components, 0);
    });

    return new DocumentSnapshot(ref, res);
  }

  /**
   * True if the document exists.
   *
   * @type {boolean}
   * @name DocumentSnapshot#exists
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then((documentSnapshot) => {
   *   if (documentSnapshot.exists) {
   *     console.log(`Data: ${JSON.stringify(documentSnapshot.data())}`);
   *   }
   * });
   */
  get exists(): boolean {
    return this._fieldsProto !== undefined;
  }

  /**
   * A [DocumentReference]{@link DocumentReference} for the document
   * stored in this snapshot.
   *
   * @type {DocumentReference}
   * @name DocumentSnapshot#ref
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then((documentSnapshot) => {
   *   if (documentSnapshot.exists) {
   *     console.log(`Found document at '${documentSnapshot.ref.path}'`);
   *   }
   * });
   */
  get ref(): DocumentReference {
    return this._ref;
  }

  /**
   * The ID of the document for which this DocumentSnapshot contains data.
   *
   * @type {string}
   * @name DocumentSnapshot#id
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then((documentSnapshot) => {
   *   if (documentSnapshot.exists) {
   *     console.log(`Document found with name '${documentSnapshot.id}'`);
   *   }
   * });
   */
  get id(): string {
    return this._ref.id;
  }

  /**
   * The time the document was created. Undefined for documents that don't
   * exist.
   *
   * @type {Timestamp|undefined}
   * @name DocumentSnapshot#createTime
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   if (documentSnapshot.exists) {
   *     let createTime = documentSnapshot.createTime;
   *     console.log(`Document created at '${createTime.toDate()}'`);
   *   }
   * });
   */
  get createTime(): Timestamp|undefined {
    return this._createTime;
  }

  /**
   * The time the document was last updated (at the time the snapshot was
   * generated). Undefined for documents that don't exist.
   *
   * @type {Timestamp|undefined}
   * @name DocumentSnapshot#updateTime
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   if (documentSnapshot.exists) {
   *     let updateTime = documentSnapshot.updateTime;
   *     console.log(`Document updated at '${updateTime.toDate()}'`);
   *   }
   * });
   */
  get updateTime(): Timestamp|undefined {
    return this._updateTime;
  }

  /**
   * The time this snapshot was read.
   *
   * @type {Timestamp}
   * @name DocumentSnapshot#readTime
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   let readTime = documentSnapshot.readTime;
   *   console.log(`Document read at '${readTime.toDate()}'`);
   * });
   */
  get readTime(): Timestamp {
    if (this._readTime === undefined) {
      throw new Error(`Called 'readTime' on a local document`);
    }
    return this._readTime;
  }

  /**
   * Retrieves all fields in the document as an object. Returns 'undefined' if
   * the document doesn't exist.
   *
   * @returns {DocumentData|undefined} An object containing all fields in the
   * document or 'undefined' if the document doesn't exist.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   let data = documentSnapshot.data();
   *   console.log(`Retrieved data: ${JSON.stringify(data)}`);
   * });
   */
  data(): DocumentData|undefined {
    const fields = this._fieldsProto;

    if (fields === undefined) {
      return undefined;
    }

    const obj: DocumentData = {};
    for (const prop in fields) {
      if (fields.hasOwnProperty(prop)) {
        obj[prop] = this._serializer.decodeValue(fields[prop]);
      }
    }
    return obj;
  }

  /**
   * Retrieves the field specified by `field`.
   *
   * @param {string|FieldPath} field The field path
   * (e.g. 'foo' or 'foo.bar') to a specific field.
   * @returns {*} The data at the specified field location or undefined if no
   * such field exists.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.set({ a: { b: 'c' }}).then(() => {
   *   return documentRef.get();
   * }).then(documentSnapshot => {
   *   let field = documentSnapshot.get('a.b');
   *   console.log(`Retrieved field value: ${field}`);
   * });
   */
  get(field: string|FieldPath): UserInput {
    this._validator.isFieldPath('field', field);

    const protoField = this.protoField(field);

    if (protoField === undefined) {
      return undefined;
    }

    return this._serializer.decodeValue(protoField);
  }

  /**
   * Retrieves the field specified by 'fieldPath' in its Protobuf JS
   * representation.
   *
   * @private
   * @param field The path (e.g. 'foo' or 'foo.bar') to a specific field.
   * @returns The Protobuf-encoded data at the specified field location or
   * undefined if no such field exists.
   */
  protoField(field: string|FieldPath): api.IValue|undefined {
    let fields: ApiMapValue|api.IValue|undefined = this._fieldsProto;

    if (fields === undefined) {
      return undefined;
    }

    const components = FieldPath.fromArgument(field).toArray();
    while (components.length > 1) {
      fields = fields![components.shift()!] as api.IValue;

      if (!fields || !fields.mapValue) {
        return undefined;
      }

      fields = fields.mapValue.fields!;
    }

    return fields[components[0]];
  }

  /**
   * Checks whether this DocumentSnapshot contains any fields.
   *
   * @private
   * @return {boolean}
   */
  get isEmpty(): boolean {
    return is.undefined(this._fieldsProto) || is.empty(this._fieldsProto);
  }

  /**
   * Convert a document snapshot to the Firestore 'Document' Protobuf.
   *
   * @private
   * @returns The document in the format the API expects.
   */
  toProto(): api.IWrite|null {
    return {
      update: {
        name: this._ref.formattedName,
        fields: this._fieldsProto,
      },
    };
  }

  /**
   * Returns true if the document's data and path in this `DocumentSnapshot` is
   * equal to the provided value.
   *
   * @param {*} other The value to compare against.
   * @return {boolean} true if this `DocumentSnapshot` is equal to the provided
   * value.
   */
  isEqual(other: DocumentSnapshot): boolean {
    // Since the read time is different on every document read, we explicitly
    // ignore all document metadata in this comparison.
    return (
        this === other ||
        ((other instanceof DocumentSnapshot) && this._ref.isEqual(other._ref) &&
         deepEqual(this._fieldsProto, other._fieldsProto, {strict: true})));
  }
}

/**
 * A QueryDocumentSnapshot contains data read from a document in your
 * Firestore database as part of a query. The document is guaranteed to exist
 * and its data can be extracted with [data()]{@link QueryDocumentSnapshot#data}
 * or [get()]{@link DocumentSnapshot#get} to get a specific field.
 *
 * A QueryDocumentSnapshot offers the same API surface as a
 * {@link DocumentSnapshot}. Since query results contain only existing
 * documents, the [exists]{@link DocumentSnapshot#exists} property will
 * always be true and [data()]{@link QueryDocumentSnapshot#data} will never
 * return 'undefined'.
 *
 * @class
 * @extends DocumentSnapshot
 */
export class QueryDocumentSnapshot extends DocumentSnapshot {
  /**
   * @private
   * @hideconstructor
   *
   * @param ref The reference to the document.
   * @param fieldsProto The fields of the Firestore `Document` Protobuf backing
   * this document.
   * @param readTime The time when this snapshot was read.
   * @param createTime The time when the document was created.
   * @param updateTime The time when the document was last updated.
   */
  constructor(
      ref: DocumentReference, fieldsProto: ApiMapValue, readTime: Timestamp,
      createTime: Timestamp, updateTime: Timestamp) {
    super(ref, fieldsProto, readTime, createTime, updateTime);
  }

  /**
   * The time the document was created.
   *
   * @type {Timestamp}
   * @name QueryDocumentSnapshot#createTime
   * @readonly
   * @override
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.get().forEach(snapshot => {
   *   console.log(`Document created at '${snapshot.createTime.toDate()}'`);
   * });
   */
  get createTime(): Timestamp {
    return super.createTime!;
  }

  /**
   * The time the document was last updated (at the time the snapshot was
   * generated).
   *
   * @type {Timestamp}
   * @name QueryDocumentSnapshot#updateTime
   * @readonly
   * @override
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.get().forEach(snapshot => {
   *   console.log(`Document updated at '${snapshot.updateTime.toDate()}'`);
   * });
   */
  get updateTime(): Timestamp {
    return super.updateTime!;
  }

  /**
   * Retrieves all fields in the document as an object.
   *
   * @override
   *
   * @returns {DocumentData} An object containing all fields in the document.
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.get().forEach(documentSnapshot => {
   *   let data = documentSnapshot.data();
   *   console.log(`Retrieved data: ${JSON.stringify(data)}`);
   * });
   */
  data(): DocumentData {
    const data = super.data();
    if (!data) {
      throw new Error(
          'The data in a QueryDocumentSnapshot should always exist.');
    }
    return data;
  }
}

/**
 * A Firestore Document Mask contains the field paths affected by an update.
 *
 * @class
 * @private
 */
export class DocumentMask {
  private _sortedPaths: FieldPath[];

  /**
   * @private
   * @hideconstructor
   *
   * @param fieldPaths The field paths in this mask.
   */
  constructor(fieldPaths: FieldPath[]) {
    this._sortedPaths = fieldPaths;
    this._sortedPaths.sort((a, b) => a.compareTo(b));
  }

  /**
   * Creates a document mask with the field paths of a document.
   *
   * @private
   * @param data A map with fields to modify. Only the keys are used to extract
   * the document mask.
   */
  static fromUpdateMap(data: UpdateData): DocumentMask {
    const fieldPaths: FieldPath[] = [];

    data.forEach((value, key) => {
      if (!(value instanceof FieldTransform) || value.includeInDocumentMask) {
        fieldPaths.push(FieldPath.fromArgument(key));
      }
    });

    return new DocumentMask(fieldPaths);
  }

  /**
   * Creates a document mask from an array of field paths.
   *
   * @private
   * @param fieldMask A list of field paths.
   */
  static fromFieldMask(fieldMask: Array<string|FieldPath>): DocumentMask {
    const fieldPaths: FieldPath[] = [];

    for (const fieldPath of fieldMask) {
      fieldPaths.push(FieldPath.fromArgument(fieldPath));
    }

    return new DocumentMask(fieldPaths);
  }

  /**
   * Creates a document mask with the field names of a document.
   *
   * @private
   * @param data An object with fields to modify. Only the keys are used to
   * extract the document mask.
   */
  static fromObject(data: DocumentData): DocumentMask {
    const fieldPaths: FieldPath[] = [];

    function extractFieldPaths(
        currentData: DocumentData, currentPath?: FieldPath): void {
      let isEmpty = true;

      for (const key in currentData) {
        if (currentData.hasOwnProperty(key)) {
          isEmpty = false;

          // We don't split on dots since fromObject is called with
          // DocumentData.
          const childSegment = new FieldPath(key);
          const childPath =
              currentPath ? currentPath.append(childSegment) : childSegment;
          const value = currentData[key];
          if (value instanceof FieldTransform) {
            if (value.includeInDocumentMask) {
              fieldPaths.push(childPath);
            }
          } else if (isPlainObject(value)) {
            extractFieldPaths(value, childPath);
          } else {
            fieldPaths.push(childPath);
          }
        }
      }

      // Add a field path for an explicitly updated empty map.
      if (currentPath && isEmpty) {
        fieldPaths.push(currentPath);
      }
    }

    extractFieldPaths(data);

    return new DocumentMask(fieldPaths);
  }

  /**
   * Returns true if this document mask contains no fields.
   *
   * @private
   * @return {boolean} Whether this document mask is empty.
   */
  get isEmpty() {
    return this._sortedPaths.length === 0;
  }

  /**
   * Removes the specified values from a sorted field path array.
   *
   * @private
   * @param input A sorted array of FieldPaths.
   * @param values An array of FieldPaths to remove.
   */
  private static removeFromSortedArray(input: FieldPath[], values: FieldPath[]):
      void {
    for (let i = 0; i < input.length;) {
      let removed = false;

      for (const fieldPath of values) {
        if (input[i].isEqual(fieldPath)) {
          input.splice(i, 1);
          removed = true;
          break;
        }
      }

      if (!removed) {
        ++i;
      }
    }
  }

  /**
   * Removes the field path specified in 'fieldPaths' from this document mask.
   *
   * @private
   * @param fieldPaths An array of FieldPaths.
   */
  removeFields(fieldPaths: FieldPath[]): void {
    DocumentMask.removeFromSortedArray(this._sortedPaths, fieldPaths);
  }

  /**
   * Returns whether this document mask contains 'fieldPath'.
   *
   * @private
   * @param fieldPath The field path to test.
   * @return Whether this document mask contains 'fieldPath'.
   */
  contains(fieldPath: FieldPath): boolean {
    for (const sortedPath of this._sortedPaths) {
      const cmp = sortedPath.compareTo(fieldPath);

      if (cmp === 0) {
        return true;
      } else if (cmp > 0) {
        return false;
      }
    }

    return false;
  }

  /**
   * Removes all properties from 'data' that are not contained in this document
   * mask.
   *
   * @private
   * @param data An object to filter.
   * @return A shallow copy of the object filtered by this document mask.
   */
  applyTo(data: object): object {
    /*!
     * Applies this DocumentMask to 'data' and computes the list of field paths
     * that were specified in the mask but are not present in 'data'.
     */
    const applyDocumentMask = data => {
      const remainingPaths = this._sortedPaths.slice(0);

      const processObject = (currentData, currentPath?) => {
        let result: {}|null = null;

        Object.keys(currentData).forEach(key => {
          const childPath =
              currentPath ? currentPath.append(key) : new FieldPath(key);
          if (this.contains(childPath)) {
            DocumentMask.removeFromSortedArray(remainingPaths, [childPath]);
            result = result || {};
            result[key] = currentData[key];
          } else if (is.object(currentData[key])) {
            const childObject = processObject(currentData[key], childPath);
            if (childObject) {
              result = result || {};
              result[key] = childObject;
            }
          }
        });

        return result;
      };

      // processObject() returns 'null' if the DocumentMask is empty.
      const filteredData = processObject(data) || {};

      return {
        filteredData,
        remainingPaths,
      };
    };

    const result = applyDocumentMask(data);

    if (result.remainingPaths.length !== 0) {
      throw new Error(`Input data is missing for field "${
          result.remainingPaths[0].toString()}".`);
    }

    return result.filteredData;
  }

  /**
   * Converts a document mask to the Firestore 'DocumentMask' Proto.
   *
   * @private
   * @returns A Firestore 'DocumentMask' Proto.
   */
  toProto(): api.IDocumentMask {
    if (this.isEmpty) {
      return {};
    }

    const encodedPaths: string[] = [];
    for (const fieldPath of this._sortedPaths) {
      encodedPaths.push(fieldPath.formattedName);
    }

    return {
      fieldPaths: encodedPaths,
    };
  }
}

/**
 * A Firestore Document Transform.
 *
 * A DocumentTransform contains pending server-side transforms and their
 * corresponding field paths.
 *
 * @private
 * @class
 */
export class DocumentTransform {
  private readonly _ref: DocumentReference;
  private readonly _validator: AnyDuringMigration;
  private readonly _transforms: Map<FieldPath, FieldTransform>;
  /**
   * @private
   * @hideconstructor
   *
   * @param ref The DocumentReference for this transform.
   * @param transforms A Map of FieldPaths to FieldTransforms.
   */
  constructor(ref: DocumentReference, transforms) {
    this._ref = ref;
    this._validator = ref.firestore._validator;
    this._transforms = transforms;
  }
  /**
   * Generates a DocumentTransform from a JavaScript object.
   *
   * @private
   * @param ref The `DocumentReference` to use for the DocumentTransform.
   * @param obj The object to extract the transformations from.
   * @returns The Document Transform.
   */
  static fromObject(ref: DocumentReference, obj: DocumentData):
      DocumentTransform {
    const updateMap = new Map<FieldPath, FieldTransform>();

    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        updateMap.set(new FieldPath(prop), obj[prop]);
      }
    }

    return DocumentTransform.fromUpdateMap(ref, updateMap);
  }

  /**
   * Generates a DocumentTransform from an Update Map.
   *
   * @private
   * @param ref The `DocumentReference` to use for the DocumentTransform.
   * @param data The update data to extract the transformations from.
   * @returns The Document Transform.
   */
  static fromUpdateMap(ref: DocumentReference, data: UpdateData):
      DocumentTransform {
    const transforms = new Map<FieldPath, FieldTransform>();

    function encode_(val, path, allowTransforms) {
      if (val instanceof FieldTransform && val.includeInDocumentTransform) {
        if (allowTransforms) {
          transforms.set(path, val);
        } else {
          throw new Error(
              `${val.methodName}() is not supported inside of array values.`);
        }
      } else if (is.array(val)) {
        for (let i = 0; i < val.length; ++i) {
          // We need to verify that no array value contains a document transform
          encode_(val[i], path.append(String(i)), false);
        }
      } else if (isPlainObject(val)) {
        for (const prop in val) {
          if (val.hasOwnProperty(prop)) {
            encode_(
                val[prop], path.append(new FieldPath(prop)), allowTransforms);
          }
        }
      }
    }

    data.forEach((value, key) => {
      encode_(value, FieldPath.fromArgument(key), true);
    });

    return new DocumentTransform(ref, transforms);
  }

  /**
   * Whether this DocumentTransform contains any actionable transformations.
   *
   * @private
   */
  get isEmpty(): boolean {
    return this._transforms.size === 0;
  }

  /**
   * Returns the array of fields in this DocumentTransform.
   *
   * @private
   */
  get fields(): FieldPath[] {
    return Array.from(this._transforms.keys());
  }

  /**
   * Validates the user provided field values in this document transform.
   * @private
   */
  validate(): void {
    this._transforms.forEach(transform => transform.validate(this._validator));
  }

  /**
   * Converts a document transform to the Firestore 'DocumentTransform' Proto.
   *
   * @private
   * @param serializer The Firestore serializer
   * @returns A Firestore 'DocumentTransform' Proto or 'null' if this transform
   * is empty.
   */
  toProto(serializer: Serializer): api.IWrite|null {
    if (this.isEmpty) {
      return null;
    }

    const protoTransforms: Array<{}> = [];
    this._transforms.forEach((transform, path) => {
      protoTransforms.push(transform.toProto(serializer, path));
    });

    return {
      transform: {
        document: this._ref.formattedName,
        fieldTransforms: protoTransforms,
      },
    };
  }
}

/*!
 * A Firestore Precondition encapsulates options for database writes.
 *
 * @private
 * @class
 */
export class Precondition {
  private _exists?: boolean;
  private _lastUpdateTime?: Timestamp;

  /**
   * @private
   * @hideconstructor
   *
   * @param options.exists - Whether the referenced document should exist in
   * Firestore,
   * @param options.lastUpdateTime - The last update time of the referenced
   * document in Firestore.
   * @param options
   */
  constructor(options?: {exists?: boolean, lastUpdateTime?: Timestamp}) {
    if (options !== undefined) {
      this._exists = options.exists;
      this._lastUpdateTime = options.lastUpdateTime;
    }
  }

  /**
   * Generates the Protobuf `Preconditon` object for this precondition.
   *
   * @private
   * @returns The `Preconditon` Protobuf object or 'null' if there are no
   * preconditions.
   */
  toProto(): api.IPrecondition|null {
    if (this.isEmpty) {
      return null;
    }

    const proto: api.IPrecondition = {};

    if (this._lastUpdateTime !== undefined) {
      proto.updateTime = this._lastUpdateTime!.toProto().timestampValue;
    } else {
      proto.exists = this._exists;
    }

    return proto;
  }

  /**
   * Whether this DocumentTransform contains any enforcement.
   *
   * @private
   */
  get isEmpty(): boolean {
    return this._exists === undefined && !this._lastUpdateTime;
  }
}

/**
 * Validates the use of 'options' as a Precondition and enforces that 'exists'
 * and 'lastUpdateTime' use valid types.
 *
 * @private
 * @param options.exists Whether the referenced document should exist.
 * @param options.lastUpdateTime The last update time of the referenced
 * document in Firestore.
 * @param allowExist Whether to allow the 'exists' preconditions.
 * @returns 'true' if the input is a valid Precondition.
 */
export function validatePrecondition(
    precondition: {exists?: boolean, lastUpdateTime?: Timestamp},
    allowExist: boolean): boolean {
  if (!is.object(precondition)) {
    throw new Error('Input is not an object.');
  }

  let conditions = 0;

  if (precondition.exists !== undefined) {
    ++conditions;
    if (!allowExist) {
      throw new Error('"exists" is not an allowed condition.');
    }
    if (!is.boolean(precondition.exists)) {
      throw new Error('"exists" is not a boolean.');
    }
  }

  if (precondition.lastUpdateTime !== undefined) {
    ++conditions;
    if (!(precondition.lastUpdateTime instanceof Timestamp)) {
      throw new Error('"lastUpdateTime" is not a Firestore Timestamp.');
    }
  }

  if (conditions > 1) {
    throw new Error('Input contains more than one condition.');
  }

  return true;
}

/**
 * Validates the use of 'options' as SetOptions and enforces that 'merge' is a
 * boolean.
 *
 * @private
 * @param options.merge - Whether set() should merge the provided data into an
 * existing document.
 * @param options.mergeFields - Whether set() should only merge the specified
 * set of fields.
 * @returns 'true' if the input is a valid SetOptions object.
 */
export function validateSetOptions(
    options: {merge?: boolean, mergeFields?: string[]}): boolean {
  if (!is.object(options)) {
    throw new Error('Input is not an object.');
  }

  if (options.merge !== undefined && !is.boolean(options.merge)) {
    throw new Error('"merge" is not a boolean.');
  }

  if (options.mergeFields !== undefined) {
    if (!is.array(options.mergeFields)) {
      throw new Error('"mergeFields" is not an array.');
    }

    for (let i = 0; i < options.mergeFields.length; ++i) {
      try {
        FieldPath.validateFieldPath(options.mergeFields[i]);
      } catch (err) {
        throw new Error(
            `Element at index ${i} is not a valid FieldPath. ${err.message}`);
      }
    }
  }

  if (options.merge !== undefined && options.mergeFields !== undefined) {
    throw new Error('You cannot specify both "merge" and "mergeFields".');
  }

  return true;
}
