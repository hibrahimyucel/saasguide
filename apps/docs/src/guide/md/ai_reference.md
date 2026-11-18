# AI Reference Guide - saasrehberi & saasguide
*Son Güncelleme: 1 Kasım 2026 16:08 (TR)*

## 📑 Proje Genel Durum Matrisi

| Monorepo | Rolü / Amacı | Mevcut Durum | Canlı Yayın / Link |
| :--- | :--- | :--- | :--- |
| **saasguide** | AR-GE, deneme, test ve yeni özellik prototipleri. | Tamamen kararlı, CI/CD sorunları çözüldü. | [hibrahimyucel.github.io/saasguide](https://hibrahimyucel.github.io/saasguide/) |
| **saasrehberi** | Temize çekilmiş, test edilmiş kararlı kodlar ve herkes için başucu rehberi. | Sadece temel edge router (`saas_edge_router`) ayakta. Dokümantasyon projesi henüz eklenmedi. | *Lokal / Geliştirme Aşamasında* |

---

## 🛠️ Aktif Çalışma ve Yol Haritası

### Adım 1: file-analyzer Modülünün Tamamlanması (Şu anki Aşama)
* **İşlem:** `file-analyzer` projesinin dosya yapısı ve uzantı açıklamaları nihai rehber formatına uygun hale getiriliyor.
* **Test:** Bu süreçte tüm yerel sistem uçtan uca test ediliyor.

### Adım 2: saasrehberi Dokümantasyon Altyapısının Kurulması
* `file-analyzer` modülü tamamlandığında, çıkan resmi dosya listesi ve açıklamalar `saasrehberi`'nin ilk dokümantasyon içeriğini oluşturacak.
* `saasrehberi` monoreposu altına VitePress dokümantasyon uygulaması enjekte edilecek.

---

## 📐 Genel Geliştirme ve Proje Prensipleri (v3)

1. **İsimlendirme Kuralları:**
   * React bileşenleri haricindeki tüm yardımcı fonksiyonlar, modüller ve genel kod dosyaları karışıklığı önlemek adına **küçük harfle** (`lowercase`) adlandırılır.
2. **Kod Paylaşımı ve İletişim:**
   * Yapay zekâ, uzun uzadıya açıklamalar yapmak yerine doğrudan refactor edilmiş, temiz ve net kod çıktıları sunacaktır.
3. **Google Drive Entegrasyonu:**
   * Süreç, takip edilebilirlik ve doğrudan analiz için `00_AI_Workspace/01_saasmonorepos` dizini altında **açık klasör yapısı** ile takip edilecektir.

---
*Bu dosya `saasrehberi` projesinin kök dizininde `ai_reference.md` olarak saklanmalı ve her kritik aşamada güncellenmelidir.*
