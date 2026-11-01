import React from 'react';

interface TreeRowProps {
    item: any;
    depth: number;
    isCollapsed: boolean;
    onToggleFolder: (name: string) => void;
    onCopyPath: (name: string) => void;
    getFileColor: (name: string) => string;
}

export const TreeRow: React.FC<TreeRowProps> = React.memo(({
    item,
    depth,
    isCollapsed,
    onToggleFolder,
    onCopyPath,
    getFileColor
}) => {
    const isFolder = item.kind === 'directory';
    // Tailwind'e dinamik padding yerine sınıflarla destek veriyoruz
    const paddingLeftClass = `pl-[${depth * 20}px]`;

    if (isFolder) {
        return (
            <div className="tree-item folder-item" onClick={() => onToggleFolder(item.name)}>
                <div className="item-content" style={{ paddingLeft: `${depth * 20}px` }}>
                    <span className={`chevron ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                    <span className="custom-icon folder-icon">📁</span>
                    <span className="item-name">{item.name}</span>
                </div>
                <span className="item-desc">{item.matchedRule}</span>
            </div>
        );
    }

    return (
        <div className="tree-item file-item" onClick={() => onCopyPath(item.name)}>
            <div className="item-content" style={{ paddingLeft: `${depth * 20}px` }}>
                <span className="chevron-spacer"></span>
                <span className="custom-icon file-icon">📄</span>
                <span className="item-name" style={{ color: getFileColor(item.name) }}>
                    {item.name}
                </span>
            </div>
            <span className="item-desc">{item.matchedRule}</span>
        </div>
    );
});

// React DevTools'ta isimlendirme için
TreeRow.displayName = 'TreeRow';
