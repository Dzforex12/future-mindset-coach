import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");
const speechSource = readFileSync(path.join(repositoryRoot, "desktop/.build/renderer/local-speech.js"), "utf8");
const rendererSource = readFileSync(path.join(repositoryRoot, "desktop/.build/renderer/renderer.js"), "utf8");

function waitForSpeechDrain() {
    return new Promise((resolve) => setTimeout(resolve, 180));
}

function waitForTurn() {
    return new Promise((resolve) => setImmediate(resolve));
}

function createHarness(voices = [
    { localService: true, lang: "en-US", default: true },
    { localService: true, lang: "it-IT" },
    { localService: true, lang: "sq-AL" },
]) {
    const elements = new Map();
    const element = (selector) => {
        if (!elements.has(selector)) {
            elements.set(selector, {
                hidden: selector !== "#transcript-panel",
                disabled: false,
                value: selector === "#voice-language" ? "en" : "",
                dataset: {},
                textContent: "",
                listeners: new Map(),
                addEventListener(name, handler) { this.listeners.set(name, handler); },
                focus() {},
            });
        }
        return elements.get(selector);
    };

    const synth = {
        speaking: false,
        pending: false,
        utterance: null,
        requests: [],
        cancelCount: 0,
        getVoices: () => voices,
        addEventListener() {},
        removeEventListener() {},
        cancel() {
            this.cancelCount++;
            this.speaking = false;
            this.pending = false;
        },
        speak(utterance) {
            this.utterance = utterance;
            this.requests.push(utterance);
            this.speaking = true;
        },
    };

    let askResolve;
    let activeAskPromise;
    let askCalls = 0;
    let completeCalls = 0;
    let runCalls = 0;
    let enableCalls = 0;
    let wakeEnabled = true;
    const context = {
        document: { querySelector: element },
        navigator: {},
        window: {
            setTimeout,
            clearTimeout,
            addEventListener() {},
            speechSynthesis: synth,
            coachDesktop: {
                onWakeStatus() { return () => {}; },
                async getWakeStatus() {
                    return { enabled: wakeEnabled, state: wakeEnabled ? "paused" : "off", microphoneActive: false, message: "Paused" };
                },
                async prepareCommand() { return null; },
                async cancelCommand() { return true; },
                async completeVoiceFlow() { completeCalls++; return true; },
                async askCoach() {
                    askCalls++;
                    return new Promise((resolve) => { askResolve = resolve; });
                },
                async runCommand() { runCalls++; return null; },
                async openCoach() {},
                async enableWake() { enableCalls++; wakeEnabled = true; return { enabled: true, state: "listening", microphoneActive: true, message: "Listening" }; },
                async disableWake() { wakeEnabled = false; return { enabled: false, state: "off", microphoneActive: false, message: "Wake Word OFF" }; },
                async requestMicrophone() { return false; },
                async completeMicrophoneRequest() { return true; },
                async transcribeAudio() { return { ok: false, error: "not used" }; },
                async sendTranscriptToCoach() { return false; },
                async completeSpeech() { return true; },
            },
        },
        SpeechSynthesisUtterance: class {
            constructor(text) { this.text = text; }
        },
        DOMException,
    };
    vm.createContext(context);
    vm.runInContext(speechSource, context);
    vm.runInContext(`${rendererSource}\nglobalThis.voiceTest = { reviewCommand };`, context);

    return {
        context,
        synth,
        element,
        get askCalls() { return askCalls; },
        get completeCalls() { return completeCalls; },
        get runCalls() { return runCalls; },
        get enableCalls() { return enableCalls; },
        resolveAsk(result) { askResolve(result); },
        get askPromise() { return activeAskPromise; },
        async beginAsk(response) {
            const transcript = element("#transcript");
            transcript.value = "What should I focus on today?";
            await context.voiceTest.reviewCommand();
            activeAskPromise = element("#ask-coach").listeners.get("click")();
            this.resolveAsk({ ok: true, response });
            await waitForTurn();
        },
        setWakeEnabled(value) { wakeEnabled = value; },
    };
}

test("Coach response is displayed, cleaned, spoken, and resumes wake after speech", async () => {
    const harness = createHarness();
    await harness.beginAsk("# Focus\n\n- **Plan** the next step.\n- Use `one clear action` &amp; keep going.");
    const askPromise = harness.askPromise;

    assert.equal(harness.askCalls, 1);
    assert.equal(harness.element("#coach-response").textContent, "# Focus\n\n- **Plan** the next step.\n- Use `one clear action` &amp; keep going.");
    assert.equal(harness.synth.utterance.text, "Focus. Plan the next step. Use one clear action & keep going.");
    assert.equal(harness.element("#stop-speaking").hidden, false);
    assert.equal(harness.completeCalls, 0, "wake stays paused while speech is active");
    assert.equal(harness.runCalls, 0, "AI response text never enters the command path");

    harness.synth.speaking = false;
    harness.synth.utterance.onend();
    await askPromise;
    assert.equal(harness.completeCalls, 1, "wake resumes after speech completion");
    assert.equal(harness.element("#stop-speaking").hidden, true);
    assert.equal(harness.element("#coach-response-panel").hidden, false);
});

test("speech failure keeps the full response visible and resumes wake safely", async () => {
    const harness = createHarness();
    await harness.beginAsk("A response that remains visible if local speech fails.");
    const askPromise = harness.askPromise;
    harness.synth.utterance.onerror(new Error("speech failure"));
    await askPromise;
    assert.equal(harness.element("#coach-response-panel").hidden, false);
    assert.equal(harness.element("#coach-response").textContent, "A response that remains visible if local speech fails.");
    assert.equal(harness.completeCalls, 1);
});

test("Stop Speaking cancels speech, keeps the answer, and resumes wake once", async () => {
    const harness = createHarness();
    await harness.beginAsk("Open trading is information only.");
    const askPromise = harness.askPromise;
    const stopPromise = harness.element("#stop-speaking").listeners.get("click")();
    await Promise.all([askPromise, stopPromise]);
    await waitForSpeechDrain();
    assert.equal(harness.element("#coach-response-panel").hidden, false);
    assert.equal(harness.element("#coach-response").textContent, "Open trading is information only.");
    assert.equal(harness.completeCalls, 1);
    assert.equal(harness.runCalls, 0);
    assert.ok(harness.synth.cancelCount > 0);
});

test("Close during speech cancels the answer and resumes wake once", async () => {
    const harness = createHarness();
    await harness.beginAsk("Close this answer while it is speaking.");
    const askPromise = harness.askPromise;
    const closePromise = harness.element("#close-coach-response").listeners.get("click")();
    await Promise.all([askPromise, closePromise]);
    await waitForSpeechDrain();
    assert.equal(harness.element("#coach-response-panel").hidden, true);
    assert.equal(harness.completeCalls, 1);
});

test("Wake OFF during speech never restarts wake", async () => {
    const harness = createHarness();
    await harness.beginAsk("Wake should remain off after this answer.");
    const askPromise = harness.askPromise;
    await harness.element("#disable-wake").listeners.get("click")();
    harness.synth.speaking = false;
    harness.synth.utterance.onend();
    await askPromise;
    assert.equal(harness.enableCalls, 0);
    assert.equal(harness.completeCalls, 1);
});

test("long Coach responses are bounded without cutting a word and keep the fixed suffix", () => {
    const context = {};
    vm.createContext(context);
    vm.runInContext(speechSource + "\nglobalThis.bound = boundCoachSpeechText;", context);
    const bounded = context.bound("A complete sentence. ".repeat(100));
    assert.ok(bounded.length <= 900);
    assert.match(bounded, /I've put the full answer on screen\.$/);
    assert.doesNotMatch(bounded, /\s\./);
});

test("selected language prefers a matching local voice", async () => {
    const harness = createHarness();
    const speechContext = { setTimeout, clearTimeout };
    vm.createContext(speechContext);
    vm.runInContext(speechSource + `
        globalThis.createLanguageSpeech = (synth) => {
            globalThis.window = { speechSynthesis: synth, setTimeout, clearTimeout };
            globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
            return new LocalVoiceResponses(() => {});
    };`, speechContext);
    const directSynth = harness.synth;
    const direct = speechContext.createLanguageSpeech(directSynth);
    const speech = direct.speakText("Ciao", "it");
    assert.equal(directSynth.utterance.voice.lang, "it-IT");
    directSynth.speaking = false;
    directSynth.utterance.onend();
    await speech;
});
