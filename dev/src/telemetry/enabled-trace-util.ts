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

import {context, trace, Tracer} from '@opentelemetry/api';
import {Context} from './context';
import {Span} from './span';
import {Attributes, TraceUtil} from './trace-util';
import {Span as OpenTelemetrySpan} from '@opentelemetry/api';
import {Settings} from '@google-cloud/firestore';

export class EnabledTraceUtil implements TraceUtil {
  private tracer: Tracer;

  constructor(settings: Settings) {
    let traceProvider = settings.openTelemetryOptions?.traceProvider;

    // If a TraceProvider has not been given to us, we try to use the global one.
    if (!traceProvider) {
      const {trace} = require('@opentelemetry/api');
      traceProvider = trace.getTracerProvider();
    }

    const libVersion = require('../../../package.json').version;
    const libName = require('../../../package.json').name;
    this.tracer = traceProvider.getTracer(libName, libVersion);
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
        otelSpan.addEvent('active span started');
        return fn(new Span(otelSpan)) as ReturnType<F>;
      }
    );
  }

  startSpan(name: string): Span {
    // Get the active context
    const currentContext = Context.currentContext();
    return new Span(
      this.tracer.startSpan(name, undefined, currentContext.otelContext)
    );
  }

  startSpanWithinCurrentContext(name: string): Span {
    return new Span(
      this.tracer.startSpan(
        name,
        undefined,
        context.active()
      )
    );
  }

  startSpanWithContext(name: string, context: Context): Span {
    return new Span(
      this.tracer.startSpan(name, undefined, context.otelContext)
    );
  }

  currentContext(): Context {
    return new Context(context.active());
  }

  currentSpan(): Span {
    return new Span(trace.getActiveSpan());
  }
}
