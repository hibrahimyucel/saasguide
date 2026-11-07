import React from "react";
import { FileInfo } from "./context/fi-types";

interface TabsProps {
  patterns: FileInfo[];
  activeFilter: "all" | "ignore" | "extension";
  onFilterChange: (filter: "all" | "ignore" | "extension") => void;
}

export const FileInfoEditorTabs: React.FC<TabsProps> = ({
  patterns,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[
        { id: "all", label: "Hepsi", count: patterns.length },
        {
          id: "ignore",
          label: "Yoksayılanlar",
          count: patterns.filter((p) => p.ignore).length,
        },
        {
          id: "extension",
          label: "Uzantılar",
          count: patterns.filter((p) => p.extension).length,
        },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id as any)}
          className="btn-secondary"
        >
          {tab.label}
          <span
            className={`ml-1 rounded-full px-1 py-0.5 text-[10px] ${
              activeFilter === tab.id
                ? "text-theme-bg bg-theme-primary"
                : "bg-theme-bg text-theme-primary"
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};
