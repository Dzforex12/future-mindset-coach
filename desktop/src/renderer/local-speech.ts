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

const MAX_COACH_SPEECH_CHARACTERS = 900;
const LONG_RESPONSE_SUFFIX = "I've put the full answer on screen.";
type VoiceLanguageMode = "en" | "it" | "sq-standard" | "sq-kosovo";

function decodeSpeechEntities(text: string): string {
    const named: Record<string, string> = {
        amp: "&",
        apos: "'",
        gt: ">",
        lt: "<",
        nbsp: " ",
        quot: '"',
    };
    return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/giu, (match: string, entity: string) => {
        const lower = entity.toLowerCase();
        if (lower in named) return named[lower];
        if (lower.startsWith("#x")) {
            const codePoint = Number.parseInt(lower.slice(2), 16);
            return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
                ? String.fromCodePoint(codePoint)
                : match;
        }
        if (lower.startsWith("#")) {
            const codePoint = Number.parseInt(lower.slice(1), 10);
            return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
                ? String.fromCodePoint(codePoint)
                : match;
        }
        return match;
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Called by renderer.ts through the preceding classic script.
function cleanCoachTextForSpeech(text: string): string {
    const cleanedLines = text
        .replace(/\r\n?/g, "\n")
        .replace(/```[^\n]*\n?/g, "")
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/^\s{0,3}#{1,6}\s*/gmu, "")
        .replace(/^\s*[-*+]\s+/gmu, "")
        .replace(/^\s*\d+[.)]\s+/gmu, "")
        .replace(/<[^>]*>/g, "")
        .replace(/[\\*_~`]/g, "")
        .split("\n")
        .map((line) => decodeSpeechEntities(line).trim())
        .filter(Boolean);

    return cleanedLines
        .join(". ")
        .replace(/\s+/g, " ")
        .replace(/([.!?])\.+(?=\s|$)/g, "$1")
        .replace(/([.!?])\s+\./g, "$1")
        .trim();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Called by renderer.ts through the preceding classic script.
function boundCoachSpeechText(text: string, maximum = MAX_COACH_SPEECH_CHARACTERS): string {
    if (text.length <= maximum) return text;

    const bodyLimit = Math.max(80, maximum - LONG_RESPONSE_SUFFIX.length - 1);
    const candidate = text.slice(0, bodyLimit);
    const sentenceEnd = [...candidate.matchAll(/[.!?](?=\s|$)/g)].at(-1)?.index;
    const lastWhitespace = candidate.lastIndexOf(" ");
    const cutAt = sentenceEnd !== undefined
        ? sentenceEnd + 1
        : lastWhitespace > 0
            ? lastWhitespace
            : bodyLimit;
    const body = text.slice(0, cutAt).trim().replace(/[,:;]$/, "");
    const punctuated = /[.!?]$/.test(body) ? body : `${body}.`;
    return `${punctuated} ${LONG_RESPONSE_SUFFIX}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Shared with renderer.ts through a preceding classic script.
class LocalVoiceResponses {
    private stop: (() => void) | null = null;
    private activePromise: Promise<boolean> | null = null;
    private generation = 0;
    state: "idle" | "speaking" | "failed" = "idle";

    constructor(private readonly changed: (state: "idle" | "speaking" | "failed", message: string) => void) {}

    cancel(): Promise<boolean> {
        this.generation++;
        this.stop?.();
        window.speechSynthesis?.cancel();
        return this.activePromise ?? Promise.resolve(false);
    }

    speak(response: unknown): Promise<boolean> {
        this.cancel();
        if (typeof response !== "string" || !Object.hasOwn(FIXED_RESPONSES, response)) return Promise.resolve(false);
        const phrase = FIXED_RESPONSES[response as keyof typeof FIXED_RESPONSES];
        return this.speakPhrase(phrase, "en", phrase);
    }

    speakText(text: string, languageMode: VoiceLanguageMode): Promise<boolean> {
        this.cancel();
        if (!text.trim()) return Promise.resolve(false);
        return this.speakPhrase(text, languageMode, "Coach response");
    }

    private speakPhrase(phrase: string, languageMode: VoiceLanguageMode, statusLabel: string): Promise<boolean> {
        const generation = this.generation;
        const synth = window.speechSynthesis;
        if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
            this.state = "failed";
            this.changed(this.state, "Local speech is unavailable. Continuing without voice.");
            return Promise.resolve(true);
        }

        this.state = "speaking";
        this.changed(this.state, statusLabel === phrase ? `Speaking... "${phrase}"` : "Speaking... Coach response");
        const promise = new Promise<boolean>((resolve) => {
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
                const languagePattern = languageMode === "it"
                    ? /^it(?:[-_]|$)/iu
                    : languageMode === "sq-standard" || languageMode === "sq-kosovo"
                        ? /^sq(?:[-_]|$)/iu
                        : /^en(?:[-_]|$)/iu;
                const voice = local.find((item) => languagePattern.test(item.lang))
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
        this.activePromise = promise;
        return promise.finally(() => {
            if (this.activePromise === promise) this.activePromise = null;
        });
    }
}
