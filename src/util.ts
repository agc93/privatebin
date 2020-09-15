import { IUploadResult } from "./types";

/**
 * Convenience method to get a shareable link from an upload result.
 * 
 * @param result The upload result object from `PrivateBinClient`
 */
export function getPasteUrl(result: IUploadResult) {
    return `${result.url}#${result.urlKey}`
}