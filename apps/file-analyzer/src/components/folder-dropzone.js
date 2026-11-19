"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderDropZone = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var FolderDropZone = function (_a) {
    var isScanning = _a.isScanning, onFolderDrop = _a.onFolderDrop, onSelectClick = _a.onSelectClick;
    var _b = (0, react_1.useState)(false), isDragActive = _b[0], setIsDragActive = _b[1];
    var handleDrag = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        }
        else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };
    var handleDrop = function (e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (isScanning)
            return;
        // 1. ADIM: Sürüklenen elementleri kontrol et
        var items = e.dataTransfer.items;
        var files = e.dataTransfer.files;
        // Linux/Chrome uyumluluğu için: text/uri-list olsa bile webkitGetAsEntry kontrolünü zorla
        if (items && items.length > 0) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                // webkitGetAsEntry fonksiyonu varsa (neredeyse tüm modern tarayıcılarda var)
                if (typeof item.webkitGetAsEntry === "function") {
                    var entry = item.webkitGetAsEntry();
                    if (entry) {
                        if (entry.isDirectory) {
                            onFolderDrop(entry);
                            return; // İlk klasörü bulduğumuz an taramayı başlatıp çıkıyoruz
                        }
                    }
                }
            }
        }
        // 2. ADIM: Yedek Plan (Yukarıdaki döngü bir şekilde kaçarsa standard files üzerinden dene)
        if (files && files.length > 0) {
            // Klasör sürüklemelerinde standart files dizisinde webkitRelativePath veya özel nesneler aranabilir
            var firstFile = files[0];
            // Eğer tarayıcı nesneyi düz file girdisine indirgediyse entry korumasını dene
            if (firstFile.webkitGetAsEntry) {
                var entry = firstFile.webkitGetAsEntry();
                if (entry && entry.isDirectory) {
                    onFolderDrop(entry);
                    return;
                }
            }
        }
        alert("Analiz edilebilir bir proje klasörü tespit edilemedi. Lütfen doğrudan bir klasörü sürüklediğinizden emin olun.");
    };
    return ((0, jsx_runtime_1.jsxs)("div", { onDragEnter: handleDrag, onDragOver: handleDrag, onDragLeave: handleDrag, onDrop: handleDrop, className: "flex h-full min-h-100 w-full flex-col items-center justify-center space-y-4 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ".concat(isDragActive
            ? "border-theme-primary bg-theme-primary/10 scale-[1.005]"
            : "border-theme-border bg-theme-surface/10"), children: [(0, jsx_runtime_1.jsx)("div", { className: "border-theme-border bg-theme-surface relative rounded-2xl border p-5 shadow-xs", children: isDragActive ? ((0, jsx_runtime_1.jsx)(lucide_react_1.UploadCloud, { size: 40, className: "text-theme-primary animate-bounce" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Folder, { size: 40, className: "text-theme-muted" })) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-theme-text text-sm font-bold", children: isDragActive
                            ? "Klasörü Buraya Bırakın!"
                            : "Analiz için klasör bekleniyor" }), (0, jsx_runtime_1.jsx)("p", { className: "text-theme-muted mx-auto max-w-xs text-xs", children: "Proje klas\u00F6r\u00FCn\u00FCz\u00FC **bu alana s\u00FCr\u00FCkleyip b\u0131rakabilir** veya sistem gezginini kullanabilirsiniz." })] }), (0, jsx_runtime_1.jsx)("button", { onClick: onSelectClick, disabled: isScanning, className: "btn-primary mt-2 cursor-pointer px-4 py-2 text-xs font-bold shadow-xs disabled:opacity-50", children: isScanning ? "Taranıyor..." : "Manuel Klasör Seç" })] }));
};
exports.FolderDropZone = FolderDropZone;
