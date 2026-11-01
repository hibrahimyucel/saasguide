export const fileTree = [
  {
    "type": "folder",
    "name": "infra",
    "desc": "Klasör",
    "children": [
      {
        "type": "folder",
        "name": "gateway",
        "desc": "Klasör",
        "children": [
          {
            "type": "folder",
            "name": "nginx",
            "desc": "Klasör",
            "children": [
              {
                "type": "folder",
                "name": "certs",
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
                "desc": "Yapılandırma Dosyası"
              },
              {
                "type": "file",
                "name": "test.conf",
                "desc": "Yapılandırma Dosyası"
              }
            ]
          },
          {
            "type": "file",
            "name": "docker-compose.yml",
            "desc": "Dosya"
          }
        ]
      }
    ]
  },
  {
    "type": "file",
    "name": ".dockerignore",
    "desc": "Dosya"
  },
  {
    "type": "file",
    "name": ".gitignore",
    "desc": "Dosya"
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
    "desc": "Proje bağımlılık ve yönetim dosyası Proje bağımlılık ve yönetim dosyası Proje bağımlılık ve yönetim dosyası"
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
