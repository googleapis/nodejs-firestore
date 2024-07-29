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

import {Settings} from '@google-cloud/firestore';

import {
  context,
  SpanStatusCode,
  trace,
  Tracer,
  Span as OpenTelemetrySpan,
} from '@opentelemetry/api';

import {Span} from './span';
import {Attributes, TraceUtil} from './trace-util';

export class EnabledTraceUtil implements TraceUtil {
  private tracer: Tracer;

  constructor(settings: Settings) {
    let tracerProvider = settings.openTelemetryOptions?.tracerProvider;

    // If a TracerProvider has not been given to us, we try to use the global one.
    if (!tracerProvider) {
      const {trace} = require('@opentelemetry/api');
      tracerProvider = trace.getTracerProvider();
    }

    const libVersion = require('../../../package.json').version;
    const libName = require('../../../package.json').name;
    this.tracer = tracerProvider.getTracer(libName, libVersion);
  }

  private endSpan(otelSpan: OpenTelemetrySpan, error: Error): void {
    otelSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    otelSpan.recordException(error);
    otelSpan.end();
  }

  startActiveSpan<F extends (span: Span) => unknown>(
    name: string,
    fn: F,
    attributes?: Attributes
  ): ReturnType<F> {
    return this.tracer.startActiveSpan(
      name,
      {
        attributes: attributes,
      },
      (otelSpan: OpenTelemetrySpan) => {
        // Note that if `fn` returns a `Promise`, we want the otelSpan to end
        // after the `Promise` has resolved, NOT after the `fn` has returned.
        // Therefore, we should not use a `finally` clause to end the otelSpan.
        try {
          let result = fn(new Span(otelSpan));
          if (result instanceof Promise) {
            result = result
              .then(value => {
                otelSpan.end();
                return value;
              })
              .catch(error => {
                this.endSpan(otelSpan, error);
                // Returns a Promise.reject the same as the underlying function.
                return Promise.reject(error);
              });
          } else {
            otelSpan.end();
          }
          return result as ReturnType<F>;
        } catch (error) {
          this.endSpan(otelSpan, error);
          // Re-throw the exception to maintain normal error handling.
          throw error;
        }
      }
    );
  }

  startSpan(name: string): Span {
    return new Span(this.tracer.startSpan(name, undefined, context.active()));
  }

  currentSpan(): Span {
    return new Span(trace.getActiveSpan());
  }
}
