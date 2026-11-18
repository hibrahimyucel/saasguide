---
tarih: 2026-11-12
saat: 18:43
konu: "Monorepo Nginx Reverse Proxy ve Gateway Katmanı Rehberi"
baglam: "infra/nginx (Reverse Proxy) / dev.localhost ve Mikroservis Yönlendirmesi"
durum: "Tamamlandı"
etiketler: [nginx, reverse-proxy, gateway, docker, monorepo, dev-localhost, websocket]
---

# 🌐 Monorepo Nginx Reverse Proxy ve Gateway Katmanı Rehberi

Bu doküman; monorepo mimarisi içindeki tüm geliştirme servislerini (`apps/web`, `apps/docs`, `apps/backend-api`) tek bir yerel giriş noktası (`http://dev.localhost`) altında birleştiren **Nginx Ters Vekil (Reverse Proxy)** katmanının kurulumunu, yapılandırma kurallarını ve teknik gerekçelerini açıklar.

---

## 1. Mimari Amaç ve Klasör Yapısı

Her servis için tarayıcıda farklı port numaraları (`:3000`, `:4000`, `:5173`) ezberlemek ve yerel geliştirmede **CORS (Cross-Origin Resource Sharing)** hatalarıyla uğraşmak yerine, tüm trafik ortak `dev_network` ağı üzerindeki merkezi bir Nginx konteynerinden geçirilir.

```text
monorepo-root/
├── infra/
│   └── nginx/
│       ├── docker-compose.yml   # Nginx Gateway servis tanımı
│       └── default.conf         # Yönlendirme (Routing) ve WebSocket kuralları
└── apps/
    ├── web/                     # -> http://dev.localhost/
    ├── docs/                    # -> http://dev.localhost/docs/
    └── backend-api/             # -> http://dev.localhost/api/
```

---

## 2. Nginx Yönlendirme Yapılandırması (`infra/nginx/default.conf`)

Aşağıdaki yapılandırma; gelen istekleri URL yoluna (path) göre ilgili konteynere iletir ve geliştirme araçlarının canlı yenileme (**HMR / WebSocket**) bağlantılarını kesintisiz taşır.

```nginx
# Docker dahili DNS sunucusu (Konteyner isimlerinin dinamik çözümlenmesi için)
resolver 127.0.0.11 valid=10s;

server {
    listen 80;
    server_name dev.localhost localhost;

    # Ortak Proxy Başlıkları (İstemci IP ve Host bilgisini korur)
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket ve HMR (Hot Module Replacement) Desteği
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # 1. VitePress Dokümantasyon Yönlendirmesi (/docs)
    location = /docs {
        return 301 /docs/;
    }

    location /docs/ {
        set $docs_upstream http://vitepress_docs_dev:5173;
        proxy_pass $docs_upstream;
    }

    # 2. Backend API Yönlendirmesi (/api)
    location /api/ {
        set $api_upstream http://monorepo_backend_api_dev:4000;
        # /api/users isteğini backend'e /users olarak iletmek için rewrite kullanılır
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass $api_upstream;
    }

    # 3. Ana Front-End Uygulaması (Varsayılan Kök Dizin /)
    location / {
        set $web_upstream http://monorepo_web_dev:3000;
        proxy_pass $web_upstream;
    }
}
```

### Kritik Teknik Kurallar ve Çözümler

* **`resolver 127.0.0.11` ve Değişken (`set $...`) Kullanımı:** Standart `proxy_pass http://konteyner_adi;` kullanımında, hedef konteynerlerden biri (örneğin `apps/web`) henüz ayağa kalkmamışsa Nginx hata verip kapanır. Hedef adresleri `set` ile değişkene atayıp Docker DNS çözümleyicisini (`127.0.0.11`) tanımlamak, **diğer servisler kapalı olsa bile Nginx'in ayakta kalmasını** sağlar.
* **WebSocket / HMR Başlıkları:** `Upgrade` ve `Connection "upgrade"` başlıkları olmadan VitePress ve Next.js/React geliştirme sunucularının canlı yenileme (Hot Reload) soketleri çalışmaz ve tarayıcı konsolunda bağlantı hataları oluşur.
* **VitePress `/docs` Eğik Çizgi (Trailing Slash) Kuralı:** VitePress `base: '/docs/'` ayarıyla çalıştığı için `/docs` adresine gelen istekler `301` ile `/docs/` yoluna yönlendirilir. Ayrıca `proxy_pass` sonunda `/` kullanılmadığı için `/docs/` ön eki doğrudan VitePress konteynerine aktarılır.
* **API Yol Temizliği (`rewrite`):** Front-end tarafı `http://dev.localhost/api/auth/login` adresine istek atar; `rewrite ^/api/(.*)$ /$1 break;` kuralı başındaki `/api` kısmını soyarak Backend API konteynerine temiz şekilde `/auth/login` olarak iletir.

---

## 3. Gateway Konteyner Tanımı (`infra/nginx/docker-compose.yml`)

Nginx katmanının dış dünyadan `80` portunu dinlemesi ve iç ağdaki diğer servislere erişebilmesi için `dev_network` ağına bağlanması gerekir.

```yaml
services:
  gateway-nginx:
    image: nginx:alpine
    container_name: monorepo_gateway_nginx
    ports:
      - "80:80"
    volumes:
      - ./default.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - dev_network
    restart: unless-stopped

networks:
  dev_network:
    external: true
```

### Parametre Açıklamaları

* **`:ro` (Read-Only Mount):** `./default.conf` dosyası konteyner içine salt okunur olarak bağlanır; konteyner içinden yapılandırma dosyasının yanlışlıkla değiştirilmesi önlenir.
* **`ports: - "80:80"`:** Yalnızca Gateway konteyneri ana makinenin `80` portunu dışarıya açar. Diğer hiçbir mikroservis (`web`, `docs`, `api`) doğrudan ana makineye port açmak zorunda değildir.

---

## 4. Uygulama Tarafı Uyumluluk Ayarları

Yönlendirmelerin sorunsuz çalışması için ilgili uygulamalarda şu iki ayar bulunmalıdır:

* **VitePress (`apps/docs/.vitepress/config.mts`):**
  ```ts
  export default defineConfig({
    base: '/docs/',
    // ...
  })
  ```
* **Yerel Alan Adı Çözümlemesi (`hosts` Dosyası):** Modern tarayıcılar (Chrome, Edge, Firefox) `.localhost` uzantılı tüm alt alan adlarını (`dev.localhost`, `api.localhost`) otomatik olarak `127.0.0.1` adresine yönlendirir. Ekstra bir `hosts` düzenlemesine gerek kalmadan doğrudan `http://dev.localhost` adresine erişebilirsiniz.

---

## 5. Kök Dizin (`package.json`) Gateway Komutları

Kök dizindeki `package.json` dosyanıza Nginx katmanını yönetmek için şu komutları ekleyebilirsiniz:

```json
{
  "scripts": {
    "gateway:up": "pnpm docker:network && docker compose -f infra/nginx/docker-compose.yml up -d",
    "gateway:reload": "docker exec monorepo_gateway_nginx nginx -s reload",
    "gateway:down": "docker compose -f infra/nginx/docker-compose.yml down"
  }
}
```

* **`pnpm gateway:reload`:** `default.conf` dosyasında bir kural değiştirdiğinizde konteyneri kapatıp açmadan milisaniyeler içinde yeni ayarları devreye alır.
