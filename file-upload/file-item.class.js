import { FileLikeObject } from './file-like-object.class';
import { FileChunk } from './file-chunk.class';
export class FileItem {
    constructor(uploader, some, options) {
        this.url = '/';
        this.headers = [];
        this.withCredentials = true;
        this.formData = [];
        this.isReady = false;
        this.isUploading = false;
        this.isUploaded = false;
        this.isSuccess = false;
        this.isCancel = false;
        this.isError = false;
        this.progress = 0;
        this.index = void 0;
        this._chunkUploaders = [];
        this._currentChunk = 0;
        this._totalChunks = 0;
        this.uploader = uploader;
        this.some = some;
        this.options = options;
        this.file = new FileLikeObject(some);
        this._file = some;
        if (uploader.options) {
            this.method = uploader.options.method || 'POST';
            this.alias = uploader.options.itemAlias || 'file';
        }
        this.url = uploader.options.url;
    }
    upload() {
        try {
            this.uploader.uploadItem(this);
        }
        catch (e) {
            this.uploader._onCompleteItem(this, '', 0, {});
            this.uploader._onErrorItem(this, '', 0, {});
        }
    }
    createFileChunk(chunkSize) {
        this.fileChunks = new FileChunk(this._file, { byteStepSize: chunkSize });
        this._currentChunk = this.fileChunks.currentChunk;
        this._totalChunks = this.fileChunks.totalChunks;
    }
    getNextChunk() {
        this.fileChunks.prepareNextChunk();
        return this.fileChunks.getCurrentRawFileChunk();
    }
    setIsUploading(val) {
        this.isUploading = val;
        if (this.fileChunks) {
            this.fileChunks.setUploading(val);
        }
    }
    set fileChunks(val) {
        this._fileChunks = val;
    }
    get fileChunks() {
        return this._fileChunks;
    }
    cancel() {
        this.uploader.cancelItem(this);
    }
    remove() {
        this.uploader.removeFromQueue(this);
    }
    onBeforeUpload() {
        return void 0;
    }
    onBuildForm(form) {
        return { form };
    }
    onProgress(progress) {
        return { progress };
    }
    onSuccess(response, status, headers) {
        return { response, status, headers };
    }
    onError(response, status, headers) {
        return { response, status, headers };
    }
    onCancel(response, status, headers) {
        return { response, status, headers };
    }
    onComplete(response, status, headers) {
        return { response, status, headers };
    }
    onCompleteChunk(response, status, headers) {
        return { response, status, headers };
    }
    _onBeforeUpload() {
        this.isReady = true;
        this.isUploading = true;
        this.isUploaded = false;
        this.isSuccess = false;
        this.isCancel = false;
        this.isError = false;
        this.progress = 0;
        this.onBeforeUpload();
    }
    _onBuildForm(form) {
        this.onBuildForm(form);
    }
    _onProgress(progress) {
        this.progress = progress;
        this.onProgress(progress);
    }
    _onSuccess(response, status, headers) {
        this.isReady = false;
        this.isUploading = false;
        this.isUploaded = true;
        this.isSuccess = true;
        this.isCancel = false;
        this.isError = false;
        this.progress = 100;
        this.index = void 0;
        this.onSuccess(response, status, headers);
    }
    _onError(response, status, headers) {
        this.isReady = false;
        this.isUploading = false;
        this.isUploaded = true;
        this.isSuccess = false;
        this.isCancel = false;
        this.isError = true;
        this.progress = 0;
        this.index = void 0;
        this.onError(response, status, headers);
    }
    _onCancel(response, status, headers) {
        this.isReady = false;
        this.isUploading = false;
        this.isUploaded = false;
        this.isSuccess = false;
        this.isCancel = true;
        this.isError = false;
        this.progress = 0;
        this.index = void 0;
        this.onCancel(response, status, headers);
    }
    _onComplete(response, status, headers) {
        this.onComplete(response, status, headers);
        if (this.uploader.options.removeAfterUpload) {
            this.remove();
        }
    }
    _onCompleteChunk(response, status, headers) {
        this._onCompleteChunkCallnext();
        this.onCompleteChunk(response, status, headers);
    }
    _onCompleteChunkCallnext() {
    }
    _prepareToUploading() {
        this.index = this.index || ++this.uploader._nextIndex;
        this.isReady = true;
    }
}
//# sourceMappingURL=file-item.class.js.map