---
title: >-
  VitePress: Vue & Vite Tabanlı Statik Dokümantasyon Üreticisi (Tanıtım,
  Referans ve Sözlük)
description: >-
  VitePress, Vite ve Vue 3 üzerine inşa edilen; Markdown dosyalarını yüksek
  performanslı, SEO uyumlu statik HTML sayfalarına dönüştüren ve sayfa
  yüklendik...
outline:
  - 2
  - 3
status: published
tags:
  - vitepress
  - ssg
  - vue
  - vite
  - markdown
  - documentation
  - lexical-database
  - referans
---

# VitePress: Statik Dokümantasyon Site Üreticisi (SSG)

* **Üretici / Geliştirici:** Evan You & Vue.js Çekirdek Ekibi
* **Resmi Web Sitesi:** [vitepress.dev](https://vitepress.dev)
* **Mimari Bağlamı:** `apps/docs` (Single Source of Truth Dökümantasyon Portalı)

::: info CONCEPT MATRICES
* **Domain:** Technical Documentation & Web Publishing
* **Superordinate Concept:** Static Site Generator (SSG) with SPA Hydration
* **Core Engine:** Vite (Rollup / esbuild) + Vue 3
* **Rendering Strategy:** Pre-rendered Static HTML + Client-Side Vue Hydration
:::

## 1. Tanım

**VitePress**, **Vite** ve **Vue 3** üzerine inşa edilen; Markdown dosyalarını yüksek performanslı, SEO uyumlu statik HTML sayfalarına dönüştüren ve sayfa yüklendikten sonra Tek Sayfa Uygulaması (SPA) hızında istemci tarafı etkileşimi sunan modern bir Statik Site Üreticisidir (SSG).

---

## 2. Mimari Rolü ve Temel Prensipleri

**VitePress**, sadece markdwon dosyalarından tüm döküman sistemini yayına hazır bir site olarak hazırlar. Belge düzenleme veya yayınlama için vakit kaybetmezsiniz.  

* **Hibrit Mimari (SSG + SPA):** İlk açılışta sunucudan saf ve çok hızlı statik HTML sayfaları sunar; sonraki sayfa geçişlerinde ise sayfayı yeniden yüklemeden yalnızca ilgili sayfanın veri öbeğini (chunk) getirerek anlık geçiş sağlar.
* **Markdown İçinde Vue Bileşenleri:** Standart Markdown sözdiziminin yanında özel uyarılara (`::: info`, `::: tip`), kod gruplarına ve doğrudan `.md` dosyası içine gömülen etkileşimli Vue 3 bileşenlerine izin verir.
* **Sıfır Maliyetli Barındırma:** Derleme (`build`) sonucunda saf statik dosyalar (`.vitepress/dist`) ürettiği için veritabanı veya backend gerektirmez. Statik dosya yayınlayabilen herhangi uygulama veya platform yeterlidir  (**Nginx**,Github-Pages,Shared Hosting).

---

## 3. Sözlük Veritabanı (Lexical Database)

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **SSG (Static Site Generation)** | Statik Site Üretimi | Sayfaların kullanıcı isteği anında değil, derleme (build) aşamasında önceden HTML olarak üretilmesi yöntemi. |
| **Hydration** | İstemci Canlandırma | Sunucudan gelen statik HTML sayfasının tarayıcıda JavaScript (Vue) ile etkileşimli bir uygulamaya dönüşme süreci. |
| **Front Matter** | Sayfa Üst Verisi | Markdown dosyalarının en üstünde `---` işaretleri arasında yer alan, sayfa başlığı, düzeni ve etiketlerini belirleyen YAML bloğu. |
| **Custom Containers** | Özel Bilgi Kutuları | `::: info`, `::: warning`, `::: danger` sözdizimiyle oluşturulan görsel vurgu blokları. |
| **Sidebar / Nav** | Kenar Çubuğu / Üst Menü | `.vitepress/config.mts` dosyasında tanımlanan hiyerarşik dokümantasyon gezinme ağacı. |
| **Dead Link Check** | Kırık Bağlantı Denetimi | Derleme sırasında dokümanlar arasındaki geçersiz iç veya dış bağlantıları otomatik tespit edip derlemeyi durduran güvenlik mekanizması. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

```bash
# Yerel geliştirme sunucusunu anlık yenileme (HMR) ile başlatır
pnpm --filter docs dev

# Üretim (production) için statik HTML/CSS/JS dosyalarını derler
pnpm --filter docs build

# Derlenen üretim çıktısını yerel olarak önizler
pnpm --filter docs preview
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [VitePress Guide](https://vitepress.devguide/what-is-vitepress)
* **Markdown Eklentileri:** [VitePress Markdown Extensions](https://vitepress.devguide/markdown)
