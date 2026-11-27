---
title: "SaaS Geliştirme Rehberi"
description: SaaS Geliştirme - Teknik dokümantasyon ve uygulama rehberi.
outline: [2, 3]
sidebarTitle: "DNS - TLS"
index: 50
isContent: true
hidden: false
collapsed: false
status: "published"
tags: ["PaaS", "SaaS"]
---

# DNS ve Wildcard TLS Kurulumu

::: info DNS-01 Sertifika Mimarisi
Bu rehber; **πr² Cloud** altyapısındaki tüm servisler (`docs`, `auth`, `gitea`, `s3`, `s3-console`, `db`, `mail`, `webmail`) için tek seferde geçerli **Wildcard TLS** sertifikası üretir. Sertifika dosyalarına sistemde yalnızca **Nginx** ve **Stalwart Mail Server** doğrudan erişir; diğer tüm servisler iç ağda SSL yükü olmadan çalışır.
:::

## Yöntem Seçimi (Ortam Bağımsız Tek Çıktı)

Altyapınızın kullanım senaryosuna göre aşağıdaki DNS sağlayıcılarını kullanabilirsiniz. Her iki yöntem de sertifikaları standart **`<-DATA_DIR->/certs/live/<-DOMAIN->/`** dizinine yerleştirir; bu sayede sonraki adımlardaki Nginx ve servis kurulumları ortamdan bağımsız olarak birebir aynı kalır:

* **A. DuckDNS (Özel VPN Ağı / Test):** Tailscale (`100.x.y.z`) gibi kapalı ağlarda veya ücretsiz alt alan adıyla (`projeadi.duckdns.org`) hızlı kurulum için kullanılır.
* **B. Cloudflare (Canlı Özel Alan Adı):** Kendi alan adınız (`alanadi.com`) ve kurumsal e-posta (`MX`, `SPF`, `DKIM`, `DMARC`) kayıtlarıyla canlı yayın için kullanılır.
