import {
    CallSettings,
    ClientConfig,
    constructSettings,
    createDefaultBackoffSettings,
    GoogleError,
    Status
} from "google-gax";
import {BackoffSettings} from "google-gax/build/src/gax";
import * as gapicConfig from "./v1/firestore_client_config.json";

/**
 * Returns the list of retryable error codes specified in the service
 * configuration.
 * @private
 */
export function getRetryCodes(methodName: string): number[] {
    return serviceConfig[methodName]?.retry?.retryCodes ?? [];
}

/**
 * Determines whether the provided error is considered permanent for the given
 * RPC.
 *
 * @private
 */
export function isPermanentRpcError(
    err: GoogleError,
    methodName: string
): boolean {
    if (err.code !== undefined) {
        const retryCodes = getRetryCodes(methodName);
        return retryCodes.indexOf(err.code) === -1;
    } else {
        return false;
    }
}

export const serviceConfig = constructSettings(
    'google.firestore.v1.Firestore',
    gapicConfig as ClientConfig,
    {},
    Status
) as { [k: string]: CallSettings };

/**
 * Returns the backoff setting from the service configuration.
 * @private
 */
export function getRetryParams(methodName: string): BackoffSettings {
    return (
        serviceConfig[methodName]?.retry?.backoffSettings ??
        createDefaultBackoffSettings()
    );
}
