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
exports.ProjectReport = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_markdown_1 = require("react-markdown");
var remark_gfm_1 = require("remark-gfm");
var ProjectReport = function (_a) {
    var rootNode = _a.rootNode;
    var _b = (0, react_1.useState)(""), markdownPreview = _b[0], setMarkdownPreview = _b[1];
    var _c = (0, react_1.useState)(false), copied = _c[0], setCopied = _c[1];
    var _d = (0, react_1.useState)("preview"), activeTab = _d[0], setActiveTab = _d[1];
    (0, react_1.useEffect)(function () {
        if (!rootNode)
            return;
        var md = "# Proje Yap\u0131 Analiz Raporu\n\n| Dosya / Klas\u00F6r Yolu | Tip | Boyut | Durum | A\u00E7\u0131klama |\n| :--- | :--- | :--- | :--- | :--- |\n";
        var generateRow = function (node) {
            var _a;
            md += "| `".concat(node.path, "` | ").concat(node.kind === "directory" ? "📂" : "📄", " | ").concat(node.size || "-", " | ").concat(node.isIgnored ? "❌" : "✅", " | ").concat(node.matchedRule || "-", " |\n");
            (_a = node.children) === null || _a === void 0 ? void 0 : _a.forEach(generateRow);
        };
        generateRow(rootNode);
        setMarkdownPreview(md);
    }, [rootNode]);
    var handleCopy = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!markdownPreview)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.clipboard.writeText(markdownPreview)];
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
    if (!rootNode) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "border-theme-border text-theme-muted bg-theme-surface/10 rounded-xl border border-dashed p-8 text-center", children: "Analiz edilecek proje verisi bulunamad\u0131." }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border bg-theme-surface/20 w-full overflow-hidden rounded-xl border shadow-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border bg-theme-surface/50 flex flex-col justify-between gap-2 border-b px-4 py-2 sm:flex-row sm:items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-theme-surface/80 border-theme-border/40 flex self-start rounded-lg border p-1 text-xs font-semibold", children: [(0, jsx_runtime_1.jsx)("button", { onClick: function () { return setActiveTab("preview"); }, className: "cursor-pointer rounded-md px-3 py-1.5 transition-all ".concat(activeTab === "preview"
                                    ? "bg-theme-bg text-theme-text shadow-xs"
                                    : "text-theme-muted hover:text-theme-text"), children: "\uD83D\uDCCA G\u00F6rsel Tablo" }), (0, jsx_runtime_1.jsx)("button", { onClick: function () { return setActiveTab("code"); }, className: "cursor-pointer rounded-md px-3 py-1.5 transition-all ".concat(activeTab === "code"
                                    ? "bg-theme-bg text-theme-text shadow-xs"
                                    : "text-theme-muted hover:text-theme-text"), children: "\uD83D\uDCBB Markdown Kodu" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleCopy, disabled: !markdownPreview, className: "flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ".concat(copied ? "bg-emerald-600 text-white" : "btn-primary"), children: copied ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\u2713" }), " Kopyaland\u0131!"] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\uD83D\uDCCB" }), " Raporu Kopyala"] })) })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-theme-bg max-h-150 overflow-auto p-4", children: activeTab === "preview" ? (
                // GÖRSEL TABLO ÖNİZLEMESİ (Tema ile tam uyumlu)
                (0, jsx_runtime_1.jsx)("div", { className: "text-theme-text prose-table:w-full prose-table:border-collapse prose-th:bg-theme-surface prose-th:p-3 prose-th:font-semibold prose-th:text-theme-text prose-th:border-b prose-th:border-theme-border prose-td:p-3 prose-td:border-b prose-td:border-theme-border/40 prose-code:bg-theme-surface/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:text-theme-primary max-w-none text-sm", children: (0, jsx_runtime_1.jsx)(react_markdown_1.default, { remarkPlugins: [remark_gfm_1.default], children: markdownPreview }) })) : (
                // DÜZ MARKDOWN KODU ÖNİZLEMESİ
                (0, jsx_runtime_1.jsx)("pre", { className: "bg-theme-surface/40 border-theme-border text-theme-text overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-relaxed whitespace-pre sm:text-sm", children: markdownPreview })) })] }));
};
exports.ProjectReport = ProjectReport;
