---
title: "Tanıtım"
description: "πr² Cloud Self-Hosted PaaS mimari kararları, çift ağ izolasyonu, modüler dizin yapısı, merkezi ortam değişkenleri ve dokümantasyon standartları."
outline: [2, 3]
sidebarTitle: "πr² Cloud Altyapı Standartları"
index: 10
isContent: true
hidden: false
status: "published"
tags: ["ai-reference", "pr2cloud", "architecture", "monorepo", "self-hosted-paas", "security", "sso", "devops"]
---

# πr² Cloud Altyapı Standartları

::: info Proje Bağlamı (Single Source of Truth)
Bu doküman; **πr² Cloud** (*PaaS Ortamı ve Yazılım Geliştirme Rehberi*) projesinin tüm mimari kararlarını, modüler altyapı hiyerarşisini, ağ izolasyon sınırlarını, servis yönlendirme matrisini ve dokümantasyon kurallarını tek bir bağlam (Context) kaynağında toplar.
:::

## 1. Mimari Kararlar ve Sistem Özeti

* **Hedef Mimari:** Bulut sağlayıcılarına bağımlı olmayan, düşük kaynak tüketimli, tamamen kendi VPS ve yerel sunucularımızda barındırılan (Self-Hosted PaaS) modüler SaaS altyapısı.
* **Ortam Bağımsız Modüler Yapı:** Geliştirme ve canlı ortamlar için ayrı yapılandırmalar yerine, merkezi bir `.env` dosyası (`DOMAIN`, `DATA_DIR`, `CERT_ROOT`) üzerinden dinamik olarak şekillenen **tek bir modüler kurulum akışı** esastır.
* **DNS & Uçtan Uca TLS:** Canlı ortamda özel alan adı (Cloudflare), yerel ve hibrit ağlarda ise `TXT` kaydı destekleyen dinamik DNS (DuckDNS) kullanılır. Üretilen **Wildcard TLS** sertifikaları yalnızca **Nginx** ve **Stalwart Mail Server** tarafından doğrudan okunur; diğer tüm servisler iç ağda SSL yükü olmadan çalışır.
* **Ağ ve Güvenlik Sınırı:** Zorunlu e-posta protokol portları hariç tüm yönetim arayüzleri ve iç servisler genel internete kapatılır; sunucu yönetimi yalnızca şifreli özel VPN ağı (`tailscale0`) ve arayüz bazlı güvenlik duvarı kurallarıyla sınırlandırılır.
* **Merkezi Kimlik Doğrulama (SSO):** Hem geliştirme araçları hem de tüm SaaS uygulamaları, standart **OAuth 2.0 / OIDC** protokolü üzerinden tek oturum açma (SSO) ile kimlik doğrular.


### Çift Ağ (Dual-NIC) İzolasyon Topolojisi

Servis ve API katmanı iki ayrı Docker sanal ağına bölünür:
* **`pr2_edge_net` (Genel Erişim Ağı):** Nginx (reverse proxy) ve dış dünyaya açılan API katmanının dış iletişim arayüzünü barındırır.
* **`pr2_internal_net` (İç Servis Ağı):** Dex (SQLite), SILO (MinIO alias), Gitea, Stalwart iç servisleri ve veritabanlarını barındırır; dış internete tamamen kapalıdır.
* **API Katmanı Köprüsü:** API servisleri hem `pr2_edge_net` hem de `pr2_internal_net` ağlarına atanarak iki ağ arasında kontrollü veri geçişi sağlar.


## 2. Çalışma Dizini ve Klasör Mimarisi

Sistem; artık tek bir üst çalışma alanına (workspace) bağımlı olmadan, birbirinden tamamen bağımsız iki kök dizin (`pr2source/` ve `pr2data/`) üzerine kuruludur. Kalıcı veri dizininin konumu `infra/.env` dosyasındaki `DATA_DIR` ve `CERT_ROOT` değişkenleriyle belirlenir:

```text
pr2source/                          # [Git Repo] Ana Monorepo (Kaynak Kodlar & Modüler Altyapı)
├── apps/                           # Yazılım Projeleri ve VitePress dokümantasyon portalı
├── packages/                       # Paylaşılan kütüphaneler, UI bileşenleri, config paketleri
├── infra/                          # Ortam bağımsız modüler altyapı orkestrasyonu
│   ├── nginx/                      # Ters vekil şablonları (templates/) ve ortak parçalar (snippets/)
│   ├── scripts/                    # Otomasyon ve sertifika yenileme betikleri
│   ├── .env                        # TÜM servisler ve şablonlar için tek merkezi ortam dosyası
│   ├── dex-config.yaml             # Merkezi OIDC yapılandırması
│   ├── compose.gateway.yml         # Nginx Reverse Proxy (envsubst şablon destekli)
│   ├── compose.dex.yml             # Dex SSO (SQLite backend)
│   ├── compose.gitea.yml           # Gitea Git Sunucusu & OCI Container Registry
│   ├── compose.silo.yml            # PGSTY SILO S3 Nesne Depolama (internal alias: minio)
│   ├── compose.db.yml              # MariaDB & phpMyAdmin
│   └── compose.mail.yml            # Stalwart Mail Server & SnappyMail
└── turbo.json                      # Monorepo görev ve önbellek orkestrasyonu

pr2data/                            # [Git Dışı / Volume] Çalışma Zamanı & Kalıcı Veriler (\${DATA_DIR})
├── certs/                          # Certbot Wildcard SSL/TLS sertifikaları (\${CERT_ROOT})
├── wwwroot/                        # Varsayılan Gateway karşılama ve yönlendirme sayfası
├── dex/                            # dex.db (SQLite veritabanı)
├── gitea/                          # Git depoları ve konteyner kayıt defteri verileri
├── silo/                           # S3 nesne depolama kovaları (buckets)
├── mariadb/                        # İlişkisel veritabanı veri dosyaları
├── stalwart/                       # E-posta kutuları, kuyruklar, DKIM anahtarları ve veritabanı
└── snappymail/                     # Webmail oturum ve kullanıcı ayar verileri
```

### Klasör ve Ortam Yönetimi İlkeleri

* **Bağımsız Kök Dizinler (`pr2source/` & `pr2data/`):** Kod deposu ile çalışma zamanı verileri arasında sabit bir üst dizin veya göreli yol (`../../../data`) bağımlılığı yoktur; yerel geliştirme ve canlı VPS ortamlarında iki dizin farklı disk bölümlerinde bile bağımsız konumlandırılabilir.
* **Tek Merkezi `.env` Sözleşmesi:** `DOMAIN`, `DATA_DIR` ve `CERT_ROOT` başta olmak üzere tüm yapılandırma değişkenleri `infra/.env` dosyasında tutulur. Nginx (`envsubst` şablon motoru), Dex ve Docker Compose dosyaları bu değişkenleri doğrudan okur.
* **Modüler Compose İzolasyonu:** Her `compose.<servis>.yml` dosyası kendi benzersiz `name: pr2-<servis>` tanımını içerir; servisler birbirini etkilemeden tekil olarak başlatılıp güncellenebilir.
* **İç Ağ Takma Adları (Docker Aliases):** Dahili servisler dış DNS'e çıkmadan doğrudan konteyner takma adlarıyla haberleşir (ör. `pr2-silo` konteyneri `pr2_internal_net` üzerinde `minio` ve `silo` takma adlarıyla çözülür).


## 3. Teknoloji Yığını (Technology Stack Matrix)

### Çekirdek Altyapı ve Ağ Servisleri

| Katman / Alan | Seçilen Araç | Temel Görevi ve Mimari Rolü |
| :--- | :--- | :--- |
| **Ana İşletim Sistemi** | **AlmaLinux 9** | RHEL 9 ABI uyumlu, SELinux ve firewalld tabanlı kurumsal sunucu işletim sistemi. |
| **Özel Ağ (Mesh VPN)** | **Tailscale** | WireGuard tabanlı, CGNAT ve dinamik IP değişimlerini aşan kalıcı `100.x.y.z` ağı. |
| **Konteyner & İzolasyon** | **Docker** | Tüm altyapı servislerini işletim sisteminden izole çalıştıran konteyner katmanı. |
| **Sunucu Güvenliği** | **firewalld + Fail2ban** | Arayüz bazlı (`eth0` vs `tailscale0`) bölge filtrelemesi ve dinamik IP engelleme. |
| **Ters Vekil (Reverse Proxy)** | **Nginx** | Tek giriş noktası (80/443), `envsubst` şablon yönetimi ve Wildcard TLS sonlandırma. |
| **DNS & DDNS** | **Cloudflare / DuckDNS** | Canlı VPS için özel alan adı DNS yönetimi; yerel/hibrit uçlar için DuckDNS. |
| **TLS Sertifikasyonu** | **Certbot** | DNS-01 doğrulaması ile otomatik 90 günlük Let's Encrypt Wildcard SSL/TLS üretimi. |
| **Merkezi Kimlik (SSO)** | **Dex (SQLite)** | OAuth 2.0 / OIDC tabanlı, geliştirici araçları ve tüm SaaS projeleri için merkezi kimlik sağlayıcı. |
| **Nesne Depolama (S3)** | **PGSTY SILO** | S3 API uyumlu medya, dokümantasyon varlıkları (`docs-assets`) ve yedek deposu (`minio` alias). |
| **İlişkisel Veritabanı** | **MariaDB** | Uygulamalar için düşük kaynak tüketimli, yüksek performanslı ilişkisel veritabanı sunucusu. |
| **Veritabanı Yönetimi** | **phpMyAdmin** | MariaDB veritabanı şemalarını, tablolarını ve sorgularını yönetmek için web tabanlı yönetim arayüzü. |

### Geliştirme ve Monorepo Ekosistemi

| Katman / Alan | Seçilen Araç | Temel Görevi ve Mimari Rolü |
| :--- | :--- | :--- |
| **Yazılım Çalışma Zamanı** | **Node.js** | Ön yüz, arka yüz ve derleme betikleri için ana JavaScript çalışma zamanı. |
| **Paket Yöneticisi** | **pnpm** | `pnpm-workspace.yaml` ile içerik adreslemeli katı monorepo bağımlılık yönetimi. |
| **Monorepo Orkestratörü** | **Turborepo** | `turbo.json` üzerinden DAG bağımlılık analizi ve paralel görev önbellekleme. |
| **Dokümantasyon Portalı** | **VitePress** | `apps/docs` altında yer alan Markdown + Vue tabanlı statik dokümantasyon motoru. |
| **Kod Deposu & CI/CD** | **Gitea** | Self-hosted Git sunucusu, Gitea Actions ve dahili OCI Docker Container Registry. |

### Kurumsal E-Posta Servisleri

| Katman / Alan | Seçilen Araç | Temel Görevi ve Mimari Rolü |
| :--- | :--- | :--- |
| **E-Posta Sunucusu (MTA/IMAP)** | **Stalwart Mail Server** | Modern, tek ikili (Rust) tabanlı, SPF/DKIM/DMARC ve JMAP/IMAP/SMTP destekli mail sunucusu. |
| **Webmail İstemcisi** | **SnappyMail** | Düşük kaynak tüketimli, modern ve güvenli web tabanlı e-posta arayüzü. |


## 4. Servis Yönlendirme ve Port Matrisi

Alan adı şablonu: `${DOMAIN}` (`alanadi.com` veya `projeadi.duckdns.org`). Reverse proxy arkasındaki HTTP servisleri host makineye port açmaz, Docker iç ağı üzerinden Nginx ile haberleşir.

| Servis | Alt Alan Adı (Subdomain) | İç / Dış Port | Erişim ve Güvenlik Politikası |
| :--- | :--- | :--- | :--- |
| **VitePress Docs** | `docs.${DOMAIN}` | `:4173` / Statik | Tailscale / Yetkili Erişim |
| **Dex (SSO / OIDC)** | `auth.${DOMAIN}` | `:5556` | Merkezi OIDC Uç Noktası (HTTPS) |
| **Gitea (Git & Registry)** | `gitea.${DOMAIN}` | `:3000` (HTTP) / `:2222` (SSH **disable**) | Tailscale + Dex SSO |
| **Stalwart Mail Server** | `mail.${DOMAIN}` | `25, 465, 587` (SMTP) / `993` (IMAPS) / `:8080` (Admin) | Mail portları genel ağ; Yönetim arayüzü Tailscale |
| **SnappyMail Webmail** | `webmail.${DOMAIN}` | `:8888` | Nginx HTTPS |
| **SILO Dahili S3 API** | *(İç Ağ: `http://minio:9000`)* | `:9000` | Stalwart ve dahili servisler erişimi |
| **SILO S3 API** | `s3.${DOMAIN}` | `:9000` | Uygulama SDK Bağlantı Noktası |
| **SILO Web Konsol** | `s3-console.${DOMAIN}` | `:9001` | Tailscale + Yönetim Paneli |
| **phpMyAdmin** | `db.${DOMAIN}` | `:80` (İç HTTP) | Tailscale |
| **MariaDB** | *(Subdomain yok)* | `:3306` (İç TCP) | API Katmanı & phpMyAdmin Erişimi |


## 5. Mimari Tasarım ve Dokümantasyon Standartları


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

