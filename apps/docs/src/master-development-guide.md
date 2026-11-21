---
title: "πr² Cloud - Development"
description: "AI Development / pr2cloud Single Source of Truth (System Prompt & Context Reference)"
outline: [2, 3]
sidebarTitle: "Tasarım ve Kodlama Standartları"
index: 2
isContent: false
hidden: false
status: "published" # draft | review | published
tags: [ai-reference, pr2cloud, architecture, monorepo, self-hosted-paas, security, coding-standards, clean-code, layered-architecture, solid, naming-conventions, comments]
---

# AI Development Standards: Yazılım Geliştirme ve Kodlama Standartları
Bu doküman; **pr2cloud** (*Pr2 PaaS Environment & Software Development Guide*) monorepo ekosistemindeki tüm ön yüz (Frontend), arka yüz (Backend) ve paylaşılan paketlerde uygulanması zorunlu yazılım mühendisliği ilkelerini tanımlar.

---

## 1. Katmanlı Tasarım (Layered Architecture)
Her uygulama ve servis, sorumlulukların birbirine karışmasını önlemek için keskin sınırlarla ayrılmış katmanlardan oluşur:

* **Sunum / İletişim Katmanı (Presentation / Transport):**
  * *Frontend:* Yalnızca UI render etme ve kullanıcı etkileşimini yakalama sorumluluğuna sahip React bileşenleri. İş mantığı içermez.
  * *Backend:* HTTP isteklerini karşılayan, girdi doğrulamasını (validation) yapan ve yanıt dönen Controller / Route katmanı.
* **İş Mantığı Katmanı (Application / Service Layer):** Uygulamanın temel kurallarını, akışlarını ve orkestrasyonunu yürüten saf TypeScript servisleri (`*-service.ts`). Framework bağımsızdır.
* **Veri Erişim Katmanı (Data Access / Repository Layer):** Veritabanı sorguları, S3 (MinIO) işlemleri ve dış API istemcilerini soyutlayan katman (`*-repository.ts`, `*-client.ts`).
* **Çekirdek / Ortak Katman (Domain / Shared Packages):** Tipler (`types`), şemalar (Zod), sabitler ve saf yardımcı fonksiyonlar (`packages/*`).

> **Bağımlılık Kuralı:** Üst katmanlar alt katmanları çağırabilir; alt katmanlar üst katmanları asla bilemez ve içe aktaramaz (Dependency Rule).

---

## 2. Modüler Tasarım (Modular Design)
* **Yüksek Uyum, Düşük Bağımlılık (High Cohesion, Low Coupling):** Birbiriyle doğrudan ilgili işlevler aynı modül/paket altında toplanır; modüller arası iletişim yalnızca açıkça tanımlanmış arayüzler (interfaces/exports) üzerinden kurulur.
* **Paylaşılan Paketler (`packages/`):** Birden fazla uygulamada kullanılan doğrulama şemaları, UI bileşenleri ve yardımcı araçlar kopyalanmaz; monorepo içinde bağımsız birer paket olarak modülerleştirilir.
* **Stil Modülerliği:** Front-end tarafında **Tailwind CSS v4** kullanılır; tasarım belirteçleri native CSS değişkenleri, `@theme` ve `@utility` direktifleri ile modüler biçimde tanımlanır.

---

## 3. Tek Sorumluluk İlkesi (Single Responsibility Principle - SRP)
* **Fonksiyon Düzeyi:** Her fonksiyon yalnızca tek bir işi yapmalı, yan etkileri (side-effects) izole edilmeli ve mümkün olduğunca saf (pure) tasarlanmalıdır.
* **Bileşen Düzeyi:** Bir React bileşeni hem veri çekme (fetching), hem karmaşık durum hesaplama, hem de büyük bir arayüz ağacı çizme işini aynı anda üstlenmemelidir.
* **Sade Ref & Event Yönetimi:** Bileşenler arası odak (focus) geçişleri gibi tarayıcı davranışlarında her bileşen için gereksiz `useRef` ve ekstra event dinleyicileri tanımlamak yerine doğal DOM/HTML davranışları veya merkezi, yalın çözümler tercih edilir.

---

## 4. İsimlendirme Kuralları (Naming Conventions)

| Yapı / Öğe | Kural | Örnek |
| :--- | :--- | :--- |
| **React Bileşen Dosyaları** | `PascalCase` | `UserProfileCard.tsx`, `EditableCell.tsx` |
| **Diğer Tüm Dosyalar** | `kebab-case` | `mail-service.ts`, `oidc-config.ts`, `deploy-prod.sh` |
| **Sınıflar, Tipler, Arayüzler, Enum** | `PascalCase` | `UserSession`, `MailServerConfig`, `AuthProvider` |
| **Değişkenler & Fonksiyonlar** | `camelCase` | `getUserById`, `activeTenantList`, `validateToken` |
| **Boolean Değişkenler** | `is` / `has` / `can` / `should` ön eki | `isAuthenticated`, `hasPermission`, `canEditRule` |
| **Sabitler (Global Constants)** | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_TOKEN_TTL` |
| **Ortam Değişkenleri (`.env`)** | `UPPER_SNAKE_CASE` (Servis ön ekli) | `DEX_ISSUER_URL`, `STALWART_ADMIN_PORT` |

---

## 5. Yorum Satırı Standartları (Comments & Documentation)
* **"Neden" İlkesi:** Kod, **NE** yapıldığını açıkça anlatmalı; yorum satırları, yalnızca mimari **NEDENİ** ve kısıtlamaları açıklamalıdır.
* **Görsel İşaretçiler (Visual Anchors):** Uzun servis, controller veya provider dosyalarında dikey taramayı hızlandırmak için standart bölüm ayraçları kullanılır:
  ```typescript
  // --- 🚀 1. CORE SERVICE LOGIC ---
  // --- 🎛️ 2. REACTIVE EFFECTS / HOOKS ---
  // --- 🛠️ 3. PUBLIC ACTIONS & HANDLERS ---
  ```
* **Kurumsal JSDoc:** Paylaşılan yardımcı fonksiyonlar ve servis API'leri için parametre ve dönüş tiplerini açıklayan `/** ... */` JSDoc blokları zorunludur.
* **Tuzak ve Kısıtlama Uyarıları:** Re-render koruması, asenkron yarış durumları veya güvenlik gereksinimleri nedeniyle yazılan özel blokların üstüne kısa gerekçe eklenir.
* **Sıfır Atık (Zero Waste):** Yorum satırına alınmış ölü kod blokları ve kendini tekrar eden aşikar yorumlar kod tabanında kesinlikle barındırılmaz.
