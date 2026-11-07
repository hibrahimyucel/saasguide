import React, { useState, useCallback } from "react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { useData } from "./context/fi-data-provider";
import { FileNode } from "./context/fi-types";

export const FileInfoFileDropZone: React.FC = () => {
  const { patterns, setScannedTree } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [scanStatus, setScanStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({
    type: "idle",
    message: "Analiz etmek istediğiniz klasörü bu alana sürükleyip bırakın",
  });

  const evaluateFiltering = useCallback(
    (name: string, path: string): boolean => {
      const activeRules = patterns.filter((p) => p.checked);
      if (activeRules.length === 0) return false;

      return activeRules.some((rule) => {
        if (!rule.regExp) return false;
        if (rule.extension) {
          return name.toLowerCase().endsWith(rule.expression.toLowerCase());
        }
        return rule.regExp.test(name) || rule.regExp.test(path);
      });
    },
    [patterns],
  );

  const parseEntry = async (
    entry: any,
    relativePath: string = "",
  ): Promise<FileNode | null> => {
    const currentPath = relativePath
      ? `${relativePath}/${entry.name}`
      : entry.name;
    const isFiltered = evaluateFiltering(entry.name, currentPath);

    if (entry.isFile) {
      return {
        name: entry.name,
        path: currentPath,
        isDirectory: false,
        filtered: isFiltered,
      };
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async (): Promise<any[]> => {
        let allEntries: any[] = [];
        const readEntries = async () => {
          const entries = await new Promise<any[]>((resolve, reject) =>
            dirReader.readEntries(resolve, reject),
          );
          if (entries.length > 0) {
            allEntries = allEntries.concat(entries);
            await readEntries();
          }
        };
        await readEntries();
        return allEntries;
      };

      const entries = await readAllEntries();
      const childrenNodes: FileNode[] = [];

      for (const childEntry of entries) {
        const childNode = await parseEntry(childEntry, currentPath);
        if (childNode) childrenNodes.push(childNode);
      }

      return {
        name: entry.name,
        path: currentPath,
        isDirectory: true,
        children: childrenNodes,
        filtered: isFiltered,
      };
    }
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setScanStatus({
      type: "loading",
      message: "Klasör hiyerarşisi asenkron olarak çözümleniyor...",
    });

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (typeof item.webkitGetAsEntry === "function") {
          const entry = item.webkitGetAsEntry();

          if (entry) {
            const rootNode = await parseEntry(entry);

            if (rootNode) {
              setScanStatus({
                type: "success",
                message: `Sürüklenen klasör başarıyla tarandı: ${rootNode.name}`,
              });
              setScannedTree(rootNode);
              return;
            }
          }
        }
      }

      throw new Error(
        "Sürüklenen veri kümesinden geçerli bir hiyerarşi çözümlenemedi.",
      );
    } catch (error: any) {
      console.error("Sürükle-Bırak Tarama Hatası:", error);
      setScanStatus({
        type: "error",
        message: `Tarama hatası: ${error.message || error}`,
      });
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-theme-surface/20 border-theme-border flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
        isDragging
          ? "border-indigo-500 bg-indigo-500/5 shadow-inner"
          : "hover:bg-theme-surface/40"
      }`}
    >
      <div className="mb-3 rounded-full bg-indigo-600/10 p-3 text-indigo-500">
        <UploadCloud size={24} className={isDragging ? "animate-bounce" : ""} />
      </div>

      <div className="space-y-1">
        <p className="text-theme-text text-sm font-semibold">
          {scanStatus.type === "loading"
            ? "Sürüklenen Klasör Taranıyor..."
            : "Sürükle-Bırak Modülü"}
        </p>
        <p className="text-theme-muted text-xs">{scanStatus.message}</p>
      </div>

      {scanStatus.type !== "idle" && (
        <div
          className={`mt-4 flex items-center space-x-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${
            scanStatus.type === "loading"
              ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
              : scanStatus.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {scanStatus.type === "loading" && (
            <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
          )}
          {scanStatus.type === "success" && <CheckCircle2 size={12} />}
          {scanStatus.type === "error" && <AlertCircle size={12} />}
          <span className="capitalize">{scanStatus.type}</span>
        </div>
      )}
    </div>
  );
};
