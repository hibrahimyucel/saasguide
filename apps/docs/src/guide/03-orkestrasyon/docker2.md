# Uygulama

## 🛠️ Ortak Dosyalar

Tüm senaryolarda Docker'ın gereksiz yer kaplamasını önlemek için projenin **kök dizininde (root)** bir `.dockerignore` dosyası bulunmalıdır.

::: details `.dockerignore`
```text
node_modules
.pnpm-store
.git
.turbo
apps/**/dist
apps/**/.vitepress/dist
.next
```
:::


## 1️⃣ Dev-Server

Bu yapılandırma, uygulamayı belirli bir port (`8080`) ve alt yol (`/saasguide/`) üzerinden çalıştırır. Monoreponuza ileride yeni frontend veya backend projeleri eklemek istediğinizde en esnek ve genişletilebilir yapıdır. **Rehbere bu yapı ile devam edeceğiz.**

::: details `nginx/dev.conf`
```nginx
server {
    listen 80;
    server_name localhost;

    # Docker dahili DNS çözücüsü (502'yi önlemek için kritik)
    resolver 127.0.0.11 valid=5s;

    location / {
        set $upstream http://vitepress_docs_dev:5173;
        proxy_pass $upstream;
        
        # Standart proxy başlıkları
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket / HMR desteği
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_cache_bypass $http_upgrade;
        
        # Yanıt sürelerini esnetin (VitePress'in derlenirken geç kalma ihtimaline karşı)
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}

```
:::

::: details `infra/Dockerfile.dev` 
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Alpine Linux için Git paketini yüklüyoruz
RUN apk add --no-cache git

RUN npm i -g pnpm turbo

COPY ./package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ./apps/docs/package.json ./apps/docs/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

```

:::


::: details `docker-compose.dev.yml`
```yaml

services:
  nginx-dev:
    image: nginx:stable-alpine
    container_name: vitepress_nginx_dev
    ports:
      - "80:80" # Bilgisayarın 80 portunu bağladık
    volumes:
      - ./nginx/dev.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - docs-dev
    networks:
      - dev-network

  docs-dev:
    build:
      context: ..
      dockerfile: infra/Dockerfile.dev
    container_name: vitepress_docs_dev
    # Dışarıya ayrıca port açmıyoruz (Örn: "5173:5173" Varsa KALDIRIN), Nginx üzerinden geçecek
    volumes:
      - ..:/app
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
:::

 - Çalıştır
```
docker compose -f infra/docker-compose.dev.yml up --build -d
```
 
 - Test
 
 Tüm istekler `vitepress_docs_dev:5173` adresine yönlendirildiği için [http://localhost](http://localhost) çalışır.
 
 [http://localhost/saasguide/](http://localhost/saasguide/)
```
curl -I http://localhost/
```
 
 - Durdur
```
docker compose -f infra/docker-compose.dev.yml down
```



## 2️⃣ Statik

Bu yapılandırmada Docker içinde paket kurulumu yapılmaz. Uygulama yerel makinenizde derlenir (`build`) ve oluşan `dist` klasörü doğrudan Nginx'e bağlanır. Docker imaj build süresi **0 saniyedir**. Dosya değişikliklerini izlemek için `chokidar` kullanabilirsiniz.

 - `/apps/docs/src/.vitepress/config.ts` içindeki `base` parametresi kök dizini göstermelidir.

```
base: "/"
```

::: details `infra/nginx/static.conf`
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
:::

::: details `infra/docker-compose.static.yml`
```yaml
services:
  nginx-static:
    image: nginx:stable-alpine
    container_name: vitepress_nginx_static
    ports:
      - "80:80"
    volumes:
      - ../apps/docs/src/.vitepress/dist:/usr/share/nginx/html:ro,z
      - ./nginx/static.conf:/etc/nginx/conf.d/default.conf:ro,z
```
:::

 - İzleme aracı kullanacaksanız. 
```
pnpm --filter docs add chokidar -D
```

::: details `apps/docs/package.json` (Watch Script Eki)
```json
"scripts": {
  "build": "vitepress build src",
  "build:watch": "chokidar "src/**/*.md" "src/**/*.ts" -c "pnpm build" --initial"
}
```
:::
*Geliştirme yaparken tek yapmanız gereken yerelde `pnpm --filter docs run build:watch` komutunu açık bırakmaktır.*


 - Çalıştır
```
pnpm --filter docs build
docker compose -f infra/docker-compose.static.yml up --build -d
```
 
 - Test  [**`http://localhost`**](http://localhost) 
```
curl -I http://localhost/
```
 
 - Durdur
```
docker compose -f infra/docker-compose.static.yml down
```

## 3️⃣ Dev Server - localhost

Bu yapılandırma, geliştirici deneyimi en yüksek olan kurgudur. Uygulama Docker içinde çalışır, **Hot-Reload aktiftir** ve tarayıcıda hiçbir port veya alt klasör eki yazmadan doğrudan [**`http://localhost`**](http://localhost) yazarak dokümantasyonunuza erişebilirsiniz.

::: details `infra/nginx/dev-localhost.conf`
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
:::

::: details `apps/docs/.vitepress/config.ts` (Kritik HMR Ayarı)
`base` ve `vite` ayarları :
```typescript
import { defineConfig } from "vitepress";
import { generateDynamicSidebar } from "./sidebar";

export default defineConfig({

  base: "/",
  vite: {
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true, // Port çakışırsa 5174'e geçmesini engeller ve hata verir
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        clientPort: 80
      }
    }
  },
  
  title: "SaaS-VPS Rehberi",
```
:::

::: details `infra/Dockerfile.dev` *dev-server* ile aynı
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Alpine Linux için Git paketini yüklüyoruz
RUN apk add --no-cache git

RUN npm i -g pnpm turbo

COPY ./package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ./apps/docs/package.json ./apps/docs/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173
```

:::


::: details `infra/docker-compose.dev-localhost.yml`
```yaml
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
      context: ..
      dockerfile: infra/Dockerfile.dev
    container_name: vitepress_docs_dev
    volumes:
      - ..:/app
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
:::

 - Çalıştır
```
docker compose -f infra/docker-compose.dev-localhost.yml up --build -d
```
 
 - Test  [**`http://localhost`**](http://localhost) 
```
curl -I http://localhost/
```
 
 - Durdur
```
docker compose -f infra/docker-compose.dev-localhost.yml down
```

---

  ```
