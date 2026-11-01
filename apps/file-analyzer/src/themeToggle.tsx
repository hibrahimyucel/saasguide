import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
    // Varsayılan tema 'default' (slate-dark)
    const [theme, setTheme] = useState<string>(() => {
        return localStorage.getItem('app-theme') || 'default';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'default') {
            root.removeAttribute('data-theme'); // Kök değerlere döner (Slate)
        } else {
            root.setAttribute('data-theme', theme);
        }
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    return (
        <div className="flex items-center space-x-2 bg-theme-surface border border-theme-border p-2 rounded-lg">
            <Palette size={14} className="text-theme-muted" />
            <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-transparent text-xs text-theme-main focus:outline-none cursor-pointer font-medium"
            >
                <option value="default" className="bg-slate-900 text-white">Slate Dark</option>
                <option value="zinc-dark" className="bg-zinc-900 text-white">Zinc Emerald</option>
                <option value="light" className="bg-white text-slate-900">Light Mode</option>
            </select>
        </div>
    );
};
