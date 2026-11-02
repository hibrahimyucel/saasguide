import React, { useState } from "react";
import { FileNode, FileInfoSchema } from "../types";
import { analyzePathWithSchema } from "../utils/regexHelpers";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface FileTreeProps {
  node: FileNode;
  schema: FileInfoSchema;
  onFileSelect: (node: FileNode) => void;
  selectedPath?: string;
}

export const FileTree: React.FC<FileTreeProps> = ({
  node,
  schema,
  onFileSelect,
  selectedPath,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // file-info.json şemasına göre dosyanın durumunu analiz et
  const { isIgnored, desc } = analyzePathWithSchema(
    node.path,
    node.name,
    schema,
  );

  const toggleFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = () => {
    if (!node.isDirectory) {
      onFileSelect(node);
    }
  };

  // Aktif seçim ve ignore durumuna göre metin rengini belirle (Renk vurgusu dosya adlarında)
  const isSelected = selectedPath === node.path;

  const textColorClass = isIgnored
    ? "text-analyzer-muted/40 line-through select-none"
    : isSelected
      ? "text-blue-500 font-semibold dark:text-blue-400"
      : "text-analyzer-primary hover:text-blue-500 dark:hover:text-blue-400";

  return (
    <div className="select-none pl-4">
      {/* Satır Öğesi */}
      <div
        onClick={handleSelect}
        className={`group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition-colors duration-150 ${
          isSelected ? "bg-blue-500/10" : "hover:bg-analyzer-surface"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center space-x-2">
          {/* Klasör Aç/Kapat Oku */}
          {node.isDirectory && (
            <button
              onClick={toggleFolder}
              className="text-analyzer-muted hover:text-analyzer-primary rounded p-0.5 transition-colors"
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}

          {/* Tür İkonu (Sabit nötr renkler, vurgu dosya adında kalacak şekilde) */}
          <span className="text-analyzer-muted flex-shrink-0">
            {node.isDirectory ? (
              isOpen ? (
                <FolderOpen size={16} />
              ) : (
                <Folder size={16} />
              )
            ) : (
              <FileText size={16} />
            )}
          </span>

          {/* Dosya / Klasör Adı (Duyarlı kolon genişliği ve kırpma desteğiyle) */}
          <span
            className={`truncate text-sm tracking-wide ${textColorClass}`}
            title={node.name}
          >
            {node.name}
          </span>
        </div>

        {/* Dosya Açıklaması (file-info.json metadata desteği) */}
        {desc && !node.isDirectory && (
          <span className="text-analyzer-muted/60 hidden max-w-[200px] truncate pl-2 text-xs italic opacity-0 transition-opacity group-hover:opacity-100 md:inline">
            {desc}
          </span>
        )}
      </div>

      {/* Alt Klasörler / Dosyalar (Özyinelemeli / Recursive Render) */}
      {node.isDirectory && isOpen && node.children && (
        <div className="border-analyzer-border/40 mt-0.5 border-l">
          {node.children.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              schema={schema}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};
