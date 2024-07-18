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
import {config, expect, use} from 'chai';
import {describe, it, beforeEach, afterEach, Context} from 'mocha';
import {
  Attributes,
  context,
  diag,
  DiagConsoleLogger,
  DiagLogLevel, propagation, ROOT_CONTEXT, Span, SpanContext,
  trace, TraceFlags, Tracer,
  TracerProvider,
  Context as OpenTelemetryContext
} from '@opentelemetry/api';
import {TraceExporter} from '@google-cloud/opentelemetry-cloud-trace-exporter';
import {Settings} from '@google-cloud/firestore';
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
  ATTRIBUTE_KEY_DOC_COUNT,
  SERVICE,
  SPAN_NAME_AGGREGATION_QUERY_GET,
  SPAN_NAME_BATCH_COMMIT,
  SPAN_NAME_BATCH_GET_DOCUMENTS,
  SPAN_NAME_BULK_WRITER_COMMIT,
  SPAN_NAME_COL_REF_ADD,
  SPAN_NAME_COL_REF_LIST_DOCUMENTS,
  SPAN_NAME_DOC_REF_CREATE,
  SPAN_NAME_DOC_REF_DELETE,
  SPAN_NAME_DOC_REF_GET,
  SPAN_NAME_DOC_REF_LIST_COLLECTIONS,
  SPAN_NAME_DOC_REF_SET,
  SPAN_NAME_DOC_REF_UPDATE,
  SPAN_NAME_PARTITION_QUERY,
  SPAN_NAME_QUERY_GET,
  SPAN_NAME_TRANSACTION_COMMIT,
  SPAN_NAME_TRANSACTION_GET_AGGREGATION_QUERY,
  SPAN_NAME_TRANSACTION_GET_DOCUMENT,
  SPAN_NAME_TRANSACTION_GET_DOCUMENTS,
  SPAN_NAME_TRANSACTION_GET_QUERY,
  SPAN_NAME_TRANSACTION_RUN,
} from '../src/telemetry/trace-util';
import {AsyncLocalStorageContextManager} from '@opentelemetry/context-async-hooks';
import {deepStrictEqual} from 'assert';
import {cloudtrace_v1} from "@googleapis/cloudtrace";

use(chaiAsPromised);

// Enable OpenTelemetry debug message for local debugging.
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Enable Firestore debug messages for local debugging.
setLogFunction((msg: string) => {
  console.log(`LOG: ${msg}`);
});

// TODO(tracing): This should be moved to firestore.d.ts when we want to
//  release the feature.
export interface FirestoreOpenTelemetryOptions {
  enableTracing?: boolean;
  tracerProvider?: any;
}

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

const NUM_TRACE_ID_BYTES = 32;
const NUM_SPAN_ID_BYTES = 16;
const SPAN_NAME_TEST_ROOT = 'TestRootSpan';

describe('Tracing Tests', () => {
  let firestore: Firestore;
  let tracerProvider: NodeTracerProvider;
  let inMemorySpanExporter: InMemorySpanExporter;
  let consoleSpanExporter: ConsoleSpanExporter;
  let gcpTraceExporter: TraceExporter;
  let tracer: Tracer;

  // Custom SpanContext for each test, required for trace ID injection.
  let customSpanContext: SpanContext;

  // Custom Context for each test, required for trace ID injection.
  let customContext: OpenTelemetryContext;

  const spanIdToChildrenSpanIds = new Map<string, string[]>();
  const spanIdToSpanData = new Map<string, ReadableSpan>();
  let rootSpanIds: string[] = [];

  function afterEachTest(config: TestConfig): Promise<void> {
    spanIdToChildrenSpanIds.clear();
    spanIdToSpanData.clear();
    rootSpanIds = [];

    return verifyInstance(firestore);
  }

  function getOpenTelemetryOptions(
    config: TestConfig,
    tracerProvider: TracerProvider
  ): FirestoreOpenTelemetryOptions {
    const options: FirestoreOpenTelemetryOptions = {
      enableTracing: true,
      tracerProvider: undefined,
    };

    // If we are *not* using a global OpenTelemetry instance, a TracerProvider
    // must be passed to the Firestore SDK.
    if (!config.globalOpenTelemetry) {
      options.tracerProvider = tracerProvider;
    }

    return options;
  }

  function generateRandomHexString(length: number): string {
    if (length <= 0) {
      throw new Error('Length must be a positive integer');
    }

    const hexCharacters = '0123456789abcdef';
    let hexString = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * hexCharacters.length);
      hexString += hexCharacters[randomIndex];
    }

    return hexString;
  }

  function getNewSpanContext() : SpanContext {
    const spanContext: SpanContext = {
      traceId: generateRandomHexString(NUM_TRACE_ID_BYTES),
      spanId: generateRandomHexString(NUM_SPAN_ID_BYTES),
      traceFlags: TraceFlags.SAMPLED,
    };
    console.log('custom span context=');
    console.log(spanContext);
    return spanContext;
  }

  function beforeEachTest(config: TestConfig, testName: string) {
    console.log(config);
    // Remove the global tracer provider in case anything was registered
    // in order to avoid duplicate global tracers.
    trace.disable();
    context.disable();

    // Set up a context manager.
    const contextManager = new AsyncLocalStorageContextManager();
    contextManager.enable();
    context.setGlobalContextManager(contextManager);

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
    }

    // Using a unique tracer name for each test.
    tracer = tracerProvider.getTracer(testName);

    customSpanContext = getNewSpanContext();
    customContext = trace.setSpanContext(ROOT_CONTEXT, customSpanContext);

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


  // Take a function and runs it inside a new root span. This makes it possible to
  // encapsulate all the SDK-generated spans inside a test root span. It also makes
  // it easy to query a trace storage backend for a known trace ID and span Id.
  function runFirestoreOperationInRootSpan<F extends () => void>(fn: F): Promise<void> {
    return tracer.startActiveSpan(SPAN_NAME_TEST_ROOT, {},
        customContext,
        async (span) => {
      await fn();
      span.end();
    });
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
    // TODO(tracing): implement
    const bar = new cloudtrace_v1.Cloudtrace({});
    const foo = new cloudtrace_v1.Resource$Projects$Traces(null);
    foo.get({
      projectId: 'project_id',
      traceId: 'trace_id'
    }, )
    return false;
  }

  async function waitForCompletedSpans(
    config: TestConfig,
    numExpectedSpans: number
  ): Promise<void> {
    let success = false;
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
      // TODO(tracing): implement
    } else {
      // Using InMemorySpanExporter.
      const spans = inMemorySpanExporter.getFinishedSpans();
      spans.forEach(span => {
        const id = getSpanId(span)!;
        const parentId = getParentSpanId(span);
        if (!parentId || parentId === customSpanContext.spanId) {
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
    console.log('rootSpanIds');
    console.log(rootSpanIds);
    console.log('spanIdToSpanData');
    console.log(spanIdToSpanData);
    console.log('spanIdToChildrenSpanIds');
    console.log(spanIdToChildrenSpanIds);
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

  function getChildSpans(spanId: string): string[] | undefined {
    return spanIdToChildrenSpanIds.get(spanId);
  }

  // Returns the first span it can find with the given name, or null if it cannot find a span with the given name.
  // If there are multiple spans with the same name, it'll return the first one.
  function getSpanByName(spanName: string): ReadableSpan | null {
    for (const spanData of spanIdToSpanData.values()) {
      if (spanData.name === spanName) {
        return spanData;
      }
    }
    return null;
  }

  // Returns the array of spans that match the given span hierarchy names starting
  // at the given root. Returns an empty list if it cannot find such hierarchy under
  // the given root.
  function dfsSpanHierarchy(
    rootSpanId: string,
    spanNamesHierarchy: string[]
  ): ReadableSpan[] {
    // This function returns an empty list if it cannot find a full match.
    const notAMatch: ReadableSpan[] = [];
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
      const newSpanNamesHierarchy = spanNamesHierarchy.slice(1);

      const children = getChildSpans(rootSpanId);
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

  // Ensures that the given span exists and has exactly all the given attributes.
  function expectSpanHasAttributes(spanName: string, attributes: Attributes) {
    // Expect that the span exists first.
    const span = getSpanByName(spanName);
    expect(span).to.not.be.null;

    // Assert that the attributes are the same.
    deepStrictEqual(span!.attributes, attributes);
  }

  describe('In-Memory', () => {
    describe('Non-Global-OTEL', () => {
      describe.only('GRPC', () => {
        const config: TestConfig = {
          e2e: false,
          globalOpenTelemetry: false,
          preferRest: false,
        };
        beforeEach(function () {
          beforeEachTest(config, `${this.currentTest?.title}${Date.now()}`);
        });
        runTestCases(config);
        afterEach(async () => afterEachTest(config));
      });
      // describe('REST', () => {
      //   const config: TestConfig = {
      //     e2e: false,
      //     globalOpenTelemetry: false,
      //     preferRest: true,
      //   };
      //   beforeEach(function () {
      //     beforeEachTest(config, `${this.currentTest?.title}${Date.now()}`);
      //   });
      //   runTestCases(config);
      //   afterEach(async () => afterEachTest(config));
      // });
    });
    // describe('with Global-OTEL', () => {
    //   describe('GRPC', () => {
    //     const config: TestConfig = {
    //       e2e: false,
    //       globalOpenTelemetry: true,
    //       preferRest: false,
    //     };
    //     beforeEach(function () {
    //       beforeEachTest(config, `${this.currentTest?.title}${Date.now()}`);
    //     });
    //     runTestCases(config);
    //     afterEach(async () => afterEachTest(config));
    //   });
    //   describe('REST', () => {
    //     const config: TestConfig = {
    //       e2e: false,
    //       globalOpenTelemetry: true,
    //       preferRest: true,
    //     };
    //     beforeEach(function () {
    //       beforeEachTest(config, `${this.currentTest?.title}${Date.now()}`);
    //     });
    //     runTestCases(config);
    //     afterEach(async () => afterEachTest(config));
    //   });
    // });
  });

  // describe.skip('E2E', () => {
  //   describe('Non-Global-OTEL', () => {
  //     describe('GRPC', () => {
  //       const config: TestConfig = {
  //         e2e: true,
  //         globalOpenTelemetry: false,
  //         preferRest: false,
  //       };
  //       beforeEach(async () => beforeEachTest(config));
  //       runTestCases(config);
  //       afterEach(async () => afterEachTest(config));
  //     });
  //     describe('REST', () => {
  //       const config: TestConfig = {
  //         e2e: true,
  //         globalOpenTelemetry: false,
  //         preferRest: true,
  //       };
  //       beforeEach(async () => beforeEachTest(config));
  //       runTestCases(config);
  //       afterEach(async () => afterEachTest(config));
  //     });
  //   });
  //   describe('with Global-OTEL', () => {
  //     describe('GRPC', () => {
  //       const config: TestConfig = {
  //         e2e: true,
  //         globalOpenTelemetry: true,
  //         preferRest: false,
  //       };
  //       beforeEach(async () => beforeEachTest(config));
  //       runTestCases(config);
  //       afterEach(async () => afterEachTest(config));
  //     });
  //     describe('REST', () => {
  //       const config: TestConfig = {
  //         e2e: true,
  //         globalOpenTelemetry: true,
  //         preferRest: true,
  //       };
  //       beforeEach(async () => beforeEachTest(config));
  //       runTestCases(config);
  //       afterEach(async () => afterEachTest(config));
  //     });
  //   });
  // });

  function runTestCases(config: TestConfig) {
    it.only('document reference get()', async () => {
      await runFirestoreOperationInRootSpan(() => firestore.collection('foo').doc('bar').get());
      await waitForCompletedSpans(config, 3);
      expectSpanHierarchy(SPAN_NAME_TEST_ROOT, SPAN_NAME_DOC_REF_GET, SPAN_NAME_BATCH_GET_DOCUMENTS);
    });

    it.only('document reference create()', async () => {
      await runFirestoreOperationInRootSpan(() => firestore.collection('foo').doc().create({}));
      await waitForCompletedSpans(config, 3);
      expectSpanHierarchy(SPAN_NAME_TEST_ROOT, SPAN_NAME_DOC_REF_CREATE, SPAN_NAME_BATCH_COMMIT);
    });

    it('document reference delete()', async () => {
      await firestore.collection('foo').doc('bar').delete();

      await waitForCompletedSpans(config, 2);
      expectSpanHierarchy(SPAN_NAME_DOC_REF_DELETE, SPAN_NAME_BATCH_COMMIT);
    });

    it('document reference set()', async () => {
      await firestore.collection('foo').doc('bar').set({foo: 'bar'});

      await waitForCompletedSpans(config, 2);
      expectSpanHierarchy(SPAN_NAME_DOC_REF_SET, SPAN_NAME_BATCH_COMMIT);
    });

    it('document reference update()', async () => {
      await firestore.collection('foo').doc('bar').update('foo', 'bar2');

      await waitForCompletedSpans(config, 2);
      expectSpanHierarchy(SPAN_NAME_DOC_REF_UPDATE, SPAN_NAME_BATCH_COMMIT);
    });

    it('document reference list collections', async () => {
      await firestore.collection('foo').doc('bar').listCollections();

      await waitForCompletedSpans(config, 1);
      expectSpanHierarchy(SPAN_NAME_DOC_REF_LIST_COLLECTIONS);
    });

    it('aggregate query get()', async () => {
      await firestore.collection('foo').count().get();

      await waitForCompletedSpans(config, 1);
      expectSpanHierarchy(SPAN_NAME_AGGREGATION_QUERY_GET);
    });

    it('collection reference add()', async () => {
      await firestore.collection('foo').add({foo: 'bar'});

      await waitForCompletedSpans(config, 3);
      expectSpanHierarchy(
        SPAN_NAME_COL_REF_ADD,
        SPAN_NAME_DOC_REF_CREATE,
        SPAN_NAME_BATCH_COMMIT
      );
    });

    it('collection reference list documents', async () => {
      await firestore.collection('foo').listDocuments();

      await waitForCompletedSpans(config, 1);
      expectSpanHierarchy(SPAN_NAME_COL_REF_LIST_DOCUMENTS);
    });

    it('query get()', async () => {
      await firestore
        .collection('foo')
        .where('foo', '==', 'bar')
        .limit(1)
        .get();

      await waitForCompletedSpans(config, 1);
      expectSpanHierarchy(SPAN_NAME_QUERY_GET);
    });

    it('firestore getAll()', async () => {
      const docRef1 = firestore.collection('foo').doc('1');
      const docRef2 = firestore.collection('foo').doc('2');
      await firestore.getAll(docRef1, docRef2);

      await waitForCompletedSpans(config, 1);
      expectSpanHierarchy(SPAN_NAME_BATCH_GET_DOCUMENTS);
    });

    it('transaction', async () => {
      const docRef1 = firestore.collection('foo').doc('bar');
      const docRef2 = firestore.collection('foo').doc('bar');

      await firestore.runTransaction(async transaction => {
        await transaction.get(docRef1);
        await transaction.getAll(docRef1, docRef2);
        await transaction.get(firestore.collection('foo').limit(1));
        await transaction.get(firestore.collection('nonexistent').count());
        transaction.set(firestore.collection('foo').doc(), {foo: 'bar'});
      });

      await waitForCompletedSpans(config, 6);
      expectSpanHierarchy(
        SPAN_NAME_TRANSACTION_RUN,
        SPAN_NAME_TRANSACTION_GET_DOCUMENT
      );
      expectSpanHierarchy(
        SPAN_NAME_TRANSACTION_RUN,
        SPAN_NAME_TRANSACTION_GET_DOCUMENTS
      );
      expectSpanHierarchy(
        SPAN_NAME_TRANSACTION_RUN,
        SPAN_NAME_TRANSACTION_GET_QUERY
      );
      expectSpanHierarchy(
        SPAN_NAME_TRANSACTION_RUN,
        SPAN_NAME_TRANSACTION_GET_AGGREGATION_QUERY
      );
      expectSpanHierarchy(
        SPAN_NAME_TRANSACTION_RUN,
        SPAN_NAME_TRANSACTION_COMMIT
      );
    });

    it('batch', async () => {
      const writeBatch = firestore.batch();
      const documentRef = firestore.doc('col/doc');
      writeBatch.set(documentRef, {foo: 'bar'});
      await writeBatch.commit();

      await waitForCompletedSpans(config, 1);
      expectSpanHierarchy(SPAN_NAME_BATCH_COMMIT);
    });

    it('partition query', async () => {
      const query = firestore.collectionGroup('foo');
      let numPartitions = 0;
      for await (const partition of query.getPartitions(3)) {
        numPartitions++;
      }

      await waitForCompletedSpans(config, 1);
      expectSpanHierarchy(SPAN_NAME_PARTITION_QUERY);
    });

    it('bulk writer', async () => {
      const bulkWriter = firestore.bulkWriter();
      // No need to await the set operations as 'close()' will commit all writes before closing.
      bulkWriter.set(firestore.collection('foo').doc(), {foo: 1});
      bulkWriter.set(firestore.collection('foo').doc(), {foo: 2});
      bulkWriter.set(firestore.collection('foo').doc(), {foo: 3});
      bulkWriter.set(firestore.collection('foo').doc(), {foo: 4});
      bulkWriter.set(firestore.collection('foo').doc(), {foo: 5});
      await bulkWriter.close();

      await waitForCompletedSpans(config, 1);
      expectSpanHierarchy(SPAN_NAME_BULK_WRITER_COMMIT);
      expectSpanHasAttributes(SPAN_NAME_BULK_WRITER_COMMIT, {
        [ATTRIBUTE_KEY_DOC_COUNT]: 5,
      });
    });
  }
});
