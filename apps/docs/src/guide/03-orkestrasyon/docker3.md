
# SSL & Subdomains

Öncelikle geliştirme ortamımız için SSL sertifikası üretim iletişim protoklünü HTTPS yapıyoruz.

Bu rehber; yerel geliştirme ortamınızda (localhost) Nginx kullanarak dinamik subdomain'ler oluşturmayı, konteynerler kapalı olsa bile Nginx'in çökmesini engellemeyi (`map` mimarisi) ve `mkcert` ile yerel HTTPS/SSL sertifikasyonu kurgulamayı adım adım açıklar.

---

## 🛠️ Güvenli Yerel SSL (`mkcert`)

Tarayıcıların subdomain'ler arasında çerez (cookie) kısıtlaması yapmaması ve prodüksiyon simülasyonu için `*.localhost` adresine geçerli bir SSL sertifikası üretmemiz gerekir.

1. **mkcert aracını yükleyin:**

```bash
sudo dnf install -y nss-tools curl

curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert
mkcert -version

```

2. **Yerel Kök Sertifika Otoritesini (CA) bilgisayarınıza yükleyin:**
   
```bash
   mkcert -install
```

3. **Localhost ve Wildcard Subdomain için `nginx/certs/` klasöründe sertifikaları üretin:**
   
```bash
   mkdir -p infra/nginx/certs/
   cd infra/nginx/certs/
   mkcert -cert-file localhost.crt -key-file localhost.key "*.localhost" localhost 127.0.0.1 ::1
```

---

## 📦 1. Docker Orkestrasyonu (Ortak Harici Ağ)

Docker, `compose` dosyalarında tanımlı ağları konteynır özelinde otomatik oluşturmaya çalışır. Farklı `docker-compose` dosyalarındaki konteynerlerin birbiriyle ve Nginx ile konuşabilmesi için ortak bir harici (`external`) ağ oluşturuyoruz. 

```bash
docker network create dev_network
```

### Proje A: Backend (`/projects/backend/docker-compose.yml`)
```yaml
version: '3.8'

services:
  backend_app:
    image: node:18-alpine # veya kendi uygulamanızın imajı
    container_name: backend_konteyner
    # container içindeki çalışma portu (örn: 3000) dışa açılmasına gerek yok
    expose:
      - "3000" 
    networks:
      - default

networks:
  default:
    name: dev_network
    external: true
```

### Proje B: Ön Yüz & Nginx (`/projects/frontend/docker-compose.yml`)
```yaml
version: '3.8'

services:
  nginx_proxy:
    image: nginx:alpine
    container_name: nginx_proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro # mkcert ile üretilen sertifikalar
    networks:
      - default

networks:
  default:
    name: ortak_ag
    external: true
```

---

## ⚙️ 2. Nginx Kesintisiz `map` Yapılandırması (`nginx.conf`)

Aşağıdaki mimari sayesinde `backend_konteyner` kapalı veya çökük olsa bile Nginx başlamayı reddetmez. Docker'ın dahili DNS sunucusu (`127.0.0.11`) sayesinde istek anında dinamik çözümleme yapılır.

```nginx
events {
    worker_connections 1024;
}

http {
    # Docker'ın dahili DNS sunucusu (Dinamik IP keşfi için zorunlu)
    resolver 127.0.0.11 valid=5s;

    # ----------------------------------------------------
    # GLOBAL SUBDOMAIN YÖNLENDİRME TABLOSU (Routing Map)
    # ----------------------------------------------------
    map \(http_host\)backend_target {
        hostnames; # Wildcard ve domain eşleşmelerini aktif eder

        # İSTEK YAPILAN SUBDOMAIN   ->   GİDECEĞİ DOCKER KONTEYNERİ & İÇ PORTU
        "api.localhost"                 "https://backend_konteyner:3000";
        "dashboard.localhost"           "http://dashboard_konteyner:5000";
        
        # Varsayılan Hedef (Hiçbir subdomain uyuşmazsa)
        default                         "http://127.0.0.1:80"; 
    }

    # ----------------------------------------------------
    # HTTP -> HTTPS Yönlendirmesi (Opsiyonel ama Önerilen)
    # ----------------------------------------------------
    server {
        listen 80;
        server_name *.localhost localhost;
        return 301 https://hostrequest_uri;
    }

    # ----------------------------------------------------
    # ANA HTTPS SUNUCUSU
    # ----------------------------------------------------
    server {
        listen 443 ssl;
        server_name *.localhost localhost;

        # mkcert ile üretilen SSL Sertifika Yolları
        ssl_certificate         /etc/nginx/certs/localhost.crt;
        ssl_certificate_key     /etc/nginx/certs/localhost.key;
        
        # Güvenli TLS Ayarları
        ssl_protocols           TLSv1.2 TLSv1.3;
        ssl_ciphers             HIGH:!aNULL:!MD5;

        location / {
            # Map tablosundan gelen dinamik hedefi atıyoruz
            proxy_pass \$backend_target;

            # Standart Proxy Başlıkları
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;

            # Konteyner kapalıysa tarayıcıya temiz bir hata dönmek için:
            error_page 502 503 504 = @konteyner_yok;
        }

        # Konteyner kapalıyken Nginx'in vereceği özel yanıt
        location @konteyner_yok {
            default_type text/plain;
            return 503 "Hedef Docker konteyneri şu an aktif değil veya başlatılamadı.";
        }
    }
}
```

---

## 🚀 Sistemi Ayağa Kaldırma ve Test Etme

1. Önce ortak ağı oluşturduğunuzdan emin olun.
2. `nginx_proxy` ve `backend_app` klasörlerinde terminal açarak `docker compose up -d` komutuyla konteynerleri başlatın.
3. Tarayıcınızı açın ve `https://api.localhost` adresine gidin.
4. **Esneklik Testi:** `docker stop backend_konteyner` komutuyla backend'i kapatın. `api.localhost` sayfasına istek attığınızda Nginx'in çökmediğini, bunun yerine belirlediğimiz *"Hedef Docker konteyneri şu an aktif değil"* hata mesajını başarıyla döndüğünü göreceksiniz.

