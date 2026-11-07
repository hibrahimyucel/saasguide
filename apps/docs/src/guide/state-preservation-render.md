# State Korumalı Koşullu Render ve Görünüm Yönetimi

Bu rehber, projemizin **Anayasa v4** standartları çerçevesinde, üst bar (`AppHeader`) üzerinden tetiklenen görünüm değişikliklerinde, alt panellerin durum (state) ve form verilerinin kaybolmasını engelleyen hafıza korumalı mimari yaklaşımını belgeler.

---

## 1. Problem Tanımı ve Mimari Karşılaştırma

Klasik React uygulamalarında sekmeli veya çoklu görünüm yönetimleri genellikle mantıksal kısa devre (`{activeView === 'editor' && <PatternForm />}`) operatörleri ile kurgulanır. 

Bu durum büyük ölçekli SaaS panellerinde iki kritik yapısal soruna yol açar:
1. **Veri ve Durum Kaybı (Unmount):** Bileşen DOM'dan tamamen söküldüğü için (`componentWillUnmount`), kullanıcının form elemanlarına yazdığı taslak girdiler, filtre seçimleri ve scroll (kaydırma) pozisyonları sekmeler arası geçişte tamamen sıfırlanır.
2. **Çalışma Zamanı Yükü (Mount Maliyeti):** Kullanıcı her sekme değiştirdiğinde, ilgili bileşen ağacı sıfırdan inşa edilir (DOM injection). Bu durum arayüzde mikro takılmalara (jank) ve CPU dalgalanmalarına neden olur.

### Çözüm: CSS Destekli State Kilitleme (State Preservation)
Bileşenleri yaşam döngüsünden koparmak yerine, tüm ana paneller DOM üzerinde kararlı bir şekilde tutulur. Aktif olmayan görünümler Tailwind v4'ün `hidden` sınıfı ile tarayıcı render ağacından izole edilir.

---

## 2. Mimari Uygulama Şeması

### Orkestrasyon Katmanı (`App.tsx`)
Görünüm durumu single source of truth (tek doğru kaynak) prensibine uygun olarak üst katmanda yönlendirilir:

```typescript
export type ActiveView = "explorer" | "editor" | "settings";

// State yukarı taşınarak (Lifting State Up) alt bileşenlere dağıtılır
const [activeView, setActiveView] = useState<ActiveView>("explorer");
```

### Operasyon Katmanı (`FileInfoMain.tsx`)
Bileşenlerin durumunu bellekte kitleyen ve kararlı geçiş sağlayan CSS koşullu yapı:

```tsx
interface FileInfoMainProps {
  activeView: ActiveView;
}

export const FileInfoMain: React.FC<FileInfoMainProps> = ({ activeView }) => {
  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden relative">
      
      {/* A) Gezgin Paneli (State Korumalı) */}
      <div className={`w-full h-full p-4 transition-opacity duration-150 ${
        activeView === "explorer" ? "block opacity-100" : "hidden opacity-0"
      }`}>
        <FileExplorer />
      </div>

      {/* B) Düzenleyici Form Paneli (State Korumalı) */}
      <div className={`w-full h-full p-4 transition-opacity duration-150 ${
        activeView === "editor" ? "block opacity-100" : "hidden opacity-0"
      }`}>
        <PatternForm />
      </div>

    </div>
  );
};
```

---

## 3. Performans ve Kullanıcı Deneyimi (UX) Çıktıları

| Yöntem | DOM Durumu | Bellek Durumu | Kullanıcı Girdileri | Geçiş Hızı |
| :--- | :--- | :--- | :--- | :--- |
| **Klasik `{&&}` Modeli** | Sürekli Silinir/Eklenir | Sıfırlanır | **Kaybolur** | Mount gecikmeli |
| **State Korumalı Model** | Kalıcıdır (Gizlenir) | Korunur | **Aynen Kalır** | Anlık (Instant) |

* **Sıfır Veri Kaybı:** Kullanıcı kural düzenleme formunun ortasındayken sol gezgindeki bir dosyayı incelemek için sekmeyi değiştirebilir; geri döndüğünde yazdığı tüm metinler ve odaklandığı satır aynen korunur.
* **Pürüzsüz Akış:** Geçişler JavaScript motorunun element üretmesini beklemediği, sadece CSS layer katmanını tetiklediği için `1ms` altında, pürüzsüz gerçekleşir.

---

## 4. Geliştirici Standartları (Best Practices)

* Form girdilerini ve scroll pozisyonlarını kaybetmesi **istenen** (resetlenmesi gereken) istisnai alt temizlik adımlarında, bileşene dinamik bir `key` prop'u geçilerek kontrollü unmount tetiklenebilir.
* State korumalı panellerin ilk yükleme (initial load) anında tarayıcıya getirdiği tek seferlik maliyet, SaaS monorepo panellerinde uzun vadeli çalışma zamanı (runtime) performans kazancına dönüştürülmüştür.

