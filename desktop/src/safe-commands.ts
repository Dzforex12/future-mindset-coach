const DESTINATIONS = {
    dashboard: "Dashboard",
    today: "Today",
    mindset: "Mindset",
    goals: "Goals",
    habits: "Habits",
    trading: "Trading",
    summary: "Summary",
    business: "Business",
    projects: "Projects",
    finances: "Finances",
} as const;

export function recognizeSafeCommand(value: unknown): { label: string; route: string; response: keyof typeof DESTINATIONS } | null {
    if (typeof value !== "string" || value.length > 5000) return null;
    const normalized = value.toLowerCase()
        .replace(/[.,!?;:'"()[\]]/gu, " ")
        .trim().replace(/\s+/gu, " ");
    const match = /^(?:open|show) (?:my )?([a-z]+)$/u.exec(normalized);
    if (!match || !Object.hasOwn(DESTINATIONS, match[1])) return null;
    const destination = match[1] as keyof typeof DESTINATIONS;
    return { label: `Open ${DESTINATIONS[destination]}`, route: `/${destination}`, response: destination };
}
