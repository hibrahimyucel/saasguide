
# Proje Oluşturma

Monorepo yapımıza `apps/` dizini altına bir VitePress dökümantasyon projesi ekliyoruz.

---
## Klasör Yapısını Oluşturun
Monorepo projenizin kök dizindeyken `apps` altında proje  klasörlerinizi oluşturun.




```text
📁 
├── 📁 apps/                        # Dağıtılabilir / çalıştırılabilir ana uygulamalar
│   └── 📁 docs/                    # Dökümantasyon (Vitepress)
│
├── 📁 infra/                       # Docker operasyonel dosyaları ve orkestrasyon
│   └── 📁 gateway/                 # Edge Router - Nginx klasörü
│       ├── 📁 nginx/               # Nginx konfigürasyon klasörü
│       │   ├── 📁 certs/           # SSL 
│       │   ├── 📄 test.conf        # Nginx test yapılandırması
│       │   └── 📄 dev.conf         # Nginx developper reverse proxy ayarları
│       └── 📄 docker-compose.yml   # Çoklu konteyner orkestrasyon dosyası
│
├── 📁 .github/                     # CI/CD (GitHub Actions) iş akışları
│   └── 📁 workflows/
│       └── 📄 deploy-docs.yml
│
├── 📄 .gitignore                   # Git tarafından takip edilmeyecek dosyalar
├── 📄 .dockerignore                # Docker tarafından takip edilmeyecek dosyalar
├── 📄 package.json                 # Monorepo kök bağımlılıkları ve scriptleri
├── 📄 pnpm-workspace.yaml          # Çalışma alanlarını (workspaces) tanımlayan dosya
├── 📄 README.md                    # Proje açıklamaları
├── 📄 turbo.json                   # Turborepo yapılandırma dosyası
└── 📄 tsconfig.json                # Ortak TypeScript ana yapılandırması
```






```bash
mkdir -p apps/docs
mkdir -p apps/docs/src/.vitepress
mkdir -p apps/docs/src/public
```

---

## Alt Proje `package.json` Dosyasını Oluşturun
`apps/docs/package.json` dosyasını oluşturun ve aşağıdaki içeriği ekleyin:

```json
{
  "name": "docs",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev src",
    "build": "vitepress build src",
    "preview": "vitepress preview src"
  },
  "devDependencies": {
    "vitepress": "^1.6.4",
    "vue": "^3.5.44"
  }
}
```

---

## Bağımlılıkları Yükleyin
Projenin en kök dizinine (root) dönün ve pnpm filtresiyle bağımlılıkları sadece `docs` projesine geliştirme bağımlılığı (`-D`) olarak yükleyin:

```bash
pnpm --filter docs add -D vitepress vue
```

---

## Kaynak Klasörünü ve İlk Sayfayı Oluşturun
VitePress dosyalarının düzenli durması için kodları `src` altında toplayın. İlk giriş sayfalarımızı (`index.md`,`plan.md`) oluşturun:

```bash

echo '# Merhaba Monorepo Dökümantasyonu' > apps/docs/src/index.md
echo '# Monorepo Kılavuz İş Listesi' > apps/docs/src/plan.md
```

---

## VitePress Ayar Dosyasını Oluşturun
`apps/docs/src/.vitepress/config.ts` dosyasını oluşturun ve temel tema ayarlarını ekleyin:

```typescript
import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Proje Dökümantasyonu",
  description: "Monorepo VitePress Sitesi",
  themeConfig: {
    logo: {
      light: "/logo.svg",
      dark: "/logod.svg",
      alt: "Proje Logosu",
    },

    siteTitle: "Dökümantasyon",
    nav: [
      { text: "Ana Sayfa", link: "/" },
      { text: "Plan", link: "/plan" },
    ],
    sidebar: [
      {
        text: "Giriş",
        items: [
          { text: "Başlangıç", link: "/" },
          { text: "Plan", link: "/plan" },
        ],
      },
    ],
  },
})
```

## Site ikonu
`apps/docs/src/public` klasörünü oluşturun. Açık ve karanlık mod için iki svg (`logo.svg`,`logod.svg`) dosyası kopyalayaın. 

---

## Turborepo ayarlarını (`turbo.json`) Güncelleyin

Kökte bulunan ana `turbo.json` dosyanızdaki `build` görevinin çıktılarına (`outputs`) VitePress derleme klasörünü ekleyin. Bu sayede Turborepo önbellekleme (caching) yapabilir:

```json
{
  "$schema": "https://turbo.build",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "**/dist/**", "**/.vitepress/dist/**"]

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

---

## Projeyi Çalıştırma

Dökümantasyon projesini yerelde ayağa kaldırmak için monorepo kök dizininde şu komutu çalıştırın.

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

## Kontrol
  - Başlık çubuğunda site adresiniz yerine etiketiniz görünür.
  - Başlık çubuğunda Ana Sayfa ve Plan düğmeleri sağdadır.
  - Dark-Light mod için sayfa ikonunuz değişir.
  - Sidebar otomatik olarak oluşturulmuştur. index.md (Başlangıç) ve plan.md (Plan) dosya içeriği görünür.
  - İçerik bölümünün alında önceki ve sonraki sayfa bağlantıları görünür.
   
