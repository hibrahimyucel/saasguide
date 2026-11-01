import React, { useState } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { DescPattern } from './patternManager';

interface TableProps {
  patterns: DescPattern[];
  onDelete: (expr: string) => void;
  onUpdate: (updatedItem: DescPattern) => void;
}

export const PatternTable: React.FC<TableProps> = ({ patterns, onDelete, onUpdate }) => {
  const [editExpr, setEditExpr] = useState<string | null>(null);
  const [editData, setEditData] = useState<DescPattern | null>(null);

  const startEdit = (item: DescPattern) => {
    setEditExpr(item.expr); setEditData({ ...item });
  };

  const saveEdit = () => {
    if (editData) { onUpdate(editData); setEditExpr(null); setEditData(null); }
  };

  return (
    <div className="bg-theme-surface/20 rounded-xl border border-theme-border overflow-hidden">
      <table className="min-w-full divide-y divide-theme-border/50 text-left text-xs">
        <thead className="bg-theme-surface/40 text-theme-muted font-bold uppercase tracking-wider">
          <tr>
            <th className="px-5 py-3">Expression (expr)</th>
            <th className="px-5 py-3">Group (grp)</th>
            <th className="px-5 py-3">Description (desc)</th>
            <th className="px-5 py-3 text-center">Ignore</th>
            <th className="px-5 py-3 text-center">isExt</th>
            <th className="px-5 py-3 text-right">Aksiyonlar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-border/30 text-theme-main">
          {patterns.length === 0 ? (
            <tr><td colSpan={6} className="px-5 py-8 text-center text-theme-muted italic">Kayıtlı desen bulunamadı.</td></tr>
          ) : (
            patterns.map((p) => {
              const isEditing = editExpr === p.expr;
              return (
                <tr key={p.expr} className="hover:bg-theme-surface/10 transition">
                  <td className="px-5 py-3.5 font-mono text-theme-accent/90 break-all">{p.expr}</td>
                  <td className="px-5 py-3.5">
                    {isEditing ? (
                      <input type="text" value={editData?.grp} onChange={(e) => setEditData(d => d ? { ...d, grp: e.target.value } : null)} className="bg-theme-panel border border-theme-border text-theme-main px-2 py-0.5 rounded w-24 focus:outline-none" />
                    ) : (
                      p.grp ? <span className="px-2 py-0.5 text-[11px] bg-theme-surface text-theme-main rounded font-medium border border-theme-border/40">{p.grp}</span> : <span className="text-theme-muted/50 italic">Yok</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {isEditing ? (
                      <input type="text" value={editData?.desc} onChange={(e) => setEditData(d => d ? { ...d, desc: e.target.value } : null)} className="bg-theme-panel border border-theme-border text-theme-main px-2 py-0.5 rounded w-full focus:outline-none" />
                    ) : (
                      p.desc || <span className="text-theme-muted/50 italic">Açıklama yok</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {isEditing ? (
                      <input type="checkbox" checked={editData?.ignore} onChange={(e) => setEditData(d => d ? { ...d, ignore: e.target.checked } : null)} className="rounded border-theme-border bg-theme-panel text-theme-accent focus:ring-0" />
                    ) : (
                      <span className={`inline-block w-2 h-2 rounded-full ${p.ignore ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {isEditing ? (
                      <input type="checkbox" checked={editData?.isExt} onChange={(e) => setEditData(d => d ? { ...d, isExt: e.target.checked } : null)} className="rounded border-theme-border bg-theme-panel text-theme-accent focus:ring-0" />
                    ) : (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${p.isExt ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-theme-accent border border-theme-accent/20'}`}>{p.isExt ? 'TRUE' : 'FALSE'}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium">
                    {isEditing ? (
                      <div className="flex items-center justify-end space-x-3">
                        <button onClick={saveEdit} className="flex items-center space-x-1 text-emerald-500 hover:text-emerald-400"><Check size={14} /> <span>Kaydet</span></button>
                        <button onClick={() => setEditExpr(null)} className="flex items-center space-x-1 text-theme-muted hover:text-theme-main"><X size={14} /> <span>İptal</span></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-4">
                        <button onClick={() => startEdit(p)} className="flex items-center space-x-1 text-theme-muted hover:text-theme-main"><Edit2 size={13} /> <span>Düzenle</span></button>
                        <button onClick={() => onDelete(p.expr)} className="flex items-center space-x-1 text-red-500 hover:text-red-400"><Trash2 size={13} /> <span>Sil</span></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
