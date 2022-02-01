#!/bin/bash

# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail
IFS=$'\n\t'

# Variables
PROTOS_DIR="."

# Capture location of pbjs / pbts before we pushd.
PBJS="$(npm bin)/pbjs"


"${PBJS}" --proto_path=. --target=json -o v1.json \
  -r firestore_v1 \
  "${PROTOS_DIR}/google/firestore/v1/*.proto" \
  "${PROTOS_DIR}/google/protobuf/*.proto" "${PROTOS_DIR}/google/type/*.proto" \
  "${PROTOS_DIR}/google/rpc/*.proto" "${PROTOS_DIR}/google/api/*.proto"

