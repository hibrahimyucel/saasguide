import { defineConfig } from "vitepress";
import { generateDynamicSidebar } from "./sidebar";

export default defineConfig({

  base: "/saasguide/",
  title: "SaaS-VPS Rehberi",
  description: "SaaS Rehberi VitePress Sitesi",
  
  head: [
    ['meta', { name: 'keywords', content: 'vitepress, dökümantasyon, markdown, seo, vue, nodejs, docker, monorepo, nestjs, turborepo, typescript' }]
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

