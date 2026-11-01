import React from 'react';
import { Folder, FileText, Settings, Menu } from 'lucide-react';
import { DescPatternManager } from './patternManager';

export const AppLayout: React.FC = () => {
    return (
        /* ANA FORM CONTAINER (TForm - BorderStyle=bsNone, WindowState=wsMaximized) 
           h-screen ile ekran boyuna kilitlenir. Dışarıya asla scroll bar vermez (overflow-hidden). */
        <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">

            {/* 1. ÜST TOOLBAR (Align = alTop, Height = 48px) */}
            <header className="h-12 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center space-x-3">
                    <Menu size={16} className="text-slate-400" />
                    <span className="text-sm font-bold tracking-wide text-white">Project Analyzer Pro</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">v1.2.0</div>
            </header>

            {/* 2. ANA ÇALIŞMA ALANI (Geri kalan tüm alanı kaplar - Align = alClient) */}
            <div className="flex-1 flex min-h-0 w-full overflow-hidden">

                {/* 2A. SOL GEZGİN PANELİ (Align = alLeft, Width = 260px) */}
                <aside className="w-64 border-r border-slate-800/80 bg-slate-900/20 flex flex-col shrink-0 min-h-0">
                    {/* Panel Başlığı */}
                    <div className="p-3 border-b border-slate-800/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Gezgin
                    </div>
                    {/* İÇ SCROLL PANELİ: Dosya ağacı ne kadar uzarsa uzasın sadece bu kutuda kayar, sayfayı bozamaz! */}
                    <div className="flex-1 overflow-auto p-2 space-y-1 min-h-0">
                        <button className="w-full flex items-center space-x-2 px-3 py-1.5 bg-slate-800/50 text-white rounded-lg text-xs font-medium">
                            <Folder size={14} className="text-sky-400" />
                            <span>Dosya Ağacı</span>
                        </button>
                        <button className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition">
                            <FileText size={14} />
                            <span>Raporlar</span>
                        </button>
                    </div>
                </aside>

                {/* 2B. MERKEZİ PANEL (Geri kalan alan - Align = alClient) */}
                <main className="flex-1 flex flex-col min-h-0 bg-slate-950/40 overflow-hidden">

                    {/* TAB BAR / ÇALIŞMA ALANI BAŞLIĞI */}
                    <div className="h-10 border-b border-slate-800/60 bg-slate-900/10 flex items-center px-4 justify-between shrink-0">
                        <div className="flex space-x-1">
                            <span className="text-xs font-semibold px-2 py-1 bg-slate-800/60 text-slate-200 rounded border border-slate-700/30">Desen Düzenleyici</span>
                        </div>
                    </div>

                    {/* ASIL İÇERİK KUTUSU (Bileşenlerin yaşadığı yer)
             min-h-0: İçerideki tablo ne kadar büyük olursa olsun bu div'in boyutunu zorla büyütemez!
             overflow-auto: İçerideki DescPatternManager taşarsa, sadece bu alan scroll bar çıkartır. */}
                    <div className="flex-1 p-6 overflow-auto min-h-0">
                        <div className="max-w-5xl">
                            <DescPatternManager />
                        </div>
                    </div>

                </main>
            </div>

            {/* 3. ALT DURUM ÇUBUĞU (TStatusBar - Align = alBottom, Height = 24px) */}
            <footer className="h-6 border-t border-slate-800/60 bg-slate-950 flex items-center justify-between px-4 text-[10px] text-slate-500 shrink-0">
                <div>Durum: Hazır</div>
                <div className="font-mono">LN 1, Col 1</div>
            </footer>

        </div>
    );
};
