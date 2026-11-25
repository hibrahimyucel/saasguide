---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "SaaS Rehberi"
outline: [2, 3]
sidebarTitle: "SILO - S3 Nesne Depolama"
index: 60
isContent: true
hidden: false
status: "published"
tags: ["Paas","Saas"]
---


# pgsty/silo S3 Kurulum ve Dex SSO Bağlantı Rehberi


::: warning
SILO is a MinIO fork maintained by the Pigsty community. It is not affiliated with, endorsed by, or sponsored by MinIO, Inc. “MinIO” is a trademark of MinIO, Inc., used here only to identify the upstream project. See [Attribution](https://silo.pgsty.com/about/attribution/) for source and licensing details.
:::


* **Üretici / Bakım:** pgsty
* **Resmi Web Sitesi:** [https://silo.pgsty.com](https://silo.pgsty.com)

::: info CONCEPT MATRICES
* **Storage Standard:** Amazon S3 Compatible Object Storage
* **Service Endpoints:** S3 API (`s3.<domain>:9000`) & Web Console (`minio.<domain>:9001`)
* **Authentication Flow:** OpenID Connect (OIDC) Authorization Code Flow via existing Dex IdP (`https://auth.<domain>`)
* **Network Boundary:** `pr2_internal_net` (Isolated) behind Nginx Reverse Proxy
* **Authorization Model:** Built-in IAM Policy Attachment (`consoleAdmin`)
:::

## Resmi Tanım
**MinIO**, bulut-yerel (cloud-native) uygulamalar, statik varlıklar (`docs-assets`) ve sistem yedekleri için yüksek performanslı S3 uyumlu nesne depolama sunucusudur. `pr2cloud` mimarisinde dış ağa doğrudan port açmadan `pr2_internal_net` üzerinde çalışır ve kimlik doğrulamasını mevcut **Dex OIDC** sunucusuna devreder.

## Sözlük Veritabanı (Lexical Database)

| Terim | Açıklama |
| :--- | :--- |
| **Bucket (Kova)** | Nesnelerin (dosyaların) saklandığı üst düzey mantıksal konteyner (Örn: `docs-assets`). |
| **Callback URI (`/oauth_callback`)** | Dex doğrulaması tamamlandıktan sonra yetkilendirme kodunun MinIO Web Konsoluna döndüğü uç nokta. |
| **Discovery URL** | MinIO'nun mevcut Dex sunucusunun OIDC ayarlarını ve açık anahtarlarını (JWKS) okuduğu `/.well-known/openid-configuration` yolu. |
| **IAM Policy (`consoleAdmin`)** | OIDC ile giriş yapan kullanıcıya konsol ve bucket yönetimi yetkisi veren yerleşik MinIO güvenlik politikası. |

## Cheatsheet: Bağlantı ve Port Özeti

| Bileşen | Hedef / Değer | Not |
| :--- | :--- | :--- |
| **S3 API Endpoint** | `https://s3.<domain>` -> `pr2_minio:9000` | Uygulama SDK bağlantıları için |
| **Web Console** | `https://minio.<domain>` -> `pr2_minio:9001` | Nginx üzerinde WebSocket açık olmalı |
| **Dex Client ID** | `minio-console` | Mevcut Dex `staticClients` kaydı için |
| **Dex Redirect URI** | `https://minio.<domain>/oauth_callback` | Tam eşleşme gerektirir |

---

## Uygulama Adımları (`source/infra/minio`)

### 1. Kalıcı Veri Dizininin Oluşturulması
Konteyner yeniden başlatıldığında veya güncellendiğinde verilerin korunması için `data/minio` dizinini oluşturun:

```bash
mkdir -p data/minio
```

### 2. Mevcut Dex Yapılandırmasına MinIO İstemcisinin Eklenmesi
Çalışan Dex sunucunuzun `config.yaml` dosyasındaki `staticClients` listesine yalnızca MinIO istemci kaydını ekleyip Dex'i yeniden başlatın:

```yaml
staticClients:
  # ... mevcut diğer istemcileriniz ...
  - id: minio-console
    redirectURIs:
      - 'https://minio.<domain>/oauth_callback'
    name: 'MinIO S3 Console'
    secretEnv: 'minio-oidc-gizli-anahtar-2026'
```

### 3. Ortam Değişkenleri (`source/infra/minio/.env`)
`UPPER_SNAKE_CASE` standardına uygun olarak `.env` dosyasına MinIO ve Dex OIDC bağlantı parametrelerini ekleyin:

```env
# --- MINIO S3 & OIDC SSO ---
MINIO_ROOT_USER=pr2admin
MINIO_ROOT_PASSWORD=minio-kok-parola-2026
MINIO_SERVER_URL=https://s3.<domain>
MINIO_BROWSER_REDIRECT_URL=https://minio.<domain>

MINIO_IDENTITY_OPENID_CONFIG_URL=https://auth.<domain>/.well-known/openid-configuration
MINIO_IDENTITY_OPENID_CLIENT_ID=minio-console
MINIO_IDENTITY_OPENID_CLIENT_SECRET=minio-oidc-gizli-anahtar-2026
MINIO_IDENTITY_OPENID_SCOPES=openid,profile,email
MINIO_IDENTITY_OPENID_REDIRECT_URI=https://minio.<domain>/oauth_callback
MINIO_IDENTITY_OPENID_DISPLAY_NAME="pr2cloud SSO ile Giriş Yap"
MINIO_IDENTITY_OPENID_CLAIM_NAME=email
```

### 4. Docker Compose Servis Tanımı (`source/infra/minio/docker-compose.yml`)
MinIO servisini `pr2_internal_net` ağına ekleyin. MinIO konteynerinin iç ağdan `https://auth.<domain>` adresine ulaşıp OIDC keşfi yapabilmesi için `extra_hosts` tanımını ekleyin:

```yaml
services:
  minio:
    image: pgsty/silo:latest
    container_name: pr2_minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    env_file:
      - .env
    volumes:
      - ../../../data/minio:/data
    networks:
      - pr2_internal_net
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

### 5. Nginx Ters Vekil Yapılandırması (`source/infra/gateway/minio.conf`)
S3 API (`s3.<domain>`) ve WebSocket destekli Web Konsol (`minio.<domain>`) yönlendirmelerini ekleyin:

```nginx
# --- 1. MINIO S3 API (s3.<domain>) ---
server {
    listen 443 ssl http2;
    server_name s3.pr2cloud.duckdns.org;

    include /etc/nginx/snippets/ssl-params.conf;

    client_max_body_size 500M;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_pass http://pr2_minio:9000;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}

# --- 2. MINIO WEB KONSOL (minio.<domain>) ---
server {
    listen 443 ssl http2;
    server_name minio.pr2cloud.duckdns.org;

    include /etc/nginx/snippets/ssl-params.conf;

    client_max_body_size 500M;
    proxy_buffering off;

    location / {
        proxy_pass http://pr2_minio:9001;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 6. Başlatma, SSO Girişi ve Yetki Atama
1. **MinIO'yu Başlatma ve Nginx'i Yenileme:**
   ```bash
   docker compose up -d minio
   docker compose exec nginx nginx -s reload
   ```
2. **SSO ile İlk Oturum Açma:**
   * Tarayıcıdan `https://minio.<domain>` adresine gidin.
   * **"pr2cloud SSO ile Giriş Yap"** butonuna tıklayıp mevcut Dex hesabınızla giriş yapın.
3. **Kullanıcıya Yönetici Yetkisi (`consoleAdmin`) Tanımlama:**

::: details Minio içinde hesap oluşturmuşsanız.
   İlk girişte oluşan OIDC kullanıcı kimliğine (`sub`) konsol yetkisi atayın:
   ```bash
   docker exec -it pr2_minio mc alias set local http://localhost:9000 pr2admin <MINIO_ROOT_PASSWORD>
   docker exec -it pr2_minio mc admin user list local
   docker exec -it pr2_minio mc admin policy attach local consoleAdmin --user <OIDC_SUB_ID>
   ```
:::

 1. Yerel alias tanımlayın (henüz tanımlı değilse; <MINIO_ROOT_PASSWORD> yerine .env içindeki şifrenizi yazın)

```bash
    docker exec -it pr2_minio mc alias set local http://localhost:9000 pr2admin <MINIO_ROOT_PASSWORD>
```

 2. consoleAdmin yetkisini e-posta adresiniz adına oluşturun

```bash
docker exec -i pr2_minio mc admin policy create local "example@gmail.com" /dev/stdin << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["admin:*"],
      "Resource": ["arn:aws:s3:::*"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:*"],
      "Resource": ["arn:aws:s3:::*"]
    }
  ]
}
EOF

```



4. **Doğrulama:** Tarayıcıda `https://minio.<domain>` sayfasını yenileyin, yönetici menülerinin açıldığını kontrol edin ve VitePress varlıkları için **`docs-assets`** bucket'ını oluşturun.
