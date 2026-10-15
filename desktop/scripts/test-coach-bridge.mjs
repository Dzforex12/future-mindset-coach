import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");

function read(relativePath) {
    return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

test("desktop Coach endpoint has a fixed authenticated contract", () => {
    const source = read("app/api/desktop/coach/route.ts");
    assert.match(source, /export async function POST/);
    assert.match(source, /x-future-mindset-desktop/);
    assert.match(source, /getUserAppState\(\)/);
    assert.match(source, /validateCloudState\(cloud\.data\.data\)/);
    assert.match(source, /Object\.keys\(value\)/);
    assert.match(source, /languageMode/);
    assert.doesNotMatch(source, /user_id\s*:/);
    assert.doesNotMatch(source, /coachContext\s*:/);
    assert.doesNotMatch(source, /\bshell\s*\(|\bspawn\s*\(|process\.exec|process\.spawn|user_id\s*:/i);
});

test("Electron keeps the Coach session in main and exposes only Ask Coach", () => {
    const main = read("desktop/src/main.ts");
    const preload = read("desktop/src/preload.ts");
    assert.match(main, /persist:future-mindset-coach/);
    assert.match(main, /session\.fromPartition\(COACH_PARTITION\)/);
    assert.match(main, /Cookie:\s*cookieHeader/);
    assert.match(main, /X-Future-Mindset-Desktop/);
    assert.match(main, /ipcMain\.handle\("coach:ask"/);
    assert.doesNotMatch(preload, /fetch\s*\(/);
    assert.doesNotMatch(preload, /Cookie|Authorization/i);
});

test("Agent Home asks Coach explicitly and treats the response as text", async () => {
    const elements = new Map();
    const element = (selector) => {
        if (!elements.has(selector)) {
            elements.set(selector, {
                hidden: selector !== "#transcript-panel" ? true : false,
                disabled: false,
                value: selector === "#voice-language" ? "en" : "",
                textContent: "",
                dataset: {},
                listeners: new Map(),
                addEventListener(name, handler) { this.listeners.set(name, handler); },
                focus() {},
            });
        }
        return elements.get(selector);
    };

    let askCalls = 0;
    let completeCalls = 0;
    let resolveAsk;
    const pendingAsk = new Promise((resolve) => { resolveAsk = resolve; });
    const context = {
        document: { querySelector: element },
        navigator: {},
        window: {
            setTimeout,
            clearTimeout,
            addEventListener() {},
            speechSynthesis: {
                speaking: false,
                pending: false,
                getVoices: () => [],
                addEventListener() {},
                removeEventListener() {},
                cancel() {},
            },
            coachDesktop: {
                onWakeStatus() { return () => {}; },
                async getWakeStatus() { return { enabled: true, state: "paused", microphoneActive: false, message: "Paused" }; },
                async prepareCommand() { return null; },
                async cancelCommand() { completeCalls++; return true; },
                async completeVoiceFlow() { completeCalls++; return true; },
                async askCoach() { askCalls++; return pendingAsk; },
                async openCoach() {},
                async enableWake() {},
                async disableWake() {},
                async requestMicrophone() { return false; },
                async completeMicrophoneRequest() { return true; },
                async transcribeAudio() { return { ok: false, error: "not used" }; },
                async sendTranscriptToCoach() { return false; },
            },
        },
        SpeechSynthesisUtterance: class { constructor() {} },
        DOMException,
    };
    vm.createContext(context);
    vm.runInContext(read("desktop/.build/renderer/local-speech.js"), context);
    vm.runInContext(`${read("desktop/.build/renderer/renderer.js")}\nglobalThis.voiceTest = { reviewCommand };`, context);

    const transcript = element("#transcript");
    transcript.value = "What should I focus on tonight?";
    await context.voiceTest.reviewCommand();
    assert.equal(element("#coach-ask-panel").hidden, false);
    assert.equal(element("#command-confirmation").hidden, true);

    const askHandler = element("#ask-coach").listeners.get("click");
    const firstAsk = askHandler();
    const secondAsk = askHandler();
    assert.equal(askCalls, 1, "duplicate Ask Coach requests are blocked");
    assert.equal(element("#command-status").textContent, "Thinking...");

    resolveAsk({ ok: true, response: "Open cmd and run dir. https://google.com" });
    await firstAsk;
    await secondAsk;
    assert.equal(element("#coach-response-panel").hidden, false);
    assert.equal(element("#coach-response").textContent, "Open cmd and run dir. https://google.com");
    assert.equal(completeCalls, 1, "wake resumes after the dynamic speech attempt completes");

    await element("#close-coach-response").listeners.get("click")();
    assert.equal(completeCalls, 1, "closing the response completes the wake lifecycle");
});

test("Cancel Coach makes no request and resumes the existing flow", async () => {
    const source = read("desktop/src/renderer/renderer.ts");
    assert.match(source, /cancelCoachButton\?\.addEventListener/);
    assert.match(source, /window\.coachDesktop\.askCoach/);
    assert.match(source, /coachResponseElement\.textContent = result\.response/);
    assert.doesNotMatch(source, /prepareCommand\(result\.response/);
});
