import React, { useCallback } from 'react';
import { TreeRow } from './treeRow';

interface FileTreeProps {
    items: any[];
    depth?: number;
    parentPath?: string;
    openFolders: Record<string, boolean>;
    toggleFolder: (name: string) => void;
    copyPath: (name: string) => void;
    getFileColor: (name: string) => string;
}

export const FileTree: React.FC<FileTreeProps> = ({
    items,
    depth = 0,
    parentPath = '',
    openFolders,
    toggleFolder,
    copyPath,
    getFileColor
}) => {

    // Fonksiyon referanslarını sabitleyerek TreeRow'un gereksiz render olmasını engelliyoruz
    const handleToggle = useCallback((name: string) => toggleFolder(name), [toggleFolder]);
    const handleCopy = useCallback((name: string) => copyPath(name), [copyPath]);
    const handleColor = useCallback((name: string) => getFileColor(name), [getFileColor]);

    return (
        <div className={`tree-container ${depth === 0 ? 'root-level' : ''}`}>
            {depth === 0 && (
                <div className="frame-header">
                    <div className="tree-title">Proje Klasör Yapısı</div>
                </div>
            )}

            {items.map((item) => {
                const isFolder = item.kind === 'directory';
                const isCollapsed = openFolders[item.name];

                return (
                    <div key={item.name} className="tree-node">
                        <TreeRow
                            item={item}
                            depth={depth}
                            isCollapsed={isCollapsed}
                            onToggleFolder={handleToggle}
                            onCopyPath={handleCopy}
                            getFileColor={handleColor}
                        />

                        {/* Rekürsif Çocukları Tembel (Lazy) Yükleme Mantığı */}
                        {isFolder && !isCollapsed && item.children && item.children.length > 0 && (
                            <FileTree
                                items={item.children}
                                depth={depth + 1}
                                openFolders={openFolders}
                                toggleFolder={toggleFolder}
                                copyPath={copyPath}
                                getFileColor={getFileColor}
                                parentPath={parentPath ? `${parentPath}/${item.name}` : item.name}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
