import React from "react";
import { Folder, FileText, Settings, Menu } from "lucide-react";
import { DescPatternManager } from "./file-info/file-info-manager";

export const AppLayout: React.FC = () => {
  return (
    <div className="bg-theme-surface text-theme-text flex h-screen w-screen flex-col overflow-hidden font-sans select-none">
      {/* 1. ÜST TOOLBAR (Boşluk yaratan sınır çizgisi kaldırıldı, tam genişlik sağlandı) */}
      <div className="m-0 block w-full shrink-0 p-0">FormHeader</div>

      {/* 2. ANA ÇALIŞMA ALANI (Üst kısım ile sıfıra sıfır birleşmesi sağlandı) */}
      <div className="flex min-h-0 w-full flex-1 overflow-hidden">
        {/* 2A. SOL GEZGİN PANELİ */}
        <aside className="bg-theme-surface/50 border-theme-border flex min-h-0 w-64 shrink-0 flex-col border-r">
          {/* Panel Başlığı */}
          <div className="border-theme-border text-theme-muted border-b p-3 text-[10px] font-bold tracking-wider uppercase">
            Gezgin
          </div>
          {/* İÇ SCROLL PANELİ */}
          <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
            sidebar
          </div>
        </aside>

        {/* 2B. MERKEZİ PANEL */}
        <main className="bg-theme-bg flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* TAB BAR / ÇALIŞMA ALANI BAŞLIĞI */}
          <div className="bg-theme-surface/30 border-theme-border flex h-10 shrink-0 items-center justify-between border-b px-4">
            sub-menu
          </div>

          {/* ASIL İÇERİK KUTUSU */}
          <div className="min-h-0 flex-1 overflow-auto p-2">content</div>
        </main>
      </div>

      {/* 3. ALT DURUM ÇUBUĞU */}
      <footer className="border-theme-border bg-theme-surface text-theme-muted flex h-6 shrink-0 items-center justify-between border-t px-4 text-[10px]">
        <div>Durum: Hazır</div>
        <div className="font-mono">LN 1, Col 1</div>
      </footer>
    </div>
  );
};
