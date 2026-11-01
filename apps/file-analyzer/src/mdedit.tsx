import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FileNode {
    path: string;
    kind: 'file' | 'directory';
    size?: string | number;
    isIgnored?: boolean;
    matchedRule?: string | null;
    children?: FileNode[];
}

interface ProjectReportProps {
    rootNode: FileNode | null;

}

export const ProjectReport: React.FC<ProjectReportProps> = ({ rootNode }) => {
    const [markdownPreview, setMarkdownPreview] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

    useEffect(() => {
        if (!rootNode) return;

        let md = `# Proje Yapı Analiz Raporu\n\n| Dosya / Klasör Yolu | Tip | Boyut | Durum | Açıklama |\n| :--- | :--- | :--- | :--- | :--- |\n`;

        const generateRow = (node: FileNode) => {
            md += `| \`${node.path}\` | ${node.kind === 'directory' ? '📂' : '📄'} | ${node.size || '-'} | ${node.isIgnored ? '❌' : '✅'} | ${node.matchedRule || '-'} |\n`;
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
            console.error('Kopyalama başarısız oldu:', err);
        }
    };

    if (!rootNode) {
        return (
            <div className="text-center p-8 text-gray-500 border border-dashed border-gray-300 rounded-xl">
                Analiz edilecek proje verisi bulunamadı.
            </div>
        );
    }

    return (
        <div className="w-full border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Üst Kontrol ve Sekme Paneli */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200 gap-2">
                {/* Sekmeler (Tablar) */}
                <div className="flex bg-gray-200/80 p-1 rounded-lg self-start text-xs font-semibold">
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        📊 Görsel Tablo
                    </button>
                    <button
                        onClick={() => setActiveTab('code')}
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        💻 Markdown Kodu
                    </button>
                </div>

                {/* Kopyala Butonu */}
                <button
                    onClick={handleCopy}
                    disabled={!markdownPreview}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            ${copied ? 'bg-green-600 text-white shadow-green-100' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}
                >
                    {copied ? <><span>✓</span> Kopyalandı!</> : <><span>📋</span> Raporu Kopyala</>}
                </button>
            </div>

            {/* İçerik Alanı */}
            <div className="p-4 max-h-[600px] overflow-auto">
                {activeTab === 'preview' ? (
                    // GÖRSEL TABLO ÖNİZLEMESİ (Tailwind ile stillendirilmiş Tablo HTML çıktıları)
                    <div className="prose max-w-none 
            prose-table:w-full prose-table:border-collapse prose-table:text-sm prose-table:text-left
            prose-th:bg-gray-50 prose-th:p-3 prose-th:font-semibold prose-th:text-gray-700 prose-th:border-b prose-th:border-gray-200
            prose-td:p-3 prose-td:border-b prose-td:border-gray-100 prose-td:text-gray-600
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:text-red-600"
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {markdownPreview}
                        </ReactMarkdown>
                    </div>
                ) : (
                    // DÜZ MARKDOWN KODU ÖNİZLEMESİ
                    <pre className="whitespace-pre font-mono text-xs sm:text-sm p-4 bg-gray-950 text-gray-300 rounded-lg overflow-x-auto leading-relaxed">
                        {markdownPreview}
                    </pre>
                )}
            </div>
        </div>
    );
};
