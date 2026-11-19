---
title: Docker Kaynak Yönetimi
description: docker volume create --label keep=true gitea_data
outline:
  - 2
  - 3
status: published
tags:
  - dict
  - server
---

# Docker Kaynak Yönetimi


:::tip External Volume & Network

- Etiketli kalıcı veri birimi oluşturma 

```bash
docker volume create --label keep=true gitea_data
```
- Etiketli harici ağ oluşturma

```bash
docker network create --label keep=true saas-proxy-net
```

:::



## 1. Sistem Özeti

Temizlik işlemlerine başlamadan önce Docker'ın disk ve ağ üzerindeki genel ayak izini görmek için aşağıdaki özet komutlar kullanılır:

* **Disk Kullanım Özeti:** İmajların, konteynerlerin, volume'lerin ve önbelleğin kapladığı alanı gösterir.
  ```bash
  docker system df
  ```
* **Detaylı Kaynak Dökümü:** Hangi volume veya imajın tam olarak ne kadar yer kapladığını ve aktif kullanılıp kullanılmadığını (`RECLAIMABLE`) listeler.
  ```bash
  docker system df -v
  ```


## 2. Network

### A. Ağ ve IP Bloğu Denetimi
* **Tüm Ağları Listeleme:**
  ```bash
  docker network ls
  ```
* **IP Blokları (Subnet) ve Bağlı Konteyner Analizi:** `/16` havuzunu dolduran boş sanal ağları tespit etmek için kullanılır.
  ```bash
  docker network inspect $(docker network ls -q) --format '{{.Name}} -> {{range .IPAM.Config}}{{.Subnet}}{{end}} | Aktif Konteyner: {{len .Containers}}'
  ```


#### Docker Ağ Sürücüleri (Driver) ve Sistem Ayrımı
`docker network ls` çıktısında listelenen ağları güvenli şekilde denetlemek için sistemin çekirdek ağları ile sonradan oluşturulan ağları ayırmak gerekir:

| Ağ Adı / Türü | Driver (Sürücü) | Kapsam (Scope) | Temizlik Durumu |
| :--- | :--- | :--- | :--- |
| **`bridge`** (Varsayılan) | `bridge` | `local` | **Silinemez.** Docker'ın çekirdek varsayılan ağıdır (`172.17.0.0/16`). |
| **`host`** | `host` | `local` | **Silinemez.** Konteyneri doğrudan ana makine ağına bağlayan sistem sürücüsüdür. |
| **`none`** | `none` | `local` | **Silinemez.** Konteynerin ağ erişimini tamamen kapatan izole sistem sürücüsüdür. |
| **`<proje>_default`** | `bridge` | `local` | **Silinebilir.** `docker-compose.yml` ile otomatik oluşan geçici proje ağıdır. |
| **`saas-proxy-net`** (`external`) | `bridge` | `local` | **Korunmalıdır.** Projeler arası ortak köprüdür; etiket (`keep=true`) ile korunur. |
| **`overlay` / `macvlan`** | `overlay` / `macvlan` | `swarm` / `local` | Çoklu sunucu (Swarm) veya fiziksel MAC ataması için kullanılan gelişmiş sürücülerdir. |



### B. Ağ Temizleme ve Koruma Kuralları
Docker, içerisinde aktif veya durdurulmuş konteyner bulunan ağları kesinlikle silmez; yalnızca tamamen boşta olan ağları temizler.

* **Boş Ağları Toplu Silme:**
  ```bash
  docker network prune
  ```
* **Belirli Bir Ağı Silme:**
  ```bash
  docker network rm <ag_adi_veya_id>
  ```

* **External Ağları Temizlikten Koruma:** Üzerinde geçici olarak konteyner kalmayan `saas-proxy-net` gibi kritik harici ağların `prune` komutuyla silinmesini önlemek için etiketleme (`label`) standardı uygulanır:
```bash
  # Ağ oluşturulurken koruma etiketi eklenir
  docker network create --label keep=true saas-proxy-net

  # Temizlik yapılırken etiketli ağlar hariç tutulur
  docker network prune --filter "label!=keep=true"
```


### C. Sistem Maliyeti ve Havuz Optimizasyonu (Uygulama Adımları)
Sanal ağların donanım (CPU/RAM) maliyeti sıfıra yakın olsa da, varsayılan `/16` blokları hem `iptables` kurallarını şişirir hem de kurumsal VPN/modem ağlarıyla (`172.16–31` ve `192.168`) IP çakışmasına yol açar. 

Sunucu kurulumunda bu sınırı aşmak ve ağ kapasitesini **31'den 256'ya** çıkarmak için `/etc/docker/daemon.json` dosyası `/24` (254 cihaz kapasiteli) standardına göre yapılandırılır:

#### 1. Havuz Yapılandırmasını Uygulama
```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "default-address-pools": [
    {
      "base": "172.80.0.0/16",
      "size": 24
    }
  ]
}
EOF
```

#### 2. Docker Servisini Yeniden Başlatma
```bash
sudo systemctl restart docker
```

#### 3. Yeni Havuzun Doğrulanması
Değişikliğin aktif olduğunu ve yeni ağların `172.80.x.0/24` bloğundan IP aldığını doğrulamak için geçici bir test ağı oluşturulup silinir:

```bash
# Test ağı oluşturma ve IP bloğunu sorgulama (Çıktı: 172.80.x.0/24 olmalıdır)
docker network create test_net
docker network inspect test_net --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'

# Test ağını temizleme
docker network rm test_net
```


## 3. Volumes

Docker host (ana makine) üzerinde Docker tarafından yönetilen depolama alanlarıdır. Linux'ta genellikle `/var/lib/docker/volumes/` altında tutulur. Docker süreci dışındaki uygulamaların veya kullanıcıların bu verilere doğrudan müdahale etmesi önerilmez. Yanlışlıkla silinmeleri **geri döndürülemez veri kaybına** yol açar.

### A. Volume Denetimi
* **Tüm Volume'leri Listeleme:**
  ```bash
  docker volume ls
  ```

  #### Docker Veri Depolama Türleri ve Sistem Ayrımı
`docker volume ls` ve `docker system df` çıktılarında görünen alanları güvenli şekilde yönetmek için Docker'ın üç temel veri bağlama yöntemini ayırmak gerekir:

| Depolama Türü | Fiziksel Konum (Host OS) | `docker volume ls` Görünümü | Temizlik (`prune`) Etkisi ve Durumu |
| :--- | :--- | :--- | :--- |
| **Named Volume** (İsimli Birim) | `/var/lib/docker/volumes/<ad>/` | **Görünür.** Açıkça isimlendirilmiştir (`gitea-data`). | **Korunmalıdır.** Bağlı olduğu konteyner silinse bile `prune` ile silinmez (sadece sahipsiz anonimler silinir); kritik veriler `keep=true` etiketiyle korunur. |
| **Anonymous Volume** (İsimsiz Birim) | `/var/lib/docker/volumes/<hash>/` | **Görünür.** 64 karakterlik rastgele ID alır. | **Silinebilir.** Konteyner silindikten sonra `dangling=true` durumuna düşer ve `docker volume prune` ile temizlenir. |
| **Bind Mount** (Klasör Bağlama) | Projenin kendi dizini (`./data`, `./infra`) | **Görünmez.** Doğrudan ana makine dosya sistemidir. | **Etkilenmez.** Docker yönetim alanı dışındadır; `volume prune` veya `down -v` komutları bu klasörlere dokunmaz. |
| **`tmpfs` Mount** (RAM Depolama) | Ana makine belleği (RAM) | **Görünmez.** Disk üzerinde karşılığı yoktur. | **Otomatik Silinir.** Konteyner durdurulduğu anda veriler bellekten tamamen temizlenir. |

* **Sahipsiz (Dangling) Volume'leri Bulma:** Hiçbir konteynere bağlı olmayan boşta kalmış veri birimlerini listeler.
  ```bash
  docker volume ls -f dangling=true
  ```
* **Volume Detaylarını ve Disk Yolunu İnceleme:** Bir birimin ana makinedeki fiziksel konumunu (`/var/lib/docker/volumes/...`) ve boyutunu kontrol etmek için kullanılır.
  ```bash
  docker volume inspect <volume_adi>
  ```

### B. Güvenli Volume Temizleme
* **Sahipsiz Volume'leri Temizleme:** Sadece hiçbir konteynere bağlı olmayan birimleri siler.
  ```bash
  docker volume prune
  ```
* **Belirli Bir Volume'ü Silme:**
  ```bash
  docker volume rm <volume_adi>
  ```
* **Kritik Veri Koruması (Etiketleme Standardı):** Veritabanı ve depolama servislerinin veri birimleri mutlaka koruma etiketiyle oluşturulur:
  ```bash
  # Kritik volume oluşturma
  docker volume create --label keep=true gitea-data

  # Temizlikte kritik verileri hariç tutma
  docker volume prune --filter "label!=keep=true"
  ```

---


::: warning Named Volume (İsimli Birim) Silinme Sınırları ve Veri Koruması
İsimli veri birimleri (`Named Volumes`) kalıcı veri saklamak üzere tasarlanmıştır ve standart temizlik komutlarıyla (`docker volume prune` veya `docker compose down`) **silinmezler**. Ancak şu 3 komutla kalıcı olarak yok edilirler:

1. **`docker volume rm <volume_adi>`:** Birim hiçbir konteynere bağlı değilse doğrudan silinir.
2. **`docker compose down -v`:** Compose dosyasında tanımlı tüm yerel named volume'leri siler.
3. **`docker volume prune -a` (veya `docker system prune --volumes`):** O an boşta olan tüm named volume'leri temizler.

**Kesin Veri Koruma Standardı (`external: true`):**
Gitea depoları, MinIO dosyaları ve veritabanı birimleri önceden manuel oluşturulup Compose dosyasında `external: true` olarak tanımlanmalıdır. Böylece yanlışlıkla `docker compose down -v` komutu çalıştırılsa dahi harici veri birimi **kesinlikle silinmez**.
:::


## 4. Docker Compose

Geliştirme ve test süreçlerinde artık kaynak birikmesini önlemek için Compose komutları şu kurallara göre çalıştırılır:

| Komut | Konteynerler | Geçici Ağ (`_default`) | Kalıcı Veriler (`Volumes`) | Kullanım Senaryosu |
| :--- | :--- | :--- | :--- | :--- |
| `docker compose stop` | Durdurur | Korur | Korur | Kısa süreli bakım ve duraklatma |
| `docker compose down` | Siler | **Siler** | Korur | Standart proje kapatma (Önerilen) |
| `docker compose down -v` | Siler | **Siler** | **Siler (Dikkat!)** | Test ortamını sıfırdan temizleme |

> **Uyarı:** Üretim (Production) ve kalıcı veri barındıran ortamlarda (Gitea, MinIO, Veritabanı) `docker compose down -v` komutu **kesinlikle** kullanılmamalıdır.



## 5. External Volume

Kritik kalıcı verilerin (Gitea depoları, MinIO dosyaları ve veritabanları) yanlışlıkla silinmesini önlemek için veri birimleri mutlaka proje dışında oluşturulur ve `external: true` parametresiyle bağlanır.

#### 1. Veri Birimini Oluşturma (CLI)
Proje başlatılmadan önce birim tek seferlik oluşturulur ve toplu temizlik komutlarından korumak için etiketlenir:

```bash
# Koruma etiketi ile kalıcı birim oluşturma
docker volume create --label keep=true gitea_data
```

#### 2. Compose Dosyasına Bağlama (`docker-compose.yml`)
Oluşturulan birim `external: true` olarak tanımlandığında, yanlışlıkla `docker compose down -v` komutu çalıştırılsa dahi Docker birimi atlar ve veriyi korur:

```yaml
services:
  gitea:
    image: gitea/gitea:latest
    container_name: gitea
    volumes:
      - gitea_data:/data
    networks:
      - saas-proxy-net

volumes:
  gitea_data:
    external: true

networks:
  saas-proxy-net:
    external: true
```

#### 3. Veri Birimini Kalıcı Olarak Silme (CLI)
Bir `external` volume yalnızca onu kullanan tüm konteynerler kaldırıldıktan sonra doğrudan ismi belirtilerek silinebilir:

```bash
# 1. Önce birimi kullanan konteyneri kaldır (veriler korunur)
docker compose down

# 2. Ardından veri birimini doğrudan ismiyle sil
docker volume rm gitea_data
```
