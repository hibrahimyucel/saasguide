---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "SaaS Rehberi"
outline: [2, 3]
sidebarTitle: "Certbot"
index: 40
isContent: true
hidden: false
status: "published"
tags: ["Paas","Saas"]
---


# Certbot Wildcard SSL ve Nginx Ters Proxy Yapılandırması

> **Ön Bilgi:** Bu rehber; Docker ağları, dizin izinleri ve Cloudflare DNS kayıtları tamamlandıktan sonra tüm alt alan adlarını kapsayan 90 günlük otomatik yenilenen **Wildcard TLS** sertifikasını ve **Nginx** yönlendirme kurallarını hazırlar.

---

## Adım 1: Certbot DNS-01 Wildcard SSL Üretimi ve Otomatik Yenileme

80/443 portlarını durdurmaya gerek kalmadan Cloudflare API üzerinden `<-DOMAIN->` ve `*.<-DOMAIN->` sertifikasını üretin:

<DynamicSnippet title="Cloudflare API Token & Alan Adı">

```bash
# 1. Certbot ve Cloudflare DNS eklentisini kur
sudo dnf install -y certbot python3-certbot-dns-cloudflare

# 2. Cloudflare Zone:DNS:Edit yetkili API belirtecini kaydet
sudo mkdir -p /etc/letsencrypt
sudo tee /etc/letsencrypt/cloudflare.ini > /dev/null << 'EOF'
dns_cloudflare_api_token = <-CLOUDFLARE_TOKEN->
EOF
sudo chmod 600 /etc/letsencrypt/cloudflare.ini

# 3. Wildcard SSL sertifikasını üret
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 30 \
  -d "<-DOMAIN->" \
  -d "*.<-DOMAIN->" \
  --agree-tos \
  --non-interactive \
  -m admin@<-DOMAIN->

# 4. Sertifikaları proje dizinine kopyala ve izinleri ayarla
sudo cp -L /etc/letsencrypt/live/<-DOMAIN->/fullchain.pem /opt/pr2cloud/data/certs/
sudo cp -L /etc/letsencrypt/live/<-DOMAIN->/privkey.pem /opt/pr2cloud/data/certs/
sudo chown -R pr2admin:pr2admin /opt/pr2cloud/data/certs
sudo chown pr2admin:2000 /opt/pr2cloud/data/certs/privkey.pem
sudo chmod 640 /opt/pr2cloud/data/certs/privkey.pem

# 5. Otomatik yenileme sonrası Nginx ve Stalwart'ı sıfır kesintiyle yenileyen kanca (Deploy Hook)
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/pr2-sync-certs.sh > /dev/null << 'EOF'
#!/bin/bash
cp -L /etc/letsencrypt/live/<-DOMAIN->/fullchain.pem /opt/pr2cloud/data/certs/
cp -L /etc/letsencrypt/live/<-DOMAIN->/privkey.pem /opt/pr2cloud/data/certs/
chown -R pr2admin:pr2admin /opt/pr2cloud/data/certs
chown pr2admin:2000 /opt/pr2cloud/data/certs/privkey.pem
chmod 640 /opt/pr2cloud/data/certs/privkey.pem
docker exec pr2_nginx nginx -s reload 2>/dev/null || true
docker restart pr2_stalwart 2>/dev/null || true
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/pr2-sync-certs.sh


# 6. Otomatik yenileme zamanlayıcısını aktifleştir ve test et
sudo systemctl enable --now certbot-renew.timer
sudo certbot renew --dry-run
```

</DynamicSnippet>

---

## Adım 2: Çekirdek Servisler İçin Nginx Yapılandırması (`pr2cloud.conf`)

Ana alan adı, S3 API (`s3`) ve yalnızca Tailscale VPN (`100.64.0.0/10`) üzerinden erişilebilen veritabanı/depolama yönetim panellerini (`db`, `s3-console`) tanımlayın:

<DynamicSnippet title="Çekirdek Nginx Ters Proxy">

```bash
cat << 'EOF' > /opt/pr2cloud/prod/nginx/conf.d/pr2cloud.conf
server {
    listen 80;
    server_name <-DOMAIN-> *.<-DOMAIN->;
    return 301 https://hostrequest_uri;
}

ssl_certificate /etc/nginx/certs/fullchain.pem;
ssl_certificate_key /etc/nginx/certs/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;

# 1. phpMyAdmin (db.<-DOMAIN-> - Yalnızca Tailscale VPN)
server {
    listen 443 ssl;
    http2 on;
    server_name db.<-DOMAIN->;

    allow 100.64.0.0/10;
    deny all;

    location / {
        proxy_pass http://pr2_phpmyadmin:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. MinIO / SILO S3 API (s3.<-DOMAIN->)
server {
    listen 443 ssl;
    http2 on;
    server_name s3.<-DOMAIN->;
    client_max_body_size 500M;

    location / {
        proxy_pass http://pr2_minio:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. MinIO / SILO Yönetim Konsolu (s3-console.<-DOMAIN-> - Yalnızca Tailscale VPN)
server {
    listen 443 ssl;
    http2 on;
    server_name s3-console.<-DOMAIN->;

    allow 100.64.0.0/10;
    deny all;

    location / {
        proxy_pass http://pr2_minio:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# 4. Ana Alan Adı Karşılama (<-DOMAIN->)
server {
    listen 443 ssl;
    http2 on;
    server_name <-DOMAIN-> www.<-DOMAIN->;

    location / {
        default_type text/plain;
        return 200 "Pr2 Cloud Production Edge Active\n";
    }
}
EOF
```

</DynamicSnippet>

---

## Adım 3: E-Posta Servisleri İçin Nginx Yapılandırması (`mail.conf`)

Stalwart yönetim panelini (`mail.<-DOMAIN->`) yalnızca Tailscale VPN ağına, SnappyMail webmail arayüzünü (`webmail.<-DOMAIN->`) ise genel HTTPS erişimine açan yapılandırmayı oluşturun:

<DynamicSnippet title="E-Posta Nginx Ters Proxy">

```bash
cat << 'EOF' > /opt/pr2cloud/prod/nginx/conf.d/mail.conf
# 1. Stalwart Mail Yönetim Paneli (Yalnızca Tailscale VPN)
server {
    listen 443 ssl;
    http2 on;
    server_name mail.<-DOMAIN->;

    allow 100.64.0.0/10;
    deny all;

    location = / {
        return 302 https://$host/admin;
    }

    location / {
        proxy_pass http://pr2_stalwart:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. SnappyMail Webmail Arayüzü
server {
    listen 443 ssl;
    http2 on;
    server_name webmail.<-DOMAIN->;
    client_max_body_size 50M;

    location / {
        proxy_pass http://pr2_snappymail:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

</DynamicSnippet>

---

## Doğrulama Kontrolleri

1. **Sertifika Dosyaları:** `ls -la /opt/pr2cloud/data/certs/` çıktısında `fullchain.pem` ve `privkey.pem` (`-rw-------`) dosyalarının mevcut olduğunu doğrulayın.
2. **Nginx Yapılandırma Dosyaları:** `/opt/pr2cloud/prod/nginx/conf.d/` altında `pr2cloud.conf` ve `mail.conf` dosyalarının oluştuğunu teyit edin *(bir sonraki adımda konteynerler başlatıldığında Nginx doğrudan bu dosyalarla ayağa kalkacaktır)*.
