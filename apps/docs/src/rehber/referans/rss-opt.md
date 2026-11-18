---
tarih: 2026-11-18
konu: "Bireysel ve Düşük Bütçeli Altyapılar İçin Kapasite Planlama ve Optimizasyon Rehberi"
baglam: "Altyapı Mimarisi / Kaynak Yönetimi Başvuru Dokümanı"
durum: "Aktif Referans"
etiketler: [capacity-planning, optimization, self-hosted, indie-saas, swap, docker-limits, almalinux]
---

# Bireysel Geliştiriciler İçin Kapasite Planlama ve Kaynak Optimizasyonu

Bu başvuru dokümanı; büyük kurumsal sunucu bütçeleri olmadan, tek bir giriş seviyesi VPS (**2 vCPU, 2 GB RAM, 80–160 GB Disk**) üzerinde tüm **SaaS Rehberi** altyapısını (`AlmaLinux 9`, `Nginx`, `Tailscale`, `Dex`, `Gitea`, `MinIO`) kararlı, güvenli ve kesintisiz çalıştırmak isteyen bağımsız geliştiriciler için hazırlanmıştır.

---

## 1. Mimari Tasarruf Prensipleri

Kurumsal altyapılardaki yüksek donanım maliyetlerinden kaçınmak için sistem tasarımında şu dört temel kural uygulanır:

* **Go ve C Tabanlı Hafif Yığın:** Seçilen tüm çekirdek servisler (`Dex`, `Gitea`, `MinIO`, `Tailscale`, `Nginx`) JVM veya ağır çalışma zamanlarına ihtiyaç duymayan, düşük bellek ayak izine sahip derlenmiş dillerle yazılmıştır.
* **Harici Veritabanı Yerine SQLite:** Hem `Dex` hem de `Gitea` için ayrı bir PostgreSQL veya MySQL konteyneri ayağa kaldırmak yerine yerleşik **SQLite** motoru kullanılır. Bu tercih tek başına **300–500 MB RAM** tasarrufu sağlar.
* **Tek Diskli (Standalone) Nesne Depolama:** Tek diskli sunucularda `MinIO` üzerinde Erasure Coding bölümlemesi yapılmaz; servis doğrudan tek bir dizin (`/data`) üzerinden çalıştırılarak disk kapasitesinin **%100'ü** net alan olarak kullanılır.
* **Yedeklilik Yerine Periyodik Dış Yedekleme:** Sunucu içi donanım yedekliliği (RAID/Cluster) kurmak yerine, kritik veriler (`SQLite` veritabanları ve `MinIO` kovaları) sıkıştırılarak harici bir bulut depolamaya veya yerel bilgisayara periyodik olarak yedeklenir.

---

## 2. Donanım Kaynak Dağılım Matrisi (2 vCPU / 2 GB RAM)

2048 MB fiziksel bellek üzerinde servislerin birbirini engellemeden çalışabilmesi için beklenen tüketim ve önerilen üst sınırlar aşağıdadır:

| Katman / Servis | Boşta (Idle) RAM | Yük Altında RAM | Önerilen Docker Bellek Limiti |
| :--- | :--- | :--- | :--- |
| **AlmaLinux 9 + SELinux + firewalld + Fail2ban** | ~350 MB | ~450 MB | Sistem (Host OS) |
| **Tailscale + Nginx + Certbot** | ~60 MB | ~120 MB | Sistem / ~150 MB |
| **Dex (SSO / OIDC + SQLite)** | ~35 MB | ~80 MB | `128M` |
| **Gitea (Git + OCI Registry + SQLite)** | ~150 MB | ~400 MB | `512M` |
| **MinIO (Standalone Nesne Depolama)** | ~120 MB | ~350 MB | `512M` |
| **TOPLAM KULLANIM** | **~715 MB** | **~1.400 MB** | **~600 MB Güvenli Tampon** |

### Disk Alanı Dağılımı (80–160 GB)
* **İşletim Sistemi ve Docker İmajları:** ~12–15 GB
* **Gitea Depoları ve Docker Registry:** ~15–30 GB (Kullanılmayan eski imaj katmanları düzenli temizlenmelidir).
* **MinIO Nesne Depolama ve Yedekler:** Kalan **~50–115 GB** net kullanılabilir alan.

---

## 3. Zorunlu Sistem Optimizasyonları

2 GB RAM sınırında anlık trafik veya derleme (build) sıçramalarında Linux çekirdeğinin servisleri sonlandırmasını (**OOM Killer**) önlemek için aşağıdaki iki ayar mutlaka uygulanmalıdır.

### A. AlmaLinux 9 Üzerinde Swap (Takas Alanı) Oluşturma
Fiziksel RAM dolduğunda diski acil durum belleği olarak kullanmak için **2 GB veya 4 GB** boyutunda bir Swap dosyası tanımlayın:

```bash
# 2 GB boyutunda swap dosyası oluşturma ve izinlerini ayarlama
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile

# Swap alanını biçimlendirme ve aktif etme
sudo mkswap /swapfile
sudo swapon /swapfile

# Yeniden başlatmalarda kalıcı olması için fstab dosyasına ekleme
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Doğrulama
free -h
```

### B. Docker Compose Bellek Sınırlandırması
Herhangi bir konteynerin tüm sunucu belleğini tüketmesini engellemek için `docker-compose.yml` içindeki servislere bellek limitleri tanımlayın:

```yaml
services:
  dex:
    image: ghcr.io/dexidp/dex:latest
    deploy:
      resources:
        limits:
          memory: 128M

  gitea:
    image: gitea/gitea:latest
    deploy:
      resources:
        limits:
          memory: 512M

  minio:
    image: quay.io/minio/minio:latest
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## 4. Operasyonel Bakım Kuralları (Düşük Kaynak Hijyeni)

* **CI/CD Eşzamanlılık Sınırı:** Gitea Actions üzerinde proje derlemesi (`pnpm build`, Docker image build) çalıştırılıyorsa, işlemci ve RAM darboğazını önlemek için runner yapılandırmasında eşzamanlı görev sayısı `capacity: 1` olarak tutulmalıdır.
* **Docker Temizliği:** Gitea Container Registry veya yerel derlemeler sonrasında biriken sahipsiz (dangling) imaj ve önbellekleri temizlemek için ayda bir kez `docker system prune -f` komutu çalıştırılmalıdır.
* **MinIO Yaşam Döngüsü (Lifecycle):** Log ve veritabanı yedeklerinin tutulduğu MinIO kovalarında (buckets), belirli bir günden (örneğin 30 gün) eski dosyaları otomatik silen yaşam döngüsü kuralları aktif edilmelidir.
