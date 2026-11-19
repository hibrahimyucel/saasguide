---
title: 'DNS: Alan Adı Sistemi (Kavramsal Tanıtım, Referans ve Sözlük)'
description: >-
  DNS (Domain Name System), insanların okuyabileceği alan adlarını (example.com)
  bilgisayarların ve ağ cihazlarının birbirini bulmak için kullandığı sayıs...
outline:
  - 2
  - 3
status: published
tags:
  - dns
  - domain-name-system
  - resolution
  - records
  - lexical-database
  - referans
---

# DNS

### Alan Adı Sistemi - Domain Name System

* **Standart / Geliştiriciler:** Paul Mockapetris (1983) & IETF (Internet Engineering Task Force)
* **İlgili Standartlar:** RFC 1034, RFC 1035

::: info CONCEPT MATRICES
* **Domain:** Internet Naming & Distributed Directory Services
* **Superordinate Concept:** Hierarchical Decentralized Naming System
* **Transport Protocols:** UDP Port 53 (Standard Queries), TCP Port 53 (Zone Transfers / Large Responses)
* **Resolution Architecture:** Recursive Resolvers -> Root -> TLD -> Authoritative Name Servers
:::

## 1. Tanım

**DNS (Domain Name System)**, insanların okuyabileceği alan adlarını (`example.com`) bilgisayarların ve ağ cihazlarının birbirini bulmak için kullandığı sayısal IP adreslerine (`100.84.12.45`) dönüştüren hiyerarşik ve dağıtık bir isim çözümleme sistemidir.

---

## 2. Mimari Rolü ve Temel Prensipleri

DNS, tek adres üzerinde onlarca farklı servisi (`gitea`, `minio`, `docs`) konumlandırmamızı sağlayan temel mekanizmadır.
 - **nip.io** alan adı satın alma veya manuel DNS kaydı girme zahmetini ortadan kaldıran özel bir *Wildcard DNS* uygulamasıdır.
 - **duckdns.org** okunabilir bir alt alan adı ve geçerli sertifika kullanabileceğiniz bir diğer servistir. 

* **Hiyerarşik İsim Uzayı:** DNS, sağdan sola doğru okunan ağaç yapısında çalışır.
* **Dağıtık Önbellekleme (Caching):** Her sorgunun kök sunuculara kadar gitmesini önlemek için işletim sistemleri, yönlendiriciler ve DNS çözümleyiciler sonuçları **TTL (Time-To-Live)** süresi boyunca önbellekte tutar.
* **Sanal Barındırma (Virtual Hosting) Desteği:** Tarayıcı bir alan adını DNS ile IP'ye çevirdikten sonra HTTP isteğinin içine `Host: docs.100-84-12-45.nip.io` başlığını ekler; böylece router (Nginx) isteği doğru konteynere yönlendirir.

---

## 3. Sözlük Veritabanı (Lexical Database)

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **A Record** | IPv4 Adres Kaydı | Bir alan adını veya alt alan adını doğrudan 32-bitlik bir IPv4 adresine eşleyen temel DNS kaydı. |
| **AAAA Record** | IPv6 Adres Kaydı | Bir alan adını 128-bitlik bir IPv6 adresine eşleyen DNS kaydı. |
| **CNAME Record** | Takma Ad Kaydı | Bir alan adını doğrudan bir IP adresine değil, başka bir alan adına yönlendiren kayıt türü. |
| **Wildcard DNS (`*`)** | Joker Alt Alan Adı Kaydı | Tanımlanmamış tüm alt alan adlarını (`*.100-84-12-45.nip.io`) tek bir kural üzerinden hedef IP adresine yönlendiren dinamik DNS kaydı. |
| **TTL (Time-To-Live)** | Yaşam Süresi | Bir DNS kaydının çözümleyici önbelleklerinde saniye cinsinden ne kadar süre saklanacağını belirleyen değer. |
| **Authoritative Name Server** | Yetkili İsim Sunucusu | İlgili alan adının gerçek ve nihai IP kayıtlarını barındıran, sorgulara kesin yanıt veren kaynak sunucu. |
| **Recursive Resolver** | Özyinelemeli Çözümleyici | İstemciden gelen DNS sorgusunu alıp kök ve yetkili sunucuları sırayla gezerek sonucu istemciye getiren aracı DNS sunucusu (Örn: `1.1.1.1`, `8.8.8.8`). |
| **Propagation** | DNS Yayılımı | Yapılan bir DNS kaydı değişikliğinin TTL sürelerine bağlı olarak dünya genelindeki önbelleklere yansıma süreci. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

Alan adı çözümlemelerini test etmek, DNS kayıtlarını sorgulamak ve yerel önbelleği temizlemek için kullanılan temel komutlar:

```bash
# Bir alan adının hangi IP adresine çözümlendiğini detaylı sorgular
dig docs.100-84-12-45.nip.io +short

# Belirli bir DNS sunucusu (örneğin Cloudflare 1.1.1.1) üzerinden sorgulama yapar
nslookup gitea.100-84-12-45.nip.io 1.1.1.1

# Linux (systemd-resolved) üzerinde yerel DNS önbelleğini temizler
sudo resolvectl flush-caches
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **DNS Temel Standartları:** [RFC 1034 - Domain Names: Concepts and Facilities](https://ietf.org)
* **DNS Uygulama ve Protokol Spesifikasyonu:** [RFC 1035 - Domain Names: Implementation and Specification](https://ietf.org)
