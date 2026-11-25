---
title: πr² Cloud
description: πr² Cloud PaaS Environment & Software Development Guide - PaaS Ortamı ve Yazılım Geliştirme Rehberi
outline: [2, 3]
sidebarTitle: "πr² Cloud"
index: 1
isContent: false
hidden: false
status: "published"
tags: [ai-reference, pr2cloud, almaLinux, monorepo, self-hosted-paas, docker, nginx, security, coding-standards, clean-code, layered-architecture, solid, naming-conventions, comments]


layout: home

hero:
  name: "πr² Cloud"
  text: "PaaS Environment & SaaS Development Guide"
  tagline: "PaaS Ortamı ve Yazılım Geliştirme Rehberi"
  image:
    light: /logo-dark.svg
    dark: /logo-dark.svg
    alt: pr2cloud Logosu
  actions:
    - theme: brand
      text: Başla
      link: /rehber/master-architecture-guide
    - theme: alt
      text: GitHub Pages
      link: https://hibrahimyucel.github.io/saasguide/
    - theme: alt
      text: GitHub Repository
      link: https://github.com/hibrahimyucel/saasguide

features:
  - icon: 🌐
    title: AlmaLinux 9 & Tailscale VPN
    details: Kurumsal Linux güvenliği ve sıfır yönetim portu prensibiyle özel VPN ağı üzerinden izole sunucu erişimi.
  - icon: 🐳
    title: Docker & Çift Ağ İzolasyonu
    details: Edge ve Internal ağ ayrımı (Dual-NIC API) ile servis ve veri katmanlarını birbirinden kesin olarak izole edin.
  - icon: 🔒
    title: Wildcard SSL & Certbot
    details: DNS-01 doğrulaması ve Certbot otomasyonu ile tarayıcı onaylı uçtan uca HTTPS güvenliği.
  - icon: 🛡️
    title: Nginx Ters Proxy & Gateway
    details: Dinamik alt alan adı yönlendirmesi ve yüksek performanslı ters vekil mimarisiyle mikro servislerinizi yönetin.
  - icon: 🔐
    title: Dex Merkezi SSO (OIDC)
    details: SQLite tabanlı hafif OAuth 2.0 / OIDC kimlik sağlayıcısı ile tüm servislerde tek oturum açma deneyimi.
  - icon: ☕
    title: Gitea & CI/CD Altyapısı
    details: Self-hosted Git deposu, Gitea Actions ve dahili OCI Container Registry yönetimi.
  - icon: ✉️
    title: Stalwart Mail & SnappyMail
    details: Rust tabanlı modern kurumsal e-posta sunucusu ve hafif webmail istemcisi entegrasyonu.
  - icon: 🗄️
    title: MinIO S3 Nesne Depolama
    details: Statik varlıklar, medya dosyaları ve sistem yedekleri için S3 uyumlu yüksek performanslı depolama.
  - icon: 📦
    title: Node.js, pnpm & Turborepo
    details: Tüm frontend, backend ve paylaşılan paketlerinizi tek bir monorepo yapısında yüksek hızla derleyin.
  - icon: ⚡
    title: VitePress Dokümantasyon Motoru
    details: Mimari kararlar, sözlük matrisleri ve uygulama rehberleri için statik dokümantasyon portalı.
---
