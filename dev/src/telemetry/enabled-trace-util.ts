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

import {TraceAPI, Tracer, TracerProvider} from '@opentelemetry/api';

import {TraceUtil} from './trace-util';
import {Span} from "./span";
import {FirestoreOpenTelemetryOptions} from "@google-cloud/firestore";
import {GrpcInstrumentation} from "@opentelemetry/instrumentation-grpc";
import {Span as OpenTelemetrySpan} from '@opentelemetry/api/build/src/trace/span';

export class EnabledTraceUtil implements TraceUtil {
  private tracer: Tracer;

  constructor(options: FirestoreOpenTelemetryOptions) {
    console.log("creating EnabledTraceUtil");

    let traceProvider : TracerProvider = options.traceProvider;

    // If a TraceProvider has not been given to us, we try to use the global one.
    if (!traceProvider) {
      console.log('TraceProvider was not provided in options.');
      const {trace} = require('@opentelemetry/api');
      traceProvider = trace.getTracerProvider();
    }

    const { registerInstrumentations } = require('@opentelemetry/instrumentation');

    registerInstrumentations({
      tracerProvider: traceProvider,
      instrumentations: [
        new GrpcInstrumentation(),
      ],
    });

    // TODO(tracing): update to the proper library name and version.
    this.tracer = traceProvider.getTracer('firestore');
  }

  startActiveSpan<F extends (span: Span) => unknown>(name: string, fn: F): ReturnType<F> {
    return this.tracer.startActiveSpan(name, (otelSpan: OpenTelemetrySpan) => {
      return fn(new Span(otelSpan)) as ReturnType<F>;
    });
  }

  startSpan(name: string): Span {
    console.log('in EnabledTraceUtil.startSpan().');
    return new Span(this.tracer.startSpan(name));
  }
}
