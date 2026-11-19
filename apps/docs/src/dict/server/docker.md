---
tarih: 2026-11-17
saat: 22:56
konu: "Docker: Konteynerleştirme ve İzolasyon Platformu (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Altyapı Referans Kılavuzu (Katman 2: Docker)"
durum: "Tamamlandı"
etiketler: [docker, container, virtualization, devops, lexical-database, referans, altyapi-katman-2]
---

# Docker

* **Üretici / Geliştirici:** Solomon Hykes (İlk Geliştirici) & Docker, Inc.
* **Resmi Web Sitesi:** [docker.com](https://docker.com)

::: info CONCEPT MATRICES
* **Domain:** OS-Level Virtualization & Application Packaging
* **Superordinate Concept:** Containerization Platform
* **Isolation Mechanism:** Linux Kernel Namespaces & Control Groups (cgroups)
* **Storage Architecture:** Union File System (OverlayFS) with Immutable Layers
:::


## 1. Tanıtım

**Docker**, uygulamaları ve çalışma zamanı bağımlılıklarını, standart ve izole birimler halinde paketleyerek uygulamaların dağıtımını, ölçeklendirilmesini ve yönetimini otomatikleştiren açık kaynaklı bir konteynerleştirme platformudur.


## 2. Mimari Rolü ve Temel Prensipleri

**Docker**, **SaaS Rehberi** 8 katmanlı altyapı yığınının **2. katmanını** oluşturur. **Gitea** (Katman 7), **MinIO** (Katman 8), **Nginx** (Katman 4) ve tüm uygulama servislerini ana işletim sisteminden (Host OS) izole ederek paketler. Böylece "benim bilgisayarımda çalışıyordu" sorununu ortadan kaldırır ve yerel ortam ile uzak sunucu (VPS) arasında birebir taşınabilirlik sağlar.

* Sanal makineler (VM) her uygulama için ayrı bir misafir işletim sistemi (Guest OS) ve donanım sanallaştırması (Hypervisor) gerektirirken, Docker doğrudan ana işletim sisteminin çekirdeğini (Kernel) paylaşır. Bu durum milisaniyeler içinde açılış süresi ve çok düşük kaynak tüketimi sağlar.
* Linux çekirdeğinin **Namespaces** özelliği her konteynere kendi ağını, dosya sistemini ve süreç ağacını verir. 
* **Control Groups (cgroups)** ise her konteynerin kullanabileceği CPU ve RAM limitlerini sınırlar.
* **Katmanlı İmaj Yapısı (Layered Image):** Docker imajları salt okunur (read-only) katmanlardan oluşur. Ortak katmanlar farklı imajlar arasında paylaşıldığı için disk alanından ve indirme süresinden tasarruf edilir.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Image** | Konteyner İmajı | Bir uygulamanın çalışması için gereken kod, çalışma zamanı (runtime), kütüphaneler ve ayarları barındıran salt okunur (read-only) şablon. |
| **Container** | Konteyner | Bir Docker imajının çalışma zamanındaki (runtime) izole edilmiş, canlı ve yazılabilir katmana sahip örneği. |
| **Dockerfile** | İmaj Tarifi Dosyası | Bir Docker imajının sıfırdan nasıl inşa edileceğini adım adım tanımlayan metin tabanlı komut dosyası. |
| **Docker Compose** | Çoklu Konteyner Orkestratörü | Birden fazla konteynerden oluşan uygulamaları (`yaml` dosyası üzerinden) tek komutla tanımlayıp aynı ağda ayağa kaldıran araç. |
| **Volume** | Kalıcı Veri Hacmi | Konteyner verileri için konteyner dışında ayrılmış disk alanı. |
| **Network** | İzole Sanal Ağ | Konteynerlerin dış dünyaya port açmadan kendi aralarında servis isimleriyle (DNS) güvenli haberleşmesini sağlayan sanal ağ katmanı. |
| **Registry** | İmaj Kayıt Defteri | Oluşturulan Docker imajlarının saklandığı ve dağıtıldığı merkezi depo (genel olarak Docker Hub, projemizde ise özel **Gitea Container Registry**). |
| **Docker Daemon (`dockerd`)** | Arka Plan Servisi | Konteynerleri, imajları, ağları ve veri hacimlerini yöneten ana sistem servisi. |
| **Port Mapping** | Port Eşleme | Ana makinenin (Host) bir portunu konteyner içindeki servis portuna bağlama işlemi (Örn: `-p 8080:80`). |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

Sunucu ve konteyner yönetiminde en sık başvurulan temel komut seti:

### İmaj ve Konteyner Yaşam Döngüsü
```bash
# Dockerfile kullanarak yeni bir imaj inşa eder
docker build -t saas-docs:latest .

# Bir imajdan arka planda (-d) yeni bir konteyner başlatır
docker run -d --name docs-app -p 4173:80 saas-docs:latest

# Çalışan tüm konteynerleri listeler (durdurulmuş olanlar dahil için -a)
docker ps -a

# Çalışan bir konteyneri durdurur veya siler
docker stop docs-app
docker rm docs-app
```

### Hata Ayıklama ve Kaynak Yönetimi
```bash
# Konteynerin ürettiği canlı sistem kayıtlarını (log) izler
docker logs -f docs-app

# Çalışan bir konteynerin içine etkileşimli terminal (shell) ile bağlanır
docker exec -it docs-app /bin/sh

# Kullanılmayan durmuş konteynerleri ve önbellek imajlarını temizler
docker system prune 
```

### Docker Compose Orkestrasyonu
```bash
# docker-compose.yml dosyasındaki tüm servisleri arka planda ayağa kaldırır
docker compose up -d

# Servisi durdurur ve oluşturulan sanal ağları temizler (Volume verileri korunur)
docker compose down
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [Docker Docs](https://docker.com)
* **Dockerfile Yazım Standartları:** [Best practices for writing Dockerfiles](https://docker.combuild/building/best-practices/)
* **Docker Compose Referansı:** [Compose File Reference](https://docker.comcompose/compose-file/)
