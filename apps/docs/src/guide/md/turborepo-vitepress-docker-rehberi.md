# 🚀 Turborepo + VitePress: Docker & Nginx Yapılandırma Rehberi

Bu doküman, yerel geliştirme ortamınızda ihtiyacınıza göre seçebileceğiniz 3 farklı mimari kurguyu ve yapılandırma dosyalarını içerir.

---

## 📊 Yapılandırma Karşılaştırma Tablosu

| Özellik / Kriter | 1. DEV (Klasik Dev-Server) | 2. STATIC (Sıfır Docker Yükü) | 3. DEV-LOCALHOST (Portsuz Dev) |
| :--- | :--- | :--- | :--- |
| **Çalışma Modu** | Konteyner içi Geliştirme Sunucusu | Konteyner dışı Statik Sunum | Konteyner içi Geliştirme Sunucusu |
| **Erişim Adresi** | `http://localhost:8080/saasguide/` | `http://localhost` | **`http://localhost`** |
| **Hot-Reload (HMR)**| 🔄 **Aktif** (Anlık Güncellenir) | ❌ Pasif (Yeniden Build Gerekir) | 🔄 **Aktif** (Anlık Güncellenir) |
| **Docker Build Süresi**| Orta (İlk seferde paketleri kurar) | ⚡ **Anında** (Build Süresi Yoktur) | Orta (İlk seferde paketleri kurar) |
| **Yerel Disk Yükü** | Düşük | Düşük | Düşük |
| **En Uygun Senaryo** | Monorepoda çoklu mikro-frontend geliştirme | Hızlı önizleme ve production testi | Yalın ve konforlu dokümantasyon yazımı |

---

## 🛠️ Ortak Dosyalar

Tüm senaryolarda Docker'ın gereksiz yer kaplamasını önlemek için projenin **kök dizininde (root)** bir `.dockerignore` dosyası bulunmalıdır.

### `.dockerignore`
```text
node_modules
.pnpm-store
.git
.turbo
apps/**/dist
apps/**/.vitepress/dist
.next
```

***

## 1️⃣ Yapılandırma: DEV (Klasik Dev-Server)
Bu yapılandırma, uygulamayı belirli bir port (`8080`) ve alt yol (`/saasguide/`) üzerinden çalıştırır. Monoreponuza ileride yeni frontend veya backend projeleri eklemek istediğinizde en esnek ve genişletilebilir yapıdır.

### 📄 `nginx/dev.conf`
```nginx
server {
    listen 80;
    server_name localhost;

    resolver 127.0.0.11 valid=30s;

    location / {
        return 301 $scheme://$http_host/saasguide/;
    }

    location /saasguide {
        set $upstream http://docs-dev:5173;
        proxy_pass $upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 📄 `Dockerfile.dev`
```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache git
RUN npm i -g pnpm turbo
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/docs/package.json ./apps/docs/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
EXPOSE 5173
```

### 📄 `docker-compose.dev.yml`
```yaml
version: '3.8'
services:
  nginx-dev:
    image: nginx:stable-alpine
    container_name: vitepress_nginx_dev
    ports:
      - "8080:80"
    volumes:
      - ./nginx/dev.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - docs-dev
    networks:
      - dev-network

  docs-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: vitepress_docs_dev
    volumes:
      - .:/app
      - /app/node_modules
      - /app/apps/docs/node_modules
    command: pnpm --filter docs dev
    environment:
      - WATCHPACK_POLLING=true
    networks:
      - dev-network

networks:
  dev-network:
    driver: bridge
```

***

## 2️⃣ Yapılandırma: STATIC (Sıfır Docker Yükü)
Bu yapılandırmada Docker içinde paket kurulumu yapılmaz. Uygulama yerel makinenizde derlenir (`build`) ve oluşan `dist` klasörü doğrudan Nginx'e bağlanır. Docker imaj build süresi **0 saniyedir**. Dosya değişikliklerini izlemek için `chokidar` kullanılır.

### 📄 `nginx/static.conf`
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

### 📄 `docker-compose.static.yml`
```yaml
version: '3.8'
services:
  nginx-static:
    image: nginx:stable-alpine
    container_name: vitepress_nginx_static
    ports:
      - "80:80"
    volumes:
      - ./apps/docs/.vitepress/dist:/usr/share/nginx/html:ro
      - ./nginx/static.conf:/etc/nginx/conf.d/default.conf:ro
```

### 📄 `apps/docs/package.json` (Watch Script Eki)
```json
"scripts": {
  "build": "vitepress build src",
  "build:watch": "chokidar "src/**/*.md" "src/**/*.ts" -c "pnpm build" --initial"
}
```
*Geliştirme yaparken tek yapmanız gereken yerelde `pnpm --filter docs run build:watch` komutunu açık bırakmaktır.*

---

## 3️⃣ Yapılandırma: DEV-LOCALHOST (Portsuz & Canlı)
Bu yapılandırma, geliştirici deneyimi en yüksek olan kurgudur. Uygulama Docker içinde çalışır, **Hot-Reload aktiftir** ve tarayıcıda hiçbir port veya alt klasör eki yazmadan doğrudan **`http://localhost`** yazarak dokümantasyonunuza erişebilirsiniz.

### 📄 `nginx/dev-localhost.conf`
```nginx
server {
    listen 80;
    server_name localhost;
    resolver 127.0.0.11 valid=5s;

    location / {
        set $upstream http://docs-dev:5173;
        proxy_pass $upstream;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket (HMR) Desteği
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 📄 `apps/docs/.vitepress/config.ts` (Kritik HMR Ayarı)
```typescript
export default {
  base: '/',
  vite: {
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        clientPort: 80
      }
    }
  }
}
```

### 📄 `docker-compose.dev-localhost.yml`
```yaml
version: '3.8'
services:
  nginx-dev:
    image: nginx:stable-alpine
    container_name: vitepress_nginx_dev
    ports:
      - "80:80"
    volumes:
      - ./nginx/dev-localhost.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - docs-dev
    networks:
      - dev-network

  docs-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: vitepress_docs_dev
    volumes:
      - .:/app
      - /app/node_modules
      - /app/apps/docs/node_modules
    command: pnpm --filter docs dev
    environment:
      - WATCHPACK_POLLING=true
    networks:
      - dev-network

networks:
  dev-network:
    driver: bridge
```

---

## 🚀 Çalıştırma Komutları Hızlı Referans

* **Klasik Dev Ortamı Başlatma:**
  ```bash
  docker compose -f docker-compose.dev.yml up -d --build
  ```
* **Statik Modu Başlatma:**
  ```bash
  pnpm --filter docs build
  docker compose -f docker-compose.static.yml up -d
  ```
* **Portsuz Canlı (Localhost) Ortamı Başlatma:**
  ```bash
  docker compose -f docker-compose.dev-localhost.yml up -d --build
  ```
