---
title: "DNS ve Wildcard TLS Kurulumu"
description: "DuckDNS veya Cloudflare DNS-01 doğrulaması ile tüm alt alan adlarını kapsayan otomatik yenilenen Wildcard SSL/TLS sertifikası kurulumu."
outline: [2, 3]
sidebarTitle: "Cloudflare"
index: 58
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "tls", "ssl", "certbot", "duckdns", "cloudflare", "dns-01"]
---

# B. Cloudflare ile Wildcard TLS (Canlı Alan Adı)

### B1. Temel DNS Kayıtları (A Kayıtları)

Cloudflare panelinde **DNS › Records** bölümünden aşağıdaki iki `A` kaydını **DNS Only (Gri Bulut)** olarak ekleyin *(e-posta `DKIM` kayıtları ilgili mail sunucusu kurulum adımında eklenecektir)*:

| Tür | Ad (Name) | Hedef (IPv4) | Proxy Durumu |
| :--- | :--- | :--- | :--- |
| **`A`** | `@` (`<-DOMAIN->`) | `<-VPS_PUBLIC_IP->` | DNS Only (Gri Bulut) |
| **`A`** | `*` (`*.<-DOMAIN->`) | `<-VPS_PUBLIC_IP->` | DNS Only (Gri Bulut) |


<DynamicSnippet title="Cloudflare DNS Zone Oluşturucu">

```bind
;; 1. Temel Alan Adı ve Alt Alan Adı Yönlendirmeleri (A Kayıtları - DNS Only)
<-DOMAIN->. 300 IN A <-VPS_PUBLIC_IP->
*.<-DOMAIN->. 300 IN A <-VPS_PUBLIC_IP->
mail.<-DOMAIN->. 300 IN A <-VPS_PUBLIC_IP->

;; 2. Gelen E-Posta Sunucusu (MX Kaydı)
<-DOMAIN->. 300 IN MX 10 mail.<-DOMAIN->.

;; 3. Gönderici Politikası ve Raporlama (SPF & DMARC)
<-DOMAIN->. 300 IN TXT "v=spf1 a mx ip4:<-VPS_PUBLIC_IP-> ~all"
_dmarc.<-DOMAIN->. 300 IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@<-DOMAIN->; pct=100; adkim=s; aspf=s"

;; 4. Çift DKIM İmzaları (Mail Sunucu kurulumundan sonra eklenecek)
;; v1-rsa._domainkey.<-DOMAIN->. 300 IN TXT "v=DKIM1; k=rsa; p=<DKIM_RSA_PUBLIC_KEY>"
;; v1-ed25519._domainkey.<-DOMAIN->. 300 IN TXT "v=DKIM1; k=ed25519; p=<DKIM_ED25519_PUBLIC_KEY>"
```

</DynamicSnippet>

::: tip Cloudflare Toplu İçe Aktarma (Import) ve Proxy Kuralı
1. **Tek Tıkla İçe Aktarma:** Yukarıdaki bloğu sağ üstteki kopyala butonuyla alıp bilgisayarınızda `dns-records.txt` dosyasına kaydedin. Cloudflare panelinde **DNS › Records › Import and Export › Import DNS records** adımıyla dosyayı yükleyin.
2. **Proxy (Turuncu Bulut) Kuralı:** Yalnızca Tailscale VPN (`allow 100.64.0.0/10;`) üzerinden erişilecek yönetim panellerinin (`db`, `s3-console`, `mail`) `403 Forbidden` hatasına düşmemesi ve SMTP/IMAPS trafiğinin kesilmemesi için tüm kayıtların **DNS Only (Gri Bulut)** olarak kaldığından emin olun.
3. **Ters DNS (PTR / rDNS):** VPS sağlayıcınızın müşteri panelinden `<-VPS_PUBLIC_IP->` adresinin **PTR (Reverse DNS)** kaydını `mail.<-DOMAIN->` olarak tanımlayın veya destek biriminden talep edin. 
:::




### B2. Cloudflare API Token ve Wildcard Sertifika Üretimi

1. Cloudflare panelinde sağ üstten **My Profile › Settings › API Tokens › Create Token** yolunu açın.
2. **Edit zone DNS** şablonunun yanındaki **Use template** butonuna tıklayın.
3. **Permissions** alanını `Zone › DNS › Edit` olarak bırakın.
4. **Zone Resources** bölümünden `Include › Specific zone` seçeneğiyle yalnızca ilgili alan adınızı (`<-DOMAIN->`) seçin.
5. **Continue to summary › Create Token** adımlarıyla belirteci üretip kopyalayın *(tek seferlik gösterilir)*.


<DynamicSnippet title="Cloudflare Wildcard TLS" >

```bash
# Certbot ve Cloudflare DNS eklentisini kur
sudo dnf install -y certbot python3-certbot-dns-cloudflare

# 1. Sertifika gizli anahtar ve kanca dizinlerini oluştur
mkdir -p "<-DATA_DIR->/certs"/{secrets,renewal-hooks/deploy}

# 2. Cloudflare API Token bilgisini güvenli dosyaya yaz
cat << 'EOF' > "<-DATA_DIR->/certs/secrets/cloudflare.ini"
dns_cloudflare_api_token = <-CLOUDFLARE_API_TOKEN->
EOF
chmod 600 "<-DATA_DIR->/certs/secrets/cloudflare.ini"

# 3. Sertifikayı root yetkisiyle doğrudan <-DATA_DIR->/certs dizinine üret
sudo certbot certonly \
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

# 4. Nginx ve Stalwart servislerinin erişebilmesi için standart izinleri tanımla
sudo chown -R root:2000 "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive"
sudo find "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive" -type d -exec chmod 755 {} +
sudo find "<-DATA_DIR->/certs/archive" -type f -name "*.pem" -exec chmod 644 {} +
sudo chmod 640 "<-DATA_DIR->/certs/archive/<-DOMAIN->/privkey"*.pem
```
</DynamicSnippet>

### B3. Otomatik Yenileme Kancası (Deploy Hook) ve Zamanlayıcı

<DynamicSnippet title="Cloudflare Otomatik Yenileme" >

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

Otomatik yenileme kontrolünü `crontab` üzerine ekleyin:

<DynamicSnippet title="Cloudflare Cron Zamanlayıcı" >

```bash
(sudo crontab -l 2>/dev/null; echo "0 3 1,15 * * certbot renew --quiet --config-dir <-DATA_DIR->/certs --work-dir <-DATA_DIR->/certs/work --logs-dir <-DATA_DIR->/certs/logs >> /var/log/pr2-ssl-renew.log 2>&1") | sudo crontab -

sudo crontab -l

```

</DynamicSnippet>

---

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
