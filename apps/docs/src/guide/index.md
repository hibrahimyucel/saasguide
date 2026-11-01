
# Rehber

```text

 📁 apps/                    # Dağıtılabilir / çalıştırılabilir ana uygulamalar
    📁 docs/                 # Dökümantasyon (Vitepress)
 
 📁 infra/                   # Docker operasyonel dosyaları ve orkestrasyon
    📁 gateway/              # Edge Router - Nginx klasörü
       📄 docker-compose.yml # Çoklu konteyner orkestrasyon dosyası
       📁 nginx/             # Nginx konfigürasyon klasörü
          📄 test.conf       # Nginx test yapılandırması
          📄 dev.conf        # Nginx developper reverse proxy ayarları
          📁 certs/          # SSL 

 📁 .github/               # CI/CD (GitHub Actions) iş akışları
    📁 workflows/          
       📄 deploy-docs.yml 

 📄 .gitignore           # Git tarafından takip edilmeyecek dosyalar
 📄 .dockerignore        # Docker tarafından takip edilmeyecek dosyalar
 📄 package.json         # Monorepo kök bağımlılıkları ve scriptleri
 📄 pnpm-workspace.yaml  # Çalışma alanlarını (workspaces) tanımlayan dosya
 📄 README.md            # Proje açıklamaları
 📄 turbo.json           # Turborepo yapılandırma dosyası
 📄 tsconfig.json        # Ortak TypeScript ana yapılandırması

```

