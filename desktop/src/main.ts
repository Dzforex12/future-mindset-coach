import {
    app,
    BrowserWindow,
    clipboard,
    dialog,
    globalShortcut,
    ipcMain,
    Menu,
    session,
    shell,
} from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COACH_URL = "https://future-mindset-coach.vercel.app";
const COACH_HOST = new URL(COACH_URL).hostname;
const GROQ_HOST = "api.groq.com";
const GROQ_PATH = "/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3";
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const MAX_TRANSCRIPT_LENGTH = 5_000;
const MICROPHONE_AUTHORIZATION_MS = 10_000;
const WAKE_WORKER_STOP_TIMEOUT_MS = 2_500;
const WAKE_WORKER_START_TIMEOUT_MS = 8_000;
const ALLOWED_AUDIO_TYPES = new Set(["audio/webm", "audio/webm;codecs=opus"]);
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
let microphoneAuthorizationExpiresAt = 0;
let transcriptionInProgress = false;
let wakeEnabled = false;
let wakeDetectionLatched = false;
let wakePausedForVoice = false;
let wakeWorker: ChildProcessWithoutNullStreams | null = null;
let wakeWorkerStopping = false;
let wakeWorkerStartTimer: NodeJS.Timeout | null = null;
let wakeLineBuffer = "";
let wakeStatus: WakeStatus = {
    enabled: false,
    state: "off",
    microphoneActive: false,
    message: "Wake Word OFF",
};
const activeTranscriptionAbortControllers = new Set<AbortController>();

type LanguageMode = "en" | "it" | "sq-standard" | "sq-kosovo";
type WakeState = "off" | "starting" | "listening" | "detected" | "handoff" | "paused" | "error";

type WakeStatus = {
    enabled: boolean;
    state: WakeState;
    microphoneActive: boolean;
    message: string;
    handoffId?: string;
};

type WakeWorkerMessage =
    | { type: "ready" }
    | { type: "listening" }
    | { type: "wake_detected" }
    | { type: "stopped"; seconds?: number; avgRms?: number; peak?: number; clipPct?: number }
    | { type: "error"; code?: string };

type TranscriptionRequest = {
    audioData: Uint8Array;
    mimeType: string;
    languageMode: LanguageMode;
};

const TRANSCRIPTION_SETTINGS: Record<LanguageMode, { language: string; prompt: string }> = {
    en: {
        language: "en",
        prompt: "Future Mindset Coach productivity assistant. Common terms: focus, goals, priorities, habits, projects, business, finances, trading.",
    },
    it: {
        language: "it",
        prompt: "Assistente di produttività Future Mindset Coach. Parole comuni: concentrazione, obiettivi, priorità, abitudini, progetti, lavoro, finanze.",
    },
    "sq-standard": {
        language: "sq",
        prompt: "Shqip. Fjalë të zakonshme për asistentin: përqendrohem, fokus, sot, punë, qëllime, prioritete, zakone, projekte, biznes, financa, tregti, pas pune.",
    },
    "sq-kosovo": {
        language: "sq",
        prompt: "Shqip dhe të folme kosovare. Fjalë të zakonshme: çka, bo, sot, mas pune, kry, projekt, prioritete, qëllime, biznes, financa.",
    },
};

function isHomeFrame(event: Electron.IpcMainInvokeEvent): boolean {
    if (!homeWindow || homeWindow.isDestroyed() || event.sender !== homeWindow.webContents) {
        return false;
    }

    const frame = event.senderFrame;
    if (!frame || frame !== event.sender.mainFrame) return false;

    try {
        const url = new URL(frame.url);
        return url.protocol === "file:" &&
            path.resolve(fileURLToPath(url)) === path.resolve(path.join(__dirname, "renderer", "index.html"));
    } catch {
        return false;
    }
}

function parseLanguageMode(value: unknown): LanguageMode | null {
    return typeof value === "string" && Object.hasOwn(TRANSCRIPTION_SETTINGS, value)
        ? value as LanguageMode
        : null;
}

async function resolveGroqApiKey(): Promise<string | null> {
    const environmentKey = process.env.GROQ_API_KEY?.trim();
    if (environmentKey) return environmentKey;

    try {
        const envFilePath = path.resolve(__dirname, "..", "..", ".env.local");
        const content = await readFile(envFilePath, "utf8");
        for (const line of content.split(/\r?\n/u)) {
            const match = /^\s*(?:export\s+)?GROQ_API_KEY\s*=\s*(.*?)\s*$/u.exec(line);
            if (!match) continue;

            const value = match[1];
            const unquoted = value.length >= 2 &&
                ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'")))
                ? value.slice(1, -1)
                : value;
            return unquoted.trim() || null;
        }
    } catch {
        return null;
    }
    return null;
}

function getPrompt(languageMode: LanguageMode): string {
    return TRANSCRIPTION_SETTINGS[languageMode].prompt;
}

function buildMultipartBody(audio: Buffer, languageMode: LanguageMode, boundary: string): Buffer {
    const settings = TRANSCRIPTION_SETTINGS[languageMode];
    const fields = [
        ["model", GROQ_MODEL],
        ["language", settings.language],
        ["temperature", "0"],
        ["prompt", getPrompt(languageMode)],
    ] as const;
    const parts: Buffer[] = [];

    for (const [name, value] of fields) {
        parts.push(Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
            "utf8",
        ));
    }

    parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="recording.webm"\r\nContent-Type: audio/webm\r\n\r\n`,
        "utf8",
    ));
    parts.push(audio);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"));
    return Buffer.concat(parts);
}

function transcribeWithGroq(
    audio: Buffer,
    languageMode: LanguageMode,
    apiKey: string,
    signal: AbortSignal,
): Promise<string> {
    if (signal.aborted) {
        return Promise.reject(new Error("Transcription was canceled because Agent Home closed."));
    }

    const boundary = `----FutureMindsetVoice${randomUUID().replaceAll("-", "")}`;
    const body = buildMultipartBody(audio, languageMode, boundary);

    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: GROQ_HOST,
            path: GROQ_PATH,
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "Content-Length": body.length,
            },
            timeout: 45_000,
        }, (response) => {
            const responseChunks: Buffer[] = [];
            let responseSize = 0;
            response.on("data", (chunk: Buffer) => {
                responseSize += chunk.length;
                if (responseSize > 1024 * 1024) {
                    reject(new Error("Groq returned an oversized response. Please try again."));
                    response.destroy();
                    return;
                }
                responseChunks.push(chunk);
            });
            response.on("error", () => {
                reject(new Error("Groq returned an unreadable response. Please try again."));
            });
            response.on("end", () => {
                const status = response.statusCode ?? 0;
                if (status < 200 || status >= 300) {
                    reject(new Error(status === 401 || status === 403
                        ? "Groq authentication failed. Check the desktop app configuration."
                        : status === 429
                            ? "Groq is temporarily rate-limited. Please try again shortly."
                            : "Groq could not transcribe this recording. Please try again."));
                    return;
                }

                try {
                    const result: unknown = JSON.parse(Buffer.concat(responseChunks).toString("utf8"));
                    if (
                        typeof result !== "object" ||
                        result === null ||
                        !("text" in result) ||
                        typeof result.text !== "string" ||
                        !result.text.trim()
                    ) {
                        reject(new Error("Groq returned an empty transcript. Please try again."));
                        return;
                    }
                    resolve(result.text.slice(0, MAX_TRANSCRIPT_LENGTH));
                } catch {
                    reject(new Error("Groq returned an unreadable response. Please try again."));
                }
            });
        });

        const abortRequest = () => request.destroy(new Error("cancelled"));
        request.on("close", () => {
            signal.removeEventListener("abort", abortRequest);
            body.fill(0);
        });
        request.on("error", () => {
            body.fill(0);
        });
        signal.addEventListener("abort", abortRequest, { once: true });
        request.on("error", () => {
            reject(new Error("Could not reach Groq. Check your internet connection and try again."));
        });
        request.on("timeout", () => {
            request.destroy(new Error("timeout"));
        });
        if (signal.aborted) {
            abortRequest();
        } else {
            request.end(body);
        }
    });
}

function validateAudioRequest(value: unknown): { audio: Buffer; languageMode: LanguageMode } | null {
    if (typeof value !== "object" || value === null) return null;

    const request = value as Partial<TranscriptionRequest>;
    const languageMode = parseLanguageMode(request.languageMode);
    if (
        !languageMode ||
        typeof request.mimeType !== "string" ||
        !ALLOWED_AUDIO_TYPES.has(request.mimeType) ||
        !(request.audioData instanceof Uint8Array) ||
        request.audioData.byteLength < 2_000 ||
        request.audioData.byteLength > MAX_AUDIO_BYTES
    ) {
        return null;
    }

    const audio = Buffer.from(request.audioData);
    if (audio.length < 4 || audio[0] !== 0x1a || audio[1] !== 0x45 || audio[2] !== 0xdf || audio[3] !== 0xa3) {
        return null;
    }
    return { audio, languageMode };
}

function isAllowedCoachUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "https:" &&
            (url.hostname === COACH_HOST || url.hostname.endsWith(".supabase.co"));
    } catch {
        return false;
    }
}

function setWakeStatus(nextStatus: WakeStatus) {
    wakeStatus = nextStatus;
    if (homeWindow && !homeWindow.isDestroyed()) {
        homeWindow.webContents.send("wake:status", wakeStatus);
    }
}

function getWakeRoot(): string {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, "wake");
    }
    return path.resolve(__dirname, "..", "resources", "wake");
}

function getWakeModelPath(): string {
    return path.join(getWakeRoot(), "models", "vosk-model-small-en-us-0.15");
}

function getWakeWorkerLaunch(): { command: string; args: string[] } | null {
    const wakeRoot = getWakeRoot();
    const modelPath = getWakeModelPath();

    if (!existsSync(modelPath)) return null;

    if (app.isPackaged) {
        const executablePath = path.join(wakeRoot, "wake_worker.exe");
        return existsSync(executablePath)
            ? { command: executablePath, args: ["--model", modelPath] }
            : null;
    }

    const scriptPath = path.join(wakeRoot, "wake_worker.py");
    if (!existsSync(scriptPath)) return null;

    const developmentPython = process.platform === "win32"
        ? path.join(wakeRoot, ".venv", "Scripts", "python.exe")
        : path.join(wakeRoot, ".venv", "bin", "python");

    if (existsSync(developmentPython)) {
        return { command: developmentPython, args: [scriptPath, "--model", modelPath] };
    }

    return process.platform === "win32"
        ? { command: "py", args: ["-3", scriptPath, "--model", modelPath] }
        : { command: "python3", args: [scriptPath, "--model", modelPath] };
}

function safeWakeErrorMessage(code: string): string {
    switch (code) {
        case "model_missing":
        case "model_load_failed":
            return "Wake Word model is unavailable. Rebuild the desktop app resources.";
        case "microphone_unavailable":
        case "microphone_stream_failed":
            return "Wake Word could not access the microphone.";
        case "microphone_stream_warning":
            return "Wake Word microphone stream reported a warning.";
        case "recognition_failed":
            return "Wake Word recognition failed. Please restart Wake Word mode.";
        case "worker_missing":
            return "Wake Word worker is unavailable. Rebuild the desktop app resources.";
        case "python_unavailable":
            return "Wake Word worker could not start. Python runtime is unavailable.";
        case "startup_timeout":
            return "Wake Word worker did not become ready in time.";
        default:
            return "Wake Word stopped unexpectedly.";
    }
}

function stopWakeWorker(): Promise<void> {
    const worker = wakeWorker;
    if (!worker) return Promise.resolve();

    wakeWorkerStopping = true;

    return new Promise((resolve) => {
        let settled = false;
        const settle = () => {
            if (settled) return;
            settled = true;
            if (wakeWorker === worker) wakeWorker = null;
            wakeWorkerStopping = false;
            wakeLineBuffer = "";
            resolve();
        };

        const timeout = setTimeout(() => {
            if (!worker.killed) worker.kill();
            settle();
        }, WAKE_WORKER_STOP_TIMEOUT_MS);

        worker.once("exit", () => {
            clearTimeout(timeout);
            settle();
        });

        try {
            worker.stdin.write(`${JSON.stringify({ type: "stop" })}\n`);
        } catch {
            if (!worker.killed) worker.kill();
        }
    });
}

function parseWakeWorkerLine(line: string): WakeWorkerMessage | null {
    try {
        const message: unknown = JSON.parse(line);
        if (typeof message !== "object" || message === null || !("type" in message)) return null;
        const type = (message as { type?: unknown }).type;
        if (
            type === "ready" ||
            type === "listening" ||
            type === "wake_detected" ||
            type === "stopped" ||
            type === "error"
        ) {
            return message as WakeWorkerMessage;
        }
    } catch {
        return null;
    }
    return null;
}

async function handleWakeDetected() {
    if (wakeDetectionLatched) return;

    wakeDetectionLatched = true;
    wakePausedForVoice = true;
    setWakeStatus({
        enabled: wakeEnabled,
        state: "detected",
        microphoneActive: false,
        message: "Wake detected",
    });

    await stopWakeWorker();
    focusHomeWindow();

    if (!wakeEnabled) {
        wakePausedForVoice = false;
        setWakeStatus({
            enabled: false,
            state: "off",
            microphoneActive: false,
            message: "Wake Word OFF",
        });
        return;
    }

    setWakeStatus({
        enabled: true,
        state: "handoff",
        microphoneActive: false,
        message: "I'm listening...",
        handoffId: randomUUID(),
    });
}

function handleWakeWorkerMessage(message: WakeWorkerMessage) {
    if (message.type === "ready") {
        setWakeStatus({
            enabled: wakeEnabled,
            state: "starting",
            microphoneActive: false,
            message: "Wake Word ON",
        });
        return;
    }

    if (message.type === "listening") {
        if (wakeWorkerStartTimer) {
            clearTimeout(wakeWorkerStartTimer);
            wakeWorkerStartTimer = null;
        }
        setWakeStatus({
            enabled: wakeEnabled,
            state: "listening",
            microphoneActive: true,
            message: "Wake Word ON - Listening locally...",
        });
        return;
    }

    if (message.type === "wake_detected") {
        void handleWakeDetected();
        return;
    }

    if (message.type === "error") {
        const code = typeof message.code === "string" ? message.code : "worker_error";
        void stopWakeWorker();
        setWakeStatus({
            enabled: wakeEnabled,
            state: "error",
            microphoneActive: false,
            message: safeWakeErrorMessage(code),
        });
    }
}

async function startWakeListening() {
    if (!wakeEnabled || wakePausedForVoice || wakeWorker) return true;

    const launch = getWakeWorkerLaunch();
    if (!launch) {
        setWakeStatus({
            enabled: wakeEnabled,
            state: "error",
            microphoneActive: false,
            message: safeWakeErrorMessage("worker_missing"),
        });
        return false;
    }

    wakeDetectionLatched = false;
    wakeLineBuffer = "";
    setWakeStatus({
        enabled: true,
        state: "starting",
        microphoneActive: false,
        message: "Wake Word ON",
    });

    try {
        wakeWorker = spawn(launch.command, launch.args, {
            cwd: getWakeRoot(),
            env: { ...process.env, PYTHONUTF8: "1" },
            shell: false,
            windowsHide: true,
        });
    } catch {
        wakeWorker = null;
        setWakeStatus({
            enabled: wakeEnabled,
            state: "error",
            microphoneActive: false,
            message: safeWakeErrorMessage("python_unavailable"),
        });
        return false;
    }

    const worker = wakeWorker;

    wakeWorkerStartTimer = setTimeout(() => {
        if (wakeWorker !== worker) return;
        void stopWakeWorker();
        setWakeStatus({
            enabled: wakeEnabled,
            state: "error",
            microphoneActive: false,
            message: safeWakeErrorMessage("startup_timeout"),
        });
    }, WAKE_WORKER_START_TIMEOUT_MS);

    worker.stdout.on("data", (chunk: Buffer) => {
        wakeLineBuffer += chunk.toString("utf8");
        const lines = wakeLineBuffer.split(/\r?\n/u);
        wakeLineBuffer = lines.pop() ?? "";
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const message = parseWakeWorkerLine(trimmed);
            if (message) handleWakeWorkerMessage(message);
        }
    });

    worker.stderr.on("data", () => {
        // Vosk writes native diagnostics to stderr in some environments. Keep it out of the UI.
    });

    worker.on("error", () => {
        if (wakeWorkerStartTimer) {
            clearTimeout(wakeWorkerStartTimer);
            wakeWorkerStartTimer = null;
        }
        if (wakeWorker === worker) wakeWorker = null;
        setWakeStatus({
            enabled: wakeEnabled,
            state: "error",
            microphoneActive: false,
            message: safeWakeErrorMessage("python_unavailable"),
        });
    });

    worker.on("exit", () => {
        if (wakeWorkerStartTimer) {
            clearTimeout(wakeWorkerStartTimer);
            wakeWorkerStartTimer = null;
        }
        if (wakeWorker === worker) wakeWorker = null;
        wakeLineBuffer = "";
        if (!wakeWorkerStopping && wakeEnabled && !wakeDetectionLatched && !wakePausedForVoice) {
            setWakeStatus({
                enabled: wakeEnabled,
                state: "error",
                microphoneActive: false,
                message: safeWakeErrorMessage("worker_exited"),
            });
        }
    });

    return true;
}

async function pauseWakeForVoice() {
    if (!wakeEnabled && !wakeWorker) return;

    wakePausedForVoice = true;
    setWakeStatus({
        enabled: wakeEnabled,
        state: "paused",
        microphoneActive: false,
        message: "Paused while Voice Coach is active",
    });
    await stopWakeWorker();
}

async function completeWakeVoiceFlow() {
    if (!wakePausedForVoice) return;

    wakePausedForVoice = false;
    if (wakeEnabled) {
        await startWakeListening();
    } else {
        setWakeStatus({
            enabled: false,
            state: "off",
            microphoneActive: false,
            message: "Wake Word OFF",
        });
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
    homeWindow.webContents.once("did-finish-load", () => {
        if (homeWindow && !homeWindow.isDestroyed()) {
            homeWindow.webContents.send("wake:status", wakeStatus);
        }
    });
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
ipcMain.handle("wake:get-status", (event) => {
    if (!isHomeFrame(event)) return null;
    return wakeStatus;
});
ipcMain.handle("wake:enable", async (event) => {
    if (!isHomeFrame(event)) return null;
    wakeEnabled = true;
    wakePausedForVoice = false;
    await startWakeListening();
    return wakeStatus;
});
ipcMain.handle("wake:disable", async (event) => {
    if (!isHomeFrame(event)) return null;
    wakeEnabled = false;
    wakePausedForVoice = false;
    await stopWakeWorker();
    setWakeStatus({
        enabled: false,
        state: "off",
        microphoneActive: false,
        message: "Wake Word OFF",
    });
    return wakeStatus;
});
ipcMain.handle("voice:flow-complete", async (event) => {
    if (!isHomeFrame(event)) return false;
    await completeWakeVoiceFlow();
    return true;
});

app.whenReady().then(() => {
    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
        return permission === "media" &&
            webContents === homeWindow?.webContents &&
            requestingOrigin.startsWith("file://") &&
            microphoneAuthorizationExpiresAt > Date.now();
    });
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
        const isAudioRequest = permission === "media" &&
            "mediaTypes" in details &&
            details.mediaTypes?.includes("audio") === true &&
            details.mediaTypes.includes("video") === false &&
            "isMainFrame" in details &&
            details.isMainFrame &&
            webContents === homeWindow?.webContents &&
            microphoneAuthorizationExpiresAt > Date.now();

        callback(isAudioRequest);
    });

    ipcMain.handle("voice:request-microphone", async (event) => {
        if (!isHomeFrame(event)) return false;
        await pauseWakeForVoice();
        microphoneAuthorizationExpiresAt = Date.now() + MICROPHONE_AUTHORIZATION_MS;
        return true;
    });

    ipcMain.handle("voice:complete-microphone-request", (event) => {
        if (!isHomeFrame(event)) return false;
        microphoneAuthorizationExpiresAt = 0;
        return true;
    });

    ipcMain.handle("voice:transcribe", async (event, payload: unknown) => {
        if (!isHomeFrame(event)) {
            return { ok: false, error: "Voice transcription is available only from Agent Home." };
        }
        if (transcriptionInProgress) {
            return { ok: false, error: "A transcription is already in progress." };
        }

        const validated = validateAudioRequest(payload);
        if (!validated) {
            return { ok: false, error: "The recording could not be read. Please record again." };
        }

        transcriptionInProgress = true;
        const controller = new AbortController();
        activeTranscriptionAbortControllers.add(controller);
        const cancelForClosedRenderer = () => controller.abort();
        event.sender.once("destroyed", cancelForClosedRenderer);

        try {
            const apiKey = await resolveGroqApiKey();
            if (!apiKey) {
                return { ok: false, error: "Groq is not configured. Add GROQ_API_KEY to the desktop app configuration." };
            }
            const transcript = await transcribeWithGroq(
                validated.audio,
                validated.languageMode,
                apiKey,
                controller.signal,
            );
            return { ok: true, transcript };
        } catch (error) {
            if (controller.signal.aborted) {
                return { ok: false, error: "Transcription was canceled because Agent Home closed." };
            }
            return {
                ok: false,
                error: error instanceof Error
                    ? error.message
                    : "Could not transcribe the recording. Please try again.",
            };
        } finally {
            validated.audio.fill(0);
            activeTranscriptionAbortControllers.delete(controller);
            event.sender.removeListener("destroyed", cancelForClosedRenderer);
            transcriptionInProgress = false;
        }
    });

    ipcMain.handle("coach:send-transcript", (event, transcript: unknown) => {
        if (!isHomeFrame(event) || typeof transcript !== "string") return false;
        const cleanTranscript = transcript.trim();
        if (!cleanTranscript || cleanTranscript.length > MAX_TRANSCRIPT_LENGTH) return false;

        clipboard.writeText(cleanTranscript);
        openCoachWindow("/mindset");
        return true;
    });

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
    microphoneAuthorizationExpiresAt = 0;
    wakeEnabled = false;
    if (wakeWorker && !wakeWorker.killed) {
        wakeWorker.kill();
    }
    wakeWorker = null;
    for (const controller of activeTranscriptionAbortControllers) {
        controller.abort();
    }
    globalShortcut.unregisterAll();
});
