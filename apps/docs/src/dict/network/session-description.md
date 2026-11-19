---
title: "Session Management (Uçtan Uca Oturum ve Kimlik Yaşam Döngüsü)"
description: "SaaS Rehberi mimarisinde Dex (OIDC), Gitea, MinIO, Yalın Frontend ve Bağımsız Backend API'ler arasındaki bütünleşik oturum yönetimi ve token yaşam döngüsü."
date: 2026-11-18
category: "architecture-security"
tags: [session, sso, oidc, dex, token-lifecycle, pkce, jwks, architecture]
status: "active-reference"
---

# Session Management

### Oturum Yönetimi

**Mimari Standart:** OpenID Connect (OIDC) + OAuth 2.0 Token Lifecycle  
**Resmi Web Sitesi:** [https://openid.net](https://openid.net)

::: info CONCEPT MATRICES

| Lifecycle Phase | Responsible Actor | Mechanism / Artifact | Duration & State |
| :--- | :--- | :--- | :--- |
| **1. Identity Proofing** | Dex (`auth.*`) | Central Login + PKCE / Client Secret | Stateless (Executes once at login) |
| **2. Infra Session** | Gitea & MinIO | Local HTTP-Only Session Cookie | Stateful (`8h` fixed local cookie) |
| **3. App Session** | Lean Frontend (SPA) | In-Memory Access Token + Refresh Rotation | Active (`15m` access / `24h` max) |
| **4. API Verification** | Independent Backend API | Stateless JWT Signature Check (JWKS) | Zero-State (Verified per request) |
:::

---

## 1. Tanıtım

**Oturum Yönetimi (Session Management)**, Kullanıcının sisteme giriş yaptığı andan çıkış yaptığı (veya süresinin dolduğu) ana kadar kimliğinin ve yetkilerinin tüm servisler genelinde güvenli, tutarlı ve düşük maliyetle taşınması sürecidir.


**Tanımlama (Authentication *"Sen kimsin?"*)** Kullanıcıyı tanımlama işlemidir. Kimlik bilgisi istemci tarafında servisin adresine bağlı `Refresh Token` içinde tutulur.
  - Yerel kimlik; Kullanıcı servis veya uygulamaya o platformdaki kimlik bilgileriyle giriş yapar.
  - SSO; Kullanıcı bir kimlik sağlayıcı tarafından sağlanan kimlik bilgileriyle diğer platformlarda oturum açar.
  
**Yetkilendirme (Authorization *"Neler yapabilirsin?"*)** Kullanıcının rolünü (Admin, Geliştirici, Müşteri) belirler. Yetki sınırlarını token veya yerel veritabanı üzerinden tanımlar. İstemci, servis tarafından sağlanan `Bearer : Access Token` ile diğer servislerde yetkilendirilir.


---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **SSO (Single Sign-On)**| Merkezi Kimlik Takibi| Kullanıcıların tek bir merkezi kimlik sağlayıcı üzerinden giriş yaparak tüm servislere ayrı ayrı şifre girmeden erişebilmesi yeteneğidir.|
| **OIDC (OpenID Connect)**|İletişim Standartları| SSO sürecini standartlaştıran ve uygulamaların kullanıcının kim olduğunu  güvenli şekilde öğrenmesini sağlayan kimlik protokolüdür.|
| **Authentication (AuthN)**|Kimlik Doğrulama| Kullanıcının iddia ettiği kişi olduğunu kanıtlama sürecidir. |
| **Authorization (AuthZ)**|Yetkilendirme| Kimliği doğrulanan kullanıcının hangi kaynaklara erişebileceğini belirleme sürecidir. |
| **IdP (Identity Provider)**|SSO Servisi| Kimlik doğrulamayı merkezi olarak yapan otoritedir. | 
| **Relying Party (RP / Client)**|İstemci| Kimlik doğrulama işlemini **IdP** üzerinden gerçekleştiren uygulamalardır. |
| **Resource Server**|Backend servisleri| `Bearer` anahtarını doğrulayarak işlem yapan bağımsız Backend API servisleridir. |
| **PKCE (Proof Key for Code Exchange)**| Kimlik-Takas anahtarı | SSO tarafından oluşturulan ve oturum açma sırasında kullanıcı cihazı (frontend) üzerinden istemci servisine (**ACS URL**) iletilen anahtardır. |
| **Access Token** | Yetki anahtarı | Kullanıcının Bağımsız Backend API'lere erişebileceğini kanıtlayan  kısa ömürlü (**1-15 dakika**) dijital anahtardır. |
| **Refresh Token** | Kimlik anahtarı |Süresi biten Access Token'ı kullanıcıya tekrar şifre sormadan yenilemeye yarayan uzun süreli (**24+ saat**) temel anahtardır. Periyodik olarak yenisi ile değiştirilir (**Token Rotation**) veya oturum sonlandırılır. |
| **SSO URL / Sign-In URL** | Oturum açma adresi | Kullanıcının kimlik bilgilerini girmek üzere yönlendirildiği Kimlik Sağlayıcı (Google, Microsoft Entra ID, Okta vb.) adresidir. Hizmet Sağlayıcı, oturum açma isteğini (AuthnRequest) bu adrese gönderir.|
| **ACS URL (Assertion Consumer Service URL)** | İstemci adresi | Kimlik doğrulama tamamlandıktan sonra Kimlik Sağlayıcının onay yanıtını (SAML Assertion) geri gönderdiği Hizmet Sağlayıcı adresidir. Sistemlerde "Reply URL" veya "Callback URL" olarak da adlandırılır.|
| **Entity ID / Audience URI** | Varlık Kimliği | Sistemleri birbirine tanıtan benzersiz tanımlayıcı adrestir. Çoğu zaman gerçek bir web sayfasına gitmek yerine sadece güvenlik eşleşmesi için kullanılan bir URL formatındadır. |
| **SLO URL (Single Logout URL)** | Toplu Oturum Kapatma | Kullanıcı bir uygulamadan çıkış yaptığında diğer tüm bağlı oturumların da güvenli şekilde kapatılmasını tetikleyen adrestir. |
| **Metadata URL** | Veri Tanımlama Adresi | Yukarıdaki tüm URL ve sertifika ayarlarını tek bir XML dosyası üzerinden otomatik olarak içeri aktarmayı sağlayan bağlantıdır. |


---
