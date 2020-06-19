import synthtool as s
import synthtool.gcp as gcp
import synthtool.languages.node as node
import logging
import os

logging.basicConfig(level=logging.DEBUG)

AUTOSYNTH_MULTIPLE_COMMITS = True


gapic_micro = gcp.GAPICMicrogenerator()

v1_admin_library = gapic_micro.typescript_library(
    "firestore-admin", "v1", proto_path="/google/firestore/admin/v1",
    generator_args={'grpc-service-config': 'google/firestore/admin/v1/firestore_admin_grpc_service_config.json'}
)
v1beta1_library = gapic_micro.typescript_library(
    "firestore", "v1beta1", proto_path="/google/firestore/v1beta1",
    generator_args={'grpc-service-config': 'google/firestore/v1beta1/firestore_grpc_service_config.json'}
)
v1_library = gapic_micro.typescript_library(
    "firestore", "v1", proto_path="/google/firestore/v1",
    generator_args={'grpc-service-config': 'google/firestore/v1/firestore_grpc_service_config.json'}
)

# skip index, protos, package.json, and README.md
s.copy(v1_admin_library, "dev", excludes=["package.json", "README.md", "src/index.ts", "src/v1/index.ts", 
    "tsconfig.json", "tslint.json", "linkinator.config.json", "webpack.config.js"])
s.copy(v1beta1_library, "dev", excludes=["package.json", "README.md", "src/index.ts", "src/v1beta1/index.ts",
    "tsconfig.json", "tslint.json", "linkinator.config.json", "webpack.config.js"])
s.copy(v1_library, "dev", excludes=["package.json", "README.md", "src/index.ts", "src/v1/index.ts",
    "tsconfig.json", "tslint.json", "linkinator.config.json", "webpack.config.js"])

# Fix dropping of google-cloud-resource-header
# See: https://github.com/googleapis/nodejs-firestore/pull/375
s.replace(
    "dev/src/v1beta1/firestore_client.ts",
    "return this\._innerApiCalls\.listen\(options\);",
    "return this._innerApiCalls.listen({}, options);",
)
s.replace(
    "dev/src/v1/firestore_client.ts",
    "return this\._innerApiCalls\.listen\(options\);",
    "return this._innerApiCalls.listen({}, options);",
)

# Copy template files
common_templates = gcp.CommonTemplates()
templates = common_templates.node_library(
    source_location="build/src",
    test_project="node-gcloud-ci",
    excludes=[
      ".kokoro/presubmit/node10/system-test.cfg",
      ".kokoro/continuous/node10/system-test.cfg",
      ".kokoro/presubmit/node10/samples-test.cfg",
      ".kokoro/continuous/node10/samples-test.cfg"
    ]
)

s.copy(templates)

# use the existing proto .js / .d.ts files
s.replace(
   "dev/src/v1/firestore_client.ts",
   "/protos/protos'",
   "/protos/firestore_v1_proto_api'"
 )
s.replace(
  "dev/test/gapic-firestore-v1.ts",
  "/protos/protos'",
  "/protos/firestore_v1_proto_api'"
)
s.replace(
   "dev/src/v1/firestore_admin_client.ts",
   "/protos/protos'",
   "/protos/firestore_admin_v1_proto_api'"
 )
s.replace(
  "dev/test/gapic-firestore_admin-v1.ts",
  "/protos/protos'",
  "/protos/firestore_admin_v1_proto_api'"
)
s.replace(
   "dev/src/v1beta1/firestore_client.ts",
   "/protos/protos'",
   "/protos/firestore_v1beta1_proto_api'"
 )
s.replace(
  "dev/test/gapic-firestore-v1beta1.ts",
  "/protos/protos'",
  "/protos/firestore_v1beta1_proto_api'"
)

# Remove auto-generated packaging tests
os.system('rm -rf dev/system-test/fixtures dev/system-test/install.ts')

node.install()
node.fix()
os.chdir("dev")
node.compile_protos()
os.unlink('protos/protos.js')
os.unlink('protos/protos.d.ts')
os.unlink('.jsdoc.js')
