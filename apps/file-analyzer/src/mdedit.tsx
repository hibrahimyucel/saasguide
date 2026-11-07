import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FileNode {
  path: string;
  kind: "file" | "directory";
  size?: string | number;
  isIgnored?: boolean;
  matchedRule?: string | null;
  children?: FileNode[];
}

interface ProjectReportProps {
  rootNode: FileNode | null;
}

export const ProjectReport: React.FC<ProjectReportProps> = ({ rootNode }) => {
  const [markdownPreview, setMarkdownPreview] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  useEffect(() => {
    if (!rootNode) return;

    let md = `# Proje Yapı Analiz Raporu\n\n| Dosya / Klasör Yolu | Tip | Boyut | Durum | Açıklama |\n| :--- | :--- | :--- | :--- | :--- |\n`;

    const generateRow = (node: FileNode) => {
      md += `| \`${node.path}\` | ${node.kind === "directory" ? "📂" : "📄"} | ${node.size || "-"} | ${node.isIgnored ? "❌" : "✅"} | ${node.matchedRule || "-"} |\n`;
      node.children?.forEach(generateRow);
    };

    generateRow(rootNode);
    setMarkdownPreview(md);
  }, [rootNode]);

  const handleCopy = async () => {
    if (!markdownPreview) return;
    try {
      await navigator.clipboard.writeText(markdownPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Kopyalama başarısız oldu:", err);
    }
  };

  if (!rootNode) {
    return (
      <div className="border-theme-border text-theme-muted bg-theme-surface/10 rounded-xl border border-dashed p-8 text-center">
        Analiz edilecek proje verisi bulunamadı.
      </div>
    );
  }

  return (
    <div className="border-theme-border bg-theme-surface/20 w-full overflow-hidden rounded-xl border shadow-xs">
      {/* Üst Kontrol ve Sekme Paneli */}
      <div className="border-theme-border bg-theme-surface/50 flex flex-col justify-between gap-2 border-b px-4 py-2 sm:flex-row sm:items-center">
        {/* Sekmeler (Tablar) */}
        <div className="bg-theme-surface/80 border-theme-border/40 flex self-start rounded-lg border p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("preview")}
            className={`cursor-pointer rounded-md px-3 py-1.5 transition-all ${
              activeTab === "preview"
                ? "bg-theme-bg text-theme-text shadow-xs"
                : "text-theme-muted hover:text-theme-text"
            }`}
          >
            📊 Görsel Tablo
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`cursor-pointer rounded-md px-3 py-1.5 transition-all ${
              activeTab === "code"
                ? "bg-theme-bg text-theme-text shadow-xs"
                : "text-theme-muted hover:text-theme-text"
            }`}
          >
            💻 Markdown Kodu
          </button>
        </div>

        {/* Kopyala Butonu */}
        <button
          onClick={handleCopy}
          disabled={!markdownPreview}
          className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${copied ? "bg-emerald-600 text-white" : "btn-primary"}`}
        >
          {copied ? (
            <>
              <span>✓</span> Kopyalandı!
            </>
          ) : (
            <>
              <span>📋</span> Raporu Kopyala
            </>
          )}
        </button>
      </div>

      {/* İçerik Alanı */}
      <div className="bg-theme-bg max-h-150 overflow-auto p-4">
        {activeTab === "preview" ? (
          // GÖRSEL TABLO ÖNİZLEMESİ (Tema ile tam uyumlu)
          <div className="text-theme-text prose-table:w-full prose-table:border-collapse prose-th:bg-theme-surface prose-th:p-3 prose-th:font-semibold prose-th:text-theme-text prose-th:border-b prose-th:border-theme-border prose-td:p-3 prose-td:border-b prose-td:border-theme-border/40 prose-code:bg-theme-surface/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:text-theme-primary max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdownPreview}
            </ReactMarkdown>
          </div>
        ) : (
          // DÜZ MARKDOWN KODU ÖNİZLEMESİ
          <pre className="bg-theme-surface/40 border-theme-border text-theme-text overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-relaxed whitespace-pre sm:text-sm">
            {markdownPreview}
          </pre>
        )}
      </div>
    </div>
  );
};
