---
title: >-
  Bilgi İşlem Merkezi Kurulum Kılavuzu: RHEL, Cloudflare, Nginx, Docker ve SSL
  Yapılandırması
description: >-
  Bu kılavuz, RHEL (Red Hat Enterprise Linux) veya RHEL tabanlı (Rocky Linux,
  AlmaLinux) bir VPS üzerinde, harici kontrol paneli kullanmadan, Cloudflare,...
outline:
  - 2
  - 3
status: published
tags:
  - dict
  - server
---
# Bilgi İşlem Merkezi Kurulum Kılavuzu: RHEL, Cloudflare, Nginx, Docker ve SSL Yapılandırması

Bu kılavuz, **RHEL (Red Hat Enterprise Linux)** veya RHEL tabanlı (Rocky Linux, AlmaLinux) bir VPS üzerinde, harici kontrol paneli kullanmadan, **Cloudflare**, **Nginx (Reverse Proxy)**, **Docker** ve **Certbot (Let's Encrypt - Wildcard SSL)** kullanarak çoklu domain ve SaaS altyapısı destekleyen profesyonel bir bilgi işlem merkezi kurma adımlarını içerir.

---

## 1. Adım: Cloudflare Üzerinden DNS Yapılandırması
Cloudflare'in ücretsiz (Free) planı, sınırsız domain için gelişmiş DNS yönetimi ve DDoS koruması sağlar.

1. **Domain Ekleme:** [Cloudflare Dashboard](https://dash.cloudflare.com/) alanına gidin, **Add a Site** butonuna tıklayın ve alan adınızı girin. Free Plan'ı seçin.
2. **Name Server Güncellemesi:** Cloudflare'in size atadığı iki adet ad sunucusunu (Örn: `dane.ns.cloudflare.com`) kopyalayın. **Hosting.com.tr** (veya domain firmanızın) paneline giderek domaininizin Name Server (NS) ayarlarını bu adreslerle değiştirin.
3. **DNS Kayıtlarının Oluşturulması:** Cloudflare DNS sekmesinde aşağıdaki temel A kayıtlarını oluşturun:
   * **Tür:** `A` | **İsim:** `@` | **Değer:** `VPS_IP_ADRESİNİZ` | **Proxy:** 🧡 *(Turuncu Bulut)*
   * **Tür:** `A` | **İsim:** `www` | **Değer:** `VPS_IP_ADRESİNİZ` | **Proxy:** 🧡 *(Turuncu Bulut)*
   * **Tür:** `A` | **İsim:** `*` (Wildcard SaaS için) | **Değer:** `VPS_IP_ADRESİNİZ` | **Proxy:** 🩶 *(Gri Bulut - Ücretsiz planda wildcard proxy desteği yoktur)*
   * **Tür:** `A` | **İsim:** `mail` | **Değer:** `VPS_IP_ADRESİNİZ` | **Proxy:** 🩶 *(Gri Bulut - Mail servisleri kesinlikle gri bulut olmalıdır)*

---

## 2. Adım: RHEL VPS Ön Hazırlıkları ve Güvenlik Ayarları
RHEL tabanlı dağıtımlarda paket depolarını aktifleştirmek, portları açmak ve SELinux'u yapılandırmak şarttır.

```bash
# 1. Depoları Aktifleştirin ve Sistemi Güncelleyin
sudo dnf install epel-release -y
sudo dnf check-update

# 2. Gerekli Temel Paketleri Kurun
sudo dnf install certbot python3-certbot-nginx python3-certbot-dns-cloudflare nginx git nano -y

# 3. RHEL Güvenlik Duvarı (Firewalld) Portlarını Açın
sudo firewall-cmd --permanent --add-service={http,https,smtp,smtp-submission,smtps,imap,imaps}
sudo firewall-cmd --permanent --add-port={4190/tcp}
sudo firewall-cmd --reload

# 4. SELinux Ters Proxy İznini Verin (En Kritik RHEL Adımı)
# Bu izin verilmezse Nginx arkadaki Docker veya web servislerine bağlanamaz ve 502 hatası verir.
sudo setsebool -P httpd_can_network_connect 1
```

---

## 3. Adım: Cloudflare API Entegrasyonu ve Wildcard SSL (Certbot)
SaaS projelerindeki wildcard (`*.siteniz.com`) yapısı için doğrulamayı otomatikleştirecek Cloudflare API Token ayarı:

1. Cloudflare Profiliniz > **API Tokens** > **Create Token** > **Create Custom Token** adımlarını izleyin.
2. `Zone` | `DNS` | `Edit` yetkisi verip `All Zones` seçerek token'ı oluşturun ve kopyalayın.
3. VPS üzerinde kimlik dosyasını oluşturun:

```bash
sudo mkdir -p /root/.secrets
sudo nano /root/.secrets/cloudflare.ini
```

İçine aşağıdaki satırı ekleyin:
```ini
dns_cloudflare_api_token = SİZİN_CLOUDFLARE_API_TOKENINIZ
```

Dosyayı kaydedip kapatın (`Ctrl+O`, `Enter`, `Ctrl+X`) ve yetkilerini kısıtlayın:
```bash
sudo chmod 600 /root/.secrets/cloudflare.ini
```

### SSL Sertifikasını Üretme:
```bash
sudo certbot certonly   --dns-cloudflare   --dns-cloudflare-credentials /root/.secrets/cloudflare.ini   -d siteniz.com   -d *.siteniz.com   --preferred-challenges dns-01   --agree-tos   -m e-posta@adresiniz.com   --no-eff-email
```
Sertifikalarınız `/etc/letsencrypt/live/siteniz.com/` altına inecektir.

---

## 4. Adım: Docker ve Docker Compose Kurulumu
Uygulamalarınızı ve mail sunucunuzu izole bir biçimde çalıştırmak için Docker motorunu kurun:

```bash
# Docker resmi deposunu ekleyin
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Docker paketlerini kurun
sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Docker'ı başlatın ve sistem açılışına ekleyin
sudo systemctl enable docker --now
```

---

## 5. Adım: Nginx Reverse Proxy ve HTTPS Yapılandırması
Hem ana sitenizi, hem dinamik SaaS subdomainlerinizi karşılayacak ve trafiği güvenli `port 443` üzerinden içerideki servislere dağıtacak Nginx yapılandırması:

`/etc/nginx/conf.d/siteniz.conf` dosyasını oluşturun:
```bash
sudo nano /etc/nginx/conf.d/siteniz.conf
```

Aşağıdaki blokları kendi domaininize göre düzenleyip yapıştırın:
```nginx
# HTTP trafiğini doğrudan HTTPS'e yönlendirir
server {
    listen 80;
    server_name siteniz.com *.siteniz.com;
    return 301 https://$host$request_uri;
}

# Güvenli HTTPS Sunucu Bloğu
server {
    listen 443 ssl http2;
    server_name siteniz.com *.siteniz.com;

    # Certbot SSL Sertifika Yolları
    ssl_certificate /etc/letsencrypt/live/siteniz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siteniz.com/privkey.pem;

    # Modern SSL Güvenlik Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    location / {
        # İstekleri arkada (Docker üzerinde) çalışan uygulamanızın portuna iletir
        proxy_pass http://localhost:3000; 
        
        # Uygulamanızın gelen subdomainleri (SaaS mantığı) okuyabilmesi için Host header'ı iletilir
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Nginx yapılandırmasını test edip servisi aktif edin:
```bash
sudo nginx -t
sudo systemctl enable nginx --now
sudo systemctl restart nginx
```

---

## 6. Adım: Süreklilik ve Otomatik SSL Yenileme
RHEL üzerindeki Certbot systemd timer mekanizmasını kontrol ederek SSL sertifikalarının ömür boyu el değmeden otomatik yenilenmesini sağlayın:

```bash
# Yenileme zamanlayıcısını aktifleştirin
sudo systemctl enable certbot-renew.timer --now

# Zamanlayıcının durumunu kontrol edin
sudo systemctl status certbot-renew.timer

# Yenileme mekanizmasını simüle ederek test edin
sudo certbot renew --dry-run
```
