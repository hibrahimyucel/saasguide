"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionCell = exports.EditableCell = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var lucide_react_1 = require("lucide-react");
// Alt Modül 1: Düzenleme Modundaki Form Elementleri (SRP'ye uygun şekilde ayrıştırıldı)
var CellInput = function (_a) {
    var type = _a.type, name = _a.name, value = _a.value, onChange = _a.onChange, options = _a.options;
    if (type === "checkbox") {
        return ((0, jsx_runtime_1.jsx)("input", { type: "checkbox", name: name, checked: value !== null && value !== void 0 ? value : false, onChange: onChange, className: "rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" }));
    }
    if (type === "select") {
        return ((0, jsx_runtime_1.jsx)("select", { name: name, value: value !== null && value !== void 0 ? value : "", onChange: onChange, className: "w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none", children: options === null || options === void 0 ? void 0 : options.map(function (opt) { return ((0, jsx_runtime_1.jsx)("option", { value: opt.value, children: opt.label }, opt.value)); }) }));
    }
    return ((0, jsx_runtime_1.jsx)("input", { type: "text", name: name, value: value !== null && value !== void 0 ? value : "", onChange: onChange, className: "w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none" }));
};
// Alt Modül 2: Normal Görüntüleme Modu
var CellViewer = function (_a) {
    var type = _a.type, value = _a.value;
    if (type === "checkbox") {
        return ((0, jsx_runtime_1.jsx)("span", { className: "inline-block h-2.5 w-2.5 rounded-full ".concat(value ? "bg-blue-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "") }));
    }
    return (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-gray-700", children: value !== null && value !== void 0 ? value : "-" });
};
var EditableCell = function (_a) {
    var isEditing = _a.isEditing, type = _a.type, name = _a.name, editValue = _a.editValue, normalValue = _a.normalValue, onChange = _a.onChange, options = _a.options;
    if (isEditing) {
        return ((0, jsx_runtime_1.jsx)(CellInput, { type: type, name: name, value: editValue, onChange: onChange, options: options }));
    }
    return (0, jsx_runtime_1.jsx)(CellViewer, { type: type, value: normalValue });
};
exports.EditableCell = EditableCell;
var ActionCell = function (_a) {
    var isEditing = _a.isEditing, onSave = _a.onSave, onCancel = _a.onCancel, onStartEdit = _a.onStartEdit, onDelete = _a.onDelete;
    if (isEditing) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-end space-x-3", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: onSave, className: "flex cursor-pointer items-center space-x-1 text-emerald-500 hover:text-emerald-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { size: 14 }), " ", (0, jsx_runtime_1.jsx)("span", { children: "Kaydet" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: onCancel, className: "text-theme-muted hover:text-theme-text flex cursor-pointer items-center space-x-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 14 }), " ", (0, jsx_runtime_1.jsx)("span", { children: "\u0130ptal" })] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-end space-x-4", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: onStartEdit, className: "text-theme-muted hover:text-theme-text flex cursor-pointer items-center space-x-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { size: 13 }), " ", (0, jsx_runtime_1.jsx)("span", { children: "D\u00FCzenle" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: onDelete, className: "flex cursor-pointer items-center space-x-1 text-red-500 hover:text-red-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 13 }), " ", (0, jsx_runtime_1.jsx)("span", { children: "Sil" })] })] }));
};
exports.ActionCell = ActionCell;
