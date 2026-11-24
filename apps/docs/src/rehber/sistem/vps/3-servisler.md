---
title: "Çekirdek PaaS Servisleri: Nginx, MariaDB, phpMyAdmin ve MinIO (SILO)"
description: "pr2cloud canlı sunucu (prod) için bellek limitli Docker Compose orkestrasyonu, MariaDB bellek optimizasyonu, MinIO S3 nesne depolama ve yerel Tailscale /etc/hosts yönlendirme rehberi."
outline: [2, 3]
sidebarTitle: "Çekirdek Servisler"
index: 305
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "prod", "nginx", "mariadb", "phpmyadmin", "minio", "silo", "docker-compose"]
---

# Çekirdek PaaS Servisleri: `Nginx`, `MariaDB`, `phpMyAdmin` ve `MinIO (SILO)`

> **Ön Bilgi:** Bu rehber; Dual-NIC ağlar (`pr2_edge_net`, `pr2_internal_net`), Wildcard TLS sertifikaları ve Nginx yönlendirme dosyaları hazırlandıktan sonra temel PaaS çekirdek servislerinin canlıya alınması adımlarını içerir.

---

## Adım 1: Ortam Değişkenleri (`/opt/pr2cloud/prod/.env`)

Canlı ortam parolalarını ve alan adı parametrelerini `.env` dosyasına tanımlayın ve dosya okuma yetkisini yalnızca sahibine (`600`) kapatın:

<DynamicSnippet title="Ortam Değişkenleri (.env)">

```bash
cat << 'EOF' > /opt/pr2cloud/prod/.env
DOMAIN=<-DOMAIN->
TZ=Europe/Istanbul

# MariaDB
MYSQL_ROOT_PASSWORD=<-GUCLU_ROOT_PAROLASI->
MYSQL_DATABASE=pr2_core
MYSQL_USER=pr2_app
MYSQL_PASSWORD=<-GUCLU_APP_PAROLASI->

# MinIO (PGSTY SILO)
MINIO_ROOT_USER=pr2silo_admin
MINIO_ROOT_PASSWORD=<-GUCLU_MINIO_PAROLASI->
EOF

chmod 600 /opt/pr2cloud/prod/.env
```

</DynamicSnippet>

---

## Adım 2: MariaDB Bellek Optimizasyonu (`/opt/pr2cloud/prod/mariadb/my.cnf`)

Düşük RAM'li VPS sunucularda veritabanı bellek tüketiminin kontrolsüz büyümesini önlemek için InnoDB önbellek havuzunu sabitleyin:

```bash
cat << 'EOF' > /opt/pr2cloud/prod/mariadb/my.cnf
[mysqld]
innodb_buffer_pool_size = 128M
max_connections = 50
performance_schema = OFF
EOF
```

---

## Adım 3: Bellek Limitli `docker-compose.yml` ile Servisleri Başlatma

Her konteyner için güvenli bellek üst sınırı (`mem_limit`) tanımlanmış ana orkestrasyon dosyasını oluşturun ve çekirdek servisleri ayağa kaldırın:

```bash
cat << 'EOF' > /opt/pr2cloud/prod/docker-compose.yml
networks:
  pr2_edge_net:
    external: true
  pr2_internal_net:
    external: true

services:
  nginx:
    image: nginx:alpine
    container_name: pr2_nginx
    mem_limit: 64m
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ../data/certs:/etc/nginx/certs:ro
    networks:
      - pr2_edge_net
      - pr2_internal_net

  mariadb:
    image: mariadb:11
    container_name: pr2_mariadb
    mem_limit: 384m
    restart: unless-stopped
    env_file: .env
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    volumes:
      - ../data/mariadb:/var/lib/mysql
      - ./mariadb/my.cnf:/etc/mysql/conf.d/pr2-custom.cnf:ro
    networks:
      - pr2_internal_net
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 15s
      timeout: 5s
      retries: 5

  phpmyadmin:
    image: phpmyadmin:latest
    container_name: pr2_phpmyadmin
    mem_limit: 128m
    restart: unless-stopped
    environment:
      PMA_HOST: pr2_mariadb
      PMA_PORT: 3306
      UPLOAD_LIMIT: 128M
    networks:
      - pr2_edge_net
      - pr2_internal_net
    depends_on:
      mariadb:
        condition: service_healthy

  minio:
    image: pgsty/silo:latest
    container_name: pr2_minio
    restart: unless-stopped
    env_file: .env
    command: server /data --console-address ":9001"
    volumes:
      - ../data/minio:/data
    networks:
      pr2_edge_net:
      pr2_internal_net:
        aliases:
          - minio

EOF

cd /opt/pr2cloud/prod && docker compose up -d
```

::: info Nginx Çift Ağ (Dual-NIC) Bağlantısı
`nginx` servisinin hem `pr2_edge_net` hem de `pr2_internal_net` ağlarına dahil edilmesi sayesinde, ileride eklenecek yalnızca iç ağda çalışan API veya uygulama konteynerlerine ekstra köprü gerektirmeden doğrudan ters vekil yönlendirmesi yapılabilir.
:::

---

## Adım 4: Yerel İstemci `/etc/hosts` VPN Yönlendirmesi

• Bilgisayarınız Cloudflare DNS'e db.siteniz.com.tr adresini sorduğunda, kayıt Gray Cloud (DNS Only) olduğu için sunucunun gerçek genel IP'si (77.245.155.165) döner.

• Bilgisayarınız bu genel IP'ye normal internet bağlantınız (ev/ofis ISP'niz) üzerinden gider; Tailscale tünelini kullanmaz.

• Sunucudaki Nginx ise kaynağın 100.64.0.0/10 (Tailscale) aralığından değil, ev/ofis IP'nizden geldiğini görür ve 403 Forbidden verir.

• Sonuç: /etc/hosts dosyasına 100.107.121.48 db.siteniz.com.tr ... satırını eklemeniz gereklidir (bu satır isteği doğrudan Tailscale tünelinden geçirir).


Standart Tailscale kullanımında (Exit Node kapalıyken) yönetim panellerine (`db`, `s3-console`, `mail`) doğrudan Tailscale tünel IP'si (`<-TAILSCALE_100_IP->`) üzerinden ulaşmak için geliştirici bilgisayarınızda aşağıdaki komutu çalıştırın *(eğer Tailscale üzerinden tüm internet trafiğinizi VPS'e yönlendiren **Exit Node** özelliğini kullanıyorsanız bu adıma gerek yoktur)*:

<DynamicSnippet title="Yerel İstemci Hosts Yönlendirmesi">

```bash
# Linux / macOS Terminali (Tek komutla ekler veya günceller)
sudo sed -i.bak '/db\.<-DOMAIN->/d' /etc/hosts && echo "<-TAILSCALE_100_IP-> db.<-DOMAIN-> s3-console.<-DOMAIN-> mail.<-DOMAIN->" | sudo tee -a /etc/hosts

# Windows PowerShell (Yönetici olarak çalıştırın)
# Add-Content -Path "$env:windir\System32\drivers\etc\hosts" -Value "`n<-TAILSCALE_100_IP-> db.<-DOMAIN-> s3-console.<-DOMAIN-> mail.<-DOMAIN->"
```

</DynamicSnippet>


---

## Doğrulama Kontrolleri

1. **Konteyner Sağlığı:** `docker ps` çıktısında 4 servisin (`pr2_nginx`, `pr2_mariadb`, `pr2_phpmyadmin`, `pr2_minio`) `Up` (ve `pr2_mariadb` için `healthy`) durumda olduğunu doğrulayın.
2. **Ana Alan Adı SSL Kontrolü:** `curl -fsS https://<-DOMAIN->` komutunun `Pr2 Cloud Production Edge Active` yanıtını döndürdüğünü teyit edin.
3. **VPN Yönetim Erişimi:** Tailscale bağlantısı açıkken tarayıcıdan `https://db.<-DOMAIN->` (phpMyAdmin) ve `https://s3-console.<-DOMAIN->` (MinIO Konsol) adreslerinin SSL uyarısı olmadan açıldığını; VPN kapatıldığında ise `403 Forbidden` verdiğini doğrulayın.
