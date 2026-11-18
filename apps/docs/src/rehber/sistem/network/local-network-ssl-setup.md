---
tarih: 2026-11-15
saat: 19:55
konu: "Yerel Ağ Sunucu Yapılandırması: AlmaLinux Sabit IP, mkcert SSL ve Mobil Cihaz Erişimi"
baglam: "apps/docs (VitePress Rehberi) / Geliştirme Ortamı Ağ ve Güvenlik Mimarisi"
durum: "Tamamlandı"
etiketler: [vitepress, almalinux, sabit-ip, mkcert, nip-io, ssl, gitea, mobil-erişim]
---

# Yerel Ağ Sunucu Yapılandırması (Sabit IP, mkcert SSL ve Mobil Erişim)

Bu doküman, AlmaLinux geliştirme sunucusuna sabit yerel IP atanmasını, `mkcert` ve `nip.io` kullanarak çoklu alt alan adı (wildcard) destekli SSL sertifikası üretilmesini ve ağdaki mobil cihazların (Android/iOS) yerel servislere HTTPS üzerinden güvenli erişim sağlamasını belgeler.

---

## 1. AlmaLinux Sabit IP Yapılandırması (`nmcli`)

Sunucu yeniden başlatıldığında yerel IP adresinin değişmemesi ve `nip.io` sertifikalarının geçerliliğini koruması için ağ arayüzünü sabitleyin.

### A. Ağ Arayüzü ve Ağ Geçidi Tespiti
```bash
# Aktif ağ bağlantı adını görüntüleyin (Örn: ens160)
nmcli connection show

# Varsayılan ağ geçidini (Modem/Router IP) öğrenin (Örn: 192.168.218.1)
ip route | grep default
```
*(Not: `hostname -I` çıktısında görülen `172.x.0.1` adresleri Docker sanal ağlarına aittir. İlk sıradaki `192.168.x.x` adresi sunucunun gerçek yerel ağ IP'sidir.)*

### B. Statik IP Tanımlama
```bash
sudo nmcli connection modify ens160 ipv4.addresses 192.168.218.161/24
sudo nmcli connection modify ens160 ipv4.gateway 192.168.218.1
sudo nmcli connection modify ens160 ipv4.dns "1.1.1.1 8.8.8.8"
sudo nmcli connection modify ens160 ipv4.method manual

# Değişiklikleri aktif edin
sudo nmcli connection up ens160
```

---

## 2. Çoklu Alan Adı SSL Sertifikası Üretimi (`mkcert`)

Hem `localhost` hem de yerel IP tabanlı `*.nip.io` alt alan adlarını (`docs`, `git`, `dev`) tek sertifika altında toplamak için `infra/nginx/certs` dizininde aşağıdaki komutları çalıştırın:

```bash
cd infra/nginx/certs

# Yerel Kök Sertifikayı (CA) sisteme kurun
mkcert -install

# Çoklu alan adı (SAN) destekli sertifikayı üretin
mkcert -cert-file localhost.crt -key-file localhost.key \
  "localhost" \
  "*.localhost" \
  "192.168.218.161.nip.io" \
  "*.192.168.218.161.nip.io" \
  "127.0.0.1" \
  "::1"
```

Yeni sertifikanın aktif olması için Nginx konteynerini yeniden yükleyin:
```bash
docker exec pr2_dev_proxy nginx -t && docker exec pr2_dev_proxy nginx -s reload
```

---

## 3. Uygulama Katmanı Uyarlamaları

### A. VitePress (`allowedHosts`) İzni
Vite geliştirme sunucusunun `nip.io` alan adından gelen istekleri engellememesi için `apps/docs/.vitepress/config.mts` dosyasına `allowedHosts` kuralını ekleyin:

```ts
export default defineConfig({
  vite: {
    server: {
      allowedHosts: ['.nip.io', 'dev.localhost']
    }
  }
})
```

### B. Gitea ve Git İstemci Ayarları
Gitea arayüzündeki klonlama bağlantılarının doğru üretilmesi için `docker-compose.yml` içindeki ortam değişkenlerini güncelleyin:
```yaml
environment:
  - GITEA__server__DOMAIN=git.192.168.218.161.nip.io
  - GITEA__server__SSH_DOMAIN=git.192.168.218.161.nip.io
  - GITEA__server__ROOT_URL=https://nip.io
```

Yerel repoların uzak depo (`origin`) adreslerini ve Git SSL güven ayarını güncelleyin:
```bash
# Mevcut yerel repoda uzak depo adresini güncelleme
git remote set-url origin https://nip.io/KULLANICI/REPO.git

# Git istemcisine mkcert kök sertifikasını tanıtma
git config --global http.sslCAInfo "\$(mkcert -CAROOT)/rootCA.pem"
```

---

## 4. Mobil Cihazlara Sertifika Dağıtımı (Web Üzerinden)

Ağdaki telefon veya tabletlerin yerel HTTPS servislerine sertifika hatası almadan bağlanabilmesi için kök sertifikayı (`rootCA.pem`) geçici olarak web sunucusu üzerinden dağıtın.

### 1. Sertifikayı Web Dizinine Kopyalayın
```bash
cp "\$(mkcert -CAROOT)/rootCA.pem" /path/to/wwwroot/default-gateway/rootCA.pem
```

### 2. Mobil Cihazdan İndirin ve Kurun
Sunucu ile aynı Wi-Fi ağına bağlı telefondan `http://192.168.218` adresine giderek dosyayı indirin:

* **Android:** `Ayarlar -> Güvenlik -> Sertifika Yükle (CA Sertifikası)` yolunu izleyerek indirilen `rootCA.pem` dosyasını seçin.
* **iOS (iPhone/iPad):**
  1. İndirme sonrası `Ayarlar -> Genel -> VPN ve Aygıt Yönetimi` menüsünden **mkcert** profilini yükleyin.
  2. `Ayarlar -> Genel -> Hakkında -> Sertifika Güven Ayarları` bölümünden **mkcert** sertifikasını aktif (yeşil) konuma getirin.

### 3. Güvenlik Temizliği (Zorunlu)
Kurulum tamamlandıktan sonra kök sertifika dosyasını genel erişime açık web klasöründen silin:
```bash
rm /path/to/wwwroot/default-gateway/rootCA.pem
```

