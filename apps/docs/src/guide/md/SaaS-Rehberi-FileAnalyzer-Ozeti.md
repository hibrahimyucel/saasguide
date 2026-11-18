# SaaS Rehberi - File Analyzer Modülü Sistem Özeti

Bu doküman, **Anayasa v3** temiz kod kuralları, **Tailwind v4** global tema yapısı ve **React (TypeScript)** mimari standartlarına tam uyumlu olarak geliştirilen **File Analyzer** modülünün proje yapısını ve işlevsel çalışma prensiplerini özetler.

---

## 🛠️ 1. Proje Klasör Yapısı (Architecture Layout)

Modüle ait dosyalar ve projedeki konumları, sorumlulukların ayrılması (**Single Responsibility Principle**) prensibine göre aşağıda hiyerarşik olarak listelenmiştir:

```text
src/
├── components/
│   └── edit-cell.tsx           # Hücre içi düzenleme (EditableCell) ve aksiyon (ActionCell) bileşenleri
├── modules/
│   └── file-analyzer/
│       ├── file-info-types.ts        # FileInfo (Kural) ve FileNode (Dosya Ağacı) tip tanımlamaları
│       ├── file-info.ts              # Uygulamanın temelini oluşturan statik 'initialSchema' verisi
│       ├── file-info-dataprovider.tsx # Bellekte kalıcı PatternProvider, asenkron Girdi/Çıktı (JSON Import/Export) ve Reaktif Filtreleme Hattı
│       ├── PatternSidebar.tsx        # Şema kurallarını gruplayan (Regular, Regex, Ext), arayan ve aktif/pasif (checked) yapan sol panel
│       ├── UniversalFileScanner.tsx  # Senkron binding korumalı Sürükle-Bırak (Drag&Drop) ve webkitdirectory asenkron tarayıcı motoru
│       ├── FileTreeView.tsx          # 'filtered' düğümleriindigo dikey çizgi ve 'Matched' etiketiyle vurgulayan rekürsif ağaç grafik alanı
│       └── FileAnalyzerDashboard.tsx # Sidebar, Scanner ve TreeView katmanlarını yan yana birleştiren esnek Dashboard düzeni
└── App.tsx                           # PatternProvider sarmallaması ile uygulamanın kök düğümü
```

---

## ⚙️ 2. Katmanlar ve İşlevsel Özellikleri

### A. Tip Güvenliği (`file-info-types.ts`)
* **`FileInfo`**: Kuralların veri sözleşmesidir. `kind` alanı projenizin orijinal `"1-regular" | "2-regExp" | "3-ext"` union tipine tam sadık kalır. `regExp` ise derlenmiş JavaScript regex nesnesini runtime için saklar.
* **`FileNode`**: Diskten okunan hiyerarşik ağaç modelidir. `filtered: boolean` bayrağı, kullanıcının seçtiği kurallarla anlık eşleşen dosya/klasörleri işaretler.

### B. Akıllı Hafıza ve Gelişmiş Regex Motoru (`file-info-dataprovider.tsx`)
* **Lazy Initialization**: `initialSchema` ilk yüklemede (mount) yalnızca **1 kez** hidrasyondan geçirilir ve deterministik (`kind` -> `expression`) olarak sıralanır.
* **Akıllı RegExp Parser**: İfade içinde `/desen/` sarmallayıcısı olmasa bile, tarih formatlarını (`yyyy`, `mm`, `dd`) ve joker karakterleri (`*`, `?`) otomatik olarak algılayıp güvenli `RegExp` nesnelerine (`pre-compiled`) dönüştürür. Bu sayede dosya tarama anında sıfır CPU maliyeti oluşturur.
* **JSON Taşınabilirliği (I/O Optimizasyonu)**: JSON Export ve Import sırasında runtime nesnesi olan `regExp` verileri temizlenerek saf düz metin (plain-text) olarak işlenir; böylece dosya boyutu optimize edilir ve harici sistemlerle tam uyumluluk sağlanır.

### C. Evrensel Asenkron Tarayıcı (`UniversalFileScanner.tsx`)
* **Dondurmayan Altyapı**: Modern tarayıcıların asenkron `FileSystemDirectoryReader` ve `webkitGetAsEntry` API'leri entegre edilmiştir. Binlerce dosyadan oluşan devasa klasörler tarayıcı arayüzünü dondurmadan arka planda rekürsif olarak haritalanır.
* **Senkron Döngü Güvenliği**: Sürükle-bırak tamponundaki verilerin asenkron işlem adımlarında tarayıcı motoru tarafından temizlenmesini (garbage-collect) engellemek amacıyla, girdi referansları ilk kullanıcı etkileşim çerçevesinde (top-level tick) **senkron olarak** kilitlenir.

### D. Reaktif Re-Filtering Hattı & Görselleştirme
* **Sıfır Yeniden Tarama Maliyeti**: Kullanıcı sidebar veya tablolar üzerinden bir kuralın seçimini (`checked`) değiştirdiğinde, sistem diski **asla yeniden okumaz**. `PatternProvider` içerisindeki `useEffect` side-effect kancası, yereldeki hafıza ağacını (`scannedTree`) rekürsif olarak gezerek saniyede milyonlarca düğümün `filtered` bayrağını mikrosaniyeler içinde günceller.
* **Vurgulu Listeleme (`FileTreeView.tsx`)**: Eşleşen öğeler sol tarafında indigo dikey sınır çizgisi, soluk mor arka plan ve `Matched` rozetiyle parlar. "Sadece Eşleşenleri Süz" butonuyla ağaç anında daraltılabilir.

---

## 💎 Mimari Kazançlar ve Avantajlar

1. **Yüksek Performans**: Regex'ler tarama anında değil, sisteme giriş anında bir kez derlendiği için dosya tarama motoru sadece `pattern.regExp.test(name)` performansıyla koşar.
2. **Kalıcı Durum (Context Retention)**: Sekmeler arası geçişlerde veya kural düzenleme ekranlarına gidildiğinde taranan klasör ağacı ve görünüm durumu bellekten çıkmaz; kullanıcı geri döndüğünde kaldığı yerden devam eder.
3. **Temiz Kod Standartları**: İş mantığı tamamen Context katmanına kaydırılarak UI bileşenlerinin (Dashboard ve Manager) dosya satır sayıları radikal biçimde azaltılmış ve sürdürülebilirlik maksimize edilmiştir.