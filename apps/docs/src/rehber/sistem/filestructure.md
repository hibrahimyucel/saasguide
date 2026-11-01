# Dosya ve Klasörler

# Dosya ve Klasörler

Aşağıda projemizin güncel klasör hiyerarşisi yer almaktadır. Dosya yollarını kopyalamak için üzerlerine tıklayabilirsiniz.


<FileTree :items="fileTree" />

```bash
   git add .
   git commit -m "Docker, Nginx-SSL Testi tamamlandı."
   git push origin
```

<script setup>
import FileTree from '../../.vitepress/components/FileTree.vue';

// Klasör yapınızı ve açıklamalarınızı buradan düzenleyebilirsiniz:
const fileTree = [
  {
    "type": "folder","name": "infra","desc": "Docker operasyonel dosyaları ve orkestrasyon",
    "children": [
      {"type": "folder","name": "gateway","desc": "Edge Router",
        "children": [
          {"type": "folder","name": "nginx","desc": "Nginx yapılandırma klasörü",
            "children": [
              {"type": "folder","name": "certs",
                "desc": "SSL dosyaları",
                "children": [
                  {
                    "type": "file",
                    "name": "localhost.crt",
                    "desc": "SSL Sertifikası"
                  },
                  {
                    "type": "file",
                    "name": "localhost.key",
                    "desc": "SSL Sertifika anahtarı"
                  }
                ]
              },
              {
                "type": "file",
                "name": "dev.conf",
                "desc": "Nginx Geliştirici Yapılandırma Dosyası"
              },
              {
                "type": "file",
                "name": "test.conf",
                "desc": "Nginx Test Yapılandırma Dosyası"
              }
            ]
          },
          {
            "type": "file",
            "name": "docker-compose.yml",
            "desc": "Docker Konteyner orkestrasyon dosyası"
          }
        ]
      }
    ]
  },
  {
    "type": "file",
    "name": ".dockerignore",
    "desc": "Docker tarafından takip edilmeyecek dosyalar"
  },
  {
    "type": "file",
    "name": ".gitignore",
    "desc": "Git tarafından takip edilmeyecek dosyalar"
  },
  {
    "type": "file",
    "name": "dosya-config.json",
    "desc": "JSON Veri Dosyası"
  },
  {
    "type": "file",
    "name": "dosya.js",
    "desc": "JavaScript Betiği"
  },
  {
    "type": "file",
    "name": "fileTree.js",
    "desc": "JavaScript Betiği"
  },
  {
    "type": "file",
    "name": "package.json",
    "desc": "Monorepo-Proje bağımlılık ve yönetim dosyası"
  },
  {
    "type": "file",
    "name": "pnpm-lock.yaml",
    "desc": "Dosya"
  },
  {
    "type": "file",
    "name": "pnpm-workspace.yaml",
    "desc": "Dosya"
  },
  {
    "type": "file",
    "name": "README.md",
    "desc": "Dokümantasyon Dosyası"
  },
  {
    "type": "file",
    "name": "tsconfig.base.json",
    "desc": "JSON Veri Dosyası"
  },
  {
    "type": "file",
    "name": "tsconfig.json",
    "desc": "JSON Veri Dosyası"
  },
  {
    "type": "file",
    "name": "turbo.json",
    "desc": "JSON Veri Dosyası"
  }
];
</script>


```
├── 📁 .github/                  # CI/CD (GitHub Actions) iş akışları
├── 📁 apps/                     # Dağıtılabilir / çalıştırılabilir ana uygulamalar
│   ├── 📁 admin-dashboard/      # Yönetim paneli (React/Next.js)
│   └── 📁 api-server/           # Backend servisi (NestJS/Express)
├── 📁 packages/                 # Ortak kullanılan paylaşılan kütüphaneler
│   ├── 📁 database/             # Prisma/Mongoose şemaları ve DB bağlantısı
│   ├── 📁 ui-components/        # Ortak UI bileşenleri (Design System)
│   └── 📁 utils/                # Ortak yardımcı fonksiyonlar
├── 📁 docker/                   # 
│   ├── 📁 nginx/                # Nginx konfigürasyon klasörü
│   │   └── 📄 nginx.conf        # Nginx ana veya reverse proxy ayarları
│   ├── 📄 Dockerfile.api        # API servisi için Docker imaj talimatları
│   ├── 📄 Dockerfile.web        # Frontend servisi için Docker imaj talimatları
│   └── 📄 docker-compose.yml    # Çoklu konteyner orkestrasyon dosyası
├── 📄 .gitignore                # Git tarafından takip edilmeyecek dosyalar
├── 📄 .prettierrc               # Kod biçimlendirme kuralları
├── 📄 eslint.config.js          # Kod kalitesi ve stil denetimi kuralları
├── 📄 package.json              # Monorepo kök bağımlılıkları ve scriptleri
├── 📄 pnpm-workspace.yaml       # Çalışma alanlarını (workspaces) tanımlayan dosya
├── 📄 turbo.json                # Turborepo yapılandırma dosyası (kullanılıyorsa)
└── 📄 tsconfig.json             # Ortak TypeScript ana yapılandırması
```


```bash
   git add .
   git commit -m "Docker, Nginx-SSL Testi tamamlandı."
   git push origin
```

