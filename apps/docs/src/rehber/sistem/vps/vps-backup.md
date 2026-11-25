---
title: "Host (Geliştirici Makinesi) Kurulumu"
description: "SaaS Rehberi"
outline: [2, 3]
sidebarTitle: "VPS Yedekleme"
index: 90
isContent: true
hidden: false
status: "published"
tags: ["Paas","Saas"]
---


# Otomatik Yedekleme

> **Ön Bilgi:** Bu rehber; e-posta gövde ve dosya eklerinin RocksDB yerine doğrudan **MinIO (SILO)** S3 nesne depolamasına yazılarak sunucu RAM/disk tüketiminin optimize edilmesini ve tüm sistemin her gece otomatik yedeklenmesini sağlar.

## Adım 2: Sunucu Dışı (Off-Site) Depolama İçin `rclone` ve Google Drive Kurulumu

### 2.1. Google Cloud Console Üzerinden Özel `client_id` Oluşturma

Rclone'un ortak `client_id` kimliği kullanımdan kaldırıldığı için kesintisiz yedekleme adına kendi ücretsiz OAuth kimliğinizi oluşturun:

1. [Google Cloud Console](https://google.com) üzerinde yeni bir proje oluşturun ve **APIs & Services › Library** menüsünden **Google Drive API** servisini etkinleştirin.
2. **APIs & Services › OAuth consent screen** adımında **External** seçip uygulama adı (`pr2cloud-backup`) ve iletişim e-postasını girerek kaydedin.
3. **Data Access (Scopes)** bölümünden `https://googleapis.com` yetkisini ekleyin.
4. **Audience** sekmesinde **Publish App** butonuna basarak uygulamayı canlıya alın *(Testing modunda bırakılırsa yetkilendirme 7 günde bir düşer)*.
5. **Credentials › Create Credentials › OAuth client ID** yolundan uygulama türünü **Desktop app** seçin ve üretilen **`Client ID`** ile **`Client Secret`** değerlerini kopyalayın.

---

### 2.2. `rclone` Kurulumu ve Yapılandırma (`gdrive`)

1. **`rclone` Paketini Kurma (AlmaLinux 9):**

```bash
sudo dnf install -y rclone
```

2. **`root` Kullanıcısı Altında Uzak Depo (`gdrive`) Tanımlama:**

```bash
sudo rclone config
```

   * İnteraktif sihirbazda sırasıyla şu seçimleri yapın:
     * `n` *(New remote)* -> Name: **`gdrive`**
     * Storage: **`drive`** *(Google Drive)*
     * `client_id` ve `client_secret`: Az önce Google Cloud Console'dan aldığınız değerleri girin
     * Scope: **`1`** *(Full access all files)*
     * `service_account_file` ve `Edit advanced config`: Boş / `n`
     * **Use web browser to automatically authenticate rclone?:** Sunucuda tarayıcı olmadığı için **`n`** seçin; ekrana çıkan `rclone authorize "drive" "..."` komutunu kendi bilgisayarınızda çalıştırıp tarayıcıdan onaylayın ve üretilen token çıktısını sunucuya yapıştırın
     * `Configure this as a Shared Drive?`: **`n`** -> `y` *(Yes this is OK)* -> `q` *(Quit config)*

3. **Hedef Klasör ve Bağlantı Testi:**

```bash
sudo rclone mkdir gdrive:pr2cloud-backups
sudo rclone lsd gdrive:
```

---

## Adım 3: Sıfır Veri Kayıplı Günlük Yedekleme Betiği (`backup-pr2cloud.sh`)

```bash
sudo mkdir -p /opt/pr2cloud/prod/scripts /opt/pr2cloud/backups

sudo tee /opt/pr2cloud/prod/scripts/backup-pr2cloud.sh > /dev/null << 'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/pr2cloud/backups"
REMOTE_DEST="gdrive:pr2cloud-backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="${BACKUP_DIR}/${TIMESTAMP}"

mkdir -p "${TARGET_DIR}"

# 1. MariaDB tutarli SQL dokumu
set -a
source /opt/pr2cloud/prod/.env
set +a

docker exec pr2_mariadb mariadb-dump \
  -u root \
  -p"${MYSQL_ROOT_PASSWORD}" \
  --single-transaction \
  --quick \
  --all-databases > "${TARGET_DIR}/mariadb_all.sql"

# 2. Dex SQLite veritabaninin tutarli kopyasi
if [ -f /opt/pr2cloud/data/dex/dex.db ]; then
  cp /opt/pr2cloud/data/dex/dex.db "${TARGET_DIR}/dex.db"
fi

# 3. Yapilandirma ve kalici verilerin arsivlenmesi
tar -czf "${TARGET_DIR}/pr2cloud_prod_and_data.tar.gz" \
  -C /opt/pr2cloud \
  prod \
  data/minio \
  data/stalwart \
  data/snappymail \
  data/certs

# 4. Yerel 7 gunden eski yedekleri temizle
find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} +

# 5. Google Drive (Off-Site) aktarimi ve bulut temizligi
if command -v rclone >/dev/null 2>&1 && rclone listremotes | grep -q "^gdrive:"; then
  rclone copy "${TARGET_DIR}" "${REMOTE_DEST}/${TIMESTAMP}" --transfers 4 --checkers 8
  rclone delete "${REMOTE_DEST}" --min-age ${RETENTION_DAYS}d
  rclone rmdirs "${REMOTE_DEST}" --leave-root
  echo "[$(date -Iseconds)] Google Drive yedeklemesi tamamlandi: ${REMOTE_DEST}/${TIMESTAMP}"
else
  echo "[$(date -Iseconds)] UYARI: rclone 'gdrive' tanimli degil, yalnizca yerel yedek alindi."
fi

echo "[$(date -Iseconds)] Yerel yedekleme basariyla tamamlandi: ${TARGET_DIR}"
EOF

sudo chmod 750 /opt/pr2cloud/prod/scripts/backup-pr2cloud.sh
```

---

## Adım 4: `root` Cron Görevi ile Gece Otomasyonu

`2000:2000` (`Stalwart`), `999:999` (`MariaDB`) ve `600` (`privkey.pem`) izinli dosyaların yedekleme sırasında izin hatasına takılmaması ve `/root/.config/rclone/rclone.conf` yapılandırmasına erişebilmesi için zamanlanmış görevi **`sudo crontab`** (`root`) altında tanımlayın:

```bash
(sudo crontab -l 2>/dev/null | grep -v "backup-pr2cloud.sh"; echo "30 3 * * * /opt/pr2cloud/prod/scripts/backup-pr2cloud.sh >> /var/log/pr2cloud-backup.log 2>&1") | sudo crontab -
```

---

## Doğrulama Kontrolleri

1. **S3 Blob Doğrulaması:** Webmail üzerinden bir test e-postası gönderdikten sonra MinIO konsolunda (`https://s3-console.<-DOMAIN->`) `stalwart-blobs` kovası içine nesnelerin yazıldığını ve `docker logs --tail 20 pr2_stalwart` çıktısında `Message appended via IMAP ... blobId = "..."` satırının göründüğünü doğrulayın.
2. **Manuel Yerel + Google Drive Yedekleme Testi:**

```bash
sudo /opt/pr2cloud/prod/scripts/backup-pr2cloud.sh
sudo ls -lh /opt/pr2cloud/backups/*/
sudo rclone ls gdrive:pr2cloud-backups
sudo crontab -l
```

Çıktıda hem yerel dizinde hem de `gdrive:pr2cloud-backups` altında `mariadb_all.sql`, `dex.db` ve `pr2cloud_prod_and_data.tar.gz` dosyalarının hatasız oluştuğunu ve `sudo crontab -l` çıktısında her gece `03:30` görevinin listelendiğini onaylayın.
