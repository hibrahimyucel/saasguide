---
title: "AlmaLinux 9 VPS Bağlantısı, Sistem Keşfi ve Temel Yönetim"
description: "pr2cloud canlı sunucu (prod) kurulumu öncesi AlmaLinux 9 VPS SSH erişimi, donanım/ağ/servis analizi, kullanıcı ve dosya yetkileri ile temel Linux komutları cheatsheet rehberi."
outline: [2, 3]
sidebarTitle: "VPS Bağlantı & Sistem Keşfi"
index: 301
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "prod", "almalinux-9", "vps", "ssh", "linux", "security", "permissions", "cheatsheet"]
---

# AlmaLinux 9 VPS Bağlantısı, Sistem Keşfi ve Temel Yönetim

* **Üretici / Bakım:** AlmaLinux OS Foundation
* **Resmi Web Sitesi:** [https://almalinux.org](https://almalinux.org) | [Dokümantasyon](https://almalinux.org)

::: info CONCEPT MATRICES
* **Operating System:** AlmaLinux 9 (RHEL 9 ABI Compatible Enterprise Linux)
* **Initial Access:** OpenSSH (`ssh root@<VPS_IP>`) transitioning to Key-Based Auth & Tailscale (`tailscale0`)
* **Service & Init Manager:** `systemd` (`systemctl` & `journalctl`)
* **Mandatory Access Control:** SELinux (`enforcing`) + `firewalld` Zone Filtering
* **Privilege Escalation:** `wheel` group + `sudo` (Zero direct root usage in production)
:::

## Resmi Tanım
**AlmaLinux 9**, Red Hat Enterprise Linux (RHEL) ile ikili uyumlu (ABI-compatible), kurumsal düzeyde kararlılık, uzun süreli güvenlik güncellemeleri ve **SELinux / firewalld** tabanlı sıkı güvenlik politikaları sunan açık kaynaklı bir sunucu işletim sistemidir. `pr2cloud` mimarisinde tüm canlı (Prod) PaaS konteynerlerinin üzerinde koştuğu ana konak (host) işletim sistemidir.

## Sözlük Veritabanı (Lexical Database)

| Terim | Açıklama |
| :--- | :--- |
| **`systemd` (`systemctl`)** | AlmaLinux 9 üzerinde arka plan servislerini (daemon), ağ arayüzlerini ve başlangıç süreçlerini yöneten ana sistem yöneticisi. |
| **`wheel` Grubu** | RHEL/AlmaLinux tabanlı sistemlerde üyelerine `sudo` ile yönetici (root) yetkisi kullanma hakkı veren özel sistem grubu. |
| **SELinux** | Dosya ve süreçlerin yalnızca kendilerine tanımlanan güvenlik bağlamı (context) içinde çalışmasını zorunlu kılan çekirdek güvenlik modülü. |
| **`chmod` / `chown`** | Dosya ve dizinlerin okuma/yazma/çalıştırma izinlerini (`chmod`) ve kullanıcı/grup sahipliğini (`chown`) değiştiren temel komutlar. |
| **Ağ Arayüzü (`eth0` / `ens*`)** | Sunucunun dış internete açılan fiziksel/sanal ağ kartı (`tailscale0` ise özel VPN tünel arayüzüdür). |

---

## Cheatsheet: Sistem Keşfi ve Sık Kullanılan Komutlar

| Kategori | Komut | Açıklama |
| :--- | :--- | :--- |
| **OS & Çekirdek** | `cat /etc/os-release && uname -r` | AlmaLinux sürümünü ve aktif Linux kernel versiyonunu gösterir |
| **CPU & Mimari** | `lscpu` | İşlemci modelini, çekirdek (vCPU) sayısını ve mimariyi (`x86_64` / `aarch64`) listeler |
| **RAM & Swap** | `free -h` | Toplam, kullanılan ve boş bellek (RAM) ile Swap alanını okunabilir boyutta gösterir |
| **Disk & Bölümler** | `df -hT` | Bağlı disk bölümlerini, dosya sistemlerini (`xfs`/`ext4`) ve doluluk oranlarını gösterir |
| **Klasör Boyutu** | `du -sh /var/*` | Belirtilen dizin altındaki klasörlerin kapladığı toplam alanı özetler |
| **Ağ & IP Bilgisi** | `ip -br a && ip route` | Ağ arayüzlerini (`eth0`, `lo`), IP adreslerini ve varsayılan ağ geçidini listeler |
| **Açık Portlar** | `ss -tulpn` | Sunucuda dinlemede (LISTEN) olan tüm TCP/UDP portlarını ve ilgili servisleri gösterir |
| **Aktif Servisler** | `systemctl list-units --type=service --state=running` | O anda arka planda çalışan tüm aktif `systemd` servislerini listeler |
| **Servis Logları** | `journalctl -u sshd -n 50 --no-pager` | İlgili servisin son 50 log satırını canlı takip olmadan ekrana basar |
| **Canlı Kaynak** | `top` (veya `htop`) | Anlık CPU, RAM tüketimini ve en çok kaynak kullanan süreçleri gösterir (`q` ile çıkılır) |

---

## Uygulama Adımları (`prod/` Hazırlık)

### 1. İlk SSH Bağlantısı ve Shell Ortamı Doğrulaması
VPS sağlayıcınızın verdiği genel IP adresi ve ilk `root` parolası (veya SSH anahtarı) ile sunucuya bağlanın:

```bash
ssh root@<VPS_PUBLIC_IP>
```

Bağlantı sağlandıktan sonra aktif kabuk (shell) ve sistem yerelleştirmesini kontrol edin:

```bash
echo \$SHELL          # Beklenen çıktı: /bin/bash
whoami               # Aktif kullanıcıyı doğrular
hostname -f          # Sunucunun mevcut FQDN/hostname bilgisini gösterir
timedatectl          # Tarih, saat ve saat dilimi (Timezone) durumunu kontrol eder
```

*(Saat dilimini Türkiye saati olarak ayarlamak için: `timedatectl set-timezone Europe/Istanbul`)*

### 2. Donanım, Ağ ve Güvenlik Durumu Keşfi
Kuruluma başlamadan önce sunucunun kaynak kapasitesini, dış ağ arayüz adını ve güvenlik modüllerinin varsayılan durumunu tespit edin:

```bash
# 1. Donanım kapasitesi özeti (CPU, RAM, Disk)
nproc && free -h && df -h /

# 2. Dış ağ arayüzü adını tespit etme (firewalld kuralları için kritik)
ip -br link show

# 3. SELinux ve Firewalld başlangıç durumu
getenforce                      # Beklenen: Enforcing
systemctl status firewalld      # Aktif/pasif durumunu gösterir
```

### 3. Yönetici Kullanıcı Oluşturma ve `sudo` Yetkilendirmesi
Güvenlik standardı gereği günlük işlemler ve deployment süreçleri doğrudan `root` üzerinden yürütülmez. `wheel` grubuna dahil standart bir yönetici kullanıcı oluşturun:

```bash
# 1. Yeni kullanıcı oluşturma (Örn: pr2admin)
useradd -m -s /bin/bash -G wheel pr2admin

# 2. Kullanıcı için güçlü parola belirleme
passwd pr2admin

# 3. Root kullanıcısındaki SSH yetkili anahtarlarını (varsa) yeni kullanıcıya kopyalama
mkdir -p /home/pr2admin/.ssh
cp ~/.ssh/authorized_keys /home/pr2admin/.ssh/ 2>/dev/null || true
chown -R pr2admin:pr2admin /home/pr2admin/.ssh
chmod 700 /home/pr2admin/.ssh
chmod 600 /home/pr2admin/.ssh/authorized_keys 2>/dev/null || true
```

*(Yeni bir terminal penceresinden `ssh pr2admin@<VPS_PUBLIC_IP>` ve `sudo whoami` komutlarıyla yönetici yetkisini doğrulayın.)*

### 4. Dosya Sahipliği ve İzin Yönetimi (`chmod` / `chown`)
`pr2cloud` dizin hiyerarşisinde (`prod/` ve `data/`) konteynerlerin (özellikle `UID 1000` ile çalışan Gitea, MinIO ve veritabanı konteynerlerinin) izin hatası almaması için temel yetki kuralları uygulanır:

| İzin Kodu | Açılımı | Kullanım Alanı |
| :--- | :--- | :--- |
| **`755`** (`rwxr-xr-x`) | Sahibi tam yetkili; diğerleri okuyup çalıştırabilir | Standart uygulama dizinleri ve çalıştırılabilir `.sh` betikleri |
| **`750`** (`rwxr-x---`) | Sahibi tam yetkili, grup okuyabilir; yabancılar erişemez | `pr2cloud/prod/` ve hassas yapılandırma klasörleri |
| **`644`** (`rw-r--r--`) | Sahibi yazabilir; diğerleri yalnızca okuyabilir | Nginx `.conf`, `docker-compose.yml` ve statik dosyalar |
| **`600`** (`rw-------`) | Yalnızca sahibi okuyup yazabilir | `.env` dosyaları, SSH anahtarları (`id_ed25519`) ve SSL `privkey.pem` |

Sık kullanılan yetki ve sahiplik komutları:

```bash
# Dizin ve altındaki tüm dosyaların sahipliğini değiştirme
sudo chown -R pr2admin:pr2admin /opt/pr2cloud

# Rootless konteynerler (UID 1000) için veri dizini sahipliği atama
sudo chown -R 1000:1000 /opt/pr2cloud/data/gitea

# Hassas .env ve özel anahtar dosyalarını yalnızca sahibine kapatma
chmod 600 /opt/pr2cloud/prod/.env

# Otomasyon betiğini çalıştırılabilir hale getirme
chmod +x /opt/pr2cloud/prod/scripts/deploy.sh
```

### 5. Doğrulama Kontrolleri
1. Yeni oluşturulan `pr2admin` kullanıcısı ile SSH üzerinden sunucuya bağlanabildiğinizi doğrulayın.
2. `sudo dnf update -y` komutunun parola doğrulaması sonrası hatasız çalıştığını test edin.
3. `ss -tulpn` çıktısında yalnızca zorunlu sistem portlarının (`22/tcp` SSH) dinlemede olduğunu teyit edin.
