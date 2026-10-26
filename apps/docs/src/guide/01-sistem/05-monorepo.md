
# Monorepo geliştimesi

[Monorepo dosya açıklamaları](/dict/monorepo-example)

  Tüm dosyalar çalışma dizinimizde olacak.

 ---
 
 ::: details `package.json` Monorepo kök bağımlılıkları ve scriptleri
```json
{
  "name": "saasguide",
  "private": true,
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "infra:up": "docker compose -f infra/docker-compose.yml up -d",
    "infra:down": "docker compose -f infra/docker-compose.yml down"
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

Monorepo araçlarının (Turborepo, Nx vb.) ve kod editörünüzün tüm projeleri tanıması için **Project References** (`references`) yapısı kullanılır.

```json
{
  "files": [], // Kök dizinde doğrudan TS kodu derlenmeyecekse boş bırakılır
  "references": [
    { "path": "./apps/api" },
    { "path": "./apps/web" },
    { "path": "./packages/utils" }
  ]
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

- Turborepo ekle, tüm projeler (workspace) için geliştirme aracı olarak (dev dependency).
> --workspace-root
>
> --save-dev
```bash
pnpm add turbo -D -w
```

---

- Değişikleri uygula (`git commit-push`).
```bash
git add .
git commit -m "Monorepo kök dosyaları eklendi"
git push -u origin main
```


