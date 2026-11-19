---
tarih: 2026-11-18
saat: 00:27
konu: "AlmaLinux 9: Kurumsal Sınıf RHEL Uyumlu Sunucu İşletim Sistemi (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Sunucu İşletim Sistemi ve Temel Altyapı Katmanı (Katman 0: Host OS)"
durum: "Tamamlandı"
etiketler: [almalinux, rhel, enterprise-linux, dnf, selinux, systemd, lexical-database, referans, altyapi-katman-0]
---

# AlmaLinux 9
---

* **Üretici / Geliştirici:** AlmaLinux OS Foundation
* **Resmi Web Sitesi:** [almalinux.org](https://almalinux.org)

::: info CONCEPT MATRICES
* **Domain:** Enterprise Server Operating Systems & Linux Distributions
* **Superordinate Concept:** RHEL-Compatible (Application Binary Interface) Enterprise Linux
* **Core Components:** Linux Kernel 5.14 LTS, DNF/RPM Package Manager, systemd, SELinux, firewalld
* **Lifecycle & Support:** 10-Year Enterprise Lifecycle (AlmaLinux 9.x Supported Until May 2032)
:::

## 1. Tanıtım

**AlmaLinux 9**, Red Hat Enterprise Linux (RHEL) 9 ile ikili düzeyde (ABI) uyumlu, kar amacı gütmeyen **AlmaLinux OS Foundation** tarafından geliştirilen ve 10 yıllık uzun süreli destek (LTS) sunan açık kaynaklı, kurumsal sınıf bir Linux sunucu işletim sistemidir.


## 2. Mimari Rolü ve Temel Prensipleri

**AlmaLinux 9**, proje altyapısı ve doğal olarak rehberde geçen tüm işlemlerin test platformudur. Ancak program kurulumu ve güvenlik yapılandırması dışında kullanacağımız tüm komutlar **Docker** veya **Node** tarafından çalıştırılacağı için projenin katı bir OS bağımlılığı yoktur.   


* **10 Yıllık Kararlılık ve Öngörülebilirlik:** Sık ve kırıcı (breaking) güncellemeler yerine kurumsal kararlılık sunar; AlmaLinux 9 serisi **Mayıs 2032** tarihine kadar güvenlik ve hata düzeltme güncellemeleri alır.
* **SELinux (Security-Enhanced Linux) Zorunlu Erişim Kontrolü:** Standart Linux dosya izinlerinin ötesinde, süreçlerin ve servislerin (özellikle **Nginx** ters vekil yönlendirmelerinin ve **Docker** hacimlerinin) yalnızca kendilerine tanımlanan kaynaklara erişmesini sağlayan çekirdek düzeyi güvenlik katmanıdır.
* **Yerleşik `firewalld` ve `DNF` Ekosistemi:** `firewalld` varsayılan güvenlik duvarı yöneticisi olarak gelir. Paket yönetiminde `dnf` (Dandified YUM) ve kurumsal ek paketler için **EPEL** (Extra Packages for Enterprise Linux) deposu kullanılır.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **ABI Compatibility** | İkili Uyumluluk | RHEL 9 için derlenmiş tüm yazılım, sürücü ve kurumsal paketlerin hiçbir değişiklik gerektirmeden AlmaLinux 9 üzerinde birebir çalışabilmesi. |
| **DNF / RPM** | Paket Yönetim Sistemi | AlmaLinux üzerinde yazılım kurulumu, güncellemesi ve bağımlılık çözümlemesini yöneten standart komut satırı paket yöneticisi. |
| **EPEL** | Ek Kurumsal Linux Paketleri | Fedora projesi tarafından sürdürülen ve `fail2ban`, `certbot`, `htop` gibi temel sunucu araçlarını AlmaLinux'a kazandıran resmi ek depo. |
| **SELinux** | Güvenliği Artırılmış Linux | Çekirdek seviyesinde Zorunlu Erişim Kontrolü (MAC) uygulayan güvenlik modülü (Nginx'in yerel portlara proxy yapabilmesi için `httpd_can_network_connect` izni gerektirir). |
| **Boolean (SELinux)** | Dinamik Güvenlik Anahtarı | SELinux politikalarını yeniden derlemeye gerek kalmadan belirli bir servis davranışını açıp kapatan mantıksal ayar anahtarı (`setsebool`). |
| **`systemd`** | Sistem ve Servis Yöneticisi | İşletim sistemi açılışını, arka plan servislerini (`docker`, `nginx`, `tailscaled`, `fail2ban`) ve zamanlanmış görevleri (`timers`) yöneten çekirdek servis yöneticisi. |
| **Cockpit** | Web Tabanlı Sunucu Konsolu | AlmaLinux 9 ile yerleşik gelen; tarayıcı üzerinden sistem kaynaklarını, logları ve servisleri izlemeye yarayan hafif yönetim arayüzü (Port: `9090`). |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

AlmaLinux 9 sunucu hazırlığı, depo kurulumu, servis yönetimi ve SELinux izinleri için en sık kullanılan temel komutlar:

### Sistem Güncelleme ve EPEL Deposu Kurulumu
```bash
# İşletim sistemi sürümünü ve çekirdek bilgisini doğrular
cat /etc/almalinux-release
uname -r

# Tüm sistem paketlerini günceller ve EPEL (Fail2ban/Certbot vb.) deposunu aktif eder
sudo dnf update -y
sudo dnf install -y epel-release
```

### Servis Yönetimi (`systemd`)
```bash
# Bir servisi sistem açılışında otomatik başlayacak şekilde etkinleştirir ve hemen başlatır
sudo systemctl enable --now nginx
sudo systemctl enable --now docker
sudo systemctl enable --now tailscaled

# Servisin çalışma durumunu ve son günlük kayıtlarını kontrol eder
sudo systemctl status firewalld
```

### SELinux ve Nginx Ters Vekil İzni
```bash
# Mevcut SELinux çalışma modunu (Enforcing / Permissive) görüntüler
getenforce

# Nginx'in arka plandaki Docker konteyner portlarına (3000, 4173, 5556, 9001) ağ bağlantısı kurmasına kalıcı izin verir
sudo setsebool -P httpd_can_network_connect 1
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [AlmaLinux Wiki & Documentation](https://almalinux.org)
* **SELinux Yönetim Rehberi:** [Red Hat / Enterprise Linux 9 Using SELinux](https://redhat.com)
