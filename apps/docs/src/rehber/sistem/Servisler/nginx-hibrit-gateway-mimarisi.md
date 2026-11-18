---
tarih: 2026-11-12
saat: 01:17
konu: "Nginx Hibrit Reverse Proxy ve Multi-Tenant Routing Mimarisi"
baglam: "apps/docs (VitePress Rehberi) / Altyapı ve Ağ Standartları"
durum: "Tamamlandı"
etiketler: [nginx, docker, reverse-proxy, multi-tenant, vitepress, devops]
---

# 🌐 Nginx Hibrit Reverse Proxy ve Gateway Mimarisi

Bu doküman, monorepo altyapımızda geliştirme ortamı (`dev.localhost`) ile sürekli çalışan canlı build ve multi-tenant SaaS yapısını (`*.localhost`) birbirine karışmadan yöneten **Nginx Gateway** mimarisini belgeler.

---

## 1. Mimari Hedef ve Ortam Ayrımı

Geliştirme sırasındaki anlık değişikliklerin kararlı derlemeleri (build) etkilememesi ve yeni eklenen servislerin sıfır konfigürasyonla yayına alınabilmesi için trafik 3 ana katmana ayrılmıştır:

| Ortam / Adres Yapısı | Hedef ve Görevi | Çalışma Mantığı |
| :--- | :--- | :--- |
| **`https://dev.localhost...`** | **Geliştirme Ortamı** | Sadece geliştirme sırasında ayağa kaldırılan HMR destekli konteynerlere (`dev.localhost/docs`, `dev.localhost/api`) yönlenir. |
| **`https://api.localhost`** *(ve özel servisler)* | **Mikroservis / Backend Katmanı** | `map` tablosunda kayıtlı Node.js servis konteynerlerine (`api_prod`, `auth_prod`) doğrudan proxy edilir. |
| **`https://<slug>.localhost`** | **Hibrit Statik & Multi-Tenant SaaS** | Önce diskte `/var/www/builds/<slug>` klasörünü arar; bulamazsa isteği otomatik olarak ana SaaS uygulamasına (`web_app_prod`) devreder. |

---

## 2. Trafik Akış ve Karar Mekanizması

Nginx, gelen her `*.localhost` isteğini aşağıdaki öncelik sırasıyla işler:

1. **SSL Zorlama (`80` -> `443`):** Tüm HTTP istekleri `mkcert` yerel sertifikalarıyla korunan HTTPS portuna aktarılır.
2. **Dinamik Docker DNS (`127.0.0.11`):** Konteyner isimleri değişken (`set $upstream`) üzerinden çözümlenerek hedef konteyner kapalı olsa dahi Nginx'in çökmesi engellenir.
3. **3 Katmanlı Hibrit Süzgeç (`try_files` + `@named_location`):**
   * **Katman 1 (`$special_service`):** İstek `api` veya `auth` gibi özel bir servise aitse doğrudan ilgili konteynere iletilir.
   * **Katman 2 (Dinamik Statik Build):** `/var/www/builds/$subdomain` dizininde statik dosya varsa doğrudan sunulur.
   * **Katman 3 (`@saas_tenant_app`):** Statik dosya yoksa istek `Host` başlığı korunarak ana SaaS uygulamasına gönderilir. Uygulama, `Host` bilgisinden (`musteri1.localhost`) aktif kiracıyı (tenant) tespit eder.

---

## 3. Tam Yapılandırma Dosyası (`dev.conf`)

```nginx
events {
    worker_connections 1024;
}

http {
    resolver 127.0.0.11 valid=5s;
    include       mime.types;
    default_type  application/octet-stream;
    charset       utf-8;

    # =========================================================================
    # 1. ÖZEL SERVİS HARİTASI (Mikroservisler)
    # =========================================================================
    map subdomain special_service {
        hostnames;
        "api"       "http://api_prod:3000";
        "auth"      "http://auth_prod:4000";
        default     "none";
    }

    # =========================================================================
    # 2. HTTP -> HTTPS Zorunlu Yönlendirme
    # =========================================================================
    server {
        listen 80;
        server_name localhost *.localhost;
        return 302 https://hostrequest_uri;
    }

    # =========================================================================
    # 3. GELİŞTİRME ORTAMI (Sadece dev.localhost)
    # =========================================================================
    server {
        listen 443 ssl;
        server_name dev.localhost;

        ssl_certificate     /etc/nginx/certs/localhost.crt;
        ssl_certificate_key /etc/nginx/certs/localhost.key;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        location = /docs { return 301 https://\$host/docs/; }
        location /docs/ {
            set \$vitepress_dev "http://vitepress_docs_dev:5173";
            proxy_pass \$vitepress_dev;

            proxy_set_header Host \$http_host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;

            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";

            proxy_intercept_errors on;
            error_page 502 503 504 = @dev_kapali;
        }

        location / {
            default_type text/plain;
            return 200 "🛠️ GELİŞTİRME ORTAMI (dev.localhost)\n- Dokümantasyon: https://dev.localhostdocs";
        }

        location @dev_kapali {
            default_type text/plain;
            return 503 "⚠️ Geliştirme konteyneri şu an aktif değil.";
        }
    }

    # =========================================================================
    # 4. HİBRİT CANLI ORTAM (Özel Servis + Dinamik Build + Multi-Tenant SaaS)
    # =========================================================================
    server {
        listen 443 ssl;
        server_name ~^(?<subdomain>.+)\.localhost\$;

        ssl_certificate     /etc/nginx/certs/localhost.crt;
        ssl_certificate_key /etc/nginx/certs/localhost.key;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_intercept_errors on;

        root /var/www/builds/\$subdomain;
        index index.html;

        location / {
            if (\$special_service != "none") {
                proxy_pass \$special_service;
                break;
            }

            try_files \$uri uri.html uri/ @saas_tenant_app;
        }

        location @saas_tenant_app {
            set \$saas_upstream "http://web_app_prod:3000";
            proxy_pass \$saas_upstream;
            error_page 502 503 504 = @saas_kapali;
        }

        error_page 502 503 504 = @servis_kapali;

        location @servis_kapali {
            default_type text/plain;
            return 503 "⚠️ '\$subdomain.localhost' mikroservisi şu an yanıt vermiyor.";
        }

        location @saas_kapali {
            default_type text/plain;
            return 503 "🏢 Multi-Tenant SaaS (\$subdomain.localhost) yönlendirmesi başarılı ancak ana uygulama konteyneri (web_app_prod) henüz başlatılmadı.";
        }
    }

    # =========================================================================
    # 5. ANA KÖK SUNUCU (Doğrudan https://localhost)
    # =========================================================================
    server {
        listen 443 ssl;
        server_name localhost;

        ssl_certificate     /etc/nginx/certs/localhost.crt;
        ssl_certificate_key /etc/nginx/certs/localhost.key;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        location / {
            default_type text/plain;
            return 200 "🚀 SaaS Monorepo Hibrit Gateway Aktif (localhost)\n- Geliştirme: https://dev.localhost\n- Mikroservis Örneği: https://api.localhost\n- SaaS Slug Örneği: https://musteri1.localhost";
        }
    }
}
```

---

## 4. Operasyon ve Bakım Komutları

* **Sözdizimi Kontrolü ve Kesintisiz Yenileme (Zero-Downtime Reload):**
  ```bash
  docker exec <nginx_konteyner_adi> sh -c "nginx -t && nginx -s reload"
  ```
* **VitePress Subpath Gereksinimi:** Geliştirme ortamında `/docs/` alt yolunun doğru yüklenmesi için `apps/docs/.vitepress/config.mts` dosyasında `base: '/docs/'` tanımı bulunmalıdır.
* **Docker Ağ Gereksinimi:** Nginx ve hedef uygulama konteynerlerinin tamamı `dev_network` dış ağına bağlı olmalıdır.

