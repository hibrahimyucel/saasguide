---
title: "SaaS Geliştirme Rehberi"
description: SaaS Geliştirme - Teknik dokümantasyon ve uygulama rehberi.
outline: [2, 3]
sidebarTitle: "Rehber"
index: 10
isContent: false
hidden: false
collapsed: false
status: "published"
tags: ["PaaS", "SaaS"]
---

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