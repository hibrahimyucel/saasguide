# State Değişikliklerinde Otomatik Sıralama ve Optimizasyon

Bu rehber, dinamik veri kümeleri (`DescPattern[]`) üzerinde yapılan ekleme, silme ve güncelleme işlemleri sonrasında listenin otomatik olarak belirli bir hiyerarşide sıralanmasını ve bu sürecin `useMemo` ile nasıl optimize edildiğini belgeler.

---

## 1. Problem Tanımı ve Mimari Yaklaşım

Bileşen state'i (`patterns`) her değiştiğinde (örneğin yeni bir kural eklendiğinde veya silindiğinde) verinin alfabetik ve kategorisel olarak sıralı kalması gerekmektedir. 

Sıralama işlemini doğrudan eylem fonksiyonlarının (`handleAdd`, `handleDelete`) içerisinde manuel olarak işletmek şu mimari sorunlara yol açar:
1. **Kod Tekrarı (DRY İhlali):** Her state manipülasyonu yapan fonksiyonun sonuna aynı sıralama kodunun eklenmesi gerekir.
2. **Gereksiz Mutasyon:** `.sort()` metodu JavaScript'te diziyi doğrudan (in-place) değiştirir. React state'inin doğrudan mutasyona uğratılması kararsızlıklara ve re-render tetikleme hatalarına sebep olur.

### Çözüm: Türetilmiş State (Derived State)
State'in kendisini sıralamak yerine, ham state verisinden beslenen ve sadece state değiştiğinde tetiklenen optimize edilmiş bir **türetilmiş alan** oluşturulmuştur.

## 2. Sıralama Algoritması ve Uygulama

Sıralama mantığı iki aşamalı bir hiyerarşiyi takip eder:
1. Öncelikle `kind` alanına göre alfabetik önceliklendirme yapılır (`1-regular` -> `2-regExp` -> `3-ext`).
2. Eğer `kind` değerleri eşitse, kendi aralarında `expression` alanına göre alfabetik olarak hizalanır.

### Optimize Edilmiş Kod Örneği

```typescript
import React, { useState, useMemo } from "react";
import { DescPattern } from "../types";

// Ham veri state yönetimi (Sıralamadan bağımsız, yalın dizi)
const [patterns, setPatterns] = useState<DescPattern[]>(initialSchema);

/**
 * useMemo ile Sarmalanmış Otomatik Sıralama Katmanı
 * Orijinal state'i bozmamak için sığ kopyalama ([...patterns]) yapılmıştır.
 */
const sortedPatterns = useMemo(() => {
  return [...patterns].sort((a, b) => {
    // 1. Kriter: 'kind' alanına göre alfabetik karşılaştırma
    const kindCompare = (a.kind || "").localeCompare(b.kind || "");

    if (kindCompare !== 0) {
      return kindCompare;
    }

    // 2. Kriter: 'kind' aynı ise 'expression' alanına göre alfabetik karşılaştırma
    return (a.expression || "").localeCompare(b.expression || "");
  });
}, [patterns]); // Sadece diziye eleman eklendiğinde, silindiğinde veya güncellendiğinde tetiklenir
```

## 3. Performans ve Kullanıcı Deneyimi (UX) Çıktıları

* **Hesaplama İzolyasyonu:** Tablo içerisindeki hücrelerin düzenleme moduna geçmesi (`isEditing` değişimi) gibi durumlarda, eleman sayısı değişmediği için sıralama algoritması tamamen pas geçilir (Büyük veri kümelerinde CPU kazancı).
* **Tek Noktadan Yönetim:** Yeni bir ekleme (`handleAdd`) veya silme eylemi kurgulandığında sıralama mantığına müdahale edilmesine gerek kalmaz. Ham state güncellendiği an `useMemo` mekanizması listeyi kendiliğinden günceller.

---

## 4. Best Practices

* React state'leri üzerinde `.sort()` çalıştırmadan önce kesinlikle spread operatörü (`[...]`) ile sığ kopya alınmalıdır.
* Sıralanmış listeyi tüketecek olan alt arayüz bileşenlerinde (`<Table />`, `<List />`) ham `patterns` yerine daima **`sortedPatterns`** referansı döngüye sokulmalıdır.

