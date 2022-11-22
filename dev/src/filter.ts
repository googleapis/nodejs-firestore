/*!
 * Copyright 2022 Google Inc. All Rights Reserved.
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

import * as firestore from '@google-cloud/firestore';

export abstract class Filter {
  public static where(
    fieldPath: string | firestore.FieldPath,
    opStr: firestore.WhereFilterOp,
    value: unknown
  ): Filter {
    return new UnaryFilter(fieldPath, opStr, value);
  }

  public static or(...filters: Filter[]): Filter {
    return new CompositeFilter(filters, 'OR');
  }

  public static and(...filters: Filter[]): Filter {
    return new CompositeFilter(filters, 'AND');
  }
}

export class UnaryFilter extends Filter {
  public constructor(
    private field: string | firestore.FieldPath,
    private operator: firestore.WhereFilterOp,
    private value: unknown
  ) {
    super();
  }

  public getField(): string | firestore.FieldPath {
    return this.field;
  }

  public getOperator(): firestore.WhereFilterOp {
    return this.operator;
  }

  public getValue(): unknown {
    return this.value;
  }
}

export class CompositeFilter extends Filter {
  public constructor(
    private filters: Filter[],
    private operator: CompositeOperator
  ) {
    super();
  }

  public getFilters(): Filter[] {
    return this.filters;
  }

  public getOperator(): CompositeOperator {
    return this.operator;
  }
}

// TODO use operator exported from Protos
export type CompositeOperator = 'AND' | 'OR';
