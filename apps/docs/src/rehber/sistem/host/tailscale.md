---
tarih: 2026-11-16
saat: 01:12
konu: "Hotspot ve Hibrit Sunucu Mimarisi İçin Tailscale Mesh VPN Kurulumu"
baglam: "apps/docs / Altyapı ve Ağ Yönetimi (AlmaLinux, PC, Mobil & VPS)"
durum: "Tamamlandı"
etiketler: [altyapi, almalinux, tailscale, mesh-vpn, network-manager, nip-io, docker]
---

# 🌐 VPN Hibrit Geliştirme Ortamı İçin Tailscale Mesh VPN ve Ağ Yapılandırması

Bu rehber; mobil erişim noktası (hotspot) üzerinden internete çıkan yerel **AlmaLinux** sunucusu, geliştirme bilgisayarı (**PC**), mobil cihazlar (**Android/iOS**) ve sabit IP'li uzak **VPS** sunucuları arasında kesintisiz, düşük gecikmeli ve kalıcı IP adresine sahip bir özel ağ (Mesh VPN) kurulmasını belgeler.

---

## 1. Ar-Ge ve Teknik Tespit

### Problem Tanımı
* **Değişken Alt Ağ (Subnet) Sorunu:** Mobil cihazlar (özellikle Android/Samsung hotspot) her yeniden başlatıldığında rastgele bir yerel IP bloğu (`192.168.xxx.x`) ve standart dışı ağ geçidi (örn. `.246`) atamaktadır.
* **CGNAT ve Port Kısıtlaması:** Mobil operatörlerin uyguladığı CGNAT engeli nedeniyle yerel sunuculara dışarıdan veya farklı ağlardan doğrudan port yönlendirme (NAT) yapılamamaktadır.
* **Servis Bazlı Alt Alan Adı İhtiyacı:** Monorepo mimarisindeki mikro servislerin (`web`, `api`, `docs`) tek bir makine üzerinde alan adı bazlı test edilebilmesi için ek DNS maliyetine girmeden dinamik çözümleme gerekmektedir.

### Mimari Karar ve Seçim Kriterleri
* **Tailscale (WireGuard Tabanlı Mesh VPN):** Merkezi bir sunucu üzerinden trafiği dolaştırmak yerine cihazlar arasında doğrudan eşler arası (**Peer-to-Peer / P2P**) şifreli tünel kurduğu için tercih edilmiştir.
* **Trafik Optimizasyonu:** Aynı hotspot ağına bağlı cihazlar (PC ↔ AlmaLinux) yerel Wi-Fi üzerinden doğrudan haberleşir; mobil internet kotası harcanmaz. Genel internet trafiği tünel dışından (Split Tunneling) akar.
* **DNS Kombinasyonu (`nip.io`):** Tailscale tarafından atanan kalıcı `100.x.y.z` IP adresleri, tireli `nip.io` formatıyla (`servis.100-x-y-z.nip.io`) birleştirilerek ters vekil (Reverse Proxy) yönlendirmeleri için kullanılır.

---

## 2. Uygulama ve Yapılandırma Adımları

### A. AlmaLinux Ağ Teşhisi ve Geçici Sabit IP Doğrulaması
Hotspot bağlantılarında ağ geçidi (Gateway) adresini tespit etmek ve bağlantıyı doğrulamak için `nmcli` kullanılır:

```bash
# 1. Aktif donanım arayüzünü ve bağlantı profilini kontrol etme
nmcli device status
nmcli connection show

# 2. Geçici DHCP modunda gerçek ağ geçidini (default via) tespit etme
ip route

# 3. Manuel sabit IP tanımlama (Örnek: 192.168.218.246 ağ geçidi için)
sudo nmcli connection modify "Galaxy S10+d2fc" \
  ipv4.addresses 192.168.218.161/24 \
  ipv4.gateway 192.168.218.246 \
  ipv4.dns "8.8.8.8 1.1.1.1" \
  ipv4.method manual

sudo nmcli connection up "Galaxy S10+d2fc"
```

### B. AlmaLinux ve VPS Üzerinde Tailscale Kurulumu
RHEL/AlmaLinux tabanlı sunucularda resmi kurulum betiği ile servis aktif edilir:

```bash
# 1. Tailscale paket deposunu ekleme ve kurma
curl -fsSL https://tailscale.com | sh

# 2. Arka plan servisini (tailscaled) başlatma ve açılışa ekleme
sudo systemctl enable --now tailscaled

# 3. Sunucuyu Tailscale ağına dahil etme (Tarayıcı üzerinden onaylanır)
sudo tailscale up

# 4. Atanan kalıcı özel IPv4 adresini görüntüleme
tailscale ip -4
```

### C. Wi-Fi Bağlantısını Otomatik (DHCP) Moda Döndürme
Tailscale `100.x.y.z` bloğunda kalıcı bir IP sağladığı için, hotspot IP değişimlerinden etkilenmemek adına sunucunun Wi-Fi profili otomatiğe alınır:

```bash
sudo nmcli connection modify "Galaxy S10+d2fc" \
  ipv4.method auto \
  ipv4.addresses "" \
  ipv4.gateway ""

sudo nmcli connection up "Galaxy S10+d2fc"
```

### D. İstemci (PC ve Mobil) Entegrasyonu
1. **Mobil (Android/iOS):** Resmi Tailscale uygulaması yüklenir ve aynı kimlik sağlayıcı (Google/GitHub) ile oturum açılarak VPN profili onaylanır.
2. **Geliştirme Bilgisayarı (PC):** İlgili işletim sistemi istemcisi kurulur ve aynı hesapla giriş yapılarak ağa dahil edilir.

---

## 3. Doğrulama ve Test Senaryoları

### Ağ ve DNS Erişim Testi
Sunucunun dış dünyaya ve Tailscale ağına sağlıklı paket ilettiği doğrulanır:

```bash
# Dış IP ve DNS çözümleme testi
ping -c 3 8.8.8.8 && ping -c 3 google.com

# Tailscale ağı üzerindeki diğer cihazlarla P2P gecikme testi
tailscale ping <HEDEF_CIHAZ_TAILSCALE_IP>
```

### Monorepo Servis Yönlendirme Örneği (`nip.io`)
Cihazın kalıcı Tailscale IP adresi `100.84.12.45` varsayıldığında, Docker veya Reverse Proxy (Nginx/Caddy) arkasındaki servislere aşağıdaki kalıcı adreslerden erişilir:

| Servis Adı | Kalıcı Erişim Adresi (MagicDNS) | Alt Alan Adı Formatı (`nip.io`) |
| :--- | :--- | :--- |
| **Web Arayüzü** | `http://almalinux:3000` | `http://nip.io` |
| **Backend API** | `http://almalinux:4000` | `http://nip.io` |
| **VitePress Docs** | `http://almalinux:5173` | `http://nip.io` |

---

## 4. Mimari Kazanımlar ve Sonuç
* **Sıfır Bakım Maliyeti:** Ek bir kontrol sunucusu (Headscale) veya dinamik DNS betiği çalıştırmaya gerek kalmadan kişisel planda sınırsız cihazla kalıcı IP elde edilmiştir.
* **Tam Taşınabilirlik:** Sunucu veya geliştirme bilgisayarı farklı bir Wi-Fi ağına ya da mobil erişim noktasına geçtiğinde hiçbir yapılandırma değişikliği yapmadan çalışma ortamı korunur.

