# Proje Geliştirme ve Adlandırma Prensipleri

Bu doküman, projelerimizin sürekliliği, kod düzeni ve yapay zeka ile verimli çalışma süreçlerimiz için temel kuralları içerir. Yeni bir sohbet veya geliştirme döngüsüne başlarken bu dosya referans alınmalıdır.

## 1. Dosya ve Klasör Adlandırma Kuralları
* **React Bileşenleri:** Sadece React bileşen dosyaları (Component, View, Layout vb.) büyük harfle başlar (**PascalCase**). Örnek: `FileTree.tsx`, `ProjectReport.tsx`.
* **React Dışı Dosyalar:** Karışıklığı önlemek ve net bir ayrım sağlamak amacıyla yardımcı fonksiyonlar (utils), tipler (types), konfigürasyonlar ve servisler gibi tüm React dışı dosyalar **küçük harfle** başlar. Örnek: `types.ts`, `fileUtils.ts`, `turbo.json`.

## 2. Mimari ve Altyapı Standartları
* **Proje Yapısı:** SaaS Monorepo mimarisi.
* **Paket Yönetimi:** `pnpm workspaces` ve `Turborepo` görev otomasyonu.
* **Teknoloji Yığını:** Frontend ve backend süreçlerinin tamamında **TypeScript** entegrasyonu.
* **Sunucu ve Dağıtım:** Sunucu tarafında AlmaLinux/Docker altyapısı, ters proxy olarak Nginx konfigürasyonları.

## 3. Yapay Zeka (AI) İş Birliği Modeli
* Yeni bir geliştirme sürecine başlarken bu prensipler dosyası Drive üzerinden yapay zekaya okutulmalıdır.
* Kod üretimleri ve dosya hiyerarşisi önerileri doğrudan buradaki adlandırma kurallarına göre talep edilmelidir.
