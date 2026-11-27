---
title: "DNS ve Wildcard TLS Kurulumu"
description: "DuckDNS veya Cloudflare DNS-01 doğrulaması ile tüm alt alan adlarını kapsayan otomatik yenilenen Wildcard SSL/TLS sertifikası kurulumu."
outline: [2, 3]
sidebarTitle: "DuckDNS"
index: 54
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "tls", "ssl", "certbot", "duckdns", "cloudflare", "dns-01"]
---

# A. DuckDNS ile Wildcard TLS (Docker Certbot)

### A1. DuckDNS Kaydı ve API Belirteci
1. [duckdns.org](https://duckdns.org) adresinden oturum açın ve alan adınızı oluşturun (ör. `projeadi.duckdns.org`).
2. **Current IP** alanına sunucunuzun **Tailscale IPv4** adresini (`100.x.y.z`) yazıp **update ip** butonuna tıklayın. Herkese açık olması için VPS sabit IP adresini kullanabilirsiniz. 
3. Sayfanın üst kısmındaki **Token** değerini kopyalayın.

### A2. Kimlik Bilgisi Dosyası ve İlk Sertifika Üretimi

> **AlmaLinux SELinux Notu:** AlmaLinux üzerinde SELinux varsayılan olarak `Enforcing` modunda çalıştığı için Docker volume bağlantılarında `:z` etiketi zorunludur. Ayrıca Certbot'un `-0001` uzantılı yedek klasör açmaması için `live/` alt klasörünü önceden elle oluşturmayın.

<DynamicSnippet title="DuckDNS Parametreleri"  default-open>

```bash
# 1. Sertifika gizli anahtar ve kanca dizinlerini oluştur
mkdir -p "<-DATA_DIR->/certs"/{secrets,renewal-hooks/deploy}

# 2. DuckDNS API Token bilgisini güvenli dosyaya yaz
cat << 'EOF' > "<-DATA_DIR->/certs/secrets/duckdns.ini"
dns_duckdns_token = <-DUCKDNS_TOKEN->
EOF
chmod 600 "<-DATA_DIR->/certs/secrets/duckdns.ini"

# 3. Sertifikayı root yetkisiyle doğrudan <-DATA_DIR->/certs dizinine üret
sudo certbot certonly \
  --config-dir "<-DATA_DIR->/certs" \
  --work-dir "<-DATA_DIR->/certs/work" \
  --logs-dir "<-DATA_DIR->/certs/logs" \
  --authenticator dns-duckdns \
  --dns-duckdns-credentials "<-DATA_DIR->/certs/secrets/duckdns.ini" \
  --dns-duckdns-propagation-seconds 60 \
  --cert-name "<-DOMAIN->" \
  -d "<-DOMAIN->" \
  -d "*.<-DOMAIN->" \
  --agree-tos \
  --non-interactive \
  -m "admin@<-DOMAIN->"

# 4. Nginx ve Stalwart servislerinin erişebilmesi için standart izinleri tanımla
sudo chown -R root:2000 "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive"
sudo find "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive" -type d -exec chmod 755 {} +
sudo find "<-DATA_DIR->/certs/archive" -type f -name "*.pem" -exec chmod 644 {} +
sudo chmod 640 "<-DATA_DIR->/certs/archive/<-DOMAIN->/privkey"*.pem
```

</DynamicSnippet>


### A3. Otomatik Yenileme Betiği ve Cron Görevi

<DynamicSnippet title="DuckDNS Otomatik Yenileme" >

```bash
# 1. Yenileme sonrası çalışacak servis tetikleme betiğini oluştur
cat << 'EOF' > "<-DATA_DIR->/certs/renewal-hooks/deploy/pr2-reload.sh"
#!/bin/bash
chown -R root:2000 "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive"
find "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive" -type d -exec chmod 755 {} +
find "<-DATA_DIR->/certs/archive" -type f -name "*.pem" -exec chmod 644 {} +
chmod 640 "<-DATA_DIR->/certs/archive/"*/privkey*.pem
docker exec pr2-gateway nginx -s reload 2>/dev/null || true
docker restart pr2-stalwart 2>/dev/null || true
EOF
chmod +x "<-DATA_DIR->/certs/renewal-hooks/deploy/pr2-reload.sh"

# 2. Yenileme mekanizmasını test et (Dry-Run)
sudo certbot renew --dry-run \
  --config-dir "<-DATA_DIR->/certs" \
  --work-dir "<-DATA_DIR->/certs/work" \
  --logs-dir "<-DATA_DIR->/certs/logs"

# 3. Her ayın 1'i ve 15'inde saat 03:00'te çalışacak Cron görevini root olarak tanımla
(sudo crontab -l 2>/dev/null; echo "0 3 1,15 * * certbot renew --quiet --config-dir <-DATA_DIR->/certs --work-dir <-DATA_DIR->/certs/work --logs-dir <-DATA_DIR->/certs/logs >> /var/log/pr2-ssl-renew.log 2>&1") | sudo crontab -
sudo crontab -l
```

</DynamicSnippet>

Yenileme betiğini her ayın 1'i ve 15'inde gece 03:00'te çalışacak şekilde `crontab` görevine ekleyin:

<DynamicSnippet title="Cron Zamanlayıcı" >

```bash
(sudo crontab -l 2>/dev/null; echo "0 3 1,15 * * <-SOURCE_DIR->/infra/scripts/renew-ssl.sh >> /var/log/pr2-ssl-renew.log 2>&1") | sudo crontab -

sudo crontab -l
```

</DynamicSnippet>

## Doğrulama Kontrolleri

Hangi seçeneği kullandıysanız kullanın, sertifika dosyalarının standart konumda oluştuğunu ve son geçerlilik tarihini doğrulayın:

<DynamicSnippet title="Sertifika Doğrulama" >

```bash
# 1. Sertifika ve özel anahtar dosyalarının varlığını kontrol et
ls -lh <-DATA_DIR->/certs/live/<-DOMAIN->/

# 2. Sertifika alan adlarını (SAN) ve geçerlilik süresini doğrula
openssl x509 -in <-DATA_DIR->/certs/live/<-DOMAIN->/fullchain.pem -noout -subject -ext subjectAltName -dates
```

</DynamicSnippet>
