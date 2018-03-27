<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [Google Cloud Firestore: Node.js Client](https://github.com/googleapis/nodejs-firestore)

[![release level](https://img.shields.io/badge/release%20level-beta-yellow.svg?style&#x3D;flat)](https://cloud.google.com/terms/launch-stages)
[![CircleCI](https://img.shields.io/circleci/project/github/googleapis/nodejs-firestore.svg?style=flat)](https://circleci.com/gh/googleapis/nodejs-firestore)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/github/googleapis/nodejs-firestore?branch=master&svg=true)](https://ci.appveyor.com/project/googleapis/nodejs-firestore)
[![codecov](https://img.shields.io/codecov/c/github/googleapis/nodejs-firestore/master.svg?style=flat)](https://codecov.io/gh/googleapis/nodejs-firestore)

> Node.js idiomatic client for [Cloud Firestore][product-docs].

[Google Cloud Firestore](https://firebase.google.com/docs/firestore/) is a NoSQL document database built for automatic scaling, high performance, and ease of application development.


* [Cloud Firestore Node.js Client API Reference][client-docs]
* [github.com/googleapis/nodejs-firestore](https://github.com/googleapis/nodejs-firestore)
* [Cloud Firestore Documentation][product-docs]

Read more about the client libraries for Cloud APIs, including the older
Google APIs Client Libraries, in [Client Libraries Explained][explained].

[explained]: https://cloud.google.com/apis/docs/client-libraries-explained

**Table of contents:**

* [Quickstart](#quickstart)
  * [Before you begin](#before-you-begin)
  * [Installing the client library](#installing-the-client-library)
  * [Using the client library](#using-the-client-library)
* [Versioning](#versioning)
* [Contributing](#contributing)
* [License](#license)

## Quickstart

### Before you begin

1.  Select or create a Cloud Platform project.

    [Go to the projects page][projects]

1.  Enable the Google Cloud Firestore API.

    [Enable the API][enable_api]

1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.

[projects]: https://console.cloud.google.com/project
[enable_api]: https://console.cloud.google.com/flows/enableapi?apiid=firestore.googleapis.com
[auth]: https://cloud.google.com/docs/authentication/getting-started

### Installing the client library

    npm install --save @google-cloud/firestore

### Using the client library

```javascript
const Firestore = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: 'YOUR_PROJECT_ID',
  keyFilename: '/path/to/keyfile.json',
});

const document = firestore.doc('posts/intro-to-firestore');

// Enter new data into the document.
document.set({
  title: 'Welcome to Firestore',
  body: 'Hello World',
}).then(() => {
  // Document created successfully.
});

// Update an existing document.
document.update({
  body: 'My first Firestore app',
}).then(() => {
  // Document updated successfully.
});

// Read the document.
document.get().then(doc => {
  // Document read successfully.
});

// Delete the document.
document.delete().then(() => {
  // Document deleted successfully.
});
```


The [Cloud Firestore Node.js Client API Reference][client-docs] documentation
also contains samples.

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

This library is considered to be in **beta**. This means it is expected to be
mostly stable while we work toward a general availability release; however,
complete stability is not guaranteed. We will address issues and requests
against beta libraries with a high priority.

More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/googleapis/nodejs-firestore/blob/master/.github/CONTRIBUTING.md).

## License

Apache Version 2.0

See [LICENSE](https://github.com/googleapis/nodejs-firestore/blob/master/LICENSE)

[client-docs]: https://cloud.google.com/nodejs/docs/reference/firestore/latest/
[product-docs]: https://firebase.google.com/docs/firestore/
[shell_img]: //gstatic.com/cloudssh/images/open-btn.png
