---
tarih: 2026-11-17
saat: 16:56
konu: "DuckDNS ve Let's Encrypt (DNS-01) ile Sıfır İstemci Kurulumlu Wildcard HTTPS Rehberi"
baglam: "apps/docs / Altyapı Referans Kılavuzu (Tailscale, DuckDNS, Certbot, Docker & Nginx)"
durum: "Tamamlandı"
etiketler: [altyapi, ssl, https, duckdns, lets-encrypt, certbot, tailscale, nginx, docker]
---
restart: unless-stopped

# 🔒 DuckDNS ve Certbot ile Wildcard HTTPS Kurulumu

Bu doküman; **Tailscale** özel VPN ağı (`100.x.y.z`) üzerinde çalışan servislerimize, istemci cihazlara (telefon, tablet, bilgisayar) herhangi bir kök sertifika yüklemeden doğrudan **tarayıcı onaylı (yeşil kilit) HTTPS** erişimi kazandırma adımlarını belgeler.

---

## 1. Mimari Yaklaşım ve Problem Çözümü

Yerel veya özel VPN IP adresleri dış internete kapalı olduğu için standart HTTP-01 sertifika doğrulaması başarısız olur. `mkcert` gibi yerel araçlar ise her istemci cihaza manuel sertifika tanıtmayı gerektirir.

Bu darboğazı aşmak için **DNS-01 Doğrulama (Challenge)** yöntemi kullanılır:
* **DuckDNS:** Özel Tailscale IP adresimizi (`100.84.12.45`) dış dünyadan çözümlenebilir bir alt alan adına (`pr2cloud.duckdns.org`) eşler ve API üzerinden DNS `TXT` kaydı eklemeye izin verir.
* **Certbot (Docker):** Let's Encrypt sunucularıyla konuşarak DNS `TXT` kaydını doğrular ve `*.pr2cloud.duckdns.org` için geçerli bir **Wildcard SSL** sertifikası üretir.
* **Nginx:** Üretilen sertifikaları kullanarak tüm alt alan adlarını (`docs`, `gitea`, `minio`) güvenli HTTPS üzerinden sunar.

---

## 2. DuckDNS Yapılandırması

1. [DuckDNS](https://duckdns.org) platformuna giriş yapın.
2. **Domains** bölümünden projenize özel alt alan adını oluşturun (`pr2cloud.duckdns.org`).
3. **Current IP** kutusuna sunucunuzun kalıcı Tailscale IP adresini yazın ve **update ip** butonuna tıklayın.
4. Sayfanın üst kısmında yer alan **Token** değerini kopyalayın.

---

## 3. Sertifika Dizinleri ve Güvenlik Ayarları

Monorepo kök dizininde sertifikaların ve API anahtarının saklanacağı klasör yapısını oluşturun. *(Not: Docker volume bağlama izinlerinde sorun yaşamamak için hedef `live/<domain>` klasörü önceden oluşturulmalıdır.)*

```bash
mkdir -p infra/certbot/conf/live/pr2cloud.duckdns.org infra/certbot/secrets
```

DuckDNS token bilginizi `infra/certbot/secrets/duckdns.ini` dosyasına kaydedin (Bu dosya `.gitignore` içerisinde tutulmalıdır):

```ini
dns_duckdns_token = SIZIN_DUCKDNS_TOKEN_DEGERINIZ
```

Dosya okuma izinlerini yalnızca sahibiyle sınırlandırın:

```bash
chmod 600 infra/certbot/secrets/duckdns.ini
```

---

## 4. Wildcard SSL Sertifikası Üretimi (Docker)

Sisteme ekstra paket kurmadan, izole bir Docker konteyneri aracılığıyla tek seferlik sertifika üretimini başlatın:

```bash
docker run --rm \
  -v "$(pwd)/infra/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/infra/certbot/secrets:/secrets" \
  infinityofspace/certbot_dns_duckdns:latest \
  certonly \
  --non-interactive \
  --agree-tos \
  --cert-name pr2cloud.duckdns.org \
  --authenticator dns-duckdns \
  --dns-duckdns-credentials /secrets/duckdns.ini \
  --dns-duckdns-propagation-seconds 120 \
  -d "*.pr2cloud.duckdns.org" \
  --force-renewal
```

İşlem tamamlandığında sertifikalarınız `infra/certbot/conf/live/pr2cloud.duckdns.org/` dizini altında oluşturulur.

---

## 5. Nginx Ters Vekil (Reverse Proxy) Entegrasyonu

`infra/nginx/conf.d/services.conf` dosyasını HTTP trafiğini HTTPS'e zorlayacak ve sertifikaları okuyacak şekilde güncelleyin:

```nginx
# HTTP -> HTTPS Otomatik Yönlendirme
server {
    listen 80;
    server_name *.pr2cloud.duckdns.org pr2cloud.duckdns.org;
    return 301 https://hostrequest_uri;
}

# VitePress Dokümantasyon
server {
    listen 443 ssl;
    server_name docs.pr2cloud.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/pr2cloud.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pr2cloud.duckdns.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Gitea Git Sunucusu
server {
    listen 443 ssl;
    server_name gitea.pr2cloud.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/pr2cloud.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pr2cloud.duckdns.org/privkey.pem;

    client_max_body_size 512M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# MinIO Yönetim Konsolu
server {
    listen 443 ssl;
    server_name minio.pr2cloud.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/pr2cloud.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pr2cloud.duckdns.org/privkey.pem;

    client_max_body_size 1G;

    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 6. Güvenlik (`.gitignore`) ve Doğrulama

Sertifika özel anahtarlarının (`privkey.pem`) ve DuckDNS token dosyasının Git deposuna gönderilmemesi için kök `.gitignore` dosyanıza şu satırları ekleyin:

```gitignore
# SSL Sertifikaları ve DNS Gizli Anahtarları
infra/certbot/conf/
infra/certbot/secrets/
```

Tailscale ağına bağlı herhangi bir cihazdan aşağıdaki adreslere giderek sertifika uyarısı almadan bağlantıyı doğrulayın:

| Servis | Yeni HTTPS Erişim Adresi | Hedef İç Port |
| :--- | :--- | :--- |
| **VitePress Docs** | `https://duckdns.org` | `:4173` |
| **Gitea** | `https://duckdns.org` | `:3000` |
| **MinIO Konsol** | `https://duckdns.org` | `:9001` |


## 6. Otomatik Sertifika Yenileme ve Test (Cron & İzole Betik)

Arka planda sürekli çalışan bir Certbot konteyneri tutmak yerine, sistem kaynaklarını temiz tutmak için tek seferlik (`--rm`) çalışan bir yenileme betiği ve zamanlanmış görev (Cron) kullanılır.

### A. Yenileme Betiği (`infra/scripts/renew-ssl.sh`)
Aşağıdaki içeriğe sahip betiği oluşturun ve çalıştırma izni (`chmod +x`) verin:

```bash
#!/bin/bash

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE}")/../.." && pwd)"

DRY_RUN_FLAG=""
if [ "$1" == "--dry-run" ]; then
  DRY_RUN_FLAG="--dry-run"
fi

docker run --rm \
  -v "${PROJECT_ROOT}/infra/certbot/conf:/etc/letsencrypt" \
  -v "${PROJECT_ROOT}/infra/certbot/secrets:/secrets" \
  infinityofspace/certbot_dns_duckdns:latest \
  renew --quiet ${DRY_RUN_FLAG}

if [ $? -eq 0 ] && [ -z "$DRY_RUN_FLAG" ]; then
  docker exec pr2_dev_proxy nginx -s reload
fi
```


```bash
chmod +x infra/scripts/renew-ssl.sh
```

### B. Test Doğrulaması (`--dry-run`)
Cron görevini aktif etmeden önce mevcut canlı sertifikalarınıza dokunmadan Let's Encrypt test (staging) sunucuları üzerinden uçtan uca yenileme simülasyonu yapın:

```bash
./infra/scripts/renew-ssl.sh --dry-run
```
*(Not: Komut hiçbir hata mesajı vermeden tamamlanıyorsa DNS API bağlantınız ve dosya izinleriniz sorunsuz çalışıyor demektir.)*

### C. Zamanlanmış Görev (Cron) Tanımlama
`crontab -e` komutu ile aşağıdaki görevi sisteme ekleyerek her ayın 1'i ve 15'inde gece 03:00'te otomatik kontrol yapılmasını sağlayın:

```cron
0 3 1,15 * * /proje/tam/yolu/infra/scripts/renew-ssl.sh >> /var/log/pr2-ssl-renew.log 2>&1
```
