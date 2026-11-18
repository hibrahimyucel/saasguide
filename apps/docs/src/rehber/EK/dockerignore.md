
# .dockerignore

```
# ==========================================
# Versiyon Kontrol & Git
# ==========================================
.git
.gitignore
.github

# ==========================================
# Bağımlılıklar ve Paket Yöneticileri (Tüm Monorepo)
# ==========================================
node_modules
**/node_modules
.pnpm-store
npm-debug.log*
pnpm-debug.log*

# ==========================================
# Turborepo, VitePress ve Build Çıktıları
# ==========================================
.turbo
**/.turbo
dist
**/dist
build
**/build
.next
**/.next
**/.vitepress/dist
**/.vitepress/cache

# ==========================================
# Güvenlik ve Hassas Yapılandırmalar
# ==========================================
.env
.env.*
!.env.example
*.conf
certs/
*.pem
*.key

# ==========================================
# Docker, IDE ve İşletim Sistemi Kalıntıları
# ==========================================
Dockerfile*
docker-compose*
.dockerignore
.vscode
.idea
.DS_Store
Thumbs.db
coverage

```

