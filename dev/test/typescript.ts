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

import * as FirebaseFirestore from '../src';

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
import Precondition = FirebaseFirestore.Precondition;
import SetOptions = FirebaseFirestore.SetOptions;
import Timestamp = FirebaseFirestore.Timestamp;
import Settings = FirebaseFirestore.Settings;

// This test verifies the Typescript typings and is not meant for execution.
xdescribe('firestore.d.ts', () => {
  const firestore: Firestore = new Firestore({
    keyFilename: 'foo',
    projectId: 'foo',
    timestampsInSnapshots: true,
    host: 'localhost',
    ssl: false,
    otherOption: 'foo',
  } as Settings);

  const precondition: Precondition = {lastUpdateTime: Timestamp.now()};
  const setOptions: SetOptions = {merge: true};
  const fieldPath: FieldPath = new FieldPath('foo');
  const docRef: DocumentReference = firestore.doc('coll/doc');
  const collRef: CollectionReference = firestore.collection('coll');
  const updateData: UpdateData = {};
  const documentData: DocumentData = {};

  FirebaseFirestore.setLogFunction(console.log);

  it('has typings for Firestore', () => {
    firestore.settings({
      keyFilename: 'foo',
      projectId: 'foo',
      timestampsInSnapshots: true,
      otherOption: 'foo',
    });
    const collRef: CollectionReference = firestore.collection('coll');
    const docRef1: DocumentReference = firestore.doc('coll/doc');
    const docRef2: DocumentReference = firestore.doc('coll/doc');
    const collectionGroup: Query = firestore.collectionGroup('collectionId');
    firestore.getAll(docRef1, docRef2).then((docs: DocumentSnapshot[]) => {});
    firestore
      .getAll(docRef1, docRef2, {})
      .then((docs: DocumentSnapshot[]) => {});
    firestore
      .getAll(docRef1, docRef2, {fieldMask: ['foo', new FieldPath('foo')]})
      .then((docs: DocumentSnapshot[]) => {});
    firestore
      .listCollections()
      .then((collections: CollectionReference[]) => {});
    const transactionResult: Promise<string> = firestore.runTransaction(
      (updateFunction: Transaction) => {
        return Promise.resolve('string');
      }
    );
    const batch: WriteBatch = firestore.batch();
  });

  it('has typings for GeoPoint', () => {
    const geoPoint: GeoPoint = new GeoPoint(90.0, 90.0);
    const latitude: number = geoPoint.latitude;
    const longitude: number = geoPoint.longitude;
    const equals: boolean = geoPoint.isEqual(geoPoint);
  });

  it('has typings for Transaction', () => {
    return firestore.runTransaction((transaction: Transaction) => {
      transaction.get(collRef).then((snapshot: QuerySnapshot) => {});
      transaction.get(docRef).then((doc: DocumentSnapshot) => {});
      transaction.getAll(docRef, docRef).then((docs: DocumentSnapshot[]) => {});
      transaction = transaction.create(docRef, documentData);
      transaction = transaction.set(docRef, documentData);
      transaction = transaction.set(docRef, documentData, setOptions);
      transaction = transaction.update(docRef, updateData);
      transaction = transaction.update(docRef, updateData, precondition);
      transaction = transaction.update(docRef, 'foo', 'bar');
      transaction = transaction.update(docRef, 'foo', 'bar', precondition);
      transaction = transaction.update(docRef, new FieldPath('foo'), 'bar');
      transaction = transaction.update(
        docRef,
        new FieldPath('foo'),
        'bar',
        precondition
      );
      transaction = transaction.delete(docRef);
      transaction = transaction.delete(docRef, precondition);
      return Promise.resolve();
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
    batch.commit().then((result: FirebaseFirestore.WriteResult[]) => {});
  });

  it('has typings for WriteResult', () => {
    docRef.set(documentData).then((result: FirebaseFirestore.WriteResult) => {
      const writeTime: Timestamp = result.writeTime;
      const equals: boolean = result.isEqual(result);
    });
  });

  it('has typings for FieldPath', () => {
    const path1: FieldPath = new FieldPath('a');
    const path2: FieldPath = new FieldPath('a', 'b');
    const path3: FieldPath = FieldPath.documentId();
    const equals: boolean = path1.isEqual(path2);
  });

  it('has typings for DocumentReference', () => {
    const id: string = docRef.id;
    const firestore: FirebaseFirestore.Firestore = docRef.firestore;
    const parent: CollectionReference = docRef.parent;
    const path: string = docRef.path;
    const subcollection: CollectionReference = docRef.collection('coll');
    docRef.listCollections().then((collections: CollectionReference[]) => {});
    docRef.get().then((snapshot: DocumentSnapshot) => {});
    docRef
      .create(documentData)
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef
      .set(documentData)
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef
      .set(documentData, setOptions)
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef
      .update(updateData)
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef
      .update(updateData, precondition)
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef
      .update('foo', 'bar')
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef
      .update('foo', 'bar', precondition)
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef
      .update(new FieldPath('foo'), 'bar')
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef
      .update(new FieldPath('foo'), 'bar', precondition)
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef.delete().then((writeResult: FirebaseFirestore.WriteResult) => {});
    docRef
      .delete(precondition)
      .then((writeResult: FirebaseFirestore.WriteResult) => {});
    let unsubscribe: () => void = docRef.onSnapshot(
      (snapshot: DocumentSnapshot) => {}
    );
    unsubscribe = docRef.onSnapshot(
      (snapshot: DocumentSnapshot) => {},
      (error: Error) => {}
    );
    const equals: boolean = docRef.isEqual(docRef);
  });

  it('has typings for DocumentSnapshot', () => {
    docRef.get().then((snapshot: DocumentSnapshot) => {
      const exists: boolean = snapshot.exists;
      const ref: DocumentReference = snapshot.ref;
      const id: string = snapshot.id;
      const readTime: Timestamp = snapshot.readTime;
      const updateTime: Timestamp = snapshot.updateTime!;
      const createTime: Timestamp = snapshot.createTime!;
      const data: DocumentData = snapshot.data()!;
      let value = snapshot.get('foo');
      value = snapshot.get(new FieldPath('foo'));
      const equals: boolean = snapshot.isEqual(snapshot);
    });
  });

  it('has typings for QueryDocumentSnapshot', () => {
    collRef.get().then((querySnapshot: QuerySnapshot) => {
      const snapshot: QueryDocumentSnapshot = querySnapshot.docs[0];
      const exists: boolean = snapshot.exists;
      const ref: DocumentReference = snapshot.ref;
      const id: string = snapshot.id;
      const readTime: Timestamp = snapshot.readTime;
      const updateTime: Timestamp = snapshot.updateTime;
      const createTime: Timestamp = snapshot.createTime;
      const data: DocumentData = snapshot.data();
      let value = snapshot.get('foo');
      value = snapshot.get(new FieldPath('foo'));
      const equals: boolean = snapshot.isEqual(snapshot);
    });
  });

  it('has typings for Query', () => {
    let query: Query = collRef;
    const firestore: FirebaseFirestore.Firestore = collRef.firestore;
    docRef.get().then((snapshot: DocumentSnapshot) => {
      query = query.where('foo', '<', 'bar');
      query = query.where('foo', '<=', 'bar');
      query = query.where('foo', '==', 'bar');
      query = query.where('foo', '>=', 'bar');
      query = query.where('foo', '>', 'bar');
      query = query.where('foo', 'array-contains', 'bar');
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
      query.get().then((results: QuerySnapshot) => {});
      query.stream().on('data', () => {});
      let unsubscribe: () => void = query.onSnapshot(
        (snapshot: QuerySnapshot) => {}
      );
      unsubscribe = query.onSnapshot(
        (snapshot: QuerySnapshot) => {},
        (error: Error) => {}
      );
      const equals: boolean = query.isEqual(query);
    });
  });

  it('has typings for QuerySnapshot', () => {
    collRef.get().then((snapshot: QuerySnapshot) => {
      const query: Query = snapshot.query;
      const docChanges: DocumentChange[] = snapshot.docChanges();
      const docs: QueryDocumentSnapshot[] = snapshot.docs;
      const size: number = snapshot.size;
      const empty: boolean = snapshot.empty;
      const readTime: Timestamp = snapshot.readTime;
      snapshot.forEach((result: QueryDocumentSnapshot) => {});
      snapshot.forEach((result: QueryDocumentSnapshot) => {}, {});
      const equals: boolean = snapshot.isEqual(snapshot);
    });
  });

  it('has typings for DocumentChange', () => {
    collRef.get().then((snapshot: QuerySnapshot) => {
      const docChange: DocumentChange = snapshot.docChanges()[0];
      const doc: QueryDocumentSnapshot = docChange.doc;
      const oldIndex: number = docChange.oldIndex;
      const newIndex: number = docChange.newIndex;
      const equals: boolean = docChange.isEqual(docChange);
    });
  });

  it('has typings for CollectionReference', () => {
    const firestore: Firestore = collRef.firestore;
    const parent: DocumentReference | null = collRef.parent;
    const path: string = collRef.path;
    const id: string = collRef.id;
    const docRef1: DocumentReference = collRef.doc();
    const docRef2: DocumentReference = collRef.doc('doc');
    collRef.add(documentData).then((docRef: DocumentReference) => {});
    const list: Promise<DocumentReference[]> = collRef.listDocuments();
    const equals: boolean = collRef.isEqual(collRef);
  });

  it('has typings for FieldValue', () => {
    const documentData: UpdateData = {
      a: FieldValue.serverTimestamp(),
      b: FieldValue.delete(),
      c: FieldValue.arrayUnion('foo'),
      d: FieldValue.arrayRemove('bar'),
      e: FieldValue.increment(0),
    };
    const serverTimestamp: FieldValue = FieldValue.serverTimestamp();
    const deleteField: FieldValue = FieldValue.delete();
    const arrayUnion: FieldValue = FieldValue.arrayUnion('foo', 'bar');
    const arrayRemove: FieldValue = FieldValue.arrayRemove('foo', 'bar');
    const equals: boolean = FieldValue.serverTimestamp().isEqual(
      FieldValue.serverTimestamp()
    );
  });

  it('has typings for SetOptions', () => {
    const merge: SetOptions = {merge: true};
    const mergeFields: SetOptions = {mergeFields: ['foo', fieldPath]};
  });

  it('has typings for Timestamp', () => {
    let timestamp: Timestamp = new Timestamp(0, 0);
    timestamp = Timestamp.now();
    timestamp = Timestamp.fromDate(new Date());
    timestamp = Timestamp.fromMillis(0);
    const seconds: number = timestamp.seconds;
    const nanoseconds: number = timestamp.nanoseconds;
  });
});
