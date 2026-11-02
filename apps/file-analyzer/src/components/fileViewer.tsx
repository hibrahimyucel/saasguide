import React from "react";
import { FileNode, FileInfoSchema } from "../types";
import { analyzePathWithSchema } from "../utils/regexHelpers";
import { Code, FileCode, AlertCircle, Copy, Check } from "lucide-react";

interface FileViewerProps {
  selectedNode: FileNode | null;
  fileContent: string | null;
  schema: FileInfoSchema;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  selectedNode,
  fileContent,
  schema,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Dosya seçili değilse boş durum (Empty State) göster
  if (!selectedNode) {
    return (
      <div className="border-analyzer-border bg-analyzer-surface/30 backdrop-blur-xs flex h-full flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <Code size={40} className="text-analyzer-muted/60 mb-3 animate-pulse" />
        <h3 className="text-analyzer-primary text-base font-medium">
          Dosya Seçilmedi
        </h3>
        <p className="text-analyzer-muted mt-1 max-w-xs text-sm">
          İçeriğini, kod yapısını ve şema analizini görüntülemek için sol
          taraftaki ağaçtan bir dosya seçin.
        </p>
      </div>
    );
  }

  // Seçili dosyanın şema analizini yap
  const { isIgnored, desc } = analyzePathWithSchema(
    selectedNode.path,
    selectedNode.name,
    schema,
  );

  const handleCopy = async () => {
    if (!fileContent) return;
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Kopyalama başarısız oldu:", err);
    }
  };

  return (
    <div className="border-analyzer-border bg-analyzer-surface flex h-full flex-col overflow-hidden rounded-xl border shadow-sm backdrop-blur-md">
      {/* Üst Bar (Header) */}
      <div className="border-analyzer-border bg-analyzer-surface/50 flex items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-center space-x-3">
          <span className="text-analyzer-muted flex-shrink-0">
            <FileCode size={18} />
          </span>
          <div className="min-w-0">
            <h2
              className="text-analyzer-primary truncate text-sm font-semibold tracking-wide"
              title={selectedNode.name}
            >
              {selectedNode.name}
            </h2>
            <p
              className="text-analyzer-muted/70 truncate font-mono text-xs"
              title={selectedNode.path}
            >
              {selectedNode.path}
            </p>
          </div>
        </div>

        {/* Kopyalama Butonu */}
        {fileContent && (
          <button
            onClick={handleCopy}
            className="border-analyzer-border hover:bg-analyzer-surface text-analyzer-primary flex items-center space-x-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} className="text-green-500" />
                <span className="text-green-500">Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Kopyala</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Şema Bilgilendirme Rozeti (Meta Banner) */}
      {(desc || isIgnored) && (
        <div
          className={`border-analyzer-border/50 flex items-start space-x-2 border-b px-4 py-2 text-xs ${
            isIgnored
              ? "bg-amber-500/5 text-amber-600 dark:text-amber-400"
              : "bg-blue-500/5 text-blue-600 dark:text-blue-400"
          }`}
        >
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <div className="truncate">
            <span className="font-semibold">
              {isIgnored ? "Yoksayılan Dosya: " : "Dosya Bilgisi: "}
            </span>
            <span className="italic">
              {desc ||
                "Bu dosya tipi tanımlanan kurallar gereği analiz dışı bırakılmıştır."}
            </span>
          </div>
        </div>
      )}

      {/* Kod İçerik Alanı */}
      <div className="custom-scrollbar flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed">
        {fileContent !== null ? (
          fileContent.trim() === "" ? (
            <div className="text-analyzer-muted/50 flex h-full items-center justify-center italic">
              Dosya içeriği boş.
            </div>
          ) : (
            <pre className="text-analyzer-primary whitespace-pre-wrap break-all">
              <code>{fileContent}</code>
            </pre>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-2 py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-analyzer-muted text-xs">
              Dosya içeriği yükleniyor...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
