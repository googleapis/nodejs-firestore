// Copyright 2020 Google LLC
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
import {expect} from 'chai';
import {fieldFiltersQuery, orderBy, queryEquals, startAt} from './query';
import {
  ApiOverride,
  create,
  createInstance,
  document,
  InvalidApiUsage,
  requestEquals,
  response,
  set,
  stream,
  update,
  updateMask,
  writeResult,
} from './util/helpers';

const FOO_MAP = {
  mapValue: {
    fields: {
      bar: {
        stringValue: 'bar',
      },
    },
  },
};

describe('ignores undefined values', () => {
  it('in set()', () => {
    const overrides: ApiOverride = {
      commit: request => {
        requestEquals(
          request,
          set({
            document: document('documentId', 'foo', 'foo'),
          })
        );
        return response(writeResult(1));
      },
    };

    return createInstance(overrides, {ignoreUndefinedProperties: true}).then(
      firestore => {
        return firestore.doc('collectionId/documentId').set({
          foo: 'foo',
          bar: undefined,
        });
      }
    );
  });

  it('in set({ merge: true })', () => {
    const overrides: ApiOverride = {
      commit: request => {
        requestEquals(
          request,
          set({
            document: document('documentId', 'foo', 'foo'),
            mask: updateMask('foo'),
          })
        );
        return response(writeResult(1));
      },
    };

    return createInstance(overrides, {ignoreUndefinedProperties: true}).then(
      firestore => {
        return firestore.doc('collectionId/documentId').set(
          {
            foo: 'foo',
            bar: undefined,
          },
          {merge: true}
        );
      }
    );
  });

  it('in create()', () => {
    const overrides: ApiOverride = {
      commit: request => {
        requestEquals(
          request,
          create({
            document: document('documentId', 'foo', 'foo'),
          })
        );
        return response(writeResult(1));
      },
    };

    return createInstance(overrides, {ignoreUndefinedProperties: true}).then(
      firestore => {
        return firestore.doc('collectionId/documentId').create({
          foo: 'foo',
          bar: undefined,
        });
      }
    );
  });

  it('in update()', () => {
    const overrides: ApiOverride = {
      commit: request => {
        requestEquals(
          request,
          update({
            document: document('documentId', 'foo', FOO_MAP),
            mask: updateMask('foo'),
          })
        );
        return response(writeResult(1));
      },
    };

    return createInstance(overrides, {ignoreUndefinedProperties: true}).then(
      async firestore => {
        await firestore.doc('collectionId/documentId').update('foo', {
          bar: 'bar',
          baz: undefined,
        });
        await firestore
          .doc('collectionId/documentId')
          .update({foo: {bar: 'bar', baz: undefined}});
      }
    );
  });

  it('with top-level field in update()', () => {
    const overrides: ApiOverride = {
      commit: request => {
        requestEquals(
          request,
          update({
            document: document('documentId', 'foo', 'bar'),
            mask: updateMask('foo'),
          })
        );
        return response(writeResult(1));
      },
    };

    return createInstance(overrides, {ignoreUndefinedProperties: true}).then(
      async firestore => {
        await firestore.doc('collectionId/documentId').update({
          foo: 'bar',
          ignored: undefined,
        });
      }
    );
  });

  it('in query filters', () => {
    const overrides: ApiOverride = {
      runQuery: request => {
        queryEquals(request, fieldFiltersQuery('foo', 'EQUAL', FOO_MAP));
        return stream();
      },
    };

    return createInstance(overrides, {ignoreUndefinedProperties: true}).then(
      firestore => {
        return firestore
          .collection('collectionId')
          .where('foo', '==', {bar: 'bar', baz: undefined})
          .get();
      }
    );
  });

  it('in query cursors', () => {
    const overrides: ApiOverride = {
      runQuery: request => {
        queryEquals(
          request,
          orderBy('foo', 'ASCENDING'),
          startAt(true, FOO_MAP)
        );
        return stream();
      },
    };

    return createInstance(overrides, {ignoreUndefinedProperties: true}).then(
      firestore => {
        return firestore
          .collection('collectionId')
          .orderBy('foo')
          .startAt({bar: 'bar', baz: undefined})
          .get();
      }
    );
  });
});

describe('rejects undefined values', () => {
  describe('in top-level call', () => {
    it('to set()', () => {
      return createInstance({}, {ignoreUndefinedProperties: true}).then(
        firestore => {
          expect(() => {
            firestore
              .doc('collectionId/documentId')
              .set(undefined as InvalidApiUsage);
          }).to.throw(
            'Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.'
          );
        }
      );
    });

    it('to create()', () => {
      return createInstance({}, {ignoreUndefinedProperties: true}).then(
        firestore => {
          expect(() => {
            firestore
              .doc('collectionId/documentId')
              .create(undefined as InvalidApiUsage);
          }).to.throw(
            'Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.'
          );
        }
      );
    });

    it('to update()', () => {
      return createInstance({}, {ignoreUndefinedProperties: true}).then(
        firestore => {
          expect(() => {
            firestore.doc('collectionId/documentId').update('foo', undefined);
          }).to.throw('"undefined" values are only ignored inside of objects.');
        }
      );
    });

    it('to Query.where()', () => {
      return createInstance({}, {ignoreUndefinedProperties: true}).then(
        firestore => {
          expect(() => {
            firestore
              .doc('collectionId/documentId')
              .collection('collectionId')
              .where('foo', '==', undefined);
          }).to.throw('"undefined" values are only ignored inside of objects.');
        }
      );
    });

    it('to Query.startAt()', () => {
      return createInstance({}, {ignoreUndefinedProperties: true}).then(
        firestore => {
          expect(() => {
            firestore
              .doc('collectionId/documentId')
              .collection('collectionId')
              .orderBy('foo')
              .startAt(undefined);
          }).to.throw('"undefined" values are only ignored inside of objects.');
        }
      );
    });
  });

  describe('when setting is disabled', () => {
    it('in set()', () => {
      return createInstance({}).then(firestore => {
        expect(() => {
          firestore.doc('collectionId/documentId').set({
            foo: 'foo',
            bar: undefined,
          });
        }).to.throw(
          'Cannot use "undefined" as a Firestore value (found in field "bar"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.'
        );
      });
    });

    it('in create()', () => {
      return createInstance({}).then(firestore => {
        expect(() => {
          firestore.doc('collectionId/documentId').create({
            foo: 'foo',
            bar: undefined,
          });
        }).to.throw(
          'Cannot use "undefined" as a Firestore value (found in field "bar"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.'
        );
      });
    });

    it('in update()', () => {
      return createInstance({}).then(firestore => {
        expect(() => {
          firestore.doc('collectionId/documentId').update('foo', {
            foo: 'foo',
            bar: undefined,
          });
        }).to.throw(
          'Cannot use "undefined" as a Firestore value (found in field "foo.bar"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.'
        );
      });
    });

    it('in query filters', () => {
      return createInstance({}).then(firestore => {
        expect(() => {
          firestore
            .collection('collectionId')
            .where('foo', '==', {bar: 'bar', baz: undefined});
        }).to.throw(
          'Cannot use "undefined" as a Firestore value (found in field "baz"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.'
        );
      });
    });

    it('in query cursors', () => {
      return createInstance({}).then(firestore => {
        expect(() => {
          firestore
            .collection('collectionId')
            .orderBy('foo')
            .startAt({bar: 'bar', baz: undefined});
        }).to.throw(
          'Cannot use "undefined" as a Firestore value (found in field "baz"). If you want to ignore undefined values, enable `ignoreUndefinedProperties`.'
        );
      });
    });
  });
});
