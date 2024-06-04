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
import {TraceExporter} from "@google-cloud/opentelemetry-cloud-trace-exporter";
import {Settings} from "@google-cloud/firestore";
import {
  AlwaysOnSampler,
  ConsoleSpanExporter,
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node';
import {setLogFunction, Firestore} from '../src';
import {verifyInstance} from '../test/util/helpers';
import {SPAN_NAME_DOC_REF_GET} from "../src/telemetry/trace-util";
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

use(chaiAsPromised);

describe.only('Tracing with InMemorySpanExporter', () => {

  let firestore: Firestore;
  let tracerProvider: NodeTracerProvider;
  let inMemorySpanExporter: InMemorySpanExporter;

  beforeEach(async () => {

    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

    tracerProvider = new NodeTracerProvider(
        {
          sampler: new AlwaysOnSampler()
        }
    );

    inMemorySpanExporter = new InMemorySpanExporter();
    tracerProvider.addSpanProcessor(new SimpleSpanProcessor(inMemorySpanExporter));
    tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
    tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new TraceExporter()));
    tracerProvider.register();


    setLogFunction((msg: string) => {
      console.log(`LOG: ${msg}`);
    });

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
      preferRest: false,
      openTelemetryOptions: {
        enableTracing: true,
        traceProvider: tracerProvider
      },
    });
  });

  afterEach(() => {
    return verifyInstance(firestore);
  });

  function expectSpanHierarchy(spansNames: string[]) : void {

  }

  async function waitForCompletedSpans(): Promise<void> {
    //await firestore.terminate();
    await tracerProvider.forceFlush();
    await inMemorySpanExporter.forceFlush();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  it('document reference get()', async () => {
    await firestore.collection('foo').doc('bar').get();

    await waitForCompletedSpans();
    const spans = inMemorySpanExporter.getFinishedSpans();
    spans.forEach(span => {
      console.log(span.name);
    });
    expect(spans.length).to.equal(2);
    expect(spans[0].name).to.equal(SPAN_NAME_DOC_REF_GET);
  });
});
