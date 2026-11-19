---
tarih: 2026-11-11
saat: 02:58
konu: "SaaS Ar-Ge Multimedya Odası & YouTube İndirme Modülü"
baglam: "apps/yt-client, apps/yt-server / Docker Konteynerizasyon & SRP Mimarisi"
durum: "Tamamlandı"
etiketler: [vitepress, ar-ge, yt-dlp, ffmpeg, react-srp, docker, tailwind-v4, localstorage]
---

# 🎬 SaaS Ar-Ge Multimedya Odası & Medya İşleme Modülü

Bu doküman; YouTube videolarını yerel diske indiren, ses ve video akışlarını birbirinden ayıran (`yt-dlp` + `ffmpeg`), çalma listelerini tarayıcı belleğinde (`localStorage`) yöneten ve **Docker** üzerinde izole çalışan multimedya modülünün mimari standartlarını belgeler.

---

## 1. Mimari Genel Bakış ve Klasör Yapısı

Proje, **Anayasa v3/v4** kurallarına tam uyumlu olarak React bileşenleri için **PascalCase**, sunucu servisleri ve yardımcı araçlar için **kebab-case** standartlarıyla monorepo yapısında kurgulanmıştır.

```text
saasguide/
├── apps/
│   ├── yt-server/                  # Node.js & Express Medya İşleme API (Port: 3000)
│   │   ├── public/                 # Docker Volume ile bağlanan kalıcı medya deposu
│   │   │   ├── videos/             # Birleştirilmiş yüksek kaliteli MP4 dosyaları
│   │   │   └── audio/              # Ayıklanmış bağımsız MP3 ses dosyaları
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   └── youtube-downloader.ts  # yt-dlp ve ffmpeg motor yönetimi
│   │   │   └── index.ts            # CORS ve Statik Dosya Sunucu yapılandırması
│   │   └── Dockerfile              # Alpine Linux + Python3 + yt-dlp + ffmpeg
│   │
│   └── yt-client/                  # React + Vite + Tailwind v4 Arayüzü (Port: 8080)
│       ├── src/
│       │   ├── components/
│       │   │   ├── PlaylistCreator.tsx    # Yeni liste oluşturma formu
│       │   │   ├── PlaylistSidebar.tsx    # Açılır kutu (Dropdown) liste seçici
│       │   │   ├── TrackList.tsx          # Aktif listenin parça listesi ve silme
│       │   │   ├── VideoDownloader.tsx    # Backend API istek arayüzü
│       │   │   └── VideoPlayer.tsx        # Video/Ses mod geçişli akıllı oynatıcı
│       │   ├── hooks/
│       │   │   └── use-local-storage.ts   # İzole istemci veri kalıcılığı
│       │   └── App.tsx                    # Orkestrasyon ve Responsive Sidebar
│       ├── nginx.conf              # Production SPA yönlendirme ayarları
│       └── Dockerfile              # Multi-stage Vite Build + Nginx Alpine
│
├── .dockerignore
└── docker-compose.yml              # Çoklu konteyner orkestrasyonu
```

---

## 2. Teknik Çözümler ve Mühendislik Kararları

### A. URL Temizleme ve Güvenli Komut İşleme (`youtube-downloader.ts`)
YouTube bağlantılarındaki `&list=`, `&index=` gibi oynatma listesi parametrelerinin `yt-dlp` tarafında tüm listeyi indirmeye çalışmasını önlemek için yerleşik Node.js `URL` nesnesi kullanılmıştır.
* Gelen bağlantıdan yalnızca **11 karakterlik saf Video ID** ayıklanır.
* Shell enjeksiyonu ve template literal kaçış hatalarını önlemek için komut dizgileri açık birleştirme (concatenation) ile güvenli hale getirilmiştir.
* **Çift Çıktı Hattı:** Tek bir istekte hem görüntü+ses birleşik `.mp4` hem de `ffmpeg` ile dönüştürülmüş saf `.mp3` dosyası üretilir.

### B. Tek Sorumluluk İlkesi (SRP) ve Responsive Arayüz (`yt-client`)
Arayüz bileşenleri bakım kolaylığı ve çalışma zamanı (runtime) performansı için modüler parçalara ayrılmıştır:
* **Açılır/Kapanır Birleşik Sidebar:** Liste oluşturma, oynatma listesi seçimi (Dropdown) ve şarkı listesi tek bir sol çekmecede toplanmıştır. Geniş ekranlarda gizlenerek oynatıcıya tam alan bırakır; dar ekranlarda ise oynatıcının üzerine (`fixed overlay`) açılır.
* **Hibrit Medya Oynatıcı (`VideoPlayer.tsx`):**
  * **Çift Mod:** Kullanıcı tek tıkla **🎬 Video** ve **🎵 Ses** modları arasında geçiş yapabilir.
  * **Sıralı Otomatik Oynatma:** `<video>` ve `<audio>` etiketlerindeki `onEnded` tetikleyicisi ile parça bittiğinde listedeki bir sonraki şarkıya otomatik geçilir.
  * **Yerel Dosya Desteği (`Blob URL`):** Sidebar en altındaki dosya seçici ile bilgisayardaki yerel medya dosyaları sunucuya yüklenmeden doğrudan tarayıcı belleğinden (`URL.createObjectURL`) oynatılabilir.

---

## 3. Docker Kurulumu ve Çalıştırma

Uygulama, sistem bağımlılıklarından (Python, `yt-dlp`, `ffmpeg`) izole edilmiş şekilde Docker Compose ile tek komutta ayağa kaldırılır.

### Önemli Altyapı Notları
1. **Alpine Linux `yt-dlp` Kurulumu:** Derlenmiş binary dosyalarının `musl` uyumsuzluğu yaratmaması için `yt-dlp` konteyner içine doğrudan `pip3 install --break-system-packages -U yt-dlp` komutuyla saf Python paketi olarak kurulmuştur.
2. **Kalıcı Veri (Volumes):** `./apps/yt-server/public` klasörleri konteynere bağlanarak konteyner silinse dahi indirilen medya dosyalarının yerel diskte kalması sağlanmıştır.
3. **CORS Politikası:** Backend sunucusu hem yerel Vite geliştirme portuna (`5173`) hem de Docker Nginx yayın portuna (`8080`) izin verecek şekilde yapılandırılmıştır.

### Çalıştırma Komutları

```bash
# İmajları derle ve konteynerleri arka planda başlat
docker compose up -d --build

# Backend konteynerindeki yt-dlp sürümünü doğrula
docker exec saasguide-yt-server yt-dlp --version
```

* **Kullanıcı Arayüzü:** `http://localhost:8080`
* **API Sunucusu:** `http://localhost:3000`

