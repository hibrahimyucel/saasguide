"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTreeView = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var file_info_dataprovider_1 = require("./file-info-dataprovider");
// --- REKÜRSIF TREE NODE BİLEŞENİ ---
var TreeNode = function (_a) {
    var node = _a.node, depth = _a.depth, showOnlyFiltered = _a.showOnlyFiltered;
    var _b = (0, react_1.useState)(depth < 2), isOpen = _b[0], setIsOpen = _b[1]; // Kök ve ilk seviye klasörler varsayılan açık gelir
    // Eğer "Sadece filtrelenmişleri göster" aktifse ve bu düğüm/alt elemanları eşleşmiyorsa render etme
    var hasFilteredChildren = function (n) {
        if (n.filtered)
            return true;
        if (n.children)
            return n.children.some(function (child) { return hasFilteredChildren(child); });
        return false;
    };
    if (showOnlyFiltered && !hasFilteredChildren(node)) {
        return null;
    }
    var isDir = node.isDirectory;
    var isFiltered = node.filtered;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col select-none", children: [(0, jsx_runtime_1.jsxs)("div", { onClick: function () { return isDir && setIsOpen(!isOpen); }, style: { paddingLeft: "".concat(depth * 14 + 8, "px") }, className: "group relative flex cursor-pointer items-center justify-between border-l-2 py-1.5 pr-3 text-xs transition-all duration-150 ".concat(isFiltered
                    ? "border-indigo-500 bg-indigo-600/5 font-medium text-indigo-400"
                    : "hover:bg-theme-surface/30 text-theme-text border-transparent"), children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex min-w-0 items-center space-x-2", children: [isDir ? ((0, jsx_runtime_1.jsx)("span", { className: "text-theme-muted group-hover:text-theme-text shrink-0 transition-colors", children: isOpen ? (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { size: 14 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 14 }) })) : ((0, jsx_runtime_1.jsx)("span", { className: "w-3.5 shrink-0" }) // Dosyalar için hizalama boşluğu
                            ), (0, jsx_runtime_1.jsx)("span", { className: isFiltered ? "text-indigo-400" : "text-theme-muted shrink-0", children: isDir ? (isOpen ? ((0, jsx_runtime_1.jsx)(lucide_react_1.FolderOpen, { size: 14 })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Folder, { size: 14 }))) : ((0, jsx_runtime_1.jsx)(lucide_react_1.File, { size: 13 })) }), (0, jsx_runtime_1.jsx)("span", { className: "truncate font-mono tracking-tight", children: node.name })] }), isFiltered && ((0, jsx_runtime_1.jsx)("span", { className: "ml-2 shrink-0 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-indigo-400 uppercase shadow-2xs", children: "Matched" }))] }), isDir && isOpen && node.children && ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-col", children: node.children.map(function (child, idx) { return ((0, jsx_runtime_1.jsx)(TreeNode, { node: child, depth: depth + 1, showOnlyFiltered: showOnlyFiltered }, "".concat(child.path, "-").concat(idx))); }) }))] }));
};
// --- ANA TREE VIEW PANELI ---
var FileTreeView = function () {
    var scannedTree = (0, file_info_dataprovider_1.usePatterns)().scannedTree;
    var _a = (0, react_1.useState)(false), showOnlyFiltered = _a[0], setShowOnlyFiltered = _a[1];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-theme-surface/30 border-theme-border flex h-full flex-1 flex-col space-y-3 overflow-hidden rounded-xl border p-4 shadow-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border/60 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b pb-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-theme-text text-sm font-bold tracking-tight", children: "Taranan Dosya Sistemi" }), (0, jsx_runtime_1.jsx)("p", { className: "text-theme-muted text-[11px]", children: scannedTree
                                    ? "K\u00F6k Dizin: ".concat(scannedTree.name)
                                    : "Henüz bir klasör taranmadı" })] }), scannedTree && ((0, jsx_runtime_1.jsxs)("button", { onClick: function () { return setShowOnlyFiltered(!showOnlyFiltered); }, className: "flex cursor-pointer items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all duration-150 ".concat(showOnlyFiltered
                            ? "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500"
                            : "bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border"), children: [showOnlyFiltered ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 13 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 13 }), (0, jsx_runtime_1.jsx)("span", { children: showOnlyFiltered ? "Hepsini Göster" : "Sadece Eşleşenleri Süz" })] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "border-theme-border/30 custom-scrollbar bg-theme-surface/10 flex-1 overflow-y-auto rounded-lg border py-2", children: scannedTree ? ((0, jsx_runtime_1.jsx)(TreeNode, { node: scannedTree, depth: 0, showOnlyFiltered: showOnlyFiltered })) : ((0, jsx_runtime_1.jsxs)("div", { className: "text-theme-muted flex h-full flex-col items-center justify-center space-y-1 py-12 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium", children: "G\u00F6r\u00FCnt\u00FClenecek dosya a\u011Fac\u0131 bulunamad\u0131." }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] opacity-75", children: "L\u00FCtfen tarama sayfas\u0131ndan bir klas\u00F6r s\u00FCr\u00FCkleyin veya se\u00E7in." })] })) })] }));
};
exports.FileTreeView = FileTreeView;
