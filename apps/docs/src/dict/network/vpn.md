---
tarih: 2026-11-17
saat: 23:10
konu: "VPN: Sanal Özel Ağ Protokolleri (Kavramsal Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Ağ ve Güvenlik Temelleri (Katman 5: Tailscale Altyapı Kavramı)"
durum: "Tamamlandı"
etiketler: [vpn, tunneling, cryptography, network-security, lexical-database, referans]
---

# VPN - Virtual Private Network

* **Standart / Protokol Geliştiricileri:** IETF (IPsec), OpenVPN Inc., Jason A. Donenfeld (WireGuard)
* **İlgili Standartlar:** RFC 4301 (IPsec), WireGuard Protocol Specification

::: info CONCEPT MATRICES
* **Domain:** Network Security & Encrypted Tunneling
* **Superordinate Concept:** Overlay Network Architecture
* **Core Mechanisms:** Encapsulation, Cryptographic Authentication, End-to-End Encryption
* **Architectural Topologies:** Client-to-Site (Remote Access), Site-to-Site, Peer-to-Peer Mesh
:::

## 1. Tanım

**VPN (Virtual Private Network)**, herkese açık ve güvensiz bir ağ altyapısı (internet) üzerinde noktadan noktaya şifreli sanal tüneller (tunneling) oluşturarak, cihazların sanki aynı fiziksel yerel ağa (LAN) bağlıymış gibi güvenli veri alışverişi yapmasını sağlayan ağ teknolojisidir.

---

## 2. Mimari Rolü ve Temel Prensipleri

**VPN** kavramı, sunucu portlarını (`3000`, `9001` vb.) genel internete (Public Internet) açmadan geliştirici cihazları ile sunucular arasında kapalı ve güvenli bir özel ağ oluşturmak ve işletim sistemi ayarlarından bağımsız olarak ip sabitlemek için kullanılır.

* **Tünelleme ve Kapsülleme (Tunneling & Encapsulation):** Orijinal ağ paketleri şifrelenir ve dış dünyaya yalnızca standart bir UDP veya TCP paketi gibi görünecek şekilde yeni bir paket başlığının içine sarılır.
* **Gizlilik ve Veri Bütünlüğü:** İletilen veriler modern simetrik şifreleme algoritmalarıyla (ChaCha20, AES-256) korunur; üçüncü tarafların trafiği dinlemesi (sniffing) veya değiştirmesi (man-in-the-middle) engellenir.
* **Topoloji Farklılıkları:** Geleneksel *Hub-and-Spoke* merkezi sunuculu VPN mimarisinde tüm trafik tek bir merkezden geçerken, *Mesh* (örgü) VPN mimarisinde düğümler birbirine doğrudan bağlanarak gecikmeyi en aza indirir.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Tunneling** | Tünelleme | Bir ağ protokolüne ait veri paketlerinin, güvenli iletim amacıyla başka bir protokol paketinin içine yerleştirilerek taşınması tekniği. |
| **Encapsulation** | Paket Kapsülleme | Şifrelenmiş iç IP paketinin, genel internette yönlendirilebilmesi için dış IP başlığıyla sarılması işlemi. |
| **Overlay Network** | Üst Katman Sanal Ağı | Mevcut fiziksel internet altyapısının üzerine yazılım yoluyla kurulan mantıksal sanal ağ katmanı. |
| **Split Tunneling** | Bölünmüş Tünelleme | Yalnızca özel sunucu trafiğinin VPN tünelinden geçirilip, genel internet trafiğinin doğrudan yerel bağlantı üzerinden çıkmasını sağlayan yönlendirme kuralı. |
| **Key Exchange** | Anahtar Değişimi | İki cihazın güvensiz bir ağ üzerinden birbirini doğrulayıp ortak şifreleme anahtarı üretmesini sağlayan kriptografik el sıkışma süreci. |
| **CGNAT** | Taşıyıcı Seviyesi NAT | İnternet servis sağlayıcıların (ISS) tek bir genel IPv4 adresini birden fazla aboneye paylaştırması nedeniyle doğrudan dış bağlantı kurulamayan ağ yapısı. |
| **Firewall Traversal** | Güvenlik Duvarı Geçişi | NAT ve güvenlik duvarı engellerini aşarak iki uç nokta arasında çift yönlü tünel kurma mekanizması. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

Linux sistemlerde sanal ağ arayüzlerini, tünel durumlarını ve yönlendirme tablolarını incelemek için kullanılan temel ağ araçları:

```bash
# Sistemdeki tüm fiziksel ve sanal VPN ağ arayüzlerini (tun0, tailscale0 vb.) listeler
ip addr show

# Ağ paketlerinin hangi ağ geçidi (gateway) veya VPN tüneli üzerinden yönlendirildiğini gösterir
ip route show

# Linux çekirdeğindeki aktif WireGuard tünel arayüzlerini ve el sıkışma (handshake) durumunu gösterir
sudo wg show
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **WireGuard Teknik Makalesi:** [WireGuard: Next Generation Kernel Network Tunnel](https://wireguard.com)
* **IETF IPsec Mimarisi:** [RFC 4301 - Security Architecture for the Internet Protocol](https://ietf.org)
