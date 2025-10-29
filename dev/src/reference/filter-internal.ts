/**
 * Copyright 2024 Google LLC. All Rights Reserved.
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

import {Filter} from '../filter';
import {FieldFilterInternal} from './field-filter-internal';

export abstract class FilterInternal {
  /** Returns a list of all field filters that are contained within this filter */
  abstract getFlattenedFilters(): FieldFilterInternal[];

  /** Returns a list of all filters that are contained within this filter */
  abstract getFilters(): FilterInternal[];

  /** Returns the proto representation of this filter */
  abstract toProto(): Filter;

  abstract isEqual(other: FilterInternal): boolean;
}
