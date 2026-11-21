---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "pr2cloud monorepo geliştirme ortamı, Node.js, pnpm, Turborepo ve Tailscale VPN istemcisi kurulum rehberi."
outline: [2, 3]
sidebarTitle: "Host Kurulumu"
index: 1
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "host-setup", "monorepo", "pnpm", "turborepo", "tailscale"]
---

# Host Kurulumu

::: info
Bu rehber, **pr2cloud** ekosisteminde kod geliştirme ve monorepo orkestrasyonunun yürütüleceği yerel geliştirici makinesinin (Host) ve ek olarak geliştirme sunucusunun hazırlanmasını kapsar.
:::

## Tailscale VPN

VPN ile bağlı olduğunuz fiziksel ağdan ve makine yapılandırmasından bağımsız olarak geliştirici ağının çalışmasını garanti altına almış olursunuz.

Test ve  izleme amaçlı sisteme bağlanacak kişi ve cihazlar için Tailscale VPN kurulumu yeterlidir. İnternet bağlantısı (Tailscale Sunucu Erişimi) olan heryerden, CGNAT ve dinamik IP değişimlerinden etkilenmeden sisteme erişebilirler.

[https://tailscale.com/] adresinde hesap açıp ağ oluşturabilir ve yönetebilirsiniz.

```bash
# Linux (AlmaLinux / Fedora / Ubuntu) için Tailscale kurulumu
curl -fsSL https://tailscale.com | sh

# Tailscale servisini başlat ve ağa bağlanVPN 
sudo tailscale up
```

*(macOS veya Windows kullanıyorsanız resmi Tailscale istemcisini kurarak oturum açın.)*

```bash
# Ağ bağlantısını ve atanan 100.x.y.z IP adresini doğrula
tailscale status
```

## Node

Doğrudan kendi yazdığımız uygulama kodlarının geliştirilmesi, derlenmesi (build), test edilmesi ve paket bağımlılıklarının yönetilmesi için geliştirme ortamına (host) kurulur. 

- Sistem paketlerini güncelleyin

```bash
sudo dnf update -y
```

- Node.js 20 LTS (veya güncel sürüm) reposunu ekleyin ve kurun

```bash
sudo dnf module reset nodejs -y
sudo dnf module enable nodejs:20 -y
sudo dnf install nodejs -y
```

- Node.js sürümünü doğrula (LTS önerilir)
```bash
node -v
```

## pnpm

 **pnpm**, tüm paketleri bilgisayarınızda tek bir merkezi depoda (content-addressable store) saklar ve projelere sembolik bağlantılar (hard/symbolic links) aracılığıyla bağlar. Bu yaklaşım disk alanından yüksek oranda tasarruf sağlar, kurulum sürelerini hızlandırır ve paketler arası versiyon çakışmalarını önler.

```bash
corepack enable
corepack prepare pnpm@latest --activate

# pnpm kurulumunu doğrula
pnpm -v
```

## git - GitHub CLI

Versiyon kontrol araçlarımız.

 - Repo araçlarını kur
```bash 
   sudo dnf install -y git curl
```

 - GitHub CLI (gh) reposunu ekle ve kur 

```bash 
   sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
   sudo dnf install -y gh
```
## Docker

Bir yazılım projesi, yalnızca uygulama kodlarından ibaret değildir; arka planda çalışan veritabanlarına, önbellek (cache) mekanizmalarına ve yerel versiyon kontrol sunucularına (**Gitea**) ihtiyaç duyar. Bu servisleri doğrudan işletim sistemine kurmak zamanla port çakışmalarına, sürüm uyumsuzluklarına ve gereksiz kaynak tüketimine yol açar. **Docker**, her bir altyapı bileşenini kendi izole **konteyneri (container)** içinde çalıştırarak ana işletim sistemini tamamen temiz tutar.

Docker ile her bir servisin çalışmasını, kaynak tüketimini ve uyumluluğunu bütün olarak yönetmiş olacağız. Tüm servislerin işlem geçmişini de Docker üzerinden görebileceğiz. 

- Çakışan paketleri temizleme
 
```bash
   sudo dnf remove -y podman buildah docker docker-engine docker.io containerd runc
```


*** 

- Docker reposunu ekleme
```bash
   sudo dnf install -y yum-utils
   sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

***

- Kurulum
```bash
   sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

***

- Servisi başlatma ve otomatik başlangıç için ayarlama
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

***

- Non-root kullanıcı yetkilendirmesi
```bash
   sudo usermod -aG docker $USER
   newgrp docker
```

- Kurulumun başarıyla tamamlandığını test etmek için örnek `hello-world` konteynerini çalıştırın:
```bash
   sudo docker run hello-world
```
