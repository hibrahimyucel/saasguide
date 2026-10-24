# Monorepo Komut Kılavuzu

Bu sayfada, projemizde pnpm ve Turborepo kullanırken sıklıkla ihtiyaç duyacağınız temel komutlar yer almaktadır.

---

## 🚀 Yerel Geliştirme (Development)

Monorepo içindeki tüm uygulamaları ve paketleri izleme modunda (watch mode) aynı anda çalıştırmak için kök dizinde şu komutu kullanın:

```bash
pnpm dev
```

### Belirli Bir Uygulamayı Çalıştırma
Sadece tek bir uygulamayı (örneğin sadece VitePress dökümantasyonunu) ayağa kaldırmak istiyorsanız `--filter` bayrağını kullanabilirsiniz:

```bash
pnpm dev --filter docs
```

---

## 📦 Bağımlılık Yönetimi (Paket Ekleme/Silme)

pnpm ile çalışırken bağımlılıkları doğrudan alt klasörlerin içine girerek kurmak yerine, **her zaman en kök dizinden** yönetmek en iyi pratiktir.

### Kök Dizine Paket Ekleme (Global Araçlar)
Tüm repoyu ilgilendiren araçları (TypeScript, ESLint, Prettier vb.) devDependencies olarak kök dizine eklemek için `-w` kullanılır:

```bash
pnpm add <paket-adi> -D -w
```

### Belirli Bir Alt Projeye Paket Ekleme
Örneğin, `apps/api` projesine `express` paketini yüklemek için:

```bash
pnpm --filter api add express
```

---

## 🛠️ Projeyi Derleme (Build) ve Önbellek

Tüm monorepoyu Turborepo boru hattı (pipeline) üzerinden optimize bir şekilde derlemek için:

```bash
pnpm build
```

::: tip TURBOREPO ÖNBELLEKLEME (CACHING)
Eğer kodunuzda herhangi bir değişiklik yapmadıysanız, komutu ikinci kez çalıştırdığınızda Turborepo işlemi tekrar etmez ve terminalde `>>> FULL TURBO` yazar. Bu, derleme işleminin milisaniyeler içinde önbellekten getirildiğini gösterir.
:::

---

## 🧹 Temizlik Zamanı

Eğer bağımlılıklar veya linklemelerle ilgili sıra dışı bir çakışma yaşarsanız, repoyu ilk günkü temiz haline getirmek için şu adımları izleyebilirsiniz:

```bash
# node_modules ve kilit dosyalarını temizleyin (Mac/Linux için)
rm -rf node_modules **/node_modules pnpm-lock.yaml

# pnpm deposunu tazeleyin
pnpm store prune

# Bağımlılıkları sıfırdan güvenle kurun
pnpm install
```

