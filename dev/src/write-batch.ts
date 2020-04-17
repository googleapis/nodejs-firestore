/*!
 * Copyright 2019 Google Inc. All Rights Reserved.
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


import {google} from '../protos/firestore_v1_proto_api';
import {Firestore} from './index';

import api = google.firestore.v1;
import {UpdateBuilder, WriteResult} from "./update-builder";


/**
 * A Firestore WriteBatch that can be used to atomically commit multiple write
 * operations at once.
 *
 * @class
 */
export class WriteBatch extends UpdateBuilder<WriteBatch> {

  /**
   * @hideconstructor
   *
   * @param firestore The Firestore Database client.
   */
  constructor(firestore: Firestore) {
    super(firestore, 500);
  }
  
  commit(): Promise<WriteResult[]> {
    return this.commit_();
  }

  wrapResult(): WriteBatch {
    return this
  }
}
