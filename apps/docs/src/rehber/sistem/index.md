---
tarih: 2026-11-16
saat: 01:19
konu: "Uçtan Uca SaaS Altyapı Mimarisi ve Servis Orkestrasyonu (Master Architecture Guide)"
baglam: "apps/docs / Altyapı Referans Kılavuzu (Node, Docker, Git, Nginx, Tailscale, nip.io, Gitea, MinIO & VitePress)"
durum: "Tamamlandı"
etiketler: [master-guide, altyapi, mimari, nodejs, docker, git, nginx, tailscale, nip-io, gitea, minio, vitepress]
---

# `1.` Sistem Mimarisi

Bu bölümde **SaaS Rehberi** monorepo ekosisteminin temelini oluşturan uygulama ve servisleri yapılandırıp ağ altyapısı ve servislerin birbirleri ile olan etkileşimini  açıklayacağız. **VitePress SSG** ile döküman sistemimizi oluşturup bu proje üzerinden geliştirme ve yayınlama (development-deployment) süreçlerine giriş yapacağız.



## 1. Uygulama ve Servisler

Sistem; geliştirme ortamından dağıtıma kadar birbirini tamamlayan 9 temel araçtan oluşur. e-Mail servisi gerçek ortam gerektirdiği için bu aşamada listeye alınmamıştır.


| Katman | Teknoloji | Temel Görevi | Mimari Katkısı |
| :--- | :--- | :--- | :--- |
| **1** | **Node.js Runtime** | Uygulama ve derleme (build) motoru | Monorepo (pnpm / turbo) bağımlılıklarını ve betiklerini çalıştırır. |
| **2** | **Docker Container** | İzolasyon ve paketleme katmanı | Tüm servisleri (Dex, Gitea, MinIO, Nginx, Uygulamalar) işletim sisteminden bağımsızlaştırır. |
| **3** | **Git** | Kaynak kod versiyon kontrolü | Kod geçmişini, dallanma (branching) stratejisini ve sürüm etiketlerini yönetir. |
| **4** | **Nginx** | Ters vekil (Reverse Proxy) katmanı | Dış ve iç ağdan gelen HTTP/HTTPS isteklerini ilgili konteyner portlarına yönlendirir. |
| **5** | **Tailscale** | WireGuard tabanlı Mesh VPN | Mobil hotspot ve CGNAT engellerini aşarak tüm cihazlara kalıcı 100.x.y.z özel IP'si atar. |
| **6** | **nip.io** | Dinamik DNS çözümleme servisi | Kalıcı IP adreslerini ek DNS maliyetine girmeden alt alan adlarına (servis.100-x-y-z.nip.io) çevirir. |
| **7** | **Dex IdP (SSO)** | Merkezi kimlik doğrulama katmanı | OIDC/OAuth2 protokolüyle Gitea, MinIO ve uygulamalara tek noktadan oturum (SSO) sağlar. |
| **8** | **Gitea** | Self-hosted Git ve CI/CD sunucusu | Özel kod depolarını, otomasyon iş akışlarını (Actions) ve Docker imaj kayıt defterini barındırır. |
| **9** | **MinIO** | S3 uyumlu nesne depolama katmanı | Uygulama medyalarını, büyük varlıkları (assets) ve sistem yedeklerini S3 protokolüyle sunar. |

---

## 2. Katmanlar Arası Etkileşim Akışı
Sistem üzerindeki bir geliştirme döngüsü, kimlik doğrulama ve ağ isteği şu sırayla işler:

```text
[Geliştirici (Git Push)]                   [8. Gitea Container Registry]
       │                                             ▲
       ▼                                             │
[8. Gitea (Repo & CI/CD)] ──▶ [1. Node.js] + [2. Docker Build] ──▶ [9. MinIO (S3 Storage)]
       ▲
       │ (OIDC Doğrulama)
[7. Dex IdP (SSO :5556)] ◀──┐
                            │
[İstemci (Tarayıcı/Mobil)] ──▶ [5. Tailscale (100.x.y.z)] ──▶ [6. nip.io DNS]
                                                                    │
                                                                    ▼
[9. MinIO (S3 Storage)] ◀── [Uygulama / VitePress] ◀── [4. Nginx Reverse Proxy]
```


1. **Ağ ve Erişim Katmanı (`Tailscale` + `nip.io` + `Nginx`):** Fiziksel ağ (mobil erişim noktası veya yerel Wi-Fi) değişse bile Tailscale sayesinde cihazın IP adresi (`100.x.y.z`) sabit kalır. `nip.io` bu IP'yi tireli alt alan adlarına dönüştürür ve Nginx gelen isteği hedef konteynere iletir.
2. **Kod ve Otomasyon Katmanı (`Git` + `Gitea` + `Node.js` + `Docker`):** Yerel ortamda geliştirilen kod Gitea'ya gönderilir. Node.js çalışma zamanı derlemeyi tamamlar ve Docker konteyneri izole biçimde ayağa kalkar.
3. **Veri ve Depolama Katmanı (`MinIO`):** Uygulama veya dokümantasyon içerisindeki statik medya dosyaları, uygulama konteynerini şişirmemek için doğrudan S3 uyumlu MinIO kovalarından (buckets) servis edilir.




## 3. Servis Adlandırma ve Yönlendirme Matrisi
Sunucunun kalıcı Tailscale IP adresinin **100.84.12.45** olduğu senaryoda, ortak `saas-proxy-net` (`external`) ağı üzerinden Nginx ile yönlendirilen tüm altyapı servisleri aşağıdaki standart adres şemasını kullanır:

| Servis | Konteyner İç Portu | nip.io Erişim Adresi | Kullanım Amacı |
| :--- | :--- | :--- | :--- |
| **Dex SSO** | `:5556` | `http://100-84-12-45.nip.io` | Merkezi OIDC kimlik doğrulama ve kullanıcı yönetimi |
| **Gitea** | `:3000` | `http://nip.io` | Git depoları ve CI/CD yönetimi |
| **MinIO Konsol** | `:9001` | `http://nip.io` | S3 kova (bucket) ve dosya yönetimi |
| **MinIO S3 API** | `:9000` | `http://nip.io` | Uygulamaların S3 SDK bağlantı noktası |
| **VitePress Docs** | `:4173` (veya `:80`) | `http://nip.io` | Canlı mimari ve geliştirici dokümantasyonu |

---

## 4. Örneklendirme Adımı: VitePress ve Servislerin Uçtan Uca Entegrasyonu

Belirlenen 9 katmanlı mimarinin ilk çalışan örneği (Proof of Concept), tüm servislerin dışarıya port açmadan tek bir `external` ağ (`saas-proxy-net`) üzerinden Nginx ile yayına alınmasıdır.

### A. Nginx Ters Vekil (Reverse Proxy) Yapılandırması
Konteyner yeniden başlatmalarında yaşanabilecek IP değişimlerinden (502 Bad Gateway) etkilenmemek için Docker gömülü DNS (`127.0.0.11`) ve değişken tabanlı dinamik yönlendirme kullanılan Nginx yapılandırma şablonu (`infra/nginx/conf.d/services.conf`):

```nginx
# 1. VitePress Dokümantasyon Yönlendirmesi
server {
    listen 80;
    server_name docs.100-84-12-45.nip.io;
    resolver 127.0.0.11 valid=10s ipv6=off;

    location / {
        set \$docs_upstream http://docs:4173;
        proxy_pass \$docs_upstream;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

# 2. Dex IdP (SSO) Kimlik Doğrulama Yönlendirmesi
server {
    listen 80;
    server_name dex.100-84-12-45.nip.io;
    resolver 127.0.0.11 valid=10s ipv6=off;

    location / {
        set \$dex_upstream http://dex:5556;
        proxy_pass \$dex_upstream;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# 3. Gitea Git Sunucusu Yönlendirmesi
server {
    listen 80;
    server_name gitea.100-84-12-45.nip.io;
    resolver 127.0.0.11 valid=10s ipv6=off;

    client_max_body_size 512M;

    location / {
        set \$gitea_upstream http://gitea:3000;
        proxy_pass \$gitea_upstream;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

# 4. MinIO Yönetim Konsolu Yönlendirmesi
server {
    listen 80;
    server_name minio.100-84-12-45.nip.io;
    resolver 127.0.0.11 valid=10s ipv6=off;

    client_max_body_size 1G;

    location / {
        set \$minio_upstream http://minio:9001;
        proxy_pass \$minio_upstream;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# 5. MinIO S3 API Yönlendirmesi
server {
    listen 80;
    server_name s3.100-84-12-45.nip.io;
    resolver 127.0.0.11 valid=10s ipv6=off;

    client_max_body_size 1G;

    location / {
        set \$s3_upstream http://minio:9000;
        proxy_pass \$s3_upstream;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
```

### B. VitePress Derleme ve Yayınlama Akışı
1. **Derleme (Node.js):** Monorepo kök dizininde `pnpm --filter docs build` komutu çalıştırılarak statik HTML/CSS/JS çıktıları üretilir.
2. **Paketleme (Docker):** Üretilen statik dosyalar hafif bir Nginx Alpine konteyneri içerisine kopyalanır ve `saas-proxy-net` ağına bağlanır.
3. **Medya Bağlantısı (MinIO):** Dokümanlarda yer alan ekran görüntüleri ve diyagramlar `http://nip.io/docs-assets/...` adresinden çağrılır.
4. **Doğrulama:** Tailscale ağına bağlı herhangi bir cihazdan (PC veya Mobil) tarayıcı üzerinden `http://nip.io` adresine erişilerek uçtan uca çalışma doğrulanır.


---

## 5. Mimari Kazanımlar ve Sonuç
* **Bağımsız Geliştirme Ortamı:** Bulut sağlayıcılarına veya dış DNS servislerine ücret ödemeden tam teşekküllü bir PaaS/SaaS altyapısı yerel ve hibrit sunucular üzerinde kurulmuştur.
* **Üretim (Production) Uyumluluğu:** Yerel ortamda kullanılan Docker, Nginx ve MinIO (S3) yapısı, sabit IP'li uzak VPS sunucusuna birebir aynı yapılandırmayla taşınabilir durumdadır.

