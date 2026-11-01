İşte yerel geliştirme ortamından canlı sunucuya (VPS) kadar olan tüm teknik sürecini, kod blokları ve teorik açıklamalar olmadan, sadece işlem sırasına göre listeleyen ve geliştirme yaparken kontrol listesi (checklist) olarak kullanabileceğin sadeleştirilmiş kılavuz:

📋 Docker & Nginx Orkestrasyon Hızlı Başvuru Listesi


🛠️ Aşama 1: Yerel Ortam (Localhost) Hazırlığı

• mkcert aracını yerel bilgisayara yükle.
• Yerel Kök Sertifika Otoritesini (mkcert -install) bilgisayara tanıt.
• *.localhost ve localhost domainleri için SSL sertifikalarını (.crt ve .key) üret.
• Terminalden projelerin ortak kullanacağı harici Docker ağını (docker network create ortak_ag) oluştur.

📦 Aşama 2: Yerel İmaj Oluşturma ve Paketleme

• Statik veya dinamik uygulamanın kök dizinine Dockerfile dosyasını yaz.
• Uygulama kodlarını ve bağımlılıklarını yerel diskte imaj olarak inşa et (docker build).
• Üretilen Docker imajını internete yüklemeden taşınabilir arşiv dosyasına (docker save -o ... .tar) dönüştür.

⚙️ Aşama 3: Nginx & Docker Compose Entegrasyonu

• Proje klasörlerinde docker-compose.yml dosyalarını oluştur.
• Her compose dosyasının altına ortak harici ağı (external: true) tanımla.
• Nginx nginx.conf dosyası içine Docker dahili DNS adresini (resolver 127.0.0.11) ekle.
• Subdomain yönlendirmeleri için http bloğu içinde kesintisiz map tablosunu kurgula.
• Nginx proxy sunucusuna mkcert sertifika yollarını ve HTTPS portlarını bağla.

🌐 Aşama 4: Canlı Ortam (VPS) Sıkılaştırma ve Deployment

• VPS sağlayıcısının bulut panelinden (Firewall) sadece HTTP (80), HTTPS (443) ve Mail portlarını dışarıya aç.
• Güvenlik için varsayılan SSH portunu (22) host firmasının yönlendirdiği özel port ile değiştir.
• Sunucuya şifreyle girişi tamamen kapatıp, sadece kendi bilgisayarının SSH Key anahtarını yetkilendir.
• Kötü niyetli port taramaları ve brute-force saldırılarını engellemek için sunucuya Fail2Ban kur.
• Gizli şifreler ve API anahtarları için sunucu dizininde .env dosyasını oluştur.
• Kullanıcı yüklemeleri ve loglar için VPS üzerinde kalıcı klasörler açıp volumes olarak compose dosyasına bağla.
• Yerelde ürettiğin .tar imaj paketini sunucuya transfer et ve Docker motoruna yükle (docker load).
• Sunucuda docker compose up -d komutu ile konteynerleri yayına al.

🧹 Aşama 5: Sistem Bakımı ve Temizlik

• Konteynerlerin disk alanını şişirmemesi için compose dosyasında log-rotation sınırlarını belirle.
• Sunucuda biriken eski imaj ve sistem artıklarını temizlemek için docker system prune komutunu çalıştır.
• Disk doluluğu nedeniyle sunucunun kilitlenmesini önlemek amacıyla haftalık otomatik temizlik için CronJob görevi tanımla.

