# SaaS Geliştiricileri İçin RegExp & Dosya Eşleşme Rehberi

Bu rehber, projenizde kullandığınız **Core Expression Parser Motoru** temel alınarak, dosya ağacı filtreleme panellerinde işinizi kolaylaştıracak pratik düzenli ifade (RegExp) kalıplarını ve kurallarını içerir.

---

## 1. Motorun Çalışma Kuralları (Core Engine Logic)

Yazdığınız `parseAndCompileExpression` motoru girdileri 4 farklı seviyede işler:

1. **Uzantı Modu (`3-ext`):** `extension: true` ise regex derlenmez, doğrudan `.endsWith()` performansı kullanılır.
2. **Saf RegExp Modu (`2-regExp`):** `/pattern/flags` biçimindeki girdiler doğrudan yerleşik RegExp nesnesine dönüştürülür.
3. **Joker / Dinamik Token Modu (`2-regExp`):** İçinde `*`, `?`, tarih ifadeleri (`yyyy`, `mm`, `dd`) barındıran düz metinler otomatik olarak regex'e çevrilir:
   - `*` karakteri `.*` (herhangi bir metin) ifadesine dönüştürülür.
   - `?` karakteri `.` (herhangi bir tek karakter) ifadesine dönüştürülür.
   - Başına `^` ve sonuna `$` eklenerek **tam dosya adı veya yolu** eşleşmesine zorlanır.
4. **Düz Metin Modu (`1-regular`):** Özel karakter içermeyen girdiler küçük/büyük harf duyarsız **tam eşitlik** (`===`) ile test edilir.

---

## 2. Sık Kullanılan Joker Örnekleri (Wildcard / Token)

Motorunuzun otomatik dönüştürdüğü joker kalıpları projeniz içinde en pratik kullanım şeklidir:

| Kullanıcı Girdisi | Üretilen Gerçek Regex | Açıklama / Eşleşen Örnekler |
| :--- | :--- | :--- |
| `a*.doc` | `/^a.*\.doc$/i` | `a` ile başlayan ve `.doc` ile bitenler. Örn: `a.doc`, `abc.doc` |
| `*.log` | `/^.*\.log$/i` | Tüm `.log` uzantılı dosyalar. Örn: `error.log`, `app.log` |
| `backup-yyyy-mm-dd.zip` | `/^backup-\d{4}-\d{2}-\d{2}\.zip$/i` | Belirli tarih formatındaki yedekler. Örn: `backup-2026-11-07.zip` |
| `config?.json` | `/^config.\.json$/i` | `config` sonrası tek karakter alanlar. Örn: `config1.json`, `configA.json` |

---

## 3. İleri Düzey Saf RegExp Kalıpları (`/.../i`)

Daha karmaşık dosya/klasör mimarilerini yakalamak için formunuza doğrudan `/pattern/flags` sözdizimiyle regex yazabilirsiniz.

### Klasör Bazlı Filtreleme
- **/ Belirli bir klasörün altındaki her şey:**
  - `Girdi:` `/^src\/components\/.*/i`
  - `Açıklama:` `src/components/` dizini altındaki tüm dosya ve alt klasör yollarını yakalar.
- **/ Belirli isimdeki tüm klasörler (Nerede olursa olsun):**
  - `Girdi:` `/\/__tests__\//i`
  - `Açıklama:` Projenin neresinde olursa olsun `__tests__` klasörlerini ve içeriğini filtreler.

### Dosya İsim Kalıpları
- **/ Sadece test dosyaları:**
  - `Girdi:` `/\.test\.(tsx|ts|js)$/i`
  - `Açıklama:` `.test.tsx`, `.test.ts` veya `.test.js` ile biten tüm test dosyalarını yakalar.
- **/ Birden fazla uzantıyı tek kuralda yakalama:**
  - `Girdi:` `/\.(jpg|jpeg|png|webp|gif)$/i`
  - `Açıklama:` Projedeki tüm yaygın görsel formatlarını tek seferde pasifleştirmek veya listelemek için idealdir.
- **/ Belirli karakterle başlayan veya bitmeyenler (Negation):**
  - `Girdi:` `/^(?!.*\.stories\.).*$/i`
  - `Açıklama:` İçinde `.stories.` ifadesi **geçmeyen** tüm dosyaları eşleştirir.

---

## 4. Geliştirici Notları ve İpuçları

1. **Performans Önceliği:** Sadece uzantı filtrelemek istiyorsanız regex yazmak yerine formdaki **"Uzantı (.*)"** checkbox'ını işaretleyin. Bu sayede motor `3-ext` moduna geçer ve regex çalıştırmadan hızlıca `.endsWith()` ile işi bitirir.
2. **Kaçış Karakterleri (Escaping):** Saf regex modunda (`/.../i`) nokta (`.`) karakterinin herhangi bir harfe denk gelmesini istemiyorsanız önüne ters bölü koyarak `\.` şeklinde kaçırmalısınız. Ancak joker modunda (`a*.doc`) motor noktayı sizin yerinize otomatik kaçırır.
3. **Büyük/Küçük Harf:** Motorunuz tüm dinamik kalıpları varsayılan olarak `i` (case-insensitive) flag'i ile derler. Bu nedenle `A.DOC` ile `a.doc` her zaman aynı şekilde filtrelenir.