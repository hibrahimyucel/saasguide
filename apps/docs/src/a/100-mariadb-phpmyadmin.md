---
title: "MariaDB ve phpMyAdmin Kurulumu"
description: "πr² Cloud altyapısı için bellek optimizasyonlu MariaDB 11 ilişkisel veritabanı sunucusu ve Tailscale VPN korumalı phpMyAdmin kurulumu."
outline:
sidebarTitle: "MariaDB & phpMyAdmin"
index: 100
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "mariadb", "mysql", "phpmyadmin", "database", "docker"]
---

# MariaDB ve phpMyAdmin Kurulumu

::: info İlişkisel Veritabanı Katmanı
**MariaDB 11**; **πr² Cloud** ekosistemindeki tüm SaaS uygulamaları için düşük bellek tüketimli, yüksek performanslı ilişkisel veritabanı katmanını sağlar. Veritabanı sunucusu dış internete tamamen kapalı olan `pr2_internal_net` ağında izole edilir; yönetim arayüzü (**phpMyAdmin**) ise yalnızca Tailscale VPN üzerinden erişime açılır.
:::

## 1. Dizin İzinleri ve Merkezi Ortam Değişkenleri (`infra/.env`)

MariaDB resmi konteyneri veri dosyalarına `UID 999` (`mysql` kullanıcısı) yetkisiyle yazar. Dizin sahipliğini ayarlayıp merkezi `infra/.env` dosyanıza veritabanı kimlik bilgilerini ekleyin:

<DynamicSnippet title="MariaDB Ortam ve Dizin Ayarları" >

```bash
# 1. MariaDB veri dizini sahipliğini tanımla (UID 999)
mkdir -p <-DATA_DIR->/mariadb
sudo chown -R 999:999 <-DATA_DIR->/mariadb
sudo chmod 750 <-DATA_DIR->/mariadb

# 2. Root ve uygulama kullanıcısı için iki adet güçlü parola üret
openssl rand -hex 20
openssl rand -hex 20

# 3. Merkezi infra/.env dosyasına MariaDB değişkenlerini ekle
cat << 'EOF' >> <-SOURCE_DIR->/infra/.env

# --- MARIADB DATABASE ---
MYSQL_ROOT_PASSWORD=<-MYSQL_ROOT_PASSWORD->
MYSQL_DATABASE=pr2_core
MYSQL_USER=pr2_app
MYSQL_PASSWORD=<-MYSQL_APP_PASSWORD->
EOF
```

</DynamicSnippet>

---

## 2. Bellek Optimizasyon Yapılandırması (`infra/mariadb-custom.cnf`)

VPS sunucularda veritabanı RAM tüketiminin kontrolsüz büyümesini önlemek için InnoDB önbellek havuzunu ve bağlantı sınırlarını optimize eden özel yapılandırma dosyasını oluşturun:

<DynamicSnippet title="MariaDB Bellek Yapılandırması" >

```bash
cat << 'EOF' > <-SOURCE_DIR->/infra/mariadb-custom.cnf
[mysqld]
innodb_buffer_pool_size = 128M
max_connections = 50
performance_schema = OFF
EOF
```

</DynamicSnippet>

---

## 3. Docker Compose Yapılandırması (`infra/compose.db.yml`)

`pr2-mariadb` yalnızca `pr2_internal_net` üzerinde çalışır; `pr2-phpmyadmin` ise Nginx üzerinden erişilebilmesi için `pr2_edge_net` ve veritabanına bağlanabilmesi için `pr2_internal_net` ağlarına atanır:

```yaml
name: pr2_db
services:
  mariadb:
    image: mariadb:11
    container_name: pr2-mariadb
    mem_limit: 384m
    restart: unless-stopped
    env_file:
      - ./.env
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    volumes:
      - ${DATA_DIR}/mariadb:/var/lib/mysql:z
      - ./mariadb-custom.cnf:/etc/mysql/conf.d/pr2-custom.cnf:ro,z
    networks:
      pr2_internal_net:
        aliases:
          - mariadb
          - db
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 15s
      timeout: 5s
      retries: 5

  phpmyadmin:
    image: phpmyadmin:latest
    container_name: pr2-phpmyadmin
    mem_limit: 128m
    restart: unless-stopped
    environment:
      PMA_HOST: pr2-mariadb
      PMA_PORT: 3306
      UPLOAD_LIMIT: 128M
    networks:
      - pr2_edge_net
      - pr2_internal_net
    depends_on:
      mariadb:
        condition: service_healthy

networks:
  pr2_edge_net:
    external: true
  pr2_internal_net:
    external: true
```

Servisleri arka planda başlatın:

```bash
docker compose -f compose.db.yml up -d
```

---

## 4. Nginx Ters Proxy Şablonu (`infra/nginx/templates/db.conf.template`)

phpMyAdmin arayüzünü (`db.${DOMAIN}`) yalnızca Tailscale VPN IP aralığına (`100.64.0.0/10`) açan şablonu oluşturun:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name db.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    allow 100.64.0.0/10;
    deny all;

    client_max_body_size 128M;

    location / {
        set $upstream http://pr2-phpmyadmin:80;
        proxy_pass $upstream;
        include /etc/nginx/snippets/proxy-headers.conf;
    }
}
```

Nginx konteynerini yeniden başlatarak şablonu aktif edin:

```bash
docker compose -f compose.gateway.yml restart
```

---

## 5. Doğrulama Kontrolleri

1. **Konteyner Sağlık Durumu:**
   ```bash
   docker ps --filter "name=pr2-mariadb" --filter "name=pr2-phpmyadmin"
   ```
   *(Çıktıda `pr2-mariadb` durumunun `Up (healthy)` göründüğünü doğrulayın.)*
2. **phpMyAdmin VPN Erişimi:**
   * Tailscale VPN açıkken tarayıcıdan `https://db.<-DOMAIN->` adresine gidip `.env` içindeki `pr2_app` veya `root` kullanıcısıyla giriş yapabildiğinizi doğrulayın.
   * VPN kapatıldığında sayfanın **`403 Forbidden`** döndürdüğünü kontrol edin.
