# Production Deployment Mimarisi: İmaj Tabanlı Dağıtım Rehberi

Bu rehber; canlı ortamlarda (Production) neden kaynak kod derlemek yerine **Docker İmajı (Paket)** kullanılması gerektiğini açıklar. Ayrıca, sabit bir imaj içerisindeki uygulamanın `.env` (çevre değişkenleri) ve `Volume` (kalıcı veri) yönetimini uygulamalı olarak gösterir.

---

## 📊 Mimarilerin Genişletilmiş Karşılaştırması

| Kriter | 📦 Yöntem 1: İmajı Paketleyip Göndermek (Artifact-based) | 🖥️ Yöntem 2: Kodları Git ile Sunucuya Atıp Derlemek (Source-based) |
| :--- | :--- | :--- |
| **VPS Kaynak Tüketimi** | **Sıfır ek yük.** Sunucu sadece hazır paketi çalıştırır. CPU ve RAM stabil kalır. | **Çok yüksek.** Derleme (build/npm install) esnasında CPU %100 olur, kısıtlı VPS'ler kilitlenebilir. |
| **Güvenlik (Atak Yüzeyi)** | **Çok Yüksek.** VPS üzerinde ham kodlar, API anahtarları veya `.git` geçmişi bulunmaz. | **Düşük.** Sunucuda kaynak kodları, ssh yetkileri ve derleme araçları açıkta durur. |
| **Çevresel Kararlılık** | **Garantili.** Yerelde test edilen kütüphane ve OS sürümü neyse, canlıda çalışan da odur. | **Riskli.** Sunucunun veya o gün internetten çekilen bağımlılıkların sürüm farkları çökmelere yol açabilir. |
| **Hata Anında Geri Dönüş** | **Anlıktır (Rollback).** Tek komutla bir önceki kararlı imaj etiketine (`v1`) saniyeler içinde dönülür. | **Zordur.** Git geçmişinde geriye gitmek, `node_modules` silip sunucuda yeniden derlemek gerekir. |
| **Konfigürasyon Yönetimi** | **Dinamik.** `.env` dosyası sunucuda değiştirilip konteyner saniyeler içinde güncellenir. | **Statik/Manuel.** Kodun içine gömülü ayarlar varsa yeniden derleme (rebuild) tetiklenmesi gerekir. |

---

## 🛠️ Dinamik Production Yapılandırması: `.env` ve `Volume` Yönetimi

İmaj tabanlı mimaride altın kural: **Docker imajı tamamen şifresiz, yalın ve sabittir.** Veritabanı şifreleri, API anahtarları (`.env`) veya yüklenen kullanıcı resimleri (`Volumes`) imajın içine **asla gömülmez**, dışarıdan bağlanır.

### Klasör Yapısı (Production VPS Sunucusu)
Sunucunuzda kaynak kodları yer almaz. Sadece ayağa kaldırma komutları ve dışarıdan beslenecek veriler bulunur:
```text
/home/user/app/
├── docker-compose.yml
├── .env                  # Sunucuya özel gizli şifreler ve ayarlar
└── data/                 # Konteyner içindeki verilerin VPS diskine yazılacağı yer (Kalıcı Klasör)
```

### 1. `.env` (Çevre Değişkenleri) ile Dinamik Ayarlar
Konteyner içindeki uygulamanın (örn: Node.js, Python, Go) veritabanına bağlanabilmesi için sunucudaki `.env` dosyasını okumasını sağlarız.

**VPS üzerindeki `.env` içeriği:**
```text
PORT=3000
DB_HOST=veritabanı_konteyner_adi
DB_PASS=SüperGizliProductionŞifresi123!
API_KEY=live_abcdef123456789
```

### 2. `Volumes` (Birimler) ile Kalıcı Veri Yönetimi
Docker konteynerleri doğası gereği geçicidir (ephemeral). Konteyner kapatılıp silindiğinde içindeki tüm veriler uçar. Kullanıcıların yüklediği resimleri, logları veya veritabanı dosyalarını VPS diski üzerinde kalıcı hale getirmek için `volume` bağlarız.

---

### 🚀 Uygulamalı Production `docker-compose.yml` Şablonu

Aşağıdaki dosya, yerelde ürettiğiniz sabit `yerel-uygulamam:v1` imajını sunucuda çalıştırırken, `.env` ve `volume` yapılandırmasını nasıl bağlayacağınızı gösterir:

```yaml
version: '3.8'

services:
  my_backend_app:
    # 1. Sabit, derlenmiş prodüksiyon imajımız
    image: yerel-uygulamam:v1
    container_name: production_backend
    
    # 2. ÇEVRE DEĞİŞKENLERİ: Sunucudaki gizli .env dosyasını konteyner içine enjekte eder.
    # Konteyner içindeki kodlar 'process.env.DB_PASS' diyerek bu verilere erişir.
    env_file:
      - .env
    
    # 3. KALICI VERİ BAĞLANTISI (VOLUME):
    # Sol taraf: VPS ana makinesindeki fiziksel klasör yolu
    # Sağ taraf: Konteyner içindeki uygulamanın veri yazdığı klasör yolu
    volumes:
      - ./data/uploads:/usr/src/app/uploads # Kullanıcı resimleri VPS diskine yazılır
      - ./data/logs:/usr/src/app/logs       # Uygulama logları kalıcı olarak VPS'e akar
      
    expose:
      - "3000"
    networks:
      - default
    # Sunucu çöker veya Docker yeniden başlarsa konteyneri otomatik ayağa kaldırır
    restart: always 

networks:
  default:
    name: ortak_ag
    external: true
```

---

## 💡 Akış Özeti (Mental Model)

1. Geliştirici bilgisayarında kodu yazar, test eder ve **sabit bir paket (İmaj)** oluşturur.
2. Bu imaj sunucuya aktarılır. İmajın içinde veritabanı şifresi veya kullanıcı dosyası yoktur.
3. Sunucuya özel olan şifreler sunucudaki `.env` dosyasında durur.
4. Uygulama çalıştığı sürece ürettiği kalıcı verileri `volume` tüneli üzerinden sunucunun diskindeki `data/` klasörüne yazar.
5. Konteyner çökse veya silinse bile, yeni bir konteyner ayağa kalktığında `.env` ve `data/` klasörüne kaldığı yerden bağlanarak **sıfır veri kaybı** ile çalışmaya devam eder.

