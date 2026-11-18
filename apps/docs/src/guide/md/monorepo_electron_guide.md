# 🚀 Monorepo İçinde İzole Electron ile Masaüstü ve Tablet Uygulaması Geliştirme Rehberi

Bu rehber, bir Monorepo (PNPM Workspace) mimarisinde, mevcut bir **Vite + React** web projesini tamamen temiz ve izole tutarak, onu bağımsız bir proje katmanında nasıl **Masaüstü (Desktop) ve Tablet** uygulamasına dönüştüreceğinizi adım adım anlatır.

---

## 🏗️ 1. Mimari Tasarım ve Klasör Yapısı

**Anayasa v3** temiz kod ve katmanlı mimari standartlarına göre, web uygulamasının kaynak koduna Electron bağımlılıkları bulaştırılmamalıdır. Bunun yerine, web projesinin derlenmiş çıktılarını (`dist/`) bir konteyner gibi sarmalayan ayrı bir paket oluşturulur.

### Hedef Monorepo Klasör Ağacı
```text
saasguide/
├── apps/
│   ├── file-info/              # Saf Web/SaaS Projesi (React + Vite)
│   │   ├── src/                # Sadece Web bileşenleri ve Context yapısı
│   │   ├── tsconfig.json       # Web derleyici ayarları ("noEmit": true)
│   │   └── package.json        # Web bağımlılıkları
│   │
│   └── desktop-wrapper/        # Yeni İzole Masaüstü & Tablet Sarmalayıcısı
│       ├── electron/
│       │   └── main.ts         # Masaüstü/Tablet Pencere Çekirdeği (Main Process)
│       ├── package.json        # Masaüstü Paketleme & electron-builder Ayarları
│       └── tsconfig.json       # Masaüstü Derleyici Ayarları (Node/Electron Context)
├── package.json                # Monorepo Kök package.json
└── turbo.json                  # Turborepo Otomasyon Pipeline Konfigürasyonu
```

---

## 📦 2. Adım: `desktop-wrapper` Projesinin Kurulumu

`apps/desktop-wrapper` adında yeni bir klasör açın ve içerisine projenin masaüstü çalışma runtime sözleşmelerini inşa edin.

### A) `package.json` Yapılandırması
Bu dosya, yerel işletim sistemi derleme motorunu (`electron-builder`) ve gerekli kurumsal dağıtım metadatalarını barındırır. Linux (AlmaLinux, RHEL, Fedora) için `.rpm` ve `.AppImage` çıktılarını hedefler.

```json
{
  "name": "desktop-wrapper",
  "version": "1.0.0",
  "private": true,
  "description": "Monorepo Desktop and Tablet Client for SaaS File Analyzer",
  "author": "İbrahim Yücel <hibrahimyucel@example.com>",
  "homepage": "https://github.com",
  "main": "dist-electron/main.js",
  "scripts": {
    "desktop:compile": "tsc",
    "desktop:build": "rm -rf dist-electron release && pnpm desktop:compile && electron-builder"
  },
  "build": {
    "appId": "com.saasguide.desktop",
    "productName": "Monorepo Desktop Suite",
    "directories": {
      "output": "release"
    },
    "files": [
      {
        "from": "../file-info/dist",
        "to": "dist"
      },
      "dist-electron/main.js",
      "package.json"
    ],
    "asar": true,
    "linux": {
      "target": ["AppImage", "rpm"],
      "maintainer": "İbrahim Yücel <hibrahimyucel@example.com>",
      "category": "Utility"
    }
  },
  "devDependencies": {
    "electron": "^33.4.11",
    "electron-builder": "^25.1.8",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### B) `tsconfig.json` Yapılandırması
Masaüstü derleyicisinin, web projesinin (`src/`) veya global `node_modules` klasörlerinin içine sızıp tip çakışması yaşamaması için **"File Sıfır-Sızıntı Kıskacı"** kurulmalıdır.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist-electron",
    "rootDir": "./electron",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "lib": ["ES2022"],
    "noEmit": false
  },
  "include": ["electron/main.ts"]
}
```

---

## 💻 3. Adım: Masaüstü & Tablet Çekirdeği (`electron/main.ts`)

`apps/desktop-wrapper/electron/main.ts` dosyasını oluşturun. Bu dosya, uygulamanın işletim sistemi üzerinde bir pencere (pencere başlığı ve işletim sistemi menü çubuğu arındırılmış tam ekran sarmalayıcı) olarak ayağa kalkmasını sağlar.

```typescript
import { app, BrowserWindow, Menu } from "electron";
import * as path from "path";

function createWindow() {
  // 🚀 KİOSK / SAF UYGULAMA MODU: Standart Chromium üst menülerini (File, Edit vb.) tamamen uçurur
  Menu.setApplicationMenu(null); 

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Monorepo Desktop Suite",
    autoHideMenuBar: true, // Alt tuşuna basıldığında menünün geri gelmesini engeller
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // file-info projesinin pnpm workspace üzerinden çekilen statik dist çıktısını yükler
  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
```

---

## 🌐 4. Adım: Saf Web Projesinin Hazırlanması (`file-info`)

Web projesinin asset köprülerinin (`/assets/...`) yerel dosya sisteminden (`file://...`) yüklenebilmesi için Vite'ın adresleme stratejisini **mutlaktan göreceliğe (relative paths)** çevirmeliyiz.

### A) `apps/file-info/vite.config.ts` Güncellemesi
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // 🚀 KRİTİK: Varlıkların (CSS, JS) yerel dosya hiyerarşisinde çözülmesi için şarttır!
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
```

### B) `apps/file-info/tsconfig.json` Güncellemesi
Web derleme adımlarının kaynak klasörü kirletmesini önlemek ve React tip uyumsuzluklarını aşmak için şu iki parametreyi kilitleyin:
```json
{
  "compilerOptions": {
    "noEmit": true,                  // 🚀 Derlenen JS dosyalarının src/ yanına sızmasını engeller
    "esModuleInterop": true,         // React default import hatalarını çözer
    "allowSyntheticDefaultImports": true
  }
}
```

---

## ⚡ 5. Adım: Monorepo Pipeline Otomasyonu (`turbo.json`)

Tüm projeyi tek komutla, cache mekanizmasını işleterek zincirleme derlemek için kök dizindeki `turbo.json` dosyanıza `desktop:build` görevini ekleyin. Bu sayede, `desktop-wrapper` derlenmeden önce Turbo otomatik olarak gidip `file-info` projesinin web çıktılarını hazırlar.

```json
{
  "$schema": "https://turbo.build",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "desktop:build": {
      "dependsOn": ["build"],
      "outputs": ["dist-electron/**", "release/**"]
    }
  }
}
```

---

## 🏃‍♂️ 6. Derleme, Paketleme ve Kurulum Komutları

Tüm konfigürasyonlar tamamlandıktan sonra, monorepo kök dizininde (`saasguide`) şu adımları takip ederek uygulamanızı paketleyebilirsiniz.

### A) Bağımlılık Ağacını Yenileyin
```bash
pnpm install
```

### B) Sadece Masaüstü Projesini Filtreleyerek Derleyin
```bash
pnpm turbo run desktop:build --filter=desktop-wrapper
```

### C) AlmaLinux / RHEL Ortamında Kurulum Yapın
Derleme başarıyla bittiğinde, `apps/desktop-wrapper/release/` klasörü altında işletim sisteminize özel yerel `.rpm` paketi oluşacaktır. Sisteminize entegre etmek için:

```bash
cd apps/desktop-wrapper/release
sudo dnf localinstall desktop-wrapper-1.0.0.x86_64.rpm
```

Kurulum bittikten sonra uygulamanız **GNOME Activities / Uygulamalar** menünüze bir masaüstü ikonu olarak yerleşecektir!
