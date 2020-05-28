export class FileChunk {
    constructor(rawFile, options = {}) {
        this.stepSize = 1024 * 1024 * 3;
        this.rawFile = null;
        this.uploadProgress = null;
        this.uploading = null;
        this.uploadComplete = null;
        this.byteStepSize = null;
        this.totalSize = null;
        this.startByte = null;
        this.endByte = null;
        this.currentChunk = 0;
        this.totalChunks = null;
        this.uniqueIdentifier = null;
        this.totalSent = null;
        this.extraData = {};
        if (typeof options !== 'undefined') {
            if (typeof options.byteStepSize !== 'undefined') {
                this.setByteStepSize(options.byteStepSize);
            }
        }
        this.setRawFile(rawFile);
        this.setRawFile(rawFile);
        this.setUploadProgress(0);
        this.setUploading(false);
        this.setUploadComplete(false);
        this.setTotalSize(this.getRawFile().size);
        this.setStartByte(0);
        this.setEndByte(this.getByteStepSize());
        this.setCurrentChunk(0);
        if (!this.getBrowserSliceMethod()) {
            this.setTotalChunks(1);
        }
        else {
            this.setTotalChunks(Math.ceil(this.totalSize / this.byteStepSize));
        }
        this.setUniqueIdenfier(this.generateUniqueIdentifier());
        this.setTotalSent(0);
    }
    setExtraData(index, value) {
        this.extraData[index] = value;
    }
    getExtraData(index) {
        return this.extraData[index];
    }
    //getters and setters
    setProgress(v) {
        this.uploadProgress = v;
    }
    getProgress() {
        return this.uploadProgress;
    }
    setUploading(v) {
        this.uploading = v;
    }
    getUploading() {
        return this.uploading;
    }
    getUploadComplete() {
        return this.uploadComplete;
    }
    setUploadComplete(v) {
        this.uploadComplete = v;
    }
    setUploadProgress(v) {
        this.uploadProgress = v;
    }
    getUploadProgress() {
        return this.uploadProgress;
    }
    getStartByte() {
        return this.startByte;
    }
    setStartByte(v) {
        this.startByte = v;
    }
    getEndByte() {
        return this.endByte;
    }
    setEndByte(v) {
        this.endByte = v;
    }
    getByteStepSize() {
        return this.byteStepSize;
    }
    setByteStepSize(v) {
        this.byteStepSize = v;
    }
    setTotalSize(v) {
        this.totalSize = v;
    }
    getTotalSize() {
        return this.totalSize;
    }
    getRawFile() {
        return this.rawFile;
    }
    setRawFile(v) {
        this.rawFile = v;
    }
    getCurrentChunk() {
        return this.currentChunk;
    }
    setCurrentChunk(v) {
        this.currentChunk = v;
    }
    getTotalChunks() {
        return this.totalChunks;
    }
    setTotalChunks(v) {
        this.totalChunks = v;
    }
    setUniqueIdenfier(v) {
        this.uniqueIdentifier = v;
    }
    getUniqueIdenfier() {
        return this.uniqueIdentifier;
    }
    getRawFileExtension() {
        const extension = this.getRawFileName().split('.');
        return extension[extension.length - 1];
    }
    getRawFileName() {
        return this.getRawFile().name;
    }
    getContentType() {
        return this.getRawFile().type;
    }
    getTotalSent() {
        return this.totalSent;
    }
    setTotalSent(v) {
        this.totalSent = v;
    }
    getCurrentRawFileChunk() {
        if (!this.getBrowserSliceMethod()) {
            return this.getRawFile();
        }
        else {
            return this.getRawFile()[this.getBrowserSliceMethod()](this.getStartByte(), this.getEndByte());
        }
    }
    retrocedeChunk() {
        if (!this.getBrowserSliceMethod()) {
            return false;
        }
        this.setEndByte(this.getStartByte());
        this.setStartByte(this.getStartByte() - this.getByteStepSize());
        this.setCurrentChunk(this.getCurrentChunk() - 1);
        if (this.getTotalSent() != 0) {
            this.setTotalSent(this.getTotalSent() - this.getByteStepSize());
        }
    }
    prepareNextChunk() {
        if (!this.getBrowserSliceMethod()) {
            return false;
        }
        if (this.getEndByte() > this.getTotalSize()) { //finished
            return false;
        }
        this.setStartByte(this.getEndByte());
        this.setEndByte(this.getEndByte() + this.getByteStepSize());
        this.setCurrentChunk(this.getCurrentChunk() + 1);
        return true;
    }
    getBrowserSliceMethod() {
        if (this.rawFile && typeof this.rawFile !== 'undefined') {
            if (this.rawFile.slice && typeof this.rawFile.slice == 'function') {
                return 'slice';
            }
            else if (this.rawFile.mozSlice && typeof this.rawFile.mozSlice == 'function') {
                return 'mozSlice';
            }
            else if (this.rawFile.webkitSlice && typeof this.rawFile.webkitSlice == 'function') {
                return 'webkitSlice';
            }
        }
        else {
            return null;
        }
    } //getBrowserSliceMethod() ends here
    generateUniqueIdentifier() {
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
}
//# sourceMappingURL=file-chunk.class.js.map