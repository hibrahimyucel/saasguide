# Docker Disk Yönetimi

## 🧹 Docker Disk Yönetimi ve `docker prune` Mekanizması

Docker imaj tabanlı deployment mimarisinde, her yeni sürüm ayağa kalktığında eski imajlar diskinizde **"dangling" (bağlantısız/isimsiz)** hale gelir ve VPS diskinizi hızla doldurabilir. Sunucunun disk doluluğu nedeniyle kilitlenmesini engellemek için düzenli temizlik yapılmalıdır.

---

### ⚠️ Kritik Uyarı: Prune Komutu Neleri Siler, Neleri Silmez?

`docker system prune` komutunu çalıştırdığınızda Docker şu elementleri **kalıcı olarak siler**:
* 🛑 Durdurulmuş (çalışmayan) tüm konteynerler.
* 🏷️ En az bir konteyner tarafından kullanılmayan tüm ağlar (networks).
* 👻 İsmi ve etiketi olmayan tüm bağlantısız imajlar (`<none>:<none>` / dangling images).
* cache Derleme esnasında oluşan tüm önbellek (build cache) verileri.

❌ **Neleri SİLMEZ (Güvenlik Koruması):**
* 💾 **Hacimler (Volumes):** Docker, kullanıcı verilerinizin veya veritabanınızın silinme riskine karşı **hacimleri (volumes) varsayılan olarak asla silmez**.

---

### 🛠️ Production ve Local Temizlik Komutları Kılavuzu

#### 1. Güvenli Temizlik (Varsayılan Komut)
Sadece çalışmayan sistem artıklarını temizler. Çalışan uygulamalarınıza asla dokunmaz:
```bash
docker system prune
```
*Komutu çalıştırdığınızda sizden onay (`y/N`) isteyecektir.*

#### 2. Tamamen Otomatik Temizlik (CI/CD ve CronJobs İçin)
Sunucuda bir otomasyon veya betik (script) çalıştırıyorsanız, onay mekanizmasını geçmek için `-f` (force) parametresini ekleyebilirsiniz:
```bash
docker system prune -f
```

#### 3. Agresif Temizlik (Tüm Kullanılmayan İmajları Silme)
Varsayılan prune komutu sadece ismi `<none>` olan imajları siler. Eğer sistemde duran ama hiçbir konteyner tarafından **aktif olarak çalıştırılmayan tüm eski imaj sürümlerini** (örn: `yerel-uygulamam:v1` kalırken yenisi gelmişse eskileri) de silmek istiyorsanız `-a` (all) parametresini eklemelisiniz:
```bash
docker system prune -a -f
```
*(Özellikle kısıtlı diske sahip VPS sunucularında haftalık olarak bu komutun çalıştırılması önerilir).*

#### 4. Tehlikeli Bölge: Kalıcı Verileri (Volumes) Silmek
Eğer test ortamını tamamen sıfırlamak istiyor ve **volumes içindeki tüm veritabanı/kullanıcı dosyalarını da yok etmek** istiyorsanız (Production ortamında kesinlikle uzak durulmalıdır!):
```bash
docker system prune --volumes -f
```

---

### 💡 Production Altın Kuralı: CronJob ile Otomasyon

Canlı sunucunuzun (VPS) diskinin gece yarısı aniden dolup sitenizin çökmesini engellemek için Linux tabanlı `cron` mekanizmasını kullanarak her Pazar gecesi otomatik temizlik ayarlayabilirsiniz:

1. Sunucu terminalinde crontab editörünü açın: `crontab -e`
2. En alt satıra şu görevi ekleyin:

   ```text
   0 3 * * 0 docker system prune -a -f >> /home/user/app/data/logs/docker_prune.log 2>&1
   ```

*Bu komut, her Pazar saat 03:00'te tüm kullanılmayan imaj ve önbelleği sunucuyu yormadan temizler ve log dosyanıza raporlar.*



