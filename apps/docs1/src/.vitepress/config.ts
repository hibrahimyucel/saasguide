import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Proje Dokümantasyonu",
  description: "Monorepo VitePress Sitesi",
  themeConfig: {
    
    logo: {
  light: '/logo.svg',
  dark: '/logo.svg',
  alt: 'Proje Logosu'
},
 
    siteTitle: 'Dokümantasyon',
    nav: [
      { text: 'Ana Sayfa', link: '/' },
      { text: 'Plan', link: '/plan' }
    ],
    sidebar: [
      {
        text: 'Giriş',
        items: [
          { text: 'Başlangıç', link: '/' },
          { text: 'Plan', link: '/plan' }
        ]
      }
    ]
  }
})
