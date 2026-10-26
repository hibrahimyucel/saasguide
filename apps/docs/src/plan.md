# 🚀 Proje Canlıya Alım & Sistem Hazırlık Planı

::: tip AI
Bu döküman tamamen gemini ai tarafından oluşturulmuştur. 
:::

Bu liste; VitePress, Vite-React, NestJS API (Client & Telemetry), Auth Mikroservisi, Knex/MariaDB, Redis, Mailcow, Gitea ve Nginx mimarisinin kurulumundan yayına kadar olan tüm süreçleri kapsar.

---

## 🛠️ 1. Aşama: Sunucu ve Temel Altyapı Hazırlığı
- [ ] **Domain ve DNS Yapılandırması:** Domain satın alınması ve Cloudflare/DNS panelinde alt alan adlarının (A kayıtları) tanımlanması:
  - `://domain.com` (Git sunucusu)
  - `://domain.com` (Mailcow)
  - `://domain.com` (NestJS Gateway/API)
  - `://domain.com` (Auth Mikroservisi)
  - `://domain.com` (VitePress)
  - `://domain.com` (Vite-React Uygulaması)
- [ ] **Sunucu Temini ve Güvenliği:** Ubuntu Server kurulumu, SSH anahtarlarının yapılandırılması ve `UFW` (Firewall) ile 80, 443, 22 haricindeki portların dış dünyaya kapatılması.
- [ ] **Docker Ortamı:** Sunucuya güncel **Docker** ve **Docker Compose v2** kurulumlarının yapılması.
- [ ] **SSL/HTTPS Altyapısı:** `Certbot` ve Let's Encrypt kullanılarak tüm subdomain'ler için SSL sertifikalarının üretilmesi ve otomatik yenileme (cron job) mekanizmasının kurulması.

## 📦 2. Aşama: Bağımsız Servislerin Kurulumu (Self-Hosted)
- [ ] **Mailcow (E-Posta) Kurulumu:** 
  - Mailcow Dockerized reposunun sunucuya çekilmesi, `mailcow.conf` ayarlarının yapılması.
  - DNS üzerinde `MX`, `SPF`, `DKIM` ve `DMARC` kayıtlarının eksiksiz tanımlanarak mail sunucusunun ayağa kaldırılması.
- [ ] **Gitea (Git) Kurulumu:** 
  - Gitea için Docker Compose servisi ve izole bir MariaDB/PostgreSQL container'ının bağlanması.
  - İlk kurulum sihirbazının tamamlanması, yönetici hesabının oluşturulması ve SSH port ayarlarının yapılması.

## 💻 3. Aşama: Monorepo Kod Yapısı ve Geliştirme (Local)
- [ ] **Monorepo İskeleti:** `pnpm workspaces` veya `npm workspaces` ile kök dizinin ve klasör yapısının oluşturulması.
- [ ] **Dokümantasyon (VitePress):** `apps/docs` altında VitePress projesinin başlatılması, temel proje döküman şablonlarının hazırlanması.
- [ ] **Ön Yüz (Vite + React):** `apps/frontend` altında Vite-React projesinin kurulması, state management ve router yapısının kurulması.
- [ ] **Veri Tabanı & Cache Katmanı:** Kök dizindeki docker-compose mimarisine local geliştirme için `MariaDB` ve `Redis` servislerinin eklenmesi.
- [ ] **Backend API (NestJS):** `apps/backend-api` oluşturulması:
  - `Knex.js` entegrasyonunun yapılması, MariaDB bağlantı ayarları.
  - İlk migration (Client & Telemetry tabloları) ve seed dosyalarının yazılması.
  - `Client Information` endpoint'lerinin yazılması.
  - `Telemetry Stream` için WebSockets (Socket.io) veya Server-Sent Events (SSE) mimarisinin NestJS üzerinde kurulması.
  - Hızlı veri okuma/yazma ve rate-limiting için `Redis` entegrasyonu.
- [ ] **Auth Mikroservisi (NestJS):** `apps/auth-service` oluşturulması:
  - JWT (JSON Web Token) tabanlı kimlik doğrulama mekanizması.
  - Ana API ile Auth mikroservisi arasında haberleşme (gRPC, Redis Pub/Sub veya HTTP/TCP Rest) altyapısı.
  - Kullanıcı kayıt, giriş ve token yenileme (refresh token) mantığı.

## 🐳 4. Aşama: Containerization (Docker & Nginx)
- [ ] **Dockerfile Hazırlıkları:** `docs`, `frontend`, `backend-api` ve `auth-service` için Multi-stage (Çok aşamalı) prodüksiyon Dockerfile dosyalarının yazılması.
- [ ] **Merkezi Nginx Konfigürasyonu:**
  - `nginx.conf` veya `default.conf` dosyasının yazılması.
  - Gelen HTTPS isteklerinin subdomain bazlı olarak ilgili Docker container'larına (`frontend`, `docs`, `api`, `auth`) yönlendirilmesi (Reverse Proxy).
  - WebSockets/Stream trafiği için `proxy_set_header Upgrade $http_upgrade;` ayarlarının Nginx'e eklenmesi.
- [ ] **Üretim (Production) Docker Compose:** Tüm uygulamaları (`api`, `auth`, `frontend`, `docs`, `mariadb`, `redis`, `nginx`) tek ağda (network) toplayan `docker-compose.prod.yml` dosyasının hazırlanması.

## 🚀 5. Aşama: Yayına Alım (Deployment) ve Canlı Testler
- [ ] **Kodun Sunucuya Taşınması:** Gitea üzerinde organizasyon/repo oluşturulması, local kodun pushlanması ve sunucuya `git clone` ile çekilmesi.
- [ ] **Ortam Değişkenleri (.env):** Sunucuda canlı ortam şifreleri, JWT secret key'leri, DB ve Redis bağlantı adreslerini içeren production `.env` dosyalarının güvenli şekilde oluşturulması.
- [ ] **Sistemin Başlatılması:** Sunucuda `docker compose -f docker-compose.prod.yml up --build -d` komutu ile tüm ekosistemin ayağa kaldırılması.
- [ ] **Veri Tabanı Canlı Göçü:** Canlı sunucuda Knex migration'larının çalıştırılarak MariaDB tablolarının otomatik oluşturulması (`knex migrate:latest`).
- [ ] **E2E ve Entegrasyon Testleri:**
  - HTTPS sertifikalarının doğruluğu kontrolü.
  - Auth mikroservisinden token alıp API'a istek atma testi.
  - Client telemetry datasının WebSocket/SSE üzerinden Nginx'i geçerek UI'a akıp akmadığının (Stream) doğrulanması.
  - Mailcow üzerinden sistem e-postalarının (örneğin şifre sıfırlama) sorunsuz iletilmesi testi.

## 🛡️ 6. Aşama: İzleme ve Sürdürülebilirlik (Post-Deployment)
- [ ] **Log Yönetimi:** Docker loglarının takibi veya temel bir log rotasyon (logrotate) mekanizması.
- [ ] **Yedekleme Stratejisi (Backup):** MariaDB veritabanı verilerinin ve Mailcow hacimlerinin (volumes) günlük olarak sunucu dışına (S3, başka bir sunucu vb.) yedeklenmesi için cron job yazılması.



## 🐧 AlmaLinux Sunucu Hazırlığı & Detaylı Geliştirme Planı

Bu liste; AlmaLinux 9 üzerinde kurumsal standartlarda sunucu güvenliği ve Docker ortamının kurulması ile monorepo içerisindeki Knex, MariaDB, Redis ve Telemetry Stream (WebSocket) mimarilerinin geliştirilme adımlarını kapsar.

---

## 🛠️ 1. Aşama: AlmaLinux Sunucu Hazırlığı

AlmaLinux 9 (RHEL Tabanlı) üzerinde kararlı, güvenli ve konteyner mimarisine hazır bir OS katmanı yapılandırması.

- [ ] **1.1. Güncellemeler ve Temel Araçlar:** 
  - [ ] Sistem paket depolarını güncelleyin ve en son güvenlik yamalarını uygulayın: `sudo dnf update -y`
  - [ ] Sistem yönetimi ve sorun giderme için temel araçları (`curl`, `wget`, `git`, `tar`, `nano`) yükleyin: `sudo dnf install -y curl wget git json-c tar nano`
- [ ] **1.2. Güvenlik ve Güvenlik Duvarı (Firewalld):**
  - [ ] `firewalld` servisini aktif edin ve başlatın: `sudo systemctl enable --now firewalld`
  - [ ] Standart dış servis portlarını (HTTP, HTTPS, SSH) kalıcı olarak açın: `sudo firewall-cmd --permanent --add-service={http,https,ssh}`
  - [ ] Mailcow (SMTP, IMAP vb.) ve Gitea SSH erişimi için gereken ek kurumsal servis portlarını tanımlayın.
  - [ ] Değişiklikleri uygulayarak güvenlik duvarını yeniden yükleyin: `sudo firewall-cmd --reload`
- [ ] **1.3. SELinux Optimizasyonu:**
  - [ ] Docker container'larının kalıcı veri alanlarına (volumes) erişirken izin hatası (Permission Denied) almaması için SELinux politikalarını yapılandırın veya test ortamı için `/etc/selinux/config` dosyasından `permissive` moduna alın.
- [ ] **1.4. Docker ve Docker Compose v2 Kurulumu:**
  - [ ] Çakışma yaratabilecek eski podman veya docker paketlerini temizleyin: `sudo dnf remove docker docker-client...`
  - [ ] Resmi Docker CE kurumsal paket reposunu AlmaLinux sistemine ekleyin: `sudo dnf config-manager --add-repo https://docker.com`
  - [ ] Docker Engine ve Docker Compose eklentisini yükleyin: `sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`
  - [ ] Docker servisini sistem açılışına (boot) ekleyin ve çalıştırın: `sudo systemctl enable --now docker`

---

## 💻 3. Aşama: Uygulama Geliştirme Adımları (Local & Mimari)

Monorepo çatısı altında uygulamaların modüler olarak birbirine bağlanması, veritabanı şemalarının kodlanması ve anlık telemetri akış altyapısının kurulması.

- [ ] **3.1. Monorepo Workspaces Altyapısı:**
  - [ ] Proje kök dizininde `package.json` (veya `pnpm-workspace.yaml`) üzerinde `apps/*` ve `packages/*` çalışma alanlarını (workspaces) tanımlayın.
  - [ ] `apps/frontend` (Vite-React), `apps/docs` (VitePress), `apps/backend-api` (NestJS) ve `apps/auth-service` (NestJS) projelerini ilgili dizinlerde temiz bir şekilde ilklendirin (initialize).
- [ ] **3.2. Knex.js ve MariaDB Şema Yapılandırması (backend-api):**
  - [ ] NestJS API projesine `knex` ve `mysql2` sürücü bağımlılıklarını yükleyin.
  - [ ] `knexfile.js` dosyasını oluşturarak local (development) ve canlı (production) MariaDB bağlantı havuzu (connection pool) ayarlarını yapın.
  - [ ] İlk veritabanı göç (migration) dosyasını oluşturun: `npx knex migrate:make create_client_and_telemetry_tables`
  - [ ] Migration dosyası içerisine `clients` (cihaz bilgileri, ip, user-agent) ve `telemetry_logs` (anlık cpu, memory, network metrikleri) tablolarının şemalarını ve yabancı anahtar (foreign key) ilişkilerini yazın.
- [ ] **3.3. Redis Caching ve Hız Limitleri (Rate Limiting):**
  - [ ] Hızlı veri okuma/yazma süreçleri için `ioredis` veya `@nestjs/cache-manager` entegrasyonunu tamamlayın.
  - [ ] Auth servisinden dönen doğrulanmış token oturumlarını ve sık sorgulanan statik istemci bilgilerini Redis hafızasında TTL (Time-To-Live) ile önbelleğe alın.
- [ ] **3.4. Telemetry Stream & WebSocket Mimari Tasarımı:**
  - [ ] İstemcilerden anlık veri toplamak ve ön yüze veri akışı sağlamak için `@nestjs/websockets` ve `@nestjs/platform-socket.io` paketlerini kurun.
  - [ ] **Performans Optimizasyonu:** Anlık gelen yoğun telemetri verilerini doğrudan MariaDB'ye yazıp disk I/O limitlerini zorlamak yerine, verileri önce Redis List (Queue) üzerinde biriktirin. Belirli periyotlarla (örneğin her 5 saniyede bir) MariaDB'ye toplu yazma (Bulk Insert) yapacak bir scheduler/cron mekanizması kurun.
  - [ ] Vite-React ön yüzünün anlık grafiklerini beslemek için WebSocket odaları (rooms) üzerinden stream yayın kanalını aktifleştirin.
- [ ] **3.5. Merkezi Kimlik Doğrulama (Auth Mikroservisi):**
  - [ ] `apps/auth-service` üzerinde JWT tabanlı kimlik doğrulama mimarisini (`passport-jwt`) kurun.
  - [ ] Ana API (`backend-api`) ile Auth mikroservisinin performansı için HTTP yerine **Redis Pub/Sub** veya **NestJS TCP Microservice Transport** kullanarak mikroservisler arası hızlı token doğrulama köprüsünü inşa edin.

## 🐳 4. Aşama: Containerization (Docker & Nginx - Taşınabilir Altyapı)

Tüm bağımlılıkları sunucu (Host OS) işletim sisteminden izole ederek, kaynak yönetimini ve tam taşınabilirliği (stateless sunucu) sağlamak amacıyla Docker mimarisinin kurulması.

- [ ] **4.1. Çok Aşamalı (Multi-Stage) Üretim Dockerfile Dosyaları:**
  - [ ] **Ön Yüz ve Dokümantasyon (`apps/frontend`, `apps/docs`):** Bağımlılıkların derlenip (`npm run build`) ardından sadece statik dosyaların minimal bir `nginx:alpine` imajına kopyalanarak sunulacağı aşamalı Dockerfile dosyalarını hazırlayın.
  - [ ] **Backend Servisleri (`apps/backend-api`, `apps/auth-service`):** NestJS projeleri için kaynak kodun önce `node:20-alpine` üzerinde derlenmesi, ardından sadece runtime (üretim) bağımlılıklarının (`npm ci --omit=dev`) ve `dist` klasörünün hafif bir Node imajına aktarılacağı üretim Dockerfile şablonlarını yazın.
- [ ] **4.2. Merkezi Nginx Yönlendirme ve WebSocket Konfigürasyonu:**
  - [ ] **Küresel Yönlendirme (HTTP to HTTPS):** Dışarıdan 80 portuna gelen ham HTTP isteklerini yakalayıp otomatik olarak 443 HTTPS protokolüne yönlendirecek Nginx bloklarını kurgulayın.
  - [ ] **Subdomain Proxy Blokları:** `://domain.com`, `://domain.com`, `://domain.com` ve `://domain.com` isteklerini dinleyerek, ilgili trafiği sunucu dışına port açmadan dahili Docker ağındaki konteyner isimlerine (`frontend_service`, `backend_api_service` vb.) paslayın.
  - [ ] **WebSocket Stream Desteği:** `://domain.com/socket.io/` konumuna gelecek anlık telemetri akışları için Nginx protokol yükseltme (`Upgrade $http_upgrade`, `Connection "Upgrade"`) başlık ayarlarını ekleyin.
- [ ] **4.3. Üretim Odaklı Orkestrasyon (`docker-compose.prod.yml`):**
  - [ ] **İzole Dahili Ağ (Bridge Network):** Veritabanı ve mikroservis portlarının dış dünyaya tamamen kapatılması, sadece `nginx_proxy` servisinin 80 ve 443 portlarının dışarıya açılması için dahili sanal ağ yapısını kurun.
  - [ ] **Kalıcı Veri Alanları (Volumes):** MariaDB (`mariadb_data`) ve Redis (`redis_data`) verilerinin konteyner silinse dahi kaybolmaması için kalıcı birim haritalamalarını gerçekleştirin.
  - [ ] **Sunucu Kaynak Yönetimi (`deploy.resources.limits`):** 
    - [ ] MariaDB için RAM (örn: 2G) ve CPU (örn: 1.5) üst sınır limitlerini tanımlayın.
    - [ ] Redis için RAM (örn: 512M) ve CPU (örn: 0.5) limitlerini sabitleyerek telemetri yükü altında sunucunun kilitlenmesini önleyin.
    - [ ] NestJS servisleri için işlemci ve bellek sınırlarını atayarak stabilizasyonu sağlayın.
  - [ ] **Çevre Değişkenleri ve Güvenlik:** Hassas veritabanı şifreleri (`MYSQL_ROOT_PASSWORD`) ve gizli anahtarlar için kök dizindeki `.env` dosyasını `docker-compose.prod.yml` içerisine enjekte edin.


## 🔒 1.5. Yerel (Local) ve Canlı (Domain) HTTPS / SSL Yapılandırma Adımları

Hem yerel makinedeki geliştirme süreçlerinde tarayıcı / WebSocket engellerine takılmamak hem de canlı ortamda kurumsal düzeyde güvenlik sağlamak için SSL sertifikalarının hazırlanması.

### [ ] A. Yerel Geliştirme Ortamı İçin HTTPS (Local SSL - mkcert)
- [ ] **mkcert Aracının Yüklenmesi:** Yerel bilgisayarınıza kendi yerel sertifika otoritenizi (CA) oluşturmanızı sağlayan `mkcert` aracını kurun:
  - macOS: `brew install mkcert nss`
  - Linux (AlmaLinux/Ubuntu): `sudo dnf install mkcert` veya GitHub üzerinden binary indirme.
  - Windows: `choco install mkcert`
- [ ] **Yerel Otoritenin Sisteme Tanıtılması:** Tarayıcıların ve işletim sisteminin oluşturacağınız sertifikalara güvenmesi için kök sertifikayı yükleyin: `mkcert -install`
- [ ] **Local Subdomain Sertifikalarının Üretilmesi:** Monorepo kök dizininde `certs/` klasörü oluşturarak yerel projeleriniz için SSL sertifikalarını generate edin:
  ```bash
  mkdir certs && cd certs
  mkcert app.local docs.local api.local auth.local localhost 127.0.0.1
  ```
  *(Bu komut `certs/` altında `app.local+5.pem` ve `app.local+5-key.pem` dosyalarını üretecektir).*
- [ ] **Hosts Dosyasının Düzenlenmesi:** Yerel işletim sisteminizdeki `hosts` dosyasına (`/etc/hosts` veya `C:\Windows\System32\drivers\etc\hosts`) yerel subdomain tanımlamalarını ekleyin:
  ```text
  127.0.0.1 app.local docs.local api.local auth.local
  ```
- [ ] **Local Nginx Entegrasyonu:** Geliştirme esnasında ayağa kalkan Nginx konteynerine bu `certs/` klasörünü volume olarak bağlayın ve `ssl_certificate` yollarını bu yerel sertifikalara yönlendirin.

### [ ] B. Canlı Ortam İçin HTTPS (Production Domain - Let's Encrypt & Certbot)
- [ ] **Certbot Kurulumu (AlmaLinux Host OS):** Sunucu üzerinde SSL sertifikalarını otomatik yönetecek `certbot` aracını kurun:
  ```bash
  sudo dnf install -y epel-release
  sudo dnf install -y certbot
  ```
- [ ] **Geçici HTTP Doğrulaması İzni:** Let's Encrypt'in domain sahipliğinizi doğrulaması için sunucuda 80 portunun açık olduğundan emin olun (`sudo firewall-cmd --reload`). *Not: Eğer Nginx çalışıyorsa doğrulamadan önce geçici olarak durdurulmalıdır.*
- [ ] **Wildcard veya Çoklu Subdomain Sertifikası Üretimi:** Tüm subdomain'leri kapsayacak şekilde tek bir sertifika kümesi oluşturun:
  ```bash
  sudo certbot certonly --standalone -d domain.com -d ://domain.com -d ://domain.com -d ://domain.com -d ://domain.com --agree-tos --email admin@domain.com
  ```
- [ ] **Sertifika Erişim İzinleri:** Üretilen `/etc/letsencrypt/live/://domain.com` altındaki sertifika dosyalarının Docker konteynerleri (Nginx) tarafından okunabilmesi için sunucuda gerekli klasör izinlerini (okuma yetkisi) düzenleyin.
- [ ] **Otomatik Yenileme (Auto-Renew) Mekanizması:** Let's Encrypt sertifikaları 90 gün geçerlidir. Sunucuya bir cron job veya systemd timer ekleyerek otomatik yenilemeyi test edin:
  ```bash
  sudo certbot renew --dry-run
  ```
- [ ] **Nginx Production Entegrasyonu:** 4.2 adımındaki `production.conf` dosyasında SSL sertifika yollarını canlı `/etc/letsencrypt/live/...` dizinlerine eşitleyin ve `docker-compose.prod.yml` içinde bu dizini Nginx'e `:ro` (Read-Only) olarak mount edin.

## 3.4. NestJS Telemetry API & Hızlı Veri Akış Çekirdeği
- [ ] **3.4. NestJS Telemetry API & Hızlı Veri Akış Çekirdeği:**
  - [ ] **Knex & MariaDB Veri Şeması:** İlişkisel veri modeli için `clients` ve zaman serisi optimizasyonlu `telemetry_logs` tablolarının migration dosyalarını oluşturun ve indeks tanımlamalarını yapın.
  - [ ] **WebSocket Gateway (`Socket.io`):** İstemcilerden gelecek yüksek frekanslı metrik paketlerini karşılayan `stream_metrics` event mimarisini inşa edin.
  - [ ] **Redis Buffer & Caching Katmanı:** Gelen verileri diski yormamak adına `rpush` komutu ile hızlıca `telemetry:queue` listesine aktarın ve istemci meta verilerini Redis Hash üzerinde TTL ile önbelleğe alın.
  - [ ] **Batch Processor (Toplu Yazıcı Scheduler):** Her 5 saniyede bir tetiklenen `@Cron` servisi yazarak, Redis kuyruğundaki verileri atomik olarak çekip Knex `batchInsert` ve `onConflict().merge()` yetenekleriyle MariaDB'ye topluca (Bulk) yazılmasını sağlayın.
  
  ## 3.6. Vite-React Ön Yüz & Canlı Metrik Grafik Katmanı
  
  - [ ] **3.6. Vite-React Ön Yüz & Canlı Metrik Grafik Katmanı:**
  - [ ] **Bağımlılık Yönetimi:** Ön yüz projesine anlık veri akışı iletişimi ve görselleştirme için `socket.io-client` ve `recharts` kütüphanelerini entegre edin.
  - [ ] **WSS Singleton İstemcisi:** `https://api.local` ters yönlü proxy adresiyle performanslı ve güvenli el sıkışma yapacak `transports: ['websocket']` konfigürasyonuna sahip socket servisini hazırlayın.
  - [ ] **Dinamik Grafik Odası Entegrasyonu:** Bileşen yüklendiğinde `join_monitor` event'i ile istemciye özel odaya abone olan ve unmount anında kanalları temizleyen React kancalarını (`useEffect`) kurun.
  - [ ] **Arayüz Performans Optimizasyonu (Anti-Lag):** Sürekli güncellenen verilerde tarayıcıyı yormamak için grafik animasyonlarını devredışı bırakın (`isAnimationActive: false`) ve state üzerinde en fazla 20 geçmiş veri noktası tutulmasını sağlayın.


