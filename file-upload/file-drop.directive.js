import { Directive, EventEmitter, ElementRef, HostListener, Input, Output } from '@angular/core';
export class FileDropDirective {
    constructor(element) {
        this.fileOver = new EventEmitter();
        this.onFileDrop = new EventEmitter();
        this.element = element;
    }
    getOptions() {
        return this.uploader.options;
    }
    getFilters() {
        return {};
    }
    onDrop(event) {
        let transfer = this._getTransfer(event);
        if (!transfer) {
            return;
        }
        let options = this.getOptions();
        let filters = this.getFilters();
        this._preventAndStop(event);
        this.uploader.addToQueue(transfer.files, options, filters);
        this.fileOver.emit(false);
        this.onFileDrop.emit(transfer.files);
    }
    onDragOver(event) {
        let transfer = this._getTransfer(event);
        if (!this._haveFiles(transfer.types)) {
            return;
        }
        transfer.dropEffect = 'copy';
        this._preventAndStop(event);
        this.fileOver.emit(true);
    }
    onDragLeave(event) {
        if (this.element) {
            if (event.currentTarget === this.element[0]) {
                return;
            }
        }
        this._preventAndStop(event);
        this.fileOver.emit(false);
    }
    _getTransfer(event) {
        return event.dataTransfer ? event.dataTransfer : event.originalEvent.dataTransfer; // jQuery fix;
    }
    _preventAndStop(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    _haveFiles(types) {
        if (!types) {
            return false;
        }
        if (types.indexOf) {
            return types.indexOf('Files') !== -1;
        }
        else if (types.contains) {
            return types.contains('Files');
        }
        else {
            return false;
        }
    }
}
FileDropDirective.decorators = [
    { type: Directive, args: [{ selector: '[ng2FileDrop]' },] },
];
/** @nocollapse */
FileDropDirective.ctorParameters = () => [
    { type: ElementRef, },
];
FileDropDirective.propDecorators = {
    'uploader': [{ type: Input },],
    'fileOver': [{ type: Output },],
    'onFileDrop': [{ type: Output },],
    'onDrop': [{ type: HostListener, args: ['drop', ['$event'],] },],
    'onDragOver': [{ type: HostListener, args: ['dragover', ['$event'],] },],
    'onDragLeave': [{ type: HostListener, args: ['dragleave', ['$event'],] },],
};
//# sourceMappingURL=file-drop.directive.js.map