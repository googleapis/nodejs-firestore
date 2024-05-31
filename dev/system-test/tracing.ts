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

import * as chaiAsPromised from 'chai-as-promised';

import {expect, use} from 'chai';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {verifyInstance} from '../test/util/helpers';
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node';
import {Firestore} from '../src';
import {Settings} from '@google-cloud/firestore';

use(chaiAsPromised);

describe.only('Tracing with InMemorySpanExporter', () => {
  let firestore: Firestore;
  let tracerProvider: NodeTracerProvider;
  let inMemorySpanExporter: InMemorySpanExporter;

  beforeEach(async () => {
    tracerProvider = new NodeTracerProvider();
    inMemorySpanExporter = new InMemorySpanExporter();
    tracerProvider.addSpanProcessor(
      new SimpleSpanProcessor(inMemorySpanExporter)
    );
    tracerProvider.register();

    const internalSettings: Settings = {};
    if (process.env.FIRESTORE_NAMED_DATABASE) {
      internalSettings.databaseId = process.env.FIRESTORE_NAMED_DATABASE;
    }

    if (!internalSettings.projectId && process.env.PROJECT_ID) {
      internalSettings.projectId = process.env.PROJECT_ID;
    }

    if (!internalSettings.databaseId && process.env.DATABASE_ID) {
      internalSettings.databaseId = process.env.DATABASE_ID;
    }

    firestore = new Firestore({
      ...internalSettings,
      openTelemetryOptions: {
        enableTracing: true,
        traceProvider: tracerProvider,
      },
    });
  });

  afterEach(() => {
    return verifyInstance(firestore);
  });

  async function waitForCompletedSpans(): Promise<void> {
    await inMemorySpanExporter.forceFlush();
  }

  it('doc.get()', async () => {
    await firestore.collection('foo').doc('bar').get();
    await waitForCompletedSpans();
    const spans = inMemorySpanExporter.getFinishedSpans();
    spans.forEach(span => {
      console.log(span.name);
    });
    expect(spans.length).to.equal(1);
  });
});
