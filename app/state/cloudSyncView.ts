export type CloudRecord = {
    userId: string;
    schemaVersion: number;
    data: unknown;
    revision: number | string;
    createdAt: string;
    updatedAt: string;
};

export type SyncPhase =
    | "idle"
    | "signed-out"
    | "checking"
    | "migration"
    | "ready"
    | "syncing"
    | "synced"
    | "offline"
    | "conflict"
    | "error";

export type DecisionKind = "upload-local" | "restore-cloud" | "both";

export type CloudSyncView = {
    phase: SyncPhase;
    email: string | null;
    userId: string | null;
    decision: DecisionKind | null;
    local: {
        hasData: boolean;
        lastChangedAt: string | null;
        goals: number;
        habits: number;
        trades: number;
        projects: number;
    } | null;
    cloud: CloudRecord | null;
    revision: string | null;
    lastSyncedAt: string | null;
    pendingChanges: boolean;
    message: string | null;
    error: string | null;
};

export type CloudSyncAction = "upload-local" | "restore-cloud" | "use-cloud" | "load-latest" | "cancel" | "sync";

const initialView: CloudSyncView = {
    phase: "idle",
    email: null,
    userId: null,
    decision: null,
    local: null,
    cloud: null,
    revision: null,
    lastSyncedAt: null,
    pendingChanges: false,
    message: null,
    error: null,
};

export let currentCloudSyncView = initialView;
const listeners = new Set<() => void>();
let actionHandler: ((action: CloudSyncAction) => Promise<void>) | null = null;

export function publishCloudSyncView(next: CloudSyncView): void {
    currentCloudSyncView = next;
    listeners.forEach((listener) => listener());
}

export function subscribeCloudSync(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getCloudSyncSnapshot(): CloudSyncView {
    return currentCloudSyncView;
}

export function getCloudSyncServerSnapshot(): CloudSyncView {
    return initialView;
}

export function registerCloudSyncActions(handler: (action: CloudSyncAction) => Promise<void>): () => void {
    actionHandler = handler;
    return () => {
        if (actionHandler === handler) actionHandler = null;
    };
}

export async function performCloudSyncAction(action: CloudSyncAction): Promise<void> {
    if (actionHandler) await actionHandler(action);
}
