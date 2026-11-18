---
tarih: 2026-11-01
saat: 02:22
konu: "Proje Çalışma Prensipleri ve Özet Standartları"
baglam: "AI Workspace ve SaaS Monorepo Ortak Çalışma Anayasası"
durum: "Güncellendi (v3)"
etiketler: [prensipler, standartlar, front-matter, refaktor]
---

# 📌 Proje Geliştirme ve İş Birliği Prensipleri (v3)

Bu dosya, yapay zekanın kararları daha rahat düşünebilmesi için bir genel özet kaynağı, daha ayrıntılı çalışılması gereken durumlarda ise doğrudan referans alacağı bir teknik kod ve mimari kılavuzudur.

---

## 1. Dosya Adlandırma Standartları
* **React Bileşenleri:** PascalCase (büyük harfle başlar, örn: `Navbar.tsx`, `UserCard.jsx`).
* **React Dışı Dosyalar:** kebap-case kullanılır

## 2. Kod Üretimi ve Refaktör Kuralları
* **Modüler ve Nokta Atışı Kodlama:** Değişiklik istendiğinde tüm dosyayı baştan yazmak yerine, sadece değişen veya refaktör edilmesi gereken fonksiyonları/bileşenleri küçük parçalar halinde sun.
* **Büyük Dosya Engelleme:** Cevapların kopyalanamayacak veya kafa karıştıracak kadar uzun olmasını önlemek için kodu küçük, anlamlı alt modüllere bölerek aktar.

## 3. İletişim ve Dokümantasyon Standartları (YAML Front Matter)
Geriye dönük takibin hem kullanıcı hem de yapay zeka tarafından kusursuz yapılabilmesi için, üretilen her kritik sohbet özetinin en başına aşağıdaki YAML bloğu standart olarak eklenecektir:

```yaml
---
tarih: YYYY-MM-DD
saat: HH:MM
konu: "Sohbetin Kısa Başlığı"
baglam: "Projenin Hangi Aşamasında/Klasöründe Çalışıldığı"
durum: "Tamamlandı / Devam Ediyor / Hata Çözüldü"
etiketler: [anahtar, kelimeler]
---
```

## 4. Sonraki Adımlar İçin Yol Haritası
* Projelerin fonksiyonel özetlerinin ve kod tanımlamalarının bu yapıya beslenmesi.
* Geliştirilecek spesifik modüllerin, yazılacak entegrasyonların veya çözülecek hataların bu şablon mimarisi üzerinden işlenmesi.
