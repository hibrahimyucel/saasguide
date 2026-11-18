---
title: Yerel Gitea Kurulumu ve Dual Remote Origin Yapılandırması
description: pr2 monorepo altyapısında Docker ile izole Gitea kurulumu, Nginx SSL reverse proxy entegrasyonu ve GitHub ile çift yönlü Git senkronizasyonu.
date: 2026-11-14
tags: [gitea, docker, nginx, reverse-proxy, git, dual-remote, monorepo]
---

# `7.` Gitea - Dual Remote Yapılandırması

Monorepo altyapısında kodları yalnızca bulutta (GitHub) tutmak yerine yerel ağda çalışan bir **Gitea** sunucusu kuruyoruz.

Gitea Runner servisleri derleme (build) ve Docker imajı paketleme işlemlerini otomatik olarak yapar. Güncel sürümler Gitea Container Registry üzerinden ilgili ortama otomatik olarak aktarılır.

Geliştirme süreci `fetch` işlemleri doğrudan yerel `git.localhost` üzerinde çalışacağı için ağ gecikmesi yaşanmaz. `push` işlemi hem gitea hem github reposunu günceller, ancak github adresini listeden çıkararak manuel güncelleme de yapabilirsiniz.

Gitea minimum RAM/CPU tüketir. SSH portu (`DISABLE_SSH=true`) kapatılarak tüm trafik mevcut `mkcert` SSL sertifikalı Nginx Gateway (`443`) üzerinde tek noktadan yönetilir.



## 1. Klasörler ve Veri İzolasyonu

Kalıcı Git depoları ve SQLite veritabanı dosyaları, kaynak kod (`source`) ve Docker imaj bağlamından tamamen izole edilerek tıpkı `wwwroot` gibi bir üst dizinde konumlandırılmıştır:

```text
workspace-pr2/
├── wwwroot/               # Statik web dosyaları
├── gitea-data/            # Gitea SQLite veritabanı ve Git repoları (İzole)
└── source/                # Monorepo kök dizini
    └── infra/
        ├── gateway/       # Nginx Reverse Proxy (pr2_dev_proxy)
        │   └── nginx/
        │       └── conf.d/
        │           ├── default-gateway.conf
        │           └── git-localhost.conf
        └── gitea/         # Gitea Servis Tanımı (pr2_dev_gitea)
            └── docker-compose.yml
```

> **Güvenlik Notu:** Olası yedekleme veya kopyalama işlemlerinde veri sızıntısını önlemek için kök dizindeki `.gitignore` ve `.dockerignore` dosyalarına `gitea-data/` kuralı eklenmiştir.

---

## 2. Gitea Docker Yapılandırması

Gitea servisini `pr2_dev_network` ağına dahil ediyoruz, `../../../gitea-data:/data` klasörünü bağlıyoruz.

::: details `infra/gitea/docker-compose.yml`

```yaml
name: pr2_dev_gitea
services:
  gitea:
    image: gitea/gitea:latest
    container_name: pr2_dev_gitea
    restart: unless-stopped
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=sqlite3
      - GITEA__server__DOMAIN=git.localhost
      - GITEA__server__SSH_DOMAIN=git.localhost
      - GITEA__server__ROOT_URL=https://git.localhost
      - GITEA__server__DISABLE_SSH=true
    volumes:
      - ../../../gitea-data:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro

    networks:
      - pr2_dev_network
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

networks:
  pr2_dev_network:
    external: true
```
:::
---

## 3. Nginx Entegrasyonu


::: details `infra/gateway/nginx/conf.d/git-localhost.conf`

```nginx
server {
    listen 443 ssl;
    server_name git.localhost;

    # mkcert Yerel SSL Sertifikaları
    ssl_certificate     /etc/nginx/certs/localhost.crt;
    ssl_certificate_key /etc/nginx/certs/localhost.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Büyük monorepo push işlemleri için gövde boyutu limiti
    client_max_body_size 512M;

    location / {
        # Docker dahili DNS (127.0.0.11) ile dinamik upstream çözümleme
        set $gitea_upstream http://pr2_dev_gitea:3000;
        proxy_pass $gitea_upstream;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket Desteği
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
:::

### Sertifikaları güncelleme
`nginx/certs` klasörü içinde aşağıdaki komutu çalıştırıp `git.localhost` adresini sertifikaya ekliyoruz.

```bash
mkcert -cert-file localhost.crt -key-file localhost.key docs.localhost dev.localhost git.localhost localhost 127.0.0.1 ::1
```


## Servisleri Ayağa Kaldırma


```bash
# 1. Gitea konteynerini başlatın
cd infra/gitea && docker compose up -d

# 2. Nginx yapılandırmasını yeniden yükleyin
cd ../gateway && docker compose restart nginx_proxy
```

Kurulum sonrasında `https://git.localhost` adresinden ilk yönetici hesabını ve Github'da kullandığınız isimle boş bir repository oluşturun.

---

## 4. Yerel Öncelikli Dual Remote Origin Yapılandırması

Bu yapılandırmada `git pull` ve `git fetch` işlemleri doğrudan yerel Gitea sunucusundan yapılırken, `git push` komutları tek seferde hem yerel Gitea'ya hem de GitHub'a yazılır.

### Terminal Komutları

Proje kök dizininde (`source/`) aşağıdaki komutları çalıştırın:

```bash
# 1. Ana origin (fetch) kaynağını yerel Gitea olarak ayarlayın
git remote set-url origin https://git.localhost/<kullanıcıadınız>/pr2.git

# 2. İlk push hedefi olarak yerel Gitea'yı tanımlayın
git remote set-url --add --push origin https://git.localhost/<kullanıcıadınız>/pr2.git

# 3. İkinci push hedefi olarak GitHub bulut deposunu ekleyin
git remote set-url --add --push origin https://github.com/<kullanıcıadınız>/pr2.git

# 4. Yerel mkcert sertifikası için depo bazlı SSL doğrulama ayarı
git config http.https://localhost.sslverify false
```

### Doğrulama

`git remote -v` komutu çalıştırıldığında aşağıdaki çıktı elde edilmelidir:

```text
origin  https://git.localhost/<kullanıcıadınız>/pr2.git (fetch)
origin  https://git.localhost/<kullanıcıadınız>/pr2.git (push)
origin  https://github.com (push)
```

### Şifrenizin kaydedilmesi için

```bash
git config --global credential.helper store
git push origin --all
```

MS Windows
```bash
git config --global credential.helper manager
git push origin --all
```



## 5. Günlük Geliştirme İş Akışı

* **Tüm Dalları Senkronize Etme:** `git push origin --all`
* **Standart Kod Gönderimi:** `git push origin <dal-adi>` (Önce yerel Gitea'ya, ardından GitHub'a otomatik yazar.)
* **Yerelden Güncelleme Çekme:** `git pull origin <dal-adi>` (Doğrudan `git.localhost` üzerinden çeker.)
* **Harici GitHub Değişikliklerini Çekme:** Farklı bir ortamdan doğrudan GitHub'a kod gönderildiyse, `git pull https://github.com <dal-adi>` komutuyla yereli güncelleyip ardından `git push origin` ile Gitea'yı eşitleyin.



