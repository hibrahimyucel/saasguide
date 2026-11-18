---
tarih: 2026-11-13
saat: 18:00
konu: "Kurulum Rehberi 4. Adım: Yerel HTTPS ve SSL Sertifikaları (mkcert)"
baglam: "apps/docs (VitePress Rehber Dökümantasyonu) / Geliştirme Ortamı Kurulumu"
durum: "Tamamlandı"
etiketler: [mkcert, https, ssl, guvenlik, yerel-gelistirme, vitepress, kurulum-rehberi]
---
# `4.` Yerel SSL/TLS (`mkcert`)

Geliştirme ortamındaki servislerin (yerel Gitea, web arayüzü ve API katmanları) canlı sunucu (production) standartlarında test edilebilmesi için yerel ağda **HTTPS** protokolünün aktif olması gerekir. **mkcert**, karmaşık yapılandırmalara gerek kalmadan yerel alan adları için tarayıcılar tarafından güvenilen geçerli SSL/TLS sertifikaları üreten bir araçtır.


* **Gerçek Ortam Uyumu:** Modern kimlik doğrulama sistemleri (SSO, Secure Cookies, JWT) ve tarayıcı API'leri canlı ortamda yalnızca HTTPS üzerinden çalışır. Yerelde HTTPS kullanmak, canlıya geçişte oluşabilecek güvenlik ve çerez hatalarını en baştan engeller.

* **Sıfır Tarayıcı Hatası:** Sisteminize yerel bir Kök Sertifika Otoritesi (Local CA) tanımlayarak, ürettiği sertifikaların Chrome, Firefox, Edge ve Node.js/Git gibi araçlar tarafından doğrudan onaylanmasını sağlar.

## `mkcert` Kurulum

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

## Çoklu Alan Adı Sertifika Üretimi
Hem localhost hem de yerel IP tabanlı *.nip.io alt alan adlarını (docs, git, dev) tek sertifika altında toplamak için infra/nginx/certs dizininde aşağıdaki komutları çalıştırın:


```bash
cd infra/nginx/certs

# Çoklu alan adı (SAN) destekli sertifikayı üretin
mkcert -cert-file localhost.crt -key-file localhost.key \
  "localhost" \
  "*.localhost" \
  "192.168.218.161.nip.io" \
  "*.192.168.218.161.nip.io" \
  "127.0.0.1" \
  "::1"
```


## Sertifika Dağıtımı


`mkcert -install` ile oluşturduğunuz sertifika otoritesi (CA) yalnız sizin makinanızda geçerlidir. Diğer cihazların sisteminize https ile ulaşabilmesi için kök sertifikayı o cihazlara tanıtmalısınız.


`mkcert -CAROOT` komutu sertifika klasörünü gösterir. Ağdaki telefon, tablet ve masaüstü cihazların yerel HTTPS servislerine sertifika hatası almadan bağlanabilmesi gerekli kök sertifika (`rootCA.pem`) bu klasördedir. Bu dosyayı diğer cihazlara kopyalayın.

### 1. Sertifikayı Web Dizinine Kopyalayın
```bash
cp "\$(mkcert -CAROOT)/rootCA.pem" /path/to/wwwroot/default-gateway/rootCA.pem
```

### 2. Cihazdan İndirin ve Kurun

Giriş sayfanızda dosya için bağlantı oluşturup, diğer cihazda dosyayı indirin.

* **Android:** `Ayarlar -> Güvenlik -> Sertifika Yükle (CA Sertifikası)` yolunu izleyerek indirilen `rootCA.pem` dosyasını seçin.
* **iOS (iPhone/iPad):**
  1. İndirme sonrası `Ayarlar -> Genel -> VPN ve Aygıt Yönetimi` menüsünden **mkcert** profilini yükleyin.
  2. `Ayarlar -> Genel -> Hakkında -> Sertifika Güven Ayarları` bölümünden **mkcert** sertifikasını aktif (yeşil) konuma getirin.

### 3. Güvenlik Temizliği (Zorunlu)
Kurulum tamamlandıktan sonra kök sertifika dosyasını genel erişime açık web klasöründen silin:
```bash
rm /path/to/wwwroot/default-gateway/rootCA.pem
```

