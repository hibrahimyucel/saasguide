import React, { useState, useCallback } from "react";
import { FileNode } from "../types";
import { FileTreeNodeItem } from "./file-info-tree-node";

interface FileTreeProps {
  items: FileNode[];
  depth?: number;
  parentPath?: string;
  RowReverse?: boolean;
}

export const FileTree: React.FC<FileTreeProps> = React.memo(
  ({ items, depth = 0, parentPath = "", RowReverse }) => {
    const copyPath = useCallback((path: string) => {
      navigator.clipboard.writeText(path);
      alert(`Yol kopyalandı: ${path}`);
    }, []);

    const getFileColor = useCallback((name: string) => {
      if (name.endsWith(".json")) return "text-amber-500 font-medium";
      if (name.endsWith(".ts") || name.endsWith(".tsx"))
        return "text-theme-primary font-medium";
      if (name.endsWith(".md")) return "text-emerald-500 font-medium";
      return "text-theme-muted";
    }, []);

    return (
      <div
        className={`flex flex-col ${depth > 0 ? "ml-2 border-l border-slate-800/60" : ""}`}
      >
        {items.map((item) => {
          const currentPath = parentPath
            ? `${parentPath}/${item.name}`
            : item.name;

          return (
            <FileTreeNodeItem
              key={currentPath}
              item={item}
              currentPath={currentPath}
              depth={depth}
              copyPath={copyPath}
              getFileColor={getFileColor}
              RowReverse={RowReverse}
            />
          );
        })}
      </div>
    );
  },
);
