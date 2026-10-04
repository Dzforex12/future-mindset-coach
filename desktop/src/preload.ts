import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("coachDesktop", {
    openCoach: () => ipcRenderer.invoke("coach:open"),
    openRoute: (route: string) => ipcRenderer.invoke("coach:open-route", route),
    goHome: () => ipcRenderer.invoke("coach:home"),
});
