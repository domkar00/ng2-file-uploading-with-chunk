import { Directive, EventEmitter, ElementRef, Input, HostListener, Output } from '@angular/core';
export class FileSelectDirective {
    constructor(element) {
        this.onFileSelected = new EventEmitter();
        this.element = element;
    }
    getOptions() {
        return this.uploader.options;
    }
    getFilters() {
        return {};
    }
    isEmptyAfterSelection() {
        return !!this.element.nativeElement.attributes.multiple;
    }
    onChange() {
        let files = this.element.nativeElement.files;
        let options = this.getOptions();
        let filters = this.getFilters();
        this.uploader.addToQueue(files, options, filters);
        this.onFileSelected.emit(files);
        if (this.isEmptyAfterSelection()) {
            this.element.nativeElement.value = '';
        }
    }
}
FileSelectDirective.decorators = [
    { type: Directive, args: [{ selector: '[ng2FileSelect]' },] },
];
/** @nocollapse */
FileSelectDirective.ctorParameters = () => [
    { type: ElementRef, },
];
FileSelectDirective.propDecorators = {
    'uploader': [{ type: Input },],
    'onFileSelected': [{ type: Output },],
    'onChange': [{ type: HostListener, args: ['change',] },],
};
//# sourceMappingURL=file-select.directive.js.map