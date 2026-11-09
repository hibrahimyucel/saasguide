// src/file-info/fi-viewer-tree.tsx (FileInfoTreeView Bileşeni)
import React, { useState } from "react";
import {
  FolderTree,
  Check,
  Code,
  FileText,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";
import { useData } from "./context/fi-context";
import { FileInfoTreeNode } from "./fi-viewer-treenode";
import { FileInfoReportTab } from "./context/fi-viewer-reporttab";
import {
  convertTreeToCleanJSON,
  convertTreeToMarkdown,
} from "./context/fi-data-helpers";

export const FileInfoTreeView: React.FC = () => {
  const { scannedTree, bigFilesReport } = useData();
  const [activeTab, setActiveTab] = useState<"tree" | "report">("tree");
  const [showOnlyFiltered, setShowOnlyFiltered] = useState(false);

  // Butonlarda anlık "Kopyalandı!" onayı göstermek için state'ler
  const [copiedType, setCopiedType] = useState<"json" | "md" | null>(null);

  const handleCopy = (format: "json" | "md") => {
    if (!scannedTree) return;

    let textToCopy = "";
    if (format === "json") {
      const cleanObj = convertTreeToCleanJSON(scannedTree);
      textToCopy = JSON.stringify(cleanObj, null, 2);
    } else {
      textToCopy = "```\n" + convertTreeToMarkdown(scannedTree) + "\n```";
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedType(format);
      setTimeout(() => setCopiedType(null), 2000); // 2 saniye sonra ikonu eski haline getir
    });
  };

  return (
    <div className="bg-theme-surface/30 border-theme-border flex h-full flex-1 flex-col space-y-3 overflow-hidden rounded-xl border p-4 shadow-xs">
      {/* Üst Menü ve Araç Grubu */}
      <div className="border-theme-border/60 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div className="flex space-x-1 rounded-xl bg-black/10 p-1">
          <button
            onClick={() => setActiveTab("tree")}
            className={`flex cursor-pointer items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "tree"
                ? "bg-theme-surface text-indigo-500 shadow-sm"
                : "text-theme-muted hover:text-theme-text"
            }`}
          >
            <FolderTree size={14} />
            <span>Ağaç Görünümü</span>
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`flex cursor-pointer items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "report"
                ? "bg-theme-surface text-indigo-500 shadow-sm"
                : "text-theme-muted hover:text-theme-text"
            }`}
          >
            <BarChart3 size={14} />
            <span>Büyük Dosya Raporu</span>
            {scannedTree && bigFilesReport.length > 0 && (
              <span className="py-0.2 animate-bounce rounded-full bg-amber-500 px-1.5 font-mono text-[9px] text-white">
                {bigFilesReport.length}
              </span>
            )}
          </button>
        </div>

        {/* 🚀 SAĞ AKSİYON PANELİ: Filtre ve Kopyalama Butonları */}
        {scannedTree && (
          <div className="flex items-center space-x-1.5">
            {/* Kopyalama Araçları (Her iki sekmede de çok kullanışlı olur) */}
            <button
              onClick={() => handleCopy("json")}
              title="JSON Olarak Kopyala"
              className="bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border flex cursor-pointer items-center space-x-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors"
            >
              {copiedType === "json" ? (
                <Check size={13} className="text-emerald-500" />
              ) : (
                <Code size={13} />
              )}
              <span className="hidden sm:inline">
                {copiedType === "json" ? "Kopyalandı" : "JSON"}
              </span>
            </button>

            <button
              onClick={() => handleCopy("md")}
              title="Markdown Ağacı Olarak Kopyala"
              className="bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border flex cursor-pointer items-center space-x-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors"
            >
              {copiedType === "md" ? (
                <Check size={13} className="text-emerald-500" />
              ) : (
                <FileText size={13} />
              )}
              <span className="hidden sm:inline">
                {copiedType === "md" ? "Kopyalandı" : "Markdown"}
              </span>
            </button>

            {/* Sadece Ağaç Görünümündeyse Süzme Butonu Çıkar */}
            {activeTab === "tree" && (
              <button
                onClick={() => setShowOnlyFiltered(!showOnlyFiltered)}
                className={`flex cursor-pointer items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all duration-150 ${
                  showOnlyFiltered
                    ? "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border"
                }`}
              >
                {showOnlyFiltered ? <EyeOff size={13} /> : <Eye size={13} />}
                <span className="hidden md:inline">
                  {showOnlyFiltered ? "Hepsini Göster" : "Eşleşenleri Süz"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* İçerik Alanı */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "tree" ? (
          <div className="border-theme-border/30 custom-scrollbar bg-theme-surface/10 h-full overflow-y-auto rounded-lg border py-2">
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
                  Lütfen tarama sayfasından bir klasör seçin.
                </p>
              </div>
            )}
          </div>
        ) : (
          <FileInfoReportTab />
        )}
      </div>
    </div>
  );
};
