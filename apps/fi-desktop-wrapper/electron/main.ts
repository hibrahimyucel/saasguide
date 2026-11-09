// apps/fi-desktop-wrapper/electron/main.ts
import { app, BrowserWindow, Menu } from "electron"; // 🚀 Added Menu import
import * as path from "path";

function createWindow() {
  // 1. Remove the menu bar overlay for the window instance
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Monorepo Desktop Suite",
    // 🚀 Clean UI Trick: Auto-hides menu bar on Linux if Alt isn't pressed
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
