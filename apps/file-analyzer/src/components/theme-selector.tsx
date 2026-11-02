import React, { useState, useEffect } from "react";
import { Palette } from "lucide-react";

export const ThemeSelector: React.FC = () => {
  // Varsayılan tema 'default' (GitHub Light)
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("app-theme") || "default";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "default") {
      root.removeAttribute("data-theme"); // Varsayılan GitHub Light ayarlarına döner
    } else {
      root.setAttribute("data-theme", theme);
    }
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  return (
    <div className="flex items-center space-x-1 rounded-lg bg-theme-surface p-1">
      <Palette size={30} className="text-theme-primary" />
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="input-with-icon"
      >
        {/* Option elementlerinin arka planları ve metin renkleri tarayıcı uyumluluğu için optimize edildi */}
        <option value="default" className="bg-white text-gray-900">
          GitHub Light
        </option>
        <option value="github-dark" className="bg-[#0d1117] text-[#e6edf3]">
          GitHub Dark
        </option>
        <option value="vitepress-light" className="bg-white text-[#2c3e50]">
          VitePress Light
        </option>
        <option value="vitepress-dark" className="bg-[#1e1e20] text-white">
          VitePress Dark
        </option>
        <option value="dos-programmer" className="bg-[#0000aa] text-white">
          DOS Programmer
        </option>
        <option value="pink-dream" className="bg-[#fff0f5] text-[#4a2834]">
          Pink Dream
        </option>
      </select>
    </div>
  );
};
