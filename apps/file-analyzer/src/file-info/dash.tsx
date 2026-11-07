import React from "react";
import { PatternSidebar } from "./file-info-filter-panel";
import { UniversalFileScanner } from "./uni-scanner";
import { FileTreeView } from "./fitree";
import { usePatterns } from "./file-info-dataprovider";
import { LayoutGrid, Info } from "lucide-react";

export const FileAnalyzerDashboard: React.FC = () => {
  const { scannedTree } = usePatterns();

  return (
    <div className="bg-theme-background border-theme-border flex h-[calc(100vh-2rem)] w-full gap-4 overflow-hidden rounded-2xl border p-4 shadow-sm">
      {/* 🧭 SOL PANEL: Şema Gezgini ve Filtreleme Sidebar'ı */}
      <div className="flex h-full shrink-0">
        <PatternSidebar />
      </div>

      {/* 🖥️ SAĞ ÇALIŞMA ALANI: Tarayıcı Motoru ve Rekürsif Ağaç Grafiği */}
      <div className="flex h-full flex-1 flex-col space-y-4 overflow-hidden">
        {/* Üst Bilgilendirme ve Dashboard Başlığı */}
        <div className="bg-theme-surface/10 border-theme-border/40 flex shrink-0 items-center justify-between rounded-xl border p-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-indigo-600/10 p-2 text-indigo-500">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h1 className="text-theme-text text-base font-bold tracking-tight">
                File Analyzer Dashboard
              </h1>
              <p className="text-theme-muted text-xs">
                Şema kurallarına göre yerel klasör yapılarını ve uzantıları
                gerçek zamanlı filtreleyin.
              </p>
            </div>
          </div>

          {/* Sistem Özet Rozeti */}
          {scannedTree && (
            <div className="shadow-3xs hidden items-center space-x-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:flex">
              <Info size={12} />
              <span>Hafıza Ağacı Aktif</span>
            </div>
          )}
        </div>

        {/* 🚀 EVRENSEL TARAYICI KATMANI: Sürükle-bırak ve Picker Girişi */}
        <div className="shrink-0">
          <UniversalFileScanner />
        </div>

        {/* 🌳 REKÜRSİF HİYERARŞİ ALANI: Dosya/Klasör Ağaç Listesi */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <FileTreeView />
        </div>
      </div>
    </div>
  );
};
