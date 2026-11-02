import React from "react";
import { FileNode } from "./types";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  FileText,
} from "lucide-react";

interface TreeRowProps {
  item: FileNode;
  depth: number;
  isCollapsed: boolean;
  onToggleFolder: (name: string) => void;
  onCopyPath: (name: string) => void;
  getFileColor: (name: string) => string;
}

export const TreeRow: React.FC<TreeRowProps> = React.memo(
  ({ item, depth, isCollapsed, onToggleFolder, onCopyPath, getFileColor }) => {
    const isFolder = item.kind === "directory";
    // Tailwind'e dinamik padding yerine sınıflarla destek veriyoruz
    const paddingLeftClass = `pl-[${depth * 20}px]`;

    if (isFolder) {
      return (
        <div
          onClick={() => onToggleFolder(item.name)}
          className={`group flex cursor-pointer items-center justify-between bg-slate-200/10`}
        >
          <span className="flex-shrink-0 p-3">
            {isCollapsed ? <Folder size={16} /> : <FolderOpen size={16} />}
          </span>

          <span className="item-name">{item.name}</span>

          <span className="item-desc">{item.description}</span>
        </div>
      );
    }

    return (
      <div
        className={`group flex cursor-pointer items-center justify-between bg-blue-100/30`}
        style={{ color: getFileColor(item.name) }}
      >
        <div className="text-xs">
          <span className="flex-shrink-0 p-3">
            <FileText size={16} />
          </span>
          <span className="item-name">{item.name}</span>
        </div>
        <span className="item-desc">{item.description}</span>
      </div>
    );
  },
);

// React DevTools'ta isimlendirme için
TreeRow.displayName = "TreeRow";
