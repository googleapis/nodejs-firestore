import { DocumentReference, Query, QuerySnapshot } from './reference';
import { DocumentSnapshot } from './document';
import { DocumentData } from './types';
import { Readable } from 'stream';

/**
 * Builds a Firestore data bundle with results from given queries and specified documents.
 *
 * The results used to build the bundle are from a consistent snapshot of all added queries
 * and documents.
 */
export class BundleBuilder {
    private docRefs: Array<DocumentReference> = [];
    private queries: Map<string, Query> = new Map<string, Query>();

    // Both DocumentSnapshot and QuerySnapshot need to be modified to add
    // resume token in the snapshot.
    private docSnaps: Array<DocumentSnapshot> = [];
    private querySnaps: Map<string, QuerySnapshot> = new Map<string, QuerySnapshot>();

    /**
     * Adds a Firestore document to the bundle. Both the document data and it's 
       read time will be included in the bundle.
     */
    add(doc: DocumentReference): BundleBuilder;

    /**
     * Adds a Firestore document snapshot to the bundle. Both the document data and it's
     * query read time will be included in the bundle.
     */
    add(docSnap: DocumentSnapshot): BundleBuilder;

    /**
     * Adds a Firestore query snapshot to the bundle. Both the document data and it's query resume
     * token will be included in the bundle.
     */
    add(queryName: string, querySnap: QuerySnapshot): BundleBuilder;

    /**
     * Adds a Firestore query to the bundle. Both the query result (at the time when `build()`
     * is called) and the query itself, including it's resume token will be included in the
     * bundle.
     */
    add(queryName: string, query: Query): BundleBuilder;

    add(docOrName: DocumentReference | DocumentSnapshot | string, query?: QuerySnapshot | Query) {
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

    stream(): NodeJS.ReadableStream {
        var documents: Array<DocumentData> = [];
        let promises: Array<Promise<void>> = [];
        for (const doc of this.docRefs) {
            promises.push(doc.get().then(snap => {
                if (!!snap.data()) {
                    documents.push(snap.data()!);
                }
            }));
        }

        var namedQueries: Map<string, Query> = new Map<string, Query>();
        for (const [name, query] of Array.from(this.queries)) {
            namedQueries.set(name, query);
            promises.push(query.get().then(snap => {
                for (const d of snap.docs) {
                    documents.push(d.data());
                }

            }));
        }

        const readable = new Readable({ objectMode: false });
        Promise.all(promises).then(results => {
            for (const doc of documents) {
                readable.push(JSON.stringify(doc));
            }
            readable.push(null);
        });

        return readable;
    }
}
