---
title: >-
  TLS: Taşıma Katmanı Güvenliği Protokolü (Kavramsal Tanıtım, Referans ve
  Sözlük)
description: >-
  TLS (Transport Layer Security), eski SSL (Secure Sockets Layer) protokolünün
  yerini alan; bilgisayar ağları üzerinden gerçekleşen iletişimlerde gizlilik...
outline:
  - 2
  - 3
status: published
tags:
  - tls
  - ssl
  - https
  - cryptography
  - certificates
  - x509
  - lexical-database
  - referans
---

# TLS (Transport Layer Security)

* **Standart / Geliştirici:** IETF (Internet Engineering Task Force)
* **İlgili Standartlar:** RFC 8446 (TLS 1.3), RFC 5246 (TLS 1.2)

::: info CONCEPT MATRICES
* **Domain:** Cryptographic Network Protocols & Communications Security
* **Superordinate Concept:** Transport Layer Cryptographic Protocol (Successor to SSL)
* **Cryptographic Primitives:** Asymmetric Key Exchange (ECDHE), X.509 Digital Certificates, AEAD Symmetric Encryption (AES-GCM, ChaCha20-Poly1305)
* **Handshake Latency:** 1-RTT (Full Handshake) & 0-RTT (Session Resumption in TLS 1.3)
:::

## 1. Tanım

**TLS (Transport Layer Security)**, eski SSL (Secure Sockets Layer) protokolünün yerini alan; bilgisayar ağları üzerinden gerçekleşen iletişimlerde gizlilik (şifreleme), veri bütünlüğü ve kimlik doğrulama bilgilerini sağlamak üzere tasarlanmış standart bir kriptografik güvenlik protokolüdür.

---

## 2. Mimari Rolü ve Temel Prensipleri

**TLS**,  harici istemcilerin veya tarayıcıların güvenli bağlam (`HTTPS`, WebCrypto API, Service Workers) taleplerini karşılamak için **Nginx** tarafından yürütülür. Yalıtılmış servisler için gateway arkasında sonlandırılabilir (TLS Termination). 

* **Üç Temel Güvenlik Garantisi:**
  * **Gizlilik (Privacy):** İletilen veriler oturuma özel simetrik anahtarlarla şifrelenir; üçüncü taraflarca okunamaz.
  * **Kimlik Doğrulama (Authentication):** Sunucunun gerçekten iddia ettiği alan adına (`docs.100-84-12-45.nip.io`) ait olduğu dijital sertifikalarla kanıtlanır.
  * **Bütünlük (Integrity):** İletim sırasında verinin tek bir bitinin bile değiştirilmediği mesaj doğrulama kodlarıyla (MAC) garanti edilir.
* **Hibrit Şifreleme Modeli:** Bağlantı başlangıcında (**TLS Handshake**) tarafların birbirini doğrulaması ve ortak bir gizli anahtar üretmesi için asimetrik şifreleme (RSA / ECDSA / ECDHE) kullanılır. Anahtar belirlendikten sonra gerçek veri transferi çok daha hızlı olan simetrik şifreleme (AES-256-GCM veya ChaCha20-Poly1305) ile sürdürülür.
* **TLS 1.3 İyileştirmeleri:** Eski şifreleme algoritmalarını tamamen kaldırmış, el sıkışma (handshake) süresini tek gidiş-dönüşe (**1-RTT**) indirerek bağlantı kurulumunu hızlandırmıştır.

---

## 3. Sözlük Veritabanı (Lexical Database)

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **HTTPS** | Güvenli HTTP | Standart HTTP protokolünün TLS şifreleme katmanı üzerinden çalıştırılan güvenli biçimi (Varsayılan Port: `443`). |
| **TLS Handshake** | TLS El Sıkışması | İstemci ile sunucunun protokol sürümünde anlaştığı, sertifikaları doğruladığı ve ortak oturum anahtarı ürettiği başlangıç süreci. |
| **X.509 Certificate** | Dijital Sertifika | Bir alan adının açık anahtarını (public key) ve kimlik bilgilerini yetkili bir otoritenin dijital imzasıyla bağlayan standart belge. |
| **CA (Certificate Authority)** | Sertifika Otoritesi | Dijital sertifikaları imzalayan ve güvenilirliğini garanti eden kurum (Örn: Let's Encrypt, ZeroSSL). |
| **ACME Protocol** | Otomatik Sertifika Yönetimi | Let's Encrypt gibi otoritelerden TLS sertifikası alma ve yenileme işlemlerini otomatikleştiren protokol (Örn: Certbot, Caddy). |
| **SNI (Server Name Indication)** | Sunucu Adı Göstergesi | Tek bir IP adresinde barındırılan birden fazla alan adı için Nginx'in doğru TLS sertifikasını seçmesini sağlayan TLS uzantısı. |
| **HSTS** | HTTP Sıkı Taşıma Güvenliği | Tarayıcılara ilgili siteye yalnızca şifreli HTTPS üzerinden bağlanmasını zorunlu kılan güvenlik başlığı. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

Sertifika oluşturma, inceleme ve TLS bağlantı teşhisi için kullanılan temel `openssl` ve `curl` komutları:

```bash
# Bir sunucunun sunduğu TLS sertifikasını, geçerlilik tarihini ve TLS sürümünü test eder
openssl s_client -connect docs.100-84-12-45.nip.io:443 -servername docs.100-84-12-45.nip.io

# Yerel testler için kendinden imzalı (self-signed) TLS sertifikası ve özel anahtar üretir
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout selfsigned.key -out selfsigned.crt \
  -subj "/CN=docs.100-84-12-45.nip.io"

# curl ile HTTPS bağlantısının TLS el sıkışma detaylarını görüntüler
curl -vI https://nip.io
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **TLS 1.3 Standardı:** [RFC 8446 - The Transport Layer Security (TLS) Protocol Version 1.3](https://ietf.org)
* **Ücretsiz Otomatik Sertifika Otoritesi:** [Let's Encrypt Documentation](https://letsencrypt.org)
* **Mozilla Sunucu TLS Yapılandırma Rehberi:** [Mozilla SSL Configuration Generator](https://mozilla.org)
