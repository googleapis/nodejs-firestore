/**
 * Copyright 2023 Google LLC. All Rights Reserved.
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

import {Span} from './span';

export interface Attributes {
  [attributeKey: string]: AttributeValue | undefined;
}
export declare type AttributeValue =
  | string
  | number
  | boolean
  | Array<string>
  | Array<number>
  | Array<boolean>;

/**
 * Span names for instrumented operations.
 */
export const SPAN_NAME_DOC_REF_GET = "DocumentReference.Get";

export const SERVICE = "google.firestore.v1.Firestore/";
export const BATCH_GET_DOCUMENTS_RPC_NAME = "BatchGetDocuments";

export interface TraceUtil {
  startActiveSpan<F extends (span: Span) => unknown>(
    name: string,
    fn: F,
    attributes?: Attributes
  ): ReturnType<F>;
  startSpan(name: string): Span;
}
