// apps/file-info/src/components/SizeFilterPanel.tsx
import React from "react";
import { ArrowUpDown, HardDrive } from "lucide-react";
import { useData } from "./context/fi-context";
import { SizeFilter } from "./context/fi-types";

export const SizeFilterPanel: React.FC = () => {
  // NOT: DataProvider'ınızdan sizeFilter ve setSizeFilter metotlarını çektiğinizi varsayıyoruz
  const { sizeFilter, setSizeFilter } = useData();

  const handleModeChange = (mode: "all" | "greater" | "less") => {
    setSizeFilter({ ...sizeFilter, mode: mode });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSizeFilter({ ...sizeFilter, value: isNaN(val) ? 0 : val });
  };

  const handleUnitChange = (unit: "KB" | "MB") => {
    setSizeFilter({ ...sizeFilter, unit });
  };

  return (
    <div className="bg-theme-surface/50 border-theme-border/40 space-y-2 rounded-xl border p-2.5">
      {/* Başlık Başlığı */}
      <div className="text-theme-muted flex items-center space-x-1.5 px-1 text-[10px] font-bold tracking-wider uppercase">
        <HardDrive size={12} className="opacity-70" />
        <span>Ek Boyut Filtresi</span>
      </div>

      {/* 3'lü Mod Seçim Butonları (Segmented Control) */}
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/10 p-0.5">
        <button
          type="button"
          onClick={() => handleModeChange("all")}
          className={`cursor-pointer rounded-md py-1 text-center text-[10px] font-medium transition-all ${
            sizeFilter.mode === "all"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-theme-muted hover:text-theme-text"
          }`}
        >
          Hepsi
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("greater")}
          className={`cursor-pointer rounded-md py-1 text-center text-[10px] font-medium transition-all ${
            sizeFilter.mode === "greater"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-theme-muted hover:text-theme-text"
          }`}
        >
          Büyüktür (&gt;)
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("less")}
          className={`cursor-pointer rounded-md py-1 text-center text-[10px] font-medium transition-all ${
            sizeFilter.mode === "less"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-theme-muted hover:text-theme-text"
          }`}
        >
          Küçüktür (&lt;)
        </button>
      </div>

      {/* Değer ve Birim Girdi Alanları (Sadece Mod "all" değilse görünür) */}
      {sizeFilter.mode !== "all" && (
        <div className="animate-fadeIn flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={sizeFilter.value || ""}
              onChange={handleValueChange}
              className="bg-theme-surface w-full rounded-lg border border-gray-300 py-1.5 pr-3 pl-3 font-mono text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* KB / MB Seçim Butonu */}
          <div className="flex shrink-0 rounded-lg bg-black/10 p-0.5">
            {(["KB", "MB"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => handleUnitChange(u)}
                className={`cursor-pointer rounded-md px-2.5 py-1 font-mono text-[10px] font-bold transition-all ${
                  sizeFilter.unit === u
                    ? "bg-theme-surface text-indigo-500 shadow-xs"
                    : "text-theme-muted hover:text-theme-text"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
