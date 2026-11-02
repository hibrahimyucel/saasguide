import React, { useState } from "react";
import { FileNode } from "../types";
import {
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  Copy,
  EyeOff,
} from "lucide-react";

interface FileTreeProps {
  items: FileNode[];
  depth?: number;
  parentPath?: string;
  copyPath: (path: string) => void;
  getFileColor: (path: string) => string;
  RowReverse?: boolean;
}

export const FileTree: React.FC<FileTreeProps> = React.memo(
  ({
    items,
    depth = 0,
    parentPath = "",
    copyPath,
    getFileColor,
    RowReverse,
  }) => {
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

const FileTreeNodeItem: React.FC<{
  item: FileNode;
  currentPath: string;
  depth: number;
  copyPath: (path: string) => void;
  getFileColor: (path: string) => string;
  RowReverse?: boolean;
}> = React.memo(
  ({ item, currentPath, depth, copyPath, getFileColor, RowReverse }) => {
    const [isOpen, setIsOpen] = useState(false);

    const isFolder = item.kind === "directory";
    const isIgnored = item.isIgnored;
    const textColors = getFileColor(currentPath);

    return (
      <div className="group flex w-full flex-col">
        {/* Satır Kapsayıcısı: py-0.5 ile dikey yükseklik minimuma indirildi */}
        <div
          onClick={() => isFolder && setIsOpen((prev) => !prev)}
          className={`flex h-6 cursor-pointer select-none items-center gap-2 rounded px-2 py-0.5 leading-none transition-all duration-150 ${isOpen && isFolder ? "bg-slate-800/40 text-slate-100" : "text-slate-400 hover:bg-slate-800/20 hover:text-slate-200"} ${isIgnored ? "bg-slate-950/10 opacity-50 hover:opacity-80" : ""} "flex-row"}`}
        >
          {/* Sol Ok İkonu */}
          <div className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
            {isFolder && (
              <div
                className={`transform transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
              >
                <ChevronDown
                  size={12}
                  className="text-slate-500 group-hover:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* Tip İkonu */}
          <div className="flex flex-shrink-0 items-center justify-center">
            {isFolder ? (
              isOpen ? (
                <FolderOpen
                  size={14}
                  className={`fill-indigo-400/10 text-indigo-400 ${isIgnored ? "fill-transparent text-slate-600" : ""}`}
                />
              ) : (
                <Folder
                  size={14}
                  className={`fill-slate-400/5 text-slate-400 ${isIgnored ? "text-slate-600" : ""}`}
                />
              )
            ) : (
              <File
                size={13}
                className={`${isIgnored ? "text-slate-600" : textColors} opacity-85`}
              />
            )}
          </div>

          {/* Hizalama Alanı */}
          <div className="grid h-full min-w-0 flex-1 grid-cols-12 items-center gap-3">
            {/* İsim Bölümü */}
            <div className="col-span-7 flex min-w-0 items-center gap-1.5 truncate">
              <span
                className={`truncate py-0.5 text-xs font-medium ${!isFolder && !isIgnored ? textColors : "text-slate-300"} ${isIgnored ? "font-normal italic text-slate-500 line-through" : ""} `}
              >
                {item.name}
              </span>

              {item.size && !isIgnored && (
                <span className="flex-shrink-0 font-mono text-[9px] text-slate-600 transition-colors group-hover:text-slate-500">
                  ({item.size})
                </span>
              )}
            </div>

            {/* Açıklama Bölümü: Yükseklik taşmasını önlemek için py-0 yapıldı */}
            <div className="col-span-5 flex h-full min-w-0 items-center">
              <span className="flex h-[18px] w-full items-center gap-1 truncate rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500 shadow-inner">
                <EyeOff size={8} className="flex-shrink-0 text-amber-500/60" />
                <span className="truncate leading-none">
                  {item.description || "Filtrelendi"}
                </span>
              </span>
            </div>
          </div>

          {/* Aksiyon Butonu: Yoğunluğu bozmamak için daha küçük text ve padding uygulandı */}
          <div className="flex w-14 flex-shrink-0 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyPath(currentPath);
              }}
              className="flex items-center gap-0.5 rounded border border-slate-700/50 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 opacity-0 shadow-sm transition-all duration-150 hover:bg-indigo-600 hover:text-white group-hover:opacity-100"
            >
              <Copy size={9} />
            </button>
          </div>
        </div>

        {/* Alt Dallar */}
        {isFolder && isOpen && item.children && item.children.length > 0 && (
          <div className="my-0.5 ml-4 border-l border-slate-800/40 pl-2 transition-all duration-300">
            <FileTree
              items={item.children}
              depth={depth + 1}
              copyPath={copyPath}
              getFileColor={getFileColor}
              parentPath={currentPath}
              RowReverse={!RowReverse}
            />
          </div>
        )}
      </div>
    );
  },
);
