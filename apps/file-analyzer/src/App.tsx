import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  ShieldAlert,
  Code,
  Eye,
  RefreshCw,
  Folder,
} from "lucide-react";
import type { FileNode, FileInfoSchema } from "./types";
import { generateDescMap } from "./types";
import { ProjectReport } from "./mdedit"; // Dosya yolunuza göre ayarlayın
import { ThemeSelector } from "./components/theme-selector";
import { DescPatternManager } from "./patternManager";
import { FileTree } from "./components/fileTree";
export default function App() {
  const [schema, setSchema] = useState<FileInfoSchema>(generateDescMap);
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"tree" | "markdown" | "patterns">(
    "tree",
  );
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // 3. Klasör açma/kapama fonksiyonu
  const toggleFolder = useCallback((name: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }, []);

  // 4. Dosya yolunu panoya kopyalama fonksiyonu
  const copyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path);
    alert(`Yol kopyalandı: ${path}`);
  }, []);

  // 5. Uzantıya göre dosya rengini belirleyen fonksiyon
  const getFileColor = useCallback((name: string) => {
    if (name.endsWith(".json")) return "text-yellow-500";
    if (name.endsWith(".ts") || name.endsWith(".tsx")) return "text-blue-500";
    if (name.endsWith(".md")) return "text-green-500";
    return "text-gray-400";
  }, []);

  // Bileşeninizin içinde (üst kısımda) bu state'leri tanımlayın:
  const [markdownPreview, setMarkdownPreview] = useState("");
  const [copied, setCopied] = useState(false);

  // Kopyalama fonksiyonu
  const handleCopy = async () => {
    if (!markdownPreview) return;

    try {
      await navigator.clipboard.writeText(markdownPreview);
      setCopied(true);

      // 2 saniye sonra butonu eski haline getir
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Kopyalama başarısız oldu:", err);
    }
  };

  const getDescription = (name: string) => {
    const lowerName = name.toLowerCase();

    // 1. Liste: customIgnoreList (Tam String Eşleşmesi)
    const customMatch = schema.List.find(
      (d) => d.expression.toLowerCase() === lowerName,
    );
    if (customMatch)
      return { isIgnored: customMatch.ignore, desc: customMatch.description };

    // 2. Liste: regExpIgnoreList (RegExp Testi)
    const regexMatch = schema.RegExp.find((d) => d.regExp?.test(name));
    if (regexMatch)
      return { isIgnored: regexMatch.ignore, desc: regexMatch.description };

    // 3. Liste: extensionDescriptions (Uzantı Karşılaştırması)
    // Dosya adının son noktasından sonrasını alır (Örn: "index.test.ts" -> "ts")
    const fileExt = name.includes(".")
      ? name.split(".").pop()?.toLowerCase()
      : "";

    if (fileExt) {
      const extensionMatch = schema.Descriptions.find((d) => {
        const exprLower = d.expression.toLowerCase();
        // Listede uzantı ".ts" şeklinde noktalı da olsa, "ts" şeklinde noktasız da olsa ikisini de eşleştirir
        return exprLower === fileExt || exprLower === `.${fileExt}`;
      });

      if (extensionMatch)
        return {
          isIgnored: extensionMatch.ignore,
          desc: extensionMatch.description,
        };
    }

    // Hiçbir listede eşleşme bulunamazsa varsayılan değer
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

          // YENİ: Eğer klasör taranmışsa ve içi tamamen boşsa uyar
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

  useEffect(() => {
    // Sadece bir kere çalışmasını istediğin kodlar burada yer alır
    console.log("Bileşen ilk kez render oldu.");
  }, []); // <-- Boş bağımlılık dizisi

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-900 font-sans text-slate-100">
      <header className="bg-vp-bg z-10 flex h-16 flex-shrink-0 items-center justify-between border-b px-6 shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="animate-pulse text-indigo-500" size={24} />
          <div>
            <h1
              className="text-base font-bold tracking-wide"
              style={{
                color: "var(--vp-c-text-2)",
                fontFamily: "var(--vp-font-family-base)",
              }}
            >
              Monorepo File Analyzer
            </h1>
            <p className="text-[10px]" style={{ color: "var(--vp-c-text-2)" }}>
              Gelişmiş Kural Filtre Paneli
            </p>
          </div>
        </div>{" "}
        <ThemeSelector />
        <button
          onClick={handleSelectDirectory}
          disabled={isScanning}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-indigo-500 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
          {isScanning
            ? "Klasör Yapısı Taranıyor..."
            : "Klasör Seç ve Analiz Et"}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-80 flex-shrink-0 space-y-6 overflow-y-auto border-r border-slate-800 bg-slate-950/40 p-5">
          {/* Üst Ayar Kartı: Boyut ve Boş Klasör Kontrolü */}
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              📦 Akıllı Analiz Ayarları
            </h3>

            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400">
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
                  className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-center font-mono text-xs text-white"
                />
                <span className="text-[11px] text-slate-400">
                  MB üstünü yoksay
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
              <span className="text-xs text-slate-300">
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
                className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
              />
            </div>
          </div>

          <h2 className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-200">
            <ShieldAlert size={16} className="text-indigo-400" /> Canlı Şema
            Kuralları
          </h2>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden bg-slate-900/30">
          <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/20 px-6">
            <div className="flex h-full gap-6">
              <button
                onClick={() => setActiveTab("tree")}
                className={`flex h-full items-center gap-1.5 border-b-2 px-1 text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === "tree" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              >
                <Eye size={14} /> Ağaç Görünümü
              </button>
              <button
                onClick={() => setActiveTab("markdown")}
                className={`flex h-full items-center gap-1.5 border-b-2 px-1 text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === "markdown" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              >
                <Code size={14} /> Markdown Raporu
              </button>
              <button
                onClick={() => setActiveTab("patterns")}
                className={`flex h-full items-center gap-1.5 border-b-2 px-1 text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === "markdown" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              >
                <Code size={14} /> edit
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-6">
            {!rootNode ? (
              <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-slate-500">
                <div className="rounded-2xl border border-slate-700/20 bg-slate-800/40 p-3 text-slate-400">
                  <Folder size={32} />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">
                  Analiz için klasör bekleniyor
                </h3>
              </div>
            ) : activeTab === "tree" ? (
              <div className="max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-950/30 p-5">
                <div className="mb-4 border-b border-slate-800/60 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Kök Dizin:{" "}
                  <span className="font-mono lowercase text-white">
                    {rootNode.name}
                  </span>
                </div>
                <div
                  className="scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent h-[550px] overflow-y-auto scroll-smooth rounded-xl border border-slate-900 bg-slate-950/50 p-4 pr-2 focus:outline-none"
                  style={{
                    // Tailwind eklentiniz yoksa ham CSS ile modern/ince kaydırma çubuğu desteği
                    scrollbarWidth: "thin",
                    scrollbarColor: "#334155 transparent",
                  }}
                >
                  <div className="tree-title">Proje Klasör Yapısı</div>

                  <FileTree
                    items={[rootNode]}

                    copyPath={copyPath}
                    getFileColor={getFileColor}
                  />
                </div>
              </div>
            ) : activeTab === "patterns" ? (
              /* YENİ EKLENEN BÖLÜM: Dark-mode uyumlu pattern yöneticisi */
              <div className="max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-950/30 p-5">
                <DescPatternManager />
              </div>
            ) : (
              <div className="max-w-5xl overflow-x-auto whitespace-pre rounded-2xl border border-slate-800 bg-slate-950/60 p-5 font-mono text-xs leading-relaxed text-slate-300">
                <ProjectReport rootNode={rootNode} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
