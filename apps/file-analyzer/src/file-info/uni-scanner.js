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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalFileScanner = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var file_info_dataprovider_1 = require("./file-info-dataprovider");
var UniversalFileScanner = function () {
    var _a = (0, file_info_dataprovider_1.usePatterns)(), patterns = _a.patterns, setScannedTree = _a.setScannedTree;
    var _b = (0, react_1.useState)(false), isDragging = _b[0], setIsDragging = _b[1];
    var _c = (0, react_1.useState)({
        type: "idle",
        message: "Klasör sürükleyin veya bilgisayarınızdan seçin",
    }), scanStatus = _c[0], setScanStatus = _c[1];
    var fileInputRef = (0, react_1.useRef)(null);
    var evaluateFiltering = (0, react_1.useCallback)(function (name, path) {
        var activeRules = patterns.filter(function (p) { return p.checked; });
        if (activeRules.length === 0)
            return false;
        return activeRules.some(function (rule) {
            if (!rule.regExp)
                return false;
            if (rule.extension) {
                return name.toLowerCase().endsWith(rule.expression.toLowerCase());
            }
            return rule.regExp.test(name) || rule.regExp.test(path);
        });
    }, [patterns]);
    var parseEntry = function (entry_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([entry_1], args_1, true), void 0, function (entry, relativePath) {
            var currentPath, isFiltered, dirReader_1, readAllEntries, entries, childrenNodes, _a, entries_1, childEntry, childNode;
            if (relativePath === void 0) { relativePath = ""; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        currentPath = relativePath
                            ? "".concat(relativePath, "/").concat(entry.name)
                            : entry.name;
                        isFiltered = evaluateFiltering(entry.name, currentPath);
                        if (!entry.isFile) return [3 /*break*/, 1];
                        return [2 /*return*/, {
                                name: entry.name,
                                path: currentPath,
                                isDirectory: false,
                                filtered: isFiltered,
                            }];
                    case 1:
                        if (!entry.isDirectory) return [3 /*break*/, 7];
                        dirReader_1 = entry.createReader();
                        readAllEntries = function () { return __awaiter(void 0, void 0, void 0, function () {
                            var allEntries, readEntries;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        allEntries = [];
                                        readEntries = function () { return __awaiter(void 0, void 0, void 0, function () {
                                            var entries;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                                                            return dirReader_1.readEntries(resolve, reject);
                                                        })];
                                                    case 1:
                                                        entries = _a.sent();
                                                        if (!(entries.length > 0)) return [3 /*break*/, 3];
                                                        allEntries = allEntries.concat(entries);
                                                        return [4 /*yield*/, readEntries()];
                                                    case 2:
                                                        _a.sent();
                                                        _a.label = 3;
                                                    case 3: return [2 /*return*/];
                                                }
                                            });
                                        }); };
                                        return [4 /*yield*/, readEntries()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, allEntries];
                                }
                            });
                        }); };
                        return [4 /*yield*/, readAllEntries()];
                    case 2:
                        entries = _b.sent();
                        childrenNodes = [];
                        _a = 0, entries_1 = entries;
                        _b.label = 3;
                    case 3:
                        if (!(_a < entries_1.length)) return [3 /*break*/, 6];
                        childEntry = entries_1[_a];
                        return [4 /*yield*/, parseEntry(childEntry, currentPath)];
                    case 4:
                        childNode = _b.sent();
                        if (childNode)
                            childrenNodes.push(childNode);
                        _b.label = 5;
                    case 5:
                        _a++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, {
                            name: entry.name,
                            path: currentPath,
                            isDirectory: true,
                            children: childrenNodes,
                            filtered: isFiltered,
                        }];
                    case 7: return [2 /*return*/, null];
                }
            });
        });
    };
    var handleDragOver = function (e) {
        e.preventDefault();
        setIsDragging(true);
    };
    var handleDragLeave = function () {
        setIsDragging(false);
    };
    // 🚀 SENKRON DÖNGÜ GÜVENLİKLİ DROP HANDLER
    var handleDrop = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var items, i, item, entry, rootNode, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setIsDragging(false);
                    items = e.dataTransfer.items;
                    if (!items || items.length === 0)
                        return [2 /*return*/];
                    setScanStatus({
                        type: "loading",
                        message: "Klasör mimarisi asenkron taranıyor...",
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < items.length)) return [3 /*break*/, 5];
                    item = items[i];
                    if (!(typeof item.webkitGetAsEntry === "function")) return [3 /*break*/, 4];
                    entry = item.webkitGetAsEntry();
                    if (!entry) return [3 /*break*/, 4];
                    return [4 /*yield*/, parseEntry(entry)];
                case 3:
                    rootNode = _a.sent();
                    if (rootNode) {
                        setScanStatus({
                            type: "success",
                            message: "Tarama tamamland\u0131: ".concat(rootNode.name),
                        });
                        setScannedTree(rootNode); // Bellekte kalması için Provider'a basılıyor
                        return [2 /*return*/]; // İlk geçerli klasör/dosya ağacını aldığımızda asenkron hattı bitiriyoruz
                    }
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: throw new Error("Sürüklenen veri kümesinden geçerli bir hiyerarşi çözümlenemedi.");
                case 6:
                    error_1 = _a.sent();
                    console.error("Tarama Hatası Detayı:", error_1);
                    setScanStatus({
                        type: "error",
                        message: "Tarama hatas\u0131: ".concat(error_1.message || error_1),
                    });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleNativeSelect = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var files, rootNode, i, file, pathParts, currentLevel, cumulativePath, _loop_1, j;
        return __generator(this, function (_a) {
            files = e.target.files;
            if (!files || files.length === 0)
                return [2 /*return*/];
            setScanStatus({
                type: "loading",
                message: "Seçilen dosyalar hiyerarşiye map ediliyor...",
            });
            try {
                rootNode = {
                    name: "Root",
                    path: "",
                    isDirectory: true,
                    children: [],
                };
                for (i = 0; i < files.length; i++) {
                    file = files[i];
                    pathParts = file.webkitRelativePath.split("/");
                    if (i === 0 && pathParts.length > 0) {
                        rootNode.name = pathParts[0];
                    }
                    currentLevel = rootNode;
                    cumulativePath = rootNode.name;
                    _loop_1 = function (j) {
                        var part = pathParts[j];
                        cumulativePath += "/".concat(part);
                        var isLast = j === pathParts.length - 1;
                        if (!currentLevel.children)
                            currentLevel.children = [];
                        var existingNode = currentLevel.children.find(function (c) { return c.name === part; });
                        if (!existingNode) {
                            var isFiltered = evaluateFiltering(part, cumulativePath);
                            var newNode = __assign({ name: part, path: cumulativePath, isDirectory: !isLast, filtered: isFiltered }, (isLast ? {} : { children: [] }));
                            currentLevel.children.push(newNode);
                            existingNode = newNode;
                        }
                        currentLevel = existingNode;
                    };
                    for (j = 1; j < pathParts.length; j++) {
                        _loop_1(j);
                    }
                }
                setScanStatus({
                    type: "success",
                    message: "Se\u00E7im ba\u015Far\u0131yla haritaland\u0131: ".concat(rootNode.name),
                });
                setScannedTree(rootNode);
            }
            catch (error) {
                setScanStatus({
                    type: "error",
                    message: "Dosya y\u00FCkleme hatas\u0131: ".concat(error.message || error),
                });
            }
            return [2 /*return*/];
        });
    }); };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full space-y-3", children: [(0, jsx_runtime_1.jsx)("input", __assign({ type: "file", ref: fileInputRef, onChange: handleNativeSelect, className: "hidden" }, { webkitdirectory: "", directory: "", multiple: true })), (0, jsx_runtime_1.jsxs)("div", { onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, onClick: function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, className: "bg-theme-surface/20 border-theme-border flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ".concat(isDragging
                    ? "border-indigo-500 bg-indigo-500/5 shadow-inner"
                    : "hover:bg-theme-surface/40"), children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-3 rounded-full bg-indigo-600/10 p-3 text-indigo-500", children: (0, jsx_runtime_1.jsx)(lucide_react_1.UploadCloud, { size: 24, className: isDragging ? "animate-bounce" : "" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-theme-text text-sm font-semibold", children: scanStatus.type === "loading"
                                    ? "Sistem Taranıyor..."
                                    : "Evrensel Tarama Alanı" }), (0, jsx_runtime_1.jsx)("p", { className: "text-theme-muted text-xs", children: scanStatus.message })] }), scanStatus.type === "idle" && ((0, jsx_runtime_1.jsx)("p", { className: "text-theme-muted/60 mt-2 max-w-xs text-[10px] leading-relaxed", children: "* Taray\u0131c\u0131n\u0131z\u0131n g\u00F6sterece\u011Fi \"Y\u00FCkle/Upload\" onay\u0131 g\u00FCvenlik ama\u00E7l\u0131d\u0131r. Dosyalar\u0131n\u0131z uzak bir sunucuya g\u00F6nderilmez, tamamen yerelde (Local RAM) analiz edilir." })), scanStatus.type !== "idle" && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-4 flex items-center space-x-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ".concat(scanStatus.type === "loading"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : scanStatus.type === "success"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : "border-red-500/20 bg-red-500/10 text-red-400"), children: [scanStatus.type === "loading" && ((0, jsx_runtime_1.jsx)("span", { className: "h-2 w-2 animate-ping rounded-full bg-amber-400" })), scanStatus.type === "success" && (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 12 }), (0, jsx_runtime_1.jsx)("span", { className: "capitalize", children: scanStatus.type })] }))] })] }));
};
exports.UniversalFileScanner = UniversalFileScanner;
