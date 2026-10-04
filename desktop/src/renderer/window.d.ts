export {};

declare global {
    interface Window {
        coachDesktop: {
            openCoach: () => Promise<void>;
            openRoute: (route: string) => Promise<boolean>;
            goHome: () => Promise<void>;
        };
    }
}
