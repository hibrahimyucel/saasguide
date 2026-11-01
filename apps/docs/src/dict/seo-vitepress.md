
# VitePress SEO Yapılandırma Rehberi <Badge type="warning" text="AI" />

VitePress, varsayılan olarak statik site üretimi (**SSG**) yaptığı için arama motoru optimizasyonu (SEO) açısından oldukça avantajlı bir altyapıya sahiptir. Bu rehber, VitePress projenizin arama motorlarında (Google, Bing vb.) en üst sıralarda yer alması için yapılması gereken teknik adımları içerir.

---

## 1. Global Meta Verileri (`config.mts`)

Tüm sitenizde geçerli olacak varsayılan başlık, açıklama ve arama motoru etiketlerini `.vitepress/config.mts` (veya `.js`) dosyasında tanımlayın.

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  // Arama motorlarında sekme ve sonuç başlığı
  title: "Proje Adınız", 
  
  // Sitenizin ana açıklaması (Snippet)
  description: "Projenizin ne işe yaradığını belirten, anahtar kelimeler içeren SEO açıklaması.",
  
  // Arama motoru botları için ek kafa (head) etiketleri
  head: [
    ['meta', { name: 'keywords', content: 'vitepress, documentation, seo, vue' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: 'https://siteniz.com' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ]
})
```

---

## 2. Sayfa Bazlı Meta Verileri (Frontmatter)

Her Markdown (`.md`) dosyafının en başına, o sayfaya özel başlık ve açıklama ekleyin. Sayfa bazlı ayarlar, global ayarları ezerek arama motorlarının içeriğinizi daha doğru anlamlandırmasını sağlar.

```markdown
---
title: VitePress Gelişmiş SEO Ayarları
description: VitePress sitenizi arama motorları için nasıl optimize edeceğinizi adım adım öğrenin.
keywords: vitepress seo, frontmatter ayarları, site haritası
---

# VitePress Gelişmiş SEO Ayarları

Sayfa içeriği buraya gelir...
```

---

## 3. Otomatik Site Haritası (Sitemap)

Arama motoru botlarının sitenizdeki tüm sayfaları eksiksiz taraması için bir site haritası üretmelisiniz. VitePress bu özelliği yerleşik olarak destekler.

`.vitepress/config.mts` dosyanıza `sitemap` özelliğini ekleyin:

```typescript
export default defineConfig({
  sitemap: {
    hostname: 'https://siteniz.com'
  }
})
```
*Bu ayar aktif edildiğinde, `npm run build` komutu sonrasında `dist/sitemap.xml` dosyası otomatik olarak oluşturulur.*

---

## 4. Temiz URL Yapısı (`cleanUrls`)

Kullanıcı dostu ve SEO uyumlu kısa bağlantılar için URL sonlarındaki `.html` uzantısını kaldırın.

```typescript
export default defineConfig({
  cleanUrls: true
})
```

> ⚠️ **Önemli Not:** Bu ayarı açtığınızda, sitenizi barındırdığınız sunucunun (Vercel, Netlify, Nginx vb.) uzantısız gelen istekleri (örn: `/rehber`) doğru HTML dosyasına (`/rehber.html`) yönlendirecek şekilde yapılandırıldığından emin olun.

---

## 5. Yinelenen İçerik Engelleme (Canonical URL)

Arama motorlarının, URL sonundaki eğik çizgiler (`/`) veya parametreler nedeniyle sitenizde yinelenen (duplicate) içerik cezası uygulamasını önlemek için kalıcı bağlantıları (`rel="canonical"`) dinamik olarak oluşturun.

`.vitepress/config.mts` dosyasına aşağıdaki kancayı (`hook`) ekleyin:

```typescript
export default defineConfig({
  transformPageData(pageData) {
    // Sayfa yolunu temizle ve canonical URL oluştur
    const canonicalUrl = `https://siteniz.com{pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '.html');
    
    // Head dizisini kontrol et ve canonical etiketini bas
    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push([
      'link', { rel: 'canonical', href: canonicalUrl }
    ]);
  }
})
```

---

## 6. Tarama Kontrolü (`robots.txt`)

Botların sitenizin hangi alanlarını tarayıp taramayacağını belirtmek için projenizin **`public`** klasörü içerisine `robots.txt` dosyası oluşturun.

```text
# public/robots.txt

User-agent: *
Allow: /
Disallow: /sso-callback/
Disallow: /admin/

Sitemap: https://siteniz.com
```

---

## 🚀 İçerik ve Görsel SEO Kuralları

Teknik ayarların yanı sıra Markdown yazarken şu kurallara dikkat edin:

* **Semantik Başlık Yapısı:** Sayfa içinde sadece bir tane `# H1` başlığı kullanın. Alt başlıkları `## H2`, `### H3` şeklinde hiyerarşik olarak sıralayın.
* **Görsel Alt Metinleri:** Markdown içindeki tüm görsellere açıklayıcı `alt` etiketleri ekleyin:
  ```markdown
  ![VitePress SEO Ayarları Ekran Görüntüsü](/images/seo-settings.png)
  ```
* **İç Linkleme:** Sayfalarınız arasında mantıklı iç bağlantılar kurarak botların sitenizde daha rahat dolaşmasını sağlayın:
  ```markdown
  Daha fazla bilgi için [Kurulum Rehberi](/guide/installation) sayfamıza göz atın.
  ```

