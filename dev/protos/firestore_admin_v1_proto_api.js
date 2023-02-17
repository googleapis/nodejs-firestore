/*!
 * Copyright 2022 Google LLC
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
    var $root = $protobuf.roots.firestore_admin_v1 || ($protobuf.roots.firestore_admin_v1 = {});
    
    $root.google = (function() {
    
        /**
         * Namespace google.
         * @exports google
         * @namespace
         */
        var google = {};
    
        google.firestore = (function() {
    
            /**
             * Namespace firestore.
             * @memberof google
             * @namespace
             */
            var firestore = {};
    
            firestore.admin = (function() {
    
                /**
                 * Namespace admin.
                 * @memberof google.firestore
                 * @namespace
                 */
                var admin = {};
    
                admin.v1 = (function() {
    
                    /**
                     * Namespace v1.
                     * @memberof google.firestore.admin
                     * @namespace
                     */
                    var v1 = {};
    
                    v1.Database = (function() {
    
                        /**
                         * Properties of a Database.
                         * @memberof google.firestore.admin.v1
                         * @interface IDatabase
                         * @property {string|null} [name] Database name
                         * @property {string|null} [locationId] Database locationId
                         * @property {google.firestore.admin.v1.Database.DatabaseType|null} [type] Database type
                         * @property {google.firestore.admin.v1.Database.ConcurrencyMode|null} [concurrencyMode] Database concurrencyMode
                         * @property {google.firestore.admin.v1.Database.AppEngineIntegrationMode|null} [appEngineIntegrationMode] Database appEngineIntegrationMode
                         * @property {string|null} [keyPrefix] Database keyPrefix
                         * @property {string|null} [etag] Database etag
                         */
    
                        /**
                         * Constructs a new Database.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a Database.
                         * @implements IDatabase
                         * @constructor
                         * @param {google.firestore.admin.v1.IDatabase=} [properties] Properties to set
                         */
                        function Database(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * Database name.
                         * @member {string} name
                         * @memberof google.firestore.admin.v1.Database
                         * @instance
                         */
                        Database.prototype.name = "";
    
                        /**
                         * Database locationId.
                         * @member {string} locationId
                         * @memberof google.firestore.admin.v1.Database
                         * @instance
                         */
                        Database.prototype.locationId = "";
    
                        /**
                         * Database type.
                         * @member {google.firestore.admin.v1.Database.DatabaseType} type
                         * @memberof google.firestore.admin.v1.Database
                         * @instance
                         */
                        Database.prototype.type = 0;
    
                        /**
                         * Database concurrencyMode.
                         * @member {google.firestore.admin.v1.Database.ConcurrencyMode} concurrencyMode
                         * @memberof google.firestore.admin.v1.Database
                         * @instance
                         */
                        Database.prototype.concurrencyMode = 0;
    
                        /**
                         * Database appEngineIntegrationMode.
                         * @member {google.firestore.admin.v1.Database.AppEngineIntegrationMode} appEngineIntegrationMode
                         * @memberof google.firestore.admin.v1.Database
                         * @instance
                         */
                        Database.prototype.appEngineIntegrationMode = 0;
    
                        /**
                         * Database keyPrefix.
                         * @member {string} keyPrefix
                         * @memberof google.firestore.admin.v1.Database
                         * @instance
                         */
                        Database.prototype.keyPrefix = "";
    
                        /**
                         * Database etag.
                         * @member {string} etag
                         * @memberof google.firestore.admin.v1.Database
                         * @instance
                         */
                        Database.prototype.etag = "";
    
                        /**
                         * Creates a Database message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.Database
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.Database} Database
                         */
                        Database.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.Database)
                                return object;
                            var message = new $root.google.firestore.admin.v1.Database();
                            if (object.name != null)
                                message.name = String(object.name);
                            if (object.locationId != null)
                                message.locationId = String(object.locationId);
                            switch (object.type) {
                            default:
                                if (typeof object.type === "number") {
                                    message.type = object.type;
                                    break;
                                }
                                break;
                            case "DATABASE_TYPE_UNSPECIFIED":
                            case 0:
                                message.type = 0;
                                break;
                            case "FIRESTORE_NATIVE":
                            case 1:
                                message.type = 1;
                                break;
                            case "DATASTORE_MODE":
                            case 2:
                                message.type = 2;
                                break;
                            }
                            switch (object.concurrencyMode) {
                            default:
                                if (typeof object.concurrencyMode === "number") {
                                    message.concurrencyMode = object.concurrencyMode;
                                    break;
                                }
                                break;
                            case "CONCURRENCY_MODE_UNSPECIFIED":
                            case 0:
                                message.concurrencyMode = 0;
                                break;
                            case "OPTIMISTIC":
                            case 1:
                                message.concurrencyMode = 1;
                                break;
                            case "PESSIMISTIC":
                            case 2:
                                message.concurrencyMode = 2;
                                break;
                            case "OPTIMISTIC_WITH_ENTITY_GROUPS":
                            case 3:
                                message.concurrencyMode = 3;
                                break;
                            }
                            switch (object.appEngineIntegrationMode) {
                            default:
                                if (typeof object.appEngineIntegrationMode === "number") {
                                    message.appEngineIntegrationMode = object.appEngineIntegrationMode;
                                    break;
                                }
                                break;
                            case "APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED":
                            case 0:
                                message.appEngineIntegrationMode = 0;
                                break;
                            case "ENABLED":
                            case 1:
                                message.appEngineIntegrationMode = 1;
                                break;
                            case "DISABLED":
                            case 2:
                                message.appEngineIntegrationMode = 2;
                                break;
                            }
                            if (object.keyPrefix != null)
                                message.keyPrefix = String(object.keyPrefix);
                            if (object.etag != null)
                                message.etag = String(object.etag);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a Database message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.Database
                         * @static
                         * @param {google.firestore.admin.v1.Database} message Database
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Database.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.name = "";
                                object.locationId = "";
                                object.type = options.enums === String ? "DATABASE_TYPE_UNSPECIFIED" : 0;
                                object.concurrencyMode = options.enums === String ? "CONCURRENCY_MODE_UNSPECIFIED" : 0;
                                object.appEngineIntegrationMode = options.enums === String ? "APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED" : 0;
                                object.keyPrefix = "";
                                object.etag = "";
                            }
                            if (message.name != null && message.hasOwnProperty("name"))
                                object.name = message.name;
                            if (message.locationId != null && message.hasOwnProperty("locationId"))
                                object.locationId = message.locationId;
                            if (message.type != null && message.hasOwnProperty("type"))
                                object.type = options.enums === String ? $root.google.firestore.admin.v1.Database.DatabaseType[message.type] === undefined ? message.type : $root.google.firestore.admin.v1.Database.DatabaseType[message.type] : message.type;
                            if (message.concurrencyMode != null && message.hasOwnProperty("concurrencyMode"))
                                object.concurrencyMode = options.enums === String ? $root.google.firestore.admin.v1.Database.ConcurrencyMode[message.concurrencyMode] === undefined ? message.concurrencyMode : $root.google.firestore.admin.v1.Database.ConcurrencyMode[message.concurrencyMode] : message.concurrencyMode;
                            if (message.appEngineIntegrationMode != null && message.hasOwnProperty("appEngineIntegrationMode"))
                                object.appEngineIntegrationMode = options.enums === String ? $root.google.firestore.admin.v1.Database.AppEngineIntegrationMode[message.appEngineIntegrationMode] === undefined ? message.appEngineIntegrationMode : $root.google.firestore.admin.v1.Database.AppEngineIntegrationMode[message.appEngineIntegrationMode] : message.appEngineIntegrationMode;
                            if (message.keyPrefix != null && message.hasOwnProperty("keyPrefix"))
                                object.keyPrefix = message.keyPrefix;
                            if (message.etag != null && message.hasOwnProperty("etag"))
                                object.etag = message.etag;
                            return object;
                        };
    
                        /**
                         * Converts this Database to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.Database
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Database.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for Database
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.Database
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        Database.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.Database";
                        };
    
                        /**
                         * DatabaseType enum.
                         * @name google.firestore.admin.v1.Database.DatabaseType
                         * @enum {string}
                         * @property {string} DATABASE_TYPE_UNSPECIFIED=DATABASE_TYPE_UNSPECIFIED DATABASE_TYPE_UNSPECIFIED value
                         * @property {string} FIRESTORE_NATIVE=FIRESTORE_NATIVE FIRESTORE_NATIVE value
                         * @property {string} DATASTORE_MODE=DATASTORE_MODE DATASTORE_MODE value
                         */
                        Database.DatabaseType = (function() {
                            var valuesById = {}, values = Object.create(valuesById);
                            values[valuesById[0] = "DATABASE_TYPE_UNSPECIFIED"] = "DATABASE_TYPE_UNSPECIFIED";
                            values[valuesById[1] = "FIRESTORE_NATIVE"] = "FIRESTORE_NATIVE";
                            values[valuesById[2] = "DATASTORE_MODE"] = "DATASTORE_MODE";
                            return values;
                        })();
    
                        /**
                         * ConcurrencyMode enum.
                         * @name google.firestore.admin.v1.Database.ConcurrencyMode
                         * @enum {string}
                         * @property {string} CONCURRENCY_MODE_UNSPECIFIED=CONCURRENCY_MODE_UNSPECIFIED CONCURRENCY_MODE_UNSPECIFIED value
                         * @property {string} OPTIMISTIC=OPTIMISTIC OPTIMISTIC value
                         * @property {string} PESSIMISTIC=PESSIMISTIC PESSIMISTIC value
                         * @property {string} OPTIMISTIC_WITH_ENTITY_GROUPS=OPTIMISTIC_WITH_ENTITY_GROUPS OPTIMISTIC_WITH_ENTITY_GROUPS value
                         */
                        Database.ConcurrencyMode = (function() {
                            var valuesById = {}, values = Object.create(valuesById);
                            values[valuesById[0] = "CONCURRENCY_MODE_UNSPECIFIED"] = "CONCURRENCY_MODE_UNSPECIFIED";
                            values[valuesById[1] = "OPTIMISTIC"] = "OPTIMISTIC";
                            values[valuesById[2] = "PESSIMISTIC"] = "PESSIMISTIC";
                            values[valuesById[3] = "OPTIMISTIC_WITH_ENTITY_GROUPS"] = "OPTIMISTIC_WITH_ENTITY_GROUPS";
                            return values;
                        })();
    
                        /**
                         * AppEngineIntegrationMode enum.
                         * @name google.firestore.admin.v1.Database.AppEngineIntegrationMode
                         * @enum {string}
                         * @property {string} APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED=APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED value
                         * @property {string} ENABLED=ENABLED ENABLED value
                         * @property {string} DISABLED=DISABLED DISABLED value
                         */
                        Database.AppEngineIntegrationMode = (function() {
                            var valuesById = {}, values = Object.create(valuesById);
                            values[valuesById[0] = "APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED"] = "APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED";
                            values[valuesById[1] = "ENABLED"] = "ENABLED";
                            values[valuesById[2] = "DISABLED"] = "DISABLED";
                            return values;
                        })();
    
                        return Database;
                    })();
    
                    v1.Field = (function() {
    
                        /**
                         * Properties of a Field.
                         * @memberof google.firestore.admin.v1
                         * @interface IField
                         * @property {string|null} [name] Field name
                         * @property {google.firestore.admin.v1.Field.IIndexConfig|null} [indexConfig] Field indexConfig
                         * @property {google.firestore.admin.v1.Field.ITtlConfig|null} [ttlConfig] Field ttlConfig
                         */
    
                        /**
                         * Constructs a new Field.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a Field.
                         * @implements IField
                         * @constructor
                         * @param {google.firestore.admin.v1.IField=} [properties] Properties to set
                         */
                        function Field(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * Field name.
                         * @member {string} name
                         * @memberof google.firestore.admin.v1.Field
                         * @instance
                         */
                        Field.prototype.name = "";
    
                        /**
                         * Field indexConfig.
                         * @member {google.firestore.admin.v1.Field.IIndexConfig|null|undefined} indexConfig
                         * @memberof google.firestore.admin.v1.Field
                         * @instance
                         */
                        Field.prototype.indexConfig = null;
    
                        /**
                         * Field ttlConfig.
                         * @member {google.firestore.admin.v1.Field.ITtlConfig|null|undefined} ttlConfig
                         * @memberof google.firestore.admin.v1.Field
                         * @instance
                         */
                        Field.prototype.ttlConfig = null;
    
                        /**
                         * Creates a Field message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.Field
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.Field} Field
                         */
                        Field.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.Field)
                                return object;
                            var message = new $root.google.firestore.admin.v1.Field();
                            if (object.name != null)
                                message.name = String(object.name);
                            if (object.indexConfig != null) {
                                if (typeof object.indexConfig !== "object")
                                    throw TypeError(".google.firestore.admin.v1.Field.indexConfig: object expected");
                                message.indexConfig = $root.google.firestore.admin.v1.Field.IndexConfig.fromObject(object.indexConfig);
                            }
                            if (object.ttlConfig != null) {
                                if (typeof object.ttlConfig !== "object")
                                    throw TypeError(".google.firestore.admin.v1.Field.ttlConfig: object expected");
                                message.ttlConfig = $root.google.firestore.admin.v1.Field.TtlConfig.fromObject(object.ttlConfig);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a Field message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.Field
                         * @static
                         * @param {google.firestore.admin.v1.Field} message Field
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Field.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.name = "";
                                object.indexConfig = null;
                                object.ttlConfig = null;
                            }
                            if (message.name != null && message.hasOwnProperty("name"))
                                object.name = message.name;
                            if (message.indexConfig != null && message.hasOwnProperty("indexConfig"))
                                object.indexConfig = $root.google.firestore.admin.v1.Field.IndexConfig.toObject(message.indexConfig, options);
                            if (message.ttlConfig != null && message.hasOwnProperty("ttlConfig"))
                                object.ttlConfig = $root.google.firestore.admin.v1.Field.TtlConfig.toObject(message.ttlConfig, options);
                            return object;
                        };
    
                        /**
                         * Converts this Field to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.Field
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Field.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for Field
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.Field
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        Field.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.Field";
                        };
    
                        Field.IndexConfig = (function() {
    
                            /**
                             * Properties of an IndexConfig.
                             * @memberof google.firestore.admin.v1.Field
                             * @interface IIndexConfig
                             * @property {Array.<google.firestore.admin.v1.IIndex>|null} [indexes] IndexConfig indexes
                             * @property {boolean|null} [usesAncestorConfig] IndexConfig usesAncestorConfig
                             * @property {string|null} [ancestorField] IndexConfig ancestorField
                             * @property {boolean|null} [reverting] IndexConfig reverting
                             */
    
                            /**
                             * Constructs a new IndexConfig.
                             * @memberof google.firestore.admin.v1.Field
                             * @classdesc Represents an IndexConfig.
                             * @implements IIndexConfig
                             * @constructor
                             * @param {google.firestore.admin.v1.Field.IIndexConfig=} [properties] Properties to set
                             */
                            function IndexConfig(properties) {
                                this.indexes = [];
                                if (properties)
                                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                        if (properties[keys[i]] != null)
                                            this[keys[i]] = properties[keys[i]];
                            }
    
                            /**
                             * IndexConfig indexes.
                             * @member {Array.<google.firestore.admin.v1.IIndex>} indexes
                             * @memberof google.firestore.admin.v1.Field.IndexConfig
                             * @instance
                             */
                            IndexConfig.prototype.indexes = $util.emptyArray;
    
                            /**
                             * IndexConfig usesAncestorConfig.
                             * @member {boolean} usesAncestorConfig
                             * @memberof google.firestore.admin.v1.Field.IndexConfig
                             * @instance
                             */
                            IndexConfig.prototype.usesAncestorConfig = false;
    
                            /**
                             * IndexConfig ancestorField.
                             * @member {string} ancestorField
                             * @memberof google.firestore.admin.v1.Field.IndexConfig
                             * @instance
                             */
                            IndexConfig.prototype.ancestorField = "";
    
                            /**
                             * IndexConfig reverting.
                             * @member {boolean} reverting
                             * @memberof google.firestore.admin.v1.Field.IndexConfig
                             * @instance
                             */
                            IndexConfig.prototype.reverting = false;
    
                            /**
                             * Creates an IndexConfig message from a plain object. Also converts values to their respective internal types.
                             * @function fromObject
                             * @memberof google.firestore.admin.v1.Field.IndexConfig
                             * @static
                             * @param {Object.<string,*>} object Plain object
                             * @returns {google.firestore.admin.v1.Field.IndexConfig} IndexConfig
                             */
                            IndexConfig.fromObject = function fromObject(object) {
                                if (object instanceof $root.google.firestore.admin.v1.Field.IndexConfig)
                                    return object;
                                var message = new $root.google.firestore.admin.v1.Field.IndexConfig();
                                if (object.indexes) {
                                    if (!Array.isArray(object.indexes))
                                        throw TypeError(".google.firestore.admin.v1.Field.IndexConfig.indexes: array expected");
                                    message.indexes = [];
                                    for (var i = 0; i < object.indexes.length; ++i) {
                                        if (typeof object.indexes[i] !== "object")
                                            throw TypeError(".google.firestore.admin.v1.Field.IndexConfig.indexes: object expected");
                                        message.indexes[i] = $root.google.firestore.admin.v1.Index.fromObject(object.indexes[i]);
                                    }
                                }
                                if (object.usesAncestorConfig != null)
                                    message.usesAncestorConfig = Boolean(object.usesAncestorConfig);
                                if (object.ancestorField != null)
                                    message.ancestorField = String(object.ancestorField);
                                if (object.reverting != null)
                                    message.reverting = Boolean(object.reverting);
                                return message;
                            };
    
                            /**
                             * Creates a plain object from an IndexConfig message. Also converts values to other types if specified.
                             * @function toObject
                             * @memberof google.firestore.admin.v1.Field.IndexConfig
                             * @static
                             * @param {google.firestore.admin.v1.Field.IndexConfig} message IndexConfig
                             * @param {$protobuf.IConversionOptions} [options] Conversion options
                             * @returns {Object.<string,*>} Plain object
                             */
                            IndexConfig.toObject = function toObject(message, options) {
                                if (!options)
                                    options = {};
                                var object = {};
                                if (options.arrays || options.defaults)
                                    object.indexes = [];
                                if (options.defaults) {
                                    object.usesAncestorConfig = false;
                                    object.ancestorField = "";
                                    object.reverting = false;
                                }
                                if (message.indexes && message.indexes.length) {
                                    object.indexes = [];
                                    for (var j = 0; j < message.indexes.length; ++j)
                                        object.indexes[j] = $root.google.firestore.admin.v1.Index.toObject(message.indexes[j], options);
                                }
                                if (message.usesAncestorConfig != null && message.hasOwnProperty("usesAncestorConfig"))
                                    object.usesAncestorConfig = message.usesAncestorConfig;
                                if (message.ancestorField != null && message.hasOwnProperty("ancestorField"))
                                    object.ancestorField = message.ancestorField;
                                if (message.reverting != null && message.hasOwnProperty("reverting"))
                                    object.reverting = message.reverting;
                                return object;
                            };
    
                            /**
                             * Converts this IndexConfig to JSON.
                             * @function toJSON
                             * @memberof google.firestore.admin.v1.Field.IndexConfig
                             * @instance
                             * @returns {Object.<string,*>} JSON object
                             */
                            IndexConfig.prototype.toJSON = function toJSON() {
                                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                            };
    
                            /**
                             * Gets the default type url for IndexConfig
                             * @function getTypeUrl
                             * @memberof google.firestore.admin.v1.Field.IndexConfig
                             * @static
                             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                             * @returns {string} The default type url
                             */
                            IndexConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                                if (typeUrlPrefix === undefined) {
                                    typeUrlPrefix = "type.googleapis.com";
                                }
                                return typeUrlPrefix + "/google.firestore.admin.v1.Field.IndexConfig";
                            };
    
                            return IndexConfig;
                        })();
    
                        Field.TtlConfig = (function() {
    
                            /**
                             * Properties of a TtlConfig.
                             * @memberof google.firestore.admin.v1.Field
                             * @interface ITtlConfig
                             * @property {google.firestore.admin.v1.Field.TtlConfig.State|null} [state] TtlConfig state
                             */
    
                            /**
                             * Constructs a new TtlConfig.
                             * @memberof google.firestore.admin.v1.Field
                             * @classdesc Represents a TtlConfig.
                             * @implements ITtlConfig
                             * @constructor
                             * @param {google.firestore.admin.v1.Field.ITtlConfig=} [properties] Properties to set
                             */
                            function TtlConfig(properties) {
                                if (properties)
                                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                        if (properties[keys[i]] != null)
                                            this[keys[i]] = properties[keys[i]];
                            }
    
                            /**
                             * TtlConfig state.
                             * @member {google.firestore.admin.v1.Field.TtlConfig.State} state
                             * @memberof google.firestore.admin.v1.Field.TtlConfig
                             * @instance
                             */
                            TtlConfig.prototype.state = 0;
    
                            /**
                             * Creates a TtlConfig message from a plain object. Also converts values to their respective internal types.
                             * @function fromObject
                             * @memberof google.firestore.admin.v1.Field.TtlConfig
                             * @static
                             * @param {Object.<string,*>} object Plain object
                             * @returns {google.firestore.admin.v1.Field.TtlConfig} TtlConfig
                             */
                            TtlConfig.fromObject = function fromObject(object) {
                                if (object instanceof $root.google.firestore.admin.v1.Field.TtlConfig)
                                    return object;
                                var message = new $root.google.firestore.admin.v1.Field.TtlConfig();
                                switch (object.state) {
                                default:
                                    if (typeof object.state === "number") {
                                        message.state = object.state;
                                        break;
                                    }
                                    break;
                                case "STATE_UNSPECIFIED":
                                case 0:
                                    message.state = 0;
                                    break;
                                case "CREATING":
                                case 1:
                                    message.state = 1;
                                    break;
                                case "ACTIVE":
                                case 2:
                                    message.state = 2;
                                    break;
                                case "NEEDS_REPAIR":
                                case 3:
                                    message.state = 3;
                                    break;
                                }
                                return message;
                            };
    
                            /**
                             * Creates a plain object from a TtlConfig message. Also converts values to other types if specified.
                             * @function toObject
                             * @memberof google.firestore.admin.v1.Field.TtlConfig
                             * @static
                             * @param {google.firestore.admin.v1.Field.TtlConfig} message TtlConfig
                             * @param {$protobuf.IConversionOptions} [options] Conversion options
                             * @returns {Object.<string,*>} Plain object
                             */
                            TtlConfig.toObject = function toObject(message, options) {
                                if (!options)
                                    options = {};
                                var object = {};
                                if (options.defaults)
                                    object.state = options.enums === String ? "STATE_UNSPECIFIED" : 0;
                                if (message.state != null && message.hasOwnProperty("state"))
                                    object.state = options.enums === String ? $root.google.firestore.admin.v1.Field.TtlConfig.State[message.state] === undefined ? message.state : $root.google.firestore.admin.v1.Field.TtlConfig.State[message.state] : message.state;
                                return object;
                            };
    
                            /**
                             * Converts this TtlConfig to JSON.
                             * @function toJSON
                             * @memberof google.firestore.admin.v1.Field.TtlConfig
                             * @instance
                             * @returns {Object.<string,*>} JSON object
                             */
                            TtlConfig.prototype.toJSON = function toJSON() {
                                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                            };
    
                            /**
                             * Gets the default type url for TtlConfig
                             * @function getTypeUrl
                             * @memberof google.firestore.admin.v1.Field.TtlConfig
                             * @static
                             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                             * @returns {string} The default type url
                             */
                            TtlConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                                if (typeUrlPrefix === undefined) {
                                    typeUrlPrefix = "type.googleapis.com";
                                }
                                return typeUrlPrefix + "/google.firestore.admin.v1.Field.TtlConfig";
                            };
    
                            /**
                             * State enum.
                             * @name google.firestore.admin.v1.Field.TtlConfig.State
                             * @enum {string}
                             * @property {string} STATE_UNSPECIFIED=STATE_UNSPECIFIED STATE_UNSPECIFIED value
                             * @property {string} CREATING=CREATING CREATING value
                             * @property {string} ACTIVE=ACTIVE ACTIVE value
                             * @property {string} NEEDS_REPAIR=NEEDS_REPAIR NEEDS_REPAIR value
                             */
                            TtlConfig.State = (function() {
                                var valuesById = {}, values = Object.create(valuesById);
                                values[valuesById[0] = "STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
                                values[valuesById[1] = "CREATING"] = "CREATING";
                                values[valuesById[2] = "ACTIVE"] = "ACTIVE";
                                values[valuesById[3] = "NEEDS_REPAIR"] = "NEEDS_REPAIR";
                                return values;
                            })();
    
                            return TtlConfig;
                        })();
    
                        return Field;
                    })();
    
                    v1.FirestoreAdmin = (function() {
    
                        /**
                         * Constructs a new FirestoreAdmin service.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a FirestoreAdmin
                         * @extends $protobuf.rpc.Service
                         * @constructor
                         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
                         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
                         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
                         */
                        function FirestoreAdmin(rpcImpl, requestDelimited, responseDelimited) {
                            $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
                        }
    
                        (FirestoreAdmin.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = FirestoreAdmin;
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#createIndex}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef CreateIndexCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.longrunning.Operation} [response] Operation
                         */
    
                        /**
                         * Calls CreateIndex.
                         * @function createIndex
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.ICreateIndexRequest} request CreateIndexRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.CreateIndexCallback} callback Node-style callback called with the error, if any, and Operation
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.createIndex = function createIndex(request, callback) {
                            return this.rpcCall(createIndex, $root.google.firestore.admin.v1.CreateIndexRequest, $root.google.longrunning.Operation, request, callback);
                        }, "name", { value: "CreateIndex" });
    
                        /**
                         * Calls CreateIndex.
                         * @function createIndex
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.ICreateIndexRequest} request CreateIndexRequest message or plain object
                         * @returns {Promise<google.longrunning.Operation>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#listIndexes}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef ListIndexesCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.firestore.admin.v1.ListIndexesResponse} [response] ListIndexesResponse
                         */
    
                        /**
                         * Calls ListIndexes.
                         * @function listIndexes
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IListIndexesRequest} request ListIndexesRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.ListIndexesCallback} callback Node-style callback called with the error, if any, and ListIndexesResponse
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.listIndexes = function listIndexes(request, callback) {
                            return this.rpcCall(listIndexes, $root.google.firestore.admin.v1.ListIndexesRequest, $root.google.firestore.admin.v1.ListIndexesResponse, request, callback);
                        }, "name", { value: "ListIndexes" });
    
                        /**
                         * Calls ListIndexes.
                         * @function listIndexes
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IListIndexesRequest} request ListIndexesRequest message or plain object
                         * @returns {Promise<google.firestore.admin.v1.ListIndexesResponse>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#getIndex}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef GetIndexCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.firestore.admin.v1.Index} [response] Index
                         */
    
                        /**
                         * Calls GetIndex.
                         * @function getIndex
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IGetIndexRequest} request GetIndexRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.GetIndexCallback} callback Node-style callback called with the error, if any, and Index
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.getIndex = function getIndex(request, callback) {
                            return this.rpcCall(getIndex, $root.google.firestore.admin.v1.GetIndexRequest, $root.google.firestore.admin.v1.Index, request, callback);
                        }, "name", { value: "GetIndex" });
    
                        /**
                         * Calls GetIndex.
                         * @function getIndex
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IGetIndexRequest} request GetIndexRequest message or plain object
                         * @returns {Promise<google.firestore.admin.v1.Index>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#deleteIndex}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef DeleteIndexCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.protobuf.Empty} [response] Empty
                         */
    
                        /**
                         * Calls DeleteIndex.
                         * @function deleteIndex
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IDeleteIndexRequest} request DeleteIndexRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.DeleteIndexCallback} callback Node-style callback called with the error, if any, and Empty
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.deleteIndex = function deleteIndex(request, callback) {
                            return this.rpcCall(deleteIndex, $root.google.firestore.admin.v1.DeleteIndexRequest, $root.google.protobuf.Empty, request, callback);
                        }, "name", { value: "DeleteIndex" });
    
                        /**
                         * Calls DeleteIndex.
                         * @function deleteIndex
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IDeleteIndexRequest} request DeleteIndexRequest message or plain object
                         * @returns {Promise<google.protobuf.Empty>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#getField}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef GetFieldCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.firestore.admin.v1.Field} [response] Field
                         */
    
                        /**
                         * Calls GetField.
                         * @function getField
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IGetFieldRequest} request GetFieldRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.GetFieldCallback} callback Node-style callback called with the error, if any, and Field
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.getField = function getField(request, callback) {
                            return this.rpcCall(getField, $root.google.firestore.admin.v1.GetFieldRequest, $root.google.firestore.admin.v1.Field, request, callback);
                        }, "name", { value: "GetField" });
    
                        /**
                         * Calls GetField.
                         * @function getField
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IGetFieldRequest} request GetFieldRequest message or plain object
                         * @returns {Promise<google.firestore.admin.v1.Field>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#updateField}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef UpdateFieldCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.longrunning.Operation} [response] Operation
                         */
    
                        /**
                         * Calls UpdateField.
                         * @function updateField
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IUpdateFieldRequest} request UpdateFieldRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.UpdateFieldCallback} callback Node-style callback called with the error, if any, and Operation
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.updateField = function updateField(request, callback) {
                            return this.rpcCall(updateField, $root.google.firestore.admin.v1.UpdateFieldRequest, $root.google.longrunning.Operation, request, callback);
                        }, "name", { value: "UpdateField" });
    
                        /**
                         * Calls UpdateField.
                         * @function updateField
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IUpdateFieldRequest} request UpdateFieldRequest message or plain object
                         * @returns {Promise<google.longrunning.Operation>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#listFields}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef ListFieldsCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.firestore.admin.v1.ListFieldsResponse} [response] ListFieldsResponse
                         */
    
                        /**
                         * Calls ListFields.
                         * @function listFields
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IListFieldsRequest} request ListFieldsRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.ListFieldsCallback} callback Node-style callback called with the error, if any, and ListFieldsResponse
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.listFields = function listFields(request, callback) {
                            return this.rpcCall(listFields, $root.google.firestore.admin.v1.ListFieldsRequest, $root.google.firestore.admin.v1.ListFieldsResponse, request, callback);
                        }, "name", { value: "ListFields" });
    
                        /**
                         * Calls ListFields.
                         * @function listFields
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IListFieldsRequest} request ListFieldsRequest message or plain object
                         * @returns {Promise<google.firestore.admin.v1.ListFieldsResponse>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#exportDocuments}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef ExportDocumentsCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.longrunning.Operation} [response] Operation
                         */
    
                        /**
                         * Calls ExportDocuments.
                         * @function exportDocuments
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IExportDocumentsRequest} request ExportDocumentsRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.ExportDocumentsCallback} callback Node-style callback called with the error, if any, and Operation
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.exportDocuments = function exportDocuments(request, callback) {
                            return this.rpcCall(exportDocuments, $root.google.firestore.admin.v1.ExportDocumentsRequest, $root.google.longrunning.Operation, request, callback);
                        }, "name", { value: "ExportDocuments" });
    
                        /**
                         * Calls ExportDocuments.
                         * @function exportDocuments
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IExportDocumentsRequest} request ExportDocumentsRequest message or plain object
                         * @returns {Promise<google.longrunning.Operation>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#importDocuments}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef ImportDocumentsCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.longrunning.Operation} [response] Operation
                         */
    
                        /**
                         * Calls ImportDocuments.
                         * @function importDocuments
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IImportDocumentsRequest} request ImportDocumentsRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.ImportDocumentsCallback} callback Node-style callback called with the error, if any, and Operation
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.importDocuments = function importDocuments(request, callback) {
                            return this.rpcCall(importDocuments, $root.google.firestore.admin.v1.ImportDocumentsRequest, $root.google.longrunning.Operation, request, callback);
                        }, "name", { value: "ImportDocuments" });
    
                        /**
                         * Calls ImportDocuments.
                         * @function importDocuments
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IImportDocumentsRequest} request ImportDocumentsRequest message or plain object
                         * @returns {Promise<google.longrunning.Operation>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#getDatabase}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef GetDatabaseCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.firestore.admin.v1.Database} [response] Database
                         */
    
                        /**
                         * Calls GetDatabase.
                         * @function getDatabase
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IGetDatabaseRequest} request GetDatabaseRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.GetDatabaseCallback} callback Node-style callback called with the error, if any, and Database
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.getDatabase = function getDatabase(request, callback) {
                            return this.rpcCall(getDatabase, $root.google.firestore.admin.v1.GetDatabaseRequest, $root.google.firestore.admin.v1.Database, request, callback);
                        }, "name", { value: "GetDatabase" });
    
                        /**
                         * Calls GetDatabase.
                         * @function getDatabase
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IGetDatabaseRequest} request GetDatabaseRequest message or plain object
                         * @returns {Promise<google.firestore.admin.v1.Database>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#listDatabases}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef ListDatabasesCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.firestore.admin.v1.ListDatabasesResponse} [response] ListDatabasesResponse
                         */
    
                        /**
                         * Calls ListDatabases.
                         * @function listDatabases
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IListDatabasesRequest} request ListDatabasesRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.ListDatabasesCallback} callback Node-style callback called with the error, if any, and ListDatabasesResponse
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.listDatabases = function listDatabases(request, callback) {
                            return this.rpcCall(listDatabases, $root.google.firestore.admin.v1.ListDatabasesRequest, $root.google.firestore.admin.v1.ListDatabasesResponse, request, callback);
                        }, "name", { value: "ListDatabases" });
    
                        /**
                         * Calls ListDatabases.
                         * @function listDatabases
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IListDatabasesRequest} request ListDatabasesRequest message or plain object
                         * @returns {Promise<google.firestore.admin.v1.ListDatabasesResponse>} Promise
                         * @variation 2
                         */
    
                        /**
                         * Callback as used by {@link google.firestore.admin.v1.FirestoreAdmin#updateDatabase}.
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @typedef UpdateDatabaseCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {google.longrunning.Operation} [response] Operation
                         */
    
                        /**
                         * Calls UpdateDatabase.
                         * @function updateDatabase
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IUpdateDatabaseRequest} request UpdateDatabaseRequest message or plain object
                         * @param {google.firestore.admin.v1.FirestoreAdmin.UpdateDatabaseCallback} callback Node-style callback called with the error, if any, and Operation
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(FirestoreAdmin.prototype.updateDatabase = function updateDatabase(request, callback) {
                            return this.rpcCall(updateDatabase, $root.google.firestore.admin.v1.UpdateDatabaseRequest, $root.google.longrunning.Operation, request, callback);
                        }, "name", { value: "UpdateDatabase" });
    
                        /**
                         * Calls UpdateDatabase.
                         * @function updateDatabase
                         * @memberof google.firestore.admin.v1.FirestoreAdmin
                         * @instance
                         * @param {google.firestore.admin.v1.IUpdateDatabaseRequest} request UpdateDatabaseRequest message or plain object
                         * @returns {Promise<google.longrunning.Operation>} Promise
                         * @variation 2
                         */
    
                        return FirestoreAdmin;
                    })();
    
                    v1.ListDatabasesRequest = (function() {
    
                        /**
                         * Properties of a ListDatabasesRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IListDatabasesRequest
                         * @property {string|null} [parent] ListDatabasesRequest parent
                         */
    
                        /**
                         * Constructs a new ListDatabasesRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a ListDatabasesRequest.
                         * @implements IListDatabasesRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IListDatabasesRequest=} [properties] Properties to set
                         */
                        function ListDatabasesRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ListDatabasesRequest parent.
                         * @member {string} parent
                         * @memberof google.firestore.admin.v1.ListDatabasesRequest
                         * @instance
                         */
                        ListDatabasesRequest.prototype.parent = "";
    
                        /**
                         * Creates a ListDatabasesRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ListDatabasesRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ListDatabasesRequest} ListDatabasesRequest
                         */
                        ListDatabasesRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ListDatabasesRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ListDatabasesRequest();
                            if (object.parent != null)
                                message.parent = String(object.parent);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a ListDatabasesRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ListDatabasesRequest
                         * @static
                         * @param {google.firestore.admin.v1.ListDatabasesRequest} message ListDatabasesRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ListDatabasesRequest.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.parent = "";
                            if (message.parent != null && message.hasOwnProperty("parent"))
                                object.parent = message.parent;
                            return object;
                        };
    
                        /**
                         * Converts this ListDatabasesRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ListDatabasesRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ListDatabasesRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ListDatabasesRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ListDatabasesRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ListDatabasesRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ListDatabasesRequest";
                        };
    
                        return ListDatabasesRequest;
                    })();
    
                    v1.ListDatabasesResponse = (function() {
    
                        /**
                         * Properties of a ListDatabasesResponse.
                         * @memberof google.firestore.admin.v1
                         * @interface IListDatabasesResponse
                         * @property {Array.<google.firestore.admin.v1.IDatabase>|null} [databases] ListDatabasesResponse databases
                         */
    
                        /**
                         * Constructs a new ListDatabasesResponse.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a ListDatabasesResponse.
                         * @implements IListDatabasesResponse
                         * @constructor
                         * @param {google.firestore.admin.v1.IListDatabasesResponse=} [properties] Properties to set
                         */
                        function ListDatabasesResponse(properties) {
                            this.databases = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ListDatabasesResponse databases.
                         * @member {Array.<google.firestore.admin.v1.IDatabase>} databases
                         * @memberof google.firestore.admin.v1.ListDatabasesResponse
                         * @instance
                         */
                        ListDatabasesResponse.prototype.databases = $util.emptyArray;
    
                        /**
                         * Creates a ListDatabasesResponse message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ListDatabasesResponse
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ListDatabasesResponse} ListDatabasesResponse
                         */
                        ListDatabasesResponse.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ListDatabasesResponse)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ListDatabasesResponse();
                            if (object.databases) {
                                if (!Array.isArray(object.databases))
                                    throw TypeError(".google.firestore.admin.v1.ListDatabasesResponse.databases: array expected");
                                message.databases = [];
                                for (var i = 0; i < object.databases.length; ++i) {
                                    if (typeof object.databases[i] !== "object")
                                        throw TypeError(".google.firestore.admin.v1.ListDatabasesResponse.databases: object expected");
                                    message.databases[i] = $root.google.firestore.admin.v1.Database.fromObject(object.databases[i]);
                                }
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a ListDatabasesResponse message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ListDatabasesResponse
                         * @static
                         * @param {google.firestore.admin.v1.ListDatabasesResponse} message ListDatabasesResponse
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ListDatabasesResponse.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.databases = [];
                            if (message.databases && message.databases.length) {
                                object.databases = [];
                                for (var j = 0; j < message.databases.length; ++j)
                                    object.databases[j] = $root.google.firestore.admin.v1.Database.toObject(message.databases[j], options);
                            }
                            return object;
                        };
    
                        /**
                         * Converts this ListDatabasesResponse to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ListDatabasesResponse
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ListDatabasesResponse.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ListDatabasesResponse
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ListDatabasesResponse
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ListDatabasesResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ListDatabasesResponse";
                        };
    
                        return ListDatabasesResponse;
                    })();
    
                    v1.GetDatabaseRequest = (function() {
    
                        /**
                         * Properties of a GetDatabaseRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IGetDatabaseRequest
                         * @property {string|null} [name] GetDatabaseRequest name
                         */
    
                        /**
                         * Constructs a new GetDatabaseRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a GetDatabaseRequest.
                         * @implements IGetDatabaseRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IGetDatabaseRequest=} [properties] Properties to set
                         */
                        function GetDatabaseRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * GetDatabaseRequest name.
                         * @member {string} name
                         * @memberof google.firestore.admin.v1.GetDatabaseRequest
                         * @instance
                         */
                        GetDatabaseRequest.prototype.name = "";
    
                        /**
                         * Creates a GetDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.GetDatabaseRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.GetDatabaseRequest} GetDatabaseRequest
                         */
                        GetDatabaseRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.GetDatabaseRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.GetDatabaseRequest();
                            if (object.name != null)
                                message.name = String(object.name);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a GetDatabaseRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.GetDatabaseRequest
                         * @static
                         * @param {google.firestore.admin.v1.GetDatabaseRequest} message GetDatabaseRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        GetDatabaseRequest.toObject = function toObject(message, options) {
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
                         * Converts this GetDatabaseRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.GetDatabaseRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        GetDatabaseRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for GetDatabaseRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.GetDatabaseRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        GetDatabaseRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.GetDatabaseRequest";
                        };
    
                        return GetDatabaseRequest;
                    })();
    
                    v1.UpdateDatabaseRequest = (function() {
    
                        /**
                         * Properties of an UpdateDatabaseRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IUpdateDatabaseRequest
                         * @property {google.firestore.admin.v1.IDatabase|null} [database] UpdateDatabaseRequest database
                         * @property {google.protobuf.IFieldMask|null} [updateMask] UpdateDatabaseRequest updateMask
                         */
    
                        /**
                         * Constructs a new UpdateDatabaseRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an UpdateDatabaseRequest.
                         * @implements IUpdateDatabaseRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IUpdateDatabaseRequest=} [properties] Properties to set
                         */
                        function UpdateDatabaseRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * UpdateDatabaseRequest database.
                         * @member {google.firestore.admin.v1.IDatabase|null|undefined} database
                         * @memberof google.firestore.admin.v1.UpdateDatabaseRequest
                         * @instance
                         */
                        UpdateDatabaseRequest.prototype.database = null;
    
                        /**
                         * UpdateDatabaseRequest updateMask.
                         * @member {google.protobuf.IFieldMask|null|undefined} updateMask
                         * @memberof google.firestore.admin.v1.UpdateDatabaseRequest
                         * @instance
                         */
                        UpdateDatabaseRequest.prototype.updateMask = null;
    
                        /**
                         * Creates an UpdateDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.UpdateDatabaseRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.UpdateDatabaseRequest} UpdateDatabaseRequest
                         */
                        UpdateDatabaseRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.UpdateDatabaseRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.UpdateDatabaseRequest();
                            if (object.database != null) {
                                if (typeof object.database !== "object")
                                    throw TypeError(".google.firestore.admin.v1.UpdateDatabaseRequest.database: object expected");
                                message.database = $root.google.firestore.admin.v1.Database.fromObject(object.database);
                            }
                            if (object.updateMask != null) {
                                if (typeof object.updateMask !== "object")
                                    throw TypeError(".google.firestore.admin.v1.UpdateDatabaseRequest.updateMask: object expected");
                                message.updateMask = $root.google.protobuf.FieldMask.fromObject(object.updateMask);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an UpdateDatabaseRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.UpdateDatabaseRequest
                         * @static
                         * @param {google.firestore.admin.v1.UpdateDatabaseRequest} message UpdateDatabaseRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        UpdateDatabaseRequest.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.database = null;
                                object.updateMask = null;
                            }
                            if (message.database != null && message.hasOwnProperty("database"))
                                object.database = $root.google.firestore.admin.v1.Database.toObject(message.database, options);
                            if (message.updateMask != null && message.hasOwnProperty("updateMask"))
                                object.updateMask = $root.google.protobuf.FieldMask.toObject(message.updateMask, options);
                            return object;
                        };
    
                        /**
                         * Converts this UpdateDatabaseRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.UpdateDatabaseRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        UpdateDatabaseRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for UpdateDatabaseRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.UpdateDatabaseRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        UpdateDatabaseRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.UpdateDatabaseRequest";
                        };
    
                        return UpdateDatabaseRequest;
                    })();
    
                    v1.UpdateDatabaseMetadata = (function() {
    
                        /**
                         * Properties of an UpdateDatabaseMetadata.
                         * @memberof google.firestore.admin.v1
                         * @interface IUpdateDatabaseMetadata
                         */
    
                        /**
                         * Constructs a new UpdateDatabaseMetadata.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an UpdateDatabaseMetadata.
                         * @implements IUpdateDatabaseMetadata
                         * @constructor
                         * @param {google.firestore.admin.v1.IUpdateDatabaseMetadata=} [properties] Properties to set
                         */
                        function UpdateDatabaseMetadata(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * Creates an UpdateDatabaseMetadata message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.UpdateDatabaseMetadata
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.UpdateDatabaseMetadata} UpdateDatabaseMetadata
                         */
                        UpdateDatabaseMetadata.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.UpdateDatabaseMetadata)
                                return object;
                            return new $root.google.firestore.admin.v1.UpdateDatabaseMetadata();
                        };
    
                        /**
                         * Creates a plain object from an UpdateDatabaseMetadata message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.UpdateDatabaseMetadata
                         * @static
                         * @param {google.firestore.admin.v1.UpdateDatabaseMetadata} message UpdateDatabaseMetadata
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        UpdateDatabaseMetadata.toObject = function toObject() {
                            return {};
                        };
    
                        /**
                         * Converts this UpdateDatabaseMetadata to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.UpdateDatabaseMetadata
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        UpdateDatabaseMetadata.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for UpdateDatabaseMetadata
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.UpdateDatabaseMetadata
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        UpdateDatabaseMetadata.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.UpdateDatabaseMetadata";
                        };
    
                        return UpdateDatabaseMetadata;
                    })();
    
                    v1.CreateIndexRequest = (function() {
    
                        /**
                         * Properties of a CreateIndexRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface ICreateIndexRequest
                         * @property {string|null} [parent] CreateIndexRequest parent
                         * @property {google.firestore.admin.v1.IIndex|null} [index] CreateIndexRequest index
                         */
    
                        /**
                         * Constructs a new CreateIndexRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a CreateIndexRequest.
                         * @implements ICreateIndexRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.ICreateIndexRequest=} [properties] Properties to set
                         */
                        function CreateIndexRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * CreateIndexRequest parent.
                         * @member {string} parent
                         * @memberof google.firestore.admin.v1.CreateIndexRequest
                         * @instance
                         */
                        CreateIndexRequest.prototype.parent = "";
    
                        /**
                         * CreateIndexRequest index.
                         * @member {google.firestore.admin.v1.IIndex|null|undefined} index
                         * @memberof google.firestore.admin.v1.CreateIndexRequest
                         * @instance
                         */
                        CreateIndexRequest.prototype.index = null;
    
                        /**
                         * Creates a CreateIndexRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.CreateIndexRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.CreateIndexRequest} CreateIndexRequest
                         */
                        CreateIndexRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.CreateIndexRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.CreateIndexRequest();
                            if (object.parent != null)
                                message.parent = String(object.parent);
                            if (object.index != null) {
                                if (typeof object.index !== "object")
                                    throw TypeError(".google.firestore.admin.v1.CreateIndexRequest.index: object expected");
                                message.index = $root.google.firestore.admin.v1.Index.fromObject(object.index);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a CreateIndexRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.CreateIndexRequest
                         * @static
                         * @param {google.firestore.admin.v1.CreateIndexRequest} message CreateIndexRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        CreateIndexRequest.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.parent = "";
                                object.index = null;
                            }
                            if (message.parent != null && message.hasOwnProperty("parent"))
                                object.parent = message.parent;
                            if (message.index != null && message.hasOwnProperty("index"))
                                object.index = $root.google.firestore.admin.v1.Index.toObject(message.index, options);
                            return object;
                        };
    
                        /**
                         * Converts this CreateIndexRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.CreateIndexRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        CreateIndexRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for CreateIndexRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.CreateIndexRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        CreateIndexRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.CreateIndexRequest";
                        };
    
                        return CreateIndexRequest;
                    })();
    
                    v1.ListIndexesRequest = (function() {
    
                        /**
                         * Properties of a ListIndexesRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IListIndexesRequest
                         * @property {string|null} [parent] ListIndexesRequest parent
                         * @property {string|null} [filter] ListIndexesRequest filter
                         * @property {number|null} [pageSize] ListIndexesRequest pageSize
                         * @property {string|null} [pageToken] ListIndexesRequest pageToken
                         */
    
                        /**
                         * Constructs a new ListIndexesRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a ListIndexesRequest.
                         * @implements IListIndexesRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IListIndexesRequest=} [properties] Properties to set
                         */
                        function ListIndexesRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ListIndexesRequest parent.
                         * @member {string} parent
                         * @memberof google.firestore.admin.v1.ListIndexesRequest
                         * @instance
                         */
                        ListIndexesRequest.prototype.parent = "";
    
                        /**
                         * ListIndexesRequest filter.
                         * @member {string} filter
                         * @memberof google.firestore.admin.v1.ListIndexesRequest
                         * @instance
                         */
                        ListIndexesRequest.prototype.filter = "";
    
                        /**
                         * ListIndexesRequest pageSize.
                         * @member {number} pageSize
                         * @memberof google.firestore.admin.v1.ListIndexesRequest
                         * @instance
                         */
                        ListIndexesRequest.prototype.pageSize = 0;
    
                        /**
                         * ListIndexesRequest pageToken.
                         * @member {string} pageToken
                         * @memberof google.firestore.admin.v1.ListIndexesRequest
                         * @instance
                         */
                        ListIndexesRequest.prototype.pageToken = "";
    
                        /**
                         * Creates a ListIndexesRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ListIndexesRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ListIndexesRequest} ListIndexesRequest
                         */
                        ListIndexesRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ListIndexesRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ListIndexesRequest();
                            if (object.parent != null)
                                message.parent = String(object.parent);
                            if (object.filter != null)
                                message.filter = String(object.filter);
                            if (object.pageSize != null)
                                message.pageSize = object.pageSize | 0;
                            if (object.pageToken != null)
                                message.pageToken = String(object.pageToken);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a ListIndexesRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ListIndexesRequest
                         * @static
                         * @param {google.firestore.admin.v1.ListIndexesRequest} message ListIndexesRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ListIndexesRequest.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.parent = "";
                                object.filter = "";
                                object.pageSize = 0;
                                object.pageToken = "";
                            }
                            if (message.parent != null && message.hasOwnProperty("parent"))
                                object.parent = message.parent;
                            if (message.filter != null && message.hasOwnProperty("filter"))
                                object.filter = message.filter;
                            if (message.pageSize != null && message.hasOwnProperty("pageSize"))
                                object.pageSize = message.pageSize;
                            if (message.pageToken != null && message.hasOwnProperty("pageToken"))
                                object.pageToken = message.pageToken;
                            return object;
                        };
    
                        /**
                         * Converts this ListIndexesRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ListIndexesRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ListIndexesRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ListIndexesRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ListIndexesRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ListIndexesRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ListIndexesRequest";
                        };
    
                        return ListIndexesRequest;
                    })();
    
                    v1.ListIndexesResponse = (function() {
    
                        /**
                         * Properties of a ListIndexesResponse.
                         * @memberof google.firestore.admin.v1
                         * @interface IListIndexesResponse
                         * @property {Array.<google.firestore.admin.v1.IIndex>|null} [indexes] ListIndexesResponse indexes
                         * @property {string|null} [nextPageToken] ListIndexesResponse nextPageToken
                         */
    
                        /**
                         * Constructs a new ListIndexesResponse.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a ListIndexesResponse.
                         * @implements IListIndexesResponse
                         * @constructor
                         * @param {google.firestore.admin.v1.IListIndexesResponse=} [properties] Properties to set
                         */
                        function ListIndexesResponse(properties) {
                            this.indexes = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ListIndexesResponse indexes.
                         * @member {Array.<google.firestore.admin.v1.IIndex>} indexes
                         * @memberof google.firestore.admin.v1.ListIndexesResponse
                         * @instance
                         */
                        ListIndexesResponse.prototype.indexes = $util.emptyArray;
    
                        /**
                         * ListIndexesResponse nextPageToken.
                         * @member {string} nextPageToken
                         * @memberof google.firestore.admin.v1.ListIndexesResponse
                         * @instance
                         */
                        ListIndexesResponse.prototype.nextPageToken = "";
    
                        /**
                         * Creates a ListIndexesResponse message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ListIndexesResponse
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ListIndexesResponse} ListIndexesResponse
                         */
                        ListIndexesResponse.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ListIndexesResponse)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ListIndexesResponse();
                            if (object.indexes) {
                                if (!Array.isArray(object.indexes))
                                    throw TypeError(".google.firestore.admin.v1.ListIndexesResponse.indexes: array expected");
                                message.indexes = [];
                                for (var i = 0; i < object.indexes.length; ++i) {
                                    if (typeof object.indexes[i] !== "object")
                                        throw TypeError(".google.firestore.admin.v1.ListIndexesResponse.indexes: object expected");
                                    message.indexes[i] = $root.google.firestore.admin.v1.Index.fromObject(object.indexes[i]);
                                }
                            }
                            if (object.nextPageToken != null)
                                message.nextPageToken = String(object.nextPageToken);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a ListIndexesResponse message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ListIndexesResponse
                         * @static
                         * @param {google.firestore.admin.v1.ListIndexesResponse} message ListIndexesResponse
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ListIndexesResponse.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.indexes = [];
                            if (options.defaults)
                                object.nextPageToken = "";
                            if (message.indexes && message.indexes.length) {
                                object.indexes = [];
                                for (var j = 0; j < message.indexes.length; ++j)
                                    object.indexes[j] = $root.google.firestore.admin.v1.Index.toObject(message.indexes[j], options);
                            }
                            if (message.nextPageToken != null && message.hasOwnProperty("nextPageToken"))
                                object.nextPageToken = message.nextPageToken;
                            return object;
                        };
    
                        /**
                         * Converts this ListIndexesResponse to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ListIndexesResponse
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ListIndexesResponse.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ListIndexesResponse
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ListIndexesResponse
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ListIndexesResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ListIndexesResponse";
                        };
    
                        return ListIndexesResponse;
                    })();
    
                    v1.GetIndexRequest = (function() {
    
                        /**
                         * Properties of a GetIndexRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IGetIndexRequest
                         * @property {string|null} [name] GetIndexRequest name
                         */
    
                        /**
                         * Constructs a new GetIndexRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a GetIndexRequest.
                         * @implements IGetIndexRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IGetIndexRequest=} [properties] Properties to set
                         */
                        function GetIndexRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * GetIndexRequest name.
                         * @member {string} name
                         * @memberof google.firestore.admin.v1.GetIndexRequest
                         * @instance
                         */
                        GetIndexRequest.prototype.name = "";
    
                        /**
                         * Creates a GetIndexRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.GetIndexRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.GetIndexRequest} GetIndexRequest
                         */
                        GetIndexRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.GetIndexRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.GetIndexRequest();
                            if (object.name != null)
                                message.name = String(object.name);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a GetIndexRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.GetIndexRequest
                         * @static
                         * @param {google.firestore.admin.v1.GetIndexRequest} message GetIndexRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        GetIndexRequest.toObject = function toObject(message, options) {
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
                         * Converts this GetIndexRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.GetIndexRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        GetIndexRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for GetIndexRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.GetIndexRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        GetIndexRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.GetIndexRequest";
                        };
    
                        return GetIndexRequest;
                    })();
    
                    v1.DeleteIndexRequest = (function() {
    
                        /**
                         * Properties of a DeleteIndexRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IDeleteIndexRequest
                         * @property {string|null} [name] DeleteIndexRequest name
                         */
    
                        /**
                         * Constructs a new DeleteIndexRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a DeleteIndexRequest.
                         * @implements IDeleteIndexRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IDeleteIndexRequest=} [properties] Properties to set
                         */
                        function DeleteIndexRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * DeleteIndexRequest name.
                         * @member {string} name
                         * @memberof google.firestore.admin.v1.DeleteIndexRequest
                         * @instance
                         */
                        DeleteIndexRequest.prototype.name = "";
    
                        /**
                         * Creates a DeleteIndexRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.DeleteIndexRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.DeleteIndexRequest} DeleteIndexRequest
                         */
                        DeleteIndexRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.DeleteIndexRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.DeleteIndexRequest();
                            if (object.name != null)
                                message.name = String(object.name);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a DeleteIndexRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.DeleteIndexRequest
                         * @static
                         * @param {google.firestore.admin.v1.DeleteIndexRequest} message DeleteIndexRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DeleteIndexRequest.toObject = function toObject(message, options) {
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
                         * Converts this DeleteIndexRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.DeleteIndexRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DeleteIndexRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for DeleteIndexRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.DeleteIndexRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        DeleteIndexRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.DeleteIndexRequest";
                        };
    
                        return DeleteIndexRequest;
                    })();
    
                    v1.UpdateFieldRequest = (function() {
    
                        /**
                         * Properties of an UpdateFieldRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IUpdateFieldRequest
                         * @property {google.firestore.admin.v1.IField|null} [field] UpdateFieldRequest field
                         * @property {google.protobuf.IFieldMask|null} [updateMask] UpdateFieldRequest updateMask
                         */
    
                        /**
                         * Constructs a new UpdateFieldRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an UpdateFieldRequest.
                         * @implements IUpdateFieldRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IUpdateFieldRequest=} [properties] Properties to set
                         */
                        function UpdateFieldRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * UpdateFieldRequest field.
                         * @member {google.firestore.admin.v1.IField|null|undefined} field
                         * @memberof google.firestore.admin.v1.UpdateFieldRequest
                         * @instance
                         */
                        UpdateFieldRequest.prototype.field = null;
    
                        /**
                         * UpdateFieldRequest updateMask.
                         * @member {google.protobuf.IFieldMask|null|undefined} updateMask
                         * @memberof google.firestore.admin.v1.UpdateFieldRequest
                         * @instance
                         */
                        UpdateFieldRequest.prototype.updateMask = null;
    
                        /**
                         * Creates an UpdateFieldRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.UpdateFieldRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.UpdateFieldRequest} UpdateFieldRequest
                         */
                        UpdateFieldRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.UpdateFieldRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.UpdateFieldRequest();
                            if (object.field != null) {
                                if (typeof object.field !== "object")
                                    throw TypeError(".google.firestore.admin.v1.UpdateFieldRequest.field: object expected");
                                message.field = $root.google.firestore.admin.v1.Field.fromObject(object.field);
                            }
                            if (object.updateMask != null) {
                                if (typeof object.updateMask !== "object")
                                    throw TypeError(".google.firestore.admin.v1.UpdateFieldRequest.updateMask: object expected");
                                message.updateMask = $root.google.protobuf.FieldMask.fromObject(object.updateMask);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an UpdateFieldRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.UpdateFieldRequest
                         * @static
                         * @param {google.firestore.admin.v1.UpdateFieldRequest} message UpdateFieldRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        UpdateFieldRequest.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.field = null;
                                object.updateMask = null;
                            }
                            if (message.field != null && message.hasOwnProperty("field"))
                                object.field = $root.google.firestore.admin.v1.Field.toObject(message.field, options);
                            if (message.updateMask != null && message.hasOwnProperty("updateMask"))
                                object.updateMask = $root.google.protobuf.FieldMask.toObject(message.updateMask, options);
                            return object;
                        };
    
                        /**
                         * Converts this UpdateFieldRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.UpdateFieldRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        UpdateFieldRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for UpdateFieldRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.UpdateFieldRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        UpdateFieldRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.UpdateFieldRequest";
                        };
    
                        return UpdateFieldRequest;
                    })();
    
                    v1.GetFieldRequest = (function() {
    
                        /**
                         * Properties of a GetFieldRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IGetFieldRequest
                         * @property {string|null} [name] GetFieldRequest name
                         */
    
                        /**
                         * Constructs a new GetFieldRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a GetFieldRequest.
                         * @implements IGetFieldRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IGetFieldRequest=} [properties] Properties to set
                         */
                        function GetFieldRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * GetFieldRequest name.
                         * @member {string} name
                         * @memberof google.firestore.admin.v1.GetFieldRequest
                         * @instance
                         */
                        GetFieldRequest.prototype.name = "";
    
                        /**
                         * Creates a GetFieldRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.GetFieldRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.GetFieldRequest} GetFieldRequest
                         */
                        GetFieldRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.GetFieldRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.GetFieldRequest();
                            if (object.name != null)
                                message.name = String(object.name);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a GetFieldRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.GetFieldRequest
                         * @static
                         * @param {google.firestore.admin.v1.GetFieldRequest} message GetFieldRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        GetFieldRequest.toObject = function toObject(message, options) {
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
                         * Converts this GetFieldRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.GetFieldRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        GetFieldRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for GetFieldRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.GetFieldRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        GetFieldRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.GetFieldRequest";
                        };
    
                        return GetFieldRequest;
                    })();
    
                    v1.ListFieldsRequest = (function() {
    
                        /**
                         * Properties of a ListFieldsRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IListFieldsRequest
                         * @property {string|null} [parent] ListFieldsRequest parent
                         * @property {string|null} [filter] ListFieldsRequest filter
                         * @property {number|null} [pageSize] ListFieldsRequest pageSize
                         * @property {string|null} [pageToken] ListFieldsRequest pageToken
                         */
    
                        /**
                         * Constructs a new ListFieldsRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a ListFieldsRequest.
                         * @implements IListFieldsRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IListFieldsRequest=} [properties] Properties to set
                         */
                        function ListFieldsRequest(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ListFieldsRequest parent.
                         * @member {string} parent
                         * @memberof google.firestore.admin.v1.ListFieldsRequest
                         * @instance
                         */
                        ListFieldsRequest.prototype.parent = "";
    
                        /**
                         * ListFieldsRequest filter.
                         * @member {string} filter
                         * @memberof google.firestore.admin.v1.ListFieldsRequest
                         * @instance
                         */
                        ListFieldsRequest.prototype.filter = "";
    
                        /**
                         * ListFieldsRequest pageSize.
                         * @member {number} pageSize
                         * @memberof google.firestore.admin.v1.ListFieldsRequest
                         * @instance
                         */
                        ListFieldsRequest.prototype.pageSize = 0;
    
                        /**
                         * ListFieldsRequest pageToken.
                         * @member {string} pageToken
                         * @memberof google.firestore.admin.v1.ListFieldsRequest
                         * @instance
                         */
                        ListFieldsRequest.prototype.pageToken = "";
    
                        /**
                         * Creates a ListFieldsRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ListFieldsRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ListFieldsRequest} ListFieldsRequest
                         */
                        ListFieldsRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ListFieldsRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ListFieldsRequest();
                            if (object.parent != null)
                                message.parent = String(object.parent);
                            if (object.filter != null)
                                message.filter = String(object.filter);
                            if (object.pageSize != null)
                                message.pageSize = object.pageSize | 0;
                            if (object.pageToken != null)
                                message.pageToken = String(object.pageToken);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a ListFieldsRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ListFieldsRequest
                         * @static
                         * @param {google.firestore.admin.v1.ListFieldsRequest} message ListFieldsRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ListFieldsRequest.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.parent = "";
                                object.filter = "";
                                object.pageSize = 0;
                                object.pageToken = "";
                            }
                            if (message.parent != null && message.hasOwnProperty("parent"))
                                object.parent = message.parent;
                            if (message.filter != null && message.hasOwnProperty("filter"))
                                object.filter = message.filter;
                            if (message.pageSize != null && message.hasOwnProperty("pageSize"))
                                object.pageSize = message.pageSize;
                            if (message.pageToken != null && message.hasOwnProperty("pageToken"))
                                object.pageToken = message.pageToken;
                            return object;
                        };
    
                        /**
                         * Converts this ListFieldsRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ListFieldsRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ListFieldsRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ListFieldsRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ListFieldsRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ListFieldsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ListFieldsRequest";
                        };
    
                        return ListFieldsRequest;
                    })();
    
                    v1.ListFieldsResponse = (function() {
    
                        /**
                         * Properties of a ListFieldsResponse.
                         * @memberof google.firestore.admin.v1
                         * @interface IListFieldsResponse
                         * @property {Array.<google.firestore.admin.v1.IField>|null} [fields] ListFieldsResponse fields
                         * @property {string|null} [nextPageToken] ListFieldsResponse nextPageToken
                         */
    
                        /**
                         * Constructs a new ListFieldsResponse.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a ListFieldsResponse.
                         * @implements IListFieldsResponse
                         * @constructor
                         * @param {google.firestore.admin.v1.IListFieldsResponse=} [properties] Properties to set
                         */
                        function ListFieldsResponse(properties) {
                            this.fields = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ListFieldsResponse fields.
                         * @member {Array.<google.firestore.admin.v1.IField>} fields
                         * @memberof google.firestore.admin.v1.ListFieldsResponse
                         * @instance
                         */
                        ListFieldsResponse.prototype.fields = $util.emptyArray;
    
                        /**
                         * ListFieldsResponse nextPageToken.
                         * @member {string} nextPageToken
                         * @memberof google.firestore.admin.v1.ListFieldsResponse
                         * @instance
                         */
                        ListFieldsResponse.prototype.nextPageToken = "";
    
                        /**
                         * Creates a ListFieldsResponse message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ListFieldsResponse
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ListFieldsResponse} ListFieldsResponse
                         */
                        ListFieldsResponse.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ListFieldsResponse)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ListFieldsResponse();
                            if (object.fields) {
                                if (!Array.isArray(object.fields))
                                    throw TypeError(".google.firestore.admin.v1.ListFieldsResponse.fields: array expected");
                                message.fields = [];
                                for (var i = 0; i < object.fields.length; ++i) {
                                    if (typeof object.fields[i] !== "object")
                                        throw TypeError(".google.firestore.admin.v1.ListFieldsResponse.fields: object expected");
                                    message.fields[i] = $root.google.firestore.admin.v1.Field.fromObject(object.fields[i]);
                                }
                            }
                            if (object.nextPageToken != null)
                                message.nextPageToken = String(object.nextPageToken);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a ListFieldsResponse message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ListFieldsResponse
                         * @static
                         * @param {google.firestore.admin.v1.ListFieldsResponse} message ListFieldsResponse
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ListFieldsResponse.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.fields = [];
                            if (options.defaults)
                                object.nextPageToken = "";
                            if (message.fields && message.fields.length) {
                                object.fields = [];
                                for (var j = 0; j < message.fields.length; ++j)
                                    object.fields[j] = $root.google.firestore.admin.v1.Field.toObject(message.fields[j], options);
                            }
                            if (message.nextPageToken != null && message.hasOwnProperty("nextPageToken"))
                                object.nextPageToken = message.nextPageToken;
                            return object;
                        };
    
                        /**
                         * Converts this ListFieldsResponse to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ListFieldsResponse
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ListFieldsResponse.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ListFieldsResponse
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ListFieldsResponse
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ListFieldsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ListFieldsResponse";
                        };
    
                        return ListFieldsResponse;
                    })();
    
                    v1.ExportDocumentsRequest = (function() {
    
                        /**
                         * Properties of an ExportDocumentsRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IExportDocumentsRequest
                         * @property {string|null} [name] ExportDocumentsRequest name
                         * @property {Array.<string>|null} [collectionIds] ExportDocumentsRequest collectionIds
                         * @property {string|null} [outputUriPrefix] ExportDocumentsRequest outputUriPrefix
                         */
    
                        /**
                         * Constructs a new ExportDocumentsRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an ExportDocumentsRequest.
                         * @implements IExportDocumentsRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IExportDocumentsRequest=} [properties] Properties to set
                         */
                        function ExportDocumentsRequest(properties) {
                            this.collectionIds = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ExportDocumentsRequest name.
                         * @member {string} name
                         * @memberof google.firestore.admin.v1.ExportDocumentsRequest
                         * @instance
                         */
                        ExportDocumentsRequest.prototype.name = "";
    
                        /**
                         * ExportDocumentsRequest collectionIds.
                         * @member {Array.<string>} collectionIds
                         * @memberof google.firestore.admin.v1.ExportDocumentsRequest
                         * @instance
                         */
                        ExportDocumentsRequest.prototype.collectionIds = $util.emptyArray;
    
                        /**
                         * ExportDocumentsRequest outputUriPrefix.
                         * @member {string} outputUriPrefix
                         * @memberof google.firestore.admin.v1.ExportDocumentsRequest
                         * @instance
                         */
                        ExportDocumentsRequest.prototype.outputUriPrefix = "";
    
                        /**
                         * Creates an ExportDocumentsRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ExportDocumentsRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ExportDocumentsRequest} ExportDocumentsRequest
                         */
                        ExportDocumentsRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ExportDocumentsRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ExportDocumentsRequest();
                            if (object.name != null)
                                message.name = String(object.name);
                            if (object.collectionIds) {
                                if (!Array.isArray(object.collectionIds))
                                    throw TypeError(".google.firestore.admin.v1.ExportDocumentsRequest.collectionIds: array expected");
                                message.collectionIds = [];
                                for (var i = 0; i < object.collectionIds.length; ++i)
                                    message.collectionIds[i] = String(object.collectionIds[i]);
                            }
                            if (object.outputUriPrefix != null)
                                message.outputUriPrefix = String(object.outputUriPrefix);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an ExportDocumentsRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ExportDocumentsRequest
                         * @static
                         * @param {google.firestore.admin.v1.ExportDocumentsRequest} message ExportDocumentsRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ExportDocumentsRequest.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.collectionIds = [];
                            if (options.defaults) {
                                object.name = "";
                                object.outputUriPrefix = "";
                            }
                            if (message.name != null && message.hasOwnProperty("name"))
                                object.name = message.name;
                            if (message.collectionIds && message.collectionIds.length) {
                                object.collectionIds = [];
                                for (var j = 0; j < message.collectionIds.length; ++j)
                                    object.collectionIds[j] = message.collectionIds[j];
                            }
                            if (message.outputUriPrefix != null && message.hasOwnProperty("outputUriPrefix"))
                                object.outputUriPrefix = message.outputUriPrefix;
                            return object;
                        };
    
                        /**
                         * Converts this ExportDocumentsRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ExportDocumentsRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ExportDocumentsRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ExportDocumentsRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ExportDocumentsRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ExportDocumentsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ExportDocumentsRequest";
                        };
    
                        return ExportDocumentsRequest;
                    })();
    
                    v1.ImportDocumentsRequest = (function() {
    
                        /**
                         * Properties of an ImportDocumentsRequest.
                         * @memberof google.firestore.admin.v1
                         * @interface IImportDocumentsRequest
                         * @property {string|null} [name] ImportDocumentsRequest name
                         * @property {Array.<string>|null} [collectionIds] ImportDocumentsRequest collectionIds
                         * @property {string|null} [inputUriPrefix] ImportDocumentsRequest inputUriPrefix
                         */
    
                        /**
                         * Constructs a new ImportDocumentsRequest.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an ImportDocumentsRequest.
                         * @implements IImportDocumentsRequest
                         * @constructor
                         * @param {google.firestore.admin.v1.IImportDocumentsRequest=} [properties] Properties to set
                         */
                        function ImportDocumentsRequest(properties) {
                            this.collectionIds = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ImportDocumentsRequest name.
                         * @member {string} name
                         * @memberof google.firestore.admin.v1.ImportDocumentsRequest
                         * @instance
                         */
                        ImportDocumentsRequest.prototype.name = "";
    
                        /**
                         * ImportDocumentsRequest collectionIds.
                         * @member {Array.<string>} collectionIds
                         * @memberof google.firestore.admin.v1.ImportDocumentsRequest
                         * @instance
                         */
                        ImportDocumentsRequest.prototype.collectionIds = $util.emptyArray;
    
                        /**
                         * ImportDocumentsRequest inputUriPrefix.
                         * @member {string} inputUriPrefix
                         * @memberof google.firestore.admin.v1.ImportDocumentsRequest
                         * @instance
                         */
                        ImportDocumentsRequest.prototype.inputUriPrefix = "";
    
                        /**
                         * Creates an ImportDocumentsRequest message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ImportDocumentsRequest
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ImportDocumentsRequest} ImportDocumentsRequest
                         */
                        ImportDocumentsRequest.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ImportDocumentsRequest)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ImportDocumentsRequest();
                            if (object.name != null)
                                message.name = String(object.name);
                            if (object.collectionIds) {
                                if (!Array.isArray(object.collectionIds))
                                    throw TypeError(".google.firestore.admin.v1.ImportDocumentsRequest.collectionIds: array expected");
                                message.collectionIds = [];
                                for (var i = 0; i < object.collectionIds.length; ++i)
                                    message.collectionIds[i] = String(object.collectionIds[i]);
                            }
                            if (object.inputUriPrefix != null)
                                message.inputUriPrefix = String(object.inputUriPrefix);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an ImportDocumentsRequest message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ImportDocumentsRequest
                         * @static
                         * @param {google.firestore.admin.v1.ImportDocumentsRequest} message ImportDocumentsRequest
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ImportDocumentsRequest.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.collectionIds = [];
                            if (options.defaults) {
                                object.name = "";
                                object.inputUriPrefix = "";
                            }
                            if (message.name != null && message.hasOwnProperty("name"))
                                object.name = message.name;
                            if (message.collectionIds && message.collectionIds.length) {
                                object.collectionIds = [];
                                for (var j = 0; j < message.collectionIds.length; ++j)
                                    object.collectionIds[j] = message.collectionIds[j];
                            }
                            if (message.inputUriPrefix != null && message.hasOwnProperty("inputUriPrefix"))
                                object.inputUriPrefix = message.inputUriPrefix;
                            return object;
                        };
    
                        /**
                         * Converts this ImportDocumentsRequest to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ImportDocumentsRequest
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ImportDocumentsRequest.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ImportDocumentsRequest
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ImportDocumentsRequest
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ImportDocumentsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ImportDocumentsRequest";
                        };
    
                        return ImportDocumentsRequest;
                    })();
    
                    v1.Index = (function() {
    
                        /**
                         * Properties of an Index.
                         * @memberof google.firestore.admin.v1
                         * @interface IIndex
                         * @property {string|null} [name] Index name
                         * @property {google.firestore.admin.v1.Index.QueryScope|null} [queryScope] Index queryScope
                         * @property {Array.<google.firestore.admin.v1.Index.IIndexField>|null} [fields] Index fields
                         * @property {google.firestore.admin.v1.Index.State|null} [state] Index state
                         */
    
                        /**
                         * Constructs a new Index.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an Index.
                         * @implements IIndex
                         * @constructor
                         * @param {google.firestore.admin.v1.IIndex=} [properties] Properties to set
                         */
                        function Index(properties) {
                            this.fields = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * Index name.
                         * @member {string} name
                         * @memberof google.firestore.admin.v1.Index
                         * @instance
                         */
                        Index.prototype.name = "";
    
                        /**
                         * Index queryScope.
                         * @member {google.firestore.admin.v1.Index.QueryScope} queryScope
                         * @memberof google.firestore.admin.v1.Index
                         * @instance
                         */
                        Index.prototype.queryScope = 0;
    
                        /**
                         * Index fields.
                         * @member {Array.<google.firestore.admin.v1.Index.IIndexField>} fields
                         * @memberof google.firestore.admin.v1.Index
                         * @instance
                         */
                        Index.prototype.fields = $util.emptyArray;
    
                        /**
                         * Index state.
                         * @member {google.firestore.admin.v1.Index.State} state
                         * @memberof google.firestore.admin.v1.Index
                         * @instance
                         */
                        Index.prototype.state = 0;
    
                        /**
                         * Creates an Index message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.Index
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.Index} Index
                         */
                        Index.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.Index)
                                return object;
                            var message = new $root.google.firestore.admin.v1.Index();
                            if (object.name != null)
                                message.name = String(object.name);
                            switch (object.queryScope) {
                            default:
                                if (typeof object.queryScope === "number") {
                                    message.queryScope = object.queryScope;
                                    break;
                                }
                                break;
                            case "QUERY_SCOPE_UNSPECIFIED":
                            case 0:
                                message.queryScope = 0;
                                break;
                            case "COLLECTION":
                            case 1:
                                message.queryScope = 1;
                                break;
                            case "COLLECTION_GROUP":
                            case 2:
                                message.queryScope = 2;
                                break;
                            }
                            if (object.fields) {
                                if (!Array.isArray(object.fields))
                                    throw TypeError(".google.firestore.admin.v1.Index.fields: array expected");
                                message.fields = [];
                                for (var i = 0; i < object.fields.length; ++i) {
                                    if (typeof object.fields[i] !== "object")
                                        throw TypeError(".google.firestore.admin.v1.Index.fields: object expected");
                                    message.fields[i] = $root.google.firestore.admin.v1.Index.IndexField.fromObject(object.fields[i]);
                                }
                            }
                            switch (object.state) {
                            default:
                                if (typeof object.state === "number") {
                                    message.state = object.state;
                                    break;
                                }
                                break;
                            case "STATE_UNSPECIFIED":
                            case 0:
                                message.state = 0;
                                break;
                            case "CREATING":
                            case 1:
                                message.state = 1;
                                break;
                            case "READY":
                            case 2:
                                message.state = 2;
                                break;
                            case "NEEDS_REPAIR":
                            case 3:
                                message.state = 3;
                                break;
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an Index message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.Index
                         * @static
                         * @param {google.firestore.admin.v1.Index} message Index
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Index.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.fields = [];
                            if (options.defaults) {
                                object.name = "";
                                object.queryScope = options.enums === String ? "QUERY_SCOPE_UNSPECIFIED" : 0;
                                object.state = options.enums === String ? "STATE_UNSPECIFIED" : 0;
                            }
                            if (message.name != null && message.hasOwnProperty("name"))
                                object.name = message.name;
                            if (message.queryScope != null && message.hasOwnProperty("queryScope"))
                                object.queryScope = options.enums === String ? $root.google.firestore.admin.v1.Index.QueryScope[message.queryScope] === undefined ? message.queryScope : $root.google.firestore.admin.v1.Index.QueryScope[message.queryScope] : message.queryScope;
                            if (message.fields && message.fields.length) {
                                object.fields = [];
                                for (var j = 0; j < message.fields.length; ++j)
                                    object.fields[j] = $root.google.firestore.admin.v1.Index.IndexField.toObject(message.fields[j], options);
                            }
                            if (message.state != null && message.hasOwnProperty("state"))
                                object.state = options.enums === String ? $root.google.firestore.admin.v1.Index.State[message.state] === undefined ? message.state : $root.google.firestore.admin.v1.Index.State[message.state] : message.state;
                            return object;
                        };
    
                        /**
                         * Converts this Index to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.Index
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Index.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for Index
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.Index
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        Index.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.Index";
                        };
    
                        /**
                         * QueryScope enum.
                         * @name google.firestore.admin.v1.Index.QueryScope
                         * @enum {string}
                         * @property {string} QUERY_SCOPE_UNSPECIFIED=QUERY_SCOPE_UNSPECIFIED QUERY_SCOPE_UNSPECIFIED value
                         * @property {string} COLLECTION=COLLECTION COLLECTION value
                         * @property {string} COLLECTION_GROUP=COLLECTION_GROUP COLLECTION_GROUP value
                         */
                        Index.QueryScope = (function() {
                            var valuesById = {}, values = Object.create(valuesById);
                            values[valuesById[0] = "QUERY_SCOPE_UNSPECIFIED"] = "QUERY_SCOPE_UNSPECIFIED";
                            values[valuesById[1] = "COLLECTION"] = "COLLECTION";
                            values[valuesById[2] = "COLLECTION_GROUP"] = "COLLECTION_GROUP";
                            return values;
                        })();
    
                        Index.IndexField = (function() {
    
                            /**
                             * Properties of an IndexField.
                             * @memberof google.firestore.admin.v1.Index
                             * @interface IIndexField
                             * @property {string|null} [fieldPath] IndexField fieldPath
                             * @property {google.firestore.admin.v1.Index.IndexField.Order|null} [order] IndexField order
                             * @property {google.firestore.admin.v1.Index.IndexField.ArrayConfig|null} [arrayConfig] IndexField arrayConfig
                             */
    
                            /**
                             * Constructs a new IndexField.
                             * @memberof google.firestore.admin.v1.Index
                             * @classdesc Represents an IndexField.
                             * @implements IIndexField
                             * @constructor
                             * @param {google.firestore.admin.v1.Index.IIndexField=} [properties] Properties to set
                             */
                            function IndexField(properties) {
                                if (properties)
                                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                        if (properties[keys[i]] != null)
                                            this[keys[i]] = properties[keys[i]];
                            }
    
                            /**
                             * IndexField fieldPath.
                             * @member {string} fieldPath
                             * @memberof google.firestore.admin.v1.Index.IndexField
                             * @instance
                             */
                            IndexField.prototype.fieldPath = "";
    
                            /**
                             * IndexField order.
                             * @member {google.firestore.admin.v1.Index.IndexField.Order|null|undefined} order
                             * @memberof google.firestore.admin.v1.Index.IndexField
                             * @instance
                             */
                            IndexField.prototype.order = null;
    
                            /**
                             * IndexField arrayConfig.
                             * @member {google.firestore.admin.v1.Index.IndexField.ArrayConfig|null|undefined} arrayConfig
                             * @memberof google.firestore.admin.v1.Index.IndexField
                             * @instance
                             */
                            IndexField.prototype.arrayConfig = null;
    
                            // OneOf field names bound to virtual getters and setters
                            var $oneOfFields;
    
                            /**
                             * IndexField valueMode.
                             * @member {"order"|"arrayConfig"|undefined} valueMode
                             * @memberof google.firestore.admin.v1.Index.IndexField
                             * @instance
                             */
                            Object.defineProperty(IndexField.prototype, "valueMode", {
                                get: $util.oneOfGetter($oneOfFields = ["order", "arrayConfig"]),
                                set: $util.oneOfSetter($oneOfFields)
                            });
    
                            /**
                             * Creates an IndexField message from a plain object. Also converts values to their respective internal types.
                             * @function fromObject
                             * @memberof google.firestore.admin.v1.Index.IndexField
                             * @static
                             * @param {Object.<string,*>} object Plain object
                             * @returns {google.firestore.admin.v1.Index.IndexField} IndexField
                             */
                            IndexField.fromObject = function fromObject(object) {
                                if (object instanceof $root.google.firestore.admin.v1.Index.IndexField)
                                    return object;
                                var message = new $root.google.firestore.admin.v1.Index.IndexField();
                                if (object.fieldPath != null)
                                    message.fieldPath = String(object.fieldPath);
                                switch (object.order) {
                                default:
                                    if (typeof object.order === "number") {
                                        message.order = object.order;
                                        break;
                                    }
                                    break;
                                case "ORDER_UNSPECIFIED":
                                case 0:
                                    message.order = 0;
                                    break;
                                case "ASCENDING":
                                case 1:
                                    message.order = 1;
                                    break;
                                case "DESCENDING":
                                case 2:
                                    message.order = 2;
                                    break;
                                }
                                switch (object.arrayConfig) {
                                default:
                                    if (typeof object.arrayConfig === "number") {
                                        message.arrayConfig = object.arrayConfig;
                                        break;
                                    }
                                    break;
                                case "ARRAY_CONFIG_UNSPECIFIED":
                                case 0:
                                    message.arrayConfig = 0;
                                    break;
                                case "CONTAINS":
                                case 1:
                                    message.arrayConfig = 1;
                                    break;
                                }
                                return message;
                            };
    
                            /**
                             * Creates a plain object from an IndexField message. Also converts values to other types if specified.
                             * @function toObject
                             * @memberof google.firestore.admin.v1.Index.IndexField
                             * @static
                             * @param {google.firestore.admin.v1.Index.IndexField} message IndexField
                             * @param {$protobuf.IConversionOptions} [options] Conversion options
                             * @returns {Object.<string,*>} Plain object
                             */
                            IndexField.toObject = function toObject(message, options) {
                                if (!options)
                                    options = {};
                                var object = {};
                                if (options.defaults)
                                    object.fieldPath = "";
                                if (message.fieldPath != null && message.hasOwnProperty("fieldPath"))
                                    object.fieldPath = message.fieldPath;
                                if (message.order != null && message.hasOwnProperty("order")) {
                                    object.order = options.enums === String ? $root.google.firestore.admin.v1.Index.IndexField.Order[message.order] === undefined ? message.order : $root.google.firestore.admin.v1.Index.IndexField.Order[message.order] : message.order;
                                    if (options.oneofs)
                                        object.valueMode = "order";
                                }
                                if (message.arrayConfig != null && message.hasOwnProperty("arrayConfig")) {
                                    object.arrayConfig = options.enums === String ? $root.google.firestore.admin.v1.Index.IndexField.ArrayConfig[message.arrayConfig] === undefined ? message.arrayConfig : $root.google.firestore.admin.v1.Index.IndexField.ArrayConfig[message.arrayConfig] : message.arrayConfig;
                                    if (options.oneofs)
                                        object.valueMode = "arrayConfig";
                                }
                                return object;
                            };
    
                            /**
                             * Converts this IndexField to JSON.
                             * @function toJSON
                             * @memberof google.firestore.admin.v1.Index.IndexField
                             * @instance
                             * @returns {Object.<string,*>} JSON object
                             */
                            IndexField.prototype.toJSON = function toJSON() {
                                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                            };
    
                            /**
                             * Gets the default type url for IndexField
                             * @function getTypeUrl
                             * @memberof google.firestore.admin.v1.Index.IndexField
                             * @static
                             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                             * @returns {string} The default type url
                             */
                            IndexField.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                                if (typeUrlPrefix === undefined) {
                                    typeUrlPrefix = "type.googleapis.com";
                                }
                                return typeUrlPrefix + "/google.firestore.admin.v1.Index.IndexField";
                            };
    
                            /**
                             * Order enum.
                             * @name google.firestore.admin.v1.Index.IndexField.Order
                             * @enum {string}
                             * @property {string} ORDER_UNSPECIFIED=ORDER_UNSPECIFIED ORDER_UNSPECIFIED value
                             * @property {string} ASCENDING=ASCENDING ASCENDING value
                             * @property {string} DESCENDING=DESCENDING DESCENDING value
                             */
                            IndexField.Order = (function() {
                                var valuesById = {}, values = Object.create(valuesById);
                                values[valuesById[0] = "ORDER_UNSPECIFIED"] = "ORDER_UNSPECIFIED";
                                values[valuesById[1] = "ASCENDING"] = "ASCENDING";
                                values[valuesById[2] = "DESCENDING"] = "DESCENDING";
                                return values;
                            })();
    
                            /**
                             * ArrayConfig enum.
                             * @name google.firestore.admin.v1.Index.IndexField.ArrayConfig
                             * @enum {string}
                             * @property {string} ARRAY_CONFIG_UNSPECIFIED=ARRAY_CONFIG_UNSPECIFIED ARRAY_CONFIG_UNSPECIFIED value
                             * @property {string} CONTAINS=CONTAINS CONTAINS value
                             */
                            IndexField.ArrayConfig = (function() {
                                var valuesById = {}, values = Object.create(valuesById);
                                values[valuesById[0] = "ARRAY_CONFIG_UNSPECIFIED"] = "ARRAY_CONFIG_UNSPECIFIED";
                                values[valuesById[1] = "CONTAINS"] = "CONTAINS";
                                return values;
                            })();
    
                            return IndexField;
                        })();
    
                        /**
                         * State enum.
                         * @name google.firestore.admin.v1.Index.State
                         * @enum {string}
                         * @property {string} STATE_UNSPECIFIED=STATE_UNSPECIFIED STATE_UNSPECIFIED value
                         * @property {string} CREATING=CREATING CREATING value
                         * @property {string} READY=READY READY value
                         * @property {string} NEEDS_REPAIR=NEEDS_REPAIR NEEDS_REPAIR value
                         */
                        Index.State = (function() {
                            var valuesById = {}, values = Object.create(valuesById);
                            values[valuesById[0] = "STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
                            values[valuesById[1] = "CREATING"] = "CREATING";
                            values[valuesById[2] = "READY"] = "READY";
                            values[valuesById[3] = "NEEDS_REPAIR"] = "NEEDS_REPAIR";
                            return values;
                        })();
    
                        return Index;
                    })();
    
                    v1.LocationMetadata = (function() {
    
                        /**
                         * Properties of a LocationMetadata.
                         * @memberof google.firestore.admin.v1
                         * @interface ILocationMetadata
                         */
    
                        /**
                         * Constructs a new LocationMetadata.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a LocationMetadata.
                         * @implements ILocationMetadata
                         * @constructor
                         * @param {google.firestore.admin.v1.ILocationMetadata=} [properties] Properties to set
                         */
                        function LocationMetadata(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * Creates a LocationMetadata message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.LocationMetadata
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.LocationMetadata} LocationMetadata
                         */
                        LocationMetadata.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.LocationMetadata)
                                return object;
                            return new $root.google.firestore.admin.v1.LocationMetadata();
                        };
    
                        /**
                         * Creates a plain object from a LocationMetadata message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.LocationMetadata
                         * @static
                         * @param {google.firestore.admin.v1.LocationMetadata} message LocationMetadata
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        LocationMetadata.toObject = function toObject() {
                            return {};
                        };
    
                        /**
                         * Converts this LocationMetadata to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.LocationMetadata
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        LocationMetadata.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for LocationMetadata
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.LocationMetadata
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        LocationMetadata.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.LocationMetadata";
                        };
    
                        return LocationMetadata;
                    })();
    
                    v1.IndexOperationMetadata = (function() {
    
                        /**
                         * Properties of an IndexOperationMetadata.
                         * @memberof google.firestore.admin.v1
                         * @interface IIndexOperationMetadata
                         * @property {google.protobuf.ITimestamp|null} [startTime] IndexOperationMetadata startTime
                         * @property {google.protobuf.ITimestamp|null} [endTime] IndexOperationMetadata endTime
                         * @property {string|null} [index] IndexOperationMetadata index
                         * @property {google.firestore.admin.v1.OperationState|null} [state] IndexOperationMetadata state
                         * @property {google.firestore.admin.v1.IProgress|null} [progressDocuments] IndexOperationMetadata progressDocuments
                         * @property {google.firestore.admin.v1.IProgress|null} [progressBytes] IndexOperationMetadata progressBytes
                         */
    
                        /**
                         * Constructs a new IndexOperationMetadata.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an IndexOperationMetadata.
                         * @implements IIndexOperationMetadata
                         * @constructor
                         * @param {google.firestore.admin.v1.IIndexOperationMetadata=} [properties] Properties to set
                         */
                        function IndexOperationMetadata(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * IndexOperationMetadata startTime.
                         * @member {google.protobuf.ITimestamp|null|undefined} startTime
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @instance
                         */
                        IndexOperationMetadata.prototype.startTime = null;
    
                        /**
                         * IndexOperationMetadata endTime.
                         * @member {google.protobuf.ITimestamp|null|undefined} endTime
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @instance
                         */
                        IndexOperationMetadata.prototype.endTime = null;
    
                        /**
                         * IndexOperationMetadata index.
                         * @member {string} index
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @instance
                         */
                        IndexOperationMetadata.prototype.index = "";
    
                        /**
                         * IndexOperationMetadata state.
                         * @member {google.firestore.admin.v1.OperationState} state
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @instance
                         */
                        IndexOperationMetadata.prototype.state = 0;
    
                        /**
                         * IndexOperationMetadata progressDocuments.
                         * @member {google.firestore.admin.v1.IProgress|null|undefined} progressDocuments
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @instance
                         */
                        IndexOperationMetadata.prototype.progressDocuments = null;
    
                        /**
                         * IndexOperationMetadata progressBytes.
                         * @member {google.firestore.admin.v1.IProgress|null|undefined} progressBytes
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @instance
                         */
                        IndexOperationMetadata.prototype.progressBytes = null;
    
                        /**
                         * Creates an IndexOperationMetadata message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.IndexOperationMetadata} IndexOperationMetadata
                         */
                        IndexOperationMetadata.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.IndexOperationMetadata)
                                return object;
                            var message = new $root.google.firestore.admin.v1.IndexOperationMetadata();
                            if (object.startTime != null) {
                                if (typeof object.startTime !== "object")
                                    throw TypeError(".google.firestore.admin.v1.IndexOperationMetadata.startTime: object expected");
                                message.startTime = $root.google.protobuf.Timestamp.fromObject(object.startTime);
                            }
                            if (object.endTime != null) {
                                if (typeof object.endTime !== "object")
                                    throw TypeError(".google.firestore.admin.v1.IndexOperationMetadata.endTime: object expected");
                                message.endTime = $root.google.protobuf.Timestamp.fromObject(object.endTime);
                            }
                            if (object.index != null)
                                message.index = String(object.index);
                            switch (object.state) {
                            default:
                                if (typeof object.state === "number") {
                                    message.state = object.state;
                                    break;
                                }
                                break;
                            case "OPERATION_STATE_UNSPECIFIED":
                            case 0:
                                message.state = 0;
                                break;
                            case "INITIALIZING":
                            case 1:
                                message.state = 1;
                                break;
                            case "PROCESSING":
                            case 2:
                                message.state = 2;
                                break;
                            case "CANCELLING":
                            case 3:
                                message.state = 3;
                                break;
                            case "FINALIZING":
                            case 4:
                                message.state = 4;
                                break;
                            case "SUCCESSFUL":
                            case 5:
                                message.state = 5;
                                break;
                            case "FAILED":
                            case 6:
                                message.state = 6;
                                break;
                            case "CANCELLED":
                            case 7:
                                message.state = 7;
                                break;
                            }
                            if (object.progressDocuments != null) {
                                if (typeof object.progressDocuments !== "object")
                                    throw TypeError(".google.firestore.admin.v1.IndexOperationMetadata.progressDocuments: object expected");
                                message.progressDocuments = $root.google.firestore.admin.v1.Progress.fromObject(object.progressDocuments);
                            }
                            if (object.progressBytes != null) {
                                if (typeof object.progressBytes !== "object")
                                    throw TypeError(".google.firestore.admin.v1.IndexOperationMetadata.progressBytes: object expected");
                                message.progressBytes = $root.google.firestore.admin.v1.Progress.fromObject(object.progressBytes);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an IndexOperationMetadata message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @static
                         * @param {google.firestore.admin.v1.IndexOperationMetadata} message IndexOperationMetadata
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        IndexOperationMetadata.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.startTime = null;
                                object.endTime = null;
                                object.index = "";
                                object.state = options.enums === String ? "OPERATION_STATE_UNSPECIFIED" : 0;
                                object.progressDocuments = null;
                                object.progressBytes = null;
                            }
                            if (message.startTime != null && message.hasOwnProperty("startTime"))
                                object.startTime = $root.google.protobuf.Timestamp.toObject(message.startTime, options);
                            if (message.endTime != null && message.hasOwnProperty("endTime"))
                                object.endTime = $root.google.protobuf.Timestamp.toObject(message.endTime, options);
                            if (message.index != null && message.hasOwnProperty("index"))
                                object.index = message.index;
                            if (message.state != null && message.hasOwnProperty("state"))
                                object.state = options.enums === String ? $root.google.firestore.admin.v1.OperationState[message.state] === undefined ? message.state : $root.google.firestore.admin.v1.OperationState[message.state] : message.state;
                            if (message.progressDocuments != null && message.hasOwnProperty("progressDocuments"))
                                object.progressDocuments = $root.google.firestore.admin.v1.Progress.toObject(message.progressDocuments, options);
                            if (message.progressBytes != null && message.hasOwnProperty("progressBytes"))
                                object.progressBytes = $root.google.firestore.admin.v1.Progress.toObject(message.progressBytes, options);
                            return object;
                        };
    
                        /**
                         * Converts this IndexOperationMetadata to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        IndexOperationMetadata.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for IndexOperationMetadata
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.IndexOperationMetadata
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        IndexOperationMetadata.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.IndexOperationMetadata";
                        };
    
                        return IndexOperationMetadata;
                    })();
    
                    v1.FieldOperationMetadata = (function() {
    
                        /**
                         * Properties of a FieldOperationMetadata.
                         * @memberof google.firestore.admin.v1
                         * @interface IFieldOperationMetadata
                         * @property {google.protobuf.ITimestamp|null} [startTime] FieldOperationMetadata startTime
                         * @property {google.protobuf.ITimestamp|null} [endTime] FieldOperationMetadata endTime
                         * @property {string|null} [field] FieldOperationMetadata field
                         * @property {Array.<google.firestore.admin.v1.FieldOperationMetadata.IIndexConfigDelta>|null} [indexConfigDeltas] FieldOperationMetadata indexConfigDeltas
                         * @property {google.firestore.admin.v1.OperationState|null} [state] FieldOperationMetadata state
                         * @property {google.firestore.admin.v1.IProgress|null} [progressDocuments] FieldOperationMetadata progressDocuments
                         * @property {google.firestore.admin.v1.IProgress|null} [progressBytes] FieldOperationMetadata progressBytes
                         * @property {google.firestore.admin.v1.FieldOperationMetadata.ITtlConfigDelta|null} [ttlConfigDelta] FieldOperationMetadata ttlConfigDelta
                         */
    
                        /**
                         * Constructs a new FieldOperationMetadata.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a FieldOperationMetadata.
                         * @implements IFieldOperationMetadata
                         * @constructor
                         * @param {google.firestore.admin.v1.IFieldOperationMetadata=} [properties] Properties to set
                         */
                        function FieldOperationMetadata(properties) {
                            this.indexConfigDeltas = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * FieldOperationMetadata startTime.
                         * @member {google.protobuf.ITimestamp|null|undefined} startTime
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @instance
                         */
                        FieldOperationMetadata.prototype.startTime = null;
    
                        /**
                         * FieldOperationMetadata endTime.
                         * @member {google.protobuf.ITimestamp|null|undefined} endTime
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @instance
                         */
                        FieldOperationMetadata.prototype.endTime = null;
    
                        /**
                         * FieldOperationMetadata field.
                         * @member {string} field
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @instance
                         */
                        FieldOperationMetadata.prototype.field = "";
    
                        /**
                         * FieldOperationMetadata indexConfigDeltas.
                         * @member {Array.<google.firestore.admin.v1.FieldOperationMetadata.IIndexConfigDelta>} indexConfigDeltas
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @instance
                         */
                        FieldOperationMetadata.prototype.indexConfigDeltas = $util.emptyArray;
    
                        /**
                         * FieldOperationMetadata state.
                         * @member {google.firestore.admin.v1.OperationState} state
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @instance
                         */
                        FieldOperationMetadata.prototype.state = 0;
    
                        /**
                         * FieldOperationMetadata progressDocuments.
                         * @member {google.firestore.admin.v1.IProgress|null|undefined} progressDocuments
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @instance
                         */
                        FieldOperationMetadata.prototype.progressDocuments = null;
    
                        /**
                         * FieldOperationMetadata progressBytes.
                         * @member {google.firestore.admin.v1.IProgress|null|undefined} progressBytes
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @instance
                         */
                        FieldOperationMetadata.prototype.progressBytes = null;
    
                        /**
                         * FieldOperationMetadata ttlConfigDelta.
                         * @member {google.firestore.admin.v1.FieldOperationMetadata.ITtlConfigDelta|null|undefined} ttlConfigDelta
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @instance
                         */
                        FieldOperationMetadata.prototype.ttlConfigDelta = null;
    
                        /**
                         * Creates a FieldOperationMetadata message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.FieldOperationMetadata} FieldOperationMetadata
                         */
                        FieldOperationMetadata.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.FieldOperationMetadata)
                                return object;
                            var message = new $root.google.firestore.admin.v1.FieldOperationMetadata();
                            if (object.startTime != null) {
                                if (typeof object.startTime !== "object")
                                    throw TypeError(".google.firestore.admin.v1.FieldOperationMetadata.startTime: object expected");
                                message.startTime = $root.google.protobuf.Timestamp.fromObject(object.startTime);
                            }
                            if (object.endTime != null) {
                                if (typeof object.endTime !== "object")
                                    throw TypeError(".google.firestore.admin.v1.FieldOperationMetadata.endTime: object expected");
                                message.endTime = $root.google.protobuf.Timestamp.fromObject(object.endTime);
                            }
                            if (object.field != null)
                                message.field = String(object.field);
                            if (object.indexConfigDeltas) {
                                if (!Array.isArray(object.indexConfigDeltas))
                                    throw TypeError(".google.firestore.admin.v1.FieldOperationMetadata.indexConfigDeltas: array expected");
                                message.indexConfigDeltas = [];
                                for (var i = 0; i < object.indexConfigDeltas.length; ++i) {
                                    if (typeof object.indexConfigDeltas[i] !== "object")
                                        throw TypeError(".google.firestore.admin.v1.FieldOperationMetadata.indexConfigDeltas: object expected");
                                    message.indexConfigDeltas[i] = $root.google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta.fromObject(object.indexConfigDeltas[i]);
                                }
                            }
                            switch (object.state) {
                            default:
                                if (typeof object.state === "number") {
                                    message.state = object.state;
                                    break;
                                }
                                break;
                            case "OPERATION_STATE_UNSPECIFIED":
                            case 0:
                                message.state = 0;
                                break;
                            case "INITIALIZING":
                            case 1:
                                message.state = 1;
                                break;
                            case "PROCESSING":
                            case 2:
                                message.state = 2;
                                break;
                            case "CANCELLING":
                            case 3:
                                message.state = 3;
                                break;
                            case "FINALIZING":
                            case 4:
                                message.state = 4;
                                break;
                            case "SUCCESSFUL":
                            case 5:
                                message.state = 5;
                                break;
                            case "FAILED":
                            case 6:
                                message.state = 6;
                                break;
                            case "CANCELLED":
                            case 7:
                                message.state = 7;
                                break;
                            }
                            if (object.progressDocuments != null) {
                                if (typeof object.progressDocuments !== "object")
                                    throw TypeError(".google.firestore.admin.v1.FieldOperationMetadata.progressDocuments: object expected");
                                message.progressDocuments = $root.google.firestore.admin.v1.Progress.fromObject(object.progressDocuments);
                            }
                            if (object.progressBytes != null) {
                                if (typeof object.progressBytes !== "object")
                                    throw TypeError(".google.firestore.admin.v1.FieldOperationMetadata.progressBytes: object expected");
                                message.progressBytes = $root.google.firestore.admin.v1.Progress.fromObject(object.progressBytes);
                            }
                            if (object.ttlConfigDelta != null) {
                                if (typeof object.ttlConfigDelta !== "object")
                                    throw TypeError(".google.firestore.admin.v1.FieldOperationMetadata.ttlConfigDelta: object expected");
                                message.ttlConfigDelta = $root.google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta.fromObject(object.ttlConfigDelta);
                            }
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a FieldOperationMetadata message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @static
                         * @param {google.firestore.admin.v1.FieldOperationMetadata} message FieldOperationMetadata
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        FieldOperationMetadata.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.indexConfigDeltas = [];
                            if (options.defaults) {
                                object.startTime = null;
                                object.endTime = null;
                                object.field = "";
                                object.state = options.enums === String ? "OPERATION_STATE_UNSPECIFIED" : 0;
                                object.progressDocuments = null;
                                object.progressBytes = null;
                                object.ttlConfigDelta = null;
                            }
                            if (message.startTime != null && message.hasOwnProperty("startTime"))
                                object.startTime = $root.google.protobuf.Timestamp.toObject(message.startTime, options);
                            if (message.endTime != null && message.hasOwnProperty("endTime"))
                                object.endTime = $root.google.protobuf.Timestamp.toObject(message.endTime, options);
                            if (message.field != null && message.hasOwnProperty("field"))
                                object.field = message.field;
                            if (message.indexConfigDeltas && message.indexConfigDeltas.length) {
                                object.indexConfigDeltas = [];
                                for (var j = 0; j < message.indexConfigDeltas.length; ++j)
                                    object.indexConfigDeltas[j] = $root.google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta.toObject(message.indexConfigDeltas[j], options);
                            }
                            if (message.state != null && message.hasOwnProperty("state"))
                                object.state = options.enums === String ? $root.google.firestore.admin.v1.OperationState[message.state] === undefined ? message.state : $root.google.firestore.admin.v1.OperationState[message.state] : message.state;
                            if (message.progressDocuments != null && message.hasOwnProperty("progressDocuments"))
                                object.progressDocuments = $root.google.firestore.admin.v1.Progress.toObject(message.progressDocuments, options);
                            if (message.progressBytes != null && message.hasOwnProperty("progressBytes"))
                                object.progressBytes = $root.google.firestore.admin.v1.Progress.toObject(message.progressBytes, options);
                            if (message.ttlConfigDelta != null && message.hasOwnProperty("ttlConfigDelta"))
                                object.ttlConfigDelta = $root.google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta.toObject(message.ttlConfigDelta, options);
                            return object;
                        };
    
                        /**
                         * Converts this FieldOperationMetadata to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        FieldOperationMetadata.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for FieldOperationMetadata
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.FieldOperationMetadata
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        FieldOperationMetadata.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.FieldOperationMetadata";
                        };
    
                        FieldOperationMetadata.IndexConfigDelta = (function() {
    
                            /**
                             * Properties of an IndexConfigDelta.
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata
                             * @interface IIndexConfigDelta
                             * @property {google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta.ChangeType|null} [changeType] IndexConfigDelta changeType
                             * @property {google.firestore.admin.v1.IIndex|null} [index] IndexConfigDelta index
                             */
    
                            /**
                             * Constructs a new IndexConfigDelta.
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata
                             * @classdesc Represents an IndexConfigDelta.
                             * @implements IIndexConfigDelta
                             * @constructor
                             * @param {google.firestore.admin.v1.FieldOperationMetadata.IIndexConfigDelta=} [properties] Properties to set
                             */
                            function IndexConfigDelta(properties) {
                                if (properties)
                                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                        if (properties[keys[i]] != null)
                                            this[keys[i]] = properties[keys[i]];
                            }
    
                            /**
                             * IndexConfigDelta changeType.
                             * @member {google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta.ChangeType} changeType
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta
                             * @instance
                             */
                            IndexConfigDelta.prototype.changeType = 0;
    
                            /**
                             * IndexConfigDelta index.
                             * @member {google.firestore.admin.v1.IIndex|null|undefined} index
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta
                             * @instance
                             */
                            IndexConfigDelta.prototype.index = null;
    
                            /**
                             * Creates an IndexConfigDelta message from a plain object. Also converts values to their respective internal types.
                             * @function fromObject
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta
                             * @static
                             * @param {Object.<string,*>} object Plain object
                             * @returns {google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta} IndexConfigDelta
                             */
                            IndexConfigDelta.fromObject = function fromObject(object) {
                                if (object instanceof $root.google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta)
                                    return object;
                                var message = new $root.google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta();
                                switch (object.changeType) {
                                default:
                                    if (typeof object.changeType === "number") {
                                        message.changeType = object.changeType;
                                        break;
                                    }
                                    break;
                                case "CHANGE_TYPE_UNSPECIFIED":
                                case 0:
                                    message.changeType = 0;
                                    break;
                                case "ADD":
                                case 1:
                                    message.changeType = 1;
                                    break;
                                case "REMOVE":
                                case 2:
                                    message.changeType = 2;
                                    break;
                                }
                                if (object.index != null) {
                                    if (typeof object.index !== "object")
                                        throw TypeError(".google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta.index: object expected");
                                    message.index = $root.google.firestore.admin.v1.Index.fromObject(object.index);
                                }
                                return message;
                            };
    
                            /**
                             * Creates a plain object from an IndexConfigDelta message. Also converts values to other types if specified.
                             * @function toObject
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta
                             * @static
                             * @param {google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta} message IndexConfigDelta
                             * @param {$protobuf.IConversionOptions} [options] Conversion options
                             * @returns {Object.<string,*>} Plain object
                             */
                            IndexConfigDelta.toObject = function toObject(message, options) {
                                if (!options)
                                    options = {};
                                var object = {};
                                if (options.defaults) {
                                    object.changeType = options.enums === String ? "CHANGE_TYPE_UNSPECIFIED" : 0;
                                    object.index = null;
                                }
                                if (message.changeType != null && message.hasOwnProperty("changeType"))
                                    object.changeType = options.enums === String ? $root.google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta.ChangeType[message.changeType] === undefined ? message.changeType : $root.google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta.ChangeType[message.changeType] : message.changeType;
                                if (message.index != null && message.hasOwnProperty("index"))
                                    object.index = $root.google.firestore.admin.v1.Index.toObject(message.index, options);
                                return object;
                            };
    
                            /**
                             * Converts this IndexConfigDelta to JSON.
                             * @function toJSON
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta
                             * @instance
                             * @returns {Object.<string,*>} JSON object
                             */
                            IndexConfigDelta.prototype.toJSON = function toJSON() {
                                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                            };
    
                            /**
                             * Gets the default type url for IndexConfigDelta
                             * @function getTypeUrl
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta
                             * @static
                             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                             * @returns {string} The default type url
                             */
                            IndexConfigDelta.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                                if (typeUrlPrefix === undefined) {
                                    typeUrlPrefix = "type.googleapis.com";
                                }
                                return typeUrlPrefix + "/google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta";
                            };
    
                            /**
                             * ChangeType enum.
                             * @name google.firestore.admin.v1.FieldOperationMetadata.IndexConfigDelta.ChangeType
                             * @enum {string}
                             * @property {string} CHANGE_TYPE_UNSPECIFIED=CHANGE_TYPE_UNSPECIFIED CHANGE_TYPE_UNSPECIFIED value
                             * @property {string} ADD=ADD ADD value
                             * @property {string} REMOVE=REMOVE REMOVE value
                             */
                            IndexConfigDelta.ChangeType = (function() {
                                var valuesById = {}, values = Object.create(valuesById);
                                values[valuesById[0] = "CHANGE_TYPE_UNSPECIFIED"] = "CHANGE_TYPE_UNSPECIFIED";
                                values[valuesById[1] = "ADD"] = "ADD";
                                values[valuesById[2] = "REMOVE"] = "REMOVE";
                                return values;
                            })();
    
                            return IndexConfigDelta;
                        })();
    
                        FieldOperationMetadata.TtlConfigDelta = (function() {
    
                            /**
                             * Properties of a TtlConfigDelta.
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata
                             * @interface ITtlConfigDelta
                             * @property {google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta.ChangeType|null} [changeType] TtlConfigDelta changeType
                             */
    
                            /**
                             * Constructs a new TtlConfigDelta.
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata
                             * @classdesc Represents a TtlConfigDelta.
                             * @implements ITtlConfigDelta
                             * @constructor
                             * @param {google.firestore.admin.v1.FieldOperationMetadata.ITtlConfigDelta=} [properties] Properties to set
                             */
                            function TtlConfigDelta(properties) {
                                if (properties)
                                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                        if (properties[keys[i]] != null)
                                            this[keys[i]] = properties[keys[i]];
                            }
    
                            /**
                             * TtlConfigDelta changeType.
                             * @member {google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta.ChangeType} changeType
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta
                             * @instance
                             */
                            TtlConfigDelta.prototype.changeType = 0;
    
                            /**
                             * Creates a TtlConfigDelta message from a plain object. Also converts values to their respective internal types.
                             * @function fromObject
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta
                             * @static
                             * @param {Object.<string,*>} object Plain object
                             * @returns {google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta} TtlConfigDelta
                             */
                            TtlConfigDelta.fromObject = function fromObject(object) {
                                if (object instanceof $root.google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta)
                                    return object;
                                var message = new $root.google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta();
                                switch (object.changeType) {
                                default:
                                    if (typeof object.changeType === "number") {
                                        message.changeType = object.changeType;
                                        break;
                                    }
                                    break;
                                case "CHANGE_TYPE_UNSPECIFIED":
                                case 0:
                                    message.changeType = 0;
                                    break;
                                case "ADD":
                                case 1:
                                    message.changeType = 1;
                                    break;
                                case "REMOVE":
                                case 2:
                                    message.changeType = 2;
                                    break;
                                }
                                return message;
                            };
    
                            /**
                             * Creates a plain object from a TtlConfigDelta message. Also converts values to other types if specified.
                             * @function toObject
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta
                             * @static
                             * @param {google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta} message TtlConfigDelta
                             * @param {$protobuf.IConversionOptions} [options] Conversion options
                             * @returns {Object.<string,*>} Plain object
                             */
                            TtlConfigDelta.toObject = function toObject(message, options) {
                                if (!options)
                                    options = {};
                                var object = {};
                                if (options.defaults)
                                    object.changeType = options.enums === String ? "CHANGE_TYPE_UNSPECIFIED" : 0;
                                if (message.changeType != null && message.hasOwnProperty("changeType"))
                                    object.changeType = options.enums === String ? $root.google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta.ChangeType[message.changeType] === undefined ? message.changeType : $root.google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta.ChangeType[message.changeType] : message.changeType;
                                return object;
                            };
    
                            /**
                             * Converts this TtlConfigDelta to JSON.
                             * @function toJSON
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta
                             * @instance
                             * @returns {Object.<string,*>} JSON object
                             */
                            TtlConfigDelta.prototype.toJSON = function toJSON() {
                                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                            };
    
                            /**
                             * Gets the default type url for TtlConfigDelta
                             * @function getTypeUrl
                             * @memberof google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta
                             * @static
                             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                             * @returns {string} The default type url
                             */
                            TtlConfigDelta.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                                if (typeUrlPrefix === undefined) {
                                    typeUrlPrefix = "type.googleapis.com";
                                }
                                return typeUrlPrefix + "/google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta";
                            };
    
                            /**
                             * ChangeType enum.
                             * @name google.firestore.admin.v1.FieldOperationMetadata.TtlConfigDelta.ChangeType
                             * @enum {string}
                             * @property {string} CHANGE_TYPE_UNSPECIFIED=CHANGE_TYPE_UNSPECIFIED CHANGE_TYPE_UNSPECIFIED value
                             * @property {string} ADD=ADD ADD value
                             * @property {string} REMOVE=REMOVE REMOVE value
                             */
                            TtlConfigDelta.ChangeType = (function() {
                                var valuesById = {}, values = Object.create(valuesById);
                                values[valuesById[0] = "CHANGE_TYPE_UNSPECIFIED"] = "CHANGE_TYPE_UNSPECIFIED";
                                values[valuesById[1] = "ADD"] = "ADD";
                                values[valuesById[2] = "REMOVE"] = "REMOVE";
                                return values;
                            })();
    
                            return TtlConfigDelta;
                        })();
    
                        return FieldOperationMetadata;
                    })();
    
                    v1.ExportDocumentsMetadata = (function() {
    
                        /**
                         * Properties of an ExportDocumentsMetadata.
                         * @memberof google.firestore.admin.v1
                         * @interface IExportDocumentsMetadata
                         * @property {google.protobuf.ITimestamp|null} [startTime] ExportDocumentsMetadata startTime
                         * @property {google.protobuf.ITimestamp|null} [endTime] ExportDocumentsMetadata endTime
                         * @property {google.firestore.admin.v1.OperationState|null} [operationState] ExportDocumentsMetadata operationState
                         * @property {google.firestore.admin.v1.IProgress|null} [progressDocuments] ExportDocumentsMetadata progressDocuments
                         * @property {google.firestore.admin.v1.IProgress|null} [progressBytes] ExportDocumentsMetadata progressBytes
                         * @property {Array.<string>|null} [collectionIds] ExportDocumentsMetadata collectionIds
                         * @property {string|null} [outputUriPrefix] ExportDocumentsMetadata outputUriPrefix
                         */
    
                        /**
                         * Constructs a new ExportDocumentsMetadata.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an ExportDocumentsMetadata.
                         * @implements IExportDocumentsMetadata
                         * @constructor
                         * @param {google.firestore.admin.v1.IExportDocumentsMetadata=} [properties] Properties to set
                         */
                        function ExportDocumentsMetadata(properties) {
                            this.collectionIds = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ExportDocumentsMetadata startTime.
                         * @member {google.protobuf.ITimestamp|null|undefined} startTime
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @instance
                         */
                        ExportDocumentsMetadata.prototype.startTime = null;
    
                        /**
                         * ExportDocumentsMetadata endTime.
                         * @member {google.protobuf.ITimestamp|null|undefined} endTime
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @instance
                         */
                        ExportDocumentsMetadata.prototype.endTime = null;
    
                        /**
                         * ExportDocumentsMetadata operationState.
                         * @member {google.firestore.admin.v1.OperationState} operationState
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @instance
                         */
                        ExportDocumentsMetadata.prototype.operationState = 0;
    
                        /**
                         * ExportDocumentsMetadata progressDocuments.
                         * @member {google.firestore.admin.v1.IProgress|null|undefined} progressDocuments
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @instance
                         */
                        ExportDocumentsMetadata.prototype.progressDocuments = null;
    
                        /**
                         * ExportDocumentsMetadata progressBytes.
                         * @member {google.firestore.admin.v1.IProgress|null|undefined} progressBytes
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @instance
                         */
                        ExportDocumentsMetadata.prototype.progressBytes = null;
    
                        /**
                         * ExportDocumentsMetadata collectionIds.
                         * @member {Array.<string>} collectionIds
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @instance
                         */
                        ExportDocumentsMetadata.prototype.collectionIds = $util.emptyArray;
    
                        /**
                         * ExportDocumentsMetadata outputUriPrefix.
                         * @member {string} outputUriPrefix
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @instance
                         */
                        ExportDocumentsMetadata.prototype.outputUriPrefix = "";
    
                        /**
                         * Creates an ExportDocumentsMetadata message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ExportDocumentsMetadata} ExportDocumentsMetadata
                         */
                        ExportDocumentsMetadata.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ExportDocumentsMetadata)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ExportDocumentsMetadata();
                            if (object.startTime != null) {
                                if (typeof object.startTime !== "object")
                                    throw TypeError(".google.firestore.admin.v1.ExportDocumentsMetadata.startTime: object expected");
                                message.startTime = $root.google.protobuf.Timestamp.fromObject(object.startTime);
                            }
                            if (object.endTime != null) {
                                if (typeof object.endTime !== "object")
                                    throw TypeError(".google.firestore.admin.v1.ExportDocumentsMetadata.endTime: object expected");
                                message.endTime = $root.google.protobuf.Timestamp.fromObject(object.endTime);
                            }
                            switch (object.operationState) {
                            default:
                                if (typeof object.operationState === "number") {
                                    message.operationState = object.operationState;
                                    break;
                                }
                                break;
                            case "OPERATION_STATE_UNSPECIFIED":
                            case 0:
                                message.operationState = 0;
                                break;
                            case "INITIALIZING":
                            case 1:
                                message.operationState = 1;
                                break;
                            case "PROCESSING":
                            case 2:
                                message.operationState = 2;
                                break;
                            case "CANCELLING":
                            case 3:
                                message.operationState = 3;
                                break;
                            case "FINALIZING":
                            case 4:
                                message.operationState = 4;
                                break;
                            case "SUCCESSFUL":
                            case 5:
                                message.operationState = 5;
                                break;
                            case "FAILED":
                            case 6:
                                message.operationState = 6;
                                break;
                            case "CANCELLED":
                            case 7:
                                message.operationState = 7;
                                break;
                            }
                            if (object.progressDocuments != null) {
                                if (typeof object.progressDocuments !== "object")
                                    throw TypeError(".google.firestore.admin.v1.ExportDocumentsMetadata.progressDocuments: object expected");
                                message.progressDocuments = $root.google.firestore.admin.v1.Progress.fromObject(object.progressDocuments);
                            }
                            if (object.progressBytes != null) {
                                if (typeof object.progressBytes !== "object")
                                    throw TypeError(".google.firestore.admin.v1.ExportDocumentsMetadata.progressBytes: object expected");
                                message.progressBytes = $root.google.firestore.admin.v1.Progress.fromObject(object.progressBytes);
                            }
                            if (object.collectionIds) {
                                if (!Array.isArray(object.collectionIds))
                                    throw TypeError(".google.firestore.admin.v1.ExportDocumentsMetadata.collectionIds: array expected");
                                message.collectionIds = [];
                                for (var i = 0; i < object.collectionIds.length; ++i)
                                    message.collectionIds[i] = String(object.collectionIds[i]);
                            }
                            if (object.outputUriPrefix != null)
                                message.outputUriPrefix = String(object.outputUriPrefix);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an ExportDocumentsMetadata message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @static
                         * @param {google.firestore.admin.v1.ExportDocumentsMetadata} message ExportDocumentsMetadata
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ExportDocumentsMetadata.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.collectionIds = [];
                            if (options.defaults) {
                                object.startTime = null;
                                object.endTime = null;
                                object.operationState = options.enums === String ? "OPERATION_STATE_UNSPECIFIED" : 0;
                                object.progressDocuments = null;
                                object.progressBytes = null;
                                object.outputUriPrefix = "";
                            }
                            if (message.startTime != null && message.hasOwnProperty("startTime"))
                                object.startTime = $root.google.protobuf.Timestamp.toObject(message.startTime, options);
                            if (message.endTime != null && message.hasOwnProperty("endTime"))
                                object.endTime = $root.google.protobuf.Timestamp.toObject(message.endTime, options);
                            if (message.operationState != null && message.hasOwnProperty("operationState"))
                                object.operationState = options.enums === String ? $root.google.firestore.admin.v1.OperationState[message.operationState] === undefined ? message.operationState : $root.google.firestore.admin.v1.OperationState[message.operationState] : message.operationState;
                            if (message.progressDocuments != null && message.hasOwnProperty("progressDocuments"))
                                object.progressDocuments = $root.google.firestore.admin.v1.Progress.toObject(message.progressDocuments, options);
                            if (message.progressBytes != null && message.hasOwnProperty("progressBytes"))
                                object.progressBytes = $root.google.firestore.admin.v1.Progress.toObject(message.progressBytes, options);
                            if (message.collectionIds && message.collectionIds.length) {
                                object.collectionIds = [];
                                for (var j = 0; j < message.collectionIds.length; ++j)
                                    object.collectionIds[j] = message.collectionIds[j];
                            }
                            if (message.outputUriPrefix != null && message.hasOwnProperty("outputUriPrefix"))
                                object.outputUriPrefix = message.outputUriPrefix;
                            return object;
                        };
    
                        /**
                         * Converts this ExportDocumentsMetadata to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ExportDocumentsMetadata.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ExportDocumentsMetadata
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ExportDocumentsMetadata
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ExportDocumentsMetadata.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ExportDocumentsMetadata";
                        };
    
                        return ExportDocumentsMetadata;
                    })();
    
                    v1.ImportDocumentsMetadata = (function() {
    
                        /**
                         * Properties of an ImportDocumentsMetadata.
                         * @memberof google.firestore.admin.v1
                         * @interface IImportDocumentsMetadata
                         * @property {google.protobuf.ITimestamp|null} [startTime] ImportDocumentsMetadata startTime
                         * @property {google.protobuf.ITimestamp|null} [endTime] ImportDocumentsMetadata endTime
                         * @property {google.firestore.admin.v1.OperationState|null} [operationState] ImportDocumentsMetadata operationState
                         * @property {google.firestore.admin.v1.IProgress|null} [progressDocuments] ImportDocumentsMetadata progressDocuments
                         * @property {google.firestore.admin.v1.IProgress|null} [progressBytes] ImportDocumentsMetadata progressBytes
                         * @property {Array.<string>|null} [collectionIds] ImportDocumentsMetadata collectionIds
                         * @property {string|null} [inputUriPrefix] ImportDocumentsMetadata inputUriPrefix
                         */
    
                        /**
                         * Constructs a new ImportDocumentsMetadata.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an ImportDocumentsMetadata.
                         * @implements IImportDocumentsMetadata
                         * @constructor
                         * @param {google.firestore.admin.v1.IImportDocumentsMetadata=} [properties] Properties to set
                         */
                        function ImportDocumentsMetadata(properties) {
                            this.collectionIds = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ImportDocumentsMetadata startTime.
                         * @member {google.protobuf.ITimestamp|null|undefined} startTime
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @instance
                         */
                        ImportDocumentsMetadata.prototype.startTime = null;
    
                        /**
                         * ImportDocumentsMetadata endTime.
                         * @member {google.protobuf.ITimestamp|null|undefined} endTime
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @instance
                         */
                        ImportDocumentsMetadata.prototype.endTime = null;
    
                        /**
                         * ImportDocumentsMetadata operationState.
                         * @member {google.firestore.admin.v1.OperationState} operationState
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @instance
                         */
                        ImportDocumentsMetadata.prototype.operationState = 0;
    
                        /**
                         * ImportDocumentsMetadata progressDocuments.
                         * @member {google.firestore.admin.v1.IProgress|null|undefined} progressDocuments
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @instance
                         */
                        ImportDocumentsMetadata.prototype.progressDocuments = null;
    
                        /**
                         * ImportDocumentsMetadata progressBytes.
                         * @member {google.firestore.admin.v1.IProgress|null|undefined} progressBytes
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @instance
                         */
                        ImportDocumentsMetadata.prototype.progressBytes = null;
    
                        /**
                         * ImportDocumentsMetadata collectionIds.
                         * @member {Array.<string>} collectionIds
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @instance
                         */
                        ImportDocumentsMetadata.prototype.collectionIds = $util.emptyArray;
    
                        /**
                         * ImportDocumentsMetadata inputUriPrefix.
                         * @member {string} inputUriPrefix
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @instance
                         */
                        ImportDocumentsMetadata.prototype.inputUriPrefix = "";
    
                        /**
                         * Creates an ImportDocumentsMetadata message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ImportDocumentsMetadata} ImportDocumentsMetadata
                         */
                        ImportDocumentsMetadata.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ImportDocumentsMetadata)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ImportDocumentsMetadata();
                            if (object.startTime != null) {
                                if (typeof object.startTime !== "object")
                                    throw TypeError(".google.firestore.admin.v1.ImportDocumentsMetadata.startTime: object expected");
                                message.startTime = $root.google.protobuf.Timestamp.fromObject(object.startTime);
                            }
                            if (object.endTime != null) {
                                if (typeof object.endTime !== "object")
                                    throw TypeError(".google.firestore.admin.v1.ImportDocumentsMetadata.endTime: object expected");
                                message.endTime = $root.google.protobuf.Timestamp.fromObject(object.endTime);
                            }
                            switch (object.operationState) {
                            default:
                                if (typeof object.operationState === "number") {
                                    message.operationState = object.operationState;
                                    break;
                                }
                                break;
                            case "OPERATION_STATE_UNSPECIFIED":
                            case 0:
                                message.operationState = 0;
                                break;
                            case "INITIALIZING":
                            case 1:
                                message.operationState = 1;
                                break;
                            case "PROCESSING":
                            case 2:
                                message.operationState = 2;
                                break;
                            case "CANCELLING":
                            case 3:
                                message.operationState = 3;
                                break;
                            case "FINALIZING":
                            case 4:
                                message.operationState = 4;
                                break;
                            case "SUCCESSFUL":
                            case 5:
                                message.operationState = 5;
                                break;
                            case "FAILED":
                            case 6:
                                message.operationState = 6;
                                break;
                            case "CANCELLED":
                            case 7:
                                message.operationState = 7;
                                break;
                            }
                            if (object.progressDocuments != null) {
                                if (typeof object.progressDocuments !== "object")
                                    throw TypeError(".google.firestore.admin.v1.ImportDocumentsMetadata.progressDocuments: object expected");
                                message.progressDocuments = $root.google.firestore.admin.v1.Progress.fromObject(object.progressDocuments);
                            }
                            if (object.progressBytes != null) {
                                if (typeof object.progressBytes !== "object")
                                    throw TypeError(".google.firestore.admin.v1.ImportDocumentsMetadata.progressBytes: object expected");
                                message.progressBytes = $root.google.firestore.admin.v1.Progress.fromObject(object.progressBytes);
                            }
                            if (object.collectionIds) {
                                if (!Array.isArray(object.collectionIds))
                                    throw TypeError(".google.firestore.admin.v1.ImportDocumentsMetadata.collectionIds: array expected");
                                message.collectionIds = [];
                                for (var i = 0; i < object.collectionIds.length; ++i)
                                    message.collectionIds[i] = String(object.collectionIds[i]);
                            }
                            if (object.inputUriPrefix != null)
                                message.inputUriPrefix = String(object.inputUriPrefix);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an ImportDocumentsMetadata message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @static
                         * @param {google.firestore.admin.v1.ImportDocumentsMetadata} message ImportDocumentsMetadata
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ImportDocumentsMetadata.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.collectionIds = [];
                            if (options.defaults) {
                                object.startTime = null;
                                object.endTime = null;
                                object.operationState = options.enums === String ? "OPERATION_STATE_UNSPECIFIED" : 0;
                                object.progressDocuments = null;
                                object.progressBytes = null;
                                object.inputUriPrefix = "";
                            }
                            if (message.startTime != null && message.hasOwnProperty("startTime"))
                                object.startTime = $root.google.protobuf.Timestamp.toObject(message.startTime, options);
                            if (message.endTime != null && message.hasOwnProperty("endTime"))
                                object.endTime = $root.google.protobuf.Timestamp.toObject(message.endTime, options);
                            if (message.operationState != null && message.hasOwnProperty("operationState"))
                                object.operationState = options.enums === String ? $root.google.firestore.admin.v1.OperationState[message.operationState] === undefined ? message.operationState : $root.google.firestore.admin.v1.OperationState[message.operationState] : message.operationState;
                            if (message.progressDocuments != null && message.hasOwnProperty("progressDocuments"))
                                object.progressDocuments = $root.google.firestore.admin.v1.Progress.toObject(message.progressDocuments, options);
                            if (message.progressBytes != null && message.hasOwnProperty("progressBytes"))
                                object.progressBytes = $root.google.firestore.admin.v1.Progress.toObject(message.progressBytes, options);
                            if (message.collectionIds && message.collectionIds.length) {
                                object.collectionIds = [];
                                for (var j = 0; j < message.collectionIds.length; ++j)
                                    object.collectionIds[j] = message.collectionIds[j];
                            }
                            if (message.inputUriPrefix != null && message.hasOwnProperty("inputUriPrefix"))
                                object.inputUriPrefix = message.inputUriPrefix;
                            return object;
                        };
    
                        /**
                         * Converts this ImportDocumentsMetadata to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ImportDocumentsMetadata.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ImportDocumentsMetadata
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ImportDocumentsMetadata
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ImportDocumentsMetadata.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ImportDocumentsMetadata";
                        };
    
                        return ImportDocumentsMetadata;
                    })();
    
                    v1.ExportDocumentsResponse = (function() {
    
                        /**
                         * Properties of an ExportDocumentsResponse.
                         * @memberof google.firestore.admin.v1
                         * @interface IExportDocumentsResponse
                         * @property {string|null} [outputUriPrefix] ExportDocumentsResponse outputUriPrefix
                         */
    
                        /**
                         * Constructs a new ExportDocumentsResponse.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents an ExportDocumentsResponse.
                         * @implements IExportDocumentsResponse
                         * @constructor
                         * @param {google.firestore.admin.v1.IExportDocumentsResponse=} [properties] Properties to set
                         */
                        function ExportDocumentsResponse(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * ExportDocumentsResponse outputUriPrefix.
                         * @member {string} outputUriPrefix
                         * @memberof google.firestore.admin.v1.ExportDocumentsResponse
                         * @instance
                         */
                        ExportDocumentsResponse.prototype.outputUriPrefix = "";
    
                        /**
                         * Creates an ExportDocumentsResponse message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.ExportDocumentsResponse
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.ExportDocumentsResponse} ExportDocumentsResponse
                         */
                        ExportDocumentsResponse.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.ExportDocumentsResponse)
                                return object;
                            var message = new $root.google.firestore.admin.v1.ExportDocumentsResponse();
                            if (object.outputUriPrefix != null)
                                message.outputUriPrefix = String(object.outputUriPrefix);
                            return message;
                        };
    
                        /**
                         * Creates a plain object from an ExportDocumentsResponse message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.ExportDocumentsResponse
                         * @static
                         * @param {google.firestore.admin.v1.ExportDocumentsResponse} message ExportDocumentsResponse
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ExportDocumentsResponse.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.outputUriPrefix = "";
                            if (message.outputUriPrefix != null && message.hasOwnProperty("outputUriPrefix"))
                                object.outputUriPrefix = message.outputUriPrefix;
                            return object;
                        };
    
                        /**
                         * Converts this ExportDocumentsResponse to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.ExportDocumentsResponse
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ExportDocumentsResponse.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for ExportDocumentsResponse
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.ExportDocumentsResponse
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ExportDocumentsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.ExportDocumentsResponse";
                        };
    
                        return ExportDocumentsResponse;
                    })();
    
                    /**
                     * OperationState enum.
                     * @name google.firestore.admin.v1.OperationState
                     * @enum {string}
                     * @property {string} OPERATION_STATE_UNSPECIFIED=OPERATION_STATE_UNSPECIFIED OPERATION_STATE_UNSPECIFIED value
                     * @property {string} INITIALIZING=INITIALIZING INITIALIZING value
                     * @property {string} PROCESSING=PROCESSING PROCESSING value
                     * @property {string} CANCELLING=CANCELLING CANCELLING value
                     * @property {string} FINALIZING=FINALIZING FINALIZING value
                     * @property {string} SUCCESSFUL=SUCCESSFUL SUCCESSFUL value
                     * @property {string} FAILED=FAILED FAILED value
                     * @property {string} CANCELLED=CANCELLED CANCELLED value
                     */
                    v1.OperationState = (function() {
                        var valuesById = {}, values = Object.create(valuesById);
                        values[valuesById[0] = "OPERATION_STATE_UNSPECIFIED"] = "OPERATION_STATE_UNSPECIFIED";
                        values[valuesById[1] = "INITIALIZING"] = "INITIALIZING";
                        values[valuesById[2] = "PROCESSING"] = "PROCESSING";
                        values[valuesById[3] = "CANCELLING"] = "CANCELLING";
                        values[valuesById[4] = "FINALIZING"] = "FINALIZING";
                        values[valuesById[5] = "SUCCESSFUL"] = "SUCCESSFUL";
                        values[valuesById[6] = "FAILED"] = "FAILED";
                        values[valuesById[7] = "CANCELLED"] = "CANCELLED";
                        return values;
                    })();
    
                    v1.Progress = (function() {
    
                        /**
                         * Properties of a Progress.
                         * @memberof google.firestore.admin.v1
                         * @interface IProgress
                         * @property {number|string|null} [estimatedWork] Progress estimatedWork
                         * @property {number|string|null} [completedWork] Progress completedWork
                         */
    
                        /**
                         * Constructs a new Progress.
                         * @memberof google.firestore.admin.v1
                         * @classdesc Represents a Progress.
                         * @implements IProgress
                         * @constructor
                         * @param {google.firestore.admin.v1.IProgress=} [properties] Properties to set
                         */
                        function Progress(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }
    
                        /**
                         * Progress estimatedWork.
                         * @member {number|string} estimatedWork
                         * @memberof google.firestore.admin.v1.Progress
                         * @instance
                         */
                        Progress.prototype.estimatedWork = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
    
                        /**
                         * Progress completedWork.
                         * @member {number|string} completedWork
                         * @memberof google.firestore.admin.v1.Progress
                         * @instance
                         */
                        Progress.prototype.completedWork = $util.Long ? $util.Long.fromBits(0,0,false) : 0;
    
                        /**
                         * Creates a Progress message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof google.firestore.admin.v1.Progress
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {google.firestore.admin.v1.Progress} Progress
                         */
                        Progress.fromObject = function fromObject(object) {
                            if (object instanceof $root.google.firestore.admin.v1.Progress)
                                return object;
                            var message = new $root.google.firestore.admin.v1.Progress();
                            if (object.estimatedWork != null)
                                if ($util.Long)
                                    (message.estimatedWork = $util.Long.fromValue(object.estimatedWork)).unsigned = false;
                                else if (typeof object.estimatedWork === "string")
                                    message.estimatedWork = parseInt(object.estimatedWork, 10);
                                else if (typeof object.estimatedWork === "number")
                                    message.estimatedWork = object.estimatedWork;
                                else if (typeof object.estimatedWork === "object")
                                    message.estimatedWork = new $util.LongBits(object.estimatedWork.low >>> 0, object.estimatedWork.high >>> 0).toNumber();
                            if (object.completedWork != null)
                                if ($util.Long)
                                    (message.completedWork = $util.Long.fromValue(object.completedWork)).unsigned = false;
                                else if (typeof object.completedWork === "string")
                                    message.completedWork = parseInt(object.completedWork, 10);
                                else if (typeof object.completedWork === "number")
                                    message.completedWork = object.completedWork;
                                else if (typeof object.completedWork === "object")
                                    message.completedWork = new $util.LongBits(object.completedWork.low >>> 0, object.completedWork.high >>> 0).toNumber();
                            return message;
                        };
    
                        /**
                         * Creates a plain object from a Progress message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof google.firestore.admin.v1.Progress
                         * @static
                         * @param {google.firestore.admin.v1.Progress} message Progress
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Progress.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.estimatedWork = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.estimatedWork = options.longs === String ? "0" : 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.completedWork = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.completedWork = options.longs === String ? "0" : 0;
                            }
                            if (message.estimatedWork != null && message.hasOwnProperty("estimatedWork"))
                                if (typeof message.estimatedWork === "number")
                                    object.estimatedWork = options.longs === String ? String(message.estimatedWork) : message.estimatedWork;
                                else
                                    object.estimatedWork = options.longs === String ? $util.Long.prototype.toString.call(message.estimatedWork) : options.longs === Number ? new $util.LongBits(message.estimatedWork.low >>> 0, message.estimatedWork.high >>> 0).toNumber() : message.estimatedWork;
                            if (message.completedWork != null && message.hasOwnProperty("completedWork"))
                                if (typeof message.completedWork === "number")
                                    object.completedWork = options.longs === String ? String(message.completedWork) : message.completedWork;
                                else
                                    object.completedWork = options.longs === String ? $util.Long.prototype.toString.call(message.completedWork) : options.longs === Number ? new $util.LongBits(message.completedWork.low >>> 0, message.completedWork.high >>> 0).toNumber() : message.completedWork;
                            return object;
                        };
    
                        /**
                         * Converts this Progress to JSON.
                         * @function toJSON
                         * @memberof google.firestore.admin.v1.Progress
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Progress.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };
    
                        /**
                         * Gets the default type url for Progress
                         * @function getTypeUrl
                         * @memberof google.firestore.admin.v1.Progress
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        Progress.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/google.firestore.admin.v1.Progress";
                        };
    
                        return Progress;
                    })();
    
                    return v1;
                })();
    
                return admin;
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
    
                /**
                 * Gets the default type url for Http
                 * @function getTypeUrl
                 * @memberof google.api.Http
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Http.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.Http";
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
                 * @member {string|null|undefined} get
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.get = null;
    
                /**
                 * HttpRule put.
                 * @member {string|null|undefined} put
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.put = null;
    
                /**
                 * HttpRule post.
                 * @member {string|null|undefined} post
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.post = null;
    
                /**
                 * HttpRule delete.
                 * @member {string|null|undefined} delete
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype["delete"] = null;
    
                /**
                 * HttpRule patch.
                 * @member {string|null|undefined} patch
                 * @memberof google.api.HttpRule
                 * @instance
                 */
                HttpRule.prototype.patch = null;
    
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
    
                /**
                 * Gets the default type url for HttpRule
                 * @function getTypeUrl
                 * @memberof google.api.HttpRule
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                HttpRule.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.HttpRule";
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
    
                /**
                 * Gets the default type url for CustomHttpPattern
                 * @function getTypeUrl
                 * @memberof google.api.CustomHttpPattern
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                CustomHttpPattern.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.CustomHttpPattern";
                };
    
                return CustomHttpPattern;
            })();
    
            api.CommonLanguageSettings = (function() {
    
                /**
                 * Properties of a CommonLanguageSettings.
                 * @memberof google.api
                 * @interface ICommonLanguageSettings
                 * @property {string|null} [referenceDocsUri] CommonLanguageSettings referenceDocsUri
                 * @property {Array.<google.api.ClientLibraryDestination>|null} [destinations] CommonLanguageSettings destinations
                 */
    
                /**
                 * Constructs a new CommonLanguageSettings.
                 * @memberof google.api
                 * @classdesc Represents a CommonLanguageSettings.
                 * @implements ICommonLanguageSettings
                 * @constructor
                 * @param {google.api.ICommonLanguageSettings=} [properties] Properties to set
                 */
                function CommonLanguageSettings(properties) {
                    this.destinations = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * CommonLanguageSettings referenceDocsUri.
                 * @member {string} referenceDocsUri
                 * @memberof google.api.CommonLanguageSettings
                 * @instance
                 */
                CommonLanguageSettings.prototype.referenceDocsUri = "";
    
                /**
                 * CommonLanguageSettings destinations.
                 * @member {Array.<google.api.ClientLibraryDestination>} destinations
                 * @memberof google.api.CommonLanguageSettings
                 * @instance
                 */
                CommonLanguageSettings.prototype.destinations = $util.emptyArray;
    
                /**
                 * Creates a CommonLanguageSettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.CommonLanguageSettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.CommonLanguageSettings} CommonLanguageSettings
                 */
                CommonLanguageSettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.CommonLanguageSettings)
                        return object;
                    var message = new $root.google.api.CommonLanguageSettings();
                    if (object.referenceDocsUri != null)
                        message.referenceDocsUri = String(object.referenceDocsUri);
                    if (object.destinations) {
                        if (!Array.isArray(object.destinations))
                            throw TypeError(".google.api.CommonLanguageSettings.destinations: array expected");
                        message.destinations = [];
                        for (var i = 0; i < object.destinations.length; ++i)
                            switch (object.destinations[i]) {
                            default:
                                if (typeof object.destinations[i] === "number") {
                                    message.destinations[i] = object.destinations[i];
                                    break;
                                }
                            case "CLIENT_LIBRARY_DESTINATION_UNSPECIFIED":
                            case 0:
                                message.destinations[i] = 0;
                                break;
                            case "GITHUB":
                            case 10:
                                message.destinations[i] = 10;
                                break;
                            case "PACKAGE_MANAGER":
                            case 20:
                                message.destinations[i] = 20;
                                break;
                            }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a CommonLanguageSettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.CommonLanguageSettings
                 * @static
                 * @param {google.api.CommonLanguageSettings} message CommonLanguageSettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                CommonLanguageSettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults)
                        object.destinations = [];
                    if (options.defaults)
                        object.referenceDocsUri = "";
                    if (message.referenceDocsUri != null && message.hasOwnProperty("referenceDocsUri"))
                        object.referenceDocsUri = message.referenceDocsUri;
                    if (message.destinations && message.destinations.length) {
                        object.destinations = [];
                        for (var j = 0; j < message.destinations.length; ++j)
                            object.destinations[j] = options.enums === String ? $root.google.api.ClientLibraryDestination[message.destinations[j]] === undefined ? message.destinations[j] : $root.google.api.ClientLibraryDestination[message.destinations[j]] : message.destinations[j];
                    }
                    return object;
                };
    
                /**
                 * Converts this CommonLanguageSettings to JSON.
                 * @function toJSON
                 * @memberof google.api.CommonLanguageSettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                CommonLanguageSettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for CommonLanguageSettings
                 * @function getTypeUrl
                 * @memberof google.api.CommonLanguageSettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                CommonLanguageSettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.CommonLanguageSettings";
                };
    
                return CommonLanguageSettings;
            })();
    
            api.ClientLibrarySettings = (function() {
    
                /**
                 * Properties of a ClientLibrarySettings.
                 * @memberof google.api
                 * @interface IClientLibrarySettings
                 * @property {string|null} [version] ClientLibrarySettings version
                 * @property {google.api.LaunchStage|null} [launchStage] ClientLibrarySettings launchStage
                 * @property {boolean|null} [restNumericEnums] ClientLibrarySettings restNumericEnums
                 * @property {google.api.IJavaSettings|null} [javaSettings] ClientLibrarySettings javaSettings
                 * @property {google.api.ICppSettings|null} [cppSettings] ClientLibrarySettings cppSettings
                 * @property {google.api.IPhpSettings|null} [phpSettings] ClientLibrarySettings phpSettings
                 * @property {google.api.IPythonSettings|null} [pythonSettings] ClientLibrarySettings pythonSettings
                 * @property {google.api.INodeSettings|null} [nodeSettings] ClientLibrarySettings nodeSettings
                 * @property {google.api.IDotnetSettings|null} [dotnetSettings] ClientLibrarySettings dotnetSettings
                 * @property {google.api.IRubySettings|null} [rubySettings] ClientLibrarySettings rubySettings
                 * @property {google.api.IGoSettings|null} [goSettings] ClientLibrarySettings goSettings
                 */
    
                /**
                 * Constructs a new ClientLibrarySettings.
                 * @memberof google.api
                 * @classdesc Represents a ClientLibrarySettings.
                 * @implements IClientLibrarySettings
                 * @constructor
                 * @param {google.api.IClientLibrarySettings=} [properties] Properties to set
                 */
                function ClientLibrarySettings(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * ClientLibrarySettings version.
                 * @member {string} version
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.version = "";
    
                /**
                 * ClientLibrarySettings launchStage.
                 * @member {google.api.LaunchStage} launchStage
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.launchStage = 0;
    
                /**
                 * ClientLibrarySettings restNumericEnums.
                 * @member {boolean} restNumericEnums
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.restNumericEnums = false;
    
                /**
                 * ClientLibrarySettings javaSettings.
                 * @member {google.api.IJavaSettings|null|undefined} javaSettings
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.javaSettings = null;
    
                /**
                 * ClientLibrarySettings cppSettings.
                 * @member {google.api.ICppSettings|null|undefined} cppSettings
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.cppSettings = null;
    
                /**
                 * ClientLibrarySettings phpSettings.
                 * @member {google.api.IPhpSettings|null|undefined} phpSettings
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.phpSettings = null;
    
                /**
                 * ClientLibrarySettings pythonSettings.
                 * @member {google.api.IPythonSettings|null|undefined} pythonSettings
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.pythonSettings = null;
    
                /**
                 * ClientLibrarySettings nodeSettings.
                 * @member {google.api.INodeSettings|null|undefined} nodeSettings
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.nodeSettings = null;
    
                /**
                 * ClientLibrarySettings dotnetSettings.
                 * @member {google.api.IDotnetSettings|null|undefined} dotnetSettings
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.dotnetSettings = null;
    
                /**
                 * ClientLibrarySettings rubySettings.
                 * @member {google.api.IRubySettings|null|undefined} rubySettings
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.rubySettings = null;
    
                /**
                 * ClientLibrarySettings goSettings.
                 * @member {google.api.IGoSettings|null|undefined} goSettings
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 */
                ClientLibrarySettings.prototype.goSettings = null;
    
                /**
                 * Creates a ClientLibrarySettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.ClientLibrarySettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.ClientLibrarySettings} ClientLibrarySettings
                 */
                ClientLibrarySettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.ClientLibrarySettings)
                        return object;
                    var message = new $root.google.api.ClientLibrarySettings();
                    if (object.version != null)
                        message.version = String(object.version);
                    switch (object.launchStage) {
                    default:
                        if (typeof object.launchStage === "number") {
                            message.launchStage = object.launchStage;
                            break;
                        }
                        break;
                    case "LAUNCH_STAGE_UNSPECIFIED":
                    case 0:
                        message.launchStage = 0;
                        break;
                    case "UNIMPLEMENTED":
                    case 6:
                        message.launchStage = 6;
                        break;
                    case "PRELAUNCH":
                    case 7:
                        message.launchStage = 7;
                        break;
                    case "EARLY_ACCESS":
                    case 1:
                        message.launchStage = 1;
                        break;
                    case "ALPHA":
                    case 2:
                        message.launchStage = 2;
                        break;
                    case "BETA":
                    case 3:
                        message.launchStage = 3;
                        break;
                    case "GA":
                    case 4:
                        message.launchStage = 4;
                        break;
                    case "DEPRECATED":
                    case 5:
                        message.launchStage = 5;
                        break;
                    }
                    if (object.restNumericEnums != null)
                        message.restNumericEnums = Boolean(object.restNumericEnums);
                    if (object.javaSettings != null) {
                        if (typeof object.javaSettings !== "object")
                            throw TypeError(".google.api.ClientLibrarySettings.javaSettings: object expected");
                        message.javaSettings = $root.google.api.JavaSettings.fromObject(object.javaSettings);
                    }
                    if (object.cppSettings != null) {
                        if (typeof object.cppSettings !== "object")
                            throw TypeError(".google.api.ClientLibrarySettings.cppSettings: object expected");
                        message.cppSettings = $root.google.api.CppSettings.fromObject(object.cppSettings);
                    }
                    if (object.phpSettings != null) {
                        if (typeof object.phpSettings !== "object")
                            throw TypeError(".google.api.ClientLibrarySettings.phpSettings: object expected");
                        message.phpSettings = $root.google.api.PhpSettings.fromObject(object.phpSettings);
                    }
                    if (object.pythonSettings != null) {
                        if (typeof object.pythonSettings !== "object")
                            throw TypeError(".google.api.ClientLibrarySettings.pythonSettings: object expected");
                        message.pythonSettings = $root.google.api.PythonSettings.fromObject(object.pythonSettings);
                    }
                    if (object.nodeSettings != null) {
                        if (typeof object.nodeSettings !== "object")
                            throw TypeError(".google.api.ClientLibrarySettings.nodeSettings: object expected");
                        message.nodeSettings = $root.google.api.NodeSettings.fromObject(object.nodeSettings);
                    }
                    if (object.dotnetSettings != null) {
                        if (typeof object.dotnetSettings !== "object")
                            throw TypeError(".google.api.ClientLibrarySettings.dotnetSettings: object expected");
                        message.dotnetSettings = $root.google.api.DotnetSettings.fromObject(object.dotnetSettings);
                    }
                    if (object.rubySettings != null) {
                        if (typeof object.rubySettings !== "object")
                            throw TypeError(".google.api.ClientLibrarySettings.rubySettings: object expected");
                        message.rubySettings = $root.google.api.RubySettings.fromObject(object.rubySettings);
                    }
                    if (object.goSettings != null) {
                        if (typeof object.goSettings !== "object")
                            throw TypeError(".google.api.ClientLibrarySettings.goSettings: object expected");
                        message.goSettings = $root.google.api.GoSettings.fromObject(object.goSettings);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a ClientLibrarySettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.ClientLibrarySettings
                 * @static
                 * @param {google.api.ClientLibrarySettings} message ClientLibrarySettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ClientLibrarySettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.version = "";
                        object.launchStage = options.enums === String ? "LAUNCH_STAGE_UNSPECIFIED" : 0;
                        object.restNumericEnums = false;
                        object.javaSettings = null;
                        object.cppSettings = null;
                        object.phpSettings = null;
                        object.pythonSettings = null;
                        object.nodeSettings = null;
                        object.dotnetSettings = null;
                        object.rubySettings = null;
                        object.goSettings = null;
                    }
                    if (message.version != null && message.hasOwnProperty("version"))
                        object.version = message.version;
                    if (message.launchStage != null && message.hasOwnProperty("launchStage"))
                        object.launchStage = options.enums === String ? $root.google.api.LaunchStage[message.launchStage] === undefined ? message.launchStage : $root.google.api.LaunchStage[message.launchStage] : message.launchStage;
                    if (message.restNumericEnums != null && message.hasOwnProperty("restNumericEnums"))
                        object.restNumericEnums = message.restNumericEnums;
                    if (message.javaSettings != null && message.hasOwnProperty("javaSettings"))
                        object.javaSettings = $root.google.api.JavaSettings.toObject(message.javaSettings, options);
                    if (message.cppSettings != null && message.hasOwnProperty("cppSettings"))
                        object.cppSettings = $root.google.api.CppSettings.toObject(message.cppSettings, options);
                    if (message.phpSettings != null && message.hasOwnProperty("phpSettings"))
                        object.phpSettings = $root.google.api.PhpSettings.toObject(message.phpSettings, options);
                    if (message.pythonSettings != null && message.hasOwnProperty("pythonSettings"))
                        object.pythonSettings = $root.google.api.PythonSettings.toObject(message.pythonSettings, options);
                    if (message.nodeSettings != null && message.hasOwnProperty("nodeSettings"))
                        object.nodeSettings = $root.google.api.NodeSettings.toObject(message.nodeSettings, options);
                    if (message.dotnetSettings != null && message.hasOwnProperty("dotnetSettings"))
                        object.dotnetSettings = $root.google.api.DotnetSettings.toObject(message.dotnetSettings, options);
                    if (message.rubySettings != null && message.hasOwnProperty("rubySettings"))
                        object.rubySettings = $root.google.api.RubySettings.toObject(message.rubySettings, options);
                    if (message.goSettings != null && message.hasOwnProperty("goSettings"))
                        object.goSettings = $root.google.api.GoSettings.toObject(message.goSettings, options);
                    return object;
                };
    
                /**
                 * Converts this ClientLibrarySettings to JSON.
                 * @function toJSON
                 * @memberof google.api.ClientLibrarySettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ClientLibrarySettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for ClientLibrarySettings
                 * @function getTypeUrl
                 * @memberof google.api.ClientLibrarySettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                ClientLibrarySettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.ClientLibrarySettings";
                };
    
                return ClientLibrarySettings;
            })();
    
            api.Publishing = (function() {
    
                /**
                 * Properties of a Publishing.
                 * @memberof google.api
                 * @interface IPublishing
                 * @property {Array.<google.api.IMethodSettings>|null} [methodSettings] Publishing methodSettings
                 * @property {string|null} [newIssueUri] Publishing newIssueUri
                 * @property {string|null} [documentationUri] Publishing documentationUri
                 * @property {string|null} [apiShortName] Publishing apiShortName
                 * @property {string|null} [githubLabel] Publishing githubLabel
                 * @property {Array.<string>|null} [codeownerGithubTeams] Publishing codeownerGithubTeams
                 * @property {string|null} [docTagPrefix] Publishing docTagPrefix
                 * @property {google.api.ClientLibraryOrganization|null} [organization] Publishing organization
                 * @property {Array.<google.api.IClientLibrarySettings>|null} [librarySettings] Publishing librarySettings
                 */
    
                /**
                 * Constructs a new Publishing.
                 * @memberof google.api
                 * @classdesc Represents a Publishing.
                 * @implements IPublishing
                 * @constructor
                 * @param {google.api.IPublishing=} [properties] Properties to set
                 */
                function Publishing(properties) {
                    this.methodSettings = [];
                    this.codeownerGithubTeams = [];
                    this.librarySettings = [];
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * Publishing methodSettings.
                 * @member {Array.<google.api.IMethodSettings>} methodSettings
                 * @memberof google.api.Publishing
                 * @instance
                 */
                Publishing.prototype.methodSettings = $util.emptyArray;
    
                /**
                 * Publishing newIssueUri.
                 * @member {string} newIssueUri
                 * @memberof google.api.Publishing
                 * @instance
                 */
                Publishing.prototype.newIssueUri = "";
    
                /**
                 * Publishing documentationUri.
                 * @member {string} documentationUri
                 * @memberof google.api.Publishing
                 * @instance
                 */
                Publishing.prototype.documentationUri = "";
    
                /**
                 * Publishing apiShortName.
                 * @member {string} apiShortName
                 * @memberof google.api.Publishing
                 * @instance
                 */
                Publishing.prototype.apiShortName = "";
    
                /**
                 * Publishing githubLabel.
                 * @member {string} githubLabel
                 * @memberof google.api.Publishing
                 * @instance
                 */
                Publishing.prototype.githubLabel = "";
    
                /**
                 * Publishing codeownerGithubTeams.
                 * @member {Array.<string>} codeownerGithubTeams
                 * @memberof google.api.Publishing
                 * @instance
                 */
                Publishing.prototype.codeownerGithubTeams = $util.emptyArray;
    
                /**
                 * Publishing docTagPrefix.
                 * @member {string} docTagPrefix
                 * @memberof google.api.Publishing
                 * @instance
                 */
                Publishing.prototype.docTagPrefix = "";
    
                /**
                 * Publishing organization.
                 * @member {google.api.ClientLibraryOrganization} organization
                 * @memberof google.api.Publishing
                 * @instance
                 */
                Publishing.prototype.organization = 0;
    
                /**
                 * Publishing librarySettings.
                 * @member {Array.<google.api.IClientLibrarySettings>} librarySettings
                 * @memberof google.api.Publishing
                 * @instance
                 */
                Publishing.prototype.librarySettings = $util.emptyArray;
    
                /**
                 * Creates a Publishing message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.Publishing
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.Publishing} Publishing
                 */
                Publishing.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.Publishing)
                        return object;
                    var message = new $root.google.api.Publishing();
                    if (object.methodSettings) {
                        if (!Array.isArray(object.methodSettings))
                            throw TypeError(".google.api.Publishing.methodSettings: array expected");
                        message.methodSettings = [];
                        for (var i = 0; i < object.methodSettings.length; ++i) {
                            if (typeof object.methodSettings[i] !== "object")
                                throw TypeError(".google.api.Publishing.methodSettings: object expected");
                            message.methodSettings[i] = $root.google.api.MethodSettings.fromObject(object.methodSettings[i]);
                        }
                    }
                    if (object.newIssueUri != null)
                        message.newIssueUri = String(object.newIssueUri);
                    if (object.documentationUri != null)
                        message.documentationUri = String(object.documentationUri);
                    if (object.apiShortName != null)
                        message.apiShortName = String(object.apiShortName);
                    if (object.githubLabel != null)
                        message.githubLabel = String(object.githubLabel);
                    if (object.codeownerGithubTeams) {
                        if (!Array.isArray(object.codeownerGithubTeams))
                            throw TypeError(".google.api.Publishing.codeownerGithubTeams: array expected");
                        message.codeownerGithubTeams = [];
                        for (var i = 0; i < object.codeownerGithubTeams.length; ++i)
                            message.codeownerGithubTeams[i] = String(object.codeownerGithubTeams[i]);
                    }
                    if (object.docTagPrefix != null)
                        message.docTagPrefix = String(object.docTagPrefix);
                    switch (object.organization) {
                    default:
                        if (typeof object.organization === "number") {
                            message.organization = object.organization;
                            break;
                        }
                        break;
                    case "CLIENT_LIBRARY_ORGANIZATION_UNSPECIFIED":
                    case 0:
                        message.organization = 0;
                        break;
                    case "CLOUD":
                    case 1:
                        message.organization = 1;
                        break;
                    case "ADS":
                    case 2:
                        message.organization = 2;
                        break;
                    case "PHOTOS":
                    case 3:
                        message.organization = 3;
                        break;
                    case "STREET_VIEW":
                    case 4:
                        message.organization = 4;
                        break;
                    }
                    if (object.librarySettings) {
                        if (!Array.isArray(object.librarySettings))
                            throw TypeError(".google.api.Publishing.librarySettings: array expected");
                        message.librarySettings = [];
                        for (var i = 0; i < object.librarySettings.length; ++i) {
                            if (typeof object.librarySettings[i] !== "object")
                                throw TypeError(".google.api.Publishing.librarySettings: object expected");
                            message.librarySettings[i] = $root.google.api.ClientLibrarySettings.fromObject(object.librarySettings[i]);
                        }
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a Publishing message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.Publishing
                 * @static
                 * @param {google.api.Publishing} message Publishing
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Publishing.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.arrays || options.defaults) {
                        object.methodSettings = [];
                        object.codeownerGithubTeams = [];
                        object.librarySettings = [];
                    }
                    if (options.defaults) {
                        object.newIssueUri = "";
                        object.documentationUri = "";
                        object.apiShortName = "";
                        object.githubLabel = "";
                        object.docTagPrefix = "";
                        object.organization = options.enums === String ? "CLIENT_LIBRARY_ORGANIZATION_UNSPECIFIED" : 0;
                    }
                    if (message.methodSettings && message.methodSettings.length) {
                        object.methodSettings = [];
                        for (var j = 0; j < message.methodSettings.length; ++j)
                            object.methodSettings[j] = $root.google.api.MethodSettings.toObject(message.methodSettings[j], options);
                    }
                    if (message.newIssueUri != null && message.hasOwnProperty("newIssueUri"))
                        object.newIssueUri = message.newIssueUri;
                    if (message.documentationUri != null && message.hasOwnProperty("documentationUri"))
                        object.documentationUri = message.documentationUri;
                    if (message.apiShortName != null && message.hasOwnProperty("apiShortName"))
                        object.apiShortName = message.apiShortName;
                    if (message.githubLabel != null && message.hasOwnProperty("githubLabel"))
                        object.githubLabel = message.githubLabel;
                    if (message.codeownerGithubTeams && message.codeownerGithubTeams.length) {
                        object.codeownerGithubTeams = [];
                        for (var j = 0; j < message.codeownerGithubTeams.length; ++j)
                            object.codeownerGithubTeams[j] = message.codeownerGithubTeams[j];
                    }
                    if (message.docTagPrefix != null && message.hasOwnProperty("docTagPrefix"))
                        object.docTagPrefix = message.docTagPrefix;
                    if (message.organization != null && message.hasOwnProperty("organization"))
                        object.organization = options.enums === String ? $root.google.api.ClientLibraryOrganization[message.organization] === undefined ? message.organization : $root.google.api.ClientLibraryOrganization[message.organization] : message.organization;
                    if (message.librarySettings && message.librarySettings.length) {
                        object.librarySettings = [];
                        for (var j = 0; j < message.librarySettings.length; ++j)
                            object.librarySettings[j] = $root.google.api.ClientLibrarySettings.toObject(message.librarySettings[j], options);
                    }
                    return object;
                };
    
                /**
                 * Converts this Publishing to JSON.
                 * @function toJSON
                 * @memberof google.api.Publishing
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Publishing.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for Publishing
                 * @function getTypeUrl
                 * @memberof google.api.Publishing
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Publishing.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.Publishing";
                };
    
                return Publishing;
            })();
    
            api.JavaSettings = (function() {
    
                /**
                 * Properties of a JavaSettings.
                 * @memberof google.api
                 * @interface IJavaSettings
                 * @property {string|null} [libraryPackage] JavaSettings libraryPackage
                 * @property {Object.<string,string>|null} [serviceClassNames] JavaSettings serviceClassNames
                 * @property {google.api.ICommonLanguageSettings|null} [common] JavaSettings common
                 */
    
                /**
                 * Constructs a new JavaSettings.
                 * @memberof google.api
                 * @classdesc Represents a JavaSettings.
                 * @implements IJavaSettings
                 * @constructor
                 * @param {google.api.IJavaSettings=} [properties] Properties to set
                 */
                function JavaSettings(properties) {
                    this.serviceClassNames = {};
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * JavaSettings libraryPackage.
                 * @member {string} libraryPackage
                 * @memberof google.api.JavaSettings
                 * @instance
                 */
                JavaSettings.prototype.libraryPackage = "";
    
                /**
                 * JavaSettings serviceClassNames.
                 * @member {Object.<string,string>} serviceClassNames
                 * @memberof google.api.JavaSettings
                 * @instance
                 */
                JavaSettings.prototype.serviceClassNames = $util.emptyObject;
    
                /**
                 * JavaSettings common.
                 * @member {google.api.ICommonLanguageSettings|null|undefined} common
                 * @memberof google.api.JavaSettings
                 * @instance
                 */
                JavaSettings.prototype.common = null;
    
                /**
                 * Creates a JavaSettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.JavaSettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.JavaSettings} JavaSettings
                 */
                JavaSettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.JavaSettings)
                        return object;
                    var message = new $root.google.api.JavaSettings();
                    if (object.libraryPackage != null)
                        message.libraryPackage = String(object.libraryPackage);
                    if (object.serviceClassNames) {
                        if (typeof object.serviceClassNames !== "object")
                            throw TypeError(".google.api.JavaSettings.serviceClassNames: object expected");
                        message.serviceClassNames = {};
                        for (var keys = Object.keys(object.serviceClassNames), i = 0; i < keys.length; ++i)
                            message.serviceClassNames[keys[i]] = String(object.serviceClassNames[keys[i]]);
                    }
                    if (object.common != null) {
                        if (typeof object.common !== "object")
                            throw TypeError(".google.api.JavaSettings.common: object expected");
                        message.common = $root.google.api.CommonLanguageSettings.fromObject(object.common);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a JavaSettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.JavaSettings
                 * @static
                 * @param {google.api.JavaSettings} message JavaSettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                JavaSettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.objects || options.defaults)
                        object.serviceClassNames = {};
                    if (options.defaults) {
                        object.libraryPackage = "";
                        object.common = null;
                    }
                    if (message.libraryPackage != null && message.hasOwnProperty("libraryPackage"))
                        object.libraryPackage = message.libraryPackage;
                    var keys2;
                    if (message.serviceClassNames && (keys2 = Object.keys(message.serviceClassNames)).length) {
                        object.serviceClassNames = {};
                        for (var j = 0; j < keys2.length; ++j)
                            object.serviceClassNames[keys2[j]] = message.serviceClassNames[keys2[j]];
                    }
                    if (message.common != null && message.hasOwnProperty("common"))
                        object.common = $root.google.api.CommonLanguageSettings.toObject(message.common, options);
                    return object;
                };
    
                /**
                 * Converts this JavaSettings to JSON.
                 * @function toJSON
                 * @memberof google.api.JavaSettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                JavaSettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for JavaSettings
                 * @function getTypeUrl
                 * @memberof google.api.JavaSettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                JavaSettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.JavaSettings";
                };
    
                return JavaSettings;
            })();
    
            api.CppSettings = (function() {
    
                /**
                 * Properties of a CppSettings.
                 * @memberof google.api
                 * @interface ICppSettings
                 * @property {google.api.ICommonLanguageSettings|null} [common] CppSettings common
                 */
    
                /**
                 * Constructs a new CppSettings.
                 * @memberof google.api
                 * @classdesc Represents a CppSettings.
                 * @implements ICppSettings
                 * @constructor
                 * @param {google.api.ICppSettings=} [properties] Properties to set
                 */
                function CppSettings(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * CppSettings common.
                 * @member {google.api.ICommonLanguageSettings|null|undefined} common
                 * @memberof google.api.CppSettings
                 * @instance
                 */
                CppSettings.prototype.common = null;
    
                /**
                 * Creates a CppSettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.CppSettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.CppSettings} CppSettings
                 */
                CppSettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.CppSettings)
                        return object;
                    var message = new $root.google.api.CppSettings();
                    if (object.common != null) {
                        if (typeof object.common !== "object")
                            throw TypeError(".google.api.CppSettings.common: object expected");
                        message.common = $root.google.api.CommonLanguageSettings.fromObject(object.common);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a CppSettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.CppSettings
                 * @static
                 * @param {google.api.CppSettings} message CppSettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                CppSettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.common = null;
                    if (message.common != null && message.hasOwnProperty("common"))
                        object.common = $root.google.api.CommonLanguageSettings.toObject(message.common, options);
                    return object;
                };
    
                /**
                 * Converts this CppSettings to JSON.
                 * @function toJSON
                 * @memberof google.api.CppSettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                CppSettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for CppSettings
                 * @function getTypeUrl
                 * @memberof google.api.CppSettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                CppSettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.CppSettings";
                };
    
                return CppSettings;
            })();
    
            api.PhpSettings = (function() {
    
                /**
                 * Properties of a PhpSettings.
                 * @memberof google.api
                 * @interface IPhpSettings
                 * @property {google.api.ICommonLanguageSettings|null} [common] PhpSettings common
                 */
    
                /**
                 * Constructs a new PhpSettings.
                 * @memberof google.api
                 * @classdesc Represents a PhpSettings.
                 * @implements IPhpSettings
                 * @constructor
                 * @param {google.api.IPhpSettings=} [properties] Properties to set
                 */
                function PhpSettings(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * PhpSettings common.
                 * @member {google.api.ICommonLanguageSettings|null|undefined} common
                 * @memberof google.api.PhpSettings
                 * @instance
                 */
                PhpSettings.prototype.common = null;
    
                /**
                 * Creates a PhpSettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.PhpSettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.PhpSettings} PhpSettings
                 */
                PhpSettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.PhpSettings)
                        return object;
                    var message = new $root.google.api.PhpSettings();
                    if (object.common != null) {
                        if (typeof object.common !== "object")
                            throw TypeError(".google.api.PhpSettings.common: object expected");
                        message.common = $root.google.api.CommonLanguageSettings.fromObject(object.common);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a PhpSettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.PhpSettings
                 * @static
                 * @param {google.api.PhpSettings} message PhpSettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                PhpSettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.common = null;
                    if (message.common != null && message.hasOwnProperty("common"))
                        object.common = $root.google.api.CommonLanguageSettings.toObject(message.common, options);
                    return object;
                };
    
                /**
                 * Converts this PhpSettings to JSON.
                 * @function toJSON
                 * @memberof google.api.PhpSettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                PhpSettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for PhpSettings
                 * @function getTypeUrl
                 * @memberof google.api.PhpSettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                PhpSettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.PhpSettings";
                };
    
                return PhpSettings;
            })();
    
            api.PythonSettings = (function() {
    
                /**
                 * Properties of a PythonSettings.
                 * @memberof google.api
                 * @interface IPythonSettings
                 * @property {google.api.ICommonLanguageSettings|null} [common] PythonSettings common
                 */
    
                /**
                 * Constructs a new PythonSettings.
                 * @memberof google.api
                 * @classdesc Represents a PythonSettings.
                 * @implements IPythonSettings
                 * @constructor
                 * @param {google.api.IPythonSettings=} [properties] Properties to set
                 */
                function PythonSettings(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * PythonSettings common.
                 * @member {google.api.ICommonLanguageSettings|null|undefined} common
                 * @memberof google.api.PythonSettings
                 * @instance
                 */
                PythonSettings.prototype.common = null;
    
                /**
                 * Creates a PythonSettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.PythonSettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.PythonSettings} PythonSettings
                 */
                PythonSettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.PythonSettings)
                        return object;
                    var message = new $root.google.api.PythonSettings();
                    if (object.common != null) {
                        if (typeof object.common !== "object")
                            throw TypeError(".google.api.PythonSettings.common: object expected");
                        message.common = $root.google.api.CommonLanguageSettings.fromObject(object.common);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a PythonSettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.PythonSettings
                 * @static
                 * @param {google.api.PythonSettings} message PythonSettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                PythonSettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.common = null;
                    if (message.common != null && message.hasOwnProperty("common"))
                        object.common = $root.google.api.CommonLanguageSettings.toObject(message.common, options);
                    return object;
                };
    
                /**
                 * Converts this PythonSettings to JSON.
                 * @function toJSON
                 * @memberof google.api.PythonSettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                PythonSettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for PythonSettings
                 * @function getTypeUrl
                 * @memberof google.api.PythonSettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                PythonSettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.PythonSettings";
                };
    
                return PythonSettings;
            })();
    
            api.NodeSettings = (function() {
    
                /**
                 * Properties of a NodeSettings.
                 * @memberof google.api
                 * @interface INodeSettings
                 * @property {google.api.ICommonLanguageSettings|null} [common] NodeSettings common
                 */
    
                /**
                 * Constructs a new NodeSettings.
                 * @memberof google.api
                 * @classdesc Represents a NodeSettings.
                 * @implements INodeSettings
                 * @constructor
                 * @param {google.api.INodeSettings=} [properties] Properties to set
                 */
                function NodeSettings(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * NodeSettings common.
                 * @member {google.api.ICommonLanguageSettings|null|undefined} common
                 * @memberof google.api.NodeSettings
                 * @instance
                 */
                NodeSettings.prototype.common = null;
    
                /**
                 * Creates a NodeSettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.NodeSettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.NodeSettings} NodeSettings
                 */
                NodeSettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.NodeSettings)
                        return object;
                    var message = new $root.google.api.NodeSettings();
                    if (object.common != null) {
                        if (typeof object.common !== "object")
                            throw TypeError(".google.api.NodeSettings.common: object expected");
                        message.common = $root.google.api.CommonLanguageSettings.fromObject(object.common);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a NodeSettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.NodeSettings
                 * @static
                 * @param {google.api.NodeSettings} message NodeSettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                NodeSettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.common = null;
                    if (message.common != null && message.hasOwnProperty("common"))
                        object.common = $root.google.api.CommonLanguageSettings.toObject(message.common, options);
                    return object;
                };
    
                /**
                 * Converts this NodeSettings to JSON.
                 * @function toJSON
                 * @memberof google.api.NodeSettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                NodeSettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for NodeSettings
                 * @function getTypeUrl
                 * @memberof google.api.NodeSettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                NodeSettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.NodeSettings";
                };
    
                return NodeSettings;
            })();
    
            api.DotnetSettings = (function() {
    
                /**
                 * Properties of a DotnetSettings.
                 * @memberof google.api
                 * @interface IDotnetSettings
                 * @property {google.api.ICommonLanguageSettings|null} [common] DotnetSettings common
                 */
    
                /**
                 * Constructs a new DotnetSettings.
                 * @memberof google.api
                 * @classdesc Represents a DotnetSettings.
                 * @implements IDotnetSettings
                 * @constructor
                 * @param {google.api.IDotnetSettings=} [properties] Properties to set
                 */
                function DotnetSettings(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * DotnetSettings common.
                 * @member {google.api.ICommonLanguageSettings|null|undefined} common
                 * @memberof google.api.DotnetSettings
                 * @instance
                 */
                DotnetSettings.prototype.common = null;
    
                /**
                 * Creates a DotnetSettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.DotnetSettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.DotnetSettings} DotnetSettings
                 */
                DotnetSettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.DotnetSettings)
                        return object;
                    var message = new $root.google.api.DotnetSettings();
                    if (object.common != null) {
                        if (typeof object.common !== "object")
                            throw TypeError(".google.api.DotnetSettings.common: object expected");
                        message.common = $root.google.api.CommonLanguageSettings.fromObject(object.common);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a DotnetSettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.DotnetSettings
                 * @static
                 * @param {google.api.DotnetSettings} message DotnetSettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                DotnetSettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.common = null;
                    if (message.common != null && message.hasOwnProperty("common"))
                        object.common = $root.google.api.CommonLanguageSettings.toObject(message.common, options);
                    return object;
                };
    
                /**
                 * Converts this DotnetSettings to JSON.
                 * @function toJSON
                 * @memberof google.api.DotnetSettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                DotnetSettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for DotnetSettings
                 * @function getTypeUrl
                 * @memberof google.api.DotnetSettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                DotnetSettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.DotnetSettings";
                };
    
                return DotnetSettings;
            })();
    
            api.RubySettings = (function() {
    
                /**
                 * Properties of a RubySettings.
                 * @memberof google.api
                 * @interface IRubySettings
                 * @property {google.api.ICommonLanguageSettings|null} [common] RubySettings common
                 */
    
                /**
                 * Constructs a new RubySettings.
                 * @memberof google.api
                 * @classdesc Represents a RubySettings.
                 * @implements IRubySettings
                 * @constructor
                 * @param {google.api.IRubySettings=} [properties] Properties to set
                 */
                function RubySettings(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * RubySettings common.
                 * @member {google.api.ICommonLanguageSettings|null|undefined} common
                 * @memberof google.api.RubySettings
                 * @instance
                 */
                RubySettings.prototype.common = null;
    
                /**
                 * Creates a RubySettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.RubySettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.RubySettings} RubySettings
                 */
                RubySettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.RubySettings)
                        return object;
                    var message = new $root.google.api.RubySettings();
                    if (object.common != null) {
                        if (typeof object.common !== "object")
                            throw TypeError(".google.api.RubySettings.common: object expected");
                        message.common = $root.google.api.CommonLanguageSettings.fromObject(object.common);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a RubySettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.RubySettings
                 * @static
                 * @param {google.api.RubySettings} message RubySettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                RubySettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.common = null;
                    if (message.common != null && message.hasOwnProperty("common"))
                        object.common = $root.google.api.CommonLanguageSettings.toObject(message.common, options);
                    return object;
                };
    
                /**
                 * Converts this RubySettings to JSON.
                 * @function toJSON
                 * @memberof google.api.RubySettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                RubySettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for RubySettings
                 * @function getTypeUrl
                 * @memberof google.api.RubySettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                RubySettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.RubySettings";
                };
    
                return RubySettings;
            })();
    
            api.GoSettings = (function() {
    
                /**
                 * Properties of a GoSettings.
                 * @memberof google.api
                 * @interface IGoSettings
                 * @property {google.api.ICommonLanguageSettings|null} [common] GoSettings common
                 */
    
                /**
                 * Constructs a new GoSettings.
                 * @memberof google.api
                 * @classdesc Represents a GoSettings.
                 * @implements IGoSettings
                 * @constructor
                 * @param {google.api.IGoSettings=} [properties] Properties to set
                 */
                function GoSettings(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * GoSettings common.
                 * @member {google.api.ICommonLanguageSettings|null|undefined} common
                 * @memberof google.api.GoSettings
                 * @instance
                 */
                GoSettings.prototype.common = null;
    
                /**
                 * Creates a GoSettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.GoSettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.GoSettings} GoSettings
                 */
                GoSettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.GoSettings)
                        return object;
                    var message = new $root.google.api.GoSettings();
                    if (object.common != null) {
                        if (typeof object.common !== "object")
                            throw TypeError(".google.api.GoSettings.common: object expected");
                        message.common = $root.google.api.CommonLanguageSettings.fromObject(object.common);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a GoSettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.GoSettings
                 * @static
                 * @param {google.api.GoSettings} message GoSettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                GoSettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.common = null;
                    if (message.common != null && message.hasOwnProperty("common"))
                        object.common = $root.google.api.CommonLanguageSettings.toObject(message.common, options);
                    return object;
                };
    
                /**
                 * Converts this GoSettings to JSON.
                 * @function toJSON
                 * @memberof google.api.GoSettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                GoSettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for GoSettings
                 * @function getTypeUrl
                 * @memberof google.api.GoSettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                GoSettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.GoSettings";
                };
    
                return GoSettings;
            })();
    
            api.MethodSettings = (function() {
    
                /**
                 * Properties of a MethodSettings.
                 * @memberof google.api
                 * @interface IMethodSettings
                 * @property {string|null} [selector] MethodSettings selector
                 * @property {google.api.MethodSettings.ILongRunning|null} [longRunning] MethodSettings longRunning
                 */
    
                /**
                 * Constructs a new MethodSettings.
                 * @memberof google.api
                 * @classdesc Represents a MethodSettings.
                 * @implements IMethodSettings
                 * @constructor
                 * @param {google.api.IMethodSettings=} [properties] Properties to set
                 */
                function MethodSettings(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }
    
                /**
                 * MethodSettings selector.
                 * @member {string} selector
                 * @memberof google.api.MethodSettings
                 * @instance
                 */
                MethodSettings.prototype.selector = "";
    
                /**
                 * MethodSettings longRunning.
                 * @member {google.api.MethodSettings.ILongRunning|null|undefined} longRunning
                 * @memberof google.api.MethodSettings
                 * @instance
                 */
                MethodSettings.prototype.longRunning = null;
    
                /**
                 * Creates a MethodSettings message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.api.MethodSettings
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.api.MethodSettings} MethodSettings
                 */
                MethodSettings.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.api.MethodSettings)
                        return object;
                    var message = new $root.google.api.MethodSettings();
                    if (object.selector != null)
                        message.selector = String(object.selector);
                    if (object.longRunning != null) {
                        if (typeof object.longRunning !== "object")
                            throw TypeError(".google.api.MethodSettings.longRunning: object expected");
                        message.longRunning = $root.google.api.MethodSettings.LongRunning.fromObject(object.longRunning);
                    }
                    return message;
                };
    
                /**
                 * Creates a plain object from a MethodSettings message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.api.MethodSettings
                 * @static
                 * @param {google.api.MethodSettings} message MethodSettings
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                MethodSettings.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.selector = "";
                        object.longRunning = null;
                    }
                    if (message.selector != null && message.hasOwnProperty("selector"))
                        object.selector = message.selector;
                    if (message.longRunning != null && message.hasOwnProperty("longRunning"))
                        object.longRunning = $root.google.api.MethodSettings.LongRunning.toObject(message.longRunning, options);
                    return object;
                };
    
                /**
                 * Converts this MethodSettings to JSON.
                 * @function toJSON
                 * @memberof google.api.MethodSettings
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                MethodSettings.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };
    
                /**
                 * Gets the default type url for MethodSettings
                 * @function getTypeUrl
                 * @memberof google.api.MethodSettings
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                MethodSettings.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.MethodSettings";
                };
    
                MethodSettings.LongRunning = (function() {
    
                    /**
                     * Properties of a LongRunning.
                     * @memberof google.api.MethodSettings
                     * @interface ILongRunning
                     * @property {google.protobuf.IDuration|null} [initialPollDelay] LongRunning initialPollDelay
                     * @property {number|null} [pollDelayMultiplier] LongRunning pollDelayMultiplier
                     * @property {google.protobuf.IDuration|null} [maxPollDelay] LongRunning maxPollDelay
                     * @property {google.protobuf.IDuration|null} [totalPollTimeout] LongRunning totalPollTimeout
                     */
    
                    /**
                     * Constructs a new LongRunning.
                     * @memberof google.api.MethodSettings
                     * @classdesc Represents a LongRunning.
                     * @implements ILongRunning
                     * @constructor
                     * @param {google.api.MethodSettings.ILongRunning=} [properties] Properties to set
                     */
                    function LongRunning(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }
    
                    /**
                     * LongRunning initialPollDelay.
                     * @member {google.protobuf.IDuration|null|undefined} initialPollDelay
                     * @memberof google.api.MethodSettings.LongRunning
                     * @instance
                     */
                    LongRunning.prototype.initialPollDelay = null;
    
                    /**
                     * LongRunning pollDelayMultiplier.
                     * @member {number} pollDelayMultiplier
                     * @memberof google.api.MethodSettings.LongRunning
                     * @instance
                     */
                    LongRunning.prototype.pollDelayMultiplier = 0;
    
                    /**
                     * LongRunning maxPollDelay.
                     * @member {google.protobuf.IDuration|null|undefined} maxPollDelay
                     * @memberof google.api.MethodSettings.LongRunning
                     * @instance
                     */
                    LongRunning.prototype.maxPollDelay = null;
    
                    /**
                     * LongRunning totalPollTimeout.
                     * @member {google.protobuf.IDuration|null|undefined} totalPollTimeout
                     * @memberof google.api.MethodSettings.LongRunning
                     * @instance
                     */
                    LongRunning.prototype.totalPollTimeout = null;
    
                    /**
                     * Creates a LongRunning message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof google.api.MethodSettings.LongRunning
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {google.api.MethodSettings.LongRunning} LongRunning
                     */
                    LongRunning.fromObject = function fromObject(object) {
                        if (object instanceof $root.google.api.MethodSettings.LongRunning)
                            return object;
                        var message = new $root.google.api.MethodSettings.LongRunning();
                        if (object.initialPollDelay != null) {
                            if (typeof object.initialPollDelay !== "object")
                                throw TypeError(".google.api.MethodSettings.LongRunning.initialPollDelay: object expected");
                            message.initialPollDelay = $root.google.protobuf.Duration.fromObject(object.initialPollDelay);
                        }
                        if (object.pollDelayMultiplier != null)
                            message.pollDelayMultiplier = Number(object.pollDelayMultiplier);
                        if (object.maxPollDelay != null) {
                            if (typeof object.maxPollDelay !== "object")
                                throw TypeError(".google.api.MethodSettings.LongRunning.maxPollDelay: object expected");
                            message.maxPollDelay = $root.google.protobuf.Duration.fromObject(object.maxPollDelay);
                        }
                        if (object.totalPollTimeout != null) {
                            if (typeof object.totalPollTimeout !== "object")
                                throw TypeError(".google.api.MethodSettings.LongRunning.totalPollTimeout: object expected");
                            message.totalPollTimeout = $root.google.protobuf.Duration.fromObject(object.totalPollTimeout);
                        }
                        return message;
                    };
    
                    /**
                     * Creates a plain object from a LongRunning message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof google.api.MethodSettings.LongRunning
                     * @static
                     * @param {google.api.MethodSettings.LongRunning} message LongRunning
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    LongRunning.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.initialPollDelay = null;
                            object.pollDelayMultiplier = 0;
                            object.maxPollDelay = null;
                            object.totalPollTimeout = null;
                        }
                        if (message.initialPollDelay != null && message.hasOwnProperty("initialPollDelay"))
                            object.initialPollDelay = $root.google.protobuf.Duration.toObject(message.initialPollDelay, options);
                        if (message.pollDelayMultiplier != null && message.hasOwnProperty("pollDelayMultiplier"))
                            object.pollDelayMultiplier = options.json && !isFinite(message.pollDelayMultiplier) ? String(message.pollDelayMultiplier) : message.pollDelayMultiplier;
                        if (message.maxPollDelay != null && message.hasOwnProperty("maxPollDelay"))
                            object.maxPollDelay = $root.google.protobuf.Duration.toObject(message.maxPollDelay, options);
                        if (message.totalPollTimeout != null && message.hasOwnProperty("totalPollTimeout"))
                            object.totalPollTimeout = $root.google.protobuf.Duration.toObject(message.totalPollTimeout, options);
                        return object;
                    };
    
                    /**
                     * Converts this LongRunning to JSON.
                     * @function toJSON
                     * @memberof google.api.MethodSettings.LongRunning
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    LongRunning.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };
    
                    /**
                     * Gets the default type url for LongRunning
                     * @function getTypeUrl
                     * @memberof google.api.MethodSettings.LongRunning
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    LongRunning.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/google.api.MethodSettings.LongRunning";
                    };
    
                    return LongRunning;
                })();
    
                return MethodSettings;
            })();
    
            /**
             * ClientLibraryOrganization enum.
             * @name google.api.ClientLibraryOrganization
             * @enum {string}
             * @property {string} CLIENT_LIBRARY_ORGANIZATION_UNSPECIFIED=CLIENT_LIBRARY_ORGANIZATION_UNSPECIFIED CLIENT_LIBRARY_ORGANIZATION_UNSPECIFIED value
             * @property {string} CLOUD=CLOUD CLOUD value
             * @property {string} ADS=ADS ADS value
             * @property {string} PHOTOS=PHOTOS PHOTOS value
             * @property {string} STREET_VIEW=STREET_VIEW STREET_VIEW value
             */
            api.ClientLibraryOrganization = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "CLIENT_LIBRARY_ORGANIZATION_UNSPECIFIED"] = "CLIENT_LIBRARY_ORGANIZATION_UNSPECIFIED";
                values[valuesById[1] = "CLOUD"] = "CLOUD";
                values[valuesById[2] = "ADS"] = "ADS";
                values[valuesById[3] = "PHOTOS"] = "PHOTOS";
                values[valuesById[4] = "STREET_VIEW"] = "STREET_VIEW";
                return values;
            })();
    
            /**
             * ClientLibraryDestination enum.
             * @name google.api.ClientLibraryDestination
             * @enum {string}
             * @property {string} CLIENT_LIBRARY_DESTINATION_UNSPECIFIED=CLIENT_LIBRARY_DESTINATION_UNSPECIFIED CLIENT_LIBRARY_DESTINATION_UNSPECIFIED value
             * @property {string} GITHUB=GITHUB GITHUB value
             * @property {string} PACKAGE_MANAGER=PACKAGE_MANAGER PACKAGE_MANAGER value
             */
            api.ClientLibraryDestination = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "CLIENT_LIBRARY_DESTINATION_UNSPECIFIED"] = "CLIENT_LIBRARY_DESTINATION_UNSPECIFIED";
                values[valuesById[10] = "GITHUB"] = "GITHUB";
                values[valuesById[20] = "PACKAGE_MANAGER"] = "PACKAGE_MANAGER";
                return values;
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
             * @property {string} UNORDERED_LIST=UNORDERED_LIST UNORDERED_LIST value
             * @property {string} NON_EMPTY_DEFAULT=NON_EMPTY_DEFAULT NON_EMPTY_DEFAULT value
             */
            api.FieldBehavior = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "FIELD_BEHAVIOR_UNSPECIFIED"] = "FIELD_BEHAVIOR_UNSPECIFIED";
                values[valuesById[1] = "OPTIONAL"] = "OPTIONAL";
                values[valuesById[2] = "REQUIRED"] = "REQUIRED";
                values[valuesById[3] = "OUTPUT_ONLY"] = "OUTPUT_ONLY";
                values[valuesById[4] = "INPUT_ONLY"] = "INPUT_ONLY";
                values[valuesById[5] = "IMMUTABLE"] = "IMMUTABLE";
                values[valuesById[6] = "UNORDERED_LIST"] = "UNORDERED_LIST";
                values[valuesById[7] = "NON_EMPTY_DEFAULT"] = "NON_EMPTY_DEFAULT";
                return values;
            })();
    
            /**
             * LaunchStage enum.
             * @name google.api.LaunchStage
             * @enum {string}
             * @property {string} LAUNCH_STAGE_UNSPECIFIED=LAUNCH_STAGE_UNSPECIFIED LAUNCH_STAGE_UNSPECIFIED value
             * @property {string} UNIMPLEMENTED=UNIMPLEMENTED UNIMPLEMENTED value
             * @property {string} PRELAUNCH=PRELAUNCH PRELAUNCH value
             * @property {string} EARLY_ACCESS=EARLY_ACCESS EARLY_ACCESS value
             * @property {string} ALPHA=ALPHA ALPHA value
             * @property {string} BETA=BETA BETA value
             * @property {string} GA=GA GA value
             * @property {string} DEPRECATED=DEPRECATED DEPRECATED value
             */
            api.LaunchStage = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "LAUNCH_STAGE_UNSPECIFIED"] = "LAUNCH_STAGE_UNSPECIFIED";
                values[valuesById[6] = "UNIMPLEMENTED"] = "UNIMPLEMENTED";
                values[valuesById[7] = "PRELAUNCH"] = "PRELAUNCH";
                values[valuesById[1] = "EARLY_ACCESS"] = "EARLY_ACCESS";
                values[valuesById[2] = "ALPHA"] = "ALPHA";
                values[valuesById[3] = "BETA"] = "BETA";
                values[valuesById[4] = "GA"] = "GA";
                values[valuesById[5] = "DEPRECATED"] = "DEPRECATED";
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
                 * @property {Array.<google.api.ResourceDescriptor.Style>|null} [style] ResourceDescriptor style
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
                    this.style = [];
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
                 * ResourceDescriptor style.
                 * @member {Array.<google.api.ResourceDescriptor.Style>} style
                 * @memberof google.api.ResourceDescriptor
                 * @instance
                 */
                ResourceDescriptor.prototype.style = $util.emptyArray;
    
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
                    default:
                        if (typeof object.history === "number") {
                            message.history = object.history;
                            break;
                        }
                        break;
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
                    if (object.style) {
                        if (!Array.isArray(object.style))
                            throw TypeError(".google.api.ResourceDescriptor.style: array expected");
                        message.style = [];
                        for (var i = 0; i < object.style.length; ++i)
                            switch (object.style[i]) {
                            default:
                                if (typeof object.style[i] === "number") {
                                    message.style[i] = object.style[i];
                                    break;
                                }
                            case "STYLE_UNSPECIFIED":
                            case 0:
                                message.style[i] = 0;
                                break;
                            case "DECLARATIVE_FRIENDLY":
                            case 1:
                                message.style[i] = 1;
                                break;
                            }
                    }
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
                    if (options.arrays || options.defaults) {
                        object.pattern = [];
                        object.style = [];
                    }
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
                        object.history = options.enums === String ? $root.google.api.ResourceDescriptor.History[message.history] === undefined ? message.history : $root.google.api.ResourceDescriptor.History[message.history] : message.history;
                    if (message.plural != null && message.hasOwnProperty("plural"))
                        object.plural = message.plural;
                    if (message.singular != null && message.hasOwnProperty("singular"))
                        object.singular = message.singular;
                    if (message.style && message.style.length) {
                        object.style = [];
                        for (var j = 0; j < message.style.length; ++j)
                            object.style[j] = options.enums === String ? $root.google.api.ResourceDescriptor.Style[message.style[j]] === undefined ? message.style[j] : $root.google.api.ResourceDescriptor.Style[message.style[j]] : message.style[j];
                    }
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
                 * Gets the default type url for ResourceDescriptor
                 * @function getTypeUrl
                 * @memberof google.api.ResourceDescriptor
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                ResourceDescriptor.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.ResourceDescriptor";
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
    
                /**
                 * Style enum.
                 * @name google.api.ResourceDescriptor.Style
                 * @enum {string}
                 * @property {string} STYLE_UNSPECIFIED=STYLE_UNSPECIFIED STYLE_UNSPECIFIED value
                 * @property {string} DECLARATIVE_FRIENDLY=DECLARATIVE_FRIENDLY DECLARATIVE_FRIENDLY value
                 */
                ResourceDescriptor.Style = (function() {
                    var valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[0] = "STYLE_UNSPECIFIED"] = "STYLE_UNSPECIFIED";
                    values[valuesById[1] = "DECLARATIVE_FRIENDLY"] = "DECLARATIVE_FRIENDLY";
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
    
                /**
                 * Gets the default type url for ResourceReference
                 * @function getTypeUrl
                 * @memberof google.api.ResourceReference
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                ResourceReference.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.api.ResourceReference";
                };
    
                return ResourceReference;
            })();
    
            return api;
        })();
    
        google.protobuf = (function() {
    
            /**
             * Namespace protobuf.
             * @memberof google
             * @namespace
             */
            var protobuf = {};
    
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
    
                /**
                 * Gets the default type url for FileDescriptorSet
                 * @function getTypeUrl
                 * @memberof google.protobuf.FileDescriptorSet
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                FileDescriptorSet.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.FileDescriptorSet";
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
    
                /**
                 * Gets the default type url for FileDescriptorProto
                 * @function getTypeUrl
                 * @memberof google.protobuf.FileDescriptorProto
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                FileDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.FileDescriptorProto";
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
    
                /**
                 * Gets the default type url for DescriptorProto
                 * @function getTypeUrl
                 * @memberof google.protobuf.DescriptorProto
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                DescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.DescriptorProto";
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
    
                    /**
                     * Gets the default type url for ExtensionRange
                     * @function getTypeUrl
                     * @memberof google.protobuf.DescriptorProto.ExtensionRange
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    ExtensionRange.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/google.protobuf.DescriptorProto.ExtensionRange";
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
    
                    /**
                     * Gets the default type url for ReservedRange
                     * @function getTypeUrl
                     * @memberof google.protobuf.DescriptorProto.ReservedRange
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    ReservedRange.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/google.protobuf.DescriptorProto.ReservedRange";
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
                    default:
                        if (typeof object.label === "number") {
                            message.label = object.label;
                            break;
                        }
                        break;
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
                    default:
                        if (typeof object.type === "number") {
                            message.type = object.type;
                            break;
                        }
                        break;
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
                        object.label = options.enums === String ? $root.google.protobuf.FieldDescriptorProto.Label[message.label] === undefined ? message.label : $root.google.protobuf.FieldDescriptorProto.Label[message.label] : message.label;
                    if (message.type != null && message.hasOwnProperty("type"))
                        object.type = options.enums === String ? $root.google.protobuf.FieldDescriptorProto.Type[message.type] === undefined ? message.type : $root.google.protobuf.FieldDescriptorProto.Type[message.type] : message.type;
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
                 * Gets the default type url for FieldDescriptorProto
                 * @function getTypeUrl
                 * @memberof google.protobuf.FieldDescriptorProto
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                FieldDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.FieldDescriptorProto";
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
    
                /**
                 * Gets the default type url for OneofDescriptorProto
                 * @function getTypeUrl
                 * @memberof google.protobuf.OneofDescriptorProto
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                OneofDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.OneofDescriptorProto";
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
    
                /**
                 * Gets the default type url for EnumDescriptorProto
                 * @function getTypeUrl
                 * @memberof google.protobuf.EnumDescriptorProto
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                EnumDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.EnumDescriptorProto";
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
    
                /**
                 * Gets the default type url for EnumValueDescriptorProto
                 * @function getTypeUrl
                 * @memberof google.protobuf.EnumValueDescriptorProto
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                EnumValueDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.EnumValueDescriptorProto";
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
    
                /**
                 * Gets the default type url for ServiceDescriptorProto
                 * @function getTypeUrl
                 * @memberof google.protobuf.ServiceDescriptorProto
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                ServiceDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.ServiceDescriptorProto";
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
    
                /**
                 * Gets the default type url for MethodDescriptorProto
                 * @function getTypeUrl
                 * @memberof google.protobuf.MethodDescriptorProto
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                MethodDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.MethodDescriptorProto";
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
                    default:
                        if (typeof object.optimizeFor === "number") {
                            message.optimizeFor = object.optimizeFor;
                            break;
                        }
                        break;
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
                        object.optimizeFor = options.enums === String ? $root.google.protobuf.FileOptions.OptimizeMode[message.optimizeFor] === undefined ? message.optimizeFor : $root.google.protobuf.FileOptions.OptimizeMode[message.optimizeFor] : message.optimizeFor;
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
                 * Gets the default type url for FileOptions
                 * @function getTypeUrl
                 * @memberof google.protobuf.FileOptions
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                FileOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.FileOptions";
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
    
                /**
                 * Gets the default type url for MessageOptions
                 * @function getTypeUrl
                 * @memberof google.protobuf.MessageOptions
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                MessageOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.MessageOptions";
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
                    default:
                        if (typeof object.ctype === "number") {
                            message.ctype = object.ctype;
                            break;
                        }
                        break;
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
                    default:
                        if (typeof object.jstype === "number") {
                            message.jstype = object.jstype;
                            break;
                        }
                        break;
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
                                if (typeof object[".google.api.fieldBehavior"][i] === "number") {
                                    message[".google.api.fieldBehavior"][i] = object[".google.api.fieldBehavior"][i];
                                    break;
                                }
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
                            case "UNORDERED_LIST":
                            case 6:
                                message[".google.api.fieldBehavior"][i] = 6;
                                break;
                            case "NON_EMPTY_DEFAULT":
                            case 7:
                                message[".google.api.fieldBehavior"][i] = 7;
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
                        object.ctype = options.enums === String ? $root.google.protobuf.FieldOptions.CType[message.ctype] === undefined ? message.ctype : $root.google.protobuf.FieldOptions.CType[message.ctype] : message.ctype;
                    if (message.packed != null && message.hasOwnProperty("packed"))
                        object.packed = message.packed;
                    if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                        object.deprecated = message.deprecated;
                    if (message.lazy != null && message.hasOwnProperty("lazy"))
                        object.lazy = message.lazy;
                    if (message.jstype != null && message.hasOwnProperty("jstype"))
                        object.jstype = options.enums === String ? $root.google.protobuf.FieldOptions.JSType[message.jstype] === undefined ? message.jstype : $root.google.protobuf.FieldOptions.JSType[message.jstype] : message.jstype;
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
                            object[".google.api.fieldBehavior"][j] = options.enums === String ? $root.google.api.FieldBehavior[message[".google.api.fieldBehavior"][j]] === undefined ? message[".google.api.fieldBehavior"][j] : $root.google.api.FieldBehavior[message[".google.api.fieldBehavior"][j]] : message[".google.api.fieldBehavior"][j];
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
                 * Gets the default type url for FieldOptions
                 * @function getTypeUrl
                 * @memberof google.protobuf.FieldOptions
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                FieldOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.FieldOptions";
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
    
                /**
                 * Gets the default type url for OneofOptions
                 * @function getTypeUrl
                 * @memberof google.protobuf.OneofOptions
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                OneofOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.OneofOptions";
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
    
                /**
                 * Gets the default type url for EnumOptions
                 * @function getTypeUrl
                 * @memberof google.protobuf.EnumOptions
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                EnumOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.EnumOptions";
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
    
                /**
                 * Gets the default type url for EnumValueOptions
                 * @function getTypeUrl
                 * @memberof google.protobuf.EnumValueOptions
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                EnumValueOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.EnumValueOptions";
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
    
                /**
                 * Gets the default type url for ServiceOptions
                 * @function getTypeUrl
                 * @memberof google.protobuf.ServiceOptions
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                ServiceOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.ServiceOptions";
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
    
                /**
                 * Gets the default type url for MethodOptions
                 * @function getTypeUrl
                 * @memberof google.protobuf.MethodOptions
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                MethodOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.MethodOptions";
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
                        else if (object.stringValue.length >= 0)
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
    
                /**
                 * Gets the default type url for UninterpretedOption
                 * @function getTypeUrl
                 * @memberof google.protobuf.UninterpretedOption
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                UninterpretedOption.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.UninterpretedOption";
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
    
                    /**
                     * Gets the default type url for NamePart
                     * @function getTypeUrl
                     * @memberof google.protobuf.UninterpretedOption.NamePart
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    NamePart.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/google.protobuf.UninterpretedOption.NamePart";
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
    
                /**
                 * Gets the default type url for SourceCodeInfo
                 * @function getTypeUrl
                 * @memberof google.protobuf.SourceCodeInfo
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                SourceCodeInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.SourceCodeInfo";
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
    
                    /**
                     * Gets the default type url for Location
                     * @function getTypeUrl
                     * @memberof google.protobuf.SourceCodeInfo.Location
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    Location.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/google.protobuf.SourceCodeInfo.Location";
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
    
                /**
                 * Gets the default type url for GeneratedCodeInfo
                 * @function getTypeUrl
                 * @memberof google.protobuf.GeneratedCodeInfo
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                GeneratedCodeInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.GeneratedCodeInfo";
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
    
                    /**
                     * Gets the default type url for Annotation
                     * @function getTypeUrl
                     * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    Annotation.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/google.protobuf.GeneratedCodeInfo.Annotation";
                    };
    
                    return Annotation;
                })();
    
                return GeneratedCodeInfo;
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
    
                /**
                 * Gets the default type url for Empty
                 * @function getTypeUrl
                 * @memberof google.protobuf.Empty
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Empty.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.Empty";
                };
    
                return Empty;
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
    
                /**
                 * Gets the default type url for FieldMask
                 * @function getTypeUrl
                 * @memberof google.protobuf.FieldMask
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                FieldMask.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.FieldMask";
                };
    
                return FieldMask;
            })();
    
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
    
                /**
                 * Gets the default type url for Timestamp
                 * @function getTypeUrl
                 * @memberof google.protobuf.Timestamp
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Timestamp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.Timestamp";
                };
    
                return Timestamp;
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
                        else if (object.value.length >= 0)
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
    
                /**
                 * Gets the default type url for Any
                 * @function getTypeUrl
                 * @memberof google.protobuf.Any
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Any.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.Any";
                };
    
                return Any;
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
    
                /**
                 * Gets the default type url for Struct
                 * @function getTypeUrl
                 * @memberof google.protobuf.Struct
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Struct.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.Struct";
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
                 * @member {google.protobuf.NullValue|null|undefined} nullValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.nullValue = null;
    
                /**
                 * Value numberValue.
                 * @member {number|null|undefined} numberValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.numberValue = null;
    
                /**
                 * Value stringValue.
                 * @member {string|null|undefined} stringValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.stringValue = null;
    
                /**
                 * Value boolValue.
                 * @member {boolean|null|undefined} boolValue
                 * @memberof google.protobuf.Value
                 * @instance
                 */
                Value.prototype.boolValue = null;
    
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
                    default:
                        if (typeof object.nullValue === "number") {
                            message.nullValue = object.nullValue;
                            break;
                        }
                        break;
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
                        object.nullValue = options.enums === String ? $root.google.protobuf.NullValue[message.nullValue] === undefined ? message.nullValue : $root.google.protobuf.NullValue[message.nullValue] : message.nullValue;
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
    
                /**
                 * Gets the default type url for Value
                 * @function getTypeUrl
                 * @memberof google.protobuf.Value
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.Value";
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
    
                /**
                 * Gets the default type url for ListValue
                 * @function getTypeUrl
                 * @memberof google.protobuf.ListValue
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                ListValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.ListValue";
                };
    
                return ListValue;
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
    
                /**
                 * Gets the default type url for DoubleValue
                 * @function getTypeUrl
                 * @memberof google.protobuf.DoubleValue
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                DoubleValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.DoubleValue";
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
    
                /**
                 * Gets the default type url for FloatValue
                 * @function getTypeUrl
                 * @memberof google.protobuf.FloatValue
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                FloatValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.FloatValue";
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
    
                /**
                 * Gets the default type url for Int64Value
                 * @function getTypeUrl
                 * @memberof google.protobuf.Int64Value
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Int64Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.Int64Value";
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
    
                /**
                 * Gets the default type url for UInt64Value
                 * @function getTypeUrl
                 * @memberof google.protobuf.UInt64Value
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                UInt64Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.UInt64Value";
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
    
                /**
                 * Gets the default type url for Int32Value
                 * @function getTypeUrl
                 * @memberof google.protobuf.Int32Value
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Int32Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.Int32Value";
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
    
                /**
                 * Gets the default type url for UInt32Value
                 * @function getTypeUrl
                 * @memberof google.protobuf.UInt32Value
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                UInt32Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.UInt32Value";
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
    
                /**
                 * Gets the default type url for BoolValue
                 * @function getTypeUrl
                 * @memberof google.protobuf.BoolValue
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                BoolValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.BoolValue";
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
    
                /**
                 * Gets the default type url for StringValue
                 * @function getTypeUrl
                 * @memberof google.protobuf.StringValue
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                StringValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.StringValue";
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
                        else if (object.value.length >= 0)
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
    
                /**
                 * Gets the default type url for BytesValue
                 * @function getTypeUrl
                 * @memberof google.protobuf.BytesValue
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                BytesValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.BytesValue";
                };
    
                return BytesValue;
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
    
                /**
                 * Gets the default type url for Duration
                 * @function getTypeUrl
                 * @memberof google.protobuf.Duration
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Duration.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.protobuf.Duration";
                };
    
                return Duration;
            })();
    
            return protobuf;
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
    
                /**
                 * Gets the default type url for LatLng
                 * @function getTypeUrl
                 * @memberof google.type.LatLng
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                LatLng.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.type.LatLng";
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
    
                /**
                 * Gets the default type url for Status
                 * @function getTypeUrl
                 * @memberof google.rpc.Status
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Status.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.rpc.Status";
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
    
                /**
                 * Gets the default type url for Operation
                 * @function getTypeUrl
                 * @memberof google.longrunning.Operation
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Operation.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.longrunning.Operation";
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
    
                /**
                 * Gets the default type url for GetOperationRequest
                 * @function getTypeUrl
                 * @memberof google.longrunning.GetOperationRequest
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                GetOperationRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.longrunning.GetOperationRequest";
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
    
                /**
                 * Gets the default type url for ListOperationsRequest
                 * @function getTypeUrl
                 * @memberof google.longrunning.ListOperationsRequest
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                ListOperationsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.longrunning.ListOperationsRequest";
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
    
                /**
                 * Gets the default type url for ListOperationsResponse
                 * @function getTypeUrl
                 * @memberof google.longrunning.ListOperationsResponse
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                ListOperationsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.longrunning.ListOperationsResponse";
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
    
                /**
                 * Gets the default type url for CancelOperationRequest
                 * @function getTypeUrl
                 * @memberof google.longrunning.CancelOperationRequest
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                CancelOperationRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.longrunning.CancelOperationRequest";
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
    
                /**
                 * Gets the default type url for DeleteOperationRequest
                 * @function getTypeUrl
                 * @memberof google.longrunning.DeleteOperationRequest
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                DeleteOperationRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.longrunning.DeleteOperationRequest";
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
    
                /**
                 * Gets the default type url for WaitOperationRequest
                 * @function getTypeUrl
                 * @memberof google.longrunning.WaitOperationRequest
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                WaitOperationRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.longrunning.WaitOperationRequest";
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
    
                /**
                 * Gets the default type url for OperationInfo
                 * @function getTypeUrl
                 * @memberof google.longrunning.OperationInfo
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                OperationInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/google.longrunning.OperationInfo";
                };
    
                return OperationInfo;
            })();
    
            return longrunning;
        })();
    
        return google;
    })();

    return $root;
});
