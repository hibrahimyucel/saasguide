"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeRow = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
exports.TreeRow = react_1.default.memo(function (_a) {
    var item = _a.item, depth = _a.depth, isCollapsed = _a.isCollapsed, onToggleFolder = _a.onToggleFolder, onCopyPath = _a.onCopyPath, getFileColor = _a.getFileColor;
    var isFolder = item.kind === "directory";
    // Tailwind'e dinamik padding yerine sınıflarla destek veriyoruz
    var paddingLeftClass = "pl-[".concat(depth * 20, "px]");
    if (isFolder) {
        return ((0, jsx_runtime_1.jsxs)("div", { onClick: function () { return onToggleFolder(item.name); }, className: "group flex cursor-pointer items-center justify-between bg-slate-200/10", children: [(0, jsx_runtime_1.jsx)("span", { className: "shrink-0 p-3", children: isCollapsed ? (0, jsx_runtime_1.jsx)(lucide_react_1.Folder, { size: 16 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.FolderOpen, { size: 16 }) }), (0, jsx_runtime_1.jsx)("span", { className: "item-name", children: item.name }), (0, jsx_runtime_1.jsx)("span", { className: "item-desc", children: item.description })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "group flex cursor-pointer items-center justify-between bg-blue-100/30", style: { color: getFileColor(item.name) }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs", children: [(0, jsx_runtime_1.jsx)("span", { className: "shrink-0 p-3", children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 16 }) }), (0, jsx_runtime_1.jsx)("span", { className: "item-name", children: item.name })] }), (0, jsx_runtime_1.jsx)("span", { className: "item-desc", children: item.description })] }));
});
// React DevTools'ta isimlendirme için
exports.TreeRow.displayName = "TreeRow";
