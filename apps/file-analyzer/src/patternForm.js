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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewPatternForm = exports.PatternForm = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var PatternForm = function (_a) {
    var onAdd = _a.onAdd;
    var _b = (0, react_1.useState)(""), expr = _b[0], setExpr = _b[1];
    var _c = (0, react_1.useState)(""), grp = _c[0], setGrp = _c[1];
    var _d = (0, react_1.useState)(""), desc = _d[0], setDesc = _d[1];
    var _e = (0, react_1.useState)(false), ignore = _e[0], setIgnore = _e[1];
    var _f = (0, react_1.useState)(false), isExt = _f[0], setIsExt = _f[1];
    var handleSubmit = function (e) {
        e.preventDefault();
        if (!expr.trim())
            return;
        var success = onAdd({
            expression: expr.trim(),
            ignore: ignore,
            description: desc.trim(),
            group: grp.trim(),
            extension: isExt,
        });
        if (success) {
            setExpr("");
            setGrp("");
            setDesc("");
            setIgnore(false);
            setIsExt(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "bg-theme-surface/50 border-theme-border/60 grid grid-cols-1 gap-4 rounded-xl border p-5 shadow-xs md:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "md:col-span-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-theme-muted mb-1 block text-[10px] font-bold tracking-wider uppercase", children: "Expression (expr) *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: expr, onChange: function (e) { return setExpr(e.target.value); }, placeholder: "^src/components/.*", className: "input-base font-mono" /* @utility input-base kullanıldı */ })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-theme-muted mb-1 block text-[10px] font-bold tracking-wider uppercase", children: "Group (grp)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: grp, onChange: function (e) { return setGrp(e.target.value); }, placeholder: "UI", className: "input-base" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "md:col-span-3", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-theme-muted mb-1 block text-[10px] font-bold tracking-wider uppercase", children: "Description (desc)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: desc, onChange: function (e) { return setDesc(e.target.value); }, placeholder: "A\u00E7\u0131klama yaz\u0131n...", className: "input-base" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-6 pt-2", children: [(0, jsx_runtime_1.jsxs)("label", { className: "text-theme-text flex cursor-pointer items-center space-x-2 text-sm select-none", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: ignore, onChange: function (e) { return setIgnore(e.target.checked); }, className: "border-theme-border bg-theme-bg text-theme-primary h-4 w-4 cursor-pointer rounded-sm focus:ring-0" }), (0, jsx_runtime_1.jsx)("span", { children: "Ignore" })] }), (0, jsx_runtime_1.jsxs)("label", { className: "text-theme-text flex cursor-pointer items-center space-x-2 text-sm select-none", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isExt, onChange: function (e) { return setIsExt(e.target.checked); }, className: "border-theme-border bg-theme-bg text-theme-primary h-4 w-4 cursor-pointer rounded-sm focus:ring-0" }), (0, jsx_runtime_1.jsx)("span", { children: "isExt" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-end justify-end md:col-span-2", children: (0, jsx_runtime_1.jsxs)("button", { type: "submit", className: "btn-primary w-full cursor-pointer md:w-auto", children: [" ", (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { children: "Listeye Ekle" })] }) })] }));
};
exports.PatternForm = PatternForm;
var NewPatternForm = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onSave = _a.onSave;
    // Yeni ekleme için boş bir taslak state'i oluşturuyoruz
    var _b = (0, react_1.useState)({
        expression: "",
        description: "",
        ignore: false,
        extension: false,
        group: "",
    }), newData = _b[0], setNewData = _b[1];
    // Daha önce yazdığımız sıfır parametreli fonksiyonun aynısı (sadece setNewData'yı güncelliyor)
    var handleInputChange = function (e) {
        var _a = e.target, name = _a.name, type = _a.type;
        var key = name;
        var value = type === "checkbox"
            ? e.target.checked
            : e.target.value;
        setNewData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    };
    var handleSubmit = function (e) {
        e.preventDefault();
        if (!newData.expression.trim())
            return alert("İfade (Expression) alanı boş bırakılamaz.");
        onSave(newData);
        // Kayıt sonrası formu sıfırlayıp kapatıyoruz
        setNewData({
            expression: "",
            description: "",
            ignore: false,
            extension: false,
            group: "",
        });
        onClose();
    };
    // Eğer form kapalıysa ekrana hiçbir şey basmıyoruz
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "animate-fadeIn mb-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-sm transition-all", children: [(0, jsx_runtime_1.jsx)("h3", { className: "mb-3 text-sm font-semibold text-gray-800", children: "Yeni Kural Olu\u015Ftur" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 items-end gap-4 md:grid-cols-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1 block text-xs font-medium text-gray-500", children: "\u0130fade (Expression)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", name: "expression", placeholder: "src/**/*.ts", value: newData.expression, onChange: handleInputChange, className: "w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1 block text-xs font-medium text-gray-500", children: "Grup" }), (0, jsx_runtime_1.jsx)("input", { type: "text", name: "group", placeholder: "Frontend", value: newData.group, onChange: handleInputChange, className: "w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "h-38px flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "flex cursor-pointer items-center space-x-2 text-sm font-medium text-gray-600 select-none", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", name: "ignore", checked: newData.ignore, onChange: handleInputChange, className: "rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" }), (0, jsx_runtime_1.jsx)("span", { children: "Yoksay" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onClose, className: "cursor-pointer rounded px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200", children: "\u0130ptal" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "cursor-pointer rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500", children: "Ekle" })] })] })] })] }));
};
exports.NewPatternForm = NewPatternForm;
