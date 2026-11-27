---
title: "DNS ve Wildcard TLS Kurulumu"
description: "DuckDNS veya Cloudflare DNS-01 doğrulaması ile tüm alt alan adlarını kapsayan otomatik yenilenen Wildcard SSL/TLS sertifikası kurulumu."
outline: [2, 3]
sidebarTitle: "DNS ve Wildcard TLS"
index: 50
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "tls", "ssl", "certbot", "duckdns", "cloudflare", "dns-01"]
---

# DNS ve Wildcard TLS Kurulumu

::: info DNS-01 Sertifika Mimarisi
Bu rehber; **πr² Cloud** altyapısındaki tüm servisler (`docs`, `auth`, `gitea`, `s3`, `s3-console`, `db`, `mail`, `webmail`) için tek seferde geçerli **Wildcard TLS** sertifikası üretir. Sertifika dosyalarına sistemde yalnızca **Nginx** ve **Stalwart Mail Server** doğrudan erişir; diğer tüm servisler iç ağda SSL yükü olmadan çalışır.
:::

## 1. Yöntem Seçimi (Ortam Bağımsız Tek Çıktı)

Altyapınızın kullanım senaryosuna göre aşağıdaki DNS sağlayıcılarını kullanabilirsiniz. Her iki yöntem de sertifikaları standart **`<-DATA_DIR->/certs/live/<-DOMAIN->/`** dizinine yerleştirir; bu sayede sonraki adımlardaki Nginx ve servis kurulumları ortamdan bağımsız olarak birebir aynı kalır:

* **A. DuckDNS (Özel VPN Ağı / Test):** Tailscale (`100.x.y.z`) gibi kapalı ağlarda veya ücretsiz alt alan adıyla (`projeadi.duckdns.org`) hızlı kurulum için kullanılır.
* **B. Cloudflare (Canlı Özel Alan Adı):** Kendi alan adınız (`alanadi.com`) ve kurumsal e-posta (`MX`, `SPF`, `DKIM`, `DMARC`) kayıtlarıyla canlı yayın için kullanılır.


## A. DuckDNS ile Wildcard TLS (Docker Certbot)

### A1. DuckDNS Kaydı ve API Belirteci
1. [duckdns.org](https://duckdns.org) adresinden oturum açın ve alan adınızı oluşturun (ör. `projeadi.duckdns.org`).
2. **Current IP** alanına sunucunuzun **Tailscale IPv4** adresini (`100.x.y.z`) yazıp **update ip** butonuna tıklayın. Herkese açık olması için VPS sabit IP adresini kullanabilirsiniz. 
3. Sayfanın üst kısmındaki **Token** değerini kopyalayın.

### A2. Kimlik Bilgisi Dosyası ve İlk Sertifika Üretimi

> **AlmaLinux SELinux Notu:** AlmaLinux üzerinde SELinux varsayılan olarak `Enforcing` modunda çalıştığı için Docker volume bağlantılarında `:z` etiketi zorunludur. Ayrıca Certbot'un `-0001` uzantılı yedek klasör açmaması için `live/` alt klasörünü önceden elle oluşturmayın.

<DynamicSnippet title="DuckDNS Parametreleri"  default-open>

```bash
mkdir -p <-DATA_DIR->/certs/secrets
cat << 'EOF' > <-DATA_DIR->/certs/secrets/duckdns.ini
dns_duckdns_token = <-DUCKDNS_TOKEN->
EOF
chmod 600 <-DATA_DIR->/certs/secrets/duckdns.ini

docker run --rm \
  -v "<-DATA_DIR->/certs:/etc/letsencrypt:z" \
  -v "<-DATA_DIR->/certs/secrets:/secrets:ro,z" \
  infinityofspace/certbot_dns_duckdns:latest \
  certonly \
  --non-interactive \
  --agree-tos \
  --cert-name <-DOMAIN-> \
  --authenticator dns-duckdns \
  --dns-duckdns-credentials /secrets/duckdns.ini \
  --dns-duckdns-propagation-seconds 120 \
  -d "<-DOMAIN->" \
  -d "*.<-DOMAIN->"
```

</DynamicSnippet>


### A3. Otomatik Yenileme Betiği ve Cron Görevi

<DynamicSnippet title="DuckDNS Otomatik Yenileme" >

```bash
# 1. Yenileme betiğini oluştur
mkdir -p <-SOURCE_DIR->/infra/scripts
cat << 'EOF' > <-SOURCE_DIR->/infra/scripts/renew-ssl.sh
#!/bin/bash
set -e

DRY_RUN_FLAG=""
if [ "$1" == "--dry-run" ]; then
  DRY_RUN_FLAG="--dry-run"
fi

docker run --rm \
  -v "<-DATA_DIR->/certs/:/etc/letsencrypt:z" \
  -v "<-DATA_DIR->/certs/secrets:/secrets:ro,z" \
  infinityofspace/certbot_dns_duckdns:latest \
  renew --quiet ${DRY_RUN_FLAG}

if [ -z "$DRY_RUN_FLAG" ]; then
  docker exec pr2-gateway nginx -s reload 2>/dev/null || true
  docker restart pr2-stalwart 2>/dev/null || true
fi
EOF

chmod +x <-SOURCE_DIR->/infra/scripts/renew-ssl.sh

# 2. Test simülasyonu (canlı sertifikaya dokunmadan doğrular)
<-SOURCE_DIR->/infra/scripts/renew-ssl.sh --dry-run
```

</DynamicSnippet>

Yenileme betiğini her ayın 1'i ve 15'inde gece 03:00'te çalışacak şekilde `crontab` görevine ekleyin:

<DynamicSnippet title="Cron Zamanlayıcı" >

```bash
(crontab -l 2>/dev/null; echo "0 3 1,15 * * <-SOURCE_DIR->/infra/scripts/renew-ssl.sh >> /var/log/pr2-ssl-renew.log 2>&1") | crontab -
crontab -l
```

</DynamicSnippet>


## Seçenek B: Cloudflare ile Wildcard TLS (Canlı Alan Adı)

### B1. Temel DNS Kayıtları (A Kayıtları)

Cloudflare panelinde **DNS › Records** bölümünden aşağıdaki iki `A` kaydını **DNS Only (Gri Bulut)** olarak ekleyin *(e-posta `MX`, `SPF`, `DKIM` ve `DMARC` kayıtları ilgili mail sunucusu kurulum adımında eklenecektir)*:

| Tür | Ad (Name) | Hedef (IPv4) | Proxy Durumu |
| :--- | :--- | :--- | :--- |
| **`A`** | `@` (`<-DOMAIN->`) | `<-VPS_PUBLIC_IP->` | DNS Only (Gri Bulut) |
| **`A`** | `*` (`*.<-DOMAIN->`) | `<-VPS_PUBLIC_IP->` | DNS Only (Gri Bulut) |

> **Önemli:** Tailscale VPN (`allow 100.64.0.0/10;`) kısıtlamalı yönetim panellerinin Cloudflare IP adresleri arkasında `403 Forbidden` hatası vermemesi için kayıtlar **DNS Only** modunda tutulmalıdır.

### B2. Cloudflare API Token ve Wildcard Sertifika Üretimi
Cloudflare üzerinde **My Profile › API Tokens › Create Token** adımından **Edit zone DNS** şablonuyla yalnızca ilgili alan adına yetkili bir belirteç oluşturun:

<DynamicSnippet title="Cloudflare Wildcard TLS" >

```bash
# 1. Certbot ve Cloudflare DNS eklentisini kur
sudo dnf install -y certbot python3-certbot-dns-cloudflare

# 2. Cloudflare API belirtecini güvenli biçimde kaydet
mkdir -p <-DATA_DIR->/certs/secrets
cat << 'EOF' > <-DATA_DIR->/certs/secrets/cloudflare.ini
dns_cloudflare_api_token = <-CLOUDFLARE_TOKEN->
EOF
chmod 600 <-DATA_DIR->/certs/secrets/cloudflare.ini

# 3. Sertifikayı doğrudan <-DATA_DIR->/certs dizinine üret
certbot certonly \
  --config-dir "<-DATA_DIR->/certs" \
  --work-dir "<-DATA_DIR->/certs/work" \
  --logs-dir "<-DATA_DIR->/certs/logs" \
  --dns-cloudflare \
  --dns-cloudflare-credentials "<-DATA_DIR->/certs/secrets/cloudflare.ini" \
  --dns-cloudflare-propagation-seconds 30 \
  --cert-name "<-DOMAIN->" \
  -d "<-DOMAIN->" \
  -d "*.<-DOMAIN->" \
  --agree-tos \
  --non-interactive \
  -m "admin@<-DOMAIN->"
```

</DynamicSnippet>

### B3. Otomatik Yenileme Kancası (Deploy Hook) ve Zamanlayıcı

<DynamicSnippet title="Cloudflare Otomatik Yenileme" >

```bash
# 1. Yenileme sonrası Nginx ve Stalwart servislerini sıfır kesintiyle güncelleyen kanca
mkdir -p <-DATA_DIR->/certs/renewal-hooks/deploy
cat << 'EOF' > <-DATA_DIR->/certs/renewal-hooks/deploy/pr2-reload.sh
#!/bin/bash
docker exec pr2-gateway nginx -s reload 2>/dev/null || true
docker restart pr2-stalwart 2>/dev/null || true
EOF
chmod +x <-DATA_DIR->/certs/renewal-hooks/deploy/pr2-reload.sh

# 2. Test simülasyonu
certbot renew \
  --config-dir "<-DATA_DIR->/certs" \
  --work-dir "<-DATA_DIR->/certs/work" \
  --logs-dir "<-DATA_DIR->/certs/logs" \
  --dry-run
```

</DynamicSnippet>

Otomatik yenileme kontrolünü `crontab` üzerine ekleyin:

<DynamicSnippet title="Cloudflare Cron Zamanlayıcı" >

```bash
(crontab -l 2>/dev/null; echo "0 3 1,15 * * certbot renew --quiet --config-dir <-DATA_DIR->/certs --work-dir <-DATA_DIR->/certs/work --logs-dir <-DATA_DIR->/certs/logs >> /var/log/pr2-ssl-renew.log 2>&1") | crontab -
```

</DynamicSnippet>

---

## Doğrulama Kontrolleri

Hangi seçeneği kullandıysanız kullanın, sertifika dosyalarının standart konumda oluştuğunu ve son geçerlilik tarihini doğrulayın:

<DynamicSnippet title="Sertifika Doğrulama - Cloudflare" >

```bash
# 1. Sertifika ve özel anahtar dosyalarının varlığını kontrol et
ls -lh <-DATA_DIR->/certs/live/<-DOMAIN->/

# 2. Sertifika alan adlarını (SAN) ve geçerlilik süresini doğrula
openssl x509 -in <-DATA_DIR->/certs/live/<-DOMAIN->/fullchain.pem -noout -subject -ext subjectAltName -dates
```

</DynamicSnippet>

<DynamicSnippet title="Sertifika Doğrulama - DuckDNS" >

```bash
# 1. Sertifika ve özel anahtar dosyalarının varlığını kontrol et
ls -lh <-DATA_DIR->/certs/live/<-DUCKDNS_DOMAIN->/

# 2. Sertifika alan adlarını (SAN) ve geçerlilik süresini doğrula
openssl x509 -in <-DATA_DIR->/certs/live/<-DOMAIN->/fullchain.pem -noout -subject -ext subjectAltName -dates
```

</DynamicSnippet>
