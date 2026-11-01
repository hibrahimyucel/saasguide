# `1.1.4.` Yerel SSL (`mkcert`)

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
