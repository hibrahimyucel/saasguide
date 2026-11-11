
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

## Docker Veri Yönetimi

### **Docker Volumes** 

 Docker host (ana makine) üzerinde Docker tarafından yönetilen depolama alanlarıdır. Linux'ta genellikle `/var/lib/docker/volumes/` altında tutulur). Docker süreci dışındaki uygulamaların veya kullanıcıların bu verilere doğrudan müdahale etmesi önerilmez. 
   
   - **Named Volumes**
   
Sizin veya `docker-compose` dosyasının özel bir isim vererek oluşturduğu alanlardır. Konteynerler arasında rahatça paylaşılabilir. Konteyner silinse bile veriler kaybolmaz.  Veritabanı verileri gibi kalıcı olması gereken senaryolar için en çok önerilen yöntemdir.
   
   - **Anonymous Volumes** 
   
`docker run -v /konteyner` şeklinde, kaynak ismi belirtilmeden oluşturulan alanlardır. Docker bunlara rastgele uzun bir ID atar. Genellikle geçici veriler için kullanılır ve konteyner silindiğinde birlikte temizlenir.

***
### Bind Mounts 
Host makine üzerindeki herhangi bir dosya veya klasör yolunun doğrudan konteynerin içine bağlanmasıdır.

• Host ile konteyner arasında çift yönlü ve anlık (*real-time*) veri senkronizasyonu sağlar.

• Genellikle yerel yazılım geliştirme (local development) süreçlerinde kodda yapılan değişikliğin konteyner içinde anında görünmesi (*hot-reload*) için tercih edilir.

• Host sistemin dosya yapısına bağlı olduğu için taşınabilirliği Docker volume'lara göre daha azdır.

***
### Konteyner Katmanı (`COPY` komutları)  
`/var/lib/docker/overlay2/` altında şifreli adlarla saklanır. Geçici katmandır, konteyner kapatıldığında (`down`)  buradaki değişiklikler yok olur.


## Mikroservis Çalıştırma

`docker-compose up/down` komutu aktif klasördeki `docker-compose.yml` dosyasını çalıştırır veya durdurur. Farklı bir klasördeki dosyayı veya farklı isimde bir dosyayı işlemek için `docker-compose -f docker-compose.test.yml  up` şeklinde `-f` parametresi ile kullanılır. 

Örnekte Nginx servisi istekleri kabul eder, uygulama ve veritabanı iç ağda çalışır. 
Servislerin bağımlılıkları, disk kaynakları, ağ parametreleri ve servisi çalıştırmak için kullanılacak komutlar `docker-compose.yml` içindedir. 

 

::: details  `docker-compose.yml`
```yaml
version: '3.8'

services:
  database:
    image: mariadb:10.11
    container_name: saas_mariadb
    restart: always
    environment:
      MARIADB_ROOT_PASSWORD: root_password_here
      MARIADB_DATABASE: saas_db
      MARIADB_USER: saas_user
      MARIADB_PASSWORD: user_password_here
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - saas_network

  saas-app:
    build: ./saas-app
    container_name: saas_application
    restart: always
    command: npm run dev
    volumes:
      - ./saas-app:/usr/src/app
      - /usr/src/app/node_modules
    environment:
      - DB_HOST=database
      - DB_USER=saas_user
      - DB_PASSWORD=user_password_here
      - DB_NAME=saas_db
      - PORT=3000
    depends_on:
      - database
    networks:
      - saas_network

  nginx:
    image: nginx:alpine
    container_name: saas_nginx
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - saas-app
    networks:
      - saas_network

volumes:
  db_data:

networks:
  saas_network:
    driver: bridge
```
:::
