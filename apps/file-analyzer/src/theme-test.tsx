import React, { useState } from "react";
import { Search, Send, Layers } from "lucide-react";

export const ThemeTestDrive: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [selectValue, setSelectValue] = useState("all");

  return (
    <div className="flex w-full max-w-xl flex-row justify-between">
      <div className="panel-base max-w-xl">
        <div className="panel-header">
          <h3 className="font-bold text-theme-text">Bileşen Test Alanı</h3>
        </div>

        <div className="space-y-4">
          {/* Input Kullanımı */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold uppercase text-theme-muted">
              Arama Terimi
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="Filtre girin..."
            />
          </div>

          {/* Selector Kullanımı */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold uppercase text-theme-muted">
              Kriter
            </label>
            <select className="input-base">
              <option>Tüm Dosyalar</option>
            </select>
          </div>

          {/* Buton Kullanımı */}
          <div className="flex justify-end space-x-3 pt-2">
            <button className="btn-secondary">Temizle</button>
            <button className="btn-primary">Analizi Başlat</button>
          </div>
        </div>
      </div>

      <div className="max-w-xl rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xs transition-colors duration-200">
        {/* Kart Başlığı */}
        <div className="mb-5 flex items-center space-x-2">
          <Layers size={18} className="text-theme-primary" />
          <h3 className="text-base font-bold tracking-tight text-theme-text">
            Bileşen Test Alanı
          </h3>
        </div>

        <div className="space-y-4">
          {/* 1. INPUT BOX GRUBU */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
              Arama Terimi
            </label>
            <div className="relative flex items-center">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 text-theme-muted"
              />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Desen veya dosya adı girin..."
                className="focus:ring-theme-primary/20 placeholder:text-theme-muted/60 w-full rounded-lg border border-theme-border bg-theme-bg py-2 pl-9 pr-4 text-sm font-medium text-theme-text outline-hidden transition-all focus:border-theme-primary focus:ring-2"
              />
            </div>
          </div>

          {/* 2. SELECTOR GRUBU */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
              Filtreleme Kriteri
            </label>
            <select
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              className="focus:ring-theme-primary/20 w-full cursor-pointer rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-sm font-medium text-theme-text outline-hidden transition-all focus:border-theme-primary focus:ring-2"
            >
              <option value="all" className="bg-theme-surface text-theme-text">
                Tüm Proje Dosyaları (.ts, .js)
              </option>
              <option
                value="active"
                className="bg-theme-surface text-theme-text"
              >
                Sadece Aktif Desenler
              </option>
              <option
                value="ignored"
                className="bg-theme-surface text-theme-text"
              >
                Yoksayılan Kayıtlar
              </option>
            </select>
          </div>

          {/* 3. DİNAMİK ETKİLEŞİMLİ BUTONLAR */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-theme-muted transition-colors duration-150 hover:bg-theme-surface-hover hover:text-theme-text"
            >
              Temizle
            </button>

            <button
              type="button"
              className="flex items-center space-x-2 rounded-lg bg-theme-primary px-4 py-2 text-sm font-semibold text-theme-bg shadow-xs transition-colors duration-150 hover:bg-theme-primary-hover"
            >
              <Send size={14} />
              <span>Analizi Başlat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
