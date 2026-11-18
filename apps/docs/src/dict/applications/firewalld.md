---
tarih: 2026-11-17
saat: 23:44
konu: "firewalld: Bölge Tabanlı Dinamik Güvenlik Duvarı (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Sunucu İşletim Sistemi Güvenliği (Ağ Paket Filtreleme Katmanı)"
durum: "Tamamlandı"
etiketler: [firewalld, firewall, nftables, security, network-zones, linux-security, lexical-database, referans]
---

# firewalld: Bölge Tabanlı Dinamik Güvenlik Duvarı

* **Üretici / Geliştirici:** Red Hat & Açık Kaynak Topluluğu
* **Resmi Web Sitesi:** [firewalld.org](https://firewalld.org)
* **Mimari Bağlamı:** Sunucu Çekirdek Ağ Güvenliği ve Arayüz Bazlı Port İzolasyonu

::: info CONCEPT MATRICES
* **Domain:** Host-Based Network Security & Packet Filtering
* **Superordinate Concept:** Dynamic Firewall Management Daemon
* **Kernel Backend:** Linux Netfilter (`nftables` / `iptables`) via D-Bus Interface
* **Security Model:** Trust-Level Network Zones & Stateful Packet Inspection
:::

## 1. Tanım

**firewalld**, Linux işletim sistemlerinde çekirdek düzeyindeki paket filtreleme altyapısını (`nftables` / `iptables`) yöneten; ağ arayüzlerini farklı güven seviyelerine sahip bölgelere ( **zones** ) ayıran ve mevcut aktif ağ bağlantılarını kesmeden güvenlik kurallarını dinamik olarak güncelleyebilen bir güvenlik duvarı yönetim servisidir.

---

## 2. Mimari Rolü ve Temel Prensipleri

**firewalld**, dış dünyaya (genel internete) açık ağ arayüzü (`eth0`) ile kapalı özel ağ arayüzü (`tailscale0`) arasında kesin bir güvenlik sınırı çizer. Böylece yönetim panelleri (**Gitea**, **MinIO**, **SSH**) genel internetten gelen tüm taramalara tamamen kapatılırken yalnızca **Tailscale** arayüzü üzerinden tam erişime açılır.

* **Kesintisiz Kural Güncelleme (Dynamic Runtime):** Geleneksel güvenlik duvarlarının aksine yeni bir kural eklendiğinde tüm güvenlik duvarını yeniden başlatmaz ve açık olan SSH veya konteyner bağlantılarını koparmaz.

* **Bölge Tabanlı Güven Mimarisi (Network Zones):** Fiziksel ağ kartını (`eth0`) kısıtlayıcı `public` bölgesine, sanal VPN arayüzünü (`tailscale0`) ise güvenli `trusted` bölgesine atayarak ağ arayüzü bazında mutlak izolasyon sağlar.

* **Çalışma Zamanı ve Kalıcı Yapılandırma Ayrımı:** Kurallar önce geçici olarak test edilebilir (`runtime`) ve doğrulandıktan sonra `--permanent` bayrağıyla diske kalıcı olarak işlenir.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Zone** | Güvenlik Bölgesi | Belirli bir ağ arayüzüne veya kaynak IP aralığına uygulanan önceden tanımlı güven kuralları kümesi (`public`, `trusted`, `drop`, `dmz`). |
| **`nftables` / `iptables`** | Çekirdek Paket Filtresi | Linux çekirdeği (Netfilter) içinde ağ paketlerini kabul eden, reddeden veya yönlendiren alt seviye filtreleme motoru. |
| **Stateful Inspection** | Durum Bilgili Denetim | Mevcut bir bağlantıya ait dönüş paketlerini otomatik tanıyıp izin veren akıllı paket denetim mekanizması. |
| **Rich Rules** | Zengin Kurallar | Belirli bir kaynak IP adresine, belirli bir porta veya hız sınırına (rate limit) göre ince ayarlı güvenlik kuralları yazmayı sağlayan gelişmiş sözdizimi. |
| **Masquerading** | IP Maskeleme (NAT) | Docker konteynerlerinin veya alt ağ istemcilerinin sunucunun ana IP adresi üzerinden dış internete çıkabilmesini sağlayan NAT özelliği. |
| **`firewall-cmd`** | Yönetim Komut Satırı Aracı | Çalışan `firewalld` arka plan servisiyle D-Bus üzerinden haberleşerek kuralları sorgulayan ve değiştiren CLI aracı. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

```bash
# Güvenlik duvarının çalışma durumunu ve aktif bölgeleri kontrol eder
sudo firewall-cmd --state
sudo firewall-cmd --get-active-zones

# Tailscale sanal ağ arayüzünü tamamen güvenli (trusted) bölgeye kalıcı olarak atar
sudo firewall-cmd --zone=trusted --add-interface=tailscale0 --permanent

# Genel (public) bölgede yalnızca HTTPS (443) trafiğine kalıcı izin verir
sudo firewall-cmd --zone=public --add-service=https --permanent

# Değişiklikleri aktif kurallara uygular ve public bölgedeki tüm kuralları listeler
sudo firewall-cmd --reload
sudo firewall-cmd --zone=public --list-all
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [firewalld Documentation](https://firewalld.orgdocumentation/)
* **Bölge (Zone) Kavramları Rehberi:** [firewalld Zones Guide](https://firewalld.orgdocumentation/zone/predefined-zones.html)
