/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {expect} from 'chai';
import * as sinon from 'sinon';
import {ObjectValue, ProtoSerializable, Serializer} from '../src/serializer';
import {google} from '../protos/firestore_v1_proto_api';
import IPipeline = google.firestore.v1.IPipeline;
import {StructuredPipeline} from '../src/pipelines/structured-pipeline';
import {createInstance} from './util/helpers';
import {Firestore} from '../src';

describe('StructuredPipeline', () => {
  let db: Firestore | undefined;
  beforeEach(async () => {
    db = await createInstance();
  });

  afterEach(async () => {
    if (db) {
      await db.terminate();
      db = undefined;
    }
  });

  it('should serialize the pipeline argument', async () => {
    const pipeline: ProtoSerializable<IPipeline> = {
      _toProto: sinon.fake.returns({} as IPipeline),
    };
    const structuredPipeline = new StructuredPipeline(pipeline, {}, {});

    const proto = structuredPipeline._toProto(new Serializer(db!));

    expect(proto).to.deep.equal({
      pipeline: {},
      options: {},
    });

    expect((pipeline._toProto as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('should support known options', () => {
    const pipeline: ProtoSerializable<IPipeline> = {
      _toProto: sinon.fake.returns({} as IPipeline),
    };
    const structuredPipeline = new StructuredPipeline(
      pipeline,
      {
        indexMode: 'recommended',
      },
      {}
    );

    const proto = structuredPipeline._toProto(new Serializer(db!));

    expect(proto).deep.equal({
      pipeline: {},
      options: {
        index_mode: {
          stringValue: 'recommended',
        },
      },
    });

    expect((pipeline._toProto as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('should support unknown options', () => {
    const pipeline: ProtoSerializable<IPipeline> = {
      _toProto: sinon.fake.returns({} as IPipeline),
    };
    const structuredPipeline = new StructuredPipeline(
      pipeline,
      {},
      {
        foo_bar: {stringValue: 'baz'},
      }
    );

    const proto = structuredPipeline._toProto(new Serializer(db!));

    console.log(JSON.stringify(proto));

    expect(proto).to.deep.equal({
      pipeline: {},
      options: {
        foo_bar: {
          stringValue: 'baz',
        },
      },
    });

    expect((pipeline._toProto as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('should support unknown nested options', () => {
    const pipeline: ProtoSerializable<IPipeline> = {
      _toProto: sinon.fake.returns({} as IPipeline),
    };
    const structuredPipeline = new StructuredPipeline(
      pipeline,
      {},
      {
        'foo.bar': {stringValue: 'baz'},
      }
    );

    const proto = structuredPipeline._toProto(new Serializer(db!));

    expect(proto).to.deep.equal({
      pipeline: {},
      options: {
        foo: {
          mapValue: {
            fields: {
              bar: {stringValue: 'baz'},
            },
          },
        },
      },
    });

    expect((pipeline._toProto as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('should support options override', () => {
    const pipeline: ProtoSerializable<IPipeline> = {
      _toProto: sinon.fake.returns({} as IPipeline),
    };
    const structuredPipeline = new StructuredPipeline(
      pipeline,
      {
        indexMode: 'recommended',
      },
      {
        index_mode: {stringValue: 'baz'},
      }
    );

    const proto = structuredPipeline._toProto(new Serializer(db!));

    expect(proto).to.deep.equal({
      pipeline: {},
      options: {
        index_mode: {
          stringValue: 'baz',
        },
      },
    });

    expect((pipeline._toProto as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('should support options override of nested field', () => {
    const pipeline: ProtoSerializable<IPipeline> = {
      _toProto: sinon.fake.returns({} as IPipeline),
    };

    const structuredPipeline = new StructuredPipeline(
      pipeline,
      {},
      {
        'foo.bar': {integerValue: 123},
      }
    );

    // Fake known options with a nested {foo: {bar: "baz"}}
    structuredPipeline._getKnownOptions = sinon.fake.returns(
      new ObjectValue({
        mapValue: {
          fields: {
            foo: {
              mapValue: {
                fields: {
                  bar: {stringValue: 'baz'},
                  waldo: {booleanValue: true},
                },
              },
            },
          },
        },
      })
    );

    const proto = structuredPipeline._toProto(new Serializer(db!));

    expect(proto).to.deep.equal({
      pipeline: {},
      options: {
        foo: {
          mapValue: {
            fields: {
              bar: {
                integerValue: '123',
              },
              waldo: {
                booleanValue: true,
              },
            },
          },
        },
      },
    });

    expect((pipeline._toProto as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('will replace a nested object if given a new object', () => {
    const pipeline: ProtoSerializable<IPipeline> = {
      _toProto: sinon.fake.returns({} as IPipeline),
    };

    const structuredPipeline = new StructuredPipeline(
      pipeline,
      {},
      {
        foo: {mapValue: {fields: {bar: {integerValue: 123}}}},
      }
    );

    // Fake known options with a nested {foo: {bar: "baz"}}
    structuredPipeline._getKnownOptions = sinon.fake.returns(
      new ObjectValue({
        mapValue: {
          fields: {
            foo: {
              mapValue: {
                fields: {
                  bar: {stringValue: 'baz'},
                  waldo: {booleanValue: true},
                },
              },
            },
          },
        },
      })
    );

    const proto = structuredPipeline._toProto(new Serializer(db!));

    expect(proto).to.deep.equal({
      pipeline: {},
      options: {
        foo: {
          mapValue: {
            fields: {
              bar: {
                integerValue: '123',
              },
            },
          },
        },
      },
    });

    expect((pipeline._toProto as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('will replace a top level property that is not an object if given a nested field with dot notation', () => {
    const pipeline: ProtoSerializable<IPipeline> = {
      _toProto: sinon.fake.returns({} as IPipeline),
    };

    const structuredPipeline = new StructuredPipeline(
      pipeline,
      {},
      {
        foo: {
          mapValue: {
            fields: {
              bar: {stringValue: '123'},
              waldo: {booleanValue: true},
            },
          },
        },
      }
    );

    // Fake known options with a nested {foo: {bar: "baz"}}
    structuredPipeline._getKnownOptions = sinon.fake.returns(
      new ObjectValue({
        mapValue: {
          fields: {
            foo: {integerValue: 123},
          },
        },
      })
    );

    const proto = structuredPipeline._toProto(new Serializer(db!));

    expect(proto).to.deep.equal({
      pipeline: {},
      options: {
        foo: {
          mapValue: {
            fields: {
              bar: {
                stringValue: '123',
              },
              waldo: {
                booleanValue: true,
              },
            },
          },
        },
      },
    });

    expect((pipeline._toProto as sinon.SinonSpy).calledOnce).to.be.true;
  });
});
