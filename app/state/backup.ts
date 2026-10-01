import { getStorage } from "./persistence";

export const SUPPORTED_BACKUP_KEYS = [
    "future-mindset-memory",
    "future-mindset-goals",
    "future-mindset-habits",
    "future-mindset-streak",
    "future-mindset-trading-journal",
    "future-mindset-trading-rules",
    "future-mindset-pretrade-checklist",
    "future-mindset-daily-checkin",
    "future-mindset-chat",
    "future-mindset-business",
    "future-mindset-projects",
    "future-mindset-finances",
    "future-mindset-notification-read",
] as const;

export type SupportedBackupKey = (typeof SUPPORTED_BACKUP_KEYS)[number];
export type BackupData = Partial<Record<SupportedBackupKey, unknown>>;

export type BackupPayload = {
    app: "Future Mindset Coach";
    backupVersion: 1;
    exportedAt: string;
    data: BackupData;
};

export type StorageSnapshot = Record<SupportedBackupKey, string | null>;

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidDataValue(key: SupportedBackupKey, value: unknown): boolean {
    if (
        key === "future-mindset-memory" ||
        key === "future-mindset-streak" ||
        key === "future-mindset-business" ||
        key === "future-mindset-projects" ||
        key === "future-mindset-finances"
    ) {
        return isObject(value) || Array.isArray(value);
    }

    return Array.isArray(value);
}

export function createBackupPayload(): BackupPayload {
    const storage = getStorage();
    const data: BackupData = {};

    SUPPORTED_BACKUP_KEYS.forEach((key) => {
        const rawValue = storage?.getItem(key);
        if (!rawValue) return;

        try {
            data[key] = JSON.parse(rawValue);
        } catch {
            // Skip malformed existing values instead of putting invalid JSON in a backup.
        }
    });

    return {
        app: "Future Mindset Coach",
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
        data,
    };
}

export function validateBackupPayload(value: unknown): { valid: true; payload: BackupPayload } | { valid: false; error: string } {
    if (!isObject(value)) {
        return { valid: false, error: "Backup must contain a JSON object." };
    }

    if (value.app !== "Future Mindset Coach") {
        return { valid: false, error: "This file is not a Future Mindset Coach backup." };
    }

    if (value.backupVersion !== 1) {
        return { valid: false, error: "This backup version is not supported." };
    }

    if (!isObject(value.data)) {
        return { valid: false, error: "Backup data is missing or invalid." };
    }

    for (const key of SUPPORTED_BACKUP_KEYS) {
        if (key in value.data && !isValidDataValue(key, value.data[key])) {
            return { valid: false, error: `Backup data for ${key} has an invalid format.` };
        }
    }

    return {
        valid: true,
        payload: {
            app: "Future Mindset Coach",
            backupVersion: 1,
            exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : "",
            data: value.data as BackupData,
        },
    };
}

export function readSupportedStorage(): StorageSnapshot {
    const storage = getStorage();
    return SUPPORTED_BACKUP_KEYS.reduce((snapshot, key) => {
        snapshot[key] = storage?.getItem(key) ?? null;
        return snapshot;
    }, {} as StorageSnapshot);
}

function restoreStorageSnapshot(snapshot: StorageSnapshot): void {
    const storage = getStorage();
    SUPPORTED_BACKUP_KEYS.forEach((key) => {
        const value = snapshot[key];
        if (value === null) {
            storage?.removeItem(key);
        } else {
            storage?.setItem(key, value);
        }
    });
}

export function restoreBackup(payload: BackupPayload): void {
    const storage = getStorage();
    const before = readSupportedStorage();

    try {
        SUPPORTED_BACKUP_KEYS.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(payload.data, key)) {
                storage?.setItem(key, JSON.stringify(payload.data[key]));
            } else {
                storage?.removeItem(key);
            }
        });
    } catch (error) {
        try {
            restoreStorageSnapshot(before);
        } catch {
            // Preserve the original failure for the UI.
        }
        throw error instanceof Error ? error : new Error("Backup restore failed.");
    }
}