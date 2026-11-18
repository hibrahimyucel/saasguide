
# `1.1.3.` Docker

Geliştirme ortamımızda Nginx, MariaDB gibi servisleri çalıştırır. Projelerimizi, **development** veya **preview** modunda bağımsız olarak çalıştırmamızı sağlar.

Bu sayede her bir servisin çalışmasını ve kaynak tüketimini bütün olarak yönetmiş olacağız. Tüm servislerin işlem geçmişini de Docker üzerinden görebileceğiz. 



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


