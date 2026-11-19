---
title: 'Kurulum Rehberi 2. Adım: Node.js, pnpm ve Docker Kapsam (Scope) Ayrımı'
description: >-
  Versiyon kontrol altyapımızı güvence altına aldıktan sonraki ikinci temel
  adım, projemizin hem arka uç (backend) servislerini hem de modern ön yüz
  (fron...
outline:
  - 2
  - 3
status: published
tags:
  - nodejs
  - pnpm
  - docker
  - scope-ayrimi
  - monorepo
  - vitepress
  - kurulum-rehberi
---

# `2.` Node.js - <code>pnpm</code>

Versiyon kontrol altyapımızı güvence altına aldıktan sonraki ikinci temel adım, projemizin hem arka uç (backend) servislerini hem de modern ön yüz (frontend) arayüzlerini çalıştıracak motoru ve bağımlılık yöneticisini kurmaktır. Çalışma ortamı (runtime environment) olarak **Node.js**, paket yöneticisi olarak ise **pnpm** kullanacağız.

## Node.js

## npm - pnpm
Çoklu uygulama ve paket içeren **Monorepo** mimarilerinde (`apps/web`, `apps/docs`, sunucu servisleri vb.) standart `npm` veya `yarn` kullanmak, her alt proje için aynı bağımlılıkların tekrar tekrar indirilmesine ve devasa `node_modules` klasörlerinin oluşmasına yol açar. **pnpm**, tüm paketleri bilgisayarınızda tek bir merkezi depoda (content-addressable store) saklar ve projelere sembolik bağlantılar (hard/symbolic links) aracılığıyla bağlar. Bu yaklaşım disk alanından yüksek oranda tasarruf sağlar, kurulum sürelerini hızlandırır ve paketler arası versiyon çakışmalarını önler.

## Node.js/pnpm vs. Docker

* **Node.js ve pnpm (Uygulama Geliştirme Katmanı):** 
Doğrudan kendi yazdığımız uygulama kodlarının geliştirilmesi, derlenmesi (build), test edilmesi ve paket bağımlılıklarının yönetilmesi için ana geliştirme ortamına (host) kurulur. Günlük kod yazımı, arayüz derlemeleri (VitePress/React) ve hızlı geliştirme döngüleri (Hot Reload) Docker konteynerlerinin dosya sistemi gecikmelerine takılmadan doğrudan yerel makine üzerinde yüksek performansla yürütülür. 

* **Docker (Altyapı ve Servis Katmanı - Infrastructure Scope):** Uygulamamızın dışa bağımlı olduğu hazır sistem servislerini (veritabanları, Redis önbelleği, yerel Gitea sunucusu vb.) ana işletim sisteminden izole etmek için kullanılır. 

Ancak burada ayrı bir test-development sunucusu kullanmayacağımız için tüm servislerimizi yalıtılmış Docker katmanında çalıştıracağız. Aynı şekilde build işlemlerini de Docker aracılığıyla gerçekleştireceğiz. Nodejs ise kod takibi ve IDE özelliklerini kullanabilmeniz için gereklidir. Geliştirme ortamımızda bunun dışında  bir fonksiyonu yoktur.

Docker, proje ayarlarına göre indirilen araçları veya derlenmiş imajları kullandığından yayın (production) ortamında sadece Docker kurmak yeterlidir. 


## Kurulum

::: info Sistem paketlerini güncelleyin

```bash
sudo dnf update -y
```
:::


::: info Node.js 20 LTS (veya güncel sürüm) reposunu ekleyin ve kurun

```bash
sudo dnf module reset nodejs -y
sudo dnf module enable nodejs:20 -y
sudo dnf install nodejs -y
```
:::


::: info `pnpm` paket yöneticisini global olarak kurun

```bash
sudo npm install -g pnpm
```

Kurulumları doğrulayın

```bash
node -v
pnpm -v
```
:::
