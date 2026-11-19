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
exports.generateFileInfoSchema = void 0;
function isWildcardPattern(val) {
    return val.includes("*");
}
function wildcardToRegex(wildcard) {
    var trimmed = wildcard.trim();
    if (!trimmed)
        return null;
    var pattern = trimmed.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    pattern = pattern.replace(/\*/g, ".*");
    return new RegExp("^".concat(pattern, "$"), "i");
}
/**
 * Listeyi hafif ve optimize bir şekilde 'expr' alanına göre sıralayıp
 * FileInfoSchema yapısına uygun alt dizilere dağıtır.
 */
var generateFileInfoSchema = function (rawPatterns, maxFileSizeMB, flagEmptyDirectories) {
    if (maxFileSizeMB === void 0) { maxFileSizeMB = 50; }
    if (flagEmptyDirectories === void 0) { flagEmptyDirectories = true; }
    // 1. 'expr' alanına göre alfabetik sıralama (case-insensitive)
    var sortedPatterns = __spreadArray([], rawPatterns, true).sort(function (a, b) {
        return a.expression.localeCompare(b.expression, undefined, {
            sensitivity: "base",
        });
    });
    var extensionDescriptions = [];
    var customIgnoreList = [];
    var regExpIgnoreList = [];
    // 2. Doğrusal dağıtım döngüsü
    sortedPatterns.forEach(function (pattern) {
        if (pattern.extension) {
            extensionDescriptions.push(pattern);
        }
        else if (isWildcardPattern(pattern.expression)) {
            var regexObj = wildcardToRegex(pattern.expression);
            if (regexObj) {
                regExpIgnoreList.push(__assign(__assign({}, pattern), { expr: regexObj }));
            }
            else {
                customIgnoreList.push(pattern);
            }
        }
        else {
            customIgnoreList.push(pattern);
        }
    });
    return {
        maxFileSizeMB: maxFileSizeMB,
        flagEmptyDirectories: flagEmptyDirectories,
        List: customIgnoreList,
        RegExp: regExpIgnoreList,
        Descriptions: extensionDescriptions,
    };
};
exports.generateFileInfoSchema = generateFileInfoSchema;
