---
title: "Gitea, OCI Registry ve Act Runner Kurulumu"
description: "πr² Cloud altyapısı için self-hosted Git sunucusu, dahili OCI Container Registry, Dex OIDC SSO entegrasyonu ve Gitea Act Runner CI/CD kurulumu."
outline: [2, 3]
sidebarTitle: "Gitea & Act Runner"
index: 80
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "gitea", "oci-registry", "act-runner", "ci-cd", "oidc", "sso"]
---

# Gitea, OCI Registry ve Act Runner Kurulumu

::: info Git, Registry ve CI/CD Otomasyonu
**Gitea**; **πr² Cloud** ekosisteminde kaynak kod barındırma, dahili **OCI Container Registry** (Docker imaj kayıt defteri) ve **Gitea Actions** ile CI/CD otomasyonu görevlerini üstlenir. Güvenlik politikası gereği SSH servisi kapalı tutulur; tüm işlemler Nginx üzerinden **HTTPS** ve **Dex OIDC** kimlik doğrulaması ile yürütülür.
:::

## 1. Dizin Yetkileri ve Merkezi Ortam Değişkenleri (`infra/.env`)

`rootless` Gitea ve Act Runner konteynerleri host dizinlerine `UID 1000` yetkisiyle yazar. Veri dizinlerini hazırlayıp merkezi `infra/.env` dosyanıza Gitea güvenlik anahtarlarını ekleyin:

<DynamicSnippet title="Gitea Dizin ve Ortam Ayarları" >

```bash
# 1. Gitea ve Runner veri dizinlerini oluştur ve sahipliği tanımla
mkdir -p <-DATA_DIR->/{gitea,gitea-runner}
sudo chown -R 1000:1000 <-DATA_DIR->/{gitea,gitea-runner}

# 2. GITEA_SECRET_KEY ve GITEA_INTERNAL_TOKEN için iki adet 64 karakterlik anahtar üret
openssl rand -hex 32
openssl rand -hex 32

# 3. Merkezi infra/.env dosyasına Gitea değişkenlerini ekle
cat << 'EOF' >> <-SOURCE_DIR->/infra/.env

# --- GITEA & OCI REGISTRY ---
GITEA_SECRET_KEY=<-GITEA_SECRET_KEY->
GITEA_INTERNAL_TOKEN=<-GITEA_INTERNAL_TOKEN->
EOF
```

</DynamicSnippet>

> **Not:** `DEX_GITEA_CLIENT_SECRET` değişkeni bir önceki **Dex Merkezi SSO** adımında `<-SOURCE_DIR->/infra/.env` dosyasına zaten eklendiği için burada tekrar tanımlanmaz; Compose dosyası aynı `.env` dosyasından doğrudan okur.

---

## 2. Gitea Docker Compose Yapılandırması (`<-SOURCE_DIR->/infra/compose.gitea.yml`)

Gitea konteyneri harici port açmaz; Nginx yönlendirmeleri için `pr2_edge_net`, Dex token doğrulaması ve Runner iletişimi için `pr2_internal_net` ağına bağlanır:

```yaml
name: pr2_git
services:
  gitea:
    image: gitea/gitea:latest
    container_name: pr2-gitea
    restart: unless-stopped
    env_file:
      - ./.env
    environment:
      - GITEA__database__DB_TYPE=sqlite3
      - GITEA__database__PATH=/var/lib/gitea/data/gitea.db
      - GITEA__server__DOMAIN=gitea.${DOMAIN}
      - GITEA__server__ROOT_URL=https://gitea.${DOMAIN}/
      - GITEA__server__HTTP_PORT=3000
      - GITEA__server__DISABLE_SSH=true
      - GITEA__server__START_SSH_SERVER=false
      - GITEA__service__DISABLE_REGISTRATION=true
      - GITEA__service__ALLOW_ONLY_EXTERNAL_REGISTRATION=true
      - GITEA__service__SHOW_REGISTRATION_BUTTON=false
      - GITEA__openid__ENABLE_OPENID_SIGNIN=false
      - GITEA__openid__ENABLE_OPENID_SIGNUP=false
      - GITEA__oauth2_client__ENABLE_AUTO_REGISTRATION=true
      - GITEA__oauth2_client__USERNAME=email
      - GITEA__oauth2_client__UPDATE_AVATAR=true
      - GITEA__packages__ENABLED=true
      - GITEA__actions__ENABLED=true
      - GITEA__security__INSTALL_LOCK=true
      - GITEA__security__SECRET_KEY=${GITEA_SECRET_KEY}
      - GITEA__security__INTERNAL_TOKEN=${GITEA_INTERNAL_TOKEN}
    volumes:
      - ${DATA_DIR}/gitea:/var/lib/gitea:z
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
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
docker compose -f compose.gitea.yml up -d
```

---

## 3. Nginx Ters Proxy Şablonu ve İç Ağ DNS Takma Adları

### A. Gitea Nginx Şablonu (`<-SOURCE_DIR->/infra/nginx/templates/gitea.conf.template`)
Docker imajlarını OCI Registry'ye gönderirken (`docker push`) büyük katmanlarda `413 Request Entity Too Large` hatası almamak için `client_max_body_size 0;` olarak ayarlanır:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name gitea.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    # OCI Container Registry imaj yüklemeleri için boyut sınırını kaldır
    client_max_body_size 0;

    location / {
        set $upstream http://pr2-gitea:3000;
        proxy_pass $upstream;
        include /etc/nginx/snippets/proxy-headers.conf;
    }
}
```

### B. İç Ağ Takma Adları (`<-SOURCE_DIR->/infra/compose.gateway.yml`)
İzole `pr2_internal_net` içindeki Gitea ve Act Runner konteynerlerinin dış DNS'e çıkmadan doğrudan HTTPS üzerinden `auth.${DOMAIN}` (OIDC token doğrulama) ve `gitea.${DOMAIN}` (Git klonlama & OCI Registry push) uç noktalarına ulaşabilmesi için `compose.gateway.yml` içindeki `nginx-gateway` ağ tanımını güncelleyin:

```yaml
    networks:
      pr2_edge_net:
      pr2_internal_net:
        aliases:
          - auth.${DOMAIN}
          - gitea.${DOMAIN}
```

*(Not: `compose.gateway.yml` dosyasının en altındaki `networks:` bölümüne `pr2_internal_net: { external: true }` tanımını da eklemeyi unutmayın.)*

Gateway servisini yeniden başlatarak şablonu ve ağ takma adlarını aktif edin:

```bash
docker compose -f compose.gateway.yml up -d
```

---

## 4. Yönetici Hesabı ve Dex OIDC Bağlantısı

`INSTALL_LOCK=true` ve `DISABLE_REGISTRATION=true` olarak başlatıldığı için ilk yönetici hesabı ve Dex OAuth2 sağlayıcısı Gitea CLI üzerinden tanımlanır.

### A. İlk Yönetici Hesabını Oluşturma
*(Google hesabınızdaki e-posta adresiyle aynı adresi verirseniz Dex ile giriş yaptığınızda doğrudan yönetici hesabıyla eşleşir.)*

<DynamicSnippet title="Gitea Yönetici Bilgileri">

```bash
docker exec -u 1000 pr2-gitea gitea admin user create \
  --username <-GITEA_ADMIN_USER-> \
  --password '<-GITEA_ADMIN_PASSWORD->' \
  --email '<-ADMIN_EMAIL->' \
  --admin
```

</DynamicSnippet>

### B. Dex OIDC Kimlik Sağlayıcısını Ekleme

<DynamicSnippet title="Dex OIDC Entegrasyonu">

```bash
docker exec -u 1000 pr2-gitea gitea admin auth add-oauth \
  --name "dex" \
  --provider "openidConnect" \
  --key "gitea" \
  --secret "<-DEX_GITEA_CLIENT_SECRET->" \
  --auto-discover-url "https://auth.<-DOMAIN->/.well-known/openid-configuration" \
  --scopes "openid email profile"
```

</DynamicSnippet>

---

## 5. Act Runner (CI/CD) Kurulumu (`<-SOURCE_DIR->/infra/compose.runner.yml`)

### A. Kayıt Belirteci Üretimi ve `.env` Güncellemesi
Gitea sunucusundan tek seferlik kayıt belirtecini (Registration Token) üretip merkezi `<-SOURCE_DIR->/infra/.env` dosyasına ekleyin:


```bash
# 1. Gitea CLI üzerinden runner kayıt belirtecini üret
docker exec -u 1000 pr2-gitea gitea actions generate-runner-token
```

<DynamicSnippet title="Act Runner Kayıt Parametreleri" >

```bash
# 2. Üretilen belirteci merkezi infra/.env dosyasına ekle
cat << 'EOF' >> <-SOURCE_DIR->/infra/.env

# --- GITEA ACT RUNNER (CI/CD) ---
GITEA_INSTANCE_URL=http://pr2-gitea:3000
GITEA_RUNNER_REGISTRATION_TOKEN=<-GITEA_RUNNER_REGISTRATION_TOKEN->
GITEA_RUNNER_NAME=pr2-runner
GITEA_RUNNER_LABELS=ubuntu-latest:docker://node:22-bookworm,self-hosted:host
GITEA_RUNNER_JOB_CONTAINER_NETWORK=pr2_internal_net
EOF
```

</DynamicSnippet>

### B. Runner Compose Dosyası (`<-SOURCE_DIR->/infra/compose.runner.yml`)

```yaml
name: pr2_runner
services:
  act-runner:
    image: gitea/act_runner:latest
    container_name: pr2-gitea-runner
    restart: unless-stopped
    env_file:
      - ./.env
    volumes:
      - ${DATA_DIR}/gitea-runner:/data:z
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - pr2_internal_net

networks:
  pr2_internal_net:
    external: true
```

Runner servisini başlatın:

```bash
docker compose -f compose.runner.yml up -d
```

---

## 6. Doğrulama Kontrolleri

<DynamicSnippet title="Gitea & Runner Doğrulama">

```bash
# 1. Gitea ve Act Runner konteyner günlüklerini kontrol et
docker logs pr2-gitea --tail 20
docker logs pr2-gitea-runner --tail 20

# 2. OCI Container Registry giriş testi (Gitea Settings -> Applications -> PAT ile)
docker login gitea.<-DOMAIN-> -u <-GITEA_ADMIN_USER->
```

</DynamicSnippet>

* **SSO Girişi:** Tarayıcıdan `https://gitea.<-DOMAIN->/user/login` adresine gidip **Sign in with dex** butonuyla Google oturumu açabildiğinizi doğrulayın.
* **Runner Durumu:** `https://gitea.<-DOMAIN->/-/admin/actions/runners` sayfasında `pr2-runner` düğümünün **Idle (Çevrimiçi)** olarak listelendiğini kontrol edin.
