import { defineConfig } from "vitepress";
import { generateDynamicSidebar } from "./sidebar";
import fs from "node:fs";
import { type HeadConfig } from "vitepress";

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

  title: "πr² Cloud",
  description: "πr² Cloud Döküman Sitesi",

  head: [
    [
      "meta",
      {
        name: "keywords",
        content:
          "vitepress, dökümantasyon, markdown, seo, vue, nodejs, docker, monorepo, nestjs, turborepo, typescript",
      },
    ],
    ["link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
    ],
    [
      "link",
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    ],
    ["link", { rel: "manifest", href: "/site.webmanifest" }],
    ["meta", { name: "theme-color", content: "#0f172a" }],
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

    const canonicalUrl = `${siteURL}${relativeCleanPath}`;

    const pageTitle =
      pageData.frontmatter.title || pageData.title || "πr² Cloud";
    const pageDesc =
      pageData.frontmatter.description ||
      "PaaS - SaaS & Yazılım Geliştirme Rehberi";

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

    // Global keywords meta etiketini ezerek sayfa bazlı tags değerlerini atar
    // 131-145. satırlar düzeltmesi (Tip güvenli tags -> keywords dönüşümü)
    if (Array.isArray(pageData.frontmatter.tags)) {
      const existingKeywordsIndex = pageData.frontmatter.head.findIndex(
        (item: HeadConfig) =>
          item[0] === "meta" &&
          typeof item[1] === "object" &&
          item[1]?.name === "keywords",
      );
      const keywordsMeta: [string, Record<string, string>] = [
        "meta",
        { name: "keywords", content: pageData.frontmatter.tags.join(", ") },
      ];

      if (existingKeywordsIndex !== -1) {
        pageData.frontmatter.head[existingKeywordsIndex] = keywordsMeta;
      } else {
        pageData.frontmatter.head.push(keywordsMeta);
      }
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
      light: "/logo-light.svg",
      dark: "/logo-dark.svg",
      alt: "Proje Logosu",
    },
    siteTitle: "πr² Cloud",

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
      {
        text: "Rehber",
        link: "/rehber/",
        activeMatch: "/rehber/",
      },
      { text: "Sözlük", link: "/dict/", activeMatch: "/dict/" },
    ],

    sidebar: {
      "/": generateDynamicSidebar("src/", "/"),
      "/rehber/": generateDynamicSidebar("src/rehber", "/rehber/"),
      "/dict/": generateDynamicSidebar("src/dict", "/dict/"),
    },
  },
});
