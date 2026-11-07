import React, { useState } from "react";
import { Folder, UploadCloud } from "lucide-react";

interface FolderDropZoneProps {
  isScanning: boolean;
  onFolderDrop: (directoryEntry: any) => void; // Düz liste yerine entry nesnesini gönderiyoruz
  onSelectClick: () => void;
}

export const FolderDropZone: React.FC<FolderDropZoneProps> = ({
  isScanning,
  onFolderDrop,
  onSelectClick,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isScanning) return;

    // 1. ADIM: Sürüklenen elementleri kontrol et
    const items = e.dataTransfer.items;
    const files = e.dataTransfer.files;

    // Linux/Chrome uyumluluğu için: text/uri-list olsa bile webkitGetAsEntry kontrolünü zorla
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // webkitGetAsEntry fonksiyonu varsa (neredeyse tüm modern tarayıcılarda var)
        if (typeof item.webkitGetAsEntry === "function") {
          const entry = item.webkitGetAsEntry();
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
      const firstFile = files[0] as any;
      // Eğer tarayıcı nesneyi düz file girdisine indirgediyse entry korumasını dene
      if (firstFile.webkitGetAsEntry) {
        const entry = firstFile.webkitGetAsEntry();
        if (entry && entry.isDirectory) {
          onFolderDrop(entry);
          return;
        }
      }
    }

    alert(
      "Analiz edilebilir bir proje klasörü tespit edilemedi. Lütfen doğrudan bir klasörü sürüklediğinizden emin olun.",
    );
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`flex h-full min-h-100 w-full flex-col items-center justify-center space-y-4 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
        isDragActive
          ? "border-theme-primary bg-theme-primary/10 scale-[1.005]"
          : "border-theme-border bg-theme-surface/10"
      }`}
    >
      <div className="border-theme-border bg-theme-surface relative rounded-2xl border p-5 shadow-xs">
        {isDragActive ? (
          <UploadCloud
            size={40}
            className="text-theme-primary animate-bounce"
          />
        ) : (
          <Folder size={40} className="text-theme-muted" />
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-theme-text text-sm font-bold">
          {isDragActive
            ? "Klasörü Buraya Bırakın!"
            : "Analiz için klasör bekleniyor"}
        </h3>
        <p className="text-theme-muted mx-auto max-w-xs text-xs">
          Proje klasörünüzü **bu alana sürükleyip bırakabilir** veya sistem
          gezginini kullanabilirsiniz.
        </p>
      </div>

      <button
        onClick={onSelectClick}
        disabled={isScanning}
        className="btn-primary mt-2 cursor-pointer px-4 py-2 text-xs font-bold shadow-xs disabled:opacity-50"
      >
        {isScanning ? "Taranıyor..." : "Manuel Klasör Seç"}
      </button>
    </div>
  );
};
