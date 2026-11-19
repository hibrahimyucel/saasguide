"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeSelector = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var ThemeSelector = function () {
    // Varsayılan tema 'default' (GitHub Light)
    var _a = (0, react_1.useState)(function () {
        return localStorage.getItem("app-theme") || "default";
    }), theme = _a[0], setTheme = _a[1];
    (0, react_1.useEffect)(function () {
        var root = document.documentElement;
        // 1. Geçici olarak tüm transition'ları dondur
        var css = document.createElement("style");
        css.type = "text/css";
        css.appendChild(document.createTextNode("* { transition: none !important; }"));
        document.head.appendChild(css);
        // 2. Doğrudan data-theme niteliğini ata (CSS dosyanızdaki seçiciyle tam eşleşir)
        if (theme === "default") {
            root.removeAttribute("data-theme");
        }
        else {
            root.setAttribute("data-theme", theme);
        }
        // 3. Tarayıcıyı yeni stilleri okumaya zorla
        window.getComputedStyle(document.body);
        // 4. Stili hemen kaldır
        var timer = setTimeout(function () {
            document.head.removeChild(css);
        }, 1);
        localStorage.setItem("app-theme", theme);
        return function () { return clearTimeout(timer); };
    }, [theme]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-theme-surface flex items-center space-x-1 rounded-lg p-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Palette, { size: 30, className: "text-theme-primary" }), (0, jsx_runtime_1.jsxs)("select", { value: theme, onChange: function (e) { return setTheme(e.target.value); }, className: "input-with-icon", children: [(0, jsx_runtime_1.jsx)("option", { value: "default", children: "github-light (Default)" }), (0, jsx_runtime_1.jsx)("option", { value: "github-dark", children: "github-dark" }), (0, jsx_runtime_1.jsx)("option", { value: "vitepress-light", children: "vitepress" }), (0, jsx_runtime_1.jsx)("option", { value: "vitepress-dark", children: "vitepress-dark" }), (0, jsx_runtime_1.jsx)("option", { value: "dos-programmer", children: "ms dos" }), (0, jsx_runtime_1.jsx)("option", { value: "pink-dream", children: "pink-dream" })] })] }));
};
exports.ThemeSelector = ThemeSelector;
