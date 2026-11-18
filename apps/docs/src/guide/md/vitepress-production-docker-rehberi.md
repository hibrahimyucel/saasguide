---
tarih: 2026-11-12
saat: 17:23
konu: "VitePress Production (Canlı) Ortam Dağıtım ve Multi-Stage Docker Kılavuzu"
baglam: "apps/docs (VitePress) / Production Build, Multi-Stage Dockerfile ve Statik Nginx"
durum: "Tamamlandı"
etiketler: [docker, multi-stage-build, nginx, vitepress, production, monorepo, static-hosting]
---

# 🚀 VitePress Production (Canlı) Ortam ve Multi-Stage Docker Kılavuzu

Bu doküman; monorepo mimarisi içindeki **VitePress dokümantasyon uygulamasının (`apps/docs`)** canlı (production) sunucu ortamına nasıl derleneceğini, **Multi-Stage `Dockerfile`** yapısını ve derlenen saf HTML/CSS/JS çıktılarının **Nginx** üzerinden nasıl servis edileceğini açıklayan kalıcı başvuru kaynağıdır.

Geliştirme (`dev`) ortamından farklı olarak canlı ortamda Node.js sunucusuna, kaynak kodlara veya `node_modules` klasörüne ihtiyaç duyulmaz; yalnızca derlenmiş statik dosyalar yüksek performanslı bir web sunucusu tarafından sunulur.

---

## 1. Geliştirme (Dev) ve Canlı (Production) Ortam Farkları

| Özellik | Geliştirme Ortamı (`Dockerfile.dev`) | Canlı Ortam (`Dockerfile.prod`) |
| :--- | :--- | :--- |
| **Çalışma Motoru** | Node.js (Vite Dev Server) | Nginx (Statik Dosya Sunucusu) |
| **İmaj Boyutu** | ~350 MB - 500 MB (Node + Bağımlılıklar) | ~40 MB - 50 MB (Yalnızca Alpine Nginx + HTML) |
| **Kaynak Kodlar** | Bind Mount (`- ../../:/app`) ile canlı bağlı | İmaj içinde yok (Sadece derlenen `dist` çıktısı var) |
| **Bellek (RAM) Tüketimi** | Yüksek (~200 MB+) | Çok Düşük (~5 MB - 15 MB) |
| **Güvenlik Yüzeyi** | Geliştirme araçları ve paket yöneticisi açık | Sadece statik dosya okuma yetkisi (Maksimum güvenlik) |

---

## 2. Multi-Stage `Dockerfile` (`apps/docs/Dockerfile`)

Multi-stage (çok aşamalı) Docker mimarisi; birinci aşamada Node.js kullanarak projeyi derler, ikinci aşamada ise Node.js ve tüm kaynak kodları çöpe atarak yalnızca derlenen `dist` klasörünü hafif bir Nginx imajının içine kopyalar.

```dockerfile
# ==========================================
# 1. AŞAMA: Builder (Derleme Ortamı)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# VitePress lastUpdated (son güncelleme tarihi) özelliği için Git kurulumu
RUN apk add --no-cache git

# Monorepo paket yöneticilerinin kurulumu
RUN npm i -g pnpm turbo

# Katman önbellekleme (layer caching) için önce kilit dosyalarını kopyala
COPY ./package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ./apps/docs/package.json ./apps/docs/

# Bağımlılıkları kilit dosyasına sadık kalarak kur
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Tüm monorepo kaynak kodlarını ve Git geçmişini kopyala
COPY . .

# Yalnızca docs paketini canlı ortam için statik HTML/JS/CSS olarak derle
RUN pnpm --filter docs build

# ==========================================
# 2. AŞAMA: Production (Statik Nginx Sunucusu)
# ==========================================
FROM nginx:alpine AS production

# Özel Nginx yapılandırma dosyasını konteynere kopyala
COPY ./apps/docs/nginx.conf /etc/nginx/conf.d/default.conf

# 1. aşamada üretilen derleme çıktılarını Nginx yayın dizinine aktar
COPY --from=builder /app/apps/docs/.vitepress/dist /usr/share/nginx/html/docs

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Komutların Teknik Analizi ve Kullanım Sebepleri

* **`FROM node:20-alpine AS builder`:** İlk aşamaya `builder` takma adı verilir. Tüm derleme araçları bu geçici katmanda çalışır ve nihai imaja dahil edilmez.
* **`RUN pnpm --filter docs build`:** VitePress uygulamasını derler ve tüm sayfaları statik HTML, CSS ve optimize edilmiş JavaScript dosyaları halinde `/app/apps/docs/.vitepress/dist` klasörüne çıkarır.
* **`FROM nginx:alpine AS production`:** İkinci aşama sıfırdan, yalnızca ~40 MB boyutundaki Alpine tabanlı resmi Nginx imajı ile başlatılır.
* **`COPY --from=builder ...`:** Bu dokümanın en kritik komutudur. Birinci aşamadaki (`builder`) devasa `node_modules` ve kaynak kodları geride bırakarak **yalnızca** `.vitepress/dist` klasöründeki derlenmiş statik dosyaları Nginx'in yayın dizinine kopyalar.
* **`CMD ["nginx", "-g", "daemon off;"]`:** Nginx'in arka plan yerine ön planda (foreground) çalışmasını sağlayarak Docker konteynerinin kapanmadan ayakta kalmasını garanti eder.

---

## 3. Statik Konteyner İçi Nginx Yapılandırması (`apps/docs/nginx.conf`)

Konteyner içindeki Nginx sunucusunun `/docs` alt yolunu (subpath) doğru sunabilmesi, temiz URL'leri yönetebilmesi ve statik varlıkları önbelleğe alabilmesi için kullanılan yapılandırmadır:

```nginx
server {
    listen 80;
    server_name localhost;

    # Statik dosyaların bulunduğu ana kök dizin
    root /usr/share/nginx/html;
    index index.html;

    # Gzip sıkıştırma ile sayfa yükleme hızını artırma
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # /docs alt yolu yönlendirmesi ve temiz URL (Clean URLs) desteği
    location /docs {
        try_files $uri $uri/ $uri.html /docs/404.html;
    }

    # Hash'li JS, CSS ve görsel dosyaları için uzun süreli tarayıcı önbelleği
    location ~* ^/docs/assets/.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

### Yapılandırma Detayları

* **`try_files $uri $uri/ $uri.html /docs/404.html;`:** VitePress'in ürettiği statik HTML sayfalarının URL sonunda `.html` uzantısı olmadan açılabilmesini (örneğin `/docs/rehber/kurulum`) ve bulunamayan sayfalarda VitePress'in kendi özel `404.html` sayfasının gösterilmesini sağlar.
* **`Cache-Control "public, immutable"`:** VitePress derleme sırasında `assets/` klasöründeki dosya isimlerine içerik hash'i ekler (örneğin `app.a1b2c3.js`). Bu kural sayesinde tarayıcılar bu dosyaları 1 yıl boyunca önbellekte tutar ve tekrar sunucuya sormaz.

---

## 4. Canlı Ortam `docker-compose.prod.yml` ve Gateway Entegrasyonu

Tek bir VPS sunucusu üzerinde çalışan hibrit veya tam konteynerize mimaride, canlı dokümantasyon servisi dış ağa (`prod_network`) bağlanarak ana Nginx Reverse Proxy arkasında konumlandırılır:

```yaml
services:
  docs-prod:
    build:
      context: ../../
      dockerfile: apps/docs/Dockerfile
    container_name: vitepress_docs_prod
    restart: always
    networks:
      - prod_network

networks:
  prod_network:
    external: true
```

### Ana Reverse Proxy (Gateway) Yönlendirmesi

Sunucu önündeki ana Nginx katmanında gelen `/docs` istekleri doğrudan bu hafif konteynere aktarılır:

```nginx
location /docs {
    proxy_pass http://vitepress_docs_prod:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 5. Kritik Dikkat Noktaları (`.dockerignore` ve `base` Ayarı)

Canlı imaj oluştururken en sık karşılaşılan iki hatayı önlemek için şu kontroller yapılmalıdır:

1. **`.git` Klasörü ve `lastUpdated` Özelliği:**
   * Eğer `apps/docs/.vitepress/config.mts` içinde `lastUpdated: true` aktifse, derleme sırasında VitePress Git geçmişine ihtiyaç duyar.
   * Kök dizindeki `.dockerignore` dosyasında `.git` satırı bulunuyorsa, canlı build öncesinde `.git` satırı kaldırılmalı veya Git geçmişi imaja dahil edilmelidir. Aksi halde sayfalarda son güncellenme tarihi görünmez.
2. **VitePress `base` Yolu Eşleşmesi:**
   * `apps/docs/.vitepress/config.mts` dosyasında `base: '/docs/'` tanımının bulunduğundan emin olunmalıdır. Bu ayar, derlenen HTML içindeki tüm CSS ve JS bağlantılarının `/docs/assets/...` ön ekiyle üretilmesini sağlar.

---

## 6. Canlı Ortam Dağıtım (Deployment) Komutları

Yeni dokümantasyon güncellemelerini canlı sunucuya almak için uygulanan standart dağıtım adımları:

* **Yeni Canlı İmajı İnşa Etme ve Sıfır Kesintiyle Güncelleme:**
  ```bash
  docker compose -f apps/docs/docker-compose.prod.yml up -d --build
  ```
* **Kullanılmayan Eski İmaj Katmanlarını Temizleme (Disk Tasarrufu):**
  ```bash
  docker image prune -f
  ```
* **Canlı Konteyner Durumunu ve Boyutunu Kontrol Etme:**
  ```bash
  docker ps --filter "name=vitepress_docs_prod"
  docker images | grep docs
  ```
