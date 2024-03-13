/*
  Copyright 2024 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const execaNode = require('execa');
const fs = require('fs-extra');
const path = require('path');
const {join} = path;

async function apiReport(opts) {
  const cwd = opts.cwd;

  // Location of the created API report file.
  // This file should be checked in.
  const outputDir = join(cwd, 'api-report');
  await fs.ensureDir(outputDir);

  console.log(outputDir);

  // Create API Extractor config file for the package.
  // This config extends the API Extractor config file
  // used by Cloud RAD, to ensure the base configuration
  // is the sme.
  const apiExtractorConfig = {
    extends: join(opts.cloudRadApiExtractorConfigPath),
    mainEntryPointFilePath: join(cwd, 'build', 'src', 'index.d.ts'),
    projectFolder: cwd,
    docModel: {
      enabled: false,
    },
    apiReport: {
      enabled: true,
      reportFolder: outputDir,
    },
    dtsRollup: {
      enabled: false,
    },
    messages: {
      extractorMessageReporting: {
        'ae-forgotten-export': {
          logLevel: 'warning',
        },
      },
    },
  };
  const apiExtractorConfigPath = join(cwd, 'api-extractor.json');
  await fs.writeFile(
    apiExtractorConfigPath,
    JSON.stringify(apiExtractorConfig, null, 2)
  );

  // Run API Extractor
  const apiExtractorCmd = join(
    process.cwd(),
    'node_modules',
    '.bin',
    'api-extractor'
  );
  await withLogs(execaNode)(apiExtractorCmd, ['run', '--local']);

  // Cleanup
  await fs.remove(apiExtractorConfigPath);

  return outputDir;
}

function withLogs(execaFn) {
  return async function (cmd, args, cwd) {
    const opts = {cwd};

    opts.stdout = process.stdout;
    opts.stderr = process.stderr;

    return execaFn(cmd, args, opts);
  };
}

apiReport({
  cloudRadApiExtractorConfigPath: require.resolve(
    '@google-cloud/cloud-rad/api-extractor.json'
  ),
  cwd: process.cwd(),
})
  .then(outputDir => {
    console.log(`SUCCESS: API Report written to ${outputDir}`);
  })
  .catch(err => {
    console.log(`FAILED: ${err}`);
  });
