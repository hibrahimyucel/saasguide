---
title: "Dex Merkezi SSO ve Google Giriş Kurulumu"
description: "pr2cloud altyapısında SQLite tabanlı Dex OIDC kimlik sağlayıcısının Google OAuth 2.0 desteği ve çift ağ izolasyonu ile kurulum rehberi."
outline: [2, 3]
sidebarTitle: "Dex SSO (Google Auth)"
index: 2
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "dex", "sso", "oidc", "google-oauth", "nginx", "docker", "security"]
---

# Dex Merkezi SSO ve Google Giriş Kurulumu

::: info
**pr2cloud** ekosistemindeki tüm altyapı servisleri (Gitea, MinIO, SnappyMail) ve geliştirilen SaaS uygulamaları, merkezi **Dex (OIDC Identity Provider)** üzerinden tek oturum açma (SSO) ile kimlik doğrular.

Bu rehberde Dex servisinin **SQLite** veri tabanı, **Google OAuth 2.0** bağlayıcısı ve **çift ağ (Dual-NIC)** izolasyonu ile kurulumu anlatılmaktadır.
:::
---

## 1. Google Cloud Console Yapılandırması

Kullanıcıların Google hesaplarıyla oturum açabilmesi için Google Cloud üzerinde bir OAuth 2.0 istemcisi oluşturulmalıdır.

1. [Google Cloud Console](https://console.cloud.google.com/apis/dashboard) üzerinden projenizi seçin veya yeni bir proje oluşturun.
2. **APIs & Services → OAuth consent screen** menüsünden uygulama adını (`pr2cloud SSO`) ve yetkili alan adınızı (`<domain>`) tanımlayın.
3. **Credentials → Create Credentials → OAuth client ID** adımlarını izleyin ve uygulama türü olarak **Web application** seçin.
4. **Authorized redirect URIs** alanına Dex geri dönüş adresini ekleyin:
   ```text
   https://auth.<domain>/callback
   ```
5. Oluşturulan **Client ID** ve **Client Secret** bilgilerini kaydedin.

---

## 2. Dizin ve Dosya Hazırlığı

pr2cloud klasör standartlarına göre yapılandırma dosyası Git denetimindeki yapılandırma dizininde, SQLite veritabanı ise kalıcı `data/` dizininde tutulur.

Sunucu üzerinde gerekli klasörleri oluşturun:

```bash
mkdir -p prod/dex data/dex source/infra/dex
```

*(Not: Geliştirme ortamı için `source/infra/dex` dizinini kullanın.)*

---

## 3. Ortam Değişkenleri (`.env`)

`prod/.env` (veya `source/infra/dex/.env`) dosyanıza Dex ve istemci servislerin gizli anahtarlarını `UPPER_SNAKE_CASE` standardına uygun olarak ekleyin:

```env
# --- DEX SSO & GOOGLE OAUTH ---
DEX_ISSUER_URL=https://auth.<domain>
DEX_GOOGLE_CLIENT_ID=google-client-id-buraya
DEX_GOOGLE_CLIENT_SECRET=google-client-secret-buraya

# --- OIDC STATIC CLIENTS ---
DEX_GITEA_CLIENT_SECRET=guclu-rastgele-gitea-secret
DEX_MINIO_CLIENT_SECRET=guclu-rastgele-minio-secret
```

---

## 4. Dex Yapılandırma Dosyası (`dex-config.yaml`)

`prod/dex/dex-config.yaml` - `source/infra/dex/dex-config.yaml` dosyasını oluşturun ve aşağıdaki içeriği kendi alan adınıza göre uyarlayın:

```yaml
issuer: https://auth.<domain>

storage:
  type: sqlite3
  config:
    file: /var/dex/dex.db

web:
  http: 0.0.0.0:5556

connectors:
  - type: google
    id: google
    name: Google
    config:
      clientID: $DEX_GOOGLE_CLIENT_ID
      clientSecret: $DEX_GOOGLE_CLIENT_SECRET
      redirectURI: https://auth.<domain>/callback
      # İsteğe bağlı: Sadece belirli bir Google Workspace alan adına izin vermek için aktif edin
      # hostedDomains:
      #   - alanadi.com

oauth2:
  skipApprovalScreen: true

staticClients:
  - id: gitea
    redirectURIs:
      - 'https://gitea.<domain>/user/oauth2/dex/callback'
    name: 'Gitea'
    secret: DEX_GITEA_CLIENT_SECRET

  - id: minio
    redirectURIs:
      - 'https://minio.<domain>/oauth_callback'
    name: 'MinIO Console'
    secret: DEX_MINIO_CLIENT_SECRET
```

---

## 5. Docker Compose Yapılandırması

Dex konteyneri, dış OIDC yönlendirmeleri için `pr2_edge_net` ağına, iç servislerin (Gitea, MinIO) token doğrulaması için `pr2_internal_net` ağına bağlanır. Host makineye port açılmaz.

`prod/dex/docker-compose.yml` - `source/infra/dex/docker-compose.yml`
```yaml
services:
  dex:
    image: ghcr.io/dexidp/dex:v2.41.1
    container_name: pr2-dex-dev
    restart: unless-stopped
    command: ["dex", "serve", "/etc/dex/dex-config.yaml"]
    env_file:
      - ./.env
    volumes:
      - ./dex-config.yaml:/etc/dex/dex-config.yaml:ro
      - ../../../data/dex:/var/dex          # ../../data/dex:/var/dex  prod/dex için
    networks:
      - pr2_edge_net
      - pr2_internal_net

networks:
  pr2_edge_net:
    external: true
  pr2_internal_net:
    external: true

```

İzinler (SQLite Yazma Yetkisi): Dex konteyneri varsayılan olarak root olmayan bir kullanıcıyla (uid: 1001) çalışabilir. data/dex klasörüne SQLite dosyasını (dex.db) yazarken izin hatası almamak için klasör sahipliğini veya yazma iznini kontrol edin:

```bash
sudo chown -R 1001:1001 data/dex
```


Servisi başlatın:

```bash
docker compose up -d
```

---

## 6. Nginx Ters Proxy Yönlendirmesi

Nginx yapılandırmanızda (`prod/nginx/conf.d/auth.conf`) `auth.<domain>` adresine gelen HTTPS isteklerini Docker iç ağı üzerinden Dex konteynerine yönlendirin:

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name auth.<domain>;

    include /etc/nginx/snippets/ssl-params.conf;


    location / {
        proxy_pass http://pr2-dex:5556;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
```
> **SSL Sonlandırma ve Çerez Yönetimi:** Dex konteyneri iç ağda (`pr2_edge_net`) yalnızca HTTP (`:5556`) üzerinden dinler; SSL sonlandırma işlemi Nginx tarafından yapılır. Tarayıcıdaki `Secure` oturum çerezlerinin (cookies) ve OAuth yönlendirme adreslerinin hatasız çalışması için Nginx yapılandırmasında `Host` ve `X-Forwarded-Proto` başlıklarının tanımlı olması zorunludur.

Yapılandırmayı test edip Nginx servisini yenileyin:

```bash
docker exec pr2-nginx nginx -t && docker exec pr2-nginx nginx -s reload
```

---

## 7. Doğrulama Kontrolleri

Kurulumun hatasız tamamlandığını aşağıdaki adımlarla doğrulayın:

1. **Konteyner Durumu:**
   ```bash
   docker ps --filter "name=pr2-dex"
   docker logs pr2-dex --tail 20
   ```
2. **OIDC Discovery Uç Noktası:**
   Tarayıcıdan veya terminalden OpenID yapılandırma JSON çıktısının döndüğünü kontrol edin:
   ```bash
   curl -s https://auth.<domain>/.well-known/openid-configuration | grep issuer
   ```
3. **SQLite Dosya Oluşumu:**
   Kalıcı veri dizininde veritabanı dosyasının oluştuğunu doğrulayın:
   ```bash
   ls -lh /opt/pr2cloud/data/dex/dex.db
   ```
