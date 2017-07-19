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
 * @module firestore/document
 */

'use strict';

let assert = require('assert');
let is = require('is');
let unescapeJs = require('unescape-js');

/**
 * @private
 * @type firestore.Path
 */
let Path = require('./path');

/**
 * Injected.
 *
 * @private
 * @type firestore.DocumentReference
 */
let DocumentReference;

/**
 * Injected.
 *
 * @private
 * @type firestore.Firestore
 */
let Firestore;

/**
 * @private
 */
let validate;

// Regular Expressions that define a Firestore field path. Field paths are made
// up of dot-separated field names (e.g. "foo.bar"). The individual field
// names must be valid Datastore identifiers and either follow the
// standard identifier guideline or be quoted in backticks. The full
// specification can be found at
// https://cloud.google.com/bigquery/docs/reference/standard-sql/lexical#identifiers
const unquotedIdentifier_ = '(?:[A-Za-z_][A-Za-z_0-9]*)';
const escapeSequences_ = '\\\\(?:a|b|f|n|r|t|v|\\\\|\\?|"|\'|`' +
  '|[0-7]{3}|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})';
const quotedIdentifier_ = `\`(?:[^\\\\\`]|(?:${escapeSequences_}))+\``;
const fieldIdentifier_ = `(?:${unquotedIdentifier_}|${quotedIdentifier_})+`;

/**
 * A Regular Expression that matches an unquoted field name. It matches 'foo',
 * but does not match '`foo`'.
 *
 * @private
 * @type RegExp
 */
const unquotedIdentiferRe_ = new RegExp(`^${unquotedIdentifier_}$`);

/**
 * A Regular Expression that matches a valid field path. It matches 'foo.bar'
 * in 'foo.bar'.
 *
 * @private
 * @type RegExp
 */
const fieldPathRe =
  new RegExp(`^(${fieldIdentifier_})(?:\\.(${fieldIdentifier_}))*$`);

/**
 * A Regular Expression that extracts field components from a field path. It
 * matches 'foo' and 'bar' in 'foo.bar'.
 *
 * @private
 * @type RegExp
 */
const fieldComponentRe =
  new RegExp(`(?:\\.?((?:\\.?(${fieldIdentifier_}))))`, 'g');

/**
 * The maximum depth of a Firestore object.
 *
 * @private
 * @type number
 */
const MAX_DEPTH = 20;

/**
 * Number of nanoseconds in a millisecond.
 *
 * @private
 * @type number
 */
const MS_TO_NANOS = 1000000;

/**
 * Protocol constant for the ServerTimestamp transform.
 *
 * @private
 * @type string
 */
const SERVER_TIMESTAMP = 'REQUEST_TIME';

/**
 * An immutable object representing a geographic location in Firestore. The
 * location is represented as a latitude/longitude pair.
 *
 * <p>This class be instantiated via
 * [geoPoint()]{@link firestore.Firestore.geoPoint}.
 *
 * @public
 * @alias firestore.GeoPoint
 */
class GeoPoint {
  /**
   * @param {number} latitude The latitude as a number between -90 and 90.
   * @param {number} longitude The longitude as a number between -180 and 180.
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
   * @public
   * @type number
   * @name firestore.GeoPoint#latitude
   * @readonly
   */
  get latitude() {
    return this._latitude;
  }

  /**
   * The longitude as a number between -180 and 180.
   *
   * @public
   * @type number
   * @name firestore.GeoPoint#longitude
   * @readonly
   */
  get longitude() {
    return this._longitude;
  }

  /**
   * Converts the GeoPoint to a google.type.LatLng proto.
   * @protected
   */
  toProto() {
    return {
      latitude: this._latitude,
      longitude: this._longitude,
    };
  }

  /**
   * Converts a google.type.LatLng proto to its GeoPoint representation.
   * @package
   */
  static fromProto(proto) {
    return new GeoPoint(proto.latitude, proto.longitude);
  }
}

/**
 * A DocumentSnapshot is an immutable representation for a document in a
 * Firestore database. The data can be extracted with
 * [data()]{@link firestore.DocumentSnapshot#data} or
 * [get(fieldPath)]{@link firestore.DocumentSnapshot#get} to get a
 * specific field.
 *
 * <p>The snapshot can point to a non-existing document in which case
 * [exists]{@link firestore.DocumentSnapshot#exists} will return false.
 * Calling [data()]{@link firestore.DocumentSnapshot#data} or
 * [get(fieldPath)]{@link firestore.DocumentSnapshot#get} for such a document
 * throws an error.
 *
 * @public
 * @alias firestore.DocumentSnapshot
 */
class DocumentSnapshot {
  /**
   * @package
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
   * @public
   * @type boolean
   * @name firestore.DocumentSnapshot#exists
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
   * A [DocumentReference]{@link firestore.DocumentReference} for the document
   * stored in this snapshot.
   *
   * @public
   * @type firestore.DocumentReference
   * @name firestore.DocumentSnapshot#ref
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
   * @public
   * @type string
   * @name firestore.DocumentSnapshot#id
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
   * @public
   * @type string
   * @name firestore.DocumentSnapshot#createTime
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
   * @public
   * @type string
   * @name firestore.DocumentSnapshot#updateTime
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
   * @public
   * @type string
   * @name firestore.DocumentSnapshot#readTime
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
   * @public
   * @return {Object} An object containing all fields in the document.
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
   * @package
   * @return {Object} The Protobuf encoded document.
   */
  protoFields() {
    if (this._fieldsProto === undefined) {
      throw new Error(
          `The data for "${this._ref.formattedName}" does not exist.`);
    }

    return this._fieldsProto;
  }

  /**
   * Retrieves the field specified by `fieldPath`.
   *
   * @public
   * @param {string} fieldPath - The path (e.g. 'foo' or 'foo.bar') to a
   * specific field.
   * @return {*} The data at the specified field location or undefined if no
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
  get(fieldPath) {
    validate.isFieldPath('fieldPath', fieldPath);

    let field = this.protoField(fieldPath);

    if (field === undefined) {
      return undefined;
    }

    return this._decodeValue(field);
  }

  /**
   * Retrieves the field specified by 'fieldPath' in its Protobuf
   * representation.
   *
   * @package
   * @param fieldPath - The path (e.g. 'foo' or 'foo.bar') to a specific
   * field.
   * @return {*} The Protobuf-encoded data at the specified field location or
   * undefined if no such field exists.
   */
  protoField(fieldPath) {
    validate.isFieldPath('fieldPath', fieldPath);

    let components = DocumentSnapshot._extractPathComponents(fieldPath);
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
   * @return {*} The converted JS type.
   */
  _decodeValue(proto) {
    switch (proto.value_type) {
      case 'stringValue': {
        return proto.stringValue;
      } case 'booleanValue': {
        return proto.booleanValue;
      } case 'integerValue': {
        return parseInt(proto.integerValue, 10);
      } case 'doubleValue': {
        return parseFloat(proto.doubleValue, 10);
      } case 'timestampValue': {
        return new Date(proto.timestampValue.seconds * 1000 +
            (proto.timestampValue.nanos / MS_TO_NANOS));
      } case 'referenceValue': {
        return new DocumentReference(
            this.ref.firestore, Path.fromName(proto.referenceValue));
      } case 'arrayValue': {
        let array = [];
        for (let i = 0; i < proto.arrayValue.values.length; ++i) {
          array.push(this._decodeValue(proto.arrayValue.values[i]));
        }
        return array;
      } case 'nullValue': {
        return null;
      } case 'mapValue': {
        let obj = {};
        let fields = proto.mapValue.fields;

        for (let prop in fields) {
          if (fields.hasOwnProperty(prop)) {
            obj[prop] = this._decodeValue(fields[prop]);
          }
        }

        return obj;
      } case 'geoPointValue': {
        return GeoPoint.fromProto(proto.geoPointValue);
      } case 'bytesValue': {
        return proto.bytesValue;
      } default: {
        throw new Error('Cannot decode type from Firestore Value: ' +
            JSON.stringify(proto));
      }
    }
  }

  /**
   * Convert a document snapshot to the Firestore 'Document' Protobuf.
   *
   * @package
   * @return {Object} - The document in the format the API expects.
   */
  toProto() {
    return {
      name: this._ref.formattedName,
      fields: this._fieldsProto
    };
  }

  /**
   * Converts a Google Protobuf timestamp to an ISO 8601 string.
   *
   * @package
   * @param {{seconds:number,nanos:number}=} timestamp The Google Protobuf
   * timestamp.
   * @return {string|undefined} The representation in ISO 8601 or undefined if
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
   * Extracts the individual components of a Firestore path. It turns "foo.bar"
   * into ["foo", "bar"].
   *
   * @private
   * @param {string} fieldPath The Firestore field path.
   * @return {Array.<string>} The individual unescaped field names.
   */
  static _extractPathComponents(fieldPath) {
    /**
     *  Unescapes a path component to be used as a field name. Turns "`$`" into
     * "$".
     */
    function unescapeComponent(component) {
      if (component.match(/^`.*`$/)) {
        // unescapeJs does not unescape backticks.
        let escapedStr = component.substr(1, component.length - 2).
        replace('\\`', '`');
        return unescapeJs(escapedStr);
      }

      return component;
    }

    let fields = [];
    let matches;
    while ((matches = fieldComponentRe.exec(fieldPath)) !== null) {
      fields.push(unescapeComponent(matches[1]));
    }
    return fields;
  }

  /**
   * Create an escaped field path from a list of field name components.
   *
   * @package
   * @param {Array.<string>} fieldNames The unescaped components to encode into
   * a field path.
   * @return {string} A Firestore field path.
   */
  static encodeFieldPath(fieldNames) {
    let fieldPath = '';

    for (let i = 0; i < fieldNames.length; ++i) {
      let component = fieldNames[i];
      if (!unquotedIdentiferRe_.test(component)) {
        component = '`' + component.replace(/[`\\]/g, '\\$&') + '`';
      }
      fieldPath += i !== 0 ? '.' + component : component;
    }

    return fieldPath;
  }

  /**
   * Encodes a JavaScrip object into the Firestore 'Fields' representation.
   *
   * @package
   * @param {Object} obj The object to encode
   * @param {number=} depth The depth at the current encoding level
   * @return {Object} The Firestore 'Fields' representation
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
   * @package
   *
   * @param {Object} val The object to encode
   * @param {number=} depth The depth at the current encoding level
   * @return {object|null} The Firestore Proto or null if we are deleting a
   * field.
   */
  static encodeValue(val, depth) {
    if (!is.defined(depth)) {
      depth = 1;
    }

    if (val === Firestore.deleteSentinel) {
      return null;
    }

    if (val === Firestore.serverTimestampSentinel) {
      return null;
    }

    if (is.string(val)) {
      return {
        value_type: 'stringValue',
        stringValue: val
      };
    }

    if (is.boolean(val)) {
      return {
        value_type: 'booleanValue',
        booleanValue: val
      };
    }

    if (is.integer(val)) {
      return {
        value_type: 'integerValue',
        integerValue: val
      };
    }

    // Integers are handled above, the remaining numbers are treated as doubles
    if (is.number(val)) {
      return {
        value_type: 'doubleValue',
        doubleValue: val
      };
    }

    if (is.date(val)) {
      let epochSeconds = Math.floor(val.getTime() / 1000);
      let timestamp = {
        seconds: epochSeconds,
        nanos: (val.getTime() - epochSeconds * 1000) * MS_TO_NANOS
      };
      return {
        value_type: 'timestampValue',
        timestampValue: timestamp
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
        value_type: 'arrayValue',
        arrayValue: {
          values: encodedElements
        }
      };
    }

    if (is.nil(val)) {
      return {
        value_type: 'nullValue',
        nullValue: 'NULL_VALUE'
      };
    }

    if (is.instance(val, DocumentReference) || is.instance(val, Path)) {
      return {
        value_type: 'referenceValue',
        referenceValue: val.formattedName
      };
    }

    if (is.instance(val, GeoPoint)) {
      return {
        value_type: 'geoPointValue',
        geoPointValue: val.toProto()
      };
    }

    if (is.instanceof(val, Buffer) || is.instanceof(val, Uint8Array)) {
      return {
        value_type: 'bytesValue',
        bytesValue: val
      };
    }

    if (is.object(val)) {
      return {
        value_type: 'mapValue',
        mapValue: {
          fields: DocumentSnapshot.encodeFields(val, depth + 1)
        }
      };
    }

    throw new Error('Cannot encode type (' +
        Object.prototype.toString.call(val) + ') to a Firestore Value');
  }

  /**
   * Expands top-level field paths in a JavaScript object. This is required
   * for storing objects in Firestore.
   *
   * This functions turns { foo.bar : foobar } into { foo { bar : foobar }}
   *
   * @package
   * @param {Object} obj JavaScript object to expand.
   * @return {Object} The expanded JavaScript object.
   */
  static expandObject(obj) {
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
      } else if (is.object(target[key])) {
        if (isLast) {
          // The existing object has deeper nesting that the value we are trying
          // to merge.
          throw new Error(
              `Field "${path.join('.')}" has conflicting definitions.`);
        } else {
          merge(target[key], value, path, pos + 1);
        }
      } else {
        // We are trying to merge an object with a primitive.
        throw new Error(`Field "${path.slice(0, pos + 1).join('.')}" has ` +
            `conflicting definitions.`);
      }
    }

    let res = {};

    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        let components = DocumentSnapshot._extractPathComponents(prop);
        merge(res, obj[prop], components, 0);
      }
    }

    return res;
  }
}

/**
 * Returns a builder for DocumentSnapshot instances. Invoke `.build()' to
 * assemble the final snapshot.
 *
 * @package
 * @return {Object} A Builder instance for a DocumentSnapshot.
 */
DocumentSnapshot.Builder = class {
  /**
   * @param {firestore.DocumentSnapshot=} snapshot An optional snapshot to
   * base this builder on.
   */
  constructor(snapshot) {
    snapshot = snapshot || {};

    /**
     * The reference to the document.
     *
     * @package
     * @type {firestore.DocumentReference}
     */
    this.ref = snapshot._ref;

    /**
     * The fields of the Firestore `Document` Protobuf backing this document.
     *
     * @package
     * @type {object}
     */
    this.fieldsProto = snapshot._fieldsProto;

    /**
     * The ISO 8601 time when this document was read.
     *
     * @package
     * @type {string}
     */
    this.readTime = snapshot._readTime;

    /**
     * The ISO 8601 time when this document was created.
     *
     * @package
     * @type {string}
     */
    this.createTime = snapshot._createTime;

    /**
     * The ISO 8601 time when this document was last updated.
     *
     * @package
     * @type {string}
     */
    this.updateTime = snapshot._updateTime;
  }

  /**
   * Builds the DocumentSnapshot.
   * @package
   */
  build() {
    assert(is.defined(this.fieldsProto) === is.defined(this.createTime),
        'Create time should be set iff document exists.');
    assert(is.defined(this.fieldsProto) === is.defined(this.updateTime),
        'Update time should be set iff document exists.');
    return new DocumentSnapshot(this.ref, this.fieldsProto,
        this.readTime, this.createTime, this.updateTime);
  }
};


/**
 * A Firestore Document Mask contains the field paths affected by an update.
 *
 * @alias firestore.DocumentMask
 *
 * @package
 */
class DocumentMask {
  /**
   * @package
   * @param {Array.<string>} fieldPaths The field paths of this mask.
   */
  constructor(fieldPaths) {
    this._fieldPaths = fieldPaths;
  }

  /**
   * Converts a document mask to the Firestore 'DocumentMask' Proto.
   *
   * @package
   * @return {Object} A Firestore 'DocumentMask' Proto.
   */
  toProto() {
    return {
      fieldPaths: this._fieldPaths
    };
  }

  /**
   * Creates a document mask with the fields of a document.
   *
   * @package
   * @param {object<string, *>} data A collection of fields to modify. Only the
   * keys are used to extract the document mask.
   * @return {Object}
   */
  static fromObject(data) {
    let fieldPaths = [];

    Object.keys(data).forEach((key) => {
      if (data[key] !== Firestore.serverTimestampSentinel) {
        fieldPaths.push(key);
      }
    });

    return new DocumentMask(fieldPaths);
  }
}

/**
 * A Firestore Document Transform.
 *
 * A DocumentTransform contains pending server-side transforms and their
 * corresponding field paths.
 *
 * @package
 * @alias firestore.DocumentTransform
 */
class DocumentTransform {
  /**
   * @package
   *
   * @param {firestore.DocumentReference} ref The DocumentReference for this
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
   * @package
   * @type boolean
   * @readonly
   */
  get isEmpty() {
    return this._transforms.length === 0;
  }

  /**
   * Converts a document transform to the Firestore 'DocumentTransform' Proto.
   *
   * @package
   * @return {Object} A Firestore 'DocumentTransform' Proto.
   */
  toProto() {
    return {
      document: this._ref.formattedName,
      fieldTransforms: this._transforms
    };
  }

  /**
   * Generates a DocumentTransform from a JavaScript object.
   *
   * @package
   *
   * @param {firestore/DocumentReference} ref The `DocumentReference` to
   * use for the DocumentTransform.
   * @param {Object} obj The object to extract the transformations from.
   * @param {Array.<string>=} path The field path at the current depth.
   * @return {Object} The Firestore Proto
   */
  static fromObject(ref, obj, path) {
    path = path || [];

    function encode_(val, path, allowTransforms) {
      let transforms = [];

      if (val === Firestore.serverTimestampSentinel) {
        if (allowTransforms) {
          transforms.push({
            fieldPath: DocumentSnapshot.encodeFieldPath(path),
            setToServerValue: SERVER_TIMESTAMP
          });
        } else {
          throw new Error('Server timestamps are not supported as array ' +
            'values.');
        }
      } else if (is.array(val)) {
        for (let i = 0; i < val.length; ++i) {
          // We need to verify that no array value contains a document transform
          encode_(val[i], path.concat(i), false);
        }
      } else if (is.object(val)) {
        for (let prop in val) {
          if (val.hasOwnProperty(prop)) {
            transforms = transforms.concat(encode_(val[prop], path.concat(prop),
              allowTransforms));
          }
        }
      }

      return transforms;
    }

    let transforms = [];

    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        transforms = transforms.concat(encode_(obj[prop], path.concat(prop),
          true));
      }
    }

    return new DocumentTransform(ref, transforms);
  }
}

/**
 * A Firestore Precondition encapsulates options for database writes.
 *
 * @package
 * @alias firestore.Precondition
 */
class Precondition {
  /**
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
   * @package
   * @return {Object} The `Preconditon` Protobuf object.
   */
  toProto() {
    let proto = {};

    if (is.defined(this._lastUpdateTime)) {
      let date = new Date(this._lastUpdateTime);
      let seconds = Math.floor(date.getTime() / 1000);
      let nanos = parseInt(
          this._lastUpdateTime.substring(20, this._lastUpdateTime.length - 1));

      if (isNaN(seconds) || isNaN(nanos)) {
        throw new Error('Specify a valid ISO 8601 timestamp for' +
            ' "lastUpdateTime".');
      }

      proto.updateTime = {
        seconds: seconds,
        nanos: nanos
      };
    } else if (is.defined(this._exists)) {
      proto.exists = this._exists;
    }

    return proto;
  }
}

/**
 * Validates a JavaScript object for usage as a Firestore document.
 *
 * @package
 * @param {Object} obj JavaScript object to validate.
 * @param {boolean=} usesPaths Whether the object is keyed by field paths
 * (e.g. for document updates).
 * @param {number=} depth The current depth of the traversal.
 * @return {boolean} 'true' when the object is valid.
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

  if (!is.object(obj)) {
    throw new Error('Input is not a JavaScript object.');
  }

  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      if (usesPaths) {
        validateFieldPath(prop);
      }

      if (is.object(obj[prop])) {
        validateDocumentData(obj[prop], false, depth + 1);
      }
    }
  }

  return true;
}

/**
 * Validates the input string as a field path.
 *
 * @package
 * @param {string} fieldPath Field path to validate.
 * @return {boolean} 'true' when the input is valid.
 * @throws {Error} when the field path is invalid
 */
function validateFieldPath(fieldPath) {
  if (!is.string(fieldPath)) {
    throw new Error('Input is not a string.');
  }

  if (!fieldPathRe.test(fieldPath)) {
    throw new Error(
        `Field "${fieldPath}" was not encoded using Firestore.fieldPath().`);
  }

  return true;
}

/**
 * Validates that 'createIfMissing', 'exists' and 'lastUpdateTime' use valid
 * types.
 *
 * @package
 *
 * @param {boolean=} options.createIfMissing - Whether the referenced document
 * should be created if it doesn't yet exist.
 * @param {boolean=} options.exists - Whether the referenced document
 * should exist.
 * @param {string=} options.lastUpdateTime - The last update time
 * of the referenced document in Firestore (as ISO 8601 string).
 * @return {boolean} 'true' if the input is a valid Precondition.
 */
function validatePrecondition(options) {
  if (!is.object(options)) {
    throw new Error('Input is not an object.');
  }

  let conditions = 0;

  if (is.defined(options.createIfMissing)) {
    ++conditions;
    if (!is.boolean(options.createIfMissing)) {
      throw new Error ('"createIfMissing" is not a boolean.');
    }
  }

  if (is.defined(options.exists)) {
    ++conditions;
    if (!is.boolean(options.exists)) {
      throw new Error ('"exists" is not a boolean.');
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

module.exports = (FirestoreType, DocumentRefType) => {
  Firestore = FirestoreType;
  DocumentReference = DocumentRefType;
  validate = require('./validate.js')({
    FieldPath: validateFieldPath
  });
  return {
    DocumentMask, DocumentSnapshot, DocumentTransform,
    Precondition, GeoPoint, validateFieldPath, validateDocumentData,
    validatePrecondition
  };
};
