---
title: "DuckDNS ve Wildcard HTTPS Kurulumu"
description: "Tailscale VPN ağı üzerindeki yerel ve hibrit servisler için DuckDNS ve Certbot DNS-01 ile Wildcard SSL sertifikası kurulumu."
outline: [2, 3]
sidebarTitle: "DuckDNS HTTPS Kurulumu"
index: 30
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "duckdns", "certbot", "wildcard-ssl", "https"]
---


# DuckDNS ve Certbot ile Wildcard HTTPS Kurulumu

::: info DNS-01 Doğrulama
Bu doküman; **Tailscale** özel VPN ağı (`100.x.y.z`) üzerinde çalışan servislerimize, istemci cihazlara (telefon, tablet, bilgisayar) herhangi bir kök sertifika yüklemeden doğrudan **tarayıcı onaylı (yeşil kilit) HTTPS** erişimi kazandırma adımlarını belgeler.
:::

## 1. Mimari Yaklaşım ve Problem Çözümü

Yerel veya özel VPN IP adresleri dış internete kapalı olduğu için standart HTTP-01 sertifika doğrulaması başarısız olur. `mkcert` gibi yerel araçlar ise her istemci cihaza manuel sertifika tanıtmayı gerektirir.

Bu darboğazı aşmak için **DNS-01 Doğrulama (Challenge)** yöntemi kullanılır:
* **DuckDNS:** Özel Tailscale IP adresimizi (`100.84.12.45`) dış dünyadan çözümlenebilir bir alt alan adına (`pr2cloud.duckdns.org`) eşler ve API üzerinden DNS `TXT` kaydı eklemeye izin verir.
* **Certbot (Docker):** Let's Encrypt sunucularıyla konuşarak DNS `TXT` kaydını doğrular ve `*.pr2cloud.duckdns.org` için geçerli bir **Wildcard SSL** sertifikası üretir.
* **Nginx:** Üretilen sertifikaları kullanarak tüm alt alan adlarını (`docs`, `git`, `dashboard`) güvenli HTTPS üzerinden sunar, kök alan adını (`pr2cloud.duckdns.org`) ise karşılama ve yönlendirme sayfası olarak açık tutar.

---

## 2. DuckDNS Yapılandırması

1. DuckDNS platformuna [duckdns.org](https://duckdns.org) giriş yapın.
2. **Domains** bölümünden projenize özel alt alan adını oluşturun (`pr2cloud.duckdns.org`).
3. **Current IP** kutusuna sunucunuzun kalıcı Tailscale IP adresini yazın ve **update ip** butonuna tıklayın.
4. Sayfanın üst kısmında yer alan **Token** değerini kopyalayın.

---

## 3. Sertifika Dizinleri ve Güvenlik Ayarları

> "Yerel geliştirme (source) ortamında sertifikalar geliştirme deposu altındaki infra/certbot/ dizininde izole tutulur." 

Sertifika özel anahtarlarının (`privkey.pem`) ve DuckDNS token dosyasının Git deposuna gönderilmemesi için kök `.gitignore` dosyanıza şu satırları ekleyin:


```gitignore
# SSL Sertifikaları ve DNS Gizli Anahtarları
infra/certbot/conf/
infra/certbot/secrets/
```

Proje kök dizininde sertifikaların ve API anahtarının saklanacağı klasör yapısını oluşturun. *(Not: Certbot'un isim çakışması yaşayıp `-0001` uzantılı klasör açmaması için `live/<domain>` alt klasörü önceden oluşturulmamalıdır.)*

```bash
mkdir -p infra/certbot/conf infra/certbot/secrets
```

DuckDNS token bilginizi `infra/certbot/secrets/duckdns.ini` dosyasına kaydedin:

```ini
dns_duckdns_token = SIZIN_DUCKDNS_TOKEN_DEGERINIZ
```

Dosya okuma izinlerini yalnızca sahibiyle sınırlandırın:

```bash
chmod 600 infra/certbot/secrets/duckdns.ini
```

---

## 4. Wildcard SSL Sertifikası Üretimi (Docker & AlmaLinux)

Sisteme ekstra paket kurmadan, izole bir Docker konteyneri aracılığıyla tek seferlik sertifika üretimini başlatın:

> **⚠️ AlmaLinux / RHEL SELinux Notu:** AlmaLinux sistemlerde SELinux varsayılan olarak aktif (`Enforcing`) olduğu için Docker konteynerinin host dizinine domain klasörü açabilmesi adına volume yollarının sonuna `:z` (paylaşımlı konteyner etiketi) eklenmelidir.

<DynamicSnippet title="DuckDNS Alan Adınız" >

```bash
docker run --rm \
  -v "$(pwd)/infra/certbot/conf:/etc/letsencrypt:z" \
  -v "$(pwd)/infra/certbot/secrets:/secrets:ro,z" \
  infinityofspace/certbot_dns_duckdns:latest \
  certonly \
  --non-interactive \
  --agree-tos \
  --cert-name <-DUCKDNS_DOMAIN-> \
  --authenticator dns-duckdns \
  --dns-duckdns-credentials /secrets/duckdns.ini \
  --dns-duckdns-propagation-seconds 120 \
  -d "*.<-DUCKDNS_DOMAIN->" \
```

</DynamicSnippet>

İşlem tamamlandığında sertifikalarınız `infra/certbot/conf/live/<-DUCKDNS_DOMAIN->/` dizini altında oluşturulur.


## 5. Otomatik Sertifika Yenileme ve Test (Cron & İzole Betik)

Arka planda sürekli çalışan bir Certbot konteyneri tutmak yerine, sistem kaynaklarını temiz tutmak için tek seferlik (`--rm`) çalışan bir yenileme betiği ve zamanlanmış görev (Cron) kullanılır.

### A. Yenileme Betiği (`infra/scripts/renew-ssl.sh`)
```bash
#!/bin/bash

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

DRY_RUN_FLAG=""
if [ "$1" == "--dry-run" ]; then
  DRY_RUN_FLAG="--dry-run"
fi

docker run --rm \
  -v "${PROJECT_ROOT}/infra/certbot/conf:/etc/letsencrypt:z" \
  -v "${PROJECT_ROOT}/infra/certbot/secrets:/secrets:ro,z" \
  infinityofspace/certbot_dns_duckdns:latest \
  renew --quiet ${DRY_RUN_FLAG}

if [ $? -eq 0 ] && [ -z "$DRY_RUN_FLAG" ]; then
  docker exec pr2-gateway nginx -s reload
fi
```

Çalıştırma izni verin:

```bash
chmod +x infra/scripts/renew-ssl.sh
```

### B. Test Doğrulaması (`--dry-run`)

Cron görevini aktif etmeden önce mevcut canlı sertifikalarınıza dokunmadan Let's Encrypt test (staging) sunucuları üzerinden uçtan uca yenileme simülasyonu yapın *(DNS yayılması için 120 saniye bekler)*:

```bash
./infra/scripts/renew-ssl.sh --dry-run
```

### C. Zamanlanmış Görev (Cron) Tanımlama

`crontab -e` komutu ile aşağıdaki görevi sisteme ekleyerek her ayın 1'i ve 15'inde gece 03:00'te otomatik kontrol yapılmasını sağlayın:

```bash
sudo crontab -e
```

• `i ` tuşu ile ekleme moduna geç.
• görev satırını ekleyin.

```bash
0 3 1,15 * * /proje/tam/yolu/infra/scripts/renew-ssl.sh >> /var/log/pr2-ssl-renew.log 2>&1
```

• `Esc `, `:wq ` yaz ve `Enter` tuşu ile kapat.

• görev listesini kontrol et.

```bash
sudo crontab -l
```

