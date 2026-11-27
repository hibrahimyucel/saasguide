---
title: "SaaS Geliştirme Rehberi"
description: SaaS Geliştirme - Teknik dokümantasyon ve uygulama rehberi.
outline: [2, 3]
sidebarTitle: "Rehber"
index: 10
isContent: true
hidden: false
collapsed: false
status: "published"
tags: ["PaaS", "SaaS"]
---


```text
rehber/sistem/
├── index.md                        # Sistem Kurulumu Genel Bakış (isContent: false)
│
│   # --- 1. KATMAN: İŞLETİM SİSTEMİ, AĞ & GÜVENLİK (Lokal VM & VPS Ortak) ---
├── 10-sunucu-ve-ssh.md             # AlmaLinux 9 temel hazırlık & SSH anahtar girişi (VPS için)
├── 20-tailscale-vpn.md             # Tailscale Mesh VPN kurulumu (100.x.y.z özel ağı)
├── 30-guvenlik-duvari.md           # firewalld (eth0 vs tailscale0 izolasyonu) & Fail2ban
├── 40-temel-araclar.md             # Docker Engine, Node.js, pnpm, Git & GitHub CLI
│
│   # --- 2. KATMAN: MONOREPO & MERKEZİ .ENV SÖZLEŞMESİ ---
├── 50-monorepo-ve-ortam.md         # pr2source/ & pr2data/ kurulumu ve merkezi infra/.env
│
│   # --- 3. KATMAN: TLS SERTİFİKASYONU & EDGE GATEWAY ---
├── 60-dns-ve-wildcard-tls.md       # Certbot DNS-01 (Seçenek A: DuckDNS / Seçenek B: Cloudflare)
├── 70-nginx-gateway.md             # Docker ağları, envsubst şablonları & compose.gateway.yml
│
│   # --- 4. KATMAN: MODÜLER SERVİSLER (compose.<servis>.yml) ---
├── 80-dex-sso.md                   # Merkezi OIDC Kimlik Sağlayıcı (compose.dex.yml)
├── 90-gitea-ci.md                  # Gitea Git, Container Registry & Runner (compose.gitea.yml)
├── 100-silo-s3.md                  # PGSTY SILO S3 Depolama & minio alias (compose.silo.yml)
├── 110-veritabani.md               # MariaDB & phpMyAdmin (compose.db.yml)
├── 120-mail-sunucusu.md            # Stalwart Mail Server & SnappyMail (compose.mail.yml)
│
│   # --- 5. KATMAN: OPERASYON & SÜREKLİLİK ---
└── 130-yedekleme-ve-bakim.md       # pr2data/ yedekleme otomasyonu ve canlıya geçiş kontrolü
```



```
📁 src                                                 # 
├── 📁 .vitepress                                      # 
├── 📁 dict                                            # 20
│   ├── 📁 network                                     # 
│   │   ├── 📄 certbot.md                              # 
│   │   ├── 📄 dns-mail.md                             # 
│   │   ├── 📄 dns-tools.md                            # 
│   │   ├── 📄 dns.md                                  # 
│   │   ├── 📄 duckdns.md                              # 
│   │   ├── 📄 faill2ban.md                            # 
│   │   ├── 📄 firewalld.md                            # 
│   │   ├── 📄 index.md                                # 
│   │   ├── 📄 ldap.md                                 # 
│   │   ├── 📄 nginx.md                                # 
│   │   ├── 📄 ngrok.md                                # 
│   │   ├── 📄 nipio.md                                # 
│   │   ├── 📄 noip.md                                 # 
│   │   ├── 📄 session-description.md                  # 
│   │   ├── 📄 tailscale.md                            # 
│   │   ├── 📄 tls.md                                  # 
│   │   └── 📄 vpn.md                                  # 
│   ├── 📁 server                                      # 
│   │   ├── 📄 almalinux.md                            # 
│   │   ├── 📄 bilgi-islem-kurulum-rehberi.md          # 
│   │   ├── 📄 docker-deployment-tips.md               # 
│   │   ├── 📄 docker-export-import.md                 # 
│   │   ├── 📄 docker-network.md                       # 
│   │   ├── 📄 docker-rss.md                           # 
│   │   ├── 📄 docker.md                               # 
│   │   ├── 📄 git.md                                  # 
│   │   ├── 📄 index.md                                # 
│   │   ├── 📄 mariadb-db.md                           # 
│   │   ├── 📄 monorepo-docker-orkestrasyon-v2.md      # 
│   │   ├── 📄 node.md                                 # 
│   │   ├── 📄 phpmyadmin-dict.md                      # 
│   │   ├── 📄 pnpm.md                                 # 
│   │   ├── 📄 s3.md                                   # 
│   │   └── 📄 turbo.md                                # 
│   ├── 📁 services                                    # 
│   │   ├── 📄 dex.md                                  # 
│   │   ├── 📄 gitea-container-registry.md             # 
│   │   ├── 📄 gitea.md                                # 
│   │   ├── 📄 index.md                                # 
│   │   ├── 📄 minio.md                                # 
│   │   ├── 📄 snappy-mail.md                          # 
│   │   └── 📄 stalwart-mail-server.md                 # 
│   ├── 📁 software                                    # 
│   │   ├── 📄 index.md                                # 
│   │   ├── 📄 paas.md                                 # 
│   │   ├── 📄 seo-vitepress.md                        # 
│   │   └── 📄 vitepress.md                            # 
│   ├── 📄 crontab.md                                  # 
│   └── 📄 index.md                                    # 
├── 📁 public                                          # 
├── 📁 rehber                                          # 10
│   ├── 📁 dev                                         # 20
│   │   ├── 📄 elektron-desktop-wrapper.md             # 
│   │   ├── 📄 file-analyzer-mimari.md                 # 
│   │   ├── 📄 index.md                                # 
│   │   ├── 📄 kod-comment.md                          # 
│   │   ├── 📄 state-preservation-render.md            # 
│   │   ├── 📄 state-sorting-usememo.md                # 
│   │   ├── 📄 theme-selector-dropdown.md              # 
│   │   ├── 📄 vitepress-docker-nginx-rehberi.md       # 
│   │   ├── 📄 vitepress-production-docker-rehberi.md  # 
│   │   ├── 📄 vitepress.md                            # 
│   │   ├── 📄 vitepress2.md                           # 
│   │   ├── 📄 vitepress3-gh-pages.md                  # 
│   │   └── 📄 youtube-downloader-player.md            # 
│   ├── 📁 ek                                          # 1000
│   │   ├── 📄 dockerignore.md                         # 1
│   │   ├── 📄 gitignore.md                            # 1
│   │   └── 📄 index.md                                # 
│   ├── 📁 sistem                                      # 10
│   │   ├── 📁 host                                    # 10
│   │   │   ├── 📄 dex-sso-setup.md                    # 50
│   │   │   ├── 📄 duckdns-tls.md                      # 30
│   │   │   ├── 📄 edge-router.md                      # 40
│   │   │   ├── 📄 gitea-runner.md                     # 80
│   │   │   ├── 📄 gitea-setup.md                      # 70
│   │   │   ├── 📄 host-setup.md                       # 10
│   │   │   ├── 📄 index.md                            # 
│   │   │   ├── 📄 mariadb-setup.md                    # 90
│   │   │   ├── 📄 minio-setup.md                      # 60
│   │   │   ├── 📄 monorepo-setup.md                   # 20
│   │   │   └── 📄 phpmyadmin-setup.md                 # 100
│   │   ├── 📁 vps                                     # 20
│   │   │   ├── 📄 certbot-nginx.md                    # 40
│   │   │   ├── 📄 docker-cloudflare.md                # 30
│   │   │   ├── 📄 index.md                            # 
│   │   │   ├── 📄 mail-client-server.md               # 60
│   │   │   ├── 📄 minio-config.md                     # 70
│   │   │   ├── 📄 servisler.md                        # 50
│   │   │   ├── 📄 vps-backup.md                       # 80
│   │   │   ├── 📄 vps-giris.md                        # 10
│   │   │   ├── 📄 vps-security.md                     # 20
│   │   │   └── 📄 vps-summary.md                      # 90
│   │   ├── 📄 gitea-mirror.md                         # 40
│   │   ├── 📄 github-cli.md                           # 30
│   │   └── 📄 index.md                                # 
│   ├── 📄 app.js                                      # 
│   ├── 📄 index.md                                    # 
│   ├── 📄 master-architecture-guide.md                # 1
│   └── 📄 master-development-guide.md                 # 2
└── 📄 index.md                                        # 0

```