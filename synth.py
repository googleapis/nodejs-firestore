import synthtool as s
import synthtool.gcp as gcp
import logging
import subprocess

logging.basicConfig(level=logging.DEBUG)

gapic = gcp.GAPICGenerator()

# tasks has two product names, and a poorly named artman yaml
library = gapic.node_library(
    'firestore', 'v1beta1',
    config_path='/google/firestore/artman_firestore.yaml')

# skip index, protos, package.json, and README.md
s.copy(
    library,
    excludes=['package.json', 'README.md', 'src/index.js',
              'src/v1beta1/index.js'])

#
# Node.js specific cleanup
#
subprocess.run(['npm', 'install'])

# prettify and lint
subprocess.run(['npm', 'run', 'prettier'])
subprocess.run(['npm', 'run', 'lint'])
