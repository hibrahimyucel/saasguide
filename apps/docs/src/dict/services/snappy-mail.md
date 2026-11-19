---
title: SnappyMail
description: Düşük bellek tüketimli, modern arayüzlü ve OAuth2/OIDC destekli web tabanlı e-posta istemcisi.
category: Infrastructure & Communication
tags: [webmail, client, oidc, lightweight, docker]
---

# SnappyMail

* **Üretici / Geliştirici:** DJMaze (Açık Kaynak Topluluğu / RainLoop Fork)
* **Resmi Web Sitesi:** [snappymail.eu](https://snappymail.eu)

::: info CONCEPT MATRICES

| Attribute | Value |
| :--- | :--- |
| **Architecture** | Stateless PHP 8 + Nginx Alpine Container |
| **Supported Protocols** | IMAP, SMTP, Sieve, CardDAV, CalDAV |
| **Authentication** | OAuth 2.0 / OIDC (Dex SSO Compatible), 2FA (TOTP) |
| **Encryption** | Built-in OpenPGP & S/MIME Support |
| **Resource Footprint** | Minimal (~40 MB – 80 MB RAM) |
:::

## Resmi Tanım
**SnappyMail**, klasik veritabanı bağımlılıklarına ihtiyaç duymadan çalışan, hızlı önbellekleme mekanizmasına, yerleşik OpenPGP şifreleme desteğine ve modern arayüze sahip hafif bir webmail istemcisidir.

## Sözlük Veritabanı (Lexical Database)
* **Stateless Webmail:** Kullanıcı e-postalarını kendi içinde kopyalamak yerine doğrudan arka plandaki IMAP/JMAP sunucusuyla anlık haberleşen, disk ve veritabanı yükü oluşturmayan istemci mimarisi.
* **Sieve Filtreleme:** İstemci cihaz kapalı olsa dahi sunucu tarafında (Stalwart üzerinde) çalışan kural motoruna kural yazma yeteneği.
* **OpenPGP (Pretty Good Privacy):** Tarayıcı tabanlı anahtar çifti yönetimiyle uçtan uca şifreli ve dijital imzalı e-posta gönderimi sağlayan kriptografik standart.

## Cheatsheet (Hızlı Başvuru)
* **Konteyner İç Portu:** `8888` (HTTP)
* **Yönetim Paneli URL:** `https://alanadiniz.com`
* **Varsayılan Admin Kullanıcı Adı:** `admin`
* **İlk Kurulum Admin Şifre Dosyası:** `/var/lib/snappymail/_data_/_default_/admin_password.txt`

