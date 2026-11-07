# Tek Butonlu ve Açılır Menülü Tema Seçimi (ThemeSelector)

Bu rehber, projemizin **Anayasa v4** standartları çerçevesinde kurgulanan, Tailwind v4 native CSS değişkenleriyle beslenen ve kullanıcı deneyimini (UX) optimize eden dropdown tabanlı tema seçici bileşenini belgeler.

---

## 1. Mimari Tasarım ve Problemlerin Çözümü

Eski select tabanlı tasarım, global panellerde yerel tarayıcı form elementlerine bağımlı olduğu için Tailwind temalarıyla (`github-dark`, `ms-dos` vb.) tam görsel uyum yakalayamamaktaydı. 

Yeni dropdown mimarisi ile şu standartlar hayata geçirilmiştir:
1. **Dış Tıklama Yönetimi (Click Outside):** `useRef` ve `mousedown` olay mekanizması entegre edilerek, menü açıkken ekranın herhangi bir dış alanına tıklandığında panelin bellek sızıntısı yaratmadan güvenli kapanması sağlanmıştır.
2. **Erişilebilirlik (ARIA):** Tetikleyici buton üzerinde `aria-haspopup` ve `aria-expanded` nitelikleri dinamik olarak yönetilerek ekran okuyucularla tam uyum sağlanmıştır.
3. **Anti-Flicker (Ekran Kırpışmasını Önleme):** Tema değişim anında tüm DOM elemanlarının `transition` özellikleri geçici olarak (`1ms`) dondurularak, koyu/açık mod geçişlerindeki ani stil kaymaları engellenmiştir.

## 2. Tailwind v4 ve Katman Entegrasyonu

Bileşen, tasarım bütünlüğünü korumak adına `@utility` katmanındaki ortak sınıfları ve `@theme` altındaki renk değişkenlerini doğrudan tüketir:

* Tetikleyici buton için `btn-secondary` veya esnek panel yapıları kullanılmıştır.
* Menü gövdesi için anayasadaki `panel-base` kart standardı referans alınmıştır.
* İçerik renklendirmelerinde doğrudan `text-theme-primary` ve `bg-theme-surface` değişkenleri kullanılmıştır.

### Bileşen Kaynak Kodu

```tsx
import React, { useState, useEffect, useRef } from "react";
import { Palette, Check } from "lucide-react";

export const ThemeSelector: React.FC = () => {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("app-theme") || "default";
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes = [
    { value: "default", label: "github-light (Default)" },
    { value: "github-dark", label: "github-dark" },
    { value: "vitepress-light", label: "vitepress" },
    { value: "vitepress-dark", label: "vitepress-dark" },
    { value: "dos-programmer", label: "ms dos" },
    { value: "pink-dream", label: "pink-dream" },
  ];

  // DOM Tema Ataması ve Transition Dondurma
  useEffect(() => {
    const root = document.documentElement;
    const css = document.createElement("style");
    css.type = "text/css";
    css.appendChild(document.createTextNode(`* { transition: none !important; }`));
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

  // Click Outside Kapatma Mekanizması
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center justify-center p-2 rounded-lg hover:bg-theme-surface/80 transition-colors"
        aria-expanded={isOpen}
      >
        <Palette size={20} className="text-theme-primary" />
      </button>

      {isOpen && (
        <div className="panel-base absolute right-0 mt-2 w-56 rounded-md shadow-lg border border-theme-border bg-theme-surface z-50 py-1 origin-top-right">
          <div className="px-3 py-2 border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider">
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
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-theme-surface/50 ${
                    theme === t.value ? "text-theme-primary font-medium" : "text-theme-text"
                  }`}
                >
                  <span>{t.label}</span>
                  {theme === t.value && <Check size={16} className="text-theme-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

## 3. Entegrasyon Kuralları ve Best Practices

* **Katman Önceliği (Z-Index):** Açılır menünün tablo hücreleri (`EditableCell`), başlıklar veya form elemanlarının arkasında kalmasını önlemek amacıyla `z-50` sınıfı kalıcı hale getirilmiştir.
* **Performans İzolyasyonu:** Liste elemanları statik bir diziden eşlendiği için re-render maliyeti düşüktür; ancak projedeki diğer dinamik state'lerden etkilenmemesi için ihtiyaç halinde üst sarmalayıcısı `React.memo` ile korunabilir.

