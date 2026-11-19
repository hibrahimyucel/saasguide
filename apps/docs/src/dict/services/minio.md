---
title: >-
  MinIO: S3 Uyumlu Yüksek Performanslı Nesne Depolama (Tanıtım, Referans ve
  Sözlük)
description: >-
  MinIO, bulut yerel (cloud-native) uygulamalar için Go diliyle geliştirilmiş;
  Amazon S3 API protokolüyle %100 uyumlu, yüksek performanslı, dağıtık ve ken...
outline:
  - 2
  - 3
status: published
tags:
  - minio
  - object-storage
  - s3-compatible
  - storage
  - erasure-coding
  - lexical-database
  - referans
  - altyapi-katman-8
---

# MinIO (S3 Object Storage)

* **Üretici / Geliştirici:** Anand Babu Periasamy, Harshavardhana & MinIO, Inc.
* **Resmi Web Sitesi:** [min.io](https://min.io)

::: info CONCEPT MATRICES
* **Domain:** Distributed Cloud-Native Object Storage
* **Superordinate Concept:** S3-Compatible Storage System
* **Implementation Language:** Go (Golang) with SIMD Assembly Optimizations
* **Data Protection:** Inline Erasure Coding & HighwayHash Bitrot Protection
:::

## 1. Resmi Tanım (Formal Definition)

**MinIO**, bulut yerel (cloud-native) uygulamalar için Go diliyle geliştirilmiş; Amazon S3 API protokolüyle %100 uyumlu, yüksek performanslı, dağıtık ve kendi sunucunuzda barındırabileceğiniz (self-hosted) açık kaynaklı bir nesne depolama (object storage) sistemidir.

---

## 2. Mimari Rolü ve Temel Prensipleri

Uygulama görselleri, PDF belgeleri, kullanıcı yüklemeleri, VitePress dokümantasyon diyagramları ve veritabanı yedekleri gibi yapılandırılmamış büyük dosyaları uygulama konteynerlerinden ayrı olarak saklar. Böylece uygulama konteynerleri hafif ve durumsuz (stateless) kalırken, gelecekte Amazon AWS S3 veya Cloudflare R2 gibi bulut servislerine sıfır kod değişikliğiyle geçiş imkanı sağlanır.

* **Tam Amazon S3 API Uyumluluğu:** Endüstri standardı olan S3 protokolünü desteklediği için mevcut tüm AWS SDK'ları (`@aws-sdk/client-s3`), yedekleme araçları ve CLI istemcileriyle doğrudan çalışır.
* **Çift Port Mimarisi (API ve Yönetim Konsolu):** MinIO iki ayrı arayüz sunar: Uygulamaların ve SDK'ların programatik olarak dosya okuyup yazdığı **S3 API Portu (`9000`)** ve yöneticilerin tarayıcı üzerinden kova (bucket) ve yetki yönetimi yaptığı **Web Yönetim Konsolu (`9001`)**.
* **Bitrot Koruması ve Veri Bütünlüğü:** Depolanan her nesneyi **HighwayHash** algoritmasıyla anlık olarak doğrular ve sessiz veri bozulmalarına (bitrot) karşı koruma sağlar.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Object Storage** | Nesne Depolama | Verileri hiyerarşik klasörler yerine düz bir adres uzayında; veri, üst veri (metadata) ve benzersiz kimlikten oluşan "nesneler" halinde saklayan mimari. |
| **Bucket** | Depolama Kovası | Nesnelerin içinde gruplandığı ve erişim politikalarının tanımlandığı en üst düzey mantıksal kapsayıcı (Örn: `docs-assets`, `user-uploads`). |
| **Object Key** | Nesne Anahtarı | Bir kova içindeki dosyanın benzersiz tam yolu ve adı (Örn: `diagrams/infra-architecture.png`). |
| **Presigned URL** | Ön İmzalı Geçici Bağlantı | Özel (private) bir kovadaki dosyaya belirli bir süre için (örneğin 15 dakika) güvenli indirme veya yükleme izni veren kriptografik imzalı URL. |
| **Access Key / Secret Key** | Erişim ve Gizli Anahtar | Uygulamaların S3 API üzerinden kimlik doğrulaması yapmak için kullandığı kullanıcı adı ve parola çifti. |
| **Bucket Policy** | Kova Erişim Politikası | Bir kovanın herkese açık okunabilir (`public-read`) mi yoksa yalnızca yetkili anahtarlara mı açık (`private`) olacağını belirleyen JSON kuralı. |
| **MinIO Client (`mc`)** | Komut Satırı İstemcisi | MinIO ve diğer S3 uyumlu sunucular üzerinde dosya kopyalama, senkronizasyon ve kova yönetimi sağlayan modern CLI aracı. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

MinIO Client (`mc`) aracı ile kova oluşturma, dosya aktarma ve politika yönetimi için en sık kullanılan temel komutlar:

### Sunucu Bağlantısı (Alias Tanımlama)
```bash
# Yerel veya Tailscale üzerindeki MinIO sunucusuna 'myminio' takma adıyla bağlanır
mc alias set myminio http://127.0.0.1:9000 <ACCESS_KEY> <SECRET_KEY>

# Sunucu bağlantı durumunu ve depolama istatistiklerini görüntüler
mc admin info myminio
```

### Kova (Bucket) ve Dosya İşlemleri
```bash
# Yeni bir depolama kovası oluşturur
mc mb myminio/docs-assets

# Yerel bir dosyayı veya klasörü MinIO kovasına yükler
mc cp ./mimari-sema.png myminio/docs-assets/

# Kova içeriğini listeler
mc ls myminio/docs-assets

# Bir klasörü kovayla canlı olarak senkronize eder (yedekleme için idealdir)
mc mirror ./backups myminio/system-backups
```

### Erişim Politikası Yönetimi
```bash
# Dokümantasyon görselleri için kovayı dışarıdan okumaya (public download) açar
mc anonymous set download myminio/docs-assets

# Kovayı tekrar tamamen özel (private) duruma getirir
mc anonymous set none myminio/docs-assets
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [MinIO Object Storage Documentation](https://min.iodocs/minio/linux/index.html)
* **MinIO Client (`mc`) Rehberi:** [MinIO Client Complete Guide](https://min.iodocs/minio/linux/reference/minio-mc.html)
* **JavaScript / Node.js SDK Kullanımı:** [MinIO JavaScript Client SDK](https://min.iodocs/minio/linux/developers/javascript/minio-javascript.html)
