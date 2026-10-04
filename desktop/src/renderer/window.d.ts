export {};

declare global {
    interface Window {
        coachDesktop: {
            openCoach: () => Promise<void>;
            openRoute: (route: string) => Promise<boolean>;
            goHome: () => Promise<void>;
            requestMicrophone: () => Promise<boolean>;
            completeMicrophoneRequest: () => Promise<boolean>;
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
