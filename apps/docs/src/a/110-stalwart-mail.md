---
title: "Kurumsal E-Posta Altyapısı (Stalwart & SnappyMail)"
description: "πr² Cloud altyapısı için DNS/DKIM kayıtları, Stalwart Mail Server v1.x, SnappyMail Webmail ve SILO S3 Blob Store entegrasyon rehberi."
outline: [2, 3]
sidebarTitle: "E-Posta (Stalwart & SnappyMail)"
index: 110
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "mail", "stalwart", "snappymail", "dkim", "spf", "dmarc", "s3"]
---

# Kurumsal E-Posta Altyapısı: `Stalwart Mail v1.x` ve `SnappyMail`

::: info Kurumsal E-Posta Mimarisi
**Stalwart Mail Server** (JMAP/IMAP/SMTP) ve **SnappyMail** (Webmail) konteyner tabanlı olarak izole biçimde çalışır. E-posta gövde ve ekleri sunucu diskini şişirmemek için iç ağ (`http://silo:9000`) üzerinden **PGSTY SILO** S3 kovasında saklanır; yönetim arayüzü ise yalnızca Tailscale VPN üzerinden erişime açılır.
:::

## 1. Dizin İzinleri ve Çift DKIM Anahtarı Üretimi

Stalwart konteyneri `UID 2000` (`GID 2000`) yetkisiyle çalışır ve TLS sertifikalarının özel anahtarını (`privkey.pem`) doğrudan okur. Veri dizinlerini hazırlayın ve hem modern **Ed25519** hem de geriye dönük uyumlu **RSA-2048** DKIM anahtar çiftlerini üretin:

<DynamicSnippet title="Mail Dizinleri ve DKIM Üretimi" >

```bash
# 1. Stalwart ve SnappyMail kalıcı veri dizinlerini oluştur
mkdir -p <-DATA_DIR->/stalwart/{etc,data,dkim}
mkdir -p <-DATA_DIR->/snappymail

# 2. Stalwart konteynerinin (UID 2000) TLS özel anahtarını okuyabilmesi için grup izni ver
sudo chown -R root:2000 <-DATA_DIR->/certs/live <-DATA_DIR->/certs/archive
sudo chmod -R 750 <-DATA_DIR->/certs/live <-DATA_DIR->/certs/archive

# 3. Çift DKIM imza anahtarlarını üret (Ed25519 + RSA-2048)
openssl genpkey -algorithm Ed25519 -out <-DATA_DIR->/stalwart/dkim/ed25519.key
openssl pkey -in <-DATA_DIR->/stalwart/dkim/ed25519.key -pubout -out <-DATA_DIR->/stalwart/dkim/ed25519.pub

openssl genrsa -out <-DATA_DIR->/stalwart/dkim/rsa.key 2048
openssl rsa -in <-DATA_DIR->/stalwart/dkim/rsa.key -pubout -out <-DATA_DIR->/stalwart/dkim/rsa.pub

sudo chown -R 2000:2000 <-DATA_DIR->/stalwart
chmod 600 <-DATA_DIR->/stalwart/dkim/*.key

# 4. DNS TXT kayıtlarına eklenecek açık anahtarları (tek satır base64) görüntüle
echo "--- v1-ed25519 PUBLIC KEY ---"
grep -v "PUBLIC KEY" <-DATA_DIR->/stalwart/dkim/ed25519.pub | tr -d '\n'; echo ""
echo "--- v1-rsa PUBLIC KEY ---"
grep -v "PUBLIC KEY" <-DATA_DIR->/stalwart/dkim/rsa.pub | tr -d '\n'; echo ""
```

</DynamicSnippet>

## 2. E-Posta DNS ve Ters DNS (PTR) Kayıtları

Canlı alan adınızın (`<-DOMAIN->`) DNS panelinde (Cloudflare **DNS Only / Gri Bulut**) aşağıdaki kayıtları tanımlayın:

| Tür | Ad (Name) | Değer / Hedef | Öncelik / Not |
| :--- | :--- | :--- | :--- |
| **`TXT`** | `v1-ed25519._domainkey` | `v=DKIM1; k=ed25519; p=<-ED25519_PUB_KEY->` | Ed25519 DKIM |
| **`TXT`** | `v1-rsa._domainkey` | `v=DKIM1; k=rsa; p=<-RSA_PUB_KEY->` | RSA-2048 DKIM |

```
v1-ed25519._domainkey
```

<DynamicSnippet title="v1-ed25519._domainkey">

```bind
v=DKIM1; k=ed25519; p=<-DKIM_ED25519_PUBLIC_KEY->
```
</DynamicSnippet>

```
v1-rsa._domainkey
```

<DynamicSnippet title="v1-rsa._domainkey">

```bind
v=DKIM1; k=rsa; p=<-DKIM_RSA_PUBLIC_KEY->
```
</DynamicSnippet>


::: tip PTR / rDNS
**Ters DNS (PTR / rDNS):** VPS sağlayıcınızın müşteri panelinden `<-VPS_PUBLIC_IP->` adresinin **PTR (Reverse DNS)** kaydını `mail.<-DOMAIN->` olarak tanımlayın veya destek biriminden talep edin. 
:::


## 3. Docker Compose Yapılandırması (`<-SOURCE_DIR->/infra/compose.mail.yml`)

::: warning Stalwart v1.x Kurulum Sihirbazı (Bootstrap Mode)
* Stalwart ilk kez başlatıldığında güvenlik gereği ters vekil (`https://mail.<-DOMAIN->/admin`) üzerinden kurulum sihirbazına izin vermez; ilk kurulum yalnızca Tailscale IP üzerinden düz **HTTP (`http://<-TAILSCALE_100_IP->:8080/admin`)** ile tamamlanır.
* Sihirbaz tamamlandıktan sonra `https://mail.<-DOMAIN->/admin` girişi aktif hale gelir ve geçici `8080` port satırını kaldırabilirsiniz.
:::

<DynamicSnippet title="Mail Compose Parametreleri" >

```bash
cat << 'EOF' > <-SOURCE_DIR->/infra/compose.mail.yml
name: pr2_mail
services:
  stalwart:
    image: stalwartlabs/stalwart:latest
    container_name: pr2-stalwart
    mem_limit: 384m
    restart: unless-stopped
    env_file:
      - ./.env
    hostname: mail.${DOMAIN}
    environment:
      STALWART_PUBLIC_URL: "https://mail.${DOMAIN}"
      # Parola kurtarma gerekirse yorumu açıp konteyneri yeniden başlatın:
      # STALWART_RECOVERY_ADMIN: "kurtarma:GeciciSifre2026!"
    ports:
      - "25:25"
      - "465:465"
      - "587:587"
      - "993:993"
      - "<-TAILSCALE_100_IP->:8080:8080"
    volumes:
      - ${DATA_DIR}/stalwart/etc:/etc/stalwart:z
      - ${DATA_DIR}/stalwart/data:/var/lib/stalwart:z
      - ${DATA_DIR}/stalwart/dkim:/opt/dkim:ro,z
      - ${DATA_DIR}/certs:/opt/certs:ro,z
    networks:
      - pr2_edge_net
      - pr2_internal_net

  snappymail:
    image: djmaze/snappymail:latest
    container_name: pr2-snappymail
    mem_limit: 192m
    restart: unless-stopped
    volumes:
      - ${DATA_DIR}/snappymail:/var/lib/snappymail:z
    networks:
      - pr2_edge_net
      - pr2_internal_net
    depends_on:
      - stalwart

networks:
  pr2_edge_net:
    external: true
  pr2_internal_net:
    external: true
EOF
```

</DynamicSnippet>

Servisleri başlatın ve geçici yönetici parolasını loglardan alın:

```bash
docker compose -f compose.mail.yml up -d
docker logs pr2-stalwart 2>&1 | grep -A4 "temporary administrator"
```


## 4. Nginx Ters Proxy Şablonu (`<-SOURCE_DIR->/infra/nginx/templates/mail.conf.template`)

Stalwart yönetim panelini (`mail.${DOMAIN}`) yalnızca Tailscale VPN ağına, Webmail arayüzünü (`webmail.${DOMAIN}`) ise genel HTTPS erişimine açın:

```nginx

# 1. Stalwart Yönetim Paneli (mail.${DOMAIN} - Yalnızca Tailscale VPN)
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name mail.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    allow 100.64.0.0/10;
    deny all;

    location / {
        set $upstream http://pr2-stalwart:8080;
        proxy_pass $upstream;
        include /etc/nginx/snippets/proxy-headers.conf;
    }
}

# 2. SnappyMail Webmail Arayüzü (webmail.${DOMAIN})
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name webmail.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/nginx/snippets/tls-base.conf;

    client_max_body_size 50M;

    location / {
        set $upstream http://pr2-snappymail:8888;
        proxy_pass $upstream;
        include /etc/nginx/snippets/proxy-headers.conf;
    }
}

```

Nginx konteynerini yeniden başlatın:

```bash
docker restart pr2-gateway
```



## 5. Stalwart Sihirbazı, TLS, DKIM ve Posta Kutusu Yapılandırması

1. **Kurulum Sihirbazını Tamamlama:**
   * Tarayıcıdan **`http://<-TAILSCALE_100_IP->:8080/admin`** adresini açın; `admin` ve logdan aldığınız geçici parolayla giriş yapıp sihirbazı tamamlayın (**Hostname:** `mail.<-DOMAIN->`, **Log Output:** `Console`).
   * Ardından konteyneri yeniden başlatın: 
   
   ```bash
   docker restart pr2-stalwart
   ``` 
   
   Artık **`https://mail.<-DOMAIN->/admin`** adresinden giriş yapabilirsiniz.
2. **TLS Sertifikalarını Tanımlama:**
   * **Settings › Server › TLS › Certificates › Create Certificate** yolundan:
     * **Name:** `default` | **Default:** Aktif
     * **Certificate:** `/opt/certs/live/<-DOMAIN->/fullchain.pem`
     * **Private Key:** `/opt/certs/live/<-DOMAIN->/privkey.pem`
   * Kaydedip konteyneri yeniden başlatın ve IMAPS (`993`) sertifikasını doğrulayın:

   <DynamicSnippet title="TLS Test" >

     ```bash
     docker restart pr2-stalwart && sleep 2  
     openssl s_client -connect mail.<-DOMAIN->:993 -servername mail.<-DOMAIN-> </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates
     ```
   </DynamicSnippet>

3. **Alan Adı, DKIM ve Kullanıcı Hesabı:**
    - **Management › Directory › Domains** altından `<-DOMAIN->` alan adını ekleyin.
    - **Management › Domains › DKIM Signatures** altından iki anahtarı bağlayın:
       - Selector `v1-ed25519` → Private Key `/opt/dkim/ed25519.key`
       - Selector `v1-rsa` → Private Key `/opt/dkim/rsa.key`
    - **Management › Directory › Accounts** altından günlük kullanacağınız gerçek posta kutusunu oluşturun (ör. `admin@<-DOMAIN->` veya `iletisim@<-DOMAIN->`).


## 6. SnappyMail Webmail Yapılandırması

1. **Admin Parolasını Görüntüleme:**

   <DynamicSnippet title="SnappyMail Admin Parolası" >

   ```bash
   cat <-DATA_DIR->/snappymail/_data_/_default_/admin_password.txt
   ```
   </DynamicSnippet>

2. **Alan Adı Tanımlama (`https://webmail.<-DOMAIN->/?admin`):**
   - **Domains › Add Domain** menüsünden `<-DOMAIN->` alan adını ekleyin:
     - **IMAP:** Server `pr2-stalwart` | Port `993` | Encryption `SSL/TLS` *(sertifika doğrulama istisnasını işaretleyin; **Short Login** kapalı)*
     - **SMTP:** Server `pr2-stalwart` | Port `465` (`SSL/TLS`) | **Use authentication** işaretli
   - **Test** butonlarıyla yeşil onay aldıktan sonra kaydedin ve varsayılan `localhost` kaydını silin.

---

## 7. E-Posta Gövde ve Eklerini PGSTY SILO S3 Kovasına Taşıma

Sunucu diskinin e-posta ekleriyle dolmasını önlemek için Stalwart depolamasını iç ağ üzerinden (http://silo:9000) SILO'ya bağlayın:
1. SILO Kova ve En Az Yetki (IAM) Politikası:
	- Tailscale VPN açıkken https://s3-console.<-DOMAIN-> adresinde stalwart-blobs adında özel (private) bir kova oluşturun.
	- Identity › Policies › Create Policy üzerinden stalwart-blob-policy politikasını tanımlayın:

```json
  {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::stalwart-blobs"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::stalwart-blobs/*"]
    }
  ]
}
```
  
  - Identity › Users › Create User ile stalwart-svc kullanıcısını oluşturup bu politikayı atayın ve Access Key ID + Secret Key üretin.

2. Stalwart Blob Store Ayarı (`https://mail.<-DOMAIN->/admin`):
	- Settings › Storage › Blob Store menüsünden:
		- Type: S3 - compatible | Bucket: stalwart-blobs
		- Region: Açılır listeden mutlaka Custom seçin → `URL: http://silo:9000` | `Region: us-east-1`
		- Access Key ID / Secret Access Key: stalwart-svc anahtarları | Timeout: 30s 
	- Kaydedip konteyneri yeniden başlatın: docker restart pr2-stalwart.


## Doğrulama Kontrolleri

  1. Webmail Girişi: `https://webmail.<-DOMAIN->` üzerinden oluşturduğunuz posta kutusuyla oturum açabildiğinizi doğrulayın.
  2. Dış Teslimat & Kimlik Doğrulama: Harici bir Gmail veya Outlook adresine test e-postası gönderin; ileti kaynağında SPF: PASS, DKIM: PASS ve DMARC: PASS sonuçlarını teyit edin.
  3. S3 Blob Yazma Doğrulaması: docker logs --tail 25 pr2-stalwart çıktısında hata olmadığını ve yeni iletilerin stalwart-blobs kovasına yazıldığını kontrol edin.

