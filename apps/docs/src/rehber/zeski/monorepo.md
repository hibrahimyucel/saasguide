---
title: 5. Monorepo
description: 'Bu adımdaki dosyalara, monorepo branşı'
outline:
  - 2
  - 3
status: published
tags:
  - rehber
  - sistem
  - host
---

# `5.` Monorepo

Bu adımdaki dosyalara, [monorepo branşı](https://github.com/hibrahimyucel/pr2/tree/release/infra-router)
branşı üzerinden erişebilirsiniz.



## Repo oluştur.

Çalışma alanımız içinde kaynak kodlar, yayına hazır site ve imajlar olacağı için bir kök klasör (`workspace-pr2`) oluşturup o klasör içinde çalışmalarımıza devam ediyoruz. 

Proje kaynak kodları için `source` dizinini oluşturup versiyon kontrol için  `git repository` olarak tanımlıyoruz (`initialize`).

`README.md` dosyamızı ekleyip ilk `commit`i yapıyoruz.

```bash
   mkdir -p workspace-pr2/source
   cd workspace-pr2/source
   git init
   git branch -M main
   echo "# Monorepo-SaaS Geliştirme Rehberi" >> README.md
   git add .
   git commit -m "Repo oluşturuldu"
```


---

 `git` ve `docker` tarafından takip edilmeyecek dosya ve klasörleri belirtmek için kök dizinde `.gitignore`,`.dockerignore`dosyalarını oluşturuyoruz. Bunlar sisteminizin sağlıklı çalışması için gerekli en temel dosyalardır.

[.gitignore dosyası](../../ek/gitignore)

[.dockerignore dosyası](../../ek/dockerignore)




## Remote (Github) Origin

[Github](https://github.com/) üzerinde boş bir repo oluşturup ve yerel klasörümüze bağlıyoruz.

Yeni `repository` oluşturduğunuzda sayfanın en altında çalıştırmanız gereken komutları görebilirsiniz.
 
```bash
   git remote add origin https://github.com/<kullanıcı adı>/<repo adı>.git
   git push origin
```


## Monorepo Yapılandırması

Kök dizinimizde aşağıdaki dosyaları oluşturuyoruz.

::: details `pnpm-workspace.yaml` klasörün bir monorepo (workspace) olmasını sağlar. Paket yöneticisi proje ve paketleri bu dosyada tanımlı konumlarda arar. 

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```
:::

::: details `package.json` Monorepo kök bağımlılıkları ve scriptleri

```json
{
  "name": "saasrehberi",
  "private": true,
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.11.10",
    "typescript": "^5.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}

```

:::

::: details `turbo.json` Turborepo yapılandırma dosyası

```json
{
  "$schema": "https://turbo.build",
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
    }
  }
}
```

:::

::: details `tsconfig.base.json` Typescript paylaşılan Temel Ayarlar
Tüm alt projelerin ortak kullanacağı derleme ve katı kurallar (strict kuralları, target vb.) burada tanımlanır.


```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```
:::

::: details `tsconfig.json` Proje ve paket yolları

Monorepo araçlarının (Turborepo, Nx vb.) ve kod editörünüzün proje ve paketleri tanıması için **Project References** (`references`) yapısı kullanılır.

```json
{
  "files": [], 
  "references": []
}
```
:::


---

Monorepo yönetimi için kullanacağımız Turborepo paketini tüm projeler (`workspace`) için geliştirici aracı olarak (`dev dependency`) projemize ekliyoruz.

> --workspace-root
>
> --save-dev
```bash
pnpm add turbo -D -w
```

