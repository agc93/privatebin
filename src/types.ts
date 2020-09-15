export type Compression = 'zlib' | 'none';
export type Format = 'plaintext' | 'syntaxhighlighting' | 'markdown';
// borrowed from the 'types' JSON-LD spec. We should probably validate this better.
export type Expiry = '5min' | '10min' | '1hour' | '1day' | '1week' | '1month' | '1year' | 'never';

/**
 * Optional parameters for the uploaded paste
 */
export interface IUploadOptions {
    /**
     * Expiration time after creation.
     */
    expiry?: Expiry,
    /**
     * Enables "burn after reading" for this paste. Defaults to false.
     */
    burnAfterReading?: boolean;
    /**
     * Enables discussion feature for this paste. Defaults to false.
     */
    openDiscussion?: boolean;
    /**
     * Format for the uploaded paste. Supports plaintext, markdown, and prettify-based syntax highlighting.
     */
    uploadFormat: Format;
}

/**
 * The raw response from the PrivateBin API.
 */
export interface IUploadResponse {
    id: string;
    url: string;
    deleteToken: string;
    status: number;
}

/**
 * The result of an upload to a PrivateBin server.
 */
export interface IUploadResult {
    /**
     * Whether the paste was successfully uploaded.
     */
    success: boolean;
    /**
     * The complete URL of the uploaded paste, without the key.
     */
    url: string;
    /**
     * The encoded key for this paste.
     */
    urlKey: string;
    /**
     * The unmodified API response from the PrivateBin server.
     */
    response: IUploadResponse;
}