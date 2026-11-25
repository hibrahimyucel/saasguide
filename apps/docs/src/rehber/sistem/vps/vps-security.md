---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "SaaS Rehberi"
outline: [2, 3]
sidebarTitle: "VPS Güvenlik"
index: 20
isContent: true
hidden: false
status: "published"
tags: ["Paas","Saas"]
---

# AlmaLinux 9 VPS Kurulum ve Güvenlik Sıkılaştırma Rehberi

> **Ön Bilgi:** Bu rehber, sıfır bir AlmaLinux 9 VPS üzerinde canlı (`prod`) altyapı konteynerlerine geçmeden önce tamamlanması gereken işletim sistemi, erişim, güvenlik ve bellek hazırlığı adımlarını sırasıyla içerir. *(Örnek komutlarda VPS özel SSH portu `<SSH_PORT>` — örn. `2200` — olarak gösterilmiştir.)*

---

## 1. İlk `root` Bağlantısı ve Yönetici (`pr2admin`) Oluşturma

VPS sağlayıcınızın teslim ettiği `root` bilgileriyle sunucuya bağlanın, saat dilimini ayarlayın, sistemi güncelleyin ve `sudo` yetkili standart yönetici kullanıcısını oluşturun:

```bash
# Eski sunucu kaydını temizleme (gerekirse)
ssh-keygen -R "[IP]:<SSH_PORT>"
```

```bash
# 1. Sunucuya ilk bağlantı (Yerel terminalden)
ssh -p <SSH_PORT> root@<VPS_PUBLIC_IP>
```

```bash
# 2. Saat dilimi ve temel güvenlik paketlerinin kurulumu
timedatectl set-timezone Europe/Istanbul
dnf update -y
dnf install -y epel-release
dnf install -y fail2ban fail2ban-firewalld curl git tar policycoreutils-python-utils
```

```bash
# 3. Standart yönetici kullanıcısı oluşturma ve parola belirleme
useradd -m -s /bin/bash -G wheel pr2admin
passwd pr2admin
```

---

## 2. SSH Anahtar Kurulumu ve Parolasız Doğrulama

Sunucu üzerinde parola ile SSH girişini kapatmadan önce yerel bilgisayarınızdan oluşturduğunuz Ed25519 genel anahtarını `pr2admin` kullanıcısına aktarın:

```bash
# 1. Yerel bilgisayarınızda yeni bir Ed25519 anahtar çifti oluşturun (mevcutsa atlayın)
ssh-keygen -t ed25519 -C "admin@pr2cloud"
```

```bash
# 2. Genel anahtarı sunucuya kopyalayın (pr2admin parolasını bir kez girin)
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p <SSH_PORT> pr2admin@<VPS_PUBLIC_IP>
```

```bash
# 3. Parola sormadan giriş yapabildiğinizi yeni bir terminalde doğrulayın
ssh -p <SSH_PORT> pr2admin@<VPS_PUBLIC_IP>
```

*(Bu aşamadan sonra tüm işlemler `pr2admin` kullanıcısı üzerinden yürütülür; `root` oturumunu kapatabilirsiniz.)*

---

## 3. Tailscale Özel VPN Ağı (`tailscale0`) Kurulumu

Yönetim arayüzlerini (SSH, phpMyAdmin, MinIO Konsol, Stalwart Admin) genel internetten tamamen gizlemek için AlmaLinux 9 üzerinde resmi RHEL 9 deposundan Tailscale kurun:

 - repo tanımında, uygulama yüklenirken sorun çıkarsa silmek için.
```bash
sudo rm -f /etc/yum.repos.d/*tailscale*.repo
sudo dnf clean all
```

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo systemctl enable --now tailscaled
sudo tailscale up --ssh

# 2. Atanan özel 100.x.y.z VPN IP adresini görüntüle
tailscale ip -4
```
::: danger Terminalde çıkan doğrulama URL'sini tarayıcıda açarak sunucuyu Tailscale ağınıza onaylayın ve yerel makinenizden ssh bağlantısını test edin.

```bash
ssh -p <SSH_PORT> pr2admin@<TAILSCALE_100_IP>
```
:::
---

## 4. SSH Sertleştirme (`sshd_config`)

Tailscale VPN ve SSH anahtar doğrulaması test edildikten sonra doğrudan `root` girişini ve parola tabanlı SSH oturumlarını kapatın:

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

sudo sshd -t && sudo systemctl reload sshd
```


## 5. `firewalld` Arayüz İzolasyonu ve `Fail2ban` Koruması

Dış ağ (`public`) üzerinde yalnızca Web (`80, 443`) ve Kurumsal E-Posta (`25, 465, 587, 993`) portlarını açık bırakıp genel ağdaki SSH portunu kapatın; yönetim erişimini yalnızca `tailscale0` arayüzüne tanıyın:

```bash
# 1. firewalld bölgelerini ve izin verilen portları yapılandır
sudo systemctl enable --now firewalld
sudo firewall-cmd --permanent --zone=trusted --add-interface=tailscale0

sudo firewall-cmd --permanent --zone=public --remove-service=cockpit 2>/dev/null || true
sudo firewall-cmd --permanent --zone=public --remove-service=dhcpv6-client 2>/dev/null || true
sudo firewall-cmd --permanent --zone=public --remove-service=ssh 2>/dev/null || true
sudo firewall-cmd --permanent --zone=public --remove-port=<SSH_PORT>/tcp 2>/dev/null || true

sudo firewall-cmd --permanent --zone=public --add-service=http
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --permanent --zone=public --add-port=25/tcp
sudo firewall-cmd --permanent --zone=public --add-port=465/tcp
sudo firewall-cmd --permanent --zone=public --add-port=587/tcp
sudo firewall-cmd --permanent --zone=public --add-port=993/tcp
sudo firewall-cmd --reload
```

Aktif SSH portlarını öğrenme, çıktıda **22** dışında portlar varsa `port = ssh` ifadesinde **ssh** yerine port veya portları virgülle ayırarak (`port = 221,222`) yazabilirsiniz.  
```bash
sudo sshd -T | grep -i "^port "
```


```bash
# 2. Fail2ban brute-force korumasını VPS SSH portuna göre aktifleştir
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
```

## 6. Kalıcı Swap (Sanal Bellek) Oluşturma

Düşük RAM'li VPS sunucularda veritabanı ve mail indeksleme sıçramalarında çekirdeğin (`kswapd`) kilitlenmesini önlemek için **2 GB** kalıcı Swap alanı tanımlayın:

```bash
# 1. 2 GB swap dosyası oluştur ve izinleri sıkılaştır
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 2. Yeniden başlatmalarda kalıcı olması için /etc/fstab'a ekle
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 3. Swap kullanım eşiğini optimize et (yalnızca RAM dolmaya yaklaştığında kullan)
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
sudo sysctl -p /etc/sysctl.d/99-swap.conf
```

---

## Doğrulama Kontrolleri

Kurulumun bir sonraki aşamasına (Docker Engine ve `/opt/pr2cloud` servis orkestrasyonu) geçmeden önce aşağıdaki 4 kontrolü onaylayın:

1. **VPN Erişimi:** `ssh -p <SSH_PORT> pr2admin@<TAILSCALE_100_IP>` ile sunucuya parolasız bağlanabildiğinizi doğrulayın.
2. **Genel Ağ Koruması:** `sudo firewall-cmd --zone=public --list-all` çıktısında yalnızca `http`, `https` ve `25, 465, 587, 993/tcp` portlarının açık olduğunu; SSH portunun genel ağda kapalı olduğunu teyit edin.
3. **Fail2ban Durumu:** `sudo fail2ban-client status sshd` çıktısında servisin aktif çalıştığını kontrol edin.
4. **Bellek & Swap:** `free -h` çıktısında `Swap: 2.0Gi` alanının aktif göründüğünü onaylayın.

