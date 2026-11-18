# AlmaLinux MariaDB Tam Kurulum ve Yonetim Kilavuzu

Bu kilavuz, AlmaLinux uzerinde MariaDB veritabaninin kurulumu, uzak erisim ayarlari ve otomatik yedekleme sureclerini icermektedir.

## 1. Kurulum ve Ilk Yapilandirma
```bash
sudo dnf update -y
sudo dnf install mariadb-server mariadb -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo mariadb-secure-installation
```

## 2. Kullanici ve Uzak Erisim Ayarlari
```sql
CREATE DATABASE my_database;
CREATE USER 'my_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON my_database.* TO 'my_user'@'localhost';
CREATE USER 'my_user'@'%' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON my_database.* TO 'my_user'@'%';
FLUSH PRIVILEGES;
```

`/etc/my.cnf.d/server.cnf` dosyasina ekleyin:
```ini
[mysqld]
bind-address = 0.0.0.0
```

Firewall kurallarini guncelleyin:
```bash
sudo systemctl restart mariadb
sudo firewall-cmd --permanent --add-service=mysql
sudo firewall-cmd --reload
```

## 3. Otomatik Yedekleme ve Uzak Sunucuya Yedekleme Betigi
`/usr/local/bin/db_backup.sh` icerigi:
```bash
#!/bin/bash
DB_USER="root"
DB_PASS="your_strong_password"
DB_NAME="my_database"
BACKUP_DIR="/var/backups/mariadb"
DATE=$(date +%F_%H%M%S)
RETENTION_DAYS=7
REMOTE_USER="remote_user"
REMOTE_HOST="remote.server.ip.or.domain"
REMOTE_DIR="/path/to/remote/backups"

mkdir -p "$BACKUP_DIR"
mariadb-dump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_$DATE.sql.gz"
rsync -avz "$BACKUP_DIR/" -e ssh "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
```

Betiğe calistirma izni verip `sudo crontab -e` ile zamanlayin:
```cron
0 2 * * * /usr/local/bin/db_backup.sh > /dev/null 2>&1
```
