# 🚀 Monorepo File Analyzer - Geliştirme ve Kurulum Kılavuzu

Bu doküman, Turborepo monorepo mimarisi içerisinde sıfırdan, şablon kalıntılarından arındırılmış olarak inşa edilen **Vite + React + TypeScript + Tailwind CSS (v3)** tabanlı dosya analiz uygulamasının yapısını, kurulum adımlarını ve teknik detaylarını içerir.

---

## 📂 1. Mevcut Proje Yapısı (File Tree)

Uygulama, monorepo kökündeki `apps/file-analyzer` dizini altında tamamen modüler ve bağımsız bir yapılandırmayla yer almaktadır:

```text
apps/file-analyzer/
├── src/
│   ├── components/
│   │   ├── FileTree.tsx        # Klasör ağacı görünümü (React Bileşeni)
│   │   ├── FileViewer.tsx      # Seçilen dosya içeriği (React Bileşeni)
│   │   └── AnalysisStats.tsx   # İstatistik paneli (React Bileşeni)
│   ├── utils/
│   │   ├── fileScanner.ts      # showDirectoryPicker API tarama mantığı (saf TS - küçük harf)
│   │   └── regexHelpers.ts     # file-info.json kuralları ve ignore eşleşmeleri (saf TS - küçük harf)
│   ├── types.ts                # FileNode vb. tip tanımlamaları (küçük harf)
│   ├── main.tsx
│   └── index.css
├── tailwind.config.js          # v3.4.4 Yapılandırması
├── tsconfig.json               # --jsx react-jsx hatası çözülmüş durum
└── package.json                # "type": "module" ekli

```

---

## 🛠️ 2. Gerçekleştirilen İşlem Adımları

Projenin kararlı bir şekilde ayağa kalkması için uygulanan adımlar sırasıyla şunlardır:

1. **Şablon Kalıntılarından Arınma:** `create vite` komutuyla gelen varsayılan şablonların monorepo kilit dosyaları ve PostCSS sürümleriyle çakışma yaratması üzerine, `apps/file-analyzer` klasörü tamamen silinmiş ve **boş bir klasör olarak sıfırdan** inşa edilmiştir.
2. **Doğru Workspace İsimlendirmesi:** `package.json` içerisindeki proje adı `@repo/file-analyzer` olarak monorepo standartlarına getirilmiştir.
3. **Lockfile Senkronizasyonu:** Yeni projenin monorepo bağımlılık ağacına kaydedilmesi için kök dizinde `pnpm install` komutu çalıştırılmış, böylece `Workspace not found in lockfile` uyarısı giderilmiştir.
4. **PostCSS ve Tailwind v3 Uyumu:** `index.css` dosyasında yaşanan `"use strict" (Pre-transform error)` hatası, sistemde kurulu olan Tailwind v3 kütüphanesine uygun `@tailwind base;` direktiflerine geri dönülerek ve `postcss.config.js` dosyası elle oluşturularak çözülmüştür.
5. **Giriş Noktası Eşlemesi:** `index.html` üzerindeki asenkron yüklenen ve tarayıcı güvenlik duvarına takılan harici CDN scriptleri kaldırılmış; yerel `src/index.css` dosyası `main.tsx` üzerinden güvenli bir şekilde projeye bağlanmıştır.

---

## 📄 3. Dosya Açıklamaları ve Teknik Rolleri

### ⚙️ Yapılandırma Dosyaları

- **`package.json`:** Uygulamanın `@repo/file-analyzer` ismiyle monorepoya kaydolmasını sağlar. `react`, `lucide-react` gibi üretim bağımlılıkları ile `tailwindcss`, `postcss`, `autoprefixer` gibi geliştirme araçlarını yönetir.
- **`index.html`:** Tarayıcının projeyi yüklediği ana dosyadır. İçerisinde React uygulamasının render edildiği `<div id="root"></div>` alanını barındırır.
- **`postcss.config.js`:** Tailwind CSS kodlarının tarayıcının anlayacağı standart CSS stil kurallarına dönüştürülmesini tetikleyen eklenti köprüsüdür.
- **`tailwind.config.js`:** Tailwind motoruna `src/` altındaki hangi dosya uzantılarının (`.ts`, `.tsx`) taranacağını ve içerisindeki CSS sınıflarının ayıklanacağını söyler.
- **`vite.config.ts`:** Vite'ın React (`@vitejs/plugin-react`) modüllerini ve TypeScript derleme süreçlerini hızlıca yönetmesini sağlayan ana derleyici ayar dosyasıdır.

### 💻 Kaynak Kodlar (`src/`)

- **`main.tsx`:** Uygulamanın giriş kapısıdır. `index.css` dosyasını projeye dahil eder ve ana `App.tsx` bileşenini DOM ağacına basar.
- **`index.css`:** `@tailwind` direktiflerini barındıran ve tüm uygulamada geçerli olan arka plan rengi, yazı tipi gibi küresel CSS kurallarını içeren dosyadır.
- **`types.ts` (`file-info.json` Yapısı):** Projenin kural motorunu besleyen şemadır. İçerisinde `.DS_Store`, `node_modules`, `.env.*` ve `*.log` gibi kritik kalıpları barındırır. Her kural için **Regex desteği** (`isRegex: true/false`) ve anlık tarama kontrolü (`ignore: true/false`) anahtarlarını dışa aktarır.
- **`FileTree.tsx`:** Kendisine gelen hiyerarşik dosya düğümünü (`FileNode`) inceler. Eğer düğüm bir klasörse ve alt kırılımları varsa, kendi kendini tekrar çağırarak (Recursive) ekrana ağaç çizgileri ve ikonlar (`lucide-react`) eşliğinde hiyerarşik olarak basar. Yoksayılan dosyaların üstünü çizerek eşleşen regex kuralını gösterir.
- **`App.tsx`:** Kontrol merkezidir. Tarayıcının **File System Access API (`showDirectoryPicker`)** motorunu kullanarak asenkron olarak yerel diski tarar. `types.ts` içerisindeki regex kurallarını canlı olarak dosyalar üzerinde test eder. Sol paneldeki switch butonları değiştikçe dosya ağacını anlık olarak yeniden filtreler ve sağ panelde dinamik bir **Markdown Raporu** (.md tablosu) üreterek önizleme sunar.

---

## 🚀 4. Projeyi Çalıştırma Komutları

Monorepo kök dizininizde (`saasguide`) terminal üzerinden aşağıdaki komutları kullanarak projeyi sıfır önbellekle ve kararlı bir şekilde tetikleyebilirsiniz:

```bash
# 1. Bağımlılık ağacını lockfile üzerine işleyin
pnpm install

# 2. Eski derleme önbelleklerini ezerek geliştirme sunucusunu başlatın
pnpm turbo run dev --filter=@repo/file-analyzer --force
```

Uygulama başarıyla başladığında tarayıcınızda `http://localhost:5173` (veya terminalde belirtilen portta) yan yana iki sütunlu, modern, karanlık mod odaklı proje analiz paneli açılacaktır.
