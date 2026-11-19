"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileViewer = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var regexHelpers_1 = require("../utils/regexHelpers");
var lucide_react_1 = require("lucide-react");
var FileViewer = function (_a) {
    var selectedNode = _a.selectedNode, fileContent = _a.fileContent, schema = _a.schema;
    var _b = react_1.default.useState(false), copied = _b[0], setCopied = _b[1];
    // Dosya seçili değilse boş durum (Empty State) göster
    if (!selectedNode) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "border-analyzer-border bg-analyzer-surface/30 backdrop-blur-xs flex h-full flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Code, { size: 40, className: "text-analyzer-muted/60 mb-3 animate-pulse" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-analyzer-primary text-base font-medium", children: "Dosya Se\u00E7ilmedi" }), (0, jsx_runtime_1.jsx)("p", { className: "text-analyzer-muted mt-1 max-w-xs text-sm", children: "\u0130\u00E7eri\u011Fini, kod yap\u0131s\u0131n\u0131 ve \u015Fema analizini g\u00F6r\u00FCnt\u00FClemek i\u00E7in sol taraftaki a\u011Fa\u00E7tan bir dosya se\u00E7in." })] }));
    }
    // Seçili dosyanın şema analizini yap
    var _c = (0, regexHelpers_1.analyzePathWithSchema)(selectedNode.path, selectedNode.name, schema), isIgnored = _c.isIgnored, desc = _c.desc;
    var handleCopy = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!fileContent)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.clipboard.writeText(fileContent)];
                case 2:
                    _a.sent();
                    setCopied(true);
                    setTimeout(function () { return setCopied(false); }, 2000);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error("Kopyalama başarısız oldu:", err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "border-analyzer-border bg-analyzer-surface flex h-full flex-col overflow-hidden rounded-xl border shadow-xs backdrop-blur-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-analyzer-border bg-analyzer-surface/50 flex items-center justify-between border-b px-4 py-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex min-w-0 items-center space-x-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-analyzer-muted shrink-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileCode, { size: 18 }) }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-analyzer-primary truncate text-sm font-semibold tracking-wide", title: selectedNode.name, children: selectedNode.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-analyzer-muted/70 truncate font-mono text-xs", title: selectedNode.path, children: selectedNode.path })] })] }), fileContent && ((0, jsx_runtime_1.jsx)("button", { onClick: handleCopy, className: "border-analyzer-border hover:bg-analyzer-surface text-analyzer-primary flex items-center space-x-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors", children: copied ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { size: 13, className: "text-green-500" }), (0, jsx_runtime_1.jsx)("span", { className: "text-green-500", children: "Kopyaland\u0131" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { size: 13 }), (0, jsx_runtime_1.jsx)("span", { children: "Kopyala" })] })) }))] }), (desc || isIgnored) && ((0, jsx_runtime_1.jsxs)("div", { className: "border-analyzer-border/50 flex items-start space-x-2 border-b px-4 py-2 text-xs ".concat(isIgnored
                    ? "bg-amber-500/5 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/5 text-blue-600 dark:text-blue-400"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { size: 14, className: "mt-0.5 shrink-0" }), (0, jsx_runtime_1.jsxs)("div", { className: "truncate", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: isIgnored ? "Yoksayılan Dosya: " : "Dosya Bilgisi: " }), (0, jsx_runtime_1.jsx)("span", { className: "italic", children: desc ||
                                    "Bu dosya tipi tanımlanan kurallar gereği analiz dışı bırakılmıştır." })] })] })), (0, jsx_runtime_1.jsx)("div", { className: "custom-scrollbar flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed", children: fileContent !== null ? (fileContent.trim() === "" ? ((0, jsx_runtime_1.jsx)("div", { className: "text-analyzer-muted/50 flex h-full items-center justify-center italic", children: "Dosya i\u00E7eri\u011Fi bo\u015F." })) : ((0, jsx_runtime_1.jsx)("pre", { className: "text-analyzer-primary whitespace-pre-wrap break-all", children: (0, jsx_runtime_1.jsx)("code", { children: fileContent }) }))) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex h-full flex-col items-center justify-center space-y-2 py-12", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" }), (0, jsx_runtime_1.jsx)("p", { className: "text-analyzer-muted text-xs", children: "Dosya i\u00E7eri\u011Fi y\u00FCkleniyor..." })] })) })] }));
};
exports.FileViewer = FileViewer;
