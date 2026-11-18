# Proje Geliştirme ve Çalışma Prensipleri (v2.0)

Bu doküman, yapay zekâ asistanı ile verimli ve tutarlı bir kodlama/geliştirme süreci sürdürmek için belirlenmiş temel standartları içerir.

## 1. Dosya ve Bileşen Adlandırma Kuralları
* **React Bileşenleri:** PascalCase (örn: `UserPanel.tsx`, `TelemetryChart.tsx`) olarak adlandırılır.
* **React Dışı Yardımcı Dosyalar:** Karışıklığı önlemek ve net bir ayrım sağlamak amacıyla tüm util, types, hooks, services ve konfigürasyon dosyaları her zaman **küçük harfle başlayarak** adlandırılır (örn: `util.ts`, `types.ts`, `api-client.ts`).

## 2. Mimari Tercihler ve Altyapı
* **Monorepo Yapısı:** Proje, root path dizininde (`~/my-saas-monorepo`) `pnpm workspaces` ve `Turborepo` task mimarisiyle yönetilmektedir.
* **Uygulama Düzeni (Apps):**
  * `apps/web`: Vite + TS Frontend Client Panel
  * `apps/api`: Gelişmiş Express Telemetry Microservice
  * `apps/docs`: VitePress Akademik Sözlük ve Kılavuz
* **Paket Düzeni (Packages):**
  * `packages/config`: Paylaşılan TSConfig konfigürasyonları
  * `packages/ui`: Modül tipinde paylaşılan UI kütüphanesi (açık `.js` uzantılı export haritaları ile).

## 3. Kod Üretimi ve Refaktör Standartları
* **Kısa ve Nokta Atışı Kodlama:** Tüm dosyayı baştan yazmak yerine, sadece değişen veya refaktör edilmesi gereken fonksiyonları/bileşenleri küçük parçalar halinde sun. Uzun yanıtlardan kaçın.
* **Modüler Yapı:** Büyük kod bloklarını tek seferde kopyalamak yerine, kodu küçük, anlamlı alt bileşenlere veya fonksiyonlara ayırarak parça parça aktar.

## 4. İletişim ve Süreç Yönetimi
* **Dosya Talepleri:** Sohbet özetleri, kılavuzlar veya konfigürasyonlar talep edilirken "indirilebilir dosya oluştur" veya "generate et" kalıpları kullanılarak sistemin indirme bağlantısı üretmesi sağlanır.
