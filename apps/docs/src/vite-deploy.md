---
tarih: 2026-11-14
saat: 22:58
konu: "VitePress Üretim (Production) ve Çoklu Dağıtım Mimarisi Rehberi"
baglam: "apps/docs (VitePress Rehber Dökümantasyonu) / Anayasa v3"
durum: "Tamamlandı"
etiketler: [vitepress, docker, nginx, reverse-proxy, deployment, kebab-case, rehber]
---

# 🚀 VitePress Üretim (Production) ve Dağıtım Mimarisi

Bu rehber, monorepo içindeki `apps/docs` (VitePress) uygulamasının hem alt dizin (`https://localhost/docs/`) hem de bağımsız bir alt alan adı (`https://docs.localhost`) üzerinden yüksek performanslı ve hataya dayanıklı (resilient) biçimde yayınlanma standartlarını belgeler.

---

## 1. Mimari Yaklaşım ve Dağıtım Modelleri

Projede geliştirme deneyimini üretim ortamından izole etmek amacıyla **üç farklı çalışma modu** kurgulanmıştır:

1. **Geliştirme Modu (`Dockerfile.dev`):** Anlık dosya değişikliklerini izleyen (HMR / Polling) Node.js geliştirme sunucusudur.
2. **Statik Alt Klasör Dağıtımı (`https://localhost/docs/`):** İzole bir Docker derleyici (`Dockerfile.build`) aracılığıyla üretilen statik dosyaların doğrudan `wwwroot/docs` dizinine aktarıldığı ve ana Gateway (`pr2_dev_proxy`) tarafından sunulduğu modeldir.
3. **Bağımsız Mikro-Servis Dağıtımı (`https://docs.localhost`):** Çok aşamalı (Multi-Stage) Docker imajı (`Dockerfile`) ile kendi Nginx sunucusunu barındıran ve Gateway üzerinden ters vekil (reverse proxy) ile yönlendirilen izole konteyner modelidir.

---

## 2. Dinamik Taban Yolu (Base URL) Yönetimi

VitePress yapılandırması (`apps/docs/src/.vitepress/config.ts`), aynı kod tabanının farklı URL yapılarında çalışabilmesi için ortam değişkenine duyarlı hale getirilmiştir:

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  // Alt klasör yayınında '/docs/', alt alan adı yayınında '/' değerini alır
  base: process.env.VITE_BASE_URL ?? '/',
  cleanUrls: true,
})
```

---

## 3. Model A: Statik Alt Klasör Dağıtımı (`localhost/docs`)

Bu modelde host makinede ek bir web sunucusu konteyneri çalıştırılmaz. Derleme işlemi geçici bir Docker konteynerinde yapılır ve çıktı doğrudan ana Nginx dizinine bırakılır.

### 3.1. İzole Derleyici ve İzin Yönetimi (`apps/docs/Dockerfile.build`)
Linux sistemlerde (özellikle SELinux aktif Fedora/RHEL ortamlarında) dosya sahipliği ve yazma izinlerini korumak için derleme dizinleri `1000:1000` kullanıcısına devredilir:

```dockerfile
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache git
RUN npm i -g pnpm turbo

COPY ./package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ./apps/docs/package.json ./apps/docs/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY --chown=1000:1000 . .
RUN mkdir -p /wwwroot && chown -R 1000:1000 /wwwroot

CMD ["sh", "-c", "VITE_BASE_URL=/docs/ pnpm --filter docs build && mkdir -p /wwwroot/docs && rm -rf /wwwroot/docs/* && cp -rv /app/apps/docs/src/.vitepress/dist/* /wwwroot/docs/"]
```

### 3.2. Volume ve SELinux Yapılandırması (`apps/docs/docker-compose.build.yml`)
`:Z` bayrağı ile konteynerin ana makinedeki `wwwroot` dizinine yazma izni garanti altına alınır:

```yaml
name: docs_builder
services:
  docs-builder:
    user: "UID:-1000:{GID:-1000}"
    build:
      context: ../../
      dockerfile: apps/docs/Dockerfile.build
    container_name: docs_builder
    volumes:
      - ../../../wwwroot:/wwwroot:Z
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

### 3.3. Kullanıcı Deneyimi (UX) ve 503 Hata Yönetimi (`default-gateway.conf`)
Henüz derleme alınmadığında (`wwwroot/docs` boşken) Nginx'in `try_files` döngüsüne girip `500 Internal Server Error` vermesini önlemek için harici bir bilgilendirme sayfası (`docs-pending.html`) kullanılır:

```nginx
location = /docs {
    return 301 https://\$host/docs/;
}

# Hash'lenmiş VitePress varlıkları için agresif önbellekleme
location ^~ /docs/assets/ {
    alias /var/www/html/docs/assets/;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}

location /docs/ {
    alias /var/www/html/docs/;
    index index.html;
    add_header Cache-Control "no-cache";

    # Klasör yoksa 503 durumuna düşür
    try_files \$uri uri/ uri.html =503;
    error_page 503 /docs-pending.html;
}

location = /docs-pending.html {
    root /var/www/html/default-gateway;
    internal;
}
```

---

## 4. Model B: Bağımsız Konteyner Dağıtımı (`docs.localhost`)

Dokümantasyonu kendi başına taşınabilir bir mikro-servis olarak paketlemek için Multi-Stage Docker yapısı kullanılır.

### 4.1. Multi-Stage Production Dockerfile (`apps/docs/Dockerfile`)
```dockerfile
# 1. Aşama: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git
RUN npm i -g pnpm turbo

COPY ./package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ./apps/docs/package.json ./apps/docs/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .
ENV VITE_BASE_URL=/
RUN pnpm --filter docs build

# 2. Aşama: Production Nginx
FROM nginx:alpine
COPY ./apps/docs/nginx.prod.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/docs/src/.vitepress/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 4.2. Gateway Reverse Proxy ve Dinamik DNS (`docs-localhost.conf`)
`docs_prod` konteyneri kapalı olduğunda ana Gateway'in çökmesini engellemek için Docker'ın gömülü DNS sunucusu (`127.0.0.11`) ve değişken tabanlı `proxy_pass` kullanılır:

```nginx
server {
    listen 443 ssl;
    server_name docs.localhost;

    ssl_certificate     /etc/nginx/certs/localhost.crt;
    ssl_certificate_key /etc/nginx/certs/localhost.key;

    error_page 502 503 504 /docs-pending.html;

    location = /docs-pending.html {
        root /var/www/html/default-gateway;
        internal;
    }

    location / {
        resolver 127.0.0.11 valid=30s;
        set \$upstream_docs http://docs_prod:80;

        proxy_pass \$upstream_docs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
```

---

## 5. Performans ve Sıkıştırma Standartları

Ağ trafiğini azaltmak ve sayfa yükleme sürelerini düşürmek için Nginx katmanında şu kurallar zorunlu tutulmuştur:

* **Gzip Sıkıştırma (`gzip_comp_level 6`):** Metin tabanlı varlıklar (`html`, `css`, `js`, `json`, `svg`) 1024 byte üzerindeki boyutlarda sıkıştırılarak iletilir.
* **Değişmez Varlık Önbelleği (`immutable`):** VitePress tarafından içerik hash'i eklenen `assets/` dosyaları tarayıcıda 1 yıl süreyle önbelleğe alınır.
* **HTML Tazeliği (`no-cache`):** Yeni yayınlanan dokümanların kullanıcılara anında yansıması için `.html` dosyaları her ziyarette doğrulanır.

---

## 6. Operasyonel Komut Özeti

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **Alt Klasör Yayını** | `pnpm --filter docs docker:publish` | Statik dosyaları derler ve `wwwroot/docs` içine aktarır. |
| **Subdomain Başlatma** | `pnpm --filter docs docker:prod:up` | `docs_prod` imajını oluşturur ve arka planda başlatır. |
| **Subdomain Durdurma** | `pnpm --filter docs docker:prod:down` | `docs_prod` konteynerini durdurur (Gateway 503 ekranına geçer). |
| **Gateway Yenileme** | `docker exec pr2_dev_proxy nginx -s reload` | Nginx yapılandırma değişikliklerini kesintisiz uygular. |

