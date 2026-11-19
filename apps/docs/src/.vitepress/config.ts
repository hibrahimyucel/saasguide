import { defineConfig } from "vitepress";
import { generateDynamicSidebar } from "./sidebar";
import fs from "node:fs";

// config.ts en üstüne bir Set ekleyin:
const hiddenUrls = new Set<string>();
const siteURL = "https://pr2cloud.duckdns.org/docs/";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/docs/",

  markdown: {
    languageAlias: {
      env: "dotenv",
      gitignore: "ini",
      dockerignore: "ini",
      cron: "bash",
    },
  },

  vite: {
    server: {
      host: true,
      port: 5173,
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
              // config.ts dosyasına dokunarak VitePress'in sidebar fonksiyonunu yeniden çalıştırmasını sağlar
              fs.utimesSync(__filename, now, now);
            }
          };

          server.watcher.on("add", touchConfig);
          server.watcher.on("unlink", touchConfig);
          server.watcher.on("change", touchConfig); // Front matter değişikliklerinde sidebar'ı canlı yeniler
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
  cleanUrls: true, // URL sonlarındaki .html uzantılarını kaldırır (SEO için kritik)

  sitemap: {
    hostname: siteURL,
    transformItems: (items) => {
      return items.filter((item) => {
        const cleanItemUrl = item.url.replace(/^\/docs\//, "");
        // Tam eşleşen gizli sayfaları veya gizli klasör altındaki tüm alt sayfaları dışla
        for (const hidden of hiddenUrls) {
          if (
            cleanItemUrl === hidden ||
            (hidden.endsWith("/") && cleanItemUrl.startsWith(hidden))
          ) {
            return false;
          }
        }
        return true;
      });
    },
  },

  // Her sayfanın Front Matter verisinden dinamik SEO ve OpenGraph etiketleri üretir
  transformPageData(pageData) {
    const relativeCleanPath = pageData.relativePath
      .replace(/index\.md$/, "")
      .replace(/\.md$/, "");
    const canonicalUrl = siteURL;

    const pageTitle =
      pageData.frontmatter.title || pageData.title || "SaaS-VPS Rehberi";
    const pageDesc =
      pageData.frontmatter.description ||
      "Self-hosted SaaS altyapısı ve monorepo geliştirme rehberi.";

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ["link", { rel: "canonical", href: canonicalUrl }],
      ["meta", { property: "og:locale", content: "tr_TR" }],
      ["meta", { property: "og:type", content: "article" }],
      ["meta", { property: "og:title", content: pageTitle }],
      ["meta", { property: "og:description", content: pageDesc }],
      ["meta", { property: "og:url", content: canonicalUrl }],
      ["meta", { name: "twitter:card", content: "summary" }],
      ["meta", { name: "twitter:title", content: pageTitle }],
      ["meta", { name: "twitter:description", content: pageDesc }],
    );

    if (Array.isArray(pageData.frontmatter.keywords)) {
      pageData.frontmatter.head.push([
        "meta",
        { name: "keywords", content: pageData.frontmatter.keywords.join(", ") },
      ]);
    }

    if (pageData.frontmatter.hidden === true) {
      hiddenUrls.add(relativeCleanPath);
      pageData.frontmatter.head.push([
        "meta",
        { name: "robots", content: "noindex, nofollow" },
      ]);
    }
  },

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
      copyright: `Telif Hakkı © ${new Date().getFullYear()} İbrahim YÜCEL`,
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
      { text: "Sözlük", link: "/dict/", activeMatch: "/dict/" },
      { text: "Rehber", link: "/rehber/", activeMatch: "/rehber/" },
      { text: "tümü", link: "/", activeMatch: "/" },
    ],

    sidebar: {
      "/": generateDynamicSidebar("src/", "/"),
      "/rehber/": generateDynamicSidebar("src/rehber", "/rehber/"),
      "/dict/": generateDynamicSidebar("src/dict", "/dict/"),
    },
  },
});
