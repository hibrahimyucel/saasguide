# ⚡ HMR (Hot Module Replacement) Çalışma Mimarisi ve Docker Entegrasyonu

Bu doküman, yerel geliştirme ortamınızda kullandığınız **HMR (Hot Module Replacement)** sisteminin elemanlarını, Docker ile yerel disk arasındaki senkronizasyonu ve WebSocket tabanlı haberleşme mekanizmasını teknik olarak açıklar.

---

## 🏛️ HMR Sisteminin 4 Ana Bileşeni (Elemanları)

Sistem, tarayıcı ile Docker konteyneri arasında kesintisiz ve milisaniyeler içinde haberleşen 4 temel aktörden oluşur:

* **1. HMR Server (Vite Sunucusu):** Docker konteynerinin (`docs-dev`) içinde çalışan sistemin beynidir. Dosya değişikliklerini izler, bağımlılık ağacını yönetir ve güncel kod parçacıklarını hazırlar.
* **2. HMR Client (Tarayıcıdaki Ajan):** VitePress uygulamanız tarayıcıda yüklendiğinde, Vite tarafından kodun en tepesine enjekte edilen görünmez küçük bir JavaScript kütüphanesidir. Görevi, sunucudan gelecek güncelleme emirlerini dinlemektir.
* **3. İletişim Kanalı (WebSocket - WS):** Sunucu ile tarayıcı arasında sürekli açık duran, anlık ve çift yönlü veri akışı sağlayan dijital bir telefon hattıdır.
* **4. Nginx (Ters Vekil / Proxy Sunucu):** Tarayıcı ile Docker iç ağı arasında duran köprüdür. Gelen HTTP ve anlık WebSocket isteklerini doğru konteynere ve porta güvenli bir şekilde paslar.

---

## 🔄 İki Ayrı Dünya: Disk (Host) ve Docker (Guest) Takibi Nasıl Olur?

Bilgisayarınızda iki farklı dosya sistemi bulunur: **Yerel Diskiniz (Host)** ve **Docker Konteynerinin İçindeki İzole Alan (Guest)**. Kodun yazılmasından tarayıcıya yansımasına kadar olan süreç adım adım şu şekilde gerçekleşir:

### ⚙️ Adım Adım Çalışma Döngüsü

#### 1. Diskin Docker ile Konuşması (Volume Mount & Polling)
Docker Compose dosyasında tanımladığımız `- .:/app` satırı, yerel diskiniz ile Docker konteyneri arasında anlık bir **ayna bağlantısı (Volume)** oluşturur.
* Ortada fiziksel bir kopyalama yoktur. Docker doğrudan yerel klasörünüze bir erişim noktası açar.
* Editörde (örn: VS Code) bir markdown dosyasını değiştirip kaydettiğiniz an işletim sisteminiz bir dosya değişim sinyali üretir.
* `WATCHPACK_POLLING=true` ortam değişkeni sayesinde Docker, yerel diskin ürettiği bu sinyali yakalar ve konteyner içindeki `Vite` (HMR Server) sunucusuna dosyanın güncellendiğini bildirir.

#### 2. Konteyner İçi İşleme (Module Graph Analizi)
Docker içindeki Vite, tüm projeyi baştan derlemek yerine sadece değişen dosyanın projedeki bağımlılık ağacını (**Module Graph**) inceler:
* Sadece değişen dosyanın (örn: `index.md`) yeni JavaScript/HTML çıktısını milisaniyeler içinde doğrudan bellek (RAM) üzerinde hazırlar. Diske yazma maliyetinden kaçınır.

#### 3. Sinyalin Dışarı Aktarılması (Nginx & WebSocket Köprüsü)
Vite, hazırladığı güncellemeyi tarayıcıya ulaştırmak için açık olan WebSocket hattından sinyal gönderir.
* Bu sinyal Docker dahili ağından çıkarken **Nginx** konteynerine çarpar.
* Nginx konfigürasyonundaki `Upgrade $http_upgrade` ve `Connection "Upgrade"` kuralları sayesinde bu ham WebSocket sinyali bozulmadan bilgisayarınızın fiziksel **80 portuna** fırlatılır.

#### 4. Tarayıcının Kodu Canlı Değiştirmesi (Injection)
Tarayıcıda açık olan **HMR Client (Ajan)**, 80 portu üzerinden gelen bu anlık sinyali yakalar:
* Sayfayı tamamen yenilemeden (F5 yapmadan), arka planda sadece değişen yeni kod modülünü indirir.
* JavaScript'in dinamik yapısını (`import.meta.hot`) kullanarak eski kod bloğunu tarayıcı belleğinden siler ve yerine yenisini yerleştirir.

---

## 🧠 Görsel İletişim Zinciri

```text
+--------------------------------------------------+

|               YEREL DİSK (HOST)                  |
|          [VS Code: index.md -> Kaydet]           |
+------------------------┬-------------------------+
                         │ (Volume Mount / Polling)
                         ▼
+--------------------------------------------------+

|           DOCKER KONTEYNERİ (GUEST)              |
|  [Vite Dev Server: Değişimi Algılar & RAM'de Derler] |
+------------------------┬-------------------------+
                         │ (WebSocket Sinyali)
                         ▼
+--------------------------------------------------+

|             DOCKER İÇİ NGINX PROXY               |
|      [WS/HTTP Protokol Dönüşümü & Port 80]       |
+------------------------┬-------------------------+
                         │ (Fiziksel Ağ Sunumu)
                         ▼
+--------------------------------------------------+

|                 TARAYICI (CLIENT)                |
|  [HMR Ajanı: Sayfa Yenilenmeden Kodu Canlı Enjekte Eder]|
+--------------------------------------------------+
```

---

## ⚠️ Docker Arkasında HMR Neden Kırılır? (Kritik Ayarların Sebebi)

Eğer VitePress yapılandırmasındaki `clientPort: 80` ve Nginx'teki `Upgrade` başlıkları (headers) tanımlanmazsa HMR zinciri kopar. 

1. **Nginx Ayarı Eksikse:** Nginx gelen WebSocket el sıkışma isteğini normal HTTP isteği sanır ve bağlantıyı sonlandırır. Tarayıcı sunucudan gelen "dosya değişti" sinyalini alamaz.
2. **VitePress `clientPort` Ayarı Eksikse:** VitePress varsayılan olarak tarayıcıyı kendi çalıştığı iç porta (`5173`) yönlendirmeye çalışır. Ancak dışarıda 5173 portu açık olmadığı için (her şey Nginx 80 üzerinden geçtiği için) tarayıcı sunucuya bağlanamaz ve HMR çökerek tam sayfa yenilemeye (Full Reload) zorlar.

