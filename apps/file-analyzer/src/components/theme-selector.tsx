import React, { useState, useEffect } from "react";
import { Palette } from "lucide-react";

export const ThemeSelector: React.FC = () => {
  // Varsayılan tema 'default' (GitHub Light)
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("app-theme") || "default";
  });

  useEffect(() => {
    const root = document.documentElement;

    // 1. Geçici olarak tüm transition'ları dondur
    const css = document.createElement("style");
    css.type = "text/css";
    css.appendChild(
      document.createTextNode(`* { transition: none !important; }`),
    );
    document.head.appendChild(css);

    // 2. Doğrudan data-theme niteliğini ata (CSS dosyanızdaki seçiciyle tam eşleşir)
    if (theme === "default") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    // 3. Tarayıcıyı yeni stilleri okumaya zorla
    window.getComputedStyle(document.body);

    // 4. Stili hemen kaldır
    const timer = setTimeout(() => {
      document.head.removeChild(css);
    }, 1);

    localStorage.setItem("app-theme", theme);

    return () => clearTimeout(timer);
  }, [theme]);

  return (
    <div className="bg-theme-surface flex items-center space-x-1 rounded-lg p-1">
      <Palette size={30} className="text-theme-primary" />
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="input-with-icon"
      >
        <option value="default">github-light (Default)</option>
        <option value="github-dark">github-dark</option>
        <option value="vitepress-light">vitepress</option>
        <option value="vitepress-dark">vitepress-dark</option>
        <option value="dos-programmer">ms dos</option>
        <option value="pink-dream">pink-dream</option>
      </select>
    </div>
  );
};
