---
title: Proje Oluşturma
description: >-
  Monorepo yapımıza apps/ dizini altına bir VitePress dökümantasyon projesi
  ekliyoruz.
outline:
  - 2
  - 3
status: published
tags:
  - rehber
  - dev
---
# Proje Oluşturma

Monorepo yapımıza `apps/` dizini altına bir VitePress dökümantasyon projesi ekliyoruz.


## Klasör ve dosyalar
 
 Monorepo projenizin kök dizindeyken `apps` altında proje  klasörlerinizi, giriş sayfanızı ve örnek dosyanızı (`index.md`,`plan.md`) oluşturun:

```bash
mkdir -p apps/docs/.vitepress/components
mkdir -p apps/docs/src/public
mkdir -p apps/docs/src/konu1
mkdir -p apps/docs/src/konu2

echo -e '# Anasayfa\n\n### Site Giriş Sayfası' > apps/docs/src/index.md
echo -e '# 1. Konu Başlığı\n\n## Konu 1 Giriş Sayfası' > apps/docs/src/konu1/index.md
echo -e '# 2. Konu Başlığı\n\n### Konu 2 Açıklama Sayfası' > apps/docs/src/konu2/index.md
echo -e '# 1. Konu Başlığı\n\n## Konu 1 Giriş Sayfası' > apps/docs/src/konu1/konu1.md
echo -e '# 2. Konu Başlığı\n\n### Konu 2 Açıklama Sayfası' > apps/docs/src/konu2/konu2.md
```

---

### Proje dosyasını oluşturun ve aşağıdaki içeriği ekleyin:

:::details `apps/docs/package.json`
```json
{
  "name": "docs",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev --host 0.0.0.0 --port 5174",
    "build": "vitepress build",
    "docker:up": "docker compose up -d",
    "docker:build": "docker compose up -d --build",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f",
    "docker:publish": "docker compose -f docker-compose.build.yml run --rm --build docs-builder",
    "docker:prod:up": "docker compose -f docker-compose.prod.yml up -d --build",
    "docker:prod:down": "docker compose -f docker-compose.prod.yml down",
    "docker:prod:export": "docker compose -f docker-compose.prod.yml build && docker save pr2-docs:latest | gzip > ../../../pr2-docs-latest.tar.gz",
    "docker:prod:import": "docker load -i ../../../pr2-docs-latest.tar.gz && docker compose -f docker-compose.prod.yml up -d --no-build"


  },
  "devDependencies": {
    "@types/node": "^26.6.6",
    "vitepress": "^1.6.4",
    "vue": "^3.5.45"
  }
}

```
:::



- name : **docs** projemizin adı
- scripts : projeyi çalıştırmak-derlemek kullanılan komutlar.
  - "dev": "vitepress dev --host 0.0.0.0 --port 5174",
  
    **`"dev":`** Bu, komutun takma adıdır. Terminalde tüm komutu yazmak yerine sadece `npm run dev` yazarak bu işlemi tetiklemenizi sağlar.
    
    **`vitepress dev`** VitePress geliştirme sunucusunu başlatır.
    
    **`--host 0.0.0.0`**  Projemiz *statik site* olmasına rağmen geliştirme ortamında sayfalar **`vitepress dev`** komutunun oluşturduğu *backend* ile soket bağlantısı üzerinden haberleşerek çalışır. Bu parametre ile geliştirme sunucusu tüm adreslerden gelen talepleri dinler ve **HMR** (Hot Module Replacement), yaptığınız değişikliklerin anlık olarak uygulanmasını sağlar. Geliştirme ortamımız (Docker-Nginx) proxy ile çalışacağı için bu parametre olmadan **HMR** çalışmaz. 
         
    **`--port 5174`** Geliştirme sunucusunun hangi port üzerinden yayın yapacağını belirler. Tarayıcınızda `http://localhost:5174` adresine giderek sitenizi görüntüleyebilirsiniz.
 
 `pnpm --filter docs dev` monorepo içindeki **docs** projesi için `package.json` içindeki `dev` komutunu çalıştırır.



---
### VitePress ayar dosyasını oluşturun
 
:::details `apps/docs/.vitepress/config.ts`

```typescript
import { defineConfig, loadEnv } from "vitepress";
import { generateDynamicSidebar } from "./sidebar";
import fs from "node:fs";

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return defineConfig({
    base: env.VITE_BASE_URL || "/pr2/",
    srcDir: "./src",
    outDir: "./dist",
    vite: {
      server: {
        host: true,
        port: 5174,
        watch: {
          usePolling: true, // Docker volume üzerinde yeni dosya olaylarını yakalar
          interval: 300,
        },
      },
      plugins: [
        {
          name: "auto-sidebar-reload",
          configureServer(server) {
            const touchConfig = (file: string) => {
              if (file.endsWith(".md")) {
                const now = new Date();
                fs.utimesSync(__filename, now, now);
              }
            };

            server.watcher.on("add", touchConfig);
            server.watcher.on("unlink", touchConfig);
          },
        },
      ],
    },

    title: "SaaS-VPS Rehberi",
    description: "SaaS Rehberi VitePress Sitesi",

    head: [
      [
        "meta",
        {
          name: "keywords",
          content:
            "vitepress, dökümantasyon, markdown, seo, vue, nodejs, docker, monorepo, nestjs, turborepo, typescript",
        },
      ],
    ],

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
              footer: {
                selectText: "Seçmek için",
                navigateText: "Gezinmek için",
                closeText: "Kapatmak için",
              },
            },
          },
        },
      },

      nav: [
        { text: "Konu 1", link: "/konu1/", activeMatch: "/konu1/" },
        { text: "Konu 2", link: "/konu2/", activeMatch: "/konu2/" },
      ],

      sidebar: {
        "/": generateDynamicSidebar("src/", "/"),
        "/konu1/": generateDynamicSidebar("src/konu1", "/konu1/"),
        "/konu2/": generateDynamicSidebar("src/konu2", "/konu2/"),
      },
    },
  });
};
```
:::


  - `    base: env.VITE_BASE_URL || "/pr2/"` tanımlaması uygulamanın kök dizinini belirtir. Kök dizinden çalışcaksa (`http://localhost:5174/`), `/` kullanılır. Dizin adı belirtmek için  `base: "/docs/"` şeklinde yazmalısınız. Bu durumda site `http://localhost:5173/docs"` adresinden yayınlanır. Vitepress tüm site içi bağlantıları bu parametre ile oluşturur. Derleme sırasında esneklik sağlaması için ortam değişkeni ile karşılaştırılır. *Github-pages yayını için burada repo adınız olmalıdır.* 
  
  - `head -> meta -> content` **SEO** ( Search Engine Optimization ), arama motorları için anahtar kelimeler.
  
  - `themeConfig -> logo` sol üstte görünecek uygulama ikonlarıdır. Dosyalar `src/public` içinde olmalıdır.
  - `siteTitle` sol üstte görünecek olan site başlığı.
  - `search` gezinti çubuğuna site içi arama yapmanızı sağlayan bir buton ekler.
  - `docFooter: { prev: "Önceki Sayfa", next: "Sonraki Sayfa" }` Sitenin ingilizce varsayılanlar (`Next Page`) yerine  yerine Türkçe karşılığı ile derlenmesini sağlar.
  - `nav : []`, gezinti çubuğunda görünecek bağlantılar.
  - `sidebar:[]`, sol panel menüsü.


---
## Turborepo ayarlarını güncelleyin

Kök dizinde bulunan `turbo.json` dosyanızdaki `build` görevinin çıktılarına (`outputs`) VitePress derleme ( `**/.vitepress/dist/**` ) klasörünü ekleyin. Bu sayede Turborepo önbellekleme (caching) yapabilir.

```json
{
  "$schema": "https://turbo.build",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "**/.vitepress/dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```


## Bağımlılıkları Yükleyin
Projenin en kök dizinine (root) dönün ve pnpm filtresiyle bağımlılıkları sadece `docs` projesine geliştirme bağımlılığı (`-D`) olarak yükleyin. Ekleyeceğimiz kütüphaneler  `package.json` dosyasında tanımlı olduğu için `pnpm install` komutu da yeterli olacaktır. 

```bash
pnpm --filter docs add -D vitepress vue
```



## Projeyi Çalıştırma


```text
📁 apps                     
└── 📁 docs                 
    ├── 📁 node_modules      # Node.js/npm paket bağımlılıkları dizini.
    ├── 📁 src              
    │   ├── 📁 .vitepress   
    │   │   ├── 📁 cache     # geçici çalıştırma dosyaları
    │   │   └── 📄 config.ts
    │   ├── 📁 public       
    │   │   ├── 📄 logo.svg 
    │   │   └── 📄 logod.svg
    │   ├── 📄 index.md     
    │   └── 📄 plan.md      
    └── 📄 package.json      # Node.js proje manifestosu; bağımlılıkları, betikleri ve meta verileri tanımlar.
```

- Dökümantasyon projesini yerelde ayağa kaldırmak için monorepo kök dizininde şu komutu çalıştırın.

```bash
pnpm dev --filter docs
```
Siteyi derlemek için :
```bash
pnpm --filter docs build
```
Derlenmiş kodu çalıştırmak için :
```bash
pnpm --filter docs preview
```

Siteye git
```
http://localhost:5173
```


