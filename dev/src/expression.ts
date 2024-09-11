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
export abstract class Expr implements firestore.Expr {
  /**
   * Creates an expression that adds this expression to another expression.
   *
   * ```typescript
   * // Add the value of the 'quantity' field and the 'reserve' field.
   * Field.of("quantity").add(Field.of("reserve"));
   * ```
   *
   * @param other The expression to add to this expression.
   * @return A new `Expr` representing the addition operation.
   */
  add(other: firestore.Expr): Add;

  /**
   * Creates an expression that adds this expression to a constant value.
   *
   * ```typescript
   * // Add 5 to the value of the 'age' field
   * Field.of("age").add(5);
   * ```
   *
   * @param other The constant value to add.
   * @return A new `Expr` representing the addition operation.
   */
  add(other: any): Add;
  add(other: any): Add {
    if (other instanceof Expr) {
      return new Add(this, other);
    }
    return new Add(this, Constant.of(other));
  }

  /**
   * Creates an expression that subtracts another expression from this expression.
   *
   * ```typescript
   * // Subtract the 'discount' field from the 'price' field
   * Field.of("price").subtract(Field.of("discount"));
   * ```
   *
   * @param other The expression to subtract from this expression.
   * @return A new `Expr` representing the subtraction operation.
   */
  subtract(other: firestore.Expr): Subtract;

  /**
   * Creates an expression that subtracts a constant value from this expression.
   *
   * ```typescript
   * // Subtract 20 from the value of the 'total' field
   * Field.of("total").subtract(20);
   * ```
   *
   * @param other The constant value to subtract.
   * @return A new `Expr` representing the subtraction operation.
   */
  subtract(other: any): Subtract;
  subtract(other: any): Subtract {
    if (other instanceof Expr) {
      return new Subtract(this, other);
    }
    return new Subtract(this, Constant.of(other));
  }

  /**
   * Creates an expression that multiplies this expression by another expression.
   *
   * ```typescript
   * // Multiply the 'quantity' field by the 'price' field
   * Field.of("quantity").multiply(Field.of("price"));
   * ```
   *
   * @param other The expression to multiply by.
   * @return A new `Expr` representing the multiplication operation.
   */
  multiply(other: firestore.Expr): Multiply;

  /**
   * Creates an expression that multiplies this expression by a constant value.
   *
   * ```typescript
   * // Multiply the 'value' field by 2
   * Field.of("value").multiply(2);
   * ```
   *
   * @param other The constant value to multiply by.
   * @return A new `Expr` representing the multiplication operation.
   */
  multiply(other: any): Multiply;
  multiply(other: any): Multiply {
    if (other instanceof Expr) {
      return new Multiply(this, other);
    }
    return new Multiply(this, Constant.of(other));
  }

  /**
   * Creates an expression that divides this expression by another expression.
   *
   * ```typescript
   * // Divide the 'total' field by the 'count' field
   * Field.of("total").divide(Field.of("count"));
   * ```
   *
   * @param other The expression to divide by.
   * @return A new `Expr` representing the division operation.
   */
  divide(other: firestore.Expr): Divide;

  /**
   * Creates an expression that divides this expression by a constant value.
   *
   * ```typescript
   * // Divide the 'value' field by 10
   * Field.of("value").divide(10);
   * ```
   *
   * @param other The constant value to divide by.
   * @return A new `Expr` representing the division operation.
   */
  divide(other: any): Divide;
  divide(other: any): Divide {
    if (other instanceof Expr) {
      return new Divide(this, other);
    }
    return new Divide(this, Constant.of(other));
  }

  /**
   * Creates an expression that checks if this expression is equal to another expression.
   *
   * ```typescript
   * // Check if the 'age' field is equal to 21
   * Field.of("age").eq(21);
   * ```
   *
   * @param other The expression to compare for equality.
   * @return A new `Expr` representing the equality comparison.
   */
  eq(other: firestore.Expr): Eq;

  /**
   * Creates an expression that checks if this expression is equal to a constant value.
   *
   * ```typescript
   * // Check if the 'city' field is equal to "London"
   * Field.of("city").eq("London");
   * ```
   *
   * @param other The constant value to compare for equality.
   * @return A new `Expr` representing the equality comparison.
   */
  eq(other: any): Eq;
  eq(other: any): Eq {
    if (other instanceof Expr) {
      return new Eq(this, other);
    }
    return new Eq(this, Constant.of(other));
  }

  /**
   * Creates an expression that checks if this expression is not equal to another expression.
   *
   * ```typescript
   * // Check if the 'status' field is not equal to "completed"
   * Field.of("status").neq("completed");
   * ```
   *
   * @param other The expression to compare for inequality.
   * @return A new `Expr` representing the inequality comparison.
   */
  neq(other: firestore.Expr): Neq;

  /**
   * Creates an expression that checks if this expression is not equal to a constant value.
   *
   * ```typescript
   * // Check if the 'country' field is not equal to "USA"
   * Field.of("country").neq("USA");
   * ```
   *
   * @param other The constant value to compare for inequality.
   * @return A new `Expr` representing the inequality comparison.
   */
  neq(other: any): Neq;
  neq(other: any): Neq {
    if (other instanceof Expr) {
      return new Neq(this, other);
    }
    return new Neq(this, Constant.of(other));
  }

  /**
   * Creates an expression that checks if this expression is less than another expression.
   *
   * ```typescript
   * // Check if the 'age' field is less than 'limit'
   * Field.of("age").lt(Field.of('limit'));
   * ```
   *
   * @param other The expression to compare for less than.
   * @return A new `Expr` representing the less than comparison.
   */
  lt(other: firestore.Expr): Lt;

  /**
   * Creates an expression that checks if this expression is less than a constant value.
   *
   * ```typescript
   * // Check if the 'price' field is less than 50
   * Field.of("price").lt(50);
   * ```
   *
   * @param other The constant value to compare for less than.
   * @return A new `Expr` representing the less than comparison.
   */
  lt(other: any): Lt;
  lt(other: any): Lt {
    if (other instanceof Expr) {
      return new Lt(this, other);
    }
    return new Lt(this, Constant.of(other));
  }

  /**
   * Creates an expression that checks if this expression is less than or equal to another
   * expression.
   *
   * ```typescript
   * // Check if the 'quantity' field is less than or equal to 20
   * Field.of("quantity").lte(Constant.of(20));
   * ```
   *
   * @param other The expression to compare for less than or equal to.
   * @return A new `Expr` representing the less than or equal to comparison.
   */
  lte(other: firestore.Expr): Lte;

  /**
   * Creates an expression that checks if this expression is less than or equal to a constant value.
   *
   * ```typescript
   * // Check if the 'score' field is less than or equal to 70
   * Field.of("score").lte(70);
   * ```
   *
   * @param other The constant value to compare for less than or equal to.
   * @return A new `Expr` representing the less than or equal to comparison.
   */
  lte(other: any): Lte;
  lte(other: any): Lte {
    if (other instanceof Expr) {
      return new Lte(this, other);
    }
    return new Lte(this, Constant.of(other));
  }

  /**
   * Creates an expression that checks if this expression is greater than another expression.
   *
   * ```typescript
   * // Check if the 'age' field is greater than the 'limit' field
   * Field.of("age").gt(Field.of("limit"));
   * ```
   *
   * @param other The expression to compare for greater than.
   * @return A new `Expr` representing the greater than comparison.
   */
  gt(other: firestore.Expr): Gt;

  /**
   * Creates an expression that checks if this expression is greater than a constant value.
   *
   * ```typescript
   * // Check if the 'price' field is greater than 100
   * Field.of("price").gt(100);
   * ```
   *
   * @param other The constant value to compare for greater than.
   * @return A new `Expr` representing the greater than comparison.
   */
  gt(other: any): Gt;
  gt(other: any): Gt {
    if (other instanceof Expr) {
      return new Gt(this, other);
    }
    return new Gt(this, Constant.of(other));
  }

  /**
   * Creates an expression that checks if this expression is greater than or equal to another
   * expression.
   *
   * ```typescript
   * // Check if the 'quantity' field is greater than or equal to field 'requirement' plus 1
   * Field.of("quantity").gte(Field.of('requirement').add(1));
   * ```
   *
   * @param other The expression to compare for greater than or equal to.
   * @return A new `Expr` representing the greater than or equal to comparison.
   */
  gte(other: firestore.Expr): Gte;

  /**
   * Creates an expression that checks if this expression is greater than or equal to a constant
   * value.
   *
   * ```typescript
   * // Check if the 'score' field is greater than or equal to 80
   * Field.of("score").gte(80);
   * ```
   *
   * @param other The constant value to compare for greater than or equal to.
   * @return A new `Expr` representing the greater than or equal to comparison.
   */
  gte(other: any): Gte;
  gte(other: any): Gte {
    if (other instanceof Expr) {
      return new Gte(this, other);
    }
    return new Gte(this, Constant.of(other));
  }

  /**
   * Creates an expression that concatenates an array expression with one or more other arrays.
   *
   * ```typescript
   * // Combine the 'items' array with another array field.
   * Field.of("items").arrayConcat(Field.of("otherItems"));
   * ```
   *
   * @param arrays The array expressions to concatenate.
   * @return A new `Expr` representing the concatenated array.
   */
  arrayConcat(arrays: firestore.Expr[]): ArrayConcat;

  /**
   * Creates an expression that concatenates an array expression with one or more other arrays.
   *
   * ```typescript
   * // Combine the 'tags' array with a new array and an array field
   * Field.of("tags").arrayConcat(Arrays.asList("newTag1", "newTag2"), Field.of("otherTag"));
   * ```
   *
   * @param arrays The array expressions or values to concatenate.
   * @return A new `Expr` representing the concatenated array.
   */
  arrayConcat(arrays: any[]): ArrayConcat;
  arrayConcat(arrays: any[]): ArrayConcat {
    const exprValues = arrays.map(value =>
      value instanceof Expr ? value : Constant.of(value)
    );
    return new ArrayConcat(this, exprValues);
  }

  /**
   * Creates an expression that checks if an array contains a specific element.
   *
   * ```typescript
   * // Check if the 'sizes' array contains the value from the 'selectedSize' field
   * Field.of("sizes").arrayContains(Field.of("selectedSize"));
   * ```
   *
   * @param element The element to search for in the array.
   * @return A new `Expr` representing the 'array_contains' comparison.
   */
  arrayContains(element: firestore.Expr): ArrayContains;

  /**
   * Creates an expression that checks if an array contains a specific value.
   *
   * ```typescript
   * // Check if the 'colors' array contains "red"
   * Field.of("colors").arrayContains("red");
   * ```
   *
   * @param element The element to search for in the array.
   * @return A new `Expr` representing the 'array_contains' comparison.
   */
  arrayContains(element: any): ArrayContains;
  arrayContains(element: any): ArrayContains {
    if (element instanceof Expr) {
      return new ArrayContains(this, element);
    }
    return new ArrayContains(this, Constant.of(element));
  }

  /**
   * Creates an expression that checks if an array contains all the specified elements.
   *
   * ```typescript
   * // Check if the 'tags' array contains both "news" and "sports"
   * Field.of("tags").arrayContainsAll(Field.of("tag1"), Field.of("tag2"));
   * ```
   *
   * @param values The elements to check for in the array.
   * @return A new `Expr` representing the 'array_contains_all' comparison.
   */
  arrayContainsAll(...values: firestore.Expr[]): ArrayContainsAll;

  /**
   * Creates an expression that checks if an array contains all the specified elements.
   *
   * ```typescript
   * // Check if the 'tags' array contains both of the values from field 'tag1' and "tag2"
   * Field.of("tags").arrayContainsAll(Field.of("tag1"), Field.of("tag2"));
   * ```
   *
   * @param values The elements to check for in the array.
   * @return A new `Expr` representing the 'array_contains_all' comparison.
   */
  arrayContainsAll(...values: any[]): ArrayContainsAll;
  arrayContainsAll(...values: any[]): ArrayContainsAll {
    const exprValues = values.map(value =>
      value instanceof Expr ? value : Constant.of(value)
    );
    return new ArrayContainsAll(this, exprValues);
  }

  /**
   * Creates an expression that checks if an array contains any of the specified elements.
   *
   * ```typescript
   * // Check if the 'categories' array contains either values from field "cate1" or "cate2"
   * Field.of("categories").arrayContainsAny(Field.of("cate1"), Field.of("cate2"));
   * ```
   *
   * @param values The elements to check for in the array.
   * @return A new `Expr` representing the 'array_contains_any' comparison.
   */
  arrayContainsAny(...values: firestore.Expr[]): ArrayContainsAny;

  /**
   * Creates an expression that checks if an array contains any of the specified elements.
   *
   * ```typescript
   * // Check if the 'groups' array contains either the value from the 'userGroup' field
   * // or the value "guest"
   * Field.of("groups").arrayContainsAny(Field.of("userGroup"), "guest");
   * ```
   *
   * @param values The elements to check for in the array.
   * @return A new `Expr` representing the 'array_contains_any' comparison.
   */
  arrayContainsAny(...values: any[]): ArrayContainsAny;
  arrayContainsAny(...values: any[]): ArrayContainsAny {
    const exprValues = values.map(value =>
      value instanceof Expr ? value : Constant.of(value)
    );
    return new ArrayContainsAny(this, exprValues);
  }

  /**
   * Creates an expression that filters elements from an array using the given {@link
   * FilterCondition} and returns the filtered elements as a new array.
   *
   * ```typescript
   * // Get items from the 'inventoryPrices' array where the array item is greater than 0
   * // Note we use {@link Function#arrayElement} to represent array elements to construct a
   * // filtering condition.
   * Field.of("inventoryPrices").arrayFilter(arrayElement().gt(0));
   * ```
   *
   * @param filter The {@link FilterCondition} to apply to the array elements.
   * @return A new `Expr` representing the filtered array.
   */
  arrayFilter(filter: firestore.FilterExpr): ArrayFilter {
    return new ArrayFilter(this, filter as unknown as FilterExpr);
  }

  /**
   * Creates an expression that calculates the length of an array.
   *
   * ```typescript
   * // Get the number of items in the 'cart' array
   * Field.of("cart").arrayLength();
   * ```
   *
   * @return A new `Expr` representing the length of the array.
   */
  arrayLength(): ArrayLength {
    return new ArrayLength(this);
  }

  /**
   * Creates an expression that applies a transformation function to each element in an array and
   * returns the new array as the result of the evaluation.
   *
   * ```typescript
   * // Convert all strings in the 'names' array to uppercase
   * Field.of("names").arrayTransform(arrayElement().toUppercase());
   * ```
   *
   * @param transform The {@link Function} to apply to each array element.
   * @return A new `Expr` representing the transformed array.
   */
  arrayTransform(transform: Function): ArrayTransform {
    return new ArrayTransform(this, transform);
  }

  /**
   * Creates an expression that checks if this expression is equal to any of the provided values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
   * Field.of("category").in("Electronics", Field.of("primaryType"));
   * ```
   *
   * @param others The values or expressions to check against.
   * @return A new `Expr` representing the 'IN' comparison.
   */
  in(...others: firestore.Expr[]): In;

  /**
   * Creates an expression that checks if this expression is equal to any of the provided values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
   * Field.of("category").in("Electronics", Field.of("primaryType"));
   * ```
   *
   * @param others The values or expressions to check against.
   * @return A new `Expr` representing the 'IN' comparison.
   */
  in(...others: any[]): In;
  in(...others: any[]): In {
    const exprOthers = others.map(other =>
      other instanceof Expr ? other : Constant.of(other)
    );
    return new In(this, exprOthers);
  }

  /**
   * Creates an expression that checks if this expression evaluates to 'NaN' (Not a Number).
   *
   * ```typescript
   * // Check if the result of a calculation is NaN
   * Field.of("value").divide(0).isNaN();
   * ```
   *
   * @return A new `Expr` representing the 'isNaN' check.
   */
  isNaN(): IsNan {
    return new IsNan(this);
  }

  /**
   * Creates an expression that checks if a field exists in the document.
   *
   * ```typescript
   * // Check if the document has a field named "phoneNumber"
   * Field.of("phoneNumber").exists();
   * ```
   *
   * @return A new `Expr` representing the 'exists' check.
   */
  exists(): Exists {
    return new Exists(this);
  }

  /**
   * Creates an expression that calculates the length of a string.
   *
   * ```typescript
   * // Get the length of the 'name' field
   * Field.of("name").strLength();
   * ```
   *
   * @return A new `Expr` representing the length of the string.
   */
  strLength(): StrLength {
    return new StrLength(this);
  }

  /**
   * Creates an expression that performs a case-sensitive string comparison.
   *
   * ```typescript
   * // Check if the 'title' field contains the word "guide" (case-sensitive)
   * Field.of("title").like("%guide%");
   * ```
   *
   * @param pattern The pattern to search for. You can use "%" as a wildcard character.
   * @return A new `Expr` representing the 'like' comparison.
   */
  like(pattern: string): Like;

  /**
   * Creates an expression that performs a case-sensitive string comparison.
   *
   * ```typescript
   * // Check if the 'title' field contains the word "guide" (case-sensitive)
   * Field.of("title").like("%guide%");
   * ```
   *
   * @param pattern The pattern to search for. You can use "%" as a wildcard character.
   * @return A new `Expr` representing the 'like' comparison.
   */
  like(pattern: firestore.Expr): Like;
  like(stringOrExpr: string | firestore.Expr): Like {
    if (stringOrExpr instanceof Expr) {
      return new Like(this, stringOrExpr);
    }
    return new Like(this, Constant.of(stringOrExpr as string));
  }

  /**
   * Creates an expression that checks if a string contains a specified regular expression as a
   * substring.
   *
   * ```typescript
   * // Check if the 'description' field contains "example" (case-insensitive)
   * Field.of("description").regexContains("(?i)example");
   * ```
   *
   * @param pattern The regular expression to use for the search.
   * @return A new `Expr` representing the 'contains' comparison.
   */
  regexContains(pattern: string): RegexContains;

  /**
   * Creates an expression that checks if a string contains a specified regular expression as a
   * substring.
   *
   * ```typescript
   * // Check if the 'description' field contains the regular expression stored in field 'regex'
   * Field.of("description").regexContains(Field.of("regex"));
   * ```
   *
   * @param pattern The regular expression to use for the search.
   * @return A new `Expr` representing the 'contains' comparison.
   */
  regexContains(pattern: firestore.Expr): RegexContains;
  regexContains(stringOrExpr: string | firestore.Expr): RegexContains {
    if (stringOrExpr instanceof Expr) {
      return new RegexContains(this, stringOrExpr);
    }
    return new RegexContains(this, Constant.of(stringOrExpr as string));
  }

  /**
   * Creates an expression that checks if a string matches a specified regular expression.
   *
   * ```typescript
   * // Check if the 'email' field matches a valid email pattern
   * Field.of("email").regexMatch("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
   * ```
   *
   * @param pattern The regular expression to use for the match.
   * @return A new `Expr` representing the regular expression match.
   */
  regexMatch(pattern: string): RegexMatch;

  /**
   * Creates an expression that checks if a string matches a specified regular expression.
   *
   * ```typescript
   * // Check if the 'email' field matches a regular expression stored in field 'regex'
   * Field.of("email").regexMatch(Field.of("regex"));
   * ```
   *
   * @param pattern The regular expression to use for the match.
   * @return A new `Expr` representing the regular expression match.
   */
  regexMatch(pattern: firestore.Expr): RegexMatch;
  regexMatch(stringOrExpr: string | firestore.Expr): RegexMatch {
    if (stringOrExpr instanceof Expr) {
      return new RegexMatch(this, stringOrExpr);
    }
    return new RegexMatch(this, Constant.of(stringOrExpr as string));
  }

  /**
   * Creates an expression that checks if a string starts with a given prefix.
   *
   * ```typescript
   * // Check if the 'name' field starts with "Mr."
   * Field.of("name").startsWith("Mr.");
   * ```
   *
   * @param prefix The prefix to check for.
   * @return A new `Expr` representing the 'starts with' comparison.
   */
  startsWith(prefix: string): StartsWith;

  /**
   * Creates an expression that checks if a string starts with a given prefix (represented as an
   * expression).
   *
   * ```typescript
   * // Check if the 'fullName' field starts with the value of the 'firstName' field
   * Field.of("fullName").startsWith(Field.of("firstName"));
   * ```
   *
   * @param prefix The prefix expression to check for.
   * @return A new `Expr` representing the 'starts with' comparison.
   */
  startsWith(prefix: firestore.Expr): StartsWith;
  startsWith(stringOrExpr: string | firestore.Expr): StartsWith {
    if (stringOrExpr instanceof Expr) {
      return new StartsWith(this, stringOrExpr);
    }
    return new StartsWith(this, Constant.of(stringOrExpr as string));
  }

  /**
   * Creates an expression that checks if a string ends with a given postfix.
   *
   * ```typescript
   * // Check if the 'filename' field ends with ".txt"
   * Field.of("filename").endsWith(".txt");
   * ```
   *
   * @param suffix The postfix to check for.
   * @return A new `Expr` representing the 'ends with' comparison.
   */
  endsWith(suffix: string): EndsWith;

  /**
   * Creates an expression that checks if a string ends with a given postfix (represented as an
   * expression).
   *
   * ```typescript
   * // Check if the 'url' field ends with the value of the 'extension' field
   * Field.of("url").endsWith(Field.of("extension"));
   * ```
   *
   * @param suffix The postfix expression to check for.
   * @return A new `Expr` representing the 'ends with' comparison.
   */
  endsWith(suffix: firestore.Expr): EndsWith;
  endsWith(stringOrExpr: string | firestore.Expr): EndsWith {
    if (stringOrExpr instanceof Expr) {
      return new EndsWith(this, stringOrExpr);
    }
    return new EndsWith(this, Constant.of(stringOrExpr as string));
  }

  /**
   * Creates an expression that converts a string to lowercase.
   *
   * ```typescript
   * // Convert the 'name' field to lowercase
   * Field.of("name").toLowerCase();
   * ```
   *
   * @return A new `Expr` representing the lowercase string.
   */
  toLowercase(): ToLowercase {
    return new ToLowercase(this);
  }

  /**
   * Creates an expression that converts a string to uppercase.
   *
   * ```typescript
   * // Convert the 'title' field to uppercase
   * Field.of("title").toUpperCase();
   * ```
   *
   * @return A new `Expr` representing the uppercase string.
   */
  toUppercase(): ToUppercase {
    return new ToUppercase(this);
  }

  /**
   * Creates an expression that removes leading and trailing whitespace from a string.
   *
   * ```typescript
   * // Trim whitespace from the 'userInput' field
   * Field.of("userInput").trim();
   * ```
   *
   * @return A new `Expr` representing the trimmed string.
   */
  trim(): Trim {
    return new Trim(this);
  }

  /**
   * Creates an expression that concatenates string expressions together.
   *
   * ```typescript
   * // Combine the 'firstName', " ", and 'lastName' fields into a single string
   * Field.of("firstName").strConcat(Constant.of(" "), Field.of("lastName"));
   * ```
   *
   * @param elements The expressions (typically strings) to concatenate.
   * @return A new `Expr` representing the concatenated string.
   */
  strConcat(...elements: (string | Expr)[]): StrConcat {
    const exprs = elements.map(e => (e instanceof Expr ? e : Constant.of(e)));
    return new StrConcat(this, exprs);
  }

  /**
   * Accesses a value from a map (object) field using the provided key.
   *
   * ```typescript
   * // Get the 'city' value from the 'address' map field
   * Field.of("address").mapGet("city");
   * ```
   *
   * @param subfield The key to access in the map.
   * @return A new `Expr` representing the value associated with the given key in the map.
   */
  mapGet(subfield: string): MapGet {
    return new MapGet(this, subfield);
  }

  /**
   * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
   * expression or field.
   *
   * ```typescript
   * // Count the total number of products
   * Field.of("productId").count().as("totalProducts");
   * ```
   *
   * @return A new `Accumulator` representing the 'count' aggregation.
   */
  count(): Count {
    return new Count(this, false);
  }

  /**
   * Creates an aggregation that calculates the sum of a numeric field across multiple stage inputs.
   *
   * ```typescript
   * // Calculate the total revenue from a set of orders
   * Field.of("orderAmount").sum().as("totalRevenue");
   * ```
   *
   * @return A new `Accumulator` representing the 'sum' aggregation.
   */
  sum(): Sum {
    return new Sum(this, false);
  }

  /**
   * Creates an aggregation that calculates the average (mean) of a numeric field across multiple
   * stage inputs.
   *
   * ```typescript
   * // Calculate the average age of users
   * Field.of("age").avg().as("averageAge");
   * ```
   *
   * @return A new `Accumulator` representing the 'avg' aggregation.
   */
  avg(): Avg {
    return new Avg(this, false);
  }

  /**
   * Creates an aggregation that finds the minimum value of a field across multiple stage inputs.
   *
   * ```typescript
   * // Find the lowest price of all products
   * Field.of("price").min().as("lowestPrice");
   * ```
   *
   * @return A new `Accumulator` representing the 'min' aggregation.
   */
  min(): Min {
    return new Min(this, false);
  }

  /**
   * Creates an aggregation that finds the maximum value of a field across multiple stage inputs.
   *
   * ```typescript
   * // Find the highest score in a leaderboard
   * Field.of("score").max().as("highestScore");
   * ```
   *
   * @return A new `Accumulator` representing the 'max' aggregation.
   */
  max(): Max {
    return new Max(this, false);
  }

  /**
   * Calculates the cosine distance between two vectors.
   *
   * ```typescript
   * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
   * Field.of("userVector").cosineDistance(Field.of("itemVector"));
   * ```
   *
   * @param other The other vector (represented as an Expr) to compare against.
   * @return A new `Expr` representing the cosine distance between the two vectors.
   */
  cosineDistance(other: firestore.Expr): CosineDistance;
  /**
   * Calculates the Cosine distance between two vectors.
   *
   * ```typescript
   * // Calculate the Cosine distance between the 'location' field and a target location
   * Field.of("location").cosineDistance(new VectorValue([37.7749, -122.4194]));
   * ```
   *
   * @param other The other vector (as a VectorValue) to compare against.
   * @return A new `Expr` representing the Cosine* distance between the two vectors.
   */
  cosineDistance(other: VectorValue): CosineDistance;
  /**
   * Calculates the Cosine distance between two vectors.
   *
   * ```typescript
   * // Calculate the Cosine distance between the 'location' field and a target location
   * Field.of("location").cosineDistance([37.7749, -122.4194]);
   * ```
   *
   * @param other The other vector (as an array of numbers) to compare against.
   * @return A new `Expr` representing the Cosine distance between the two vectors.
   */
  cosineDistance(other: number[]): CosineDistance;
  cosineDistance(
    other: firestore.Expr | firestore.VectorValue | number[]
  ): CosineDistance {
    if (other instanceof Expr) {
      return new CosineDistance(this, other);
    } else {
      return new CosineDistance(
        this,
        Constant.vector(other as VectorValue | number[])
      );
    }
  }

  /**
   * Calculates the dot product between two vectors.
   *
   * ```typescript
   * // Calculate the dot product between a feature vector and a target vector
   * Field.of("features").dotProduct([0.5, 0.8, 0.2]);
   * ```
   *
   * @param other The other vector (as an array of numbers) to calculate with.
   * @return A new `Expr` representing the dot product between the two vectors.
   */
  dotProduct(other: firestore.Expr): DotProduct;

  /**
   * Calculates the dot product between two vectors.
   *
   * ```typescript
   * // Calculate the dot product between a feature vector and a target vector
   * Field.of("features").dotProduct(new VectorValue([0.5, 0.8, 0.2]));
   * ```
   *
   * @param other The other vector (as an array of numbers) to calculate with.
   * @return A new `Expr` representing the dot product between the two vectors.
   */
  dotProduct(other: VectorValue): DotProduct;

  /**
   * Calculates the dot product between two vectors.
   *
   * ```typescript
   * // Calculate the dot product between a feature vector and a target vector
   * Field.of("features").dotProduct([0.5, 0.8, 0.2]);
   * ```
   *
   * @param other The other vector (as an array of numbers) to calculate with.
   * @return A new `Expr` representing the dot product between the two vectors.
   */
  dotProduct(other: number[]): DotProduct;
  dotProduct(
    other: firestore.Expr | firestore.VectorValue | number[]
  ): DotProduct {
    if (other instanceof Expr) {
      return new DotProduct(this, other);
    } else {
      return new DotProduct(
        this,
        Constant.vector(other as VectorValue | number[])
      );
    }
  }

  /**
   * Calculates the Euclidean distance between two vectors.
   *
   * ```typescript
   * // Calculate the Euclidean distance between the 'location' field and a target location
   * Field.of("location").euclideanDistance([37.7749, -122.4194]);
   * ```
   *
   * @param other The other vector (as an array of numbers) to calculate with.
   * @return A new `Expr` representing the Euclidean distance between the two vectors.
   */
  euclideanDistance(other: firestore.Expr): EuclideanDistance;

  /**
   * Calculates the Euclidean distance between two vectors.
   *
   * ```typescript
   * // Calculate the Euclidean distance between the 'location' field and a target location
   * Field.of("location").euclideanDistance(new VectorValue([37.7749, -122.4194]));
   * ```
   *
   * @param other The other vector (as a VectorValue) to compare against.
   * @return A new `Expr` representing the Euclidean distance between the two vectors.
   */
  euclideanDistance(other: VectorValue): EuclideanDistance;

  /**
   * Calculates the Euclidean distance between two vectors.
   *
   * ```typescript
   * // Calculate the Euclidean distance between the 'location' field and a target location
   * Field.of("location").euclideanDistance([37.7749, -122.4194]);
   * ```
   *
   * @param other The other vector (as an array of numbers) to compare against.
   * @return A new `Expr` representing the Euclidean distance between the two vectors.
   */
  euclideanDistance(other: number[]): EuclideanDistance;
  euclideanDistance(
    other: firestore.Expr | firestore.VectorValue | number[]
  ): EuclideanDistance {
    if (other instanceof Expr) {
      return new EuclideanDistance(this, other);
    } else {
      return new EuclideanDistance(
        this,
        Constant.vector(other as VectorValue | number[])
      );
    }
  }

  /**
   * Creates an {@link Ordering} that sorts documents in ascending order based on this expression.
   *
   * ```typescript
   * // Sort documents by the 'name' field in ascending order
   * firestore.pipeline().collection("users")
   *   .sort(Field.of("name").ascending());
   * ```
   *
   * @return A new `Ordering` for ascending sorting.
   */
  ascending(): Ordering {
    return ascending(this);
  }

  /**
   * Creates an {@link Ordering} that sorts documents in descending order based on this expression.
   *
   * ```typescript
   * // Sort documents by the 'createdAt' field in descending order
   * firestore.pipeline().collection("users")
   *   .sort(Field.of("createdAt").descending());
   * ```
   *
   * @return A new `Ordering` for descending sorting.
   */
  descending(): Ordering {
    return descending(this);
  }

  /**
   * Assigns an alias to this expression.
   *
   * Aliases are useful for renaming fields in the output of a stage or for giving meaningful
   * names to calculated values.
   *
   * ```typescript
   * // Calculate the total price and assign it the alias "totalPrice" and add it to the output.
   * firestore.pipeline().collection("items")
   *   .addFields(Field.of("price").multiply(Field.of("quantity")).as("totalPrice"));
   * ```
   *
   * @param name The alias to assign to this expression.
   * @return A new {@link ExprWithAlias} that wraps this
   *     expression and associates it with the provided alias.
   */
  as(name: string): ExprWithAlias<typeof this> {
    return new ExprWithAlias(this, name);
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
  static of(pipeline: firestore.Pipeline, name: string): Field;
  static of(
    pipelineOrName: firestore.Pipeline | string | firestore.FieldPath,
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
  static of(value: firestore.GeoPoint): Constant;

  /**
   * Creates a `Constant` instance for a Timestamp value.
   *
   * @param value The Timestamp value.
   * @return A new `Constant` instance.
   */
  static of(value: firestore.Timestamp): Constant;

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
  static of(value: firestore.DocumentReference): Constant;

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
  static of(value: firestore.VectorValue): Constant;

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
  static vector(value: Array<number> | firestore.VectorValue): Constant {
    if (value instanceof VectorValue) {
      return new Constant(value);
    } else {
      return new Constant(new VectorValue(value as Array<number>));
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

/**
 * @beta
 */
export class Add extends Function {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('add', [left, right]);
  }
}

/**
 * @beta
 */
export class Subtract extends Function {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('subtract', [left, right]);
  }
}

/**
 * @beta
 */
export class Multiply extends Function {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('multiply', [left, right]);
  }
}

/**
 * @beta
 */
export class Divide extends Function {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('divide', [left, right]);
  }
}

/**
 * @beta
 */
export class Eq extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('eq', [left, right]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class Neq extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('neq', [left, right]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class Lt extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('lt', [left, right]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class Lte extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('lte', [left, right]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class Gt extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('gt', [left, right]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class Gte extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('gte', [left, right]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class ArrayConcat extends Function {
  constructor(
    private array: Expr,
    private elements: Expr[]
  ) {
    super('array_concat', [array, ...elements]);
  }
}

/**
 * @beta
 */
class ArrayContains extends Function implements FilterCondition {
  constructor(
    private array: Expr,
    private element: Expr
  ) {
    super('array_contains', [array, element]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class ArrayContainsAll extends Function implements FilterCondition {
  constructor(
    private array: Expr,
    private values: Expr[]
  ) {
    super('array_contains_all', [array, new ListOfExprs(values)]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class ArrayContainsAny extends Function implements FilterCondition {
  constructor(
    private array: Expr,
    private values: Expr[]
  ) {
    super('array_contains_any', [array, new ListOfExprs(values)]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class ArrayFilter extends Function {
  constructor(
    private array: Expr,
    private filter: FilterExpr
  ) {
    super('array_filter', [array, filter]);
  }
}

/**
 * @beta
 */
class ArrayLength extends Function {
  constructor(private array: Expr) {
    super('array_length', [array]);
  }
}

/**
 * @beta
 */
class ArrayTransform extends Function {
  constructor(
    private array: Expr,
    private transform: Function
  ) {
    super('array_transform', [array, transform]);
  }
}

/**
 * @beta
 */
class ArrayElement extends Function {
  constructor() {
    super('array_element', []);
  }
}

/**
 * @beta
 */
class In extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private others: Expr[]
  ) {
    super('in', [left, new ListOfExprs(others)]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class IsNan extends Function implements FilterCondition {
  constructor(private expr: Expr) {
    super('is_nan', [expr]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class Exists extends Function implements FilterCondition {
  constructor(private expr: Expr) {
    super('exists', [expr]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class Not extends Function implements FilterCondition {
  constructor(private expr: Expr) {
    super('not', [expr]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class And extends Function implements FilterCondition {
  constructor(private conditions: FilterExpr[]) {
    super('and', conditions);
  }

  filterable = true as const;
}

/**
 * @beta
 */
class Or extends Function implements FilterCondition {
  constructor(private conditions: FilterExpr[]) {
    super('or', conditions);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class Xor extends Function implements FilterCondition {
  constructor(private conditions: FilterExpr[]) {
    super('xor', conditions);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class If extends Function implements FilterCondition {
  constructor(
    private condition: FilterExpr,
    private thenExpr: Expr,
    private elseExpr: Expr
  ) {
    super('if', [condition, thenExpr, elseExpr]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class StrLength extends Function {
  constructor(private expr: Expr) {
    super('length', [expr]);
  }
}

/**
 * @beta
 */
class Like extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private pattern: Expr
  ) {
    super('like', [expr, pattern]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class RegexContains extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private pattern: Expr
  ) {
    super('regex_contains', [expr, pattern]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class RegexMatch extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private pattern: Expr
  ) {
    super('regex_match', [expr, pattern]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class StartsWith extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private prefix: Expr
  ) {
    super('starts_with', [expr, prefix]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class EndsWith extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private suffix: Expr
  ) {
    super('ends_with', [expr, suffix]);
  }
  filterable = true as const;
}

/**
 * @beta
 */
class ToLowercase extends Function {
  constructor(private expr: Expr) {
    super('to_lowercase', [expr]);
  }
}

/**
 * @beta
 */
class ToUppercase extends Function {
  constructor(private expr: Expr) {
    super('to_uppercase', [expr]);
  }
}

/**
 * @beta
 */
class Trim extends Function {
  constructor(private expr: Expr) {
    super('trim', [expr]);
  }
}

/**
 * @beta
 */
class StrConcat extends Function {
  constructor(
    private first: Expr,
    private rest: Expr[]
  ) {
    super('str_concat', [first, ...rest]);
  }
}

/**
 * @beta
 */
class MapGet extends Function {
  constructor(map: Expr, name: string) {
    super('map_get', [map, Constant.of(name)]);
  }
}

/**
 * @beta
 */
class Count extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr | undefined,
    private distinct: boolean
  ) {
    super('count', value === undefined ? [] : [value]);
  }
}

/**
 * @beta
 */
class Sum extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('sum', [value]);
  }
}

/**
 * @beta
 */
class Avg extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('avg', [value]);
  }
}

/**
 * @beta
 */
class Min extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('min', [value]);
  }
}

/**
 * @beta
 */
class Max extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('max', [value]);
  }
}

/**
 * @beta
 */
class CosineDistance extends Function {
  constructor(
    private vector1: Expr,
    private vector2: Expr
  ) {
    super('cosine_distance', [vector1, vector2]);
  }
}

/**
 * @beta
 */
class DotProduct extends Function {
  constructor(
    private vector1: Expr,
    private vector2: Expr
  ) {
    super('dot_product', [vector1, vector2]);
  }
}

/**
 * @beta
 */
class EuclideanDistance extends Function {
  constructor(
    private vector1: Expr,
    private vector2: Expr
  ) {
    super('euclidean_distance', [vector1, vector2]);
  }
}

/**
 * @beta
 *
 * Creates an expression that adds two expressions together.
 *
 * ```typescript
 * // Add the value of the 'quantity' field and the 'reserve' field.
 * add(Field.of("quantity"), Field.of("reserve"));
 * ```
 *
 * @param left The first expression to add.
 * @param right The second expression to add.
 * @return A new {@code Expr} representing the addition operation.
 */
export function add(left: Expr, right: Expr): Add;

/**
 * @beta
 *
 * Creates an expression that adds an expression to a constant value.
 *
 * ```typescript
 * // Add 5 to the value of the 'age' field
 * add(Field.of("age"), 5);
 * ```
 *
 * @param left The expression to add to.
 * @param right The constant value to add.
 * @return A new {@code Expr} representing the addition operation.
 */
export function add(left: Expr, right: any): Add;

/**
 * @beta
 *
 * Creates an expression that adds a field's value to an expression.
 *
 * ```typescript
 * // Add the value of the 'quantity' field and the 'reserve' field.
 * add("quantity", Field.of("reserve"));
 * ```
 *
 * @param left The field name to add to.
 * @param right The expression to add.
 * @return A new {@code Expr} representing the addition operation.
 */
export function add(left: string, right: Expr): Add;

/**
 * @beta
 *
 * Creates an expression that adds a field's value to a constant value.
 *
 * ```typescript
 * // Add 5 to the value of the 'age' field
 * add("age", 5);
 * ```
 *
 * @param left The field name to add to.
 * @param right The constant value to add.
 * @return A new {@code Expr} representing the addition operation.
 */
export function add(left: string, right: any): Add;
export function add(left: Expr | string, right: Expr | any): Add {
  const normalizedLeft = typeof left === 'string' ? Field.of(left) : left;
  const normalizedRight = right instanceof Expr ? right : Constant.of(right);
  return new Add(normalizedLeft, normalizedRight);
}

/**
 * @beta
 *
 * Creates an expression that subtracts two expressions.
 *
 * ```typescript
 * // Subtract the 'discount' field from the 'price' field
 * subtract(Field.of("price"), Field.of("discount"));
 * ```
 *
 * @param left The expression to subtract from.
 * @param right The expression to subtract.
 * @return A new {@code Expr} representing the subtraction operation.
 */
export function subtract(left: Expr, right: Expr): Subtract;

/**
 * @beta
 *
 * Creates an expression that subtracts a constant value from an expression.
 *
 * ```typescript
 * // Subtract the constant value 2 from the 'value' field
 * subtract(Field.of("value"), 2);
 * ```
 *
 * @param left The expression to subtract from.
 * @param right The constant value to subtract.
 * @return A new {@code Expr} representing the subtraction operation.
 */
export function subtract(left: Expr, right: any): Subtract;

/**
 * @beta
 *
 * Creates an expression that subtracts an expression from a field's value.
 *
 * ```typescript
 * // Subtract the 'discount' field from the 'price' field
 * subtract("price", Field.of("discount"));
 * ```
 *
 * @param left The field name to subtract from.
 * @param right The expression to subtract.
 * @return A new {@code Expr} representing the subtraction operation.
 */
export function subtract(left: string, right: Expr): Subtract;

/**
 * @beta
 *
 * Creates an expression that subtracts a constant value from a field's value.
 *
 * ```typescript
 * // Subtract 20 from the value of the 'total' field
 * subtract("total", 20);
 * ```
 *
 * @param left The field name to subtract from.
 * @param right The constant value to subtract.
 * @return A new {@code Expr} representing the subtraction operation.
 */
export function subtract(left: string, right: any): Subtract;
export function subtract(left: Expr | string, right: Expr | any): Subtract {
  const normalizedLeft = typeof left === 'string' ? Field.of(left) : left;
  const normalizedRight = right instanceof Expr ? right : Constant.of(right);
  return new Subtract(normalizedLeft, normalizedRight);
}

/**
 * @beta
 *
 * Creates an expression that multiplies two expressions together.
 *
 * ```typescript
 * // Multiply the 'quantity' field by the 'price' field
 * multiply(Field.of("quantity"), Field.of("price"));
 * ```
 *
 * @param left The first expression to multiply.
 * @param right The second expression to multiply.
 * @return A new {@code Expr} representing the multiplication operation.
 */
export function multiply(left: Expr, right: Expr): Multiply;

/**
 * @beta
 *
 * Creates an expression that multiplies an expression by a constant value.
 *
 * ```typescript
 * // Multiply the value of the 'price' field by 2
 * multiply(Field.of("price"), 2);
 * ```
 *
 * @param left The expression to multiply.
 * @param right The constant value to multiply by.
 * @return A new {@code Expr} representing the multiplication operation.
 */
export function multiply(left: Expr, right: any): Multiply;

/**
 * @beta
 *
 * Creates an expression that multiplies a field's value by an expression.
 *
 * ```typescript
 * // Multiply the 'quantity' field by the 'price' field
 * multiply("quantity", Field.of("price"));
 * ```
 *
 * @param left The field name to multiply.
 * @param right The expression to multiply by.
 * @return A new {@code Expr} representing the multiplication operation.
 */
export function multiply(left: string, right: Expr): Multiply;

/**
 * @beta
 *
 * Creates an expression that multiplies a field's value by a constant value.
 *
 * ```typescript
 * // Multiply the 'value' field by 2
 * multiply("value", 2);
 * ```
 *
 * @param left The field name to multiply.
 * @param right The constant value to multiply by.
 * @return A new {@code Expr} representing the multiplication operation.
 */
export function multiply(left: string, right: any): Multiply;
export function multiply(left: Expr | string, right: Expr | any): Multiply {
  const normalizedLeft = typeof left === 'string' ? Field.of(left) : left;
  const normalizedRight = right instanceof Expr ? right : Constant.of(right);
  return new Multiply(normalizedLeft, normalizedRight);
}

/**
 * @beta
 *
 * Creates an expression that divides two expressions.
 *
 * ```typescript
 * // Divide the 'total' field by the 'count' field
 * divide(Field.of("total"), Field.of("count"));
 * ```
 *
 * @param left The expression to be divided.
 * @param right The expression to divide by.
 * @return A new {@code Expr} representing the division operation.
 */
export function divide(left: Expr, right: Expr): Divide;

/**
 * @beta
 *
 * Creates an expression that divides an expression by a constant value.
 *
 * ```typescript
 * // Divide the 'value' field by 10
 * divide(Field.of("value"), 10);
 * ```
 *
 * @param left The expression to be divided.
 * @param right The constant value to divide by.
 * @return A new {@code Expr} representing the division operation.
 */
export function divide(left: Expr, right: any): Divide;

/**
 * @beta
 *
 * Creates an expression that divides a field's value by an expression.
 *
 * ```typescript
 * // Divide the 'total' field by the 'count' field
 * divide("total", Field.of("count"));
 * ```
 *
 * @param left The field name to be divided.
 * @param right The expression to divide by.
 * @return A new {@code Expr} representing the division operation.
 */
export function divide(left: string, right: Expr): Divide;

/**
 * @beta
 *
 * Creates an expression that divides a field's value by a constant value.
 *
 * ```typescript
 * // Divide the 'value' field by 10
 * divide("value", 10);
 * ```
 *
 * @param left The field name to be divided.
 * @param right The constant value to divide by.
 * @return A new {@code Expr} representing the division operation.
 */
export function divide(left: string, right: any): Divide;
export function divide(left: Expr | string, right: Expr | any): Divide {
  const normalizedLeft = typeof left === 'string' ? Field.of(left) : left;
  const normalizedRight = right instanceof Expr ? right : Constant.of(right);
  return new Divide(normalizedLeft, normalizedRight);
}

/**
 * @beta
 *
 * Creates an expression that checks if two expressions are equal.
 *
 * ```typescript
 * // Check if the 'age' field is equal to an expression
 * eq(Field.of("age"), Field.of("minAge").add(10));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expr` representing the equality comparison.
 */
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

/**
 * @beta
 *
 * Creates an expression that checks if two expressions are not equal.
 *
 * ```typescript
 * // Check if the 'status' field is not equal to field 'finalState'
 * neq(Field.of("status"), Field.of("finalState"));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expr` representing the inequality comparison.
 */
export function neq(left: Expr, right: Expr): Neq;

/**
 * @beta
 *
 * Creates an expression that checks if an expression is not equal to a constant value.
 *
 * ```typescript
 * // Check if the 'status' field is not equal to "completed"
 * neq(Field.of("status"), "completed");
 * ```
 *
 * @param left The expression to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the inequality comparison.
 */
export function neq(left: Expr, right: any): Neq;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is not equal to an expression.
 *
 * ```typescript
 * // Check if the 'status' field is not equal to the value of 'expectedStatus'
 * neq("status", Field.of("expectedStatus"));
 * ```
 *
 * @param left The field name to compare.
 * @param right The expression to compare to.
 * @return A new `Expr` representing the inequality comparison.
 */
export function neq(left: string, right: Expr): Neq;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is not equal to a constant value.
 *
 * ```typescript
 * // Check if the 'country' field is not equal to "USA"
 * neq("country", "USA");
 * ```
 *
 * @param left The field name to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the inequality comparison.
 */
export function neq(left: string, right: any): Neq;
export function neq(left: Expr | string, right: any): Neq {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Neq(leftExpr, rightExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if the first expression is less than the second expression.
 *
 * ```typescript
 * // Check if the 'age' field is less than 30
 * lt(Field.of("age"), Field.of("limit"));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expr` representing the less than comparison.
 */
export function lt(left: Expr, right: Expr): Lt;

/**
 * @beta
 *
 * Creates an expression that checks if an expression is less than a constant value.
 *
 * ```typescript
 * // Check if the 'age' field is less than 30
 * lt(Field.of("age"), 30);
 * ```
 *
 * @param left The expression to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the less than comparison.
 */
export function lt(left: Expr, right: any): Lt;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is less than an expression.
 *
 * ```typescript
 * // Check if the 'age' field is less than the 'limit' field
 * lt("age", Field.of("limit"));
 * ```
 *
 * @param left The field name to compare.
 * @param right The expression to compare to.
 * @return A new `Expr` representing the less than comparison.
 */
export function lt(left: string, right: Expr): Lt;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is less than a constant value.
 *
 * ```typescript
 * // Check if the 'price' field is less than 50
 * lt("price", 50);
 * ```
 *
 * @param left The field name to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the less than comparison.
 */
export function lt(left: string, right: any): Lt;
export function lt(left: Expr | string, right: any): Lt {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Lt(leftExpr, rightExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if the first expression is less than or equal to the second
 * expression.
 *
 * ```typescript
 * // Check if the 'quantity' field is less than or equal to 20
 * lte(Field.of("quantity"), Field.of("limit"));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expr` representing the less than or equal to comparison.
 */
export function lte(left: Expr, right: Expr): Lte;

/**
 * @beta
 *
 * Creates an expression that checks if an expression is less than or equal to a constant value.
 *
 * ```typescript
 * // Check if the 'quantity' field is less than or equal to 20
 * lte(Field.of("quantity"), 20);
 * ```
 *
 * @param left The expression to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the less than or equal to comparison.
 */
export function lte(left: Expr, right: any): Lte;

/**
 * Creates an expression that checks if a field's value is less than or equal to an expression.
 *
 * ```typescript
 * // Check if the 'quantity' field is less than or equal to the 'limit' field
 * lte("quantity", Field.of("limit"));
 * ```
 *
 * @param left The field name to compare.
 * @param right The expression to compare to.
 * @return A new `Expr` representing the less than or equal to comparison.
 */
export function lte(left: string, right: Expr): Lte;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is less than or equal to a constant value.
 *
 * ```typescript
 * // Check if the 'score' field is less than or equal to 70
 * lte("score", 70);
 * ```
 *
 * @param left The field name to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the less than or equal to comparison.
 */
export function lte(left: string, right: any): Lte;
export function lte(left: Expr | string, right: any): Lte {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Lte(leftExpr, rightExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if the first expression is greater than the second
 * expression.
 *
 * ```typescript
 * // Check if the 'age' field is greater than 18
 * gt(Field.of("age"), Constant(9).add(9));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expr` representing the greater than comparison.
 */
export function gt(left: Expr, right: Expr): Gt;

/**
 * @beta
 *
 * Creates an expression that checks if an expression is greater than a constant value.
 *
 * ```typescript
 * // Check if the 'age' field is greater than 18
 * gt(Field.of("age"), 18);
 * ```
 *
 * @param left The expression to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the greater than comparison.
 */
export function gt(left: Expr, right: any): Gt;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is greater than an expression.
 *
 * ```typescript
 * // Check if the value of field 'age' is greater than the value of field 'limit'
 * gt("age", Field.of("limit"));
 * ```
 *
 * @param left The field name to compare.
 * @param right The expression to compare to.
 * @return A new `Expr` representing the greater than comparison.
 */
export function gt(left: string, right: Expr): Gt;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is greater than a constant value.
 *
 * ```typescript
 * // Check if the 'price' field is greater than 100
 * gt("price", 100);
 * ```
 *
 * @param left The field name to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the greater than comparison.
 */
export function gt(left: string, right: any): Gt;
export function gt(left: Expr | string, right: any): Gt {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Gt(leftExpr, rightExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if the first expression is greater than or equal to the
 * second expression.
 *
 * ```typescript
 * // Check if the 'quantity' field is greater than or equal to the field "threshold"
 * gte(Field.of("quantity"), Field.of("threshold"));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expr` representing the greater than or equal to comparison.
 */
export function gte(left: Expr, right: Expr): Gte;

/**
 * @beta
 *
 * Creates an expression that checks if an expression is greater than or equal to a constant
 * value.
 *
 * ```typescript
 * // Check if the 'quantity' field is greater than or equal to 10
 * gte(Field.of("quantity"), 10);
 * ```
 *
 * @param left The expression to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the greater than or equal to comparison.
 */
export function gte(left: Expr, right: any): Gte;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is greater than or equal to an expression.
 *
 * ```typescript
 * // Check if the value of field 'age' is greater than or equal to the value of field 'limit'
 * gte("age", Field.of("limit"));
 * ```
 *
 * @param left The field name to compare.
 * @param right The expression to compare to.
 * @return A new `Expr` representing the greater than or equal to comparison.
 */
export function gte(left: string, right: Expr): Gte;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is greater than or equal to a constant
 * value.
 *
 * ```typescript
 * // Check if the 'score' field is greater than or equal to 80
 * gte("score", 80);
 * ```
 *
 * @param left The field name to compare.
 * @param right The constant value to compare to.
 * @return A new `Expr` representing the greater than or equal to comparison.
 */
export function gte(left: string, right: any): Gte;
export function gte(left: Expr | string, right: any): Gte {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Gte(leftExpr, rightExpr);
}

/**
 * @beta
 *
 * Creates an expression that concatenates an array expression with other arrays.
 *
 * ```typescript
 * // Combine the 'items' array with two new item arrays
 * arrayConcat(Field.of("items"), [Field.of("newItems"), Field.of("otherItems")]);
 * ```
 *
 * @param array The array expression to concatenate to.
 * @param elements The array expressions to concatenate.
 * @return A new {@code Expr} representing the concatenated array.
 */
export function arrayConcat(array: Expr, elements: Expr[]): ArrayConcat;

/**
 * @beta
 *
 * Creates an expression that concatenates an array expression with other arrays and/or values.
 *
 * ```typescript
 * // Combine the 'tags' array with a new array
 * arrayConcat(Field.of("tags"), ["newTag1", "newTag2"]);
 * ```
 *
 * @param array The array expression to concatenate to.
 * @param elements The array expressions or single values to concatenate.
 * @return A new {@code Expr} representing the concatenated array.
 */
export function arrayConcat(array: Expr, elements: any[]): ArrayConcat;

/**
 * @beta
 *
 * Creates an expression that concatenates a field's array value with other arrays.
 *
 * ```typescript
 * // Combine the 'items' array with two new item arrays
 * arrayConcat("items", [Field.of("newItems"), Field.of("otherItems")]);
 * ```
 *
 * @param array The field name containing array values.
 * @param elements The array expressions to concatenate.
 * @return A new {@code Expr} representing the concatenated array.
 */
export function arrayConcat(array: string, elements: Expr[]): ArrayConcat;

/**
 * @beta
 *
 * Creates an expression that concatenates a field's array value with other arrays and/or values.
 *
 * ```typescript
 * // Combine the 'tags' array with a new array
 * arrayConcat("tags", ["newTag1", "newTag2"]);
 * ```
 *
 * @param array The field name containing array values.
 * @param elements The array expressions or single values to concatenate.
 * @return A new {@code Expr} representing the concatenated array.
 */
export function arrayConcat(array: string, elements: any[]): ArrayConcat;
export function arrayConcat(
  array: Expr | string,
  elements: any[]
): ArrayConcat {
  const arrayExpr = array instanceof Expr ? array : Field.of(array);
  const exprValues = elements.map(element =>
    element instanceof Expr ? element : Constant.of(element)
  );
  return new ArrayConcat(arrayExpr, exprValues);
}

/**
 * @beta
 *
 * Creates an expression that checks if an array expression contains a specific element.
 *
 * ```typescript
 * // Check if the 'colors' array contains the value of field 'selectedColor'
 * arrayContains(Field.of("colors"), Field.of("selectedColor"));
 * ```
 *
 * @param array The array expression to check.
 * @param element The element to search for in the array.
 * @return A new {@code Expr} representing the 'array_contains' comparison.
 */
export function arrayContains(array: Expr, element: Expr): ArrayContains;

/**
 * @beta
 *
 * Creates an expression that checks if an array expression contains a specific element.
 *
 * ```typescript
 * // Check if the 'colors' array contains "red"
 * arrayContains(Field.of("colors"), "red");
 * ```
 *
 * @param array The array expression to check.
 * @param element The element to search for in the array.
 * @return A new {@code Expr} representing the 'array_contains' comparison.
 */
export function arrayContains(array: Expr, element: any): ArrayContains;

/**
 * @beta
 *
 * Creates an expression that checks if a field's array value contains a specific element.
 *
 * ```typescript
 * // Check if the 'colors' array contains the value of field 'selectedColor'
 * arrayContains("colors", Field.of("selectedColor"));
 * ```
 *
 * @param array The field name to check.
 * @param element The element to search for in the array.
 * @return A new {@code Expr} representing the 'array_contains' comparison.
 */
export function arrayContains(array: string, element: Expr): ArrayContains;

/**
 * @beta
 *
 * Creates an expression that checks if a field's array value contains a specific value.
 *
 * ```typescript
 * // Check if the 'colors' array contains "red"
 * arrayContains("colors", "red");
 * ```
 *
 * @param array The field name to check.
 * @param element The element to search for in the array.
 * @return A new {@code Expr} representing the 'array_contains' comparison.
 */
export function arrayContains(array: string, element: any): ArrayContains;
export function arrayContains(
  array: Expr | string,
  element: any
): ArrayContains {
  const arrayExpr = array instanceof Expr ? array : Field.of(array);
  const elementExpr = element instanceof Expr ? element : Constant.of(element);
  return new ArrayContains(arrayExpr, elementExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if an array expression contains any of the specified
 * elements.
 *
 * ```typescript
 * // Check if the 'categories' array contains either values from field "cate1" or "Science"
 * arrayContainsAny(Field.of("categories"), [Field.of("cate1"), "Science"]);
 * ```
 *
 * @param array The array expression to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expr} representing the 'array_contains_any' comparison.
 */
export function arrayContainsAny(array: Expr, values: Expr[]): ArrayContainsAny;

/**
 * @beta
 *
 * Creates an expression that checks if an array expression contains any of the specified
 * elements.
 *
 * ```typescript
 * // Check if the 'categories' array contains either values from field "cate1" or "Science"
 * arrayContainsAny(Field.of("categories"), [Field.of("cate1"), "Science"]);
 * ```
 *
 * @param array The array expression to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expr} representing the 'array_contains_any' comparison.
 */
export function arrayContainsAny(array: Expr, values: any[]): ArrayContainsAny;

/**
 * @beta
 *
 * Creates an expression that checks if a field's array value contains any of the specified
 * elements.
 *
 * ```typescript
 * // Check if the 'groups' array contains either the value from the 'userGroup' field
 * // or the value "guest"
 * arrayContainsAny("categories", [Field.of("cate1"), "Science"]);
 * ```
 *
 * @param array The field name to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expr} representing the 'array_contains_any' comparison.
 */
export function arrayContainsAny(
  array: string,
  values: Expr[]
): ArrayContainsAny;

/**
 * @beta
 *
 * Creates an expression that checks if a field's array value contains any of the specified
 * elements.
 *
 * ```typescript
 * // Check if the 'groups' array contains either the value from the 'userGroup' field
 * // or the value "guest"
 * arrayContainsAny("categories", [Field.of("cate1"), "Science"]);
 * ```
 *
 * @param array The field name to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expr} representing the 'array_contains_any' comparison.
 */
export function arrayContainsAny(
  array: string,
  values: any[]
): ArrayContainsAny;
export function arrayContainsAny(
  array: Expr | string,
  values: any[]
): ArrayContainsAny {
  const arrayExpr = array instanceof Expr ? array : Field.of(array);
  const exprValues = values.map(value =>
    value instanceof Expr ? value : Constant.of(value)
  );
  return new ArrayContainsAny(arrayExpr, exprValues);
}

/**
 * @beta
 *
 * Creates an expression that checks if an array expression contains all the specified elements.
 *
 * ```typescript
 * // Check if the 'tags' array contains both of the values from field 'tag1', 'tag2' and "tag3"
 * arrayContainsAll(Field.of("tags"), [Field.of("tag1"), "SciFi", "Adventure"]);
 * ```
 *
 * @param array The array expression to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expr} representing the 'array_contains_all' comparison.
 */
export function arrayContainsAll(array: Expr, values: Expr[]): ArrayContainsAll;

/**
 * @beta
 *
 * Creates an expression that checks if an array expression contains all the specified elements.
 *
 * ```typescript
 * // Check if the 'tags' array contains both of the values from field 'tag1', 'tag2' and "tag3"
 * arrayContainsAll(Field.of("tags"), [Field.of("tag1"), "SciFi", "Adventure"]);
 * ```
 *
 * @param array The array expression to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expr} representing the 'array_contains_all' comparison.
 */
export function arrayContainsAll(array: Expr, values: any[]): ArrayContainsAll;

/**
 * @beta
 *
 * Creates an expression that checks if a field's array value contains all the specified values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'tags' array contains both of the values from field 'tag1' and "tag2"
 * arrayContainsAll("tags", [Field.of("tag1"), "SciFi", "Adventure"]);
 * ```
 *
 * @param array The field name to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expr} representing the 'array_contains_all' comparison.
 */
export function arrayContainsAll(
  array: string,
  values: Expr[]
): ArrayContainsAll;

/**
 * @beta
 *
 * Creates an expression that checks if a field's array value contains all the specified values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'tags' array contains both of the values from field 'tag1' and "tag2"
 * arrayContainsAll("tags", [Field.of("tag1"), "SciFi", "Adventure"]);
 * ```
 *
 * @param array The field name to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expr} representing the 'array_contains_all' comparison.
 */
export function arrayContainsAll(
  array: string,
  values: any[]
): ArrayContainsAll;
export function arrayContainsAll(
  array: Expr | string,
  values: any[]
): ArrayContainsAll {
  const arrayExpr = array instanceof Expr ? array : Field.of(array);
  const exprValues = values.map(value =>
    value instanceof Expr ? value : Constant.of(value)
  );
  return new ArrayContainsAll(arrayExpr, exprValues);
}

/**
 * @beta
 *
 * Creates an expression that filters elements from an array expression using the given {@link
 * FilterExpr} and returns the filtered elements as a new array.
 *
 * ```typescript
 * // Get items from the 'inventoryPrices' array where the array item is greater than 0
 * // Note we use {@link arrayElement} to represent array elements to construct a
 * // filtering condition.
 * arrayFilter(Field.of("inventoryPrices"), arrayElement().gt(0));
 * ```
 *
 * @param array The array expression to filter.
 * @param filter The {@link FilterExpr} to apply to the array elements.
 * @return A new {@code Expr} representing the filtered array.
 */
export function arrayFilter(array: Expr, filter: FilterExpr): ArrayFilter {
  return new ArrayFilter(array, filter);
}

/**
 * @beta
 *
 * Creates an expression that calculates the length of an array expression.
 *
 * ```typescript
 * // Get the number of items in the 'cart' array
 * arrayLength(Field.of("cart"));
 * ```
 *
 * @param array The array expression to calculate the length of.
 * @return A new {@code Expr} representing the length of the array.
 */
export function arrayLength(array: Expr): ArrayLength {
  return new ArrayLength(array);
}

/**
 * @beta
 *
 * Creates an expression that applies a transformation function to each element in an array
 * expression and returns the new array as the result of the evaluation.
 *
 * ```typescript
 * // Convert all strings in the 'names' array to uppercase
 * // Note we use {@link arrayElement} to represent array elements to construct a
 * // transforming function.
 * arrayTransform(Field.of("names"), arrayElement().toUppercase());
 * ```
 *
 * @param array The array expression to transform.
 * @param transform The {@link Function} to apply to each array element.
 * @return A new {@code Expr} representing the transformed array.
 */
export function arrayTransform(
  array: Expr,
  transform: Function
): ArrayTransform {
  return new ArrayTransform(array, transform);
}

/**
 * @beta
 *
 * Returns an expression that represents an array element within an {@link ArrayFilter} or {@link
 * ArrayTransform} expression.
 *
 * ```typescript
 * // Get items from the 'inventoryPrices' array where the array item is greater than 0
 * arrayFilter(Field.of("inventoryPrices"), arrayElement().gt(0));
 * ```
 *
 * @return A new {@code Expr} representing an array element.
 */
export function arrayElement(): ArrayElement {
  return new ArrayElement();
}

/**
 * @beta
 *
 * Creates an expression that checks if an expression is equal to any of the provided values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
 * inAny(Field.of("category"), [Constant.of("Electronics"), Field.of("primaryType")]);
 * ```
 *
 * @param element The expression to compare.
 * @param others The values to check against.
 * @return A new {@code Expr} representing the 'IN' comparison.
 */
export function inAny(element: Expr, others: Expr[]): In;

/**
 * @beta
 *
 * Creates an expression that checks if an expression is equal to any of the provided values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
 * inAny(Field.of("category"), ["Electronics", Field.of("primaryType")]);
 * ```
 *
 * @param element The expression to compare.
 * @param others The values to check against.
 * @return A new {@code Expr} representing the 'IN' comparison.
 */
export function inAny(element: Expr, others: any[]): In;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is equal to any of the provided values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
 * inAny("category", [Constant.of("Electronics"), Field.of("primaryType")]);
 * ```
 *
 * @param element The field to compare.
 * @param others The values to check against.
 * @return A new {@code Expr} representing the 'IN' comparison.
 */
export function inAny(element: string, others: Expr[]): In;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is equal to any of the provided values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
 * inAny("category", ["Electronics", Field.of("primaryType")]);
 * ```
 *
 * @param element The field to compare.
 * @param others The values to check against.
 * @return A new {@code Expr} representing the 'IN' comparison.
 */
export function inAny(element: string, others: any[]): In;
export function inAny(element: Expr | string, others: any[]): In {
  const elementExpr = element instanceof Expr ? element : Field.of(element);
  const exprOthers = others.map(other =>
    other instanceof Expr ? other : Constant.of(other)
  );
  return new In(elementExpr, exprOthers);
}

/**
 * @beta
 *
 * Creates an expression that checks if an expression is not equal to any of the provided values
 * or expressions.
 *
 * ```typescript
 * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
 * notInAny(Field.of("status"), [Constant.of("pending"), Field.of("rejectedStatus")]);
 * ```
 *
 * @param element The expression to compare.
 * @param others The values to check against.
 * @return A new {@code Expr} representing the 'NOT IN' comparison.
 */
export function notInAny(element: Expr, others: Expr[]): Not;

/**
 * @beta
 *
 * Creates an expression that checks if an expression is not equal to any of the provided values
 * or expressions.
 *
 * ```typescript
 * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
 * notInAny(Field.of("status"), ["pending", Field.of("rejectedStatus")]);
 * ```
 *
 * @param element The expression to compare.
 * @param others The values to check against.
 * @return A new {@code Expr} representing the 'NOT IN' comparison.
 */
export function notInAny(element: Expr, others: any[]): Not;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is not equal to any of the provided values
 * or expressions.
 *
 * ```typescript
 * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
 * notInAny("status", [Constant.of("pending"), Field.of("rejectedStatus")]);
 * ```
 *
 * @param element The field name to compare.
 * @param others The values to check against.
 * @return A new {@code Expr} representing the 'NOT IN' comparison.
 */
export function notInAny(element: string, others: Expr[]): Not;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value is not equal to any of the provided values
 * or expressions.
 *
 * ```typescript
 * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
 * notInAny("status", ["pending", Field.of("rejectedStatus")]);
 * ```
 *
 * @param element The field name to compare.
 * @param others The values to check against.
 * @return A new {@code Expr} representing the 'NOT IN' comparison.
 */
export function notInAny(element: string, others: any[]): Not;
export function notInAny(element: Expr | string, others: any[]): Not {
  const elementExpr = element instanceof Expr ? element : Field.of(element);
  const exprOthers = others.map(other =>
    other instanceof Expr ? other : Constant.of(other)
  );
  return new Not(new In(elementExpr, exprOthers));
}

/**
 * @beta
 *
 * Creates an expression that performs a logical 'AND' operation on multiple filter conditions.
 *
 * ```typescript
 * // Check if the 'age' field is greater than 18 AND the 'city' field is "London" AND
 * // the 'status' field is "active"
 * const condition = and(gt("age", 18), eq("city", "London"), eq("status", "active"));
 * ```
 *
 * @param left The first filter condition.
 * @param right Additional filter conditions to 'AND' together.
 * @return A new {@code Expr} representing the logical 'AND' operation.
 */
export function and(left: FilterExpr, ...right: FilterExpr[]): And {
  return new And([left, ...right]);
}

/**
 * @beta
 *
 * Creates an expression that performs a logical 'OR' operation on multiple filter conditions.
 *
 * ```typescript
 * // Check if the 'age' field is greater than 18 OR the 'city' field is "London" OR
 * // the 'status' field is "active"
 * const condition = or(gt("age", 18), eq("city", "London"), eq("status", "active"));
 * ```
 *
 * @param left The first filter condition.
 * @param right Additional filter conditions to 'OR' together.
 * @return A new {@code Expr} representing the logical 'OR' operation.
 */
export function or(left: FilterExpr, ...right: FilterExpr[]): Or {
  return new Or([left, ...right]);
}

/**
 * @beta
 *
 * Creates an expression that performs a logical 'XOR' (exclusive OR) operation on multiple filter
 * conditions.
 *
 * ```typescript
 * // Check if only one of the conditions is true: 'age' greater than 18, 'city' is "London",
 * // or 'status' is "active".
 * const condition = xor(
 *     gt("age", 18),
 *     eq("city", "London"),
 *     eq("status", "active"));
 * ```
 *
 * @param left The first filter condition.
 * @param right Additional filter conditions to 'XOR' together.
 * @return A new {@code Expr} representing the logical 'XOR' operation.
 */
export function xor(left: FilterExpr, ...right: FilterExpr[]): Xor {
  return new Xor([left, ...right]);
}

/**
 * @beta
 *
 * Creates a conditional expression that evaluates to a 'then' expression if a condition is true
 * and an 'else' expression if the condition is false.
 *
 * ```typescript
 * // If 'age' is greater than 18, return "Adult"; otherwise, return "Minor".
 * ifFunction(
 *     gt("age", 18), Constant.of("Adult"), Constant.of("Minor"));
 * ```
 *
 * @param condition The condition to evaluate.
 * @param thenExpr The expression to evaluate if the condition is true.
 * @param elseExpr The expression to evaluate if the condition is false.
 * @return A new {@code Expr} representing the conditional expression.
 */
export function ifFunction(
  condition: FilterExpr,
  thenExpr: Expr,
  elseExpr: Expr
): If {
  return new If(condition, thenExpr, elseExpr);
}

/**
 * @beta
 *
 * Creates an expression that negates a filter condition.
 *
 * ```typescript
 * // Find documents where the 'completed' field is NOT true
 * not(eq("completed", true));
 * ```
 *
 * @param filter The filter condition to negate.
 * @return A new {@code Expr} representing the negated filter condition.
 */
export function not(filter: FilterExpr): Not {
  return new Not(filter);
}

/**
 * @beta
 *
 * Creates an expression that checks if a field exists.
 *
 * ```typescript
 * // Check if the document has a field named "phoneNumber"
 * exists(Field.of("phoneNumber"));
 * ```
 *
 * @param value An expression evaluates to the name of the field to check.
 * @return A new {@code Expr} representing the 'exists' check.
 */
export function exists(value: Expr): Exists;

/**
 * @beta
 *
 * Creates an expression that checks if a field exists.
 *
 * ```typescript
 * // Check if the document has a field named "phoneNumber"
 * exists("phoneNumber");
 * ```
 *
 * @param field The field name to check.
 * @return A new {@code Expr} representing the 'exists' check.
 */
export function exists(field: string): Exists;
export function exists(valueOrField: Expr | string): Exists {
  const valueExpr =
    valueOrField instanceof Expr ? valueOrField : Field.of(valueOrField);
  return new Exists(valueExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if an expression evaluates to 'NaN' (Not a Number).
 *
 * ```typescript
 * // Check if the result of a calculation is NaN
 * isNaN(Field.of("value").divide(0));
 * ```
 *
 * @param value The expression to check.
 * @return A new {@code Expr} representing the 'isNaN' check.
 */
export function isNan(value: Expr): IsNan;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value evaluates to 'NaN' (Not a Number).
 *
 * ```typescript
 * // Check if the result of a calculation is NaN
 * isNaN("value");
 * ```
 *
 * @param value The name of the field to check.
 * @return A new {@code Expr} representing the 'isNaN' check.
 */
export function isNan(value: string): IsNan;
export function isNan(value: Expr | string): IsNan {
  const valueExpr = value instanceof Expr ? value : Field.of(value);
  return new IsNan(valueExpr);
}

/**
 * @beta
 *
 * Creates an expression that calculates the length of a string field.
 *
 * ```typescript
 * // Get the length of the 'name' field
 * strLength("name");
 * ```
 *
 * @param field The name of the field containing the string.
 * @return A new {@code Expr} representing the length of the string.
 */
export function strLength(field: string): StrLength;

/**
 * @beta
 *
 * Creates an expression that calculates the length of a string expression.
 *
 * ```typescript
 * // Get the length of the 'name' field
 * strLength(Field.of("name"));
 * ```
 *
 * @param expr The expression representing the string to calculate the length of.
 * @return A new {@code Expr} representing the length of the string.
 */
export function strLength(expr: Expr): StrLength;
export function strLength(value: Expr | string): StrLength {
  const valueExpr = value instanceof Expr ? value : Field.of(value);
  return new StrLength(valueExpr);
}

/**
 * @beta
 *
 * Creates an expression that performs a case-sensitive wildcard string comparison against a
 * field.
 *
 * ```typescript
 * // Check if the 'title' field contains the string "guide"
 * like("title", "%guide%");
 * ```
 *
 * @param left The name of the field containing the string.
 * @param pattern The pattern to search for. You can use "%" as a wildcard character.
 * @return A new {@code Expr} representing the 'like' comparison.
 */
export function like(left: string, pattern: string): Like;

/**
 * @beta
 *
 * Creates an expression that performs a case-sensitive wildcard string comparison against a
 * field.
 *
 * ```typescript
 * // Check if the 'title' field contains the string "guide"
 * like("title", Field.of("pattern"));
 * ```
 *
 * @param left The name of the field containing the string.
 * @param pattern The pattern to search for. You can use "%" as a wildcard character.
 * @return A new {@code Expr} representing the 'like' comparison.
 */
export function like(left: string, pattern: Expr): Like;

/**
 * @beta
 *
 * Creates an expression that performs a case-sensitive wildcard string comparison.
 *
 * ```typescript
 * // Check if the 'title' field contains the string "guide"
 * like(Field.of("title"), "%guide%");
 * ```
 *
 * @param left The expression representing the string to perform the comparison on.
 * @param pattern The pattern to search for. You can use "%" as a wildcard character.
 * @return A new {@code Expr} representing the 'like' comparison.
 */
export function like(left: Expr, pattern: string): Like;

/**
 * @beta
 *
 * Creates an expression that performs a case-sensitive wildcard string comparison.
 *
 * ```typescript
 * // Check if the 'title' field contains the string "guide"
 * like(Field.of("title"), Field.of("pattern"));
 * ```
 *
 * @param left The expression representing the string to perform the comparison on.
 * @param pattern The pattern to search for. You can use "%" as a wildcard character.
 * @return A new {@code Expr} representing the 'like' comparison.
 */
export function like(left: Expr, pattern: Expr): Like;
export function like(left: Expr | string, pattern: Expr | string): Like {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const patternExpr = pattern instanceof Expr ? pattern : Constant.of(pattern);
  return new Like(leftExpr, patternExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if a string field contains a specified regular expression as
 * a substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example" (case-insensitive)
 * regexContains("description", "(?i)example");
 * ```
 *
 * @param left The name of the field containing the string.
 * @param pattern The regular expression to use for the search.
 * @return A new {@code Expr} representing the 'contains' comparison.
 */
export function regexContains(left: string, pattern: string): RegexContains;

/**
 * @beta
 *
 * Creates an expression that checks if a string field contains a specified regular expression as
 * a substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example" (case-insensitive)
 * regexContains("description", Field.of("pattern"));
 * ```
 *
 * @param left The name of the field containing the string.
 * @param pattern The regular expression to use for the search.
 * @return A new {@code Expr} representing the 'contains' comparison.
 */
export function regexContains(left: string, pattern: Expr): RegexContains;

/**
 * @beta
 *
 * Creates an expression that checks if a string expression contains a specified regular
 * expression as a substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example" (case-insensitive)
 * regexContains(Field.of("description"), "(?i)example");
 * ```
 *
 * @param left The expression representing the string to perform the comparison on.
 * @param pattern The regular expression to use for the search.
 * @return A new {@code Expr} representing the 'contains' comparison.
 */
export function regexContains(left: Expr, pattern: string): RegexContains;

/**
 * @beta
 *
 * Creates an expression that checks if a string expression contains a specified regular
 * expression as a substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example" (case-insensitive)
 * regexContains(Field.of("description"), Field.of("pattern"));
 * ```
 *
 * @param left The expression representing the string to perform the comparison on.
 * @param pattern The regular expression to use for the search.
 * @return A new {@code Expr} representing the 'contains' comparison.
 */
export function regexContains(left: Expr, pattern: Expr): RegexContains;
export function regexContains(
  left: Expr | string,
  pattern: Expr | string
): RegexContains {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const patternExpr = pattern instanceof Expr ? pattern : Constant.of(pattern);
  return new RegexContains(leftExpr, patternExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if a string field matches a specified regular expression.
 *
 * ```typescript
 * // Check if the 'email' field matches a valid email pattern
 * regexMatch("email", "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
 * ```
 *
 * @param left The name of the field containing the string.
 * @param pattern The regular expression to use for the match.
 * @return A new {@code Expr} representing the regular expression match.
 */
export function regexMatch(left: string, pattern: string): RegexMatch;

/**
 * @beta
 *
 * Creates an expression that checks if a string field matches a specified regular expression.
 *
 * ```typescript
 * // Check if the 'email' field matches a valid email pattern
 * regexMatch("email", Field.of("pattern"));
 * ```
 *
 * @param left The name of the field containing the string.
 * @param pattern The regular expression to use for the match.
 * @return A new {@code Expr} representing the regular expression match.
 */
export function regexMatch(left: string, pattern: Expr): RegexMatch;

/**
 * @beta
 *
 * Creates an expression that checks if a string expression matches a specified regular
 * expression.
 *
 * ```typescript
 * // Check if the 'email' field matches a valid email pattern
 * regexMatch(Field.of("email"), "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
 * ```
 *
 * @param left The expression representing the string to match against.
 * @param pattern The regular expression to use for the match.
 * @return A new {@code Expr} representing the regular expression match.
 */
export function regexMatch(left: Expr, pattern: string): RegexMatch;

/**
 * @beta
 *
 * Creates an expression that checks if a string expression matches a specified regular
 * expression.
 *
 * ```typescript
 * // Check if the 'email' field matches a valid email pattern
 * regexMatch(Field.of("email"), Field.of("pattern"));
 * ```
 *
 * @param left The expression representing the string to match against.
 * @param pattern The regular expression to use for the match.
 * @return A new {@code Expr} representing the regular expression match.
 */
export function regexMatch(left: Expr, pattern: Expr): RegexMatch;
export function regexMatch(
  left: Expr | string,
  pattern: Expr | string
): RegexMatch {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const patternExpr = pattern instanceof Expr ? pattern : Constant.of(pattern);
  return new RegexMatch(leftExpr, patternExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if a field's value starts with a given prefix.
 *
 * ```typescript
 * // Check if the 'name' field starts with "Mr."
 * startsWith("name", "Mr.");
 * ```
 *
 * @param expr The field name to check.
 * @param prefix The prefix to check for.
 * @return A new {@code Expr} representing the 'starts with' comparison.
 */
export function startsWith(expr: string, prefix: string): StartsWith;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value starts with a given prefix.
 *
 * ```typescript
 * // Check if the 'fullName' field starts with the value of the 'firstName' field
 * startsWith("fullName", Field.of("firstName"));
 * ```
 *
 * @param expr The field name to check.
 * @param prefix The expression representing the prefix.
 * @return A new {@code Expr} representing the 'starts with' comparison.
 */
export function startsWith(expr: string, prefix: Expr): StartsWith;

/**
 * @beta
 *
 * Creates an expression that checks if a string expression starts with a given prefix.
 *
 * ```typescript
 * // Check if the result of concatenating 'firstName' and 'lastName' fields starts with "Mr."
 * startsWith(Field.of("fullName"), "Mr.");
 * ```
 *
 * @param expr The expression to check.
 * @param prefix The prefix to check for.
 * @return A new {@code Expr} representing the 'starts with' comparison.
 */
export function startsWith(expr: Expr, prefix: string): StartsWith;

/**
 * @beta
 *
 * Creates an expression that checks if a string expression starts with a given prefix.
 *
 * ```typescript
 * // Check if the result of concatenating 'firstName' and 'lastName' fields starts with "Mr."
 * startsWith(Field.of("fullName"), Field.of("prefix"));
 * ```
 *
 * @param expr The expression to check.
 * @param prefix The prefix to check for.
 * @return A new {@code Expr} representing the 'starts with' comparison.
 */
export function startsWith(expr: Expr, prefix: Expr): StartsWith;
export function startsWith(
  expr: Expr | string,
  prefix: Expr | string
): StartsWith {
  const exprLeft = expr instanceof Expr ? expr : Field.of(expr);
  const prefixExpr = prefix instanceof Expr ? prefix : Constant.of(prefix);
  return new StartsWith(exprLeft, prefixExpr);
}

/**
 * @beta
 *
 * Creates an expression that checks if a field's value ends with a given postfix.
 *
 * ```typescript
 * // Check if the 'filename' field ends with ".txt"
 * endsWith("filename", ".txt");
 * ```
 *
 * @param expr The field name to check.
 * @param suffix The postfix to check for.
 * @return A new {@code Expr} representing the 'ends with' comparison.
 */
export function endsWith(expr: string, suffix: string): EndsWith;

/**
 * @beta
 *
 * Creates an expression that checks if a field's value ends with a given postfix.
 *
 * ```typescript
 * // Check if the 'url' field ends with the value of the 'extension' field
 * endsWith("url", Field.of("extension"));
 * ```
 *
 * @param expr The field name to check.
 * @param suffix The expression representing the postfix.
 * @return A new {@code Expr} representing the 'ends with' comparison.
 */
export function endsWith(expr: string, suffix: Expr): EndsWith;

/**
 * @beta
 *
 * Creates an expression that checks if a string expression ends with a given postfix.
 *
 * ```typescript
 * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
 * endsWith(Field.of("fullName"), "Jr.");
 * ```
 *
 * @param expr The expression to check.
 * @param suffix The postfix to check for.
 * @return A new {@code Expr} representing the 'ends with' comparison.
 */
export function endsWith(expr: Expr, suffix: string): EndsWith;

/**
 * @beta
 *
 * Creates an expression that checks if a string expression ends with a given postfix.
 *
 * ```typescript
 * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
 * endsWith(Field.of("fullName"), Constant.of("Jr."));
 * ```
 *
 * @param expr The expression to check.
 * @param suffix The postfix to check for.
 * @return A new {@code Expr} representing the 'ends with' comparison.
 */
export function endsWith(expr: Expr, suffix: Expr): EndsWith;
export function endsWith(expr: Expr | string, suffix: Expr | string): EndsWith {
  const exprLeft = expr instanceof Expr ? expr : Field.of(expr);
  const suffixExpr = suffix instanceof Expr ? suffix : Constant.of(suffix);
  return new EndsWith(exprLeft, suffixExpr);
}

/**
 * @beta
 *
 * Creates an expression that converts a string field to lowercase.
 *
 * ```typescript
 * // Convert the 'name' field to lowercase
 * toLowercase("name");
 * ```
 *
 * @param expr The name of the field containing the string.
 * @return A new {@code Expr} representing the lowercase string.
 */
export function toLowercase(expr: string): ToLowercase;

/**
 * @beta
 *
 * Creates an expression that converts a string expression to lowercase.
 *
 * ```typescript
 * // Convert the 'name' field to lowercase
 * toLowercase(Field.of("name"));
 * ```
 *
 * @param expr The expression representing the string to convert to lowercase.
 * @return A new {@code Expr} representing the lowercase string.
 */
export function toLowercase(expr: Expr): ToLowercase;
export function toLowercase(expr: Expr | string): ToLowercase {
  return new ToLowercase(expr instanceof Expr ? expr : Field.of(expr));
}

/**
 * @beta
 *
 * Creates an expression that converts a string field to uppercase.
 *
 * ```typescript
 * // Convert the 'title' field to uppercase
 * toUppercase("title");
 * ```
 *
 * @param expr The name of the field containing the string.
 * @return A new {@code Expr} representing the uppercase string.
 */
export function toUppercase(expr: string): ToUppercase;

/**
 * @beta
 *
 * Creates an expression that converts a string expression to uppercase.
 *
 * ```typescript
 * // Convert the 'title' field to uppercase
 * toUppercase(Field.of("title"));
 * ```
 *
 * @param expr The expression representing the string to convert to uppercase.
 * @return A new {@code Expr} representing the uppercase string.
 */
export function toUppercase(expr: Expr): ToUppercase;
export function toUppercase(expr: Expr | string): ToUppercase {
  return new ToUppercase(expr instanceof Expr ? expr : Field.of(expr));
}

/**
 * @beta
 *
 * Creates an expression that removes leading and trailing whitespace from a string field.
 *
 * ```typescript
 * // Trim whitespace from the 'userInput' field
 * trim("userInput");
 * ```
 *
 * @param expr The name of the field containing the string.
 * @return A new {@code Expr} representing the trimmed string.
 */
export function trim(expr: string): Trim;

/**
 * @beta
 *
 * Creates an expression that removes leading and trailing whitespace from a string expression.
 *
 * ```typescript
 * // Trim whitespace from the 'userInput' field
 * trim(Field.of("userInput"));
 * ```
 *
 * @param expr The expression representing the string to trim.
 * @return A new {@code Expr} representing the trimmed string.
 */
export function trim(expr: Expr): Trim;
export function trim(expr: Expr | string): Trim {
  return new Trim(expr instanceof Expr ? expr : Field.of(expr));
}

/**
 * @beta
 *
 * Creates an expression that concatenates string functions, fields or constants together.
 *
 * ```typescript
 * // Combine the 'firstName', " ", and 'lastName' fields into a single string
 * strConcat("firstName", " ", Field.of("lastName"));
 * ```
 *
 * @param first The field name containing the initial string value.
 * @param elements The expressions (typically strings) to concatenate.
 * @return A new {@code Expr} representing the concatenated string.
 */
export function strConcat(
  first: string,
  ...elements: (Expr | string)[]
): StrConcat;

/**
 * @beta
 * Creates an expression that concatenates string expressions together.
 *
 * ```typescript
 * // Combine the 'firstName', " ", and 'lastName' fields into a single string
 * strConcat(Field.of("firstName"), " ", Field.of("lastName"));
 * ```
 *
 * @param first The initial string expression to concatenate to.
 * @param elements The expressions (typically strings) to concatenate.
 * @return A new {@code Expr} representing the concatenated string.
 */
export function strConcat(
  first: Expr,
  ...elements: (Expr | string)[]
): StrConcat;
export function strConcat(
  first: string | Expr,
  ...elements: (string | Expr)[]
): StrConcat {
  const exprs = elements.map(e => (e instanceof Expr ? e : Constant.of(e)));
  return new StrConcat(first instanceof Expr ? first : Field.of(first), exprs);
}

/**
 * @beta
 *
 * Accesses a value from a map (object) field using the provided key.
 *
 * ```typescript
 * // Get the 'city' value from the 'address' map field
 * mapGet("address", "city");
 * ```
 *
 * @param mapField The field name of the map field.
 * @param subField The key to access in the map.
 * @return A new {@code Expr} representing the value associated with the given key in the map.
 */
export function mapGet(mapField: string, subField: string): MapGet;

/**
 * @beta
 *
 * Accesses a value from a map (object) expression using the provided key.
 *
 * ```typescript
 * // Get the 'city' value from the 'address' map field
 * mapGet(Field.of("address"), "city");
 * ```
 *
 * @param mapExpr The expression representing the map.
 * @param subField The key to access in the map.
 * @return A new {@code Expr} representing the value associated with the given key in the map.
 */
export function mapGet(mapExpr: Expr, subField: string): MapGet;
export function mapGet(fieldOrExpr: string | Expr, subField: string): MapGet {
  return new MapGet(
    typeof fieldOrExpr === 'string' ? Field.of(fieldOrExpr) : fieldOrExpr,
    subField
  );
}

/**
 * @beta
 *
 * Creates an aggregation that counts the total number of stage inputs.
 *
 * ```typescript
 * // Count the total number of users
 * countAll().as("totalUsers");
 * ```
 *
 * @return A new {@code Accumulator} representing the 'countAll' aggregation.
 */
export function countAll(): Count {
  return new Count(undefined, false);
}

/**
 * @beta
 *
 * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
 * provided expression.
 *
 * ```typescript
 * // Count the number of items where the price is greater than 10
 * count(Field.of("price").gt(10)).as("expensiveItemCount");
 * ```
 *
 * @param value The expression to count.
 * @return A new {@code Accumulator} representing the 'count' aggregation.
 */
export function count(value: Expr): Count;

/**
 * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
 * provided field.
 *
 * ```typescript
 * // Count the total number of products
 * count("productId").as("totalProducts");
 * ```
 *
 * @param value The name of the field to count.
 * @return A new {@code Accumulator} representing the 'count' aggregation.
 */
export function count(value: string): Count;
export function count(value: Expr | string): Count {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Count(exprValue, false);
}

/**
 * @beta
 *
 * Creates an aggregation that calculates the sum of values from an expression across multiple
 * stage inputs.
 *
 * ```typescript
 * // Calculate the total revenue from a set of orders
 * sum(Field.of("orderAmount")).as("totalRevenue");
 * ```
 *
 * @param value The expression to sum up.
 * @return A new {@code Accumulator} representing the 'sum' aggregation.
 */
export function sum(value: Expr): Sum;

/**
 * @beta
 *
 * Creates an aggregation that calculates the sum of a field's values across multiple stage
 * inputs.
 *
 * ```typescript
 * // Calculate the total revenue from a set of orders
 * sum("orderAmount").as("totalRevenue");
 * ```
 *
 * @param value The name of the field containing numeric values to sum up.
 * @return A new {@code Accumulator} representing the 'sum' aggregation.
 */
export function sum(value: string): Sum;
export function sum(value: Expr | string): Sum {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Sum(exprValue, false);
}

/**
 * @beta
 *
 * Creates an aggregation that calculates the average (mean) of values from an expression across
 * multiple stage inputs.
 *
 * ```typescript
 * // Calculate the average age of users
 * avg(Field.of("age")).as("averageAge");
 * ```
 *
 * @param value The expression representing the values to average.
 * @return A new {@code Accumulator} representing the 'avg' aggregation.
 */
export function avg(value: Expr): Avg;

/**
 * @beta
 *
 * Creates an aggregation that calculates the average (mean) of a field's values across multiple
 * stage inputs.
 *
 * ```typescript
 * // Calculate the average age of users
 * avg("age").as("averageAge");
 * ```
 *
 * @param value The name of the field containing numeric values to average.
 * @return A new {@code Accumulator} representing the 'avg' aggregation.
 */
export function avg(value: string): Avg;
export function avg(value: Expr | string): Avg {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Avg(exprValue, false);
}

/**
 * @beta
 *
 * Creates an aggregation that finds the minimum value of an expression across multiple stage
 * inputs.
 *
 * ```typescript
 * // Find the lowest price of all products
 * min(Field.of("price")).as("lowestPrice");
 * ```
 *
 * @param value The expression to find the minimum value of.
 * @return A new {@code Accumulator} representing the 'min' aggregation.
 */
export function min(value: Expr): Min;

/**
 * @beta
 *
 * Creates an aggregation that finds the minimum value of a field across multiple stage inputs.
 *
 * ```typescript
 * // Find the lowest price of all products
 * min("price").as("lowestPrice");
 * ```
 *
 * @param value The name of the field to find the minimum value of.
 * @return A new {@code Accumulator} representing the 'min' aggregation.
 */
export function min(value: string): Min;
export function min(value: Expr | string): Min {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Min(exprValue, false);
}

/**
 * @beta
 *
 * Creates an aggregation that finds the maximum value of an expression across multiple stage
 * inputs.
 *
 * ```typescript
 * // Find the highest score in a leaderboard
 * max(Field.of("score")).as("highestScore");
 * ```
 *
 * @param value The expression to find the maximum value of.
 * @return A new {@code Accumulator} representing the 'max' aggregation.
 */
export function max(value: Expr): Max;

/**
 * @beta
 *
 * Creates an aggregation that finds the maximum value of a field across multiple stage inputs.
 *
 * ```typescript
 * // Find the highest score in a leaderboard
 * max("score").as("highestScore");
 * ```
 *
 * @param value The name of the field to find the maximum value of.
 * @return A new {@code Accumulator} representing the 'max' aggregation.
 */
export function max(value: string): Max;
export function max(value: Expr | string): Max {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Max(exprValue, false);
}

/**
 * @beta
 *
 * Calculates the Cosine distance between a field's vector value and a double array.
 *
 * ```typescript
 * // Calculate the Cosine distance between the 'location' field and a target location
 * cosineDistance("location", [37.7749, -122.4194]);
 * ```
 *
 * @param expr The name of the field containing the first vector.
 * @param other The other vector (as an array of doubles) to compare against.
 * @return A new {@code Expr} representing the Cosine distance between the two vectors.
 */
export function cosineDistance(expr: string, other: number[]): CosineDistance;

/**
 * @beta
 *
 * Calculates the Cosine distance between a field's vector value and a VectorValue.
 *
 * ```typescript
 * // Calculate the Cosine distance between the 'location' field and a target location
 * cosineDistance("location", new VectorValue([37.7749, -122.4194]));
 * ```
 *
 * @param expr The name of the field containing the first vector.
 * @param other The other vector (as a VectorValue) to compare against.
 * @return A new {@code Expr} representing the Cosine distance between the two vectors.
 */
export function cosineDistance(
  expr: string,
  other: VectorValue
): CosineDistance;

/**
 * @beta
 *
 * Calculates the Cosine distance between a field's vector value and a vector expression.
 *
 * ```typescript
 * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
 * cosineDistance("userVector", Field.of("itemVector"));
 * ```
 *
 * @param expr The name of the field containing the first vector.
 * @param other The other vector (represented as an Expr) to compare against.
 * @return A new {@code Expr} representing the cosine distance between the two vectors.
 */
export function cosineDistance(expr: string, other: Expr): CosineDistance;

/**
 * @beta
 *
 * Calculates the Cosine distance between a vector expression and a double array.
 *
 * ```typescript
 * // Calculate the cosine distance between the 'location' field and a target location
 * cosineDistance(Field.of("location"), [37.7749, -122.4194]);
 * ```
 *
 * @param expr The first vector (represented as an Expr) to compare against.
 * @param other The other vector (as an array of doubles) to compare against.
 * @return A new {@code Expr} representing the cosine distance between the two vectors.
 */
export function cosineDistance(expr: Expr, other: number[]): CosineDistance;

/**
 * @beta
 *
 * Calculates the Cosine distance between a vector expression and a VectorValue.
 *
 * ```typescript
 * // Calculate the cosine distance between the 'location' field and a target location
 * cosineDistance(Field.of("location"), new VectorValue([37.7749, -122.4194]));
 * ```
 *
 * @param expr The first vector (represented as an Expr) to compare against.
 * @param other The other vector (as a VectorValue) to compare against.
 * @return A new {@code Expr} representing the cosine distance between the two vectors.
 */
export function cosineDistance(expr: Expr, other: VectorValue): CosineDistance;

/**
 * @beta
 *
 * Calculates the Cosine distance between two vector expressions.
 *
 * ```typescript
 * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
 * cosineDistance(Field.of("userVector"), Field.of("itemVector"));
 * ```
 *
 * @param expr The first vector (represented as an Expr) to compare against.
 * @param other The other vector (represented as an Expr) to compare against.
 * @return A new {@code Expr} representing the cosine distance between the two vectors.
 */
export function cosineDistance(expr: Expr, other: Expr): CosineDistance;
export function cosineDistance(
  expr: Expr | string,
  other: Expr | number[] | VectorValue
): CosineDistance {
  const expr1 = expr instanceof Expr ? expr : Field.of(expr);
  const expr2 = other instanceof Expr ? other : Constant.vector(other);
  return new CosineDistance(expr1, expr2);
}

/**
 * @beta
 *
 * Calculates the dot product between a field's vector value and a double array.
 *
 * ```typescript
 * // Calculate the dot product distance between a feature vector and a target vector
 * dotProduct("features", [0.5, 0.8, 0.2]);
 * ```
 *
 * @param expr The name of the field containing the first vector.
 * @param other The other vector (as an array of doubles) to calculate with.
 * @return A new {@code Expr} representing the dot product between the two vectors.
 */
export function dotProduct(expr: string, other: number[]): DotProduct;

/**
 * @beta
 *
 * Calculates the dot product between a field's vector value and a VectorValue.
 *
 * ```typescript
 * // Calculate the dot product distance between a feature vector and a target vector
 * dotProduct("features", new VectorValue([0.5, 0.8, 0.2]));
 * ```
 *
 * @param expr The name of the field containing the first vector.
 * @param other The other vector (as a VectorValue) to calculate with.
 * @return A new {@code Expr} representing the dot product between the two vectors.
 */
export function dotProduct(expr: string, other: VectorValue): DotProduct;

/**
 * @beta
 *
 * Calculates the dot product between a field's vector value and a vector expression.
 *
 * ```typescript
 * // Calculate the dot product distance between two document vectors: 'docVector1' and 'docVector2'
 * dotProduct("docVector1", Field.of("docVector2"));
 * ```
 *
 * @param expr The name of the field containing the first vector.
 * @param other The other vector (represented as an Expr) to calculate with.
 * @return A new {@code Expr} representing the dot product between the two vectors.
 */
export function dotProduct(expr: string, other: Expr): DotProduct;

/**
 * @beta
 *
 * Calculates the dot product between a vector expression and a double array.
 *
 * ```typescript
 * // Calculate the dot product between a feature vector and a target vector
 * dotProduct(Field.of("features"), [0.5, 0.8, 0.2]);
 * ```
 *
 * @param expr The first vector (represented as an Expr) to calculate with.
 * @param other The other vector (as an array of doubles) to calculate with.
 * @return A new {@code Expr} representing the dot product between the two vectors.
 */
export function dotProduct(expr: Expr, other: number[]): DotProduct;

/**
 * @beta
 *
 * Calculates the dot product between a vector expression and a VectorValue.
 *
 * ```typescript
 * // Calculate the dot product between a feature vector and a target vector
 * dotProduct(Field.of("features"), new VectorValue([0.5, 0.8, 0.2]));
 * ```
 *
 * @param expr The first vector (represented as an Expr) to calculate with.
 * @param other The other vector (as a VectorValue) to calculate with.
 * @return A new {@code Expr} representing the dot product between the two vectors.
 */
export function dotProduct(expr: Expr, other: VectorValue): DotProduct;

/**
 * @beta
 *
 * Calculates the dot product between two vector expressions.
 *
 * ```typescript
 * // Calculate the dot product between two document vectors: 'docVector1' and 'docVector2'
 * dotProduct(Field.of("docVector1"), Field.of("docVector2"));
 * ```
 *
 * @param expr The first vector (represented as an Expr) to calculate with.
 * @param other The other vector (represented as an Expr) to calculate with.
 * @return A new {@code Expr} representing the dot product between the two vectors.
 */
export function dotProduct(expr: Expr, other: Expr): DotProduct;
export function dotProduct(
  expr: Expr | string,
  other: Expr | number[] | VectorValue
): DotProduct {
  const expr1 = expr instanceof Expr ? expr : Field.of(expr);
  const expr2 = other instanceof Expr ? other : Constant.vector(other);
  return new DotProduct(expr1, expr2);
}

/**
 * @beta
 *
 * Calculates the Euclidean distance between a field's vector value and a double array.
 *
 * ```typescript
 * // Calculate the Euclidean distance between the 'location' field and a target location
 * euclideanDistance("location", [37.7749, -122.4194]);
 * ```
 *
 * @param expr The name of the field containing the first vector.
 * @param other The other vector (as an array of doubles) to compare against.
 * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(
  expr: string,
  other: number[]
): EuclideanDistance;

/**
 * @beta
 *
 * Calculates the Euclidean distance between a field's vector value and a VectorValue.
 *
 * ```typescript
 * // Calculate the Euclidean distance between the 'location' field and a target location
 * euclideanDistance("location", new VectorValue([37.7749, -122.4194]));
 * ```
 *
 * @param expr The name of the field containing the first vector.
 * @param other The other vector (as a VectorValue) to compare against.
 * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(
  expr: string,
  other: VectorValue
): EuclideanDistance;

/**
 * @beta
 *
 * Calculates the Euclidean distance between a field's vector value and a vector expression.
 *
 * ```typescript
 * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
 * euclideanDistance("pointA", Field.of("pointB"));
 * ```
 *
 * @param expr The name of the field containing the first vector.
 * @param other The other vector (represented as an Expr) to compare against.
 * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(expr: string, other: Expr): EuclideanDistance;

/**
 * @beta
 *
 * Calculates the Euclidean distance between a vector expression and a double array.
 *
 * ```typescript
 * // Calculate the Euclidean distance between the 'location' field and a target location
 *
 * euclideanDistance(Field.of("location"), [37.7749, -122.4194]);
 * ```
 *
 * @param expr The first vector (represented as an Expr) to compare against.
 * @param other The other vector (as an array of doubles) to compare against.
 * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(
  expr: Expr,
  other: number[]
): EuclideanDistance;

/**
 * @beta
 *
 * Calculates the Euclidean distance between a vector expression and a VectorValue.
 *
 * ```typescript
 * // Calculate the Euclidean distance between the 'location' field and a target location
 * euclideanDistance(Field.of("location"), new VectorValue([37.7749, -122.4194]));
 * ```
 *
 * @param expr The first vector (represented as an Expr) to compare against.
 * @param other The other vector (as a VectorValue) to compare against.
 * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(
  expr: Expr,
  other: VectorValue
): EuclideanDistance;

/**
 * @beta
 *
 * Calculates the Euclidean distance between two vector expressions.
 *
 * ```typescript
 * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
 * euclideanDistance(Field.of("pointA"), Field.of("pointB"));
 * ```
 *
 * @param expr The first vector (represented as an Expr) to compare against.
 * @param other The other vector (represented as an Expr) to compare against.
 * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(expr: Expr, other: Expr): EuclideanDistance;
export function euclideanDistance(
  expr: Expr | string,
  other: Expr | number[] | VectorValue
): EuclideanDistance {
  const expr1 = expr instanceof Expr ? expr : Field.of(expr);
  const expr2 = other instanceof Expr ? other : Constant.vector(other);
  return new EuclideanDistance(expr1, expr2);
}

/**
 * @beta
 *
 * Creates functions that work on the backend but do not exist in the SDK yet.
 *
 * ```typescript
 * // Call a user defined function named "myFunc" with the arguments 10 and 20
 * // This is the same of the 'sum(Field.of("price"))', if it did not exist
 * genericFunction("sum", [Field.of("price")]);
 * ```
 *
 * @param name The name of the user defined function.
 * @param params The arguments to pass to the function.
 * @return A new {@code Function} representing the function call.
 */
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
