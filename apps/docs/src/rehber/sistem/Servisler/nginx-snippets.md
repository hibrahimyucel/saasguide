---
title: 'Modüler Nginx Mimarisi: Snippets ve Esnek Reverse Proxy Yapılandırması'
description: >-
  Bu doküman, projedeki ters vekil sunucu (Reverse Proxy) katmanının Tek
  Sorumluluk İlkesi (SRP) ve DRY (Kendini Tekrar Etme) prensiplerine uygun
  olarak n...
outline:
  - 2
  - 3
status: published
tags:
  - vitepress
  - nginx
  - docker
  - reverse-proxy
  - srp
  - clean-code
  - nip-io
---

# Modüler Nginx Mimarisi (Snippets & SRP)

Bu doküman, projedeki ters vekil sunucu (Reverse Proxy) katmanının Tek Sorumluluk İlkesi (SRP) ve DRY (Kendini Tekrar Etme) prensiplerine uygun olarak nasıl modüler hale getirildiğini belgeler.

---

## 1. Dizin Yapısı

Yapılandırma dosyaları, **genel altyapı standartları** (`snippets`) ve **servis bazlı yönlendirme kuralları** (`conf.d`) olarak iki ayrı katmana ayrılmıştır:

```text
infra/nginx/
├── conf.d/
│   ├── 00-default.conf       # HTTP -> HTTPS yönlendirmesi ve ana giriş (Gateway)
│   ├── docs.conf             # VitePress dokümantasyon sunucusu (docs.*)
│   ├── dev.conf              # Geliştirme ortamı önizleme sunucusu (dev.*)
│   └── git.conf              # Gitea ve Container Registry sunucusu (git.*)
└── snippets/
    ├── ssl-params.conf       # Ortak SSL sertifika yolları ve TLS ayarları
    └── proxy-headers.conf    # Ortak Reverse Proxy ve WebSocket başlıkları
```

---

## 2. Mimari Prensipler

1. **Ortak Standartların İzolasyonu (`snippets/`):** SSL sertifika yolları veya proxy başlıkları gibi her serviste aynı olan ayarlar tekrar yazılmaz. Ortam değişikliğinde (örneğin yerelden canlı sunucuya geçişte) yalnızca ilgili snippet dosyasının güncellenmesi yeterlidir.
2. **Servis Bazlı Esneklik (`conf.d/`):** Bir servise özel güvenlik veya performans kuralları genel şablonlara dahil edilmez. Örneğin Gitea'nın büyük Docker katmanlarını kabul etmesi için gereken `client_max_body_size 0;` ayarı yalnızca `git.conf` içinde tanımlanır.
3. **Dinamik DNS Çözümlemesi:** Docker konteynerleri yeniden başlatıldığında IP adresleri değişebileceğinden, `upstream` adresleri doğrudan `proxy_pass` içine yazılmak yerine değişken (`set $upstream ...`) olarak tanımlanır ve Docker dahili DNS sunucusu (`127.0.0.11`) ile çözümlenir.

---

## 3. Örnek Servis Yapılandırması (`git.conf`)

Aşağıdaki örnek, ortak standartları `include` ile çağırırken servise özel kuralları nasıl koruduğumuzu gösterir:

```nginx
server {
    listen 443 ssl;
    server_name git.localhost ~^git\..+\.nip\.io\$;

    # Ortak SSL ayarları
    include /etc/nginx/snippets/ssl-params.conf;

    # Gitea'ya özel esnek ayarlar
    client_max_body_size 0;
    proxy_request_buffering off;

    location / {
        set \$gitea_upstream http://pr2_dev_gitea:3000;
        proxy_pass \$gitea_upstream;

        # Ortak Proxy ve WebSocket başlıkları
        include /etc/nginx/snippets/proxy-headers.conf;
    }
}
```

