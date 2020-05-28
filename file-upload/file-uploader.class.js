import { EventEmitter } from '@angular/core';
import { FileLikeObject } from './file-like-object.class';
import { FileItem } from './file-item.class';
import { FileType } from './file-type.class';
function isFile(value) {
    return (File && value instanceof File);
}
export class FileUploader {
    constructor(options) {
        this.isUploading = false;
        this.queue = [];
        this.progress = 0;
        this._nextIndex = 0;
        this.chunkSize = null;
        this.currentChunkParam = "current_chunk";
        this.totalChunkParam = "total_chunks";
        this.chunkMethod = "PUT";
        this.options = {
            autoUpload: false,
            isHTML5: true,
            filters: [],
            chunkSize: null,
            currentChunkParam: "current_chunk",
            totalChunkParam: "total_chunks",
            chunkMethod: "PUT",
            removeAfterUpload: false,
            disableMultipart: false,
            formatDataFunction: (item) => item._file,
            formatDataFunctionIsAsync: false
        };
        this.setOptions(options);
        this.response = new EventEmitter();
    }
    setOptions(options) {
        this.options = Object.assign(this.options, options);
        this.authToken = this.options.authToken;
        this.authTokenHeader = this.options.authTokenHeader || 'Authorization';
        this.autoUpload = this.options.autoUpload;
        this.chunkSize = this.options.chunkSize;
        this.currentChunkParam = this.options.currentChunkParam;
        this.totalChunkParam = this.options.totalChunkParam;
        this.chunkMethod = this.options.chunkMethod;
        this.options.filters.unshift({ name: 'queueLimit', fn: this._queueLimitFilter });
        if (this.options.maxFileSize) {
            this.options.filters.unshift({ name: 'fileSize', fn: this._fileSizeFilter });
        }
        if (this.options.allowedFileType) {
            this.options.filters.unshift({ name: 'fileType', fn: this._fileTypeFilter });
        }
        if (this.options.allowedMimeType) {
            this.options.filters.unshift({ name: 'mimeType', fn: this._mimeTypeFilter });
        }
        for (let i = 0; i < this.queue.length; i++) {
            this.queue[i].url = this.options.url;
        }
    }
    addToQueue(files, options, filters) {
        let list = [];
        for (let file of files) {
            list.push(file);
        }
        let arrayOfFilters = this._getFilters(filters);
        let count = this.queue.length;
        let addedFileItems = [];
        list.map((some) => {
            if (!options) {
                options = this.options;
            }
            let temp = new FileLikeObject(some);
            if (this._isValidFile(temp, arrayOfFilters, options)) {
                let fileItem = new FileItem(this, some, options);
                addedFileItems.push(fileItem);
                this.queue.push(fileItem);
                this._onAfterAddingFile(fileItem);
            }
            else {
                let filter = arrayOfFilters[this._failFilterIndex];
                this._onWhenAddingFileFailed(temp, filter, options);
            }
        });
        if (this.queue.length !== count) {
            this._onAfterAddingAll(addedFileItems);
            this.progress = this._getTotalProgress();
        }
        this._render();
        if (this.options.autoUpload) {
            this.uploadAll();
        }
    }
    removeFromQueue(value) {
        let index = this.getIndexOfItem(value);
        let item = this.queue[index];
        if (item.isUploading) {
            item.cancel();
        }
        this.queue.splice(index, 1);
        this.progress = this._getTotalProgress();
    }
    clearQueue() {
        while (this.queue.length) {
            this.queue[0].remove();
        }
        this.progress = 0;
    }
    uploadItem(value) {
        let index = this.getIndexOfItem(value);
        let item = this.queue[index];
        let transport = this.options.isHTML5 ? '_xhrTransport' : '_iframeTransport';
        item._prepareToUploading();
        if (this.isUploading) {
            return;
        }
        this.isUploading = true;
        this[transport](item);
    }
    cancelItem(value) {
        let index = this.getIndexOfItem(value);
        let item = this.queue[index];
        let prop = this.options.isHTML5 ? item._xhr : item._form;
        if (item && item.isUploading) {
            prop.abort();
        }
    }
    uploadAll() {
        let items = this.getNotUploadedItems().filter((item) => !item.isUploading);
        if (!items.length) {
            return;
        }
        items.map((item) => item._prepareToUploading());
        items[0].upload();
    }
    cancelAll() {
        let items = this.getNotUploadedItems();
        items.map((item) => item.cancel());
    }
    isFile(value) {
        return isFile(value);
    }
    isFileLikeObject(value) {
        return value instanceof FileLikeObject;
    }
    getIndexOfItem(value) {
        return typeof value === 'number' ? value : this.queue.indexOf(value);
    }
    getNotUploadedItems() {
        return this.queue.filter((item) => !item.isUploaded);
    }
    getReadyItems() {
        return this.queue
            .filter((item) => (item.isReady && !item.isUploading))
            .sort((item1, item2) => item1.index - item2.index);
    }
    destroy() {
        return void 0;
    }
    onAfterAddingAll(fileItems) {
        return { fileItems };
    }
    onBuildItemForm(fileItem, form) {
        return { fileItem, form };
    }
    onAfterAddingFile(fileItem) {
        return { fileItem };
    }
    onWhenAddingFileFailed(item, filter, options) {
        return { item, filter, options };
    }
    onBeforeUploadItem(fileItem) {
        return { fileItem };
    }
    onProgressItem(fileItem, progress) {
        return { fileItem, progress };
    }
    onProgressAll(progress) {
        return { progress };
    }
    onSuccessItem(item, response, status, headers) {
        return { item, response, status, headers };
    }
    onErrorItem(item, response, status, headers) {
        return { item, response, status, headers };
    }
    onCancelItem(item, response, status, headers) {
        return { item, response, status, headers };
    }
    onCompleteChunk(item, response, status, headers) {
        return { item, response, status, headers };
    }
    onCompleteItem(item, response, status, headers) {
        return { item, response, status, headers };
    }
    onCompleteAll() {
        return void 0;
    }
    _mimeTypeFilter(item) {
        return !(this.options.allowedMimeType && this.options.allowedMimeType.indexOf(item.type) === -1);
    }
    _fileSizeFilter(item) {
        return !(this.options.maxFileSize && item.size > this.options.maxFileSize);
    }
    _fileTypeFilter(item) {
        return !(this.options.allowedFileType &&
            this.options.allowedFileType.indexOf(FileType.getMimeClass(item)) === -1);
    }
    _onErrorItem(item, response, status, headers) {
        item._onError(response, status, headers);
        this.onErrorItem(item, response, status, headers);
    }
    _onCompleteChunk(item, response, status, headers) {
        this.onCompleteChunk(item, response, status, headers);
        item._onCompleteChunk(response, status, headers);
        this.progress = this._getTotalProgress();
        this._render();
    }
    _onCompleteItem(item, response, status, headers) {
        item._onComplete(response, status, headers);
        this.onCompleteItem(item, response, status, headers);
        let nextItem = this.getReadyItems()[0];
        this.isUploading = false;
        if (nextItem) {
            nextItem.upload();
            return;
        }
        this.onCompleteAll();
        this.progress = this._getTotalProgress();
        this._render();
    }
    _headersGetter(parsedHeaders) {
        return (name) => {
            if (name) {
                return parsedHeaders[name.toLowerCase()] || void 0;
            }
            return parsedHeaders;
        };
    }
    _xhrAppendEvents(xhr, item) {
        let that = this;
        xhr.upload.onprogress = (event) => {
            let progress = Math.round(event.lengthComputable ? event.loaded * 100 / event.total : 0);
            if (that.options.chunkSize > 0) {
                progress = Math.round(((item._currentChunk - 1) * 100) / item._totalChunks) + Math.round(progress / item._totalChunks);
            }
            this._onProgressItem(item, progress);
        };
        xhr.onload = () => {
            let headers = this._parseHeaders(xhr.getAllResponseHeaders());
            let response = this._transformResponse(xhr.response, headers);
            let gist = this._isSuccessCode(xhr.status) ? 'Success' : 'Error';
            let method = '_on' + gist + 'Item';
            if (this.options.chunkSize > 0) {
                item._chunkUploaders.pop();
                if (item._currentChunk >= item._totalChunks) {
                    this[method](item, response, xhr.status, headers);
                    this._onCompleteItem(item, response, xhr.status, headers);
                }
                else {
                    this._onCompleteChunk(item, response, xhr.status, headers);
                }
            }
            else {
                this[method](item, response, xhr.status, headers);
                this._onCompleteItem(item, response, xhr.status, headers);
            }
        };
        xhr.onerror = () => {
            let headers = this._parseHeaders(xhr.getAllResponseHeaders());
            let response = this._transformResponse(xhr.response, headers);
            this._onErrorItem(item, response, xhr.status, headers);
            this._onCompleteItem(item, response, xhr.status, headers);
        };
        xhr.onabort = () => {
            let headers = this._parseHeaders(xhr.getAllResponseHeaders());
            let response = this._transformResponse(xhr.response, headers);
            this._onCancelItem(item, response, xhr.status, headers);
            this._onCompleteItem(item, response, xhr.status, headers);
        };
        xhr.open(item.method, item.url, true);
        xhr.withCredentials = item.withCredentials;
        if (this.options.headers) {
            for (let header of this.options.headers) {
                xhr.setRequestHeader(header.name, header.value);
            }
        }
        if (item.headers.length) {
            for (let header of item.headers) {
                xhr.setRequestHeader(header.name, header.value);
            }
        }
        if (this.authToken) {
            xhr.setRequestHeader(this.authTokenHeader, this.authToken);
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                that.response.emit(xhr.responseText);
            }
        };
        return xhr;
    }
    _buildMultiPartSendable(item, start = null, end = null) {
        let sendable;
        sendable = new FormData();
        this._onBuildItemForm(item, sendable);
        let file = null;
        if (this.options.chunkSize > 0) {
            if (start === 0) {
                file = item.fileChunks.getCurrentRawFileChunk();
            } else {
                file = item.getNextChunk();
            }
        }
        else {
            file = item._file;
        }
        const appendFile = () => sendable.append(item.alias, file, item.file.name);
        if (!this.options.parametersBeforeFiles) {
            appendFile();
        }
        // For AWS, Additional Parameters must come BEFORE Files
        if (this.options.additionalParameter !== undefined) {
            Object.keys(this.options.additionalParameter).forEach((key) => {
                let paramVal = this.options.additionalParameter[key];
                // Allow an additional parameter to include the filename
                if (typeof paramVal === 'string' && paramVal.indexOf('{{file_name}}') >= 0) {
                    paramVal = paramVal.replace('{{file_name}}', item.file.name);
                }
                sendable.append(key, paramVal);
            });
        }
        if (this.options.chunkSize > 0 && this.options.totalChunkParam) {
            sendable.append(this.options.totalChunkParam, item._totalChunks.toString());
        }
        if (this.options.chunkSize > 0 && this.options.currentChunkParam) {
            sendable.append(this.options.currentChunkParam, item._currentChunk.toString());
        }
        if (this.options.parametersBeforeFiles) {
            appendFile();
        }
        return sendable;
    }
    _xhrTransport(item) {
        let that = this;
        let xhr = item._xhr = new XMLHttpRequest();
        let sendable;
        this._onBeforeUploadItem(item);
        if (typeof item._file.size !== 'number') {
            throw new TypeError('The file specified is no longer valid');
        }
        if (!this.options.disableMultipart) {
            /* CHUNCKED FILE UPLOAD */
            if (this.options.chunkSize > 0) {
                let chunkSize = this.options.chunkSize;
                let chunkMethod = this.options.chunkMethod;
                let NUM_CHUNKS = Math.max(Math.ceil(item._file.size / chunkSize), 1);
                let CUR_CHUNK = 0;
                let start = 0;
                let end = chunkSize;
                item._chunkUploaders = [];
                item._currentChunk = 0;
                item._totalChunks = NUM_CHUNKS;
                item._onCompleteChunkCallnext = function () {
                    item._currentChunk++;
                    if (item._currentChunk > 1) {
                        item.method = chunkMethod;
                    }
                    let sendable = this.uploader._buildMultiPartSendable(item, start, end);
                    let xhr = new XMLHttpRequest();
                    xhr = this.uploader._xhrAppendEvents(xhr, item);
                    item._chunkUploaders.push(xhr);
                    xhr.send(sendable);
                    start = end;
                    end = start + chunkSize;
                };
                item.createFileChunk(this.options.chunkSize);

                item.setIsUploading(true);
                item._onCompleteChunkCallnext();
                this._render();
                return;
            }
            else {
                sendable = this._buildMultiPartSendable(item);
            }
        }
        else {
            sendable = this.options.formatDataFunction(item);
        }
        // Append Evenets
        xhr = this._xhrAppendEvents(xhr, item);
        if (this.options.formatDataFunctionIsAsync) {
            sendable.then((result) => xhr.send(JSON.stringify(result)));
        }
        else {
            xhr.send(sendable);
        }
        this._render();
    }
    _getTotalProgress(value = 0) {
        if (this.options.removeAfterUpload) {
            return value;
        }
        let notUploaded = this.getNotUploadedItems().length;
        let uploaded = notUploaded ? this.queue.length - notUploaded : this.queue.length;
        let ratio = 100 / this.queue.length;
        let current = value * ratio / 100;
        return Math.round(uploaded * ratio + current);
    }
    _getFilters(filters) {
        if (!filters) {
            return this.options.filters;
        }
        if (Array.isArray(filters)) {
            return filters;
        }
        if (typeof filters === 'string') {
            let names = filters.match(/[^\s,]+/g);
            return this.options.filters
                .filter((filter) => names.indexOf(filter.name) !== -1);
        }
        return this.options.filters;
    }
    _render() {
        return void 0;
    }
    _queueLimitFilter() {
        return this.options.queueLimit === undefined || this.queue.length < this.options.queueLimit;
    }
    _isValidFile(file, filters, options) {
        this._failFilterIndex = -1;
        return !filters.length ? true : filters.every((filter) => {
            this._failFilterIndex++;
            return filter.fn.call(this, file, options);
        });
    }
    _isSuccessCode(status) {
        return (status >= 200 && status < 300) || status === 304;
    }
    _transformResponse(response, headers) {
        return response;
    }
    _parseHeaders(headers) {
        let parsed = {};
        let key;
        let val;
        let i;
        if (!headers) {
            return parsed;
        }
        headers.split('\n').map((line) => {
            i = line.indexOf(':');
            key = line.slice(0, i).trim().toLowerCase();
            val = line.slice(i + 1).trim();
            if (key) {
                parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
            }
        });
        return parsed;
    }
    _onWhenAddingFileFailed(item, filter, options) {
        this.onWhenAddingFileFailed(item, filter, options);
    }
    _onAfterAddingFile(item) {
        this.onAfterAddingFile(item);
    }
    _onAfterAddingAll(items) {
        this.onAfterAddingAll(items);
    }
    _onBeforeUploadItem(item) {
        item._onBeforeUpload();
        this.onBeforeUploadItem(item);
    }
    _onBuildItemForm(item, form) {
        item._onBuildForm(form);
        this.onBuildItemForm(item, form);
    }
    _onProgressItem(item, progress) {
        let total = this._getTotalProgress(progress);
        this.progress = total;
        item._onProgress(progress);
        this.onProgressItem(item, progress);
        this.onProgressAll(total);
        this._render();
    }
    _onSuccessItem(item, response, status, headers) {
        item._onSuccess(response, status, headers);
        this.onSuccessItem(item, response, status, headers);
    }
    _onCancelItem(item, response, status, headers) {
        item._onCancel(response, status, headers);
        this.onCancelItem(item, response, status, headers);
    }
}
//# sourceMappingURL=file-uploader.class.js.map