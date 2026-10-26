
# Docker

::: details Windows ortamında Docker ile Linux kullanma
### İmaj Türleri ve Boyutları
* **`almalinux:latest` (Standart):** ~120-180 MB disk boyutu. Tam `dnf` paket yöneticisi ve standart Linux araçlarını barındırır. Geliştirme (development) ortamları için idealdir.
* **`almalinux:minimal`:** ~37-40 MB disk boyutu (sıkıştırılmış download boyutu ~15-20 MB). Donanım çekirdeği (kernel), GUI ve systemd gibi servis yöneticilerini içermez; çekirdeği host OS ile ortak kullanır. C tabanlı `microdnf` / `dnf5` barındırır. Canlı (production) ortamlar için tasarlanmıştır.

:::
---

## AlmaLinux Üzerine Docker Engine Kurulumu (Host)

 1. Çakışan paketleri temizleme
 
 ```bash
sudo dnf remove -y podman buildah docker docker-engine docker.io containerd runc
 ```
 
 2. Docker reposunu ekleme
 ```bash
 sudo dnf install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
 ```
 3. Kurulum
 ```bash
 sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
 ```
 4. Servisi başlatma ve enable etme
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

 5. Non-root kullanıcı yetkilendirmesi
 ```bash
 sudo usermod -aG docker $USER
newgrp docker
```
 6. Kurulum Doğrulama
Kurulumun başarıyla tamamlandığını test etmek için örnek `hello-world` konteynerini çalıştırın:
```bash
sudo docker run hello-world
```
## Konteyner Verileri Nerede Tutulur?

1. **Named Volumes (`volumes: db_data`) :** Host sistemde `/var/lib/docker/volumes/` altında izole ve güvenli saklanır. Konteyner silinse de veriler kaybolmaz.

2. **Bind Mounts (`./saas-app:/usr/src/app`):** Host üzerindeki kaynak kod dizinini doğrudan konteynere köprüler. Canlı kod takibi (hot-reload) sağlar. İlk kısım (`./saas-app`) fiziksel yolu, ikinci kısım (`/usr/src/app`) docker içindeki dosya yolunu gösterir.

4. **Konteyner Katmanı (`COPY` komutları):** `/var/lib/docker/overlay2/` altında şifreli adlarla saklanır. Geçici katmandır, konteyner `down` edildiğinde buradaki kalıcılaştırılmamış değişiklikler yok olur.


## Docker Compose ile Çoklu Konteyner (Mikroservis) Mimarisi

Geliştirme ve test süreçlerinde tüm servisleri tek bir konteyner içine hapsetmek (Docker-in-Docker) yerine, izole servisleri `docker-compose` orkestrasyonu ile ayağa kaldırmak en doğru yaklaşımdır. 
Örnekte Nginx servisi istekleri kabul eder, uygulama ve veritabanı iç ağda çalışır.

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
