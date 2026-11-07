import React, { useState, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  File,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { FileNode } from "./context/fi-types";

// --- REKÜRSIF TREE NODE BİLEŞENİ ---
const FileInfoTreeNodeComponent: React.FC<{
  node: FileNode;
  depth: number;
  showOnlyFiltered: boolean;
}> =
  //React.memo(
  ({ node, depth, showOnlyFiltered }) => {
    // 1. Hook tanımları HER ZAMAN en üstte yer almalı
    const [isOpen, setIsOpen] = useState(depth < 2);

    // Otomatik klasör açma tetikleyicisi
    useEffect(() => {
      if (node.hasFilteredChild) {
        setIsOpen(true);
      }
    }, [node.hasFilteredChild, showOnlyFiltered]);

    // 2. ERKEN DÖNÜŞ (Görünme Koşulu) KONTROLÜ HOOK'LARDAN SONRA YAPILMALI
    // "Sadece filtrelenenleri göster" modu aktifse ve bu düğümde eşleşme yoksa render etme
    if (showOnlyFiltered && !node.filtered && !node.hasFilteredChild) {
      return null;
    }

    const isDir = node.isDirectory;
    const isFiltered = node.filtered;

    return (
      <div className="flex flex-col select-none">
        {/* Satır Öğesi */}
        <div
          onClick={() => isDir && setIsOpen(!isOpen)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`group relative flex cursor-pointer items-center justify-between border-l-2 py-1.5 pr-3 text-xs transition-all duration-150 ${
            isFiltered
              ? "border-indigo-500 bg-indigo-600/5 font-medium text-indigo-400"
              : "hover:bg-theme-surface/30 text-theme-text border-transparent"
          }`}
        >
          <div className="flex min-w-0 items-center space-x-2">
            {/* Chevron İkonları (Sadece Klasörler İçin) */}
            {isDir ? (
              <span className="text-theme-muted group-hover:text-theme-text shrink-0 transition-colors">
                {isOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </span>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}

            {/* Dosya / Klasör Tipi İkonları */}
            <span
              className={
                isFiltered ? "text-indigo-400" : "text-theme-muted shrink-0"
              }
            >
              {isDir ? (
                isOpen ? (
                  <FolderOpen size={14} />
                ) : (
                  <Folder size={14} />
                )
              ) : (
                <File size={13} />
              )}
            </span>

            {/* Düğüm İsmi */}
            <span className="truncate font-mono tracking-tight">
              {node.name}
            </span>
            {node.description && (
              <span className="text-theme-muted ml-1 truncate font-mono tracking-tight">
                {node.description}
              </span>
            )}
          </div>

          {/* Eşleşen Şema Vurgu Etiketi */}
          {isFiltered && (
            <span className="ml-2 shrink-0 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-indigo-400 uppercase shadow-2xs">
              Matched
            </span>
          )}
        </div>

        {/* Alt Elemanlar (Rekürsif Çağrı) */}
        {isDir && isOpen && node.children && (
          <div className="flex flex-col">
            {node.children.map((child, idx) => (
              <FileInfoTreeNode
                key={`${child.path}-${idx}`}
                node={child}
                depth={depth + 1}
                showOnlyFiltered={showOnlyFiltered}
              />
            ))}
          </div>
        )}
      </div>
    );
  };
export const FileInfoTreeNode = React.memo(
  FileInfoTreeNodeComponent,
  (prev, next) => {
    return (
      prev.node.filtered === next.node.filtered &&
      prev.node.hasFilteredChild === next.node.hasFilteredChild &&
      prev.showOnlyFiltered === next.showOnlyFiltered
    );
  },
);
