---
title: "Tanıtım"
description: "AI Workspace / pr2cloud Single Source of Truth (System Prompt & Context Reference)"
outline: [2, 3]
sidebarTitle: "Proje Tanımı"
index: 1
isContent: true
hidden: false
status: "published" # draft | review | published
tags: [ai-reference, pr2cloud, architecture, monorepo, self-hosted-paas, security, sso, devops, mail-server]
---
    

# πr² Cloud Altyapı Standartları
::: info Bu doküman; **pr2cloud** (*Pr2 PaaS Environment & Software Development Guide - PaaS Ortamı ve Yazılım Geliştirme Rehberi*) projesinin tüm teknik kararlarını, altyapı yığınını, çalışma dizini hiyerarşisini, çift ağ izolasyon sınırlarını, servis yönlendirme matrisini ve dokümantasyon kurallarını tek bir bağlam (Context) kaynağında toplar.
:::
---

## 1. Mimari Kararlar ve Sistem Özeti
* **Hedef Mimari:** Bulut sağlayıcılarına bağımlı olmayan, düşük kaynak tüketimli, tamamen kendi VPS ve yerel sunucularımızda barındırılan (Self-Hosted PaaS) hibrit SaaS altyapısı.
* **DNS & TLS Kararı:** Canlı VPS ortamında özel alan adı (`example.com`) ve alt alan adları, yerel/hibrit ağlarda **DuckDNS** (`*.projeadi.duckdns.org`) kullanılır. Tüm servisler için **Certbot (DNS-01 Challenge)** ile üretilen **Wildcard TLS** sertifikaları esastır.
* **Ağ ve Güvenlik Sınırı:** Yönetim arayüzleri ve iç servisler e-posta sunucusunun zorunlu `SMTP/IMAP` portları hariç genel internete kapatılır . Sunucuya yönetim erişimi **Tailscale** (`tailscale0`) üzerinden sağlanır; işletim sistemi seviyesinde **firewalld** ve **Fail2ban** ile korunur.
* **Kimlik Doğrulama (SSO):** Tüm altyapı servisleri ve web uygulamaları merkezi **Dex (OIDC Identity Provider — SQLite backend)** üzerinden tek oturum açma (SSO) ile kimlik doğrular.
* **E-Posta Altyapısı:** Kurumsal e-posta sunucusu olarak Rust tabanlı **Stalwart Mail Server**, webmail arayüzü olarak ise hafif **SnappyMail** ayrı konteynerler halinde konumlandırılır.

### Çift Ağ (Dual-NIC) İzolasyon Topolojisi
Servis ve API katmanı iki ayrı Docker sanal ağına (iki ağ arayüzü mantığıyla) bölünür:
* **`pr2_edge_net` (Kenar Ağı):** Nginx (reverse proxy) ve API Gateway/API servislerinin dış iletişim arayüzünü barındırır.
* **`pr2_internal_net` (İç Servis Ağı - `internal: true`):** Dex (SQLite), MinIO, Gitea, Stalwart iç servisleri ve veritabanlarını barındırır; dış internete kapalıdır.
* **API Katmanı Köprüsü:** API servisleri hem `pr2_edge_net` hem de `pr2_internal_net` ağlarına atanarak iki ağ arasında kontrollü veri geçişi sağlar.

---

## 2. Çalışma Dizini ve Klasör Mimarisi
Sistem; kaynak kodların, canlı (VPS) yapılandırmalarının ve çalışma zamanı kalıcı verilerinin birbirinden kesin olarak ayrıldığı **`pr2cloud`** kök çalışma alanı üzerine kuruludur:

```text
pr2cloud/
├── source/                     # [Git Repo] Ana Monorepo (Kaynak Kodlar & Dev Ortamı)
│   ├── apps/                   # Yazılım Projeleri ve VitePress dokümantasyon portalı
│   ├── packages/               # Paylaşılan kütüphaneler, UI bileşenleri, config paketleri
│   ├── infra/                  # Geliştirme ortamı altyapı servisleri ve yapılandırmaları
│   │   ├── certbot/            # Yerel/test TLS sertifika betikleri ve yapılandırmaları
│   │   ├── docs/               # Dokümantasyon konteyner/yayın yapılandırmaları
│   │   ├── gateway/            # Yerel ters vekil (Nginx/Gateway) yapılandırmaları
│   │   ├── gitea/              # Yerel Git & CI/CD geliştirme servisi
│   │   ├── scripts/            # Geliştirme ortamı otomasyon betikleri
│   │   └── .env                # Geliştirme ortamı parametreleri (Git denetiminde)
│   └── turbo.json              # Monorepo görev ve önbellek orkestrasyonu
│
├── prod/                       # [Git Repo] VPS (Production) Yapılandırma Deposu
│   ├── nginx/                  # Ters vekil (Reverse Proxy) sanal sunucu yapılandırmaları
│   ├── dex/                    # Merkezi OIDC yapılandırması (config.yaml)
│   ├── mariadb/                # MariaDB özel yapılandırma dosyaları (my.cnf)
│   ├── stalwart/               # Stalwart Mail Server statik yapılandırma dosyaları
│   ├── snappymail/             # SnappyMail yapılandırma şablonları
│   ├── docker-compose.yml      # Canlı ortam servis orkestrasyonu (Dual-NIC tanımlı)
│   └── .env                    # Üretim ortamı parametreleri (Git denetiminde şablon/yapılandırma)
│
└── data/                       # [Git Dışı / Volume] Çalışma Zamanı & Kalıcı Veriler (Runtime)
    ├── dex/                    # dex.db (SQLite veritabanı)
    ├── gitea/                  # Git depoları ve konteyner kayıt defteri verileri
    ├── minio/                  # S3 nesne depolama kovaları (buckets) - PGSTY SILO uyumlu
    ├── mariadb/                # İlişkisel veritabanı veri dosyaları
    ├── stalwart/               # E-posta kutuları, kuyruklar, DKIM anahtarları ve veritabanı
    ├── snappymail/             # Webmail oturum ve kullanıcı ayar verileri
    └── certs/                  # Certbot Wildcard SSL/TLS sertifikaları
```


### Klasör Yönetimi İlkeleri
* **`source/` ve `prod/` İzolasyonu:** Uygulama geliştirme süreçleri ve yerel geliştirme servisleri (`source/infra/`) ana monorepo deposunda yürütülürken, VPS üzerindeki altyapı orkestrasyonu bağımsız bir Git deposu olan `prod/` üzerinden yönetilir.
* **Git Denetimli `.env` Stratejisi:** Ortam parametrelerinin izlenebilirliğini ve taşınabilirliğini sağlamak için `.env` dosyaları `source/infra/` ve `prod/` klasörleri altında Git denetiminde tutulur *(kritik gizli anahtarlar/parolalar şifreli veya secret referansı olarak yönetilir)*.
* **`data/` Kalıcılığı:** Konteyner silinse veya güncellense dahi veri kaybı yaşanmaması için tüm stateful servislerin volume bağlamaları (bind mounts) kök dizindeki `data/` altına yapılır.

---

## 3. Teknoloji Yığını (Technology Stack Matrix)

| Katman / Alan | Seçilen Araç | Temel Görevi ve Mimari Rolü |
| :--- | :--- | :--- |
| **Ana İşletim Sistemi** | **AlmaLinux 9** | RHEL 9 ABI uyumlu, SELinux ve firewalld tabanlı kurumsal sunucu işletim sistemi. |
| **Yazılım Çalışma Zamanı** | **Node.js** | Ön yüz, arka yüz ve derleme betikleri için ana JavaScript çalışma zamanı. |
| **Paket Yöneticisi** | **pnpm** | `pnpm-workspace.yaml` ile içerik adreslemeli katı monorepo bağımlılık yönetimi. |
| **Monorepo Orkestratörü** | **Turborepo** | `turbo.json` üzerinden DAG bağımlılık analizi ve paralel görev önbellekleme. |
| **Dokümantasyon Portalı** | **VitePress** | `apps/docs` altında yer alan Markdown + Vue tabanlı statik dokümantasyon motoru. |
| **Konteyner & İzolasyon** | **Docker** | Tüm altyapı servislerini işletim sisteminden izole çalıştıran konteyner katmanı. |
| **Ters Vekil (Reverse Proxy)** | **Nginx** | Tek giriş noktası (80/443), Wildcard TLS sonlandırma ve alt alan adı yönlendirmesi. |
| **Özel Ağ (Mesh VPN)** | **Tailscale** | WireGuard tabanlı, CGNAT ve dinamik IP değişimlerini aşan kalıcı `100.x.y.z` ağı. |
| **DNS & DDNS** | **Alan Adı + DuckDNS** | Canlı VPS için özel alan adı DNS yönetimi; yerel/hibrit uçlar için DuckDNS. |
| **TLS Sertifikasyonu** | **Certbot** | DNS-01 doğrulaması ile otomatik 90 günlük Let's Encrypt Wildcard SSL/TLS üretimi. |
| **Merkezi Kimlik (SSO)** | **Dex (SQLite)** | OAuth 2.0 / OIDC tabanlı, hafif SQLite depolamalı merkezi kimlik sağlayıcısı. |
| **Kod Deposu & CI/CD** | **Gitea** | Self-hosted Git sunucusu, Gitea Actions ve dahili OCI Docker Container Registry. |
| **E-Posta Sunucusu (MTA/IMAP)** | **Stalwart Mail Server** | Modern, tek ikili (Rust) tabanlı, SPF/DKIM/DMARC ve JMAP/IMAP/SMTP destekli mail sunucusu. |
| **Webmail İstemcisi** | **SnappyMail** | Düşük kaynak tüketimli, modern ve güvenli web tabanlı e-posta arayüzü. |
| **Sunucu Güvenliği** | **firewalld + Fail2ban** | Arayüz bazlı (`eth0` vs `tailscale0`) bölge filtrelemesi ve dinamik IP engelleme. |
| **Nesne Depolama (S3)** | **MinIO (PGSTY SILO)** | Üretici desteği sonlanan MinIO yerine `pgsty/silo` imajı ile S3 API uyumlu medya, dokümantasyon varlıkları (`docs-assets`) ve yedek deposu. |
| **İlişkisel Veritabanı** | **MariaDB** | Uygulamalar için düşük kaynak tüketimli, yüksek performanslı ilişkisel veritabanı sunucusu. |
| **Veritabanı Yönetimi** | **phpMyAdmin** | MariaDB veritabanı şemalarını, tablolarını ve sorgularını yönetmek için web tabanlı yönetim arayüzü. |

---

## 4. Servis Yönlendirme ve Port Matrisi
Alan adı şablonu: `*.alanadi.com` (Canlı VPS) veya `*.projeadi.duckdns.org` (Hibrit/Yerel). Reverse proxy arkasındaki HTTP servisleri host makineye port açmaz, Docker iç ağı üzerinden Nginx ile haberleşir.

| Servis | Alt Alan Adı (Subdomain) | İç / Dış Port | Erişim ve Güvenlik Politikası |
| :--- | :--- | :--- | :--- |
| **VitePress Docs** | `docs.<domain>` | `:4173` / Statik | Tailscale / Yetkili Erişim |
| **Dex (SSO / OIDC)** | `auth.<domain>` | `:5556` | Merkezi OIDC Uç Noktası (HTTPS) |
| **Gitea (Git & Registry)** | `gitea.<domain>` | `:3000` (HTTP) / `:2222` (SSH **disable**) | Tailscale + Dex SSO |
| **Stalwart Mail Server** | `mail.<domain>` | `25, 465, 587` (SMTP) / `993` (IMAPS) / `:8080` (Admin) | Mail portları genel ağa açık; Yönetim arayüzü Tailscale + Nginx arkasında |
| **SnappyMail Webmail** | `webmail.<domain>` | `:8888` (İç HTTP) | Nginx HTTPS + Dex SSO / İstemci Erişimi |
| **MinIO Web Konsol (SILO)** | `minio.<domain>` | `:9001` | Tailscale + Dex SSO (WebSocket açık) |
| **MinIO S3 API (SILO)** | `s3.<domain>` | `:9000` | Uygulama SDK Bağlantı Noktası |
| **phpMyAdmin** | `db.<domain>` | `:80` (İç HTTP) | Tailscale + Dex SSO |
| **MariaDB** | *(Subdomain yok)* | `:3306` (İç TCP) | Yalnızca `pr2_internal_net` (API Katmanı & phpMyAdmin Erişimi) |

---

## 5. Mimari Tasarım ve Dökümantasyon Standartları

### A. Dosya Adlandırma Kuralları
* **React / UI Bileşenleri:** `PascalCase` (`EditableCell.tsx`, `Navbar.tsx`).
* **React Dışı Tüm Dosyalar:** Backend servisleri, yapılandırma dosyaları, betikler ve dokümanlar kesinlikle `kebab-case` (`auth-service.ts`, `docker-compose.yml`, `services.conf`).

### B. Yaşam Döngüsü (3 Aşamalı İş Akışı)
1. **Ar-Ge ve Teknik Tespit:** Mimari gereksinimlerin, iş akışı, altyapı ve yazılım bağımlılıklarının belirlenmesi.
2. **Temiz Kod Uygulama ve Test:** Geliştirme standartları referansına uygun modüler kodlama ve doğrulama.
3. **VitePress Rehber Dokümantasyonu:** Sürecin kalıcı bilgi havuzuna aktarılması.

### C. Dokümantasyon Formatı ve Şablonu

*   **YAML Front Matter Şablonu (Zorunlu Standart):** Tüm VitePress dokümanlarının en üstünde aşağıdaki standart şablon yer alır. `keywords` alanı kullanılmaz; tüm anahtar kelimeler `kebab-case` formatında `tags` altında birleştirilir. (`lastUpdated`, `editLink`, `prev`, `next` ayarları global `config.mts` üzerinden yönetilir, gerekmedikçe sayfa bazlı yazılmaz.)
    ```yaml
    ---
    title: "Sayfa Başlığı"                             # Tarayıcı başlığında görünecek etiket
    description: "SEO ve sayfa özeti açıklaması."      # SEO, AI, Developper için açıklama 
    outline: [2, 3]                                    # sağ panel derinliği Table of Contents - h3 gösterilir
    sidebarTitle: "Kısa Menü Başlığı"                  # sol panel döküman ağacında görünecek başlık
    index: 10                                          # döküman veya başlığın grup içi sırası
    isContent: false                                   # index.md dosyasını atlayıp ilk belgeye bağlantı kur
    hidden: false                                      # klasör(index.md) veya dosyayı gizle 
    status: "published"                                # draft | review | published   
    tags: ["kategori", "alt-konu", "teknoloji-adi"]    # belge konuları
    ---
    ```
*   **Tanıtım / Sözlük Maddeleri:** Üretici ve resmi web sitesi bilgisiyle başlar. `::: info CONCEPT MATRICES` bloğu **İngilizce**; **Resmi Tanım**, **Sözlük Veritabanı (Lexical Database)** ve **Cheatsheet** bölümleri **Türkçe Markdown** formatındadır.
*   **Uygulama (Development) Maddeleri:** Pratik kurulum adımları, yapılandırma dosyaları, terminal komutları ve doğrulama kontrollerini içerir.



### D. AI Çıktı Kuralı
* Kod güncellemelerinde tüm dosyayı baştan yazmak yerine yalnızca değişen fonksiyon, blok veya bileşenler modüler ve nokta atışı olarak sunulur.



### Çift Ağ (Dual-NIC) İzolasyon Topolojisi
Servis ve API katmanı iki ayrı Docker sanal ağına (iki ağ arayüzü mantığıyla) bölünür:
* **`pr2_edge_net` (Kenar Ağı):** Nginx (reverse proxy) ve API Gateway/API servislerinin dış iletişim arayüzünü barındırır.
* **`pr2_internal_net` (İç Servis Ağı - `internal: true`):** Dex (SQLite), MinIO (PGSTY SILO), MariaDB, Gitea, Stalwart iç servisleri ve veritabanlarını barındırır; dış internete kapalıdır.
* **API Katmanı Köprüsü:** API servisleri hem `pr2_edge_net` hem de `pr2_internal_net` ağlarına atanarak iki ağ arasında kontrollü veri geçişi sağlar.

---

