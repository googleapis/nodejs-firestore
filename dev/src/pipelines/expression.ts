// Copyright 2025 Google LLC
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

import * as protos from '../../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;

import type * as firestore from '@google-cloud/firestore';

import {VectorValue} from '../field-value';
import {FieldPath} from '../path';
import {
  fieldOrExpression,
  isFirestoreValue,
  valueToDefaultExpr,
  vectorToExpr,
} from './pipeline-util';
import {HasUserData, Serializer, validateUserInput} from '../serializer';
import {cast} from '../util';

/**
 * Represents an expression that can be evaluated to a value within the execution of a {@link
 * Pipeline}.
 *
 * Expressions are the building blocks for creating complex queries and transformations in
 * Firestore pipelines. They can represent:
 *
 * - **Field references:** Access values from document fields.
 * - **Literals:** Represent constant values (strings, numbers, booleans).
 * - **Function calls:** Apply functions to one or more expressions.
 *
 * The `Expression` class provides a fluent API for building expressions. You can chain together
 * method calls to create complex expressions.
 */
export abstract class Expression implements firestore.Pipelines.Expression, HasUserData {
  abstract exprType: firestore.Pipelines.ExprType;

  /**
   * @internal
   * @private
   * Indicates if this expression was created from a literal value passed
   * by the caller.
   */
  _createdFromLiteral = false;

  /**
   * @private
   * @internal
   */
  abstract _toProto(serializer: Serializer): api.IValue;
  _protoValueType = 'ProtoValue' as const;

  /**
   * @private
   * @internal
   */
  abstract _validateUserData(ignoreUndefinedProperties: boolean): void;

  /**
   * Creates an expression that adds this expression to another expression.
   *
   * ```typescript
   * // Add the value of the 'quantity' field and the 'reserve' field.
   * field("quantity").add(field("reserve"));
   * ```
   *
   * @param second The expression or literal to add to this expression.
   * @param others Optional additional expressions or literals to add to this expression.
   * @return A new `Expression` representing the addition operation.
   */
  add(
    second: firestore.Pipelines.Expression | unknown,
    ...others: Array<firestore.Pipelines.Expression | unknown>
  ): FunctionExpr {
    const values = [second, ...others];
    return new FunctionExpr('add', [
      this,
      ...values.map(value => valueToDefaultExpr(value)),
    ]);
  }

  /**
   * Creates an expression that subtracts another expression from this expression.
   *
   * ```typescript
   * // Subtract the 'discount' field from the 'price' field
   * field("price").subtract(field("discount"));
   * ```
   *
   * @param subtrahend The expression to subtract from this expression.
   * @return A new `Expression` representing the subtraction operation.
   */
  subtract(subtrahend: firestore.Pipelines.Expression): FunctionExpr;

  /**
   * Creates an expression that subtracts a constant value from this expression.
   *
   * ```typescript
   * // Subtract 20 from the value of the 'total' field
   * field("total").subtract(20);
   * ```
   *
   * @param subtrahend The constant value to subtract.
   * @return A new `Expression` representing the subtraction operation.
   */
  subtract(subtrahend: number): FunctionExpr;
  subtract(subtrahend: number | firestore.Pipelines.Expression): FunctionExpr {
    return new FunctionExpr('subtract', [this, valueToDefaultExpr(subtrahend)]);
  }

  /**
   * Creates an expression that multiplies this expression by another expression.
   *
   * ```typescript
   * // Multiply the 'quantity' field by the 'price' field
   * field("quantity").multiply(field("price"));
   * ```
   *
   * @param second The second expression or literal to multiply by.
   * @param others Optional additional expressions or literals to multiply by.
   * @return A new `Expression` representing the multiplication operation.
   */
  multiply(
    second: Expression | number,
    ...others: Array<Expression | number>
  ): FunctionExpr {
    return new FunctionExpr('multiply', [
      this,
      valueToDefaultExpr(second),
      ...others.map(value => valueToDefaultExpr(value)),
    ]);
  }

  /**
   * Creates an expression that divides this expression by another expression.
   *
   * ```typescript
   * // Divide the 'total' field by the 'count' field
   * field("total").divide(field("count"));
   * ```
   *
   * @param divisor The expression to divide by.
   * @return A new `Expression` representing the division operation.
   */
  divide(divisor: Expression): FunctionExpr;

  /**
   * Creates an expression that divides this expression by a constant value.
   *
   * ```typescript
   * // Divide the 'value' field by 10
   * field("value").divide(10);
   * ```
   *
   * @param divisor The constant value to divide by.
   * @return A new `Expression` representing the division operation.
   */
  divide(divisor: number): FunctionExpr;
  divide(divisor: number | Expression): FunctionExpr {
    return new FunctionExpr('divide', [this, valueToDefaultExpr(divisor)]);
  }

  /**
   * Creates an expression that calculates the modulo (remainder) of dividing this expression by another expression.
   *
   * ```typescript
   * // Calculate the remainder of dividing the 'value' field by the 'divisor' field
   * field("value").mod(field("divisor"));
   * ```
   *
   * @param expression The expression to divide by.
   * @return A new `Expression` representing the modulo operation.
   */
  mod(expression: Expression): FunctionExpr;

  /**
   * Creates an expression that calculates the modulo (remainder) of dividing this expression by a constant value.
   *
   * ```typescript
   * // Calculate the remainder of dividing the 'value' field by 10
   * field("value").mod(10);
   * ```
   *
   * @param value The constant value to divide by.
   * @return A new `Expression` representing the modulo operation.
   */
  mod(value: number): FunctionExpr;
  mod(other: number | Expression): FunctionExpr {
    return new FunctionExpr('mod', [this, valueToDefaultExpr(other)]);
  }

  /**
   * Creates an expression that checks if this expression is equal to another expression.
   *
   * ```typescript
   * // Check if the 'age' field is equal to 21
   * field("age").equal(21);
   * ```
   *
   * @param expression The expression to compare for equality.
   * @return A new `Expression` representing the equality comparison.
   */
  equal(expression: Expression): BooleanExpression;

  /**
   * Creates an expression that checks if this expression is equal to a constant value.
   *
   * ```typescript
   * // Check if the 'city' field is equal to "London"
   * field("city").equal("London");
   * ```
   *
   * @param value The constant value to compare for equality.
   * @return A new `Expression` representing the equality comparison.
   */
  equal(value: unknown): BooleanExpression;
  equal(other: unknown): BooleanExpression {
    return new BooleanExpression('equal', [this, valueToDefaultExpr(other)]);
  }

  /**
   * Creates an expression that checks if this expression is not equal to another expression.
   *
   * ```typescript
   * // Check if the 'status' field is not equal to "completed"
   * field("status").neq("completed");
   * ```
   *
   * @param expression The expression to compare for inequality.
   * @return A new `Expression` representing the inequality comparison.
   */
  neq(expression: Expression): BooleanExpression;

  /**
   * Creates an expression that checks if this expression is not equal to a constant value.
   *
   * ```typescript
   * // Check if the 'country' field is not equal to "USA"
   * field("country").neq("USA");
   * ```
   *
   * @param value The constant value to compare for inequality.
   * @return A new `Expression` representing the inequality comparison.
   */
  neq(value: unknown): BooleanExpression;
  neq(other: unknown): BooleanExpression {
    return new BooleanExpression('neq', [this, valueToDefaultExpr(other)]);
  }

  /**
   * Creates an expression that checks if this expression is less than another expression.
   *
   * ```typescript
   * // Check if the 'age' field is less than 'limit'
   * field("age").lessThan(field('limit'));
   * ```
   *
   * @param experession The expression to compare for less than.
   * @return A new `Expression` representing the less than comparison.
   */
  lessThan(experession: Expression): BooleanExpression;

  /**
   * Creates an expression that checks if this expression is less than a constant value.
   *
   * ```typescript
   * // Check if the 'price' field is less than 50
   * field("price").lessThan(50);
   * ```
   *
   * @param value The constant value to compare for less than.
   * @return A new `Expression` representing the less than comparison.
   */
  lessThan(value: unknown): BooleanExpression;
  lessThan(other: unknown): BooleanExpression {
    return new BooleanExpression('lessThan', [this, valueToDefaultExpr(other)]);
  }

  /**
   * Creates an expression that checks if this expression is less than or equal to another
   * expression.
   *
   * ```typescript
   * // Check if the 'quantity' field is less than or equal to 20
   * field("quantity").lte(constant(20));
   * ```
   *
   * @param expression The expression to compare for less than or equal to.
   * @return A new `Expression` representing the less than or equal to comparison.
   */
  lte(expression: Expression): BooleanExpression;

  /**
   * Creates an expression that checks if this expression is less than or equal to a constant value.
   *
   * ```typescript
   * // Check if the 'score' field is less than or equal to 70
   * field("score").lte(70);
   * ```
   *
   * @param value The constant value to compare for less than or equal to.
   * @return A new `Expression` representing the less than or equal to comparison.
   */
  lte(value: unknown): BooleanExpression;
  lte(other: unknown): BooleanExpression {
    return new BooleanExpression('lte', [this, valueToDefaultExpr(other)]);
  }

  /**
   * Creates an expression that checks if this expression is greater than another expression.
   *
   * ```typescript
   * // Check if the 'age' field is greater than the 'limit' field
   * field("age").greaterThan(field("limit"));
   * ```
   *
   * @param expression The expression to compare for greater than.
   * @return A new `Expression` representing the greater than comparison.
   */
  greaterThan(expression: Expression): BooleanExpression;

  /**
   * Creates an expression that checks if this expression is greater than a constant value.
   *
   * ```typescript
   * // Check if the 'price' field is greater than 100
   * field("price").greaterThan(100);
   * ```
   *
   * @param value The constant value to compare for greater than.
   * @return A new `Expression` representing the greater than comparison.
   */
  greaterThan(value: unknown): BooleanExpression;
  greaterThan(other: unknown): BooleanExpression {
    return new BooleanExpression('greaterThan', [this, valueToDefaultExpr(other)]);
  }

  /**
   * Creates an expression that checks if this expression is greater than or equal to another
   * expression.
   *
   * ```typescript
   * // Check if the 'quantity' field is greater than or equal to field 'requirement' plus 1
   * field("quantity").greaterThanOrEqual(field('requirement').add(1));
   * ```
   *
   * @param expression The expression to compare for greater than or equal to.
   * @return A new `Expression` representing the greater than or equal to comparison.
   */
  greaterThanOrEqual(expression: Expression): BooleanExpression;

  /**
   * Creates an expression that checks if this expression is greater than or equal to a constant
   * value.
   *
   * ```typescript
   * // Check if the 'score' field is greater than or equal to 80
   * field("score").greaterThanOrEqual(80);
   * ```
   *
   * @param value The constant value to compare for greater than or equal to.
   * @return A new `Expression` representing the greater than or equal to comparison.
   */
  greaterThanOrEqual(value: unknown): BooleanExpression;
  greaterThanOrEqual(other: unknown): BooleanExpression {
    return new BooleanExpression('greaterThanOrEqual', [this, valueToDefaultExpr(other)]);
  }

  /**
   * Creates an expression that checks if an array contains a specific element.
   *
   * ```typescript
   * // Check if the 'sizes' array contains the value from the 'selectedSize' field
   * field("sizes").arrayContains(field("selectedSize"));
   * ```
   *
   * @param expression The element to search for in the array.
   * @return A new `Expression` representing the 'array_contains' comparison.
   */
  arrayContains(expression: Expression): BooleanExpression;

  /**
   * Creates an expression that checks if an array contains a specific value.
   *
   * ```typescript
   * // Check if the 'colors' array contains "red"
   * field("colors").arrayContains("red");
   * ```
   *
   * @param value The element to search for in the array.
   * @return A new `Expression` representing the 'array_contains' comparison.
   */
  arrayContains(value: unknown): BooleanExpression;
  arrayContains(element: unknown): BooleanExpression {
    return new BooleanExpression('array_contains', [
      this,
      valueToDefaultExpr(element),
    ]);
  }

  /**
   * Creates an expression that checks if an array contains all the specified elements.
   *
   * ```typescript
   * // Check if the 'tags' array contains both the value in field "tag1" and the literal value "tag2"
   * field("tags").arrayContainsAll([field("tag1"), "tag2"]);
   * ```
   *
   * @param values The elements to check for in the array.
   * @return A new `Expression` representing the 'array_contains_all' comparison.
   */
  arrayContainsAll(values: Array<Expression | unknown>): BooleanExpression;

  /**
   * Creates an expression that checks if an array contains all the specified elements.
   *
   * ```typescript
   * // Check if the 'tags' array contains both of the values from field "tag1" and the literal value "tag2"
   * field("tags").arrayContainsAll(array([field("tag1"), "tag2"]));
   * ```
   *
   * @param arrayExpression The elements to check for in the array.
   * @return A new `Expression` representing the 'array_contains_all' comparison.
   */
  arrayContainsAll(arrayExpression: Expression): BooleanExpression;
  arrayContainsAll(values: unknown[] | Expression): BooleanExpression {
    const normalizedExpr = Array.isArray(values)
      ? new ListOfExprs(values.map(valueToDefaultExpr))
      : cast<Expression>(values);
    return new BooleanExpression('array_contains_all', [this, normalizedExpr]);
  }

  /**
   * Creates an expression that checks if an array contains any of the specified elements.
   *
   * ```typescript
   * // Check if the 'categories' array contains either values from field "cate1" or "cate2"
   * field("categories").arrayContainsAny([field("cate1"), field("cate2")]);
   * ```
   *
   * @param values The elements to check for in the array.
   * @return A new `Expression` representing the 'array_contains_any' comparison.
   */
  arrayContainsAny(values: Array<Expression | unknown>): BooleanExpression;

  /**
   * Creates an expression that checks if an array contains any of the specified elements.
   *
   * ```typescript
   * // Check if the 'groups' array contains either the value from the 'userGroup' field
   * // or the value "guest"
   * field("groups").arrayContainsAny(array([field("userGroup"), "guest"]));
   * ```
   *
   * @param arrayExpression The elements to check for in the array.
   * @return A new `Expression` representing the 'array_contains_any' comparison.
   */
  arrayContainsAny(arrayExpression: Expression): BooleanExpression;
  arrayContainsAny(values: Array<unknown | Expression> | Expression): BooleanExpression {
    const normalizedExpr = Array.isArray(values)
      ? new ListOfExprs(values.map(valueToDefaultExpr))
      : cast<Expression>(values);
    return new BooleanExpression('array_contains_any', [this, normalizedExpr]);
  }

  /**
   * Creates an expression that reverses an array.
   *
   * ```typescript
   * // Reverse the value of the 'myArray' field.
   * field("myArray").arrayReverse();
   * ```
   *
   * @return A new {@code Expression} representing the reversed array.
   */
  arrayReverse(): FunctionExpr {
    return new FunctionExpr('array_reverse', [this]);
  }

  /**
   * Creates an expression that calculates the length of an array.
   *
   * ```typescript
   * // Get the number of items in the 'cart' array
   * field("cart").arrayLength();
   * ```
   *
   * @return A new `Expression` representing the length of the array.
   */
  arrayLength(): FunctionExpr {
    return new FunctionExpr('array_length', [this]);
  }

  /**
   * Creates an expression that checks if this expression is equal to any of the provided values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
   * field("category").equalAny("Electronics", field("primaryType"));
   * ```
   *
   * @param values The values or expressions to check against.
   * @return A new `Expression` representing the 'IN' comparison.
   */
  equalAny(values: Array<Expression | unknown>): BooleanExpression;

  /**
   * Creates an expression that checks if this expression is equal to any of the provided values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
   * field("category").equalAny(array(["Electronics", field("primaryType")]));
   * ```
   *
   * @param arrayExpression An expression that evaluates to an array of values to check against.
   * @return A new `Expression` representing the 'IN' comparison.
   */
  equalAny(arrayExpression: Expression): BooleanExpression;
  equalAny(others: unknown[] | Expression): BooleanExpression {
    const exprOthers = Array.isArray(others)
      ? new ListOfExprs(others.map(valueToDefaultExpr))
      : cast<Expression>(others);
    return new BooleanExpression('eq_any', [this, exprOthers]);
  }

  /**
   * Creates an expression that checks if this expression is not equal to any of the provided values or
   * expressions.
   *
   * ```typescript
   * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
   * field("status").notEqAny(["pending", field("rejectedStatus")]);
   * ```
   *
   * @param values The values or expressions to check against.
   * @return A new `Expression` representing the 'NotEqAny' comparison.
   */
  notEqAny(values: Array<Expression | unknown>): BooleanExpression;

  /**
   * Creates an expression that checks if this expression is not equal to any of the values in the evaluated expression.
   *
   * ```typescript
   * // Check if the 'status' field is not equal to any value in the field 'rejectedStatuses'
   * field("status").notEqAny(field('rejectedStatuses'));
   * ```
   *
   * @param arrayExpression The values or expressions to check against.
   * @return A new `Expression` representing the 'NotEqAny' comparison.
   */
  notEqAny(arrayExpression: Expression): BooleanExpression;
  notEqAny(others: unknown[] | Expression): BooleanExpression {
    const exprOthers = Array.isArray(others)
      ? new ListOfExprs(others.map(valueToDefaultExpr))
      : cast<Expression>(others);
    return new BooleanExpression('not_eq_any', [this, exprOthers]);
  }

  /**
   * Creates an expression that checks if this expression evaluates to 'NaN' (Not a Number).
   *
   * ```typescript
   * // Check if the result of a calculation is NaN
   * field("value").divide(0).isNan();
   * ```
   *
   * @return A new `Expression` representing the 'isNan' check.
   */
  isNan(): BooleanExpression {
    return new BooleanExpression('is_nan', [this]);
  }

  /**
   * Creates an expression that checks if this expression evaluates to 'Null'.
   *
   * ```typescript
   * // Check if the result of a calculation is NaN
   * field("value").isNull();
   * ```
   *
   * @return A new `Expression` representing the 'isNull' check.
   */
  isNull(): BooleanExpression {
    return new BooleanExpression('is_null', [this]);
  }

  /**
   * Creates an expression that checks if a field exists in the document.
   *
   * ```typescript
   * // Check if the document has a field named "phoneNumber"
   * field("phoneNumber").exists();
   * ```
   *
   * @return A new `Expression` representing the 'exists' check.
   */
  exists(): BooleanExpression {
    return new BooleanExpression('exists', [this]);
  }

  /**
   * Creates an expression that calculates the character length of a string in UTF-8.
   *
   * ```typescript
   * // Get the character length of the 'name' field in its UTF-8 form.
   * field("name").charLength();
   * ```
   *
   * @return A new `Expression` representing the length of the string.
   */
  charLength(): FunctionExpr {
    return new FunctionExpr('char_length', [this]);
  }

  /**
   * Creates an expression that performs a case-sensitive string comparison.
   *
   * ```typescript
   * // Check if the 'title' field contains the word "guide" (case-sensitive)
   * field("title").like("%guide%");
   * ```
   *
   * @param pattern The pattern to search for. You can use "%" as a wildcard character.
   * @return A new `Expression` representing the 'like' comparison.
   */
  like(pattern: string): FunctionExpr;

  /**
   * Creates an expression that performs a case-sensitive string comparison.
   *
   * ```typescript
   * // Check if the 'title' field contains the word "guide" (case-sensitive)
   * field("title").like("%guide%");
   * ```
   *
   * @param pattern The pattern to search for. You can use "%" as a wildcard character.
   * @return A new `Expression` representing the 'like' comparison.
   */
  like(pattern: Expression): FunctionExpr;
  like(stringOrExpr: string | Expression): FunctionExpr {
    return new BooleanExpression('like', [this, valueToDefaultExpr(stringOrExpr)]);
  }

  /**
   * Creates an expression that checks if a string contains a specified regular expression as a
   * substring.
   *
   * ```typescript
   * // Check if the 'description' field contains "example" (case-insensitive)
   * field("description").regexContains("(?i)example");
   * ```
   *
   * @param pattern The regular expression to use for the search.
   * @return A new `Expression` representing the 'contains' comparison.
   */
  regexContains(pattern: string): BooleanExpression;

  /**
   * Creates an expression that checks if a string contains a specified regular expression as a
   * substring.
   *
   * ```typescript
   * // Check if the 'description' field contains the regular expression stored in field 'regex'
   * field("description").regexContains(field("regex"));
   * ```
   *
   * @param pattern The regular expression to use for the search.
   * @return A new `Expression` representing the 'contains' comparison.
   */
  regexContains(pattern: Expression): BooleanExpression;
  regexContains(stringOrExpr: string | Expression): BooleanExpression {
    return new BooleanExpression('regex_contains', [
      this,
      valueToDefaultExpr(stringOrExpr),
    ]);
  }

  /**
   * Creates an expression that checks if a string matches a specified regular expression.
   *
   * ```typescript
   * // Check if the 'email' field matches a valid email pattern
   * field("email").regexMatch("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
   * ```
   *
   * @param pattern The regular expression to use for the match.
   * @return A new `Expression` representing the regular expression match.
   */
  regexMatch(pattern: string): BooleanExpression;

  /**
   * Creates an expression that checks if a string matches a specified regular expression.
   *
   * ```typescript
   * // Check if the 'email' field matches a regular expression stored in field 'regex'
   * field("email").regexMatch(field("regex"));
   * ```
   *
   * @param pattern The regular expression to use for the match.
   * @return A new `Expression` representing the regular expression match.
   */
  regexMatch(pattern: Expression): BooleanExpression;
  regexMatch(stringOrExpr: string | Expression): BooleanExpression {
    return new BooleanExpression('regex_match', [
      this,
      valueToDefaultExpr(stringOrExpr),
    ]);
  }

  /**
   * Creates an expression that checks if a string contains a specified substring.
   *
   * ```typescript
   * // Check if the 'description' field contains "example".
   * field("description").strContains("example");
   * ```
   *
   * @param substring The substring to search for.
   * @return A new `Expression` representing the 'contains' comparison.
   */
  strContains(substring: string): BooleanExpression;

  /**
   * Creates an expression that checks if a string contains the string represented by another expression.
   *
   * ```typescript
   * // Check if the 'description' field contains the value of the 'keyword' field.
   * field("description").strContains(field("keyword"));
   * ```
   *
   * @param expr The expression representing the substring to search for.
   * @return A new `Expression` representing the 'contains' comparison.
   */
  strContains(expr: Expression): BooleanExpression;
  strContains(stringOrExpr: string | Expression): BooleanExpression {
    return new BooleanExpression('str_contains', [
      this,
      valueToDefaultExpr(stringOrExpr),
    ]);
  }

  /**
   * Creates an expression that checks if a string starts with a given prefix.
   *
   * ```typescript
   * // Check if the 'name' field starts with "Mr."
   * field("name").startsWith("Mr.");
   * ```
   *
   * @param prefix The prefix to check for.
   * @return A new `Expression` representing the 'starts with' comparison.
   */
  startsWith(prefix: string): BooleanExpression;

  /**
   * Creates an expression that checks if a string starts with a given prefix (represented as an
   * expression).
   *
   * ```typescript
   * // Check if the 'fullName' field starts with the value of the 'firstName' field
   * field("fullName").startsWith(field("firstName"));
   * ```
   *
   * @param prefix The prefix expression to check for.
   * @return A new `Expression` representing the 'starts with' comparison.
   */
  startsWith(prefix: Expression): BooleanExpression;
  startsWith(stringOrExpr: string | Expression): BooleanExpression {
    return new BooleanExpression('starts_with', [
      this,
      valueToDefaultExpr(stringOrExpr),
    ]);
  }

  /**
   * Creates an expression that checks if a string ends with a given postfix.
   *
   * ```typescript
   * // Check if the 'filename' field ends with ".txt"
   * field("filename").endsWith(".txt");
   * ```
   *
   * @param suffix The postfix to check for.
   * @return A new `Expression` representing the 'ends with' comparison.
   */
  endsWith(suffix: string): BooleanExpression;

  /**
   * Creates an expression that checks if a string ends with a given postfix (represented as an
   * expression).
   *
   * ```typescript
   * // Check if the 'url' field ends with the value of the 'extension' field
   * field("url").endsWith(field("extension"));
   * ```
   *
   * @param suffix The postfix expression to check for.
   * @return A new `Expression` representing the 'ends with' comparison.
   */
  endsWith(suffix: Expression): BooleanExpression;
  endsWith(stringOrExpr: string | Expression): BooleanExpression {
    return new BooleanExpression('ends_with', [
      this,
      valueToDefaultExpr(stringOrExpr),
    ]);
  }

  /**
   * Creates an expression that converts a string to lowercase.
   *
   * ```typescript
   * // Convert the 'name' field to lowercase
   * field("name").toLower();
   * ```
   *
   * @return A new `Expression` representing the lowercase string.
   */
  toLower(): FunctionExpr {
    return new FunctionExpr('to_lower', [this]);
  }

  /**
   * Creates an expression that converts a string to uppercase.
   *
   * ```typescript
   * // Convert the 'title' field to uppercase
   * field("title").toUpper();
   * ```
   *
   * @return A new `Expression` representing the uppercase string.
   */
  toUpper(): FunctionExpr {
    return new FunctionExpr('to_upper', [this]);
  }

  /**
   * Creates an expression that removes leading and trailing whitespace from a string.
   *
   * ```typescript
   * // Trim whitespace from the 'userInput' field
   * field("userInput").trim();
   * ```
   *
   * @return A new `Expression` representing the trimmed string.
   */
  trim(): FunctionExpr {
    return new FunctionExpr('trim', [this]);
  }

  /**
   * Creates an expression that concatenates string expressions together.
   *
   * ```typescript
   * // Combine the 'firstName', " ", and 'lastName' fields into a single string
   * field("firstName").strConcat(constant(" "), field("lastName"));
   * ```
   *
   * @param secondString The additional expression or string literal to concatenate.
   * @param otherStrings Optional additional expressions or string literals to concatenate.
   * @return A new `Expression` representing the concatenated string.
   */
  strConcat(
    secondString: Expression | string,
    ...otherStrings: Array<Expression | string>
  ): FunctionExpr {
    const elements = [secondString, ...otherStrings];
    const exprs = elements.map(valueToDefaultExpr);
    return new FunctionExpr('str_concat', [this, ...exprs]);
  }

  /**
   * Creates an expression that reverses this string expression.
   *
   * ```typescript
   * // Reverse the value of the 'myString' field.
   * field("myString").reverse();
   * ```
   *
   * @return A new {@code Expression} representing the reversed string.
   */
  reverse(): FunctionExpr {
    return new FunctionExpr('reverse', [this]);
  }

  /**
   * Creates an expression that calculates the length of this string expression in bytes.
   *
   * ```typescript
   * // Calculate the length of the 'myString' field in bytes.
   * field("myString").byteLength();
   * ```
   *
   * @return A new {@code Expression} representing the length of the string in bytes.
   */
  byteLength(): FunctionExpr {
    return new FunctionExpr('byte_length', [this]);
  }

  /**
   * Creates an expression that computes the ceiling of a numeric value.
   *
   * ```typescript
   * // Compute the ceiling of the 'price' field.
   * field("price").ceil();
   * ```
   *
   * @return A new {@code Expression} representing the ceiling of the numeric value.
   */
  ceil(): FunctionExpr {
    return new FunctionExpr('ceil', [this]);
  }

  /**
   * Creates an expression that computes the floor of a numeric value.
   *
   * ```typescript
   * // Compute the floor of the 'price' field.
   * field("price").floor();
   * ```
   *
   * @return A new {@code Expression} representing the floor of the numeric value.
   */
  floor(): FunctionExpr {
    return new FunctionExpr('floor', [this]);
  }

  /**
   * Creates an expression that computes e to the power of this expression.
   *
   * ```typescript
   * // Compute e to the power of the 'value' field.
   * field("value").exp();
   * ```
   *
   * @return A new {@code Expression} representing the exp of the numeric value.
   */
  exp(): FunctionExpr {
    return new FunctionExpr('exp', [this]);
  }

  /**
   * Accesses a value from a map (object) field using the provided key.
   *
   * ```typescript
   * // Get the 'city' value from the 'address' map field
   * field("address").mapGet("city");
   * ```
   *
   * @param subfield The key to access in the map.
   * @return A new `Expression` representing the value associated with the given key in the map.
   */
  mapGet(subfield: string): FunctionExpr {
    return new FunctionExpr('map_get', [this, constant(subfield)]);
  }

  /**
   * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
   * expression or field.
   *
   * ```typescript
   * // Count the total number of products
   * field("productId").count().as("totalProducts");
   * ```
   *
   * @return A new `AggregateFunction` representing the 'count' aggregation.
   */
  count(): AggregateFunction {
    return new AggregateFunction('count', [this]);
  }

  /**
   * Creates an aggregation that calculates the sum of a numeric field across multiple stage inputs.
   *
   * ```typescript
   * // Calculate the total revenue from a set of orders
   * field("orderAmount").sum().as("totalRevenue");
   * ```
   *
   * @return A new `AggregateFunction` representing the 'sum' aggregation.
   */
  sum(): AggregateFunction {
    return new AggregateFunction('sum', [this]);
  }

  /**
   * Creates an aggregation that calculates the average (mean) of a numeric field across multiple
   * stage inputs.
   *
   * ```typescript
   * // Calculate the average age of users
   * field("age").avg().as("averageAge");
   * ```
   *
   * @return A new `AggregateFunction` representing the 'avg' aggregation.
   */
  avg(): AggregateFunction {
    return new AggregateFunction('avg', [this]);
  }

  /**
   * Creates an aggregation that finds the minimum value of a field across multiple stage inputs.
   *
   * ```typescript
   * // Find the lowest price of all products
   * field("price").minimum().as("lowestPrice");
   * ```
   *
   * @return A new `AggregateFunction` representing the 'min' aggregation.
   */
  minimum(): AggregateFunction {
    return new AggregateFunction('min', [this]);
  }

  /**
   * Creates an aggregation that finds the maximum value of a field across multiple stage inputs.
   *
   * ```typescript
   * // Find the highest score in a leaderboard
   * field("score").maximum().as("highestScore");
   * ```
   *
   * @return A new `AggregateFunction` representing the 'max' aggregation.
   */
  maximum(): AggregateFunction {
    return new AggregateFunction('max', [this]);
  }

  /**
   * Creates an aggregation that counts the number of distinct values of the expression or field.
   *
   * ```typescript
   * // Count the distinct number of products
   * field("productId").countDistinct().as("distinctProducts");
   * ```
   *
   * @return A new `AggregateFunction` representing the 'count_distinct' aggregation.
   */
  countDistinct(): AggregateFunction {
    return new AggregateFunction('count_distinct', [this]);
  }

  /**
   * Creates an expression that returns the larger value between this expression and another expression, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the larger value between the 'timestamp' field and the current timestamp.
   * field("timestamp").logicalMaximum(Function.currentTimestamp());
   * ```
   *
   * @param second The second expression or literal to compare with.
   * @param others Optional additional expressions or literals to compare with.
   * @return A new {@code Expression} representing the logical max operation.
   */
  logicalMaximum(
    second: Expression | unknown,
    ...others: Array<Expression | unknown>
  ): FunctionExpr {
    const values = [second, ...others];
    return new FunctionExpr('max', [this, ...values.map(valueToDefaultExpr)]);
  }

  /**
   * Creates an expression that returns the smaller value between this expression and another expression, based on Firestore's value type ordering.
   *
   * ```typescript
   * // Returns the smaller value between the 'timestamp' field and the current timestamp.
   * field("timestamp").logicalMinimum(Function.currentTimestamp());
   * ```
   *
   * @param second The second expression or literal to compare with.
   * @param others Optional additional expressions or literals to compare with.
   * @return A new {@code Expression} representing the logical min operation.
   */
  logicalMinimum(
    second: Expression | unknown,
    ...others: Array<Expression | unknown>
  ): FunctionExpr {
    const values = [second, ...others];
    return new FunctionExpr('min', [this, ...values.map(valueToDefaultExpr)]);
  }

  /**
   * Creates an expression that calculates the length (number of dimensions) of this Firestore Vector expression.
   *
   * ```typescript
   * // Get the vector length (dimension) of the field 'embedding'.
   * field("embedding").vectorLength();
   * ```
   *
   * @return A new {@code Expression} representing the length of the vector.
   */
  vectorLength(): FunctionExpr {
    return new FunctionExpr('vector_length', [this]);
  }

  /**
   * Calculates the cosine distance between two vectors.
   *
   * ```typescript
   * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
   * field("userVector").cosineDistance(field("itemVector"));
   * ```
   *
   * @param vectorExpression The other vector (represented as an Expression) to compare against.
   * @return A new `Expression` representing the cosine distance between the two vectors.
   */
  cosineDistance(vectorExpression: Expression): FunctionExpr;
  /**
   * Calculates the Cosine distance between two vectors.
   *
   * ```typescript
   * // Calculate the Cosine distance between the 'location' field and a target location
   * field("location").cosineDistance(new VectorValue([37.7749, -122.4194]));
   * ```
   *
   * @param vector The other vector (as a VectorValue) to compare against.
   * @return A new `Expression` representing the Cosine* distance between the two vectors.
   */
  cosineDistance(vector: firestore.VectorValue | number[]): FunctionExpr;
  cosineDistance(other: Expression | firestore.VectorValue | number[]): FunctionExpr {
    return new FunctionExpr('cosine_distance', [this, vectorToExpr(other)]);
  }

  /**
   * Calculates the dot product between two vectors.
   *
   * ```typescript
   * // Calculate the dot product between a feature vector and a target vector
   * field("features").dotProduct([0.5, 0.8, 0.2]);
   * ```
   *
   * @param vectorExpression The other vector (as an array of numbers) to calculate with.
   * @return A new `Expression` representing the dot product between the two vectors.
   */
  dotProduct(vectorExpression: Expression): FunctionExpr;

  /**
   * Calculates the dot product between two vectors.
   *
   * ```typescript
   * // Calculate the dot product between a feature vector and a target vector
   * field("features").dotProduct(new VectorValue([0.5, 0.8, 0.2]));
   * ```
   *
   * @param vector The other vector (as an array of numbers) to calculate with.
   * @return A new `Expression` representing the dot product between the two vectors.
   */
  dotProduct(vector: firestore.VectorValue | number[]): FunctionExpr;
  dotProduct(other: Expression | firestore.VectorValue | number[]): FunctionExpr {
    return new FunctionExpr('dot_product', [this, vectorToExpr(other)]);
  }

  /**
   * Calculates the Euclidean distance between two vectors.
   *
   * ```typescript
   * // Calculate the Euclidean distance between the 'location' field and a target location
   * field("location").euclideanDistance([37.7749, -122.4194]);
   * ```
   *
   * @param vectorExpression The other vector (as an array of numbers) to calculate with.
   * @return A new `Expression` representing the Euclidean distance between the two vectors.
   */
  euclideanDistance(vectorExpression: Expression): FunctionExpr;

  /**
   * Calculates the Euclidean distance between two vectors.
   *
   * ```typescript
   * // Calculate the Euclidean distance between the 'location' field and a target location
   * field("location").euclideanDistance(new VectorValue([37.7749, -122.4194]));
   * ```
   *
   * @param vector The other vector (as a VectorValue) to compare against.
   * @return A new `Expression` representing the Euclidean distance between the two vectors.
   */
  euclideanDistance(vector: firestore.VectorValue | number[]): FunctionExpr;
  euclideanDistance(
    other: Expression | firestore.VectorValue | number[]
  ): FunctionExpr {
    return new FunctionExpr('euclidean_distance', [this, vectorToExpr(other)]);
  }

  /**
   * Creates an expression that interprets this expression as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
   * and returns a timestamp.
   *
   * ```typescript
   * // Interpret the 'microseconds' field as microseconds since epoch.
   * field("microseconds").unixMicrosToTimestamp();
   * ```
   *
   * @return A new {@code Expression} representing the timestamp.
   */
  unixMicrosToTimestamp(): FunctionExpr {
    return new FunctionExpr('unix_micros_to_timestamp', [this]);
  }

  /**
   * Creates an expression that converts this timestamp expression to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
   *
   * ```typescript
   * // Convert the 'timestamp' field to microseconds since epoch.
   * field("timestamp").timestampToUnixMicros();
   * ```
   *
   * @return A new {@code Expression} representing the number of microseconds since epoch.
   */
  timestampToUnixMicros(): FunctionExpr {
    return new FunctionExpr('timestamp_to_unix_micros', [this]);
  }

  /**
   * Creates an expression that interprets this expression as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
   * and returns a timestamp.
   *
   * ```typescript
   * // Interpret the 'milliseconds' field as milliseconds since epoch.
   * field("milliseconds").unixMillisToTimestamp();
   * ```
   *
   * @return A new {@code Expression} representing the timestamp.
   */
  unixMillisToTimestamp(): FunctionExpr {
    return new FunctionExpr('unix_millis_to_timestamp', [this]);
  }

  /**
   * Creates an expression that converts this timestamp expression to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
   *
   * ```typescript
   * // Convert the 'timestamp' field to milliseconds since epoch.
   * field("timestamp").timestampToUnixMillis();
   * ```
   *
   * @return A new {@code Expression} representing the number of milliseconds since epoch.
   */
  timestampToUnixMillis(): FunctionExpr {
    return new FunctionExpr('timestamp_to_unix_millis', [this]);
  }

  /**
   * Creates an expression that interprets this expression as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
   * and returns a timestamp.
   *
   * ```typescript
   * // Interpret the 'seconds' field as seconds since epoch.
   * field("seconds").unixSecondsToTimestamp();
   * ```
   *
   * @return A new {@code Expression} representing the timestamp.
   */
  unixSecondsToTimestamp(): FunctionExpr {
    return new FunctionExpr('unix_seconds_to_timestamp', [this]);
  }

  /**
   * Creates an expression that converts this timestamp expression to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
   *
   * ```typescript
   * // Convert the 'timestamp' field to seconds since epoch.
   * field("timestamp").timestampToUnixSeconds();
   * ```
   *
   * @return A new {@code Expression} representing the number of seconds since epoch.
   */
  timestampToUnixSeconds(): FunctionExpr {
    return new FunctionExpr('timestamp_to_unix_seconds', [this]);
  }

  /**
   * Creates an expression that adds a specified amount of time to this timestamp expression.
   *
   * ```typescript
   * // Add some duration determined by field 'unit' and 'amount' to the 'timestamp' field.
   * field("timestamp").timestampAdd(field("unit"), field("amount"));
   * ```
   *
   * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
   * @param amount The expression evaluates to amount of the unit.
   * @return A new {@code Expression} representing the resulting timestamp.
   */
  timestampAdd(unit: Expression, amount: Expression): FunctionExpr;

  /**
   * Creates an expression that adds a specified amount of time to this timestamp expression.
   *
   * ```typescript
   * // Add 1 day to the 'timestamp' field.
   * field("timestamp").timestampAdd("day", 1);
   * ```
   *
   * @param unit The unit of time to add (e.g., "day", "hour").
   * @param amount The amount of time to add.
   * @return A new {@code Expression} representing the resulting timestamp.
   */
  timestampAdd(
    unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
    amount: number
  ): FunctionExpr;
  timestampAdd(
    unit:
      | Expression
      | 'microsecond'
      | 'millisecond'
      | 'second'
      | 'minute'
      | 'hour'
      | 'day',
    amount: Expression | number
  ): FunctionExpr {
    return new FunctionExpr('timestamp_add', [
      this,
      valueToDefaultExpr(unit),
      valueToDefaultExpr(amount),
    ]);
  }

  /**
   * Creates an expression that subtracts a specified amount of time from this timestamp expression.
   *
   * ```typescript
   * // Subtract some duration determined by field 'unit' and 'amount' from the 'timestamp' field.
   * field("timestamp").timestampSub(field("unit"), field("amount"));
   * ```
   *
   * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
   * @param amount The expression evaluates to amount of the unit.
   * @return A new {@code Expression} representing the resulting timestamp.
   */
  timestampSub(unit: Expression, amount: Expression): FunctionExpr;

  /**
   * Creates an expression that subtracts a specified amount of time from this timestamp expression.
   *
   * ```typescript
   * // Subtract 1 day from the 'timestamp' field.
   * field("timestamp").timestampSub("day", 1);
   * ```
   *
   * @param unit The unit of time to subtract (e.g., "day", "hour").
   * @param amount The amount of time to subtract.
   * @return A new {@code Expression} representing the resulting timestamp.
   */
  timestampSub(
    unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
    amount: number
  ): FunctionExpr;
  timestampSub(
    unit:
      | Expression
      | 'microsecond'
      | 'millisecond'
      | 'second'
      | 'minute'
      | 'hour'
      | 'day',
    amount: Expression | number
  ): FunctionExpr {
    return new FunctionExpr('timestamp_sub', [
      this,
      valueToDefaultExpr(unit),
      valueToDefaultExpr(amount),
    ]);
  }

  /**
   * Creates an expression that returns the document ID from a path.
   *
   * ```typescript
   * // Get the document ID from a path.
   * field("__path__").documentId();
   * ```
   *
   * @return A new {@code Expression} representing the documentId operation.
   */
  documentId(): FunctionExpr {
    return new FunctionExpr('document_id', [this]);
  }

  /**
   * Creates an expression that returns a substring of the results of this expression.
   *
   * @param position Index of the first character of the substring.
   * @param length Length of the substring. If not provided, the substring will
   * end at the end of the input.
   */
  substring(position: number, length?: number): FunctionExpr;

  /**
   * Creates an expression that returns a substring of the results of this expression.
   *
   * @param position An expression returning the index of the first character of the substring.
   * @param length An expression returning the length of the substring. If not provided the
   * substring will end at the end of the input.
   */
  substring(position: Expression, length?: Expression): FunctionExpr;
  substring(position: Expression | number, length?: Expression | number): FunctionExpr {
    const positionExpr = valueToDefaultExpr(position);
    if (length === undefined) {
      return new FunctionExpr('substr', [this, positionExpr]);
    } else {
      return new FunctionExpr('substr', [
        this,
        positionExpr,
        valueToDefaultExpr(length),
      ]);
    }
  }

  /**
   * Creates an expression that indexes into an array from the beginning or end
   * and returns the element. If the index exceeds the array length, an error is
   * returned. A negative index, starts from the end.
   *
   * ```typescript
   * // Return the value in the 'tags' field array at index `1`.
   * field('tags').arrayGet(1);
   * ```
   *
   * @param index The index of the element to return.
   * @return A new Expression representing the 'arrayGet' operation.
   */
  arrayGet(index: number): FunctionExpr;

  /**
   * Creates an expression that indexes into an array from the beginning or end
   * and returns the element. If the index exceeds the array length, an error is
   * returned. A negative index, starts from the end.
   *
   * ```typescript
   * // Return the value in the tags field array at index specified by field
   * // 'favoriteTag'.
   * field('tags').arrayGet(field('favoriteTag'));
   * ```
   *
   * @param indexExpr An Expression evaluating to the index of the element to return.
   * @return A new Expression representing the 'arrayGet' operation.
   */
  arrayGet(indexExpr: Expression): FunctionExpr;
  arrayGet(index: Expression | number): FunctionExpr {
    return new FunctionExpr('array_get', [this, valueToDefaultExpr(index)]);
  }

  /**
   * Creates an expression that checks if a given expression produces an error.
   *
   * ```typescript
   * // Check if the result of a calculation is an error
   * field("title").arrayContains(1).isError();
   * ```
   *
   * @return A new {@code BooleanExpression} representing the 'isError' check.
   */
  isError(): BooleanExpression {
    return new BooleanExpression('is_error', [this]);
  }

  /**
   * Creates an expression that returns the result of the `catchExpr` argument
   * if there is an error, else return the result of this expression.
   *
   * ```typescript
   * // Returns the first item in the title field arrays, or returns
   * // the entire title field if the array is empty or the field is another type.
   * field("title").arrayGet(0).ifError(field("title"));
   * ```
   *
   * @param catchExpr The catch expression that will be evaluated and
   * returned if this expression produces an error.
   * @return A new {@code Expression} representing the 'ifError' operation.
   */
  ifError(catchExpr: Expression): FunctionExpr;

  /**
   * Creates an expression that returns the `catch` argument if there is an
   * error, else return the result of this expression.
   *
   * ```typescript
   * // Returns the first item in the title field arrays, or returns
   * // "Default Title"
   * field("title").arrayGet(0).ifError("Default Title");
   * ```
   *
   * @param catchValue The value that will be returned if this expression
   * produces an error.
   * @return A new {@code Expression} representing the 'ifError' operation.
   */
  ifError(catchValue: unknown): FunctionExpr;
  ifError(catchValue: unknown): FunctionExpr {
    return new FunctionExpr('if_error', [this, valueToDefaultExpr(catchValue)]);
  }

  /**
   * Creates an expression that returns `true` if the result of this expression
   * is absent. Otherwise, returns `false` even if the value is `null`.
   *
   * ```typescript
   * // Check if the field `value` is absent.
   * field("value").isAbsent();
   * ```
   *
   * @return A new {@code BooleanExpression} representing the 'isAbsent' check.
   */
  isAbsent(): BooleanExpression {
    return new BooleanExpression('is_absent', [this]);
  }

  /**
   * Creates an expression that checks if tbe result of an expression is not null.
   *
   * ```typescript
   * // Check if the value of the 'name' field is not null
   * field("name").isNotNull();
   * ```
   *
   * @return A new {@code BooleanExpression} representing the 'isNotNull' check.
   */
  isNotNull(): BooleanExpression {
    return new BooleanExpression('is_not_null', [this]);
  }

  /**
   * Creates an expression that checks if the results of this expression is NOT 'NaN' (Not a Number).
   *
   * ```typescript
   * // Check if the result of a calculation is NOT NaN
   * field("value").divide(0).isNotNan();
   * ```
   *
   * @return A new {@code Expression} representing the 'isNan' check.
   */
  isNotNan(): BooleanExpression {
    return new BooleanExpression('is_not_nan', [this]);
  }

  /**
   * Creates an expression that removes a key from the map produced by evaluating this expression.
   *
   * ```
   * // Removes the key 'baz' from the input map.
   * map({foo: 'bar', baz: true}).mapRemove('baz');
   * ```
   *
   * @param key The name of the key to remove from the input map.
   * @returns A new {@code FirestoreFunction} representing the 'mapRemove' operation.
   */
  mapRemove(key: string): FunctionExpr;
  /**
   * Creates an expression that removes a key from the map produced by evaluating this expression.
   *
   * ```
   * // Removes the key 'baz' from the input map.
   * map({foo: 'bar', baz: true}).mapRemove(constant('baz'));
   * ```
   *
   * @param keyExpr An expression that produces the name of the key to remove from the input map.
   * @returns A new {@code FirestoreFunction} representing the 'mapRemove' operation.
   */
  mapRemove(keyExpr: Expression): FunctionExpr;
  mapRemove(stringExpr: Expression | string): FunctionExpr {
    return new FunctionExpr('map_remove', [
      this,
      valueToDefaultExpr(stringExpr),
    ]);
  }

  /**
   * Creates an expression that merges multiple map values.
   *
   * ```
   * // Merges the map in the settings field with, a map literal, and a map in
   * // that is conditionally returned by another expression
   * field('settings').mapMerge({ enabled: true }, cond(field('isAdmin'), { admin: true}, {})
   * ```
   *
   * @param secondMap A required second map to merge. Represented as a literal or
   * an expression that returns a map.
   * @param otherMaps Optional additional maps to merge. Each map is represented
   * as a literal or an expression that returns a map.
   *
   * @returns A new {@code FirestoreFunction} representing the 'mapMerge' operation.
   */
  mapMerge(
    secondMap: Record<string, unknown> | Expression,
    ...otherMaps: Array<Record<string, unknown> | Expression>
  ): FunctionExpr {
    const secondMapExpr = valueToDefaultExpr(secondMap);
    const otherMapExprs = otherMaps.map(valueToDefaultExpr);
    return new FunctionExpr('map_merge', [
      this,
      secondMapExpr,
      ...otherMapExprs,
    ]);
  }

  /**
   * Creates an expression that returns the value of this expression raised to the power of another expression.
   *
   * ```typescript
   * // Raise the value of the 'base' field to the power of the 'exponent' field.
   * field("base").pow(field("exponent"));
   * ```
   *
   * @param exponent The expression to raise this expression to the power of.
   * @return A new `Expression` representing the power operation.
   */
  pow(exponent: Expression): FunctionExpr;

  /**
   * Creates an expression that returns the value of this expression raised to the power of a constant value.
   *
   * ```typescript
   * // Raise the value of the 'base' field to the power of 2.
   * field("base").pow(2);
   * ```
   *
   * @param exponent The constant value to raise this expression to the power of.
   * @return A new `Expression` representing the power operation.
   */
  pow(exponent: number): FunctionExpr;
  pow(exponent: number | Expression): FunctionExpr {
    return new FunctionExpr('pow', [this, valueToDefaultExpr(exponent)]);
  }

  /**
   * Creates an expression that rounds a numeric value to the nearest whole number.
   *
   * ```typescript
   * // Round the value of the 'price' field.
   * field("price").round();
   * ```
   *
   * @return A new `Expression` representing the rounded value.
   */
  round(): FunctionExpr {
    return new FunctionExpr('round', [this]);
  }

  /**
   * Creates an expression that returns the collection ID from a path.
   *
   * ```typescript
   * // Get the collection ID from a path.
   * field("__path__").collectionId();
   * ```
   *
   * @return A new {@code Expression} representing the collectionId operation.
   */
  collectionId(): FunctionExpr {
    return new FunctionExpr('collection_id', [this]);
  }

  /**
   * Creates an expression that calculates the length of a string, array, map, vector, or bytes.
   *
   * ```typescript
   * // Get the length of the 'name' field.
   * field("name").length();
   *
   * // Get the number of items in the 'cart' array.
   * field("cart").length();
   * ```
   *
   * @return A new `Expression` representing the length of the string, array, map, vector, or bytes.
   */
  length(): FunctionExpr {
    return new FunctionExpr('length', [this]);
  }

  /**
   * Creates an expression that computes the natural logarithm of a numeric value.
   *
   * ```typescript
   * // Compute the natural logarithm of the 'value' field.
   * field("value").ln();
   * ```
   *
   * @return A new {@code Expression} representing the natural logarithm of the numeric value.
   */
  ln(): FunctionExpr {
    return new FunctionExpr('ln', [this]);
  }

  /**
   * Creates an expression that computes the logarithm of this expression to a given base.
   *
   * ```typescript
   * // Compute the logarithm of the 'value' field with base 10.
   * field("value").log(10);
   * ```
   *
   * @param base The base of the logarithm.
   * @return A new {@code Expression} representing the logarithm of the numeric value.
   */
  log(base: number): FunctionExpr;

  /**
   * Creates an expression that computes the logarithm of this expression to a given base.
   *
   * ```typescript
   * // Compute the logarithm of the 'value' field with the base in the 'base' field.
   * field("value").log(field("base"));
   * ```
   *
   * @param base The base of the logarithm.
   * @return A new {@code Expression} representing the logarithm of the numeric value.
   */
  log(base: Expression): FunctionExpr;
  log(base: number | Expression): FunctionExpr {
    return new FunctionExpr('log', [this, valueToDefaultExpr(base)]);
  }

  /**
   * Creates an expression that computes the square root of a numeric value.
   *
   * ```typescript
   * // Compute the square root of the 'value' field.
   * field("value").sqrt();
   * ```
   *
   * @return A new {@code Expression} representing the square root of the numeric value.
   */
  sqrt(): FunctionExpr {
    return new FunctionExpr('sqrt', [this]);
  }

  /**
   * Creates an expression that reverses a string.
   *
   * ```typescript
   * // Reverse the value of the 'myString' field.
   * field("myString").strReverse();
   * ```
   *
   * @return A new {@code Expression} representing the reversed string.
   */
  strReverse(): FunctionExpr {
    return new FunctionExpr('str_reverse', [this]);
  }

  // TODO(new-expression): Add new expression method definitions above this line

  /**
   * Creates an {@link Ordering} that sorts documents in ascending order based on this expression.
   *
   * ```typescript
   * // Sort documents by the 'name' field in ascending order
   * pipeline().collection("users")
   *   .sort(field("name").ascending());
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
   *   .sort(field("createdAt").descending());
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
   *   .addFields(field("price").multiply(field("quantity")).as("totalPrice"));
   * ```
   *
   * @param name The alias to assign to this expression.
   * @return A new {@link AliasedExpr} that wraps this
   *     expression and associates it with the provided alias.
   */
  as(name: string): AliasedExpr {
    return new AliasedExpr(this, name);
  }
}

/**
 * A class that represents an aggregate function.
 */
export class AggregateFunction implements AggregateFunction, HasUserData {
  exprType: firestore.Pipelines.ExprType = 'AggregateFunction';

  /**
   * @internal
   * @private
   * Indicates if this expression was created from a literal value passed
   * by the caller.
   */
  _createdFromLiteral = false;

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    this.params.forEach(expr => {
      return expr._validateUserData(ignoreUndefinedProperties);
    });
  }

  constructor(
    private name: string,
    private params: Expression[]
  ) {}

  /**
   * Assigns an alias to this AggregateFunction. The alias specifies the name that
   * the aggregated value will have in the output document.
   *
   * ```typescript
   * // Calculate the average price of all items and assign it the alias "averagePrice".
   * firestore.pipeline().collection("items")
   *   .aggregate(field("price").avg().as("averagePrice"));
   * ```
   *
   * @param name The alias to assign to this AggregateFunction.
   * @return A new {@link AliasedAggregate} that wraps this
   *     AggregateFunction and associates it with the provided alias.
   */
  as(name: string): AliasedAggregate {
    return new AliasedAggregate(this, name);
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return {
      functionValue: {
        name: this.name,
        args: this.params.map(p => p._toProto(serializer)),
      },
    };
  }

  _protoValueType = 'ProtoValue' as const;
}

/**
 * An AggregateFunction with alias.
 */
export class AliasedAggregate implements AliasedAggregate, HasUserData {
  constructor(
    readonly aggregate: AggregateFunction,
    readonly alias: string
  ) {}

  /**
   * @internal
   * @private
   * Indicates if this expression was created from a literal value passed
   * by the caller.
   */
  _createdFromLiteral = false;

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    this.aggregate._validateUserData(ignoreUndefinedProperties);
  }
}

/**
 * TODO
 */
export class AliasedExpr
  implements firestore.Pipelines.Selectable, HasUserData
{
  exprType: firestore.Pipelines.ExprType = 'AliasedExpr';
  selectable = true as const;

  /**
   * @internal
   * @private
   * Indicates if this expression was created from a literal value passed
   * by the caller.
   */
  _createdFromLiteral = false;

  constructor(
    readonly expr: Expression,
    readonly alias: string
  ) {}

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    this.expr._validateUserData(ignoreUndefinedProperties);
  }
}

/**
 * @internal
 */
class ListOfExprs extends Expression {
  exprType: firestore.Pipelines.ExprType = 'ListOfExprs';

  constructor(private exprs: Expression[]) {
    super();
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return {
      arrayValue: {
        values: this.exprs.map(p => p._toProto(serializer)!),
      },
    };
  }

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    this.exprs.forEach(expr => {
      return expr._validateUserData(ignoreUndefinedProperties);
    });
  }
}

/**
 * Represents a reference to a field in a Firestore document, or outputs of a {@link Pipeline} stage.
 *
 * <p>Field references are used to access document field values in expressions and to specify fields
 * for sorting, filtering, and projecting data in Firestore pipelines.
 *
 * <p>You can create a `Field` instance using the static {@link #of} method:
 *
 * ```typescript
 * // Create a Field instance for the 'name' field
 * const nameField = field("name");
 *
 * // Create a Field instance for a nested field 'address.city'
 * const cityField = field("address.city");
 * ```
 */
export class Field extends Expression implements firestore.Pipelines.Selectable {
  readonly exprType: firestore.Pipelines.ExprType = 'Field';
  selectable = true as const;

  /**
   * @internal
   * @private
   * @hideconstructor
   * @param fieldPath
   */
  constructor(private fieldPath: FieldPath) {
    super();
  }

  fieldName(): string {
    return this.fieldPath.formattedName;
  }

  get alias(): string {
    return this.fieldName();
  }

  get expr(): Expression {
    return this;
  }

  /**
   * @private
   * @internal
   */
  _toProto(_: Serializer): api.IValue {
    return {
      fieldReferenceValue: this.fieldPath.formattedName,
    };
  }

  /**
   * @private
   * @internal
   */
  _validateUserData(_: boolean): void {}
}

/**
 * Creates a {@code Field} instance representing the field at the given path.
 *
 * The path can be a simple field name (e.g., "name") or a dot-separated path to a nested field
 * (e.g., "address.city").
 *
 * ```typescript
 * // Create a Field instance for the 'title' field
 * const titleField = field("title");
 *
 * // Create a Field instance for a nested field 'author.firstName'
 * const authorFirstNameField = field("author.firstName");
 * ```
 *
 * @param field The path to the field.
 * @return A new {@code Field} instance representing the specified field.
 */
export function field(field: string | firestore.FieldPath): Field {
  if (typeof field === 'string') {
    if ('__name__' === field) {
      return new Field(FieldPath.documentId());
    }
    return new Field(FieldPath.fromArgument(field));
  } else {
    return new Field(field as unknown as FieldPath);
  }
}

/**
 * Represents a constant value that can be used in a Firestore pipeline expression.
 *
 * You can create a `Constant` instance using the static {@link #of} method:
 *
 * ```typescript
 * // Create a Constant instance for the number 10
 * const ten = constant(10);
 *
 * // Create a Constant instance for the string "hello"
 * const hello = constant("hello");
 * ```
 */
export class Constant extends Expression {
  readonly exprType: firestore.Pipelines.ExprType = 'Constant';

  private protoValue?: api.IValue;

  /**
   * @private
   * @internal
   * @hideconstructor
   * @param value The value of the constant.
   */
  constructor(private value: unknown) {
    super();
  }

  /**
   * @private
   * @internal
   */
  static _fromProto(value: api.IValue): Constant {
    const result = new Constant(value);
    result.protoValue = value;
    return result;
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    if (isFirestoreValue(this.value)) {
      return this.value;
    }

    return serializer.encodeValue(this.value)!;
  }

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    validateUserInput('value', this.value, 'constant value', {
      allowUndefined: ignoreUndefinedProperties,
      allowDeletes: 'none',
      allowTransforms: false,
    });
  }
}

/**
 * Creates a `Constant` instance for a number value.
 *
 * @param value The number value.
 * @return A new `Constant` instance.
 */
export function constant(value: number): Constant;

/**
 * Creates a `Constant` instance for a string value.
 *
 * @param value The string value.
 * @return A new `Constant` instance.
 */
export function constant(value: string): Constant;

/**
 * Creates a `Constant` instance for a boolean value.
 *
 * @param value The boolean value.
 * @return A new `Constant` instance.
 */
export function constant(value: boolean): Constant;

/**
 * Creates a `Constant` instance for a null value.
 *
 * @param value The null value.
 * @return A new `Constant` instance.
 */
export function constant(value: null): Constant;

/**
 * Creates a `Constant` instance for a GeoPoint value.
 *
 * @param value The GeoPoint value.
 * @return A new `Constant` instance.
 */
export function constant(value: firestore.GeoPoint): Constant;

/**
 * Creates a `Constant` instance for a Timestamp value.
 *
 * @param value The Timestamp value.
 * @return A new `Constant` instance.
 */
export function constant(value: firestore.Timestamp): Constant;

/**
 * Creates a `Constant` instance for a Date value.
 *
 * @param value The Date value.
 * @return A new `Constant` instance.
 */
export function constant(value: Date): Constant;

/**
 * Creates a `Constant` instance for a Buffer | Uint8Array value.
 *
 * @param value The Buffer | Uint8Array value.
 * @return A new `Constant` instance.
 */
export function constant(value: Buffer | Uint8Array): Constant;

/**
 * Creates a `Constant` instance for a DocumentReference value.
 *
 * @param value The DocumentReference value.
 * @return A new `Constant` instance.
 */
export function constant(value: firestore.DocumentReference): Constant;

/**
 * Creates a `Constant` instance for a Firestore proto value.
 * For internal use only.
 * @private
 * @internal
 * @param value The Firestore proto value.
 * @return A new `Constant` instance.
 */
export function constant(value: api.IValue): Constant;

/**
 * Creates a `Constant` instance for a VectorValue value.
 *
 * @param value The VectorValue value.
 * @return A new `Constant` instance.
 */
export function constant(value: firestore.VectorValue): Constant;

/**
 * @internal
 * @private
 * @param value
 */
export function constant(value: unknown): Constant;

export function constant(value: unknown): Constant {
  return new Constant(value);
}

/**
 * Internal only
 * @internal
 * @private
 */
export class MapValue extends Expression {
  constructor(private plainObject: Map<string, Expression>) {
    super();
  }

  exprType: firestore.Pipelines.ExprType = 'Constant';

  _toProto(serializer: Serializer): api.IValue {
    return serializer.encodeValue(this.plainObject);
  }

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    this.plainObject.forEach(expr => {
      return expr._validateUserData(ignoreUndefinedProperties);
    });
  }
}

/**
 * This class defines the base class for Firestore {@link Pipeline} functions, which can be evaluated within pipeline
 * execution.
 *
 * Typically, you would not use this class or its children directly. Use either the functions like {@link and}, {@link equal},
 * or the methods on {@link Expression} ({@link Expression#equal}, {@link Expression#lessThan}, etc.) to construct new Function instances.
 */
export class FunctionExpr extends Expression {
  readonly exprType: firestore.Pipelines.ExprType = 'Function';

  constructor(
    protected name: string,
    private params: Expression[]
  ) {
    super();
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return {
      functionValue: {
        name: this.name,
        args: this.params.map(p => cast<Expression>(p)._toProto(serializer)),
      },
    };
  }

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    this.params.forEach(expr => {
      return expr._validateUserData(ignoreUndefinedProperties);
    });
  }
}

/**
 * This class defines the base class for Firestore {@link Pipeline} functions, which can be evaluated within pipeline
 * execution.
 *
 * Typically, you would not use this class or its children directly. Use either the functions like {@link and}, {@link equal},
 * or the methods on {@link Expression} ({@link Expression#equal}, {@link Expression#lessThan}, etc.) to construct new Function instances.
 */
class MapFunctionExpr extends FunctionExpr {
  readonly exprType: firestore.Pipelines.ExprType = 'Function';

  constructor(private map: Record<string, Expression | undefined>) {
    super('map', []);
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    const args: api.IValue[] = [];
    for (const key in this.map) {
      if (Object.prototype.hasOwnProperty.call(this.map, key)) {
        if (this.map[key]) {
          args.push(constant(key)._toProto(serializer));
          args.push(this.map[key]!._toProto(serializer));
        }
      }
    }
    return {
      functionValue: {
        name: this.name,
        args: args,
      },
    };
  }

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    validateUserInput('value', this.map, 'map value', {
      allowUndefined: ignoreUndefinedProperties,
      allowTransforms: false,
      allowDeletes: 'none',
    });
  }
}

/**
 * This class defines the base class for Firestore {@link Pipeline} functions, which can be evaluated within pipeline
 * execution.
 *
 * Typically, you would not use this class or its children directly. Use either the functions like {@link and}, {@link equal},
 * or the methods on {@link Expression} ({@link Expression#equal}, {@link Expression#lessThan}, etc.) to construct new Function instances.
 */
class ArrayFunctionExpr extends FunctionExpr {
  readonly exprType: firestore.Pipelines.ExprType = 'Function';

  constructor(private values: Array<Expression | undefined>) {
    super('array', []);
  }

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    return {
      functionValue: {
        name: this.name,
        args: this.values
          .filter(v => !!v)
          .map(value => value!._toProto(serializer)),
      },
    };
  }

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    validateUserInput('value', this.values, 'array value', {
      allowUndefined: ignoreUndefinedProperties,
      allowTransforms: false,
      allowDeletes: 'none',
    });
  }
}

/**
 * An expression that evaluates to a boolean value.
 *
 * This expression type is useful for filter conditions.
 *
 */
export class BooleanExpression
  extends FunctionExpr
  implements firestore.Pipelines.BooleanExpression
{
  returnType: 'boolean' = 'boolean' as const;

  /**
   * Creates an aggregation that finds the count of input documents satisfying
   * this boolean expression.
   *
   * ```typescript
   * // Find the count of documents with a score greater than 90
   * field("score").greaterThan(90).countIf().as("highestScore");
   * ```
   *
   * @return A new `AggregateFunction` representing the 'countIf' aggregation.
   */
  countIf(): AggregateFunction {
    return new AggregateFunction('count_if', [this]);
  }

  /**
   * Creates an expression that negates this boolean expression.
   *
   * ```typescript
   * // Find documents where the 'tags' field does not contain 'completed'
   * field("tags").arrayContains("completed").not();
   * ```
   *
   * @return A new {@code Expression} representing the negated filter condition.
   */
  not(): BooleanExpression {
    return new BooleanExpression('not', [this]);
  }
}

/**
 * Creates an aggregation that counts the number of stage inputs where the provided
 * boolean expression evaluates to true.
 *
 * ```typescript
 * // Count the number of documents where 'is_active' field equals true
 * countIf(field("is_active").equal(true)).as("numActiveDocuments");
 * ```
 *
 * @param booleanExpr - The boolean expression to evaluate on each input.
 * @returns A new `AggregateFunction` representing the 'countIf' aggregation.
 */
export function countIf(booleanExpr: BooleanExpression): AggregateFunction {
  return new AggregateFunction('count_if', [cast<Expression>(booleanExpr)]);
}

/**
 * Creates an expression that return a pseudo-random value of type double in the
 * range of [0, 1), inclusive of 0 and exclusive of 1.
 *
 * @returns A new `Expression` representing the 'rand' function.
 */
export function rand(): FunctionExpr {
  return new FunctionExpr('rand', []);
}

/**
 * Creates an expression that indexes into an array from the beginning or end
 * and return the element. If the index exceeds the array length, an error is
 * returned. A negative index, starts from the end.
 *
 * ```typescript
 * // Return the value in the tags field array at index 1.
 * arrayGet('tags', 1);
 * ```
 *
 * @param arrayField The name of the array field.
 * @param index The index of the element to return.
 * @return A new Expression representing the 'arrayGet' operation.
 */
export function arrayGet(arrayField: string, index: number): FunctionExpr;

/**
 * Creates an expression that indexes into an array from the beginning or end
 * and return the element. If the index exceeds the array length, an error is
 * returned. A negative index, starts from the end.
 *
 * ```typescript
 * // Return the value in the tags field array at index specified by field
 * // 'favoriteTag'.
 * arrayGet('tags', field('favoriteTag'));
 * ```
 *
 * @param arrayField The name of the array field.
 * @param indexExpr An Expression evaluating to the index of the element to return.
 * @return A new Expression representing the 'arrayGet' operation.
 */
export function arrayGet(arrayField: string, indexExpr: Expression): FunctionExpr;

/**
 * Creates an expression that indexes into an array from the beginning or end
 * and return the element. If the index exceeds the array length, an error is
 * returned. A negative index, starts from the end.
 *
 * ```typescript
 * // Return the value in the tags field array at index 1.
 * arrayGet(field('tags'), 1);
 * ```
 *
 * @param arrayExpression An Expression evaluating to an array.
 * @param index The index of the element to return.
 * @return A new Expression representing the 'arrayGet' operation.
 */
export function arrayGet(arrayExpression: Expression, index: number): FunctionExpr;

/**
 * Creates an expression that indexes into an array from the beginning or end
 * and return the element. If the index exceeds the array length, an error is
 * returned. A negative index, starts from the end.
 *
 * ```typescript
 * // Return the value in the tags field array at index specified by field
 * // 'favoriteTag'.
 * arrayGet(field('tags'), field('favoriteTag'));
 * ```
 *
 * @param arrayExpression An Expression evaluating to an array.
 * @param indexExpr An Expression evaluating to the index of the element to return.
 * @return A new Expression representing the 'arrayGet' operation.
 */
export function arrayGet(arrayExpression: Expression, indexExpr: Expression): FunctionExpr;
export function arrayGet(
  array: Expression | string,
  index: Expression | number
): FunctionExpr {
  return fieldOrExpression(array).arrayGet(valueToDefaultExpr(index));
}

/**
 * Creates an expression that checks if a given expression produces an error.
 *
 * ```typescript
 * // Check if the result of a calculation is an error
 * isError(field("title").arrayContains(1));
 * ```
 *
 * @param value The expression to check.
 * @return A new {@code Expression} representing the 'isError' check.
 */
export function isError(value: Expression): BooleanExpression {
  const expr: Expression = cast<Expression>(value);
  return expr.isError();
}

/**
 * Creates an expression that returns the `catch` argument if there is an
 * error, else return the result of the `try` argument evaluation.
 *
 * ```typescript
 * // Returns the first item in the title field arrays, or returns
 * // the entire title field if the array is empty or the field is another type.
 * ifError(field("title").arrayGet(0), field("title"));
 * ```
 *
 * @param tryExpr The try expression.
 * @param catchExpr The catch expression that will be evaluated and
 * returned if the tryExpr produces an error.
 * @return A new {@code Expression} representing the 'ifError' operation.
 */
export function ifError(tryExpr: Expression, catchExpr: Expression): FunctionExpr;

/**
 * Creates an expression that returns the `catch` argument if there is an
 * error, else return the result of the `try` argument evaluation.
 *
 * ```typescript
 * // Returns the first item in the title field arrays, or returns
 * // "Default Title"
 * ifError(field("title").arrayGet(0), "Default Title");
 * ```
 *
 * @param tryExpr The try expression.
 * @param catchValue The value that will be returned if the tryExpr produces an
 * error.
 * @return A new {@code Expression} representing the 'ifError' operation.
 */
export function ifError(tryExpr: Expression, catchValue: unknown): FunctionExpr;
export function ifError(tryExpr: Expression, catchValue: unknown): FunctionExpr {
  const expr: Expression = cast<Expression>(tryExpr);
  return expr.ifError(valueToDefaultExpr(catchValue));
}

/**
 * Creates an expression that returns `true` if a value is absent. Otherwise,
 * returns `false` even if the value is `null`.
 *
 * ```typescript
 * // Check if the field `value` is absent.
 * isAbsent(field("value"));
 * ```
 *
 * @param value The expression to check.
 * @return A new {@code Expression} representing the 'isAbsent' check.
 */
export function isAbsent(value: Expression): BooleanExpression;

/**
 * Creates an expression that returns `true` if a field is absent. Otherwise,
 * returns `false` even if the field value is `null`.
 *
 * ```typescript
 * // Check if the field `value` is absent.
 * isAbsent("value");
 * ```
 *
 * @param field The field to check.
 * @return A new {@code Expression} representing the 'isAbsent' check.
 */
export function isAbsent(field: string): BooleanExpression;
export function isAbsent(value: Expression | string): BooleanExpression {
  return fieldOrExpression(value).isAbsent();
}

/**
 * Creates an expression that checks if an expression evaluates to 'NaN' (Not a Number).
 *
 * ```typescript
 * // Check if the result of a calculation is NaN
 * isNull(field("value").divide(0));
 * ```
 *
 * @param value The expression to check.
 * @return A new {@code Expression} representing the 'isNull' check.
 */
export function isNull(value: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value evaluates to 'NaN' (Not a Number).
 *
 * ```typescript
 * // Check if the result of a calculation is NaN
 * isNull("value");
 * ```
 *
 * @param value The name of the field to check.
 * @return A new {@code Expression} representing the 'isNull' check.
 */
export function isNull(value: string): BooleanExpression;
export function isNull(value: Expression | string): BooleanExpression {
  return fieldOrExpression(value).isNull();
}

/**
 * Creates an expression that checks if tbe result of an expression is not null.
 *
 * ```typescript
 * // Check if the value of the 'name' field is not null
 * isNotNull(field("name"));
 * ```
 *
 * @param value The expression to check.
 * @return A new {@code Expression} representing the 'isNotNull' check.
 */
export function isNotNull(value: Expression): BooleanExpression;

/**
 * Creates an expression that checks if tbe value of a field is not null.
 *
 * ```typescript
 * // Check if the value of the 'name' field is not null
 * isNotNull("name");
 * ```
 *
 * @param value The name of the field to check.
 * @return A new {@code Expression} representing the 'isNotNull' check.
 */
export function isNotNull(value: string): BooleanExpression;
export function isNotNull(value: Expression | string): BooleanExpression {
  return fieldOrExpression(value).isNotNull();
}

/**
 * Creates an expression that checks if the results of this expression is NOT 'NaN' (Not a Number).
 *
 * ```typescript
 * // Check if the result of a calculation is NOT NaN
 * isNotNaN(field("value").divide(0));
 * ```
 *
 * @param value The expression to check.
 * @return A new {@code Expression} representing the 'isNotNaN' check.
 */
export function isNotNan(value: Expression): BooleanExpression;

/**
 * Creates an expression that checks if the results of this expression is NOT 'NaN' (Not a Number).
 *
 * ```typescript
 * // Check if the value of a field is NOT NaN
 * isNotNaN("value");
 * ```
 *
 * @param value The name of the field to check.
 * @return A new {@code Expression} representing the 'isNotNaN' check.
 */
export function isNotNan(value: string): BooleanExpression;
export function isNotNan(value: Expression | string): BooleanExpression {
  return fieldOrExpression(value).isNotNan();
}

/**
 * Creates an expression that removes a key from the map at the specified field name.
 *
 * ```
 * // Removes the key 'city' field from the map in the address field of the input document.
 * mapRemove('address', 'city');
 * ```
 *
 * @param mapField The name of a field containing a map value.
 * @param key The name of the key to remove from the input map.
 */
export function mapRemove(mapField: string, key: string): FunctionExpr;
/**
 * Creates an expression that removes a key from the map produced by evaluating an expression.
 *
 * ```
 * // Removes the key 'baz' from the input map.
 * mapRemove(map({foo: 'bar', baz: true}), 'baz');
 * ```
 *
 * @param mapExpr An expression return a map value.
 * @param key The name of the key to remove from the input map.
 */
export function mapRemove(mapExpr: Expression, key: string): FunctionExpr;
/**
 * Creates an expression that removes a key from the map at the specified field name.
 *
 * ```
 * // Removes the key 'city' field from the map in the address field of the input document.
 * mapRemove('address', constant('city'));
 * ```
 *
 * @param mapField The name of a field containing a map value.
 * @param keyExpr An expression that produces the name of the key to remove from the input map.
 */
export function mapRemove(mapField: string, keyExpr: Expression): FunctionExpr;
/**
 * Creates an expression that removes a key from the map produced by evaluating an expression.
 *
 * ```
 * // Removes the key 'baz' from the input map.
 * mapRemove(map({foo: 'bar', baz: true}), constant('baz'));
 * ```
 *
 * @param mapExpr An expression return a map value.
 * @param keyExpr An expression that produces the name of the key to remove from the input map.
 */
export function mapRemove(mapExpr: Expression, keyExpr: Expression): FunctionExpr;

export function mapRemove(
  mapExpr: Expression | string,
  stringExpr: Expression | string
): FunctionExpr {
  return fieldOrExpression(mapExpr).mapRemove(valueToDefaultExpr(stringExpr));
}

/**
 * Creates an expression that merges multiple map values.
 *
 * ```
 * // Merges the map in the settings field with, a map literal, and a map in
 * // that is conditionally returned by another expression
 * mapMerge('settings', { enabled: true }, cond(field('isAdmin'), { admin: true}, {})
 * ```
 *
 * @param mapField Name of a field containing a map value that will be merged.
 * @param secondMap A required second map to merge. Represented as a literal or
 * an expression that returns a map.
 * @param otherMaps Optional additional maps to merge. Each map is represented
 * as a literal or an expression that returns a map.
 */
export function mapMerge(
  mapField: string,
  secondMap: Record<string, unknown> | Expression,
  ...otherMaps: Array<Record<string, unknown> | Expression>
): FunctionExpr;

/**
 * Creates an expression that merges multiple map values.
 *
 * ```
 * // Merges the map in the settings field with, a map literal, and a map in
 * // that is conditionally returned by another expression
 * mapMerge(field('settings'), { enabled: true }, cond(field('isAdmin'), { admin: true}, {})
 * ```
 *
 * @param firstMap An expression or literal map value that will be merged.
 * @param secondMap A required second map to merge. Represented as a literal or
 * an expression that returns a map.
 * @param otherMaps Optional additional maps to merge. Each map is represented
 * as a literal or an expression that returns a map.
 */
export function mapMerge(
  firstMap: Record<string, unknown> | Expression,
  secondMap: Record<string, unknown> | Expression,
  ...otherMaps: Array<Record<string, unknown> | Expression>
): FunctionExpr;

export function mapMerge(
  firstMap: string | Record<string, unknown> | Expression,
  secondMap: Record<string, unknown> | Expression,
  ...otherMaps: Array<Record<string, unknown> | Expression>
): FunctionExpr {
  const secondMapExpr = valueToDefaultExpr(secondMap);
  const otherMapExprs = otherMaps.map(valueToDefaultExpr);
  return fieldOrExpression(firstMap).mapMerge(secondMapExpr, ...otherMapExprs);
}

/**
 * Creates an expression that returns the document ID from a path.
 *
 * ```typescript
 * // Get the document ID from a path.
 * documentId(field("__path__"));
 * ```
 *
 * @return A new {@code Expression} representing the documentId operation.
 */
export function documentId(documentPathExpr: Expression): FunctionExpr {
  return documentPathExpr.documentId();
}

/**
 * Creates an expression that returns a substring of a string or byte array.
 *
 * @param field The name of a field containing a string or byte array to compute the substring from.
 * @param position Index of the first character of the substring.
 * @param length Length of the substring.
 */
export function substring(
  field: string,
  position: number,
  length?: number
): FunctionExpr;

/**
 * Creates an expression that returns a substring of a string or byte array.
 *
 * @param input An expression returning a string or byte array to compute the substring from.
 * @param position Index of the first character of the substring.
 * @param length Length of the substring.
 */
export function substring(
  input: Expression,
  position: number,
  length?: number
): FunctionExpr;

/**
 * Creates an expression that returns a substring of a string or byte array.
 *
 * @param field The name of a field containing a string or byte array to compute the substring from.
 * @param position An expression that returns the index of the first character of the substring.
 * @param length An expression that returns the length of the substring.
 */
export function substring(
  field: string,
  position: Expression,
  length?: Expression
): FunctionExpr;

/**
 * Creates an expression that returns a substring of a string or byte array.
 *
 * @param input An expression returning a string or byte array to compute the substring from.
 * @param position An expression that returns the index of the first character of the substring.
 * @param length An expression that returns the length of the substring.
 */
export function substring(
  input: Expression,
  position: Expression,
  length?: Expression
): FunctionExpr;

export function substring(
  field: Expression | string,
  position: Expression | number,
  length?: Expression | number
): FunctionExpr {
  const fieldExpr = fieldOrExpression(field);
  const positionExpr = valueToDefaultExpr(position);
  const lengthExpr =
    length === undefined ? undefined : valueToDefaultExpr(length);
  return fieldExpr.substring(positionExpr, lengthExpr);
}

/**
 * Creates an expression that adds the result of two expressions together.
 *
 * ```typescript
 * // Add the value of the 'quantity' field and the 'reserve' field.
 * add(field("quantity"), field("reserve"));
 * ```
 *
 * @param first The first expression to add.
 * @param second The second expression or literal to add.
 * @return A new {@code Expression} representing the addition operation.
 */
export function add(first: Expression, second: Expression | unknown): FunctionExpr;

/**
 * Creates an expression that adds a field's value to the result of an expression.
 *
 * ```typescript
 * // Add the value of the 'quantity' field and the 'reserve' field.
 * add("quantity", field("reserve"));
 * ```
 *
 * @param fieldName The name of the field containing the value to add.
 * @param second The second expression or literal to add.
 * @return A new {@code Expression} representing the addition operation.
 */
export function add(fieldName: string, second: Expression | unknown): FunctionExpr;

export function add(
  first: Expression | string,
  second: Expression | unknown
): FunctionExpr {
  return fieldOrExpression(first).add(valueToDefaultExpr(second));
}

/**
 * Creates an expression that subtracts two expressions.
 *
 * ```typescript
 * // Subtract the 'discount' field from the 'price' field
 * subtract(field("price"), field("discount"));
 * ```
 *
 * @param minuend The expression to subtract from.
 * @param subtrahend The expression to subtract.
 * @return A new {@code Expression} representing the subtraction operation.
 */
export function subtract(minuend: Expression, subtrahend: Expression): FunctionExpr;

/**
 * Creates an expression that subtracts a constant value from an expression.
 *
 * ```typescript
 * // Subtract the constant value 2 from the 'value' field
 * subtract(field("value"), 2);
 * ```
 *
 * @param minuend The expression to subtract from.
 * @param subtrahend The constant value to subtract.
 * @return A new {@code Expression} representing the subtraction operation.
 */
export function subtract(minuend: Expression, subtrahend: unknown): FunctionExpr;

/**
 * Creates an expression that subtracts an expression from a field's value.
 *
 * ```typescript
 * // Subtract the 'discount' field from the 'price' field
 * subtract("price", field("discount"));
 * ```
 *
 * @param minuendFieldName The field name to subtract from.
 * @param subtrahend The expression to subtract.
 * @return A new {@code Expression} representing the subtraction operation.
 */
export function subtract(
  minuendFieldName: string,
  subtrahend: Expression
): FunctionExpr;

/**
 * Creates an expression that subtracts a constant value from a field's value.
 *
 * ```typescript
 * // Subtract 20 from the value of the 'total' field
 * subtract("total", 20);
 * ```
 *
 * @param minuendFieldName The field name to subtract from.
 * @param subtrahend The constant value to subtract.
 * @return A new {@code Expression} representing the subtraction operation.
 */
export function subtract(
  minuendFieldName: string,
  subtrahend: unknown
): FunctionExpr;
export function subtract(
  left: Expression | string,
  right: Expression | unknown
): FunctionExpr {
  const normalizedLeft = fieldOrExpression(left);
  const normalizedRight = valueToDefaultExpr(right);
  return normalizedLeft.subtract(normalizedRight);
}

/**
 * Creates an expression that multiplies the result of two expressions together.
 *
 * ```typescript
 * // Multiply the 'quantity' field by the 'price' field
 * multiply(field("quantity"), field("price"));
 * ```
 *
 * @param first The first expression to multiply.
 * @param second The second expression or literal to multiply.
 * @return A new {@code Expression} representing the multiplication operation.
 */
export function multiply(first: Expression, second: Expression | unknown): FunctionExpr;

/**
 * Creates an expression that multiplies a field's value by the result of an expression.
 *
 * ```typescript
 * // Multiply the 'quantity' field by the 'price' field
 * multiply("quantity", field("price"));
 * ```
 *
 * @param fieldName The name of the field containing the value to multiply.
 * @param second The second expression or literal to multiply.
 * @return A new {@code Expression} representing the multiplication operation.
 */
export function multiply(
  fieldName: string,
  second: Expression | unknown
): FunctionExpr;

export function multiply(
  first: Expression | string,
  second: Expression | unknown
): FunctionExpr {
  return fieldOrExpression(first).multiply(valueToDefaultExpr(second));
}

/**
 * Creates an expression that divides two expressions.
 *
 * ```typescript
 * // Divide the 'total' field by the 'count' field
 * divide(field("total"), field("count"));
 * ```
 *
 * @param dividend The expression to be divided.
 * @param divisort The expression to divide by.
 * @return A new {@code Expression} representing the division operation.
 */
export function divide(dividend: Expression, divisort: Expression): FunctionExpr;

/**
 * Creates an expression that divides an expression by a constant value.
 *
 * ```typescript
 * // Divide the 'value' field by 10
 * divide(field("value"), 10);
 * ```
 *
 * @param dividend The expression to be divided.
 * @param divisor The constant value to divide by.
 * @return A new {@code Expression} representing the division operation.
 */
export function divide(dividend: Expression, divisor: unknown): FunctionExpr;

/**
 * Creates an expression that divides a field's value by an expression.
 *
 * ```typescript
 * // Divide the 'total' field by the 'count' field
 * divide("total", field("count"));
 * ```
 *
 * @param dividend The field name to be divided.
 * @param divisor The expression to divide by.
 * @return A new {@code Expression} representing the division operation.
 */
export function divide(dividend: string, divisor: Expression): FunctionExpr;

/**
 * Creates an expression that divides a field's value by a constant value.
 *
 * ```typescript
 * // Divide the 'value' field by 10
 * divide("value", 10);
 * ```
 *
 * @param dividend The field name to be divided.
 * @param divisor The constant value to divide by.
 * @return A new {@code Expression} representing the division operation.
 */
export function divide(dividend: string, divisor: unknown): FunctionExpr;
export function divide(
  dividend: Expression | string,
  divisor: Expression | unknown
): FunctionExpr {
  const normalizedLeft = fieldOrExpression(dividend);
  const normalizedRight = valueToDefaultExpr(divisor);
  return normalizedLeft.divide(normalizedRight);
}

/**
 * Creates an expression that calculates the modulo (remainder) of dividing two expressions.
 *
 * ```typescript
 * // Calculate the remainder of dividing 'field1' by 'field2'.
 * mod(field("field1"), field("field2"));
 * ```
 *
 * @param left The dividend expression.
 * @param right The divisor expression.
 * @return A new {@code Expression} representing the modulo operation.
 */
export function mod(left: Expression, right: Expression): FunctionExpr;

/**
 * Creates an expression that calculates the modulo (remainder) of dividing an expression by a constant.
 *
 * ```typescript
 * // Calculate the remainder of dividing 'field1' by 5.
 * mod(field("field1"), 5);
 * ```
 *
 * @param expression The dividend expression.
 * @param value The divisor constant.
 * @return A new {@code Expression} representing the modulo operation.
 */
export function mod(expression: Expression, value: unknown): FunctionExpr;

/**
 * Creates an expression that calculates the modulo (remainder) of dividing a field's value by an expression.
 *
 * ```typescript
 * // Calculate the remainder of dividing 'field1' by 'field2'.
 * mod("field1", field("field2"));
 * ```
 *
 * @param fieldName The dividend field name.
 * @param expression The divisor expression.
 * @return A new {@code Expression} representing the modulo operation.
 */
export function mod(fieldName: string, expression: Expression): FunctionExpr;

/**
 * Creates an expression that calculates the modulo (remainder) of dividing a field's value by a constant.
 *
 * ```typescript
 * // Calculate the remainder of dividing 'field1' by 5.
 * mod("field1", 5);
 * ```
 *
 * @param fieldName The dividend field name.
 * @param value The divisor constant.
 * @return A new {@code Expression} representing the modulo operation.
 */
export function mod(fieldName: string, value: unknown): FunctionExpr;
export function mod(left: Expression | string, right: Expression | unknown): FunctionExpr {
  const normalizedLeft = fieldOrExpression(left);
  const normalizedRight = valueToDefaultExpr(right);
  return normalizedLeft.mod(normalizedRight);
}

/**
 * Creates an expression that creates a Firestore map value from an input object.
 *
 * ```typescript
 * // Create a map from the input object and reference the 'baz' field value from the input document.
 * map({foo: 'bar', baz: field('baz')}).as('data');
 * ```
 *
 * @param elements The input map to evaluate in the expression.
 * @return A new {@code Expression} representing the map function.
 */
export function map(elements: Record<string, unknown>): FunctionExpr {
  const result: Record<string, Expression | undefined> = {};

  for (const key in elements) {
    if (Object.prototype.hasOwnProperty.call(elements, key)) {
      result[key] =
        elements[key] !== undefined
          ? valueToDefaultExpr(elements[key])
          : undefined;
    }
  }
  return new MapFunctionExpr(result);
}

/**
 * Internal use only
 * Converts a plainObject to a mapValue in the proto representation,
 * rather than a functionValue+map that is the result of the map(...) function.
 * This behaves different from constant(plainObject) because it
 * traverses the input object, converts values in the object to expressions,
 * and calls _readUserData on each of these expressions.
 * @private
 * @internal
 * @param plainObject
 */
export function _mapValue(plainObject: Record<string, unknown>): MapValue {
  const result: Map<string, Expression> = new Map<string, Expression>();
  for (const key in plainObject) {
    if (Object.prototype.hasOwnProperty.call(plainObject, key)) {
      const value = plainObject[key];
      result.set(key, valueToDefaultExpr(value));
    }
  }
  return new MapValue(result);
}

/**
 * Creates an expression that creates a Firestore array value from an input array.
 *
 * ```typescript
 * // Create an array value from the input array and reference the 'baz' field value from the input document.
 * array(['bar', field('baz')]).as('foo');
 * ```
 *
 * @param elements The input array to evaluate in the expression.
 * @return A new {@code Expression} representing the array function.
 */
export function array(elements: unknown[]): FunctionExpr {
  return new ArrayFunctionExpr(
    elements.map(element => {
      return element !== undefined ? valueToDefaultExpr(element) : undefined;
    })
  );
}

/**
 * Creates an expression that checks if two expressions are equal.
 *
 * ```typescript
 * // Check if the 'age' field is equal to an expression
 * equal(field("age"), field("minAge").add(10));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expression` representing the equality comparison.
 */
export function equal(left: Expression, right: Expression): BooleanExpression;

/**
 * Creates an expression that checks if an expression is equal to a constant value.
 *
 * ```typescript
 * // Check if the 'age' field is equal to 21
 * equal(field("age"), 21);
 * ```
 *
 * @param expression The expression to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the equality comparison.
 */
export function equal(expression: Expression, value: unknown): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is equal to an expression.
 *
 * ```typescript
 * // Check if the 'age' field is equal to the 'limit' field
 * equal("age", field("limit"));
 * ```
 *
 * @param fieldName The field name to compare.
 * @param expression The expression to compare to.
 * @return A new `Expression` representing the equality comparison.
 */
export function equal(fieldName: string, expression: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is equal to a constant value.
 *
 * ```typescript
 * // Check if the 'city' field is equal to string constant "London"
 * equal("city", "London");
 * ```
 *
 * @param fieldName The field name to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the equality comparison.
 */
export function equal(fieldName: string, value: unknown): BooleanExpression;
export function equal(left: Expression | string, right: unknown): BooleanExpression {
  const leftExpr = fieldOrExpression(left);
  const rightExpr = valueToDefaultExpr(right);
  return leftExpr.equal(rightExpr);
}

/**
 * Creates an expression that checks if two expressions are not equal.
 *
 * ```typescript
 * // Check if the 'status' field is not equal to field 'finalState'
 * neq(field("status"), field("finalState"));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expression` representing the inequality comparison.
 */
export function neq(left: Expression, right: Expression): BooleanExpression;

/**
 * Creates an expression that checks if an expression is not equal to a constant value.
 *
 * ```typescript
 * // Check if the 'status' field is not equal to "completed"
 * neq(field("status"), "completed");
 * ```
 *
 * @param expression The expression to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the inequality comparison.
 */
export function neq(expression: Expression, value: unknown): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is not equal to an expression.
 *
 * ```typescript
 * // Check if the 'status' field is not equal to the value of 'expectedStatus'
 * neq("status", field("expectedStatus"));
 * ```
 *
 * @param fieldName The field name to compare.
 * @param expression The expression to compare to.
 * @return A new `Expression` representing the inequality comparison.
 */
export function neq(fieldName: string, expression: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is not equal to a constant value.
 *
 * ```typescript
 * // Check if the 'country' field is not equal to "USA"
 * neq("country", "USA");
 * ```
 *
 * @param fieldName The field name to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the inequality comparison.
 */
export function neq(fieldName: string, value: unknown): BooleanExpression;
export function neq(left: Expression | string, right: unknown): BooleanExpression {
  const leftExpr = fieldOrExpression(left);
  const rightExpr = valueToDefaultExpr(right);
  return leftExpr.neq(rightExpr);
}

/**
 * Creates an expression that checks if the first expression is less than the second expression.
 *
 * ```typescript
 * // Check if the 'age' field is less than 30
 * lessThan(field("age"), field("limit"));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expression` representing the less than comparison.
 */
export function lessThan(left: Expression, right: Expression): BooleanExpression;

/**
 * Creates an expression that checks if an expression is less than a constant value.
 *
 * ```typescript
 * // Check if the 'age' field is less than 30
 * lessThan(field("age"), 30);
 * ```
 *
 * @param expression The expression to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the less than comparison.
 */
export function lessThan(expression: Expression, value: unknown): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is less than an expression.
 *
 * ```typescript
 * // Check if the 'age' field is less than the 'limit' field
 * lessThan("age", field("limit"));
 * ```
 *
 * @param fieldName The field name to compare.
 * @param expression The expression to compare to.
 * @return A new `Expression` representing the less than comparison.
 */
export function lessThan(fieldName: string, expression: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is less than a constant value.
 *
 * ```typescript
 * // Check if the 'price' field is less than 50
 * lessThan("price", 50);
 * ```
 *
 * @param fieldName The field name to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the less than comparison.
 */
export function lessThan(fieldName: string, value: unknown): BooleanExpression;
export function lessThan(left: Expression | string, right: unknown): BooleanExpression {
  const leftExpr = fieldOrExpression(left);
  const rightExpr = valueToDefaultExpr(right);
  return leftExpr.lessThan(rightExpr);
}

/**
 * Creates an expression that checks if the first expression is less than or equal to the second
 * expression.
 *
 * ```typescript
 * // Check if the 'quantity' field is less than or equal to 20
 * lte(field("quantity"), field("limit"));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expression` representing the less than or equal to comparison.
 */
export function lte(left: Expression, right: Expression): BooleanExpression;

/**
 * Creates an expression that checks if an expression is less than or equal to a constant value.
 *
 * ```typescript
 * // Check if the 'quantity' field is less than or equal to 20
 * lte(field("quantity"), 20);
 * ```
 *
 * @param expression The expression to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the less than or equal to comparison.
 */
export function lte(expression: Expression, value: unknown): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is less than or equal to an expression.
 *
 * ```typescript
 * // Check if the 'quantity' field is less than or equal to the 'limit' field
 * lte("quantity", field("limit"));
 * ```
 *
 * @param fieldName The field name to compare.
 * @param expression The expression to compare to.
 * @return A new `Expression` representing the less than or equal to comparison.
 */
export function lte(fieldName: string, expression: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is less than or equal to a constant value.
 *
 * ```typescript
 * // Check if the 'score' field is less than or equal to 70
 * lte("score", 70);
 * ```
 *
 * @param fieldName The field name to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the less than or equal to comparison.
 */
export function lte(fieldName: string, value: unknown): BooleanExpression;
export function lte(left: Expression | string, right: unknown): BooleanExpression {
  const leftExpr = fieldOrExpression(left);
  const rightExpr = valueToDefaultExpr(right);
  return leftExpr.lte(rightExpr);
}

/**
 * Creates an expression that checks if the first expression is greater than the second
 * expression.
 *
 * ```typescript
 * // Check if the 'age' field is greater than 18
 * greaterThan(field("age"), Constant(9).add(9));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expression` representing the greater than comparison.
 */
export function greaterThan(left: Expression, right: Expression): BooleanExpression;

/**
 * Creates an expression that checks if an expression is greater than a constant value.
 *
 * ```typescript
 * // Check if the 'age' field is greater than 18
 * greaterThan(field("age"), 18);
 * ```
 *
 * @param expression The expression to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the greater than comparison.
 */
export function greaterThan(expression: Expression, value: unknown): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is greater than an expression.
 *
 * ```typescript
 * // Check if the value of field 'age' is greater than the value of field 'limit'
 * greaterThan("age", field("limit"));
 * ```
 *
 * @param fieldName The field name to compare.
 * @param expression The expression to compare to.
 * @return A new `Expression` representing the greater than comparison.
 */
export function greaterThan(fieldName: string, expression: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is greater than a constant value.
 *
 * ```typescript
 * // Check if the 'price' field is greater than 100
 * greaterThan("price", 100);
 * ```
 *
 * @param fieldName The field name to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the greater than comparison.
 */
export function greaterThan(fieldName: string, value: unknown): BooleanExpression;
export function greaterThan(left: Expression | string, right: unknown): BooleanExpression {
  const leftExpr = fieldOrExpression(left);
  const rightExpr = valueToDefaultExpr(right);
  return leftExpr.greaterThan(rightExpr);
}

/**
 * Creates an expression that checks if the first expression is greater than or equal to the
 * second expression.
 *
 * ```typescript
 * // Check if the 'quantity' field is greater than or equal to the field "threshold"
 * greaterThanOrEqual(field("quantity"), field("threshold"));
 * ```
 *
 * @param left The first expression to compare.
 * @param right The second expression to compare.
 * @return A new `Expression` representing the greater than or equal to comparison.
 */
export function greaterThanOrEqual(left: Expression, right: Expression): BooleanExpression;

/**
 * Creates an expression that checks if an expression is greater than or equal to a constant
 * value.
 *
 * ```typescript
 * // Check if the 'quantity' field is greater than or equal to 10
 * greaterThanOrEqual(field("quantity"), 10);
 * ```
 *
 * @param expression The expression to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the greater than or equal to comparison.
 */
export function greaterThanOrEqual(expression: Expression, value: unknown): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is greater than or equal to an expression.
 *
 * ```typescript
 * // Check if the value of field 'age' is greater than or equal to the value of field 'limit'
 * greaterThanOrEqual("age", field("limit"));
 * ```
 *
 * @param fieldName The field name to compare.
 * @param value The expression to compare to.
 * @return A new `Expression` representing the greater than or equal to comparison.
 */
export function greaterThanOrEqual(fieldName: string, value: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is greater than or equal to a constant
 * value.
 *
 * ```typescript
 * // Check if the 'score' field is greater than or equal to 80
 * greaterThanOrEqual("score", 80);
 * ```
 *
 * @param fieldName The field name to compare.
 * @param value The constant value to compare to.
 * @return A new `Expression` representing the greater than or equal to comparison.
 */
export function greaterThanOrEqual(fieldName: string, value: unknown): BooleanExpression;
export function greaterThanOrEqual(left: Expression | string, right: unknown): BooleanExpression {
  const leftExpr = fieldOrExpression(left);
  const rightExpr = valueToDefaultExpr(right);
  return leftExpr.greaterThanOrEqual(rightExpr);
}

/**
 * Creates an expression that checks if an array expression contains a specific element.
 *
 * ```typescript
 * // Check if the 'colors' array contains the value of field 'selectedColor'
 * arrayContains(field("colors"), field("selectedColor"));
 * ```
 *
 * @param array The array expression to check.
 * @param element The element to search for in the array.
 * @return A new {@code Expression} representing the 'array_contains' comparison.
 */
export function arrayContains(array: Expression, element: Expression): FunctionExpr;

/**
 * Creates an expression that checks if an array expression contains a specific element.
 *
 * ```typescript
 * // Check if the 'colors' array contains "red"
 * arrayContains(field("colors"), "red");
 * ```
 *
 * @param array The array expression to check.
 * @param element The element to search for in the array.
 * @return A new {@code Expression} representing the 'array_contains' comparison.
 */
export function arrayContains(array: Expression, element: unknown): FunctionExpr;

/**
 * Creates an expression that checks if a field's array value contains a specific element.
 *
 * ```typescript
 * // Check if the 'colors' array contains the value of field 'selectedColor'
 * arrayContains("colors", field("selectedColor"));
 * ```
 *
 * @param fieldName The field name to check.
 * @param element The element to search for in the array.
 * @return A new {@code Expression} representing the 'array_contains' comparison.
 */
export function arrayContains(fieldName: string, element: Expression): FunctionExpr;

/**
 * Creates an expression that checks if a field's array value contains a specific value.
 *
 * ```typescript
 * // Check if the 'colors' array contains "red"
 * arrayContains("colors", "red");
 * ```
 *
 * @param fieldName The field name to check.
 * @param element The element to search for in the array.
 * @return A new {@code Expression} representing the 'array_contains' comparison.
 */
export function arrayContains(fieldName: string, element: unknown): BooleanExpression;
export function arrayContains(
  array: Expression | string,
  element: unknown
): BooleanExpression {
  const arrayExpr = fieldOrExpression(array);
  const elementExpr = valueToDefaultExpr(element);
  return arrayExpr.arrayContains(elementExpr);
}

/**
 * Creates an expression that checks if an array expression contains any of the specified
 * elements.
 *
 * ```typescript
 * // Check if the 'categories' array contains either values from field "cate1" or "Science"
 * arrayContainsAny(field("categories"), [field("cate1"), "Science"]);
 * ```
 *
 * @param array The array expression to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expression} representing the 'array_contains_any' comparison.
 */
export function arrayContainsAny(
  array: Expression,
  values: Array<Expression | unknown>
): BooleanExpression;

/**
 * Creates an expression that checks if a field's array value contains any of the specified
 * elements.
 *
 * ```typescript
 * // Check if the 'groups' array contains either the value from the 'userGroup' field
 * // or the value "guest"
 * arrayContainsAny("categories", [field("cate1"), "Science"]);
 * ```
 *
 * @param fieldName The field name to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expression} representing the 'array_contains_any' comparison.
 */
export function arrayContainsAny(
  fieldName: string,
  values: Array<Expression | unknown>
): BooleanExpression;

/**
 * Creates an expression that checks if an array expression contains any of the specified
 * elements.
 *
 * ```typescript
 * // Check if the 'categories' array contains either values from field "cate1" or "Science"
 * arrayContainsAny(field("categories"), array([field("cate1"), "Science"]));
 * ```
 *
 * @param array The array expression to check.
 * @param values An expression that evaluates to an array, whose elements to check for in the array.
 * @return A new {@code Expression} representing the 'array_contains_any' comparison.
 */
export function arrayContainsAny(array: Expression, values: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's array value contains any of the specified
 * elements.
 *
 * ```typescript
 * // Check if the 'groups' array contains either the value from the 'userGroup' field
 * // or the value "guest"
 * arrayContainsAny("categories", array([field("cate1"), "Science"]));
 * ```
 *
 * @param fieldName The field name to check.
 * @param values An expression that evaluates to an array, whose elements to check for in the array field.
 * @return A new {@code Expression} representing the 'array_contains_any' comparison.
 */
export function arrayContainsAny(fieldName: string, values: Expression): BooleanExpression;
export function arrayContainsAny(
  array: Expression | string,
  values: unknown[] | Expression
): BooleanExpression {
  if (Array.isArray(values)) {
    return fieldOrExpression(array).arrayContainsAny(values);
  } else {
    return fieldOrExpression(array).arrayContainsAny(values);
  }
}

/**
 * Creates an expression that checks if an array expression contains all the specified elements.
 *
 * ```typescript
 * // Check if the "tags" array contains all of the values: "SciFi", "Adventure", and the value from field "tag1"
 * arrayContainsAll(field("tags"), [field("tag1"), constant("SciFi"), "Adventure"]);
 * ```
 *
 * @param array The array expression to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expression} representing the 'array_contains_all' comparison.
 */
export function arrayContainsAll(
  array: Expression,
  values: Array<Expression | unknown>
): BooleanExpression;

/**
 * Creates an expression that checks if a field's array value contains all the specified values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'tags' array contains both of the values from field 'tag1', the value "SciFi", and "Adventure"
 * arrayContainsAll("tags", [field("tag1"), "SciFi", "Adventure"]);
 * ```
 *
 * @param fieldName The field name to check.
 * @param values The elements to check for in the array.
 * @return A new {@code Expression} representing the 'array_contains_all' comparison.
 */
export function arrayContainsAll(
  fieldName: string,
  values: Array<Expression | unknown>
): BooleanExpression;

/**
 * Creates an expression that checks if an array expression contains all the specified elements.
 *
 * ```typescript
 * // Check if the "tags" array contains all of the values: "SciFi", "Adventure", and the value from field "tag1"
 * arrayContainsAll(field("tags"), [field("tag1"), constant("SciFi"), "Adventure"]);
 * ```
 *
 * @param array The array expression to check.
 * @param arrayExpression The elements to check for in the array.
 * @return A new {@code Expression} representing the 'array_contains_all' comparison.
 */
export function arrayContainsAll(
  array: Expression,
  arrayExpression: Expression
): BooleanExpression;

/**
 * Creates an expression that checks if a field's array value contains all the specified values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'tags' array contains both of the values from field 'tag1', the value "SciFi", and "Adventure"
 * arrayContainsAll("tags", [field("tag1"), "SciFi", "Adventure"]);
 * ```
 *
 * @param fieldName The field name to check.
 * @param arrayExpression The elements to check for in the array.
 * @return A new {@code Expression} representing the 'array_contains_all' comparison.
 */
export function arrayContainsAll(
  fieldName: string,
  arrayExpression: Expression
): BooleanExpression;
export function arrayContainsAll(
  array: Expression | string,
  values: unknown[] | Expression
): BooleanExpression {
  if (Array.isArray(values)) {
    return fieldOrExpression(array).arrayContainsAll(values);
  } else {
    return fieldOrExpression(array).arrayContainsAll(values);
  }
}

/**
 * Creates an expression that calculates the length of an array in a specified field.
 *
 * ```typescript
 * // Get the number of items in field 'cart'
 * arrayLength('cart');
 * ```
 *
 * @param fieldName The name of the field containing an array to calculate the length of.
 * @return A new {@code Expression} representing the length of the array.
 */
export function arrayLength(fieldName: string): FunctionExpr;

/**
 * Creates an expression that calculates the length of an array expression.
 *
 * ```typescript
 * // Get the number of items in the 'cart' array
 * arrayLength(field("cart"));
 * ```
 *
 * @param array The array expression to calculate the length of.
 * @return A new {@code Expression} representing the length of the array.
 */
export function arrayLength(array: Expression): FunctionExpr;
export function arrayLength(array: Expression | string): FunctionExpr {
  return fieldOrExpression(array).arrayLength();
}

/**
 * Creates an expression that checks if an expression, when evaluated, is equal to any of the provided values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
 * equalAny(field("category"), [constant("Electronics"), field("primaryType")]);
 * ```
 *
 * @param expression The expression whose results to compare.
 * @param values The values to check against.
 * @return A new {@code Expression} representing the 'IN' comparison.
 */
export function equalAny(
  expression: Expression,
  values: Array<Expression | unknown>
): BooleanExpression;

/**
 * Creates an expression that checks if an expression is equal to any of the provided values.
 *
 * ```typescript
 * // Check if the 'category' field is set to a value in the disabledCategories field
 * equalAny(field("category"), field('disabledCategories'));
 * ```
 *
 * @param expression The expression whose results to compare.
 * @param arrayExpression An expression that evaluates to an array, whose elements to check for equality to the input.
 * @return A new {@code Expression} representing the 'IN' comparison.
 */
export function equalAny(expression: Expression, arrayExpression: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is equal to any of the provided values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
 * equalAny("category", [constant("Electronics"), field("primaryType")]);
 * ```
 *
 * @param fieldName The field to compare.
 * @param values The values to check against.
 * @return A new {@code Expression} representing the 'IN' comparison.
 */
export function equalAny(
  fieldName: string,
  values: Array<Expression | unknown>
): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is equal to any of the provided values or
 * expressions.
 *
 * ```typescript
 * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
 * equalAny("category", ["Electronics", field("primaryType")]);
 * ```
 *
 * @param fieldName The field to compare.
 * @param arrayExpression An expression that evaluates to an array, whose elements to check for equality to the input field.
 * @return A new {@code Expression} representing the 'IN' comparison.
 */
export function equalAny(fieldName: string, arrayExpression: Expression): BooleanExpression;
export function equalAny(
  element: Expression | string,
  values: unknown[] | Expression
): BooleanExpression {
  if (Array.isArray(values)) {
    return fieldOrExpression(element).equalAny(values);
  } else {
    return fieldOrExpression(element).equalAny(values);
  }
}

/**
 * Creates an expression that checks if an expression is not equal to any of the provided values
 * or expressions.
 *
 * ```typescript
 * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
 * notEqAny(field("status"), ["pending", field("rejectedStatus")]);
 * ```
 *
 * @param element The expression to compare.
 * @param values The values to check against.
 * @return A new {@code Expression} representing the 'NOT IN' comparison.
 */
export function notEqAny(
  element: Expression,
  values: Array<Expression | unknown>
): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is not equal to any of the provided values
 * or expressions.
 *
 * ```typescript
 * // Check if the 'status' field is neither "pending" nor the value of 'rejectedStatus'
 * notEqAny("status", [constant("pending"), field("rejectedStatus")]);
 * ```
 *
 * @param fieldName The field name to compare.
 * @param values The values to check against.
 * @return A new {@code Expression} representing the 'NOT IN' comparison.
 */
export function notEqAny(
  fieldName: string,
  values: Array<Expression | unknown>
): BooleanExpression;

/**
 * Creates an expression that checks if an expression is not equal to any of the provided values
 * or expressions.
 *
 * ```typescript
 * // Check if the 'status' field is neither "pending" nor the value of the field 'rejectedStatus'
 * notEqAny(field("status"), ["pending", field("rejectedStatus")]);
 * ```
 *
 * @param element The expression to compare.
 * @param arrayExpression The values to check against.
 * @return A new {@code Expression} representing the 'NOT IN' comparison.
 */
export function notEqAny(element: Expression, arrayExpression: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value is not equal to any of the values in the evaluated expression.
 *
 * ```typescript
 * // Check if the 'status' field is not equal to any value in the field 'rejectedStatuses'
 * notEqAny("status", field("rejectedStatuses"));
 * ```
 *
 * @param fieldName The field name to compare.
 * @param arrayExpression The values to check against.
 * @return A new {@code Expression} representing the 'NOT IN' comparison.
 */
export function notEqAny(fieldName: string, arrayExpression: Expression): BooleanExpression;

export function notEqAny(
  element: Expression | string,
  values: unknown[] | Expression
): BooleanExpression {
  if (Array.isArray(values)) {
    return fieldOrExpression(element).notEqAny(values);
  } else {
    return fieldOrExpression(element).notEqAny(values);
  }
}

/**
 * Creates an expression that performs a logical 'XOR' (exclusive OR) operation on multiple BooleanExprs.
 *
 * ```typescript
 * // Check if only one of the conditions is true: 'age' greater than 18, 'city' is "London",
 * // or 'status' is "active".
 * const condition = xor(
 *     greaterThan("age", 18),
 *     equal("city", "London"),
 *     equal("status", "active"));
 * ```
 *
 * @param first The first condition.
 * @param second The second condition.
 * @param additionalConditions Additional conditions to 'XOR' together.
 * @return A new {@code Expression} representing the logical 'XOR' operation.
 */
export function xor(
  first: BooleanExpression,
  second: BooleanExpression,
  ...additionalConditions: BooleanExpression[]
): BooleanExpression {
  return new BooleanExpression('xor', [first, second, ...additionalConditions]);
}

/**
 * Creates a conditional expression that evaluates to a 'then' expression if a condition is true
 * and an 'else' expression if the condition is false.
 *
 * ```typescript
 * // If 'age' is greater than 18, return "Adult"; otherwise, return "Minor".
 * cond(
 *     greaterThan("age", 18), constant("Adult"), constant("Minor"));
 * ```
 *
 * @param condition The condition to evaluate.
 * @param thenExpr The expression to evaluate if the condition is true.
 * @param elseExpr The expression to evaluate if the condition is false.
 * @return A new {@code Expression} representing the conditional expression.
 */
export function cond(
  condition: BooleanExpression,
  thenExpr: Expression,
  elseExpr: Expression
): FunctionExpr {
  return new FunctionExpr('cond', [
    condition,
    cast<Expression>(thenExpr),
    cast<Expression>(elseExpr),
  ]);
}

/**
 * Creates an expression that negates a filter condition.
 *
 * ```typescript
 * // Find documents where the 'completed' field is NOT true
 * not(equal("completed", true));
 * ```
 *
 * @param booleanExpr The filter condition to negate.
 * @return A new {@code Expression} representing the negated filter condition.
 */
export function not(booleanExpr: BooleanExpression): BooleanExpression {
  return booleanExpr.not();
}

/**
 * Creates an expression that returns the largest value between multiple input
 * expressions or literal values. Based on Firestore's value type ordering.
 *
 * ```typescript
 * // Returns the largest value between the 'field1' field, the 'field2' field,
 * // and 1000
 * logicalMaximum(field("field1"), field("field2"), 1000);
 * ```
 *
 * @param first The first operand expression.
 * @param second The second expression or literal.
 * @param others Optional additional expressions or literals.
 * @return A new {@code Expression} representing the logical max operation.
 */
export function logicalMaximum(
  first: Expression,
  second: Expression | unknown,
  ...others: Array<Expression | unknown>
): FunctionExpr;

/**
 * Creates an expression that returns the largest value between multiple input
 * expressions or literal values. Based on Firestore's value type ordering.
 *
 * ```typescript
 * // Returns the largest value between the 'field1' field, the 'field2' field,
 * // and 1000.
 * logicalMaximum("field1", field("field2"), 1000);
 * ```
 *
 * @param fieldName The first operand field name.
 * @param second The second expression or literal.
 * @param others Optional additional expressions or literals.
 * @return A new {@code Expression} representing the logical max operation.
 */
export function logicalMaximum(
  fieldName: string,
  second: Expression | unknown,
  ...others: Array<Expression | unknown>
): FunctionExpr;

export function logicalMaximum(
  first: Expression | string,
  second: Expression | unknown,
  ...others: Array<Expression | unknown>
): FunctionExpr {
  return fieldOrExpression(first).logicalMaximum(
    valueToDefaultExpr(second),
    ...others.map(value => valueToDefaultExpr(value))
  );
}

/**
 * Creates an expression that returns the smallest value between multiple input
 * expressions and literal values. Based on Firestore's value type ordering.
 *
 * ```typescript
 * // Returns the smallest value between the 'field1' field, the 'field2' field,
 * // and 1000.
 * logicalMinimum(field("field1"), field("field2"), 1000);
 * ```
 *
 * @param first The first operand expression.
 * @param second The second expression or literal.
 * @param others Optional additional expressions or literals.
 * @return A new {@code Expression} representing the logical min operation.
 */
export function logicalMinimum(
  first: Expression,
  second: Expression | unknown,
  ...others: Array<Expression | unknown>
): FunctionExpr;

/**
 * Creates an expression that returns the smallest value between a field's value
 * and other input expressions or literal values.
 * Based on Firestore's value type ordering.
 *
 * ```typescript
 * // Returns the smallest value between the 'field1' field, the 'field2' field,
 * // and 1000.
 * logicalMinimum("field1", field("field2"), 1000);
 * ```
 *
 * @param fieldName The first operand field name.
 * @param second The second expression or literal.
 * @param others Optional additional expressions or literals.
 * @return A new {@code Expression} representing the logical min operation.
 */
export function logicalMinimum(
  fieldName: string,
  second: Expression | unknown,
  ...others: Array<Expression | unknown>
): FunctionExpr;

export function logicalMinimum(
  first: Expression | string,
  second: Expression | unknown,
  ...others: Array<Expression | unknown>
): FunctionExpr {
  return fieldOrExpression(first).logicalMinimum(
    valueToDefaultExpr(second),
    ...others.map(value => valueToDefaultExpr(value))
  );
}

/**
 * Creates an expression that checks if a field exists.
 *
 * ```typescript
 * // Check if the document has a field named "phoneNumber"
 * exists(field("phoneNumber"));
 * ```
 *
 * @param value An expression evaluates to the name of the field to check.
 * @return A new {@code Expression} representing the 'exists' check.
 */
export function exists(value: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field exists.
 *
 * ```typescript
 * // Check if the document has a field named "phoneNumber"
 * exists("phoneNumber");
 * ```
 *
 * @param fieldName The field name to check.
 * @return A new {@code Expression} representing the 'exists' check.
 */
export function exists(fieldName: string): BooleanExpression;
export function exists(valueOrField: Expression | string): BooleanExpression {
  return fieldOrExpression(valueOrField).exists();
}

/**
 * Creates an expression that checks if an expression evaluates to 'NaN' (Not a Number).
 *
 * ```typescript
 * // Check if the result of a calculation is NaN
 * isNan(field("value").divide(0));
 * ```
 *
 * @param value The expression to check.
 * @return A new {@code Expression} representing the 'isNan' check.
 */
export function isNan(value: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a field's value evaluates to 'NaN' (Not a Number).
 *
 * ```typescript
 * // Check if the result of a calculation is NaN
 * isNan("value");
 * ```
 *
 * @param fieldName The name of the field to check.
 * @return A new {@code Expression} representing the 'isNan' check.
 */
export function isNan(fieldName: string): BooleanExpression;
export function isNan(value: Expression | string): BooleanExpression {
  return fieldOrExpression(value).isNan();
}

/**
 * Creates an expression that reverses a string.
 *
 * ```typescript
 * // Reverse the value of the 'myString' field.
 * reverse(field("myString"));
 * ```
 *
 * @param stringExpression An expression evaluating to a string value, which will be reversed.
 * @return A new {@code Expression} representing the reversed string.
 */
export function reverse(stringExpression: Expression): FunctionExpr;

/**
 * Creates an expression that reverses a string value in the specified field.
 *
 * ```typescript
 * // Reverse the value of the 'myString' field.
 * reverse("myString");
 * ```
 *
 * @param field The name of the field representing the string to reverse.
 * @return A new {@code Expression} representing the reversed string.
 */
export function reverse(field: string): FunctionExpr;
export function reverse(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).reverse();
}

/**
 * Creates an expression that reverses an array.
 *
 * ```typescript
 * // Reverse the value of the 'myArray' field.
 * arrayReverse("myArray");
 * ```
 *
 * @param fieldName The name of the field to reverse.
 * @return A new {@code Expression} representing the reversed array.
 */
export function arrayReverse(fieldName: string): FunctionExpr;

/**
 * Creates an expression that reverses an array.
 *
 * ```typescript
 * // Reverse the value of the 'myArray' field.
 * arrayReverse(field("myArray"));
 * ```
 *
 * @param arrayExpression An expression evaluating to an array value, which will be reversed.
 * @return A new {@code Expression} representing the reversed array.
 */
export function arrayReverse(arrayExpression: Expression): FunctionExpr;
export function arrayReverse(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).arrayReverse();
}

/**
 * Creates an expression that calculates the byte length of a string in UTF-8, or just the length of a Blob.
 *
 * ```typescript
 * // Calculate the length of the 'myString' field in bytes.
 * byteLength(field("myString"));
 * ```
 *
 * @param expr The expression representing the string.
 * @return A new {@code Expression} representing the length of the string in bytes.
 */
export function byteLength(expr: Expression): FunctionExpr;

/**
 * Creates an expression that calculates the length of a string represented by a field in UTF-8 bytes, or just the length of a Blob.
 *
 * ```typescript
 * // Calculate the length of the 'myString' field in bytes.
 * byteLength("myString");
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @return A new {@code Expression} representing the length of the string in bytes.
 */
export function byteLength(fieldName: string): FunctionExpr;
export function byteLength(expr: Expression | string): FunctionExpr {
  const normalizedExpr = fieldOrExpression(expr);
  return normalizedExpr.byteLength();
}

/**
 * Creates an expression that computes e to the power of the expression's result.
 *
 * ```typescript
 * // Compute e to the power of 2.
 * exp(constant(2));
 * ```
 *
 * @return A new {@code Expression} representing the exp of the numeric value.
 */
export function exp(expression: Expression): FunctionExpr;

/**
 * Creates an expression that computes e to the power of the expression's result.
 *
 * ```typescript
 * // Compute e to the power of the 'value' field.
 * exp('value');
 * ```
 *
 * @return A new {@code Expression} representing the exp of the numeric value.
 */
export function exp(fieldName: string): FunctionExpr;

export function exp(expressionOrFieldName: Expression | string): FunctionExpr {
  return fieldOrExpression(expressionOrFieldName).exp();
}

/**
 * Creates an expression that computes the ceiling of a numeric value.
 *
 * ```typescript
 * // Compute the ceiling of the 'price' field.
 * ceil("price");
 * ```
 *
 * @param fieldName The name of the field to compute the ceiling of.
 * @return A new {@code Expression} representing the ceiling of the numeric value.
 */
export function ceil(fieldName: string): FunctionExpr;

/**
 * Creates an expression that computes the ceiling of a numeric value.
 *
 * ```typescript
 * // Compute the ceiling of the 'price' field.
 * ceil(field("price"));
 * ```
 *
 * @param expression An expression evaluating to a numeric value, which the ceiling will be computed for.
 * @return A new {@code Expression} representing the ceiling of the numeric value.
 */
export function ceil(expression: Expression): FunctionExpr;
export function ceil(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).ceil();
}

/**
 * Creates an expression that computes the floor of a numeric value.
 *
 * @param expr The expression to compute the floor of.
 * @return A new {@code Expression} representing the floor of the numeric value.
 */
export function floor(expr: Expression): FunctionExpr;

/**
 * Creates an expression that computes the floor of a numeric value.
 *
 * @param fieldName The name of the field to compute the floor of.
 * @return A new {@code Expression} representing the floor of the numeric value.
 */
export function floor(fieldName: string): FunctionExpr;
export function floor(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).floor();
}

/**
 * Creates an aggregation that counts the number of distinct values of a field.
 *
 * @param expr The expression or field to count distinct values of.
 * @return A new `AggregateFunction` representing the 'count_distinct' aggregation.
 */
export function countDistinct(expr: Expression | string): AggregateFunction {
  return fieldOrExpression(expr).countDistinct();
}

/**
 * Creates an expression that calculates the character length of a string field in UTF8.
 *
 * ```typescript
 * // Get the character length of the 'name' field in UTF-8.
 * strLength("name");
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @return A new {@code Expression} representing the length of the string.
 */
export function charLength(fieldName: string): FunctionExpr;

/**
 * Creates an expression that calculates the character length of a string expression in UTF-8.
 *
 * ```typescript
 * // Get the character length of the 'name' field in UTF-8.
 * strLength(field("name"));
 * ```
 *
 * @param stringExpression The expression representing the string to calculate the length of.
 * @return A new {@code Expression} representing the length of the string.
 */
export function charLength(stringExpression: Expression): FunctionExpr;
export function charLength(value: Expression | string): FunctionExpr {
  const valueExpr = fieldOrExpression(value);
  return valueExpr.charLength();
}

/**
 * Creates an expression that performs a case-sensitive wildcard string comparison against a
 * field.
 *
 * ```typescript
 * // Check if the 'title' field contains the string "guide"
 * like("title", "%guide%");
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @param pattern The pattern to search for. You can use "%" as a wildcard character.
 * @return A new {@code Expression} representing the 'like' comparison.
 */
export function like(fieldName: string, pattern: string): BooleanExpression;

/**
 * Creates an expression that performs a case-sensitive wildcard string comparison against a
 * field.
 *
 * ```typescript
 * // Check if the 'title' field contains the string "guide"
 * like("title", field("pattern"));
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @param pattern The pattern to search for. You can use "%" as a wildcard character.
 * @return A new {@code Expression} representing the 'like' comparison.
 */
export function like(fieldName: string, pattern: Expression): BooleanExpression;

/**
 * Creates an expression that performs a case-sensitive wildcard string comparison.
 *
 * ```typescript
 * // Check if the 'title' field contains the string "guide"
 * like(field("title"), "%guide%");
 * ```
 *
 * @param stringExpression The expression representing the string to perform the comparison on.
 * @param pattern The pattern to search for. You can use "%" as a wildcard character.
 * @return A new {@code Expression} representing the 'like' comparison.
 */
export function like(stringExpression: Expression, pattern: string): BooleanExpression;

/**
 * Creates an expression that performs a case-sensitive wildcard string comparison.
 *
 * ```typescript
 * // Check if the 'title' field contains the string "guide"
 * like(field("title"), field("pattern"));
 * ```
 *
 * @param stringExpression The expression representing the string to perform the comparison on.
 * @param pattern The pattern to search for. You can use "%" as a wildcard character.
 * @return A new {@code Expression} representing the 'like' comparison.
 */
export function like(stringExpression: Expression, pattern: Expression): BooleanExpression;
export function like(
  left: Expression | string,
  pattern: Expression | string
): FunctionExpr {
  const leftExpr = fieldOrExpression(left);
  const patternExpr = valueToDefaultExpr(pattern);
  return leftExpr.like(patternExpr);
}

/**
 * Creates an expression that checks if a string field contains a specified regular expression as
 * a substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example" (case-insensitive)
 * regexContains("description", "(?i)example");
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @param pattern The regular expression to use for the search.
 * @return A new {@code Expression} representing the 'contains' comparison.
 */
export function regexContains(fieldName: string, pattern: string): BooleanExpression;

/**
 * Creates an expression that checks if a string field contains a specified regular expression as
 * a substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example" (case-insensitive)
 * regexContains("description", field("pattern"));
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @param pattern The regular expression to use for the search.
 * @return A new {@code Expression} representing the 'contains' comparison.
 */
export function regexContains(fieldName: string, pattern: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a string expression contains a specified regular
 * expression as a substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example" (case-insensitive)
 * regexContains(field("description"), "(?i)example");
 * ```
 *
 * @param stringExpression The expression representing the string to perform the comparison on.
 * @param pattern The regular expression to use for the search.
 * @return A new {@code Expression} representing the 'contains' comparison.
 */
export function regexContains(
  stringExpression: Expression,
  pattern: string
): BooleanExpression;

/**
 * Creates an expression that checks if a string expression contains a specified regular
 * expression as a substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example" (case-insensitive)
 * regexContains(field("description"), field("pattern"));
 * ```
 *
 * @param stringExpression The expression representing the string to perform the comparison on.
 * @param pattern The regular expression to use for the search.
 * @return A new {@code Expression} representing the 'contains' comparison.
 */
export function regexContains(
  stringExpression: Expression,
  pattern: Expression
): BooleanExpression;
export function regexContains(
  left: Expression | string,
  pattern: Expression | string
): BooleanExpression {
  const leftExpr = fieldOrExpression(left);
  const patternExpr = valueToDefaultExpr(pattern);
  return leftExpr.regexContains(patternExpr);
}

/**
 * Creates an expression that checks if a string field matches a specified regular expression.
 *
 * ```typescript
 * // Check if the 'email' field matches a valid email pattern
 * regexMatch("email", "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @param pattern The regular expression to use for the match.
 * @return A new {@code Expression} representing the regular expression match.
 */
export function regexMatch(fieldName: string, pattern: string): BooleanExpression;

/**
 * Creates an expression that checks if a string field matches a specified regular expression.
 *
 * ```typescript
 * // Check if the 'email' field matches a valid email pattern
 * regexMatch("email", field("pattern"));
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @param pattern The regular expression to use for the match.
 * @return A new {@code Expression} representing the regular expression match.
 */
export function regexMatch(fieldName: string, pattern: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a string expression matches a specified regular
 * expression.
 *
 * ```typescript
 * // Check if the 'email' field matches a valid email pattern
 * regexMatch(field("email"), "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
 * ```
 *
 * @param stringExpression The expression representing the string to match against.
 * @param pattern The regular expression to use for the match.
 * @return A new {@code Expression} representing the regular expression match.
 */
export function regexMatch(
  stringExpression: Expression,
  pattern: string
): BooleanExpression;

/**
 * Creates an expression that checks if a string expression matches a specified regular
 * expression.
 *
 * ```typescript
 * // Check if the 'email' field matches a valid email pattern
 * regexMatch(field("email"), field("pattern"));
 * ```
 *
 * @param stringExpression The expression representing the string to match against.
 * @param pattern The regular expression to use for the match.
 * @return A new {@code Expression} representing the regular expression match.
 */
export function regexMatch(stringExpression: Expression, pattern: Expression): BooleanExpression;
export function regexMatch(
  left: Expression | string,
  pattern: Expression | string
): BooleanExpression {
  const leftExpr = fieldOrExpression(left);
  const patternExpr = valueToDefaultExpr(pattern);
  return leftExpr.regexMatch(patternExpr);
}

/**
 * Creates an expression that checks if a string field contains a specified substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example".
 * strContains("description", "example");
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @param substring The substring to search for.
 * @return A new {@code Expression} representing the 'contains' comparison.
 */
export function strContains(fieldName: string, substring: string): BooleanExpression;

/**
 * Creates an expression that checks if a string field contains a substring specified by an expression.
 *
 * ```typescript
 * // Check if the 'description' field contains the value of the 'keyword' field.
 * strContains("description", field("keyword"));
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @param substring The expression representing the substring to search for.
 * @return A new {@code Expression} representing the 'contains' comparison.
 */
export function strContains(fieldName: string, substring: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a string expression contains a specified substring.
 *
 * ```typescript
 * // Check if the 'description' field contains "example".
 * strContains(field("description"), "example");
 * ```
 *
 * @param stringExpression The expression representing the string to perform the comparison on.
 * @param substring The substring to search for.
 * @return A new {@code Expression} representing the 'contains' comparison.
 */
export function strContains(
  stringExpression: Expression,
  substring: string
): BooleanExpression;

/**
 * Creates an expression that checks if a string expression contains a substring specified by another expression.
 *
 * ```typescript
 * // Check if the 'description' field contains the value of the 'keyword' field.
 * strContains(field("description"), field("keyword"));
 * ```
 *
 * @param stringExpression The expression representing the string to perform the comparison on.
 * @param substring The expression representing the substring to search for.
 * @return A new {@code Expression} representing the 'contains' comparison.
 */
export function strContains(
  stringExpression: Expression,
  substring: Expression
): BooleanExpression;
export function strContains(
  left: Expression | string,
  substring: Expression | string
): BooleanExpression {
  const leftExpr = fieldOrExpression(left);
  const substringExpr = valueToDefaultExpr(substring);
  return leftExpr.strContains(substringExpr);
}

/**
 * Creates an expression that checks if a field's value starts with a given prefix.
 *
 * ```typescript
 * // Check if the 'name' field starts with "Mr."
 * startsWith("name", "Mr.");
 * ```
 *
 * @param fieldName The field name to check.
 * @param prefix The prefix to check for.
 * @return A new {@code Expression} representing the 'starts with' comparison.
 */
export function startsWith(fieldName: string, prefix: string): BooleanExpression;

/**
 * Creates an expression that checks if a field's value starts with a given prefix.
 *
 * ```typescript
 * // Check if the 'fullName' field starts with the value of the 'firstName' field
 * startsWith("fullName", field("firstName"));
 * ```
 *
 * @param fieldName The field name to check.
 * @param prefix The expression representing the prefix.
 * @return A new {@code Expression} representing the 'starts with' comparison.
 */
export function startsWith(fieldName: string, prefix: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a string expression starts with a given prefix.
 *
 * ```typescript
 * // Check if the result of concatenating 'firstName' and 'lastName' fields starts with "Mr."
 * startsWith(field("fullName"), "Mr.");
 * ```
 *
 * @param stringExpression The expression to check.
 * @param prefix The prefix to check for.
 * @return A new {@code Expression} representing the 'starts with' comparison.
 */
export function startsWith(stringExpression: Expression, prefix: string): BooleanExpression;

/**
 * Creates an expression that checks if a string expression starts with a given prefix.
 *
 * ```typescript
 * // Check if the result of concatenating 'firstName' and 'lastName' fields starts with "Mr."
 * startsWith(field("fullName"), field("prefix"));
 * ```
 *
 * @param stringExpression The expression to check.
 * @param prefix The prefix to check for.
 * @return A new {@code Expression} representing the 'starts with' comparison.
 */
export function startsWith(stringExpression: Expression, prefix: Expression): BooleanExpression;
export function startsWith(
  expr: Expression | string,
  prefix: Expression | string
): BooleanExpression {
  return fieldOrExpression(expr).startsWith(valueToDefaultExpr(prefix));
}

/**
 * Creates an expression that checks if a field's value ends with a given postfix.
 *
 * ```typescript
 * // Check if the 'filename' field ends with ".txt"
 * endsWith("filename", ".txt");
 * ```
 *
 * @param fieldName The field name to check.
 * @param suffix The postfix to check for.
 * @return A new {@code Expression} representing the 'ends with' comparison.
 */
export function endsWith(fieldName: string, suffix: string): BooleanExpression;

/**
 * Creates an expression that checks if a field's value ends with a given postfix.
 *
 * ```typescript
 * // Check if the 'url' field ends with the value of the 'extension' field
 * endsWith("url", field("extension"));
 * ```
 *
 * @param fieldName The field name to check.
 * @param suffix The expression representing the postfix.
 * @return A new {@code Expression} representing the 'ends with' comparison.
 */
export function endsWith(fieldName: string, suffix: Expression): BooleanExpression;

/**
 * Creates an expression that checks if a string expression ends with a given postfix.
 *
 * ```typescript
 * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
 * endsWith(field("fullName"), "Jr.");
 * ```
 *
 * @param stringExpression The expression to check.
 * @param suffix The postfix to check for.
 * @return A new {@code Expression} representing the 'ends with' comparison.
 */
export function endsWith(stringExpression: Expression, suffix: string): BooleanExpression;

/**
 * Creates an expression that checks if a string expression ends with a given postfix.
 *
 * ```typescript
 * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
 * endsWith(field("fullName"), constant("Jr."));
 * ```
 *
 * @param stringExpression The expression to check.
 * @param suffix The postfix to check for.
 * @return A new {@code Expression} representing the 'ends with' comparison.
 */
export function endsWith(stringExpression: Expression, suffix: Expression): BooleanExpression;
export function endsWith(
  expr: Expression | string,
  suffix: Expression | string
): BooleanExpression {
  return fieldOrExpression(expr).endsWith(valueToDefaultExpr(suffix));
}

/**
 * Creates an expression that converts a string field to lowercase.
 *
 * ```typescript
 * // Convert the 'name' field to lowercase
 * toLower("name");
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @return A new {@code Expression} representing the lowercase string.
 */
export function toLower(fieldName: string): FunctionExpr;

/**
 * Creates an expression that converts a string expression to lowercase.
 *
 * ```typescript
 * // Convert the 'name' field to lowercase
 * toLower(field("name"));
 * ```
 *
 * @param stringExpression The expression representing the string to convert to lowercase.
 * @return A new {@code Expression} representing the lowercase string.
 */
export function toLower(stringExpression: Expression): FunctionExpr;
export function toLower(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).toLower();
}

/**
 * Creates an expression that converts a string field to uppercase.
 *
 * ```typescript
 * // Convert the 'title' field to uppercase
 * toUpper("title");
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @return A new {@code Expression} representing the uppercase string.
 */
export function toUpper(fieldName: string): FunctionExpr;

/**
 * Creates an expression that converts a string expression to uppercase.
 *
 * ```typescript
 * // Convert the 'title' field to uppercase
 * toUppercase(field("title"));
 * ```
 *
 * @param stringExpression The expression representing the string to convert to uppercase.
 * @return A new {@code Expression} representing the uppercase string.
 */
export function toUpper(stringExpression: Expression): FunctionExpr;
export function toUpper(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).toUpper();
}

/**
 * Creates an expression that removes leading and trailing whitespace from a string field.
 *
 * ```typescript
 * // Trim whitespace from the 'userInput' field
 * trim("userInput");
 * ```
 *
 * @param fieldName The name of the field containing the string.
 * @return A new {@code Expression} representing the trimmed string.
 */
export function trim(fieldName: string): FunctionExpr;

/**
 * Creates an expression that removes leading and trailing whitespace from a string expression.
 *
 * ```typescript
 * // Trim whitespace from the 'userInput' field
 * trim(field("userInput"));
 * ```
 *
 * @param stringExpression The expression representing the string to trim.
 * @return A new {@code Expression} representing the trimmed string.
 */
export function trim(stringExpression: Expression): FunctionExpr;
export function trim(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).trim();
}

/**
 * Creates an expression that concatenates string functions, fields or constants together.
 *
 * ```typescript
 * // Combine the 'firstName', " ", and 'lastName' fields into a single string
 * strConcat("firstName", " ", field("lastName"));
 * ```
 *
 * @param fieldName The field name containing the initial string value.
 * @param secondString An expression or string literal to concatenate.
 * @param otherStrings Optional additional expressions or literals (typically strings) to concatenate.
 * @return A new {@code Expression} representing the concatenated string.
 */
export function strConcat(
  fieldName: string,
  secondString: Expression | string,
  ...otherStrings: Array<Expression | string>
): FunctionExpr;

/**
 * Creates an expression that concatenates string expressions together.
 *
 * ```typescript
 * // Combine the 'firstName', " ", and 'lastName' fields into a single string
 * strConcat(field("firstName"), " ", field("lastName"));
 * ```
 *
 * @param firstString The initial string expression to concatenate to.
 * @param secondString An expression or string literal to concatenate.
 * @param otherStrings Optional additional expressions or literals (typically strings) to concatenate.
 * @return A new {@code Expression} representing the concatenated string.
 */
export function strConcat(
  firstString: Expression,
  secondString: Expression | string,
  ...otherStrings: Array<Expression | string>
): FunctionExpr;
export function strConcat(
  first: string | Expression,
  second: string | Expression,
  ...elements: Array<string | Expression>
): FunctionExpr {
  return fieldOrExpression(first).strConcat(
    valueToDefaultExpr(second),
    ...elements.map(valueToDefaultExpr)
  );
}

/**
 * Accesses a value from a map (object) field using the provided key.
 *
 * ```typescript
 * // Get the 'city' value from the 'address' map field
 * mapGet("address", "city");
 * ```
 *
 * @param fieldName The field name of the map field.
 * @param subField The key to access in the map.
 * @return A new {@code Expression} representing the value associated with the given key in the map.
 */
export function mapGet(fieldName: string, subField: string): FunctionExpr;

/**
 * Accesses a value from a map (object) expression using the provided key.
 *
 * ```typescript
 * // Get the 'city' value from the 'address' map field
 * mapGet(field("address"), "city");
 * ```
 *
 * @param mapExpression The expression representing the map.
 * @param subField The key to access in the map.
 * @return A new {@code Expression} representing the value associated with the given key in the map.
 */
export function mapGet(mapExpression: Expression, subField: string): FunctionExpr;
export function mapGet(
  fieldOrExpr: string | Expression,
  subField: string
): FunctionExpr {
  return fieldOrExpression(fieldOrExpr).mapGet(subField);
}

/**
 * Creates an aggregation that counts the total number of stage inputs.
 *
 * ```typescript
 * // Count the total number of input documents
 * countAll().as("totalDocument");
 * ```
 *
 * @return A new {@code AggregateFunction} representing the 'countAll' aggregation.
 */
export function countAll(): AggregateFunction {
  return new AggregateFunction('count', []);
}

/**
 * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
 * provided expression.
 *
 * ```typescript
 * // Count the number of items where the price is greater than 10
 * count(field("price").greaterThan(10)).as("expensiveItemCount");
 * ```
 *
 * @param expression The expression to count.
 * @return A new {@code AggregateFunction} representing the 'count' aggregation.
 */
export function count(expression: Expression): AggregateFunction;

/**
 * Creates an aggregation that counts the number of stage inputs where the input field exists.
 *
 * ```typescript
 * // Count the total number of products
 * count("productId").as("totalProducts");
 * ```
 *
 * @param fieldName The name of the field to count.
 * @return A new {@code AggregateFunction} representing the 'count' aggregation.
 */
export function count(fieldName: string): AggregateFunction;
export function count(value: Expression | string): AggregateFunction {
  return fieldOrExpression(value).count();
}

/**
 * Creates an aggregation that calculates the sum of values from an expression across multiple
 * stage inputs.
 *
 * ```typescript
 * // Calculate the total revenue from a set of orders
 * sum(field("orderAmount")).as("totalRevenue");
 * ```
 *
 * @param expression The expression to sum up.
 * @return A new {@code AggregateFunction} representing the 'sum' aggregation.
 */
export function sum(expression: Expression): AggregateFunction;

/**
 * Creates an aggregation that calculates the sum of a field's values across multiple stage
 * inputs.
 *
 * ```typescript
 * // Calculate the total revenue from a set of orders
 * sum("orderAmount").as("totalRevenue");
 * ```
 *
 * @param fieldName The name of the field containing numeric values to sum up.
 * @return A new {@code AggregateFunction} representing the 'sum' aggregation.
 */
export function sum(fieldName: string): AggregateFunction;
export function sum(value: Expression | string): AggregateFunction {
  return fieldOrExpression(value).sum();
}

/**
 * Creates an aggregation that calculates the average (mean) of values from an expression across
 * multiple stage inputs.
 *
 * ```typescript
 * // Calculate the average age of users
 * avg(field("age")).as("averageAge");
 * ```
 *
 * @param expression The expression representing the values to average.
 * @return A new {@code AggregateFunction} representing the 'avg' aggregation.
 */
export function avg(expression: Expression): AggregateFunction;

/**
 * Creates an aggregation that calculates the average (mean) of a field's values across multiple
 * stage inputs.
 *
 * ```typescript
 * // Calculate the average age of users
 * avg("age").as("averageAge");
 * ```
 *
 * @param fieldName The name of the field containing numeric values to average.
 * @return A new {@code AggregateFunction} representing the 'avg' aggregation.
 */
export function avg(fieldName: string): AggregateFunction;
export function avg(value: Expression | string): AggregateFunction {
  return fieldOrExpression(value).avg();
}

/**
 * Creates an aggregation that finds the minimum value of an expression across multiple stage
 * inputs.
 *
 * ```typescript
 * // Find the lowest price of all products
 * minimum(field("price")).as("lowestPrice");
 * ```
 *
 * @param expression The expression to find the minimum value of.
 * @return A new {@code AggregateFunction} representing the 'min' aggregation.
 */
export function minimum(expression: Expression): AggregateFunction;

/**
 * Creates an aggregation that finds the minimum value of a field across multiple stage inputs.
 *
 * ```typescript
 * // Find the lowest price of all products
 * minimum("price").as("lowestPrice");
 * ```
 *
 * @param fieldName The name of the field to find the minimum value of.
 * @return A new {@code AggregateFunction} representing the 'min' aggregation.
 */
export function minimum(fieldName: string): AggregateFunction;
export function minimum(value: Expression | string): AggregateFunction {
  return fieldOrExpression(value).minimum();
}

/**
 * Creates an aggregation that finds the maximum value of an expression across multiple stage
 * inputs.
 *
 * ```typescript
 * // Find the highest score in a leaderboard
 * maximum(field("score")).as("highestScore");
 * ```
 *
 * @param expression The expression to find the maximum value of.
 * @return A new {@code AggregateFunction} representing the 'max' aggregation.
 */
export function maximum(expression: Expression): AggregateFunction;

/**
 * Creates an aggregation that finds the maximum value of a field across multiple stage inputs.
 *
 * ```typescript
 * // Find the highest score in a leaderboard
 * maximum("score").as("highestScore");
 * ```
 *
 * @param fieldName The name of the field to find the maximum value of.
 * @return A new {@code AggregateFunction} representing the 'max' aggregation.
 */
export function maximum(fieldName: string): AggregateFunction;
export function maximum(value: Expression | string): AggregateFunction {
  return fieldOrExpression(value).maximum();
}

/**
 * Calculates the Cosine distance between a field's vector value and a literal vector value.
 *
 * ```typescript
 * // Calculate the Cosine distance between the 'location' field and a target location
 * cosineDistance("location", [37.7749, -122.4194]);
 * ```
 *
 * @param fieldName The name of the field containing the first vector.
 * @param vector The other vector (as an array of doubles) or {@link VectorValue} to compare against.
 * @return A new {@code Expression} representing the Cosine distance between the two vectors.
 */
export function cosineDistance(
  fieldName: string,
  vector: number[] | VectorValue
): FunctionExpr;

/**
 * Calculates the Cosine distance between a field's vector value and a vector expression.
 *
 * ```typescript
 * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
 * cosineDistance("userVector", field("itemVector"));
 * ```
 *
 * @param fieldName The name of the field containing the first vector.
 * @param vectorExpression The other vector (represented as an Expression) to compare against.
 * @return A new {@code Expression} representing the cosine distance between the two vectors.
 */
export function cosineDistance(
  fieldName: string,
  vectorExpression: Expression
): FunctionExpr;

/**
 * Calculates the Cosine distance between a vector expression and a vector literal.
 *
 * ```typescript
 * // Calculate the cosine distance between the 'location' field and a target location
 * cosineDistance(field("location"), [37.7749, -122.4194]);
 * ```
 *
 * @param vectorExpression The first vector (represented as an Expression) to compare against.
 * @param vector The other vector (as an array of doubles or VectorValue) to compare against.
 * @return A new {@code Expression} representing the cosine distance between the two vectors.
 */
export function cosineDistance(
  vectorExpression: Expression,
  vector: number[] | VectorValue
): FunctionExpr;

/**
 * Calculates the Cosine distance between two vector expressions.
 *
 * ```typescript
 * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
 * cosineDistance(field("userVector"), field("itemVector"));
 * ```
 *
 * @param vectorExpression The first vector (represented as an Expression) to compare against.
 * @param otherVectorExpression The other vector (represented as an Expression) to compare against.
 * @return A new {@code Expression} representing the cosine distance between the two vectors.
 */
export function cosineDistance(
  vectorExpression: Expression,
  otherVectorExpression: Expression
): FunctionExpr;
export function cosineDistance(
  expr: Expression | string,
  other: Expression | number[] | firestore.VectorValue
): FunctionExpr {
  const expr1 = fieldOrExpression(expr);
  const expr2 = vectorToExpr(other);
  return expr1.cosineDistance(expr2);
}

/**
 * Calculates the dot product between a field's vector value and a double array.
 *
 * ```typescript
 * // Calculate the dot product distance between a feature vector and a target vector
 * dotProduct("features", [0.5, 0.8, 0.2]);
 * ```
 *
 * @param fieldName The name of the field containing the first vector.
 * @param vector The other vector (as an array of doubles or VectorValue) to calculate with.
 * @return A new {@code Expression} representing the dot product between the two vectors.
 */
export function dotProduct(
  fieldName: string,
  vector: number[] | VectorValue
): FunctionExpr;

/**
 * Calculates the dot product between a field's vector value and a vector expression.
 *
 * ```typescript
 * // Calculate the dot product distance between two document vectors: 'docVector1' and 'docVector2'
 * dotProduct("docVector1", field("docVector2"));
 * ```
 *
 * @param fieldName The name of the field containing the first vector.
 * @param vectorExpression The other vector (represented as an Expression) to calculate with.
 * @return A new {@code Expression} representing the dot product between the two vectors.
 */
export function dotProduct(
  fieldName: string,
  vectorExpression: Expression
): FunctionExpr;

/**
 * Calculates the dot product between a vector expression and a double array.
 *
 * ```typescript
 * // Calculate the dot product between a feature vector and a target vector
 * dotProduct(field("features"), [0.5, 0.8, 0.2]);
 * ```
 *
 * @param vectorExpression The first vector (represented as an Expression) to calculate with.
 * @param vector The other vector (as an array of doubles or VectorValue) to calculate with.
 * @return A new {@code Expression} representing the dot product between the two vectors.
 */
export function dotProduct(
  vectorExpression: Expression,
  vector: number[] | VectorValue
): FunctionExpr;

/**
 * Calculates the dot product between two vector expressions.
 *
 * ```typescript
 * // Calculate the dot product between two document vectors: 'docVector1' and 'docVector2'
 * dotProduct(field("docVector1"), field("docVector2"));
 * ```
 *
 * @param vectorExpression The first vector (represented as an Expression) to calculate with.
 * @param otherVectorExpression The other vector (represented as an Expression) to calculate with.
 * @return A new {@code Expression} representing the dot product between the two vectors.
 */
export function dotProduct(
  vectorExpression: Expression,
  otherVectorExpression: Expression
): FunctionExpr;
export function dotProduct(
  expr: Expression | string,
  other: Expression | number[] | VectorValue
): FunctionExpr {
  const expr1 = fieldOrExpression(expr);
  const expr2 = vectorToExpr(other);
  return expr1.dotProduct(expr2);
}

/**
 * Calculates the Euclidean distance between a field's vector value and a double array.
 *
 * ```typescript
 * // Calculate the Euclidean distance between the 'location' field and a target location
 * euclideanDistance("location", [37.7749, -122.4194]);
 * ```
 *
 * @param fieldName The name of the field containing the first vector.
 * @param vector The other vector (as an array of doubles or VectorValue) to compare against.
 * @return A new {@code Expression} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(
  fieldName: string,
  vector: number[] | VectorValue
): FunctionExpr;

/**
 * Calculates the Euclidean distance between a field's vector value and a vector expression.
 *
 * ```typescript
 * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
 * euclideanDistance("pointA", field("pointB"));
 * ```
 *
 * @param fieldName The name of the field containing the first vector.
 * @param vectorExpression The other vector (represented as an Expression) to compare against.
 * @return A new {@code Expression} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(
  fieldName: string,
  vectorExpression: Expression
): FunctionExpr;

/**
 * Calculates the Euclidean distance between a vector expression and a double array.
 *
 * ```typescript
 * // Calculate the Euclidean distance between the 'location' field and a target location
 *
 * euclideanDistance(field("location"), [37.7749, -122.4194]);
 * ```
 *
 * @param vectorExpression The first vector (represented as an Expression) to compare against.
 * @param vector The other vector (as an array of doubles or VectorValue) to compare against.
 * @return A new {@code Expression} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(
  vectorExpression: Expression,
  vector: number[] | VectorValue
): FunctionExpr;

/**
 * Calculates the Euclidean distance between two vector expressions.
 *
 * ```typescript
 * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
 * euclideanDistance(field("pointA"), field("pointB"));
 * ```
 *
 * @param vectorExpression The first vector (represented as an Expression) to compare against.
 * @param otherVectorExpression The other vector (represented as an Expression) to compare against.
 * @return A new {@code Expression} representing the Euclidean distance between the two vectors.
 */
export function euclideanDistance(
  vectorExpression: Expression,
  otherVectorExpression: Expression
): FunctionExpr;
export function euclideanDistance(
  expr: Expression | string,
  other: Expression | number[] | VectorValue
): FunctionExpr {
  const expr1 = fieldOrExpression(expr);
  const expr2 = vectorToExpr(other);
  return expr1.euclideanDistance(expr2);
}

/**
 * Creates an expression that calculates the length of a Firestore Vector.
 *
 * ```typescript
 * // Get the vector length (dimension) of the field 'embedding'.
 * vectorLength(field("embedding"));
 * ```
 *
 * @param vectorExpression The expression representing the Firestore Vector.
 * @return A new {@code Expression} representing the length of the array.
 */
export function vectorLength(vectorExpression: Expression): FunctionExpr;

/**
 * Creates an expression that calculates the length of a Firestore Vector represented by a field.
 *
 * ```typescript
 * // Get the vector length (dimension) of the field 'embedding'.
 * vectorLength("embedding");
 * ```
 *
 * @param fieldName The name of the field representing the Firestore Vector.
 * @return A new {@code Expression} representing the length of the array.
 */
export function vectorLength(fieldName: string): FunctionExpr;
export function vectorLength(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).vectorLength();
}

/**
 * Creates an expression that interprets an expression as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
 * and returns a timestamp.
 *
 * ```typescript
 * // Interpret the 'microseconds' field as microseconds since epoch.
 * unixMicrosToTimestamp(field("microseconds"));
 * ```
 *
 * @param expr The expression representing the number of microseconds since epoch.
 * @return A new {@code Expression} representing the timestamp.
 */
export function unixMicrosToTimestamp(expr: Expression): FunctionExpr;

/**
 * Creates an expression that interprets a field's value as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
 * and returns a timestamp.
 *
 * ```typescript
 * // Interpret the 'microseconds' field as microseconds since epoch.
 * unixMicrosToTimestamp("microseconds");
 * ```
 *
 * @param fieldName The name of the field representing the number of microseconds since epoch.
 * @return A new {@code Expression} representing the timestamp.
 */
export function unixMicrosToTimestamp(fieldName: string): FunctionExpr;
export function unixMicrosToTimestamp(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).unixMicrosToTimestamp();
}

/**
 * Creates an expression that converts a timestamp expression to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
 *
 * ```typescript
 * // Convert the 'timestamp' field to microseconds since epoch.
 * timestampToUnixMicros(field("timestamp"));
 * ```
 *
 * @param expr The expression representing the timestamp.
 * @return A new {@code Expression} representing the number of microseconds since epoch.
 */
export function timestampToUnixMicros(expr: Expression): FunctionExpr;

/**
 * Creates an expression that converts a timestamp field to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
 *
 * ```typescript
 * // Convert the 'timestamp' field to microseconds since epoch.
 * timestampToUnixMicros("timestamp");
 * ```
 *
 * @param fieldName The name of the field representing the timestamp.
 * @return A new {@code Expression} representing the number of microseconds since epoch.
 */
export function timestampToUnixMicros(fieldName: string): FunctionExpr;
export function timestampToUnixMicros(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).timestampToUnixMicros();
}

/**
 * Creates an expression that interprets an expression as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
 * and returns a timestamp.
 *
 * ```typescript
 * // Interpret the 'milliseconds' field as milliseconds since epoch.
 * unixMillisToTimestamp(field("milliseconds"));
 * ```
 *
 * @param expr The expression representing the number of milliseconds since epoch.
 * @return A new {@code Expression} representing the timestamp.
 */
export function unixMillisToTimestamp(expr: Expression): FunctionExpr;

/**
 * Creates an expression that interprets a field's value as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
 * and returns a timestamp.
 *
 * ```typescript
 * // Interpret the 'milliseconds' field as milliseconds since epoch.
 * unixMillisToTimestamp("milliseconds");
 * ```
 *
 * @param fieldName The name of the field representing the number of milliseconds since epoch.
 * @return A new {@code Expression} representing the timestamp.
 */
export function unixMillisToTimestamp(fieldName: string): FunctionExpr;
export function unixMillisToTimestamp(expr: Expression | string): FunctionExpr {
  const normalizedExpr = fieldOrExpression(expr);
  return normalizedExpr.unixMillisToTimestamp();
}

/**
 * Creates an expression that converts a timestamp expression to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
 *
 * ```typescript
 * // Convert the 'timestamp' field to milliseconds since epoch.
 * timestampToUnixMillis(field("timestamp"));
 * ```
 *
 * @param expr The expression representing the timestamp.
 * @return A new {@code Expression} representing the number of milliseconds since epoch.
 */
export function timestampToUnixMillis(expr: Expression): FunctionExpr;

/**
 * Creates an expression that converts a timestamp field to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
 *
 * ```typescript
 * // Convert the 'timestamp' field to milliseconds since epoch.
 * timestampToUnixMillis("timestamp");
 * ```
 *
 * @param fieldName The name of the field representing the timestamp.
 * @return A new {@code Expression} representing the number of milliseconds since epoch.
 */
export function timestampToUnixMillis(fieldName: string): FunctionExpr;
export function timestampToUnixMillis(expr: Expression | string): FunctionExpr {
  const normalizedExpr = fieldOrExpression(expr);
  return normalizedExpr.timestampToUnixMillis();
}

/**
 * Creates an expression that interprets an expression as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
 * and returns a timestamp.
 *
 * ```typescript
 * // Interpret the 'seconds' field as seconds since epoch.
 * unixSecondsToTimestamp(field("seconds"));
 * ```
 *
 * @param expr The expression representing the number of seconds since epoch.
 * @return A new {@code Expression} representing the timestamp.
 */
export function unixSecondsToTimestamp(expr: Expression): FunctionExpr;

/**
 * Creates an expression that interprets a field's value as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
 * and returns a timestamp.
 *
 * ```typescript
 * // Interpret the 'seconds' field as seconds since epoch.
 * unixSecondsToTimestamp("seconds");
 * ```
 *
 * @param fieldName The name of the field representing the number of seconds since epoch.
 * @return A new {@code Expression} representing the timestamp.
 */
export function unixSecondsToTimestamp(fieldName: string): FunctionExpr;
export function unixSecondsToTimestamp(expr: Expression | string): FunctionExpr {
  const normalizedExpr = fieldOrExpression(expr);
  return normalizedExpr.unixSecondsToTimestamp();
}

/**
 * Creates an expression that converts a timestamp expression to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
 *
 * ```typescript
 * // Convert the 'timestamp' field to seconds since epoch.
 * timestampToUnixSeconds(field("timestamp"));
 * ```
 *
 * @param expr The expression representing the timestamp.
 * @return A new {@code Expression} representing the number of seconds since epoch.
 */
export function timestampToUnixSeconds(expr: Expression): FunctionExpr;

/**
 * Creates an expression that converts a timestamp field to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
 *
 * ```typescript
 * // Convert the 'timestamp' field to seconds since epoch.
 * timestampToUnixSeconds("timestamp");
 * ```
 *
 * @param fieldName The name of the field representing the timestamp.
 * @return A new {@code Expression} representing the number of seconds since epoch.
 */
export function timestampToUnixSeconds(fieldName: string): FunctionExpr;
export function timestampToUnixSeconds(expr: Expression | string): FunctionExpr {
  const normalizedExpr = fieldOrExpression(expr);
  return normalizedExpr.timestampToUnixSeconds();
}

/**
 * Creates an expression that adds a specified amount of time to a timestamp.
 *
 * ```typescript
 * // Add some duration determined by field 'unit' and 'amount' to the 'timestamp' field.
 * timestampAdd(field("timestamp"), field("unit"), field("amount"));
 * ```
 *
 * @param timestamp The expression representing the timestamp.
 * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
 * @param amount The expression evaluates to amount of the unit.
 * @return A new {@code Expression} representing the resulting timestamp.
 */
export function timestampAdd(
  timestamp: Expression,
  unit: Expression,
  amount: Expression
): FunctionExpr;

/**
 * Creates an expression that adds a specified amount of time to a timestamp.
 *
 * ```typescript
 * // Add 1 day to the 'timestamp' field.
 * timestampAdd(field("timestamp"), "day", 1);
 * ```
 *
 * @param timestamp The expression representing the timestamp.
 * @param unit The unit of time to add (e.g., "day", "hour").
 * @param amount The amount of time to add.
 * @return A new {@code Expression} representing the resulting timestamp.
 */
export function timestampAdd(
  timestamp: Expression,
  unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
  amount: number
): FunctionExpr;

/**
 * Creates an expression that adds a specified amount of time to a timestamp represented by a field.
 *
 * ```typescript
 * // Add 1 day to the 'timestamp' field.
 * timestampAdd("timestamp", "day", 1);
 * ```
 *
 * @param fieldName The name of the field representing the timestamp.
 * @param unit The unit of time to add (e.g., "day", "hour").
 * @param amount The amount of time to add.
 * @return A new {@code Expression} representing the resulting timestamp.
 */
export function timestampAdd(
  fieldName: string,
  unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
  amount: number
): FunctionExpr;
export function timestampAdd(
  timestamp: Expression | string,
  unit:
    | Expression
    | 'microsecond'
    | 'millisecond'
    | 'second'
    | 'minute'
    | 'hour'
    | 'day',
  amount: Expression | number
): FunctionExpr {
  const normalizedTimestamp = fieldOrExpression(timestamp);
  const normalizedUnit = valueToDefaultExpr(unit);
  const normalizedAmount = valueToDefaultExpr(amount);
  return normalizedTimestamp.timestampAdd(normalizedUnit, normalizedAmount);
}

/**
 * Creates an expression that subtracts a specified amount of time from a timestamp.
 *
 * ```typescript
 * // Subtract some duration determined by field 'unit' and 'amount' from the 'timestamp' field.
 * timestampSub(field("timestamp"), field("unit"), field("amount"));
 * ```
 *
 * @param timestamp The expression representing the timestamp.
 * @param unit The expression evaluates to unit of time, must be one of 'microsecond', 'millisecond', 'second', 'minute', 'hour', 'day'.
 * @param amount The expression evaluates to amount of the unit.
 * @return A new {@code Expression} representing the resulting timestamp.
 */
export function timestampSub(
  timestamp: Expression,
  unit: Expression,
  amount: Expression
): FunctionExpr;

/**
 * Creates an expression that subtracts a specified amount of time from a timestamp.
 *
 * ```typescript
 * // Subtract 1 day from the 'timestamp' field.
 * timestampSub(field("timestamp"), "day", 1);
 * ```
 *
 * @param timestamp The expression representing the timestamp.
 * @param unit The unit of time to subtract (e.g., "day", "hour").
 * @param amount The amount of time to subtract.
 * @return A new {@code Expression} representing the resulting timestamp.
 */
export function timestampSub(
  timestamp: Expression,
  unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
  amount: number
): FunctionExpr;

/**
 * Creates an expression that subtracts a specified amount of time from a timestamp represented by a field.
 *
 * ```typescript
 * // Subtract 1 day from the 'timestamp' field.
 * timestampSub("timestamp", "day", 1);
 * ```
 *
 * @param fieldName The name of the field representing the timestamp.
 * @param unit The unit of time to subtract (e.g., "day", "hour").
 * @param amount The amount of time to subtract.
 * @return A new {@code Expression} representing the resulting timestamp.
 */
export function timestampSub(
  fieldName: string,
  unit: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day',
  amount: number
): FunctionExpr;
export function timestampSub(
  timestamp: Expression | string,
  unit:
    | Expression
    | 'microsecond'
    | 'millisecond'
    | 'second'
    | 'minute'
    | 'hour'
    | 'day',
  amount: Expression | number
): FunctionExpr {
  const normalizedTimestamp = fieldOrExpression(timestamp);
  const normalizedUnit = valueToDefaultExpr(unit);
  const normalizedAmount = valueToDefaultExpr(amount);
  return normalizedTimestamp.timestampSub(normalizedUnit, normalizedAmount);
}

/**
 * Creates an expression that performs a logical 'AND' operation on multiple filter conditions.
 *
 * ```typescript
 * // Check if the 'age' field is greater than 18 AND the 'city' field is "London" AND
 * // the 'status' field is "active"
 * const condition = and(greaterThan("age", 18), equal("city", "London"), equal("status", "active"));
 * ```
 *
 * @param first The first filter condition.
 * @param second The second filter condition.
 * @param more Additional filter conditions to 'AND' together.
 * @return A new {@code Expression} representing the logical 'AND' operation.
 */
export function and(
  first: BooleanExpression,
  second: BooleanExpression,
  ...more: BooleanExpression[]
): BooleanExpression {
  return new BooleanExpression('and', [first, second, ...more]);
}

/**
 * Creates an expression that performs a logical 'OR' operation on multiple filter conditions.
 *
 * ```typescript
 * // Check if the 'age' field is greater than 18 OR the 'city' field is "London" OR
 * // the 'status' field is "active"
 * const condition = or(greaterThan("age", 18), equal("city", "London"), equal("status", "active"));
 * ```
 *
 * @param first The first filter condition.
 * @param second The second filter condition.
 * @param more Additional filter conditions to 'OR' together.
 * @return A new {@code Expression} representing the logical 'OR' operation.
 */
export function or(
  first: BooleanExpression,
  second: BooleanExpression,
  ...more: BooleanExpression[]
): BooleanExpression {
  return new BooleanExpression('or', [first, second, ...more]);
}

/**
 * Creates an expression that returns the value of the base expression raised to the power of the exponent expression.
 *
 * ```typescript
 * // Raise the value of the 'base' field to the power of the 'exponent' field.
 * pow(field("base"), field("exponent"));
 * ```
 *
 * @param base The expression to raise to the power of the exponent.
 * @param exponent The expression to raise the base to the power of.
 * @return A new `Expression` representing the power operation.
 */
export function pow(base: Expression, exponent: Expression): FunctionExpr;

/**
 * Creates an expression that returns the value of the base expression raised to the power of the exponent.
 *
 * ```typescript
 * // Raise the value of the 'base' field to the power of 2.
 * pow(field("base"), 2);
 * ```
 *
 * @param base The expression to raise to the power of the exponent.
 * @param exponent The constant value to raise the base to the power of.
 * @return A new `Expression` representing the power operation.
 */
export function pow(base: Expression, exponent: number): FunctionExpr;

/**
 * Creates an expression that returns the value of the base field raised to the power of the exponent expression.
 *
 * ```typescript
 * // Raise the value of the 'base' field to the power of the 'exponent' field.
 * pow("base", field("exponent"));
 * ```
 *
 * @param base The name of the field to raise to the power of the exponent.
 * @param exponent The expression to raise the base to the power of.
 * @return A new `Expression` representing the power operation.
 */
export function pow(base: string, exponent: Expression): FunctionExpr;

/**
 * Creates an expression that returns the value of the base field raised to the power of the exponent.
 *
 * ```typescript
 * // Raise the value of the 'base' field to the power of 2.
 * pow("base", 2);
 * ```
 *
 * @param base The name of the field to raise to the power of the exponent.
 * @param exponent The constant value to raise the base to the power of.
 * @return A new `Expression` representing the power operation.
 */
export function pow(base: string, exponent: number): FunctionExpr;
export function pow(
  base: Expression | string,
  exponent: Expression | number
): FunctionExpr {
  return fieldOrExpression(base).pow(exponent as number);
}

/**
 * Creates an expression that rounds a numeric value to the nearest whole number.
 *
 * ```typescript
 * // Round the value of the 'price' field.
 * round("price");
 * ```
 *
 * @param fieldName The name of the field to round.
 * @return A new `Expression` representing the rounded value.
 */
export function round(fieldName: string): FunctionExpr;

/**
 * Creates an expression that rounds a numeric value to the nearest whole number.
 *
 * ```typescript
 * // Round the value of the 'price' field.
 * round(field("price"));
 * ```
 *
 * @param expression An expression evaluating to a numeric value, which will be rounded.
 * @return A new `Expression` representing the rounded value.
 */
export function round(expression: Expression): FunctionExpr;
export function round(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).round();
}

/**
 * Creates an expression that returns the collection ID from a path.
 *
 * ```typescript
 * // Get the collection ID from a path.
 * collectionId("__name__");
 * ```
 *
 * @param fieldName The name of the field to get the collection ID from.
 * @return A new {@code Expression} representing the collectionId operation.
 */
export function collectionId(fieldName: string): FunctionExpr;

/**
 * Creates an expression that returns the collection ID from a path.
 *
 * ```typescript
 * // Get the collection ID from a path.
 * collectionId(field("__name__"));
 * ```
 *
 * @param expression An expression evaluating to a path, which the collection ID will be extracted from.
 * @return A new {@code Expression} representing the collectionId operation.
 */
export function collectionId(expression: Expression): FunctionExpr;
export function collectionId(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).collectionId();
}

/**
 * Creates an expression that calculates the length of a string, array, map, vector, or bytes.
 *
 * ```typescript
 * // Get the length of the 'name' field.
 * length("name");
 *
 * // Get the number of items in the 'cart' array.
 * length("cart");
 * ```
 *
 * @param fieldName The name of the field to calculate the length of.
 * @return A new `Expression` representing the length of the string, array, map, vector, or bytes.
 */
export function length(fieldName: string): FunctionExpr;

/**
 * Creates an expression that calculates the length of a string, array, map, vector, or bytes.
 *
 * ```typescript
 * // Get the length of the 'name' field.
 * length(field("name"));
 *
 * // Get the number of items in the 'cart' array.
 * length(field("cart"));
 * ```
 *
 * @param expression An expression evaluating to a string, array, map, vector, or bytes, which the length will be calculated for.
 * @return A new `Expression` representing the length of the string, array, map, vector, or bytes.
 */
export function length(expression: Expression): FunctionExpr;
export function length(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).length();
}

/**
 * Creates an expression that computes the natural logarithm of a numeric value.
 *
 * ```typescript
 * // Compute the natural logarithm of the 'value' field.
 * ln("value");
 * ```
 *
 * @param fieldName The name of the field to compute the natural logarithm of.
 * @return A new `Expression` representing the natural logarithm of the numeric value.
 */
export function ln(fieldName: string): FunctionExpr;

/**
 * Creates an expression that computes the natural logarithm of a numeric value.
 *
 * ```typescript
 * // Compute the natural logarithm of the 'value' field.
 * ln(field("value"));
 * ```
 *
 * @param expression An expression evaluating to a numeric value, which the natural logarithm will be computed for.
 * @return A new `Expression` representing the natural logarithm of the numeric value.
 */
export function ln(expression: Expression): FunctionExpr;
export function ln(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).ln();
}

/**
 * Creates an expression that computes the logarithm of an expression to a given base.
 *
 * ```typescript
 * // Compute the logarithm of the 'value' field with base 10.
 * log(field("value"), 10);
 * ```
 *
 * @param expression An expression evaluating to a numeric value, which the logarithm will be computed for.
 * @param base The base of the logarithm.
 * @return A new {@code Expression} representing the logarithm of the numeric value.
 */
export function log(expression: Expression, base: number): FunctionExpr;
/**
 * Creates an expression that computes the logarithm of an expression to a given base.
 *
 * ```typescript
 * // Compute the logarithm of the 'value' field with the base in the 'base' field.
 * log(field("value"), field("base"));
 * ```
 *
 * @param expression An expression evaluating to a numeric value, which the logarithm will be computed for.
 * @param base The base of the logarithm.
 * @return A new {@code Expression} representing the logarithm of the numeric value.
 */
export function log(expression: Expression, base: Expression): FunctionExpr;
/**
 * Creates an expression that computes the logarithm of a field to a given base.
 *
 * ```typescript
 * // Compute the logarithm of the 'value' field with base 10.
 * log("value", 10);
 * ```
 *
 * @param fieldName The name of the field to compute the logarithm of.
 * @param base The base of the logarithm.
 * @return A new {@code Expression} representing the logarithm of the numeric value.
 */
export function log(fieldName: string, base: number): FunctionExpr;
/**
 * Creates an expression that computes the logarithm of a field to a given base.
 *
 * ```typescript
 * // Compute the logarithm of the 'value' field with the base in the 'base' field.
 * log("value", field("base"));
 * ```
 *
 * @param fieldName The name of the field to compute the logarithm of.
 * @param base The base of the logarithm.
 * @return A new {@code Expression} representing the logarithm of the numeric value.
 */
export function log(fieldName: string, base: Expression): FunctionExpr;
export function log(expr: Expression | string, base: number | Expression): FunctionExpr {
  return fieldOrExpression(expr).log(valueToDefaultExpr(base));
}

/**
 * Creates an expression that computes the square root of a numeric value.
 *
 * ```typescript
 * // Compute the square root of the 'value' field.
 * sqrt(field("value"));
 * ```
 *
 * @param expression An expression evaluating to a numeric value, which the square root will be computed for.
 * @return A new {@code Expression} representing the square root of the numeric value.
 */
export function sqrt(expression: Expression): FunctionExpr;
/**
 * Creates an expression that computes the square root of a numeric value.
 *
 * ```typescript
 * // Compute the square root of the 'value' field.
 * sqrt("value");
 * ```
 *
 * @param fieldName The name of the field to compute the square root of.
 * @return A new {@code Expression} representing the square root of the numeric value.
 */
export function sqrt(fieldName: string): FunctionExpr;
export function sqrt(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).sqrt();
}

/**
 * Creates an expression that reverses a string.
 *
 * ```typescript
 * // Reverse the value of the 'myString' field.
 * strReverse(field("myString"));
 * ```
 *
 * @param stringExpression An expression evaluating to a string value, which will be reversed.
 * @return A new {@code Expression} representing the reversed string.
 */
export function strReverse(stringExpression: Expression): FunctionExpr;

/**
 * Creates an expression that reverses a string value in the specified field.
 *
 * ```typescript
 * // Reverse the value of the 'myString' field.
 * strReverse("myString");
 * ```
 *
 * @param field The name of the field representing the string to reverse.
 * @return A new {@code Expression} representing the reversed string.
 */
export function strReverse(field: string): FunctionExpr;
export function strReverse(expr: Expression | string): FunctionExpr {
  return fieldOrExpression(expr).strReverse();
}

// TODO(new-expression): Add new top-level expression function definitions above this line

/**
 * Creates a {@link Field} instance representing the field at the given path.
 *
 * ```typescript
 * // Sort documents by the 'name' field in lowercase in ascending order
 * db.pipeline().collection("users")
 *   .sort(ascending(field("name").toLower()));
 * ```
 *
 * @param expr The expression to create an ascending ordering for.
 * @return A new `Ordering` for ascending sorting.
 */
export function ascending(expr: Expression): Ordering;

/**
 * Creates an {@link Ordering} that sorts documents in ascending order based on a field.
 *
 * ```typescript
 * // Sort documents by the 'name' field in ascending order
 * db.pipeline().collection("users")
 *   .sort(ascending("name"));
 * ```
 *
 * @param fieldName The field to create an ascending ordering for.
 * @return A new `Ordering` for ascending sorting.
 */
export function ascending(fieldName: string): Ordering;
export function ascending(field: Expression | string): Ordering {
  return new Ordering(fieldOrExpression(field), 'ascending');
}

/**
 * Creates an {@link Ordering} that sorts documents in descending order based on an expression.
 *
 * ```typescript
 * // Sort documents by the 'name' field in lowercase in descending order
 * db.pipeline().collection("users")
 *   .sort(descending(field("name").toLower()));
 * ```
 *
 * @param expr The expression to create a descending ordering for.
 * @return A new `Ordering` for descending sorting.
 */
export function descending(expr: Expression): Ordering;

/**
 * Creates an {@link Ordering} that sorts documents in descending order based on a field.
 *
 * ```typescript
 * // Sort documents by the 'name' field in descending order
 * db.pipeline().collection("users")
 *   .sort(descending("name"));
 * ```
 *
 * @param fieldName The field to create a descending ordering for.
 * @return A new `Ordering` for descending sorting.
 */
export function descending(fieldName: string): Ordering;
export function descending(field: Expression | string): Ordering {
  return new Ordering(fieldOrExpression(field), 'descending');
}

/**
 * Represents an ordering criterion for sorting documents in a Firestore pipeline.
 *
 * You create `Ordering` instances using the `ascending` and `descending` helper functions.
 */
export class Ordering implements HasUserData {
  constructor(
    readonly expr: Expression,
    readonly direction: 'ascending' | 'descending'
  ) {}

  /**
   * @internal
   * @private
   * Indicates if this expression was created from a literal value passed
   * by the caller.
   */
  _createdFromLiteral = false;

  /**
   * @private
   * @internal
   */
  _toProto(serializer: Serializer): api.IValue {
    const expr = this.expr as Expression;
    return {
      mapValue: {
        fields: {
          direction: serializer.encodeValue(this.direction),
          expression: expr._toProto(serializer),
        },
      },
    };
  }

  _protoValueType: 'ProtoValue' = 'ProtoValue' as const;

  /**
   * @private
   * @internal
   */
  _validateUserData(ignoreUndefinedProperties: boolean): void {
    (this.expr as Expression)._validateUserData(ignoreUndefinedProperties);
  }
}
