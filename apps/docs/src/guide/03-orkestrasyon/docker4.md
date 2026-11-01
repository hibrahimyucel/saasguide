## 📦 Yerel (Local) Docker İmajı Oluşturma, Kaydetme ve Çalıştırma

Bu bölüm, internetteki herhangi bir depoyu (Docker Hub vb.) kullanmadan, kendi bilgisayarınızda statik bir web sitesi için nasıl Docker imajı üreteceğinizi, bu imajı bir dosya olarak nasıl paketleyeceğinizi ve Nginx reverse proxy mimarinize nasıl dahil edeceğinizi açıklar.

---

### 1. Adım: Proje Klasör Yapısı

Statik sitenizin dosyalarını ve Docker yapılandırmasını yerel bilgisayarınızda şu şekilde organize edin:

```text
my-static-site/
├── docker-compose.yml
├── Dockerfile
└── dist/                # Web sitenizin statik dosyaları (HTML, CSS, JS, Görseller)
    ├── index.html
    └── style.css
```

---

### 2. Adım: Dockerfile Hazırlama

`my-static-site/Dockerfile` dosyasını oluşturun ve içine şu satırları ekleyin. Bu dosya, statik sitenizi sunmak için hafif ve optimize edilmiş bir Nginx imajı tabanını kullanır:

```dockerfile
# 1. Aşama: Resmi ve hafif Nginx tabanlı imajı kullan
FROM nginx:alpine

# 2. Aşama: Yereldeki dist/ klasörünün içeriğini Nginx'in varsayılan dizinine kopyala
COPY ./dist /usr/share/nginx/html

# 3. Aşama: Nginx'in çalışacağı portu belirt (Konteyner içi port)
EXPOSE 80

# 4. Aşama: Nginx'i ön planda (foreground) çalıştır ki konteyner açık kalsın
CMD ["nginx", "-g", "daemon off;"]
```

---

### 3. Adım: İmajı İnşa Etme (Build) ve Paketleme (Save)

Terminalinizi `my-static-site` klasöründe açın ve sırasıyla şu komutları çalıştırın:

1. **İmajı yerel diskinizde inşa edin (Build):**
   ```bash
   # "yerel-statik-site" adında ve "v1" etiketinde bir imaj üretir
   docker build -t yerel-statik-site:v1 .
   ```

2. **Üretilen imajı bir arşiv dosyası olarak diske kaydedin (Save):**
   ```bash
   # İmajı internete yüklemeden, taşınabilir bir .tar dosyasına dönüştürür
   docker save -o yerel-statik-site.tar yerel-statik-site:v1
   ```
   *Not: Bu `.tar` dosyasını gelecekte VPS sunucunuza `scp` veya `sftp` ile gönderip orada `docker load -i yerel-statik-site.tar` komutuyla doğrudan internet kullanmadan içeri aktarabilirsiniz.*

---

### 4. Adım: Yerel İmajı Docker Compose ve Nginx Map Mimarisine Bağlama

Oluşturduğunuz bu yerel imajı çalıştırmak ve önceki rehberde hazırladığımız harici ağa (`ortak_ag`) dahil etmek için `docker-compose.yml` dosyasını şu şekilde güncelleyin:

#### Statik Site Servisi (`my-static-site/docker-compose.yml`)
```yaml
version: '3.8'

services:
  static_site_app:
    # Docker Hub'a gitmez, az önce yerelde build ettiğiniz imaj adını kullanır
    image: yerel-statik-site:v1
    container_name: statik_site_konteyner
    expose:
      - "80"
    networks:
      - default

networks:
  default:
    name: ortak_ag
    external: true
```

#### Ana Nginx Proxy Yapılandırmasına Ekleme (`nginx.conf`)
Önceki rehberde oluşturduğunuz global `map` tablosunun (`nginx.conf` içindeki `http` bloğu) altına statik sitenizin subdomain yönlendirmesini tek satır olarak eklemeniz yeterlidir:

```nginx
map \(http_host\)backend_target {
    hostnames;

    # YENİ EKLENEN SATIR: 
    # blog.localhost adresini doğrudan yerel imajımızdan çalışan konteynere yönlendirir
    "blog.localhost"                "http://statik_site_konteyner:80";

    # Diğer eski servisleriniz...
    "api.localhost"                 "https://backend_konteyner:3000";
    default                         "http://127.0.0.1:80"; 
}
```

---

### 🚀 Çalıştırma ve Doğrulama

1. Nginx proxy konteynerinizin ayakta olduğundan emin olun.
2. `my-static-site` klasöründe `docker compose up -d` komutunu çalıştırın.
3. Tarayıcınızdan `https://blog.localhost` adresine giderek tamamen yerelde ürettiğiniz, dış dünyaya kapalı statik imajınızın Nginx üzerinden başarıyla sunulduğunu doğrulayın.

