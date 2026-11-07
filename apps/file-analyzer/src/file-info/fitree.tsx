import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  File,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { usePatterns } from "./file-info-dataprovider";
import { FileNode } from "./file-info-types";

// --- REKÜRSIF TREE NODE BİLEŞENİ ---
const TreeNode: React.FC<{
  node: FileNode;
  depth: number;
  showOnlyFiltered: boolean;
}> = ({ node, depth, showOnlyFiltered }) => {
  const [isOpen, setIsOpen] = useState(depth < 2); // Kök ve ilk seviye klasörler varsayılan açık gelir

  // Eğer "Sadece filtrelenmişleri göster" aktifse ve bu düğüm/alt elemanları eşleşmiyorsa render etme
  const hasFilteredChildren = (n: FileNode): boolean => {
    if (n.filtered) return true;
    if (n.children)
      return n.children.some((child) => hasFilteredChildren(child));
    return false;
  };

  if (showOnlyFiltered && !hasFilteredChildren(node)) {
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
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span className="w-3.5 shrink-0" /> // Dosyalar için hizalama boşluğu
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
            <TreeNode
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

// --- ANA TREE VIEW PANELI ---
export const FileTreeView: React.FC = () => {
  const { scannedTree } = usePatterns();
  const [showOnlyFiltered, setShowOnlyFiltered] = useState(false);

  return (
    <div className="bg-theme-surface/30 border-theme-border flex h-full flex-1 flex-col space-y-3 overflow-hidden rounded-xl border p-4 shadow-xs">
      {/* Panel Üst Başlığı ve Filtreleme Araçları */}
      <div className="border-theme-border/60 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex flex-col">
          <h3 className="text-theme-text text-sm font-bold tracking-tight">
            Taranan Dosya Sistemi
          </h3>
          <p className="text-theme-muted text-[11px]">
            {scannedTree
              ? `Kök Dizin: ${scannedTree.name}`
              : "Henüz bir klasör taranmadı"}
          </p>
        </div>

        {/* Sadece Eşleşenleri Filtreleme Butonu */}
        {scannedTree && (
          <button
            onClick={() => setShowOnlyFiltered(!showOnlyFiltered)}
            className={`flex cursor-pointer items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all duration-150 ${
              showOnlyFiltered
                ? "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border"
            }`}
          >
            {showOnlyFiltered ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>
              {showOnlyFiltered ? "Hepsini Göster" : "Sadece Eşleşenleri Süz"}
            </span>
          </button>
        )}
      </div>

      {/* Ağaç Grafik Alanı */}
      <div className="border-theme-border/30 custom-scrollbar bg-theme-surface/10 flex-1 overflow-y-auto rounded-lg border py-2">
        {scannedTree ? (
          <TreeNode
            node={scannedTree}
            depth={0}
            showOnlyFiltered={showOnlyFiltered}
          />
        ) : (
          <div className="text-theme-muted flex h-full flex-col items-center justify-center space-y-1 py-12 text-center">
            <p className="text-xs font-medium">
              Görüntülenecek dosya ağacı bulunamadı.
            </p>
            <p className="text-[11px] opacity-75">
              Lütfen tarama sayfasından bir klasör sürükleyin veya seçin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
