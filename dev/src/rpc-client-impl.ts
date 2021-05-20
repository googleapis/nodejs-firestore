/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as firestore from '@google-cloud/firestore';

import {Duplex, PassThrough, Transform} from 'stream';

import {ExponentialBackoff} from './backoff';

import {logger} from './logger';
import {DEFAULT_DATABASE_ID} from './path';
import {ClientPool} from './pool';
import {
  FirestoreStreamingMethod,
  FirestoreUnaryMethod,
  GapicClient,
  UnaryMethod,
} from './types';
import {Deferred} from './util';

import {CallOptions, grpc, RetryOptions} from 'google-gax';
import {getRetryParams, isPermanentRpcError} from './gax-util';
import {RpcClient} from './rpc-client';

/*!
 * HTTP header for the resource prefix to improve routing and project isolation
 * by the backend.
 */
const CLOUD_RESOURCE_HEADER = 'google-cloud-resource-prefix';

/*!
 * The maximum number of times to retry idempotent requests.
 */
export const MAX_REQUEST_RETRIES = 5;

/*!
 * The default number of idle GRPC channel to keep.
 */
const DEFAULT_MAX_IDLE_CHANNELS = 1;

/*!
 * The maximum number of concurrent requests supported by a single GRPC channel,
 * as enforced by Google's Frontend. If the SDK issues more than 100 concurrent
 * operations, we need to use more than one GAPIC client since these clients
 * multiplex all requests over a single channel.
 */
const MAX_CONCURRENT_REQUESTS_PER_CLIENT = 100;

/**
 * Manages all interactions with `google-gax` for Firestore. This class is
 * lazy-loaded by the main Firestore client to avoid loading `google-gax` at
 * startup.
 */
export class RpcClientImpl implements RpcClient {
  /**
   * A client pool to distribute requests over multiple GAPIC clients in order
   * to work around a connection limit of 100 concurrent requests per client.
   */
  private clientPool: ClientPool<GapicClient>;

  /**
   * The project ID for this client.
   *
   * The project ID is auto-detected during the first request unless a project
   * ID is passed to the constructor (or provided via `.settings()`).
   */
  projectId!: string;

  constructor(private readonly settings: firestore.Settings) {
    const maxIdleChannels =
      this.settings.maxIdleChannels === undefined
        ? DEFAULT_MAX_IDLE_CHANNELS
        : this.settings.maxIdleChannels;
    this.clientPool = new ClientPool<GapicClient>(
      MAX_CONCURRENT_REQUESTS_PER_CLIENT,
      maxIdleChannels,
      /* clientFactory= */ () => {
        let client: GapicClient;

        if (this.settings.ssl === false) {
          const grpcModule = this.settings.grpc ?? grpc;
          const sslCreds = grpcModule.credentials.createInsecure();

          client = new module.exports.v1({
            sslCreds,
            ...this.settings,
          });
        } else {
          client = new module.exports.v1(this.settings);
        }

        logger('Firestore', null, 'Initialized Firestore GAPIC Client');
        return client;
      },
      /* clientDestructor= */ client => client.close()
    );
  }

  async initialize(requestTag: string): Promise<void> {
    try {
      this.projectId = await this.clientPool.run(requestTag, gapicClient =>
        gapicClient.getProjectId()
      );
      logger(
        'Firestore.initializeIfNeeded',
        null,
        'Detected project ID: %s',
        this.projectId
      );
    } catch (err) {
      logger(
        'Firestore.initializeIfNeeded',
        null,
        'Failed to detect project ID: %s',
        err
      );
      throw err;
    }
  }

  /**
   * Returns the root path of the database. Validates that
   * `initializeIfNeeded()` was called before.
   *
   * @private
   */
  get formattedName(): string {
    return `projects/${this.projectId}/databases/${DEFAULT_DATABASE_ID}`;
  }

  terminate(): Promise<void> {
    return this.clientPool.terminate();
  }

  /**
   * Returns GAX call options that set the cloud resource header.
   * @private
   */
  private createCallOptions(
    methodName: string,
    retryCodes?: number[]
  ): CallOptions {
    const callOptions: CallOptions = {
      otherArgs: {
        headers: {
          [CLOUD_RESOURCE_HEADER]: this.formattedName,
          ...this.settings.customHeaders,
          ...this.settings[methodName]?.customHeaders,
        },
      },
    };

    if (retryCodes) {
      const retryParams = getRetryParams(methodName);
      callOptions.retry = new RetryOptions(retryCodes, retryParams);
    }

    return callOptions;
  }

  /**
   * A function returning a Promise that can be retried.
   *
   * @private
   * @callback retryFunction
   * @returns {Promise} A Promise indicating the function's success.
   */

  /**
   * Helper method that retries failed Promises.
   *
   * If 'delayMs' is specified, waits 'delayMs' between invocations. Otherwise,
   * schedules the first attempt immediately, and then waits 100 milliseconds
   * for further attempts.
   *
   * @private
   * @param methodName Name of the Veneer API endpoint that takes a request
   * and GAX options.
   * @param requestTag A unique client-assigned identifier for this request.
   * @param func Method returning a Promise than can be retried.
   * @returns A Promise with the function's result if successful within
   * `attemptsRemaining`. Otherwise, returns the last rejected Promise.
   */
  private async _retry<T>(
    methodName: string,
    requestTag: string,
    func: () => Promise<T>
  ): Promise<T> {
    const backoff = new ExponentialBackoff();

    let lastError: Error | undefined = undefined;

    for (let attempt = 0; attempt < MAX_REQUEST_RETRIES; ++attempt) {
      if (lastError) {
        logger(
          'Firestore._retry',
          requestTag,
          'Retrying request that failed with error:',
          lastError
        );
      }

      try {
        await backoff.backoffAndWait();
        return await func();
      } catch (err) {
        lastError = err;

        if (isPermanentRpcError(err, methodName)) {
          break;
        }
      }
    }

    logger(
      'Firestore._retry',
      requestTag,
      'Request failed with error:',
      lastError
    );
    return Promise.reject(lastError);
  }

  /**
   * Waits for the provided stream to become active and returns a paused but
   * healthy stream. If an error occurs before the first byte is read, the
   * method rejects the returned Promise.
   *
   * @private
   * @param backendStream The Node stream to monitor.
   * @param lifetime A Promise that resolves when the stream receives an 'end',
   * 'close' or 'finish' message.
   * @param requestTag A unique client-assigned identifier for this request.
   * @param request If specified, the request that should be written to the
   * stream after opening.
   * @returns A guaranteed healthy stream that should be used instead of
   * `backendStream`.
   */
  private _initializeStream(
    backendStream: Duplex,
    lifetime: Deferred<void>,
    requestTag: string,
    request?: {}
  ): Promise<Duplex> {
    const resultStream = new PassThrough({objectMode: true});
    resultStream.pause();

    /**
     * Whether we have resolved the Promise and returned the stream to the
     * caller.
     */
    let streamInitialized = false;

    return new Promise<Duplex>((resolve, reject) => {
      function streamReady(): void {
        if (!streamInitialized) {
          streamInitialized = true;
          logger('Firestore._initializeStream', requestTag, 'Releasing stream');
          resolve(resultStream);
        }
      }

      function streamEnded(): void {
        logger(
          'Firestore._initializeStream',
          requestTag,
          'Received stream end'
        );
        resultStream.unpipe(backendStream);
        resolve(resultStream);
        lifetime.resolve();
      }

      function streamFailed(err: Error): void {
        if (!streamInitialized) {
          // If we receive an error before we were able to receive any data,
          // reject this stream.
          logger(
            'Firestore._initializeStream',
            requestTag,
            'Received initial error:',
            err
          );
          reject(err);
        } else {
          logger(
            'Firestore._initializeStream',
            requestTag,
            'Received stream error:',
            err
          );
          // We execute the forwarding of the 'error' event via setImmediate() as
          // V8 guarantees that the Promise chain returned from this method
          // is resolved before any code executed via setImmediate(). This
          // allows the caller to attach an error handler.
          setImmediate(() => {
            resultStream.emit('error', err);
          });
        }
      }

      backendStream.on('data', () => streamReady());
      backendStream.on('error', err => streamFailed(err));
      backendStream.on('end', () => streamEnded());
      backendStream.on('close', () => streamEnded());
      backendStream.on('finish', () => streamEnded());

      backendStream.pipe(resultStream);

      if (request) {
        logger(
          'Firestore._initializeStream',
          requestTag,
          'Sending request: %j',
          request
        );
        backendStream.write(request, 'utf-8', err => {
          if (err) {
            streamFailed(err);
          } else {
            logger(
              'Firestore._initializeStream',
              requestTag,
              'Marking stream as healthy'
            );
            streamReady();
          }
        });
      }
    });
  }

  request<Req, Resp>(
    methodName: FirestoreUnaryMethod,
    request: Req,
    requestTag: string,
    retryCodes?: number[]
  ): Promise<Resp> {
    const callOptions = this.createCallOptions(methodName, retryCodes);

    return this.clientPool.run(requestTag, async gapicClient => {
      try {
        logger('Firestore.request', requestTag, 'Sending request: %j', request);
        const [result] = await (gapicClient[methodName] as UnaryMethod<
          Req,
          Resp
        >)(request, callOptions);
        logger(
          'Firestore.request',
          requestTag,
          'Received response: %j',
          result
        );
        return result;
      } catch (err) {
        logger('Firestore.request', requestTag, 'Received error:', err);
        return Promise.reject(err);
      }
    });
  }

  requestStream(
    methodName: FirestoreStreamingMethod,
    request: {},
    requestTag: string
  ): Promise<Duplex> {
    const callOptions = this.createCallOptions(methodName);

    const bidirectional = methodName === 'listen';

    return this._retry(methodName, requestTag, () => {
      const result = new Deferred<Duplex>();

      this.clientPool.run(requestTag, async gapicClient => {
        logger(
          'Firestore.requestStream',
          requestTag,
          'Sending request: %j',
          request
        );
        try {
          const stream = bidirectional
            ? gapicClient[methodName](callOptions)
            : gapicClient[methodName](request, callOptions);
          const logStream = new Transform({
            objectMode: true,
            transform: (chunk, encoding, callback) => {
              logger(
                'Firestore.requestStream',
                requestTag,
                'Received response: %j',
                chunk
              );
              callback();
            },
          });
          stream.pipe(logStream);

          const lifetime = new Deferred<void>();
          const resultStream = await this._initializeStream(
            stream,
            lifetime,
            requestTag,
            bidirectional ? request : undefined
          );
          resultStream.on('end', () => stream.end());
          result.resolve(resultStream);

          // While we return the stream to the callee early, we don't want to
          // release the GAPIC client until the callee has finished processing the
          // stream.
          return lifetime.promise;
        } catch (e) {
          result.reject(e);
        }
      });

      return result.promise;
    });
  }
}
