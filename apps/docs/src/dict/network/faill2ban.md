---
tarih: 2026-11-17
saat: 23:44
konu: "Fail2ban: Otomatik Kaba Kuvvet (Brute-Force) Saldırı Engelleme Sistemi (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Sunucu İşletim Sistemi Güvenliği (Log Analizi ve Dinamik Ban Katmanı)"
durum: "Tamamlandı"
etiketler: [fail2ban, intrusion-prevention, ips, brute-force, security, ssh-protection, lexical-database, referans]
---

# Fail2ban

* **Üretici / Geliştirici:** Cyril Jaquier & Fail2ban Topluluğu
* **Resmi Web Sitesi:** [fail2ban.org](https://fail2ban.org) / [GitHub - fail2ban](https://github.com)
* **Mimari Bağlamı:** Sunucu Proaktif Savunma Katmanı (SSH, Nginx ve Dex Kaba Kuvvet Koruması)

::: info CONCEPT MATRICES
* **Domain:** Host-Based Intrusion Prevention System (HIPS) & Log Analysis
* **Superordinate Concept:** Automated Behavioral Threat Mitigation Daemon
* **Implementation Language:** Python
* **Mitigation Mechanism:** Regex Log Parsing -> Dynamic Firewall Rule Injection (`firewalld` / `nftables`)
:::

## 1. Tanım

**Fail2ban**, Python ile geliştirilmiş açık kaynaklı bir izinsiz giriş önleme (IPS) yazılımıdır; sistem ve uygulama günlük dosyalarını (`/var/log/auth.log`, Nginx erişim logları vb.) gerçek zamanlı olarak tarayarak tekrarlayan başarısız oturum açma veya kötü niyetli tarama girişimlerini tespit eder ve saldırgan IP adreslerini belirlenen süre boyunca güvenlik duvarı üzerinden otomatik olarak engeller.

---

## 2. Mimari Rolü ve Temel Prensipleri

**Fail2ban**, **firewalld** ile doğrudan entegre çalışarak pasif port korumasının ötesinde aktif davranışsal savunma sağlar. SSH, **Nginx** uç noktaları veya **Dex** kimlik doğrulama sayfasına yönelik otomatik şifre deneme (brute-force) ve zafiyet tarama botlarını saniyeler içinde etkisiz hale getirir.

* **Düzenli İfade (Regex) Tabanlı Log Analizi:** Arka planda tanımlı filtreler (Filters), sunucu loglarına düşen *"Failed password"*, *"401 Unauthorized"* veya *"404 Not Found"* gibi başarısız işlem desenlerini anlık olarak yakalar.

* **Eşik Değer ve Zaman Penceresi Mantığı:** Belirli bir zaman aralığında (`findtime`, örneğin 10 dakika) izin verilen maksimum hatalı deneme sayısını (`maxretry`, örneğin 5 deneme) aşan IP adreslerini otomatik olarak kara listeye alır.

* **Dinamik Güvenlik Duvarı Müdahalesi:** Engellenen IP adresi `bantime` süresi boyunca (veya tekrarlayan saldırılarda artan cezalarla) doğrudan `firewalld` kurallarına eklenerek sunucu kaynaklarını tüketmesi engellenir.

---

## 3. Sözlük Veritabanı (Lexical Database)

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Jail** | Koruma Kafesi | Bir filtre (Filter) ile bir eylemi (Action) birleştiren; hangi servisin loglarının izleneceğini ve eşik aşıldığında ne yapılacağını tanımlayan kural bloğu (Örn: `[sshd]`, `[nginx-http-auth]`). |
| **Filter** | Log Arama Filtresi | Hedef servisin günlük dosyasında saldırı belirtisi olan satırları yakalamak için kullanılan düzenli ifade (`failregex`) şablonu. |
| **Action** | Engelleme Eylemi | Eşik değer aşıldığında Fail2ban'ın çalıştırdığı müdahale komutu (Örn: `firewallcmd-rich-rules` ile IP'yi engelleme). |
| **`maxretry`** | Maksimum Hata Eşiği | Bir IP adresinin engellenmeden önce `findtime` süresi içinde yapabileceği en fazla başarısız giriş denemesi sayısı. |
| **`findtime`** | Gözlem Penceresi | Hatalı giriş denemelerinin sayıldığı saniye cinsinden zaman aralığı (Örn: `600` saniye = 10 dakika). |
| **`bantime`** | Engelleme Süresi | Tespit edilen saldırgan IP adresinin sunucuya erişiminin kesileceği süre (Kalıcı engelleme için `-1` kullanılır). |
| **`jail.local`** | Yerel Yapılandırma Dosyası | Paket güncellemelerinde üzerine yazılmaması için varsayılan `jail.conf` yerine kullanıcı ayarlarının tutulduğu kalıcı yapılandırma dosyası. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

```bash
# Fail2ban servis durumunu ve aktif olan tüm koruma kafeslerini (jails) listeler
sudo fail2ban-client status

# Belirli bir kafesin (örneğin sshd) detaylı istatistiklerini ve engellenen IP listesini görür
sudo fail2ban-client status sshd

# Yanlışlıkla engellenen bir IP adresinin engelini manuel olarak kaldırır
sudo fail2ban-client set sshd unbanip 203.0.113.50

# Yapılandırma değişikliklerini aktif bağlantıları kesmeden yeniden yükler
sudo fail2ban-client reload
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon ve Wiki:** [Fail2ban GitHub Wiki](https://github.com/wiki)
* **Yapılandırma Kılavuzu:** [Fail2ban Configuration Manual](https://fail2ban.orgwiki/index.php/MANUAL_0_8)
