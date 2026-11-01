import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DescPattern } from './patternManager';

interface FormProps {
    onAdd: (item: DescPattern) => boolean;
}

export const PatternForm: React.FC<FormProps> = ({ onAdd }) => {
    const [expr, setExpr] = useState('');
    const [grp, setGrp] = useState('');
    const [desc, setDesc] = useState('');
    const [ignore, setIgnore] = useState(false);
    const [isExt, setIsExt] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!expr.trim()) return;

        const success = onAdd({ expr: expr.trim(), ignore, desc: desc.trim(), grp: grp.trim(), isExt });
        if (success) {
            setExpr(''); setGrp(''); setDesc(''); setIgnore(false); setIsExt(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-theme-surface/50 p-4 rounded-xl border border-theme-border/60 shadow-inner">
            <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Expression (expr) *</label>
                <input type="text" required value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="^src/components/.*" className="w-full px-3 py-1.5 bg-theme-panel border border-theme-border rounded-lg text-sm text-theme-main focus:outline-none focus:border-theme-accent/50 font-mono" />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Group (grp)</label>
                <input type="text" value={grp} onChange={(e) => setGrp(e.target.value)} placeholder="UI" className="w-full px-3 py-1.5 bg-theme-panel border border-theme-border rounded-lg text-sm text-theme-main focus:outline-none focus:border-theme-accent/50" />
            </div>
            <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Description (desc)</label>
                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Açıklama yazın..." className="w-full px-3 py-1.5 bg-theme-panel border border-theme-border rounded-lg text-sm text-theme-main focus:outline-none focus:border-theme-accent/50" />
            </div>
            <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-sm text-theme-main cursor-pointer select-none"><input type="checkbox" checked={ignore} onChange={(e) => setIgnore(e.target.checked)} className="rounded border-theme-border bg-theme-panel text-theme-accent focus:ring-0" /> <span>Ignore</span></label>
                <label className="flex items-center space-x-2 text-sm text-theme-main cursor-pointer select-none"><input type="checkbox" checked={isExt} onChange={(e) => setIsExt(e.target.checked)} className="rounded border-theme-border bg-theme-panel text-theme-accent focus:ring-0" /> <span>isExt</span></label>
            </div>
            <div className="md:col-span-2 flex justify-end items-end">
                <button type="submit" className="w-full md:w-auto flex items-center justify-center space-x-1.5 px-4 py-1.5 bg-theme-surface hover:bg-theme-panel text-theme-main text-xs font-semibold rounded-lg border border-theme-border transition">
                    <Plus size={14} />
                    <span>Listeye Ekle</span>
                </button>
            </div>
        </form>
    );
};
