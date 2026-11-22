---
title: "Sistem Mimarisi ve İstemci Topolojisi"
description: "pr2cloud dağıtık uygulama mimarisi: Edge cihaz servisleri, otomasyon workstation istemcileri, merkezi sunucu ve Web/Desktop OIDC kimlik doğrulama akışları."
outline: [2, 3]
sidebarTitle: "İstemci ve Sistem Topolojisi"
index: 3
isContent: true
hidden: false
status: "published"
tags: ["architecture", "topology", "edge-computing", "oidc", "pkce", "m2m", "pr2cloud"]
---

# Sistem Mimarisi ve İstemci Topolojisi

::: info Mimari Prensip
**pr2cloud** uygulama ekosisteminde tüm iş kuralları, veri tabanı işlemleri ve dosya yönetimi **Merkezi Sunucu** üzerinde toplanır. Saha katmanı yalnızca donanım haberleşmesi (**Edge Cihaz Servisi**) ve zorunlu yerel otomasyon (**Workstation**) sorumluluklarını üstlenir; son kullanıcı arabirimleri (**Web** veya **Desktop**) doğrudan merkezi API ile haberleşir.
:::

---

## 1. Katmanlı Sistem Topolojisi

Sistem; **Saha Katmanı (Edge)**, **İstemci Katmanı (Presentation)** ve **Merkezi Sunucu (Core PaaS)** olmak üzere üç ana bölgeye ayrılır. Saha ve istemci katmanları merkezi sunucudaki iç ağa (`pr2_internal_net`) veya veritabanına (`MariaDB:3306`) **asla doğrudan bağlanmaz**; tüm trafik `pr2_edge_net` üzerindeki Nginx Ters Vekil (`https://api.<domain>`) üzerinden geçer.

```text
+-----------------------------------------------------------------------------------+

|                         1. SAHA KATMANI (EDGE & OTOMASYON)                        |
|                                                                                   |
|  [Elektronik Tartı / Lab Cihazı]                                                  |
|         │  (RS-232 / Modbus / TCP)                                                |
|         ▼                                                                         |
|  [Edge Cihaz Servisi (Daemon)]  ──(Opsiyonel Yerel IPC)──► [Otomasyon Workstation]|
+----------------│---------------------------------------------------│--------------+
                 │ HTTPS / WSS (M2M Token)                           │ HTTPS (OIDC JWT)
                 ▼                                                   ▼
+-----------------------------------------------------------------------------------+

|                    2. İSTEMCİ KATMANI (WEB & DESKTOP ARABİRİMLER)                 |
|                                                                                   |
|      [Web Uygulaması (Next.js / React)]        [Desktop İstemci (Delphi/Flutter)] |
+----------------│---------------------------------------------------│--------------+
                 │ OIDC Auth Code                                    │ OIDC Auth Code + PKCE
                 ▼                                                   ▼
=====================================================================================
                          GÜVENLİK SINIRI (HTTPS / TLS 1.3 & Tailscale)
=====================================================================================
                 │                                                   │
                 ▼                                                   ▼
+-----------------------------------------------------------------------------------+

|                        3. MERKEZİ SUNUCU (pr2cloud CORE PaaS)                     |
|                                                                                   |
|  ┌─────────────────────────────────────────────────────────────────────────────┐  |
|  │ pr2_edge_net (Kenar Ağı)                                                    │  |
|  │   [Nginx Reverse Proxy (:443)] ──► [Central API / Gateway]                  │  |
|  └───────────────────────────────────────────│─────────────────────────────────┘  |
|                                              │ (Dual-NIC Köprüsü)                 |
|  ┌───────────────────────────────────────────▼─────────────────────────────────┐  |
|  │ pr2_internal_net (İç İzole Ağ - internal: true)                             │  |
|  │                                                                             │  |
|  │   [Dex IdP (:5556)]        [MariaDB (:3306)]        [PGSTY SILO S3 (:9000)] │  |
|  │   (SQLite OIDC/OAuth2)     (İlişkisel Veri)         (Rapor, Belge, Yedek)   │  |
|  └─────────────────────────────────────────────────────────────────────────────┘  |
+-----------------------------------------------------------------------------------+
```

### Bileşen Sorumluluk Matrisi

| Bileşen | Çalışma Ortamı | Temel Sorumluluk | İletişim & Güvenlik Yöntemi |
| :--- | :--- | :--- | :--- |
| **Edge Cihaz Servisi** | Saha PC / Endüstriyel Gateway | Elektronik tartı, kantar ve laboratuvar cihazlarından ham veriyi okumak ve merkezi API'ye iletmek. | Arka plan servisi (Daemon); **OAuth2 Client Credentials (M2M)** veya cihaz sertifikası ile HTTPS/WSS. |
| **Otomasyon Workstation** | Saha Operatör İstasyonu | Sadece anlık donanım tetikleme, barkod/etiket basımı ve yerel otomasyon senaryolarını yürütmek. | Merkezi API üzerinden iş emri alır; operatör oturumu için **Dex OIDC** kullanır. |
| **Web / Desktop Arabirim** | Tarayıcı veya Masaüstü İstemci | Kullanıcı etkileşimi, raporlama, veri girişi ve iş akışı takibi (İş mantığı barındırmaz). | Merkezi API (`api.<domain>`) ile haberleşir; **Dex OIDC** JWT Bearer Token taşır. |
| **Central API** | Merkezi Sunucu (`Dual-NIC`) | Tüm iş kuralları, yetkilendirme (RBAC), veri doğrulama ve iç servis orkestrasyonu. | `pr2_edge_net` üzerinden istek alır, `pr2_internal_net` üzerinden MariaDB/SILO ile konuşur. |

---

## 2. Kimlik Doğrulama (OIDC & M2M) Akış Şemaları

Merkezi kimlik sağlayıcı olarak çalışan **Dex (`auth.<domain>`)**, hem insan operatörlerin (Web ve Desktop) hem de insansız saha servislerinin (Edge Daemon) tek noktadan yetkilendirilmesini sağlar.

### A. Web & Desktop İstemci OIDC Akışı (Authorization Code + PKCE)

Masaüstü uygulamalarında (Desktop) gömülü tarayıcı (WebView) yerine **sistem varsayılan tarayıcısı** ve **PKCE (Proof Key for Code Exchange)** standart olarak uygulanır. Bu sayede istemci tarafında gizli anahtar (`client_secret`) saklanmasına gerek kalmaz.

```text
[Web / Desktop İstemci]              [Dex IdP (auth.<domain>)]            [Central API (api.<domain>)]
          │                                      │                                      │
          │── 1. code_verifier & code_challenge ─┼─► (Tarayıcıda /authorize açılır)     │
          │                                      │                                      │
          │◄── 2. Kullanıcı Girişi & Onay ───────│                                      │
          │    (Authorization Code döner)        │                                      │
          │                                      │                                      │
          │── 3. Auth Code + code_verifier ─────►│                                      │
          │                                      │                                      │
          │◄── 4. ID Token + Access Token (JWT) ─│                                      │
          │       (+ Refresh Token)              │                                      │
          │                                      │                                      │
          │── 5. API İsteği (Authorization: Bearer <Access_Token>) ────────────────────►│
          │                                      │                                      │
          │                                      │◄── 6. JWKS Public Key Doğrulama ─────│
          │                                      │                                      │
          │◄── 7. İşlenmiş Veri Yanıtı (JSON) ───┼──────────────────────────────────────│
```

### B. Edge Cihaz Servisi M2M (Machine-to-Machine) Akışı

Kullanıcı etkileşimi olmayan tartı/laboratuvar okuma servisleri, merkezi sunucuya **OAuth 2.0 Client Credentials** akışı veya kapsamı kısıtlanmış **Service Account Token** ile bağlanır:

1. **Kimlik Talebi:** Edge servisi başlangıçta `client_id` ve `client_secret` bilgileriyle `auth.<domain>/token` uç noktasına başvurur.
2. **Kapsamlı Yetki (Scoped JWT):** Dex, yalnızca ilgili saha cihazına ait yazma yetkilerini (ör. `scope: device:scale:write`) içeren kısa ömürlü bir JWT üretir.
3. **Veri İletimi:** Servis, cihazdan okuduğu ölçüm verisini `POST https://api.<domain>/v1/telemetry/readings` adresine gönderir.
4. **Çevrimdışı Tamponlama (Store-and-Forward):** İnternet kesintisi durumunda Edge servisi okumaları yerel SQLite kuyruğunda tutar; bağlantı sağlandığında zaman damgasıyla (timestamp) merkezi API'ye aktarır.

---

## 3. Mimari Kurallar ve Sınırlar

* **İnce İstemci (Thin Client) Prensibi:** Web ve Desktop uygulamaları doğrudan veritabanı sorgusu çalıştırmaz; iş kuralları değiştiğinde istemci güncellemesine gerek kalmaması için tüm hesaplamalar Merkezi API'de tutulur.
* **Tekil Yetki Kaynağı:** Kullanıcının Web veya Desktop üzerinden bağlanması yetki matrisini değiştirmez; Central API, gelen JWT içindeki `sub` (kullanıcı kimliği) ve `groups/roles` bilgisine göre aynı RBAC kurallarını uygular.
* **Ağ İzolasyonu:** Saha workstation'ları ile merkezi sunucu arasındaki trafik standart HTTPS (TLS 1.3) üzerinden akar; hassas endüstriyel tesislerde ek katman olarak **Tailscale** özel ağı ile uçtan uca şifrelenir.
