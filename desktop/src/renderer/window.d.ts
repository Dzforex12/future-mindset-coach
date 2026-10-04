export {};

declare global {
    interface Window {
        coachDesktop: {
            openCoach: () => Promise<void>;
        };
    }
}
