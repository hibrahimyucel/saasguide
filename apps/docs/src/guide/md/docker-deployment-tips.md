---
tarih: 2026-11-12
saat: 17:38
konu: "Docker İmaj Taşıma, Dağıtım (Deployment) ve Bakım İpuçları"
baglam: "apps/docs / Docker Operasyonları ve Sunucu Dağıtım Stratejileri"
durum: "Tamamlandı"
etiketler: [docker, deployment, save-load, export-import, vps, operasyon, ipuclari]
---

# 🚀 Docker İmaj Taşıma, Dağıtım (Deployment) ve Bakım İpuçları

Bu doküman; Docker imajlarının harici bir kayıt defterine (Docker Hub, GHCR vb.) ihtiyaç duymadan yerel makineden uzak sunucuya (VPS) taşınması, kritik komut farkları ve sunucu sağlığını korumak için uygulanması gereken temel operasyonel ipuçlarını içerir.

---

## 1. İmaj Kaydetme, Taşıma ve Yükleme (Save / Load)

Sunucu üzerinde yeniden derleme (build) yaparak işlemci ve RAM tüketmek yerine, yerel bilgisayarda hazırlanan imajı doğrudan sunucuya aktarabilirsiniz.

### Adım 1: İmajı Sıkıştırılmış Arşiv Olarak Kaydetme
* **Standart Arşiv (`.tar`):**
  ```bash
  docker save -o vitepress-docs.tar imaj_adi:etiket
  ```
* **Sıkıştırılmış Arşiv (`.tar.gz` — Önerilen):** Dosya boyutunu %60 ile %70 oranında küçülterek ağ transferini hızlandırır.
  ```bash
  docker save imaj_adi:etiket | gzip > vitepress-docs.tar.gz
  ```

### Adım 2: Uzak Sunucuya (VPS) Aktarma
* **Dosya Transferi ile Gönderme:**
  ```bash
  scp vitepress-docs.tar.gz kullanici@sunucu_ip:/hedef/klasor/
  ```
* **Tek Komutla Doğrudan Sunucuya Aktarma (SSH Pipe):** Yerel diskinizde geçici arşiv dosyası oluşturmadan imajı sıkıştırıp doğrudan uzak sunucunun Docker motoruna yükler.
  ```bash
  docker save imaj_adi:etiket | gzip | ssh kullanici@sunucu_ip "gunzip | docker load"
  ```

### Adım 3: Hedef Sunucuda İmajı İçeri Alma ve Doğrulama
* **Sıkıştırılmış Dosyadan Yükleme:**
  ```bash
  gunzip -c vitepress-docs.tar.gz | docker load
  ```
* **Standart `.tar` Dosyasından Yükleme:**
  ```bash
  docker load -i vitepress-docs.tar
  ```
* **Yüklenen İmajı Kontrol Etme:**
  ```bash
  docker images
  ```

---

## 2. Kritik Fark: `save / load` vs. `export / import`

Docker ekosisteminde sıklıkla karıştırılan bu iki komut çifti tamamen farklı amaçlara hizmet eder:

| Özellik | `docker save` & `docker load` | `docker export` & `docker import` |
| :--- | :--- | :--- |
| **Hedef Nesne** | **İmajlar (Images)** üzerinde çalışır. | **Konteynerler (Containers)** üzerinde çalışır. |
| **Katman Geçmişi** | Tüm katmanları (layers) ve etiketleri (tags) korur. | Tüm katmanları tek bir düz dosya sisteminde birleştirir. |
| **Metadata ve Ayarlar** | `CMD`, `ENTRYPOINT`, `EXPOSE`, `ENV` ayarlarını korur. | Çalıştırma komutlarını ve port ayarlarını siler. |
| **Kullanım Amacı** | Hazır bir uygulamayı başka bir sunucuya dağıtmak (Deployment). | Bir konteynerin anlık dosya sistemi yedeğini almak. |

---

## 3. Sunucu Dağıtımı (Deployment) İçin Altın İpuçları

Canlı sunucularda kesintisiz ve güvenli çalışma için dikkat edilmesi gereken pratik kurallar:

* **Sürüm Etiketleme (Tagging) Kullanın:** Her dağıtımda yalnızca `:latest` etiketi kullanmak yerine tarih veya sürüm numarası verin (`vitepress-docs:v1.0.2`). Hatalı bir güncelleme durumunda eski etikete saniyeler içinde geri dönebilirsiniz (Rollback).
* **Eski İmajları ve Önbelleği Temizleyin:** Zamanla biriken sahipsiz (`<none>`) imajlar sunucu diskini doldurur. Belirli aralıklarla temizlik yapın:
  ```bash
  docker image prune -f
  ```
* **Yeniden Başlatma Politikası Ekleyin:** Sunucu yeniden başlatıldığında veya uygulama beklenmedik bir hata aldığında konteynerin otomatik ayağa kalkması için `docker-compose.prod.yml` dosyasında `restart: unless-stopped` kuralını mutlaka tanımlayın.
* **Konteyner İçini İnceleme (Debugging):** Çalışan bir konteynerin dosya sistemini veya ağ bağlantısını kontrol etmek için etkileşimli kabuk başlatın:
  ```bash
  docker exec -it vitepress_docs_dev sh
  ```
  *(Not: Alpine Linux imajlarında `bash` yerine `sh` kullanılır.)*
* **Anlık Kaynak Tüketimini İzleme:** Konteynerlerin RAM ve CPU kullanımını tek ekranda görmek için:
  ```bash
  docker stats
  ```
