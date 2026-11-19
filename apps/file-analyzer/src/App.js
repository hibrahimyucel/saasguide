"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var jsx_runtime_1 = require("react/jsx-runtime");
var app_header_1 = require("./app-header");
var file_info_provider_1 = require("./file-info/file-info-provider");
var file_info_manager_1 = require("./file-info/file-info-manager");
var file_info_dataprovider_1 = require("./file-info/file-info-dataprovider");
var dash_1 = require("./file-info/dash");
function App() {
    var activeView = (0, file_info_provider_1.useView)().activeView;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "panel-app", children: [(0, jsx_runtime_1.jsx)(app_header_1.AppHeader, {}), (0, jsx_runtime_1.jsxs)(file_info_dataprovider_1.PatternProvider, { children: [activeView === "explorer" && (0, jsx_runtime_1.jsx)(dash_1.FileAnalyzerDashboard, {}), activeView === "editor" && (0, jsx_runtime_1.jsx)(file_info_manager_1.FileInfoManager, {})] }), (0, jsx_runtime_1.jsxs)("footer", { className: "border-theme-border bg-theme-surface text-theme-muted flex h-6 shrink-0 items-center justify-between border-t px-4 text-[10px]", children: [(0, jsx_runtime_1.jsxs)("div", { children: ["Durum: ", activeView] }), (0, jsx_runtime_1.jsx)("div", { className: "font-mono", children: "LN 1, Col 1" })] })] }));
}
