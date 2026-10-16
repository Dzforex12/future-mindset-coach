export const APP_ROUTES = [
    "/dashboard",
    "/today",
    "/mindset",
    "/goals",
    "/habits",
    "/trading",
    "/summary",
    "/business",
    "/projects",
    "/finances",
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];

const ROUTE_LABELS: Record<AppRoute, string> = {
    "/dashboard": "Dashboard",
    "/today": "Today",
    "/mindset": "Mindset",
    "/goals": "Goals",
    "/habits": "Habits",
    "/trading": "Trading",
    "/summary": "Summary",
    "/business": "Business",
    "/projects": "Projects",
    "/finances": "Finances",
};

export function isAllowedAppRoute(value: unknown): value is AppRoute {
    return typeof value === "string" && (APP_ROUTES as readonly string[]).includes(value);
}

export function getActionConfirmation(route: AppRoute): string {
    return route === "/dashboard"
        ? "Open your Dashboard?"
        : `Open your ${ROUTE_LABELS[route]} page?`;
}

export function getActionResult(route: AppRoute): string {
    return route === "/dashboard"
        ? "Opened your Dashboard."
        : `Opened your ${ROUTE_LABELS[route]} page.`;
}
