---
tarih: 2026-11-14
saat: 23:06
konu: "Docker İmaj Export / Import ve Konteyner Bağlama Hızlı Rehberi"
baglam: "apps/docs / Dağıtım ve Taşıma Operasyonları"
durum: "Tamamlandı"
etiketler: [docker, docker-save, docker-load, deployment, vitepress, rehber]
---

# 📦 Docker İmaj Export ve Hedef Ortama Bağlama Rehberi

Bu doküman, `pr2-docs:latest` üretim imajının kaynak kodlara ihtiyaç duymadan sıkıştırılmış arşiv (`.tar.gz`) olarak dışa aktarılması ve hedef ortamda Gateway ağına bağlanarak çalıştırılması adımlarını özetler.

---

## 1. İmajı Derleme ve Dışa Aktarma (Kaynak Makine)

1. **İmajı Etiketleyerek Derleyin (`source/` dizininde):**
   ```bash
   docker compose -f apps/docs/docker-compose.prod.yml build
   ```

2. **İmajı Sıkıştırılmış Arşiv Olarak Kaydedin (`Export`):**
   ```bash
   docker save pr2-docs:latest | gzip > ~/pr2-docs-latest.tar.gz
   ```

---

## 2. İmajı Yükleme ve Ağa Bağlama (Hedef Makine)

1. **Arşiv Dosyasını Docker Motoruna Yükleyin (`Import`):**
   ```bash
   docker load -i ~/pr2-docs-latest.tar.gz
   ```

2. **Gateway Ağını Doğrulayın (Yoksa Oluşturun):**
   ```bash
   docker network inspect pr2_dev_network >/dev/null 2>&1 || docker network create pr2_dev_network
   ```

3. **Minimal `docker-compose.yml` ile Konteyneri Başlatın:**
   Hedef makinede kaynak kod olmaksızın aşağıdaki yapılandırma ile servisi ayağa kaldırın:
   ```yaml
   name: docs_prod
   services:
     docs-prod:
       image: pr2-docs:latest
       container_name: docs_prod
       restart: unless-stopped
       networks:
         - pr2_dev_network
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 128M

   networks:
     pr2_dev_network:
       external: true
   ```

4. **Derleme Yapmadan Çalıştırın (`--no-build`):**
   ```bash
   docker compose up -d --no-build
   ```

---

## 3. Hızlı Otomasyon Komutları (`package.json`)

| İşlem | Komut |
| :--- | :--- |
| **Tek Komutla Export** | `pnpm --filter docs docker:prod:export` |
| **Tek Komutla Import & Run** | `pnpm --filter docs docker:prod:import` |

