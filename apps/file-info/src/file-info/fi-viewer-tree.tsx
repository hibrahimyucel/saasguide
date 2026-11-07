import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  File,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useData } from "./context/fi-data-provider";
import { FileInfoTreeNode } from "./fi-viewer-treenode";

// --- ANA TREE VIEW PANELI ---
export const FileInfoTreeView: React.FC = () => {
  const { scannedTree } = useData();
  const [showOnlyFiltered, setShowOnlyFiltered] = useState(false);

  return (
    <div className="bg-theme-surface/30 border-theme-border flex h-full flex-1 flex-col space-y-3 overflow-hidden rounded-xl border p-4 shadow-xs">
      {/* Panel Üst Başlığı ve Filtreleme Araçları */}
      <div className="border-theme-border/60 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex flex-col">
          <h3 className="text-theme-text text-sm font-bold tracking-tight">
            Taranan Dosya Sistemi
          </h3>
          <p className="text-theme-muted text-[11px]">
            {scannedTree
              ? `Kök Dizin: ${scannedTree.name}`
              : "Henüz bir klasör taranmadı"}
          </p>
        </div>

        {/* Sadece Eşleşenleri Filtreleme Butonu */}
        {scannedTree && (
          <button
            onClick={() => setShowOnlyFiltered(!showOnlyFiltered)}
            className={`flex cursor-pointer items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all duration-150 ${
              showOnlyFiltered
                ? "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border"
            }`}
          >
            {showOnlyFiltered ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>
              {showOnlyFiltered ? "Hepsini Göster" : "Sadece Eşleşenleri Süz"}
            </span>
          </button>
        )}
      </div>

      {/* Ağaç Grafik Alanı */}
      <div className="border-theme-border/30 custom-scrollbar bg-theme-surface/10 flex-1 overflow-y-auto rounded-lg border py-2">
        {scannedTree ? (
          <FileInfoTreeNode
            node={scannedTree}
            depth={0}
            showOnlyFiltered={showOnlyFiltered}
          />
        ) : (
          <div className="text-theme-muted flex h-full flex-col items-center justify-center space-y-1 py-12 text-center">
            <p className="text-xs font-medium">
              Görüntülenecek dosya ağacı bulunamadı.
            </p>
            <p className="text-[11px] opacity-75">
              Lütfen tarama sayfasından bir klasör sürükleyin veya seçin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
