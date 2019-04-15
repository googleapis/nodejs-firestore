# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/@google-cloud/firestore?activeTab=versions

## v1.2.0

03-21-2019 14:17 PDT

### New Features
- feature: Release the V1 Admin API ([#590](https://github.com/googleapis/nodejs-firestore/pull/590))
  The Firestore Node SDK now exposes the Firestore Admin API (via `v1.FirebaseAdminClient()`).

### Implementation Changes
- deps/refactor: Removing @google-cloud/projectify ([#564](https://github.com/googleapis/nodejs-firestore/pull/564))

### Dependencies
- chore(deps): update dependency hard-rejection to v2

### Documentation
- fix(docs): add namespaces so docs are generated ([#591](https://github.com/googleapis/nodejs-firestore/pull/591))
- docs: fix typo in doc strings ([#585](https://github.com/googleapis/nodejs-firestore/pull/585))

### Internal / Testing Changes
- chore: publish to npm using wombat ([#586](https://github.com/googleapis/nodejs-firestore/pull/586))
- build: use per-repo publish token ([#582](https://github.com/googleapis/nodejs-firestore/pull/582))
- refactor: update json import paths ([#580](https://github.com/googleapis/nodejs-firestore/pull/580))

## v1.1.0

03-10-2019 20:09 PDT

### New Features
- feature: Added `FieldValue.increment()`, which can be used in `create()`, `update()` and `set(..., {merge:true})` to 
  increment or decrement numeric field values safely without transactions ([#444](https://github.com/googleapis/nodejs-firestore/pull/444))

### Implementation Changes
- fix: Allow async functions ([#576](https://github.com/googleapis/nodejs-firestore/pull/576))
- fix: Don't call stream.end() on Watch ended by server ([#565](https://github.com/googleapis/nodejs-firestore/pull/565))

### Internal / Testing Changes
- refactor: async/await to test/order.ts ([#566](https://github.com/googleapis/nodejs-firestore/pull/566))
- build: Add docuploader credentials to node publish jobs ([#572](https://github.com/googleapis/nodejs-firestore/pull/572))
- build: update release config ([#570](https://github.com/googleapis/nodejs-firestore/pull/570))
- build: use node10 to run samples-test, system-test etc ([#571](https://github.com/googleapis/nodejs-firestore/pull/571))

## v1.0.2

03-04-2019 13:32 PST

### Implementation Changes

- fix: throw on invalid credentials ([#548](https://github.com/googleapis/nodejs-firestore/pull/548))

### Dependencies

- fix(deps): update dependency google-gax to ^0.25.0 ([#535](https://github.com/googleapis/nodejs-firestore/pull/535))
- chore(deps): update dependency mocha to v6
- chore(deps): update dependency duplexify to v4 ([#539](https://github.com/googleapis/nodejs-firestore/pull/539))

### Documentation

- docs: update comments on protos ([#559](https://github.com/googleapis/nodejs-firestore/pull/559))
- docs: update API doc comments ([#557](https://github.com/googleapis/nodejs-firestore/pull/557))
- docs: update links in contrib guide ([#550](https://github.com/googleapis/nodejs-firestore/pull/550))
- docs: add lint/fix example to contributing guide ([#541](https://github.com/googleapis/nodejs-firestore/pull/541))
- docs: fix example comments ([#540](https://github.com/googleapis/nodejs-firestore/pull/540))
- doc: show GA message in README.md ([#536](https://github.com/googleapis/nodejs-firestore/pull/536))
- Add note about Datastore mode ([#552](https://github.com/googleapis/nodejs-firestore/pull/552))
- chore: move CONTRIBUTING.md to root ([#543](https://github.com/googleapis/nodejs-firestore/pull/543))
- docs: update contributing path in README ([#544](https://github.com/googleapis/nodejs-firestore/pull/544))

### Internal / Testing Changes

- refactor(typescript): enable noImplicitAny ([#553](https://github.com/googleapis/nodejs-firestore/pull/553))
- chore: update array types ([#555](https://github.com/googleapis/nodejs-firestore/pull/555))
- Finish TypeScript Migration ([#512](https://github.com/googleapis/nodejs-firestore/pull/512))
- refactor: improve generated code style. ([#538](https://github.com/googleapis/nodejs-firestore/pull/538))
- Remove unhandled Promise rejection warning ([#556](https://github.com/googleapis/nodejs-firestore/pull/556))
- build: use linkinator for docs test ([#549](https://github.com/googleapis/nodejs-firestore/pull/549))
- build: create docs test npm scripts ([#547](https://github.com/googleapis/nodejs-firestore/pull/547))
- build: test using @grpc/grpc-js in CI ([#546](https://github.com/googleapis/nodejs-firestore/pull/546))

## v1.0.1

01-29-2019 14:02 PST

# Documentation

- doc: update README.md to show this library as GA ([#532](https://github.com/googleapis/nodejs-firestore/pull/532))
- fix(samples): constructor doesn't need project or cred options ([#533](https://github.com/googleapis/nodejs-firestore/pull/533))

## v1.0.0

01-29-2019 12:12 PST

This is the Firestore Node.js Client Library GA release.

## v0.21.0

01-25-2019 12:21 PST

This release brings in google-gax update to 0.24.0 which had its dependency google-auth-library updated to 3.0.0^ that swaps out axios in favour of gaxios and addresses an issue using the library behind a proxy (https://github.com/googleapis/nodejs-firestore/issues/493).

### Dependencies
- chore(deps): update dependency ts-node to v8 ([#526](https://github.com/googleapis/nodejs-firestore/pull/526))
- fix(deps): update dependency google-gax to ^0.24.0 ([#529](https://github.com/googleapis/nodejs-firestore/pull/529))

### Documentation
- build: ignore googleapis.com in doc link check ([#527](https://github.com/googleapis/nodejs-firestore/pull/527))
- docs: fix import links in the jsdocs ([#524](https://github.com/googleapis/nodejs-firestore/pull/524))

### Internal / Testing Changes
- chore: update year in the license headers. ([#523](https://github.com/googleapis/nodejs-firestore/pull/523))

## v0.20.0

01-16-2019 13:14 PST

#### BREAKING: The `timestampsInSnapshots` default has changed to true.
The `timestampsInSnapshots` setting is now enabled by default so timestamp
fields read from a `DocumentSnapshot` will be returned as `Timestamp` objects
instead of `Date`. Any code expecting to receive a `Date` object must be
updated.

#### DEPRECATED: `Firestore.v1beta1` replaced by `Firestore.v1`
If you are currently using `Firestore.v1beta1.FirestoreClient`, you must switch
to `Firestore.v1.FirestoreClient`. No other changes should be required as the
API is 100% identical.

### Bug Fixes
- fix: getAll function signature to allow array destructuring ([#515](https://github.com/googleapis/nodejs-firestore/pull/515))
- fix: update grpc retry config ([#464](https://github.com/googleapis/nodejs-firestore/pull/464))

### New Features
- feat: update to v1 protos ([#516](https://github.com/googleapis/nodejs-firestore/pull/516))
- feat: add additional field transform types ([#521](https://github.com/googleapis/nodejs-firestore/pull/521))

### Dependencies
- fix(deps): update dependency google-gax to ^0.23.0 ([#518](https://github.com/googleapis/nodejs-firestore/pull/518))

### Documentation
- fix(docs): remove unused long running operations types
- docs: elaborate on QuerySnapshot.forEach ([#480](https://github.com/googleapis/nodejs-firestore/pull/480))
- docs: update doc writetime ([#475](https://github.com/googleapis/nodejs-firestore/pull/475))
- docs: Fix example for writeTime ([#474](https://github.com/googleapis/nodejs-firestore/pull/474))
- chore: update license file ([#473](https://github.com/googleapis/nodejs-firestore/pull/473))
- docs: update readme badges ([#470](https://github.com/googleapis/nodejs-firestore/pull/470))

### Internal / Testing Changes
- build: check broken links in generated docs ([#511](https://github.com/googleapis/nodejs-firestore/pull/511))
- chore(build): inject yoshi automation key ([#492](https://github.com/googleapis/nodejs-firestore/pull/492))
- chore: update nyc and eslint configs ([#491](https://github.com/googleapis/nodejs-firestore/pull/491))
- chore: fix publish.sh permission +x ([#489](https://github.com/googleapis/nodejs-firestore/pull/489))
- fix(build): fix Kokoro release script ([#488](https://github.com/googleapis/nodejs-firestore/pull/488))
- build: add Kokoro configs for autorelease ([#487](https://github.com/googleapis/nodejs-firestore/pull/487))
- chore: add synth.metadata ([#485](https://github.com/googleapis/nodejs-firestore/pull/485))
- chore: always nyc report before calling codecov ([#482](https://github.com/googleapis/nodejs-firestore/pull/482))
- chore: nyc ignore build/test by default ([#479](https://github.com/googleapis/nodejs-firestore/pull/479))
- chore(build): update the prettier config ([#476](https://github.com/googleapis/nodejs-firestore/pull/476))
- chore(deps): update dependency typescript to ~3.2.0 ([#467](https://github.com/googleapis/nodejs-firestore/pull/467))
- fix(build): fix system key decryption ([#468](https://github.com/googleapis/nodejs-firestore/pull/468))
- Adding array-contains to error message ([#465](https://github.com/googleapis/nodejs-firestore/pull/465))

## v0.17.0

### Implementation Changes
- Regenerate library with synth.py customizations ([#345](https://github.com/googleapis/nodejs-firestore/pull/345))
  - contains some documentation and internal timeout changes
- Converting backoff.js to TypeScript ([#328](https://github.com/googleapis/nodejs-firestore/pull/328))
- Making .dotChanges a method ([#324](https://github.com/googleapis/nodejs-firestore/pull/324))

### Dependencies
- chore(deps): update dependency nyc to v13 ([#329](https://github.com/googleapis/nodejs-firestore/pull/329))
- fix(deps): update dependency google-gax to ^0.19.0 ([#325](https://github.com/googleapis/nodejs-firestore/pull/325))

### Documentation
- Fix DocumentReference.get() docs ([#332](https://github.com/googleapis/nodejs-firestore/pull/332))

### Internal / Testing Changes
- Retry npm install in CI ([#341](https://github.com/googleapis/nodejs-firestore/pull/341))
- make synth.py generate library to ./dev ([#337](https://github.com/googleapis/nodejs-firestore/pull/337))
- Revert "Re-generate library using /synth.py ([#331](https://github.com/googleapis/nodejs-firestore/pull/331))" ([#334](https://github.com/googleapis/nodejs-firestore/pull/334))
- Re-generate library using /synth.py ([#331](https://github.com/googleapis/nodejs-firestore/pull/331))

