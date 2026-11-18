---
tarih: 2026-11-17
saat: 23:11
konu: "nip.io: Sıfır Yapılandırmalı Dinamik DNS Servisi (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Altyapı Referans Kılavuzu (Katman 6: nip.io)"
durum: "Tamamlandı"
etiketler: [nip-io, sslip-io, wildcard-dns, dynamic-dns, lexical-database, referans, altyapi-katman-6]
---

# nip.io (ve sslip.io) DNS

* **Üretici / Geliştirici:** Roopinder Singh (Kurucu, 2012) & Brian Cunnie, Kenneth Lakin (Mevcut Sürdürücüler / sslip.io Altyapısı)
* **Resmi Web Sitesi:** [nip.io](https://nip.io) / [sslip.io](https://sslip.io)

::: info CONCEPT MATRICES
* **Domain:** Dynamic Domain Name Resolution & Development Infrastructure
* **Superordinate Concept:** Stateless Wildcard DNS Service
* **Resolution Mechanism:** Algorithmic IP Extraction from Embedded Hostname Strings
* **Supported Formats:** Dot-Separated IPv4, Dash-Separated IPv4/IPv6, Hexadecimal IPv4
:::

## 1. Resmi Tanım (Formal Definition)

**nip.io** - **sslip.io**, içerisine IP adresi gömülmüş bir alan adı veya alt alan adı sorgulandığında, hiçbir veritabanı kaydına veya manuel DNS ayarına ihtiyaç duymadan doğrudan metnin içindeki o IP adresini yanıt olarak döndüren durumsuz (stateless) bir dinamik DNS servisidir.

Amacı IP adreslerini ezberden kurtarmak değil, DNS protokolü ve alan adı (FQDN) gerektiren teknik zorunlulukları sıfır konfigürasyonla aşmaktır.

## 2. Mimari Rolü ve Temel Prensipleri

Servis, IP adresini ek bir alan adı satın alma veya DNS yönetim panelinden manuel `A` kaydı girme maliyetine girmeden gerçek alt alan adlarına (`docs.100-84-12-45.nip.io`, `gitea.100-84-12-45.nip.io`) dönüştürür. Bu sayede **Nginx** sunucusunun gelen istekleri alt alan adına göre ayırabilmesini sağlar.

* **Algoritmik Çözümleme (Stateless Resolution):** Önceden kaydedilmiş bir bölge dosyasına (zone file) bakmaz. Sorgulanan alan adı metnini ayrıştırır (parse), içindeki IP adresini okur ve doğrudan o adresi döndürür.
* **Nokta ve Tire Ayracı Esnekliği:** Hem noktalı (`100.84.12.45.nip.io`) hem de tireli (`100-84-12-45.nip.io`) yazımı destekler. Özellikle SSL/TLS sertifikaları (Let's Encrypt HTTP-01 doğrulaması) ve çok seviyeli alt alan adı yönlendirmelerinde tek seviye alt alan adı uyumluluğu nedeniyle tireli (`-`) format standart olarak tercih edilir.
* **Kendi DNS Sunucusunu Barındırma (Self-Hosted) ve White-Label:** İstenirse özel bir alan adı (`://example.com`) için yetkili isim sunucusu (NS) yönlendirmesi yapılabilir veya açık kaynaklı `sslip.io-dns-server` ikili dosyası (binary) Docker üzerinde yerel olarak çalıştırılabilir.

---

* **Ters Vekil (Reverse Proxy) ve Sanal Barındırma:** Aynı sunucu üzerinde (örneğin `192.168.1.50`) çalışan birden fazla web servisini (Gitea, Nextcloud vb.) port numarası belirtmeden ayırmak için Nginx veya Traefik gibi ters vekiller HTTP `Host` başlığına ihtiyaç duyar. `gitea.192.168.1.50.nip.io` yapısı, tarayıcının geçerli bir alan adı göndermesini sağlayarak trafiğin doğru servise yönlendirilmesini mümkün kılar.
* **TLS / SSL Sertifikası ve HTTPS Desteği:** Sertifika otoriteleri (Let's Encrypt vb.) ve modern tarayıcı güvenlik politikaları çıplak IP adresleri yerine geçerli bir alan adı formatı bekler. nip.io, herhangi bir DNS kaydı açmaya gerek kalmadan tekil alt alan adları için HTTP-01 doğrulaması üzerinden geçerli TLS sertifikaları alınmasına olanak tanır.
* **OAuth2, SSO ve Çerez (Cookie) İzolasyonu:** Kimlik doğrulama sistemleri geri dönüş adresi (Callback URL) olarak genellikle geçerli bir üst düzey alan adı (TLD) şart koşar. Ayrıca farklı alt alan adları (`app1.IP.nip.io` ve `app2.IP.nip.io`), aynı IP üzerinde çalışan uygulamaların tarayıcı çerezlerini birbirinden izole eder.
* **Sıfır Bakım ve Otomasyon Hızı:** CI/CD süreçlerinde veya test ortamlarında sıkça oluşturulup silinen geçici sunucular için yerel DNS sunucularında sürekli `A` kaydı yönetme yükünü ortadan kaldırır.

### Kendi DNS Sunucusunu Barındırma (Self-Hosted)

* **DNS Rebinding Korumasını Aşmak:** Bazı yönlendiriciler (OpenWrt, pfSense vb.), dış dünyadaki bir alan adının yerel ağdaki özel bir IP adresine çözülmesini güvenlik riski (DNS Rebinding) olarak algılayıp engeller.
* **İnternetsiz (Air-Gapped) Ortamlar:** Dış ağa kapalı izole ortamlarda dış nip.io sunucularına erişilemeyeceği için aynı sıfır-konfigürasyon kolaylığını yerel ağda sürdürmek amacıyla `sslip.io-dns-server` yerel olarak çalıştırılır.

### Sınırlamalar ve Dikkat Edilmesi Gerekenler

* **Wildcard (Genel-Geçer) Sertifika Desteği Yoktur:** `*.IP.nip.io` biçiminde genel-geçer sertifikalar üretilemez; her alt alan adı için bireysel sertifika alınmalıdır.
* **Hız Sınırları (Rate Limits):** Ortak bir ana alan adı kullanıldığı için Let's Encrypt sertifika üretim limitlerine takılma riski vardır; bu nedenle kalıcı ortamlarda ve wildcard ihtiyaçlarında DuckDNS gibi DNS-01 doğrulaması destekleyen alternatifler tercih edilmelidir.

## 3. Sözlük Veritabanı (Lexical Database)

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Embedded IP Hostname** | IP Gömülü Alan Adı | Hedef IP adresini doğrudan kendi sözdizimi içinde barındıran özel alan adı yapısı (Örn: `minio.100-84-12-45.nip.io`). |
| **Dash Notation** | Tireli Gösterim | IPv4 oktetlerinin nokta yerine tire (`-`) ile ayrıldığı yazım biçimi (`100-84-12-45.nip.io`). IPv6 adresleri için zorunludur. |
| **Dot Notation** | Noktalı Gösterim | IPv4 adresinin standart noktalarla yazıldığı biçim (`100.84.12.45.nip.io`). |
| **Hexadecimal Notation** | Onaltılık Gösterim | IPv4 adresinin 8 karakterli hexadecimal karşılığıyla yazıldığı kısa alan adı biçimi (Örn: `40B01609.nip.io` -> `64.176.22.9`). |
| **sslip.io** | Eşdeğer Kardeş Servis | `nip.io` ile aynı arka uç altyapısını paylaşan ve alan adları birbirinin yerine kullanılabilen açık kaynaklı dinamik DNS servisi. |
| **HTTP-01 Challenge** | TLS Sertifika Doğrulaması | Let's Encrypt gibi sertifika otoritelerinin alan adı sahipliğini doğrulamak için 80 portu üzerinden yaptığı HTTP dosyası kontrolü (`nip.io` ile bireysel sertifika alınabilir, wildcard sertifika verilmez). |
| **White-Label NS** | Özel Alan Adı Yönlendirmesi | Kullanıcının kendi alan adının bir alt alanını (`://alanadim.com`) nip.io isim sunucularına (`ns-00.nip.io`, `ns-01.nip.io`, `ns-ovh.sslip.io`) devrederek markalı kullanım sağlaması. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

### Adres Formatları ve Çözümleme Örnekleri

| Kullanım Amacı | Örnek URL / Hostname | Döndürdüğü IP Adresi |
| :--- | :--- | :--- |
| **Servis Alt Alan Adı (Tireli - Önerilen)** | `docs.100-84-12-45.nip.io` | `100.84.12.45` |
| **Servis Alt Alan Adı (Noktalı)** | `gitea.100.84.12.45.nip.io` | `100.84.12.45` |
| **Yerel Geliştirme (Loopback)** | `app.127-0-0-1.nip.io` | `127.0.0.1` |
| **IPv6 Adres Çözümleme** | `2a01-4f8-c17-b8f--2.nip.io` | `2a01:4f8:c17:b8f::2` |

### Doğrulama ve Test Komutları
```bash
# nip.io üzerinden bir alt alan adının doğru IP adresine çözümlendiğini doğrular
dig docs.100-84-12-45.nip.io +short

# Alternatif eşdeğer servis (sslip.io) üzerinden sorgulama yapar
dig gitea.100-84-12-45.sslip.io +short

# Kendi Docker ortamında izole nip.io/sslip.io DNS sunucusu test etmek için:
docker run -it --rm fedora sh -c "curl -L https://github.com -o dns-server && chmod +x dns-server && ./dns-server &"
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Web Sitesi ve Dokümantasyon:** [nip.io / sslip.io](https://nip.io)
* **Açık Kaynak Kod Deposu (DNS Sunucusu):** [GitHub - cunnie/sslip.io](https://github.com)
