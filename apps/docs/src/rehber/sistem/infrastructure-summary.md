# Altyapı Özeti

- *pnpm* paket yöneticisi, *Turbo* monorepo aracı geliştirme ortamına eklendi.

- Proje altyapısı, Docker-Nginx orkestrasyonu ile oluşturuldu.  

- Bu adımdaki dosyalara, monorepo [*infrastructure*](https://github.com/hibrahimyucel/saasrehberi/tree/infrastructure)
branşı üzerinden erişebilirsiniz.


## Dosya Listesi 

```
📁 saasrehberi                         
├── 📁 .git                             # Git veritabanı. Bulunduğu klasörün ham verilerini ve tüm versiyon kontrol bilgilerini  saklar.
├── 📁 infra                            # Proje altyapı (Infrastructure) klasörü.
│   └── 📁 gateway                      # Edge Router-Reverse Proxy. Servislerin dış ağlar ve birbirleri ile haberleşmesini sağlayan arabirim.
│       ├── 📁 nginx                    # NGINX yapılandırma klasörü
│       │   ├── 📁 certs                # HTTPS bağlantısı için gerekli olan SSL/TLS sertifikaları klasörü.
│       │   │   ├── 📄 localhost.crt    # SSL/TLS Sertifikası
│       │   │   └── 📄 localhost.key    # SSL/TLS Sertifika anahtarı
│       │   ├── 📄 dev.conf             # Configuration - yapılandırma ve ayar dosyası
│       │   └── 📄 test.conf            # Configuration - yapılandırma ve ayar dosyası
│       └── 📄 docker-compose.yml       # Docker konteyner yapılandırma dosyası
├── 📁 node_modules                     # Node.js/npm paket bağımlılıkları dizini.
├── 📄 .dockerignore                    # Docker tarafından yoksayılacak dosya-klasör listesi
├── 📄 .gitignore                       # Git tarafından yoksayılacak dosya klasör listesi
├── 📄 package.json                     # Node.js proje manifestosu; bağımlılıkları, betikleri ve meta verileri tanımlar.
├── 📄 pnpm-lock.yaml                   # pnpm paket yöneticisinin içerik adreslemeli depolama kilit dosyası.
├── 📄 pnpm-workspace.yaml              # Monorepo kök dosyası. Bağlı klasörleri, genel paketleri ve versiyonları tanımlar.
├── 📄 README.md                        # Projenin amacını, kurulum adımlarını ve kullanım talimatlarını içeren ana kılavuz.
├── 📄 tsconfig.base.json               # Typescript ayarları 
├── 📄 tsconfig.json                    # Typescript ayarları 
└── 📄 turbo.json                       # Turborepo monorepo görev yönetim, önbellekleme ve pipeline yapılandırma dosyası.

```


## Dosya Listesi (Vue)

*(örnek olarak eklenmiştir)*

<FileTree :items="fileTree" />

<script setup>
import FileTree from '../../.vitepress/components/FileTree.vue';

// Klasör yapınızı ve açıklamalarınızı buradan düzenleyebilirsiniz:
const fileTree = [
  {
  "name": "saasrehberi",
  "path": "/saasrehberi",
  "isDirectory": true,
  "children": [
    {
      "name": ".git",
      "path": "/saasrehberi/.git",
      "isDirectory": true,
      "description": "Git veritabanı. Bulunduğu klasörün ham verilerini ve tüm versiyon kontrol bilgilerini  saklar."
    },
    {
      "name": "infra",
      "path": "/saasrehberi/infra",
      "isDirectory": true,
      "description": "Proje altyapı (Infrastructure) klasörü.",
      "children": [
        {
          "name": "gateway",
          "path": "/saasrehberi/infra/gateway",
          "isDirectory": true,
          "description": "Edge Router-Reverse Proxy. Servislerin dış ağlar ve birbirleri ile haberleşmesini sağlayan arabirim.",
          "children": [
            {
              "name": "nginx",
              "path": "/saasrehberi/infra/gateway/nginx",
              "isDirectory": true,
              "description": "NGINX yapılandırma klasörü",
              "children": [
                {
                  "name": "certs",
                  "path": "/saasrehberi/infra/gateway/nginx/certs",
                  "isDirectory": true,
                  "description": "HTTPS bağlantısı için gerekli olan SSL/TLS sertifikaları klasörü.",
                  "children": [
                    {
                      "name": "localhost.crt",
                      "path": "/saasrehberi/infra/gateway/nginx/certs/localhost.crt",
                      "isDirectory": false,
                      "size": 1671,
                      "description": "SSL/TLS Sertifikası"
                    },
                    {
                      "name": "localhost.key",
                      "path": "/saasrehberi/infra/gateway/nginx/certs/localhost.key",
                      "isDirectory": false,
                      "size": 1704,
                      "description": "SSL/TLS Sertifika anahtarı"
                    }
                  ]
                },
                {
                  "name": "dev.conf",
                  "path": "/saasrehberi/infra/gateway/nginx/dev.conf",
                  "isDirectory": false,
                  "size": 2562,
                  "description": "Configuration - yapılandırma ve ayar dosyası"
                },
                {
                  "name": "test.conf",
                  "path": "/saasrehberi/infra/gateway/nginx/test.conf",
                  "isDirectory": false,
                  "size": 2176,
                  "description": "Configuration - yapılandırma ve ayar dosyası"
                }
              ]
            },
            {
              "name": "docker-compose.yml",
              "path": "/saasrehberi/infra/gateway/docker-compose.yml",
              "isDirectory": false,
              "size": 695,
              "description": "Docker konteyner yapılandırma dosyası"
            }
          ]
        }
      ]
    },
    {
      "name": "node_modules",
      "path": "/saasrehberi/node_modules",
      "isDirectory": true,
      "description": "Node.js/npm paket bağımlılıkları dizini."
    },
    {
      "name": ".dockerignore",
      "path": "/saasrehberi/.dockerignore",
      "isDirectory": false,
      "size": 103,
      "description": "Docker tarafından yoksayılacak dosya-klasör listesi"
    },
    {
      "name": ".gitignore",
      "path": "/saasrehberi/.gitignore",
      "isDirectory": false,
      "size": 3326,
      "description": "Git tarafından yoksayılacak dosya klasör listesi"
    },
    {
      "name": "package.json",
      "path": "/saasrehberi/package.json",
      "isDirectory": false,
      "size": 313,
      "description": "Node.js proje manifestosu; bağımlılıkları, betikleri ve meta verileri tanımlar."
    },
    {
      "name": "pnpm-lock.yaml",
      "path": "/saasrehberi/pnpm-lock.yaml",
      "isDirectory": false,
      "size": 2389,
      "description": "pnpm paket yöneticisinin içerik adreslemeli depolama kilit dosyası."
    },
    {
      "name": "pnpm-workspace.yaml",
      "path": "/saasrehberi/pnpm-workspace.yaml",
      "isDirectory": false,
      "size": 40,
      "description": "Monorepo kök dosyası. Bağlı klasörleri, genel paketleri ve versiyonları tanımlar."
    },
    {
      "name": "README.md",
      "path": "/saasrehberi/README.md",
      "isDirectory": false,
      "size": 12,
      "description": "Projenin amacını, kurulum adımlarını ve kullanım talimatlarını içeren ana kılavuz."
    },
    {
      "name": "tsconfig.base.json",
      "path": "/saasrehberi/tsconfig.base.json",
      "isDirectory": false,
      "size": 237,
      "description": "Typescript ayarları "
    },
    {
      "name": "tsconfig.json",
      "path": "/saasrehberi/tsconfig.json",
      "isDirectory": false,
      "size": 39,
      "description": "Typescript ayarları "
    },
    {
      "name": "turbo.json",
      "path": "/saasrehberi/turbo.json",
      "isDirectory": false,
      "size": 277,
      "description": "Turborepo monorepo görev yönetim, önbellekleme ve pipeline yapılandırma dosyası."
    }
  ]
  }
];
</script>

