# Sistem Otomasyonu ve Zamanlanmış Görevler (`crontab`)

Sunucu üzerindeki bakım, yedekleme ve sertifika yenileme gibi periyodik işlemlerin insan müdahalesi olmadan çalışması için Linux `cron` servisi kullanılır.

## 1. `root` ve Standart Kullanıcı (`pr2admin`) Farkı

* **`sudo crontab -e` (`root`):** Sistem düzeyindeki servislere, `600` izinli SSL özel anahtarlarına (`privkey.pem`), Docker volume dizinlerine (`2000:2000`, `999:999`) ve `/root/.config/rclone/rclone.conf` dosyasına erişmesi gereken görevler **mutlaka `root` crontab'ında** tanımlanmalıdır.
* **`crontab -e` (`pr2admin`):** Yalnızca kullanıcının kendi ev dizinindeki (`/home/pr2admin`) betikler veya genel sorgular için kullanılır.

---

## 2. Zamanlama Sözdizimi (Cron İfadesi)

Her bir satır **5 zaman alanı** ve ardından **çalıştırılacak komuttan** oluşur:

```text
┌───────────── Dakika (0 - 59)
│ ┌───────────── Saat (0 - 23)
│ │ ┌───────────── Ayın Günü (1 - 31)
│ │ │ ┌───────────── Ay (1 - 12)
│ │ │ │ ┌───────────── Haftanın Günü (0 - 6, Pazar = 0 veya 7)
│ │ │ │ │
* * * * * /çalıştırılacak/komut.sh
```

### Sık Kullanılan Zamanlama Örnekleri

| İfade | Açıklama |
| :--- | :--- |
| `30 3 * * *` | Her gece saat **03:30**'da çalışır |
| `0 */6 * * *` | Her **6 saatte** bir (00:00, 06:00, 12:00, 18:00) çalışır |
| `0 4 * * 0` | Her **Pazar** günü saat **04:00**'te çalışır |
| `*/15 * * * *` | Her **15 dakikada** bir çalışır |
| `@reboot` | Sunucu her yeniden başlatıldığında (**boot**) bir kez çalışır |

---

## 3. Temel Yönetim Komutları

```bash
# root kullanıcısının zamanlanmış görevlerini listeleme
sudo crontab -l

# root kullanıcısının zamanlanmış görevlerini düzenleme (varsayılan editör ile)
sudo crontab -e

# İnteraktif editör açmadan doğrudan yeni görev ekleme (güvenli yöntem)
(sudo crontab -l 2>/dev/null | grep -v "gorev-adi.sh"; echo "30 3 * * * /opt/pr2cloud/prod/scripts/gorev-adi.sh >> /var/log/gorev-adi.log 2>&1") | sudo crontab -

# crond servisinin aktif olduğunu doğrulama (AlmaLinux / RHEL)
sudo systemctl status crond
```

---

## 4. Üretim (`prod`) Ortamı İçin Kritik Kurallar

1. **Tam Dosya Yolu (`PATH`) Kullanın:** `cron` ortamı minimal bir `PATH` değişkeni ile çalışır. Betik ve komut yollarını her zaman tam yazın (ör. `/opt/pr2cloud/prod/scripts/backup-pr2cloud.sh`) veya betik başına `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin` ekleyin.
2. **Çıktıları Günlüğe (`log`) Yönlendirin:** Hata ayıklamayı kolaylaştırmak için standart çıktı ve hata çıktılarını mutlaka bir log dosyasına yönlendirin (`>> /var/log/islem.log 2>&1`).
3. **Çalıştırma İzni (`chmod`):** Zamanlanan her `.sh` betiğinin çalıştırılabilir (`chmod 750` veya `chmod +x`) olduğundan emin olun.
4. **Log Dosyalarının Şişmesini Önleme (`logrotate`):** Sürekli büyüyen `/var/log/pr2cloud-*.log` dosyalarını haftalık döndürmek için `/etc/logrotate.d/pr2cloud` kuralı tanımlayın:

```bash
sudo tee /etc/logrotate.d/pr2cloud > /dev/null << 'EOF'
/var/log/pr2cloud-*.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
EOF
```

---

## 5. Sunucudaki Aktif Görevler ve Log Takibi

```bash
# Tanımlı tüm root cron görevlerini kontrol etme
sudo crontab -l

# Yedekleme loglarını canlı veya son satırlarıyla izleme
sudo tail -n 50 /var/log/pr2cloud-backup.log

# Sistem cron çalışma geçmişini (tetiklenme kayıtlarını) denetleme
sudo grep CRON /var/log/cron | tail -n 20
```
