---
title: >-
  Certbot: Otomatik TLS Sertifika Yönetimi ve ACME İstemcisi (Tanıtım, Referans
  ve Sözlük)
description: >-
  Certbot, Electronic Frontier Foundation (EFF) tarafından geliştirilen; Let's
  Encrypt gibi ACME uyumlu sertifika otoritelerinden ücretsiz X.509 SSL/TLS s...
outline:
  - 2
  - 3
status: published
tags:
  - certbot
  - letsencrypt
  - acme
  - tls
  - ssl
  - wildcard-certificate
  - duckdns
  - lexical-database
  - referans
---

# Certbot - TLS

* **Üretici / Geliştirici:** Electronic Frontier Foundation (EFF)
* **Resmi Web Sitesi:** [certbot.eff.org](https://eff.org)

::: info CONCEPT MATRICES
* **Domain:** Public Key Infrastructure (PKI) & Certificate Lifecycle Automation
* **Superordinate Concept:** ACME (Automatic Certificate Management Environment) Client
* **Challenge Mechanisms:** HTTP-01 (Webroot/Nginx), DNS-01 (API TXT Record Validation for Wildcards)
* **Renewal Lifecycle:** Automated 90-Day X.509 Certificate Provisioning & Zero-Downtime Reload
:::

## 1. Tanım

**Certbot**, Electronic Frontier Foundation (EFF) tarafından geliştirilen; **Let's Encrypt** gibi ACME uyumlu sertifika otoritelerinden ücretsiz X.509 SSL/TLS sertifikalarını otomatik olarak talep eden, alan adı sahipliğini doğrulayan ve süresi dolmadan yenileyerek web sunucularına (Nginx) entegre eden açık kaynaklı bir komut satırı aracıdır.

---

## 2. Mimari Rolü ve Temel Prensipleri

**Certbot**, **DuckDNS** eklentisi (`certbot-dns-duckdns`) ile birlikte çalışarak `*.projeadi.duckdns.org` biçiminde tek bir **Wildcard TLS** sertifikası üretir. Kapalı  **Tailscale** (vpn-local) ağı içindeki tüm alt alan adları,  geçerli ve güvenilir HTTPS sertifikasına sahip olur.


* **DNS-01 Doğrulama Avantajı:** Standart HTTP-01 doğrulaması sunucunun genel internete açık olmasını gerektirirken, DNS-01 doğrulaması DuckDNS API anahtarı aracılığıyla DNS'e geçici bir `TXT` kaydı yazarak kapalı ağdaki sunuculara bile geçerli Wildcard sertifikası alınmasını sağlar.
* **90 Günlük Otomatik Yaşam Döngüsü:** Let's Encrypt sertifikaları güvenlik gereği 90 gün geçerlidir. Certbot, sistem zamanlayıcısı (`systemd timer` veya `cron`) üzerinden günde iki kez kontrol yapar ve bitimine 30 günden az kalan sertifikaları arka planda yenileyip Nginx'i kesintisiz (`reload`) günceller.

---

## 3. Sözlük Veritabanı (Lexical Database)

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **ACME Protocol** | Otomatik Sertifika Yönetimi Protokolü | Sertifika otoritesi (CA) ile sunucu arasındaki sertifika talep, doğrulama ve iptal işlemlerini insan müdahalesi olmadan yürüten standart (RFC 8555). |
| **DNS-01 Challenge** | DNS Tabanlı Doğrulama | Alan adı sahipliğini kanıtlamak için `_acme-challenge` alt alan adına geçici bir DNS `TXT` kaydı eklenmesi yöntemi. |
| **Wildcard Certificate** | Joker Sertifika | Tek bir sertifika dosyasıyla bir alan adının tüm birinci seviye alt alan adlarını (`*.projeadi.duckdns.org`) kapsayan dijital sertifika. |
| **Fullchain (`fullchain.pem`)** | Tam Sertifika Zinciri | Sunucu sertifikası ile ara sertifika otoritesi (Intermediate CA) imzalarını tek dosyada birleştiren ve Nginx'e tanıtılan dosya. |
| **Private Key (`privkey.pem`)** | Özel Anahtar | TLS şifreleme el sıkışmasında sunucu kimliğini kanıtlayan, kesinlikle gizli tutulması gereken kriptografik anahtar dosyası. |
| **Deploy Hook** | Yenileme Sonrası Kancası | Sertifika başarıyla yenilendiği anda otomatik tetiklenen kabuk komutu (Örn: `systemctl reload nginx`). |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

```bash
# DuckDNS DNS-01 doğrulaması ile Wildcard TLS sertifikası üretir
certbot certonly \
  --authenticator dns-duckdns \
  --dns-duckdns-credentials /etc/letsencrypt/duckdns.ini \
  --dns-duckdns-propagation-seconds 60 \
  -d "*.projeadi.duckdns.org" \
  -d "projeadi.duckdns.org"

# Sunucuda kayıtlı tüm sertifikaları ve kalan geçerlilik günlerini listeler
sudo certbot certificates

# Gerçek yenileme yapmadan yenileme sürecini simülasyon (dry-run) modunda test eder
sudo certbot renew --dry-run
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [Certbot User Guide](https://readthedocs.io)
* **Let's Encrypt Doğrulama Türleri:** [Challenge Types (HTTP-01 vs DNS-01)](https://letsencrypt.org)
