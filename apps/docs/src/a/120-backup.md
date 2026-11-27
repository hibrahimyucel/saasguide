---
title: "Otomatik Yedekleme ve Sunucu Dışı Arşivleme"
description: "πr² Cloud altyapısı için MariaDB, Dex SQLite, kalıcı servis verileri ve yapılandırma dosyalarının rclone ile Google Drive üzerine otomatik gece yedeklemesi."
outline:
sidebarTitle: "Otomatik Yedekleme"
index: 120
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "backup", "rclone", "google-drive", "cron", "disaster-recovery"]
---

# Otomatik Yedekleme ve Sunucu Dışı Arşivleme

::: info Sıfır Veri Kayıplı Yedekleme Mimarisi
Bu rehber; ilişkisel veritabanlarının (`MariaDB`), kimlik veritabanının (`Dex SQLite`), kalıcı servis verilerinin (`Gitea`, `SILO`, `Stalwart`, `SnappyMail`, `Certs`) ve altyapı yapılandırmalarının (`infra/`) her gece otomatik olarak yerel diske ve **Google Drive** üzerine şifreli/izole biçimde yedeklenmesini sağlar.
:::

## 1. Sunucu Dışı (Off-Site) Depolama İçin `rclone` ve Google Drive Kurulumu

### 1.1. Google Cloud Console Üzerinden Özel `client_id` Oluşturma

Rclone'un ortak kimliği kullanımdan kaldırıldığı için kesintisiz yedekleme adına kendi ücretsiz OAuth kimliğinizi oluşturun:

1. [Google Cloud Console](https://google.com) üzerinde yeni bir proje oluşturun ve **APIs & Services › Library** menüsünden **Google Drive API** servisini etkinleştirin.
2. **APIs & Services › OAuth consent screen** adımında **External** seçip uygulama adı (`pr2cloud-backup`) ve iletişim e-postasını girerek kaydedin.
3. **Data Access (Scopes)** bölümünden `https://googleapis.com` yetkisini ekleyin.
4. **Audience** sekmesinde **Publish App** butonuna basarak uygulamayı canlıya alın *(Testing modunda bırakılırsa yetkilendirme 7 günde bir düşer)*.
5. **Credentials › Create Credentials › OAuth client ID** yolundan uygulama türünü **Desktop app** seçin ve üretilen **`Client ID`** ile **`Client Secret`** değerlerini kopyalayın.

---

### 1.2. `rclone` Kurulumu ve Yapılandırma (`gdrive`)

1. **`rclone` Paketini Kurma (AlmaLinux 9):**
   ```bash
   sudo dnf install -y rclone
   ```

2. **`root` Kullanıcısı Altında Uzak Depo (`gdrive`) Tanımlama:**
   ```bash
   sudo rclone config
   ```
   * İnteraktif sihirbazda sırasıyla şu seçimleri yapın:
     * `n` *(New remote)* → Name: **`gdrive`**
     * Storage: **`drive`** *(Google Drive)*
     * `client_id` ve `client_secret`: Google Cloud Console'dan aldığınız değerleri girin
     * Scope: **`1`** *(Full access all files)*
     * `service_account_file` ve `Edit advanced config`: Boş / `n`
     * **Use web browser to automatically authenticate rclone?:** Sunucuda tarayıcı olmadığı için **`n`** seçin; ekrana çıkan `rclone authorize "drive" "..."` komutunu kendi bilgisayarınızda çalıştırıp tarayıcıdan onaylayın ve üretilen token çıktısını sunucuya yapıştırın
     * `Configure this as a Shared Drive?`: **`n`** → `y` *(Yes this is OK)* → `q` *(Quit config)*

3. **Hedef Klasör ve Bağlantı Testi:**
   ```bash
   sudo rclone mkdir gdrive:pr2cloud-backups
   sudo rclone lsd gdrive:
   ```

---

## 2. Günlük Yedekleme Betiği (`backup-pr2cloud.sh`)

Aşağıdaki betik; veritabanı tutarlılığını bozmadan (`--single-transaction`) SQL dökümü alır, tüm altyapı ve kalıcı veri dizinlerini arşivler ve 7 günden eski yedekleri hem yerelden hem Google Drive'dan otomatik temizler:

<DynamicSnippet title="Yedekleme Betiği Parametreleri" >

```bash
mkdir -p <-SOURCE_DIR->/infra/scripts <-DATA_DIR->/backups

cat << 'EOF' > <-SOURCE_DIR->/infra/scripts/backup-pr2cloud.sh
#!/bin/bash
set -euo pipefail

SOURCE_DIR="<-SOURCE_DIR->"
DATA_DIR="<-DATA_DIR->"
BACKUP_DIR="${DATA_DIR}/backups"
REMOTE_DEST="gdrive:pr2cloud-backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="${BACKUP_DIR}/${TIMESTAMP}"

mkdir -p "${TARGET_DIR}"

# 1. Merkezi .env degiskenlerini yukle
set -a
source "${SOURCE_DIR}/infra/.env"
set +a

# 2. MariaDB tutarli SQL dokumu
docker exec pr2-mariadb mariadb-dump \
  -u root \
  -p"${MYSQL_ROOT_PASSWORD}" \
  --single-transaction \
  --quick \
  --all-databases > "${TARGET_DIR}/mariadb_all.sql"

# 3. Dex SQLite veritabaninin kopyasi
if [ -f "${DATA_DIR}/dex/dex.db" ]; then
  cp "${DATA_DIR}/dex/dex.db" "${TARGET_DIR}/dex.db"
fi

# 4. Altyapi yapilandirmalari (.env dahil) ve kalici servis verilerinin arsivlenmesi
tar -czf "${TARGET_DIR}/pr2cloud_infra_and_data.tar.gz" \
  -C "${SOURCE_DIR}" infra \
  -C "${DATA_DIR}" certs wwwroot gitea silo stalwart snappymail

# 5. Yerel 7 gunden eski yedekleri temizle
find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} +

# 6. Google Drive (Off-Site) aktarimi ve bulut temizligi
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

sudo chmod 750 <-SOURCE_DIR->/infra/scripts/backup-pr2cloud.sh

```

</DynamicSnippet>

---

## 3. `root` Cron Görevi ile Gece Otomasyonu

`2000:2000` (`Stalwart`), `1000:1000` (`Gitea`), `999:999` (`MariaDB`) ve `600` (`privkey.pem`, `.env`) izinli dosyaların yedekleme sırasında izin hatasına takılmaması ve `/root/.config/rclone/rclone.conf` yapılandırmasına erişebilmesi için zamanlanmış görevi **`sudo crontab`** (`root`) altında tanımlayın:

<DynamicSnippet title="Yedekleme Cron Görevi" >

```bash
(sudo crontab -l 2>/dev/null | grep -v "backup-pr2cloud.sh"; echo "30 3 * * * <-SOURCE_DIR->/infra/scripts/backup-pr2cloud.sh >> /var/log/pr2cloud-backup.log 2>&1") | sudo crontab -
sudo crontab -l
```

</DynamicSnippet>

---

## 4. Doğrulama Kontrolleri

Manuel test çalıştırması yaparak hem yerel arşivlerin hem de Google Drive yüklemesinin hatasız gerçekleştiğini doğrulayın:

<DynamicSnippet title="Yedekleme Testi" >

```bash
sudo <-SOURCE_DIR->/infra/scripts/backup-pr2cloud.sh
sudo ls -lh <-DATA_DIR->/backups/*/
sudo rclone ls gdrive:pr2cloud-backups
```

</DynamicSnippet>

Çıktıda hem yerel dizinde hem de `gdrive:pr2cloud-backups` altında `mariadb_all.sql`, `dex.db` ve `pr2cloud_infra_and_data.tar.gz` dosyalarının oluştuğunu onaylayın.
