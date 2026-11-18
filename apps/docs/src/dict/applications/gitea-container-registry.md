---
tarih: 2026-11-14
saat: 23:32
konu: "Gitea Container Registry Kurulum ve Kullanım Rehberi"
baglam: "apps/docs (VitePress Rehber Dökümantasyonu) / infra/gitea & infra/gateway"
durum: "Tamamlandı"
etiketler: [gitea, container-registry, docker, nginx, ssl, mkcert, rehber]
---

# Gitea Container Registry

Yerel Gitea sunucusunun (`git.localhost`) yerleşik paket kayıt defteri (Container Registry) özelliğini aktif hale getirme, Nginx Gateway üzerinde büyük katman aktarımlarını yapılandırma ve Docker imajlarını merkezi olarak depolama standartlarını içerir.

---

## 1. Mimari Genel Bakış

Gitea 1.17 ve üzeri sürümler, harici bir kayıt defterine (Docker Hub, Harbor vb.) ihtiyaç duymadan kendi içinde tam uyumlu bir OCI/Docker Container Registry barındırır. 

Bu yapı sayesinde:
* Derlenen üretim imajları (`pr2-docs:latest` vb.) `.tar.gz` dosyası olarak taşınmak yerine doğrudan `git.localhost` adresine gönderilir (`docker push`).
* Üretim ve test ortamları güncel imajları doğrudan Gitea üzerinden çeker (`docker pull`).
* Tüm imajlar izole `gitea-data/` dizini altında Git repolarıyla birlikte yedeklenir.

---

## 2. Gitea Sunucu Yapılandırması (`app.ini`)

`gitea-data/gitea/conf/app.ini` dosyasında paket yöneticisi modülünün etkinleştirildiğinden emin olun:

```ini
[packages]
ENABLED = true
CHUNKED_UPLOAD_PATH = data/tmp/package-upload
```

> **Not:** Yapılandırma değişikliğinden sonra Gitea servisinin yeniden başlatılması gerekir:
> `docker restart pr2_dev_gitea`

---

## 3. Nginx Gateway Yapılandırması (`git-localhost.conf`)

Docker imaj katmanları yüksek boyutlu tekil istekler (chunked upload) gönderdiği için Nginx varsayılan yükleme sınırlarının kaldırılması zorunludur. `infra/gateway/nginx/conf.d/git-localhost.conf` dosyasında şu ayarlar uygulanır:

```nginx
server {
    listen 443 ssl;
    server_name git.localhost;

    # Büyük Docker katmanlarının 413 Request Entity Too Large hatası vermesini önler
    client_max_body_size 0;

    # Yükleme sırasında veriyi diske tamponlamadan doğrudan Gitea'ya akıtır
    proxy_request_buffering off;

    location / {
        resolver 127.0.0.11 valid=30s;
        set \$upstream_gitea http://pr2_dev_gitea:3000;

        proxy_pass \$upstream_gitea;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Büyük katman aktarımlarında zaman aşımını önler
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Yapılandırmayı doğrulamak ve aktif etmek için:
```bash
docker exec pr2_dev_proxy nginx -t && docker exec pr2_dev_proxy nginx -s reload
```

---

## 4. Yerel SSL Sertifikasını Docker Motoruna Tanıtma

Eğer yerel sertifika (mkcert) kullanıyorsanız SSL sertifikasının Docker servisi tarafından güvenilir kabul edilmesi için sertifika `/etc/docker/certs.d/` altına tanımlanır:

```bash
# 1. Alan adına özel sertifika dizinini oluştur
sudo mkdir -p /etc/docker/certs.d/git.localhost

# 2. Yerel sertifikayı ca.crt olarak kopyala
sudo cp ~/workspace-pr2/source/infra/gateway/nginx/certs/localhost.crt /etc/docker/certs.d/git.localhost/ca.crt

# 3. Docker servisini yeniden başlat
sudo systemctl restart docker
```

---

## 5. Erişim Belirteci (Token) ve İmaj Operasyonları

### 5.1. Gitea Token Oluşturma
1. `https://git.localhost` adresinde oturum açın.
2. **Ayarlar (Settings) -> Uygulamalar (Applications)** menüsüne gidin.
3. `write:package` ve `read:package` yetkilerine sahip yeni bir **Erişim Belirteci (Token)** oluşturun.

### 5.2. İmaj Gönderme (`Push`) ve Çekme (`Pull`) Komutları

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **Oturum Açma** | `docker login git.localhost -u <kullanici>` | Şifre alanına oluşturulan **Erişim Belirteci (Token)** yapıştırılır. |
| **İmaj Etiketleme** | `docker tag pr2-docs:latest git.localhost/<kullanici>/pr2-docs:latest` | Yerel imajı Gitea adres formatına eşler. |
| **İmaj Yükleme** | `docker push git.localhost/<kullanici>/pr2-docs:latest` | İmaj katmanlarını Gitea sunucusuna yükler. |
| **İmaj İndirme** | `docker pull git.localhost/<kullanici>/pr2-docs:latest` | Hedef ortamda imajı Gitea üzerinden çeker. |

---

## 6. Docker Compose Entegrasyonu

İmaj Gitea üzerinde yayınlandıktan sonra `docker-compose.prod.yml` dosyalarında `build` bloğu yerine doğrudan kayıt defteri adresi kullanılabilir:

```yaml
services:
  docs-prod:
    image: git.localhost/<kullanici>/pr2-docs:latest
    container_name: docs_prod
    restart: unless-stopped
    networks:
      - pr2_dev_network
```

