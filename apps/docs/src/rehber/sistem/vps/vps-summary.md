---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "SaaS Rehberi"
outline: [2, 3]
sidebarTitle: "VPS Özet"
index: 90
isContent: true
hidden: false
status: "published"
tags: ["Paas","Saas"]
---


# Sistem Özeti, Ortam Değişkenleri ve Kimlik-Şifre Rehberi

> **Ön Bilgi:** Bu doküman; `pr2cloud` canlı üretim ortamında çalışan tüm bileşenlerin büyük resmini, kullanılan ortam değişkenlerinin tam listesini, servis bazlı yönetici kimlik/parola kaynaklarını ve yedekleme/taşıma sırasındaki bağımsızlık sınırlarını tek merkezde toplar.

---

## 1. Canlı Sistem Mimari Özeti (Büyük Resim)

Canlı üretim altyapısı; tek bir **AlmaLinux 9** VPS üzerinde, dış saldırı yüzeyi en aza indirilmiş **Çift Ağ (Dual-NIC)** ve **Tailscale VPN** izolasyonuyla çalışan 7 çekirdek konteynerden oluşur:

| Katman / Servis | Konteyner Adı | İç Port / Dış Port | Ağ Konumu | Erişim Politikası ve Görevi |
| :--- | :--- | :--- | :--- | :--- |
| **Ters Vekil (Edge)** | `pr2_nginx` | `80, 443` (Host) | `pr2_edge_net` | Wildcard TLS sonlandırma ve alt alan adı yönlendirmesi |
| **Merkezi SSO (OIDC)** | `pr2_dex` | `:5556`  | `pr2_edge_net` | `https://auth.<DOMAIN>` — SQLite tabanlı OIDC kimlik sağlayıcısı |
| **İlişkisel Veritabanı** | `pr2_mariadb` | `:3306`  | `pr2_internal_net` | Dış dünyaya tamamen kapalı (`128M` InnoDB buffer) ana veritabanı |
| **DB Yönetim Paneli** | `pr2_phpmyadmin` | `:80`  | `edge` + `internal` | `https://db.<DOMAIN>` — Yalnızca Tailscale VPN (`100.64.0.0/10`) |
| **Nesne Depolama (S3)** | `pr2_minio` | `:9000` / `:9001` | `edge` + `internal` | `s3.<DOMAIN>` (API) & `s3-console.<DOMAIN>` (Yalnızca Tailscale VPN) |
| **Kurumsal E-Posta** | `pr2_stalwart` | `25, 465, 587, 993` | `edge` + `internal` | SMTP/IMAPS sunucusu; `:8080` Admin paneli yalnızca Tailscale VPN |
| **Webmail İstemcisi** | `pr2_snappymail` | `:8888`  | `edge` + `internal` | `https://webmail.<DOMAIN>` — İç ağdan `pr2_stalwart` ile haberleşir |

---

## 2. Ortam Değişkenleri (`.env`) ve Bağımsızlık Sınırları

### A. Tek Merkezli `.env` Dosyası (`/opt/pr2cloud/prod/.env`)
AlmaLinux 9 işletim sistemi seviyesinde (`~/.bashrc` veya `/etc/environment`) hiçbir gizli değişken tutulmaz. Tüm konteyner parametreleri yalnızca **`/opt/pr2cloud/prod/.env`** dosyasından okunur:

| Değişken Adı | Kullanan Servis(ler) | Açıklama ve Güvenlik Notu |
| :--- | :--- | :--- |
| **`DOMAIN`** | Genel Referans | Canlı ana alan adı (örn. `belgelerim.com.tr`) |
| **`TZ`** | Tüm Konteynerler | Sistem ve log saat dilimi (`Europe/Istanbul`) |
| **`MYSQL_ROOT_PASSWORD`** | `pr2_mariadb`, Yedekleme Betiği | MariaDB `root` süper kullanıcı parolası |
| **`MYSQL_DATABASE`** | `pr2_mariadb` | İlk kurulumda oluşturulan varsayılan veritabanı (`pr2_core`) |
| **`MYSQL_USER`** | `pr2_mariadb` | Uygulama katmanı veritabanı kullanıcısı (`pr2_app`) |
| **`MYSQL_PASSWORD`** | `pr2_mariadb` | Uygulama katmanı veritabanı parolası |
| **`MINIO_ROOT_USER`** | `pr2_minio`, Stalwart S3 | S3 nesne depolama yönetici kullanıcı adı (`pr2silo_admin`) |
| **`MINIO_ROOT_PASSWORD`** | `pr2_minio`, Stalwart S3 | S3 nesne depolama yönetici gizli anahtarı (Secret Key) |
| **`DEX_CLIENT_SECRET`** | `pr2_dex`, Uygulamalar | OIDC istemci uygulamalarının kimlik doğrulama gizli anahtarı |

### B. Yedekleme ve Yeni Sunucuya Taşıma Bağımsızlığı
* **Yedek Arşivi Tamamen Kendi Kendine Yeterlidir:** `/opt/pr2cloud/prod` (tüm yapılandırmalar + `.env`) ve `/opt/pr2cloud/data` (kalıcı veriler + TLS sertifikaları) yedeklendiğinde sistem ortam değişkenlerinden tamamen bağımsızdır.
* **Tailscale Engel Oluşturmaz:** Tailscale yalnızca yönetim erişim tünelidir; arka plan servisleri ve gece çalışacak yedekleme görevi (`cron`) VPN bağlantısından bağımsız çalışır.
* **Yeni VPS'e Geçişte Değişen Tek 3 Dış Nokta:**
  1. **Cloudflare DNS:** `A` kayıtlarının yeni VPS genel IP adresine güncellenmesi.
  2. **Hosting Paneli (PTR / rDNS):** Yeni VPS IP adresinin ters DNS kaydının `mail.<DOMAIN>` yapılması.
  3. **Certbot API Anahtarı & Yerel `/etc/hosts`:** Yeni sunucuda `/etc/letsencrypt/cloudflare.ini` dosyasının oluşturulması ve geliştirici makinesindeki `/etc/hosts` satırına yeni sunucunun Tailscale `100.x.y.z` IP'sinin yazılması.

---

## 3. Kimlik ve Şifre Rehberi (Nerede, Nasıl Okunur ve Değiştirilir?)

Sistemdeki tüm kullanıcı adları, ilk kurulum parolaları ve parola okuma/sıfırlama yöntemleri aşağıdaki tabloda özetlenmiştir:

> Tüm dosya yolları `/opt/pr2cloud/` kök dizinine göredir.

| Servis / Katman | Saklama Konumu | Anahtar / Değişken |
| :--- | :--- | :--- |
| **SSH Erişimi** | `~/.ssh/id_ed25519` | `pr2admin` (Parola kapalı) |
| **MariaDB** | `prod/.env` | `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` |
| **MinIO (SILO)** | `prod/.env` | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` |
| **Dex SSO** | `prod/dex/config.yaml` | `staticPasswords` (`bcrypt` hash) |
| **Stalwart İlk Giriş** | Konteyner Logu (`data/stalwart`) | İlk `admin` parolası |
| **Stalwart Kullanıcılar** | `data/stalwart` (Veritabanı) | Admin Paneli (`Directory > Accounts`) |
| **SnappyMail Admin** | `data/snappymail/_data_/_default_/ admin_password.txt` | Webmail yönetici parolası |
| **Cloudflare DNS-01** | `/etc/letsencrypt/cloudflare.ini` | `dns_cloudflare_api_token` |

::: details Parola Okuma ve Hash Üretme Komutları
* **Dex yeni bcrypt hash üretimi:**
  ```bash
  docker run --rm ghcr.io/dexidp/dex:latest dex hash <<< "YENI_SIFRE"
  ```
* **Stalwart ilk admin parolasını okuma:**
  ```bash
  docker logs pr2_stalwart 2>&1 | grep -i "password"
  ```
* **SnappyMail admin parolasını okuma:**
  ```bash
  cat /opt/pr2cloud/data/snappymail/_data_/_default_/admin_password.txt
  ```
:::


## 4. Hızlı Güvenlik Kontrol Listesi (Parola ve Erişim Hijyeni)

1. **Dosya İzinleri:** `/opt/pr2cloud/prod/.env`, `/etc/letsencrypt/cloudflare.ini` ve `/opt/pr2cloud/data/certs/privkey.pem` dosyalarının izinlerinin daima `600` (`-rw-------`) olduğundan emin olun.
2. **Git Güvenliği:** Eğer `/opt/pr2cloud/prod` klasörünü uzak bir Git deposuna gönderecekseniz, gerçek parolaları içeren `.env` dosyasını `.gitignore` içine ekleyip yalnızca boş şablon olarak `.env.example` dosyasını paylaşın.
3. **Merkezi Parola Kasası:** `.env` içeriğini, `root` VNC kurtarma parolasını, Stalwart `admin` parolasını ve SnappyMail `admin` parolasını çevrimdışı bir parola yöneticisinde (Bitwarden / KeePassXC) yedekleyin.

