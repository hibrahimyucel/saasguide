# GitHub Pages Dağıtım (Deployment) Kılavuzu

Bu kılavuz, pnpm workspaces ve Turborepo ile oluşturulmuş monorepodaki VitePress dökümantasyon projesini GitHub Pages üzerinde ücretsiz ve otomatik (CI/CD) olarak nasıl yayınlayacağınızı adım adım açıklar.

---

### Adım 1: VitePress Alt Yol Ayarı (`base`)

GitHub Pages siteleri varsayılan olarak `https://<kullanici-adi>.github.io/<repo-adi>/` formatında açılır. Linklerin kırılmaması için repository adınızı VitePress'e bildirmelisiniz.

`apps/docs/src/.vitepress/config.ts` dosyanızı açın ve en üst seviyeye `base` parametresini ekleyin:

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  // GitHub'daki repository adınız neyse buraya tam olarak aynısını yazın
  // (Başında ve sonunda eğik çizgi olmalıdır)
  base: '/monorepo-repo-adiniz/', 

  title: "Proje Dokümantasyonu",
  // ...diğer mevcut ayarlarınız
})
```

---

### Adım 2: GitHub Actions İş Akışı Dosyası (CI/CD)

Her `main` branch'ine kod gönderdiğinizde sitenin otomatik derlenip yayına alınması için iş akışı dosyasını oluşturun.

Monoreponun en kök dizininde şu klasör yolunu açın: `.github/workflows/`. İçerisine **`deploy-docs.yml`** adında bir dosya oluşturup aşağıdaki yapılandırmayı ekleyin:

```yaml
name: Deploy VitePress to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Documentation
        run: pnpm --filter docs build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: apps/docs/src/.vitepress/dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### Adım 3: Değişiklikleri Git'e Gönderme (Checkpoint)

Tüm ayarları kaydedin ve terminalde en kök dizindeyken sırasıyla aşağıdaki komutları koşturarak projenizi GitHub'a push edin:

```bash
# 1. Değişiklikleri sahneye ekleyin
git add .

# 2. Checkpoint commit'i oluşturun
git commit -m "deploy: GitHub Pages CI/CD iş akışı ve base url ayarları tamamlandı"

# 3. Kodları GitHub'a gönderin
git push origin main
```

---

### Adım 4: GitHub Repository Ayarı

Kodları push ettikten sonra GitHub tarayıcınızda projenizin sayfasına gidin:

1. Üstteki menü barlarından **Settings (Ayarlar)** sekmesine tıklayın.
2. Sol menüdeki listeden **Pages** seçeneğine gelin.
3. **Build and deployment** başlığı altındaki **Source** açılır menüsünü (dropdown) bulun.
4. Bu ayarı `Deploy from a branch` yerine **`GitHub Actions`** olarak değiştirin.

Artık her `git push` işleminizde GitHub projenizi otomatik olarak derleyecek ve birkaç dakika içinde dökümantasyon sitenizi yayına alacaktır. Canlı takip sürecini GitHub üzerindeki **Actions** sekmesinden izleyebilirsiniz.


### Adım 5: Checkpoint
  1. Son yapılan tüm güncellemeleri kontrol edin ve ekleyin
git add .

  2. Checkpoint commit'inizi oluşturun
git commit -m "checkpoint: pnpm workspaces altyapısı, Türkçe VitePress ve GitHub Pages entegrasyonu tamamlandı"

  3. Bu stabil sürüme kalıcı bir Git Etiketi (Tag) vurun
git tag -a v1.0.0 -m "Sürüm 1.0.0: İlk kararlı monorepo ve dökümantasyon yapısı"

  4. Kodları ve oluşturduğunuz etiketi GitHub'a push edin
git push origin main
git push origin --tags

