/*!
 * Copyright 2020 Google LLC
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

/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
(function(global, factory) { /* global define, require, module */

    /* AMD */ if (typeof define === 'function' && define.amd)
        define(["protobufjs/minimal"], factory);

    /* CommonJS */ else if (typeof require === 'function' && typeof module === 'object' && module && module.exports)
        module.exports = factory(require("protobufjs/minimal"));

})(this, function($protobuf) {
    "use strict";

    // Common aliases
    var $util = $protobuf.util;
    
    // Exported root namespace
    var $root = $protobuf.roots.firestore_v1 || ($protobuf.roots.firestore_v1 = {});
    
    $root.firestore = (function() {
    
        /**
         * Namespace firestore.
         * @exports firestore
         * @namespace
         */
        var firestore = {};
    
        firestore.BundledQuery = (function() {
    
            /**
             * Properties of a BundledQuery.
             * @memberof firestore
             * @interface IBundledQuery
             * @property {string|null} [parent] BundledQuery parent
             * @property {google.firestore.v1.IStructuredQuery|null} [structuredQuery] BundledQuery structuredQuery
             * @property {firestore.BundledQuery.LimitType|null} [limitType] BundledQuery limitType
             */
    
            /**
             * Constructs a new BundledQuery.
             * @memberof firestore
             * @classdesc Represents a BundledQuery.
             * @implements IBundledQuery
             * @constructor
             * @param {firestore.IBundledQuery=} [properties] Properties to set
             */
            function BundledQuery(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
    
            /**
             * BundledQuery parent.
             * @member {string} parent
             * @memberof firestore.BundledQuery
             * @instance
             */
            BundledQuery.prototype.parent = "";
    
            /**
             * BundledQuery structuredQuery.
             * @member {google.firestore.v1.IStructuredQuery|null|undefined} structuredQuery
             * @memberof firestore.BundledQuery
             * @instance
             */
            BundledQuery.prototype.structuredQuery = null;
    
            /**
             * BundledQuery limitType.
             * @member {firestore.BundledQuery.LimitType} limitType
             * @memberof firestore.BundledQuery
             * @instance
             */
            BundledQuery.prototype.limitType = 0;
    
            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;
    
            /**
             * BundledQuery queryType.
             * @member {"structuredQuery"|undefined} queryType
             * @memberof firestore.BundledQuery
             * @instance
             */
            Object.defineProperty(BundledQuery.prototype, "queryType", {
                get: $util.oneOfGetter($oneOfFields = ["structuredQuery"]),
                set: $util.oneOfSetter($oneOfFields)
            });
    
            /**
             * Creates a BundledQuery message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof firestore.BundledQuery
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {firestore.BundledQuery} BundledQuery
             */
            BundledQuery.fromObject = function fromObject(object) {
                if (object instanceof $root.firestore.BundledQuery)
                    return object;
                var message = new $root.firestore.BundledQuery();
                if (object.parent != null)
                    message.parent = String(object.parent);
                if (object.structuredQuery != null) {
                    if (typeof object.structuredQuery !== "object")
                        throw TypeError(".firestore.BundledQuery.structuredQuery: object expected");
                    message.structuredQuery = $root.google.firestore.v1.StructuredQuery.fromObject(object.structuredQuery);
                }
                switch (object.limitType) {
                case "FIRST":
                case 0:
                    message.limitType = 0;
                    break;
                case "LAST":
                case 1:
                    message.limitType = 1;
                    break;
                }
                return message;
            };
    
            /**
             * Creates a plain object from a BundledQuery message. Also converts values to other types if specified.
             * @function toObject
             * @memberof firestore.BundledQuery
             * @static
             * @param {firestore.BundledQuery} message BundledQuery
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            BundledQuery.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.parent = "";
                    object.limitType = options.enums === String ? "FIRST" : 0;
                }
                if (message.parent != null && message.hasOwnProperty("parent"))
                    object.parent = message.parent;
                if (message.structuredQuery != null && message.hasOwnProperty("structuredQuery")) {
                    object.structuredQuery = $root.google.firestore.v1.StructuredQuery.toObject(message.structuredQuery, options);
                    if (options.oneofs)
                        object.queryType = "structuredQuery";
                }
                if (message.limitType != null && message.hasOwnProperty("limitType"))
                    object.limitType = options.enums === String ? $root.firestore.BundledQuery.LimitType[message.limitType] : message.limitType;
                return object;
            };
    
            /**
             * Converts this BundledQuery to JSON.
             * @function toJSON
             * @memberof firestore.BundledQuery
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            BundledQuery.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
    
            /**
             * LimitType enum.
             * @name firestore.BundledQuery.LimitType
             * @enum {string}
             * @property {string} FIRST=FIRST FIRST value
             * @property {string} LAST=LAST LAST value
             */
            BundledQuery.LimitType = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "FIRST"] = "FIRST";
                values[valuesById[1] = "LAST"] = "LAST";
                return values;
            })();
    
            return BundledQuery;
        })();
    
        firestore.NamedQuery = (function() {
    
            /**
             * Properties of a NamedQuery.
             * @memberof firestore
             * @interface INamedQuery
             * @property {string|null} [name] NamedQuery name
             * @property {firestore.IBundledQuery|null} [bundledQuery] NamedQuery bundledQuery
             * @property {google.protobuf.ITimestamp|null} [readTime] NamedQuery readTime
             */
    
            /**
             * Constructs a new NamedQuery.
             * @memberof firestore
             * @classdesc Represents a NamedQuery.
             * @implements INamedQuery
             * @constructor
             * @param {firestore.INamedQuery=} [properties] Properties to set
             */
            function NamedQuery(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
    
            /**
             * NamedQuery name.
             * @member {string} name
             * @memberof firestore.NamedQuery
             * @instance
             */
            NamedQuery.prototype.name = "";
    
            /**
             * NamedQuery bundledQuery.
             * @member {firestore.IBundledQuery|null|undefined} bundledQuery
             * @memberof firestore.NamedQuery
             * @instance
             */
            NamedQuery.prototype.bundledQuery = null;
    
            /**
             * NamedQuery readTime.
             * @member {google.protobuf.ITimestamp|null|undefined} readTime
             * @memberof firestore.NamedQuery
             * @instance
             */
            NamedQuery.prototype.readTime = null;
    
            /**
             * Creates a NamedQuery message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof firestore.NamedQuery
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {firestore.NamedQuery} NamedQuery
             */
            NamedQuery.fromObject = function fromObject(object) {
                if (object instanceof $root.firestore.NamedQuery)
                    return object;
                var message = new $root.firestore.NamedQuery();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.bundledQuery != null) {
                    if (typeof object.bundledQuery !== "object")
                        throw TypeError(".firestore.NamedQuery.bundledQuery: object expected");
                    message.bundledQuery = $root.firestore.BundledQuery.fromObject(object.bundledQuery);
                }
                if (object.readTime != null) {
                    if (typeof object.readTime !== "object")
                        throw TypeError(".firestore.NamedQuery.readTime: object expected");
                    message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                }
                return message;
            };
    
            /**
             * Creates a plain object from a NamedQuery message. Also converts values to other types if specified.
             * @function toObject
             * @memberof firestore.NamedQuery
             * @static
             * @param {firestore.NamedQuery} message NamedQuery
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            NamedQuery.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.name = "";
                    object.bundledQuery = null;
                    object.readTime = null;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.bundledQuery != null && message.hasOwnProperty("bundledQuery"))
                    object.bundledQuery = $root.firestore.BundledQuery.toObject(message.bundledQuery, options);
                if (message.readTime != null && message.hasOwnProperty("readTime"))
                    object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                return object;
            };
    
            /**
             * Converts this NamedQuery to JSON.
             * @function toJSON
             * @memberof firestore.NamedQuery
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            NamedQuery.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
    
            return NamedQuery;
        })();
    
        firestore.BundledDocumentMetadata = (function() {
    
            /**
             * Properties of a BundledDocumentMetadata.
             * @memberof firestore
             * @interface IBundledDocumentMetadata
             * @property {string|null} [name] BundledDocumentMetadata name
             * @property {google.protobuf.ITimestamp|null} [readTime] BundledDocumentMetadata readTime
             * @property {boolean|null} [exists] BundledDocumentMetadata exists
             * @property {Array.<string>|null} [queries] BundledDocumentMetadata queries
             */
    
            /**
             * Constructs a new BundledDocumentMetadata.
             * @memberof firestore
             * @classdesc Represents a BundledDocumentMetadata.
             * @implements IBundledDocumentMetadata
             * @constructor
             * @param {firestore.IBundledDocumentMetadata=} [properties] Properties to set
             */
            function BundledDocumentMetadata(properties) {
                this.queries = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
    
            /**
             * BundledDocumentMetadata name.
             * @member {string} name
             * @memberof firestore.BundledDocumentMetadata
             * @instance
             */
            BundledDocumentMetadata.prototype.name = "";
    
            /**
             * BundledDocumentMetadata readTime.
             * @member {google.protobuf.ITimestamp|null|undefined} readTime
             * @memberof firestore.BundledDocumentMetadata
             * @instance
             */
            BundledDocumentMetadata.prototype.readTime = null;
    
            /**
             * BundledDocumentMetadata exists.
             * @member {boolean} exists
             * @memberof firestore.BundledDocumentMetadata
             * @instance
             */
            BundledDocumentMetadata.prototype.exists = false;
    
            /**
             * BundledDocumentMetadata queries.
             * @member {Array.<string>} queries
             * @memberof firestore.BundledDocumentMetadata
             * @instance
             */
            BundledDocumentMetadata.prototype.queries = $util.emptyArray;
    
            /**
             * Creates a BundledDocumentMetadata message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof firestore.BundledDocumentMetadata
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {firestore.BundledDocumentMetadata} BundledDocumentMetadata
             */
            BundledDocumentMetadata.fromObject = function fromObject(object) {
                if (object instanceof $root.firestore.BundledDocumentMetadata)
                    return object;
                var message = new $root.firestore.BundledDocumentMetadata();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.readTime != null) {
                    if (typeof object.readTime !== "object")
                        throw TypeError(".firestore.BundledDocumentMetadata.readTime: object expected");
                    message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                }
                if (object.exists != null)
                    message.exists = Boolean(object.exists);
                if (object.queries) {
                    if (!Array.isArray(object.queries))
                        throw TypeError(".firestore.BundledDocumentMetadata.queries: array expected");
                    message.queries = [];
                    for (var i = 0; i < object.queries.length; ++i)
                        message.queries[i] = String(object.queries[i]);
                }
                return message;
            };
    
            /**
             * Creates a plain object from a BundledDocumentMetadata message. Also converts values to other types if specified.
             * @function toObject
             * @memberof firestore.BundledDocumentMetadata
             * @static
             * @param {firestore.BundledDocumentMetadata} message BundledDocumentMetadata
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            BundledDocumentMetadata.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.queries = [];
                if (options.defaults) {
                    object.name = "";
                    object.readTime = null;
                    object.exists = false;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.readTime != null && message.hasOwnProperty("readTime"))
                    object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                if (message.exists != null && message.hasOwnProperty("exists"))
                    object.exists = message.exists;
                if (message.queries && message.queries.length) {
                    object.queries = [];
                    for (var j = 0; j < message.queries.length; ++j)
                        object.queries[j] = message.queries[j];
                }
                return object;
            };
    
            /**
             * Converts this BundledDocumentMetadata to JSON.
             * @function toJSON
             * @memberof firestore.BundledDocumentMetadata
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            BundledDocumentMetadata.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
    
            return BundledDocumentMetadata;
        })();
    
        firestore.BundleMetadata = (function() {
    
            /**
             * Properties of a BundleMetadata.
             * @memberof firestore
             * @interface IBundleMetadata
             * @property {string|null} [id] BundleMetadata id
             * @property {google.protobuf.ITimestamp|null} [createTime] BundleMetadata createTime
             * @property {number|null} [version] BundleMetadata version
             * @property {number|null} [totalDocuments] BundleMetadata totalDocuments
             * @property {number|string|null} [totalBytes] BundleMetadata totalBytes
             */
    
            /**
             * Constructs a new BundleMetadata.
             * @memberof firestore
             * @classdesc Represents a BundleMetadata.
             * @implements IBundleMetadata
             * @constructor
             * @param {firestore.IBundleMetadata=} [properties] Properties to set
             */
            function BundleMetadata(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
    
            /**
             * BundleMetadata id.
             * @member {string} id
             * @memberof firestore.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.id = "";
    
            /**
             * BundleMetadata createTime.
             * @member {google.protobuf.ITimestamp|null|undefined} createTime
             * @memberof firestore.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.createTime = null;
    
            /**
             * BundleMetadata version.
             * @member {number} version
             * @memberof firestore.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.version = 0;
    
            /**
             * BundleMetadata totalDocuments.
             * @member {number} totalDocuments
             * @memberof firestore.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.totalDocuments = 0;
    
            /**
             * BundleMetadata totalBytes.
             * @member {number|string} totalBytes
             * @memberof firestore.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.totalBytes = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    
            /**
             * Creates a BundleMetadata message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof firestore.BundleMetadata
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {firestore.BundleMetadata} BundleMetadata
             */
            BundleMetadata.fromObject = function fromObject(object) {
                if (object instanceof $root.firestore.BundleMetadata)
                    return object;
                var message = new $root.firestore.BundleMetadata();
                if (object.id != null)
                    message.id = String(object.id);
                if (object.createTime != null) {
                    if (typeof object.createTime !== "object")
                        throw TypeError(".firestore.BundleMetadata.createTime: object expected");
                    message.createTime = $root.google.protobuf.Timestamp.fromObject(object.createTime);
                }
                if (object.version != null)
                    message.version = object.version >>> 0;
                if (object.totalDocuments != null)
                    message.totalDocuments = object.totalDocuments >>> 0;
                if (object.totalBytes != null)
                    if ($util.Long)
                        (message.totalBytes = $util.Long.fromValue(object.totalBytes)).unsigned = true;
                    else if (typeof object.totalBytes === "string")
                        message.totalBytes = parseInt(object.totalBytes, 10);
                    else if (typeof object.totalBytes === "number")
                        message.totalBytes = object.totalBytes;
                    else if (typeof object.totalBytes === "object")
                        message.totalBytes = new $util.LongBits(object.totalBytes.low >>> 0, object.totalBytes.high >>> 0).toNumber(true);
                return message;
            };
    
            /**
             * Creates a plain object from a BundleMetadata message. Also converts values to other types if specified.
             * @function toObject
             * @memberof firestore.BundleMetadata
             * @static
             * @param {firestore.BundleMetadata} message BundleMetadata
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            BundleMetadata.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.id = "";
                    object.createTime = null;
                    object.version = 0;
                    object.totalDocuments = 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.totalBytes = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.totalBytes = options.longs === String ? "0" : 0;
                }
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                if (message.createTime != null && message.hasOwnProperty("createTime"))
                    object.createTime = $root.google.protobuf.Timestamp.toObject(message.createTime, options);
                if (message.version != null && message.hasOwnProperty("version"))
                    object.version = message.version;
                if (message.totalDocuments != null && message.hasOwnProperty("totalDocuments"))
                    object.totalDocuments = message.totalDocuments;
                if (message.totalBytes != null && message.hasOwnProperty("totalBytes"))
                    if (typeof message.totalBytes === "number")
                        object.totalBytes = options.longs === String ? String(message.totalBytes) : message.totalBytes;
                    else
                        object.totalBytes = options.longs === String ? $util.Long.prototype.toString.call(message.totalBytes) : options.longs === Number ? new $util.LongBits(message.totalBytes.low >>> 0, message.totalBytes.high >>> 0).toNumber(true) : message.totalBytes;
                return object;
            };
    
            /**
             * Converts this BundleMetadata to JSON.
             * @function toJSON
             * @memberof firestore.BundleMetadata
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            BundleMetadata.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
    
            return BundleMetadata;
        })();
    
        firestore.BundleElement = (function() {
    
            /**
             * Properties of a BundleElement.
             * @memberof firestore
             * @interface IBundleElement
             * @property {firestore.IBundleMetadata|null} [metadata] BundleElement metadata
             * @property {firestore.INamedQuery|null} [namedQuery] BundleElement namedQuery
             * @property {firestore.IBundledDocumentMetadata|null} [documentMetadata] BundleElement documentMetadata
             * @property {google.firestore.v1.IDocument|null} [document] BundleElement document
             */
    
            /**
             * Constructs a new BundleElement.
             * @memberof firestore
             * @classdesc Represents a BundleElement.
             * @implements IBundleElement
             * @constructor
             * @param {firestore.IBundleElement=} [properties] Properties to set
             */
            function BundleElement(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
    
            /**
             * BundleElement metadata.
             * @member {firestore.IBundleMetadata|null|undefined} metadata
             * @memberof firestore.BundleElement
             * @instance
             */
            BundleElement.prototype.metadata = null;
    
            /**
             * BundleElement namedQuery.
             * @member {firestore.INamedQuery|null|undefined} namedQuery
             * @memberof firestore.BundleElement
             * @instance
             */
            BundleElement.prototype.namedQuery = null;
    
            /**
             * BundleElement documentMetadata.
             * @member {firestore.IBundledDocumentMetadata|null|undefined} documentMetadata
             * @memberof firestore.BundleElement
             * @instance
             */
            BundleElement.prototype.documentMetadata = null;
    
            /**
             * BundleElement document.
             * @member {google.firestore.v1.IDocument|null|undefined} document
             * @memberof firestore.BundleElement
             * @instance
             */
            BundleElement.prototype.document = null;
    
            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;
    
            /**
             * BundleElement elementType.
             * @member {"metadata"|"namedQuery"|"documentMetadata"|"document"|undefined} elementType
             * @memberof firestore.BundleElement
             * @instance
             */
            Object.defineProperty(BundleElement.prototype, "elementType", {
                get: $util.oneOfGetter($oneOfFields = ["metadata", "namedQuery", "documentMetadata", "document"]),
                set: $util.oneOfSetter($oneOfFields)
            });
    
            /**
             * Creates a BundleElement message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof firestore.BundleElement
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {firestore.BundleElement} BundleElement
             */
            BundleElement.fromObject = function fromObject(object) {
                if (object instanceof $root.firestore.BundleElement)
                    return object;
                var message = new $root.firestore.BundleElement();
                if (object.metadata != null) {
                    if (typeof object.metadata !== "object")
                        throw TypeError(".firestore.BundleElement.metadata: object expected");
                    message.metadata = $root.firestore.BundleMetadata.fromObject(object.metadata);
                }
                if (object.namedQuery != null) {
                    if (typeof object.namedQuery !== "object")
                        throw TypeError(".firestore.BundleElement.namedQuery: object expected");
                    message.namedQuery = $root.firestore.NamedQuery.fromObject(object.namedQuery);
                }
                if (object.documentMetadata != null) {
                    if (typeof object.documentMetadata !== "object")
                        throw TypeError(".firestore.BundleElement.documentMetadata: object expected");
                    message.documentMetadata = $root.firestore.BundledDocumentMetadata.fromObject(object.documentMetadata);
                }
                if (object.document != null) {
                    if (typeof object.document !== "object")
                        throw TypeError(".firestore.BundleElement.document: object expected");
                    message.document = $root.google.firestore.v1.Document.fromObject(object.document);
                }
                return message;
            };
    
            /**
             * Creates a plain object from a BundleElement message. Also converts values to other types if specified.
             * @function toObject
             * @memberof firestore.BundleElement
             * @static
             * @param {firestore.BundleElement} message BundleElement
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            BundleElement.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (message.metadata != null && message.hasOwnProperty("metadata")) {
                    object.metadata = $root.firestore.BundleMetadata.toObject(message.metadata, options);
                    if (options.oneofs)
                        object.elementType = "metadata";
                }
                if (message.namedQuery != null && message.hasOwnProperty("namedQuery")) {
                    object.namedQuery = $root.firestore.NamedQuery.toObject(message.namedQuery, options);
                    if (options.oneofs)
                        object.elementType = "namedQuery";
                }
                if (message.documentMetadata != null && message.hasOwnProperty("documentMetadata")) {
                    object.documentMetadata = $root.firestore.BundledDocumentMetadata.toObject(message.documentMetadata, options);
                    if (options.oneofs)
                        object.elementType = "documentMetadata";
                }
                if (message.document != null && message.hasOwnProperty("document")) {
                    object.document = $root.google.firestore.v1.Document.toObject(message.document, options);
                    if (options.oneofs)
                        object.elementType = "document";
                }
                return object;
            };
    
            /**
             * Converts this BundleElement to JSON.
             * @function toJSON
             * @memberof firestore.BundleElement
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            BundleElement.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
    
            return BundleElement;
        })();
    
        return firestore;
    })();
    
    $root.google = (function() {
    
        /**
         * Namespace google.
         * @exports google
         * @namespace
         */
        var google = {};
    
        google.protobuf = (function() {
    
            /**
             * Namespace protobuf.
             * @memberof google
             * @namespace
             */
            var protobuf = {};
    
            protobuf.Timestamp = (function() {
    
                /**
                 * Properties of a Timestamp.
                 * @memberof google.protobuf
                 * @interface ITimestamp
                 * @property {number|string|null} [seconds] Timestamp seconds
                 * @property {number|null} [nanos] Timestamp nanos
                 */
    
                /**
                 * Constructs a new Timestamp.
                 * @memberof google.protobuf
                 * @classdesc Represents a Timestamp.
                 * @implements ITimestamp
                 * @constructor
                 * @param {google.protobuf.ITimestamp=} [properties] Properties to set
                 */
                function Timestamp(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Timestamp seconds.
                 * @member {number|string} seconds
                 * @memberof google.protobuf.Timestamp
                 * @instance
                 */
                Timestamp.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
    
                /**
                 * Timestamp nanos.
                 * @member {number} nanos
                 * @memberof google.protobuf.Timestamp
                 * @instance
                 */
                Timestamp.prototype.nanos = 0;
    
                /**
                 * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.Timestamp
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.Timestamp} Timestamp
                 */
                Timestamp.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.Timestamp)
                        return object;
                    var message = new $root.google.protobuf.Timestamp();
                    if (object.seconds != null)
                        if ($util.Long)
                            (message.seconds = $util.Long.fromValue(object.seconds)).unsigned = false;
                        else if (typeof object.seconds === "string")
                            message.seconds = parseInt(object.seconds, 10);
                        else if (typeof object.seconds === "number")
                            message.seconds = object.seconds;
                        else if (typeof object.seconds === "object")
                            message.seconds = new $util.LongBits(object.seconds.low >>> 0, object.seconds.high >>> 0).toNumber();
                    if (object.nanos != null)
                        message.nanos = object.nanos | 0;
                    return message;
                };
    
                /**
                 * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.Timestamp
                 * @static
                 * @param {google.protobuf.Timestamp} message Timestamp
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Timestamp.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.seconds = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.seconds = options.longs === String ? "0" : 0;
                        object.nanos = 0;
                    }
                    if (message.seconds != null && message.hasOwnProperty("seconds"))
                        if (typeof message.seconds === "number")
                            object.seconds = options.longs === String ? String(message.seconds) : message.seconds;
                        else
                            object.seconds = options.longs === String ? $util.Long.prototype.toString.call(message.seconds) : options.longs === Number ? new $util.LongBits(message.seconds.low >>> 0, message.seconds.high >>> 0).toNumber() : message.seconds;
                    if (message.nanos != null && message.hasOwnProperty("nanos"))
                        object.nanos = message.nanos;
                    return object;
                };
    
                /**
                 * Converts this Timestamp to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.Timestamp
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Timestamp.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Timestamp;
            })();
    
            protobuf.FileDescriptorSet = (function() {
    
                /**
                 * Properties of a FileDescriptorSet.
                 * @memberof google.protobuf
                 * @interface IFileDescriptorSet
                 * @property {Array.<google.protobuf.IFileDescriptorProto>|null} [file] FileDescriptorSet file
                 */
    
                /**
                 * Constructs a new FileDescriptorSet.
                 * @memberof google.protobuf
                 * @classdesc Represents a FileDescriptorSet.
                 * @implements IFileDescriptorSet
                 * @constructor
                 * @param {google.protobuf.IFileDescriptorSet=} [properties] Properties to set
                 */
                function FileDescriptorSet(properties) {
                    this.file = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * FileDescriptorSet file.
                 * @member {Array.<google.protobuf.IFileDescriptorProto>} file
                 * @memberof google.protobuf.FileDescriptorSet
                 * @instance
                 */
                FileDescriptorSet.prototype.file = $util.emptyArray;
    
                /**
                 * Creates a FileDescriptorSet message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.FileDescriptorSet
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.FileDescriptorSet} FileDescriptorSet
                 */
                FileDescriptorSet.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.FileDescriptorSet)
                        return object;
                    var message = new $root.google.protobuf.FileDescriptorSet();
                    if (object.file) {
                        if (!Array.isArray(object.file))
                            throw TypeError(".google.protobuf.FileDescriptorSet.file: array expected");
                        message.file = [];
                        for (var i = 0; i < object.file.length; ++i) {
                            if (typeof object.file[i] !== "object")
                                throw TypeError(".google.protobuf.FileDescriptorSet.file: object expected");
                            message.file[i] = $root.google.protobuf.FileDescriptorProto.fromObject(object.file[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a FileDescriptorSet message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.FileDescriptorSet
                 * @static
                 * @param {google.protobuf.FileDescriptorSet} message FileDescriptorSet
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                FileDescriptorSet.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.file = [];
                    if (message.file && message.file.length) {
                        object.file = [];
                        for (var j = 0; j < message.file.length; ++j)
                            object.file[j] = $root.google.protobuf.FileDescriptorProto.toObject(message.file[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this FileDescriptorSet to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.FileDescriptorSet
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                FileDescriptorSet.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return FileDescriptorSet;
            })();
    
            protobuf.FileDescriptorProto = (function() {
    
                /**
                 * Properties of a FileDescriptorProto.
                 * @memberof google.protobuf
                 * @interface IFileDescriptorProto
                 * @property {string|null} [name] FileDescriptorProto name
                 * @property {string|null} ["package"] FileDescriptorProto package
                 * @property {Array.<string>|null} [dependency] FileDescriptorProto dependency
                 * @property {Array.<number>|null} [publicDependency] FileDescriptorProto publicDependency
                 * @property {Array.<number>|null} [weakDependency] FileDescriptorProto weakDependency
                 * @property {Array.<google.protobuf.IDescriptorProto>|null} [messageType] FileDescriptorProto messageType
                 * @property {Array.<google.protobuf.IEnumDescriptorProto>|null} [enumType] FileDescriptorProto enumType
                 * @property {Array.<google.protobuf.IServiceDescriptorProto>|null} [service] FileDescriptorProto service
                 * @property {Array.<google.protobuf.IFieldDescriptorProto>|null} [extension] FileDescriptorProto extension
                 * @property {google.protobuf.IFileOptions|null} [options] FileDescriptorProto options
                 * @property {google.protobuf.ISourceCodeInfo|null} [sourceCodeInfo] FileDescriptorProto sourceCodeInfo
                 * @property {string|null} [syntax] FileDescriptorProto syntax
                 */
    
                /**
                 * Constructs a new FileDescriptorProto.
                 * @memberof google.protobuf
                 * @classdesc Represents a FileDescriptorProto.
                 * @implements IFileDescriptorProto
                 * @constructor
                 * @param {google.protobuf.IFileDescriptorProto=} [properties] Properties to set
                 */
                function FileDescriptorProto(properties) {
                    this.dependency = [];
                    this.publicDependency = [];
                    this.weakDependency = [];
                    this.messageType = [];
                    this.enumType = [];
                    this.service = [];
                    this.extension = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * FileDescriptorProto name.
                 * @member {string} name
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.name = "";
    
                /**
                 * FileDescriptorProto package.
                 * @member {string} package
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype["package"] = "";
    
                /**
                 * FileDescriptorProto dependency.
                 * @member {Array.<string>} dependency
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.dependency = $util.emptyArray;
    
                /**
                 * FileDescriptorProto publicDependency.
                 * @member {Array.<number>} publicDependency
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.publicDependency = $util.emptyArray;
    
                /**
                 * FileDescriptorProto weakDependency.
                 * @member {Array.<number>} weakDependency
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.weakDependency = $util.emptyArray;
    
                /**
                 * FileDescriptorProto messageType.
                 * @member {Array.<google.protobuf.IDescriptorProto>} messageType
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.messageType = $util.emptyArray;
    
                /**
                 * FileDescriptorProto enumType.
                 * @member {Array.<google.protobuf.IEnumDescriptorProto>} enumType
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.enumType = $util.emptyArray;
    
                /**
                 * FileDescriptorProto service.
                 * @member {Array.<google.protobuf.IServiceDescriptorProto>} service
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.service = $util.emptyArray;
    
                /**
                 * FileDescriptorProto extension.
                 * @member {Array.<google.protobuf.IFieldDescriptorProto>} extension
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.extension = $util.emptyArray;
    
                /**
                 * FileDescriptorProto options.
                 * @member {google.protobuf.IFileOptions|null|undefined} options
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.options = null;
    
                /**
                 * FileDescriptorProto sourceCodeInfo.
                 * @member {google.protobuf.ISourceCodeInfo|null|undefined} sourceCodeInfo
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.sourceCodeInfo = null;
    
                /**
                 * FileDescriptorProto syntax.
                 * @member {string} syntax
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 */
                FileDescriptorProto.prototype.syntax = "";
    
                /**
                 * Creates a FileDescriptorProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.FileDescriptorProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.FileDescriptorProto} FileDescriptorProto
                 */
                FileDescriptorProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.FileDescriptorProto)
                        return object;
                    var message = new $root.google.protobuf.FileDescriptorProto();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object["package"] != null)
                        message["package"] = String(object["package"]);
                    if (object.dependency) {
                        if (!Array.isArray(object.dependency))
                            throw TypeError(".google.protobuf.FileDescriptorProto.dependency: array expected");
                        message.dependency = [];
                        for (var i = 0; i < object.dependency.length; ++i)
                            message.dependency[i] = String(object.dependency[i]);
                    }
                    if (object.publicDependency) {
                        if (!Array.isArray(object.publicDependency))
                            throw TypeError(".google.protobuf.FileDescriptorProto.publicDependency: array expected");
                        message.publicDependency = [];
                        for (var i = 0; i < object.publicDependency.length; ++i)
                            message.publicDependency[i] = object.publicDependency[i] | 0;
                    }
                    if (object.weakDependency) {
                        if (!Array.isArray(object.weakDependency))
                            throw TypeError(".google.protobuf.FileDescriptorProto.weakDependency: array expected");
                        message.weakDependency = [];
                        for (var i = 0; i < object.weakDependency.length; ++i)
                            message.weakDependency[i] = object.weakDependency[i] | 0;
                    }
                    if (object.messageType) {
                        if (!Array.isArray(object.messageType))
                            throw TypeError(".google.protobuf.FileDescriptorProto.messageType: array expected");
                        message.messageType = [];
                        for (var i = 0; i < object.messageType.length; ++i) {
                            if (typeof object.messageType[i] !== "object")
                                throw TypeError(".google.protobuf.FileDescriptorProto.messageType: object expected");
                            message.messageType[i] = $root.google.protobuf.DescriptorProto.fromObject(object.messageType[i]);
                        }
                    }
                    if (object.enumType) {
                        if (!Array.isArray(object.enumType))
                            throw TypeError(".google.protobuf.FileDescriptorProto.enumType: array expected");
                        message.enumType = [];
                        for (var i = 0; i < object.enumType.length; ++i) {
                            if (typeof object.enumType[i] !== "object")
                                throw TypeError(".google.protobuf.FileDescriptorProto.enumType: object expected");
                            message.enumType[i] = $root.google.protobuf.EnumDescriptorProto.fromObject(object.enumType[i]);
                        }
                    }
                    if (object.service) {
                        if (!Array.isArray(object.service))
                            throw TypeError(".google.protobuf.FileDescriptorProto.service: array expected");
                        message.service = [];
                        for (var i = 0; i < object.service.length; ++i) {
                            if (typeof object.service[i] !== "object")
                                throw TypeError(".google.protobuf.FileDescriptorProto.service: object expected");
                            message.service[i] = $root.google.protobuf.ServiceDescriptorProto.fromObject(object.service[i]);
                        }
                    }
                    if (object.extension) {
                        if (!Array.isArray(object.extension))
                            throw TypeError(".google.protobuf.FileDescriptorProto.extension: array expected");
                        message.extension = [];
                        for (var i = 0; i < object.extension.length; ++i) {
                            if (typeof object.extension[i] !== "object")
                                throw TypeError(".google.protobuf.FileDescriptorProto.extension: object expected");
                            message.extension[i] = $root.google.protobuf.FieldDescriptorProto.fromObject(object.extension[i]);
                        }
                    }
                    if (object.options != null) {
                        if (typeof object.options !== "object")
                            throw TypeError(".google.protobuf.FileDescriptorProto.options: object expected");
                        message.options = $root.google.protobuf.FileOptions.fromObject(object.options);
                    }
                    if (object.sourceCodeInfo != null) {
                        if (typeof object.sourceCodeInfo !== "object")
                            throw TypeError(".google.protobuf.FileDescriptorProto.sourceCodeInfo: object expected");
                        message.sourceCodeInfo = $root.google.protobuf.SourceCodeInfo.fromObject(object.sourceCodeInfo);
                    }
                    if (object.syntax != null)
                        message.syntax = String(object.syntax);
                    return message;
                };
    
                /**
                 * Creates a plain object from a FileDescriptorProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.FileDescriptorProto
                 * @static
                 * @param {google.protobuf.FileDescriptorProto} message FileDescriptorProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                FileDescriptorProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults) {
                        object.dependency = [];
                        object.messageType = [];
                        object.enumType = [];
                        object.service = [];
                        object.extension = [];
                        object.publicDependency = [];
                        object.weakDependency = [];
                    }
                    if (options.defaults) {
                        object.name = "";
                        object["package"] = "";
                        object.options = null;
                        object.sourceCodeInfo = null;
                        object.syntax = "";
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message["package"] != null && message.hasOwnProperty("package"))
                        object["package"] = message["package"];
                    if (message.dependency && message.dependency.length) {
                        object.dependency = [];
                        for (var j = 0; j < message.dependency.length; ++j)
                            object.dependency[j] = message.dependency[j];
                    }
                    if (message.messageType && message.messageType.length) {
                        object.messageType = [];
                        for (var j = 0; j < message.messageType.length; ++j)
                            object.messageType[j] = $root.google.protobuf.DescriptorProto.toObject(message.messageType[j], options);
                    }
                    if (message.enumType && message.enumType.length) {
                        object.enumType = [];
                        for (var j = 0; j < message.enumType.length; ++j)
                            object.enumType[j] = $root.google.protobuf.EnumDescriptorProto.toObject(message.enumType[j], options);
                    }
                    if (message.service && message.service.length) {
                        object.service = [];
                        for (var j = 0; j < message.service.length; ++j)
                            object.service[j] = $root.google.protobuf.ServiceDescriptorProto.toObject(message.service[j], options);
                    }
                    if (message.extension && message.extension.length) {
                        object.extension = [];
                        for (var j = 0; j < message.extension.length; ++j)
                            object.extension[j] = $root.google.protobuf.FieldDescriptorProto.toObject(message.extension[j], options);
                    }
                    if (message.options != null && message.hasOwnProperty("options"))
                        object.options = $root.google.protobuf.FileOptions.toObject(message.options, options);
                    if (message.sourceCodeInfo != null && message.hasOwnProperty("sourceCodeInfo"))
                        object.sourceCodeInfo = $root.google.protobuf.SourceCodeInfo.toObject(message.sourceCodeInfo, options);
                    if (message.publicDependency && message.publicDependency.length) {
                        object.publicDependency = [];
                        for (var j = 0; j < message.publicDependency.length; ++j)
                            object.publicDependency[j] = message.publicDependency[j];
                    }
                    if (message.weakDependency && message.weakDependency.length) {
                        object.weakDependency = [];
                        for (var j = 0; j < message.weakDependency.length; ++j)
                            object.weakDependency[j] = message.weakDependency[j];
                    }
                    if (message.syntax != null && message.hasOwnProperty("syntax"))
                        object.syntax = message.syntax;
                    return object;
                };
    
                /**
                 * Converts this FileDescriptorProto to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.FileDescriptorProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                FileDescriptorProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return FileDescriptorProto;
            })();
    
            protobuf.DescriptorProto = (function() {
    
                /**
                 * Properties of a DescriptorProto.
                 * @memberof google.protobuf
                 * @interface IDescriptorProto
                 * @property {string|null} [name] DescriptorProto name
                 * @property {Array.<google.protobuf.IFieldDescriptorProto>|null} [field] DescriptorProto field
                 * @property {Array.<google.protobuf.IFieldDescriptorProto>|null} [extension] DescriptorProto extension
                 * @property {Array.<google.protobuf.IDescriptorProto>|null} [nestedType] DescriptorProto nestedType
                 * @property {Array.<google.protobuf.IEnumDescriptorProto>|null} [enumType] DescriptorProto enumType
                 * @property {Array.<google.protobuf.DescriptorProto.IExtensionRange>|null} [extensionRange] DescriptorProto extensionRange
                 * @property {Array.<google.protobuf.IOneofDescriptorProto>|null} [oneofDecl] DescriptorProto oneofDecl
                 * @property {google.protobuf.IMessageOptions|null} [options] DescriptorProto options
                 * @property {Array.<google.protobuf.DescriptorProto.IReservedRange>|null} [reservedRange] DescriptorProto reservedRange
                 * @property {Array.<string>|null} [reservedName] DescriptorProto reservedName
                 */
    
                /**
                 * Constructs a new DescriptorProto.
                 * @memberof google.protobuf
                 * @classdesc Represents a DescriptorProto.
                 * @implements IDescriptorProto
                 * @constructor
                 * @param {google.protobuf.IDescriptorProto=} [properties] Properties to set
                 */
                function DescriptorProto(properties) {
                    this.field = [];
                    this.extension = [];
                    this.nestedType = [];
                    this.enumType = [];
                    this.extensionRange = [];
                    this.oneofDecl = [];
                    this.reservedRange = [];
                    this.reservedName = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * DescriptorProto name.
                 * @member {string} name
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.name = "";
    
                /**
                 * DescriptorProto field.
                 * @member {Array.<google.protobuf.IFieldDescriptorProto>} field
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.field = $util.emptyArray;
    
                /**
                 * DescriptorProto extension.
                 * @member {Array.<google.protobuf.IFieldDescriptorProto>} extension
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.extension = $util.emptyArray;
    
                /**
                 * DescriptorProto nestedType.
                 * @member {Array.<google.protobuf.IDescriptorProto>} nestedType
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.nestedType = $util.emptyArray;
    
                /**
                 * DescriptorProto enumType.
                 * @member {Array.<google.protobuf.IEnumDescriptorProto>} enumType
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.enumType = $util.emptyArray;
    
                /**
                 * DescriptorProto extensionRange.
                 * @member {Array.<google.protobuf.DescriptorProto.IExtensionRange>} extensionRange
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.extensionRange = $util.emptyArray;
    
                /**
                 * DescriptorProto oneofDecl.
                 * @member {Array.<google.protobuf.IOneofDescriptorProto>} oneofDecl
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.oneofDecl = $util.emptyArray;
    
                /**
                 * DescriptorProto options.
                 * @member {google.protobuf.IMessageOptions|null|undefined} options
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.options = null;
    
                /**
                 * DescriptorProto reservedRange.
                 * @member {Array.<google.protobuf.DescriptorProto.IReservedRange>} reservedRange
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.reservedRange = $util.emptyArray;
    
                /**
                 * DescriptorProto reservedName.
                 * @member {Array.<string>} reservedName
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 */
                DescriptorProto.prototype.reservedName = $util.emptyArray;
    
                /**
                 * Creates a DescriptorProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.DescriptorProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.DescriptorProto} DescriptorProto
                 */
                DescriptorProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.DescriptorProto)
                        return object;
                    var message = new $root.google.protobuf.DescriptorProto();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.field) {
                        if (!Array.isArray(object.field))
                            throw TypeError(".google.protobuf.DescriptorProto.field: array expected");
                        message.field = [];
                        for (var i = 0; i < object.field.length; ++i) {
                            if (typeof object.field[i] !== "object")
                                throw TypeError(".google.protobuf.DescriptorProto.field: object expected");
                            message.field[i] = $root.google.protobuf.FieldDescriptorProto.fromObject(object.field[i]);
                        }
                    }
                    if (object.extension) {
                        if (!Array.isArray(object.extension))
                            throw TypeError(".google.protobuf.DescriptorProto.extension: array expected");
                        message.extension = [];
                        for (var i = 0; i < object.extension.length; ++i) {
                            if (typeof object.extension[i] !== "object")
                                throw TypeError(".google.protobuf.DescriptorProto.extension: object expected");
                            message.extension[i] = $root.google.protobuf.FieldDescriptorProto.fromObject(object.extension[i]);
                        }
                    }
                    if (object.nestedType) {
                        if (!Array.isArray(object.nestedType))
                            throw TypeError(".google.protobuf.DescriptorProto.nestedType: array expected");
                        message.nestedType = [];
                        for (var i = 0; i < object.nestedType.length; ++i) {
                            if (typeof object.nestedType[i] !== "object")
                                throw TypeError(".google.protobuf.DescriptorProto.nestedType: object expected");
                            message.nestedType[i] = $root.google.protobuf.DescriptorProto.fromObject(object.nestedType[i]);
                        }
                    }
                    if (object.enumType) {
                        if (!Array.isArray(object.enumType))
                            throw TypeError(".google.protobuf.DescriptorProto.enumType: array expected");
                        message.enumType = [];
                        for (var i = 0; i < object.enumType.length; ++i) {
                            if (typeof object.enumType[i] !== "object")
                                throw TypeError(".google.protobuf.DescriptorProto.enumType: object expected");
                            message.enumType[i] = $root.google.protobuf.EnumDescriptorProto.fromObject(object.enumType[i]);
                        }
                    }
                    if (object.extensionRange) {
                        if (!Array.isArray(object.extensionRange))
                            throw TypeError(".google.protobuf.DescriptorProto.extensionRange: array expected");
                        message.extensionRange = [];
                        for (var i = 0; i < object.extensionRange.length; ++i) {
                            if (typeof object.extensionRange[i] !== "object")
                                throw TypeError(".google.protobuf.DescriptorProto.extensionRange: object expected");
                            message.extensionRange[i] = $root.google.protobuf.DescriptorProto.ExtensionRange.fromObject(object.extensionRange[i]);
                        }
                    }
                    if (object.oneofDecl) {
                        if (!Array.isArray(object.oneofDecl))
                            throw TypeError(".google.protobuf.DescriptorProto.oneofDecl: array expected");
                        message.oneofDecl = [];
                        for (var i = 0; i < object.oneofDecl.length; ++i) {
                            if (typeof object.oneofDecl[i] !== "object")
                                throw TypeError(".google.protobuf.DescriptorProto.oneofDecl: object expected");
                            message.oneofDecl[i] = $root.google.protobuf.OneofDescriptorProto.fromObject(object.oneofDecl[i]);
                        }
                    }
                    if (object.options != null) {
                        if (typeof object.options !== "object")
                            throw TypeError(".google.protobuf.DescriptorProto.options: object expected");
                        message.options = $root.google.protobuf.MessageOptions.fromObject(object.options);
                    }
                    if (object.reservedRange) {
                        if (!Array.isArray(object.reservedRange))
                            throw TypeError(".google.protobuf.DescriptorProto.reservedRange: array expected");
                        message.reservedRange = [];
                        for (var i = 0; i < object.reservedRange.length; ++i) {
                            if (typeof object.reservedRange[i] !== "object")
                                throw TypeError(".google.protobuf.DescriptorProto.reservedRange: object expected");
                            message.reservedRange[i] = $root.google.protobuf.DescriptorProto.ReservedRange.fromObject(object.reservedRange[i]);
                        }
                    }
                    if (object.reservedName) {
                        if (!Array.isArray(object.reservedName))
                            throw TypeError(".google.protobuf.DescriptorProto.reservedName: array expected");
                        message.reservedName = [];
                        for (var i = 0; i < object.reservedName.length; ++i)
                            message.reservedName[i] = String(object.reservedName[i]);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a DescriptorProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.DescriptorProto
                 * @static
                 * @param {google.protobuf.DescriptorProto} message DescriptorProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                DescriptorProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults) {
                        object.field = [];
                        object.nestedType = [];
                        object.enumType = [];
                        object.extensionRange = [];
                        object.extension = [];
                        object.oneofDecl = [];
                        object.reservedRange = [];
                        object.reservedName = [];
                    }
                    if (options.defaults) {
                        object.name = "";
                        object.options = null;
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.field && message.field.length) {
                        object.field = [];
                        for (var j = 0; j < message.field.length; ++j)
                            object.field[j] = $root.google.protobuf.FieldDescriptorProto.toObject(message.field[j], options);
                    }
                    if (message.nestedType && message.nestedType.length) {
                        object.nestedType = [];
                        for (var j = 0; j < message.nestedType.length; ++j)
                            object.nestedType[j] = $root.google.protobuf.DescriptorProto.toObject(message.nestedType[j], options);
                    }
                    if (message.enumType && message.enumType.length) {
                        object.enumType = [];
                        for (var j = 0; j < message.enumType.length; ++j)
                            object.enumType[j] = $root.google.protobuf.EnumDescriptorProto.toObject(message.enumType[j], options);
                    }
                    if (message.extensionRange && message.extensionRange.length) {
                        object.extensionRange = [];
                        for (var j = 0; j < message.extensionRange.length; ++j)
                            object.extensionRange[j] = $root.google.protobuf.DescriptorProto.ExtensionRange.toObject(message.extensionRange[j], options);
                    }
                    if (message.extension && message.extension.length) {
                        object.extension = [];
                        for (var j = 0; j < message.extension.length; ++j)
                            object.extension[j] = $root.google.protobuf.FieldDescriptorProto.toObject(message.extension[j], options);
                    }
                    if (message.options != null && message.hasOwnProperty("options"))
                        object.options = $root.google.protobuf.MessageOptions.toObject(message.options, options);
                    if (message.oneofDecl && message.oneofDecl.length) {
                        object.oneofDecl = [];
                        for (var j = 0; j < message.oneofDecl.length; ++j)
                            object.oneofDecl[j] = $root.google.protobuf.OneofDescriptorProto.toObject(message.oneofDecl[j], options);
                    }
                    if (message.reservedRange && message.reservedRange.length) {
                        object.reservedRange = [];
                        for (var j = 0; j < message.reservedRange.length; ++j)
                            object.reservedRange[j] = $root.google.protobuf.DescriptorProto.ReservedRange.toObject(message.reservedRange[j], options);
                    }
                    if (message.reservedName && message.reservedName.length) {
                        object.reservedName = [];
                        for (var j = 0; j < message.reservedName.length; ++j)
                            object.reservedName[j] = message.reservedName[j];
                    }
                    return object;
                };
    
                /**
                 * Converts this DescriptorProto to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.DescriptorProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                DescriptorProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                DescriptorProto.ExtensionRange = (function() {
    
                    /**
                     * Properties of an ExtensionRange.
                     * @memberof google.protobuf.DescriptorProto
                     * @interface IExtensionRange
                     * @property {number|null} [start] ExtensionRange start
                     * @property {number|null} [end] ExtensionRange end
                     */
    
                    /**
                     * Constructs a new ExtensionRange.
                     * @memberof google.protobuf.DescriptorProto
                     * @classdesc Represents an ExtensionRange.
                     * @implements IExtensionRange
                     * @constructor
                     * @param {google.protobuf.DescriptorProto.IExtensionRange=} [properties] Properties to set
                     */
                    function ExtensionRange(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ExtensionRange start.
                     * @member {number} start
                     * @memberof google.protobuf.DescriptorProto.ExtensionRange
                     * @instance
                     */
                    ExtensionRange.prototype.start = 0;
    
                    /**
                     * ExtensionRange end.
                     * @member {number} end
                     * @memberof google.protobuf.DescriptorProto.ExtensionRange
                     * @instance
                     */
                    ExtensionRange.prototype.end = 0;
    
                    /**
                     * Creates an ExtensionRange message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.protobuf.DescriptorProto.ExtensionRange
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.protobuf.DescriptorProto.ExtensionRange} ExtensionRange
                     */
                    ExtensionRange.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.protobuf.DescriptorProto.ExtensionRange)
                            return object;
                        var message = new $root.google.protobuf.DescriptorProto.ExtensionRange();
                        if (object.start != null)
                            message.start = object.start | 0;
                        if (object.end != null)
                            message.end = object.end | 0;
                        return message;
                    };
    
                    /**
                     * Creates a plain object from an ExtensionRange message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.protobuf.DescriptorProto.ExtensionRange
                     * @static
                     * @param {google.protobuf.DescriptorProto.ExtensionRange} message ExtensionRange
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ExtensionRange.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.start = 0;
                            object.end = 0;
                        }
                        if (message.start != null && message.hasOwnProperty("start"))
                            object.start = message.start;
                        if (message.end != null && message.hasOwnProperty("end"))
                            object.end = message.end;
                        return object;
                    };
    
                    /**
                     * Converts this ExtensionRange to JSON.
                     * @function toJSON
                     * @memberof google.protobuf.DescriptorProto.ExtensionRange
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ExtensionRange.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ExtensionRange;
                })();
    
                DescriptorProto.ReservedRange = (function() {
    
                    /**
                     * Properties of a ReservedRange.
                     * @memberof google.protobuf.DescriptorProto
                     * @interface IReservedRange
                     * @property {number|null} [start] ReservedRange start
                     * @property {number|null} [end] ReservedRange end
                     */
    
                    /**
                     * Constructs a new ReservedRange.
                     * @memberof google.protobuf.DescriptorProto
                     * @classdesc Represents a ReservedRange.
                     * @implements IReservedRange
                     * @constructor
                     * @param {google.protobuf.DescriptorProto.IReservedRange=} [properties] Properties to set
                     */
                    function ReservedRange(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ReservedRange start.
                     * @member {number} start
                     * @memberof google.protobuf.DescriptorProto.ReservedRange
                     * @instance
                     */
                    ReservedRange.prototype.start = 0;
    
                    /**
                     * ReservedRange end.
                     * @member {number} end
                     * @memberof google.protobuf.DescriptorProto.ReservedRange
                     * @instance
                     */
                    ReservedRange.prototype.end = 0;
    
                    /**
                     * Creates a ReservedRange message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.protobuf.DescriptorProto.ReservedRange
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.protobuf.DescriptorProto.ReservedRange} ReservedRange
                     */
                    ReservedRange.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.protobuf.DescriptorProto.ReservedRange)
                            return object;
                        var message = new $root.google.protobuf.DescriptorProto.ReservedRange();
                        if (object.start != null)
                            message.start = object.start | 0;
                        if (object.end != null)
                            message.end = object.end | 0;
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a ReservedRange message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.protobuf.DescriptorProto.ReservedRange
                     * @static
                     * @param {google.protobuf.DescriptorProto.ReservedRange} message ReservedRange
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ReservedRange.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.start = 0;
                            object.end = 0;
                        }
                        if (message.start != null && message.hasOwnProperty("start"))
                            object.start = message.start;
                        if (message.end != null && message.hasOwnProperty("end"))
                            object.end = message.end;
                        return object;
                    };
    
                    /**
                     * Converts this ReservedRange to JSON.
                     * @function toJSON
                     * @memberof google.protobuf.DescriptorProto.ReservedRange
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ReservedRange.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ReservedRange;
                })();
    
                return DescriptorProto;
            })();
    
            protobuf.FieldDescriptorProto = (function() {
    
                /**
                 * Properties of a FieldDescriptorProto.
                 * @memberof google.protobuf
                 * @interface IFieldDescriptorProto
                 * @property {string|null} [name] FieldDescriptorProto name
                 * @property {number|null} [number] FieldDescriptorProto number
                 * @property {google.protobuf.FieldDescriptorProto.Label|null} [label] FieldDescriptorProto label
                 * @property {google.protobuf.FieldDescriptorProto.Type|null} [type] FieldDescriptorProto type
                 * @property {string|null} [typeName] FieldDescriptorProto typeName
                 * @property {string|null} [extendee] FieldDescriptorProto extendee
                 * @property {string|null} [defaultValue] FieldDescriptorProto defaultValue
                 * @property {number|null} [oneofIndex] FieldDescriptorProto oneofIndex
                 * @property {string|null} [jsonName] FieldDescriptorProto jsonName
                 * @property {google.protobuf.IFieldOptions|null} [options] FieldDescriptorProto options
                 */
    
                /**
                 * Constructs a new FieldDescriptorProto.
                 * @memberof google.protobuf
                 * @classdesc Represents a FieldDescriptorProto.
                 * @implements IFieldDescriptorProto
                 * @constructor
                 * @param {google.protobuf.IFieldDescriptorProto=} [properties] Properties to set
                 */
                function FieldDescriptorProto(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * FieldDescriptorProto name.
                 * @member {string} name
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.name = "";
    
                /**
                 * FieldDescriptorProto number.
                 * @member {number} number
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.number = 0;
    
                /**
                 * FieldDescriptorProto label.
                 * @member {google.protobuf.FieldDescriptorProto.Label} label
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.label = 1;
    
                /**
                 * FieldDescriptorProto type.
                 * @member {google.protobuf.FieldDescriptorProto.Type} type
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.type = 1;
    
                /**
                 * FieldDescriptorProto typeName.
                 * @member {string} typeName
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.typeName = "";
    
                /**
                 * FieldDescriptorProto extendee.
                 * @member {string} extendee
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.extendee = "";
    
                /**
                 * FieldDescriptorProto defaultValue.
                 * @member {string} defaultValue
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.defaultValue = "";
    
                /**
                 * FieldDescriptorProto oneofIndex.
                 * @member {number} oneofIndex
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.oneofIndex = 0;
    
                /**
                 * FieldDescriptorProto jsonName.
                 * @member {string} jsonName
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.jsonName = "";
    
                /**
                 * FieldDescriptorProto options.
                 * @member {google.protobuf.IFieldOptions|null|undefined} options
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 */
                FieldDescriptorProto.prototype.options = null;
    
                /**
                 * Creates a FieldDescriptorProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.FieldDescriptorProto} FieldDescriptorProto
                 */
                FieldDescriptorProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.FieldDescriptorProto)
                        return object;
                    var message = new $root.google.protobuf.FieldDescriptorProto();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.number != null)
                        message.number = object.number | 0;
                    switch (object.label) {
                    case "LABEL_OPTIONAL":
                    case 1:
                        message.label = 1;
                        break;
                    case "LABEL_REQUIRED":
                    case 2:
                        message.label = 2;
                        break;
                    case "LABEL_REPEATED":
                    case 3:
                        message.label = 3;
                        break;
                    }
                    switch (object.type) {
                    case "TYPE_DOUBLE":
                    case 1:
                        message.type = 1;
                        break;
                    case "TYPE_FLOAT":
                    case 2:
                        message.type = 2;
                        break;
                    case "TYPE_INT64":
                    case 3:
                        message.type = 3;
                        break;
                    case "TYPE_UINT64":
                    case 4:
                        message.type = 4;
                        break;
                    case "TYPE_INT32":
                    case 5:
                        message.type = 5;
                        break;
                    case "TYPE_FIXED64":
                    case 6:
                        message.type = 6;
                        break;
                    case "TYPE_FIXED32":
                    case 7:
                        message.type = 7;
                        break;
                    case "TYPE_BOOL":
                    case 8:
                        message.type = 8;
                        break;
                    case "TYPE_STRING":
                    case 9:
                        message.type = 9;
                        break;
                    case "TYPE_GROUP":
                    case 10:
                        message.type = 10;
                        break;
                    case "TYPE_MESSAGE":
                    case 11:
                        message.type = 11;
                        break;
                    case "TYPE_BYTES":
                    case 12:
                        message.type = 12;
                        break;
                    case "TYPE_UINT32":
                    case 13:
                        message.type = 13;
                        break;
                    case "TYPE_ENUM":
                    case 14:
                        message.type = 14;
                        break;
                    case "TYPE_SFIXED32":
                    case 15:
                        message.type = 15;
                        break;
                    case "TYPE_SFIXED64":
                    case 16:
                        message.type = 16;
                        break;
                    case "TYPE_SINT32":
                    case 17:
                        message.type = 17;
                        break;
                    case "TYPE_SINT64":
                    case 18:
                        message.type = 18;
                        break;
                    }
                    if (object.typeName != null)
                        message.typeName = String(object.typeName);
                    if (object.extendee != null)
                        message.extendee = String(object.extendee);
                    if (object.defaultValue != null)
                        message.defaultValue = String(object.defaultValue);
                    if (object.oneofIndex != null)
                        message.oneofIndex = object.oneofIndex | 0;
                    if (object.jsonName != null)
                        message.jsonName = String(object.jsonName);
                    if (object.options != null) {
                        if (typeof object.options !== "object")
                            throw TypeError(".google.protobuf.FieldDescriptorProto.options: object expected");
                        message.options = $root.google.protobuf.FieldOptions.fromObject(object.options);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a FieldDescriptorProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @static
                 * @param {google.protobuf.FieldDescriptorProto} message FieldDescriptorProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                FieldDescriptorProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.name = "";
                        object.extendee = "";
                        object.number = 0;
                        object.label = options.enums === String ? "LABEL_OPTIONAL" : 1;
                        object.type = options.enums === String ? "TYPE_DOUBLE" : 1;
                        object.typeName = "";
                        object.defaultValue = "";
                        object.options = null;
                        object.oneofIndex = 0;
                        object.jsonName = "";
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.extendee != null && message.hasOwnProperty("extendee"))
                        object.extendee = message.extendee;
                    if (message.number != null && message.hasOwnProperty("number"))
                        object.number = message.number;
                    if (message.label != null && message.hasOwnProperty("label"))
                        object.label = options.enums === String ? $root.google.protobuf.FieldDescriptorProto.Label[message.label] : message.label;
                    if (message.type != null && message.hasOwnProperty("type"))
                        object.type = options.enums === String ? $root.google.protobuf.FieldDescriptorProto.Type[message.type] : message.type;
                    if (message.typeName != null && message.hasOwnProperty("typeName"))
                        object.typeName = message.typeName;
                    if (message.defaultValue != null && message.hasOwnProperty("defaultValue"))
                        object.defaultValue = message.defaultValue;
                    if (message.options != null && message.hasOwnProperty("options"))
                        object.options = $root.google.protobuf.FieldOptions.toObject(message.options, options);
                    if (message.oneofIndex != null && message.hasOwnProperty("oneofIndex"))
                        object.oneofIndex = message.oneofIndex;
                    if (message.jsonName != null && message.hasOwnProperty("jsonName"))
                        object.jsonName = message.jsonName;
                    return object;
                };
    
                /**
                 * Converts this FieldDescriptorProto to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                FieldDescriptorProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Type enum.
                 * @name google.protobuf.FieldDescriptorProto.Type
                 * @enum {string}
                 * @property {string} TYPE_DOUBLE=TYPE_DOUBLE TYPE_DOUBLE value
                 * @property {string} TYPE_FLOAT=TYPE_FLOAT TYPE_FLOAT value
                 * @property {string} TYPE_INT64=TYPE_INT64 TYPE_INT64 value
                 * @property {string} TYPE_UINT64=TYPE_UINT64 TYPE_UINT64 value
                 * @property {string} TYPE_INT32=TYPE_INT32 TYPE_INT32 value
                 * @property {string} TYPE_FIXED64=TYPE_FIXED64 TYPE_FIXED64 value
                 * @property {string} TYPE_FIXED32=TYPE_FIXED32 TYPE_FIXED32 value
                 * @property {string} TYPE_BOOL=TYPE_BOOL TYPE_BOOL value
                 * @property {string} TYPE_STRING=TYPE_STRING TYPE_STRING value
                 * @property {string} TYPE_GROUP=TYPE_GROUP TYPE_GROUP value
                 * @property {string} TYPE_MESSAGE=TYPE_MESSAGE TYPE_MESSAGE value
                 * @property {string} TYPE_BYTES=TYPE_BYTES TYPE_BYTES value
                 * @property {string} TYPE_UINT32=TYPE_UINT32 TYPE_UINT32 value
                 * @property {string} TYPE_ENUM=TYPE_ENUM TYPE_ENUM value
                 * @property {string} TYPE_SFIXED32=TYPE_SFIXED32 TYPE_SFIXED32 value
                 * @property {string} TYPE_SFIXED64=TYPE_SFIXED64 TYPE_SFIXED64 value
                 * @property {string} TYPE_SINT32=TYPE_SINT32 TYPE_SINT32 value
                 * @property {string} TYPE_SINT64=TYPE_SINT64 TYPE_SINT64 value
                 */
                FieldDescriptorProto.Type = (function() {
                    var valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[1] = "TYPE_DOUBLE"] = "TYPE_DOUBLE";
                    values[valuesById[2] = "TYPE_FLOAT"] = "TYPE_FLOAT";
                    values[valuesById[3] = "TYPE_INT64"] = "TYPE_INT64";
                    values[valuesById[4] = "TYPE_UINT64"] = "TYPE_UINT64";
                    values[valuesById[5] = "TYPE_INT32"] = "TYPE_INT32";
                    values[valuesById[6] = "TYPE_FIXED64"] = "TYPE_FIXED64";
                    values[valuesById[7] = "TYPE_FIXED32"] = "TYPE_FIXED32";
                    values[valuesById[8] = "TYPE_BOOL"] = "TYPE_BOOL";
                    values[valuesById[9] = "TYPE_STRING"] = "TYPE_STRING";
                    values[valuesById[10] = "TYPE_GROUP"] = "TYPE_GROUP";
                    values[valuesById[11] = "TYPE_MESSAGE"] = "TYPE_MESSAGE";
                    values[valuesById[12] = "TYPE_BYTES"] = "TYPE_BYTES";
                    values[valuesById[13] = "TYPE_UINT32"] = "TYPE_UINT32";
                    values[valuesById[14] = "TYPE_ENUM"] = "TYPE_ENUM";
                    values[valuesById[15] = "TYPE_SFIXED32"] = "TYPE_SFIXED32";
                    values[valuesById[16] = "TYPE_SFIXED64"] = "TYPE_SFIXED64";
                    values[valuesById[17] = "TYPE_SINT32"] = "TYPE_SINT32";
                    values[valuesById[18] = "TYPE_SINT64"] = "TYPE_SINT64";
                    return values;
                })();
    
                /**
                 * Label enum.
                 * @name google.protobuf.FieldDescriptorProto.Label
                 * @enum {string}
                 * @property {string} LABEL_OPTIONAL=LABEL_OPTIONAL LABEL_OPTIONAL value
                 * @property {string} LABEL_REQUIRED=LABEL_REQUIRED LABEL_REQUIRED value
                 * @property {string} LABEL_REPEATED=LABEL_REPEATED LABEL_REPEATED value
                 */
                FieldDescriptorProto.Label = (function() {
                    var valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[1] = "LABEL_OPTIONAL"] = "LABEL_OPTIONAL";
                    values[valuesById[2] = "LABEL_REQUIRED"] = "LABEL_REQUIRED";
                    values[valuesById[3] = "LABEL_REPEATED"] = "LABEL_REPEATED";
                    return values;
                })();
    
                return FieldDescriptorProto;
            })();
    
            protobuf.OneofDescriptorProto = (function() {
    
                /**
                 * Properties of an OneofDescriptorProto.
                 * @memberof google.protobuf
                 * @interface IOneofDescriptorProto
                 * @property {string|null} [name] OneofDescriptorProto name
                 * @property {google.protobuf.IOneofOptions|null} [options] OneofDescriptorProto options
                 */
    
                /**
                 * Constructs a new OneofDescriptorProto.
                 * @memberof google.protobuf
                 * @classdesc Represents an OneofDescriptorProto.
                 * @implements IOneofDescriptorProto
                 * @constructor
                 * @param {google.protobuf.IOneofDescriptorProto=} [properties] Properties to set
                 */
                function OneofDescriptorProto(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * OneofDescriptorProto name.
                 * @member {string} name
                 * @memberof google.protobuf.OneofDescriptorProto
                 * @instance
                 */
                OneofDescriptorProto.prototype.name = "";
    
                /**
                 * OneofDescriptorProto options.
                 * @member {google.protobuf.IOneofOptions|null|undefined} options
                 * @memberof google.protobuf.OneofDescriptorProto
                 * @instance
                 */
                OneofDescriptorProto.prototype.options = null;
    
                /**
                 * Creates an OneofDescriptorProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.OneofDescriptorProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.OneofDescriptorProto} OneofDescriptorProto
                 */
                OneofDescriptorProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.OneofDescriptorProto)
                        return object;
                    var message = new $root.google.protobuf.OneofDescriptorProto();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.options != null) {
                        if (typeof object.options !== "object")
                            throw TypeError(".google.protobuf.OneofDescriptorProto.options: object expected");
                        message.options = $root.google.protobuf.OneofOptions.fromObject(object.options);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from an OneofDescriptorProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.OneofDescriptorProto
                 * @static
                 * @param {google.protobuf.OneofDescriptorProto} message OneofDescriptorProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                OneofDescriptorProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.name = "";
                        object.options = null;
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.options != null && message.hasOwnProperty("options"))
                        object.options = $root.google.protobuf.OneofOptions.toObject(message.options, options);
                    return object;
                };
    
                /**
                 * Converts this OneofDescriptorProto to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.OneofDescriptorProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                OneofDescriptorProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return OneofDescriptorProto;
            })();
    
            protobuf.EnumDescriptorProto = (function() {
    
                /**
                 * Properties of an EnumDescriptorProto.
                 * @memberof google.protobuf
                 * @interface IEnumDescriptorProto
                 * @property {string|null} [name] EnumDescriptorProto name
                 * @property {Array.<google.protobuf.IEnumValueDescriptorProto>|null} [value] EnumDescriptorProto value
                 * @property {google.protobuf.IEnumOptions|null} [options] EnumDescriptorProto options
                 */
    
                /**
                 * Constructs a new EnumDescriptorProto.
                 * @memberof google.protobuf
                 * @classdesc Represents an EnumDescriptorProto.
                 * @implements IEnumDescriptorProto
                 * @constructor
                 * @param {google.protobuf.IEnumDescriptorProto=} [properties] Properties to set
                 */
                function EnumDescriptorProto(properties) {
                    this.value = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * EnumDescriptorProto name.
                 * @member {string} name
                 * @memberof google.protobuf.EnumDescriptorProto
                 * @instance
                 */
                EnumDescriptorProto.prototype.name = "";
    
                /**
                 * EnumDescriptorProto value.
                 * @member {Array.<google.protobuf.IEnumValueDescriptorProto>} value
                 * @memberof google.protobuf.EnumDescriptorProto
                 * @instance
                 */
                EnumDescriptorProto.prototype.value = $util.emptyArray;
    
                /**
                 * EnumDescriptorProto options.
                 * @member {google.protobuf.IEnumOptions|null|undefined} options
                 * @memberof google.protobuf.EnumDescriptorProto
                 * @instance
                 */
                EnumDescriptorProto.prototype.options = null;
    
                /**
                 * Creates an EnumDescriptorProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.EnumDescriptorProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.EnumDescriptorProto} EnumDescriptorProto
                 */
                EnumDescriptorProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.EnumDescriptorProto)
                        return object;
                    var message = new $root.google.protobuf.EnumDescriptorProto();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.value) {
                        if (!Array.isArray(object.value))
                            throw TypeError(".google.protobuf.EnumDescriptorProto.value: array expected");
                        message.value = [];
                        for (var i = 0; i < object.value.length; ++i) {
                            if (typeof object.value[i] !== "object")
                                throw TypeError(".google.protobuf.EnumDescriptorProto.value: object expected");
                            message.value[i] = $root.google.protobuf.EnumValueDescriptorProto.fromObject(object.value[i]);
                        }
                    }
                    if (object.options != null) {
                        if (typeof object.options !== "object")
                            throw TypeError(".google.protobuf.EnumDescriptorProto.options: object expected");
                        message.options = $root.google.protobuf.EnumOptions.fromObject(object.options);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from an EnumDescriptorProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.EnumDescriptorProto
                 * @static
                 * @param {google.protobuf.EnumDescriptorProto} message EnumDescriptorProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                EnumDescriptorProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.value = [];
                    if (options.defaults) {
                        object.name = "";
                        object.options = null;
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.value && message.value.length) {
                        object.value = [];
                        for (var j = 0; j < message.value.length; ++j)
                            object.value[j] = $root.google.protobuf.EnumValueDescriptorProto.toObject(message.value[j], options);
                    }
                    if (message.options != null && message.hasOwnProperty("options"))
                        object.options = $root.google.protobuf.EnumOptions.toObject(message.options, options);
                    return object;
                };
    
                /**
                 * Converts this EnumDescriptorProto to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.EnumDescriptorProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                EnumDescriptorProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return EnumDescriptorProto;
            })();
    
            protobuf.EnumValueDescriptorProto = (function() {
    
                /**
                 * Properties of an EnumValueDescriptorProto.
                 * @memberof google.protobuf
                 * @interface IEnumValueDescriptorProto
                 * @property {string|null} [name] EnumValueDescriptorProto name
                 * @property {number|null} [number] EnumValueDescriptorProto number
                 * @property {google.protobuf.IEnumValueOptions|null} [options] EnumValueDescriptorProto options
                 */
    
                /**
                 * Constructs a new EnumValueDescriptorProto.
                 * @memberof google.protobuf
                 * @classdesc Represents an EnumValueDescriptorProto.
                 * @implements IEnumValueDescriptorProto
                 * @constructor
                 * @param {google.protobuf.IEnumValueDescriptorProto=} [properties] Properties to set
                 */
                function EnumValueDescriptorProto(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * EnumValueDescriptorProto name.
                 * @member {string} name
                 * @memberof google.protobuf.EnumValueDescriptorProto
                 * @instance
                 */
                EnumValueDescriptorProto.prototype.name = "";
    
                /**
                 * EnumValueDescriptorProto number.
                 * @member {number} number
                 * @memberof google.protobuf.EnumValueDescriptorProto
                 * @instance
                 */
                EnumValueDescriptorProto.prototype.number = 0;
    
                /**
                 * EnumValueDescriptorProto options.
                 * @member {google.protobuf.IEnumValueOptions|null|undefined} options
                 * @memberof google.protobuf.EnumValueDescriptorProto
                 * @instance
                 */
                EnumValueDescriptorProto.prototype.options = null;
    
                /**
                 * Creates an EnumValueDescriptorProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.EnumValueDescriptorProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.EnumValueDescriptorProto} EnumValueDescriptorProto
                 */
                EnumValueDescriptorProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.EnumValueDescriptorProto)
                        return object;
                    var message = new $root.google.protobuf.EnumValueDescriptorProto();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.number != null)
                        message.number = object.number | 0;
                    if (object.options != null) {
                        if (typeof object.options !== "object")
                            throw TypeError(".google.protobuf.EnumValueDescriptorProto.options: object expected");
                        message.options = $root.google.protobuf.EnumValueOptions.fromObject(object.options);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from an EnumValueDescriptorProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.EnumValueDescriptorProto
                 * @static
                 * @param {google.protobuf.EnumValueDescriptorProto} message EnumValueDescriptorProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                EnumValueDescriptorProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.name = "";
                        object.number = 0;
                        object.options = null;
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.number != null && message.hasOwnProperty("number"))
                        object.number = message.number;
                    if (message.options != null && message.hasOwnProperty("options"))
                        object.options = $root.google.protobuf.EnumValueOptions.toObject(message.options, options);
                    return object;
                };
    
                /**
                 * Converts this EnumValueDescriptorProto to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.EnumValueDescriptorProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                EnumValueDescriptorProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return EnumValueDescriptorProto;
            })();
    
            protobuf.ServiceDescriptorProto = (function() {
    
                /**
                 * Properties of a ServiceDescriptorProto.
                 * @memberof google.protobuf
                 * @interface IServiceDescriptorProto
                 * @property {string|null} [name] ServiceDescriptorProto name
                 * @property {Array.<google.protobuf.IMethodDescriptorProto>|null} [method] ServiceDescriptorProto method
                 * @property {google.protobuf.IServiceOptions|null} [options] ServiceDescriptorProto options
                 */
    
                /**
                 * Constructs a new ServiceDescriptorProto.
                 * @memberof google.protobuf
                 * @classdesc Represents a ServiceDescriptorProto.
                 * @implements IServiceDescriptorProto
                 * @constructor
                 * @param {google.protobuf.IServiceDescriptorProto=} [properties] Properties to set
                 */
                function ServiceDescriptorProto(properties) {
                    this.method = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * ServiceDescriptorProto name.
                 * @member {string} name
                 * @memberof google.protobuf.ServiceDescriptorProto
                 * @instance
                 */
                ServiceDescriptorProto.prototype.name = "";
    
                /**
                 * ServiceDescriptorProto method.
                 * @member {Array.<google.protobuf.IMethodDescriptorProto>} method
                 * @memberof google.protobuf.ServiceDescriptorProto
                 * @instance
                 */
                ServiceDescriptorProto.prototype.method = $util.emptyArray;
    
                /**
                 * ServiceDescriptorProto options.
                 * @member {google.protobuf.IServiceOptions|null|undefined} options
                 * @memberof google.protobuf.ServiceDescriptorProto
                 * @instance
                 */
                ServiceDescriptorProto.prototype.options = null;
    
                /**
                 * Creates a ServiceDescriptorProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.ServiceDescriptorProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.ServiceDescriptorProto} ServiceDescriptorProto
                 */
                ServiceDescriptorProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.ServiceDescriptorProto)
                        return object;
                    var message = new $root.google.protobuf.ServiceDescriptorProto();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.method) {
                        if (!Array.isArray(object.method))
                            throw TypeError(".google.protobuf.ServiceDescriptorProto.method: array expected");
                        message.method = [];
                        for (var i = 0; i < object.method.length; ++i) {
                            if (typeof object.method[i] !== "object")
                                throw TypeError(".google.protobuf.ServiceDescriptorProto.method: object expected");
                            message.method[i] = $root.google.protobuf.MethodDescriptorProto.fromObject(object.method[i]);
                        }
                    }
                    if (object.options != null) {
                        if (typeof object.options !== "object")
                            throw TypeError(".google.protobuf.ServiceDescriptorProto.options: object expected");
                        message.options = $root.google.protobuf.ServiceOptions.fromObject(object.options);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a ServiceDescriptorProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.ServiceDescriptorProto
                 * @static
                 * @param {google.protobuf.ServiceDescriptorProto} message ServiceDescriptorProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ServiceDescriptorProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.method = [];
                    if (options.defaults) {
                        object.name = "";
                        object.options = null;
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.method && message.method.length) {
                        object.method = [];
                        for (var j = 0; j < message.method.length; ++j)
                            object.method[j] = $root.google.protobuf.MethodDescriptorProto.toObject(message.method[j], options);
                    }
                    if (message.options != null && message.hasOwnProperty("options"))
                        object.options = $root.google.protobuf.ServiceOptions.toObject(message.options, options);
                    return object;
                };
    
                /**
                 * Converts this ServiceDescriptorProto to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.ServiceDescriptorProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ServiceDescriptorProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return ServiceDescriptorProto;
            })();
    
            protobuf.MethodDescriptorProto = (function() {
    
                /**
                 * Properties of a MethodDescriptorProto.
                 * @memberof google.protobuf
                 * @interface IMethodDescriptorProto
                 * @property {string|null} [name] MethodDescriptorProto name
                 * @property {string|null} [inputType] MethodDescriptorProto inputType
                 * @property {string|null} [outputType] MethodDescriptorProto outputType
                 * @property {google.protobuf.IMethodOptions|null} [options] MethodDescriptorProto options
                 * @property {boolean|null} [clientStreaming] MethodDescriptorProto clientStreaming
                 * @property {boolean|null} [serverStreaming] MethodDescriptorProto serverStreaming
                 */
    
                /**
                 * Constructs a new MethodDescriptorProto.
                 * @memberof google.protobuf
                 * @classdesc Represents a MethodDescriptorProto.
                 * @implements IMethodDescriptorProto
                 * @constructor
                 * @param {google.protobuf.IMethodDescriptorProto=} [properties] Properties to set
                 */
                function MethodDescriptorProto(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * MethodDescriptorProto name.
                 * @member {string} name
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @instance
                 */
                MethodDescriptorProto.prototype.name = "";
    
                /**
                 * MethodDescriptorProto inputType.
                 * @member {string} inputType
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @instance
                 */
                MethodDescriptorProto.prototype.inputType = "";
    
                /**
                 * MethodDescriptorProto outputType.
                 * @member {string} outputType
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @instance
                 */
                MethodDescriptorProto.prototype.outputType = "";
    
                /**
                 * MethodDescriptorProto options.
                 * @member {google.protobuf.IMethodOptions|null|undefined} options
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @instance
                 */
                MethodDescriptorProto.prototype.options = null;
    
                /**
                 * MethodDescriptorProto clientStreaming.
                 * @member {boolean} clientStreaming
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @instance
                 */
                MethodDescriptorProto.prototype.clientStreaming = false;
    
                /**
                 * MethodDescriptorProto serverStreaming.
                 * @member {boolean} serverStreaming
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @instance
                 */
                MethodDescriptorProto.prototype.serverStreaming = false;
    
                /**
                 * Creates a MethodDescriptorProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.MethodDescriptorProto} MethodDescriptorProto
                 */
                MethodDescriptorProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.MethodDescriptorProto)
                        return object;
                    var message = new $root.google.protobuf.MethodDescriptorProto();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.inputType != null)
                        message.inputType = String(object.inputType);
                    if (object.outputType != null)
                        message.outputType = String(object.outputType);
                    if (object.options != null) {
                        if (typeof object.options !== "object")
                            throw TypeError(".google.protobuf.MethodDescriptorProto.options: object expected");
                        message.options = $root.google.protobuf.MethodOptions.fromObject(object.options);
                    }
                    if (object.clientStreaming != null)
                        message.clientStreaming = Boolean(object.clientStreaming);
                    if (object.serverStreaming != null)
                        message.serverStreaming = Boolean(object.serverStreaming);
                    return message;
                };
    
                /**
                 * Creates a plain object from a MethodDescriptorProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @static
                 * @param {google.protobuf.MethodDescriptorProto} message MethodDescriptorProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                MethodDescriptorProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.name = "";
                        object.inputType = "";
                        object.outputType = "";
                        object.options = null;
                        object.clientStreaming = false;
                        object.serverStreaming = false;
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.inputType != null && message.hasOwnProperty("inputType"))
                        object.inputType = message.inputType;
                    if (message.outputType != null && message.hasOwnProperty("outputType"))
                        object.outputType = message.outputType;
                    if (message.options != null && message.hasOwnProperty("options"))
                        object.options = $root.google.protobuf.MethodOptions.toObject(message.options, options);
                    if (message.clientStreaming != null && message.hasOwnProperty("clientStreaming"))
                        object.clientStreaming = message.clientStreaming;
                    if (message.serverStreaming != null && message.hasOwnProperty("serverStreaming"))
                        object.serverStreaming = message.serverStreaming;
                    return object;
                };
    
                /**
                 * Converts this MethodDescriptorProto to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                MethodDescriptorProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return MethodDescriptorProto;
            })();
    
            protobuf.FileOptions = (function() {
    
                /**
                 * Properties of a FileOptions.
                 * @memberof google.protobuf
                 * @interface IFileOptions
                 * @property {string|null} [javaPackage] FileOptions javaPackage
                 * @property {string|null} [javaOuterClassname] FileOptions javaOuterClassname
                 * @property {boolean|null} [javaMultipleFiles] FileOptions javaMultipleFiles
                 * @property {boolean|null} [javaGenerateEqualsAndHash] FileOptions javaGenerateEqualsAndHash
                 * @property {boolean|null} [javaStringCheckUtf8] FileOptions javaStringCheckUtf8
                 * @property {google.protobuf.FileOptions.OptimizeMode|null} [optimizeFor] FileOptions optimizeFor
                 * @property {string|null} [goPackage] FileOptions goPackage
                 * @property {boolean|null} [ccGenericServices] FileOptions ccGenericServices
                 * @property {boolean|null} [javaGenericServices] FileOptions javaGenericServices
                 * @property {boolean|null} [pyGenericServices] FileOptions pyGenericServices
                 * @property {boolean|null} [deprecated] FileOptions deprecated
                 * @property {boolean|null} [ccEnableArenas] FileOptions ccEnableArenas
                 * @property {string|null} [objcClassPrefix] FileOptions objcClassPrefix
                 * @property {string|null} [csharpNamespace] FileOptions csharpNamespace
                 * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpretedOption] FileOptions uninterpretedOption
                 * @property {Array.<google.api.IResourceDescriptor>|null} [".google.api.resourceDefinition"] FileOptions .google.api.resourceDefinition
                 */
    
                /**
                 * Constructs a new FileOptions.
                 * @memberof google.protobuf
                 * @classdesc Represents a FileOptions.
                 * @implements IFileOptions
                 * @constructor
                 * @param {google.protobuf.IFileOptions=} [properties] Properties to set
                 */
                function FileOptions(properties) {
                    this.uninterpretedOption = [];
                    this[".google.api.resourceDefinition"] = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * FileOptions javaPackage.
                 * @member {string} javaPackage
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.javaPackage = "";
    
                /**
                 * FileOptions javaOuterClassname.
                 * @member {string} javaOuterClassname
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.javaOuterClassname = "";
    
                /**
                 * FileOptions javaMultipleFiles.
                 * @member {boolean} javaMultipleFiles
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.javaMultipleFiles = false;
    
                /**
                 * FileOptions javaGenerateEqualsAndHash.
                 * @member {boolean} javaGenerateEqualsAndHash
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.javaGenerateEqualsAndHash = false;
    
                /**
                 * FileOptions javaStringCheckUtf8.
                 * @member {boolean} javaStringCheckUtf8
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.javaStringCheckUtf8 = false;
    
                /**
                 * FileOptions optimizeFor.
                 * @member {google.protobuf.FileOptions.OptimizeMode} optimizeFor
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.optimizeFor = 1;
    
                /**
                 * FileOptions goPackage.
                 * @member {string} goPackage
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.goPackage = "";
    
                /**
                 * FileOptions ccGenericServices.
                 * @member {boolean} ccGenericServices
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.ccGenericServices = false;
    
                /**
                 * FileOptions javaGenericServices.
                 * @member {boolean} javaGenericServices
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.javaGenericServices = false;
    
                /**
                 * FileOptions pyGenericServices.
                 * @member {boolean} pyGenericServices
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.pyGenericServices = false;
    
                /**
                 * FileOptions deprecated.
                 * @member {boolean} deprecated
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.deprecated = false;
    
                /**
                 * FileOptions ccEnableArenas.
                 * @member {boolean} ccEnableArenas
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.ccEnableArenas = false;
    
                /**
                 * FileOptions objcClassPrefix.
                 * @member {string} objcClassPrefix
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.objcClassPrefix = "";
    
                /**
                 * FileOptions csharpNamespace.
                 * @member {string} csharpNamespace
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.csharpNamespace = "";
    
                /**
                 * FileOptions uninterpretedOption.
                 * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpretedOption
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype.uninterpretedOption = $util.emptyArray;
    
                /**
                 * FileOptions .google.api.resourceDefinition.
                 * @member {Array.<google.api.IResourceDescriptor>} .google.api.resourceDefinition
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 */
                FileOptions.prototype[".google.api.resourceDefinition"] = $util.emptyArray;
    
                /**
                 * Creates a FileOptions message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.FileOptions
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.FileOptions} FileOptions
                 */
                FileOptions.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.FileOptions)
                        return object;
                    var message = new $root.google.protobuf.FileOptions();
                    if (object.javaPackage != null)
                        message.javaPackage = String(object.javaPackage);
                    if (object.javaOuterClassname != null)
                        message.javaOuterClassname = String(object.javaOuterClassname);
                    if (object.javaMultipleFiles != null)
                        message.javaMultipleFiles = Boolean(object.javaMultipleFiles);
                    if (object.javaGenerateEqualsAndHash != null)
                        message.javaGenerateEqualsAndHash = Boolean(object.javaGenerateEqualsAndHash);
                    if (object.javaStringCheckUtf8 != null)
                        message.javaStringCheckUtf8 = Boolean(object.javaStringCheckUtf8);
                    switch (object.optimizeFor) {
                    case "SPEED":
                    case 1:
                        message.optimizeFor = 1;
                        break;
                    case "CODE_SIZE":
                    case 2:
                        message.optimizeFor = 2;
                        break;
                    case "LITE_RUNTIME":
                    case 3:
                        message.optimizeFor = 3;
                        break;
                    }
                    if (object.goPackage != null)
                        message.goPackage = String(object.goPackage);
                    if (object.ccGenericServices != null)
                        message.ccGenericServices = Boolean(object.ccGenericServices);
                    if (object.javaGenericServices != null)
                        message.javaGenericServices = Boolean(object.javaGenericServices);
                    if (object.pyGenericServices != null)
                        message.pyGenericServices = Boolean(object.pyGenericServices);
                    if (object.deprecated != null)
                        message.deprecated = Boolean(object.deprecated);
                    if (object.ccEnableArenas != null)
                        message.ccEnableArenas = Boolean(object.ccEnableArenas);
                    if (object.objcClassPrefix != null)
                        message.objcClassPrefix = String(object.objcClassPrefix);
                    if (object.csharpNamespace != null)
                        message.csharpNamespace = String(object.csharpNamespace);
                    if (object.uninterpretedOption) {
                        if (!Array.isArray(object.uninterpretedOption))
                            throw TypeError(".google.protobuf.FileOptions.uninterpretedOption: array expected");
                        message.uninterpretedOption = [];
                        for (var i = 0; i < object.uninterpretedOption.length; ++i) {
                            if (typeof object.uninterpretedOption[i] !== "object")
                                throw TypeError(".google.protobuf.FileOptions.uninterpretedOption: object expected");
                            message.uninterpretedOption[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpretedOption[i]);
                        }
                    }
                    if (object[".google.api.resourceDefinition"]) {
                        if (!Array.isArray(object[".google.api.resourceDefinition"]))
                            throw TypeError(".google.protobuf.FileOptions..google.api.resourceDefinition: array expected");
                        message[".google.api.resourceDefinition"] = [];
                        for (var i = 0; i < object[".google.api.resourceDefinition"].length; ++i) {
                            if (typeof object[".google.api.resourceDefinition"][i] !== "object")
                                throw TypeError(".google.protobuf.FileOptions..google.api.resourceDefinition: object expected");
                            message[".google.api.resourceDefinition"][i] = $root.google.api.ResourceDescriptor.fromObject(object[".google.api.resourceDefinition"][i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a FileOptions message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.FileOptions
                 * @static
                 * @param {google.protobuf.FileOptions} message FileOptions
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                FileOptions.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults) {
                        object.uninterpretedOption = [];
                        object[".google.api.resourceDefinition"] = [];
                    }
                    if (options.defaults) {
                        object.javaPackage = "";
                        object.javaOuterClassname = "";
                        object.optimizeFor = options.enums === String ? "SPEED" : 1;
                        object.javaMultipleFiles = false;
                        object.goPackage = "";
                        object.ccGenericServices = false;
                        object.javaGenericServices = false;
                        object.pyGenericServices = false;
                        object.javaGenerateEqualsAndHash = false;
                        object.deprecated = false;
                        object.javaStringCheckUtf8 = false;
                        object.ccEnableArenas = false;
                        object.objcClassPrefix = "";
                        object.csharpNamespace = "";
                    }
                    if (message.javaPackage != null && message.hasOwnProperty("javaPackage"))
                        object.javaPackage = message.javaPackage;
                    if (message.javaOuterClassname != null && message.hasOwnProperty("javaOuterClassname"))
                        object.javaOuterClassname = message.javaOuterClassname;
                    if (message.optimizeFor != null && message.hasOwnProperty("optimizeFor"))
                        object.optimizeFor = options.enums === String ? $root.google.protobuf.FileOptions.OptimizeMode[message.optimizeFor] : message.optimizeFor;
                    if (message.javaMultipleFiles != null && message.hasOwnProperty("javaMultipleFiles"))
                        object.javaMultipleFiles = message.javaMultipleFiles;
                    if (message.goPackage != null && message.hasOwnProperty("goPackage"))
                        object.goPackage = message.goPackage;
                    if (message.ccGenericServices != null && message.hasOwnProperty("ccGenericServices"))
                        object.ccGenericServices = message.ccGenericServices;
                    if (message.javaGenericServices != null && message.hasOwnProperty("javaGenericServices"))
                        object.javaGenericServices = message.javaGenericServices;
                    if (message.pyGenericServices != null && message.hasOwnProperty("pyGenericServices"))
                        object.pyGenericServices = message.pyGenericServices;
                    if (message.javaGenerateEqualsAndHash != null && message.hasOwnProperty("javaGenerateEqualsAndHash"))
                        object.javaGenerateEqualsAndHash = message.javaGenerateEqualsAndHash;
                    if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                        object.deprecated = message.deprecated;
                    if (message.javaStringCheckUtf8 != null && message.hasOwnProperty("javaStringCheckUtf8"))
                        object.javaStringCheckUtf8 = message.javaStringCheckUtf8;
                    if (message.ccEnableArenas != null && message.hasOwnProperty("ccEnableArenas"))
                        object.ccEnableArenas = message.ccEnableArenas;
                    if (message.objcClassPrefix != null && message.hasOwnProperty("objcClassPrefix"))
                        object.objcClassPrefix = message.objcClassPrefix;
                    if (message.csharpNamespace != null && message.hasOwnProperty("csharpNamespace"))
                        object.csharpNamespace = message.csharpNamespace;
                    if (message.uninterpretedOption && message.uninterpretedOption.length) {
                        object.uninterpretedOption = [];
                        for (var j = 0; j < message.uninterpretedOption.length; ++j)
                            object.uninterpretedOption[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpretedOption[j], options);
                    }
                    if (message[".google.api.resourceDefinition"] && message[".google.api.resourceDefinition"].length) {
                        object[".google.api.resourceDefinition"] = [];
                        for (var j = 0; j < message[".google.api.resourceDefinition"].length; ++j)
                            object[".google.api.resourceDefinition"][j] = $root.google.api.ResourceDescriptor.toObject(message[".google.api.resourceDefinition"][j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this FileOptions to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.FileOptions
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                FileOptions.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * OptimizeMode enum.
                 * @name google.protobuf.FileOptions.OptimizeMode
                 * @enum {string}
                 * @property {string} SPEED=SPEED SPEED value
                 * @property {string} CODE_SIZE=CODE_SIZE CODE_SIZE value
                 * @property {string} LITE_RUNTIME=LITE_RUNTIME LITE_RUNTIME value
                 */
                FileOptions.OptimizeMode = (function() {
                    var valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[1] = "SPEED"] = "SPEED";
                    values[valuesById[2] = "CODE_SIZE"] = "CODE_SIZE";
                    values[valuesById[3] = "LITE_RUNTIME"] = "LITE_RUNTIME";
                    return values;
                })();
    
                return FileOptions;
            })();
    
            protobuf.MessageOptions = (function() {
    
                /**
                 * Properties of a MessageOptions.
                 * @memberof google.protobuf
                 * @interface IMessageOptions
                 * @property {boolean|null} [messageSetWireFormat] MessageOptions messageSetWireFormat
                 * @property {boolean|null} [noStandardDescriptorAccessor] MessageOptions noStandardDescriptorAccessor
                 * @property {boolean|null} [deprecated] MessageOptions deprecated
                 * @property {boolean|null} [mapEntry] MessageOptions mapEntry
                 * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpretedOption] MessageOptions uninterpretedOption
                 * @property {google.api.IResourceDescriptor|null} [".google.api.resource"] MessageOptions .google.api.resource
                 */
    
                /**
                 * Constructs a new MessageOptions.
                 * @memberof google.protobuf
                 * @classdesc Represents a MessageOptions.
                 * @implements IMessageOptions
                 * @constructor
                 * @param {google.protobuf.IMessageOptions=} [properties] Properties to set
                 */
                function MessageOptions(properties) {
                    this.uninterpretedOption = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * MessageOptions messageSetWireFormat.
                 * @member {boolean} messageSetWireFormat
                 * @memberof google.protobuf.MessageOptions
                 * @instance
                 */
                MessageOptions.prototype.messageSetWireFormat = false;
    
                /**
                 * MessageOptions noStandardDescriptorAccessor.
                 * @member {boolean} noStandardDescriptorAccessor
                 * @memberof google.protobuf.MessageOptions
                 * @instance
                 */
                MessageOptions.prototype.noStandardDescriptorAccessor = false;
    
                /**
                 * MessageOptions deprecated.
                 * @member {boolean} deprecated
                 * @memberof google.protobuf.MessageOptions
                 * @instance
                 */
                MessageOptions.prototype.deprecated = false;
    
                /**
                 * MessageOptions mapEntry.
                 * @member {boolean} mapEntry
                 * @memberof google.protobuf.MessageOptions
                 * @instance
                 */
                MessageOptions.prototype.mapEntry = false;
    
                /**
                 * MessageOptions uninterpretedOption.
                 * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpretedOption
                 * @memberof google.protobuf.MessageOptions
                 * @instance
                 */
                MessageOptions.prototype.uninterpretedOption = $util.emptyArray;
    
                /**
                 * MessageOptions .google.api.resource.
                 * @member {google.api.IResourceDescriptor|null|undefined} .google.api.resource
                 * @memberof google.protobuf.MessageOptions
                 * @instance
                 */
                MessageOptions.prototype[".google.api.resource"] = null;
    
                /**
                 * Creates a MessageOptions message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.MessageOptions
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.MessageOptions} MessageOptions
                 */
                MessageOptions.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.MessageOptions)
                        return object;
                    var message = new $root.google.protobuf.MessageOptions();
                    if (object.messageSetWireFormat != null)
                        message.messageSetWireFormat = Boolean(object.messageSetWireFormat);
                    if (object.noStandardDescriptorAccessor != null)
                        message.noStandardDescriptorAccessor = Boolean(object.noStandardDescriptorAccessor);
                    if (object.deprecated != null)
                        message.deprecated = Boolean(object.deprecated);
                    if (object.mapEntry != null)
                        message.mapEntry = Boolean(object.mapEntry);
                    if (object.uninterpretedOption) {
                        if (!Array.isArray(object.uninterpretedOption))
                            throw TypeError(".google.protobuf.MessageOptions.uninterpretedOption: array expected");
                        message.uninterpretedOption = [];
                        for (var i = 0; i < object.uninterpretedOption.length; ++i) {
                            if (typeof object.uninterpretedOption[i] !== "object")
                                throw TypeError(".google.protobuf.MessageOptions.uninterpretedOption: object expected");
                            message.uninterpretedOption[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpretedOption[i]);
                        }
                    }
                    if (object[".google.api.resource"] != null) {
                        if (typeof object[".google.api.resource"] !== "object")
                            throw TypeError(".google.protobuf.MessageOptions..google.api.resource: object expected");
                        message[".google.api.resource"] = $root.google.api.ResourceDescriptor.fromObject(object[".google.api.resource"]);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a MessageOptions message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.MessageOptions
                 * @static
                 * @param {google.protobuf.MessageOptions} message MessageOptions
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                MessageOptions.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.uninterpretedOption = [];
                    if (options.defaults) {
                        object.messageSetWireFormat = false;
                        object.noStandardDescriptorAccessor = false;
                        object.deprecated = false;
                        object.mapEntry = false;
                        object[".google.api.resource"] = null;
                    }
                    if (message.messageSetWireFormat != null && message.hasOwnProperty("messageSetWireFormat"))
                        object.messageSetWireFormat = message.messageSetWireFormat;
                    if (message.noStandardDescriptorAccessor != null && message.hasOwnProperty("noStandardDescriptorAccessor"))
                        object.noStandardDescriptorAccessor = message.noStandardDescriptorAccessor;
                    if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                        object.deprecated = message.deprecated;
                    if (message.mapEntry != null && message.hasOwnProperty("mapEntry"))
                        object.mapEntry = message.mapEntry;
                    if (message.uninterpretedOption && message.uninterpretedOption.length) {
                        object.uninterpretedOption = [];
                        for (var j = 0; j < message.uninterpretedOption.length; ++j)
                            object.uninterpretedOption[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpretedOption[j], options);
                    }
                    if (message[".google.api.resource"] != null && message.hasOwnProperty(".google.api.resource"))
                        object[".google.api.resource"] = $root.google.api.ResourceDescriptor.toObject(message[".google.api.resource"], options);
                    return object;
                };
    
                /**
                 * Converts this MessageOptions to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.MessageOptions
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                MessageOptions.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return MessageOptions;
            })();
    
            protobuf.FieldOptions = (function() {
    
                /**
                 * Properties of a FieldOptions.
                 * @memberof google.protobuf
                 * @interface IFieldOptions
                 * @property {google.protobuf.FieldOptions.CType|null} [ctype] FieldOptions ctype
                 * @property {boolean|null} [packed] FieldOptions packed
                 * @property {google.protobuf.FieldOptions.JSType|null} [jstype] FieldOptions jstype
                 * @property {boolean|null} [lazy] FieldOptions lazy
                 * @property {boolean|null} [deprecated] FieldOptions deprecated
                 * @property {boolean|null} [weak] FieldOptions weak
                 * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpretedOption] FieldOptions uninterpretedOption
                 * @property {Array.<google.api.FieldBehavior>|null} [".google.api.fieldBehavior"] FieldOptions .google.api.fieldBehavior
                 * @property {google.api.IResourceReference|null} [".google.api.resourceReference"] FieldOptions .google.api.resourceReference
                 */
    
                /**
                 * Constructs a new FieldOptions.
                 * @memberof google.protobuf
                 * @classdesc Represents a FieldOptions.
                 * @implements IFieldOptions
                 * @constructor
                 * @param {google.protobuf.IFieldOptions=} [properties] Properties to set
                 */
                function FieldOptions(properties) {
                    this.uninterpretedOption = [];
                    this[".google.api.fieldBehavior"] = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * FieldOptions ctype.
                 * @member {google.protobuf.FieldOptions.CType} ctype
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 */
                FieldOptions.prototype.ctype = 0;
    
                /**
                 * FieldOptions packed.
                 * @member {boolean} packed
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 */
                FieldOptions.prototype.packed = false;
    
                /**
                 * FieldOptions jstype.
                 * @member {google.protobuf.FieldOptions.JSType} jstype
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 */
                FieldOptions.prototype.jstype = 0;
    
                /**
                 * FieldOptions lazy.
                 * @member {boolean} lazy
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 */
                FieldOptions.prototype.lazy = false;
    
                /**
                 * FieldOptions deprecated.
                 * @member {boolean} deprecated
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 */
                FieldOptions.prototype.deprecated = false;
    
                /**
                 * FieldOptions weak.
                 * @member {boolean} weak
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 */
                FieldOptions.prototype.weak = false;
    
                /**
                 * FieldOptions uninterpretedOption.
                 * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpretedOption
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 */
                FieldOptions.prototype.uninterpretedOption = $util.emptyArray;
    
                /**
                 * FieldOptions .google.api.fieldBehavior.
                 * @member {Array.<google.api.FieldBehavior>} .google.api.fieldBehavior
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 */
                FieldOptions.prototype[".google.api.fieldBehavior"] = $util.emptyArray;
    
                /**
                 * FieldOptions .google.api.resourceReference.
                 * @member {google.api.IResourceReference|null|undefined} .google.api.resourceReference
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 */
                FieldOptions.prototype[".google.api.resourceReference"] = null;
    
                /**
                 * Creates a FieldOptions message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.FieldOptions
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.FieldOptions} FieldOptions
                 */
                FieldOptions.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.FieldOptions)
                        return object;
                    var message = new $root.google.protobuf.FieldOptions();
                    switch (object.ctype) {
                    case "STRING":
                    case 0:
                        message.ctype = 0;
                        break;
                    case "CORD":
                    case 1:
                        message.ctype = 1;
                        break;
                    case "STRING_PIECE":
                    case 2:
                        message.ctype = 2;
                        break;
                    }
                    if (object.packed != null)
                        message.packed = Boolean(object.packed);
                    switch (object.jstype) {
                    case "JS_NORMAL":
                    case 0:
                        message.jstype = 0;
                        break;
                    case "JS_STRING":
                    case 1:
                        message.jstype = 1;
                        break;
                    case "JS_NUMBER":
                    case 2:
                        message.jstype = 2;
                        break;
                    }
                    if (object.lazy != null)
                        message.lazy = Boolean(object.lazy);
                    if (object.deprecated != null)
                        message.deprecated = Boolean(object.deprecated);
                    if (object.weak != null)
                        message.weak = Boolean(object.weak);
                    if (object.uninterpretedOption) {
                        if (!Array.isArray(object.uninterpretedOption))
                            throw TypeError(".google.protobuf.FieldOptions.uninterpretedOption: array expected");
                        message.uninterpretedOption = [];
                        for (var i = 0; i < object.uninterpretedOption.length; ++i) {
                            if (typeof object.uninterpretedOption[i] !== "object")
                                throw TypeError(".google.protobuf.FieldOptions.uninterpretedOption: object expected");
                            message.uninterpretedOption[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpretedOption[i]);
                        }
                    }
                    if (object[".google.api.fieldBehavior"]) {
                        if (!Array.isArray(object[".google.api.fieldBehavior"]))
                            throw TypeError(".google.protobuf.FieldOptions..google.api.fieldBehavior: array expected");
                        message[".google.api.fieldBehavior"] = [];
                        for (var i = 0; i < object[".google.api.fieldBehavior"].length; ++i)
                            switch (object[".google.api.fieldBehavior"][i]) {
                            default:
                            case "FIELD_BEHAVIOR_UNSPECIFIED":
                            case 0:
                                message[".google.api.fieldBehavior"][i] = 0;
                                break;
                            case "OPTIONAL":
                            case 1:
                                message[".google.api.fieldBehavior"][i] = 1;
                                break;
                            case "REQUIRED":
                            case 2:
                                message[".google.api.fieldBehavior"][i] = 2;
                                break;
                            case "OUTPUT_ONLY":
                            case 3:
                                message[".google.api.fieldBehavior"][i] = 3;
                                break;
                            case "INPUT_ONLY":
                            case 4:
                                message[".google.api.fieldBehavior"][i] = 4;
                                break;
                            case "IMMUTABLE":
                            case 5:
                                message[".google.api.fieldBehavior"][i] = 5;
                                break;
                            }
                    }
                    if (object[".google.api.resourceReference"] != null) {
                        if (typeof object[".google.api.resourceReference"] !== "object")
                            throw TypeError(".google.protobuf.FieldOptions..google.api.resourceReference: object expected");
                        message[".google.api.resourceReference"] = $root.google.api.ResourceReference.fromObject(object[".google.api.resourceReference"]);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a FieldOptions message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.FieldOptions
                 * @static
                 * @param {google.protobuf.FieldOptions} message FieldOptions
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                FieldOptions.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults) {
                        object.uninterpretedOption = [];
                        object[".google.api.fieldBehavior"] = [];
                    }
                    if (options.defaults) {
                        object.ctype = options.enums === String ? "STRING" : 0;
                        object.packed = false;
                        object.deprecated = false;
                        object.lazy = false;
                        object.jstype = options.enums === String ? "JS_NORMAL" : 0;
                        object.weak = false;
                        object[".google.api.resourceReference"] = null;
                    }
                    if (message.ctype != null && message.hasOwnProperty("ctype"))
                        object.ctype = options.enums === String ? $root.google.protobuf.FieldOptions.CType[message.ctype] : message.ctype;
                    if (message.packed != null && message.hasOwnProperty("packed"))
                        object.packed = message.packed;
                    if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                        object.deprecated = message.deprecated;
                    if (message.lazy != null && message.hasOwnProperty("lazy"))
                        object.lazy = message.lazy;
                    if (message.jstype != null && message.hasOwnProperty("jstype"))
                        object.jstype = options.enums === String ? $root.google.protobuf.FieldOptions.JSType[message.jstype] : message.jstype;
                    if (message.weak != null && message.hasOwnProperty("weak"))
                        object.weak = message.weak;
                    if (message.uninterpretedOption && message.uninterpretedOption.length) {
                        object.uninterpretedOption = [];
                        for (var j = 0; j < message.uninterpretedOption.length; ++j)
                            object.uninterpretedOption[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpretedOption[j], options);
                    }
                    if (message[".google.api.fieldBehavior"] && message[".google.api.fieldBehavior"].length) {
                        object[".google.api.fieldBehavior"] = [];
                        for (var j = 0; j < message[".google.api.fieldBehavior"].length; ++j)
                            object[".google.api.fieldBehavior"][j] = options.enums === String ? $root.google.api.FieldBehavior[message[".google.api.fieldBehavior"][j]] : message[".google.api.fieldBehavior"][j];
                    }
                    if (message[".google.api.resourceReference"] != null && message.hasOwnProperty(".google.api.resourceReference"))
                        object[".google.api.resourceReference"] = $root.google.api.ResourceReference.toObject(message[".google.api.resourceReference"], options);
                    return object;
                };
    
                /**
                 * Converts this FieldOptions to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.FieldOptions
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                FieldOptions.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * CType enum.
                 * @name google.protobuf.FieldOptions.CType
                 * @enum {string}
                 * @property {string} STRING=STRING STRING value
                 * @property {string} CORD=CORD CORD value
                 * @property {string} STRING_PIECE=STRING_PIECE STRING_PIECE value
                 */
                FieldOptions.CType = (function() {
                    var valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[0] = "STRING"] = "STRING";
                    values[valuesById[1] = "CORD"] = "CORD";
                    values[valuesById[2] = "STRING_PIECE"] = "STRING_PIECE";
                    return values;
                })();
    
                /**
                 * JSType enum.
                 * @name google.protobuf.FieldOptions.JSType
                 * @enum {string}
                 * @property {string} JS_NORMAL=JS_NORMAL JS_NORMAL value
                 * @property {string} JS_STRING=JS_STRING JS_STRING value
                 * @property {string} JS_NUMBER=JS_NUMBER JS_NUMBER value
                 */
                FieldOptions.JSType = (function() {
                    var valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[0] = "JS_NORMAL"] = "JS_NORMAL";
                    values[valuesById[1] = "JS_STRING"] = "JS_STRING";
                    values[valuesById[2] = "JS_NUMBER"] = "JS_NUMBER";
                    return values;
                })();
    
                return FieldOptions;
            })();
    
            protobuf.OneofOptions = (function() {
    
                /**
                 * Properties of an OneofOptions.
                 * @memberof google.protobuf
                 * @interface IOneofOptions
                 * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpretedOption] OneofOptions uninterpretedOption
                 */
    
                /**
                 * Constructs a new OneofOptions.
                 * @memberof google.protobuf
                 * @classdesc Represents an OneofOptions.
                 * @implements IOneofOptions
                 * @constructor
                 * @param {google.protobuf.IOneofOptions=} [properties] Properties to set
                 */
                function OneofOptions(properties) {
                    this.uninterpretedOption = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * OneofOptions uninterpretedOption.
                 * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpretedOption
                 * @memberof google.protobuf.OneofOptions
                 * @instance
                 */
                OneofOptions.prototype.uninterpretedOption = $util.emptyArray;
    
                /**
                 * Creates an OneofOptions message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.OneofOptions
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.OneofOptions} OneofOptions
                 */
                OneofOptions.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.OneofOptions)
                        return object;
                    var message = new $root.google.protobuf.OneofOptions();
                    if (object.uninterpretedOption) {
                        if (!Array.isArray(object.uninterpretedOption))
                            throw TypeError(".google.protobuf.OneofOptions.uninterpretedOption: array expected");
                        message.uninterpretedOption = [];
                        for (var i = 0; i < object.uninterpretedOption.length; ++i) {
                            if (typeof object.uninterpretedOption[i] !== "object")
                                throw TypeError(".google.protobuf.OneofOptions.uninterpretedOption: object expected");
                            message.uninterpretedOption[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpretedOption[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from an OneofOptions message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.OneofOptions
                 * @static
                 * @param {google.protobuf.OneofOptions} message OneofOptions
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                OneofOptions.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.uninterpretedOption = [];
                    if (message.uninterpretedOption && message.uninterpretedOption.length) {
                        object.uninterpretedOption = [];
                        for (var j = 0; j < message.uninterpretedOption.length; ++j)
                            object.uninterpretedOption[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpretedOption[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this OneofOptions to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.OneofOptions
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                OneofOptions.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return OneofOptions;
            })();
    
            protobuf.EnumOptions = (function() {
    
                /**
                 * Properties of an EnumOptions.
                 * @memberof google.protobuf
                 * @interface IEnumOptions
                 * @property {boolean|null} [allowAlias] EnumOptions allowAlias
                 * @property {boolean|null} [deprecated] EnumOptions deprecated
                 * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpretedOption] EnumOptions uninterpretedOption
                 */
    
                /**
                 * Constructs a new EnumOptions.
                 * @memberof google.protobuf
                 * @classdesc Represents an EnumOptions.
                 * @implements IEnumOptions
                 * @constructor
                 * @param {google.protobuf.IEnumOptions=} [properties] Properties to set
                 */
                function EnumOptions(properties) {
                    this.uninterpretedOption = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * EnumOptions allowAlias.
                 * @member {boolean} allowAlias
                 * @memberof google.protobuf.EnumOptions
                 * @instance
                 */
                EnumOptions.prototype.allowAlias = false;
    
                /**
                 * EnumOptions deprecated.
                 * @member {boolean} deprecated
                 * @memberof google.protobuf.EnumOptions
                 * @instance
                 */
                EnumOptions.prototype.deprecated = false;
    
                /**
                 * EnumOptions uninterpretedOption.
                 * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpretedOption
                 * @memberof google.protobuf.EnumOptions
                 * @instance
                 */
                EnumOptions.prototype.uninterpretedOption = $util.emptyArray;
    
                /**
                 * Creates an EnumOptions message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.EnumOptions
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.EnumOptions} EnumOptions
                 */
                EnumOptions.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.EnumOptions)
                        return object;
                    var message = new $root.google.protobuf.EnumOptions();
                    if (object.allowAlias != null)
                        message.allowAlias = Boolean(object.allowAlias);
                    if (object.deprecated != null)
                        message.deprecated = Boolean(object.deprecated);
                    if (object.uninterpretedOption) {
                        if (!Array.isArray(object.uninterpretedOption))
                            throw TypeError(".google.protobuf.EnumOptions.uninterpretedOption: array expected");
                        message.uninterpretedOption = [];
                        for (var i = 0; i < object.uninterpretedOption.length; ++i) {
                            if (typeof object.uninterpretedOption[i] !== "object")
                                throw TypeError(".google.protobuf.EnumOptions.uninterpretedOption: object expected");
                            message.uninterpretedOption[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpretedOption[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from an EnumOptions message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.EnumOptions
                 * @static
                 * @param {google.protobuf.EnumOptions} message EnumOptions
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                EnumOptions.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.uninterpretedOption = [];
                    if (options.defaults) {
                        object.allowAlias = false;
                        object.deprecated = false;
                    }
                    if (message.allowAlias != null && message.hasOwnProperty("allowAlias"))
                        object.allowAlias = message.allowAlias;
                    if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                        object.deprecated = message.deprecated;
                    if (message.uninterpretedOption && message.uninterpretedOption.length) {
                        object.uninterpretedOption = [];
                        for (var j = 0; j < message.uninterpretedOption.length; ++j)
                            object.uninterpretedOption[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpretedOption[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this EnumOptions to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.EnumOptions
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                EnumOptions.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return EnumOptions;
            })();
    
            protobuf.EnumValueOptions = (function() {
    
                /**
                 * Properties of an EnumValueOptions.
                 * @memberof google.protobuf
                 * @interface IEnumValueOptions
                 * @property {boolean|null} [deprecated] EnumValueOptions deprecated
                 * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpretedOption] EnumValueOptions uninterpretedOption
                 */
    
                /**
                 * Constructs a new EnumValueOptions.
                 * @memberof google.protobuf
                 * @classdesc Represents an EnumValueOptions.
                 * @implements IEnumValueOptions
                 * @constructor
                 * @param {google.protobuf.IEnumValueOptions=} [properties] Properties to set
                 */
                function EnumValueOptions(properties) {
                    this.uninterpretedOption = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * EnumValueOptions deprecated.
                 * @member {boolean} deprecated
                 * @memberof google.protobuf.EnumValueOptions
                 * @instance
                 */
                EnumValueOptions.prototype.deprecated = false;
    
                /**
                 * EnumValueOptions uninterpretedOption.
                 * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpretedOption
                 * @memberof google.protobuf.EnumValueOptions
                 * @instance
                 */
                EnumValueOptions.prototype.uninterpretedOption = $util.emptyArray;
    
                /**
                 * Creates an EnumValueOptions message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.EnumValueOptions
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.EnumValueOptions} EnumValueOptions
                 */
                EnumValueOptions.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.EnumValueOptions)
                        return object;
                    var message = new $root.google.protobuf.EnumValueOptions();
                    if (object.deprecated != null)
                        message.deprecated = Boolean(object.deprecated);
                    if (object.uninterpretedOption) {
                        if (!Array.isArray(object.uninterpretedOption))
                            throw TypeError(".google.protobuf.EnumValueOptions.uninterpretedOption: array expected");
                        message.uninterpretedOption = [];
                        for (var i = 0; i < object.uninterpretedOption.length; ++i) {
                            if (typeof object.uninterpretedOption[i] !== "object")
                                throw TypeError(".google.protobuf.EnumValueOptions.uninterpretedOption: object expected");
                            message.uninterpretedOption[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpretedOption[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from an EnumValueOptions message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.EnumValueOptions
                 * @static
                 * @param {google.protobuf.EnumValueOptions} message EnumValueOptions
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                EnumValueOptions.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.uninterpretedOption = [];
                    if (options.defaults)
                        object.deprecated = false;
                    if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                        object.deprecated = message.deprecated;
                    if (message.uninterpretedOption && message.uninterpretedOption.length) {
                        object.uninterpretedOption = [];
                        for (var j = 0; j < message.uninterpretedOption.length; ++j)
                            object.uninterpretedOption[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpretedOption[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this EnumValueOptions to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.EnumValueOptions
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                EnumValueOptions.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return EnumValueOptions;
            })();
    
            protobuf.ServiceOptions = (function() {
    
                /**
                 * Properties of a ServiceOptions.
                 * @memberof google.protobuf
                 * @interface IServiceOptions
                 * @property {boolean|null} [deprecated] ServiceOptions deprecated
                 * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpretedOption] ServiceOptions uninterpretedOption
                 * @property {string|null} [".google.api.defaultHost"] ServiceOptions .google.api.defaultHost
                 * @property {string|null} [".google.api.oauthScopes"] ServiceOptions .google.api.oauthScopes
                 */
    
                /**
                 * Constructs a new ServiceOptions.
                 * @memberof google.protobuf
                 * @classdesc Represents a ServiceOptions.
                 * @implements IServiceOptions
                 * @constructor
                 * @param {google.protobuf.IServiceOptions=} [properties] Properties to set
                 */
                function ServiceOptions(properties) {
                    this.uninterpretedOption = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * ServiceOptions deprecated.
                 * @member {boolean} deprecated
                 * @memberof google.protobuf.ServiceOptions
                 * @instance
                 */
                ServiceOptions.prototype.deprecated = false;
    
                /**
                 * ServiceOptions uninterpretedOption.
                 * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpretedOption
                 * @memberof google.protobuf.ServiceOptions
                 * @instance
                 */
                ServiceOptions.prototype.uninterpretedOption = $util.emptyArray;
    
                /**
                 * ServiceOptions .google.api.defaultHost.
                 * @member {string} .google.api.defaultHost
                 * @memberof google.protobuf.ServiceOptions
                 * @instance
                 */
                ServiceOptions.prototype[".google.api.defaultHost"] = "";
    
                /**
                 * ServiceOptions .google.api.oauthScopes.
                 * @member {string} .google.api.oauthScopes
                 * @memberof google.protobuf.ServiceOptions
                 * @instance
                 */
                ServiceOptions.prototype[".google.api.oauthScopes"] = "";
    
                /**
                 * Creates a ServiceOptions message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.ServiceOptions
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.ServiceOptions} ServiceOptions
                 */
                ServiceOptions.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.ServiceOptions)
                        return object;
                    var message = new $root.google.protobuf.ServiceOptions();
                    if (object.deprecated != null)
                        message.deprecated = Boolean(object.deprecated);
                    if (object.uninterpretedOption) {
                        if (!Array.isArray(object.uninterpretedOption))
                            throw TypeError(".google.protobuf.ServiceOptions.uninterpretedOption: array expected");
                        message.uninterpretedOption = [];
                        for (var i = 0; i < object.uninterpretedOption.length; ++i) {
                            if (typeof object.uninterpretedOption[i] !== "object")
                                throw TypeError(".google.protobuf.ServiceOptions.uninterpretedOption: object expected");
                            message.uninterpretedOption[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpretedOption[i]);
                        }
                    }
                    if (object[".google.api.defaultHost"] != null)
                        message[".google.api.defaultHost"] = String(object[".google.api.defaultHost"]);
                    if (object[".google.api.oauthScopes"] != null)
                        message[".google.api.oauthScopes"] = String(object[".google.api.oauthScopes"]);
                    return message;
                };
    
                /**
                 * Creates a plain object from a ServiceOptions message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.ServiceOptions
                 * @static
                 * @param {google.protobuf.ServiceOptions} message ServiceOptions
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ServiceOptions.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.uninterpretedOption = [];
                    if (options.defaults) {
                        object.deprecated = false;
                        object[".google.api.defaultHost"] = "";
                        object[".google.api.oauthScopes"] = "";
                    }
                    if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                        object.deprecated = message.deprecated;
                    if (message.uninterpretedOption && message.uninterpretedOption.length) {
                        object.uninterpretedOption = [];
                        for (var j = 0; j < message.uninterpretedOption.length; ++j)
                            object.uninterpretedOption[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpretedOption[j], options);
                    }
                    if (message[".google.api.defaultHost"] != null && message.hasOwnProperty(".google.api.defaultHost"))
                        object[".google.api.defaultHost"] = message[".google.api.defaultHost"];
                    if (message[".google.api.oauthScopes"] != null && message.hasOwnProperty(".google.api.oauthScopes"))
                        object[".google.api.oauthScopes"] = message[".google.api.oauthScopes"];
                    return object;
                };
    
                /**
                 * Converts this ServiceOptions to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.ServiceOptions
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ServiceOptions.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return ServiceOptions;
            })();
    
            protobuf.MethodOptions = (function() {
    
                /**
                 * Properties of a MethodOptions.
                 * @memberof google.protobuf
                 * @interface IMethodOptions
                 * @property {boolean|null} [deprecated] MethodOptions deprecated
                 * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpretedOption] MethodOptions uninterpretedOption
                 * @property {google.api.IHttpRule|null} [".google.api.http"] MethodOptions .google.api.http
                 * @property {Array.<string>|null} [".google.api.methodSignature"] MethodOptions .google.api.methodSignature
                 * @property {google.longrunning.IOperationInfo|null} [".google.longrunning.operationInfo"] MethodOptions .google.longrunning.operationInfo
                 */
    
                /**
                 * Constructs a new MethodOptions.
                 * @memberof google.protobuf
                 * @classdesc Represents a MethodOptions.
                 * @implements IMethodOptions
                 * @constructor
                 * @param {google.protobuf.IMethodOptions=} [properties] Properties to set
                 */
                function MethodOptions(properties) {
                    this.uninterpretedOption = [];
                    this[".google.api.methodSignature"] = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * MethodOptions deprecated.
                 * @member {boolean} deprecated
                 * @memberof google.protobuf.MethodOptions
                 * @instance
                 */
                MethodOptions.prototype.deprecated = false;
    
                /**
                 * MethodOptions uninterpretedOption.
                 * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpretedOption
                 * @memberof google.protobuf.MethodOptions
                 * @instance
                 */
                MethodOptions.prototype.uninterpretedOption = $util.emptyArray;
    
                /**
                 * MethodOptions .google.api.http.
                 * @member {google.api.IHttpRule|null|undefined} .google.api.http
                 * @memberof google.protobuf.MethodOptions
                 * @instance
                 */
                MethodOptions.prototype[".google.api.http"] = null;
    
                /**
                 * MethodOptions .google.api.methodSignature.
                 * @member {Array.<string>} .google.api.methodSignature
                 * @memberof google.protobuf.MethodOptions
                 * @instance
                 */
                MethodOptions.prototype[".google.api.methodSignature"] = $util.emptyArray;
    
                /**
                 * MethodOptions .google.longrunning.operationInfo.
                 * @member {google.longrunning.IOperationInfo|null|undefined} .google.longrunning.operationInfo
                 * @memberof google.protobuf.MethodOptions
                 * @instance
                 */
                MethodOptions.prototype[".google.longrunning.operationInfo"] = null;
    
                /**
                 * Creates a MethodOptions message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.MethodOptions
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.MethodOptions} MethodOptions
                 */
                MethodOptions.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.MethodOptions)
                        return object;
                    var message = new $root.google.protobuf.MethodOptions();
                    if (object.deprecated != null)
                        message.deprecated = Boolean(object.deprecated);
                    if (object.uninterpretedOption) {
                        if (!Array.isArray(object.uninterpretedOption))
                            throw TypeError(".google.protobuf.MethodOptions.uninterpretedOption: array expected");
                        message.uninterpretedOption = [];
                        for (var i = 0; i < object.uninterpretedOption.length; ++i) {
                            if (typeof object.uninterpretedOption[i] !== "object")
                                throw TypeError(".google.protobuf.MethodOptions.uninterpretedOption: object expected");
                            message.uninterpretedOption[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpretedOption[i]);
                        }
                    }
                    if (object[".google.api.http"] != null) {
                        if (typeof object[".google.api.http"] !== "object")
                            throw TypeError(".google.protobuf.MethodOptions..google.api.http: object expected");
                        message[".google.api.http"] = $root.google.api.HttpRule.fromObject(object[".google.api.http"]);
                    }
                    if (object[".google.api.methodSignature"]) {
                        if (!Array.isArray(object[".google.api.methodSignature"]))
                            throw TypeError(".google.protobuf.MethodOptions..google.api.methodSignature: array expected");
                        message[".google.api.methodSignature"] = [];
                        for (var i = 0; i < object[".google.api.methodSignature"].length; ++i)
                            message[".google.api.methodSignature"][i] = String(object[".google.api.methodSignature"][i]);
                    }
                    if (object[".google.longrunning.operationInfo"] != null) {
                        if (typeof object[".google.longrunning.operationInfo"] !== "object")
                            throw TypeError(".google.protobuf.MethodOptions..google.longrunning.operationInfo: object expected");
                        message[".google.longrunning.operationInfo"] = $root.google.longrunning.OperationInfo.fromObject(object[".google.longrunning.operationInfo"]);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a MethodOptions message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.MethodOptions
                 * @static
                 * @param {google.protobuf.MethodOptions} message MethodOptions
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                MethodOptions.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults) {
                        object.uninterpretedOption = [];
                        object[".google.api.methodSignature"] = [];
                    }
                    if (options.defaults) {
                        object.deprecated = false;
                        object[".google.longrunning.operationInfo"] = null;
                        object[".google.api.http"] = null;
                    }
                    if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                        object.deprecated = message.deprecated;
                    if (message.uninterpretedOption && message.uninterpretedOption.length) {
                        object.uninterpretedOption = [];
                        for (var j = 0; j < message.uninterpretedOption.length; ++j)
                            object.uninterpretedOption[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpretedOption[j], options);
                    }
                    if (message[".google.longrunning.operationInfo"] != null && message.hasOwnProperty(".google.longrunning.operationInfo"))
                        object[".google.longrunning.operationInfo"] = $root.google.longrunning.OperationInfo.toObject(message[".google.longrunning.operationInfo"], options);
                    if (message[".google.api.methodSignature"] && message[".google.api.methodSignature"].length) {
                        object[".google.api.methodSignature"] = [];
                        for (var j = 0; j < message[".google.api.methodSignature"].length; ++j)
                            object[".google.api.methodSignature"][j] = message[".google.api.methodSignature"][j];
                    }
                    if (message[".google.api.http"] != null && message.hasOwnProperty(".google.api.http"))
                        object[".google.api.http"] = $root.google.api.HttpRule.toObject(message[".google.api.http"], options);
                    return object;
                };
    
                /**
                 * Converts this MethodOptions to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.MethodOptions
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                MethodOptions.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return MethodOptions;
            })();
    
            protobuf.UninterpretedOption = (function() {
    
                /**
                 * Properties of an UninterpretedOption.
                 * @memberof google.protobuf
                 * @interface IUninterpretedOption
                 * @property {Array.<google.protobuf.UninterpretedOption.INamePart>|null} [name] UninterpretedOption name
                 * @property {string|null} [identifierValue] UninterpretedOption identifierValue
                 * @property {number|string|null} [positiveIntValue] UninterpretedOption positiveIntValue
                 * @property {number|string|null} [negativeIntValue] UninterpretedOption negativeIntValue
                 * @property {number|null} [doubleValue] UninterpretedOption doubleValue
                 * @property {Uint8Array|null} [stringValue] UninterpretedOption stringValue
                 * @property {string|null} [aggregateValue] UninterpretedOption aggregateValue
                 */
    
                /**
                 * Constructs a new UninterpretedOption.
                 * @memberof google.protobuf
                 * @classdesc Represents an UninterpretedOption.
                 * @implements IUninterpretedOption
                 * @constructor
                 * @param {google.protobuf.IUninterpretedOption=} [properties] Properties to set
                 */
                function UninterpretedOption(properties) {
                    this.name = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * UninterpretedOption name.
                 * @member {Array.<google.protobuf.UninterpretedOption.INamePart>} name
                 * @memberof google.protobuf.UninterpretedOption
                 * @instance
                 */
                UninterpretedOption.prototype.name = $util.emptyArray;
    
                /**
                 * UninterpretedOption identifierValue.
                 * @member {string} identifierValue
                 * @memberof google.protobuf.UninterpretedOption
                 * @instance
                 */
                UninterpretedOption.prototype.identifierValue = "";
    
                /**
                 * UninterpretedOption positiveIntValue.
                 * @member {number|string} positiveIntValue
                 * @memberof google.protobuf.UninterpretedOption
                 * @instance
                 */
                UninterpretedOption.prototype.positiveIntValue = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    
                /**
                 * UninterpretedOption negativeIntValue.
                 * @member {number|string} negativeIntValue
                 * @memberof google.protobuf.UninterpretedOption
                 * @instance
                 */
                UninterpretedOption.prototype.negativeIntValue = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
    
                /**
                 * UninterpretedOption doubleValue.
                 * @member {number} doubleValue
                 * @memberof google.protobuf.UninterpretedOption
                 * @instance
                 */
                UninterpretedOption.prototype.doubleValue = 0;
    
                /**
                 * UninterpretedOption stringValue.
                 * @member {Uint8Array} stringValue
                 * @memberof google.protobuf.UninterpretedOption
                 * @instance
                 */
                UninterpretedOption.prototype.stringValue = $util.newBuffer([]);
    
                /**
                 * UninterpretedOption aggregateValue.
                 * @member {string} aggregateValue
                 * @memberof google.protobuf.UninterpretedOption
                 * @instance
                 */
                UninterpretedOption.prototype.aggregateValue = "";
    
                /**
                 * Creates an UninterpretedOption message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.UninterpretedOption
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.UninterpretedOption} UninterpretedOption
                 */
                UninterpretedOption.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.UninterpretedOption)
                        return object;
                    var message = new $root.google.protobuf.UninterpretedOption();
                    if (object.name) {
                        if (!Array.isArray(object.name))
                            throw TypeError(".google.protobuf.UninterpretedOption.name: array expected");
                        message.name = [];
                        for (var i = 0; i < object.name.length; ++i) {
                            if (typeof object.name[i] !== "object")
                                throw TypeError(".google.protobuf.UninterpretedOption.name: object expected");
                            message.name[i] = $root.google.protobuf.UninterpretedOption.NamePart.fromObject(object.name[i]);
                        }
                    }
                    if (object.identifierValue != null)
                        message.identifierValue = String(object.identifierValue);
                    if (object.positiveIntValue != null)
                        if ($util.Long)
                            (message.positiveIntValue = $util.Long.fromValue(object.positiveIntValue)).unsigned = true;
                        else if (typeof object.positiveIntValue === "string")
                            message.positiveIntValue = parseInt(object.positiveIntValue, 10);
                        else if (typeof object.positiveIntValue === "number")
                            message.positiveIntValue = object.positiveIntValue;
                        else if (typeof object.positiveIntValue === "object")
                            message.positiveIntValue = new $util.LongBits(object.positiveIntValue.low >>> 0, object.positiveIntValue.high >>> 0).toNumber(true);
                    if (object.negativeIntValue != null)
                        if ($util.Long)
                            (message.negativeIntValue = $util.Long.fromValue(object.negativeIntValue)).unsigned = false;
                        else if (typeof object.negativeIntValue === "string")
                            message.negativeIntValue = parseInt(object.negativeIntValue, 10);
                        else if (typeof object.negativeIntValue === "number")
                            message.negativeIntValue = object.negativeIntValue;
                        else if (typeof object.negativeIntValue === "object")
                            message.negativeIntValue = new $util.LongBits(object.negativeIntValue.low >>> 0, object.negativeIntValue.high >>> 0).toNumber();
                    if (object.doubleValue != null)
                        message.doubleValue = Number(object.doubleValue);
                    if (object.stringValue != null)
                        if (typeof object.stringValue === "string")
                            $util.base64.decode(object.stringValue, message.stringValue = $util.newBuffer($util.base64.length(object.stringValue)), 0);
                        else if (object.stringValue.length)
                            message.stringValue = object.stringValue;
                    if (object.aggregateValue != null)
                        message.aggregateValue = String(object.aggregateValue);
                    return message;
                };
    
                /**
                 * Creates a plain object from an UninterpretedOption message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.UninterpretedOption
                 * @static
                 * @param {google.protobuf.UninterpretedOption} message UninterpretedOption
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                UninterpretedOption.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.name = [];
                    if (options.defaults) {
                        object.identifierValue = "";
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, true);
                            object.positiveIntValue = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.positiveIntValue = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.negativeIntValue = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.negativeIntValue = options.longs === String ? "0" : 0;
                        object.doubleValue = 0;
                        if (options.bytes === String)
                            object.stringValue = "";
                        else {
                            object.stringValue = [];
                            if (options.bytes !== Array)
                                object.stringValue = $util.newBuffer(object.stringValue);
                        }
                        object.aggregateValue = "";
                    }
                    if (message.name && message.name.length) {
                        object.name = [];
                        for (var j = 0; j < message.name.length; ++j)
                            object.name[j] = $root.google.protobuf.UninterpretedOption.NamePart.toObject(message.name[j], options);
                    }
                    if (message.identifierValue != null && message.hasOwnProperty("identifierValue"))
                        object.identifierValue = message.identifierValue;
                    if (message.positiveIntValue != null && message.hasOwnProperty("positiveIntValue"))
                        if (typeof message.positiveIntValue === "number")
                            object.positiveIntValue = options.longs === String ? String(message.positiveIntValue) : message.positiveIntValue;
                        else
                            object.positiveIntValue = options.longs === String ? $util.Long.prototype.toString.call(message.positiveIntValue) : options.longs === Number ? new $util.LongBits(message.positiveIntValue.low >>> 0, message.positiveIntValue.high >>> 0).toNumber(true) : message.positiveIntValue;
                    if (message.negativeIntValue != null && message.hasOwnProperty("negativeIntValue"))
                        if (typeof message.negativeIntValue === "number")
                            object.negativeIntValue = options.longs === String ? String(message.negativeIntValue) : message.negativeIntValue;
                        else
                            object.negativeIntValue = options.longs === String ? $util.Long.prototype.toString.call(message.negativeIntValue) : options.longs === Number ? new $util.LongBits(message.negativeIntValue.low >>> 0, message.negativeIntValue.high >>> 0).toNumber() : message.negativeIntValue;
                    if (message.doubleValue != null && message.hasOwnProperty("doubleValue"))
                        object.doubleValue = options.json && !isFinite(message.doubleValue) ? String(message.doubleValue) : message.doubleValue;
                    if (message.stringValue != null && message.hasOwnProperty("stringValue"))
                        object.stringValue = options.bytes === String ? $util.base64.encode(message.stringValue, 0, message.stringValue.length) : options.bytes === Array ? Array.prototype.slice.call(message.stringValue) : message.stringValue;
                    if (message.aggregateValue != null && message.hasOwnProperty("aggregateValue"))
                        object.aggregateValue = message.aggregateValue;
                    return object;
                };
    
                /**
                 * Converts this UninterpretedOption to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.UninterpretedOption
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                UninterpretedOption.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                UninterpretedOption.NamePart = (function() {
    
                    /**
                     * Properties of a NamePart.
                     * @memberof google.protobuf.UninterpretedOption
                     * @interface INamePart
                     * @property {string} namePart NamePart namePart
                     * @property {boolean} isExtension NamePart isExtension
                     */
    
                    /**
                     * Constructs a new NamePart.
                     * @memberof google.protobuf.UninterpretedOption
                     * @classdesc Represents a NamePart.
                     * @implements INamePart
                     * @constructor
                     * @param {google.protobuf.UninterpretedOption.INamePart=} [properties] Properties to set
                     */
                    function NamePart(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * NamePart namePart.
                     * @member {string} namePart
                     * @memberof google.protobuf.UninterpretedOption.NamePart
                     * @instance
                     */
                    NamePart.prototype.namePart = "";
    
                    /**
                     * NamePart isExtension.
                     * @member {boolean} isExtension
                     * @memberof google.protobuf.UninterpretedOption.NamePart
                     * @instance
                     */
                    NamePart.prototype.isExtension = false;
    
                    /**
                     * Creates a NamePart message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.protobuf.UninterpretedOption.NamePart
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.protobuf.UninterpretedOption.NamePart} NamePart
                     */
                    NamePart.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.protobuf.UninterpretedOption.NamePart)
                            return object;
                        var message = new $root.google.protobuf.UninterpretedOption.NamePart();
                        if (object.namePart != null)
                            message.namePart = String(object.namePart);
                        if (object.isExtension != null)
                            message.isExtension = Boolean(object.isExtension);
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a NamePart message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.protobuf.UninterpretedOption.NamePart
                     * @static
                     * @param {google.protobuf.UninterpretedOption.NamePart} message NamePart
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    NamePart.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.namePart = "";
                            object.isExtension = false;
                        }
                        if (message.namePart != null && message.hasOwnProperty("namePart"))
                            object.namePart = message.namePart;
                        if (message.isExtension != null && message.hasOwnProperty("isExtension"))
                            object.isExtension = message.isExtension;
                        return object;
                    };
    
                    /**
                     * Converts this NamePart to JSON.
                     * @function toJSON
                     * @memberof google.protobuf.UninterpretedOption.NamePart
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    NamePart.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return NamePart;
                })();
    
                return UninterpretedOption;
            })();
    
            protobuf.SourceCodeInfo = (function() {
    
                /**
                 * Properties of a SourceCodeInfo.
                 * @memberof google.protobuf
                 * @interface ISourceCodeInfo
                 * @property {Array.<google.protobuf.SourceCodeInfo.ILocation>|null} [location] SourceCodeInfo location
                 */
    
                /**
                 * Constructs a new SourceCodeInfo.
                 * @memberof google.protobuf
                 * @classdesc Represents a SourceCodeInfo.
                 * @implements ISourceCodeInfo
                 * @constructor
                 * @param {google.protobuf.ISourceCodeInfo=} [properties] Properties to set
                 */
                function SourceCodeInfo(properties) {
                    this.location = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * SourceCodeInfo location.
                 * @member {Array.<google.protobuf.SourceCodeInfo.ILocation>} location
                 * @memberof google.protobuf.SourceCodeInfo
                 * @instance
                 */
                SourceCodeInfo.prototype.location = $util.emptyArray;
    
                /**
                 * Creates a SourceCodeInfo message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.SourceCodeInfo
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.SourceCodeInfo} SourceCodeInfo
                 */
                SourceCodeInfo.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.SourceCodeInfo)
                        return object;
                    var message = new $root.google.protobuf.SourceCodeInfo();
                    if (object.location) {
                        if (!Array.isArray(object.location))
                            throw TypeError(".google.protobuf.SourceCodeInfo.location: array expected");
                        message.location = [];
                        for (var i = 0; i < object.location.length; ++i) {
                            if (typeof object.location[i] !== "object")
                                throw TypeError(".google.protobuf.SourceCodeInfo.location: object expected");
                            message.location[i] = $root.google.protobuf.SourceCodeInfo.Location.fromObject(object.location[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a SourceCodeInfo message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.SourceCodeInfo
                 * @static
                 * @param {google.protobuf.SourceCodeInfo} message SourceCodeInfo
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                SourceCodeInfo.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.location = [];
                    if (message.location && message.location.length) {
                        object.location = [];
                        for (var j = 0; j < message.location.length; ++j)
                            object.location[j] = $root.google.protobuf.SourceCodeInfo.Location.toObject(message.location[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this SourceCodeInfo to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.SourceCodeInfo
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                SourceCodeInfo.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                SourceCodeInfo.Location = (function() {
    
                    /**
                     * Properties of a Location.
                     * @memberof google.protobuf.SourceCodeInfo
                     * @interface ILocation
                     * @property {Array.<number>|null} [path] Location path
                     * @property {Array.<number>|null} [span] Location span
                     * @property {string|null} [leadingComments] Location leadingComments
                     * @property {string|null} [trailingComments] Location trailingComments
                     * @property {Array.<string>|null} [leadingDetachedComments] Location leadingDetachedComments
                     */
    
                    /**
                     * Constructs a new Location.
                     * @memberof google.protobuf.SourceCodeInfo
                     * @classdesc Represents a Location.
                     * @implements ILocation
                     * @constructor
                     * @param {google.protobuf.SourceCodeInfo.ILocation=} [properties] Properties to set
                     */
                    function Location(properties) {
                        this.path = [];
                        this.span = [];
                        this.leadingDetachedComments = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * Location path.
                     * @member {Array.<number>} path
                     * @memberof google.protobuf.SourceCodeInfo.Location
                     * @instance
                     */
                    Location.prototype.path = $util.emptyArray;
    
                    /**
                     * Location span.
                     * @member {Array.<number>} span
                     * @memberof google.protobuf.SourceCodeInfo.Location
                     * @instance
                     */
                    Location.prototype.span = $util.emptyArray;
    
                    /**
                     * Location leadingComments.
                     * @member {string} leadingComments
                     * @memberof google.protobuf.SourceCodeInfo.Location
                     * @instance
                     */
                    Location.prototype.leadingComments = "";
    
                    /**
                     * Location trailingComments.
                     * @member {string} trailingComments
                     * @memberof google.protobuf.SourceCodeInfo.Location
                     * @instance
                     */
                    Location.prototype.trailingComments = "";
    
                    /**
                     * Location leadingDetachedComments.
                     * @member {Array.<string>} leadingDetachedComments
                     * @memberof google.protobuf.SourceCodeInfo.Location
                     * @instance
                     */
                    Location.prototype.leadingDetachedComments = $util.emptyArray;
    
                    /**
                     * Creates a Location message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.protobuf.SourceCodeInfo.Location
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.protobuf.SourceCodeInfo.Location} Location
                     */
                    Location.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.protobuf.SourceCodeInfo.Location)
                            return object;
                        var message = new $root.google.protobuf.SourceCodeInfo.Location();
                        if (object.path) {
                            if (!Array.isArray(object.path))
                                throw TypeError(".google.protobuf.SourceCodeInfo.Location.path: array expected");
                            message.path = [];
                            for (var i = 0; i < object.path.length; ++i)
                                message.path[i] = object.path[i] | 0;
                        }
                        if (object.span) {
                            if (!Array.isArray(object.span))
                                throw TypeError(".google.protobuf.SourceCodeInfo.Location.span: array expected");
                            message.span = [];
                            for (var i = 0; i < object.span.length; ++i)
                                message.span[i] = object.span[i] | 0;
                        }
                        if (object.leadingComments != null)
                            message.leadingComments = String(object.leadingComments);
                        if (object.trailingComments != null)
                            message.trailingComments = String(object.trailingComments);
                        if (object.leadingDetachedComments) {
                            if (!Array.isArray(object.leadingDetachedComments))
                                throw TypeError(".google.protobuf.SourceCodeInfo.Location.leadingDetachedComments: array expected");
                            message.leadingDetachedComments = [];
                            for (var i = 0; i < object.leadingDetachedComments.length; ++i)
                                message.leadingDetachedComments[i] = String(object.leadingDetachedComments[i]);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a Location message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.protobuf.SourceCodeInfo.Location
                     * @static
                     * @param {google.protobuf.SourceCodeInfo.Location} message Location
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Location.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults) {
                            object.path = [];
                            object.span = [];
                            object.leadingDetachedComments = [];
                        }
                        if (options.defaults) {
                            object.leadingComments = "";
                            object.trailingComments = "";
                        }
                        if (message.path && message.path.length) {
                            object.path = [];
                            for (var j = 0; j < message.path.length; ++j)
                                object.path[j] = message.path[j];
                        }
                        if (message.span && message.span.length) {
                            object.span = [];
                            for (var j = 0; j < message.span.length; ++j)
                                object.span[j] = message.span[j];
                        }
                        if (message.leadingComments != null && message.hasOwnProperty("leadingComments"))
                            object.leadingComments = message.leadingComments;
                        if (message.trailingComments != null && message.hasOwnProperty("trailingComments"))
                            object.trailingComments = message.trailingComments;
                        if (message.leadingDetachedComments && message.leadingDetachedComments.length) {
                            object.leadingDetachedComments = [];
                            for (var j = 0; j < message.leadingDetachedComments.length; ++j)
                                object.leadingDetachedComments[j] = message.leadingDetachedComments[j];
                        }
                        return object;
                    };
    
                    /**
                     * Converts this Location to JSON.
                     * @function toJSON
                     * @memberof google.protobuf.SourceCodeInfo.Location
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Location.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return Location;
                })();
    
                return SourceCodeInfo;
            })();
    
            protobuf.GeneratedCodeInfo = (function() {
    
                /**
                 * Properties of a GeneratedCodeInfo.
                 * @memberof google.protobuf
                 * @interface IGeneratedCodeInfo
                 * @property {Array.<google.protobuf.GeneratedCodeInfo.IAnnotation>|null} [annotation] GeneratedCodeInfo annotation
                 */
    
                /**
                 * Constructs a new GeneratedCodeInfo.
                 * @memberof google.protobuf
                 * @classdesc Represents a GeneratedCodeInfo.
                 * @implements IGeneratedCodeInfo
                 * @constructor
                 * @param {google.protobuf.IGeneratedCodeInfo=} [properties] Properties to set
                 */
                function GeneratedCodeInfo(properties) {
                    this.annotation = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * GeneratedCodeInfo annotation.
                 * @member {Array.<google.protobuf.GeneratedCodeInfo.IAnnotation>} annotation
                 * @memberof google.protobuf.GeneratedCodeInfo
                 * @instance
                 */
                GeneratedCodeInfo.prototype.annotation = $util.emptyArray;
    
                /**
                 * Creates a GeneratedCodeInfo message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.GeneratedCodeInfo
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.GeneratedCodeInfo} GeneratedCodeInfo
                 */
                GeneratedCodeInfo.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.GeneratedCodeInfo)
                        return object;
                    var message = new $root.google.protobuf.GeneratedCodeInfo();
                    if (object.annotation) {
                        if (!Array.isArray(object.annotation))
                            throw TypeError(".google.protobuf.GeneratedCodeInfo.annotation: array expected");
                        message.annotation = [];
                        for (var i = 0; i < object.annotation.length; ++i) {
                            if (typeof object.annotation[i] !== "object")
                                throw TypeError(".google.protobuf.GeneratedCodeInfo.annotation: object expected");
                            message.annotation[i] = $root.google.protobuf.GeneratedCodeInfo.Annotation.fromObject(object.annotation[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a GeneratedCodeInfo message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.GeneratedCodeInfo
                 * @static
                 * @param {google.protobuf.GeneratedCodeInfo} message GeneratedCodeInfo
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                GeneratedCodeInfo.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.annotation = [];
                    if (message.annotation && message.annotation.length) {
                        object.annotation = [];
                        for (var j = 0; j < message.annotation.length; ++j)
                            object.annotation[j] = $root.google.protobuf.GeneratedCodeInfo.Annotation.toObject(message.annotation[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this GeneratedCodeInfo to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.GeneratedCodeInfo
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                GeneratedCodeInfo.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                GeneratedCodeInfo.Annotation = (function() {
    
                    /**
                     * Properties of an Annotation.
                     * @memberof google.protobuf.GeneratedCodeInfo
                     * @interface IAnnotation
                     * @property {Array.<number>|null} [path] Annotation path
                     * @property {string|null} [sourceFile] Annotation sourceFile
                     * @property {number|null} [begin] Annotation begin
                     * @property {number|null} [end] Annotation end
                     */
    
                    /**
                     * Constructs a new Annotation.
                     * @memberof google.protobuf.GeneratedCodeInfo
                     * @classdesc Represents an Annotation.
                     * @implements IAnnotation
                     * @constructor
                     * @param {google.protobuf.GeneratedCodeInfo.IAnnotation=} [properties] Properties to set
                     */
                    function Annotation(properties) {
                        this.path = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * Annotation path.
                     * @member {Array.<number>} path
                     * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                     * @instance
                     */
                    Annotation.prototype.path = $util.emptyArray;
    
                    /**
                     * Annotation sourceFile.
                     * @member {string} sourceFile
                     * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                     * @instance
                     */
                    Annotation.prototype.sourceFile = "";
    
                    /**
                     * Annotation begin.
                     * @member {number} begin
                     * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                     * @instance
                     */
                    Annotation.prototype.begin = 0;
    
                    /**
                     * Annotation end.
                     * @member {number} end
                     * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                     * @instance
                     */
                    Annotation.prototype.end = 0;
    
                    /**
                     * Creates an Annotation message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.protobuf.GeneratedCodeInfo.Annotation} Annotation
                     */
                    Annotation.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.protobuf.GeneratedCodeInfo.Annotation)
                            return object;
                        var message = new $root.google.protobuf.GeneratedCodeInfo.Annotation();
                        if (object.path) {
                            if (!Array.isArray(object.path))
                                throw TypeError(".google.protobuf.GeneratedCodeInfo.Annotation.path: array expected");
                            message.path = [];
                            for (var i = 0; i < object.path.length; ++i)
                                message.path[i] = object.path[i] | 0;
                        }
                        if (object.sourceFile != null)
                            message.sourceFile = String(object.sourceFile);
                        if (object.begin != null)
                            message.begin = object.begin | 0;
                        if (object.end != null)
                            message.end = object.end | 0;
                        return message;
                    };
    
                    /**
                     * Creates a plain object from an Annotation message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                     * @static
                     * @param {google.protobuf.GeneratedCodeInfo.Annotation} message Annotation
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Annotation.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.path = [];
                        if (options.defaults) {
                            object.sourceFile = "";
                            object.begin = 0;
                            object.end = 0;
                        }
                        if (message.path && message.path.length) {
                            object.path = [];
                            for (var j = 0; j < message.path.length; ++j)
                                object.path[j] = message.path[j];
                        }
                        if (message.sourceFile != null && message.hasOwnProperty("sourceFile"))
                            object.sourceFile = message.sourceFile;
                        if (message.begin != null && message.hasOwnProperty("begin"))
                            object.begin = message.begin;
                        if (message.end != null && message.hasOwnProperty("end"))
                            object.end = message.end;
                        return object;
                    };
    
                    /**
                     * Converts this Annotation to JSON.
                     * @function toJSON
                     * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Annotation.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return Annotation;
                })();
    
                return GeneratedCodeInfo;
            })();
    
            protobuf.Struct = (function() {
    
                /**
                 * Properties of a Struct.
                 * @memberof google.protobuf
                 * @interface IStruct
                 * @property {Object.<string,google.protobuf.IValue>|null} [fields] Struct fields
                 */
    
                /**
                 * Constructs a new Struct.
                 * @memberof google.protobuf
                 * @classdesc Represents a Struct.
                 * @implements IStruct
                 * @constructor
                 * @param {google.protobuf.IStruct=} [properties] Properties to set
                 */
                function Struct(properties) {
                    this.fields = {};
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Struct fields.
                 * @member {Object.<string,google.protobuf.IValue>} fields
                 * @memberof google.protobuf.Struct
                 * @instance
                 */
                Struct.prototype.fields = $util.emptyObject;
    
                /**
                 * Creates a Struct message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.Struct
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.Struct} Struct
                 */
                Struct.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.Struct)
                        return object;
                    var message = new $root.google.protobuf.Struct();
                    if (object.fields) {
                        if (typeof object.fields !== "object")
                            throw TypeError(".google.protobuf.Struct.fields: object expected");
                        message.fields = {};
                        for (var keys = Object.keys(object.fields), i = 0; i < keys.length; ++i) {
                            if (typeof object.fields[keys[i]] !== "object")
                                throw TypeError(".google.protobuf.Struct.fields: object expected");
                            message.fields[keys[i]] = $root.google.protobuf.Value.fromObject(object.fields[keys[i]]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a Struct message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.Struct
                 * @static
                 * @param {google.protobuf.Struct} message Struct
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Struct.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.objects || options.defaults)
                        object.fields = {};
                    var keys2;
                    if (message.fields && (keys2 = Object.keys(message.fields)).length) {
                        object.fields = {};
                        for (var j = 0; j < keys2.length; ++j)
                            object.fields[keys2[j]] = $root.google.protobuf.Value.toObject(message.fields[keys2[j]], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this Struct to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.Struct
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Struct.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Struct;
            })();
    
            protobuf.Value = (function() {
    
                /**
                 * Properties of a Value.
                 * @memberof google.protobuf
                 * @interface IValue
                 * @property {google.protobuf.NullValue|null} [nullValue] Value nullValue
                 * @property {number|null} [numberValue] Value numberValue
                 * @property {string|null} [stringValue] Value stringValue
                 * @property {boolean|null} [boolValue] Value boolValue
                 * @property {google.protobuf.IStruct|null} [structValue] Value structValue
                 * @property {google.protobuf.IListValue|null} [listValue] Value listValue
                 */
    
                /**
                 * Constructs a new Value.
                 * @memberof google.protobuf
                 * @classdesc Represents a Value.
                 * @implements IValue
                 * @constructor
                 * @param {google.protobuf.IValue=} [properties] Properties to set
                 */
                function Value(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Value nullValue.
                 * @member {google.protobuf.NullValue} nullValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.nullValue = 0;
    
                /**
                 * Value numberValue.
                 * @member {number} numberValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.numberValue = 0;
    
                /**
                 * Value stringValue.
                 * @member {string} stringValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.stringValue = "";
    
                /**
                 * Value boolValue.
                 * @member {boolean} boolValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.boolValue = false;
    
                /**
                 * Value structValue.
                 * @member {google.protobuf.IStruct|null|undefined} structValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.structValue = null;
    
                /**
                 * Value listValue.
                 * @member {google.protobuf.IListValue|null|undefined} listValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.listValue = null;
    
                // OneOf field names bound to virtual getters and setters
                var $oneOfFields;
    
                /**
                 * Value kind.
                 * @member {"nullValue"|"numberValue"|"stringValue"|"boolValue"|"structValue"|"listValue"|undefined} kind
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Object.defineProperty(Value.prototype, "kind", {
                    get: $util.oneOfGetter($oneOfFields = ["nullValue", "numberValue", "stringValue", "boolValue", "structValue", "listValue"]),
                    set: $util.oneOfSetter($oneOfFields)
                });
    
                /**
                 * Creates a Value message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.Value
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.Value} Value
                 */
                Value.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.Value)
                        return object;
                    var message = new $root.google.protobuf.Value();
                    switch (object.nullValue) {
                    case "NULL_VALUE":
                    case 0:
                        message.nullValue = 0;
                        break;
                    }
                    if (object.numberValue != null)
                        message.numberValue = Number(object.numberValue);
                    if (object.stringValue != null)
                        message.stringValue = String(object.stringValue);
                    if (object.boolValue != null)
                        message.boolValue = Boolean(object.boolValue);
                    if (object.structValue != null) {
                        if (typeof object.structValue !== "object")
                            throw TypeError(".google.protobuf.Value.structValue: object expected");
                        message.structValue = $root.google.protobuf.Struct.fromObject(object.structValue);
                    }
                    if (object.listValue != null) {
                        if (typeof object.listValue !== "object")
                            throw TypeError(".google.protobuf.Value.listValue: object expected");
                        message.listValue = $root.google.protobuf.ListValue.fromObject(object.listValue);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a Value message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.Value
                 * @static
                 * @param {google.protobuf.Value} message Value
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Value.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (message.nullValue != null && message.hasOwnProperty("nullValue")) {
                        object.nullValue = options.enums === String ? $root.google.protobuf.NullValue[message.nullValue] : message.nullValue;
                        if (options.oneofs)
                            object.kind = "nullValue";
                    }
                    if (message.numberValue != null && message.hasOwnProperty("numberValue")) {
                        object.numberValue = options.json && !isFinite(message.numberValue) ? String(message.numberValue) : message.numberValue;
                        if (options.oneofs)
                            object.kind = "numberValue";
                    }
                    if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
                        object.stringValue = message.stringValue;
                        if (options.oneofs)
                            object.kind = "stringValue";
                    }
                    if (message.boolValue != null && message.hasOwnProperty("boolValue")) {
                        object.boolValue = message.boolValue;
                        if (options.oneofs)
                            object.kind = "boolValue";
                    }
                    if (message.structValue != null && message.hasOwnProperty("structValue")) {
                        object.structValue = $root.google.protobuf.Struct.toObject(message.structValue, options);
                        if (options.oneofs)
                            object.kind = "structValue";
                    }
                    if (message.listValue != null && message.hasOwnProperty("listValue")) {
                        object.listValue = $root.google.protobuf.ListValue.toObject(message.listValue, options);
                        if (options.oneofs)
                            object.kind = "listValue";
                    }
                    return object;
                };
    
                /**
                 * Converts this Value to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.Value
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Value.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Value;
            })();
    
            /**
             * NullValue enum.
             * @name google.protobuf.NullValue
             * @enum {string}
             * @property {string} NULL_VALUE=NULL_VALUE NULL_VALUE value
             */
            protobuf.NullValue = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL_VALUE"] = "NULL_VALUE";
                return values;
            })();
    
            protobuf.ListValue = (function() {
    
                /**
                 * Properties of a ListValue.
                 * @memberof google.protobuf
                 * @interface IListValue
                 * @property {Array.<google.protobuf.IValue>|null} [values] ListValue values
                 */
    
                /**
                 * Constructs a new ListValue.
                 * @memberof google.protobuf
                 * @classdesc Represents a ListValue.
                 * @implements IListValue
                 * @constructor
                 * @param {google.protobuf.IListValue=} [properties] Properties to set
                 */
                function ListValue(properties) {
                    this.values = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * ListValue values.
                 * @member {Array.<google.protobuf.IValue>} values
                 * @memberof google.protobuf.ListValue
                 * @instance
                 */
                ListValue.prototype.values = $util.emptyArray;
    
                /**
                 * Creates a ListValue message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.ListValue
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.ListValue} ListValue
                 */
                ListValue.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.ListValue)
                        return object;
                    var message = new $root.google.protobuf.ListValue();
                    if (object.values) {
                        if (!Array.isArray(object.values))
                            throw TypeError(".google.protobuf.ListValue.values: array expected");
                        message.values = [];
                        for (var i = 0; i < object.values.length; ++i) {
                            if (typeof object.values[i] !== "object")
                                throw TypeError(".google.protobuf.ListValue.values: object expected");
                            message.values[i] = $root.google.protobuf.Value.fromObject(object.values[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a ListValue message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.ListValue
                 * @static
                 * @param {google.protobuf.ListValue} message ListValue
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ListValue.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.values = [];
                    if (message.values && message.values.length) {
                        object.values = [];
                        for (var j = 0; j < message.values.length; ++j)
                            object.values[j] = $root.google.protobuf.Value.toObject(message.values[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this ListValue to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.ListValue
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ListValue.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return ListValue;
            })();
    
            protobuf.Empty = (function() {
    
                /**
                 * Properties of an Empty.
                 * @memberof google.protobuf
                 * @interface IEmpty
                 */
    
                /**
                 * Constructs a new Empty.
                 * @memberof google.protobuf
                 * @classdesc Represents an Empty.
                 * @implements IEmpty
                 * @constructor
                 * @param {google.protobuf.IEmpty=} [properties] Properties to set
                 */
                function Empty(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Creates an Empty message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.Empty
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.Empty} Empty
                 */
                Empty.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.Empty)
                        return object;
                    return new $root.google.protobuf.Empty();
                };
    
                /**
                 * Creates a plain object from an Empty message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.Empty
                 * @static
                 * @param {google.protobuf.Empty} message Empty
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Empty.toObject = function toObject() {
                    return {};
                };
    
                /**
                 * Converts this Empty to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.Empty
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Empty.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Empty;
            })();
    
            protobuf.DoubleValue = (function() {
    
                /**
                 * Properties of a DoubleValue.
                 * @memberof google.protobuf
                 * @interface IDoubleValue
                 * @property {number|null} [value] DoubleValue value
                 */
    
                /**
                 * Constructs a new DoubleValue.
                 * @memberof google.protobuf
                 * @classdesc Represents a DoubleValue.
                 * @implements IDoubleValue
                 * @constructor
                 * @param {google.protobuf.IDoubleValue=} [properties] Properties to set
                 */
                function DoubleValue(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * DoubleValue value.
                 * @member {number} value
                 * @memberof google.protobuf.DoubleValue
                 * @instance
                 */
                DoubleValue.prototype.value = 0;
    
                /**
                 * Creates a DoubleValue message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.DoubleValue
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.DoubleValue} DoubleValue
                 */
                DoubleValue.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.DoubleValue)
                        return object;
                    var message = new $root.google.protobuf.DoubleValue();
                    if (object.value != null)
                        message.value = Number(object.value);
                    return message;
                };
    
                /**
                 * Creates a plain object from a DoubleValue message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.DoubleValue
                 * @static
                 * @param {google.protobuf.DoubleValue} message DoubleValue
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                DoubleValue.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.value = 0;
                    if (message.value != null && message.hasOwnProperty("value"))
                        object.value = options.json && !isFinite(message.value) ? String(message.value) : message.value;
                    return object;
                };
    
                /**
                 * Converts this DoubleValue to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.DoubleValue
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                DoubleValue.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return DoubleValue;
            })();
    
            protobuf.FloatValue = (function() {
    
                /**
                 * Properties of a FloatValue.
                 * @memberof google.protobuf
                 * @interface IFloatValue
                 * @property {number|null} [value] FloatValue value
                 */
    
                /**
                 * Constructs a new FloatValue.
                 * @memberof google.protobuf
                 * @classdesc Represents a FloatValue.
                 * @implements IFloatValue
                 * @constructor
                 * @param {google.protobuf.IFloatValue=} [properties] Properties to set
                 */
                function FloatValue(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * FloatValue value.
                 * @member {number} value
                 * @memberof google.protobuf.FloatValue
                 * @instance
                 */
                FloatValue.prototype.value = 0;
    
                /**
                 * Creates a FloatValue message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.FloatValue
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.FloatValue} FloatValue
                 */
                FloatValue.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.FloatValue)
                        return object;
                    var message = new $root.google.protobuf.FloatValue();
                    if (object.value != null)
                        message.value = Number(object.value);
                    return message;
                };
    
                /**
                 * Creates a plain object from a FloatValue message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.FloatValue
                 * @static
                 * @param {google.protobuf.FloatValue} message FloatValue
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                FloatValue.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.value = 0;
                    if (message.value != null && message.hasOwnProperty("value"))
                        object.value = options.json && !isFinite(message.value) ? String(message.value) : message.value;
                    return object;
                };
    
                /**
                 * Converts this FloatValue to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.FloatValue
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                FloatValue.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return FloatValue;
            })();
    
            protobuf.Int64Value = (function() {
    
                /**
                 * Properties of an Int64Value.
                 * @memberof google.protobuf
                 * @interface IInt64Value
                 * @property {number|string|null} [value] Int64Value value
                 */
    
                /**
                 * Constructs a new Int64Value.
                 * @memberof google.protobuf
                 * @classdesc Represents an Int64Value.
                 * @implements IInt64Value
                 * @constructor
                 * @param {google.protobuf.IInt64Value=} [properties] Properties to set
                 */
                function Int64Value(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Int64Value value.
                 * @member {number|string} value
                 * @memberof google.protobuf.Int64Value
                 * @instance
                 */
                Int64Value.prototype.value = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
    
                /**
                 * Creates an Int64Value message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.Int64Value
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.Int64Value} Int64Value
                 */
                Int64Value.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.Int64Value)
                        return object;
                    var message = new $root.google.protobuf.Int64Value();
                    if (object.value != null)
                        if ($util.Long)
                            (message.value = $util.Long.fromValue(object.value)).unsigned = false;
                        else if (typeof object.value === "string")
                            message.value = parseInt(object.value, 10);
                        else if (typeof object.value === "number")
                            message.value = object.value;
                        else if (typeof object.value === "object")
                            message.value = new $util.LongBits(object.value.low >>> 0, object.value.high >>> 0).toNumber();
                    return message;
                };
    
                /**
                 * Creates a plain object from an Int64Value message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.Int64Value
                 * @static
                 * @param {google.protobuf.Int64Value} message Int64Value
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Int64Value.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.value = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.value = options.longs === String ? "0" : 0;
                    if (message.value != null && message.hasOwnProperty("value"))
                        if (typeof message.value === "number")
                            object.value = options.longs === String ? String(message.value) : message.value;
                        else
                            object.value = options.longs === String ? $util.Long.prototype.toString.call(message.value) : options.longs === Number ? new $util.LongBits(message.value.low >>> 0, message.value.high >>> 0).toNumber() : message.value;
                    return object;
                };
    
                /**
                 * Converts this Int64Value to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.Int64Value
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Int64Value.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Int64Value;
            })();
    
            protobuf.UInt64Value = (function() {
    
                /**
                 * Properties of a UInt64Value.
                 * @memberof google.protobuf
                 * @interface IUInt64Value
                 * @property {number|string|null} [value] UInt64Value value
                 */
    
                /**
                 * Constructs a new UInt64Value.
                 * @memberof google.protobuf
                 * @classdesc Represents a UInt64Value.
                 * @implements IUInt64Value
                 * @constructor
                 * @param {google.protobuf.IUInt64Value=} [properties] Properties to set
                 */
                function UInt64Value(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * UInt64Value value.
                 * @member {number|string} value
                 * @memberof google.protobuf.UInt64Value
                 * @instance
                 */
                UInt64Value.prototype.value = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    
                /**
                 * Creates a UInt64Value message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.UInt64Value
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.UInt64Value} UInt64Value
                 */
                UInt64Value.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.UInt64Value)
                        return object;
                    var message = new $root.google.protobuf.UInt64Value();
                    if (object.value != null)
                        if ($util.Long)
                            (message.value = $util.Long.fromValue(object.value)).unsigned = true;
                        else if (typeof object.value === "string")
                            message.value = parseInt(object.value, 10);
                        else if (typeof object.value === "number")
                            message.value = object.value;
                        else if (typeof object.value === "object")
                            message.value = new $util.LongBits(object.value.low >>> 0, object.value.high >>> 0).toNumber(true);
                    return message;
                };
    
                /**
                 * Creates a plain object from a UInt64Value message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.UInt64Value
                 * @static
                 * @param {google.protobuf.UInt64Value} message UInt64Value
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                UInt64Value.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, true);
                            object.value = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.value = options.longs === String ? "0" : 0;
                    if (message.value != null && message.hasOwnProperty("value"))
                        if (typeof message.value === "number")
                            object.value = options.longs === String ? String(message.value) : message.value;
                        else
                            object.value = options.longs === String ? $util.Long.prototype.toString.call(message.value) : options.longs === Number ? new $util.LongBits(message.value.low >>> 0, message.value.high >>> 0).toNumber(true) : message.value;
                    return object;
                };
    
                /**
                 * Converts this UInt64Value to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.UInt64Value
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                UInt64Value.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return UInt64Value;
            })();
    
            protobuf.Int32Value = (function() {
    
                /**
                 * Properties of an Int32Value.
                 * @memberof google.protobuf
                 * @interface IInt32Value
                 * @property {number|null} [value] Int32Value value
                 */
    
                /**
                 * Constructs a new Int32Value.
                 * @memberof google.protobuf
                 * @classdesc Represents an Int32Value.
                 * @implements IInt32Value
                 * @constructor
                 * @param {google.protobuf.IInt32Value=} [properties] Properties to set
                 */
                function Int32Value(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Int32Value value.
                 * @member {number} value
                 * @memberof google.protobuf.Int32Value
                 * @instance
                 */
                Int32Value.prototype.value = 0;
    
                /**
                 * Creates an Int32Value message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.Int32Value
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.Int32Value} Int32Value
                 */
                Int32Value.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.Int32Value)
                        return object;
                    var message = new $root.google.protobuf.Int32Value();
                    if (object.value != null)
                        message.value = object.value | 0;
                    return message;
                };
    
                /**
                 * Creates a plain object from an Int32Value message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.Int32Value
                 * @static
                 * @param {google.protobuf.Int32Value} message Int32Value
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Int32Value.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.value = 0;
                    if (message.value != null && message.hasOwnProperty("value"))
                        object.value = message.value;
                    return object;
                };
    
                /**
                 * Converts this Int32Value to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.Int32Value
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Int32Value.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Int32Value;
            })();
    
            protobuf.UInt32Value = (function() {
    
                /**
                 * Properties of a UInt32Value.
                 * @memberof google.protobuf
                 * @interface IUInt32Value
                 * @property {number|null} [value] UInt32Value value
                 */
    
                /**
                 * Constructs a new UInt32Value.
                 * @memberof google.protobuf
                 * @classdesc Represents a UInt32Value.
                 * @implements IUInt32Value
                 * @constructor
                 * @param {google.protobuf.IUInt32Value=} [properties] Properties to set
                 */
                function UInt32Value(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * UInt32Value value.
                 * @member {number} value
                 * @memberof google.protobuf.UInt32Value
                 * @instance
                 */
                UInt32Value.prototype.value = 0;
    
                /**
                 * Creates a UInt32Value message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.UInt32Value
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.UInt32Value} UInt32Value
                 */
                UInt32Value.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.UInt32Value)
                        return object;
                    var message = new $root.google.protobuf.UInt32Value();
                    if (object.value != null)
                        message.value = object.value >>> 0;
                    return message;
                };
    
                /**
                 * Creates a plain object from a UInt32Value message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.UInt32Value
                 * @static
                 * @param {google.protobuf.UInt32Value} message UInt32Value
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                UInt32Value.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.value = 0;
                    if (message.value != null && message.hasOwnProperty("value"))
                        object.value = message.value;
                    return object;
                };
    
                /**
                 * Converts this UInt32Value to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.UInt32Value
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                UInt32Value.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return UInt32Value;
            })();
    
            protobuf.BoolValue = (function() {
    
                /**
                 * Properties of a BoolValue.
                 * @memberof google.protobuf
                 * @interface IBoolValue
                 * @property {boolean|null} [value] BoolValue value
                 */
    
                /**
                 * Constructs a new BoolValue.
                 * @memberof google.protobuf
                 * @classdesc Represents a BoolValue.
                 * @implements IBoolValue
                 * @constructor
                 * @param {google.protobuf.IBoolValue=} [properties] Properties to set
                 */
                function BoolValue(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * BoolValue value.
                 * @member {boolean} value
                 * @memberof google.protobuf.BoolValue
                 * @instance
                 */
                BoolValue.prototype.value = false;
    
                /**
                 * Creates a BoolValue message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.BoolValue
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.BoolValue} BoolValue
                 */
                BoolValue.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.BoolValue)
                        return object;
                    var message = new $root.google.protobuf.BoolValue();
                    if (object.value != null)
                        message.value = Boolean(object.value);
                    return message;
                };
    
                /**
                 * Creates a plain object from a BoolValue message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.BoolValue
                 * @static
                 * @param {google.protobuf.BoolValue} message BoolValue
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                BoolValue.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.value = false;
                    if (message.value != null && message.hasOwnProperty("value"))
                        object.value = message.value;
                    return object;
                };
    
                /**
                 * Converts this BoolValue to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.BoolValue
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                BoolValue.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return BoolValue;
            })();
    
            protobuf.StringValue = (function() {
    
                /**
                 * Properties of a StringValue.
                 * @memberof google.protobuf
                 * @interface IStringValue
                 * @property {string|null} [value] StringValue value
                 */
    
                /**
                 * Constructs a new StringValue.
                 * @memberof google.protobuf
                 * @classdesc Represents a StringValue.
                 * @implements IStringValue
                 * @constructor
                 * @param {google.protobuf.IStringValue=} [properties] Properties to set
                 */
                function StringValue(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * StringValue value.
                 * @member {string} value
                 * @memberof google.protobuf.StringValue
                 * @instance
                 */
                StringValue.prototype.value = "";
    
                /**
                 * Creates a StringValue message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.StringValue
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.StringValue} StringValue
                 */
                StringValue.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.StringValue)
                        return object;
                    var message = new $root.google.protobuf.StringValue();
                    if (object.value != null)
                        message.value = String(object.value);
                    return message;
                };
    
                /**
                 * Creates a plain object from a StringValue message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.StringValue
                 * @static
                 * @param {google.protobuf.StringValue} message StringValue
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                StringValue.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.value = "";
                    if (message.value != null && message.hasOwnProperty("value"))
                        object.value = message.value;
                    return object;
                };
    
                /**
                 * Converts this StringValue to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.StringValue
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                StringValue.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return StringValue;
            })();
    
            protobuf.BytesValue = (function() {
    
                /**
                 * Properties of a BytesValue.
                 * @memberof google.protobuf
                 * @interface IBytesValue
                 * @property {Uint8Array|null} [value] BytesValue value
                 */
    
                /**
                 * Constructs a new BytesValue.
                 * @memberof google.protobuf
                 * @classdesc Represents a BytesValue.
                 * @implements IBytesValue
                 * @constructor
                 * @param {google.protobuf.IBytesValue=} [properties] Properties to set
                 */
                function BytesValue(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * BytesValue value.
                 * @member {Uint8Array} value
                 * @memberof google.protobuf.BytesValue
                 * @instance
                 */
                BytesValue.prototype.value = $util.newBuffer([]);
    
                /**
                 * Creates a BytesValue message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.BytesValue
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.BytesValue} BytesValue
                 */
                BytesValue.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.BytesValue)
                        return object;
                    var message = new $root.google.protobuf.BytesValue();
                    if (object.value != null)
                        if (typeof object.value === "string")
                            $util.base64.decode(object.value, message.value = $util.newBuffer($util.base64.length(object.value)), 0);
                        else if (object.value.length)
                            message.value = object.value;
                    return message;
                };
    
                /**
                 * Creates a plain object from a BytesValue message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.BytesValue
                 * @static
                 * @param {google.protobuf.BytesValue} message BytesValue
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                BytesValue.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        if (options.bytes === String)
                            object.value = "";
                        else {
                            object.value = [];
                            if (options.bytes !== Array)
                                object.value = $util.newBuffer(object.value);
                        }
                    if (message.value != null && message.hasOwnProperty("value"))
                        object.value = options.bytes === String ? $util.base64.encode(message.value, 0, message.value.length) : options.bytes === Array ? Array.prototype.slice.call(message.value) : message.value;
                    return object;
                };
    
                /**
                 * Converts this BytesValue to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.BytesValue
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                BytesValue.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return BytesValue;
            })();
    
            protobuf.Any = (function() {
    
                /**
                 * Properties of an Any.
                 * @memberof google.protobuf
                 * @interface IAny
                 * @property {string|null} [type_url] Any type_url
                 * @property {Uint8Array|null} [value] Any value
                 */
    
                /**
                 * Constructs a new Any.
                 * @memberof google.protobuf
                 * @classdesc Represents an Any.
                 * @implements IAny
                 * @constructor
                 * @param {google.protobuf.IAny=} [properties] Properties to set
                 */
                function Any(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Any type_url.
                 * @member {string} type_url
                 * @memberof google.protobuf.Any
                 * @instance
                 */
                Any.prototype.type_url = "";
    
                /**
                 * Any value.
                 * @member {Uint8Array} value
                 * @memberof google.protobuf.Any
                 * @instance
                 */
                Any.prototype.value = $util.newBuffer([]);
    
                /**
                 * Creates an Any message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.Any
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.Any} Any
                 */
                Any.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.Any)
                        return object;
                    var message = new $root.google.protobuf.Any();
                    if (object.type_url != null)
                        message.type_url = String(object.type_url);
                    if (object.value != null)
                        if (typeof object.value === "string")
                            $util.base64.decode(object.value, message.value = $util.newBuffer($util.base64.length(object.value)), 0);
                        else if (object.value.length)
                            message.value = object.value;
                    return message;
                };
    
                /**
                 * Creates a plain object from an Any message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.Any
                 * @static
                 * @param {google.protobuf.Any} message Any
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Any.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.type_url = "";
                        if (options.bytes === String)
                            object.value = "";
                        else {
                            object.value = [];
                            if (options.bytes !== Array)
                                object.value = $util.newBuffer(object.value);
                        }
                    }
                    if (message.type_url != null && message.hasOwnProperty("type_url"))
                        object.type_url = message.type_url;
                    if (message.value != null && message.hasOwnProperty("value"))
                        object.value = options.bytes === String ? $util.base64.encode(message.value, 0, message.value.length) : options.bytes === Array ? Array.prototype.slice.call(message.value) : message.value;
                    return object;
                };
    
                /**
                 * Converts this Any to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.Any
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Any.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Any;
            })();
    
            protobuf.FieldMask = (function() {
    
                /**
                 * Properties of a FieldMask.
                 * @memberof google.protobuf
                 * @interface IFieldMask
                 * @property {Array.<string>|null} [paths] FieldMask paths
                 */
    
                /**
                 * Constructs a new FieldMask.
                 * @memberof google.protobuf
                 * @classdesc Represents a FieldMask.
                 * @implements IFieldMask
                 * @constructor
                 * @param {google.protobuf.IFieldMask=} [properties] Properties to set
                 */
                function FieldMask(properties) {
                    this.paths = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * FieldMask paths.
                 * @member {Array.<string>} paths
                 * @memberof google.protobuf.FieldMask
                 * @instance
                 */
                FieldMask.prototype.paths = $util.emptyArray;
    
                /**
                 * Creates a FieldMask message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.FieldMask
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.FieldMask} FieldMask
                 */
                FieldMask.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.FieldMask)
                        return object;
                    var message = new $root.google.protobuf.FieldMask();
                    if (object.paths) {
                        if (!Array.isArray(object.paths))
                            throw TypeError(".google.protobuf.FieldMask.paths: array expected");
                        message.paths = [];
                        for (var i = 0; i < object.paths.length; ++i)
                            message.paths[i] = String(object.paths[i]);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a FieldMask message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.FieldMask
                 * @static
                 * @param {google.protobuf.FieldMask} message FieldMask
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                FieldMask.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.paths = [];
                    if (message.paths && message.paths.length) {
                        object.paths = [];
                        for (var j = 0; j < message.paths.length; ++j)
                            object.paths[j] = message.paths[j];
                    }
                    return object;
                };
    
                /**
                 * Converts this FieldMask to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.FieldMask
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                FieldMask.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return FieldMask;
            })();
    
            protobuf.Duration = (function() {
    
                /**
                 * Properties of a Duration.
                 * @memberof google.protobuf
                 * @interface IDuration
                 * @property {number|string|null} [seconds] Duration seconds
                 * @property {number|null} [nanos] Duration nanos
                 */
    
                /**
                 * Constructs a new Duration.
                 * @memberof google.protobuf
                 * @classdesc Represents a Duration.
                 * @implements IDuration
                 * @constructor
                 * @param {google.protobuf.IDuration=} [properties] Properties to set
                 */
                function Duration(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Duration seconds.
                 * @member {number|string} seconds
                 * @memberof google.protobuf.Duration
                 * @instance
                 */
                Duration.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
    
                /**
                 * Duration nanos.
                 * @member {number} nanos
                 * @memberof google.protobuf.Duration
                 * @instance
                 */
                Duration.prototype.nanos = 0;
    
                /**
                 * Creates a Duration message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.Duration
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.Duration} Duration
                 */
                Duration.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.Duration)
                        return object;
                    var message = new $root.google.protobuf.Duration();
                    if (object.seconds != null)
                        if ($util.Long)
                            (message.seconds = $util.Long.fromValue(object.seconds)).unsigned = false;
                        else if (typeof object.seconds === "string")
                            message.seconds = parseInt(object.seconds, 10);
                        else if (typeof object.seconds === "number")
                            message.seconds = object.seconds;
                        else if (typeof object.seconds === "object")
                            message.seconds = new $util.LongBits(object.seconds.low >>> 0, object.seconds.high >>> 0).toNumber();
                    if (object.nanos != null)
                        message.nanos = object.nanos | 0;
                    return message;
                };
    
                /**
                 * Creates a plain object from a Duration message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.Duration
                 * @static
                 * @param {google.protobuf.Duration} message Duration
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Duration.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        if ($util.Long) {
                            var long = new $util.Long(0, 0, false);
                            object.seconds = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.seconds = options.longs === String ? "0" : 0;
                        object.nanos = 0;
                    }
                    if (message.seconds != null && message.hasOwnProperty("seconds"))
                        if (typeof message.seconds === "number")
                            object.seconds = options.longs === String ? String(message.seconds) : message.seconds;
                        else
                            object.seconds = options.longs === String ? $util.Long.prototype.toString.call(message.seconds) : options.longs === Number ? new $util.LongBits(message.seconds.low >>> 0, message.seconds.high >>> 0).toNumber() : message.seconds;
                    if (message.nanos != null && message.hasOwnProperty("nanos"))
                        object.nanos = message.nanos;
                    return object;
                };
    
                /**
                 * Converts this Duration to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.Duration
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Duration.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Duration;
            })();
    
            return protobuf;
        })();
    
        google.firestore = (function() {
    
            /**
             * Namespace firestore.
             * @memberof google
             * @namespace
             */
            var firestore = {};
    
            firestore.v1 = (function() {
    
                /**
                 * Namespace v1.
                 * @memberof google.firestore
                 * @namespace
                 */
                var v1 = {};
    
                v1.DocumentMask = (function() {
    
                    /**
                     * Properties of a DocumentMask.
                     * @memberof google.firestore.v1
                     * @interface IDocumentMask
                     * @property {Array.<string>|null} [fieldPaths] DocumentMask fieldPaths
                     */
    
                    /**
                     * Constructs a new DocumentMask.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a DocumentMask.
                     * @implements IDocumentMask
                     * @constructor
                     * @param {google.firestore.v1.IDocumentMask=} [properties] Properties to set
                     */
                    function DocumentMask(properties) {
                        this.fieldPaths = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * DocumentMask fieldPaths.
                     * @member {Array.<string>} fieldPaths
                     * @memberof google.firestore.v1.DocumentMask
                     * @instance
                     */
                    DocumentMask.prototype.fieldPaths = $util.emptyArray;
    
                    /**
                     * Creates a DocumentMask message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.DocumentMask
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.DocumentMask} DocumentMask
                     */
                    DocumentMask.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.DocumentMask)
                            return object;
                        var message = new $root.google.firestore.v1.DocumentMask();
                        if (object.fieldPaths) {
                            if (!Array.isArray(object.fieldPaths))
                                throw TypeError(".google.firestore.v1.DocumentMask.fieldPaths: array expected");
                            message.fieldPaths = [];
                            for (var i = 0; i < object.fieldPaths.length; ++i)
                                message.fieldPaths[i] = String(object.fieldPaths[i]);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a DocumentMask message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.DocumentMask
                     * @static
                     * @param {google.firestore.v1.DocumentMask} message DocumentMask
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    DocumentMask.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.fieldPaths = [];
                        if (message.fieldPaths && message.fieldPaths.length) {
                            object.fieldPaths = [];
                            for (var j = 0; j < message.fieldPaths.length; ++j)
                                object.fieldPaths[j] = message.fieldPaths[j];
                        }
                        return object;
                    };
    
                    /**
                     * Converts this DocumentMask to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.DocumentMask
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    DocumentMask.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return DocumentMask;
                })();
    
                v1.Precondition = (function() {
    
                    /**
                     * Properties of a Precondition.
                     * @memberof google.firestore.v1
                     * @interface IPrecondition
                     * @property {boolean|null} [exists] Precondition exists
                     * @property {google.protobuf.ITimestamp|null} [updateTime] Precondition updateTime
                     */
    
                    /**
                     * Constructs a new Precondition.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a Precondition.
                     * @implements IPrecondition
                     * @constructor
                     * @param {google.firestore.v1.IPrecondition=} [properties] Properties to set
                     */
                    function Precondition(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * Precondition exists.
                     * @member {boolean} exists
                     * @memberof google.firestore.v1.Precondition
                     * @instance
                     */
                    Precondition.prototype.exists = false;
    
                    /**
                     * Precondition updateTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} updateTime
                     * @memberof google.firestore.v1.Precondition
                     * @instance
                     */
                    Precondition.prototype.updateTime = null;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * Precondition conditionType.
                     * @member {"exists"|"updateTime"|undefined} conditionType
                     * @memberof google.firestore.v1.Precondition
                     * @instance
                     */
                    Object.defineProperty(Precondition.prototype, "conditionType", {
                        get: $util.oneOfGetter($oneOfFields = ["exists", "updateTime"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a Precondition message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.Precondition
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.Precondition} Precondition
                     */
                    Precondition.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.Precondition)
                            return object;
                        var message = new $root.google.firestore.v1.Precondition();
                        if (object.exists != null)
                            message.exists = Boolean(object.exists);
                        if (object.updateTime != null) {
                            if (typeof object.updateTime !== "object")
                                throw TypeError(".google.firestore.v1.Precondition.updateTime: object expected");
                            message.updateTime = $root.google.protobuf.Timestamp.fromObject(object.updateTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a Precondition message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.Precondition
                     * @static
                     * @param {google.firestore.v1.Precondition} message Precondition
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Precondition.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (message.exists != null && message.hasOwnProperty("exists")) {
                            object.exists = message.exists;
                            if (options.oneofs)
                                object.conditionType = "exists";
                        }
                        if (message.updateTime != null && message.hasOwnProperty("updateTime")) {
                            object.updateTime = $root.google.protobuf.Timestamp.toObject(message.updateTime, options);
                            if (options.oneofs)
                                object.conditionType = "updateTime";
                        }
                        return object;
                    };
    
                    /**
                     * Converts this Precondition to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.Precondition
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Precondition.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return Precondition;
                })();
    
                v1.TransactionOptions = (function() {
    
                    /**
                     * Properties of a TransactionOptions.
                     * @memberof google.firestore.v1
                     * @interface ITransactionOptions
                     * @property {google.firestore.v1.TransactionOptions.IReadOnly|null} [readOnly] TransactionOptions readOnly
                     * @property {google.firestore.v1.TransactionOptions.IReadWrite|null} [readWrite] TransactionOptions readWrite
                     */
    
                    /**
                     * Constructs a new TransactionOptions.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a TransactionOptions.
                     * @implements ITransactionOptions
                     * @constructor
                     * @param {google.firestore.v1.ITransactionOptions=} [properties] Properties to set
                     */
                    function TransactionOptions(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * TransactionOptions readOnly.
                     * @member {google.firestore.v1.TransactionOptions.IReadOnly|null|undefined} readOnly
                     * @memberof google.firestore.v1.TransactionOptions
                     * @instance
                     */
                    TransactionOptions.prototype.readOnly = null;
    
                    /**
                     * TransactionOptions readWrite.
                     * @member {google.firestore.v1.TransactionOptions.IReadWrite|null|undefined} readWrite
                     * @memberof google.firestore.v1.TransactionOptions
                     * @instance
                     */
                    TransactionOptions.prototype.readWrite = null;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * TransactionOptions mode.
                     * @member {"readOnly"|"readWrite"|undefined} mode
                     * @memberof google.firestore.v1.TransactionOptions
                     * @instance
                     */
                    Object.defineProperty(TransactionOptions.prototype, "mode", {
                        get: $util.oneOfGetter($oneOfFields = ["readOnly", "readWrite"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a TransactionOptions message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.TransactionOptions
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.TransactionOptions} TransactionOptions
                     */
                    TransactionOptions.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.TransactionOptions)
                            return object;
                        var message = new $root.google.firestore.v1.TransactionOptions();
                        if (object.readOnly != null) {
                            if (typeof object.readOnly !== "object")
                                throw TypeError(".google.firestore.v1.TransactionOptions.readOnly: object expected");
                            message.readOnly = $root.google.firestore.v1.TransactionOptions.ReadOnly.fromObject(object.readOnly);
                        }
                        if (object.readWrite != null) {
                            if (typeof object.readWrite !== "object")
                                throw TypeError(".google.firestore.v1.TransactionOptions.readWrite: object expected");
                            message.readWrite = $root.google.firestore.v1.TransactionOptions.ReadWrite.fromObject(object.readWrite);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a TransactionOptions message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.TransactionOptions
                     * @static
                     * @param {google.firestore.v1.TransactionOptions} message TransactionOptions
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    TransactionOptions.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (message.readOnly != null && message.hasOwnProperty("readOnly")) {
                            object.readOnly = $root.google.firestore.v1.TransactionOptions.ReadOnly.toObject(message.readOnly, options);
                            if (options.oneofs)
                                object.mode = "readOnly";
                        }
                        if (message.readWrite != null && message.hasOwnProperty("readWrite")) {
                            object.readWrite = $root.google.firestore.v1.TransactionOptions.ReadWrite.toObject(message.readWrite, options);
                            if (options.oneofs)
                                object.mode = "readWrite";
                        }
                        return object;
                    };
    
                    /**
                     * Converts this TransactionOptions to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.TransactionOptions
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    TransactionOptions.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    TransactionOptions.ReadWrite = (function() {
    
                        /**
                         * Properties of a ReadWrite.
                         * @memberof google.firestore.v1.TransactionOptions
                         * @interface IReadWrite
                         * @property {Uint8Array|null} [retryTransaction] ReadWrite retryTransaction
                         */
    
                        /**
                         * Constructs a new ReadWrite.
                         * @memberof google.firestore.v1.TransactionOptions
                         * @classdesc Represents a ReadWrite.
                         * @implements IReadWrite
                         * @constructor
                         * @param {google.firestore.v1.TransactionOptions.IReadWrite=} [properties] Properties to set
                         */
                        function ReadWrite(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ReadWrite retryTransaction.
                         * @member {Uint8Array} retryTransaction
                         * @memberof google.firestore.v1.TransactionOptions.ReadWrite
                         * @instance
                         */
                        ReadWrite.prototype.retryTransaction = $util.newBuffer([]);
    
                        /**
                         * Creates a ReadWrite message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.TransactionOptions.ReadWrite
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.TransactionOptions.ReadWrite} ReadWrite
                         */
                        ReadWrite.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.TransactionOptions.ReadWrite)
                                return object;
                            var message = new $root.google.firestore.v1.TransactionOptions.ReadWrite();
                            if (object.retryTransaction != null)
                                if (typeof object.retryTransaction === "string")
                                    $util.base64.decode(object.retryTransaction, message.retryTransaction = $util.newBuffer($util.base64.length(object.retryTransaction)), 0);
                                else if (object.retryTransaction.length)
                                    message.retryTransaction = object.retryTransaction;
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a ReadWrite message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.TransactionOptions.ReadWrite
                         * @static
                         * @param {google.firestore.v1.TransactionOptions.ReadWrite} message ReadWrite
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ReadWrite.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                if (options.bytes === String)
                                    object.retryTransaction = "";
                                else {
                                    object.retryTransaction = [];
                                    if (options.bytes !== Array)
                                        object.retryTransaction = $util.newBuffer(object.retryTransaction);
                                }
                            if (message.retryTransaction != null && message.hasOwnProperty("retryTransaction"))
                                object.retryTransaction = options.bytes === String ? $util.base64.encode(message.retryTransaction, 0, message.retryTransaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.retryTransaction) : message.retryTransaction;
                            return object;
                        };
    
                        /**
                         * Converts this ReadWrite to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.TransactionOptions.ReadWrite
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ReadWrite.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        return ReadWrite;
                    })();
    
                    TransactionOptions.ReadOnly = (function() {
    
                        /**
                         * Properties of a ReadOnly.
                         * @memberof google.firestore.v1.TransactionOptions
                         * @interface IReadOnly
                         * @property {google.protobuf.ITimestamp|null} [readTime] ReadOnly readTime
                         */
    
                        /**
                         * Constructs a new ReadOnly.
                         * @memberof google.firestore.v1.TransactionOptions
                         * @classdesc Represents a ReadOnly.
                         * @implements IReadOnly
                         * @constructor
                         * @param {google.firestore.v1.TransactionOptions.IReadOnly=} [properties] Properties to set
                         */
                        function ReadOnly(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ReadOnly readTime.
                         * @member {google.protobuf.ITimestamp|null|undefined} readTime
                         * @memberof google.firestore.v1.TransactionOptions.ReadOnly
                         * @instance
                         */
                        ReadOnly.prototype.readTime = null;
    
                        // OneOf field names bound to virtual getters and setters
                        var $oneOfFields;
    
                        /**
                         * ReadOnly consistencySelector.
                         * @member {"readTime"|undefined} consistencySelector
                         * @memberof google.firestore.v1.TransactionOptions.ReadOnly
                         * @instance
                         */
                        Object.defineProperty(ReadOnly.prototype, "consistencySelector", {
                            get: $util.oneOfGetter($oneOfFields = ["readTime"]),
                            set: $util.oneOfSetter($oneOfFields)
                        });
    
                        /**
                         * Creates a ReadOnly message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.TransactionOptions.ReadOnly
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.TransactionOptions.ReadOnly} ReadOnly
                         */
                        ReadOnly.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.TransactionOptions.ReadOnly)
                                return object;
                            var message = new $root.google.firestore.v1.TransactionOptions.ReadOnly();
                            if (object.readTime != null) {
                                if (typeof object.readTime !== "object")
                                    throw TypeError(".google.firestore.v1.TransactionOptions.ReadOnly.readTime: object expected");
                                message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a ReadOnly message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.TransactionOptions.ReadOnly
                         * @static
                         * @param {google.firestore.v1.TransactionOptions.ReadOnly} message ReadOnly
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ReadOnly.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (message.readTime != null && message.hasOwnProperty("readTime")) {
                                object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                                if (options.oneofs)
                                    object.consistencySelector = "readTime";
                            }
                            return object;
                        };
    
                        /**
                         * Converts this ReadOnly to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.TransactionOptions.ReadOnly
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ReadOnly.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        return ReadOnly;
                    })();
    
                    return TransactionOptions;
                })();
    
                v1.Document = (function() {
    
                    /**
                     * Properties of a Document.
                     * @memberof google.firestore.v1
                     * @interface IDocument
                     * @property {string|null} [name] Document name
                     * @property {Object.<string,google.firestore.v1.IValue>|null} [fields] Document fields
                     * @property {google.protobuf.ITimestamp|null} [createTime] Document createTime
                     * @property {google.protobuf.ITimestamp|null} [updateTime] Document updateTime
                     */
    
                    /**
                     * Constructs a new Document.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a Document.
                     * @implements IDocument
                     * @constructor
                     * @param {google.firestore.v1.IDocument=} [properties] Properties to set
                     */
                    function Document(properties) {
                        this.fields = {};
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * Document name.
                     * @member {string} name
                     * @memberof google.firestore.v1.Document
                     * @instance
                     */
                    Document.prototype.name = "";
    
                    /**
                     * Document fields.
                     * @member {Object.<string,google.firestore.v1.IValue>} fields
                     * @memberof google.firestore.v1.Document
                     * @instance
                     */
                    Document.prototype.fields = $util.emptyObject;
    
                    /**
                     * Document createTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} createTime
                     * @memberof google.firestore.v1.Document
                     * @instance
                     */
                    Document.prototype.createTime = null;
    
                    /**
                     * Document updateTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} updateTime
                     * @memberof google.firestore.v1.Document
                     * @instance
                     */
                    Document.prototype.updateTime = null;
    
                    /**
                     * Creates a Document message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.Document
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.Document} Document
                     */
                    Document.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.Document)
                            return object;
                        var message = new $root.google.firestore.v1.Document();
                        if (object.name != null)
                            message.name = String(object.name);
                        if (object.fields) {
                            if (typeof object.fields !== "object")
                                throw TypeError(".google.firestore.v1.Document.fields: object expected");
                            message.fields = {};
                            for (var keys = Object.keys(object.fields), i = 0; i < keys.length; ++i) {
                                if (typeof object.fields[keys[i]] !== "object")
                                    throw TypeError(".google.firestore.v1.Document.fields: object expected");
                                message.fields[keys[i]] = $root.google.firestore.v1.Value.fromObject(object.fields[keys[i]]);
                            }
                        }
                        if (object.createTime != null) {
                            if (typeof object.createTime !== "object")
                                throw TypeError(".google.firestore.v1.Document.createTime: object expected");
                            message.createTime = $root.google.protobuf.Timestamp.fromObject(object.createTime);
                        }
                        if (object.updateTime != null) {
                            if (typeof object.updateTime !== "object")
                                throw TypeError(".google.firestore.v1.Document.updateTime: object expected");
                            message.updateTime = $root.google.protobuf.Timestamp.fromObject(object.updateTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a Document message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.Document
                     * @static
                     * @param {google.firestore.v1.Document} message Document
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Document.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.objects || options.defaults)
                            object.fields = {};
                        if (options.defaults) {
                            object.name = "";
                            object.createTime = null;
                            object.updateTime = null;
                        }
                        if (message.name != null && message.hasOwnProperty("name"))
                            object.name = message.name;
                        var keys2;
                        if (message.fields && (keys2 = Object.keys(message.fields)).length) {
                            object.fields = {};
                            for (var j = 0; j < keys2.length; ++j)
                                object.fields[keys2[j]] = $root.google.firestore.v1.Value.toObject(message.fields[keys2[j]], options);
                        }
                        if (message.createTime != null && message.hasOwnProperty("createTime"))
                            object.createTime = $root.google.protobuf.Timestamp.toObject(message.createTime, options);
                        if (message.updateTime != null && message.hasOwnProperty("updateTime"))
                            object.updateTime = $root.google.protobuf.Timestamp.toObject(message.updateTime, options);
                        return object;
                    };
    
                    /**
                     * Converts this Document to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.Document
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Document.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return Document;
                })();
    
                v1.Value = (function() {
    
                    /**
                     * Properties of a Value.
                     * @memberof google.firestore.v1
                     * @interface IValue
                     * @property {google.protobuf.NullValue|null} [nullValue] Value nullValue
                     * @property {boolean|null} [booleanValue] Value booleanValue
                     * @property {number|string|null} [integerValue] Value integerValue
                     * @property {number|null} [doubleValue] Value doubleValue
                     * @property {google.protobuf.ITimestamp|null} [timestampValue] Value timestampValue
                     * @property {string|null} [stringValue] Value stringValue
                     * @property {Uint8Array|null} [bytesValue] Value bytesValue
                     * @property {string|null} [referenceValue] Value referenceValue
                     * @property {google.type.ILatLng|null} [geoPointValue] Value geoPointValue
                     * @property {google.firestore.v1.IArrayValue|null} [arrayValue] Value arrayValue
                     * @property {google.firestore.v1.IMapValue|null} [mapValue] Value mapValue
                     */
    
                    /**
                     * Constructs a new Value.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a Value.
                     * @implements IValue
                     * @constructor
                     * @param {google.firestore.v1.IValue=} [properties] Properties to set
                     */
                    function Value(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * Value nullValue.
                     * @member {google.protobuf.NullValue} nullValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.nullValue = 0;
    
                    /**
                     * Value booleanValue.
                     * @member {boolean} booleanValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.booleanValue = false;
    
                    /**
                     * Value integerValue.
                     * @member {number|string} integerValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.integerValue = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
    
                    /**
                     * Value doubleValue.
                     * @member {number} doubleValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.doubleValue = 0;
    
                    /**
                     * Value timestampValue.
                     * @member {google.protobuf.ITimestamp|null|undefined} timestampValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.timestampValue = null;
    
                    /**
                     * Value stringValue.
                     * @member {string} stringValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.stringValue = "";
    
                    /**
                     * Value bytesValue.
                     * @member {Uint8Array} bytesValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.bytesValue = $util.newBuffer([]);
    
                    /**
                     * Value referenceValue.
                     * @member {string} referenceValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.referenceValue = "";
    
                    /**
                     * Value geoPointValue.
                     * @member {google.type.ILatLng|null|undefined} geoPointValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.geoPointValue = null;
    
                    /**
                     * Value arrayValue.
                     * @member {google.firestore.v1.IArrayValue|null|undefined} arrayValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.arrayValue = null;
    
                    /**
                     * Value mapValue.
                     * @member {google.firestore.v1.IMapValue|null|undefined} mapValue
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Value.prototype.mapValue = null;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * Value valueType.
                     * @member {"nullValue"|"booleanValue"|"integerValue"|"doubleValue"|"timestampValue"|"stringValue"|"bytesValue"|"referenceValue"|"geoPointValue"|"arrayValue"|"mapValue"|undefined} valueType
                     * @memberof google.firestore.v1.Value
                     * @instance
                     */
                    Object.defineProperty(Value.prototype, "valueType", {
                        get: $util.oneOfGetter($oneOfFields = ["nullValue", "booleanValue", "integerValue", "doubleValue", "timestampValue", "stringValue", "bytesValue", "referenceValue", "geoPointValue", "arrayValue", "mapValue"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a Value message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.Value
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.Value} Value
                     */
                    Value.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.Value)
                            return object;
                        var message = new $root.google.firestore.v1.Value();
                        switch (object.nullValue) {
                        case "NULL_VALUE":
                        case 0:
                            message.nullValue = 0;
                            break;
                        }
                        if (object.booleanValue != null)
                            message.booleanValue = Boolean(object.booleanValue);
                        if (object.integerValue != null)
                            if ($util.Long)
                                (message.integerValue = $util.Long.fromValue(object.integerValue)).unsigned = false;
                            else if (typeof object.integerValue === "string")
                                message.integerValue = parseInt(object.integerValue, 10);
                            else if (typeof object.integerValue === "number")
                                message.integerValue = object.integerValue;
                            else if (typeof object.integerValue === "object")
                                message.integerValue = new $util.LongBits(object.integerValue.low >>> 0, object.integerValue.high >>> 0).toNumber();
                        if (object.doubleValue != null)
                            message.doubleValue = Number(object.doubleValue);
                        if (object.timestampValue != null) {
                            if (typeof object.timestampValue !== "object")
                                throw TypeError(".google.firestore.v1.Value.timestampValue: object expected");
                            message.timestampValue = $root.google.protobuf.Timestamp.fromObject(object.timestampValue);
                        }
                        if (object.stringValue != null)
                            message.stringValue = String(object.stringValue);
                        if (object.bytesValue != null)
                            if (typeof object.bytesValue === "string")
                                $util.base64.decode(object.bytesValue, message.bytesValue = $util.newBuffer($util.base64.length(object.bytesValue)), 0);
                            else if (object.bytesValue.length)
                                message.bytesValue = object.bytesValue;
                        if (object.referenceValue != null)
                            message.referenceValue = String(object.referenceValue);
                        if (object.geoPointValue != null) {
                            if (typeof object.geoPointValue !== "object")
                                throw TypeError(".google.firestore.v1.Value.geoPointValue: object expected");
                            message.geoPointValue = $root.google.type.LatLng.fromObject(object.geoPointValue);
                        }
                        if (object.arrayValue != null) {
                            if (typeof object.arrayValue !== "object")
                                throw TypeError(".google.firestore.v1.Value.arrayValue: object expected");
                            message.arrayValue = $root.google.firestore.v1.ArrayValue.fromObject(object.arrayValue);
                        }
                        if (object.mapValue != null) {
                            if (typeof object.mapValue !== "object")
                                throw TypeError(".google.firestore.v1.Value.mapValue: object expected");
                            message.mapValue = $root.google.firestore.v1.MapValue.fromObject(object.mapValue);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a Value message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.Value
                     * @static
                     * @param {google.firestore.v1.Value} message Value
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Value.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (message.booleanValue != null && message.hasOwnProperty("booleanValue")) {
                            object.booleanValue = message.booleanValue;
                            if (options.oneofs)
                                object.valueType = "booleanValue";
                        }
                        if (message.integerValue != null && message.hasOwnProperty("integerValue")) {
                            if (typeof message.integerValue === "number")
                                object.integerValue = options.longs === String ? String(message.integerValue) : message.integerValue;
                            else
                                object.integerValue = options.longs === String ? $util.Long.prototype.toString.call(message.integerValue) : options.longs === Number ? new $util.LongBits(message.integerValue.low >>> 0, message.integerValue.high >>> 0).toNumber() : message.integerValue;
                            if (options.oneofs)
                                object.valueType = "integerValue";
                        }
                        if (message.doubleValue != null && message.hasOwnProperty("doubleValue")) {
                            object.doubleValue = options.json && !isFinite(message.doubleValue) ? String(message.doubleValue) : message.doubleValue;
                            if (options.oneofs)
                                object.valueType = "doubleValue";
                        }
                        if (message.referenceValue != null && message.hasOwnProperty("referenceValue")) {
                            object.referenceValue = message.referenceValue;
                            if (options.oneofs)
                                object.valueType = "referenceValue";
                        }
                        if (message.mapValue != null && message.hasOwnProperty("mapValue")) {
                            object.mapValue = $root.google.firestore.v1.MapValue.toObject(message.mapValue, options);
                            if (options.oneofs)
                                object.valueType = "mapValue";
                        }
                        if (message.geoPointValue != null && message.hasOwnProperty("geoPointValue")) {
                            object.geoPointValue = $root.google.type.LatLng.toObject(message.geoPointValue, options);
                            if (options.oneofs)
                                object.valueType = "geoPointValue";
                        }
                        if (message.arrayValue != null && message.hasOwnProperty("arrayValue")) {
                            object.arrayValue = $root.google.firestore.v1.ArrayValue.toObject(message.arrayValue, options);
                            if (options.oneofs)
                                object.valueType = "arrayValue";
                        }
                        if (message.timestampValue != null && message.hasOwnProperty("timestampValue")) {
                            object.timestampValue = $root.google.protobuf.Timestamp.toObject(message.timestampValue, options);
                            if (options.oneofs)
                                object.valueType = "timestampValue";
                        }
                        if (message.nullValue != null && message.hasOwnProperty("nullValue")) {
                            object.nullValue = options.enums === String ? $root.google.protobuf.NullValue[message.nullValue] : message.nullValue;
                            if (options.oneofs)
                                object.valueType = "nullValue";
                        }
                        if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
                            object.stringValue = message.stringValue;
                            if (options.oneofs)
                                object.valueType = "stringValue";
                        }
                        if (message.bytesValue != null && message.hasOwnProperty("bytesValue")) {
                            object.bytesValue = options.bytes === String ? $util.base64.encode(message.bytesValue, 0, message.bytesValue.length) : options.bytes === Array ? Array.prototype.slice.call(message.bytesValue) : message.bytesValue;
                            if (options.oneofs)
                                object.valueType = "bytesValue";
                        }
                        return object;
                    };
    
                    /**
                     * Converts this Value to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.Value
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Value.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return Value;
                })();
    
                v1.ArrayValue = (function() {
    
                    /**
                     * Properties of an ArrayValue.
                     * @memberof google.firestore.v1
                     * @interface IArrayValue
                     * @property {Array.<google.firestore.v1.IValue>|null} [values] ArrayValue values
                     */
    
                    /**
                     * Constructs a new ArrayValue.
                     * @memberof google.firestore.v1
                     * @classdesc Represents an ArrayValue.
                     * @implements IArrayValue
                     * @constructor
                     * @param {google.firestore.v1.IArrayValue=} [properties] Properties to set
                     */
                    function ArrayValue(properties) {
                        this.values = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ArrayValue values.
                     * @member {Array.<google.firestore.v1.IValue>} values
                     * @memberof google.firestore.v1.ArrayValue
                     * @instance
                     */
                    ArrayValue.prototype.values = $util.emptyArray;
    
                    /**
                     * Creates an ArrayValue message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.ArrayValue
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.ArrayValue} ArrayValue
                     */
                    ArrayValue.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.ArrayValue)
                            return object;
                        var message = new $root.google.firestore.v1.ArrayValue();
                        if (object.values) {
                            if (!Array.isArray(object.values))
                                throw TypeError(".google.firestore.v1.ArrayValue.values: array expected");
                            message.values = [];
                            for (var i = 0; i < object.values.length; ++i) {
                                if (typeof object.values[i] !== "object")
                                    throw TypeError(".google.firestore.v1.ArrayValue.values: object expected");
                                message.values[i] = $root.google.firestore.v1.Value.fromObject(object.values[i]);
                            }
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from an ArrayValue message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.ArrayValue
                     * @static
                     * @param {google.firestore.v1.ArrayValue} message ArrayValue
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ArrayValue.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.values = [];
                        if (message.values && message.values.length) {
                            object.values = [];
                            for (var j = 0; j < message.values.length; ++j)
                                object.values[j] = $root.google.firestore.v1.Value.toObject(message.values[j], options);
                        }
                        return object;
                    };
    
                    /**
                     * Converts this ArrayValue to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.ArrayValue
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ArrayValue.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ArrayValue;
                })();
    
                v1.MapValue = (function() {
    
                    /**
                     * Properties of a MapValue.
                     * @memberof google.firestore.v1
                     * @interface IMapValue
                     * @property {Object.<string,google.firestore.v1.IValue>|null} [fields] MapValue fields
                     */
    
                    /**
                     * Constructs a new MapValue.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a MapValue.
                     * @implements IMapValue
                     * @constructor
                     * @param {google.firestore.v1.IMapValue=} [properties] Properties to set
                     */
                    function MapValue(properties) {
                        this.fields = {};
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * MapValue fields.
                     * @member {Object.<string,google.firestore.v1.IValue>} fields
                     * @memberof google.firestore.v1.MapValue
                     * @instance
                     */
                    MapValue.prototype.fields = $util.emptyObject;
    
                    /**
                     * Creates a MapValue message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.MapValue
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.MapValue} MapValue
                     */
                    MapValue.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.MapValue)
                            return object;
                        var message = new $root.google.firestore.v1.MapValue();
                        if (object.fields) {
                            if (typeof object.fields !== "object")
                                throw TypeError(".google.firestore.v1.MapValue.fields: object expected");
                            message.fields = {};
                            for (var keys = Object.keys(object.fields), i = 0; i < keys.length; ++i) {
                                if (typeof object.fields[keys[i]] !== "object")
                                    throw TypeError(".google.firestore.v1.MapValue.fields: object expected");
                                message.fields[keys[i]] = $root.google.firestore.v1.Value.fromObject(object.fields[keys[i]]);
                            }
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a MapValue message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.MapValue
                     * @static
                     * @param {google.firestore.v1.MapValue} message MapValue
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    MapValue.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.objects || options.defaults)
                            object.fields = {};
                        var keys2;
                        if (message.fields && (keys2 = Object.keys(message.fields)).length) {
                            object.fields = {};
                            for (var j = 0; j < keys2.length; ++j)
                                object.fields[keys2[j]] = $root.google.firestore.v1.Value.toObject(message.fields[keys2[j]], options);
                        }
                        return object;
                    };
    
                    /**
                     * Converts this MapValue to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.MapValue
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    MapValue.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return MapValue;
                })();
    
                v1.Firestore = (function() {
    
                    /**
                     * Constructs a new Firestore service.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a Firestore
                     * @extends $protobuf.rpc.Service
                     * @constructor
                     * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
                     * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
                     * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
                     */
                    function Firestore(rpcImpl, requestDelimited, responseDelimited) {
                        $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
                    }
    
                    (Firestore.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = Firestore;
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#getDocument}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef GetDocumentCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.Document} [response] Document
                     */
    
                    /**
                     * Calls GetDocument.
                     * @function getDocument
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IGetDocumentRequest} request GetDocumentRequest message or plain object
                     * @param {google.firestore.v1.Firestore.GetDocumentCallback} callback Node-style callback called with the error, if any, and Document
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.getDocument = function getDocument(request, callback) {
                        return this.rpcCall(getDocument, $root.google.firestore.v1.GetDocumentRequest, $root.google.firestore.v1.Document, request, callback);
                    }, "name", { value: "GetDocument" });
    
                    /**
                     * Calls GetDocument.
                     * @function getDocument
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IGetDocumentRequest} request GetDocumentRequest message or plain object
                     * @returns {Promise<google.firestore.v1.Document>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#listDocuments}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef ListDocumentsCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.ListDocumentsResponse} [response] ListDocumentsResponse
                     */
    
                    /**
                     * Calls ListDocuments.
                     * @function listDocuments
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IListDocumentsRequest} request ListDocumentsRequest message or plain object
                     * @param {google.firestore.v1.Firestore.ListDocumentsCallback} callback Node-style callback called with the error, if any, and ListDocumentsResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.listDocuments = function listDocuments(request, callback) {
                        return this.rpcCall(listDocuments, $root.google.firestore.v1.ListDocumentsRequest, $root.google.firestore.v1.ListDocumentsResponse, request, callback);
                    }, "name", { value: "ListDocuments" });
    
                    /**
                     * Calls ListDocuments.
                     * @function listDocuments
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IListDocumentsRequest} request ListDocumentsRequest message or plain object
                     * @returns {Promise<google.firestore.v1.ListDocumentsResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#updateDocument}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef UpdateDocumentCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.Document} [response] Document
                     */
    
                    /**
                     * Calls UpdateDocument.
                     * @function updateDocument
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IUpdateDocumentRequest} request UpdateDocumentRequest message or plain object
                     * @param {google.firestore.v1.Firestore.UpdateDocumentCallback} callback Node-style callback called with the error, if any, and Document
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.updateDocument = function updateDocument(request, callback) {
                        return this.rpcCall(updateDocument, $root.google.firestore.v1.UpdateDocumentRequest, $root.google.firestore.v1.Document, request, callback);
                    }, "name", { value: "UpdateDocument" });
    
                    /**
                     * Calls UpdateDocument.
                     * @function updateDocument
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IUpdateDocumentRequest} request UpdateDocumentRequest message or plain object
                     * @returns {Promise<google.firestore.v1.Document>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#deleteDocument}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef DeleteDocumentCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.protobuf.Empty} [response] Empty
                     */
    
                    /**
                     * Calls DeleteDocument.
                     * @function deleteDocument
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IDeleteDocumentRequest} request DeleteDocumentRequest message or plain object
                     * @param {google.firestore.v1.Firestore.DeleteDocumentCallback} callback Node-style callback called with the error, if any, and Empty
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.deleteDocument = function deleteDocument(request, callback) {
                        return this.rpcCall(deleteDocument, $root.google.firestore.v1.DeleteDocumentRequest, $root.google.protobuf.Empty, request, callback);
                    }, "name", { value: "DeleteDocument" });
    
                    /**
                     * Calls DeleteDocument.
                     * @function deleteDocument
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IDeleteDocumentRequest} request DeleteDocumentRequest message or plain object
                     * @returns {Promise<google.protobuf.Empty>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#batchGetDocuments}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef BatchGetDocumentsCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.BatchGetDocumentsResponse} [response] BatchGetDocumentsResponse
                     */
    
                    /**
                     * Calls BatchGetDocuments.
                     * @function batchGetDocuments
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IBatchGetDocumentsRequest} request BatchGetDocumentsRequest message or plain object
                     * @param {google.firestore.v1.Firestore.BatchGetDocumentsCallback} callback Node-style callback called with the error, if any, and BatchGetDocumentsResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.batchGetDocuments = function batchGetDocuments(request, callback) {
                        return this.rpcCall(batchGetDocuments, $root.google.firestore.v1.BatchGetDocumentsRequest, $root.google.firestore.v1.BatchGetDocumentsResponse, request, callback);
                    }, "name", { value: "BatchGetDocuments" });
    
                    /**
                     * Calls BatchGetDocuments.
                     * @function batchGetDocuments
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IBatchGetDocumentsRequest} request BatchGetDocumentsRequest message or plain object
                     * @returns {Promise<google.firestore.v1.BatchGetDocumentsResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#beginTransaction}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef BeginTransactionCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.BeginTransactionResponse} [response] BeginTransactionResponse
                     */
    
                    /**
                     * Calls BeginTransaction.
                     * @function beginTransaction
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IBeginTransactionRequest} request BeginTransactionRequest message or plain object
                     * @param {google.firestore.v1.Firestore.BeginTransactionCallback} callback Node-style callback called with the error, if any, and BeginTransactionResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.beginTransaction = function beginTransaction(request, callback) {
                        return this.rpcCall(beginTransaction, $root.google.firestore.v1.BeginTransactionRequest, $root.google.firestore.v1.BeginTransactionResponse, request, callback);
                    }, "name", { value: "BeginTransaction" });
    
                    /**
                     * Calls BeginTransaction.
                     * @function beginTransaction
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IBeginTransactionRequest} request BeginTransactionRequest message or plain object
                     * @returns {Promise<google.firestore.v1.BeginTransactionResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#commit}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef CommitCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.CommitResponse} [response] CommitResponse
                     */
    
                    /**
                     * Calls Commit.
                     * @function commit
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.ICommitRequest} request CommitRequest message or plain object
                     * @param {google.firestore.v1.Firestore.CommitCallback} callback Node-style callback called with the error, if any, and CommitResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.commit = function commit(request, callback) {
                        return this.rpcCall(commit, $root.google.firestore.v1.CommitRequest, $root.google.firestore.v1.CommitResponse, request, callback);
                    }, "name", { value: "Commit" });
    
                    /**
                     * Calls Commit.
                     * @function commit
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.ICommitRequest} request CommitRequest message or plain object
                     * @returns {Promise<google.firestore.v1.CommitResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#rollback}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef RollbackCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.protobuf.Empty} [response] Empty
                     */
    
                    /**
                     * Calls Rollback.
                     * @function rollback
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IRollbackRequest} request RollbackRequest message or plain object
                     * @param {google.firestore.v1.Firestore.RollbackCallback} callback Node-style callback called with the error, if any, and Empty
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.rollback = function rollback(request, callback) {
                        return this.rpcCall(rollback, $root.google.firestore.v1.RollbackRequest, $root.google.protobuf.Empty, request, callback);
                    }, "name", { value: "Rollback" });
    
                    /**
                     * Calls Rollback.
                     * @function rollback
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IRollbackRequest} request RollbackRequest message or plain object
                     * @returns {Promise<google.protobuf.Empty>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#runQuery}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef RunQueryCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.RunQueryResponse} [response] RunQueryResponse
                     */
    
                    /**
                     * Calls RunQuery.
                     * @function runQuery
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IRunQueryRequest} request RunQueryRequest message or plain object
                     * @param {google.firestore.v1.Firestore.RunQueryCallback} callback Node-style callback called with the error, if any, and RunQueryResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.runQuery = function runQuery(request, callback) {
                        return this.rpcCall(runQuery, $root.google.firestore.v1.RunQueryRequest, $root.google.firestore.v1.RunQueryResponse, request, callback);
                    }, "name", { value: "RunQuery" });
    
                    /**
                     * Calls RunQuery.
                     * @function runQuery
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IRunQueryRequest} request RunQueryRequest message or plain object
                     * @returns {Promise<google.firestore.v1.RunQueryResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#partitionQuery}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef PartitionQueryCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.PartitionQueryResponse} [response] PartitionQueryResponse
                     */
    
                    /**
                     * Calls PartitionQuery.
                     * @function partitionQuery
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IPartitionQueryRequest} request PartitionQueryRequest message or plain object
                     * @param {google.firestore.v1.Firestore.PartitionQueryCallback} callback Node-style callback called with the error, if any, and PartitionQueryResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.partitionQuery = function partitionQuery(request, callback) {
                        return this.rpcCall(partitionQuery, $root.google.firestore.v1.PartitionQueryRequest, $root.google.firestore.v1.PartitionQueryResponse, request, callback);
                    }, "name", { value: "PartitionQuery" });
    
                    /**
                     * Calls PartitionQuery.
                     * @function partitionQuery
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IPartitionQueryRequest} request PartitionQueryRequest message or plain object
                     * @returns {Promise<google.firestore.v1.PartitionQueryResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#write}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef WriteCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.WriteResponse} [response] WriteResponse
                     */
    
                    /**
                     * Calls Write.
                     * @function write
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IWriteRequest} request WriteRequest message or plain object
                     * @param {google.firestore.v1.Firestore.WriteCallback} callback Node-style callback called with the error, if any, and WriteResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.write = function write(request, callback) {
                        return this.rpcCall(write, $root.google.firestore.v1.WriteRequest, $root.google.firestore.v1.WriteResponse, request, callback);
                    }, "name", { value: "Write" });
    
                    /**
                     * Calls Write.
                     * @function write
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IWriteRequest} request WriteRequest message or plain object
                     * @returns {Promise<google.firestore.v1.WriteResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#listen}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef ListenCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.ListenResponse} [response] ListenResponse
                     */
    
                    /**
                     * Calls Listen.
                     * @function listen
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IListenRequest} request ListenRequest message or plain object
                     * @param {google.firestore.v1.Firestore.ListenCallback} callback Node-style callback called with the error, if any, and ListenResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.listen = function listen(request, callback) {
                        return this.rpcCall(listen, $root.google.firestore.v1.ListenRequest, $root.google.firestore.v1.ListenResponse, request, callback);
                    }, "name", { value: "Listen" });
    
                    /**
                     * Calls Listen.
                     * @function listen
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IListenRequest} request ListenRequest message or plain object
                     * @returns {Promise<google.firestore.v1.ListenResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#listCollectionIds}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef ListCollectionIdsCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.ListCollectionIdsResponse} [response] ListCollectionIdsResponse
                     */
    
                    /**
                     * Calls ListCollectionIds.
                     * @function listCollectionIds
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IListCollectionIdsRequest} request ListCollectionIdsRequest message or plain object
                     * @param {google.firestore.v1.Firestore.ListCollectionIdsCallback} callback Node-style callback called with the error, if any, and ListCollectionIdsResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.listCollectionIds = function listCollectionIds(request, callback) {
                        return this.rpcCall(listCollectionIds, $root.google.firestore.v1.ListCollectionIdsRequest, $root.google.firestore.v1.ListCollectionIdsResponse, request, callback);
                    }, "name", { value: "ListCollectionIds" });
    
                    /**
                     * Calls ListCollectionIds.
                     * @function listCollectionIds
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IListCollectionIdsRequest} request ListCollectionIdsRequest message or plain object
                     * @returns {Promise<google.firestore.v1.ListCollectionIdsResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#batchWrite}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef BatchWriteCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.BatchWriteResponse} [response] BatchWriteResponse
                     */
    
                    /**
                     * Calls BatchWrite.
                     * @function batchWrite
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IBatchWriteRequest} request BatchWriteRequest message or plain object
                     * @param {google.firestore.v1.Firestore.BatchWriteCallback} callback Node-style callback called with the error, if any, and BatchWriteResponse
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.batchWrite = function batchWrite(request, callback) {
                        return this.rpcCall(batchWrite, $root.google.firestore.v1.BatchWriteRequest, $root.google.firestore.v1.BatchWriteResponse, request, callback);
                    }, "name", { value: "BatchWrite" });
    
                    /**
                     * Calls BatchWrite.
                     * @function batchWrite
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.IBatchWriteRequest} request BatchWriteRequest message or plain object
                     * @returns {Promise<google.firestore.v1.BatchWriteResponse>} Promise
                     * @variation 2
                     */
    
                    /**
                     * Callback as used by {@link google.firestore.v1.Firestore#createDocument}.
                     * @memberof google.firestore.v1.Firestore
                     * @typedef CreateDocumentCallback
                     * @type {function}
                     * @param {Error|null} error Error, if any
                     * @param {google.firestore.v1.Document} [response] Document
                     */
    
                    /**
                     * Calls CreateDocument.
                     * @function createDocument
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.ICreateDocumentRequest} request CreateDocumentRequest message or plain object
                     * @param {google.firestore.v1.Firestore.CreateDocumentCallback} callback Node-style callback called with the error, if any, and Document
                     * @returns {undefined}
                     * @variation 1
                     */
                    Object.defineProperty(Firestore.prototype.createDocument = function createDocument(request, callback) {
                        return this.rpcCall(createDocument, $root.google.firestore.v1.CreateDocumentRequest, $root.google.firestore.v1.Document, request, callback);
                    }, "name", { value: "CreateDocument" });
    
                    /**
                     * Calls CreateDocument.
                     * @function createDocument
                     * @memberof google.firestore.v1.Firestore
                     * @instance
                     * @param {google.firestore.v1.ICreateDocumentRequest} request CreateDocumentRequest message or plain object
                     * @returns {Promise<google.firestore.v1.Document>} Promise
                     * @variation 2
                     */
    
                    return Firestore;
                })();
    
                v1.GetDocumentRequest = (function() {
    
                    /**
                     * Properties of a GetDocumentRequest.
                     * @memberof google.firestore.v1
                     * @interface IGetDocumentRequest
                     * @property {string|null} [name] GetDocumentRequest name
                     * @property {google.firestore.v1.IDocumentMask|null} [mask] GetDocumentRequest mask
                     * @property {Uint8Array|null} [transaction] GetDocumentRequest transaction
                     * @property {google.protobuf.ITimestamp|null} [readTime] GetDocumentRequest readTime
                     */
    
                    /**
                     * Constructs a new GetDocumentRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a GetDocumentRequest.
                     * @implements IGetDocumentRequest
                     * @constructor
                     * @param {google.firestore.v1.IGetDocumentRequest=} [properties] Properties to set
                     */
                    function GetDocumentRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * GetDocumentRequest name.
                     * @member {string} name
                     * @memberof google.firestore.v1.GetDocumentRequest
                     * @instance
                     */
                    GetDocumentRequest.prototype.name = "";
    
                    /**
                     * GetDocumentRequest mask.
                     * @member {google.firestore.v1.IDocumentMask|null|undefined} mask
                     * @memberof google.firestore.v1.GetDocumentRequest
                     * @instance
                     */
                    GetDocumentRequest.prototype.mask = null;
    
                    /**
                     * GetDocumentRequest transaction.
                     * @member {Uint8Array} transaction
                     * @memberof google.firestore.v1.GetDocumentRequest
                     * @instance
                     */
                    GetDocumentRequest.prototype.transaction = $util.newBuffer([]);
    
                    /**
                     * GetDocumentRequest readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.GetDocumentRequest
                     * @instance
                     */
                    GetDocumentRequest.prototype.readTime = null;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * GetDocumentRequest consistencySelector.
                     * @member {"transaction"|"readTime"|undefined} consistencySelector
                     * @memberof google.firestore.v1.GetDocumentRequest
                     * @instance
                     */
                    Object.defineProperty(GetDocumentRequest.prototype, "consistencySelector", {
                        get: $util.oneOfGetter($oneOfFields = ["transaction", "readTime"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a GetDocumentRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.GetDocumentRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.GetDocumentRequest} GetDocumentRequest
                     */
                    GetDocumentRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.GetDocumentRequest)
                            return object;
                        var message = new $root.google.firestore.v1.GetDocumentRequest();
                        if (object.name != null)
                            message.name = String(object.name);
                        if (object.mask != null) {
                            if (typeof object.mask !== "object")
                                throw TypeError(".google.firestore.v1.GetDocumentRequest.mask: object expected");
                            message.mask = $root.google.firestore.v1.DocumentMask.fromObject(object.mask);
                        }
                        if (object.transaction != null)
                            if (typeof object.transaction === "string")
                                $util.base64.decode(object.transaction, message.transaction = $util.newBuffer($util.base64.length(object.transaction)), 0);
                            else if (object.transaction.length)
                                message.transaction = object.transaction;
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.GetDocumentRequest.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a GetDocumentRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.GetDocumentRequest
                     * @static
                     * @param {google.firestore.v1.GetDocumentRequest} message GetDocumentRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    GetDocumentRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.name = "";
                            object.mask = null;
                        }
                        if (message.name != null && message.hasOwnProperty("name"))
                            object.name = message.name;
                        if (message.mask != null && message.hasOwnProperty("mask"))
                            object.mask = $root.google.firestore.v1.DocumentMask.toObject(message.mask, options);
                        if (message.transaction != null && message.hasOwnProperty("transaction")) {
                            object.transaction = options.bytes === String ? $util.base64.encode(message.transaction, 0, message.transaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.transaction) : message.transaction;
                            if (options.oneofs)
                                object.consistencySelector = "transaction";
                        }
                        if (message.readTime != null && message.hasOwnProperty("readTime")) {
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                            if (options.oneofs)
                                object.consistencySelector = "readTime";
                        }
                        return object;
                    };
    
                    /**
                     * Converts this GetDocumentRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.GetDocumentRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    GetDocumentRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return GetDocumentRequest;
                })();
    
                v1.ListDocumentsRequest = (function() {
    
                    /**
                     * Properties of a ListDocumentsRequest.
                     * @memberof google.firestore.v1
                     * @interface IListDocumentsRequest
                     * @property {string|null} [parent] ListDocumentsRequest parent
                     * @property {string|null} [collectionId] ListDocumentsRequest collectionId
                     * @property {number|null} [pageSize] ListDocumentsRequest pageSize
                     * @property {string|null} [pageToken] ListDocumentsRequest pageToken
                     * @property {string|null} [orderBy] ListDocumentsRequest orderBy
                     * @property {google.firestore.v1.IDocumentMask|null} [mask] ListDocumentsRequest mask
                     * @property {Uint8Array|null} [transaction] ListDocumentsRequest transaction
                     * @property {google.protobuf.ITimestamp|null} [readTime] ListDocumentsRequest readTime
                     * @property {boolean|null} [showMissing] ListDocumentsRequest showMissing
                     */
    
                    /**
                     * Constructs a new ListDocumentsRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a ListDocumentsRequest.
                     * @implements IListDocumentsRequest
                     * @constructor
                     * @param {google.firestore.v1.IListDocumentsRequest=} [properties] Properties to set
                     */
                    function ListDocumentsRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ListDocumentsRequest parent.
                     * @member {string} parent
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    ListDocumentsRequest.prototype.parent = "";
    
                    /**
                     * ListDocumentsRequest collectionId.
                     * @member {string} collectionId
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    ListDocumentsRequest.prototype.collectionId = "";
    
                    /**
                     * ListDocumentsRequest pageSize.
                     * @member {number} pageSize
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    ListDocumentsRequest.prototype.pageSize = 0;
    
                    /**
                     * ListDocumentsRequest pageToken.
                     * @member {string} pageToken
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    ListDocumentsRequest.prototype.pageToken = "";
    
                    /**
                     * ListDocumentsRequest orderBy.
                     * @member {string} orderBy
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    ListDocumentsRequest.prototype.orderBy = "";
    
                    /**
                     * ListDocumentsRequest mask.
                     * @member {google.firestore.v1.IDocumentMask|null|undefined} mask
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    ListDocumentsRequest.prototype.mask = null;
    
                    /**
                     * ListDocumentsRequest transaction.
                     * @member {Uint8Array} transaction
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    ListDocumentsRequest.prototype.transaction = $util.newBuffer([]);
    
                    /**
                     * ListDocumentsRequest readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    ListDocumentsRequest.prototype.readTime = null;
    
                    /**
                     * ListDocumentsRequest showMissing.
                     * @member {boolean} showMissing
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    ListDocumentsRequest.prototype.showMissing = false;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * ListDocumentsRequest consistencySelector.
                     * @member {"transaction"|"readTime"|undefined} consistencySelector
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     */
                    Object.defineProperty(ListDocumentsRequest.prototype, "consistencySelector", {
                        get: $util.oneOfGetter($oneOfFields = ["transaction", "readTime"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a ListDocumentsRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.ListDocumentsRequest} ListDocumentsRequest
                     */
                    ListDocumentsRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.ListDocumentsRequest)
                            return object;
                        var message = new $root.google.firestore.v1.ListDocumentsRequest();
                        if (object.parent != null)
                            message.parent = String(object.parent);
                        if (object.collectionId != null)
                            message.collectionId = String(object.collectionId);
                        if (object.pageSize != null)
                            message.pageSize = object.pageSize | 0;
                        if (object.pageToken != null)
                            message.pageToken = String(object.pageToken);
                        if (object.orderBy != null)
                            message.orderBy = String(object.orderBy);
                        if (object.mask != null) {
                            if (typeof object.mask !== "object")
                                throw TypeError(".google.firestore.v1.ListDocumentsRequest.mask: object expected");
                            message.mask = $root.google.firestore.v1.DocumentMask.fromObject(object.mask);
                        }
                        if (object.transaction != null)
                            if (typeof object.transaction === "string")
                                $util.base64.decode(object.transaction, message.transaction = $util.newBuffer($util.base64.length(object.transaction)), 0);
                            else if (object.transaction.length)
                                message.transaction = object.transaction;
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.ListDocumentsRequest.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        if (object.showMissing != null)
                            message.showMissing = Boolean(object.showMissing);
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a ListDocumentsRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @static
                     * @param {google.firestore.v1.ListDocumentsRequest} message ListDocumentsRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ListDocumentsRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.parent = "";
                            object.collectionId = "";
                            object.pageSize = 0;
                            object.pageToken = "";
                            object.orderBy = "";
                            object.mask = null;
                            object.showMissing = false;
                        }
                        if (message.parent != null && message.hasOwnProperty("parent"))
                            object.parent = message.parent;
                        if (message.collectionId != null && message.hasOwnProperty("collectionId"))
                            object.collectionId = message.collectionId;
                        if (message.pageSize != null && message.hasOwnProperty("pageSize"))
                            object.pageSize = message.pageSize;
                        if (message.pageToken != null && message.hasOwnProperty("pageToken"))
                            object.pageToken = message.pageToken;
                        if (message.orderBy != null && message.hasOwnProperty("orderBy"))
                            object.orderBy = message.orderBy;
                        if (message.mask != null && message.hasOwnProperty("mask"))
                            object.mask = $root.google.firestore.v1.DocumentMask.toObject(message.mask, options);
                        if (message.transaction != null && message.hasOwnProperty("transaction")) {
                            object.transaction = options.bytes === String ? $util.base64.encode(message.transaction, 0, message.transaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.transaction) : message.transaction;
                            if (options.oneofs)
                                object.consistencySelector = "transaction";
                        }
                        if (message.readTime != null && message.hasOwnProperty("readTime")) {
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                            if (options.oneofs)
                                object.consistencySelector = "readTime";
                        }
                        if (message.showMissing != null && message.hasOwnProperty("showMissing"))
                            object.showMissing = message.showMissing;
                        return object;
                    };
    
                    /**
                     * Converts this ListDocumentsRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.ListDocumentsRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ListDocumentsRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ListDocumentsRequest;
                })();
    
                v1.ListDocumentsResponse = (function() {
    
                    /**
                     * Properties of a ListDocumentsResponse.
                     * @memberof google.firestore.v1
                     * @interface IListDocumentsResponse
                     * @property {Array.<google.firestore.v1.IDocument>|null} [documents] ListDocumentsResponse documents
                     * @property {string|null} [nextPageToken] ListDocumentsResponse nextPageToken
                     */
    
                    /**
                     * Constructs a new ListDocumentsResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a ListDocumentsResponse.
                     * @implements IListDocumentsResponse
                     * @constructor
                     * @param {google.firestore.v1.IListDocumentsResponse=} [properties] Properties to set
                     */
                    function ListDocumentsResponse(properties) {
                        this.documents = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ListDocumentsResponse documents.
                     * @member {Array.<google.firestore.v1.IDocument>} documents
                     * @memberof google.firestore.v1.ListDocumentsResponse
                     * @instance
                     */
                    ListDocumentsResponse.prototype.documents = $util.emptyArray;
    
                    /**
                     * ListDocumentsResponse nextPageToken.
                     * @member {string} nextPageToken
                     * @memberof google.firestore.v1.ListDocumentsResponse
                     * @instance
                     */
                    ListDocumentsResponse.prototype.nextPageToken = "";
    
                    /**
                     * Creates a ListDocumentsResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.ListDocumentsResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.ListDocumentsResponse} ListDocumentsResponse
                     */
                    ListDocumentsResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.ListDocumentsResponse)
                            return object;
                        var message = new $root.google.firestore.v1.ListDocumentsResponse();
                        if (object.documents) {
                            if (!Array.isArray(object.documents))
                                throw TypeError(".google.firestore.v1.ListDocumentsResponse.documents: array expected");
                            message.documents = [];
                            for (var i = 0; i < object.documents.length; ++i) {
                                if (typeof object.documents[i] !== "object")
                                    throw TypeError(".google.firestore.v1.ListDocumentsResponse.documents: object expected");
                                message.documents[i] = $root.google.firestore.v1.Document.fromObject(object.documents[i]);
                            }
                        }
                        if (object.nextPageToken != null)
                            message.nextPageToken = String(object.nextPageToken);
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a ListDocumentsResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.ListDocumentsResponse
                     * @static
                     * @param {google.firestore.v1.ListDocumentsResponse} message ListDocumentsResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ListDocumentsResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.documents = [];
                        if (options.defaults)
                            object.nextPageToken = "";
                        if (message.documents && message.documents.length) {
                            object.documents = [];
                            for (var j = 0; j < message.documents.length; ++j)
                                object.documents[j] = $root.google.firestore.v1.Document.toObject(message.documents[j], options);
                        }
                        if (message.nextPageToken != null && message.hasOwnProperty("nextPageToken"))
                            object.nextPageToken = message.nextPageToken;
                        return object;
                    };
    
                    /**
                     * Converts this ListDocumentsResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.ListDocumentsResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ListDocumentsResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ListDocumentsResponse;
                })();
    
                v1.CreateDocumentRequest = (function() {
    
                    /**
                     * Properties of a CreateDocumentRequest.
                     * @memberof google.firestore.v1
                     * @interface ICreateDocumentRequest
                     * @property {string|null} [parent] CreateDocumentRequest parent
                     * @property {string|null} [collectionId] CreateDocumentRequest collectionId
                     * @property {string|null} [documentId] CreateDocumentRequest documentId
                     * @property {google.firestore.v1.IDocument|null} [document] CreateDocumentRequest document
                     * @property {google.firestore.v1.IDocumentMask|null} [mask] CreateDocumentRequest mask
                     */
    
                    /**
                     * Constructs a new CreateDocumentRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a CreateDocumentRequest.
                     * @implements ICreateDocumentRequest
                     * @constructor
                     * @param {google.firestore.v1.ICreateDocumentRequest=} [properties] Properties to set
                     */
                    function CreateDocumentRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * CreateDocumentRequest parent.
                     * @member {string} parent
                     * @memberof google.firestore.v1.CreateDocumentRequest
                     * @instance
                     */
                    CreateDocumentRequest.prototype.parent = "";
    
                    /**
                     * CreateDocumentRequest collectionId.
                     * @member {string} collectionId
                     * @memberof google.firestore.v1.CreateDocumentRequest
                     * @instance
                     */
                    CreateDocumentRequest.prototype.collectionId = "";
    
                    /**
                     * CreateDocumentRequest documentId.
                     * @member {string} documentId
                     * @memberof google.firestore.v1.CreateDocumentRequest
                     * @instance
                     */
                    CreateDocumentRequest.prototype.documentId = "";
    
                    /**
                     * CreateDocumentRequest document.
                     * @member {google.firestore.v1.IDocument|null|undefined} document
                     * @memberof google.firestore.v1.CreateDocumentRequest
                     * @instance
                     */
                    CreateDocumentRequest.prototype.document = null;
    
                    /**
                     * CreateDocumentRequest mask.
                     * @member {google.firestore.v1.IDocumentMask|null|undefined} mask
                     * @memberof google.firestore.v1.CreateDocumentRequest
                     * @instance
                     */
                    CreateDocumentRequest.prototype.mask = null;
    
                    /**
                     * Creates a CreateDocumentRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.CreateDocumentRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.CreateDocumentRequest} CreateDocumentRequest
                     */
                    CreateDocumentRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.CreateDocumentRequest)
                            return object;
                        var message = new $root.google.firestore.v1.CreateDocumentRequest();
                        if (object.parent != null)
                            message.parent = String(object.parent);
                        if (object.collectionId != null)
                            message.collectionId = String(object.collectionId);
                        if (object.documentId != null)
                            message.documentId = String(object.documentId);
                        if (object.document != null) {
                            if (typeof object.document !== "object")
                                throw TypeError(".google.firestore.v1.CreateDocumentRequest.document: object expected");
                            message.document = $root.google.firestore.v1.Document.fromObject(object.document);
                        }
                        if (object.mask != null) {
                            if (typeof object.mask !== "object")
                                throw TypeError(".google.firestore.v1.CreateDocumentRequest.mask: object expected");
                            message.mask = $root.google.firestore.v1.DocumentMask.fromObject(object.mask);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a CreateDocumentRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.CreateDocumentRequest
                     * @static
                     * @param {google.firestore.v1.CreateDocumentRequest} message CreateDocumentRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    CreateDocumentRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.parent = "";
                            object.collectionId = "";
                            object.documentId = "";
                            object.document = null;
                            object.mask = null;
                        }
                        if (message.parent != null && message.hasOwnProperty("parent"))
                            object.parent = message.parent;
                        if (message.collectionId != null && message.hasOwnProperty("collectionId"))
                            object.collectionId = message.collectionId;
                        if (message.documentId != null && message.hasOwnProperty("documentId"))
                            object.documentId = message.documentId;
                        if (message.document != null && message.hasOwnProperty("document"))
                            object.document = $root.google.firestore.v1.Document.toObject(message.document, options);
                        if (message.mask != null && message.hasOwnProperty("mask"))
                            object.mask = $root.google.firestore.v1.DocumentMask.toObject(message.mask, options);
                        return object;
                    };
    
                    /**
                     * Converts this CreateDocumentRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.CreateDocumentRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    CreateDocumentRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return CreateDocumentRequest;
                })();
    
                v1.UpdateDocumentRequest = (function() {
    
                    /**
                     * Properties of an UpdateDocumentRequest.
                     * @memberof google.firestore.v1
                     * @interface IUpdateDocumentRequest
                     * @property {google.firestore.v1.IDocument|null} [document] UpdateDocumentRequest document
                     * @property {google.firestore.v1.IDocumentMask|null} [updateMask] UpdateDocumentRequest updateMask
                     * @property {google.firestore.v1.IDocumentMask|null} [mask] UpdateDocumentRequest mask
                     * @property {google.firestore.v1.IPrecondition|null} [currentDocument] UpdateDocumentRequest currentDocument
                     */
    
                    /**
                     * Constructs a new UpdateDocumentRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents an UpdateDocumentRequest.
                     * @implements IUpdateDocumentRequest
                     * @constructor
                     * @param {google.firestore.v1.IUpdateDocumentRequest=} [properties] Properties to set
                     */
                    function UpdateDocumentRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * UpdateDocumentRequest document.
                     * @member {google.firestore.v1.IDocument|null|undefined} document
                     * @memberof google.firestore.v1.UpdateDocumentRequest
                     * @instance
                     */
                    UpdateDocumentRequest.prototype.document = null;
    
                    /**
                     * UpdateDocumentRequest updateMask.
                     * @member {google.firestore.v1.IDocumentMask|null|undefined} updateMask
                     * @memberof google.firestore.v1.UpdateDocumentRequest
                     * @instance
                     */
                    UpdateDocumentRequest.prototype.updateMask = null;
    
                    /**
                     * UpdateDocumentRequest mask.
                     * @member {google.firestore.v1.IDocumentMask|null|undefined} mask
                     * @memberof google.firestore.v1.UpdateDocumentRequest
                     * @instance
                     */
                    UpdateDocumentRequest.prototype.mask = null;
    
                    /**
                     * UpdateDocumentRequest currentDocument.
                     * @member {google.firestore.v1.IPrecondition|null|undefined} currentDocument
                     * @memberof google.firestore.v1.UpdateDocumentRequest
                     * @instance
                     */
                    UpdateDocumentRequest.prototype.currentDocument = null;
    
                    /**
                     * Creates an UpdateDocumentRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.UpdateDocumentRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.UpdateDocumentRequest} UpdateDocumentRequest
                     */
                    UpdateDocumentRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.UpdateDocumentRequest)
                            return object;
                        var message = new $root.google.firestore.v1.UpdateDocumentRequest();
                        if (object.document != null) {
                            if (typeof object.document !== "object")
                                throw TypeError(".google.firestore.v1.UpdateDocumentRequest.document: object expected");
                            message.document = $root.google.firestore.v1.Document.fromObject(object.document);
                        }
                        if (object.updateMask != null) {
                            if (typeof object.updateMask !== "object")
                                throw TypeError(".google.firestore.v1.UpdateDocumentRequest.updateMask: object expected");
                            message.updateMask = $root.google.firestore.v1.DocumentMask.fromObject(object.updateMask);
                        }
                        if (object.mask != null) {
                            if (typeof object.mask !== "object")
                                throw TypeError(".google.firestore.v1.UpdateDocumentRequest.mask: object expected");
                            message.mask = $root.google.firestore.v1.DocumentMask.fromObject(object.mask);
                        }
                        if (object.currentDocument != null) {
                            if (typeof object.currentDocument !== "object")
                                throw TypeError(".google.firestore.v1.UpdateDocumentRequest.currentDocument: object expected");
                            message.currentDocument = $root.google.firestore.v1.Precondition.fromObject(object.currentDocument);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from an UpdateDocumentRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.UpdateDocumentRequest
                     * @static
                     * @param {google.firestore.v1.UpdateDocumentRequest} message UpdateDocumentRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    UpdateDocumentRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.document = null;
                            object.updateMask = null;
                            object.mask = null;
                            object.currentDocument = null;
                        }
                        if (message.document != null && message.hasOwnProperty("document"))
                            object.document = $root.google.firestore.v1.Document.toObject(message.document, options);
                        if (message.updateMask != null && message.hasOwnProperty("updateMask"))
                            object.updateMask = $root.google.firestore.v1.DocumentMask.toObject(message.updateMask, options);
                        if (message.mask != null && message.hasOwnProperty("mask"))
                            object.mask = $root.google.firestore.v1.DocumentMask.toObject(message.mask, options);
                        if (message.currentDocument != null && message.hasOwnProperty("currentDocument"))
                            object.currentDocument = $root.google.firestore.v1.Precondition.toObject(message.currentDocument, options);
                        return object;
                    };
    
                    /**
                     * Converts this UpdateDocumentRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.UpdateDocumentRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    UpdateDocumentRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return UpdateDocumentRequest;
                })();
    
                v1.DeleteDocumentRequest = (function() {
    
                    /**
                     * Properties of a DeleteDocumentRequest.
                     * @memberof google.firestore.v1
                     * @interface IDeleteDocumentRequest
                     * @property {string|null} [name] DeleteDocumentRequest name
                     * @property {google.firestore.v1.IPrecondition|null} [currentDocument] DeleteDocumentRequest currentDocument
                     */
    
                    /**
                     * Constructs a new DeleteDocumentRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a DeleteDocumentRequest.
                     * @implements IDeleteDocumentRequest
                     * @constructor
                     * @param {google.firestore.v1.IDeleteDocumentRequest=} [properties] Properties to set
                     */
                    function DeleteDocumentRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * DeleteDocumentRequest name.
                     * @member {string} name
                     * @memberof google.firestore.v1.DeleteDocumentRequest
                     * @instance
                     */
                    DeleteDocumentRequest.prototype.name = "";
    
                    /**
                     * DeleteDocumentRequest currentDocument.
                     * @member {google.firestore.v1.IPrecondition|null|undefined} currentDocument
                     * @memberof google.firestore.v1.DeleteDocumentRequest
                     * @instance
                     */
                    DeleteDocumentRequest.prototype.currentDocument = null;
    
                    /**
                     * Creates a DeleteDocumentRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.DeleteDocumentRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.DeleteDocumentRequest} DeleteDocumentRequest
                     */
                    DeleteDocumentRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.DeleteDocumentRequest)
                            return object;
                        var message = new $root.google.firestore.v1.DeleteDocumentRequest();
                        if (object.name != null)
                            message.name = String(object.name);
                        if (object.currentDocument != null) {
                            if (typeof object.currentDocument !== "object")
                                throw TypeError(".google.firestore.v1.DeleteDocumentRequest.currentDocument: object expected");
                            message.currentDocument = $root.google.firestore.v1.Precondition.fromObject(object.currentDocument);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a DeleteDocumentRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.DeleteDocumentRequest
                     * @static
                     * @param {google.firestore.v1.DeleteDocumentRequest} message DeleteDocumentRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    DeleteDocumentRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.name = "";
                            object.currentDocument = null;
                        }
                        if (message.name != null && message.hasOwnProperty("name"))
                            object.name = message.name;
                        if (message.currentDocument != null && message.hasOwnProperty("currentDocument"))
                            object.currentDocument = $root.google.firestore.v1.Precondition.toObject(message.currentDocument, options);
                        return object;
                    };
    
                    /**
                     * Converts this DeleteDocumentRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.DeleteDocumentRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    DeleteDocumentRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return DeleteDocumentRequest;
                })();
    
                v1.BatchGetDocumentsRequest = (function() {
    
                    /**
                     * Properties of a BatchGetDocumentsRequest.
                     * @memberof google.firestore.v1
                     * @interface IBatchGetDocumentsRequest
                     * @property {string|null} [database] BatchGetDocumentsRequest database
                     * @property {Array.<string>|null} [documents] BatchGetDocumentsRequest documents
                     * @property {google.firestore.v1.IDocumentMask|null} [mask] BatchGetDocumentsRequest mask
                     * @property {Uint8Array|null} [transaction] BatchGetDocumentsRequest transaction
                     * @property {google.firestore.v1.ITransactionOptions|null} [newTransaction] BatchGetDocumentsRequest newTransaction
                     * @property {google.protobuf.ITimestamp|null} [readTime] BatchGetDocumentsRequest readTime
                     */
    
                    /**
                     * Constructs a new BatchGetDocumentsRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a BatchGetDocumentsRequest.
                     * @implements IBatchGetDocumentsRequest
                     * @constructor
                     * @param {google.firestore.v1.IBatchGetDocumentsRequest=} [properties] Properties to set
                     */
                    function BatchGetDocumentsRequest(properties) {
                        this.documents = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * BatchGetDocumentsRequest database.
                     * @member {string} database
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @instance
                     */
                    BatchGetDocumentsRequest.prototype.database = "";
    
                    /**
                     * BatchGetDocumentsRequest documents.
                     * @member {Array.<string>} documents
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @instance
                     */
                    BatchGetDocumentsRequest.prototype.documents = $util.emptyArray;
    
                    /**
                     * BatchGetDocumentsRequest mask.
                     * @member {google.firestore.v1.IDocumentMask|null|undefined} mask
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @instance
                     */
                    BatchGetDocumentsRequest.prototype.mask = null;
    
                    /**
                     * BatchGetDocumentsRequest transaction.
                     * @member {Uint8Array} transaction
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @instance
                     */
                    BatchGetDocumentsRequest.prototype.transaction = $util.newBuffer([]);
    
                    /**
                     * BatchGetDocumentsRequest newTransaction.
                     * @member {google.firestore.v1.ITransactionOptions|null|undefined} newTransaction
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @instance
                     */
                    BatchGetDocumentsRequest.prototype.newTransaction = null;
    
                    /**
                     * BatchGetDocumentsRequest readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @instance
                     */
                    BatchGetDocumentsRequest.prototype.readTime = null;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * BatchGetDocumentsRequest consistencySelector.
                     * @member {"transaction"|"newTransaction"|"readTime"|undefined} consistencySelector
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @instance
                     */
                    Object.defineProperty(BatchGetDocumentsRequest.prototype, "consistencySelector", {
                        get: $util.oneOfGetter($oneOfFields = ["transaction", "newTransaction", "readTime"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a BatchGetDocumentsRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.BatchGetDocumentsRequest} BatchGetDocumentsRequest
                     */
                    BatchGetDocumentsRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.BatchGetDocumentsRequest)
                            return object;
                        var message = new $root.google.firestore.v1.BatchGetDocumentsRequest();
                        if (object.database != null)
                            message.database = String(object.database);
                        if (object.documents) {
                            if (!Array.isArray(object.documents))
                                throw TypeError(".google.firestore.v1.BatchGetDocumentsRequest.documents: array expected");
                            message.documents = [];
                            for (var i = 0; i < object.documents.length; ++i)
                                message.documents[i] = String(object.documents[i]);
                        }
                        if (object.mask != null) {
                            if (typeof object.mask !== "object")
                                throw TypeError(".google.firestore.v1.BatchGetDocumentsRequest.mask: object expected");
                            message.mask = $root.google.firestore.v1.DocumentMask.fromObject(object.mask);
                        }
                        if (object.transaction != null)
                            if (typeof object.transaction === "string")
                                $util.base64.decode(object.transaction, message.transaction = $util.newBuffer($util.base64.length(object.transaction)), 0);
                            else if (object.transaction.length)
                                message.transaction = object.transaction;
                        if (object.newTransaction != null) {
                            if (typeof object.newTransaction !== "object")
                                throw TypeError(".google.firestore.v1.BatchGetDocumentsRequest.newTransaction: object expected");
                            message.newTransaction = $root.google.firestore.v1.TransactionOptions.fromObject(object.newTransaction);
                        }
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.BatchGetDocumentsRequest.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a BatchGetDocumentsRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @static
                     * @param {google.firestore.v1.BatchGetDocumentsRequest} message BatchGetDocumentsRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    BatchGetDocumentsRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.documents = [];
                        if (options.defaults) {
                            object.database = "";
                            object.mask = null;
                        }
                        if (message.database != null && message.hasOwnProperty("database"))
                            object.database = message.database;
                        if (message.documents && message.documents.length) {
                            object.documents = [];
                            for (var j = 0; j < message.documents.length; ++j)
                                object.documents[j] = message.documents[j];
                        }
                        if (message.mask != null && message.hasOwnProperty("mask"))
                            object.mask = $root.google.firestore.v1.DocumentMask.toObject(message.mask, options);
                        if (message.transaction != null && message.hasOwnProperty("transaction")) {
                            object.transaction = options.bytes === String ? $util.base64.encode(message.transaction, 0, message.transaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.transaction) : message.transaction;
                            if (options.oneofs)
                                object.consistencySelector = "transaction";
                        }
                        if (message.newTransaction != null && message.hasOwnProperty("newTransaction")) {
                            object.newTransaction = $root.google.firestore.v1.TransactionOptions.toObject(message.newTransaction, options);
                            if (options.oneofs)
                                object.consistencySelector = "newTransaction";
                        }
                        if (message.readTime != null && message.hasOwnProperty("readTime")) {
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                            if (options.oneofs)
                                object.consistencySelector = "readTime";
                        }
                        return object;
                    };
    
                    /**
                     * Converts this BatchGetDocumentsRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.BatchGetDocumentsRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    BatchGetDocumentsRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return BatchGetDocumentsRequest;
                })();
    
                v1.BatchGetDocumentsResponse = (function() {
    
                    /**
                     * Properties of a BatchGetDocumentsResponse.
                     * @memberof google.firestore.v1
                     * @interface IBatchGetDocumentsResponse
                     * @property {google.firestore.v1.IDocument|null} [found] BatchGetDocumentsResponse found
                     * @property {string|null} [missing] BatchGetDocumentsResponse missing
                     * @property {Uint8Array|null} [transaction] BatchGetDocumentsResponse transaction
                     * @property {google.protobuf.ITimestamp|null} [readTime] BatchGetDocumentsResponse readTime
                     */
    
                    /**
                     * Constructs a new BatchGetDocumentsResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a BatchGetDocumentsResponse.
                     * @implements IBatchGetDocumentsResponse
                     * @constructor
                     * @param {google.firestore.v1.IBatchGetDocumentsResponse=} [properties] Properties to set
                     */
                    function BatchGetDocumentsResponse(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * BatchGetDocumentsResponse found.
                     * @member {google.firestore.v1.IDocument|null|undefined} found
                     * @memberof google.firestore.v1.BatchGetDocumentsResponse
                     * @instance
                     */
                    BatchGetDocumentsResponse.prototype.found = null;
    
                    /**
                     * BatchGetDocumentsResponse missing.
                     * @member {string} missing
                     * @memberof google.firestore.v1.BatchGetDocumentsResponse
                     * @instance
                     */
                    BatchGetDocumentsResponse.prototype.missing = "";
    
                    /**
                     * BatchGetDocumentsResponse transaction.
                     * @member {Uint8Array} transaction
                     * @memberof google.firestore.v1.BatchGetDocumentsResponse
                     * @instance
                     */
                    BatchGetDocumentsResponse.prototype.transaction = $util.newBuffer([]);
    
                    /**
                     * BatchGetDocumentsResponse readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.BatchGetDocumentsResponse
                     * @instance
                     */
                    BatchGetDocumentsResponse.prototype.readTime = null;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * BatchGetDocumentsResponse result.
                     * @member {"found"|"missing"|undefined} result
                     * @memberof google.firestore.v1.BatchGetDocumentsResponse
                     * @instance
                     */
                    Object.defineProperty(BatchGetDocumentsResponse.prototype, "result", {
                        get: $util.oneOfGetter($oneOfFields = ["found", "missing"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a BatchGetDocumentsResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.BatchGetDocumentsResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.BatchGetDocumentsResponse} BatchGetDocumentsResponse
                     */
                    BatchGetDocumentsResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.BatchGetDocumentsResponse)
                            return object;
                        var message = new $root.google.firestore.v1.BatchGetDocumentsResponse();
                        if (object.found != null) {
                            if (typeof object.found !== "object")
                                throw TypeError(".google.firestore.v1.BatchGetDocumentsResponse.found: object expected");
                            message.found = $root.google.firestore.v1.Document.fromObject(object.found);
                        }
                        if (object.missing != null)
                            message.missing = String(object.missing);
                        if (object.transaction != null)
                            if (typeof object.transaction === "string")
                                $util.base64.decode(object.transaction, message.transaction = $util.newBuffer($util.base64.length(object.transaction)), 0);
                            else if (object.transaction.length)
                                message.transaction = object.transaction;
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.BatchGetDocumentsResponse.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a BatchGetDocumentsResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.BatchGetDocumentsResponse
                     * @static
                     * @param {google.firestore.v1.BatchGetDocumentsResponse} message BatchGetDocumentsResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    BatchGetDocumentsResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            if (options.bytes === String)
                                object.transaction = "";
                            else {
                                object.transaction = [];
                                if (options.bytes !== Array)
                                    object.transaction = $util.newBuffer(object.transaction);
                            }
                            object.readTime = null;
                        }
                        if (message.found != null && message.hasOwnProperty("found")) {
                            object.found = $root.google.firestore.v1.Document.toObject(message.found, options);
                            if (options.oneofs)
                                object.result = "found";
                        }
                        if (message.missing != null && message.hasOwnProperty("missing")) {
                            object.missing = message.missing;
                            if (options.oneofs)
                                object.result = "missing";
                        }
                        if (message.transaction != null && message.hasOwnProperty("transaction"))
                            object.transaction = options.bytes === String ? $util.base64.encode(message.transaction, 0, message.transaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.transaction) : message.transaction;
                        if (message.readTime != null && message.hasOwnProperty("readTime"))
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                        return object;
                    };
    
                    /**
                     * Converts this BatchGetDocumentsResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.BatchGetDocumentsResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    BatchGetDocumentsResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return BatchGetDocumentsResponse;
                })();
    
                v1.BeginTransactionRequest = (function() {
    
                    /**
                     * Properties of a BeginTransactionRequest.
                     * @memberof google.firestore.v1
                     * @interface IBeginTransactionRequest
                     * @property {string|null} [database] BeginTransactionRequest database
                     * @property {google.firestore.v1.ITransactionOptions|null} [options] BeginTransactionRequest options
                     */
    
                    /**
                     * Constructs a new BeginTransactionRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a BeginTransactionRequest.
                     * @implements IBeginTransactionRequest
                     * @constructor
                     * @param {google.firestore.v1.IBeginTransactionRequest=} [properties] Properties to set
                     */
                    function BeginTransactionRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * BeginTransactionRequest database.
                     * @member {string} database
                     * @memberof google.firestore.v1.BeginTransactionRequest
                     * @instance
                     */
                    BeginTransactionRequest.prototype.database = "";
    
                    /**
                     * BeginTransactionRequest options.
                     * @member {google.firestore.v1.ITransactionOptions|null|undefined} options
                     * @memberof google.firestore.v1.BeginTransactionRequest
                     * @instance
                     */
                    BeginTransactionRequest.prototype.options = null;
    
                    /**
                     * Creates a BeginTransactionRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.BeginTransactionRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.BeginTransactionRequest} BeginTransactionRequest
                     */
                    BeginTransactionRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.BeginTransactionRequest)
                            return object;
                        var message = new $root.google.firestore.v1.BeginTransactionRequest();
                        if (object.database != null)
                            message.database = String(object.database);
                        if (object.options != null) {
                            if (typeof object.options !== "object")
                                throw TypeError(".google.firestore.v1.BeginTransactionRequest.options: object expected");
                            message.options = $root.google.firestore.v1.TransactionOptions.fromObject(object.options);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a BeginTransactionRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.BeginTransactionRequest
                     * @static
                     * @param {google.firestore.v1.BeginTransactionRequest} message BeginTransactionRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    BeginTransactionRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.database = "";
                            object.options = null;
                        }
                        if (message.database != null && message.hasOwnProperty("database"))
                            object.database = message.database;
                        if (message.options != null && message.hasOwnProperty("options"))
                            object.options = $root.google.firestore.v1.TransactionOptions.toObject(message.options, options);
                        return object;
                    };
    
                    /**
                     * Converts this BeginTransactionRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.BeginTransactionRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    BeginTransactionRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return BeginTransactionRequest;
                })();
    
                v1.BeginTransactionResponse = (function() {
    
                    /**
                     * Properties of a BeginTransactionResponse.
                     * @memberof google.firestore.v1
                     * @interface IBeginTransactionResponse
                     * @property {Uint8Array|null} [transaction] BeginTransactionResponse transaction
                     */
    
                    /**
                     * Constructs a new BeginTransactionResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a BeginTransactionResponse.
                     * @implements IBeginTransactionResponse
                     * @constructor
                     * @param {google.firestore.v1.IBeginTransactionResponse=} [properties] Properties to set
                     */
                    function BeginTransactionResponse(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * BeginTransactionResponse transaction.
                     * @member {Uint8Array} transaction
                     * @memberof google.firestore.v1.BeginTransactionResponse
                     * @instance
                     */
                    BeginTransactionResponse.prototype.transaction = $util.newBuffer([]);
    
                    /**
                     * Creates a BeginTransactionResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.BeginTransactionResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.BeginTransactionResponse} BeginTransactionResponse
                     */
                    BeginTransactionResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.BeginTransactionResponse)
                            return object;
                        var message = new $root.google.firestore.v1.BeginTransactionResponse();
                        if (object.transaction != null)
                            if (typeof object.transaction === "string")
                                $util.base64.decode(object.transaction, message.transaction = $util.newBuffer($util.base64.length(object.transaction)), 0);
                            else if (object.transaction.length)
                                message.transaction = object.transaction;
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a BeginTransactionResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.BeginTransactionResponse
                     * @static
                     * @param {google.firestore.v1.BeginTransactionResponse} message BeginTransactionResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    BeginTransactionResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults)
                            if (options.bytes === String)
                                object.transaction = "";
                            else {
                                object.transaction = [];
                                if (options.bytes !== Array)
                                    object.transaction = $util.newBuffer(object.transaction);
                            }
                        if (message.transaction != null && message.hasOwnProperty("transaction"))
                            object.transaction = options.bytes === String ? $util.base64.encode(message.transaction, 0, message.transaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.transaction) : message.transaction;
                        return object;
                    };
    
                    /**
                     * Converts this BeginTransactionResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.BeginTransactionResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    BeginTransactionResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return BeginTransactionResponse;
                })();
    
                v1.CommitRequest = (function() {
    
                    /**
                     * Properties of a CommitRequest.
                     * @memberof google.firestore.v1
                     * @interface ICommitRequest
                     * @property {string|null} [database] CommitRequest database
                     * @property {Array.<google.firestore.v1.IWrite>|null} [writes] CommitRequest writes
                     * @property {Uint8Array|null} [transaction] CommitRequest transaction
                     */
    
                    /**
                     * Constructs a new CommitRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a CommitRequest.
                     * @implements ICommitRequest
                     * @constructor
                     * @param {google.firestore.v1.ICommitRequest=} [properties] Properties to set
                     */
                    function CommitRequest(properties) {
                        this.writes = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * CommitRequest database.
                     * @member {string} database
                     * @memberof google.firestore.v1.CommitRequest
                     * @instance
                     */
                    CommitRequest.prototype.database = "";
    
                    /**
                     * CommitRequest writes.
                     * @member {Array.<google.firestore.v1.IWrite>} writes
                     * @memberof google.firestore.v1.CommitRequest
                     * @instance
                     */
                    CommitRequest.prototype.writes = $util.emptyArray;
    
                    /**
                     * CommitRequest transaction.
                     * @member {Uint8Array} transaction
                     * @memberof google.firestore.v1.CommitRequest
                     * @instance
                     */
                    CommitRequest.prototype.transaction = $util.newBuffer([]);
    
                    /**
                     * Creates a CommitRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.CommitRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.CommitRequest} CommitRequest
                     */
                    CommitRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.CommitRequest)
                            return object;
                        var message = new $root.google.firestore.v1.CommitRequest();
                        if (object.database != null)
                            message.database = String(object.database);
                        if (object.writes) {
                            if (!Array.isArray(object.writes))
                                throw TypeError(".google.firestore.v1.CommitRequest.writes: array expected");
                            message.writes = [];
                            for (var i = 0; i < object.writes.length; ++i) {
                                if (typeof object.writes[i] !== "object")
                                    throw TypeError(".google.firestore.v1.CommitRequest.writes: object expected");
                                message.writes[i] = $root.google.firestore.v1.Write.fromObject(object.writes[i]);
                            }
                        }
                        if (object.transaction != null)
                            if (typeof object.transaction === "string")
                                $util.base64.decode(object.transaction, message.transaction = $util.newBuffer($util.base64.length(object.transaction)), 0);
                            else if (object.transaction.length)
                                message.transaction = object.transaction;
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a CommitRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.CommitRequest
                     * @static
                     * @param {google.firestore.v1.CommitRequest} message CommitRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    CommitRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.writes = [];
                        if (options.defaults) {
                            object.database = "";
                            if (options.bytes === String)
                                object.transaction = "";
                            else {
                                object.transaction = [];
                                if (options.bytes !== Array)
                                    object.transaction = $util.newBuffer(object.transaction);
                            }
                        }
                        if (message.database != null && message.hasOwnProperty("database"))
                            object.database = message.database;
                        if (message.writes && message.writes.length) {
                            object.writes = [];
                            for (var j = 0; j < message.writes.length; ++j)
                                object.writes[j] = $root.google.firestore.v1.Write.toObject(message.writes[j], options);
                        }
                        if (message.transaction != null && message.hasOwnProperty("transaction"))
                            object.transaction = options.bytes === String ? $util.base64.encode(message.transaction, 0, message.transaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.transaction) : message.transaction;
                        return object;
                    };
    
                    /**
                     * Converts this CommitRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.CommitRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    CommitRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return CommitRequest;
                })();
    
                v1.CommitResponse = (function() {
    
                    /**
                     * Properties of a CommitResponse.
                     * @memberof google.firestore.v1
                     * @interface ICommitResponse
                     * @property {Array.<google.firestore.v1.IWriteResult>|null} [writeResults] CommitResponse writeResults
                     * @property {google.protobuf.ITimestamp|null} [commitTime] CommitResponse commitTime
                     */
    
                    /**
                     * Constructs a new CommitResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a CommitResponse.
                     * @implements ICommitResponse
                     * @constructor
                     * @param {google.firestore.v1.ICommitResponse=} [properties] Properties to set
                     */
                    function CommitResponse(properties) {
                        this.writeResults = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * CommitResponse writeResults.
                     * @member {Array.<google.firestore.v1.IWriteResult>} writeResults
                     * @memberof google.firestore.v1.CommitResponse
                     * @instance
                     */
                    CommitResponse.prototype.writeResults = $util.emptyArray;
    
                    /**
                     * CommitResponse commitTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} commitTime
                     * @memberof google.firestore.v1.CommitResponse
                     * @instance
                     */
                    CommitResponse.prototype.commitTime = null;
    
                    /**
                     * Creates a CommitResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.CommitResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.CommitResponse} CommitResponse
                     */
                    CommitResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.CommitResponse)
                            return object;
                        var message = new $root.google.firestore.v1.CommitResponse();
                        if (object.writeResults) {
                            if (!Array.isArray(object.writeResults))
                                throw TypeError(".google.firestore.v1.CommitResponse.writeResults: array expected");
                            message.writeResults = [];
                            for (var i = 0; i < object.writeResults.length; ++i) {
                                if (typeof object.writeResults[i] !== "object")
                                    throw TypeError(".google.firestore.v1.CommitResponse.writeResults: object expected");
                                message.writeResults[i] = $root.google.firestore.v1.WriteResult.fromObject(object.writeResults[i]);
                            }
                        }
                        if (object.commitTime != null) {
                            if (typeof object.commitTime !== "object")
                                throw TypeError(".google.firestore.v1.CommitResponse.commitTime: object expected");
                            message.commitTime = $root.google.protobuf.Timestamp.fromObject(object.commitTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a CommitResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.CommitResponse
                     * @static
                     * @param {google.firestore.v1.CommitResponse} message CommitResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    CommitResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.writeResults = [];
                        if (options.defaults)
                            object.commitTime = null;
                        if (message.writeResults && message.writeResults.length) {
                            object.writeResults = [];
                            for (var j = 0; j < message.writeResults.length; ++j)
                                object.writeResults[j] = $root.google.firestore.v1.WriteResult.toObject(message.writeResults[j], options);
                        }
                        if (message.commitTime != null && message.hasOwnProperty("commitTime"))
                            object.commitTime = $root.google.protobuf.Timestamp.toObject(message.commitTime, options);
                        return object;
                    };
    
                    /**
                     * Converts this CommitResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.CommitResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    CommitResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return CommitResponse;
                })();
    
                v1.RollbackRequest = (function() {
    
                    /**
                     * Properties of a RollbackRequest.
                     * @memberof google.firestore.v1
                     * @interface IRollbackRequest
                     * @property {string|null} [database] RollbackRequest database
                     * @property {Uint8Array|null} [transaction] RollbackRequest transaction
                     */
    
                    /**
                     * Constructs a new RollbackRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a RollbackRequest.
                     * @implements IRollbackRequest
                     * @constructor
                     * @param {google.firestore.v1.IRollbackRequest=} [properties] Properties to set
                     */
                    function RollbackRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * RollbackRequest database.
                     * @member {string} database
                     * @memberof google.firestore.v1.RollbackRequest
                     * @instance
                     */
                    RollbackRequest.prototype.database = "";
    
                    /**
                     * RollbackRequest transaction.
                     * @member {Uint8Array} transaction
                     * @memberof google.firestore.v1.RollbackRequest
                     * @instance
                     */
                    RollbackRequest.prototype.transaction = $util.newBuffer([]);
    
                    /**
                     * Creates a RollbackRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.RollbackRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.RollbackRequest} RollbackRequest
                     */
                    RollbackRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.RollbackRequest)
                            return object;
                        var message = new $root.google.firestore.v1.RollbackRequest();
                        if (object.database != null)
                            message.database = String(object.database);
                        if (object.transaction != null)
                            if (typeof object.transaction === "string")
                                $util.base64.decode(object.transaction, message.transaction = $util.newBuffer($util.base64.length(object.transaction)), 0);
                            else if (object.transaction.length)
                                message.transaction = object.transaction;
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a RollbackRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.RollbackRequest
                     * @static
                     * @param {google.firestore.v1.RollbackRequest} message RollbackRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    RollbackRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.database = "";
                            if (options.bytes === String)
                                object.transaction = "";
                            else {
                                object.transaction = [];
                                if (options.bytes !== Array)
                                    object.transaction = $util.newBuffer(object.transaction);
                            }
                        }
                        if (message.database != null && message.hasOwnProperty("database"))
                            object.database = message.database;
                        if (message.transaction != null && message.hasOwnProperty("transaction"))
                            object.transaction = options.bytes === String ? $util.base64.encode(message.transaction, 0, message.transaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.transaction) : message.transaction;
                        return object;
                    };
    
                    /**
                     * Converts this RollbackRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.RollbackRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    RollbackRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return RollbackRequest;
                })();
    
                v1.RunQueryRequest = (function() {
    
                    /**
                     * Properties of a RunQueryRequest.
                     * @memberof google.firestore.v1
                     * @interface IRunQueryRequest
                     * @property {string|null} [parent] RunQueryRequest parent
                     * @property {google.firestore.v1.IStructuredQuery|null} [structuredQuery] RunQueryRequest structuredQuery
                     * @property {Uint8Array|null} [transaction] RunQueryRequest transaction
                     * @property {google.firestore.v1.ITransactionOptions|null} [newTransaction] RunQueryRequest newTransaction
                     * @property {google.protobuf.ITimestamp|null} [readTime] RunQueryRequest readTime
                     */
    
                    /**
                     * Constructs a new RunQueryRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a RunQueryRequest.
                     * @implements IRunQueryRequest
                     * @constructor
                     * @param {google.firestore.v1.IRunQueryRequest=} [properties] Properties to set
                     */
                    function RunQueryRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * RunQueryRequest parent.
                     * @member {string} parent
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @instance
                     */
                    RunQueryRequest.prototype.parent = "";
    
                    /**
                     * RunQueryRequest structuredQuery.
                     * @member {google.firestore.v1.IStructuredQuery|null|undefined} structuredQuery
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @instance
                     */
                    RunQueryRequest.prototype.structuredQuery = null;
    
                    /**
                     * RunQueryRequest transaction.
                     * @member {Uint8Array} transaction
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @instance
                     */
                    RunQueryRequest.prototype.transaction = $util.newBuffer([]);
    
                    /**
                     * RunQueryRequest newTransaction.
                     * @member {google.firestore.v1.ITransactionOptions|null|undefined} newTransaction
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @instance
                     */
                    RunQueryRequest.prototype.newTransaction = null;
    
                    /**
                     * RunQueryRequest readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @instance
                     */
                    RunQueryRequest.prototype.readTime = null;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * RunQueryRequest queryType.
                     * @member {"structuredQuery"|undefined} queryType
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @instance
                     */
                    Object.defineProperty(RunQueryRequest.prototype, "queryType", {
                        get: $util.oneOfGetter($oneOfFields = ["structuredQuery"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * RunQueryRequest consistencySelector.
                     * @member {"transaction"|"newTransaction"|"readTime"|undefined} consistencySelector
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @instance
                     */
                    Object.defineProperty(RunQueryRequest.prototype, "consistencySelector", {
                        get: $util.oneOfGetter($oneOfFields = ["transaction", "newTransaction", "readTime"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a RunQueryRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.RunQueryRequest} RunQueryRequest
                     */
                    RunQueryRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.RunQueryRequest)
                            return object;
                        var message = new $root.google.firestore.v1.RunQueryRequest();
                        if (object.parent != null)
                            message.parent = String(object.parent);
                        if (object.structuredQuery != null) {
                            if (typeof object.structuredQuery !== "object")
                                throw TypeError(".google.firestore.v1.RunQueryRequest.structuredQuery: object expected");
                            message.structuredQuery = $root.google.firestore.v1.StructuredQuery.fromObject(object.structuredQuery);
                        }
                        if (object.transaction != null)
                            if (typeof object.transaction === "string")
                                $util.base64.decode(object.transaction, message.transaction = $util.newBuffer($util.base64.length(object.transaction)), 0);
                            else if (object.transaction.length)
                                message.transaction = object.transaction;
                        if (object.newTransaction != null) {
                            if (typeof object.newTransaction !== "object")
                                throw TypeError(".google.firestore.v1.RunQueryRequest.newTransaction: object expected");
                            message.newTransaction = $root.google.firestore.v1.TransactionOptions.fromObject(object.newTransaction);
                        }
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.RunQueryRequest.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a RunQueryRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @static
                     * @param {google.firestore.v1.RunQueryRequest} message RunQueryRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    RunQueryRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults)
                            object.parent = "";
                        if (message.parent != null && message.hasOwnProperty("parent"))
                            object.parent = message.parent;
                        if (message.structuredQuery != null && message.hasOwnProperty("structuredQuery")) {
                            object.structuredQuery = $root.google.firestore.v1.StructuredQuery.toObject(message.structuredQuery, options);
                            if (options.oneofs)
                                object.queryType = "structuredQuery";
                        }
                        if (message.transaction != null && message.hasOwnProperty("transaction")) {
                            object.transaction = options.bytes === String ? $util.base64.encode(message.transaction, 0, message.transaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.transaction) : message.transaction;
                            if (options.oneofs)
                                object.consistencySelector = "transaction";
                        }
                        if (message.newTransaction != null && message.hasOwnProperty("newTransaction")) {
                            object.newTransaction = $root.google.firestore.v1.TransactionOptions.toObject(message.newTransaction, options);
                            if (options.oneofs)
                                object.consistencySelector = "newTransaction";
                        }
                        if (message.readTime != null && message.hasOwnProperty("readTime")) {
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                            if (options.oneofs)
                                object.consistencySelector = "readTime";
                        }
                        return object;
                    };
    
                    /**
                     * Converts this RunQueryRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.RunQueryRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    RunQueryRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return RunQueryRequest;
                })();
    
                v1.RunQueryResponse = (function() {
    
                    /**
                     * Properties of a RunQueryResponse.
                     * @memberof google.firestore.v1
                     * @interface IRunQueryResponse
                     * @property {Uint8Array|null} [transaction] RunQueryResponse transaction
                     * @property {google.firestore.v1.IDocument|null} [document] RunQueryResponse document
                     * @property {google.protobuf.ITimestamp|null} [readTime] RunQueryResponse readTime
                     * @property {number|null} [skippedResults] RunQueryResponse skippedResults
                     */
    
                    /**
                     * Constructs a new RunQueryResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a RunQueryResponse.
                     * @implements IRunQueryResponse
                     * @constructor
                     * @param {google.firestore.v1.IRunQueryResponse=} [properties] Properties to set
                     */
                    function RunQueryResponse(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * RunQueryResponse transaction.
                     * @member {Uint8Array} transaction
                     * @memberof google.firestore.v1.RunQueryResponse
                     * @instance
                     */
                    RunQueryResponse.prototype.transaction = $util.newBuffer([]);
    
                    /**
                     * RunQueryResponse document.
                     * @member {google.firestore.v1.IDocument|null|undefined} document
                     * @memberof google.firestore.v1.RunQueryResponse
                     * @instance
                     */
                    RunQueryResponse.prototype.document = null;
    
                    /**
                     * RunQueryResponse readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.RunQueryResponse
                     * @instance
                     */
                    RunQueryResponse.prototype.readTime = null;
    
                    /**
                     * RunQueryResponse skippedResults.
                     * @member {number} skippedResults
                     * @memberof google.firestore.v1.RunQueryResponse
                     * @instance
                     */
                    RunQueryResponse.prototype.skippedResults = 0;
    
                    /**
                     * Creates a RunQueryResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.RunQueryResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.RunQueryResponse} RunQueryResponse
                     */
                    RunQueryResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.RunQueryResponse)
                            return object;
                        var message = new $root.google.firestore.v1.RunQueryResponse();
                        if (object.transaction != null)
                            if (typeof object.transaction === "string")
                                $util.base64.decode(object.transaction, message.transaction = $util.newBuffer($util.base64.length(object.transaction)), 0);
                            else if (object.transaction.length)
                                message.transaction = object.transaction;
                        if (object.document != null) {
                            if (typeof object.document !== "object")
                                throw TypeError(".google.firestore.v1.RunQueryResponse.document: object expected");
                            message.document = $root.google.firestore.v1.Document.fromObject(object.document);
                        }
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.RunQueryResponse.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        if (object.skippedResults != null)
                            message.skippedResults = object.skippedResults | 0;
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a RunQueryResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.RunQueryResponse
                     * @static
                     * @param {google.firestore.v1.RunQueryResponse} message RunQueryResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    RunQueryResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.document = null;
                            if (options.bytes === String)
                                object.transaction = "";
                            else {
                                object.transaction = [];
                                if (options.bytes !== Array)
                                    object.transaction = $util.newBuffer(object.transaction);
                            }
                            object.readTime = null;
                            object.skippedResults = 0;
                        }
                        if (message.document != null && message.hasOwnProperty("document"))
                            object.document = $root.google.firestore.v1.Document.toObject(message.document, options);
                        if (message.transaction != null && message.hasOwnProperty("transaction"))
                            object.transaction = options.bytes === String ? $util.base64.encode(message.transaction, 0, message.transaction.length) : options.bytes === Array ? Array.prototype.slice.call(message.transaction) : message.transaction;
                        if (message.readTime != null && message.hasOwnProperty("readTime"))
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                        if (message.skippedResults != null && message.hasOwnProperty("skippedResults"))
                            object.skippedResults = message.skippedResults;
                        return object;
                    };
    
                    /**
                     * Converts this RunQueryResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.RunQueryResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    RunQueryResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return RunQueryResponse;
                })();
    
                v1.PartitionQueryRequest = (function() {
    
                    /**
                     * Properties of a PartitionQueryRequest.
                     * @memberof google.firestore.v1
                     * @interface IPartitionQueryRequest
                     * @property {string|null} [parent] PartitionQueryRequest parent
                     * @property {google.firestore.v1.IStructuredQuery|null} [structuredQuery] PartitionQueryRequest structuredQuery
                     * @property {number|string|null} [partitionCount] PartitionQueryRequest partitionCount
                     * @property {string|null} [pageToken] PartitionQueryRequest pageToken
                     * @property {number|null} [pageSize] PartitionQueryRequest pageSize
                     */
    
                    /**
                     * Constructs a new PartitionQueryRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a PartitionQueryRequest.
                     * @implements IPartitionQueryRequest
                     * @constructor
                     * @param {google.firestore.v1.IPartitionQueryRequest=} [properties] Properties to set
                     */
                    function PartitionQueryRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * PartitionQueryRequest parent.
                     * @member {string} parent
                     * @memberof google.firestore.v1.PartitionQueryRequest
                     * @instance
                     */
                    PartitionQueryRequest.prototype.parent = "";
    
                    /**
                     * PartitionQueryRequest structuredQuery.
                     * @member {google.firestore.v1.IStructuredQuery|null|undefined} structuredQuery
                     * @memberof google.firestore.v1.PartitionQueryRequest
                     * @instance
                     */
                    PartitionQueryRequest.prototype.structuredQuery = null;
    
                    /**
                     * PartitionQueryRequest partitionCount.
                     * @member {number|string} partitionCount
                     * @memberof google.firestore.v1.PartitionQueryRequest
                     * @instance
                     */
                    PartitionQueryRequest.prototype.partitionCount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
    
                    /**
                     * PartitionQueryRequest pageToken.
                     * @member {string} pageToken
                     * @memberof google.firestore.v1.PartitionQueryRequest
                     * @instance
                     */
                    PartitionQueryRequest.prototype.pageToken = "";
    
                    /**
                     * PartitionQueryRequest pageSize.
                     * @member {number} pageSize
                     * @memberof google.firestore.v1.PartitionQueryRequest
                     * @instance
                     */
                    PartitionQueryRequest.prototype.pageSize = 0;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * PartitionQueryRequest queryType.
                     * @member {"structuredQuery"|undefined} queryType
                     * @memberof google.firestore.v1.PartitionQueryRequest
                     * @instance
                     */
                    Object.defineProperty(PartitionQueryRequest.prototype, "queryType", {
                        get: $util.oneOfGetter($oneOfFields = ["structuredQuery"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a PartitionQueryRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.PartitionQueryRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.PartitionQueryRequest} PartitionQueryRequest
                     */
                    PartitionQueryRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.PartitionQueryRequest)
                            return object;
                        var message = new $root.google.firestore.v1.PartitionQueryRequest();
                        if (object.parent != null)
                            message.parent = String(object.parent);
                        if (object.structuredQuery != null) {
                            if (typeof object.structuredQuery !== "object")
                                throw TypeError(".google.firestore.v1.PartitionQueryRequest.structuredQuery: object expected");
                            message.structuredQuery = $root.google.firestore.v1.StructuredQuery.fromObject(object.structuredQuery);
                        }
                        if (object.partitionCount != null)
                            if ($util.Long)
                                (message.partitionCount = $util.Long.fromValue(object.partitionCount)).unsigned = false;
                            else if (typeof object.partitionCount === "string")
                                message.partitionCount = parseInt(object.partitionCount, 10);
                            else if (typeof object.partitionCount === "number")
                                message.partitionCount = object.partitionCount;
                            else if (typeof object.partitionCount === "object")
                                message.partitionCount = new $util.LongBits(object.partitionCount.low >>> 0, object.partitionCount.high >>> 0).toNumber();
                        if (object.pageToken != null)
                            message.pageToken = String(object.pageToken);
                        if (object.pageSize != null)
                            message.pageSize = object.pageSize | 0;
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a PartitionQueryRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.PartitionQueryRequest
                     * @static
                     * @param {google.firestore.v1.PartitionQueryRequest} message PartitionQueryRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    PartitionQueryRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.parent = "";
                            if ($util.Long) {
                                var long = new $util.Long(0, 0, false);
                                object.partitionCount = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                            } else
                                object.partitionCount = options.longs === String ? "0" : 0;
                            object.pageToken = "";
                            object.pageSize = 0;
                        }
                        if (message.parent != null && message.hasOwnProperty("parent"))
                            object.parent = message.parent;
                        if (message.structuredQuery != null && message.hasOwnProperty("structuredQuery")) {
                            object.structuredQuery = $root.google.firestore.v1.StructuredQuery.toObject(message.structuredQuery, options);
                            if (options.oneofs)
                                object.queryType = "structuredQuery";
                        }
                        if (message.partitionCount != null && message.hasOwnProperty("partitionCount"))
                            if (typeof message.partitionCount === "number")
                                object.partitionCount = options.longs === String ? String(message.partitionCount) : message.partitionCount;
                            else
                                object.partitionCount = options.longs === String ? $util.Long.prototype.toString.call(message.partitionCount) : options.longs === Number ? new $util.LongBits(message.partitionCount.low >>> 0, message.partitionCount.high >>> 0).toNumber() : message.partitionCount;
                        if (message.pageToken != null && message.hasOwnProperty("pageToken"))
                            object.pageToken = message.pageToken;
                        if (message.pageSize != null && message.hasOwnProperty("pageSize"))
                            object.pageSize = message.pageSize;
                        return object;
                    };
    
                    /**
                     * Converts this PartitionQueryRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.PartitionQueryRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    PartitionQueryRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return PartitionQueryRequest;
                })();
    
                v1.PartitionQueryResponse = (function() {
    
                    /**
                     * Properties of a PartitionQueryResponse.
                     * @memberof google.firestore.v1
                     * @interface IPartitionQueryResponse
                     * @property {Array.<google.firestore.v1.ICursor>|null} [partitions] PartitionQueryResponse partitions
                     * @property {string|null} [nextPageToken] PartitionQueryResponse nextPageToken
                     */
    
                    /**
                     * Constructs a new PartitionQueryResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a PartitionQueryResponse.
                     * @implements IPartitionQueryResponse
                     * @constructor
                     * @param {google.firestore.v1.IPartitionQueryResponse=} [properties] Properties to set
                     */
                    function PartitionQueryResponse(properties) {
                        this.partitions = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * PartitionQueryResponse partitions.
                     * @member {Array.<google.firestore.v1.ICursor>} partitions
                     * @memberof google.firestore.v1.PartitionQueryResponse
                     * @instance
                     */
                    PartitionQueryResponse.prototype.partitions = $util.emptyArray;
    
                    /**
                     * PartitionQueryResponse nextPageToken.
                     * @member {string} nextPageToken
                     * @memberof google.firestore.v1.PartitionQueryResponse
                     * @instance
                     */
                    PartitionQueryResponse.prototype.nextPageToken = "";
    
                    /**
                     * Creates a PartitionQueryResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.PartitionQueryResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.PartitionQueryResponse} PartitionQueryResponse
                     */
                    PartitionQueryResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.PartitionQueryResponse)
                            return object;
                        var message = new $root.google.firestore.v1.PartitionQueryResponse();
                        if (object.partitions) {
                            if (!Array.isArray(object.partitions))
                                throw TypeError(".google.firestore.v1.PartitionQueryResponse.partitions: array expected");
                            message.partitions = [];
                            for (var i = 0; i < object.partitions.length; ++i) {
                                if (typeof object.partitions[i] !== "object")
                                    throw TypeError(".google.firestore.v1.PartitionQueryResponse.partitions: object expected");
                                message.partitions[i] = $root.google.firestore.v1.Cursor.fromObject(object.partitions[i]);
                            }
                        }
                        if (object.nextPageToken != null)
                            message.nextPageToken = String(object.nextPageToken);
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a PartitionQueryResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.PartitionQueryResponse
                     * @static
                     * @param {google.firestore.v1.PartitionQueryResponse} message PartitionQueryResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    PartitionQueryResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.partitions = [];
                        if (options.defaults)
                            object.nextPageToken = "";
                        if (message.partitions && message.partitions.length) {
                            object.partitions = [];
                            for (var j = 0; j < message.partitions.length; ++j)
                                object.partitions[j] = $root.google.firestore.v1.Cursor.toObject(message.partitions[j], options);
                        }
                        if (message.nextPageToken != null && message.hasOwnProperty("nextPageToken"))
                            object.nextPageToken = message.nextPageToken;
                        return object;
                    };
    
                    /**
                     * Converts this PartitionQueryResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.PartitionQueryResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    PartitionQueryResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return PartitionQueryResponse;
                })();
    
                v1.WriteRequest = (function() {
    
                    /**
                     * Properties of a WriteRequest.
                     * @memberof google.firestore.v1
                     * @interface IWriteRequest
                     * @property {string|null} [database] WriteRequest database
                     * @property {string|null} [streamId] WriteRequest streamId
                     * @property {Array.<google.firestore.v1.IWrite>|null} [writes] WriteRequest writes
                     * @property {Uint8Array|null} [streamToken] WriteRequest streamToken
                     * @property {Object.<string,string>|null} [labels] WriteRequest labels
                     */
    
                    /**
                     * Constructs a new WriteRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a WriteRequest.
                     * @implements IWriteRequest
                     * @constructor
                     * @param {google.firestore.v1.IWriteRequest=} [properties] Properties to set
                     */
                    function WriteRequest(properties) {
                        this.writes = [];
                        this.labels = {};
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * WriteRequest database.
                     * @member {string} database
                     * @memberof google.firestore.v1.WriteRequest
                     * @instance
                     */
                    WriteRequest.prototype.database = "";
    
                    /**
                     * WriteRequest streamId.
                     * @member {string} streamId
                     * @memberof google.firestore.v1.WriteRequest
                     * @instance
                     */
                    WriteRequest.prototype.streamId = "";
    
                    /**
                     * WriteRequest writes.
                     * @member {Array.<google.firestore.v1.IWrite>} writes
                     * @memberof google.firestore.v1.WriteRequest
                     * @instance
                     */
                    WriteRequest.prototype.writes = $util.emptyArray;
    
                    /**
                     * WriteRequest streamToken.
                     * @member {Uint8Array} streamToken
                     * @memberof google.firestore.v1.WriteRequest
                     * @instance
                     */
                    WriteRequest.prototype.streamToken = $util.newBuffer([]);
    
                    /**
                     * WriteRequest labels.
                     * @member {Object.<string,string>} labels
                     * @memberof google.firestore.v1.WriteRequest
                     * @instance
                     */
                    WriteRequest.prototype.labels = $util.emptyObject;
    
                    /**
                     * Creates a WriteRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.WriteRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.WriteRequest} WriteRequest
                     */
                    WriteRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.WriteRequest)
                            return object;
                        var message = new $root.google.firestore.v1.WriteRequest();
                        if (object.database != null)
                            message.database = String(object.database);
                        if (object.streamId != null)
                            message.streamId = String(object.streamId);
                        if (object.writes) {
                            if (!Array.isArray(object.writes))
                                throw TypeError(".google.firestore.v1.WriteRequest.writes: array expected");
                            message.writes = [];
                            for (var i = 0; i < object.writes.length; ++i) {
                                if (typeof object.writes[i] !== "object")
                                    throw TypeError(".google.firestore.v1.WriteRequest.writes: object expected");
                                message.writes[i] = $root.google.firestore.v1.Write.fromObject(object.writes[i]);
                            }
                        }
                        if (object.streamToken != null)
                            if (typeof object.streamToken === "string")
                                $util.base64.decode(object.streamToken, message.streamToken = $util.newBuffer($util.base64.length(object.streamToken)), 0);
                            else if (object.streamToken.length)
                                message.streamToken = object.streamToken;
                        if (object.labels) {
                            if (typeof object.labels !== "object")
                                throw TypeError(".google.firestore.v1.WriteRequest.labels: object expected");
                            message.labels = {};
                            for (var keys = Object.keys(object.labels), i = 0; i < keys.length; ++i)
                                message.labels[keys[i]] = String(object.labels[keys[i]]);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a WriteRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.WriteRequest
                     * @static
                     * @param {google.firestore.v1.WriteRequest} message WriteRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    WriteRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.writes = [];
                        if (options.objects || options.defaults)
                            object.labels = {};
                        if (options.defaults) {
                            object.database = "";
                            object.streamId = "";
                            if (options.bytes === String)
                                object.streamToken = "";
                            else {
                                object.streamToken = [];
                                if (options.bytes !== Array)
                                    object.streamToken = $util.newBuffer(object.streamToken);
                            }
                        }
                        if (message.database != null && message.hasOwnProperty("database"))
                            object.database = message.database;
                        if (message.streamId != null && message.hasOwnProperty("streamId"))
                            object.streamId = message.streamId;
                        if (message.writes && message.writes.length) {
                            object.writes = [];
                            for (var j = 0; j < message.writes.length; ++j)
                                object.writes[j] = $root.google.firestore.v1.Write.toObject(message.writes[j], options);
                        }
                        if (message.streamToken != null && message.hasOwnProperty("streamToken"))
                            object.streamToken = options.bytes === String ? $util.base64.encode(message.streamToken, 0, message.streamToken.length) : options.bytes === Array ? Array.prototype.slice.call(message.streamToken) : message.streamToken;
                        var keys2;
                        if (message.labels && (keys2 = Object.keys(message.labels)).length) {
                            object.labels = {};
                            for (var j = 0; j < keys2.length; ++j)
                                object.labels[keys2[j]] = message.labels[keys2[j]];
                        }
                        return object;
                    };
    
                    /**
                     * Converts this WriteRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.WriteRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    WriteRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return WriteRequest;
                })();
    
                v1.WriteResponse = (function() {
    
                    /**
                     * Properties of a WriteResponse.
                     * @memberof google.firestore.v1
                     * @interface IWriteResponse
                     * @property {string|null} [streamId] WriteResponse streamId
                     * @property {Uint8Array|null} [streamToken] WriteResponse streamToken
                     * @property {Array.<google.firestore.v1.IWriteResult>|null} [writeResults] WriteResponse writeResults
                     * @property {google.protobuf.ITimestamp|null} [commitTime] WriteResponse commitTime
                     */
    
                    /**
                     * Constructs a new WriteResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a WriteResponse.
                     * @implements IWriteResponse
                     * @constructor
                     * @param {google.firestore.v1.IWriteResponse=} [properties] Properties to set
                     */
                    function WriteResponse(properties) {
                        this.writeResults = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * WriteResponse streamId.
                     * @member {string} streamId
                     * @memberof google.firestore.v1.WriteResponse
                     * @instance
                     */
                    WriteResponse.prototype.streamId = "";
    
                    /**
                     * WriteResponse streamToken.
                     * @member {Uint8Array} streamToken
                     * @memberof google.firestore.v1.WriteResponse
                     * @instance
                     */
                    WriteResponse.prototype.streamToken = $util.newBuffer([]);
    
                    /**
                     * WriteResponse writeResults.
                     * @member {Array.<google.firestore.v1.IWriteResult>} writeResults
                     * @memberof google.firestore.v1.WriteResponse
                     * @instance
                     */
                    WriteResponse.prototype.writeResults = $util.emptyArray;
    
                    /**
                     * WriteResponse commitTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} commitTime
                     * @memberof google.firestore.v1.WriteResponse
                     * @instance
                     */
                    WriteResponse.prototype.commitTime = null;
    
                    /**
                     * Creates a WriteResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.WriteResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.WriteResponse} WriteResponse
                     */
                    WriteResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.WriteResponse)
                            return object;
                        var message = new $root.google.firestore.v1.WriteResponse();
                        if (object.streamId != null)
                            message.streamId = String(object.streamId);
                        if (object.streamToken != null)
                            if (typeof object.streamToken === "string")
                                $util.base64.decode(object.streamToken, message.streamToken = $util.newBuffer($util.base64.length(object.streamToken)), 0);
                            else if (object.streamToken.length)
                                message.streamToken = object.streamToken;
                        if (object.writeResults) {
                            if (!Array.isArray(object.writeResults))
                                throw TypeError(".google.firestore.v1.WriteResponse.writeResults: array expected");
                            message.writeResults = [];
                            for (var i = 0; i < object.writeResults.length; ++i) {
                                if (typeof object.writeResults[i] !== "object")
                                    throw TypeError(".google.firestore.v1.WriteResponse.writeResults: object expected");
                                message.writeResults[i] = $root.google.firestore.v1.WriteResult.fromObject(object.writeResults[i]);
                            }
                        }
                        if (object.commitTime != null) {
                            if (typeof object.commitTime !== "object")
                                throw TypeError(".google.firestore.v1.WriteResponse.commitTime: object expected");
                            message.commitTime = $root.google.protobuf.Timestamp.fromObject(object.commitTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a WriteResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.WriteResponse
                     * @static
                     * @param {google.firestore.v1.WriteResponse} message WriteResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    WriteResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.writeResults = [];
                        if (options.defaults) {
                            object.streamId = "";
                            if (options.bytes === String)
                                object.streamToken = "";
                            else {
                                object.streamToken = [];
                                if (options.bytes !== Array)
                                    object.streamToken = $util.newBuffer(object.streamToken);
                            }
                            object.commitTime = null;
                        }
                        if (message.streamId != null && message.hasOwnProperty("streamId"))
                            object.streamId = message.streamId;
                        if (message.streamToken != null && message.hasOwnProperty("streamToken"))
                            object.streamToken = options.bytes === String ? $util.base64.encode(message.streamToken, 0, message.streamToken.length) : options.bytes === Array ? Array.prototype.slice.call(message.streamToken) : message.streamToken;
                        if (message.writeResults && message.writeResults.length) {
                            object.writeResults = [];
                            for (var j = 0; j < message.writeResults.length; ++j)
                                object.writeResults[j] = $root.google.firestore.v1.WriteResult.toObject(message.writeResults[j], options);
                        }
                        if (message.commitTime != null && message.hasOwnProperty("commitTime"))
                            object.commitTime = $root.google.protobuf.Timestamp.toObject(message.commitTime, options);
                        return object;
                    };
    
                    /**
                     * Converts this WriteResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.WriteResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    WriteResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return WriteResponse;
                })();
    
                v1.ListenRequest = (function() {
    
                    /**
                     * Properties of a ListenRequest.
                     * @memberof google.firestore.v1
                     * @interface IListenRequest
                     * @property {string|null} [database] ListenRequest database
                     * @property {google.firestore.v1.ITarget|null} [addTarget] ListenRequest addTarget
                     * @property {number|null} [removeTarget] ListenRequest removeTarget
                     * @property {Object.<string,string>|null} [labels] ListenRequest labels
                     */
    
                    /**
                     * Constructs a new ListenRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a ListenRequest.
                     * @implements IListenRequest
                     * @constructor
                     * @param {google.firestore.v1.IListenRequest=} [properties] Properties to set
                     */
                    function ListenRequest(properties) {
                        this.labels = {};
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ListenRequest database.
                     * @member {string} database
                     * @memberof google.firestore.v1.ListenRequest
                     * @instance
                     */
                    ListenRequest.prototype.database = "";
    
                    /**
                     * ListenRequest addTarget.
                     * @member {google.firestore.v1.ITarget|null|undefined} addTarget
                     * @memberof google.firestore.v1.ListenRequest
                     * @instance
                     */
                    ListenRequest.prototype.addTarget = null;
    
                    /**
                     * ListenRequest removeTarget.
                     * @member {number} removeTarget
                     * @memberof google.firestore.v1.ListenRequest
                     * @instance
                     */
                    ListenRequest.prototype.removeTarget = 0;
    
                    /**
                     * ListenRequest labels.
                     * @member {Object.<string,string>} labels
                     * @memberof google.firestore.v1.ListenRequest
                     * @instance
                     */
                    ListenRequest.prototype.labels = $util.emptyObject;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * ListenRequest targetChange.
                     * @member {"addTarget"|"removeTarget"|undefined} targetChange
                     * @memberof google.firestore.v1.ListenRequest
                     * @instance
                     */
                    Object.defineProperty(ListenRequest.prototype, "targetChange", {
                        get: $util.oneOfGetter($oneOfFields = ["addTarget", "removeTarget"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a ListenRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.ListenRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.ListenRequest} ListenRequest
                     */
                    ListenRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.ListenRequest)
                            return object;
                        var message = new $root.google.firestore.v1.ListenRequest();
                        if (object.database != null)
                            message.database = String(object.database);
                        if (object.addTarget != null) {
                            if (typeof object.addTarget !== "object")
                                throw TypeError(".google.firestore.v1.ListenRequest.addTarget: object expected");
                            message.addTarget = $root.google.firestore.v1.Target.fromObject(object.addTarget);
                        }
                        if (object.removeTarget != null)
                            message.removeTarget = object.removeTarget | 0;
                        if (object.labels) {
                            if (typeof object.labels !== "object")
                                throw TypeError(".google.firestore.v1.ListenRequest.labels: object expected");
                            message.labels = {};
                            for (var keys = Object.keys(object.labels), i = 0; i < keys.length; ++i)
                                message.labels[keys[i]] = String(object.labels[keys[i]]);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a ListenRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.ListenRequest
                     * @static
                     * @param {google.firestore.v1.ListenRequest} message ListenRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ListenRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.objects || options.defaults)
                            object.labels = {};
                        if (options.defaults)
                            object.database = "";
                        if (message.database != null && message.hasOwnProperty("database"))
                            object.database = message.database;
                        if (message.addTarget != null && message.hasOwnProperty("addTarget")) {
                            object.addTarget = $root.google.firestore.v1.Target.toObject(message.addTarget, options);
                            if (options.oneofs)
                                object.targetChange = "addTarget";
                        }
                        if (message.removeTarget != null && message.hasOwnProperty("removeTarget")) {
                            object.removeTarget = message.removeTarget;
                            if (options.oneofs)
                                object.targetChange = "removeTarget";
                        }
                        var keys2;
                        if (message.labels && (keys2 = Object.keys(message.labels)).length) {
                            object.labels = {};
                            for (var j = 0; j < keys2.length; ++j)
                                object.labels[keys2[j]] = message.labels[keys2[j]];
                        }
                        return object;
                    };
    
                    /**
                     * Converts this ListenRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.ListenRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ListenRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ListenRequest;
                })();
    
                v1.ListenResponse = (function() {
    
                    /**
                     * Properties of a ListenResponse.
                     * @memberof google.firestore.v1
                     * @interface IListenResponse
                     * @property {google.firestore.v1.ITargetChange|null} [targetChange] ListenResponse targetChange
                     * @property {google.firestore.v1.IDocumentChange|null} [documentChange] ListenResponse documentChange
                     * @property {google.firestore.v1.IDocumentDelete|null} [documentDelete] ListenResponse documentDelete
                     * @property {google.firestore.v1.IDocumentRemove|null} [documentRemove] ListenResponse documentRemove
                     * @property {google.firestore.v1.IExistenceFilter|null} [filter] ListenResponse filter
                     */
    
                    /**
                     * Constructs a new ListenResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a ListenResponse.
                     * @implements IListenResponse
                     * @constructor
                     * @param {google.firestore.v1.IListenResponse=} [properties] Properties to set
                     */
                    function ListenResponse(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ListenResponse targetChange.
                     * @member {google.firestore.v1.ITargetChange|null|undefined} targetChange
                     * @memberof google.firestore.v1.ListenResponse
                     * @instance
                     */
                    ListenResponse.prototype.targetChange = null;
    
                    /**
                     * ListenResponse documentChange.
                     * @member {google.firestore.v1.IDocumentChange|null|undefined} documentChange
                     * @memberof google.firestore.v1.ListenResponse
                     * @instance
                     */
                    ListenResponse.prototype.documentChange = null;
    
                    /**
                     * ListenResponse documentDelete.
                     * @member {google.firestore.v1.IDocumentDelete|null|undefined} documentDelete
                     * @memberof google.firestore.v1.ListenResponse
                     * @instance
                     */
                    ListenResponse.prototype.documentDelete = null;
    
                    /**
                     * ListenResponse documentRemove.
                     * @member {google.firestore.v1.IDocumentRemove|null|undefined} documentRemove
                     * @memberof google.firestore.v1.ListenResponse
                     * @instance
                     */
                    ListenResponse.prototype.documentRemove = null;
    
                    /**
                     * ListenResponse filter.
                     * @member {google.firestore.v1.IExistenceFilter|null|undefined} filter
                     * @memberof google.firestore.v1.ListenResponse
                     * @instance
                     */
                    ListenResponse.prototype.filter = null;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * ListenResponse responseType.
                     * @member {"targetChange"|"documentChange"|"documentDelete"|"documentRemove"|"filter"|undefined} responseType
                     * @memberof google.firestore.v1.ListenResponse
                     * @instance
                     */
                    Object.defineProperty(ListenResponse.prototype, "responseType", {
                        get: $util.oneOfGetter($oneOfFields = ["targetChange", "documentChange", "documentDelete", "documentRemove", "filter"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a ListenResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.ListenResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.ListenResponse} ListenResponse
                     */
                    ListenResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.ListenResponse)
                            return object;
                        var message = new $root.google.firestore.v1.ListenResponse();
                        if (object.targetChange != null) {
                            if (typeof object.targetChange !== "object")
                                throw TypeError(".google.firestore.v1.ListenResponse.targetChange: object expected");
                            message.targetChange = $root.google.firestore.v1.TargetChange.fromObject(object.targetChange);
                        }
                        if (object.documentChange != null) {
                            if (typeof object.documentChange !== "object")
                                throw TypeError(".google.firestore.v1.ListenResponse.documentChange: object expected");
                            message.documentChange = $root.google.firestore.v1.DocumentChange.fromObject(object.documentChange);
                        }
                        if (object.documentDelete != null) {
                            if (typeof object.documentDelete !== "object")
                                throw TypeError(".google.firestore.v1.ListenResponse.documentDelete: object expected");
                            message.documentDelete = $root.google.firestore.v1.DocumentDelete.fromObject(object.documentDelete);
                        }
                        if (object.documentRemove != null) {
                            if (typeof object.documentRemove !== "object")
                                throw TypeError(".google.firestore.v1.ListenResponse.documentRemove: object expected");
                            message.documentRemove = $root.google.firestore.v1.DocumentRemove.fromObject(object.documentRemove);
                        }
                        if (object.filter != null) {
                            if (typeof object.filter !== "object")
                                throw TypeError(".google.firestore.v1.ListenResponse.filter: object expected");
                            message.filter = $root.google.firestore.v1.ExistenceFilter.fromObject(object.filter);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a ListenResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.ListenResponse
                     * @static
                     * @param {google.firestore.v1.ListenResponse} message ListenResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ListenResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (message.targetChange != null && message.hasOwnProperty("targetChange")) {
                            object.targetChange = $root.google.firestore.v1.TargetChange.toObject(message.targetChange, options);
                            if (options.oneofs)
                                object.responseType = "targetChange";
                        }
                        if (message.documentChange != null && message.hasOwnProperty("documentChange")) {
                            object.documentChange = $root.google.firestore.v1.DocumentChange.toObject(message.documentChange, options);
                            if (options.oneofs)
                                object.responseType = "documentChange";
                        }
                        if (message.documentDelete != null && message.hasOwnProperty("documentDelete")) {
                            object.documentDelete = $root.google.firestore.v1.DocumentDelete.toObject(message.documentDelete, options);
                            if (options.oneofs)
                                object.responseType = "documentDelete";
                        }
                        if (message.filter != null && message.hasOwnProperty("filter")) {
                            object.filter = $root.google.firestore.v1.ExistenceFilter.toObject(message.filter, options);
                            if (options.oneofs)
                                object.responseType = "filter";
                        }
                        if (message.documentRemove != null && message.hasOwnProperty("documentRemove")) {
                            object.documentRemove = $root.google.firestore.v1.DocumentRemove.toObject(message.documentRemove, options);
                            if (options.oneofs)
                                object.responseType = "documentRemove";
                        }
                        return object;
                    };
    
                    /**
                     * Converts this ListenResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.ListenResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ListenResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ListenResponse;
                })();
    
                v1.Target = (function() {
    
                    /**
                     * Properties of a Target.
                     * @memberof google.firestore.v1
                     * @interface ITarget
                     * @property {google.firestore.v1.Target.IQueryTarget|null} [query] Target query
                     * @property {google.firestore.v1.Target.IDocumentsTarget|null} [documents] Target documents
                     * @property {Uint8Array|null} [resumeToken] Target resumeToken
                     * @property {google.protobuf.ITimestamp|null} [readTime] Target readTime
                     * @property {number|null} [targetId] Target targetId
                     * @property {boolean|null} [once] Target once
                     */
    
                    /**
                     * Constructs a new Target.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a Target.
                     * @implements ITarget
                     * @constructor
                     * @param {google.firestore.v1.ITarget=} [properties] Properties to set
                     */
                    function Target(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * Target query.
                     * @member {google.firestore.v1.Target.IQueryTarget|null|undefined} query
                     * @memberof google.firestore.v1.Target
                     * @instance
                     */
                    Target.prototype.query = null;
    
                    /**
                     * Target documents.
                     * @member {google.firestore.v1.Target.IDocumentsTarget|null|undefined} documents
                     * @memberof google.firestore.v1.Target
                     * @instance
                     */
                    Target.prototype.documents = null;
    
                    /**
                     * Target resumeToken.
                     * @member {Uint8Array} resumeToken
                     * @memberof google.firestore.v1.Target
                     * @instance
                     */
                    Target.prototype.resumeToken = $util.newBuffer([]);
    
                    /**
                     * Target readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.Target
                     * @instance
                     */
                    Target.prototype.readTime = null;
    
                    /**
                     * Target targetId.
                     * @member {number} targetId
                     * @memberof google.firestore.v1.Target
                     * @instance
                     */
                    Target.prototype.targetId = 0;
    
                    /**
                     * Target once.
                     * @member {boolean} once
                     * @memberof google.firestore.v1.Target
                     * @instance
                     */
                    Target.prototype.once = false;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * Target targetType.
                     * @member {"query"|"documents"|undefined} targetType
                     * @memberof google.firestore.v1.Target
                     * @instance
                     */
                    Object.defineProperty(Target.prototype, "targetType", {
                        get: $util.oneOfGetter($oneOfFields = ["query", "documents"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Target resumeType.
                     * @member {"resumeToken"|"readTime"|undefined} resumeType
                     * @memberof google.firestore.v1.Target
                     * @instance
                     */
                    Object.defineProperty(Target.prototype, "resumeType", {
                        get: $util.oneOfGetter($oneOfFields = ["resumeToken", "readTime"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a Target message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.Target
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.Target} Target
                     */
                    Target.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.Target)
                            return object;
                        var message = new $root.google.firestore.v1.Target();
                        if (object.query != null) {
                            if (typeof object.query !== "object")
                                throw TypeError(".google.firestore.v1.Target.query: object expected");
                            message.query = $root.google.firestore.v1.Target.QueryTarget.fromObject(object.query);
                        }
                        if (object.documents != null) {
                            if (typeof object.documents !== "object")
                                throw TypeError(".google.firestore.v1.Target.documents: object expected");
                            message.documents = $root.google.firestore.v1.Target.DocumentsTarget.fromObject(object.documents);
                        }
                        if (object.resumeToken != null)
                            if (typeof object.resumeToken === "string")
                                $util.base64.decode(object.resumeToken, message.resumeToken = $util.newBuffer($util.base64.length(object.resumeToken)), 0);
                            else if (object.resumeToken.length)
                                message.resumeToken = object.resumeToken;
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.Target.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        if (object.targetId != null)
                            message.targetId = object.targetId | 0;
                        if (object.once != null)
                            message.once = Boolean(object.once);
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a Target message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.Target
                     * @static
                     * @param {google.firestore.v1.Target} message Target
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Target.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.targetId = 0;
                            object.once = false;
                        }
                        if (message.query != null && message.hasOwnProperty("query")) {
                            object.query = $root.google.firestore.v1.Target.QueryTarget.toObject(message.query, options);
                            if (options.oneofs)
                                object.targetType = "query";
                        }
                        if (message.documents != null && message.hasOwnProperty("documents")) {
                            object.documents = $root.google.firestore.v1.Target.DocumentsTarget.toObject(message.documents, options);
                            if (options.oneofs)
                                object.targetType = "documents";
                        }
                        if (message.resumeToken != null && message.hasOwnProperty("resumeToken")) {
                            object.resumeToken = options.bytes === String ? $util.base64.encode(message.resumeToken, 0, message.resumeToken.length) : options.bytes === Array ? Array.prototype.slice.call(message.resumeToken) : message.resumeToken;
                            if (options.oneofs)
                                object.resumeType = "resumeToken";
                        }
                        if (message.targetId != null && message.hasOwnProperty("targetId"))
                            object.targetId = message.targetId;
                        if (message.once != null && message.hasOwnProperty("once"))
                            object.once = message.once;
                        if (message.readTime != null && message.hasOwnProperty("readTime")) {
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                            if (options.oneofs)
                                object.resumeType = "readTime";
                        }
                        return object;
                    };
    
                    /**
                     * Converts this Target to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.Target
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Target.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    Target.DocumentsTarget = (function() {
    
                        /**
                         * Properties of a DocumentsTarget.
                         * @memberof google.firestore.v1.Target
                         * @interface IDocumentsTarget
                         * @property {Array.<string>|null} [documents] DocumentsTarget documents
                         */
    
                        /**
                         * Constructs a new DocumentsTarget.
                         * @memberof google.firestore.v1.Target
                         * @classdesc Represents a DocumentsTarget.
                         * @implements IDocumentsTarget
                         * @constructor
                         * @param {google.firestore.v1.Target.IDocumentsTarget=} [properties] Properties to set
                         */
                        function DocumentsTarget(properties) {
                            this.documents = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * DocumentsTarget documents.
                         * @member {Array.<string>} documents
                         * @memberof google.firestore.v1.Target.DocumentsTarget
                         * @instance
                         */
                        DocumentsTarget.prototype.documents = $util.emptyArray;
    
                        /**
                         * Creates a DocumentsTarget message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.Target.DocumentsTarget
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.Target.DocumentsTarget} DocumentsTarget
                         */
                        DocumentsTarget.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.Target.DocumentsTarget)
                                return object;
                            var message = new $root.google.firestore.v1.Target.DocumentsTarget();
                            if (object.documents) {
                                if (!Array.isArray(object.documents))
                                    throw TypeError(".google.firestore.v1.Target.DocumentsTarget.documents: array expected");
                                message.documents = [];
                                for (var i = 0; i < object.documents.length; ++i)
                                    message.documents[i] = String(object.documents[i]);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a DocumentsTarget message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.Target.DocumentsTarget
                         * @static
                         * @param {google.firestore.v1.Target.DocumentsTarget} message DocumentsTarget
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DocumentsTarget.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.documents = [];
                            if (message.documents && message.documents.length) {
                                object.documents = [];
                                for (var j = 0; j < message.documents.length; ++j)
                                    object.documents[j] = message.documents[j];
                            }
                            return object;
                        };
    
                        /**
                         * Converts this DocumentsTarget to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.Target.DocumentsTarget
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DocumentsTarget.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        return DocumentsTarget;
                    })();
    
                    Target.QueryTarget = (function() {
    
                        /**
                         * Properties of a QueryTarget.
                         * @memberof google.firestore.v1.Target
                         * @interface IQueryTarget
                         * @property {string|null} [parent] QueryTarget parent
                         * @property {google.firestore.v1.IStructuredQuery|null} [structuredQuery] QueryTarget structuredQuery
                         */
    
                        /**
                         * Constructs a new QueryTarget.
                         * @memberof google.firestore.v1.Target
                         * @classdesc Represents a QueryTarget.
                         * @implements IQueryTarget
                         * @constructor
                         * @param {google.firestore.v1.Target.IQueryTarget=} [properties] Properties to set
                         */
                        function QueryTarget(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * QueryTarget parent.
                         * @member {string} parent
                         * @memberof google.firestore.v1.Target.QueryTarget
                         * @instance
                         */
                        QueryTarget.prototype.parent = "";
    
                        /**
                         * QueryTarget structuredQuery.
                         * @member {google.firestore.v1.IStructuredQuery|null|undefined} structuredQuery
                         * @memberof google.firestore.v1.Target.QueryTarget
                         * @instance
                         */
                        QueryTarget.prototype.structuredQuery = null;
    
                        // OneOf field names bound to virtual getters and setters
                        var $oneOfFields;
    
                        /**
                         * QueryTarget queryType.
                         * @member {"structuredQuery"|undefined} queryType
                         * @memberof google.firestore.v1.Target.QueryTarget
                         * @instance
                         */
                        Object.defineProperty(QueryTarget.prototype, "queryType", {
                            get: $util.oneOfGetter($oneOfFields = ["structuredQuery"]),
                            set: $util.oneOfSetter($oneOfFields)
                        });
    
                        /**
                         * Creates a QueryTarget message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.Target.QueryTarget
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.Target.QueryTarget} QueryTarget
                         */
                        QueryTarget.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.Target.QueryTarget)
                                return object;
                            var message = new $root.google.firestore.v1.Target.QueryTarget();
                            if (object.parent != null)
                                message.parent = String(object.parent);
                            if (object.structuredQuery != null) {
                                if (typeof object.structuredQuery !== "object")
                                    throw TypeError(".google.firestore.v1.Target.QueryTarget.structuredQuery: object expected");
                                message.structuredQuery = $root.google.firestore.v1.StructuredQuery.fromObject(object.structuredQuery);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a QueryTarget message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.Target.QueryTarget
                         * @static
                         * @param {google.firestore.v1.Target.QueryTarget} message QueryTarget
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        QueryTarget.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.parent = "";
                            if (message.parent != null && message.hasOwnProperty("parent"))
                                object.parent = message.parent;
                            if (message.structuredQuery != null && message.hasOwnProperty("structuredQuery")) {
                                object.structuredQuery = $root.google.firestore.v1.StructuredQuery.toObject(message.structuredQuery, options);
                                if (options.oneofs)
                                    object.queryType = "structuredQuery";
                            }
                            return object;
                        };
    
                        /**
                         * Converts this QueryTarget to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.Target.QueryTarget
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        QueryTarget.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        return QueryTarget;
                    })();
    
                    return Target;
                })();
    
                v1.TargetChange = (function() {
    
                    /**
                     * Properties of a TargetChange.
                     * @memberof google.firestore.v1
                     * @interface ITargetChange
                     * @property {google.firestore.v1.TargetChange.TargetChangeType|null} [targetChangeType] TargetChange targetChangeType
                     * @property {Array.<number>|null} [targetIds] TargetChange targetIds
                     * @property {google.rpc.IStatus|null} [cause] TargetChange cause
                     * @property {Uint8Array|null} [resumeToken] TargetChange resumeToken
                     * @property {google.protobuf.ITimestamp|null} [readTime] TargetChange readTime
                     */
    
                    /**
                     * Constructs a new TargetChange.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a TargetChange.
                     * @implements ITargetChange
                     * @constructor
                     * @param {google.firestore.v1.ITargetChange=} [properties] Properties to set
                     */
                    function TargetChange(properties) {
                        this.targetIds = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * TargetChange targetChangeType.
                     * @member {google.firestore.v1.TargetChange.TargetChangeType} targetChangeType
                     * @memberof google.firestore.v1.TargetChange
                     * @instance
                     */
                    TargetChange.prototype.targetChangeType = 0;
    
                    /**
                     * TargetChange targetIds.
                     * @member {Array.<number>} targetIds
                     * @memberof google.firestore.v1.TargetChange
                     * @instance
                     */
                    TargetChange.prototype.targetIds = $util.emptyArray;
    
                    /**
                     * TargetChange cause.
                     * @member {google.rpc.IStatus|null|undefined} cause
                     * @memberof google.firestore.v1.TargetChange
                     * @instance
                     */
                    TargetChange.prototype.cause = null;
    
                    /**
                     * TargetChange resumeToken.
                     * @member {Uint8Array} resumeToken
                     * @memberof google.firestore.v1.TargetChange
                     * @instance
                     */
                    TargetChange.prototype.resumeToken = $util.newBuffer([]);
    
                    /**
                     * TargetChange readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.TargetChange
                     * @instance
                     */
                    TargetChange.prototype.readTime = null;
    
                    /**
                     * Creates a TargetChange message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.TargetChange
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.TargetChange} TargetChange
                     */
                    TargetChange.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.TargetChange)
                            return object;
                        var message = new $root.google.firestore.v1.TargetChange();
                        switch (object.targetChangeType) {
                        case "NO_CHANGE":
                        case 0:
                            message.targetChangeType = 0;
                            break;
                        case "ADD":
                        case 1:
                            message.targetChangeType = 1;
                            break;
                        case "REMOVE":
                        case 2:
                            message.targetChangeType = 2;
                            break;
                        case "CURRENT":
                        case 3:
                            message.targetChangeType = 3;
                            break;
                        case "RESET":
                        case 4:
                            message.targetChangeType = 4;
                            break;
                        }
                        if (object.targetIds) {
                            if (!Array.isArray(object.targetIds))
                                throw TypeError(".google.firestore.v1.TargetChange.targetIds: array expected");
                            message.targetIds = [];
                            for (var i = 0; i < object.targetIds.length; ++i)
                                message.targetIds[i] = object.targetIds[i] | 0;
                        }
                        if (object.cause != null) {
                            if (typeof object.cause !== "object")
                                throw TypeError(".google.firestore.v1.TargetChange.cause: object expected");
                            message.cause = $root.google.rpc.Status.fromObject(object.cause);
                        }
                        if (object.resumeToken != null)
                            if (typeof object.resumeToken === "string")
                                $util.base64.decode(object.resumeToken, message.resumeToken = $util.newBuffer($util.base64.length(object.resumeToken)), 0);
                            else if (object.resumeToken.length)
                                message.resumeToken = object.resumeToken;
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.TargetChange.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a TargetChange message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.TargetChange
                     * @static
                     * @param {google.firestore.v1.TargetChange} message TargetChange
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    TargetChange.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.targetIds = [];
                        if (options.defaults) {
                            object.targetChangeType = options.enums === String ? "NO_CHANGE" : 0;
                            object.cause = null;
                            if (options.bytes === String)
                                object.resumeToken = "";
                            else {
                                object.resumeToken = [];
                                if (options.bytes !== Array)
                                    object.resumeToken = $util.newBuffer(object.resumeToken);
                            }
                            object.readTime = null;
                        }
                        if (message.targetChangeType != null && message.hasOwnProperty("targetChangeType"))
                            object.targetChangeType = options.enums === String ? $root.google.firestore.v1.TargetChange.TargetChangeType[message.targetChangeType] : message.targetChangeType;
                        if (message.targetIds && message.targetIds.length) {
                            object.targetIds = [];
                            for (var j = 0; j < message.targetIds.length; ++j)
                                object.targetIds[j] = message.targetIds[j];
                        }
                        if (message.cause != null && message.hasOwnProperty("cause"))
                            object.cause = $root.google.rpc.Status.toObject(message.cause, options);
                        if (message.resumeToken != null && message.hasOwnProperty("resumeToken"))
                            object.resumeToken = options.bytes === String ? $util.base64.encode(message.resumeToken, 0, message.resumeToken.length) : options.bytes === Array ? Array.prototype.slice.call(message.resumeToken) : message.resumeToken;
                        if (message.readTime != null && message.hasOwnProperty("readTime"))
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                        return object;
                    };
    
                    /**
                     * Converts this TargetChange to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.TargetChange
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    TargetChange.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    /**
                     * TargetChangeType enum.
                     * @name google.firestore.v1.TargetChange.TargetChangeType
                     * @enum {string}
                     * @property {string} NO_CHANGE=NO_CHANGE NO_CHANGE value
                     * @property {string} ADD=ADD ADD value
                     * @property {string} REMOVE=REMOVE REMOVE value
                     * @property {string} CURRENT=CURRENT CURRENT value
                     * @property {string} RESET=RESET RESET value
                     */
                    TargetChange.TargetChangeType = (function() {
                        var valuesById = {}, values = Object.create(valuesById);
                        values[valuesById[0] = "NO_CHANGE"] = "NO_CHANGE";
                        values[valuesById[1] = "ADD"] = "ADD";
                        values[valuesById[2] = "REMOVE"] = "REMOVE";
                        values[valuesById[3] = "CURRENT"] = "CURRENT";
                        values[valuesById[4] = "RESET"] = "RESET";
                        return values;
                    })();
    
                    return TargetChange;
                })();
    
                v1.ListCollectionIdsRequest = (function() {
    
                    /**
                     * Properties of a ListCollectionIdsRequest.
                     * @memberof google.firestore.v1
                     * @interface IListCollectionIdsRequest
                     * @property {string|null} [parent] ListCollectionIdsRequest parent
                     * @property {number|null} [pageSize] ListCollectionIdsRequest pageSize
                     * @property {string|null} [pageToken] ListCollectionIdsRequest pageToken
                     */
    
                    /**
                     * Constructs a new ListCollectionIdsRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a ListCollectionIdsRequest.
                     * @implements IListCollectionIdsRequest
                     * @constructor
                     * @param {google.firestore.v1.IListCollectionIdsRequest=} [properties] Properties to set
                     */
                    function ListCollectionIdsRequest(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ListCollectionIdsRequest parent.
                     * @member {string} parent
                     * @memberof google.firestore.v1.ListCollectionIdsRequest
                     * @instance
                     */
                    ListCollectionIdsRequest.prototype.parent = "";
    
                    /**
                     * ListCollectionIdsRequest pageSize.
                     * @member {number} pageSize
                     * @memberof google.firestore.v1.ListCollectionIdsRequest
                     * @instance
                     */
                    ListCollectionIdsRequest.prototype.pageSize = 0;
    
                    /**
                     * ListCollectionIdsRequest pageToken.
                     * @member {string} pageToken
                     * @memberof google.firestore.v1.ListCollectionIdsRequest
                     * @instance
                     */
                    ListCollectionIdsRequest.prototype.pageToken = "";
    
                    /**
                     * Creates a ListCollectionIdsRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.ListCollectionIdsRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.ListCollectionIdsRequest} ListCollectionIdsRequest
                     */
                    ListCollectionIdsRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.ListCollectionIdsRequest)
                            return object;
                        var message = new $root.google.firestore.v1.ListCollectionIdsRequest();
                        if (object.parent != null)
                            message.parent = String(object.parent);
                        if (object.pageSize != null)
                            message.pageSize = object.pageSize | 0;
                        if (object.pageToken != null)
                            message.pageToken = String(object.pageToken);
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a ListCollectionIdsRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.ListCollectionIdsRequest
                     * @static
                     * @param {google.firestore.v1.ListCollectionIdsRequest} message ListCollectionIdsRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ListCollectionIdsRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.parent = "";
                            object.pageSize = 0;
                            object.pageToken = "";
                        }
                        if (message.parent != null && message.hasOwnProperty("parent"))
                            object.parent = message.parent;
                        if (message.pageSize != null && message.hasOwnProperty("pageSize"))
                            object.pageSize = message.pageSize;
                        if (message.pageToken != null && message.hasOwnProperty("pageToken"))
                            object.pageToken = message.pageToken;
                        return object;
                    };
    
                    /**
                     * Converts this ListCollectionIdsRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.ListCollectionIdsRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ListCollectionIdsRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ListCollectionIdsRequest;
                })();
    
                v1.ListCollectionIdsResponse = (function() {
    
                    /**
                     * Properties of a ListCollectionIdsResponse.
                     * @memberof google.firestore.v1
                     * @interface IListCollectionIdsResponse
                     * @property {Array.<string>|null} [collectionIds] ListCollectionIdsResponse collectionIds
                     * @property {string|null} [nextPageToken] ListCollectionIdsResponse nextPageToken
                     */
    
                    /**
                     * Constructs a new ListCollectionIdsResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a ListCollectionIdsResponse.
                     * @implements IListCollectionIdsResponse
                     * @constructor
                     * @param {google.firestore.v1.IListCollectionIdsResponse=} [properties] Properties to set
                     */
                    function ListCollectionIdsResponse(properties) {
                        this.collectionIds = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ListCollectionIdsResponse collectionIds.
                     * @member {Array.<string>} collectionIds
                     * @memberof google.firestore.v1.ListCollectionIdsResponse
                     * @instance
                     */
                    ListCollectionIdsResponse.prototype.collectionIds = $util.emptyArray;
    
                    /**
                     * ListCollectionIdsResponse nextPageToken.
                     * @member {string} nextPageToken
                     * @memberof google.firestore.v1.ListCollectionIdsResponse
                     * @instance
                     */
                    ListCollectionIdsResponse.prototype.nextPageToken = "";
    
                    /**
                     * Creates a ListCollectionIdsResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.ListCollectionIdsResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.ListCollectionIdsResponse} ListCollectionIdsResponse
                     */
                    ListCollectionIdsResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.ListCollectionIdsResponse)
                            return object;
                        var message = new $root.google.firestore.v1.ListCollectionIdsResponse();
                        if (object.collectionIds) {
                            if (!Array.isArray(object.collectionIds))
                                throw TypeError(".google.firestore.v1.ListCollectionIdsResponse.collectionIds: array expected");
                            message.collectionIds = [];
                            for (var i = 0; i < object.collectionIds.length; ++i)
                                message.collectionIds[i] = String(object.collectionIds[i]);
                        }
                        if (object.nextPageToken != null)
                            message.nextPageToken = String(object.nextPageToken);
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a ListCollectionIdsResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.ListCollectionIdsResponse
                     * @static
                     * @param {google.firestore.v1.ListCollectionIdsResponse} message ListCollectionIdsResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ListCollectionIdsResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.collectionIds = [];
                        if (options.defaults)
                            object.nextPageToken = "";
                        if (message.collectionIds && message.collectionIds.length) {
                            object.collectionIds = [];
                            for (var j = 0; j < message.collectionIds.length; ++j)
                                object.collectionIds[j] = message.collectionIds[j];
                        }
                        if (message.nextPageToken != null && message.hasOwnProperty("nextPageToken"))
                            object.nextPageToken = message.nextPageToken;
                        return object;
                    };
    
                    /**
                     * Converts this ListCollectionIdsResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.ListCollectionIdsResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ListCollectionIdsResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ListCollectionIdsResponse;
                })();
    
                v1.BatchWriteRequest = (function() {
    
                    /**
                     * Properties of a BatchWriteRequest.
                     * @memberof google.firestore.v1
                     * @interface IBatchWriteRequest
                     * @property {string|null} [database] BatchWriteRequest database
                     * @property {Array.<google.firestore.v1.IWrite>|null} [writes] BatchWriteRequest writes
                     * @property {Object.<string,string>|null} [labels] BatchWriteRequest labels
                     */
    
                    /**
                     * Constructs a new BatchWriteRequest.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a BatchWriteRequest.
                     * @implements IBatchWriteRequest
                     * @constructor
                     * @param {google.firestore.v1.IBatchWriteRequest=} [properties] Properties to set
                     */
                    function BatchWriteRequest(properties) {
                        this.writes = [];
                        this.labels = {};
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * BatchWriteRequest database.
                     * @member {string} database
                     * @memberof google.firestore.v1.BatchWriteRequest
                     * @instance
                     */
                    BatchWriteRequest.prototype.database = "";
    
                    /**
                     * BatchWriteRequest writes.
                     * @member {Array.<google.firestore.v1.IWrite>} writes
                     * @memberof google.firestore.v1.BatchWriteRequest
                     * @instance
                     */
                    BatchWriteRequest.prototype.writes = $util.emptyArray;
    
                    /**
                     * BatchWriteRequest labels.
                     * @member {Object.<string,string>} labels
                     * @memberof google.firestore.v1.BatchWriteRequest
                     * @instance
                     */
                    BatchWriteRequest.prototype.labels = $util.emptyObject;
    
                    /**
                     * Creates a BatchWriteRequest message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.BatchWriteRequest
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.BatchWriteRequest} BatchWriteRequest
                     */
                    BatchWriteRequest.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.BatchWriteRequest)
                            return object;
                        var message = new $root.google.firestore.v1.BatchWriteRequest();
                        if (object.database != null)
                            message.database = String(object.database);
                        if (object.writes) {
                            if (!Array.isArray(object.writes))
                                throw TypeError(".google.firestore.v1.BatchWriteRequest.writes: array expected");
                            message.writes = [];
                            for (var i = 0; i < object.writes.length; ++i) {
                                if (typeof object.writes[i] !== "object")
                                    throw TypeError(".google.firestore.v1.BatchWriteRequest.writes: object expected");
                                message.writes[i] = $root.google.firestore.v1.Write.fromObject(object.writes[i]);
                            }
                        }
                        if (object.labels) {
                            if (typeof object.labels !== "object")
                                throw TypeError(".google.firestore.v1.BatchWriteRequest.labels: object expected");
                            message.labels = {};
                            for (var keys = Object.keys(object.labels), i = 0; i < keys.length; ++i)
                                message.labels[keys[i]] = String(object.labels[keys[i]]);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a BatchWriteRequest message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.BatchWriteRequest
                     * @static
                     * @param {google.firestore.v1.BatchWriteRequest} message BatchWriteRequest
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    BatchWriteRequest.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.writes = [];
                        if (options.objects || options.defaults)
                            object.labels = {};
                        if (options.defaults)
                            object.database = "";
                        if (message.database != null && message.hasOwnProperty("database"))
                            object.database = message.database;
                        if (message.writes && message.writes.length) {
                            object.writes = [];
                            for (var j = 0; j < message.writes.length; ++j)
                                object.writes[j] = $root.google.firestore.v1.Write.toObject(message.writes[j], options);
                        }
                        var keys2;
                        if (message.labels && (keys2 = Object.keys(message.labels)).length) {
                            object.labels = {};
                            for (var j = 0; j < keys2.length; ++j)
                                object.labels[keys2[j]] = message.labels[keys2[j]];
                        }
                        return object;
                    };
    
                    /**
                     * Converts this BatchWriteRequest to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.BatchWriteRequest
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    BatchWriteRequest.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return BatchWriteRequest;
                })();
    
                v1.BatchWriteResponse = (function() {
    
                    /**
                     * Properties of a BatchWriteResponse.
                     * @memberof google.firestore.v1
                     * @interface IBatchWriteResponse
                     * @property {Array.<google.firestore.v1.IWriteResult>|null} [writeResults] BatchWriteResponse writeResults
                     * @property {Array.<google.rpc.IStatus>|null} [status] BatchWriteResponse status
                     */
    
                    /**
                     * Constructs a new BatchWriteResponse.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a BatchWriteResponse.
                     * @implements IBatchWriteResponse
                     * @constructor
                     * @param {google.firestore.v1.IBatchWriteResponse=} [properties] Properties to set
                     */
                    function BatchWriteResponse(properties) {
                        this.writeResults = [];
                        this.status = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * BatchWriteResponse writeResults.
                     * @member {Array.<google.firestore.v1.IWriteResult>} writeResults
                     * @memberof google.firestore.v1.BatchWriteResponse
                     * @instance
                     */
                    BatchWriteResponse.prototype.writeResults = $util.emptyArray;
    
                    /**
                     * BatchWriteResponse status.
                     * @member {Array.<google.rpc.IStatus>} status
                     * @memberof google.firestore.v1.BatchWriteResponse
                     * @instance
                     */
                    BatchWriteResponse.prototype.status = $util.emptyArray;
    
                    /**
                     * Creates a BatchWriteResponse message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.BatchWriteResponse
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.BatchWriteResponse} BatchWriteResponse
                     */
                    BatchWriteResponse.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.BatchWriteResponse)
                            return object;
                        var message = new $root.google.firestore.v1.BatchWriteResponse();
                        if (object.writeResults) {
                            if (!Array.isArray(object.writeResults))
                                throw TypeError(".google.firestore.v1.BatchWriteResponse.writeResults: array expected");
                            message.writeResults = [];
                            for (var i = 0; i < object.writeResults.length; ++i) {
                                if (typeof object.writeResults[i] !== "object")
                                    throw TypeError(".google.firestore.v1.BatchWriteResponse.writeResults: object expected");
                                message.writeResults[i] = $root.google.firestore.v1.WriteResult.fromObject(object.writeResults[i]);
                            }
                        }
                        if (object.status) {
                            if (!Array.isArray(object.status))
                                throw TypeError(".google.firestore.v1.BatchWriteResponse.status: array expected");
                            message.status = [];
                            for (var i = 0; i < object.status.length; ++i) {
                                if (typeof object.status[i] !== "object")
                                    throw TypeError(".google.firestore.v1.BatchWriteResponse.status: object expected");
                                message.status[i] = $root.google.rpc.Status.fromObject(object.status[i]);
                            }
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a BatchWriteResponse message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.BatchWriteResponse
                     * @static
                     * @param {google.firestore.v1.BatchWriteResponse} message BatchWriteResponse
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    BatchWriteResponse.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults) {
                            object.writeResults = [];
                            object.status = [];
                        }
                        if (message.writeResults && message.writeResults.length) {
                            object.writeResults = [];
                            for (var j = 0; j < message.writeResults.length; ++j)
                                object.writeResults[j] = $root.google.firestore.v1.WriteResult.toObject(message.writeResults[j], options);
                        }
                        if (message.status && message.status.length) {
                            object.status = [];
                            for (var j = 0; j < message.status.length; ++j)
                                object.status[j] = $root.google.rpc.Status.toObject(message.status[j], options);
                        }
                        return object;
                    };
    
                    /**
                     * Converts this BatchWriteResponse to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.BatchWriteResponse
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    BatchWriteResponse.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return BatchWriteResponse;
                })();
    
                v1.StructuredQuery = (function() {
    
                    /**
                     * Properties of a StructuredQuery.
                     * @memberof google.firestore.v1
                     * @interface IStructuredQuery
                     * @property {google.firestore.v1.StructuredQuery.IProjection|null} [select] StructuredQuery select
                     * @property {Array.<google.firestore.v1.StructuredQuery.ICollectionSelector>|null} [from] StructuredQuery from
                     * @property {google.firestore.v1.StructuredQuery.IFilter|null} [where] StructuredQuery where
                     * @property {Array.<google.firestore.v1.StructuredQuery.IOrder>|null} [orderBy] StructuredQuery orderBy
                     * @property {google.firestore.v1.ICursor|null} [startAt] StructuredQuery startAt
                     * @property {google.firestore.v1.ICursor|null} [endAt] StructuredQuery endAt
                     * @property {number|null} [offset] StructuredQuery offset
                     * @property {google.protobuf.IInt32Value|null} [limit] StructuredQuery limit
                     */
    
                    /**
                     * Constructs a new StructuredQuery.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a StructuredQuery.
                     * @implements IStructuredQuery
                     * @constructor
                     * @param {google.firestore.v1.IStructuredQuery=} [properties] Properties to set
                     */
                    function StructuredQuery(properties) {
                        this.from = [];
                        this.orderBy = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * StructuredQuery select.
                     * @member {google.firestore.v1.StructuredQuery.IProjection|null|undefined} select
                     * @memberof google.firestore.v1.StructuredQuery
                     * @instance
                     */
                    StructuredQuery.prototype.select = null;
    
                    /**
                     * StructuredQuery from.
                     * @member {Array.<google.firestore.v1.StructuredQuery.ICollectionSelector>} from
                     * @memberof google.firestore.v1.StructuredQuery
                     * @instance
                     */
                    StructuredQuery.prototype.from = $util.emptyArray;
    
                    /**
                     * StructuredQuery where.
                     * @member {google.firestore.v1.StructuredQuery.IFilter|null|undefined} where
                     * @memberof google.firestore.v1.StructuredQuery
                     * @instance
                     */
                    StructuredQuery.prototype.where = null;
    
                    /**
                     * StructuredQuery orderBy.
                     * @member {Array.<google.firestore.v1.StructuredQuery.IOrder>} orderBy
                     * @memberof google.firestore.v1.StructuredQuery
                     * @instance
                     */
                    StructuredQuery.prototype.orderBy = $util.emptyArray;
    
                    /**
                     * StructuredQuery startAt.
                     * @member {google.firestore.v1.ICursor|null|undefined} startAt
                     * @memberof google.firestore.v1.StructuredQuery
                     * @instance
                     */
                    StructuredQuery.prototype.startAt = null;
    
                    /**
                     * StructuredQuery endAt.
                     * @member {google.firestore.v1.ICursor|null|undefined} endAt
                     * @memberof google.firestore.v1.StructuredQuery
                     * @instance
                     */
                    StructuredQuery.prototype.endAt = null;
    
                    /**
                     * StructuredQuery offset.
                     * @member {number} offset
                     * @memberof google.firestore.v1.StructuredQuery
                     * @instance
                     */
                    StructuredQuery.prototype.offset = 0;
    
                    /**
                     * StructuredQuery limit.
                     * @member {google.protobuf.IInt32Value|null|undefined} limit
                     * @memberof google.firestore.v1.StructuredQuery
                     * @instance
                     */
                    StructuredQuery.prototype.limit = null;
    
                    /**
                     * Creates a StructuredQuery message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.StructuredQuery
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.StructuredQuery} StructuredQuery
                     */
                    StructuredQuery.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.StructuredQuery)
                            return object;
                        var message = new $root.google.firestore.v1.StructuredQuery();
                        if (object.select != null) {
                            if (typeof object.select !== "object")
                                throw TypeError(".google.firestore.v1.StructuredQuery.select: object expected");
                            message.select = $root.google.firestore.v1.StructuredQuery.Projection.fromObject(object.select);
                        }
                        if (object.from) {
                            if (!Array.isArray(object.from))
                                throw TypeError(".google.firestore.v1.StructuredQuery.from: array expected");
                            message.from = [];
                            for (var i = 0; i < object.from.length; ++i) {
                                if (typeof object.from[i] !== "object")
                                    throw TypeError(".google.firestore.v1.StructuredQuery.from: object expected");
                                message.from[i] = $root.google.firestore.v1.StructuredQuery.CollectionSelector.fromObject(object.from[i]);
                            }
                        }
                        if (object.where != null) {
                            if (typeof object.where !== "object")
                                throw TypeError(".google.firestore.v1.StructuredQuery.where: object expected");
                            message.where = $root.google.firestore.v1.StructuredQuery.Filter.fromObject(object.where);
                        }
                        if (object.orderBy) {
                            if (!Array.isArray(object.orderBy))
                                throw TypeError(".google.firestore.v1.StructuredQuery.orderBy: array expected");
                            message.orderBy = [];
                            for (var i = 0; i < object.orderBy.length; ++i) {
                                if (typeof object.orderBy[i] !== "object")
                                    throw TypeError(".google.firestore.v1.StructuredQuery.orderBy: object expected");
                                message.orderBy[i] = $root.google.firestore.v1.StructuredQuery.Order.fromObject(object.orderBy[i]);
                            }
                        }
                        if (object.startAt != null) {
                            if (typeof object.startAt !== "object")
                                throw TypeError(".google.firestore.v1.StructuredQuery.startAt: object expected");
                            message.startAt = $root.google.firestore.v1.Cursor.fromObject(object.startAt);
                        }
                        if (object.endAt != null) {
                            if (typeof object.endAt !== "object")
                                throw TypeError(".google.firestore.v1.StructuredQuery.endAt: object expected");
                            message.endAt = $root.google.firestore.v1.Cursor.fromObject(object.endAt);
                        }
                        if (object.offset != null)
                            message.offset = object.offset | 0;
                        if (object.limit != null) {
                            if (typeof object.limit !== "object")
                                throw TypeError(".google.firestore.v1.StructuredQuery.limit: object expected");
                            message.limit = $root.google.protobuf.Int32Value.fromObject(object.limit);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a StructuredQuery message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.StructuredQuery
                     * @static
                     * @param {google.firestore.v1.StructuredQuery} message StructuredQuery
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    StructuredQuery.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults) {
                            object.from = [];
                            object.orderBy = [];
                        }
                        if (options.defaults) {
                            object.select = null;
                            object.where = null;
                            object.limit = null;
                            object.offset = 0;
                            object.startAt = null;
                            object.endAt = null;
                        }
                        if (message.select != null && message.hasOwnProperty("select"))
                            object.select = $root.google.firestore.v1.StructuredQuery.Projection.toObject(message.select, options);
                        if (message.from && message.from.length) {
                            object.from = [];
                            for (var j = 0; j < message.from.length; ++j)
                                object.from[j] = $root.google.firestore.v1.StructuredQuery.CollectionSelector.toObject(message.from[j], options);
                        }
                        if (message.where != null && message.hasOwnProperty("where"))
                            object.where = $root.google.firestore.v1.StructuredQuery.Filter.toObject(message.where, options);
                        if (message.orderBy && message.orderBy.length) {
                            object.orderBy = [];
                            for (var j = 0; j < message.orderBy.length; ++j)
                                object.orderBy[j] = $root.google.firestore.v1.StructuredQuery.Order.toObject(message.orderBy[j], options);
                        }
                        if (message.limit != null && message.hasOwnProperty("limit"))
                            object.limit = $root.google.protobuf.Int32Value.toObject(message.limit, options);
                        if (message.offset != null && message.hasOwnProperty("offset"))
                            object.offset = message.offset;
                        if (message.startAt != null && message.hasOwnProperty("startAt"))
                            object.startAt = $root.google.firestore.v1.Cursor.toObject(message.startAt, options);
                        if (message.endAt != null && message.hasOwnProperty("endAt"))
                            object.endAt = $root.google.firestore.v1.Cursor.toObject(message.endAt, options);
                        return object;
                    };
    
                    /**
                     * Converts this StructuredQuery to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.StructuredQuery
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    StructuredQuery.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    StructuredQuery.CollectionSelector = (function() {
    
                        /**
                         * Properties of a CollectionSelector.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @interface ICollectionSelector
                         * @property {string|null} [collectionId] CollectionSelector collectionId
                         * @property {boolean|null} [allDescendants] CollectionSelector allDescendants
                         */
    
                        /**
                         * Constructs a new CollectionSelector.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @classdesc Represents a CollectionSelector.
                         * @implements ICollectionSelector
                         * @constructor
                         * @param {google.firestore.v1.StructuredQuery.ICollectionSelector=} [properties] Properties to set
                         */
                        function CollectionSelector(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * CollectionSelector collectionId.
                         * @member {string} collectionId
                         * @memberof google.firestore.v1.StructuredQuery.CollectionSelector
                         * @instance
                         */
                        CollectionSelector.prototype.collectionId = "";
    
                        /**
                         * CollectionSelector allDescendants.
                         * @member {boolean} allDescendants
                         * @memberof google.firestore.v1.StructuredQuery.CollectionSelector
                         * @instance
                         */
                        CollectionSelector.prototype.allDescendants = false;
    
                        /**
                         * Creates a CollectionSelector message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.StructuredQuery.CollectionSelector
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.StructuredQuery.CollectionSelector} CollectionSelector
                         */
                        CollectionSelector.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.StructuredQuery.CollectionSelector)
                                return object;
                            var message = new $root.google.firestore.v1.StructuredQuery.CollectionSelector();
                            if (object.collectionId != null)
                                message.collectionId = String(object.collectionId);
                            if (object.allDescendants != null)
                                message.allDescendants = Boolean(object.allDescendants);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a CollectionSelector message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.StructuredQuery.CollectionSelector
                         * @static
                         * @param {google.firestore.v1.StructuredQuery.CollectionSelector} message CollectionSelector
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        CollectionSelector.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.collectionId = "";
                                object.allDescendants = false;
                            }
                            if (message.collectionId != null && message.hasOwnProperty("collectionId"))
                                object.collectionId = message.collectionId;
                            if (message.allDescendants != null && message.hasOwnProperty("allDescendants"))
                                object.allDescendants = message.allDescendants;
                            return object;
                        };
    
                        /**
                         * Converts this CollectionSelector to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.StructuredQuery.CollectionSelector
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        CollectionSelector.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        return CollectionSelector;
                    })();
    
                    StructuredQuery.Filter = (function() {
    
                        /**
                         * Properties of a Filter.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @interface IFilter
                         * @property {google.firestore.v1.StructuredQuery.ICompositeFilter|null} [compositeFilter] Filter compositeFilter
                         * @property {google.firestore.v1.StructuredQuery.IFieldFilter|null} [fieldFilter] Filter fieldFilter
                         * @property {google.firestore.v1.StructuredQuery.IUnaryFilter|null} [unaryFilter] Filter unaryFilter
                         */
    
                        /**
                         * Constructs a new Filter.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @classdesc Represents a Filter.
                         * @implements IFilter
                         * @constructor
                         * @param {google.firestore.v1.StructuredQuery.IFilter=} [properties] Properties to set
                         */
                        function Filter(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * Filter compositeFilter.
                         * @member {google.firestore.v1.StructuredQuery.ICompositeFilter|null|undefined} compositeFilter
                         * @memberof google.firestore.v1.StructuredQuery.Filter
                         * @instance
                         */
                        Filter.prototype.compositeFilter = null;
    
                        /**
                         * Filter fieldFilter.
                         * @member {google.firestore.v1.StructuredQuery.IFieldFilter|null|undefined} fieldFilter
                         * @memberof google.firestore.v1.StructuredQuery.Filter
                         * @instance
                         */
                        Filter.prototype.fieldFilter = null;
    
                        /**
                         * Filter unaryFilter.
                         * @member {google.firestore.v1.StructuredQuery.IUnaryFilter|null|undefined} unaryFilter
                         * @memberof google.firestore.v1.StructuredQuery.Filter
                         * @instance
                         */
                        Filter.prototype.unaryFilter = null;
    
                        // OneOf field names bound to virtual getters and setters
                        var $oneOfFields;
    
                        /**
                         * Filter filterType.
                         * @member {"compositeFilter"|"fieldFilter"|"unaryFilter"|undefined} filterType
                         * @memberof google.firestore.v1.StructuredQuery.Filter
                         * @instance
                         */
                        Object.defineProperty(Filter.prototype, "filterType", {
                            get: $util.oneOfGetter($oneOfFields = ["compositeFilter", "fieldFilter", "unaryFilter"]),
                            set: $util.oneOfSetter($oneOfFields)
                        });
    
                        /**
                         * Creates a Filter message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.StructuredQuery.Filter
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.StructuredQuery.Filter} Filter
                         */
                        Filter.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.StructuredQuery.Filter)
                                return object;
                            var message = new $root.google.firestore.v1.StructuredQuery.Filter();
                            if (object.compositeFilter != null) {
                                if (typeof object.compositeFilter !== "object")
                                    throw TypeError(".google.firestore.v1.StructuredQuery.Filter.compositeFilter: object expected");
                                message.compositeFilter = $root.google.firestore.v1.StructuredQuery.CompositeFilter.fromObject(object.compositeFilter);
                            }
                            if (object.fieldFilter != null) {
                                if (typeof object.fieldFilter !== "object")
                                    throw TypeError(".google.firestore.v1.StructuredQuery.Filter.fieldFilter: object expected");
                                message.fieldFilter = $root.google.firestore.v1.StructuredQuery.FieldFilter.fromObject(object.fieldFilter);
                            }
                            if (object.unaryFilter != null) {
                                if (typeof object.unaryFilter !== "object")
                                    throw TypeError(".google.firestore.v1.StructuredQuery.Filter.unaryFilter: object expected");
                                message.unaryFilter = $root.google.firestore.v1.StructuredQuery.UnaryFilter.fromObject(object.unaryFilter);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a Filter message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.StructuredQuery.Filter
                         * @static
                         * @param {google.firestore.v1.StructuredQuery.Filter} message Filter
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Filter.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (message.compositeFilter != null && message.hasOwnProperty("compositeFilter")) {
                                object.compositeFilter = $root.google.firestore.v1.StructuredQuery.CompositeFilter.toObject(message.compositeFilter, options);
                                if (options.oneofs)
                                    object.filterType = "compositeFilter";
                            }
                            if (message.fieldFilter != null && message.hasOwnProperty("fieldFilter")) {
                                object.fieldFilter = $root.google.firestore.v1.StructuredQuery.FieldFilter.toObject(message.fieldFilter, options);
                                if (options.oneofs)
                                    object.filterType = "fieldFilter";
                            }
                            if (message.unaryFilter != null && message.hasOwnProperty("unaryFilter")) {
                                object.unaryFilter = $root.google.firestore.v1.StructuredQuery.UnaryFilter.toObject(message.unaryFilter, options);
                                if (options.oneofs)
                                    object.filterType = "unaryFilter";
                            }
                            return object;
                        };
    
                        /**
                         * Converts this Filter to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.StructuredQuery.Filter
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Filter.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        return Filter;
                    })();
    
                    StructuredQuery.CompositeFilter = (function() {
    
                        /**
                         * Properties of a CompositeFilter.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @interface ICompositeFilter
                         * @property {google.firestore.v1.StructuredQuery.CompositeFilter.Operator|null} [op] CompositeFilter op
                         * @property {Array.<google.firestore.v1.StructuredQuery.IFilter>|null} [filters] CompositeFilter filters
                         */
    
                        /**
                         * Constructs a new CompositeFilter.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @classdesc Represents a CompositeFilter.
                         * @implements ICompositeFilter
                         * @constructor
                         * @param {google.firestore.v1.StructuredQuery.ICompositeFilter=} [properties] Properties to set
                         */
                        function CompositeFilter(properties) {
                            this.filters = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * CompositeFilter op.
                         * @member {google.firestore.v1.StructuredQuery.CompositeFilter.Operator} op
                         * @memberof google.firestore.v1.StructuredQuery.CompositeFilter
                         * @instance
                         */
                        CompositeFilter.prototype.op = 0;
    
                        /**
                         * CompositeFilter filters.
                         * @member {Array.<google.firestore.v1.StructuredQuery.IFilter>} filters
                         * @memberof google.firestore.v1.StructuredQuery.CompositeFilter
                         * @instance
                         */
                        CompositeFilter.prototype.filters = $util.emptyArray;
    
                        /**
                         * Creates a CompositeFilter message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.StructuredQuery.CompositeFilter
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.StructuredQuery.CompositeFilter} CompositeFilter
                         */
                        CompositeFilter.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.StructuredQuery.CompositeFilter)
                                return object;
                            var message = new $root.google.firestore.v1.StructuredQuery.CompositeFilter();
                            switch (object.op) {
                            case "OPERATOR_UNSPECIFIED":
                            case 0:
                                message.op = 0;
                                break;
                            case "AND":
                            case 1:
                                message.op = 1;
                                break;
                            }
                            if (object.filters) {
                                if (!Array.isArray(object.filters))
                                    throw TypeError(".google.firestore.v1.StructuredQuery.CompositeFilter.filters: array expected");
                                message.filters = [];
                                for (var i = 0; i < object.filters.length; ++i) {
                                    if (typeof object.filters[i] !== "object")
                                        throw TypeError(".google.firestore.v1.StructuredQuery.CompositeFilter.filters: object expected");
                                    message.filters[i] = $root.google.firestore.v1.StructuredQuery.Filter.fromObject(object.filters[i]);
                                }
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a CompositeFilter message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.StructuredQuery.CompositeFilter
                         * @static
                         * @param {google.firestore.v1.StructuredQuery.CompositeFilter} message CompositeFilter
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        CompositeFilter.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.filters = [];
                            if (options.defaults)
                                object.op = options.enums === String ? "OPERATOR_UNSPECIFIED" : 0;
                            if (message.op != null && message.hasOwnProperty("op"))
                                object.op = options.enums === String ? $root.google.firestore.v1.StructuredQuery.CompositeFilter.Operator[message.op] : message.op;
                            if (message.filters && message.filters.length) {
                                object.filters = [];
                                for (var j = 0; j < message.filters.length; ++j)
                                    object.filters[j] = $root.google.firestore.v1.StructuredQuery.Filter.toObject(message.filters[j], options);
                            }
                            return object;
                        };
    
                        /**
                         * Converts this CompositeFilter to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.StructuredQuery.CompositeFilter
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        CompositeFilter.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Operator enum.
                         * @name google.firestore.v1.StructuredQuery.CompositeFilter.Operator
                         * @enum {string}
                         * @property {string} OPERATOR_UNSPECIFIED=OPERATOR_UNSPECIFIED OPERATOR_UNSPECIFIED value
                         * @property {string} AND=AND AND value
                         */
                        CompositeFilter.Operator = (function() {
                            var valuesById = {}, values = Object.create(valuesById);
                            values[valuesById[0] = "OPERATOR_UNSPECIFIED"] = "OPERATOR_UNSPECIFIED";
                            values[valuesById[1] = "AND"] = "AND";
                            return values;
                        })();
    
                        return CompositeFilter;
                    })();
    
                    StructuredQuery.FieldFilter = (function() {
    
                        /**
                         * Properties of a FieldFilter.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @interface IFieldFilter
                         * @property {google.firestore.v1.StructuredQuery.IFieldReference|null} [field] FieldFilter field
                         * @property {google.firestore.v1.StructuredQuery.FieldFilter.Operator|null} [op] FieldFilter op
                         * @property {google.firestore.v1.IValue|null} [value] FieldFilter value
                         */
    
                        /**
                         * Constructs a new FieldFilter.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @classdesc Represents a FieldFilter.
                         * @implements IFieldFilter
                         * @constructor
                         * @param {google.firestore.v1.StructuredQuery.IFieldFilter=} [properties] Properties to set
                         */
                        function FieldFilter(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * FieldFilter field.
                         * @member {google.firestore.v1.StructuredQuery.IFieldReference|null|undefined} field
                         * @memberof google.firestore.v1.StructuredQuery.FieldFilter
                         * @instance
                         */
                        FieldFilter.prototype.field = null;
    
                        /**
                         * FieldFilter op.
                         * @member {google.firestore.v1.StructuredQuery.FieldFilter.Operator} op
                         * @memberof google.firestore.v1.StructuredQuery.FieldFilter
                         * @instance
                         */
                        FieldFilter.prototype.op = 0;
    
                        /**
                         * FieldFilter value.
                         * @member {google.firestore.v1.IValue|null|undefined} value
                         * @memberof google.firestore.v1.StructuredQuery.FieldFilter
                         * @instance
                         */
                        FieldFilter.prototype.value = null;
    
                        /**
                         * Creates a FieldFilter message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.StructuredQuery.FieldFilter
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.StructuredQuery.FieldFilter} FieldFilter
                         */
                        FieldFilter.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.StructuredQuery.FieldFilter)
                                return object;
                            var message = new $root.google.firestore.v1.StructuredQuery.FieldFilter();
                            if (object.field != null) {
                                if (typeof object.field !== "object")
                                    throw TypeError(".google.firestore.v1.StructuredQuery.FieldFilter.field: object expected");
                                message.field = $root.google.firestore.v1.StructuredQuery.FieldReference.fromObject(object.field);
                            }
                            switch (object.op) {
                            case "OPERATOR_UNSPECIFIED":
                            case 0:
                                message.op = 0;
                                break;
                            case "LESS_THAN":
                            case 1:
                                message.op = 1;
                                break;
                            case "LESS_THAN_OR_EQUAL":
                            case 2:
                                message.op = 2;
                                break;
                            case "GREATER_THAN":
                            case 3:
                                message.op = 3;
                                break;
                            case "GREATER_THAN_OR_EQUAL":
                            case 4:
                                message.op = 4;
                                break;
                            case "EQUAL":
                            case 5:
                                message.op = 5;
                                break;
                            case "NOT_EQUAL":
                            case 6:
                                message.op = 6;
                                break;
                            case "ARRAY_CONTAINS":
                            case 7:
                                message.op = 7;
                                break;
                            case "IN":
                            case 8:
                                message.op = 8;
                                break;
                            case "ARRAY_CONTAINS_ANY":
                            case 9:
                                message.op = 9;
                                break;
                            case "NOT_IN":
                            case 10:
                                message.op = 10;
                                break;
                            }
                            if (object.value != null) {
                                if (typeof object.value !== "object")
                                    throw TypeError(".google.firestore.v1.StructuredQuery.FieldFilter.value: object expected");
                                message.value = $root.google.firestore.v1.Value.fromObject(object.value);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a FieldFilter message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.StructuredQuery.FieldFilter
                         * @static
                         * @param {google.firestore.v1.StructuredQuery.FieldFilter} message FieldFilter
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        FieldFilter.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.field = null;
                                object.op = options.enums === String ? "OPERATOR_UNSPECIFIED" : 0;
                                object.value = null;
                            }
                            if (message.field != null && message.hasOwnProperty("field"))
                                object.field = $root.google.firestore.v1.StructuredQuery.FieldReference.toObject(message.field, options);
                            if (message.op != null && message.hasOwnProperty("op"))
                                object.op = options.enums === String ? $root.google.firestore.v1.StructuredQuery.FieldFilter.Operator[message.op] : message.op;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = $root.google.firestore.v1.Value.toObject(message.value, options);
                            return object;
                        };
    
                        /**
                         * Converts this FieldFilter to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.StructuredQuery.FieldFilter
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        FieldFilter.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Operator enum.
                         * @name google.firestore.v1.StructuredQuery.FieldFilter.Operator
                         * @enum {string}
                         * @property {string} OPERATOR_UNSPECIFIED=OPERATOR_UNSPECIFIED OPERATOR_UNSPECIFIED value
                         * @property {string} LESS_THAN=LESS_THAN LESS_THAN value
                         * @property {string} LESS_THAN_OR_EQUAL=LESS_THAN_OR_EQUAL LESS_THAN_OR_EQUAL value
                         * @property {string} GREATER_THAN=GREATER_THAN GREATER_THAN value
                         * @property {string} GREATER_THAN_OR_EQUAL=GREATER_THAN_OR_EQUAL GREATER_THAN_OR_EQUAL value
                         * @property {string} EQUAL=EQUAL EQUAL value
                         * @property {string} NOT_EQUAL=NOT_EQUAL NOT_EQUAL value
                         * @property {string} ARRAY_CONTAINS=ARRAY_CONTAINS ARRAY_CONTAINS value
                         * @property {string} IN=IN IN value
                         * @property {string} ARRAY_CONTAINS_ANY=ARRAY_CONTAINS_ANY ARRAY_CONTAINS_ANY value
                         * @property {string} NOT_IN=NOT_IN NOT_IN value
                         */
                        FieldFilter.Operator = (function() {
                            var valuesById = {}, values = Object.create(valuesById);
                            values[valuesById[0] = "OPERATOR_UNSPECIFIED"] = "OPERATOR_UNSPECIFIED";
                            values[valuesById[1] = "LESS_THAN"] = "LESS_THAN";
                            values[valuesById[2] = "LESS_THAN_OR_EQUAL"] = "LESS_THAN_OR_EQUAL";
                            values[valuesById[3] = "GREATER_THAN"] = "GREATER_THAN";
                            values[valuesById[4] = "GREATER_THAN_OR_EQUAL"] = "GREATER_THAN_OR_EQUAL";
                            values[valuesById[5] = "EQUAL"] = "EQUAL";
                            values[valuesById[6] = "NOT_EQUAL"] = "NOT_EQUAL";
                            values[valuesById[7] = "ARRAY_CONTAINS"] = "ARRAY_CONTAINS";
                            values[valuesById[8] = "IN"] = "IN";
                            values[valuesById[9] = "ARRAY_CONTAINS_ANY"] = "ARRAY_CONTAINS_ANY";
                            values[valuesById[10] = "NOT_IN"] = "NOT_IN";
                            return values;
                        })();
    
                        return FieldFilter;
                    })();
    
                    StructuredQuery.UnaryFilter = (function() {
    
                        /**
                         * Properties of an UnaryFilter.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @interface IUnaryFilter
                         * @property {google.firestore.v1.StructuredQuery.UnaryFilter.Operator|null} [op] UnaryFilter op
                         * @property {google.firestore.v1.StructuredQuery.IFieldReference|null} [field] UnaryFilter field
                         */
    
                        /**
                         * Constructs a new UnaryFilter.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @classdesc Represents an UnaryFilter.
                         * @implements IUnaryFilter
                         * @constructor
                         * @param {google.firestore.v1.StructuredQuery.IUnaryFilter=} [properties] Properties to set
                         */
                        function UnaryFilter(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * UnaryFilter op.
                         * @member {google.firestore.v1.StructuredQuery.UnaryFilter.Operator} op
                         * @memberof google.firestore.v1.StructuredQuery.UnaryFilter
                         * @instance
                         */
                        UnaryFilter.prototype.op = 0;
    
                        /**
                         * UnaryFilter field.
                         * @member {google.firestore.v1.StructuredQuery.IFieldReference|null|undefined} field
                         * @memberof google.firestore.v1.StructuredQuery.UnaryFilter
                         * @instance
                         */
                        UnaryFilter.prototype.field = null;
    
                        // OneOf field names bound to virtual getters and setters
                        var $oneOfFields;
    
                        /**
                         * UnaryFilter operandType.
                         * @member {"field"|undefined} operandType
                         * @memberof google.firestore.v1.StructuredQuery.UnaryFilter
                         * @instance
                         */
                        Object.defineProperty(UnaryFilter.prototype, "operandType", {
                            get: $util.oneOfGetter($oneOfFields = ["field"]),
                            set: $util.oneOfSetter($oneOfFields)
                        });
    
                        /**
                         * Creates an UnaryFilter message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.StructuredQuery.UnaryFilter
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.StructuredQuery.UnaryFilter} UnaryFilter
                         */
                        UnaryFilter.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.StructuredQuery.UnaryFilter)
                                return object;
                            var message = new $root.google.firestore.v1.StructuredQuery.UnaryFilter();
                            switch (object.op) {
                            case "OPERATOR_UNSPECIFIED":
                            case 0:
                                message.op = 0;
                                break;
                            case "IS_NAN":
                            case 2:
                                message.op = 2;
                                break;
                            case "IS_NULL":
                            case 3:
                                message.op = 3;
                                break;
                            case "IS_NOT_NAN":
                            case 4:
                                message.op = 4;
                                break;
                            case "IS_NOT_NULL":
                            case 5:
                                message.op = 5;
                                break;
                            }
                            if (object.field != null) {
                                if (typeof object.field !== "object")
                                    throw TypeError(".google.firestore.v1.StructuredQuery.UnaryFilter.field: object expected");
                                message.field = $root.google.firestore.v1.StructuredQuery.FieldReference.fromObject(object.field);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an UnaryFilter message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.StructuredQuery.UnaryFilter
                         * @static
                         * @param {google.firestore.v1.StructuredQuery.UnaryFilter} message UnaryFilter
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        UnaryFilter.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.op = options.enums === String ? "OPERATOR_UNSPECIFIED" : 0;
                            if (message.op != null && message.hasOwnProperty("op"))
                                object.op = options.enums === String ? $root.google.firestore.v1.StructuredQuery.UnaryFilter.Operator[message.op] : message.op;
                            if (message.field != null && message.hasOwnProperty("field")) {
                                object.field = $root.google.firestore.v1.StructuredQuery.FieldReference.toObject(message.field, options);
                                if (options.oneofs)
                                    object.operandType = "field";
                            }
                            return object;
                        };
    
                        /**
                         * Converts this UnaryFilter to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.StructuredQuery.UnaryFilter
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        UnaryFilter.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Operator enum.
                         * @name google.firestore.v1.StructuredQuery.UnaryFilter.Operator
                         * @enum {string}
                         * @property {string} OPERATOR_UNSPECIFIED=OPERATOR_UNSPECIFIED OPERATOR_UNSPECIFIED value
                         * @property {string} IS_NAN=IS_NAN IS_NAN value
                         * @property {string} IS_NULL=IS_NULL IS_NULL value
                         * @property {string} IS_NOT_NAN=IS_NOT_NAN IS_NOT_NAN value
                         * @property {string} IS_NOT_NULL=IS_NOT_NULL IS_NOT_NULL value
                         */
                        UnaryFilter.Operator = (function() {
                            var valuesById = {}, values = Object.create(valuesById);
                            values[valuesById[0] = "OPERATOR_UNSPECIFIED"] = "OPERATOR_UNSPECIFIED";
                            values[valuesById[2] = "IS_NAN"] = "IS_NAN";
                            values[valuesById[3] = "IS_NULL"] = "IS_NULL";
                            values[valuesById[4] = "IS_NOT_NAN"] = "IS_NOT_NAN";
                            values[valuesById[5] = "IS_NOT_NULL"] = "IS_NOT_NULL";
                            return values;
                        })();
    
                        return UnaryFilter;
                    })();
    
                    StructuredQuery.Order = (function() {
    
                        /**
                         * Properties of an Order.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @interface IOrder
                         * @property {google.firestore.v1.StructuredQuery.IFieldReference|null} [field] Order field
                         * @property {google.firestore.v1.StructuredQuery.Direction|null} [direction] Order direction
                         */
    
                        /**
                         * Constructs a new Order.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @classdesc Represents an Order.
                         * @implements IOrder
                         * @constructor
                         * @param {google.firestore.v1.StructuredQuery.IOrder=} [properties] Properties to set
                         */
                        function Order(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * Order field.
                         * @member {google.firestore.v1.StructuredQuery.IFieldReference|null|undefined} field
                         * @memberof google.firestore.v1.StructuredQuery.Order
                         * @instance
                         */
                        Order.prototype.field = null;
    
                        /**
                         * Order direction.
                         * @member {google.firestore.v1.StructuredQuery.Direction} direction
                         * @memberof google.firestore.v1.StructuredQuery.Order
                         * @instance
                         */
                        Order.prototype.direction = 0;
    
                        /**
                         * Creates an Order message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.StructuredQuery.Order
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.StructuredQuery.Order} Order
                         */
                        Order.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.StructuredQuery.Order)
                                return object;
                            var message = new $root.google.firestore.v1.StructuredQuery.Order();
                            if (object.field != null) {
                                if (typeof object.field !== "object")
                                    throw TypeError(".google.firestore.v1.StructuredQuery.Order.field: object expected");
                                message.field = $root.google.firestore.v1.StructuredQuery.FieldReference.fromObject(object.field);
                            }
                            switch (object.direction) {
                            case "DIRECTION_UNSPECIFIED":
                            case 0:
                                message.direction = 0;
                                break;
                            case "ASCENDING":
                            case 1:
                                message.direction = 1;
                                break;
                            case "DESCENDING":
                            case 2:
                                message.direction = 2;
                                break;
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an Order message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.StructuredQuery.Order
                         * @static
                         * @param {google.firestore.v1.StructuredQuery.Order} message Order
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Order.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.field = null;
                                object.direction = options.enums === String ? "DIRECTION_UNSPECIFIED" : 0;
                            }
                            if (message.field != null && message.hasOwnProperty("field"))
                                object.field = $root.google.firestore.v1.StructuredQuery.FieldReference.toObject(message.field, options);
                            if (message.direction != null && message.hasOwnProperty("direction"))
                                object.direction = options.enums === String ? $root.google.firestore.v1.StructuredQuery.Direction[message.direction] : message.direction;
                            return object;
                        };
    
                        /**
                         * Converts this Order to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.StructuredQuery.Order
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Order.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        return Order;
                    })();
    
                    StructuredQuery.FieldReference = (function() {
    
                        /**
                         * Properties of a FieldReference.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @interface IFieldReference
                         * @property {string|null} [fieldPath] FieldReference fieldPath
                         */
    
                        /**
                         * Constructs a new FieldReference.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @classdesc Represents a FieldReference.
                         * @implements IFieldReference
                         * @constructor
                         * @param {google.firestore.v1.StructuredQuery.IFieldReference=} [properties] Properties to set
                         */
                        function FieldReference(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * FieldReference fieldPath.
                         * @member {string} fieldPath
                         * @memberof google.firestore.v1.StructuredQuery.FieldReference
                         * @instance
                         */
                        FieldReference.prototype.fieldPath = "";
    
                        /**
                         * Creates a FieldReference message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.StructuredQuery.FieldReference
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.StructuredQuery.FieldReference} FieldReference
                         */
                        FieldReference.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.StructuredQuery.FieldReference)
                                return object;
                            var message = new $root.google.firestore.v1.StructuredQuery.FieldReference();
                            if (object.fieldPath != null)
                                message.fieldPath = String(object.fieldPath);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a FieldReference message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.StructuredQuery.FieldReference
                         * @static
                         * @param {google.firestore.v1.StructuredQuery.FieldReference} message FieldReference
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        FieldReference.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.fieldPath = "";
                            if (message.fieldPath != null && message.hasOwnProperty("fieldPath"))
                                object.fieldPath = message.fieldPath;
                            return object;
                        };
    
                        /**
                         * Converts this FieldReference to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.StructuredQuery.FieldReference
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        FieldReference.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        return FieldReference;
                    })();
    
                    StructuredQuery.Projection = (function() {
    
                        /**
                         * Properties of a Projection.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @interface IProjection
                         * @property {Array.<google.firestore.v1.StructuredQuery.IFieldReference>|null} [fields] Projection fields
                         */
    
                        /**
                         * Constructs a new Projection.
                         * @memberof google.firestore.v1.StructuredQuery
                         * @classdesc Represents a Projection.
                         * @implements IProjection
                         * @constructor
                         * @param {google.firestore.v1.StructuredQuery.IProjection=} [properties] Properties to set
                         */
                        function Projection(properties) {
                            this.fields = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * Projection fields.
                         * @member {Array.<google.firestore.v1.StructuredQuery.IFieldReference>} fields
                         * @memberof google.firestore.v1.StructuredQuery.Projection
                         * @instance
                         */
                        Projection.prototype.fields = $util.emptyArray;
    
                        /**
                         * Creates a Projection message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.StructuredQuery.Projection
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.StructuredQuery.Projection} Projection
                         */
                        Projection.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.StructuredQuery.Projection)
                                return object;
                            var message = new $root.google.firestore.v1.StructuredQuery.Projection();
                            if (object.fields) {
                                if (!Array.isArray(object.fields))
                                    throw TypeError(".google.firestore.v1.StructuredQuery.Projection.fields: array expected");
                                message.fields = [];
                                for (var i = 0; i < object.fields.length; ++i) {
                                    if (typeof object.fields[i] !== "object")
                                        throw TypeError(".google.firestore.v1.StructuredQuery.Projection.fields: object expected");
                                    message.fields[i] = $root.google.firestore.v1.StructuredQuery.FieldReference.fromObject(object.fields[i]);
                                }
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a Projection message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.StructuredQuery.Projection
                         * @static
                         * @param {google.firestore.v1.StructuredQuery.Projection} message Projection
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Projection.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.fields = [];
                            if (message.fields && message.fields.length) {
                                object.fields = [];
                                for (var j = 0; j < message.fields.length; ++j)
                                    object.fields[j] = $root.google.firestore.v1.StructuredQuery.FieldReference.toObject(message.fields[j], options);
                            }
                            return object;
                        };
    
                        /**
                         * Converts this Projection to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.StructuredQuery.Projection
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Projection.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        return Projection;
                    })();
    
                    /**
                     * Direction enum.
                     * @name google.firestore.v1.StructuredQuery.Direction
                     * @enum {string}
                     * @property {string} DIRECTION_UNSPECIFIED=DIRECTION_UNSPECIFIED DIRECTION_UNSPECIFIED value
                     * @property {string} ASCENDING=ASCENDING ASCENDING value
                     * @property {string} DESCENDING=DESCENDING DESCENDING value
                     */
                    StructuredQuery.Direction = (function() {
                        var valuesById = {}, values = Object.create(valuesById);
                        values[valuesById[0] = "DIRECTION_UNSPECIFIED"] = "DIRECTION_UNSPECIFIED";
                        values[valuesById[1] = "ASCENDING"] = "ASCENDING";
                        values[valuesById[2] = "DESCENDING"] = "DESCENDING";
                        return values;
                    })();
    
                    return StructuredQuery;
                })();
    
                v1.Cursor = (function() {
    
                    /**
                     * Properties of a Cursor.
                     * @memberof google.firestore.v1
                     * @interface ICursor
                     * @property {Array.<google.firestore.v1.IValue>|null} [values] Cursor values
                     * @property {boolean|null} [before] Cursor before
                     */
    
                    /**
                     * Constructs a new Cursor.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a Cursor.
                     * @implements ICursor
                     * @constructor
                     * @param {google.firestore.v1.ICursor=} [properties] Properties to set
                     */
                    function Cursor(properties) {
                        this.values = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * Cursor values.
                     * @member {Array.<google.firestore.v1.IValue>} values
                     * @memberof google.firestore.v1.Cursor
                     * @instance
                     */
                    Cursor.prototype.values = $util.emptyArray;
    
                    /**
                     * Cursor before.
                     * @member {boolean} before
                     * @memberof google.firestore.v1.Cursor
                     * @instance
                     */
                    Cursor.prototype.before = false;
    
                    /**
                     * Creates a Cursor message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.Cursor
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.Cursor} Cursor
                     */
                    Cursor.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.Cursor)
                            return object;
                        var message = new $root.google.firestore.v1.Cursor();
                        if (object.values) {
                            if (!Array.isArray(object.values))
                                throw TypeError(".google.firestore.v1.Cursor.values: array expected");
                            message.values = [];
                            for (var i = 0; i < object.values.length; ++i) {
                                if (typeof object.values[i] !== "object")
                                    throw TypeError(".google.firestore.v1.Cursor.values: object expected");
                                message.values[i] = $root.google.firestore.v1.Value.fromObject(object.values[i]);
                            }
                        }
                        if (object.before != null)
                            message.before = Boolean(object.before);
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a Cursor message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.Cursor
                     * @static
                     * @param {google.firestore.v1.Cursor} message Cursor
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Cursor.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.values = [];
                        if (options.defaults)
                            object.before = false;
                        if (message.values && message.values.length) {
                            object.values = [];
                            for (var j = 0; j < message.values.length; ++j)
                                object.values[j] = $root.google.firestore.v1.Value.toObject(message.values[j], options);
                        }
                        if (message.before != null && message.hasOwnProperty("before"))
                            object.before = message.before;
                        return object;
                    };
    
                    /**
                     * Converts this Cursor to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.Cursor
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Cursor.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return Cursor;
                })();
    
                v1.Write = (function() {
    
                    /**
                     * Properties of a Write.
                     * @memberof google.firestore.v1
                     * @interface IWrite
                     * @property {google.firestore.v1.IDocument|null} [update] Write update
                     * @property {string|null} ["delete"] Write delete
                     * @property {google.firestore.v1.IDocumentTransform|null} [transform] Write transform
                     * @property {google.firestore.v1.IDocumentMask|null} [updateMask] Write updateMask
                     * @property {Array.<google.firestore.v1.DocumentTransform.IFieldTransform>|null} [updateTransforms] Write updateTransforms
                     * @property {google.firestore.v1.IPrecondition|null} [currentDocument] Write currentDocument
                     */
    
                    /**
                     * Constructs a new Write.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a Write.
                     * @implements IWrite
                     * @constructor
                     * @param {google.firestore.v1.IWrite=} [properties] Properties to set
                     */
                    function Write(properties) {
                        this.updateTransforms = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * Write update.
                     * @member {google.firestore.v1.IDocument|null|undefined} update
                     * @memberof google.firestore.v1.Write
                     * @instance
                     */
                    Write.prototype.update = null;
    
                    /**
                     * Write delete.
                     * @member {string} delete
                     * @memberof google.firestore.v1.Write
                     * @instance
                     */
                    Write.prototype["delete"] = "";
    
                    /**
                     * Write transform.
                     * @member {google.firestore.v1.IDocumentTransform|null|undefined} transform
                     * @memberof google.firestore.v1.Write
                     * @instance
                     */
                    Write.prototype.transform = null;
    
                    /**
                     * Write updateMask.
                     * @member {google.firestore.v1.IDocumentMask|null|undefined} updateMask
                     * @memberof google.firestore.v1.Write
                     * @instance
                     */
                    Write.prototype.updateMask = null;
    
                    /**
                     * Write updateTransforms.
                     * @member {Array.<google.firestore.v1.DocumentTransform.IFieldTransform>} updateTransforms
                     * @memberof google.firestore.v1.Write
                     * @instance
                     */
                    Write.prototype.updateTransforms = $util.emptyArray;
    
                    /**
                     * Write currentDocument.
                     * @member {google.firestore.v1.IPrecondition|null|undefined} currentDocument
                     * @memberof google.firestore.v1.Write
                     * @instance
                     */
                    Write.prototype.currentDocument = null;
    
                    // OneOf field names bound to virtual getters and setters
                    var $oneOfFields;
    
                    /**
                     * Write operation.
                     * @member {"update"|"delete"|"transform"|undefined} operation
                     * @memberof google.firestore.v1.Write
                     * @instance
                     */
                    Object.defineProperty(Write.prototype, "operation", {
                        get: $util.oneOfGetter($oneOfFields = ["update", "delete", "transform"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });
    
                    /**
                     * Creates a Write message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.Write
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.Write} Write
                     */
                    Write.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.Write)
                            return object;
                        var message = new $root.google.firestore.v1.Write();
                        if (object.update != null) {
                            if (typeof object.update !== "object")
                                throw TypeError(".google.firestore.v1.Write.update: object expected");
                            message.update = $root.google.firestore.v1.Document.fromObject(object.update);
                        }
                        if (object["delete"] != null)
                            message["delete"] = String(object["delete"]);
                        if (object.transform != null) {
                            if (typeof object.transform !== "object")
                                throw TypeError(".google.firestore.v1.Write.transform: object expected");
                            message.transform = $root.google.firestore.v1.DocumentTransform.fromObject(object.transform);
                        }
                        if (object.updateMask != null) {
                            if (typeof object.updateMask !== "object")
                                throw TypeError(".google.firestore.v1.Write.updateMask: object expected");
                            message.updateMask = $root.google.firestore.v1.DocumentMask.fromObject(object.updateMask);
                        }
                        if (object.updateTransforms) {
                            if (!Array.isArray(object.updateTransforms))
                                throw TypeError(".google.firestore.v1.Write.updateTransforms: array expected");
                            message.updateTransforms = [];
                            for (var i = 0; i < object.updateTransforms.length; ++i) {
                                if (typeof object.updateTransforms[i] !== "object")
                                    throw TypeError(".google.firestore.v1.Write.updateTransforms: object expected");
                                message.updateTransforms[i] = $root.google.firestore.v1.DocumentTransform.FieldTransform.fromObject(object.updateTransforms[i]);
                            }
                        }
                        if (object.currentDocument != null) {
                            if (typeof object.currentDocument !== "object")
                                throw TypeError(".google.firestore.v1.Write.currentDocument: object expected");
                            message.currentDocument = $root.google.firestore.v1.Precondition.fromObject(object.currentDocument);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a Write message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.Write
                     * @static
                     * @param {google.firestore.v1.Write} message Write
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Write.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.updateTransforms = [];
                        if (options.defaults) {
                            object.updateMask = null;
                            object.currentDocument = null;
                        }
                        if (message.update != null && message.hasOwnProperty("update")) {
                            object.update = $root.google.firestore.v1.Document.toObject(message.update, options);
                            if (options.oneofs)
                                object.operation = "update";
                        }
                        if (message["delete"] != null && message.hasOwnProperty("delete")) {
                            object["delete"] = message["delete"];
                            if (options.oneofs)
                                object.operation = "delete";
                        }
                        if (message.updateMask != null && message.hasOwnProperty("updateMask"))
                            object.updateMask = $root.google.firestore.v1.DocumentMask.toObject(message.updateMask, options);
                        if (message.currentDocument != null && message.hasOwnProperty("currentDocument"))
                            object.currentDocument = $root.google.firestore.v1.Precondition.toObject(message.currentDocument, options);
                        if (message.transform != null && message.hasOwnProperty("transform")) {
                            object.transform = $root.google.firestore.v1.DocumentTransform.toObject(message.transform, options);
                            if (options.oneofs)
                                object.operation = "transform";
                        }
                        if (message.updateTransforms && message.updateTransforms.length) {
                            object.updateTransforms = [];
                            for (var j = 0; j < message.updateTransforms.length; ++j)
                                object.updateTransforms[j] = $root.google.firestore.v1.DocumentTransform.FieldTransform.toObject(message.updateTransforms[j], options);
                        }
                        return object;
                    };
    
                    /**
                     * Converts this Write to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.Write
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Write.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return Write;
                })();
    
                v1.DocumentTransform = (function() {
    
                    /**
                     * Properties of a DocumentTransform.
                     * @memberof google.firestore.v1
                     * @interface IDocumentTransform
                     * @property {string|null} [document] DocumentTransform document
                     * @property {Array.<google.firestore.v1.DocumentTransform.IFieldTransform>|null} [fieldTransforms] DocumentTransform fieldTransforms
                     */
    
                    /**
                     * Constructs a new DocumentTransform.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a DocumentTransform.
                     * @implements IDocumentTransform
                     * @constructor
                     * @param {google.firestore.v1.IDocumentTransform=} [properties] Properties to set
                     */
                    function DocumentTransform(properties) {
                        this.fieldTransforms = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * DocumentTransform document.
                     * @member {string} document
                     * @memberof google.firestore.v1.DocumentTransform
                     * @instance
                     */
                    DocumentTransform.prototype.document = "";
    
                    /**
                     * DocumentTransform fieldTransforms.
                     * @member {Array.<google.firestore.v1.DocumentTransform.IFieldTransform>} fieldTransforms
                     * @memberof google.firestore.v1.DocumentTransform
                     * @instance
                     */
                    DocumentTransform.prototype.fieldTransforms = $util.emptyArray;
    
                    /**
                     * Creates a DocumentTransform message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.DocumentTransform
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.DocumentTransform} DocumentTransform
                     */
                    DocumentTransform.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.DocumentTransform)
                            return object;
                        var message = new $root.google.firestore.v1.DocumentTransform();
                        if (object.document != null)
                            message.document = String(object.document);
                        if (object.fieldTransforms) {
                            if (!Array.isArray(object.fieldTransforms))
                                throw TypeError(".google.firestore.v1.DocumentTransform.fieldTransforms: array expected");
                            message.fieldTransforms = [];
                            for (var i = 0; i < object.fieldTransforms.length; ++i) {
                                if (typeof object.fieldTransforms[i] !== "object")
                                    throw TypeError(".google.firestore.v1.DocumentTransform.fieldTransforms: object expected");
                                message.fieldTransforms[i] = $root.google.firestore.v1.DocumentTransform.FieldTransform.fromObject(object.fieldTransforms[i]);
                            }
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a DocumentTransform message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.DocumentTransform
                     * @static
                     * @param {google.firestore.v1.DocumentTransform} message DocumentTransform
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    DocumentTransform.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.fieldTransforms = [];
                        if (options.defaults)
                            object.document = "";
                        if (message.document != null && message.hasOwnProperty("document"))
                            object.document = message.document;
                        if (message.fieldTransforms && message.fieldTransforms.length) {
                            object.fieldTransforms = [];
                            for (var j = 0; j < message.fieldTransforms.length; ++j)
                                object.fieldTransforms[j] = $root.google.firestore.v1.DocumentTransform.FieldTransform.toObject(message.fieldTransforms[j], options);
                        }
                        return object;
                    };
    
                    /**
                     * Converts this DocumentTransform to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.DocumentTransform
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    DocumentTransform.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    DocumentTransform.FieldTransform = (function() {
    
                        /**
                         * Properties of a FieldTransform.
                         * @memberof google.firestore.v1.DocumentTransform
                         * @interface IFieldTransform
                         * @property {string|null} [fieldPath] FieldTransform fieldPath
                         * @property {google.firestore.v1.DocumentTransform.FieldTransform.ServerValue|null} [setToServerValue] FieldTransform setToServerValue
                         * @property {google.firestore.v1.IValue|null} [increment] FieldTransform increment
                         * @property {google.firestore.v1.IValue|null} [maximum] FieldTransform maximum
                         * @property {google.firestore.v1.IValue|null} [minimum] FieldTransform minimum
                         * @property {google.firestore.v1.IArrayValue|null} [appendMissingElements] FieldTransform appendMissingElements
                         * @property {google.firestore.v1.IArrayValue|null} [removeAllFromArray] FieldTransform removeAllFromArray
                         */
    
                        /**
                         * Constructs a new FieldTransform.
                         * @memberof google.firestore.v1.DocumentTransform
                         * @classdesc Represents a FieldTransform.
                         * @implements IFieldTransform
                         * @constructor
                         * @param {google.firestore.v1.DocumentTransform.IFieldTransform=} [properties] Properties to set
                         */
                        function FieldTransform(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * FieldTransform fieldPath.
                         * @member {string} fieldPath
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @instance
                         */
                        FieldTransform.prototype.fieldPath = "";
    
                        /**
                         * FieldTransform setToServerValue.
                         * @member {google.firestore.v1.DocumentTransform.FieldTransform.ServerValue} setToServerValue
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @instance
                         */
                        FieldTransform.prototype.setToServerValue = 0;
    
                        /**
                         * FieldTransform increment.
                         * @member {google.firestore.v1.IValue|null|undefined} increment
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @instance
                         */
                        FieldTransform.prototype.increment = null;
    
                        /**
                         * FieldTransform maximum.
                         * @member {google.firestore.v1.IValue|null|undefined} maximum
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @instance
                         */
                        FieldTransform.prototype.maximum = null;
    
                        /**
                         * FieldTransform minimum.
                         * @member {google.firestore.v1.IValue|null|undefined} minimum
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @instance
                         */
                        FieldTransform.prototype.minimum = null;
    
                        /**
                         * FieldTransform appendMissingElements.
                         * @member {google.firestore.v1.IArrayValue|null|undefined} appendMissingElements
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @instance
                         */
                        FieldTransform.prototype.appendMissingElements = null;
    
                        /**
                         * FieldTransform removeAllFromArray.
                         * @member {google.firestore.v1.IArrayValue|null|undefined} removeAllFromArray
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @instance
                         */
                        FieldTransform.prototype.removeAllFromArray = null;
    
                        // OneOf field names bound to virtual getters and setters
                        var $oneOfFields;
    
                        /**
                         * FieldTransform transformType.
                         * @member {"setToServerValue"|"increment"|"maximum"|"minimum"|"appendMissingElements"|"removeAllFromArray"|undefined} transformType
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @instance
                         */
                        Object.defineProperty(FieldTransform.prototype, "transformType", {
                            get: $util.oneOfGetter($oneOfFields = ["setToServerValue", "increment", "maximum", "minimum", "appendMissingElements", "removeAllFromArray"]),
                            set: $util.oneOfSetter($oneOfFields)
                        });
    
                        /**
                         * Creates a FieldTransform message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.v1.DocumentTransform.FieldTransform} FieldTransform
                         */
                        FieldTransform.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.v1.DocumentTransform.FieldTransform)
                                return object;
                            var message = new $root.google.firestore.v1.DocumentTransform.FieldTransform();
                            if (object.fieldPath != null)
                                message.fieldPath = String(object.fieldPath);
                            switch (object.setToServerValue) {
                            case "SERVER_VALUE_UNSPECIFIED":
                            case 0:
                                message.setToServerValue = 0;
                                break;
                            case "REQUEST_TIME":
                            case 1:
                                message.setToServerValue = 1;
                                break;
                            }
                            if (object.increment != null) {
                                if (typeof object.increment !== "object")
                                    throw TypeError(".google.firestore.v1.DocumentTransform.FieldTransform.increment: object expected");
                                message.increment = $root.google.firestore.v1.Value.fromObject(object.increment);
                            }
                            if (object.maximum != null) {
                                if (typeof object.maximum !== "object")
                                    throw TypeError(".google.firestore.v1.DocumentTransform.FieldTransform.maximum: object expected");
                                message.maximum = $root.google.firestore.v1.Value.fromObject(object.maximum);
                            }
                            if (object.minimum != null) {
                                if (typeof object.minimum !== "object")
                                    throw TypeError(".google.firestore.v1.DocumentTransform.FieldTransform.minimum: object expected");
                                message.minimum = $root.google.firestore.v1.Value.fromObject(object.minimum);
                            }
                            if (object.appendMissingElements != null) {
                                if (typeof object.appendMissingElements !== "object")
                                    throw TypeError(".google.firestore.v1.DocumentTransform.FieldTransform.appendMissingElements: object expected");
                                message.appendMissingElements = $root.google.firestore.v1.ArrayValue.fromObject(object.appendMissingElements);
                            }
                            if (object.removeAllFromArray != null) {
                                if (typeof object.removeAllFromArray !== "object")
                                    throw TypeError(".google.firestore.v1.DocumentTransform.FieldTransform.removeAllFromArray: object expected");
                                message.removeAllFromArray = $root.google.firestore.v1.ArrayValue.fromObject(object.removeAllFromArray);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a FieldTransform message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @static
                         * @param {google.firestore.v1.DocumentTransform.FieldTransform} message FieldTransform
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        FieldTransform.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.fieldPath = "";
                            if (message.fieldPath != null && message.hasOwnProperty("fieldPath"))
                                object.fieldPath = message.fieldPath;
                            if (message.setToServerValue != null && message.hasOwnProperty("setToServerValue")) {
                                object.setToServerValue = options.enums === String ? $root.google.firestore.v1.DocumentTransform.FieldTransform.ServerValue[message.setToServerValue] : message.setToServerValue;
                                if (options.oneofs)
                                    object.transformType = "setToServerValue";
                            }
                            if (message.increment != null && message.hasOwnProperty("increment")) {
                                object.increment = $root.google.firestore.v1.Value.toObject(message.increment, options);
                                if (options.oneofs)
                                    object.transformType = "increment";
                            }
                            if (message.maximum != null && message.hasOwnProperty("maximum")) {
                                object.maximum = $root.google.firestore.v1.Value.toObject(message.maximum, options);
                                if (options.oneofs)
                                    object.transformType = "maximum";
                            }
                            if (message.minimum != null && message.hasOwnProperty("minimum")) {
                                object.minimum = $root.google.firestore.v1.Value.toObject(message.minimum, options);
                                if (options.oneofs)
                                    object.transformType = "minimum";
                            }
                            if (message.appendMissingElements != null && message.hasOwnProperty("appendMissingElements")) {
                                object.appendMissingElements = $root.google.firestore.v1.ArrayValue.toObject(message.appendMissingElements, options);
                                if (options.oneofs)
                                    object.transformType = "appendMissingElements";
                            }
                            if (message.removeAllFromArray != null && message.hasOwnProperty("removeAllFromArray")) {
                                object.removeAllFromArray = $root.google.firestore.v1.ArrayValue.toObject(message.removeAllFromArray, options);
                                if (options.oneofs)
                                    object.transformType = "removeAllFromArray";
                            }
                            return object;
                        };
    
                        /**
                         * Converts this FieldTransform to JSON.
                         * @function toJSON
                         * @memberof google.firestore.v1.DocumentTransform.FieldTransform
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        FieldTransform.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * ServerValue enum.
                         * @name google.firestore.v1.DocumentTransform.FieldTransform.ServerValue
                         * @enum {string}
                         * @property {string} SERVER_VALUE_UNSPECIFIED=SERVER_VALUE_UNSPECIFIED SERVER_VALUE_UNSPECIFIED value
                         * @property {string} REQUEST_TIME=REQUEST_TIME REQUEST_TIME value
                         */
                        FieldTransform.ServerValue = (function() {
                            var valuesById = {}, values = Object.create(valuesById);
                            values[valuesById[0] = "SERVER_VALUE_UNSPECIFIED"] = "SERVER_VALUE_UNSPECIFIED";
                            values[valuesById[1] = "REQUEST_TIME"] = "REQUEST_TIME";
                            return values;
                        })();
    
                        return FieldTransform;
                    })();
    
                    return DocumentTransform;
                })();
    
                v1.WriteResult = (function() {
    
                    /**
                     * Properties of a WriteResult.
                     * @memberof google.firestore.v1
                     * @interface IWriteResult
                     * @property {google.protobuf.ITimestamp|null} [updateTime] WriteResult updateTime
                     * @property {Array.<google.firestore.v1.IValue>|null} [transformResults] WriteResult transformResults
                     */
    
                    /**
                     * Constructs a new WriteResult.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a WriteResult.
                     * @implements IWriteResult
                     * @constructor
                     * @param {google.firestore.v1.IWriteResult=} [properties] Properties to set
                     */
                    function WriteResult(properties) {
                        this.transformResults = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * WriteResult updateTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} updateTime
                     * @memberof google.firestore.v1.WriteResult
                     * @instance
                     */
                    WriteResult.prototype.updateTime = null;
    
                    /**
                     * WriteResult transformResults.
                     * @member {Array.<google.firestore.v1.IValue>} transformResults
                     * @memberof google.firestore.v1.WriteResult
                     * @instance
                     */
                    WriteResult.prototype.transformResults = $util.emptyArray;
    
                    /**
                     * Creates a WriteResult message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.WriteResult
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.WriteResult} WriteResult
                     */
                    WriteResult.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.WriteResult)
                            return object;
                        var message = new $root.google.firestore.v1.WriteResult();
                        if (object.updateTime != null) {
                            if (typeof object.updateTime !== "object")
                                throw TypeError(".google.firestore.v1.WriteResult.updateTime: object expected");
                            message.updateTime = $root.google.protobuf.Timestamp.fromObject(object.updateTime);
                        }
                        if (object.transformResults) {
                            if (!Array.isArray(object.transformResults))
                                throw TypeError(".google.firestore.v1.WriteResult.transformResults: array expected");
                            message.transformResults = [];
                            for (var i = 0; i < object.transformResults.length; ++i) {
                                if (typeof object.transformResults[i] !== "object")
                                    throw TypeError(".google.firestore.v1.WriteResult.transformResults: object expected");
                                message.transformResults[i] = $root.google.firestore.v1.Value.fromObject(object.transformResults[i]);
                            }
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a WriteResult message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.WriteResult
                     * @static
                     * @param {google.firestore.v1.WriteResult} message WriteResult
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    WriteResult.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.transformResults = [];
                        if (options.defaults)
                            object.updateTime = null;
                        if (message.updateTime != null && message.hasOwnProperty("updateTime"))
                            object.updateTime = $root.google.protobuf.Timestamp.toObject(message.updateTime, options);
                        if (message.transformResults && message.transformResults.length) {
                            object.transformResults = [];
                            for (var j = 0; j < message.transformResults.length; ++j)
                                object.transformResults[j] = $root.google.firestore.v1.Value.toObject(message.transformResults[j], options);
                        }
                        return object;
                    };
    
                    /**
                     * Converts this WriteResult to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.WriteResult
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    WriteResult.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return WriteResult;
                })();
    
                v1.DocumentChange = (function() {
    
                    /**
                     * Properties of a DocumentChange.
                     * @memberof google.firestore.v1
                     * @interface IDocumentChange
                     * @property {google.firestore.v1.IDocument|null} [document] DocumentChange document
                     * @property {Array.<number>|null} [targetIds] DocumentChange targetIds
                     * @property {Array.<number>|null} [removedTargetIds] DocumentChange removedTargetIds
                     */
    
                    /**
                     * Constructs a new DocumentChange.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a DocumentChange.
                     * @implements IDocumentChange
                     * @constructor
                     * @param {google.firestore.v1.IDocumentChange=} [properties] Properties to set
                     */
                    function DocumentChange(properties) {
                        this.targetIds = [];
                        this.removedTargetIds = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * DocumentChange document.
                     * @member {google.firestore.v1.IDocument|null|undefined} document
                     * @memberof google.firestore.v1.DocumentChange
                     * @instance
                     */
                    DocumentChange.prototype.document = null;
    
                    /**
                     * DocumentChange targetIds.
                     * @member {Array.<number>} targetIds
                     * @memberof google.firestore.v1.DocumentChange
                     * @instance
                     */
                    DocumentChange.prototype.targetIds = $util.emptyArray;
    
                    /**
                     * DocumentChange removedTargetIds.
                     * @member {Array.<number>} removedTargetIds
                     * @memberof google.firestore.v1.DocumentChange
                     * @instance
                     */
                    DocumentChange.prototype.removedTargetIds = $util.emptyArray;
    
                    /**
                     * Creates a DocumentChange message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.DocumentChange
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.DocumentChange} DocumentChange
                     */
                    DocumentChange.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.DocumentChange)
                            return object;
                        var message = new $root.google.firestore.v1.DocumentChange();
                        if (object.document != null) {
                            if (typeof object.document !== "object")
                                throw TypeError(".google.firestore.v1.DocumentChange.document: object expected");
                            message.document = $root.google.firestore.v1.Document.fromObject(object.document);
                        }
                        if (object.targetIds) {
                            if (!Array.isArray(object.targetIds))
                                throw TypeError(".google.firestore.v1.DocumentChange.targetIds: array expected");
                            message.targetIds = [];
                            for (var i = 0; i < object.targetIds.length; ++i)
                                message.targetIds[i] = object.targetIds[i] | 0;
                        }
                        if (object.removedTargetIds) {
                            if (!Array.isArray(object.removedTargetIds))
                                throw TypeError(".google.firestore.v1.DocumentChange.removedTargetIds: array expected");
                            message.removedTargetIds = [];
                            for (var i = 0; i < object.removedTargetIds.length; ++i)
                                message.removedTargetIds[i] = object.removedTargetIds[i] | 0;
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a DocumentChange message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.DocumentChange
                     * @static
                     * @param {google.firestore.v1.DocumentChange} message DocumentChange
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    DocumentChange.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults) {
                            object.targetIds = [];
                            object.removedTargetIds = [];
                        }
                        if (options.defaults)
                            object.document = null;
                        if (message.document != null && message.hasOwnProperty("document"))
                            object.document = $root.google.firestore.v1.Document.toObject(message.document, options);
                        if (message.targetIds && message.targetIds.length) {
                            object.targetIds = [];
                            for (var j = 0; j < message.targetIds.length; ++j)
                                object.targetIds[j] = message.targetIds[j];
                        }
                        if (message.removedTargetIds && message.removedTargetIds.length) {
                            object.removedTargetIds = [];
                            for (var j = 0; j < message.removedTargetIds.length; ++j)
                                object.removedTargetIds[j] = message.removedTargetIds[j];
                        }
                        return object;
                    };
    
                    /**
                     * Converts this DocumentChange to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.DocumentChange
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    DocumentChange.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return DocumentChange;
                })();
    
                v1.DocumentDelete = (function() {
    
                    /**
                     * Properties of a DocumentDelete.
                     * @memberof google.firestore.v1
                     * @interface IDocumentDelete
                     * @property {string|null} [document] DocumentDelete document
                     * @property {Array.<number>|null} [removedTargetIds] DocumentDelete removedTargetIds
                     * @property {google.protobuf.ITimestamp|null} [readTime] DocumentDelete readTime
                     */
    
                    /**
                     * Constructs a new DocumentDelete.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a DocumentDelete.
                     * @implements IDocumentDelete
                     * @constructor
                     * @param {google.firestore.v1.IDocumentDelete=} [properties] Properties to set
                     */
                    function DocumentDelete(properties) {
                        this.removedTargetIds = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * DocumentDelete document.
                     * @member {string} document
                     * @memberof google.firestore.v1.DocumentDelete
                     * @instance
                     */
                    DocumentDelete.prototype.document = "";
    
                    /**
                     * DocumentDelete removedTargetIds.
                     * @member {Array.<number>} removedTargetIds
                     * @memberof google.firestore.v1.DocumentDelete
                     * @instance
                     */
                    DocumentDelete.prototype.removedTargetIds = $util.emptyArray;
    
                    /**
                     * DocumentDelete readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.DocumentDelete
                     * @instance
                     */
                    DocumentDelete.prototype.readTime = null;
    
                    /**
                     * Creates a DocumentDelete message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.DocumentDelete
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.DocumentDelete} DocumentDelete
                     */
                    DocumentDelete.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.DocumentDelete)
                            return object;
                        var message = new $root.google.firestore.v1.DocumentDelete();
                        if (object.document != null)
                            message.document = String(object.document);
                        if (object.removedTargetIds) {
                            if (!Array.isArray(object.removedTargetIds))
                                throw TypeError(".google.firestore.v1.DocumentDelete.removedTargetIds: array expected");
                            message.removedTargetIds = [];
                            for (var i = 0; i < object.removedTargetIds.length; ++i)
                                message.removedTargetIds[i] = object.removedTargetIds[i] | 0;
                        }
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.DocumentDelete.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a DocumentDelete message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.DocumentDelete
                     * @static
                     * @param {google.firestore.v1.DocumentDelete} message DocumentDelete
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    DocumentDelete.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.removedTargetIds = [];
                        if (options.defaults) {
                            object.document = "";
                            object.readTime = null;
                        }
                        if (message.document != null && message.hasOwnProperty("document"))
                            object.document = message.document;
                        if (message.readTime != null && message.hasOwnProperty("readTime"))
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                        if (message.removedTargetIds && message.removedTargetIds.length) {
                            object.removedTargetIds = [];
                            for (var j = 0; j < message.removedTargetIds.length; ++j)
                                object.removedTargetIds[j] = message.removedTargetIds[j];
                        }
                        return object;
                    };
    
                    /**
                     * Converts this DocumentDelete to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.DocumentDelete
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    DocumentDelete.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return DocumentDelete;
                })();
    
                v1.DocumentRemove = (function() {
    
                    /**
                     * Properties of a DocumentRemove.
                     * @memberof google.firestore.v1
                     * @interface IDocumentRemove
                     * @property {string|null} [document] DocumentRemove document
                     * @property {Array.<number>|null} [removedTargetIds] DocumentRemove removedTargetIds
                     * @property {google.protobuf.ITimestamp|null} [readTime] DocumentRemove readTime
                     */
    
                    /**
                     * Constructs a new DocumentRemove.
                     * @memberof google.firestore.v1
                     * @classdesc Represents a DocumentRemove.
                     * @implements IDocumentRemove
                     * @constructor
                     * @param {google.firestore.v1.IDocumentRemove=} [properties] Properties to set
                     */
                    function DocumentRemove(properties) {
                        this.removedTargetIds = [];
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * DocumentRemove document.
                     * @member {string} document
                     * @memberof google.firestore.v1.DocumentRemove
                     * @instance
                     */
                    DocumentRemove.prototype.document = "";
    
                    /**
                     * DocumentRemove removedTargetIds.
                     * @member {Array.<number>} removedTargetIds
                     * @memberof google.firestore.v1.DocumentRemove
                     * @instance
                     */
                    DocumentRemove.prototype.removedTargetIds = $util.emptyArray;
    
                    /**
                     * DocumentRemove readTime.
                     * @member {google.protobuf.ITimestamp|null|undefined} readTime
                     * @memberof google.firestore.v1.DocumentRemove
                     * @instance
                     */
                    DocumentRemove.prototype.readTime = null;
    
                    /**
                     * Creates a DocumentRemove message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.DocumentRemove
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.DocumentRemove} DocumentRemove
                     */
                    DocumentRemove.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.DocumentRemove)
                            return object;
                        var message = new $root.google.firestore.v1.DocumentRemove();
                        if (object.document != null)
                            message.document = String(object.document);
                        if (object.removedTargetIds) {
                            if (!Array.isArray(object.removedTargetIds))
                                throw TypeError(".google.firestore.v1.DocumentRemove.removedTargetIds: array expected");
                            message.removedTargetIds = [];
                            for (var i = 0; i < object.removedTargetIds.length; ++i)
                                message.removedTargetIds[i] = object.removedTargetIds[i] | 0;
                        }
                        if (object.readTime != null) {
                            if (typeof object.readTime !== "object")
                                throw TypeError(".google.firestore.v1.DocumentRemove.readTime: object expected");
                            message.readTime = $root.google.protobuf.Timestamp.fromObject(object.readTime);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a DocumentRemove message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.DocumentRemove
                     * @static
                     * @param {google.firestore.v1.DocumentRemove} message DocumentRemove
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    DocumentRemove.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.arrays || options.defaults)
                            object.removedTargetIds = [];
                        if (options.defaults) {
                            object.document = "";
                            object.readTime = null;
                        }
                        if (message.document != null && message.hasOwnProperty("document"))
                            object.document = message.document;
                        if (message.removedTargetIds && message.removedTargetIds.length) {
                            object.removedTargetIds = [];
                            for (var j = 0; j < message.removedTargetIds.length; ++j)
                                object.removedTargetIds[j] = message.removedTargetIds[j];
                        }
                        if (message.readTime != null && message.hasOwnProperty("readTime"))
                            object.readTime = $root.google.protobuf.Timestamp.toObject(message.readTime, options);
                        return object;
                    };
    
                    /**
                     * Converts this DocumentRemove to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.DocumentRemove
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    DocumentRemove.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return DocumentRemove;
                })();
    
                v1.ExistenceFilter = (function() {
    
                    /**
                     * Properties of an ExistenceFilter.
                     * @memberof google.firestore.v1
                     * @interface IExistenceFilter
                     * @property {number|null} [targetId] ExistenceFilter targetId
                     * @property {number|null} [count] ExistenceFilter count
                     */
    
                    /**
                     * Constructs a new ExistenceFilter.
                     * @memberof google.firestore.v1
                     * @classdesc Represents an ExistenceFilter.
                     * @implements IExistenceFilter
                     * @constructor
                     * @param {google.firestore.v1.IExistenceFilter=} [properties] Properties to set
                     */
                    function ExistenceFilter(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * ExistenceFilter targetId.
                     * @member {number} targetId
                     * @memberof google.firestore.v1.ExistenceFilter
                     * @instance
                     */
                    ExistenceFilter.prototype.targetId = 0;
    
                    /**
                     * ExistenceFilter count.
                     * @member {number} count
                     * @memberof google.firestore.v1.ExistenceFilter
                     * @instance
                     */
                    ExistenceFilter.prototype.count = 0;
    
                    /**
                     * Creates an ExistenceFilter message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.firestore.v1.ExistenceFilter
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.firestore.v1.ExistenceFilter} ExistenceFilter
                     */
                    ExistenceFilter.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.firestore.v1.ExistenceFilter)
                            return object;
                        var message = new $root.google.firestore.v1.ExistenceFilter();
                        if (object.targetId != null)
                            message.targetId = object.targetId | 0;
                        if (object.count != null)
                            message.count = object.count | 0;
                        return message;
                    };
    
                    /**
                     * Creates a plain object from an ExistenceFilter message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.firestore.v1.ExistenceFilter
                     * @static
                     * @param {google.firestore.v1.ExistenceFilter} message ExistenceFilter
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    ExistenceFilter.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.targetId = 0;
                            object.count = 0;
                        }
                        if (message.targetId != null && message.hasOwnProperty("targetId"))
                            object.targetId = message.targetId;
                        if (message.count != null && message.hasOwnProperty("count"))
                            object.count = message.count;
                        return object;
                    };
    
                    /**
                     * Converts this ExistenceFilter to JSON.
                     * @function toJSON
                     * @memberof google.firestore.v1.ExistenceFilter
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    ExistenceFilter.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    return ExistenceFilter;
                })();
    
                return v1;
            })();
    
            return firestore;
        })();
    
        google.api = (function() {
    
            /**
             * Namespace api.
             * @memberof google
             * @namespace
             */
            var api = {};
    
            api.Http = (function() {
    
                /**
                 * Properties of a Http.
                 * @memberof google.api
                 * @interface IHttp
                 * @property {Array.<google.api.IHttpRule>|null} [rules] Http rules
                 */
    
                /**
                 * Constructs a new Http.
                 * @memberof google.api
                 * @classdesc Represents a Http.
                 * @implements IHttp
                 * @constructor
                 * @param {google.api.IHttp=} [properties] Properties to set
                 */
                function Http(properties) {
                    this.rules = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Http rules.
                 * @member {Array.<google.api.IHttpRule>} rules
                 * @memberof google.api.Http
                 * @instance
                 */
                Http.prototype.rules = $util.emptyArray;
    
                /**
                 * Creates a Http message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.Http
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.Http} Http
                 */
                Http.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.Http)
                        return object;
                    var message = new $root.google.api.Http();
                    if (object.rules) {
                        if (!Array.isArray(object.rules))
                            throw TypeError(".google.api.Http.rules: array expected");
                        message.rules = [];
                        for (var i = 0; i < object.rules.length; ++i) {
                            if (typeof object.rules[i] !== "object")
                                throw TypeError(".google.api.Http.rules: object expected");
                            message.rules[i] = $root.google.api.HttpRule.fromObject(object.rules[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a Http message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.Http
                 * @static
                 * @param {google.api.Http} message Http
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Http.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.rules = [];
                    if (message.rules && message.rules.length) {
                        object.rules = [];
                        for (var j = 0; j < message.rules.length; ++j)
                            object.rules[j] = $root.google.api.HttpRule.toObject(message.rules[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this Http to JSON.
                 * @function toJSON
                 * @memberof google.api.Http
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Http.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Http;
            })();
    
            api.HttpRule = (function() {
    
                /**
                 * Properties of a HttpRule.
                 * @memberof google.api
                 * @interface IHttpRule
                 * @property {string|null} [get] HttpRule get
                 * @property {string|null} [put] HttpRule put
                 * @property {string|null} [post] HttpRule post
                 * @property {string|null} ["delete"] HttpRule delete
                 * @property {string|null} [patch] HttpRule patch
                 * @property {google.api.ICustomHttpPattern|null} [custom] HttpRule custom
                 * @property {string|null} [selector] HttpRule selector
                 * @property {string|null} [body] HttpRule body
                 * @property {Array.<google.api.IHttpRule>|null} [additionalBindings] HttpRule additionalBindings
                 */
    
                /**
                 * Constructs a new HttpRule.
                 * @memberof google.api
                 * @classdesc Represents a HttpRule.
                 * @implements IHttpRule
                 * @constructor
                 * @param {google.api.IHttpRule=} [properties] Properties to set
                 */
                function HttpRule(properties) {
                    this.additionalBindings = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * HttpRule get.
                 * @member {string} get
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.get = "";
    
                /**
                 * HttpRule put.
                 * @member {string} put
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.put = "";
    
                /**
                 * HttpRule post.
                 * @member {string} post
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.post = "";
    
                /**
                 * HttpRule delete.
                 * @member {string} delete
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype["delete"] = "";
    
                /**
                 * HttpRule patch.
                 * @member {string} patch
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.patch = "";
    
                /**
                 * HttpRule custom.
                 * @member {google.api.ICustomHttpPattern|null|undefined} custom
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.custom = null;
    
                /**
                 * HttpRule selector.
                 * @member {string} selector
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.selector = "";
    
                /**
                 * HttpRule body.
                 * @member {string} body
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.body = "";
    
                /**
                 * HttpRule additionalBindings.
                 * @member {Array.<google.api.IHttpRule>} additionalBindings
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.additionalBindings = $util.emptyArray;
    
                // OneOf field names bound to virtual getters and setters
                var $oneOfFields;
    
                /**
                 * HttpRule pattern.
                 * @member {"get"|"put"|"post"|"delete"|"patch"|"custom"|undefined} pattern
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                Object.defineProperty(HttpRule.prototype, "pattern", {
                    get: $util.oneOfGetter($oneOfFields = ["get", "put", "post", "delete", "patch", "custom"]),
                    set: $util.oneOfSetter($oneOfFields)
                });
    
                /**
                 * Creates a HttpRule message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.HttpRule
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.HttpRule} HttpRule
                 */
                HttpRule.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.HttpRule)
                        return object;
                    var message = new $root.google.api.HttpRule();
                    if (object.get != null)
                        message.get = String(object.get);
                    if (object.put != null)
                        message.put = String(object.put);
                    if (object.post != null)
                        message.post = String(object.post);
                    if (object["delete"] != null)
                        message["delete"] = String(object["delete"]);
                    if (object.patch != null)
                        message.patch = String(object.patch);
                    if (object.custom != null) {
                        if (typeof object.custom !== "object")
                            throw TypeError(".google.api.HttpRule.custom: object expected");
                        message.custom = $root.google.api.CustomHttpPattern.fromObject(object.custom);
                    }
                    if (object.selector != null)
                        message.selector = String(object.selector);
                    if (object.body != null)
                        message.body = String(object.body);
                    if (object.additionalBindings) {
                        if (!Array.isArray(object.additionalBindings))
                            throw TypeError(".google.api.HttpRule.additionalBindings: array expected");
                        message.additionalBindings = [];
                        for (var i = 0; i < object.additionalBindings.length; ++i) {
                            if (typeof object.additionalBindings[i] !== "object")
                                throw TypeError(".google.api.HttpRule.additionalBindings: object expected");
                            message.additionalBindings[i] = $root.google.api.HttpRule.fromObject(object.additionalBindings[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a HttpRule message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.HttpRule
                 * @static
                 * @param {google.api.HttpRule} message HttpRule
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                HttpRule.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.additionalBindings = [];
                    if (options.defaults) {
                        object.selector = "";
                        object.body = "";
                    }
                    if (message.selector != null && message.hasOwnProperty("selector"))
                        object.selector = message.selector;
                    if (message.get != null && message.hasOwnProperty("get")) {
                        object.get = message.get;
                        if (options.oneofs)
                            object.pattern = "get";
                    }
                    if (message.put != null && message.hasOwnProperty("put")) {
                        object.put = message.put;
                        if (options.oneofs)
                            object.pattern = "put";
                    }
                    if (message.post != null && message.hasOwnProperty("post")) {
                        object.post = message.post;
                        if (options.oneofs)
                            object.pattern = "post";
                    }
                    if (message["delete"] != null && message.hasOwnProperty("delete")) {
                        object["delete"] = message["delete"];
                        if (options.oneofs)
                            object.pattern = "delete";
                    }
                    if (message.patch != null && message.hasOwnProperty("patch")) {
                        object.patch = message.patch;
                        if (options.oneofs)
                            object.pattern = "patch";
                    }
                    if (message.body != null && message.hasOwnProperty("body"))
                        object.body = message.body;
                    if (message.custom != null && message.hasOwnProperty("custom")) {
                        object.custom = $root.google.api.CustomHttpPattern.toObject(message.custom, options);
                        if (options.oneofs)
                            object.pattern = "custom";
                    }
                    if (message.additionalBindings && message.additionalBindings.length) {
                        object.additionalBindings = [];
                        for (var j = 0; j < message.additionalBindings.length; ++j)
                            object.additionalBindings[j] = $root.google.api.HttpRule.toObject(message.additionalBindings[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this HttpRule to JSON.
                 * @function toJSON
                 * @memberof google.api.HttpRule
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                HttpRule.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return HttpRule;
            })();
    
            api.CustomHttpPattern = (function() {
    
                /**
                 * Properties of a CustomHttpPattern.
                 * @memberof google.api
                 * @interface ICustomHttpPattern
                 * @property {string|null} [kind] CustomHttpPattern kind
                 * @property {string|null} [path] CustomHttpPattern path
                 */
    
                /**
                 * Constructs a new CustomHttpPattern.
                 * @memberof google.api
                 * @classdesc Represents a CustomHttpPattern.
                 * @implements ICustomHttpPattern
                 * @constructor
                 * @param {google.api.ICustomHttpPattern=} [properties] Properties to set
                 */
                function CustomHttpPattern(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * CustomHttpPattern kind.
                 * @member {string} kind
                 * @memberof google.api.CustomHttpPattern
                 * @instance
                 */
                CustomHttpPattern.prototype.kind = "";
    
                /**
                 * CustomHttpPattern path.
                 * @member {string} path
                 * @memberof google.api.CustomHttpPattern
                 * @instance
                 */
                CustomHttpPattern.prototype.path = "";
    
                /**
                 * Creates a CustomHttpPattern message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.CustomHttpPattern
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.CustomHttpPattern} CustomHttpPattern
                 */
                CustomHttpPattern.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.CustomHttpPattern)
                        return object;
                    var message = new $root.google.api.CustomHttpPattern();
                    if (object.kind != null)
                        message.kind = String(object.kind);
                    if (object.path != null)
                        message.path = String(object.path);
                    return message;
                };
    
                /**
                 * Creates a plain object from a CustomHttpPattern message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.CustomHttpPattern
                 * @static
                 * @param {google.api.CustomHttpPattern} message CustomHttpPattern
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                CustomHttpPattern.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.kind = "";
                        object.path = "";
                    }
                    if (message.kind != null && message.hasOwnProperty("kind"))
                        object.kind = message.kind;
                    if (message.path != null && message.hasOwnProperty("path"))
                        object.path = message.path;
                    return object;
                };
    
                /**
                 * Converts this CustomHttpPattern to JSON.
                 * @function toJSON
                 * @memberof google.api.CustomHttpPattern
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                CustomHttpPattern.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return CustomHttpPattern;
            })();
    
            /**
             * FieldBehavior enum.
             * @name google.api.FieldBehavior
             * @enum {string}
             * @property {string} FIELD_BEHAVIOR_UNSPECIFIED=FIELD_BEHAVIOR_UNSPECIFIED FIELD_BEHAVIOR_UNSPECIFIED value
             * @property {string} OPTIONAL=OPTIONAL OPTIONAL value
             * @property {string} REQUIRED=REQUIRED REQUIRED value
             * @property {string} OUTPUT_ONLY=OUTPUT_ONLY OUTPUT_ONLY value
             * @property {string} INPUT_ONLY=INPUT_ONLY INPUT_ONLY value
             * @property {string} IMMUTABLE=IMMUTABLE IMMUTABLE value
             */
            api.FieldBehavior = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "FIELD_BEHAVIOR_UNSPECIFIED"] = "FIELD_BEHAVIOR_UNSPECIFIED";
                values[valuesById[1] = "OPTIONAL"] = "OPTIONAL";
                values[valuesById[2] = "REQUIRED"] = "REQUIRED";
                values[valuesById[3] = "OUTPUT_ONLY"] = "OUTPUT_ONLY";
                values[valuesById[4] = "INPUT_ONLY"] = "INPUT_ONLY";
                values[valuesById[5] = "IMMUTABLE"] = "IMMUTABLE";
                return values;
            })();
    
            api.ResourceDescriptor = (function() {
    
                /**
                 * Properties of a ResourceDescriptor.
                 * @memberof google.api
                 * @interface IResourceDescriptor
                 * @property {string|null} [type] ResourceDescriptor type
                 * @property {Array.<string>|null} [pattern] ResourceDescriptor pattern
                 * @property {string|null} [nameField] ResourceDescriptor nameField
                 * @property {google.api.ResourceDescriptor.History|null} [history] ResourceDescriptor history
                 * @property {string|null} [plural] ResourceDescriptor plural
                 * @property {string|null} [singular] ResourceDescriptor singular
                 */
    
                /**
                 * Constructs a new ResourceDescriptor.
                 * @memberof google.api
                 * @classdesc Represents a ResourceDescriptor.
                 * @implements IResourceDescriptor
                 * @constructor
                 * @param {google.api.IResourceDescriptor=} [properties] Properties to set
                 */
                function ResourceDescriptor(properties) {
                    this.pattern = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * ResourceDescriptor type.
                 * @member {string} type
                 * @memberof google.api.ResourceDescriptor
                 * @instance
                 */
                ResourceDescriptor.prototype.type = "";
    
                /**
                 * ResourceDescriptor pattern.
                 * @member {Array.<string>} pattern
                 * @memberof google.api.ResourceDescriptor
                 * @instance
                 */
                ResourceDescriptor.prototype.pattern = $util.emptyArray;
    
                /**
                 * ResourceDescriptor nameField.
                 * @member {string} nameField
                 * @memberof google.api.ResourceDescriptor
                 * @instance
                 */
                ResourceDescriptor.prototype.nameField = "";
    
                /**
                 * ResourceDescriptor history.
                 * @member {google.api.ResourceDescriptor.History} history
                 * @memberof google.api.ResourceDescriptor
                 * @instance
                 */
                ResourceDescriptor.prototype.history = 0;
    
                /**
                 * ResourceDescriptor plural.
                 * @member {string} plural
                 * @memberof google.api.ResourceDescriptor
                 * @instance
                 */
                ResourceDescriptor.prototype.plural = "";
    
                /**
                 * ResourceDescriptor singular.
                 * @member {string} singular
                 * @memberof google.api.ResourceDescriptor
                 * @instance
                 */
                ResourceDescriptor.prototype.singular = "";
    
                /**
                 * Creates a ResourceDescriptor message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.ResourceDescriptor
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.ResourceDescriptor} ResourceDescriptor
                 */
                ResourceDescriptor.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.ResourceDescriptor)
                        return object;
                    var message = new $root.google.api.ResourceDescriptor();
                    if (object.type != null)
                        message.type = String(object.type);
                    if (object.pattern) {
                        if (!Array.isArray(object.pattern))
                            throw TypeError(".google.api.ResourceDescriptor.pattern: array expected");
                        message.pattern = [];
                        for (var i = 0; i < object.pattern.length; ++i)
                            message.pattern[i] = String(object.pattern[i]);
                    }
                    if (object.nameField != null)
                        message.nameField = String(object.nameField);
                    switch (object.history) {
                    case "HISTORY_UNSPECIFIED":
                    case 0:
                        message.history = 0;
                        break;
                    case "ORIGINALLY_SINGLE_PATTERN":
                    case 1:
                        message.history = 1;
                        break;
                    case "FUTURE_MULTI_PATTERN":
                    case 2:
                        message.history = 2;
                        break;
                    }
                    if (object.plural != null)
                        message.plural = String(object.plural);
                    if (object.singular != null)
                        message.singular = String(object.singular);
                    return message;
                };
    
                /**
                 * Creates a plain object from a ResourceDescriptor message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.ResourceDescriptor
                 * @static
                 * @param {google.api.ResourceDescriptor} message ResourceDescriptor
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ResourceDescriptor.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.pattern = [];
                    if (options.defaults) {
                        object.type = "";
                        object.nameField = "";
                        object.history = options.enums === String ? "HISTORY_UNSPECIFIED" : 0;
                        object.plural = "";
                        object.singular = "";
                    }
                    if (message.type != null && message.hasOwnProperty("type"))
                        object.type = message.type;
                    if (message.pattern && message.pattern.length) {
                        object.pattern = [];
                        for (var j = 0; j < message.pattern.length; ++j)
                            object.pattern[j] = message.pattern[j];
                    }
                    if (message.nameField != null && message.hasOwnProperty("nameField"))
                        object.nameField = message.nameField;
                    if (message.history != null && message.hasOwnProperty("history"))
                        object.history = options.enums === String ? $root.google.api.ResourceDescriptor.History[message.history] : message.history;
                    if (message.plural != null && message.hasOwnProperty("plural"))
                        object.plural = message.plural;
                    if (message.singular != null && message.hasOwnProperty("singular"))
                        object.singular = message.singular;
                    return object;
                };
    
                /**
                 * Converts this ResourceDescriptor to JSON.
                 * @function toJSON
                 * @memberof google.api.ResourceDescriptor
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ResourceDescriptor.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * History enum.
                 * @name google.api.ResourceDescriptor.History
                 * @enum {string}
                 * @property {string} HISTORY_UNSPECIFIED=HISTORY_UNSPECIFIED HISTORY_UNSPECIFIED value
                 * @property {string} ORIGINALLY_SINGLE_PATTERN=ORIGINALLY_SINGLE_PATTERN ORIGINALLY_SINGLE_PATTERN value
                 * @property {string} FUTURE_MULTI_PATTERN=FUTURE_MULTI_PATTERN FUTURE_MULTI_PATTERN value
                 */
                ResourceDescriptor.History = (function() {
                    var valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[0] = "HISTORY_UNSPECIFIED"] = "HISTORY_UNSPECIFIED";
                    values[valuesById[1] = "ORIGINALLY_SINGLE_PATTERN"] = "ORIGINALLY_SINGLE_PATTERN";
                    values[valuesById[2] = "FUTURE_MULTI_PATTERN"] = "FUTURE_MULTI_PATTERN";
                    return values;
                })();
    
                return ResourceDescriptor;
            })();
    
            api.ResourceReference = (function() {
    
                /**
                 * Properties of a ResourceReference.
                 * @memberof google.api
                 * @interface IResourceReference
                 * @property {string|null} [type] ResourceReference type
                 * @property {string|null} [childType] ResourceReference childType
                 */
    
                /**
                 * Constructs a new ResourceReference.
                 * @memberof google.api
                 * @classdesc Represents a ResourceReference.
                 * @implements IResourceReference
                 * @constructor
                 * @param {google.api.IResourceReference=} [properties] Properties to set
                 */
                function ResourceReference(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * ResourceReference type.
                 * @member {string} type
                 * @memberof google.api.ResourceReference
                 * @instance
                 */
                ResourceReference.prototype.type = "";
    
                /**
                 * ResourceReference childType.
                 * @member {string} childType
                 * @memberof google.api.ResourceReference
                 * @instance
                 */
                ResourceReference.prototype.childType = "";
    
                /**
                 * Creates a ResourceReference message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.ResourceReference
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.ResourceReference} ResourceReference
                 */
                ResourceReference.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.ResourceReference)
                        return object;
                    var message = new $root.google.api.ResourceReference();
                    if (object.type != null)
                        message.type = String(object.type);
                    if (object.childType != null)
                        message.childType = String(object.childType);
                    return message;
                };
    
                /**
                 * Creates a plain object from a ResourceReference message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.ResourceReference
                 * @static
                 * @param {google.api.ResourceReference} message ResourceReference
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ResourceReference.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.type = "";
                        object.childType = "";
                    }
                    if (message.type != null && message.hasOwnProperty("type"))
                        object.type = message.type;
                    if (message.childType != null && message.hasOwnProperty("childType"))
                        object.childType = message.childType;
                    return object;
                };
    
                /**
                 * Converts this ResourceReference to JSON.
                 * @function toJSON
                 * @memberof google.api.ResourceReference
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ResourceReference.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return ResourceReference;
            })();
    
            return api;
        })();
    
        google.type = (function() {
    
            /**
             * Namespace type.
             * @memberof google
             * @namespace
             */
            var type = {};
    
            type.LatLng = (function() {
    
                /**
                 * Properties of a LatLng.
                 * @memberof google.type
                 * @interface ILatLng
                 * @property {number|null} [latitude] LatLng latitude
                 * @property {number|null} [longitude] LatLng longitude
                 */
    
                /**
                 * Constructs a new LatLng.
                 * @memberof google.type
                 * @classdesc Represents a LatLng.
                 * @implements ILatLng
                 * @constructor
                 * @param {google.type.ILatLng=} [properties] Properties to set
                 */
                function LatLng(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * LatLng latitude.
                 * @member {number} latitude
                 * @memberof google.type.LatLng
                 * @instance
                 */
                LatLng.prototype.latitude = 0;
    
                /**
                 * LatLng longitude.
                 * @member {number} longitude
                 * @memberof google.type.LatLng
                 * @instance
                 */
                LatLng.prototype.longitude = 0;
    
                /**
                 * Creates a LatLng message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.type.LatLng
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.type.LatLng} LatLng
                 */
                LatLng.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.type.LatLng)
                        return object;
                    var message = new $root.google.type.LatLng();
                    if (object.latitude != null)
                        message.latitude = Number(object.latitude);
                    if (object.longitude != null)
                        message.longitude = Number(object.longitude);
                    return message;
                };
    
                /**
                 * Creates a plain object from a LatLng message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.type.LatLng
                 * @static
                 * @param {google.type.LatLng} message LatLng
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                LatLng.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.latitude = 0;
                        object.longitude = 0;
                    }
                    if (message.latitude != null && message.hasOwnProperty("latitude"))
                        object.latitude = options.json && !isFinite(message.latitude) ? String(message.latitude) : message.latitude;
                    if (message.longitude != null && message.hasOwnProperty("longitude"))
                        object.longitude = options.json && !isFinite(message.longitude) ? String(message.longitude) : message.longitude;
                    return object;
                };
    
                /**
                 * Converts this LatLng to JSON.
                 * @function toJSON
                 * @memberof google.type.LatLng
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                LatLng.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return LatLng;
            })();
    
            return type;
        })();
    
        google.rpc = (function() {
    
            /**
             * Namespace rpc.
             * @memberof google
             * @namespace
             */
            var rpc = {};
    
            rpc.Status = (function() {
    
                /**
                 * Properties of a Status.
                 * @memberof google.rpc
                 * @interface IStatus
                 * @property {number|null} [code] Status code
                 * @property {string|null} [message] Status message
                 * @property {Array.<google.protobuf.IAny>|null} [details] Status details
                 */
    
                /**
                 * Constructs a new Status.
                 * @memberof google.rpc
                 * @classdesc Represents a Status.
                 * @implements IStatus
                 * @constructor
                 * @param {google.rpc.IStatus=} [properties] Properties to set
                 */
                function Status(properties) {
                    this.details = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Status code.
                 * @member {number} code
                 * @memberof google.rpc.Status
                 * @instance
                 */
                Status.prototype.code = 0;
    
                /**
                 * Status message.
                 * @member {string} message
                 * @memberof google.rpc.Status
                 * @instance
                 */
                Status.prototype.message = "";
    
                /**
                 * Status details.
                 * @member {Array.<google.protobuf.IAny>} details
                 * @memberof google.rpc.Status
                 * @instance
                 */
                Status.prototype.details = $util.emptyArray;
    
                /**
                 * Creates a Status message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.rpc.Status
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.rpc.Status} Status
                 */
                Status.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.rpc.Status)
                        return object;
                    var message = new $root.google.rpc.Status();
                    if (object.code != null)
                        message.code = object.code | 0;
                    if (object.message != null)
                        message.message = String(object.message);
                    if (object.details) {
                        if (!Array.isArray(object.details))
                            throw TypeError(".google.rpc.Status.details: array expected");
                        message.details = [];
                        for (var i = 0; i < object.details.length; ++i) {
                            if (typeof object.details[i] !== "object")
                                throw TypeError(".google.rpc.Status.details: object expected");
                            message.details[i] = $root.google.protobuf.Any.fromObject(object.details[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a Status message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.rpc.Status
                 * @static
                 * @param {google.rpc.Status} message Status
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Status.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.details = [];
                    if (options.defaults) {
                        object.code = 0;
                        object.message = "";
                    }
                    if (message.code != null && message.hasOwnProperty("code"))
                        object.code = message.code;
                    if (message.message != null && message.hasOwnProperty("message"))
                        object.message = message.message;
                    if (message.details && message.details.length) {
                        object.details = [];
                        for (var j = 0; j < message.details.length; ++j)
                            object.details[j] = $root.google.protobuf.Any.toObject(message.details[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this Status to JSON.
                 * @function toJSON
                 * @memberof google.rpc.Status
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Status.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Status;
            })();
    
            return rpc;
        })();
    
        google.longrunning = (function() {
    
            /**
             * Namespace longrunning.
             * @memberof google
             * @namespace
             */
            var longrunning = {};
    
            longrunning.Operations = (function() {
    
                /**
                 * Constructs a new Operations service.
                 * @memberof google.longrunning
                 * @classdesc Represents an Operations
                 * @extends $protobuf.rpc.Service
                 * @constructor
                 * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
                 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
                 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
                 */
                function Operations(rpcImpl, requestDelimited, responseDelimited) {
                    $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
                }
    
                (Operations.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = Operations;
    
                /**
                 * Callback as used by {@link google.longrunning.Operations#listOperations}.
                 * @memberof google.longrunning.Operations
                 * @typedef ListOperationsCallback
                 * @type {function}
                 * @param {Error|null} error Error, if any
                 * @param {google.longrunning.ListOperationsResponse} [response] ListOperationsResponse
                 */
    
                /**
                 * Calls ListOperations.
                 * @function listOperations
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.IListOperationsRequest} request ListOperationsRequest message or plain object
                 * @param {google.longrunning.Operations.ListOperationsCallback} callback Node-style callback called with the error, if any, and ListOperationsResponse
                 * @returns {undefined}
                 * @variation 1
                 */
                Object.defineProperty(Operations.prototype.listOperations = function listOperations(request, callback) {
                    return this.rpcCall(listOperations, $root.google.longrunning.ListOperationsRequest, $root.google.longrunning.ListOperationsResponse, request, callback);
                }, "name", { value: "ListOperations" });
    
                /**
                 * Calls ListOperations.
                 * @function listOperations
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.IListOperationsRequest} request ListOperationsRequest message or plain object
                 * @returns {Promise<google.longrunning.ListOperationsResponse>} Promise
                 * @variation 2
                 */
    
                /**
                 * Callback as used by {@link google.longrunning.Operations#getOperation}.
                 * @memberof google.longrunning.Operations
                 * @typedef GetOperationCallback
                 * @type {function}
                 * @param {Error|null} error Error, if any
                 * @param {google.longrunning.Operation} [response] Operation
                 */
    
                /**
                 * Calls GetOperation.
                 * @function getOperation
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.IGetOperationRequest} request GetOperationRequest message or plain object
                 * @param {google.longrunning.Operations.GetOperationCallback} callback Node-style callback called with the error, if any, and Operation
                 * @returns {undefined}
                 * @variation 1
                 */
                Object.defineProperty(Operations.prototype.getOperation = function getOperation(request, callback) {
                    return this.rpcCall(getOperation, $root.google.longrunning.GetOperationRequest, $root.google.longrunning.Operation, request, callback);
                }, "name", { value: "GetOperation" });
    
                /**
                 * Calls GetOperation.
                 * @function getOperation
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.IGetOperationRequest} request GetOperationRequest message or plain object
                 * @returns {Promise<google.longrunning.Operation>} Promise
                 * @variation 2
                 */
    
                /**
                 * Callback as used by {@link google.longrunning.Operations#deleteOperation}.
                 * @memberof google.longrunning.Operations
                 * @typedef DeleteOperationCallback
                 * @type {function}
                 * @param {Error|null} error Error, if any
                 * @param {google.protobuf.Empty} [response] Empty
                 */
    
                /**
                 * Calls DeleteOperation.
                 * @function deleteOperation
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.IDeleteOperationRequest} request DeleteOperationRequest message or plain object
                 * @param {google.longrunning.Operations.DeleteOperationCallback} callback Node-style callback called with the error, if any, and Empty
                 * @returns {undefined}
                 * @variation 1
                 */
                Object.defineProperty(Operations.prototype.deleteOperation = function deleteOperation(request, callback) {
                    return this.rpcCall(deleteOperation, $root.google.longrunning.DeleteOperationRequest, $root.google.protobuf.Empty, request, callback);
                }, "name", { value: "DeleteOperation" });
    
                /**
                 * Calls DeleteOperation.
                 * @function deleteOperation
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.IDeleteOperationRequest} request DeleteOperationRequest message or plain object
                 * @returns {Promise<google.protobuf.Empty>} Promise
                 * @variation 2
                 */
    
                /**
                 * Callback as used by {@link google.longrunning.Operations#cancelOperation}.
                 * @memberof google.longrunning.Operations
                 * @typedef CancelOperationCallback
                 * @type {function}
                 * @param {Error|null} error Error, if any
                 * @param {google.protobuf.Empty} [response] Empty
                 */
    
                /**
                 * Calls CancelOperation.
                 * @function cancelOperation
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.ICancelOperationRequest} request CancelOperationRequest message or plain object
                 * @param {google.longrunning.Operations.CancelOperationCallback} callback Node-style callback called with the error, if any, and Empty
                 * @returns {undefined}
                 * @variation 1
                 */
                Object.defineProperty(Operations.prototype.cancelOperation = function cancelOperation(request, callback) {
                    return this.rpcCall(cancelOperation, $root.google.longrunning.CancelOperationRequest, $root.google.protobuf.Empty, request, callback);
                }, "name", { value: "CancelOperation" });
    
                /**
                 * Calls CancelOperation.
                 * @function cancelOperation
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.ICancelOperationRequest} request CancelOperationRequest message or plain object
                 * @returns {Promise<google.protobuf.Empty>} Promise
                 * @variation 2
                 */
    
                /**
                 * Callback as used by {@link google.longrunning.Operations#waitOperation}.
                 * @memberof google.longrunning.Operations
                 * @typedef WaitOperationCallback
                 * @type {function}
                 * @param {Error|null} error Error, if any
                 * @param {google.longrunning.Operation} [response] Operation
                 */
    
                /**
                 * Calls WaitOperation.
                 * @function waitOperation
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.IWaitOperationRequest} request WaitOperationRequest message or plain object
                 * @param {google.longrunning.Operations.WaitOperationCallback} callback Node-style callback called with the error, if any, and Operation
                 * @returns {undefined}
                 * @variation 1
                 */
                Object.defineProperty(Operations.prototype.waitOperation = function waitOperation(request, callback) {
                    return this.rpcCall(waitOperation, $root.google.longrunning.WaitOperationRequest, $root.google.longrunning.Operation, request, callback);
                }, "name", { value: "WaitOperation" });
    
                /**
                 * Calls WaitOperation.
                 * @function waitOperation
                 * @memberof google.longrunning.Operations
                 * @instance
                 * @param {google.longrunning.IWaitOperationRequest} request WaitOperationRequest message or plain object
                 * @returns {Promise<google.longrunning.Operation>} Promise
                 * @variation 2
                 */
    
                return Operations;
            })();
    
            longrunning.Operation = (function() {
    
                /**
                 * Properties of an Operation.
                 * @memberof google.longrunning
                 * @interface IOperation
                 * @property {string|null} [name] Operation name
                 * @property {google.protobuf.IAny|null} [metadata] Operation metadata
                 * @property {boolean|null} [done] Operation done
                 * @property {google.rpc.IStatus|null} [error] Operation error
                 * @property {google.protobuf.IAny|null} [response] Operation response
                 */
    
                /**
                 * Constructs a new Operation.
                 * @memberof google.longrunning
                 * @classdesc Represents an Operation.
                 * @implements IOperation
                 * @constructor
                 * @param {google.longrunning.IOperation=} [properties] Properties to set
                 */
                function Operation(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Operation name.
                 * @member {string} name
                 * @memberof google.longrunning.Operation
                 * @instance
                 */
                Operation.prototype.name = "";
    
                /**
                 * Operation metadata.
                 * @member {google.protobuf.IAny|null|undefined} metadata
                 * @memberof google.longrunning.Operation
                 * @instance
                 */
                Operation.prototype.metadata = null;
    
                /**
                 * Operation done.
                 * @member {boolean} done
                 * @memberof google.longrunning.Operation
                 * @instance
                 */
                Operation.prototype.done = false;
    
                /**
                 * Operation error.
                 * @member {google.rpc.IStatus|null|undefined} error
                 * @memberof google.longrunning.Operation
                 * @instance
                 */
                Operation.prototype.error = null;
    
                /**
                 * Operation response.
                 * @member {google.protobuf.IAny|null|undefined} response
                 * @memberof google.longrunning.Operation
                 * @instance
                 */
                Operation.prototype.response = null;
    
                // OneOf field names bound to virtual getters and setters
                var $oneOfFields;
    
                /**
                 * Operation result.
                 * @member {"error"|"response"|undefined} result
                 * @memberof google.longrunning.Operation
                 * @instance
                 */
                Object.defineProperty(Operation.prototype, "result", {
                    get: $util.oneOfGetter($oneOfFields = ["error", "response"]),
                    set: $util.oneOfSetter($oneOfFields)
                });
    
                /**
                 * Creates an Operation message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.longrunning.Operation
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.longrunning.Operation} Operation
                 */
                Operation.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.longrunning.Operation)
                        return object;
                    var message = new $root.google.longrunning.Operation();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.metadata != null) {
                        if (typeof object.metadata !== "object")
                            throw TypeError(".google.longrunning.Operation.metadata: object expected");
                        message.metadata = $root.google.protobuf.Any.fromObject(object.metadata);
                    }
                    if (object.done != null)
                        message.done = Boolean(object.done);
                    if (object.error != null) {
                        if (typeof object.error !== "object")
                            throw TypeError(".google.longrunning.Operation.error: object expected");
                        message.error = $root.google.rpc.Status.fromObject(object.error);
                    }
                    if (object.response != null) {
                        if (typeof object.response !== "object")
                            throw TypeError(".google.longrunning.Operation.response: object expected");
                        message.response = $root.google.protobuf.Any.fromObject(object.response);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from an Operation message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.longrunning.Operation
                 * @static
                 * @param {google.longrunning.Operation} message Operation
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Operation.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.name = "";
                        object.metadata = null;
                        object.done = false;
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.metadata != null && message.hasOwnProperty("metadata"))
                        object.metadata = $root.google.protobuf.Any.toObject(message.metadata, options);
                    if (message.done != null && message.hasOwnProperty("done"))
                        object.done = message.done;
                    if (message.error != null && message.hasOwnProperty("error")) {
                        object.error = $root.google.rpc.Status.toObject(message.error, options);
                        if (options.oneofs)
                            object.result = "error";
                    }
                    if (message.response != null && message.hasOwnProperty("response")) {
                        object.response = $root.google.protobuf.Any.toObject(message.response, options);
                        if (options.oneofs)
                            object.result = "response";
                    }
                    return object;
                };
    
                /**
                 * Converts this Operation to JSON.
                 * @function toJSON
                 * @memberof google.longrunning.Operation
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Operation.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return Operation;
            })();
    
            longrunning.GetOperationRequest = (function() {
    
                /**
                 * Properties of a GetOperationRequest.
                 * @memberof google.longrunning
                 * @interface IGetOperationRequest
                 * @property {string|null} [name] GetOperationRequest name
                 */
    
                /**
                 * Constructs a new GetOperationRequest.
                 * @memberof google.longrunning
                 * @classdesc Represents a GetOperationRequest.
                 * @implements IGetOperationRequest
                 * @constructor
                 * @param {google.longrunning.IGetOperationRequest=} [properties] Properties to set
                 */
                function GetOperationRequest(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * GetOperationRequest name.
                 * @member {string} name
                 * @memberof google.longrunning.GetOperationRequest
                 * @instance
                 */
                GetOperationRequest.prototype.name = "";
    
                /**
                 * Creates a GetOperationRequest message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.longrunning.GetOperationRequest
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.longrunning.GetOperationRequest} GetOperationRequest
                 */
                GetOperationRequest.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.longrunning.GetOperationRequest)
                        return object;
                    var message = new $root.google.longrunning.GetOperationRequest();
                    if (object.name != null)
                        message.name = String(object.name);
                    return message;
                };
    
                /**
                 * Creates a plain object from a GetOperationRequest message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.longrunning.GetOperationRequest
                 * @static
                 * @param {google.longrunning.GetOperationRequest} message GetOperationRequest
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                GetOperationRequest.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.name = "";
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    return object;
                };
    
                /**
                 * Converts this GetOperationRequest to JSON.
                 * @function toJSON
                 * @memberof google.longrunning.GetOperationRequest
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                GetOperationRequest.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return GetOperationRequest;
            })();
    
            longrunning.ListOperationsRequest = (function() {
    
                /**
                 * Properties of a ListOperationsRequest.
                 * @memberof google.longrunning
                 * @interface IListOperationsRequest
                 * @property {string|null} [name] ListOperationsRequest name
                 * @property {string|null} [filter] ListOperationsRequest filter
                 * @property {number|null} [pageSize] ListOperationsRequest pageSize
                 * @property {string|null} [pageToken] ListOperationsRequest pageToken
                 */
    
                /**
                 * Constructs a new ListOperationsRequest.
                 * @memberof google.longrunning
                 * @classdesc Represents a ListOperationsRequest.
                 * @implements IListOperationsRequest
                 * @constructor
                 * @param {google.longrunning.IListOperationsRequest=} [properties] Properties to set
                 */
                function ListOperationsRequest(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * ListOperationsRequest name.
                 * @member {string} name
                 * @memberof google.longrunning.ListOperationsRequest
                 * @instance
                 */
                ListOperationsRequest.prototype.name = "";
    
                /**
                 * ListOperationsRequest filter.
                 * @member {string} filter
                 * @memberof google.longrunning.ListOperationsRequest
                 * @instance
                 */
                ListOperationsRequest.prototype.filter = "";
    
                /**
                 * ListOperationsRequest pageSize.
                 * @member {number} pageSize
                 * @memberof google.longrunning.ListOperationsRequest
                 * @instance
                 */
                ListOperationsRequest.prototype.pageSize = 0;
    
                /**
                 * ListOperationsRequest pageToken.
                 * @member {string} pageToken
                 * @memberof google.longrunning.ListOperationsRequest
                 * @instance
                 */
                ListOperationsRequest.prototype.pageToken = "";
    
                /**
                 * Creates a ListOperationsRequest message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.longrunning.ListOperationsRequest
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.longrunning.ListOperationsRequest} ListOperationsRequest
                 */
                ListOperationsRequest.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.longrunning.ListOperationsRequest)
                        return object;
                    var message = new $root.google.longrunning.ListOperationsRequest();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.filter != null)
                        message.filter = String(object.filter);
                    if (object.pageSize != null)
                        message.pageSize = object.pageSize | 0;
                    if (object.pageToken != null)
                        message.pageToken = String(object.pageToken);
                    return message;
                };
    
                /**
                 * Creates a plain object from a ListOperationsRequest message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.longrunning.ListOperationsRequest
                 * @static
                 * @param {google.longrunning.ListOperationsRequest} message ListOperationsRequest
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ListOperationsRequest.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.filter = "";
                        object.pageSize = 0;
                        object.pageToken = "";
                        object.name = "";
                    }
                    if (message.filter != null && message.hasOwnProperty("filter"))
                        object.filter = message.filter;
                    if (message.pageSize != null && message.hasOwnProperty("pageSize"))
                        object.pageSize = message.pageSize;
                    if (message.pageToken != null && message.hasOwnProperty("pageToken"))
                        object.pageToken = message.pageToken;
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    return object;
                };
    
                /**
                 * Converts this ListOperationsRequest to JSON.
                 * @function toJSON
                 * @memberof google.longrunning.ListOperationsRequest
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ListOperationsRequest.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return ListOperationsRequest;
            })();
    
            longrunning.ListOperationsResponse = (function() {
    
                /**
                 * Properties of a ListOperationsResponse.
                 * @memberof google.longrunning
                 * @interface IListOperationsResponse
                 * @property {Array.<google.longrunning.IOperation>|null} [operations] ListOperationsResponse operations
                 * @property {string|null} [nextPageToken] ListOperationsResponse nextPageToken
                 */
    
                /**
                 * Constructs a new ListOperationsResponse.
                 * @memberof google.longrunning
                 * @classdesc Represents a ListOperationsResponse.
                 * @implements IListOperationsResponse
                 * @constructor
                 * @param {google.longrunning.IListOperationsResponse=} [properties] Properties to set
                 */
                function ListOperationsResponse(properties) {
                    this.operations = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * ListOperationsResponse operations.
                 * @member {Array.<google.longrunning.IOperation>} operations
                 * @memberof google.longrunning.ListOperationsResponse
                 * @instance
                 */
                ListOperationsResponse.prototype.operations = $util.emptyArray;
    
                /**
                 * ListOperationsResponse nextPageToken.
                 * @member {string} nextPageToken
                 * @memberof google.longrunning.ListOperationsResponse
                 * @instance
                 */
                ListOperationsResponse.prototype.nextPageToken = "";
    
                /**
                 * Creates a ListOperationsResponse message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.longrunning.ListOperationsResponse
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.longrunning.ListOperationsResponse} ListOperationsResponse
                 */
                ListOperationsResponse.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.longrunning.ListOperationsResponse)
                        return object;
                    var message = new $root.google.longrunning.ListOperationsResponse();
                    if (object.operations) {
                        if (!Array.isArray(object.operations))
                            throw TypeError(".google.longrunning.ListOperationsResponse.operations: array expected");
                        message.operations = [];
                        for (var i = 0; i < object.operations.length; ++i) {
                            if (typeof object.operations[i] !== "object")
                                throw TypeError(".google.longrunning.ListOperationsResponse.operations: object expected");
                            message.operations[i] = $root.google.longrunning.Operation.fromObject(object.operations[i]);
                        }
                    }
                    if (object.nextPageToken != null)
                        message.nextPageToken = String(object.nextPageToken);
                    return message;
                };
    
                /**
                 * Creates a plain object from a ListOperationsResponse message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.longrunning.ListOperationsResponse
                 * @static
                 * @param {google.longrunning.ListOperationsResponse} message ListOperationsResponse
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ListOperationsResponse.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.operations = [];
                    if (options.defaults)
                        object.nextPageToken = "";
                    if (message.operations && message.operations.length) {
                        object.operations = [];
                        for (var j = 0; j < message.operations.length; ++j)
                            object.operations[j] = $root.google.longrunning.Operation.toObject(message.operations[j], options);
                    }
                    if (message.nextPageToken != null && message.hasOwnProperty("nextPageToken"))
                        object.nextPageToken = message.nextPageToken;
                    return object;
                };
    
                /**
                 * Converts this ListOperationsResponse to JSON.
                 * @function toJSON
                 * @memberof google.longrunning.ListOperationsResponse
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ListOperationsResponse.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return ListOperationsResponse;
            })();
    
            longrunning.CancelOperationRequest = (function() {
    
                /**
                 * Properties of a CancelOperationRequest.
                 * @memberof google.longrunning
                 * @interface ICancelOperationRequest
                 * @property {string|null} [name] CancelOperationRequest name
                 */
    
                /**
                 * Constructs a new CancelOperationRequest.
                 * @memberof google.longrunning
                 * @classdesc Represents a CancelOperationRequest.
                 * @implements ICancelOperationRequest
                 * @constructor
                 * @param {google.longrunning.ICancelOperationRequest=} [properties] Properties to set
                 */
                function CancelOperationRequest(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * CancelOperationRequest name.
                 * @member {string} name
                 * @memberof google.longrunning.CancelOperationRequest
                 * @instance
                 */
                CancelOperationRequest.prototype.name = "";
    
                /**
                 * Creates a CancelOperationRequest message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.longrunning.CancelOperationRequest
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.longrunning.CancelOperationRequest} CancelOperationRequest
                 */
                CancelOperationRequest.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.longrunning.CancelOperationRequest)
                        return object;
                    var message = new $root.google.longrunning.CancelOperationRequest();
                    if (object.name != null)
                        message.name = String(object.name);
                    return message;
                };
    
                /**
                 * Creates a plain object from a CancelOperationRequest message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.longrunning.CancelOperationRequest
                 * @static
                 * @param {google.longrunning.CancelOperationRequest} message CancelOperationRequest
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                CancelOperationRequest.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.name = "";
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    return object;
                };
    
                /**
                 * Converts this CancelOperationRequest to JSON.
                 * @function toJSON
                 * @memberof google.longrunning.CancelOperationRequest
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                CancelOperationRequest.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return CancelOperationRequest;
            })();
    
            longrunning.DeleteOperationRequest = (function() {
    
                /**
                 * Properties of a DeleteOperationRequest.
                 * @memberof google.longrunning
                 * @interface IDeleteOperationRequest
                 * @property {string|null} [name] DeleteOperationRequest name
                 */
    
                /**
                 * Constructs a new DeleteOperationRequest.
                 * @memberof google.longrunning
                 * @classdesc Represents a DeleteOperationRequest.
                 * @implements IDeleteOperationRequest
                 * @constructor
                 * @param {google.longrunning.IDeleteOperationRequest=} [properties] Properties to set
                 */
                function DeleteOperationRequest(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * DeleteOperationRequest name.
                 * @member {string} name
                 * @memberof google.longrunning.DeleteOperationRequest
                 * @instance
                 */
                DeleteOperationRequest.prototype.name = "";
    
                /**
                 * Creates a DeleteOperationRequest message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.longrunning.DeleteOperationRequest
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.longrunning.DeleteOperationRequest} DeleteOperationRequest
                 */
                DeleteOperationRequest.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.longrunning.DeleteOperationRequest)
                        return object;
                    var message = new $root.google.longrunning.DeleteOperationRequest();
                    if (object.name != null)
                        message.name = String(object.name);
                    return message;
                };
    
                /**
                 * Creates a plain object from a DeleteOperationRequest message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.longrunning.DeleteOperationRequest
                 * @static
                 * @param {google.longrunning.DeleteOperationRequest} message DeleteOperationRequest
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                DeleteOperationRequest.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.name = "";
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    return object;
                };
    
                /**
                 * Converts this DeleteOperationRequest to JSON.
                 * @function toJSON
                 * @memberof google.longrunning.DeleteOperationRequest
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                DeleteOperationRequest.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return DeleteOperationRequest;
            })();
    
            longrunning.WaitOperationRequest = (function() {
    
                /**
                 * Properties of a WaitOperationRequest.
                 * @memberof google.longrunning
                 * @interface IWaitOperationRequest
                 * @property {string|null} [name] WaitOperationRequest name
                 * @property {google.protobuf.IDuration|null} [timeout] WaitOperationRequest timeout
                 */
    
                /**
                 * Constructs a new WaitOperationRequest.
                 * @memberof google.longrunning
                 * @classdesc Represents a WaitOperationRequest.
                 * @implements IWaitOperationRequest
                 * @constructor
                 * @param {google.longrunning.IWaitOperationRequest=} [properties] Properties to set
                 */
                function WaitOperationRequest(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * WaitOperationRequest name.
                 * @member {string} name
                 * @memberof google.longrunning.WaitOperationRequest
                 * @instance
                 */
                WaitOperationRequest.prototype.name = "";
    
                /**
                 * WaitOperationRequest timeout.
                 * @member {google.protobuf.IDuration|null|undefined} timeout
                 * @memberof google.longrunning.WaitOperationRequest
                 * @instance
                 */
                WaitOperationRequest.prototype.timeout = null;
    
                /**
                 * Creates a WaitOperationRequest message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.longrunning.WaitOperationRequest
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.longrunning.WaitOperationRequest} WaitOperationRequest
                 */
                WaitOperationRequest.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.longrunning.WaitOperationRequest)
                        return object;
                    var message = new $root.google.longrunning.WaitOperationRequest();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.timeout != null) {
                        if (typeof object.timeout !== "object")
                            throw TypeError(".google.longrunning.WaitOperationRequest.timeout: object expected");
                        message.timeout = $root.google.protobuf.Duration.fromObject(object.timeout);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a WaitOperationRequest message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.longrunning.WaitOperationRequest
                 * @static
                 * @param {google.longrunning.WaitOperationRequest} message WaitOperationRequest
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                WaitOperationRequest.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.name = "";
                        object.timeout = null;
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.timeout != null && message.hasOwnProperty("timeout"))
                        object.timeout = $root.google.protobuf.Duration.toObject(message.timeout, options);
                    return object;
                };
    
                /**
                 * Converts this WaitOperationRequest to JSON.
                 * @function toJSON
                 * @memberof google.longrunning.WaitOperationRequest
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                WaitOperationRequest.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return WaitOperationRequest;
            })();
    
            longrunning.OperationInfo = (function() {
    
                /**
                 * Properties of an OperationInfo.
                 * @memberof google.longrunning
                 * @interface IOperationInfo
                 * @property {string|null} [responseType] OperationInfo responseType
                 * @property {string|null} [metadataType] OperationInfo metadataType
                 */
    
                /**
                 * Constructs a new OperationInfo.
                 * @memberof google.longrunning
                 * @classdesc Represents an OperationInfo.
                 * @implements IOperationInfo
                 * @constructor
                 * @param {google.longrunning.IOperationInfo=} [properties] Properties to set
                 */
                function OperationInfo(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * OperationInfo responseType.
                 * @member {string} responseType
                 * @memberof google.longrunning.OperationInfo
                 * @instance
                 */
                OperationInfo.prototype.responseType = "";
    
                /**
                 * OperationInfo metadataType.
                 * @member {string} metadataType
                 * @memberof google.longrunning.OperationInfo
                 * @instance
                 */
                OperationInfo.prototype.metadataType = "";
    
                /**
                 * Creates an OperationInfo message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.longrunning.OperationInfo
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.longrunning.OperationInfo} OperationInfo
                 */
                OperationInfo.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.longrunning.OperationInfo)
                        return object;
                    var message = new $root.google.longrunning.OperationInfo();
                    if (object.responseType != null)
                        message.responseType = String(object.responseType);
                    if (object.metadataType != null)
                        message.metadataType = String(object.metadataType);
                    return message;
                };
    
                /**
                 * Creates a plain object from an OperationInfo message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.longrunning.OperationInfo
                 * @static
                 * @param {google.longrunning.OperationInfo} message OperationInfo
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                OperationInfo.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.responseType = "";
                        object.metadataType = "";
                    }
                    if (message.responseType != null && message.hasOwnProperty("responseType"))
                        object.responseType = message.responseType;
                    if (message.metadataType != null && message.hasOwnProperty("metadataType"))
                        object.metadataType = message.metadataType;
                    return object;
                };
    
                /**
                 * Converts this OperationInfo to JSON.
                 * @function toJSON
                 * @memberof google.longrunning.OperationInfo
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                OperationInfo.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                return OperationInfo;
            })();
    
            return longrunning;
        })();
    
        return google;
    })();

    return $root;
});
