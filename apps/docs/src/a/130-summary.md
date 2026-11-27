---
title: "Sistem Özeti, Ortam Değişkenleri ve Kimlik-Şifre Rehberi"
description: "πr² Cloud altyapısındaki tüm konteynerlerin mimari özeti, merkezi infra/.env değişken sözleşmesi, parola yönetimi ve sunucu taşıma rehberi."
outline:
sidebarTitle: "Sistem Özeti & Şifreler"
index: 130
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "architecture", "env", "security", "credentials", "cheatsheet"]
---

# Sistem Özeti, Ortam Değişkenleri ve Kimlik-Şifre Rehberi

::: info Büyük Resim ve Operasyon Özeti
Bu doküman; **πr² Cloud** altyapısında çalışan tüm modüler konteynerlerin ağ sınırlarını, merkezi `infra/.env` değişken sözleşmesini, yönetici kimlik/parola konumlarını ve yeni bir sunucuya taşıma adımlarını tek merkezde toplar.
:::

## 1. Canlı Sistem Mimari Özeti (9 Çekirdek Konteyner)

Altyapı; tek bir **AlmaLinux 9** sunucusu üzerinde **Çift Ağ (Dual-NIC)** ve **Tailscale VPN** izolasyonuyla çalışan 9 modüler konteynerden oluşur:

| Katman / Servis | Konteyner Adı | İç / Dış Port | Ağ Konumu | Erişim Politikası ve Görevi |
| :--- | :--- | :--- | :--- | :--- |
| **Ters Vekil (Gateway)** | `pr2-gateway` | `80, 443` (Host) | `edge` + `internal` | Wildcard TLS sonlandırma, `envsubst` yönlendirme ve iç DNS alias |
| **Merkezi SSO (OIDC)** | `pr2-dex` | `:5556` | `edge` + `internal` | `https://auth.${DOMAIN}` — Google OAuth 2.0 & OIDC sağlayıcı |
| **Git & OCI Registry** | `pr2-gitea` | `:3000` (SSH Kapalı) | `edge` + `internal` | `https://gitea.${DOMAIN}` — Kod deposu ve konteyner kayıt defteri |
| **CI/CD İşçisi** | `pr2-gitea-runner` | *(Port yok)* | `pr2_internal_net` | Gitea Actions iş akışlarını izole konteynerlerde derler |
| **Nesne Depolama (S3)** | `pr2-silo` | `:9000` / `:9001` | `edge` + `internal` | `s3.${DOMAIN}` (Genel API) & `s3-console.${DOMAIN}` (Yalnızca VPN) |
| **İlişkisel Veritabanı** | `pr2-mariadb` | `:3306` | `pr2_internal_net` | Dış dünyaya tamamen kapalı (`128M` InnoDB buffer) ana veritabanı |
| **DB Yönetim Paneli** | `pr2-phpmyadmin` | `:80` | `edge` + `internal` | `https://db.${DOMAIN}` — Yalnızca Tailscale VPN (`100.64.0.0/10`) |
| **Kurumsal E-Posta** | `pr2-stalwart` | `25, 465, 587, 993` | `edge` + `internal` | SMTP/IMAPS sunucusu; `:8080` Admin paneli yalnızca Tailscale VPN |
| **Webmail İstemcisi** | `pr2-snappymail` | `:8888` | `edge` + `internal` | `https://webmail.${DOMAIN}` — İç ağdan `pr2-stalwart` ile haberleşir |

---

## 2. Merkezi Ortam Değişkenleri (`infra/.env`) ve Taşınabilirlik

### A. Tek Merkezli `.env` Sözleşmesi (`<-SOURCE_DIR->/infra/.env`)
İşletim sistemi seviyesinde (`~/.bashrc` veya `/etc/environment`) hiçbir gizli değişken tutulmaz. Tüm Docker Compose dosyaları ve Nginx `envsubst` şablonları değişkenleri yalnızca **`<-SOURCE_DIR->/infra/.env`** dosyasından okur:

| Değişken Adı | Kullanan Servis(ler) | Açıklama |
| :--- | :--- | :--- |
| **`DOMAIN`** | Gateway, Dex, Gitea, SILO, Mail | Canlı özel alan adı (ör. `alanadi.com`) |
| **`DUCKDNS_DOMAIN`** | Gateway (Opsiyonel) | Test / kapalı VPN ağı için DuckDNS alan adı |
| **`DATA_DIR`** | Tüm Compose Dosyaları, Yedekleme | Kalıcı veri kök dizini yolu (ör. `/opt/pr2data`) |
| **`CERT_ROOT`** | Gateway, TLS Yenileme | Sertifika kök dizini (`${DATA_DIR}/certs`) |
| **`DEX_GOOGLE_CLIENT_ID`** | `pr2-dex` | Google Cloud OAuth 2.0 istemci kimliği |
| **`DEX_GOOGLE_CLIENT_SECRET`** | `pr2-dex` | Google Cloud OAuth 2.0 gizli anahtarı |
| **`DEX_GITEA_CLIENT_SECRET`** | `pr2-dex`, `pr2-gitea` | Gitea ↔ Dex OIDC bağlantı gizli anahtarı |
| **`GITEA_SECRET_KEY`** | `pr2-gitea` | Gitea oturum ve şifreleme anahtarı |
| **`GITEA_INTERNAL_TOKEN`** | `pr2-gitea` | Gitea dahili API iletişim belirteci |
| **`GITEA_RUNNER_REGISTRATION_TOKEN`** | `pr2-gitea-runner` | Act Runner kayıt belirteci |
| **`MINIO_ROOT_USER`** | `pr2-silo` | PGSTY SILO kök yönetici kullanıcı adı |
| **`MINIO_ROOT_PASSWORD`** | `pr2-silo` | PGSTY SILO kök yönetici parolası |
| **`MYSQL_ROOT_PASSWORD`** | `pr2-mariadb`, Yedekleme Betiği | MariaDB `root` süper kullanıcı parolası |
| **`MYSQL_DATABASE`** | `pr2-mariadb` | Varsayılan uygulama veritabanı (`pr2_core`) |
| **`MYSQL_USER`** | `pr2-mariadb` | Uygulama katmanı veritabanı kullanıcısı (`pr2_app`) |
| **`MYSQL_PASSWORD`** | `pr2-mariadb` | Uygulama katmanı veritabanı parolası |

### B. Yeni Sunucuya Taşıma (Disaster Recovery) Adımları
Yedek arşivi (`pr2cloud_infra_and_data.tar.gz`) geri yüklendiğinde tüm servisler ek yapılandırma gerektirmeden ayağa kalkar. Yeni bir VPS'e geçişte güncellenmesi gereken **yalnızca 3 dış nokta** vardır:
1. **DNS Kayıtları:** Cloudflare üzerinde `A` kayıtlarının yeni sunucu genel IP adresine güncellenmesi.
2. **Ters DNS (PTR / rDNS):** Yeni VPS IP adresinin PTR kaydının hosting panelinden `mail.<DOMAIN>` yapılması.
3. **Yerel `/etc/hosts`:** Geliştirici bilgisayarındaki `/etc/hosts` satırına yeni sunucunun Tailscale `100.x.y.z` IP adresinin yazılması.

---

## 3. Kimlik ve Şifre Rehberi

Tüm dosya yolları `<-SOURCE_DIR->` ve `<-DATA_DIR->` kök dizinlerine göredir:

| Servis / Katman | Saklama Konumu | Anahtar / Değişken |
| :--- | :--- | :--- |
| **Sunucu SSH Erişimi** | `~/.ssh/id_ed25519` | Yönetici kullanıcısı (Parola girişi kapalı) |
| **Merkezi Altyapı Sırları** | `<-SOURCE_DIR->/infra/.env` | MariaDB, SILO, Dex ve Gitea parolaları |
| **Gitea & Dex SSO** | Google OAuth 2.0 + `infra/dex-config.yaml` | Google hesabıyla tek oturum açma (SSO) |
| **Stalwart İlk Giriş** | Konteyner Logu (`pr2-stalwart`) | İlk `admin` geçici parolası |
| **Stalwart Posta Kutuları** | `<-DATA_DIR->/stalwart` | Admin Paneli (`Management › Directory › Accounts`) |
| **SnappyMail Admin** | `<-DATA_DIR->/snappymail/_data_/_default_/admin_password.txt` | Webmail yönetici parolası |
| **DNS-01 API Anahtarları** | `<-DATA_DIR->/certs/secrets/` | `cloudflare.ini` / `duckdns.ini` |

::: details Hızlı Parola Okuma Komutları
* **Stalwart ilk geçici parolasını okuma:**
  ```bash
  docker logs pr2-stalwart 2>&1 | grep -A4 "temporary administrator"
  ```
* **SnappyMail admin parolasını okuma:**
  ```bash
  cat <-DATA_DIR->/snappymail/_data_/_default_/admin_password.txt
  ```
:::

---

## 4. Hızlı Güvenlik Kontrol Listesi

1. **Dosya İzinleri:** `<-SOURCE_DIR->/infra/.env`, `<-DATA_DIR->/certs/secrets/*.ini` ve `<-DATA_DIR->/certs/archive/*/privkey*.pem` dosyalarının yetkisiz okumalara kapalı (`600` veya `640`) olduğunu doğrulayın.
2. **Git Güvenliği:** `<-SOURCE_DIR->/infra/.env` dosyasının `.gitignore` içinde yer aldığından ve uzak Git deposuna asla gerçek parolaların gönderilmediğinden emin olun.
3. **Çevrimdışı Parola Kasası:** `infra/.env` içeriğini, `rclone.conf` dosyasını ve Stalwart/SnappyMail yönetici parolalarını çevrimdışı bir parola yöneticisinde yedekleyin.
