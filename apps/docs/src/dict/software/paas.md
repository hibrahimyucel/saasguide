---
title: PaaS (Platform as a Service)
description: Platform as a Service (Hizmet Olarak Platform) kavramı, bulut hizmet modelleri arasındaki konumu ve pr2cloud Self-Hosted PaaS mimarisi.
outline:
  - 2
  - 3
status: published
tags:
  - paas
  - cloud-computing
  - architecture
  - self-hosted
  - pr2cloud
---

# PaaS (Platform as a Service)

**Kavram Türü:** Bulut Bilişim Hizmet Modeli (Cloud Service Model)  
**Mimari Bağlam:** Self-Hosted PaaS (`pr2cloud` Ekosistemi)

::: info CONCEPT MATRICES
* **Domain:** Cloud Computing & Infrastructure Architecture
* **Abstraction Layer:** Runtime, Middleware, Container Orchestration, Reverse Proxy, TLS & Identity (SSO)
* **User Responsibility:** Application Code, Business Logic, Environment Parameters & Data
* **Provider / Platform Responsibility:** Operating System (AlmaLinux 9), Virtual Networking (Tailscale / Dual-NIC Docker), Ingress (Nginx), Certificates (Certbot), Identity Provider (Dex OIDC) & Storage Services (MinIO)
* **Comparison Axis:**
  * **IaaS (Infrastructure as a Service):** Full OS & network management by user (e.g., Raw VPS).
  * **PaaS (Platform as a Service):** Runtime & platform services managed by platform; user deploys code (e.g., Heroku, Vercel, `pr2cloud`).
  * **SaaS (Software as a Service):** End-user software managed completely by provider (e.g., Gmail, Gitea web UI).
:::

---

## Resmi Tanım

**PaaS (Platform as a Service — Hizmet Olarak Platform)**; geliştiricilerin altta yatan sunucu donanımı, işletim sistemi yamaları, ağ yönlendirmesi, SSL/TLS sertifika yönetimi ve kimlik doğrulama altyapısıyla uğraşmadan doğrudan yazılım uygulamalarını geliştirmelerine, çalıştırmalarına ve dağıtmalarına olanak tanıyan bulut bilişim modelidir.

**Self-Hosted PaaS** yaklaşımında ise bu hazır uygulama çalışma katmanı ticari üçüncü parti bulut sağlayıcıları yerine, kurumun veya geliştiricinin kendi sanal özel sunucusu (VPS) üzerinde açık kaynaklı araçlarla (`Docker`, `Nginx`, `Dex`, `Gitea`, `MinIO`) inşa edilir.

---

## Sözlük Veritabanı (Lexical Database)

| Terim / Kavram | Açıklama ve Mimari Karşılığı |
| :--- | :--- |
| **IaaS (Infrastructure as a Service)** | Ham sunucu, depolama ve ağ kaynaklarının kiralandığı en alt sanallaştırma katmanıdır (ör. AlmaLinux 9 kurulu ham VPS). İşletim sistemi ve güvenlik yapılandırması kullanıcıya aittir. |
| **PaaS (Platform as a Service)** | Uygulama kodunun çalışması için gereken çalışma zamanı (Node.js), ters vekil (Nginx), SSL, kimlik (SSO) ve CI/CD altyapısını hazır sunan katmandır. |
| **SaaS (Software as a Service)** | Son kullanıcıya tarayıcı veya istemci üzerinden doğrudan sunulan hazır yazılım hizmetidir (ör. SnappyMail webmail arayüzü veya geliştirilen nihai ürün). |
| **Self-Hosted PaaS** | Ticari PaaS sağlayıcılarının (Vercel, Heroku vb.) sunduğu geliştirici deneyimini, satıcı bağımlılığı (vendor lock-in) olmadan kendi VPS altyapımızda kurma mimarisidir (`pr2cloud`). |
| **Vendor Lock-in (Satıcı Bağımlılığı)** | Belirli bir bulut sağlayıcısının tescilli araçlarına bağımlı kalma ve altyapıyı başka bir sunucuya taşıyamama durumudur. |
| **Dual-NIC İzolasyonu** | PaaS katmanında dış erişim ağı (`pr2_edge_net`) ile veritabanı ve iç servis ağını (`pr2_internal_net`) birbirinden ayıran çift sanal ağ topolojisidir. |

---

## Cheatsheet

### 1. Bulut Katmanları Sorumluluk Matrisi

| Katman | IaaS (Ham VPS) | PaaS (`pr2cloud`) | SaaS (Son Ürün) |
| :--- | :---: | :---: | :---: |
| **Uygulama Kodu & İş Mantığı** | Geliştirici | **Geliştirici** | Sağlayıcı |
| **Veri & Dosya Depolama** | Geliştirici | **Geliştirici** | Sağlayıcı |
| **Çalışma Zamanı & Konteyner** | Geliştirici | **Platform** | Sağlayıcı |
| **Reverse Proxy, SSL & SSO** | Geliştirici | **Platform** | Sağlayıcı |
| **İşletim Sistemi & Ağ Güvenliği** | Geliştirici | **Platform** | Sağlayıcı |

### 2. `pr2cloud` PaaS Bileşen Eşleşmesi

* **Altyapı & Güvenlik Temeli:** `AlmaLinux 9` + `Tailscale VPN` + `firewalld` + `Fail2ban`
* **Giriş & Sertifika Katmanı:** `Nginx Reverse Proxy` + `Certbot (Wildcard DNS-01)`
* **Merkezi Kimlik & Kod Yaşam Döngüsü:** `Dex (OIDC SSO)` + `Gitea (Git & CI/CD)`
* **Depolama & İletişim Servisleri:** `MinIO (S3)` + `Stalwart Mail` + `SnappyMail`

### 3. Yeni Uygulama Dağıtım Kontrol Listesi (PaaS Akışı)

1. **Kod Geliştirme:** `pr2cloud/source/apps/` altında uygulamayı geliştir ve katmanlı mimariye göre test et.
2. **Ağ Tanımı:** Uygulama konteynerini dış istekler için `pr2_edge_net`, iç servis erişimi (MinIO, Dex) için `pr2_internal_net` ağına bağla.
3. **Yönlendirme:** `pr2cloud/prod/nginx/` altında alt alan adı (`uygulama.<domain>`) yönlendirmesini tanımla.
4. **Yayınlama:** `pr2cloud/prod/` dizininde konteyneri ayağa kaldır ve Wildcard HTTPS üzerinden erişimi doğrula.
