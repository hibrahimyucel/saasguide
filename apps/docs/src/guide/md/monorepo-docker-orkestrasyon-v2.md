---
tarih: 2026-11-12
saat: 18:42
konu: "Monorepo Docker Orkestrasyon, Önbellek (Cache) ve Standart Servis Şablonları"
baglam: "Monorepo Altyapısı / Docker Compose, PNPM Workspace ve Servis Şablonları"
durum: "Tamamlandı"
etiketler: [docker, docker-compose, monorepo, pnpm, buildkit-cache, orkestrasyon, sablon]
---

# 🏗️ Monorepo Docker Orkestrasyon, Önbellek ve Standart Servis Şablonları

Bu doküman; monorepo mimarisi içindeki birden fazla uygulamanın (`apps/docs`, `apps/web`, `apps/backend-api` vb.) Docker üzerinde nasıl yönetileceğini, önbellek (cache) davranışlarını, göreceli yol (`path`) çözümleme kurallarını ve standart yapılandırma şablonlarını açıklayan kalıcı bir mühendislik başvuru kaynağıdır.

---

## 1. Tek `docker-compose.yml` mi, Proje Bazlı Ayrı Dosyalar mı?

Monorepo mimarisinde her iki yaklaşım da kullanılabilir; ancak karar verirken **Docker BuildKit önbellek mantığı** ve **servis bağımsızlıkları** dikkate alınmalıdır.

### Paketler Her Build İçin Ayrı Ayrı Mı İndirilir?

**Hayır.** Paketlerin yeniden indirilip indirilmeyeceği `docker-compose.yml` dosyalarının sayısına değil, Docker'ın katman önbelleğine ve BuildKit store yapılandırmasına bağlıdır:

* **Ortak BuildKit Store Cache (`--mount=type=cache`):** `Dockerfile` dosyalarında kullanılan `RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store` komutu, indirilen tüm paketleri Docker motorunun kalıcı disk önbelleğinde saklar. İster 1 tane, ister 5 tane farklı `docker-compose.yml` dosyası olsun; hepsi aynı `id=pnpm` önbelleğini paylaşır.
* **Katman Önbelleği (Layer Cache):** Tüm servisler monorepo kök dizinindeki (`context: ../../`) `pnpm-lock.yaml` ve `package.json` dosyalarını kopyaladığı için, kilit dosyası değişmediği sürece Docker `pnpm install` adımını sıfırdan çalıştırmaz ve doğrudan önbellekten (`CACHED`) geçer.

### Mimari Karşılaştırma Tablosu

| Kriter | Kök Dizinde Tek `docker-compose.yml` | Proje Bazlı Ayrı `docker-compose.yml` |
| :--- | :--- | :--- |
| **Paket İndirme & Cache** | Ortak BuildKit önbelleğini kullanır, paketler tekrar indirilmez. | Ortak BuildKit önbelleğini kullanır, paketler tekrar indirilmez. |
| **Orkestrasyon ve Başlatma** | Tek komutla (`docker compose up`) tüm sistemi ayağa kaldırır. | Her servisi kendi klasöründen veya merkezi `pnpm` scriptleri ile başlatır. |
| **Ağ (Network) Yönetimi** | Tüm servisler otomatik olarak aynı iç ağda yer alır. | Servislerin haberleşmesi için her dosyada harici ağ (`dev_network`) tanımlanır. |
| **İzolasyon ve Odaklanma** | Servis sayısı arttıkça dosya büyür ve karmaşıklaşır. | Her uygulamanın (`apps/*`) yapılandırması kendi klasöründe izole ve sade kalır. |

---

## 2. Göreceli Yol (`Path`) ve `-f` Parametresi Kuralları

Alt klasörlerdeki `docker-compose.yml` dosyalarını kök dizinden `-f` parametresiyle çalıştırırken Docker Compose'un yol çözümleme kurallarına dikkat edilmelidir.

### Temel Çözümleme Kuralı
* Docker Compose, tüm göreceli (relative) yolları komutu çalıştırdığınız terminal dizinine göre değil, **ilk `-f` parametresinde belirtilen YAML dosyasının bulunduğu klasöre göre** çözümler.
* Örneğin kök dizindeyken `docker compose -f apps/docs/docker-compose.yml up` çalıştırıldığında, dosya içindeki `context: ../../` ve `- ../../:/app` tanımları `apps/docs/` klasöründen iki üst dizine çıkarak monorepo kökünü doğru şekilde bulur.

### Dikkat Edilmesi Gereken Path Sorunları ve Çözümleri

* **Çoklu Dosya Birleştirme (`-f dosya1.yml -f dosya2.yml`):** İki farklı dizindeki compose dosyasını aynı anda `-f` ile birleştirirseniz, ikinci dosyadaki göreceli yollar kendi klasörüne göre değil, **ilk `-f` dosyasının bulunduğu klasöre göre** hesaplanır. Farklı dizinlerdeki dosyalar `-f` ile birleştirilmemelidir.
* **Ortak `.env` Dosyası Konumu:** Compose dosyası alt klasördeyken Docker varsayılan olarak `.env` dosyasını da o alt klasörde arar. Kök dizindeki ortak `.env` dosyasını kullanmak için `env_file: ../../.env` tanımı eklenmeli veya komut `--env-file .env` bayrağıyla çalıştırılmalıdır.
* **Proje İsim Çakışması (Project Name Collision):** Farklı projelerde aynı alt klasör adları (örneğin `apps/web/docker` ve `apps/api/docker`) kullanılırsa Docker her ikisine de aynı proje adını atayarak konteynerleri birbirinin üzerine yazabilir. Bunu önlemek için her compose dosyasına benzersiz `container_name` ve gerekirse üst seviyede `name:` tanımı verilmelidir.

---

## 3. Standart `package.json` Orkestrasyon Şablonları

Monorepo altındaki tüm uygulamaların tutarlı ve tek merkezden yönetilebilmesi için aşağıdaki standart script yapısı kullanılır.

### A. Alt Projeler İçin Standart Şablon (`apps/<proje>/package.json`)

Her alt proje kendi klasöründeki `docker-compose.yml` dosyasını yönetmek için aşağıdaki standart script bloğunu barındırır:

```json
{
  "name": "docs",
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "docker:up": "docker compose up -d",
    "docker:build": "docker compose up -d --build",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f"
  }
}
```

### B. Kök Dizin Orkestrasyon ve Ağ Kontrol Şablonu (`/package.json`)

Tüm servisler paralel başlatılmadan önce ortak `dev_network` ağının sistemde var olduğundan emin olunmalıdır. Kök dizindeki `package.json` dosyasına eklenen `docker:network` kontrol komutu, ağ mevcutsa sessizce geçer, yoksa otomatik oluşturur:

```json
{
  "scripts": {
    "docker:network": "docker network inspect dev_network >/dev/null 2>&1 || docker network create dev_network",
    
    "docker:all:up": "pnpm docker:network && pnpm --parallel --filter "./apps/*" docker:up",
    "docker:all:build": "pnpm docker:network && pnpm --parallel --filter "./apps/*" docker:build",
    "docker:all:down": "pnpm --parallel --filter "./apps/*" docker:down",

    "docker:docs:up": "pnpm docker:network && pnpm --filter docs docker:up",
    "docker:docs:down": "pnpm --filter docs docker:down"
  }
}
```

*(Not: Windows CMD/PowerShell ve Linux/macOS terminallerinde tam çapraz platform uyumluluğu için `docker:network` satırı `"docker network create dev_network 2>nul || true"` olarak da kullanılabilir.)*

---

## 4. Standart Uygulama Şablonları (`Dockerfile.dev` & `docker-compose.yml`)

Monorepo içindeki diğer uygulamalar için mevcut mimariyle %100 uyumlu, ortak BuildKit önbelleğini (`id=pnpm`) ve `dev_network` ağını kullanan standart geliştirme şablonları aşağıdadır.

### A. Front-End Uygulaması (`apps/web`) Şablonları

#### `apps/web/Dockerfile.dev`
```dockerfile
FROM node:20-alpine
WORKDIR /app

RUN npm i -g pnpm turbo

# Önce yalnızca paket ve kilit dosyalarını kopyalayarak katman önbelleğini koruyoruz
COPY ./package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ./apps/web/package.json ./apps/web/

# Ortak pnpm store önbelleği ile paketleri kuruyoruz
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

# Paket adına göre (örn: web) geliştirme sunucusunu başlatıyoruz
CMD ["pnpm", "--filter", "web", "dev"]
```

#### `apps/web/docker-compose.yml`
```yaml
services:
  web-dev:
    build:
      context: ../../
      dockerfile: apps/web/Dockerfile.dev
    container_name: monorepo_web_dev
    volumes:
      - ../../:/app
      - /app/node_modules
      - /app/apps/web/node_modules
    environment:
      - WATCHPACK_POLLING=true
      - CHOKIDAR_USEPOLLING=true
    networks:
      - dev_network

networks:
  dev_network:
    external: true
```

### B. Node.js Back-End API (`apps/backend-api`) Şablonları

#### `apps/backend-api/Dockerfile.dev`
```dockerfile
FROM node:20-alpine
WORKDIR /app

RUN npm i -g pnpm turbo

COPY ./package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ./apps/backend-api/package.json ./apps/backend-api/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .

EXPOSE 4000

# Paket adına göre (örn: backend-api) watch/dev modunda başlatıyoruz
CMD ["pnpm", "--filter", "backend-api", "dev"]
```

#### `apps/backend-api/docker-compose.yml`
```yaml
services:
  backend-api-dev:
    build:
      context: ../../
      dockerfile: apps/backend-api/Dockerfile.dev
    container_name: monorepo_backend_api_dev
    volumes:
      - ../../:/app
      - /app/node_modules
      - /app/apps/backend-api/node_modules
    env_file:
      - ../../.env
    environment:
      - NODE_ENV=development
    networks:
      - dev_network

networks:
  dev_network:
    external: true
```

---

## 5. Yeni Bir Servis Eklerken Değiştirilecek 4 Nokta (Kontrol Listesi)

Monorepo yapısına ileride yeni bir uygulama (`apps/<yeni-servis>`) eklemek istediğinizde yukarıdaki şablonlarda yalnızca şu 4 alanı güncellemeniz yeterlidir:

* **`Dockerfile.dev` İçinde:**
  1. `COPY ./apps/<yeni-servis>/package.json ./apps/<yeni-servis>/`
  2. `EXPOSE <port-numarasi>`
  3. `CMD ["pnpm", "--filter", "<package.json-name>", "dev"]`
* **`docker-compose.yml` İçinde:**
  4. `container_name` ve `volumes` altındaki `- /app/apps/<yeni-servis>/node_modules` izolasyon yolu.

---

## 6. Operasyonel Yönetim Komutları

Kök dizin içerisindeyken tüm monorepo servislerini yönetmek için kullanabileceğiniz temel komutlar:

* **Tüm Uygulamaları Paralel Olarak Ayağa Kaldırma:**
  ```bash
  pnpm docker:all:up
  ```
* **Tüm Uygulamaların İmajlarını Yeniden İnşa Ederek Başlatma:**
  ```bash
  pnpm docker:all:build
  ```
* **Sadece Tek Bir Uygulamayı (Örn: Docs) Başlatma:**
  ```bash
  pnpm docker:docs:up
  ```
* **Tüm Uygulamaları Durdurma ve Kaldırma:**
  ```bash
  pnpm docker:all:down
  ```
