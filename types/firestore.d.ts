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

// We deliberately use `any` in the external API to not impose type-checking
// on end users.
/* eslint-disable @typescript-eslint/no-explicit-any */

// Declare a global (ambient) namespace
// (used when not using import statement, but just script include).
declare namespace FirebaseFirestore {
  /** Alias for `any` but used where a Firestore field value would be provided. */
  export type DocumentFieldValue = any;

  /**
   * Document data (for use with `DocumentReference.set()`) consists of fields
   * mapped to values.
   */
  export type DocumentData = {[field: string]: DocumentFieldValue};

  /**
   * Similar to Typescript's `Partial<T>`, but allows nested fields to be
   * omitted and FieldValues to be passed in as property values.
   */
  export type PartialWithFieldValue<T> =
    | Partial<T>
    | (T extends Primitive
        ? T
        : T extends {}
        ? {[K in keyof T]?: PartialWithFieldValue<T[K]> | FieldValue}
        : never);

  /**
   * Allows FieldValues to be passed in as a property value while maintaining
   * type safety.
   */
  export type WithFieldValue<T> =
    | T
    | (T extends Primitive
        ? T
        : T extends {}
        ? {[K in keyof T]: WithFieldValue<T[K]> | FieldValue}
        : never);

  /**
   * Update data (for use with [update]{@link DocumentReference#update})
   * that contains paths mapped to values. Fields that contain dots reference
   * nested fields within the document. FieldValues can be passed in
   * as property values.
   *
   * You can update a top-level field in your document by using the field name
   * as a key (e.g. `foo`). The provided value completely replaces the contents
   * for this field.
   *
   * You can also update a nested field directly by using its field path as a
   * key (e.g. `foo.bar`). This nested field update replaces the contents at
   * `bar` but does not modify other data under `foo`.
   */
  export type UpdateData<T> = T extends Primitive
    ? T
    : T extends {}
    ? {[K in keyof T]?: UpdateData<T[K]> | FieldValue} & NestedUpdateFields<T>
    : Partial<T>;

  /** Primitive types. */
  export type Primitive = string | number | boolean | undefined | null;

  /**
   * For each field (e.g. 'bar'), find all nested keys (e.g. {'bar.baz': T1,
   * 'bar.qux': T2}). Intersect them together to make a single map containing
   * all possible keys that are all marked as optional
   */
  export type NestedUpdateFields<T extends Record<string, unknown>> =
    UnionToIntersection<
      {
        [K in keyof T & string]: ChildUpdateFields<K, T[K]>;
      }[keyof T & string] // Also include the generated prefix-string keys.
    >;

  /**
   * Helper for calculating the nested fields for a given type T1. This is needed
   * to distribute union types such as `undefined | {...}` (happens for optional
   * props) or `{a: A} | {b: B}`.
   *
   * In this use case, `V` is used to distribute the union types of `T[K]` on
   * `Record`, since `T[K]` is evaluated as an expression and not distributed.
   *
   * See https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
   */
  export type ChildUpdateFields<K extends string, V> =
    // Only allow nesting for map values
    V extends Record<string, unknown>
      ? // Recurse into the map and add the prefix in front of each key
        // (e.g. Prefix 'bar.' to create: 'bar.baz' and 'bar.qux'.
        AddPrefixToKeys<K, UpdateData<V>>
      : // UpdateData is always a map of values.
        never;

  /**
   * Returns a new map where every key is prefixed with the outer key appended
   * to a dot.
   */
  export type AddPrefixToKeys<
    Prefix extends string,
    T extends Record<string, unknown>,
  > =
    // Remap K => Prefix.K. See https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as
    {[K in keyof T & string as `${Prefix}.${K}`]+?: T[K]};

  /**
   * Given a union type `U = T1 | T2 | ...`, returns an intersected type
   * `(T1 & T2 & ...)`.
   *
   * Uses distributive conditional types and inference from conditional types.
   * This works because multiple candidates for the same type variable in
   * contra-variant positions causes an intersection type to be inferred.
   * https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-inference-in-conditional-types
   * https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
   */
  export type UnionToIntersection<U> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never;

  /**
   * Sets or disables the log function for all active Firestore instances.
   *
   * @param logger A log function that takes a message (such as `console.log`) or
   * `null` to turn off logging.
   */
  function setLogFunction(logger: ((msg: string) => void) | null): void;

  /**
   * Converter used by `withConverter()` to transform user objects of type
   * `AppModelType` into Firestore data of type `DbModelType`.
   *
   * Using the converter allows you to specify generic type arguments when
   * storing and retrieving objects from Firestore.
   *
   * In this context, an "AppModel" is a class that is used in an application to
   * package together related information and functionality. Such a class could,
   * for example, have properties with complex, nested data types, properties
   * used for memoization, properties of types not supported by Firestore (such
   * as `symbol` and `bigint`), and helper functions that perform compound
   * operations. Such classes are not suitable and/or possible to store into a
   * Firestore database. Instead, instances of such classes need to be converted
   * to "plain old JavaScript objects" (POJOs) with exclusively primitive
   * properties, potentially nested inside other POJOs or arrays of POJOs. In
   * this context, this type is referred to as the "DbModel" and would be an
   * object suitable for persisting into Firestore. For convenience,
   * applications can implement `FirestoreDataConverter` and register the
   * converter with Firestore objects, such as `DocumentReference` or `Query`,
   * to automatically convert `AppModel` to `DbModel` when storing into
   * Firestore, and convert `DbModel` to `AppModel` when retrieving from
   * Firestore.
   *
   * @example
   *
   * Simple Example
   *
   * const numberConverter = {
   *     toFirestore(value: WithFieldValue<number>) {
   *         return { value };
   *     },
   *     fromFirestore(snapshot: QueryDocumentSnapshot) {
   *         return snapshot.data().value as number;
   *     }
   * };
   *
   * async function simpleDemo(db: Firestore): Promise<void> {
   *     const documentRef = db.doc('values/value123').withConverter(numberConverter);
   *
   *     // converters are used with `setDoc`, `addDoc`, and `getDoc`
   *     await documentRef.set(42);
   *     const snapshot1 = await documentRef.get();
   *     assertEqual(snapshot1.data(), 42);
   *
   *     // converters are not used when writing data with `updateDoc`
   *     await documentRef.update({ value: 999 });
   *     const snapshot2 = await documentRef.get();
   *     assertEqual(snapshot2.data(), 999);
   * }
   *
   * Advanced Example
   *
   * // The Post class is a model that is used by our application.
   * // This class may have properties and methods that are specific
   * // to our application execution, which do not need to be persisted
   * // to Firestore.
   * class Post {
   *     constructor(
   *         readonly title: string,
   *         readonly author: string,
   *         readonly lastUpdatedMillis: number
   *     ) {}
   *     toString(): string {
   *         return `${this.title} by ${this.author}`;
   *     }
   * }
   *
   * // The PostDbModel represents how we want our posts to be stored
   * // in Firestore. This DbModel has different properties (`ttl`,
   * // `aut`, and `lut`) from the Post class we use in our application.
   * interface PostDbModel {
   *     ttl: string;
   *     aut: { firstName: string; lastName: string };
   *     lut: Timestamp;
   * }
   *
   * // The `PostConverter` implements `FirestoreDataConverter` and specifies
   * // how the Firestore SDK can convert `Post` objects to `PostDbModel`
   * // objects and vice versa.
   * class PostConverter implements FirestoreDataConverter<Post, PostDbModel> {
   *     toFirestore(post: WithFieldValue<Post>): WithFieldValue<PostDbModel> {
   *         return {
   *             ttl: post.title,
   *             aut: this._autFromAuthor(post.author),
   *             lut: this._lutFromLastUpdatedMillis(post.lastUpdatedMillis)
   *         };
   *     }
   *
   *     fromFirestore(snapshot: QueryDocumentSnapshot): Post {
   *         const data = snapshot.data() as PostDbModel;
   *         const author = `${data.aut.firstName} ${data.aut.lastName}`;
   *         return new Post(data.ttl, author, data.lut.toMillis());
   *     }
   *
   *     _autFromAuthor(
   *         author: string | FieldValue
   *     ): { firstName: string; lastName: string } | FieldValue {
   *         if (typeof author !== 'string') {
   *             // `author` is a FieldValue, so just return it.
   *             return author;
   *         }
   *         const [firstName, lastName] = author.split(' ');
   *         return {firstName, lastName};
   *     }
   *
   *     _lutFromLastUpdatedMillis(
   *         lastUpdatedMillis: number | FieldValue
   *     ): Timestamp | FieldValue {
   *         if (typeof lastUpdatedMillis !== 'number') {
   *             // `lastUpdatedMillis` must be a FieldValue, so just return it.
   *             return lastUpdatedMillis;
   *         }
   *         return Timestamp.fromMillis(lastUpdatedMillis);
   *     }
   * }
   *
   * async function advancedDemo(db: Firestore): Promise<void> {
   *     // Create a `DocumentReference` with a `FirestoreDataConverter`.
   *     const documentRef = db.doc('posts/post123').withConverter(new PostConverter());
   *
   *     // The `data` argument specified to `DocumentReference.set()` is type
   *     // checked by the TypeScript compiler to be compatible with `Post`. Since
   *     // the `data` argument is typed as `WithFieldValue<Post>` rather than just
   *     // `Post`, this allows properties of the `data` argument to also be special
   *     // Firestore values that perform server-side mutations, such as
   *     // `FieldValue.arrayRemove()`, `FieldValue.delete()`, and
   *     // `FieldValue.serverTimestamp()`.
   *     await documentRef.set({
   *         title: 'My Life',
   *         author: 'Foo Bar',
   *         lastUpdatedMillis: FieldValue.serverTimestamp()
   *     });
   *
   *     // The TypeScript compiler will fail to compile if the `data` argument
   *     // to `DocumentReference.set()` is _not_ compatible with
   *     // `WithFieldValue<Post>`. This type checking prevents the caller from
   *     // specifying objects with incorrect properties or property values.
   *     // @ts-expect-error "Argument of type { ttl: string; } is not assignable
   *     // to parameter of type WithFieldValue<Post>"
   *     await documentRef.set(documentRef, { ttl: 'The Title' });
   *
   *     // When retrieving a document with `DocumentReference.get()` the
   *     // `DocumentSnapshot` object's `data()` method returns a `Post`, rather
   *     // than a generic object, which would have been returned if the
   *     // `DocumentReference` did _not_ have a `FirestoreDataConverter`
   *     // attached to it.
   *     const snapshot1: DocumentSnapshot<Post> = await documentRef.get();
   *     const post1: Post = snapshot1.data()!;
   *     if (post1) {
   *         assertEqual(post1.title, 'My Life');
   *         assertEqual(post1.author, 'Foo Bar');
   *     }
   *
   *     // The `data` argument specified to `DocumentReference.update()` is type
   *     // checked by the TypeScript compiler to be compatible with
   *     // `PostDbModel`. Note that unlike `DocumentReference.set()`, whose
   *     // `data` argument must be compatible with `Post`, the `data` argument
   *     // to `update()` must be compatible with `PostDbModel`. Similar to
   *     // `set()`, since the `data` argument is typed as
   *     // `WithFieldValue<PostDbModel>` rather than just `PostDbModel`, this
   *     // allows properties of the `data` argument to also be those special
   *     // Firestore values, like `FieldValue.arrayRemove()`,
   *     // `FieldValue.delete()`, and `FieldValue.serverTimestamp()`.
   *     await documentRef.update({
   *         'aut.firstName': 'NewFirstName',
   *         lut: FieldValue.serverTimestamp()
   *     });
   *
   *     // The TypeScript compiler will fail to compile if the `data` argument
   *     // to `DocumentReference.update()` is _not_ compatible with
   *     // `WithFieldValue<PostDbModel>`. This type checking prevents the caller
   *     // from specifying objects with incorrect properties or property values.
   *     // @ts-expect-error "Argument of type { title: string; } is not
   *     // assignable to parameter of type WithFieldValue<PostDbModel>"
   *     await documentRef.update({ title: 'New Title' });
   *     const snapshot2: DocumentSnapshot<Post> = await documentRef.get();
   *     const post2: Post = snapshot2.data()!;
   *     if (post2) {
   *         assertEqual(post2.title, 'My Life');
   *         assertEqual(post2.author, 'NewFirstName Bar');
   *     }
   * }
   */
  export interface FirestoreDataConverter<
    AppModelType,
    DbModelType extends DocumentData = DocumentData,
  > {
    /**
     * Called by the Firestore SDK to convert a custom model object of type
     * `AppModelType` into a plain Javascript object (suitable for writing
     * directly to the Firestore database) of type `DbModelType`.
     *
     * To use set() with `merge` and `mergeFields`,
     * toFirestore() must be defined with `Partial<T>`.
     *
     * The `WithFieldValue<T>` type extends `T` to also allow FieldValues such
     * as `FieldValue.delete()` to be used as property values.
     */
    toFirestore(
      modelObject: WithFieldValue<AppModelType>
    ): WithFieldValue<DbModelType>;

    /**
     * Called by the Firestore SDK to convert a custom model object of type
     * `AppModelType` into a plain Javascript object (suitable for writing
     * directly to the Firestore database) of type `DbModelType`.
     *
     * To use set() with `merge` and `mergeFields`,
     * toFirestore() must be defined with `Partial<T>`.
     *
     * The `PartialWithFieldValue<T>` type extends `Partial<T>` to allow
     * FieldValues such as `FieldValue.delete()` to be used as property values.
     * It also supports nested `Partial` by allowing nested fields to be
     * omitted.
     */
    toFirestore(
      modelObject: PartialWithFieldValue<AppModelType>,
      options: SetOptions
    ): PartialWithFieldValue<DbModelType>;

    /**
     * Called by the Firestore SDK to convert Firestore data into an object of
     * type `AppModelType`. You can access your data by calling:
     * `snapshot.data()`.
     *
     * Generally, the data returned from `snapshot.data()` can be cast to
     * `DbModelType`; however, this is not guaranteed because Firestore does not
     * enforce a schema on the database. For example, writes from a previous
     * version of the application or writes from another client that did not use
     * a type converter could have written data with different properties and/or
     * property types. The implementation will need to choose whether to
     * gracefully recover from non-conforming data or throw an error.
     */
    fromFirestore(snapshot: QueryDocumentSnapshot): AppModelType;
  }

  export interface FirestorePipelineConverter<AppModelType> {
    fromFirestore(result: PipelineResult): AppModelType;
  }

  /**
   * Settings used to directly configure a `Firestore` instance.
   */
  export interface Settings {
    /**
     * The project ID from the Google Developer's Console, e.g.
     * 'grape-spaceship-123'. We will also check the environment variable
     * GCLOUD_PROJECT for your project ID.  Can be omitted in environments that
     * support {@link https://cloud.google.com/docs/authentication Application
     * Default Credentials}
     */
    projectId?: string;

    /**
     * The database name. If omitted, the default database will be used.
     */
    databaseId?: string;

    /** The hostname to connect to. */
    host?: string;

    /** The port to connect to. */
    port?: number;

    /**
     * Local file containing the Service Account credentials as downloaded from
     * the Google Developers Console. Can  be omitted in environments that
     * support {@link https://cloud.google.com/docs/authentication Application
     * Default Credentials}. To configure Firestore with custom credentials, use
     * the `credentials` property to provide the `client_email` and
     * `private_key` of your service account.
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

    /**
     * Whether to use `BigInt` for integer types when deserializing Firestore
     * Documents. Regardless of magnitude, all integer values are returned as
     * `BigInt` to match the precision of the Firestore backend. Floating point
     * numbers continue to use JavaScript's `number` type.
     */
    useBigInt?: boolean;

    /**
     * Whether to skip nested properties that are set to `undefined` during
     * object serialization. If set to `true`, these properties are skipped
     * and not written to Firestore. If set `false` or omitted, the SDK throws
     * an exception when it encounters properties of type `undefined`.
     */
    ignoreUndefinedProperties?: boolean;

    /**
     * Whether to force the use of HTTP/1.1 REST transport until a method that requires gRPC
     * is called. When a method requires gRPC, this Firestore client will load dependent gRPC
     * libraries and then use gRPC transport for communication from that point forward.
     * Currently the only operation that requires gRPC is creating a snapshot listener with
     * the method `DocumentReference<T>.onSnapshot()`, `CollectionReference<T>.onSnapshot()`,
     * or `Query<T>.onSnapshot()`.
     */
    preferRest?: boolean;

    [key: string]: any; // Accept other properties, such as GRPC settings.
  }

  /** Options to configure a read-only transaction. */
  export interface ReadOnlyTransactionOptions {
    /** Set to true to indicate a read-only transaction. */
    readOnly: true;
    /**
     * If specified, documents are read at the given time. This may not be more
     * than 60 seconds in the past from when the request is processed by the
     * server.
     */
    readTime?: Timestamp;
  }

  /** Options to configure a read-write transaction. */
  export interface ReadWriteTransactionOptions {
    /** Set to false or omit to indicate a read-write transaction. */
    readOnly?: false;
    /**
     * The maximum number of attempts for this transaction. Defaults to 5.
     */
    maxAttempts?: number;
  }

  /**
   * `Firestore` represents a Firestore Database and is the entry point for all
   * Firestore operations.
   */
  export class Firestore {
    /**
     * @param settings Configuration object. See [Firestore Documentation]
     * {@link https://firebase.google.com/docs/firestore/}
     */
    public constructor(settings?: Settings);

    /**
     * Specifies custom settings to be used to configure the `Firestore`
     * instance. Can only be invoked once and before any other Firestore
     * method.
     *
     * If settings are provided via both `settings()` and the `Firestore`
     * constructor, both settings objects are merged and any settings provided
     * via `settings()` take precedence.
     *
     * @param {object} settings The settings to use for all Firestore
     * operations.
     */
    settings(settings: Settings): void;

    /**
     * Returns the Database ID for this Firestore instance.
     */
    get databaseId(): string;

    /**
     * Gets a `CollectionReference` instance that refers to the collection at
     * the specified path.
     *
     * @param collectionPath A slash-separated path to a collection.
     * @return The `CollectionReference` instance.
     */
    collection(collectionPath: string): CollectionReference;

    /**
     * Gets a `DocumentReference` instance that refers to the document at the
     * specified path.
     *
     * @param documentPath A slash-separated path to a document.
     * @return The `DocumentReference` instance.
     */
    doc(documentPath: string): DocumentReference;

    /**
     * Creates and returns a new Query that includes all documents in the
     * database that are contained in a collection or subcollection with the
     * given collectionId.
     *
     * @param collectionId Identifies the collections to query over. Every
     * collection or subcollection with this ID as the last segment of its path
     * will be included. Cannot contain a slash.
     * @return The created `CollectionGroup`.
     */
    collectionGroup(collectionId: string): CollectionGroup;

    pipeline(): PipelineSource;

    /**
     * Retrieves multiple documents from Firestore.
     *
     * The first argument is required and must be of type `DocumentReference`
     * followed by any additional `DocumentReference` documents. If used, the
     * optional `ReadOptions` must be the last argument.
     *
     * @param {Array.<DocumentReference|ReadOptions>} documentRefsOrReadOptions
     * The `DocumentReferences` to receive, followed by an optional field
     * mask.
     * @return A Promise that resolves with an array of resulting document
     * snapshots.
     */
    getAll(
      ...documentRefsOrReadOptions: Array<DocumentReference | ReadOptions>
    ): Promise<Array<DocumentSnapshot>>;

    /**
     * Recursively deletes all documents and subcollections at and under the
     * specified level.
     *
     * If any delete fails, the promise is rejected with an error message
     * containing the number of failed deletes and the stack trace of the last
     * failed delete. The provided reference is deleted regardless of whether
     * all deletes succeeded.
     *
     * `recursiveDelete()` uses a BulkWriter instance with default settings to
     * perform the deletes. To customize throttling rates or add success/error
     * callbacks, pass in a custom BulkWriter instance.
     *
     * @param ref The reference of a document or collection to delete.
     * @param bulkWriter A custom BulkWriter instance used to perform the
     * deletes.
     * @return A promise that resolves when all deletes have been performed.
     * The promise is rejected if any of the deletes fail.
     *
     * @example
     * // Recursively delete a reference and log the references of failures.
     * const bulkWriter = firestore.bulkWriter();
     * bulkWriter
     *   .onWriteError((error) => {
     *     if (
     *       error.failedAttempts < MAX_RETRY_ATTEMPTS
     *     ) {
     *       return true;
     *     } else {
     *       console.log('Failed write at document: ', error.documentRef.path);
     *       return false;
     *     }
     *   });
     * await firestore.recursiveDelete(docRef, bulkWriter);
     */
    recursiveDelete(
      ref: CollectionReference<any, any> | DocumentReference<any, any>,
      bulkWriter?: BulkWriter
    ): Promise<void>;

    /**
     * Terminates the Firestore client and closes all open streams.
     *
     * @return A Promise that resolves when the client is terminated.
     */
    terminate(): Promise<void>;

    /**
     * Fetches the root collections that are associated with this Firestore
     * database.
     *
     * @returns A Promise that resolves with an array of CollectionReferences.
     */
    listCollections(): Promise<Array<CollectionReference>>;

    /**
     * Executes the given updateFunction and commits the changes applied within
     * the transaction.
     *
     * You can use the transaction object passed to 'updateFunction' to read and
     * modify Firestore documents under lock. You have to perform all reads
     * before you perform any write.
     *
     * Transactions can be performed as read-only or read-write transactions. By
     * default, transactions are executed in read-write mode.
     *
     * A read-write transaction obtains a pessimistic lock on all documents that
     * are read during the transaction. These locks block other transactions,
     * batched writes, and other non-transactional writes from changing that
     * document. Any writes in a read-write transactions are committed once
     * 'updateFunction' resolves, which also releases all locks.
     *
     * If a read-write transaction fails with contention, the transaction is
     * retried up to five times. The `updateFunction` is invoked once for each
     * attempt.
     *
     * Read-only transactions do not lock documents. They can be used to read
     * documents at a consistent snapshot in time, which may be up to 60 seconds
     * in the past. Read-only transactions are not retried.
     *
     * Transactions time out after 60 seconds if no documents are read.
     * Transactions that are not committed within than 270 seconds are also
     * aborted. Any remaining locks are released when a transaction times out.
     *
     * @param updateFunction The function to execute within the transaction
     * context.
     * @param transactionOptions Transaction options.
     * @return If the transaction completed successfully or was explicitly
     * aborted (by the updateFunction returning a failed Promise), the Promise
     * returned by the updateFunction will be returned here. Else if the
     * transaction failed, a rejected Promise with the corresponding failure
     * error will be returned.
     */
    runTransaction<T>(
      updateFunction: (transaction: Transaction) => Promise<T>,
      transactionOptions?:
        | ReadWriteTransactionOptions
        | ReadOnlyTransactionOptions
    ): Promise<T>;

    /**
     * Creates a write batch, used for performing multiple writes as a single
     * atomic operation.
     */
    batch(): WriteBatch;

    /**
     * Creates a [BulkWriter]{@link BulkWriter}, used for performing
     * multiple writes in parallel. Gradually ramps up writes as specified
     * by the 500/50/5 rule.
     *
     * @see https://firebase.google.com/docs/firestore/best-practices#ramping_up_traffic
     *
     * @param options An options object used to configure the throttling
     * behavior for the underlying BulkWriter.
     */
    bulkWriter(options?: BulkWriterOptions): BulkWriter;

    /**
     * Creates a new `BundleBuilder` instance to package selected Firestore data into
     * a bundle.
     *
     * @param bundleId The ID of the bundle. When loaded on clients, client SDKs use this ID
     * and the timestamp associated with the bundle to tell if it has been loaded already.
     * If not specified, a random identifier will be used.
     *
     *
     * @example
     * const bundle = firestore.bundle('data-bundle');
     * const docSnapshot = await firestore.doc('abc/123').get();
     * const querySnapshot = await firestore.collection('coll').get();
     *
     * const bundleBuffer = bundle.add(docSnapshot); // Add a document
     *                            .add('coll-query', querySnapshot) // Add a named query.
     *                            .build()
     * // Save `bundleBuffer` to CDN or stream it to clients.
     */
    bundle(bundleId?: string): BundleBuilder;
  }

  /**
   * An immutable object representing a geo point in Firestore. The geo point
   * is represented as latitude/longitude pair.
   *
   * Latitude values are in the range of [-90, 90].
   * Longitude values are in the range of [-180, 180].
   */
  export class GeoPoint {
    /**
     * Creates a new immutable GeoPoint object with the provided latitude and
     * longitude values.
     * @param latitude The latitude as number between -90 and 90.
     * @param longitude The longitude as number between -180 and 180.
     */
    constructor(latitude: number, longitude: number);

    readonly latitude: number;
    readonly longitude: number;

    /**
     * Returns true if this `GeoPoint` is equal to the provided one.
     *
     * @param other The `GeoPoint` to compare against.
     * @return true if this `GeoPoint` is equal to the provided one.
     */
    isEqual(other: GeoPoint): boolean;
  }

  /**
   * A reference to a transaction.
   * The `Transaction` object passed to a transaction's updateFunction provides
   * the methods to read and write data within the transaction context. See
   * `Firestore.runTransaction()`.
   */
  export class Transaction {
    private constructor();

    /**
     * Retrieves a query result. Holds a pessimistic lock on all returned
     * documents.
     *
     * @param query A query to execute.
     * @return A QuerySnapshot for the retrieved data.
     */
    get<AppModelType, DbModelType extends DocumentData>(
      query: Query<AppModelType, DbModelType>
    ): Promise<QuerySnapshot<AppModelType, DbModelType>>;

    /**
     * Reads the document referenced by the provided `DocumentReference.`
     * Holds a pessimistic lock on the returned document.
     *
     * @param documentRef A reference to the document to be read.
     * @return A DocumentSnapshot for the read data.
     */
    get<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>
    ): Promise<DocumentSnapshot<AppModelType, DbModelType>>;

    /**
     * Retrieves an aggregate query result. Holds a pessimistic lock on all
     * documents that were matched by the underlying query.
     *
     * @param aggregateQuery An aggregate query to execute.
     * @return An AggregateQuerySnapshot for the retrieved data.
     */
    get<
      AppModelType,
      DbModelType extends DocumentData,
      AggregateSpecType extends AggregateSpec,
    >(
      aggregateQuery: AggregateQuery<
        AggregateSpecType,
        AppModelType,
        DbModelType
      >
    ): Promise<
      AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
    >;

    /**
     * Retrieves multiple documents from Firestore. Holds a pessimistic lock on
     * all returned documents.
     *
     * The first argument is required and must be of type `DocumentReference`
     * followed by any additional `DocumentReference` documents. If used, the
     * optional `ReadOptions` must be the last argument.
     *
     * @param {Array.<DocumentReference|ReadOptions>} documentRefsOrReadOptions
     * The `DocumentReferences` to receive, followed by an optional field
     * mask.
     * @return A Promise that resolves with an array of resulting document
     * snapshots.
     */
    getAll<AppModelType, DbModelType extends DocumentData>(
      ...documentRefsOrReadOptions: Array<
        DocumentReference<AppModelType, DbModelType> | ReadOptions
      >
    ): Promise<Array<DocumentSnapshot<AppModelType, DbModelType>>>;

    /**
     * @beta
     *
     * Executes this pipeline and returns a Promise to represent the asynchronous operation.
     *
     * <p>The returned Promise can be used to track the progress of the pipeline execution
     * and retrieve the results (or handle any errors) asynchronously.
     *
     * <p>The pipeline results are returned as a list of {@link PipelineResult} objects. Each {@link
     * PipelineResult} typically represents a single key/value map that has passed through all the
     * stages of the pipeline, however this might differ depending on the stages involved in the
     * pipeline. For example:
     *
     * <ul>
     *   <li>If there are no stages or only transformation stages, each {@link PipelineResult}
     *       represents a single document.</li>
     *   <li>If there is an aggregation, only a single {@link PipelineResult} is returned,
     *       representing the aggregated results over the entire dataset .</li>
     *   <li>If there is an aggregation stage with grouping, each {@link PipelineResult} represents a
     *       distinct group and its associated aggregated values.</li>
     * </ul>
     *
     * <p>Example:
     *
     * ```typescript
     * const futureResults = await transaction
     *   .execute(
     *     firestore.pipeline().collection("books")
     *       .where(gt(Field.of("rating"), 4.5))
     *       .select("title", "author", "rating"));
     * ```
     *
     * @return A Promise representing the asynchronous pipeline execution.
     */
    execute<AppModelType>(
      pipeline: Pipeline<AppModelType>
    ): Promise<Array<PipelineResult<AppModelType>>>;

    /**
     * Create the document referred to by the provided `DocumentReference`.
     * The operation will fail the transaction if a document exists at the
     * specified location.
     *
     * @param documentRef A reference to the document to be create.
     * @param data The object data to serialize as the document.
     * @throws Error If the provided input is not a valid Firestore document.
     * @return This `Transaction` instance. Used for chaining method calls.
     */
    create<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: WithFieldValue<AppModelType>
    ): Transaction;

    /**
     * Writes to the document referred to by the provided `DocumentReference`.
     * If the document does not exist yet, it will be created. If you pass
     * `SetOptions`, the provided data can be merged into the existing document.
     *
     * @param documentRef A reference to the document to be set.
     * @param data An object of the fields and values for the document.
     * @param options An object to configure the set behavior.
     * @param  options.merge - If true, set() merges the values specified in its
     * data argument. Fields omitted from this set() call remain untouched. If
     * your input sets any field to an empty map, all nested fields are
     * overwritten.
     * @param options.mergeFields - If provided, set() only replaces the
     * specified field paths. Any field path that is not specified is ignored
     * and remains untouched. If your input sets any field to an empty map, all
     * nested fields are overwritten.
     * @throws Error If the provided input is not a valid Firestore document.
     * @return This `Transaction` instance. Used for chaining method calls.
     */
    set<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: PartialWithFieldValue<AppModelType>,
      options: SetOptions
    ): Transaction;
    set<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: WithFieldValue<AppModelType>
    ): Transaction;

    /**
     * Updates fields in the document referred to by the provided
     * `DocumentReference`. The update will fail if applied to a document that
     * does not exist.
     *
     * Nested fields can be updated by providing dot-separated field path
     * strings.
     *
     * @param documentRef A reference to the document to be updated.
     * @param data An object containing the fields and values with which to
     * update the document.
     * @param precondition A Precondition to enforce on this update.
     * @throws Error If the provided input is not valid Firestore data.
     * @return This `Transaction` instance. Used for chaining method calls.
     */
    update<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: UpdateData<DbModelType>,
      precondition?: Precondition
    ): Transaction;

    /**
     * Updates fields in the document referred to by the provided
     * `DocumentReference`. The update will fail if applied to a document that
     * does not exist.
     *
     * Nested fields can be updated by providing dot-separated field path
     * strings or by providing FieldPath objects.
     *
     * A `Precondition` restricting this update can be specified as the last
     * argument.
     *
     * @param documentRef A reference to the document to be updated.
     * @param field The first field to update.
     * @param value The first value
     * @param fieldsOrPrecondition An alternating list of field paths and values
     * to update, optionally followed by a `Precondition` to enforce on this
     * update.
     * @throws Error If the provided input is not valid Firestore data.
     * @return This `Transaction` instance. Used for chaining method calls.
     */
    update(
      documentRef: DocumentReference<any, any>,
      field: string | FieldPath,
      value: any,
      ...fieldsOrPrecondition: any[]
    ): Transaction;

    /**
     * Deletes the document referred to by the provided `DocumentReference`.
     *
     * @param documentRef A reference to the document to be deleted.
     * @param precondition A Precondition to enforce for this delete.
     * @return This `Transaction` instance. Used for chaining method calls.
     */
    delete(
      documentRef: DocumentReference<any, any>,
      precondition?: Precondition
    ): Transaction;
  }

  /**
   * A Firestore BulkWriter than can be used to perform a large number of writes
   * in parallel. Writes to the same document will be executed sequentially.
   *
   * @class
   */
  export class BulkWriter {
    private constructor();

    /**
     * Create a document with the provided data. This single operation will fail
     * if a document exists at its location.
     *
     * @param documentRef A reference to the document to be
     * created.
     * @param data The object to serialize as the document.
     * @throws Error If the provided input is not a valid Firestore document.
     * @returns A promise that resolves with the result of the write. If the
     * write fails, the promise is rejected with a
     * [BulkWriterError]{@link BulkWriterError}.
     */
    create<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: WithFieldValue<AppModelType>
    ): Promise<WriteResult>;

    /**
     * Delete a document from the database.
     *
     * @param documentRef A reference to the document to be
     * deleted.
     * @param precondition A precondition to enforce for this
     * delete.
     * @param precondition.lastUpdateTime If set, enforces that the
     * document was last updated at lastUpdateTime. Fails the batch if the
     * document doesn't exist or was last updated at a different time.
     * @param precondition.exists If set, enforces that the target document
     * must or must not exist.
     * @returns A promise that resolves with the result of the delete. If the
     * delete fails, the promise is rejected with a
     * [BulkWriterError]{@link BulkWriterError}.
     */
    delete(
      documentRef: DocumentReference<any, any>,
      precondition?: Precondition
    ): Promise<WriteResult>;

    /**
     * Write to the document referred to by the provided
     * [DocumentReference]{@link DocumentReference}. If the document does not
     * exist yet, it will be created. If you pass
     * [SetOptions]{@link SetOptions}., the provided data can be merged into the
     * existing document.
     *
     * @param  documentRef A reference to the document to be
     * set.
     * @param data The object to serialize as the document.
     * @param options An object to configure the set behavior.
     * @param  options.merge - If true, set() merges the values specified in its
     * data argument. Fields omitted from this set() call remain untouched. If
     * your input sets any field to an empty map, all nested fields are
     * overwritten.
     * @param options.mergeFields - If provided, set() only replaces the
     * specified field paths. Any field path that is not specified is ignored
     * and remains untouched. If your input sets any field to an empty map, all
     * nested fields are overwritten.
     * @throws Error If the provided input is not a valid Firestore document.
     * @returns A promise that resolves with the result of the write. If the
     * write fails, the promise is rejected with a
     * [BulkWriterError]{@link BulkWriterError}.
     */
    set<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: PartialWithFieldValue<AppModelType>,
      options: SetOptions
    ): Promise<WriteResult>;
    set<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: WithFieldValue<AppModelType>
    ): Promise<WriteResult>;

    /**
     * Update fields of the document referred to by the provided
     * [DocumentReference]{@link DocumentReference}. If the document doesn't yet
     * exist, the update fails and the entire batch will be rejected.
     *
     * The update() method accepts either an object with field paths encoded as
     * keys and field values encoded as values, or a variable number of
     * arguments that alternate between field paths and field values. Nested
     * fields can be updated by providing dot-separated field path strings or by
     * providing FieldPath objects.
     *
     *
     * A Precondition restricting this update can be specified as the last
     * argument.
     *
     * @param documentRef A reference to the document to be updated.
     * @param data An object containing the fields and values with which to
     * update the document.
     * @param precondition A Precondition to enforce on this update.
     * @throws Error If the provided input is not valid Firestore data.
     * @returns A promise that resolves with the result of the write. If the
     * write fails, the promise is rejected with a
     * [BulkWriterError]{@link BulkWriterError}.
     */
    update<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: UpdateData<DbModelType>,
      precondition?: Precondition
    ): Promise<WriteResult>;

    /**
     * Update fields of the document referred to by the provided
     * [DocumentReference]{@link DocumentReference}. If the document doesn't yet
     * exist, the update fails and the entire batch will be rejected.
     *
     * The update() method accepts either an object with field paths encoded as
     * keys and field values encoded as values, or a variable number of
     * arguments that alternate between field paths and field values. Nested
     * fields can be updated by providing dot-separated field path strings or by
     * providing FieldPath objects.
     *
     *
     * A Precondition restricting this update can be specified as the last
     * argument.
     *
     * @param documentRef A reference to the document to be updated.
     * @param field The first field to update.
     * @param value The first value
     * @param fieldsOrPrecondition An alternating list of field paths and values
     * to update, optionally followed a `Precondition` to enforce on this
     * update.
     * @throws Error If the provided input is not valid Firestore data;
     * @returns A promise that resolves with the result of the write. If the
     * write fails, the promise is rejected with a
     * [BulkWriterError]{@link BulkWriterError}.
     */
    update(
      documentRef: DocumentReference<any, any>,
      field: string | FieldPath,
      value: any,
      ...fieldsOrPrecondition: any[]
    ): Promise<WriteResult>;

    /**
     * Attaches a listener that is run every time a BulkWriter operation
     * successfully completes.
     *
     * @param callback A callback to be called every time a BulkWriter operation
     * successfully completes.
     */
    onWriteResult(
      callback: (
        documentRef: DocumentReference<any, any>,
        result: WriteResult
      ) => void
    ): void;

    /**
     * Attaches an error handler listener that is run every time a BulkWriter
     * operation fails.
     *
     * BulkWriter has a default error handler that retries UNAVAILABLE and
     * ABORTED errors up to a maximum of 10 failed attempts. When an error
     * handler is specified, the default error handler will be overwritten.
     *
     * @param shouldRetryCallback A callback to be called every time a BulkWriter
     * operation fails. Returning `true` will retry the operation. Returning
     * `false` will stop the retry loop.
     */
    onWriteError(
      shouldRetryCallback: (error: BulkWriterError) => boolean
    ): void;

    /**
     * Commits all writes that have been enqueued up to this point in parallel.
     *
     * Returns a Promise that resolves when all currently queued operations have
     * been committed. The Promise will never be rejected since the results for
     * each individual operation are conveyed via their individual Promises.
     *
     * The Promise resolves immediately if there are no pending writes.
     * Otherwise, the Promise waits for all previously issued writes, but it
     * does not wait for writes that were added after the method is called. If
     * you want to wait for additional writes, call `flush()` again.
     *
     * @return A promise that resolves when all enqueued writes
     * up to this point have been committed.
     */
    flush(): Promise<void>;

    /**
     * Commits all enqueued writes and marks the BulkWriter instance as closed.
     *
     * After calling `close()`, calling any method will throw an error. Any
     * retries scheduled as part of an `onWriteError()` handler will be run
     * before the `close()` promise resolves.
     *
     * Returns a Promise that resolves when all writes have been committed. The
     * Promise will never be rejected. Calling this method will send all
     * requests. The promise resolves immediately if there are no pending
     * writes.
     *
     * @return A promise that resolves when all enqueued writes
     * up to this point have been committed.
     */
    close(): Promise<void>;
  }

  /**
   * An options object to configure throttling on BulkWriter.
   */
  export interface BulkWriterOptions {
    /**
     * Whether to disable or configure throttling. By default, throttling is
     * enabled. This field can be set to either a boolean or a config
     * object. Setting it to `true` will use default values. You can override
     * the defaults by setting it to `false` to disable throttling, or by
     * setting the config values to enable throttling with the provided values.
     *
     * @see https://firebase.google.com/docs/firestore/best-practices#ramping_up_traffic
     *
     * @param initialOpsPerSecond The initial maximum number of operations per
     * second allowed by the throttler. If this field is not set, the default
     * is 500 operations per second.
     * @param maxOpsPerSecond The maximum number of operations per second
     * allowed by the throttler. If this field is set, the throttler's allowed
     * operations per second does not ramp up past the specified operations per
     * second.
     */
    readonly throttling?:
      | boolean
      | {initialOpsPerSecond?: number; maxOpsPerSecond?: number};
  }

  /**
   * The error thrown when a BulkWriter operation fails.
   */
  export class BulkWriterError extends Error {
    /** The status code of the error. */
    readonly code: GrpcStatus;

    /** The error message of the error. */
    readonly message: string;

    /** The document reference the operation was performed on. */
    readonly documentRef: DocumentReference<any, any>;

    /** The type of operation performed. */
    readonly operationType: 'create' | 'set' | 'update' | 'delete';

    /** How many times this operation has been attempted unsuccessfully. */
    readonly failedAttempts: number;
  }

  /**
   * A write batch, used to perform multiple writes as a single atomic unit.
   *
   * A `WriteBatch` object can be acquired by calling `Firestore.batch()`. It
   * provides methods for adding writes to the write batch. None of the
   * writes will be committed (or visible locally) until `WriteBatch.commit()`
   * is called.
   *
   * Unlike transactions, write batches are persisted offline and therefore are
   * preferable when you don't need to condition your writes on read data.
   */
  export class WriteBatch {
    private constructor();

    /**
     * Create the document referred to by the provided `DocumentReference`. The
     * operation will fail the batch if a document exists at the specified
     * location.
     *
     * @param documentRef A reference to the document to be created.
     * @param data The object data to serialize as the document.
     * @throws Error If the provided input is not a valid Firestore document.
     * @return This `WriteBatch` instance. Used for chaining method calls.
     */
    create<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: WithFieldValue<AppModelType>
    ): WriteBatch;

    /**
     * Write to the document referred to by the provided `DocumentReference`.
     * If the document does not exist yet, it will be created. If you pass
     * `SetOptions`, the provided data can be merged into the existing document.
     *
     * @param documentRef A reference to the document to be set.
     * @param data An object of the fields and values for the document.
     * @param options An object to configure the set behavior.
     * @param  options.merge - If true, set() merges the values specified in its
     * data argument. Fields omitted from this set() call remain untouched. If
     * your input sets any field to an empty map, all nested fields are
     * overwritten.
     * @param options.mergeFields - If provided, set() only replaces the
     * specified field paths. Any field path that is not specified is ignored
     * and remains untouched. If your input sets any field to an empty map, all
     * nested fields are overwritten.
     * @throws Error If the provided input is not a valid Firestore document.
     * @return This `WriteBatch` instance. Used for chaining method calls.
     */
    set<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: PartialWithFieldValue<AppModelType>,
      options: SetOptions
    ): WriteBatch;
    set<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: WithFieldValue<AppModelType>
    ): WriteBatch;

    /**
     * Update fields of the document referred to by the provided
     * `DocumentReference`. If the document doesn't yet exist, the update fails
     * and the entire batch will be rejected.
     *
     * Nested fields can be updated by providing dot-separated field path
     * strings.
     *
     * @param documentRef A reference to the document to be updated.
     * @param data An object containing the fields and values with which to
     * update the document.
     * @param precondition A Precondition to enforce on this update.
     * @throws Error If the provided input is not valid Firestore data.
     * @return This `WriteBatch` instance. Used for chaining method calls.
     */
    update<AppModelType, DbModelType extends DocumentData>(
      documentRef: DocumentReference<AppModelType, DbModelType>,
      data: UpdateData<DbModelType>,
      precondition?: Precondition
    ): WriteBatch;

    /**
     * Updates fields in the document referred to by the provided
     * `DocumentReference`. The update will fail if applied to a document that
     * does not exist.
     *
     * Nested fields can be updated by providing dot-separated field path
     * strings or by providing FieldPath objects.
     *
     * A `Precondition` restricting this update can be specified as the last
     * argument.
     *
     * @param documentRef A reference to the document to be updated.
     * @param field The first field to update.
     * @param value The first value
     * @param fieldsOrPrecondition An alternating list of field paths and values
     * to update, optionally followed a `Precondition` to enforce on this
     * update.
     * @throws Error If the provided input is not valid Firestore data.
     * @return This `WriteBatch` instance. Used for chaining method calls.
     */
    update(
      documentRef: DocumentReference<any, any>,
      field: string | FieldPath,
      value: any,
      ...fieldsOrPrecondition: any[]
    ): WriteBatch;

    /**
     * Deletes the document referred to by the provided `DocumentReference`.
     *
     * @param documentRef A reference to the document to be deleted.
     * @param precondition A Precondition to enforce for this delete.
     * @return This `WriteBatch` instance. Used for chaining method calls.
     */
    delete(
      documentRef: DocumentReference<any, any>,
      precondition?: Precondition
    ): WriteBatch;

    /**
     * Commits all of the writes in this write batch as a single atomic unit.
     *
     * @return A Promise resolved once all of the writes in the batch have been
     * successfully written to the backend as an atomic unit.
     */
    commit(): Promise<WriteResult[]>;
  }

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

    /**
     * If set, enforces that the target document must or must not exist.
     */
    readonly exists?: boolean;
  }

  /**
   * An options object that configures the behavior of `set()` calls in
   * `DocumentReference`, `WriteBatch` and `Transaction`. These calls can be
   * configured to perform granular merges instead of overwriting the target
   * documents in their entirety.
   *
   * @param merge Changes the behavior of a set() call to only replace the
   * values specified in its data argument. Fields omitted from the set() call
   * remain untouched. If your input sets any field to an empty map, all nested
   * fields are overwritten.
   *
   * @param mergeFields Changes the behavior of set() calls to only replace
   * the specified field paths. Any field path that is not specified is ignored
   * and remains untouched. If your input sets any field to an empty map, all
   * nested fields are overwritten.
   */
  export type SetOptions =
    | {
        readonly merge?: boolean;
      }
    | {
        readonly mergeFields?: Array<string | FieldPath>;
      };

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
     * contain values for all the fields in the mask to be part of the result
     * set.
     */
    readonly fieldMask?: (string | FieldPath)[];
  }

  /**
   * A WriteResult wraps the write time set by the Firestore servers on `sets()`,
   * `updates()`, and `creates()`.
   */
  export class WriteResult {
    private constructor();

    /**
     * The write time as set by the Firestore servers.
     */
    readonly writeTime: Timestamp;

    /**
     * Returns true if this `WriteResult` is equal to the provided one.
     *
     * @param other The `WriteResult` to compare against.
     * @return true if this `WriteResult` is equal to the provided one.
     */
    isEqual(other: WriteResult): boolean;
  }

  /**
   * A `DocumentReference` refers to a document location in a Firestore database
   * and can be used to write, read, or listen to the location. The document at
   * the referenced location may or may not exist. A `DocumentReference` can
   * also be used to create a `CollectionReference` to a subcollection.
   */
  export class DocumentReference<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    private constructor();

    /** The identifier of the document within its collection. */
    readonly id: string;

    /**
     * The `Firestore` for the Firestore database (useful for performing
     * transactions, etc.).
     */
    readonly firestore: Firestore;

    /**
     * A reference to the Collection to which this DocumentReference belongs.
     */
    readonly parent: CollectionReference<AppModelType, DbModelType>;

    /**
     * A string representing the path of the referenced document (relative
     * to the root of the database).
     */
    readonly path: string;

    /**
     * Gets a `CollectionReference` instance that refers to the collection at
     * the specified path.
     *
     * @param collectionPath A slash-separated path to a collection.
     * @return The `CollectionReference` instance.
     */
    collection(collectionPath: string): CollectionReference;

    /**
     * Fetches the subcollections that are direct children of this document.
     *
     * @returns A Promise that resolves with an array of CollectionReferences.
     */
    listCollections(): Promise<Array<CollectionReference>>;

    /**
     * Creates a document referred to by this `DocumentReference` with the
     * provided object values. The write fails if the document already exists
     *
     * @param data The object data to serialize as the document.
     * @throws {Error} If the provided input is not a valid Firestore document or if the document already exists.
     * @return A Promise resolved with the write time of this create.
     */
    create(data: WithFieldValue<AppModelType>): Promise<WriteResult>;

    /**
     * Writes to the document referred to by this `DocumentReference`. If the
     * document does not yet exist, it will be created. If you pass
     * `SetOptions`, the provided data can be merged into an existing document.
     *
     * @param data A map of the fields and values for the document.
     * @param options An object to configure the set behavior.
     * @param  options.merge - If true, set() merges the values specified in its
     * data argument. Fields omitted from this set() call remain untouched. If
     * your input sets any field to an empty map, all nested fields are
     * overwritten.
     * @param options.mergeFields - If provided, set() only replaces the
     * specified field paths. Any field path that is not specified is ignored
     * and remains untouched. If your input sets any field to an empty map, all
     * nested fields are overwritten.
     * @throws Error If the provided input is not a valid Firestore document.
     * @return A Promise resolved with the write time of this set.
     */
    set(
      data: PartialWithFieldValue<AppModelType>,
      options: SetOptions
    ): Promise<WriteResult>;
    set(data: WithFieldValue<AppModelType>): Promise<WriteResult>;

    /**
     * Updates fields in the document referred to by this `DocumentReference`.
     * The update will fail if applied to a document that does not exist.
     *
     * Nested fields can be updated by providing dot-separated field path
     * strings.
     *
     * @param data An object containing the fields and values with which to
     * update the document.
     * @param precondition A Precondition to enforce on this update.
     * @throws Error If the provided input is not valid Firestore data.
     * @return A Promise resolved with the write time of this update.
     */
    update(
      data: UpdateData<DbModelType>,
      precondition?: Precondition
    ): Promise<WriteResult>;

    /**
     * Updates fields in the document referred to by this `DocumentReference`.
     * The update will fail if applied to a document that does not exist.
     *
     * Nested fields can be updated by providing dot-separated field path
     * strings or by providing FieldPath objects.
     *
     * A `Precondition` restricting this update can be specified as the last
     * argument.
     *
     * @param field The first field to update.
     * @param value The first value.
     * @param moreFieldsOrPrecondition An alternating list of field paths and
     * values to update, optionally followed by a `Precondition` to enforce on
     * this update.
     * @throws Error If the provided input is not valid Firestore data.
     * @return A Promise resolved with the write time of this update.
     */
    update(
      field: string | FieldPath,
      value: any,
      ...moreFieldsOrPrecondition: any[]
    ): Promise<WriteResult>;

    /**
     * Deletes the document referred to by this `DocumentReference`.
     *
     * @param precondition A Precondition to enforce for this delete.
     * @return A Promise resolved with the write time of this delete.
     */
    delete(precondition?: Precondition): Promise<WriteResult>;

    /**
     * Reads the document referred to by this `DocumentReference`.
     *
     * @return A Promise resolved with a DocumentSnapshot containing the
     * current document contents.
     */
    get(): Promise<DocumentSnapshot<AppModelType, DbModelType>>;

    /**
     * Attaches a listener for DocumentSnapshot events.
     *
     * @param onNext A callback to be called every time a new `DocumentSnapshot`
     * is available.
     * @param onError A callback to be called if the listen fails or is
     * cancelled. No further callbacks will occur.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
      onNext: (snapshot: DocumentSnapshot<AppModelType, DbModelType>) => void,
      onError?: (error: Error) => void
    ): () => void;

    /**
     * Returns true if this `DocumentReference` is equal to the provided one.
     *
     * @param other The `DocumentReference` to compare against.
     * @return true if this `DocumentReference` is equal to the provided one.
     */
    isEqual(other: DocumentReference<AppModelType, DbModelType>): boolean;

    /**
     * Applies a custom data converter to this DocumentReference, allowing you
     * to use your own custom model objects with Firestore. When you call
     * set(), get(), etc. on the returned DocumentReference instance, the
     * provided converter will convert between Firestore data of type
     * `NewDbModelType` and your custom type `NewAppModelType`.
     *
     * @param converter Converts objects to and from Firestore. Passing in
     * `null` removes the current converter.
     * @return A DocumentReference<U> that uses the provided converter.
     */
    withConverter<
      NewAppModelType,
      NewDbModelType extends DocumentData = DocumentData,
    >(
      converter: FirestoreDataConverter<NewAppModelType, NewDbModelType>
    ): DocumentReference<NewAppModelType, NewDbModelType>;
    withConverter(converter: null): DocumentReference;
  }

  /**
   * A `DocumentSnapshot` contains data read from a document in your Firestore
   * database. The data can be extracted with `.data()` or `.get(<field>)` to
   * get a specific field.
   *
   * For a `DocumentSnapshot` that points to a non-existing document, any data
   * access will return 'undefined'. You can use the `exists` property to
   * explicitly verify a document's existence.
   */
  export class DocumentSnapshot<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    protected constructor();

    /** True if the document exists. */
    readonly exists: boolean;

    /** A `DocumentReference` to the document location. */
    readonly ref: DocumentReference<AppModelType, DbModelType>;

    /**
     * The ID of the document for which this `DocumentSnapshot` contains data.
     */
    readonly id: string;

    /**
     * The time the document was created. Not set for documents that don't
     * exist.
     */
    readonly createTime?: Timestamp;

    /**
     * The time the document was last updated (at the time the snapshot was
     * generated). Not set for documents that don't exist.
     */
    readonly updateTime?: Timestamp;

    /**
     * The time this snapshot was read.
     */
    readonly readTime: Timestamp;

    /**
     * Retrieves all fields in the document as an Object. Returns 'undefined' if
     * the document doesn't exist.
     *
     * @return An Object containing all fields in the document.
     */
    data(): AppModelType | undefined;

    /**
     * Retrieves the field specified by `fieldPath`.
     *
     * @param fieldPath The path (e.g. 'foo' or 'foo.bar') to a specific field.
     * @return The data at the specified field location or undefined if no such
     * field exists in the document.
     */
    get(fieldPath: string | FieldPath): any;

    /**
     * Returns true if the document's data and path in this `DocumentSnapshot`
     * is equal to the provided one.
     *
     * @param other The `DocumentSnapshot` to compare against.
     * @return true if this `DocumentSnapshot` is equal to the provided one.
     */
    isEqual(other: DocumentSnapshot<AppModelType, DbModelType>): boolean;
  }

  /**
   * A `QueryDocumentSnapshot` contains data read from a document in your
   * Firestore database as part of a query. The document is guaranteed to exist
   * and its data can be extracted with `.data()` or `.get(<field>)` to get a
   * specific field.
   *
   * A `QueryDocumentSnapshot` offers the same API surface as a
   * `DocumentSnapshot`. Since query results contain only existing documents, the
   * `exists` property will always be true and `data()` will never return
   * 'undefined'.
   */
  export class QueryDocumentSnapshot<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > extends DocumentSnapshot<AppModelType, DbModelType> {
    private constructor();

    /**
     * The time the document was created.
     */
    readonly createTime: Timestamp;

    /**
     * The time the document was last updated (at the time the snapshot was
     * generated).
     */
    readonly updateTime: Timestamp;

    /**
     * Retrieves all fields in the document as an Object.
     *
     * @override
     * @return An Object containing all fields in the document.
     */
    data(): AppModelType;
  }

  /**
   * The direction of a `Query.orderBy()` clause is specified as 'desc' or 'asc'
   * (descending or ascending).
   */
  export type OrderByDirection = 'desc' | 'asc';

  /**
   * Filter conditions in a `Query.where()` clause are specified using the
   * strings '<', '<=', '==', '!=', '>=', '>', 'array-contains', 'in', 'not-in',
   * and 'array-contains-any'.
   */
  export type WhereFilterOp =
    | '<'
    | '<='
    | '=='
    | '!='
    | '>='
    | '>'
    | 'array-contains'
    | 'in'
    | 'not-in'
    | 'array-contains-any';

  /**
   * A `Query` refers to a Query which you can read or listen to. You can also
   * construct refined `Query` objects by adding filters and ordering.
   */
  export class Query<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    protected constructor();

    /**
     * The `Firestore` for the Firestore database (useful for performing
     * transactions, etc.).
     */
    readonly firestore: Firestore;

    /**
     * Creates and returns a new Query with the additional filter that documents
     * must contain the specified field and that its value should satisfy the
     * relation constraint provided.
     *
     * This function returns a new (immutable) instance of the Query (rather
     * than modify the existing instance) to impose the filter.
     *
     * @param fieldPath The path to compare
     * @param opStr The operation string (e.g "<", "<=", "==", ">", ">=").
     * @param value The value for comparison
     * @return The created Query.
     */
    where(
      fieldPath: string | FieldPath,
      opStr: WhereFilterOp,
      value: any
    ): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new [Query]{@link Query} with the additional filter
     * that documents should satisfy the relation constraint provided. Documents
     * must contain the field specified in the filter.
     *
     * This function returns a new (immutable) instance of the Query (rather than
     * modify the existing instance) to impose the filter.
     *
     * @param {Filter} filter A filter to apply to the Query.
     * @returns {Query} The created Query.
     */
    where(filter: Filter): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that's additionally sorted by the
     * specified field, optionally in descending order instead of ascending.
     *
     * This function returns a new (immutable) instance of the Query (rather
     * than modify the existing instance) to impose the order.
     *
     * @param fieldPath The field to sort by.
     * @param directionStr Optional direction to sort by ('asc' or 'desc'). If
     * not specified, order will be ascending.
     * @return The created Query.
     */
    orderBy(
      fieldPath: string | FieldPath,
      directionStr?: OrderByDirection
    ): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that only returns the first matching
     * documents.
     *
     * This function returns a new (immutable) instance of the Query (rather
     * than modify the existing instance) to impose the limit.
     *
     * @param limit The maximum number of items to return.
     * @return The created Query.
     */
    limit(limit: number): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that only returns the last matching
     * documents.
     *
     * You must specify at least one orderBy clause for limitToLast queries,
     * otherwise an exception will be thrown during execution.
     *
     * Results for limitToLast queries cannot be streamed via the `stream()`
     * API.
     *
     * @param limit The maximum number of items to return.
     * @return The created Query.
     */
    limitToLast(limit: number): Query<AppModelType, DbModelType>;

    /**
     * Specifies the offset of the returned results.
     *
     * This function returns a new (immutable) instance of the Query (rather
     * than modify the existing instance) to impose the offset.
     *
     * @param offset The offset to apply to the Query results.
     * @return The created Query.
     */
    offset(offset: number): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query instance that applies a field mask to
     * the result and returns only the specified subset of fields. You can
     * specify a list of field paths to return, or use an empty list to only
     * return the references of matching documents.
     *
     * Queries that contain field masks cannot be listened to via `onSnapshot()`
     * listeners.
     *
     * This function returns a new (immutable) instance of the Query (rather
     * than modify the existing instance) to impose the field mask.
     *
     * @param field The field paths to return.
     * @return The created Query.
     */
    select(...field: (string | FieldPath)[]): Query;

    /**
     * Creates and returns a new Query that starts at the provided document
     * (inclusive). The starting position is relative to the order of the query.
     * The document must contain all of the fields provided in the orderBy of
     * this query.
     *
     * @param snapshot The snapshot of the document to start after.
     * @return The created Query.
     */
    startAt(
      snapshot: DocumentSnapshot<any, any>
    ): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that starts at the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to start this query at, in order
     * of the query's order by.
     * @return The created Query.
     */
    startAt(...fieldValues: any[]): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that starts after the provided document
     * (exclusive). The starting position is relative to the order of the query.
     * The document must contain all of the fields provided in the orderBy of
     * this query.
     *
     * @param snapshot The snapshot of the document to start after.
     * @return The created Query.
     */
    startAfter(
      snapshot: DocumentSnapshot<any, any>
    ): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that starts after the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to start this query after, in order
     * of the query's order by.
     * @return The created Query.
     */
    startAfter(...fieldValues: any[]): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that ends before the provided document
     * (exclusive). The end position is relative to the order of the query. The
     * document must contain all of the fields provided in the orderBy of this
     * query.
     *
     * @param snapshot The snapshot of the document to end before.
     * @return The created Query.
     */
    endBefore(
      snapshot: DocumentSnapshot<any, any>
    ): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that ends before the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to end this query before, in order
     * of the query's order by.
     * @return The created Query.
     */
    endBefore(...fieldValues: any[]): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that ends at the provided document
     * (inclusive). The end position is relative to the order of the query. The
     * document must contain all of the fields provided in the orderBy of this
     * query.
     *
     * @param snapshot The snapshot of the document to end at.
     * @return The created Query.
     */
    endAt(
      snapshot: DocumentSnapshot<any, any>
    ): Query<AppModelType, DbModelType>;

    /**
     * Creates and returns a new Query that ends at the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to end this query at, in order
     * of the query's order by.
     * @return The created Query.
     */
    endAt(...fieldValues: any[]): Query<AppModelType, DbModelType>;

    /**
     * Executes the query and returns the results as a `QuerySnapshot`.
     *
     * @return A Promise that will be resolved with the results of the Query.
     */
    get(): Promise<QuerySnapshot<AppModelType, DbModelType>>;

    /**
     * Plans and optionally executes this query. Returns a Promise that will be
     * resolved with the planner information, statistics from the query execution (if any),
     * and the query results (if any).
     *
     * @return A Promise that will be resolved with the planner information, statistics
     *  from the query execution (if any), and the query results (if any).
     */
    explain(
      options?: ExplainOptions
    ): Promise<ExplainResults<QuerySnapshot<AppModelType, DbModelType>>>;

    /**
     * Executes the query and returns the results as Node Stream.
     *
     * @return A stream of QueryDocumentSnapshot.
     */
    stream(): NodeJS.ReadableStream;

    /**
     * Plans and optionally executes this query, and streams the results as Node Stream
     * of `{document?: DocumentSnapshot, metrics?: ExplainMetrics}` objects.
     *
     * The stream surfaces documents one at a time as they are received from the
     * server, and at the end, it will surface the metrics associated with
     * executing the query (if any).
     *
     * @example
     * ```
     * let query = firestore.collection('col').where('foo', '==', 'bar');
     * let count = 0;
     *
     * query.explainStream({analyze: true}).on('data', (data) => {
     *   if (data.document) {
     *     // Use data.document which is a DocumentSnapshot instance.
     *     console.log(`Found document with name '${data.document.id}'`);
     *     ++count;
     *   }
     *   if (data.metrics) {
     *     // Use data.metrics which is an ExplainMetrics instance.
     *   }
     * }).on('end', () => {
     *   console.log(`Received ${count} documents.`);
     * });
     * ```
     *
     * @return A stream of `{document?: DocumentSnapshot, metrics?: ExplainMetrics}`
     * objects.
     */
    explainStream(options?: ExplainOptions): NodeJS.ReadableStream;

    /**
     * Attaches a listener for `QuerySnapshot `events.
     *
     * @param onNext A callback to be called every time a new `QuerySnapshot`
     * is available.
     * @param onError A callback to be called if the listen fails or is
     * cancelled. No further callbacks will occur.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
      onNext: (snapshot: QuerySnapshot<AppModelType, DbModelType>) => void,
      onError?: (error: Error) => void
    ): () => void;

    /**
     * Returns a query that counts the documents in the result set of this
     * query.
     *
     * The returned query, when executed, counts the documents in the result set
     * of this query without actually downloading the documents.
     *
     * Using the returned query to count the documents is efficient because only
     * the final count, not the documents' data, is downloaded. The returned
     * query can count the documents in cases where the result set is
     * prohibitively large to download entirely (thousands of documents).
     *
     * @return a query that counts the documents in the result set of this
     * query. The count can be retrieved from `snapshot.data().count`, where
     * `snapshot` is the `AggregateQuerySnapshot` resulting from running the
     * returned query.
     */
    count(): AggregateQuery<
      {count: AggregateField<number>},
      AppModelType,
      DbModelType
    >;

    /**
     * Returns a query that can perform the given aggregations.
     *
     * The returned query, when executed, calculates the specified aggregations
     * over the documents in the result set of this query without actually
     * downloading the documents.
     *
     * Using the returned query to perform aggregations is efficient because only
     * the final aggregation values, not the documents' data, is downloaded. The
     * returned query can perform aggregations of the documents in cases where
     * the result set is prohibitively large to download entirely (thousands of
     * documents).
     *
     * @param aggregateSpec An `AggregateSpec` object that specifies the aggregates
     * to perform over the result set. The AggregateSpec specifies aliases for each
     * aggregate, which can be used to retrieve the aggregate result.
     * @example
     * ```typescript
     * const aggregateQuery = col.aggregate(query, {
     *   countOfDocs: count(),
     *   totalHours: sum('hours'),
     *   averageScore: average('score')
     * });
     *
     * const aggregateSnapshot = await aggregateQuery.get();
     * const countOfDocs: number = aggregateSnapshot.data().countOfDocs;
     * const totalHours: number = aggregateSnapshot.data().totalHours;
     * const averageScore: number | null = aggregateSnapshot.data().averageScore;
     * ```
     */
    aggregate<T extends AggregateSpec>(
      aggregateSpec: T
    ): AggregateQuery<T, AppModelType, DbModelType>;

    /**
     * Returns a query that can perform vector distance (similarity) search with given parameters.
     *
     * The returned query, when executed, performs a distance (similarity) search on the specified
     * `vectorField` against the given `queryVector` and returns the top documents that are closest
     * to the `queryVector`.
     *
     * Only documents whose `vectorField` field is a `VectorValue` of the same dimension as `queryVector`
     * participate in the query, all other documents are ignored.
     *
     * @example
     * ```typescript
     * // Returns the closest 10 documents whose Euclidean distance from their 'embedding' fields are closed to [41, 42].
     * const vectorQuery = col.findNearest('embedding', [41, 42], {limit: 10, distanceMeasure: 'EUCLIDEAN'});
     *
     * const querySnapshot = await aggregateQuery.get();
     * querySnapshot.forEach(...);
     * ```
     *
     * @param vectorField The field path this vector query executes on.
     * @param queryVector The vector value used to measure the distance from `vectorField` values in the documents.
     * @param options Options control the vector query. `limit` specifies the upper bound of documents to return, must
     * be a positive integer with a maximum value of 1000. `distanceMeasure` specifies what type of distance is
     * calculated when performing the query.
     */
    findNearest(
      vectorField: string | FieldPath,
      queryVector: VectorValue | Array<number>,
      options: {
        limit: number;
        distanceMeasure: 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT';
      }
    ): VectorQuery<AppModelType, DbModelType>;

    /**
     * Returns true if this `Query` is equal to the provided one.
     *
     * @param other The `Query` to compare against.
     * @return true if this `Query` is equal to the provided one.
     */
    isEqual(other: Query<AppModelType, DbModelType>): boolean;

    /**
     * Applies a custom data converter to this Query, allowing you to use your
     * own custom model objects with Firestore. When you call get() on the
     * returned Query, the provided converter will convert between Firestore
     * data of type `NewDbModelType` and your custom type `NewAppModelType`.
     *
     * @param converter Converts objects to and from Firestore. Passing in
     * `null` removes the current converter.
     * @return A Query that uses the provided converter.
     */
    withConverter<
      NewAppModelType,
      NewDbModelType extends DocumentData = DocumentData,
    >(
      converter: FirestoreDataConverter<NewAppModelType, NewDbModelType>
    ): Query<NewAppModelType, NewDbModelType>;
    withConverter(converter: null): Query;
  }

  /**
   * A `QuerySnapshot` contains zero or more `QueryDocumentSnapshot` objects
   * representing the results of a query. The documents can be accessed as an
   * array via the `docs` property or enumerated using the `forEach` method. The
   * number of documents can be determined via the `empty` and `size`
   * properties.
   */
  export class QuerySnapshot<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    private constructor();

    /**
     * The query on which you called `get` or `onSnapshot` in order to get this
     * `QuerySnapshot`.
     */
    readonly query: Query<AppModelType, DbModelType>;

    /** An array of all the documents in the QuerySnapshot. */
    readonly docs: Array<QueryDocumentSnapshot<AppModelType, DbModelType>>;

    /** The number of documents in the QuerySnapshot. */
    readonly size: number;

    /** True if there are no documents in the QuerySnapshot. */
    readonly empty: boolean;

    /** The time this query snapshot was obtained. */
    readonly readTime: Timestamp;

    /**
     * Returns an array of the documents changes since the last snapshot. If
     * this is the first snapshot, all documents will be in the list as added
     * changes.
     */
    docChanges(): DocumentChange<AppModelType, DbModelType>[];

    /**
     * Enumerates all of the documents in the QuerySnapshot.
     *
     * @param callback A callback to be called with a `DocumentSnapshot` for
     * each document in the snapshot.
     * @param thisArg The `this` binding for the callback.
     */
    forEach(
      callback: (
        result: QueryDocumentSnapshot<AppModelType, DbModelType>
      ) => void,
      thisArg?: any
    ): void;

    /**
     * Returns true if the document data in this `QuerySnapshot` is equal to the
     * provided one.
     *
     * @param other The `QuerySnapshot` to compare against.
     * @return true if this `QuerySnapshot` is equal to the provided one.
     */
    isEqual(other: QuerySnapshot<AppModelType, DbModelType>): boolean;
  }

  /**
   * A `VectorQuerySnapshot` contains zero or more `QueryDocumentSnapshot` objects
   * representing the results of a query. The documents can be accessed as an
   * array via the `docs` property or enumerated using the `forEach` method. The
   * number of documents can be determined via the `empty` and `size`
   * properties.
   */
  export class VectorQuerySnapshot<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    private constructor();

    /**
     * The query on which you called `get` in order to get this
     * `VectorQuerySnapshot`.
     */
    readonly query: VectorQuery<AppModelType, DbModelType>;

    /** An array of all the documents in the QuerySnapshot. */
    readonly docs: Array<QueryDocumentSnapshot<AppModelType, DbModelType>>;

    /** The number of documents in the QuerySnapshot. */
    readonly size: number;

    /** True if there are no documents in the QuerySnapshot. */
    readonly empty: boolean;

    /** The time this query snapshot was obtained. */
    readonly readTime: Timestamp;

    /**
     * Returns an array of the documents changes since the last snapshot. If
     * this is the first snapshot, all documents will be in the list as added
     * changes.
     */
    docChanges(): DocumentChange<AppModelType, DbModelType>[];

    /**
     * Enumerates all of the documents in the QuerySnapshot.
     *
     * @param callback A callback to be called with a `DocumentSnapshot` for
     * each document in the snapshot.
     * @param thisArg The `this` binding for the callback.
     */
    forEach(
      callback: (
        result: QueryDocumentSnapshot<AppModelType, DbModelType>
      ) => void,
      thisArg?: any
    ): void;

    /**
     * Returns true if the document data in this `VectorQuerySnapshot` is equal to the
     * provided one.
     *
     * @param other The `VectorQuerySnapshot` to compare against.
     * @return true if this `VectorQuerySnapshot` is equal to the provided one.
     */
    isEqual(other: VectorQuerySnapshot<AppModelType, DbModelType>): boolean;
  }

  /**
   * The type of `DocumentChange` may be 'added', 'removed', or 'modified'.
   */
  export type DocumentChangeType = 'added' | 'removed' | 'modified';

  /**
   * A `DocumentChange` represents a change to the documents matching a query.
   * It contains the document affected and the type of change that occurred.
   */
  export interface DocumentChange<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    /** The type of change ('added', 'modified', or 'removed'). */
    readonly type: DocumentChangeType;

    /** The document affected by this change. */
    readonly doc: QueryDocumentSnapshot<AppModelType, DbModelType>;

    /**
     * The index of the changed document in the result set immediately prior to
     * this DocumentChange (i.e. supposing that all prior DocumentChange objects
     * have been applied). Is -1 for 'added' events.
     */
    readonly oldIndex: number;

    /**
     * The index of the changed document in the result set immediately after
     * this DocumentChange (i.e. supposing that all prior DocumentChange
     * objects and the current DocumentChange object have been applied).
     * Is -1 for 'removed' events.
     */
    readonly newIndex: number;

    /**
     * Returns true if the data in this `DocumentChange` is equal to the
     * provided one.
     *
     * @param other The `DocumentChange` to compare against.
     * @return true if this `DocumentChange` is equal to the provided one.
     */
    isEqual(other: DocumentChange<AppModelType, DbModelType>): boolean;
  }

  /**
   * A `CollectionReference` object can be used for adding documents, getting
   * document references, and querying for documents (using the methods
   * inherited from `Query`).
   */
  export class CollectionReference<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > extends Query<AppModelType, DbModelType> {
    private constructor();

    /** The identifier of the collection. */
    readonly id: string;

    /**
     * A reference to the containing Document if this is a subcollection, else
     * null.
     */
    readonly parent: DocumentReference | null;

    /**
     * A string representing the path of the referenced collection (relative
     * to the root of the database).
     */
    readonly path: string;

    /**
     * Retrieves the list of documents in this collection.
     *
     * The document references returned may include references to "missing
     * documents", i.e. document locations that have no document present but
     * which contain subcollections with documents. Attempting to read such a
     * document reference (e.g. via `.get()` or `.onSnapshot()`) will return a
     * `DocumentSnapshot` whose `.exists` property is false.
     *
     * @return {Promise<DocumentReference[]>} The list of documents in this
     * collection.
     */
    listDocuments(): Promise<
      Array<DocumentReference<AppModelType, DbModelType>>
    >;

    /**
     * Get a `DocumentReference` for a randomly-named document within this
     * collection. An automatically-generated unique ID will be used as the
     * document ID.
     *
     * @return The `DocumentReference` instance.
     */
    doc(): DocumentReference<AppModelType, DbModelType>;

    /**
     * Get a `DocumentReference` for the document within the collection at the
     * specified path.
     *
     * @param documentPath A slash-separated path to a document.
     * @return The `DocumentReference` instance.
     */
    doc(documentPath: string): DocumentReference<AppModelType, DbModelType>;

    /**
     * Add a new document to this collection with the specified data, assigning
     * it a document ID automatically.
     *
     * @param data An Object containing the data for the new document.
     * @throws Error If the provided input is not a valid Firestore document.
     * @return A Promise resolved with a `DocumentReference` pointing to the
     * newly created document after it has been written to the backend.
     */
    add(
      data: WithFieldValue<AppModelType>
    ): Promise<DocumentReference<AppModelType, DbModelType>>;

    /**
     * Returns true if this `CollectionReference` is equal to the provided one.
     *
     * @param other The `CollectionReference` to compare against.
     * @return true if this `CollectionReference` is equal to the provided one.
     */
    isEqual(other: CollectionReference<AppModelType, DbModelType>): boolean;

    /**
     * Applies a custom data converter to this CollectionReference, allowing you
     * to use your own custom model objects with Firestore. When you call add()
     * on the returned CollectionReference instance, the provided converter will
     * convert between Firestore data of type `NewDbModelType` and your custom
     * type `NewAppModelType`.
     *
     * @param converter Converts objects to and from Firestore. Passing in
     * `null` removes the current converter.
     * @return A CollectionReference that uses the provided converter.
     */
    withConverter<
      NewAppModelType,
      NewDbModelType extends DocumentData = DocumentData,
    >(
      converter: FirestoreDataConverter<NewAppModelType>
    ): CollectionReference<NewAppModelType, NewDbModelType>;
    withConverter(converter: null): CollectionReference;
  }

  /**
   * A `CollectionGroup` refers to all documents that are contained in a
   * collection or subcollection with a specific collection ID.
   */
  export class CollectionGroup<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > extends Query<AppModelType, DbModelType> {
    private constructor();

    /**
     * Partitions a query by returning partition cursors that can be used to run
     * the query in parallel. The returned cursors are split points that can be
     * used as starting and end points for individual query invocations.
     *
     * @param desiredPartitionCount The desired maximum number of partition
     * points. The number must be strictly positive. The actual number of
     * partitions returned may be fewer.
     * @return An AsyncIterable of `QueryPartition`s.
     */
    getPartitions(
      desiredPartitionCount: number
    ): AsyncIterable<QueryPartition<AppModelType, DbModelType>>;

    /**
     * Applies a custom data converter to this `CollectionGroup`, allowing you
     * to use your own custom model objects with Firestore. When you call get()
     * on the returned `CollectionGroup`, the provided converter will convert
     * between Firestore data of type `NewDbModelType` and your custom type
     * `NewAppModelType`.
     *
     * Using the converter allows you to specify generic type arguments when
     * storing and retrieving objects from Firestore.
     *
     * @example
     * class Post {
     *   constructor(readonly title: string, readonly author: string) {}
     *
     *   toString(): string {
     *     return this.title + ', by ' + this.author;
     *   }
     * }
     *
     * const postConverter = {
     *   toFirestore(post: Post): FirebaseFirestore.DocumentData {
     *     return {title: post.title, author: post.author};
     *   },
     *   fromFirestore(
     *     snapshot: FirebaseFirestore.QueryDocumentSnapshot
     *   ): Post {
     *     const data = snapshot.data();
     *     return new Post(data.title, data.author);
     *   }
     * };
     *
     * const querySnapshot = await Firestore()
     *   .collectionGroup('posts')
     *   .withConverter(postConverter)
     *   .get();
     * for (const doc of querySnapshot.docs) {
     *   const post = doc.data();
     *   post.title; // string
     *   post.toString(); // Should be defined
     *   post.someNonExistentProperty; // TS error
     * }
     *
     * @param converter Converts objects to and from Firestore. Passing in
     * `null` removes the current converter.
     * @return A `CollectionGroup` that uses the provided converter.
     */
    withConverter<
      NewAppModelType,
      NewDbModelType extends DocumentData = DocumentData,
    >(
      converter: FirestoreDataConverter<NewAppModelType, NewDbModelType>
    ): CollectionGroup<NewAppModelType, NewDbModelType>;
    withConverter(converter: null): CollectionGroup;
  }

  /**
   * A split point that can be used in a query as a starting and/or end point for
   * the query results. The cursors returned by {@link #startAt} and {@link
   * #endBefore} can only be used in a query that matches the constraint of query
   * that produced this partition.
   */
  export class QueryPartition<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    private constructor();

    /**
     * The cursor that defines the first result for this partition or
     * `undefined` if this is the first partition.  The cursor value must be
     * destructured when passed to `startAt()` (for example with
     * `query.startAt(...queryPartition.startAt)`).
     *
     * @return Cursor values that can be used with {@link Query#startAt} or
     * `undefined` if this is the first partition.
     */
    get startAt(): unknown[] | undefined;

    /**
     * The cursor that defines the first result after this partition or
     * `undefined` if this is the last partition.  The cursor value must be
     * destructured when passed to `endBefore()` (for example with
     * `query.endBefore(...queryPartition.endBefore)`).
     *
     * @return Cursor values that can be used with {@link Query#endBefore} or
     * `undefined` if this is the last partition.
     */
    get endBefore(): unknown[] | undefined;

    /**
     * Returns a query that only returns the documents for this partition.
     *
     * @return A query partitioned by a {@link Query#startAt} and {@link
     * Query#endBefore} cursor.
     */
    toQuery(): Query<AppModelType, DbModelType>;
  }

  /**
   * Union type representing the aggregate type to be performed.
   */
  export type AggregateType = 'count' | 'avg' | 'sum';

  /**
   * The union of all `AggregateField` types that are supported by Firestore.
   */
  export type AggregateFieldType =
    | ReturnType<typeof AggregateField.count>
    | ReturnType<typeof AggregateField.sum>
    | ReturnType<typeof AggregateField.average>;

  /**
   * Represents an aggregation that can be performed by Firestore.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export class AggregateField<T> {
    private constructor();

    /** A type string to uniquely identify instances of this class. */
    readonly type = 'AggregateField';

    /** The kind of aggregation performed by this AggregateField. */
    public readonly aggregateType: AggregateType;

    /**
     * Compares this object with the given object for equality.
     *
     * This object is considered "equal" to the other object if and only if
     * `other` performs the same kind of aggregation on the same field (if any).
     *
     * @param other The object to compare to this object for equality.
     * @return `true` if this object is "equal" to the given object, as
     * defined above, or `false` otherwise.
     */
    isEqual(other: AggregateField<any>): boolean;

    /**
     * Create an AggregateField object that can be used to compute the count of
     * documents in the result set of a query.
     */
    static count(): AggregateField<number>;

    /**
     * Create an AggregateField object that can be used to compute the average of
     * a specified field over a range of documents in the result set of a query.
     * @param field Specifies the field to average across the result set.
     */
    static average(field: string | FieldPath): AggregateField<number | null>;

    /**
     * Create an AggregateField object that can be used to compute the sum of
     * a specified field over a range of documents in the result set of a query.
     * @param field Specifies the field to sum across the result set.
     */
    static sum(field: string | FieldPath): AggregateField<number>;
  }

  /**
   * A type whose property values are all `AggregateField` objects.
   */
  export interface AggregateSpec {
    [field: string]: AggregateFieldType;
  }

  /**
   * A type whose keys are taken from an `AggregateSpec`, and whose values are
   * the result of the aggregation performed by the corresponding
   * `AggregateField` from the input `AggregateSpec`.
   */
  export type AggregateSpecData<T extends AggregateSpec> = {
    [P in keyof T]: T[P] extends AggregateField<infer U> ? U : never;
  };

  /**
   * A query that calculates aggregations over an underlying query.
   */
  export class AggregateQuery<
    AggregateSpecType extends AggregateSpec,
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    private constructor();

    /** The query whose aggregations will be calculated by this object. */
    readonly query: Query<AppModelType, DbModelType>;

    /**
     * Executes this query.
     *
     * @return A promise that will be resolved with the results of the query.
     */
    get(): Promise<
      AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
    >;

    /**
     * Plans and optionally executes this query. Returns a Promise that will be
     * resolved with the planner information, statistics from the query execution (if any),
     * and the query results (if any).
     *
     * @return A Promise that will be resolved with the planner information, statistics
     *  from the query execution (if any), and the query results (if any).
     */
    explain(
      options?: ExplainOptions
    ): Promise<
      ExplainResults<
        AggregateQuerySnapshot<AggregateSpecType, AppModelType, DbModelType>
      >
    >;

    /**
     * Compares this object with the given object for equality.
     *
     * This object is considered "equal" to the other object if and only if
     * `other` performs the same aggregations as this `AggregateQuery` and
     * the underlying Query of `other` compares equal to that of this object
     * using `Query.isEqual()`.
     *
     * @param other The object to compare to this object for equality.
     * @return `true` if this object is "equal" to the given object, as
     * defined above, or `false` otherwise.
     */
    isEqual(
      other: AggregateQuery<AggregateSpecType, AppModelType, DbModelType>
    ): boolean;
  }

  /**
   * The results of executing an aggregation query.
   */
  export class AggregateQuerySnapshot<
    AggregateSpecType extends AggregateSpec,
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    private constructor();

    /** The query that was executed to produce this result. */
    readonly query: AggregateQuery<
      AggregateSpecType,
      AppModelType,
      DbModelType
    >;

    /** The time this snapshot was read. */
    readonly readTime: Timestamp;

    /**
     * Returns the results of the aggregations performed over the underlying
     * query.
     *
     * The keys of the returned object will be the same as those of the
     * `AggregateSpec` object specified to the aggregation method, and the
     * values will be the corresponding aggregation result.
     *
     * @returns The results of the aggregations performed over the underlying
     * query.
     */
    data(): AggregateSpecData<AggregateSpecType>;

    /**
     * Compares this object with the given object for equality.
     *
     * Two `AggregateQuerySnapshot` instances are considered "equal" if they
     * have the same data and their underlying queries compare "equal" using
     * `AggregateQuery.isEqual()`.
     *
     * @param other The object to compare to this object for equality.
     * @return `true` if this object is "equal" to the given object, as
     * defined above, or `false` otherwise.
     */
    isEqual(
      other: AggregateQuerySnapshot<
        AggregateSpecType,
        AppModelType,
        DbModelType
      >
    ): boolean;
  }

  /**
   * A query that finds the document whose vector fields are closest to a certain vector.
   */
  export class VectorQuery<
    AppModelType = DocumentData,
    DbModelType extends DocumentData = DocumentData,
  > {
    private constructor();

    /** The query whose results participants in the distance search. */
    readonly query: Query<AppModelType, DbModelType>;

    /**
     * Executes this query.
     *
     * @return A promise that will be resolved with the results of the query.
     */
    get(): Promise<VectorQuerySnapshot<AppModelType, DbModelType>>;

    /**
     * Compares this object with the given object for equality.
     *
     * This object is considered "equal" to the other object if and only if
     * `other` performs the same vector distance search as this `VectorQuery` and
     * the underlying Query of `other` compares equal to that of this object
     * using `Query.isEqual()`.
     *
     * @param other The object to compare to this object for equality.
     * @return `true` if this object is "equal" to the given object, as
     * defined above, or `false` otherwise.
     */
    isEqual(other: VectorQuery<AppModelType, DbModelType>): boolean;
  }

  /**
   * Represent a vector type in Firestore documents.
   */
  export class VectorValue {
    private constructor(values: number[] | undefined);

    /**
     * Returns a copy of the raw number array form of the vector.
     */
    toArray(): number[];

    /**
     * Returns true if the two `VectorValue` has the same raw number arrays, returns false otherwise.
     */
    isEqual(other: VectorValue): boolean;
  }

  /**
   * Sentinel values that can be used when writing document fields with set(),
   * create() or update().
   */
  export class FieldValue {
    private constructor();

    /**
     * Returns a sentinel used with set(), create() or update() to include a
     * server-generated timestamp in the written data.
     *
     * @return The FieldValue sentinel for use in a call to set(), create() or
     * update().
     */
    static serverTimestamp(): FieldValue;

    /**
     * Returns a sentinel for use with update() or set() with {merge:true} to
     * mark a field for deletion.
     *
     * @return The FieldValue sentinel for use in a call to set() or update().
     */
    static delete(): FieldValue;

    /**
     * Returns a special value that can be used with set(), create() or update()
     * that tells the server to increment the field's current value by the given
     * value.
     *
     * If either current field value or the operand uses floating point
     * precision, both values will be interpreted as floating point numbers and
     * all arithmetic will follow IEEE 754 semantics. Otherwise, integer
     * precision is kept and the result is capped between -2^63 and 2^63-1.
     *
     * If the current field value is not of type 'number', or if the field does
     * not yet exist, the transformation will set the field to the given value.
     *
     * @param n The value to increment by.
     * @return The FieldValue sentinel for use in a call to set(), create() or
     * update().
     */
    static increment(n: number): FieldValue;

    /**
     * Returns a special value that can be used with set(), create() or update()
     * that tells the server to union the given elements with any array value
     * that already exists on the server. Each specified element that doesn't
     * already exist in the array will be added to the end. If the field being
     * modified is not already an array it will be overwritten with an array
     * containing exactly the specified elements.
     *
     * @param elements The elements to union into the array.
     * @return The FieldValue sentinel for use in a call to set(), create() or
     * update().
     */
    static arrayUnion(...elements: any[]): FieldValue;

    /**
     * Returns a special value that can be used with set(), create() or update()
     * that tells the server to remove the given elements from any array value
     * that already exists on the server. All instances of each element
     * specified will be removed from the array. If the field being modified is
     * not already an array it will be overwritten with an empty array.
     *
     * @param elements The elements to remove from the array.
     * @return The FieldValue sentinel for use in a call to set(), create() or
     * update().
     */
    static arrayRemove(...elements: any[]): FieldValue;

    /**
     * @return A new `VectorValue` constructed with a copy of the given array of number.
     */
    static vector(values?: number[]): VectorValue;

    /**
     * Returns true if this `FieldValue` is equal to the provided one.
     *
     * @param other The `FieldValue` to compare against.
     * @return true if this `FieldValue` is equal to the provided one.
     */
    isEqual(other: FieldValue): boolean;
  }

  /**
   * A FieldPath refers to a field in a document. The path may consist of a
   * single field name (referring to a top-level field in the document), or a
   * list of field names (referring to a nested field in the document).
   */
  export class FieldPath {
    /**
     * Creates a FieldPath from the provided field names. If more than one field
     * name is provided, the path will point to a nested field in a document.
     *
     * @param fieldNames A list of field names.
     */
    constructor(...fieldNames: string[]);

    /**
     * Returns a special sentinel FieldPath to refer to the ID of a document.
     * It can be used in queries to sort or filter by the document ID.
     */
    static documentId(): FieldPath;

    /**
     * Returns true if this `FieldPath` is equal to the provided one.
     *
     * @param other The `FieldPath` to compare against.
     * @return true if this `FieldPath` is equal to the provided one.
     */
    isEqual(other: FieldPath): boolean;
  }

  /**
   * A Timestamp represents a point in time independent of any time zone or
   * calendar, represented as seconds and fractions of seconds at nanosecond
   * resolution in UTC Epoch time. It is encoded using the Proleptic Gregorian
   * Calendar which extends the Gregorian calendar backwards to year one. It is
   * encoded assuming all minutes are 60 seconds long, i.e. leap seconds are
   * "smeared" so that no leap second table is needed for interpretation. Range
   * is from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z.
   *
   * @see https://github.com/google/protobuf/blob/master/src/google/protobuf/timestamp.proto
   */
  export class Timestamp {
    /**
     * Creates a new timestamp with the current date, with millisecond precision.
     *
     * @return A new `Timestamp` representing the current date.
     */
    static now(): Timestamp;

    /**
     * Creates a new timestamp from the given date.
     *
     * @param date The date to initialize the `Timestamp` from.
     * @return A new `Timestamp` representing the same point in time as the
     * given date.
     */
    static fromDate(date: Date): Timestamp;

    /**
     * Creates a new timestamp from the given number of milliseconds.
     *
     * @param milliseconds Number of milliseconds since Unix epoch
     * 1970-01-01T00:00:00Z.
     * @return A new `Timestamp` representing the same point in time as the
     * given number of milliseconds.
     */
    static fromMillis(milliseconds: number): Timestamp;

    /**
     * Creates a new timestamp.
     *
     * @param seconds The number of seconds of UTC time since Unix epoch
     * 1970-01-01T00:00:00Z. Must be from 0001-01-01T00:00:00Z to
     * 9999-12-31T23:59:59Z inclusive.
     * @param nanoseconds The non-negative fractions of a second at nanosecond
     * resolution. Negative second values with fractions must still have
     * non-negative nanoseconds values that count forward in time. Must be from
     * 0 to 999,999,999 inclusive.
     */
    constructor(seconds: number, nanoseconds: number);

    /**
     * The number of seconds of UTC time since Unix epoch 1970-01-01T00:00:00Z.
     */
    readonly seconds: number;

    /** The non-negative fractions of a second at nanosecond resolution. */
    readonly nanoseconds: number;

    /**
     * Returns a new `Date` corresponding to this timestamp. This may lose
     * precision.
     *
     * @return JavaScript `Date` object representing the same point in time as
     * this `Timestamp`, with millisecond precision.
     */
    toDate(): Date;

    /**
     * Returns the number of milliseconds since Unix epoch 1970-01-01T00:00:00Z.
     *
     * @return The point in time corresponding to this timestamp, represented as
     * the number of milliseconds since Unix epoch 1970-01-01T00:00:00Z.
     */
    toMillis(): number;

    /**
     * Returns true if this `Timestamp` is equal to the provided one.
     *
     * @param other The `Timestamp` to compare against.
     * @return 'true' if this `Timestamp` is equal to the provided one.
     */
    isEqual(other: Timestamp): boolean;

    /**
     * Converts this object to a primitive `string`, which allows `Timestamp` objects to be compared
     * using the `>`, `<=`, `>=` and `>` operators.
     *
     * @return a string encoding of this object.
     */
    valueOf(): string;
  }

  /**
   * Builds a Firestore data bundle with results from the given document and query snapshots.
   */
  export class BundleBuilder {
    /** The ID of this bundle. */
    readonly bundleId: string;

    /**
     * Adds a Firestore `DocumentSnapshot` to the bundle. Both the documents data and the document
     * read time will be included in the bundle.
     *
     * @param documentSnapshot A `DocumentSnapshot` to add.
     * @returns This instance.
     */
    add<AppModelType, DbModelType extends DocumentData>(
      documentSnapshot: DocumentSnapshot<AppModelType, DbModelType>
    ): BundleBuilder;

    /**
     * Adds a Firestore `QuerySnapshot` to the bundle. Both the documents in the query results and
     * the query read time will be included in the bundle.
     *
     * @param queryName The name of the query to add.
     * @param querySnapshot A `QuerySnapshot` to add to the bundle.
     * @returns This instance.
     */
    add<AppModelType, DbModelType extends DocumentData>(
      queryName: string,
      querySnapshot: QuerySnapshot<AppModelType, DbModelType>
    ): BundleBuilder;

    /**
     * Builds the bundle and returns the result as a `Buffer` instance.
     */
    build(): Buffer;
  }

  /**
   * The v1beta1 Veneer client. This client provides access to to the underlying
   * Firestore v1beta1 RPCs.
   * @deprecated Use v1 instead.
   */
  export const v1beta1: {
    FirestoreClient: typeof import('./v1beta1/firestore_client').FirestoreClient;
  };

  /**
   * The v1 Veneer clients. These clients provide access to the Firestore Admin
   * API and the underlying Firestore v1 RPCs.
   */
  export const v1: {
    FirestoreClient: typeof import('./v1/firestore_client').FirestoreClient;
    FirestoreAdminClient: typeof import('./v1/firestore_admin_client').FirestoreAdminClient;
  };

  /**
   * Status codes returned by Firestore's gRPC calls.
   */
  export enum GrpcStatus {
    OK = 0,
    CANCELLED = 1,
    UNKNOWN = 2,
    INVALID_ARGUMENT = 3,
    DEADLINE_EXCEEDED = 4,
    NOT_FOUND = 5,
    ALREADY_EXISTS = 6,
    PERMISSION_DENIED = 7,
    RESOURCE_EXHAUSTED = 8,
    FAILED_PRECONDITION = 9,
    ABORTED = 10,
    OUT_OF_RANGE = 11,
    UNIMPLEMENTED = 12,
    INTERNAL = 13,
    UNAVAILABLE = 14,
    DATA_LOSS = 15,
    UNAUTHENTICATED = 16,
  }

  /**
   * A `Filter` represents a restriction on one or more field values and can
   * be used to refine the results of a {@link Query}.
   * `Filters`s are created by invoking {@link Filter#where}, {@link Filter#or},
   * or {@link Filter#and} and can then be passed to {@link Query#where}
   * to create a new {@link Query} instance that also contains this `Filter`.
   */
  export abstract class Filter {
    /**
     * Creates and returns a new [Filter]{@link Filter}, which can be
     * applied to [Query.where()]{@link Query#where}, [Filter.or()]{@link Filter#or},
     * or [Filter.and()]{@link Filter#and}. When applied to a [Query]{@link Query}
     * it requires that documents must contain the specified field and that its value should
     * satisfy the relation constraint provided.
     *
     * Returns a new Filter that can be used to constrain the value of a Document property.
     *
     * @param {string|FieldPath} fieldPath The name of a property value to compare.
     * @param {string} opStr A comparison operation in the form of a string
     * (e.g., "<").
     * @param {*} value The value to which to compare the field for inclusion in
     * a query.
     * @returns {Filter} The created Filter.
     *
     * @example
     * ```
     * let collectionRef = firestore.collection('col');
     *
     * collectionRef.where(Filter.where('foo', '==', 'bar')).get().then(querySnapshot => {
     *   querySnapshot.forEach(documentSnapshot => {
     *     console.log(`Found document at ${documentSnapshot.ref.path}`);
     *   });
     * });
     * ```
     */
    static where(
      fieldPath: string | FieldPath,
      opStr: WhereFilterOp,
      value: unknown
    ): Filter;

    /**
     * Creates and returns a new [Filter]{@link Filter} that is a
     * disjunction of the given {@link Filter}s. A disjunction filter includes
     * a document if it satisfies any of the given {@link Filter}s.
     *
     * The returned Filter can be applied to [Query.where()]{@link Query#where},
     * [Filter.or()]{@link Filter#or}, or [Filter.and()]{@link Filter#and}. When
     * applied to a [Query]{@link Query} it requires that documents must satisfy
     * one of the provided {@link Filter}s.
     *
     * @param {...Filter} filters  Optional. The {@link Filter}s
     * for OR operation. These must be created with calls to {@link Filter#where},
     * {@link Filter#or}, or {@link Filter#and}.
     * @returns {Filter} The created {@link Filter}.
     *
     * @example
     * ```
     * let collectionRef = firestore.collection('col');
     *
     * // doc.foo == 'bar' || doc.baz > 0
     * let orFilter = Filter.or(Filter.where('foo', '==', 'bar'), Filter.where('baz', '>', 0));
     *
     * collectionRef.where(orFilter).get().then(querySnapshot => {
     *   querySnapshot.forEach(documentSnapshot => {
     *     console.log(`Found document at ${documentSnapshot.ref.path}`);
     *   });
     * });
     * ```
     */
    static or(...filters: Filter[]): Filter;

    /**
     * Creates and returns a new [Filter]{@link Filter} that is a
     * conjunction of the given {@link Filter}s. A conjunction filter includes
     * a document if it satisfies all of the given {@link Filter}s.
     *
     * The returned Filter can be applied to [Query.where()]{@link Query#where},
     * [Filter.or()]{@link Filter#or}, or [Filter.and()]{@link Filter#and}. When
     * applied to a [Query]{@link Query} it requires that documents must satisfy
     * one of the provided {@link Filter}s.
     *
     * @param {...Filter} filters  Optional. The {@link Filter}s
     * for OR operation. These must be created with calls to {@link Filter#where},
     * {@link Filter#or}, or {@link Filter#and}.
     * @returns {Filter} The created {@link Filter}.
     *
     * @example
     * ```
     * let collectionRef = firestore.collection('col');
     *
     * // doc.foo == 'bar' && doc.baz > 0
     * let orFilter = Filter.and(Filter.where('foo', '==', 'bar'), Filter.where('baz', '>', 0));
     *
     * collectionRef.where(orFilter).get().then(querySnapshot => {
     *   querySnapshot.forEach(documentSnapshot => {
     *     console.log(`Found document at ${documentSnapshot.ref.path}`);
     *   });
     * });
     * ```
     */
    static and(...filters: Filter[]): Filter;
  }

  type Duration = {
    /** Signed seconds of the span of time. */
    seconds: number;

    /**
     * Signed fractions of a second at nanosecond resolution of the span
     * of time. Durations less than one second are represented with a 0
     * `seconds` field and a positive or negative `nanos` field. For durations
     * of one second or more, a non-zero value for the `nanos` field must be
     * of the same sign as the `seconds` field. Must be from -999,999,999
     * to +999,999,999 inclusive.
     */
    nanoseconds: number;
  };

  /** Options used to configure explain queries. */
  export interface ExplainOptions {
    /**
     * Whether analyzing the query is enabled. If true, the query will be
     * executed and execution statistics will be returned as part of the
     * [ExplainResults]{@link ExplainResults}.
     */
    readonly analyze?: boolean;
  }

  /**
   * PlanSummary contains information about the planning stage of a query.
   */
  export interface PlanSummary {
    /**
     * Information about the indexes that were used to serve the query.
     * This should be inspected or logged, because the contents are intended to be
     * human-readable. Contents are subject to change, and it is advised to not
     * program against this object.
     */
    readonly indexesUsed: Record<string, unknown>[];
  }

  /** ExecutionStats contains information about the execution of a query. */
  export interface ExecutionStats {
    /** The number of query results. */
    readonly resultsReturned: number;

    /** The total execution time of the query. */
    readonly executionDuration: Duration;

    /** The number of read operations that occurred when executing the query. */
    readonly readOperations: number;

    /**
     * Contains additional statistics related to the query execution.
     * This should be inspected or logged, because the contents are intended to be
     * human-readable. Contents are subject to change, and it is advised to not
     * program against this object.
     */
    readonly debugStats: Record<string, unknown>;
  }

  /**
   * ExplainMetrics contains information about planning and execution of a query.
   */
  export interface ExplainMetrics {
    /**
     * Information about the query plan.
     */
    readonly planSummary: PlanSummary;

    /**
     * Information about the execution of the query, or null if the query was
     * not executed.
     */
    readonly executionStats: ExecutionStats | null;
  }

  /**
   * ExplainResults contains information about planning, execution, and results
   * of a query.
   */
  export interface ExplainResults<T> {
    /**
     * Information about planning and execution of the query.
     */
    readonly metrics: ExplainMetrics;

    /**
     * The snapshot that contains the results of executing the query, or null
     * if the query was not executed.
     */
    readonly snapshot: T | null;
  }

  /**
   * @beta
   *
   * An interface that represents a selectable expression.
   */
  export interface Selectable {
    selectable: true;
  }

  /**
   * @beta
   *
   * An interface that represents a filter condition.
   */
  export interface FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   *
   * An interface that represents an accumulator.
   */
  export interface Accumulator {
    accumulator: true;
  }

  /**
   * @beta
   *
   * An accumulator target, which is an expression with an alias that also implements the Accumulator interface.
   */
  export type AccumulatorTarget = ExprWithAlias<Expr & Accumulator>;

  /**
   * @beta
   *
   * A filter expression, which is an expression that also implements the FilterCondition interface.
   */
  export type FilterExpr = Expr & FilterCondition;

  /**
   * @beta
   *
   * A selectable expression, which is an expression that also implements the Selectable interface.
   */
  export type SelectableExpr = Expr & Selectable;

  /**
   * @beta
   *
   * An enumeration of the different types of expressions.
   */
  export type ExprType =
    | 'Field'
    | 'Constant'
    | 'Function'
    | 'ListOfExprs'
    | 'ExprWithAlias';

  /**
   * @beta
   *
   * Represents an expression that can be evaluated to a value within the execution of a {@link
   * Pipeline}.
   *
   * Expressions are the building blocks for creating complex queries and transformations in
   * Firestore pipelines. They can represent:
   *
   * - **Field references:** Access values from document fields.
   * - **Literals:** Represent constant values (strings, numbers, booleans).
   * - **Function calls:** Apply functions to one or more expressions.
   * - **Aggregations:** Calculate aggregate values (e.g., sum, average) over a set of documents.
   *
   * The `Expr` class provides a fluent API for building expressions. You can chain together
   * method calls to create complex expressions.
   */
  export abstract class Expr {
    /**
     * Creates an expression that adds this expression to another expression.
     *
     * ```typescript
     * // Add the value of the 'quantity' field and the 'reserve' field.
     * Field.of("quantity").add(Field.of("reserve"));
     * ```
     *
     * @param other The expression to add to this expression.
     * @return A new `Expr` representing the addition operation.
     */
    add(other: Expr): Add;

    /**
     * Creates an expression that adds this expression to a constant value.
     *
     * ```typescript
     * // Add 5 to the value of the 'age' field
     * Field.of("age").add(5);
     * ```
     *
     * @param other The constant value to add.
     * @return A new `Expr` representing the addition operation.
     */
    add(other: any): Add;

    /**
     * Creates an expression that subtracts another expression from this expression.
     *
     * ```typescript
     * // Subtract the 'discount' field from the 'price' field
     * Field.of("price").subtract(Field.of("discount"));
     * ```
     *
     * @param other The expression to subtract from this expression.
     * @return A new `Expr` representing the subtraction operation.
     */
    subtract(other: Expr): Subtract;

    /**
     * Creates an expression that subtracts a constant value from this expression.
     *
     * ```typescript
     * // Subtract 20 from the value of the 'total' field
     * Field.of("total").subtract(20);
     * ```
     *
     * @param other The constant value to subtract.
     * @return A new `Expr` representing the subtraction operation.
     */
    subtract(other: any): Subtract;

    /**
     * Creates an expression that multiplies this expression by another expression.
     *
     * ```typescript
     * // Multiply the 'quantity' field by the 'price' field
     * Field.of("quantity").multiply(Field.of("price"));
     * ```
     *
     * @param other The expression to multiply by.
     * @return A new `Expr` representing the multiplication operation.
     */
    multiply(other: Expr): Multiply;

    /**
     * Creates an expression that multiplies this expression by a constant value.
     *
     * ```typescript
     * // Multiply the 'value' field by 2
     * Field.of("value").multiply(2);
     * ```
     *
     * @param other The constant value to multiply by.
     * @return A new `Expr` representing the multiplication operation.
     */
    multiply(other: any): Multiply;

    /**
     * Creates an expression that divides this expression by another expression.
     *
     * ```typescript
     * // Divide the 'total' field by the 'count' field
     * Field.of("total").divide(Field.of("count"));
     * ```
     *
     * @param other The expression to divide by.
     * @return A new `Expr` representing the division operation.
     */
    divide(other: Expr): Divide;

    /**
     * Creates an expression that divides this expression by a constant value.
     *
     * ```typescript
     * // Divide the 'value' field by 10
     * Field.of("value").divide(10);
     * ```
     *
     * @param other The constant value to divide by.
     * @return A new `Expr` representing the division operation.
     */
    divide(other: any): Divide;

    /**
     * Creates an expression that calculates the modulo (remainder) of dividing this expression by another expression.
     *
     * ```typescript
     * // Calculate the remainder of dividing the 'value' field by the 'divisor' field
     * Field.of("value").mod(Field.of("divisor"));
     * ```
     *
     * @param other The expression to divide by.
     * @return A new `Expr` representing the modulo operation.
     */
    mod(other: Expr): Mod;

    /**
     * Creates an expression that calculates the modulo (remainder) of dividing this expression by a constant value.
     *
     * ```typescript
     * // Calculate the remainder of dividing the 'value' field by 10
     * Field.of("value").mod(10);
     * ```
     *
     * @param other The constant value to divide by.
     * @return A new `Expr` representing the modulo operation.
     */
    mod(other: any): Mod;

    // /**
    //  * Creates an expression that applies a bitwise AND operation between this expression and another expression.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise AND of 'field1' and 'field2'.
    //  * Field.of("field1").bitAnd(Field.of("field2"));
    //  * ```
    //  *
    //  * @param other The right operand expression.
    //  * @return A new {@code Expr} representing the bitwise AND operation.
    //  */
    // bitAnd(other: Expr): BitAnd;
    //
    // /**
    //  * Creates an expression that applies a bitwise AND operation between this expression and a constant value.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise AND of 'field1' and 0xFF.
    //  * Field.of("field1").bitAnd(0xFF);
    //  * ```
    //  *
    //  * @param other The right operand constant.
    //  * @return A new {@code Expr} representing the bitwise AND operation.
    //  */
    // bitAnd(other: any): BitAnd;
    //
    // /**
    //  * Creates an expression that applies a bitwise OR operation between this expression and another expression.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise OR of 'field1' and 'field2'.
    //  * Field.of("field1").bitOr(Field.of("field2"));
    //  * ```
    //  *
    //  * @param other The right operand expression.
    //  * @return A new {@code Expr} representing the bitwise OR operation.
    //  */
    // bitOr(other: Expr): BitOr;
    //
    // /**
    //  * Creates an expression that applies a bitwise OR operation between this expression and a constant value.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise OR of 'field1' and 0xFF.
    //  * Field.of("field1").bitOr(0xFF);
    //  * ```
    //  *
    //  * @param other The right operand constant.
    //  * @return A new {@code Expr} representing the bitwise OR operation.
    //  */
    // bitOr(other: any): BitOr;
    //
    // /**
    //  * Creates an expression that applies a bitwise XOR operation between this expression and another expression.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise XOR of 'field1' and 'field2'.
    //  * Field.of("field1").bitXor(Field.of("field2"));
    //  * ```
    //  *
    //  * @param other The right operand expression.
    //  * @return A new {@code Expr} representing the bitwise XOR operation.
    //  */
    // bitXor(other: Expr): BitXor;
    //
    // /**
    //  * Creates an expression that applies a bitwise XOR operation between this expression and a constant value.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise XOR of 'field1' and 0xFF.
    //  * Field.of("field1").bitXor(0xFF);
    //  * ```
    //  *
    //  * @param other The right operand constant.
    //  * @return A new {@code Expr} representing the bitwise XOR operation.
    //  */
    // bitXor(other: any): BitXor;
    //
    // /**
    //  * Creates an expression that applies a bitwise NOT operation to this expression.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise NOT of 'field1'.
    //  * Field.of("field1").bitNot();
    //  * ```
    //  *
    //  * @return A new {@code Expr} representing the bitwise NOT operation.
    //  */
    // bitNot(): BitNot;
    //
    // /**
    //  * Creates an expression that applies a bitwise left shift operation between this expression and another expression.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise left shift of 'field1' by 'field2' bits.
    //  * Field.of("field1").bitLeftShift(Field.of("field2"));
    //  * ```
    //  *
    //  * @param other The right operand expression representing the number of bits to shift.
    //  * @return A new {@code Expr} representing the bitwise left shift operation.
    //  */
    // bitLeftShift(other: Expr): BitLeftShift;
    //
    // /**
    //  * Creates an expression that applies a bitwise left shift operation between this expression and a constant value.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise left shift of 'field1' by 2 bits.
    //  * Field.of("field1").bitLeftShift(2);
    //  * ```
    //  *
    //  * @param other The right operand constant representing the number of bits to shift.
    //  * @return A new {@code Expr} representing the bitwise left shift operation.
    //  */
    // bitLeftShift(other: number): BitLeftShift;
    //
    // /**
    //  * Creates an expression that applies a bitwise right shift operation between this expression and another expression.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise right shift of 'field1' by 'field2' bits.
    //  * Field.of("field1").bitRightShift(Field.of("field2"));
    //  * ```
    //  *
    //  * @param other The right operand expression representing the number of bits to shift.
    //  * @return A new {@code Expr} representing the bitwise right shift operation.
    //  */
    // bitRightShift(other: Expr): BitRightShift;
    //
    // /**
    //  * Creates an expression that applies a bitwise right shift operation between this expression and a constant value.
    //  *
    //  * ```typescript
    //  * // Calculate the bitwise right shift of 'field1' by 2 bits.
    //  * Field.of("field1").bitRightShift(2);
    //  * ```
    //  *
    //  * @param other The right operand constant representing the number of bits to shift.
    //  * @return A new {@code Expr} representing the bitwise right shift operation.
    //  */
    // bitRightShift(other: number): BitRightShift;

    /**
     * Creates an expression that checks if this expression is equal to another expression.
     *
     * ```typescript
     * // Check if the 'age' field is equal to 21
     * Field.of("age").eq(21);
     * ```
     *
     * @param other The expression to compare for equality.
     * @return A new `Expr` representing the equality comparison.
     */
    eq(other: Expr): Eq;

    /**
     * Creates an expression that checks if this expression is equal to a constant value.
     *
     * ```typescript
     * // Check if the 'city' field is equal to "London"
     * Field.of("city").eq("London");
     * ```
     *
     * @param other The constant value to compare for equality.
     * @return A new `Expr` representing the equality comparison.
     */
    eq(other: any): Eq;

    /**
     * Creates an expression that checks if this expression is not equal to another expression.
     *
     * ```typescript
     * // Check if the 'status' field is not equal to "completed"
     * Field.of("status").neq("completed");
     * ```
     *
     * @param other The expression to compare for inequality.
     * @return A new `Expr` representing the inequality comparison.
     */
    neq(other: Expr): Neq;

    /**
     * Creates an expression that checks if this expression is not equal to a constant value.
     *
     * ```typescript
     * // Check if the 'country' field is not equal to "USA"
     * Field.of("country").neq("USA");
     * ```
     *
     * @param other The constant value to compare for inequality.
     * @return A new `Expr` representing the inequality comparison.
     */
    neq(other: any): Neq;

    /**
     * Creates an expression that checks if this expression is less than another expression.
     *
     * ```typescript
     * // Check if the 'age' field is less than 'limit'
     * Field.of("age").lt(Field.of('limit'));
     * ```
     *
     * @param other The expression to compare for less than.
     * @return A new `Expr` representing the less than comparison.
     */
    lt(other: Expr): Lt;

    /**
     * Creates an expression that checks if this expression is less than a constant value.
     *
     * ```typescript
     * // Check if the 'price' field is less than 50
     * Field.of("price").lt(50);
     * ```
     *
     * @param other The constant value to compare for less than.
     * @return A new `Expr` representing the less than comparison.
     */
    lt(other: any): Lt;

    /**
     * Creates an expression that checks if this expression is less than or equal to another
     * expression.
     *
     * ```typescript
     * // Check if the 'quantity' field is less than or equal to 20
     * Field.of("quantity").lte(Constant.of(20));
     * ```
     *
     * @param other The expression to compare for less than or equal to.
     * @return A new `Expr` representing the less than or equal to comparison.
     */
    lte(other: Expr): Lte;

    /**
     * Creates an expression that checks if this expression is less than or equal to a constant value.
     *
     * ```typescript
     * // Check if the 'score' field is less than or equal to 70
     * Field.of("score").lte(70);
     * ```
     *
     * @param other The constant value to compare for less than or equal to.
     * @return A new `Expr` representing the less than or equal to comparison.
     */
    lte(other: any): Lte;

    /**
     * Creates an expression that checks if this expression is greater than another expression.
     *
     * ```typescript
     * // Check if the 'age' field is greater than the 'limit' field
     * Field.of("age").gt(Field.of("limit"));
     * ```
     *
     * @param other The expression to compare for greater than.
     * @return A new `Expr` representing the greater than comparison.
     */
    gt(other: Expr): Gt;

    /**
     * Creates an expression that checks if this expression is greater than a constant value.
     *
     * ```typescript
     * // Check if the 'price' field is greater than 100
     * Field.of("price").gt(100);
     * ```
     *
     * @param other The constant value to compare for greater than.
     * @return A new `Expr` representing the greater than comparison.
     */
    gt(other: any): Gt;

    /**
     * Creates an expression that checks if this expression is greater than or equal to another
     * expression.
     *
     * ```typescript
     * // Check if the 'quantity' field is greater than or equal to field 'requirement' plus 1
     * Field.of("quantity").gte(Field.of('requirement').add(1));
     * ```
     *
     * @param other The expression to compare for greater than or equal to.
     * @return A new `Expr` representing the greater than or equal to comparison.
     */
    gte(other: Expr): Gte;

    /**
     * Creates an expression that checks if this expression is greater than or equal to a constant
     * value.
     *
     * ```typescript
     * // Check if the 'score' field is greater than or equal to 80
     * Field.of("score").gte(80);
     * ```
     *
     * @param other The constant value to compare for greater than or equal to.
     * @return A new `Expr` representing the greater than or equal to comparison.
     */
    gte(other: any): Gte;

    /**
     * Creates an expression that concatenates an array expression with one or more other arrays.
     *
     * ```typescript
     * // Combine the 'items' array with another array field.
     * Field.of("items").arrayConcat(Field.of("otherItems"));
     * ```
     *
     * @param arrays The array expressions to concatenate.
     * @return A new `Expr` representing the concatenated array.
     */
    arrayConcat(arrays: Expr[]): ArrayConcat;

    /**
     * Creates an expression that concatenates an array expression with one or more other arrays.
     *
     * ```typescript
     * // Combine the 'tags' array with a new array and an array field
     * Field.of("tags").arrayConcat(Arrays.asList("newTag1", "newTag2"), Field.of("otherTag"));
     * ```
     *
     * @param arrays The array expressions or values to concatenate.
     * @return A new `Expr` representing the concatenated array.
     */
    arrayConcat(arrays: any[]): ArrayConcat;

    /**
     * Creates an expression that checks if an array contains a specific element.
     *
     * ```typescript
     * // Check if the 'sizes' array contains the value from the 'selectedSize' field
     * Field.of("sizes").arrayContains(Field.of("selectedSize"));
     * ```
     *
     * @param element The element to search for in the array.
     * @return A new `Expr` representing the 'array_contains' comparison.
     */
    arrayContains(element: Expr): ArrayContains;

    /**
     * Creates an expression that checks if an array contains a specific value.
     *
     * ```typescript
     * // Check if the 'colors' array contains "red"
     * Field.of("colors").arrayContains("red");
     * ```
     *
     * @param element The element to search for in the array.
     * @return A new `Expr` representing the 'array_contains' comparison.
     */
    arrayContains(element: any): ArrayContains;

    /**
     * Creates an expression that checks if an array contains all the specified elements.
     *
     * ```typescript
     * // Check if the 'tags' array contains both "news" and "sports"
     * Field.of("tags").arrayContainsAll(Field.of("tag1"), Field.of("tag2"));
     * ```
     *
     * @param values The elements to check for in the array.
     * @return A new `Expr` representing the 'array_contains_all' comparison.
     */
    arrayContainsAll(...values: Expr[]): ArrayContainsAll;

    /**
     * Creates an expression that checks if an array contains all the specified elements.
     *
     * ```typescript
     * // Check if the 'tags' array contains both of the values from field 'tag1' and "tag2"
     * Field.of("tags").arrayContainsAll(Field.of("tag1"), Field.of("tag2"));
     * ```
     *
     * @param values The elements to check for in the array.
     * @return A new `Expr` representing the 'array_contains_all' comparison.
     */
    arrayContainsAll(...values: any[]): ArrayContainsAll;

    /**
     * Creates an expression that checks if an array contains any of the specified elements.
     *
     * ```typescript
     * // Check if the 'categories' array contains either values from field "cate1" or "cate2"
     * Field.of("categories").arrayContainsAny(Field.of("cate1"), Field.of("cate2"));
     * ```
     *
     * @param values The elements to check for in the array.
     * @return A new `Expr` representing the 'array_contains_any' comparison.
     */
    arrayContainsAny(...values: Expr[]): ArrayContainsAny;

    /**
     * Creates an expression that checks if an array contains any of the specified elements.
     *
     * ```typescript
     * // Check if the 'groups' array contains either the value from the 'userGroup' field
     * // or the value "guest"
     * Field.of("groups").arrayContainsAny(Field.of("userGroup"), "guest");
     * ```
     *
     * @param values The elements to check for in the array.
     * @return A new `Expr` representing the 'array_contains_any' comparison.
     */
    arrayContainsAny(...values: any[]): ArrayContainsAny;

    /**
     * Creates an expression that calculates the length of an array.
     *
     * ```typescript
     * // Get the number of items in the 'cart' array
     * Field.of("cart").arrayLength();
     * ```
     *
     * @return A new `Expr` representing the length of the array.
     */
    arrayLength(): ArrayLength;

    /**
     * Creates an expression that checks if this expression is equal to any of the provided values or
     * expressions.
     *
     * ```typescript
     * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
     * Field.of("category").in("Electronics", Field.of("primaryType"));
     * ```
     *
     * @param others The values or expressions to check against.
     * @return A new `Expr` representing the 'IN' comparison.
     */
    eqAny(...others: Expr[]): EqAny;

    /**
     * Creates an expression that checks if this expression is equal to any of the provided values or
     * expressions.
     *
     * ```typescript
     * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
     * Field.of("category").in("Electronics", Field.of("primaryType"));
     * ```
     *
     * @param others The values or expressions to check against.
     * @return A new `Expr` representing the 'IN' comparison.
     */
    eqAny(...others: any[]): EqAny;

    /**
     * Creates an expression that checks if this expression evaluates to 'NaN' (Not a Number).
     *
     * ```typescript
     * // Check if the result of a calculation is NaN
     * Field.of("value").divide(0).isNaN();
     * ```
     *
     * @return A new `Expr` representing the 'isNaN' check.
     */
    isNaN(): IsNan;

    /**
     * Creates an expression that checks if a field exists in the document.
     *
     * ```typescript
     * // Check if the document has a field named "phoneNumber"
     * Field.of("phoneNumber").exists();
     * ```
     *
     * @return A new `Expr` representing the 'exists' check.
     */
    exists(): Exists;

    /**
     * Creates an expression that calculates the character length of a string in UTF-8.
     *
     * ```typescript
     * // Get the character length of the 'name' field of UTF-8.
     * Field.of("name").strLength();
     * ```
     *
     * @return A new `Expr` representing the length of the string.
     */
    charLength(): CharLength;

    /**
     * Creates an expression that performs a case-sensitive string comparison.
     *
     * ```typescript
     * // Check if the 'title' field contains the word "guide" (case-sensitive)
     * Field.of("title").like("%guide%");
     * ```
     *
     * @param pattern The pattern to search for. You can use "%" as a wildcard character.
     * @return A new `Expr` representing the 'like' comparison.
     */
    like(pattern: string): Like;

    /**
     * Creates an expression that performs a case-sensitive string comparison.
     *
     * ```typescript
     * // Check if the 'title' field contains the word "guide" (case-sensitive)
     * Field.of("title").like("%guide%");
     * ```
     *
     * @param pattern The pattern to search for. You can use "%" as a wildcard character.
     * @return A new `Expr` representing the 'like' comparison.
     */
    like(pattern: Expr): Like;

    /**
     * Creates an expression that checks if a string contains a specified regular expression as a
     * substring.
     *
     * ```typescript
     * // Check if the 'description' field contains "example" (case-insensitive)
     * Field.of("description").regexContains("(?i)example");
     * ```
     *
     * @param pattern The regular expression to use for the search.
     * @return A new `Expr` representing the 'contains' comparison.
     */
    regexContains(pattern: string): RegexContains;

    /**
     * Creates an expression that checks if a string contains a specified regular expression as a
     * substring.
     *
     * ```typescript
     * // Check if the 'description' field contains the regular expression stored in field 'regex'
     * Field.of("description").regexContains(Field.of("regex"));
     * ```
     *
     * @param pattern The regular expression to use for the search.
     * @return A new `Expr` representing the 'contains' comparison.
     */
    regexContains(pattern: Expr): RegexContains;

    /**
     * Creates an expression that checks if a string matches a specified regular expression.
     *
     * ```typescript
     * // Check if the 'email' field matches a valid email pattern
     * Field.of("email").regexMatch("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
     * ```
     *
     * @param pattern The regular expression to use for the match.
     * @return A new `Expr` representing the regular expression match.
     */
    regexMatch(pattern: string): RegexMatch;

    /**
     * Creates an expression that checks if a string matches a specified regular expression.
     *
     * ```typescript
     * // Check if the 'email' field matches a regular expression stored in field 'regex'
     * Field.of("email").regexMatch(Field.of("regex"));
     * ```
     *
     * @param pattern The regular expression to use for the match.
     * @return A new `Expr` representing the regular expression match.
     */
    regexMatch(pattern: Expr): RegexMatch;

    /**
     * Creates an expression that checks if this string expression contains a specified substring.
     *
     * ```typescript
     * // Check if the 'description' field contains "example".
     * Field.of("description").strContains("example");
     * ```
     *
     * @param substring The substring to search for.
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    strContains(substring: string): StrContains;

    /**
     * Creates an expression that checks if this string expression contains the string represented by another expression.
     *
     * ```typescript
     * // Check if the 'description' field contains the value of the 'keyword' field.
     * Field.of("description").strContains(Field.of("keyword"));
     * ```
     *
     * @param expr The expression representing the substring to search for.
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    strContains(expr: Expr): StrContains;

    /**
     * Creates an expression that checks if a string starts with a given prefix.
     *
     * ```typescript
     * // Check if the 'name' field starts with "Mr."
     * Field.of("name").startsWith("Mr.");
     * ```
     *
     * @param prefix The prefix to check for.
     * @return A new `Expr` representing the 'starts with' comparison.
     */
    startsWith(prefix: string): StartsWith;

    /**
     * Creates an expression that checks if a string starts with a given prefix (represented as an
     * expression).
     *
     * ```typescript
     * // Check if the 'fullName' field starts with the value of the 'firstName' field
     * Field.of("fullName").startsWith(Field.of("firstName"));
     * ```
     *
     * @param prefix The prefix expression to check for.
     * @return A new `Expr` representing the 'starts with' comparison.
     */
    startsWith(prefix: Expr): StartsWith;

    /**
     * Creates an expression that checks if a string ends with a given postfix.
     *
     * ```typescript
     * // Check if the 'filename' field ends with ".txt"
     * Field.of("filename").endsWith(".txt");
     * ```
     *
     * @param suffix The postfix to check for.
     * @return A new `Expr` representing the 'ends with' comparison.
     */
    endsWith(suffix: string): EndsWith;

    /**
     * Creates an expression that checks if a string ends with a given postfix (represented as an
     * expression).
     *
     * ```typescript
     * // Check if the 'url' field ends with the value of the 'extension' field
     * Field.of("url").endsWith(Field.of("extension"));
     * ```
     *
     * @param suffix The postfix expression to check for.
     * @return A new `Expr` representing the 'ends with' comparison.
     */
    endsWith(suffix: Expr): EndsWith;

    /**
     * Creates an expression that converts a string to lowercase.
     *
     * ```typescript
     * // Convert the 'name' field to lowercase
     * Field.of("name").toLower();
     * ```
     *
     * @return A new `Expr` representing the lowercase string.
     */
    toLower(): ToLower;

    /**
     * Creates an expression that converts a string to uppercase.
     *
     * ```typescript
     * // Convert the 'title' field to uppercase
     * Field.of("title").toUpper();
     * ```
     *
     * @return A new `Expr` representing the uppercase string.
     */
    toUpper(): ToUpper;

    /**
     * Creates an expression that removes leading and trailing whitespace from a string.
     *
     * ```typescript
     * // Trim whitespace from the 'userInput' field
     * Field.of("userInput").trim();
     * ```
     *
     * @return A new `Expr` representing the trimmed string.
     */
    trim(): Trim;

    /**
     * Creates an expression that concatenates string expressions together.
     *
     * ```typescript
     * // Combine the 'firstName', " ", and 'lastName' fields into a single string
     * Field.of("firstName").strConcat(Constant.of(" "), Field.of("lastName"));
     * ```
     *
     * @param elements The expressions (typically strings) to concatenate.
     * @return A new `Expr` representing the concatenated string.
     */
    strConcat(...elements: (string | Expr)[]): StrConcat;

    /**
     * Creates an expression that reverses this string expression.
     *
     * ```typescript
     * // Reverse the value of the 'myString' field.
     * Field.of("myString").reverse();
     * ```
     *
     * @return A new {@code Expr} representing the reversed string.
     */
    reverse(): Reverse;

    /**
     * Creates an expression that replaces the first occurrence of a substring within this string expression with another substring.
     *
     * ```typescript
     * // Replace the first occurrence of "hello" with "hi" in the 'message' field
     * Field.of("message").replaceFirst("hello", "hi");
     * ```
     *
     * @param find The substring to search for.
     * @param replace The substring to replace the first occurrence of 'find' with.
     * @return A new {@code Expr} representing the string with the first occurrence replaced.
     */
    replaceFirst(find: string, replace: string): ReplaceFirst;

    /**
     * Creates an expression that replaces the first occurrence of a substring within this string expression with another substring,
     * where the substring to find and the replacement substring are specified by expressions.
     *
     * ```typescript
     * // Replace the first occurrence of the value in 'findField' with the value in 'replaceField' in the 'message' field
     * Field.of("message").replaceFirst(Field.of("findField"), Field.of("replaceField"));
     * ```
     *
     * @param find The expression representing the substring to search for.
     * @param replace The expression representing the substring to replace the first occurrence of 'find' with.
     * @return A new {@code Expr} representing the string with the first occurrence replaced.
     */
    replaceFirst(find: Expr, replace: Expr): ReplaceFirst;

    /**
     * Creates an expression that replaces all occurrences of a substring within this string expression with another substring.
     *
     * ```typescript
     * // Replace all occurrences of "hello" with "hi" in the 'message' field
     * Field.of("message").replaceAll("hello", "hi");
     * ```
     *
     * @param find The substring to search for.
     * @param replace The substring to replace all occurrences of 'find' with.
     * @return A new {@code Expr} representing the string with all occurrences replaced.
     */
    replaceAll(find: string, replace: string): ReplaceAll;

    /**
     * Creates an expression that replaces all occurrences of a substring within this string expression with another substring,
     * where the substring to find and the replacement substring are specified by expressions.
     *
     * ```typescript
     * // Replace all occurrences of the value in 'findField' with the value in 'replaceField' in the 'message' field
     * Field.of("message").replaceAll(Field.of("findField"), Field.of("replaceField"));
     * ```
     *
     * @param find The expression representing the substring to search for.
     * @param replace The expression representing the substring to replace all occurrences of 'find' with.
     * @return A new {@code Expr} representing the string with all occurrences replaced.
     */
    replaceAll(find: Expr, replace: Expr): ReplaceAll;

    /**
     * Creates an expression that calculates the length of this string expression in bytes.
     *
     * ```typescript
     * // Calculate the length of the 'myString' field in bytes.
     * Field.of("myString").byteLength();
     * ```
     *
     * @return A new {@code Expr} representing the length of the string in bytes.
     */
    byteLength(): ByteLength;

    /**
     * Accesses a value from a map (object) field using the provided key.
     *
     * ```typescript
     * // Get the 'city' value from the 'address' map field
     * Field.of("address").mapGet("city");
     * ```
     *
     * @param subfield The key to access in the map.
     * @return A new `Expr` representing the value associated with the given key in the map.
     */
    mapGet(subfield: string): MapGet;

    /**
     * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
     * expression or field.
     *
     * ```typescript
     * // Count the total number of products
     * Field.of("productId").count().as("totalProducts");
     * ```
     *
     * @return A new `Accumulator` representing the 'count' aggregation.
     */
    count(): Count;

    /**
     * Creates an aggregation that calculates the sum of a numeric field across multiple stage inputs.
     *
     * ```typescript
     * // Calculate the total revenue from a set of orders
     * Field.of("orderAmount").sum().as("totalRevenue");
     * ```
     *
     * @return A new `Accumulator` representing the 'sum' aggregation.
     */
    sum(): Sum;

    /**
     * Creates an aggregation that calculates the average (mean) of a numeric field across multiple
     * stage inputs.
     *
     * ```typescript
     * // Calculate the average age of users
     * Field.of("age").avg().as("averageAge");
     * ```
     *
     * @return A new `Accumulator` representing the 'avg' aggregation.
     */
    avg(): Avg;

    /**
     * Creates an aggregation that finds the minimum value of a field across multiple stage inputs.
     *
     * ```typescript
     * // Find the lowest price of all products
     * Field.of("price").minimum().as("lowestPrice");
     * ```
     *
     * @return A new `Accumulator` representing the 'minimum' aggregation.
     */
    minimum(): Minimum;

    /**
     * Creates an aggregation that finds the maximum value of a field across multiple stage inputs.
     *
     * ```typescript
     * // Find the highest score in a leaderboard
     * Field.of("score").maximum().as("highestScore");
     * ```
     *
     * @return A new `Accumulator` representing the 'maximum' aggregation.
     */
    maximum(): Maximim;

    /**
     * Creates an expression that returns the larger value between this expression and another expression, based on Firestore's value type ordering.
     *
     * ```typescript
     * // Returns the larger value between the 'timestamp' field and the current timestamp.
     * Field.of("timestamp").logicalMaximum(Function.currentTimestamp());
     * ```
     *
     * @param other The expression to compare with.
     * @return A new {@code Expr} representing the logical maximum operation.
     */
    logicalMaximum(other: Expr): LogicalMaximum;

    /**
     * Creates an expression that returns the larger value between this expression and a constant value, based on Firestore's value type ordering.
     *
     * ```typescript
     * // Returns the larger value between the 'value' field and 10.
     * Field.of("value").logicalMaximum(10);
     * ```
     *
     * @param other The constant value to compare with.
     * @return A new {@code Expr} representing the logical maximum operation.
     */
    logicalMaximum(other: any): LogicalMaximum;

    /**
     * Creates an expression that returns the smaller value between this expression and another expression, based on Firestore's value type ordering.
     *
     * ```typescript
     * // Returns the smaller value between the 'timestamp' field and the current timestamp.
     * Field.of("timestamp").logicalMinimum(Function.currentTimestamp());
     * ```
     *
     * @param other The expression to compare with.
     * @return A new {@code Expr} representing the logical minimum operation.
     */
    logicalMinimum(other: Expr): LogicalMinimum;

    /**
     * Creates an expression that returns the smaller value between this expression and a constant value, based on Firestore's value type ordering.
     *
     * ```typescript
     * // Returns the smaller value between the 'value' field and 10.
     * Field.of("value").logicalMinimum(10);
     * ```
     *
     * @param other The constant value to compare with.
     * @return A new {@code Expr} representing the logical minimum operation.
     */
    logicalMinimum(other: any): LogicalMinimum;

    /**
     * Creates an expression that calculates the length (number of dimensions) of this Firestore Vector expression.
     *
     * ```typescript
     * // Get the vector length (dimension) of the field 'embedding'.
     * Field.of("embedding").vectorLength();
     * ```
     *
     * @return A new {@code Expr} representing the length of the vector.
     */
    vectorLength(): VectorLength;

    /**
     * Calculates the cosine distance between two vectors.
     *
     * ```typescript
     * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
     * Field.of("userVector").cosineDistance(Field.of("itemVector"));
     * ```
     *
     * @param other The other vector (represented as an Expr) to compare against.
     * @return A new `Expr` representing the cosine distance between the two vectors.
     */
    cosineDistance(other: Expr): CosineDistance;
    /**
     * Calculates the Cosine distance between two vectors.
     *
     * ```typescript
     * // Calculate the Cosine distance between the 'location' field and a target location
     * Field.of("location").cosineDistance(new VectorValue([37.7749, -122.4194]));
     * ```
     *
     * @param other The other vector (as a VectorValue) to compare against.
     * @return A new `Expr` representing the Cosine* distance between the two vectors.
     */
    cosineDistance(other: VectorValue): CosineDistance;
    /**
     * Calculates the Cosine distance between two vectors.
     *
     * ```typescript
     * // Calculate the Cosine distance between the 'location' field and a target location
     * Field.of("location").cosineDistance([37.7749, -122.4194]);
     * ```
     *
     * @param other The other vector (as an array of numbers) to compare against.
     * @return A new `Expr` representing the Cosine distance between the two vectors.
     */
    cosineDistance(other: number[]): CosineDistance;

    /**
     * Calculates the dot product between two vectors.
     *
     * ```typescript
     * // Calculate the dot product between a feature vector and a target vector
     * Field.of("features").dotProduct([0.5, 0.8, 0.2]);
     * ```
     *
     * @param other The other vector (as an array of numbers) to calculate with.
     * @return A new `Expr` representing the dot product between the two vectors.
     */
    dotProduct(other: Expr): DotProduct;

    /**
     * Calculates the dot product between two vectors.
     *
     * ```typescript
     * // Calculate the dot product between a feature vector and a target vector
     * Field.of("features").dotProduct(new VectorValue([0.5, 0.8, 0.2]));
     * ```
     *
     * @param other The other vector (as an array of numbers) to calculate with.
     * @return A new `Expr` representing the dot product between the two vectors.
     */
    dotProduct(other: VectorValue): DotProduct;

    /**
     * Calculates the dot product between two vectors.
     *
     * ```typescript
     * // Calculate the dot product between a feature vector and a target vector
     * Field.of("features").dotProduct([0.5, 0.8, 0.2]);
     * ```
     *
     * @param other The other vector (as an array of numbers) to calculate with.
     * @return A new `Expr` representing the dot product between the two vectors.
     */
    dotProduct(other: number[]): DotProduct;

    /**
     * Calculates the Euclidean distance between two vectors.
     *
     * ```typescript
     * // Calculate the Euclidean distance between the 'location' field and a target location
     * Field.of("location").euclideanDistance([37.7749, -122.4194]);
     * ```
     *
     * @param other The other vector (as an array of numbers) to calculate with.
     * @return A new `Expr` representing the Euclidean distance between the two vectors.
     */
    euclideanDistance(other: Expr): EuclideanDistance;

    /**
     * Calculates the Euclidean distance between two vectors.
     *
     * ```typescript
     * // Calculate the Euclidean distance between the 'location' field and a target location
     * Field.of("location").euclideanDistance(new VectorValue([37.7749, -122.4194]));
     * ```
     *
     * @param other The other vector (as a VectorValue) to compare against.
     * @return A new `Expr` representing the Euclidean distance between the two vectors.
     */
    euclideanDistance(other: VectorValue): EuclideanDistance;

    /**
     * Calculates the Euclidean distance between two vectors.
     *
     * ```typescript
     * // Calculate the Euclidean distance between the 'location' field and a target location
     * Field.of("location").euclideanDistance([37.7749, -122.4194]);
     * ```
     *
     * @param other The other vector (as an array of numbers) to compare against.
     * @return A new `Expr` representing the Euclidean distance between the two vectors.
     */
    euclideanDistance(other: number[]): EuclideanDistance;

    /**
     * Creates an expression that interprets this expression as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'microseconds' field as microseconds since epoch.
     * Field.of("microseconds").unixMicrosToTimestamp();
     * ```
     *
     * @return A new {@code Expr} representing the timestamp.
     */
    unixMicrosToTimestamp(): UnixMicrosToTimestamp;

    /**
     * Creates an expression that converts this timestamp expression to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to microseconds since epoch.
     * Field.of("timestamp").timestampToUnixMicros();
     * ```
     *
     * @return A new {@code Expr} representing the number of microseconds since epoch.
     */
    timestampToUnixMicros(): TimestampToUnixMicros;

    /**
     * Creates an expression that interprets this expression as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'milliseconds' field as milliseconds since epoch.
     * Field.of("milliseconds").unixMillisToTimestamp();
     * ```
     *
     * @return A new {@code Expr} representing the timestamp.
     */
    unixMillisToTimestamp(): UnixMillisToTimestamp;

    /**
     * Creates an expression that converts this timestamp expression to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to milliseconds since epoch.
     * Field.of("timestamp").timestampToUnixMillis();
     * ```
     *
     * @return A new {@code Expr} representing the number of milliseconds since epoch.
     */
    timestampToUnixMillis(): TimestampToUnixMillis;

    /**
     * Creates an expression that interprets this expression as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'seconds' field as seconds since epoch.
     * Field.of("seconds").unixSecondsToTimestamp();
     * ```
     *
     * @return A new {@code Expr} representing the timestamp.
     */
    unixSecondsToTimestamp(): UnixSecondsToTimestamp;

    /**
     * Creates an expression that converts this timestamp expression to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to seconds since epoch.
     * Field.of("timestamp").timestampToUnixSeconds();
     * ```
     *
     * @return A new {@code Expr} representing the number of seconds since epoch.
     */
    timestampToUnixSeconds(): TimestampToUnixSeconds;

    /**
     * Creates an expression that adds a specified amount of time to this timestamp expression.
     *
     * ```typescript
     * // Add some duration determined by field 'unit' and 'amount' to the 'timestamp' field.
     * Field.of("timestamp").timestampAdd(Field.of("unit"), Field.of("amount"));
     * ```
     *
     * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
     * @param amount The expression evaluates to amount of the unit.
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    timestampAdd(unit: Expr, amount: Expr): TimestampAdd;

    /**
     * Creates an expression that adds a specified amount of time to this timestamp expression.
     *
     * ```typescript
     * // Add 1 day to the 'timestamp' field.
     * Field.of("timestamp").timestampAdd("day", 1);
     * ```
     *
     * @param unit The unit of time to add (e.g., "day", "hour").
     * @param amount The amount of time to add.
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    timestampAdd(
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): TimestampAdd;

    /**
     * Creates an expression that subtracts a specified amount of time from this timestamp expression.
     *
     * ```typescript
     * // Subtract some duration determined by field 'unit' and 'amount' from the 'timestamp' field.
     * Field.of("timestamp").timestampSub(Field.of("unit"), Field.of("amount"));
     * ```
     *
     * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
     * @param amount The expression evaluates to amount of the unit.
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    timestampSub(unit: Expr, amount: Expr): TimestampSub;

    /**
     * Creates an expression that subtracts a specified amount of time from this timestamp expression.
     *
     * ```typescript
     * // Subtract 1 day from the 'timestamp' field.
     * Field.of("timestamp").timestampSub("day", 1);
     * ```
     *
     * @param unit The unit of time to subtract (e.g., "day", "hour").
     * @param amount The amount of time to subtract.
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    timestampSub(
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): TimestampSub;

    /**
     * Creates an {@link Ordering} that sorts documents in ascending order based on this expression.
     *
     * ```typescript
     * // Sort documents by the 'name' field in ascending order
     * firestore.pipeline().collection("users")
     *   .sort(Field.of("name").ascending());
     * ```
     *
     * @return A new `Ordering` for ascending sorting.
     */
    ascending(): Ordering;

    /**
     * Creates an {@link Ordering} that sorts documents in descending order based on this expression.
     *
     * ```typescript
     * // Sort documents by the 'createdAt' field in descending order
     * firestore.pipeline().collection("users")
     *   .sort(Field.of("createdAt").descending());
     * ```
     *
     * @return A new `Ordering` for descending sorting.
     */
    descending(): Ordering;

    /**
     * Assigns an alias to this expression.
     *
     * Aliases are useful for renaming fields in the output of a stage or for giving meaningful
     * names to calculated values.
     *
     * ```typescript
     * // Calculate the total price and assign it the alias "totalPrice" and add it to the output.
     * firestore.pipeline().collection("items")
     *   .addFields(Field.of("price").multiply(Field.of("quantity")).as("totalPrice"));
     * ```
     *
     * @param name The alias to assign to this expression.
     * @return A new {@link ExprWithAlias} that wraps this
     *     expression and associates it with the provided alias.
     */
    as(name: string): ExprWithAlias<typeof this>;
  }

  /**
   * @beta
   */
  export class ExprWithAlias<T extends Expr>
    extends Expr
    implements Selectable
  {
    exprType: ExprType;
    selectable: true;
    /**
     * @param expr The expression to alias.
     * @param alias The alias to assign to the expression.
     */
    constructor(expr: T, alias: string);
  }

  /**
   * @beta
   *
   * Represents a reference to a field in a Firestore document, or outputs of a {@link Pipeline} stage.
   *
   * <p>Field references are used to access document field values in expressions and to specify fields
   * for sorting, filtering, and projecting data in Firestore pipelines.
   *
   * <p>You can create a `Field` instance using the static {@link #of} method:
   *
   * ```typescript
   * // Create a Field instance for the 'name' field
   * const nameField = Field.of("name");
   *
   * // Create a Field instance for a nested field 'address.city'
   * const cityField = Field.of("address.city");
   * ```
   */
  export class Field extends Expr implements Selectable {
    exprType: ExprType;
    selectable: true;

    /**
     * Creates a {@code Field} instance representing the field at the given path.
     *
     * The path can be a simple field name (e.g., "name") or a dot-separated path to a nested field
     * (e.g., "address.city").
     *
     * ```typescript
     * // Create a Field instance for the 'title' field
     * const titleField = Field.of("title");
     *
     * // Create a Field instance for a nested field 'author.firstName'
     * const authorFirstNameField = Field.of("author.firstName");
     * ```
     *
     * @param name The path to the field.
     * @return A new {@code Field} instance representing the specified field.
     */
    static of(name: string): Field;
    static of(path: FieldPath): Field;
    static of(nameOrPath: string | FieldPath): Field;
    static of(pipeline: Pipeline, name: string): Field;
    /**
     * Returns the field name.
     *
     * @return The field name.
     */
    fieldName(): string;
  }

  /**
   * @beta
   */
  export class Fields extends Expr implements Selectable {
    exprType: ExprType;
    selectable: true;
    static of(name: string, ...others: string[]): Fields;
    static ofAll(): Fields;
    /**
     * Returns the list of fields.
     *
     * @return The list of fields.
     */
    fieldList(): Field[];
  }

  /**
   * @beta
   *
   * Represents a constant value that can be used in a Firestore pipeline expression.
   *
   * You can create a `Constant` instance using the static {@link #of} method:
   *
   * ```typescript
   * // Create a Constant instance for the number 10
   * const ten = Constant.of(10);
   *
   * // Create a Constant instance for the string "hello"
   * const hello = Constant.of("hello");
   * ```
   */
  export class Constant extends Expr {
    exprType: ExprType;

    /**
     * Creates a `Constant` instance for a number value.
     *
     * @param value The number value.
     * @return A new `Constant` instance.
     */
    static of(value: number): Constant;

    /**
     * Creates a `Constant` instance for a string value.
     *
     * @param value The string value.
     * @return A new `Constant` instance.
     */
    static of(value: string): Constant;

    /**
     * Creates a `Constant` instance for a boolean value.
     *
     * @param value The boolean value.
     * @return A new `Constant` instance.
     */
    static of(value: boolean): Constant;

    /**
     * Creates a `Constant` instance for a null value.
     *
     * @param value The null value.
     * @return A new `Constant` instance.
     */
    static of(value: null): Constant;

    /**
     * Creates a `Constant` instance for an undefined value.
     *
     * @param value The undefined value.
     * @return A new `Constant` instance.
     */
    static of(value: undefined): Constant;

    /**
     * Creates a `Constant` instance for a GeoPoint value.
     *
     * @param value The GeoPoint value.
     * @return A new `Constant` instance.
     */
    static of(value: GeoPoint): Constant;

    /**
     * Creates a `Constant` instance for a Timestamp value.
     *
     * @param value The Timestamp value.
     * @return A new `Constant` instance.
     */
    static of(value: Timestamp): Constant;

    /**
     * Creates a `Constant` instance for a Date value.
     *
     * @param value The Date value.
     * @return A new `Constant` instance.
     */
    static of(value: Date): Constant;

    /**
     * Creates a `Constant` instance for a Uint8Array value.
     *
     * @param value The Uint8Array value.
     * @return A new `Constant` instance.
     */
    static of(value: Uint8Array): Constant;

    /**
     * Creates a `Constant` instance for a DocumentReference value.
     *
     * @param value The DocumentReference value.
     * @return A new `Constant` instance.
     */
    static of(value: DocumentReference): Constant;

    /**
     * Creates a `Constant` instance for an array value.
     *
     * @param value The array value.
     * @return A new `Constant` instance.
     */
    static of(value: Array<any>): Constant;

    /**
     * Creates a `Constant` instance for a map value.
     *
     * @param value The map value.
     * @return A new `Constant` instance.
     */
    static of(value: Map<string, any>): Constant;

    /**
     * Creates a `Constant` instance for a VectorValue value.
     *
     * @param value The VectorValue value.
     * @return A new `Constant` instance.
     */
    static of(value: VectorValue): Constant;
    static of(value: any): Constant;

    /**
     * Creates a `Constant` instance for a VectorValue value.
     *
     * ```typescript
     * // Create a Constant instance for a vector value
     * const vectorConstant = Constant.ofVector([1, 2, 3]);
     * ```
     *
     * @param value The VectorValue value.
     * @return A new `Constant` instance.
     */
    static vector(value: Array<number> | VectorValue): Constant;
  }

  /**
   * @beta
   *
   * This class defines the base class for Firestore {@link Pipeline} functions, which can be evaluated within pipeline
   * execution.
   *
   * Typically, you would not use this class or its children directly. Use either the functions like {@link and}, {@link eq},
   * or the methods on {@link Expr} ({@link Expr#eq}, {@link Expr#lt}, etc) to construct new Function instances.
   */
  export class Function extends Expr {
    exprType: ExprType;
  }

  /**
   * @beta
   */
  export class Add extends Function {}

  /**
   * @beta
   */
  export class Subtract extends Function {}

  /**
   * @beta
   */
  export class Multiply extends Function {}

  /**
   * @beta
   */
  export class Divide extends Function {}

  /**
   * @beta
   */
  export class Mod extends Function {}

  // /**
  //  * @beta
  //  */
  // export class BitAnd extends Function {}
  //
  // /**
  //  * @beta
  //  */
  // export class BitOr extends Function {}
  //
  // /**
  //  * @beta
  //  */
  // export class BitXor extends Function {}
  //
  // /**
  //  * @beta
  //  */
  // export class BitNot extends Function {}
  //
  // /**
  //  * @beta
  //  */
  // export class BitLeftShift extends Function {}
  //
  // /**
  //  * @beta
  //  */
  // export class BitRightShift extends Function {}

  /**
   * @beta
   */
  export class Eq extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class Neq extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class Lt extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class Lte extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class Gt extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class Gte extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class ArrayConcat extends Function {}

  /**
   * @beta
   */
  export class ArrayContains extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class ArrayContainsAll extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class ArrayContainsAny extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class ArrayLength extends Function {}

  /**
   * @beta
   */
  export class EqAny extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class IsNan extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class Exists extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class Not extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class And extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class Or extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class Xor extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class If extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class LogicalMaximum extends Function {}

  /**
   * @beta
   */
  export class LogicalMinimum extends Function {}

  /**
   * @beta
   */
  export class CharLength extends Function {}

  /**
   * @beta
   */
  export class Like extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class RegexContains extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class RegexMatch extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class StrContains extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class StartsWith extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class EndsWith extends Function implements FilterCondition {
    filterable: true;
  }

  /**
   * @beta
   */
  export class ToLower extends Function {}

  /**
   * @beta
   */
  export class ToUpper extends Function {}

  /**
   * @beta
   */
  export class Trim extends Function {}

  /**
   * @beta
   */
  export class StrConcat extends Function {}

  /**
   * @beta
   */
  export class Reverse extends Function {}

  /**
   * @beta
   */
  export class ReplaceFirst extends Function {}

  /**
   * @beta
   */
  export class ReplaceAll extends Function {}

  /**
   * @beta
   */
  export class ByteLength extends Function {}

  /**
   * @beta
   */
  export class MapGet extends Function {}

  /**
   * @beta
   */
  export class Count extends Function implements Accumulator {
    accumulator: true;
  }

  /**
   * @beta
   */
  export class Sum extends Function implements Accumulator {
    accumulator: true;
  }

  /**
   * @beta
   */
  export class Avg extends Function implements Accumulator {
    accumulator: true;
  }

  /**
   * @beta
   */
  export class Minimum extends Function implements Accumulator {
    accumulator: true;
  }

  /**
   * @beta
   */
  export class Maximim extends Function implements Accumulator {
    accumulator: true;
  }

  /**
   * @beta
   */
  export class CosineDistance extends Function {}

  /**
   * @beta
   */
  export class DotProduct extends Function {}

  /**
   * @beta
   */
  export class EuclideanDistance extends Function {}

  /**
   * @beta
   */
  export class VectorLength extends Function {}

  /**
   * @beta
   */
  export class UnixMicrosToTimestamp extends Function {}

  /**
   * @beta
   */
  export class TimestampToUnixMicros extends Function {}

  /**
   * @beta
   */
  export class UnixMillisToTimestamp extends Function {}

  /**
   * @beta
   */
  export class TimestampToUnixMillis extends Function {}

  /**
   * @beta
   */
  export class UnixSecondsToTimestamp extends Function {}

  /**
   * @beta
   */
  export class TimestampToUnixSeconds extends Function {}

  /**
   * @beta
   */
  export class TimestampAdd extends Function {}

  /**
   * @beta
   */
  export class TimestampSub extends Function {}

  /**
   * @beta
   *
   * Creates an expression that adds two expressions together.
   *
   * ```typescript
   * // Add the value of the 'quantity' field and the 'reserve' field.
   * add(Field.of("quantity"), Field.of("reserve"));
   * ```
   *
   * @param left The first expression to add.
   * @param right The second expression to add.
   * @return A new {@code Expr} representing the addition operation.
   */
  export function add(left: Expr, right: Expr): Add;

  /**
   * @beta
   *
   * Creates an expression that adds an expression to a constant value.
   *
   * ```typescript
   * // Add 5 to the value of the 'age' field
   * add(Field.of("age"), 5);
   * ```
   *
   * @param left The expression to add to.
   * @param right The constant value to add.
   * @return A new {@code Expr} representing the addition operation.
   */
  export function add(left: Expr, right: any): Add;

  /**
   * @beta
   *
   * Creates an expression that adds a field's value to an expression.
   *
   * ```typescript
   * // Add the value of the 'quantity' field and the 'reserve' field.
   * add("quantity", Field.of("reserve"));
   * ```
   *
   * @param left The field name to add to.
   * @param right The expression to add.
   * @return A new {@code Expr} representing the addition operation.
   */
  export function add(left: string, right: Expr): Add;

  /**
   * @beta
   *
   * Creates an expression that adds a field's value to a constant value.
   *
   * ```typescript
   * // Add 5 to the value of the 'age' field
   * add("age", 5);
   * ```
   *
   * @param left The field name to add to.
   * @param right The constant value to add.
   * @return A new {@code Expr} representing the addition operation.
   */
  export function add(left: string, right: any): Add;

  /**
   * @beta
   *
   * Creates an expression that subtracts two expressions.
   *
   * ```typescript
   * // Subtract the 'discount' field from the 'price' field
   * subtract(Field.of("price"), Field.of("discount"));
   * ```
   *
   * @param left The expression to subtract from.
   * @param right The expression to subtract.
   * @return A new {@code Expr} representing the subtraction operation.
   */
  export function subtract(left: Expr, right: Expr): Subtract;

  /**
   * @beta
   *
   * Creates an expression that subtracts a constant value from an expression.
   *
   * ```typescript
   * // Subtract the constant value 2 from the 'value' field
   * subtract(Field.of("value"), 2);
   * ```
   *
   * @param left The expression to subtract from.
   * @param right The constant value to subtract.
   * @return A new {@code Expr} representing the subtraction operation.
   */
  export function subtract(left: Expr, right: any): Subtract;

  /**
   * @beta
   *
   * Creates an expression that subtracts an expression from a field's value.
   *
   * ```typescript
   * // Subtract the 'discount' field from the 'price' field
   * subtract("price", Field.of("discount"));
   * ```
   *
   * @param left The field name to subtract from.
   * @param right The expression to subtract.
   * @return A new {@code Expr} representing the subtraction operation.
   */
  export function subtract(left: string, right: Expr): Subtract;

  /**
   * @beta
   *
   * Creates an expression that subtracts a constant value from a field's value.
   *
   * ```typescript
   * // Subtract 20 from the value of the 'total' field
   * subtract("total", 20);
   * ```
   *
   * @param left The field name to subtract from.
   * @param right The constant value to subtract.
   * @return A new {@code Expr} representing the subtraction operation.
   */
  export function subtract(left: string, right: any): Subtract;

  /**
   * @beta
   *
   * Creates an expression that multiplies two expressions together.
   *
   * ```typescript
   * // Multiply the 'quantity' field by the 'price' field
   * multiply(Field.of("quantity"), Field.of("price"));
   * ```
   *
   * @param left The first expression to multiply.
   * @param right The second expression to multiply.
   * @return A new {@code Expr} representing the multiplication operation.
   */
  export function multiply(left: Expr, right: Expr): Multiply;

  /**
   * @beta
   *
   * Creates an expression that multiplies an expression by a constant value.
   *
   * ```typescript
   * // Multiply the value of the 'price' field by 2
   * multiply(Field.of("price"), 2);
   * ```
   *
   * @param left The expression to multiply.
   * @param right The constant value to multiply by.
   * @return A new {@code Expr} representing the multiplication operation.
   */
  export function multiply(left: Expr, right: any): Multiply;

  /**
   * @beta
   *
   * Creates an expression that multiplies a field's value by an expression.
   *
   * ```typescript
   * // Multiply the 'quantity' field by the 'price' field
   * multiply("quantity", Field.of("price"));
   * ```
   *
   * @param left The field name to multiply.
   * @param right The expression to multiply by.
   * @return A new {@code Expr} representing the multiplication operation.
   */
  export function multiply(left: string, right: Expr): Multiply;

  /**
   * @beta
   *
   * Creates an expression that multiplies a field's value by a constant value.
   *
   * ```typescript
   * // Multiply the 'value' field by 2
   * multiply("value", 2);
   * ```
   *
   * @param left The field name to multiply.
   * @param right The constant value to multiply by.
   * @return A new {@code Expr} representing the multiplication operation.
   */
  export function multiply(left: string, right: any): Multiply;

  /**
   * @beta
   *
   * Creates an expression that divides two expressions.
   *
   * ```typescript
   * // Divide the 'total' field by the 'count' field
   * divide(Field.of("total"), Field.of("count"));
   * ```
   *
   * @param left The expression to be divided.
   * @param right The expression to divide by.
   * @return A new {@code Expr} representing the division operation.
   */
  export function divide(left: Expr, right: Expr): Divide;

  /**
   * @beta
   *
   * Creates an expression that divides an expression by a constant value.
   *
   * ```typescript
   * // Divide the 'value' field by 10
   * divide(Field.of("value"), 10);
   * ```
   *
   * @param left The expression to be divided.
   * @param right The constant value to divide by.
   * @return A new {@code Expr} representing the division operation.
   */
  export function divide(left: Expr, right: any): Divide;

  /**
   * @beta
   *
   * Creates an expression that divides a field's value by an expression.
   *
   * ```typescript
   * // Divide the 'total' field by the 'count' field
   * divide("total", Field.of("count"));
   * ```
   *
   * @param left The field name to be divided.
   * @param right The expression to divide by.
   * @return A new {@code Expr} representing the division operation.
   */
  export function divide(left: string, right: Expr): Divide;

  /**
   * @beta
   *
   * Creates an expression that divides a field's value by a constant value.
   *
   * ```typescript
   * // Divide the 'value' field by 10
   * divide("value", 10);
   * ```
   *
   * @param left The field name to be divided.
   * @param right The constant value to divide by.
   * @return A new {@code Expr} representing the division operation.
   */
  export function divide(left: string, right: any): Divide;

  /**
   * @beta
   *
   * Creates an expression that calculates the modulo (remainder) of dividing two expressions.
   *
   * ```typescript
   * // Calculate the remainder of dividing 'field1' by 'field2'.
   * mod(Field.of("field1"), Field.of("field2"));
   * ```
   *
   * @param left The dividend expression.
   * @param right The divisor expression.
   * @return A new {@code Expr} representing the modulo operation.
   */
  export function mod(left: Expr, right: Expr): Mod;

  /**
   * @beta
   *
   * Creates an expression that calculates the modulo (remainder) of dividing an expression by a constant.
   *
   * ```typescript
   * // Calculate the remainder of dividing 'field1' by 5.
   * mod(Field.of("field1"), 5);
   * ```
   *
   * @param left The dividend expression.
   * @param right The divisor constant.
   * @return A new {@code Expr} representing the modulo operation.
   */
  export function mod(left: Expr, right: any): Mod;

  /**
   * @beta
   *
   * Creates an expression that calculates the modulo (remainder) of dividing a field's value by an expression.
   *
   * ```typescript
   * // Calculate the remainder of dividing 'field1' by 'field2'.
   * mod("field1", Field.of("field2"));
   * ```
   *
   * @param left The dividend field name.
   * @param right The divisor expression.
   * @return A new {@code Expr} representing the modulo operation.
   */
  export function mod(left: string, right: Expr): Mod;

  /**
   * @beta
   *
   * Creates an expression that calculates the modulo (remainder) of dividing a field's value by a constant.
   *
   * ```typescript
   * // Calculate the remainder of dividing 'field1' by 5.
   * mod("field1", 5);
   * ```
   *
   * @param left The dividend field name.
   * @param right The divisor constant.
   * @return A new {@code Expr} representing the modulo operation.
   */
  export function mod(left: string, right: any): Mod;

  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise AND operation between two expressions.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise AND of 'field1' and 'field2'.
  //  * bitAnd(Field.of("field1"), Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand expression.
  //  * @return A new {@code Expr} representing the bitwise AND operation.
  //  */
  // export function bitAnd(left: Expr, right: Expr): BitAnd;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise AND operation between an expression and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise AND of 'field1' and 0xFF.
  //  * bitAnd(Field.of("field1"), 0xFF);
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand constant.
  //  * @return A new {@code Expr} representing the bitwise AND operation.
  //  */
  // export function bitAnd(left: Expr, right: any): BitAnd;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise AND operation between a field and an expression.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise AND of 'field1' and 'field2'.
  //  * bitAnd("field1", Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand expression.
  //  * @return A new {@code Expr} representing the bitwise AND operation.
  //  */
  // export function bitAnd(left: string, right: Expr): BitAnd;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise AND operation between a field and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise AND of 'field1' and 0xFF.
  //  * bitAnd("field1", 0xFF);
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand constant.
  //  * @return A new {@code Expr} representing the bitwise AND operation.
  //  */
  // export function bitAnd(left: string, right: any): BitAnd;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise OR operation between two expressions.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise OR of 'field1' and 'field2'.
  //  * bitOr(Field.of("field1"), Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand expression.
  //  * @return A new {@code Expr} representing the bitwise OR operation.
  //  */
  // export function bitOr(left: Expr, right: Expr): BitOr;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise OR operation between an expression and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise OR of 'field1' and 0xFF.
  //  * bitOr(Field.of("field1"), 0xFF);
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand constant.
  //  * @return A new {@code Expr} representing the bitwise OR operation.
  //  */
  // export function bitOr(left: Expr, right: any): BitOr;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise OR operation between a field and an expression.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise OR of 'field1' and 'field2'.
  //  * bitOr("field1", Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand expression.
  //  * @return A new {@code Expr} representing the bitwise OR operation.
  //  */
  // export function bitOr(left: string, right: Expr): BitOr;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise OR operation between a field and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise OR of 'field1' and 0xFF.
  //  * bitOr("field1", 0xFF);
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand constant.
  //  * @return A new {@code Expr} representing the bitwise OR operation.
  //  */
  // export function bitOr(left: string, right: any): BitOr;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise XOR operation between two expressions.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise XOR of 'field1' and 'field2'.
  //  * bitXor(Field.of("field1"), Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand expression.
  //  * @return A new {@code Expr} representing the bitwise XOR operation.
  //  */
  // export function bitXor(left: Expr, right: Expr): BitXor;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise XOR operation between an expression and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise XOR of 'field1' and 0xFF.
  //  * bitXor(Field.of("field1"), 0xFF);
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand constant.
  //  * @return A new {@code Expr} representing the bitwise XOR operation.
  //  */
  // export function bitXor(left: Expr, right: any): BitXor;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise XOR operation between a field and an expression.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise XOR of 'field1' and 'field2'.
  //  * bitXor("field1", Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand expression.
  //  * @return A new {@code Expr} representing the bitwise XOR operation.
  //  */
  // export function bitXor(left: string, right: Expr): BitXor;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise XOR operation between a field and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise XOR of 'field1' and 0xFF.
  //  * bitXor("field1", 0xFF);
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand constant.
  //  * @return A new {@code Expr} representing the bitwise XOR operation.
  //  */
  // export function bitXor(left: string, right: any): BitXor;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise NOT operation to an expression.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise NOT of 'field1'.
  //  * bitNot(Field.of("field1"));
  //  * ```
  //  *
  //  * @param operand The operand expression.
  //  * @return A new {@code Expr} representing the bitwise NOT operation.
  //  */
  // export function bitNot(operand: Expr): BitNot;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise NOT operation to a field.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise NOT of 'field1'.
  //  * bitNot("field1");
  //  * ```
  //  *
  //  * @param operand The operand field name.
  //  * @return A new {@code Expr} representing the bitwise NOT operation.
  //  */
  // export function bitNot(operand: string): BitNot;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise left shift operation between two expressions.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise left shift of 'field1' by 'field2' bits.
  //  * bitLeftShift(Field.of("field1"), Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand expression representing the number of bits to shift.
  //  * @return A new {@code Expr} representing the bitwise left shift operation.
  //  */
  // export function bitLeftShift(left: Expr, right: Expr): BitLeftShift;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise left shift operation between an expression and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise left shift of 'field1' by 2 bits.
  //  * bitLeftShift(Field.of("field1"), 2);
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand constant representing the number of bits to shift.
  //  * @return A new {@code Expr} representing the bitwise left shift operation.
  //  */
  // export function bitLeftShift(left: Expr, right: any): BitLeftShift;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise left shift operation between a field and an expression.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise left shift of 'field1' by 'field2' bits.
  //  * bitLeftShift("field1", Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand expression representing the number of bits to shift.
  //  * @return A new {@code Expr} representing the bitwise left shift operation.
  //  */
  // export function bitLeftShift(left: string, right: Expr): BitLeftShift;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise left shift operation between a field and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise left shift of 'field1' by 2 bits.
  //  * bitLeftShift("field1", 2);
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand constant representing the number of bits to shift.
  //  * @return A new {@code Expr} representing the bitwise left shift operation.
  //  */
  // export function bitLeftShift(left: string, right: any): BitLeftShift;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise right shift operation between two expressions.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise right shift of 'field1' by 'field2' bits.
  //  * bitRightShift(Field.of("field1"), Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand expression representing the number of bits to shift.
  //  * @return A new {@code Expr} representing the bitwise right shift operation.
  //  */
  // export function bitRightShift(left: Expr, right: Expr): BitRightShift;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise right shift operation between an expression and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise right shift of 'field1' by 2 bits.
  //  * bitRightShift(Field.of("field1"), 2);
  //  * ```
  //  *
  //  * @param left The left operand expression.
  //  * @param right The right operand constant representing the number of bits to shift.
  //  * @return A new {@code Expr} representing the bitwise right shift operation.
  //  */
  // export function bitRightShift(left: Expr, right: any): BitRightShift;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise right shift operation between a field and an expression.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise right shift of 'field1' by 'field2' bits.
  //  * bitRightShift("field1", Field.of("field2"));
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand expression representing the number of bits to shift.
  //  * @return A new {@code Expr} representing the bitwise right shift operation.
  //  */
  // export function bitRightShift(left: string, right: Expr): BitRightShift;
  //
  // /**
  //  * @beta
  //  *
  //  * Creates an expression that applies a bitwise right shift operation between a field and a constant.
  //  *
  //  * ```typescript
  //  * // Calculate the bitwise right shift of 'field1' by 2 bits.
  //  * bitRightShift("field1", 2);
  //  * ```
  //  *
  //  * @param left The left operand field name.
  //  * @param right The right operand constant representing the number of bits to shift.
  //  * @return A new {@code Expr} representing the bitwise right shift operation.
  //  */
  // export function bitRightShift(left: string, right: any): BitRightShift;

  /**
   * @beta
   *
   * Creates an expression that checks if two expressions are equal.
   *
   * ```typescript
   * // Check if the 'age' field is equal to an expression
   * eq(Field.of("age"), Field.of("minAge").add(10));
   * ```
   *
   * @param left The first expression to compare.
   * @param right The second expression to compare.
   * @return A new `Expr` representing the equality comparison.
   */
  export function eq(left: Expr, right: Expr): Eq;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is equal to a constant value.
   *
   * ```typescript
   * // Check if the 'age' field is equal to 21
   * eq(Field.of("age"), 21);
   * ```
   *
   * @param left The expression to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the equality comparison.
   */
  export function eq(left: Expr, right: any): Eq;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is equal to an expression.
   *
   * ```typescript
   * // Check if the 'age' field is equal to the 'limit' field
   * eq("age", Field.of("limit"));
   * ```
   *
   * @param left The field name to compare.
   * @param right The expression to compare to.
   * @return A new `Expr` representing the equality comparison.
   */
  export function eq(left: string, right: Expr): Eq;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is equal to a constant value.
   *
   * ```typescript
   * // Check if the 'city' field is equal to string constant "London"
   * eq("city", "London");
   * ```
   *
   * @param left The field name to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the equality comparison.
   */
  export function eq(left: string, right: any): Eq;

  /**
   * @beta
   *
   * Creates an expression that checks if two expressions are not equal.
   *
   * ```typescript
   * // Check if the 'status' field is not equal to field 'finalState'
   * neq(Field.of("status"), Field.of("finalState"));
   * ```
   *
   * @param left The first expression to compare.
   * @param right The second expression to compare.
   * @return A new `Expr` representing the inequality comparison.
   */
  export function neq(left: Expr, right: Expr): Neq;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is not equal to a constant value.
   *
   * ```typescript
   * // Check if the 'status' field is not equal to "completed"
   * neq(Field.of("status"), "completed");
   * ```
   *
   * @param left The expression to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the inequality comparison.
   */
  export function neq(left: Expr, right: any): Neq;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is not equal to an expression.
   *
   * ```typescript
   * // Check if the 'status' field is not equal to the value of 'expectedStatus'
   * neq("status", Field.of("expectedStatus"));
   * ```
   *
   * @param left The field name to compare.
   * @param right The expression to compare to.
   * @return A new `Expr` representing the inequality comparison.
   */
  export function neq(left: string, right: Expr): Neq;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is not equal to a constant value.
   *
   * ```typescript
   * // Check if the 'country' field is not equal to "USA"
   * neq("country", "USA");
   * ```
   *
   * @param left The field name to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the inequality comparison.
   */
  export function neq(left: string, right: any): Neq;

  /**
   * @beta
   *
   * Creates an expression that checks if the first expression is less than the second expression.
   *
   * ```typescript
   * // Check if the 'age' field is less than 30
   * lt(Field.of("age"), Field.of("limit"));
   * ```
   *
   * @param left The first expression to compare.
   * @param right The second expression to compare.
   * @return A new `Expr` representing the less than comparison.
   */
  export function lt(left: Expr, right: Expr): Lt;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is less than a constant value.
   *
   * ```typescript
   * // Check if the 'age' field is less than 30
   * lt(Field.of("age"), 30);
   * ```
   *
   * @param left The expression to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the less than comparison.
   */
  export function lt(left: Expr, right: any): Lt;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is less than an expression.
   *
   * ```typescript
   * // Check if the 'age' field is less than the 'limit' field
   * lt("age", Field.of("limit"));
   * ```
   *
   * @param left The field name to compare.
   * @param right The expression to compare to.
   * @return A new `Expr` representing the less than comparison.
   */
  export function lt(left: string, right: Expr): Lt;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is less than a constant value.
   *
   * ```typescript
   * // Check if the 'price' field is less than 50
   * lt("price", 50);
   * ```
   *
   * @param left The field name to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the less than comparison.
   */
  export function lt(left: string, right: any): Lt;

  /**
   * @beta
   *
   * Creates an expression that checks if the first expression is less than or equal to the second
   * expression.
   *
   * ```typescript
   * // Check if the 'quantity' field is less than or equal to 20
   * lte(Field.of("quantity"), Field.of("limit"));
   * ```
   *
   * @param left The first expression to compare.
   * @param right The second expression to compare.
   * @return A new `Expr` representing the less than or equal to comparison.
   */
  export function lte(left: Expr, right: Expr): Lte;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is less than or equal to a constant value.
   *
   * ```typescript
   * // Check if the 'quantity' field is less than or equal to 20
   * lte(Field.of("quantity"), 20);
   * ```
   *
   * @param left The expression to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the less than or equal to comparison.
   */
  export function lte(left: Expr, right: any): Lte;

  /**
   * Creates an expression that checks if a field's value is less than or equal to an expression.
   *
   * ```typescript
   * // Check if the 'quantity' field is less than or equal to the 'limit' field
   * lte("quantity", Field.of("limit"));
   * ```
   *
   * @param left The field name to compare.
   * @param right The expression to compare to.
   * @return A new `Expr` representing the less than or equal to comparison.
   */
  export function lte(left: string, right: Expr): Lte;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is less than or equal to a constant value.
   *
   * ```typescript
   * // Check if the 'score' field is less than or equal to 70
   * lte("score", 70);
   * ```
   *
   * @param left The field name to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the less than or equal to comparison.
   */
  export function lte(left: string, right: any): Lte;

  /**
   * @beta
   *
   * Creates an expression that checks if the first expression is greater than the second
   * expression.
   *
   * ```typescript
   * // Check if the 'age' field is greater than 18
   * gt(Field.of("age"), Constant(9).add(9));
   * ```
   *
   * @param left The first expression to compare.
   * @param right The second expression to compare.
   * @return A new `Expr` representing the greater than comparison.
   */
  export function gt(left: Expr, right: Expr): Gt;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is greater than a constant value.
   *
   * ```typescript
   * // Check if the 'age' field is greater than 18
   * gt(Field.of("age"), 18);
   * ```
   *
   * @param left The expression to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the greater than comparison.
   */
  export function gt(left: Expr, right: any): Gt;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is greater than an expression.
   *
   * ```typescript
   * // Check if the value of field 'age' is greater than the value of field 'limit'
   * gt("age", Field.of("limit"));
   * ```
   *
   * @param left The field name to compare.
   * @param right The expression to compare to.
   * @return A new `Expr` representing the greater than comparison.
   */
  export function gt(left: string, right: Expr): Gt;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is greater than a constant value.
   *
   * ```typescript
   * // Check if the 'price' field is greater than 100
   * gt("price", 100);
   * ```
   *
   * @param left The field name to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the greater than comparison.
   */
  export function gt(left: string, right: any): Gt;

  /**
   * @beta
   *
   * Creates an expression that checks if the first expression is greater than or equal to the
   * second expression.
   *
   * ```typescript
   * // Check if the 'quantity' field is greater than or equal to the field "threshold"
   * gte(Field.of("quantity"), Field.of("threshold"));
   * ```
   *
   * @param left The first expression to compare.
   * @param right The second expression to compare.
   * @return A new `Expr` representing the greater than or equal to comparison.
   */
  export function gte(left: Expr, right: Expr): Gte;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is greater than or equal to a constant
   * value.
   *
   * ```typescript
   * // Check if the 'quantity' field is greater than or equal to 10
   * gte(Field.of("quantity"), 10);
   * ```
   *
   * @param left The expression to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the greater than or equal to comparison.
   */
  export function gte(left: Expr, right: any): Gte;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is greater than or equal to an expression.
   *
   * ```typescript
   * // Check if the value of field 'age' is greater than or equal to the value of field 'limit'
   * gte("age", Field.of("limit"));
   * ```
   *
   * @param left The field name to compare.
   * @param right The expression to compare to.
   * @return A new `Expr` representing the greater than or equal to comparison.
   */
  export function gte(left: string, right: Expr): Gte;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is greater than or equal to a constant
   * value.
   *
   * ```typescript
   * // Check if the 'score' field is greater than or equal to 80
   * gte("score", 80);
   * ```
   *
   * @param left The field name to compare.
   * @param right The constant value to compare to.
   * @return A new `Expr` representing the greater than or equal to comparison.
   */
  export function gte(left: string, right: any): Gte;

  /**
   * @beta
   *
   * Creates an expression that concatenates an array expression with other arrays.
   *
   * ```typescript
   * // Combine the 'items' array with two new item arrays
   * arrayConcat(Field.of("items"), [Field.of("newItems"), Field.of("otherItems")]);
   * ```
   *
   * @param array The array expression to concatenate to.
   * @param elements The array expressions to concatenate.
   * @return A new {@code Expr} representing the concatenated array.
   */
  export function arrayConcat(array: Expr, elements: Expr[]): ArrayConcat;

  /**
   * @beta
   *
   * Creates an expression that concatenates an array expression with other arrays and/or values.
   *
   * ```typescript
   * // Combine the 'tags' array with a new array
   * arrayConcat(Field.of("tags"), ["newTag1", "newTag2"]);
   * ```
   *
   * @param array The array expression to concatenate to.
   * @param elements The array expressions or single values to concatenate.
   * @return A new {@code Expr} representing the concatenated array.
   */
  export function arrayConcat(array: Expr, elements: any[]): ArrayConcat;

  /**
   * @beta
   *
   * Creates an expression that concatenates a field's array value with other arrays.
   *
   * ```typescript
   * // Combine the 'items' array with two new item arrays
   * arrayConcat("items", [Field.of("newItems"), Field.of("otherItems")]);
   * ```
   *
   * @param array The field name containing array values.
   * @param elements The array expressions to concatenate.
   * @return A new {@code Expr} representing the concatenated array.
   */
  export function arrayConcat(array: string, elements: Expr[]): ArrayConcat;

  /**
   * @beta
   *
   * Creates an expression that concatenates a field's array value with other arrays and/or values.
   *
   * ```typescript
   * // Combine the 'tags' array with a new array
   * arrayConcat("tags", ["newTag1", "newTag2"]);
   * ```
   *
   * @param array The field name containing array values.
   * @param elements The array expressions or single values to concatenate.
   * @return A new {@code Expr} representing the concatenated array.
   */
  export function arrayConcat(array: string, elements: any[]): ArrayConcat;

  /**
   * @beta
   *
   * Creates an expression that checks if an array expression contains a specific element.
   *
   * ```typescript
   * // Check if the 'colors' array contains the value of field 'selectedColor'
   * arrayContains(Field.of("colors"), Field.of("selectedColor"));
   * ```
   *
   * @param array The array expression to check.
   * @param element The element to search for in the array.
   * @return A new {@code Expr} representing the 'array_contains' comparison.
   */
  export function arrayContains(array: Expr, element: Expr): ArrayContains;

  /**
   * @beta
   *
   * Creates an expression that checks if an array expression contains a specific element.
   *
   * ```typescript
   * // Check if the 'colors' array contains "red"
   * arrayContains(Field.of("colors"), "red");
   * ```
   *
   * @param array The array expression to check.
   * @param element The element to search for in the array.
   * @return A new {@code Expr} representing the 'array_contains' comparison.
   */
  export function arrayContains(array: Expr, element: any): ArrayContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's array value contains a specific element.
   *
   * ```typescript
   * // Check if the 'colors' array contains the value of field 'selectedColor'
   * arrayContains("colors", Field.of("selectedColor"));
   * ```
   *
   * @param array The field name to check.
   * @param element The element to search for in the array.
   * @return A new {@code Expr} representing the 'array_contains' comparison.
   */
  export function arrayContains(array: string, element: Expr): ArrayContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's array value contains a specific value.
   *
   * ```typescript
   * // Check if the 'colors' array contains "red"
   * arrayContains("colors", "red");
   * ```
   *
   * @param array The field name to check.
   * @param element The element to search for in the array.
   * @return A new {@code Expr} representing the 'array_contains' comparison.
   */
  export function arrayContains(array: string, element: any): ArrayContains;

  /**
   * @beta
   *
   * Creates an expression that checks if an array expression contains any of the specified
   * elements.
   *
   * ```typescript
   * // Check if the 'categories' array contains either values from field "cate1" or "Science"
   * arrayContainsAny(Field.of("categories"), [Field.of("cate1"), "Science"]);
   * ```
   *
   * @param array The array expression to check.
   * @param values The elements to check for in the array.
   * @return A new {@code Expr} representing the 'array_contains_any' comparison.
   */
  export function arrayContainsAny(
    array: Expr,
    values: Expr[]
  ): ArrayContainsAny;

  /**
   * @beta
   *
   * Creates an expression that checks if an array expression contains any of the specified
   * elements.
   *
   * ```typescript
   * // Check if the 'categories' array contains either values from field "cate1" or "Science"
   * arrayContainsAny(Field.of("categories"), [Field.of("cate1"), "Science"]);
   * ```
   *
   * @param array The array expression to check.
   * @param values The elements to check for in the array.
   * @return A new {@code Expr} representing the 'array_contains_any' comparison.
   */
  export function arrayContainsAny(
    array: Expr,
    values: any[]
  ): ArrayContainsAny;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's array value contains any of the specified
   * elements.
   *
   * ```typescript
   * // Check if the 'groups' array contains either the value from the 'userGroup' field
   * // or the value "guest"
   * arrayContainsAny("categories", [Field.of("cate1"), "Science"]);
   * ```
   *
   * @param array The field name to check.
   * @param values The elements to check for in the array.
   * @return A new {@code Expr} representing the 'array_contains_any' comparison.
   */
  export function arrayContainsAny(
    array: string,
    values: Expr[]
  ): ArrayContainsAny;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's array value contains any of the specified
   * elements.
   *
   * ```typescript
   * // Check if the 'groups' array contains either the value from the 'userGroup' field
   * // or the value "guest"
   * arrayContainsAny("categories", [Field.of("cate1"), "Science"]);
   * ```
   *
   * @param array The field name to check.
   * @param values The elements to check for in the array.
   * @return A new {@code Expr} representing the 'array_contains_any' comparison.
   */
  export function arrayContainsAny(
    array: string,
    values: any[]
  ): ArrayContainsAny;

  /**
   * @beta
   *
   * Creates an expression that checks if an array expression contains all the specified elements.
   *
   * ```typescript
   * // Check if the 'tags' array contains both of the values from field 'tag1', 'tag2' and "tag3"
   * arrayContainsAll(Field.of("tags"), [Field.of("tag1"), "SciFi", "Adventure"]);
   * ```
   *
   * @param array The array expression to check.
   * @param values The elements to check for in the array.
   * @return A new {@code Expr} representing the 'array_contains_all' comparison.
   */
  export function arrayContainsAll(
    array: Expr,
    values: Expr[]
  ): ArrayContainsAll;

  /**
   * @beta
   *
   * Creates an expression that checks if an array expression contains all the specified elements.
   *
   * ```typescript
   * // Check if the 'tags' array contains both of the values from field 'tag1', 'tag2' and "tag3"
   * arrayContainsAll(Field.of("tags"), [Field.of("tag1"), "SciFi", "Adventure"]);
   * ```
   *
   * @param array The array expression to check.
   * @param values The elements to check for in the array.
   * @return A new {@code Expr} representing the 'array_contains_all' comparison.
   */
  export function arrayContainsAll(
    array: Expr,
    values: any[]
  ): ArrayContainsAll;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's array value contains all the specified values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'tags' array contains both of the values from field 'tag1' and "tag2"
   * arrayContainsAll("tags", [Field.of("tag1"), "SciFi", "Adventure"]);
   * ```
   *
   * @param array The field name to check.
   * @param values The elements to check for in the array.
   * @return A new {@code Expr} representing the 'array_contains_all' comparison.
   */
  export function arrayContainsAll(
    array: string,
    values: Expr[]
  ): ArrayContainsAll;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's array value contains all the specified values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'tags' array contains both of the values from field 'tag1' and "tag2"
   * arrayContainsAll("tags", [Field.of("tag1"), "SciFi", "Adventure"]);
   * ```
   *
   * @param array The field name to check.
   * @param values The elements to check for in the array.
   * @return A new {@code Expr} representing the 'array_contains_all' comparison.
   */
  export function arrayContainsAll(
    array: string,
    values: any[]
  ): ArrayContainsAll;

  /**
   * @beta
   *
   * Creates an expression that calculates the length of an array expression.
   *
   * ```typescript
   * // Get the number of items in the 'cart' array
   * arrayLength(Field.of("cart"));
   * ```
   *
   * @param array The array expression to calculate the length of.
   * @return A new {@code Expr} representing the length of the array.
   */
  export function arrayLength(array: Expr): ArrayLength;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is equal to any of the provided values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
   * eqAny(Field.of("category"), [Constant.of("Electronics"), Field.of("primaryType")]);
   * ```
   *
   * @param element The expression to compare.
   * @param others The values to check against.
   * @return A new {@code Expr} representing the 'IN' comparison.
   */
  export function eqAny(element: Expr, others: Expr[]): EqAny;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is equal to any of the provided values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
   * eqAny(Field.of("category"), ["Electronics", Field.of("primaryType")]);
   * ```
   *
   * @param element The expression to compare.
   * @param others The values to check against.
   * @return A new {@code Expr} representing the 'IN' comparison.
   */
  export function eqAny(element: Expr, others: any[]): EqAny;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is equal to any of the provided values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
   * eqAny("category", [Constant.of("Electronics"), Field.of("primaryType")]);
   * ```
   *
   * @param element The field to compare.
   * @param others The values to check against.
   * @return A new {@code Expr} representing the 'IN' comparison.
   */
  export function eqAny(element: string, others: Expr[]): EqAny;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is equal to any of the provided values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
   * eqAny("category", ["Electronics", Field.of("primaryType")]);
   * ```
   *
   * @param element The field to compare.
   * @param others The values to check against.
   * @return A new {@code Expr} representing the 'IN' comparison.
   */
  export function eqAny(element: string, others: any[]): EqAny;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is not equal to any of the provided values
   * or expressions.
   *
   * ```typescript
   * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
   * notEqAny(Field.of("status"), [Constant.of("pending"), Field.of("rejectedStatus")]);
   * ```
   *
   * @param element The expression to compare.
   * @param others The values to check against.
   * @return A new {@code Expr} representing the 'NOT IN' comparison.
   */
  export function notEqAny(element: Expr, others: Expr[]): NotEqAny;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression is not equal to any of the provided values
   * or expressions.
   *
   * ```typescript
   * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
   * notEqAny(Field.of("status"), ["pending", Field.of("rejectedStatus")]);
   * ```
   *
   * @param element The expression to compare.
   * @param others The values to check against.
   * @return A new {@code Expr} representing the 'NOT IN' comparison.
   */
  export function notEqAny(element: Expr, others: any[]): NotEqAny;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is not equal to any of the provided values
   * or expressions.
   *
   * ```typescript
   * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
   * notEqAny("status", [Constant.of("pending"), Field.of("rejectedStatus")]);
   * ```
   *
   * @param element The field name to compare.
   * @param others The values to check against.
   * @return A new {@code Expr} representing the 'NOT IN' comparison.
   */
  export function notEqAny(element: string, others: Expr[]): NotEqAny;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value is not equal to any of the provided values
   * or expressions.
   *
   * ```typescript
   * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
   * notEqAny("status", ["pending", Field.of("rejectedStatus")]);
   * ```
   *
   * @param element The field name to compare.
   * @param others The values to check against.
   * @return A new {@code Expr} representing the 'NOT IN' comparison.
   */
  export function notEqAny(element: string, others: any[]): NotEqAny;

  /**
   * @beta
   *
   * Creates an expression that performs a logical 'AND' operation on multiple filter conditions.
   *
   * ```typescript
   * // Check if the 'age' field is greater than 18 AND the 'city' field is "London" AND
   * // the 'status' field is "active"
   * const condition = and(gt("age", 18), eq("city", "London"), eq("status", "active"));
   * ```
   *
   * @param left The first filter condition.
   * @param right Additional filter conditions to 'AND' together.
   * @return A new {@code Expr} representing the logical 'AND' operation.
   */
  export function and(left: FilterExpr, ...right: FilterExpr[]): And;

  /**
   * @beta
   *
   * Creates an expression that performs a logical 'OR' operation on multiple filter conditions.
   *
   * ```typescript
   * // Check if the 'age' field is greater than 18 OR the 'city' field is "London" OR
   * // the 'status' field is "active"
   * const condition = or(gt("age", 18), eq("city", "London"), eq("status", "active"));
   * ```
   *
   * @param left The first filter condition.
   * @param right Additional filter conditions to 'OR' together.
   * @return A new {@code Expr} representing the logical 'OR' operation.
   */
  export function or(left: FilterExpr, ...right: FilterExpr[]): Or;

  /**
   * @beta
   *
   * Creates an expression that performs a logical 'XOR' (exclusive OR) operation on multiple filter
   * conditions.
   *
   * ```typescript
   * // Check if only one of the conditions is true: 'age' greater than 18, 'city' is "London",
   * // or 'status' is "active".
   * const condition = xor(
   *     gt("age", 18),
   *     eq("city", "London"),
   *     eq("status", "active"));
   * ```
   *
   * @param left The first filter condition.
   * @param right Additional filter conditions to 'XOR' together.
   * @return A new {@code Expr} representing the logical 'XOR' operation.
   */
  export function xor(left: FilterExpr, ...right: FilterExpr[]): Xor;

  /**
   * @beta
   *
   * Creates a conditional expression that evaluates to a 'then' expression if a condition is true
   * and an 'else' expression if the condition is false.
   *
   * ```typescript
   * // If 'age' is greater than 18, return "Adult"; otherwise, return "Minor".
   * cond(
   *     gt("age", 18), Constant.of("Adult"), Constant.of("Minor"));
   * ```
   *
   * @param condition The condition to evaluate.
   * @param thenExpr The expression to evaluate if the condition is true.
   * @param elseExpr The expression to evaluate if the condition is false.
   * @return A new {@code Expr} representing the conditional expression.
   */
  export function ifFunction(
    condition: FilterExpr,
    thenExpr: Expr,
    elseExpr: Expr
  ): If;

  /**
   * @beta
   *
   * Creates an expression that negates a filter condition.
   *
   * ```typescript
   * // Find documents where the 'completed' field is NOT true
   * not(eq("completed", true));
   * ```
   *
   * @param filter The filter condition to negate.
   * @return A new {@code Expr} representing the negated filter condition.
   */
  export function not(filter: FilterExpr): Not;

  /**
   * @beta
   *
   * Creates an expression that returns the larger value between two expressions, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the larger value between the 'timestamp' field and the current timestamp.
   * logicalMaximum(Field.of("timestamp"), Function.currentTimestamp());
   * ```
   *
   * @param left The left operand expression.
   * @param right The right operand expression.
   * @return A new {@code Expr} representing the logical maximum operation.
   */
  export function logicalMaximum(left: Expr, right: Expr): LogicalMaximum;

  /**
   * @beta
   *
   * Creates an expression that returns the larger value between an expression and a constant value, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the larger value between the 'value' field and 10.
   * logicalMaximum(Field.of("value"), 10);
   * ```
   *
   * @param left The left operand expression.
   * @param right The right operand constant.
   * @return A new {@code Expr} representing the logical maximum operation.
   */
  export function logicalMaximum(left: Expr, right: any): LogicalMaximum;

  /**
   * @beta
   *
   * Creates an expression that returns the larger value between a field and an expression, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the larger value between the 'timestamp' field and the current timestamp.
   * logicalMaximum("timestamp", Function.currentTimestamp());
   * ```
   *
   * @param left The left operand field name.
   * @param right The right operand expression.
   * @return A new {@code Expr} representing the logical maximum operation.
   */
  export function logicalMaximum(left: string, right: Expr): LogicalMaximum;

  /**
   * @beta
   *
   * Creates an expression that returns the larger value between a field and a constant value, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the larger value between the 'value' field and 10.
   * logicalMaximum("value", 10);
   * ```
   *
   * @param left The left operand field name.
   * @param right The right operand constant.
   * @return A new {@code Expr} representing the logical maximum operation.
   */
  export function logicalMaximum(left: string, right: any): LogicalMaximum;

  /**
   * @beta
   *
   * Creates an expression that returns the smaller value between two expressions, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the smaller value between the 'timestamp' field and the current timestamp.
   * logicalMinimum(Field.of("timestamp"), Function.currentTimestamp());
   * ```
   *
   * @param left The left operand expression.
   * @param right The right operand expression.
   * @return A new {@code Expr} representing the logical minimum operation.
   */
  export function logicalMinimum(left: Expr, right: Expr): LogicalMinimum;

  /**
   * @beta
   *
   * Creates an expression that returns the smaller value between an expression and a constant value, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the smaller value between the 'value' field and 10.
   * logicalMinimum(Field.of("value"), 10);
   * ```
   *
   * @param left The left operand expression.
   * @param right The right operand constant.
   * @return A new {@code Expr} representing the logical minimum operation.
   */
  export function logicalMinimum(left: Expr, right: any): LogicalMinimum;

  /**
   * @beta
   *
   * Creates an expression that returns the smaller value between a field and an expression, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the smaller value between the 'timestamp' field and the current timestamp.
   * logicalMinimum("timestamp", Function.currentTimestamp());
   * ```
   *
   * @param left The left operand field name.
   * @param right The right operand expression.
   * @return A new {@code Expr} representing the logical minimum operation.
   */
  export function logicalMinimum(left: string, right: Expr): LogicalMinimum;

  /**
   * @beta
   *
   * Creates an expression that returns the smaller value between a field and a constant value, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the smaller value between the 'value' field and 10.
   * logicalMinimum("value", 10);
   * ```
   *
   * @param left The left operand field name.
   * @param right The right operand constant.
   * @return A new {@code Expr} representing the logical minimum operation.
   */
  export function logicalMinimum(left: string, right: any): LogicalMinimum;

  /**
   * @beta
   *
   * Creates an expression that checks if a field exists.
   *
   * ```typescript
   * // Check if the document has a field named "phoneNumber"
   * exists(Field.of("phoneNumber"));
   * ```
   *
   * @param value An expression evaluates to the name of the field to check.
   * @return A new {@code Expr} representing the 'exists' check.
   */
  export function exists(value: Expr): Exists;

  /**
   * @beta
   *
   * Creates an expression that checks if a field exists.
   *
   * ```typescript
   * // Check if the document has a field named "phoneNumber"
   * exists("phoneNumber");
   * ```
   *
   * @param field The field name to check.
   * @return A new {@code Expr} representing the 'exists' check.
   */
  export function exists(field: string): Exists;

  /**
   * @beta
   *
   * Creates an expression that checks if an expression evaluates to 'NaN' (Not a Number).
   *
   * ```typescript
   * // Check if the result of a calculation is NaN
   * isNaN(Field.of("value").divide(0));
   * ```
   *
   * @param value The expression to check.
   * @return A new {@code Expr} representing the 'isNaN' check.
   */
  export function isNaN(value: Expr): IsNan;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value evaluates to 'NaN' (Not a Number).
   *
   * ```typescript
   * // Check if the result of a calculation is NaN
   * isNaN("value");
   * ```
   *
   * @param value The name of the field to check.
   * @return A new {@code Expr} representing the 'isNaN' check.
   */
  export function isNaN(value: string): IsNan;

  /**
   * @beta
   *
   * Creates an expression that reverses a string.
   *
   * ```typescript
   * // Reverse the value of the 'myString' field.
   * reverse(Field.of("myString"));
   * ```
   *
   * @param expr The expression representing the string to reverse.
   * @return A new {@code Expr} representing the reversed string.
   */
  export function reverse(expr: Expr): Reverse;

  /**
   * @beta
   *
   * Creates an expression that reverses a string represented by a field.
   *
   * ```typescript
   * // Reverse the value of the 'myString' field.
   * reverse("myString");
   * ```
   *
   * @param field The name of the field representing the string to reverse.
   * @return A new {@code Expr} representing the reversed string.
   */
  export function reverse(field: string): Reverse;

  /**
   * @beta
   *
   * Creates an expression that replaces the first occurrence of a substring within a string with another substring.
   *
   * ```typescript
   * // Replace the first occurrence of "hello" with "hi" in the 'message' field.
   * replaceFirst(Field.of("message"), "hello", "hi");
   * ```
   *
   * @param value The expression representing the string to perform the replacement on.
   * @param find The substring to search for.
   * @param replace The substring to replace the first occurrence of 'find' with.
   * @return A new {@code Expr} representing the string with the first occurrence replaced.
   */
  export function replaceFirst(
    value: Expr,
    find: string,
    replace: string
  ): ReplaceFirst;

  /**
   * @beta
   *
   * Creates an expression that replaces the first occurrence of a substring within a string with another substring,
   * where the substring to find and the replacement substring are specified by expressions.
   *
   * ```typescript
   * // Replace the first occurrence of the value in 'findField' with the value in 'replaceField' in the 'message' field.
   * replaceFirst(Field.of("message"), Field.of("findField"), Field.of("replaceField"));
   * ```
   *
   * @param value The expression representing the string to perform the replacement on.
   * @param find The expression representing the substring to search for.
   * @param replace The expression representing the substring to replace the first occurrence of 'find' with.
   * @return A new {@code Expr} representing the string with the first occurrence replaced.
   */
  export function replaceFirst(
    value: Expr,
    find: Expr,
    replace: Expr
  ): ReplaceFirst;

  /**
   * @beta
   *
   * Creates an expression that replaces the first occurrence of a substring within a string represented by a field with another substring.
   *
   * ```typescript
   * // Replace the first occurrence of "hello" with "hi" in the 'message' field.
   * replaceFirst("message", "hello", "hi");
   * ```
   *
   * @param field The name of the field representing the string to perform the replacement on.
   * @param find The substring to search for.
   * @param replace The substring to replace the first occurrence of 'find' with.
   * @return A new {@code Expr} representing the string with the first occurrence replaced.
   */
  export function replaceFirst(
    field: string,
    find: string,
    replace: string
  ): ReplaceFirst;

  /**
   * @beta
   *
   * Creates an expression that replaces the first occurrence of a substring within a string represented by a field with another substring,
   * where the substring to find and the replacement substring are specified by expressions.
   *
   * ```typescript
   * // Replace the first occurrence of the value in 'findField' with the value in 'replaceField' in the 'message' field.
   * replaceFirst("message", Field.of("findField"), Field.of("replaceField"));
   * ```
   *
   * @param field The name of the field representing the string to perform the replacement on.
   * @param find The expression representing the substring to search for.
   * @param replace The expression representing the substring to replace the first occurrence of 'find' with.
   * @return A new {@code Expr} representing the string with the first occurrence replaced.
   */
  export function replaceFirst(
    field: string,
    find: Expr,
    replace: Expr
  ): ReplaceFirst;

  /**
   * @beta
   *
   * Creates an expression that replaces all occurrences of a substring within a string with another substring.
   *
   * ```typescript
   * // Replace all occurrences of "hello" with "hi" in the 'message' field.
   * replaceAll(Field.of("message"), "hello", "hi");
   * ```
   *
   * @param value The expression representing the string to perform the replacement on.
   * @param find The substring to search for.
   * @param replace The substring to replace all occurrences of 'find' with.
   * @return A new {@code Expr} representing the string with all occurrences replaced.
   */
  export function replaceAll(
    value: Expr,
    find: string,
    replace: string
  ): ReplaceAll;

  /**
   * @beta
   *
   * Creates an expression that replaces all occurrences of a substring within a string with another substring,
   * where the substring to find and the replacement substring are specified by expressions.
   *
   * ```typescript
   * // Replace all occurrences of the value in 'findField' with the value in 'replaceField' in the 'message' field.
   * replaceAll(Field.of("message"), Field.of("findField"), Field.of("replaceField"));
   * ```
   *
   * @param value The expression representing the string to perform the replacement on.
   * @param find The expression representing the substring to search for.
   * @param replace The expression representing the substring to replace all occurrences of 'find' with.
   * @return A new {@code Expr} representing the string with all occurrences replaced.
   */
  export function replaceAll(
    value: Expr,
    find: Expr,
    replace: Expr
  ): ReplaceAll;

  /**
   * @beta
   *
   * Creates an expression that replaces all occurrences of a substring within a string represented by a field with another substring.
   *
   * ```typescript
   * // Replace all occurrences of "hello" with "hi" in the 'message' field.
   * replaceAll("message", "hello", "hi");
   * ```
   *
   * @param field The name of the field representing the string to perform the replacement on.
   * @param find The substring to search for.
   * @param replace The substring to replace all occurrences of 'find' with.
   * @return A new {@code Expr} representing the string with all occurrences replaced.
   */
  export function replaceAll(
    field: string,
    find: string,
    replace: string
  ): ReplaceAll;

  /**
   * @beta
   *
   * Creates an expression that replaces all occurrences of a substring within a string represented by a field with another substring,
   * where the substring to find and the replacement substring are specified by expressions.
   *
   * ```typescript
   * // Replace all occurrences of the value in 'findField' with the value in 'replaceField' in the 'message' field.
   * replaceAll("message", Field.of("findField"), Field.of("replaceField"));
   * ```
   *
   * @param field The name of the field representing the string to perform the replacement on.
   * @param find The expression representing the substring to search for.
   * @param replace The expression representing the substring to replace all occurrences of 'find' with.
   * @return A new {@code Expr} representing the string with all occurrences replaced.
   */
  export function replaceAll(
    field: string,
    find: Expr,
    replace: Expr
  ): ReplaceAll;

  /**
   * @beta
   *
   * Creates an expression that calculates the length of a string in bytes.
   *
   * ```typescript
   * // Calculate the length of the 'myString' field in bytes.
   * byteLength(Field.of("myString"));
   * ```
   *
   * @param expr The expression representing the string.
   * @return A new {@code Expr} representing the length of the string in bytes.
   */
  export function byteLength(expr: Expr): ByteLength;

  /**
   * @beta
   *
   * Creates an expression that calculates the length of a string represented by a field in bytes.
   *
   * ```typescript
   * // Calculate the length of the 'myString' field in bytes.
   * byteLength("myString");
   * ```
   *
   * @param field The name of the field representing the string.
   * @return A new {@code Expr} representing the length of the string in bytes.
   */
  export function byteLength(field: string): ByteLength;

  /**
   * @beta
   *
   * Creates an expression that calculates the character length of a string field in UTF-8.
   *
   * ```typescript
   * // Get the character length of the 'name' field in UTF-8.
   * strLength("name");
   * ```
   *
   * @param field The name of the field containing the string.
   * @return A new {@code Expr} representing the length of the string.
   */
  export function charLength(field: string): CharLength;

  /**
   * @beta
   *
   * Creates an expression that calculates the character length of a string expression in UTF-8.
   *
   * ```typescript
   * // Get the character length of the 'name' field in UTF-8.
   * strLength(Field.of("name"));
   * ```
   *
   * @param expr The expression representing the string to calculate the length of.
   * @return A new {@code Expr} representing the length of the string.
   */
  export function charLength(expr: Expr): CharLength;

  /**
   * @beta
   *
   * Creates an expression that performs a case-sensitive wildcard string comparison against a
   * field.
   *
   * ```typescript
   * // Check if the 'title' field contains the string "guide"
   * like("title", "%guide%");
   * ```
   *
   * @param left The name of the field containing the string.
   * @param pattern The pattern to search for. You can use "%" as a wildcard character.
   * @return A new {@code Expr} representing the 'like' comparison.
   */
  export function like(left: string, pattern: string): Like;

  /**
   * @beta
   *
   * Creates an expression that performs a case-sensitive wildcard string comparison against a
   * field.
   *
   * ```typescript
   * // Check if the 'title' field contains the string "guide"
   * like("title", Field.of("pattern"));
   * ```
   *
   * @param left The name of the field containing the string.
   * @param pattern The pattern to search for. You can use "%" as a wildcard character.
   * @return A new {@code Expr} representing the 'like' comparison.
   */
  export function like(left: string, pattern: Expr): Like;

  /**
   * @beta
   *
   * Creates an expression that performs a case-sensitive wildcard string comparison.
   *
   * ```typescript
   * // Check if the 'title' field contains the string "guide"
   * like(Field.of("title"), "%guide%");
   * ```
   *
   * @param left The expression representing the string to perform the comparison on.
   * @param pattern The pattern to search for. You can use "%" as a wildcard character.
   * @return A new {@code Expr} representing the 'like' comparison.
   */
  export function like(left: Expr, pattern: string): Like;

  /**
   * @beta
   *
   * Creates an expression that performs a case-sensitive wildcard string comparison.
   *
   * ```typescript
   * // Check if the 'title' field contains the string "guide"
   * like(Field.of("title"), Field.of("pattern"));
   * ```
   *
   * @param left The expression representing the string to perform the comparison on.
   * @param pattern The pattern to search for. You can use "%" as a wildcard character.
   * @return A new {@code Expr} representing the 'like' comparison.
   */
  export function like(left: Expr, pattern: Expr): Like;

  /**
   * @beta
   *
   * Creates an expression that checks if a string field contains a specified regular expression as
   * a substring.
   *
   * ```typescript
   * // Check if the 'description' field contains "example" (case-insensitive)
   * regexContains("description", "(?i)example");
   * ```
   *
   * @param left The name of the field containing the string.
   * @param pattern The regular expression to use for the search.
   * @return A new {@code Expr} representing the 'contains' comparison.
   */
  export function regexContains(left: string, pattern: string): RegexContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a string field contains a specified regular expression as
   * a substring.
   *
   * ```typescript
   * // Check if the 'description' field contains "example" (case-insensitive)
   * regexContains("description", Field.of("pattern"));
   * ```
   *
   * @param left The name of the field containing the string.
   * @param pattern The regular expression to use for the search.
   * @return A new {@code Expr} representing the 'contains' comparison.
   */
  export function regexContains(left: string, pattern: Expr): RegexContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression contains a specified regular
   * expression as a substring.
   *
   * ```typescript
   * // Check if the 'description' field contains "example" (case-insensitive)
   * regexContains(Field.of("description"), "(?i)example");
   * ```
   *
   * @param left The expression representing the string to perform the comparison on.
   * @param pattern The regular expression to use for the search.
   * @return A new {@code Expr} representing the 'contains' comparison.
   */
  export function regexContains(left: Expr, pattern: string): RegexContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression contains a specified regular
   * expression as a substring.
   *
   * ```typescript
   * // Check if the 'description' field contains "example" (case-insensitive)
   * regexContains(Field.of("description"), Field.of("pattern"));
   * ```
   *
   * @param left The expression representing the string to perform the comparison on.
   * @param pattern The regular expression to use for the search.
   * @return A new {@code Expr} representing the 'contains' comparison.
   */
  export function regexContains(left: Expr, pattern: Expr): RegexContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a string field matches a specified regular expression.
   *
   * ```typescript
   * // Check if the 'email' field matches a valid email pattern
   * regexMatch("email", "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
   * ```
   *
   * @param left The name of the field containing the string.
   * @param pattern The regular expression to use for the match.
   * @return A new {@code Expr} representing the regular expression match.
   */
  export function regexMatch(left: string, pattern: string): RegexMatch;

  /**
   * @beta
   *
   * Creates an expression that checks if a string field matches a specified regular expression.
   *
   * ```typescript
   * // Check if the 'email' field matches a valid email pattern
   * regexMatch("email", Field.of("pattern"));
   * ```
   *
   * @param left The name of the field containing the string.
   * @param pattern The regular expression to use for the match.
   * @return A new {@code Expr} representing the regular expression match.
   */
  export function regexMatch(left: string, pattern: Expr): RegexMatch;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression matches a specified regular
   * expression.
   *
   * ```typescript
   * // Check if the 'email' field matches a valid email pattern
   * regexMatch(Field.of("email"), "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
   * ```
   *
   * @param left The expression representing the string to match against.
   * @param pattern The regular expression to use for the match.
   * @return A new {@code Expr} representing the regular expression match.
   */
  export function regexMatch(left: Expr, pattern: string): RegexMatch;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression matches a specified regular
   * expression.
   *
   * ```typescript
   * // Check if the 'email' field matches a valid email pattern
   * regexMatch(Field.of("email"), Field.of("pattern"));
   * ```
   *
   * @param left The expression representing the string to match against.
   * @param pattern The regular expression to use for the match.
   * @return A new {@code Expr} representing the regular expression match.
   */
  export function regexMatch(left: Expr, pattern: Expr): RegexMatch;

  /**
   * @beta
   *
   * Creates an expression that checks if a string field contains a specified substring.
   *
   * ```typescript
   * // Check if the 'description' field contains "example".
   * strContains("description", "example");
   * ```
   *
   * @param left The name of the field containing the string.
   * @param substring The substring to search for.
   * @return A new {@code Expr} representing the 'contains' comparison.
   */
  export function strContains(left: string, substring: string): StrContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a string field contains a substring specified by an expression.
   *
   * ```typescript
   * // Check if the 'description' field contains the value of the 'keyword' field.
   * strContains("description", Field.of("keyword"));
   * ```
   *
   * @param left The name of the field containing the string.
   * @param substring The expression representing the substring to search for.
   * @return A new {@code Expr} representing the 'contains' comparison.
   */
  export function strContains(left: string, substring: Expr): StrContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression contains a specified substring.
   *
   * ```typescript
   * // Check if the 'description' field contains "example".
   * strContains(Field.of("description"), "example");
   * ```
   *
   * @param left The expression representing the string to perform the comparison on.
   * @param substring The substring to search for.
   * @return A new {@code Expr} representing the 'contains' comparison.
   */
  export function strContains(left: Expr, substring: string): StrContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression contains a substring specified by another expression.
   *
   * ```typescript
   * // Check if the 'description' field contains the value of the 'keyword' field.
   * strContains(Field.of("description"), Field.of("keyword"));
   * ```
   *
   * @param left The expression representing the string to perform the comparison on.
   * @param substring The expression representing the substring to search for.
   * @return A new {@code Expr} representing the 'contains' comparison.
   */
  export function strContains(left: Expr, substring: Expr): StrContains;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value starts with a given prefix.
   *
   * ```typescript
   * // Check if the 'name' field starts with "Mr."
   * startsWith("name", "Mr.");
   * ```
   *
   * @param expr The field name to check.
   * @param prefix The prefix to check for.
   * @return A new {@code Expr} representing the 'starts with' comparison.
   */
  export function startsWith(expr: string, prefix: string): StartsWith;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value starts with a given prefix.
   *
   * ```typescript
   * // Check if the 'fullName' field starts with the value of the 'firstName' field
   * startsWith("fullName", Field.of("firstName"));
   * ```
   *
   * @param expr The field name to check.
   * @param prefix The expression representing the prefix.
   * @return A new {@code Expr} representing the 'starts with' comparison.
   */
  export function startsWith(expr: string, prefix: Expr): StartsWith;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression starts with a given prefix.
   *
   * ```typescript
   * // Check if the result of concatenating 'firstName' and 'lastName' fields starts with "Mr."
   * startsWith(Field.of("fullName"), "Mr.");
   * ```
   *
   * @param expr The expression to check.
   * @param prefix The prefix to check for.
   * @return A new {@code Expr} representing the 'starts with' comparison.
   */
  export function startsWith(expr: Expr, prefix: string): StartsWith;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression starts with a given prefix.
   *
   * ```typescript
   * // Check if the result of concatenating 'firstName' and 'lastName' fields starts with "Mr."
   * startsWith(Field.of("fullName"), Field.of("prefix"));
   * ```
   *
   * @param expr The expression to check.
   * @param prefix The prefix to check for.
   * @return A new {@code Expr} representing the 'starts with' comparison.
   */
  export function startsWith(expr: Expr, prefix: Expr): StartsWith;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value ends with a given postfix.
   *
   * ```typescript
   * // Check if the 'filename' field ends with ".txt"
   * endsWith("filename", ".txt");
   * ```
   *
   * @param expr The field name to check.
   * @param suffix The postfix to check for.
   * @return A new {@code Expr} representing the 'ends with' comparison.
   */
  export function endsWith(expr: string, suffix: string): EndsWith;

  /**
   * @beta
   *
   * Creates an expression that checks if a field's value ends with a given postfix.
   *
   * ```typescript
   * // Check if the 'url' field ends with the value of the 'extension' field
   * endsWith("url", Field.of("extension"));
   * ```
   *
   * @param expr The field name to check.
   * @param suffix The expression representing the postfix.
   * @return A new {@code Expr} representing the 'ends with' comparison.
   */
  export function endsWith(expr: string, suffix: Expr): EndsWith;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression ends with a given postfix.
   *
   * ```typescript
   * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
   * endsWith(Field.of("fullName"), "Jr.");
   * ```
   *
   * @param expr The expression to check.
   * @param suffix The postfix to check for.
   * @return A new {@code Expr} representing the 'ends with' comparison.
   */
  export function endsWith(expr: Expr, suffix: string): EndsWith;

  /**
   * @beta
   *
   * Creates an expression that checks if a string expression ends with a given postfix.
   *
   * ```typescript
   * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
   * endsWith(Field.of("fullName"), Constant.of("Jr."));
   * ```
   *
   * @param expr The expression to check.
   * @param suffix The postfix to check for.
   * @return A new {@code Expr} representing the 'ends with' comparison.
   */
  export function endsWith(expr: Expr, suffix: Expr): EndsWith;

  /**
   * @beta
   *
   * Creates an expression that converts a string field to lowercase.
   *
   * ```typescript
   * // Convert the 'name' field to lowercase
   * toLower("name");
   * ```
   *
   * @param expr The name of the field containing the string.
   * @return A new {@code Expr} representing the lowercase string.
   */
  export function toLower(expr: string): ToLower;

  /**
   * @beta
   *
   * Creates an expression that converts a string expression to lowercase.
   *
   * ```typescript
   * // Convert the 'name' field to lowercase
   * toLower(Field.of("name"));
   * ```
   *
   * @param expr The expression representing the string to convert to lowercase.
   * @return A new {@code Expr} representing the lowercase string.
   */
  export function toLower(expr: Expr): ToLower;

  /**
   * @beta
   *
   * Creates an expression that converts a string field to uppercase.
   *
   * ```typescript
   * // Convert the 'title' field to uppercase
   * toUpper("title");
   * ```
   *
   * @param expr The name of the field containing the string.
   * @return A new {@code Expr} representing the uppercase string.
   */
  export function toUpper(expr: string): ToUpper;

  /**
   * @beta
   *
   * Creates an expression that converts a string expression to uppercase.
   *
   * ```typescript
   * // Convert the 'title' field to uppercase
   * toUppercase(Field.of("title"));
   * ```
   *
   * @param expr The expression representing the string to convert to uppercase.
   * @return A new {@code Expr} representing the uppercase string.
   */
  export function toUpper(expr: Expr): ToUpper;

  /**
   * @beta
   *
   * Creates an expression that removes leading and trailing whitespace from a string field.
   *
   * ```typescript
   * // Trim whitespace from the 'userInput' field
   * trim("userInput");
   * ```
   *
   * @param expr The name of the field containing the string.
   * @return A new {@code Expr} representing the trimmed string.
   */
  export function trim(expr: string): Trim;

  /**
   * @beta
   *
   * Creates an expression that removes leading and trailing whitespace from a string expression.
   *
   * ```typescript
   * // Trim whitespace from the 'userInput' field
   * trim(Field.of("userInput"));
   * ```
   *
   * @param expr The expression representing the string to trim.
   * @return A new {@code Expr} representing the trimmed string.
   */
  export function trim(expr: Expr): Trim;

  /**
   * @beta
   *
   * Creates an expression that concatenates string functions, fields or constants together.
   *
   * ```typescript
   * // Combine the 'firstName', " ", and 'lastName' fields into a single string
   * strConcat("firstName", " ", Field.of("lastName"));
   * ```
   *
   * @param first The field name containing the initial string value.
   * @param elements The expressions (typically strings) to concatenate.
   * @return A new {@code Expr} representing the concatenated string.
   */
  export function strConcat(
    first: string,
    ...elements: (Expr | string)[]
  ): StrConcat;

  /**
   * @beta
   * Creates an expression that concatenates string expressions together.
   *
   * ```typescript
   * // Combine the 'firstName', " ", and 'lastName' fields into a single string
   * strConcat(Field.of("firstName"), " ", Field.of("lastName"));
   * ```
   *
   * @param first The initial string expression to concatenate to.
   * @param elements The expressions (typically strings) to concatenate.
   * @return A new {@code Expr} representing the concatenated string.
   */
  export function strConcat(
    first: Expr,
    ...elements: (Expr | string)[]
  ): StrConcat;

  /**
   * @beta
   *
   * Accesses a value from a map (object) field using the provided key.
   *
   * ```typescript
   * // Get the 'city' value from the 'address' map field
   * mapGet("address", "city");
   * ```
   *
   * @param mapField The field name of the map field.
   * @param subField The key to access in the map.
   * @return A new {@code Expr} representing the value associated with the given key in the map.
   */
  export function mapGet(mapField: string, subField: string): MapGet;

  /**
   * @beta
   *
   * Accesses a value from a map (object) expression using the provided key.
   *
   * ```typescript
   * // Get the 'city' value from the 'address' map field
   * mapGet(Field.of("address"), "city");
   * ```
   *
   * @param mapExpr The expression representing the map.
   * @param subField The key to access in the map.
   * @return A new {@code Expr} representing the value associated with the given key in the map.
   */
  export function mapGet(mapExpr: Expr, subField: string): MapGet;

  /**
   * @beta
   *
   * Creates an aggregation that counts the total number of stage inputs.
   *
   * ```typescript
   * // Count the total number of users
   * countAll().as("totalUsers");
   * ```
   *
   * @return A new {@code Accumulator} representing the 'countAll' aggregation.
   */
  export function countAll(): Count;

  /**
   * @beta
   *
   * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
   * provided expression.
   *
   * ```typescript
   * // Count the number of items where the price is greater than 10
   * count(Field.of("price").gt(10)).as("expensiveItemCount");
   * ```
   *
   * @param value The expression to count.
   * @return A new {@code Accumulator} representing the 'count' aggregation.
   */
  export function count(value: Expr): Count;

  /**
   * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
   * provided field.
   *
   * ```typescript
   * // Count the total number of products
   * count("productId").as("totalProducts");
   * ```
   *
   * @param value The name of the field to count.
   * @return A new {@code Accumulator} representing the 'count' aggregation.
   */
  export function count(value: string): Count;

  /**
   * @beta
   *
   * Creates an aggregation that calculates the sum of values from an expression across multiple
   * stage inputs.
   *
   * ```typescript
   * // Calculate the total revenue from a set of orders
   * sum(Field.of("orderAmount")).as("totalRevenue");
   * ```
   *
   * @param value The expression to sum up.
   * @return A new {@code Accumulator} representing the 'sum' aggregation.
   */
  export function sum(value: Expr): Sum;

  /**
   * @beta
   *
   * Creates an aggregation that calculates the sum of a field's values across multiple stage
   * inputs.
   *
   * ```typescript
   * // Calculate the total revenue from a set of orders
   * sum("orderAmount").as("totalRevenue");
   * ```
   *
   * @param value The name of the field containing numeric values to sum up.
   * @return A new {@code Accumulator} representing the 'sum' aggregation.
   */
  export function sum(value: string): Sum;

  /**
   * @beta
   *
   * Creates an aggregation that calculates the average (mean) of values from an expression across
   * multiple stage inputs.
   *
   * ```typescript
   * // Calculate the average age of users
   * avg(Field.of("age")).as("averageAge");
   * ```
   *
   * @param value The expression representing the values to average.
   * @return A new {@code Accumulator} representing the 'avg' aggregation.
   */
  export function avg(value: Expr): Avg;

  /**
   * @beta
   *
   * Creates an aggregation that calculates the average (mean) of a field's values across multiple
   * stage inputs.
   *
   * ```typescript
   * // Calculate the average age of users
   * avg("age").as("averageAge");
   * ```
   *
   * @param value The name of the field containing numeric values to average.
   * @return A new {@code Accumulator} representing the 'avg' aggregation.
   */
  export function avg(value: string): Avg;

  /**
   * @beta
   *
   * Creates an aggregation that finds the minimum value of an expression across multiple stage
   * inputs.
   *
   * ```typescript
   * // Find the lowest price of all products
   * minimum(Field.of("price")).as("lowestPrice");
   * ```
   *
   * @param value The expression to find the minimum value of.
   * @return A new {@code Accumulator} representing the 'minimum' aggregation.
   */
  export function minimum(value: Expr): Minimum;

  /**
   * @beta
   *
   * Creates an aggregation that finds the minimum value of a field across multiple stage inputs.
   *
   * ```typescript
   * // Find the lowest price of all products
   * minimum("price").as("lowestPrice");
   * ```
   *
   * @param value The name of the field to find the minimum value of.
   * @return A new {@code Accumulator} representing the 'minimum' aggregation.
   */
  export function minimum(value: string): Minimum;

  /**
   * @beta
   *
   * Creates an aggregation that finds the maximum value of an expression across multiple stage
   * inputs.
   *
   * ```typescript
   * // Find the highest score in a leaderboard
   * maximum(Field.of("score")).as("highestScore");
   * ```
   *
   * @param value The expression to find the maximum value of.
   * @return A new {@code Accumulator} representing the 'maximum' aggregation.
   */
  export function maximum(value: Expr): Maximim;

  /**
   * @beta
   *
   * Creates an aggregation that finds the maximum value of a field across multiple stage inputs.
   *
   * ```typescript
   * // Find the highest score in a leaderboard
   * maximum("score").as("highestScore");
   * ```
   *
   * @param value The name of the field to find the maximum value of.
   * @return A new {@code Accumulator} representing the 'maximum' aggregation.
   */
  export function maximum(value: string): Maximim;

  /**
   * @beta
   *
   * Calculates the Cosine distance between a field's vector value and a double array.
   *
   * ```typescript
   * // Calculate the Cosine distance between the 'location' field and a target location
   * cosineDistance("location", [37.7749, -122.4194]);
   * ```
   *
   * @param expr The name of the field containing the first vector.
   * @param other The other vector (as an array of doubles) to compare against.
   * @return A new {@code Expr} representing the Cosine distance between the two vectors.
   */
  export function cosineDistance(expr: string, other: number[]): CosineDistance;

  /**
   * @beta
   *
   * Calculates the Cosine distance between a field's vector value and a VectorValue.
   *
   * ```typescript
   * // Calculate the Cosine distance between the 'location' field and a target location
   * cosineDistance("location", new VectorValue([37.7749, -122.4194]));
   * ```
   *
   * @param expr The name of the field containing the first vector.
   * @param other The other vector (as a VectorValue) to compare against.
   * @return A new {@code Expr} representing the Cosine distance between the two vectors.
   */
  export function cosineDistance(
    expr: string,
    other: VectorValue
  ): CosineDistance;

  /**
   * @beta
   *
   * Calculates the Cosine distance between a field's vector value and a vector expression.
   *
   * ```typescript
   * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
   * cosineDistance("userVector", Field.of("itemVector"));
   * ```
   *
   * @param expr The name of the field containing the first vector.
   * @param other The other vector (represented as an Expr) to compare against.
   * @return A new {@code Expr} representing the cosine distance between the two vectors.
   */
  export function cosineDistance(expr: string, other: Expr): CosineDistance;

  /**
   * @beta
   *
   * Calculates the Cosine distance between a vector expression and a double array.
   *
   * ```typescript
   * // Calculate the cosine distance between the 'location' field and a target location
   * cosineDistance(Field.of("location"), [37.7749, -122.4194]);
   * ```
   *
   * @param expr The first vector (represented as an Expr) to compare against.
   * @param other The other vector (as an array of doubles) to compare against.
   * @return A new {@code Expr} representing the cosine distance between the two vectors.
   */
  export function cosineDistance(expr: Expr, other: number[]): CosineDistance;

  /**
   * @beta
   *
   * Calculates the Cosine distance between a vector expression and a VectorValue.
   *
   * ```typescript
   * // Calculate the cosine distance between the 'location' field and a target location
   * cosineDistance(Field.of("location"), new VectorValue([37.7749, -122.4194]));
   * ```
   *
   * @param expr The first vector (represented as an Expr) to compare against.
   * @param other The other vector (as a VectorValue) to compare against.
   * @return A new {@code Expr} representing the cosine distance between the two vectors.
   */
  export function cosineDistance(
    expr: Expr,
    other: VectorValue
  ): CosineDistance;

  /**
   * @beta
   *
   * Calculates the Cosine distance between two vector expressions.
   *
   * ```typescript
   * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
   * cosineDistance(Field.of("userVector"), Field.of("itemVector"));
   * ```
   *
   * @param expr The first vector (represented as an Expr) to compare against.
   * @param other The other vector (represented as an Expr) to compare against.
   * @return A new {@code Expr} representing the cosine distance between the two vectors.
   */
  export function cosineDistance(expr: Expr, other: Expr): CosineDistance;

  /**
   * @beta
   *
   * Calculates the dot product between a field's vector value and a double array.
   *
   * ```typescript
   * // Calculate the dot product distance between a feature vector and a target vector
   * dotProduct("features", [0.5, 0.8, 0.2]);
   * ```
   *
   * @param expr The name of the field containing the first vector.
   * @param other The other vector (as an array of doubles) to calculate with.
   * @return A new {@code Expr} representing the dot product between the two vectors.
   */
  export function dotProduct(expr: string, other: number[]): DotProduct;

  /**
   * @beta
   *
   * Calculates the dot product between a field's vector value and a VectorValue.
   *
   * ```typescript
   * // Calculate the dot product distance between a feature vector and a target vector
   * dotProduct("features", new VectorValue([0.5, 0.8, 0.2]));
   * ```
   *
   * @param expr The name of the field containing the first vector.
   * @param other The other vector (as a VectorValue) to calculate with.
   * @return A new {@code Expr} representing the dot product between the two vectors.
   */
  export function dotProduct(expr: string, other: VectorValue): DotProduct;

  /**
   * @beta
   *
   * Calculates the dot product between a field's vector value and a vector expression.
   *
   * ```typescript
   * // Calculate the dot product distance between two document vectors: 'docVector1' and 'docVector2'
   * dotProduct("docVector1", Field.of("docVector2"));
   * ```
   *
   * @param expr The name of the field containing the first vector.
   * @param other The other vector (represented as an Expr) to calculate with.
   * @return A new {@code Expr} representing the dot product between the two vectors.
   */
  export function dotProduct(expr: string, other: Expr): DotProduct;

  /**
   * @beta
   *
   * Calculates the dot product between a vector expression and a double array.
   *
   * ```typescript
   * // Calculate the dot product between a feature vector and a target vector
   * dotProduct(Field.of("features"), [0.5, 0.8, 0.2]);
   * ```
   *
   * @param expr The first vector (represented as an Expr) to calculate with.
   * @param other The other vector (as an array of doubles) to calculate with.
   * @return A new {@code Expr} representing the dot product between the two vectors.
   */
  export function dotProduct(expr: Expr, other: number[]): DotProduct;

  /**
   * @beta
   *
   * Calculates the dot product between a vector expression and a VectorValue.
   *
   * ```typescript
   * // Calculate the dot product between a feature vector and a target vector
   * dotProduct(Field.of("features"), new VectorValue([0.5, 0.8, 0.2]));
   * ```
   *
   * @param expr The first vector (represented as an Expr) to calculate with.
   * @param other The other vector (as a VectorValue) to calculate with.
   * @return A new {@code Expr} representing the dot product between the two vectors.
   */
  export function dotProduct(expr: Expr, other: VectorValue): DotProduct;

  /**
   * @beta
   *
   * Calculates the dot product between two vector expressions.
   *
   * ```typescript
   * // Calculate the dot product between two document vectors: 'docVector1' and 'docVector2'
   * dotProduct(Field.of("docVector1"), Field.of("docVector2"));
   * ```
   *
   * @param expr The first vector (represented as an Expr) to calculate with.
   * @param other The other vector (represented as an Expr) to calculate with.
   * @return A new {@code Expr} representing the dot product between the two vectors.
   */
  export function dotProduct(expr: Expr, other: Expr): DotProduct;

  /**
   * @beta
   *
   * Calculates the Euclidean distance between a field's vector value and a double array.
   *
   * ```typescript
   * // Calculate the Euclidean distance between the 'location' field and a target location
   * euclideanDistance("location", [37.7749, -122.4194]);
   * ```
   *
   * @param expr The name of the field containing the first vector.
   * @param other The other vector (as an array of doubles) to compare against.
   * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
   */
  export function euclideanDistance(
    expr: string,
    other: number[]
  ): EuclideanDistance;

  /**
   * @beta
   *
   * Calculates the Euclidean distance between a field's vector value and a VectorValue.
   *
   * ```typescript
   * // Calculate the Euclidean distance between the 'location' field and a target location
   * euclideanDistance("location", new VectorValue([37.7749, -122.4194]));
   * ```
   *
   * @param expr The name of the field containing the first vector.
   * @param other The other vector (as a VectorValue) to compare against.
   * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
   */
  export function euclideanDistance(
    expr: string,
    other: VectorValue
  ): EuclideanDistance;

  /**
   * @beta
   *
   * Calculates the Euclidean distance between a field's vector value and a vector expression.
   *
   * ```typescript
   * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
   * euclideanDistance("pointA", Field.of("pointB"));
   * ```
   *
   * @param expr The name of the field containing the first vector.
   * @param other The other vector (represented as an Expr) to compare against.
   * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
   */
  export function euclideanDistance(
    expr: string,
    other: Expr
  ): EuclideanDistance;

  /**
   * @beta
   *
   * Calculates the Euclidean distance between a vector expression and a double array.
   *
   * ```typescript
   * // Calculate the Euclidean distance between the 'location' field and a target location
   *
   * euclideanDistance(Field.of("location"), [37.7749, -122.4194]);
   * ```
   *
   * @param expr The first vector (represented as an Expr) to compare against.
   * @param other The other vector (as an array of doubles) to compare against.
   * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
   */
  export function euclideanDistance(
    expr: Expr,
    other: number[]
  ): EuclideanDistance;

  /**
   * @beta
   *
   * Calculates the Euclidean distance between a vector expression and a VectorValue.
   *
   * ```typescript
   * // Calculate the Euclidean distance between the 'location' field and a target location
   * euclideanDistance(Field.of("location"), new VectorValue([37.7749, -122.4194]));
   * ```
   *
   * @param expr The first vector (represented as an Expr) to compare against.
   * @param other The other vector (as a VectorValue) to compare against.
   * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
   */
  export function euclideanDistance(
    expr: Expr,
    other: VectorValue
  ): EuclideanDistance;

  /**
   * @beta
   *
   * Calculates the Euclidean distance between two vector expressions.
   *
   * ```typescript
   * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
   * euclideanDistance(Field.of("pointA"), Field.of("pointB"));
   * ```
   *
   * @param expr The first vector (represented as an Expr) to compare against.
   * @param other The other vector (represented as an Expr) to compare against.
   * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
   */
  export function euclideanDistance(expr: Expr, other: Expr): EuclideanDistance;

  /**
   * @beta
   *
   * Creates an expression that calculates the length of a Firestore Vector.
   *
   * ```typescript
   * // Get the vector length (dimension) of the field 'embedding'.
   * vectorLength(Field.of("embedding"));
   * ```
   *
   * @param expr The expression representing the Firestore Vector.
   * @return A new {@code Expr} representing the length of the array.
   */
  export function vectorLength(expr: Expr): VectorLength;

  /**
   * @beta
   *
   * Creates an expression that calculates the length of a Firestore Vector represented by a field.
   *
   * ```typescript
   * // Get the vector length (dimension) of the field 'embedding'.
   * vectorLength("embedding");
   * ```
   *
   * @param field The name of the field representing the Firestore Vector.
   * @return A new {@code Expr} representing the length of the array.
   */
  export function vectorLength(field: string): VectorLength;

  /**
   * @beta
   *
   * Creates an expression that interprets an expression as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
   * and returns a timestamp.
   *
   * ```typescript
   * // Interpret the 'microseconds' field as microseconds since epoch.
   * unixMicrosToTimestamp(Field.of("microseconds"));
   * ```
   *
   * @param expr The expression representing the number of microseconds since epoch.
   * @return A new {@code Expr} representing the timestamp.
   */
  export function unixMicrosToTimestamp(expr: Expr): UnixMicrosToTimestamp;

  /**
   * @beta
   *
   * Creates an expression that interprets a field's value as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
   * and returns a timestamp.
   *
   * ```typescript
   * // Interpret the 'microseconds' field as microseconds since epoch.
   * unixMicrosToTimestamp("microseconds");
   * ```
   *
   * @param field The name of the field representing the number of microseconds since epoch.
   * @return A new {@code Expr} representing the timestamp.
   */
  export function unixMicrosToTimestamp(field: string): UnixMicrosToTimestamp;

  /**
   * @beta
   *
   * Creates an expression that converts a timestamp expression to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
   *
   * ```typescript
   * // Convert the 'timestamp' field to microseconds since epoch.
   * timestampToUnixMicros(Field.of("timestamp"));
   * ```
   *
   * @param expr The expression representing the timestamp.
   * @return A new {@code Expr} representing the number of microseconds since epoch.
   */
  export function timestampToUnixMicros(expr: Expr): TimestampToUnixMicros;

  /**
   * @beta
   *
   * Creates an expression that converts a timestamp field to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
   *
   * ```typescript
   * // Convert the 'timestamp' field to microseconds since epoch.
   * timestampToUnixMicros("timestamp");
   * ```
   *
   * @param field The name of the field representing the timestamp.
   * @return A new {@code Expr} representing the number of microseconds since epoch.
   */
  export function timestampToUnixMicros(field: string): TimestampToUnixMicros;

  /**
   * @beta
   *
   * Creates an expression that interprets an expression as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
   * and returns a timestamp.
   *
   * ```typescript
   * // Interpret the 'milliseconds' field as milliseconds since epoch.
   * unixMillisToTimestamp(Field.of("milliseconds"));
   * ```
   *
   * @param expr The expression representing the number of milliseconds since epoch.
   * @return A new {@code Expr} representing the timestamp.
   */
  export function unixMillisToTimestamp(expr: Expr): UnixMillisToTimestamp;

  /**
   * @beta
   *
   * Creates an expression that interprets a field's value as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
   * and returns a timestamp.
   *
   * ```typescript
   * // Interpret the 'milliseconds' field as milliseconds since epoch.
   * unixMillisToTimestamp("milliseconds");
   * ```
   *
   * @param field The name of the field representing the number of milliseconds since epoch.
   * @return A new {@code Expr} representing the timestamp.
   */
  export function unixMillisToTimestamp(field: string): UnixMillisToTimestamp;

  /**
   * @beta
   *
   * Creates an expression that converts a timestamp expression to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
   *
   * ```typescript
   * // Convert the 'timestamp' field to milliseconds since epoch.
   * timestampToUnixMillis(Field.of("timestamp"));
   * ```
   *
   * @param expr The expression representing the timestamp.
   * @return A new {@code Expr} representing the number of milliseconds since epoch.
   */
  export function timestampToUnixMillis(expr: Expr): TimestampToUnixMillis;

  /**
   * @beta
   *
   * Creates an expression that converts a timestamp field to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
   *
   * ```typescript
   * // Convert the 'timestamp' field to milliseconds since epoch.
   * timestampToUnixMillis("timestamp");
   * ```
   *
   * @param field The name of the field representing the timestamp.
   * @return A new {@code Expr} representing the number of milliseconds since epoch.
   */
  export function timestampToUnixMillis(field: string): TimestampToUnixMillis;

  /**
   * @beta
   *
   * Creates an expression that interprets an expression as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
   * and returns a timestamp.
   *
   * ```typescript
   * // Interpret the 'seconds' field as seconds since epoch.
   * unixSecondsToTimestamp(Field.of("seconds"));
   * ```
   *
   * @param expr The expression representing the number of seconds since epoch.
   * @return A new {@code Expr} representing the timestamp.
   */
  export function unixSecondsToTimestamp(expr: Expr): UnixSecondsToTimestamp;

  /**
   * @beta
   *
   * Creates an expression that interprets a field's value as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
   * and returns a timestamp.
   *
   * ```typescript
   * // Interpret the 'seconds' field as seconds since epoch.
   * unixSecondsToTimestamp("seconds");
   * ```
   *
   * @param field The name of the field representing the number of seconds since epoch.
   * @return A new {@code Expr} representing the timestamp.
   */
  export function unixSecondsToTimestamp(field: string): UnixSecondsToTimestamp;

  /**
   * @beta
   *
   * Creates an expression that converts a timestamp expression to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
   *
   * ```typescript
   * // Convert the 'timestamp' field to seconds since epoch.
   * timestampToUnixSeconds(Field.of("timestamp"));
   * ```
   *
   * @param expr The expression representing the timestamp.
   * @return A new {@code Expr} representing the number of seconds since epoch.
   */
  export function timestampToUnixSeconds(expr: Expr): TimestampToUnixSeconds;

  /**
   * @beta
   *
   * Creates an expression that converts a timestamp field to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
   *
   * ```typescript
   * // Convert the 'timestamp' field to seconds since epoch.
   * timestampToUnixSeconds("timestamp");
   * ```
   *
   * @param field The name of the field representing the timestamp.
   * @return A new {@code Expr} representing the number of seconds since epoch.
   */
  export function timestampToUnixSeconds(field: string): TimestampToUnixSeconds;

  /**
   * @beta
   *
   * Creates an expression that adds a specified amount of time to a timestamp.
   *
   * ```typescript
   * // Add some duration determined by field 'unit' and 'amount' to the 'timestamp' field.
   * timestampAdd(Field.of("timestamp"), Field.of("unit"), Field.of("amount"));
   * ```
   *
   * @param timestamp The expression representing the timestamp.
   * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
   * @param amount The expression evaluates to amount of the unit.
   * @return A new {@code Expr} representing the resulting timestamp.
   */
  export function timestampAdd(
    timestamp: Expr,
    unit: Expr,
    amount: Expr
  ): TimestampAdd;

  /**
   * @beta
   *
   * Creates an expression that adds a specified amount of time to a timestamp.
   *
   * ```typescript
   * // Add 1 day to the 'timestamp' field.
   * timestampAdd(Field.of("timestamp"), "day", 1);
   * ```
   *
   * @param timestamp The expression representing the timestamp.
   * @param unit The unit of time to add (e.g., "day", "hour").
   * @param amount The amount of time to add.
   * @return A new {@code Expr} representing the resulting timestamp.
   */
  export function timestampAdd(
    timestamp: Expr,
    unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
    amount: number
  ): TimestampAdd;

  /**
   * @beta
   *
   * Creates an expression that adds a specified amount of time to a timestamp represented by a field.
   *
   * ```typescript
   * // Add 1 day to the 'timestamp' field.
   * timestampAdd("timestamp", "day", 1);
   * ```
   *
   * @param field The name of the field representing the timestamp.
   * @param unit The unit of time to add (e.g., "day", "hour").
   * @param amount The amount of time to add.
   * @return A new {@code Expr} representing the resulting timestamp.
   */
  export function timestampAdd(
    field: string,
    unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
    amount: number
  ): TimestampAdd;

  /**
   * @beta
   *
   * Creates an expression that subtracts a specified amount of time from a timestamp.
   *
   * ```typescript
   * // Subtract some duration determined by field 'unit' and 'amount' from the 'timestamp' field.
   * timestampSub(Field.of("timestamp"), Field.of("unit"), Field.of("amount"));
   * ```
   *
   * @param timestamp The expression representing the timestamp.
   * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
   * @param amount The expression evaluates to amount of the unit.
   * @return A new {@code Expr} representing the resulting timestamp.
   */
  export function timestampSub(
    timestamp: Expr,
    unit: Expr,
    amount: Expr
  ): TimestampSub;

  /**
   * @beta
   *
   * Creates an expression that subtracts a specified amount of time from a timestamp.
   *
   * ```typescript
   * // Subtract 1 day from the 'timestamp' field.
   * timestampSub(Field.of("timestamp"), "day", 1);
   * ```
   *
   * @param timestamp The expression representing the timestamp.
   * @param unit The unit of time to subtract (e.g., "day", "hour").
   * @param amount The amount of time to subtract.
   * @return A new {@code Expr} representing the resulting timestamp.
   */
  export function timestampSub(
    timestamp: Expr,
    unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
    amount: number
  ): TimestampSub;

  /**
   * @beta
   *
   * Creates an expression that subtracts a specified amount of time from a timestamp represented by a field.
   *
   * ```typescript
   * // Subtract 1 day from the 'timestamp' field.
   * timestampSub("timestamp", "day", 1);
   * ```
   *
   * @param field The name of the field representing the timestamp.
   * @param unit The unit of time to subtract (e.g., "day", "hour").
   * @param amount The amount of time to subtract.
   * @return A new {@code Expr} representing the resulting timestamp.
   */
  export function timestampSub(
    field: string,
    unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
    amount: number
  ): TimestampSub;

  /**
   * @beta
   *
   * Creates functions that work on the backend but do not exist in the SDK yet.
   *
   * ```typescript
   * // Call a user defined function named "myFunc" with the arguments 10 and 20
   * // This is the same of the 'sum(Field.of("price"))', if it did not exist
   * genericFunction("sum", [Field.of("price")]);
   * ```
   *
   * @param name The name of the user defined function.
   * @param params The arguments to pass to the function.
   * @return A new {@code Function} representing the function call.
   */
  export function genericFunction(name: string, params: Expr[]): Function;

  /**
   * @beta
   *
   * Creates an {@link Ordering} that sorts documents in ascending order based on this expression.
   *
   * ```typescript
   * // Sort documents by the 'name' field in ascending order
   * firestore.pipeline().collection("users")
   *   .sort(ascending(Field.of("name")));
   * ```
   *
   * @param expr The expression to create an ascending ordering for.
   * @return A new `Ordering` for ascending sorting.
   */
  export function ascending(expr: Expr): Ordering;

  /**
   * @beta
   *
   * Creates an {@link Ordering} that sorts documents in descending order based on this expression.
   *
   * ```typescript
   * // Sort documents by the 'createdAt' field in descending order
   * firestore.pipeline().collection("users")
   *   .sort(descending(Field.of("createdAt")));
   * ```
   *
   * @param expr The expression to create a descending ordering for.
   * @return A new `Ordering` for descending sorting.
   */
  export function descending(expr: Expr): Ordering;

  /**
   * @beta
   *
   * Represents an ordering criterion for sorting documents in a Firestore pipeline.
   *
   * You create `Ordering` instances using the `ascending` and `descending` helper functions.
   */
  export class Ordering {
    /**
     * @param expr The expression to order by.
     * @param direction The direction to order by.
     */
    constructor(expr: Expr, direction: 'ascending' | 'descending');
  }

  /**
   * @beta
   */
  export interface Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class AddFields implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class RemoveFields implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class Aggregate implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class Distinct implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class CollectionSource implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class CollectionGroupSource implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class DatabaseSource implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class DocumentsSource implements Stage {
    name: string;

    static of(refs: DocumentReference[]): DocumentsSource;
  }

  /**
   * @beta
   */
  export class Where implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export interface FindNearestOptions {
    field: Field;
    vectorValue: VectorValue | number[];
    distanceMeasure: 'euclidean' | 'cosine' | 'dot_product';
    limit?: number;
    distanceField?: string;
  }

  /**
   * @beta
   */
  export class FindNearest implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class Limit implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class Offset implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class Select implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class Sort implements Stage {
    name: string;
  }

  /**
   * @beta
   */
  export class GenericStage implements Stage {
    name: string;
  }

  /**
   * Represents the source of a Firestore {@link Pipeline}.
   * @beta
   */
  export class PipelineSource {
    /**
     * Specifies the source as a collection.
     *
     * @param collectionPath The path to the collection.
     * @return A new Pipeline object with the collection as the source.
     */
    collection(collectionPath: string): Pipeline;

    /**
     * Specifies the source as a collection group.
     *
     * @param collectionId The ID of the collection group.
     * @return A new Pipeline object with the collection group as the source.
     */
    collectionGroup(collectionId: string): Pipeline;

    /**
     * Specifies the source as a database.
     *
     * @return A new Pipeline object with the database as the source.
     */
    database(): Pipeline;

    /**
     * Specifies the source as a set of documents.
     *
     * @param docs The document references.
     * @return A new Pipeline object with the documents as the source.
     */
    documents(docs: DocumentReference[]): Pipeline;
  }

  /**
   * @beta
   *
   * The Pipeline class provides a flexible and expressive framework for building complex data
   * transformation and query pipelines for Firestore.
   *
   * A pipeline takes data sources, such as Firestore collections or collection groups, and applies
   * a series of stages that are chained together. Each stage takes the output from the previous stage
   * (or the data source) and produces an output for the next stage (or as the final output of the
   * pipeline).
   *
   * Expressions can be used within each stage to filter and transform data through the stage.
   *
   * NOTE: The chained stages do not prescribe exactly how Firestore will execute the pipeline.
   * Instead, Firestore only guarantees that the result is the same as if the chained stages were
   * executed in order.
   *
   * Usage Examples:
   *
   * ```typescript
   * const db: Firestore; // Assumes a valid firestore instance.
   *
   * // Example 1: Select specific fields and rename 'rating' to 'bookRating'
   * const results1 = await db.pipeline()
   *     .collection("books")
   *     .select("title", "author", Field.of("rating").as("bookRating"))
   *     .execute();
   *
   * // Example 2: Filter documents where 'genre' is "Science Fiction" and 'published' is after 1950
   * const results2 = await db.pipeline()
   *     .collection("books")
   *     .where(and(Field.of("genre").eq("Science Fiction"), Field.of("published").gt(1950)))
   *     .execute();
   *
   * // Example 3: Calculate the average rating of books published after 1980
   * const results3 = await db.pipeline()
   *     .collection("books")
   *     .where(Field.of("published").gt(1980))
   *     .aggregate(avg(Field.of("rating")).as("averageRating"))
   *     .execute();
   * ```
   */
  export class Pipeline<AppModelType = DocumentData> {
    /**
     * Adds new fields to outputs from previous stages.
     *
     * This stage allows you to compute values on-the-fly based on existing data from previous
     * stages or constants. You can use this to create new fields or overwrite existing ones (if there
     * is name overlaps).
     *
     * The added fields are defined using {@link Selectable}s, which can be:
     *
     * - {@link Field}: References an existing document field.
     * - {@link Function}: Performs a calculation using functions like `add`, `multiply` with
     *   assigned aliases using {@link Expr#as}.
     *
     * Example:
     *
     * ```typescript
     * firestore.pipeline().collection("books")
     *   .addFields(
     *     Field.of("rating").as("bookRating"), // Rename 'rating' to 'bookRating'
     *     add(5, Field.of("quantity")).as("totalCost")  // Calculate 'totalCost'
     *   );
     * ```
     *
     * @param fields The fields to add to the documents, specified as {@link Selectable}s.
     * @return A new Pipeline object with this stage appended to the stage list.
     */
    addFields(...fields: Selectable[]): Pipeline<AppModelType>;

    /**
     * Remove fields from outputs of previous stages.
     *
     * Example:
     *
     * ```typescript
     * firestore.pipeline().collection("books")
     *   // removes field 'rating' and 'cost' from the previous stage outputs.
     *   .removeFields(
     *     Field.of("rating"),
     *     "cost"
     *   );
     * ```
     *
     * @param fields The fields to remove.
     * @return A new Pipeline object with this stage appended to the stage list.
     */
    removeFields(...fields: (Field | string)[]): Pipeline<AppModelType>;

    /**
     * Selects or creates a set of fields from the outputs of previous stages.
     *
     * <p>The selected fields are defined using {@link Selectable} expressions, which can be:
     *
     * <ul>
     *   <li>{@code string}: Name of an existing field</li>
     *   <li>{@link Field}: References an existing field.</li>
     *   <li>{@link Function}: Represents the result of a function with an assigned alias name using
     *       {@link Expr#as}</li>
     * </ul>
     *
     * <p>If no selections are provided, the output of this stage is empty. Use {@link
     * com.google.cloud.firestore.Pipeline#addFields} instead if only additions are
     * desired.
     *
     * <p>Example:
     *
     * ```typescript
     * firestore.pipeline().collection("books")
     *   .select(
     *     "firstName",
     *     Field.of("lastName"),
     *     Field.of("address").toUppercase().as("upperAddress"),
     *   );
     * ```
     *
     * @param selections The fields to include in the output documents, specified as {@link
     *     Selectable} expressions or {@code string} values representing field names.
     * @return A new Pipeline object with this stage appended to the stage list.
     */
    select(...fields: (Selectable | string)[]): Pipeline<AppModelType>;

    /**
     * Filters the documents from previous stages to only include those matching the specified {@link
     * FilterCondition}.
     *
     * <p>This stage allows you to apply conditions to the data, similar to a "WHERE" clause in SQL.
     * You can filter documents based on their field values, using implementations of {@link
     * FilterCondition}, typically including but not limited to:
     *
     * <ul>
     *   <li>field comparators: {@link Function#eq}, {@link Function#lt} (less than), {@link
     *       Function#gt} (greater than), etc.</li>
     *   <li>logical operators: {@link Function#and}, {@link Function#or}, {@link Function#not}, etc.</li>
     *   <li>advanced functions: {@link Function#regexMatch}, {@link
     *       Function#arrayContains}, etc.</li>
     * </ul>
     *
     * <p>Example:
     *
     * ```typescript
     * firestore.pipeline().collection("books")
     *   .where(
     *     and(
     *         gt(Field.of("rating"), 4.0),   // Filter for ratings greater than 4.0
     *         Field.of("genre").eq("Science Fiction") // Equivalent to gt("genre", "Science Fiction")
     *     )
     *   );
     * ```
     *
     * @param condition The {@link FilterCondition} to apply.
     * @return A new Pipeline object with this stage appended to the stage list.
     */
    where(condition: FilterCondition & Expr): Pipeline<AppModelType>;

    /**
     * Skips the first `offset` number of documents from the results of previous stages.
     *
     * <p>This stage is useful for implementing pagination in your pipelines, allowing you to retrieve
     * results in chunks. It is typically used in conjunction with {@link #limit} to control the
     * size of each page.
     *
     * <p>Example:
     *
     * ```typescript
     * // Retrieve the second page of 20 results
     * firestore.pipeline().collection("books")
     *     .sort(Field.of("published").descending())
     *     .offset(20)  // Skip the first 20 results
     *     .limit(20);   // Take the next 20 results
     * ```
     *
     * @param offset The number of documents to skip.
     * @return A new Pipeline object with this stage appended to the stage list.
     */
    offset(offset: number): Pipeline<AppModelType>;

    /**
     * Limits the maximum number of documents returned by previous stages to `limit`.
     *
     * <p>This stage is particularly useful when you want to retrieve a controlled subset of data from
     * a potentially large result set. It's often used for:
     *
     * <ul>
     *   <li>**Pagination:** In combination with {@link #offset} to retrieve specific pages of
     *       results.</li>
     *   <li>**Limiting Data Retrieval:** To prevent excessive data transfer and improve performance,
     *       especially when dealing with large collections.</li>
     * </ul>
     *
     * <p>Example:
     *
     * ```typescript
     * // Limit the results to the top 10 highest-rated books
     * firestore.pipeline().collection("books")
     *     .sort(Field.of("rating").descending())
     *     .limit(10);
     * ```
     *
     * @param limit The maximum number of documents to return.
     * @return A new Pipeline object with this stage appended to the stage list.
     */
    limit(limit: number): Pipeline<AppModelType>;

    /**
     * Returns a set of distinct {@link Expr} values from the inputs to this stage.
     *
     * <p>This stage run through the results from previous stages to include only results with unique
     * combinations of {@link Expr} values ({@link Field}, {@link Function}, etc).
     *
     * <p>The parameters to this stage are defined using {@link Selectable} expressions or {@code string}s:
     *
     * <ul>
     *   <li>{@code string}: Name of an existing field</li>
     *   <li>{@link Field}: References an existing document field.</li>
     *   <li>{@link Function}: Represents the result of a function with an assigned alias name using
     *       {@link Expr#as}</li>
     * </ul>
     *
     * <p>Example:
     *
     * ```typescript
     * // Get a list of unique author names in uppercase and genre combinations.
     * firestore.pipeline().collection("books")
     *     .distinct(toUppercase(Field.of("author")).as("authorName"), Field.of("genre"), "publishedAt")
     *     .select("authorName");
     * ```
     *
     * @param selectables The {@link Selectable} expressions to consider when determining distinct
     *     value combinations or {@code string}s representing field names.
     * @return A new {@code Pipeline} object with this stage appended to the stage list.
     */
    distinct(...groups: (string | Selectable)[]): Pipeline<AppModelType>;

    /**
     * Performs aggregation operations on the documents from previous stages.
     *
     * <p>This stage allows you to calculate aggregate values over a set of documents. You define the
     * aggregations to perform using {@link AccumulatorTarget} expressions which are typically results of
     * calling {@link Expr#as} on {@link Accumulator} instances.
     *
     * <p>Example:
     *
     * ```typescript
     * // Calculate the average rating and the total number of books
     * firestore.pipeline().collection("books")
     *     .aggregate(
     *         Field.of("rating").avg().as("averageRating"),
     *         countAll().as("totalBooks")
     *     );
     * ```
     *
     * @param accumulators The {@link AccumulatorTarget} expressions, each wrapping an {@link Accumulator}
     *     and provide a name for the accumulated results.
     * @return A new Pipeline object with this stage appended to the stage list.
     */
    aggregate(...accumulators: AccumulatorTarget[]): Pipeline<AppModelType>;
    /**
     * Performs optionally grouped aggregation operations on the documents from previous stages.
     *
     * <p>This stage allows you to calculate aggregate values over a set of documents, optionally
     * grouped by one or more fields or functions. You can specify:
     *
     * <ul>
     *   <li>**Grouping Fields or Functions:** One or more fields or functions to group the documents
     *       by. For each distinct combination of values in these fields, a separate group is created.
     *       If no grouping fields are provided, a single group containing all documents is used. Not
     *       specifying groups is the same as putting the entire inputs into one group.</li>
     *   <li>**Accumulators:** One or more accumulation operations to perform within each group. These
     *       are defined using {@link AccumulatorTarget} expressions, which are typically created by
     *       calling {@link Expr#as} on {@link Accumulator} instances. Each aggregation
     *       calculates a value (e.g., sum, average, count) based on the documents within its group.</li>
     * </ul>
     *
     * <p>Example:
     *
     * ```typescript
     * // Calculate the average rating for each genre.
     * firestore.pipeline().collection("books")
     *   .aggregate({
     *       accumulators: [avg(Field.of("rating")).as("avg_rating")]
     *       groups: ["genre"]
     *       });
     * ```
     *
     * @param aggregate An {@link Aggregate} object that specifies the grouping fields (if any) and
     *     the aggregation operations to perform.
     * @return A new {@code Pipeline} object with this stage appended to the stage list.
     */
    aggregate(options: {
      accumulators: AccumulatorTarget[];
      groups?: (string | Selectable)[];
    }): Pipeline<AppModelType>;

    findNearest(options: FindNearestOptions): Pipeline<AppModelType>;

    /**
     * Sorts the documents from previous stages based on one or more {@link Ordering} criteria.
     *
     * <p>This stage allows you to order the results of your pipeline. You can specify multiple {@link
     * Ordering} instances to sort by multiple fields in ascending or descending order. If documents
     * have the same value for a field used for sorting, the next specified ordering will be used. If
     * all orderings result in equal comparison, the documents are considered equal and the order is
     * unspecified.
     *
     * <p>Example:
     *
     * ```typescript
     * // Sort books by rating in descending order, and then by title in ascending order for books
     * // with the same rating
     * firestore.pipeline().collection("books")
     *     .sort(
     *         Field.of("rating").descending(),
     *         Field.of("title").ascending()
     *     );
     * ```
     *
     * @param orders One or more {@link Ordering} instances specifying the sorting criteria.
     * @return A new {@code Pipeline} object with this stage appended to the stage list.
     */
    sort(...orderings: Ordering[]): Pipeline<AppModelType>;
    sort(options: {orderings: Ordering[]}): Pipeline<AppModelType>;

    /**
     * Adds a generic stage to the pipeline.
     *
     * <p>This method provides a flexible way to extend the pipeline's functionality by adding custom
     * stages. Each generic stage is defined by a unique `name` and a set of `params` that control its
     * behavior.
     *
     * <p>Example (Assuming there is no "where" stage available in SDK):
     *
     * ```typescript
     * // Assume we don't have a built-in "where" stage
     * firestore.pipeline().collection("books")
     *     .genericStage("where", [Field.of("published").lt(1900)]) // Custom "where" stage
     *     .select("title", "author");
     * ```
     *
     * @param name The unique name of the generic stage to add.
     * @param params A list of parameters to configure the generic stage's behavior.
     * @return A new {@code Pipeline} object with this stage appended to the stage list.
     */
    genericStage(name: string, params: any[]): Pipeline<AppModelType>;
    withConverter(converter: null): Pipeline;
    withConverter<NewAppModelType>(
      converter: FirestorePipelineConverter<NewAppModelType>
    ): Pipeline<NewAppModelType>;
    /**
     * Executes this pipeline and returns a Promise to represent the asynchronous operation.
     *
     * <p>The returned Promise can be used to track the progress of the pipeline execution
     * and retrieve the results (or handle any errors) asynchronously.
     *
     * <p>The pipeline results are returned as a list of {@link PipelineResult} objects. Each {@link
     * PipelineResult} typically represents a single key/value map that has passed through all the
     * stages of the pipeline, however this might differ depending on the stages involved in the
     * pipeline. For example:
     *
     * <ul>
     *   <li>If there are no stages or only transformation stages, each {@link PipelineResult}
     *       represents a single document.</li>
     *   <li>If there is an aggregation, only a single {@link PipelineResult} is returned,
     *       representing the aggregated results over the entire dataset .</li>
     *   <li>If there is an aggregation stage with grouping, each {@link PipelineResult} represents a
     *       distinct group and its associated aggregated values.</li>
     * </ul>
     *
     * <p>Example:
     *
     * ```typescript
     * const futureResults = await firestore.pipeline().collection("books")
     *     .where(gt(Field.of("rating"), 4.5))
     *     .select("title", "author", "rating")
     *     .execute();
     * ```
     *
     * @return A Promise representing the asynchronous pipeline execution.
     */
    execute(): Promise<Array<PipelineResult<AppModelType>>>;

    /**
     * Executes this pipeline and streams the results as {@link PipelineResult}s.
     *
     * @returns {Stream.<PipelineResult>} A stream of
     * PipelineResult.
     *
     * @example
     * ```typescript
     * firestore.pipeline().collection("books")
     *     .where(gt(Field.of("rating"), 4.5))
     *     .select("title", "author", "rating")
     *     .stream()
     *     .on('data', (pipelineResult) => {})
     *     .on('end', () => {});
     * ```
     */
    stream(): NodeJS.ReadableStream;
  }

  /**
   * @beta
   *
   * A PipelineResult contains data read from a Firestore Pipeline. The data can be extracted with the
   * {@link #data()} or {@link #get(String)} methods.
   *
   * <p>If the PipelineResult represents a non-document result, `ref` will return a undefined
   * value.
   */
  export class PipelineResult<AppModelType = DocumentData> {
    readonly executionTime: Timestamp;
    readonly createTime: Timestamp | undefined;
    readonly updateTime: Timestamp | undefined;

    /**
     * The reference of the document, if it is a document; otherwise `undefined`.
     */
    get ref(): DocumentReference | undefined;

    /**
     * The ID of the document for which this PipelineResult contains data, if it is a document; otherwise `undefined`.
     *
     * @type {string}
     * @readonly
     *
     */
    get id(): string | undefined;

    /**
     * Retrieves all fields in the result as an object. Returns 'undefined' if
     * the document doesn't exist.
     *
     * @returns {T|undefined} An object containing all fields in the document or
     * 'undefined' if the document doesn't exist.
     *
     * @example
     * ```
     * let p = firestore.pipeline().collection('col');
     *
     * p.execute().then(results => {
     *   let data = results[0].data();
     *   console.log(`Retrieved data: ${JSON.stringify(data)}`);
     * });
     * ```
     */
    data(): AppModelType | undefined;

    /**
     * Retrieves the field specified by `field`.
     *
     * @param {string|FieldPath} field The field path
     * (e.g. 'foo' or 'foo.bar') to a specific field.
     * @returns {*} The data at the specified field location or undefined if no
     * such field exists.
     *
     * @example
     * ```
     * let p = firestore.pipeline().collection('col');
     *
     * p.execute().then(results => {
     *   let field = results[0].get('a.b');
     *   console.log(`Retrieved field value: ${field}`);
     * });
     * ```
     */
    // We deliberately use `any` in the external API to not impose type-checking
    // on end users.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(field: string | FieldPath): any;

    /**
     * Returns true if the document's data and path in this `PipelineResult` is
     * equal to the provided value.
     *
     * @param {*} other The value to compare against.
     * @return {boolean} true if this `PipelineResult` is equal to the provided
     * value.
     */
    isEqual(other: PipelineResult<AppModelType>): boolean;
  }
}

declare module '@google-cloud/firestore' {
  export = FirebaseFirestore;
}
