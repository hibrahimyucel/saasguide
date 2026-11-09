// src/file-info/fi-viewer-treenode.tsx
import React, { useState, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  File,
  ChevronDown,
  ChevronRight,
  Target, // 🚀 "Matched" yazısı yerine nötr ve modern bir odak ikonu
} from "lucide-react";
import { FileNode } from "./context/fi-types";
import { formatBytes } from "./context/fi-data-helpers";

const FileInfoTreeNodeComponent: React.FC<{
  node: FileNode;
  depth: number;
  showOnlyFiltered: boolean;
}> = ({ node, depth, showOnlyFiltered }) => {
  const [isOpen, setIsOpen] = useState(depth < 2);

  useEffect(() => {
    if (node.hasFilteredChild) {
      setIsOpen(true);
    }
  }, [node.hasFilteredChild, showOnlyFiltered]);

  if (showOnlyFiltered && !node.isFiltered && !node.hasFilteredChild) {
    return null;
  }

  const isDir = node.isDirectory;
  const isFiltered = node.isFiltered;

  return (
    <div className="flex flex-col select-none">
      {/* 🚀 SATIR ÖĞESİ: 4 Sütunlu Grid Düzeni */}
      {/* 1. Sütun: Dosya Ağacı ve İsim (Esnek Alan) */}
      {/* 2. Sütun: Dosya Açıklaması (Sabit Genişlik - 180px) */}
      {/* 3. Sütun: Dosya Boyutu (Sabit Genişlik - 80px) */}
      {/* 4. Sütun: Eşleşme Durum Simgesi (Sabit Genişlik - 32px) */}
      <div
        onClick={() => isDir && setIsOpen(!isOpen)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`group relative grid grid-cols-[1fr_2fr_80px_32px] items-center border-l-2 py-1.5 pr-1 text-xs transition-all duration-150 ${
          isFiltered
            ? "border-indigo-500 bg-indigo-600/5 font-medium text-indigo-400"
            : "hover:bg-theme-surface/30 text-theme-text border-transparent"
        }`}
      >
        {/* 📁 1. SÜTUN: Ağaç Akışı ve Dosya/Klasör Adı */}
        <div className="flex min-w-0 items-center space-x-2">
          {/* Chevron İkonları */}
          {isDir ? (
            <span className="text-theme-muted group-hover:text-theme-text shrink-0 transition-colors">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
          <span className="truncate font-mono tracking-tight">{node.name}</span>
        </div>

        {/* 📝 2. SÜTUN: Ayrıştırılmış Bağımsız Açıklama Sütunu */}
        <div className="text-theme-muted truncate pl-2 font-mono text-[11px] tracking-tight">
          {node.description ? node.description : ""}
        </div>

        {/* 📊 3. SÜTUN: Dosya Boyutu Sütunu */}
        <div className="text-theme-muted group-hover:text-theme-text pr-3 text-right font-mono text-[10px] font-medium transition-colors">
          {!isDir && node.size !== undefined ? formatBytes(node.size) : ""}
        </div>

        {/* 🎯 4. SÜTUN: "Matched" Yazısı Yerine Nötr Durum Simgesi */}
        <div className="flex items-center justify-center">
          {isFiltered ? (
            <div
              className="animate-fadeIn text-indigo-400"
              title="Şema Eşleşmesi Mevcut"
            >
              <Target size={13} strokeWidth={2.5} />
            </div>
          ) : (
            // Eşleşme yoksa satır hover olduğunda beliren çok hafif nötr bir nokta çizgisi yer tutucu olabilir
            <div className="bg-theme-border/40 h-1 w-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
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
      prev.node === next.node && prev.showOnlyFiltered === next.showOnlyFiltered
    );
  },
);
