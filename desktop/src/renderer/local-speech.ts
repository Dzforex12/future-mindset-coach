const FIXED_RESPONSES = {
    wake: "I'm listening.",
    dashboard: "Opening your dashboard.",
    today: "Opening today.",
    mindset: "Opening your mindset.",
    goals: "Opening your goals.",
    habits: "Opening your habits.",
    trading: "Opening trading.",
    summary: "Opening your summary.",
    business: "Opening your business.",
    projects: "Opening your projects.",
    finances: "Opening your finances.",
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Shared with renderer.ts through a preceding classic script.
class LocalVoiceResponses {
    private stop: (() => void) | null = null;
    private generation = 0;
    state: "idle" | "speaking" | "failed" = "idle";

    constructor(private readonly changed: (state: "idle" | "speaking" | "failed", message: string) => void) {}

    cancel() {
        this.generation++;
        this.stop?.();
        window.speechSynthesis?.cancel();
    }

    speak(response: unknown): Promise<boolean> {
        this.cancel();
        const generation = this.generation;
        const synth = window.speechSynthesis;
        if (typeof response !== "string" || !Object.hasOwn(FIXED_RESPONSES, response)) return Promise.resolve(false);
        const phrase = FIXED_RESPONSES[response as keyof typeof FIXED_RESPONSES];
        if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
            this.state = "failed";
            this.changed(this.state, "Local speech is unavailable. Continuing without voice.");
            return Promise.resolve(true);
        }

        this.state = "speaking";
        this.changed(this.state, `Speaking... "${phrase}"`);
        return new Promise((resolve) => {
            let settled = false;
            let utterance: SpeechSynthesisUtterance | null = null;
            let timer: number | undefined;
            const finish = (failed: boolean, cancelled = false) => {
                if (settled) return;
                settled = true;
                window.clearTimeout(timer);
                synth.removeEventListener("voiceschanged", start);
                if (utterance) { utterance.onend = null; utterance.onerror = null; }
                this.stop = null;
                synth.cancel();
                this.state = failed ? "failed" : "idle";
                this.changed(this.state, failed ? "Local speech failed. Continuing without voice." : "");
                // Allow the output buffer to drain before handing either microphone back.
                window.setTimeout(() => {
                    if (generation !== this.generation) { resolve(false); return; }
                    const safe = !synth.speaking && !synth.pending;
                    if (!safe) {
                        this.state = "failed";
                        this.changed(this.state, "Speech could not stop. Microphone remains paused. Restart Agent Home.");
                    }
                    resolve(safe && !cancelled);
                }, utterance ? 150 : 0);
            };
            const start = () => {
                if (settled || utterance) return;
                const local = synth.getVoices().filter((voice) => voice.localService);
                const voice = local.find((item) => /^en(?:[-_]|$)/iu.test(item.lang))
                    ?? local.find((item) => item.default) ?? local[0];
                if (!voice) return;
                window.clearTimeout(timer);
                utterance = new SpeechSynthesisUtterance(phrase);
                utterance.voice = voice;
                utterance.lang = voice.lang;
                utterance.rate = 1;
                utterance.pitch = 1;
                utterance.volume = 1;
                utterance.onend = () => finish(false);
                utterance.onerror = () => finish(true);
                timer = window.setTimeout(() => finish(true), 10_000);
                try { synth.speak(utterance); } catch { finish(true); }
            };
            this.stop = () => finish(false, true);
            synth.addEventListener("voiceschanged", start);
            // Never fall back to a remote or unverified default voice.
            timer = window.setTimeout(() => finish(true), 1000);
            try { start(); } catch { finish(true); }
        });
    }
}
