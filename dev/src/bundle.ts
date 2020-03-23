import {Readable} from 'stream';

import {google} from '../protos/firestore_v1_proto_api';

import {DocumentSnapshot} from './document';
import {DocumentReference, Query, QuerySnapshot} from './reference';

import api = google.firestore.v1;
import {Timestamp} from './timestamp';

/**
 * Builds a Firestore data bundle with results from given queries and specified
 * documents.
 *
 * The results used to build the bundle are from a consistent snapshot of all
 * added queries and documents.
 */
export class BundleBuilder {
  private docRefs: Array<DocumentReference> = [];
  private queries: Map<string, Query> = new Map<string, Query>();

  // Both DocumentSnapshot and QuerySnapshot need to be modified to add
  // resume token in the snapshot.
  private docSnaps: Array<DocumentSnapshot> = [];
  private querySnaps: Map<string, QuerySnapshot> = new Map<
    string,
    QuerySnapshot
  >();

  private documents: Map<string, BundledDocument> = new Map();
  private namedQueries: Map<string, api.INamedQuery> = new Map();
  private latestReadTime: Timestamp = Timestamp.fromProto({
    seconds: 0,
    nanos: 0,
  });

  constructor(private name: string) {}

  /**
   * Adds a Firestore document to the bundle. Both the document data and it's
   read time will be included in the bundle.
   */
  add(doc: DocumentReference): BundleBuilder;

  /**
   * Adds a Firestore document snapshot to the bundle. Both the document data
   * and it's query read time will be included in the bundle.
   */
  add(docSnap: DocumentSnapshot): BundleBuilder;

  /**
   * Adds a Firestore query snapshot to the bundle. Both the document data and
   * it's query resume token will be included in the bundle.
   */
  add(queryName: string, querySnap: QuerySnapshot): BundleBuilder;

  /**
   * Adds a Firestore query to the bundle. Both the query result (at the time
   * when `build()` is called) and the query itself, including it's resume token
   * will be included in the bundle.
   */
  add(queryName: string, query: Query): BundleBuilder;

  add(
    docOrName: DocumentReference | DocumentSnapshot | string,
    query?: QuerySnapshot | Query
  ) {
    if (docOrName instanceof DocumentReference) {
      this.docRefs.push(docOrName);
    } else if (docOrName instanceof DocumentSnapshot) {
      this.docSnaps.push(docOrName);
    } else if (query instanceof Query) {
      this.queries.set(docOrName, query);
    } else if (query instanceof QuerySnapshot) {
      this.querySnaps.set(docOrName, query);
    }

    return this;
  }

  private addBundledDocument(snap: DocumentSnapshot) {
    if (snap.exists) {
      const docProto = snap.toDocumentProto();
      if (
        !this.documents.has(snap.id) ||
        Timestamp.fromProto(
          this.documents.get(snap.id)!.metadata.readTime!
        ).toMillis() < snap.readTime.toMillis()
      ) {
        this.documents.set(snap.id, {
          document: docProto,
          metadata: {documentKey: docProto.name, readTime: snap.readTime},
        });
      }
      if (snap.readTime.toMillis() > this.latestReadTime.toMillis()) {
        this.latestReadTime = snap.readTime;
      }
    }
  }

  private addNamedQuery(name: string, querySnap: QuerySnapshot) {
    this.namedQueries.set(name, {
      name,
      queryTarget: {
        parent: querySnap.query.toProto().parent,
        structuredQuery: querySnap.query.toProto().structuredQuery,
      },
      readTime: querySnap.readTime.toProto().timestampValue,
    });

    for (const snap of querySnap.docs) {
      this.addBundledDocument(snap);
    }

    if (querySnap.readTime.toMillis() > this.latestReadTime.toMillis()) {
      this.latestReadTime = querySnap.readTime;
    }
  }

  private pushLengthPrefixedString(readable: Readable, payload: string) {
    const payloadLength = Buffer.byteLength(payload, 'utf-8');
    if (payloadLength >= 1024 * 1024 * 10) {
      throw new Error(`Payload size ${payloadLength} is too big`);
    }
    const buffer = Buffer.alloc(payloadLength + 4);
    const offset = buffer.writeUInt32LE(payloadLength, 0);
    buffer.write(payload, offset, 'utf-8');

    readable.push(buffer);
  }

  stream(): NodeJS.ReadableStream {
    for (const snap of this.docSnaps) {
      this.addBundledDocument(snap);
    }

    for (const [name, snap] of Array.from(this.querySnaps)) {
      const querySnap = snap as QuerySnapshot;

      if (this.namedQueries.has(name)) {
        throw new Error(`Query name conflict: ${name}`);
      }

      this.addNamedQuery(name, querySnap);
    }

    let promises: Array<Promise<void>> = [];
    for (const doc of this.docRefs) {
      promises.push(
        doc.get().then(snap => {
          this.addBundledDocument(snap);
        })
      );
    }

    for (const [name, query] of Array.from(this.queries)) {
      if (this.namedQueries.has(name)) {
        throw new Error(`Query name conflict: ${name}`);
      }

      promises.push(
        query.get().then(snap => {
          const querySnap = snap as QuerySnapshot;
          this.addNamedQuery(name, querySnap);
        })
      );
    }

    const readable = new Readable({
      objectMode: false,
      read: async size => {
        await Promise.all(promises);
        console.log(`promises resolved.`);
        const metadata: api.IBundleMetadata = {
          name: this.name,
          createTime: this.latestReadTime.toProto().timestampValue,
        };
        const metaElement: api.IBundleElement = {metadata};
        this.pushLengthPrefixedString(readable, JSON.stringify(metaElement));

        for (const namedQuery of this.namedQueries.values()) {
          const element: api.IBundleElement = {namedQuery};
          this.pushLengthPrefixedString(readable, JSON.stringify(element));
        }

        for (const bundledDocument of this.documents.values()) {
          const documentMetadata: api.IBundledDocumentMetadata =
            bundledDocument.metadata;
          const document: api.IDocument = bundledDocument.document;

          let element: api.IBundleElement = {documentMetadata};
          this.pushLengthPrefixedString(readable, JSON.stringify(element));

          element = {document};
          this.pushLengthPrefixedString(readable, JSON.stringify(element));
        }
        console.log(`pushing null`);
        readable.push(null);
      },
    });

    return readable;
  }
}

class BundledDocument {
  constructor(
    public readonly metadata: api.IBundledDocumentMetadata,
    public readonly document: api.IDocument
  ) {}
}
