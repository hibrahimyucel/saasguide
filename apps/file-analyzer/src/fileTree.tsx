import React, { useState, useEffect } from 'react';
import type { FileNode, FileInfoSchema } from './types';
import './fileTree.css';
// Bileşenin kabul ettiği Props tanımı
interface FileTreeProps {
  items: FileNode[];
  depth?: number;
  parentPath?: string;
}

// Uzantılara göre renk haritası tipi
const extensionStyles: Record<string, string> = {
  '.js': '#eab308',
  '.json': '#94a3b8',
  '.crt': '#22c55e',
  '.key': '#eab308',
  '.pem': '#10b981',
  '.md': '#3b82f6',
  '.conf': '#f97316'
};

const getFileColor = (filename: string): string => {
  const dotIndex = filename.lastIndexOf('.');
  const ext = dotIndex !== -1 ? filename.substring(dotIndex).toLowerCase() : '';
  return extensionStyles[ext] || '#64748b';
};

export default function FileTree({ items, depth = 0, parentPath = '' }: FileTreeProps) {
  // Klasörlerin açık/kapalı durumunu tutan obje tipi
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleFolder = (name: string): void => {
    setOpenFolders((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // SSR Güvenli Kopyalama Fonksiyonu
  const copyPath = (name: string): void => {
    if (!isMounted) return;

    const fullPath = parentPath ? `${parentPath}/${name}` : name;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullPath)
        .then(() => alert(`Kopyalandı: ${fullPath}`))
        .catch(() => alert('Kopyalama başarısız oldu.'));
    } else {
      // Eski tarayıcılar için fallback (TypeScript için HTMLTextAreaElement olarak tanımlandı)
      const textArea = document.createElement('textarea');
      textArea.value = fullPath;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert(`Kopyalandı: ${fullPath}`);
      } catch (err) {
        alert('Kopyalama başarısız oldu.');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className={`tree-container ${depth === 0 ? 'root-level' : ''}`}>
      {/* Mac Tarzı Kontrol Penceresi Frame Elemanları */}
      {depth === 0 && (
        <div className="frame-header">
          <div className="tree-title">Proje Klasör Yapısı</div>
        </div>
      )}

      {items.map((item: FileNode) => {
        const isFolder = item.kind === 'directory';
        const isCollapsed = openFolders[item.name];

        return (
          <div key={item.name} className="tree-node">
            {isFolder ? (
              /* KLASÖR SATIRI */
              <div
                className="tree-item folder-item"
                onClick={() => toggleFolder(item.name)}
              >
                <div className="item-content" style={{ paddingLeft: `${depth * 20}px` }}>
                  <span className={`chevron ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                  <span className="custom-icon folder-icon">📁</span>
                  <span className="item-name">{item.name}</span>
                </div>
                <span className="item-desc">{item.matchedRule}</span>
              </div>
            ) : (
              /* DOSYA SATIRI */
              <div
                className="tree-item file-item"
                onClick={() => copyPath(item.name)}
              >
                <div className="item-content" style={{ paddingLeft: `${depth * 20}px` }}>
                  <span className="chevron-spacer"></span>
                  <span className="custom-icon file-icon">📄</span>
                  <span className="item-name" style={{ color: getFileColor(item.name) }}>
                    {item.name}
                  </span>
                </div>
                <span className="item-desc">{item.matchedRule}</span>
              </div>
            )}

            {/* REKÜRSİF ÇAĞRI */}
            {isFolder && !isCollapsed && item.children && item.children.length > 0 && (
              <FileTree
                items={item.children}
                depth={depth + 1}
                parentPath={parentPath ? `${parentPath}/${item.name}` : item.name}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
