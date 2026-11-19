"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeSelectorDropDown = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var ThemeSelectorDropDown = function () {
    var _a = (0, react_1.useState)(function () {
        return localStorage.getItem("app-theme") || "default";
    }), theme = _a[0], setTheme = _a[1];
    var _b = (0, react_1.useState)(false), isOpen = _b[0], setIsOpen = _b[1];
    var dropdownRef = (0, react_1.useRef)(null);
    var themes = [
        { value: "default", label: "github-light (Default)" },
        { value: "github-dark", label: "github-dark" },
        { value: "vitepress-light", label: "vitepress" },
        { value: "vitepress-dark", label: "vitepress-dark" },
        { value: "dos-programmer", label: "ms dos" },
        { value: "pink-dream", label: "pink-dream" },
    ];
    // Tema Değişim Yönetimi (Anti-Flicker Mekanizması Korundu)
    (0, react_1.useEffect)(function () {
        var root = document.documentElement;
        var css = document.createElement("style");
        css.type = "text/css";
        css.appendChild(document.createTextNode("* { transition: none !important; }"));
        document.head.appendChild(css);
        if (theme === "default") {
            root.removeAttribute("data-theme");
        }
        else {
            root.setAttribute("data-theme", theme);
        }
        window.getComputedStyle(document.body);
        var timer = setTimeout(function () {
            document.head.removeChild(css);
        }, 1);
        localStorage.setItem("app-theme", theme);
        return function () { return clearTimeout(timer); };
    }, [theme]);
    // Menü Dışına Tıklandığında Kapatma Mantığı
    (0, react_1.useEffect)(function () {
        var handleClickOutside = function (event) {
            if (dropdownRef.current &&
                !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return function () { return document.removeEventListener("mousedown", handleClickOutside); };
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "relative inline-block text-left", ref: dropdownRef, children: [(0, jsx_runtime_1.jsx)("button", { onClick: function () { return setIsOpen(!isOpen); }, className: "btn-secondary hover:bg-theme-surface/80 border-theme-primary flex items-center justify-center rounded-md p-2", title: "Tema De\u011Fi\u015Ftir", "aria-haspopup": "true", "aria-expanded": isOpen, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Palette, { size: 20, className: "text-theme-primary" }) }), isOpen && ((0, jsx_runtime_1.jsxs)("div", { className: "panel-base border-theme-border bg-theme-surface animate-in fade-in slide-in-from-top-1 absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border py-1 shadow-lg duration-100", children: [(0, jsx_runtime_1.jsx)("div", { className: "border-theme-border text-theme-muted border-b px-3 py-2 text-xs font-semibold tracking-wider uppercase", children: "Tema Se\u00E7imi" }), (0, jsx_runtime_1.jsx)("ul", { className: "max-h-64 overflow-y-auto", children: themes.map(function (t) { return ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsxs)("button", { onClick: function () {
                                    setTheme(t.value);
                                    setIsOpen(false);
                                }, className: "hover:bg-theme-surface/50 flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ".concat(theme === t.value ? "text-theme-primary font-medium" : "text-theme-text"), children: [(0, jsx_runtime_1.jsx)("span", { children: t.label }), theme === t.value && ((0, jsx_runtime_1.jsx)(lucide_react_1.Check, { size: 16, className: "text-theme-primary" }))] }) }, t.value)); }) })] }))] }));
};
exports.ThemeSelectorDropDown = ThemeSelectorDropDown;
