# AlmaLinux, MariaDB, Docker ve NGINX ile SaaS Node.js Mimari Rehberi

Bu doküman, Node.js tabanlı SaaS (Multi-tenant) uygulamanız için geliştirilen **AlmaLinux - Docker - NGINX (Load Balancer) - MariaDB** altyapısının kurulum adımlarını, yapılandırma dosyalarını ve veritabanı yönetim stratejilerini içermektedir.

---

## 1. Altyapı ve Docker Kurulumu (AlmaLinux Host OS)
AlmaLinux, RHEL (Red Hat Enterprise Linux) tabanlı olduğu için kararlı ve güvenli bir sunucu ortamı sunar. Kuruluma başlamadan önce çakışabilecek Podman paketlerinin temizlenmesi ve resmi Docker depolarının eklenmesi gerekir.

### Adım 1.1: Çakışan Paketlerin Temizlenmesi
```bash
sudo dnf remove -y podman buildah docker docker-engine docker.io containerd runc
```

### Adım 1.2: Docker Deposunun Eklenmesi ve Kurulum
```bash
sudo dnf install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Adım 1.3: Docker Servisinin Başlatılması ve İzinler
```bash
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```
*(Kurulumu doğrulamak için `docker run hello-world` komutunu çalıştırabilirsiniz.)*

---

## 2. Üretim Hazır Konteyner Altyapısı (Production Ready Stack)
SaaS mimarinizde yükün dengeli dağıtılması ve sistem bileşenlerinin güvenliği için 3 adet Node.js instance'ı, 1 adet dış dünyaya kapalı MariaDB kümesi ve trafiği karşılayan NGINX sunucusu bulunur.

### 📄 Dosya 1: Dockerfile (Node.js Uygulaması)
Hafif ve güvenli olan `alpine` tabanlı Node.js imajını kullanıyoruz.
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### 📄 Dosya 2: nginx.conf (Wildcard ve Yük Dengeleyici)
`*.saas.com` alt alan adlarını karşılar ve gelen isteğin asıl `Host` header'ını Node.js kümesine aktarır.
```nginx
upstream node_cluster {
    server node_app_1:3000;
    server node_app_2:3000;
    server node_app_3:3000;
}

server {
    listen 80;
    server_name .saas.com; # Wildcard domain tanımı

    client_max_body_size 20M;

    location / {
        proxy_pass http://node_cluster;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Kullanıcı (Tenant) tespiti için kritik başlıklar
        proxy_set_header Host $host; 
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 90;
        proxy_send_timeout 90;
        proxy_read_timeout 90;
    }
}
```

### 📄 Dosya 3: docker-compose.yml (Orkestrasyon)
Veritabanları dış dünyaya port açmaz. Sadece Docker iç ağı (`app_network`) üzerinden Node.js tarafından erişilebilir durumdadır.
```yaml
version: '3.8'

services:
  # Sistem (Master) Veritabanı
  mariadb_system:
    image: mariadb:10.11
    container_name: mariadb_system
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: system_root_password
      MYSQL_DATABASE: saas_system_db
    volumes:
      - system_db_data:/var/lib/mysql
    networks:
      - app_network

  # Kullanıcı (Tenant) Veritabanları Servisi
  mariadb_tenants:
    image: mariadb:10.11
    container_name: mariadb_tenants
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: tenants_root_password
    volumes:
      - tenants_db_data:/var/lib/mysql
    networks:
      - app_network

  # Node.js Uygulama Cluster'ı
  node_app_1:
    build: .
    container_name: node_app_1
    restart: always
    environment:
      - DB_HOST=mariadb_tenants
      - PORT=3000
    depends_on:
      - mariadb_tenants
    networks:
      - app_network

  node_app_2:
    build: .
    container_name: node_app_2
    restart: always
    environment:
      - DB_HOST=mariadb_tenants
      - PORT=3000
    depends_on:
      - mariadb_tenants
    networks:
      - app_network

  node_app_3:
    build: .
    container_name: node_app_3
    restart: always
    environment:
      - DB_HOST=mariadb_tenants
      - PORT=3000
    depends_on:
      - mariadb_tenants
    networks:
      - app_network

  # NGINX Giriş Kapısı
  nginx:
    image: nginx:alpine
    container_name: nginx_lb
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - node_app_1
      - node_app_2
      - node_app_3
    networks:
      - app_network

volumes:
  system_db_data:
  tenants_db_data:

networks:
  app_network:
    driver: bridge
```

---

## 3. SaaS Multi-Tenant Veritabanı Yönetimi (Node.js)

### ⚙️ Dinamik Bağlantı ve Havuz Yönetimi (`dbManager.js`)
Her istekte havuzun sıfırdan açılmasını önleyen ve bellekte önbelleğe (cache) alan, kullanılmayan bağlantıları `idleTimeout` ile kapatan performans odaklı yapı.
```javascript
const mysql = require('mysql2/promise');

const systemPool = mysql.createPool({
    host: 'mariadb_system',
    user: 'root',
    password: 'system_root_password',
    database: 'saas_system_db',
    connectionLimit: 5
});

const tenantPools = {};

async function getTenantConnection(tenantId) {
    if (tenantPools[tenantId]) {
        return tenantPools[tenantId];
    }

    const [rows] = await systemPool.query(
        'SELECT db_name FROM tenants WHERE id = ? AND status = "active"', 
        [tenantId]
    );

    if (rows.length === 0) {
        throw new Error('Geçersiz veya pasif SaaS müşterisi.');
    }

    const tenantConfig = rows[0];

    tenantPools[tenantId] = mysql.createPool({
        host: 'mariadb_tenants',
        user: 'root',
        password: 'tenants_root_password',
        database: tenantConfig.db_name,
        waitForConnections: true,
        connectionLimit: 10,
        idleTimeout: 60000 // Boştaki bağlantıları kapatarak RAM korur
    });

    return tenantPools[tenantId];
}

module.exports = { systemPool, getTenantConnection };
```

### 🔨 Yeni Müşteri Provizyonu (`migrationManager.js`)
Yeni bir şirket kayıt olduğunda programatik olarak veritabanını açıp şemaları göç (migrate) ettirir.
```javascript
const knex = require('knex');
const path = require('path');

const dbConfig = {
    host: 'mariadb_tenants',
    user: 'root',
    password: 'tenants_root_password',
};

async function provisionNewTenant(dbName) {
    const maintenanceDb = knex({ client: 'mysql2', connection: dbConfig });
    try {
        await maintenanceDb.raw(`CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, [dbName]);
        await maintenanceDb.destroy();

        const tenantDb = knex({
            client: 'mysql2',
            connection: { ...dbConfig, database: dbName },
            migrations: { directory: path.join(__dirname, 'migrations') }
        });

        await tenantDb.migrate.latest();
        await tenantDb.destroy();
        return true;
    } catch (error) {
        await maintenanceDb.destroy();
        throw error;
    }
}

module.exports = { provisionNewTenant };
```

### 🔄 Toplu Veritabanı Güncelleme Scripti (`runBulkMigrations.js`)
Uygulamaya yeni bir şema özelliği geldiğinde, Sistem veritabanındaki tüm aktif kiracıları tarayarak sırayla güvenli `transaction` kilitleri eşliğinde günceller.
```javascript
const knex = require('knex');
const path = require('path');
const { systemPool } = require('./dbManager');

const dbConfig = { host: 'mariadb_tenants', user: 'root', password: 'tenants_root_password' };

async function runBulkMigrations() {
    try {
        const [tenants] = await systemPool.query('SELECT company_name, db_name FROM tenants WHERE status = "active"');
        for (const tenant of tenants) {
            const tenantDb = knex({
                client: 'mysql2',
                connection: { ...dbConfig, database: tenant.db_name },
                migrations: { directory: path.join(__dirname, 'migrations') }
            });
            try {
                const [batchNo, log] = await tenantDb.migrate.latest();
                console.log(`[${tenant.company_name}] Güncelleme sonucu:`, log.length ? log : 'Zaten güncel.');
            } finally {
                await tenantDb.destroy();
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Toplu göç hatası:', error);
        process.exit(1);
    }
}
runBulkMigrations();
```

---

## 4. Mimari Tasarım Kararları (ADR)
* **Neden MariaDB Docker İçinde?** Projenin ilk fazlarında sıfır konfigürasyon bağımlılığı, yalıtılmış kütüphane havuzu ve yedek alıp başka sunucuya taşımada (portability) sağladığı esneklik için tercih edilmiştir.
* **Ne Zaman Host OS'e Taşınmalı?** Müşteri sayısı artıp disk üzerindeki saniyelik okuma/yazma (IOPS) limitleri Docker köprü ağında gecikme oluşturmaya başladığında, MariaDB Docker dışına çıkarılarak özel donanımlı, bare-metal bir AlmaLinux sunucusuna doğrudan kurulmalıdır.
