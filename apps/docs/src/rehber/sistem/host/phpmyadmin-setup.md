---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "SaaS Rehberi"
outline: [2, 3]
sidebarTitle: "phpmyadmin Veritabanı Arayüzü"
index: 100
isContent: true
hidden: false
status: "published"
tags: ["Paas","Saas"]
---

# phpMyAdmin Kurulum ve Yapılandırma Rehberi

::: info Bu rehber; **pr2cloud** canlı (VPS) ortamında **phpMyAdmin** web arayüzünün Dual-NIC köprüsüyle (`pr2_edge_net` + `pr2_internal_net`) ayağa kaldırılmasını ve **Tailscale VPN** korumalı `db.<domain>` adresi üzerinden yayına alınmasını adım adım açıklar. Kimlik doğrulama doğrudan MariaDB kullanıcı hesapları ile sağlanır.
:::

## 1. Ortam Değişkenleri (`source/infra/phpmyadmin/.env`)


```bash
mkdir -p source/infra/phpmyadmin
```

Çerez tabanlı oturum şifrelemesi için 32 karakterlik rastgele bir Blowfish anahtarı üretin ve `.env` dosyasına ekleyin:

```bash
# 32 karakterlik rastgele hex anahtar üretimi
openssl rand -hex 16
```

```env
# --- PHPMYADMIN ---
PMA_BLOWFISH_SECRET=uretilen_32_karakterlik_hex_anahtar
```

## 2. Docker Compose Servis Tanımı (`source/infra/phpmyadmin/docker-compose.yml`)

phpMyAdmin; Nginx ters vekilinden istek alabilmek için `pr2_edge_net`, iç ağdaki MariaDB sunucusuna bağlanabilmek için `pr2_internal_net` ağlarına tanımlanır.

```yaml
services:
  phpmyadmin:
    image: phpmyadmin:5.2
    container_name: pr2_phpmyadmin
    restart: unless-stopped
    env_file:
      - .env
    environment:
      PMA_HOST: mariadb
      PMA_PORT: 3306
      PMA_ARBITRARY: 0
      PMA_BLOWFISH_SECRET: ${PMA_BLOWFISH_SECRET}
      UPLOAD_LIMIT: 64M
      MEMORY_LIMIT: 256M
      MAX_EXECUTION_TIME: 300
      PMA_ABSOLUTE_URI: https://db.pr2cloud.duckdns.org/
    networks:
      - pr2_edge_net
      - pr2_internal_net
networks:
  pr2_edge_net:
    external: true
  pr2_internal_net:
    external: true
    
```

## 3. Nginx Ters Proxy Yapılandırması (`prod/nginx/conf.d/db.conf`)

`db.<domain>` alt alan adı genel internete tamamen kapatılır; yalnızca **Tailscale (`100.64.0.0/10`)** IP aralığından gelen istekleri kabul eder.

* **Dosya Yolu:** `prod/nginx/conf.d/db.conf`

```nginx
server {
    listen 443 ssl http2;
    server_name db.pr2cloud.duckdns.org;

    include /etc/nginx/snippets/ssl-params.conf;

    # Ağ Güvenliği: Yalnızca Tailscale Mesh VPN IP Bloğu
    allow 100.64.0.0/10;
    deny all;

    # Büyük SQL yedek yüklemeleri için istek boyutu sınırı
    client_max_body_size 64M;

    location / {
        proxy_pass http://pr2_phpmyadmin:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. Başlatma ve Doğrulama

```bash
# 1. phpMyAdmin konteynerini başlatın
cd source/infra/phpmyadmin
docker compose up -d 

# 2. Nginx yapılandırmasını doğrulayın ve yeniden yükleyin
docker exec pr2_nginx nginx -t && docker exec pr2_nginx nginx -s reload
```

### Erişim ve Güvenlik Doğrulaması
* [x] Genel internet bağlantısı üzerinden `https://://alanadi.com` açılmaya çalışıldığında **403 Forbidden** yanıtı alınmalıdır.
* [x] Tailscale VPN bağlıyken `https://://alanadi.com` adresinden doğrudan phpMyAdmin giriş ekranı açılmalıdır.
* [x] MariaDB üzerinde tanımlı `pr2_admin` (veya ilgili uygulama kullanıcısı) bilgileriyle oturum açarak veritabanı erişimini doğrulayın.
