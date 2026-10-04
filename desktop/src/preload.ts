import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("coachDesktop", {
    openCoach: () => ipcRenderer.invoke("coach:open"),
});
