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
import { randomUUID } from "node:crypto";
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
const activeTranscriptionAbortControllers = new Set<AbortController>();

type LanguageMode = "en" | "it" | "sq-standard" | "sq-kosovo";

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

    ipcMain.handle("voice:request-microphone", (event) => {
        if (!isHomeFrame(event)) return false;
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
    for (const controller of activeTranscriptionAbortControllers) {
        controller.abort();
    }
    globalShortcut.unregisterAll();
});
