---
title: "MinIO S3 Blob Entegrasyonu ve Otomatik Yedekleme"
description: "pr2cloud canlı sunucu (prod) için Stalwart e-posta gövde/eklerinin MinIO (SILO) S3 kovasına taşınması ve root cron ile günlük otomatik yedekleme otomasyonu."
outline: [2, 3]
sidebarTitle: "S3 Blob & Stalwart"
index: 307
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "prod", "minio", "s3", "stalwart", "backup", "cron", "almalinux"]
---
## Adım 1: Stalwart E-Posta Gövde ve Eklerini MinIO (SILO) S3 Kovasına Taşıma

### 1.1. Docker İç Ağ Takma Adı (`aliases`) Tanımlama

MinIO/SILO, gelen HTTP `Host` başlığının geçerli bir DNS adı olmasını zorunlu kılar ve içinde alt çizgi (`_`) bulunan konteyner isimlerini (`pr2_minio`) `400 InvalidRequest (invalid hostname)` hatasıyla reddeder. Bunu önlemek için `/opt/pr2cloud/prod/docker-compose.yml` dosyasındaki `minio` servisine alt çizgisiz bir iç ağ takma adı (`aliases`) eklenmiştir.

```yaml
  minio:
    image: pgsty/silo:latest
    container_name: pr2_minio
    restart: unless-stopped
    env_file: .env
    command: server /data --console-address ":9001"
    volumes:
      - ../data/minio:/data
    networks:
      pr2_edge_net:
      pr2_internal_net:
        aliases:
          - minio
```

### 1.2. MinIO (SILO) Kova ve En Az Yetki (IAM) Politikası Oluşturma

Root anahtarı yerine yalnızca e-posta kovasına erişebilen kısıtlı bir servis hesabı oluşturun:

1. **Kova (Bucket) Oluşturma:**
   * Tailscale VPN açıkken `https://s3-console.<-DOMAIN->` adresine giriş yapın.
   * **Buckets › Create Bucket** adımından **`stalwart-blobs`** adında yeni bir kova oluşturun *(Versioning ve Object Lock kapalı, erişim politikası `private` kalmalıdır)*.

2. **Özel Erişim Politikası (IAM Policy) Tanımlama:**
   * **Identity › Policies › Create Policy** menüsünden **`stalwart-blob-policy`** adıyla aşağıdaki JSON politikasını kaydedin:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::stalwart-blobs"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::stalwart-blobs/*"
      ]
    }
  ]
}
```

3. **Servis Kullanıcısı ve Anahtar Üretimi:**
   * **Identity › Users › Create User** üzerinden **`stalwart-svc`** kullanıcısını oluşturun ve **`stalwart-blob-policy`** politikasını atayın.
   * Kullanıcı detayındaki **Service Accounts / Access Keys › Create Access Key** butonundan **`Access Key ID`** ve **`Secret Key`** bilgilerini kopyalayın.

---

### 1.3. Stalwart Yönetim Panelinden S3 Blob Store Tanımlama

   * `https://mail.<-DOMAIN->` yönetim panelinde **Settings › Storage › Blob Store** yolunu izleyin ve aşağıdaki parametreleri girin:
     
     * **Type:** `S3 - compatible`
     * **Bucket:** `stalwart-blobs`
     * **Region:** Açılır listeden mutlaka **`Custom`** seçin *(AWS bölgesi seçilirse virtual-hosted style istek atar ve iç ağda DNS hatası verir)*:
       * **URL:** `http://minio:9000`
       * **Region:** `us-east-1`
     * **Access Key ID:** `stalwart-svc` için üretilen Access Key
     * **Secret Access Key:** `stalwart-svc` için üretilen Secret Key
     * **Session Token / Profile:** Boş bırakın
     * **Timeout:** `30s`

   * Yapılandırmanın aktif olması için Stalwart konteynerini yeniden başlatın:

```bash
docker restart pr2_stalwart
```

3. **Canlı Log ve Teslimat Doğrulaması:**
   * Webmail (`https://webmail.<-DOMAIN->`) üzerinden bir test e-postası gönderin ve konteyner loglarında `Message appended via IMAP ... blobId = "..."` satırının hatasız düştüğünü doğrulayın:

```bash
docker logs --tail 25 pr2_stalwart
```
