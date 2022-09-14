// Copyright 2022 Google LLC
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

import {expect} from 'chai';

import {Firestore} from '../src';
import {AggregateField} from "@google-cloud/firestore";

export async function Demo0_NormalQuery(db: Firestore) {
  const query = db.collection('games/halo/players');
  const snapshot = await query.get();
  expect(snapshot.size).to.equal(5000000);
}

export async function Demo1_CountOfDocumentsInACollection(db: Firestore) {
  const collection = db.collection('games/halo/players');
  const snapshot = await collection.count().get();
  expect(snapshot.data().count).to.equal(5000000);
}

export async function Demo2_CountOfDocumentsInACollectionWithFilter(db: Firestore) {
  const collection = db.collection('games/halo/players');
  const query = collection.where('online', '==', true);
  const snapshot = await collection.count().get();
  expect(snapshot.data().count).to.equal(2000);
}

export async function Demo3_MultipleAggregations(db: Firestore) {
  const collection = db.collection('games/halo/players');
  const snapshot = await collection.aggregate({
    num_players: AggregateField.count(),
    min_age: AggregateField.min('age'),
    score: AggregateField.sum('score'),
  }).get();
  const num_players: number = snapshot.data().num_players;
  const min_age = snapshot.data().min_age ?? 0;
  const total_points: number = snapshot.data().score ?? 0;
  console.log(
    `Found ${num_players} players, ` +
    `the youngest being ${min_age} years old ` +
    `with a total of ${total_points} points.`
  );
}
