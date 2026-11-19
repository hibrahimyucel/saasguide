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
exports.generateDescMap = exports.flagEmptyDirectories = exports.maxFileSizeMB = void 0;
var file_info_data_1 = require("./file-info/file-info-data");
exports.maxFileSizeMB = 10;
exports.flagEmptyDirectories = true;
// 1. Bu ifadenin regex gerektirip gerektirmediğini kontrol eder (İçinde * var mı?)
function isWildcardPattern(val) {
    return val.includes("*");
}
// 2. Sadece dosya/klasör adları için Joker (*) karakterini Regex'e dönüştürür
function wildcardToRegex(wildcard) {
    var trimmed = wildcard.trim();
    if (!trimmed)
        return null;
    // Regex özel karakterlerini kaçır (\), ancak yıldız (*) karakterlerine dokunma
    var pattern = trimmed.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    // Sadece dosya/klasör adı olduğu için ** ve * aynı anlama gelir: "Herhangi bir karakter dizisi"
    // Büyük/küçük harf duyarsızlığı (case-insensitive) için regex'e 'i' bayrağı ekliyoruz
    pattern = pattern.replace(/\*/g, ".*");
    return new RegExp("^".concat(pattern, "$"), "i");
}
var generateDescMap = function () {
    var items = [];
    for (var _i = 0, _a = Object.values(file_info_data_1.initialSchema); _i < _a.length; _i++) {
        var item = _a[_i];
        if (isWildcardPattern(item.expression)) {
            var regex = wildcardToRegex(item.expression);
            if (regex) {
                items.push(__assign(__assign({}, item), { regExp: regex, kind: "2-regExp" }));
            }
        }
        else {
            items.push(__assign(__assign({}, item), { kind: item.extension ? "3-ext" : "1-regular" }));
        }
    }
    items = items.sort(function (a, b) {
        var _a;
        // 1. Sort by 'kind' alphabetically ('1-regular' -> '2-regExp' -> '3-ext')
        var kindCompare = (_a = a.kind) === null || _a === void 0 ? void 0 : _a.localeCompare(b.kind || "");
        // If 'kind' is different, return the comparison result
        if (kindCompare !== 0) {
            return kindCompare;
        }
        // 2. If 'kind' is the same, sort by 'expression' alphabetically
        return a.expression.localeCompare(b.expression);
    });
    // 1. Diziyi 'kind' alanına göre 3 gruba ayırıyoruz
    var groupedPatterns = Object.groupBy(items, function (item) { return item.kind; });
    return {
        List: groupedPatterns["1-regular"] || [],
        RegExp: groupedPatterns["2-regExp"] || [],
        Descriptions: groupedPatterns["3-ext"] || [],
        maxFileSizeMB: 10,
        flagEmptyDirectories: true,
    };
};
exports.generateDescMap = generateDescMap;
