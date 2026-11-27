---
title: "NGINX Reverse Proxy ve Edge Router Kurulumu"
description: "πr² Cloud yerel ve hibrit geliştirme ortamı için Docker ağ izolasyonu, Wildcard TLS sonlandırma ve NGINX ters vekil kurulumu."
outline: [2, 3]
sidebarTitle: "Nginx - Ağ Arayüzü"
index: 60
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "nginx", "reverse-proxy", "docker", "ssl"]
---


# NGINX Reverse Proxy

::: info Dünyaya açılan kapınız
Sistemdeki tüm mikroservislere ve ön yüz (frontend) uygulamalarına gelen istekleri tek bir merkezden karşılayan, yönlendiren ve güvenliğini sağlayan **NGINX API Gateway / Reverse Proxy** yapılandırmasını hazırlıyoruz.
:::

### Temel İşlevleri

1.  **Ters Proxy (Reverse Proxy):** İstemcilerden gelen istekleri mimariyi dışarıya açmadan arkadaki doğru mikroservise iletir.
2.  **Yük Dengeleme (Load Balancing):** Aynı servisin birden fazla replikası varsa, trafiği bu replikalar arasında eşit veya ağırlıklı olarak dağıtır.
3.  **SSL/TLS Sonlandırma:** HTTPS trafiğini burada sonlandırarak arkadaki servislerin SSL yükünü hafifletir ve iç ağda HTTP ile haberleşmelerini sağlar.
4.  **Güvenlik ve Sınırlandırma (Rate Limiting):** API uçlarına gelebilecek DDoS veya kötü niyetli bot saldırılarını engellemek için istek limitleri uygular.


::: tip İkinci Alan Adı (Multi-Domain) Bağlama
Sisteme ikinci bir alan adı (örneğin canlı alan adınızın yanına test amaçlı bir DuckDNS adresi veya ikinci bir proje domaini) bağlamak için:
1. İkinci alan adı için **DNS ve Wildcard TLS** adımındaki komutu `-d "ikincidomain.com" -d "*.ikincidomain.com"` ile çalıştırıp sertifikasını `<-DATA_DIR->/certs/live/://ikincidomain.com` altına üretin.
2. `<-SOURCE_DIR->/infra/nginx/templates/` klasörüne `03-ikinci-domain.conf.template` adında yeni bir dosya ekleyip `server_name` ve `ssl_certificate` satırlarını bu alan adına göre tanımlayın.
3. `docker compose -f compose.gateway.yml restart` komutuyla yeni alan adını devreye alın.
:::


## Dosyalar

- Yapılandırma dosyaları için klasör oluşturuyoruz.
<DynamicSnippet title="Monorepo Parametreleri" >

```bash
  mkdir -p <-DATA_DIR->/wwwroot
  mkdir -p <-SOURCE_DIR->/infra/nginx/{templates,snippets}
```

</DynamicSnippet>

```text
📁 infra                                  # Merkezi altyapı ve orkestrasyon klasörü
├── 📁 nginx                              # NGINX ters vekil yapılandırma klasörü
│   ├── 📁 templates                      # envsubst şablonları (otomatik .conf üretir)
│   │   ├── 📄 00-resolver.conf.template  # Docker dahili DNS çözümleyici
│   │   ├── 📄 01-default.conf.template   # HTTP -> HTTPS genel yönlendirme
│   │   ├── 📄 02-main-duckdns.conf.template # DuckDNS kök yönlendirme & açılış sayfası
│   │   ├── 📄 02-main-domain.conf.template  # Özel alan adı kök yönlendirme & açılış sayfası
│   │   ├── 📄 auth.conf.template         # Dex SSO (sonraki adımlarda eklenecek)
│   │   ├── 📄 gitea.conf.template        # Gitea Git & Registry
│   │   ├── 📄 silo.conf.template         # PGSTY SILO S3 & Yönetim Konsolu
│   │   └── 📄 db.conf.template           # phpMyAdmin
│   └── 📁 snippets                       # Ortak yeniden kullanılabilir ayar parçaları
│       ├── 📄 proxy-headers.conf         # Ters vekil ve WebSocket başlıkları
│       └── 📄 tls-base.conf              # Modern TLS protokol ve şifreleme ayarları
├── 📁 scripts                            # Otomasyon ve sertifika yenileme betikleri
├── 📄 .env                               # Merkezi ortam değişkenleri
└── 📄 compose.gateway.yml                # Nginx Reverse Proxy konteyner dosyası


```

- **Ortak Standartların İzolasyonu (`snippets/`):** SSL sertifika yolları veya proxy başlıkları gibi her serviste aynı olan ayarlar tekrar yazılmaz. Ortam değişikliğinde (örneğin yerelden canlı sunucuya geçişte) yalnızca ilgili snippet dosyasının güncellenmesi yeterlidir.

- **Servis Bazlı Esneklik (`conf.d/`):** Bir servise özel güvenlik veya performans kuralları genel şablonlara dahil edilmez. Örneğin Gitea'nın büyük Docker katmanlarını kabul etmesi için gereken `client_max_body_size 0;` ayarı yalnızca `gitea.conf` içinde tanımlanır.

- **Dinamik DNS Çözümlemesi:** Docker konteynerleri yeniden başlatıldığında IP adresleri değişebileceğinden, `upstream` adresleri doğrudan `proxy_pass` içine yazılmak yerine değişken (`set $upstream ...`) olarak tanımlanır ve Docker dahili DNS sunucusu (`127.0.0.11`) ile çözümlenir.


### Snippets

- TLS `<-SOURCE_DIR->/infra/nginx/snippets/tls-base.conf`

```nginx
# Modern TLS Protokol ve Şifreleme Standartları
ssl_protocols       TLSv1.2 TLSv1.3;
ssl_ciphers         HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache   shared:SSL:10m;
ssl_session_timeout 1d;

```

- Proxy Headers `<-SOURCE_DIR->/infra/nginx/snippets/proxy-headers.conf`

```nginx
# proxy headers
proxy_http_version 1.1;

# İstemci ve Protokol Bilgileri
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# WebSocket ve Canlı Yenileme (HMR) Desteği
proxy_set_header Upgrade           $http_upgrade;
proxy_set_header Connection        "upgrade";

```

### Templates


### Docker DNS Resolver

Docker dahili DNS çözümlemesi; çalışmayan veya aktif olmayan servisler sebebiyle  Nginx'in çökmesini engellemek için `infra/nginx/templates/00-resolver.conf.template`. 
 
```nginx
#Docker dahili DNS sunucusunu aktif eder ve IP önbelleğini 5 saniyede bir tazeler

resolver 127.0.0.11 valid=5s ipv6=off;

```


### HTTP+S - Subdomains

- Tüm HTTP isteklerini HTTPS'e yönlendir `infra/nginx/templates/01-default.conf.template`.

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    return 301 https://$host$request_uri;
}
```

### `main` alt alan adı

Kök alan adına gelen istekler main'e yönlendirilir.

- `infra/nginx/templates/02-main-duckdns.conf.template`.

```nginx
# Kök alan adını main.${DUCKDNS_DOMAIN} adresine yönlendir
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ${DUCKDNS_DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    return 301 https://main.${DUCKDNS_DOMAIN}$request_uri;
}

# Özel servis tanımı olmayan tüm *.${DUCKDNS_DOMAIN} isteklerini Gateway açılış sayfasında karşıla
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name *.${DUCKDNS_DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    add_header X-Resolved-Host $host always;
    root /var/www/wwwroot;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

```

- `infra/nginx/templates/02-main-domain.conf.template`.


```nginx
# Kök alan adını main.${DOMAIN} adresine yönlendir
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    return 301 https://main.${DOMAIN}$request_uri;
}

# Özel servis tanımı olmayan tüm *.${DOMAIN} isteklerini Gateway açılış sayfasında karşıla
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name *.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    add_header X-Resolved-Host $host always;
    root /var/www/wwwroot;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

```


### index.html 

Gelen alt alan adını (*.) otomatik çözümleyen, aktif protokolü/yolu gösteren ve ekosistemdeki temel servislere (main., docs., dev., git.) hızlı geçiş kartları sunan tek dosyalık, harici bağımlılığı olmayan `<-DATA_DIR->/wwwroot/index.html` dosyası.

- [index.html](../ek/index-html.md) 

### Docker compose 

Nginx konteyner yapılandırması `infra/compose.gateway.yml`. 

```yaml
name: pr2_gateway
services:
  nginx-gateway:
    image: nginx:1.27-alpine
    container_name: pr2-gateway
    restart: unless-stopped
    env_file:
      - ./.env
    environment:
      NGINX_ENVSUBST_FILTER: "^(DOMAIN|DUCKDNS_DOMAIN)$$"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/templates:/etc/nginx/templates:ro,z
      - ./nginx/snippets:/etc/nginx/snippets:ro,z
      - ${DATA_DIR}/certs:/etc/letsencrypt:ro,z
      - ${DATA_DIR}/wwwroot:/var/www/wwwroot:ro,z
    networks:
      - pr2_edge_net

networks:
  pr2_edge_net:
    external: true

```

---

## Test
::: info Test

`infra/` klasöründe Docker Nginx servisini çalıştırıp test ediyoruz.
   
```bash
   docker compose -f compose.gateway.yml up -d
```

 - Servisi durdurmak için

```bash
   docker compose -f compose.gateway.yml down
```
 
::: 

## Yedekleme

::: tip Git Yedekleme. 
Testler başarılı ise kodlarımızı yedekliyoruz. 

```bash
   git add .
   git commit -m "Docker, Nginx-SSL Testi tamamlandı."
```
:::





