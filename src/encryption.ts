import { Compression, IUploadOptions } from "./types";
import crypto from 'crypto';
import { promisify } from "util";

// export type EncryptionMode = 'ctr' | 'cbc' | 'gcm';
export type KeySize = 128 | 196 | 256;
export type TagSize = 96 | 104 | 112 | 120 | 128;

const pbkdf2 = promisify(crypto.pbkdf2);

/**
 * The encryption-specific options used for an upload
 */
export interface IEncryptionOptions {
    /**
     * The encryption algorithm. At this time, only aes is supported.
     */
    algorithm: 'aes';
    /**
     * The encryption mode to use. At this time, only gcm is supported so only change this if you know what you're doing!
     */
    encryptionMode: 'ctr' | 'cbc' | 'gcm';
    /**
     * Key size. 256 is recommended.
     */
    keySize: number;
    /**
     * Tag size. 128 is recommended.
     */
    tagSize: number;
    /**
     * Number of iterations. 100000 is recommended.
     */
    iterations: number;
    /**
     * The compression mode to use.
     */
    compression?: Compression;
    /**
     * The password/key to use for the upload. Will be randomly generated if not set.
     */
    key?: Buffer;
}

type EncryptionParams = { iv: Buffer; salt: Buffer; key: Buffer; }

/**
 * A fluent builder to help configure encryption options.
 */
export class EncryptionBuilder {
    private _options: IEncryptionOptions;
    /**
     *
     */
    constructor() {
        this._options = {} as IEncryptionOptions;
    }

    setKeySize(keySize: KeySize): EncryptionBuilder {
        this._options.keySize = keySize;
        return this;
    }

    setTagSize(tagSize: TagSize): EncryptionBuilder {
        this._options.tagSize = tagSize;
        return this;
    }

    setIterations(iterations: number): EncryptionBuilder {
        this._options.iterations = iterations;
        return this;
    }

    enableCompression(enable: boolean = true): EncryptionBuilder {
        this._options.compression = enable ? 'zlib' : 'none';
        return this;
    }

    useKey(keyString: string): EncryptionBuilder;
    useKey(keyBytes: Buffer): EncryptionBuilder;
    useKey(key: Buffer|string): EncryptionBuilder {
        if (typeof(key) === 'string') {
            this._options.key = Buffer.from(key, 'utf8');
        } else {
            this._options.key = key;
        }
        return this;
    }

    /* usePassword = (password: string): EncryptionBuilder => {
        this._options.password = () => password;
        return this;
    } */

    private getDefaults = (): IEncryptionOptions => {
        return {
            algorithm: 'aes',
            encryptionMode: 'gcm',
            keySize: 256,
            tagSize: 128,
            iterations: 100000,
            compression: 'none',
            key: crypto.randomBytes(32)
        };
    }

    buildOptions = (): IEncryptionOptions => {
        var defaults = this.getDefaults();
        return {...defaults, ...this._options};
    }
}

export async function encryptMessageBuffer(messageBytes: Buffer, encryptionOptions: IEncryptionOptions, uploadOptions: IUploadOptions): Promise<{data: any[], cipherText: Buffer}> {
    let iv = crypto.randomBytes(16);
    let salt = crypto.randomBytes(8);
    // this should use a key on IEncryptionOptions
    // let password = crypto.randomBytes(32);
    var cryptedPassword = await generateKey(encryptionOptions.key, salt, encryptionOptions);
    var crypt: EncryptionParams = {iv, salt, key: cryptedPassword};
    var algorithm = `aes-${encryptionOptions.keySize}-${encryptionOptions.encryptionMode}` as crypto.CipherGCMTypes // even though it might not actually be GCM
    var cipher = crypto.createCipheriv(algorithm, cryptedPassword, iv, {authTagLength: 16});
    // var cipher = crypto.createCipheriv(algorithm, cryptedPassword, iv);
    var data = getData(crypt, encryptionOptions, uploadOptions);
    cipher.setAAD(Buffer.from(JSON.stringify(data), 'utf8'));
    var cipherText = Buffer.concat([cipher.update(messageBytes), cipher.final(), cipher.getAuthTag()]);
    return {cipherText, data};
}

async function generateKey(password: Buffer, salt: Buffer, options: IEncryptionOptions): Promise<Buffer> {
    var cryptResult = await pbkdf2(password ?? crypto.randomBytes(32), salt, options.iterations, password.length, 'sha256');
    // var cryptResult = crypto.pbkdf2Sync(password, salt, options.iterations, options.keySize / 8, 'sha256');
    return cryptResult;
}

function getData(params: EncryptionParams, opts: IEncryptionOptions, request: IUploadOptions): (string | number | (string | number)[])[] {
    const adata = [];
    adata.push([params.iv.toString('base64'), params.salt.toString('base64'), opts.iterations, opts.keySize, opts.tagSize, 'aes', opts.encryptionMode, opts.compression]);
    adata.push(request.uploadFormat);
    adata.push(request.openDiscussion ? 1 : 0);
    adata.push(request.burnAfterReading ? 1 : 0);
    return adata;
}