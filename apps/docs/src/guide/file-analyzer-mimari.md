# 🚀 Monorepo File Analyzer - Mimari, Algoritma ve Test Dokümantasyonu

Bu doküman, `@repo/file-analyzer` (`apps/file-info`) uygulamasının mimari katmanlarını, reaktif dosya eşleşme algoritmalarını, bileşen hiyerarşisini ve test adımlarını standartlaştırmak üzere oluşturulmuştur.

---

## 📂 1. Proje Yapısı ve Modüler Katmanlar

Uygulama, **Anayasa v3** dosya adlandırma standartlarına (`PascalCase` React bileşenleri, `kebab-case` servis ve yardımcı dosyalar) uygun olarak tamamen izole edilmiştir:

```text
apps/file-info/
├── src/
│   ├── components/                 # Arayüz Katmanı (PascalCase)
│   │   ├── ActionCell.tsx          # 1.5 sn zaman ayarlı, çift aşamalı güvenli silme hücresi
│   │   ├── FileInfoFolderButton.tsx# File System Access API ile tetiklenen lightweight tarama butonu
│   │   ├── FileInfoTreeView.tsx    # Rekürsif ağaç orkestratör bileşeni
│   │   ├── FileInfoTreeNode.tsx    # Saf reaktif ağaç satır bileşeni (Auto-Expand / Süzme)
│   │   └── FileInfoViewerSidebar.tsx # Gruplanmış kural arama ve yönetim paneli
│   ├── context/                    # Durum Yönetimi (kebab-case)
│   │   ├── fi-data-provider.tsx    # Merkezi state, hydration, event-driven & reaktif motor
│   │   └── fi-types.ts             # FileNode ve FileInfo TypeScript interface tanımları
│   ├── utils/                      # Yardımcı Fonksiyonlar (kebab-case)
│   │   ├── file-scanner.ts         # Asenkron showDirectoryPicker disk tarama mantığı
│   │   └── regex-helpers.ts        # Core Expression Parser ve Joker token dönüştürücü
│   ├── main.tsx                    # Giriş noktası
│   └── index.css                   # Tailwind v4 Global CSS @theme & @utility katmanı
├── package.json                    # Workspace konfigürasyonu (@repo/file-analyzer)
└── vite.config.ts                  # Vite derleme yapılandırması
```

---

## ⚙️ 2. Temel Algoritmalar ve İş Akışları

### A. Core Expression Parser Hattı (`regex-helpers.ts`)
Kullanıcı arayüzden joker kural veya saf regex girdiğinde motor veriyi 4 öncelik kademesinde serileştirir:
1.  **Saf Düzenli İfade Tanıma:** Girdi `/^...$/i` kalıbındaysa doğrudan `RegExp` nesnesine derlenir.
2.  **Uzantı Ayıklama (`3-ext`):** `*.ts` veya `.tsx` biçimindeyse uzantı bayrağı işaretlenir.
3.  **Token/Joker Dönüşümü (`2-regExp`):** `*` karakterleri `.*` ifadesine, `yyyy-mm-dd` tarih kalıpları ise `\d{4}-\d{2}-\d{2}` düzenli ifadesine dönüştürülür.
4.  **Tam Eşleşme (`1-regular`):** Düz metin girdileri doğrudan string eşitliğiyle kontrol edilir.

### B. Çift Kanallı Ağaç Filtreleme Motoru (`Event-Driven + Reactive`)

#### 🔄 Kanal 1: İlk Tarama Anı (Event-Driven)
```text
[Klasör Seçimi] ➡️ [lightweight Disk Taraması (rootNode)] ➡️ [applyCurrentPatternsToTree Call]
       |
       v
[patterns.filter(isActive && checked)] ➡️ [autoReevaluateTree] ➡️ [setScannedTree(1 Kez)]
```
*Klasör ilk seçildiğinde gereksiz re-render döngülerini (infinite loop) engellemek için `useEffect` baypas edilir ve `applyCurrentPatternsToTree` fonksiyonu olay güdümlü olarak ağacı tam **1 kez** filtreleyip state'e yazar.*

#### ⚡ Kanal 2: Çalışma Zamanı Kural Seçimi (Reactive Sync)
```text
[Sidebar Checkbox Toggle] ➡️ [setPatterns (Yeni Referans)] ➡️ [Reactive useEffect Trigger]
       |
       v
[autoReevaluateTree (Hafızadaki Ağacı Tarar)] ➡️ [DOM Güncellemesi & Satır Boyama]
```
*Kullanıcı sidebar üzerindeki bir kuralı açıp kapattığında disk yeniden taranmaz. Değişen kural referansı merkezi `useEffect`'i tetikler ve hafızadaki ağaç rekürsif olarak milisaniyeler içinde reaktif süzgeçten geçirilir.*

---

## 🧩 3. Kritik Bileşen Listesi ve Görevleri

| Bileşen Adı | Görevi / Rolü | Performans Kriteri |
| :--- | :--- | :--- |
| `DataProvider` | Merkezi Context Provider'dır. `localStorage` hydration sürecini yönetir, tüm aksiyonları (`add`, `remove`, `toggleActive`) dağıtır. | `useMemo` ve `useCallback` referans koruması ile alt bileşenlerin gereksiz render olmasını %100 engeller. |
| `FileInfoViewerSidebar`| Kuralları türlerine göre gruplar ve filtreler. Arama kutusu girdilerini yönetir. | `RenderSection` ve `PatternRow` alt parçaları `React.memo` ile izole edilmiştir. Arama yaparken liste donmaz. |
| `FileInfoTreeNode` | Ağacın satır elemanıdır. `node.hasFilteredChild` durumuna göre **Auto-Expand** (Otomatik Klasör Açma) lojiğini yürütür. | `showOnlyFiltered` aktifken eşleşmeyen düğümleri `null` dönerek DOM ağacından tamamen temizler. |
| `ActionCell` | Kuralların düzenleme ve silme aksiyonlarının yönetildiği hücredir. | **Self-Dismissing (1.5 sn):** Sil butonuna basıldığında `window.setTimeout` ile geri sayım başlatır, onay gelmezse kendini imha eder. |

---

## 🧪 4. Adım Adım Manuel Test Senaryoları

### Senaryo 1: Kalıcılık ve Hydration Testi
1. Uygulamayı açın ve `*.log` kuralını ekleyin.
2. Kuralın yanındaki checkbox'ı `checked` yapın ve `isActive` durumunu aktifleştirin.
3. Tarayıcıyı yenileyin (F5).
4. **Beklenen Sonuç:** Kuralın listede kaybolmadığını, RegExp nesnesinin (`pipelineInitialize`) başarıyla çözüldüğünü ve checkbox durumunun korunduğunu doğrulayın.

### Senaryo 2: 1.5 Saniyelik Güvenli Silme Testi
1. Kural tablosundan herhangi bir satırdaki Çöp Kutusu (`Trash2`) ikonuna tıklayın.
2. Satırın anında silinmediğini, "Emin misiniz? Evet, Sil | İptal" arayüzünün belirdiğini gözlemleyin.
3. 1.5 saniye boyunca hiçbir yere tıklamadan bekleyin.
4. **Beklenen Sonuç:** Zamanlayıcının (`timerRef.current`) başarıyla tetiklenip onay modunu otomatik kapattığını ve satırın eski güvenli haline döndüğünü doğrulayın. TypeScript konsolunda `Cannot find namespace 'NodeJS'` hatası alınmadığından emin olun.

### Senaryo 3: Auto-Expand ve Süzme Modu Uyum Testi
1. En az 3 kırılımlı derin bir test klasörü seçin (Örn: `src/components/button/tests/button.test.tsx`).
2. Sidebar'dan sadece `*.test.tsx` kuralını aktif ve seçili hale getirin.
3. Dosya ağacındaki tüm klasörlerin kapalı olduğundan emin olun.
4. Butondan klasör taramasını tetikleyin.
5. **Beklenen Sonuç:** Kapalı olan `src`, `components`, `button` ve `tests` klasörlerinin `node.hasFilteredChild` reaktif tetikleyicisi sayesinde otomatik olarak aşağıya doğru açıldığını ve en alttaki test dosyasının mor renkle boyanıp yanına `MATCHED` rozeti aldığını doğrulayın. `showOnlyFiltered` modu açıldığında ilgisiz tüm dosyaların DOM'dan temizlendiğini inceleyin.