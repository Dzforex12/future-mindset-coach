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

function harness() {
    const workers = [];
    const app = Object.assign(new EventEmitter(), {
        requestSingleInstanceLock: () => true,
        whenReady: () => ({ then() {} }),
        isReady: () => true,
        quit() {},
    });
    const electron = {
        app, ipcMain: { handle() {} }, Menu: { buildFromTemplate: (items) => items },
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
            return require(name);
        },
        exports: {}, __dirname: path.resolve(__dirname, "../.build"), process,
        Buffer, URL, AbortController, setTimeout, clearTimeout,
    };
    vm.createContext(context);
    vm.runInContext(readFileSync(path.resolve(__dirname, "../.build/main.js"), "utf8") + `
        globalThis.api = {
            setWakeEnabled, pauseWakeForVoice, completeWakeVoiceFlow, stopWakeWorker,
            handleWakeDetected, focusHomeWindow,
            status: () => wakeStatus,
            state: () => ({ wakeEnabled, wakePausedForVoice, wakeDetectionLatched, workerRunning: !!wakeWorker }),
            setHome: (home) => { homeWindow = home; },
            suspend: () => { suspended = true; wakeGeneration++; },
        };
    `, context);
    function close(worker) { worker.emit("exit", 0); worker.emit("close", 0); }
    return { api: context.api, workers, close };
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
        window: {
            setTimeout, clearTimeout, addEventListener() {},
            coachDesktop: {
                onWakeStatus(fn) { wakeListener = fn; return () => {}; },
                async getWakeStatus() { return api.status(); },
                async requestMicrophone() { await api.pauseWakeForVoice(); return true; },
                async completeMicrophoneRequest() { return true; },
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
    } finally {
        const stop = api.setWakeEnabled(false);
        close(workers.at(-1));
        await stop;
    }
});
