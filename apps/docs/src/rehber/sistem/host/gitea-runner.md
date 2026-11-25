---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "SaaS Rehberi"
outline: [2, 3]
sidebarTitle: "Gitea Runner - İş Akışı"
index: 80
isContent: true
hidden: false
status: "published"
tags: ["Paas","Saas"]
---


# Gitea, OCI Container Registry & Act Runner

* **Üretici / Bakım:** Gitea Open Source Community
* **Resmi Web Sitesi:** [https://gitea.com](https://gitea.com) | [runner](https://docs.gitea.com/usage/actions/runner/)

::: info CONCEPT MATRICES
* **Version Control & Forge:** Self-Hosted Git Server (`https://gitea.<domain>`)
* **Artifact & Image Storage:** Built-in OCI Container Registry (`gitea.<domain>/<owner>/<image>:<tag>`)
* **CI/CD Execution Engine:** Gitea Actions via `gitea/act_runner` daemon
* **Identity Federation:** OpenID Connect (OIDC) SSO via Dex (`https://auth.<domain>`)
* **Network Isolation:** `pr2_internal_net` (Dual-NIC) behind Nginx Reverse Proxy with Docker DNS Aliases
:::


## Resmi Tanım
**Gitea**, düşük kaynak tüketimiyle tam kapsamlı Git kod barındırma, kod inceleme (Pull Request), **Gitea Actions** CI/CD otomasyonu ve dahili **OCI Container Registry** sunan açık kaynaklı bir DevOps platformudur. `pr2cloud` mimarisinde harici GitHub/Docker Hub bağımlılığını ortadan kaldırır; derlenen Docker imajları doğrudan Gitea'nın kendi kayıt defterinde saklanır ve **Act Runner** aracılığıyla otomatik olarak derlenip dağıtılır.

## Sözlük Veritabanı (Lexical Database)

| Terim | Açıklama |
| :--- | :--- |
| **OCI Container Registry** | Open Container Initiative uyumlu, Docker imajlarının (`docker push / pull`) harici bir servis kurulmadan doğrudan Gitea üzerinde barındırıldığı kayıt defteri. |
| **Act Runner (`act_runner`)** | `.gitea/workflows/*.yml` altındaki CI/CD iş akışlarını dinleyen, izole konteynerlerde test/derleme çalıştıran arka plan işçisi (worker). |
| **Registration Token** | Yeni bir `act_runner` düğümünün Gitea sunucusuna güvenli biçimde kaydedilmesi için Site Yönetimi panelinden üretilen tek seferlik anahtar. |
| **Runner Labels** | İş akışlarındaki `runs-on:` hedefini belirleyen etiketler (Örn: `ubuntu-latest:docker://node:22-bookworm`). |
| **Docker Socket Mount** | Runner konteynerinin iş akışı sırasında yeni Docker imajları derleyip registry'ye gönderebilmesi için host `/var/run/docker.sock` bağlaması. |

## Cheatsheet: Gitea & OCI Registry Komutları

| İşlem | Komut / Format | Açıklama |
| :--- | :--- | :--- |
| **Registry Girişi** | `docker login gitea.<domain>` | Gitea kullanıcı adı ve Personal Access Token (PAT) ile giriş |
| **İmaj Etiketleme** | `docker tag app:latest gitea.<domain>/pr2/app:1.0.0` | Yerel imajı Gitea OCI Registry adresine göre etiketleme |
| **İmaj Gönderme** | `docker push gitea.<domain>/pr2/app:1.0.0` | Derlenen imajı dahili kayıt defterine yükleme |
| **Otomatik Token** | <code v-pre>${{ secrets.GITHUB_TOKEN }}</code> | Gitea Actions içinde ek şifre tanımlamadan registry'ye push yetkisi |

---

## Uygulama Adımları (`source/infra/`)

### 1. Kalıcı Veri Dizinlerinin Oluşturulması
Gitea depoları, OCI imaj katmanları ve Act Runner önbellekleri için kalıcı `data/` dizinlerini hazırlayın:

```bash
mkdir -p data/gitea-runner
mkdir -p source/infra/gitea-runner
```

### 2. Gateway İç Ağ DNS Alias Yapılandırması (`source/infra/gateway/docker-compose.yml`)
İzole `pr2_internal_net` içindeki Gitea ve Act Runner konteynerlerinin hem OIDC (`auth.<domain>`) hem de kendi Git/Registry uç noktalarına (`gitea.<domain>`) IP değişiminden etkilenmeden ulaşabilmesi için `nginx-gateway` servisine takma adları ekleyin:

```yaml
services:
  nginx-gateway:
    networks:
      pr2_edge_net:
      pr2_internal_net:
        aliases:
          - auth.<domain>
          - gitea.<domain>
          - s3.<domain>
          - minio.<domain>
```
### 3. Ortam Değişkenleri (`source/infra/gitea-runner/.env`)

`UPPER_SNAKE_CASE` standardına uygun olarak Runner parametrelerini tanımlayın.

* Token almak için sunucu terminalinde `docker exec -u 1000 pr2-gitea-dev gitea actions generate-runner-token` komutunu çalıştırabilir veya arayüzden kopyalayabilirsiniz.

* Gitea arayüzünde **Site Administration -> Actions -> Runners -> Create new Runner** yolundan `REGISTRATION_TOKEN` değerini alıp `.env` dosyasına yapıştırın.

```env
# --- GITEA ACT RUNNER (CI/CD) ---
GITEA_INSTANCE_URL=http://pr2-gitea-dev:3000
GITEA_RUNNER_REGISTRATION_TOKEN=site-yonetiminden-alinan-token
GITEA_RUNNER_NAME=pr2-dev-runner
GITEA_RUNNER_LABELS=ubuntu-latest:docker://node:22-bookworm,self-hosted:host
GITEA_RUNNER_JOB_CONTAINER_NETWORK=pr2_internal_net
```

### 4. Docker Compose Servis Tanımı (`source/infra/gitea-runner/docker-compose.yml`)
`act-runner` servisini mevcut `pr2_internal_net` ağı üzerinde, ana Gitea konteynerinden bağımsız bir Compose yığını olarak tanımlayın:


```yaml
services:
  act-runner:
    image: gitea/act_runner:latest
    container_name: pr2-gitea-runner
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ../../../data/gitea-runner:/data
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - pr2_internal_net

networks:
  pr2_internal_net:
    external: true
```


### 5. Act Runner Aktivasyonu

   
   * Runner konteynerini başlatın ve durumunu doğrulayın:
   
     ```bash
     docker compose up -d
     docker logs pr2-gitea-runner --tail 20
     ```
https://gitea.pr2cloud.duckdns.org/-/admin/actions/runners

* Gitea arayüzünde **Site Administration -> Actions -> Runners** listesinde oluşturduğunuz runner listelenmeli.

