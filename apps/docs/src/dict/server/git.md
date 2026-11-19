---
title: 'Git: Dağıtık Versiyon Kontrol Sistemi (Tanıtım, Referans ve Sözlük)'
description: >-
  Git, kaynak kod depolarındaki değişiklikleri zaman içinde izlemek ve birden
  fazla geliştiricinin yerel durum izleme grafikleri (DAG) kullanarak
  doğrusal...
outline:
  - 2
  - 3
status: published
tags:
  - git
  - versiyon-kontrol
  - dvcs
  - lexical-database
  - referans
  - altyapi-katman-3
---

# Git

---
* **Üretici / Geliştirici:** Linus Torvalds & Git Topluluğu (Software Freedom Conservancy)
* **Resmi Web Sitesi:** [git-scm.com](https://git-scm.com)

::: info CONCEPT MATRICES
* **Domain:** Software Configuration Management / Version Control
* **Superordinate Concept:** Distributed Version Control System (DVCS)
* **Storage Model:** Directed Acyclic Graph (DAG) using SHA Cryptographic Hashes
* **Core Paradigm:** Snapshot-based State Tracking (Non-Delta)
:::

## 1. Tanıtım

**Git**, kaynak kod depolarındaki değişiklikleri zaman içinde izlemek ve birden fazla geliştiricinin yerel durum izleme grafikleri (DAG) kullanarak doğrusal olmayan (non-linear) bir biçimde iş birliği yapmasını sağlamak amacıyla tasarlanmış dağıtık bir versiyon kontrol sistemidir.


## 2. Mimari Rolü ve Temel Prensipleri

Sürdürülebilir bir sistem inşa etmenin ilk kuralı, yazılan her satır kodun izlenebilir, geri döndürülebilir ve güvenli bir şekilde yönetilmesidir. 

Git, proje dosyalarımızın zaman içindeki tüm değişimlerini kayıt altına almamızı sağlar. Geliştirme sürecinde yaptığımız her mimari değişikliği, hata düzeltmesini veya yeni özellik eklemesini birbirinden bağımsız dallar (branch) üzerinde izole ederek test etmemize olanak tanır. Ayrıca yerel Gitea sunucumuz ve GitHub arasında kuracağımız çift yönlü yedekleme mekanizması sayesinde, kod tabanımızın hem yerel ağda yüksek hızla erişilebilir olmasını hem de bulut ortamında felaket kurtarma (disaster recovery) güvencesi altında tutulmasını sağlar.

Bir projeye başlarken mimari iskelet daha ilk dakikadan itibaren sürekli evrilir; yapılandırma dosyaları değişir, bağımlılıklar eklenir ve denemeler yapılır. Eğer ortam kurulumuna veritabanı veya uygulama sunucuları ile başlarsak, yapılacak ilk hatalı konfigürasyonda temiz başlangıç noktasına dönmek zaman kaybına yol açar. Git'i en başta kurarak henüz tek bir satır uygulama kodu yazmadan önce projemizin **"sıfır noktasını" (initial commit)** mühürlemiş oluruz. Bu yaklaşım, sonraki tüm kurulum adımlarını güvenli bir zaman çizelgesi üzerine inşa etmemizi sağlar.


* **Git**, CI/CD otomasyon süreçlerinin temelini sağlar.
* Veriyi dosya farkları (delta) olarak değil, dosya sisteminin anlık görüntüleri (**Snapshots**) serisi olarak saklar.
* **Dağıtık Yapı (Distributed):** Her geliştirici, projenin tüm geçmişini barındıran tam bir depo (repository) kopyasına yerel bilgisayarında sahiptir.
* **Veri Bütünlüğü:** Depodaki her dosya ve dizin, kaydedilmeden önce **SHA-1 / SHA-256** kriptografik özet (hash) algoritmasıyla işaretlenir. Git'in haberi olmadan hiçbir veri değiştirilemez.
* **Üç Durumlu Mimari:** Dosyalar Git ekosisteminde üç temel aşamadan geçer:
  * **Working Directory (Çalışma Dizini):** Disk üzerinde o an düzenleme yapılan dosyaların bulunduğu alan.
  * **Staging Area / Index (Hazırlık Alanı):** Bir sonraki kayıt (commit) paketine dahil edilecek değişikliklerin işaretlendiği ara bölge.
  * **Git Directory (.git / Yerel Depo):** Kalıcı olarak kaydedilen anlık görüntülerin ve proje geçmişinin tutulduğu veritabanı.



## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Repository (Repo)** | Kod Deposu | Projenin tüm dosyalarını ve bu dosyaların geçmiş değişim kayıtlarını (`.git` klasörü) barındıran ana kapsayıcı. |
| **Commit** | Anlık Kayıt | Hazırlık alanındaki (Staging) değişikliklerin benzersiz bir SHA kimliği ve açıklama mesajıyla yerel depoya mühürlenmesi işlemi. |
| **Branch** | Dal | Ana kod tabanını (`main`) bozmadan yeni özellik geliştirmek veya hata düzeltmek için açılan bağımsız çalışma hattı. |
| **Merge** | Birleştirme | Farklı bir dalda geliştirilen ve test edilen kod değişikliklerinin hedef dala entegre edilmesi işlemi. |
| **Remote** | Uzak Sunucu | Yerel deponun senkronize edildiği ağ üzerindeki merkezi sunucu (projemizde **Gitea** veya yedek olarak GitHub). |
| **Clone** | Klonlama | Uzak sunucudaki bir deponun tüm geçmişiyle birlikte yerel ortama indirilmesi. |
| **Pull / Push** | Çekme / Gönderme | Uzak sunucudaki güncel değişiklikleri yerele alma (`pull`) veya yereldeki mühürlü kayıtları sunucuya aktarma (`push`) eylemi. |
| **HEAD** | Aktif İşaretçi | Kullanıcının o an üzerinde çalıştığı dalın en son kaydını gösteren dinamik referans noktası. |
| **Tag** | Sürüm Etiketi | Belirli bir kaydı kalıcı olarak işaretlemek için kullanılan sabit referans (genellikle `v1.0.0` gibi üretim sürümleri için). |
| **`.gitignore`** | Yoksayma Listesi | Bağımlılık klasörleri (`node_modules`), derleme çıktıları ve gizli anahtarların (`.env`) Git takibi dışında tutulmasını sağlayan yapılandırma dosyası. |



## 4. Temel Kullanım Referansı (Cheatsheet)

Günlük geliştirme ve monorepo yönetiminde en sık başvurulan temel komut seti:

### Başlangıç ve Yapılandırma
```bash
# Mevcut dizinde yeni bir yerel Git deposu başlatır
git init

# Uzak sunucudaki depoyu yerele kopyalar
git clone <depo-url>

# Kayıt (commit) işlemlerinde görünecek geliştirici kimliğini tanımlar
git config --global user.name "Ad Soyad"
git config --global user.email "eposta@alanadi.com"
```

### Günlük Çalışma Döngüsü
```bash
# Çalışma dizini ve hazırlık alanındaki mevcut durumu listeler
git status

# Değiştirilen tüm dosyaları hazırlık alanına (Staging) ekler
git add .

# Hazırlık alanındaki değişiklikleri açıklayıcı bir mesajla yerel depoya kaydeder
git commit -m "feat(infra): nginx yönlendirme kuralları eklendi"

# Yerel kayıtları uzak sunucuya (Gitea / GitHub) gönderir
git push origin <dal-adi>

# Uzak sunucudaki güncel değişiklikleri çekip yerel dalla birleştirir
git pull origin <dal-adi>
```

### Dal (Branch) Yönetimi ve Geçmiş İnceleme
```bash
# Yeni bir dal oluşturur ve doğrudan o dala geçiş yapar
git checkout -b feature/yeni-modul

# Hedef dalı aktif olan mevcut dala birleştirir
git merge feature/yeni-modul

# Kayıt (commit) geçmişini tek satırlık özetler halinde listeler
git log --oneline --graph --all
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [Git Reference Manual](https://git-scm.comdocs)
* **Temel Başvuru Kitabı:** [Pro Git Book (Scott Chacon & Ben Straub)](https://git-scm.combook/en/v2)
* **Standart Mesaj Formatı:** [Conventional Commits v1.0.0](https://conventionalcommits.org)
