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
import {assert, expect, use} from 'chai';
import {describe, it, beforeEach, afterEach, before} from 'mocha';
import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  trace,
  TracerProvider,
} from '@opentelemetry/api';
import {TraceExporter} from '@google-cloud/opentelemetry-cloud-trace-exporter';
import {FirestoreOpenTelemetryOptions, Settings} from '@google-cloud/firestore';
import {
  AlwaysOnSampler,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  InMemorySpanExporter,
  NodeTracerProvider,
  ReadableSpan,
} from '@opentelemetry/sdk-trace-node';
import {setLogFunction, Firestore} from '../src';
import {verifyInstance} from '../test/util/helpers';
import {
  BATCH_GET_DOCUMENTS_RPC_NAME,
  SERVICE,
  SPAN_NAME_DOC_REF_GET,
} from '../src/telemetry/trace-util';

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
  e2e: boolean;

  // OpenTelemetry allows registering a specific OpenTelemetry instance as the
  // "global" instance. We should make sure that the tracing works in two
  // circumstances: (1) the user provides us with a specific OpenTelemetry
  // instance. (2) the user does not provide an instance and we find the
  // global instance to use.
  globalOpenTelemetry: boolean;

  // Whether the Firestore instance should use gRPC or REST.
  preferRest: boolean;
}

const HTTP_POST_SPAN_NAME = 'POST';

describe.only('Tracing Tests', function () {
  let firestore: Firestore;
  let tracerProvider: NodeTracerProvider;
  let inMemorySpanExporter: InMemorySpanExporter;
  let consoleSpanExporter: ConsoleSpanExporter;
  let gcpTraceExporter: TraceExporter;

  let spanIdToChildrenSpanIds = new Map<string, string[]>();
  let spanIdToSpanData = new Map<string, ReadableSpan>();
  let rootSpanIds: string[] = [];

  afterEach(() => {
    // Remove the global tracer provider in case anything was registered
    // in order to avoid duplicate global tracers.
    trace.disable();

    spanIdToChildrenSpanIds.clear();
    spanIdToSpanData.clear();
    rootSpanIds = [];

    return verifyInstance(firestore);
  });

  function getOpenTelemetryOptions(
    config: TestConfig,
    tracerProvider: TracerProvider
  ): FirestoreOpenTelemetryOptions {
    let options: FirestoreOpenTelemetryOptions = {
      enableTracing: true,
      traceProvider: undefined,
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
    tracerProvider = new NodeTracerProvider({
      sampler: new AlwaysOnSampler(),
    });

    inMemorySpanExporter = new InMemorySpanExporter();
    consoleSpanExporter = new ConsoleSpanExporter();
    gcpTraceExporter = new TraceExporter();

    // Always add the console exporter for local debugging.
    tracerProvider.addSpanProcessor(
      new BatchSpanProcessor(consoleSpanExporter)
    );
    if (config.e2e) {
      tracerProvider.addSpanProcessor(new BatchSpanProcessor(gcpTraceExporter));
    } else {
      tracerProvider.addSpanProcessor(
        new BatchSpanProcessor(inMemorySpanExporter)
      );
    }

    if (config.globalOpenTelemetry) {
      trace.setGlobalTracerProvider(tracerProvider);
    } else {
      // TODO: Do we need to register the tracer provider here?
      tracerProvider.register();
    }

    const settings: Settings = {
      preferRest: config.preferRest,
      openTelemetryOptions: getOpenTelemetryOptions(config, tracerProvider),
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

  // Returns true on success, and false otherwise.
  async function waitForCompletedInMemorySpans(): Promise<boolean> {
    await tracerProvider.forceFlush();
    await inMemorySpanExporter.forceFlush();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  // Returns true on success, and false otherwise.
  async function waitForCompletedCloudTraceSpans(
    numExpectedSpans: number
  ): Promise<boolean> {
    // TODO: implement
    // fail. unimplemented.
    return false;
    //expect(false).to.equal(true);
  }

  async function waitForCompletedSpans(
    config: TestConfig,
    numExpectedSpans: number
  ): Promise<void> {
    let success: boolean = false;
    if (config.e2e) {
      success = await waitForCompletedCloudTraceSpans(numExpectedSpans);
    } else {
      success = await waitForCompletedInMemorySpans();
    }

    if (success) {
      buildSpanMaps(config);
    }
    expect(spanIdToSpanData.size).to.equal(
      numExpectedSpans,
      `Could not find expected number of spans (${numExpectedSpans})`
    );
  }

  function buildSpanMaps(config: TestConfig): void {
    if (config.e2e) {
      // TODO: implement
    } else {
      // Using InMemorySpanExporter.
      const spans = inMemorySpanExporter.getFinishedSpans();
      spans.forEach(span => {
        const id = getSpanId(span)!;
        const parentId = getParentSpanId(span);
        if (!parentId) {
          rootSpanIds.push(id);
        } else {
          let children = spanIdToChildrenSpanIds.get(parentId);
          // Initialize to empty array if it hasn't been seen before.
          if (!children) {
            children = [];
          }
          // Add the new child.
          children.push(id);
          spanIdToChildrenSpanIds.set(parentId, children);
        }
        spanIdToSpanData.set(id, span);
      });
    }
  }

  // Returns the span id of the given span.
  function getSpanId(span: ReadableSpan | undefined): string | undefined {
    return span?.spanContext().spanId;
  }

  // Returns the parent span id of the given span.
  function getParentSpanId(span: ReadableSpan | undefined): string | undefined {
    return span?.parentSpanId;
  }

  // Returns the trace id of the given span.
  function getTraceId(span: ReadableSpan | undefined): string | undefined {
    return span?.spanContext().traceId;
  }

  // Returns the grpc span name for the given rpc.
  function grpcSpanName(rpcName: string): string {
    return `grpc.${SERVICE}${rpcName}`;
  }

  function getChildSpans(spanId: string): string[] | undefined {
    return spanIdToChildrenSpanIds.get(spanId);
  }

  // Returns the array of spans that match the given span hierarchy names starting
  // at the given root. Returns an empty list if it cannot find such hierarchy under
  // the given root.
  function dfsSpanHierarchy(
    rootSpanId: string,
    spanNamesHierarchy: string[]
  ): ReadableSpan[] {
    // This function returns an empty list if it cannot find a full match.
    let notAMatch: ReadableSpan[] = [];
    const rootSpan = spanIdToSpanData.get(rootSpanId);

    if (spanNamesHierarchy.length === 0 || !rootSpan) {
      return notAMatch;
    }

    if (spanIdToSpanData.get(rootSpanId)?.name !== spanNamesHierarchy[0]) {
      // The root names didn't match.
      return notAMatch;
    } else {
      // The root names matched. The new hierarchy to match can be obtained by
      // popping the first element of `spanNamesHierarchy`.
      let newSpanNamesHierarchy = spanNamesHierarchy.slice(1);

      let children = getChildSpans(rootSpanId);
      if (!children || children.length === 0) {
        if (newSpanNamesHierarchy.length === 0) {
          // The root span doesn't have any more children, and there are no
          // more span names to match. This is a successful match, and it is
          // a base case for the recursion.
          return [rootSpan];
        } else {
          // The root span doesn't have any more children, but there are still
          // more span names to match.
          return notAMatch;
        }
      } else {
        // See which (if any) of the child trees matches `newSpanNamesHierarchy`.
        for (let childIndex = 0; childIndex < children.length; ++childIndex) {
          const newRootSpanId = children[childIndex];
          const subtreeMatch = dfsSpanHierarchy(
            newRootSpanId,
            newSpanNamesHierarchy
          );
          if (subtreeMatch.length > 0) {
            // We found a full match in the child tree.
            return [rootSpan].concat(subtreeMatch);
          }
        }

        // If none of the child trees matched `newSpanNamesHierarchy`, we were
        // not able to find a full match anywhere in our child trees.
        return notAMatch;
      }
    }
  }

  // Asserts that the span hierarchy exists for the given span names.
  // The hierarchy starts with the root span, followed by the child span,
  // grandchild span, and so on. It also asserts that all the given spans belong
  // to the same trace, and that Firestore-generated spans contain the expected
  // Firestore attributes.
  function expectSpanHierarchy(...spanNamesHierarchy: string[]): void {
    expect(spanNamesHierarchy.length).to.be.greaterThan(
      0,
      'The expected spans hierarchy was empty'
    );

    let matchingSpanHierarchy: ReadableSpan[] = [];

    // The Firestore operations that have been executed generate a number of
    // spans. The span names, however, are not unique. For example, we could have:
    // "DocRef.Get" (id:1) -> "grpc.GET" (id:2) -> "POST" (id:3)
    // "DocRef.Set" (id:4) -> "grpc.SET" (id:5) -> "POST" (id:6)
    // Note that span names are not unique (e.g. span 3 and span 6).
    // Let's say we want to check if the following span hierarchy exists:
    // [DocRef.Set -> grpc.SET -> POST]
    // We start at each root span (span 1 and span 4 in this case), and check if
    // the span hierarchy matches the given `spanNamesHierarchy`.
    for (let i = 0; i < rootSpanIds.length; ++i) {
      matchingSpanHierarchy = dfsSpanHierarchy(
        rootSpanIds[i],
        spanNamesHierarchy
      );
      if (matchingSpanHierarchy.length > 0) break;
    }

    expect(matchingSpanHierarchy.length).to.be.greaterThan(
      0,
      `Was not able to find the following span hierarchy: ${spanNamesHierarchy}`
    );
    console.log('Found the following span hierarchy:');
    matchingSpanHierarchy.forEach(value => console.log(value.name));

    for (let i = 0; i + 1 < matchingSpanHierarchy.length; ++i) {
      const parentSpan = matchingSpanHierarchy[i];
      const childSpan = matchingSpanHierarchy[i + 1];
      expect(getTraceId(childSpan)).to.equal(
        getTraceId(parentSpan),
        `'${childSpan.name}' and '${parentSpan.name}' spans do not belong to the same trace`
      );
      // TODO(tracing): expect that each span has the needed attributes.
    }
  }

  describe.only('In-Memory', function () {
    describe.only('Non-Global-OTEL', function () {
      describe.only('GRPC', function () {
        let config: TestConfig = {
          e2e: false,
          globalOpenTelemetry: false,
          preferRest: false,
        };
        beforeEach(async () => beforeEachTest(config));
        runTestCases(config);
      });
      describe('REST', function () {
        let config: TestConfig = {
          e2e: false,
          globalOpenTelemetry: false,
          preferRest: true,
        };
        beforeEach(async () => beforeEachTest(config));
        runTestCases(config);
      });
    });
    describe.only('with Global-OTEL', function () {
      describe.only('GRPC', function () {
        let config: TestConfig = {
          e2e: false,
          globalOpenTelemetry: true,
          preferRest: false,
        };
        beforeEach(async () => beforeEachTest(config));
        runTestCases(config);
      });
      describe('REST', function () {
        let config: TestConfig = {
          e2e: false,
          globalOpenTelemetry: true,
          preferRest: true,
        };
        beforeEach(async () => beforeEachTest(config));
        runTestCases(config);
      });
    });
  });

  describe('E2E', function () {
    describe('Non-Global-OTEL', function () {
      describe('GRPC', function () {
        let config: TestConfig = {
          e2e: true,
          globalOpenTelemetry: false,
          preferRest: false,
        };
        beforeEach(async () => beforeEachTest(config));
        runTestCases(config);
      });
      describe('REST', function () {
        let config: TestConfig = {
          e2e: true,
          globalOpenTelemetry: false,
          preferRest: true,
        };
        beforeEach(async () => beforeEachTest(config));
        runTestCases(config);
      });
    });
    describe('with Global-OTEL', function () {
      describe('GRPC', function () {
        let config: TestConfig = {
          e2e: true,
          globalOpenTelemetry: true,
          preferRest: false,
        };
        beforeEach(async () => beforeEachTest(config));
        runTestCases(config);
      });
      describe('REST', function () {
        let config: TestConfig = {
          e2e: true,
          globalOpenTelemetry: true,
          preferRest: true,
        };
        beforeEach(async () => beforeEachTest(config));
        runTestCases(config);
      });
    });
  });

  function runTestCases(config: TestConfig) {
    it('document reference get()', async () => {
      console.log(config);
      await firestore.collection('foo').doc('bar').get();

      await waitForCompletedSpans(config, 3);
      expectSpanHierarchy(
        SPAN_NAME_DOC_REF_GET,
        grpcSpanName(BATCH_GET_DOCUMENTS_RPC_NAME),
        HTTP_POST_SPAN_NAME
      );
    });
  }
});
