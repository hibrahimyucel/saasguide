
# `1.2.2.` Edge Router

 
 Yerel geliştirme ortamımızda her servis ve proje için ayrı konteynır oluşturarak servisleri Docker içinde çalıştırıp Nginx ile orkestrasyonu sağlayacağız.
   
 Subdomain ve `http-only` çerezler için HTTPS protokolünü kullanmamız gerekir. Ayrıca tarayıcıda sürekli güvenlik uyarısı görmek istemeyiz.
  
## Docker - Ortak Ağ

::: warning Docker, `compose` dosyalarında tanımlı ağları konteynır özelinde otomatik oluşturmaya çalışır. Farklı `docker-compose` dosyalarındaki konteynerlerin birbiriyle ve Nginx ile konuşabilmesi için ortak bir harici (`external`) ağ oluşturuyoruz. 

```bash
  docker network create dev_network
```
:::
 
## Nginx   
  
::: info Kök dizinde Nginx yapılandırması ve sertifikalar için kullanacağımız klasörleri oluşturuyoruz.

```bash
  mkdir -p infra/gateway/nginx/certs
```
:::

---

::: details Nginx konteynır yapılandırması `infra/gateway/docker-compose.yml`. 
 İlk kurulum için `test.conf`, sonrasında `dev.conf` ayarlarını kullanacağız.
```yaml
services:
  nginx_proxy:
    image: nginx:alpine
    container_name: nginx_proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      # Relative to this specific gateway folder
      - ./nginx/test.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    networks:
      - dev_network

networks:
  dev_network:
    external: true
```
:::

::: details Nginx (test) konfigürasyon dosyası `infra/gateway/nginx/test.conf`

```nginx

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    charset       utf-8;

    # =========================================================================
    # Dinamik Alt Alan Adı (Subdomain) Tespit Tablosu
    # =========================================================================
    map $http_host $subdomain_name {
        hostnames;
        "docs.localhost"      "Documentation Project Server (Dökümantasyon)";
        "dashboard.localhost" "Admin Dashboard Server (Yönetim Paneli)";
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

        # Genel Çıktı Türü
        default_type        text/plain;

        # Alt Klasör Test Bağlantısı (/events)
        location /events {
            return 200 "🎉 Harika! Nginx /events alt klasor testi başarılı.\n\nErişilen Sunucu: $subdomain_name\nKonum: Alt Klasor (/events)\nSSL Baglantısı: Güvenli (OK)\n";
        }

        # Ana Dizin / Kök Bağlantı (/)
        location / {
            return 200 "🚀 Harika! Nginx ayakta ve sorunsuz çalışıyor.\n\nErişilen Sunucu: $subdomain_name\nKonum: Ana Dizin (/)\nSSL Baglantısı: Güvenli (OK)\n";
        }
    }
}


```
:::




::: details Nginx (developper) konfigürasyon dosyası `infra/gateway/nginx/dev.conf`

```nginx
events { 
    worker_connections 1024; 
}

http { 
    resolver 127.0.0.11 valid=5s; 

    # ---------------------------------------------------- 
    # GLOBAL SUBDOMAIN YÖNLENDİRME TABLOSU (Routing Map)
    # ---------------------------------------------------- 
    map $http_host $backend_target {
        hostnames; 

        "docs.localhost"      "http://vitepress_docs_dev:5173";
        "dashboard.localhost" "http://vitepress_docs_dev:5173";

        default               "http://127.0.0.1:80";
    }

    # ---------------------------------------------------- 
    # HTTP -> HTTPS Kesin Zorlama (Bütün .localhost istekleri için)
    # ---------------------------------------------------- 
    server {
        listen 80;
        server_name localhost *.localhost;
        
        # Tarayıcıya HTTP isteklerini doğrudan güvenli HTTPS'e yönlendirmesini söyler
        return 301 https://$host$request_uri;
    }

    # ---------------------------------------------------- 
    # HTTPS Sunucusu (SSL İşlemlerinin Yapıldığı Yer)
    # ---------------------------------------------------- 
    server {
        listen 443 ssl;
        # server_name tanımını map tablosuyla tam eşleşecek şekilde genişlettik
        server_name localhost *.localhost; 

        # mkcert Sertifika Yolları
        ssl_certificate /etc/nginx/certs/localhost.crt;
        ssl_certificate_key /etc/nginx/certs/localhost.key;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # HSTS Başlığı (Tarayıcıya bu siteye 1 yıl boyunca sadece HTTPS ile girmesini söyler)
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            proxy_pass $backend_target;

            # Proxy Başlıkları
            proxy_set_header Host $http_host; # $host yerine $http_host kullanarak port bilgilerini koruruz
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # VitePress WebSocket Desteği
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            proxy_intercept_errors on;
            error_page 502 503 504 = @konteyner_yok;
        }

        location @konteyner_yok {
            default_type text/plain;
            return 503 "Hedef Docker konteyneri şu an aktif değil veya başlatılamadı.";
        }
    }
}

```
:::


---


::: info Localhost ve Wildcard Subdomain için `infra/gateway/nginx/certs/` klasöründe sertifikaları üretin
   
```bash
   mkdir -p infra/gateway/nginx/certs
   cd infra/gateway/nginx/certs
   mkcert -cert-file localhost.crt -key-file localhost.key "*.localhost" localhost 127.0.0.1 ::1
```

---

Yukarıdaki sertifika [localhost](https://localhost/) için düzgün çalışırken 
Subdomainleri [docs.localhost](https://docs.localhost/) tanımayabilir.

Bu sorunu çözmek için sertifikaya alan adlarını eklemeniz gerekir.

```bash
   mkcert -cert-file localhost.crt -key-file localhost.key localhost docs.localhost dashboard.localhost 127.0.0.1 ::1
```
::: 

## Test - Yedekleme
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
   cd infra/gateway
   docker compose down
```
 
::: 

::: tip Test başarılı ise proje kök dizinine gelip kodlarımızı yedekliyoruz. 

```bash
   git add .
   git commit -m "Docker, Nginx-SSL Testi tamamlandı."
   git push origin
```


---




