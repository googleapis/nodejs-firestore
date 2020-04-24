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
    generator_args={'package-name': '@google-cloud/firestore', 
    'grpc-service-config': 'google/firestore/admin/v1/firestore_admin_grpc_service_config.json'}
)
v1beta1_library = gapic_micro.typescript_library(
    "firestore", "v1beta1", proto_path="/google/firestore/v1beta1",
    generator_args={'package-name': '@google-cloud/firestore', 
    'grpc-service-config': 'google/firestore/v1beta1/firestore_grpc_service_config.json'}
)
v1_library = gapic_micro.typescript_library(
    "firestore", "v1", proto_path="/google/firestore/v1",
    generator_args={'package-name': '@google-cloud/firestore', 
    'grpc-service-config': 'google/firestore/v1/firestore_grpc_service_config.json'}
)

# skip index, protos, package.json, and README.md
s.copy(v1_admin_library, "dev", excludes=["package.json", "README.md", "src/index.ts", "src/v1/index.ts", 
    "tsconfig.json", "linkinator.config.json", "webpack.config.js"])
s.copy(v1beta1_library, "dev", excludes=["package.json", "README.md", "src/index.ts", "src/v1beta1/index.ts",
    "tsconfig.json", "linkinator.config.json", "webpack.config.js"])
s.copy(v1_library, "dev", excludes=["package.json", "README.md", "src/index.ts", "src/v1/index.ts",
    "tsconfig.json", "linkinator.config.json", "webpack.config.js"])

# Fix dropping of google-cloud-resource-header
# See: https://github.com/googleapis/nodejs-firestore/pull/375
s.replace(
    "dev/src/v1beta1/firestore_client.ts",
    "return this\.innerApiCalls\.listen\(options\);",
    "return this.innerApiCalls.listen({}, options);",
)
s.replace(
    "dev/src/v1/firestore_client.ts",
    "return this\.innerApiCalls\.listen\(options\);",
    "return this.innerApiCalls.listen({}, options);",
)
s.replace(
    "dev/test/gapic_firestore_v1beta1.ts",
    "calledWithExactly\(undefined\)",
    "calledWithExactly({}, undefined)",
)
s.replace(
    "dev/src/v1beta1/firestore_client.ts",
    "return this\.innerApiCalls\.write\(options\);",
    "return this.innerApiCalls.write({}, options);",
)
s.replace(
    "dev/src/v1/firestore_client.ts",
    "return this\.innerApiCalls\.write\(options\);",
    "return this.innerApiCalls.write({}, options);",
)
s.replace(
    "dev/test/gapic_firestore_v1.ts",
    "calledWithExactly\(undefined\)",
    "calledWithExactly({}, undefined)",
)

# Copy template files
common_templates = gcp.CommonTemplates()
templates = common_templates.node_library(
    source_location="build/src", test_project="node-gcloud-ci"
)

s.copy(templates)

# use the existing proto .js / .d.ts files
s.replace(
   "dev/src/v1/firestore_client.ts",
   "/protos/protos'",
   "/protos/firestore_v1_proto_api'"
 )
s.replace(
  "dev/test/gapic_firestore_v1.ts",
  "/protos/protos'",
  "/protos/firestore_v1_proto_api'"
)
s.replace(
  "dev/test/gapic_firestore_v1.ts",
  "import \* as firestoreModule from '\.\./src';",
  "import * as firestoreModule from '../src/v1';"
)
s.replace(
  "dev/test/gapic_firestore_v1.ts",
  "firestoreModule\.v1",
  "firestoreModule"
)
s.replace(
   "dev/src/v1/firestore_admin_client.ts",
   "/protos/protos'",
   "/protos/firestore_admin_v1_proto_api'"
 )
s.replace(
  "dev/test/gapic_firestore_admin_v1.ts",
  "/protos/protos'",
  "/protos/firestore_admin_v1_proto_api'"
)
s.replace(
  "dev/test/gapic_firestore_admin_v1.ts",
  "import \* as firestoreadminModule from '\.\./src';",
  "import * as firestoreadminModule from '../src/v1';"
)
s.replace(
  "dev/test/gapic_firestore_admin_v1.ts",
  "firestoreadminModule\.v1",
  "firestoreadminModule"
)
s.replace(
   "dev/src/v1beta1/firestore_client.ts",
   "/protos/protos'",
   "/protos/firestore_v1beta1_proto_api'"
)
s.replace(
  "dev/test/gapic_firestore_v1beta1.ts",
  "/protos/protos'",
  "/protos/firestore_v1beta1_proto_api'"
)
s.replace(
  "dev/test/gapic_firestore_v1beta1.ts",
  "import \* as firestoreModule from \'../src\';",
  "import * as firestoreModule from '../src/v1beta1';"
)
s.replace(
  "dev/test/gapic_firestore_v1beta1.ts",
  "firestoreModule\.v1beta1",
  "firestoreModule"
)

# Mark v1beta1 as deprecated
s.replace(
  "dev/src/v1beta1/firestore_client.ts",
  "@class",
  "@class\n * @deprecated Use v1/firestore_client instead."
)
s.replace(
  "dev/src/v1beta1/firestore_client.ts",
  "const version",
  "// tslint:disable deprecation\n\nconst version",
  1
)

os.rename("dev/.gitignore", ".gitignore")
os.rename("dev/.eslintignore", ".eslintignore")
os.rename("dev/.eslintrc.json", ".eslintrc.json")
os.rename("dev/.mocharc.js", ".mocharc.js")
os.rename("dev/.jsdoc.js", ".jsdoc.js")
os.rename("dev/.prettierrc.js", ".prettierrc.js")

s.replace(".jsdoc.js", "protos", "build/protos", 1)

# Remove auto-generated packaging tests
os.system('rm -rf dev/system-test/fixtures dev/system-test/install.ts')

node.install()
node.fix()
os.chdir("dev")
node.compile_protos()
os.chdir("protos")
os.unlink('protos.js')
os.unlink('protos.d.ts')
subprocess.run('./update.sh', shell=True)
os.chdir("../../")
