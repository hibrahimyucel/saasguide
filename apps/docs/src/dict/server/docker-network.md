---
tarih: 2026-11-15
saat: 20:44
konu: "Docker Ağ Mimarisi, Port Güvenliği ve Dağıtım Senaryoları"
baglam: "apps/docs (VitePress Rehberi) / Konteyner ve Sunucu Ağ Topolojisi"
durum: "Tamamlandı"
etiketler: [vitepress, docker, network, ports, expose, reverse-proxy, güvenlik, mimari]
---

# Docker Ağı

## 1. Lokal IP Blokları

Docker ağlarını (`bridge`, `custom bridge`, `external`) ve Tailscale Mesh VPN yapısını kurgulamadan önce, uluslararası internet standartlarının yerel ağlar ve özel sistemler için ayırdığı IP bloklarını bilmek gerekir. Bu sınırlar, sanal ağların gerçek internet adresleriyle veya birbirleriyle çakışmasını önler.

### 1. Standart Özel IP Blokları Özeti

İnternet üzerinde doğrudan yönlendirilmeyen (routable olmayan), yalnızca yerel ağlarda, veri merkezlerinde ve sanal konteyner ortamlarında kullanılan temel IP aralıkları şunlardır:

| Standart / Sınıf | IP Aralığı | CIDR Notasyonu | Toplam IP Kapasitesi | Tipik Kullanım Alanı |
| :--- | :--- | :--- | :--- | :--- |
| **Loopback (Yerel Döngü)** | `127.0.0.0` – `127.255.255.255` | `127.0.0.0/8` | ~16.7 Milyon | Cihazın kendisi (`localhost` / `127.0.0.1`) ve Docker gömülü DNS (`127.0.0.11`). |
| **RFC 1918 (A Sınıfı)** | `10.0.0.0` – `10.255.255.255` | `10.0.0.0/8` | ~16.7 Milyon | Büyük kurumsal ağlar, bulut sunucu (VPC) iç ağları ve Kubernetes. |
| **RFC 1918 (B Sınıfı)** | `172.16.0.0` – `172.31.255.255` | `172.16.0.0/12` | ~1 Milyon | **Docker varsayılan sanal ağları** (`172.17.x.x` – `172.31.x.x`). |
| **RFC 1918 (C Sınıfı)** | `192.168.0.0` – `192.168.255.255` | `192.168.0.0/16` | 65.536 | Ev modemleri, yerel Wi-Fi ağları ve mobil erişim noktaları (Hotspot). |
| **RFC 6598 (CGNAT)** | `100.64.0.0` – `100.127.255.255` | `100.64.0.0/10` | ~4.19 Milyon | **Tailscale Mesh VPN** cihaz IP'leri ve telekomünikasyon taşıyıcı ağları. |
| **Link-Local (APIPA)** | `169.254.0.0` – `169.254.255.255` | `169.254.0.0/16` | 65.536 | DHCP sunucusundan IP alamayan cihazların otomatik atadığı acil durum IP'si. |

---

### 2. Kritik Blokların Mimari Detayları

#### A. Loopback Ağı (`127.0.0.0/8`)
* **Makine İçi İzolasyon:** `127.0.0.1` adresi her işletim sisteminin ve her Docker konteynerinin **kendi içine** döner. Bir konteynerin içinden `127.0.0.1` adresine atılan istek ana makineye (Host) veya başka bir konteynere çıkmaz.
* **Docker DNS İstisnası:** Docker özel ağlarında `127.0.0.11` adresi, konteyner içindeki gömülü DNS çözümleyicisine ayrılmıştır.

#### B. RFC 1918 Yerel Ağ Blokları ve Docker Sınırı
Uluslararası standartlar gereği sadece belirli aralıklar özel ağ olarak kullanılabilir. Bu sınırların dışındaki adresler (örneğin `172.15.x.x` veya `172.32.x.x`) gerçek internetteki genel (public) sunuculara aittir.
* **Docker Kullanımı (`172.17` – `172.31`):** Docker varsayılan olarak B sınıfı bloğun `17` ile `31` arasındaki **15 adet `/16` bloğunu** kullanır. Bloklar dolduğunda ikinci havuz olarak C sınıfı (`192.168.x.x`) bloğuna geçer.
* **Çakışma Riski:** Kurumsal bir VPN'e bağlanıldığında veya mobil erişim noktası açıldığında, dış ağın kullandığı `172.x` ya da `192.168.x` bloğu ile Docker sanal ağının bloğu aynı olursa bağlantı kesilir.

#### C. CGNAT Paylaşımlı Ağ Bloğu (`100.64.0.0/10`)
* **Tailscale'in Tercih Nedeni:** Ev modemleri (`192.168`), şirket ağları (`10`) ve Docker (`172.17–31`) standart RFC 1918 bloklarını kullandığı için Tailscale çakışmayı sıfıra indirmek amacıyla CGNAT bloğunu seçmiştir.
* **Sıfır Çakışma:** `100.64.0.0` ile `100.127.255.255` arasındaki IP'ler yerel ağlar ve Docker konteyner ağlarıyla hiçbir zaman çakışmaz.

```
[ DIŞ AĞ: Şirket Ağı / Kurumsal VPN / Ev Modemi ]
  └── Kullanılan Blok: 172.18.0.0/16  (Örn: Şirket Veritabanı Sunucusu: 172.18.5.20)
         │
         ▼  (Fiziksel Ağ Kartı: eth0 / wlan0 / vpn0)
┌──────────────────────────────────────────────────────────────────────────┐
│                       ANA MAKİNE (HOST OS / SUNUCU)                      │
│                                                                          │
│  ⚠️ ÇAKIŞMA NOKTASI: Yönlendirme Tablosu (Routing Table)                 │
│  ─────────────────────────────────────────────────────────────────────   │
│  Sistem iki farklı kapıda aynı IP bloğunu görür ve karar veremez:        │
│   1. "172.18.0.0/16 bloğuna gitmek için -> Şirket VPN'e (vpn0) çık"      │
│   2. "172.18.0.0/16 bloğuna gitmek için -> Docker Ağına (br-01) gir"     │
│                                                                          │
│  Sonuç: Şirketteki 172.18.5.20 sunucusuna atılan istek dışarı çıkamaz,   │
│         yerel Docker ağına düşer ve "Bağlantı Zaman Aşımı" hatası verir. │
│                                                                          │
│         │ (br-01 Köprüsü: 172.18.0.1)       │ (br-02 Köprüsü: 172.19.0.1)│
│         ▼                                   ▼                            │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐     │
│  │ DOCKER AĞI 1 (gitea_default)│     │ DOCKER AĞI 2 (minio_default)│     │
│  │ Blok: 172.18.0.0/16         │     │ Blok: 172.19.0.0/16         │     │
│  │                             │     │                             │     │
│  │  • Gitea  (172.18.0.2)      │  X  │  • MinIO  (172.19.0.2)      │     │
│  │  • DB     (172.18.0.3)      │◄───►│  • Redis  (172.19.0.3)      │     │
│  │    ▲                        │     │                             │     │
│  │    └─ (Aynı ağda erişir)    │     │   (DOCKER-ISOLATION Duvarı: │     │
│  └─────────────────────────────┘     │    172.18 <-> 172.19 YASAK) │     │
│                                      └─────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
         ▲
         │  (Sanal Ağ Kartı: tailscale0)
┌────────┴─────────────────────────────────────────────────────────────────┐
│ [ TAILSCALE MESH VPN AĞI - GÜVENLİ BÖLGE ]                               │
│  └── Kullanılan Blok: 100.64.0.0/10 (Örn: Sunucu IP: 100.84.12.45)       │
│  └── Durum: Ne şirket ağı (172.18) ne de Docker (172.18-19) bu bloğu     │
│             kullanmadığı için yönlendirme tablosunda SIFIR ÇAKIŞMA olur. │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3. CIDR (`/16`, `/24`) ve Kapasite Hesabı

IP adreslerinin sonuna eklenen `/16` veya `/24` ifadeleri, 32 bitlik IP adresinin kaç bitinin **Ağ Kimliği (Network ID)**, kaç bitinin **Cihaz Adresi (Host ID)** olduğunu belirler:

* **`/16` Maskesi (`255.255.0.0`):** İlk 2 blok (16 bit) ağa, son 2 blok cihazlara ayrılır. Ağ ve yayın adresleri (`.0.0` ve `.255.255`) düşüldüğünde tek bir ağda `256 × 256 - 2 = 65.534` cihaz barınabilir.
* **`/24` Maskesi (`255.255.255.0`):** İlk 3 blok (24 bit) ağa, son blok cihazlara ayrılır. Tek bir ağda `256 - 2 = 254` cihaz barınabilir. Docker üretim ortamlarında IP havuzunu tasarruflu kullanmak için `/16` yerine `/24` tercih edilir.



## 2. Docker Ağı

Docker, konteynerleri bağımsız makineler olarak çalıştırır ve herbiri için sanal köprü ağları (Bridge Networks) oluşturur. Sunucuda `hostname -I` çalıştırıldığında görülen `172.x.0.1` adresleri bu sanal ağların yönlendirici (gateway) adresleridir.

* **Makina Ağı (`host`):** Dış portları yöneten sistem köprüsüdür. Doğrudan herhangi bir konteyner tarafından kullanılmaz.

* **Varsayılan Ağ (`default`):** `docker run` ile ağ belirtilmeden başlatılan konteynerlerin düştüğü varsayılan ağdır (`172.17.0.0/16`). Konteynerler birbirini isimleriyle (DNS) tanıyamaz; yalnızca IP adresleriyle iletişim kurabilir. Üretim ve modern geliştirmede tercih edilmez.

* **Özel Ağlar (`custom / user-defined`):** Docker, `docker-compose.yml` içinde harici ağ belirtilmediğinde her proje klasörü için otomatik olarak izole bir ağ oluşturur. İsim belirtilmemişse (`projeadi_default` - `172.18.0.0/16` vb.) oluşturur.  
  * **Dahili DNS Sunucusu (`127.0.0.11`) :** Aynı dosyadaki (konteyner) servisler isimle (DNS) haberleşebilir.
  * **Tam İzolasyon:** Farklı projelerdeki konteynerler Docker güvenlik duvarı (`DOCKER-ISOLATION`) nedeniyle birbirini göremez.

* **Harici Ağlar (`external`):**
  Özel ağlardan farklı olarak herhangi bir konteyner bağımlılığı olmadan kullanıcı tarafından `docker network create` komutu ile oluşturulur. Farklı projeler ağa dahil edilebilir ve hepsi `docker compose down` ile kapatılsa bile ağ silinmez.
  
---




## 3. Port Spesifikasyonları ve Güvenlik Kuralları

Docker Compose dosyalarında port tanımlarken **dışa yayınlama (`ports`)** ile **iç ağ erişimi (`expose`)** arasındaki ayrım kritik bir güvenlik sınırıdır.

| Özellik | `ports: ["8080:80"]` (Dışa Yayınlama) | `expose: ["80"]` veya Tanımsız (İç Ağ) |
| :--- | :--- | :--- |
| **Erişim Kapsamı** | Ana makine (Host) ve yerel ağdaki/internetteki tüm cihazlar erişebilir. | **Yalnızca** aynı Docker ağı (`pr2_dev_network`) içindeki komşu konteynerler erişebilir. |
| **Firewall Etkisi** | Docker `iptables` kurallarını değiştirerek güvenlik duvarını aşabilir. | Dış dünyadan tamamen gizlidir ve güvenlidir. |
| **Mimari Kullanım** | Sadece kapıdaki Reverse Proxy (`nginx_proxy`) için kullanılır. | Arkadaki tüm servisler (API, Gitea Web, DB, Redis) için kullanılır. |

### Kritik Mimari Kural
Kapıda bir Reverse Proxy (Nginx) bulunuyorsa, arkadaki servislerin `docker-compose.yml` dosyalarında **`ports` tanımı yapılmamalıdır**. Aksi takdirde:
1. İstemciler `https://domain.com` (Nginx) yerine doğrudan `http://SUNUCU_IP:3000` adresine giderek SSL şifrelemesini ve güvenlik katmanlarını atlayabilir.
2. Veritabanı (`5432`, `3306`) veya önbellek (`6379`) portları saldırılara açık hale gelir.

### Port Çakışması Kuralları

* **Konteyner İç Portlarında Çakışma OLMAZ:** Her konteynerin kendi sanal ağ kartı ve izole IP adresi (`172.18.0.2`, `172.18.0.3` vb.) vardır. Aynı Docker ağı içinde 10 farklı konteynerin tamamı aynı anda `80` veya `3000` portunu kullanabilir (`http://servis1:3000`, `http://servis2:3000`).
* **Ana Makine (Host) Portlarında Çakışma OLUR:** `ports: ["DIŞ_PORT:İÇ_PORT"]` tanımındaki sol taraf (ana makine portu) tektir. İki farklı konteyner aynı anda ana makinenin `80` portuna bağlanamaz. `port is already allocated` hatası verir.

---

## 4. Geliştirme ve Yayınlama Mimari Senaryoları

### Senaryo A: Tek Sunucu / Ortak Ağ Topolojisi (Mevcut Yapı)
Tüm mikroservisler ve araçlar kendi bağımsız `docker-compose.yml` dosyalarında tanımlanır, ancak harici (`external: true`) tek bir ortak ağ üzerinden Nginx ile haberleşir.

```text
[ Dış İstemci / Tarayıcı ]
           │
           ▼ (HTTPS :443 / HTTP :80)
┌──────────────────────────────────────────────────────────┐
│ AlmaLinux Host (192.168.218.161)                         │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │ pr2_dev_network (Docker Bridge - 172.18.0.0/16)  │   │
│   │                                                  │   │
│   │   ┌─────────────────┐                            │   │
│   │   │   nginx_proxy   │ (Ports: 80:80, 443:443)    │   │
│   │   └────────┬────────┘                            │   │
│   │            │ (Dahili DNS: 127.0.0.11)            │   │
│   │            ├───► http://docs_prod:80             │   │
│   │            ├───► http://docs_dev:5174            │   │
│   │            └───► http://pr2_dev_gitea:3000       │   │
│   └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Senaryo B: Katmanlı İzolasyon (Üretim / Production Standardı)
Canlı sistemlerde veri güvenliğini maksimize etmek için ağ iki katmana bölünür. Nginx ile veritabanı katmanı arasında doğrudan ağ bağlantısı bulunmaz.

```text
[ İnternet ] ──► [ nginx_proxy ]
                       │
            ┌──────────┴──────────┐
            │     public_net      │ (Sadece Web & API Trafiği)
            └──────────┬──────────┘
                       ▼
               [ nodejs_api ] ◄─── (Çift Ağ Kartlı Köprü Servis)
                       │
            ┌──────────┴──────────┐
            │     backend_net     │ (Tam İzole Veri Katmanı)
            └──────────┬──────────┘
                       ├───► [ postgresql :5432 ]
                       └───► [ redis      :6379 ]
```

### Senaryo C: Hibrit Geliştirme Topolojisi (`host.docker.internal`)
Nginx, veritabanları ve altyapı servisleri (Gitea, MinIO) Docker içinde çalışırken; geliştirilen Node.js veya VitePress uygulamasının imaj derleme (build) süresi beklemeden doğrudan ana makine terminalinde (`pnpm dev`) çalıştırıldığı senaryodur.

```text
[ Tarayıcı ] ──► [ nginx_proxy (Docker) ]
                       │
                       ├───► http://pr2_dev_gitea:3000           (Docker İçi Konteyner)
                       │
                       └───► http://docker.internal    (AlmaLinux Host Terminal)
```

#### 1. Docker Compose Köprü Tanımı (`docker-compose.yml`)
Docker konteynerinin içinden ana makinenin ağ geçidine (`host-gateway`) erişim izni vermek için `nginx_proxy` servisine şu tanım eklenir:

```yaml
services:
  nginx_proxy:
    image: nginx:alpine
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

#### 2. Nginx Yönlendirme Ayarı (`services.conf`)
Ana makinede çalışan geliştirme sunucusuna (VitePress / Node.js) trafik aktarmak ve WebSocket (Hot Module Replacement / Canlı Yenileme) bağlantısını korumak için kullanılan yapılandırma:

```nginx
server {
    listen 80;
    server_name docs.100-84-12-45.nip.io;
    resolver 127.0.0.11 valid=10s ipv6=off;

    location / {
        set \$docs_upstream http://host.docker.internal;
        proxy_pass \$docs_upstream;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        
        # Vite / Next.js Hot-Reload (WebSocket) desteği
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 3. Geliştirme Sunucusunu Güvenli Şekilde Başlatma (Ağ İzolasyonu)
Ana makinede başlatılan geliştirme sunucuları varsayılan olarak yalnızca `127.0.0.1` (localhost) arayüzünü dinler ve Docker köprüsünden (`172.x.0.1`) gelen istekleri reddeder. Erişimi açmak için sunucu tüm ağ arayüzlerini (`0.0.0.0`) dinleyecek şekilde başlatılmalıdır:

```bash
# VitePress veya Vite tabanlı projeler için
pnpm --filter docs dev --host 0.0.0.0
```

> **Güvenlik Uyarısı:** Sunucuyu `--host 0.0.0.0` ile başlatmak portu yerel Wi-Fi (`192.168.x.x`) ve Tailscale (`100.x.y.z`) dahil tüm ağ kartlarına açar. Yerel ağdaki diğer cihazların geliştirme sunucusuna doğrudan erişmesini önlemek için uygulama yalnızca **Docker Ağ Geçidi (Gateway)** IP'sine bağlanabilir:

```bash
# Ortak ağın (saas-proxy-net) ağ geçidi IP'sini otomatik bularak sadece ona bağlama
DOCKER_GW=\$(docker network inspect saas-proxy-net -f '{{(index .IPAM.Config 0).Gateway}}')
pnpm --filter docs dev --host \$DOCKER_GW --port 4173
```

* **Güvenlik Kazanımı:** Bu yöntemle port yalnızca Docker köprüsüne (`172.x.0.1`) açılır; dış ağlardan veya yerel Wi-Fi üzerinden `4173` portuna doğrudan erişim engellenir ve tüm trafik yalnızca Nginx üzerinden geçer.
* **Üretim (Production) Kuralı:** Hibrit topoloji (`host.docker.internal`) yalnızca geliştirme hızı içindir; canlı ortamlarda tüm uygulamalar imaj haline getirilip kapalı Docker ağına alınır.

