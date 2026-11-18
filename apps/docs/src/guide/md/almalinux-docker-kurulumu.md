# AlmaLinux Docker Kurulum Rehberi

AlmaLinux üzerinde **Docker CE (Community Edition)** kurulumunu gerçekleştirmek için aşağıdaki adımları sırasıyla uygulayabilirsiniz.

## 1. Sistemi Güncelleme
Kuruluma başlamadan önce mevcut paketlerin güncel olduğundan emin olun:
```bash
sudo dnf update -y
```

## 2. Depo Yönetim Araçlarını Yükleme
Docker deposunu sisteme ekleyebilmek için `dnf-utils` paketini kurun:
```bash
sudo dnf install -y dnf-utils
```

## 3. Docker Deposunu Ekleme
Resmi Docker CentOS/RHEL deposunu sisteminize tanımlayın:
```bash
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

## 4. Docker CE Kurulumu
Docker motorunu ve gerekli bileşenleri yükleyin:
```bash
sudo dnf install -y docker-ce --nobest
```

## 5. Docker Servisini Başlatma
Docker servisini çalıştırın ve sistem her açıldığında otomatik olarak başlamasını sağlayın:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

## 6. Kurulum Doğrulama
Kurulumun başarıyla tamamlandığını test etmek için örnek `hello-world` konteynerini çalıştırın:
```bash
sudo docker run hello-world
```

---

## Ekstra: Sudo Olmadan Çalıştırma (İsteğe Bağlı)
Her Docker komutunun başına `sudo` yazmamak için mevcut kullanıcınızı `docker` grubuna ekleyebilirsiniz:
```bash
sudo usermod -aG docker $USER
newgrp docker
```
