---
title: >-
  Node.js: Sunucu Taraflı JavaScript Çalışma Zamanı (Tanıtım, Referans ve
  Sözlük)
description: >-
  Node.js, Chrome'un V8 motoru üzerine inşa edilen ve olay güdümlü
  (event-driven), bloklamayan G/Ç (non-blocking I/O) mimarisini kullanarak
  JavaScript kod...
outline:
  - 2
  - 3
status: published
tags:
  - nodejs
  - runtime
  - v8
  - event-loop
  - lexical-database
  - referans
  - altyapi-katman-1
---

# Node.js

* **Üretici / Geliştirici:** Ryan Dahl (İlk Geliştirici) & OpenJS Foundation
* **Resmi Web Sitesi:** [nodejs.org](https://nodejs.org)

::: info CONCEPT MATRICES
* **Domain:** Server-Side Execution & Runtime Environments
* **Superordinate Concept:** Cross-Platform JavaScript Runtime Environment
* **Core Engine:** Google V8 JavaScript Engine + libuv (Asynchronous I/O)
* **Concurrency Model:** Single-Threaded Event Loop (Non-Blocking I/O)
:::

## 1. Tanıtım

**Node.js**, Chrome'un V8 motoru üzerine inşa edilen ve olay güdümlü (event-driven), bloklamayan G/Ç (non-blocking I/O) mimarisini kullanarak JavaScript kodunun bir web tarayıcısı dışında çalıştırılmasını sağlayan açık kaynaklı ve platformlar arası bir çalışma zamanı ortamıdır.

---

## 2. Mimari Rolü ve Temel Prensipleri

**Javascript**, *html* ve *css* gibi istemci tarafında yorumlanıp-çalıştırılan yüksek seviye bir dildir. 
**Node.js**, *Javascript* kodlarının cihazlar tarafından native bir dil gibi çalıştırılmasını, böylece **backend** ve **frontend** için ortak bir kod tabanı ( Codebase, JavaScript/TypeScript ) kullanabilmenizi sağlar. Tüm monorepo yapısının aynı dil ekosisteminde çalışması, geliştirici yükünü azaltır ve katmanlar arası veri modellerinin kolayca paylaşılmasını sağlar.

Kararlılık ve uzun süreli güvenlik desteği için her zaman **LTS (Long Term Support)** sürümleri tercih etmelisiniz.

* **V8 Motoru:** Google Chrome için C++ ile geliştirilen V8 motoru, JavaScript kodunu doğrudan makine koduna (Machine Code) derleyerek yüksek yürütme hızı sunar.
* **Olay Döngüsü (Event Loop) ve Bloklamayan G/Ç (Non-Blocking I/O):** Geleneksel çok iş parçacıklı (multi-threaded) sunucuların aksine tek bir ana iş parçacığı (Single Thread) üzerinde çalışır. Dosya okuma veya ağ isteği gibi uzun süren G/Ç (I/O) işlemlerini arka planda **libuv** kütüphanesine devrederek ana döngüyü kilitlemez.
* **Modüler Ekosistem:** Paket yöneticileri (`npm`, `pnpm`) aracılığıyla yüz binlerce açık kaynak kütüphaneye doğrudan erişim imkanı tanır.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Runtime Environment** | Çalışma Zamanı Ortamı | Kodun tarayıcıya ihtiyaç duymadan işletim sistemi üzerinde doğrudan çalışmasını sağlayan yazılım katmanı. |
| **V8 Engine** | V8 Motoru | JavaScript kodunu JIT (Just-In-Time) derleme tekniğiyle makine diline çeviren açık kaynaklı C++ motoru. |
| **Event Loop** | Olay Döngüsü | Eşzamansız (asynchronous) işlemlerin ve geri çağırma (callback) fonksiyonlarının yürütme sırasını yöneten çekirdek mekanizma. |
| **Non-Blocking I/O** | Bloklamayan Giriş/Çıkış | Ağ veya disk işlemlerinin tamamlanmasını beklemeden diğer görevlerin işlenmeye devam etmesini sağlayan mimari yaklaşım. |
| **libuv** | Asenkron G/Ç Kütüphanesi | Node.js'e işletim sisteminden bağımsız olay döngüsü ve iş parçacığı havuzu (Thread Pool) yeteneği kazandıran C kütüphanesi. |
| **LTS (Long Term Support)** | Uzun Süreli Destek | Üretim (production) ortamları için önerilen, kararlılık ve güvenlik güncellemeleri uzun yıllar garanti altına alınan sürüm hattı. |
| **Package Manager** | Paket Yöneticisi | Proje bağımlılıklarını indiren, sürümleyen ve yöneten araçlar (`npm` yerleşik gelir; monorepo yapımızda performans için `pnpm` kullanılır). |
| **`package.json`** | Proje Manifestosu | Projenin adını, sürümünü, çalıştırma betiklerini (`scripts`) ve bağımlılık listesini barındıran temel yapılandırma dosyası. |
| **Environment Variables** | Ortam Değişkenleri | Veritabanı şifreleri, port numaraları gibi hassas veya ortama özgü ayarların `process.env` üzerinden okunduğu değişkenler. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

Geliştirme ve sunucu yönetiminde en sık başvurulan temel Node.js ve paket yöneticisi komutları:

### Sürüm ve Ortam Kontrolü
```bash
# Kurulu Node.js sürümünü görüntüler
node -v

# Kurulu paket yöneticisi sürümlerini kontrol eder
npm -v
pnpm -v

# Bir JavaScript dosyasını doğrudan çalıştırır
node server.js
```

### Monorepo ve Bağımlılık Yönetimi (`pnpm` & `npm`)
```bash
# Yeni bir proje manifestosu (package.json) oluşturur
pnpm init

# package.json içinde tanımlı tüm bağımlılıkları kurar
pnpm install

# Projeye yeni bir paket ekler (sadece geliştirme ortamı için -D eklenir)
pnpm add express
pnpm add -D typescript

# Monorepo içindeki belirli bir pakete ait betiği (script) çalıştırır
pnpm --filter docs build
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [Node.js API Documentation](https://nodejs.orgdocs/latest/api/)
* **Mimari Rehber:** [Node.js Event Loop & Libuv Guide](https://nodejs.orgen/learn/asynchronous-work/event-loop-timers-and-nexttick)
* **Monorepo Paket Yöneticisi:** [pnpm Documentation](https://pnpm.io)
