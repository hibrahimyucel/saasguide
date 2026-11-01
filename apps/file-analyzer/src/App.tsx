import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Code, Eye, RefreshCw, Folder } from 'lucide-react';
import type { FileNode, FileInfoSchema } from './types';
import { generateDescMap } from './types';
import FileTree from './fileTree';
import { ProjectReport } from './mdedit'; // Dosya yolunuza göre ayarlayın
import { ThemeSelector } from './themeToggle';
import { DescPatternManager } from './patternManager';



export default function App() {
  const [schema, setSchema] = useState<FileInfoSchema>(generateDescMap);
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'tree' | 'markdown' | 'patterns'>('tree');


  // Bileşeninizin içinde (üst kısımda) bu state'leri tanımlayın:
  const [markdownPreview, setMarkdownPreview] = useState('');
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
      console.error('Kopyalama başarısız oldu:', err);
    }
  };


  const getDescription = (name: string) => {
    const lowerName = name.toLowerCase();

    // 1. Liste: customIgnoreList (Tam String Eşleşmesi)
    const customMatch = schema.customIgnoreList.find(d => d.expr.toLowerCase() === lowerName);
    if (customMatch) return { isIgnored: customMatch.ignore, desc: customMatch.desc };

    // 2. Liste: regExpIgnoreList (RegExp Testi)
    const regexMatch = schema.regExpIgnoreList.find(d => d.expr.test(name));
    if (regexMatch) return { isIgnored: regexMatch.ignore, desc: regexMatch.desc };

    // 3. Liste: extensionDescriptions (Uzantı Karşılaştırması)
    // Dosya adının son noktasından sonrasını alır (Örn: "index.test.ts" -> "ts")
    const fileExt = name.includes('.') ? name.split('.').pop()?.toLowerCase() : '';

    if (fileExt) {
      const extensionMatch = schema.extensionDescriptions.find(d => {
        const exprLower = d.expr.toLowerCase();
        // Listede uzantı ".ts" şeklinde noktalı da olsa, "ts" şeklinde noktasız da olsa ikisini de eşleştirir
        return exprLower === fileExt || exprLower === `.${fileExt}`;
      });

      if (extensionMatch) return { isIgnored: extensionMatch.ignore, desc: extensionMatch.desc };
    }

    // Hiçbir listede eşleşme bulunamazsa varsayılan değer
    return { isIgnored: false, desc: '' };

  };

  const handleSelectDirectory = async () => {
    try {
      // @ts-ignore
      const directoryHandle = await window.showDirectoryPicker();
      setIsScanning(true);

      const scan = async (handle: any, currentPath: string): Promise<FileNode> => {
        const check = getDescription(handle.name);
        let nodeSizeStr = '';
        let isIgnored = check.isIgnored;
        let matchedRule = check.desc;

        if (handle.kind === 'file') {
          try {
            const fileData = await handle.getFile();
            const sizeInMB = fileData.size / (1024 * 1024);
            nodeSizeStr = sizeInMB < 0.1 ? `${(fileData.size / 1024).toFixed(1)} KB` : `${sizeInMB.toFixed(2)} MB`;

            if (sizeInMB > schema.maxFileSizeMB) {
              isIgnored = true;
              matchedRule = `Boyut Sınırı İhlali (> ${schema.maxFileSizeMB}MB)`;
            }
          } catch { }
        }

        const node: FileNode = {
          name: handle.name,
          path: `${currentPath}/${handle.name}`,
          kind: handle.kind,
          isIgnored: isIgnored,
          size: nodeSizeStr,
          matchedRule: matchedRule,
        };

        if (handle.kind === 'directory' && !node.isIgnored) {
          node.children = [];
          for await (const entry of handle.values()) {
            node.children.push(await scan(entry, node.path));
          }

          // YENİ: Eğer klasör taranmışsa ve içi tamamen boşsa uyar
          if (schema.flagEmptyDirectories && node.children.length === 0) {
            node.isIgnored = true;
            node.matchedRule = "⚠️ Boş Klasör Tespit Edildi";
          } else {
            node.children.sort((a, b) => {
              if (a.kind === 'directory' && b.kind !== 'directory') return -1;
              if (a.kind !== 'directory' && b.kind === 'directory') return 1;
              return a.name.localeCompare(b.name, 'tr');
            });
          }
        }

        return node;
      };

      setRootNode(await scan(directoryHandle, ''));
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
      md += `| \`${node.path}\` | ${node.kind === 'directory' ? '📂' : '📄'} | ${node.size || '-'} | ${node.isIgnored ? '❌' : '✅'} | ${node.matchedRule || '-'} |\n`;
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
    <div className="h-screen w-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden font-sans">

      <header className="h-16 border-b bg-vp-bg px-6 flex justify-between items-center flex-shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="text-indigo-500 animate-pulse" size={24} />
          <div>
            <h1 className="text-base font-bold tracking-wide" style={{ color: 'var(--vp-c-text-2)', fontFamily: 'var(--vp-font-family-base)' }}>Monorepo File Analyzer</h1>
            <p className="text-[10px]" style={{ color: 'var(--vp-c-text-2)' }}>Gelişmiş Kural Filtre Paneli</p>
          </div>
        </div>  <ThemeSelector />
        <button onClick={handleSelectDirectory} disabled={isScanning} className="flex items-center gap-2 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200">
          <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Klasör Yapısı Taranıyor...' : 'Klasör Seç ve Analiz Et'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <aside className="w-80 border-r border-slate-800 bg-slate-950/40 p-5 overflow-y-auto space-y-6 flex-shrink-0">

          {/* Üst Ayar Kartı: Boyut ve Boş Klasör Kontrolü */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">📦 Akıllı Analiz Ayarları</h3>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 block">Maksimum Dosya Boyutu:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={schema.maxFileSizeMB}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setSchema({ ...schema, maxFileSizeMB: val });
                    if (rootNode) setRootNode({ ...rootNode });
                  }}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-center text-white"
                />
                <span className="text-[11px] text-slate-400">MB üstünü yoksay</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-xs text-slate-300">Boş Klasörleri İşaretle</span>
              <input
                type="checkbox"
                checked={schema.flagEmptyDirectories}
                onChange={(e) => {
                  setSchema({ ...schema, flagEmptyDirectories: e.target.checked });
                  if (rootNode) setRootNode({ ...rootNode });
                }}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          <h2 className="font-semibold text-xs text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3 uppercase tracking-wider">
            <ShieldAlert size={16} className="text-indigo-400" /> Canlı Şema Kuralları
          </h2>


        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/30">
          <div className="h-12 border-b border-slate-800 bg-slate-950/20 px-6 flex justify-between items-center flex-shrink-0">
            <div className="flex gap-6 h-full">
              <button onClick={() => setActiveTab('tree')} className={`font-semibold text-xs tracking-wider uppercase h-full border-b-2 px-1 flex items-center gap-1.5 transition-all ${activeTab === 'tree' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><Eye size={14} /> Ağaç Görünümü</button>
              <button onClick={() => setActiveTab('markdown')} className={`text-xs font-semibold tracking-wider uppercase h-full border-b-2 px-1 flex items-center gap-1.5 transition-all ${activeTab === 'markdown' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><Code size={14} /> Markdown Raporu</button>
              <button onClick={() => setActiveTab('patterns')} className={`text-xs font-semibold tracking-wider uppercase h-full border-b-2 px-1 flex items-center gap-1.5 transition-all ${activeTab === 'markdown' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><Code size={14} /> edit</button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto min-h-0">
            {!rootNode ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center space-y-3">
                <div className="p-3 bg-slate-800/40 rounded-2xl text-slate-400 border border-slate-700/20"><Folder size={32} /></div>
                <h3 className="text-sm font-semibold text-slate-300">Analiz için klasör bekleniyor</h3>
              </div>
            ) : activeTab === 'tree' ? (
              <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800/80 max-w-5xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800/60">Kök Dizin: <span className="text-white font-mono lowercase">{rootNode.name}</span></div>
                <FileTree items={[rootNode]} />
              </div>
            ) : activeTab === 'patterns' ? (
              /* YENİ EKLENEN BÖLÜM: Dark-mode uyumlu pattern yöneticisi */
              <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800/80 max-w-5xl">
                <DescPatternManager />
              </div>
            ) : (
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre overflow-x-auto max-w-5xl leading-relaxed"><ProjectReport rootNode={rootNode} /></div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

