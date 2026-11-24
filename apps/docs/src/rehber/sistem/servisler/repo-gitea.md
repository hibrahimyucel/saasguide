---
title: Yerel Gitea Kurulumu ve Dual Remote Origin Yapılandırması
description: >-
  pr2 monorepo altyapısında Docker ile izole Gitea kurulumu, Nginx SSL reverse
  proxy entegrasyonu ve GitHub ile çift yönlü Git senkronizasyonu.
outline:
  - 2
  - 3
status: published
tags:
  - gitea
  - docker
  - nginx
  - reverse-proxy
  - git
  - dual-remote
  - monorepo
---

# Gitea - Dual Remote Yapılandırması

## Tek Remote Origin ve Gitea Push Mirror (Sunucu Taraflı Senkronizasyon)

Yerel geliştirme ortamında çift push hedefi yönetmek yerine yalnızca yerel Gitea'yı tek `origin` olarak kullanıp, GitHub yedeklemesini Gitea'nın yerleşik **Push Mirror** özelliğine devredebilirsiniz.

### 1. Yerel Projeyi Tek `origin` (Gitea) Yapısına Alma

Proje kök dizininde (`source/`) mevcut çift push hedeflerini temizleyip yalnızca yerel Gitea adresini tanımlayın:

```bash
# Mevcut origin yapılandırmasını sıfırlayıp tek Gitea adresi atama
git remote remove origin
git remote add origin https://git.localhost<kullanıcıadınız>/pr2.git

# Doğrulama (Yalnızca 1 fetch ve 1 push satırı görünmelidir)
git remote -v
```

### 2. GitHub Kişisel Erişim Anahtarı (PAT) Oluşturma

Gitea'nın GitHub deposuna arka planda kod yazabilmesi için bir erişim anahtarı (Token) gerekir:

1. **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens** (veya *Tokens (classic)*) bölümüne gidin.
2. Yalnızca ilgili depo (`pr2`) için **Contents: Read and write** yetkisine sahip bir token oluşturun ve kopyalayın.

### 3. Gitea Üzerinde Push Mirror Tanımlama

1. `https://git.localhost<kullanıcıadınız>/pr2` deposunu açın ve üst menüden **Settings (Ayarlar)** sekmesine girin.
2. Sol menüden **Mirror Settings (Yansıtma Ayarları)** (bazı sürümlerde *Repository* altında) bölümünü açın.
3. **Add Push Mirror (Push Yansıtması Ekle)** alanını doldurun:
   * **Git Remote Repository URL:** `https://github.com<kullanıcıadınız>/pr2.git`
   * **Authorization (Yetkilendirme):**
     * **Username:** GitHub kullanıcı adınız
     * **Password / Access Token:** Oluşturduğunuz GitHub PAT değeri
   * **Sync when commits are pushed:** İşaretli *(Her `git push` sonrası anında GitHub'a gönderir)*
   * **Mirror Interval:** `8h0m0s` *(Periyodik kontrol aralığı)*
4. **Add Push Mirror** butonuna basarak kaydedin.

### 4. Doğrulama ve Manuel Tetikleme

* Ayar sayfasındaki **Push Mirrors** tablosunda eklenen kaydın yanındaki **Sync Now (Şimdi Eşitle)** butonuna tıklayın ve **Last Update** sütununda hata olmadan tarih güncellendiğini doğrulayın.
* Artık yerel terminalinizde standart `git push origin main` komutunu çalıştırdığınızda kod önce milisaniyeler içinde yerel Gitea'ya yazılır, ardından Gitea arka planda GitHub deposunu otomatik günceller.


## Yerel Öncelikli Dual Remote Origin Yapılandırması

Bu yapılandırmada `git pull` ve `git fetch` işlemleri doğrudan yerel Gitea sunucusundan yapılırken, `git push` komutları tek seferde hem yerel Gitea'ya hem de GitHub'a yazılır.

### Terminal Komutları

Proje kök dizininde (`source/`) aşağıdaki komutları çalıştırın:

```bash
# 1. Ana origin (fetch) kaynağını yerel Gitea olarak ayarlayın
git remote set-url origin https://git.localhost/<kullanıcıadınız>/pr2.git

# 2. İlk push hedefi olarak yerel Gitea'yı tanımlayın
git remote set-url --add --push origin https://git.localhost/<kullanıcıadınız>/pr2.git

# 3. İkinci push hedefi olarak GitHub bulut deposunu ekleyin
git remote set-url --add --push origin https://github.com/<kullanıcıadınız>/pr2.git

# 4. Yerel mkcert sertifikası için depo bazlı SSL doğrulama ayarı
git config http.https://localhost.sslverify false
```

### Doğrulama

`git remote -v` komutu çalıştırıldığında aşağıdaki çıktı elde edilmelidir:

```text
origin  https://git.localhost/<kullanıcıadınız>/pr2.git (fetch)
origin  https://git.localhost/<kullanıcıadınız>/pr2.git (push)
origin  https://github.com (push)
```

### Şifrenizin kaydedilmesi için

```bash
git config --global credential.helper store
git push origin --all
```

MS Windows
```bash
git config --global credential.helper manager
git push origin --all
```



## 5. Günlük Geliştirme İş Akışı

* **Tüm Dalları Senkronize Etme:** `git push origin --all`
* **Standart Kod Gönderimi:** `git push origin <dal-adi>` (Önce yerel Gitea'ya, ardından GitHub'a otomatik yazar.)
* **Yerelden Güncelleme Çekme:** `git pull origin <dal-adi>` (Doğrudan `git.localhost` üzerinden çeker.)
* **Harici GitHub Değişikliklerini Çekme:** Farklı bir ortamdan doğrudan GitHub'a kod gönderildiyse, `git pull https://github.com <dal-adi>` komutuyla yereli güncelleyip ardından `git push origin` ile Gitea'yı eşitleyin.



