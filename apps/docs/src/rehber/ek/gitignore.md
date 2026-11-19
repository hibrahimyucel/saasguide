---
title: .gitignore
description: node_modules/
outline:
  - 2
  - 3
status: published
tags:
  - rehber
  - ek
---

# .gitignore


```
# ==========================================
# Node.js & Paket Yöneticileri
# ==========================================
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.pnp
.pnp.js

# ==========================================
# Turborepo
# ==========================================
.turbo/

# ==========================================
# VitePress (Dökümantasyon)
# ==========================================
# Kök dizin ve alt paketlerdeki VitePress geçici ve derleme dosyaları
docs/.vitepress/cache/
docs/.vitepress/dist/
apps/docs/.vitepress/cache/
apps/docs/.vitepress/dist/
**/.vitepress/cache/
**/.vitepress/dist/

# ==========================================
# Genel Build ve Dağıtım Çıktıları (apps/web, backend vb.)
# ==========================================
dist/
build/
out/
.next/
.nuxt/
.output/

# ==========================================
# Ortam Değişkenleri (Environment Variables)
# ==========================================
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# ==========================================
# Test ve Kapsama (Coverage) Raporları
# ==========================================
coverage/
.nyc_output/

# ==========================================
# IDE, Editör ve İşletim Sistemi Dosyaları
# ==========================================
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.DS_Store
Thumbs.db
```

