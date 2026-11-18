---
tarih: 2026-11-11
saat: 17:27
konu: "Nginx Reverse Proxy Üzerinden Statik VitePress Yayını"
baglam: "AI Workspace ve SaaS Monorepo / Docker & Nginx Gateway Yapılandırması"
durum: "Tamamlandı"
etiketler: [nginx, docker, vitepress, reverse-proxy, static-hosting, ssl]
---

# 🌐 Statik VitePress Sitesinin Nginx Üzerinden Yayınlanması

Bu rehber, derlenen (`build`) VitePress dokümantasyon sitesinin Docker tabanlı Nginx Reverse Proxy (`nginx_proxy`) üzerinden `https://docs.localhost` alan adıyla statik olarak sunulması sürecini belgeler.

---

## 1. Mimari Karar ve Dizin Yapısı
* **Kaynak Build Dizini:** `/home/iyucel/saasguide/apps/docs/src/.vitepress/dist`
* **Konteyner Hedef Dizini:** `/var/www/vitepress_static`
* **Erişim Politikası:** Güvenlik ve veri bütünlüğü için dizin konteynere salt-okunur (`ro`) olarak bağlanmıştır.

## 2. Docker Compose Yapılandırması
Statik derleme çıktılarının Nginx konteynerine aktarılması için `volumes` tanımı güncellenmiştir:

```yaml
volumes:
  - ./nginx/dev.conf:/etc/nginx/nginx.conf:ro
  - ./nginx/certs:/etc/nginx/certs:ro
  - /home/iyucel/saasguide/apps/docs/src/.vitepress/dist:/var/www/vitepress_static:ro
```

## 3. Nginx Sunucu ve Yönlendirme Kuralları (`dev.conf`)
* **MIME Desteği:** CSS ve JavaScript varlıklarının tarayıcıda doğru işlenmesi için `include /etc/nginx/mime.types;` direktifi `http` bloğuna eklenmiştir.
* **Subdomain Ayrımı:** `docs.localhost` adresi dinamik proxy `map` tablosundan çıkarılarak doğrudan statik dosya sunan özel bir HTTPS `server` bloğuna atanmıştır.
* **Clean URLs Desteği:** VitePress sayfa yönlendirmelerinin `.html` uzantısı olmadan çalışabilmesi için `try_files $uri $uri.html $uri/ /index.html;` kuralı uygulanmıştır.

