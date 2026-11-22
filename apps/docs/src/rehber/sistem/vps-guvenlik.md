---
title: "AlmaLinux 9 VPS Güvenlik Sıkılaştırması ve Erişim Politikası"
description: "pr2cloud canlı sunucu (prod) için root/sudo yetki politikası, SSH sertleştirme, Tailscale özel VPN ağı, firewalld arayüz izolasyonu ve Fail2ban kurulum rehberi."
outline: [2, 3]
sidebarTitle: "VPS Güvenlik Sıkılaştırma"
index: 302
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "prod", "almalinux-9", "security", "ssh", "tailscale", "firewalld", "fail2ban", "hardening"]
---

# AlmaLinux 9 VPS Güvenlik Sıkılaştırması ve Erişim Politikası

* **Üretici / Bakım:** AlmaLinux OS Foundation & Tailscale Inc.
* **Resmi Web Sitesi:** [https://almalinux.org](https://almalinux.org) | [Tailscale Docs](https://tailscale.com)

::: info CONCEPT MATRICES
* **Privilege Policy:** Zero direct `root` login; `wheel` group + `sudo` for host admin; `docker` group for daily ops
* **Management Plane:** Isolated Mesh VPN via `tailscale0` (`100.x.y.z`) — Zero public management ports
* **SSH Hardening:** Key-based authentication only (`PermitRootLogin no`, `PasswordAuthentication no`)
* **Perimeter Firewall:** `firewalld` zone separation (`public` / `eth0` vs. `trusted` / `tailscale0`)
* **Intrusion Prevention:** `Fail2ban` dynamic IP banning for SSH and mail authentication endpoints
:::

## Resmi Tanım
**VPS Güvenlik Sıkılaştırması (Server Hardening)**; canlı üretim sunucusunun dış internete açık saldırı yüzeyini en aza indirmek amacıyla gereksiz portların kapatılması, doğrudan `root` ve parola tabanlı SSH girişlerinin yasaklanması, tüm yönetim arayüzlerinin **Tailscale (`tailscale0`)** özel VPN tüneli arkasına çekilmesi ve kaba kuvvet (brute-force) denemelerinin **firewalld + Fail2ban** ile otomatik engellenmesi sürecidir.

## Sözlük Veritabanı (Lexical Database)

| Terim | Açıklama |
| :--- | :--- |
| **`PermitRootLogin no`** | Sunucuya doğrudan `root` kullanıcısı ile SSH bağlantısı açılmasını engelleyen temel OpenSSH güvenlik kuralı. |
| **Tailscale (`tailscale0`)** | WireGuard tabanlı, sunucuya sabit bir `100.x.y.z` özel tünel IP'si atayan ve yönetim portlarını dış internete kapatan mesh VPN arayüzü. |
| **`firewalld` Zones** | Ağ arayüzlerini farklı güven seviyelerine (`public`, `trusted`) ayıran dinamik güvenlik duvarı bölgeleri. |
| **Fail2ban Jail** | Sistem ve servis loglarını (`/var/log/secure` vb.) gerçek zamanlı tarayarak belirli sayıda hatalı giriş yapan IP adreslerini engelleyen kural seti. |
| **Denetim İzi (Audit Log)** | `/var/log/secure` altında hangi kullanıcının hangi saatte `sudo` ile yönetici komutu çalıştırdığını kaydeden güvenlik günlüğü. |

---

## Yetki ve Oturum Kullanım Politikası (`root` vs. `sudo`)

Sunucu güvenliği ve hata koruması gereği işlemler üç katmanlı yetki sınırıyla yürütülür:

| İşlem Katmanı | Kullanılacak Yetki | Kapsam ve Örnek Komutlar |
| :--- | :--- | :--- |
| **1. İlk Kurulum & Acil Kurtarma** | Doğrudan `root` | Yalnızca VPS ilk teslim alındığında `pr2admin` kullanıcısını oluşturmak için ve SSH/`sudo` erişimi kilitlendiğinde hosting sağlayıcınızın web panelindeki VNC/Serial konsol üzerinden acil müdahale amacıyla kullanılır *(bu nedenle SSH `root` girişi kapatılsa bile ilk `root` parolası güvenli bir parola yöneticisinde saklanmalıdır)*. |
| **2. İşletim Sistemi & Güvenlik** | `pr2admin` + `sudo` | Sistem güncellemeleri (`sudo dnf update`), güvenlik duvarı (`sudo firewall-cmd`), servis yönetimi (`sudo systemctl`) ve ilk volume sahiplik ayarları (`sudo chown`). |
| **3. Günlük Docker & Git İşlemleri** | Standart `pr2admin` (`sudo`suz) | Kullanıcı `docker` grubuna eklendikten sonra `docker compose up -d`, `git pull`, `.env` düzenleme ve log izleme işlemleri yetki yükseltmeden yapılır. |

---

## Cheatsheet: Güvenlik ve Ağ Doğrulama Komutları

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **SSH Sözdizimi Testi** | `sudo sshd -t` | SSH servisini yeniden başlatmadan önce yapılandırma hatalarını denetler |
| **Aktif Firewall Kuralları** | `sudo firewall-cmd --list-all-zones` | Tüm bölgelerdeki (`public`, `trusted`) açık portları ve bağlı arayüzleri listeler |
| **Tailscale IP Öğrenme** | `tailscale ip -4` | Sunucunun özel VPN tünel (`100.x.y.z`) IPv4 adresini gösterir |
| **Fail2ban Durumu** | `sudo fail2ban-client status sshd` | SSH koruması kapsamında engellenen IP sayısını ve aktif listeyi gösterir |
| **IP Engel Kaldırma** | `sudo fail2ban-client set sshd unbanip <IP>` | Yanlışlıkla engellenen bir IP adresinin yasağını kaldırır |
| **Başarısız Giriş Logları** | `sudo grep "Failed password" /var/log/secure \| tail -n 20` | Son 20 hatalı SSH oturum açma denemesini listeler |

---

## Uygulama Adımları (`prod/` Host Sıkılaştırma)

### 1. Sistem Güncellemesi ve Temel Paketlerin Kurulumu
`pr2admin` kullanıcısı ile bağlandıktan sonra işletim sistemini güncelleyin ve gerekli güvenlik/ağ araçlarını kurun:

```bash
sudo dnf update -y
sudo dnf install -y epel-release
sudo dnf install -y fail2ban fail2ban-firewalld curl git tar
```

*(Not: Docker kurulduktan sonra günlük işlemlerde `sudo` kullanmamak için kullanıcınızı `docker` grubuna ekleyin: `sudo usermod -aG docker $USER`)*

### 2. Tailscale Özel VPN Ağı Kurulumu
Yönetim portlarını (SSH, Dokümantasyon, Gitea, MinIO Admin) genel internetten tamamen gizlemek için Tailscale istemcisini kurun:

```bash
# 1. Resmi Tailscale deposunu ekleme ve kurma
curl -fsSL https://tailscale.com | sh

# 2. Servisi başlatma ve SSH desteğiyle ağa dahil olma
sudo systemctl enable --now tailscaled
sudo tailscale up --ssh

# 3. Atanan özel 100.x.y.z IP adresini doğrulama
tailscale ip -4
```

*(Ekranda verilen doğrulama bağlantısını tarayıcıda açarak sunucuyu Tailscale ağınıza onaylayın.)*

### 3. SSH Sertleştirme (`sshd_config`)
Doğrudan `root` girişini ve parola ile oturum açmayı kapatın *(bu adımdan önce kendi bilgisayarınızdaki `~/.ssh/id_ed25519.pub` anahtarının sunucudaki `/home/pr2admin/.ssh/authorized_keys` dosyasında bulunduğundan mutlaka emin olun)*:

```bash
sudo tee /etc/ssh/sshd_config.d/99-pr2-hardening.conf > /dev/null << 'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 30
EOF

# Yapılandırmayı test et ve SSH servisini yenile
sudo sshd -t && sudo systemctl reload sshd
```

### 4. `firewalld` Arayüz ve Port İzolasyonu
`pr2cloud` sıfır yönetim portu prensibi gereği; dış ağ arayüzünde (`eth0` / `ens*`) yalnızca Web (HTTP/HTTPS) ve Kurumsal E-Posta (SMTP/IMAPS) portları açık bırakılır. Yönetim erişimi ise yalnızca `tailscale0` arayüzüne tanınır:

```bash
sudo systemctl enable --now firewalld

# 1. Tailscale özel arayüzünü güvenli (trusted) bölgeye ekle
sudo firewall-cmd --permanent --zone=trusted --add-interface=tailscale0

# 2. Dış ağ (public) bölgesinden gereksiz servisleri kaldır (cockpit, dhcpv6-client)
sudo firewall-cmd --permanent --zone=public --remove-service=cockpit 2>/dev/null || true
sudo firewall-cmd --permanent --zone=public --remove-service=dhcpv6-client 2>/dev/null || true

# 3. Genel ağa (public) yalnızca zorunlu Web ve E-Posta portlarını aç
sudo firewall-cmd --permanent --zone=public --add-service=http
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --permanent --zone=public --add-port=25/tcp    # SMTP (Sunucular arası mail)
sudo firewall-cmd --permanent --zone=public --add-port=465/tcp   # SMTPS (Güvenli mail gönderimi)
sudo firewall-cmd --permanent --zone=public --add-port=587/tcp   # Submission (STARTTLS)
sudo firewall-cmd --permanent --zone=public --add-port=993/tcp   # IMAPS (İstemci mail okuma)

# 4. Tailscale bağlantınız doğrulandıktan sonra genel ağdaki SSH (22/tcp) portunu kapatın:
# sudo firewall-cmd --permanent --zone=public --remove-service=ssh

# 5. Kuralları uygula ve doğrula
sudo firewall-cmd --reload
sudo firewall-cmd --list-all-zones
```

> **Kritik Uyarı:** Genel ağdan (`public`) `ssh` servisini kaldırmadan önce yeni bir terminal penceresinden `ssh pr2admin@<TAILSCALE_100_IP>` komutuyla VPN üzerinden bağlanabildiğinizi mutlaka test edin.

### 5. Fail2ban Saldırı Önleme Yapılandırması
Hatalı kimlik doğrulama denemelerini `firewalld` üzerinden otomatik engelleyen `jail.local` yapılandırmasını oluşturun:

```bash
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
banaction = firewallcmd-rich-rules[actiontype=<multiport>]

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = systemd
EOF

sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

---

## Doğrulama Kontrolleri
1. **Tailscale Bağlantısı:** Geliştirici makinenizden `ssh pr2admin@<TAILSCALE_100_IP>` ile sunucuya parolasız (SSH anahtarıyla) erişebildiğinizi doğrulayın.
2. **Root Giriş Yasağı:** `ssh root@<VPS_PUBLIC_IP>` denemesinin `Permission denied (publickey)` hatasıyla reddedildiğini teyit edin.
3. **Port Tarama Kontrolü:** Dış ağdan yalnızca `80, 443, 25, 465, 587, 993` portlarının erişilebilir olduğunu, yönetim portlarının kapalı kaldığını `sudo firewall-cmd --zone=public --list-all` çıktısıyla onaylayın.
