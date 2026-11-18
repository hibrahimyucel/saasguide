# `1.` Vitepress SSG


İlk projemiz dökümanlarımız için [Vitepress SSG](https://vitepress.dev/) ile hazırlayacağımız statik bir site olacak. Bu adımda sadece temel proje yapısını oluşturup geliştirme ortamımıza yoğunlaşacağız.

*Projeyi tamamladığımızda sadece markdown dosyaları oluşturup-düzenleyerek dökümantasyonu güncel tutabileceğiz.*


Monorepo yapımıza `apps/` dizini altına bir VitePress dökümantasyon projesi ekliyoruz.

## Klasör ve dosyalar
 
 Monorepo projenizin kök dizindeyken `apps` altında proje  klasörlerinizi, giriş sayfanızı ve örnek dosyanızı (`index.md`,`plan.md`) oluşturun:

```bash
mkdir -p apps/docs/src/.vitepress
mkdir -p apps/docs/src/public

echo '# Monorepo Dökümantasyonu' > apps/docs/src/index.md
echo '# Monorepo İş Listesi' > apps/docs/src/plan.md
echo '  ' > apps/docs/package.json
echo '# Monorepo İş Listesi' > apps/docs/src/.vitepress/config.ts
```

---
 ### Proje dosyasını oluşturun ve aşağıdaki içeriği ekleyin:

:::details `apps/docs/package.json`
```json
{
  "name": "saasrehberi",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev src --host 0.0.0.0 --port 5180",
    "build": "vitepress build src",
    "preview": "vitepress preview src"
  },
  "devDependencies": {
    "vitepress": "^1.6.4",
    "vue": "^3.5.44"
  }
}

```
:::

:::info dosya parametreleri

- name : **saasrehberi** projemizin adı
::: warning   onorepo içinde proje ile ilgili tüm komutlar bu kimlikle çalıştırılır.
`pnpm --filter saasrehberi dev`
:::
- scripts : projeyi çalıştırmak-derlemek kullanılan komutlar.
  - "dev": "vitepress dev src --host 0.0.0.0 --port 5173",
  
    **`"dev":`** Bu, komutun takma adıdır. Terminalde tüm komutu yazmak yerine sadece `npm run dev` yazarak bu işlemi tetiklemenizi sağlar.
    
    **`vitepress dev`** VitePress geliştirme sunucusunu başlatır.
    
    **`src`** Dokümantasyon dosyalarınızın (Markdown dosyaları, yapılandırma vb.) bulunduğu ana klasörü belirtir. VitePress bu klasörü kök dizin olarak kabul eder.
    
    **`--host 0.0.0.0`**  Projemiz *statik site* olmasına rağmen geliştirme ortamında sayfalar **`vitepress dev`** komutunun oluşturduğu *backend* ile soket bağlantısı üzerinden haberleşerek çalışır. Bu parametre ile geliştirme sunucusu tüm adreslerden gelen talepleri dinler ve **HMR** (Hot Module Replacement), yaptığınız değişikliklerin anlık olarak uygulanmasını sağlar. Geliştirme ortamımız (Docker-Nginx) proxy ile çalışacağı için bu parametre olmadan **HMR** çalışmaz. 
         
       **`--port 5173`** Geliştirme sunucusunun hangi port üzerinden yayın yapacağını belirler. Tarayıcınızda `http://localhost:5173` adresine giderek sitenizi görüntüleyebilirsiniz.
 
 `pnpm --filter docs dev` monorepo içindeki **docs** projesi için `package.json` içindeki `dev` komutunu çalıştırır.

:::

---
 - VitePress ayar dosyasını oluşturun
 
:::details `apps/docs/src/.vitepress/config.ts`

```typescript
import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/",
  lang: "tr-TR",
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

  themeConfig: {
    logo: {
      light: "/logo.svg",
      dark: "/logod.svg",
      alt: "Proje Logosu",
    },

    siteTitle: "Dökümantasyon",
    
    socialLinks: [
      { icon: "github", link: "https://github.com" },
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
:::


  - `base: "/"` tanımlaması uygulamanın kök dizinden (`http://localhost:5173/`) çalışacağını gösterir. Dizin adı belirtmek için  `base: "/docs/"` şeklinde yazmalısınız. Bu durumda site `http://localhost:5173/docs"` adresinden yayınlanır. Vitepress tüm site içi bağlantıları bu parametre ile oluşturur. *Github-pages yayını için burada repo adınız olmalıdır.* 
  
  - `head -> meta -> content` **SEO** ( Search Engine Optimization ), arama motorları için anahtar kelimeler.
  
  - `themeConfig -> logo` sol üstte görünecek uygulama ikonlarıdır. Dosyalar `src/public` içinde olmalıdır.
  - `siteTitle` sol üstte görünecek olan site başlığı.
  - `search` gezinti çubuğuna site içi arama yapmanızı sağlayan bir buton ekler.
  - `docFooter: { prev: "Önceki Sayfa", next: "Sonraki Sayfa" }` Sitenin ingilizce varsayılanlar (`Next Page`) yerine  yerine Türkçe karşılığı ile derlenmesini sağlar.
  - `nav : []`, gezinti çubuğunda görünecek bağlantılar.
  - `sidebar:[]`, sol panel menüsü.


---
## Turborepo ayarlarını güncelleyin

Kök dizinde bulunan `turbo.json` dosyanızdaki `build` görevinin çıktılarına (`outputs`) VitePress derleme klasörünü ekleyin. Bu sayede Turborepo önbellekleme (caching) yapabilir. `**/dist/**`, `**/.vitepress/dist/**` ifadesini de kapsadığı için biri yeterlidir.

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


