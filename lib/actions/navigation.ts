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

export function getAppRouteLabel(route: AppRoute): string {
    return ROUTE_LABELS[route];
}

export function getAppRouteConfirmation(route: AppRoute): string {
    return route === "/dashboard"
        ? "Open your Dashboard?"
        : `Open your ${getAppRouteLabel(route)} page?`;
}

export function getAppRouteResult(route: AppRoute): string {
    return route === "/dashboard"
        ? "Opened your Dashboard."
        : `Opened your ${getAppRouteLabel(route)} page.`;
}

export type NavigationPlan =
    | { kind: "no_action" }
    | { kind: "proposal"; action: { capability: "NAVIGATE_APP_PAGE"; route: AppRoute } };

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
    const actual = Object.keys(value).sort();
    return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

export function parseNavigationPlan(value: unknown): NavigationPlan | null {
    if (!isRecord(value) || typeof value.kind !== "string") return null;
    if (value.kind === "no_action") {
        return hasExactKeys(value, ["kind"]) ? { kind: "no_action" } : null;
    }
    if (value.kind !== "proposal" || !hasExactKeys(value, ["kind", "action"]) || !isRecord(value.action)) return null;
    if (!hasExactKeys(value.action, ["capability", "route"]) || value.action.capability !== "NAVIGATE_APP_PAGE" || !isAllowedAppRoute(value.action.route)) {
        return null;
    }
    return { kind: "proposal", action: { capability: "NAVIGATE_APP_PAGE", route: value.action.route } };
}
