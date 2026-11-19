---
title: 6. Edge Router
description: >-
  Yerel geliştirme ortamımızda her servis ve proje için ayrı konteynır
  oluşturarak servisleri Docker içinde çalıştırıp Nginx ile orkestrasyonu
  sağlayacağız.
outline:
  - 2
  - 3
status: published
tags:
  - rehber
  - sistem
  - servisler
---

# `6.` Edge Router

 
 Yerel geliştirme ortamımızda her servis ve proje için ayrı konteynır oluşturarak servisleri Docker içinde çalıştırıp Nginx ile orkestrasyonu sağlayacağız.

Bunun için monorepo ekosistemindeki tüm mikroservislere ve ön yüz (frontend) uygulamalarına gelen istekleri tek bir merkezden karşılayan, yönlendiren ve güvenliğini sağlayan **NGINX API Gateway / Ters Proxy (Reverse Proxy)** yapılandırmasını hazırlıyoruz.

 Subdomain ve `http-only` çerezler için HTTPS protokolünü kullanmamız gerekir. Ayrıca tarayıcıda sürekli güvenlik uyarısı görmek istemeyiz.


### Temel İşlevleri

1.  **Ters Proxy (Reverse Proxy):** İstemcilerden gelen istekleri mimariyi dışarıya açmadan arkadaki doğru mikroservise iletir.
2.  **Yük Dengeleme (Load Balancing):** Aynı servisin birden fazla replikası varsa, trafiği bu replikalar arasında eşit veya ağırlıklı olarak dağıtır.
3.  **SSL/TLS Sonlandırma:** HTTPS trafiğini burada sonlandırarak arkadaki servislerin SSL yükünü hafifletir ve iç ağda HTTP ile haberleşmelerini sağlar.
4.  **Güvenlik ve Sınırlandırma (Rate Limiting):** API uçlarına gelebilecek DDoS veya kötü niyetli bot saldırılarını engellemek için istek limitleri uygular.
  
## Docker - Ortak Ağ

::: warning Docker, `compose` dosyalarında tanımlı ağları konteynır özelinde otomatik oluşturmaya çalışır. Farklı `docker-compose` dosyalarındaki konteynerlerin birbiriyle ve Nginx ile konuşabilmesi için ortak bir harici (`external`) ağ oluşturuyoruz. 

```bash
  docker network create pr2_dev_network
```
:::
 
  
## Gateway (NGINX)
  
  
::: info Monorepo dizininde Nginx yapılandırması ve sertifikalar için kullanacağımız klasörleri oluşturuyoruz.

```bash
  mkdir -p infra/gateway/nginx/certs
```
:::

---

::: details Nginx konteyner yapılandırması `infra/gateway/docker-compose.yml`. 

```yaml
name: pr2_dev_proxy
services:
  nginx_proxy:
    image: nginx:alpine
    container_name: pr2_dev_proxy
    ports:
      - "80:80"
      - "443:443"

    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/certs:/etc/nginx/certs:ro
      - ../../../wwwroot:/var/www/html:ro
    
    networks:
      - pr2_dev_network
    deploy:
      resources:
        limits:
          cpus: '1.0'        # Maksimum kullanabileceği CPU çekirdek sayısı
          memory: 512M       # Maksimum kullanabileceği RAM miktarı

networks:
  pr2_dev_network:
    external: true
```
:::

---

::: details Docker dahili DNS çözümlemesi; çalışmayan veya aktif olmayan servisler sebebiyle  Nginx'in çökmesini engellemek için   `infra/gateway/nginx/conf.d/00-resolver.conf`
```nginx
# Docker dahili DNS sunucusunu aktif eder ve IP önbelleğini 5 saniyede bir tazeler
resolver 127.0.0.11 valid=5s ipv6=off;
```
:::


::: details Nginx (test) konfigürasyon dosyası `infra/gateway/nginx/conf.d/test.conf`

```nginx

    # =========================================================================
    # Dinamik Alt Alan Adı (Subdomain) Tespit Tablosu
    # =========================================================================
    map $http_host $subdomain_name {
        "docs.localhost"      "Documentation Project Server (Dökümantasyon)";
        "dashboardq.localhost" "Admin Dashboard Server (Yönetim Paneli)";
        default               "Default Localhost Root Gateway (Ana Dizin)";
    }

    # =========================================================================
    # 1. HTTP -> HTTPS Zorunlu Yönlendirme
    # =========================================================================
    server {
        listen 80;
        server_name localhost *.localhost;
        
        return 301 https://$host$request_uri;
    }

    # =========================================================================
    # 2. HTTPS Ana Sunucu (SSL & Yanıt Yönetimi)
    # =========================================================================
    server {
        listen 443 ssl;
        server_name localhost *.localhost;

        # mkcert Yerel Sertifika Yolları
        ssl_certificate     /etc/nginx/certs/localhost.crt;
        ssl_certificate_key /etc/nginx/certs/localhost.key;
        
        # SSL Güvenlik Ayarları
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        
        # SSI Desteği (HTML içinde Nginx değişkenlerini göstermek için)
        ssi on;
        
        # Genel Çıktı Türü
        # default_type        text/plain;

        # Alt Klasör Test Bağlantısı (/events)
        location /events {
            default_type "text/plain; charset=utf-8";
            return 200 "🎉 Nginx /events alt klasor testi başarılı.\n\nErişilen Sunucu: $subdomain_name\nKonum: Alt Klasor (/events)\nSSL Baglantısı: Güvenli (OK)\n";
        }

        # Ana Dizin / Kök Bağlantı (/)
        location / {
            root   /var/www/html/default-gateway;
            index  index.html;
            try_files $uri $uri/ =404;
        }    
        }

```
:::

---


`docs.localhost dev.localhost localhost` adresleri için `infra/gateway/nginx/certs/` klasöründe sertifikaları üretin.  Wildcard Subdomain için `"*.localhost"` adresini ekleyebilirsiniz fakat yerel sertifika ile çalışmaz.

```bash
   mkdir -p infra/gateway/nginx/certs
   cd infra/gateway/nginx/certs
   mkcert -cert-file localhost.crt -key-file localhost.key docs.localhost dev.localhost localhost 127.0.0.1 ::1
```

---

Çalışma alanımız içinde (`workspace-pr2`), monorepo (`source`) klasörümüzün yanına `wwwroot/default-gateway` klasörünü ve Nginx giriş sayfasını oluşturuyoruz.
/home/iyucel/workspace-pr2/wwwroot/default-gateway

```bash
   mkdir -p wwwroot/default-gateway
```
::: details `wwwroot/default-gateway/index.html`
```html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>pr2 Dev Proxy - Merkezi Test Gateway</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
        .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.5rem; max-width: 550px; }
        .badge { background: #238636; color: #fff; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85rem; }
        a { color: #58a6ff; text-decoration: none; display: block; margin: 0.5rem 0; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <h2>🚀 Merkezi wwwroot Bağlantı Testi</h2>
        <p><strong>Aktif Sunucu:</strong> <span class="badge"><!--# echo var="subdomain_name" default="Tanımsız" --></span></p>
        <p><strong>İstenen Host:</strong> <!--# echo var="http_host" --></p>
        <hr style="border-color: #30363d; margin: 1rem 0;">
        <p>Test Uç Noktaları:</p>
        <a href="https://localhost/events">➔ /events Alt Klasör Testi</a>
        <a href="https://docs.localhost">➔ docs.localhost (Subdomain Testi)</a>
        <a href="https://dashboard.localhost">➔ dashboard.localhost (Subdomain Testi)</a>
    </div>
</body>
</html>



::: 

## Test
::: info `infra/gateway/` klasöründe Docker Nginx servisini çalıştırıp test ediyoruz.
   
```bash
   cd infra/gateway
   docker compose up
```
 - [https://localhost](https://localhost/) 
 - [https://docs.localhost/](https://docs.localhost/) 
 - [https://docs.localhost/events](https://docs.localhost/events) 
 - Servisi durdurmak için
```bash
 
   docker compose down

```
 
::: 

## Yedekleme

::: tip Testler başarılı ise proje kök dizinine gelip kodlarımızı yedekliyoruz. 

```bash
   git add .
   git commit -m "Docker, Nginx-SSL Testi tamamlandı."
   git push origin
```
:::



---




