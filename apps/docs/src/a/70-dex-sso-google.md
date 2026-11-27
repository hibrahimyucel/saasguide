---
title: "Dex Merkezi SSO ve Google Giriş Kurulumu"
description: "πr² Cloud altyapısı için SQLite tabanlı Dex OIDC Identity Provider, Google OAuth 2.0 SSO ve Gitea istemci entegrasyonu."
outline:
sidebarTitle: "Dex - Merkezi SSO"
index: 70
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "dex", "sso", "oidc", "oauth2", "google-auth"]
---

# Dex Merkezi SSO ve Google Giriş Kurulumu

::: info Kimlik Doğrulama
**πr² Cloud** altyapısındaki geliştirici araçları (Gitea) ve geliştirilecek tüm SaaS uygulamaları, merkezi **Dex (OIDC Identity Provider)** üzerinden tek oturum açma (SSO) ile kimlik doğrular.
:::

## 1. Google Cloud Console Yapılandırması

Kullanıcıların Google hesaplarıyla oturum açabilmesi için Google Cloud üzerinde bir OAuth 2.0 istemcisi oluşturun:

1. [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)  üzerinden projenizi seçin veya yeni bir proje oluşturun.
2. **APIs & Services → OAuth consent screen** menüsünden uygulama adını (örnek: `pr2cloud SSO`) ve yetkili alan adınızı tanımlayın.
3. **Credentials → Create Credentials → OAuth client ID** adımlarını izleyin ve uygulama türü olarak **Web application** seçin.
4. **Authorized redirect URIs** alanına Dex geri dönüş adresini ekleyin *(test ve canlı alan adlarını aynı anda kullanıyorsanız ikisini de ekleyebilirsiniz)*:

<DynamicSnippet title="Google OAuth Geri Dönüş Adresleri">

```text
https://auth.<-DOMAIN->/callback
```

</DynamicSnippet>

5. Oluşturulan **Client ID** ve **Client Secret** bilgilerini kaydedin.

---

## 2. Dizin Yetkileri ve Ortam Değişkenleri (`infra/.env`)

Dex konteyneri varsayılan olarak root olmayan bir kullanıcıyla (`UID 1001`) çalışır. SQLite veritabanı (`dex.db`) yazma hatası almamak için veri dizininin sahipliğini tanımlayın ve merkezi `infra/.env` dosyanıza Dex değişkenlerini ekleyin:


<DynamicSnippet title="Dex Ortam Değişkenleri" default-open>

```bash
# 1. SQLite veri dizini sahipliğini tanımla
sudo chown -R 1001:1001 <-DATA_DIR->/dex

# 2. Merkezi infra/.env dosyasına Dex değişkenlerini mükerrer kontrolü ile ekle
ENV_FILE="<-SOURCE_DIR->/infra/.env"
touch "$ENV_FILE"

if ! grep -q "^DEX_GITEA_CLIENT_SECRET=" "$ENV_FILE"; then
  cat << EOF >> "$ENV_FILE"

# --- DEX SSO & GOOGLE OAUTH ---
DEX_GOOGLE_CLIENT_ID=<-DEX_GOOGLE_CLIENT_ID->
DEX_GOOGLE_CLIENT_SECRET=<-DEX_GOOGLE_CLIENT_SECRET->
DEX_GITEA_CLIENT_SECRET=$(openssl rand -hex 16)
EOF
fi

```

</DynamicSnippet>

---

## 3. Dex Yapılandırma Dosyası (`infra/dex-config.yaml`)

Dex yapılandırması ortam değişkenlerini (`$DEX_GOOGLE_CLIENT_ID`, `$DEX_GITEA_CLIENT_SECRET`) doğrudan okur. Dosyayı `<-SOURCE_DIR->/infra/dex-config.yaml` konumuna kaydedin *

<DynamicSnippet title="Dex Yapılandırması" >

```bash
cat << 'EOF' > <-SOURCE_DIR->/infra/dex-config.yaml
issuer: https://auth.<-DOMAIN->

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
      redirectURI: https://auth.<-DOMAIN->/callback
      # İsteğe bağlı: Sadece belirli bir Google Workspace alan adına izin vermek için aktif edin
      # hostedDomains:
      #   - <-DOMAIN->

oauth2:
  skipApprovalScreen: true

staticClients:
  - id: gitea
    redirectURIs:
      - 'https://gitea.<-DOMAIN->/user/oauth2/dex/callback'
    name: 'Gitea'
    secret: $DEX_GITEA_CLIENT_SECRET

  # Gelecek SaaS Uygulamaları İçin Örnek Şablon:
  # - id: saas-app
  #   redirectURIs:
  #     - 'https://app.<-DOMAIN->/api/auth/callback/dex'
  #   name: 'SaaS Uygulaması'
  #   secret: $DEX_APP_CLIENT_SECRET
EOF
```

</DynamicSnippet>

---

## 4. Docker Compose Yapılandırması (`infra/compose.dex.yml`)

Dex konteyneri, dış OIDC yönlendirmeleri için `pr2_edge_net` ağına, iç servislerin token doğrulaması için `pr2_internal_net` ağına bağlanır:

```yaml
name: pr2_sso
services:
  dex:
    image: ghcr.io/dexidp/dex:v2.41.1
    container_name: pr2-dex
    restart: unless-stopped
    command: ["dex", "serve", "/etc/dex/dex-config.yaml"]
    env_file:
      - ./.env
    volumes:
      - ./dex-config.yaml:/etc/dex/dex-config.yaml:ro,z
      - ${DATA_DIR}/dex:/var/dex:z
    networks:
      - pr2_edge_net
      - pr2_internal_net

networks:
  pr2_edge_net:
    external: true
  pr2_internal_net:
    external: true
```

Servisi arka planda başlatın:

```bash
docker compose -f compose.dex.yml up -d
```

---

## 5. Nginx Ters Proxy Şablonu (`infra/nginx/templates/auth.conf.template`)

Nginx'in `envsubst` şablon motorunu kullanarak `auth.${DOMAIN}` isteklerini iç ağdaki Dex konteynerine yönlendirin:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name auth.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    location / {
        set $upstream http://pr2-dex:5556;
        proxy_pass $upstream;
        include /etc/nginx/snippets/proxy-headers.conf;
    }
}
```

> **Dinamik Upstream ve TLS:** `set $upstream http://pr2-dex:5556;` kullanımı sayesinde Dex konteyneri durdurulsa bile Nginx çökmez; `proxy-headers.conf` parçası ise OAuth oturum çerezleri için zorunlu olan `Host` ve `X-Forwarded-Proto` başlıklarını otomatik ekler.

Nginx konteynerini yeniden başlatarak şablonun `.conf` dosyasına derlenmesini sağlayın:

```bash
docker compose -f compose.gateway.yml restart
```

---

## 6. Doğrulama Kontrolleri

<DynamicSnippet title="Dex Doğrulama Parametreleri" >

```bash
# 1. Konteyner durumu ve günlük kontrolü
docker ps --filter "name=pr2-dex"
docker logs pr2-dex --tail 20

# 2. OIDC Discovery uç noktası doğrulaması
curl -s https://auth.<-DOMAIN->/.well-known/openid-configuration | grep issuer

# 3. SQLite veritabanı dosyasının oluştuğunu doğrula
ls -lh <-DATA_DIR->/dex/dex.db
```

</DynamicSnippet>
