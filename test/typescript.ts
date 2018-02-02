/**
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

import CollectionReference = FirebaseFirestore.CollectionReference;
import DocumentReference = FirebaseFirestore.DocumentReference;
import DocumentSnapshot = FirebaseFirestore.DocumentSnapshot;
import WriteBatch = FirebaseFirestore.WriteBatch;
import Transaction = FirebaseFirestore.Transaction;
import FieldPath = FirebaseFirestore.FieldPath;
import QuerySnapshot = FirebaseFirestore.QuerySnapshot;
import QueryDocumentSnapshot = FirebaseFirestore.QueryDocumentSnapshot;
import UpdateData = FirebaseFirestore.UpdateData;
import Query = FirebaseFirestore.Query;
import DocumentChange = FirebaseFirestore.DocumentChange;
import FieldValue = FirebaseFirestore.FieldValue;
import Firestore = FirebaseFirestore.Firestore;
import DocumentData = FirebaseFirestore.DocumentData;
import GeoPoint = FirebaseFirestore.GeoPoint;

// This test verifies the Typescript typings and is not meant for execution.
xdescribe('firestore.d.ts', function() {
  const firestore: Firestore = new Firestore();

  const precondition = {lastUpdateTime: "1970-01-01T00:00:00.000Z"};
  const setOptions = {merge: true};
  const docRef: DocumentReference = firestore.doc('coll/doc');
  const collRef: CollectionReference = firestore.collection('coll');
  const updateData: UpdateData = {};
  const documentData: DocumentData = {};

  FirebaseFirestore.setLogFunction(console.log);

  it('has typings for Firestore', () => {
    const collRef: CollectionReference = firestore.collection('coll');
    const docRef1: DocumentReference = firestore.doc('coll/doc');
    const docRef2: DocumentReference = firestore.doc('coll/doc');
    firestore.getAll(docRef1, docRef2).then(
        (docs: DocumentSnapshot[]) => {
        });
    firestore.getCollections().then((collections:CollectionReference[]) => {
    });
    const transactionResult: Promise<string> = firestore.runTransaction(
        (updateFunction: Transaction) => {
          return Promise.resolve("string")
        });
    const batch: WriteBatch = firestore.batch();
  });

  it('has typings for GeoPoint', () => {
    const geoPoint: GeoPoint = new GeoPoint(90.0, 90.0);
    const latitude = geoPoint.latitude;
    const longitude = geoPoint.longitude;
  });

  it('has typings for Transaction', () => {
    return firestore.runTransaction((transaction: Transaction) => {
      transaction.get(collRef).then((snapshot: QuerySnapshot) => {
      });
      transaction.get(docRef).then((doc: DocumentSnapshot) => {
      });
      transaction.getAll(docRef, docRef).then((docs: DocumentSnapshot[]) => {
      });
      transaction = transaction.create(docRef, documentData);
      transaction = transaction.set(docRef, documentData);
      transaction = transaction.set(docRef, documentData, setOptions);
      transaction = transaction.update(docRef, updateData);
      transaction = transaction.update(docRef, updateData, precondition);
      transaction = transaction.update(docRef, 'foo', 'bar');
      transaction = transaction.update(docRef, 'foo', 'bar', precondition);
      transaction = transaction.update(docRef, new FieldPath('foo'), 'bar');
      transaction = transaction.update(docRef, new FieldPath('foo'), 'bar',
          precondition);
      transaction = transaction.delete(docRef);
      transaction = transaction.delete(docRef, precondition);
      return Promise.resolve()
    });
  });

  it('has typings for WriteBatch', () => {
    let batch: WriteBatch = firestore.batch();
    batch = batch.create(docRef, documentData);
    batch = batch.set(docRef, documentData);
    batch = batch.set(docRef, documentData, setOptions);
    batch = batch.update(docRef, updateData);
    batch = batch.update(docRef, updateData, precondition);
    batch = batch.update(docRef, 'foo', 'bar');
    batch = batch.update(docRef, 'foo', 'bar', precondition);
    batch = batch.update(docRef, new FieldPath('foo'), 'bar');
    batch = batch.update(docRef, new FieldPath('foo'), 'bar', precondition);
    batch = batch.delete(docRef);
    batch = batch.delete(docRef, precondition);
    batch.commit().then((result: FirebaseFirestore.WriteResult[]) => {
    });
  });

  it('has typings for WriteResult', () => {
    docRef.set(documentData).then((result: FirebaseFirestore.WriteResult) => {
      const writeTime: string = result.writeTime;
    });
  });

  it('has typings for FieldPath', () => {
    const path1: FieldPath = new FieldPath('a');
    const path2: FieldPath = new FieldPath('a', 'b');
    const path3: FieldPath = FieldPath.documentId();
  });

  it('has typings for DocumentReference', () => {
    const id: string = docRef.id;
    const firestore: FirebaseFirestore.Firestore = docRef.firestore;
    const parent: CollectionReference = docRef.parent;
    const path: string = docRef.path;
    const subcollection: CollectionReference = docRef.collection('coll');
    docRef.getCollections().then((collections:CollectionReference[]) => {
    });
    docRef.get().then((snapshot: DocumentSnapshot) => {
    });
    docRef.create(documentData).then(
        (writeResult: FirebaseFirestore.WriteResult) => {
    });
    docRef.set(documentData).then(
        (writeResult: FirebaseFirestore.WriteResult) => {
    });
    docRef.set(documentData, setOptions).then(
        (writeResult: FirebaseFirestore.WriteResult) => {
    });
    docRef.update(updateData).then(
        (writeResult: FirebaseFirestore.WriteResult) => {
    });
    docRef.update(updateData, precondition).then(
        (writeResult: FirebaseFirestore.WriteResult) => {
    });
    docRef.update('foo', 'bar').then(
        (writeResult: FirebaseFirestore.WriteResult) => {
    });
    docRef.update('foo', 'bar', precondition).then(
        (writeResult: FirebaseFirestore.WriteResult) => {
        });
    docRef.update(new FieldPath('foo'), 'bar').then(
        (writeResult: FirebaseFirestore.WriteResult) => {
        });
    docRef.update(new FieldPath('foo'), 'bar', precondition).then(
        (writeResult: FirebaseFirestore.WriteResult) => {
        });
    docRef.delete().then(
        (writeResult: FirebaseFirestore.WriteResult) => {
    });
    docRef.delete(precondition).then(
        (writeResult: FirebaseFirestore.WriteResult) => {
    });
    let unsubscribe: () => void = docRef.onSnapshot(
        (snapshot: DocumentSnapshot) => {
        });
    unsubscribe = docRef.onSnapshot((snapshot: DocumentSnapshot) => {
    }, (error: Error) => {
    });
  });

  it('has typings for DocumentSnapshot', () => {
    docRef.get().then((snapshot: DocumentSnapshot) => {
      const exists: boolean = snapshot.exists;
      const ref: DocumentReference = snapshot.ref;
      const id: string = snapshot.id;
      const readTime: string = snapshot.readTime;
      const updateTime: string = snapshot.updateTime!;
      const createTime: string = snapshot.createTime!;
      const data: DocumentData = snapshot.data()!;
      let value = snapshot.get('foo');
      value = snapshot.get(new FieldPath('foo'));
    });
  });

  it('has typings for QueryDocumentSnapshot', () => {
    collRef.get().then((querySnapshot: QuerySnapshot) => {
      const snapshot: QueryDocumentSnapshot = querySnapshot.docs[0];
      const exists: boolean = snapshot.exists;
      const ref: DocumentReference = snapshot.ref;
      const id: string = snapshot.id;
      const readTime: string = snapshot.readTime;
      const updateTime: string = snapshot.updateTime;
      const createTime: string = snapshot.createTime;
      const data: DocumentData = snapshot.data();
      let value = snapshot.get('foo');
      value = snapshot.get(new FieldPath('foo'));
    });
  });

  it('has typings for Query', () => {
    let query: Query = collRef;
    const firestore: FirebaseFirestore.Firestore = collRef.firestore;
    docRef.get().then((snapshot:DocumentSnapshot) => {
      query = query.where('foo', '==', 'bar');
      query = query.where(new FieldPath('foo'), '==', 'bar');
      query = query.orderBy('foo');
      query = query.orderBy('foo', 'asc');
      query = query.orderBy(new FieldPath('foo'));
      query = query.orderBy(new FieldPath('foo'), 'desc');
      query = query.limit(42);
      query = query.offset(42);
      query = query.select('foo');
      query = query.select('foo', 'bar');
      query = query.select(new FieldPath('foo'));
      query = query.select(new FieldPath('foo'), new FieldPath('bar'));
      query = query.startAt(snapshot);
      query = query.startAt('foo');
      query = query.startAt('foo', 'bar');
      query = query.startAfter(snapshot);
      query = query.startAfter('foo');
      query = query.startAfter('foo', 'bar');
      query = query.endAt(snapshot);
      query = query.endAt('foo');
      query = query.endAt('foo', 'bar');
      query = query.endBefore(snapshot);
      query = query.endBefore('foo');
      query = query.endBefore('foo', 'bar');
      query.get().then((results: QuerySnapshot) => {
      });
      query.stream().on('data', () => {
      });
      let unsubscribe: () => void = query.onSnapshot((snapshot: QuerySnapshot) => {
      });
      unsubscribe = query.onSnapshot((snapshot: QuerySnapshot) => {
      }, (error: Error) => {
      });
    });
  });

  it('has typings for QuerySnapshot', () => {
    collRef.get().then((snapshot: QuerySnapshot) => {
      const query: Query = snapshot.query;
      const docChanges: DocumentChange[] = snapshot.docChanges;
      const docs: QueryDocumentSnapshot[] = snapshot.docs;
      const size: number = snapshot.size;
      const empty: boolean = snapshot.empty;
      const readTime: string = snapshot.readTime;
      snapshot.forEach((result: QueryDocumentSnapshot) => {
      });
      snapshot.forEach((result: QueryDocumentSnapshot) => {
      }, this);
    });
  });

  it('has typings for DocumentChange', () => {
    collRef.get().then((snapshot: QuerySnapshot) => {
      const docChange: DocumentChange = snapshot.docChanges[0];
      const doc: QueryDocumentSnapshot = docChange.doc;
      const oldIndex: number = docChange.oldIndex;
      const newIndex: number = docChange.newIndex;
    });
  });

  it('has typings for CollectionReference', () => {
    const firestore: Firestore = collRef.firestore;
    const parent: DocumentReference|null = collRef.parent;
    const path: string = collRef.path;
    const id: string = collRef.id;
    const docRef1: DocumentReference = collRef.doc();
    const docRef2: DocumentReference = collRef.doc('doc');
    collRef.add(documentData).then((docRef: DocumentReference) => {
    });
  });

  it('has typings for FieldValue', () => {
    const documentData: UpdateData = {
      'foo': FieldValue.serverTimestamp(),
      'bar': FieldValue.delete()
    }
  });
});
