import React, { useState, useMemo } from "react";
import {
  FolderTree,
  RefreshCw,
  Layers,
  CheckSquare,
  Square,
  Search,
} from "lucide-react";
import { useData } from "./context/fi-data-provider";
import { FileInfo } from "./context/fi-types";

// --- 🚀 1. EN ALT SATIR BİLEŞENİ (MEMOIZED PATTERN ROW) ---
// Sadece kendi prop'ları değiştiğinde re-render olur. Arama kutusuna harf yazılması bunu etkilemez!
const PatternRow = React.memo(
  ({
    pattern,
    onToggle,
  }: {
    pattern: FileInfo;
    onToggle: (expr: string) => void;
  }) => {
    return (
      <label
        className={`hover:bg-theme-surface-hover/50 flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors duration-150 ${
          pattern.checked
            ? "border border-indigo-500/20 bg-indigo-600/10"
            : "border border-transparent"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center space-x-2.5">
          <button
            type="button"
            onClick={() => onToggle(pattern.expression)} // Güvenli tetikleme
            className={`shrink-0 transition-colors ${pattern.checked ? "text-indigo-500" : "text-gray-400 hover:text-gray-500"}`}
          >
            {pattern.checked ? <CheckSquare size={14} /> : <Square size={14} />}
          </button>
          <div className="flex min-w-0 flex-col">
            <span className="text-theme-primary truncate font-mono text-xs font-medium">
              {pattern.expression}
            </span>
            {pattern.group && (
              <span className="text-theme-muted truncate text-[10px] font-medium">
                {pattern.group}
              </span>
            )}
          </div>
        </div>
        {pattern.ignore && (
          <span className="py-0.2 ml-2 shrink-0 rounded border border-red-500 px-1 text-[9px] font-semibold">
            ignore
          </span>
        )}
      </label>
    );
  },
  (prev, next) => {
    // Optimizasyon kontrolü: Sadece checked veya ignore durumu değiştiyse render et
    return (
      prev.pattern.checked === next.pattern.checked &&
      prev.pattern.ignore === next.pattern.ignore
    );
  },
);

// --- 🚀 2. SEKSİYON BİLEŞENİ (MEMOIZED SECTION) ---
const RenderSection = React.memo(
  ({
    title,
    items,
    icon: Icon,
    onToggle,
  }: {
    title: string;
    items: FileInfo[];
    icon: any;
    onToggle: (expr: string) => void;
  }) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1">
        <div className="text-theme-muted flex items-center space-x-1.5 border-b px-2 pb-0.5 text-[10px] font-bold tracking-wider uppercase">
          <Icon size={12} className="opacity-70" />
          <span>
            {title} ({items.length})
          </span>
        </div>
        <div className="space-y-0.5 pl-1">
          {items.map((pattern) => (
            <PatternRow
              key={pattern.expression}
              pattern={pattern}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    );
  },
);

// --- 🚀 3. ANA SIDEBAR BİLEŞENİ ---
export const FileInfoViewerSidebar: React.FC = () => {
  const { patterns, toggleChecked, resetPatterns } = useData();
  const [sidebarSearch, setSidebarSearch] = useState("");

  const groupedPatterns = useMemo(() => {
    const searchLower = sidebarSearch.toLowerCase();
    const filtered = patterns.filter(
      (p) =>
        p.expression.toLowerCase().includes(searchLower) ||
        p.group.toLowerCase().includes(searchLower),
    );

    return {
      regular: filtered.filter((p) => p.kind === "1-regular"),
      regex: filtered.filter((p) => p.kind === "2-regExp"),
      extension: filtered.filter((p) => p.kind === "3-ext"),
    };
  }, [patterns, sidebarSearch]);

  return (
    <div className="bg-theme-surface/30 border-theme-border flex h-full w-80 shrink-0 flex-col space-y-2 overflow-hidden border-r p-2">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center space-x-2">
          <FolderTree size={16} className="text-indigo-500" />
          <h3 className="text-theme-text text-sm font-bold tracking-tight">
            Şema Kuralları
          </h3>
        </div>
        <button
          onClick={resetPatterns}
          title="Reset System Schema"
          className="text-theme-muted hover:text-theme-text hover:bg-theme-surface rounded-md p-1 transition-colors duration-150"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="relative shrink-0">
        <Search
          className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
          size={13}
        />
        <input
          type="text"
          placeholder="Şema kuralı ara..."
          value={sidebarSearch}
          onChange={(e) => setSidebarSearch(e.target.value)}
          className="bg-theme-surface w-full rounded-lg border border-gray-300 py-1.5 pr-3 pl-8 text-xs focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-1">
        <RenderSection
          title="Tam eşleşme kuralları"
          items={groupedPatterns.regular}
          icon={Layers}
          onToggle={toggleChecked} // 🚀 Optimize fonksiyon aktarımı
        />
        <RenderSection
          title="Regex / Tarih Eşleşmeleri"
          items={groupedPatterns.regex}
          icon={FolderTree}
          onToggle={toggleChecked}
        />
        <RenderSection
          title="Dosya Uzantıları"
          items={groupedPatterns.extension}
          icon={Layers}
          onToggle={toggleChecked}
        />

        {patterns.length === 0 && (
          <div className="text-theme-muted px-2 py-8 text-center text-xs">
            Aktif şema kuralı bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
};
