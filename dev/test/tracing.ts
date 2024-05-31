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

import {describe, it} from 'mocha';
import {createInstance} from './util/helpers';
import {expect, use} from 'chai';
import {DisabledTraceUtil} from '../src/telemetry/disabled-trace-util';
import {EnabledTraceUtil} from '../src/telemetry/enabled-trace-util';

describe('Firestore Tracing Controls', () => {
  it('default firestore settings have tracing disabled', async () => {
    const firestore = await createInstance();
    expect(firestore._traceUtil instanceof DisabledTraceUtil).to.be.true;
  });

  it('no openTelemetryOptions results in tracing disabled', async () => {
    const firestore = await createInstance(undefined, {
      openTelemetryOptions: undefined,
    });
    expect(firestore._traceUtil instanceof DisabledTraceUtil).to.be.true;
  });

  it('openTelemetryOptions.enableTracing controls the tracing feature', async () => {
    let firestore = await createInstance(undefined, {
      openTelemetryOptions: {
        enableTracing: undefined,
      },
    });
    expect(firestore._traceUtil instanceof DisabledTraceUtil).to.be.true;

    firestore = await createInstance(undefined, {
      openTelemetryOptions: {
        enableTracing: false,
      },
    });
    expect(firestore._traceUtil instanceof DisabledTraceUtil).to.be.true;

    firestore = await createInstance(undefined, {
      openTelemetryOptions: {
        enableTracing: true,
      },
    });
    expect(firestore._traceUtil instanceof EnabledTraceUtil).to.be.true;
  });
});
