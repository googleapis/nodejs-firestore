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

const assert = require('assert');
const is = require('is');

const path = require('./path');

/*!
 * @see {ResourcePath}
 */
const ResourcePath = path.ResourcePath;

/*!
 * @see {FieldPath}
 */
const FieldPath = path.FieldPath;

/*!
 * @see {FieldValue}
 */
const FieldValue = require('./field-value');

/*!
 * Injected.
 *
 * @see {DocumentReference}
 */
let DocumentReference;

/*! Injected. */
let validate;

/*!
 * The maximum depth of a Firestore object.
 *
 * @type {number}
 */
const MAX_DEPTH = 20;

/*!
 * Number of nanoseconds in a millisecond.
 *
 * @type {number}
 */
const MS_TO_NANOS = 1000000;

/*!
 * Protocol constant for the ServerTimestamp transform.
 *
 * @type {string}
 */
const SERVER_TIMESTAMP = 'REQUEST_TIME';

/**
 * An immutable object representing a geographic location in Firestore. The
 * location is represented as a latitude/longitude pair.
 *
 * @class
 */
class GeoPoint {
  /**
   * Creates a [GeoPoint]{@link GeoPoint}.
   *
   * @param {number} latitude The latitude as a number between -90 and 90.
   * @param {number} longitude The longitude as a number between -180 and 180.
   *
   * @example
   * let data = {
   *   google: new Firestore.GeoPoint(37.422, 122.084)
   * };
   *
   * firestore.doc('col/doc').set(data).then(() => {
   *   console.log(`Location is ${data.google.latitude}, ` +
   *     `${data.google.longitude}`);
   * });
   */
  constructor(latitude, longitude) {
    validate.isNumber('latitude', latitude);
    validate.isNumber('longitude', longitude);

    this._latitude = latitude;
    this._longitude = longitude;
  }

  /**
   * The latitude as a number between -90 and 90.
   *
   * @type {number}
   * @name GeoPoint#latitude
   * @readonly
   */
  get latitude() {
    return this._latitude;
  }

  /**
   * The longitude as a number between -180 and 180.
   *
   * @type {number}
   * @name GeoPoint#longitude
   * @readonly
   */
  get longitude() {
    return this._longitude;
  }

  /**
   * Converts the GeoPoint to a google.type.LatLng proto.
   * @private
   */
  toProto() {
    return {
      latitude: this._latitude,
      longitude: this._longitude,
    };
  }

  /**
   * Converts a google.type.LatLng proto to its GeoPoint representation.
   * @private
   */
  static fromProto(proto) {
    return new GeoPoint(proto.latitude, proto.longitude);
  }
}

/**
 * A DocumentSnapshot is an immutable representation for a document in a
 * Firestore database. The data can be extracted with
 * [data()]{@link DocumentSnapshot#data} or
 * [get(fieldPath)]{@link DocumentSnapshot#get} to get a
 * specific field.
 *
 * <p>The snapshot can point to a non-existing document in which case
 * [exists]{@link DocumentSnapshot#exists} will return false.
 * Calling [data()]{@link DocumentSnapshot#data} or
 * [get(fieldPath)]{@link DocumentSnapshot#get} for such a document
 * throws an error.
 *
 * @class
 */
class DocumentSnapshot {
  /**
   * @private
   * @hideconstructor
   *
   * @param {firestore/DocumentReference} ref - The reference to the
   * document.
   * @param {object=} fieldsProto - The fields of the Firestore `Document`
   * Protobuf backing this document (or undefined if the document does not
   * exist).
   * @param {string} readTime - The ISO 8601 time when this snapshot was read.
   * @param {string=} createTime - The ISO 8601 time when the document was
   * created (or undefined if the document does not exist).
   * @param {string=} updateTime - The ISO 8601 time when the document was last
   * updated (or undefined if the document does not exist).
   */
  constructor(ref, fieldsProto, readTime, createTime, updateTime) {
    this._ref = ref;
    this._fieldsProto = fieldsProto;
    this._readTime = readTime;
    this._createTime = createTime;
    this._updateTime = updateTime;
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
  get exists() {
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
  get ref() {
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
  get id() {
    return this._ref.id;
  }

  /**
   * The time the document was created. Undefined for documents that don't
   * exist.
   *
   * @type {string}
   * @name DocumentSnapshot#createTime
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then((documentSnapshot) => {
   *   if (documentSnapshot.exists) {
   *     console.log(`Document created at '${documentSnapshot.createTime}'`);
   *   }
   * });
   */
  get createTime() {
    return this._createTime;
  }

  /**
   * The time the document was last updated (at the time the snapshot was
   * generated). Undefined for documents that don't exist.
   *
   * @type {string}
   * @name DocumentSnapshot#updateTime
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then((documentSnapshot) => {
   *   if (documentSnapshot.exists) {
   *     console.log(`Document updated at '${documentSnapshot.updateTime}'`);
   *   }
   * });
   */
  get updateTime() {
    return this._updateTime;
  }

  /**
   * The time this snapshot was read.
   *
   * @type {string}
   * @name DocumentSnapshot#readTime
   * @readonly
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then((documentSnapshot) => {
   *   console.log(`Document read at '${documentSnapshot.readTime}'`);
   * });
   */
  get readTime() {
    return this._readTime;
  }

  /**
   * Retrieves all fields in the document as an object.
   *
   * @returns {DocumentData} An object containing all fields in the document.
   *
   * @example
   * let documentRef = firestore.doc('col/doc');
   *
   * documentRef.get().then(documentSnapshot => {
   *   let data = documentSnapshot.data();
   *   console.log(`Retrieved data: ${JSON.stringify(data)}`);
   * });
   */
  data() {
    let obj = {};
    let fields = this.protoFields();

    for (let prop in fields) {
      if (fields.hasOwnProperty(prop)) {
        obj[prop] = this._decodeValue(fields[prop]);
      }
    }

    return obj;
  }

  /**
   * Returns the underlying Firestore 'Fields' Protobuf.
   *
   * @private
   * @returns {Object} The Protobuf encoded document.
   */
  protoFields() {
    if (this._fieldsProto === undefined) {
      throw new Error(
        `The data for "${this._ref.formattedName}" does not exist.`
      );
    }

    return this._fieldsProto;
  }

  /**
   * Retrieves the field specified by `fieldPath`.
   *
   * @param {string|FieldPath} field - The field path
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
  get(field) {
    validate.isFieldPath('field', field);

    let protoField = this.protoField(field);

    if (protoField === undefined) {
      return undefined;
    }

    return this._decodeValue(protoField);
  }

  /**
   * Retrieves the field specified by 'fieldPath' in its Protobuf
   * representation.
   *
   * @private
   * @param {string|FieldPath} field - The path (e.g. 'foo' or
   * 'foo.bar') to a specific field.
   * @returns {*} The Protobuf-encoded data at the specified field location or
   * undefined if no such field exists.
   */
  protoField(field) {
    let components = FieldPath.fromArgument(field).toArray();
    let fields = this.protoFields();

    while (components.length > 1) {
      fields = fields[components.shift()];

      if (!fields || !fields.mapValue) {
        return undefined;
      }

      fields = fields.mapValue.fields;
    }

    return fields[components[0]];
  }

  /**
   * Decodes a single Firestore 'Value' Protobuf.
   *
   * @private
   * @param proto - A Firestore 'Value' Protobuf.
   * @returns {*} The converted JS type.
   */
  _decodeValue(proto) {
    switch (proto.valueType) {
      case 'stringValue': {
        return proto.stringValue;
      }
      case 'booleanValue': {
        return proto.booleanValue;
      }
      case 'integerValue': {
        return parseInt(proto.integerValue, 10);
      }
      case 'doubleValue': {
        return parseFloat(proto.doubleValue, 10);
      }
      case 'timestampValue': {
        return new Date(
          proto.timestampValue.seconds * 1000 +
            proto.timestampValue.nanos / MS_TO_NANOS
        );
      }
      case 'referenceValue': {
        return new DocumentReference(
          this.ref.firestore,
          ResourcePath.fromSlashSeparatedString(proto.referenceValue)
        );
      }
      case 'arrayValue': {
        let array = [];
        for (let i = 0; i < proto.arrayValue.values.length; ++i) {
          array.push(this._decodeValue(proto.arrayValue.values[i]));
        }
        return array;
      }
      case 'nullValue': {
        return null;
      }
      case 'mapValue': {
        let obj = {};
        let fields = proto.mapValue.fields;

        for (let prop in fields) {
          if (fields.hasOwnProperty(prop)) {
            obj[prop] = this._decodeValue(fields[prop]);
          }
        }

        return obj;
      }
      case 'geoPointValue': {
        return GeoPoint.fromProto(proto.geoPointValue);
      }
      case 'bytesValue': {
        return proto.bytesValue;
      }
      default: {
        throw new Error(
          'Cannot decode type from Firestore Value: ' + JSON.stringify(proto)
        );
      }
    }
  }

  /**
   * Convert a document snapshot to the Firestore 'Document' Protobuf.
   *
   * @private
   * @returns {Object} - The document in the format the API expects.
   */
  toProto() {
    return {
      name: this._ref.formattedName,
      fields: this._fieldsProto,
    };
  }

  /**
   * Converts a Google Protobuf timestamp to an ISO 8601 string.
   *
   * @private
   * @param {{seconds:number,nanos:number}=} timestamp The Google Protobuf
   * timestamp.
   * @returns {string|undefined} The representation in ISO 8601 or undefined if
   * the input is empty.
   */
  static toISOTime(timestamp) {
    if (timestamp) {
      let isoSubstring = new Date(timestamp.seconds * 1000).toISOString();

      // Strip milliseconds from JavaScript ISO representation
      // (YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ)
      isoSubstring = isoSubstring.substr(0, isoSubstring.length - 4);

      // Append nanoseconds as per ISO 8601
      let nanoString = timestamp.nanos + '';
      while (nanoString.length < 9) {
        nanoString = '0' + nanoString;
      }

      return isoSubstring + nanoString + 'Z';
    }

    return undefined;
  }

  /**
   * Encodes a JavaScrip object into the Firestore 'Fields' representation.
   *
   * @private
   * @param {Object} obj The object to encode
   * @param {number=} depth The depth at the current encoding level
   * @returns {Object} The Firestore 'Fields' representation
   */
  static encodeFields(obj, depth) {
    if (!is.defined(depth)) {
      depth = 1;
    }

    let fields = {};

    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        let val = DocumentSnapshot.encodeValue(obj[prop], depth);

        if (val) {
          fields[prop] = val;
        }
      }
    }

    return fields;
  }

  /**
   * Encodes a JavaScrip value into the Firestore 'Value' representation.
   * Encodes a JavaScrip value into the Firestore 'Value' represntation.
   *
   * @private
   * @param {Object} val The object to encode
   * @param {number=} depth The depth at the current encoding level
   * @returns {object|null} The Firestore Proto or null if we are deleting a
   * field.
   */
  static encodeValue(val, depth) {
    if (!is.defined(depth)) {
      depth = 1;
    }

    if (val === FieldValue.DELETE_SENTINEL) {
      return null;
    }

    if (val === FieldValue.SERVER_TIMESTAMP_SENTINEL) {
      return null;
    }

    if (is.string(val)) {
      return {
        valueType: 'stringValue',
        stringValue: val,
      };
    }

    if (is.boolean(val)) {
      return {
        valueType: 'booleanValue',
        booleanValue: val,
      };
    }

    if (is.integer(val)) {
      return {
        valueType: 'integerValue',
        integerValue: val,
      };
    }

    // Integers are handled above, the remaining numbers are treated as doubles
    if (is.number(val)) {
      return {
        valueType: 'doubleValue',
        doubleValue: val,
      };
    }

    if (is.date(val)) {
      let epochSeconds = Math.floor(val.getTime() / 1000);
      let timestamp = {
        seconds: epochSeconds,
        nanos: (val.getTime() - epochSeconds * 1000) * MS_TO_NANOS,
      };
      return {
        valueType: 'timestampValue',
        timestampValue: timestamp,
      };
    }

    if (is.array(val)) {
      let encodedElements = [];
      for (let i = 0; i < val.length; ++i) {
        let enc = DocumentSnapshot.encodeValue(val[i], depth + 1);
        if (enc) {
          encodedElements.push(enc);
        }
      }
      return {
        valueType: 'arrayValue',
        arrayValue: {
          values: encodedElements,
        },
      };
    }

    if (is.nil(val)) {
      return {
        valueType: 'nullValue',
        nullValue: 'NULL_VALUE',
      };
    }

    if (is.instance(val, DocumentReference) || is.instance(val, ResourcePath)) {
      return {
        valueType: 'referenceValue',
        referenceValue: val.formattedName,
      };
    }

    if (is.instance(val, GeoPoint)) {
      return {
        valueType: 'geoPointValue',
        geoPointValue: val.toProto(),
      };
    }

    if (is.instanceof(val, Buffer) || is.instanceof(val, Uint8Array)) {
      return {
        valueType: 'bytesValue',
        bytesValue: val,
      };
    }

    if (isPlainObject(val)) {
      return {
        valueType: 'mapValue',
        mapValue: {
          fields: DocumentSnapshot.encodeFields(val, depth + 1),
        },
      };
    }

    throw new Error(
      'Cannot encode type (' +
        Object.prototype.toString.call(val) +
        ') to a Firestore Value'
    );
  }

  /**
   * Expands top-level field paths in a JavaScript map. This is required
   * for storing objects in Firestore.
   *
   * This functions turns { foo.bar : foobar } into { foo { bar : foobar }}
   *
   * @private
   * @param {Map.<string|FieldPath, *>} data - The field/value map to expand.
   * @returns {DocumentData} The expanded JavaScript object.
   */
  static expandMap(data) {
    /**
     * Merges 'value' at the field path specified by the path array into
     * 'target'.
     */
    function merge(target, value, path, pos) {
      let key = path[pos];
      let isLast = pos === path.length - 1;

      if (!is.defined(target[key])) {
        if (isLast) {
          // The merge is done.
          target[key] = value;
        } else {
          // We need to expand the target object.
          target[key] = {};
          merge(target[key], value, path, pos + 1);
        }
      } else if (isPlainObject(target[key])) {
        if (isLast) {
          // The existing object has deeper nesting that the value we are trying
          // to merge.
          throw new Error(
            `Field "${path.join('.')}" has conflicting definitions.`
          );
        } else {
          merge(target[key], value, path, pos + 1);
        }
      } else {
        // We are trying to merge an object with a primitive.
        throw new Error(
          `Field "${path.slice(0, pos + 1).join('.')}" has ` +
            `conflicting definitions.`
        );
      }
    }

    let res = {};

    data.forEach((value, key) => {
      let components = FieldPath.fromArgument(key).toArray();
      merge(res, value, components, 0);
    });

    return res;
  }
}

/**
 * Returns a builder for DocumentSnapshot instances. Invoke `.build()' to
 * assemble the final snapshot.
 *
 * @private
 * @class DocumentSnapshotBuilder
 */
class DocumentSnapshotBuilder {
  /**
   * @private
   * @hideconstructor
   *
   * @param {DocumentSnapshot=} snapshot An optional snapshot to base this
   * builder on.
   */
  constructor(snapshot) {
    snapshot = snapshot || {};

    /**
     * The reference to the document.
     *
     * @type {DocumentReference}
     */
    this.ref = snapshot._ref;

    /**
     * The fields of the Firestore `Document` Protobuf backing this document.
     *
     * @type {object}
     */
    this.fieldsProto = snapshot._fieldsProto;

    /**
     * The ISO 8601 time when this document was read.
     *
     * @type {string}
     */
    this.readTime = snapshot._readTime;

    /**
     * The ISO 8601 time when this document was created.
     *
     * @type {string}
     */
    this.createTime = snapshot._createTime;

    /**
     * The ISO 8601 time when this document was last updated.
     *
     * @type {string}
     */
    this.updateTime = snapshot._updateTime;
  }

  /**
   * Builds the DocumentSnapshot.
   *
   * @private
   * @returns {Object} A Builder instance for a DocumentSnapshot.
   */
  build() {
    assert(
      is.defined(this.fieldsProto) === is.defined(this.createTime),
      'Create time should be set iff document exists.'
    );
    assert(
      is.defined(this.fieldsProto) === is.defined(this.updateTime),
      'Update time should be set iff document exists.'
    );
    return new DocumentSnapshot(
      this.ref,
      this.fieldsProto,
      this.readTime,
      this.createTime,
      this.updateTime
    );
  }
}

/**
 * @private
 * @name DocumentSnapshot.DocumentSnapshotBuilder
 * @see DocumentSnapshotBuilder
 */
DocumentSnapshot.Builder = DocumentSnapshotBuilder;

/**
 * A Firestore Document Mask contains the field paths affected by an update.
 *
 * @class
 * @private
 */
class DocumentMask {
  /**
   * @private
   * @hideconstructor
   *
   * @param {Array.<string>} fieldPaths - The canonical representation of field
   * paths in this mask.
   */
  constructor(fieldPaths) {
    this._fieldPaths = fieldPaths;
  }

  /**
   * Converts a document mask to the Firestore 'DocumentMask' Proto.
   *
   * @private
   * @returns {Object} A Firestore 'DocumentMask' Proto.
   */
  toProto() {
    return {
      fieldPaths: this._fieldPaths,
    };
  }

  /**
   * Creates a document mask with the field paths of a document.
   *
   * @private
   * @param {Map.<string|FieldPath, *>} data A map with
   * fields to modify. Only the keys are used to extract the document mask.
   * @returns {DocumentMask}
   */
  static fromMap(data) {
    let fieldPaths = [];

    data.forEach((value, key) => {
      if (value !== FieldValue.SERVER_TIMESTAMP_SENTINEL) {
        fieldPaths.push(FieldPath.fromArgument(key).formattedName);
      }
    });

    return new DocumentMask(fieldPaths);
  }

  /**
   * Creates a document mask with the field names of a document.
   *
   * @private
   * @param {DocumentData} data An object with fields to modify. Only the keys
   * are used to extract the document mask.
   * @returns {DocumentMask}
   */
  static fromObject(data) {
    let fieldPaths = [];

    const extractFieldPaths = function(currentData, currentPath) {
      for (let key in currentData) {
        if (currentData.hasOwnProperty(key)) {
          // We don't split on dots since fromObject is called with
          // DocumentData.
          const childSegment = new FieldPath(key);
          const childPath = currentPath
            ? currentPath.append(childSegment)
            : childSegment;
          const value = currentData[key];
          if (isPlainObject(value)) {
            extractFieldPaths(value, childPath);
          } else if (value !== FieldValue.SERVER_TIMESTAMP_SENTINEL) {
            fieldPaths.push(childPath.formattedName);
          }
        }
      }
    };

    extractFieldPaths(data);

    return new DocumentMask(fieldPaths);
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
class DocumentTransform {
  /**
   * @private
   * @hideconstructor
   *
   * @param {DocumentReference} ref The DocumentReference for this
   * transform.
   * @param {Array.<Object>} transforms A array with 'FieldTransform' Protobuf
   * messages.
   */
  constructor(ref, transforms) {
    this._ref = ref;
    this._transforms = transforms;
  }

  /**
   * Whether this DocumentTransform contains any actionable transformations.
   *
   * @private
   * @type {boolean}
   * @readonly
   */
  get isEmpty() {
    return this._transforms.length === 0;
  }

  /**
   * Converts a document transform to the Firestore 'DocumentTransform' Proto.
   *
   * @private
   * @returns {Object} A Firestore 'DocumentTransform' Proto.
   */
  toProto() {
    return {
      document: this._ref.formattedName,
      fieldTransforms: this._transforms,
    };
  }

  /**
   * Generates a DocumentTransform from a JavaScript object.
   *
   * @private
   * @param {firestore/DocumentReference} ref The `DocumentReference` to
   * use for the DocumentTransform.
   * @param {Object} obj The object to extract the transformations from.
   * @param {Array.<string>=} path The field path at the current depth.
   * @returns {Object} The Firestore Proto
   */
  static fromObject(ref, obj, path) {
    path = path || [];

    function encode_(val, path, allowTransforms) {
      let transforms = [];

      if (val === FieldValue.SERVER_TIMESTAMP_SENTINEL) {
        if (allowTransforms) {
          transforms.push({
            fieldPath: new FieldPath(path).formattedName,
            setToServerValue: SERVER_TIMESTAMP,
          });
        } else {
          throw new Error(
            'Server timestamps are not supported as array ' + 'values.'
          );
        }
      } else if (is.array(val)) {
        for (let i = 0; i < val.length; ++i) {
          // We need to verify that no array value contains a document transform
          encode_(val[i], path.concat(i), false);
        }
      } else if (isPlainObject(val)) {
        for (let prop in val) {
          if (val.hasOwnProperty(prop)) {
            transforms = transforms.concat(
              encode_(val[prop], path.concat(prop), allowTransforms)
            );
          }
        }
      }

      return transforms;
    }

    let transforms = [];

    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        transforms = transforms.concat(
          encode_(obj[prop], path.concat(prop), true)
        );
      }
    }

    return new DocumentTransform(ref, transforms);
  }
}

/*!
 * A Firestore Precondition encapsulates options for database writes.
 *
 * @private
 * @class
 */
class Precondition {
  /**
   * @private
   * @hideconstructor
   *
   * @param {boolean=} options.exists - Whether the referenced document should
   * exist in Firestore,
   * @param {string=} options.lastUpdateTime - The last update time
   * of the referenced document in Firestore (as ISO 8601 string).
   * @param options
   */
  constructor(options) {
    if (is.object(options)) {
      this._exists = options.exists;
      this._lastUpdateTime = options.lastUpdateTime;
    }
  }

  /**
   * Generates the Protobuf `Preconditon` object for this precondition.
   *
   * @returns {Object} The `Preconditon` Protobuf object.
   */
  toProto() {
    let proto = {};

    if (is.defined(this._lastUpdateTime)) {
      let date = new Date(this._lastUpdateTime);
      let seconds = Math.floor(date.getTime() / 1000);
      let nanos = null;

      let nanoString = this._lastUpdateTime.substring(
        20,
        this._lastUpdateTime.length - 1
      );

      if (nanoString.length === 3) {
        nanoString = `${nanoString}000000`;
      } else if (nanoString.length === 6) {
        nanoString = `${nanoString}000`;
      }

      if (nanoString.length === 9) {
        nanos = parseInt(nanoString);
      }

      if (isNaN(seconds) || isNaN(nanos)) {
        throw new Error(
          'Specify a valid ISO 8601 timestamp for' + ' "lastUpdateTime".'
        );
      }

      proto.updateTime = {
        seconds: seconds,
        nanos: nanos,
      };
    } else if (is.defined(this._exists)) {
      proto.exists = this._exists;
    }

    return proto;
  }
}

/*!
 * Validates a JavaScript object for usage as a Firestore document.
 *
 * @param {Object} obj JavaScript object to validate.
 * @param {boolean=} usesPaths Whether the object is keyed by field paths
 * (e.g. for document updates).
 * @param {number=} depth The current depth of the traversal.
 * @returns {boolean} 'true' when the object is valid.
 * @throws {Error} when the object is invalid.
 */
function validateDocumentData(obj, usesPaths, depth) {
  if (!depth) {
    depth = 1;
  } else if (depth > MAX_DEPTH) {
    throw new Error(
      `Input object is deeper than ${MAX_DEPTH} levels or contains a cycle.`
    );
  }

  if (!isPlainObject(obj)) {
    throw new Error('Input is not a plain JavaScript object.');
  }

  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      if (isPlainObject(obj[prop])) {
        validateDocumentData(obj[prop], false, depth + 1);
      }
    }
  }

  return true;
}

/*!
 * Validates the use of 'options' as a Precondition and enforces that 'exists'
 * and 'lastUpdateTime' use valid types.
 *
 * @param {boolean=} options.exists - Whether the referenced document
 * should exist.
 * @param {string=} options.lastUpdateTime - The last update time
 * of the referenced document in Firestore (as ISO 8601 string).
 * @returns {boolean} 'true' if the input is a valid Precondition.
 */
function validatePrecondition(options) {
  if (!is.object(options)) {
    throw new Error('Input is not an object.');
  }

  let conditions = 0;

  if (is.defined(options.exists)) {
    ++conditions;
    if (!is.boolean(options.exists)) {
      throw new Error('"exists" is not a boolean.');
    }
  }

  if (is.defined(options.lastUpdateTime)) {
    ++conditions;
    if (!is.string(options.lastUpdateTime)) {
      throw new Error('"lastUpdateTime" is not a string.');
    }
  }

  if (conditions > 1) {
    throw new Error('Input contains more than one condition.');
  }

  return true;
}

/*!
 * Validates the use of 'options' as SetOptions and enforces that 'merge' is a
 * boolean.
 *
 * @param {boolean=} options.merge - Whether set() should merge the provided
 * data into an existing document.
 * @returns {boolean} 'true' if the input is a valid SetOptions object.
 */
function validateSetOptions(options) {
  if (!is.object(options)) {
    throw new Error('Input is not an object.');
  }

  if (is.defined(options.merge) && !is.boolean(options.merge)) {
    throw new Error('"merge" is not a boolean.');
  }

  return true;
}

/*!
 * Verifies that 'obj' is a plain JavaScript object that can be encoded as a
 * 'Map' in Firestore.
 *
 * @param {*} input - The argument to verify.
 * @returns {boolean} 'true' if the input can be a treated as a plain object.
 */
function isPlainObject(input) {
  return (
    typeof input === 'object' &&
    input !== null &&
    Object.getPrototypeOf(input) === Object.prototype
  );
}

module.exports = DocumentRefType => {
  DocumentReference = DocumentRefType;
  validate = require('./validate')({
    FieldPath: FieldPath.validateFieldPath,
  });
  return {
    DocumentMask,
    DocumentSnapshot,
    DocumentTransform,
    Precondition,
    GeoPoint,
    validateDocumentData,
    validatePrecondition,
    validateSetOptions,
  };
};
