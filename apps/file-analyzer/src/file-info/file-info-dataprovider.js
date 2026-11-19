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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.usePatterns = exports.PatternProvider = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var file_info_data_1 = require("./file-info-data");
var PatternContext = (0, react_1.createContext)(undefined);
// --- 1. CORE EXPRESSION PARSER MOTORU ---
var parseAndCompileExpression = function (expr, isExtensionFlag) {
    var trimmed = expr.trim();
    if (isExtensionFlag) {
        var escapedExt = trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        return { regExp: new RegExp(escapedExt, "i"), kind: "3-ext" };
    }
    var regexLiteralPattern = /^\/(.+)\/([gimyus]*)$/;
    var match = trimmed.match(regexLiteralPattern);
    if (match) {
        try {
            return { regExp: new RegExp(match[1], match[2]), kind: "2-regExp" };
        }
        catch (_a) { }
    }
    var hasDynamicTokens = /[\*\?\\\+^$\|\[\]\(\)\{\}]/.test(trimmed) ||
        /\d/.test(trimmed) ||
        /(yy|mm|dd|yyyy)/i.test(trimmed);
    if (hasDynamicTokens) {
        try {
            var safePattern = trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, function (m) {
                return m === "*" ? ".*" : m === "?" ? "." : "\\".concat(m);
            });
            safePattern = safePattern
                .replace(/yyyy/gi, "\\d{4}")
                .replace(/mm/gi, "\\d{2}")
                .replace(/dd/gi, "\\d{2}");
            return { regExp: new RegExp(safePattern, "i"), kind: "2-regExp" };
        }
        catch (_b) { }
    }
    var escapedLiteral = trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    return { regExp: new RegExp(escapedLiteral, "i"), kind: "1-regular" };
};
var pipelineInitialize = function (schema) {
    var hydrated = schema.map(function (item) {
        var expr = item.expression || item.expr || "";
        var isExtension = item.extension !== undefined ? !!item.extension : !!item.isExt;
        var _a = parseAndCompileExpression(expr, isExtension), regExp = _a.regExp, kind = _a.kind;
        return {
            expression: expr,
            description: String(item.description || item.desc || ""),
            ignore: item.ignore !== undefined ? !!item.ignore : false,
            extension: isExtension,
            group: String(item.group || item.grp || ""),
            checked: item.checked !== undefined ? !!item.checked : false,
            kind: kind,
            regExp: regExp,
        };
    });
    return hydrated.sort(function (a, b) {
        var kindCompare = (a.kind || "").localeCompare(b.kind || "");
        if (kindCompare !== 0)
            return kindCompare;
        return a.expression.localeCompare(b.expression);
    });
};
// --- 2. PROVIDER BİLEŞENİ ---
var PatternProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(function () {
        return pipelineInitialize(file_info_data_1.initialSchema);
    }), patterns = _b[0], setPatterns = _b[1];
    var _c = (0, react_1.useState)(null), scannedTree = _c[0], setScannedTree = _c[1];
    // 🚀 REKÜRSİF RE-EVALUATION ENGINE: Evaluates existing node maps against runtime active schema
    var autoReevaluateTree = (0, react_1.useCallback)(function (node, activeRules) {
        var isFiltered = false;
        if (activeRules.length > 0) {
            isFiltered = activeRules.some(function (rule) {
                if (!rule.regExp)
                    return false;
                if (rule.extension) {
                    return node.name
                        .toLowerCase()
                        .endsWith(rule.expression.toLowerCase());
                }
                return rule.regExp.test(node.name) || rule.regExp.test(node.path);
            });
        }
        if (node.isDirectory && node.children) {
            return __assign(__assign({}, node), { filtered: isFiltered, children: node.children.map(function (child) {
                    return autoReevaluateTree(child, activeRules);
                }) });
        }
        return __assign(__assign({}, node), { filtered: isFiltered });
    }, []);
    // 🚀 AUTOMATIC SYNC REACTIVE SIDE EFFECT
    (0, react_1.useEffect)(function () {
        if (!scannedTree)
            return;
        var activeRules = patterns.filter(function (p) { return p.checked; });
        setScannedTree(function (prevTree) {
            if (!prevTree)
                return null;
            // Triggers immediate automatic non-destructive re-filtering pipeline execution
            return autoReevaluateTree(prevTree, activeRules);
        });
    }, [patterns, autoReevaluateTree]);
    var addPattern = (0, react_1.useCallback)(function (newItem) {
        var isSuccess = false;
        setPatterns(function (prev) {
            if (prev.some(function (p) { return p.expression === newItem.expression; })) {
                alert("Bu kural zaten mevcut!");
                isSuccess = false;
                return prev;
            }
            var _a = parseAndCompileExpression(newItem.expression, newItem.extension), regExp = _a.regExp, kind = _a.kind;
            var completedItem = __assign(__assign({}, newItem), { kind: kind, regExp: regExp, checked: newItem.checked !== undefined ? !!newItem.checked : false });
            isSuccess = true;
            var updatedList = __spreadArray(__spreadArray([], prev, true), [completedItem], false);
            return updatedList.sort(function (a, b) {
                var kindCompare = (a.kind || "").localeCompare(b.kind || "");
                if (kindCompare !== 0)
                    return kindCompare;
                return a.expression.localeCompare(b.expression);
            });
        });
        return isSuccess;
    }, []);
    var removePattern = (0, react_1.useCallback)(function (expression) {
        setPatterns(function (prev) { return prev.filter(function (p) { return p.expression !== expression; }); });
    }, []);
    var updatePattern = (0, react_1.useCallback)(function (updatedItem) {
        setPatterns(function (prev) {
            return prev.map(function (p) {
                if (p.expression !== updatedItem.expression)
                    return p;
                var _a = parseAndCompileExpression(updatedItem.expression, updatedItem.extension), regExp = _a.regExp, kind = _a.kind;
                return __assign(__assign({}, updatedItem), { regExp: regExp, kind: kind });
            });
        });
    }, []);
    var toggleChecked = (0, react_1.useCallback)(function (expression) {
        setPatterns(function (prev) {
            return prev.map(function (p) {
                return p.expression === expression ? __assign(__assign({}, p), { checked: !p.checked }) : p;
            });
        });
    }, []);
    var resetPatterns = (0, react_1.useCallback)(function () {
        setPatterns(function () { return pipelineInitialize(file_info_data_1.initialSchema); });
        setScannedTree(null);
    }, []);
    var exportToJSON = (0, react_1.useCallback)(function () {
        var cleanPatterns = patterns.map(function (_a) {
            var regExp = _a.regExp, rest = __rest(_a, ["regExp"]);
            return rest;
        });
        var blob = new Blob([JSON.stringify(cleanPatterns, null, 2)], {
            type: "application/json",
        });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "patterns-".concat(new Date().toISOString().slice(0, 10), ".json");
        link.click();
        URL.revokeObjectURL(url);
    }, [patterns]);
    var importFromJSON = (0, react_1.useCallback)(function (file) {
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function (event) {
                var _a;
                try {
                    var imported = JSON.parse((_a = event.target) === null || _a === void 0 ? void 0 : _a.result);
                    if (!Array.isArray(imported)) {
                        alert("Geçersiz JSON yapısı.");
                        return resolve(false);
                    }
                    var dynamicHydration = pipelineInitialize(imported);
                    var map_1 = new Map();
                    patterns.forEach(function (p) { return map_1.set(p.expression, p); });
                    dynamicHydration.forEach(function (item) { return map_1.set(item.expression, item); });
                    setPatterns(Array.from(map_1.values()).sort(function (a, b) {
                        var kindCompare = (a.kind || "").localeCompare(b.kind || "");
                        if (kindCompare !== 0)
                            return kindCompare;
                        return a.expression.localeCompare(b.expression);
                    }));
                    resolve(true);
                }
                catch (_b) {
                    alert("JSON ayrıştırma hatası.");
                    resolve(false);
                }
            };
            reader.readAsText(file);
        });
    }, [patterns]);
    return ((0, jsx_runtime_1.jsx)(PatternContext.Provider, { value: {
            patterns: patterns,
            scannedTree: scannedTree,
            setScannedTree: setScannedTree,
            addPattern: addPattern,
            removePattern: removePattern,
            updatePattern: updatePattern,
            toggleChecked: toggleChecked,
            resetPatterns: resetPatterns,
            exportToJSON: exportToJSON,
            importFromJSON: importFromJSON,
        }, children: children }));
};
exports.PatternProvider = PatternProvider;
var usePatterns = function () {
    var context = (0, react_1.useContext)(PatternContext);
    if (context === undefined) {
        throw new Error("usePatterns mutlaka bir PatternProvider içinde kullanılmalıdır.");
    }
    return context;
};
exports.usePatterns = usePatterns;
