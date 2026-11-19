---
title: Stalwart Mail Server
description: Rust tabanlı, düşük kaynak tüketimli, yerleşik OIDC ve JMAP/IMAP/SMTP destekli modern e-posta sunucusu.
category: Infrastructure & Communication
tags: [mail-server, smtp, imap, jmap, rust, oidc, self-hosted]
---

# Stalwart Mail Server

* **Üretici / Geliştirici:** Stalwart Labs Ltd.
* **Resmi Web Sitesi:** [stalw.art](https://stalw.art)

::: info CONCEPT MATRICES

| Attribute | Value |
| :--- | :--- |
| **Architecture** | Single-Binary / Modular Rust Engine |
| **Protocols** | SMTP, IMAP4rev2, JMAP (RFC 8620), ManageSieve |
| **Authentication** | Built-in OAuth 2.0 / OIDC (Dex Compatible), LDAP, SQLite |
| **Security & Anti-Spam** | Built-in SPF, DKIM, DMARC, ARC, DANE, MTA-STS, TLS-RPT |
| **Resource Footprint** | Ultra-Low (~50 MB – 120 MB RAM) |
:::

## Resmi Tanım
**Stalwart Mail Server**, bellek güvenliği ve yüksek eşzamanlılık sunan **Rust** diliyle geliştirilmiş; SMTP, IMAP ve modern JMAP protokollerini tek bir hafif mimaride birleştiren açık kaynaklı ve kurumsal sınıf bir e-posta sunucusudur.

## Sözlük Veritabanı (Lexical Database)
* **JMAP (JSON Meta Application Protocol):** Geleneksel IMAP protokolünün yerini almak üzere tasarlanmış, HTTP/2 ve JSON tabanlı, mobil cihazlarda pil ve bant genişliği dostu modern e-posta senkronizasyon protokolü.
* **MTA-STS (Mail Transfer Agent Strict Transport Security):** E-posta sunucuları arasındaki SMTP trafiğinin yalnızca geçerli TLS sertifikası ile şifrelenmiş kanallar üzerinden yapılmasını zorunlu kılan güvenlik standardı.
* **DANE (DNS-based Authentication of Named Entities):** TLS sertifikalarının DNSSEC korumalı DNS kayıtları (`TLSA`) üzerinden doğrulanmasını sağlayan kriptografik güvenlik mekanizması.
* **ManageSieve:** Kullanıcıların gelen e-postaları sunucu tarafında otomatik olarak klasörlemesini, yönlendirmesini veya filtrelemesini sağlayan Sieve betik yönetim protokolü.

## Cheatsheet (Hızlı Başvuru)
* **Varsayılan Web Yönetim Paneli:** `http://127.0.0.1:8080`
* **Giden Posta (SMTP Submission):** Port `587` (STARTTLS) / Port `465` (Implicit TLS)
* **Sunucular Arası Posta (SMTP MTA):** Port `25`
* **Gelen Posta (IMAPS):** Port `993` (TLS)
* **Veri ve Konfigürasyon Dizini:** `/opt/stalwart-mail`

