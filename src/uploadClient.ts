import { Expiry, Compression, IUploadResponse, IUploadOptions, IUploadResult } from "./types";
import { IEncryptionOptions, EncryptionBuilder, encryptMessageBuffer } from "./encryption";
import pako from "pako";
import axios, { AxiosRequestConfig } from "axios";
import { encode } from "bs58";

/**
 * A simple client class to encapsulate uploading pastes to a PrivateBin server
 */
export class PrivateBinClient {
    private getDefaultOptions(): IUploadOptions {
        return {
            expiry: '1week',
            openDiscussion: false,
            burnAfterReading: false,
            uploadFormat: 'markdown'
        };
    }

    private getMessageBytes = (data: string, compression: Compression): Buffer => {
        const buffer = Buffer.from(JSON.stringify({ paste: data }), 'utf8');
        if (compression === 'zlib') {
            return Buffer.from(pako.deflateRaw(new Uint8Array(buffer)));
        } else {
            return buffer;
        }
    }

    private _baseUrl: string;
    /**
     *  Creates a new PrivateBin client for the given server URL
     * 
     * @param baseUrl: The base URL of the server. This should be the root address like `https://privatebin.net`
     */
    constructor(baseUrl: string) {
        baseUrl = baseUrl.startsWith('https://') ? baseUrl : `https://${baseUrl}`;
        this._baseUrl = baseUrl.replace(/\/+$/, ""); // remove any trailing slashes
    }

    /**
     * Uploads given content as a paste to the PrivateBin server.
     * 
     * @param content The paste contents to upload
     * @param options The upload options to use
     * @param encryptOpts Additional encryption options for your paste
     */
    uploadContent = async (content: string, options: IUploadOptions, encryptOpts?: IEncryptionOptions): Promise<IUploadResult> => {
        var opts: IUploadOptions = {...this.getDefaultOptions(), ...options};
        var encryptionOpts = encryptOpts ?? new EncryptionBuilder().enableCompression(true).buildOptions();
        var messageBuffer = this.getMessageBytes(content, encryptionOpts.compression);
        var encryptedData = await encryptMessageBuffer(messageBuffer, encryptionOpts, opts);
        var resp = await this.postPasteContent(encryptedData.data, encryptedData.cipherText, opts);
        if (resp.status == 201 || resp.status == 200) {
            return {
                response: resp.data,
                success: resp.data.status == 0,
                urlKey: encode(encryptionOpts.key),
                url: `${this._baseUrl}${resp.data.url}`
            }
        }
        throw new Error("Upload failed!");
    }

    private postPasteContent = async (requestData: any[], cipherText: Buffer, options: IUploadOptions) => {
        var requestBody = {
            v: 2,
            ct: cipherText.toString('base64'),
            adata: requestData,
            meta: {
                expire: options.expiry
            }
        };
        var resp = await axios.post<IUploadResponse>("/", requestBody, this.getRequestConfig())
        return resp;
    }

    private getRequestConfig = (): AxiosRequestConfig => {
        return {
            baseURL: this._baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'JSONHttpRequest' // required by privatebin. yikes that casing.
            }
        }
    }

    
}