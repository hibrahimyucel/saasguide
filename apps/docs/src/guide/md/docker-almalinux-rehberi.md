# Docker, AlmaLinux, Node.js (TypeScript) ve Knex.js Geliştirme Rehberi

Bu döküman, Windows ortamından Linux ekosistemine geçiş sürecinde; Docker mimarisi, AlmaLinux tabanlı container yapılandırmaları, TypeScript ile katmanlı Express.js API tasarımı, Knex.js sorgu motoru kullanımı ve Zod validasyon stratejilerini içeren kapsamlı teknik konuşma geçmişinin özetidir.

---

## 1. Docker & AlmaLinux Temelleri

### İmaj Türleri ve Boyutları
* **`almalinux:latest` (Standart):** ~120-180 MB disk boyutu. Tam `dnf` paket yöneticisi ve standart Linux araçlarını barındırır. Geliştirme (development) ortamları için idealdir.
* **`almalinux:minimal`:** ~37-40 MB disk boyutu (sıkıştırılmış download boyutu ~15-20 MB). Donanım çekirdeği (kernel), GUI ve systemd gibi servis yöneticilerini içermez; çekirdeği host OS ile ortak kullanır. C tabanlı `microdnf` / `dnf5` barındırır. Canlı (production) ortamlar için tasarlanmıştır.

### AlmaLinux Üzerine Docker Engine Kurulumu (Host)
```bash
# 1. Çakışan paketleri temizleme
sudo dnf remove -y podman buildah docker docker-engine docker.io containerd runc

# 2. Docker reposunu ekleme
sudo dnf install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 3. Kurulum
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Servisi başlatma ve enable etme
sudo systemctl enable --now docker

# 5. Non-root kullanıcı yetkilendirmesi
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2. Docker Compose ile Çoklu Konteyner (Mikroservis) Mimarisi

Geliştirme ve test süreçlerinde tüm servisleri tek bir konteyner içine hapsetmek (Docker-in-Docker) yerine, izole servisleri `docker-compose` orkestrasyonu ile ayağa kaldırmak en doğru yaklaşımdır.

### `docker-compose.yml` Yapılandırması
```yaml
version: '3.8'

services:
  database:
    image: mariadb:10.11
    container_name: saas_mariadb
    restart: always
    environment:
      MARIADB_ROOT_PASSWORD: root_password_here
      MARIADB_DATABASE: saas_db
      MARIADB_USER: saas_user
      MARIADB_PASSWORD: user_password_here
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - saas_network

  saas-app:
    build: ./saas-app
    container_name: saas_application
    restart: always
    command: npm run dev
    volumes:
      - ./saas-app:/usr/src/app
      - /usr/src/app/node_modules
    environment:
      - DB_HOST=database
      - DB_USER=saas_user
      - DB_PASSWORD=user_password_here
      - DB_NAME=saas_db
      - PORT=3000
    depends_on:
      - database
    networks:
      - saas_network

  nginx:
    image: nginx:alpine
    container_name: saas_nginx
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - saas-app
    networks:
      - saas_network

volumes:
  db_data:

networks:
  saas_network:
    driver: bridge
```

### Konteyner Verileri Nerede Tutulur?
1. **Named Volumes (`volumes: db_data`):** Host sistemde `/var/lib/docker/volumes/` altında izole ve güvenli saklanır. Konteyner silinse de veriler kaybolmaz.
2. **Bind Mounts (`./saas-app:/usr/src/app`):** Host üzerindeki kaynak kod dizinini doğrudan konteynere köprüler. Canlı kod takibi (hot-reload) sağlar.
3. **Konteyner Katmanı (`COPY` komutları):** `/var/lib/docker/overlay2/` altında şifreli adlarla saklanır. Geçici katmandır, konteyner `down` edildiğinde buradaki kalıcılaştırılmamış değişiklikler yok olur.

---

## 3. Node.js (TypeScript) & Knex.js Altyapısı

### Neden Knex.js? (Prisma ORM Eleştirisi)
Prisma ORM, arka planda Rust tabanlı bir *Binary Engine* çalıştırdığından Docker konteynerlerinde ek RAM tüketimi ve IPC gecikmesi yaratabilir; kontrolsüz kompleks SQL sorguları üretebilir. 
**Knex.js** ise saf JavaScript/TypeScript mimarisiyle çalışan, bağlantı havuzunu (connection pool) agresif yöneten hafif (lightweight) ve şeffaf bir Query Builder'dır. SQL kontrolünü tamamen yazılımcıya bırakır.

### `saas-app/Dockerfile` (TypeScript Uyumlu)
```dockerfile
FROM almalinux:latest

WORKDIR /usr/src/app

RUN dnf clean all &&     dnf update -y &&     dnf module enable nodejs:20 -y &&     dnf install -y nodejs npm &&     dnf clean all

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Veri Olan Tabloların Güvenli Migrasyonu (Alter Table)
İçinde veri bulunan tablolarda değişiklik yaparken sistemin patlamaması için yeni eklenen kolonların `nullable()` olması veya `defaultTo()` değer içermesi şarttır.

```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    // Veri kaybı yaşatmadan yeni foreign key sütunu ekleme
    table.integer('company_id').unsigned().nullable();
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');

    // Kolon adı ve tipi değiştirme (Mevcut veriler korunur)
    table.renameColumn('is_active', 'status');
    table.string('status', 50).defaultTo('active').alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropForeign(['company_id']);
    table.dropColumn('company_id');
    table.renameColumn('status', 'is_active');
    table.boolean('is_active').defaultTo(true).alter();
  });
}
```

---

## 4. Literal Mantığı ile Tip Güvenli Sorgular (Query)

Sihirli metinler (magic strings) yerine TypeScript'in `as const` yeteneğini kullanarak derleme aşamasında tam koruma elde ederiz.

### Şema Literalleri (`src/constants/db-schema.ts`)
```typescript
export const TABLES = {
  USERS: 'users',
  COMPANIES: 'companies',
} as const;

export const USERS_COLS = {
  ID: 'users.id',
  NAME: 'users.name',
  EMAIL: 'users.email',
  COMPANY_ID: 'users.company_id',
  STATUS: 'users.status',
} as const;

export const COMPANIES_COLS = {
  ID: 'companies.id',
  COMPANY_NAME: 'companies.company_name',
  PLAN_TYPE: 'companies.plan_type',
} as const;
```

### Performanslı JOIN Sorgusu (`src/services/user.service.ts`)
```typescript
import db from '../config/database';
import { TABLES, USERS_COLS, COMPANIES_COLS } from '../constants/db-schema';
import { User } from '../interfaces/db.interface';

export class UserService {
  static async getActiveUsersWithCompanies() {
    return await db<User>(TABLES.USERS)
      .innerJoin(
        TABLES.COMPANIES, 
        USERS_COLS.COMPANY_ID, 
        '=', 
        COMPANIES_COLS.ID
      )
      .select({
        userId: USERS_COLS.ID,
        userName: USERS_COLS.NAME,
        userEmail: USERS_COLS.EMAIL,
        companyName: COMPANIES_COLS.COMPANY_NAME,
        companyPlan: COMPANIES_COLS.PLAN_TYPE
      })
      .where(USERS_COLS.STATUS, '=', 'active')
      .orderBy(USERS_COLS.ID, 'desc');
  }
}
```
*Not: Select nesnesinin sağ tarafı veritabanındaki gerçek kolon adresini (`tablo.kolon`), sol tarafı ise kod içerisinde bize dönecek olan JavaScript property adını (Alias) temsil eder.*

---

## 5. Zod ile İstek Validasyonu

TypeScript tabanlı projelerde **Joi yerine Zod** seçilmelidir. Joi şema ve tip tanımlarını çift aşamalı yazdırarak kod tekrarına sebep olurken; Zod, yazılan şemadan tek satırda otomatik TypeScript tipi türetebilir (`z.infer`).

### Zod Şeması ve Tip Türetimi (`src/schemas/user.schema.ts`)
```typescript
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçersiz e-posta adresi'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  company_id: z.number().nullable().optional()
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
```

### Express.js Otomatik Validasyon Middleware Yapısı
```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validasyon hatası oluştu.',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  };
};
```

---
## 6. Linux Alışma Süreci İçin Altın Komutlar
* **Konteyner Linux Terminaline Bağlanma:** `docker exec -it saas_application /bin/bash`
* **Aktif Dizin Kontrolü:** `pwd`
* **Detaylı Dosya Listeleme:** `ls -la`
* **Çalışan SQL Sorgularını İzleme:** Konteyner loglarını `docker compose logs -f saas-app` ile izlerken, Knex yapılandırmasında `debug: true` bayrağı açılarak saf SQL çıktıları terminalden takip edilebilir.
