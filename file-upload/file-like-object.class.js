function isElement(node) {
    return !!(node && (node.nodeName || node.prop && node.attr && node.find));
}
export class FileLikeObject {
    constructor(fileOrInput) {
        this.rawFile = fileOrInput;
        let isInput = isElement(fileOrInput);
        let fakePathOrObject = isInput ? fileOrInput.value : fileOrInput;
        let postfix = typeof fakePathOrObject === 'string' ? 'FakePath' : 'Object';
        let method = '_createFrom' + postfix;
        this[method](fakePathOrObject);
    }
    _createFromFakePath(path) {
        this.lastModifiedDate = void 0;
        this.size = void 0;
        this.type = 'like/' + path.slice(path.lastIndexOf('.') + 1).toLowerCase();
        this.name = path.slice(path.lastIndexOf('/') + path.lastIndexOf('\\') + 2);
    }
    _createFromObject(object) {
        this.size = object.size;
        this.type = object.type;
        this.name = object.name;
    }
}
//# sourceMappingURL=file-like-object.class.js.map