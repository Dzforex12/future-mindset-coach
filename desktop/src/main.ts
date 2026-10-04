import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";

const COACH_URL = "https://future-mindset-coach.vercel.app";

function createWindow() {
    const window = new BrowserWindow({
        width: 960,
        height: 680,
        minWidth: 720,
        minHeight: 560,
        title: "Future Mindset Coach",
        backgroundColor: "#07111d",
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.loadFile(path.join(__dirname, "renderer", "index.html"));
}

ipcMain.handle("coach:open", async () => {
    await shell.openExternal(COACH_URL);
});

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
