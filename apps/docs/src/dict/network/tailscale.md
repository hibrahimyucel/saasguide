---
tarih: 2026-11-17
saat: 23:08
konu: "Tailscale: WireGuard Tabanlı Mesh VPN Ağı (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Altyapı Referans Kılavuzu (Katman 5: Tailscale)"
durum: "Tamamlandı"
etiketler: [tailscale, wireguard, mesh-vpn, zero-trust, cgnat, lexical-database, referans, altyapi-katman-5]
---

# Tailscale - VPN

* **Üretici / Geliştirici:** Avery Pennarun, David Crawshaw, Brad Fitzpatrick & Tailscale Inc.
* **Resmi Web Sitesi:** [tailscale.com](https://tailscale.com)

::: info CONCEPT MATRICES
* **Domain:** Software-Defined Networking (SDN) & Zero-Trust Network Access (ZTNA)
* **Superordinate Concept:** Peer-to-Peer Mesh Virtual Private Network (VPN)
* **Cryptographic Protocol:** WireGuard (Noise Protocol Framework, ChaCha20-Poly1305)
* **NAT Traversal Mechanism:** ICE, STUN, and DERP (Designated Encrypted Relay for Packets)
:::

## 1. Tanıtım

**Tailscale**, açık kaynaklı **WireGuard** protokolü üzerine inşa edilen; cihazlar arasında merkezi bir ağ geçidine (gateway) ihtiyaç duymadan doğrudan uçtan uca şifreli bağlantılar kuran, yapılandırma gerektirmeyen (zero-config) bir **Mesh VPN** (örgü sanal özel ağ) yazılımıdır.

---

## 2. Mimari Rolü ve Temel Prensipleri

**Tailscale**, geliştirme ortamı ile sunucular arasındaki ağ sürekliliğini garanti altına alır. Mobil erişim noktası (hotspot), herkese açık Wi-Fi veya CGNAT arkasındaki ev interneti gibi sürekli değişen fiziksel ağ koşullarında sunucuya ve istemcilere sabit bir özel IP adresi (`100.x.y.z`) atayarak **nip.io / duckDNS**  ve **Nginx** erişiminin kesintisiz çalışmasını sağlar.

* **Kontrol Düzlemi ve Veri Düzlemi Ayrımı:** Tailscale, kimlik doğrulama ve açık anahtar (public key) dağıtımı için merkezi bir **Koordinasyon Sunucusu** (Control Plane) kullanır; ancak cihazlar arasındaki gerçek veri trafiği (Data Plane) doğrudan cihazlar arasında (**Peer-to-Peer**) şifreli olarak akar.
* **CGNAT ve Güvenlik Duvarı Aşımı (NAT Traversal):** Port yönlendirme (port forwarding) veya statik genel IP (Public IP) gerektirmeden STUN ve ICE tekniklerini kullanarak NAT duvarlarını aşar; doğrudan bağlantının imkansız olduğu kısıtlı ağlarda ise uçtan uca şifreli **DERP** aktarma sunucuları üzerinden bağlantıyı sürdürür.
* **Sıfır Güven Mimarisi (Zero-Trust):** Tüm cihazlar kurumsal veya kişisel kimlik sağlayıcılarla (GitHub, Google, OIDC) doğrulanır ve ağ içi erişim izinleri merkezi **ACL** (Erişim Kontrol Listesi) kurallarıyla yönetilir.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Tailnet** | Özel Tailscale Ağı | Bir kullanıcıya veya organizasyona ait tüm yetkili cihazların, kullanıcıların ve erişim kurallarının yer aldığı izole sanal özel ağ alanı. |
| **WireGuard** | Çekirdek VPN Protokolü | Modern kriptografi kullanan, yüksek hızlı ve düşük gecikmeli açık kaynaklı VPN tünel protokolü. |
| **Tailscale IP (`100.x.y.z`)** | Kalıcı CGNAT IP Adresi | Tailnet içindeki her cihaza atanan, fiziksel ağ veya internet bağlantısı değişse bile sabit kalan `100.64.0.0/10` bloğundaki özel IPv4 adresi. |
| **Mesh Topology** | Örgü Ağ Topolojisi | Trafiğin tek bir merkez sunucu üzerinden dolaşması yerine, ağdaki her düğümün (cihazın) diğer düğümlerle doğrudan bağlantı kurabildiği ağ yapısı. |
| **NAT Traversal** | NAT Geçiş Tekniği | Geleneksel yönlendiricilerin (router) ve operatör CGNAT bloklarının arkasındaki cihazların port açmadan birbirine ulaşmasını sağlayan ağ tekniği. |
| **DERP Server** | Şifreli Aktarma Sunucusu | Çok katı güvenlik duvarları nedeniyle doğrudan P2P bağlantı kurulamadığında şifreli paketleri içeriğini göremeden ileten yedek röle sunucusu. |
| **MagicDNS** | Otomatik İç DNS | Tailnet içindeki cihazlara karmaşık IP adresleri yerine doğrudan makine adlarıyla (Örn: `http://saas-server`) erişilmesini sağlayan yerleşik DNS servisi. |
| **ACL (Access Control Lists)** | Erişim Kontrol Listeleri | Tailnet içindeki hangi kullanıcının veya cihazın hangi sunucu portuna erişebileceğini belirleyen JSON tabanlı güvenlik politikaları. |
| **Subnet Router** | Alt Ağ Yönlendiricisi | Tailscale kurulamayan (örneğin akıllı cihazlar veya yerel Docker iç ağları) sistemlere Tailnet üzerinden erişim sağlayan köprü düğüm. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

Sunucu kurulumu, bağlantı doğrulama ve ağ teşhisi için en sık başvurulan temel komut seti:

### Kurulum ve Ağa Katılım
```bash
# Linux sunuculara tek komutla Tailscale kurulumu yapar
curl -fsSL https://tailscale.cominstall.sh | sh

# Cihazı Tailnet ağına bağlar ve tarayıcı üzerinden kimlik doğrulama bağlantısı üretir
sudo tailscale up

# Sunucuyu SSH erişimine açık şekilde Tailnet ağına dahil eder
sudo tailscale up --ssh
```

### Durum ve IP Kontrolü
```bash
# Cihazın kalıcı Tailscale IPv4 adresini (100.x.y.z) ekrana yazdırır
tailscale ip -4

# Tailnet ağındaki tüm bağlı cihazları ve bağlantı durumlarını listeler
tailscale status

# Cihazı ağdan geçici olarak ayırır
sudo tailscale down
```

### Ağ Teşhisi ve Gecikme Ölçümü
```bash
# Hedef cihaza doğrudan (P2P) mi yoksa DERP rölesi üzerinden mi bağlanıldığını test eder
tailscale ping <hedef-cihaz-adi-veya-ip>

# Yerel ağın NAT tipini ve UDP bağlantı kalitesini analiz eder
tailscale netcheck
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [Tailscale Documentation](https://tailscale.comkb)
* **Mimari Teknik İnceleme:** [How Tailscale Works](https://tailscale.comblog/how-tailscale-works)
* **Güvenlik ve ACL Rehberi:** [Access Control Lists (ACLs)](https://tailscale.comkb/1018/acls)
