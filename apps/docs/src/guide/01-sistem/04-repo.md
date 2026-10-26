
# Çalışma Dizini - Git Repository

---

 - Repo oluştur.
 
Çalışma dizinini oluştur, git reposu olarak tanımla (`initialize`).

```bash
mkdir saasguide
cd saasguide
git init
git branch -m main
```

---

 - `.gitignore` dosyasını oluştur

git tarafından takip edilmeyecek ve paylaşılmayacak dosya-klasörleri bu dosyada belirtmelisiniz.

::: details `.gitignore`
```
# -------------------------
# OS
# -------------------------
# macOS
.DS_Store
.AppleDouble
.LSOverride

# Thumbnails, desktop.ini
Thumbs.db
ehthumbs.db
Desktop.ini

# -------------------------
# Node / package managers
# -------------------------
# Ignore node_modules anywhere in the repo
**/node_modules/
node_modules/

# pnpm store/cache (usually global, do not commit)
.pnpm-store/
.pnpm-debug.log*

# Keep lockfiles in source control (do NOT ignore pnpm-lock.yaml / package-lock.json / yarn.lock)
# pnpm-lock.yaml
# package-lock.json
# yarn.lock

# corepack / binary artifacts
*.tgz

# -------------------------
# Monorepo / caching / build tools
# -------------------------
# Turborepo
.turbo/
.turbo/**

# Vite/VitePress build output (ignore all .vitepress/dist in subpackages)
**/.vitepress/dist/
.vitepress/dist/

# Common build output
dist/
build/
out/
. output/

# Parcel
.cache
.parcel-cache

# Next/Nuxt / SvelteKit / Astro / Remix
.next/
.nuxt/
.build/
.astro/
.svelte-kit/
.vercel/
.serverless/

# -------------------------
# Logs, coverage, reports
# -------------------------
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
*.log

coverage/
.nyc_output/
coverage-*.json

# TypeScript incremental and cache files
*.tsbuildinfo
.vscode-test/

# -------------------------
# Env / secrets
# -------------------------
.env
.env.*.local
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.secret
# Keep example envs
!.env.example
!.env.sample

# -------------------------
# Editor / IDE
# -------------------------
# VSCode
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
# JetBrains (IntelliJ, WebStorm, PhpStorm...)
.idea/
*.iml

# Sublime
*.sublime-workspace
*.sublime-project

# Emacs / Vim
*~
.*.swp
*.swo
.session
# macOS resource forks
._*
# Windows file locks
*.lnk

# -------------------------
# Language specific
# -------------------------
# Python
__pycache__/
*.py[cod]
*$py.class

# Ruby
*.gem
*.rbc
.bundle/
vendor/bundle/

# Java
*.class
*.war
*.ear

# Go
*.exe
*.exe~
*.test
*.out

# Rust / Cargo
/target/

# -------------------------
# Tooling caches & misc
# -------------------------
.eslintcache
.stylelintcache
.cache/
.cache/**

# Storybook
.out/
storybook-static/

# Test results
test-results/
junit-*.xml

# BrowserStack/Playwright/Webdriver artifacts
playwright-report/
screenshots/

# Yarn PnP
.pnp.*
.yarn/*
!.yarn/releases
!.yarn/plugins
!.yarn/patches
!.yarn/releases/*
!.yarn/plugins/*

# npm pack output
*.tgz

# Docker
docker-compose.override.yml
.env.*.docker

# Certificates and private keys
*.pem
*.key
*.crt

# Logs (IDE/test/build)
logs/
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# -------------------------
# Optional / project-specific
# -------------------------
# If you DON'T want to ignore dist for a package that must be committed,
# remove or comment out the matching dist/ line above.
# If you want to ignore only specific package dist directories, use:
# apps/some-package/dist/

# VitePress nested path issues: ignore any accidental nested dist dirs
**/.vitepress/**/.vitepress/dist/

# -------------------------
# Local OS/Dev machine files
# -------------------------
.vagrant/
*.swp
.sass-cache
.cache-loader

# -------------------------
# End
# -------------------------

```
:::

---

 - README.md dosyası oluştur ve ilk `commit`i yap.
```bash
echo "# saasguide" >> README.md
git add .
git commit -m "Repo oluşturuldu"
```

---

 - `remote origin` uzak depolama

 [Github](https://github.com/) üzerinde boş bir repo oluştur ve yerel repoya bağla. 
```
git remote add origin https://github.com/<kullanıcı adı>/<repo adı>.git
git push -u origin main
```
