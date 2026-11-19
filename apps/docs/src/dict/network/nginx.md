---
title: 'Nginx: Ters Vekil ve Web Sunucusu (Tanıtım, Referans ve Sözlük)'
description: >-
  Nginx, yüksek eşzamanlılık (concurrency), performans ve düşük bellek kullanımı
  odaklı tasarlanmış; ters vekil (reverse proxy), yük dengeleyici (load bal...
outline:
  - 2
  - 3
status: published
tags:
  - nginx
  - reverse-proxy
  - web-server
  - load-balancer
  - lexical-database
  - referans
  - altyapi-katman-4
---

# Nginx (Reverse Proxy)

* **Üretici / Geliştirici:** Igor Sysoev (İlk Geliştirici) & F5, Inc.
* **Resmi Web Sitesi:** [nginx.org](https://nginx.org) / [nginx.com](https://nginx.com)

::: info CONCEPT MATRICES
* **Domain:** Network Traffic Management & HTTP/HTTPS Serving
* **Superordinate Concept:** Event-Driven Web Server & Reverse Proxy
* **Concurrency Architecture:** Asynchronous, Non-Blocking Master-Worker Process Model
* **Core Capabilities:** Reverse Proxying, Load Balancing, SSL/TLS Termination, Static Content Caching
:::

## 1. Tanım

**Nginx**, yüksek eşzamanlılık (concurrency), performans ve düşük bellek kullanımı odaklı tasarlanmış; ters vekil (reverse proxy), yük dengeleyici (load balancer), posta vekili ve HTTP önbelleği olarak da işlev gören açık kaynaklı, olay güdümlü bir web sunucusudur.

---

## 2. Mimari Rolü ve Temel Prensipleri

Sistemin dış dünyaya açılan tek giriş kapısı (Gateway) görevini üstlenir. Sunucuya ulaşan alt alan adı isteklerini (`docs.100-x-y-z.nip.io`, `gitea.100-x-y-z.nip.io`, `minio.100-x-y-z.nip.io`) karşılayarak ilgili arka plan **Docker** konteyner portlarına güvenli biçimde iletir.

* **Master-Worker Süreç Mimarisi:** Geleneksel Apache sunucularının her bağlantı için ayrı bir iş parçacığı (thread) açmasının aksine, Nginx bir ana yönetici süreç (**Master Process**) ve işletim sistemi çekirdeğinin olay bildirim mekanizmalarını (`epoll`, `kqueue`) kullanan az sayıda işçi süreç (**Worker Processes**) ile çalışır. Tek bir işçi süreç binlerce eşzamanlı bağlantıyı bloklanmadan yönetebilir.
* **Tek Kapı ve Port Konsolidasyonu:** Arka planda farklı portlarda (`3000`, `4173`, `9000`, `9001`) çalışan servisleri dış dünyaya tek bir standart HTTP (`80`) veya HTTPS (`443`) portu üzerinden alan adı bazlı (Virtual Host) olarak sunar.
* **Statik Dosya Performansı:** VitePress tarafından derlenen HTML, CSS ve JavaScript gibi statik varlıkları doğrudan dosya sisteminden işletim sistemi çekirdek seviyesinde (`sendfile`) çok yüksek hızla servis eder.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Reverse Proxy** | Ters Vekil Sunucu | İstemciden gelen istekleri karşılayıp arka plandaki (backend) hedef sunucu veya konteynerlere ileten ve dönen yanıtı istemciye sunan aracı katman. |
| **Upstream** | Arka Plan Hedefi | Nginx'in gelen trafiği yönlendirdiği arka plan uygulama sunucuları veya konteyner grupları (Örn: `http://127.0.0.1:3000`). |
| **Server Block** | Sanal Sunucu Bloğu | Farklı alan adları (`server_name`) veya portlar için bağımsız yönlendirme ve güvenlik kurallarının tanımlandığı yapılandırma kapsayıcısı. |
| **Location Block** | Yol Eşleştirme Bloğu | Gelen isteğin URL yoluna (URI, örneğin `/api/` veya `/`) göre farklı yönlendirme veya dosya sunumu kuralları uygulayan alt blok. |
| **SSL/TLS Termination** | SSL Sonlandırma | Şifreli HTTPS trafiğinin Nginx katmanında çözülerek arka plan konteynerlerine şifresiz ve hızlı HTTP trafiği olarak aktarılması işlemi. |
| **Load Balancing** | Yük Dengeleme | Gelen ağ trafiğini belirlenen algoritmalarla (Round Robin, Least Connections vb.) birden fazla uygulama örneği arasına eşit veya ağırlıklı dağıtma yöntemi. |
| **Directive** | Yapılandırma Direktifi | Nginx ayar dosyalarında noktalı virgül (`;`) ile sonlanan temel komut satırları (Örn: `listen 80;`, `proxy_pass`). |
| **HTTP Headers** | HTTP Başlıkları | İstemcinin gerçek IP adresi (`X-Real-IP`) ve orijinal alan adı (`Host`) gibi bilgilerin arka plan servislerine kaybolmadan iletilmesini sağlayan üst veriler. |
| **WebSocket Upgrade** | Bağlantı Yükseltme | MinIO konsolu veya canlı bildirim servisleri gibi çift yönlü iletişim gerektiren uygulamalar için HTTP bağlantısının WebSocket protokolüne yükseltilmesi. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

Sunucu yapılandırması, doğrulama ve servis yönetiminde en sık başvurulan temel komut ve şablon seti:

### Servis ve Yapılandırma Yönetimi
```bash
# Yapılandırma dosyalarındaki sözdizimi (syntax) hatalarını test eder
nginx -t

# Aktif bağlantıları kesmeden (zero-downtime) yeni yapılandırmayı yükler
nginx -s reload

# Nginx servisinin çalışma durumunu ve sürümünü kontrol eder
systemctl status nginx
nginx -v
```

### Temel Ters Vekil (Reverse Proxy) Yapılandırma Örneği
```nginx
server {
    listen 80;
    server_name docs.100-84-12-45.nip.io;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
```

### Günlük Kayıtları (Logs) İzleme
```bash
# Gelen tüm HTTP isteklerini (erişim kayıtlarını) canlı izler
tail -f /var/log/nginx/access.log

# Yönlendirme ve bağlantı hatalarını canlı izler
tail -f /var/log/nginx/error.log
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [Nginx Official Documentation](https://nginx.orgen/docs/)
* **Ters Vekil Rehberi:** [NGINX Reverse Proxy Guide](https://nginx.com)
* **Direktif Sözlüğü:** [Alphabetical Index of Directives](https://nginx.orgen/docs/dirindex.html)
