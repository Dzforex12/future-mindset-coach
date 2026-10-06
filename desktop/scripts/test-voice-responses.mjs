import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../.build/renderer/local-speech.js", import.meta.url), "utf8");
function harness(voices = [{ localService: true, lang: "en-US", default: true }]) {
    const messages = [];
    const listeners = new Map();
    const synth = {
        speaking: false, pending: false, utterance: null, requests: [],
        getVoices: () => voices,
        addEventListener(name, fn) { listeners.set(name, fn); },
        removeEventListener(name) { listeners.delete(name); },
        cancel() { this.speaking = false; this.pending = false; },
        speak(utterance) { this.utterance = utterance; this.requests.push(utterance); this.speaking = true; },
    };
    const context = {
        window: { speechSynthesis: synth, clearTimeout,
            setTimeout: (fn, ms) => setTimeout(fn, ms >= 1000 ? 30 : 1) },
        SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    };
    vm.createContext(context);
    vm.runInContext(source + "\nglobalThis.create = (changed) => new LocalVoiceResponses(changed);", context);
    const controller = context.create((state, message) => messages.push({ state, message }));
    return { controller, synth, messages, listeners };
}

test("fixed responses only; local English preferred without a fixed voice name", async () => {
    const voices = [{ localService: false, lang: "en-US", default: true },
        { localService: true, lang: "it-IT" }, { localService: true, lang: "en-GB" }];
    const { controller, synth } = harness(voices);
    const expected = { wake: "I'm listening.", dashboard: "Opening your dashboard.",
        today: "Opening today.", mindset: "Opening your mindset.", goals: "Opening your goals.",
        habits: "Opening your habits.", trading: "Opening trading.", summary: "Opening your summary.",
        business: "Opening your business.", projects: "Opening your projects.", finances: "Opening your finances." };
    for (const [key, text] of Object.entries(expected)) {
        const result = controller.speak(key);
        assert.equal(synth.utterance.text, text);
        assert.equal(synth.utterance.voice, voices[2]);
        assert.equal(synth.utterance.rate, 1);
        assert.equal(synth.utterance.pitch, 1);
        assert.equal(synth.utterance.volume, 1);
        synth.speaking = false;
        synth.utterance.onend();
        assert.equal(await result, true);
        assert.equal(controller.state, "idle");
    }
    assert.equal(await controller.speak("arbitrary transcript"), false);
    assert.equal(synth.requests.length, 11);
});

test("local fallback and delayed voices remain offline", async () => {
    const voices = [];
    const { controller, synth, listeners } = harness(voices);
    const result = controller.speak("wake");
    assert.equal(synth.requests.length, 0);
    voices.push({ localService: true, lang: "it-IT", default: true });
    listeners.get("voiceschanged")();
    assert.equal(synth.utterance.voice, voices[0]);
    synth.utterance.onend();
    assert.equal(await result, true);
});

test("remote-only voices are never used and failure releases the flow", async () => {
    const { controller, synth } = harness([{ localService: false, lang: "en-US", default: true }]);
    assert.equal(await controller.speak("wake"), true);
    assert.equal(controller.state, "failed");
    assert.equal(synth.requests.length, 0);
});

test("error and missing end event cancel speech and settle safely", async () => {
    const { controller, synth } = harness();
    const error = controller.speak("wake");
    synth.utterance.onerror();
    assert.equal(await error, true);
    assert.equal(synth.speaking, false);
    assert.equal(controller.state, "failed");
    assert.equal(await controller.speak("business"), true);
    assert.equal(synth.speaking, false);
    assert.equal(controller.state, "failed");
});

test("stale speech is cancelled, and shutdown cannot release a recording continuation", async () => {
    const { controller, synth } = harness();
    const stale = controller.speak("wake");
    const current = controller.speak("business");
    assert.equal(await stale, false);
    assert.equal(controller.state, "speaking");
    controller.cancel();
    assert.equal(await current, false);
    assert.equal(synth.speaking, false);
    assert.equal(controller.state, "idle");
});
