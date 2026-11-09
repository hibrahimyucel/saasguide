// src/file-info/fi-editor-actions.tsx
import React, { useRef } from "react";
import { Download, Upload, RotateCcw } from "lucide-react"; // 🚀 RotateCcw eklendi
import { useData } from "./context/fi-context";

interface ActionsProps {
  onAddNewClick: () => void;
  isNewFormOpen: boolean;
}

export const FileInfoActions: React.FC<ActionsProps> = ({
  onAddNewClick,
  isNewFormOpen,
}) => {
  // 🚀 restoreToDefault metodu context'ten çekildi
  const { exportToJSON, importFromJSON, restoreToDefault } = useData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await importFromJSON(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Onay ve Tetikleme Mekanizması
  const handleRestoreClick = () => {
    const isConfirmed = window.confirm(
      "Mevcut tüm kurallarınız JSON olarak bilgisayarınıza yedeklenecek ve sistem varsayılan ayarlara (Fabrika Ayarlarına) döndürülecektir. Onaylıyor musunuz?",
    );
    if (isConfirmed) {
      restoreToDefault();
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={exportToJSON} className="btn-secondary">
        <Download size={13} />
        <span>JSON İndir</span>
      </button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImportFile}
        className="hidden"
      />
      <button onClick={onImportClick} className="btn-secondary">
        <Upload size={13} />
        <span>JSON Yükle</span>
      </button>

      {/* 🚀 YENİ AKSİYON: Varsayılan Ayarlar Butonu */}
      <button
        onClick={handleRestoreClick}
        className="btn-secondary border-red-500/20 text-red-500 transition-colors hover:bg-red-500/10"
        title="Mevcut yapıyı yedekler ve ilk kurulum şemasına geri döner"
      >
        <RotateCcw size={13} />
        <span>Varsayılana Dön</span>
      </button>

      {!isNewFormOpen && (
        <button onClick={onAddNewClick} className="btn-primary">
          <span>+ Yeni Kural Ekle</span>
        </button>
      )}
    </div>
  );
};
