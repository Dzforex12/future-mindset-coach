import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { recognizeSafeCommand } = require("../.build/safe-commands.js");

test("only whole approved phrases map to fixed internal destinations", () => {
    for (const destination of ["dashboard", "today", "mindset", "goals", "habits", "trading", "summary", "business", "projects", "finances"]) {
        for (const prefix of ["open", "open my", "show", "show my"]) {
            assert.equal(recognizeSafeCommand(`  ${prefix.toUpperCase()}   ${destination}! `)?.route, `/${destination}`);
        }
    }
    for (const text of ["Buy me a car", "Open cmd and run dir", "Open google.com", "Open https://google.com", "/business", "Open settings", "Open business then trading", "Open __proto__", "Open constructor", "Open business/../settings", null, {}, "x".repeat(5001)]) {
        assert.equal(recognizeSafeCommand(text), null);
    }
});

function harness() {
    const workers = [];
    const handlers = new Map();
    const app = Object.assign(new EventEmitter(), {
        requestSingleInstanceLock: () => true,
        whenReady: () => ({ then() {} }),
        isReady: () => true,
        quit() {},
    });
    const electron = {
        app, ipcMain: { handle(name, handler) { handlers.set(name, handler); } }, Menu: { buildFromTemplate: (items) => items },
    };
    const context = {
        require(name) {
            if (name === "electron") return electron;
            if (name === "node:fs") return { existsSync: () => true };
            if (name === "node:child_process") return { spawn() {
                const worker = new EventEmitter();
                worker.stdout = new EventEmitter();
                worker.stderr = new EventEmitter();
                worker.stdin = Object.assign(new EventEmitter(), { write() {} });
                worker.kill = () => { worker.killed = true; };
                workers.push(worker);
                return worker;
            } };
            return createRequire(path.resolve(__dirname, "../.build/main.js"))(name);
        },
        exports: {}, __dirname: path.resolve(__dirname, "../.build"), process,
        Buffer, URL, AbortController, setTimeout, clearTimeout,
    };
    vm.createContext(context);
    vm.runInContext(readFileSync(path.resolve(__dirname, "../.build/main.js"), "utf8") + `
        globalThis.api = {
            setWakeEnabled, pauseWakeForVoice, completeWakeVoiceFlow, stopWakeWorker,
            handleWakeDetected, focusHomeWindow,
            prepareSafeCommand, runSafeCommand, cancelSafeCommand, completeSpeech,
            status: () => wakeStatus,
            state: () => ({ wakeEnabled, wakePausedForVoice, wakeDetectionLatched, workerRunning: !!wakeWorker, pendingSpeech, quitting }),
            setHome: (home) => { homeWindow = home; },
            suspend: () => { suspended = true; wakeGeneration++; },
        };
        globalThis.routes = [];
        openCoachWindow = (route) => { globalThis.routes.push(route); };
    `, context);
    function close(worker) { worker.emit("exit", 0); worker.emit("close", 0); }
    return { api: context.api, workers, close, routes: context.routes, handlers, app };
}

test("rapid off/on waits for confirmed worker close and ignores stale wake", async () => {
    const { api, workers, close } = harness();
    await api.setWakeEnabled(true);
    const off = api.setWakeEnabled(false);
    const on = api.setWakeEnabled(true);
    workers[0].stdout.emit("data", Buffer.from('{"type":"wake_detected"}\n'));
    assert.equal(workers.length, 1);
    close(workers[0]);
    await Promise.all([off, on]);
    assert.equal(workers.length, 2);
    assert.equal(api.status().enabled, true);
    const stop = api.setWakeEnabled(false);
    close(workers[1]);
    await stop;
});

test("tray enabling during manual voice flow cannot capture the microphone", async () => {
    const { api, workers, close } = harness();
    await api.pauseWakeForVoice();
    await api.setWakeEnabled(true);
    assert.equal(workers.length, 0);
    await api.setWakeEnabled(false);
    await api.setWakeEnabled(true);
    assert.equal(workers.length, 0);
    await api.completeWakeVoiceFlow();
    assert.equal(workers.length, 1);
    const stop = api.setWakeEnabled(false);
    close(workers[0]);
    await stop;
});

test("duplicate detections produce one handoff only after worker closes", async () => {
    const { api, workers, close } = harness();
    const events = [];
    api.setHome({ isDestroyed: () => false, isMinimized: () => true,
        restore: () => events.push("restore"), show: () => events.push("show"),
        focus: () => events.push("focus"), webContents: { send: (_channel, status) => events.push(status.state) } });
    await api.setWakeEnabled(true);
    const first = api.handleWakeDetected();
    await api.handleWakeDetected();
    assert.equal(events.includes("handoff"), false);
    close(workers[0]);
    await first;
    assert.equal(events.filter((item) => item === "handoff").length, 1);
    assert.deepEqual(events.slice(-4), ["restore", "show", "focus", "handoff"]);
});

test("sleep during detection cancels handoff and suppresses new workers", async () => {
    const { api, workers, close } = harness();
    await api.setWakeEnabled(true);
    const detection = api.handleWakeDetected();
    api.suspend();
    close(workers[0]);
    await detection;
    await api.setWakeEnabled(true);
    assert.equal(api.status().state, "paused");
    assert.equal(workers.length, 1);
});

test("off/on during detected wake cancels old handoff and restarts listening", async () => {
    const { api, workers, close } = harness();
    await api.setWakeEnabled(true);
    const detection = api.handleWakeDetected();
    const off = api.setWakeEnabled(false);
    await api.setWakeEnabled(true);
    close(workers[0]);
    await Promise.all([detection, off]);
    assert.equal(workers.length, 2);
    assert.equal(api.status().state, "starting");
    const stop = api.setWakeEnabled(false);
    close(workers[1]);
    await stop;
});

test("five consecutive wake/record/complete cycles resume; pending audio alone does not complete", async () => {
    const { api, workers, close } = harness();
    const elements = new Map();
    const element = (selector) => {
        if (!elements.has(selector)) elements.set(selector, {
            hidden: true, disabled: false, value: "", textContent: "", dataset: {},
            listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; }, focus() {},
        });
        return elements.get(selector);
    };
    let wakeListener;
    let activeTracks = 0;
    let starts = 0;
    let uploads = 0;
    const lifecycleListeners = new Map();
    const synth = {
        speaking: false, pending: false, utterance: null,
        getVoices: () => [{ localService: true, lang: "en-US", default: true }],
        addEventListener() {}, removeEventListener() {},
        cancel() { this.speaking = false; },
        speak(utterance) {
            assert.equal(activeTracks, 0, "TTS cannot overlap command microphone");
            assert.equal(api.state().workerRunning, false, "TTS cannot overlap wake worker");
            this.utterance = utterance;
            this.speaking = true;
        },
    };
    class Recorder {
        static isTypeSupported() { return true; }
        constructor() { this.state = "inactive"; this.mimeType = "audio/webm"; }
        start() { this.state = "recording"; starts++; }
        stop() {
            this.state = "inactive";
            queueMicrotask(() => {
                this.ondataavailable({ data: new Blob(["synthetic test data"]) });
                this.onstop();
            });
        }
    }
    const context = {
        document: { querySelector: element },
        navigator: { mediaDevices: { async getUserMedia() {
            assert.equal(api.state().workerRunning, false, "wake mic released before command capture");
            activeTracks++;
            let stopped = false;
            return { getTracks: () => [{ stop() { if (!stopped) activeTracks--; stopped = true; } }] };
        } } },
        MediaRecorder: Recorder, Blob, Uint8Array, DOMException,
        SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
        window: {
            setTimeout, clearTimeout, speechSynthesis: synth,
            addEventListener(name, fn) { lifecycleListeners.set(name, fn); },
            coachDesktop: {
                onWakeStatus(fn) { wakeListener = fn; return () => {}; },
                async getWakeStatus() { return api.status(); },
                async requestMicrophone() { await api.pauseWakeForVoice(); return true; },
                async completeMicrophoneRequest() { return true; },
                prepareCommand: api.prepareSafeCommand,
                cancelCommand: api.cancelSafeCommand,
                runCommand: api.runSafeCommand,
                completeSpeech: api.completeSpeech,
                async completeVoiceFlow() {
                    assert.equal(activeTracks, 0, "command tracks released before wake resumes");
                    await api.completeWakeVoiceFlow();
                    return true;
                },
                async transcribeAudio() { uploads++; return { ok: true, transcript: "Synthetic test result" }; },
            },
        },
    };
    vm.createContext(context);
    vm.runInContext(readFileSync(path.resolve(__dirname, "../.build/renderer/local-speech.js"), "utf8"), context);
    vm.runInContext(readFileSync(path.resolve(__dirname, "../.build/renderer/renderer.js"), "utf8") + `
        globalThis.voice = { finishRecording, transcribeRecording,
            state: () => ({ isListening, pendingRecording: !!pendingRecording }) };
    `, context);
    api.setHome({ isDestroyed: () => false, isMinimized: () => true,
        restore() {}, show() {}, focus() {}, webContents: { send: (_channel, status) => wakeListener(status) } });
    const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(setImmediate); };
    await api.setWakeEnabled(true);
    try {
        for (let cycle = 0; cycle < 5; cycle++) {
            const worker = workers[cycle];
            worker.stdout.emit("data", Buffer.from('{"type":"listening"}\n'));
            assert.equal(api.status().state, "listening");
            assert.equal(api.state().wakeDetectionLatched, false);
            const detection = api.handleWakeDetected();
            await api.handleWakeDetected();
            close(worker);
            await detection;
            await flush();
            assert.equal(synth.utterance.text, "I'm listening.");
            assert.equal(starts, cycle, "recording cannot start while wake acknowledgement speaks");
            assert.equal(context.voice.state().isListening, false);
            synth.speaking = false;
            if (cycle === 0) synth.utterance.onerror();
            else synth.utterance.onend();
            await new Promise((resolve) => setTimeout(resolve, 175));
            await flush();
            assert.equal(starts, cycle + 1, "one recording per wake, including second wake");
            assert.equal(context.voice.state().isListening, true);
            context.voice.finishRecording();
            await flush();
            assert.equal(activeTracks, 0);
            assert.equal(context.voice.state().pendingRecording, true);
            assert.equal(api.state().wakePausedForVoice, true);
            assert.equal(api.state().workerRunning, false);
            const before = uploads;
            if (cycle % 2 === 0) await element("#delete-audio").listeners.click();
            else await context.voice.transcribeRecording();
            await flush();
            assert.equal(uploads, before + (cycle % 2), "upload only on explicit Transcribe");
            assert.equal(workers.length, cycle + 2, "worker restarts after completion");
            assert.equal(api.state().wakePausedForVoice, false);
            assert.equal(api.state().wakeDetectionLatched, false);
            assert.equal(api.state().wakeEnabled, true);
        }
        const finalWake = api.handleWakeDetected();
        close(workers.at(-1));
        await finalWake;
        await flush();
        assert.equal(synth.speaking, true);
        lifecycleListeners.get("beforeunload")();
        await new Promise((resolve) => setTimeout(resolve, 175));
        assert.equal(synth.speaking, false, "unload cancels active speech");
        assert.equal(starts, 5, "quit cannot start recording after cancelled acknowledgement");
    } finally {
        const stop = api.setWakeEnabled(false);
        close(workers.at(-1));
        await stop;
    }
});

test("five wake-command cycles require one-use approval and keep wake paused until Run", async () => {
    const { api, workers, close, routes } = harness();
    api.setHome({ isDestroyed: () => false, isMinimized: () => false,
        show() {}, focus() {}, webContents: { send() {} } });
    await api.setWakeEnabled(true);
    const phrases = ["Open my business", "Open trading", "Show my projects", "Open today", "Open goals"];
    for (let cycle = 0; cycle < phrases.length; cycle++) {
        workers[cycle].stdout.emit("data", Buffer.from('{"type":"listening"}\n'));
        const detected = api.handleWakeDetected();
        close(workers[cycle]);
        await detected;
        await api.completeSpeech(api.status().handoffId);
        await api.pauseWakeForVoice();
        const preview = await api.prepareSafeCommand(phrases[cycle]);
        assert.equal(typeof preview.token, "string");
        assert.equal(preview.route, undefined, "renderer never receives a route");
        await api.completeWakeVoiceFlow();
        assert.equal(api.state().wakePausedForVoice, true);
        assert.equal(api.state().workerRunning, false);
        assert.equal(routes.length, cycle, "preview cannot navigate");
        assert.equal(await api.runSafeCommand("/business"), null);
        const response = await api.runSafeCommand(preview.token);
        assert.equal(typeof response.speechId, "string");
        assert.equal(await api.runSafeCommand(preview.token), null, "duplicate confirmation rejected");
        assert.equal(routes.length, cycle + 1);
        assert.equal(routes[cycle], recognizeSafeCommand(phrases[cycle]).route);
        assert.equal(response.response, recognizeSafeCommand(phrases[cycle]).response);
        await api.completeWakeVoiceFlow();
        assert.equal(api.state().workerRunning, false, "wake cannot resume before speech ends");
        assert.equal(await api.completeSpeech("wrong-id"), false);
        await api.completeSpeech(response.speechId);
        assert.equal(api.state().wakePausedForVoice, false);
        assert.equal(api.state().wakeDetectionLatched, false);
        assert.equal(workers.length, cycle + 2);
    }
    const stop = api.setWakeEnabled(false);
    close(workers.at(-1));
    await stop;
});

test("Cancel, edits, unknown commands and foreign IPC cannot navigate", async () => {
    const { api, routes, handlers } = harness();
    const first = await api.prepareSafeCommand("Open dashboard");
    const second = await api.prepareSafeCommand("Open business");
    assert.equal(await api.runSafeCommand(first.token), null);
    await api.cancelSafeCommand();
    assert.equal(await api.runSafeCommand(second.token), null);
    for (const text of ["Buy me a car", "Open cmd and run dir", "Open google.com"]) {
        assert.equal(await api.prepareSafeCommand(text), null);
    }
    assert.equal(handlers.has("coach:open-route"), false);
    assert.equal(await handlers.get("command:prepare")({}, "Open business"), null);
    assert.equal(await handlers.get("command:run")({}, second.token), null);
    assert.equal(await handlers.get("command:cancel")({}), false);
    assert.equal(routes.length, 0);
    assert.equal(api.state().pendingSpeech, null, "Cancel never requests speech");
    assert.equal(await handlers.get("voice:speech-complete")({}, "fake"), false);
});

test("Wake OFF during acknowledgement or command speech never restarts wake", async () => {
    const { api, workers, close } = harness();
    api.setHome({ isDestroyed: () => false, isMinimized: () => false,
        show() {}, focus() {}, webContents: { send() {} } });
    await api.setWakeEnabled(true);
    const detected = api.handleWakeDetected();
    close(workers[0]);
    await detected;
    const acknowledgement = api.state().pendingSpeech.id;
    await api.setWakeEnabled(false);
    assert.equal(await api.completeSpeech(acknowledgement), false);
    assert.equal(api.state().workerRunning, false);
    const command = await api.prepareSafeCommand("Open business");
    const response = await api.runSafeCommand(command.token);
    await api.setWakeEnabled(true);
    assert.equal(workers.length, 1, "enabling during speech must not launch a worker");
    await api.setWakeEnabled(false);
    await api.completeSpeech(response.speechId);
    assert.equal(workers.length, 1);
    assert.equal(api.status().state, "off");
});

test("Quit during speech closes renderer before clearing the speech hold", async () => {
    const { api, workers, app } = harness();
    const home = Object.assign(new EventEmitter(), {
        isDestroyed: () => false, webContents: { send() {} },
        close() { this.emit("closed"); },
        destroy() { assert.fail("normal close should deliver renderer cleanup"); },
    });
    api.setHome(home);
    const command = await api.prepareSafeCommand("Open business");
    await api.runSafeCommand(command.token);
    assert.notEqual(api.state().pendingSpeech, null);
    app.emit("before-quit", { preventDefault() {} });
    await new Promise(setImmediate);
    assert.equal(api.state().quitting, true);
    assert.equal(api.state().pendingSpeech, null);
    assert.equal(api.state().workerRunning, false);
    assert.equal(workers.length, 0);
});
