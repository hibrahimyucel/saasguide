// apps/file-info/electron/main.ts
import { app, BrowserWindow } from "electron";
import path from "path";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "SaaS File Info Analyser",
    webPreferences: {
      // Güvenlik standartları için izolasyon açık kalmalı
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Geliştirme (Development) aşamasındaysak Vite yerel sunucusunu yükle
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Üretim (Production) aşamasındaysak derlenen statik HTML dosyasını yükle
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

// macOS hariç tüm pencereler kapatıldığında uygulamadan çık
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
