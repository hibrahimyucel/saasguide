// src/file-info/fi-viewer-report-tab.tsx
import React from "react";
import { AlertTriangle, HardDrive, FileText, ChevronRight } from "lucide-react";
import { useData } from "./fi-context";
import { formatBytes } from "./fi-data-helpers";

export const FileInfoReportTab: React.FC = () => {
  const { bigFileThreshold, setBigFileThreshold, bigFilesReport, scannedTree } =
    useData();

  if (!scannedTree) {
    return (
      <div className="text-theme-muted flex h-full flex-col items-center justify-center space-y-1 py-12 text-center">
        <p className="text-xs font-medium">
          Analiz edilecek dosya sistemi bulunamadı.
        </p>
        <p className="text-[11px] opacity-75">
          Rapor oluşturmak için lütfen bir klasör taratın.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-3 overflow-hidden">
      {/* 📊 Eşik Değeri Ayar Kontrol Kartı */}
      <div className="bg-theme-surface/40 border-theme-border/40 flex items-center justify-between rounded-xl border p-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle size={15} className="animate-pulse text-amber-500" />
          <div className="flex flex-col">
            <span className="text-theme-text text-xs font-bold tracking-tight">
              Eşik Değeri Analizi
            </span>
            <span className="text-theme-muted text-[10px]">
              Belirtilen boyutun üzerindeki dosyalar listelenir.
            </span>
          </div>
        </div>

        {/* Eşik Değeri Girişi */}
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            value={bigFileThreshold.value}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setBigFileThreshold((prev) => ({
                ...prev,
                value: isNaN(val) ? 1 : val,
              }));
            }}
            className="bg-theme-surface w-20 rounded-lg border border-gray-300 px-2.5 py-1 text-center font-mono text-xs focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex rounded-lg bg-black/10 p-0.5">
            {(["KB", "MB"] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() =>
                  setBigFileThreshold((prev) => ({ ...prev, unit }))
                }
                className={`cursor-pointer rounded-md px-2 py-0.5 font-mono text-[10px] font-bold transition-all ${
                  bigFileThreshold.unit === unit
                    ? "bg-theme-surface text-indigo-500 shadow-2xs"
                    : "text-theme-muted hover:text-theme-text"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📋 Rapor Listeleme Alanı */}
      <div className="border-theme-border/30 custom-scrollbar bg-theme-surface/10 flex-1 overflow-y-auto rounded-lg border">
        {bigFilesReport.length > 0 ? (
          <div className="divide-theme-border/20 divide-y font-mono">
            {bigFilesReport.map((file, idx) => (
              <div
                key={`${file.path}-${idx}`}
                className="hover:bg-theme-surface/30 flex items-center justify-between px-3 py-2 text-xs transition-colors duration-150"
              >
                <div className="flex min-w-0 flex-1 items-center space-x-2.5">
                  <FileText size={14} className="text-theme-muted shrink-0" />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-theme-text truncate font-medium">
                      {file.name}
                    </span>
                    <span className="text-theme-muted flex max-w-xl items-center truncate text-[10px]">
                      root{" "}
                      <ChevronRight
                        size={10}
                        className="mx-0.5 inline opacity-60"
                      />{" "}
                      {file.path}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 pl-4 text-right text-[11px] font-semibold text-amber-500">
                  {formatBytes(file.size)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-theme-muted flex h-full flex-col items-center justify-center space-y-1 py-12 text-center">
            <HardDrive size={24} className="opacity-40" />
            <p className="text-xs font-medium">
              Kritik boyutta dosya tespit edilmedi.
            </p>
            <p className="text-[11px] opacity-75">
              {bigFileThreshold.value} {bigFileThreshold.unit} üzerinde dosya
              bulunmuyor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
