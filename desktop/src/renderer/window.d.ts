export {};

declare global {
    type WakeStatus = {
        enabled: boolean;
        state: "off" | "starting" | "listening" | "detected" | "handoff" | "paused" | "error";
        microphoneActive: boolean;
        message: string;
        handoffId?: string;
    };

    interface Window {
        coachDesktop: {
            openCoach: () => Promise<void>;
            openRoute: (route: string) => Promise<boolean>;
            goHome: () => Promise<void>;
            enableWake: () => Promise<WakeStatus | null>;
            disableWake: () => Promise<WakeStatus | null>;
            getWakeStatus: () => Promise<WakeStatus | null>;
            onWakeStatus: (callback: (status: WakeStatus) => void) => () => void;
            requestMicrophone: () => Promise<boolean>;
            completeMicrophoneRequest: () => Promise<boolean>;
            completeVoiceFlow: () => Promise<boolean>;
            transcribeAudio: (request: {
                audioData: Uint8Array;
                mimeType: string;
                languageMode: "en" | "it" | "sq-standard" | "sq-kosovo";
            }) => Promise<
                | { ok: true; transcript: string }
                | { ok: false; error: string }
            >;
            sendTranscriptToCoach: (transcript: string) => Promise<boolean>;
        };
    }
}
