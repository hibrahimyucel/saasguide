# Node.js Monorepo Proje Yapısı ve Dosya Açıklamaları

Node.js Monorepo mimarisinde yer alan örnek klasör yapısı, kritik konfigürasyon dosyaları, Docker entegrasyonu ve Nginx ters proxy (reverse proxy) yapılandırması.

## 📂 Genel Klasör Yapısı

```text
├── 📁 .github/                  # CI/CD (GitHub Actions) iş akışları
├── 📁 apps/                     # Dağıtılabilir / çalıştırılabilir ana uygulamalar
│   ├── 📁 admin-dashboard/      # Yönetim paneli (React/Next.js)
│   └── 📁 api-server/           # Backend servisi (NestJS/Express)
├── 📁 packages/                 # Ortak kullanılan paylaşılan kütüphaneler
│   ├── 📁 database/             # Prisma/Mongoose şemaları ve DB bağlantısı
│   ├── 📁 ui-components/        # Ortak UI bileşenleri (Design System)
│   └── 📁 utils/                # Ortak yardımcı fonksiyonlar
├── 📁 docker/                   # Docker operasyonel dosyaları ve orkestrasyon
│   ├── 📁 nginx/                # Nginx konfigürasyon klasörü
│   │   └── 📄 nginx.conf        # Nginx ana veya reverse proxy ayarları
│   ├── 📄 Dockerfile.api        # API servisi için Docker imaj talimatları
│   ├── 📄 Dockerfile.web        # Frontend servisi için Docker imaj talimatları
│   └── 📄 docker-compose.yml    # Çoklu konteyner orkestrasyon dosyası
├── 📄 .gitignore                # Git tarafından takip edilmeyecek dosyalar
├── 📄 .prettierrc               # Kod biçimlendirme kuralları
├── 📄 eslint.config.js          # Kod kalitesi ve stil denetimi kuralları
├── 📄 package.json              # Monorepo kök bağımlılıkları ve scriptleri
├── 📄 pnpm-workspace.yaml       # Çalışma alanlarını (workspaces) tanımlayan dosya
├── 📄 turbo.json                # Turborepo yapılandırma dosyası (kullanılıyorsa)
└── 📄 tsconfig.json             # Ortak TypeScript ana yapılandırması
```

---

## 📁 Klasör Grupları

### 📂 `apps/` (Uygulamalar)
Son kullanıcının doğrudan eriştiği veya sunucuda sürekli çalışan **ana projeler** buradadır. Her birinin kendi `package.json` dosyası bulunur. Projeler, `packages/` altındaki ortak modülleri yerel bir kütüphane gibi içe aktarır.

### 📂 `packages/` (Paylaşılan Modüller)
Uygulamaların ortaklaşa kullandığı ancak tek başına çalıştırılmayan kod havuzudur. İş mantığı, veritabanı modelleri (ORM şemaları) veya UI bileşenleri burada tek sefer yazılır, tüm uygulamalarda güncel olarak kullanılır.
## 📄 Temel Monorepo Dosyaları

### 1. `package.json` (Kök Dizin)
Monoreponun yönetim merkezidir. Tüm alt projeleri (workspaces) ilgilendiren ortak bağımlılıkları (TypeScript, ESLint, Prettier, Husky vb.) ve tüm projeleri tek seferde derleyen/çalıştıran komutları barındırır.
* **Kritik Ayar:** İçerisinde `"private": true` yer alır. Bu, kök klasörün yanlışlıkla npm dünyasında yayınlanmasını (publish) engeller.

### 2. `pnpm-workspace.yaml` (veya `package.json -> workspaces`)
Monorepo yönetim aracına, hangi klasörlerin alt projeler (workspace) olarak kabul edileceğini söyler.
* **Örnek İçerik:**
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```

### 3. `turbo.json` / `nx.json`
Monorepo süreçlerini (build, test, lint) optimize eden araçların ayar dosyasıdır. Projeler arasındaki bağımlılık ağacını (dependency graph) çözer ve kodu değişmeyen projeleri **önbellekten (cache)** çağırarak build sürelerini kısaltır.

### 4. `tsconfig.json` (Kök Dizin)
Tüm alt projelerin miras alacağı temel TypeScript kurallarını içerir. Alt projeler bu dosyayı `extends: "../../tsconfig.json"` şeklinde genişleterek ortak kuralları korur.

---

## 🐳 Docker Dosyaları ve Yapılandırması

Monorepo mimarilerinde Docker kullanımı, projelerin birbirine olan yerel bağımlılıkları (`packages/` altındakiler) nedeniyle dikkat gerektirir.

### 1. `Dockerfile.api` / `Dockerfile.web`
Her bir uygulamanın bağımsız imajını oluşturmak için kullanılan talimat listesidir. Monorepoda Dockerfile genellikle **kök dizin bağlamında (build context)** çalıştırılır çünkü `apps/api-server` gibi bir proje, `packages/utils` klasörüne ihtiyaç duyar.
* **Çok Aşamalı Derleme (Multi-stage Build):** İmaj boyutunu minimumda tutmak için önce bağımlılıklar yüklenir ve derlenir (build stage), ardından sadece çalışma zamanı (runtime) dosyaları production imajına kopyalanır.

### 2. `docker-compose.yml`
Yerel geliştirme ortamında veya tek bir sunucuda tüm monorepo ekosistemini (API, Frontend, Nginx, Veritabanı vb.) tek bir komutla (`docker compose up`) ayağa kaldırmayı sağlayan orkestrasyon dosyasıdır.
* Konteynerlerin birbirleriyle hangi portlar üzerinden konuşacağını ve hangi ortam değişkenlerini (environment variables) alacağını tanımlar.

---

## 🌐 Nginx Dosyaları ve Yapılandırması

Nginx, monorepo mimarilerinde genellikle **Ters Proxy (Reverse Proxy)** veya frontend uygulamalarını statik olarak sunan bir **Web Sunucusu** olarak konumlandırılır.

### 1. `nginx.conf`
Nginx sunucusunun tüm çalışma kurallarını belirleyen ana yapılandırma dosyasıdır. Monorepo için genellikle şu görevleri üstlenir:
* **Gelen İstekleri Yönlendirme (Routing):** `example.com/api` isteğini Docker ağındaki `api-server` konteynerine, `example.com/` isteğini ise `admin-dashboard` konteynerine yönlendirir.
* **Yük Dengeleme (Load Balancing):** API servisinin birden fazla replikası varsa gelen istekleri aralarında dağıtır.
* **Güvenlik ve Performans:** SSL/TLS sertifikalarının yönetimi, CORS ayarları ve statik dosyaların (Gzip ile) sıkıştırılarak hızlıca sunulmasını sağlar.

---

