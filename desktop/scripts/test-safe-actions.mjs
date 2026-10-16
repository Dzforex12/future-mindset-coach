import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");
const require = createRequire(import.meta.url);
const capabilities = require(path.join(repositoryRoot, "desktop", ".build", "action-capabilities.js"));

function read(relativePath) {
    return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function createHarness({ proposal = true } = {}) {
    const elements = new Map();
    const element = (selector) => {
        if (!elements.has(selector)) {
            elements.set(selector, {
                hidden: !["#transcript-panel", "#coach-ask-panel"].includes(selector),
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

    const calls = { prepare: 0, approve: 0, cancel: 0, navigation: 0 };
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
                async cancelCommand() { return true; },
                async completeVoiceFlow() { return true; },
                async askCoach() { return { ok: false, code: "unused", error: "unused" }; },
                async prepareAction() {
                    calls.prepare++;
                    return proposal
                        ? { ok: true, kind: "proposal", proposalId: "proposal-1", confirmation: "Open your Goals page?", expiresAt: Date.now() + 60000 }
                        : { ok: true, kind: "no_action" };
                },
                async approveAction() {
                    calls.approve++;
                    calls.navigation++;
                    return { ok: true, message: "Opened your Goals page." };
                },
                async cancelAction() {
                    calls.cancel++;
                    return true;
                },
                async openCoach() {},
                async enableWake() {},
                async disableWake() {},
                async requestMicrophone() { return false; },
                async completeMicrophoneRequest() { return true; },
                async transcribeAudio() { return { ok: false, error: "unused" }; },
                async sendTranscriptToCoach() { return false; },
            },
        },
        SpeechSynthesisUtterance: class { constructor() {} },
        DOMException,
    };
    vm.createContext(context);
    vm.runInContext(read("desktop/.build/renderer/local-speech.js"), context);
    vm.runInContext(`${read("desktop/.build/renderer/renderer.js")}\nglobalThis.safeActionTest = { reviewCommand };`, context);

    return { context, element, calls };
}

test("navigation capability accepts only the fixed route enum", () => {
    assert.equal(capabilities.isAllowedAppRoute("/goals"), true);
    assert.equal(capabilities.isAllowedAppRoute("/dashboard"), true);
    for (const value of [
        "https://google.com",
        "file:///C:/Windows",
        "javascript:alert(1)",
        "data:text/html,hello",
        "/goals?admin=true",
        "/goals#section",
        "../settings",
        "/settings/profile",
        "RUN_SHELL",
    ]) {
        assert.equal(capabilities.isAllowedAppRoute(value), false, value);
    }
    assert.equal(capabilities.getActionConfirmation("/goals"), "Open your Goals page?");
});

test("planner contract is authenticated and strictly parsed", () => {
    const source = read("app/api/desktop/actions/plan/route.ts");
    assert.match(source, /export async function POST/);
    assert.match(source, /getUserAppState\(\)/);
    assert.match(source, /parseNavigationPlan/);
    assert.match(source, /response_format/);
    assert.match(source, /Object\.keys/);
    assert.doesNotMatch(source, /user_id\s*:/);
    assert.doesNotMatch(source, /shell\s*\(|spawn\s*\(|process\.exec|process\.spawn/i);
});

test("non-command transcript shows an action proposal without navigating before approval", async () => {
    const harness = createHarness();
    const transcript = harness.element("#transcript");
    transcript.value = "Take me to my goals";
    await harness.context.safeActionTest.reviewCommand();

    assert.equal(harness.element("#coach-ask-panel").hidden, false);
    const prepare = harness.element("#prepare-action").listeners.get("click");
    await prepare();
    assert.equal(harness.calls.prepare, 1);
    assert.equal(harness.calls.navigation, 0);
    assert.equal(harness.element("#action-proposal-panel").hidden, false);
    assert.equal(harness.element("#action-confirmation").textContent, "Open your Goals page?");

    await harness.element("#approve-action").listeners.get("click")();
    assert.equal(harness.calls.approve, 1);
    assert.equal(harness.calls.navigation, 1);
    await harness.element("#approve-action").listeners.get("click")();
    assert.equal(harness.calls.approve, 1, "second approval is rejected before IPC");
    assert.equal(harness.calls.navigation, 1, "second approval cannot navigate twice");
});

test("cancel invalidates a proposal without navigation", async () => {
    const harness = createHarness();
    harness.element("#transcript").value = "Take me to my goals";
    await harness.context.safeActionTest.reviewCommand();
    await harness.element("#prepare-action").listeners.get("click")();
    await harness.element("#cancel-action").listeners.get("click")();
    assert.equal(harness.calls.cancel, 1);
    assert.equal(harness.calls.navigation, 0);
    assert.equal(harness.element("#action-proposal-panel").hidden, true);
});

test("main owns expiry, consumption, and stale proposal checks", () => {
    const source = read("desktop/src/main.ts");
    assert.match(source, /ACTION_PROPOSAL_TTL_MS = 60_000/);
    assert.match(source, /pendingActionProposal/);
    assert.match(source, /expirePendingActionProposal/);
    assert.match(source, /proposal\.consumed = true/);
    assert.match(source, /proposal\.id !== proposalId/);
    assert.match(source, /openCoachWindow\(proposal\.route\)/);
    assert.match(source, /ipcMain\.handle\("action:approve"/);
    assert.match(source, /clearPendingActionProposal\(\)/);
});

test("AI text remains informational and cannot enter the deterministic command path", () => {
    const renderer = read("desktop/src/renderer/renderer.ts");
    assert.match(renderer, /window\.coachDesktop\.prepareAction/);
    assert.match(renderer, /window\.coachDesktop\.approveAction/);
    assert.doesNotMatch(renderer, /prepareCommand\(result\.response/);
    assert.doesNotMatch(renderer, /approveAction\([^)]*route/);
});
