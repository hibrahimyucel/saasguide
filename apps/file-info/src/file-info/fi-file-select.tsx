import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  ShieldAlert,
  Code,
  Eye,
  RefreshCw,
  Folder,
  Layers,
} from "lucide-react";
import type { FileInfo, FileNode } from "./context/fi-types";
import { useData } from "./context/fi-data-provider";
type FilterStrategy = "1-exclude" | "2-shallow-add" | "3-flag-only";

export const FileInfoFolderButton = () => {
  const { patterns, setScannedTree, applyCurrentPatternsToTree } = useData();
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const evaluateFiltering = useCallback(
    (name: string, path: string): FileInfo | null => {
      if (patterns.length === 0) return null;

      const matchingRule = patterns.find((rule) => {
        const lowerName = name.toLowerCase();
        const lowerExpression = rule.expression.trim().toLowerCase();

        if (rule.kind === "2-regExp" && rule.regExp) {
          return rule.regExp.test(name) || rule.regExp.test(path);
        }
        // KOL 1: Uzantı Kontrolü (3-ext) -> RegExp yok, saf string kontrolü
        if (rule.extension || rule.kind === "3-ext") {
          return lowerName.endsWith(lowerExpression);
        }

        // KOL 2: Düz Metin Eşleşmesi (Joker Yok) -> RegExp yok, tam string kontrolü
        if (rule.kind === "1-regular" || !rule.regExp) {
          return lowerName === lowerExpression;
        }

        // KOL 3: RegExp / Joker Karakter Kontrolü (2-regExp) -> RegExp ile test
        // return rule.regExp.test(name) || rule.regExp.test(path);
      });

      return matchingRule ?? null;
    },
    [patterns],
  );

  const handleSelectDirectory = async () => {
    const filterStrategy: FilterStrategy = "2-shallow-add";
    const maxFileSizeMB: number = 1;
    const flagEmptyDirectories: boolean = true;

    try {
      // @ts-ignore
      const directoryHandle = await window.showDirectoryPicker();
      setIsScanning(true);

      const scan = async (
        handle: any,
        currentPath: string,
        depth: number,
      ): Promise<FileNode | null> => {
        const nodePath = `${currentPath}/${handle.name}`;

        const matchedFilter = evaluateFiltering(handle.name, nodePath);
        const isMatched = !!matchedFilter;

        // DÜZELTME: matchedFilter?.ignore şeklinde güvenli hale getirildi
        if (
          isMatched &&
          matchedFilter?.ignore &&
          (filterStrategy as string) === "1-exclude"
        ) {
          return null;
        }

        let isIgnored = matchedFilter ? matchedFilter.ignore : false;
        let matchedRule = matchedFilter ? matchedFilter.description : "";
        let nodeSizeStr = "";

        if (handle.kind === "file") {
          try {
            const fileData = await handle.getFile();
            const sizeInMB = fileData.size / (1024 * 1024);
            nodeSizeStr =
              sizeInMB < 0.1
                ? `${(fileData.size / 1024).toFixed(1)} KB`
                : `${sizeInMB.toFixed(2)} MB`;

            if (sizeInMB > maxFileSizeMB) {
              isIgnored = true;
              matchedRule += ` Boyut Sınırı İhlali (> ${maxFileSizeMB}MB)`;
            }
          } catch {}
        }

        const node: FileNode = {
          name: handle.name,
          path: nodePath,
          depth: depth,
          isDirectory: handle.kind === "directory",
          isIgnored: isIgnored,
          size: nodeSizeStr,
          description: matchedRule,

          // 🚀 DÜZELTME: Statik o anki checked durumunu atamak yerine,
          // reaktif takibin yapılabilmesi için eşleşen kuralın ifadesini match alanına güvenle yazıyoruz.
          match: matchedFilter ? matchedFilter.expression : undefined,
          filtered: matchedFilter ? matchedFilter.checked : false,
        };
        if (handle.kind === "directory") {
          const shouldScanChildren = !(
            isMatched && filterStrategy === "2-shallow-add"
          );

          if (shouldScanChildren) {
            node.children = [];
            for await (const entry of handle.values()) {
              const childNode = await scan(entry, node.path, depth + 1);

              if (childNode !== null) {
                node.children.push(childNode);
              }
            }

            if (flagEmptyDirectories && node.children.length === 0) {
              node.description += " ⚠️ Boş Klasör";
            } else {
              // DÜZELTME: node.children dizisinin varlığı garanti altına alınarak sıralandı
              node.children?.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name, "tr");
              });
            }
          }
        }

        return node;
      };

      const rootNode = await scan(directoryHandle, "", 0);

      if (rootNode) {
        applyCurrentPatternsToTree(rootNode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };
  // App.tsx içindeki handleSelectDirectory fonksiyonunun altına ekleyin:
  const handleDroppedFolder = async (directoryEntry: any) => {
    const filterStrategy: FilterStrategy = "2-shallow-add";
    const maxFileSizeMB: number = 1;
    const flagEmptyDirectories: boolean = true;

    try {
      setIsScanning(true);

      const scanDropped = async (
        entry: any,
        currentPath: string,
        depth: number,
      ): Promise<FileNode | null> => {
        const nodePath = `${currentPath}/${entry.name}`;

        const matchedFilter = evaluateFiltering(entry.name, nodePath);
        const isMatched = !!matchedFilter;

        if (
          isMatched &&
          matchedFilter?.ignore &&
          (filterStrategy as string) === "1-exclude"
        ) {
          return null;
        }

        let isIgnored = matchedFilter ? matchedFilter.ignore : false;
        let matchedRule = matchedFilter ? matchedFilter.description : "";
        let nodeSizeStr = "";

        if (entry.isFile) {
          try {
            const fileData: File = await new Promise((resolve, reject) =>
              entry.file(resolve, reject),
            );
            const sizeInMB = fileData.size / (1024 * 1024);
            nodeSizeStr =
              sizeInMB < 0.1
                ? `${(fileData.size / 1024).toFixed(1)} KB`
                : `${sizeInMB.toFixed(2)} MB`;

            if (sizeInMB > maxFileSizeMB) {
              isIgnored = true;
              matchedRule += ` Boyut Sınırı İhlali (> ${maxFileSizeMB}MB)`;
            }
          } catch {}
        }

        const node: FileNode = {
          name: entry.name,
          path: nodePath,
          depth: depth,
          isDirectory: entry.isDirectory,
          isIgnored: isIgnored,
          size: nodeSizeStr,
          description: matchedRule,
        };

        if (entry.isDirectory) {
          const shouldScanChildren = !(
            isMatched && filterStrategy === "2-shallow-add"
          );

          if (shouldScanChildren) {
            node.children = [];

            const dirReader = entry.createReader();
            let allEntries: any[] = [];
            let hasMoreEntries = true;

            // ÇÖZÜM: 100+ dosya sınırı için tüm elemanlar bitene kadar döngüde oku
            while (hasMoreEntries) {
              const chunkEntries: any[] = await new Promise((resolve) => {
                dirReader.readEntries(resolve);
              });

              if (chunkEntries.length > 0) {
                allEntries = allEntries.concat(chunkEntries);
              } else {
                hasMoreEntries = false; // Boş dizi döndüğünde tüm elemanlar okunmuştur
              }
            }

            // Toplanan tüm alt elemanları asenkron olarak işle
            for (const subEntry of allEntries) {
              const childNode = await scanDropped(
                subEntry,
                node.path,
                depth + 1,
              );

              if (childNode !== null) {
                node.children.push(childNode);
              }
            }

            if (flagEmptyDirectories && node.children.length === 0) {
              node.description += " ⚠️ Boş Klasör";
            } else {
              node.children?.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name, "tr");
              });
            }
          }
        }

        return node;
      };

      const parsedTree = await scanDropped(directoryEntry, "", 0);
      if (parsedTree) {
        setRootNode(parsedTree);
        setScannedTree(parsedTree);
      }
    } catch (e) {
      console.error("Sürükle bırak tarama hatası:", e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <button
      onClick={handleSelectDirectory}
      disabled={isScanning}
      className="btn-primary cursor-pointer gap-2 shadow-sm"
    >
      <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
      {isScanning ? "Taranıyor..." : "Klasör Seç"}
    </button>
  );
};
