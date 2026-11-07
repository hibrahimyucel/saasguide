import React, { useState, useEffect, useRef } from "react";
import { Palette, Check } from "lucide-react";

interface ThemeOption {
  value: string;
  label: string;
}

export const ThemeSelectorDropDown: React.FC = () => {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("app-theme") || "default";
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes: ThemeOption[] = [
    { value: "default", label: "Sistem" },
    { value: "github-light", label: "github-light" },
    { value: "github-dark", label: "github-dark" },
    { value: "vitepress-light", label: "vitepress" },
    { value: "vitepress-dark", label: "vitepress-dark" },
    { value: "dos-programmer", label: "ms dos" },
    { value: "pink-dream", label: "pink-dream" },
  ];

  // Tema Değişim Yönetimi (Anti-Flicker Mekanizması Korundu)
  useEffect(() => {
    const root = document.documentElement;

    const css = document.createElement("style");
    css.type = "text/css";
    css.appendChild(
      document.createTextNode(`* { transition: none !important; }`),
    );
    document.head.appendChild(css);

    if (theme === "default") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    window.getComputedStyle(document.body);

    const timer = setTimeout(() => {
      document.head.removeChild(css);
    }, 1);

    localStorage.setItem("app-theme", theme);

    return () => clearTimeout(timer);
  }, [theme]);

  // Menü Dışına Tıklandığında Kapatma Mantığı
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Tetikleyici Tek Buton */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-full p-0.5 hover:animate-pulse"
        title="Tema Değiştir"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Palette size={20} className="text-theme-primary" />
      </button>

      {/* Açılır Menü (Dropdown Panel) */}
      {isOpen && (
        <div className="panel-base border-theme-border bg-theme-surface animate-in fade-in slide-in-from-top-1 absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border py-1 shadow-lg duration-100">
          <div className="border-theme-border text-theme-muted border-b px-3 py-2 text-xs font-semibold tracking-wider uppercase">
            Tema Seçimi
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {themes.map((t) => (
              <li key={t.value}>
                <button
                  onClick={() => {
                    setTheme(t.value);
                    setIsOpen(false);
                  }}
                  className={`hover:bg-theme-surface/50 flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${theme === t.value ? "text-theme-primary font-medium" : "text-theme-text"}`}
                >
                  <span>{t.label}</span>
                  {theme === t.value && (
                    <Check size={16} className="text-theme-primary" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
