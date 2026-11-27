---
title: "AlmaLinux 9 VPS Referans, Yetki Politikası ve Cheatsheet"
description: "AlmaLinux 9 sunucu yönetimi için katmanlı root/sudo yetki politikası, dosya izin standartları ve temel sistem/güvenlik komutları."
outline: [2, 3]
sidebarTitle: "AlmaLinux 9 Cheatsheet"
index: 10
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "almalinux", "vps", "linux-admin", "cheatsheet"]
---

# AlmaLinux 9 VPS Referans, Yetki Politikası ve Cheatsheet

* **Üretici / Bakım:** AlmaLinux OS Foundation & Tailscale Inc.
* **Resmi Web Sitesi:** [https://almalinux.org](https://almalinux.org) | [Tailscale Docs](https://tailscale.com)

::: info CONCEPT MATRICES
* **Operating System:** AlmaLinux 9 (RHEL 9 ABI Compatible Enterprise Linux)
* **Privilege Policy:** Zero direct `root` SSH login; `wheel` + `sudo` for OS admin; `docker` group for daily ops
* **Management Plane:** Isolated Mesh VPN via `tailscale0` (`100.x.y.z`) — Zero public management ports
* **Perimeter & Intrusion Defense:** SELinux (`enforcing`) + `firewalld` Zone Filtering + `Fail2ban`
* **Service & Init Manager:** `systemd` (`systemctl` & `journalctl`)
:::

## Resmi Tanım
**AlmaLinux 9**, Red Hat Enterprise Linux (RHEL) ile ikili uyumlu (ABI-compatible), kurumsal düzeyde kararlılık, uzun süreli güvenlik güncellemeleri ve **SELinux / firewalld** tabanlı sıkı güvenlik politikaları sunan açık kaynaklı bir sunucu işletim sistemidir. **πr² Cloud** mimarisinde, tüm canlı (Prod) PaaS konteynerlerinin üzerinde koştuğu ana konak (host) işletim sistemidir.

## Sözlük

| Terim | Açıklama |
| :--- | :--- |
| **`systemd` (`systemctl`)** | AlmaLinux 9 üzerinde arka plan servislerini (daemon), ağ arayüzlerini ve başlangıç süreçlerini yöneten ana sistem yöneticisi. |
| **`wheel` Grubu** | RHEL/AlmaLinux tabanlı sistemlerde üyelerine `sudo` ile yönetici (`root`) yetkisi kullanma hakkı veren özel sistem grubu. |
| **SELinux** | Dosya ve süreçlerin yalnızca kendilerine tanımlanan güvenlik bağlamı (context) içinde çalışmasını zorunlu kılan çekirdek güvenlik modülü. |
| **Tailscale (`tailscale0`)** | WireGuard tabanlı, sunucuya sabit bir `100.x.y.z` özel tünel IP'si atayan ve yönetim portlarını dış internete kapatan mesh VPN arayüzü. |
| **`firewalld` Zones** | Ağ arayüzlerini farklı güven seviyelerine (`public`, `trusted`) ayıran dinamik güvenlik duvarı bölgeleri. |
| **Fail2ban Jail** | Sistem loglarını (`systemd` / `/var/log/secure`) gerçek zamanlı tarayarak belirli sayıda hatalı giriş yapan IP adreslerini engelleyen kural seti. |
| **`chmod` / `chown`** | Dosya ve dizinlerin okuma/yazma/çalıştırma izinlerini (`chmod`) ve kullanıcı/grup sahipliğini (`chown`) değiştiren temel komutlar. |

---

## Kullanıcı Politikası

Sunucu güvenliği ve operasyonel hata koruması gereği tüm işlemler üç katmanlı yetki sınırıyla yürütülür:

| İşlem Katmanı | Kullanılacak Yetki | Kapsam ve Örnek Komutlar |
| :--- | :--- | :--- |
| **1. İlk Kurulum & Acil Kurtarma** | Doğrudan `root` | Yalnızca VPS ilk teslim alındığında yönetici kullanıcısı (ör. pr2admin) kullanıcısını oluşturmak için ve SSH/`sudo` erişimi kilitlendiğinde hosting sağlayıcısının web panelindeki VNC/Serial konsol üzerinden acil müdahale amacıyla kullanılır *(bu nedenle SSH `root` girişi kapatılsa bile ilk `root` parolası güvenli bir parola yöneticisinde saklanmalıdır)*. |
| **2. İşletim Sistemi & Güvenlik** | `pr2admin` + `sudo` | Sistem güncellemeleri (`sudo dnf update`), güvenlik duvarı (`sudo firewall-cmd`), servis yönetimi (`sudo systemctl`), Swap ve ilk volume sahiplik ayarları (`sudo chown`). |
| **3. Günlük Docker & Git İşlemleri** | Standart `pr2admin` (`sudo`suz) | Kullanıcı `docker` grubuna eklendikten sonra `docker compose up -d`, `git pull`, `.env` düzenleme ve log izleme işlemleri yetki yükseltmeden yapılır. |

---

## Dosya Sahipliği ve İzinler

πr² Cloud dizin hiyerarşisinde (pr2source/infra ve pr2data) konteynerlerin ve hassas yapılandırmaların izin hatası almaması veya dışarıya sızmaması için aşağıdaki standart izin kodları uygulanır:

| İzin Kodu | Açılımı | Kullanım Alanı |
| :--- | :--- | :--- |
| **`755`** (`rwxr-xr-x`) | Sahibi tam yetkili; diğerleri okuyup çalıştırabilir | Standart uygulama dizinleri ve çalıştırılabilir `.sh` yedekleme/deploy betikleri |
| **`750`** (`rwxr-x---`) | Sahibi tam yetkili, grup okuyabilir; yabancılar erişemez | `${SOURCE_DIR}/infra` ve veritabanı veri dizinleri (`${DATA_DIR}/mariadb`) |
| **`644`** (`rw-r--r--`) | Sahibi yazabilir; diğerleri yalnızca okuyabilir | Nginx `.conf`, `docker-compose.yml` ve statik yapılandırma dosyaları |
| **`600`** (`rw-------`) | Yalnızca sahibi okuyup yazabilir | `.env` dosyaları, SSH anahtarları (`id_ed25519`), SSL `privkey.pem` ve `/swapfile` |

---

## Disk Kullanımı

İşletim sisteminin dolup kilitlenmesini önlemek ve disk okuma/yazma ömrünü korumak için LVM disk bölümleri kullanım amacına göre iki katmana ayrılır:

| Bölüm / Katman | Konum | Sorumluluk ve İçerik |
| :--- | :--- | :--- |
| **`/` (Root Bölümü)** | `/usr`, `/etc`, `/var/lib/docker` | AlmaLinux 9 çekirdek dosyaları, sistem paketleri, Nginx ve SELinux uyumlu Docker imaj katmanları. |
| **`/home` (Çalışma Alanı)** | `~/pr2cloud` (`source`, `prod`, `data`) | Monorepo kaynak kodları, üretim yapılandırmaları, `pnpm` önbelleği ve büyüyen kalıcı servis verileri (`data/minio`, `data/mariadb`). |
| **`/tmp` (RAM Disk)** | `tmpfs` (Bellek Üzerinde) | Geçici derleme dosyaları ve test artıkları diske yazılmadan doğrudan RAM üzerinde işlenir. |

### Performans Ayarları

```bash
# 1. Geçici dosyaları RAM'e (tmpfs) alarak disk yazma yükünü azaltma
sudo systemctl enable --now tmp.mount

# 2. Okuma işlemlerinde diske erişim zamanı (atime) yazılmasını kapatma
# (/etc/fstab içindeki '/' ve '/home' satırlarında 'defaults' -> 'defaults,noatime' yapılır)
sudo mount -o remount / && sudo mount -o remount /home

# 3. Hem ~/pr2cloud hem de /opt/pr2cloud yollarının aynı dizini göstermesini sağlama (Symlink)
mkdir -p ~/pr2cloud/{source,prod,data}
sudo ln -sfn ~/pr2cloud /opt/pr2cloud
```


## Sistem, Ağ ve Güvenlik Komutları

### 1. Donanım, Kaynak ve Disk İzleme

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **OS & Çekirdek** | `cat /etc/os-release && uname -r` | AlmaLinux sürümünü ve aktif Linux kernel versiyonunu gösterir |
| **CPU & Mimari** | `nproc && lscpu` | Çekirdek (vCPU) sayısını ve işlemci mimarisini (`x86_64` / `aarch64`) listeler |
| **RAM & Swap** | `free -h` | Toplam, kullanılan ve boş fiziksel bellek (RAM) ile Swap alanını gösterir |
| **Disk Doluluğu** | `df -hT` | Bağlı disk bölümlerini, dosya sistemlerini (`xfs`/`ext4`) ve doluluk oranlarını listeler |
| **Klasör Boyutu** | `du -sh ${DATA_DIR}/*` | Kalıcı servis verilerinin diskte kapladığı alanı özetler |
| **Canlı Yük** | `top` (veya `docker stats --no-stream`) | Anlık CPU/RAM tüketimini ve konteyner kaynak kullanımını gösterir |

### 2. Ağ, Port ve Servis Yönetimi

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **Ağ Arayüzleri** | `ip -br a && ip route` | Ağ arayüzlerini (`eth0`, `tailscale0`), IP adreslerini ve ağ geçidini listeler |
| **Dinlenen Portlar** | `ss -tulpn` | Sunucuda dinlemede (LISTEN) olan tüm TCP/UDP portlarını ve servisleri gösterir |
| **Aktif Servisler** | `systemctl list-units --type=service --state=running` | Arka planda çalışan tüm aktif `systemd` servislerini listeler |
| **Servis Logları** | `journalctl -u sshd -n 50 --no-pager` | İlgili servisin son 50 log satırını ekrana basar |
| **Çekirdek Logları** | `sudo dmesg -T \| tail -n 20` | Son 20 çekirdek (kernel) olayını okunabilir tarih/saat ile gösterir |

### 3. Güvenlik, VPN ve Saldırı Önleme

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **SELinux Durumu** | `getenforce` | Zorunlu erişim denetiminin (`Enforcing`) aktif olduğunu doğrular |
| **SSH Sözdizimi Testi** | `sudo sshd -t` | SSH servisini yeniden yüklemeden önce yapılandırma hatalarını denetler |
| **Firewall Bölgeleri** | `sudo firewall-cmd --list-all-zones` | `public` ve `trusted` bölgelerindeki açık portları ve arayüzleri listeler |
| **Tailscale IP** | `tailscale ip -4` | Sunucunun özel VPN tünel (`100.x.y.z`) IPv4 adresini gösterir |
| **Fail2ban Durumu** | `sudo fail2ban-client status sshd` | SSH koruması kapsamında engellenen IP sayısını ve aktif listeyi gösterir |
| **IP Engel Kaldırma** | `sudo fail2ban-client set sshd unbanip <IP>` | Yanlışlıkla engellenen bir IP adresinin yasağını kaldırır |

### 4. Disk Performans ve Nitelik Testleri

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **Disk Tipi & Modeli** | `lsblk -d -o NAME,MODEL,SIZE,ROTA,TRAN` | `ROTA=0` ise SSD/NVMe/eMMC, `ROTA=1` ise mekanik HDD olduğunu ve arayüz tipini gösterir |
| **Sıralı Yazma Hızı** | `dd if=/dev/zero of=/tmp/io_w.tmp bs=1G count=1 oflag=dsync 2>&1 \| tail -n 1 && rm -f /tmp/io_w.tmp` | Önbelleği atlayarak doğrudan diske 1 GB sıralı yazma hızını (`MB/s` veya `GB/s`) basar |
| **Önbelleksiz Okuma** | `sudo hdparm -t /dev/sda` | Diskin ham sıralı okuma hızını ölçer *(NVMe için `/dev/nvme0n1`, eMMC için `/dev/mmcblk0`)* |

#### Anlaşılır 4K Rastgele IOPS ve Gecikme Test Betiği (`fio`)
Veritabanı (MariaDB/SQLite) ve konteyner yüklerini simüle eden 4K rastgele okuma/yazma (%70 okuma, %30 yazma) testini çalıştırır ve karmaşık loglar yerine doğrudan özet tabloyu ekrana basar *(sağlıklı bir PaaS sunucusu için okuma/yazma gecikmesinin `5 ms` altında ve rastgele okumanın `10.000+ IOPS` üzerinde olması beklenir)*:

```bash
sudo dnf install -y fio jq >/dev/null 2>&1 && \
fio --name=pr2-disk-bench --ioengine=libaio --iodepth=16 --rw=randrw --rwmixread=70 \
    --bs=4k --direct=1 --size=512M --numjobs=2 --runtime=10 --group_reporting \
    --filename=/tmp/fio_bench.dat --output-format=json | jq -r '
  .jobs[0] |
  "--- DISK 4K RASTGELE PERFORMANS ÖZETİ ---\n" +
  "Okuma Hızı  : " + ((.read.bw / 1024) | floor | tostring) + " MiB/s (" + ((.read.iops) | floor | tostring) + " IOPS)\n" +
  "Yazma Hızı  : " + ((.write.bw / 1024) | floor | tostring) + " MiB/s (" + ((.write.iops) | floor | tostring) + " IOPS)\n" +
  "Okuma Gecik.: " + (((.read.lat_ns.mean / 1000000) * 100 | floor) / 100 | tostring) + " ms\n" +
  "Yazma Gecik.: " + (((.write.lat_ns.mean / 1000000) * 100 | floor) / 100 | tostring) + " ms"
' && rm -f /tmp/fio_bench.dat
```

---

### 5. Bellek (RAM) Performans ve Nitelik Testleri

> sysbench AlmaLinux 9'da varsayılan depoda değil EPEL deposunda bulunur; eğer sysbench: command not found hatası alırsanız öncesinde sudo dnf install -y epel-release çalıştırmanız yeterlidir.

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **RAM Tipi & Frekansı** | `sudo dmidecode -t memory \| grep -E "Size:|Type:|Speed:" \| grep -v "No Module"` | Fiziksel/sanal RAM modüllerinin kapasitesini, neslini (`DDR4`/`DDR5`) ve MHz hızını listeler |
| **Swap Kullanım Politikası** | `cat /proc/sys/vm/swappiness` | Çekirdeğin diske takas (Swap) yazma eğilimini gösterir *(sunucular için ideal değer: `10`)* |

#### Anlaşılır RAM Bant Genişliği Test Betiği (`sysbench`)
Bellek okuma ve yazma aktarım hızlarını (`MiB/sec`) ölçüp yalnızca net sonuç satırlarını yazdırır *(modern sunucu/VPS ortamlarında `10.000+ MiB/sec` üzeri sağlıklı bellek bant genişliğini gösterir)*:

```bash
sudo dnf install -y sysbench >/dev/null 2>&1 && \
echo "--- RAM BANT GENİŞLİĞİ ÖZETİ ---" && \
echo -n "Yazma Hızı : " && sysbench memory --memory-block-size=1M --memory-total-size=10G --memory-oper=write run | grep "transferred" | awk -F'[()]' '{print $2}' && \
echo -n "Okuma Hızı : " && sysbench memory --memory-block-size=1M --memory-total-size=10G --memory-oper=read run | grep "transferred" | awk -F'[()]' '{print $2}'
```

### 6. Ağ (Bant Genişliği & Gecikme) Performans Testleri

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **Ağ Kartı Hızı (Link Speed)** | `ethtool eth0 2>/dev/null \| grep -E "Speed:|Link detected:"` | Fiziksel/sanal ağ arayüzünün port hızını (`1000Mb/s`, `10000Mb/s`) ve bağlantı durumunu gösterir |
| **Genel IP & ASN Kontrolü** | `curl -s https://ipinfo.io \| jq -r '"\(.ip) — \(.org) (\(.city), \(.country))"'` | Sunucunun dış dünyaya çıkış IPv4 adresini, veri merkezini ve konumunu doğrular |
| **DNS & Küresel Gecikme** | `ping -c 4 1.1.1.1 \| tail -n 2` | Cloudflare omurgasına olan paket kaybını ve ortalama gecikmeyi (`rtt avg` ms) ölçer |
| **Tailscale VPN Tünel Gecikmesi** | `tailscale ping -c 3 <HEDEF_TAILSCALE_IP>` | İki düğüm arasında doğrudan P2P (DERP aktarmasız) bağlantı kurulup kurulmadığını ve gecikmeyi gösterir |

#### Anlaşılır İnternet İndirme / Yükleme Hızı Test Betiği (`curl` + Cloudflare)
Harici Python/Speedtest bağımlılığı kurmadan doğrudan `curl` ile **Cloudflare** edge sunucuları üzerinden sunucunun gerçek indirme (`Download`) ve yükleme (`Upload`) hızını `Mbps` cinsinden ölçer:

```bash
BASE="https://speed.cloudflare.com" && \
echo "--- AĞ BANT GENİŞLİĞİ ÖZETİ (CLOUDFLARE EDGE) ---" && \
DL=$(curl -s -o /dev/null -w "%{speed_download}" "${BASE}/__down?bytes=50000000") && \
UL=$(dd if=/dev/zero bs=1M count=25 2>/dev/null | curl -s -o /dev/null -w "%{speed_upload}" -X POST --data-binary @- "${BASE}/__up") && \
PING=$(curl -s -o /dev/null -w "%{time_starttransfer}" "${BASE}/__down?bytes=0") && \
awk -v dl="$DL" -v ul="$UL" -v p="$PING" 'BEGIN {
  printf "İndirme (Download) : %.2f Mbps\n", (dl * 8) / 1000000;
  printf "Yükleme (Upload)   : %.2f Mbps\n", (ul * 8) / 1000000;
  printf "TTFB Gecikme       : %.0f ms\n", p * 1000;
}'

```


