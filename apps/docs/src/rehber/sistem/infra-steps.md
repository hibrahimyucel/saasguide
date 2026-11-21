---
title: "SaaS Geliştirme Rehberi"
description: "pr2cloud Self-Hosted PaaS altyapı kurulumu, VitePress ile yazılım geliştirmeye giriş, deployment seçenekleri, PaaS otomasyonu ve platform ölçekleme yol haritası."
outline: [2, 3]
sidebarTitle: "Geliştirme Rehberi"
index: 1
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "saas-rehberi", "mimari", "kurulum", "vitepress", "deployment", "otomasyon"]
---

# SaaS Geliştirme Rehberi

Bu rehber; **pr2cloud** ekosistemi üzerinde altyapı kurulumundan başlayarak **VitePress** ile yazılım geliştirmeye geçiş, **deployment seçenekleri ile PaaS otomasyonu** ve **platform projelerinin çoğaltılması** süreçlerini kapsayan üç ana fazdan oluşur.

---

## I. Host — Geliştirici Makinesi Kurulumu

Kod geliştirme ve monorepo orkestrasyonunun yürütüldüğü yerel çalışma ortamı hazırlığıdır.

* [ ] **Tailscale VPN** 
* [ ] **Node** 
* [ ] **pnpm** 
* [ ] **git - GitHub CLI** 
* [ ] **Docker** 

* [ ] **Monorepo Orkestrasyonu** 
* [ ] **Github**

* [ ] **DuckDNS**

### Servisler
* [ ] **Docker ve Çift Ağ (Dual-NIC):** Docker Engine kurulumunu tamamla; `pr2_edge_net` ve dış internete kapalı `pr2_internal_net` (`internal: true`) ağlarını yapılandır.

* [ ] **Çekirdek Dev PaaS Servisleri:** `source/infra/` altındaki yapılandırmalarla Nginx ters vekilini, merkezi **Dex SSO** (`auth.<domain>`), **Gitea & Registry** (`gitea.<domain>`) ve **MinIO S3** (`minio.<domain>`) konteynerlerini başlat.

#### 3. Prod — Public Server Kurulumu (`prod/`)

Son kullanıcılara hizmet veren, özel alan adı ve kurumsal e-posta altyapısına sahip canlı VPS kurulumudur.

* [ ] **VPS Güvenlik Sıkılaştırması:** AlmaLinux 9 üzerinde sistem güncellemelerini yap; `firewalld` ve **Fail2ban** servislerini devreye alarak dış ağ (`eth0`) saldırı yüzeyini kapat.
* [ ] **Üretim Deposu ve Kalıcı Dizinler:** Sunucu üzerinde bağımsız üretim yapılandırma deposunu (`prod/`) klonla ve konteyner volume bağlamaları için `data/` dizinlerini hazırla.
* [ ] **Canlı DNS ve Wildcard SSL:** Özel alan adı (`*.alanadi.com`) A/CNAME kayıtlarını yapılandır ve Certbot (`DNS-01`) ile canlı Wildcard TLS sertifikalarını `data/certs/` altına al.
* [ ] **Canlı Servis Orkestrasyonu (Dual-NIC):** `prod/docker-compose.yml` ve `prod/.env` parametreleriyle Nginx, Dex SSO, MinIO S3 ve üretim API/Web konteynerlerini çift ağ izolasyonuyla ayağa kaldır.
* [ ] **Kurumsal E-Posta Altyapısı:** Rust tabanlı **Stalwart Mail Server** (`mail.<domain>`) ve **SnappyMail** (`webmail.<domain>`) konteynerlerini SPF, DKIM ve DMARC DNS kayıtlarıyla birlikte devreye al.

#### 4. Uygulama, Test ve VitePress Dokümantasyon Doğrulaması

Altyapı servislerinin entegrasyonu, uygulama katmanlarının testi ve bilgi havuzunun yayına alınması aşamasıdır.

* [ ] **Servis ve SSO Entegrasyon Testi:** Geliştirilen uygulamaların **Dex OIDC** (`auth.<domain>`) üzerinden tek oturum açma (SSO) ve **MinIO S3** (`s3.<domain>`) dosya yükleme/okuma bağlantılarını doğrula.
* [ ] **Ağ İzolasyonu ve Güvenlik Kontrolü:** `pr2_internal_net` üzerindeki veritabanı ve iç servislerin dış ağdan (`eth0`) erişilemediğini; yalnızca API katmanı köprüsü üzerinden haberleştiğini test et.
* [ ] **Monorepo Derleme ve Birim Testleri:** Turborepo (`turbo run build test lint`) üzerinden tüm `apps/` ve `packages/` modüllerinin hatasız derlendiğini ve testlerden geçtiğini onayla.
* [ ] **VitePress Dokümantasyon Portalı:** `apps/docs` altındaki rehber ve mimari karar kayıtlarını yerel ortamda önizle; statik derleme (`vitepress build`) sonrasında `docs.<domain>` adresi üzerinden yayını doğrula.

---

### II. Yazılım Geliştirmeye Giriş (VitePress), Deployment Seçenekleri ve PaaS Otomasyonu

Altyapı doğrulamasının ardından ilk uygulama olarak VitePress üzerinden uçtan uca geliştirme, paketleme, dağıtım stratejileri ve otomatik PaaS iş akışlarının devreye alındığı fazdır.

* [ ] **VitePress ile Geliştirmeye Giriş:** `apps/docs` projesini standart yaşam döngüsü (Ar-Ge → Kodlama & Test → Dokümantasyon) ve kodlama kurallarına uygun şekilde ilk uçtan uca uygulama olarak yapılandır.
* [ ] **Deployment Seçeneklerinin Belirlenmesi:** Statik çıktı dağıtımı (Nginx statik sunum / MinIO S3 barındırma) ile konteyner tabanlı dağıtım (Docker imajı + Gitea OCI Registry) modellerini kıyasla ve ortama göre stratejiyi sabitle.
* [ ] **CI/CD ve PaaS Otomasyonu:** **Gitea Actions** iş akışlarını tanımlayarak kod gönderimi (`git push`) sonrasında otomatik test, imaj derleme, `pr2_edge_net` / `pr2_internal_net` ağlarına dağıtım ve Nginx yönlendirme otomasyonunu kur.

---

### III. Platform ve Projelerin Ölçeklenmesi (Yazılım Odaklı Genişleme)

Otomasyon ve dağıtım boru hattı oturduktan sonra yeni SaaS uygulamalarının ve paylaşılan yazılım paketlerinin ekosisteme eklendiği fazdır.

* [ ] **Paylaşılan Paket Mimarisi (`packages/`):** Kimlik doğrulama istemcileri (Dex OIDC), UI bileşen kütüphanesi (Tailwind CSS v4), Zod doğrulama şemaları ve S3/Mail istemcilerini ortak paketler haline getir.
* [ ] **Yeni SaaS Uygulamalarının Eklenmesi (`apps/`):** Katmanlı mimari (Presentation, Service, Repository, Domain) standartlarıyla yeni web ve API servislerini monorepo içine dahil et.
* [ ] **Çoklu Proje ve Kiracı (Multi-Tenant) Yönetimi:** Yeni projeler için alt alan adı şablonlarını (`*.<domain>`), Dex OIDC istemci kayıtlarını ve veritabanı izolasyon politikalarını standart şablonlarla çoğalt.
