"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useView = exports.FileInfoProvider = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var FileInfoContext = (0, react_1.createContext)(undefined);
var FileInfoProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)("editor"), activeView = _b[0], setActiveView = _b[1];
    var _c = (0, react_1.useState)(null), rootNode = _c[0], setRootNode = _c[1];
    return ((0, jsx_runtime_1.jsx)(FileInfoContext.Provider, { value: { activeView: activeView, setActiveView: setActiveView, rootNode: rootNode, setRootNode: setRootNode }, children: children }));
};
exports.FileInfoProvider = FileInfoProvider;
// Alt bileşenlerin context'i tüketmesi için güvenli özel kanca (custom hook)
var useView = function () {
    var context = (0, react_1.useContext)(FileInfoContext);
    if (!context) {
        throw new Error("useView kancası bir ViewProvider içerisinde tüketilmelidir!");
    }
    return context;
};
exports.useView = useView;
