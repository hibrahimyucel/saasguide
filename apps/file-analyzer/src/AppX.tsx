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
import type { FileNode, FileInfoSchema } from "./types";
import { generateDescMap } from "./types";
import { ProjectReport } from "./mdedit";
import { ThemeSelector } from "./components/theme-selector";
import { DescPatternManager } from "./file-info/file-info-manager";
import { FileTree } from "./components/fileTree";
import { FolderDropZone } from "./components/folder-dropzone";

export default function App() {
  const [schema, setSchema] = useState<FileInfoSchema>(generateDescMap);
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"tree" | "markdown" | "patterns">(
    "tree",
  );
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [markdownPreview, setMarkdownPreview] = useState("");
  const [copied, setCopied] = useState(false);

  const toggleFolder = useCallback((name: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }, []);

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

  const getDescription = (name: string) => {
    const lowerName = name.toLowerCase();
    const customMatch = schema.List.find(
      (d) => d.expression.toLowerCase() === lowerName,
    );
    if (customMatch)
      return { isIgnored: customMatch.ignore, desc: customMatch.description };

    const regexMatch = schema.RegExp.find((d) => d.regExp?.test(name));
    if (regexMatch)
      return { isIgnored: regexMatch.ignore, desc: regexMatch.description };

    const fileExt = name.includes(".")
      ? name.split(".").pop()?.toLowerCase()
      : "";

    if (fileExt) {
      const extensionMatch = schema.Descriptions.find((d) => {
        const exprLower = d.expression.toLowerCase();
        return exprLower === fileExt || exprLower === `.${fileExt}`;
      });

      if (extensionMatch)
        return {
          isIgnored: extensionMatch.ignore,
          desc: extensionMatch.description,
        };
    }

    return { isIgnored: false, desc: "" };
  };

  const handleSelectDirectory = async () => {
    try {
      // @ts-ignore
      const directoryHandle = await window.showDirectoryPicker();
      setIsScanning(true);

      const scan = async (
        handle: any,
        currentPath: string,
        depth: number,
      ): Promise<FileNode> => {
        const check = getDescription(handle.name);
        let nodeSizeStr = "";
        let isIgnored = check.isIgnored;
        let matchedRule = check.desc;

        if (handle.kind === "file") {
          try {
            const fileData = await handle.getFile();
            const sizeInMB = fileData.size / (1024 * 1024);
            nodeSizeStr =
              sizeInMB < 0.1
                ? `${(fileData.size / 1024).toFixed(1)} KB`
                : `${sizeInMB.toFixed(2)} MB`;

            if (sizeInMB > schema.maxFileSizeMB) {
              isIgnored = true;
              matchedRule = `Boyut Sınırı İhlali (> ${schema.maxFileSizeMB}MB)`;
            }
          } catch {}
        }

        const node: FileNode = {
          name: handle.name,
          path: `${currentPath}/${handle.name}`,
          kind: handle.kind,
          depth: depth,
          isDirectory: handle.kind === "directory",
          isIgnored: isIgnored,
          size: nodeSizeStr,
          description: matchedRule,
        };

        if (handle.kind === "directory" && !node.isIgnored) {
          node.children = [];
          for await (const entry of handle.values()) {
            node.children.push(await scan(entry, node.path, depth + 1));
          }

          if (schema.flagEmptyDirectories && node.children.length === 0) {
            node.isIgnored = true;
            node.description = "⚠️ Boş Klasör Tespit Edildi";
          } else {
            node.children.sort((a, b) => {
              if (a.kind === "directory" && b.kind !== "directory") return -1;
              if (a.kind !== "directory" && b.kind === "directory") return 1;
              return a.name.localeCompare(b.name, "tr");
            });
          }
        }

        return node;
      };

      setRootNode(await scan(directoryHandle, "", 0));
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };
  // App.tsx içindeki handleSelectDirectory fonksiyonunun altına ekleyin:
  const handleDroppedFolder = async (directoryEntry: any) => {
    try {
      setIsScanning(true);

      // Sürükle bırak nesnelerini (FileSystemEntry) okuyan döngüsel tarayıcı
      const scanDropped = async (
        entry: any,
        currentPath: string,
        depth: number,
      ): Promise<FileNode> => {
        const check = getDescription(entry.name);
        let nodeSizeStr = "";
        let isIgnored = check.isIgnored;
        let matchedRule = check.desc;

        if (entry.isFile) {
          // Dosya boyutunu okuma logic'i
          try {
            const fileData: File = await new Promise((resolve, reject) =>
              entry.file(resolve, reject),
            );
            const sizeInMB = fileData.size / (1024 * 1024);
            nodeSizeStr =
              sizeInMB < 0.1
                ? `${(fileData.size / 1024).toFixed(1)} KB`
                : `${sizeInMB.toFixed(2)} MB`;

            if (sizeInMB > schema.maxFileSizeMB) {
              isIgnored = true;
              matchedRule = `Boyut Sınırı İhlali (> ${schema.maxFileSizeMB}MB)`;
            }
          } catch {}
        }

        const node: FileNode = {
          name: entry.name,
          path: `${currentPath}/${entry.name}`,
          kind: entry.isDirectory ? "directory" : "file",
          depth: depth,
          isDirectory: entry.isDirectory,
          isIgnored: isIgnored,
          size: nodeSizeStr,
          description: matchedRule,
        };

        if (entry.isDirectory && !node.isIgnored) {
          node.children = [];

          // Klasörün alt elemanlarını okuyoruz
          const dirReader = entry.createReader();
          const entries: any[] = await new Promise((resolve) => {
            dirReader.readEntries(resolve);
          });

          for (const subEntry of entries) {
            node.children.push(
              await scanDropped(subEntry, node.path, depth + 1),
            );
          }

          if (schema.flagEmptyDirectories && node.children.length === 0) {
            node.isIgnored = true;
            node.description = "⚠️ Boş Klasör Tespit Edildi";
          } else {
            node.children.sort((a, b) => {
              if (a.kind === "directory" && b.kind !== "directory") return -1;
              if (a.kind !== "directory" && b.kind === "directory") return 1;
              return a.name.localeCompare(b.name, "tr");
            });
          }
        }

        return node;
      };

      const parsedTree = await scanDropped(directoryEntry, "", 0);
      setRootNode(parsedTree);
    } catch (e) {
      console.error("Sürükle bırak tarama hatası:", e);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!rootNode) return;
    let md = `# Proje Yapı Analiz Raporu\n\n| Dosya / Klasör Yolu | Tip | Boyut | Durum | Açıklama |\n| :--- | :--- | :--- | :--- | :--- |\n`;
    const generateRow = (node: FileNode) => {
      md += `| \`${node.path}\` | ${node.kind === "directory" ? "📂" : "📄"} | ${node.size || "-"} | ${node.isIgnored ? "❌" : "✅"} | ${node.description || "-"} |\n`;
      node.children?.forEach(generateRow);
    };
    generateRow(rootNode);
    setMarkdownPreview(md);
  }, [rootNode, schema]);

  return (
    <div className="bg-theme-bg text-theme-text flex h-screen w-screen flex-col overflow-hidden transition-colors duration-200">
      <header className="border-theme-border bg-theme-surface/40 z-10 flex h-16 shrink-0 items-center justify-between border-b px-6 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Shield className="text-theme-primary animate-pulse" size={24} />
          <div>
            <h1 className="text-theme-text text-sm font-bold tracking-wide">
              Monorepo File Analyzer
            </h1>
            <p className="text-theme-muted text-[10px] font-medium">
              Gelişmiş Kural Filtre Paneli
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeSelector />
          <button
            onClick={handleSelectDirectory}
            disabled={isScanning}
            className="btn-primary cursor-pointer gap-2 shadow-sm"
          >
            <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
            {isScanning
              ? "Klasör Yapısı Taranıyor..."
              : "Klasör Seç ve Analiz Et"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="border-theme-border bg-theme-surface/20 w-80 shrink-0 space-y-6 overflow-y-auto border-r p-5">
          <div className="border-theme-border bg-theme-surface/60 space-y-4 rounded-xl border p-4 shadow-2xs">
            <h3 className="text-theme-primary flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
              <span>📦</span> Akıllı Analiz Ayarları
            </h3>

            <div className="space-y-1.5">
              <label className="text-theme-muted block text-[11px] font-semibold">
                Maksimum Dosya Boyutu:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={schema.maxFileSizeMB}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setSchema({ ...schema, maxFileSizeMB: val });
                    if (rootNode) setRootNode({ ...rootNode });
                  }}
                  className="input-base w-20! px-2! py-1! text-center font-mono text-xs"
                />
                <span className="text-theme-muted text-[11px] font-medium">
                  MB üstünü yoksay
                </span>
              </div>
            </div>

            <div className="border-theme-border/60 flex items-center justify-between border-t pt-3">
              <span className="text-theme-text text-xs font-medium">
                Boş Klasörleri İşaretle
              </span>
              <input
                type="checkbox"
                checked={schema.flagEmptyDirectories}
                onChange={(e) => {
                  setSchema({
                    ...schema,
                    flagEmptyDirectories: e.target.checked,
                  });
                  if (rootNode) setRootNode({ ...rootNode });
                }}
                className="border-theme-border bg-theme-bg text-theme-primary h-4 w-4 cursor-pointer rounded-sm focus:ring-0"
              />
            </div>
          </div>

          <h2 className="border-theme-border/60 text-theme-muted flex items-center gap-2 border-b pb-3 text-xs font-bold tracking-wider uppercase">
            <ShieldAlert size={15} className="text-theme-primary" /> Canlı Şema
            Kuralları
          </h2>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="border-theme-border bg-theme-surface/10 flex h-12 shrink-0 items-center justify-between border-b px-6">
            <div className="flex h-full gap-6">
              <button
                onClick={() => setActiveTab("tree")}
                className={`flex h-full cursor-pointer items-center gap-1.5 border-b-2 px-1 text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === "tree"
                    ? "border-theme-primary text-theme-primary"
                    : "text-theme-muted hover:text-theme-text border-transparent"
                }`}
              >
                <Eye size={14} /> Ağaç Görünümü
              </button>
              <button
                onClick={() => setActiveTab("markdown")}
                className={`flex h-full cursor-pointer items-center gap-1.5 border-b-2 px-1 text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === "markdown"
                    ? "border-theme-primary text-theme-primary"
                    : "text-theme-muted hover:text-theme-text border-transparent"
                }`}
              >
                <Code size={14} /> Markdown Raporu
              </button>
              <button
                onClick={() => setActiveTab("patterns")}
                className={`flex h-full cursor-pointer items-center gap-1.5 border-b-2 px-1 text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === "patterns"
                    ? "border-theme-primary text-theme-primary"
                    : "text-theme-muted hover:text-theme-text border-transparent"
                }`}
              >
                <Layers size={14} /> Kuralları Yönet
              </button>
            </div>
          </div>

          <div className="bg-theme-bg min-h-0 flex-1 overflow-auto p-6">
            {!rootNode ? (
              <div className="mx-auto mt-12 max-w-2xl">
                <FolderDropZone
                  isScanning={isScanning}
                  onSelectClick={handleSelectDirectory}
                  onFolderDrop={handleDroppedFolder} // Yeni fonksiyonumuza bağladık
                />
              </div>
            ) : activeTab === "tree" ? (
              <div className="border-theme-border bg-theme-surface/20 max-w-5xl rounded-2xl border p-5 shadow-2xs">
                <div className="border-theme-border/60 text-theme-muted mb-4 border-b pb-2 text-[11px] font-bold tracking-wider uppercase">
                  Kök Dizin:{" "}
                  <span className="text-theme-primary font-mono lowercase">
                    {rootNode.name}
                  </span>
                </div>
                <div
                  className="border-theme-border bg-theme-bg h-137.5 overflow-y-auto scroll-smooth rounded-xl border p-4 focus:outline-hidden"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "var(--color-theme-border) transparent",
                  }}
                >
                  <div className="text-theme-muted border-theme-border/30 mb-4 border-b pb-1 text-xs font-bold tracking-wider uppercase">
                    Proje Klasör Yapısı
                  </div>

                  <FileTree
                    items={[rootNode]}
                    copyPath={copyPath}
                    getFileColor={getFileColor}
                  />
                </div>
              </div>
            ) : activeTab === "patterns" ? (
              <div className="border-theme-border bg-theme-surface/20 max-w-5xl rounded-2xl border p-5 shadow-2xs">
                <DescPatternManager />
              </div>
            ) : (
              <div className="border-theme-border bg-theme-surface/30 text-theme-text max-w-5xl overflow-x-auto rounded-2xl border p-5 font-mono text-xs leading-relaxed shadow-2xs">
                <ProjectReport rootNode={rootNode} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
