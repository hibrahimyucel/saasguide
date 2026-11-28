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

## Kontrol

<DynamicSnippet title="Sistem Kontrolü" >

```bash
sudo tee /usr/local/bin/pr2-health > /dev/null << 'EOF'
#!/usr/bin/env bash
set -uo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "[HATA] Bu betik TLS sertifikalarını okuyabilmek için sudo ile çalıştırılmalıdır: sudo pr2-health"
  exit 1
fi

ENV_FILE="<-SOURCE_DIR->/infra/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[HATA] Yapılandırma dosyası bulunamadı: $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a
DOMAIN="${1:-${DOMAIN:-}}"

echo "=== πr² CLOUD SAĞLIK KONTROLÜ (${DOMAIN}) ==="

echo -e "\n--- 1. Sistem & Ağ İzolasyonu ---"
TS_IP=$(tailscale ip -4 2>/dev/null || true)
[[ -n "$TS_IP" ]] && echo "[OK] Tailscale VPN aktif ($TS_IP)" || echo "[HATA] Tailscale VPN kapalı"
systemctl is-active --quiet firewalld && echo "[OK] firewalld aktif" || echo "[HATA] firewalld pasif"

SELINUX_MODE=$(getenforce 2>/dev/null || echo "Yok")
if [[ "$SELINUX_MODE" == "Enforcing" ]]; then
  echo "[OK] SELinux: Enforcing"
else
  echo "[UYARI] SELinux: $SELINUX_MODE (Kurulum sonrası Enforcing önerilir)"
fi

for net in pr2_edge_net pr2_internal_net; do
  docker network inspect "$net" >/dev/null 2>&1 && echo "[OK] Docker ağı mevcut: $net" || echo "[HATA] Docker ağı eksik: $net"
done

echo -e "\n--- 2. TLS Sertifikası ---"
CERT_PATH="<-DATA_DIR->/certs/live/${DOMAIN}/fullchain.pem"
if [[ -f "$CERT_PATH" ]]; then
  EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
  echo "[OK] Sertifika geçerli (Bitiş: $EXPIRY)"
else
  echo "[HATA] Sertifika bulunamadı: $CERT_PATH"
fi

echo -e "\n--- 3. Konteyner Durumları ---"
CONTAINERS=(pr2-gateway pr2-dex pr2-gitea pr2-gitea-runner pr2-silo pr2-mariadb pr2-phpmyadmin pr2-stalwart pr2-snappymail)
for c in "${CONTAINERS[@]}"; do
  STATE=$(docker inspect -f '{{.State.Status}}' "$c" 2>/dev/null || echo "yok")
  HEALTH=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$c" 2>/dev/null || echo "none")
  if [[ "$STATE" == "running" ]] && [[ "$HEALTH" == "healthy" || "$HEALTH" == "none" ]]; then
    echo "[OK] $c ($STATE / health:$HEALTH)"
  else
    echo "[HATA] $c ($STATE / health:$HEALTH)"
  fi
done

echo -e "\n--- 4. HTTP/OIDC & VPN Kısıtlama Testleri ---"
curl -sIf --resolve "auth.${DOMAIN}:443:127.0.0.1" "https://auth.${DOMAIN}/.well-known/openid-configuration" >/dev/null && \
  echo "[OK] Dex OIDC Discovery yanıt veriyor" || echo "[HATA] Dex OIDC Discovery erişilemiyor"

for sub in db s3-console mail; do
  CODE=$(curl -sk -o /dev/null -w "%{http_code}" --resolve "${sub}.${DOMAIN}:443:127.0.0.1" "https://${sub}.${DOMAIN}" 2>/dev/null || echo "000")
  [[ "$CODE" == "403" ]] && echo "[OK] ${sub}.${DOMAIN} dış erişime kapalı (403 Forbidden)" || echo "[UYARI] ${sub}.${DOMAIN} beklenmeyen durum kodu: $CODE (403 beklenir)"
done

echo -e "\n--- 5. Dosya İzinleri ---"
PERM=$(stat -c "%a" "$ENV_FILE" 2>/dev/null || echo "yok")
[[ "$PERM" == "600" ]] && echo "[OK] infra/.env izni 600" || echo "[UYARI] infra/.env izni: $PERM (600 önerilir)"
EOF
sudo chmod +x /usr/local/bin/pr2-health

```

</DynamicSnippet>


### Neleri Denetler?

1. Sistem & Ağ: tailscaled, firewalld, SELinux durumunu ve pr2_edge_net / pr2_internal_net sanal ağlarının varlığını doğrular.
2. Sertifika: <-DATA_DIR->/certs/live/<-DOMAIN->/fullchain.pem dosyasının varlığını ve son kullanma tarihini basar.
3. Konteynerler: Tüm 9 konteynerin çalışır (running) ve varsa healthcheck durumlarının sağlıklı (healthy) olduğunu kontrol eder.
4. Güvenlik Sınırları: auth OIDC uç noktasının yanıt verdiğini, yerel loopback (127.0.0.1) üzerinden istek atıldığında ise db, s3-console ve mail yönetim panellerinin dış IP'lere gerçekten 403 Forbidden döndürdüğünü doğrular.