"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTree = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var file_info_tree_node_1 = require("./file-info-tree-node");
exports.FileTree = react_1.default.memo(function (_a) {
    var items = _a.items, _b = _a.depth, depth = _b === void 0 ? 0 : _b, _c = _a.parentPath, parentPath = _c === void 0 ? "" : _c, RowReverse = _a.RowReverse;
    var copyPath = (0, react_1.useCallback)(function (path) {
        navigator.clipboard.writeText(path);
        alert("Yol kopyaland\u0131: ".concat(path));
    }, []);
    var getFileColor = (0, react_1.useCallback)(function (name) {
        if (name.endsWith(".json"))
            return "text-amber-500 font-medium";
        if (name.endsWith(".ts") || name.endsWith(".tsx"))
            return "text-theme-primary font-medium";
        if (name.endsWith(".md"))
            return "text-emerald-500 font-medium";
        return "text-theme-muted";
    }, []);
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-col ".concat(depth > 0 ? "ml-2 border-l border-slate-800/60" : ""), children: items.map(function (item) {
            var currentPath = parentPath
                ? "".concat(parentPath, "/").concat(item.name)
                : item.name;
            return ((0, jsx_runtime_1.jsx)(file_info_tree_node_1.FileTreeNodeItem, { item: item, currentPath: currentPath, depth: depth, copyPath: copyPath, getFileColor: getFileColor, RowReverse: RowReverse }, currentPath));
        }) }));
});
