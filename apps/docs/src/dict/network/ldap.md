---
title: "LDAP (Lightweight Directory Access Protocol)"
description: "Hafif Dizin Erişim Protokolü (LDAP) mimari tanımı, hiyerarşik ağaç yapısı, Dex IdP ve merkezi kimlik doğrulama temelleri."
outline: [2, 3]
sidebarTitle: "LDAP"
index: 20
isContent: true
hidden: false
status: "published"
tags: ["glossary", "ldap", "identity", "authentication", "directory-service", "dex", "security"]
---

# LDAP (Lightweight Directory Access Protocol)

**Standart & Spesifikasyon:** Internet Engineering Task Force (IETF) — [RFC 4511](https://ietf.org)

::: info CONCEPT MATRICES
* **Domain:** Identity and Access Management (IAM) / Network Protocols
* **Superordinate Concept:** Directory Access Protocol (X.500 Directory Services)
* **Data Model:** Hierarchical Tree Structure — Directory Information Tree (DIT)
* **Transport & Security:** TCP/IP (Port 389 with StartTLS, Port 636 for LDAPS)
* **Primary Operations:** Bind, Search, Compare, Add, Delete, Modify, Unbind
:::

---

## Resmi Tanım

**LDAP (Lightweight Directory Access Protocol)**, bir ağ üzerindeki kullanıcıları, grupları, cihazları ve kaynakları hiyerarşik bir ağaç yapısında (**DIT — Directory Information Tree**) depolamak, sorgulamak ve doğrulamak için kullanılan açık standartlı bir uygulama katmanı protokolüdür.

İlişkisel veritabanlarının (RDBMS) aksine yüksek hacimli yazma/güncelleme işlemleri yerine **çok hızlı okuma (read-heavy) ve kimlik doğrulama (bind)** sorguları için optimize edilmiştir. Modern PaaS ve mikro servis mimarilerinde **Dex (OIDC Identity Provider)** gibi kimlik sağlayıcıların arka ucunda kurumsal kullanıcı dizini (connector) olarak görev yapar.

---

## Sözlük Veritabanı (Lexical Database)

| Terim / Kısaltma | Açılımı | Mimari Açıklama |
| :--- | :--- | :--- |
| **DIT** | *Directory Information Tree* | LDAP verilerinin kök dizinden yaprak düğümlere doğru dallandığı hiyerarşik veri ağacı. |
| **DN** | *Distinguished Name* | Bir kaydın (entry) ağaç içindeki benzersiz ve tam yolu *(Örn: `uid=ibrahim,ou=users,dc=pr2cloud,dc=com`)*. |
| **RDN** | *Relative Distinguished Name* | Bir kaydı aynı üst düğüm altındaki komşularından ayıran yerel kimlik parçası *(Örn: `uid=ibrahim`)*. |
| **CN** | *Common Name* | Kullanıcı veya nesnenin ortak/tam adı *(Örn: `cn=İbrahim Yücel`)*. |
| **OU** | *Organizational Unit* | Kullanıcıları ve kaynakları mantıksal gruplara ayıran birim düğümü *(Örn: `ou=devops`, `ou=users`)*. |
| **DC** | *Domain Component* | Alan adının nokta ile ayrılmış her bir bileşeni *(Örn: `dc=pr2cloud,dc=com`)*. |
| **Bind** | *LDAP Bind Operation* | İstemcinin kullanıcı adı (DN) ve parola ile LDAP sunucusuna oturum açıp kimliğini doğrulaması işlemi. |
| **LDAPS** | *LDAP over TLS/SSL* | Varsayılan `636` portu üzerinden şifreli tünel ile gerçekleştirilen güvenli LDAP iletişimi. |
| **LDIF** | *LDAP Data Interchange Format* | LDAP dizin kayıtlarını düz metin olarak içe/dışa aktarmak ve güncellemek için kullanılan standart dosya formatı. |

---

## Cheatsheet (Hızlı Başvuru)

### 1. Temel DN (Distinguished Name) Hiyerarşisi
```text
dc=com
 └── dc=pr2cloud                      # Kök Alan Adı (Base DN)
      ├── ou=users                    # Kullanıcılar Birimi
      │    └── uid=admin              # DN: uid=admin,ou=users,dc=pr2cloud,dc=com
      └── ou=groups                   # Gruplar Birimi
           └── cn=developers          # DN: cn=developers,ou=groups,dc=pr2cloud,dc=com
```

### 2. Sık Kullanılan Arama Filtreleri (Search Filters)

| Amaç | LDAP Filtre İfadesi |
| :--- | :--- |
| Belirli kullanıcıyı e-posta ile bulma | `(&(objectClass=inetOrgPerson)(mail=user@pr2cloud.com))` |
| Belirli bir gruba üye kullanıcıları listeleme | `(&(objectClass=person)(memberOf=cn=admins,ou=groups,dc=pr2cloud,dc=com))` |
| Kullanıcı adı (`uid`) veya `cn` ile eşleştirme | `(|(uid=ibrahim)(cn=İbrahim*))` |

### 3. Terminal Üzerinden Dizin Sorgulama (`ldapsearch`)
```bash
# Base DN altındaki tüm kullanıcı kayıtlarını TLS (StartTLS) ile sorgulama
ldapsearch -x -ZZ -H ldap://://pr2cloud.com \
  -D "cn=readonly,dc=pr2cloud,dc=com" -W \
  -b "ou=users,dc=pr2cloud,dc=com" "(objectClass=inetOrgPerson)" cn mail uid
```
