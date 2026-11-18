---
tarih: 2026-11-17
saat: 23:50
konu: "AI System Reference: SaaS Rehberi Uçtan Uca Özel Bulut ve Monorepo Mimarisi"
baglam: "AI Workspace / Single Source of Truth (System Prompt & Context Reference)"
durum: "Aktif Referans"
etiketler: [ai-reference, architecture, monorepo, self-hosted-paas, security, sso, devops]
---

# AI System Reference 

### SaaS Rehberi Altyapı ve Geliştirme Mimarisi

Bu doküman; **SaaS Rehberi** projesinin tüm teknik kararlarını, altyapı yığınını, güvenlik sınırlarını, servis yönlendirme matrisini ve kodlama standartlarını yapay zeka asistanları için tek bir yoğun bağlam (Context) kaynağında toplar.

---

## 1. Mimari Kararlar ve Sistem Özeti

* **Hedef Mimari:** Bulut sağlayıcılarına bağımlı olmayan, düşük kaynak tüketimli, tamamen kendi sunucularımızda barındırılan (Self-Hosted PaaS) hibrit/yerel SaaS altyapısı.
* **DNS & TLS Kararı:** Canlı ortam ve tüm servis yönlendirmeleri için **DuckDNS** (`*.pr2cloud.duckdns.org`) + **Certbot (DNS-01 Challenge)** ile üretilen **Wildcard TLS** sertifikaları kullanılır.
* **Ağ ve Güvenlik Sınırı:** Yönetim arayüzleri ve iç servisler genel internete kapatılır. Sunucuya erişim **Tailscale** (`tailscale0`) üzerinden sağlanır; işletim sistemi seviyesinde **firewalld** (bölge izolasyonu) ve **Fail2ban** (proaktif log analizi ve IP engelleme) ile korunur.
* **Kimlik Doğrulama (SSO):** Tüm altyapı servisleri ve uygulamalar merkezi **Dex (OIDC Identity Provider)** üzerinden tek oturum açma (SSO) ile kimlik doğrular.

---

## 2. Teknoloji Yığını (Technology Stack Matrix)

| Katman / Alan | Seçilen Araç | Temel Görevi ve Mimari Rolü |
| :--- | :--- | :--- |
| **Ana İşletim Sistemi** | **AlmaLinux 9** | RHEL 9 ABI uyumlu, 10 yıl destekli (2032'ye kadar), SELinux ve firewalld tabanlı kurumsal sunucu işletim sistemi (Host OS). |
| **Yazılım Çalışma Zamanı** | **Node.js** | Ön yüz, arka yüz ve derleme betikleri için ana JavaScript çalışma zamanı (V8 + libuv). |
| **Paket Yöneticisi** | **pnpm** | İçerik adreslemeli merkezi depo ve `pnpm-workspace.yaml` ile katı monorepo bağımlılık yönetimi. |
| **Monorepo Orkestratörü** | **Turborepo** | `turbo.json` üzerinden bağımlılık grafiği (DAG) analizi, paralel görev yürütme ve içerik tabanlı önbellekleme. |
| **Dokümantasyon Portalı** | **VitePress** | `apps/docs` altında yer alan, Markdown + Vue tabanlı statik dokümantasyon ve sözlük motoru (SSG). |
| **Konteyner & İzolasyon** | **Docker** | Tüm altyapı servislerini ve uygulamaları işletim sisteminden bağımsız çalıştıran izolasyon katmanı. |
| **Ters Vekil (Reverse Proxy)** | **Nginx** | Tek giriş noktası (80/443), Wildcard TLS sonlandırma ve alt alan adı bazlı konteyner yönlendirmesi. |
| **Özel Ağ (Mesh VPN)** | **Tailscale** | WireGuard tabanlı, CGNAT ve dinamik IP değişimlerini aşan kalıcı `100.x.y.z` özel ağ katmanı. |
| **Dinamik DNS (DDNS)** | **DuckDNS** | API tabanlı dinamik IP güncellemesi ve DNS-01 doğrulamasıyla Wildcard alan adı yönetimi. |
| **TLS Sertifikasyonu** | **Certbot** | `certbot-dns-duckdns` eklentisiyle otomatik 90 günlük Let's Encrypt Wildcard SSL/TLS üretimi. |
| **Merkezi Kimlik (SSO)** | **Dex** | OAuth 2.0 / OpenID Connect (OIDC) tabanlı hafif merkezi kimlik sağlayıcısı (IdP). |
| **Kod Deposu & CI/CD** | **Gitea** | Self-hosted Git sunucusu, Gitea Actions (CI/CD) ve dahili OCI Docker Container Registry. |
| **Nesne Depolama (S3)** | **MinIO** | S3 API uyumlu statik medya, dokümantasyon varlıkları (`docs-assets`) ve yedekleme deposu. |
| **Sunucu Güvenliği** | **firewalld + Fail2ban** | Arayüz bazlı (`eth0` vs `tailscale0`) bölge filtrelemesi ve kaba kuvvet saldırılarına karşı dinamik IP ban. |
| **Geçici Dış Tünel** | **ngrok** | Geliştirme aşamasında dış servislerden gelen Webhook isteklerini `localhost` üzerine aktaran ters tünel aracı. |

---

## 3. Servis Yönlendirme ve Port Matrisi

Alan adı şablonu: `*.projeadi.duckdns.org` (Nginx 443 HTTPS üzerinden iç portlara yönlendirilir).

| Servis | Alt Alan Adı (Subdomain) | İç Konteyner Portu | Erişim ve Güvenlik Politikası |
| :--- | :--- | :--- | :--- |
| **VitePress Docs** | `docs.projeadi.duckdns.org` | `:4173` (veya Statik) | Tailscale / Yetkili Erişim |
| **Dex (SSO / OIDC)** | `auth.projeadi.duckdns.org` | `:5556` | Merkezi OIDC Uç Noktası |
| **Gitea (Git & Registry)** | `gitea.projeadi.duckdns.org` | `:3000` (HTTP) / `:2222` (SSH) | Tailscale + Dex SSO |
| **MinIO Web Konsol** | `minio.projeadi.duckdns.org` | `:9001` | Tailscale + Dex SSO (WebSocket açık) |
| **MinIO S3 API** | `s3.projeadi.duckdns.org` | `:9000` | Uygulama SDK Bağlantı Noktası |

---

## 4. Geliştirme ve Dokümantasyon Standartları (Anayasa Kuralları)

1. **Yaşam Döngüsü (3 Aşamalı İş Akışı):**
   * *1. Ar-Ge ve Teknik Tespit* -> *2. Temiz Kod Uygulama ve Test* -> *3. VitePress Rehber Dokümantasyonu*.
2. **Dosya Adlandırma Kuralları:**
   * React / UI Bileşenleri: **PascalCase** (`EditableCell.tsx`, `Navbar.tsx`).
   * React dışı tüm dosyalar (Backend servisleri, config, script, doküman): **kebab-case** (`auth-service.ts`, `services.conf`).
3. **Front-End Stil Mimarisi:**
   * **Tailwind CSS v4** kullanılır; temalar native CSS değişkenleri ile tanımlanır, `@theme` ve `@utility` direktifleri esas alınır.
4. **Dokümantasyon Ayrımı ve Şablonu:**
   * **Tanıtım / Sözlük Maddeleri:** Üretici ve resmi web sitesi bilgisiyle başlar. `::: info CONCEPT MATRICES` bloğu **İngilizce**, geri kalan tüm anlatım, **Resmi Tanım**, **Sözlük Veritabanı (Lexical Database)** ve **Cheatsheet** bölümleri **Türkçe Markdown** formatındadır.
   * **Uygulama (Development) Maddeleri:** Pratik kurulum, konfigürasyon dosyaları, komutlar ve doğrulama adımlarını içerir.
5. **AI Çıktı Kuralı:**
   * Kod güncellemelerinde tüm dosyayı baştan yazmak yerine yalnızca değişen fonksiyon veya bileşenler modüler ve nokta atışı olarak sunulur.
   * Tüm teknik doküman ve kritik özetlerin başında standart **YAML Front Matter** bloğu bulunur.
