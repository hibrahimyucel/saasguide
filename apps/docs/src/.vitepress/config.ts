import { defineConfig } from 'vitepress'

export default defineConfig({
  // GitHub'daki repository adınız neyse buraya tam olarak aynısını yazın
  // (Başında ve sonunda eğik çizgi olmalıdır)
  base: '/saasguide/', 
  title: "Proje Dokümantasyonu",
  description: "Monorepo VitePress Sitesi",
  
  // 1. Dil ayarını Türkçe yapın (SEO ve tarayıcı algılaması için)
  lang: 'tr-TR',

  themeConfig: {
  // Navigasyon barına logo ekleme
    logo: {
  light: '/logo.svg',
  dark: '/logo.svg',
  alt: 'Proje Logosu' // Ekran okuyucular için alt metin
},
    // İsteğe bağlı: Logonun yanında site başlığı görünsün mü? 
    // Sadece logo görünsün istiyorsanız siteTitle: false yapabilirsiniz.  
    siteTitle: 'Dokümantasyon',
      // --- SOSYAL MEDYA VE GIT LINKLERI ---
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hibrahimyucel/saasguide' },
      // İsteğe bağlı olarak diğer platformları da ekleyebilirsiniz:
      // { icon: 'discord', link: 'https://discord.gg' },
      // { icon: 'x', link: 'https://x.com' }
    ],
    // -------------------------------------
        // --- TÜRKÇE FOOTER (ALT BİLGİ) AYARI ---
    footer: {
      message: 'MIT Lisansı ile korunmaktadır.',
      copyright: `Telif Hakkı © ${new Date().getFullYear()} Monorepo Yönetimi`
    },
    // ----------------------------------------
    // 2. Arayüzdeki yerleşik İngilizce kelimeleri Türkçe yapın
    outline: {
      label: 'Bu Sayfada'
    },
    docFooter: {
      prev: 'Önceki Sayfa',
      next: 'Sonraki Sayfa'
    },
    lastUpdated: {
      text: 'Son Güncelleme'
    },
    returnToTopLabel: 'Başa Dön',
    sidebarMenuLabel: 'Menü',
    darkModeSwitchLabel: 'Görünüm',
    lightModeSwitchTitle: 'Açık Mod',
    darkModeSwitchTitle: 'Karanlık Mod',
    
    
    // --- TÜRKÇE YEREL ARAMA AYARI ---
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Ara',
            buttonAriaLabel: 'Arama yap'
          },
          modal: {
            noResultsText: 'Sonuç bulunamadı',
            resetButtonTitle: 'Aramayı temizle',
            footer: {
              selectText: 'Seçmek için',
              navigateText: 'Gezinmek için',
              closeText: 'Kapatmak için'
            }
          }
        }
      }
    },
    
    nav: [
      { text: 'Ana Sayfa', link: '/' },
      { text: 'Kılavuz', link: '/markdown-guide' }
    ],
    sidebar: [
      {
        text: 'Giriş',
        items: [
          { text: 'Başlangıç', link: '/' }
          ,
          { text: 'Markdown Kılavuzu', link: '/markdown-guide' },
          { text: 'Monorepo Kılavuzu', link: '/monorepo-guide' },
          { text: 'Github Pages Yayınlama', link: '/gh-pages' }
        ]
      }
    ]
  }
})
