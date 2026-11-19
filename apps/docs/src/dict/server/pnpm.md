---
tarih: 2026-11-17
saat: 23:20
konu: "pnpm: İçerik Adreslemeli Node.js Paket Yöneticisi (Tanıtım, Referans ve Sözlük)"
baglam: "Monorepo Kök Dizini / Bağımlılık ve Workspace Yönetimi"
durum: "Tamamlandı"
etiketler: [pnpm, package-manager, monorepo, workspaces, symlink, lexical-database, referans]
---

# pnpm

* **Üretici / Geliştirici:** Zoltan Kochan & pnpm Topluluğu
* **Resmi Web Sitesi:** [pnpm.io](https://pnpm.io)

::: info CONCEPT MATRICES
* **Domain:** Software Dependency & Workspace Management
* **Superordinate Concept:** Content-Addressable Node.js Package Manager
* **Storage Architecture:** Global Content-Addressable Store + Hard Links & Symbolic Links
* **Dependency Isolation:** Strict Non-Flat `node_modules` Structure
:::

## 1. Resmi Tanım (Formal Definition)

**pnpm** ("Performant npm"), paketleri sistem genelinde içerik adreslemeli (content-addressable) tek bir merkezi depoda saklayan ve projelere sabit bağlantılar (hard links) ile sembolik bağlantılar (symlinks) aracılığıyla bağlayarak disk alanından tasarruf sağlayan, hızlı ve katı bağımlılık izolasyonu sunan bir Node.js paket yöneticisidir.

---

## 2. Mimari Rolü ve Temel Prensipleri

**SaaS Rehberi** monorepo yapısında (`apps/*` ve `packages/*`) birden fazla uygulamanın aynı bağımlılıkları tekrar tekrar diske kopyalamasını önlemek ve paketler arası ortak kod paylaşımını yönetmek için standart paket yöneticisi olarak kullanılır.

* **Merkezi İçerik Deposu (Content-Addressable Store):** İndirilen her paket sürümü bilgisayarda yalnızca bir kez merkezi depoya kaydedilir; farklı projelerde veya monorepo paketlerinde kullanıldığında kopyalanmaz, doğrudan sabit bağlantı (hard link) ile işaret edilir.
* **Hayalet Bağımlılıkların Önlenmesi (Phantom Dependencies):** Geleneksel `npm` ve `yarn`'ın düzleştirilmiş (flat) `node_modules` yapısının aksine, yalnızca `package.json` içinde açıkça tanımlanan paketlere erişime izin veren katı bir sembolik bağlantı ağacı kurar.
* **Yerleşik Monorepo Desteği (`Workspaces`):** `pnpm-workspace.yaml` dosyası üzerinden tüm alt projelerin bağımlılıklarını tek bir kilit dosyası (`pnpm-lock.yaml`) altında yönetir.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Content-Addressable Store** | İçerik Adreslemeli Depo | Paket dosyalarının içerik özetlerine (hash) göre tekilleştirilerek saklandığı sistem genelindeki gizli önbellek dizini. |
| **Hard Link** | Sabit Bağlantı | Disk üzerindeki aynı fiziksel dosya verisine işaret eden birden fazla dosya sistemi girişi (ek disk alanı kaplamaz). |
| **Symlink (Symbolic Link)** | Sembolik Bağlantı | Başka bir dosya veya dizinin yolunu gösteren kısayol referansı (`node_modules` hiyerarşisini kurmak için kullanılır). |
| **Workspace** | Çalışma Alanı | Tek bir depo içinde yer alan ancak kendi bağımsız `package.json` dosyasına sahip alt proje birimi (`apps/web`, `apps/docs`). |
| **`pnpm-lock.yaml`** | Bağımlılık Kilit Dosyası | Tüm çalışma alanlarındaki paketlerin tam sürüm ve bütünlük bilgilerini sabitleyerek farklı ortamlarda aynı kurulumu garanti eden dosya. |
| **Phantom Dependency** | Hayalet Bağımlılık | Projenin `package.json` dosyasında listelenmediği halde, başka bir paketin alt bağımlılığı olduğu için yanlışlıkla erişilebilen güvensiz paket durumu. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

```bash
# Monorepo içindeki tüm çalışma alanlarının bağımlılıklarını kurar
pnpm install

# Belirli bir çalışma alanına (örneğin apps/web) yeni paket ekler
pnpm --filter web add lucide-react

# Monorepo içindeki yerel bir ortak paketi (packages/ui) başka bir uygulamaya bağlar
pnpm --filter web add @saas/ui --workspace

# Tüm çalışma alanlarında belirlenen betiği (script) çalıştırır
pnpm -r build
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [pnpm Documentation](https://pnpm.iomotivation)
* **Workspace Rehberi:** [pnpm Workspaces](https://pnpm.ioworkspaces)
