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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileInfoManager = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var edit_cell_1 = require("../components/edit-cell");
var patternForm_1 = require("../patternForm");
var file_info_dataprovider_1 = require("./file-info-dataprovider");
var FileInfoManager = function () {
    var _a = (0, file_info_dataprovider_1.usePatterns)(), patterns = _a.patterns, addPattern = _a.addPattern, updatePattern = _a.updatePattern, removePattern = _a.removePattern, exportToJSON = _a.exportToJSON, importFromJSON = _a.importFromJSON;
    var fileInputRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(null), editingExpression = _b[0], setEditingExpression = _b[1];
    var _c = (0, react_1.useState)(null), editData = _c[0], setEditData = _c[1];
    var _d = (0, react_1.useState)(""), searchTerm = _d[0], setSearchTerm = _d[1];
    var _e = (0, react_1.useState)(""), debouncedSearchTerm = _e[0], setDebouncedSearchTerm = _e[1];
    var _f = (0, react_1.useState)("all"), activeFilter = _f[0], setActiveFilter = _f[1];
    var _g = (0, react_1.useState)(false), isNewFormOpen = _g[0], setIsNewFormOpen = _g[1];
    (0, react_1.useEffect)(function () {
        var handler = setTimeout(function () {
            setDebouncedSearchTerm(searchTerm);
        }, 250);
        return function () { return clearTimeout(handler); };
    }, [searchTerm]);
    var processedPatterns = (0, react_1.useMemo)(function () {
        return patterns.filter(function (p) {
            if (activeFilter === "ignore" && !p.ignore)
                return false;
            if (activeFilter === "extension" && !p.extension)
                return false;
            var searchLower = debouncedSearchTerm.toLowerCase();
            return (p.expression.toLowerCase().includes(searchLower) ||
                (p.description && p.description.toLowerCase().includes(searchLower)) ||
                (p.group && p.group.toLowerCase().includes(searchLower)));
        });
    }, [patterns, debouncedSearchTerm, activeFilter]);
    var handleAdd = function (newData) {
        var isSuccess = addPattern(newData);
        if (isSuccess) {
            setIsNewFormOpen(false);
        }
        return isSuccess;
    };
    var handleImportFile = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var file;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                    if (!file)
                        return [2 /*return*/];
                    return [4 /*yield*/, importFromJSON(file)];
                case 1:
                    _b.sent();
                    if (fileInputRef.current)
                        fileInputRef.current.value = "";
                    return [2 /*return*/];
            }
        });
    }); };
    var handleInputChange = function (e) {
        var _a = e.target, name = _a.name, type = _a.type;
        var key = name;
        var value = type === "checkbox"
            ? e.target.checked
            : e.target.value;
        setEditData(function (d) {
            var _a;
            return (d ? __assign(__assign({}, d), (_a = {}, _a[key] = value, _a)) : null);
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "text-theme-text bg-theme-surface/30 border-theme-border flex flex-col space-y-4 overflow-hidden rounded-xl border p-4 shadow-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border/60 flex shrink-0 items-center justify-between border-b pb-3", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-theme-muted text-xs font-bold tracking-wider whitespace-nowrap uppercase", children: "Desen Kurallar\u0131 Y\u00F6netimi" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative ml-4 w-full max-w-md", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Expression, grup veya a\u00E7\u0131klama ara...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "bg-theme-surface w-full rounded border border-gray-300 py-1.5 pr-10 pl-3 text-xs focus:border-indigo-500 focus:outline-none" }), searchTerm && ((0, jsx_runtime_1.jsx)("button", { onClick: function () { return setSearchTerm(""); }, className: "absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-xs font-semibold text-gray-400 hover:text-gray-600", children: "Temizle" }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-1 flex shrink-0 flex-wrap items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1.5", children: [
                            { id: "all", label: "Hepsi", count: patterns.length },
                            {
                                id: "ignore",
                                label: "Yoksayılanlar",
                                count: patterns.filter(function (p) { return p.ignore; }).length,
                            },
                            {
                                id: "extension",
                                label: "Uzantılar",
                                count: patterns.filter(function (p) { return p.extension; }).length,
                            },
                        ].map(function (tab) { return ((0, jsx_runtime_1.jsxs)("button", { onClick: function () { return setActiveFilter(tab.id); }, className: "cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-all ".concat(activeFilter === tab.id
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"), children: [tab.label, " ", (0, jsx_runtime_1.jsx)("span", { className: "ml-1 rounded-full px-1.5 py-0.5 text-[10px] ".concat(activeFilter === tab.id ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500"), children: tab.count })] }, tab.id)); }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: exportToJSON, className: "bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border flex cursor-pointer items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors duration-150", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 13 }), (0, jsx_runtime_1.jsx)("span", { children: "JSON \u0130ndir" })] }), (0, jsx_runtime_1.jsx)("input", { type: "file", accept: ".json", ref: fileInputRef, onChange: handleImportFile, className: "hidden" }), (0, jsx_runtime_1.jsxs)("button", { onClick: function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, className: "bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border flex cursor-pointer items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors duration-150", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { size: 13 }), (0, jsx_runtime_1.jsx)("span", { children: "JSON Y\u00FCkle" })] }), !isNewFormOpen && ((0, jsx_runtime_1.jsx)("button", { onClick: function () { return setIsNewFormOpen(true); }, className: "flex cursor-pointer items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500", children: (0, jsx_runtime_1.jsx)("span", { children: "+ Yeni Kural Ekle" }) }))] }), (0, jsx_runtime_1.jsx)(patternForm_1.NewPatternForm, { isOpen: isNewFormOpen, onClose: function () { return setIsNewFormOpen(false); }, onSave: handleAdd })] }), (0, jsx_runtime_1.jsx)("div", { className: "border-theme-border/30 custom-scrollbar max-h-[65vh] overflow-x-auto overflow-y-auto rounded-lg border", children: (0, jsx_runtime_1.jsxs)("table", { className: "divide-theme-border/40 text-theme-text min-w-full table-fixed divide-y text-left text-xs", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-theme-surface text-theme-muted sticky top-0 z-10 font-bold tracking-wider uppercase shadow-2xs", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/4 px-5 py-3", children: "expression" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/6 px-5 py-3", children: "Group" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/3 px-5 py-3", children: "description" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/12 px-5 py-3 text-center", children: "Ignore" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/12 px-5 py-3 text-center", children: "isExt" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/6 px-5 py-3 text-right", children: "Aksiyonlar" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-theme-border/30 bg-theme-surface/5 divide-y", children: processedPatterns.length > 0 ? (processedPatterns.map(function (p) {
                                var isEditing = editingExpression === p.expression;
                                return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-theme-surface/50 transition-colors duration-150", children: [(0, jsx_runtime_1.jsx)("td", { className: "text-theme-primary px-5 py-2 font-mono font-medium break-all", children: p.expression }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-left", children: (0, jsx_runtime_1.jsx)(edit_cell_1.EditableCell, { isEditing: isEditing, type: "text", name: "group", editValue: editData === null || editData === void 0 ? void 0 : editData.group, normalValue: p.group, onChange: handleInputChange }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-left", children: (0, jsx_runtime_1.jsx)(edit_cell_1.EditableCell, { isEditing: isEditing, type: "text", name: "description", editValue: editData === null || editData === void 0 ? void 0 : editData.description, normalValue: p.description, onChange: handleInputChange }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-center", children: (0, jsx_runtime_1.jsx)(edit_cell_1.EditableCell, { isEditing: isEditing, type: "checkbox", name: "ignore", editValue: editData === null || editData === void 0 ? void 0 : editData.ignore, normalValue: p.ignore, onChange: handleInputChange }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-center", children: (0, jsx_runtime_1.jsx)(edit_cell_1.EditableCell, { isEditing: isEditing, type: "checkbox", name: "extension", editValue: editData === null || editData === void 0 ? void 0 : editData.extension, normalValue: p.extension, onChange: handleInputChange }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-right font-medium", children: (0, jsx_runtime_1.jsx)(edit_cell_1.ActionCell, { isEditing: isEditing, onSave: function () {
                                                    if (editData) {
                                                        updatePattern(editData);
                                                        setEditingExpression(null);
                                                    }
                                                }, onCancel: function () {
                                                    setEditingExpression(null);
                                                }, onStartEdit: function () {
                                                    setEditingExpression(p.expression);
                                                    setEditData(__assign({}, p));
                                                }, onDelete: function () { return removePattern(p.expression); } }) })] }, p.expression));
                            })) : ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, className: "text-theme-muted px-5 py-8 text-center text-sm", children: "Arama kriterlerine uygun kural bulunamad\u0131." }) })) })] }) })] }));
};
exports.FileInfoManager = FileInfoManager;
