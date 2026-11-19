"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanUniversal = void 0;
/**
 * 2. ANA TEK REKÜRSİF TARAMA FONKSİYONU
 * Bu fonksiyon giriş kaynağının ne olduğunu önemsemez, UniversalEntry standardını takip eder.
 */
var scanUniversal = function (entry, currentPath, depth, schema, getDescription) { return __awaiter(void 0, void 0, void 0, function () {
    var check, nodeSizeStr, isIgnored, matchedRule, fileData, sizeInMB, _a, node, childrenEntries, _b, _c, _d, val, e_1_1, dirReader_1, rawEntries, _i, rawEntries_1, sub, _e, childrenEntries_1, child, _f, _g, err_1;
    var _h, e_1, _j, _k;
    return __generator(this, function (_l) {
        switch (_l.label) {
            case 0:
                check = getDescription(entry.name);
                nodeSizeStr = "";
                isIgnored = check.isIgnored;
                matchedRule = check.desc;
                if (!entry.isFile) return [3 /*break*/, 7];
                _l.label = 1;
            case 1:
                _l.trys.push([1, 6, , 7]);
                fileData = void 0;
                if (!entry.rawHandle) return [3 /*break*/, 3];
                return [4 /*yield*/, entry.rawHandle.getFile()];
            case 2:
                // Tıklama ile gelen FileSystemFileHandle
                fileData = _l.sent();
                return [3 /*break*/, 5];
            case 3: return [4 /*yield*/, new Promise(function (resolve, reject) {
                    return entry.rawEntry.file(resolve, reject);
                })];
            case 4:
                // Sürükle bırak ile gelen FileSystemFileEntry
                fileData = _l.sent();
                _l.label = 5;
            case 5:
                sizeInMB = fileData.size / (1024 * 1024);
                nodeSizeStr =
                    sizeInMB < 0.1
                        ? "".concat((fileData.size / 1024).toFixed(1), " KB")
                        : "".concat(sizeInMB.toFixed(2), " MB");
                if (sizeInMB > schema.maxFileSizeMB) {
                    isIgnored = true;
                    matchedRule = "Boyut S\u0131n\u0131r\u0131 \u0130hlali (> ".concat(schema.maxFileSizeMB, "MB)");
                }
                return [3 /*break*/, 7];
            case 6:
                _a = _l.sent();
                return [3 /*break*/, 7];
            case 7:
                node = {
                    name: entry.name,
                    path: "".concat(currentPath, "/").concat(entry.name),
                    kind: entry.isDirectory ? "directory" : "file",
                    depth: depth,
                    isDirectory: entry.isDirectory,
                    isIgnored: isIgnored,
                    size: nodeSizeStr,
                    description: matchedRule,
                };
                if (!(entry.isDirectory && !node.isIgnored)) return [3 /*break*/, 30];
                node.children = [];
                childrenEntries = [];
                _l.label = 8;
            case 8:
                _l.trys.push([8, 28, , 29]);
                if (!entry.rawHandle) return [3 /*break*/, 21];
                _l.label = 9;
            case 9:
                _l.trys.push([9, 14, 15, 20]);
                _b = true, _c = __asyncValues(entry.rawHandle.values());
                _l.label = 10;
            case 10: return [4 /*yield*/, _c.next()];
            case 11:
                if (!(_d = _l.sent(), _h = _d.done, !_h)) return [3 /*break*/, 13];
                _k = _d.value;
                _b = false;
                val = _k;
                childrenEntries.push({
                    name: val.name,
                    isDirectory: val.kind === "directory",
                    isFile: val.kind === "file",
                    rawHandle: val,
                });
                _l.label = 12;
            case 12:
                _b = true;
                return [3 /*break*/, 10];
            case 13: return [3 /*break*/, 20];
            case 14:
                e_1_1 = _l.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 20];
            case 15:
                _l.trys.push([15, , 18, 19]);
                if (!(!_b && !_h && (_j = _c.return))) return [3 /*break*/, 17];
                return [4 /*yield*/, _j.call(_c)];
            case 16:
                _l.sent();
                _l.label = 17;
            case 17: return [3 /*break*/, 19];
            case 18:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 19: return [7 /*endfinally*/];
            case 20: return [3 /*break*/, 23];
            case 21:
                dirReader_1 = entry.rawEntry.createReader();
                return [4 /*yield*/, new Promise(function (resolve) {
                        return dirReader_1.readEntries(resolve);
                    })];
            case 22:
                rawEntries = _l.sent();
                for (_i = 0, rawEntries_1 = rawEntries; _i < rawEntries_1.length; _i++) {
                    sub = rawEntries_1[_i];
                    childrenEntries.push({
                        name: sub.name,
                        isDirectory: sub.isDirectory,
                        isFile: sub.isFile,
                        rawEntry: sub,
                    });
                }
                _l.label = 23;
            case 23:
                _e = 0, childrenEntries_1 = childrenEntries;
                _l.label = 24;
            case 24:
                if (!(_e < childrenEntries_1.length)) return [3 /*break*/, 27];
                child = childrenEntries_1[_e];
                _g = (_f = node.children).push;
                return [4 /*yield*/, (0, exports.scanUniversal)(child, node.path, depth + 1, schema, getDescription)];
            case 25:
                _g.apply(_f, [_l.sent()]);
                _l.label = 26;
            case 26:
                _e++;
                return [3 /*break*/, 24];
            case 27: return [3 /*break*/, 29];
            case 28:
                err_1 = _l.sent();
                console.error("Alt dizin okuma hatas\u0131 (".concat(node.path, "):"), err_1);
                return [3 /*break*/, 29];
            case 29:
                // D) BOŞ KLASÖR VE SIRALAMA KRİTERLERİ
                if (schema.flagEmptyDirectories && node.children.length === 0) {
                    node.isIgnored = true;
                    node.description = "⚠️ Boş Klasör Tespit Edildi";
                }
                else {
                    node.children.sort(function (a, b) {
                        if (a.kind === "directory" && b.kind !== "directory")
                            return -1;
                        if (a.kind !== "directory" && b.kind === "directory")
                            return 1;
                        return a.name.localeCompare(b.name, "tr");
                    });
                }
                _l.label = 30;
            case 30: return [2 /*return*/, node];
        }
    });
}); };
exports.scanUniversal = scanUniversal;
