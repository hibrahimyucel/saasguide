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
exports.PatternTable = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var edit_cell_1 = require("./components/edit-cell");
var patternForm_1 = require("./patternForm");
var PatternTable = function (_a) {
    var patterns = _a.patterns, onDelete = _a.onDelete, onUpdate = _a.onUpdate, onAdd = _a.onAdd;
    var _b = (0, react_1.useState)(null), editingExpression = _b[0], setEditingExpression = _b[1];
    var _c = (0, react_1.useState)(null), editData = _c[0], setEditData = _c[1];
    // 1. 🚀 Arama için çift katmanlı state yapısı
    var _d = (0, react_1.useState)(""), searchTerm = _d[0], setSearchTerm = _d[1];
    var _e = (0, react_1.useState)(""), debouncedSearchTerm = _e[0], setDebouncedSearchTerm = _e[1];
    var _f = (0, react_1.useState)("all"), activeFilter = _f[0], setActiveFilter = _f[1];
    var _g = (0, react_1.useState)(false), isNewFormOpen = _g[0], setIsNewFormOpen = _g[1];
    var handleAddNewPattern = function (newData) {
        var kind = "1-regular";
        if (newData.extension)
            kind = "3-ext";
        var completePattern = __assign(__assign({}, newData), { kind: kind });
        var isSuccess = onAdd(completePattern);
        if (isSuccess) {
            setIsNewFormOpen(false);
        }
    };
    // 3. 🚀 Optimizasyon Hattı: Artık 'searchTerm' yerine 'debouncedSearchTerm' dinleniyor
    var processedPatterns = (0, react_1.useMemo)(function () {
        var filtered = patterns.filter(function (p) {
            if (activeFilter === "ignore" && !p.ignore)
                return false;
            if (activeFilter === "extension" && !p.extension)
                return false;
            var searchLower = debouncedSearchTerm.toLowerCase();
            return (p.expression.toLowerCase().includes(searchLower) ||
                (p.description && p.description.toLowerCase().includes(searchLower)) ||
                (p.group && p.group.toLowerCase().includes(searchLower)));
        });
        return __spreadArray([], filtered, true).sort(function (a, b) {
            var kindCompare = (a.kind || "").localeCompare(b.kind || "");
            if (kindCompare !== 0)
                return kindCompare;
            return (a.expression || "").localeCompare(b.expression);
        });
    }, [patterns, debouncedSearchTerm, activeFilter]); // debouncedSearchTerm değiştiğinde hat baştan hesaplanır
    var startEdit = function (p) {
        setEditingExpression(p.expression);
        setEditData(__assign({}, p));
    };
    var handleCancel = function () {
        setEditingExpression(null);
        setEditData(null);
    };
    var handleSave = function () {
        if (!editData)
            return;
        onUpdate(editData);
        setEditingExpression(null);
        setEditData(null);
    };
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
    // 2. 🚀 Debounce Mekanizması: Kullanıcı yazmayı bıraktıktan 250ms sonra tetiklenir
    (0, react_1.useEffect)(function () {
        var handler = setTimeout(function () {
            setDebouncedSearchTerm(searchTerm);
        }, 250);
        // Temizleme fonksiyonu: Kullanıcı yazmaya devam ederse önceki zamanlayıcıyı iptal eder
        return function () {
            clearTimeout(handler);
        };
    }, [searchTerm]);
    var SearchBar = function () {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "border-theme-border/60 flex shrink-0 items-center justify-between border-b pb-3", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-theme-muted text-xs font-bold tracking-wider whitespace-nowrap uppercase", children: "Desen Kurallar\u0131 Y\u00F6netimi" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative ml-4 w-full max-w-md", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Expression, grup veya a\u00E7\u0131klama ara...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "w-full rounded border border-gray-300 py-1.5 pr-10 pl-3 text-xs focus:border-indigo-500 focus:outline-none" }), searchTerm && ((0, jsx_runtime_1.jsx)("button", { onClick: function () { return setSearchTerm(""); }, className: "absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-xs font-semibold text-gray-400 hover:text-gray-600", children: "Temizle" }))] })] }));
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "text-theme-text bg-theme-surface/30 border-theme-border flex flex-col space-y-4 overflow-hidden rounded-xl border p-4 shadow-xs", children: [(0, jsx_runtime_1.jsx)(SearchBar, {}), (0, jsx_runtime_1.jsxs)("div", { className: "mb-1 flex shrink-0 flex-wrap gap-2", children: [[
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
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"), children: [tab.label, " ", (0, jsx_runtime_1.jsx)("span", { className: "ml-1 rounded-full px-1.5 py-0.5 text-[10px] ".concat(activeFilter === tab.id ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500"), children: tab.count })] }, tab.id)); }), !isNewFormOpen && ((0, jsx_runtime_1.jsx)("button", { onClick: function () { return setIsNewFormOpen(true); }, className: "flex cursor-pointer items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500", children: (0, jsx_runtime_1.jsx)("span", { children: "+ Yeni Kural Ekle" }) })), (0, jsx_runtime_1.jsx)(patternForm_1.NewPatternForm, { isOpen: isNewFormOpen, onClose: function () { return setIsNewFormOpen(false); }, onSave: handleAddNewPattern })] }), (0, jsx_runtime_1.jsx)("div", { className: "border-theme-border/30 custom-scrollbar max-h-[65vh] overflow-x-auto overflow-y-auto rounded-lg border", children: (0, jsx_runtime_1.jsxs)("table", { className: "divide-theme-border/40 text-theme-text min-w-full table-fixed divide-y text-left text-xs", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-theme-surface text-theme-muted sticky top-0 z-10 font-bold tracking-wider uppercase shadow-2xs", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/4 px-5 py-3", children: "expression (expression)" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/6 px-5 py-3", children: "Group (group)" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/3 px-5 py-3", children: "description (description)" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/12 px-5 py-3 text-center", children: "Ignore" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/12 px-5 py-3 text-center", children: "isExt" }), (0, jsx_runtime_1.jsx)("th", { className: "bg-theme-surface w-1/6 px-5 py-3 text-right", children: "Aksiyonlar" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-theme-border/30 bg-theme-surface/5 divide-y", children: processedPatterns.length > 0 ? (processedPatterns.map(function (p) {
                                var isEditing = editingExpression === p.expression;
                                return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-theme-surface/50 transition-colors duration-150", children: [(0, jsx_runtime_1.jsx)("td", { className: "text-theme-primary px-5 py-2 font-mono font-medium break-all", children: p.expression }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-left", children: (0, jsx_runtime_1.jsx)(edit_cell_1.EditableCell, { isEditing: isEditing, type: "text", name: "group", editValue: editData === null || editData === void 0 ? void 0 : editData.group, normalValue: p.group, onChange: handleInputChange }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-left", children: (0, jsx_runtime_1.jsx)(edit_cell_1.EditableCell, { isEditing: isEditing, type: "text", name: "description", editValue: editData === null || editData === void 0 ? void 0 : editData.description, normalValue: p.description, onChange: handleInputChange }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-center", children: (0, jsx_runtime_1.jsx)(edit_cell_1.EditableCell, { isEditing: isEditing, type: "checkbox", name: "ignore", editValue: editData === null || editData === void 0 ? void 0 : editData.ignore, normalValue: p.ignore, onChange: handleInputChange }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-center", children: (0, jsx_runtime_1.jsx)(edit_cell_1.EditableCell, { isEditing: isEditing, type: "checkbox", name: "extension", editValue: editData === null || editData === void 0 ? void 0 : editData.extension, normalValue: p.extension, onChange: handleInputChange }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-2 text-right font-medium", children: (0, jsx_runtime_1.jsx)(edit_cell_1.ActionCell, { isEditing: isEditing, onSave: handleSave, onCancel: handleCancel, onStartEdit: function () { return startEdit(p); }, onDelete: function () { return onDelete(p.expression); } }) })] }, p.expression));
                            })) : ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, className: "text-theme-muted px-5 py-8 text-center text-sm", children: "Arama kriterlerine uygun kural bulunamad\u0131." }) })) })] }) })] }));
};
exports.PatternTable = PatternTable;
