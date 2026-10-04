import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, shell } from "electron";
import path from "node:path";

const COACH_URL = "https://future-mindset-coach.vercel.app";
const COACH_HOST = new URL(COACH_URL).hostname;
const ALLOWED_ROUTES = new Set([
    "/dashboard",
    "/today",
    "/mindset",
    "/goals",
    "/habits",
    "/trading",
    "/summary",
    "/business",
    "/projects",
    "/finances",
    "/settings",
]);

let homeWindow: BrowserWindow | null = null;
let coachWindow: BrowserWindow | null = null;

function isAllowedCoachUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "https:" &&
            (url.hostname === COACH_HOST || url.hostname.endsWith(".supabase.co"));
    } catch {
        return false;
    }
}

function focusHomeWindow() {
    if (!homeWindow || homeWindow.isDestroyed()) {
        createHomeWindow();
    }

    homeWindow?.show();
    homeWindow?.focus();
}

function openCoachWindow(route = "/") {
    if (coachWindow && !coachWindow.isDestroyed()) {
        if (route !== "/") {
            void coachWindow.loadURL(new URL(route, COACH_URL).toString());
        }
        coachWindow.show();
        coachWindow.focus();
        return;
    }

    coachWindow = new BrowserWindow({
        width: 960,
        height: 680,
        minWidth: 720,
        minHeight: 560,
        title: "Future Mindset Coach",
        backgroundColor: "#07111d",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            partition: "persist:future-mindset-coach",
        },
    });

    const activeCoachWindow = coachWindow;
    activeCoachWindow.webContents.on("will-navigate", (event, url) => {
        if (!isAllowedCoachUrl(url)) event.preventDefault();
    });
    activeCoachWindow.webContents.setWindowOpenHandler(({ url }) => {
        void (async () => {
            let parsedUrl: URL;
            try {
                parsedUrl = new URL(url);
            } catch {
                return;
            }
            if (parsedUrl.protocol !== "https:" || isAllowedCoachUrl(url)) return;

            const confirmation = await dialog.showMessageBox(activeCoachWindow, {
                type: "question",
                buttons: ["Cancel", "Open in Browser"],
                defaultId: 0,
                cancelId: 0,
                title: "Open external link?",
                message: `Open ${parsedUrl.hostname} in your system browser?`,
            });
            if (confirmation.response === 1) await shell.openExternal(url);
        })();
        return { action: "deny" };
    });
    activeCoachWindow.on("closed", () => {
        coachWindow = null;
    });
    void activeCoachWindow.loadURL(new URL(route, COACH_URL).toString());
}

function createHomeWindow() {
    homeWindow = new BrowserWindow({
        width: 960,
        height: 680,
        minWidth: 720,
        minHeight: 560,
        title: "Future Mindset Coach - Agent Home",
        backgroundColor: "#07111d",
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    homeWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    homeWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
    homeWindow.on("closed", () => {
        homeWindow = null;
    });
}

ipcMain.handle("coach:open", () => openCoachWindow());
ipcMain.handle("coach:open-route", (_event, route: unknown) => {
    if (typeof route !== "string" || !ALLOWED_ROUTES.has(route)) {
        return false;
    }
    openCoachWindow(route);
    return true;
});
ipcMain.handle("coach:home", focusHomeWindow);

app.whenReady().then(() => {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: "Agent Home",
            click: focusHomeWindow,
        },
        {
            label: "Future Mindset Coach",
            submenu: [
                { role: "quit" },
            ],
        },
    ]));
    globalShortcut.register("Alt+Home", focusHomeWindow);
    createHomeWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createHomeWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});
