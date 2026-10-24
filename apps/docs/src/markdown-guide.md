# VitePress Markdown Kılavuzu

Bu sayfa, dökümantasyon hazırlarken kullanabileceğiniz tüm zengin Markdown bileşenlerini ve VitePress'e özel elementleri içerir.

---

## 1. Başlıklar ve Metin Stilleri

Standart Markdown hiyerarşisini ve kalın/eğik metinleri kullanabilirsiniz:

* **Kalın Metin:** `**kalın yazı**` formatı ile yazılır.
* *Eğik Metin:* `*eğik yazı*` formatı ile yazılır.
* ~~Üstü Çizili Metin:~~ `~~üstü çizili~~` formatı ile yazılır.

---

## 2. Kod Blokları ve Satır İçi Kod

Satır içi kodları belirtmek için \` `pnpm dev` \` kullanabilirsiniz. 

Büyük kod bloklarında ise dil belirterek (js, ts, json, bash vb.) renklendirme sağlayabilir, hatta belirli satırları **vurgulayabilirsiniz**:

```typescript {4}
// 4. satır renkli olarak vurgulanacaktır
const monorepo = {
  name: "My Repo",
  packageManager: "pnpm",
  isFast: true
}
```

---

## 3. Uyarı Kutuları (Custom Containers)

İçeriklerinizde dikkat çekmek istediğiniz noktalar için yerleşik kutuları kullanın:

::: info BİLGİ KUTUSU
Bu bir genel bilgilendirme kutusudur.
:::

::: tip İPUCU KUTUSU
Geliştiricilere kolaylık sağlayacak ipuçlarını burada paylaşabilirsiniz.
:::

::: warning UYARI KUTUSU
Dikkat edilmesi gereken riskli durumlar için idealdir.
:::

::: danger TEHLİKE KUTUSU
Kritik hataları veya geri dönülemez işlemleri belirtir.
:::

::: details KODU / DETAYI GÖSTER
Bu alan varsayılan olarak kapalı gelir, tıklandığında aşağı doğru açılır.
:::

---

## 4. Durum Rozetleri (Badges)

Metinlerin veya başlıkların yanına küçük durum etiketleri yerleştirebilirsiniz:

* Yeni Özellik <Badge type="tip" text="Yeni" />
* Geliştirme Aşamasında <Badge type="warning" text="Beta" />
* Zorunlu Alan <Badge type="danger" text="Kritik" />
* Sürüm Bilgisi <Badge type="info" text="v1.0.0" />

---

## 5. Tablolar

Verileri listelemek için hizalama özellikli tablolar kurabilirsiniz:

| Modül | Görevi | Durum |
| :--- | :--- | :---: |
| `apps/api` | Backend Servisi | <Badge type="tip" text="Hazır" /> |
| `apps/docs` | Dokümantasyon | <Badge type="info" text="Güncel" /> |


