"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wildcardToRegex = wildcardToRegex;
exports.analyzePathWithSchema = analyzePathWithSchema;
/**
 * Kullanıcının girdiğinde belirttiği wildcard (ör: src/**/ /*.ts veya *.log)
* ifadesini güvenli ve doğru çalışan bir RegExp nesnesine dönüştürür.
*/
function wildcardToRegex(wildcard) {
    var pattern = wildcard.trim().replace(/^\/+|\/+$/g, '');
    if (!pattern)
        return null;
    // Özel regex karakterlerini kaçır (escape)
    pattern = pattern.replace(/[.+^${}()|[\]\\/]/g, '\\$&');
    // Klasör derinliği ve tekil joker yıldız dönüşümleri
    pattern = pattern.replace(/\*\*+/g, '.*').replace(/\*/g, '[^/]*');
    // Tam eşleşme, alt kırılım veya dizin içi aramaları kapsayacak varyasyon güvenliği
    return new RegExp("^".concat(pattern, "$|^").concat(pattern, "/|/").concat(pattern, "$|/").concat(pattern, "/"));
}
/**
 * Gelen dosya veya klasör yolunu file-info.json şemasına göre test eder.
 * Dosyanın yoksayılıp (ignore) sayılmayacağını ve bir açıklaması olup olmadığını döner.
 */
function analyzePathWithSchema(relativePath, fileName, schema) {
    // 1. Aşama: Özel Regex / Wildcard Kuralları (customIgnoreList) Kontrolü
    if (schema.customIgnoreList && schema.customIgnoreList.length > 0) {
        for (var _i = 0, _a = schema.customIgnoreList; _i < _a.length; _i++) {
            var rule = _a[_i];
            if (rule.type === 'regex' && rule.expr) {
                try {
                    var rx = new RegExp(rule.expr);
                    if (rx.test(relativePath)) {
                        return { isIgnored: rule.ignore, desc: rule.desc };
                    }
                }
                catch (e) {
                    console.error("Ge\u00E7ersiz regex kural\u0131: ".concat(rule.expr), e);
                }
            }
            else if (rule.type === 'wildcard' && rule.expr) {
                var rx = wildcardToRegex(rule.expr);
                if (rx && rx.test(relativePath)) {
                    return { isIgnored: rule.ignore, desc: rule.desc };
                }
            }
        }
    }
    // 2. Aşama: Dosya Uzantısı Açıklamaları (extensionDescriptions) Kontrolü
    if (schema.extensionDescriptions && schema.extensionDescriptions.length > 0) {
        var dotIndex = fileName.lastIndexOf('.');
        if (dotIndex !== -1) {
            var fileExt_1 = fileName.slice(dotIndex).toLowerCase(); // ör: ".ts"
            var extensionMatch = schema.extensionDescriptions.find(function (d) { return d.expr.toLowerCase() === fileExt_1; });
            if (extensionMatch) {
                return { isIgnored: extensionMatch.ignore, desc: extensionMatch.desc };
            }
        }
    }
    // Eşleşme yoksa varsayılan durum
    return { isIgnored: false };
}
