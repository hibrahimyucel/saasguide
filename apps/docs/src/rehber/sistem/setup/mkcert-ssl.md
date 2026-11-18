# `1.1.4.` Yerel SSL/TLS

*Güncel olarak TLS (Transport Layer Security) kullanılmaktadır. SSL (Secure Socket Layer) terimi alışkanlıklardan kalmadır.*

Yerel sertifika aracı olarak `mkcert` kullanacağız.

::: info `mkcert` aracını yükleyin

```bash
sudo dnf install -y nss-tools curl

curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert
mkcert -version

```
::: 

::: info Yerel Kök Sertifika Otoritesini (CA) bilgisayarınıza yükleyin
   
```bash
   mkcert -install
```

::: 
