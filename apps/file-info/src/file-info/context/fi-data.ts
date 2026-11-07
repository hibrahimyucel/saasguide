// file-info.ts
import { FileInfo } from "./fi-types";

export const initialSchema: FileInfo[] = [
  {
    expression: "*workspace.*",
    extension: false,
    ignore: true,
    description: "teees itelikleri veri dosyası.",
    group: "system_and_os",
  },
  {
    expression: ".DS_Store",
    extension: false,
    ignore: true,
    description: "macOS klasör özelleştirme ve dizin nitelikleri veri dosyası.",
    group: "system_and_os",
  },
  {
    expression: "Thumbs.db",
    extension: false,
    ignore: true,
    description: "Windows Gezgini küçük resim önbellek dosyası.",
    group: "system_and_os",
  },
  {
    expression: "desktop.ini",
    extension: false,
    ignore: true,
    description: "Windows klasör yapılandırma ve görünüm ayarları dosyası.",
    group: "system_and_os",
  },
  {
    expression: "*.git",
    extension: false,
    ignore: true,
    description: "git repository klasörü.",
    group: "system_and_os",
  },
  {
    expression: "cache",
    extension: false,
    ignore: true,
    description: "geçici çalıştırma dosyaları",
    group: "system_and_os",
  },

  {
    expression: "node_modules",
    extension: false,
    ignore: true,
    description: "Node.js/npm paket bağımlılıkları dizini.",
    group: "dependencies_and_packages",
  },
  {
    expression: "bower_components",
    extension: false,
    ignore: true,
    description: "Bower web ön uç paket yöneticisi dizini.",
    group: "dependencies_and_packages",
  },
  {
    expression: ".pnp.*",
    extension: false,
    ignore: true,
    description:
      "Yarn Plug'n'Play (PnP) bağımlılık eşleme ve kurulum dosyaları.",
    group: "dependencies_and_packages",
  },
  {
    expression: "vendor",
    extension: false,
    ignore: true,
    description: "Composer (PHP) veya Go bağımlılık kaynak kodları dizini.",
    group: "dependencies_and_packages",
  },

  {
    expression: "dist",
    extension: false,
    ignore: true,
    description: "Üretim ortamına hazır derlenmiş (distribution) çıktı dizini.",
    group: "build_and_outputs",
  },
  {
    expression: "build",
    extension: false,
    ignore: true,
    description:
      "Uygulama derleme (build) süreçlerinde oluşturulan geçici/kalıcı çıktılar.",
    group: "build_and_outputs",
  },
  {
    expression: "out",
    extension: false,
    ignore: true,
    description:
      "Derleyiciler veya Next.js gibi çerçevelerin statik çıktı dizini.",
    group: "build_and_outputs",
  },
  {
    expression: ".next",
    extension: false,
    ignore: true,
    description: "Next.js çerçevesinin derleme ve canlı ortam önbellek dizini.",
    group: "build_and_outputs",
  },
  {
    expression: ".nuxt",
    extension: false,
    ignore: true,
    description: "Nuxt.js çerçevesinin çalışma zamanı ve derleme dizini.",
    group: "build_and_outputs",
  },
  {
    expression: ".env",
    extension: false,
    ignore: false,
    description:
      "Yerel ortam değişkenlerini ve gizli anahtarları içeren ana dosya (Asla commitlemeyin).",
    group: "environment_and_secrets",
  },
  {
    expression: ".env.local",
    extension: false,
    ignore: false,
    description: "Yerel geliştirmeye özel, ortam değişkenleri ezme dosyası.",
    group: "environment_and_secrets",
  },
  {
    expression: "*.local",
    extension: false,
    ignore: false,
    description:
      "Geliştiricinin yerel makinesine özel tüm yerel yapılandırma varyasyonları.",
    group: "environment_and_secrets",
  },
  {
    expression: ".env.production.local",
    extension: false,
    ignore: false,
    description: "Canlı ortam yerel gizli değişkenleri.",
    group: "environment_and_secrets",
  },
  {
    expression: "*.log",
    extension: false,
    ignore: false,
    description:
      "Uygulama, sunucu veya derleme süreçlerine ait log (günlük) kayıtları.",
    group: "logs_and_diagnostics",
  },
  {
    expression: "npm-debug.log*",
    extension: false,
    ignore: false,
    description:
      "npm komutları hata verdiğinde oluşan detaylı hata ayıklama günlüğü.",
    group: "logs_and_diagnostics",
  },
  {
    expression: "yarn-debug.log*",
    extension: false,
    ignore: false,
    description: "Yarn paket yöneticisi hata ayıklama günlüğü.",
    group: "logs_and_diagnostics",
  },
  {
    expression: ".eslintcache",
    extension: false,
    ignore: false,
    description:
      "ESLint kod analiz aracının hızlandırma amaçlı önbellek dosyası.",
    group: "logs_and_diagnostics",
  },

  {
    expression: ".vscode",
    extension: false,
    ignore: true,
    description:
      "Visual Studio Code editörüne özel yerel çalışma alanı ayarları.",
    group: "ides_and_tools",
  },
  {
    expression: ".idea",
    extension: false,
    ignore: true,
    description:
      "JetBrains (WebStorm, IntelliJ) IDE'lerine ait proje konfigürasyon dizini.",
    group: "ides_and_tools",
  },
  {
    expression: "*.suo",
    extension: false,
    ignore: true,
    description:
      "Visual Studio kullanıcı seçenekleri ve yerel editör durum dosyası.",
    group: "ides_and_tools",
  },
  {
    expression: "*.ntvs*",
    extension: false,
    ignore: true,
    description: "Node.js Tools for Visual Studio proje ayarları.",
    group: "ides_and_tools",
  },
  {
    expression: "package.json",
    extension: false,
    ignore: false,
    description:
      "Node.js proje manifestosu; bağımlılıkları, betikleri ve meta verileri tanımlar.",
    group: "configuration file",
  },
  {
    expression: "turbo.json",
    extension: false,
    ignore: false,
    description:
      "Turborepo monorepo görev yönetim, önbellekleme ve pipeline yapılandırma dosyası.",
    group: "configuration file",
  },
  {
    expression: "tsconfig.json",
    extension: false,
    ignore: false,
    description:
      "TypeScript derleyici seçenekleri, yol eşlemeleri (path aliases) ve kapsam ayarları.",
    group: "configuration file",
  },
  {
    expression: "next.config.js",
    extension: false,
    ignore: false,
    description:
      "Next.js çerçevesine ait yönlendirme, webpack ve derleme optimizasyonu ayarları.",
    group: "configuration file",
  },
  {
    expression: "dockerfile",
    extension: false,
    ignore: false,
    description:
      "Uygulamanın Docker konteyner imajını oluşturmak için gerekli montaj adımları.",
    group: "configuration file",
  },
  {
    expression: "docker-compose.yml",
    extension: false,
    ignore: false,
    description:
      "Çoklu konteyner içeren Docker uygulamalarının ağ ve hacim servis tanımlamaları.",
    group: "configuration file",
  },
  {
    expression: "package-lock.json",
    extension: false,
    ignore: false,
    description:
      "npm bağımlılık ağacının tam sürümlerini kilitleyen deterministik kilit dosyası.",
    group: "package_locks file",
  },
  {
    expression: "yarn.lock",
    extension: false,
    ignore: false,
    description:
      "Yarn paket yöneticisinin bağımlılık sürüm kararlılığını sağlayan kilit dosyası.",
    group: "package_locks file",
  },
  {
    expression: "pnpm-lock.yaml",
    extension: false,
    ignore: false,
    description:
      "pnpm paket yöneticisinin içerik adreslemeli depolama kilit dosyası.",
    group: "package_locks file",
  },

  {
    expression: "README.md",
    extension: false,
    ignore: false,
    description:
      "Projenin amacını, kurulum adımlarını ve kullanım talimatlarını içeren ana kılavuz.",
    group: "documentation file",
  },
  {
    expression: "CONTRIBUTING.md",
    extension: false,
    ignore: false,
    description:
      "Projeye katkıda bulunmak isteyen geliştiriciler için kod standartları ve kurallar kılavuzu.",
    group: "documentation file",
  },
  {
    expression: "LICENSE",
    extension: false,
    ignore: false,
    description:
      "Projenin telif hakkı, kullanım, dağıtım ve yasal izin sınırlarını belirten metin.",
    group: "documentation file",
  },
  {
    expression: ".js",
    extension: true,
    ignore: false,
    description: "Standart JavaScript kaynak kodu dosyası.",
    group: "source_code file",
  },
  {
    expression: ".ts",
    extension: true,
    ignore: false,
    description: "Tip güvenliği eklenmiş TypeScript kaynak kodu dosyası.",
    group: "source_code file",
  },
  {
    expression: ".jsx",
    extension: true,
    ignore: false,
    description:
      "React bileşenleri içeren, JavaScript içine gömülü XML/HTML dosyası.",
    group: "source_code file",
  },
  {
    expression: ".tsx",
    extension: true,
    ignore: false,
    description:
      "Tip güvenliği barındıran React (TypeScript JSX) bileşen dosyası.",
    group: "source_code file",
  },
  {
    expression: ".py",
    extension: true,
    ignore: false,
    description: "Python programlama dili kaynak kodu dosyası.",
    group: "source_code file",
  },

  {
    expression: ".css",
    extension: true,
    ignore: false,
    description:
      "Web sayfalarının stil tasarımlarını belirleyen Cascading Style Sheets dosyası.",
    group: "styles_and_markup file",
  },
  {
    expression: ".scss",
    extension: true,
    ignore: false,
    description:
      "Sass ön işlemcisi ile yazılan, değişken ve iç içe kurallar destekleyen gelişmiş stil dosyası.",
    group: "styles_and_markup file",
  },
  {
    expression: ".html",
    extension: true,
    ignore: false,
    description:
      "Web sayfalarının iskeletini ve içeriğini oluşturan standart işaretleme dosyası.",
    group: "styles_and_markup file",
  },

  {
    expression: ".json",
    extension: true,
    ignore: false,
    description:
      "Hafif, insan tarafından okunabilir, anahtar-değer çiftlerinden oluşan veri değişim formatı.",
    group: "data_and_serialization file",
  },
  {
    expression: ".yaml",
    extension: true,
    ignore: false,
    description:
      "Veri serileştirme ve yapılandırma dosyalarında (CI/CD, Docker) yaygın kullanılan okunabilir format.",
    group: "data_and_serialization file",
  },
  {
    expression: ".xml",
    extension: true,
    ignore: false,
    description:
      "Genişletilebilir işaretleme dili; yapılandırılmış veri aktarımı ve eski sistem entegrasyonları için kullanılır.",
    group: "data_and_serialization file",
  },
  {
    expression: ".csv",
    extension: true,
    ignore: false,
    description:
      "Veritabanı tabloları veya e-tablolar arasında veri aktarımı sağlayan, virgülle ayrılmış değerler dosyası.",
    group: "data_and_serialization file",
  },

  {
    expression: ".svg",
    extension: true,
    ignore: false,
    description:
      "Çözünürlükten bağımsız, XML tabanlı vektörel grafik ve ikon formatı.",
    group: "assets_and_media file",
  },
  {
    expression: ".png",
    extension: true,
    ignore: false,
    description:
      "Kayıpsız sıkıştırma ve şeffaflık (alpha channel) desteği sunan raster piksel grafik formatı.",
    group: "assets_and_media file",
  },
  {
    expression: ".webp",
    extension: true,
    ignore: false,
    description:
      "Web ortamı için optimize edilmiş, yüksek sıkıştırma oranlı modern görsel formatı.",
    group: "assets_and_media file",
  },
];
