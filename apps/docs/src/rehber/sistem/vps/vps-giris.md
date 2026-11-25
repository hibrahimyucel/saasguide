---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "SaaS Rehberi"
outline: [2, 3]
sidebarTitle: "VPS - Giriş"
index: 10
isContent: true
hidden: false
status: "published"
tags: ["Paas","Saas"]
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
**AlmaLinux 9**, Red Hat Enterprise Linux (RHEL) ile ikili uyumlu (ABI-compatible), kurumsal düzeyde kararlılık, uzun süreli güvenlik güncellemeleri ve **SELinux / firewalld** tabanlı sıkı güvenlik politikaları sunan açık kaynaklı bir sunucu işletim sistemidir. `pr2cloud` mimarisinde tüm canlı (Prod) PaaS konteynerlerinin üzerinde koştuğu ana konak (host) işletim sistemidir.

## Sözlük Veritabanı (Lexical Database)

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

## Katmanlı Yetki ve Oturum Kullanım Politikası (`root` vs. `sudo`)

Sunucu güvenliği ve operasyonel hata koruması gereği tüm işlemler üç katmanlı yetki sınırıyla yürütülür:

| İşlem Katmanı | Kullanılacak Yetki | Kapsam ve Örnek Komutlar |
| :--- | :--- | :--- |
| **1. İlk Kurulum & Acil Kurtarma** | Doğrudan `root` | Yalnızca VPS ilk teslim alındığında `pr2admin` kullanıcısını oluşturmak için ve SSH/`sudo` erişimi kilitlendiğinde hosting sağlayıcısının web panelindeki VNC/Serial konsol üzerinden acil müdahale amacıyla kullanılır *(bu nedenle SSH `root` girişi kapatılsa bile ilk `root` parolası güvenli bir parola yöneticisinde saklanmalıdır)*. |
| **2. İşletim Sistemi & Güvenlik** | `pr2admin` + `sudo` | Sistem güncellemeleri (`sudo dnf update`), güvenlik duvarı (`sudo firewall-cmd`), servis yönetimi (`sudo systemctl`), Swap ve ilk volume sahiplik ayarları (`sudo chown`). |
| **3. Günlük Docker & Git İşlemleri** | Standart `pr2admin` (`sudo`suz) | Kullanıcı `docker` grubuna eklendikten sonra `docker compose up -d`, `git pull`, `.env` düzenleme ve log izleme işlemleri yetki yükseltmeden yapılır. |

---

## Dosya Sahipliği ve İzin Standartları (`chmod` / `chown`)

`pr2cloud` dizin hiyerarşisinde (`prod/` ve `data/`) konteynerlerin ve hassas yapılandırmaların izin hatası almaması veya dışarıya sızmaması için aşağıdaki standart izin kodları uygulanır:

| İzin Kodu | Açılımı | Kullanım Alanı |
| :--- | :--- | :--- |
| **`755`** (`rwxr-xr-x`) | Sahibi tam yetkili; diğerleri okuyup çalıştırabilir | Standart uygulama dizinleri ve çalıştırılabilir `.sh` yedekleme/deploy betikleri |
| **`750`** (`rwxr-x---`) | Sahibi tam yetkili, grup okuyabilir; yabancılar erişemez | `/opt/pr2cloud/prod` ve veritabanı veri dizinleri (`data/mariadb`) |
| **`644`** (`rw-r--r--`) | Sahibi yazabilir; diğerleri yalnızca okuyabilir | Nginx `.conf`, `docker-compose.yml` ve statik yapılandırma dosyaları |
| **`600`** (`rw-------`) | Yalnızca sahibi okuyup yazabilir | `.env` dosyaları, SSH anahtarları (`id_ed25519`), SSL `privkey.pem` ve `/swapfile` |

---

## Cheatsheet: Sistem Keşfi, Ağ ve Güvenlik Komutları

### 1. Donanım, Kaynak ve Disk İzleme

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **OS & Çekirdek** | `cat /etc/os-release && uname -r` | AlmaLinux sürümünü ve aktif Linux kernel versiyonunu gösterir |
| **CPU & Mimari** | `nproc && lscpu` | Çekirdek (vCPU) sayısını ve işlemci mimarisini (`x86_64` / `aarch64`) listeler |
| **RAM & Swap** | `free -h` | Toplam, kullanılan ve boş fiziksel bellek (RAM) ile Swap alanını gösterir |
| **Disk Doluluğu** | `df -hT` | Bağlı disk bölümlerini, dosya sistemlerini (`xfs`/`ext4`) ve doluluk oranlarını listeler |
| **Klasör Boyutu** | `du -sh /opt/pr2cloud/data/*` | Kalıcı servis verilerinin diskte kapladığı alanı özetler |
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

