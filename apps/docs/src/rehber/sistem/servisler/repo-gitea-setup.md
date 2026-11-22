---
title: "Gitea - OCI Registry"
description: "pr2cloud altyapısında SSH kapalı, SQLite tabanlı Gitea Git sunucusu, dahili OCI Container Registry ve Dex OIDC entegrasyon rehberi."
outline: [2, 3]
sidebarTitle: "Gitea & OCI Registry"
index: 30
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "gitea", "oci-registry", "cicd", "sso", "oidc", "dex", "docker"]
---

# Gitea, OCI Registry ve Dex SSO Kurulumu

**Gitea**; **pr2cloud** ekosisteminde kaynak kod barındırma, **Gitea Actions** ile CI/CD otomasyonu ve dahili **OCI Container Registry** (Docker imaj kayıt defteri) görevlerini üstlenir.

Güvenlik ve sıfır ekstra port politikası gereği bu kurulumda **SSH servisi devre dışı bırakılır** (`DISABLE_SSH=true`); tüm Git ve Docker Registry işlemleri Nginx üzerinden **HTTPS** protokolü ve **Dex OIDC** kimlik doğrulaması ile yürütülür.

---

## 1. Dizin Hazırlığı

Yapılandırma dosyaları ilgili ortamın `gitea/` dizininde, Git depoları ve konteyner imaj katmanları ise kök dizindeki kalıcı `data/gitea/` klasöründe tutulur.

```bash
# Geliştirme (Dev) ortamı için:
mkdir -p source/infra/gitea
mkdir -p data/gitea

# Canlı (Prod) ortamı için:
mkdir -p prod/gitea
```

---

## 2. Ortam Değişkenleri (`.env`)

İlgili ortamın `.env` dosyasına (`source/infra/gitea/.env` veya `prod/gitea/.env`) Gitea parametrelerini ekleyin. (`DEX_GITEA_CLIENT_SECRET` değeri Dex yapılandırmasındaki ile birebir aynı olmalıdır.)

```env
# --- GITEA & OCI REGISTRY ---
GITEA_DOMAIN=gitea.<domain>
GITEA_ROOT_URL=https://gitea.<domain>/
GITEA_SECRET_KEY=guclu-rastgele-secret-key-uretin
GITEA_INTERNAL_TOKEN=guclu-rastgele-internal-token-uretin
GITEA__packages__ENABLED=true
DEX_GITEA_CLIENT_SECRET=dex-tarafinda-tanimlanan-secret

```

*(İpucu: Rastgele anahtar üretmek için terminalde `openssl rand -hex 32` komutunu kullanabilirsiniz.)*

---

## 3. Docker Compose Yapılandırması (`docker-compose.yml`)

Gitea konteyneri harici SSH portu açmaz. Nginx yönlendirmeleri için `pr2_edge_net`, Dex OIDC token doğrulaması ve runner iletişimi için `pr2_internal_net` ağına bağlanır.

### Geliştirme Ortamı (`source/infra/gitea/docker-compose.yml`)

```yaml
name: pr2_git
services:
  gitea:
    image: gitea/gitea:latest
    container_name: pr2-gitea-dev
    restart: unless-stopped
    env_file:
      - ./.env
    environment:
      - GITEA__database__DB_TYPE=sqlite3
      - GITEA__database__PATH=/var/lib/gitea/data/gitea.db
      - GITEA__server__DOMAIN=${GITEA_DOMAIN}
      - GITEA__server__ROOT_URL=${GITEA_ROOT_URL}
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
      - ../../../data/gitea:/var/lib/gitea
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

*(Not: Canlı ortam için `prod/gitea/docker-compose.yml` dosyasında `container_name: pr2-gitea` ve volume yolunu `../../data/gitea:/var/lib/gitea` olarak ayarlayın.)*

> **Mimari Not (`rootless` İmaj ve İzinler):** `rootless` Gitea imajı konteyner içinde `UID 1000` ile çalışır. Başlatmadan önce host dizin sahipliğini ayarlayın:
> ```bash
> sudo chown -R 1000:1000 data/gitea
> ```

Servisi başlatın:

```bash
docker compose up -d
```

---

## 4. Nginx Ters Proxy Yönlendirmesi

Docker imajlarını OCI Registry'ye gönderirken (`docker push`) büyük katman boyutlarında `413 Request Entity Too Large` hatası almamak için `client_max_body_size` limiti kaldırılır (`0`).

`gateway/conf.d/gitea.conf` (veya `prod/nginx/conf.d/gitea.conf`) dosyasını oluşturun:

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name gitea.<domain>;

    include /etc/nginx/snippets/ssl-params.conf;

    # OCI Container Registry imaj yüklemeleri için boyut sınırını kaldır
    client_max_body_size 0;

    location / {
        proxy_pass http://pr2-gitea-dev:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_http_version 1.1;
    }
}
```

*(Canlı ortamda `proxy_pass http://pr2-gitea:3000;` kullanın.)*

Nginx yapılandırmasını doğrulayın ve yenileyin:

```bash
docker exec pr2-gateway nginx -t && docker exec pr2-gateway nginx -s reload
```

---

## 5. Yönetici Hesabı ve Dex OIDC Bağlantısı

`INSTALL_LOCK=true` ve `DISABLE_REGISTRATION=true` olarak başlatıldığı için ilk yönetici hesabı ve Dex OAuth2 sağlayıcısı Gitea CLI üzerinden tek seferlik komutlarla tanımlanır.

### A. İlk Yönetici Hesabını Oluşturma
*(Google hesabınızdaki e-posta adresiyle aynı e-postayı verirseniz Dex üzerinden giriş yaptığınızda doğrudan yönetici hesabıyla eşleşir.)*

```bash
docker exec -u 1000 pr2-gitea-dev gitea admin user create \
  --username admin \
  --password 'GeciciGucluParola123!' \
  --email 'sizin-google-adresiniz@gmail.com' \
  --admin
```

### B. Dex OIDC Kimlik Sağlayıcısını Ekleme

```bash
docker exec -u 1000 pr2-gitea-dev gitea admin auth add-oauth \
  --name "dex" \
  --provider "openidConnect" \
  --key "gitea" \
  --secret "DEX_GITEA_CLIENT_SECRET_DEGERINIZ" \
  --auto-discover-url "https://auth.<domain>/.well-known/openid-configuration" \
  --scopes "openid email profile"
```

---

## 6. Doğrulama Kontrolleri

1. **Web Arayüzü ve Google ile Giriş:**
   Tarayıcıdan `https://gitea.<domain>/user/login` adresine gidin. **Sign in with dex** butonuna tıkladığınızda Google giriş ekranına yönlendirilip oturum açabildiğinizi doğrulayın.
2. **SSH Kapalı Kontrolü:**
   Herhangi bir depo sayfasında yalnızca **HTTPS** klonlama adresinin göründüğünü, SSH sekmesinin kapalı olduğunu kontrol edin.
3. **OCI Container Registry Testi:**
   Gitea kullanıcı ayarlarından (**Settings → Applications → Generate New Token**) `write:package` yetkili bir Personal Access Token (PAT) oluşturup yerel makineden giriş yapın:
   ```bash
   docker login gitea.<domain> -u admin
   ```
