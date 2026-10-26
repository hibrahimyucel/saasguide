
# Projeyi Tamamlama



Önceki adımda oluşturduğumuz projeyi geliştirip tamamlıyoruz.


## Genel Bilgiler
  - Dökümanlar `src` altındaki klasörler ve markdown dosyalarından oluşur.
  
  - Markdown içinde **html** kodları ve **Vue-React** bileşenleri kullanabilirsiniz.
  
  - Her dosyada sadece bir adet **ana başlık** (`<h1/>`,`#`)olabilir.
  
  - Sağdaki listede (**Table of Contents**) varsayılan olarak sadece **başlık 2** (`<h2/>`,`##`) gösterilir.
  
  - `src/index.md` sitenizin giriş sayfasıdır. Her klasör altındaki `index.md` o klasörün varsayılan sayfasıdır. Döküman ağacı (Sidebar) oluşturulurken `index.md` dosya başlığı kullanılır.
  
  
  - `[Anasayfa](/)` projenizin giriş sayfasını (`src/index.md`) açar. ( [Anasayfa](/) )
  
  - `[Rehber](/guide)`,  `src/guide` içindeki `index.md` dosyasını açar. ( [Rehber](/guide/) )
  
  - `[Plan](/plan)`,  bağlantılarda uzantı kullanılmaz, `plan.md` yerine sadece `plan`.  ( [Plan](/plan) ) 
  
  - `[Github](https://github.com/)` ilgli bağlanıtıyı yeni sayfada açar. [Github](https://github.com/)
  


## Proje Dosyalarını Güncelleme

::: details `src/index.md` giriş sayfamızı aşağıdaki şekilde güncelliyoruz.
```markdown
---
layout: home

hero:
  name: "SaaS-VPS"
  text: "Geliştirici Dökümantasyonu"
  tagline: "Almalinux, VPS, Node, Turborepo, Docker, Nginx geliştirme ve yayınlama süreçleri"
  image:
    src: /logo.svg
    alt: Proje Logosu
  actions:
    - theme: brand
      text: Başla
      link: /guide/
    - theme: alt
      text: GitHub Pages
      link: https://hibrahimyucel.github.io/saasguide/
    - theme: alt
      text: GitHub Repository
      link: https://github.com/hibrahimyucel/saasguide

features:
  - icon: 📦
    title: Node.js & Monorepo Gücü
    details: Tüm frontend, backend ve paketlerinizi tek bir repoda yönetin. Paylaşımlı kod ve bağımlılık yönetimiyle geliştirme hızınızı katlayın.
  - icon: 🐳
    title: Docker & Konteynerizasyon
    details: Geliştirme (development) ve üretim (production) ortamlarını tamamen izole edin. 'Benim makinede çalışıyordu' sorununa son verin.
  
---

```

:::

::: details `src/.vitepress/config.ts` dosyasını güncelleyin

```ts
import { defineConfig } from "vitepress";
import { generateDynamicSidebar } from "./sidebar";

export default defineConfig({

  base: "/saasguide/",
  title: "SaaS-VPS Rehberi",
  description: "SaaS Rehberi VitePress Sitesi",
  lang: "tr-TR",

  themeConfig: {
    logo: {
      light: "/logo.svg",
      dark: "/logod.svg",
      alt: "Proje Logosu",
    },
    siteTitle: "SaaS-VPS Rehberi",
    
    socialLinks: [
      { icon: "github", link: "https://github.com/hibrahimyucel/saasguide" },
    ],
    
    footer: {
      message: "MIT Lisansı ile korunmaktadır.",
      copyright: `Telif Hakkı © ${new Date().getFullYear()} SaaS Rehberi`,
    },
    
    outline: { label: "Bu Sayfada" },
    docFooter: { prev: "Önceki Sayfa", next: "Sonraki Sayfa" },
    lastUpdated: { text: "Son Güncelleme" },
    returnToTopLabel: "Başa Dön",
    sidebarMenuLabel: "Menü",
    darkModeSwitchLabel: "Görünüm",
    lightModeSwitchTitle: "Açık Mod",
    darkModeSwitchTitle: "Karanlık Mod",
    
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "Ara", buttonAriaLabel: "Arama yap" },
          modal: {
            noResultsText: "Sonuç bulunamadı",
            resetButtonTitle: "Aramayı temizle",
            footer: { selectText: "Seçmek için", navigateText: "Gezinmek için", closeText: "Kapatmak için" },
          },
        },
      },
    },
    
    nav: [
      { text: "Rehber", link: "/guide/01-sistem", activeMatch: "/guide/" },
      { text: "Sözlük", link: "/dict/", activeMatch: "/dict/" },
      { text: "Plan", link: "/plan" },
    ],

    sidebar: {
      "/": generateDynamicSidebar("src/", "/"),
      "/guide/": generateDynamicSidebar("src/guide", "/guide/"),
      "/dict/": generateDynamicSidebar("src/dict", "/dict/"),
    },
  },
});

```

:::

::: details `src/.vitepress/sidebar.ts` dosyasını oluşturun.
```ts
import fs from "fs";
import path from "path";
import type { DefaultTheme } from "vitepress";

/**
 * Markdown dosyasının ilk satırındaki "# Başlık" kısmını okur.
 */
function getTitleFromMarkdown(filePath: string, fallback: string): string {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : fallback;
  } catch {
    return fallback;
  }
}

/**
 * "01-kurulum-rehberi" gibi dosya adlarının başındaki sayıları ve tireleri temizler,
 * metnin ilk harfini büyütür.
 */
function cleanMenuText(rawText: string): string {
  const clean = rawText.replace(/^\d+[-_]*/, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Belirtilen klasörü tarayarak dinamik VitePress sidebar yapısı oluşturur.
 */
export function generateDynamicSidebar(
  scanPath: string,
  basePath: string
): DefaultTheme.SidebarItem[] {
  const absolutePath = path.resolve(process.cwd(), scanPath);
  if (!fs.existsSync(absolutePath)) return [];

  const items: DefaultTheme.SidebarItem[] = [];

  // Dosya ve klasör adlarını doğal sıralama (0-9, A-Z) ile oku
  const files = fs
    .readdirSync(absolutePath)
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

  for (const file of files) {
    // index.md veya gizli dosyaları listeye ekleme, doğrudan atla
    if (file.toLowerCase() === "index.md" || file.startsWith(".")) continue;

    const fullPath = path.join(absolutePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const subItems = generateDynamicSidebar(
        path.join(scanPath, file),
        `${basePath}${file}/`
      );

      // Eğer alt klasörün içi boşsa sidebar'a ekleme yapma
      if (subItems.length > 0) {
        const subIndexFullPath = path.join(fullPath, "index.md");
        const folderTitle = fs.existsSync(subIndexFullPath)
          ? getTitleFromMarkdown(subIndexFullPath, cleanMenuText(file))
          : cleanMenuText(file);

        items.push({
          text: folderTitle,
          link: `${basePath}${file}/`,
          collapsible: true,
          collapsed: false,
          items: subItems,
        });
      }
    } else if (file.endsWith(".md")) {
      const nameWithoutExt = path.parse(file).name;
      const fallbackTitle = cleanMenuText(nameWithoutExt);
      const title = getTitleFromMarkdown(fullPath, fallbackTitle);

      items.push({
        text: title,
        link: `${basePath}${nameWithoutExt}`,
      });
    }
  }

  return items;
}
```

:::


## Dökümanları gruplandırmak
 
 - Bu projede `guide` ve `dict` adlı iki klasör kullanıyoruz.

```bash
mkdir -p apps/docs/src/guide
mkdir -p apps/docs/src/dict
```
 ### navbar
 - `src/.vitepress/config.ts` içinde başlık çubuğuna bağlantıları ekliyoruz.
 ::: info Rehber için varsayılan `index.md` bağlantısını ezip dosya adı ile yönlendirme yapıyoruz.
  
  `activeMatch: "/dict/"` ifadesi bu başlığın `"/dict/"` klasörü görüntülenirken vurgulanmasını sağlar. 
  :::
```bash
    nav: [
      { text: "Rehber", link: "/guide/01-sistem", activeMatch: "/guide/" },
      { text: "Sözlük", link: "/dict/", activeMatch: "/dict/" },
      { text: "Plan", link: "/plan" },
    ],
```
### sidebar
 - `src/.vitepress/config.ts` derleme sırasında otomatik sidebar oluşturmak için yapılandırma dosyamıza fonksiyon bağlatısını ekliyoruz.  Aktif klasöre göre 3 farklı menü gösterilecektir.
 
```json
sidebar: {
      "/": generateDynamicSidebar("src/", "/"),
      "/guide/": generateDynamicSidebar("src/guide", "/guide/"),
      "/dict/": generateDynamicSidebar("src/dict", "/dict/"),
    },
```



---

## Özelleştirme
`src/guide`,`src/dict` içinde alt klasör ve markdown dosyaları oluşturarak belge sayısını artırabilirsiniz. Her klasör içine `index.md` ve başlık satırı eklemeyi unutmayın.

```md
# 1.1. Bölüm Başlığı
```

---

## Projeyi Çalıştırma

Dökümantasyon projesini son şekliyle çalıştırın:

```bash
pnpm --filter docs build
pnpm dev --filter docs
```

## Kontrol
  - Alt klasörler ve dosyalar listeye (sidebar) eklenmiş olmalı.
  - Menü başlıkları dosya başlığı, klasörler için `index.md` başlığı olmalı.
  - Liste dosya adına göre sıralanmış olmalı.
  - Başlık çubuğunda aktif klasöre göre başlıklar vurgulanmalı.
  - Site içi arama çalışmalı 
  - Varsayılan inglizce ifadeler türkçe olmalı.
   
   
## Git Checkpoint

Proje kök klasörümüzde çalışmalarımızı kaydedip uzak sunucuyu güncelliyoruz.

```bash
git add .
git commit -m "Vitepress Dökümantasyon 1.0.0 stable"
git tag -a v1.0.0 -m "Vitepress Dökümantasyon 1.0.0 stable"
git push origin -main
 
```
