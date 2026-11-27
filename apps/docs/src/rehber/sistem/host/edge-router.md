---
title: "NGINX Reverse Proxy ve Edge Router Kurulumu"
description: "πr² Cloud yerel ve hibrit geliştirme ortamı için Docker ağ izolasyonu, Wildcard TLS sonlandırma ve NGINX ters vekil kurulumu."
outline: [2, 3]
sidebarTitle: "Nginx - Ağ Arayüzü"
index: 40
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
  
## Docker - Ortak Ağ

Docker, `compose` dosyalarında tanımlı ağları konteyner özelinde otomatik oluşturmaya çalışır. Farklı `docker-compose` dosyalarındaki konteynerlerin birbiriyle ve Nginx ile konuşabilmesi için ortak harici (`external`) ağları oluşturuyoruz. 

 `pr2_internal_net` ağı `internal: true` parametresiyle dış internete tamamen kapalıdır. Nginx ters vekili yalnızca `pr2_edge_net` üzerinde çalışırken, Dex, MinIO, Gitea ve veritabanları iç ağda izole edilir; API katmanı her iki ağa bağlanarak kontrollü köprü görevi görür.

::: tip Ağ Oluşturma
Aşağıdaki komutları çalıştırarak her iki ağı oluşturun. 
```bash
docker network create pr2_edge_net
docker network create --internal pr2_internal_net
```
:::
 
  
## Dosyalar

- Yapılandırma dosyaları için klasör oluşturuyoruz.

```bash
  cd ~/pr2cloud
  mkdir -p data/wwwroot
  mkdir -p source/infra/gateway/nginx/{conf.d,snippets}
```

```text
📁 gateway                        # Edge Router-Reverse Proxy klasörü. 
├── 📁 nginx                      # NGINX yapılandırma klasörü
│   ├── 📁 conf.d                 # NGINX klasördeki tüm yapılandırmaları tarar ve birleştirir.
│   │   ├── 📄 00-resolver.conf   # Docker DNS
│   │   ├── 📄 01-default.conf    # DuckDNS alan adınız burada karşılanır 
│   │   ├── 📄 02-main.conf       # main alt alan adı.
│   │   ├── 📄 auth.conf          # Dex SSO
│   │   ├── 📄 db.conf            # phpmyadmin
│   │   ├── 📄 gitea.conf         # Gitea
│   │   └── 📄 minio.conf         # SILO S3
│   └── 📁 snippets               # Kod şablonları 
│       ├── 📄 proxy-headers.conf # Header parametreleri
│       └── 📄 ssl-params.conf    # TSL parametreleri
└── 📄 docker-compose.yml         # Docker konteyner yapılandırma dosyası

```

- **Ortak Standartların İzolasyonu (`snippets/`):** SSL sertifika yolları veya proxy başlıkları gibi her serviste aynı olan ayarlar tekrar yazılmaz. Ortam değişikliğinde (örneğin yerelden canlı sunucuya geçişte) yalnızca ilgili snippet dosyasının güncellenmesi yeterlidir.

- **Servis Bazlı Esneklik (`conf.d/`):** Bir servise özel güvenlik veya performans kuralları genel şablonlara dahil edilmez. Örneğin Gitea'nın büyük Docker katmanlarını kabul etmesi için gereken `client_max_body_size 0;` ayarı yalnızca `gitea.conf` içinde tanımlanır.

- **Dinamik DNS Çözümlemesi:** Docker konteynerleri yeniden başlatıldığında IP adresleri değişebileceğinden, `upstream` adresleri doğrudan `proxy_pass` içine yazılmak yerine değişken (`set $upstream ...`) olarak tanımlanır ve Docker dahili DNS sunucusu (`127.0.0.11`) ile çözümlenir.


### TLS Snippets

- `infra/gateway/nginx/snippets/ssl-params.conf`; `pr2cloud.duckdns.org` kendi alan adınızla değiştirin. Yapılandırma dosyaları sunucunun tek alan adı ile çalışacağı varsayımına göre hazırlanmıştır.

<DynamicSnippet title="DuckDNS Alan Adınız" >

```nginx
# SSL Sertifika Yolları
ssl_certificate     /etc/letsencrypt/live/<-DOMAIN->/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/<-DOMAIN->/privkey.pem;

# Kök domain (pr2cloud.duckdns.org) ve alt alan adları (*.pr2cloud.duckdns.org) dışındaki istekleri kes
# if ($host !~* ^(.*\.)?<-DUCKDNS_SUBDOMAIN->\.duckdns\.org$) {
#    return 444;
# }

# Modern TLS Protokol ve Şifreleme Standartları
ssl_protocols       TLSv1.2 TLSv1.3;
ssl_ciphers         HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache   shared:SSL:10m;
ssl_session_timeout 1d;

```
</DynamicSnippet>

### Proxy Headers

- `infra/gateway/nginx/snippets/proxy-headers.conf`

```nginx
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

### Docker DNS Resolver

Docker dahili DNS çözümlemesi; çalışmayan veya aktif olmayan servisler sebebiyle  Nginx'in çökmesini engellemek için `infra/gateway/nginx/conf.d/00-resolver.conf` 
 

```nginx
#Docker dahili DNS sunucusunu aktif eder ve IP önbelleğini 5 saniyede bir tazeler

resolver 127.0.0.11 valid=5s ipv6=off;
```

### HTTP+S - Subdomains

- Tüm HTTP isteklerini HTTPS'e yönlendir `infra/gateway/nginx/conf.d/01-default.conf`.

```nginx
# 1. Tüm geçerli HTTP isteklerini HTTPS'e yönlendir
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    return 301 https://$host$request_uri;
}

# 2. Özel bir .conf dosyası olmayan tüm *.pr2cloud.duckdns.org isteklerini karşıla
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    http2 on;
    server_name _;

    include /etc/nginx/snippets/ssl-params.conf;

    # Tailscale VPN erişim kısıtlaması
    # allow 100.64.0.0/10;
    # deny all;

    add_header X-Resolved-Host $host always;

    root /var/www/wwwroot;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
### `main` alt alan adı

Kök alan adına gelen istekler main'e yönlendirilir, `infra/gateway/nginx/conf.d/02-main.conf`.

<DynamicSnippet title="DuckDNS Alan Adınız" >

```nginx
# Kök alan adına (pr2cloud.duckdns.org) gelen istekleri main. alt alan adına yönlendir
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name <-DOMAIN->;

    include /etc/nginx/snippets/ssl-params.conf;

    return 301 https://main.<-DOMAIN->$request_uri;
}
```
</DynamicSnippet>


### index.html 

Gelen alt alan adını (*.) otomatik çözümleyen, aktif protokolü/yolu gösteren ve ekosistemdeki temel servislere (main., docs., dev., git.) hızlı geçiş kartları sunan tek dosyalık, harici bağımlılığı olmayan `pr2cloud/data/wwwroot/index.html` dosyası.

::: details index.html
```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>pr2cloud — Gateway & Alt Alan Adı Çözümleyici</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --success: #22c55e;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .container {
      width: 100%;
      max-width: 680px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .brand {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .brand span {
      color: var(--accent);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: rgba(34, 197, 94, 0.15);
      color: var(--success);
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .info-box {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
    }

    .info-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 0.35rem;
    }

    .info-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.95rem;
      color: var(--accent);
      word-break: break-all;
    }

    .notice {
      font-size: 0.875rem;
      color: var(--muted);
      line-height: 1.5;
      margin-bottom: 1.75rem;
      padding: 0.85rem 1rem;
      background: rgba(56, 189, 248, 0.08);
      border-left: 3px solid var(--accent);
      border-radius: 4px;
    }

    .section-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .service-link {
      display: block;
      text-decoration: none;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.85rem;
      color: var(--text);
      transition: border-color 0.15s ease, transform 0.15s ease;
    }

    .service-link:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }

    .service-name {
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 0.2rem;
    }

    .service-sub {
      font-size: 0.75rem;
      color: var(--muted);
      font-family: monospace;
    }
  </style>
</head>
<body>
  <main class="container">
    <header class="header">
      <div class="brand">πr² <span>cloud</span> Gateway</div>
      <div class="badge"><span class="dot"></span> TLS & Proxy Aktif</div>
    </header>

    <section class="info-grid">
      <div class="info-box">
        <div class="info-label">Çözümlenen Host</div>
        <div class="info-value" id="resolved-host">-</div>
      </div>
      <div class="info-box">
        <div class="info-label">Alt Alan Adı (Subdomain)</div>
        <div class="info-value" id="resolved-sub">-</div>
      </div>
      <div class="info-box">
        <div class="info-label">Protokol & Yol</div>
        <div class="info-value" id="resolved-path">-</div>
      </div>
    </section>

    <p class="notice" id="status-message">
      İstek Nginx Reverse Proxy tarafından başarıyla karşılandı.
    </p>

    <div class="section-title">Platform Servisleri</div>
    <nav class="links-grid" id="service-links"></nav>
  </main>

  <script>
    (function () {
      const host = window.location.hostname;
      const protocol = window.location.protocol.replace(":", "").toUpperCase();
      const path = window.location.pathname + window.location.search;

      // Alan adını parçalayarak subdomain ve kök domaini bul
      const parts = host.split(".");
      const isDuckDns = host.endsWith(".duckdns.org");
      const rootPartsCount = isDuckDns ? 3 : 2;
      const subdomain = parts.length > rootPartsCount
        ? parts.slice(0, parts.length - rootPartsCount).join(".")
        : "(kök alan adı)";
      const rootDomain = parts.slice(-rootPartsCount).join(".");

      document.getElementById("resolved-host").textContent = host;
      document.getElementById("resolved-sub").textContent = subdomain;
      document.getElementById("resolved-path").textContent = `${protocol} ${path}`;

      const statusEl = document.getElementById("status-message");
      if (subdomain === "main") {
        statusEl.textContent = "Ana Gateway (main.) giriş noktasındasınız. Tüm altyapı servislerine aşağıdan erişebilirsiniz.";
      } else {
        statusEl.textContent = `"${subdomain}" alt alan adı için özel bir servis tanımlı değil; istek varsayılan Wildcard Gateway tarafından çözümlendi.`;
      }

      // Kök domaini dinamik kullanarak servis bağlantılarını oluştur
      const services = [
        { name: "Ana Portal", sub: "main" },
        { name: "Dokümantasyon", sub: "docs" },
        { name: "Dev Önizleme", sub: "dev" },
        { name: "Git & Registry", sub: "gitea" }
      ];

      const nav = document.getElementById("service-links");
      services.forEach((svc) => {
        const a = document.createElement("a");
        a.className = "service-link";
        a.href = `https://${svc.sub}.${rootDomain}`;
        a.innerHTML = `
          <div class="service-name">${svc.name}</div>
          <div class="service-sub">${svc.sub}.*</div>
        `;
        nav.appendChild(a);
      });
    })();
  </script>
</body>
</html>
```
:::

### Docker compose 

Nginx konteyner yapılandırması `infra/gateway/docker-compose.yml`. 

```yaml
name: pr2_gateway
services:
  nginx-gateway:
    image: nginx:1.27-alpine
    container_name: pr2-gateway
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro,z
      - ./nginx/snippets:/etc/nginx/snippets:ro,z
      - ../certbot/conf:/etc/letsencrypt:ro,z
      - ../../../data/wwwroot:/var/www/wwwroot:ro,z
    networks:
      - pr2_edge_net

networks:
  pr2_edge_net:
    external: true
```

---

## Test
::: info Test

`infra/gateway/` klasöründe Docker Nginx servisini çalıştırıp test ediyoruz.
   
```bash
   cd infra/gateway
   docker compose up
```

 - Servisi durdurmak için

```bash
   docker compose down
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





