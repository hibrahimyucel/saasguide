
# `1.2.3.` Kaynak Yönetimi

::: info `docker stats` komutu çalışan servislerin kaynak kullanımını gösterir.

```bash
   docker stats nginx_proxy
```

Bu komut size anlık olarak şu bilgileri gösterecektir:

<pre>
CONTAINER ID      : Konteynerin benzersiz kimlik numarası.
NAME              : Konteynerin adı (Örn: nginx_proxy).
CPU %             : Konteynerin anlık işlemci kullanım yüzdesi.
MEM USAGE / LIMIT : Harcanan RAM miktarı ve atanan maksimum sınır.
MEM %             : Bellek kullanımının yüzde olarak oranı.
NET I/O           : Konteynerin aldığı ve gönderdiği toplam ağ trafiği.
BLOCK I/O         : Diske yazılan ve diskten okunan toplam veri miktarı.
PIDS              : Konteyner tarafından oluşturulan aktif süreç sayısı.
</pre>
:::
  
 
 
::: tip İlk servisimizin kaynak kullanımını yönetmek için compose dosyamızı aşağıdaki şekilde değiştiriyoruz. 

Nginx konteynır yapılandırması `infra/gateway/docker-compose.yml`. 
```yaml  
services:
  nginx_proxy:
    image: nginx:alpine
    container_name: nginx_proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/test.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    networks:
      - dev_network
    # Kaynak sınırlandırma alanları
    deploy:
      resources:
        limits:
          cpus: '1.0'        # Maksimum kullanabileceği CPU çekirdek sayısı
          memory: 512M       # Maksimum kullanabileceği RAM miktarı
        reservations:
          cpus: '0.25'       # Servis için ayrılan / garanti edilen minimum CPU
          memory: 128M       # Servis için ayrılan / garanti edilen minimum RAM

networks:
  dev_network:
    external: true
```
:::

::: info Servisimizi çalıştırıp kaynak kullanımını ve sınırları kontrol ediyoruz. 
 
```bash
   docker compose up -d
   docker stats
``` 
:::

---




