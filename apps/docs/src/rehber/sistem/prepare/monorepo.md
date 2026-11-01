
# `1.2.1.` Monorepo

[Monorepo dosya açıklamaları](/dict/monorepo-example)

## Repo oluştur.

::: info Tüm projelerimiz için kök dizin olacak çalışma dizinini oluşturup versiyon kontrol için  `git repository` olarak tanımlıyoruz (`initialize`).

Bu işlem klasörümüzde `.git` klasörünü oluşturur.

```bash
   mkdir saasguide
   cd saasguide
   git init
   git branch -m main
```
:::


::: warning `git` ve `docker` tarafından takip edilmeyecek dosya ve klasörleri belirtmek için kök dizinde `.gitignore`,`.dockerignore`dosyalarını oluşturuyoruz. Bunlar sisteminizin sağlıklı çalışması için gerekli en temel dosyalardır.

[.gitignore dosyası](../../EK/gitignore)

[.dockerignore dosyası](../../EK/dockerignore)
:::

::: info README.md dosyamızı ekleyip ve ilk `commit`i yapıyoruz.
```bash
echo "# saasguide" >> README.md
git add .
git commit -m "Repo oluşturuldu"
```
:::

## Remote (Github) Origin

::: info [Github](https://github.com/) üzerinde boş bir repo oluşturup ve yerel klasörümüze bağlıyoruz.
 
```bash
   git remote add origin https://github.com/<kullanıcı adı>/<repo adı>.git
   git push origin
```
:::


## Monorepo Yapılandırması

  Kök dizinimizde aşağıdaki dosyaları oluşturuyoruz.

 
 
::: details `package.json` Monorepo kök bağımlılıkları ve scriptleri
```json
{
  "name": "saasguide",
  "private": true,
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
   },
  "devDependencies": {
    "turbo": "^2.0.0",
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

::: details `tsconfig.base.json` Paylaşılan Temel Ayarlar
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
  "files": [], // Kök dizinde doğrudan TS kodu derlenmeyecekse boş bırakılır
  "references": []
}
```
:::

::: details `pnpm-workspace.yaml` klasörün bir monorepo (workspace) olmasını sağlar. 
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```
:::

---

::: info Monorepo yönetimi için kullanacağımız Turborepo paketini tüm projeler (`workspace`) için geliştirici aracı olarak (`dev dependency`) projemize ekliyoruz.

> --workspace-root
>
> --save-dev
```bash
pnpm add turbo -D -w
```
:::
---
::: info Değişikleri uygula (`git commit-push`).
```bash
git add .
git commit -m "Monorepo kök dosyaları eklendi"
git push origin
```

:::
