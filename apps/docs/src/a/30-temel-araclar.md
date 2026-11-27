---
title: "Gerekli Programlar ve Çalışma Zamanı Kurulumu"
description: "AlmaLinux 9 üzerinde Node.js, pnpm, Git, GitHub CLI ve Docker Engine kurulum adımları."
outline:
sidebarTitle: "Gerekli Programlar"
index: 30
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "nodejs", "pnpm", "git", "docker"]
---

# Host Kurulumu

::: info Geliştirici Ortamı Hazırlığı
Bu rehber, **πr² Cloud** ekosisteminde kod geliştirme ve monorepo orkestrasyonunun yürütüleceği yerel geliştirici makinesinin (Host) ve ek olarak geliştirme sunucusunun hazırlanmasını kapsar.
:::


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

**Corepack**  
Monorepo projelerinde ve CI/CD (Gitea Act Runner) süreçlerinde farklı geliştirici makineleri ile sunucuların birebir aynı paket yöneticisi sürümünü kullanması kritik öneme sahiptir. Doğrudan `npm install -g pnpm` ile yapılan kurulumlar sisteme sabit ve proje bağımsız bir sürüm yükleyerek zamanla `pnpm-lock.yaml` kilit dosyası uyumsuzluklarına yol açabilir. **Corepack**, kök `package.json` dosyasındaki `"packageManager"` alanını okuyarak proje için tanımlanan tam `pnpm` sürümünü otomatik olarak indirir, önbelleğe alır ve tüm ortamlarda sıfır yapılandırma ile sürüm tutarlılığını garanti eder.

**pnpm**, tüm paketleri bilgisayarınızda tek bir merkezi depoda (content-addressable store) saklar ve projelere sembolik bağlantılar (hard/symbolic links) aracılığıyla bağlar. Bu yaklaşım disk alanından yüksek oranda tasarruf sağlar, kurulum sürelerini hızlandırır ve paketler arası versiyon çakışmalarını önler.

* Varsa daha önce `npm` ile global kurulan pnpm sürümünü temizleyin:
```bash
npm uninstall -g pnpm
```


* Sistemde Corepack kurulu değilse yükleyin, ardından aktif edip pnpm'i hazırlayın:

```bash
# Corepack mevcut değilse global olarak kur
command -v corepack >/dev/null 2>&1 || sudo npm install -g corepack

# Corepack'i mevcut PATH ortamıyla aktif et ve pnpm'i hazırla
sudo env "PATH=$PATH" corepack enable
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
   docker run hello-world
```
