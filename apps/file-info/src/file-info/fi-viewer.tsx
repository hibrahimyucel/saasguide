/*
 * fi-viewer.tsx
 * Dosya listeleme formu
 */

import React from "react";
import { FileInfoViewerSidebar } from "./fi-viewer-sidebar";
import { useData } from "./context/fi-context";
import { LayoutGrid } from "lucide-react";
import { FileInfoFilePicker } from "./fi-file-picker";
import { FileInfoFileDropZone } from "./fi-file-dropzone";
import { FileInfoTreeView } from "./fi-viewer-tree";
import { FileInfoFolderButton } from "./fi-file-select";

const FileInfoViewerHeader: React.FC = () => {
  const { scannedTree, setScannedTree } = useData();
  return (
    <div className="bg-theme-surface/10 border-theme-border/40 flex shrink-0 items-center justify-between rounded-xl border p-3.5">
      <div className="flex items-center space-x-2.5">
        <div className="rounded-lg bg-indigo-600/10 p-2 text-indigo-500">
          <LayoutGrid size={18} />
        </div>
        <div>
          <h1 className="text-theme-text text-base font-bold tracking-tight">
            Dosya Listesi
          </h1>
          <p className="text-theme-muted text-xs">
            Şema kurallarına göre yerel klasör yapılarını ve uzantıları
            filtreleyin.
          </p>
        </div>
      </div>
      <div className="flex flex-row gap-1">
        {scannedTree && (
          <button
            className="btn-secondary"
            onClick={() => setScannedTree(null)}
          >
            Temizle
          </button>
        )}
        <FileInfoFolderButton />
      </div>{" "}
    </div>
  );
};

export const FileInfoViewer: React.FC = () => {
  const { scannedTree } = useData();

  return (
    <div className="bg-theme-background border-theme-border flex h-[calc(100vh-4rem)] w-full gap-4 overflow-hidden rounded-2xl border p-2 shadow-sm">
      <div className="flex h-full shrink-0">
        <FileInfoViewerSidebar />
      </div>

      <div className="flex h-full flex-1 flex-col space-y-4 overflow-hidden">
        <FileInfoViewerHeader />
        {/* 🚀 EVRENSEL TARAYICI KATMANI: Sürükle-bırak ve Picker Girişi */}
        {!scannedTree && (
          <div className="shrink-0">
            <FileInfoFilePicker />
            <FileInfoFileDropZone />
          </div>
        )}

        {scannedTree && (
          <div className="min-h-0 flex-1 overflow-hidden">
            <FileInfoTreeView />
          </div>
        )}
      </div>
    </div>
  );
};
