---
title: "Monorepo Yapılandırması"
description: "πr² Cloud projesi için pnpm workspace, Turborepo ve TypeScript tabanlı monorepo iskeleti kurulum adımları."
outline: [2, 3]
sidebarTitle: "Monorepo Yapılandırması"
index: 40
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "monorepo", "pnpm", "turborepo"]
---


# Monorepo Yapılandırması

## Çalışma Dizini ve Git Deposu

Kaynak kodlar (pr2source/) ile çalışma zamanı kalıcı verileri (pr2data/) birbirinden tamamen bağımsız kök dizinlerde konumlandırılır. Projenin durumuna göre mevcut depo klonlanır veya sıfırdan yeni bir Git deposu başlatılır.

<DynamicSnippet title="Klasörleri Oluştur" default-open>

```bash
sudo mkdir -p <-SOURCE_DIR->
sudo mkdir -p <-DATA_DIR->/{certs,wwwroot,dex,gitea,silo,mariadb,stalwart,snappymail}
# daha sonra sudo kullanmamak için dizin sahipliğini alıyoruz.
sudo chown -R $USER:$USER /opt/pr2source /opt/pr2data

ln -sfn <-SOURCE_DIR-> ~/src
ln -sfn <-DATA_DIR-> ~/data

```

</DynamicSnippet>


## A. Mevcut Monorepoyu Klonlama

<DynamicSnippet title="Monorepo Klonlama" >

```bash
git clone <-MONOREPO_URL-> <-SOURCE_DIR->
cd <-SOURCE_DIR->
```

</DynamicSnippet>

## B. Yeni Monorepo Oluşturma

<DynamicSnippet title="Monorepo Oluşturma" >

```bash
cd <-SOURCE_DIR->
# Yeni Git deposunu main ana dalı ile başlat
git init -b main

# Monorepo temel klasör hiyerarşisini oluştur
mkdir -p apps packages infra
```

</DynamicSnippet>


### 1. `.gitignore` - `.dockerignore`

::: warning Git/Docker takibinde olmayacak dosyaları belirtin.
Monorepo yapısında derleme çıktıları, önbellek dizinleri ve yerel çalışma zamanı dosyalarının Git geçmişine girmesini ve gizli ortam değişkenlerinin kopyalanmasını engellemek için kök dizinde `.gitignore` dosyası zorunludur.
:::

> nano -> ctrl+shit+V ctrl+O .gitignore crtl+X 
 - [.gitignore](../ek/gitignore.md) şablonunu `<-SOURCE_DIR->/.gitignore` konumuna ekleyin

> nano -> ctrl+shit+V ctrl+O .dockerignore crtl+X
 - [.dockerignore](../ek/dockerignore.md) şablonunu `<-SOURCE_DIR->/.dockerignore` konumuna ekleyin


### 2. `package.json`

Çalışma alanının kök yönetim betiklerini ve paket yöneticisi kilidini tanımlamak için kök `package.json` dosyası oluşturulur.

```bash
cat << 'EOF' > package.json
{
  "name": "pr2cloud-monorepo",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.7.0"
  }
}
EOF
```


### 3. `pnpm-workspace.yaml`

`pnpm` paket yöneticisine hangi alt dizinlerin monorepo çalışma alanına (workspace) dahil olduğunu bildiren yapılandırma dosyasıdır.

```bash
cat << 'EOF' > pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
EOF
```

> `apps/*` altındaki son kullanıcı uygulamaları (ör. VitePress docs, web, api) ile `packages/*` altındaki paylaşılan kütüphaneler (UI, Zod şemaları, OIDC istemcisi) tek bir bağımlılık ağacında birleştirilir. `infra/` klasörü altyapı yapılandırması olduğu için workspace paketlerinden izole tutulur.

### 4. `turbo.json`

**Turborepo** görev bağımlılıklarını (DAG) ve önbellek kurallarını yöneten ana orkestrasyon dosyasıdır.

```bash
cat << 'EOF' > turbo.json
{
  "$schema": "./node_modules/turbo/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".vitepress/dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
EOF
```

> `"dependsOn": ["^build"]` kuralı, bir uygulama (`apps/*`) derlenmeden önce bağımlı olduğu paylaşılan paketlerin (`packages/*`) otomatik olarak derlenmesini sağlar. `outputs` tanımı ise başarılı derleme çıktılarını önbelleğe alarak tekrar derleme süresini milisaniyelere indirir.

### 5. `tsconfig.base.json`

Monorepo genelinde katı tip güvenliği ve tutarlı derleme kuralları sağlamak için temel TypeScript yapılandırması tanımlanır.

```bash
cat << 'EOF' > tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
EOF
```

> `apps/` ve `packages/` altındaki tüm projeler kendi `tsconfig.json` dosyalarında bu dosyayı genişleterek (`"extends": "../../tsconfig.base.json"`) katı tip kontrolünü (`"strict": true`) tek merkezden devralır.

## Bağımlılıkların Yüklenmesi ve İlk Commit


* Git küresel kullanıcı kimliğini tanımlayın, daha sonra aynı komutla değiştirebilirsiniz *(ilk commit işlemi için zorunludur)*:
<DynamicSnippet title="Git Kullanıcı Hesabı" :defaults='{ "USER_NAME":"user","EMAIL":"user@pr2cloud" }'' >

```bash
git config --global user.name "<-USER_NAME->"
git config --global user.email "<-EMAIL->"
```

</DynamicSnippet>


Yapılandırma dosyaları oluşturulduktan sonra bağımlılıklar yüklenir ve temel monorepo iskeleti Git deposuna kaydedilir.

```bash
# Bağımlılıkları yükle ve pnpm-lock.yaml dosyasını oluştur
pnpm install

# Turborepo görev grafiğini doğrula
pnpm turbo run build --dry-run

# İlk monorepo iskeletini Git'e kaydet
git add .
git commit -m "chore: initialize monorepo structure with pnpm and turborepo"

# Repo içinde takip edilen dosya listesi
git ls-tree -r --name-only HEAD

```


## Merkezi Ortam Dosyası (`infra/.env`)

Tüm altyapı betikleri ve Docker Compose dosyalarının ortak kullanacağı temel yol ve alan adı değişkenlerini `infra/.env` dosyasına kaydedin *(servislere özel parolalar ilgili kurulum adımlarında bu dosyaya eklenecektir)*:

<DynamicSnippet title="Çekirdek Ortam Değişkenleri" default-open>

```bash
mkdir -p <-SOURCE_DIR->/infra
cat << 'EOF' > <-SOURCE_DIR->/infra/.env
# --- TEMEL ALAN ADI VE DİZİN YOLLARI ---
DATA_DIR=<-DATA_DIR->
CERT_ROOT=<-DATA_DIR->/certs
DOMAIN=<-DOMAIN->
EOF

chmod 600 <-SOURCE_DIR->/infra/.env
```

</DynamicSnippet>


## Docker - Ortak Ağ

Docker, `compose` dosyalarında tanımlı ağları konteyner özelinde otomatik oluşturmaya çalışır. Farklı `docker-compose` dosyalarındaki konteynerlerin birbiriyle ve Nginx ile konuşabilmesi için ortak harici (`external`) ağları oluşturuyoruz. 

 `pr2_internal_net` ağı `internal: true` parametresiyle dış internete tamamen kapalıdır. Nginx ters vekili yalnızca `pr2_edge_net` üzerinde çalışırken, Dex, MinIO, Gitea ve veritabanları iç ağda izole edilir; API katmanı her iki ağa bağlanarak kontrollü köprü görevi görür.

::: tip Ağ Oluşturma
Aşağıdaki komutları çalıştırarak her iki ağı oluşturun. 

```bash
docker network create pr2_edge_net
docker network create --internal pr2_internal_net
```
:::


## Kurulum Doğrulama Kontrol Listesi

* [ ] `.gitignore` dosyası kök dizine yerleştirildi ve türetilmiş klasörleri dışlıyor.
* [ ] `package.json`, `pnpm-workspace.yaml`, `turbo.json` ve `tsconfig.base.json` dosyaları oluşturuldu.
* [ ] `pnpm install` sonrasında `pnpm-lock.yaml` dosyası üretildi.
* [ ] `pnpm turbo run build --dry-run` komutu hatasız çalıştı.
