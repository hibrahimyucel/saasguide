---
title: "Kurumsal E-Posta Altyapısı: Stalwart Mail v1.x ve SnappyMail"
description: "pr2cloud canlı sunucu (prod) için Stalwart Mail v1.x kurulum sihirbazı, yorum satırlı kurtarma/bootstrap parametreleri, TLS, önceden üretilmiş DKIM anahtarları ve SnappyMail Webmail yapılandırması."
outline: [2, 3]
sidebarTitle: "E-Posta (Stalwart & SnappyMail)"
index: 306
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "prod", "stalwart", "snappymail", "email", "dkim", "tls", "webmail"]
---

# Kurumsal E-Posta Altyapısı: `Stalwart Mail v1.x` ve `SnappyMail`

> **Ön Bilgi:** Bu rehber; çekirdek PaaS servisleri ayağa kaldırıldıktan ve ilk adımda `openssl` ile çift DKIM anahtarları üretilip Cloudflare DNS'e aktarıldıktan sonra kurumsal e-posta sunucusu ve webmail istemcisinin devreye alınması adımlarını içerir.

---

## Adım 1: `docker-compose.yml` İçine Stalwart ve SnappyMail Servislerini Ekleme

Mevcut `/opt/pr2cloud/prod/docker-compose.yml` dosyasının `services:` bloğu altına `stalwart` ve `snappymail` servislerini ekleyin.

::: warning Stalwart v1.x Kurulum Sihirbazı (Bootstrap) ve Kurtarma Parametreleri
* Stalwart v1.x ilk kez sıfırdan başlatıldığında ("bootstrap mode") güvenlik gereği ters vekil (`https://`) üzerinden girişi engeller; kurulum sihirbazı yalnızca düz **HTTP (`http://<-TAILSCALE_100_IP->:8080/admin`)** üzerinden tamamlanır.
* Sihirbaz tamamlandıktan sonra `STALWART_PUBLIC_URL` değişkeni sayesinde `https://mail.<-DOMAIN->/admin` girişi aktif hale gelir ve geçici `8080` port satırı yorum satırına alınabilir.
* Olası yönetici parolası kayıplarında `STALWART_RECOVERY_ADMIN` satırının yorumunu açıp konteyneri yeniden başlatarak kurtarma girişi yapabilirsiniz.
:::

<DynamicSnippet title="Stalwart & SnappyMail Compose Blokları">

```yaml
  stalwart:
    image: stalwartlabs/stalwart:latest
    container_name: pr2_stalwart
    mem_limit: 384m
    restart: unless-stopped
    hostname: mail.<-DOMAIN->
    environment:
      STALWART_PUBLIC_URL: "https://mail.<-DOMAIN->"
      # STALWART_RECOVERY_ADMIN: "kurtarma:GeciciSifre2026!"
    ports:
      - "25:25"
      - "465:465"
      - "587:587"
      - "993:993"
      - "<-TAILSCALE_100_IP->:8080:8080" # Kurulum sihirbazı bittikten sonra bu satırı yorum satırına alabilirsiniz
    volumes:
      - ../data/stalwart/etc:/etc/stalwart
      - ../data/stalwart/data:/var/lib/stalwart
      - ../data/stalwart/dkim:/opt/dkim:ro
      - ../data/certs:/opt/certs:ro
    networks:
      - pr2_edge_net
      - pr2_internal_net

  snappymail:
    image: djmaze/snappymail:latest
    container_name: pr2_snappymail
    mem_limit: 192m
    restart: unless-stopped
    volumes:
      - ../data/snappymail:/var/lib/snappymail
    networks:
      - pr2_edge_net
      - pr2_internal_net
    depends_on:
      - stalwart
```

</DynamicSnippet>

Servisleri başlatın ve geçici bootstrap yönetici parolasını alın:

```bash
cd /opt/pr2cloud/prod
docker compose up -d
docker logs pr2_stalwart 2>&1 | grep -A4 "temporary administrator"
```

---

## Adım 2: Stalwart Kurulum Sihirbazı, TLS, DKIM ve Posta Kutusu Oluşturma

1. **Kurulum Sihirbazını Tamamlama:**
   * Tarayıcıda **`http://<-TAILSCALE_100_IP->:8080/admin`** (`http://` olmalı) adresini açın.
   * `admin` kullanıcı adı ve logdan aldığınız geçici parolayla giriş yapıp 5 adımlı sihirbazı tamamlayın (**Hostname:** `mail.<-DOMAIN->`, **Log Output:** `Console`).
   * Sihirbaz bitince konteyneri yeniden başlatın: `docker compose restart stalwart`
   * Artık **`https://mail.<-DOMAIN->/admin`** adresinden normal yönetici girişi yapabilirsiniz.
2. **TLS Sertifikalarını Tanımlama ve Doğrulama:**
   * Stalwart konteyneri `2000:2000` kullanıcı kimliğiyle (UID/GID) çalıştığı için özel anahtar (`privkey.pem`) dosyasını okuyabilmesi adına grup izninin `pr2admin:2000` (`640`) olduğundan emin olun:
     ```bash
     sudo chown pr2admin:2000 /opt/pr2cloud/data/certs/privkey.pem
     sudo chmod 640 /opt/pr2cloud/data/certs/privkey.pem
     ```
   * Stalwart yönetim panelinde (`https://mail.<-DOMAIN->/admin`) **Settings › Server › TLS › Certificates** menüsüne girip **Create Certificate** butonuna tıklayın ve dosya yollarını tanımlayın:
     * **Name:** `default`
     * **Certificate:** `/opt/certs/fullchain.pem`
     * **Private Key:** `/opt/certs/privkey.pem`
     * **Default:** Aktif (işaretli) yapıp kaydedin.
   * Değişikliğin aktifleşmesi için konteyneri yeniden başlatın ve IMAPS (`993`) portundan artık geçerli Let's Encrypt sertifikasının sunulduğunu `openssl` ile doğrulayın:

<DynamicSnippet title="Stalwart TLS Doğrulama Parametresi">

```bash
docker restart pr2_stalwart && sleep 2
openssl s_client -connect mail.<-DOMAIN->:993 -servername mail.<-DOMAIN-> </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

</DynamicSnippet>

3. **Alan Adı ve Önceden Üretilmiş Çift DKIM Anahtarlarını Bağlama:**
   * **Management › Directory › Domains** altından `<-DOMAIN->` alan adını oluşturun.
   * **Management › Domains › DKIM Signatures** altından 1. dokümanda ürettiğiniz iki anahtarı (veya özel anahtar içeriklerini `/opt/pr2cloud/data/stalwart/dkim/` altından kopyalayarak) tanımlayın:
     * **RSA-2048:** Selector `v1-rsa` | Private Key `/opt/dkim/rsa.key`
     * **Ed25519:** Selector `v1-ed25519` | Private Key `/opt/dkim/ed25519.key`
4. **Gerçek Posta Kutusu (Account) ve Takma Ad (Alias) Oluşturma:**
   * Varsayılan `admin` hesabı yönetim hesabıdır; e-posta gönderip almak için **Management › Directory › Accounts** altından gerçek bir kullanıcı hesabı oluşturun (örneğin `iyucel` / `iyucel@<-DOMAIN->`) ve isterseniz aynı hesaba `info@<-DOMAIN->`, `destek@<-DOMAIN->` gibi **Email Alias** adresleri tanımlayın.

---

## Adım 3: SnappyMail Webmail Yapılandırması

1. **İlk Admin Parolasını Alma:**
   ```bash
   cat /opt/pr2cloud/data/snappymail/_data_/_default_/admin_password.txt
   ```
2. **Admin Paneline Giriş:** `https://webmail.<-DOMAIN->/?admin` adresini açıp `admin` ve okuduğunuz parolayla giriş yapın.
3. **Alan Adı Tanımlama (`Domains › Add Domain`):**
   * **Name:** `<-DOMAIN->`
   * **IMAP:** Server `pr2_stalwart` | Port `993` | Encryption `SSL/TLS` *(iç ağ sertifika adı uyarısı vermemesi için sertifika doğrulama istisnasını işaretleyin; **Short Login** kapalı kalsın)*
   * **SMTP:** Server `pr2_stalwart` | Port `587` (STARTTLS) veya `25` (None) | **Use authentication** işaretli
   * **Test** butonuyla hem IMAP hem SMTP için yeşil onay aldıktan sonra kaydedin; varsayılan `localhost` kaydını listeden silin.

---

## Doğrulama Kontrolleri

1. **Webmail Oturumu:** `https://webmail.<-DOMAIN->` adresinden oluşturduğunuz gerçek kullanıcı hesabıyla (`iyucel@<-DOMAIN->`) giriş yapıp posta kutusunun açıldığını doğrulayın.
2. **Dış Teslimat & İmza Kontrolü:** Harici bir Gmail veya Outlook adresine test e-postası gönderin; alıcı tarafta ileti kaynağında (`Orijinalini göster`) **`SPF: PASS`**, **`DKIM: PASS`** ve **`DMARC: PASS`** onaylarını teyit edin.
