---
title: "PGSTY SILO (S3 Nesne Depolama) Kurulumu"
description: "πr² Cloud altyapısı için S3 API uyumlu PGSTY SILO nesne depolama sunucusu, iç ağ alias yapılandırması ve Tailscale VPN korumalı Web Konsol kurulumu."
outline:
sidebarTitle: "SILO - S3 Nesne Depolama"
index: 90
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "s3", "object-storage", "pgsty-silo", "silo", "nginx"]
---

# PGSTY SILO (S3 Nesne Depolama) Kurulumu

::: warning Lisans ve Atıf Bildirimi
**SILO**, Pigsty topluluğu tarafından sürdürülen açık kaynaklı bir **MinIO** çatalıdır (fork); MinIO Inc. ile bağlantılı veya sponsorlu değildir. Ayrıntılar için [PGSTY SILO Attribution](https://silo.pgsty.com/about/attribution/) sayfasını inceleyebilirsiniz.
:::

* **Üretici / Bakım:** PGSTY Community
* **Resmi Web Sitesi:** [silo.pgsty.com](https://silo.pgsty.com/)

::: info CONCEPT MATRICES
* **Storage Standard:** Amazon S3 Compatible Object Storage
* **Service Endpoints:** Public/SDK S3 API (`s3.${DOMAIN}:9000`) & Tailscale-Only Web Console (`s3-console.${DOMAIN}:9001`)
* **Internal Network Alias:** `http://silo:9000` (`pr2_internal_net` DNS alias)
* **Network Isolation:** Dual-NIC (`pr2_edge_net` + `pr2_internal_net`) behind Nginx Reverse Proxy
* **Access Policy:** Root/Service IAM Accounts + Tailscale IP Whitelist (`100.64.0.0/10`)
:::

## Resmi Tanım
**PGSTY SILO**, bulut-yerel (cloud-native) uygulamalar, statik varlıklar (`docs-assets`), uygulama medyaları ve sistem yedekleri için yüksek performanslı, Amazon S3 API uyumlu nesne depolama sunucusudur. `πr² Cloud` mimarisinde dış dünyaya doğrudan port açmadan Nginx arkasında konumlanır ve iç ağdaki servislere (`Stalwart`, `API` vb.) `http://silo:9000` takma adıyla hizmet verir.

## Sözlük Veritabanı (Lexical Database)

| Terim | Açıklama |
| :--- | :--- |
| **Bucket (Kova)** | Nesnelerin (dosyaların) saklandığı üst düzey mantıksal depolama alanı (Örn: `docs-assets`, `backups`). |
| **Internal Alias (`silo`)** | SILO'nun alt çizgi (`_`) içeren konteyner adlarını reddetmesini önleyen ve iç ağdaki servislerin dış DNS'e çıkmadan bağlanmasını sağlayan Docker ağ takma adı. |
| **IAM Service Account** | Root kullanıcı yerine her uygulamaya veya servise yalnızca kendi kovasına erişim yetkisi veren kısıtlı Access Key / Secret Key çifti. |
| **Presigned URL** | Özel (private) bir kova içindeki nesneye belirli bir süre boyunca doğrudan tarayıcıdan erişim izni veren imzalı geçici bağlantı. |

## Cheatsheet: Bağlantı ve Port Özeti

| Bileşen | Hedef / Adres | Erişim Politikası |
| :--- | :--- | :--- |
| **S3 API (Uygulama SDK)** | `https://s3.${DOMAIN}` → `pr2-silo:9000` | Genel HTTPS (Uygulama & İstemci Erişimi) |
| **Dahili S3 API** | `http://silo:9000` | Yalnızca `pr2_internal_net` İç Ağı |
| **Web Yönetim Konsolu** | `https://s3-console.${DOMAIN}` → `pr2-silo:9001` | Yalnızca Tailscale VPN (`100.64.0.0/10`) |

---

## 1. Veri Dizini ve Merkezi Ortam Değişkenleri (`<-SOURCE_DIR->/infra/.env`)

S3 nesnelerinin kalıcı olarak saklanacağı dizini hazırlayın ve merkezi `<-SOURCE_DIR->/infra/.env` dosyanıza SILO yönetici kimlik bilgilerini ekleyin:

<DynamicSnippet title="Dizin Oluştur" >

```bash
# 1. Kalıcı S3 veri dizinini oluştur
mkdir -p <-DATA_DIR->/silo

# 2. Güçlü bir kök parola üret
openssl rand -hex 24
```

</DynamicSnippet>

<DynamicSnippet title="SILO Ortam ve Dizin Ayarları"  default-open>

```bash
# 3. Merkezi infra/.env dosyasına SILO değişkenlerini ekle
cat << 'EOF' >> <-SOURCE_DIR->/infra/.env

# --- PGSTY SILO (S3 OBJECT STORAGE) ---
MINIO_ROOT_USER=<-SILO_ROOT_USER->
MINIO_ROOT_PASSWORD=<-SILO_ROOT_PASSWORD->
MINIO_SERVER_URL=https://s3.<-DOMAIN->
MINIO_BROWSER_REDIRECT_URL=https://s3-console.<-DOMAIN->

EOF
```

</DynamicSnippet>

---

## 2. Docker Compose Yapılandırması (`<-SOURCE_DIR->/infra/compose.silo.yml`)

SILO, gelen HTTP `Host` başlığının geçerli bir DNS adı olmasını zorunlu kılar ve içinde alt çizgi (`_`) bulunan konteyner adlarını (`pr2-silo`) `400 InvalidRequest` hatasıyla reddeder. Bunu önlemek ve iç ağdaki servislerin doğrudan `http://silo:9000` üzerinden erişebilmesini sağlamak için `pr2_internal_net` üzerinde `aliases` tanımlanır:

```yaml
name: pr2_silo
services:
  silo:
    image: pgsty/silo:latest
    container_name: pr2-silo
    restart: unless-stopped
    command: server /data --console-address ":9001"
    env_file:
      - ./.env
    volumes:
      - ${DATA_DIR}/silo:/data:z
    networks:
      pr2_edge_net:
      pr2_internal_net:
        aliases:
          - silo
          - minio
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  pr2_edge_net:
    external: true
  pr2_internal_net:
    external: true
```

Servisi arka planda başlatın:

```bash
docker compose -f compose.silo.yml up -d
```

---

## 3. Nginx Ters Proxy Şablonu (`<-SOURCE_DIR->/infra/nginx/templates/silo.conf.template`)

S3 API (`s3.${DOMAIN}`) ve WebSocket destekli Web Yönetim Konsolu (`s3-console.${DOMAIN}`) yönlendirmelerini tanımlayın. Yönetim konsolu yalnızca Tailscale VPN IP aralığına (`100.64.0.0/10`) açık tutulur:

```nginx
# 1. S3 API Uç Noktası (s3.${DOMAIN})
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name s3.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    client_max_body_size 500M;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        set $upstream http://pr2-silo:9000;
        proxy_pass $upstream;
        include /etc/nginx/snippets/proxy-headers.conf;
        proxy_set_header Host $http_host;
    }
}

# 2. SILO Web Yönetim Konsolu (s3-console.${DOMAIN} - Yalnızca Tailscale VPN)
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name s3-console.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    allow 100.64.0.0/10;
    deny all;

    client_max_body_size 500M;
    proxy_buffering off;

    location / {
        set $upstream http://pr2-silo:9001;
        proxy_pass $upstream;
        include /etc/nginx/snippets/proxy-headers.conf;
        proxy_set_header Host $http_host;
    }
}
```

Nginx konteynerini yeniden başlatarak yeni şablonu aktif edin:

```bash
docker compose -f compose.gateway.yml restart
```

::: tip Yerel Bilgisayardan VPN Yönetim Paneline Erişim (`/etc/hosts`)
Cloudflare DNS kayıtları **DNS Only (Gri Bulut)** modunda olduğu için bilgisayarınız `s3-console.${DOMAIN}` adresini sorguladığında sunucunun genel IP'sine gider ve Nginx'ten `403 Forbidden` yanıtı alır. Tailscale Exit Node kullanmıyorsanız yerel bilgisayarınızın `/etc/hosts` dosyasına Tailscale IP yönlendirmesini ekleyin:

```bash
sudo sed -i.bak '/s3-console\./d' /etc/hosts && echo "<TAILSCALE_100_IP> s3-console.<DOMAIN> db.<DOMAIN> mail.<DOMAIN>" | sudo tee -a /etc/hosts
```
:::

---

## 4. Başlangıç Kovalarının Oluşturulması ve Doğrulama

1. **Konteyner Sağlık Kontrolü:**
   ```bash
   docker ps --filter "name=pr2-silo"
   docker logs pr2-silo --tail 20
   ```
2. **Web Konsol Erişimi ve Kovalar:**
   * Tailscale VPN aktifken `https://s3-console.<-DOMAIN->` adresine gidin ve `.env` dosyasındaki `MINIO_ROOT_USER`,`MINIO_ROOT_PASSWORD` bilgileriyle oturum açın.
   * **Buckets → Create Bucket** adımından dokümantasyon varlıkları için **`docs-assets`** ve sistem yedekleri için **`backups`** kovalarını oluşturun.
3. **Dış Erişim Kısıtlama Testi:**
   * Tailscale VPN bağlantısını kapattığınızda `https://s3-console.<-DOMAIN->` adresinin **`403 Forbidden`** döndürdüğünü, `https://s3.<-DOMAIN->` API adresinin ise erişilebilir kaldığını doğrulayın.
