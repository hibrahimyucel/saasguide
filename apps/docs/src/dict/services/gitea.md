---
tarih: 2026-11-17
saat: 23:16
konu: "Gitea: Self-Hosted Git ve DevOps Platformu (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Altyapı Referans Kılavuzu (Katman 7: Gitea)"
durum: "Tamamlandı"
etiketler: [gitea, git-server, self-hosted, ci-cd, gitea-actions, container-registry, lexical-database, referans, altyapi-katman-7]
---

# Gitea (Git - DevOps)

* **Üretici / Geliştirici:** Lunny Xiao, Gitea Topluluğu & Gitea Limited
* **Resmi Web Sitesi:**  [gitea.io](https://gitea.io)
::: info CONCEPT MATRICES
* **Domain:** Collaborative Software Development & DevOps Automation
* **Superordinate Concept:** Self-Hosted Git Forge & CI/CD Platform
* **Implementation Language:** Go (Golang) — Single Cross-Platform Binary
* **Core Capabilities:** Git Repository Hosting, Pull Request Review, Gitea Actions (CI/CD), OCI Container & Package Registry
:::

## 1. Resmi Tanım (Formal Definition)

**Gitea**, Go (Golang) programlama diliyle geliştirilmiş; minimum donanım kaynağıyla (düşük RAM ve CPU) çalışabilen, kendi sunucunuzda barındırabileceğiniz (self-hosted) açık kaynaklı ve hafif bir Git kod barındırma, kod inceleme ve CI/CD otomasyon platformudur.

---

## 2. Mimari Rolü ve Temel Prensipleri

Bulut tabanlı GitHub veya GitLab servislerine bağımlı kalmadan tüm kaynak kodlarımızı, otomasyon iş akışlarımızı ve derlenen **Docker**  imajlarımızı kendi özel **Tailscale** ağımız içinde barındırmamızı sağlar.

* **Yüksek Performans ve Düşük Kaynak Tüketimi:** Go ile derlenmiş tek bir ikili dosya (binary) olarak çalışır; yalnızca birkaç yüz megabayt RAM ile yüzlerce depoyu yönetebilir.

* **Gitea Actions (GitHub Actions Uyumlu CI/CD):** GitHub Actions iş akışı dosyalarıyla (`.gitea/workflows/*.yaml`) birebir uyumlu bir CI/CD motoruna sahiptir. Her `git push` işleminde otomatik derleme ve dağıtım tetiklenebilir.

* **Dahili Paket ve İmaj Kayıt Defteri (Package & Container Registry):** Harici bir Docker Registry kurulumuna gerek kalmadan; Docker imajlarını, npm paketlerini ve diğer yazılım artefaktlarını doğrudan Gitea sunucusu üzerinde depolar.

* **Mirror Repository :** Yerel git yapılandırmanıza iki uzak sunucu ( Gitea fetch,push / Github push ) eklemek yerine zinzirleme bir yedekleme sistemi kullanabilirsiniz. İki reponun da aktif olarak kullanılması sorun yaratabilir.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Git Forge** | Yazılım Geliştirme Merkezi | Salt Git protokolünün ötesinde; web arayüzü, hata takibi (Issues), Pull Request ve CI/CD araçlarını birleştiren platform. |
| **Gitea Actions** | Yerleşik CI/CD Motoru | Depoya yapılan kod gönderimlerinde test, derleme ve Docker imajı oluşturma adımlarını otomatikleştiren iş akışı sistemi. |
| **Act Runner** | İş Akışı Yürütücüsü | Gitea Actions görevlerini izole Docker konteynerleri içinde çalıştıran yardımcı arka plan servisi (agent). |
| **Pull Request (PR)** | Birleştirme İsteği | Bir geliştirme dalındaki değişikliklerin ana dala (`main`) alınmadan önce incelendiği ve onaylandığı iş birliği mekanizması. |
| **Container Registry** | Konteyner İmaj Deposu | Gitea üzerinde oluşturulan Docker imajlarının etiketlenerek saklandığı ve sunuculara çekildiği dahili OCI uyumlu kayıt defteri. |
| **Webhook** | Olay Tetikleyicisi | Depoda bir `push` veya `release` gerçekleştiğinde dış servislere (örneğin bildirim veya dağıtım sunucularına) otomatik HTTP POST isteği gönderen mekanizma. |
| **Mirror Repository** | Yansı Depo | GitHub gibi dış kaynaklardaki bir deponun Gitea üzerinde otomatik olarak senkronize edilen canlı yedeği. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

### Yerel Depoyu Gitea Sunucusuna Bağlama
```bash
# Yerel Git deposuna Gitea sunucusunu yeni bir uzak hedef (remote) olarak ekler
git remote add gitea http://git.pr2cloud.duckdns.org/repo-adi.git

# Kodu Gitea üzerindeki ana dala gönderir
git push -u gitea main
```

### Gitea Container Registry Kullanımı
```bash
# Gitea yerleşik Docker kayıt defterine giriş yapar
docker login gitea.100-84-12-45.nip.io

# Yerelde derlenen Docker imajını Gitea kayıt defteri formatında etiketler
docker tag saas-docs:latest gitea.100-84-12-45.nip.io/kullanici/saas-docs:latest

# Etiketlenen imajı Gitea sunucusuna yükler
docker push gitea.100-84-12-45.nip.io/kullanici/saas-docs:latest
```

### Temel Yönetim Komutları (Konteyner İçi)
```bash
# Gitea sürümünü ve yapılandırma durumunu kontrol eder
docker exec -u git -it gitea gitea --version

# Gitea veritabanı ve depo sağlık kontrolü (doctor) çalıştırır
docker exec -u git -it gitea gitea doctor check
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [Gitea Docs](https://gitea.com)
* **Gitea Actions Rehberi:** [Gitea Actions Quickstart](https://gitea.comusage/actions/quickstart)
* **Container Registry Kılavuzu:** [Gitea Container Registry](https://gitea.comusage/packages/container)
