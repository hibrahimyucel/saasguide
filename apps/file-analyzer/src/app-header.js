"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppHeader = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var theme_selector_dropdown_1 = require("./components/theme-selector-dropdown");
var lucide_react_1 = require("lucide-react");
var file_info_provider_1 = require("./file-info/file-info-provider");
var AppHeader = function () {
    var _a = (0, file_info_provider_1.useView)(), activeView = _a.activeView, setActiveView = _a.setActiveView;
    return ((0, jsx_runtime_1.jsxs)("header", { className: "panel-header border-theme-primary m-1 shrink-0 rounded-b-md p-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-0 items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: "label-header" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "label-header", children: "File Analyzer" }), (0, jsx_runtime_1.jsx)("p", { className: "label-sub", children: "Saas Rehberi" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-1", children: [(0, jsx_runtime_1.jsx)("button", { onClick: function () { return setActiveView("explorer"); }, className: "rounded px-3 py-1 text-xs ".concat(activeView === "explorer" ? "bg-theme-primary text-white" : ""), children: "Gezgin" }), (0, jsx_runtime_1.jsx)("button", { onClick: function () { return setActiveView("editor"); }, className: "rounded px-3 py-1 text-xs ".concat(activeView === "editor" ? "bg-theme-primary text-white" : ""), children: "D\u00FCzenleyici" }), (0, jsx_runtime_1.jsx)(theme_selector_dropdown_1.ThemeSelectorDropDown, {})] })] }));
};
exports.AppHeader = AppHeader;
