// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {expect} from 'chai';
import {
  QueryDocumentSnapshot,
  DocumentReference,
  WithFieldValue,
  DocumentData,
  PartialWithFieldValue,
  FirestoreDataConverter,
  SetOptions,
} from '@google-cloud/firestore';
describe('FirestoreTypeConverter', () => {
  it('converter has the minimal typing information', () => {
    interface MyModelType {
      stringProperty: string;
      numberProperty: number;
    }
    const converter = {
      toFirestore(obj: MyModelType) {
        return {a: obj.stringProperty, b: obj.numberProperty};
      },
      fromFirestore(snapshot: QueryDocumentSnapshot) {
        return {
          stringProperty: snapshot.data().a,
          numberProperty: snapshot.data().b,
        };
      },
    };
    // The intent of the function below is to test TypeScript compile and not execute.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function _(docRef: DocumentReference): Promise<void> {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      const data: MyModelType = snapshot.data()!;
      expect(data.stringProperty).to.equal('newFoo');
      expect(data.numberProperty).to.equal(43);
    }
  });

  it('converter has the minimal typing information plus return types', () => {
    interface MyModelType {
      stringProperty: string;
      numberProperty: number;
    }
    const converter = {
      toFirestore(obj: WithFieldValue<MyModelType>): DocumentData {
        return {a: obj.stringProperty, b: obj.numberProperty};
      },
      fromFirestore(snapshot: QueryDocumentSnapshot): MyModelType {
        return {
          stringProperty: snapshot.data().a,
          numberProperty: snapshot.data().b,
        };
      },
    };
    // The intent of the function below is to test TypeScript compile and not execute.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function _(docRef: DocumentReference): Promise<void> {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      const data: MyModelType = snapshot.data()!;
      expect(data.stringProperty).to.equal('newFoo');
      expect(data.numberProperty).to.equal(43);
    }
  });

  it("has the additional 'merge' version of toFirestore()", () => {
    interface MyModelType {
      stringProperty: string;
      numberProperty: number;
    }
    const converter = {
      toFirestore(
        modelObject: PartialWithFieldValue<MyModelType>,
        options?: SetOptions
      ): DocumentData {
        if (options === undefined) {
          return {
            a: modelObject.stringProperty,
            b: modelObject.numberProperty,
          };
        }
        const result: DocumentData = {};
        if ('stringProperty' in modelObject) {
          result.a = modelObject.stringProperty;
        }
        if ('numberProperty' in modelObject) {
          result.b = modelObject.numberProperty;
        }
        return result;
      },
      fromFirestore(snapshot: QueryDocumentSnapshot): MyModelType {
        return {
          stringProperty: snapshot.data().a,
          numberProperty: snapshot.data().b,
        };
      },
    };
    // The intent of the function below is to test TypeScript compile and not execute.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function _(docRef: DocumentReference): Promise<void> {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      const data: MyModelType = snapshot.data()!;
      expect(data.stringProperty).to.equal('newFoo');
      expect(data.numberProperty).to.equal(43);
    }
  });

  it('converter is explicitly typed as FirestoreDataConverter<T>', () => {
    interface MyModelType {
      stringProperty: string;
      numberProperty: number;
    }
    const converter: FirestoreDataConverter<MyModelType> = {
      toFirestore(obj: WithFieldValue<MyModelType>) {
        return {a: obj.stringProperty, b: obj.numberProperty};
      },
      fromFirestore(snapshot: QueryDocumentSnapshot) {
        return {
          stringProperty: snapshot.data().a,
          numberProperty: snapshot.data().b,
        };
      },
    };
    // The intent of the function below is to test TypeScript compile and not execute.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function _(docRef: DocumentReference): Promise<void> {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      const data: MyModelType = snapshot.data()!;
      expect(data.stringProperty).to.equal('newFoo');
      expect(data.numberProperty).to.equal(43);
    }
  });

  it('converter is explicitly typed as FirestoreDataConverter<T, U>', () => {
    interface MyModelType {
      stringProperty: string;
      numberProperty: number;
    }
    interface MyDbType {
      a: string;
      b: number;
    }
    const converter: FirestoreDataConverter<MyModelType, MyDbType> = {
      toFirestore(obj: WithFieldValue<MyModelType>) {
        return {a: obj.stringProperty, b: obj.numberProperty};
      },
      fromFirestore(snapshot: QueryDocumentSnapshot) {
        return {
          stringProperty: snapshot.data().a,
          numberProperty: snapshot.data().b,
        };
      },
    };
    // The intent of the function below is to test TypeScript compile and not execute.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function _(docRef: DocumentReference): Promise<void> {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      const data: MyModelType = snapshot.data()!;
      expect(data.stringProperty).to.equal('newFoo');
      expect(data.numberProperty).to.equal(43);
    }
  });
});
