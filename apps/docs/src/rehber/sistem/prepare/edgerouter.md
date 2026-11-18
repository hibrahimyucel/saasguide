
# `1.2.2.` Edge Router

 
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
  docker network create dev_network
```
:::
 
  
## Gateway (NGINX)
  
  
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
    container_name: sr_proxy
    ports:
      - "80:80"
      - "443:443"
    # 
    volumes:
      - ./nginx/test.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    networks:
      - dev_network
    deploy:
      resources:
        limits:
          cpus: '1.0'        # Maksimum kullanabileceği CPU çekirdek sayısı
          memory: 512M       # Maksimum kullanabileceği RAM miktarı
        reservations:
          cpus: '0.25'       # Servis için ayrılan / garanti edilen minimum CPU
          memory: 128M       # Servis için ayrılan / garanti edilen minimum RAM

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
            return 200 "🎉 Nginx /events alt klasor testi başarılı.\n\nErişilen Sunucu: $subdomain_name\nKonum: Alt Klasor (/events)\nSSL Baglantısı: Güvenli (OK)\n";
        }

        # Ana Dizin / Kök Bağlantı (/)
        location / {
            return 200 "🚀  Nginx ayakta ve sorunsuz çalışıyor.\n\nErişilen Sunucu: $subdomain_name\nKonum: Ana Dizin (/)\nSSL Baglantısı: Güvenli (OK)\n";
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

## Test
::: info `infra/gateway/` klasöründe Docker Nginx servisini çalıştırıp test ediyoruz. `
   
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

## Kaynak Yönetimi

`docker stats` komutu çalışan servislerin kaynak kullanımını gösterir. Servisi bağımsız (detached) `docker compose up -d` çalıştırıyoruz ve kaynak kullanımını listeliyoruz.

```bash
   docker compose up -d
   docker stats sr_proxy
```


::: info Bu komut size anlık olarak şu bilgileri gösterecektir: 
<pre>
CONTAINER ID      : Konteynerin benzersiz kimlik numarası.
NAME              : Konteynerin adı (Örn: nginx_proxy).
CPU %             : Konteynerin anlık işlemci kullanım yüzdesi.
MEM USAGE / LIMIT : Harcanan RAM miktarı ve atanan maksimum sınır.
MEM %             : Bellek kullanımının yüzde olarak oranı.
NET I/O           : Konteynerin aldığı ve gönderdiği toplam ağ trafiği.
BLOCK I/O         : Diske yazılan ve diskten okunan toplam veri miktarı.
PIDS              : Konteyner tarafından oluşturulan aktif süreç sayısı.
</pre>
:::



---




