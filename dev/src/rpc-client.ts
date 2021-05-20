import {FirestoreStreamingMethod, FirestoreUnaryMethod} from './types';
import {Duplex} from 'stream';

export interface RpcClient {
  /**
   * Returns the Project ID for this Firestore instance.
   * @private
   */
  readonly projectId: string;

  initialize(requestTag: string): Promise<void>;

  /**
   * Terminates the Firestore client and closes all open streams.
   *
   * @return A Promise that resolves when the client is terminated.
   */
  terminate(): Promise<void>;

  /**
   * A funnel for all non-streaming API requests, assigning a project ID where
   * necessary within the request options.
   *
   * @private
   * @param methodName Name of the Veneer API endpoint that takes a request
   * and GAX options.
   * @param request The Protobuf request to send.
   * @param requestTag A unique client-assigned identifier for this request.
   * @param retryCodes If provided, a custom list of retry codes. If not
   * provided, retry is based on the behavior as defined in the ServiceConfig.
   * @returns A Promise with the request result.
   */
  request<Req, Resp>(
    methodName: FirestoreUnaryMethod,
    request: Req,
    requestTag: string,
    retryCodes?: number[]
  ): Promise<Resp>;

  /**
   * A funnel for streaming API requests, assigning a project ID where necessary
   * within the request options.
   *
   * The stream is returned in paused state and needs to be resumed once all
   * listeners are attached.
   *
   * @private
   * @param methodName Name of the streaming Veneer API endpoint that
   * takes a request and GAX options.
   * @param request The Protobuf request to send.
   * @param requestTag A unique client-assigned identifier for this request.
   * @returns A Promise with the resulting read-only stream.
   */
  requestStream(
    methodName: FirestoreStreamingMethod,
    request: {},
    requestTag: string
  ): Promise<Duplex>;
}
