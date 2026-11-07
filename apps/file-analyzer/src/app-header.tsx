import React from "react";
import { ThemeSelectorDropDown } from "./components/theme-selector-dropdown";
import { Shield } from "lucide-react";
import { useView } from "./file-info/file-info-provider";

export const AppHeader: React.FC = () => {
  const { activeView, setActiveView } = useView();
  return (
    <header className="panel-header border-theme-primary m-1 shrink-0 rounded-b-md p-1">
      <div className="flex min-h-0 items-center gap-3">
        <Shield className="label-header" />
        <div>
          <h1 className="label-header">File Analyzer</h1>
          <p className="label-sub">Saas Rehberi</p>
        </div>
      </div>

      {/* Form Kontrol Butonları */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setActiveView("explorer")}
          className={`rounded px-3 py-1 text-xs ${activeView === "explorer" ? "bg-theme-primary text-white" : ""}`}
        >
          Gezgin
        </button>
        <button
          onClick={() => setActiveView("editor")}
          className={`rounded px-3 py-1 text-xs ${activeView === "editor" ? "bg-theme-primary text-white" : ""}`}
        >
          Düzenleyici
        </button>

        <ThemeSelectorDropDown />
      </div>
    </header>
  );
};
