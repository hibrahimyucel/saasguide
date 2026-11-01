export interface DescPattern {
  expr: string;
  ignore: boolean;
  desc: string;
  grp: string;

}

export type RegExpDescPattern = Omit<DescPattern, 'expr'> & { expr: RegExp };

export type editDescPattern = DescPattern & { isExt: boolean };



export interface FileInfoSchema {
  maxFileSizeMB: number;
  flagEmptyDirectories: boolean;
  customIgnoreList: DescPattern[];
  regExpIgnoreList: RegExpDescPattern[];
  extensionDescriptions: DescPattern[];
}

export interface FileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  isIgnored: boolean;
  size?: string;
  matchedRule?: string;
  children?: FileNode[];
}

// 1. Bu ifadenin regex gerektirip gerektirmediğini kontrol eder (İçinde * var mı?)
function isWildcardPattern(val: string): boolean {
  return val.includes('*');
}

// 2. Sadece dosya/klasör adları için Joker (*) karakterini Regex'e dönüştürür
function wildcardToRegex(wildcard: string): RegExp | null {
  const trimmed = wildcard.trim();
  if (!trimmed) return null;

  // Regex özel karakterlerini kaçır (\), ancak yıldız (*) karakterlerine dokunma
  let pattern = trimmed.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Sadece dosya/klasör adı olduğu için ** ve * aynı anlama gelir: "Herhangi bir karakter dizisi"
  // Büyük/küçük harf duyarsızlığı (case-insensitive) için regex'e 'i' bayrağı ekliyoruz
  pattern = pattern.replace(/\*/g, '.*');

  return new RegExp(`^${pattern}$`, 'i');
}

export const generateDescMap = (): FileInfoSchema => {

  let extensionDescriptions: DescPattern[] = initialSchema.extensionDescriptions;
  let customIgnoreList: DescPattern[] = [];
  let regExpIgnoreList: RegExpDescPattern[] = [];


  for (const item of Object.values(initialSchema.customIgnoreList)) {
    const { expr, ...rest } = item;
    if (isWildcardPattern(expr)) {
      const regex = wildcardToRegex(expr);
      if (regex) {
        regExpIgnoreList.push({
          expr: regex, ...rest
        });
      }

    } else {
      customIgnoreList.push(item);
    }
  }
  const a = { 'maxFileSizeMB': initialSchema.maxFileSizeMB, 'flagEmptyDirectories': initialSchema.flagEmptyDirectories, customIgnoreList, regExpIgnoreList, extensionDescriptions };

  console.log(a);
  return a;
};

export const initialSchema: FileInfoSchema = {
  maxFileSizeMB: 10,
  flagEmptyDirectories: true,
  'regExpIgnoreList': [],
  "customIgnoreList":
    [
      { "expr": ".DS_Store", "ignore": true, "desc": "macOS klasör özelleştirme ve dizin nitelikleri veri dosyası.", "grp": "system_and_os" },
      { "expr": "Thumbs.db", "ignore": true, "desc": "Windows Gezgini küçük resim önbellek dosyası.", "grp": "system_and_os" },
      { "expr": "desktop.ini", "ignore": true, "desc": "Windows klasör yapılandırma ve görünüm ayarları dosyası.", "grp": "system_and_os" }
      ,
      { "expr": ".git", "ignore": true, "desc": "git repository klasörü.", "grp": "system_and_os" },
      { "expr": "cache", "ignore": true, "desc": "geçici çalıştırma dosyaları", "grp": "system_and_os" },

      { "expr": "node_modules", "ignore": true, "desc": "Node.js/npm paket bağımlılıkları dizini.", "grp": "dependencies_and_packages" },
      { "expr": "bower_components", "ignore": true, "desc": "Bower web ön uç paket yöneticisi dizini.", "grp": "dependencies_and_packages" },
      { "expr": ".pnp.*", "ignore": true, "desc": "Yarn Plug'n'Play (PnP) bağımlılık eşleme ve kurulum dosyaları.", "grp": "dependencies_and_packages" },
      { "expr": "vendor", "ignore": true, "desc": "Composer (PHP) veya Go bağımlılık kaynak kodları dizini.", "grp": "dependencies_and_packages" }
      ,

      { "expr": "dist", "ignore": true, "desc": "Üretim ortamına hazır derlenmiş (distribution) çıktı dizini.", "grp": "build_and_outputs" },
      { "expr": "build", "ignore": true, "desc": "Uygulama derleme (build) süreçlerinde oluşturulan geçici/kalıcı çıktılar.", "grp": "build_and_outputs" },
      { "expr": "out", "ignore": true, "desc": "Derleyiciler veya Next.js gibi çerçevelerin statik çıktı dizini.", "grp": "build_and_outputs" },
      { "expr": ".next", "ignore": true, "desc": "Next.js çerçevesinin derleme ve canlı ortam önbellek dizini.", "grp": "build_and_outputs" },
      { "expr": ".nuxt", "ignore": true, "desc": "Nuxt.js çerçevesinin çalışma zamanı ve derleme dizini.", "grp": "build_and_outputs" }
      ,
      { "expr": ".env", "ignore": false, "desc": "Yerel ortam değişkenlerini ve gizli anahtarları içeren ana dosya (Asla commitlemeyin).", "grp": "environment_and_secrets" },
      { "expr": ".env.local", "ignore": false, "desc": "Yerel geliştirmeye özel, ortam değişkenleri ezme dosyası.", "grp": "environment_and_secrets" },
      { "expr": "*.local", "ignore": false, "desc": "Geliştiricinin yerel makinesine özel tüm yerel yapılandırma varyasyonları.", "grp": "environment_and_secrets" },
      { "expr": ".env.production.local", "ignore": false, "desc": "Canlı ortam yerel gizli değişkenleri.", "grp": "environment_and_secrets" }
      ,
      { "expr": "*.log", "ignore": false, "desc": "Uygulama, sunucu veya derleme süreçlerine ait log (günlük) kayıtları.", "grp": "logs_and_diagnostics" },
      { "expr": "npm-debug.log*", "ignore": false, "desc": "npm komutları hata verdiğinde oluşan detaylı hata ayıklama günlüğü.", "grp": "logs_and_diagnostics" },
      { "expr": "yarn-debug.log*", "ignore": false, "desc": "Yarn paket yöneticisi hata ayıklama günlüğü.", "grp": "logs_and_diagnostics" },
      { "expr": ".eslintcache", "ignore": false, "desc": "ESLint kod analiz aracının hızlandırma amaçlı önbellek dosyası.", "grp": "logs_and_diagnostics" }
      ,

      { "expr": ".vscode", "ignore": true, "desc": "Visual Studio Code editörüne özel yerel çalışma alanı ayarları.", "grp": "ides_and_tools" },
      { "expr": ".idea", "ignore": true, "desc": "JetBrains (WebStorm, IntelliJ) IDE'lerine ait proje konfigürasyon dizini.", "grp": "ides_and_tools" },
      { "expr": "*.suo", "ignore": true, "desc": "Visual Studio kullanıcı seçenekleri ve yerel editör durum dosyası.", "grp": "ides_and_tools" },
      { "expr": "*.ntvs*", "ignore": true, "desc": "Node.js Tools for Visual Studio proje ayarları.", "grp": "ides_and_tools" }
      ,
      { "expr": "package.json", "ignore": false, "desc": "Node.js proje manifestosu; bağımlılıkları, betikleri ve meta verileri tanımlar.", "grp": "configuration file" },
      { "expr": "turbo.json", "ignore": false, "desc": "Turborepo monorepo görev yönetim, önbellekleme ve pipeline yapılandırma dosyası.", "grp": "configuration file" },
      { "expr": "tsconfig.json", "ignore": false, "desc": "TypeScript derleyici seçenekleri, yol eşlemeleri (path aliases) ve kapsam ayarları.", "grp": "configuration file" },
      { "expr": "next.config.js", "ignore": false, "desc": "Next.js çerçevesine ait yönlendirme, webpack ve derleme optimizasyonu ayarları.", "grp": "configuration file" },
      { "expr": "dockerfile", "ignore": false, "desc": "Uygulamanın Docker konteyner imajını oluşturmak için gerekli montaj adımları.", "grp": "configuration file" },
      { "expr": "docker-compose.yml", "ignore": false, "desc": "Çoklu konteyner içeren Docker uygulamalarının ağ ve hacim servis tanımlamaları.", "grp": "configuration file" }
      ,
      { "expr": "package-lock.json", "ignore": false, "desc": "npm bağımlılık ağacının tam sürümlerini kilitleyen deterministik kilit dosyası.", "grp": "package_locks file" },
      { "expr": "yarn.lock", "ignore": false, "desc": "Yarn paket yöneticisinin bağımlılık sürüm kararlılığını sağlayan kilit dosyası.", "grp": "package_locks file" },
      { "expr": "pnpm-lock.yaml", "ignore": false, "desc": "pnpm paket yöneticisinin içerik adreslemeli depolama kilit dosyası.", "grp": "package_locks file" }
      ,

      { "expr": "README.md", "ignore": false, "desc": "Projenin amacını, kurulum adımlarını ve kullanım talimatlarını içeren ana kılavuz.", "grp": "documentation file" },
      { "expr": "CONTRIBUTING.md", "ignore": false, "desc": "Projeye katkıda bulunmak isteyen geliştiriciler için kod standartları ve kurallar kılavuzu.", "grp": "documentation file" },
      { "expr": "LICENSE", "ignore": false, "desc": "Projenin telif hakkı, kullanım, dağıtım ve yasal izin sınırlarını belirten metin.", "grp": "documentation file" }
    ],
  "extensionDescriptions": [
    { "expr": ".js", "ignore": false, "desc": "Standart JavaScript kaynak kodu dosyası.", "grp": "source_code file" },
    { "expr": ".ts", "ignore": false, "desc": "Tip güvenliği eklenmiş TypeScript kaynak kodu dosyası.", "grp": "source_code file" },
    { "expr": ".jsx", "ignore": false, "desc": "React bileşenleri içeren, JavaScript içine gömülü XML/HTML dosyası.", "grp": "source_code file" },
    { "expr": ".tsx", "ignore": false, "desc": "Tip güvenliği barındıran React (TypeScript JSX) bileşen dosyası.", "grp": "source_code file" },
    { "expr": ".py", "ignore": false, "desc": "Python programlama dili kaynak kodu dosyası.", "grp": "source_code file" }
    ,

    { "expr": ".css", "ignore": false, "desc": "Web sayfalarının stil tasarımlarını belirleyen Cascading Style Sheets dosyası.", "grp": "styles_and_markup file" },
    { "expr": ".scss", "ignore": false, "desc": "Sass ön işlemcisi ile yazılan, değişken ve iç içe kurallar destekleyen gelişmiş stil dosyası.", "grp": "styles_and_markup file" },
    { "expr": ".html", "ignore": false, "desc": "Web sayfalarının iskeletini ve içeriğini oluşturan standart işaretleme dosyası.", "grp": "styles_and_markup file" }
    ,

    { "expr": ".json", "ignore": false, "desc": "Hafif, insan tarafından okunabilir, anahtar-değer çiftlerinden oluşan veri değişim formatı.", "grp": "data_and_serialization file" },
    { "expr": ".yaml", "ignore": false, "desc": "Veri serileştirme ve yapılandırma dosyalarında (CI/CD, Docker) yaygın kullanılan okunabilir format.", "grp": "data_and_serialization file" },
    { "expr": ".xml", "ignore": false, "desc": "Genişletilebilir işaretleme dili; yapılandırılmış veri aktarımı ve eski sistem entegrasyonları için kullanılır.", "grp": "data_and_serialization file" },
    { "expr": ".csv", "ignore": false, "desc": "Veritabanı tabloları veya e-tablolar arasında veri aktarımı sağlayan, virgülle ayrılmış değerler dosyası.", "grp": "data_and_serialization file" }
    ,

    { "expr": ".svg", "ignore": false, "desc": "Çözünürlükten bağımsız, XML tabanlı vektörel grafik ve ikon formatı.", "grp": "assets_and_media file" },
    { "expr": ".png", "ignore": false, "desc": "Kayıpsız sıkıştırma ve şeffaflık (alpha channel) desteği sunan raster piksel grafik formatı.", "grp": "assets_and_media file" },
    { "expr": ".webp", "ignore": false, "desc": "Web ortamı için optimize edilmiş, yüksek sıkıştırma oranlı modern görsel formatı.", "grp": "assets_and_media file" }
  ]
};

