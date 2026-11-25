---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "SaaS Rehberi"
outline: [2, 3]
sidebarTitle: "MariaDB Veritabanı"
index: 90
isContent: true
hidden: false
status: "published"
tags: ["Paas","Saas"]
---

# MariaDB Kurulum ve Yapılandırma Rehberi

::: info Bu rehber; **pr2cloud** canlı (VPS) ortamında **MariaDB** ilişkisel veritabanı sunucusunun dış internete kapalı olan `pr2_internal_net` üzerinde ayağa kaldırılmasını, kalıcı veri dizinlerinin bağlanmasını ve karakter seti optimizasyonlarını açıklar.
:::

## 1. Kalıcı Veri ve Yapılandırma Dizinleri

Konteyner güncellemelerinde veri kaybını önlemek için veritabanı dosyaları `data/mariadb` altına, özel yapılandırma dosyası ise `source/infra/mariadb`-`prod/mariadb` altına yerleştirilir.

```bash
# 1. MariaDB kalıcı veri dizinini oluşturun (Git dışı runtime alanı)
mkdir -p data/mariadb

# 2. MariaDB konteyner kullanıcısı (UID 999 / mysql) için sahiplik atayın
sudo chown -R 999:999 data/mariadb
sudo chmod 750 data/mariadb

# 3. Yapılandırma klasörünü oluşturun
mkdir -p source/infra/mariadb
mkdir -p prod/mariadb
```

## 2. MariaDB Yapılandırma Dosyası (`my.cnf`)

Tam Unicode (`utf8mb4`) desteği, düşük bellek tüketimi ve InnoDB disk performansı için aşağıdaki yapılandırma dosyasını oluşturun.

* **Dosya Yolu:** `source/infra/mariadb/my.cnf`

```ini
[mysqld]
# Karakter Seti ve Karşılaştırma Standartları
character-set-server    = utf8mb4
collation-server        = utf8mb4_unicode_ci
skip-character-set-client-handshake

# Ağ ve Bağlantı Limitleri
bind-address            = 0.0.0.0
max_connections         = 100
wait_timeout            = 600
interactive_timeout     = 600

# InnoDB Bellek ve Disk Optimizasyonu
innodb_buffer_pool_size = 512M
innodb_log_file_size    = 128M
innodb_flush_method     = O_DIRECT
innodb_file_per_table   = 1

# Güvenlik Sıkılaştırması
local_infile            = 0
symbolic-links          = 0

[client]
default-character-set   = utf8mb4
```

## 3. Ortam Değişkenleri (`source/infra/mariadb/.env`)

`.env` dosyasına MariaDB kimlik bilgilerini ekleyin:

```env
# --- MARIADB ---
MARIADB_ROOT_PASSWORD=guclu_ve_rastgele_root_parolasi
MARIADB_DATABASE=pr2_core
MARIADB_USER=pr2_admin
MARIADB_PASSWORD=guclu_ve_rastgele_uygulama_parolasi
```

## 4. Docker Compose Servis Tanımı 

`source/infra/mariadb/docker-compose.yml`

Mimari izolasyon kuralları gereği MariaDB host makineye port açmaz ve yalnızca `pr2_internal_net` ağına bağlanır.

```yaml
services:
  mariadb:
    image: mariadb:11.4
    container_name: pr2_mariadb
    restart: unless-stopped
    env_file:
      - .env
    environment:
      MARIADB_ROOT_PASSWORD: ${MARIADB_ROOT_PASSWORD}
      MARIADB_DATABASE: ${MARIADB_DATABASE}
      MARIADB_USER: ${MARIADB_USER}
      MARIADB_PASSWORD: ${MARIADB_PASSWORD}
    volumes:
      - ../../../data/mariadb:/var/lib/mysql
      - ./my.cnf:/etc/mysql/conf.d/custom.cnf:ro
    networks:
      - pr2_internal_net
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 15s
      timeout: 5s
      retries: 5
networks:
  pr2_internal_net:
    external: true
    
```

## 5. Başlatma ve Doğrulama

```bash
# 1. MariaDB servisini arka planda başlatın
cd source/infra/mariadb
docker compose up -d 

# 2. Sağlık durumunu kontrol edin (healthy görünmelidir)
docker ps --filter "name=pr2_mariadb"

# 3. UTF8MB4 karakter seti ayarlarını doğrulayın
docker exec -it pr2_mariadb mariadb -u root -p -e "SHOW VARIABLES LIKE 'character_set_%';"
```

### Güvenlik Kontrol Listesi
* [x] Host makinede `ss -tulpn | grep 3306` çıktısı boş dönmelidir (dış erişim kapalı).
* [x] Yalnızca `pr2_internal_net` içerisindeki API servisleri ve phpMyAdmin konteyneri erişebilmelidir.
