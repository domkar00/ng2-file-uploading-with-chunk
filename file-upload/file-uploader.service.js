import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest, HttpEventType } from '@angular/common/http';
import { Observable, of } from 'rxjs';
export class FileUploaderService {
    constructor(http) {
        this.http = http;
        this.defaultLinks = {
            downloadEntry: '',
            updateEntry: '',
            createEntry: '',
            deleteEntry: ''
        };
        this.defaultOptions = {
            createMethod: 'POST',
            updateMethod: 'POST',
            authorizationHeaderName: 'Authorization',
            tokenPattern: null,
            token: null,
            chunkSize: 0,
            totalChunkParamName: 'total_chunks',
            currentChunkParamName: 'current_chunk',
            fileParamName: 'file',
            idAttribute: 'id'
        };
        this.additionalHeaders = {};
        this.cancelError = 'UPLOAD CANCELED';
        this.uploadSubscription = null;
        this._uploader = null;
        this.links = Object.assign({}, this.defaultLinks, this.links);
        this.options = Object.assign({}, this.defaultOptions, this.options);
    }
    get uploader() {
        return this._uploader;
    }
    set uploader(theUploader) {
        this._uploader = theUploader;
    }
    onBeforeUpload(item, options) {
        const promise = new Promise((resolve, reject) => {
            resolve(true);
        });
        return promise;
    }
    uploadFile(item, options) {
        this.onBeforeUpload(item, options).then(() => {
            this._uploadFile(item, options);
        });
    }
    onBeforeGetDefaultHeaders() {
        const promise = new Promise((resolve, reject) => {
            resolve(true);
        });
        return promise;
    }
    _getDefaultHeaders() {
        return new Promise((resolve, reject) => {
            this.onBeforeGetDefaultHeaders().then(result => {
                const h = {};
                if (this.options.tokenPattern && this.options.token) {
                    h[this.options.authorizationHeaderName] = this.options.tokenPattern.replace('#token#', this.options.token);
                }
                for (const key in this.additionalHeaders) {
                    if (this.additionalHeaders.hasOwnProperty(key)) {
                        h[key] = this.additionalHeaders[key];
                    }
                }
                resolve(h);
            }, error => {
                reject(error);
            });
        });
    }
    _getRequestHeaders(item, options) {
        return new Promise((resolve, reject) => {
            this._getDefaultHeaders().then(h => {
                if (options.headers) {
                    for (let header of options.headers) {
                        h[header.name] = header.value;
                    }
                }
                if (item.headers.length) {
                    for (let header of item.headers) {
                        h[header.name] = header.value;
                    }
                }
                resolve(h);
            }, error => {
                reject(error);
            });
        });
    }
    buildPackageToSend(item, options) {
        let sendable = new FormData();
        this.uploader._onBuildItemForm(item, sendable);
        let file = null;
        if (this.options.chunkSize > 0) {
            file = item.getCurrentChunkFile();
        }
        else {
            file = item._file;
        }
        const appendFile = () => sendable.append(this.options.fileParamName, file, item.file.name);
        if (!options.parametersBeforeFiles) {
            appendFile();
        }
        // For AWS, Additional Parameters must come BEFORE Files
        if (options.additionalParameter !== undefined) {
            Object.keys(options.additionalParameter).forEach((key) => {
                let paramVal = options.additionalParameter[key];
                // Allow an additional parameter to include the filename
                if (typeof paramVal === 'string' &&
                    paramVal.indexOf('{{file_name}}') >= 0) {
                    paramVal = paramVal.replace('{{file_name}}', item.file.name);
                }
                sendable.append(key, paramVal);
            });
        }
        if (this.options.chunkSize > 0 && this.options.totalChunkParamName) {
            sendable.append(this.options.totalChunkParamName, item.getTotalChunks().toString());
        }
        if (this.options.chunkSize > 0 && this.options.currentChunkParamName) {
            sendable.append(this.options.currentChunkParamName, (item.getCurrentChunk() + 1).toString());
        }
        if (options.parametersBeforeFiles) {
            appendFile();
        }
        return sendable;
    }
    _uploadFile(item, options) {
        this._getRequestHeaders(item, options).then(headers => {
            let request_method = this.options.createMethod;
            let link = this.links.createEntry;
            item.setIsUploading(true);
            if (this.options.chunkSize > 0) {
                try {
                    item.getCurrentChunk();
                }
                catch (err) {
                    item.createFileChunk(this.options.chunkSize);
                }
                request_method =
                    item.getCurrentChunk() > 0
                        ? this.options.updateMethod
                        : this.options.createMethod;
                link =
                    item.getCurrentChunk() > 0
                        ? this.links.updateEntry
                        : this.links.createEntry;
            }
            if (item.getId()) {
                link = link.replace('#id#', item.getId());
            }
            const data = this.buildPackageToSend(item, options);
            const request = new HttpRequest(request_method, link, data, {
                headers: new HttpHeaders(headers),
                reportProgress: true,
                withCredentials: item.withCredentials,
            });
            this.uploadSubscription = this.http.request(request).subscribe((event) => {
                this.getEventMessage(event, item);
            }, (error) => {
                if (this.cancelError === error) {
                    this.uploader.onAbort(error, item);
                }
                else {
                    this.uploader.onError(error, item);
                }
            });
        }, error => { });
    }
    stopUpload() {
        if (this.uploadSubscription && this.uploadSubscription.unsubscribe) {
            this.uploadSubscription.error(this.cancelError);
        }
    }
    getEventMessage(event, item) {
        switch (event.type) {
            case HttpEventType.ResponseHeader:
                break;
            case HttpEventType.Sent:
                this.uploader.onStart(event, item);
                break;
            case HttpEventType.UploadProgress:
                this.uploader.onProgress(event, item);
                break;
            case HttpEventType.Response:
                if (this.options.chunkSize > 0) {
                    if (item.getCurrentChunk() === 0) {
                        const response = event.body;
                        if (response[this.options.idAttribute]) {
                            item.setId(response[this.options.idAttribute]);
                        }
                    }
                }
                this.uploader.onLoad(event, item);
                break;
            default:
                break;
        }
    }
    handleError(item) {
        const userMessage = `${item.file.name} upload failed.`;
        return (error) => {
            this.uploader.onError(error, item);
            const message = error.error instanceof Error
                ? error.error.message
                : `server returned code ${error.status} with body "${error.error}"`;
            return of(userMessage);
        };
    }
    deleteEntry(item, options = {}, skipConfirmation = false) {
        if (item.getId() && this.links['deleteEntry']) {
            let link = this.links['deleteEntry'].replace(/#id#/g, item.getId());
            let confirmation = false;
            if (skipConfirmation) {
                confirmation = true;
            }
            else {
                confirmation = confirm('Are you sure you want to delete this entry?');
            }
            if (confirmation) {
                return this.delete(link, options);
            }
            else {
                return of(false);
            }
        }
        else {
            return of(false);
        }
    }
    delete(url, options = {}) {
        return new Observable((observe) => {
            this._getDefaultHeaders().then(function (headers) {
                return this.http
                    .delete(url, { headers: new HttpHeaders(headers) })
                    .subscribe((response) => {
                    observe.next(response);
                }, (error) => {
                    observe.error(error);
                });
            }.bind(this), error => {
                observe.error(error);
            });
        });
    }
    /*
        HTTP General methos only bellow
    */
    get(url) {
        return new Observable(observe => {
            this._getDefaultHeaders().then(function (headers) {
                return this.http
                    .get(url, { headers: new HttpHeaders(headers) })
                    .subscribe((response) => {
                    observe.next(response);
                }, (error) => {
                    observe.error(error);
                });
            }.bind(this), error => {
                observe.error(error);
            });
        });
    }
    addHeader(name = null, value = null) {
        this.additionalHeaders[name] = value;
    }
    removeHeader(name = null) {
        if (this.additionalHeaders.hasOwnProperty(name)) {
            delete this.additionalHeaders[name];
        }
    }
}
FileUploaderService.decorators = [
    { type: Injectable },
];
/** @nocollapse */
FileUploaderService.ctorParameters = () => [
    { type: HttpClient, },
];
//# sourceMappingURL=file-uploader.service.js.map