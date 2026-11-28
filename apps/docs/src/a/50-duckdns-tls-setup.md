---
title: "DNS ve Wildcard TLS Kurulumu"
description: "DuckDNS veya Cloudflare DNS-01 doğrulaması ile tüm alt alan adlarını kapsayan otomatik yenilenen Wildcard SSL/TLS sertifikası kurulumu."
outline:
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

## 1. Giriş ve Ortak Mimari

Her iki yöntemde de ana uygulama sistemdeki aynı **`certbot`** aracıdır; fark yalnızca DNS doğrulaması için kullanılan eklenti ve ilk üretim parametrelerindedir. Her iki seçenek de sertifikaları standart **`<-DATA_DIR->/certs/live/<-DOMAIN->/`** dizinine yerleştirir:

* **Seçenek A — DuckDNS (Özel VPN Ağı / Test):** Tailscale (`100.x.y.z`) gibi kapalı ağlarda veya ücretsiz alt alan adıyla (`projeadi.duckdns.org`) hızlı kurulum için kullanılır.
* **Seçenek B — Cloudflare (Canlı Özel Alan Adı):** Kendi alan adınız (`alanadi.com`) ve kurumsal e-posta (`MX`, `SPF`, `DKIM`, `DMARC`) kayıtlarıyla canlı yayın için kullanılır.

| Bileşen | Seçenek A: DuckDNS | Seçenek B: Cloudflare |
| :--- | :--- | :--- |
| **Ana Uygulama** | `certbot` (Sistem paketi) | `certbot` (Sistem paketi) |
| **DNS Eklentisi** | `certbot-dns-duckdns` (`pip` ile `/usr/local` altına) | `python3-certbot-dns-cloudflare` (`dnf` paketi) |
| **Doğrulama Parametresi** | `--authenticator dns-duckdns` | `--dns-cloudflare` |
| **Kimlik Dosyası** | `<-DATA_DIR->/certs/secrets/duckdns.ini` | `<-DATA_DIR->/certs/secrets/cloudflare.ini` |
| **Yayılma Süresi** | `--dns-duckdns-propagation-seconds 60` | `--dns-cloudflare-propagation-seconds 30` |

> **Önemli Not:** Certbot'un `-0001` uzantılı yedek klasör açmaması için `live/` alt klasörünü önceden elle oluşturmayın.

---

## 2. Seçenek A: DuckDNS ile Wildcard TLS

### A1. DuckDNS Kaydı ve API Belirteci
1. [duckdns.org](https://duckdns.org) adresinden oturum açın ve alan adınızı oluşturun (ör. `projeadi.duckdns.org`).
2. **Current IP** alanına sunucunuzun **Tailscale IPv4** adresini (`100.x.y.z`) yazıp **update ip** butonuna tıklayın. Herkese açık olması için VPS sabit IP adresini kullanabilirsiniz.
3. Sayfanın üst kısmındaki **Token** değerini kopyalayın.

### A2. Eklenti Kurulumu ve Sertifika Üretimi

<DynamicSnippet title="DuckDNS Parametreleri" default-open>

~~~bash
# 1. Certbot ve DuckDNS DNS eklentisini kur
sudo dnf install -y certbot python3-pip
sudo pip3 install --prefix=/usr/local certbot-dns-duckdns

# 2. Sertifika gizli anahtar ve kanca dizinlerini oluştur
mkdir -p "<-DATA_DIR->/certs"/{secrets,renewal-hooks/deploy}

# 3. DuckDNS API Token bilgisini güvenli dosyaya yaz
cat << 'EOF' > "<-DATA_DIR->/certs/secrets/duckdns.ini"
dns_duckdns_token = <-DUCKDNS_TOKEN->
EOF
chmod 600 "<-DATA_DIR->/certs/secrets/duckdns.ini"

# 4. Sertifikayı root yetkisiyle doğrudan <-DATA_DIR->/certs dizinine üret
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

# 5. Nginx ve Stalwart servislerinin erişebilmesi için standart izinleri tanımla
sudo chown -R root:2000 "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive"
sudo chmod -R 750 "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive"
~~~

</DynamicSnippet>

---

## 3. Seçenek B: Cloudflare ile Wildcard TLS (Canlı Alan Adı)

### B1. Temel DNS Kayıtları

Cloudflare panelinde **DNS › Records** bölümünden aşağıdaki temel kayıtları **DNS Only (Gri Bulut)** olarak ekleyin *(DKIM kayıtları mail sunucusu kurulumundan sonra eklenecektir)*:

| Tür | Ad (Name) | Hedef (IPv4) | Proxy Durumu |
| :--- | :--- | :--- | :--- |
| **`A`** | `@` (`<-DOMAIN->`) | `<-VPS_PUBLIC_IP->` | DNS Only (Gri Bulut) |
| **`A`** | `*` (`*.<-DOMAIN->`) | `<-VPS_PUBLIC_IP->` | DNS Only (Gri Bulut) |

<DynamicSnippet title="Cloudflare DNS Kayıt Dosyası">

~~~bind
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
;; v1-rsa._domainkey.<-DOMAIN->. 300 IN TXT "v=DKIM1; k=rsa; p=<-RSA_PUB_KEY->"
;; v1-ed25519._domainkey.<-DOMAIN->. 300 IN TXT "v=DKIM1; k=ed25519; p=<-ED25519_PUB_KEY->"
~~~

</DynamicSnippet>

::: tip Cloudflare Toplu İçe Aktarma (Import) ve Proxy Kuralı
1. **Tek Tıkla İçe Aktarma:** Yukarıdaki bloğu `dns-records.txt` dosyasına kaydedip Cloudflare panelinde **DNS › Records › Import and Export › Import DNS records** adımıyla yükleyebilirsiniz.
2. **Proxy (Turuncu Bulut) Kuralı:** Yalnızca Tailscale VPN (`allow 100.64.0.0/10;`) üzerinden erişilecek yönetim panellerinin (`db`, `s3-console`, `mail`) `403 Forbidden` hatasına düşmemesi ve SMTP/IMAPS trafiğinin kesilmemesi için tüm kayıtların **DNS Only (Gri Bulut)** olarak kaldığından emin olun.
3. **Ters DNS (PTR / rDNS):** VPS sağlayıcınızın kontrol panelinden `<-VPS_PUBLIC_IP->` adresinin **PTR** kaydını `mail.<-DOMAIN->` olarak tanımlayın.
:::

### B2. Cloudflare API Token ve Sertifika Üretimi

1. Cloudflare panelinde **My Profile › Settings › API Tokens › Create Token** yolunu açın.
2. **Edit zone DNS** şablonunda **Use template** butonuna tıklayın (`Permissions`: `Zone › DNS › Edit`, `Zone Resources`: `Include › Specific zone › <-DOMAIN->`).
3. **Continue to summary › Create Token** adımlarıyla belirteci üretip kopyalayın.

<DynamicSnippet title="Cloudflare Wildcard TLS">

~~~bash
# 1. Certbot ve Cloudflare DNS eklentisini kur
sudo dnf install -y certbot python3-certbot-dns-cloudflare

# 2. Sertifika gizli anahtar ve kanca dizinlerini oluştur
mkdir -p "<-DATA_DIR->/certs"/{secrets,renewal-hooks/deploy}

# 3. Cloudflare API Token bilgisini güvenli dosyaya yaz
cat << 'EOF' > "<-DATA_DIR->/certs/secrets/cloudflare.ini"
dns_cloudflare_api_token = <-CLOUDFLARE_API_TOKEN->
EOF
chmod 600 "<-DATA_DIR->/certs/secrets/cloudflare.ini"

# 4. Sertifikayı root yetkisiyle doğrudan <-DATA_DIR->/certs dizinine üret
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

# 5. Nginx ve Stalwart servislerinin erişebilmesi için standart izinleri tanımla
sudo chown -R root:2000 "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive"
sudo chmod -R 750 "<-DATA_DIR->/certs/live" "<-DATA_DIR->/certs/archive"
~~~

</DynamicSnippet>

---

## 4. Sonuç: Otomatik Yenileme (`pr2-renew-hook`) ve Doğrulama

Certbot, ilk sertifika üretilirken kullanılan eklenti ve parametreleri `<-DATA_DIR->/certs/renewal/<-DOMAIN->.conf` dosyasına kaydeder. Bu nedenle **hem Seçenek A (DuckDNS) hem de Seçenek B (Cloudflare)** aynı yenileme komutunu ve aynı değişken bağımsız **`pr2-renew-hook`** kancasını kullanır.

### 4.1. Yenileme Kancası ve Cron Zamanlayıcı

<DynamicSnippet title="Otomatik Yenileme ve Cron" default-open>

~~~bash
# 1. Yenileme sonrası izinleri güncelleyip Nginx ve Stalwart servislerini yenileyen kanca
cat << 'EOF' > "<-DATA_DIR->/certs/renewal-hooks/deploy/pr2-renew-hook"
#!/bin/bash
set -e

# $RENEWED_LINEAGE -> ör. /opt/pr2data/certs/live/alanadi.com
CERT_BASE="$(dirname "$(dirname "$RENEWED_LINEAGE")")"

chown -R root:2000 "${CERT_BASE}/live" "${CERT_BASE}/archive"
chmod -R 750 "${CERT_BASE}/live" "${CERT_BASE}/archive"
docker exec pr2-gateway nginx -s reload 2>/dev/null || true
docker restart pr2-stalwart 2>/dev/null || true
EOF
chmod +x "<-DATA_DIR->/certs/renewal-hooks/deploy/pr2-renew-hook"

# 2. Yenileme mekanizmasını test et (Dry-Run)
sudo certbot renew --dry-run \
  --config-dir "<-DATA_DIR->/certs" \
  --work-dir "<-DATA_DIR->/certs/work" \
  --logs-dir "<-DATA_DIR->/certs/logs"

# 3. Her ayın 1'i ve 15'inde saat 03:00'te çalışacak Cron görevini root olarak tanımla
(sudo crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 1,15 * * certbot renew --quiet --config-dir <-DATA_DIR->/certs --work-dir <-DATA_DIR->/certs/work --logs-dir <-DATA_DIR->/certs/logs >> /var/log/pr2-ssl-renew.log 2>&1") | sudo crontab -
sudo crontab -l
~~~

</DynamicSnippet>

### 4.2. Doğrulama Kontrolleri

Sertifika dosyalarının standart konumda oluştuğunu ve geçerlilik tarihini doğrulayın:

<DynamicSnippet title="Sertifika Doğrulama">

~~~bash
# 1. Sertifika ve özel anahtar dosyalarının varlığını kontrol et
ls -lh <-DATA_DIR->/certs/live/<-DOMAIN->/

# 2. Sertifika alan adlarını (SAN) ve geçerlilik süresini doğrula
openssl x509 -in <-DATA_DIR->/certs/live/<-DOMAIN->/fullchain.pem -noout -subject -ext subjectAltName -dates
~~~

</DynamicSnippet>
