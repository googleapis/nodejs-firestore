import synthtool as s
import synthtool.gcp as gcp
import logging
import subprocess
import os

logging.basicConfig(level=logging.DEBUG)

gapic = gcp.GAPICGenerator()

# tasks has two product names, and a poorly named artman yaml
v1_admin_library = gapic.node_library(
    "firestore-admin", "v1", config_path="/google/firestore/admin/artman_firestore_v1.yaml"
)
v1beta1_library = gapic.node_library(
    "firestore", "v1beta1", config_path="/google/firestore/artman_firestore.yaml"
)
v1_library = gapic.node_library(
    "firestore", "v1", config_path="/google/firestore/artman_firestore_v1.yaml"
)

# skip index, protos, package.json, and README.md
s.copy(v1_admin_library, "dev", excludes=["package.json", "README.md", "src/index.js", "src/v1/index.js"])
s.copy(v1beta1_library, "dev", excludes=["package.json", "README.md", "src/index.js", "src/v1beta1/index.js"])
s.copy(v1_library, "dev", excludes=["package.json", "README.md", "src/index.js", "src/v1/index.js"])

# package.json is one level deeper since firestore's src/ is under dev/
s.replace(
    "dev/src/v1/firestore_admin_client.js", "../../package.json", "../../../package.json"
)
s.replace(
    "dev/src/v1beta1/firestore_client.js", "../../package.json", "../../../package.json"
)
s.replace(
    "dev/src/v1/firestore_client.js", "../../package.json", "../../../package.json"
)

# Fix dropping of google-cloud-resource-header
# See: https://github.com/googleapis/nodejs-firestore/pull/375
s.replace(
    "dev/src/v1beta1/firestore_client.js",
    "return this\._innerApiCalls\.listen\(options\);",
    "return this._innerApiCalls.listen({}, options);",
)
s.replace(
    "dev/src/v1/firestore_client.js",
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

# remove browser.js, it does not work with TypeScript yet
os.unlink('dev/src/browser.js')
os.unlink('dev/webpack.config.js')

# Node.js specific cleanup
subprocess.run(["npm", "install"])
subprocess.run(["npm", "run", "fix"])
os.chdir("dev")
subprocess.run(["npx", "compileProtos", "src"])
