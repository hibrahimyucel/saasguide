---
title: "phpMyAdmin"
description: "pr2cloud altyapısında MariaDB veritabanlarını web tarayıcısı üzerinden yönetmek için kullanılan açık kaynaklı yönetim arayüzü sözlük ve kavram rehberi."
outline: [2, 3]
sidebarTitle: "phpMyAdmin"
index: 17
isContent: true
hidden: false
status: "published"
tags: ["database", "phpmyadmin", "mariadb", "gui", "administration", "sql"]
---

# phpMyAdmin

* **Geliştirici / Vakıf:** The phpMyAdmin Project (Software Freedom Conservancy)
* **Resmi Web Sitesi:** [phpmyadmin.net](https://phpmyadmin.net)
* **Mimari Rol:** Web Tabanlı MariaDB Yönetim Arayüzü (`db.<domain>` — Tailscale + Dex SSO)

::: info CONCEPT MATRICES
* **Category:** Web-Based Database Administration Tool (GUI)
* **Target Engine:** MariaDB / MySQL (`pr2_internal_net:3306`)
* **Runtime & Port:** PHP + Apache/Nginx Container (`:80` Internal HTTP)
* **Network Bridge:** Dual-NIC (`pr2_edge_net` for Reverse Proxy + `pr2_internal_net` for MariaDB access)
* **Security Boundary:** Zero public exposure; protected via Tailscale VPN + Nginx + Dex OIDC SSO
* **Primary Operations:** Schema design, SQL execution, User/Privilege management, SQL/CSV Import-Export
:::

## Resmi Tanım

**phpMyAdmin**, PHP diliyle yazılmış, MySQL ve **MariaDB** veritabanlarını web tarayıcısı üzerinden görsel bir arayüzle (GUI) yönetmeyi sağlayan açık kaynaklı bir veritabanı yönetim aracıdır. Komut satırı (CLI) gerektirmeden veritabanı oluşturma, tablo ve indeks düzenleme, karmaşık SQL sorguları çalıştırma, kullanıcı yetkilerini yapılandırma ve veri içe/dışa aktarma (Import/Export) işlemlerini destekler.

**pr2cloud** mimarisinde phpMyAdmin; dış dünyaya kapalı olan `pr2_mariadb` sunucusuna `pr2_internal_net` üzerinden bağlanır ve yalnızca **Tailscale VPN** ile **Dex SSO** kimlik doğrulamasını geçen yetkili yöneticilere `db.<domain>` alt alan adı üzerinden sunulur.

## Sözlük Veritabanı (Lexical Database)

| Terim | İngilizce Karşılığı | Teknik Açıklama |
| :--- | :--- | :--- |
| **İçe / Dışa Aktarma** | Import / Export | Veritabanı şemalarını ve verilerini `.sql`, `.csv`, `.json` veya `.xml` formatlarında dışarı alma ya da sisteme yükleme işlemi. |
| **Blowfish Gizli Anahtarı** | Blowfish Secret | Çerez (cookie) tabanlı kimlik doğrulamada oturum parolalarını şifrelemek için kullanılan 32 karakterlik rastgele güvenlik anahtarı. |
| **Yapılandırma Depolaması** | phpMyAdmin Configuration Storage (`pmadb`) | Yer imleri, SQL sorgu geçmişi, PDF şema çizimleri ve tablo ilişkileri gibi arayüz özelliklerini saklayan yardımcı sistem veritabanı. |
| **Yetki Yönetimi** | User & Privilege Management | Veritabanı kullanıcılarının hangi sunuculardan (`%` veya belirli IP/host) bağlanabileceğini ve hangi SQL komutlarını (`SELECT`, `INSERT`, `DROP` vb.) çalıştırabileceğini belirleme arayüzü. |
| **Tasarımcı Görünümü** | Designer (ERD View) | Veritabanındaki tablolar arasındaki birincil (Primary Key) ve yabancı anahtar (Foreign Key) ilişkilerini görsel diyagram olarak çizen araç. |
| **Sorgu Profilleme** | Query Profiling | Çalıştırılan bir SQL sorgusunun hangi aşamada (kilit bekleme, disk okuma, sıralama vb.) ne kadar milisaniye harcadığını analiz eden performans aracı. |
| **Ana Bilgisayar Bağlantısı** | PMA_HOST | Konteyner ortamında phpMyAdmin'in bağlanacağı hedef veritabanı sunucusunun Docker iç ağ adını (`mariadb`) tanımlayan ortam değişkeni. |

## Cheatsheet (Hızlı Başvuru)

### Docker Compose Ortam Değişkenleri (`prod/docker-compose.yml`)
```yaml
environment:
  PMA_HOST: mariadb                 # pr2_internal_net üzerindeki MariaDB servis adı
  PMA_PORT: 3306                    # İç ağ veritabanı portu
  PMA_ARBITRARY: 0                  # Rastgele dış sunuculara bağlantıyı kapatır (Güvenlik)
  UPLOAD_LIMIT: 64M                 # Web arayüzünden yüklenecek maksimum .sql dosya boyutu
  PMA_BLOWFISH_SECRET: ${PMA_SECRET} # 32 karakterlik şifreleme anahtarı
```

### Konteyner Kontrol ve Bakım Komutları
```bash
# phpMyAdmin konteyner loglarını ve Nginx yönlendirme hatalarını izleme
docker logs -f pr2_phpmyadmin

# Büyük SQL yedekleri yüklerken PHP bellek ve zaman aşımı limitlerini kontrol etme
docker exec -it pr2_phpmyadmin php -i | grep -E "upload_max_filesize|post_max_size|max_execution_time"
```

### Güvenlik ve Erişim Doğrulama Kuralları
```text
1. Genel İnternet Erişimi : KAPALI (Nginx yalnızca tailscale0 IP aralığından gelen isteklere yanıt verir).
2. Kimlik Doğrulama       : Çift Katmanlı (1. Katman: Dex OIDC SSO oturumu, 2. Katman: MariaDB kullanıcı/parola girişi).
3. Ağ İzolasyonu          : Host makinede açık port bulunmaz; Nginx yalnızca Docker iç ağı üzerinden :80 portuna proxy yapar.
```
