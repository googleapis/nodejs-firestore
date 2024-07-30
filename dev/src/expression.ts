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

export interface Selectable {
  selectable: true;
}

export interface FilterCondition {
  filterable: true;
}

export interface Accumulator {
  accumulator: true;
}
export type AccumulatorTarget = ExprWithAlias<Expr & Accumulator>;

export type FilterExpr = Expr & FilterCondition;

export type SelectableExpr = Expr & Selectable;

export type ExprType =
  | 'Field'
  | 'Constant'
  | 'Function'
  | 'ListOfExprs'
  | 'ExprWithAlias';

export abstract class Expr {
  add(other: Expr): Add;
  add(other: any): Add;
  add(other: any): Add {
    if (other instanceof Expr) {
      return new Add(this, other);
    }
    return new Add(this, Constant.of(other));
  }

  subtract(other: Expr): Subtract;
  subtract(other: any): Subtract;
  subtract(other: any): Subtract {
    if (other instanceof Expr) {
      return new Subtract(this, other);
    }
    return new Subtract(this, Constant.of(other));
  }

  multiply(other: Expr): Multiply;
  multiply(other: any): Multiply;
  multiply(other: any): Multiply {
    if (other instanceof Expr) {
      return new Multiply(this, other);
    }
    return new Multiply(this, Constant.of(other));
  }

  divide(other: Expr): Divide;
  divide(other: any): Divide;
  divide(other: any): Divide {
    if (other instanceof Expr) {
      return new Divide(this, other);
    }
    return new Divide(this, Constant.of(other));
  }

  eq(other: Expr): Eq;
  eq(other: any): Eq;
  eq(other: any): Eq {
    if (other instanceof Expr) {
      return new Eq(this, other);
    }
    return new Eq(this, Constant.of(other));
  }

  neq(other: Expr): Neq;
  neq(other: any): Neq;
  neq(other: any): Neq {
    if (other instanceof Expr) {
      return new Neq(this, other);
    }
    return new Neq(this, Constant.of(other));
  }

  lt(other: Expr): Lt;
  lt(other: any): Lt;
  lt(other: any): Lt {
    if (other instanceof Expr) {
      return new Lt(this, other);
    }
    return new Lt(this, Constant.of(other));
  }

  lte(other: Expr): Lte;
  lte(other: any): Lte;
  lte(other: any): Lte {
    if (other instanceof Expr) {
      return new Lte(this, other);
    }
    return new Lte(this, Constant.of(other));
  }

  gt(other: Expr): Gt;
  gt(other: any): Gt;
  gt(other: any): Gt {
    if (other instanceof Expr) {
      return new Gt(this, other);
    }
    return new Gt(this, Constant.of(other));
  }

  gte(other: Expr): Gte;
  gte(other: any): Gte;
  gte(other: any): Gte {
    if (other instanceof Expr) {
      return new Gte(this, other);
    }
    return new Gte(this, Constant.of(other));
  }

  arrayConcat(...values: Expr[]): ArrayConcat;
  arrayConcat(...values: any[]): ArrayConcat;
  arrayConcat(...values: any[]): ArrayConcat {
    const exprValues = values.map(value =>
      value instanceof Expr ? value : Constant.of(value)
    );
    return new ArrayConcat(this, exprValues);
  }

  arrayContains(element: Expr): ArrayContains;
  arrayContains(element: any): ArrayContains;
  arrayContains(element: any): ArrayContains {
    if (element instanceof Expr) {
      return new ArrayContains(this, element);
    }
    return new ArrayContains(this, Constant.of(element));
  }

  arrayContainsAll(...values: Expr[]): ArrayContainsAll;
  arrayContainsAll(...values: any[]): ArrayContainsAll;
  arrayContainsAll(...values: any[]): ArrayContainsAll {
    const exprValues = values.map(value =>
      value instanceof Expr ? value : Constant.of(value)
    );
    return new ArrayContainsAll(this, exprValues);
  }

  arrayContainsAny(...values: Expr[]): ArrayContainsAny;
  arrayContainsAny(...values: any[]): ArrayContainsAny;
  arrayContainsAny(...values: any[]): ArrayContainsAny {
    const exprValues = values.map(value =>
      value instanceof Expr ? value : Constant.of(value)
    );
    return new ArrayContainsAny(this, exprValues);
  }

  arrayFilter(filter: FilterExpr): ArrayFilter {
    return new ArrayFilter(this, filter);
  }

  arrayLength(): ArrayLength {
    return new ArrayLength(this);
  }

  arrayTransform(transform: Function): ArrayTransform {
    return new ArrayTransform(this, transform);
  }

  in(...others: Expr[]): In;
  in(...others: any[]): In;
  in(...others: any[]): In {
    const exprOthers = others.map(other =>
      other instanceof Expr ? other : Constant.of(other)
    );
    return new In(this, exprOthers);
  }

  isNaN(): IsNan {
    return new IsNan(this);
  }

  isNull(): IsNull {
    return new IsNull(this);
  }

  exists(): Exists {
    return new Exists(this);
  }

  length(): Length {
    return new Length(this);
  }

  like(pattern: string): Like;
  like(pattern: Expr): Like;
  like(stringOrExpr: string | Expr): Like {
    if (stringOrExpr instanceof Expr) {
      return new Like(this, stringOrExpr);
    }
    return new Like(this, Constant.of(stringOrExpr));
  }

  regexContains(pattern: string): RegexContains;
  regexContains(pattern: Expr): RegexContains;
  regexContains(stringOrExpr: string | Expr): RegexContains {
    if (stringOrExpr instanceof Expr) {
      return new RegexContains(this, stringOrExpr);
    }
    return new RegexContains(this, Constant.of(stringOrExpr));
  }

  regexMatch(pattern: string): RegexMatch;
  regexMatch(pattern: Expr): RegexMatch;
  regexMatch(stringOrExpr: string | Expr): RegexMatch {
    if (stringOrExpr instanceof Expr) {
      return new RegexMatch(this, stringOrExpr);
    }
    return new RegexMatch(this, Constant.of(stringOrExpr));
  }

  startsWith(prefix: string): StartsWith;
  startsWith(prefix: Expr): StartsWith;
  startsWith(stringOrExpr: string | Expr): StartsWith {
    if (stringOrExpr instanceof Expr) {
      return new StartsWith(this, stringOrExpr);
    }
    return new StartsWith(this, Constant.of(stringOrExpr));
  }

  endsWith(suffix: string): EndsWith;
  endsWith(suffix: Expr): EndsWith;
  endsWith(stringOrExpr: string | Expr): EndsWith {
    if (stringOrExpr instanceof Expr) {
      return new EndsWith(this, stringOrExpr);
    }
    return new EndsWith(this, Constant.of(stringOrExpr));
  }

  toLowercase(): ToLowercase {
    return new ToLowercase(this);
  }

  toUppercase(): ToUppercase {
    return new ToUppercase(this);
  }

  trim(): Trim {
    return new Trim(this);
  }

  strConcat(...elements: (string | Expr)[]): StrConcat {
    const exprs = elements.map(e => (e instanceof Expr ? e : Constant.of(e)));
    return new StrConcat(this, exprs);
  }

  mapGet(subfield: string): MapGet {
    return new MapGet(this, subfield);
  }

  count(): Count {
    return new Count(this, false);
  }

  sum(): Sum {
    return new Sum(this, false);
  }

  avg(): Avg {
    return new Avg(this, false);
  }

  min(): Min {
    return new Min(this, false);
  }

  max(): Max {
    return new Max(this, false);
  }

  cosineDistance(other: Expr): CosineDistance;
  cosineDistance(other: VectorValue): CosineDistance;
  cosineDistance(other: number[]): CosineDistance;
  cosineDistance(other: Expr | VectorValue | number[]): CosineDistance {
    if (other instanceof Expr) {
      return new CosineDistance(this, other);
    } else {
      return new CosineDistance(this, Constant.ofVector(other));
    }
  }

  dotProductDistance(other: Expr): DotProductDistance;
  dotProductDistance(other: VectorValue): DotProductDistance;
  dotProductDistance(other: number[]): DotProductDistance;
  dotProductDistance(other: Expr | VectorValue | number[]): DotProductDistance {
    if (other instanceof Expr) {
      return new DotProductDistance(this, other);
    } else {
      return new DotProductDistance(this, Constant.ofVector(other));
    }
  }

  euclideanDistance(other: Expr): EuclideanDistance;
  euclideanDistance(other: VectorValue): EuclideanDistance;
  euclideanDistance(other: number[]): EuclideanDistance;
  euclideanDistance(other: Expr | VectorValue | number[]): EuclideanDistance {
    if (other instanceof Expr) {
      return new EuclideanDistance(this, other);
    } else {
      return new EuclideanDistance(this, Constant.ofVector(other));
    }
  }

  ascending(): Ordering {
    return Ordering.ascending(this);
  }

  descending(): Ordering {
    return Ordering.descending(this);
  }

  as(name: string): ExprWithAlias<typeof this> {
    return new ExprWithAlias(this, name);
  }

  abstract _toProto(serializer: Serializer): api.IValue;
}

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

export class Field extends Expr implements Selectable {
  exprType: ExprType = 'Field';
  selectable = true as const;

  private constructor(
    private fieldPath: firestore.FieldPath,
    private pipeline: Pipeline | null = null
  ) {
    super();
  }

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

  _toProto(serializer: Serializer): api.IValue {
    if (isFirestoreValue(this.value)) {
      return this.value;
    }

    return serializer.encodeValue(this.value)!;
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

  _toProto(serializer: Serializer): api.IValue {
    return {
      functionValue: {
        name: this.name,
        args: this.params.map(p => serializer.encodeValue(p)!),
      },
    };
  }
}

export class Add extends Function {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('add', [left, right]);
  }
}

export class Subtract extends Function {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('subtract', [left, right]);
  }
}

export class Multiply extends Function {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('multiply', [left, right]);
  }
}

export class Divide extends Function {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('divide', [left, right]);
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

class Neq extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('neq', [left, right]);
  }
  filterable = true as const;
}

class Lt extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('lt', [left, right]);
  }
  filterable = true as const;
}

class Lte extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('lte', [left, right]);
  }
  filterable = true as const;
}

class Gt extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('gt', [left, right]);
  }
  filterable = true as const;
}

class Gte extends Function implements FilterCondition {
  constructor(
    private left: Expr,
    private right: Expr
  ) {
    super('gte', [left, right]);
  }
  filterable = true as const;
}

class ArrayConcat extends Function {
  constructor(
    private array: Expr,
    private elements: Expr[]
  ) {
    super('array_concat', [array, ...elements]);
  }
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

class ArrayContainsAll extends Function implements FilterCondition {
  constructor(
    private array: Expr,
    private values: Expr[]
  ) {
    super('array_contains_all', [array, new ListOfExprs(values)]);
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

class ArrayFilter extends Function {
  constructor(
    private array: Expr,
    private filter: FilterExpr
  ) {
    super('array_filter', [array, filter]);
  }
}

class ArrayLength extends Function {
  constructor(private array: Expr) {
    super('array_length', [array]);
  }
}

class ArrayTransform extends Function {
  constructor(
    private array: Expr,
    private transform: Function
  ) {
    super('array_transform', [array, transform]);
  }
}

class ArrayElement extends Function {
  constructor() {
    super('array_element', []);
  }
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

class Exists extends Function implements FilterCondition {
  constructor(private expr: Expr) {
    super('exists', [expr]);
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

class Xor extends Function implements FilterCondition {
  constructor(private conditions: FilterExpr[]) {
    super('xor', conditions);
  }
  filterable = true as const;
}

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

class Length extends Function {
  constructor(private expr: Expr) {
    super('length', [expr]);
  }
}

class Like extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private pattern: Expr
  ) {
    super('like', [expr, pattern]);
  }
  filterable = true as const;
}

class RegexContains extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private pattern: Expr
  ) {
    super('regex_contains', [expr, pattern]);
  }
  filterable = true as const;
}

class RegexMatch extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private pattern: Expr
  ) {
    super('regex_match', [expr, pattern]);
  }
  filterable = true as const;
}

class StartsWith extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private prefix: Expr
  ) {
    super('starts_with', [expr, prefix]);
  }
  filterable = true as const;
}

class EndsWith extends Function implements FilterCondition {
  constructor(
    private expr: Expr,
    private suffix: Expr
  ) {
    super('ends_with', [expr, suffix]);
  }
  filterable = true as const;
}

class ToLowercase extends Function {
  constructor(private expr: Expr) {
    super('to_lowercase', [expr]);
  }
}

class ToUppercase extends Function {
  constructor(private expr: Expr) {
    super('to_uppercase', [expr]);
  }
}

class Trim extends Function {
  constructor(private expr: Expr) {
    super('trim', [expr]);
  }
}

class StrConcat extends Function {
  constructor(
    private first: Expr,
    private rest: Expr[]
  ) {
    super('str_concat', [first, ...rest]);
  }
}

class MapGet extends Function {
  constructor(map: Expr, name: string) {
    super('map_get', [map, Constant.of(name)]);
  }
}

class Count extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr | undefined,
    private distinct: boolean
  ) {
    super('count', value === undefined ? [] : [value]);
  }
}

class Sum extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('sum', [value]);
  }
}

class Avg extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('avg', [value]);
  }
}

class Min extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('min', [value]);
  }
}

class Max extends Function implements Accumulator {
  accumulator = true as const;
  constructor(
    private value: Expr,
    private distinct: boolean
  ) {
    super('max', [value]);
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

export function add(left: Expr, right: Expr): Add;
export function add(left: Expr, right: any): Add;
export function add(left: string, right: Expr): Add;
export function add(left: string, right: any): Add;
export function add(left: Expr | string, right: Expr | any): Add {
  const normalizedLeft = typeof left === 'string' ? Field.of(left) : left;
  const normalizedRight = right instanceof Expr ? right : Constant.of(right);
  return new Add(normalizedLeft, normalizedRight);
}

export function subtract(left: Expr, right: Expr): Subtract;
export function subtract(left: Expr, right: any): Subtract;
export function subtract(left: string, right: Expr): Subtract;
export function subtract(left: string, right: any): Subtract;
export function subtract(left: Expr | string, right: Expr | any): Subtract {
  const normalizedLeft = typeof left === 'string' ? Field.of(left) : left;
  const normalizedRight = right instanceof Expr ? right : Constant.of(right);
  return new Subtract(normalizedLeft, normalizedRight);
}

export function multiply(left: Expr, right: Expr): Multiply;
export function multiply(left: Expr, right: any): Multiply;
export function multiply(left: string, right: Expr): Multiply;
export function multiply(left: string, right: any): Multiply;
export function multiply(left: Expr | string, right: Expr | any): Multiply {
  const normalizedLeft = typeof left === 'string' ? Field.of(left) : left;
  const normalizedRight = right instanceof Expr ? right : Constant.of(right);
  return new Multiply(normalizedLeft, normalizedRight);
}

export function divide(left: Expr, right: Expr): Divide;
export function divide(left: Expr, right: any): Divide;
export function divide(left: string, right: Expr): Divide;
export function divide(left: string, right: any): Divide;
export function divide(left: Expr | string, right: Expr | any): Divide {
  const normalizedLeft = typeof left === 'string' ? Field.of(left) : left;
  const normalizedRight = right instanceof Expr ? right : Constant.of(right);
  return new Divide(normalizedLeft, normalizedRight);
}

export function eq(left: Expr, right: Expr): Eq;
export function eq(left: Expr, right: any): Eq;
export function eq(left: string, right: Expr): Eq;
export function eq(left: string, right: any): Eq;
export function eq(left: Expr | string, right: any): Eq {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Eq(leftExpr, rightExpr);
}

export function neq(left: Expr, right: Expr): Neq;
export function neq(left: Expr, right: any): Neq;
export function neq(left: string, right: Expr): Neq;
export function neq(left: string, right: any): Neq;
export function neq(left: Expr | string, right: any): Neq {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Neq(leftExpr, rightExpr);
}

export function lt(left: Expr, right: Expr): Lt;
export function lt(left: Expr, right: any): Lt;
export function lt(left: string, right: Expr): Lt;
export function lt(left: string, right: any): Lt;
export function lt(left: Expr | string, right: any): Lt {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Lt(leftExpr, rightExpr);
}

export function lte(left: Expr, right: Expr): Lte;
export function lte(left: Expr, right: any): Lte;
export function lte(left: string, right: Expr): Lte;
export function lte(left: string, right: any): Lte;
export function lte(left: Expr | string, right: any): Lte {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Lte(leftExpr, rightExpr);
}

export function gt(left: Expr, right: Expr): Gt;
export function gt(left: Expr, right: any): Gt;
export function gt(left: string, right: Expr): Gt;
export function gt(left: string, right: any): Gt;
export function gt(left: Expr | string, right: any): Gt {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Gt(leftExpr, rightExpr);
}

export function gte(left: Expr, right: Expr): Gte;
export function gte(left: Expr, right: any): Gte;
export function gte(left: string, right: Expr): Gte;
export function gte(left: string, right: any): Gte;
export function gte(left: Expr | string, right: any): Gte {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const rightExpr = right instanceof Expr ? right : Constant.of(right);
  return new Gte(leftExpr, rightExpr);
}

export function arrayConcat(array: Expr, elements: Expr[]): ArrayConcat;
export function arrayConcat(array: Expr, elements: any[]): ArrayConcat;
export function arrayConcat(array: string, elements: Expr[]): ArrayConcat;
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

export function arrayContains(array: Expr, element: Expr): ArrayContains;
export function arrayContains(array: Expr, element: any): ArrayContains;
export function arrayContains(array: string, element: Expr): ArrayContains;
export function arrayContains(array: string, element: any): ArrayContains;
export function arrayContains(
  array: Expr | string,
  element: any
): ArrayContains {
  const arrayExpr = array instanceof Expr ? array : Field.of(array);
  const elementExpr = element instanceof Expr ? element : Constant.of(element);
  return new ArrayContains(arrayExpr, elementExpr);
}

export function arrayContainsAny(array: Expr, values: Expr[]): ArrayContainsAny;
export function arrayContainsAny(array: Expr, values: any[]): ArrayContainsAny;
export function arrayContainsAny(
  array: string,
  values: Expr[]
): ArrayContainsAny;
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

export function arrayContainsAll(array: Expr, values: Expr[]): ArrayContainsAll;
export function arrayContainsAll(array: Expr, values: any[]): ArrayContainsAll;
export function arrayContainsAll(
  array: string,
  values: Expr[]
): ArrayContainsAll;
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

export function arrayFilter(array: Expr, filter: FilterExpr): ArrayFilter {
  return new ArrayFilter(array, filter);
}

export function arrayLength(array: Expr): ArrayLength {
  return new ArrayLength(array);
}

export function arrayTransform(
  array: Expr,
  transform: Function
): ArrayTransform {
  return new ArrayTransform(array, transform);
}

export function arrayElement(): ArrayElement {
  return new ArrayElement();
}

export function inAny(element: Expr, others: Expr[]): In;
export function inAny(element: Expr, others: any[]): In;
export function inAny(element: string, others: Expr[]): In; // Added overload
export function inAny(element: string, others: any[]): In; // Added overload
export function inAny(element: Expr | string, others: any[]): In {
  const elementExpr = element instanceof Expr ? element : Field.of(element);
  const exprOthers = others.map(other =>
    other instanceof Expr ? other : Constant.of(other)
  );
  return new In(elementExpr, exprOthers);
}

export function notInAny(element: Expr, others: Expr[]): Not;
export function notInAny(element: Expr, others: any[]): Not;
export function notInAny(element: string, others: Expr[]): Not; // Added overload
export function notInAny(element: string, others: any[]): Not; // Added overload
export function notInAny(element: Expr | string, others: any[]): Not {
  const elementExpr = element instanceof Expr ? element : Field.of(element);
  const exprOthers = others.map(other =>
    other instanceof Expr ? other : Constant.of(other)
  );
  return new Not(new In(elementExpr, exprOthers));
}

export function and(left: FilterExpr, ...right: FilterExpr[]): And {
  return new And([left, ...right]);
}

export function or(left: FilterExpr, ...right: FilterExpr[]): Or {
  return new Or([left, ...right]);
}

export function xor(left: FilterExpr, ...right: FilterExpr[]): Xor {
  return new Xor([left, ...right]);
}

export function ifFunction(
  condition: FilterExpr,
  thenExpr: Expr,
  elseExpr: Expr
): If {
  return new If(condition, thenExpr, elseExpr);
}

export function not(filter: FilterExpr): Not {
  return new Not(filter);
}

export function exists(value: Expr): Exists;
export function exists(field: string): Exists;
export function exists(valueOrField: Expr | string): Exists {
  const valueExpr =
    valueOrField instanceof Expr ? valueOrField : Field.of(valueOrField);
  return new Exists(valueExpr);
}

export function isNull(value: Expr): IsNull;
export function isNull(value: string): IsNull;
export function isNull(value: Expr | string): IsNull {
  const valueExpr = value instanceof Expr ? value : Field.of(value);
  return new IsNull(valueExpr);
}

export function isNan(value: Expr): IsNan;
export function isNan(value: string): IsNan;
export function isNan(value: Expr | string): IsNan {
  const valueExpr = value instanceof Expr ? value : Field.of(value);
  return new IsNan(valueExpr);
}

export function length(field: string): Length;
export function length(expr: Expr): Length;
export function length(value: Expr | string): Length {
  const valueExpr = value instanceof Expr ? value : Field.of(value);
  return new Length(valueExpr);
}

export function like(left: Expr, pattern: Expr): Like;
export function like(left: Expr, pattern: string): Like;
export function like(left: string, pattern: Expr): Like;
export function like(left: string, pattern: string): Like;
export function like(left: Expr | string, pattern: Expr | string): Like {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const patternExpr = pattern instanceof Expr ? pattern : Constant.of(pattern);
  return new Like(leftExpr, patternExpr);
}

export function regexContains(left: Expr, pattern: Expr): RegexContains;
export function regexContains(left: Expr, pattern: string): RegexContains;
export function regexContains(left: string, pattern: Expr): RegexContains;
export function regexContains(left: string, pattern: string): RegexContains;
export function regexContains(
  left: Expr | string,
  pattern: Expr | string
): RegexContains {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const patternExpr = pattern instanceof Expr ? pattern : Constant.of(pattern);
  return new RegexContains(leftExpr, patternExpr);
}

export function regexMatch(left: Expr, pattern: Expr): RegexMatch;
export function regexMatch(left: Expr, pattern: string): RegexMatch;
export function regexMatch(left: string, pattern: Expr): RegexMatch;
export function regexMatch(left: string, pattern: string): RegexMatch;
export function regexMatch(
  left: Expr | string,
  pattern: Expr | string
): RegexMatch {
  const leftExpr = left instanceof Expr ? left : Field.of(left);
  const patternExpr = pattern instanceof Expr ? pattern : Constant.of(pattern);
  return new RegexMatch(leftExpr, patternExpr);
}

export function startsWith(expr: Expr, prefix: Expr): StartsWith;
export function startsWith(expr: Expr, prefix: string): StartsWith;
export function startsWith(expr: string, prefix: Expr): StartsWith;
export function startsWith(expr: string, prefix: string): StartsWith;
export function startsWith(
  expr: Expr | string,
  prefix: Expr | string
): StartsWith {
  const exprLeft = expr instanceof Expr ? expr : Field.of(expr);
  const prefixExpr = prefix instanceof Expr ? prefix : Constant.of(prefix);
  return new StartsWith(exprLeft, prefixExpr);
}

export function endsWith(expr: Expr, suffix: Expr): EndsWith;
export function endsWith(expr: Expr, suffix: string): EndsWith;
export function endsWith(expr: string, suffix: Expr): EndsWith;
export function endsWith(expr: string, suffix: string): EndsWith;
export function endsWith(expr: Expr | string, suffix: Expr | string): EndsWith {
  const exprLeft = expr instanceof Expr ? expr : Field.of(expr);
  const suffixExpr = suffix instanceof Expr ? suffix : Constant.of(suffix);
  return new EndsWith(exprLeft, suffixExpr);
}

export function toLowercase(expr: Expr): ToLowercase;
export function toLowercase(expr: string): ToLowercase;
export function toLowercase(expr: Expr | string): ToLowercase {
  return new ToLowercase(expr instanceof Expr ? expr : Field.of(expr));
}

export function toUppercase(expr: Expr): ToUppercase;
export function toUppercase(expr: string): ToUppercase;
export function toUppercase(expr: Expr | string): ToUppercase {
  return new ToUppercase(expr instanceof Expr ? expr : Field.of(expr));
}

export function trim(expr: Expr): Trim;
export function trim(expr: string): Trim;
export function trim(expr: Expr | string): Trim {
  return new Trim(expr instanceof Expr ? expr : Field.of(expr));
}

export function strConcat(
  first: string,
  ...elements: (Expr | string)[]
): StrConcat;
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

export function mapGet(mapField: string, subField: string): MapGet;
export function mapGet(mapExpr: Expr, subField: string): MapGet;
export function mapGet(fieldOrExpr: string | Expr, subField: string): MapGet {
  return new MapGet(
    typeof fieldOrExpr === 'string' ? Field.of(fieldOrExpr) : fieldOrExpr,
    subField
  );
}

export function countAll(): Count {
  return new Count(undefined, false);
}

export function count(value: Expr): Count;
export function count(value: string): Count;
export function count(value: Expr | string): Count {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Count(exprValue, false);
}

export function sum(value: Expr): Sum;
export function sum(value: string): Sum;
export function sum(value: Expr | string): Sum {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Sum(exprValue, false);
}

export function avg(value: Expr): Avg;
export function avg(value: string): Avg;
export function avg(value: Expr | string): Avg {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Avg(exprValue, false);
}

export function min(value: Expr): Min;
export function min(value: string): Min;
export function min(value: Expr | string): Min {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Min(exprValue, false);
}

export function max(value: Expr): Max;
export function max(value: string): Max;
export function max(value: Expr | string): Max {
  const exprValue = value instanceof Expr ? value : Field.of(value);
  return new Max(exprValue, false);
}

export function cosineDistance(expr: Expr, other: Expr): CosineDistance;
export function cosineDistance(expr: Expr, other: number[]): CosineDistance;
export function cosineDistance(expr: Expr, other: VectorValue): CosineDistance;
export function cosineDistance(expr: string, other: Expr): CosineDistance;
export function cosineDistance(expr: string, other: number[]): CosineDistance;
export function cosineDistance(
  expr: string,
  other: VectorValue
): CosineDistance;
export function cosineDistance(
  expr: Expr | string,
  other: Expr | number[] | VectorValue
): CosineDistance {
  const expr1 = expr instanceof Expr ? expr : Field.of(expr);
  const expr2 = other instanceof Expr ? other : Constant.ofVector(other);
  return new CosineDistance(expr1, expr2);
}

export function dotProductDistance(expr: Expr, other: Expr): DotProductDistance; // Fixed return type
export function dotProductDistance(
  expr: Expr,
  other: number[]
): DotProductDistance;
export function dotProductDistance(
  expr: Expr,
  other: VectorValue
): DotProductDistance;
export function dotProductDistance(
  expr: string,
  other: Expr
): DotProductDistance;
export function dotProductDistance(
  expr: string,
  other: number[]
): DotProductDistance;
export function dotProductDistance(
  expr: string,
  other: VectorValue
): DotProductDistance;
export function dotProductDistance(
  expr: Expr | string,
  other: Expr | number[] | VectorValue
): DotProductDistance {
  const expr1 = expr instanceof Expr ? expr : Field.of(expr);
  const expr2 = other instanceof Expr ? other : Constant.ofVector(other);
  return new DotProductDistance(expr1, expr2);
}

export function euclideanDistance(expr: Expr, other: Expr): EuclideanDistance;
export function euclideanDistance(
  expr: Expr,
  other: number[]
): EuclideanDistance;
export function euclideanDistance(
  expr: Expr,
  other: VectorValue
): EuclideanDistance;
export function euclideanDistance(expr: string, other: Expr): EuclideanDistance;
export function euclideanDistance(
  expr: string,
  other: number[]
): EuclideanDistance;
export function euclideanDistance(
  expr: string,
  other: VectorValue
): EuclideanDistance;
export function euclideanDistance(
  expr: Expr | string,
  other: Expr | number[] | VectorValue
): EuclideanDistance {
  const expr1 = expr instanceof Expr ? expr : Field.of(expr);
  const expr2 = other instanceof Expr ? other : Constant.ofVector(other);
  return new EuclideanDistance(expr1, expr2);
}

export function genericFunction(name: string, params: Expr[]): Function {
  return new Function(name, params);
}

export class Ordering {
  constructor(
    private expr: Expr,
    private direction: 'ascending' | 'descending'
  ) {}

  static of(
    expr: Expr,
    direction: 'ascending' | 'descending' | undefined = undefined
  ): Ordering {
    return new Ordering(expr, direction || 'ascending');
  }
  static ascending(expr: Expr): Ordering {
    return new Ordering(expr, 'ascending');
  }
  static descending(expr: Expr): Ordering {
    return new Ordering(expr, 'descending');
  }

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
