---
tarih: 2026-11-17
saat: 23:24
konu: "No-IP: Yönetilen Dinamik DNS (DDNS) Platformu (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Altyapı Alternatifleri ve DDNS Referansı (Katman 6 Alternatifi)"
durum: "Tamamlandı"
etiketler: [no-ip, ddns, dynamic-dns, duc, networking, lexical-database, referans]
---

# No-IP  (DDNS)

* **Üretici / Geliştirici:** Vitalwerks Internet Solutions, LLC (No-IP)
* **Resmi Web Sitesi:** [noip.com](https://noip.com)

::: info CONCEPT MATRICES
* **Domain:** Managed DNS & Dynamic Hostname Resolution
* **Superordinate Concept:** Enterprise & Consumer Dynamic DNS Service
* **Update Protocol:** DynDNS2 HTTP-Based Update Protocol (`nic/update`)
* **Client Architecture:** Dynamic Update Client (DUC) Daemon & Embedded Router Firmware
:::

## 1. Tanım

**No-IP**, dinamik IP adresine sahip ev sunucularına, ağ cihazlarına ve yönlendiricilere (router) sabit bir alan adı (örneğin `.ddns.net`, `.hopto.org`) üzerinden kesintisiz erişim imkanı sağlayan; yerleşik modem destekleri ve arka plan istemcisi (DUC) ile çalışan köklü bir Dinamik DNS (DDNS) sağlayıcısıdır.

---

## 2. Mimari Rolü ve Temel Prensipleri

**No-IP**, işletim sistemi düzeyinde özel bir betik çalıştırmaya gerek kalmadan doğrudan fiziksel modem veya yönlendirici (router) arayüzünden dinamik IP takibi yapılması gereken senaryolarda tercih edilen endüstri standardı bir DDNS çözümüdür.

Mobile, Hotspot ve kablosuz modemler gibi internet erişimi başka bir ip havuzuna (CGNAT) bağlı sistemlerde çalışmaz.

* **Donanım ve Modem Entegrasyonu:** Piyasadaki pek çok ev ve ofis yönlendiricisinin (Asus, TP-Link, Keenetic, MikroTik vb.) yazılımında yerleşik No-IP istemcisi bulunur; IP değiştiği an modem doğrudan No-IP sunucularını günceller.
* **DynDNS2 Güncelleme Protokolü:** Endüstri standardı haline gelmiş `DynDNS2` protokolünü desteklediği için `ddclient` veya `inadyn` gibi açık kaynaklı Linux DDNS istemcileriyle sorunsuz çalışır.
* **Ücretsiz vs. Ücretli Katman Farkı:** Ücretsiz planda belirli alan adı uzantıları (`ddns.net`, `zapto.org`) sunulur ancak kaydın aktif kalması için **her 30 günde bir** e-posta veya web paneli üzerinden manuel onay verilmesi gerekir. Ücretli planlarda bu onay zorunluluğu kalkar ve özel alan adları yönetilebilir.

---

## 3. Sözlük Veritabanı (Lexical Database)

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **DUC (Dynamic Update Client)** | Dinamik Güncelleme İstemcisi | Sunucu veya bilgisayar üzerinde arka plan servisi (daemon) olarak çalışıp IP değişikliğini algılayan ve No-IP sunucularına bildiren resmi yazılım. |
| **DynDNS2 Protocol** | Standart DDNS Güncelleme Protokolü | Farklı DDNS sağlayıcıları ve istemci yazılımları (`ddclient`) arasında ortak kullanılan HTTP tabanlı IP güncelleme standardı. |
| **30-Day Confirmation** | 30 Günlük Doğrulama Döngüsü | No-IP ücretsiz hesaplarında atıl alan adlarını temizlemek amacıyla uygulanan aylık manuel yenileme kuralı. |
| **Port Forwarding** | Port Yönlendirme | Genel ağdan (Public IP) No-IP alan adıyla modeme gelen 80/443 trafiğinin yerel ağdaki sunucu IP'sine aktarılması kuralı (CGNAT arkasında çalışmaz). |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

Linux sunucularda No-IP istemcisi (`noip-duc`) veya açık kaynaklı `ddclient` üzerinden IP güncelleme işlemleri:

```bash
# DynDNS2 protokolü üzerinden HTTP Basic Auth ile manuel IP güncelleme isteği
curl -u "kullanici_adi:parola" "https://no-ip.com"

# Resmi No-IP Dynamic Update Client (DUC) servis durumunu kontrol eder (Linux systemd)
sudo systemctl status noip-duc

# Açık kaynaklı ddclient aracıyla güncelleme işlemini hata ayıklama modunda test eder
sudo ddclient -daemon=0 -debug -verbose -noquiet
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon ve Bilgi Bankası:** [No-IP Knowledge Base](https://noip.comsupport/knowledgebase)
* **Linux DUC Kurulum Kılavuzu:** [Installing the Linux Dynamic Update Client](https://noip.comsupport/knowledgebase/installing-the-linux-dynamic-update-client)
