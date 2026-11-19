---
title: 'Kurulum Rehberi 3. Adım: Docker ve İzole Altyapı Mimarisi'
description: >-
  Versiyon kontrolü (Git) ve uygulama geliştirme katmanını (Node.js & pnpm)
  yerel ortamımızda hazır hale getirdikten sonraki adım, projemizin ihtiyaç
  duyd...
outline:
  - 2
  - 3
status: published
tags:
  - docker
  - konteyner
  - izolasyon
  - altyapi
  - gitea
  - vitepress
  - kurulum-rehberi
---

# `3.` Docker 

## Altyapı İzolasyonu ve Taşınabilirlik

Versiyon kontrolü (**Git**) ve uygulama geliştirme katmanını (**Node.js & pnpm**) yerel ortamımızda hazır hale getirdikten sonraki adım, projemizin ihtiyaç duyduğu dış bağımlılıkları ve sistem servislerini yönetecek olan **Docker** altyapısını kurmaktır.

Bir yazılım projesi, yalnızca uygulama kodlarından ibaret değildir; arka planda çalışan veritabanlarına, önbellek (cache) mekanizmalarına ve yerel versiyon kontrol sunucularına (**Gitea**) ihtiyaç duyar. Bu servisleri doğrudan işletim sistemine kurmak zamanla port çakışmalarına, sürüm uyumsuzluklarına ve gereksiz kaynak tüketimine yol açar. **Docker**, her bir altyapı bileşenini kendi izole **konteyneri (container)** içinde çalıştırarak ana işletim sistemini tamamen temiz tutar.

Docker ile her bir servisin çalışmasını, kaynak tüketimini ve uyumluluğunu bütün olarak yönetmiş olacağız. Tüm servislerin işlem geçmişini de Docker üzerinden görebileceğiz. 

## AlmaLinux Docker Kurulumu

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

***


