import React, { useState, useRef, useCallback } from "react";
import { Folder, CheckCircle2, AlertCircle } from "lucide-react";
import { useData } from "./context/fi-context";
import { FileNode } from "./context/fi-types";

export const FileInfoFilePicker: React.FC = () => {
  const { patterns, setScannedTree } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanStatus, setScanStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({
    type: "idle",
    message: "Dosya gezgini üzerinden bir dizin seçmek için tıklayın",
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

  const handleNativeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setScanStatus({
      type: "loading",
      message: "Seçilen dizin haritası çıkarılıyor...",
    });

    try {
      const rootNode: FileNode = {
        name: "Root",
        path: "",
        isDirectory: true,
        children: [],
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pathParts = file.webkitRelativePath.split("/");

        if (i === 0 && pathParts.length > 0) {
          rootNode.name = pathParts[0];
        }

        let currentLevel = rootNode;
        let cumulativePath = rootNode.name;

        for (let j = 1; j < pathParts.length; j++) {
          const part = pathParts[j];
          cumulativePath += `/${part}`;
          const isLast = j === pathParts.length - 1;

          if (!currentLevel.children) currentLevel.children = [];
          let existingNode = currentLevel.children.find((c) => c.name === part);

          if (!existingNode) {
            const isFiltered = evaluateFiltering(part, cumulativePath);
            const newNode: FileNode = {
              name: part,
              path: cumulativePath,
              isDirectory: !isLast,
              isFiltered,
              ...(isLast ? {} : { children: [] }),
            };
            currentLevel.children.push(newNode);
            existingNode = newNode;
          }
          currentLevel = existingNode;
        }
      }

      setScanStatus({
        type: "success",
        message: `Seçim başarıyla haritalandı: ${rootNode.name}`,
      });
      setScannedTree(rootNode);
    } catch (error: any) {
      console.error("Picker Tarama Hatası:", error);
      setScanStatus({
        type: "error",
        message: `Dizin yükleme hatası: ${error.message || error}`,
      });
    }
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      className="bg-theme-surface/20 border-theme-border hover:bg-theme-surface/40 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleNativeSelect}
        className="hidden"
        {...({ webkitdirectory: "", directory: "", multiple: true } as any)}
      />

      <div className="mb-3 rounded-full bg-indigo-600/10 p-3 text-indigo-500">
        <Folder size={24} />
      </div>

      <div className="space-y-1">
        <p className="text-theme-text text-sm font-semibold">
          {scanStatus.type === "loading"
            ? "Dizin Ayıklanıyor..."
            : "Yerel Klasör Seçici"}
        </p>
        <p className="text-theme-muted text-xs">{scanStatus.message}</p>
      </div>

      {scanStatus.type === "idle" && (
        <p className="text-theme-muted/60 mt-2 max-w-xs text-[10px] leading-relaxed">
          * Tarayıcınızın göstereceği "Yükle/Upload" onayı güvenlik amaçlıdır.
          Veriler tamamen yerel RAM üzerinde işlenir.
        </p>
      )}

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
