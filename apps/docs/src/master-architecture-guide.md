---
title: >-
  Uçtan Uca SaaS Altyapı Mimarisi ve Servis Orkestrasyonu (Master Architecture
  Guide)
description: >-
  Bu doküman; SaaS Rehberi monorepo ekosisteminin temelini oluşturan 8 katmanlı
  altyapı yığınının mimari sırasını, birbirleriyle olan etkileşimini ve Vite...
outline:
  - 2
  - 3
status: published
tags:
  - master-guide
  - altyapi
  - mimari
  - nodejs
  - docker
  - git
  - nginx
  - tailscale
  - nip-io
  - gitea
  - minio
  - vitepress
---

# 🏗️ Master Architecture Guide: Uçtan Uca SaaS Altyapı Mimarisi

Bu doküman; **SaaS Rehberi** monorepo ekosisteminin temelini oluşturan 8 katmanlı altyapı yığınının mimari sırasını, birbirleriyle olan etkileşimini ve **VitePress** üzerinden canlıya alınma (Proof of Concept) standartlarını tek bir başvuru kaynağında (Single Source of Truth) birleştirir.

---

## 1. Altyapı Yığını ve Katman Sıralaması

Sistem; geliştirme ortamından üretim (production) dağıtımına kadar aşağıdan yukarıya birbirini tamamlayan 8 temel katmandan oluşur:

| Katman | Teknoloji | Temel Görevi | Mimari Katkısı |
| :--- | :--- | :--- | :--- |
| **1** | **Node.js Runtime** | Uygulama ve derleme (build) motoru | Monorepo (`pnpm` / `turbo`) bağımlılıklarını ve betiklerini çalıştırır. |
| **2** | **Docker Container** | İzolasyon ve paketleme katmanı | Tüm servisleri (Gitea, MinIO, Nginx, Uygulamalar) işletim sisteminden bağımsızlaştırır. |
| **3** | **Git** | Kaynak kod versiyon kontrolü | Kod geçmişini, dallanma (branching) stratejisini ve sürüm etiketlerini yönetir. |
| **4** | **Nginx** | Ters vekil (Reverse Proxy) katmanı | Dış ve iç ağdan gelen HTTP/HTTPS isteklerini ilgili konteyner portlarına yönlendirir. |
| **5** | **Tailscale** | WireGuard tabanlı Mesh VPN | Mobil hotspot ve CGNAT engellerini aşarak tüm cihazlara kalıcı `100.x.y.z` özel IP'si atar. |
| **6** | **`nip.io`** | Dinamik DNS çözümleme servisi | Kalıcı IP adreslerini ek DNS maliyetine girmeden alt alan adlarına (`servis.100-x-y-z.nip.io`) çevirir. |
| **7** | **Gitea** | Self-hosted Git ve CI/CD sunucusu | Özel kod depolarını, otomasyon iş akışlarını (Actions) ve Docker imaj kayıt defterini barındırır. |
| **8** | **MinIO** | S3 uyumlu nesne depolama katmanı | Uygulama medyalarını, büyük varlıkları (assets) ve sistem yedeklerini S3 protokolüyle sunar. |

---

## 2. Katmanlar Arası Etkileşim Akışı

Sistem üzerindeki bir geliştirme döngüsü ve ağ isteği şu sırayla işler:

```text
[Geliştirici (Git Push)] 
       │
       ▼
[7. Gitea (Repo & CI/CD)] ──▶ [1. Node.js] + [2. Docker Build]
                                     │
                                     ▼
[İstemci (Tarayıcı/Mobil)] ──▶ [5. Tailscale (100.x.y.z)] ──▶ [6. nip.io DNS]
                                                                    │
                                                                    ▼
[8. MinIO (S3 Storage)] ◀── [Uygulama / VitePress] ◀── [4. Nginx Reverse Proxy]
```

1. **Ağ ve Erişim Katmanı (`Tailscale` + `nip.io` + `Nginx`):** Fiziksel ağ (mobil erişim noktası veya yerel Wi-Fi) değişse bile Tailscale sayesinde cihazın IP adresi (`100.x.y.z`) sabit kalır. `nip.io` bu IP'yi tireli alt alan adlarına dönüştürür ve Nginx gelen isteği hedef konteynere iletir.
2. **Kod ve Otomasyon Katmanı (`Git` + `Gitea` + `Node.js` + `Docker`):** Yerel ortamda geliştirilen kod Gitea'ya gönderilir. Node.js çalışma zamanı derlemeyi tamamlar ve Docker konteyneri izole biçimde ayağa kalkar.
3. **Veri ve Depolama Katmanı (`MinIO`):** Uygulama veya dokümantasyon içerisindeki statik medya dosyaları uygulama konteynerini şişirmemek için doğrudan S3 uyumlu MinIO kovalarından (buckets) servis edilir.

---

## 3. Servis Adlandırma ve Yönlendirme Matrisi

Sunucunun kalıcı Tailscale IP adresinin **`100.84.12.45`** olduğu senaryoda, Nginx üzerinden yönlendirilen tüm altyapı servisleri aşağıdaki standart adres şemasını kullanır:

| Servis | Konteyner İç Portu | `nip.io` Erişim Adresi | Kullanım Amacı |
| :--- | :--- | :--- | :--- |
| **Gitea** | `:3000` | `http://nip.io` | Git depoları ve CI/CD yönetimi |
| **MinIO Konsol** | `:9001` | `http://nip.io` | S3 kova (bucket) ve dosya yönetimi |
| **MinIO S3 API** | `:9000` | `http://nip.io` | Uygulamaların S3 SDK bağlantı noktası |
| **VitePress Docs** | `:80` (Nginx/Static) | `http://nip.io` | Canlı mimari ve geliştirici dokümantasyonu |

---

## 4. Örneklendirme Adımı: VitePress Uçtan Uca Entegrasyon

Belirlenen 8 katmanlı mimarinin ilk çalışan örneği (Proof of Concept), monorepo içindeki **VitePress** dokümantasyon sitesinin yayına alınmasıdır.

### A. Nginx Ters Vekil (Reverse Proxy) Yapılandırması
Gelen alt alan adı isteklerini ilgili Docker servislerine yönlendirmek için Nginx yapılandırma şablonu (`infra/nginx/conf.d/services.conf`):

```nginx
# VitePress Dokümantasyon Yönlendirmesi
server {
    listen 80;
    server_name docs.100-84-12-45.nip.io;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

# Gitea Git Sunucusu Yönlendirmesi
server {
    listen 80;
    server_name gitea.100-84-12-45.nip.io;

    client_max_body_size 512M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

# MinIO Yönetim Konsolu Yönlendirmesi
server {
    listen 80;
    server_name minio.100-84-12-45.nip.io;

    client_max_body_size 1G;

    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### B. VitePress Derleme ve Yayınlama Akışı
1. **Derleme (Node.js):** Monorepo kök dizininde `pnpm --filter docs build` komutu çalıştırılarak statik HTML/CSS/JS çıktıları üretilir.
2. **Paketleme (Docker):** Üretilen statik dosyalar hafif bir Nginx Alpine konteyneri içerisine kopyalanır.
3. **Medya Bağlantısı (MinIO):** Dokümanlarda yer alan ekran görüntüleri ve diyagramlar `http://nip.io/docs-assets/...` adresinden çağrılır.
4. **Doğrulama:** Tailscale ağına bağlı herhangi bir cihazdan (PC veya Mobil) tarayıcı üzerinden `http://nip.io` adresine erişilerek uçtan uca çalışma doğrulanır.

---

## 5. Mimari Kazanımlar ve Sonuç
* **Bağımsız Geliştirme Ortamı:** Bulut sağlayıcılarına veya dış DNS servislerine ücret ödemeden tam teşekküllü bir PaaS/SaaS altyapısı yerel ve hibrit sunucular üzerinde kurulmuştur.
* **Üretim (Production) Uyumluluğu:** Yerel ortamda kullanılan Docker, Nginx ve MinIO (S3) yapısı, sabit IP'li uzak VPS sunucusuna birebir aynı yapılandırmayla taşınabilir durumdadır.

