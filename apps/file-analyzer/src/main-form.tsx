import React from "react";
import { Folder, FileText, Menu } from "lucide-react";
import { ThemeSelector } from "./components/theme-selector";
import { ThemeTestDrive } from "./theme-test";
import { RefreshCw, Shield } from "lucide-react";

export const AppLayout: React.FC = () => {
  return (
    /* ANA CONTAINER: bg-theme-bg ve text-theme-text kullanılarak tüm sayfa temaya bağlandı */
    <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-theme-bg font-sans text-theme-text">
      {/* 1. ÜST TOOLBAR */}

      <header className="z-10 flex h-16 flex-shrink-0 items-center justify-between border-b bg-theme-surface px-6 shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="animate-pulse text-indigo-500" size={24} />
          <div>
            <h1 className="label-header">Monorepo File Analyzer</h1>
            <p className="label-sub">
              Saas Rehberi - Layout, Tema, Array İşlemleri
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            /*onClick={handleSelectDirectory}
          disabled={isScanning}*/
            className="btn-primary"
          >
            <RefreshCw size={14} className={"animate-none"} />
            Klasör Seç
          </button>
          <button
            /*onClick={handleSelectDirectory}
          disabled={isScanning}*/
            className="btn-primary"
          >
            <RefreshCw size={14} className={"animate-none"} />
            Dosya Listesi
          </button>
          <button
            /*onClick={handleSelectDirectory}
          disabled={isScanning}*/
            className="btn-primary gap-2"
          >
            <RefreshCw size={14} className={"animate-none"} />
            Ayarlar
          </button>
          <ThemeSelector />
          <button
            /*onClick={handleSelectDirectory}
          disabled={isScanning}*/
            className="btn-primary gap-2"
          >
            <RefreshCw size={14} className={"animate-none"} />
            Tema
          </button>
        </div>
      </header>

      {/* 2. ANA ÇALIŞMA ALANI */}
      <div className="flex min-h-0 w-full flex-1 overflow-hidden">
        {/* 2A. SOL GEZGİN PANELİ */}
        <aside className="bg-theme-surface/50 flex min-h-0 w-64 shrink-0 flex-col border-r border-theme-border">
          {/* Panel Başlığı */}
          <div className="border-b border-theme-border p-3 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
            Gezgin
          </div>
          {/* İÇ SCROLL PANELİ */}
          <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
            <button className="bg-theme-primary/10 flex w-full items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium text-theme-primary">
              <Folder size={14} className="text-theme-primary" />
              <span>Dosya Ağacı</span>
            </button>
            <button className="flex w-full items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium text-theme-muted transition hover:bg-theme-surface hover:text-theme-text">
              <FileText size={14} />
              <span>Raporlar</span>
            </button>
          </div>
        </aside>

        {/* 2B. MERKEZİ PANEL */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-theme-bg">
          {/* TAB BAR / ÇALIŞMA ALANI BAŞLIĞI */}
          <div className="bg-theme-surface/30 flex h-10 shrink-0 items-center justify-between border-b border-theme-border px-4">
            <div className="flex space-x-1">
              <span className="rounded border border-theme-border bg-theme-surface px-2 py-1 text-xs font-semibold text-theme-text">
                Desen Düzenleyici
              </span>
            </div>
          </div>

          {/* ASIL İÇERİK KUTUSU */}
          <div className="min-h-0 flex-1 space-y-6 overflow-auto p-2">
            <div className="max-w-5xl font-mono text-sm text-theme-muted">
              DescPatternManager
            </div>

            {/* Test Kartı */}
            <div className="panel-base">
              <h2 className="mb-2 text-xl font-bold text-theme-primary">
                Tema Başlığı
              </h2>

              <ThemeTestDrive />
            </div>
          </div>
        </main>
      </div>

      {/* 3. ALT DURUM ÇUBUĞU */}
      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-theme-border bg-theme-surface px-4 text-[10px] text-theme-muted">
        <div>Durum: Hazır</div>
        <div className="font-mono">LN 1, Col 1</div>
      </footer>
    </div>
  );
};
