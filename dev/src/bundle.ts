import { DocumentReference, Query, QuerySnapshot } from './reference';
import { DocumentSnapshot } from './document';
import {DocumentData} from './types';
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
    addDoc(doc: DocumentReference): BundleBuilder {
        this.docRefs.push(doc);
        return this;
    }

    /**
     * Adds a Firestore document snapshot to the bundle. Both the document data and it's
     * query read time will be included in the bundle.
     */
    addDocSnap(docSnap: DocumentSnapshot): BundleBuilder {
        this.docSnaps.push(docSnap);
        return this;
    }

    /**
     * Adds a Firestore query snapshot to the bundle. Both the document data and it's query resume
     * token will be included in the bundle.
     */
    addQuerySnapj(queryName: string, querySnap: QuerySnapshot): BundleBuilder {
        this.querySnaps.set(queryName, querySnap);
        return this;
    }

    /**
     * Adds a Firestore query to the bundle. Both the query result (at the time when `build()`
     * is called) and the query itself, including it's resume token will be included in the
     * bundle.
     */
    addQuery(queryName: string, query: Query): BundleBuilder {
        this.queries.set(queryName, query);
        return this;
    }

    async stream(): Promise<NodeJS.ReadableStream> {
        var documents: Array<DocumentData> = [];
        for(const doc of this.docRefs) {
            const snap = await doc.get();
            if(!!snap.data()){
                documents.push(snap.data()!);
            }
        }

        var namedQueries: Map<string, Query> = new Map<string, Query>();
        for(const [name, query] of Array.from(this.queries)) {
            namedQueries.set(name, query);
            const snap = await query.get();
            for(const d of snap.docs) {
                documents.push(d.data());
            }
        }

        return Promise.resolve(Readable.from(documents.map(d => JSON.stringify(d))));
    }
}
