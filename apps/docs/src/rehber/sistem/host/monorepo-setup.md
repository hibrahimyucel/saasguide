---
title: "Monorepo Başlangıç ve Yapılandırma Rehberi"
description: "pr2cloud source/ dizini altında pnpm-workspace, Turborepo, TypeScript ve .gitignore yapılandırma adımları."
outline:
  - 2
  - 3
sidebarTitle: "Monorepo Yapılandırması"
index: 2
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "monorepo", "pnpm", "turborepo", "typescript", "gitignore"]
---

# Monorepo Yapılandırması

## Çalışma Dizini ve Git Deposu

Kaynak kodların(`source/`), üretim yapılandırmalarının (`prod/`) ve kalıcı verilerin (`data/`) birbirinden kesin olarak izole edilmesi amacıyla kök çalışma alanı (`pr2cloud/`)oluşturulur. Projenin durumuna göre mevcut depo klonlanır veya sıfırdan yeni bir Git deposu başlatılır.


## A. Mevcut Monorepoyu Klonlama

 - Kök çalışma dizinini oluştur ve içine gir

```bash
mkdir -p ~/pr2cloud && cd ~/pr2cloud
```

 - Ana monorepo deposunu source/ dizinine klonla

```bash
git clone <MONOREPO_GIT_URL> source
cd source
```

## B. Yeni Monorepo oluşturma

- Kök ve kaynak kod dizinlerini oluştur

```bash
mkdir -p ~/pr2cloud/source && cd ~/pr2cloud/source

# Yeni Git deposunu main ana dalı ile başlat
git init -b main

# Monorepo temel klasör hiyerarşisini oluştur
mkdir -p apps packages infra
```

> `source/` ve `prod/` depolarının ayrılması, yerel geliştirme servisleri ile canlı VPS yapılandırmalarının birbirine karışmasını önler. Sıfırdan başlatılan depolarda `apps/`, `packages/` ve `infra/` ayrımı en baştan standartlaştırılır.


### 1. `.gitignore` - `.dockerignore`

Monorepo yapısında derleme çıktıları, önbellek dizinleri ve yerel çalışma zamanı dosyalarının Git geçmişine girmesini ve gizli ortam değişkenlerinin kopyalanmasını engellemek için kök dizinde `.gitignore` dosyası zorunludur.

 - [.gitignore](../../ek/gitignore.md) şablonunu `~/pr2cloud/source/.gitignore` konumuna ekleyin

 - [.dockerignore](../../ek/dockerignore.md) şablonunu `~/pr2cloud/source/.dockerignore` konumuna ekleyin


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
  "\$schema": "https://turbo.build",
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

Yapılandırma dosyaları oluşturulduktan sonra bağımlılıklar yüklenir ve temel monorepo iskeleti Git deposuna kaydedilir.

```bash
# Bağımlılıkları yükle ve pnpm-lock.yaml dosyasını oluştur
pnpm install

# Turborepo görev grafiğini doğrula
pnpm turbo run build --dry-run

# İlk monorepo iskeletini Git'e kaydet
git add .
git commit -m "chore: initialize monorepo structure with pnpm and turborepo"
```

## Kurulum Doğrulama Kontrol Listesi

* [ ] `.gitignore` dosyası kök dizine yerleştirildi ve türetilmiş klasörleri dışlıyor.
* [ ] `package.json`, `pnpm-workspace.yaml`, `turbo.json` ve `tsconfig.base.json` dosyaları oluşturuldu.
* [ ] `pnpm install` sonrasında `pnpm-lock.yaml` dosyası üretildi.
* [ ] `pnpm turbo run build --dry-run` komutu hatasız çalıştı.
