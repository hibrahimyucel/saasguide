// apps/file-info/electron/main.ts
import { app, BrowserWindow } from "electron";
import * as path from "path";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Monorepo File Analyzer",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Points smoothly to the built static index file
  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
