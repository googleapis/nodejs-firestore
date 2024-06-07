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
import {describe, it, beforeEach, afterEach, before} from 'mocha';
import {TraceExporter} from "@google-cloud/opentelemetry-cloud-trace-exporter";
import {FirestoreOpenTelemetryOptions, Settings} from "@google-cloud/firestore";
import {
  AlwaysOnSampler, BatchSpanProcessor,
  ConsoleSpanExporter,
  InMemorySpanExporter,
  NodeTracerProvider,
} from '@opentelemetry/sdk-trace-node';
import {diag, DiagConsoleLogger, DiagLogLevel, trace, TracerProvider} from '@opentelemetry/api';
import {setLogFunction, Firestore} from '../src';
import {verifyInstance} from '../test/util/helpers';
import {SPAN_NAME_DOC_REF_GET} from "../src/telemetry/trace-util";

use(chaiAsPromised);

// Enable OpenTelemetry debug message for local debugging.
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Enable Firestore debug messages for local debugging.
setLogFunction((msg: string) => {
  console.log(`LOG: ${msg}`);
});

interface TestConfig {
  // In-Memory tests check trace correctness by inspecting traces in memory by
  // utilizing InMemorySpanExporter. These tests have `e2e` set to `false`.
  // End-to-End tests check trace correctness by querying the Google Cloud Trace
  // backend and making sure it has recorded all the expected spans. These
  // tests have `e2e` set to `true`.
  e2e: boolean,

  // OpenTelemetry allows registering a specific OpenTelemetry instance as the
  // "global" instance. We should make sure that the tracing works in two
  // circumstances: (1) the user provides us with a specific OpenTelemetry
  // instance. (2) the user does not provide an instance and we find the
  // global instance to use.
  globalOpenTelemetry: boolean,

  // Whether the Firestore instance should use gRPC or REST.
  preferRest: boolean
};

describe.only('Tracing Tests', function () {
  let firestore: Firestore;
  let tracerProvider: NodeTracerProvider;
  let inMemorySpanExporter: InMemorySpanExporter;
  let consoleSpanExporter: ConsoleSpanExporter;
  let gcpTraceExporter: TraceExporter;

  afterEach(() => {
    // Remove the global tracer provider in case anything was registered
    // in order to avoid duplicate global tracers.
    trace.disable();

    return verifyInstance(firestore);
  });

  function getOpenTelemetryOptions(config: TestConfig, tracerProvider: TracerProvider) : FirestoreOpenTelemetryOptions {
    let options : FirestoreOpenTelemetryOptions = {
      enableTracing: true,
      traceProvider: undefined
    };

    // If we are *not* using a global OpenTelemetry instance, a TracerProvider
    // must be passed to the Firestore SDK.
    if (!config.globalOpenTelemetry) {
      options.traceProvider = tracerProvider;
    }

    return options;
  }

  function beforeEachTest(config: TestConfig) {
    // Create a new tracer and span processor for each test to make sure there
    // are no overlaps when reading the results.
    tracerProvider = new NodeTracerProvider(
        {
          sampler: new AlwaysOnSampler()
        }
    );

    inMemorySpanExporter = new InMemorySpanExporter();
    consoleSpanExporter = new ConsoleSpanExporter();
    gcpTraceExporter = new TraceExporter();

    // Always add the console exporter for local debugging.
    tracerProvider.addSpanProcessor(new BatchSpanProcessor(consoleSpanExporter));
    if (config.e2e) {
     tracerProvider.addSpanProcessor(new BatchSpanProcessor(gcpTraceExporter));
    } else {
      tracerProvider.addSpanProcessor(new BatchSpanProcessor(inMemorySpanExporter));
    }

    if (config.globalOpenTelemetry) {
      trace.setGlobalTracerProvider(tracerProvider);
    } else {
      // TODO: Do we need to register the tracer provider here?
      // tracerProvider.register();
    }

    const settings: Settings = {
      preferRest: config.preferRest,
      openTelemetryOptions: getOpenTelemetryOptions(config, tracerProvider)
    };
    if (process.env.FIRESTORE_NAMED_DATABASE) {
      settings.databaseId = process.env.FIRESTORE_NAMED_DATABASE;
    }
    if (!settings.projectId && process.env.PROJECT_ID) {
      settings.projectId = process.env.PROJECT_ID;
    }
    if (!settings.databaseId && process.env.DATABASE_ID) {
      settings.databaseId = process.env.DATABASE_ID;
    }

    firestore = new Firestore(settings);
  }

  async function waitForCompletedInMemorySpans(): Promise<void> {
    //await firestore.terminate();
    await tracerProvider.forceFlush();
    await inMemorySpanExporter.forceFlush();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async function waitForCompletedCloudTraceSpans(numExpectedSpans: number): Promise<void> {
    // TODO: implement
    // fail. unimplemented.
    expect(false).to.equal(true);
  }

  async function waitForCompletedSpans(config: TestConfig, numExpectedSpans: number): Promise<void> {
    if(config.e2e) {
      return waitForCompletedCloudTraceSpans(numExpectedSpans);
    } else {
      return waitForCompletedInMemorySpans();
    }
  }

  describe.only('In-Memory', function() {
    describe.only('Non-Global-OTEL', function () {
      describe.only('GRPC', function () {
        let config : TestConfig = {e2e: false, globalOpenTelemetry: false, preferRest: false};
        beforeEach(async () => beforeEachTest(config));
        testSomething(config);
      });
      describe.only('REST', function () {
        let config : TestConfig = {e2e: false, globalOpenTelemetry: false, preferRest: true};
        beforeEach(async () => beforeEachTest(config));
        testSomething(config);
      });
    });
    describe.only('with Global-OTEL', function () {
      describe.only('GRPC', function () {
        let config : TestConfig = {e2e: false, globalOpenTelemetry: true, preferRest: false};
        beforeEach(async () => beforeEachTest(config));
        testSomething(config);
      });
      describe.only('REST', function () {
        let config : TestConfig = {e2e: false, globalOpenTelemetry: true, preferRest: true};
        beforeEach(async () => beforeEachTest(config));
        testSomething(config);
      });
    });
  });

  describe.only('E2E', function() {
    describe.only('Non-Global-OTEL', function () {
      describe.only('GRPC', function () {
        let config : TestConfig = {e2e: true, globalOpenTelemetry: false, preferRest: false};
        beforeEach(async () => beforeEachTest(config));
        testSomething(config);
      });
      describe.only('REST', function () {
        let config : TestConfig = {e2e: true, globalOpenTelemetry: false, preferRest: true};
        beforeEach(async () => beforeEachTest(config));
        testSomething(config);
      });
    });
    describe.only('with Global-OTEL', function () {
      describe.only('GRPC', function () {
        let config : TestConfig = {e2e: true, globalOpenTelemetry: true, preferRest: false};
        beforeEach(async () => beforeEachTest(config));
        testSomething(config);
      });
      describe.only('REST', function () {
        let config : TestConfig = {e2e: true, globalOpenTelemetry: true, preferRest: true};
        beforeEach(async () => beforeEachTest(config));
        testSomething(config);
      });
    });
  });

  function testSomething(config: TestConfig) {
    it('test 1', async function() {
      console.log(config);
    });

    // it('document reference get()', async () => {
    //   await firestore.collection('foo').doc('bar').get();
    //
    //   await waitForCompletedSpans(config, 3);
    //   const spans = inMemorySpanExporter.getFinishedSpans();
    //   spans.forEach(span => {
    //     console.log(span.name);
    //   });
    //   expect(spans.length).to.equal(3);
    //   //expect(spans[0].name).to.equal(SPAN_NAME_DOC_REF_GET);
    // });
  }
});


// Test suites


// Common test functions

// describe.only('Tracing Tests', () => {
//
//   let firestore: Firestore;
//   let tracerProvider: NodeTracerProvider;
//   let inMemorySpanExporter: InMemorySpanExporter;
//
//   before(async () => {
//   });
//
//   beforeEach(async () => {
//     tracerProvider = new NodeTracerProvider(
//         {
//           sampler: new AlwaysOnSampler()
//         }
//     );
//
//     // Create a new tracer and span processor for each test to make sure there
//     // are no overlaps when reading the results.
//     inMemorySpanExporter = new InMemorySpanExporter();
//     tracerProvider.addSpanProcessor(new SimpleSpanProcessor(inMemorySpanExporter));
//     tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
//     tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new TraceExporter()));
//     tracerProvider.register();
//
//
//     setLogFunction((msg: string) => {
//       console.log(`LOG: ${msg}`);
//     });
//
//     const internalSettings: Settings = {};
//     if (process.env.FIRESTORE_NAMED_DATABASE) {
//       internalSettings.databaseId = process.env.FIRESTORE_NAMED_DATABASE;
//     }
//
//     if (!internalSettings.projectId && process.env.PROJECT_ID) {
//       internalSettings.projectId = process.env.PROJECT_ID;
//     }
//
//     if (!internalSettings.databaseId && process.env.DATABASE_ID) {
//       internalSettings.databaseId = process.env.DATABASE_ID;
//     }
//
//     firestore = new Firestore({
//       ...internalSettings,
//       preferRest: false,
//       openTelemetryOptions: {
//         enableTracing: true,
//         traceProvider: tracerProvider
//       },
//     });
//   });
//
//   afterEach(() => {
//     return verifyInstance(firestore);
//   });
//
//   function expectSpanHierarchy(spansNames: string[]) : void {
//
//   }
//
//   async function waitForCompletedSpans(): Promise<void> {
//     //await firestore.terminate();
//     await tracerProvider.forceFlush();
//     await inMemorySpanExporter.forceFlush();
//     await new Promise(resolve => setTimeout(resolve, 1000));
//   }
//
//   testCases.forEach(testCase => {
//     function testName(name: string): string {
//       return `${name}(${testCase.description})`;
//     }
//
//     it(testName('should do something'), function() {
//       if (testCase.e2e) {
//         // E2E test logic
//       } else {
//         // Non-E2E test logic
//       }
//     });
//
//     it(testName('document reference get()'), async () => {
//       await firestore.collection('foo').doc('bar').get();
//
//       await waitForCompletedSpans();
//       const spans = inMemorySpanExporter.getFinishedSpans();
//       spans.forEach(span => {
//         console.log(span.name);
//       });
//       expect(spans.length).to.equal(3);
//       //expect(spans[0].name).to.equal(SPAN_NAME_DOC_REF_GET);
//     });
//   });
//
// });
