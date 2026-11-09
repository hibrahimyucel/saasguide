# SaaS Monorepo Mimari ve Yorum Satırı Standartları Kılavuzu

Bu kılavuz, **Anayasa v3** temiz kod ilkeleri doğrultusunda, projenin backend (`kebab-case`) ve frontend (`PascalCase`) katmanlarındaki kod kalitesini, okunabilirliğini ve bakımını en üst seviyede tutmak için belirlenmiş kuralları içerir.

---

## 🚀 1. Temel Felsefe: "Neden" İlkesi

Kod satırları **NE** yapıldığını anlatırken, yorum satırları **NEDEN** yapıldığını açıklamalıdır. Temiz ve kendi kendini belgeleyen (self-documenting) kod her zaman önceliklidir.

* **Kötü Pratik (Gereksiz Bilişsel Yük):**
  ```typescript
  // active kontrolü yapılır
  if (pattern.isActive && pattern.checked) { ... }
  ```
* **İyi Pratik (Yorumsuz Netlik):**
  ```typescript
  const isRuleEnabled = pattern.isActive && pattern.checked;
  if (isRuleEnabled) { ... }
  ```

---

## 🎛️ 2. Görsel İşaretçiler (Visual Anchors)

Merkezi Context Provider, API Controller veya servis katmanı gibi dikey taranması gereken uzun dosyalarda, geliştiricinin gözle tarama hızını artırmak için standart emojili kategori başlıkları kullanılmalıdır.

```typescript
// --- 🚀 1. CORE EXPRESSION PARSER ENGINE ---
export const parseAndCompileExpression = () => { ... }

// --- 🎛️ 2. REACTIVE SIDE EFFECTS ---
useEffect(() => { ... }, [patterns]);

// --- 🛠️ 3. CONTEXT API ACTIONS ---
const addPattern = useCallback(() => { ... }, []);
```

---

## ⚠️ 3. Mimari ve Algoritmik Gerekçelendirme

Eğer kod bloğu, framework kısıtlamalarını (React re-render döngüleri, stale closure, asenkron yarış durumları vb.) veya karmaşık bir RegExp/rekürsif yapıyı aşmak için özel bir lojik barındırıyorsa, **tuzakları önleme gerekçesi** açıkça yazılmalıdır.

```typescript
// 🚀 DERİN REFERANS KONTROLÜ (RE-RENDER KORUMASI):
// Üretilen yeni ağaç yapısı öncekiyle yapısal olarak tamamen aynıysa React referansını 
// değiştirmiyoruz. Böylece gereksiz re-render ve sonsuz döngü (infinite loop) engellenir.
return JSON.stringify(prevTree) === JSON.stringify(reevaluated)
  ? prevTree
  : reevaluated;
```

---

## 📚 4. Kurumsal JSDoc Standartları

Monorepo genelinde paylaşılan yardımcı fonksiyonlar (`fi-data-helpers.ts`), ortak bileşenler veya backend servis fonksiyonları tanımlanırken **JSDoc** kullanımı zorunludur. Bu sayede IDE üzerinde Hover (üzerine gelince açılan ipucu) desteği tam olarak sağlanır.

```typescript
/**
 * Klasör yapısını rekürsif olarak tarar ve aktif şema kurallarına göre 
 * düğümlerin görünürlük durumlarını yeniden hesaplar.
 * 
 * @param {FileNode} node - Taranacak kök veya alt dizin düğümü.
 * @param {FileInfo[]} activeRules - Kullanıcı tarafından aktif edilmiş şema kuralları listesi.
 * @returns {FileNode} Filtre bayrakları güncellenmiş yeni derin ağaç referansı.
 */
export const ReevaluateTree = (node: FileNode, activeRules: FileInfo[]): FileNode => {
  // Algoritma gövdesi...
};
```

---

## 🧹 5. Sıfır Atık Politikası (Zero Waste)

* **Ölü Kod Blokları:** Eski sürümlerden kalma, işlevini yitirmiş ve yorum satırına alınmış (commented-out) kod blokları dosyalarda kesinlikle **barındırılamaz**. Kod geçmişinin takibi Git versiyon kontrol sistemine bırakılmalıdır.
* **Aşikar Yorumlar:** Dile ait standart fonksiyonların veya çok bariz state atamalarının yanına yorum yazılmamalıdır.

---

## 📊 Özet Uygulama Matrisi

| Yorum Tipi | Tercih Edilen Konum | Biçimlendirme Kuralı |
| :--- | :--- | :--- |
| **Bölüm Ayraçları** | Providers, Controllers | Çift eğik çizgi ve emojili standart başlık (`// --- 🚀 1. CORE MOTOR ---`) |
| **JSDoc Blokları** | Shared Helpers, API Katmanı | Standart parametre ve dönüş tipi içeren `/** ... */` şeması |
| **Satır İçi Açıklama** | Karmaşık Regex / Algoritmalar | Tuzakları ve mimari zorunluluk gerekçesini belirten kısa notlar |