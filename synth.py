import synthtool as s
import synthtool.gcp as gcp
import logging
import subprocess

logging.basicConfig(level=logging.DEBUG)

gapic = gcp.GAPICGenerator()

# tasks has two product names, and a poorly named artman yaml
library = gapic.node_library(
    "firestore", "v1beta1", config_path="/google/firestore/artman_firestore.yaml"
)

# skip index, protos, package.json, and README.md
s.copy(library, "dev", excludes=["package.json", "README.md", "src/index.js"])

# package.json is one level deeper since firestore's src/ is under dev/
s.replace(
    "dev/src/v1beta1/firestore_client.js", "../../package.json", "../../../package.json"
)

# Special case for firestore: FirestoreClient is exported as top level module.exports
# from gapic-generated code
s.replace(
    "dev/src/v1beta1/index.js",
    "module.exports.FirestoreClient = FirestoreClient",
    "module.exports = FirestoreClient",
)

s.replace(
    "dev/test/gapic-v1beta1.js",
    "new firestoreModule.v1beta1.FirestoreClient\(",
    "new firestoreModule.v1beta1(",
)

# Fix dropping of google-cloud-resource-header
# See: https://github.com/googleapis/nodejs-firestore/pull/375
s.replace(
    "dev/src/v1beta1/firestore_client.js",
    "return this\._innerApiCalls\.listen\(options\);",
    "return this._innerApiCalls.listen({}, options);",
)

# Copy template files
common_templates = gcp.CommonTemplates()
templates = common_templates.node_library(
    source_location="build/src", test_project="node-gcloud-ci"
)

s.copy(templates)

# [START fix-dead-link]
s.replace('**/doc/google/protobuf/doc_timestamp.js',
        'https:\/\/cloud\.google\.com[\s\*]*http:\/\/(.*)[\s\*]*\)',
        r"https://\1)")

s.replace('**/doc/google/protobuf/doc_timestamp.js',
        'toISOString\]',
        'toISOString)')
# [END fix-dead-link]

# Node.js specific cleanup
subprocess.run(["npm", "install"])
subprocess.run(["npm", "run", "fix"])
