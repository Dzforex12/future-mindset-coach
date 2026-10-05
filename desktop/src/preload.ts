import { contextBridge, ipcRenderer } from "electron";

type WakeStatus = {
    enabled: boolean;
    state: "off" | "starting" | "listening" | "detected" | "handoff" | "paused" | "error";
    microphoneActive: boolean;
    message: string;
    handoffId?: string;
};

contextBridge.exposeInMainWorld("coachDesktop", {
    openCoach: () => ipcRenderer.invoke("coach:open"),
    openRoute: (route: string) => ipcRenderer.invoke("coach:open-route", route),
    goHome: () => ipcRenderer.invoke("coach:home"),
    enableWake: () => ipcRenderer.invoke("wake:enable"),
    disableWake: () => ipcRenderer.invoke("wake:disable"),
    getWakeStatus: () => ipcRenderer.invoke("wake:get-status"),
    onWakeStatus: (callback: (status: WakeStatus) => void) => {
        const listener = (_event: Electron.IpcRendererEvent, status: WakeStatus) => callback(status);
        ipcRenderer.on("wake:status", listener);
        return () => ipcRenderer.removeListener("wake:status", listener);
    },
    requestMicrophone: () => ipcRenderer.invoke("voice:request-microphone"),
    completeMicrophoneRequest: () => ipcRenderer.invoke("voice:complete-microphone-request"),
    completeVoiceFlow: () => ipcRenderer.invoke("voice:flow-complete"),
    transcribeAudio: (request: {
        audioData: Uint8Array;
        mimeType: string;
        languageMode: "en" | "it" | "sq-standard" | "sq-kosovo";
    }) => ipcRenderer.invoke("voice:transcribe", request),
    sendTranscriptToCoach: (transcript: string) => ipcRenderer.invoke("coach:send-transcript", transcript),
});
