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
    neverCall<Promise<MyModelType>>(async docRef => {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      return snapshot.data()!;
    });
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
    neverCall<Promise<MyModelType>>(async docRef => {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      return snapshot.data()!;
    });
  });

  it("has the additional 'merge' version of toFirestore()", () => {
    interface MyModelType {
      stringProperty: string;
      numberProperty: number;
    }
    const converter: FirestoreDataConverter<MyModelType, DocumentData> = {
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
    neverCall<Promise<MyModelType>>(async docRef => {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      return snapshot.data()!;
    });
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
    neverCall<Promise<MyModelType>>(async docRef => {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      return snapshot.data()!;
    });
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
    neverCall<Promise<MyModelType>>(async docRef => {
      const newDocRef = docRef.withConverter(converter);
      await newDocRef.set({stringProperty: 'foo', numberProperty: 42});
      await newDocRef.update({a: 'newFoo', b: 43});
      const snapshot = await newDocRef.get();
      return snapshot.data()!;
    });
  });

  it('DocumentReference.set() fails to compile if AppModelType argument is missing properties', () =>
    neverCall(async docRef => {
      const converter = fakeConverter<{foo: string}, {}>();
      const docRefWithConverter = docRef.withConverter(converter);
      // @ts-expect-error The `foo` property declared in AppModelType is missing.
      await docRefWithConverter.set({});
    }));

  it('DocumentReference.set() fails to compile if AppModelType argument contains undeclared properties', () =>
    neverCall(async docRef => {
      const converter = fakeConverter<{foo: string}, {bar: number}>();
      const docRefWithConverter = docRef.withConverter(converter);
      // @ts-expect-error The `bar` property is not declared in AppModelType.
      await docRefWithConverter.set({foo: 'foo', bar: 42});
    }));

  it('DocumentReference.set() fails to compile if AppModelType argument contains a property with an incorrect type', () =>
    neverCall(async docRef => {
      const converter = fakeConverter<{foo: string}, {foo: number}>();
      const docRefWithConverter = docRef.withConverter(converter);
      // @ts-expect-error The `foo` property is declared as `string` in
      //  AppModelType, but a `number` is specified.
      await docRefWithConverter.set({foo: 42});
    }));

  it('DocumentReference.update() successfully compiles even if DbModelType argument is missing properties', () =>
    neverCall(async docRef => {
      const converter = fakeConverter<{foo: string}, {bar: number}>();
      const docRefWithConverter = docRef.withConverter(converter);
      await docRefWithConverter.update({});
    }));

  it('DocumentReference.update() fails to compile if DbModelType argument contains undeclared properties', () =>
    neverCall(async docRef => {
      const converter = fakeConverter<{foo: string}, {bar: number}>();
      const docRefWithConverter = docRef.withConverter(converter);
      // @ts-expect-error The `foo` property is not declared in DbModelType.
      await docRefWithConverter.update({foo: 'foo', bar: 42});
    }));

  it('DocumentReference.update() fails to compile if DbModelType argument contains a property with an incorrect type', () =>
    neverCall(async docRef => {
      const converter = fakeConverter<{foo: string}, {foo: number}>();
      const docRefWithConverter = docRef.withConverter(converter);
      // @ts-expect-error The `foo` property is declared as `number` in
      //  DbModelType, but a `string` is specified.
      await docRefWithConverter.update({foo: 'foo'});
    }));

  it('DocumentReference.get() returns AppModelType', () =>
    neverCall<Promise<{foo: string}>>(async docRef => {
      const converter = fakeConverter<{foo: string}, {bar: number}>();
      const docRefWithConverter = docRef.withConverter(converter);
      const snapshot = await docRefWithConverter.get();
      return snapshot.data()!;
    }));
});

/**
 * Does nothing; however, this function can be useful in tests that only check
 * the compile-time behavior of the TypeScript compiler. For example, a test
 * that ensures that a certain statement successfully compiles could pass the
 * code block to this function to exercise the compiler but the code will not
 * actually be executed at runtime.
 */
function neverCall<T>(_: (docRef: DocumentReference) => T): void {
  _; // Trick eslint into thinking that `_` is used.
}

/**
 * Does nothing; this function does not actually exist but is merely _declared_
 * to exist. This facilitates creating variables typed as FirestoreDataConverter
 * with the given type parameters at compile time. This can be useful in tests
 * that only check compile-time behavior of the TypeScript compiler but don't
 * actually get executed at runtime.
 */
declare function fakeConverter<
  AppModelType,
  DbModelType extends DocumentData,
>(): FirestoreDataConverter<AppModelType, DbModelType>;
