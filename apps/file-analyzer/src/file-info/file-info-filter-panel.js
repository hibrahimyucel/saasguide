"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternSidebar = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var file_info_dataprovider_1 = require("./file-info-dataprovider");
var PatternSidebar = function () {
    var _a = (0, file_info_dataprovider_1.usePatterns)(), patterns = _a.patterns, toggleChecked = _a.toggleChecked, resetPatterns = _a.resetPatterns;
    var _b = (0, react_1.useState)(""), sidebarSearch = _b[0], setSidebarSearch = _b[1];
    // Group rules deterministically for scannable navigation
    var groupedPatterns = react_1.default.useMemo(function () {
        var searchLower = sidebarSearch.toLowerCase();
        var filtered = patterns.filter(function (p) {
            return p.expression.toLowerCase().includes(searchLower) ||
                p.group.toLowerCase().includes(searchLower);
        });
        return {
            regular: filtered.filter(function (p) { return p.kind === "1-regular"; }),
            regex: filtered.filter(function (p) { return p.kind === "2-regExp"; }),
            extension: filtered.filter(function (p) { return p.kind === "3-ext"; }),
        };
    }, [patterns, sidebarSearch]);
    var RenderSection = function (_a) {
        var title = _a.title, items = _a.items, Icon = _a.icon;
        if (items.length === 0)
            return null;
        return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-theme-muted flex items-center space-x-1.5 px-2 text-[10px] font-bold tracking-wider uppercase", children: [(0, jsx_runtime_1.jsx)(Icon, { size: 12, className: "opacity-70" }), (0, jsx_runtime_1.jsxs)("span", { children: [title, " (", items.length, ")"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-0.5 pl-1", children: items.map(function (pattern) { return ((0, jsx_runtime_1.jsxs)("label", { className: "hover:bg-theme-surface-hover/50 flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors duration-150 ".concat(pattern.checked
                            ? "border border-indigo-500/20 bg-indigo-600/10"
                            : "border border-transparent"), children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex min-w-0 flex-1 items-center space-x-2.5", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: function () { return toggleChecked(pattern.expression); }, className: "shrink-0 transition-colors ".concat(pattern.checked ? "text-indigo-500" : "text-gray-400 hover:text-gray-500"), children: pattern.checked ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckSquare, { size: 14 })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Square, { size: 14 })) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex min-w-0 flex-col", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-theme-primary truncate font-mono text-xs font-medium", children: pattern.expression }), pattern.group && ((0, jsx_runtime_1.jsx)("span", { className: "text-theme-muted truncate text-[10px] font-medium", children: pattern.group }))] })] }), pattern.ignore && ((0, jsx_runtime_1.jsx)("span", { className: "py-0.2 ml-2 shrink-0 rounded border border-red-500/20 bg-red-500/10 px-1 text-[9px] font-semibold text-red-400", children: "ignore" }))] }, pattern.expression)); }) })] }));
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-theme-surface/30 border-theme-border flex h-full w-80 shrink-0 flex-col space-y-4 overflow-hidden border-r p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex shrink-0 items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FolderTree, { size: 16, className: "text-indigo-500" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-theme-text text-sm font-bold tracking-tight", children: "Schema Explorer" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: resetPatterns, title: "Reset System Schema", className: "text-theme-muted hover:text-theme-text hover:bg-theme-surface rounded-md p-1 transition-colors duration-150", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 13 }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative shrink-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute top-1/2 left-3 -translate-y-1/2 text-gray-400", size: 13 }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Filter schema expressions...", value: sidebarSearch, onChange: function (e) { return setSidebarSearch(e.target.value); }, className: "bg-theme-surface w-full rounded-lg border border-gray-300 py-1.5 pr-3 pl-8 text-xs focus:border-indigo-500 focus:outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-1", children: [(0, jsx_runtime_1.jsx)(RenderSection, { title: "Regular Girdileri", items: groupedPatterns.regular, icon: lucide_react_1.Layers }), (0, jsx_runtime_1.jsx)(RenderSection, { title: "Regex / Tarih Desenleri", items: groupedPatterns.regex, icon: lucide_react_1.FolderTree }), (0, jsx_runtime_1.jsx)(RenderSection, { title: "Dosya Uzant\u0131lar\u0131", items: groupedPatterns.extension, icon: lucide_react_1.Layers }), patterns.length === 0 && ((0, jsx_runtime_1.jsx)("div", { className: "text-theme-muted px-2 py-8 text-center text-xs", children: "Aktif \u015Fema kural\u0131 bulunamad\u0131." }))] })] }));
};
exports.PatternSidebar = PatternSidebar;
