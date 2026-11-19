---
title: E-Posta Sunucusu DNS ve Teslim Edilebilirlik (Deliverability) Yapılandırması
description: Stalwart Mail Server için MX, A, PTR, SPF, DKIM ve DMARC kayıtlarının standart kurulum rehberi.
category: DevOps & Networking
tags: [dns, mx, spf, dkim, dmarc, ptr, mail]
---

# E-Posta Servisi DNS Yapılandırması

> **Mimari Not:** DuckDNS alt alan adları (`*.duckdns.org`) dinamik A/AAAA kayıtları için idealdir ancak özel `MX` ve `TXT` (DKIM/DMARC) kayıtlarında kısıtlamalara sahiptir. Canlı e-posta alışverişi için kendi alan adınızın (ör. `pr2.com.tr`) DNS yönetim panelini kullanın; `://pr2.com.tr` kaydını sunucu IP adresinize (veya CNAME ile DuckDNS adresinize) yönlendirin.

## 1. Temel Yönlendirme Kayıtları (DNS Paneli)

| Kayıt Türü | Ad / Host (Name) | Değer / Hedef (Value) | Öncelik (Priority) | TTL | Açıklama |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | `mail` | `<SUNUCU_PUBLIC_IP>` | - | 300 | Posta sunucusunun doğrudan IPv4 adresi. |
| **A** | `webmail` | `<SUNUCU_PUBLIC_IP>` | - | 300 | SnappyMail arayüzü (Nginx Reverse Proxy üzerinden). |
| **MX** | `@` | `://alanadiniz.com` | `10` | 300 | Alan adına gelen e-postaların teslim edileceği sunucu. |

## 2. Ters DNS (PTR / rDNS) Kaydı (VPS Sağlayıcı Paneli)
* **Nereden Yapılır?** Alan adı DNS panelinden değil, **VPS / Sunucu sağlayıcınızın** ağ/IP yönetim panelinden tanımlanır.
* **Kayıt:** `<SUNUCU_PUBLIC_IP>` $\rightarrow$ `://alanadiniz.com`
* **Önemi:** PTR kaydı olmayan sunuculardan çıkan e-postalar Gmail ve Outlook tarafından doğrudan reddedilir.

## 3. Kimlik Doğrulama ve Anti-Spam Kayıtları (TXT)

| Kayıt Türü | Ad / Host (Name) | Değer (Value) | Görevi |
| :--- | :--- | :--- | :--- |
| **TXT (SPF)** | `@` | `v=spf1 mx a:://alanadiniz.com -all` | Yalnızca tanımlı MX ve mail sunucusunun bu alan adı adına mail göndermesine izin verir. |
| **TXT (DKIM)** | `default._domainkey` | `v=DKIM1; k=rsa; p=<STALWART_PUBLIC_KEY>` | Stalwart yönetim panelinden üretilen açık anahtar (Public Key) ile giden mailleri kriptografik olarak imzalar. |
| **TXT (DMARC)** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@alanadiniz.com; pct=100; adkim=s; aspf=s` | SPF ve DKIM doğrulamasından geçemeyen sahte e-postaların karantinaya alınmasını ve raporlanmasını sağlar. |

## 4. Sunucu Güvenlik Duvarı (firewalld) Port Kontrolü
Stalwart konteynerinin dış dünyayla mail alışverişi yapabilmesi için ana sunucuda (`eth0`) şu portların açık olması gerekir:
* **`25/tcp`** (SMTP - Sunucular arası gelen/giden posta)
* **`465/tcp`** (SMTPS - İstemci güvenli gönderim)
* **`587/tcp`** (Submission - STARTTLS istemci gönderim)
* **`993/tcp`** (IMAPS - Şifreli gelen kutusu erişimi)
* **`443/tcp`** (HTTPS - Nginx üzerinden SnappyMail ve JMAP erişimi)

