---
tarih: 2026-11-15
saat: 18:30
konu: "Dış Erişim ve DNS Çözümleri: ngrok, No-IP ve nip.io Teknik Analizi"
baglam: "apps/docs (VitePress Rehberi) / Sunucu ve Geliştirme Ortamı Ağ Mimarisi"
durum: "Tamamlandı"
etiketler: [vitepress, ar-ge, ag-mimarisi, ngrok, no-ip, nip-io, dns]
---

# Dış Erişim ve DNS Çözümleri (ngrok, No-IP, nip.io)

Bu doküman, yerel geliştirme ortamlarını veya dinamik/statik IP'li sunucuları dış dünyaya açmak için kullanılan **ngrok**, **No-IP** ve **nip.io** araçlarının teknik gereksinimlerini, kullanım senaryolarını ve mimari karşılaştırmasını belgeler.

---

## 1. Hızlı Karşılaştırma Özeti

Üç araç da dışarıdan erişim ve alan adı yönlendirme problemlerini çözer ancak çalışma katmanları tamamen farklıdır.

| Özellik / Kriter | ngrok (Reverse Tunnel) | No-IP (Dynamic DNS) | nip.io (Wildcard DNS) |
| :--- | :--- | :--- | :--- |
| **Çalışma Mantığı** | Şifreli tünel (Reverse Proxy) | Dinamik IP - Alan adı eşleşmesi | IP gömülü otomatik DNS çözümü |
| **Port Yönlendirme (NAT)** | Gerekmez | Gerekir (Modem/Router ayarı) | Gerekir (Açık port veya Localhost) |
| **Statik IP İhtiyacı** | Yok | Yok | Kısmen (Dış erişim için sabit IP gerekir) |
| **Ücretsiz SSL (HTTPS)** | Dahili olarak gelir | Harici kurulum gerekir (Certbot) | Harici kurulum gerekir (Let's Encrypt) |
| **Kurulum / İstemci** | Yerel ajan (CLI) gerektirir | Update Client (DUC) veya Router | Sıfır kurulum (Zero-config) |

---

## 2. Araç Bazlı Detaylı Analiz

### A. ngrok (Tünelleme ve Ters Vekil Sunucu)
Yerel makinenizde çalışan bir portu, güvenlik duvarı veya modem ayarlarına dokunmadan ngrok bulut sunucuları üzerinden internete açan tünelleme servisidir.

* **Gereksinimler:**
  * Ücretsiz veya ücretli bir ngrok hesabı ve `authtoken` anahtarı.
  * Yerel makineye veya sunucuya kurulmuş `ngrok` CLI ajanı.
  * Dışarıya açılacak aktif bir yerel servis (örneğin `localhost:3000`).

* **Kullanım Durumları:**
  * **Webhook Testleri:** Stripe, GitHub, Clerk veya Telegram gibi dış servislerden yerel geliştirme ortamına gelen anlık istekleri yakalamak.
  * **Hızlı Müşteri Sunumları:** Projeyi sunucuya deploy etmeden yerel ortamdan geçici bir URL ile dışarıya göstermek.
  * **CGNAT Arkasındaki Ağlar:** İnternet servis sağlayıcısının (ISS) ortak IP havuzu kullandığı ve port açmanın imkansız olduğu ev/ofis ağları.

* **Avantajları ve Dezavantajları:**
  * **Avantaj:** Port yönlendirme veya statik IP gerektirmez. Dahili HTTPS sertifikası ve gelen trafiği inceleme (Traffic Inspector) arayüzü sunar.
  * **Dezavantaj:** Ücretsiz planda her yeniden başlatmada alan adı değişir. Tüm trafik ngrok sunucularından geçtiği için ek gecikme (latency) ve bant genişliği sınırları oluşur.

---

### B. No-IP (Dinamik DNS - DDNS)
İnternet servis sağlayıcınız tarafından periyodik olarak değiştirilen dinamik IP adresinizi sabit bir alt alan adına (`proje.ddns.net` gibi) bağlayan sistemdir.

* **Gereksinimler:**
  * No-IP hesabı ve seçilmiş bir ücretsiz/ücretli alan adı.
  * Modem/Router üzerinde **Port Yönlendirme (Port Forwarding)** yetkisi (80, 443 vb.).
  * ISS tarafından **CGNAT** havuzuna dahil edilmemiş, gerçek bir dinamik dış IP adresi.
  * IP değişimlerini No-IP'ye bildirecek **DUC (Dynamic Update Client)** yazılımı veya modem içi DDNS desteği.

* **Kullanım Durumları:**
  * **Ev Sunucuları (Home Lab):** Evdeki eski bir bilgisayarı veya Raspberry Pi cihazını sürekli erişilebilir bir test/staging sunucusu yapmak.
  * **Uzaktan Erişim:** Dinamik IP'li bir ofis ağına SSH, VPN veya uzak masaüstü ile bağlanmak.

* **Avantajları ve Dezavantajları:**
  * **Avantaj:** Trafik doğrudan kendi sunucunuza gelir, araya üçüncü parti bir tünel sunucusu girmez. Sabit bir alan adı sağlar.
  * **Dezavantaj:** Modem ayarları ve güvenlik duvarı yapılandırması gerektirir. Ücretsiz planda alan adının her 30 günde bir manuel olarak onaylanması şarttır.

---

### C. nip.io (Sıfır Yapılandırmalı Wildcard DNS)
Herhangi bir kayıt veya DNS paneli ayarı gerektirmeden, alan adının içine gömülen IP adresini doğrudan çözümleyen açık kaynaklı bir DNS servisidir. Örneğin `192.168.1.50.nip.io` sorgusu doğrudan `192.168.1.50` adresine yönlenir.

* **Gereksinimler:**
  * Hesap, kayıt veya yazılım kurulumu **gerektirmez**.
  * Sunucunun erişilebilir bir IPv4 veya IPv6 adresine sahip olması (Yerel ağ IP'si veya VPS genel IP'si).
  * Dış dünyadan erişilecekse hedef IP'nin sabit (statik) olması ve ilgili portların güvenlik duvarında açık bulunması.

* **Kullanım Durumları:**
  * **Multi-Tenant (Çok Kiracılı) SaaS Geliştirme:** `tenant1.127.0.0.1.nip.io` ve `tenant2.127.0.0.1.nip.io` şeklinde alt alan adı bazlı kiracı yönlendirmelerini yerel ortamda `/etc/hosts` dosyasını düzenlemeden test etmek.
  * **Yeni VPS Kurulumları:** Henüz gerçek bir domain satın almadan veya DNS yönlendirmesi yapmadan yeni kiralanan bir sunucuda SSL sertifikası (Let's Encrypt HTTP-01) ve ters vekil sunucu (Nginx/Caddy) testleri yapmak.
  * **Kubernetes / Docker Ingress:** Yerel küme (cluster) içindeki servislere alan adı bazlı yönlendirme kuralları yazmak.

* **Avantajları ve Dezavantajları:**
  * **Avantaj:** Tamamen ücretsizdir ve sıfır yapılandırma ile anında çalışır. Sınırsız alt alan adı (subdomain) kullanımını destekler.
  * **Dezavantaj:** Üretim (production) ortamında son kullanıcıya sunulacak marka görünümü için uygun değildir. Let's Encrypt sertifika limitleri (`nip.io` genel alan adı üzerinden) zaman zaman dolabilir.

---

## 3. Mimari Karar Rehberi

Projenin geliştirme ve dağıtım aşamalarına göre önerilen seçim matrisi aşağıdadır:

* **Yerel makinede dış servislerden Webhook alacaksanız:** **ngrok** kullanın.
* **SaaS projesinde subdomain (tenant) mimarisini kendi bilgisayarınızda test edecekseniz:** **nip.io** (`*.127.0.0.1.nip.io`) kullanın.
* **Yeni kurulan bir VPS sunucusunda domain bağlamadan önce hızlıca HTTPS test edecekseniz:** **nip.io** (`sunucu-ip.nip.io`) kullanın.
* **Evdeki veya ofisteki sabit bir cihazı sürekli açık bir test sunucusuna dönüştürecekseniz:** **No-IP** kullanın.

