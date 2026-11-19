"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAnalyzerDashboard = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var file_info_filter_panel_1 = require("./file-info-filter-panel");
var uni_scanner_1 = require("./uni-scanner");
var fitree_1 = require("./fitree");
var file_info_dataprovider_1 = require("./file-info-dataprovider");
var lucide_react_1 = require("lucide-react");
var FileAnalyzerDashboard = function () {
    var scannedTree = (0, file_info_dataprovider_1.usePatterns)().scannedTree;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-theme-background border-theme-border flex h-[calc(100vh-2rem)] w-full gap-4 overflow-hidden rounded-2xl border p-4 shadow-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-full shrink-0", children: (0, jsx_runtime_1.jsx)(file_info_filter_panel_1.PatternSidebar, {}) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex h-full flex-1 flex-col space-y-4 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-theme-surface/10 border-theme-border/40 flex shrink-0 items-center justify-between rounded-xl border p-3.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "rounded-lg bg-indigo-600/10 p-2 text-indigo-500", children: (0, jsx_runtime_1.jsx)(lucide_react_1.LayoutGrid, { size: 18 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-theme-text text-base font-bold tracking-tight", children: "File Analyzer Dashboard" }), (0, jsx_runtime_1.jsx)("p", { className: "text-theme-muted text-xs", children: "\u015Eema kurallar\u0131na g\u00F6re yerel klas\u00F6r yap\u0131lar\u0131n\u0131 ve uzant\u0131lar\u0131 ger\u00E7ek zamanl\u0131 filtreleyin." })] })] }), scannedTree && ((0, jsx_runtime_1.jsxs)("div", { className: "shadow-3xs hidden items-center space-x-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:flex", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Info, { size: 12 }), (0, jsx_runtime_1.jsx)("span", { children: "Haf\u0131za A\u011Fac\u0131 Aktif" })] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "shrink-0", children: (0, jsx_runtime_1.jsx)(uni_scanner_1.UniversalFileScanner, {}) }), (0, jsx_runtime_1.jsx)("div", { className: "min-h-0 flex-1 overflow-hidden", children: (0, jsx_runtime_1.jsx)(fitree_1.FileTreeView, {}) })] })] }));
};
exports.FileAnalyzerDashboard = FileAnalyzerDashboard;
