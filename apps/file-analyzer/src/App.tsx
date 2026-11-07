import React, { useState } from "react";
import { AppHeader } from "./app-header";
import { useView } from "./file-info/file-info-provider";
import { FileInfoMain } from "./file-info/file-info-main";
import { FileInfoManager } from "./file-info/file-info-manager";
import { PatternProvider } from "./file-info/file-info-dataprovider";
import { FileAnalyzerDashboard } from "./file-info/dash";

export default function App() {
  const { activeView } = useView();
  return (
    <div className="panel-app">
      <AppHeader />
      <PatternProvider>
        {/* A) GEZGİN PANELİ (State Korumalı) */}
        {activeView === "explorer" && <FileAnalyzerDashboard />}
        {activeView === "editor" && <FileInfoManager />}
      </PatternProvider>
      <footer className="border-theme-border bg-theme-surface text-theme-muted flex h-6 shrink-0 items-center justify-between border-t px-4 text-[10px]">
        <div>Durum: {activeView}</div>
        <div className="font-mono">LN 1, Col 1</div>
      </footer>
    </div>
  );
}
