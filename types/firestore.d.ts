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
  export type DocumentData = {
    [field: string]: DocumentFieldValue;
  };
  /**
   * Similar to Typescript's `Partial<T>`, but allows nested fields to be
   * omitted and FieldValues to be passed in as property values.
   */
  export type PartialWithFieldValue<T> =
    | Partial<T>
    | (T extends Primitive
        ? T
        : T extends {}
          ? {
              [K in keyof T]?: PartialWithFieldValue<T[K]> | FieldValue;
            }
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
          ? {
              [K in keyof T]: WithFieldValue<T[K]> | FieldValue;
            }
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
      ? {
          [K in keyof T]?: UpdateData<T[K]> | FieldValue;
        } & NestedUpdateFields<T>
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
      ? // (e.g. Prefix 'bar.' to create: 'bar.baz' and 'bar.qux'.
        AddPrefixToKeys<K, UpdateData<V>>
      : never;
  /**
   * Returns a new map where every key is prefixed with the outer key appended
   * to a dot.
   */
  export type AddPrefixToKeys<
    Prefix extends string,
    T extends Record<string, unknown>,
  > =
    // Remap K => Prefix.K. See https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as
    {
      [K in keyof T & string as `${Prefix}.${K}`]+?: T[K];
    };
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
   * Utility type to create an type that only allows one
   * property of the Type param T to be set.
   *
   * type XorY = OneOf<{ x: unknown, y: unknown}>
   * let a = { x: "foo" }           // OK
   * let b = { y: "foo" }           // OK
   * let c = { a: "foo", y: "foo" } // Not OK
   */
  export type OneOf<T> = {
    [K in keyof T]: Pick<T, K> & {
      [P in Exclude<keyof T, K>]?: undefined;
    };
  }[keyof T];
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
    credentials?: {
      client_email?: string;
      private_key?: string;
    };
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
    /**
     * Settings related to telemetry collection by this client.
     * @beta
     */
    openTelemetry?: FirestoreOpenTelemetryOptions;
    [key: string]: any; // Accept other properties, such as GRPC settings.
  }
  /**
   * Options to configure telemetry collection.
   * This is a 'beta' interface and may change in backwards incompatible ways.
   * @beta
   */
  export interface FirestoreOpenTelemetryOptions {
    /**
     * The OpenTelemetry TracerProvider instance that the SDK should use to
     * create trace spans. If not provided, the SDK will use the Global TracerProvider.
     *
     * Even if a Global TracerProvider has been registered, users can still
     * disable this client's span creation by passing in a "no-op" tracer provider
     * here, or by setting the `FIRESTORE_ENABLE_TRACING` environment variable to `OFF` or `FALSE`.
     */
    tracerProvider?: any;
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
    /**
     * TODO(pipelines)
     */
    pipeline(): Pipelines.PipelineSource;
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
    /**
     * Executes this pipeline and returns a Promise to represent the asynchronous operation.
     *
     * The returned Promise can be used to track the progress of the pipeline execution
     * and retrieve the results (or handle any errors) asynchronously.
     *
     * <p>The pipeline results are returned in a {@link PipelineSnapshot} object, which contains a list of
     * {@link PipelineResult} objects. Each {@link PipelineResult} typically represents a single key/value map that
     * has passed through all the stages of the pipeline, however this might differ depending on the stages involved
     * in the pipeline. For example:
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
     *       .where(greaterThan(Field.of("rating"), 4.5))
     *       .select("title", "author", "rating"));
     * ```
     *
     * @return A Promise representing the asynchronous pipeline execution.
     */
    execute(pipeline: Pipelines.Pipeline): Promise<Pipelines.PipelineSnapshot>;
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
      | {
          initialOpsPerSecond?: number;
          maxOpsPerSecond?: number;
        };
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
      converter: FirestoreDataConverter<NewAppModelType, NewDbModelType> | null
    ): DocumentReference<NewAppModelType, NewDbModelType>;
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
      {
        count: AggregateField<number>;
      },
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
     * Only documents whose `vectorField` field is a {@link VectorValue} of the same dimension as `queryVector`
     * participate in the query, all other documents are ignored.
     *
     * @example
     * ```
     * // Returns the closest 10 documents whose Euclidean distance from their 'embedding' fields are closed to [41, 42].
     * const vectorQuery = col.findNearest('embedding', [41, 42], {limit: 10, distanceMeasure: 'EUCLIDEAN'});
     *
     * const querySnapshot = await aggregateQuery.get();
     * querySnapshot.forEach(...);
     * ```
     *
     * @param vectorField - A string or {@link FieldPath} specifying the vector field to search on.
     * @param queryVector - The {@link VectorValue} used to measure the distance from `vectorField` values in the documents.
     * @param options - Options control the vector query. `limit` specifies the upper bound of documents to return, must
     * be a positive integer with a maximum value of 1000. `distanceMeasure` specifies what type of distance is calculated
     * when performing the query.
     *
     * @deprecated Use the new {@link findNearest} implementation
     * accepting a single `options` param.
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
     * Returns a query that can perform vector distance (similarity) search with given parameters.
     *
     * The returned query, when executed, performs a distance (similarity) search on the specified
     * `vectorField` against the given `queryVector` and returns the top documents that are closest
     * to the `queryVector`.
     *
     * Only documents whose `vectorField` field is a {@link VectorValue} of the same dimension as `queryVector`
     * participate in the query, all other documents are ignored.
     *
     * @example
     * ```
     * // Returns the closest 10 documents whose Euclidean distance from their 'embedding' fields are closed to [41, 42].
     * const vectorQuery = col.findNearest({
     *     vectorField: 'embedding',
     *     queryVector: [41, 42],
     *     limit: 10,
     *     distanceMeasure: 'EUCLIDEAN',
     *     distanceResultField: 'distance',
     *     distanceThreshold: 0.125
     * });
     *
     * const querySnapshot = await aggregateQuery.get();
     * querySnapshot.forEach(...);
     * ```
     * @param options - An argument specifying the behavior of the {@link VectorQuery} returned by this function.
     * See {@link VectorQueryOptions}.
     */
    findNearest(
      options: VectorQueryOptions
    ): VectorQuery<AppModelType, DbModelType>;
    /**
     * Returns a query that can perform vector distance (similarity) search with given parameters.
     *
     * The returned query, when executed, performs a distance (similarity) search on the specified
     * `vectorField` against the given `queryVector` and returns the top documents that are closest
     * to the `queryVector`.
     *
     * Only documents whose `vectorField` field is a {@link VectorValue} of the same dimension as `queryVector`
     * participate in the query, all other documents are ignored.
     *
     * @example
     * ```
     * // Returns the closest 10 documents whose Euclidean distance from their 'embedding' fields are closed to [41, 42].
     * const vectorQuery = col.findNearest({
     *     vectorField: 'embedding',
     *     queryVector: [41, 42],
     *     limit: 10,
     *     distanceMeasure: 'EUCLIDEAN',
     *     distanceResultField: 'distance',
     *     distanceThreshold: 0.125
     * });
     *
     * const querySnapshot = await aggregateQuery.get();
     * querySnapshot.forEach(...);
     * ```
     * @param options - An argument specifying the behavior of the {@link VectorQuery} returned by this function.
     * See {@link VectorQueryOptions}.
     */
    findNearest(
      options: VectorQueryOptions
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
      converter: FirestoreDataConverter<NewAppModelType, NewDbModelType> | null
    ): Query<NewAppModelType, NewDbModelType>;
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
      converter: FirestoreDataConverter<NewAppModelType> | null
    ): CollectionReference<NewAppModelType, NewDbModelType>;
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
      converter: FirestoreDataConverter<NewAppModelType, NewDbModelType> | null
    ): CollectionGroup<NewAppModelType, NewDbModelType>;
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
   * Specifies the behavior of the {@link VectorQuery} generated by a call to {@link Query.findNearest}.
   */
  export interface VectorQueryOptions {
    /**
     * A string or {@link FieldPath} specifying the vector field to search on.
     */
    vectorField: string | FieldPath;
    /**
     * The {@link VectorValue} used to measure the distance from `vectorField` values in the documents.
     */
    queryVector: VectorValue | Array<number>;
    /**
     * Specifies the upper bound of documents to return, must be a positive integer with a maximum value of 1000.
     */
    limit: number;
    /**
     * Specifies what type of distance is calculated when performing the query.
     */
    distanceMeasure: 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT';
    /**
     * Optionally specifies the name of a field that will be set on each returned DocumentSnapshot,
     * which will contain the computed distance for the document.
     */
    distanceResultField?: string | FieldPath;
    /**
     * Specifies a threshold for which no less similar documents will be returned. The behavior
     * of the specified `distanceMeasure` will affect the meaning of the distance threshold.
     *
     *  - For `distanceMeasure: "EUCLIDEAN"`, the meaning of `distanceThreshold` is:
     *     SELECT docs WHERE euclidean_distance <= distanceThreshold
     *  - For `distanceMeasure: "COSINE"`, the meaning of `distanceThreshold` is:
     *     SELECT docs WHERE cosine_distance <= distanceThreshold
     *  - For `distanceMeasure: "DOT_PRODUCT"`, the meaning of `distanceThreshold` is:
     *     SELECT docs WHERE dot_product_distance >= distanceThreshold
     */
    distanceThreshold?: number;
  }
  export namespace Pipelines {
    /**
     * @beta
     * Represents an expression that has been assigned an alias using the `.as()` method.
     *
     * This class wraps an existing {@link Expression} and associates it with a user-defined alias,
     * allowing the expression's result to be referred to by a different name in the output
     * of a Firestore pipeline query, particularly within `select()` operations.
     *
     * @internal
     */
    export type ExpressionType =
      | 'Field'
      | 'Constant'
      | 'Function'
      | 'AggregateFunction'
      | 'ListOfExprs'
      | 'AliasedExpression';
    /**
     * @beta
     * Represents an expression that can be evaluated to a value within the execution of a {@link
     * Pipeline}.
     *
     * Expressions are the building blocks for creating complex queries and transformations in
     * Firestore pipelines. They can represent:
     *
     * - **Field references:** Access values from document fields.
     * - **Literals:** Represent constant values (strings, numbers, booleans).
     * - **Function calls:** Apply functions to one or more expressions.
     *
     * The `Expression` class provides a fluent API for building expressions. You can chain together
     * method calls to create complex expressions.
     */
    export abstract class Expression {
      abstract readonly expressionType: ExpressionType;
      /**
       * @beta
       * Creates an expression that adds this expression to another expression.
       *
       * ```typescript
       * // Add the value of the 'quantity' field and the 'reserve' field.
       * field("quantity").add(field("reserve"));
       * ```
       *
       * @param second The expression or literal to add to this expression.
       * @param others Optional additional expressions or literals to add to this expression.
       * @return A new `Expression` representing the addition operation.
       */
      add(
        second: Expression | unknown,
        ...others: Array<Expression | unknown>
      ): FunctionExpression;
      /**
       * @beta
       * Creates an expression that subtracts another expression from this expression.
       *
       * ```typescript
       * // Subtract the 'discount' field from the 'price' field
       * field("price").subtract(field("discount"));
       * ```
       *
       * @param subtrahend The expression to subtract from this expression.
       * @return A new `Expression` representing the subtraction operation.
       */
      subtract(subtrahend: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that subtracts a constant value from this expression.
       *
       * ```typescript
       * // Subtract 20 from the value of the 'total' field
       * field("total").subtract(20);
       * ```
       *
       * @param subtrahend The constant value to subtract.
       * @return A new `Expression` representing the subtraction operation.
       */
      subtract(subtrahend: number): FunctionExpression;
      /**
       * @beta
       * Creates an expression that multiplies this expression by another expression.
       *
       * ```typescript
       * // Multiply the 'quantity' field by the 'price' field
       * field("quantity").multiply(field("price"));
       * ```
       *
       * @param second The second expression or literal to multiply by.
       * @param others Optional additional expressions or literals to multiply by.
       * @return A new `Expression` representing the multiplication operation.
       */
      multiply(
        second: Expression | number,
        ...others: Array<Expression | number>
      ): FunctionExpression;
      /**
       * @beta
       * Creates an expression that divides this expression by another expression.
       *
       * ```typescript
       * // Divide the 'total' field by the 'count' field
       * field("total").divide(field("count"));
       * ```
       *
       * @param divisor The expression to divide by.
       * @return A new `Expression` representing the division operation.
       */
      divide(divisor: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that divides this expression by a constant value.
       *
       * ```typescript
       * // Divide the 'value' field by 10
       * field("value").divide(10);
       * ```
       *
       * @param divisor The constant value to divide by.
       * @return A new `Expression` representing the division operation.
       */
      divide(divisor: number): FunctionExpression;
      /**
       * @beta
       * Creates an expression that calculates the modulo (remainder) of dividing this expression by another expression.
       *
       * ```typescript
       * // Calculate the remainder of dividing the 'value' field by the 'divisor' field
       * field("value").mod(field("divisor"));
       * ```
       *
       * @param expression The expression to divide by.
       * @return A new `Expression` representing the modulo operation.
       */
      mod(expression: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that calculates the modulo (remainder) of dividing this expression by a constant value.
       *
       * ```typescript
       * // Calculate the remainder of dividing the 'value' field by 10
       * field("value").mod(10);
       * ```
       *
       * @param value The constant value to divide by.
       * @return A new `Expression` representing the modulo operation.
       */
      mod(value: number): FunctionExpression;

      /**
       * @beta
       * Creates an expression that checks if this expression is equal to another expression.
       *
       * ```typescript
       * // Check if the 'age' field is equal to the value of another field named 'otherAge'.
       * field("age").equal(field("otherAge"));
       *
       * // Check if the 'status' field is equal to a string literal.
       * field("status").equal("active");
       * ```
       *
       * @param expression The expression to compare for equality.
       * @return A new `BooleanExpression` representing the equality comparison.
       */
      equal(expression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression is equal to a constant value.
       *
       * ```typescript
       * // Check if the 'city' field is equal to "London"
       * field("city").equal("London");
       * ```
       *
       * @param value The constant value to compare for equality.
       * @return A new `Expression` representing the equality comparison.
       */
      equal(value: unknown): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if this expression is not equal to another expression.
       *
       * ```typescript
       * // Check if the 'status' field is not equal to "completed"
       * field("status").notEqual("completed");
       * ```
       *
       * @param expression The expression to compare for inequality.
       * @return A new {@link BooleanExpression} representing the inequality comparison.
       */
      notEqual(expression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression is not equal to a constant value.
       *
       * ```typescript
       * // Check if the 'country' field is not equal to "USA"
       * field("country").notEqual("USA");
       * ```
       *
       * @param value The constant value to compare for inequality.
       * @return A new `Expression` representing the inequality comparison.
       */
      notEqual(value: unknown): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if this expression is less than another expression.
       *
       * ```typescript
       * // Check if the 'age' field is less than 'limit'
       * field("age").lessThan(field('limit'));
       * ```
       *
       * @param expression The expression to compare against.
       * @return A new `BooleanExpression` representing the less than comparison.
       */
      lessThan(expression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression is less than a constant value.
       *
       * ```typescript
       * // Check if the 'price' field is less than 50
       * field("price").lessThan(50);
       * ```
       *
       * @param value The constant value to compare for less than.
       * @return A new `Expression` representing the less than comparison.
       */
      lessThan(value: unknown): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if the current expression's value is less than or equal to the value of another expression.
       *
       * ```typescript
       * // Check if the 'quantity' field is less than or equal to 20
       * field("quantity").lessThanOrEqual(constant(20));
       * ```
       *
       * @param expression The expression to compare against.
       * @return A new `BooleanExpression` representing the less than or equal to comparison.
       */
      lessThanOrEqual(expression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression is less than or equal to a constant value.
       *
       * ```typescript
       * // Check if the 'score' field is less than or equal to 70
       * field("score").lessThanOrEqual(70);
       * ```
       *
       * @param value The constant value to compare for less than or equal to.
       * @return A new `Expression` representing the less than or equal to comparison.
       */
      lessThanOrEqual(value: unknown): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if this expression is greater than another expression.
       *
       * ```typescript
       * // Check if the 'age' field is greater than the 'limit' field
       * field("age").greaterThan(field("limit"));
       * ```
       *
       * @param expression The expression to compare for greater than.
       * @return A new {@link BooleanExpression} representing the greater than comparison.
       */
      greaterThan(expression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression is greater than a constant value.
       *
       * ```typescript
       * // Check if the 'price' field is greater than 100
       * field("price").greaterThan(100);
       * ```
       *
       * @param value The constant value to compare for greater than.
       * @return A new `Expression` representing the greater than comparison.
       */
      greaterThan(value: unknown): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression is greater than or equal to another
       * expression.
       *
       * ```typescript
       * // Check if the 'quantity' field is greater than or equal to field 'requirement' plus 1
       * field("quantity").greaterThanOrEqual(field('requirement').add(1));
       * ```
       *
       * @param expression The expression to compare for greater than or equal to.
       * @return A new `Expression` representing the greater than or equal to comparison.
       */
      greaterThanOrEqual(expression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression is greater than or equal to a constant
       * value.
       *
       * ```typescript
       * // Check if the 'score' field is greater than or equal to 80
       * field("score").greaterThanOrEqual(80);
       * ```
       *
       * @param value The constant value to compare for greater than or equal to.
       * @return A new `Expression` representing the greater than or equal to comparison.
       */
      greaterThanOrEqual(value: unknown): BooleanExpression;

      /**
       * Creates an expression that concatenates an array expression with one or more other arrays.
       *
       * ```typescript
       * // Combine the 'items' array with another array field.
       * field("items").arrayConcat(field("otherItems"));
       * ```
       * @param secondArray Second array expression or array literal to concatenate.
       * @param otherArrays Optional additional array expressions or array literals to concatenate.
       * @return A new `Expr` representing the concatenated array.
       */
      arrayConcat(
        secondArray: Expression | unknown[],
        ...otherArrays: Array<Expression | unknown[]>
      ): FunctionExpression;

      /**
       * @beta
       * Creates an expression that checks if an array contains a specific element.
       *
       * ```typescript
       * // Check if the 'sizes' array contains the value from the 'selectedSize' field
       * field("sizes").arrayContains(field("selectedSize"));
       * ```
       *
       * @param expression The element to search for in the array.
       * @return A new `Expression` representing the 'array_contains' comparison.
       */
      arrayContains(expression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if an array contains a specific value.
       *
       * ```typescript
       * // Check if the 'colors' array contains "red"
       * field("colors").arrayContains("red");
       * ```
       *
       * @param value The element to search for in the array.
       * @return A new `Expression` representing the 'array_contains' comparison.
       */
      arrayContains(value: unknown): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if an array contains all the specified elements.
       *
       * ```typescript
       * // Check if the 'tags' array contains both the value in field "tag1" and the literal value "tag2"
       * field("tags").arrayContainsAll([field("tag1"), "tag2"]);
       * ```
       *
       * @param values The elements to check for in the array.
       * @return A new `Expression` representing the 'array_contains_all' comparison.
       */
      arrayContainsAll(values: Array<Expression | unknown>): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if an array contains all the specified elements.
       *
       * ```typescript
       * // Check if the 'tags' array contains both of the values from field "tag1" and the literal value "tag2"
       * field("tags").arrayContainsAll(array([field("tag1"), "tag2"]));
       * ```
       *
       * @param arrayExpression The elements to check for in the array.
       * @return A new `Expression` representing the 'array_contains_all' comparison.
       */
      arrayContainsAll(arrayExpression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if an array contains any of the specified elements.
       *
       * ```typescript
       * // Check if the 'categories' array contains either values from field "cate1" or "cate2"
       * field("categories").arrayContainsAny([field("cate1"), field("cate2")]);
       * ```
       *
       * @param values The elements to check for in the array.
       * @return A new `Expression` representing the 'array_contains_any' comparison.
       */
      arrayContainsAny(values: Array<Expression | unknown>): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if an array contains any of the specified elements.
       *
       * ```typescript
       * // Check if the 'groups' array contains either the value from the 'userGroup' field
       * // or the value "guest"
       * field("groups").arrayContainsAny(array([field("userGroup"), "guest"]));
       * ```
       *
       * @param arrayExpression The elements to check for in the array.
       * @return A new `Expression` representing the 'array_contains_any' comparison.
       */
      arrayContainsAny(arrayExpression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that calculates the length of an array.
       *
       * ```typescript
       * // Get the number of items in the 'cart' array
       * field("cart").arrayLength();
       * ```
       *
       * @return A new `Expression` representing the length of the array.
       */
      arrayLength(): FunctionExpression;

      /**
       * @beta
       * Creates an expression that checks if this expression is equal to any of the provided values or
       * expressions.
       *
       * ```typescript
       * // Check if the 'category' field is either "Electronics" or the value of field 'primaryType'
       * field("category").equalAny(["Electronics", field("primaryType")]);
       * ```
       *
       * @param values An array of values or expressions to check against.
       * @return A new `BooleanExpression` representing the 'IN' comparison.
       */
      equalAny(values: Array<Expression | unknown>): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression is equal to any of the provided values or
       * expressions.
       *
       * ```typescript
       * // Check if the 'category' field is either "Electronics" or the value of field 'primaryType'
       * field("category").equalAny(array(["Electronics", field("primaryType")]));
       * ```
       *
       * @param arrayExpression An expression that evaluates to an array of values to check against.
       * @return A new `Expression` representing the 'IN' comparison.
       */
      equalAny(arrayExpression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression is not equal to any of the provided values or
       * expressions.
       *
       * ```typescript
       * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
       * field("status").notEqualAny(["pending", field("rejectedStatus")]);
       * ```
       *
       * @param values The values or expressions to check against.
       * @return A new `Expression` representing the 'NotEqAny' comparison.
       */
      notEqualAny(values: Array<Expression | unknown>): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if the current expression's value is not equal to any of the values within the array produced by the `arrayExpression`.
       *
       * ```typescript
       * // Check if the 'status' field is not equal to any value in the array returned by the 'rejectedStatuses' field.
       * field("status").notEqualAny(field('rejectedStatuses'));
       * ```
       *
       * @param arrayExpression An `Expression` that evaluates to an array of values to compare against.
       * @return A new `BooleanExpression` representing the result of the 'not equal to any' comparison.
       */
      notEqualAny(arrayExpression: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if this expression evaluates to 'NaN' (Not a Number).
       *
       * ```typescript
       * // Check if the result of a calculation is NaN
       * field("value").divide(0).isNaN();
       * ```
       *
       * @return A new `Expression` representing the 'isNaN' check.
       */
      isNan(): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if this expression evaluates to `null`.
       *
       * ```typescript
       * // Check if the 'status' field is null.
       * field("status").isNull();
       * ```
       *
       * @return A new `BooleanExpression` representing the `isNull` check.
       */
      isNull(): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if a field exists in the document.
       *
       * ```typescript
       * // Check if the document has a field named "phoneNumber"
       * field("phoneNumber").exists();
       * ```
       *
       * @returns A new {@link BooleanExpression} representing the 'exists' check.
       */
      exists(): BooleanExpression;
      /**
       * @beta
       * Creates an expression that calculates the character length of a string in UTF-8.
       *
       * ```typescript
       * // Get the character length of the 'name' field in its UTF-8 form.
       * field("name").charLength();
       * ```
       *
       * @return A new `Expression` representing the length of the string.
       */
      charLength(): FunctionExpression;

      /**
       * @beta
       * Creates an expression that performs a case-sensitive string comparison.
       *
       * ```typescript
       * // Check if the 'title' field contains the word "guide" (case-sensitive)
       * field("title").like("%guide%");
       * ```
       *
       * @param pattern The string pattern to search for. You can use "%" as a wildcard character within the pattern.
       * @return A new {@link FunctionExpression} representing the 'like' comparison.
       */
      like(pattern: string): FunctionExpression;

      /**
       * @beta
       * Creates an expression that performs a case-sensitive string comparison.
       *
       * ```typescript
       * // Check if the 'description' field matches a pattern from another field
       * field("description").like(field("searchPattern"));
       * ```
       *
       * @param pattern An {@link Expression} that evaluates to the string pattern to search for. You can use "%" as a wildcard character within the pattern.
       * @return A new {@link FunctionExpression} representing the 'like' comparison.
       */
      like(pattern: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that checks if a string contains a specified regular expression as a
       * substring.
       *
       * ```typescript
       * // Check if the 'description' field contains "example" (case-insensitive)
       * field("description").regexContains("(?i)example");
       * ```
       *
       * @param pattern The regular expression to use for the search.
       * @return A new `Expression` representing the 'contains' comparison.
       */
      regexContains(pattern: string): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if a string contains a specified regular expression as a
       * substring.
       *
       * ```typescript
       * // Check if the 'description' field contains the regular expression stored in field 'regex'
       * field("description").regexContains(field("regex"));
       * ```
       *
       * @param pattern The regular expression to use for the search.
       * @return A new {@link BooleanExpression} representing the 'contains' comparison.
       */
      regexContains(pattern: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if a string matches a specified regular expression.
       *
       * ```typescript
       * // Check if the 'email' field matches a valid email pattern
       * field("email").regexMatch("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
       * ```
       *
       * @param pattern The regular expression to use for the match.
       * @return A new `Expression` representing the regular expression match.
       */
      regexMatch(pattern: string): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if a string matches a specified regular expression.
       *
       * ```typescript
       * // Check if the 'email' field matches a regular expression stored in another field.
       * field("email").regexMatch(field("regexPattern"));
       * ```
       *
       * @param pattern An expression that evaluates to the regular expression string to use for the match.
       * @return A new `BooleanExpression` representing the result of the regular expression match.
       */
      regexMatch(pattern: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if a string contains a specified substring.
       *
       * ```typescript
       * // Check if the 'description' field contains "example".
       * field("description").stringContains("example");
       * ```
       *
       * @param substring The substring to search for.
       * @return A new `Expression` representing the 'contains' comparison.
       */
      stringContains(substring: string): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if a string contains the string represented by another expression.
       *
       * ```typescript
       * // Check if the 'description' field contains the value of the 'keyword' field.
       * field("description").stringContains(field("keyword"));
       * ```
       *
       * @param expr The expression representing the substring to search for.
       * @return A new {@link BooleanExpression} representing the 'contains' comparison.
       */
      stringContains(expr: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if a string starts with a given prefix.
       *
       * ```typescript
       * // Check if the 'name' field starts with "Mr."
       * field("name").startsWith("Mr.");
       * ```
       *
       * @param prefix The prefix to check for.
       * @return A new `Expression` representing the 'starts with' comparison.
       */
      startsWith(prefix: string): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if the string value of the current expression starts with the string value of the given prefix expression.
       *
       * ```typescript
       * // Check if the 'fullName' field starts with the value of the 'firstName' field
       * field("fullName").startsWith(field("firstName"));
       * ```
       *
       * @param prefix An expression whose string value will be used as the prefix to check against.
       * @returns A new `BooleanExpression` representing the 'starts with' comparison result.
       */
      startsWith(prefix: Expression): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if a string ends with a given postfix.
       *
       * ```typescript
       * // Check if the 'filename' field ends with ".txt"
       * field("filename").endsWith(".txt");
       * ```
       *
       * @param suffix The postfix to check for.
       * @return A new {@link BooleanExpression} representing the 'ends with' comparison.
       */
      endsWith(suffix: string): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if a string ends with a given postfix (represented as an
       * expression).
       *
       * ```typescript
       * // Check if the 'url' field ends with the value of the 'extension' field
       * field("url").endsWith(field("extension"));
       * ```
       *
       * @param suffix The postfix expression to check for.
       * @return A new `Expression` representing the 'ends with' comparison.
       */
      endsWith(suffix: Expression): BooleanExpression;
      /**
       * @beta
       * Creates an expression that converts a string to lowercase.
       *
       * ```typescript
       * // Convert the 'name' field to lowercase
       * field("name").toLower();
       * ```
       *
       * @return A new `Expression` representing the lowercase string.
       */
      toLower(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that converts a string to uppercase.
       *
       * ```typescript
       * // Convert the 'title' field to uppercase
       * field("title").toUpper();
       * ```
       *
       * @return A new `Expression` representing the uppercase string.
       */
      toUpper(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that removes leading and trailing whitespace from a string.
       *
       * ```typescript
       * // Trim whitespace from the 'userInput' field
       * field("userInput").trim();
       * ```
       *
       * @return A new `Expression` representing the trimmed string.
       */
      trim(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that concatenates string expressions together.
       *
       * ```typescript
       * // Combine the 'firstName', " ", and 'lastName' fields into a single string
       * field("firstName").stringConcat(constant(" "), field("lastName"));
       * ```
       *
       * @param secondString The additional expression or string literal to concatenate.
       * @param otherStrings Optional additional expressions or string literals to concatenate.
       * @return A new `Expression` representing the concatenated string.
       */
      stringConcat(
        secondString: Expression | string,
        ...otherStrings: Array<Expression | string>
      ): FunctionExpression;
      /**
       * @beta
       * Creates an expression that reverses this string expression.
       *
       * ```typescript
       * // Reverse the value of the 'myString' field.
       * field("myString").reverse();
       * ```
       *
       * @return A new {@code Expression} representing the reversed string.
       */
      reverse(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that calculates the length of this string expression in bytes.
       *
       * ```typescript
       * // Calculate the length of the 'myString' field in bytes.
       * field("myString").byteLength();
       * ```
       *
       * @return A new {@code Expression} representing the length of the string in bytes.
       */
      byteLength(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that computes the ceiling of a numeric value.
       *
       * ```typescript
       * // Compute the ceiling of the 'price' field.
       * field("price").ceil();
       * ```
       *
       * @return A new {@code Expression} representing the ceiling of the numeric value.
       */
      ceil(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that computes the floor of a numeric value.
       *
       * ```typescript
       * // Compute the floor of the 'price' field.
       * field("price").floor();
       * ```
       *
       * @return A new {@code Expression} representing the floor of the numeric value.
       */
      floor(): FunctionExpression;

      /**
       * @beta
       * Creates an expression that computes the absolute value of a numeric value.
       *
       * ```typescript
       * // Compute the absolute value of the 'price' field.
       * field("price").abs();
       * ```
       *
       * @return A new {@code Expr} representing the absolute value of the numeric value.
       */
      abs(): FunctionExpression;

      /**
       * @beta
       * Creates an expression that computes `e` (Euler's number) raised to the power of this expression's numeric value.
       *
       * ```typescript
       * // Compute `e` to the power of the 'value' field.
       * field("value").exp();
       * ```
       *
       * @return A new {@code FunctionExpression} representing `e` raised to the power of the numeric value.
       */
      exp(): FunctionExpression;
      /**
       * @beta
       * Creates an aggregation that counts the number of distinct values of the expression or field.
       *
       * @return A new `AggregateFunction` representing the 'count_distinct' aggregation.
       */
      countDistinct(): AggregateFunction;
      /**
       * @beta
       * Accesses a value from a map (object) field using the provided key.
       *
       * ```typescript
       * // Get the 'city' value from the 'address' map field
       * field("address").mapGet("city");
       * ```
       *
       * @param subfield The key to access in the map.
       * @return A new `Expression` representing the value associated with the given key in the map.
       */
      mapGet(subfield: string): FunctionExpression;
      /**
       * @beta
       * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
       * expression or field.
       *
       * ```typescript
       * // Count the total number of products
       * field("productId").count().as("totalProducts");
       * ```
       *
       * @return A new `AggregateFunction` representing the 'count' aggregation.
       */
      count(): AggregateFunction;
      /**
       * @beta
       * Creates an aggregation that calculates the sum of a numeric field across multiple stage inputs.
       *
       * ```typescript
       * // Calculate the total revenue from a set of orders
       * field("orderAmount").sum().as("totalRevenue");
       * ```
       *
       * @return A new `AggregateFunction` representing the 'sum' aggregation.
       */
      sum(): AggregateFunction;
      /**
       * @beta
       * Creates an aggregation that calculates the average (mean) of a numeric field across multiple
       * stage inputs.
       *
       * ```typescript
       * // Calculate the average age of users
       * field("age").average().as("averageAge");
       * ```
       *
       * @return A new `AggregateFunction` representing the 'average' aggregation.
       */
      average(): AggregateFunction;
      /**
       * @beta
       * Creates an aggregation that finds the minimum value of a field across multiple stage inputs.
       *
       * ```typescript
       * // Find the lowest price of all products
       * field("price").minimum().as("lowestPrice");
       * ```
       *
       * @return A new `AggregateFunction` representing the 'min' aggregation.
       */
      minimum(): AggregateFunction;
      /**
       * @beta
       * Creates an aggregation that finds the maximum value of a field across multiple stage inputs.
       *
       * ```typescript
       * // Find the highest score in a leaderboard
       * field("score").maximum().as("highestScore");
       * ```
       *
       * @return A new `AggregateFunction` representing the 'max' aggregation.
       */
      maximum(): AggregateFunction;
      /**
       * @beta
       * Creates an expression that returns the larger value between this expression and another expression, based on Firestore's value type ordering.
       *
       * ```typescript
       * // Returns the larger value between the 'timestamp' field and the current timestamp.
       * field("timestamp").logicalMaximum(Function.currentTimestamp());
       * ```
       *
       * @param second The second expression or literal to compare with.
       * @param others Optional additional expressions or literals to compare with.
       * @return A new {@code Expression} representing the logical max operation.
       */
      logicalMaximum(
        second: Expression | unknown,
        ...others: Array<Expression | unknown>
      ): FunctionExpression;
      /**
       * @beta
       * Creates an expression that returns the smaller value between this expression and another expression, based on Firestore's value type ordering.
       *
       * ```typescript
       * // Returns the smaller value between the 'timestamp' field and the current timestamp.
       * field("timestamp").logicalMinimum(Function.currentTimestamp());
       * ```
       *
       * @param second The second expression or literal to compare with.
       * @param others Optional additional expressions or literals to compare with.
       * @return A new {@code Expression} representing the logical min operation.
       */
      logicalMinimum(
        second: Expression | unknown,
        ...others: Array<Expression | unknown>
      ): FunctionExpression;
      /**
       * @beta
       * Creates an expression that calculates the length (number of dimensions) of this Firestore Vector expression.
       *
       * ```typescript
       * // Get the vector length (dimension) of the field 'embedding'.
       * field("embedding").vectorLength();
       * ```
       *
       * @return A new {@code Expression} representing the length of the vector.
       */
      vectorLength(): FunctionExpression;
      /**
       * @beta
       * Calculates the cosine distance between two vectors.
       *
       * ```typescript
       * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
       * field("userVector").cosineDistance(field("itemVector"));
       * ```
       *
       * @param vectorExpression The other vector (represented as an Expression) to compare against.
       * @return A new `Expression` representing the cosine distance between the two vectors.
       */
      cosineDistance(vectorExpression: Expression): FunctionExpression;

      /**
       * @beta
       * Calculates the Cosine distance between two vectors.
       *
       * ```typescript
       * // Calculate the Cosine distance between the 'embedding' field and a target vector
       * field("embedding").cosineDistance(FieldValue.vector([0.1, 0.2, 0.3]));
       *
       * // Calculate the Cosine distance using a plain number array
       * field("embedding").cosineDistance([0.1, 0.2, 0.3]);
       * ```
       *
       * @param vector The other vector to compare against, provided as either a `VectorValue` object or a plain `number[]` array.
       * @return A new `FunctionExpression` representing the Cosine distance between the two vectors.
       */
      cosineDistance(vector: VectorValue | number[]): FunctionExpression;
      /**
       * @beta
       * Calculates the dot product between the current expression (representing a vector)
       * and another expression (representing a second vector).
       *
       * Both expressions are expected to resolve to an array of numbers (a vector) at runtime.
       *
       * ```typescript
       * // Calculate the dot product between the 'features' field and the 'targetVector' field.
       * field("features").dotProduct(field("targetVector"));
       * ```
       *
       * @param vectorExpression An {@link Expression} representing the second vector.
       * @returns A new {@link FunctionExpression} representing the dot product of the two vectors.
       */
      dotProduct(vectorExpression: Expression): FunctionExpression;

      /**
       * @beta
       * Calculates the dot product between two vectors.
       *
       * ```typescript
       * // Calculate the dot product between a feature vector and a target vector
       * field("features").dotProduct(FieldValue.vector([0.5, 0.8, 0.2]));
       * ```
       *
       * @param vector The other vector to calculate the dot product with. This can be a `VectorValue` object or a plain array of numbers.
       * @return A new `Expression` representing the dot product between the two vectors.
       */
      dotProduct(vector: VectorValue | number[]): FunctionExpression;

      /**
       * @beta
       * Calculates the Euclidean distance between the vector represented by this expression and another vector expression.
       *
       * ```typescript
       * // Calculate the Euclidean distance between two different vector fields.
       * field("vectorA").euclideanDistance(field("vectorB"));
       * ```
       *
       * @param vectorExpression An {@link Expression} that evaluates to the second vector (an array of numbers) for the distance calculation.
       * @return A new {@link FunctionExpression} representing the Euclidean distance between the two vectors.
       */
      euclideanDistance(vectorExpression: Expression): FunctionExpression;
      /**
       * @beta
       * Calculates the Euclidean distance between two vectors.
       *
       * The `vector` parameter can be either a `VectorValue` object or a `number[]` (array of numbers).
       *
       * ```typescript
       * // Calculate the Euclidean distance between the 'location' field and a target location using a VectorValue.
       * field("location").euclideanDistance(FieldValue.vector([37.7749, -122.4194]));
       *
       * // Calculate the Euclidean distance between the 'location' field and a target location using a number array.
       * field("location").euclideanDistance([37.7749, -122.4194]);
       * ```
       *
       * @param vector The other vector (as a `VectorValue` or `number[]`) to compare against.
       * @return A new `Expression` representing the Euclidean distance between the two vectors.
       */
      euclideanDistance(vector: VectorValue | number[]): FunctionExpression;
      /**
       * @beta
       * Creates an expression that interprets this expression as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
       * and returns a timestamp.
       *
       * ```typescript
       * // Interpret the 'microseconds' field as microseconds since epoch.
       * field("microseconds").unixMicrosToTimestamp();
       * ```
       *
       * @return A new {@code Expression} representing the timestamp.
       */
      unixMicrosToTimestamp(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that converts this timestamp expression to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
       *
       * ```typescript
       * // Convert the 'timestamp' field to microseconds since epoch.
       * field("timestamp").timestampToUnixMicros();
       * ```
       *
       * @return A new {@code Expression} representing the number of microseconds since epoch.
       */
      timestampToUnixMicros(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that interprets this expression as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
       * and returns a timestamp.
       *
       * ```typescript
       * // Interpret the 'milliseconds' field as milliseconds since epoch.
       * field("milliseconds").unixMillisToTimestamp();
       * ```
       *
       * @return A new {@code Expression} representing the timestamp.
       */
      unixMillisToTimestamp(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that converts this timestamp expression to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
       *
       * ```typescript
       * // Convert the 'timestamp' field to milliseconds since epoch.
       * field("timestamp").timestampToUnixMillis();
       * ```
       *
       * @return A new {@code Expression} representing the number of milliseconds since epoch.
       */
      timestampToUnixMillis(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that interprets this expression as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
       * and returns a timestamp.
       *
       * ```typescript
       * // Interpret the 'seconds' field as seconds since epoch.
       * field("seconds").unixSecondsToTimestamp();
       * ```
       *
       * @return A new {@code Expression} representing the timestamp.
       */
      unixSecondsToTimestamp(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that converts this timestamp expression to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
       *
       * ```typescript
       * // Convert the 'timestamp' field to seconds since epoch.
       * field("timestamp").timestampToUnixSeconds();
       * ```
       *
       * @return A new {@code Expression} representing the number of seconds since epoch.
       */
      timestampToUnixSeconds(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that adds a specified amount of time to this timestamp expression.
       *
       * ```typescript
       * // Add some duration determined by field 'unit' and 'amount' to the 'timestamp' field.
       * field("timestamp").timestampAdd(field("unit"), field("amount"));
       * ```
       *
       * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
       * @param amount The expression evaluates to amount of the unit.
       * @return A new {@code Expression} representing the resulting timestamp.
       */
      timestampAdd(unit: Expression, amount: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that adds a specified amount of time to this timestamp expression.
       *
       * ```typescript
       * // Add 1 day to the 'timestamp' field.
       * field("timestamp").timestampAdd("day", 1);
       * ```
       *
       * @param unit The unit of time to add (e.g., "day", "hour").
       * @param amount The amount of time to add.
       * @return A new {@code Expression} representing the resulting timestamp.
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
      ): FunctionExpression;
      /**
       * @beta
       * Creates an expression that subtracts a specified amount of time from this timestamp expression.
       *
       * ```typescript
       * // Subtract some duration determined by field 'unit' and 'amount' from the 'timestamp' field.
       * field("timestamp").timestampSubtract(field("unit"), field("amount"));
       * ```
       *
       * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
       * @param amount The expression evaluates to amount of the unit.
       * @return A new {@code Expression} representing the resulting timestamp.
       */
      timestampSubtract(
        unit: Expression,
        amount: Expression
      ): FunctionExpression;

      /**
       * @beta
       * Creates an expression that subtracts a specified amount of time from this timestamp expression.
       *
       * ```typescript
       * // Subtract 1 day from the 'timestamp' field.
       * field("timestamp").timestampSubtract("day", 1);
       * ```
       *
       * @param unit The unit of time to subtract. Supported units are 'microsecond', 'millisecond', 'second', 'minute', 'hour', and 'day'.
       * @param amount The amount of time to subtract.
       * @return A new {@code FunctionExpression} representing the resulting timestamp after subtraction.
       */
      timestampSubtract(
        unit:
          | 'microsecond'
          | 'millisecond'
          | 'second'
          | 'minute'
          | 'hour'
          | 'day',
        amount: number
      ): FunctionExpression;
      /**
       * @beta
       * Creates an expression that returns the document ID from a DocumentReference.
       *
       * ```typescript
       * // Get the document ID for the current document.
       * field("__name__").documentId();
       * ```
       *
       * @return A new {@code Expression} representing the documentId operation.
       */
      documentId(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that returns a substring of the results of this expression.
       *
       * @param position Index of the first character of the substring.
       * @param length Length of the substring. If not provided, the substring will
       * end at the end of the input.
       */
      substring(position: number, length?: number): FunctionExpression;
      /**
       * @beta
       * Creates an expression that returns a substring of the results of this expression.
       *
       * @param position An expression returning the index of the first character of the substring.
       * @param length An expression returning the length of the substring. If not provided the
       * substring will end at the end of the input.
       */
      substring(position: Expression, length?: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that indexes into an array from the beginning or end
       * and returns the element. If the index exceeds the array length, an error is
       * returned. A negative index, starts from the end.
       *
       * ```typescript
       * // Return the value in the 'tags' field array at index `1`.
       * field('tags').arrayGet(1);
       * ```
       *
       * @param index The index of the element to return.
       * @return A new Expression representing the 'arrayGet' operation.
       */
      arrayGet(index: number): FunctionExpression;
      /**
       * @beta
       * Creates an expression that indexes into an array from the beginning or end
       * and returns the element. If the index exceeds the array length, an error is
       * returned. A negative index, starts from the end.
       *
       * ```typescript
       * // Return the value in the tags field array at index specified by field
       * // 'favoriteTag'.
       * field('tags').arrayGet(field('favoriteTag'));
       * ```
       *
       * @param indexExpr An Expression evaluating to the index of the element to return.
       * @return A new Expression representing the 'arrayGet' operation.
       */
      arrayGet(indexExpr: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that checks if a given expression produces an error.
       *
       * ```typescript
       * // Check if the result of a calculation is an error
       * field("title").arrayContains(1).isError();
       * ```
       *
       * @return A new {@code BooleanExpression} representing the 'isError' check.
       */
      isError(): BooleanExpression;
      /**
       * @beta
       * Creates an expression that returns the result of the `catchExpr` argument
       * if there is an error, else return the result of this expression.
       *
       * ```typescript
       * // Returns the first item in the title field arrays, or returns
       * // the entire title field if the array is empty or the field is another type.
       * field("title").arrayGet(0).ifError(field("title"));
       * ```
       *
       * @param catchExpr The catch expression that will be evaluated and
       * returned if this expression produces an error.
       * @return A new {@code Expression} representing the 'ifError' operation.
       */
      ifError(catchExpr: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that returns the `catch` argument if there is an
       * error, else return the result of this expression.
       *
       * ```typescript
       * // Returns the first item in the title field arrays, or returns
       * // "Default Title"
       * field("title").arrayGet(0).ifError("Default Title");
       * ```
       *
       * @param catchValue The value that will be returned if this expression
       * produces an error.
       * @return A new {@code Expression} representing the 'ifError' operation.
       */
      ifError(catchValue: unknown): FunctionExpression;
      /**
       * @beta
       * Creates an expression that returns `true` if the result of this expression
       * is absent. Otherwise, returns `false` even if the value is `null`.
       *
       * ```typescript
       * // Check if the field `value` is absent.
       * field("value").isAbsent();
       * ```
       *
       * @return A new {@code BooleanExpression} representing the 'isAbsent' check.
       */
      isAbsent(): BooleanExpression;

      /**
       * @beta
       * Creates an expression that checks if the result of an expression is not null.
       *
       * ```typescript
       * // Check if the value of the 'name' field is not null
       * field("name").isNotNull();
       * ```
       *
       * @return A new {@code BooleanExpression} representing the 'isNotNull' check.
       */
      isNotNull(): BooleanExpression;
      /**
       * @beta
       * Creates an expression that checks if the results of this expression is NOT 'NaN' (Not a Number).
       *
       * ```typescript
       * // Check if the result of a calculation is NOT NaN
       * field("value").divide(0).isNotNan();
       * ```
       *
       * @return A new {@code Expression} representing the 'isNaN' check.
       */
      isNotNan(): BooleanExpression;

      /**
       * @beta
       * Creates an expression that removes a key from the map produced by evaluating this expression.
       *
       * ```typescript
       * // Removes the key 'baz' from the input map.
       * map({foo: 'bar', baz: true}).mapRemove('baz');
       * ```
       *
       * @param key The name of the key to remove from the input map.
       * @returns A new {@code FunctionExpression} representing the 'mapRemove' operation.
       */
      mapRemove(key: string): FunctionExpression;

      /**
       * @beta
       * Creates an expression that removes a key from the map produced by evaluating this expression.
       *
       * ```typescript
       * // Removes the key 'baz' from the input map.
       * map({foo: 'bar', baz: true}).mapRemove(constant('baz'));
       * ```
       *
       * @param keyExpr An expression that produces the name of the key to remove from the input map.
       * @returns A new {@code FunctionExpression} representing the 'mapRemove' operation.
       */
      mapRemove(keyExpr: Expression): FunctionExpression;

      /**
       * @beta
       * Creates an expression that merges multiple map values.
       *
       * The first map in the merge operation is the expression on which `mapMerge` is called.
       *
       * ```typescript
       * // Merges the map in the 'settings' field with a literal map and a map
       * // conditionally returned by another expression.
       * field('settings').mapMerge({ enabled: true }, conditional(field('isAdmin'), { admin: true }, {}))
       * ```
       *
       * @param secondMap A required second map to merge. This can be a literal object
       * or an expression that evaluates to a map.
       * @param otherMaps Optional additional maps to merge. Each can be a literal
       * object or an expression that evaluates to a map.
       *
       * @returns A new {@code FunctionExpression} representing the result of the map merge operation.
       */
      mapMerge(
        secondMap: Record<string, unknown> | Expression,
        ...otherMaps: Array<Record<string, unknown> | Expression>
      ): FunctionExpression;
      /**
       * @beta
       * Creates an expression that returns the value of this expression raised to the power of another expression.
       *
       * ```typescript
       * // Raise the value of the 'base' field to the power of the 'exponent' field.
       * field("base").pow(field("exponent"));
       * ```
       *
       * @param exponent The expression to raise this expression to the power of.
       * @return A new `Expression` representing the power operation.
       */
      pow(exponent: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that returns the value of this expression raised to the power of a constant value.
       *
       * ```typescript
       * // Raise the value of the 'base' field to the power of 2.
       * field("base").pow(2);
       * ```
       *
       * @param exponent The constant value to raise this expression to the power of.
       * @return A new `Expression` representing the power operation.
       */
      pow(exponent: number): FunctionExpression;
      /**
       * @beta
       * Creates an expression that rounds a numeric value to the nearest whole number.
       *
       * ```typescript
       * // Round the value of the 'price' field.
       * field("price").round();
       * ```
       *
       * @return A new `Expression` representing the rounded value.
       */
      round(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that rounds a numeric value to the nearest whole number.
       *
       * ```typescript
       * // Round the value of the 'price' field.
       * field("price").round();
       * ```
       *
       * @return A new `Expression` representing the rounded value.
       */
      round(): FunctionExpression;
      /**
       * Creates an expression that rounds a numeric value to the specified number of decimal places.
       *
       * ```typescript
       * // Round the value of the 'price' field to two decimal places.
       * field("price").round(2);
       * ```
       *
       * @param decimalPlaces A constant specifying the rounding precision in decimal places.
       *
       * @return A new `Expr` representing the rounded value.
       */
      round(decimalPlaces: number): FunctionExpression;
      /**
       * Creates an expression that rounds a numeric value to the specified number of decimal places.
       *
       * ```typescript
       * // Round the value of the 'price' field to two decimal places.
       * field("price").round(constant(2));
       * ```
       *
       * @param decimalPlaces An expression specifying the rounding precision in decimal places.
       *
       * @return A new `Expr` representing the rounded value.
       */
      round(decimalPlaces: Expression): FunctionExpression;
      /**
       * @beta
       * Creates an expression that returns the collection ID from a path.
       *
       * ```typescript
       * // Get the collection ID from a path.
       * field("__name__").collectionId();
       * ```
       *
       * @return A new {@code Expression} representing the collectionId operation.
       */
      collectionId(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that calculates the length of a string, array, map, vector, or bytes.
       *
       * ```typescript
       * // Get the length of the 'name' field.
       * field("name").length();
       *
       * // Get the number of items in the 'cart' array.
       * field("cart").length();
       * ```
       *
       * @return A new `Expression` representing the length of the string, array, map, vector, or bytes.
       */
      length(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that computes the natural logarithm of a numeric value.
       *
       * ```typescript
       * // Compute the natural logarithm of the 'value' field.
       * field("value").ln();
       * ```
       *
       * @return A new {@code Expression} representing the natural logarithm of the numeric value.
       */
      ln(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that computes the square root of a numeric value.
       *
       * ```typescript
       * // Compute the square root of the 'value' field.
       * field("value").sqrt();
       * ```
       *
       * @return A new {@code Expression} representing the square root of the numeric value.
       */
      sqrt(): FunctionExpression;
      /**
       * @beta
       * Creates an expression that reverses a string.
       *
       * ```typescript
       * // Reverse the value of the 'myString' field.
       * field("myString").stringReverse();
       * ```
       *
       * @return A new {@code Expression} representing the reversed string.
       */
      stringReverse(): FunctionExpression;

      /**
       * @beta
       * Creates an expression that returns the `elseValue` argument if this expression results in an absent value, else
       * return the result of the this expression evaluation.
       *
       * ```typescript
       * // Returns the value of the optional field 'optional_field', or returns 'default_value'
       * // if the field is absent.
       * field("optional_field").ifAbsent("default_value")
       * ```
       *
       * @param elseValue The value that will be returned if this Expression evaluates to an absent value.
       * @return A new [Expression] representing the ifAbsent operation.
       */
      ifAbsent(elseValue: unknown): Expression;

      /**
       * @beta
       * Creates an expression that returns the `elseValue` argument if this expression results in an absent value, else
       * return the result of this expression evaluation.
       *
       * ```typescript
       * // Returns the value of the optional field 'optional_field', or if that is
       * // absent, then returns the value of the field `
       * field("optional_field").ifAbsent(field('default_field'))
       * ```
       *
       * @param elseExpression The Expression that will be evaluated if this Expression evaluates to an absent value.
       * @return A new [Expression] representing the ifAbsent operation.
       */
      ifAbsent(elseExpression: unknown): Expression;

      ifAbsent(elseValueOrExpression: Expression | unknown): Expression;

      /**
       * @beta
       * Creates an expression that joins the elements of an array into a string.
       *
       * ```typescript
       * // Join the elements of the 'tags' field with the delimiter from the 'separator' field.
       * field("tags").join(field("separator"))
       * ```
       *
       * @param delimiterExpression The expression that evaluates to the delimiter string.
       * @return A new Expression representing the join operation.
       */
      join(delimiterExpression: Expression): Expression;

      /**
       * @beta
       * Creates an expression that joins the elements of an array field into a string.
       *
       * ```typescript
       * // Join the elements of the 'tags' field with a comma and space.
       * field("tags").join(", ")
       * ```
       *
       * @param delimiter The string to use as a delimiter.
       * @return A new Expression representing the join operation.
       */
      join(delimiter: string): Expression;

      join(delimeterValueOrExpression: string | Expression): Expression;

      /**
       * @beta
       * Creates an expression that computes the base-10 logarithm of a numeric value.
       *
       * ```typescript
       * // Compute the base-10 logarithm of the 'value' field.
       * field("value").log10();
       * ```
       *
       * @return A new {@code Expr} representing the base-10 logarithm of the numeric value.
       */
      log10(): FunctionExpression;

      /**
       * @beta
       * Creates an expression that computes the sum of the elements in an array.
       *
       * ```typescript
       * // Compute the sum of the elements in the 'scores' field.
       * field("scores").arraySum();
       * ```
       *
       * @return A new {@code Expr} representing the sum of the elements in the array.
       */
      arraySum(): FunctionExpression;
      // TODO(new-expression): Add new expression method declarations above this line
      /**
       * @beta
       * Creates an {@link Ordering} that sorts documents in ascending order based on this expression.
       *
       * ```typescript
       * // Sort documents by the 'name' field in ascending order
       * pipeline().collection("users")
       *   .sort(field("name").ascending());
       * ```
       *
       * @return A new `Ordering` for ascending sorting.
       */
      ascending(): Ordering;
      /**
       * @beta
       * Creates an {@link Ordering} that sorts documents in descending order based on this expression.
       *
       * ```typescript
       * // Sort documents by the 'createdAt' field in descending order
       * pipeline().collection("users")
       *   .sort(field("createdAt").descending());
       * ```
       *
       * @return A new `Ordering` for descending sorting.
       */
      descending(): Ordering;
      /**
       * @beta
       * Assigns an alias to this expression.
       *
       * Aliases are useful for renaming fields in the output of a stage or for giving meaningful
       * names to calculated values.
       *
       * ```typescript
       * // Calculate the total price and assign it the alias "totalPrice" and add it to the output.
       * pipeline().collection("items")
       *   .addFields(field("price").multiply(field("quantity")).as("totalPrice"));
       * ```
       *
       * @param name The alias to assign to this expression.
       * @return A new {@link AliasedExpression} that wraps this
       *     expression and associates it with the provided alias.
       */
      as(name: string): AliasedExpression;
    }
    /**
     * @beta
     * An interface that represents a selectable expression.
     */
    export interface Selectable {
      selectable: true;
      /**
       * @beta
       * @internal
       */
      readonly _alias: string;
      /**
       * @beta
       * @internal
       */
      readonly _expr: Expression;
    }

    /**
     * @beta
     * Represents an aggregate function used within Firestore pipelines.
     * Aggregate functions perform a calculation across a set of documents and return a single result,
     * such as counting documents, summing numeric fields, or finding minimum/maximum values.
     */
    export class AggregateFunction {
      /**
       * @beta
       * @property expressionType The type of the aggregate expression, indicating the specific aggregate function (e.g., COUNT, SUM, AVG).
       */
      expressionType: ExpressionType;

      /**
       * @beta
       * @private
       * @internal
       * @param name
       * @param params
       */
      constructor(name: string, params: Expression[]);
      /**
       * @beta
       * Assigns an alias to this AggregateFunction. The alias specifies the name that
       * the aggregated value will have in the output document.
       *
       * ```typescript
       * // Calculate the average price of all items and assign it the alias "averagePrice".
       * pipeline().collection("items")
       *   .aggregate(field("price").average().as("averagePrice"));
       * ```
       *
       * @param name The alias to assign to this AggregateFunction.
       * @return A new {@link AliasedAggregate} that wraps this
       *     AggregateFunction and associates it with the provided alias.
       */
      as(name: string): AliasedAggregate;
    }

    /**
     * @beta
     * Represents an {@link AggregateFunction} that has been assigned an alias.
     * This class is used to associate an aggregate result with a name.
     */
    export class AliasedAggregate {
      /**
       * @beta
       * The underlying {@link AggregateFunction} that this aliased aggregate wraps.
       * @internal
       */
      readonly _aggregate: AggregateFunction;

      /**
       * @beta
       * Specifies the name of the property that will contain the aggregate result in the output document.
       * @internal
       */
      readonly _alias: string;
    }

    /**
     * @beta
     * Represents an expression that has been assigned an alias using the `.as()` method.
     *
     * This class wraps an existing {@link Expression} and associates it with a user-defined alias,
     * allowing the expression's result to be referred to by name in the output
     * of a Firestore pipeline query.
     */
    export class AliasedExpression implements Selectable {
      /**
       * @beta
       * @internal
       * Specifies that the instance is an AliasedExpression.
       */
      expressionType: ExpressionType;

      /**
       * @beta
       * Specifies that this class is selectable, meaning it contains an {@link Expression} and an alias,
       * and can be provided to the Select stage of a pipeline.
       */
      selectable: true;

      /**
       * @beta
       * @internal
       * The underlying expression that is being aliased.
       */
      readonly _expr: Expression;

      /**
       * @beta
       * @internal
       * Specifies the name of the property that will contain the aggregate result in the output document.
       */
      readonly _alias: string;
    }

    /**
     * @beta
     * Represents a reference to a field within a Firestore document or an output from a {@link Pipeline} stage.
     *
     * This class extends {@link Expression}. It is a type of expression that can be evaluated
     * within Firestore Pipelines. It also implements {@link Selectable},
     * meaning instances of `Field` can be used to specify fields for selection in the {@link Pipeline.select} stage.
     *
     * `Field` instances are fundamental for constructing expressions that access document field values,
     * and for defining criteria for sorting, filtering, and projecting data in Firestore Pipelines.
     */
    export class Field extends Expression implements Selectable {
      /**
       * @beta
       * @internal Specifies that the instance is a Field.
       */
      readonly expressionType: ExpressionType;
      /**
       * @beta
       * Specifies that this class is selectable, meaning it contains an {@link Expression} and an alias,
       * and can be provided to the Select stage of a pipeline.
       */
      selectable: true;
      /**
       * @beta
       * Returns the name of the field.
       *
       * @example
       * ```typescript
       * const name = field("price").fieldName;
       * console.log(name); // "price"
       * ```
       *
       * @returns The name of the field.
       */
      get fieldName(): string;
      /**
       * @beta
       * @internal
       * Returns the alias of the field, which is the field-name itself.
       *
       * @returns The field name itself.
       */
      get _alias(): string;
      /**
       * @beta
       * @internal
       * Self-referential getter that returns this.
       *
       * @returns This {@link Field} object.
       */
      get _expr(): Expression;
    }
    /**
     * @beta
     * Creates a {@code Field} instance representing the field at the given path.
     *
     * The path can be a simple field name (e.g., "name") or a dot-separated path to a nested field
     * (e.g., "address.city").
     *
     * ```typescript
     * // Create a Field instance for the 'title' field
     * const titleField = field("title");
     *
     * // Create a Field instance for a nested field 'author.firstName'
     * const authorFirstNameField = field("author.firstName");
     * ```
     *
     * @param name The path to the field.
     * @return A new {@code Field} instance representing the specified field.
     */
    export function field(name: string): Field;
    /**
     * @beta
     * Creates a new Field instance from a given FieldPath.
     *
     * @param path The FieldPath to convert into a Field.
     * @returns A new {@link Field} instance representing the specified path.
     */
    export function field(path: FieldPath): Field;

    /**
     * @beta
     * @internal
     * Represents a constant value that can be used as part of a Firestore pipeline expression.
     *
     * Instances of `Constant` are typically created via the top-level `constant()` function.
     *
     * ```typescript
     * // Create a Constant instance for the number 10
     * const ten = constant(10);
     *
     * // Create a Constant instance for the string "hello"
     * const hello = constant("hello");
     * ```
     */
    export class Constant extends Expression {
      readonly expressionType: ExpressionType;
    }
    /**
     * @beta
     * Creates an `Expression` instance for a number value.
     *
     * @param value The number value.
     * @return A new `Expression` instance.
     */
    export function constant(value: number): Expression;
    /**
     * @beta
     * Creates an `Expression` instance for a string value.
     *
     * @param value The string value.
     * @return A new `Expression` instance.
     */
    export function constant(value: string): Expression;
    /**
     * @beta
     * Creates an `Expression` instance for a boolean value.
     *
     * @param value The boolean value.
     * @return A new `Expression` instance.
     */
    export function constant(value: boolean): BooleanExpression;
    /**
     * @beta
     * Creates an `Expression` instance for a null value.
     *
     * @param value The null value.
     * @return A new `Expression` instance.
     */
    export function constant(value: null): Expression;
    /**
     * @beta
     * Creates an `Expression` instance for a GeoPoint value.
     *
     * @param value The GeoPoint value.
     * @return A new `Expression` instance.
     */
    export function constant(value: GeoPoint): Expression;
    /**
     * @beta
     * Creates an `Expression` instance for a Timestamp value.
     *
     * @param value The Timestamp value.
     * @return A new `Expression` instance.
     */
    export function constant(value: Timestamp): Expression;
    /**
     * @beta
     * Creates an `Expression` instance for a Date value.
     *
     * @param value The Date value.
     * @return A new `Expression` instance.
     */
    export function constant(value: Date): Expression;
    /**
     * @beta
     * Creates an `Expression` instance for a Buffer | Uint8Array value.
     *
     * @param value The Buffer | Uint8Array value.
     * @return A new `Expression` instance.
     */
    export function constant(value: Buffer | Uint8Array): Expression;
    /**
     * @beta
     * Creates an `Expression` instance for a DocumentReference value.
     *
     * @param value The DocumentReference value.
     * @return A new `Expression` instance.
     */
    export function constant(value: DocumentReference): Expression;
    /**
     * @beta
     * Creates an `Expression` instance for a VectorValue value.
     *
     * @param value The VectorValue value.
     * @return A new `Expression` instance.
     */
    export function constant(value: VectorValue): Expression;

    /**
     * @beta
     * Represents an expression that encapsulates a function call within the Firestore Pipelines.
     *
     * `FunctionExpression` extends {@link Expression} and is used to build complex queries and transformations
     * by applying various functions (e.g., `and`, `equal`, `ceil`) to fields or other expressions.
     *
     * You typically do not instantiate `FunctionExpression` directly. Instead, use the provided
     * top-level functions (like {@link and}, {@link equal}, {@link ceil}) or methods available
     * on {@link Expression} instances (e.g., {@link Expression#equal}, {@link Expression#lessThan}) to construct
     * `FunctionExpression` instances.
     *
     * ```typescript
     * // Example of creating a FunctionExpression indirectly using helper functions:
     * const priceGreaterThan10 = field("price").greaterThan(10);
     * const combinedCondition = and(priceGreaterThan10, field("category").equal("books"));
     *
     * // 'priceGreaterThan10' and 'combinedCondition' are instances of FunctionExpression.
     * ```
     */
    export class FunctionExpression extends Expression {
      /**
       * @beta
       * @internal
       * Indicates that this expression is a `FunctionExpression`.
       */
      readonly expressionType: ExpressionType;
      /**
       * @beta
       * @private
       * @internal
       *
       * Initializes a new `FunctionExpression` instance with the given function name and parameters.
       *
       * @param name The name of the function.
       * @param params An array of `Expression` instances representing the parameters of the function.
       */
      constructor(name: string, params: Expression[]);
    }
    /**
     * @beta
     * An expression that evaluates to a boolean value.
     *
     * This expression type is useful for filter conditions.
     *
     */
    export class BooleanExpression extends FunctionExpression {
      /**
       * @beta
       * @internal
       * @private
       */
      returnType: 'boolean';
      /**
       * @beta
       * Creates an aggregation that finds the count of input documents satisfying
       * this boolean expression.
       *
       * ```typescript
       * // Find the count of documents with a score greater than 90
       * field("score").greaterThan(90).countIf().as("highestScore");
       * ```
       *
       * @return A new `AggregateFunction` representing the 'countIf' aggregation.
       */
      countIf(): AggregateFunction;
      /**
       * @beta
       * Creates an expression that negates this boolean expression.
       *
       * ```typescript
       * // Find documents where the 'tags' field does not contain 'completed'
       * field("tags").arrayContains("completed").not();
       * ```
       *
       * @return A new {@code Expression} representing the negated filter condition.
       */
      not(): BooleanExpression;
    }
    /**
     * @beta
     * Creates an aggregation that counts the number of stage inputs where the provided
     * boolean expression evaluates to true.
     *
     * ```typescript
     * // Count the number of documents where 'is_active' field equals true
     * countIf(field("is_active").equal(true)).as("numActiveDocuments");
     * ```
     *
     * @param booleanExpr - The boolean expression to evaluate on each input.
     * @returns A new `AggregateFunction` representing the 'countIf' aggregation.
     */
    export function countIf(booleanExpr: BooleanExpression): AggregateFunction;
    /**
     * @beta
     * Creates an expression that indexes into an array from the beginning or end
     * and return the element. If the index exceeds the array length, an error is
     * returned. A negative index, starts from the end.
     *
     * ```typescript
     * // Return the value in the tags field array at index 1.
     * arrayGet('tags', 1);
     * ```
     *
     * @param arrayField The name of the array field.
     * @param index The index of the element to return.
     * @return A new Expression representing the 'arrayGet' operation.
     */
    export function arrayGet(
      arrayField: string,
      index: number
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that indexes into an array from the beginning or end
     * and return the element. If the index exceeds the array length, an error is
     * returned. A negative index, starts from the end.
     *
     * ```typescript
     * // Return the value in the tags field array at index specified by field
     * // 'favoriteTag'.
     * arrayGet('tags', field('favoriteTag'));
     * ```
     *
     * @param arrayField The name of the array field.
     * @param indexExpr An Expression evaluating to the index of the element to return.
     * @return A new Expression representing the 'arrayGet' operation.
     */
    export function arrayGet(
      arrayField: string,
      indexExpr: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that indexes into an array from the beginning or end
     * and return the element. If the index exceeds the array length, an error is
     * returned. A negative index, starts from the end.
     *
     * ```typescript
     * // Return the value in the tags field array at index 1.
     * arrayGet(field('tags'), 1);
     * ```
     *
     * @param arrayExpression An Expression evaluating to an array.
     * @param index The index of the element to return.
     * @return A new Expression representing the 'arrayGet' operation.
     */
    export function arrayGet(
      arrayExpression: Expression,
      index: number
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that indexes into an array from the beginning or end
     * and return the element. If the index exceeds the array length, an error is
     * returned. A negative index, starts from the end.
     *
     * ```typescript
     * // Return the value in the tags field array at index specified by field
     * // 'favoriteTag'.
     * arrayGet(field('tags'), field('favoriteTag'));
     * ```
     *
     * @param arrayExpression An Expression evaluating to an array.
     * @param indexExpr An Expression evaluating to the index of the element to return.
     * @return A new Expression representing the 'arrayGet' operation.
     */
    export function arrayGet(
      arrayExpression: Expression,
      indexExpr: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that checks if a given expression produces an error.
     *
     * ```typescript
     * // Check if the result of a calculation is an error
     * isError(field("title").arrayContains(1));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code Expression} representing the 'isError' check.
     */
    export function isError(value: Expression): BooleanExpression;
    /**
     * @beta
     *
     * Creates an expression that returns the `catch` argument if there is an
     * error, else return the result of the `try` argument evaluation.
     *
     * This overload is useful when a BooleanExpression is required.
     *
     * ```typescript
     * // Create an expression that protects against a divide by zero error
     * // but always returns a boolean expression.
     * ifError(constant(50).divide('length').gt(1), constant(false));
     * ```
     *
     * @param tryExpr The try expression.
     * @param catchExpr The catch expression that will be evaluated and
     * returned if the tryExpr produces an error.
     * @return A new {@code Expr} representing the 'ifError' operation.
     */
    export function ifError(
      tryExpr: BooleanExpression,
      catchExpr: BooleanExpression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that returns the `catch` argument if there is an
     * error, else return the result of the `try` argument evaluation.
     *
     * ```typescript
     * // Returns the first item in the title field arrays, or returns
     * // the entire title field if the array is empty or the field is another type.
     * ifError(field("title").arrayGet(0), field("title"));
     * ```
     *
     * @param tryExpr The try expression.
     * @param catchExpr The catch expression that will be evaluated and
     * returned if the tryExpr produces an error.
     * @return A new {@code Expression} representing the 'ifError' operation.
     */
    export function ifError(
      tryExpr: Expression,
      catchExpr: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns the `catch` argument if there is an
     * error, else return the result of the `try` argument evaluation.
     *
     * ```typescript
     * // Returns the first item in the title field arrays, or returns
     * // "Default Title"
     * ifError(field("title").arrayGet(0), "Default Title");
     * ```
     *
     * @param tryExpr The try expression.
     * @param catchValue The value that will be returned if the tryExpr produces an
     * error.
     * @return A new {@code Expression} representing the 'ifError' operation.
     */
    export function ifError(
      tryExpr: Expression,
      catchValue: unknown
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns `true` if a value is absent. Otherwise,
     * returns `false` even if the value is `null`.
     *
     * ```typescript
     * // Check if the field `value` is absent.
     * isAbsent(field("value"));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code Expression} representing the 'isAbsent' check.
     */
    export function isAbsent(value: Expression): BooleanExpression;
    /**
     * @beta
     * Creates an expression that returns `true` if a field is absent. Otherwise,
     * returns `false` even if the field value is `null`.
     *
     * ```typescript
     * // Check if the field `value` is absent.
     * isAbsent("value");
     * ```
     *
     * @param field The field to check.
     * @return A new {@code Expression} representing the 'isAbsent' check.
     */
    export function isAbsent(field: string): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if an expression evaluates to 'null'.
     *
     * ```typescript
     * // Check if the 'lastLogin' field is null
     * isNull(field("lastLogin"));
     * ```
     *
     * @param value The expression to check for null.
     * @return A new {@code BooleanExpression} representing the 'isNull' check.
     */
    export function isNull(value: Expression): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's value evaluates to 'null'.
     *
     * ```typescript
     * // Check if the 'endDate' field is null.
     * isNull("endDate");
     * ```
     *
     * @param value The name of the field to check.
     * @return A new {@code BooleanExpression} representing the 'isNull' check.
     */
    export function isNull(value: string): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if the result of an expression is not null.
     *
     * ```typescript
     * // Check if the value of the 'name' field is not null
     * isNotNull(field("name"));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code BooleanExpression} representing the 'not null' check.
     */
    export function isNotNull(value: Expression): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if the value of a field is not null.
     *
     * ```typescript
     * // Check if the value of the 'name' field is not null
     * isNotNull("name");
     * ```
     *
     * @param value The name of the field to check.
     * @return A new {@code BooleanExpression} representing the 'not null' check.
     */
    export function isNotNull(value: string): BooleanExpression;

    /**
     * @beta
     * Creates an expression that evaluates to `true` if the given expression's result is not `NaN` (Not a Number), and `false` otherwise.
     *
     * ```typescript
     * // Check if the result of a calculation is NOT NaN
     * isNotNan(field("value").divide(0));
     * ```
     *
     * @param value The expression to check for `NaN`.
     * @return A new {@code BooleanExpression} representing the result of the `isNotNaN` check.
     */
    export function isNotNan(value: Expression): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a numeric value is not NaN (Not a Number).
     *
     * ```typescript
     * // Check if the value of a field is not NaN
     * isNotNan("value");
     * ```
     *
     * @param value The name of the field to check.
     * @return A new {@code BooleanExpression} representing the 'isNotNan' check.
     */
    export function isNotNan(value: string): BooleanExpression;
    /**
     * @beta
     * Creates an expression that removes a key from the map at the specified field name.
     *
     * ```
     * // Removes the key 'city' field from the map in the address field of the input document.
     * mapRemove('address', 'city');
     * ```
     *
     * @param mapField The name of a field containing a map value.
     * @param key The name of the key to remove from the input map.
     */
    export function mapRemove(
      mapField: string,
      key: string
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that removes a key from the map produced by evaluating another expression.
     *
     * ```typescript
     * // Removes the key 'baz' from the input map.
     * mapRemove(map({foo: 'bar', baz: true}), 'baz');
     * ```
     *
     * @param mapExpr An expression that evaluates to a map value.
     * @param key The name of the key to remove from the input map.
     * @returns A new {@link FunctionExpression} representing the map with the specified key removed.
     */
    export function mapRemove(
      mapExpr: Expression,
      key: string
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that removes a key from the map at the specified field name.
     *
     * ```typescript
     * // Removes the key 'city' field from the map in the address field of the input document.
     * mapRemove('address', constant('city'));
     * ```
     *
     * @param mapField The name of a field containing a map value.
     * @param keyExpr An expression that produces the name of the key to remove from the input map.
     * @returns A new {@code FunctionExpression} representing the map after the key has been removed.
     */
    export function mapRemove(
      mapField: string,
      keyExpr: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that removes a key from a map.
     *
     * The `mapRemove` function takes two expressions:
     * 1. An expression that evaluates to a map.
     * 2. An expression that evaluates to the string key to be removed from the map.
     *
     * ```typescript
     * // Removes the key 'baz' from the input map.
     * mapRemove(map({foo: 'bar', baz: true}), constant('baz'));
     * ```
     *
     * @param mapExpr An expression that evaluates to a map value.
     * @param keyExpr An expression that evaluates to the string key to remove from the map.
     * @returns A new {@link FunctionExpression} representing the map with the specified key removed.
     */
    export function mapRemove(
      mapExpr: Expression,
      keyExpr: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that merges multiple map values.
     *
     * ```
     * // Merges the map in the settings field with, a map literal, and a map in
     * // that is conditionally returned by another expression
     * mapMerge('settings', { enabled: true }, conditional(field('isAdmin'), { admin: true}, {})
     * ```
     *
     * @param mapField Name of a field containing a map value that will be merged.
     * @param secondMap A required second map to merge. Represented as a literal or
     * an expression that returns a map.
     * @param otherMaps Optional additional maps to merge. Each map is represented
     * as a literal or an expression that returns a map.
     */
    export function mapMerge(
      mapField: string,
      secondMap: Record<string, unknown> | Expression,
      ...otherMaps: Array<Record<string, unknown> | Expression>
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that merges multiple map values.
     *
     * ```
     * // Merges the map in the settings field with, a map literal, and a map in
     * // that is conditionally returned by another expression
     * mapMerge(field('settings'), { enabled: true }, conditional(field('isAdmin'), { admin: true}, {})
     * ```
     *
     * @param firstMap An expression or literal map value that will be merged.
     * @param secondMap A required second map to merge. Represented as a literal or
     * an expression that returns a map.
     * @param otherMaps Optional additional maps to merge. Each map is represented
     * as a literal or an expression that returns a map.
     */
    export function mapMerge(
      firstMap: Record<string, unknown> | Expression,
      secondMap: Record<string, unknown> | Expression,
      ...otherMaps: Array<Record<string, unknown> | Expression>
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that extracts the document ID from a document reference.
     *
     * ```typescript
     * // Get the document ID from a document reference.
     * documentId(field("__name__"));
     * ```
     *
     * @param documentPathExpr An expression evaluating to a document path.
     * @return A new {@code FunctionExpression} representing the document ID as a string.
     */
    export function documentId(
      documentPathExpr: Expression
    ): FunctionExpression;

    /**
     * @beta
     *
     * Creates an expression that returns the document ID from a path.
     *
     * ```typescript
     * // Get the document ID from a path.
     * documentId(myDocumentReference);
     * ```
     *
     * @return A new {@code Expr} representing the documentId operation.
     */
    export function documentId(
      documentPath: string | DocumentReference
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that returns the document ID from a path.
     *
     * ```typescript
     * // Get the document ID from a path.
     * documentId(field("__path__"));
     * ```
     *
     * @return A new {@code Expression} representing the documentId operation.
     */
    export function documentId(
      documentPathExpr: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns a substring of a string or byte array.
     *
     * @param field The name of a field containing a string or byte array to compute the substring from.
     * @param position Index of the first character of the substring.
     * @param length Length of the substring.
     */
    export function substring(
      field: string,
      position: number,
      length?: number
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns a substring of a string or byte array.
     *
     * @param input An expression returning a string or byte array to compute the substring from.
     * @param position Index of the first character of the substring.
     * @param length Length of the substring.
     */
    export function substring(
      input: Expression,
      position: number,
      length?: number
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns a substring of a string or byte array.
     *
     * @param field The name of a field containing a string or byte array to compute the substring from.
     * @param position An expression that returns the index of the first character of the substring.
     * @param length An expression that returns the length of the substring.
     */
    export function substring(
      field: string,
      position: Expression,
      length?: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that returns a substring of a string or byte array.
     *
     * ```typescript
     * // Get a substring of the 'myString' field from index 0 with length 5.
     * substring(field("myString"), 0, 5);
     * ```
     *
     * @param input An expression returning a string or byte array from which to extract the substring.
     * @param position An expression that returns the 0-based starting index of the substring.
     * @param length Optional. An expression that returns the length of the substring. If omitted, the substring extends to the end of the input.
     * @return A new {@code FunctionExpression} representing the substring operation.
     */
    export function substring(
      input: Expression,
      position: Expression,
      length?: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that performs an addition operation on two or more numeric expressions or literal values.
     *
     * This function supports adding multiple values. For example, `add(a, b, c)` is equivalent to `add(add(a, b), c)`.
     *
     * ```typescript
     * // Add the value of the 'quantity' field and the 'reserve' field.
     * add(field("quantity"), field("reserve"));
     *
     * // Add three values: a field, a literal number, and another field.
     * add(field("price"), 10, field("tax"));
     * ```
     *
     * @param first The initial numeric expression or literal value.
     * @param second The second numeric expression or literal value to add.
     * @param others Optional: Additional numeric expressions or literal values to add.
     * @return A new {@code FunctionExpression} representing the sum of all provided arguments.
     */
    export function add(
      first: Expression,
      second: Expression | unknown,
      ...others: Array<Expression | unknown>
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that computes the sum of a field's value and one or more other expressions or literals.
     *
     * ```typescript
     * // Add the value of the 'quantity' field to the value of the 'reserve' field.
     * add("quantity", field("reserve"));
     *
     * // Add the value of the 'price' field to a literal number.
     * add("price", 10);
     *
     * // Add the value of the 'total' field to the values of 'tax' and 'shipping' fields.
     * add("total", field("tax"), field("shipping"));
     * ```
     *
     * @param fieldName The name of the field whose value will be the first operand in the addition.
     * @param second The second operand, which can be an {@code Expression} or a literal value.
     * @param others Optional additional operands, each of which can be an {@code Expression} or a literal value.
     * @return A new {@code Expression} representing the addition operation.
     */
    export function add(
      fieldName: string,
      second: Expression | unknown,
      ...others: Array<Expression | unknown>
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that subtracts two expressions.
     *
     * ```typescript
     * // Subtract the 'discount' field from the 'price' field
     * subtract(field("price"), field("discount"));
     * ```
     *
     * @param minuend The expression to subtract from.
     * @param subtrahend The expression to subtract.
     * @return A new {@code Expression} representing the subtraction operation.
     */
    export function subtract(
      minuend: Expression,
      subtrahend: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that subtracts one value from another.
     *
     * ```typescript
     * // Subtract the constant value 2 from the 'value' field
     * subtract(field("value"), 2);
     * ```
     *
     * @param minuend The expression to subtract from.
     * @param subtrahend The value to subtract.
     * @return A new {@code Expression} representing the subtraction operation.
     */
    export function subtract(
      minuend: Expression,
      subtrahend: unknown
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that subtracts an expression from a field's value.
     *
     * ```typescript
     * // Subtract the 'discount' field from the 'price' field
     * subtract("price", field("discount"));
     * ```
     *
     * @param minuendFieldName The field name to subtract from.
     * @param subtrahend The expression to subtract.
     * @return A new {@code Expression} representing the subtraction operation.
     */
    export function subtract(
      minuendFieldName: string,
      subtrahend: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that subtracts a value from a field's value.
     *
     *
     * ```typescript
     * // Subtract 20 from the value of the 'total' field
     * subtract("total", 20);
     * ```
     *
     * @param minuendFieldName The name of the field to subtract from.
     * @param subtrahend The value to subtract.
     * @return A new {@code Expression} representing the subtraction operation.
     */
    export function subtract(
      minuendFieldName: string,
      subtrahend: unknown
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that multiplies two or more values together.
     *
     * ```typescript
     * // Multiply the 'quantity' field by the 'price' field
     * multiply(field("quantity"), field("price"));
     *
     * // Multiply three values together
     * multiply(field("a"), 2, field("b"));
     * ```
     *
     * @param first The first expression to multiply.
     * @param second The second expression or literal to multiply.
     * @param others Optional additional expressions or literals to multiply.
     * @return A new {@code FunctionExpression} representing the multiplication operation.
     */
    export function multiply(
      first: Expression,
      second: Expression | unknown,
      ...others: Array<Expression | unknown>
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that multiplies a field's value by one or more other expressions or literal values.
     *
     * ```typescript
     * // Multiply the 'quantity' field by the 'price' field
     * multiply("quantity", field("price"));
     * ```
     *
     * @param fieldName The name of the field whose value will be the initial operand of the multiplication.
     * @param second The second operand, which can be an {@link Expression} or a literal value, to be multiplied.
     * @param others Optional additional operands ({@link Expression} or literal values) to be included in the multiplication.
     * @return A new {@link FunctionExpression} representing the multiplication operation.
     */
    export function multiply(
      fieldName: string,
      second: Expression | unknown,
      ...others: Array<Expression | unknown>
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that divides two expressions.
     *
     * ```typescript
     * // Divide the 'total' field by the 'count' field
     * divide(field("total"), field("count"));
     * ```
     *
     * @param dividend The expression to be divided.
     * @param divisor The expression to divide by.
     * @return A new {@code Expression} representing the division operation.
     */
    export function divide(
      dividend: Expression,
      divisor: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that divides an expression by a constant value.
     *
     * ```typescript
     * // Divide the 'value' field by 10
     * divide(field("value"), 10);
     * ```
     *
     * @param dividend The expression to be divided.
     * @param divisor The constant value to divide by.
     * @return A new {@code Expression} representing the division operation.
     */
    export function divide(
      dividend: Expression,
      divisor: unknown
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that divides a field's value by an expression.
     *
     * ```typescript
     * // Divide the 'total' field by the 'count' field
     * divide("total", field("count"));
     * ```
     *
     * @param dividend The field name to be divided.
     * @param divisor The expression to divide by.
     * @return A new {@code Expression} representing the division operation.
     */
    export function divide(
      dividend: string,
      divisor: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that divides a field's value by a constant value.
     *
     * ```typescript
     * // Divide the 'value' field by 10
     * divide("value", 10);
     * ```
     *
     * @param dividend The field name to be divided.
     * @param divisor The constant value to divide by.
     * @return A new {@code Expression} representing the division operation.
     */
    export function divide(
      dividend: string,
      divisor: unknown
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that calculates the modulo (remainder) of dividing two expressions.
     *
     * ```typescript
     * // Calculate the remainder of dividing 'field1' by 'field2'.
     * mod(field("field1"), field("field2"));
     * ```
     *
     * @param left The dividend expression.
     * @param right The divisor expression.
     * @return A new {@code Expression} representing the modulo operation.
     */
    export function mod(
      left: Expression,
      right: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that calculates the modulo (remainder) of dividing an expression by a constant.
     *
     * ```typescript
     * // Calculate the remainder of dividing 'field1' by 5.
     * mod(field("field1"), 5);
     * ```
     *
     * @param expression The dividend expression.
     * @param value The divisor constant.
     * @return A new {@code Expression} representing the modulo operation.
     */
    export function mod(
      expression: Expression,
      value: unknown
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that calculates the modulo (remainder) of dividing a field's value by an expression.
     *
     * ```typescript
     * // Calculate the remainder of dividing 'field1' by 'field2'.
     * mod("field1", field("field2"));
     * ```
     *
     * @param fieldName The dividend field name.
     * @param expression The divisor expression.
     * @return A new {@code Expression} representing the modulo operation.
     */
    export function mod(
      fieldName: string,
      expression: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that calculates the modulo (remainder) of dividing a field's value by a constant.
     *
     * ```typescript
     * // Calculate the remainder of dividing 'field1' by 5.
     * mod("field1", 5);
     * ```
     *
     * @param fieldName The dividend field name.
     * @param value The divisor constant.
     * @return A new {@code Expression} representing the modulo operation.
     */
    export function mod(fieldName: string, value: unknown): FunctionExpression;

    /**
     * @beta
     * Creates an expression that constructs a Firestore map value from a given JavaScript object.
     * The keys of the object become the field names in the Firestore map, and the values become the field values.
     * Values can be literal values or other expressions (e.g., `Field.of()`).
     *
     * ```typescript
     * // Create a map from the input object, where 'foo' is a literal string and 'baz' references the value
     * // of the 'baz' field from the document currently being processed by the pipeline.
     * map({foo: 'bar', baz: Field.of('baz')}).as('data');
     * ```
     *
     * @param elements The JavaScript object literal whose properties will be used to create the Firestore map expression.
     * @returns A new {@code FunctionExpression} representing the map function.
     */
    export function map(elements: Record<string, unknown>): FunctionExpression;
    /**
     * @beta
     * Creates an expression that creates a Firestore array value from a given JavaScript array.
     * Array values can be literals or other expressions (e.g., `Field.of()`).
     *
     * ```typescript
     * // Create an array value from the input array and reference the 'baz' field value from the input document.
     * array(['bar', Field.of('baz')]).as('foo');
     * ```
     *
     * @param elements The input array to evaluate in the expression.
     * @return A new {@code Expression} representing the array function.
     */
    export function array(elements: unknown[]): FunctionExpression;

    /**
     * @beta
     * Creates an expression that checks if two expressions are equal.
     *
     * ```typescript
     * // Check if the 'age' field is equal to an expression
     * equal(field("age"), field("minAge").add(10));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `BooleanExpression` representing the equality comparison.
     */
    export function equal(
      left: Expression,
      right: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an expression is equal to a constant value.
     *
     * ```typescript
     * // Check if the 'age' field is equal to 21
     * equal(field("age"), 21);
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the equality comparison.
     */
    export function equal(
      expression: Expression,
      value: unknown
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's value is equal to another expression.
     *
     * ```typescript
     * // Check if the 'age' field is equal to the 'limit' field
     * equal("age", field("limit"));
     * ```
     *
     * @param fieldName The name of the field to compare.
     * @param expression The expression to compare the field's value against.
     * @return A new `BooleanExpression` representing the equality comparison.
     */
    export function equal(
      fieldName: string,
      expression: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is equal to a constant value.
     *
     * ```typescript
     * // Check if the 'city' field is equal to string constant "London"
     * equal("city", "London");
     * ```
     *
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the equality comparison.
     */
    export function equal(fieldName: string, value: unknown): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if two expressions are not equal.
     *
     * ```typescript
     * // Check if the 'status' field is not equal to field 'finalState'
     * notEqual(field("status"), field("finalState"));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expression` representing the inequality comparison.
     */
    export function notEqual(
      left: Expression,
      right: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an expression is not equal to a constant value.
     *
     * ```typescript
     * // Check if the 'status' field is not equal to "completed"
     * notEqual(field("status"), "completed");
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the inequality comparison.
     */
    export function notEqual(
      expression: Expression,
      value: unknown
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's value is not equal to an expression.
     *
     * ```typescript
     * // Check if the 'status' field is not equal to the value of 'expectedStatus'
     * notEqual("status", field("expectedStatus"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param expression The expression to compare to.
     * @return A new {@link BooleanExpression} representing the inequality comparison.
     */
    export function notEqual(
      fieldName: string,
      expression: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is not equal to a constant value.
     *
     * ```typescript
     * // Check if the 'country' field is not equal to "USA"
     * notEqual("country", "USA");
     * ```
     *
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the inequality comparison.
     */
    export function notEqual(
      fieldName: string,
      value: unknown
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if the first expression is less than the second expression.
     *
     * ```typescript
     * // Check if the 'age' field is less than 30
     * lessThan(field("age"), field("limit"));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expression` representing the less than comparison.
     */
    export function lessThan(
      left: Expression,
      right: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an expression is less than a constant value.
     *
     * ```typescript
     * // Check if the 'age' field is less than 30
     * lessThan(field("age"), 30);
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the less than comparison.
     */
    export function lessThan(
      expression: Expression,
      value: unknown
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's value is less than an expression.
     *
     * ```typescript
     * // Check if the 'age' field is less than the 'limit' field
     * lessThan("age", field("limit"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param expression The expression to compare to.
     * @return A new `BooleanExpression` representing the less than comparison.
     */
    export function lessThan(
      fieldName: string,
      expression: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is less than a constant value.
     *
     * ```typescript
     * // Check if the 'price' field is less than 50
     * lessThan("price", 50);
     * ```
     *
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the less than comparison.
     */
    export function lessThan(
      fieldName: string,
      value: unknown
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if the first expression is less than or equal to the second
     * expression.
     *
     * ```typescript
     * // Check if the 'quantity' field is less than or equal to 20
     * lessThanOrEqual(field("quantity"), field("limit"));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expression` representing the less than or equal to comparison.
     */
    export function lessThanOrEqual(
      left: Expression,
      right: Expression
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a given expression's value is less than or equal to a constant value.
     *
     * ```typescript
     * // Check if the 'quantity' field is less than or equal to 20
     * lessThanOrEqual(field("quantity"), 20);
     * ```
     *
     * @param expression The {@link Expression} to compare.
     * @param value The constant value to compare against.
     * @return A new {@link BooleanExpression} representing the less than or equal to comparison.
     */
    export function lessThanOrEqual(
      expression: Expression,
      value: unknown
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's value is less than or equal to another expression.
     *
     * ```typescript
     * // Check if the 'quantity' field is less than or equal to the 'limit' field
     * lessThanOrEqual("quantity", field("limit"));
     * ```
     *
     * @param fieldName The name of the field whose value will be compared.
     * @param expression The expression to compare against the field's value.
     * @return A new {@link BooleanExpression} representing the less than or equal to comparison.
     */
    export function lessThanOrEqual(
      fieldName: string,
      expression: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is less than or equal to a constant value.
     *
     * ```typescript
     * // Check if the 'score' field is less than or equal to 70
     * lessThanOrEqual("score", 70);
     * ```
     *
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the less than or equal to comparison.
     */
    export function lessThanOrEqual(
      fieldName: string,
      value: unknown
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if the first expression is greater than the second
     * expression.
     *
     * ```typescript
     * // Check if the 'age' field is greater than 18
     * greaterThan(field("age"), constant(9).add(9));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expression` representing the greater than comparison.
     */
    export function greaterThan(
      left: Expression,
      right: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an expression is greater than a constant value.
     *
     * ```typescript
     * // Check if the 'age' field is greater than 18
     * greaterThan(field("age"), 18);
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the greater than comparison.
     */
    export function greaterThan(
      expression: Expression,
      value: unknown
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's value is greater than another expression.
     *
     * ```typescript
     * // Check if the value of field 'age' is greater than the value of field 'limit'
     * greaterThan("age", field("limit"));
     * ```
     *
     * @param fieldName The name of the field to compare.
     * @param expression The expression to compare against.
     * @return A new {@link BooleanExpression} representing the greater than comparison.
     */
    export function greaterThan(
      fieldName: string,
      expression: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is greater than a constant value.
     *
     * ```typescript
     * // Check if the 'price' field is greater than 100
     * greaterThan("price", 100);
     * ```
     *
     * @param fieldName The name of the field to compare.
     * @param value The constant value to compare to.
     * @return A new {@link BooleanExpression} representing the greater than comparison.
     */
    export function greaterThan(
      fieldName: string,
      value: unknown
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if the first expression is greater than or equal to the
     * second expression.
     *
     * ```typescript
     * // Check if the 'quantity' field is greater than or equal to the field "threshold"
     * greaterThanOrEqual(field("quantity"), field("threshold"));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expression` representing the greater than or equal to comparison.
     */
    export function greaterThanOrEqual(
      left: Expression,
      right: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an expression is greater than or equal to a constant
     * value.
     *
     * ```typescript
     * // Check if the 'quantity' field is greater than or equal to 10
     * greaterThanOrEqual(field("quantity"), 10);
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the greater than or equal to comparison.
     */
    export function greaterThanOrEqual(
      expression: Expression,
      value: unknown
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is greater than or equal to an expression.
     *
     * ```typescript
     * // Check if the value of field 'age' is greater than or equal to the value of field 'limit'
     * greaterThanOrEqual("age", field("limit"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param value The expression to compare to.
     * @return A new `Expression` representing the greater than or equal to comparison.
     */
    export function greaterThanOrEqual(
      fieldName: string,
      value: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is greater than or equal to a constant
     * value.
     *
     * ```typescript
     * // Check if the 'score' field is greater than or equal to 80
     * greaterThanOrEqual("score", 80);
     * ```
     *
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expression` representing the greater than or equal to comparison.
     */
    export function greaterThanOrEqual(
      fieldName: string,
      value: unknown
    ): BooleanExpression;

    /**
     * @beta
     *
     * Creates an expression that concatenates an array expression with other arrays.
     *
     * ```typescript
     * // Combine the 'items' array with two new item arrays
     * arrayConcat(field("items"), [field("newItems"), field("otherItems")]);
     * ```
     *
     * @param firstArray The first array expression to concatenate to.
     * @param secondArray The second array expression or array literal to concatenate to.
     * @param otherArrays Optional additional array expressions or array literals to concatenate.
     * @return A new {@code Expr} representing the concatenated array.
     */
    export function arrayConcat(
      firstArray: Expression,
      secondArray: Expression | unknown[],
      ...otherArrays: Array<Expression | unknown[]>
    ): FunctionExpression;

    /**
     * @beta
     *
     * Creates an expression that concatenates a field's array value with other arrays.
     *
     * ```typescript
     * // Combine the 'items' array with two new item arrays
     * arrayConcat("items", [field("newItems"), field("otherItems")]);
     * ```
     *
     * @param firstArrayField The first array to concatenate to.
     * @param secondArray The second array expression or array literal to concatenate to.
     * @param otherArrays Optional additional array expressions or array literals to concatenate.
     * @return A new {@code Expr} representing the concatenated array.
     */
    export function arrayConcat(
      firstArrayField: string,
      secondArray: Expression | unknown[],
      ...otherArrays: Array<Expression | unknown[]>
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that checks if an array expression contains a specific element.
     *
     * ```typescript
     * // Check if the 'colors' array contains the value of field 'selectedColor'
     * arrayContains(field("colors"), field("selectedColor"));
     * ```
     *
     * @param array The array expression to check.
     * @param element The element to search for in the array.
     * @return A new {@code Expression} representing the 'array_contains' comparison.
     */
    export function arrayContains(
      array: Expression,
      element: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that checks if an array expression contains a specific element.
     *
     * ```typescript
     * // Check if the 'colors' array contains "red"
     * arrayContains(field("colors"), "red");
     * ```
     *
     * @param array The array expression to check.
     * @param element The element to search for in the array.
     * @return A new {@code Expression} representing the 'array_contains' comparison.
     */
    export function arrayContains(
      array: Expression,
      element: unknown
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's array value contains a specific element.
     *
     * ```typescript
     * // Check if the 'colors' array contains the value of field 'selectedColor'
     * arrayContains("colors", field("selectedColor"));
     * ```
     *
     * @param fieldName The field name to check.
     * @param element The element to search for in the array.
     * @return A new {@code Expression} representing the 'array_contains' comparison.
     */
    export function arrayContains(
      fieldName: string,
      element: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's array value contains a specific value.
     *
     * ```typescript
     * // Check if the 'colors' array contains "red"
     * arrayContains("colors", "red");
     * ```
     *
     * @param fieldName The field name to check.
     * @param element The element to search for in the array.
     * @return A new {@code Expression} representing the 'array_contains' comparison.
     */
    export function arrayContains(
      fieldName: string,
      element: unknown
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an array expression contains any of the specified
     * elements.
     *
     * ```typescript
     * // Check if the 'categories' array contains either values from field "cate1" or "Science"
     * arrayContainsAny(field("categories"), [field("cate1"), "Science"]);
     * ```
     *
     * @param array The array expression to check.
     * @param values The elements to check for in the array.
     * @return A new {@code Expression} representing the 'array_contains_any' comparison.
     */
    export function arrayContainsAny(
      array: Expression,
      values: Array<Expression | unknown>
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's array value contains any of the specified
     * elements.
     *
     * ```typescript
     * // Check if the 'groups' array contains either the value from the 'userGroup' field
     * // or the value "guest"
     * arrayContainsAny("categories", [field("cate1"), "Science"]);
     * ```
     *
     * @param fieldName The field name to check.
     * @param values The elements to check for in the array.
     * @return A new {@code Expression} representing the 'array_contains_any' comparison.
     */
    export function arrayContainsAny(
      fieldName: string,
      values: Array<Expression | unknown>
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an array expression contains any of the specified
     * elements.
     *
     * ```typescript
     * // Check if the 'categories' array contains either values from field "cate1" or "Science"
     * arrayContainsAny(field("categories"), array([field("cate1"), "Science"]));
     * ```
     *
     * @param array The array expression to check.
     * @param values An expression that evaluates to an array, whose elements to check for in the array.
     * @return A new {@code Expression} representing the 'array_contains_any' comparison.
     */
    export function arrayContainsAny(
      array: Expression,
      values: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's array value contains any of the specified
     * elements.
     *
     * ```typescript
     * // Check if the 'groups' array contains either the value from the 'userGroup' field
     * // or the value "guest"
     * arrayContainsAny("categories", array([field("cate1"), "Science"]));
     * ```
     *
     * @param fieldName The field name to check.
     * @param values An expression that evaluates to an array, whose elements to check for in the array field.
     * @return A new {@code Expression} representing the 'array_contains_any' comparison.
     */
    export function arrayContainsAny(
      fieldName: string,
      values: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an array expression contains all the specified elements.
     *
     * ```typescript
     * // Check if the "tags" array contains all of the values: "SciFi", "Adventure", and the value from field "tag1"
     * arrayContainsAll(field("tags"), [field("tag1"), constant("SciFi"), "Adventure"]);
     * ```
     *
     * @param array The array expression to check.
     * @param values The elements to check for in the array.
     * @return A new {@code Expression} representing the 'array_contains_all' comparison.
     */
    export function arrayContainsAll(
      array: Expression,
      values: Array<Expression | unknown>
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's array value contains all the specified values or
     * expressions.
     *
     * ```typescript
     * // Check if the 'tags' array contains both of the values from field 'tag1', the value "SciFi", and "Adventure"
     * arrayContainsAll("tags", [field("tag1"), "SciFi", "Adventure"]);
     * ```
     *
     * @param fieldName The field name to check.
     * @param values The elements to check for in the array.
     * @return A new {@code Expression} representing the 'array_contains_all' comparison.
     */
    export function arrayContainsAll(
      fieldName: string,
      values: Array<Expression | unknown>
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an array expression contains all the specified elements.
     *
     * The `array` parameter should be an expression that evaluates to an array.
     * The `arrayExpression` parameter should be an expression that evaluates to an array of elements
     * to check for within the `array`.
     *
     * ```typescript
     * // Check if the "tags" array contains all elements from the "requiredTags" field.
     * arrayContainsAll(field("tags"), field("requiredTags"));
     *
     * // Check if the "items" array contains all elements from a constant array.
     * arrayContainsAll(field("items"), constant(["apple", "banana"]));
     * ```
     *
     * @param array An expression evaluating to the array to check.
     * @param arrayExpression An expression evaluating to an array of elements to check for.
     * @return A new {@code BooleanExpression} representing the 'array_contains_all' comparison.
     */
    export function arrayContainsAll(
      array: Expression,
      arrayExpression: Expression
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's array value contains all the elements specified by another expression.
     *
     * ```typescript
     * // Check if the 'tags' array contains all values present in the 'requiredTags' field.
     * arrayContainsAll("tags", field("requiredTags"));
     * ```
     *
     * @param fieldName The name of the array field to check.
     * @param arrayExpression An expression that evaluates to an array of values to check for.
     * @return A new {@code BooleanExpression} representing the 'array_contains_all' comparison.
     */
    export function arrayContainsAll(
      fieldName: string,
      arrayExpression: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that calculates the length of an array in a specified field.
     *
     * ```typescript
     * // Get the number of items in field 'cart'
     * arrayLength('cart');
     * ```
     *
     * @param fieldName The name of the field containing an array to calculate the length of.
     * @return A new {@code Expression} representing the length of the array.
     */
    export function arrayLength(fieldName: string): FunctionExpression;
    /**
     * @beta
     * Creates an expression that calculates the length of an array expression.
     *
     * ```typescript
     * // Get the number of items in the 'cart' array
     * arrayLength(field("cart"));
     * ```
     *
     * @param array The array expression to calculate the length of.
     * @return A new {@code Expression} representing the length of the array.
     */
    export function arrayLength(array: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that checks if an expression, when evaluated, is equal to any of the provided values or
     * expressions.
     *
     * ```typescript
     * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
     * equalAny(field("category"), [constant("Electronics"), field("primaryType")]);
     * ```
     *
     * @param expression The expression whose results to compare.
     * @param values The values to check against.
     * @return A new {@code Expression} representing the 'IN' comparison.
     */
    export function equalAny(
      expression: Expression,
      values: Array<Expression | unknown>
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an expression is equal to any of the provided values.
     *
     * ```typescript
     * // Check if the 'category' field is set to a value in the disabledCategories field
     * equalAny(field("category"), field('disabledCategories'));
     * ```
     *
     * @param expression The expression whose results to compare.
     * @param arrayExpression An expression that evaluates to an array, whose elements to check for equality to the input.
     * @return A new {@code Expression} representing the 'IN' comparison.
     */
    export function equalAny(
      expression: Expression,
      arrayExpression: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is equal to any of the provided values or
     * expressions.
     *
     * ```typescript
     * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
     * equalAny("category", [constant("Electronics"), field("primaryType")]);
     * ```
     *
     * @param fieldName The field to compare.
     * @param values The values to check against.
     * @return A new {@code Expression} representing the 'IN' comparison.
     */
    export function equalAny(
      fieldName: string,
      values: Array<Expression | unknown>
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's value is equal to any of the elements
     * within the array that the provided expression evaluates to.
     *
     * This is equivalent to an 'IN' comparison in Firestore queries.
     *
     * ```typescript
     * // Check if the 'category' field's value is present in the 'allowedCategories' array field.
     * equalAny("category", field("allowedCategories"));
     * ```
     *
     * @param fieldName The name of the field to compare.
     * @param arrayExpression An expression that evaluates to an array. The function checks if the value of `fieldName` is equal to any element within this array.
     * @return A new {@code BooleanExpression} representing the 'IN' comparison.
     */
    export function equalAny(
      fieldName: string,
      arrayExpression: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if an expression is not equal to any of the provided values
     * or expressions.
     *
     * ```typescript
     * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
     * notEqualAny(field("status"), ["pending", field("rejectedStatus")]);
     * ```
     *
     * @param element The expression to compare.
     * @param values The values to check against.
     * @return A new {@code Expression} representing the 'NOT IN' comparison.
     */
    export function notEqualAny(
      element: Expression,
      values: Array<Expression | unknown>
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is not equal to any of the provided values
     * or expressions.
     *
     * ```typescript
     * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
     * notEqualAny("status", [constant("pending"), field("rejectedStatus")]);
     * ```
     *
     * @param fieldName The field name to compare.
     * @param values The values to check against.
     * @return A new {@code Expression} representing the 'NOT IN' comparison.
     */
    export function notEqualAny(
      fieldName: string,
      values: Array<Expression | unknown>
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a given element expression is not equal to any of the values
     * contained within an array expression. This is equivalent to a "NOT IN" operation.
     *
     * ```typescript
     * // Check if the 'status' field is not present in the array stored in the 'invalidStatuses' field.
     * notEqualAny(field("status"), field("invalidStatuses"));
     * ```
     *
     * @param element The expression representing the value to check.
     * @param arrayExpression An expression that evaluates to an array of values to check against.
     * @return A new {@code BooleanExpression} representing the 'NOT IN' comparison.
     */
    export function notEqualAny(
      element: Expression,
      arrayExpression: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value is not equal to any of the values in the evaluated expression.
     *
     * ```typescript
     * // Check if the 'status' field is not equal to any value in the field 'rejectedStatuses'
     * notEqualAny("status", field("rejectedStatuses"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param arrayExpression The values to check against.
     * @return A new {@code Expression} representing the 'NOT IN' comparison.
     */
    export function notEqualAny(
      fieldName: string,
      arrayExpression: Expression
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that performs a logical 'XOR' (exclusive OR) operation on two or more Boolean expressions.
     * The result is true if an odd number of the input expressions evaluate to true, and false otherwise.
     *
     * ```typescript
     * // Check if exactly one of the conditions is true: 'age' greater than 18, 'city' is "London",
     * // or 'status' is "active".
     * const condition = xor(
     *     greaterThan("age", 18),
     *     equal("city", "London"),
     *     equal("status", "active")
     * );
     * ```
     *
     * @param first The first Boolean expression.
     * @param second The second Boolean expression.
     * @param additionalConditions Optional: Additional Boolean expressions to include in the XOR operation.
     * @returns A new {@link BooleanExpression} representing the logical 'XOR' operation.
     */
    export function xor(
      first: BooleanExpression,
      second: BooleanExpression,
      ...additionalConditions: BooleanExpression[]
    ): BooleanExpression;
    /**
     * @beta
     * Creates a conditional expression that evaluates to a 'then' expression if a condition is true
     * and an 'else' expression if the condition is false.
     *
     * ```typescript
     * // If 'age' is greater than 18, return "Adult"; otherwise, return "Minor".
     * conditional(
     *     greaterThan("age", 18), constant("Adult"), constant("Minor"));
     * ```
     *
     * @param condition The condition to evaluate.
     * @param thenExpr The expression to evaluate if the condition is true.
     * @param elseExpr The expression to evaluate if the condition is false.
     * @return A new {@code Expression} representing the conditional expression.
     */
    export function conditional(
      condition: BooleanExpression,
      thenExpr: Expression,
      elseExpr: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that negates a filter condition.
     *
     * ```typescript
     * // Find documents where the 'completed' field is NOT true
     * not(equal("completed", true));
     * ```
     *
     * @param booleanExpr The filter condition to negate.
     * @return A new {@code Expression} representing the negated filter condition.
     */
    export function not(booleanExpr: BooleanExpression): BooleanExpression;
    /**
     * @beta
     * Creates an expression that returns the largest value between multiple input
     * expressions or literal values. Based on Firestore's value type ordering.
     *
     * ```typescript
     * // Returns the largest value between the 'field1' field, the 'field2' field,
     * // and 1000
     * logicalMaximum(field("field1"), field("field2"), 1000);
     * ```
     *
     * @param first The first operand expression.
     * @param second The second expression or literal.
     * @param others Optional additional expressions or literals.
     * @return A new {@code Expression} representing the logical max operation.
     */
    export function logicalMaximum(
      first: Expression,
      second: Expression | unknown,
      ...others: Array<Expression | unknown>
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns the largest value between multiple input
     * expressions or literal values. Based on Firestore's value type ordering.
     *
     * ```typescript
     * // Returns the largest value between the 'field1' field, the 'field2' field,
     * // and 1000.
     * logicalMaximum("field1", field("field2"), 1000);
     * ```
     *
     * @param fieldName The first operand field name.
     * @param second The second expression or literal.
     * @param others Optional additional expressions or literals.
     * @return A new {@code Expression} representing the logical max operation.
     */
    export function logicalMaximum(
      fieldName: string,
      second: Expression | unknown,
      ...others: Array<Expression | unknown>
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns the smallest value between multiple input
     * expressions and literal values. Based on Firestore's value type ordering.
     *
     * ```typescript
     * // Returns the smallest value between the 'field1' field, the 'field2' field,
     * // and 1000.
     * logicalMinimum(field("field1"), field("field2"), 1000);
     * ```
     *
     * @param first The first operand expression.
     * @param second The second expression or literal.
     * @param others Optional additional expressions or literals.
     * @return A new {@code Expression} representing the logical min operation.
     */
    export function logicalMinimum(
      first: Expression,
      second: Expression | unknown,
      ...others: Array<Expression | unknown>
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns the smallest value between a field's value
     * and other input expressions or literal values.
     * Based on Firestore's value type ordering.
     *
     * ```typescript
     * // Returns the smallest value between the 'field1' field, the 'field2' field,
     * // and 1000.
     * logicalMinimum("field1", field("field2"), 1000);
     * ```
     *
     * @param fieldName The first operand field name.
     * @param second The second expression or literal.
     * @param others Optional additional expressions or literals.
     * @return A new {@code Expression} representing the logical min operation.
     */
    export function logicalMinimum(
      fieldName: string,
      second: Expression | unknown,
      ...others: Array<Expression | unknown>
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that checks if a field exists.
     *
     * ```typescript
     * // Check if the document has a field named "phoneNumber"
     * exists(field("phoneNumber"));
     * ```
     *
     * @param value An expression representing the field to check for existence.
     * @return A new {@code BooleanExpression} representing the 'exists' check.
     */
    export function exists(value: Expression): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field exists.
     *
     * ```typescript
     * // Check if the document has a field named "phoneNumber"
     * exists("phoneNumber");
     * ```
     *
     * @param fieldName The field name to check.
     * @return A new {@code Expression} representing the 'exists' check.
     */
    export function exists(fieldName: string): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if an expression evaluates to 'NaN' (Not a Number).
     *
     * ```typescript
     * // Check if the result of a calculation is NaN
     * isNan(field("value").divide(0));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code Expression} representing the 'isNaN' check.
     */
    export function isNan(value: Expression): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's value evaluates to 'NaN' (Not a Number).
     *
     * ```typescript
     * // Check if the result of a calculation is NaN
     * isNan("value");
     * ```
     *
     * @param fieldName The name of the field to check.
     * @return A new {@code BooleanExpression} representing the 'isNan' check.
     */
    export function isNan(fieldName: string): BooleanExpression;
    /**
     * @beta
     * Creates an expression that reverses a string.
     *
     * ```typescript
     * // Reverse the value of the 'myString' field.
     * reverse(field("myString"));
     * ```
     *
     * @param stringExpression An expression evaluating to a string value, which will be reversed.
     * @return A new {@code Expression} representing the reversed string.
     */
    export function reverse(stringExpression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that reverses a string value in the specified field.
     *
     * ```typescript
     * // Reverse the value of the 'myString' field.
     * reverse("myString");
     * ```
     *
     * @param field The name of the field representing the string to reverse.
     * @return A new {@code Expression} representing the reversed string.
     */
    export function reverse(field: string): FunctionExpression;
    /**
     * @beta
     * Creates an expression that reverses an array.
     *
     * ```typescript
     * // Reverse the value of the 'myArray' field.
     * arrayReverse(field("myArray"));
     * ```
     *
     * @param arrayExpression An expression evaluating to an array value, which will be reversed.
     * @return A new {@code Expression} representing the reversed array.
     */
    export function arrayReverse(
      arrayExpression: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that reverses an array.
     *
     * ```typescript
     * // Reverse the value of the 'myArray' field.
     * arrayReverse("myArray");
     * ```
     *
     * @param fieldName The name of the field to reverse.
     * @return A new {@code Expression} representing the reversed array.
     */
    export function arrayReverse(fieldName: string): FunctionExpression;
    /**
     * @beta
     * Creates an expression that computes the ceiling of a numeric value.
     *
     * ```typescript
     * // Compute the ceiling of the 'price' field.
     * ceil(field("price"));
     * ```
     *
     * @param expression An expression evaluating to a numeric value, which the ceiling will be computed for.
     * @return A new {@code Expression} representing the ceiling of the numeric value.
     */
    export function ceil(expression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that computes the ceiling of a numeric value.
     *
     * ```typescript
     * // Compute the ceiling of the 'price' field.
     * ceil("price");
     * ```
     *
     * @param fieldName The name of the field to compute the ceiling of.
     * @return A new {@code Expression} representing the ceiling of the numeric value.
     */
    export function ceil(fieldName: string): FunctionExpression;

    /**
     * @beta
     * Creates an expression that computes `e` (Euler's number) raised to the power of the given expression's result.
     *
     * This function is equivalent to `Math.exp()` in JavaScript.
     *
     * ```typescript
     * // Compute e to the power of 2.
     * exp(constant(2));
     * ```
     *
     * @param expression An expression evaluating to a numeric value, which will be used as the exponent for `e`.
     * @returns A new {@link FunctionExpression} representing `e` raised to the power of the input expression's result.
     */
    export function exp(expression: Expression): FunctionExpression;

    /**
     * @beta
     * Creates an expression that computes 'e' (Euler's number) raised to the power of the specified field's numeric value.
     *
     * ```typescript
     * // Compute 'e' to the power of the 'value' field.
     * exp('value');
     * ```
     *
     * @param fieldName The name of the field whose numeric value will be used as the exponent.
     * @return A new {@code FunctionExpression} representing 'e' raised to the power of the numeric value.
     */
    export function exp(fieldName: string): FunctionExpression;
    /**
     * @beta
     * Creates an aggregation that counts the number of distinct values of an evaluated expression.
     *
     * @param expression The expression to count distinct values of.
     * @return A new `AggregateFunction` representing the 'count_distinct' aggregation.
     */
    export function countDistinct(expression: Expression): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that counts the number of distinct values of a field.
     *
     * @param fieldName The field to count distinct values of.
     * @return A new `AggregateFunction` representing the 'count_distinct' aggregation.
     */
    export function countDistinct(fieldName: string): AggregateFunction;
    /**
     * @beta
     * Creates an expression that calculates the byte length of a string in UTF-8, or just the length of a Blob.
     *
     * ```typescript
     * // Calculate the length of the 'myString' field in bytes.
     * byteLength(field("myString"));
     * ```
     *
     * @param expr The expression representing the string.
     * @return A new {@code Expression} representing the length of the string in bytes.
     */
    export function byteLength(expr: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that calculates the length of a string represented by a field in UTF-8 bytes, or just the length of a Blob.
     *
     * ```typescript
     * // Calculate the length of the 'myString' field in bytes.
     * byteLength("myString");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expression} representing the length of the string in bytes.
     */
    export function byteLength(fieldName: string): FunctionExpression;

    /**
     * @beta
     * Creates an expression that calculates the character length of a string field in UTF8.
     *
     * ```typescript
     * // Get the character length of the 'name' field in UTF-8.
     * charLength("name");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expression} representing the length of the string.
     */
    export function charLength(fieldName: string): FunctionExpression;

    /**
     * @beta
     * Creates an expression that calculates the character length of a string expression in UTF-8.
     *
     * ```typescript
     * // Get the character length of the 'name' field in UTF-8.
     * charLength(field("name"));
     * ```
     *
     * @param stringExpression The expression representing the string to calculate the length of.
     * @return A new {@code Expression} representing the length of the string.
     */
    export function charLength(
      stringExpression: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that performs a case-sensitive wildcard string comparison against a
     * field.
     *
     * ```typescript
     * // Check if the 'title' field contains the string "guide"
     * like("title", "%guide%");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param pattern The pattern to search for. You can use "%" as a wildcard character.
     * @return A new {@code Expression} representing the 'like' comparison.
     */
    export function like(fieldName: string, pattern: string): BooleanExpression;
    /**
     * @beta
     * Creates an expression that performs a case-sensitive wildcard string comparison against a
     * field.
     *
     * ```typescript
     * // Check if the 'title' field contains the string "guide"
     * like("title", field("pattern"));
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param pattern The pattern to search for. You can use "%" as a wildcard character.
     * @return A new {@code Expression} representing the 'like' comparison.
     */
    export function like(
      fieldName: string,
      pattern: Expression
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that performs a case-sensitive wildcard string comparison.
     *
     * ```typescript
     * // Check if the 'title' field contains the string "guide"
     * like(field("title"), "%guide%");
     * ```
     *
     * @param stringExpression The expression representing the string to perform the comparison on.
     * @param pattern The pattern to search for. You can use "%" as a wildcard character.
     * @return A new {@code BooleanExpression} representing the 'like' comparison.
     */
    export function like(
      stringExpression: Expression,
      pattern: string
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that performs a case-sensitive wildcard string comparison.
     *
     * ```typescript
     * // Check if the 'title' field contains the string "guide"
     * like(field("title"), field("pattern"));
     * ```
     *
     * @param stringExpression The expression representing the string to perform the comparison on.
     * @param pattern The pattern to search for. You can use "%" as a wildcard character.
     * @return A new {@code Expression} representing the 'like' comparison.
     */
    export function like(
      stringExpression: Expression,
      pattern: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string field contains a specified regular expression as
     * a substring.
     *
     * ```typescript
     * // Check if the 'description' field contains "example" (case-insensitive)
     * regexContains("description", "(?i)example");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param pattern The regular expression to use for the search.
     * @return A new {@code Expression} representing the 'contains' comparison.
     */
    export function regexContains(
      fieldName: string,
      pattern: string
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string field contains a specified regular expression as
     * a substring.
     *
     * ```typescript
     * // Check if the 'description' field contains "example" (case-insensitive)
     * regexContains("description", field("pattern"));
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param pattern The regular expression to use for the search.
     * @return A new {@code Expression} representing the 'contains' comparison.
     */
    export function regexContains(
      fieldName: string,
      pattern: Expression
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a string expression contains a specified regular
     * expression as a substring.
     *
     * ```typescript
     * // Check if the 'description' field contains "example" (case-insensitive)
     * regexContains(field("description"), "(?i)example");
     * ```
     *
     * @param stringExpression The expression representing the string to perform the regex comparison on.
     * @param pattern The regular expression string to search for within the `stringExpression`.
     * @return A new {@code BooleanExpression} representing the result of the regex contains comparison.
     */
    export function regexContains(
      stringExpression: Expression,
      pattern: string
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a string expression contains a specified regular
     * expression as a substring.
     *
     * ```typescript
     * // Check if the 'description' field contains a pattern from another field.
     * regexContains(field("description"), field("searchPattern"));
     *
     * // Check if the 'productName' field contains "apple" or "orange".
     * regexContains(field("productName"), "apple|orange");
     * ```
     *
     * @param stringExpression The expression representing the string to perform the comparison on.
     * @param pattern The regular expression to use for the search.
     * @return A new {@code BooleanExpression} representing the 'contains' comparison.
     */
    export function regexContains(
      stringExpression: Expression,
      pattern: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string field matches a specified regular expression.
     *
     * ```typescript
     * // Check if the 'email' field matches a valid email pattern
     * regexMatch("email", "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param pattern The regular expression to use for the match.
     * @return A new {@code Expression} representing the regular expression match.
     */
    export function regexMatch(
      fieldName: string,
      pattern: string
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a string field matches a specified regular expression.
     *
     * The `pattern` parameter is an {@link Expression} that evaluates to the regular expression string.
     * This allows for dynamic regex patterns, such as those stored in other fields.
     *
     * ```typescript
     * // Check if the 'email' field matches a regex pattern stored in the 'emailValidationRegex' field.
     * regexMatch("email", field("emailValidationRegex"));
     * ```
     *
     * @param fieldName The name of the field containing the string value to be matched.
     * @param pattern An {@link Expression} that evaluates to the regular expression string to use for the match.
     * @return A new {@link BooleanExpression} representing the result of the regular expression match.
     */
    export function regexMatch(
      fieldName: string,
      pattern: Expression
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a string expression matches a specified regular
     * expression.
     *
     * ```typescript
     * // Check if the 'email' field matches a valid email pattern
     * regexMatch(field("email"), "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
     * ```
     *
     * @param stringExpression An expression that evaluates to the string to match against.
     * @param pattern The regular expression to use for the match.
     * @return A new {@link BooleanExpression} representing the result of the regular expression match.
     */
    export function regexMatch(
      stringExpression: Expression,
      pattern: string
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string expression matches a specified regular
     * expression.
     *
     * ```typescript
     * // Check if the 'email' field matches a valid email pattern
     * regexMatch(field("email"), field("pattern"));
     * ```
     *
     * @param stringExpression The expression representing the string to match against.
     * @param pattern The regular expression to use for the match.
     * @return A new {@code Expression} representing the regular expression match.
     */
    export function regexMatch(
      stringExpression: Expression,
      pattern: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string field contains a specified substring.
     *
     * ```typescript
     * // Check if the 'description' field contains "example".
     * stringContains("description", "example");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param substring The substring to search for.
     * @return A new {@code Expression} representing the 'contains' comparison.
     */
    export function stringContains(
      fieldName: string,
      substring: string
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string field contains a substring specified by an expression.
     *
     * ```typescript
     * // Check if the 'description' field contains the value of the 'keyword' field.
     * stringContains("description", field("keyword"));
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param substring The expression representing the substring to search for.
     * @return A new {@code Expression} representing the 'contains' comparison.
     */
    export function stringContains(
      fieldName: string,
      substring: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string expression contains a specified substring.
     *
     * ```typescript
     * // Check if the 'description' field contains "example".
     * stringContains(field("description"), "example");
     * ```
     *
     * @param stringExpression The expression representing the string to perform the comparison on.
     * @param substring The substring to search for.
     * @return A new {@code Expression} representing the 'contains' comparison.
     */
    export function stringContains(
      stringExpression: Expression,
      substring: string
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string expression contains a substring specified by another expression.
     *
     * ```typescript
     * // Check if the 'description' field contains the value of the 'keyword' field.
     * stringContains(field("description"), field("keyword"));
     * ```
     *
     * @param stringExpression The expression representing the string to perform the comparison on.
     * @param substring The expression representing the substring to search for.
     * @return A new {@code Expression} representing the 'contains' comparison.
     */
    export function stringContains(
      stringExpression: Expression,
      substring: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value starts with a given prefix.
     *
     * ```typescript
     * // Check if the 'name' field starts with "Mr."
     * startsWith("name", "Mr.");
     * ```
     *
     * @param fieldName The field name to check.
     * @param prefix The prefix to check for.
     * @return A new {@code Expression} representing the 'starts with' comparison.
     */
    export function startsWith(
      fieldName: string,
      prefix: string
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value starts with a given prefix.
     *
     * ```typescript
     * // Check if the 'fullName' field starts with the value of the 'firstName' field
     * startsWith("fullName", field("firstName"));
     * ```
     *
     * @param fieldName The field name to check.
     * @param prefix The expression representing the prefix.
     * @return A new {@code Expression} representing the 'starts with' comparison.
     */
    export function startsWith(
      fieldName: string,
      prefix: Expression
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a string value, represented by an expression, starts with a given prefix.
     *
     * ```typescript
     * // Check if the 'name' field starts with "Mr."
     * startsWith(field("name"), "Mr.");
     * ```
     *
     * @param stringExpression An expression that evaluates to a string, which will be checked for the prefix.
     * @param prefix The string prefix to check for.
     * @return A new {@code BooleanExpression} representing the 'starts with' comparison.
     */
    export function startsWith(
      stringExpression: Expression,
      prefix: string
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a string expression starts with a given prefix expression.
     *
     * ```typescript
     * // Check if the 'fullName' field starts with the value of the 'prefix' field.
     * startsWith(field("fullName"), field("prefix"));
     * ```
     *
     * @param stringExpression The string expression to check.
     * @param prefix The prefix expression to check for.
     * @return A new {@code BooleanExpression} representing the 'starts with' comparison.
     */
    export function startsWith(
      stringExpression: Expression,
      prefix: Expression
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that checks if a field's value ends with a given suffix.
     *
     * ```typescript
     * // Check if the 'filename' field ends with ".txt"
     * endsWith("filename", ".txt");
     * ```
     *
     * @param fieldName The field name to check.
     * @param suffix The suffix to check for.
     * @return A new {@link BooleanExpression} representing the 'ends with' comparison.
     */
    export function endsWith(
      fieldName: string,
      suffix: string
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a field's value ends with a given postfix.
     *
     * ```typescript
     * // Check if the 'url' field ends with the value of the 'extension' field
     * endsWith("url", field("extension"));
     * ```
     *
     * @param fieldName The field name to check.
     * @param suffix The expression representing the postfix.
     * @return A new {@code Expression} representing the 'ends with' comparison.
     */
    export function endsWith(
      fieldName: string,
      suffix: Expression
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string expression ends with a given postfix.
     *
     * ```typescript
     * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
     * endsWith(field("fullName"), "Jr.");
     * ```
     *
     * @param stringExpression The expression to check.
     * @param suffix The postfix to check for.
     * @return A new {@code Expression} representing the 'ends with' comparison.
     */
    export function endsWith(
      stringExpression: Expression,
      suffix: string
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that checks if a string expression ends with a given postfix.
     *
     * ```typescript
     * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
     * endsWith(field("fullName"), constant("Jr."));
     * ```
     *
     * @param stringExpression The expression to check.
     * @param suffix The postfix to check for.
     * @return A new {@code Expression} representing the 'ends with' comparison.
     */
    export function endsWith(
      stringExpression: Expression,
      suffix: Expression
    ): BooleanExpression;

    /**
     * @beta
     * Creates an expression that converts a string field to lowercase.
     *
     * ```typescript
     * // Convert the 'name' field to lowercase
     * toLower("name");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expression} representing the lowercase string.
     */
    export function toLower(fieldName: string): FunctionExpression;

    /**
     * @beta
     * Creates an expression that converts a string expression to lowercase.
     *
     * ```typescript
     * // Convert the 'name' field to lowercase
     * toLower(field("name"));
     * ```
     *
     * @param stringExpression The expression representing the string to convert to lowercase.
     * @return A new {@code Expression} representing the lowercase string.
     */
    export function toLower(stringExpression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that converts a string field to uppercase.
     *
     * ```typescript
     * // Convert the 'title' field to uppercase
     * toUpper("title");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expression} representing the uppercase string.
     */
    export function toUpper(fieldName: string): FunctionExpression;

    /**
     * @beta
     * Creates an expression that converts a string expression to uppercase.
     *
     * ```typescript
     * // Convert the 'title' field to uppercase
     * toUpper(field("title"));
     * ```
     *
     * @param stringExpression The expression representing the string to convert to uppercase.
     * @return A new {@code FunctionExpression} representing the uppercase string.
     */
    export function toUpper(stringExpression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that removes leading and trailing whitespace from a string field.
     *
     * ```typescript
     * // Trim whitespace from the 'userInput' field
     * trim("userInput");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expression} representing the trimmed string.
     */
    export function trim(fieldName: string): FunctionExpression;
    /**
     * @beta
     * Creates an expression that removes leading and trailing whitespace from a string expression.
     *
     * ```typescript
     * // Trim whitespace from the 'userInput' field
     * trim(field("userInput"));
     * ```
     *
     * @param stringExpression The expression representing the string to trim.
     * @return A new {@code Expression} representing the trimmed string.
     */
    export function trim(stringExpression: Expression): FunctionExpression;

    /**
     * @beta
     * Creates an expression that concatenates multiple string values, which can be field names or other expressions that evaluate to strings, along with string literals.
     *
     * ```typescript
     * // Combine the 'firstName' field, a space, and the 'lastName' field into a single string.
     * stringConcat("firstName", " ", field("lastName"));
     * ```
     *
     * @param fieldName The name of the field to use as the initial string value for concatenation.
     * @param secondString An expression or string literal to concatenate.
     * @param otherStrings Optional additional expressions or literals (typically strings) to concatenate.
     * @return A new {@code FunctionExpression} representing the concatenated string.
     */
    export function stringConcat(
      fieldName: string,
      secondString: Expression | string,
      ...otherStrings: Array<Expression | string>
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that concatenates string expressions together.
     *
     * ```typescript
     * // Combine the 'firstName', " ", and 'lastName' fields into a single string
     * stringConcat(field("firstName"), " ", field("lastName"));
     * ```
     *
     * @param firstString The initial string expression to concatenate to.
     * @param secondString An expression or string literal to concatenate.
     * @param otherStrings Optional additional expressions or literals (typically strings) to concatenate.
     * @return A new {@code Expression} representing the concatenated string.
     */
    export function stringConcat(
      firstString: Expression,
      secondString: Expression | string,
      ...otherStrings: Array<Expression | string>
    ): FunctionExpression;
    /**
     * @beta
     * Accesses a value from a map (object) field using the provided key.
     *
     * ```typescript
     * // Get the 'city' value from the 'address' map field
     * mapGet("address", "city");
     * ```
     *
     * @param fieldName The field name of the map field.
     * @param subField The key to access in the map.
     * @return A new {@code Expression} representing the value associated with the given key in the map.
     */
    export function mapGet(
      fieldName: string,
      subField: string
    ): FunctionExpression;
    /**
     * @beta
     * Accesses a value from a map (object) expression using the provided key.
     *
     * ```typescript
     * // Get the 'city' value from the 'address' map field
     * mapGet(field("address"), "city");
     * ```
     *
     * @param mapExpression The expression representing the map.
     * @param subField The key to access in the map.
     * @return A new {@code Expression} representing the value associated with the given key in the map.
     */
    export function mapGet(
      mapExpression: Expression,
      subField: string
    ): FunctionExpression;
    /**
     * @beta
     * Creates an aggregation that counts the total number of stage inputs.
     *
     * ```typescript
     * // Count the total number of input documents
     * countAll().as("totalDocument");
     * ```
     *
     * @return A new {@code AggregateFunction} representing the 'countAll' aggregation.
     */
    export function countAll(): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
     * provided expression.
     *
     * ```typescript
     * // Count the number of items where the price is greater than 10
     * count(field("price").greaterThan(10)).as("expensiveItemCount");
     * ```
     *
     * @param expression The expression to count.
     * @return A new {@code AggregateFunction} representing the 'count' aggregation.
     */
    export function count(expression: Expression): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that counts the number of stage inputs where the input field exists.
     *
     * ```typescript
     * // Count the total number of products
     * count("productId").as("totalProducts");
     * ```
     *
     * @param fieldName The name of the field to count.
     * @return A new {@code AggregateFunction} representing the 'count' aggregation.
     */
    export function count(fieldName: string): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that calculates the sum of values from an expression across multiple
     * stage inputs.
     *
     * ```typescript
     * // Calculate the total revenue from a set of orders
     * sum(field("orderAmount")).as("totalRevenue");
     * ```
     *
     * @param expression The expression to sum up.
     * @return A new {@code AggregateFunction} representing the 'sum' aggregation.
     */
    export function sum(expression: Expression): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that calculates the sum of a field's values across multiple stage
     * inputs.
     *
     * ```typescript
     * // Calculate the total revenue from a set of orders
     * sum("orderAmount").as("totalRevenue");
     * ```
     *
     * @param fieldName The name of the field containing numeric values to sum up.
     * @return A new {@code AggregateFunction} representing the 'sum' aggregation.
     */
    export function sum(fieldName: string): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that calculates the average (mean) of values from an expression across
     * multiple stage inputs.
     *
     * ```typescript
     * // Calculate the average age of users
     * average(field("age")).as("averageAge");
     * ```
     *
     * @param expression The expression representing the values to average.
     * @return A new {@code AggregateFunction} representing the 'average' aggregation.
     */
    export function average(expression: Expression): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that calculates the average (mean) of a field's values across multiple
     * stage inputs.
     *
     * ```typescript
     * // Calculate the average age of users
     * average("age").as("averageAge");
     * ```
     *
     * @param fieldName The name of the field containing numeric values to average.
     * @return A new {@code AggregateFunction} representing the 'average' aggregation.
     */
    export function average(fieldName: string): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that finds the minimum value of an expression across multiple stage
     * inputs.
     *
     * ```typescript
     * // Find the lowest price of all products
     * minimum(field("price")).as("lowestPrice");
     * ```
     *
     * @param expression The expression to find the minimum value of.
     * @return A new {@code AggregateFunction} representing the 'min' aggregation.
     */
    export function minimum(expression: Expression): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that finds the minimum value of a field across multiple stage inputs.
     *
     * ```typescript
     * // Find the lowest price of all products
     * minimum("price").as("lowestPrice");
     * ```
     *
     * @param fieldName The name of the field to find the minimum value of.
     * @return A new {@code AggregateFunction} representing the 'min' aggregation.
     */
    export function minimum(fieldName: string): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that finds the maximum value of an expression across multiple stage
     * inputs.
     *
     * ```typescript
     * // Find the highest score in a leaderboard
     * maximum(field("score")).as("highestScore");
     * ```
     *
     * @param expression The expression to find the maximum value of.
     * @return A new {@code AggregateFunction} representing the 'max' aggregation.
     */
    export function maximum(expression: Expression): AggregateFunction;
    /**
     * @beta
     * Creates an aggregation that finds the maximum value of a field across multiple stage inputs.
     *
     * ```typescript
     * // Find the highest score in a leaderboard
     * maximum("score").as("highestScore");
     * ```
     *
     * @param fieldName The name of the field to find the maximum value of.
     * @return A new {@code AggregateFunction} representing the 'max' aggregation.
     */
    export function maximum(fieldName: string): AggregateFunction;
    /**
     * @beta
     * Calculates the Cosine distance between a field's vector value and a literal vector value.
     *
     * ```typescript
     * // Calculate the Cosine distance between the 'location' field and a target location
     * cosineDistance("location", [37.7749, -122.4194]);
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vector The other vector (as an array of doubles) or {@link VectorValue} to compare against.
     * @return A new {@code Expression} representing the Cosine distance between the two vectors.
     */
    export function cosineDistance(
      fieldName: string,
      vector: number[] | VectorValue
    ): FunctionExpression;
    /**
     * @beta
     * Calculates the Cosine distance between a field's vector value and a vector expression.
     *
     * ```typescript
     * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
     * cosineDistance("userVector", field("itemVector"));
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vectorExpression The other vector (represented as an Expression) to compare against.
     * @return A new {@code Expression} representing the cosine distance between the two vectors.
     */
    export function cosineDistance(
      fieldName: string,
      vectorExpression: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that computes the cosine distance between two vectors.
     *
     * The second argument can be either a vector literal (an array of numbers) or another vector expression.
     *
     * ```typescript
     * // Calculate the cosine distance between the 'location' field and a target location literal.
     * cosineDistance(field("location"), [37.7749, -122.4194]);
     * ```
     *
     * ```typescript
     * // Calculate the cosine distance between two vector fields.
     * cosineDistance(field("vector1"), field("vector2"));
     * ```
     *
     * @param vectorExpression The first vector, represented as an {@link Expression} (e.g., a field path).
     * @param vector The second vector, which can be either a numeric array literal (`number[]`) or another {@link Expression}.
     * @return A new {@link FunctionExpression} representing the cosine distance.
     */
    export function cosineDistance(
      vectorExpression: Expression,
      vector: number[] | Expression
    ): FunctionExpression;
    /**
     * @beta
     * Calculates the Cosine distance between two vector expressions.
     *
     * ```typescript
     * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
     * cosineDistance(field("userVector"), field("itemVector"));
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expression) to compare against.
     * @param otherVectorExpression The other vector (represented as an Expression) to compare against.
     * @return A new {@code Expression} representing the cosine distance between the two vectors.
     */
    export function cosineDistance(
      vectorExpression: Expression,
      otherVectorExpression: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Calculates the dot product between a field's vector value and a double array.
     *
     * ```typescript
     * // Calculate the dot product distance between a feature vector and a target vector
     * dotProduct("features", [0.5, 0.8, 0.2]);
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vector The other vector (as an array of doubles or VectorValue) to calculate with.
     * @return A new {@code Expression} representing the dot product between the two vectors.
     */
    export function dotProduct(
      fieldName: string,
      vector: number[] | VectorValue
    ): FunctionExpression;

    /**
     * @beta
     * Calculates the dot product between a field's vector value and a vector expression.
     *
     * ```typescript
     * // Calculate the dot product of 'docVector1' with 'docVector2'
     * dotProduct("docVector1", field("docVector2"));
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vectorExpression The other vector (represented as an Expression) to calculate with.
     * @return A new {@code Expression} representing the dot product between the two vectors.
     */
    export function dotProduct(
      fieldName: string,
      vectorExpression: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Calculates the dot product between a vector expression and another vector (either a number array or a VectorValue).
     *
     * ```typescript
     * // Calculate the dot product between a feature vector and a target vector
     * dotProduct(field("features"), [0.5, 0.8, 0.2]);
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expression) to calculate with.
     * @param vector The other vector (as an array of numbers or VectorValue) to calculate with.
     * @return A new {@code Expression} representing the dot product between the two vectors.
     */
    export function dotProduct(
      vectorExpression: Expression,
      vector: number[] | VectorValue
    ): FunctionExpression;
    /**
     * @beta
     * Calculates the dot product between two vector expressions.
     *
     * ```typescript
     * // Calculate the dot product between two document vectors: 'docVector1' and 'docVector2'
     * dotProduct(field("docVector1"), field("docVector2"));
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expression) to calculate with.
     * @param otherVectorExpression The other vector (represented as an Expression) to calculate with.
     * @return A new {@code Expression} representing the dot product between the two vectors.
     */
    export function dotProduct(
      vectorExpression: Expression,
      otherVectorExpression: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Calculates the Euclidean distance between a field's vector value and another vector.
     * The other vector can be provided as a double array or a {@link VectorValue}.
     *
     * ```typescript
     * // Calculate the Euclidean distance between the 'location' field and a target location
     * euclideanDistance("location", [37.7749, -122.4194]);
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vector The other vector (as an array of doubles or VectorValue) to compare against.
     * @return A new {@code Expression} representing the Euclidean distance between the two vectors.
     */
    export function euclideanDistance(
      fieldName: string,
      vector: number[] | VectorValue
    ): FunctionExpression;
    /**
     * @beta
     * Calculates the Euclidean distance between a field's vector value and a vector expression.
     *
     * ```typescript
     * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
     * euclideanDistance("pointA", field("pointB"));
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vectorExpression The other vector (represented as an Expression) to compare against.
     * @return A new {@code Expression} representing the Euclidean distance between the two vectors.
     */
    export function euclideanDistance(
      fieldName: string,
      vectorExpression: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Calculates the Euclidean distance between a vector expression and a double array.
     *
     * ```typescript
     * // Calculate the Euclidean distance between the 'location' field and a target location
     *
     * euclideanDistance(field("location"), [37.7749, -122.4194]);
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expression) to compare against.
     * @param vector The other vector (as an array of doubles or VectorValue) to compare against.
     * @return A new {@code Expression} representing the Euclidean distance between the two vectors.
     */
    export function euclideanDistance(
      vectorExpression: Expression,
      vector: number[] | VectorValue
    ): FunctionExpression;
    /**
     * @beta
     * Calculates the Euclidean distance between two vector expressions.
     *
     * ```typescript
     * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
     * euclideanDistance(field("pointA"), field("pointB"));
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expression) to compare against.
     * @param otherVectorExpression The other vector (represented as an Expression) to compare against.
     * @return A new {@code Expression} representing the Euclidean distance between the two vectors.
     */
    export function euclideanDistance(
      vectorExpression: Expression,
      otherVectorExpression: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that calculates the length of a Firestore Vector.
     *
     * ```typescript
     * // Get the vector length (dimension) of the field 'embedding'.
     * vectorLength(field("embedding"));
     * ```
     *
     * @param vectorExpression The expression representing the Firestore Vector.
     * @return A new {@code Expression} representing the length of the array.
     */
    export function vectorLength(
      vectorExpression: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that calculates the length (dimension) of a Firestore Vector represented by a field.
     *
     * ```typescript
     * // Get the vector length (dimension) of the field 'embedding'.
     * vectorLength("embedding");
     * ```
     *
     * @param fieldName The name of the field representing the Firestore Vector.
     * @return A new {@code FunctionExpression} representing the length (dimension) of the vector.
     */
    export function vectorLength(fieldName: string): FunctionExpression;
    /**
     * @beta
     * Creates an expression that interprets an expression as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'microseconds' field as microseconds since epoch.
     * unixMicrosToTimestamp(field("microseconds"));
     * ```
     *
     * @param expr The expression representing the number of microseconds since epoch.
     * @return A new {@code Expression} representing the timestamp.
     */
    export function unixMicrosToTimestamp(expr: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that interprets a field's value as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'microseconds' field as microseconds since epoch.
     * unixMicrosToTimestamp("microseconds");
     * ```
     *
     * @param fieldName The name of the field representing the number of microseconds since epoch.
     * @return A new {@code Expression} representing the timestamp.
     */
    export function unixMicrosToTimestamp(
      fieldName: string
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that converts a timestamp expression to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to microseconds since epoch.
     * timestampToUnixMicros(field("timestamp"));
     * ```
     *
     * @param expr The expression representing the timestamp.
     * @return A new {@code Expression} representing the number of microseconds since epoch.
     */
    export function timestampToUnixMicros(expr: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that converts a timestamp field to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to microseconds since epoch.
     * timestampToUnixMicros("timestamp");
     * ```
     *
     * @param fieldName The name of the field representing the timestamp.
     * @return A new {@code Expression} representing the number of microseconds since epoch.
     */
    export function timestampToUnixMicros(
      fieldName: string
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that interprets an expression as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'milliseconds' field as milliseconds since epoch.
     * unixMillisToTimestamp(field("milliseconds"));
     * ```
     *
     * @param expr The expression representing the number of milliseconds since epoch.
     * @return A new {@code Expression} representing the timestamp.
     */
    export function unixMillisToTimestamp(expr: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that interprets a field's value as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'milliseconds' field as milliseconds since epoch.
     * unixMillisToTimestamp("milliseconds");
     * ```
     *
     * @param fieldName The name of the field representing the number of milliseconds since epoch.
     * @return A new {@code Expression} representing the timestamp.
     */
    export function unixMillisToTimestamp(
      fieldName: string
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that converts a timestamp expression to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to milliseconds since epoch.
     * timestampToUnixMillis(field("timestamp"));
     * ```
     *
     * @param expr The expression representing the timestamp.
     * @return A new {@code Expression} representing the number of milliseconds since epoch.
     */
    export function timestampToUnixMillis(expr: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that converts a timestamp field to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to milliseconds since epoch.
     * timestampToUnixMillis("timestamp");
     * ```
     *
     * @param fieldName The name of the field representing the timestamp.
     * @return A new {@code Expression} representing the number of milliseconds since epoch.
     */
    export function timestampToUnixMillis(
      fieldName: string
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that interprets an expression as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'seconds' field as seconds since epoch.
     * unixSecondsToTimestamp(field("seconds"));
     * ```
     *
     * @param expr The expression representing the number of seconds since epoch.
     * @return A new {@code Expression} representing the timestamp.
     */
    export function unixSecondsToTimestamp(
      expr: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that interprets a field's value as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'seconds' field as seconds since epoch.
     * unixSecondsToTimestamp("seconds");
     * ```
     *
     * @param fieldName The name of the field representing the number of seconds since epoch.
     * @return A new {@code Expression} representing the timestamp.
     */
    export function unixSecondsToTimestamp(
      fieldName: string
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that converts a timestamp expression to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to seconds since epoch.
     * timestampToUnixSeconds(field("timestamp"));
     * ```
     *
     * @param expr The expression representing the timestamp.
     * @return A new {@code Expression} representing the number of seconds since epoch.
     */
    export function timestampToUnixSeconds(
      expr: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that converts a timestamp field to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to seconds since epoch.
     * timestampToUnixSeconds("timestamp");
     * ```
     *
     * @param fieldName The name of the field representing the timestamp.
     * @return A new {@code Expression} representing the number of seconds since epoch.
     */
    export function timestampToUnixSeconds(
      fieldName: string
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that adds a specified amount of time to a timestamp.
     *
     * ```typescript
     * // Add some duration determined by field 'unit' and 'amount' to the 'timestamp' field.
     * timestampAdd(field("timestamp"), field("unit"), field("amount"));
     * ```
     *
     * @param timestamp The expression representing the timestamp.
     * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
     * @param amount The expression evaluates to amount of the unit.
     * @return A new {@code Expression} representing the resulting timestamp.
     */
    export function timestampAdd(
      timestamp: Expression,
      unit: Expression,
      amount: Expression
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that adds a specified amount of time to a timestamp.
     *
     * ```typescript
     * // Add 1 day to the 'timestamp' field.
     * timestampAdd(field("timestamp"), "day", 1);
     * ```
     *
     * @param timestamp The expression representing the timestamp.
     * @param unit The unit of time to add: 'microsecond', 'millisecond', 'second', 'minute', 'hour', or 'day'.
     * @param amount The amount of time to add.
     * @return A new {@code Expression} representing the resulting timestamp.
     */
    export function timestampAdd(
      timestamp: Expression,
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that adds a specified amount of time to a timestamp represented by a field.
     *
     * ```typescript
     * // Add 1 day to the 'timestamp' field.
     * timestampAdd("timestamp", "day", 1);
     * ```
     *
     * @param fieldName The name of the field representing the timestamp.
     * @param unit The unit of time to add (e.g., "day", "hour").
     * @param amount The amount of time to add.
     * @return A new {@code Expression} representing the resulting timestamp.
     */
    export function timestampAdd(
      fieldName: string,
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that subtracts a specified amount of time from a timestamp.
     *
     * ```typescript
     * // Subtract some duration determined by field 'unit' and 'amount' from the 'timestamp' field.
     * timestampSubtract(field("timestamp"), field("unit"), field("amount"));
     * ```
     *
     * @param timestamp The expression representing the timestamp.
     * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
     * @param amount The expression evaluates to amount of the unit.
     * @return A new {@code Expression} representing the resulting timestamp.
     */
    export function timestampSubtract(
      timestamp: Expression,
      unit: Expression,
      amount: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that subtracts a specified amount of time from a timestamp.
     *
     * ```typescript
     * // Subtract 1 day from the 'timestamp' field.
     * timestampSubtract(field("timestamp"), "day", 1);
     * ```
     *
     * @param timestamp The expression representing the timestamp.
     * @param unit The unit of time to subtract (e.g., "day", "hour").
     * @param amount The amount of time to subtract.
     * @return A new {@code Expression} representing the resulting timestamp.
     */
    export function timestampSubtract(
      timestamp: Expression,
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that subtracts a specified amount of time from a timestamp represented by a field.
     *
     * ```typescript
     * // Subtract 1 day from the 'timestamp' field.
     * timestampSubtract("timestamp", "day", 1);
     * ```
     *
     * @param fieldName The name of the field representing the timestamp.
     * @param unit The unit of time to subtract (e.g., "day", "hour").
     * @param amount The amount of time to subtract.
     * @return A new {@code Expression} representing the resulting timestamp.
     */
    export function timestampSubtract(
      fieldName: string,
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): FunctionExpression;

    /**
     * @beta
     *
     * Creates an expression that evaluates to the current server timestamp.
     *
     * ```typescript
     * // Get the current server timestamp
     * currentTimestamp()
     * ```
     *
     * @return A new Expression representing the current server timestamp.
     */
    export function currentTimestamp(): FunctionExpression;

    /**
     * @beta
     * Creates an expression that raises an error with the given message. This could be useful for
     * debugging purposes.
     *
     * ```typescript
     * // Raise an error with the message "simulating an evaluation error".
     * error("simulating an evaluation error")
     * ```
     *
     * @return A new Expression representing the error() operation.
     */
    export function error(message: string): Expression;

    /**
     * @beta
     * Creates an expression that performs a logical 'AND' operation on multiple filter conditions.
     *
     * ```typescript
     * // Check if the 'age' field is greater than 18 AND the 'city' field is "London" AND
     * // the 'status' field is "active"
     * const condition = and(greaterThan("age", 18), equal("city", "London"), equal("status", "active"));
     * ```
     *
     * @param first The first filter condition.
     * @param second The second filter condition.
     * @param more Additional filter conditions to 'AND' together.
     * @return A new {@code Expression} representing the logical 'AND' operation.
     */
    export function and(
      first: BooleanExpression,
      second: BooleanExpression,
      ...more: BooleanExpression[]
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that performs a logical 'OR' operation on multiple filter conditions.
     *
     * ```typescript
     * // Check if the 'age' field is greater than 18 OR the 'city' field is "London" OR
     * // the 'status' field is "active"
     * const condition = or(greaterThan("age", 18), equal("city", "London"), equal("status", "active"));
     * ```
     *
     * @param first The first filter condition.
     * @param second The second filter condition.
     * @param more Additional filter conditions to 'OR' together.
     * @return A new {@code Expression} representing the logical 'OR' operation.
     */
    export function or(
      first: BooleanExpression,
      second: BooleanExpression,
      ...more: BooleanExpression[]
    ): BooleanExpression;
    /**
     * @beta
     * Creates an expression that returns the value of the base expression raised to the power of the exponent expression.
     *
     * ```typescript
     * // Raise the value of the 'base' field to the power of the 'exponent' field.
     * pow(field("base"), field("exponent"));
     * ```
     *
     * @param base The expression to raise to the power of the exponent.
     * @param exponent The expression to raise the base to the power of.
     * @return A new `Expression` representing the power operation.
     */
    export function pow(
      base: Expression,
      exponent: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns the value of the base expression raised to the power of the exponent.
     *
     * ```typescript
     * // Raise the value of the 'base' field to the power of 2.
     * pow(field("base"), 2);
     * ```
     *
     * @param base The expression to raise to the power of the exponent.
     * @param exponent The constant value to raise the base to the power of.
     * @return A new `Expression` representing the power operation.
     */
    export function pow(base: Expression, exponent: number): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns the value of the base field raised to the power of the exponent expression.
     *
     * ```typescript
     * // Raise the value of the 'base' field to the power of the 'exponent' field.
     * pow("base", field("exponent"));
     * ```
     *
     * @param base The name of the field to raise to the power of the exponent.
     * @param exponent The expression to raise the base to the power of.
     * @return A new `Expression` representing the power operation.
     */
    export function pow(base: string, exponent: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns the value of the base field raised to the power of the exponent.
     *
     * ```typescript
     * // Raise the value of the 'base' field to the power of 2.
     * pow("base", 2);
     * ```
     *
     * @param base The name of the field to raise to the power of the exponent.
     * @param exponent The constant value to raise the base to the power of.
     * @return A new `Expression` representing the power operation.
     */
    export function pow(base: string, exponent: number): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns the collection ID from a path.
     *
     * ```typescript
     * // Get the collection ID from a path.
     * collectionId(field("__name__"));
     * ```
     *
     * @param expression An expression evaluating to a path, which the collection ID will be extracted from.
     * @return A new {@code Expression} representing the collectionId operation.
     */
    export function collectionId(expression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that returns the collection ID from a path.
     *
     * ```typescript
     * // Get the collection ID from a path.
     * collectionId("__name__");
     * ```
     *
     * @param fieldName The name of the field to get the collection ID from.
     * @return A new {@code Expression} representing the collectionId operation.
     */
    export function collectionId(fieldName: string): FunctionExpression;
    /**
     * @beta
     * Creates an expression that calculates the length of a string, array, map, vector, or bytes.
     *
     * ```typescript
     * // Get the length of the 'name' field.
     * length(field("name"));
     *
     * // Get the number of items in the 'cart' array.
     * length(field("cart"));
     * ```
     *
     * @param expression An expression evaluating to a string, array, map, vector, or bytes, which the length will be calculated for.
     * @return A new `Expression` representing the length of the string, array, map, vector, or bytes.
     */
    export function length(expression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that calculates the length of a string, array, map, vector, or bytes.
     *
     * ```typescript
     * // Get the length of the 'name' field.
     * length("name");
     *
     * // Get the number of items in the 'cart' array.
     * length("cart");
     * ```
     *
     * @param fieldName The name of the field to calculate the length of.
     * @return A new `Expression` representing the length of the string, array, map, vector, or bytes.
     */
    export function length(fieldName: string): FunctionExpression;
    /**
     * @beta
     * Creates an expression that reverses a string.
     *
     * ```typescript
     * // Reverse the value of the 'myString' field.
     * stringReverse(field("myString"));
     * ```
     *
     * @param stringExpression An expression evaluating to a string value, which will be reversed.
     * @return A new {@code Expression} representing the reversed string.
     */
    export function stringReverse(
      stringExpression: Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that reverses a string value in the specified field.
     *
     * ```typescript
     * // Reverse the value of the 'myString' field.
     * stringReverse("myString");
     * ```
     *
     * @param field The name of the field representing the string to reverse.
     * @return A new {@code Expression} representing the reversed string.
     */
    export function stringReverse(field: string): FunctionExpression;

    /**
     * @beta
     * Creates an expression that concatenates strings, arrays, or blobs. Types cannot be mixed.
     *
     * ```typescript
     * // Concatenate the 'firstName' and 'lastName' fields with a space in between.
     * concat(field("firstName"), " ", field("lastName"))
     * ```
     *
     * @param first The first expressions to concatenate.
     * @param second The second literal or expression to concatenate.
     * @param others Additional literals or expressions to concatenate.
     * @return A new `Expression` representing the concatenation.
     */
    export function concat(
      first: Expression,
      second: Expression | unknown,
      ...others: Array<Expression | unknown>
    ): FunctionExpression;

    /**
     * @beta
     * Creates an expression that computes the absolute value of a numeric value.
     *
     * @param expr The expression to compute the absolute value of.
     * @return A new {@code Expr} representing the absolute value of the numeric value.
     */
    export function abs(expr: Expression): FunctionExpression;

    /**
     * @beta
     * Creates an expression that returns the `elseExpr` argument if `ifExpr` is absent, else return
     * the result of the `ifExpr` argument evaluation.
     *
     * ```typescript
     * // Returns the value of the optional field 'optional_field', or returns 'default_value'
     * // if the field is absent.
     * ifAbsent(field("optional_field"), constant("default_value"))
     * ```
     *
     * @param ifExpr The expression to check for absence.
     * @param elseExpr The expression that will be evaluated and returned if [ifExpr] is absent.
     * @return A new Expression representing the ifAbsent operation.
     */
    export function ifAbsent(
      ifExpr: Expression,
      elseExpr: Expression
    ): Expression;

    /**
     * @beta
     * Creates an expression that returns the `elseValue` argument if `ifExpr` is absent, else
     * return the result of the `ifExpr` argument evaluation.
     *
     * ```typescript
     * // Returns the value of the optional field 'optional_field', or returns 'default_value'
     * // if the field is absent.
     * ifAbsent(field("optional_field"), "default_value")
     * ```
     *
     * @param ifExpr The expression to check for absence.
     * @param elseValue The value that will be returned if `ifExpr` evaluates to an absent value.
     * @return A new [Expression] representing the ifAbsent operation.
     */
    export function ifAbsent(
      ifExpr: Expression,
      elseValue: unknown
    ): Expression;

    /**
     * @beta
     * Creates an expression that returns the `elseExpr` argument if `ifFieldName` is absent, else
     * return the value of the field.
     *
     * ```typescript
     * // Returns the value of the optional field 'optional_field', or returns the value of
     * // 'default_field' if 'optional_field' is absent.
     * ifAbsent("optional_field", field("default_field"))
     * ```
     *
     * @param ifFieldName The field to check for absence.
     * @param elseExpr The expression that will be evaluated and returned if `ifFieldName` is
     * absent.
     * @return A new Expression representing the ifAbsent operation.
     */
    export function ifAbsent(
      ifFieldName: string,
      elseExpr: Expression
    ): Expression;

    /**
     * @beta
     * Creates an expression that joins the elements of an array into a string.
     *
     * ```typescript
     * // Join the elements of the 'tags' field with a comma and space.
     * join("tags", ", ")
     * ```
     *
     * @param arrayFieldName The name of the field containing the array.
     * @param delimiter The string to use as a delimiter.
     * @return A new Expression representing the join operation.
     */
    export function join(arrayFieldName: string, delimiter: string): Expression;

    /**
     * @beta
     * Creates an expression that joins the elements of an array into a string.
     *
     * ```typescript
     * // Join an array of string using the delimiter from the 'separator' field.
     * join(array(['foo', 'bar']), field("separator"))
     * ```
     *
     * @param arrayExpression An expression that evaluates to an array.
     * @param delimiterExpression The expression that evaluates to the delimiter string.
     * @return A new Expression representing the join operation.
     */
    export function join(
      arrayExpression: Expression,
      delimiterExpression: Expression
    ): Expression;

    /**
     * @beta
     * Creates an expression that joins the elements of an array into a string.
     *
     * ```typescript
     * // Join the elements of the 'tags' field with a comma and space.
     * join(field("tags"), ", ")
     * ```
     *
     * @param arrayExpression An expression that evaluates to an array.
     * @param delimiter The string to use as a delimiter.
     * @return A new Expression representing the join operation.
     */
    export function join(
      arrayExpression: Expression,
      delimiter: string
    ): Expression;

    /**
     * @beta
     * Creates an expression that computes the base-10 logarithm of a numeric value.
     *
     * ```typescript
     * // Compute the base-10 logarithm of the 'value' field.
     * log10("value");
     * ```
     *
     * @param fieldName The name of the field to compute the base-10 logarithm of.
     * @return A new `Expr` representing the base-10 logarithm of the numeric value.
     */
    export function log10(fieldName: string): FunctionExpression;

    /**
     * @beta
     * Creates an expression that computes the base-10 logarithm of a numeric value.
     *
     * ```typescript
     * // Compute the base-10 logarithm of the 'value' field.
     * log10(field("value"));
     * ```
     *
     * @param expression An expression evaluating to a numeric value, which the base-10 logarithm will be computed for.
     * @return A new `Expr` representing the base-10 logarithm of the numeric value.
     */
    export function log10(expression: Expression): FunctionExpression;

    /**
     * @beta
     * Creates an expression that computes the sum of the elements in an array.
     *
     * ```typescript
     * // Compute the sum of the elements in the 'scores' field.
     * arraySum("scores");
     * ```
     *
     * @param fieldName The name of the field to compute the sum of.
     * @return A new `Expr` representing the sum of the elements in the array.
     */
    export function arraySum(fieldName: string): FunctionExpression;

    /**
     * @beta
     * Creates an expression that computes the sum of the elements in an array.
     *
     * ```typescript
     * // Compute the sum of the elements in the 'scores' field.
     * arraySum(field("scores"));
     * ```
     *
     * @param expression An expression evaluating to a numeric array, which the sum will be computed for.
     * @return A new `Expr` representing the sum of the elements in the array.
     */
    export function arraySum(expression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that computes the natural logarithm of a numeric value.
     *
     * ```typescript
     * // Compute the natural logarithm of the 'value' field.
     * ln(field("value"));
     * ```
     *
     * @param expression An expression evaluating to a numeric value, which the natural logarithm will be computed for.
     * @return A new {@code Expression} representing the natural logarithm of the numeric value.
     */
    export function ln(expression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that computes the natural logarithm of a numeric value.
     *
     * ```typescript
     * // Compute the natural logarithm of the 'value' field.
     * ln("value");
     * ```
     *
     * @param fieldName The name of the field to compute the natural logarithm of.
     * @return A new {@code Expression} representing the natural logarithm of the numeric value.
     */
    export function ln(fieldName: string): FunctionExpression;
    /**
     * @beta
     * Creates an expression that rounds a numeric value to the nearest whole number.
     *
     * ```typescript
     * // Round the value of the 'price' field.
     * round(field("price"));
     * ```
     *
     * @param expression An expression evaluating to a numeric value, which will be rounded.
     * @return A new `Expression` representing the rounded value.
     */
    export function round(expression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that rounds a numeric value to the nearest whole number.
     *
     * ```typescript
     * // Round the value of the 'price' field.
     * round("price");
     * ```
     *
     * @param fieldName The name of the field to round.
     * @return A new `Expression` representing the rounded value.
     */
    export function round(fieldName: string): FunctionExpression;
    /**
     * Creates an expression that rounds a numeric value to the specified number of decimal places.
     *
     * ```typescript
     * // Round the value of the 'price' field to two decimal places.
     * round("price", 2);
     * ```
     *
     * @param fieldName The name of the field to round.
     * @param decimalPlaces A constant or expression specifying the rounding precision in decimal places.
     * @return A new `Expr` representing the rounded value.
     */
    export function round(
      fieldName: string,
      decimalPlaces: number | Expression
    ): FunctionExpression;

    /**
     * Creates an expression that rounds a numeric value to the specified number of decimal places.
     *
     * ```typescript
     * // Round the value of the 'price' field to two decimal places.
     * round(field("price"), constant(2));
     * ```
     *
     * @param expression An expression evaluating to a numeric value, which will be rounded.
     * @param decimalPlaces A constant or expression specifying the rounding precision in decimal places.
     * @return A new `Expr` representing the rounded value.
     */
    export function round(
      expression: Expression,
      decimalPlaces: number | Expression
    ): FunctionExpression;
    /**
     * @beta
     * Creates an expression that computes the square root of a numeric value.
     *
     * ```typescript
     * // Compute the square root of the 'value' field.
     * sqrt(field("value"));
     * ```
     *
     * @param expression An expression evaluating to a numeric value, which the square root will be computed for.
     * @return A new {@code Expression} representing the square root of the numeric value.
     */
    export function sqrt(expression: Expression): FunctionExpression;
    /**
     * @beta
     * Creates an expression that computes the square root of a numeric value.
     *
     * ```typescript
     * // Compute the square root of the 'value' field.
     * sqrt("value");
     * ```
     *
     * @param fieldName The name of the field to compute the square root of.
     * @return A new {@code Expression} representing the square root of the numeric value.
     */
    export function sqrt(fieldName: string): FunctionExpression;
    // TODO(new-expression): Add new top-level expression function declarations above this line
    /**
     * @beta
     * Creates an {@link Ordering} that sorts documents in ascending order based on an expression.
     *
     * ```typescript
     * // Sort documents by the 'name' field in lowercase in ascending order
     * pipeline().collection("users")
     *   .sort(ascending(field("name").toLower()));
     * ```
     *
     * @param expr The expression to create an ascending ordering for.
     * @return A new `Ordering` for ascending sorting.
     */
    export function ascending(expr: Expression): Ordering;
    /**
     * @beta
     * Creates an {@link Ordering} that sorts documents in ascending order based on a field.
     *
     * ```typescript
     * // Sort documents by the 'name' field in ascending order
     * pipeline().collection("users")
     *   .sort(ascending("name"));
     * ```
     *
     * @param fieldName The field to create an ascending ordering for.
     * @return A new `Ordering` for ascending sorting.
     */
    export function ascending(fieldName: string): Ordering;
    /**
     * @beta
     * Creates an {@link Ordering} that sorts documents in descending order based on an expression.
     *
     * ```typescript
     * // Sort documents by the 'name' field in lowercase in descending order
     * pipeline().collection("users")
     *   .sort(descending(field("name").toLower()));
     * ```
     *
     * @param expr The expression to create a descending ordering for.
     * @return A new `Ordering` for descending sorting.
     */
    export function descending(expr: Expression): Ordering;
    /**
     * @beta
     * Creates an {@link Ordering} that sorts documents in descending order based on a field.
     *
     * ```typescript
     * // Sort documents by the 'name' field in descending order
     * pipeline().collection("users")
     *   .sort(descending("name"));
     * ```
     *
     * @param fieldName The field to create a descending ordering for.
     * @return A new `Ordering` for descending sorting.
     */
    export function descending(fieldName: string): Ordering;
    /**
     * @beta
     * Represents an ordering criterion for sorting documents in a Firestore pipeline.
     *
     * You create `Ordering` instances using the `ascending` and `descending` helper functions.
     */
    export class Ordering {
      readonly expr: Expression;
      readonly direction: 'ascending' | 'descending';
    }

    /**
     * @beta
     * Provides the entry point for defining the data source of a Firestore {@link Pipeline}.
     *
     * Use the methods of this class (e.g., {@link PipelineSource#collection}, {@link PipelineSource#collectionGroup},
     * {@link PipelineSource#database}, or {@link PipelineSource#documents}) to specify the initial data
     * for your pipeline, such as a collection, a collection group, the entire database, or a set of specific documents.
     */
    export class PipelineSource {
      /**
       * @beta
       * Specifies the source for a new pipeline as a Firestore collection.
       * This method allows you to start a data pipeline by defining the collection
       * from which documents will be read.
       *
       * @param collectionPath The path to the collection as a string (e.g., 'users/alovelace/chats')
       *                       or a {@link CollectionReference} object.
       * @returns A new {@link Pipeline} object configured to read from the specified collection.
       *
       * @example
       * ```typescript
       * // Using a string path
       * const pipeline1 = firestore.pipeline().collection('myCollection');
       *
       * // Using a CollectionReference
       * const collectionRef = firestore.collection('anotherCollection');
       * const pipeline2 = firestore.pipeline().collection(collectionRef);
       * ```
       */
      collection(collectionPath: string | CollectionReference): Pipeline;
      /**
       * @beta
       * Returns all documents from the entire collection. The collection can be nested.
       * @param options - Options defining how this CollectionStage is evaluated.
       */
      collection(options: CollectionStageOptions): Pipeline;
      /**
       * @beta
       * Specifies the source as a collection group.
       *
       * @param collectionId The ID of the collection group.
       * @return A new Pipeline object with the collection group as the source.
       */
      collectionGroup(collectionId: string): Pipeline;

      /**
       * @beta
       * Creates a new {@link Pipeline} stage that queries all documents belonging to a collection
       * with the ID specified in the provided `options`, regardless of the document's parent.
       *
       * A collection group query can be used to query collections that have the same ID but
       * are located at different paths.
       *
       * ```typescript
       * // Query all 'cities' collections regardless of their parent document.
       * const citiesPipeline = firestore.collectionGroup({ collectionId: 'cities' });
       * ```
       *
       * @param options Options defining how this CollectionGroupStage is evaluated, including the `collectionId`.
       * @returns A new {@link Pipeline} instance representing the collection group stage.
       */
      collectionGroup(options: CollectionGroupStageOptions): Pipeline;
      /**
       * @beta
       * Specifies the source as a database.
       *
       * @return A new Pipeline object with the database as the source.
       */
      database(): Pipeline;
      /**
       * @beta
       * Returns all documents from the entire database.
       * @param options - Options defining how a DatabaseStage is evaluated.
       */
      database(options: DatabaseStageOptions): Pipeline;
      /**
       * @beta
       * Specifies the source as a set of documents.
       *
       * @param docs The document references.
       * @return A new Pipeline object with the documents as the source.
       */
      documents(docs: Array<string | DocumentReference>): Pipeline;
      /**
       * @beta
       * Set the pipeline's source to the documents specified by the given paths and DocumentReferences.
       *
       * @param options - Options defining how this DocumentsStage is evaluated.
       *
       * @throws {@FirestoreError} Thrown if any of the provided DocumentReferences target a different project or database than the pipeline.
       */
      documents(options: DocumentsStageOptions): Pipeline;
      /**
       * @beta
       * Convert the given Query into an equivalent Pipeline.
       *
       * @param query A Query to be converted into a Pipeline.
       *
       * @throws {@FirestoreError} Thrown if any of the provided DocumentReferences target a different project or database than the pipeline.
       */
      createFrom(query: Query): Pipeline;
    }
    /**
     * @beta
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
     *     .where(and(Field.of("genre").equal("Science Fiction"), Field.of("published").greaterThan(1950)))
     *     .execute();
     *
     * // Example 3: Calculate the average rating of books published after 1980
     * const results3 = await db.pipeline()
     *     .collection("books")
     *     .where(Field.of("published").greaterThan(1980))
     *     .aggregate(average(Field.of("rating")).as("averageRating"))
     *     .execute();
     * ```
     */
    export class Pipeline {
      /**
       * @beta
       * Adds new fields to outputs from previous stages.
       *
       * This stage allows you to compute values on-the-fly based on existing data from previous
       * stages or constants. You can use this to create new fields or overwrite existing ones (if there
       * is name overlaps).
       *
       * The added fields are defined using {@link Selectable}s, which can be:
       *
       * - {@link Field}: References an existing document field.
       * - {@link Expression}: Either a literal value (see {@link Constant}) or a computed value
       *   (see {@FunctionExpression}) with an assigned alias using {@link Expression#as}.
       *
       * Example:
       *
       * ```typescript
       * firestore.pipeline().collection("books")
       *   .addFields(
       *     field("rating").as("bookRating"), // Rename 'rating' to 'bookRating'
       *     add(5, field("quantity")).as("totalCost")  // Calculate 'totalCost'
       *   );
       * ```
       *
       * @param field The first field to add to the documents, specified as a {@link Selectable}.
       * @param additionalFields Optional additional fields to add to the documents, specified as {@link Selectable}s.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      addFields(field: Selectable, ...additionalFields: Selectable[]): Pipeline;
      /**
       * @beta
       * Adds new fields to outputs from previous stages.
       *
       * This stage allows you to compute values on-the-fly based on existing data from previous
       * stages or constants. You can use this to create new fields or overwrite existing ones (if there
       * is name overlaps).
       *
       * The added fields are defined using {@link Selectable}s, which can be:
       *
       * - {@link Field}: References an existing document field.
       * - {@link Expression}: Either a literal value (see {@link Constant}) or a computed value
       *   (see {@FunctionExpression}) with an assigned alias using {@link Expression#as}.
       *
       * Example:
       *
       * ```typescript
       * firestore.pipeline().collection("books")
       *   .addFields(
       *     field("rating").as("bookRating"), // Rename 'rating' to 'bookRating'
       *     add(5, field("quantity")).as("totalCost")  // Calculate 'totalCost'
       *   );
       * ```
       *
       * @param options - An object that specifies required and optional parameters for the stage.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      addFields(options: AddFieldsStageOptions): Pipeline;
      /**
       * @beta
       * Remove fields from outputs of previous stages.
       *
       * Example:
       *
       * ```typescript
       * firestore.pipeline().collection('books')
       *   // removes field 'rating' and 'cost' from the previous stage outputs.
       *   .removeFields(
       *     field('rating'),
       *     'cost'
       *   );
       * ```
       *
       * @param fieldValue The first field to remove.
       * @param additionalFields Optional additional fields to remove.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      removeFields(
        fieldValue: Field | string,
        ...additionalFields: Array<Field | string>
      ): Pipeline;

      /**
       * @beta
       * Creates a stage that removes specified fields from the outputs of previous stages in the pipeline.
       *
       * This is useful for reducing the data transferred, by excluding fields
       * that are no longer needed after certain pipeline operations.
       *
       * Example:
       *
       * ```typescript
       * firestore.pipeline().collection('books')
       *   // Removes the 'rating' and 'cost' fields from the documents
       *   // processed by the preceding stages.
       *   .removeFields({
       *     fields: [
       *       field('rating'),
       *       'cost'
       *     ]
       *   });
       * ```
       *
       * @param options - An object containing the configuration for this stage.
       *   @param options.fields - An array of field names (strings) or {@link Expression} objects
       *     representing the fields to be removed from the output.
       * @returns A new {@link Pipeline} object with this stage appended to the stage list.
       */
      removeFields(options: RemoveFieldsStageOptions): Pipeline;

      /**
       * @beta
       * Selects or creates a set of fields from the outputs of previous stages.
       *
       * <p>The selected fields are defined using {@link Selectable} expressions, which can be:
       *
       * <ul>
       *   <li>{@code string}: The name of an existing field.</li>
       *   <li>{@link Field}: A reference to an existing field.</li>
       *   <li>{@link Expression}: An expression (e.g., a {@link FunctionExpression}) that represents the result of an expression.,
       *       The Expression must be aliased using {@link Expression#as}.</li>
       * </ul>
       *
       * <p>Example:
       *
       * ```typescript
       * firestore.pipeline().collection("books")
       *   .select(
       *     "firstName",
       *     field("lastName"),
       *     field("address").toUppercase().as("upperAddress"),
       *   );
       * ```
       *
       * @param selection The first field to include in the output documents, specified as a {@link
       *     Selectable} expression or a string value representing the field name.
       * @param additionalSelections Optional additional fields to include in the output documents, specified as {@link
       *     Selectable} expressions or {@code string} values representing field names.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      select(
        selection: Selectable | string,
        ...additionalSelections: Array<Selectable | string>
      ): Pipeline;

      /**
       * @beta
       * Selects or creates a set of fields from the outputs of previous stages.
       *
       * <p>The selected fields are defined using {@link Selectable} expressions, which can be:
       *
       * <ul>
       *   <li>{@code string}: The name of an existing field.</li>
       *   <li>{@link Field}: A reference to an existing field.</li>
       *   <li>{@link Expression}: An expression (e.g., a {@link FunctionExpression}) that represents the result of an expression.,
       *       The Expression must be aliased using {@link Expression#as}.</li>
       * </ul>
       *
       * If no selections are provided within the `options` (i.e., the `fields` array is empty),
       * the output of this stage will be an empty document. If the intention is to add new fields
       * without replacing existing ones, consider using {@link Pipeline#addFields} instead.
       *
       * Example:
       *
       * ```typescript
       * db.pipeline().collection("books")
       *   .select({
       *     fields: [
       *       "firstName",
       *       field("lastName"),
       *       field("address").toUppercase().as("upperAddress"),
       *     ]
       *   });
       * ```
       *
       * @param options An object of type {@link SelectStageOptions} that defines the selection criteria for this stage.
       *                It is expected to contain a `fields` property, which is an array of {@link Selectable} expressions.
       * @return A new {@link Pipeline} object with this select stage appended to its list of stages.
       */
      select(options: SelectStageOptions): Pipeline;
      /**
       * @beta
       * Filters the documents from previous stages to only include those matching the specified {@link
       * BooleanExpression}.
       *
       * <p>This stage allows you to apply conditions to the data, similar to a "WHERE" clause in SQL.
       * You can filter documents based on their field values, using implementations of {@link
       * BooleanExpression}, typically including but not limited to:
       *
       * <ul>
       *   <li>field comparators: {@link Function#equal}, {@link Function#lessThan} (less than), {@link
       *       Function#greaterThan} (greater than), etc.</li>
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
       *         greaterThan(field("rating"), 4.0),   // Filter for ratings greater than 4.0
       *         field("genre").equal("Science Fiction") // Equivalent to greaterThan("genre", "Science Fiction")
       *     )
       *   );
       * ```
       *
       * @param condition The {@link BooleanExpression} to apply.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      where(condition: BooleanExpression): Pipeline;
      /**
       * @beta
       * Filters the documents from previous stages to only include those matching the specified {@link
       * BooleanExpression}.
       *
       * <p>This stage allows you to apply conditions to the data, similar to a "WHERE" clause in SQL.
       * You can filter documents based on their field values, using implementations of {@link
       * BooleanExpression}, typically including but not limited to:
       *
       * <ul>
       *   <li>field comparators: {@link Function#equal}, {@link Function#lessThan} (less than), {@link
       *       Function#greaterThan} (greater than), etc.</li>
       *   <li>logical operators: {@link Function#and}, {@link Function#or}, {@link Function#not}, etc.</li>
       *   <li>advanced functions: {@link Function#regexMatch}, {@link
       *       Function#arrayContains}, etc.</li>
       * </ul>
       *
       * <p>Example:
       *
       * ```typescript
       * firestore.pipeline().collection("books")
       *   .where({
       *     filter: and(
       *         greaterThan(field("rating"), 4.0),   // Filter for ratings greater than 4.0
       *         field("genre").equal("Science Fiction") // Equivalent to greaterThan("genre", "Science Fiction")
       *     )
       *   });
       * ```
       *
       * @param options An object that specifies the filtering criteria. It is expected to contain a `filter` property of type {@link BooleanExpression}.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      where(options: WhereStageOptions): Pipeline;
      /**
       * @beta
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
      offset(offset: number): Pipeline;

      /**
       * @beta
       * Skips a specified number of documents from the results of previous stages.
       *
       * This stage is useful for implementing pagination in your pipelines, enabling you to
       * retrieve results in manageable chunks. It is commonly used alongside {@link Pipeline.limit}
       * to define the size of each page.
       *
       * Example:
       * ```typescript
       * // Retrieve the second page of 20 results
       * firestore.pipeline().collection('books')
       *     .sort(field('published').descending())
       *     .offset(20)  // Skip the first 20 results
       *     .limit(20);   // Take the next 20 results
       * ```
       *
       * @param options An object containing the configuration for the offset stage,
       *   including the number of documents to skip.
       * @returns A new `Pipeline` object with this stage appended to the stage list.
       */
      offset(options: OffsetStageOptions): Pipeline;
      /**
       * @beta
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
      limit(limit: number): Pipeline;

      /**
       * @beta
       * Limits the maximum number of documents returned by previous stages.
       *
       * <p>This stage is particularly useful when you want to retrieve a controlled subset of data from
       * a potentially large result set. It's often used for:
       *
       * <ul>
       *   <li><b>Pagination:</b> In combination with {@link #offset} to retrieve specific pages of
       *       results.</li>
       *   <li><b>Limiting Data Retrieval:</b> To prevent excessive data transfer and improve performance,
       *       especially when dealing with large collections.</li>
       * </ul>
       *
       * <p>Example:
       *
       * ```typescript
       * // Limit the results to the top 10 highest-rated books
       * firestore.pipeline().collection('books')
       *     .sort(field('rating').descending())
       *     .limit({ limit: 10 });
       * ```
       *
       * @param options - An object that specifies the limit. It must contain a `limit` property, which is a number representing the maximum number of documents to return.
       * @return A new {@link Pipeline} object with this stage appended to the stage list.
       */
      limit(options: LimitStageOptions): Pipeline;
      /**
       * @beta
       * Returns a set of distinct values from the inputs to this stage.
       *
       * This stage runs through the results from previous stages to include only results with
       * unique combinations of {@link Expression} values ({@link Field}, {@link Function}, etc).
       *
       * The parameters to this stage are defined using {@link Selectable} expressions or strings:
       *
       * - {@code string}: Name of an existing field
       * - {@link Field}: References an existing document field.
       * - {@link AliasedExpression}: Represents the result of a function with an assigned alias name
       *   using {@link Expression#as}.
       *
       * Example:
       *
       * ```typescript
       * // Get a list of unique author names in uppercase and genre combinations.
       * firestore.pipeline().collection("books")
       *     .distinct(toUppercase(field("author")).as("authorName"), field("genre"), "publishedAt")
       *     .select("authorName");
       * ```
       *
       * @param group The {@link Selectable} expression or field name to consider when determining
       *     distinct value combinations.
       * @param additionalGroups Optional additional {@link Selectable} expressions to consider when determining distinct
       *     value combinations or strings representing field names.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      distinct(
        group: string | Selectable,
        ...additionalGroups: Array<string | Selectable>
      ): Pipeline;
      /**
       * @beta
       * Returns a set of distinct values from the inputs to this stage.
       *
       * This stage runs through the results from previous stages to include only results with
       * unique combinations of {@link Expression} values ({@link Field}, {@link Function}, etc).
       *
       * The parameters to this stage are defined using {@link Selectable} expressions or strings:
       *
       * - {@code string}: Name of an existing field
       * - {@link Field}: References an existing document field.
       * - {@link AliasedExpression}: Represents the result of a function with an assigned alias name
       *   using {@link Expression#as}.
       *
       * Example:
       *
       * ```typescript
       * // Get a list of unique author names in uppercase and genre combinations.
       * firestore.pipeline().collection("books")
       *     .distinct(toUppercase(field("author")).as("authorName"), field("genre"), "publishedAt")
       *     .select("authorName");
       * ```
       *
       * @param options - An object that specifies required and optional parameters for the stage.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      distinct(options: DistinctStageOptions): Pipeline;
      /**
       * @beta
       * Performs aggregation operations on the documents from previous stages.
       *
       * <p>This stage allows you to calculate aggregate values over a set of documents. You define the
       * aggregations to perform using {@link AliasedAggregate} expressions which are typically results of
       * calling {@link Expression#as} on {@link AggregateFunction} instances.
       *
       * <p>Example:
       *
       * ```typescript
       * // Calculate the average rating and the total number of books
       * firestore.pipeline().collection("books")
       *     .aggregate(
       *         field("rating").average().as("averageRating"),
       *         countAll().as("totalBooks")
       *     );
       * ```
       *
       * @param accumulator The first {@link AliasedAggregate}, wrapping an {@link AggregateFunction}
       *     and providing a name for the accumulated results.
       * @param additionalAccumulators Optional additional {@link AliasedAggregate}, each wrapping an {@link AggregateFunction}
       *     and providing a name for the accumulated results.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      aggregate(
        accumulator: AliasedAggregate,
        ...additionalAccumulators: AliasedAggregate[]
      ): Pipeline;
      /**
       * @beta
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
       *       are defined using {@link AliasedAggregate} expressions, which are typically created by
       *       calling {@link Expression#as} on {@link AggregateFunction} instances. Each aggregation
       *       calculates a value (e.g., sum, average, count) based on the documents within its group.</li>
       * </ul>
       *
       * <p>Example:
       *
       * ```typescript
       * // Calculate the average rating for each genre.
       * firestore.pipeline().collection("books")
       *   .aggregate({
       *       accumulators: [average(field("rating")).as("avg_rating")]
       *       groups: ["genre"]
       *       });
       * ```
       *
       * @param options - An object that specifies required and optional parameters for the stage.
       * @return A new {@code Pipeline} object with this stage appended to the stage
       * list.
       */
      aggregate(options: AggregateStageOptions): Pipeline;
      /**
       * @beta
       * Performs a vector proximity search on the documents from the previous stage, returning the
       * K-nearest documents based on the specified query `vectorValue` and `distanceMeasure`. The
       * returned documents will be sorted in order from nearest to furthest from the query `vectorValue`.
       *
       * <p>Example:
       *
       * ```typescript
       * // Find the 10 most similar books based on the book description.
       * const bookDescription = "Lorem ipsum...";
       * const queryVector: number[] = ...; // compute embedding of `bookDescription`
       *
       * firestore.pipeline().collection("books")
       *     .findNearest({
       *       field: 'embedding',
       *       vectorValue: queryVector,
       *       distanceMeasure: 'euclidean',
       *       limit: 10,                        // optional
       *       distanceField: 'computedDistance' // optional
       *     });
       * ```
       *
       * @param options - An object that specifies required and optional parameters for the stage.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      findNearest(options: FindNearestStageOptions): Pipeline;

      /**
       * @beta
       * Fully overwrites all fields in a document with those coming from a nested map.
       *
       * <p>This stage allows you to emit a map value as a document. Each key of the map becomes a field
       * on the document that contains the corresponding value.
       *
       * <p>Example:
       *
       * ```typescript
       * // Input.
       * // {
       * //  'name': 'John Doe Jr.',
       * //  'parents': {
       * //    'father': 'John Doe Sr.',
       * //    'mother': 'Jane Doe'
       * //   }
       * // }
       *
       * // Emit parents as document.
       * firestore.pipeline().collection('people').replaceWith('parents');
       *
       * // Output
       * // {
       * //  'father': 'John Doe Sr.',
       * //  'mother': 'Jane Doe'
       * // }
       * ```
       *
       * @param fieldName The name of the field containing the nested map.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      replaceWith(fieldName: string): Pipeline;

      /**
       * @beta
       * Fully replaces all fields in a document with the fields from a map expression.
       *
       * <p>This stage allows you to transform the current document into a new one
       * by providing an {@link Expression} that evaluates to a map. Each key-value pair
       * in the resulting map will become a field-value pair in the document.
       *
       * <p>Example:
       *
       * ```typescript
       * // Input document:
       * // {
       * //   'firstName': 'John',
       * //   'lastName': 'Doe',
       * //   'age': 30
       * // }
       *
       * // Replace the document's fields with a new map.
       * // The 'fullName' field will be created by concatenating 'firstName' and 'lastName'.
       * // The 'status' field will be a new static value.
       * firestore.pipeline().collection('users').replaceWith(map({
       *   fullName: concat(field('firstName'), ' ', field('lastName')),
       *   status: 'active'
       * }));
       *
       * // Output document:
       * // {
       * //   'fullName': 'John Doe',
       * //   'status': 'active'
       * // }
       * ```
       *
       * @param expr An {@link Expression} that evaluates to a map. The key-value pairs of this map will replace the document's fields.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      replaceWith(expr: Expression): Pipeline;

      /**
       * @beta
       * Fully overwrites all fields in a document with those coming from a map.
       *
       * <p>This stage allows you to transform the current document into a new one
       * by defining its new structure using a map expression. Each key in the
       * provided map expression becomes a field in the new document, with its
       * corresponding value. Values within the map can be literal values or
       * expressions that refer to fields from the input document.
       *
       * <p>Example:
       *
       * ```typescript
       * // Input document:
       * // {
       * //  'productId': 'P123',
       * //  'itemName': 'Laptop',
       * //  'price': 1200,
       * //  'details': {
       * //    'weight': '2kg',
       * //    'color': 'silver'
       * //   }
       * // }
       *
       * // Replace the document with a new structure, selecting and renaming fields,
       * // and adding new literal values.
       * firestore.pipeline().collection('products').replaceWith(map({
       *   id: field('productId'),
       *   productName: field('itemName'),
       *   displayPrice: concat('$', field('price')),
       *   category: 'Electronics',
       *   weightInKg: field('details.weight')
       * }));
       *
       * // Output document:
       * // {
       * //  'id': 'P123',
       * //  'productName': 'Laptop',
       * //  'displayPrice': '$1200',
       * //  'category': 'Electronics',
       * //  'weightInKg': '2kg'
       * // }
       * ```
       *
       * @param options - An object that specifies the map expression to use for replacement.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      replaceWith(options: ReplaceWithStageOptions): Pipeline;

      /**
       * @beta
       * Performs a pseudo-random sampling of documents from the previous stage in the pipeline.
       *
       * This stage filters documents pseudo-randomly, returning a specified number of documents.
       *
       * Examples:
       *
       * ```typescript
       * // Sample 25 books, if available.
       * firestore.pipeline().collection('books')
       *     .sample(25);
       * ```
       *
       * @param documents The maximum number of documents to sample.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      sample(documents: number): Pipeline;
      /**
       * @beta
       * Performs a pseudo-random sampling of the documents from the previous stage.
       *
       * <p>This stage will filter documents pseudo-randomly. The 'options' parameter specifies how
       * sampling will be performed. See {@code SampleOptions} for more information.
       *
       * <p>Examples:
       *
       * // Sample 10 books, if available.
       * firestore.pipeline().collection("books")
       *     .sample({ documents: 10 });
       *
       * // Sample 50% of books.
       * firestore.pipeline().collection("books")
       *     .sample({ percentage: 0.5 });
       *
       * @param options - An object that specifies required and optional parameters for the stage.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      sample(options: SampleStageOptions): Pipeline;
      /**
       * @beta
       * Performs union of all documents from two pipelines, including duplicates.
       *
       * <p>This stage will pass through documents from previous stage, and also pass through documents
       * from previous stage of the `other` {@code Pipeline} given in parameter. The order of documents
       * emitted from this stage is undefined.
       *
       * <p>Example:
       *
       * ```typescript
       * // Emit documents from books collection and magazines collection.
       * firestore.pipeline().collection('books')
       *     .union(firestore.pipeline().collection('magazines'));
       * ```
       *
       * @param other The other {@code Pipeline} that is part of union.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      union(other: Pipeline): Pipeline;
      /**
       * @beta
       * Performs union of all documents from two pipelines, including duplicates.
       *
       * <p>This stage will pass through documents from previous stage, and also pass through documents
       * from previous stage of the `other` {@code Pipeline} given in parameter. The order of documents
       * emitted from this stage is undefined.
       *
       * <p>Example:
       *
       * ```typescript
       * // Emit documents from books collection and magazines collection.
       * firestore.pipeline().collection('books')
       *     .union(firestore.pipeline().collection('magazines'));
       * ```
       *
       * @param options - An object that specifies required and optional parameters for the stage.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      union(options: UnionStageOptions): Pipeline;
      /**
       * @beta
       * Produces a document for each element in an input array.
       *
       * For each previous stage document, this stage will emit zero or more augmented documents. The
       * input array specified by the `selectable` parameter, will emit an augmented document for each input array element. The input array element will
       * augment the previous stage document by setting the `alias` field  with the array element value.
       *
       * When `selectable` evaluates to a non-array value (ex: number, null, absent), then the stage becomes a no-op for
       * the current input document, returning it as is with the `alias` field absent.
       *
       * No documents are emitted when `selectable` evaluates to an empty array.
       *
       * Example:
       *
       * ```typescript
       * // Input:
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tags": [ "comedy", "space", "adventure" ], ... }
       *
       * // Emit a book document for each tag of the book.
       * firestore.pipeline().collection("books")
       *     .unnest(field("tags").as('tag'), 'tagIndex');
       *
       * // Output:
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "comedy", "tagIndex": 0, ... }
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "space", "tagIndex": 1, ... }
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "adventure", "tagIndex": 2, ... }
       * ```
       *
       * @param selectable A selectable expression defining the field to unnest and the alias to use for each un-nested element in the output documents.
       * @param indexField An optional string value specifying the field path to write the offset (starting at zero) into the array the un-nested element is from
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      unnest(selectable: Selectable, indexField?: string): Pipeline;
      /**
       * @beta
       * Produces a document for each element in an input array.
       *
       * For each previous stage document, this stage will emit zero or more augmented documents. The
       * input array specified by the `selectable` parameter, will emit an augmented document for each input array element. The input array element will
       * augment the previous stage document by setting the `alias` field  with the array element value.
       *
       * When `selectable` evaluates to a non-array value (ex: number, null, absent), then the stage becomes a no-op for
       * the current input document, returning it as is with the `alias` field absent.
       *
       * No documents are emitted when `selectable` evaluates to an empty array.
       *
       * Example:
       *
       * ```typescript
       * // Input:
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tags": [ "comedy", "space", "adventure" ], ... }
       *
       * // Emit a book document for each tag of the book.
       * firestore.pipeline().collection("books")
       *     .unnest(field("tags").as('tag'), 'tagIndex');
       *
       * // Output:
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "comedy", "tagIndex": 0, ... }
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "space", "tagIndex": 1, ... }
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "adventure", "tagIndex": 2, ... }
       * ```
       *
       * @param options - An object that specifies required and optional parameters for the stage.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      unnest(options: UnnestStageOptions): Pipeline;
      /**
       * @beta
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
       *         Ordering.of(field("rating")).descending(),
       *         Ordering.of(field("title"))  // Ascending order is the default
       *     );
       * ```
       *
       * @param ordering The first {@link Ordering} instance specifying the sorting criteria.
       * @param additionalOrderings Optional additional {@link Ordering} instances specifying the additional sorting criteria.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      sort(ordering: Ordering, ...additionalOrderings: Ordering[]): Pipeline;
      /**
       * @beta
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
       *         Ordering.of(field("rating")).descending(),
       *         Ordering.of(field("title"))  // Ascending order is the default
       *     );
       * ```
       *
       * @param options - An object that specifies required and optional parameters for the stage.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      sort(options: SortStageOptions): Pipeline;
      /**
       * @beta
       * Adds a raw stage to the pipeline.
       *
       * <p>This method provides a flexible way to extend the pipeline's functionality by adding custom
       * stages. Each raw stage is defined by a unique `name` and a set of `params` that control its
       * behavior.
       *
       * <p>Example (Assuming there is no "where" stage available in SDK):
       *
       * ```typescript
       * // Assume we don't have a built-in "where" stage
       * firestore.pipeline().collection("books")
       *     .rawStage("where", [Field.of("published").lessThan(1900)]) // Custom "where" stage
       *     .select("title", "author");
       * ```
       *
       * @param name The unique name of the raw stage to add.
       * @param params A list of parameters to configure the raw stage's behavior.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      rawStage(name: string, params: any[]): Pipeline;
      /**
       * @beta
       * Executes this pipeline and returns a Promise to represent the asynchronous operation.
       *
       * <p>The returned Promise can be used to track the progress of the pipeline execution
       * and retrieve the results (or handle any errors) asynchronously.
       *
       * <p>The pipeline results are returned in a {@link PipelineSnapshot} object, which contains a list of
       * {@link PipelineResult} objects. Each {@link PipelineResult} typically represents a single key/value map that
       * has passed through all the stages of the pipeline, however this might differ depending on the stages involved
       * in the pipeline. For example:
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
       *     .where(greaterThan(Field.of("rating"), 4.5))
       *     .select("title", "author", "rating")
       *     .execute();
       * ```
       *
       * @param pipelineExecuteOptions - Optionally specify pipeline execution behavior.
       * @return A Promise representing the asynchronous pipeline execution.
       */
      execute(
        pipelineExecuteOptions?: PipelineExecuteOptions
      ): Promise<PipelineSnapshot>;

      /**
       * @beta
       * Executes this pipeline and streams the results as {@link PipelineResult}s.
       *
       * @returns {NodeJS.ReadableStream} A Node.js ReadableStream that emits {@link PipelineResult} objects.
       *
       * @example
       * ```typescript
       * firestore.pipeline().collection("books")
       *     .where(greaterThan(Field.of("rating"), 4.5))
       *     .select("title", "author", "rating")
       *     .stream()
       *     .on('data', (pipelineResult) => {
       *       console.log(pipelineResult);
       *     })
       *     .on('end', () => {
       *       console.log('Stream ended.');
       *     });
       * ```
       */
      stream(): NodeJS.ReadableStream;
    }
    /**
     * @beta
     * Options defining how a Pipeline is evaluated.
     */
    export type PipelineExecuteOptions = {
      /**
       * @beta
       * Specifies the index mode for the query.
       */
      indexMode?: 'recommended';
      /**
       * @beta Options used to configure explain queries. */
      explainOptions?: {
        /**
         * @beta
         * The explain mode configures what explain data
         * and query results are returned from the Pipeline query.
         *
         * `"execute"` - [DEFAULT] Execute the Pipeline and return results
         * `"analyze"` - Plan the query and execute, returning both the planner
         *               information and the Pipeline query results.
         */
        mode?: 'execute' | 'analyze';
        /**
         * @beta
         * Specifies the output format of the query planner information.
         */
        outputFormat?: 'text' | 'json';
      };
      /**
       * @beta
       * An escape hatch to set options not known at SDK build time. These values
       * will be passed directly to the Firestore backend and not used by the SDK.
       *
       * The option name will be used as provided. And must match the name
       * format used by the backend (hint: use a snake_case_name).
       *
       * Custom option values can be any type supported
       * by Firestore (for example: string, boolean, number, map, …). Value types
       * not known to the SDK will be rejected.
       *
       * Values specified in rawOptions will take precedence over any options
       * with the same name set by the SDK.
       *
       * Override the `example_option`:
       * ```
       *   execute({
       *     pipeline: myPipeline,
       *     rawOptions: {
       *       // Override `example_option`. This will not
       *       // merge with the existing `example_option` object.
       *       "example_option": {
       *         foo: "bar"
       *       }
       *     }
       *   }
       * ```
       *
       * `rawOptions` supports dot notation, if you want to override
       * a nested option.
       * ```
       *   execute({
       *     pipeline: myPipeline,
       *     rawOptions: {
       *       // Override `example_option.foo` and do not override
       *       // any other properties of `example_option`.
       *       "example_option.foo": "bar"
       *     }
       *   }
       * ```
       */
      rawOptions?: {
        [name: string]: unknown;
      };
    };
    /**
     * @beta
     * Options defining how a Stage is evaluated.
     */
    export type StageOptions = {
      /**
       * @beta
       * An escape hatch to set options not known at SDK build time. These values
       * will be passed directly to the Firestore backend and not used by the SDK.
       *
       * The option name will be used as provided. And must match the name
       * format used by the backend (hint: use a snake_case_name).
       *
       * Raw option values can be any type supported
       * by Firestore (for example: string, boolean, number, map, …). Value types
       * not known to the SDK will be rejected.
       *
       * Values specified in rawOptions will take precedence over any options
       * with the same name set by the SDK.
       *
       * `rawOptions` supports dot notation, if you want to override
       * a nested option.
       */
      rawOptions?: {
        [name: string]: unknown;
      };
    };
    /**
     * @beta
     * Options defining how a CollectionStage is evaluated. See {@link PipelineSource.collection}.
     */
    export type CollectionStageOptions = StageOptions & {
      /**
       * @beta
       * Name or reference to the collection that will be used as the Pipeline source.
       */
      collection: string | CollectionReference;

      /**
       * @beta
       * Specifies the name of an index to be used for a query, overriding the query optimizer's default choice.
       * This can be useful for performance tuning in specific scenarios where the default index selection
       * does not yield optimal performance.
       *
       * @remarks This property is optional. When provided, it should be the exact name of the index to force.
       */
      forceIndex?: string;
    };

    /**
     * @beta
     * Defines the configuration options for a {@link CollectionGroupStage} within a pipeline.
     * This type extends {@link StageOptions} and provides specific settings for how a collection group
     * is identified and processed during pipeline execution.
     *
     * @see {@link PipelineSource.collectionGroup} to create a collection group stage.
     */
    export type CollectionGroupStageOptions = StageOptions & {
      /**
       * @beta
       * ID of the collection group to use as the Pipeline source.
       */
      collectionId: string;

      /**
       * @beta
       * Specifies the name of an index to be used for a query, overriding the query optimizer's default choice.
       * This can be useful for performance tuning in specific scenarios where the default index selection
       * does not yield optimal performance.
       *
       * @remarks This property is optional. When provided, it should be the exact name of the index to force.
       */
      forceIndex?: string;
    };
    /**
     * @beta
     * Options defining how a DatabaseStage is evaluated. See {@link PipelineSource.database}.
     */
    export type DatabaseStageOptions = StageOptions & {};
    /**
     * @beta
     * Options defining how a DocumentsStage is evaluated. See {@link PipelineSource.documents}.
     */
    export type DocumentsStageOptions = StageOptions & {
      /**
       * @beta
       * An array of paths and DocumentReferences specifying the individual documents that will be the source of this pipeline.
       * The converters for these DocumentReferences will be ignored and not have an effect on this pipeline.
       * There must be at least one document specified in the array.
       */
      docs: Array<string | DocumentReference>;
    };
    /**
     * @beta
     * Options defining how an AddFieldsStage is evaluated. See {@link Pipeline.addFields}.
     */
    export type AddFieldsStageOptions = StageOptions & {
      /**
       * @beta
       *  The fields to add to each document, specified as a {@link Selectable}.
       *  At least one field is required.
       */
      fields: Selectable[];
    };
    /**
     * @beta
     * Options defining how a RemoveFieldsStage is evaluated. See {@link Pipeline.removeFields}.
     */
    export type RemoveFieldsStageOptions = StageOptions & {
      /**
       * @beta
       * The fields to remove from each document.
       */
      fields: Array<Field | string>;
    };
    /**
     * @beta
     * Options defining how a SelectStage is evaluated. See {@link Pipeline.select}.
     */
    export type SelectStageOptions = StageOptions & {
      /**
       * @beta
       * The fields to include in the output documents, specified as {@link Selectable} expression
       * or as a string value indicating the field name.
       */
      selections: Array<Selectable | string>;
    };
    /**
     * @beta
     * Options defining how a WhereStage is evaluated. See {@link Pipeline.where}.
     */
    export type WhereStageOptions = StageOptions & {
      /**
       * @beta
       * The {@link BooleanExpression} to apply as a filter for each input document to this stage.
       */
      condition: BooleanExpression;
    };
    /**
     * @beta
     * Options defining how an OffsetStage is evaluated. See {@link Pipeline.offset}.
     */
    export type OffsetStageOptions = StageOptions & {
      /**
       * @beta
       * The number of documents to skip.
       */
      offset: number;
    };
    /**
     * @beta
     * Options defining how a LimitStage is evaluated. See {@link Pipeline.limit}.
     */
    export type LimitStageOptions = StageOptions & {
      /**
       * @beta
       * The maximum number of documents to return.
       */
      limit: number;
    };
    /**
     * @beta
     * Options defining how a DistinctStage is evaluated. See {@link Pipeline.distinct}.
     */
    export type DistinctStageOptions = StageOptions & {
      /**
       * @beta
       * The {@link Selectable} expressions or field names to consider when determining
       * distinct value combinations (groups).
       */
      groups: Array<string | Selectable>;
    };
    /**
     * @beta
     * Options defining how an AggregateStage is evaluated. See {@link Pipeline.aggregate}.
     */
    export type AggregateStageOptions = StageOptions & {
      /**
       * @beta
       * The {@link AliasedAggregate} values specifying aggregate operations to
       * perform on the input documents.
       */
      accumulators: AliasedAggregate[];
      /**
       * @beta
       * The {@link Selectable} expressions or field names to consider when determining
       * distinct value combinations (groups), which will be aggregated over.
       */
      groups?: Array<string | Selectable>;
    };
    /**
     * @beta
     * Options defining how a FindNearestStage is evaluated. See {@link Pipeline.findNearest}.
     */
    export type FindNearestStageOptions = StageOptions & {
      /**
       * @beta
       * Specifies the field to be used. This can be a string representing the field path
       * (e.g., 'fieldName', 'nested.fieldName') or an object of type {@link Field}
       * representing a more complex field expression.
       */
      field: Field | string;
      /**
       * @beta
       * Specifies the query vector value, to which the vector distance will be computed.
       */
      vectorValue: VectorValue | number[];
      /**
       * @beta
       * Specifies the method used to compute the distance between vectors.
       *
       * Possible values are:
       * - `'euclidean'`: Euclidean distance.
       * - `'cosine'`: Cosine similarity.
       * - `'dot_product'`: Dot product.
       */
      distanceMeasure: 'euclidean' | 'cosine' | 'dot_product';
      /**
       * @beta
       * The maximum number of documents to return from the FindNearest stage.
       */
      limit?: number;
      /**
       * @beta
       * If set, specifies the field on the output documents that will contain
       * the computed vector distance for the document. If not set, the computed
       * vector distance will not be returned.
       */
      distanceField?: string;
    };
    /**
     * @beta
     * Options defining how a ReplaceWithStage is evaluated. See {@link Pipeline.replaceWith}.
     */
    export type ReplaceWithStageOptions = StageOptions & {
      /**
       * @beta
       * The name of a field that contains a map or an {@link Expression} that
       * evaluates to a map.
       */
      map: Expression | string;
    };
    /**
     * @beta
     * Defines the options for evaluating a sample stage within a pipeline.
     * This type combines common {@link StageOptions} with a specific configuration
     * where only one of the defined sampling methods can be applied.
     *
     * See {@link Pipeline.sample} to create a sample stage..
     */
    export type SampleStageOptions = StageOptions &
      OneOf<{
        /**
         * @beta
         * If set, specifies the sample rate as a percentage of the
         * input documents.
         *
         * Cannot be set when `documents: number` is set.
         */
        percentage: number;
        /**
         * @beta
         * If set, specifies the sample rate as a total number of
         * documents to sample from the input documents.
         *
         * Cannot be set when `percentage: number` is set.
         */
        documents: number;
      }>;
    /**
     * @beta
     * Options defining how a UnionStage is evaluated. See {@link Pipeline.union}.
     */
    export type UnionStageOptions = StageOptions & {
      /**
       * @beta
       * Specifies the other Pipeline to union with.
       */
      other: Pipeline;
    };

    /**
     * @beta
     * Represents the specific options available for configuring an `UnnestStage` within a pipeline.
     */
    export type UnnestStageOptions = StageOptions & {
      /**
       * @beta
       * A `Selectable` object that defines an array expression to be un-nested
       * and the alias for the un-nested field.
       */
      selectable: Selectable;
      /**
       * @beta
       * If set, specifies the field on the output documents that will contain the
       * offset (starting at zero) that the element is from the original array.
       */
      indexField?: string;
    };
    /**
     * @beta
     * Options defining how a SortStage is evaluated. See {@link Pipeline.sort}.
     */
    export type SortStageOptions = StageOptions & {
      /**
       * @beta
       * Orderings specify how the input documents are sorted.
       * One or more ordering are required.
       */
      orderings: Ordering[];
    };

    /**
     * @beta
     * Represents a field value within the explain statistics, which can be a primitive type (null, string, number, boolean)
     * or a recursively defined object where keys are strings and values are also `ExplainStatsFieldValue`.
     */
    export type ExplainStatsFieldValue =
      | null
      | string
      | number
      | boolean
      | {
          [key: string]: ExplainStatsFieldValue;
        }
      | ExplainStatsFieldValue[];

    /**
     * @beta
     * Represents the explanation statistics for a {@link Pipeline} query execution.
     * These statistics are available when the query is executed with explain or analyze
     * options enabled, providing insights into the query's performance and execution plan.
     */
    export class ExplainStats {
      /**
       * @beta
       * When explain stats were requested with `outputFormat = 'json'`, this returns
       * the explain stats object parsed from the JSON string returned from the Firestore
       * backend.
       *
       * If explain stats were not requested with `outputFormat = 'json'`, the behavior
       * of this method is not guaranteed and is expected to throw.
       */
      get json(): {
        [key: string]: ExplainStatsFieldValue;
      };
      /**
       * @beta
       * When explain stats were requested with `outputFormat = 'text'`, this returns
       * the explain stats string verbatium as returned from the Firestore backend.
       *
       * If explain stats were requested with `outputFormat = 'json'`, this returns
       * the explain stats as stringified JSON, which was returned from the Firestore backend.
       */
      get text(): string;
      /**
       * @beta
       * Returns the explain stats as an encoded protocol buffer message, typically wrapped in a `google.protobuf.Any` format.
       * This object includes a `type_url` field that identifies the specific type of the serialized message.
       * The caller is responsible for deserializing and unpacking this proto message to access the explain stats.
       */
      get rawData(): {
        type_url?: string | null;
        value?: Uint8Array | null;
      };
    }

    /**
     * @beta
     * Represents the results of a Firestore pipeline execution.
     *
     * A `PipelineSnapshot` contains zero or more {@link PipelineResult} objects
     * representing the documents returned by a pipeline query. It provides methods
     * to iterate over the documents and access metadata about the query results.
     *
     * @example
     * ```typescript
     * const snapshot = await firestore
     *   .pipeline()
     *   .collection('myCollection')
     *   .where(field('value').greaterThan(10))
     *   .execute();
     *
     * snapshot.results.forEach(doc => {
     *   console.log(doc.id, '=>', doc.data());
     * });
     * ```
     */
    export class PipelineSnapshot {
      /**
       * @beta
       * The Pipeline on which you called `execute()` in order to get this
       * `PipelineSnapshot`.
       */
      get pipeline(): Pipeline;

      /**
       * @beta An array of all the results in the `PipelineSnapshot`. */
      get results(): PipelineResult[];

      /**
       * @beta
       * The time at which the pipeline producing this result was executed.
       */
      get executionTime(): Timestamp;

      /**
       * @beta
       * Return stats from query explain.
       *
       * If `explainOptions.mode` was set to `execute` or left unset, then this returns `undefined`.
       */
      get explainStats(): ExplainStats | undefined;
    }

    /**
     * @beta
     * A PipelineResult contains data read from a Firestore Pipeline. The data can be extracted with the
     * {@link #data()} or {@link #get(String)} methods.
     *
     * <p>If the PipelineResult represents a non-document result, `ref` will return a undefined
     * value.
     */
    export class PipelineResult {
      readonly createTime: Timestamp | undefined;
      readonly updateTime: Timestamp | undefined;
      /**
       * @beta
       * The reference of the document, if it is a document; otherwise `undefined`.
       */
      get ref(): DocumentReference | undefined;

      /**
       * @beta
       * The ID of the document for which this PipelineResult contains data.
       * Returns `undefined` if the PipelineResult does not represent a document.
       */
      get id(): string | undefined;

      /**
       * @beta
       * Retrieves all fields of the document from the query result as a plain JavaScript object.
       *
       * @returns {DocumentData} An object containing all fields in the document.
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
      data(): DocumentData;
      /**
       * @beta
       * Retrieves the field specified by `field`.
       *
       * @param {string|FieldPath} fieldPath The field path
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
      get(fieldPath: string | FieldPath): any;

      /**
       * @beta
       * Checks if this `PipelineResult` is equal to the provided `other` object.
       * Equality is determined by comparing the document's data and path.
       *
       * @param other The `PipelineResult` to compare against.
       * @returns `true` if this `PipelineResult` is equal to the provided value; `false` otherwise.
       */
      isEqual(other: PipelineResult): boolean;
    }
  }
}
declare module '@google-cloud/firestore' {
  export = FirebaseFirestore;
}
