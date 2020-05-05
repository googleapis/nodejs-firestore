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

import {firestore, google} from '../protos/firestore_v1_proto_api';

import {DocumentSnapshot} from './document';
import {QuerySnapshot} from './reference';
import {Timestamp} from './timestamp';
import {
  invalidArgumentMessage,
  validateMaxNumberOfArguments,
  validateMinNumberOfArguments,
  validateString,
} from './validate';

import api = google.firestore.v1;

/**
 * Validates that 'value' is DocumentSnapshot.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The input to validate.
 */
export function validateDocumentSnapshot(
  arg: string | number,
  value: unknown
): void {
  if (!(value instanceof DocumentSnapshot)) {
    throw new Error(invalidArgumentMessage(arg, 'DocumentSnapshot'));
  }
}

/**
 * Validates that 'value' is QuerySnapshot.
 *
 * @private
 * @param arg The argument name or argument index (for varargs methods).
 * @param value The input to validate.
 */
export function validateQuerySnapshot(
  arg: string | number,
  value: unknown
): void {
  if (!(value instanceof QuerySnapshot)) {
    throw new Error(invalidArgumentMessage(arg, 'QuerySnapshot'));
  }
}

/**
 * Builds a Firestore data bundle with results from the given document and query snapshots.
 */
export class BundleBuilder {
  // Resulting documents for the bundle, keyed by full document path.
  private documents: Map<string, BundledDocument> = new Map();
  // Named queries saved in the bundle, keyed by query name.
  private namedQueries: Map<string, firestore.INamedQuery> = new Map();

  // The latest read time among all bundled documents and queries.
  private latestReadTime = new Timestamp(0, 0);

  constructor(private bundleId: string) {}

  add(documentSnapshot: DocumentSnapshot): BundleBuilder;
  add(queryName: string, querySnapshot: QuerySnapshot): BundleBuilder;
  /**
   * Adds a Firestore document snapshot or query snapshot to the bundle.
   * Both the documents data and the query read time will be included in the bundle.
   *
   * @param {DocumentSnapshot | string=} documentOrName A document snapshot to add or a name of a query.
   * @param {Query=} querySnapshot A query snapshot to add to the bundle, if provided.
   * @returns {BundleBuilder} This instance.
   *
   * @example
   * let bundle = firestore.bundle('data-bundle');
   * const docSnapshot = await firestore.doc('abc/123').get();
   * const querySnapshot = await firestore.collection('coll').get();
   * bundle.add(docSnapshot); // Add a document.
   * bundle.add('coll-query', querySnapshot) // Add a named query.
   * const bundleBuffer = await bundle.build();
   * // Save `bundleBuffer` to CDN or stream it to clients.
   */
  add(
    documentOrName: DocumentSnapshot | string,
    querySnapshot?: QuerySnapshot
  ): BundleBuilder {
    // eslint-disable-next-line prefer-rest-params
    validateMinNumberOfArguments('BundleBuilder.add', arguments, 1);
    // eslint-disable-next-line prefer-rest-params
    validateMaxNumberOfArguments('BundleBuilder.add', arguments, 2);
    if (arguments.length === 1) {
      validateDocumentSnapshot('documentOrName', documentOrName);
      this.addBundledDocument(documentOrName as DocumentSnapshot);
    } else if (arguments.length === 2) {
      validateString('documentOrName', documentOrName);
      validateQuerySnapshot('querySnapshot', querySnapshot);
      this.addNamedQuery(documentOrName as string, querySnapshot!);
    }

    return this;
  }

  private addBundledDocument(snap: DocumentSnapshot) {
    if (snap.exists) {
      const docProto = snap.toDocumentProto();
      const savedReadTime = Timestamp.fromProto(
        this.documents.get(snap.id)?.metadata.readTime ?? {}
      );
      if (!this.documents.has(snap.id) || savedReadTime < snap.readTime) {
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
    if (this.namedQueries.has(name)) {
      throw new Error(`Query name conflict: ${name} is already added.`);
    }

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

  /**
   * Converts a IBundleElement to a Buffer whose content is the length prefixed JSON representation
   * of the element.
   * @private
   */
  private elementToLengthPrefixedBuffer(
    bundleElement: firestore.IBundleElement
  ): Buffer {
    const buffer = Buffer.from(JSON.stringify(bundleElement), 'utf-8');
    const lengthBuffer = Buffer.from(buffer.length.toString());
    return Buffer.concat([lengthBuffer, buffer]);
  }

  build(): Buffer {
    let bundleBuffer = Buffer.alloc(0);
    const metadata: firestore.IBundleMetadata = {
      id: this.bundleId,
      createTime: this.latestReadTime.toProto().timestampValue,
    };
    bundleBuffer = Buffer.concat([
      bundleBuffer,
      this.elementToLengthPrefixedBuffer({metadata}),
    ]);

    for (const namedQuery of this.namedQueries.values()) {
      bundleBuffer = Buffer.concat([
        bundleBuffer,
        this.elementToLengthPrefixedBuffer({namedQuery}),
      ]);
    }

    for (const bundledDocument of this.documents.values()) {
      const documentMetadata: firestore.IBundledDocumentMetadata =
        bundledDocument.metadata;
      const document: api.IDocument = bundledDocument.document;

      bundleBuffer = Buffer.concat([
        bundleBuffer,
        this.elementToLengthPrefixedBuffer({documentMetadata}),
      ]);
      bundleBuffer = Buffer.concat([
        bundleBuffer,
        this.elementToLengthPrefixedBuffer({document}),
      ]);
    }
    return bundleBuffer;
  }
}

/**
 * Convenient class to hold both the metadata and the actual content of a document to be bundled.
 * @private
 */
class BundledDocument {
  constructor(
    readonly metadata: firestore.IBundledDocumentMetadata,
    readonly document: api.IDocument
  ) {}
}
