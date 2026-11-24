---
title: "MariaDB"
description: "pr2cloud altyapısında uygulamalar için kullanılan açık kaynaklı, yüksek performanslı ilişkisel veritabanı yönetim sistemi (RDBMS) sözlük ve kavram rehberi."
outline: [2, 3]
sidebarTitle: "MariaDB"
index: 16
isContent: true
hidden: false
status: "published"
tags: ["database", "rdbms", "mariadb", "sql", "storage", "backend"]
---

# MariaDB

* **Geliştirici / Vakıf:** MariaDB Foundation & MariaDB plc
* **Resmi Web Sitesi:** [mariadb.org](https://mariadb.org)
* **Mimari Rol:** İlişkisel Veritabanı Sunucusu (`pr2_internal_net` içi TCP :3306)

::: info CONCEPT MATRICES
* **Category:** Relational Database Management System (RDBMS)
* **Core Engine:** InnoDB (ACID-compliant, Row-level locking, MVCC)
* **Protocol & Port:** MySQL Wire Protocol / TCP `3306` (Internal Only)
* **Network Boundary:** Strictly isolated inside `pr2_internal_net` (No public exposure)
* **Persistence Path:** `pr2cloud/data/mariadb` (Bind Mount)
* **Configuration File:** `pr2cloud/prod/mariadb/my.cnf`
* **Management Interface:** phpMyAdmin (`db.<domain>` via Tailscale + Dex SSO)
:::

## Resmi Tanım

**MariaDB**, MySQL'in orijinal geliştiricileri tarafından oluşturulan, açık kaynaklı ve topluluk odaklı bir **İlişkisel Veritabanı Yönetim Sistemidir (RDBMS)**. Yüksek performans, kararlılık ve düşük kaynak tüketimi hedefleriyle tasarlanan MariaDB; standart SQL sorgulama dilini destekler ve ACID (Atomicity, Consistency, Isolation, Durability) uyumlu **InnoDB** depolama motorunu varsayılan olarak kullanır.

**pr2cloud** mimarisinde MariaDB; dış internete tamamen kapalı olan `pr2_internal_net` ağında çalışır ve yalnızca API katmanı ile `db.<domain>` üzerindeki phpMyAdmin arayüzünden erişilebilir durumdadır.

## Sözlük Veritabanı (Lexical Database)

| Terim | İngilizce Karşılığı | Teknik Açıklama |
| :--- | :--- | :--- |
| **İlişkisel Veritabanı** | Relational Database (RDBMS) | Verileri birbirleriyle ilişkili tablolar (satır ve sütunlar) halinde organize eden veritabanı modeli. |
| **Depolama Motoru** | Storage Engine | Verilerin disk üzerinde nasıl yazılacağını, okunacağını ve indeksleneceğini yöneten alt sistem (Örn: `InnoDB`, `Aria`). |
| **ACID Uyumluluğu** | ACID Compliance | Veritabanı işlemlerinin (transactions) güvenilirliğini garanti eden dört temel ilke (Bölünmezlik, Tutarlılık, İzolasyon, Dayanıklılık). |
| **Karakter Seti & Karşılaştırma** | Charset & Collation | Metin verilerinin bayt düzeyinde kodlanmasını (`utf8mb4`) ve sıralama/karşılaştırma kurallarını (`utf8mb4_unicode_ci`) belirleyen yapı. |
| **İkincil Günlük** | Binary Log (Binlog) | Veritabanında veri değişikliği yapan tüm olayları kaydeden; replikasyon ve anlık kurtarma (PITR) için kullanılan günlük dosyası. |
| **Bağlantı Havuzu** | Connection Pool | Her istekte yeni TCP/SQL oturumu açma maliyetini önlemek için açık veritabanı bağlantılarını önbellekte tutan mekanizma. |
| **Şema / Veritabanı** | Schema / Database | Tabloları, görünümleri (views), saklı yordamları ve indeksleri mantıksal olarak gruplayan kapsayıcı yapı. |

## Cheatsheet (Hızlı Başvuru)

### Konteyner İçi Bağlantı ve Yönetim
```bash
# Çalışan MariaDB konteynerine root olarak bağlanma
docker exec -it pr2_mariadb mariadb -u root -p

# Veritabanı sunucu durumunu ve çalışma süresini kontrol etme
docker exec -it pr2_mariadb mariadb-admin -u root -p status
```

### Temel SQL ve Kullanıcı İşlemleri
```sql
-- UTF8MB4 destekli yeni bir uygulama veritabanı oluşturma
CREATE DATABASE app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Yalnızca internal ağdan erişebilecek uygulama kullanıcısı tanımlama
CREATE USER 'app_user'@'%' IDENTIFIED BY 'guclu_parola';
GRANT ALL PRIVILEGES ON app_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;

-- Mevcut veritabanlarını ve boyutlarını (MB) listeleme
SELECT table_schema AS "Veritabanı", 
       ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS "Boyut (MB)" 
FROM information_schema.TABLES 
GROUP BY table_schema;
```

### Yedekleme ve Geri Yükleme (Backup & Restore)
```bash
# Tek bir veritabanının SQL yedeğini alma
docker exec pr2_mariadb mariadb-dump -u root -p app_db > ./backup_app_db.sql

# SQL yedeğini veritabanına geri yükleme
docker exec -i pr2_mariadb mariadb -u root -p app_db < ./backup_app_db.sql
```
