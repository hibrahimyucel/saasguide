---
tarih: 2026-11-17
saat: 23:20
konu: "Turborepo: Yüksek Performanslı Monorepo Derleme Sistemi (Tanıtım, Referans ve Sözlük)"
baglam: "Monorepo Kök Dizini (turbo.json) / Görev Orkestrasyonu ve Önbellekleme"
durum: "Tamamlandı"
etiketler: [turborepo, monorepo, build-system, caching, pipeline, lexical-database, referans]
---

# Turborepo

* **Üretici / Geliştirici:** Jared Palmer (Kurucu) & Vercel Inc.
* **Resmi Web Sitesi:** [turborepo.com](https://turborepo.com) / [turbo.build](https://turbo.build)

::: info CONCEPT MATRICES
* **Domain:** Build Systems & Monorepo Task Orchestration
* **Superordinate Concept:** Incremental Build System with Content-Aware Caching
* **Implementation Language:** Rust (High-Performance Task Runner)
* **Execution Model:** Directed Acyclic Graph (DAG) Task Scheduling
:::

## 1. Tanıtım

**Turborepo**, JavaScript ve TypeScript monorepo projeleri için Rust diliyle geliştirilmiş; paketler arası bağımlılık grafiğini analiz ederek görevleri (derleme, test, lint) paralel çalıştıran ve değişmeyen kodların çıktılarını önbelleğe alarak tekrar derlemeyi önleyen yüksek performanslı bir artımlı derleme (incremental build) sistemidir.

---

## 2. Mimari Rolü ve Temel Prensipleri

**Turborepo**, monorepo kök dizinindeki `turbo.json` dosyası üzerinden hangi uygulamanın hangi ortak pakete bağımlı olduğunu bilir ve CI/CD süreçlerinin süresini saniyelere indirir.

* **İçerik Tabanlı Önbellekleme (Content-Aware Caching):** Bir paketin kaynak dosyaları, ortam değişkenleri ve bağımlılıkları değişmemişse o paketi yeniden derlemez; önceki derleme çıktısını önbellekten (cache) milisaniyeler içinde geri yükler (**Cache Hit**).
* **Paralel Görev Yürütme (Task Scheduling):** Bağımlılık grafiğini (DAG) çıkararak birbirinden bağımsız görevleri işlemcinin tüm çekirdeklerini kullanacak biçimde aynı anda çalıştırır.
* **Etkilenen Paketleri Filtreleme (Affected Filtering):** Git geçmişini analiz ederek yalnızca son commit ile değişen uygulamaları ve onlara bağlı paketleri seçici olarak derler.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Monorepo** | Tekil Kod Deposu | Birden fazla uygulama (`apps/`) ve paylaşılan kütüphanenin (`packages/`) tek bir Git deposu altında yönetildiği mimari yaklaşım. |
| **Task Pipeline** | Görev Boru Hattı | `turbo.json` içinde tanımlanan, görevlerin birbirine göre çalışma sırasını (`dependsOn`) ve önbellek kurallarını (`outputs`) belirleyen şema. |
| **Cache Hit / Replay** | Önbellek İsabeti | Kodda değişiklik yapılmadığı tespit edildiğinde, görevin yeniden çalıştırılmayıp önceki çıktısının ve terminal loglarının anında geri oynatılması. |
| **Task Hash** | Görev Özet İmzası | Bir görevin girdilerinden (kaynak kod, kilit dosyası, ortam değişkenleri) üretilen benzersiz kriptografik parmak izi. |
| **Remote Caching** | Uzak Önbellek | Derleme önbelleğinin yerel makine yerine merkezi bir sunucuda tutularak tüm ekip üyeleri ve CI/CD süreçleri arasında paylaşılması. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

```bash
# Monorepo içindeki tüm uygulamaları ve paketleri bağımlılık sırasına göre derler
pnpm turbo build

# Yalnızca belirtilen uygulamayı ve onun bağımlı olduğu alt paketleri derler
pnpm turbo build --filter=docs

# Yalnızca son commit (HEAD~1) sonrasında değişen paketleri test eder
pnpm turbo test --filter=[HEAD^1]

# Mevcut önbelleği yoksayarak sıfırdan temiz derleme yapar
pnpm turbo build --force
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [Turborepo Documentation](https://turbo.buildrepo/docs)
* **Yapılandırma Referansı:** [Configuring turbo.json](https://turbo.buildrepo/docs/reference/configuration)
