/*!
 * Copyright 2025 Google LLC
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

// We deliberately use `any` in the external API to not impose type-checking
// on end users.
/* eslint-disable @typescript-eslint/no-explicit-any */

// Declare a global (ambient) namespace
// (used when not using import statement, but just script include).

declare namespace FirebaseFirestore {
  export namespace Pipelines {
    /**
     * @beta
     *
     * An enumeration of the different types of expressions.
     */
    export type ExprType =
      | 'Field'
      | 'Constant'
      | 'Function'
      | 'AggregateFunction'
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
     *
     * The `Expr` class provides a fluent API for building expressions. You can chain together
     * method calls to create complex expressions.
     */
    export abstract class Expr {
      abstract readonly exprType: ExprType;

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
       * @return A new `Expr` representing the addition operation.
       */
      add(
        second: Expr | unknown,
        ...others: Array<Expr | unknown>
      ): FunctionExpr;

      /**
       * Creates an expression that subtracts another expression from this expression.
       *
       * ```typescript
       * // Subtract the 'discount' field from the 'price' field
       * field("price").subtract(field("discount"));
       * ```
       *
       * @param other The expression to subtract from this expression.
       * @return A new `Expr` representing the subtraction operation.
       */
      subtract(other: Expr): FunctionExpr;

      /**
       * Creates an expression that subtracts a constant value from this expression.
       *
       * ```typescript
       * // Subtract 20 from the value of the 'total' field
       * field("total").subtract(20);
       * ```
       *
       * @param other The constant value to subtract.
       * @return A new `Expr` representing the subtraction operation.
       */
      subtract(other: number): FunctionExpr;

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
       * @return A new `Expr` representing the multiplication operation.
       */
      multiply(
        second: Expr | number,
        ...others: Array<Expr | number>
      ): FunctionExpr;

      /**
       * Creates an expression that divides this expression by another expression.
       *
       * ```typescript
       * // Divide the 'total' field by the 'count' field
       * field("total").divide(field("count"));
       * ```
       *
       * @param other The expression to divide by.
       * @return A new `Expr` representing the division operation.
       */
      divide(other: Expr): FunctionExpr;

      /**
       * Creates an expression that divides this expression by a constant value.
       *
       * ```typescript
       * // Divide the 'value' field by 10
       * field("value").divide(10);
       * ```
       *
       * @param other The constant value to divide by.
       * @return A new `Expr` representing the division operation.
       */
      divide(other: number): FunctionExpr;
      divide(other: number | Expr): FunctionExpr;

      /**
       * Creates an expression that calculates the modulo (remainder) of dividing this expression by another expression.
       *
       * ```typescript
       * // Calculate the remainder of dividing the 'value' field by the 'divisor' field
       * field("value").mod(field("divisor"));
       * ```
       *
       * @param expression The expression to divide by.
       * @return A new `Expr` representing the modulo operation.
       */
      mod(expression: Expr): FunctionExpr;

      /**
       * Creates an expression that calculates the modulo (remainder) of dividing this expression by a constant value.
       *
       * ```typescript
       * // Calculate the remainder of dividing the 'value' field by 10
       * field("value").mod(10);
       * ```
       *
       * @param value The constant value to divide by.
       * @return A new `Expr` representing the modulo operation.
       */
      mod(value: number): FunctionExpr;

      /**
       * Creates an expression that checks if this expression is equal to another expression.
       *
       * ```typescript
       * // Check if the 'age' field is equal to 21
       * field("age").eq(21);
       * ```
       *
       * @param expression The expression to compare for equality.
       * @return A new `Expr` representing the equality comparison.
       */
      eq(expression: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is equal to a constant value.
       *
       * ```typescript
       * // Check if the 'city' field is equal to "London"
       * field("city").eq("London");
       * ```
       *
       * @param value The constant value to compare for equality.
       * @return A new `Expr` representing the equality comparison.
       */
      eq(value: unknown): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is not equal to another expression.
       *
       * ```typescript
       * // Check if the 'status' field is not equal to "completed"
       * field("status").neq("completed");
       * ```
       *
       * @param expression The expression to compare for inequality.
       * @return A new `Expr` representing the inequality comparison.
       */
      neq(expression: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is not equal to a constant value.
       *
       * ```typescript
       * // Check if the 'country' field is not equal to "USA"
       * field("country").neq("USA");
       * ```
       *
       * @param value The constant value to compare for inequality.
       * @return A new `Expr` representing the inequality comparison.
       */
      neq(value: unknown): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is less than another expression.
       *
       * ```typescript
       * // Check if the 'age' field is less than 'limit'
       * field("age").lt(field('limit'));
       * ```
       *
       * @param experession The expression to compare for less than.
       * @return A new `Expr` representing the less than comparison.
       */
      lt(experession: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is less than a constant value.
       *
       * ```typescript
       * // Check if the 'price' field is less than 50
       * field("price").lt(50);
       * ```
       *
       * @param value The constant value to compare for less than.
       * @return A new `Expr` representing the less than comparison.
       */
      lt(value: unknown): BooleanExpr;

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
       * @return A new `Expr` representing the less than or equal to comparison.
       */
      lte(expression: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is less than or equal to a constant value.
       *
       * ```typescript
       * // Check if the 'score' field is less than or equal to 70
       * field("score").lte(70);
       * ```
       *
       * @param value The constant value to compare for less than or equal to.
       * @return A new `Expr` representing the less than or equal to comparison.
       */
      lte(value: unknown): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is greater than another expression.
       *
       * ```typescript
       * // Check if the 'age' field is greater than the 'limit' field
       * field("age").gt(field("limit"));
       * ```
       *
       * @param expression The expression to compare for greater than.
       * @return A new `Expr` representing the greater than comparison.
       */
      gt(expression: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is greater than a constant value.
       *
       * ```typescript
       * // Check if the 'price' field is greater than 100
       * field("price").gt(100);
       * ```
       *
       * @param value The constant value to compare for greater than.
       * @return A new `Expr` representing the greater than comparison.
       */
      gt(value: unknown): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is greater than or equal to another
       * expression.
       *
       * ```typescript
       * // Check if the 'quantity' field is greater than or equal to field 'requirement' plus 1
       * field("quantity").gte(field('requirement').add(1));
       * ```
       *
       * @param expression The expression to compare for greater than or equal to.
       * @return A new `Expr` representing the greater than or equal to comparison.
       */
      gte(expression: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is greater than or equal to a constant
       * value.
       *
       * ```typescript
       * // Check if the 'score' field is greater than or equal to 80
       * field("score").gte(80);
       * ```
       *
       * @param value The constant value to compare for greater than or equal to.
       * @return A new `Expr` representing the greater than or equal to comparison.
       */
      gte(value: unknown): BooleanExpr;

      /**
       * Creates an expression that concatenates an array expression with one or more other arrays.
       *
       * ```typescript
       * // Combine the 'items' array with another array field.
       * field("items").arrayConcat(field("otherItems"));
       * ```
       * @param secondArray Second array expression or array literal to concatenate.
       * @param otherArrays Optional additional array expressions or array literals to concatenate.
       * @return A new `Expr` representing the concatenated array.
       */
      arrayConcat(
        secondArray: Expr | unknown[],
        ...otherArrays: Array<Expr | unknown[]>
      ): FunctionExpr;

      /**
       * Creates an expression that checks if an array contains a specific element.
       *
       * ```typescript
       * // Check if the 'sizes' array contains the value from the 'selectedSize' field
       * field("sizes").arrayContains(field("selectedSize"));
       * ```
       *
       * @param expression The element to search for in the array.
       * @return A new `Expr` representing the 'array_contains' comparison.
       */
      arrayContains(expression: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if an array contains a specific value.
       *
       * ```typescript
       * // Check if the 'colors' array contains "red"
       * field("colors").arrayContains("red");
       * ```
       *
       * @param value The element to search for in the array.
       * @return A new `Expr` representing the 'array_contains' comparison.
       */
      arrayContains(value: unknown): BooleanExpr;

      /**
       * Creates an expression that checks if an array contains all the specified elements.
       *
       * ```typescript
       * // Check if the 'tags' array contains both the value in field "tag1" and the literal value "tag2"
       * field("tags").arrayContainsAll([field("tag1"), "tag2"]);
       * ```
       *
       * @param values The elements to check for in the array.
       * @return A new `Expr` representing the 'array_contains_all' comparison.
       */
      arrayContainsAll(values: Array<Expr | unknown>): BooleanExpr;

      /**
       * Creates an expression that checks if an array contains all the specified elements.
       *
       * ```typescript
       * // Check if the 'tags' array contains both of the values from field "tag1" and the literal value "tag2"
       * field("tags").arrayContainsAll(array([field("tag1"), "tag2"]));
       * ```
       *
       * @param arrayExpression The elements to check for in the array.
       * @return A new `Expr` representing the 'array_contains_all' comparison.
       */
      arrayContainsAll(arrayExpression: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if an array contains any of the specified elements.
       *
       * ```typescript
       * // Check if the 'categories' array contains either values from field "cate1" or "cate2"
       * field("categories").arrayContainsAny([field("cate1"), field("cate2")]);
       * ```
       *
       * @param values The elements to check for in the array.
       * @return A new `Expr` representing the 'array_contains_any' comparison.
       */
      arrayContainsAny(values: Array<Expr | unknown>): BooleanExpr;

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
       * @return A new `Expr` representing the 'array_contains_any' comparison.
       */
      arrayContainsAny(arrayExpression: Expr): BooleanExpr;

      /**
       * Creates an expression that calculates the length of an array.
       *
       * ```typescript
       * // Get the number of items in the 'cart' array
       * field("cart").arrayLength();
       * ```
       *
       * @return A new `Expr` representing the length of the array.
       */
      arrayLength(): FunctionExpr;

      /**
       * Creates an expression that checks if this expression is equal to any of the provided values or
       * expressions.
       *
       * ```typescript
       * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
       * field("category").eqAny("Electronics", field("primaryType"));
       * ```
       *
       * @param values The values or expressions to check against.
       * @return A new `Expr` representing the 'IN' comparison.
       */
      eqAny(values: Array<Expr | unknown>): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is equal to any of the provided values or
       * expressions.
       *
       * ```typescript
       * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
       * field("category").eqAny(array(["Electronics", field("primaryType")]));
       * ```
       *
       * @param arrayExpression An expression that evaluates to an array of values to check against.
       * @return A new `Expr` representing the 'IN' comparison.
       */
      eqAny(arrayExpression: Expr): BooleanExpr;

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
       * @return A new `Expr` representing the 'NotEqAny' comparison.
       */
      notEqAny(values: Array<Expr | unknown>): BooleanExpr;

      /**
       * Creates an expression that checks if this expression is not equal to any of the values in the evaluated expression.
       *
       * ```typescript
       * // Check if the 'status' field is not equal to any value in the field 'rejectedStatuses'
       * field("status").notEqAny(field('rejectedStatuses'));
       * ```
       *
       * @param arrayExpression The values or expressions to check against.
       * @return A new `Expr` representing the 'NotEqAny' comparison.
       */
      notEqAny(arrayExpression: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if this expression evaluates to 'NaN' (Not a Number).
       *
       * ```typescript
       * // Check if the result of a calculation is NaN
       * field("value").divide(0).isNaN();
       * ```
       *
       * @return A new `Expr` representing the 'isNaN' check.
       */
      isNan(): BooleanExpr;

      /**
       * Creates an expression that checks if this expression evaluates to 'Null'.
       *
       * ```typescript
       * // Check if the result of a calculation is NaN
       * field("value").isNull();
       * ```
       *
       * @return A new `Expr` representing the 'isNull' check.
       */
      isNull(): BooleanExpr;

      /**
       * Creates an expression that checks if a field exists in the document.
       *
       * ```typescript
       * // Check if the document has a field named "phoneNumber"
       * field("phoneNumber").exists();
       * ```
       *
       * @return A new `Expr` representing the 'exists' check.
       */
      exists(): BooleanExpr;

      /**
       * Creates an expression that calculates the character length of a string in UTF-8.
       *
       * ```typescript
       * // Get the character length of the 'name' field in its UTF-8 form.
       * field("name").charLength();
       * ```
       *
       * @return A new `Expr` representing the length of the string.
       */
      charLength(): FunctionExpr;

      /**
       * Creates an expression that performs a case-sensitive string comparison.
       *
       * ```typescript
       * // Check if the 'title' field contains the word "guide" (case-sensitive)
       * field("title").like("%guide%");
       * ```
       *
       * @param pattern The pattern to search for. You can use "%" as a wildcard character.
       * @return A new `Expr` representing the 'like' comparison.
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
       * @return A new `Expr` representing the 'like' comparison.
       */
      like(pattern: Expr): FunctionExpr;

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
       * @return A new `Expr` representing the 'contains' comparison.
       */
      regexContains(pattern: string): BooleanExpr;

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
       * @return A new `Expr` representing the 'contains' comparison.
       */
      regexContains(pattern: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if a string matches a specified regular expression.
       *
       * ```typescript
       * // Check if the 'email' field matches a valid email pattern
       * field("email").regexMatch("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
       * ```
       *
       * @param pattern The regular expression to use for the match.
       * @return A new `Expr` representing the regular expression match.
       */
      regexMatch(pattern: string): BooleanExpr;

      /**
       * Creates an expression that checks if a string matches a specified regular expression.
       *
       * ```typescript
       * // Check if the 'email' field matches a regular expression stored in field 'regex'
       * field("email").regexMatch(field("regex"));
       * ```
       *
       * @param pattern The regular expression to use for the match.
       * @return A new `Expr` representing the regular expression match.
       */
      regexMatch(pattern: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if a string contains a specified substring.
       *
       * ```typescript
       * // Check if the 'description' field contains "example".
       * field("description").strContains("example");
       * ```
       *
       * @param substring The substring to search for.
       * @return A new `Expr` representing the 'contains' comparison.
       */
      strContains(substring: string): BooleanExpr;

      /**
       * Creates an expression that checks if a string contains the string represented by another expression.
       *
       * ```typescript
       * // Check if the 'description' field contains the value of the 'keyword' field.
       * field("description").strContains(field("keyword"));
       * ```
       *
       * @param expr The expression representing the substring to search for.
       * @return A new `Expr` representing the 'contains' comparison.
       */
      strContains(expr: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if a string starts with a given prefix.
       *
       * ```typescript
       * // Check if the 'name' field starts with "Mr."
       * field("name").startsWith("Mr.");
       * ```
       *
       * @param prefix The prefix to check for.
       * @return A new `Expr` representing the 'starts with' comparison.
       */
      startsWith(prefix: string): BooleanExpr;

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
       * @return A new `Expr` representing the 'starts with' comparison.
       */
      startsWith(prefix: Expr): BooleanExpr;

      /**
       * Creates an expression that checks if a string ends with a given postfix.
       *
       * ```typescript
       * // Check if the 'filename' field ends with ".txt"
       * field("filename").endsWith(".txt");
       * ```
       *
       * @param suffix The postfix to check for.
       * @return A new `Expr` representing the 'ends with' comparison.
       */
      endsWith(suffix: string): BooleanExpr;

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
       * @return A new `Expr` representing the 'ends with' comparison.
       */
      endsWith(suffix: Expr): BooleanExpr;

      /**
       * Creates an expression that converts a string to lowercase.
       *
       * ```typescript
       * // Convert the 'name' field to lowercase
       * field("name").toLower();
       * ```
       *
       * @return A new `Expr` representing the lowercase string.
       */
      toLower(): FunctionExpr;

      /**
       * Creates an expression that converts a string to uppercase.
       *
       * ```typescript
       * // Convert the 'title' field to uppercase
       * field("title").toUpper();
       * ```
       *
       * @return A new `Expr` representing the uppercase string.
       */
      toUpper(): FunctionExpr;

      /**
       * Creates an expression that removes leading and trailing whitespace from a string.
       *
       * ```typescript
       * // Trim whitespace from the 'userInput' field
       * field("userInput").trim();
       * ```
       *
       * @return A new `Expr` representing the trimmed string.
       */
      trim(): FunctionExpr;

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
       * @return A new `Expr` representing the concatenated string.
       */
      strConcat(
        secondString: Expr | string,
        ...otherStrings: Array<Expr | string>
      ): FunctionExpr;

      /**
       * Creates an expression that reverses this string expression.
       *
       * ```typescript
       * // Reverse the value of the 'myString' field.
       * field("myString").reverse();
       * ```
       *
       * @return A new {@code Expr} representing the reversed string.
       */
      reverse(): FunctionExpr;

      /**
       * Creates an expression that replaces the first occurrence of a substring within this string expression with another substring.
       *
       * ```typescript
       * // Replace the first occurrence of "hello" with "hi" in the 'message' field
       * field("message").replaceFirst("hello", "hi");
       * ```
       *
       * @param find The substring to search for.
       * @param replace The substring to replace the first occurrence of 'find' with.
       * @return A new {@code Expr} representing the string with the first occurrence replaced.
       */
      replaceFirst(find: string, replace: string): FunctionExpr;

      /**
       * Creates an expression that replaces the first occurrence of a substring within this string expression with another substring,
       * where the substring to find and the replacement substring are specified by expressions.
       *
       * ```typescript
       * // Replace the first occurrence of the value in 'findField' with the value in 'replaceField' in the 'message' field
       * field("message").replaceFirst(field("findField"), field("replaceField"));
       * ```
       *
       * @param find The expression representing the substring to search for.
       * @param replace The expression representing the substring to replace the first occurrence of 'find' with.
       * @return A new {@code Expr} representing the string with the first occurrence replaced.
       */
      replaceFirst(find: Expr, replace: Expr): FunctionExpr;

      /**
       * Creates an expression that replaces all occurrences of a substring within this string expression with another substring.
       *
       * ```typescript
       * // Replace all occurrences of "hello" with "hi" in the 'message' field
       * field("message").replaceAll("hello", "hi");
       * ```
       *
       * @param find The substring to search for.
       * @param replace The substring to replace all occurrences of 'find' with.
       * @return A new {@code Expr} representing the string with all occurrences replaced.
       */
      replaceAll(find: string, replace: string): FunctionExpr;

      /**
       * Creates an expression that replaces all occurrences of a substring within this string expression with another substring,
       * where the substring to find and the replacement substring are specified by expressions.
       *
       * ```typescript
       * // Replace all occurrences of the value in 'findField' with the value in 'replaceField' in the 'message' field
       * field("message").replaceAll(field("findField"), field("replaceField"));
       * ```
       *
       * @param find The expression representing the substring to search for.
       * @param replace The expression representing the substring to replace all occurrences of 'find' with.
       * @return A new {@code Expr} representing the string with all occurrences replaced.
       */
      replaceAll(find: Expr, replace: Expr): FunctionExpr;

      /**
       * Creates an expression that calculates the length of this string expression in bytes.
       *
       * ```typescript
       * // Calculate the length of the 'myString' field in bytes.
       * field("myString").byteLength();
       * ```
       *
       * @return A new {@code Expr} representing the length of the string in bytes.
       */
      byteLength(): FunctionExpr;

      /**
       * Accesses a value from a map (object) field using the provided key.
       *
       * ```typescript
       * // Get the 'city' value from the 'address' map field
       * field("address").mapGet("city");
       * ```
       *
       * @param subfield The key to access in the map.
       * @return A new `Expr` representing the value associated with the given key in the map.
       */
      mapGet(subfield: string): FunctionExpr;

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
      count(): AggregateFunction;

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
      sum(): AggregateFunction;

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
      avg(): AggregateFunction;

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
      minimum(): AggregateFunction;

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
      maximum(): AggregateFunction;

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
       * @return A new {@code Expr} representing the logical max operation.
       */
      logicalMaximum(
        second: Expr | unknown,
        ...others: Array<Expr | unknown>
      ): FunctionExpr;

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
       * @return A new {@code Expr} representing the logical min operation.
       */
      logicalMinimum(
        second: Expr | unknown,
        ...others: Array<Expr | unknown>
      ): FunctionExpr;

      /**
       * Creates an expression that calculates the length (number of dimensions) of this Firestore Vector expression.
       *
       * ```typescript
       * // Get the vector length (dimension) of the field 'embedding'.
       * field("embedding").vectorLength();
       * ```
       *
       * @return A new {@code Expr} representing the length of the vector.
       */
      vectorLength(): FunctionExpr;

      /**
       * Calculates the cosine distance between two vectors.
       *
       * ```typescript
       * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
       * field("userVector").cosineDistance(field("itemVector"));
       * ```
       *
       * @param vectorExpression The other vector (represented as an Expr) to compare against.
       * @return A new `Expr` representing the cosine distance between the two vectors.
       */
      cosineDistance(vectorExpression: Expr): FunctionExpr;
      /**
       * Calculates the Cosine distance between two vectors.
       *
       * ```typescript
       * // Calculate the Cosine distance between the 'location' field and a target location
       * field("location").cosineDistance(new VectorValue([37.7749, -122.4194]));
       * ```
       *
       * @param vector The other vector (as a VectorValue) to compare against.
       * @return A new `Expr` representing the Cosine* distance between the two vectors.
       */
      cosineDistance(vector: VectorValue | number[]): FunctionExpr;

      /**
       * Calculates the dot product between two vectors.
       *
       * ```typescript
       * // Calculate the dot product between a feature vector and a target vector
       * field("features").dotProduct([0.5, 0.8, 0.2]);
       * ```
       *
       * @param vectorExpression The other vector (as an array of numbers) to calculate with.
       * @return A new `Expr` representing the dot product between the two vectors.
       */
      dotProduct(vectorExpression: Expr): FunctionExpr;

      /**
       * Calculates the dot product between two vectors.
       *
       * ```typescript
       * // Calculate the dot product between a feature vector and a target vector
       * field("features").dotProduct(new VectorValue([0.5, 0.8, 0.2]));
       * ```
       *
       * @param vector The other vector (as an array of numbers) to calculate with.
       * @return A new `Expr` representing the dot product between the two vectors.
       */
      dotProduct(vector: VectorValue | number[]): FunctionExpr;

      /**
       * Calculates the Euclidean distance between two vectors.
       *
       * ```typescript
       * // Calculate the Euclidean distance between the 'location' field and a target location
       * field("location").euclideanDistance([37.7749, -122.4194]);
       * ```
       *
       * @param vectorExpression The other vector (as an array of numbers) to calculate with.
       * @return A new `Expr` representing the Euclidean distance between the two vectors.
       */
      euclideanDistance(vectorExpression: Expr): FunctionExpr;

      /**
       * Calculates the Euclidean distance between two vectors.
       *
       * ```typescript
       * // Calculate the Euclidean distance between the 'location' field and a target location
       * field("location").euclideanDistance(new VectorValue([37.7749, -122.4194]));
       * ```
       *
       * @param vector The other vector (as a VectorValue) to compare against.
       * @return A new `Expr` representing the Euclidean distance between the two vectors.
       */
      euclideanDistance(vector: VectorValue | number[]): FunctionExpr;

      /**
       * Creates an expression that interprets this expression as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
       * and returns a timestamp.
       *
       * ```typescript
       * // Interpret the 'microseconds' field as microseconds since epoch.
       * field("microseconds").unixMicrosToTimestamp();
       * ```
       *
       * @return A new {@code Expr} representing the timestamp.
       */
      unixMicrosToTimestamp(): FunctionExpr;

      /**
       * Creates an expression that converts this timestamp expression to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
       *
       * ```typescript
       * // Convert the 'timestamp' field to microseconds since epoch.
       * field("timestamp").timestampToUnixMicros();
       * ```
       *
       * @return A new {@code Expr} representing the number of microseconds since epoch.
       */
      timestampToUnixMicros(): FunctionExpr;

      /**
       * Creates an expression that interprets this expression as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
       * and returns a timestamp.
       *
       * ```typescript
       * // Interpret the 'milliseconds' field as milliseconds since epoch.
       * field("milliseconds").unixMillisToTimestamp();
       * ```
       *
       * @return A new {@code Expr} representing the timestamp.
       */
      unixMillisToTimestamp(): FunctionExpr;

      /**
       * Creates an expression that converts this timestamp expression to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
       *
       * ```typescript
       * // Convert the 'timestamp' field to milliseconds since epoch.
       * field("timestamp").timestampToUnixMillis();
       * ```
       *
       * @return A new {@code Expr} representing the number of milliseconds since epoch.
       */
      timestampToUnixMillis(): FunctionExpr;

      /**
       * Creates an expression that interprets this expression as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
       * and returns a timestamp.
       *
       * ```typescript
       * // Interpret the 'seconds' field as seconds since epoch.
       * field("seconds").unixSecondsToTimestamp();
       * ```
       *
       * @return A new {@code Expr} representing the timestamp.
       */
      unixSecondsToTimestamp(): FunctionExpr;

      /**
       * Creates an expression that converts this timestamp expression to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
       *
       * ```typescript
       * // Convert the 'timestamp' field to seconds since epoch.
       * field("timestamp").timestampToUnixSeconds();
       * ```
       *
       * @return A new {@code Expr} representing the number of seconds since epoch.
       */
      timestampToUnixSeconds(): FunctionExpr;

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
       * @return A new {@code Expr} representing the resulting timestamp.
       */
      timestampAdd(unit: Expr, amount: Expr): FunctionExpr;

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
       * @return A new {@code Expr} representing the resulting timestamp.
       */
      timestampAdd(
        unit:
          | 'microsecond'
          | 'millisecond'
          | 'second'
          | 'minute'
          | 'hour'
          | 'day',
        amount: number
      ): FunctionExpr;

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
       * @return A new {@code Expr} representing the resulting timestamp.
       */
      timestampSub(unit: Expr, amount: Expr): FunctionExpr;

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
       * @return A new {@code Expr} representing the resulting timestamp.
       */
      timestampSub(
        unit:
          | 'microsecond'
          | 'millisecond'
          | 'second'
          | 'minute'
          | 'hour'
          | 'day',
        amount: number
      ): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that applies a bitwise AND operation between this expression and a constant.
       *
       * ```typescript
       * // Calculate the bitwise AND of 'field1' and 0xFF.
       * field("field1").bitAnd(0xFF);
       * ```
       *
       * @param otherBits A constant representing bits.
       * @return A new {@code Expr} representing the bitwise AND operation.
       */
      bitAnd(otherBits: number | Buffer | Uint8Array): FunctionExpr;
      /**
       * @beta
       *
       * Creates an expression that applies a bitwise AND operation between two expressions.
       *
       * ```typescript
       * // Calculate the bitwise AND of 'field1' and 'field2'.
       * field("field1").bitAnd(field("field2"));
       * ```
       *
       * @param bitsExpression An expression that returns bits when evaluated.
       * @return A new {@code Expr} representing the bitwise AND operation.
       */
      bitAnd(bitsExpression: Expr): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that applies a bitwise OR operation between this expression and a constant.
       *
       * ```typescript
       * // Calculate the bitwise OR of 'field1' and 0xFF.
       * field("field1").bitOr(0xFF);
       * ```
       *
       * @param otherBits A constant representing bits.
       * @return A new {@code Expr} representing the bitwise OR operation.
       */
      bitOr(otherBits: number | Buffer | Uint8Array): FunctionExpr;
      /**
       * @beta
       *
       * Creates an expression that applies a bitwise OR operation between two expressions.
       *
       * ```typescript
       * // Calculate the bitwise OR of 'field1' and 'field2'.
       * field("field1").bitOr(field("field2"));
       * ```
       *
       * @param bitsExpression An expression that returns bits when evaluated.
       * @return A new {@code Expr} representing the bitwise OR operation.
       */
      bitOr(bitsExpression: Expr): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that applies a bitwise XOR operation between this expression and a constant.
       *
       * ```typescript
       * // Calculate the bitwise XOR of 'field1' and 0xFF.
       * field("field1").bitXor(0xFF);
       * ```
       *
       * @param otherBits A constant representing bits.
       * @return A new {@code Expr} representing the bitwise XOR operation.
       */
      bitXor(otherBits: number | Buffer | Uint8Array): FunctionExpr;
      /**
       * @beta
       *
       * Creates an expression that applies a bitwise XOR operation between two expressions.
       *
       * ```typescript
       * // Calculate the bitwise XOR of 'field1' and 'field2'.
       * field("field1").bitXor(field("field2"));
       * ```
       *
       * @param bitsExpression An expression that returns bits when evaluated.
       * @return A new {@code Expr} representing the bitwise XOR operation.
       */
      bitXor(bitsExpression: Expr): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that applies a bitwise NOT operation to this expression.
       *
       * ```typescript
       * // Calculate the bitwise NOT of 'field1'.
       * field("field1").bitNot();
       * ```
       *
       * @return A new {@code Expr} representing the bitwise NOT operation.
       */
      bitNot(): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that applies a bitwise left shift operation to this expression.
       *
       * ```typescript
       * // Calculate the bitwise left shift of 'field1' by 2 bits.
       * field("field1").bitLeftShift(2);
       * ```
       *
       * @param y The operand constant representing the number of bits to shift.
       * @return A new {@code Expr} representing the bitwise left shift operation.
       */
      bitLeftShift(y: number): FunctionExpr;
      /**
       * @beta
       *
       * Creates an expression that applies a bitwise left shift operation to this expression.
       *
       * ```typescript
       * // Calculate the bitwise left shift of 'field1' by 'field2' bits.
       * field("field1").bitLeftShift(field("field2"));
       * ```
       *
       * @param numberExpr The operand expression representing the number of bits to shift.
       * @return A new {@code Expr} representing the bitwise left shift operation.
       */
      bitLeftShift(numberExpr: Expr): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that applies a bitwise right shift operation to this expression.
       *
       * ```typescript
       * // Calculate the bitwise right shift of 'field1' by 2 bits.
       * field("field1").bitRightShift(2);
       * ```
       *
       * @param right The operand constant representing the number of bits to shift.
       * @return A new {@code Expr} representing the bitwise right shift operation.
       */
      bitRightShift(y: number): FunctionExpr;
      /**
       * @beta
       *
       * Creates an expression that applies a bitwise right shift operation to this expression.
       *
       * ```typescript
       * // Calculate the bitwise right shift of 'field1' by 'field2' bits.
       * field("field1").bitRightShift(field("field2"));
       * ```
       *
       * @param numberExpr The operand expression representing the number of bits to shift.
       * @return A new {@code Expr} representing the bitwise right shift operation.
       */
      bitRightShift(numberExpr: Expr): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that returns the document ID from a path.
       *
       * ```typescript
       * // Get the document ID from a path.
       * field("__path__").documentId();
       * ```
       *
       * @return A new {@code Expr} representing the documentId operation.
       */
      documentId(): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that returns a substring of the results of this expression.
       *
       * @param position Index of the first character of the substring.
       * @param length Length of the substring. If not provided, the substring will
       * end at the end of the input.
       */
      substr(position: number, length?: number): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that returns a substring of the results of this expression.
       *
       * @param position An expression returning the index of the first character of the substring.
       * @param length An expression returning the length of the substring. If not provided the
       * substring will end at the end of the input.
       */
      substr(position: Expr, length?: Expr): FunctionExpr;

      /**
       * @beta
       * Creates an expression that indexes into an array from the beginning or end
       * and returns the element. If the offset exceeds the array length, an error is
       * returned. A negative offset, starts from the end.
       *
       * ```typescript
       * // Return the value in the 'tags' field array at index `1`.
       * field('tags').arrayOffset(1);
       * ```
       *
       * @param offset The index of the element to return.
       * @return A new Expr representing the 'arrayOffset' operation.
       */
      arrayOffset(offset: number): FunctionExpr;

      /**
       * @beta
       * Creates an expression that indexes into an array from the beginning or end
       * and returns the element. If the offset exceeds the array length, an error is
       * returned. A negative offset, starts from the end.
       *
       * ```typescript
       * // Return the value in the tags field array at index specified by field
       * // 'favoriteTag'.
       * field('tags').arrayOffset(field('favoriteTag'));
       * ```
       *
       * @param offsetExpr An Expr evaluating to the index of the element to return.
       * @return A new Expr representing the 'arrayOffset' operation.
       */
      arrayOffset(offsetExpr: Expr): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that checks if a given expression produces an error.
       *
       * ```typescript
       * // Check if the result of a calculation is an error
       * field("title").arrayContains(1).isError();
       * ```
       *
       * @return A new {@code BooleanExpr} representing the 'isError' check.
       */
      isError(): BooleanExpr;

      /**
       * @beta
       *
       * Creates an expression that returns the result of the `catchExpr` argument
       * if there is an error, else return the result of this expression.
       *
       * ```typescript
       * // Returns the first item in the title field arrays, or returns
       * // the entire title field if the array is empty or the field is another type.
       * field("title").arrayOffset(0).ifError(field("title"));
       * ```
       *
       * @param catchExpr The catch expression that will be evaluated and
       * returned if this expression produces an error.
       * @return A new {@code Expr} representing the 'ifError' operation.
       */
      ifError(catchExpr: Expr): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that returns the `catch` argument if there is an
       * error, else return the result of this expression.
       *
       * ```typescript
       * // Returns the first item in the title field arrays, or returns
       * // "Default Title"
       * field("title").arrayOffset(0).ifError("Default Title");
       * ```
       *
       * @param catchValue The value that will be returned if this expression
       * produces an error.
       * @return A new {@code Expr} representing the 'ifError' operation.
       */
      ifError(catchValue: unknown): FunctionExpr;

      /**
       * @beta
       *
       * Creates an expression that returns `true` if the result of this expression
       * is absent. Otherwise, returns `false` even if the value is `null`.
       *
       * ```typescript
       * // Check if the field `value` is absent.
       * field("value").isAbsent();
       * ```
       *
       * @return A new {@code BooleanExpr} representing the 'isAbsent' check.
       */
      isAbsent(): BooleanExpr;

      /**
       * @beta
       *
       * Creates an expression that checks if tbe result of an expression is not null.
       *
       * ```typescript
       * // Check if the value of the 'name' field is not null
       * field("name").isNotNull();
       * ```
       *
       * @return A new {@code BooleanExpr} representing the 'isNotNull' check.
       */
      isNotNull(): BooleanExpr;

      /**
       * @beta
       *
       * Creates an expression that checks if the results of this expression is NOT 'NaN' (Not a Number).
       *
       * ```typescript
       * // Check if the result of a calculation is NOT NaN
       * field("value").divide(0).isNotNan();
       * ```
       *
       * @return A new {@code Expr} representing the 'isNaN' check.
       */
      isNotNan(): BooleanExpr;

      /**
       * @beta
       *
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
       * @beta
       *
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
      mapRemove(keyExpr: Expr): FunctionExpr;

      /**
       * @beta
       *
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
        secondMap: Record<string, unknown> | Expr,
        ...otherMaps: Array<Record<string, unknown> | Expr>
      ): FunctionExpr;

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
      ascending(): Ordering;

      /**
       * Creates an {@link Ordering} that sorts documents in descending order based on this expression.
       *
       * ```typescript
       * // Sort documents by the 'createdAt' field in descending order
       * pipeline().collection("users")
       *   .sort(field("createdAt").descending());
       * ```
       *
       * @return A new `Ordering` for descending sorting.
       */
      descending(): Ordering;

      /**
       * Assigns an alias to this expression.
       *
       * Aliases are useful for renaming fields in the output of a stage or for giving meaningful
       * names to calculated values.
       *
       * ```typescript
       * // Calculate the total price and assign it the alias "totalPrice" and add it to the output.
       * pipeline().collection("items")
       *   .addFields(field("price").multiply(field("quantity")).as("totalPrice"));
       * ```
       *
       * @param name The alias to assign to this expression.
       * @return A new {@link ExprWithAlias} that wraps this
       *     expression and associates it with the provided alias.
       */
      as(name: string): ExprWithAlias;
    }

    /**
     * @beta
     *
     * An interface that represents a selectable expression.
     */
    export interface Selectable {
      selectable: true;
      readonly alias: string;
      readonly expr: Expr;
    }

    /**
     * @beta
     *
     * A class that represents an aggregate function.
     */
    export class AggregateFunction {
      exprType: ExprType;
      constructor(name: string, params: Expr[]);

      /**
       * Assigns an alias to this AggregateFunction. The alias specifies the name that
       * the aggregated value will have in the output document.
       *
       * ```typescript
       * // Calculate the average price of all items and assign it the alias "averagePrice".
       * pipeline().collection("items")
       *   .aggregate(field("price").avg().as("averagePrice"));
       * ```
       *
       * @param name The alias to assign to this AggregateFunction.
       * @return A new {@link AggregateWithAlias} that wraps this
       *     AggregateFunction and associates it with the provided alias.
       */
      as(name: string): AggregateWithAlias;
    }

    /**
     * @beta
     *
     * An AggregateFunction with alias.
     */
    export class AggregateWithAlias {
      readonly aggregate: AggregateFunction;
      readonly alias: string;
    }

    /**
     * @beta
     */
    export class ExprWithAlias implements Selectable {
      exprType: ExprType;
      selectable: true;

      readonly expr: Expr;
      readonly alias: string;
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
     * const nameField = field("name");
     *
     * // Create a Field instance for a nested field 'address.city'
     * const cityField = field("address.city");
     * ```
     */
    export class Field extends Expr implements Selectable {
      readonly exprType: ExprType;
      selectable: true;

      fieldName(): string;

      get alias(): string;

      get expr(): Expr;
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
     * @param name The path to the field.
     * @return A new {@code Field} instance representing the specified field.
     */
    export function field(name: string): Field;
    export function field(path: FieldPath): Field;

    /**
     * @beta
     *
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
    export class Constant extends Expr {
      readonly exprType: ExprType;
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
    export function constant(value: GeoPoint): Constant;

    /**
     * Creates a `Constant` instance for a Timestamp value.
     *
     * @param value The Timestamp value.
     * @return A new `Constant` instance.
     */
    export function constant(value: Timestamp): Constant;

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
    export function constant(value: DocumentReference): Constant;

    /**
     * Creates a `Constant` instance for a VectorValue value.
     *
     * @param value The VectorValue value.
     * @return A new `Constant` instance.
     */
    export function constant(value: VectorValue): Constant;

    /**
     * Creates a `Constant` instance for a VectorValue value.
     *
     * ```typescript
     * // Create a Constant instance for a vector value
     * const vectorConstant = constantVector([1, 2, 3]);
     * ```
     *
     * @param value The VectorValue value.
     * @return A new `Constant` instance.
     */
    export function constantVector(value: number[] | VectorValue): Constant;

    /**
     * @beta
     *
     * This class defines the base class for Firestore {@link Pipeline} functions, which can be evaluated within pipeline
     * execution.
     *
     * Typically, you would not use this class or its children directly. Use either the functions like {@link and}, {@link eq},
     * or the methods on {@link Expr} ({@link Expr#eq}, {@link Expr#lt}, etc.) to construct new Function instances.
     */
    export class FunctionExpr extends Expr {
      readonly exprType: ExprType;

      constructor(name: string, params: Expr[]);
    }

    /**
     * @beta
     *
     * An interface that represents a filter condition.
     */
    export class BooleanExpr extends FunctionExpr {
      filterable: true;

      /**
       * Creates an aggregation that finds the count of input documents satisfying
       * this boolean expression.
       *
       * ```typescript
       * // Find the count of documents with a score greater than 90
       * field("score").gt(90).countIf().as("highestScore");
       * ```
       *
       * @return A new `AggregateFunction` representing the 'countIf' aggregation.
       */
      countIf(): AggregateFunction;

      /**
       * Creates an expression that negates this boolean expression.
       *
       * ```typescript
       * // Find documents where the 'tags' field does not contain 'completed'
       * field("tags").arrayContains("completed").not();
       * ```
       *
       * @return A new {@code Expr} representing the negated filter condition.
       */
      not(): BooleanExpr;
    }

    /**
     * @beta
     * Creates an aggregation that counts the number of stage inputs where the provided
     * boolean expression evaluates to true.
     *
     * ```typescript
     * // Count the number of documents where 'is_active' field equals true
     * countIf(field("is_active").eq(true)).as("numActiveDocuments");
     * ```
     *
     * @param booleanExpr - The boolean expression to evaluate on each input.
     * @returns A new `AggregateFunction` representing the 'countIf' aggregation.
     */
    export function countIf(booleanExpr: BooleanExpr): AggregateFunction;

    /**
     * @beta
     * Creates an expression that return a pseudo-random value of type double in the
     * range of [0, 1), inclusive of 0 and exclusive of 1.
     *
     * @returns A new `Expr` representing the 'rand' function.
     */
    export function rand(): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that applies a bitwise AND operation between a field and a constant.
     *
     * ```typescript
     * // Calculate the bitwise AND of 'field1' and 0xFF.
     * bitAnd("field1", 0xFF);
     * ```
     *
     * @param field The left operand field name.
     * @param otherBits A constant representing bits.
     * @return A new {@code Expr} representing the bitwise AND operation.
     */
    export function bitAnd(
      field: string,
      otherBits: number | Buffer | Uint8Array
    ): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise AND operation between a field and an expression.
     *
     * ```typescript
     * // Calculate the bitwise AND of 'field1' and 'field2'.
     * bitAnd("field1", field("field2"));
     * ```
     *
     * @param field The left operand field name.
     * @param bitsExpression An expression that returns bits when evaluated.
     * @return A new {@code Expr} representing the bitwise AND operation.
     */
    export function bitAnd(field: string, bitsExpression: Expr): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise AND operation between an expression and a constant.
     *
     * ```typescript
     * // Calculate the bitwise AND of 'field1' and 0xFF.
     * bitAnd(field("field1"), 0xFF);
     * ```
     *
     * @param bitsExpression An expression returning bits.
     * @param otherBits A constant representing bits.
     * @return A new {@code Expr} representing the bitwise AND operation.
     */
    export function bitAnd(
      bitsExpression: Expr,
      otherBits: number | Buffer | Uint8Array
    ): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise AND operation between two expressions.
     *
     * ```typescript
     * // Calculate the bitwise AND of 'field1' and 'field2'.
     * bitAnd(field("field1"), field("field2"));
     * ```
     *
     * @param bitsExpression An expression that returns bits when evaluated.
     * @param otherBitsExpression An expression that returns bits when evaluated.
     * @return A new {@code Expr} representing the bitwise AND operation.
     */
    export function bitAnd(
      bitsExpression: Expr,
      otherBitsExpression: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that applies a bitwise OR operation between a field and a constant.
     *
     * ```typescript
     * // Calculate the bitwise OR of 'field1' and 0xFF.
     * bitOr("field1", 0xFF);
     * ```
     *
     * @param field The left operand field name.
     * @param otherBits A constant representing bits.
     * @return A new {@code Expr} representing the bitwise OR operation.
     */
    export function bitOr(
      field: string,
      otherBits: number | Buffer | Uint8Array
    ): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise OR operation between a field and an expression.
     *
     * ```typescript
     * // Calculate the bitwise OR of 'field1' and 'field2'.
     * bitOr("field1", field("field2"));
     * ```
     *
     * @param field The left operand field name.
     * @param bitsExpression An expression that returns bits when evaluated.
     * @return A new {@code Expr} representing the bitwise OR operation.
     */
    export function bitOr(field: string, bitsExpression: Expr): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise OR operation between an expression and a constant.
     *
     * ```typescript
     * // Calculate the bitwise OR of 'field1' and 0xFF.
     * bitOr(field("field1"), 0xFF);
     * ```
     *
     * @param bitsExpression An expression returning bits.
     * @param otherBits A constant representing bits.
     * @return A new {@code Expr} representing the bitwise OR operation.
     */
    export function bitOr(
      bitsExpression: Expr,
      otherBits: number | Buffer | Uint8Array
    ): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise OR operation between two expressions.
     *
     * ```typescript
     * // Calculate the bitwise OR of 'field1' and 'field2'.
     * bitOr(field("field1"), field("field2"));
     * ```
     *
     * @param bitsExpression An expression that returns bits when evaluated.
     * @param otherBitsExpression An expression that returns bits when evaluated.
     * @return A new {@code Expr} representing the bitwise OR operation.
     */
    export function bitOr(
      bitsExpression: Expr,
      otherBitsExpression: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that applies a bitwise XOR operation between a field and a constant.
     *
     * ```typescript
     * // Calculate the bitwise XOR of 'field1' and 0xFF.
     * bitXor("field1", 0xFF);
     * ```
     *
     * @param field The left operand field name.
     * @param otherBits A constant representing bits.
     * @return A new {@code Expr} representing the bitwise XOR operation.
     */
    export function bitXor(
      field: string,
      otherBits: number | Buffer | Uint8Array
    ): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise XOR operation between a field and an expression.
     *
     * ```typescript
     * // Calculate the bitwise XOR of 'field1' and 'field2'.
     * bitXor("field1", field("field2"));
     * ```
     *
     * @param field The left operand field name.
     * @param bitsExpression An expression that returns bits when evaluated.
     * @return A new {@code Expr} representing the bitwise XOR operation.
     */
    export function bitXor(field: string, bitsExpression: Expr): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise XOR operation between an expression and a constant.
     *
     * ```typescript
     * // Calculate the bitwise XOR of 'field1' and 0xFF.
     * bitXor(field("field1"), 0xFF);
     * ```
     *
     * @param bitsExpression An expression returning bits.
     * @param otherBits A constant representing bits.
     * @return A new {@code Expr} representing the bitwise XOR operation.
     */
    export function bitXor(
      bitsExpression: Expr,
      otherBits: number | Buffer | Uint8Array
    ): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise XOR operation between two expressions.
     *
     * ```typescript
     * // Calculate the bitwise XOR of 'field1' and 'field2'.
     * bitXor(field("field1"), field("field2"));
     * ```
     *
     * @param bitsExpression An expression that returns bits when evaluated.
     * @param otherBitsExpression An expression that returns bits when evaluated.
     * @return A new {@code Expr} representing the bitwise XOR operation.
     */
    export function bitXor(
      bitsExpression: Expr,
      otherBitsExpression: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that applies a bitwise NOT operation to a field.
     *
     * ```typescript
     * // Calculate the bitwise NOT of 'field1'.
     * bitNot("field1");
     * ```
     *
     * @param field The operand field name.
     * @return A new {@code Expr} representing the bitwise NOT operation.
     */
    export function bitNot(field: string): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise NOT operation to an expression.
     *
     * ```typescript
     * // Calculate the bitwise NOT of 'field1'.
     * bitNot(field("field1"));
     * ```
     *
     * @param bitsValueExpression An expression that returns bits when evaluated.
     * @return A new {@code Expr} representing the bitwise NOT operation.
     */
    export function bitNot(bitsValueExpression: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that applies a bitwise left shift operation between a field and a constant.
     *
     * ```typescript
     * // Calculate the bitwise left shift of 'field1' by 2 bits.
     * bitLeftShift("field1", 2);
     * ```
     *
     * @param field The left operand field name.
     * @param y The right operand constant representing the number of bits to shift.
     * @return A new {@code Expr} representing the bitwise left shift operation.
     */
    export function bitLeftShift(field: string, y: number): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise left shift operation between a field and an expression.
     *
     * ```typescript
     * // Calculate the bitwise left shift of 'field1' by 'field2' bits.
     * bitLeftShift("field1", field("field2"));
     * ```
     *
     * @param field The left operand field name.
     * @param numberExpr The right operand expression representing the number of bits to shift.
     * @return A new {@code Expr} representing the bitwise left shift operation.
     */
    export function bitLeftShift(field: string, numberExpr: Expr): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise left shift operation between an expression and a constant.
     *
     * ```typescript
     * // Calculate the bitwise left shift of 'field1' by 2 bits.
     * bitLeftShift(field("field1"), 2);
     * ```
     *
     * @param xValue An expression returning bits.
     * @param y The right operand constant representing the number of bits to shift.
     * @return A new {@code Expr} representing the bitwise left shift operation.
     */
    export function bitLeftShift(xValue: Expr, y: number): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise left shift operation between two expressions.
     *
     * ```typescript
     * // Calculate the bitwise left shift of 'field1' by 'field2' bits.
     * bitLeftShift(field("field1"), field("field2"));
     * ```
     *
     * @param xValue An expression returning bits.
     * @param numberExpr The right operand expression representing the number of bits to shift.
     * @return A new {@code Expr} representing the bitwise left shift operation.
     */
    export function bitLeftShift(xValue: Expr, numberExpr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that applies a bitwise right shift operation between a field and a constant.
     *
     * ```typescript
     * // Calculate the bitwise right shift of 'field1' by 2 bits.
     * bitRightShift("field1", 2);
     * ```
     *
     * @param field The left operand field name.
     * @param y The right operand constant representing the number of bits to shift.
     * @return A new {@code Expr} representing the bitwise right shift operation.
     */
    export function bitRightShift(field: string, y: number): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise right shift operation between a field and an expression.
     *
     * ```typescript
     * // Calculate the bitwise right shift of 'field1' by 'field2' bits.
     * bitRightShift("field1", field("field2"));
     * ```
     *
     * @param field The left operand field name.
     * @param numberExpr The right operand expression representing the number of bits to shift.
     * @return A new {@code Expr} representing the bitwise right shift operation.
     */
    export function bitRightShift(
      field: string,
      numberExpr: Expr
    ): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise right shift operation between an expression and a constant.
     *
     * ```typescript
     * // Calculate the bitwise right shift of 'field1' by 2 bits.
     * bitRightShift(field("field1"), 2);
     * ```
     *
     * @param xValue An expression returning bits.
     * @param y The right operand constant representing the number of bits to shift.
     * @return A new {@code Expr} representing the bitwise right shift operation.
     */
    export function bitRightShift(xValue: Expr, y: number): FunctionExpr;
    /**
     * @beta
     *
     * Creates an expression that applies a bitwise right shift operation between two expressions.
     *
     * ```typescript
     * // Calculate the bitwise right shift of 'field1' by 'field2' bits.
     * bitRightShift(field("field1"), field("field2"));
     * ```
     *
     * @param xValue An expression returning bits.
     * @param right The right operand expression representing the number of bits to shift.
     * @return A new {@code Expr} representing the bitwise right shift operation.
     */
    export function bitRightShift(xValue: Expr, numberExpr: Expr): FunctionExpr;

    /**
     * @beta
     * Creates an expression that indexes into an array from the beginning or end
     * and return the element. If the offset exceeds the array length, an error is
     * returned. A negative offset, starts from the end.
     *
     * ```typescript
     * // Return the value in the tags field array at index 1.
     * arrayOffset('tags', 1);
     * ```
     *
     * @param arrayField The name of the array field.
     * @param offset The index of the element to return.
     * @return A new Expr representing the 'arrayOffset' operation.
     */
    export function arrayOffset(
      arrayField: string,
      offset: number
    ): FunctionExpr;

    /**
     * @beta
     * Creates an expression that indexes into an array from the beginning or end
     * and return the element. If the offset exceeds the array length, an error is
     * returned. A negative offset, starts from the end.
     *
     * ```typescript
     * // Return the value in the tags field array at index specified by field
     * // 'favoriteTag'.
     * arrayOffset('tags', field('favoriteTag'));
     * ```
     *
     * @param arrayField The name of the array field.
     * @param offsetExpr An Expr evaluating to the index of the element to return.
     * @return A new Expr representing the 'arrayOffset' operation.
     */
    export function arrayOffset(
      arrayField: string,
      offsetExpr: Expr
    ): FunctionExpr;

    /**
     * @beta
     * Creates an expression that indexes into an array from the beginning or end
     * and return the element. If the offset exceeds the array length, an error is
     * returned. A negative offset, starts from the end.
     *
     * ```typescript
     * // Return the value in the tags field array at index 1.
     * arrayOffset(field('tags'), 1);
     * ```
     *
     * @param arrayExpression An Expr evaluating to an array.
     * @param offset The index of the element to return.
     * @return A new Expr representing the 'arrayOffset' operation.
     */
    export function arrayOffset(
      arrayExpression: Expr,
      offset: number
    ): FunctionExpr;

    /**
     * @beta
     * Creates an expression that indexes into an array from the beginning or end
     * and return the element. If the offset exceeds the array length, an error is
     * returned. A negative offset, starts from the end.
     *
     * ```typescript
     * // Return the value in the tags field array at index specified by field
     * // 'favoriteTag'.
     * arrayOffset(field('tags'), field('favoriteTag'));
     * ```
     *
     * @param arrayExpression An Expr evaluating to an array.
     * @param offsetExpr An Expr evaluating to the index of the element to return.
     * @return A new Expr representing the 'arrayOffset' operation.
     */
    export function arrayOffset(
      arrayExpression: Expr,
      offsetExpr: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a given expression produces an error.
     *
     * ```typescript
     * // Check if the result of a calculation is an error
     * isError(field("title").arrayContains(1));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code Expr} representing the 'isError' check.
     */
    export function isError(value: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that returns the `catch` argument if there is an
     * error, else return the result of the `try` argument evaluation.
     *
     * ```typescript
     * // Returns the first item in the title field arrays, or returns
     * // the entire title field if the array is empty or the field is another type.
     * ifError(field("title").arrayOffset(0), field("title"));
     * ```
     *
     * @param tryExpr The try expression.
     * @param catchExpr The catch expression that will be evaluated and
     * returned if the tryExpr produces an error.
     * @return A new {@code Expr} representing the 'ifError' operation.
     */
    export function ifError(tryExpr: Expr, catchExpr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that returns the `catch` argument if there is an
     * error, else return the result of the `try` argument evaluation.
     *
     * ```typescript
     * // Returns the first item in the title field arrays, or returns
     * // "Default Title"
     * ifError(field("title").arrayOffset(0), "Default Title");
     * ```
     *
     * @param tryExpr The try expression.
     * @param catchValue The value that will be returned if the tryExpr produces an
     * error.
     * @return A new {@code Expr} representing the 'ifError' operation.
     */
    export function ifError(tryExpr: Expr, catchValue: unknown): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that returns `true` if a value is absent. Otherwise,
     * returns `false` even if the value is `null`.
     *
     * ```typescript
     * // Check if the field `value` is absent.
     * isAbsent(field("value"));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code Expr} representing the 'isAbsent' check.
     */
    export function isAbsent(value: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that returns `true` if a field is absent. Otherwise,
     * returns `false` even if the field value is `null`.
     *
     * ```typescript
     * // Check if the field `value` is absent.
     * isAbsent("value");
     * ```
     *
     * @param field The field to check.
     * @return A new {@code Expr} representing the 'isAbsent' check.
     */
    export function isAbsent(field: string): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression evaluates to 'NaN' (Not a Number).
     *
     * ```typescript
     * // Check if the result of a calculation is NaN
     * isNaN(field("value").divide(0));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code Expr} representing the 'isNaN' check.
     */
    export function isNull(value: Expr): BooleanExpr;

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
    export function isNull(value: string): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if tbe result of an expression is not null.
     *
     * ```typescript
     * // Check if the value of the 'name' field is not null
     * isNotNull(field("name"));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code Expr} representing the 'isNaN' check.
     */
    export function isNotNull(value: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if tbe value of a field is not null.
     *
     * ```typescript
     * // Check if the value of the 'name' field is not null
     * isNotNull("name");
     * ```
     *
     * @param value The name of the field to check.
     * @return A new {@code Expr} representing the 'isNaN' check.
     */
    export function isNotNull(value: string): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if the results of this expression is NOT 'NaN' (Not a Number).
     *
     * ```typescript
     * // Check if the result of a calculation is NOT NaN
     * isNotNaN(field("value").divide(0));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code Expr} representing the 'isNotNaN' check.
     */
    export function isNotNan(value: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if the results of this expression is NOT 'NaN' (Not a Number).
     *
     * ```typescript
     * // Check if the value of a field is NOT NaN
     * isNotNaN("value");
     * ```
     *
     * @param value The name of the field to check.
     * @return A new {@code Expr} representing the 'isNotNaN' check.
     */
    export function isNotNan(value: string): BooleanExpr;

    /**
     * @beta
     *
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
     * @beta
     *
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
    export function mapRemove(mapExpr: Expr, key: string): FunctionExpr;
    /**
     * @beta
     *
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
    export function mapRemove(mapField: string, keyExpr: Expr): FunctionExpr;
    /**
     * @beta
     *
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
    export function mapRemove(mapExpr: Expr, keyExpr: Expr): FunctionExpr;

    /**
     * @beta
     *
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
      secondMap: Record<string, unknown> | Expr,
      ...otherMaps: Array<Record<string, unknown> | Expr>
    ): FunctionExpr;

    /**
     * @beta
     *
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
      firstMap: Record<string, unknown> | Expr,
      secondMap: Record<string, unknown> | Expr,
      ...otherMaps: Array<Record<string, unknown> | Expr>
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that returns the document ID from a path.
     *
     * ```typescript
     * // Get the document ID from a path.
     * documentId(myDocumentReference);
     * ```
     *
     * @return A new {@code Expr} representing the documentId operation.
     */
    export function documentId(
      documentPath: string | DocumentReference
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that returns the document ID from a path.
     *
     * ```typescript
     * // Get the document ID from a path.
     * documentId(field("__path__"));
     * ```
     *
     * @return A new {@code Expr} representing the documentId operation.
     */
    export function documentId(documentPathExpr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that returns a substring of a string or byte array.
     *
     * @param field The name of a field containing a string or byte array to compute the substring from.
     * @param position Index of the first character of the substring.
     * @param length Length of the substring.
     */
    export function substr(
      field: string,
      position: number,
      length?: number
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that returns a substring of a string or byte array.
     *
     * @param input An expression returning a string or byte array to compute the substring from.
     * @param position Index of the first character of the substring.
     * @param length Length of the substring.
     */
    export function substr(
      input: Expr,
      position: number,
      length?: number
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that returns a substring of a string or byte array.
     *
     * @param field The name of a field containing a string or byte array to compute the substring from.
     * @param position An expression that returns the index of the first character of the substring.
     * @param length An expression that returns the length of the substring.
     */
    export function substr(
      field: string,
      position: Expr,
      length?: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that returns a substring of a string or byte array.
     *
     * @param input An expression returning a string or byte array to compute the substring from.
     * @param position An expression that returns the index of the first character of the substring.
     * @param length An expression that returns the length of the substring.
     */
    export function substr(
      input: Expr,
      position: Expr,
      length?: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that adds two expressions together.
     *
     * ```typescript
     * // Add the value of the 'quantity' field and the 'reserve' field.
     * add(field("quantity"), field("reserve"));
     * ```
     *
     * @param first The first expression to add.
     * @param second The second expression or literal to add.
     * @param others Optional other expressions or literals to add.
     * @return A new {@code Expr} representing the addition operation.
     */
    export function add(
      first: Expr,
      second: Expr | unknown,
      ...others: Array<Expr | unknown>
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that adds a field's value to an expression.
     *
     * ```typescript
     * // Add the value of the 'quantity' field and the 'reserve' field.
     * add("quantity", field("reserve"));
     * ```
     *
     * @param fieldName The name of the field containing the value to add.
     * @param second The second expression or literal to add.
     * @param others Optional other expressions or literals to add.
     * @return A new {@code Expr} representing the addition operation.
     */
    export function add(
      fieldName: string,
      second: Expr | unknown,
      ...others: Array<Expr | unknown>
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that subtracts two expressions.
     *
     * ```typescript
     * // Subtract the 'discount' field from the 'price' field
     * subtract(field("price"), field("discount"));
     * ```
     *
     * @param left The expression to subtract from.
     * @param right The expression to subtract.
     * @return A new {@code Expr} representing the subtraction operation.
     */
    export function subtract(left: Expr, right: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that subtracts a constant value from an expression.
     *
     * ```typescript
     * // Subtract the constant value 2 from the 'value' field
     * subtract(field("value"), 2);
     * ```
     *
     * @param expression The expression to subtract from.
     * @param value The constant value to subtract.
     * @return A new {@code Expr} representing the subtraction operation.
     */
    export function subtract(expression: Expr, value: unknown): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that subtracts an expression from a field's value.
     *
     * ```typescript
     * // Subtract the 'discount' field from the 'price' field
     * subtract("price", field("discount"));
     * ```
     *
     * @param fieldName The field name to subtract from.
     * @param expression The expression to subtract.
     * @return A new {@code Expr} representing the subtraction operation.
     */
    export function subtract(fieldName: string, expression: Expr): FunctionExpr;

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
     * @param fieldName The field name to subtract from.
     * @param value The constant value to subtract.
     * @return A new {@code Expr} representing the subtraction operation.
     */
    export function subtract(fieldName: string, value: unknown): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that multiplies two expressions together.
     *
     * ```typescript
     * // Multiply the 'quantity' field by the 'price' field
     * multiply(field("quantity"), field("price"));
     * ```
     *
     * @param first The first expression to multiply.
     * @param second The second expression or literal to multiply.
     * @param others Optional additional expressions or literals to multiply.
     * @return A new {@code Expr} representing the multiplication operation.
     */
    export function multiply(
      first: Expr,
      second: Expr | unknown,
      ...others: Array<Expr | unknown>
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that multiplies a field's value by an expression.
     *
     * ```typescript
     * // Multiply the 'quantity' field by the 'price' field
     * multiply("quantity", field("price"));
     * ```
     *
     * @param fieldName The name of the field containing the value to add.
     * @param second The second expression or literal to add.
     * @param others Optional other expressions or literals to add.
     * @return A new {@code Expr} representing the multiplication operation.
     */
    export function multiply(
      fieldName: string,
      second: Expr | unknown,
      ...others: Array<Expr | unknown>
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that divides two expressions.
     *
     * ```typescript
     * // Divide the 'total' field by the 'count' field
     * divide(field("total"), field("count"));
     * ```
     *
     * @param left The expression to be divided.
     * @param right The expression to divide by.
     * @return A new {@code Expr} representing the division operation.
     */
    export function divide(left: Expr, right: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that divides an expression by a constant value.
     *
     * ```typescript
     * // Divide the 'value' field by 10
     * divide(field("value"), 10);
     * ```
     *
     * @param expression The expression to be divided.
     * @param value The constant value to divide by.
     * @return A new {@code Expr} representing the division operation.
     */
    export function divide(expression: Expr, value: unknown): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that divides a field's value by an expression.
     *
     * ```typescript
     * // Divide the 'total' field by the 'count' field
     * divide("total", field("count"));
     * ```
     *
     * @param fieldName The field name to be divided.
     * @param expressions The expression to divide by.
     * @return A new {@code Expr} representing the division operation.
     */
    export function divide(fieldName: string, expressions: Expr): FunctionExpr;

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
     * @param fieldName The field name to be divided.
     * @param value The constant value to divide by.
     * @return A new {@code Expr} representing the division operation.
     */
    export function divide(fieldName: string, value: unknown): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the modulo (remainder) of dividing two expressions.
     *
     * ```typescript
     * // Calculate the remainder of dividing 'field1' by 'field2'.
     * mod(field("field1"), field("field2"));
     * ```
     *
     * @param left The dividend expression.
     * @param right The divisor expression.
     * @return A new {@code Expr} representing the modulo operation.
     */
    export function mod(left: Expr, right: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the modulo (remainder) of dividing an expression by a constant.
     *
     * ```typescript
     * // Calculate the remainder of dividing 'field1' by 5.
     * mod(field("field1"), 5);
     * ```
     *
     * @param expression The dividend expression.
     * @param value The divisor constant.
     * @return A new {@code Expr} representing the modulo operation.
     */
    export function mod(expression: Expr, value: unknown): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the modulo (remainder) of dividing a field's value by an expression.
     *
     * ```typescript
     * // Calculate the remainder of dividing 'field1' by 'field2'.
     * mod("field1", field("field2"));
     * ```
     *
     * @param fieldName The dividend field name.
     * @param expression The divisor expression.
     * @return A new {@code Expr} representing the modulo operation.
     */
    export function mod(fieldName: string, expression: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the modulo (remainder) of dividing a field's value by a constant.
     *
     * ```typescript
     * // Calculate the remainder of dividing 'field1' by 5.
     * mod("field1", 5);
     * ```
     *
     * @param fieldName The dividend field name.
     * @param value The divisor constant.
     * @return A new {@code Expr} representing the modulo operation.
     */
    export function mod(fieldName: string, value: unknown): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that creates a Firestore map value from an input object.
     *
     * ```typescript
     * // Create a map from the input object and reference the 'baz' field value from the input document.
     * map({foo: 'bar', baz: Field.of('baz')}).as('data');
     * ```
     *
     * @param elements The input map to evaluate in the expression.
     * @return A new {@code Expr} representing the map function.
     */
    export function map(elements: Record<string, unknown>): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that creates a Firestore array value from an input array.
     *
     * ```typescript
     * // Create an array value from the input array and reference the 'baz' field value from the input document.
     * array(['bar', Field.of('baz')]).as('foo');
     * ```
     *
     * @param elements The input array to evaluate in the expression.
     * @return A new {@code Expr} representing the array function.
     */
    export function array(elements: unknown[]): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if two expressions are equal.
     *
     * ```typescript
     * // Check if the 'age' field is equal to an expression
     * eq(field("age"), field("minAge").add(10));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expr` representing the equality comparison.
     */
    export function eq(left: Expr, right: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression is equal to a constant value.
     *
     * ```typescript
     * // Check if the 'age' field is equal to 21
     * eq(field("age"), 21);
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the equality comparison.
     */
    export function eq(expression: Expr, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value is equal to an expression.
     *
     * ```typescript
     * // Check if the 'age' field is equal to the 'limit' field
     * eq("age", field("limit"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param expression The expression to compare to.
     * @return A new `Expr` representing the equality comparison.
     */
    export function eq(fieldName: string, expression: Expr): BooleanExpr;

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
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the equality comparison.
     */
    export function eq(fieldName: string, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if two expressions are not equal.
     *
     * ```typescript
     * // Check if the 'status' field is not equal to field 'finalState'
     * neq(field("status"), field("finalState"));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expr` representing the inequality comparison.
     */
    export function neq(left: Expr, right: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression is not equal to a constant value.
     *
     * ```typescript
     * // Check if the 'status' field is not equal to "completed"
     * neq(field("status"), "completed");
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the inequality comparison.
     */
    export function neq(expression: Expr, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value is not equal to an expression.
     *
     * ```typescript
     * // Check if the 'status' field is not equal to the value of 'expectedStatus'
     * neq("status", field("expectedStatus"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param expression The expression to compare to.
     * @return A new `Expr` representing the inequality comparison.
     */
    export function neq(fieldName: string, expression: Expr): BooleanExpr;

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
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the inequality comparison.
     */
    export function neq(fieldName: string, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if the first expression is less than the second expression.
     *
     * ```typescript
     * // Check if the 'age' field is less than 30
     * lt(field("age"), field("limit"));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expr` representing the less than comparison.
     */
    export function lt(left: Expr, right: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression is less than a constant value.
     *
     * ```typescript
     * // Check if the 'age' field is less than 30
     * lt(field("age"), 30);
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the less than comparison.
     */
    export function lt(expression: Expr, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value is less than an expression.
     *
     * ```typescript
     * // Check if the 'age' field is less than the 'limit' field
     * lt("age", field("limit"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param expression The expression to compare to.
     * @return A new `Expr` representing the less than comparison.
     */
    export function lt(fieldName: string, expression: Expr): BooleanExpr;

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
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the less than comparison.
     */
    export function lt(fieldName: string, value: unknown): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new `Expr` representing the less than or equal to comparison.
     */
    export function lte(left: Expr, right: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression is less than or equal to a constant value.
     *
     * ```typescript
     * // Check if the 'quantity' field is less than or equal to 20
     * lte(field("quantity"), 20);
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the less than or equal to comparison.
     */
    export function lte(expression: Expr, value: unknown): BooleanExpr;

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
     * @return A new `Expr` representing the less than or equal to comparison.
     */
    export function lte(fieldName: string, expression: Expr): BooleanExpr;

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
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the less than or equal to comparison.
     */
    export function lte(fieldName: string, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if the first expression is greater than the second
     * expression.
     *
     * ```typescript
     * // Check if the 'age' field is greater than 18
     * gt(field("age"), Constant(9).add(9));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expr` representing the greater than comparison.
     */
    export function gt(left: Expr, right: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression is greater than a constant value.
     *
     * ```typescript
     * // Check if the 'age' field is greater than 18
     * gt(field("age"), 18);
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the greater than comparison.
     */
    export function gt(expression: Expr, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value is greater than an expression.
     *
     * ```typescript
     * // Check if the value of field 'age' is greater than the value of field 'limit'
     * gt("age", field("limit"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param expression The expression to compare to.
     * @return A new `Expr` representing the greater than comparison.
     */
    export function gt(fieldName: string, expression: Expr): BooleanExpr;

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
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the greater than comparison.
     */
    export function gt(fieldName: string, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if the first expression is greater than or equal to the
     * second expression.
     *
     * ```typescript
     * // Check if the 'quantity' field is greater than or equal to the field "threshold"
     * gte(field("quantity"), field("threshold"));
     * ```
     *
     * @param left The first expression to compare.
     * @param right The second expression to compare.
     * @return A new `Expr` representing the greater than or equal to comparison.
     */
    export function gte(left: Expr, right: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression is greater than or equal to a constant
     * value.
     *
     * ```typescript
     * // Check if the 'quantity' field is greater than or equal to 10
     * gte(field("quantity"), 10);
     * ```
     *
     * @param expression The expression to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the greater than or equal to comparison.
     */
    export function gte(expression: Expr, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value is greater than or equal to an expression.
     *
     * ```typescript
     * // Check if the value of field 'age' is greater than or equal to the value of field 'limit'
     * gte("age", field("limit"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param value The expression to compare to.
     * @return A new `Expr` representing the greater than or equal to comparison.
     */
    export function gte(fieldName: string, value: Expr): BooleanExpr;

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
     * @param fieldName The field name to compare.
     * @param value The constant value to compare to.
     * @return A new `Expr` representing the greater than or equal to comparison.
     */
    export function gte(fieldName: string, value: unknown): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that concatenates an array expression with other arrays.
     *
     * ```typescript
     * // Combine the 'items' array with two new item arrays
     * arrayConcat(field("items"), [field("newItems"), field("otherItems")]);
     * ```
     *
     * @param firstArray The first array expression to concatenate to.
     * @param secondArray The second array expression or array literal to concatenate to.
     * @param otherArrays Optional additional array expressions or array literals to concatenate.
     * @return A new {@code Expr} representing the concatenated array.
     */
    export function arrayConcat(
      firstArray: Expr,
      secondArray: Expr | unknown[],
      ...otherArrays: Array<Expr | unknown[]>
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that concatenates a field's array value with other arrays.
     *
     * ```typescript
     * // Combine the 'items' array with two new item arrays
     * arrayConcat("items", [field("newItems"), field("otherItems")]);
     * ```
     *
     * @param firstArrayField The first array to concatenate to.
     * @param secondArray The second array expression or array literal to concatenate to.
     * @param otherArrays Optional additional array expressions or array literals to concatenate.
     * @return A new {@code Expr} representing the concatenated array.
     */
    export function arrayConcat(
      firstArrayField: string,
      secondArray: Expr | unknown[],
      ...otherArrays: Array<Expr | unknown[]>
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an array expression contains a specific element.
     *
     * ```typescript
     * // Check if the 'colors' array contains the value of field 'selectedColor'
     * arrayContains(field("colors"), field("selectedColor"));
     * ```
     *
     * @param array The array expression to check.
     * @param element The element to search for in the array.
     * @return A new {@code Expr} representing the 'array_contains' comparison.
     */
    export function arrayContains(array: Expr, element: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an array expression contains a specific element.
     *
     * ```typescript
     * // Check if the 'colors' array contains "red"
     * arrayContains(field("colors"), "red");
     * ```
     *
     * @param array The array expression to check.
     * @param element The element to search for in the array.
     * @return A new {@code Expr} representing the 'array_contains' comparison.
     */
    export function arrayContains(array: Expr, element: unknown): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's array value contains a specific element.
     *
     * ```typescript
     * // Check if the 'colors' array contains the value of field 'selectedColor'
     * arrayContains("colors", field("selectedColor"));
     * ```
     *
     * @param fieldName The field name to check.
     * @param element The element to search for in the array.
     * @return A new {@code Expr} representing the 'array_contains' comparison.
     */
    export function arrayContains(
      fieldName: string,
      element: Expr
    ): FunctionExpr;

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
     * @param fieldName The field name to check.
     * @param element The element to search for in the array.
     * @return A new {@code Expr} representing the 'array_contains' comparison.
     */
    export function arrayContains(
      fieldName: string,
      element: unknown
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'array_contains_any' comparison.
     */
    export function arrayContainsAny(
      array: Expr,
      values: Array<Expr | unknown>
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'array_contains_any' comparison.
     */
    export function arrayContainsAny(
      fieldName: string,
      values: Array<Expr | unknown>
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'array_contains_any' comparison.
     */
    export function arrayContainsAny(array: Expr, values: Expr): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'array_contains_any' comparison.
     */
    export function arrayContainsAny(
      fieldName: string,
      values: Expr
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an array expression contains all the specified elements.
     *
     * ```typescript
     * // Check if the "tags" array contains all of the values: "SciFi", "Adventure", and the value from field "tag1"
     * arrayContainsAll(field("tags"), [field("tag1"), constant("SciFi"), "Adventure"]);
     * ```
     *
     * @param array The array expression to check.
     * @param values The elements to check for in the array.
     * @return A new {@code Expr} representing the 'array_contains_all' comparison.
     */
    export function arrayContainsAll(
      array: Expr,
      values: Array<Expr | unknown>
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'array_contains_all' comparison.
     */
    export function arrayContainsAll(
      fieldName: string,
      values: Array<Expr | unknown>
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an array expression contains all the specified elements.
     *
     * ```typescript
     * // Check if the "tags" array contains all of the values: "SciFi", "Adventure", and the value from field "tag1"
     * arrayContainsAll(field("tags"), [field("tag1"), constant("SciFi"), "Adventure"]);
     * ```
     *
     * @param array The array expression to check.
     * @param arrayExpression The elements to check for in the array.
     * @return A new {@code Expr} representing the 'array_contains_all' comparison.
     */
    export function arrayContainsAll(
      array: Expr,
      arrayExpression: Expr
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'array_contains_all' comparison.
     */
    export function arrayContainsAll(
      fieldName: string,
      arrayExpression: Expr
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the length of an array in a specified field.
     *
     * ```typescript
     * // Get the number of items in field 'cart'
     * arrayLength('cart');
     * ```
     *
     * @param fieldName The name of the field containing an array to calculate the length of.
     * @return A new {@code Expr} representing the length of the array.
     */
    export function arrayLength(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the length of an array expression.
     *
     * ```typescript
     * // Get the number of items in the 'cart' array
     * arrayLength(field("cart"));
     * ```
     *
     * @param array The array expression to calculate the length of.
     * @return A new {@code Expr} representing the length of the array.
     */
    export function arrayLength(array: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression, when evaluated, is equal to any of the provided values or
     * expressions.
     *
     * ```typescript
     * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
     * eqAny(field("category"), [constant("Electronics"), field("primaryType")]);
     * ```
     *
     * @param expression The expression whose results to compare.
     * @param values The values to check against.
     * @return A new {@code Expr} representing the 'IN' comparison.
     */
    export function eqAny(
      expression: Expr,
      values: Array<Expr | unknown>
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression is equal to any of the provided values.
     *
     * ```typescript
     * // Check if the 'category' field is set to a value in the disabledCategories field
     * eqAny(field("category"), field('disabledCategories'));
     * ```
     *
     * @param expression The expression whose results to compare.
     * @param arrayExpression An expression that evaluates to an array, whose elements to check for equality to the input.
     * @return A new {@code Expr} representing the 'IN' comparison.
     */
    export function eqAny(expression: Expr, arrayExpression: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value is equal to any of the provided values or
     * expressions.
     *
     * ```typescript
     * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
     * eqAny("category", [constant("Electronics"), field("primaryType")]);
     * ```
     *
     * @param fieldName The field to compare.
     * @param values The values to check against.
     * @return A new {@code Expr} representing the 'IN' comparison.
     */
    export function eqAny(
      fieldName: string,
      values: Array<Expr | unknown>
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value is equal to any of the provided values or
     * expressions.
     *
     * ```typescript
     * // Check if the 'category' field is either "Electronics" or value of field 'primaryType'
     * eqAny("category", ["Electronics", field("primaryType")]);
     * ```
     *
     * @param fieldName The field to compare.
     * @param arrayExpression An expression that evaluates to an array, whose elements to check for equality to the input field.
     * @return A new {@code Expr} representing the 'IN' comparison.
     */
    export function eqAny(
      fieldName: string,
      arrayExpression: Expr
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'NOT IN' comparison.
     */
    export function notEqAny(
      element: Expr,
      values: Array<Expr | unknown>
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'NOT IN' comparison.
     */
    export function notEqAny(
      fieldName: string,
      values: Array<Expr | unknown>
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'NOT IN' comparison.
     */
    export function notEqAny(element: Expr, arrayExpression: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value is not equal to any of the values in the evaluated expression.
     *
     * ```typescript
     * // Check if the 'status' field is not equal to any value in the field 'rejectedStatuses'
     * notEqAny("status", field("rejectedStatuses"));
     * ```
     *
     * @param fieldName The field name to compare.
     * @param arrayExpression The values to check against.
     * @return A new {@code Expr} representing the 'NOT IN' comparison.
     */
    export function notEqAny(
      fieldName: string,
      arrayExpression: Expr
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that performs a logical 'XOR' (exclusive OR) operation on multiple BooleanExpressions.
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
     * @param first The first condition.
     * @param second The second condition.
     * @param additionalConditions Additional conditions to 'XOR' together.
     * @return A new {@code Expr} representing the logical 'XOR' operation.
     */
    export function xor(
      first: BooleanExpr,
      second: BooleanExpr,
      ...additionalConditions: BooleanExpr[]
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates a conditional expression that evaluates to a 'then' expression if a condition is true
     * and an 'else' expression if the condition is false.
     *
     * ```typescript
     * // If 'age' is greater than 18, return "Adult"; otherwise, return "Minor".
     * cond(
     *     gt("age", 18), constant("Adult"), constant("Minor"));
     * ```
     *
     * @param condition The condition to evaluate.
     * @param thenExpr The expression to evaluate if the condition is true.
     * @param elseExpr The expression to evaluate if the condition is false.
     * @return A new {@code Expr} representing the conditional expression.
     */
    export function cond(
      condition: BooleanExpr,
      thenExpr: Expr,
      elseExpr: Expr
    ): FunctionExpr;

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
     * @param booleanExpr The filter condition to negate.
     * @return A new {@code Expr} representing the negated filter condition.
     */
    export function not(booleanExpr: BooleanExpr): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the logical max operation.
     */
    export function logicalMaximum(
      first: Expr,
      second: Expr | unknown,
      ...others: Array<Expr | unknown>
    ): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the logical max operation.
     */
    export function logicalMaximum(
      fieldName: string,
      second: Expr | unknown,
      ...others: Array<Expr | unknown>
    ): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the logical min operation.
     */
    export function logicalMinimum(
      first: Expr,
      second: Expr | unknown,
      ...others: Array<Expr | unknown>
    ): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the logical min operation.
     */
    export function logicalMinimum(
      fieldName: string,
      second: Expr | unknown,
      ...others: Array<Expr | unknown>
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field exists.
     *
     * ```typescript
     * // Check if the document has a field named "phoneNumber"
     * exists(field("phoneNumber"));
     * ```
     *
     * @param value An expression evaluates to the name of the field to check.
     * @return A new {@code Expr} representing the 'exists' check.
     */
    export function exists(value: Expr): BooleanExpr;

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
     * @param fieldName The field name to check.
     * @return A new {@code Expr} representing the 'exists' check.
     */
    export function exists(fieldName: string): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if an expression evaluates to 'NaN' (Not a Number).
     *
     * ```typescript
     * // Check if the result of a calculation is NaN
     * isNaN(field("value").divide(0));
     * ```
     *
     * @param value The expression to check.
     * @return A new {@code Expr} representing the 'isNaN' check.
     */
    export function isNan(value: Expr): BooleanExpr;

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
     * @param fieldName The name of the field to check.
     * @return A new {@code Expr} representing the 'isNaN' check.
     */
    export function isNan(fieldName: string): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that reverses a string.
     *
     * ```typescript
     * // Reverse the value of the 'myString' field.
     * reverse(field("myString"));
     * ```
     *
     * @param stringExpression An expression evaluating to a string value, which will be reversed.
     * @return A new {@code Expr} representing the reversed string.
     */
    export function reverse(stringExpression: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that reverses a string value in the specified field.
     *
     * ```typescript
     * // Reverse the value of the 'myString' field.
     * reverse("myString");
     * ```
     *
     * @param field The name of the field representing the string to reverse.
     * @return A new {@code Expr} representing the reversed string.
     */
    export function reverse(field: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that replaces the first occurrence of a substring within a string with another substring.
     *
     * ```typescript
     * // Replace the first occurrence of "hello" with "hi" in the 'message' field.
     * replaceFirst(field("message"), "hello", "hi");
     * ```
     *
     * @param value The expression representing the string to perform the replacement on.
     * @param find The substring to search for.
     * @param replace The substring to replace the first occurrence of 'find' with.
     * @return A new {@code Expr} representing the string with the first occurrence replaced.
     */
    export function replaceFirst(
      value: Expr,
      find: string,
      replace: string
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that replaces the first occurrence of a substring within a string with another substring,
     * where the substring to find and the replacement substring are specified by expressions.
     *
     * ```typescript
     * // Replace the first occurrence of the value in 'findField' with the value in 'replaceField' in the 'message' field.
     * replaceFirst(field("message"), field("findField"), field("replaceField"));
     * ```
     *
     * @param value The expression representing the string to perform the replacement on.
     * @param find The expression representing the substring to search for.
     * @param replace The expression representing the substring to replace the first occurrence of 'find' with.
     * @return A new {@code Expr} representing the string with the first occurrence replaced.
     */
    export function replaceFirst(
      value: Expr,
      find: Expr,
      replace: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that replaces the first occurrence of a substring within a string represented by a field with another substring.
     *
     * ```typescript
     * // Replace the first occurrence of "hello" with "hi" in the 'message' field.
     * replaceFirst("message", "hello", "hi");
     * ```
     *
     * @param fieldName The name of the field representing the string to perform the replacement on.
     * @param find The substring to search for.
     * @param replace The substring to replace the first occurrence of 'find' with.
     * @return A new {@code Expr} representing the string with the first occurrence replaced.
     */
    export function replaceFirst(
      fieldName: string,
      find: string,
      replace: string
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that replaces all occurrences of a substring within a string with another substring.
     *
     * ```typescript
     * // Replace all occurrences of "hello" with "hi" in the 'message' field.
     * replaceAll(field("message"), "hello", "hi");
     * ```
     *
     * @param value The expression representing the string to perform the replacement on.
     * @param find The substring to search for.
     * @param replace The substring to replace all occurrences of 'find' with.
     * @return A new {@code Expr} representing the string with all occurrences replaced.
     */
    export function replaceAll(
      value: Expr,
      find: string,
      replace: string
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that replaces all occurrences of a substring within a string with another substring,
     * where the substring to find and the replacement substring are specified by expressions.
     *
     * ```typescript
     * // Replace all occurrences of the value in 'findField' with the value in 'replaceField' in the 'message' field.
     * replaceAll(field("message"), field("findField"), field("replaceField"));
     * ```
     *
     * @param value The expression representing the string to perform the replacement on.
     * @param find The expression representing the substring to search for.
     * @param replace The expression representing the substring to replace all occurrences of 'find' with.
     * @return A new {@code Expr} representing the string with all occurrences replaced.
     */
    export function replaceAll(
      value: Expr,
      find: Expr,
      replace: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that replaces all occurrences of a substring within a string represented by a field with another substring.
     *
     * ```typescript
     * // Replace all occurrences of "hello" with "hi" in the 'message' field.
     * replaceAll("message", "hello", "hi");
     * ```
     *
     * @param fieldName The name of the field representing the string to perform the replacement on.
     * @param find The substring to search for.
     * @param replace The substring to replace all occurrences of 'find' with.
     * @return A new {@code Expr} representing the string with all occurrences replaced.
     */
    export function replaceAll(
      fieldName: string,
      find: string,
      replace: string
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the byte length of a string in UTF-8, or just the length of a Blob.
     *
     * ```typescript
     * // Calculate the length of the 'myString' field in bytes.
     * byteLength(field("myString"));
     * ```
     *
     * @param expr The expression representing the string.
     * @return A new {@code Expr} representing the length of the string in bytes.
     */
    export function byteLength(expr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the length of a string represented by a field in UTF-8 bytes, or just the length of a Blob.
     *
     * ```typescript
     * // Calculate the length of the 'myString' field in bytes.
     * byteLength("myString");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expr} representing the length of the string in bytes.
     */
    export function byteLength(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the character length of a string field in UTF8.
     *
     * ```typescript
     * // Get the character length of the 'name' field in UTF-8.
     * strLength("name");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expr} representing the length of the string.
     */
    export function charLength(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the character length of a string expression in UTF-8.
     *
     * ```typescript
     * // Get the character length of the 'name' field in UTF-8.
     * strLength(field("name"));
     * ```
     *
     * @param stringExpression The expression representing the string to calculate the length of.
     * @return A new {@code Expr} representing the length of the string.
     */
    export function charLength(stringExpression: Expr): FunctionExpr;

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
     * @param fieldName The name of the field containing the string.
     * @param pattern The pattern to search for. You can use "%" as a wildcard character.
     * @return A new {@code Expr} representing the 'like' comparison.
     */
    export function like(fieldName: string, pattern: string): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'like' comparison.
     */
    export function like(fieldName: string, pattern: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that performs a case-sensitive wildcard string comparison.
     *
     * ```typescript
     * // Check if the 'title' field contains the string "guide"
     * like(field("title"), "%guide%");
     * ```
     *
     * @param stringExpression The expression representing the string to perform the comparison on.
     * @param pattern The pattern to search for. You can use "%" as a wildcard character.
     * @return A new {@code Expr} representing the 'like' comparison.
     */
    export function like(stringExpression: Expr, pattern: string): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that performs a case-sensitive wildcard string comparison.
     *
     * ```typescript
     * // Check if the 'title' field contains the string "guide"
     * like(field("title"), field("pattern"));
     * ```
     *
     * @param stringExpression The expression representing the string to perform the comparison on.
     * @param pattern The pattern to search for. You can use "%" as a wildcard character.
     * @return A new {@code Expr} representing the 'like' comparison.
     */
    export function like(stringExpression: Expr, pattern: Expr): BooleanExpr;

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
     * @param fieldName The name of the field containing the string.
     * @param pattern The regular expression to use for the search.
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    export function regexContains(
      fieldName: string,
      pattern: string
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    export function regexContains(
      fieldName: string,
      pattern: Expr
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    export function regexContains(
      stringExpression: Expr,
      pattern: string
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    export function regexContains(
      stringExpression: Expr,
      pattern: Expr
    ): BooleanExpr;

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
     * @param fieldName The name of the field containing the string.
     * @param pattern The regular expression to use for the match.
     * @return A new {@code Expr} representing the regular expression match.
     */
    export function regexMatch(fieldName: string, pattern: string): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a string field matches a specified regular expression.
     *
     * ```typescript
     * // Check if the 'email' field matches a valid email pattern
     * regexMatch("email", field("pattern"));
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param pattern The regular expression to use for the match.
     * @return A new {@code Expr} representing the regular expression match.
     */
    export function regexMatch(fieldName: string, pattern: Expr): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the regular expression match.
     */
    export function regexMatch(
      stringExpression: Expr,
      pattern: string
    ): BooleanExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the regular expression match.
     */
    export function regexMatch(
      stringExpression: Expr,
      pattern: Expr
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a string field contains a specified substring.
     *
     * ```typescript
     * // Check if the 'description' field contains "example".
     * strContains("description", "example");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param substring The substring to search for.
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    export function strContains(
      fieldName: string,
      substring: string
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a string field contains a substring specified by an expression.
     *
     * ```typescript
     * // Check if the 'description' field contains the value of the 'keyword' field.
     * strContains("description", field("keyword"));
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @param substring The expression representing the substring to search for.
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    export function strContains(
      fieldName: string,
      substring: Expr
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a string expression contains a specified substring.
     *
     * ```typescript
     * // Check if the 'description' field contains "example".
     * strContains(field("description"), "example");
     * ```
     *
     * @param stringExpression The expression representing the string to perform the comparison on.
     * @param substring The substring to search for.
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    export function strContains(
      stringExpression: Expr,
      substring: string
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a string expression contains a substring specified by another expression.
     *
     * ```typescript
     * // Check if the 'description' field contains the value of the 'keyword' field.
     * strContains(field("description"), field("keyword"));
     * ```
     *
     * @param stringExpression The expression representing the string to perform the comparison on.
     * @param substring The expression representing the substring to search for.
     * @return A new {@code Expr} representing the 'contains' comparison.
     */
    export function strContains(
      stringExpression: Expr,
      substring: Expr
    ): BooleanExpr;

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
     * @param fieldName The field name to check.
     * @param prefix The prefix to check for.
     * @return A new {@code Expr} representing the 'starts with' comparison.
     */
    export function startsWith(fieldName: string, prefix: string): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value starts with a given prefix.
     *
     * ```typescript
     * // Check if the 'fullName' field starts with the value of the 'firstName' field
     * startsWith("fullName", field("firstName"));
     * ```
     *
     * @param fieldName The field name to check.
     * @param prefix The expression representing the prefix.
     * @return A new {@code Expr} representing the 'starts with' comparison.
     */
    export function startsWith(fieldName: string, prefix: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a string expression starts with a given prefix.
     *
     * ```typescript
     * // Check if the result of concatenating 'firstName' and 'lastName' fields starts with "Mr."
     * startsWith(field("fullName"), "Mr.");
     * ```
     *
     * @param stringExpression The expression to check.
     * @param prefix The prefix to check for.
     * @return A new {@code Expr} representing the 'starts with' comparison.
     */
    export function startsWith(
      stringExpression: Expr,
      prefix: string
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a string expression starts with a given prefix.
     *
     * ```typescript
     * // Check if the result of concatenating 'firstName' and 'lastName' fields starts with "Mr."
     * startsWith(field("fullName"), field("prefix"));
     * ```
     *
     * @param stringExpression The expression to check.
     * @param prefix The prefix to check for.
     * @return A new {@code Expr} representing the 'starts with' comparison.
     */
    export function startsWith(
      stringExpression: Expr,
      prefix: Expr
    ): BooleanExpr;

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
     * @param fieldName The field name to check.
     * @param suffix The postfix to check for.
     * @return A new {@code Expr} representing the 'ends with' comparison.
     */
    export function endsWith(fieldName: string, suffix: string): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a field's value ends with a given postfix.
     *
     * ```typescript
     * // Check if the 'url' field ends with the value of the 'extension' field
     * endsWith("url", field("extension"));
     * ```
     *
     * @param fieldName The field name to check.
     * @param suffix The expression representing the postfix.
     * @return A new {@code Expr} representing the 'ends with' comparison.
     */
    export function endsWith(fieldName: string, suffix: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a string expression ends with a given postfix.
     *
     * ```typescript
     * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
     * endsWith(field("fullName"), "Jr.");
     * ```
     *
     * @param stringExpression The expression to check.
     * @param suffix The postfix to check for.
     * @return A new {@code Expr} representing the 'ends with' comparison.
     */
    export function endsWith(
      stringExpression: Expr,
      suffix: string
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that checks if a string expression ends with a given postfix.
     *
     * ```typescript
     * // Check if the result of concatenating 'firstName' and 'lastName' fields ends with "Jr."
     * endsWith(field("fullName"), constant("Jr."));
     * ```
     *
     * @param stringExpression The expression to check.
     * @param suffix The postfix to check for.
     * @return A new {@code Expr} representing the 'ends with' comparison.
     */
    export function endsWith(stringExpression: Expr, suffix: Expr): BooleanExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a string field to lowercase.
     *
     * ```typescript
     * // Convert the 'name' field to lowercase
     * toLower("name");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expr} representing the lowercase string.
     */
    export function toLower(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a string expression to lowercase.
     *
     * ```typescript
     * // Convert the 'name' field to lowercase
     * toLower(field("name"));
     * ```
     *
     * @param stringExpression The expression representing the string to convert to lowercase.
     * @return A new {@code Expr} representing the lowercase string.
     */
    export function toLower(stringExpression: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a string field to uppercase.
     *
     * ```typescript
     * // Convert the 'title' field to uppercase
     * toUpper("title");
     * ```
     *
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expr} representing the uppercase string.
     */
    export function toUpper(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a string expression to uppercase.
     *
     * ```typescript
     * // Convert the 'title' field to uppercase
     * toUppercase(field("title"));
     * ```
     *
     * @param stringExpression The expression representing the string to convert to uppercase.
     * @return A new {@code Expr} representing the uppercase string.
     */
    export function toUpper(stringExpression: Expr): FunctionExpr;

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
     * @param fieldName The name of the field containing the string.
     * @return A new {@code Expr} representing the trimmed string.
     */
    export function trim(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that removes leading and trailing whitespace from a string expression.
     *
     * ```typescript
     * // Trim whitespace from the 'userInput' field
     * trim(field("userInput"));
     * ```
     *
     * @param stringExpression The expression representing the string to trim.
     * @return A new {@code Expr} representing the trimmed string.
     */
    export function trim(stringExpression: Expr): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the concatenated string.
     */
    export function strConcat(
      fieldName: string,
      secondString: Expr | string,
      ...otherStrings: Array<Expr | string>
    ): FunctionExpr;

    /**
     * @beta
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
     * @return A new {@code Expr} representing the concatenated string.
     */
    export function strConcat(
      firstString: Expr,
      secondString: Expr | string,
      ...otherStrings: Array<Expr | string>
    ): FunctionExpr;

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
     * @param fieldName The field name of the map field.
     * @param subField The key to access in the map.
     * @return A new {@code Expr} representing the value associated with the given key in the map.
     */
    export function mapGet(fieldName: string, subField: string): FunctionExpr;

    /**
     * @beta
     *
     * Accesses a value from a map (object) expression using the provided key.
     *
     * ```typescript
     * // Get the 'city' value from the 'address' map field
     * mapGet(field("address"), "city");
     * ```
     *
     * @param mapExpression The expression representing the map.
     * @param subField The key to access in the map.
     * @return A new {@code Expr} representing the value associated with the given key in the map.
     */
    export function mapGet(mapExpression: Expr, subField: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an aggregation that counts the total number of stage inputs.
     *
     * ```typescript
     * // Count the total number of input documents
     * countAll().as("totalDocument");
     * ```
     *
     * @return A new {@code AggregateFunction} representing the 'countAll' aggregation.
     */
    export function countAll(): AggregateFunction;

    /**
     * @beta
     *
     * Creates an aggregation that counts the number of stage inputs with valid evaluations of the
     * provided expression.
     *
     * ```typescript
     * // Count the number of items where the price is greater than 10
     * count(field("price").gt(10)).as("expensiveItemCount");
     * ```
     *
     * @param expression The expression to count.
     * @return A new {@code AggregateFunction} representing the 'count' aggregation.
     */
    export function count(expression: Expr): AggregateFunction;

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

    /**
     * @beta
     *
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
    export function sum(expression: Expr): AggregateFunction;

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
     * @param fieldName The name of the field containing numeric values to sum up.
     * @return A new {@code AggregateFunction} representing the 'sum' aggregation.
     */
    export function sum(fieldName: string): AggregateFunction;

    /**
     * @beta
     *
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
    export function avg(expression: Expr): AggregateFunction;

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
     * @param fieldName The name of the field containing numeric values to average.
     * @return A new {@code AggregateFunction} representing the 'avg' aggregation.
     */
    export function avg(fieldName: string): AggregateFunction;

    /**
     * @beta
     *
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
    export function minimum(expression: Expr): AggregateFunction;

    /**
     * @beta
     *
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

    /**
     * @beta
     *
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
    export function maximum(expression: Expr): AggregateFunction;

    /**
     * @beta
     *
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

    /**
     * @beta
     *
     * Calculates the Cosine distance between a field's vector value and a literal vector value.
     *
     * ```typescript
     * // Calculate the Cosine distance between the 'location' field and a target location
     * cosineDistance("location", [37.7749, -122.4194]);
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vector The other vector (as an array of doubles) or {@link VectorValue} to compare against.
     * @return A new {@code Expr} representing the Cosine distance between the two vectors.
     */
    export function cosineDistance(
      fieldName: string,
      vector: number[] | VectorValue
    ): FunctionExpr;

    /**
     * @beta
     *
     * Calculates the Cosine distance between a field's vector value and a vector expression.
     *
     * ```typescript
     * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
     * cosineDistance("userVector", field("itemVector"));
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vectorExpression The other vector (represented as an Expr) to compare against.
     * @return A new {@code Expr} representing the cosine distance between the two vectors.
     */
    export function cosineDistance(
      fieldName: string,
      vectorExpression: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Calculates the Cosine distance between a vector expression and a vector literal.
     *
     * ```typescript
     * // Calculate the cosine distance between the 'location' field and a target location
     * cosineDistance(field("location"), [37.7749, -122.4194]);
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expr) to compare against.
     * @param vector The other vector (as an array of doubles or VectorValue) to compare against.
     * @return A new {@code Expr} representing the cosine distance between the two vectors.
     */
    export function cosineDistance(
      vectorExpression: Expr,
      vector: number[] | Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Calculates the Cosine distance between two vector expressions.
     *
     * ```typescript
     * // Calculate the cosine distance between the 'userVector' field and the 'itemVector' field
     * cosineDistance(field("userVector"), field("itemVector"));
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expr) to compare against.
     * @param otherVectorExpression The other vector (represented as an Expr) to compare against.
     * @return A new {@code Expr} representing the cosine distance between the two vectors.
     */
    export function cosineDistance(
      vectorExpression: Expr,
      otherVectorExpression: Expr
    ): FunctionExpr;

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
     * @param fieldName The name of the field containing the first vector.
     * @param vector The other vector (as an array of doubles or VectorValue) to calculate with.
     * @return A new {@code Expr} representing the dot product between the two vectors.
     */
    export function dotProduct(
      fieldName: string,
      vector: number[] | VectorValue
    ): FunctionExpr;

    /**
     * @beta
     *
     * Calculates the dot product between a field's vector value and a vector expression.
     *
     * ```typescript
     * // Calculate the dot product distance between two document vectors: 'docVector1' and 'docVector2'
     * dotProduct("docVector1", field("docVector2"));
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vectorExpression The other vector (represented as an Expr) to calculate with.
     * @return A new {@code Expr} representing the dot product between the two vectors.
     */
    export function dotProduct(
      fieldName: string,
      vectorExpression: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Calculates the dot product between a vector expression and a double array.
     *
     * ```typescript
     * // Calculate the dot product between a feature vector and a target vector
     * dotProduct(field("features"), [0.5, 0.8, 0.2]);
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expr) to calculate with.
     * @param vector The other vector (as an array of doubles or VectorValue) to calculate with.
     * @return A new {@code Expr} representing the dot product between the two vectors.
     */
    export function dotProduct(
      vectorExpression: Expr,
      vector: number[] | VectorValue
    ): FunctionExpr;

    /**
     * @beta
     *
     * Calculates the dot product between two vector expressions.
     *
     * ```typescript
     * // Calculate the dot product between two document vectors: 'docVector1' and 'docVector2'
     * dotProduct(field("docVector1"), field("docVector2"));
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expr) to calculate with.
     * @param otherVectorExpression The other vector (represented as an Expr) to calculate with.
     * @return A new {@code Expr} representing the dot product between the two vectors.
     */
    export function dotProduct(
      vectorExpression: Expr,
      otherVectorExpression: Expr
    ): FunctionExpr;

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
     * @param fieldName The name of the field containing the first vector.
     * @param vector The other vector (as an array of doubles or VectorValue) to compare against.
     * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
     */
    export function euclideanDistance(
      fieldName: string,
      vector: number[] | VectorValue
    ): FunctionExpr;

    /**
     * @beta
     *
     * Calculates the Euclidean distance between a field's vector value and a vector expression.
     *
     * ```typescript
     * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
     * euclideanDistance("pointA", field("pointB"));
     * ```
     *
     * @param fieldName The name of the field containing the first vector.
     * @param vectorExpression The other vector (represented as an Expr) to compare against.
     * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
     */
    export function euclideanDistance(
      fieldName: string,
      vectorExpression: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Calculates the Euclidean distance between a vector expression and a double array.
     *
     * ```typescript
     * // Calculate the Euclidean distance between the 'location' field and a target location
     *
     * euclideanDistance(field("location"), [37.7749, -122.4194]);
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expr) to compare against.
     * @param vector The other vector (as an array of doubles or VectorValue) to compare against.
     * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
     */
    export function euclideanDistance(
      vectorExpression: Expr,
      vector: number[] | VectorValue
    ): FunctionExpr;

    /**
     * @beta
     *
     * Calculates the Euclidean distance between two vector expressions.
     *
     * ```typescript
     * // Calculate the Euclidean distance between two vector fields: 'pointA' and 'pointB'
     * euclideanDistance(field("pointA"), field("pointB"));
     * ```
     *
     * @param vectorExpression The first vector (represented as an Expr) to compare against.
     * @param otherVectorExpression The other vector (represented as an Expr) to compare against.
     * @return A new {@code Expr} representing the Euclidean distance between the two vectors.
     */
    export function euclideanDistance(
      vectorExpression: Expr,
      otherVectorExpression: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the length of a Firestore Vector.
     *
     * ```typescript
     * // Get the vector length (dimension) of the field 'embedding'.
     * vectorLength(field("embedding"));
     * ```
     *
     * @param vectorExpression The expression representing the Firestore Vector.
     * @return A new {@code Expr} representing the length of the array.
     */
    export function vectorLength(vectorExpression: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that calculates the length of a Firestore Vector represented by a field.
     *
     * ```typescript
     * // Get the vector length (dimension) of the field 'embedding'.
     * vectorLength("embedding");
     * ```
     *
     * @param fieldName The name of the field representing the Firestore Vector.
     * @return A new {@code Expr} representing the length of the array.
     */
    export function vectorLength(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that interprets an expression as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'microseconds' field as microseconds since epoch.
     * unixMicrosToTimestamp(field("microseconds"));
     * ```
     *
     * @param expr The expression representing the number of microseconds since epoch.
     * @return A new {@code Expr} representing the timestamp.
     */
    export function unixMicrosToTimestamp(expr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that interprets a field's value as the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'microseconds' field as microseconds since epoch.
     * unixMicrosToTimestamp("microseconds");
     * ```
     *
     * @param fieldName The name of the field representing the number of microseconds since epoch.
     * @return A new {@code Expr} representing the timestamp.
     */
    export function unixMicrosToTimestamp(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a timestamp expression to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to microseconds since epoch.
     * timestampToUnixMicros(field("timestamp"));
     * ```
     *
     * @param expr The expression representing the timestamp.
     * @return A new {@code Expr} representing the number of microseconds since epoch.
     */
    export function timestampToUnixMicros(expr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a timestamp field to the number of microseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to microseconds since epoch.
     * timestampToUnixMicros("timestamp");
     * ```
     *
     * @param fieldName The name of the field representing the timestamp.
     * @return A new {@code Expr} representing the number of microseconds since epoch.
     */
    export function timestampToUnixMicros(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that interprets an expression as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'milliseconds' field as milliseconds since epoch.
     * unixMillisToTimestamp(field("milliseconds"));
     * ```
     *
     * @param expr The expression representing the number of milliseconds since epoch.
     * @return A new {@code Expr} representing the timestamp.
     */
    export function unixMillisToTimestamp(expr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that interprets a field's value as the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'milliseconds' field as milliseconds since epoch.
     * unixMillisToTimestamp("milliseconds");
     * ```
     *
     * @param fieldName The name of the field representing the number of milliseconds since epoch.
     * @return A new {@code Expr} representing the timestamp.
     */
    export function unixMillisToTimestamp(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a timestamp expression to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to milliseconds since epoch.
     * timestampToUnixMillis(field("timestamp"));
     * ```
     *
     * @param expr The expression representing the timestamp.
     * @return A new {@code Expr} representing the number of milliseconds since epoch.
     */
    export function timestampToUnixMillis(expr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a timestamp field to the number of milliseconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to milliseconds since epoch.
     * timestampToUnixMillis("timestamp");
     * ```
     *
     * @param fieldName The name of the field representing the timestamp.
     * @return A new {@code Expr} representing the number of milliseconds since epoch.
     */
    export function timestampToUnixMillis(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that interprets an expression as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'seconds' field as seconds since epoch.
     * unixSecondsToTimestamp(field("seconds"));
     * ```
     *
     * @param expr The expression representing the number of seconds since epoch.
     * @return A new {@code Expr} representing the timestamp.
     */
    export function unixSecondsToTimestamp(expr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that interprets a field's value as the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC)
     * and returns a timestamp.
     *
     * ```typescript
     * // Interpret the 'seconds' field as seconds since epoch.
     * unixSecondsToTimestamp("seconds");
     * ```
     *
     * @param fieldName The name of the field representing the number of seconds since epoch.
     * @return A new {@code Expr} representing the timestamp.
     */
    export function unixSecondsToTimestamp(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a timestamp expression to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to seconds since epoch.
     * timestampToUnixSeconds(field("timestamp"));
     * ```
     *
     * @param expr The expression representing the timestamp.
     * @return A new {@code Expr} representing the number of seconds since epoch.
     */
    export function timestampToUnixSeconds(expr: Expr): FunctionExpr;

    /**
     * @beta
     *
     * Creates an expression that converts a timestamp field to the number of seconds since the Unix epoch (1970-01-01 00:00:00 UTC).
     *
     * ```typescript
     * // Convert the 'timestamp' field to seconds since epoch.
     * timestampToUnixSeconds("timestamp");
     * ```
     *
     * @param fieldName The name of the field representing the timestamp.
     * @return A new {@code Expr} representing the number of seconds since epoch.
     */
    export function timestampToUnixSeconds(fieldName: string): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    export function timestampAdd(
      timestamp: Expr,
      unit: Expr,
      amount: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    export function timestampAdd(
      timestamp: Expr,
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    export function timestampAdd(
      fieldName: string,
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    export function timestampSub(
      timestamp: Expr,
      unit: Expr,
      amount: Expr
    ): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    export function timestampSub(
      timestamp: Expr,
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): FunctionExpr;

    /**
     * @beta
     *
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
     * @return A new {@code Expr} representing the resulting timestamp.
     */
    export function timestampSub(
      fieldName: string,
      unit:
        | 'microsecond'
        | 'millisecond'
        | 'second'
        | 'minute'
        | 'hour'
        | 'day',
      amount: number
    ): FunctionExpr;

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
     * @param first The first filter condition.
     * @param second The second filter condition.
     * @param more Additional filter conditions to 'AND' together.
     * @return A new {@code Expr} representing the logical 'AND' operation.
     */
    export function and(
      first: BooleanExpr,
      second: BooleanExpr,
      ...more: BooleanExpr[]
    ): BooleanExpr;

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
     * @param first The first filter condition.
     * @param second The second filter condition.
     * @param more Additional filter conditions to 'OR' together.
     * @return A new {@code Expr} representing the logical 'OR' operation.
     */
    export function or(
      first: BooleanExpr,
      second: BooleanExpr,
      ...more: BooleanExpr[]
    ): BooleanExpr;

    /**
     * @beta
     *
     * Creates an {@link Ordering} that sorts documents in ascending order based on an expression.
     *
     * ```typescript
     * // Sort documents by the 'name' field in lowercase in ascending order
     * pipeline().collection("users")
     *   .sort(ascending(field("name").toLower()));
     * ```
     *
     * @param expr The expression to create an ascending ordering for.
     * @return A new `Ordering` for ascending sorting.
     */
    export function ascending(expr: Expr): Ordering;

    /**
     * @beta
     *
     * Creates an {@link Ordering} that sorts documents in ascending order based on a field.
     *
     * ```typescript
     * // Sort documents by the 'name' field in ascending order
     * pipeline().collection("users")
     *   .sort(ascending("name"));
     * ```
     *
     * @param fieldName The field to create an ascending ordering for.
     * @return A new `Ordering` for ascending sorting.
     */
    export function ascending(fieldName: string): Ordering;

    /**
     * @beta
     *
     * Creates an {@link Ordering} that sorts documents in descending order based on an expression.
     *
     * ```typescript
     * // Sort documents by the 'name' field in lowercase in descending order
     * pipeline().collection("users")
     *   .sort(descending(field("name").toLower()));
     * ```
     *
     * @param expr The expression to create a descending ordering for.
     * @return A new `Ordering` for descending sorting.
     */
    export function descending(expr: Expr): Ordering;

    /**
     * @beta
     *
     * Creates an {@link Ordering} that sorts documents in descending order based on a field.
     *
     * ```typescript
     * // Sort documents by the 'name' field in descending order
     * pipeline().collection("users")
     *   .sort(descending("name"));
     * ```
     *
     * @param fieldName The field to create a descending ordering for.
     * @return A new `Ordering` for descending sorting.
     */
    export function descending(fieldName: string): Ordering;

    /**
     * @beta
     *
     * Represents an ordering criterion for sorting documents in a Firestore pipeline.
     *
     * You create `Ordering` instances using the `ascending` and `descending` helper functions.
     */
    export class Ordering {
      readonly expr: Expr;
      readonly direction: 'ascending' | 'descending';
    }

    /**
     * @beta
     */
    export interface Stage {
      name: string;
    }

    /**
     * @beta
     */
    export class Aggregate implements Stage {
      name: string;
    }

    /**
     * @beta
     */
    export class Where implements Stage {
      name: string;
    }

    /**
     * @beta
     */
    export interface FindNearestOptions {
      field: Field | string;
      vectorValue: VectorValue | number[];
      distanceMeasure: 'euclidean' | 'cosine' | 'dot_product';
      limit?: number;
      distanceField?: string;
    }

    /**
     * @beta
     */
    export class FindNearest implements Stage {
      name: string;
    }

    /**
     * @beta
     */
    export class Replace implements Stage {
      name: string;
    }

    /**
     * @beta
     */
    export interface UnnestOptions {
      field: Selectable | string;
      alias: Field | string;
      indexField?: string;
    }

    /**
     * Represents the source of a Firestore {@link Pipeline}.
     * @beta
     */
    export class PipelineSource {
      /**
       * Specifies the source as a collection.
       *
       * @param collectionPath The path to the collection.
       * @return A new Pipeline object with the collection as the source.
       */
      collection(collectionPath: string | CollectionReference): Pipeline;

      /**
       * Specifies the source as a collection group.
       *
       * @param collectionId The ID of the collection group.
       * @return A new Pipeline object with the collection group as the source.
       */
      collectionGroup(collectionId: string): Pipeline;

      /**
       * Specifies the source as a database.
       *
       * @return A new Pipeline object with the database as the source.
       */
      database(): Pipeline;

      /**
       * Specifies the source as a set of documents.
       *
       * @param docs The document references.
       * @return A new Pipeline object with the documents as the source.
       */
      documents(docs: Array<string | DocumentReference>): Pipeline;

      /**
       * Convert the given Query into an equivalent Pipeline.
       *
       * @param query A Query to be converted into a Pipeline.
       *
       * @throws {@FirestoreError} Thrown if any of the provided DocumentReferences target a different project or database than the pipeline.
       */
      createFrom(query: Query): Pipeline;
    }

    /**
     * @beta
     *
     * The Pipeline class provides a flexible and expressive framework for building complex data
     * transformation and query pipelines for Firestore.
     *
     * A pipeline takes data sources, such as Firestore collections or collection groups, and applies
     * a series of stages that are chained together. Each stage takes the output from the previous stage
     * (or the data source) and produces an output for the next stage (or as the final output of the
     * pipeline).
     *
     * Expressions can be used within each stage to filter and transform data through the stage.
     *
     * NOTE: The chained stages do not prescribe exactly how Firestore will execute the pipeline.
     * Instead, Firestore only guarantees that the result is the same as if the chained stages were
     * executed in order.
     *
     * Usage Examples:
     *
     * ```typescript
     * const db: Firestore; // Assumes a valid firestore instance.
     *
     * // Example 1: Select specific fields and rename 'rating' to 'bookRating'
     * const results1 = await db.pipeline()
     *     .collection("books")
     *     .select("title", "author", Field.of("rating").as("bookRating"))
     *     .execute();
     *
     * // Example 2: Filter documents where 'genre' is "Science Fiction" and 'published' is after 1950
     * const results2 = await db.pipeline()
     *     .collection("books")
     *     .where(and(Field.of("genre").eq("Science Fiction"), Field.of("published").gt(1950)))
     *     .execute();
     *
     * // Example 3: Calculate the average rating of books published after 1980
     * const results3 = await db.pipeline()
     *     .collection("books")
     *     .where(Field.of("published").gt(1980))
     *     .aggregate(avg(Field.of("rating")).as("averageRating"))
     *     .execute();
     * ```
     */
    export class Pipeline {
      /**
       * Adds new fields to outputs from previous stages.
       *
       * This stage allows you to compute values on-the-fly based on existing data from previous
       * stages or constants. You can use this to create new fields or overwrite existing ones (if there
       * is name overlaps).
       *
       * The added fields are defined using {@link Selectable}s, which can be:
       *
       * - {@link Field}: References an existing document field.
       * - {@link Expr}: Either a literal value (see {@link Constant}) or a computed value
       *   (see {@FunctionExpr}) with an assigned alias using {@link Expr#as}.
       *
       * Example:
       *
       * ```typescript
       * firestore.pipeline().collection("books")
       *   .addFields(
       *     field("rating").as("bookRating"), // Rename 'rating' to 'bookRating'
       *     add(5, field("quantity")).as("totalCost")  // Calculate 'totalCost'
       *   );
       * ```
       *
       * @param field The first field to add to the documents, specified as a {@link Selectable}.
       * @param additionalFields Optional additional fields to add to the documents, specified as {@link Selectable}s.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      addFields(field: Selectable, ...additionalFields: Selectable[]): Pipeline;

      /**
       * Remove fields from outputs of previous stages.
       *
       * Example:
       *
       * ```typescript
       * firestore.pipeline().collection('books')
       *   // removes field 'rating' and 'cost' from the previous stage outputs.
       *   .removeFields(
       *     field('rating'),
       *     'cost'
       *   );
       * ```
       *
       * @param fieldValue The first field to remove.
       * @param additionalFields Optional additional fields to remove.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      removeFields(
        fieldValue: Field | string,
        ...additionalFields: Array<Field | string>
      ): Pipeline;

      /**
       * Selects or creates a set of fields from the outputs of previous stages.
       *
       * <p>The selected fields are defined using {@link Selectable} expressions, which can be:
       *
       * <ul>
       *   <li>{@code string}: Name of an existing field</li>
       *   <li>{@link Field}: References an existing field.</li>
       *   <li>{@link Function}: Represents the result of a function with an assigned alias name using
       *       {@link Expr#as}</li>
       * </ul>
       *
       * <p>If no selections are provided, the output of this stage is empty. Use {@link
       * Pipeline#addFields} instead if only additions are
       * desired.
       *
       * <p>Example:
       *
       * ```typescript
       * firestore.pipeline().collection("books")
       *   .select(
       *     "firstName",
       *     field("lastName"),
       *     field("address").toUppercase().as("upperAddress"),
       *   );
       * ```
       *
       * @param selection The first field to include in the output documents, specified as {@link
       *     Selectable} expression or string value representing the field name.
       * @param additionalSelections Optional additional fields to include in the output documents, specified as {@link
       *     Selectable} expressions or {@code string} values representing field names.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      select(
        selection: Selectable | string,
        ...additionalSelections: Array<Selectable | string>
      ): Pipeline;

      /**
       * Filters the documents from previous stages to only include those matching the specified {@link
       * BooleanExpr}.
       *
       * <p>This stage allows you to apply conditions to the data, similar to a "WHERE" clause in SQL.
       * You can filter documents based on their field values, using implementations of {@link
       * BooleanExpr}, typically including but not limited to:
       *
       * <ul>
       *   <li>field comparators: {@link Function#eq}, {@link Function#lt} (less than), {@link
       *       Function#gt} (greater than), etc.</li>
       *   <li>logical operators: {@link Function#and}, {@link Function#or}, {@link Function#not}, etc.</li>
       *   <li>advanced functions: {@link Function#regexMatch}, {@link
       *       Function#arrayContains}, etc.</li>
       * </ul>
       *
       * <p>Example:
       *
       * ```typescript
       * firestore.pipeline().collection("books")
       *   .where(
       *     and(
       *         gt(field("rating"), 4.0),   // Filter for ratings greater than 4.0
       *         field("genre").eq("Science Fiction") // Equivalent to gt("genre", "Science Fiction")
       *     )
       *   );
       * ```
       *
       * @param condition The {@link BooleanExpr} to apply.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      where(condition: BooleanExpr): Pipeline;

      /**
       * Skips the first `offset` number of documents from the results of previous stages.
       *
       * <p>This stage is useful for implementing pagination in your pipelines, allowing you to retrieve
       * results in chunks. It is typically used in conjunction with {@link #limit} to control the
       * size of each page.
       *
       * <p>Example:
       *
       * ```typescript
       * // Retrieve the second page of 20 results
       * firestore.pipeline().collection("books")
       *     .sort(Field.of("published").descending())
       *     .offset(20)  // Skip the first 20 results
       *     .limit(20);   // Take the next 20 results
       * ```
       *
       * @param offset The number of documents to skip.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      offset(offset: number): Pipeline;

      /**
       * Limits the maximum number of documents returned by previous stages to `limit`.
       *
       * <p>This stage is particularly useful when you want to retrieve a controlled subset of data from
       * a potentially large result set. It's often used for:
       *
       * <ul>
       *   <li>**Pagination:** In combination with {@link #offset} to retrieve specific pages of
       *       results.</li>
       *   <li>**Limiting Data Retrieval:** To prevent excessive data transfer and improve performance,
       *       especially when dealing with large collections.</li>
       * </ul>
       *
       * <p>Example:
       *
       * ```typescript
       * // Limit the results to the top 10 highest-rated books
       * firestore.pipeline().collection("books")
       *     .sort(Field.of("rating").descending())
       *     .limit(10);
       * ```
       *
       * @param limit The maximum number of documents to return.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      limit(limit: number): Pipeline;

      /**
       * Returns a set of distinct values from the inputs to this stage.
       *
       * This stage runs through the results from previous stages to include only results with
       * unique combinations of {@link Expr} values ({@link Field}, {@link Function}, etc).
       *
       * The parameters to this stage are defined using {@link Selectable} expressions or strings:
       *
       * - {@code string}: Name of an existing field
       * - {@link Field}: References an existing document field.
       * - {@link ExprWithAlias}: Represents the result of a function with an assigned alias name
       *   using {@link Expr#as}.
       *
       * Example:
       *
       * ```typescript
       * // Get a list of unique author names in uppercase and genre combinations.
       * firestore.pipeline().collection("books")
       *     .distinct(toUppercase(field("author")).as("authorName"), field("genre"), "publishedAt")
       *     .select("authorName");
       * ```
       *
       * @param group The {@link Selectable} expression or field name to consider when determining
       *     distinct value combinations.
       * @param additionalGroups Optional additional {@link Selectable} expressions to consider when determining distinct
       *     value combinations or strings representing field names.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      distinct(
        group: string | Selectable,
        ...additionalGroups: Array<string | Selectable>
      ): Pipeline;

      /**
       * Performs aggregation operations on the documents from previous stages.
       *
       * <p>This stage allows you to calculate aggregate values over a set of documents. You define the
       * aggregations to perform using {@link AggregateWithAlias} expressions which are typically results of
       * calling {@link Expr#as} on {@link AggregateFunction} instances.
       *
       * <p>Example:
       *
       * ```typescript
       * // Calculate the average rating and the total number of books
       * firestore.pipeline().collection("books")
       *     .aggregate(
       *         field("rating").avg().as("averageRating"),
       *         countAll().as("totalBooks")
       *     );
       * ```
       *
       * @param accumulator The first {@link AggregateWithAlias}, wrapping an {@link AggregateFunction}
       *     and providing a name for the accumulated results.
       * @param additionalAccumulators Optional additional {@link AggregateWithAlias}, each wrapping an {@link AggregateFunction}
       *     and providing a name for the accumulated results.
       * @return A new Pipeline object with this stage appended to the stage list.
       */
      aggregate(
        accumulator: AggregateWithAlias,
        ...additionalAccumulators: AggregateWithAlias[]
      ): Pipeline;
      /**
       * Performs optionally grouped aggregation operations on the documents from previous stages.
       *
       * <p>This stage allows you to calculate aggregate values over a set of documents, optionally
       * grouped by one or more fields or functions. You can specify:
       *
       * <ul>
       *   <li>**Grouping Fields or Functions:** One or more fields or functions to group the documents
       *       by. For each distinct combination of values in these fields, a separate group is created.
       *       If no grouping fields are provided, a single group containing all documents is used. Not
       *       specifying groups is the same as putting the entire inputs into one group.</li>
       *   <li>**Accumulators:** One or more accumulation operations to perform within each group. These
       *       are defined using {@link AggregateWithAlias} expressions, which are typically created by
       *       calling {@link Expr#as} on {@link AggregateFunction} instances. Each aggregation
       *       calculates a value (e.g., sum, average, count) based on the documents within its group.</li>
       * </ul>
       *
       * <p>Example:
       *
       * ```typescript
       * // Calculate the average rating for each genre.
       * firestore.pipeline().collection("books")
       *   .aggregate({
       *       accumulators: [avg(field("rating")).as("avg_rating")]
       *       groups: ["genre"]
       *       });
       * ```
       *
       * @param options An object that specifies the accumulators
       * and optional grouping fields to perform.
       * @return A new {@code Pipeline} object with this stage appended to the stage
       * list.
       */
      aggregate(options: {
        accumulators: AggregateWithAlias[];
        groups?: Array<string | Selectable>;
      }): Pipeline;

      findNearest(options: FindNearestOptions): Pipeline;

      /**
       * Fully overwrites all fields in a document with those coming from a nested map.
       *
       * <p>This stage allows you to emit a map value as a document. Each key of the map becomes a field
       * on the document that contains the corresponding value.
       *
       * <p>Example:
       *
       * ```typescript
       * // Input.
       * // {
       * //  'name': 'John Doe Jr.',
       * //  'parents': {
       * //    'father': 'John Doe Sr.',
       * //    'mother': 'Jane Doe'
       * //   }
       * // }
       *
       * // Emit parents as document.
       * firestore.pipeline().collection('people').replaceWith('parents');
       *
       * // Output
       * // {
       * //  'father': 'John Doe Sr.',
       * //  'mother': 'Jane Doe'
       * // }
       * ```
       *
       * @param fieldName The {@link Field} field containing the nested map.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      replaceWith(fieldName: string): Pipeline;

      /**
       * Fully overwrites all fields in a document with those coming from a map.
       *
       * <p>This stage allows you to emit a map value as a document. Each key of the map becomes a field
       * on the document that contains the corresponding value.
       *
       * <p>Example:
       *
       * ```typescript
       * // Input.
       * // {
       * //  'name': 'John Doe Jr.',
       * //  'parents': {
       * //    'father': 'John Doe Sr.',
       * //    'mother': 'Jane Doe'
       * //   }
       * // }
       *
       * // Emit parents as document.
       * firestore.pipeline().collection('people').replaceWith(map({
       *   foo: 'bar',
       *   info: {
       *     name: field('name')
       *   }
       * }));
       *
       * // Output
       * // {
       * //  'father': 'John Doe Sr.',
       * //  'mother': 'Jane Doe'
       * // }
       * ```
       *
       * @param expr An {@link Expr} that when returned evaluates to a map.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      replaceWith(expr: Expr): Pipeline;

      /**
       * Performs a pseudo-random sampling of the documents from the previous stage.
       *
       * <p>This stage will filter documents pseudo-randomly. The parameter specifies how number of
       * documents to be returned.
       *
       * <p>Examples:
       *
       * ```typescript
       * // Sample 25 books, if available.
       * firestore.pipeline().collection('books')
       *     .sample(25);
       * ```
       *
       * @param documents The number of documents to sample.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      sample(documents: number): Pipeline;

      /**
       * Performs a pseudo-random sampling of the documents from the previous stage.
       *
       * <p>This stage will filter documents pseudo-randomly. The 'options' parameter specifies how
       * sampling will be performed. See {@code SampleOptions} for more information.
       *
       * <p>Examples:
       *
       * // Sample 10 books, if available.
       * firestore.pipeline().collection("books")
       *     .sample({ documents: 10 });
       *
       * // Sample 50% of books.
       * firestore.pipeline().collection("books")
       *     .sample({ percentage: 0.5 });
       *
       * @param options The {@code SampleOptions} specifies how sampling is performed.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      sample(options: {percentage: number} | {documents: number}): Pipeline;

      /**
       * Sorts the documents from previous stages based on one or more {@link Ordering} criteria.
       *
       * <p>This stage allows you to order the results of your pipeline. You can specify multiple {@link
       * Ordering} instances to sort by multiple fields in ascending or descending order. If documents
       * have the same value for a field used for sorting, the next specified ordering will be used. If
       * all orderings result in equal comparison, the documents are considered equal and the order is
       * unspecified.
       *
       * <p>Example:
       *
       * ```typescript
       * // Sort books by rating in descending order, and then by title in ascending order for books
       * // with the same rating
       * firestore.pipeline().collection("books")
       *     .sort(
       *         Ordering.of(field("rating")).descending(),
       *         Ordering.of(field("title"))  // Ascending order is the default
       *     );
       * ```
       *
       * @param ordering The first {@link Ordering} instance specifying the sorting criteria.
       * @param additionalOrderings Optional additional {@link Ordering} instances specifying the additional sorting criteria.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      sort(ordering: Ordering, ...additionalOrderings: Ordering[]): Pipeline;

      /**
       * Performs union of all documents from two pipelines, including duplicates.
       *
       * <p>This stage will pass through documents from previous stage, and also pass through documents
       * from previous stage of the `other` {@code Pipeline} given in parameter. The order of documents
       * emitted from this stage is undefined.
       *
       * <p>Example:
       *
       * ```typescript
       * // Emit documents from books collection and magazines collection.
       * firestore.pipeline().collection('books')
       *     .union(firestore.pipeline().collection('magazines'));
       * ```
       *
       * @param other The other {@code Pipeline} that is part of union.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      union(other: Pipeline): Pipeline;

      /**
       * Produces a document for each element in an input array.
       *
       * For each previous stage document, this stage will emit zero or more augmented documents. The
       * input array specified by the `selectable` parameter, will emit an augmented document for each input array element. The input array element will
       * augment the previous stage document by setting the `alias` field  with the array element value.
       *
       * When `selectable` evaluates to a non-array value (ex: number, null, absent), then the stage becomes a no-op for
       * the current input document, returning it as is with the `alias` field absent.
       *
       * No documents are emitted when `selectable` evaluates to an empty array.
       *
       * Example:
       *
       * ```typescript
       * // Input:
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tags": [ "comedy", "space", "adventure" ], ... }
       *
       * // Emit a book document for each tag of the book.
       * firestore.pipeline().collection("books")
       *     .unnest(field("tags").as('tag'), 'tagIndex');
       *
       * // Output:
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "comedy", "tagIndex": 0, ... }
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "space", "tagIndex": 1, ... }
       * // { "title": "The Hitchhiker's Guide to the Galaxy", "tag": "adventure", "tagIndex": 2, ... }
       * ```
       *
       * @param selectable A selectable expression defining the field to unnest and the alias to use for each un-nested element in the output documents.
       * @param indexField An optional string value specifying the field path to write the offset (starting at zero) into the array the un-nested element is from
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      unnest(selectable: Selectable, indexField?: string): Pipeline;

      /**
       * Adds a generic stage to the pipeline.
       *
       * <p>This method provides a flexible way to extend the pipeline's functionality by adding custom
       * stages. Each generic stage is defined by a unique `name` and a set of `params` that control its
       * behavior.
       *
       * <p>Example (Assuming there is no "where" stage available in SDK):
       *
       * ```typescript
       * // Assume we don't have a built-in "where" stage
       * firestore.pipeline().collection("books")
       *     .genericStage("where", [Field.of("published").lt(1900)]) // Custom "where" stage
       *     .select("title", "author");
       * ```
       *
       * @param name The unique name of the generic stage to add.
       * @param params A list of parameters to configure the generic stage's behavior.
       * @return A new {@code Pipeline} object with this stage appended to the stage list.
       */
      genericStage(name: string, params: any[]): Pipeline;
      /**
       * Executes this pipeline and returns a Promise to represent the asynchronous operation.
       *
       * <p>The returned Promise can be used to track the progress of the pipeline execution
       * and retrieve the results (or handle any errors) asynchronously.
       *
       * <p>The pipeline results are returned as a list of {@link PipelineResult} objects. Each {@link
       * PipelineResult} typically represents a single key/value map that has passed through all the
       * stages of the pipeline, however this might differ depending on the stages involved in the
       * pipeline. For example:
       *
       * <ul>
       *   <li>If there are no stages or only transformation stages, each {@link PipelineResult}
       *       represents a single document.</li>
       *   <li>If there is an aggregation, only a single {@link PipelineResult} is returned,
       *       representing the aggregated results over the entire dataset .</li>
       *   <li>If there is an aggregation stage with grouping, each {@link PipelineResult} represents a
       *       distinct group and its associated aggregated values.</li>
       * </ul>
       *
       * <p>Example:
       *
       * ```typescript
       * const futureResults = await firestore.pipeline().collection("books")
       *     .where(gt(Field.of("rating"), 4.5))
       *     .select("title", "author", "rating")
       *     .execute();
       * ```
       *
       * @return A Promise representing the asynchronous pipeline execution.
       */
      execute(): Promise<PipelineSnapshot>;

      /**
       * Executes this pipeline and streams the results as {@link PipelineResult}s.
       *
       * @returns {Stream.<PipelineResult>} A stream of
       * PipelineResult.
       *
       * @example
       * ```typescript
       * firestore.pipeline().collection("books")
       *     .where(gt(Field.of("rating"), 4.5))
       *     .select("title", "author", "rating")
       *     .stream()
       *     .on('data', (pipelineResult) => {})
       *     .on('end', () => {});
       * ```
       */
      stream(): NodeJS.ReadableStream;
    }
    /**
     * TODO(docs)
     */
    export class PipelineSnapshot {
      /**
       * The Pipeline on which you called `execute()` in order to get this
       * `PipelineSnapshot`.
       */
      get pipeline(): Pipeline;

      /** An array of all the results in the `PipelineSnapshot`. */
      get results(): PipelineResult[];

      /**
       * The time at which the pipeline producing this result is executed.
       *
       * @type {Timestamp}
       * @readonly
       *
       */
      get executionTime(): Timestamp;
    }

    /**
     * @beta
     *
     * A PipelineResult contains data read from a Firestore Pipeline. The data can be extracted with the
     * {@link #data()} or {@link #get(String)} methods.
     *
     * <p>If the PipelineResult represents a non-document result, `ref` will return a undefined
     * value.
     */
    export class PipelineResult {
      readonly executionTime: Timestamp;
      readonly createTime: Timestamp | undefined;
      readonly updateTime: Timestamp | undefined;

      /**
       * The reference of the document, if it is a document; otherwise `undefined`.
       */
      // get ref(): DocumentReference | undefined;

      /**
       * The ID of the document for which this PipelineResult contains data, if it is a document; otherwise `undefined`.
       *
       * @type {string}
       * @readonly
       *
       */
      get id(): string | undefined;

      get ref(): DocumentReference | undefined;

      /**
       * Retrieves all fields in the result as an object. Returns 'undefined' if
       * the document doesn't exist.
       *
       * @returns {T|undefined} An object containing all fields in the document or
       * 'undefined' if the document doesn't exist.
       *
       * @example
       * ```
       * let p = firestore.pipeline().collection('col');
       *
       * p.execute().then(results => {
       *   let data = results[0].data();
       *   console.log(`Retrieved data: ${JSON.stringify(data)}`);
       * });
       * ```
       */
      data(): DocumentData | undefined;

      /**
       * Retrieves the field specified by `field`.
       *
       * @param {string|FieldPath} field The field path
       * (e.g. 'foo' or 'foo.bar') to a specific field.
       * @returns {*} The data at the specified field location or undefined if no
       * such field exists.
       *
       * @example
       * ```
       * let p = firestore.pipeline().collection('col');
       *
       * p.execute().then(results => {
       *   let field = results[0].get('a.b');
       *   console.log(`Retrieved field value: ${field}`);
       * });
       * ```
       */
      // We deliberately use `any` in the external API to not impose type-checking
      // on end users.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get(field: string | FieldPath): any;

      /**
       * Returns true if the document's data and path in this `PipelineResult` is
       * equal to the provided value.
       *
       * @param {*} other The value to compare against.
       * @return {boolean} true if this `PipelineResult` is equal to the provided
       * value.
       */
      isEqual(other: PipelineResult): boolean;
    }
  }

  interface Firestore {
    // Augument the Firestore and Query classes with the pipeline() method.
    // This is stripped from dist/lite/pipelines.d.ts during the build
    // so it needs to be re-added here.
    pipeline(): Pipelines.PipelineSource;
  }

  interface Transaction {
    /**
     * @beta
     *
     * Executes this pipeline and returns a Promise to represent the asynchronous operation.
     *
     * <p>The returned Promise can be used to track the progress of the pipeline execution
     * and retrieve the results (or handle any errors) asynchronously.
     *
     * <p>The pipeline results are returned as a list of {@link PipelineResult} objects. Each {@link
     * PipelineResult} typically represents a single key/value map that has passed through all the
     * stages of the pipeline, however this might differ depending on the stages involved in the
     * pipeline. For example:
     *
     * <ul>
     *   <li>If there are no stages or only transformation stages, each {@link PipelineResult}
     *       represents a single document.</li>
     *   <li>If there is an aggregation, only a single {@link PipelineResult} is returned,
     *       representing the aggregated results over the entire dataset .</li>
     *   <li>If there is an aggregation stage with grouping, each {@link PipelineResult} represents a
     *       distinct group and its associated aggregated values.</li>
     * </ul>
     *
     * <p>Example:
     *
     * ```typescript
     * const futureResults = await transaction
     *   .execute(
     *     firestore.pipeline().collection("books")
     *       .where(gt(Field.of("rating"), 4.5))
     *       .select("title", "author", "rating"));
     * ```
     *
     * @return A Promise representing the asynchronous pipeline execution.
     */
    execute(pipeline: Pipelines.Pipeline): Promise<Pipelines.PipelineSnapshot>;
  }
}

declare module '@google-cloud/firestore/pipelines' {
  export = FirebaseFirestore.Pipelines;
}
