---
tarih: 2026-11-12
saat: 02:41
konu: "Geliştirici Ağı Yapılandırma Rehberi: nip.io, mkcert SSL ve HttpOnly Çerez Yönetimi"
baglam: "apps/docs (VitePress Rehberi) / Yerel Ağ ve Mobil Test Mimarisi"
durum: "Tamamlandı"
etiketler: [nip-io, sslip-io, mkcert, https, httponly-cookie, nginx, developer-network, mobile-testing]
---

# 📡 Geliştirici Ağı (LAN) Yapılandırma Rehberi

Bu doküman; yerel ağ (Wi-Fi veya mobil hotspot) üzerindeki mobil cihazlardan ve diğer bilgisayarlardan geliştirme sunucusuna (`dev.localhost` ve dinamik alt alan adları) **kota dostu**, **geçerli HTTPS sertifikalı** ve **`HttpOnly` çerez destekli** erişim sağlanması için gereken yapılandırmayı belgeler.

---

## 1. Mimari Yaklaşım: Neden `nip.io`?

* **Dış IP veya Sabit IP Gerektirmez:** `nip.io` (veya alternatif olarak `sslip.io`), alan adının içine gömülü olan yerel ağ IP adresini doğrudan geri döndüren ücretsiz bir DNS servisidir.
* **İnternet Kotasını Harcamaz:** Tünel servislerinin aksine trafik dış sunucular üzerinden dolaşmaz. Yalnızca ilk DNS sorgusu internete çıkar; geri kalan tüm uygulama, görsel ve API trafiği doğrudan yerel Wi-Fi veya hotspot ağı üzerinden akar.
* **Subdomain Koruması:** İstek Nginx sunucusuna ulaştığında HTTP `Host` başlığı (`dev.192.168.1.35.nip.io`) korunduğu için geliştirme ortamı ve alt dizin yönlendirmeleri eksiksiz çalışır.

---

## 2. Adım 1: Yerel Ağ IP Adresinin Tespiti

Geliştirme bilgisayarının bağlı olduğu ağdaki (Wi-Fi veya Hotspot) yerel IPv4 adresi tespit edilir:

* **Windows:** `ipconfig` (IPv4 Address satırı, örn. `192.168.1.35`)
* **Linux / macOS:** `ip a` veya `ifconfig`

*(Not: Ev Wi-Fi ağından telefon hotspot ağına geçildiğinde yerel IP adresi değişeceği için yeni IP adresiyle devam edilmelidir.)*

---

## 3. Adım 2: `mkcert` ile Çoklu Alan Adı ve IP Sertifikası Üretimi

Modern mobil tarayıcıların (iOS Safari, Android Chrome) `Secure` ve `HttpOnly` bayraklı **Refresh Token** çerezlerini kabul etmesi için geçerli bir HTTPS sertifikası zorunludur.

1. Bilgisayarda hem `localhost` hem de yerel ağ IP'sini (`192.168.1.35`) kapsayan sertifika oluşturulur:

```bash
mkcert -cert-file localhost.crt -key-file localhost.key \
  localhost "*.localhost" 127.0.0.1 ::1 \
  192.168.1.35 "192.168.1.35.nip.io" "*.192.168.1.35.nip.io"
```

2. **Mobil Cihaza Kök Sertifika (Root CA) Yükleme:**
   * Bilgisayarda `mkcert -CAROOT` komutu çalıştırılarak kök sertifika dizini açılır.
   * Dizindeki `rootCA.pem` dosyası test telefonuna aktarılır ve cihazın güvenlik/sertifika ayarlarından yüklenir (iOS cihazlarda yükleme sonrası *Ayarlar > Genel > Hakkında > Sertifika Güven Ayarları* menüsünden tam güven aktif edilmelidir).

---

## 4. Adım 3: Nginx (`dev.conf`) Yapılandırması

Mevcut `.localhost` kurallarına ek olarak yerel ağ IP'sini kapsayan `nip.io` tanımları eklenir. Böylece bilgisayardan `dev.localhost`, telefondan ise `dev.192.168.1.35.nip.io` adresine aynı anda erişilebilir.

```nginx
# 1. HTTP -> HTTPS Zorunlu Yönlendirme
server {
    listen 80;
    server_name localhost *.localhost 192.168.1.35.nip.io *.192.168.1.35.nip.io;
    return 302 https://$host$request_uri;
}

# 2. Geliştirme Ortamı (dev.localhost ve dev.<IP>.nip.io)
server {
    listen 443 ssl;
    server_name dev.localhost dev.192.168.1.35.nip.io;

    ssl_certificate     /etc/nginx/certs/localhost.crt;
    ssl_certificate_key /etc/nginx/certs/localhost.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location = /docs { return 301 https://$host/docs/; }
    location /docs/ {
        set $vitepress_dev "http://vitepress_docs_dev:5173";
        proxy_pass $vitepress_dev;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/ {
        set $api_dev "http://api_dev:3000";
        proxy_pass $api_dev;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. Dinamik Subdomain Yakalayıcı (Hem .localhost hem .nip.io için)
server {
    listen 443 ssl;
    server_name ~^(?<subdomain>.+)\.(localhost|192\.168\.1\.35\.nip\.io)$;

    ssl_certificate     /etc/nginx/certs/localhost.crt;
    ssl_certificate_key /etc/nginx/certs/localhost.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /var/www/builds/$subdomain;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ @saas_tenant_app;
    }

    location @saas_tenant_app {
        set $saas_upstream "http://web_app_prod:3000";
        proxy_pass $saas_upstream;
    }
}
```

Yapılandırma güncellendikten sonra Nginx kesintisiz olarak yenilenir:

```bash
docker exec <nginx_konteyner_adi> sh -c "nginx -t && nginx -s reload"
```

---

## 5. Adım 4: Backend `HttpOnly` Refresh Token Çerez Standartları

Alt alan adları ve farklı test cihazları arasında kimlik doğrulama oturumlarının sorunsuz çalışması için Node.js sunucu katmanında çerez ayarları ortam değişkenine (`.env`) bağlanmalıdır:

```ts
res.cookie('refresh_token', token, {
  httpOnly: true, // İstemci tarafı JavaScript (XSS) erişimini engeller
  secure: true,   // Yalnızca geçerli HTTPS bağlantılarında iletilir
  sameSite: 'lax',
  domain: process.env.COOKIE_DOMAIN, // Yerel testte ".localhost", mobil ağ testinde ".192.168.1.35.nip.io"
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün
});
```

---

## 6. Sorun Giderme ve Ağ Kontrol Listesi

* **Güvenlik Duvarı (Firewall):** Mobil cihazdan erişim zaman aşımına uğruyorsa geliştirme bilgisayarının güvenlik duvarında `80` ve `443` gelen (Inbound) TCP portlarına izin verilmelidir.
* **Docker Port Bağlantısı:** Nginx konteynerinin `docker-compose` port yönlendirmesi tüm ağ arayüzlerini dinleyecek şekilde (`"80:80"` ve `"443:443"`) tanımlanmalıdır.
* **Ağ İzolasyonu (AP Isolation):** Bazı ortak Wi-Fi yönlendiricilerinde cihazların birbirini görmesini engelleyen *Client/AP Isolation* özelliği açıksa mobil hotspot üzerinden bağlantı kurulmalıdır.


