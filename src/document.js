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
const timestampFromJson = require('./convert').timestampFromJson;

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
   * Returns a string representation for this GeoPoint.
   *
   * @return {string} The string representation.
   */
  toString() {
    return `GeoPoint { latitude: ${this.latitude}, longitude: ${
      this.longitude
    } }`;
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
 * <p>For a DocumentSnapshot that points to a non-existing document, any data
 * access will return 'undefined'. You can use the
 * [exists]{@link DocumentSnapshot#exists} property to explicitly verify a
 * document's existence.
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
   * Creates a DocumentSnapshot from an object.
   *
   * @private
   * @param {firestore/DocumentReference} ref - The reference to the document.
   * @param {Object} obj - The object to store in the DocumentSnapshot.
   * @return {firestore.DocumentSnapshot} The created DocumentSnapshot.
   */
  static fromObject(ref, obj) {
    return new DocumentSnapshot(ref, DocumentSnapshot.encodeFields(obj));
  }

  /**
   * Creates a DocumentSnapshot from an UpdateMap.
   *
   * This methods expands the top-level field paths in a JavaScript map and
   * turns { foo.bar : foobar } into { foo { bar : foobar }}
   *
   * @private
   * @param {firestore/DocumentReference} ref - The reference to the document.
   * @param {Map.<FieldPath, *>} data - The field/value map to expand.
   * @return {firestore.DocumentSnapshot} The created DocumentSnapshot.
   */
  static fromUpdateMap(ref, data) {
    /**
     * Merges 'value' at the field path specified by the path array into
     * 'target'.
     */
    function merge(target, value, path, pos) {
      let key = path[pos];
      let isLast = pos === path.length - 1;

      if (!is.defined(target[key])) {
        if (isLast) {
          if (DocumentTransform.isTransformSentinel(value)) {
            // If there is already data at this path, we need to retain it.
            // Otherwise, we don't include it in the DocumentSnapshot.
            return !is.empty(target) ? target : null;
          }
          // The merge is done.
          const leafNode = DocumentSnapshot.encodeValue(value);
          if (leafNode) {
            target[key] = leafNode;
          }
          return target;
        } else {
          // We need to expand the target object.
          const childNode = {
            valueType: 'mapValue',
            mapValue: {
              fields: {},
            },
          };

          const nestedValue = merge(
            childNode.mapValue.fields,
            value,
            path,
            pos + 1
          );

          if (nestedValue) {
            childNode.mapValue.fields = nestedValue;
            target[key] = childNode;
            return target;
          } else {
            return null;
          }
        }
      } else {
        assert(!isLast, "Can't merge current value into a nested object");
        target[key].mapValue.fields = merge(
          target[key].mapValue.fields,
          value,
          path,
          pos + 1
        );
        return target;
      }
    }

    let res = {};

    data.forEach((value, key) => {
      let components = key.toArray();
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
   * @type {string|undefined}
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
   * @type {string|undefined}
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
  data() {
    let fields = this.protoFields();

    if (is.undefined(fields)) {
      return undefined;
    }

    let obj = {};
    for (let prop in fields) {
      if (fields.hasOwnProperty(prop)) {
        obj[prop] = this._decodeValue(fields[prop]);
      }
    }
    return obj;
  }

  /**
   * Returns the underlying Firestore 'Fields' Protobuf in Protobuf JS format.
   *
   * @private
   * @returns {Object} The Protobuf encoded document.
   */
  protoFields() {
    return this._fieldsProto;
  }

  /**
   * Retrieves the field specified by `field`.
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
   * Retrieves the field specified by 'fieldPath' in its Protobuf JS
   * representation.
   *
   * @private
   * @param {string|FieldPath} field - The path (e.g. 'foo' or
   * 'foo.bar') to a specific field.
   * @returns {*} The Protobuf-encoded data at the specified field location or
   * undefined if no such field exists.
   */
  protoField(field) {
    let fields = this.protoFields();

    if (is.undefined(fields)) {
      return undefined;
    }

    let components = FieldPath.fromArgument(field).toArray();
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
          (proto.timestampValue.seconds || 0) * 1000 +
            (proto.timestampValue.nanos || 0) / MS_TO_NANOS
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
        if (is.array(proto.arrayValue.values)) {
          for (let value of proto.arrayValue.values) {
            array.push(this._decodeValue(value));
          }
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
   * Checks whether this DocumentSnapshot contains any fields.
   *
   * @private
   * @return {boolean}
   */
  get isEmpty() {
    return is.undefined(this._fieldsProto) || is.empty(this._fieldsProto);
  }

  /**
   * Convert a document snapshot to the Firestore 'Document' Protobuf.
   *
   * @private
   * @returns {Object} - The document in the format the API expects.
   */
  toProto() {
    return {
      update: {
        name: this._ref.formattedName,
        fields: this._fieldsProto,
      },
    };
  }

  /**
   * Converts a Google Protobuf timestamp to an ISO 8601 string.
   *
   * @private
   * @param {{seconds:number=,nanos:number=}=} timestamp The Google Protobuf
   * timestamp.
   * @returns {string|undefined} The representation in ISO 8601 or undefined if
   * the input is empty.
   */
  static toISOTime(timestamp) {
    if (timestamp) {
      let isoSubstring = new Date(
        (timestamp.seconds || 0) * 1000
      ).toISOString();

      // Strip milliseconds from JavaScript ISO representation
      // (YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ)
      isoSubstring = isoSubstring.substr(0, isoSubstring.length - 4);

      // Append nanoseconds as per ISO 8601
      let nanoString = (timestamp.nanos || '') + '';
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
   * @param {Object} obj The object to encode.
   * @returns {Object} The Firestore 'Fields' representation
   */
  static encodeFields(obj) {
    let fields = {};

    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        let val = DocumentSnapshot.encodeValue(obj[prop]);

        if (val) {
          fields[prop] = val;
        }
      }
    }

    return fields;
  }

  /**
   * Encodes a JavaScript value into the Firestore 'Value' representation.
   *
   * @private
   * @param {Object} val The object to encode
   * @returns {object|null} The Firestore Proto or null if we are deleting a
   * field.
   */
  static encodeValue(val) {
    if (DocumentTransform.isTransformSentinel(val)) {
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
        let enc = DocumentSnapshot.encodeValue(val[i]);
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
      const map = {
        valueType: 'mapValue',
        mapValue: {
          fields: {},
        },
      };

      // If we encounter an empty object, we always need to send it to make sure
      // the server creates a map entry.
      if (!is.empty(val)) {
        map.mapValue.fields = DocumentSnapshot.encodeFields(val);
        if (is.empty(map.mapValue.fields)) {
          return null;
        }
      }

      return map;
    }

    throw new Error(
      'Cannot encode type (' +
        Object.prototype.toString.call(val) +
        ') to a Firestore Value'
    );
  }
}

/**
 * A QueryDocumentSnapshot contains data read from a document in your
 * Firestore database as part of a query. The document is guaranteed to exist
 * and its data can be extracted with [data()]{@link QueryDocumentSnapshot#data}
 * or [get()]{@link DocumentSnapshot#get} to get a specific field.
 *
 * A QueryDocumentSnapshot offers the same API surface as a
 * {#link DocumentSnapshot}. Since query results contain only existing
 * documents, the [exists]{@link DocumentSnapshot#exists} property will
 * always be true and [data()]{@link QueryDocumentSnapshot#data} will never
 * return 'undefined'.
 *
 * @class
 * @extends DocumentSnapshot
 */
class QueryDocumentSnapshot extends DocumentSnapshot {
  /**
   * @private
   * @hideconstructor
   *
   * @param {firestore/DocumentReference} ref - The reference to the document.
   * @param {object} fieldsProto - The fields of the Firestore `Document`
   * Protobuf backing this document.
   * @param {string} readTime - The ISO 8601 time when this snapshot was read.
   * @param {string} createTime - The ISO 8601 time when the document was
   * created.
   * @param {string} updateTime - The ISO 8601 time when the document was last
   * updated.
   */
  constructor(ref, fieldsProto, readTime, createTime, updateTime) {
    super(ref, fieldsProto, readTime, createTime, updateTime);
  }

  /**
   * The time the document was created.
   *
   * @type {string}
   * @name QueryDocumentSnapshot#createTime
   * @readonly
   * @override
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.get().forEach(documentSnapshot => {
   *   console.log(`Document created at '${documentSnapshot.createTime}'`);
   * });
   */
  get createTime() {
    return super.createTime;
  }

  /**
   * The time the document was last updated (at the time the snapshot was
   * generated).
   *
   * @type {string}
   * @name QueryDocumentSnapshot#updateTime
   * @readonly
   * @override
   *
   * @example
   * let query = firestore.collection('col');
   *
   * query.get().forEach(documentSnapshot => {
   *   console.log(`Document updated at '${documentSnapshot.updateTime}'`);
   * });
   */
  get updateTime() {
    return super.updateTime;
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
  data() {
    let data = super.data();
    assert(
      is.defined(data),
      'The data in a QueryDocumentSnapshot should always exist.'
    );
    return data;
  }
}

/**
 * Returns a builder for DocumentSnapshot and QueryDocumentSnapshot instances.
 * Invoke `.build()' to assemble the final snapshot.
 *
 * @private
 * @class
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
   * @returns {QueryDocumentSnapshot|DocumentSnapshot} Returns either a
   * QueryDocumentSnapshot (if `fieldsProto` was provided) or a
   * DocumentSnapshot.
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
    return this.fieldsProto
      ? new QueryDocumentSnapshot(
          this.ref,
          this.fieldsProto,
          this.readTime,
          this.createTime,
          this.updateTime
        )
      : new DocumentSnapshot(this.ref, undefined, this.readTime);
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
   * Creates a document mask with the field paths of a document.
   *
   * @private
   * @param {Map.<string|FieldPath, *>} data A map with
   * fields to modify. Only the keys are used to extract the document mask.
   * @returns {DocumentMask}
   */
  static fromUpdateMap(data) {
    let fieldPaths = [];

    data.forEach((value, key) => {
      if (value !== FieldValue.SERVER_TIMESTAMP_SENTINEL) {
        fieldPaths.push(FieldPath.fromArgument(key).formattedName);
      }
    });

    // Required for testing.
    fieldPaths.sort();

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
      let isEmpty = true;

      for (let key in currentData) {
        if (currentData.hasOwnProperty(key)) {
          isEmpty = false;

          // We don't split on dots since fromObject is called with
          // DocumentData.
          const childSegment = new FieldPath(key);
          const childPath = currentPath
            ? currentPath.append(childSegment)
            : childSegment;
          const value = currentData[key];
          if (value === FieldValue.SERVER_TIMESTAMP_SENTINEL) {
            // Ignore.
          } else if (value === FieldValue.DELETE_SENTINEL) {
            fieldPaths.push(childPath.formattedName);
          } else if (isPlainObject(value)) {
            extractFieldPaths(value, childPath);
          } else {
            fieldPaths.push(childPath.formattedName);
          }
        }
      }

      // Add a field path for an explicitly updated empty map.
      if (currentPath && isEmpty) {
        fieldPaths.push(currentPath.formattedName);
      }
    };

    extractFieldPaths(data);

    // Required for testing.
    fieldPaths.sort();

    return new DocumentMask(fieldPaths);
  }

  /**
   * Returns true if this document mask contains no fields.
   *
   * @private
   * @return {boolean} Whether this document mask is empty.
   */
  get isEmpty() {
    return this._fieldPaths.length === 0;
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
   * Generates a DocumentTransform from a JavaScript object.
   *
   * @private
   * @param {firestore/DocumentReference} ref The `DocumentReference` to
   * use for the DocumentTransform.
   * @param {Object} obj The object to extract the transformations from.
   * @returns {firestore.DocumentTransform} The Document Transform.
   */
  static fromObject(ref, obj) {
    let updateMap = new Map();

    for (let prop in obj) {
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
   * @param {firestore/DocumentReference} ref The `DocumentReference` to
   * use for the DocumentTransform.
   * @param {Map} data The map to extract the transformations from.
   * @returns {firestore.DocumentTransform}} The Document Transform.
   */
  static fromUpdateMap(ref, data) {
    let transforms = [];

    function encode_(val, path, allowTransforms) {
      if (val === FieldValue.SERVER_TIMESTAMP_SENTINEL) {
        if (allowTransforms) {
          transforms.push({
            fieldPath: path.formattedName,
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
          encode_(val[i], path.append(String(i)), false);
        }
      } else if (isPlainObject(val)) {
        for (let prop in val) {
          if (val.hasOwnProperty(prop)) {
            encode_(
              val[prop],
              path.append(new FieldPath(prop)),
              allowTransforms
            );
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
   * Returns true if the field value is a .delete() or .serverTimestamp()
   * sentinel.
   *
   * @private
   * @param {*} val The field value to check.
   * @return {boolean} Whether we encountered a transform sentinel.
   */
  static isTransformSentinel(val) {
    return (
      val === FieldValue.SERVER_TIMESTAMP_SENTINEL ||
      val === FieldValue.DELETE_SENTINEL
    );
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
      transform: {
        document: this._ref.formattedName,
        fieldTransforms: this._transforms,
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
      proto.updateTime = timestampFromJson(
        this._lastUpdateTime,
        'lastUpdateTime'
      );
    } else if (is.defined(this._exists)) {
      proto.exists = this._exists;
    }

    return proto;
  }

  /**
   * Whether this DocumentTransform contains any enforcement.
   *
   * @private
   * @type {boolean}
   * @readonly
   */
  get isEmpty() {
    return this._exists === undefined && !this._lastUpdateTime;
  }
}

/*!
 * Validates a JavaScript object for usage as a Firestore document.
 *
 * @param {Object} obj JavaScript object to validate.
 * @param {boolean=} options.allowDeletes Whether field deletes are supported
 * at the top level (e.g. for document updates).
 * @param {boolean=} options.allowNestedDeletes Whether field deletes are supported
 * at any level (e.g. for document merges).
 * @param {boolean=} options.allowEmpty Whether empty documents are support.
 * Defaults to true.
 * @returns {boolean} 'true' when the object is valid.
 * @throws {Error} when the object is invalid.
 */
function validateDocumentData(obj, options) {
  if (!isPlainObject(obj)) {
    throw new Error('Input is not a plain JavaScript object.');
  }

  options = options || {};

  let isEmpty = true;

  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      isEmpty = false;
      validateFieldValue(obj[prop], options, /* depth= */ 1);
    }
  }

  if (options.allowEmpty === false && isEmpty) {
    throw new Error('At least one field must be updated.');
  }

  return true;
}

/*!
 * Validates a JavaScript value for usage as a Firestore value.
 *
 * @param {Object} obj JavaScript value to validate.
 * @param {boolean=} options.allowDeletes Whether field deletes are supported
 * at the top level (e.g. for document updates).
 * @param {boolean=} options.allowNestedDeletes Whether field deletes are supported
 * at any level (e.g. for document merges).
 * @param {number=} depth The current depth of the traversal.
 * @returns {boolean} 'true' when the object is valid.
 * @throws {Error} when the object is invalid.
 */
function validateFieldValue(obj, options, depth) {
  options = options || {};

  if (!depth) {
    depth = 1;
  } else if (depth > MAX_DEPTH) {
    throw new Error(
      `Input object is deeper than ${MAX_DEPTH} levels or contains a cycle.`
    );
  }

  if (obj === FieldValue.DELETE_SENTINEL) {
    if (!options.allowNestedDeletes && (!options.allowDeletes || depth > 1)) {
      throw new Error(
        'Deletes must appear at the top-level and can only be used in update() or set() with {merge:true}.'
      );
    }
  }

  if (isPlainObject(obj)) {
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        validateFieldValue(obj[prop], options, depth + 1);
      }
    }
  }
  if (is.array(obj)) {
    for (let prop of obj) {
      validateFieldValue(obj[prop], options, depth + 1);
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
 * @param {boolean} allowExist Whether to allow the 'exists' preconditions.
 * @returns {boolean} 'true' if the input is a valid Precondition.
 */
function validatePrecondition(precondition, allowExist) {
  if (!is.object(precondition)) {
    throw new Error('Input is not an object.');
  }

  let conditions = 0;

  if (is.defined(precondition.exists)) {
    ++conditions;
    if (!allowExist) {
      throw new Error('"exists" is not an allowed condition.');
    }
    if (!is.boolean(precondition.exists)) {
      throw new Error('"exists" is not a boolean.');
    }
  }

  if (is.defined(precondition.lastUpdateTime)) {
    ++conditions;
    if (!is.string(precondition.lastUpdateTime)) {
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
    PlainObject: isPlainObject,
  });
  return {
    DocumentMask,
    DocumentSnapshot,
    DocumentTransform,
    Precondition,
    GeoPoint,
    QueryDocumentSnapshot,
    validateFieldValue,
    validateDocumentData,
    validatePrecondition,
    validateSetOptions,
  };
};
