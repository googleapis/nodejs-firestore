// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as assert from 'assert';
import {Readable} from 'stream';

import {firestore, google} from '../protos/firestore_v1_proto_api';

import {DocumentSnapshot} from './document';
import {DocumentReference, Query, QuerySnapshot} from './reference';
import {Timestamp} from './timestamp';

import api = google.firestore.v1;

/**
 * Builds a Firestore data bundle with results from given queries and specified
 * documents.
 *
 * For documents in scope for multiple queries, the latest read version will
 * be included in the bundle.
 */
export class BundleBuilder {
  // DocumentReference and Query added to the bundle.
  private docRefs: DocumentReference[] = [];
  private queries: Map<string, Query> = new Map<string, Query>();

  // DocumentSnapshot and QuerySnapshot added to the bundle.
  private docSnaps: DocumentSnapshot[] = [];
  private querySnaps: Map<string, QuerySnapshot> = new Map<
    string,
    QuerySnapshot
  >();

  // Resulting documents for the bundle.
  private documents: Map<string, BundledDocument> = new Map();
  // Named queries saved in the bundle.
  private namedQueries: Map<string, firestore.INamedQuery> = new Map();

  // The latest read time among all bundled documents and queries.
  private latestReadTime: Timestamp = Timestamp.fromProto({
    seconds: 0,
    nanos: 0,
  });

  constructor(private id: string) {}

  add(doc: DocumentReference): BundleBuilder;
  add(docSnap: DocumentSnapshot): BundleBuilder;
  add(queryName: string, querySnap: QuerySnapshot): BundleBuilder;
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
        Timestamp.fromProto(this.documents.get(snap.id)!.metadata.readTime!) <
          snap.readTime
      ) {
        this.documents.set(snap.id, {
          document: docProto,
          metadata: {
            documentKey: docProto.name,
            readTime: snap.readTime.toProto().timestampValue,
          },
        });
      }
      if (snap.readTime > this.latestReadTime) {
        this.latestReadTime = snap.readTime;
      }
    }
  }

  private addNamedQuery(name: string, querySnap: QuerySnapshot) {
    this.namedQueries.set(name, {
      name,
      bundledQuery: querySnap.query.toBundledQuery(),
      readTime: querySnap.readTime.toProto().timestampValue,
    });

    for (const snap of querySnap.docs) {
      this.addBundledDocument(snap);
    }

    if (querySnap.readTime > this.latestReadTime) {
      this.latestReadTime = querySnap.readTime;
    }
  }

  private pushLengthPrefixedString(readable: Readable, payload: string) {
    const buffer = Buffer.from(payload, 'utf-8');
    const lengthBuffer = Buffer.from(buffer.length.toString());

    readable.push(Buffer.concat([lengthBuffer, buffer]));
  }

  stream(): NodeJS.ReadableStream {
    assert(
      this.docRefs.length +
        this.docSnaps.length +
        this.queries.size +
        this.querySnaps.size >
        0,
      'Nothing is added to the bundle.'
    );
    for (const snap of this.docSnaps) {
      this.addBundledDocument(snap);
    }

    for (const [name, snap] of Array.from(this.querySnaps)) {
      if (this.namedQueries.has(name)) {
        throw new Error(`Query name conflict: ${name}`);
      }

      this.addNamedQuery(name, snap);
    }

    const promises: Array<Promise<void>> = [];
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
        const metadata: firestore.IBundleMetadata = {
          id: this.id,
          createTime: this.latestReadTime.toProto().timestampValue,
        };
        this.pushLengthPrefixedString(
          readable,
          JSON.stringify({metadata} as firestore.IBundleElement)
        );

        for (const namedQuery of this.namedQueries.values()) {
          this.pushLengthPrefixedString(
            readable,
            JSON.stringify({namedQuery} as firestore.IBundleElement)
          );
        }

        for (const bundledDocument of this.documents.values()) {
          const documentMetadata: firestore.IBundledDocumentMetadata =
            bundledDocument.metadata;
          const document: api.IDocument = bundledDocument.document;

          this.pushLengthPrefixedString(
            readable,
            JSON.stringify({documentMetadata} as firestore.IBundleElement)
          );
          this.pushLengthPrefixedString(
            readable,
            JSON.stringify({document} as firestore.IBundleElement)
          );
        }
        readable.push(null);
      },
    });

    return readable;
  }

  build(): Promise<Buffer> {
    const stream = this.stream();
    return new Promise((resolve, reject) => {
      let data = Buffer.alloc(0);

      stream.on('data', chunk => (data = Buffer.concat([data, chunk])));
      stream.on('end', () => resolve(data));
      stream.on('error', error => reject(error));
    });
  }
}

class BundledDocument {
  constructor(
    readonly metadata: firestore.IBundledDocumentMetadata,
    readonly document: api.IDocument
  ) {}
}
