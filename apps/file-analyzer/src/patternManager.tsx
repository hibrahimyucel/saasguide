import React, { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { PatternForm } from './patternForm';
import { PatternTable } from './patternTable';

export interface DescPattern {
    expr: string; ignore: boolean; desc: string; grp: string; isExt: boolean;
}

const INITIAL_DATA: DescPattern[] = [
    { expr: '^api/v1/.*', ignore: false, desc: 'v1 API Rotaları', grp: 'Backend', isExt: false },
];

export const DescPatternManager: React.FC = () => {
    const [patterns, setPatterns] = useState<DescPattern[]>(INITIAL_DATA);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAdd = (newItem: DescPattern) => {
        if (patterns.some((p) => p.expr === newItem.expr)) {
            alert('Bu ifade zaten mevcut!'); return false;
        }
        setPatterns([...patterns, newItem]); return true;
    };

    const handleUpdate = (updatedItem: DescPattern) => {
        setPatterns(patterns.map((p) => (p.expr === updatedItem.expr ? updatedItem : p)));
    };

    const handleDelete = (expr: string) => {
        setPatterns(patterns.filter((p) => p.expr !== expr));
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(patterns, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `patterns-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                if (!Array.isArray(imported)) return alert('Geçersiz JSON yapısı.');

                const map = new Map<string, DescPattern>();
                patterns.forEach((p) => map.set(p.expr, p));
                imported.forEach((item: any) => {
                    if (item?.expr) {
                        map.set(item.expr, {
                            expr: item.expr, ignore: !!item.ignore,
                            desc: String(item.desc || ''), grp: String(item.grp || ''), isExt: !!item.isExt,
                        });
                    }
                });
                setPatterns(Array.from(map.values()));
            } catch { alert('JSON ayrıştırma hatası.'); }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-5 text-theme-main">
            <div className="flex justify-between items-center pb-2 border-b border-theme-border/60">
                <h2 className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Desen Kuralları Yönetimi</h2>
                <div className="flex space-x-2">
                    <button onClick={handleExport} className="flex items-center space-x-1.5 px-3 py-1 bg-theme-surface hover:bg-theme-panel text-theme-main border border-theme-border rounded-lg text-xs font-medium transition">
                        <Download size={13} />
                        <span>JSON İndir</span>
                    </button>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-1.5 px-3 py-1 bg-theme-surface hover:bg-theme-panel text-theme-main border border-theme-border rounded-lg text-xs font-medium transition">
                        <Upload size={13} />
                        <span>JSON Yükle</span>
                    </button>
                </div>
            </div>
            <PatternForm onAdd={handleAdd} />
            <PatternTable patterns={patterns} onDelete={handleDelete} onUpdate={handleUpdate} />
        </div>
    );
};
