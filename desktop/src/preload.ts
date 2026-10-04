import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("coachDesktop", {
    openCoach: () => ipcRenderer.invoke("coach:open"),
    openRoute: (route: string) => ipcRenderer.invoke("coach:open-route", route),
    goHome: () => ipcRenderer.invoke("coach:home"),
    requestMicrophone: () => ipcRenderer.invoke("voice:request-microphone"),
    completeMicrophoneRequest: () => ipcRenderer.invoke("voice:complete-microphone-request"),
    transcribeAudio: (request: {
        audioData: Uint8Array;
        mimeType: string;
        languageMode: "en" | "it" | "sq-standard" | "sq-kosovo";
    }) => ipcRenderer.invoke("voice:transcribe", request),
    sendTranscriptToCoach: (transcript: string) => ipcRenderer.invoke("coach:send-transcript", transcript),
});
