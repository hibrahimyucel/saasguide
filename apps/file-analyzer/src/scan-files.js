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
exports.generateFileTree = generateFileTree;
var file_info_data_js_1 = require("./file-info/file-info-data.js");
// --- GLOBAL DEĞİŞKENLER VE BAŞLANGIÇ DEĞERLERİ ---
var extensionDescriptions = [];
var customIgnoreList = [];
var regExpIgnoreList = [];
// --- İŞLEM ADIMLARI FONKSİYONLARI ---
function wildcardToRegex(wildcard) {
    var pattern = wildcard.trim().replace(/^\/+|\/+$/g, "");
    if (!pattern)
        return null;
    // Özel regex karakterlerini kaçır (escape)
    pattern = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    // ** ve * kalıplarını regex formatına çevir
    pattern = pattern.replace(/\*\*+/g, ".*").replace(/\*/g, "[^/]*");
    return new RegExp("^".concat(pattern, "$|^").concat(pattern, "/|/").concat(pattern, "$|/").concat(pattern, "/"));
}
var generateDescMap = function () {
    for (var _i = 0, _a = Object.values(file_info_data_js_1.initialSchema.global_ignore_patterns); _i < _a.length; _i++) {
        var item = _a[_i];
        // 1. Destructuring ile 'expr' alanını ayırıp kalan özellikleri 'rest' içine alıyoruz
        var expr = item.expr, rest = __rest(item, ["expr"]);
        var r = wildcardToRegex(expr);
        if (r) {
            // 2. Kalan özellikleri (...rest) ve yeni oluşturulan 'expr: r' değerini birleştiriyoruz
            regExpIgnoreList.push(__assign({ expr: r }, rest));
        }
        else {
            // Regex'e dönüşemiyorsa orijinal item'ı aynen ekliyoruz
            customIgnoreList.push(item);
        }
    }
};
/**
 * 4. Adım: Hiyerarşik Dizin Tarama (Özyinelemeli / Recursive)
 */
function scanDirectoryTree(dirPath, relativePath, regexRules) {
    if (relativePath === void 0) { relativePath = ""; }
    if (regexRules === void 0) { regexRules = []; }
    var results = [];
    try {
        var items = fs.readdirSync(dirPath);
        // Dosya ve klasörleri ayırt et ve durum bilgisini al
        var analyzedItems = items.map(function (item) {
            var fullPath = path.join(dirPath, item);
            var isDirectory = false;
            try {
                isDirectory = fs.statSync(fullPath).isDirectory();
            }
            catch (e) {
                // Hata durumunda varsayılan olarak false kalır
            }
            return { item: item, isDirectory: isDirectory };
        });
        // Önce klasörleri, sonra dosyaları kendi içlerinde alfabetik sırala
        var folders = analyzedItems
            .filter(function (i) { return i.isDirectory; })
            .sort(function (a, b) { return a.item.localeCompare(b.item); });
        var files = analyzedItems
            .filter(function (i) { return !i.isDirectory; })
            .sort(function (a, b) { return a.item.localeCompare(b.item); });
        var sortedItems = __spreadArray(__spreadArray([], folders, true), files, true);
        sortedItems.forEach(function (_a) {
            var item = _a.item, isDirectory = _a.isDirectory;
            var currentRelPath = relativePath
                ? path.join(relativePath, item)
                : item;
            // Yoksayma kurallarına uyup uymadığını kontrol et (Windows/Linux yol uyumluluğu ile)
            var shouldIgnore = regexRules.some(function (regex) {
                return regex.test(item) ||
                    regex.test(currentRelPath) ||
                    regex.test(currentRelPath.replace(/\\/g, "/"));
            });
            if (shouldIgnore)
                return;
            var fullPath = path.join(dirPath, item);
            var ext = path.extname(item).toLowerCase();
            // Açıklama ataması yap (Özel isim -> Uzantı -> Varsayılan)
            var desc = exactDescriptions[item] ||
                extensionDescriptions[ext] ||
                (isDirectory ? "Klasör" : "Dosya");
            var node = {
                type: isDirectory ? "folder" : "file",
                name: item,
                desc: desc,
            };
            // Eğer klasörse, alt kırılımları tara ve children dizisine ekle
            if (isDirectory) {
                node.children = scanDirectoryTree(fullPath, currentRelPath, regexRules);
            }
            results.push(node);
        });
    }
    catch (error) {
        console.error("Hata (".concat(dirPath, "):"), error.message);
    }
    return results;
}
/**
 * 5. Adım: Ana Akışı Tetikleme ve Dosya Çıktısı Üretme
 */
function generateFileTree() {
    // 1. Dış konfigürasyonları yükle
    loadExternalConfig();
    // 2. Projedeki .gitignore ve .dockerignore dosyalarını ekle
    loadIgnoreFiles();
    // 3. Tüm yoksayma kalıplarını Regex nesnelerine dönüştür ve filtrele
    var regexRules = ignorePatterns
        .map(function (p) { return wildcardToRegex(p); })
        .filter(function (r) { return r !== null; });
    // 4. Kök dizinden itibaren ağaç yapısını tara
    var treeData = scanDirectoryTree(".", "", regexRules);
    // 5. Çıktıyı formatlı bir JavaScript modülü olarak diske yaz
    var fileContent = "export const fileTree = ".concat(JSON.stringify(treeData, null, 2), ";\n");
    fs.writeFileSync("fileTree.js", fileContent, "utf-8");
    console.log('✔ Yeni nesil hiyerarşik "fileTree.js" başarıyla oluşturuldu!');
}
// Betik doğrudan çalıştırıldığında tetiklenmesi için:
generateFileTree();
