# Proje Yapılandırma ve Ortam Bilgi Kılavuzu

Bu doküman, projenizde kullanılan küresel yoksayma (ignore) kalıplarını, kritik yapılandırma dosyalarını ve yaygın dosya uzantılarını standartlaştırmak için oluşturulmuş bir veri başvuru kaynağıdır.

---

## 📌 1. Genel Ignore (Yoksayma) Kalıpları

### 📂 SYSTEM AND OS

| Kalıp | Açıklama |
| :--- | :--- |
| `.DS_Store` | macOS klasör özelleştirme ve dizin nitelikleri veri dosyası. |
| `Thumbs.db` | Windows Gezgini küçük resim önbellek dosyası. |
| `desktop.ini` | Windows klasör yapılandırma ve görünüm ayarları dosyası. |

### 📂 DEPENDENCIES AND PACKAGES

| Kalıp | Açıklama |
| :--- | :--- |
| `node_modules/` | Node.js/npm paket bağımlılıkları dizini. |
| `bower_components/` | Bower web ön uç paket yöneticisi dizini. |
| `.pnp.*` | Yarn Plug'n'Play (PnP) bağımlılık eşleme ve kurulum dosyaları. |
| `vendor/` | Composer (PHP) veya Go bağımlılık kaynak kodları dizini. |

### 📂 BUILD AND OUTPUTS

| Kalıp | Açıklama |
| :--- | :--- |
| `dist/` | Üretim ortamına hazır derlenmiş (distribution) çıktı dizini. |
| `build/` | Uygulama derleme (build) süreçlerinde oluşturulan geçici/kalıcı çıktılar. |
| `out/` | Derleyiciler veya Next.js gibi çerçevelerin statik çıktı dizini. |
| `.next/` | Next.js çerçevesinin derleme ve canlı ortam önbellek dizini. |
| `.nuxt/` | Nuxt.js çerçevesinin çalışma zamanı ve derleme dizini. |

### 📂 ENVIRONMENT AND SECRETS

| Kalıp | Açıklama |
| :--- | :--- |
| `.env` | Yerel ortam değişkenlerini ve gizli anahtarları içeren ana dosya (Asla commitlemeyin). |
| `.env.local` | Yerel geliştirmeye özel, ortam değişkenleri ezme dosyası. |
| `*.local` | Geliştiricinin yerel makinesine özel tüm yerel yapılandırma varyasyonları. |
| `.env.production.local` | Canlı ortam yerel gizli değişkenleri. |

### 📂 LOGS AND DIAGNOSTICS

| Kalıp | Açıklama |
| :--- | :--- |
| `*.log` | Uygulama, sunucu veya derleme süreçlerine ait log (günlük) kayıtları. |
| `npm-debug.log*` | npm komutları hata verdiğinde oluşan detaylı hata ayıklama günlüğü. |
| `yarn-debug.log*` | Yarn paket yöneticisi hata ayıklama günlüğü. |
| `.eslintcache` | ESLint kod analiz aracının hızlandırma amaçlı önbellek dosyası. |

### 📂 IDES AND TOOLS

| Kalıp | Açıklama |
| :--- | :--- |
| `.vscode/` | Visual Studio Code editörüne özel yerel çalışma alanı ayarları. |
| `.idea/` | JetBrains (WebStorm, IntelliJ) IDE'lerine ait proje konfigürasyon dizini. |
| `*.suo` | Visual Studio kullanıcı seçenekleri ve yerel editör durum dosyası. |
| `*.ntvs*` | Node.js Tools for Visual Studio proje ayarları. |

---

## 📌 2. Uygulama Geliştirme Sabit Dosyaları

### ⚙️ CONFIGURATION

| Dosya Adı | Açıklama |
| :--- | :--- |
| `package.json` | Node.js proje manifestosu; bağımlılıkları, betikleri ve meta verileri tanımlar. |
| `turbo.json` | Turborepo monorepo görev yönetim, önbellekleme ve pipeline yapılandırma dosyası. |
| `tsconfig.json` | TypeScript derleyici seçenekleri, yol eşlemeleri (path aliases) ve kapsam ayarları. |
| `next.config.js` | Next.js çerçevesine ait yönlendirme, webpack ve derleme optimizasyonu ayarları. |
| `dockerfile` | Uygulamanın Docker jurisine ait imaj oluşturma adımları. |
| `docker-compose.yml` | Çoklu konteyner içeren Docker uygulamalarının ağ ve servis tanımlamaları. |

### ⚙️ PACKAGE LOCKS

| Dosya Adı | Açıklama |
| :--- | :--- |
| `package-lock.json` | npm bağımlılık ağacının tam sürümlerini kilitleyen kilit dosyası. |
| `yarn.lock` | Yarn paket yöneticisinin bağımlılık sürüm kararlılığını sağlayan kilit dosyası. |
| `pnpm-lock.yaml` | pnpm paket yöneticisinin içerik adreslemeli depolama kilit dosyası. |

### ⚙️ DOCUMENTATION

| Dosya Adı | Açıklama |
| :--- | :--- |
| `README.md` | Projenin amacını, kurulum adımlarını ve kullanım talimatlarını içeren ana kılavuz. |
| `CONTRIBUTING.md` | Projeye katkıda bulunmak isteyen geliştiriciler için kod standartları kılavuzu. |
| `LICENSE` | Projenin telif hakkı, kullanım ve yasal izin sınırlarını belirten metin. |

---

## 📌 3. Yaygın Dosya Uzantıları ve Anlamları

### 📄 SOURCE CODE

| Uzantı | Açıklama |
| :--- | :--- |
| `.js` | Standart JavaScript kaynak kodu dosyası. |
| `.ts` | Tip güvenliği eklenmiş TypeScript kaynak kodu dosyası. |
| `.jsx` | React bileşenleri içeren, JavaScript içine gömülü XML/HTML dosyası. |
| `.tsx` | Tip güvenliği barındıran React (TypeScript JSX) bileşen dosyası. |
| `.py` | Python programlama dili kaynak kodu dosyası. |

### 📄 STYLES AND MARKUP

| Uzantı | Açıklama |
| :--- | :--- |
| `.css` | Web sayfalarının stil tasarımlarını belirleyen Cascading Style Sheets dosyası. |
| `.scss` | Sass ön işlemcisi ile yazılan gelişmiş stil dosyası. |
| `.html` | Web sayfalarının iskeletini oluşturan standart işaretleme dosyası. |

### 📄 DATA AND SERIALIZATION

| Uzantı | Açıklama |
| :--- | :--- |
| `.json` | Hafif, anahtar-değer çiftlerinden oluşan veri değişim formatı. |
| `.yaml` | Yapılandırma dosyalarında (CI/CD, Docker) yaygın kullanılan okunabilir format. |
| `.xml` | Genişletilebilir işaretleme dili; yapılandırılmış veri aktarımı için kullanılır. |
| `.csv` | Tablolar arasında veri aktarımı sağlayan, virgülle ayrılmış değerler dosyası. |

### 📄 ASSETS AND MEDIA

| Uzantı | Açıklama |
| :--- | :--- |
| `.svg` | Çözünürlükten bağımsız, XML tabanlı vektörel grafik formatı. |
| `.png` | Kayıpsız sıkıştırma ve şeffaflık desteği sunan raster piksel grafik formatı. |
| `.webp` | Web ortamı için optimize edilmiş, yüksek sıkıştırma oranlı modern görsel formatı. |
