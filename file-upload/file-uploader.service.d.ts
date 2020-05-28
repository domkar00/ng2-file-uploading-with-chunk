import { FileUploaderOptions, FileUploader } from './file-uploader.class';
import { FileItem } from './file-item.class';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface UploaderLinksOptions {
    downloadEntry: string;
    updateEntry: string;
    createEntry: string;
    deleteEntry: string;
}
export interface UploaderServiceOptions {
    createMethod: string;
    updateMethod: string;
    authorizationHeaderName?: string;
    tokenPattern?: string;
    token?: string;
    chunkSize?: number;
    totalChunkParamName?: string;
    currentChunkParamName?: string;
    fileParamName?: string;
    idAttribute?: string;
}
export declare class FileUploaderService {
    protected http: HttpClient;
    defaultLinks: UploaderLinksOptions;
    defaultOptions: UploaderServiceOptions;
    additionalHeaders: any;
    protected cancelError: string;
    protected uploadSubscription: any;
    links: UploaderLinksOptions;
    options: UploaderServiceOptions;
    private _uploader;
    constructor(http: HttpClient);
    uploader: FileUploader;
    onBeforeUpload(item: FileItem, options: FileUploaderOptions): Promise<any>;
    uploadFile(item: FileItem, options: FileUploaderOptions): void;
    onBeforeGetDefaultHeaders(): Promise<any>;
    protected _getDefaultHeaders(): Promise<any>;
    protected _getRequestHeaders(item: FileItem, options: FileUploaderOptions): Promise<any>;
    buildPackageToSend(item: FileItem, options: FileUploaderOptions): FormData;
    protected _uploadFile(item: FileItem, options: FileUploaderOptions): void;
    stopUpload(): void;
    private getEventMessage(event, item);
    private handleError(item);
    deleteEntry(item: FileItem, options?: {}, skipConfirmation?: boolean): Observable<any>;
    protected delete(url: string, options?: {}): Observable<any>;
    protected get(url: string): Observable<any>;
    addHeader(name?: string, value?: any): void;
    removeHeader(name?: string): void;
}
