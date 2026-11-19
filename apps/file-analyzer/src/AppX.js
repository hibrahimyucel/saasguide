"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var types_1 = require("./types");
var mdedit_1 = require("./mdedit");
var theme_selector_1 = require("./components/theme-selector");
var file_info_manager_1 = require("./file-info/file-info-manager");
var fileTree_1 = require("./components/fileTree");
var folder_dropzone_1 = require("./components/folder-dropzone");
function App() {
    var _this = this;
    var _a = (0, react_1.useState)(types_1.generateDescMap), schema = _a[0], setSchema = _a[1];
    var _b = (0, react_1.useState)(null), rootNode = _b[0], setRootNode = _b[1];
    var _c = (0, react_1.useState)(false), isScanning = _c[0], setIsScanning = _c[1];
    var _d = (0, react_1.useState)("tree"), activeTab = _d[0], setActiveTab = _d[1];
    var _e = (0, react_1.useState)({}), openFolders = _e[0], setOpenFolders = _e[1];
    var _f = (0, react_1.useState)(""), markdownPreview = _f[0], setMarkdownPreview = _f[1];
    var _g = (0, react_1.useState)(false), copied = _g[0], setCopied = _g[1];
    var toggleFolder = (0, react_1.useCallback)(function (name) {
        setOpenFolders(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = !prev[name], _a)));
        });
    }, []);
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
    var getDescription = function (name) {
        var _a;
        var lowerName = name.toLowerCase();
        var customMatch = schema.List.find(function (d) { return d.expression.toLowerCase() === lowerName; });
        if (customMatch)
            return { isIgnored: customMatch.ignore, desc: customMatch.description };
        var regexMatch = schema.RegExp.find(function (d) { var _a; return (_a = d.regExp) === null || _a === void 0 ? void 0 : _a.test(name); });
        if (regexMatch)
            return { isIgnored: regexMatch.ignore, desc: regexMatch.description };
        var fileExt = name.includes(".")
            ? (_a = name.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()
            : "";
        if (fileExt) {
            var extensionMatch = schema.Descriptions.find(function (d) {
                var exprLower = d.expression.toLowerCase();
                return exprLower === fileExt || exprLower === ".".concat(fileExt);
            });
            if (extensionMatch)
                return {
                    isIgnored: extensionMatch.ignore,
                    desc: extensionMatch.description,
                };
        }
        return { isIgnored: false, desc: "" };
    };
    var handleSelectDirectory = function () { return __awaiter(_this, void 0, void 0, function () {
        var directoryHandle, scan_1, _a, e_1;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, 4, 5]);
                    return [4 /*yield*/, window.showDirectoryPicker()];
                case 1:
                    directoryHandle = _b.sent();
                    setIsScanning(true);
                    scan_1 = function (handle, currentPath, depth) { return __awaiter(_this, void 0, void 0, function () {
                        var check, nodeSizeStr, isIgnored, matchedRule, fileData, sizeInMB, _a, node, _b, _c, _d, entry, _e, _f, e_2_1;
                        var _g, e_2, _h, _j;
                        return __generator(this, function (_k) {
                            switch (_k.label) {
                                case 0:
                                    check = getDescription(handle.name);
                                    nodeSizeStr = "";
                                    isIgnored = check.isIgnored;
                                    matchedRule = check.desc;
                                    if (!(handle.kind === "file")) return [3 /*break*/, 4];
                                    _k.label = 1;
                                case 1:
                                    _k.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, handle.getFile()];
                                case 2:
                                    fileData = _k.sent();
                                    sizeInMB = fileData.size / (1024 * 1024);
                                    nodeSizeStr =
                                        sizeInMB < 0.1
                                            ? "".concat((fileData.size / 1024).toFixed(1), " KB")
                                            : "".concat(sizeInMB.toFixed(2), " MB");
                                    if (sizeInMB > schema.maxFileSizeMB) {
                                        isIgnored = true;
                                        matchedRule = "Boyut S\u0131n\u0131r\u0131 \u0130hlali (> ".concat(schema.maxFileSizeMB, "MB)");
                                    }
                                    return [3 /*break*/, 4];
                                case 3:
                                    _a = _k.sent();
                                    return [3 /*break*/, 4];
                                case 4:
                                    node = {
                                        name: handle.name,
                                        path: "".concat(currentPath, "/").concat(handle.name),
                                        kind: handle.kind,
                                        depth: depth,
                                        isDirectory: handle.kind === "directory",
                                        isIgnored: isIgnored,
                                        size: nodeSizeStr,
                                        description: matchedRule,
                                    };
                                    if (!(handle.kind === "directory" && !node.isIgnored)) return [3 /*break*/, 18];
                                    node.children = [];
                                    _k.label = 5;
                                case 5:
                                    _k.trys.push([5, 11, 12, 17]);
                                    _b = true, _c = __asyncValues(handle.values());
                                    _k.label = 6;
                                case 6: return [4 /*yield*/, _c.next()];
                                case 7:
                                    if (!(_d = _k.sent(), _g = _d.done, !_g)) return [3 /*break*/, 10];
                                    _j = _d.value;
                                    _b = false;
                                    entry = _j;
                                    _f = (_e = node.children).push;
                                    return [4 /*yield*/, scan_1(entry, node.path, depth + 1)];
                                case 8:
                                    _f.apply(_e, [_k.sent()]);
                                    _k.label = 9;
                                case 9:
                                    _b = true;
                                    return [3 /*break*/, 6];
                                case 10: return [3 /*break*/, 17];
                                case 11:
                                    e_2_1 = _k.sent();
                                    e_2 = { error: e_2_1 };
                                    return [3 /*break*/, 17];
                                case 12:
                                    _k.trys.push([12, , 15, 16]);
                                    if (!(!_b && !_g && (_h = _c.return))) return [3 /*break*/, 14];
                                    return [4 /*yield*/, _h.call(_c)];
                                case 13:
                                    _k.sent();
                                    _k.label = 14;
                                case 14: return [3 /*break*/, 16];
                                case 15:
                                    if (e_2) throw e_2.error;
                                    return [7 /*endfinally*/];
                                case 16: return [7 /*endfinally*/];
                                case 17:
                                    if (schema.flagEmptyDirectories && node.children.length === 0) {
                                        node.isIgnored = true;
                                        node.description = "⚠️ Boş Klasör Tespit Edildi";
                                    }
                                    else {
                                        node.children.sort(function (a, b) {
                                            if (a.kind === "directory" && b.kind !== "directory")
                                                return -1;
                                            if (a.kind !== "directory" && b.kind === "directory")
                                                return 1;
                                            return a.name.localeCompare(b.name, "tr");
                                        });
                                    }
                                    _k.label = 18;
                                case 18: return [2 /*return*/, node];
                            }
                        });
                    }); };
                    _a = setRootNode;
                    return [4 /*yield*/, scan_1(directoryHandle, "", 0)];
                case 2:
                    _a.apply(void 0, [_b.sent()]);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _b.sent();
                    console.error(e_1);
                    return [3 /*break*/, 5];
                case 4:
                    setIsScanning(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // App.tsx içindeki handleSelectDirectory fonksiyonunun altına ekleyin:
    var handleDroppedFolder = function (directoryEntry) { return __awaiter(_this, void 0, void 0, function () {
        var scanDropped_1, parsedTree, e_3;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setIsScanning(true);
                    scanDropped_1 = function (entry, currentPath, depth) { return __awaiter(_this, void 0, void 0, function () {
                        var check, nodeSizeStr, isIgnored, matchedRule, fileData, sizeInMB, _a, node, dirReader_1, entries, _i, entries_1, subEntry, _b, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    check = getDescription(entry.name);
                                    nodeSizeStr = "";
                                    isIgnored = check.isIgnored;
                                    matchedRule = check.desc;
                                    if (!entry.isFile) return [3 /*break*/, 4];
                                    _d.label = 1;
                                case 1:
                                    _d.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                                            return entry.file(resolve, reject);
                                        })];
                                case 2:
                                    fileData = _d.sent();
                                    sizeInMB = fileData.size / (1024 * 1024);
                                    nodeSizeStr =
                                        sizeInMB < 0.1
                                            ? "".concat((fileData.size / 1024).toFixed(1), " KB")
                                            : "".concat(sizeInMB.toFixed(2), " MB");
                                    if (sizeInMB > schema.maxFileSizeMB) {
                                        isIgnored = true;
                                        matchedRule = "Boyut S\u0131n\u0131r\u0131 \u0130hlali (> ".concat(schema.maxFileSizeMB, "MB)");
                                    }
                                    return [3 /*break*/, 4];
                                case 3:
                                    _a = _d.sent();
                                    return [3 /*break*/, 4];
                                case 4:
                                    node = {
                                        name: entry.name,
                                        path: "".concat(currentPath, "/").concat(entry.name),
                                        kind: entry.isDirectory ? "directory" : "file",
                                        depth: depth,
                                        isDirectory: entry.isDirectory,
                                        isIgnored: isIgnored,
                                        size: nodeSizeStr,
                                        description: matchedRule,
                                    };
                                    if (!(entry.isDirectory && !node.isIgnored)) return [3 /*break*/, 10];
                                    node.children = [];
                                    dirReader_1 = entry.createReader();
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            dirReader_1.readEntries(resolve);
                                        })];
                                case 5:
                                    entries = _d.sent();
                                    _i = 0, entries_1 = entries;
                                    _d.label = 6;
                                case 6:
                                    if (!(_i < entries_1.length)) return [3 /*break*/, 9];
                                    subEntry = entries_1[_i];
                                    _c = (_b = node.children).push;
                                    return [4 /*yield*/, scanDropped_1(subEntry, node.path, depth + 1)];
                                case 7:
                                    _c.apply(_b, [_d.sent()]);
                                    _d.label = 8;
                                case 8:
                                    _i++;
                                    return [3 /*break*/, 6];
                                case 9:
                                    if (schema.flagEmptyDirectories && node.children.length === 0) {
                                        node.isIgnored = true;
                                        node.description = "⚠️ Boş Klasör Tespit Edildi";
                                    }
                                    else {
                                        node.children.sort(function (a, b) {
                                            if (a.kind === "directory" && b.kind !== "directory")
                                                return -1;
                                            if (a.kind !== "directory" && b.kind === "directory")
                                                return 1;
                                            return a.name.localeCompare(b.name, "tr");
                                        });
                                    }
                                    _d.label = 10;
                                case 10: return [2 /*return*/, node];
                            }
                        });
                    }); };
                    return [4 /*yield*/, scanDropped_1(directoryEntry, "", 0)];
                case 1:
                    parsedTree = _a.sent();
                    setRootNode(parsedTree);
                    return [3 /*break*/, 4];
                case 2:
                    e_3 = _a.sent();
                    console.error("Sürükle bırak tarama hatası:", e_3);
                    return [3 /*break*/, 4];
                case 3:
                    setIsScanning(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        if (!rootNode)
            return;
        var md = "# Proje Yap\u0131 Analiz Raporu\n\n| Dosya / Klas\u00F6r Yolu | Tip | Boyut | Durum | A\u00E7\u0131klama |\n| :--- | :--- | :--- | :--- | :--- |\n";
        var generateRow = function (node) {
            var _a;
            md += "| `".concat(node.path, "` | ").concat(node.kind === "directory" ? "📂" : "📄", " | ").concat(node.size || "-", " | ").concat(node.isIgnored ? "❌" : "✅", " | ").concat(node.description || "-", " |\n");
            (_a = node.children) === null || _a === void 0 ? void 0 : _a.forEach(generateRow);
        };
        generateRow(rootNode);
        setMarkdownPreview(md);
    }, [rootNode, schema]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-theme-bg text-theme-text flex h-screen w-screen flex-col overflow-hidden transition-colors duration-200", children: [(0, jsx_runtime_1.jsxs)("header", { className: "border-theme-border bg-theme-surface/40 z-10 flex h-16 shrink-0 items-center justify-between border-b px-6 shadow-xs backdrop-blur-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: "text-theme-primary animate-pulse", size: 24 }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-theme-text text-sm font-bold tracking-wide", children: "Monorepo File Analyzer" }), (0, jsx_runtime_1.jsx)("p", { className: "text-theme-muted text-[10px] font-medium", children: "Geli\u015Fmi\u015F Kural Filtre Paneli" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)(theme_selector_1.ThemeSelector, {}), (0, jsx_runtime_1.jsxs)("button", { onClick: handleSelectDirectory, disabled: isScanning, className: "btn-primary cursor-pointer gap-2 shadow-sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 14, className: isScanning ? "animate-spin" : "" }), isScanning
                                        ? "Klasör Yapısı Taranıyor..."
                                        : "Klasör Seç ve Analiz Et"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-0 flex-1 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "border-theme-border bg-theme-surface/20 w-80 shrink-0 space-y-6 overflow-y-auto border-r p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border bg-theme-surface/60 space-y-4 rounded-xl border p-4 shadow-2xs", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-theme-primary flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase", children: [(0, jsx_runtime_1.jsx)("span", { children: "\uD83D\uDCE6" }), " Ak\u0131ll\u0131 Analiz Ayarlar\u0131"] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-theme-muted block text-[11px] font-semibold", children: "Maksimum Dosya Boyutu:" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "number", value: schema.maxFileSizeMB, onChange: function (e) {
                                                            var val = Math.max(1, parseInt(e.target.value) || 1);
                                                            setSchema(__assign(__assign({}, schema), { maxFileSizeMB: val }));
                                                            if (rootNode)
                                                                setRootNode(__assign({}, rootNode));
                                                        }, className: "input-base w-20! px-2! py-1! text-center font-mono text-xs" }), (0, jsx_runtime_1.jsx)("span", { className: "text-theme-muted text-[11px] font-medium", children: "MB \u00FCst\u00FCn\u00FC yoksay" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border/60 flex items-center justify-between border-t pt-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-theme-text text-xs font-medium", children: "Bo\u015F Klas\u00F6rleri \u0130\u015Faretle" }), (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: schema.flagEmptyDirectories, onChange: function (e) {
                                                    setSchema(__assign(__assign({}, schema), { flagEmptyDirectories: e.target.checked }));
                                                    if (rootNode)
                                                        setRootNode(__assign({}, rootNode));
                                                }, className: "border-theme-border bg-theme-bg text-theme-primary h-4 w-4 cursor-pointer rounded-sm focus:ring-0" })] })] }), (0, jsx_runtime_1.jsxs)("h2", { className: "border-theme-border/60 text-theme-muted flex items-center gap-2 border-b pb-3 text-xs font-bold tracking-wider uppercase", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 15, className: "text-theme-primary" }), " Canl\u0131 \u015Eema Kurallar\u0131"] })] }), (0, jsx_runtime_1.jsxs)("main", { className: "flex flex-1 flex-col overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "border-theme-border bg-theme-surface/10 flex h-12 shrink-0 items-center justify-between border-b px-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex h-full gap-6", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: function () { return setActiveTab("tree"); }, className: "flex h-full cursor-pointer items-center gap-1.5 border-b-2 px-1 text-xs font-bold tracking-wider uppercase transition-all ".concat(activeTab === "tree"
                                                ? "border-theme-primary text-theme-primary"
                                                : "text-theme-muted hover:text-theme-text border-transparent"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 14 }), " A\u011Fa\u00E7 G\u00F6r\u00FCn\u00FCm\u00FC"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: function () { return setActiveTab("markdown"); }, className: "flex h-full cursor-pointer items-center gap-1.5 border-b-2 px-1 text-xs font-bold tracking-wider uppercase transition-all ".concat(activeTab === "markdown"
                                                ? "border-theme-primary text-theme-primary"
                                                : "text-theme-muted hover:text-theme-text border-transparent"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Code, { size: 14 }), " Markdown Raporu"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: function () { return setActiveTab("patterns"); }, className: "flex h-full cursor-pointer items-center gap-1.5 border-b-2 px-1 text-xs font-bold tracking-wider uppercase transition-all ".concat(activeTab === "patterns"
                                                ? "border-theme-primary text-theme-primary"
                                                : "text-theme-muted hover:text-theme-text border-transparent"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { size: 14 }), " Kurallar\u0131 Y\u00F6net"] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-theme-bg min-h-0 flex-1 overflow-auto p-6", children: !rootNode ? ((0, jsx_runtime_1.jsx)("div", { className: "mx-auto mt-12 max-w-2xl", children: (0, jsx_runtime_1.jsx)(folder_dropzone_1.FolderDropZone, { isScanning: isScanning, onSelectClick: handleSelectDirectory, onFolderDrop: handleDroppedFolder }) })) : activeTab === "tree" ? ((0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border bg-theme-surface/20 max-w-5xl rounded-2xl border p-5 shadow-2xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border/60 text-theme-muted mb-4 border-b pb-2 text-[11px] font-bold tracking-wider uppercase", children: ["K\u00F6k Dizin:", " ", (0, jsx_runtime_1.jsx)("span", { className: "text-theme-primary font-mono lowercase", children: rootNode.name })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border bg-theme-bg h-137.5 overflow-y-auto scroll-smooth rounded-xl border p-4 focus:outline-hidden", style: {
                                                scrollbarWidth: "thin",
                                                scrollbarColor: "var(--color-theme-border) transparent",
                                            }, children: [(0, jsx_runtime_1.jsx)("div", { className: "text-theme-muted border-theme-border/30 mb-4 border-b pb-1 text-xs font-bold tracking-wider uppercase", children: "Proje Klas\u00F6r Yap\u0131s\u0131" }), (0, jsx_runtime_1.jsx)(fileTree_1.FileTree, { items: [rootNode], copyPath: copyPath, getFileColor: getFileColor })] })] })) : activeTab === "patterns" ? ((0, jsx_runtime_1.jsx)("div", { className: "border-theme-border bg-theme-surface/20 max-w-5xl rounded-2xl border p-5 shadow-2xs", children: (0, jsx_runtime_1.jsx)(file_info_manager_1.DescPatternManager, {}) })) : ((0, jsx_runtime_1.jsx)("div", { className: "border-theme-border bg-theme-surface/30 text-theme-text max-w-5xl overflow-x-auto rounded-2xl border p-5 font-mono text-xs leading-relaxed shadow-2xs", children: (0, jsx_runtime_1.jsx)(mdedit_1.ProjectReport, { rootNode: rootNode }) })) })] })] })] }));
}
