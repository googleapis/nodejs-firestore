import * as protos from '../protos/firestore_v1_proto_api';
import api = protos.google.firestore.v1;

import {VectorValue} from './field-value';
import {GeoPoint} from './geo-point';
import {FieldPath} from './path';
import {Pipeline} from './pipeline';
import {DocumentReference} from './reference/document-reference';
import {Timestamp} from './timestamp';

export interface Selectable {
  selectable: true;
}

export interface FilterCondition {
  filterable: true;
}

export interface Accumulator {
  toField(fieldName: string): AggregateTarget;
}

export class AggregateTarget implements Selectable {
  constructor(
    public field: Field,
    public accumulator: Accumulator & Expr
  ) {}

  selectable = true as const;
}

export type FilterExpr = Expr & FilterCondition;

export type SelectableExpr = Expr & Selectable;

export type ExprType = 'Field' | 'Constant' | 'Function' | 'ListOfExprs';

export abstract class Expr {
  equal(other: Expr): Expr;
  equal(other: any): Expr {
    if (other instanceof Expr) {
      return new Equal(this, other);
    }
    return new Equal(this, Constant.of(other));
  }

  notEqual(other: Expr): Expr;
  notEqual(other: any): Expr {
    if (other instanceof Expr) {
      return new NotEqual(this, other);
    }
    return new NotEqual(this, Constant.of(other));
  }

  lessThan(other: Expr): Expr;
  lessThan(other: any): Expr {
    if (other instanceof Expr) {
      return new LessThan(this, other);
    }
    return new LessThan(this, Constant.of(other));
  }

  lessThanOrEqual(other: Expr): Expr;
  lessThanOrEqual(other: any): Expr {
    if (other instanceof Expr) {
      return new LessThanOrEqual(this, other);
    }
    return new LessThanOrEqual(this, Constant.of(other));
  }

  greaterThan(other: Expr): Expr;
  greaterThan(other: any): Expr {
    if (other instanceof Expr) {
      return new GreaterThan(this, other);
    }
    return new GreaterThan(this, Constant.of(other));
  }

  greaterThanOrEqual(other: Expr): Expr;
  greaterThanOrEqual(other: any): Expr {
    if (other instanceof Expr) {
      return new GreaterThanOrEqual(this, other);
    }
    return new GreaterThanOrEqual(this, Constant.of(other));
  }

  arrayContains(element: Expr): Expr;
  arrayContains(element: any): Expr {
    if (element instanceof Expr) {
      return new ArrayContains(this, element);
    }
    return new ArrayContains(this, Constant.of(element));
  }

  arrayContainsAny(values: Expr[]): Expr;
  arrayContainsAny(values: any[]): Expr {
    const exprValues = values.map(value =>
      value instanceof Expr ? value : Constant.of(value)
    );
    return new ArrayContainsAny(this, exprValues);
  }

  in(...others: Expr[]): Expr;
  in(...others: any[]): Expr {
    const exprOthers = others.map(other =>
      other instanceof Expr ? other : Constant.of(other)
    );
    return new In(this, exprOthers);
  }

  isNaN(): Expr {
    return new IsNan(this);
  }

  isNull(): Expr {
    return new IsNull(this);
  }

  count(): Expr {
    return new Count(this, false);
  }

  sum(): Expr {
    return new Sum(this, false);
  }

  avg(): Expr {
    return new Avg(this, false);
  }

  min(): Expr {
    return new Min(this, false);
  }

  max(): Expr {
    return new Max(this, false);
  }

  cosineDistance(other: Expr): Expr;
  cosineDistance(other: VectorValue): Expr;
  cosineDistance(other: number[]): Expr;
  cosineDistance(other: Expr | VectorValue | number[]): Expr {
    if (other instanceof Expr) {
      return new CosineDistance(this, other);
    } else {
      return new CosineDistance(this, Constant.ofVector(other));
    }
  }

  dotProductDistance(other: Expr): Expr;
  dotProductDistance(other: VectorValue): Expr;
  dotProductDistance(other: number[]): Expr;
  dotProductDistance(other: Expr | VectorValue | number[]): Expr {
    if (other instanceof Expr) {
      return new DotProductDistance(this, other);
    } else {
      return new DotProductDistance(this, Constant.ofVector(other));
    }
  }

  euclideanDistance(other: Expr): Expr;
  euclideanDistance(other: VectorValue): Expr;
  euclideanDistance(other: number[]): Expr;
  euclideanDistance(other: Expr | VectorValue | number[]): Expr {
    if (other instanceof Expr) {
      return new EuclideanDistance(this, other);
    } else {
      return new EuclideanDistance(this, Constant.ofVector(other));
    }
  }
}

class ListOfExprs extends Expr {
  exprType: ExprType = 'ListOfExprs';
  constructor(private exprs: Expr[]) {
    super();
  }
}

export class Field extends Expr implements Selectable {
  exprType: ExprType = 'Field';
  selectable = true as const;

  private constructor(
    private fieldPath: FieldPath,
    private pipeline: Pipeline | null = null
  ) {
    super();
  }

  static of(name: string): Field;
  static of(pipeline: Pipeline, name: string): Field;
  static of(pipelineOrName: Pipeline | string, name?: string): Field {
    if (typeof pipelineOrName === 'string') {
      return new Field(FieldPath.fromArgument(pipelineOrName));
    } else {
      return new Field(FieldPath.fromArgument(name!), pipelineOrName);
    }
  }

  fieldName(): string {
    return this.fieldPath.formattedName;
  }
}

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
}

export class Constant extends Expr {
  exprType: ExprType = 'Constant';

  private constructor(private value: any) {
    super();
  }

  static of(value: number): Constant;
  static of(value: string): Constant;
  static of(value: boolean): Constant;
  static of(value: null): Constant;
  static of(value: undefined): Constant;
  static of(value: GeoPoint): Constant;
  static of(value: Timestamp): Constant;
  static of(value: Date): Constant;
  static of(value: Uint8Array): Constant;
  static of(value: DocumentReference): Constant;
  static of(value: api.IValue): Constant;
  static of(value: Array<any>): Constant;
  static of(value: Map<string, any>): Constant;
  static of(value: VectorValue): Constant;
  static of(value: api.IValue): Constant;
  static of(value: any): Constant {
    return new Constant(value);
  }

  static ofVector(value: Array<number> | VectorValue): Constant {
    if (value instanceof VectorValue) {
      return new Constant(value);
    } else {
      return new Constant(new VectorValue(value));
    }
  }
}

export class Function extends Expr {
  exprType: ExprType = 'Function';
  constructor(
    private name: string,
    private params: Expr[]
  ) {
    super();
  }
}

export class Equal extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('eq', [left, right]);
  }
  filterable = true as const;
}

class NotEqual extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('neq', [left, right]);
  }
  filterable = true as const;
}

class LessThan extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('lt', [left, right]);
  }
  filterable = true as const;
}

class LessThanOrEqual extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('lte', [left, right]);
  }
  filterable = true as const;
}

class GreaterThan extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('gt', [left, right]);
  }
  filterable = true as const;
}

class GreaterThanOrEqual extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('gte', [left, right]);
  }
  filterable = true as const;
}

class ArrayContains extends Function implements FilterCondition {
  constructor(
    private array: Expr,
    private element: Expr
  ) {
    super('array_contains', [array, element]);
  }
  filterable = true as const;
}

class ArrayContainsAny extends Function implements FilterCondition {
  constructor(
    private array: Expr,
    private values: Expr[]
  ) {
    super('array_contains_any', [array, new ListOfExprs(values)]);
  }
  filterable = true as const;
}

class In extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private others: Expr[]
  ) {
    super('in', [left, new ListOfExprs(others)]);
  }
  filterable = true as const;
}

class IsNan extends Function implements FilterCondition {
  constructor(private expr: Expr) {
    super('is_nan', [expr]);
  }
  filterable = true as const;
}
class IsNull extends Function implements FilterCondition {
  constructor(private expr: Expr) {
    super('is_null', [expr]);
  }
  filterable = true as const;
}

class Not extends Function implements FilterCondition {
  constructor(private expr: Expr) {
    super('not', [expr]);
  }
  filterable = true as const;
}

class And extends Function implements FilterCondition {
  constructor(private conditions: FilterExpr[]) {
    super('and', conditions);
  }

  filterable = true as const;
}

class Or extends Function implements FilterCondition {
  constructor(private conditions: FilterExpr[]) {
    super('or', conditions);
  }
  filterable = true as const;
}

class Count extends Function implements Accumulator {
  constructor(
    private value: Expr | undefined,
    private distinct: boolean
  ) {
    super('count', value === undefined ? [] : [value]);
  }

  toField(fieldName: string): AggregateTarget {
    return new AggregateTarget(Field.of(fieldName), this);
  }
}

class Sum extends Function implements Accumulator {
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('sum', [value]);
  }
  toField(fieldName: string): AggregateTarget {
    return new AggregateTarget(Field.of(fieldName), this);
  }
}

class Avg extends Function implements Accumulator {
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('avg', [value]);
  }
  toField(fieldName: string): AggregateTarget {
    return new AggregateTarget(Field.of(fieldName), this);
  }
}

class Min extends Function implements Accumulator {
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('min', [value]);
  }
  toField(fieldName: string): AggregateTarget {
    return new AggregateTarget(Field.of(fieldName), this);
  }
}

class Max extends Function implements Accumulator {
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('max', [value]);
  }
  toField(fieldName: string): AggregateTarget {
    return new AggregateTarget(Field.of(fieldName), this);
  }
}

class CosineDistance extends Function {
  constructor(
    private vector1: Expr,
    private vector2: Expr
  ) {
    super('cosine_distance', [vector1, vector2]);
  }
}

class DotProductDistance extends Function {
  constructor(
    private vector1: Expr,
    private vector2: Expr
  ) {
    super('dot_product', [vector1, vector2]);
  }
}

class EuclideanDistance extends Function {
  constructor(
    private vector1: Expr,
    private vector2: Expr
  ) {
    super('euclidean_distance', [vector1, vector2]);
  }
}

function equal(left: Expr, right: Expr): Equal;
function equal(left: Expr, right: any): Equal;
function equal(left: string, right: Expr): Equal;
function equal(left: string, right: any): Equal;
function equal(left: Expr | string, right: any): Equal {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Equal(leftExpr, rightExpr);
}

// notEqual
function notEqual(left: Expr, right: Expr): NotEqual;
function notEqual(left: Expr, right: any): NotEqual;
function notEqual(left: string, right: Expr): NotEqual;
function notEqual(left: string, right: any): NotEqual;
function notEqual(left: Expr | string, right: any): NotEqual {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new NotEqual(leftExpr, rightExpr);
}

function lessThan(left: Expr, right: Expr): LessThan;
function lessThan(left: Expr, right: any): LessThan;
function lessThan(left: string, right: Expr): LessThan;
function lessThan(left: string, right: any): LessThan;
function lessThan(left: Expr | string, right: any): LessThan {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new LessThan(leftExpr, rightExpr);
}

function lessThanOrEqual(left: Expr, right: Expr): LessThanOrEqual;
function lessThanOrEqual(left: Expr, right: any): LessThanOrEqual;
function lessThanOrEqual(left: string, right: Expr): LessThanOrEqual;
function lessThanOrEqual(left: string, right: any): LessThanOrEqual;
function lessThanOrEqual(left: Expr | string, right: any): LessThanOrEqual {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new LessThanOrEqual(leftExpr, rightExpr);
}

function greaterThan(left: Expr, right: Expr): GreaterThan;
function greaterThan(left: Expr, right: any): GreaterThan;
function greaterThan(left: string, right: Expr): GreaterThan;
function greaterThan(left: string, right: any): GreaterThan;
function greaterThan(left: Expr | string, right: any): GreaterThan {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new GreaterThan(leftExpr, rightExpr);
}

function greaterThanOrEqual(left: Expr, right: Expr): GreaterThanOrEqual;
function greaterThanOrEqual(left: Expr, right: any): GreaterThanOrEqual;
function greaterThanOrEqual(left: string, right: Expr): GreaterThanOrEqual;
function greaterThanOrEqual(left: string, right: any): GreaterThanOrEqual;
function greaterThanOrEqual(
  left: Expr | string,
  right: any
): GreaterThanOrEqual {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new GreaterThanOrEqual(leftExpr, rightExpr);
}

function arrayContains(array: Expr, element: Expr): ArrayContains;
function arrayContains(array: Expr, element: any): ArrayContains;
function arrayContains(array: string, element: Expr): ArrayContains;
function arrayContains(array: string, element: any): ArrayContains;
function arrayContains(array: Expr | string, element: any): ArrayContains {
  const arrayExpr = array instanceof Expr ? array : Field.of(array);
  const elementExpr = element instanceof Expr ? element : Constant.of(element);
  return new ArrayContains(arrayExpr, elementExpr);
}

function arrayContainsAny(array: Expr, values: Expr[]): ArrayContainsAny;
function arrayContainsAny(array: Expr, values: any[]): ArrayContainsAny;
function arrayContainsAny(array: string, values: Expr[]): ArrayContainsAny;
function arrayContainsAny(array: string, values: any[]): ArrayContainsAny;
function arrayContainsAny(
  array: Expr | string,
  values: any[]
): ArrayContainsAny {
  const arrayExpr = array instanceof Expr ? array : Field.of(array);
  const exprValues = values.map(value =>
    value instanceof Expr ? value : Constant.of(value)
  );
  return new ArrayContainsAny(arrayExpr, exprValues);
}

function inAny(element: Expr, others: Expr[]): In;
function inAny(element: Expr, others: any[]): In;
function inAny(element: string, others: Expr[]): In; // Added overload
function inAny(element: string, others: any[]): In; // Added overload
function inAny(element: Expr | string, others: any[]): In {
  const elementExpr = element instanceof Expr ? element : Field.of(element);
  const exprOthers = others.map(other =>
    other instanceof Expr ? other : Constant.of(other)
  );
  return new In(elementExpr, exprOthers);
}

function notInAny(element: Expr, others: Expr[]): Not;
function notInAny(element: Expr, others: any[]): Not;
function notInAny(element: string, others: Expr[]): Not; // Added overload
function notInAny(element: string, others: any[]): Not; // Added overload
function notInAny(element: Expr | string, others: any[]): Not {
  const elementExpr = element instanceof Expr ? element : Field.of(element);
  const exprOthers = others.map(other =>
    other instanceof Expr ? other : Constant.of(other)
  );
  return new Not(new In(elementExpr, exprOthers));
}

function and(left: FilterExpr, ...right: FilterExpr[]): And {
  return new And([left, ...right]);
}

function or(left: FilterExpr, ...right: FilterExpr[]): Or {
  return new Or([left, ...right]);
}

function not(filter: FilterExpr): Not {
  return new Not(filter);
}

function isNull(value: Expr): IsNull;
function isNull(value: string): IsNull;
function isNull(value: Expr | string): IsNull {
  const valueExpr = value instanceof Expr ? value : Field.of(value);
  return new IsNull(valueExpr);
}

function isNan(value: Expr): IsNan;
function isNan(value: string): IsNan;
function isNan(value: Expr | string): IsNan {
  const valueExpr = value instanceof Expr ? value : Field.of(value);
  return new IsNan(valueExpr);
}

function countAll(): Count {
  return new Count(undefined, false);
}

function count(value: Expr): Count;
function count(value: string): Count;
function count(value: Expr | string): Count {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Count(exprValue, false);
}

function sum(value: Expr): Sum;
function sum(value: string): Sum;
function sum(value: Expr | string): Sum {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Sum(exprValue, false);
}

function avg(value: Expr): Avg;
function avg(value: string): Avg;
function avg(value: Expr | string): Avg {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Avg(exprValue, false);
}

function min(value: Expr): Min;
function min(value: string): Min;
function min(value: Expr | string): Min {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Min(exprValue, false);
}

function max(value: Expr): Max;
function max(value: string): Max;
function max(value: Expr | string): Max {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Max(exprValue, false);
}

function cosineDistance(expr: Expr, other: Expr): CosineDistance;
function cosineDistance(expr: Expr, other: number[]): CosineDistance;
function cosineDistance(expr: Expr, other: VectorValue): CosineDistance;
function cosineDistance(expr: string, other: Expr): CosineDistance;
function cosineDistance(expr: string, other: number[]): CosineDistance;
function cosineDistance(expr: string, other: VectorValue): CosineDistance;
function cosineDistance(
  expr: Expr | string,
  other: Expr | number[] | VectorValue
): CosineDistance {
  const expr1 = expr instanceof Expr ? expr : Field.of(expr);
  const expr2 = other instanceof Expr ? other : Constant.ofVector(other);
  return new CosineDistance(expr1, expr2);
}

function dotProductDistance(expr: Expr, other: Expr): DotProductDistance; // Fixed return type
function dotProductDistance(expr: Expr, other: number[]): DotProductDistance;
function dotProductDistance(expr: Expr, other: VectorValue): DotProductDistance;
function dotProductDistance(expr: string, other: Expr): DotProductDistance;
function dotProductDistance(expr: string, other: number[]): DotProductDistance;
function dotProductDistance(
  expr: string,
  other: VectorValue
): DotProductDistance;
function dotProductDistance(
  expr: Expr | string,
  other: Expr | number[] | VectorValue
): DotProductDistance {
  const expr1 = expr instanceof Expr ? expr : Field.of(expr);
  const expr2 = other instanceof Expr ? other : Constant.ofVector(other);
  return new DotProductDistance(expr1, expr2);
}

function euclideanDistance(expr: Expr, other: Expr): EuclideanDistance;
function euclideanDistance(expr: Expr, other: number[]): EuclideanDistance;
function euclideanDistance(expr: Expr, other: VectorValue): EuclideanDistance;
function euclideanDistance(expr: string, other: Expr): EuclideanDistance;
function euclideanDistance(expr: string, other: number[]): EuclideanDistance;
function euclideanDistance(expr: string, other: VectorValue): EuclideanDistance;
function euclideanDistance(
  expr: Expr | string,
  other: Expr | number[] | VectorValue
): EuclideanDistance {
  const expr1 = expr instanceof Expr ? expr : Field.of(expr);
  const expr2 = other instanceof Expr ? other : Constant.ofVector(other);
  return new EuclideanDistance(expr1, expr2);
}

function genericFunction(name: string, params: Expr[]): Function {
  return new Function(name, params);
}

export class Ordering {
  constructor(
    private expr: Expr,
    private direction: 'asc' | 'desc'
  ) {}

  static of(
    expr: Expr,
    direction: 'asc' | 'desc' | undefined = undefined
  ): Ordering {
    return new Ordering(expr, direction || 'asc');
  }
  static ascending(expr: Expr): Ordering {
    return new Ordering(expr, 'asc');
  }
  static descending(expr: Expr): Ordering {
    return new Ordering(expr, 'desc');
  }
}
