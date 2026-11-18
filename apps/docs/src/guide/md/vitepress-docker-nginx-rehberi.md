---
tarih: 2026-11-12
saat: 17:02
konu: "VitePress Docker Geliştirme Ortamı ve Nginx Reverse Proxy Referans Kılavuzu"
baglam: "apps/docs (VitePress) / Docker, Compose, Nginx ve Monorepo Altyapısı"
durum: "Tamamlandı"
etiketler: [docker, docker-compose, dockerignore, nginx, reverse-proxy, vitepress, monorepo, pnpm, referans-rehber]
---

# 🐳 VitePress Docker Geliştirme Ortamı ve Nginx Reverse Proxy Referans Kılavuzu

Bu doküman; monorepo mimarisi içindeki **VitePress dokümantasyon uygulamasının (`apps/docs`)** Docker konteyneri üzerinde nasıl yapılandırıldığını, **Nginx Reverse Proxy (`dev.localhost/docs`)** üzerinden nasıl yönlendirildiğini, her bir komutun teknik anlamını ve yerel çalışma ortamına (dosya sistemine) etkilerini açıklayan kalıcı bir mühendislik başvuru kaynağıdır.

Altyapı dosyaları (`Dockerfile.dev`, `docker-compose.yml`, `.dockerignore`, Nginx `conf`) proje yaşam döngüsünde genellikle bir kez oluşturulup uzun süre değiştirilmeden kullanıldığı için, gelecekte yapılacak bakım ve hata ayıklama (debugging) süreçlerinde bu rehber temel alınmalıdır.

---

## 1. Mimari Genel Bakış ve Dosya Rolleri

Sistem, dört temel yapılandırma bileşeninin birbiriyle senkronize çalışması üzerine kuruludur:

| Dosya | Konum | Görev ve Sorumluluk Alanı |
| :--- | :--- | :--- |
| **`.dockerignore`** | Monorepo Kök Dizini (`/`) | İmaj oluşturulurken (build) konteynere kopyalanmaması gereken ağır veya gereksiz yerel dosyaları filtreler. |
| **`Dockerfile.dev`** | `apps/docs/Dockerfile.dev` | Uygulamanın çalışacağı izole Alpine Linux işletim sistemi imajını ve bağımlılık katmanlarını inşa eder. |
| **`docker-compose.yml`** | `apps/docs/docker-compose.yml` | Oluşturulan imajı ayağa kaldırır; yerel disk ile konteyner arasındaki canlı dosya eşitlemesini (volume) ve `dev_network` ağ iletişimini yönetir. |
| **Nginx Yapılandırması** | Reverse Proxy (`infra/nginx` veya Gateway) | `dev.localhost/docs` adresine gelen HTTP ve WebSocket (HMR) isteklerini `dev_network` üzerinden `vitepress_docs_dev:5173` konteynerine aktarır. |

---

## 2. `.dockerignore` (Build Bağlamı Filtreleme)

Docker imajı oluşturulurken `docker-compose.yml` içindeki `context: ../../` ayarı nedeniyle monorepo kök dizinindeki tüm dosyalar Docker motoruna gönderilir. `.dockerignore` dosyası, bu aktarım sırasında dışlanacak yolları belirler.

```dockerignore
node_modules
.pnpm-store
.git
.turbo
apps/**/dist
apps/**/.vitepress/dist
.next
dist
# *.conf
# certs/
```

### Satır Bazlı Teknik Analiz

* **`node_modules` ve `.pnpm-store`:** Yerel bilgisayardaki işletim sistemine (Windows/macOS) göre derlenmiş paketlerin ve önbelleklerin imaj içine kopyalanmasını engeller. Bu sayede build süresi saniyeler seviyesine iner ve konteyner içinde temiz Linux paketlerinin kurulması sağlanır.
* **`.git`:** Versiyon kontrol geçmişinin imaj katmanlarına dahil edilmesini önleyerek imaj boyutunu küçültür. *(Not: Geliştirme ortamında `.git` klasörü `docker-compose.yml` volume bağlantısı üzerinden konteynere canlı yansıdığı için VitePress `lastUpdated` özelliği sorunsuz çalışmaya devam eder.)*
* **`.turbo`, `dist`, `apps/**/dist`, `apps/**/.vitepress/dist`, `.next`:** Önceden derlenmiş statik çıktıları ve Turborepo önbelleklerini dışlayarak konteynerin eski derleme kalıntılarıyla çakışmasını önler.

---

## 3. `Dockerfile.dev` (İmaj İnşa Süreci)

`Dockerfile.dev`, `apps/docs` uygulamasının ihtiyaç duyduğu çalışma zamanı ortamını katmanlı (layered) bir yapıda oluşturur.

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

# Geliştirme komutunu Dockerfile içine gömüyoruz
CMD ["pnpm", "--filter", "docs", "dev"]
```

### Komutların Anlamları ve Kullanım Sebepleri

* **`FROM node:20-alpine`:** Standart Debian tabanlı Node imajları (~1 GB) yerine, yalnızca temel sistem araçlarını barındıran ultra hafif Alpine Linux tabanlı Node.js 20 imajını (~130 MB) temel alır.
* **`WORKDIR /app`:** Konteyner içindeki tüm sonraki komutların (`COPY`, `RUN`, `CMD`) çalışacağı varsayılan kök dizini `/app` olarak sabitler.
* **`RUN apk add --no-cache git`:** Alpine Linux varsayılan olarak `git` barındırmaz. VitePress'in sayfaların son güncellenme tarihini (`lastUpdated`) Git commit geçmişinden okuyabilmesi için `--no-cache` bayrağıyla (kurulum önbelleğini diskte tutmadan) `git` paketi yüklenir.
* **`RUN npm i -g pnpm turbo`:** Monorepo bağımlılık yönetimi için `pnpm` ve görev orkestrasyonu için `turbo` araçlarını konteyner genelinde erişilebilir kılar.
* **`COPY ./package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./` ve `COPY ./apps/docs/package.json ./apps/docs/`:** Docker'ın **Katman Önbellekleme (Layer Caching)** mekanizmasından yararlanmak için kaynak kodlardan önce yalnızca paket tanım dosyaları kopyalanır. Markdown veya kod dosyalarınız değişse dahi `package.json` değişmediği sürece Docker bir sonraki adımı tekrar çalıştırmaz, önbellekten kullanır.
* **`RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile`:**
  * `--mount=type=cache`: Docker BuildKit özelliğini kullanarak `pnpm` paket deposunu imaj katmanlarının dışında kalıcı bir önbellekte tutar. Yeni bir paket eklendiğinde tüm internet indirmeleri sıfırdan yapılmaz.
  * `--frozen-lockfile`: `pnpm-lock.yaml` dosyasındaki sürümlerin birebir kurulmasını zorunlu kılar; kilit dosyasını güncelleyerek sürüm kayması (version drift) yaşanmasını engeller.
* **`COPY . .`:** `.dockerignore` filtresinden geçen tüm monorepo kaynak kodlarını imaj içindeki `/app` dizinine kopyalar.
* **`EXPOSE 5173`:** VitePress geliştirme sunucusunun dinlediği `5173` portunu ağ katmanına dokümante eder.
* **`CMD ["pnpm", "--filter", "docs", "dev"]`:** Konteyner ayağa kalktığında çalışacak ana komuttur. Monorepo içindeki diğer uygulamaları çalıştırmadan yalnızca `docs` (`apps/docs`) paketinin geliştirme sunucusunu başlatır.

---

## 4. `docker-compose.yml` (Çalışma Zamanı ve Orkestrasyon)

Bu dosya, inşa edilen imajın yerel bilgisayarımızla ve ağdaki diğer konteynerlerle nasıl etkileşime gireceğini belirler.

```yaml
services:
  docs-dev:
    build:
      context: ../../                      # Reaches up to the monorepo root to fetch workspace lockfiles
      dockerfile: apps/docs/Dockerfile.dev # Exact path relative to the context root
    container_name: vitepress_docs_dev
    volumes:
      # Reaches up to the root to mount the workspace code into the app
      - ../../:/app
      - /app/node_modules
      - /app/apps/docs/node_modules
    environment:
      - WATCHPACK_POLLING=true
    networks:
      - dev_network

networks:
  dev_network:
    external: true
```

### Parametrelerin Anlamları ve Kullanım Sebepleri

* **`context: ../../` ve `dockerfile: apps/docs/Dockerfile.dev`:** Compose dosyası `apps/docs` alt klasöründe bulunmasına rağmen, build bağlamı iki üst dizine (monorepo köküne) çekilir. Bu sayede `Dockerfile.dev`, kök dizindeki `pnpm-workspace.yaml` ve `pnpm-lock.yaml` dosyalarına erişebilir.
* **`container_name: vitepress_docs_dev`:** Konteynere rastgele bir isim yerine sabit bir kimlik atar. Log takibi (`docker logs vitepress_docs_dev`) ve ters vekil (Nginx) yönlendirmeleri için tutarlı bir hedef adres sağlar.
* **`volumes` (Çift Yönlü Eşitleme ve `node_modules` İzolasyonu):**
  1. **`- ../../:/app` (Bind Mount):** Yerel bilgisayarınızdaki monorepo kök dizinini konteynerdeki `/app` dizinine canlı olarak bağlar. Yerel editörde yaptığınız her Markdown değişikliği anında konteynere yansır.
  2. **`- /app/node_modules` (Anonim Volume):** Kök dizindeki `node_modules` klasörünü yerel bilgisayardan izole eder. Bilgisayarınız Windows/macOS olsa dahi konteynerin kendi içinde kurduğu Alpine Linux uyumlu bağımlılıkların yerel klasör tarafından ezilmesini önler.
  3. **`- /app/apps/docs/node_modules` (Anonim Volume):** `pnpm` monorepo mimarisinde `apps/docs` paketine özel oluşturulan alt `node_modules` klasörünü de aynı şekilde koruma altına alır.
* **`WATCHPACK_POLLING=true`:** Docker volume bağlantılarında işletim sistemi seviyesindeki dosya değişim bildirimleri (inotify) her zaman konteynere iletilmeyebilir. Bu değişken, dosya sisteminin belirli aralıklarla taranmasını (polling) sağlayarak **Hot Module Replacement (HMR / Canlı Yenileme)** özelliğinin kesintisiz çalışmasını garanti eder.
* **`networks: dev_network (external: true)`:** Konteyneri izole bir varsayılan ağ yerine, sistemde daha önce oluşturulmuş olan harici `dev_network` ağına bağlar. Bu sayede Nginx konteyneri, `http://vitepress_docs_dev:5173` adresi üzerinden doğrudan bu servise trafik yönlendirebilir.

---

## 5. Nginx Reverse Proxy Yapılandırması (`dev.localhost/docs`)

`docker-compose.yml` dosyasında dış dünyaya doğrudan bir `ports` (örneğin `5173:5173`) açılmamasının temel sebebi, tüm trafiğin `dev_network` içindeki **Nginx Reverse Proxy** üzerinden tek bir giriş noktasından (Gateway) yönetilmesidir.

### 5.1. VitePress `base` ve Sunucu Ayarı (`apps/docs/.vitepress/config.mts`)

VitePress'in `/docs` alt dizini (subpath) altında varlıkları (CSS, JS) doğru yükleyebilmesi ve Docker ağı içinde dış bağlantıları kabul edebilmesi için yapılandırma dosyasında şu iki ayar bulunmalıdır:

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/docs/', // Tüm statik varlıkların /docs/ önekiyle sunulmasını sağlar
  vite: {
    server: {
      host: true,   // Konteyner içindeki 0.0.0.0 arayüzünü dinleyerek Nginx erişimine izin verir
      port: 5173,
      strictPort: true
    }
  }
})
```

### 5.2. Nginx Sunucu Bloğu (`default.conf` / `docs.conf`)

Aynı `dev_network` ağına bağlı olan Nginx konteynerinin yapılandırma dosyasına aşağıdaki `location` bloğu eklenir:

```nginx
server {
    listen 80;
    server_name dev.localhost;

    # VitePress Dokümantasyon Yönlendirmesi
    location /docs {
        # Docker iç DNS çözümlemesi (konteyner yeniden başlasa bile IP değişiminden etkilenmez)
        resolver 127.0.0.11 valid=30s;
        set $docs_upstream http://vitepress_docs_dev:5173;

        proxy_pass $docs_upstream;
        proxy_http_version 1.1;

        # Vite HMR (Hot Module Replacement) WebSocket Desteği
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standart Yönlendirme Başlıkları
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Nginx Direktiflerinin Anlamları

* **`resolver 127.0.0.11 valid=30s;` ve `set $docs_upstream ...`:** Docker'ın dahili DNS sunucusunu kullanır. Değişken (`$docs_upstream`) kullanarak yönlendirme yapmak, `vitepress_docs_dev` konteyneri kapalıyken dahi Nginx'in çökmesini engeller ve konteyner yeniden başlatıldığında değişen iç IP adresini otomatik günceller.
* **`proxy_http_version 1.1;`, `Upgrade` ve `Connection "upgrade"`:** VitePress geliştirme sunucusunun tarayıcı ile kurduğu **WebSocket** bağlantısını destekler. Bu satırlar olmadan dosya kaydettiğinizde sayfa otomatik yenilenmez (HMR çalışmaz).
* **`proxy_pass` sonunda `/` olmaması:** VitePress `base: '/docs/'` olarak ayarlandığı için gelen `/docs/...` isteğinin yolu kırpılmadan olduğu gibi VitePress sunucusuna iletilir.

---

## 6. Uçtan Uca İş Akışı (Workflow)

Geliştirme sürecinde sistemin çalışma döngüsü 5 adımda gerçekleşir:

1. **Hazırlık ve Filtreleme:** `docker compose up` komutu çalıştırıldığında Docker, `context: ../../` yoluna gider ve `.dockerignore` kurallarına göre gereksiz dosyaları ayıklayarak build bağlamını hazırlar.
2. **İmaj İnşası:** `Dockerfile.dev` okunur; önce bağımlılık dosyaları kopyalanıp `pnpm install` ile Linux uyumlu paketler konteynerin sanal diskine kurulur, ardından kaynak kodlar imaja eklenir.
3. **Volume ve Ağ Bağlantısı:** `vitepress_docs_dev` konteyneri başlatılır. Yerel kaynak kodlar `/app` dizinine bağlanırken, `node_modules` klasörleri anonim volume'ler ile izole tutulur ve konteyner `dev_network` ağına dahil edilir.
4. **Nginx Trafik Yönlendirmesi:** Tarayıcıdan `http://dev.localhost/docs` adresine istek atıldığında Nginx bu isteği yakalar ve `dev_network` üzerinden `vitepress_docs_dev:5173` adresine aktarır.
5. **Canlı Geliştirme (HMR):** Yerel bilgisayarda kaydedilen her `.md` dosyası `WATCHPACK_POLLING` sayesinde konteyner içinde anında algılanır; değişiklik WebSocket tüneli üzerinden Nginx aracılığıyla tarayıcıya yansıtılır.

---

## 7. Yerel Çalışma Ortamına (Dosya Sistemine) Etkileri

Bu yapılandırmanın yerel bilgisayarınızdaki proje klasörüne etkileri şunlardır:

* **Kaynak Kod Güvenliği:** `docker-compose.yml` yerel dosyalarınızı silmez, taşımaz veya yeniden biçimlendirmez.
* **Boş `node_modules` Klasörleri:** Yerel bilgisayarınızda hiç `pnpm install` çalıştırmamış olsanız bile, Docker anonim volume bağlama noktalarını (mount point) oluşturmak için yerel kök dizinde ve `apps/docs/` altında **içi boş** `node_modules` klasörleri oluşturabilir. Gerçek paket dosyaları yerel diskinizde değil, Docker'ın kendi sanal disk alanında (volume) depolanır.
* **Derleme ve Önbellek Çıktıları:** Konteyner çalışırken VitePress tarafından `/app/apps/docs/.vitepress/cache` altında oluşturulan geçici önbellek dosyaları, `- ../../:/app` bind mount bağlantısı nedeniyle yerel klasörünüzde de görünür. (Bu klasör `.gitignore` ve `.dockerignore` ile yönetilmelidir.)
* **Yeni Paket Ekleme Kuralı:** `apps/docs/package.json` dosyasına yeni bir bağımlılık eklendiğinde, anonim volume içindeki eski `node_modules` yapısının güncellenmesi için konteynerin yeniden inşa edilmesi gerekir:
  ```bash
  docker compose up -d --build
  ```

---

## 8. Operasyonel Komutlar (Hızlı Başvuru)

`apps/docs` dizini içerisindeyken kullanabileceğiniz temel yönetim komutları:

* **Harici Ağın Oluşturulması (İlk Kurulumda Bir Kez):**
  ```bash
  docker network create dev_network
  ```
* **Servisi Arka Planda Başlatma:**
  ```bash
  docker compose up -d
  ```
* **Bağımlılık Değişikliği Sonrası Yeniden İnşa Ederek Başlatma:**
  ```bash
  docker compose up -d --build
  ```
* **Nginx Ayarlarını Konteyneri Kapatmadan Yenileme:**
  ```bash
  docker exec <nginx_container_adi> nginx -s reload
  ```
* **Anlık VitePress Sunucu Loglarını İzleme:**
  ```bash
  docker logs -f vitepress_docs_dev
  ```
* **Konteyneri Durdurma ve Kaldırma (Anonim Volume'leri Temizleyerek):**
  ```bash
  docker compose down -v
  ```
