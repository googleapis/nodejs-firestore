// Copyright 2024 Google LLC
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

import * as protos from '../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;

import * as firestore from '@google-cloud/firestore';

import {VectorValue} from './field-value';
import {GeoPoint} from './geo-point';
import {FieldPath} from './path';
import {Pipeline} from './pipeline';
import {isFirestoreValue} from './pipeline-util';
import {DocumentReference} from './reference/document-reference';
import {Serializer} from './serializer';
import {Timestamp} from './timestamp';

/**
 * @beta
 *
 * An interface that represents a selectable expression.
 */
export interface Selectable {
  selectable: true;
}

/**
 * @beta
 *
 * An interface that represents a filter condition.
 */
export interface FilterCondition {
  filterable: true;
}

/**
 * @beta
 *
 * An interface that represents an accumulator.
 */
export interface Accumulator {
  accumulator: true;
}

/**
 * @beta
 *
 * An accumulator target, which is an expression with an alias that also implements the Accumulator interface.
 */
export type AccumulatorTarget = ExprWithAlias<Expr & Accumulator>;

/**
 * @beta
 *
 * A filter expression, which is an expression that also implements the FilterCondition interface.
 */
export type FilterExpr = Expr & FilterCondition;

/**
 * @beta
 *
 * A selectable expression, which is an expression that also implements the Selectable interface.
 */
export type SelectableExpr = Expr & Selectable;

/**
 * @beta
 *
 * An enumeration of the different types of expressions.
 */
export type ExprType =
  | 'Field'
  | 'Constant'
  | 'Function'
  | 'ListOfExprs'
  | 'ExprWithAlias';

/**
 * @beta
 *
 * Represents an expression that can be evaluated to a value within the execution of a {@link
 * Pipeline}.
 *
 * Expressions are the building blocks for creating complex queries and transformations in
 * Firestore pipelines. They can represent:
 *
 * - **Field references:** Access values from document fields.
 * - **Literals:** Represent constant values (strings, numbers, booleans).
 * - **Function calls:** Apply functions to one or more expressions.
 * - **Aggregations:** Calculate aggregate values (e.g., sum, average) over a set of documents.
 *
 * The `Expr` class provides a fluent API for building expressions. You can chain together
 * method calls to create complex expressions.
 */
export abstract class Expr {
  eq(other: any): Eq;
  eq(other: any): Eq {
    if (other instanceof Expr) {
      return new Eq(this, other);
    }
    return new Eq(this, Constant.of(other));
  }
  abstract _toProto(serializer: Serializer): api.IValue;
}

/**
 * @beta
 */
export class ExprWithAlias<T extends Expr> extends Expr implements Selectable {
  exprType: ExprType = 'ExprWithAlias';
  selectable = true as const;

  constructor(
    public expr: T,
    public alias: string
  ) {
    super();
  }

  _toProto(serializer: Serializer): api.IValue {
    throw new Error('ExprWithAlias should not be serialized directly.');
  }
}

/**
 * @internal
 */
class ListOfExprs extends Expr {
  exprType: ExprType = 'ListOfExprs';
  constructor(private exprs: Expr[]) {
    super();
  }

  _toProto(serializer: Serializer): api.IValue {
    return {
      arrayValue: {
        values: this.exprs.map(p => serializer.encodeValue(p)!),
      },
    };
  }
}

/**
 * @beta
 *
 * Represents a reference to a field in a Firestore document, or outputs of a {@link Pipeline} stage.
 *
 * <p>Field references are used to access document field values in expressions and to specify fields
 * for sorting, filtering, and projecting data in Firestore pipelines.
 *
 * <p>You can create a `Field` instance using the static {@link #of} method:
 *
 * ```typescript
 * // Create a Field instance for the 'name' field
 * const nameField = Field.of("name");
 *
 * // Create a Field instance for a nested field 'address.city'
 * const cityField = Field.of("address.city");
 * ```
 */
export class Field extends Expr implements Selectable {
  exprType: ExprType = 'Field';
  selectable = true as const;

  private constructor(
    private fieldPath: firestore.FieldPath,
    private pipeline: Pipeline | null = null
  ) {
    super();
  }

  /**
   * Creates a {@code Field} instance representing the field at the given path.
   *
   * The path can be a simple field name (e.g., "name") or a dot-separated path to a nested field
   * (e.g., "address.city").
   *
   * ```typescript
   * // Create a Field instance for the 'title' field
   * const titleField = Field.of("title");
   *
   * // Create a Field instance for a nested field 'author.firstName'
   * const authorFirstNameField = Field.of("author.firstName");
   * ```
   *
   * @param name The path to the field.
   * @return A new {@code Field} instance representing the specified field.
   */
  static of(name: string): Field;
  static of(path: firestore.FieldPath): Field;
  static of(nameOrPath: string | firestore.FieldPath): Field;
  static of(pipeline: Pipeline, name: string): Field;
  static of(
    pipelineOrName: Pipeline | string | firestore.FieldPath,
    name?: string
  ): Field {
    if (typeof pipelineOrName === 'string') {
      if (FieldPath.documentId().formattedName === pipelineOrName) {
        return new Field(new FieldPath('__path__'));
      }

      return new Field(FieldPath.fromArgument(pipelineOrName));
    } else if (pipelineOrName instanceof FieldPath) {
      if (FieldPath.documentId().isEqual(pipelineOrName)) {
        return new Field(new FieldPath('__path__'));
      }
      return new Field(pipelineOrName);
    } else {
      return new Field(
        FieldPath.fromArgument(name!),
        pipelineOrName as Pipeline
      );
    }
  }

  fieldName(): string {
    return (this.fieldPath as FieldPath).formattedName;
  }

  _toProto(serializer: Serializer): api.IValue {
    return {
      fieldReferenceValue: (this.fieldPath as FieldPath).formattedName,
    };
  }
}

/**
 * @beta
 */
export class Fields extends Expr implements Selectable {
  exprType: ExprType = 'Field';
  selectable = true as const;

  private constructor(private fields: Field[]) {
    super();
  }

  static of(name: string, ...others: string[]): Fields {
    return new Fields([Field.of(name), ...others.map(Field.of)]);
  }

  static ofAll(): Fields {
    return new Fields([]);
  }

  fieldList(): Field[] {
    return this.fields.map(f => f);
  }

  _toProto(serializer: Serializer): api.IValue {
    return {
      arrayValue: {
        values: this.fields.map(f => f._toProto(serializer)),
      },
    };
  }
}

/**
 * @beta
 *
 * Represents a constant value that can be used in a Firestore pipeline expression.
 *
 * You can create a `Constant` instance using the static {@link #of} method:
 *
 * ```typescript
 * // Create a Constant instance for the number 10
 * const ten = Constant.of(10);
 *
 * // Create a Constant instance for the string "hello"
 * const hello = Constant.of("hello");
 * ```
 */
export class Constant extends Expr {
  exprType: ExprType = 'Constant';

  private constructor(private value: any) {
    super();
  }

  /**
   * Creates a `Constant` instance for a number value.
   *
   * @param value The number value.
   * @return A new `Constant` instance.
   */
  static of(value: number): Constant;

  /**
   * Creates a `Constant` instance for a string value.
   *
   * @param value The string value.
   * @return A new `Constant` instance.
   */
  static of(value: string): Constant;

  /**
   * Creates a `Constant` instance for a boolean value.
   *
   * @param value The boolean value.
   * @return A new `Constant` instance.
   */
  static of(value: boolean): Constant;

  /**
   * Creates a `Constant` instance for a null value.
   *
   * @param value The null value.
   * @return A new `Constant` instance.
   */
  static of(value: null): Constant;

  /**
   * Creates a `Constant` instance for an undefined value.
   *
   * @param value The undefined value.
   * @return A new `Constant` instance.
   */
  static of(value: undefined): Constant;

  /**
   * Creates a `Constant` instance for a GeoPoint value.
   *
   * @param value The GeoPoint value.
   * @return A new `Constant` instance.
   */
  static of(value: GeoPoint): Constant;

  /**
   * Creates a `Constant` instance for a Timestamp value.
   *
   * @param value The Timestamp value.
   * @return A new `Constant` instance.
   */
  static of(value: Timestamp): Constant;

  /**
   * Creates a `Constant` instance for a Date value.
   *
   * @param value The Date value.
   * @return A new `Constant` instance.
   */
  static of(value: Date): Constant;

  /**
   * Creates a `Constant` instance for a Uint8Array value.
   *
   * @param value The Uint8Array value.
   * @return A new `Constant` instance.
   */
  static of(value: Uint8Array): Constant;

  /**
   * Creates a `Constant` instance for a DocumentReference value.
   *
   * @param value The DocumentReference value.
   * @return A new `Constant` instance.
   */
  static of(value: DocumentReference): Constant;

  /**
   * Creates a `Constant` instance for a Firestore proto value.
   *
   * @param value The Firestore proto value.
   * @return A new `Constant` instance.
   */
  static of(value: api.IValue): Constant;

  /**
   * Creates a `Constant` instance for an array value.
   *
   * @param value The array value.
   * @return A new `Constant` instance.
   */
  static of(value: Array<any>): Constant;

  /**
   * Creates a `Constant` instance for a map value.
   *
   * @param value The map value.
   * @return A new `Constant` instance.
   */
  static of(value: Map<string, any>): Constant;

  /**
   * Creates a `Constant` instance for a VectorValue value.
   *
   * @param value The VectorValue value.
   * @return A new `Constant` instance.
   */
  static of(value: VectorValue): Constant;

  /**
   * Creates a `Constant` instance for a Firestore proto value.
   *
   * @param value The Firestore proto value.
   * @return A new `Constant` instance.
   */
  static of(value: api.IValue): Constant;
  static of(value: any): Constant {
    return new Constant(value);
  }

  /**
   * Creates a `Constant` instance for a VectorValue value.
   *
   * ```typescript
   * // Create a Constant instance for a vector value
   * const vectorConstant = Constant.ofVector([1, 2, 3]);
   * ```
   *
   * @param value The VectorValue value.
   * @return A new `Constant` instance.
   */
  static vector(value: Array<number> | VectorValue): Constant {
    if (value instanceof VectorValue) {
      return new Constant(value);
    } else {
      return new Constant(new VectorValue(value));
    }
  }

  _toProto(serializer: Serializer): api.IValue {
    if (isFirestoreValue(this.value)) {
      return this.value;
    }

    return serializer.encodeValue(this.value)!;
  }
}

/**
 * @beta
 *
 * This class defines the base class for Firestore {@link Pipeline} functions, which can be evaluated within pipeline
 * execution.
 *
 * Typically, you would not use this class or its children directly. Use either the functions like {@link and}, {@link eq},
 * or the methods on {@link Expr} ({@link Expr#eq}, {@link Expr#lt}, etc) to construct new Function instances.
 */
export class Function extends Expr {
  exprType: ExprType = 'Function';
  constructor(
    private name: string,
    private params: Expr[]
  ) {
    super();
  }

  _toProto(serializer: Serializer): api.IValue {
    return {
      functionValue: {
        name: this.name,
        args: this.params.map(p => serializer.encodeValue(p)!),
      },
    };
  }
}

export class Eq extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('eq', [left, right]);
  }
  filterable = true as const;
}

export function eq(left: Expr, right: Expr): Eq;

/**
 * @beta
 *
 * Creates an expression that checks if an expression is equal to a constant value.
 *
 * ```typescript
 * // Check if the 'age' field is equal to 21
 * eq(Field.of("age"), 21);
 * ```
 *
 * @param left The expression to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the equality comparison.
 */
export function eq(left: Expr, right: any): Eq;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is equal to an expression.
 *
 * ```typescript
 * // Check if the 'age' field is equal to the 'limit' field
 * eq("age", Field.of("limit"));
 * ```
 *
 * @param left The field name to compare.
 * @param right The expression to compare to.
 * @return A new `Expr` representing the equality comparison.
 */
export function eq(left: string, right: Expr): Eq;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is equal to a constant value.
 *
 * ```typescript
 * // Check if the 'city' field is equal to string constant "London"
 * eq("city", "London");
 * ```
 *
 * @param left The field name to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the equality comparison.
 */
export function eq(left: string, right: any): Eq;
export function eq(left: Expr | string, right: any): Eq {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Eq(leftExpr, rightExpr);
}

export function genericFunction(name: string, params: Expr[]): Function {
  return new Function(name, params);
}

/**
 * @beta
 *
 * Creates an {@link Ordering} that sorts documents in ascending order based on this expression.
 *
 * ```typescript
 * // Sort documents by the 'name' field in ascending order
 * firestore.pipeline().collection("users")
 *   .sort(ascending(Field.of("name")));
 * ```
 *
 * @param expr The expression to create an ascending ordering for.
 * @return A new `Ordering` for ascending sorting.
 */
export function ascending(expr: Expr): Ordering {
  return new Ordering(expr, 'ascending');
}

/**
 * @beta
 *
 * Creates an {@link Ordering} that sorts documents in descending order based on this expression.
 *
 * ```typescript
 * // Sort documents by the 'createdAt' field in descending order
 * firestore.pipeline().collection("users")
 *   .sort(descending(Field.of("createdAt")));
 * ```
 *
 * @param expr The expression to create a descending ordering for.
 * @return A new `Ordering` for descending sorting.
 */
export function descending(expr: Expr): Ordering {
  return new Ordering(expr, 'descending');
}

/**
 * @beta
 *
 * Represents an ordering criterion for sorting documents in a Firestore pipeline.
 *
 * You create `Ordering` instances using the `ascending` and `descending` helper functions.
 */
export class Ordering {
  constructor(
    private expr: Expr,
    private direction: 'ascending' | 'descending'
  ) {}

  _toProto(serializer: Serializer): api.IValue {
    return {
      mapValue: {
        fields: {
          direction: serializer.encodeValue(this.direction)!,
          expression: serializer.encodeValue(this.expr)!,
        },
      },
    };
  }
}
