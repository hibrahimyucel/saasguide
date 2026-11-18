---
tarih: 2026-11-17
saat: 23:24
konu: "DuckDNS: Ücretsiz Dinamik DNS (DDNS) Servisi (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Altyapı Alternatifleri ve DDNS Referansı (Katman 6 Alternatifi)"
durum: "Tamamlandı"
etiketler: [duckdns, ddns, dynamic-dns, dns, letsencrypt, lexical-database, referans]
---

# DuckDNS (DDNS)

* **Üretici / Geliştirici:** Steven & Andy (DuckDNS Ekibi)
* **Resmi Web Sitesi:** [duckdns.org](https://duckdns.org)

::: info CONCEPT MATRICES
* **Domain:** Dynamic Domain Name Resolution (DDNS)
* **Superordinate Concept:** Stateful Dynamic DNS Hosting Provider
* **Update Mechanism:** Stateless HTTPS GET/POST Token-Based API
* **Certificate Capability:** Native DNS-01 Challenge Support (Wildcard TLS Certificates)
:::

## 1. Tanım

**DuckDNS**, AWS (Amazon Web Services) altyapısı üzerinde barındırılan; kullanıcılara `.duckdns.org` uzantılı ücretsiz alt alan adları tahsis eden ve değişen genel IP (Public IP) adreslerini basit bir HTTP/HTTPS API isteğiyle güncel tutmalarını sağlayan ücretsiz bir Dinamik DNS (DDNS) servisidir.

---

## 2. Mimari Rolü ve Temel Prensipleri

Tailscale IP adresleri (`100.x.y.z`) veya sunucunun genel internete (Public Internet) açık IP adresi için sıfır yapılandırmayla DNS hizmeti sağlar.

* **Durumlu (Stateful) Alt Alan Adı Tahsisi:** nip.io'nun aksine IP adresini alan adının içine gömmez; kullanıcıya özel kalıcı bir alt alan adı (`projeadi.duckdns.org`) tanımlar ve arka planda bu alan adının `A` / `AAAA` kaydını tutar.
* **Wildcard TLS Sertifika Desteği (DNS-01 Challenge):** DuckDNS API anahtarı (Token) kullanılarak Let's Encrypt üzerinden `*.projeadi.duckdns.org` biçiminde **Wildcard SSL/TLS** sertifikası (hem ana alan adını hem tüm alt alan adlarını kapsayan tek sertifika) alınabilir.
   - `*.projeadi.duckdns.org` ve `projeadi.duckdns.org` adları için sertifika alabiliyorsunuz fakat yenilemede sorun çıkıyor. Sadece wilcard(*) sertifika alıp `projeadi.duckdns.org` adresini `main.projeadi.duckdns.org` adresine yönlendirmeyi tercih edebilirsiniz. 

* **Sıfır Yenileme Zorunluluğu:** Ücretsiz hesaplarda oluşturulan alt alan adları için aylık manuel onay veya tıklama zorunluluğu bulunmaz; API üzerinden IP güncellendiği sürece aktif kalır.

---

## 3. Sözlük Veritabanı (Lexical Database)

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **DDNS (Dynamic DNS)** | Dinamik Alan Adı Sistemi | İnternet servis sağlayıcı tarafından periyodik olarak değiştirilen dinamik IP adreslerini sabit bir alan adına otomatik eşleyen teknoloji. |
| **DuckDNS Token** | API Erişim Anahtarı | Hesaba tanımlı alt alan adlarının IP kayıtlarını dışarıdan HTTP isteğiyle güncellemek ve TXT kaydı eklemek için kullanılan benzersiz UUID anahtarı. |
| **DNS-01 Challenge** | DNS Tabanlı Sertifika Doğrulaması | Let's Encrypt sertifika otoritesinin alan adı sahipliğini doğrulamak için DNS'e geçici bir `TXT` kaydı yazılmasını beklediği yöntem (Wildcard sertifika için zorunludur). |
| **Wildcard Certificate** | Joker TLS Sertifikası | Tek bir sertifika dosyasıyla bir alan adının tüm alt alan adlarını (`*.projeadi.duckdns.org`) şifreleyebilen X.509 dijital sertifikası. |
| **Cron Job** | Zamanlanmış Görev | Linux sunucularda belirli aralıklarla (örneğin her 5 dakikada bir) DuckDNS güncelleme komutunu otomatik çalıştıran sistem zamanlayıcısı. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

Sunucunun güncel IP adresini DuckDNS API'sine bildirmek ve otomatikleştirmek için kullanılan temel komutlar:

```bash
# Sunucunun mevcut genel IPv4 adresini otomatik algılayıp DuckDNS kaydını günceller
curl "https://duckdns.orgupdate?domains=projeadi&token=TOKEN_DEGERI&ip="

# Belirli bir özel IP adresini (örneğin Tailscale IP'sini) manuel olarak kaydeder
curl "https://duckdns.orgupdate?domains=projeadi&token=TOKEN_DEGERI&ip=100.84.12.45"

# Linux crontab içine eklenerek her 5 dakikada bir otomatik IP güncellemesi sağlar:
# */5 * * * * curl -s "https://duckdns.orgupdate?domains=projeadi&token=TOKEN_DEGERI&ip=" >/dev/null 2>&1
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Web Sitesi ve Kurulum Rehberi:** [DuckDNS Install Guide](https://duckdns.orginstall.jsp)
* **API Spesifikasyonu:** [DuckDNS HTTP API Spec](https://duckdns.orgspec.jsp)
