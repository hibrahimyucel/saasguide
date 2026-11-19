"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTree = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var treeRow_1 = require("./treeRow");
var FileTree = function (_a) {
    var items = _a.items, _b = _a.depth, depth = _b === void 0 ? 0 : _b, _c = _a.parentPath, parentPath = _c === void 0 ? "" : _c, openFolders = _a.openFolders, toggleFolder = _a.toggleFolder, copyPath = _a.copyPath, getFileColor = _a.getFileColor, RowReverse = _a.RowReverse;
    // Fonksiyon referanslarını sabitleyerek TreeRow'un gereksiz render olmasını engelliyoruz
    var handleToggle = (0, react_1.useCallback)(function (name) { return toggleFolder(name); }, [toggleFolder]);
    var handleCopy = (0, react_1.useCallback)(function (name) { return copyPath(name); }, [copyPath]);
    var handleColor = (0, react_1.useCallback)(function (name) { return getFileColor(name); }, [getFileColor]);
    return ((0, jsx_runtime_1.jsx)("div", { className: "border-emerald-400", children: items.map(function (item) {
            var isFolder = item.kind === "directory";
            var isCollapsed = openFolders[item.name];
            return ((0, jsx_runtime_1.jsxs)("div", { className: "pl-5", children: [(0, jsx_runtime_1.jsx)(treeRow_1.TreeRow, { item: item, depth: depth, isCollapsed: isCollapsed, onToggleFolder: handleToggle, onCopyPath: handleCopy, getFileColor: handleColor }), isFolder &&
                        !isCollapsed &&
                        item.children &&
                        item.children.length > 0 && ((0, jsx_runtime_1.jsx)(exports.FileTree, { items: item.children, depth: depth + 1, openFolders: openFolders, toggleFolder: toggleFolder, copyPath: copyPath, getFileColor: getFileColor, parentPath: parentPath ? "".concat(parentPath, "/").concat(item.name) : item.name, RowReverse: !RowReverse }))] }, item.name));
        }) }));
};
exports.FileTree = FileTree;
